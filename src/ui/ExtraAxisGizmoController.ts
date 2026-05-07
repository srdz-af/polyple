import type { RotND } from '../RotND';
import { AXIS_PALETTE } from '../constants';
import type { AxisMap } from '../geometry/projectionUtils';
import {
  axisLabel,
  EXTRA_AXIS_AUTO_ROTATE_SPEED,
  EXTRA_GIZMO_BASE_ANGLE,
  extraAxisGizmoCenter,
  extraAxisGizmoRadius,
  GIZMO_VIEWBOX_SIZE,
  normalizeSignedAngleDelta,
  pointerAngleInExtraAxisGizmo,
} from './axisGizmoShared';

type ExtraAxisParams = {
  axesX: number;
  axesY: number;
  axesZ: number;
};

type ExtraAxisGizmoPlane = {
  planeAxis: number;
  depthDim: number;
};

type ExtraAxisGizmoUI = {
  root: HTMLDivElement;
  line: SVGLineElement;
  negButton: HTMLButtonElement;
  posButton: HTMLButtonElement;
  autoToggleButton: HTMLButtonElement;
  perspectiveToggleButton: HTMLButtonElement;
  orderHandleButton: HTMLButtonElement;
};

const AUTO_ROTATE_SPEED_MULTIPLIERS = [0, 1, 2, 3] as const;
const AUTO_ROTATE_BUTTON_ICONS = ['play_arrow', 'speed_1_5x', 'speed_2x', 'stop'] as const;
const AUTO_ROTATE_BUTTON_ACTIONS = [
  'Start auto-rotate',
  'Set auto-rotate 1.5x',
  'Set auto-rotate 2x',
  'Stop auto-rotate',
] as const;

type ExtraAxisGizmoControllerOptions = {
  rootEl: HTMLDivElement | null;
  getVisibleDims: () => number;
  getAxesOrder: () => number[];
  getAxesOffset: () => number;
  getParams: () => ExtraAxisParams;
  getRot: () => RotND;
  applySceneBackground: () => void;
  projectAndRenderAll: () => void;
  reorderExtraAxes: (orderedExtraDims: number[]) => void;
  updateProjectedAxisDropTarget: (clientX: number, clientY: number, ghostRect: DOMRectReadOnly | null) => void;
  takeProjectedAxisDropTarget: () => 0 | 1 | 2 | null;
  clearProjectedAxisDropTarget: () => void;
  swapExtraAxisWithProjection: (depthDim: number, targetSlot: 0 | 1 | 2) => void;
};

type ExtraAxisOrderDragState = {
  pointerId: number;
  startX: number;
  startY: number;
  grabOffsetX: number;
  grabOffsetY: number;
  lastX: number;
  lastY: number;
  active: boolean;
  sourceDim: number;
  source: HTMLDivElement | null;
  placeholder: HTMLDivElement | null;
  ghost: HTMLDivElement | null;
};

export class ExtraAxisGizmoController {
  private readonly uis = new Map<number, ExtraAxisGizmoUI>();
  private readonly angles = new Map<number, number>();
  private readonly anglePlaneKeys = new Map<number, string>();
  private readonly selectedPerspectiveDims = new Set<number>([3]);
  private readonly autoRotateSpeeds = new Map<number, number>();
  private readonly pausedAutoRotateSpeeds = new Map<number, number>();
  private readonly drag = {
    active: false,
    moved: false,
    pointerId: -1,
    lastAngle: 0,
    planeAxis: -1,
    depthAxis: -1,
    target: null as HTMLDivElement | null,
  };
  private readonly orderDrag: ExtraAxisOrderDragState = {
    pointerId: -1,
    startX: 0,
    startY: 0,
    grabOffsetX: 0,
    grabOffsetY: 0,
    lastX: 0,
    lastY: 0,
    active: false,
    sourceDim: -1,
    source: null,
    placeholder: null,
    ghost: null,
  };
  private readonly scrollBarEl = document.getElementById('extra-axis-scrollbar') as HTMLDivElement | null;
  private readonly scrollThumbEl = document.getElementById('extra-axis-scrollbar-thumb') as HTMLDivElement | null;
  private readonly scrollDrag = {
    pointerId: -1,
    startX: 0,
    startScrollLeft: 0,
    maxScroll: 0,
    trackTravel: 0,
  };
  private readonly orderAutoScroll = {
    frame: 0,
    lastTs: 0,
  };
  private readonly handleOrderPointerMove = (ev: PointerEvent) => {
    if (ev.pointerId !== this.orderDrag.pointerId || !this.orderDrag.source) return;
    ev.preventDefault();
    this.orderDrag.lastX = ev.clientX;
    this.orderDrag.lastY = ev.clientY;
    if (!this.orderDrag.active) {
      const dx = ev.clientX - this.orderDrag.startX;
      const dy = ev.clientY - this.orderDrag.startY;
      if ((dx * dx) + (dy * dy) < 16) return;
      this.beginOrderDragPreview(ev);
      return;
    }
    this.updateOrderGhostPosition(ev.clientX, ev.clientY);
    this.updateProjectedAxisDropTarget(ev.clientX, ev.clientY);
    this.updateOrderPlaceholder(ev.clientX, ev.clientY);
    this.updateOrderAutoScroll(ev.clientX);
  };
  private readonly stepOrderAutoScroll = (ts: number) => {
    this.orderAutoScroll.frame = 0;
    if (!this.options.rootEl || !this.orderDrag.active) return;

    const direction = this.orderAutoScrollDirection(this.orderDrag.lastX);
    if (direction === 0) return;

    const dt = Math.min(40, Math.max(0, ts - (this.orderAutoScroll.lastTs || ts)));
    this.orderAutoScroll.lastTs = ts;
    const maxScroll = Math.max(0, this.options.rootEl.scrollWidth - this.options.rootEl.clientWidth);
    this.options.rootEl.scrollLeft = clamp(
      this.options.rootEl.scrollLeft + (direction * dt * 0.85),
      0,
      maxScroll,
    );
    this.syncScrollIndicator();
    this.updateProjectedAxisDropTarget(this.orderDrag.lastX, this.orderDrag.lastY);
    this.updateOrderPlaceholder(this.orderDrag.lastX, this.orderDrag.lastY);
    this.orderAutoScroll.frame = requestAnimationFrame(this.stepOrderAutoScroll);
  };
  private readonly handleOrderPointerUp = (ev: PointerEvent) => {
    if (ev.pointerId !== this.orderDrag.pointerId) return;
    if (this.orderDrag.active) this.updateProjectedAxisDropTarget(ev.clientX, ev.clientY);
    this.endOrderDrag(true);
  };
  private readonly handleOrderPointerCancel = (ev: PointerEvent) => {
    if (ev.pointerId !== this.orderDrag.pointerId) return;
    this.endOrderDrag(false);
  };
  private readonly handleBandScroll = () => this.syncScrollIndicator();
  private readonly handleScrollBarPointerDown = (ev: PointerEvent) => {
    if (ev.button !== 0) return;
    const metrics = this.scrollMetrics();
    if (!metrics) return;
    ev.preventDefault();
    ev.stopPropagation();

    const target = ev.target as Node | null;
    if (target && !this.scrollThumbEl?.contains(target)) {
      const centeredX = ev.clientX - metrics.trackStart - (metrics.thumbWidth * 0.5);
      this.options.rootEl!.scrollLeft = clamp(
        (centeredX / metrics.trackTravel) * metrics.maxScroll,
        0,
        metrics.maxScroll,
      );
    }

    const nextMetrics = this.scrollMetrics();
    if (!nextMetrics) return;
    this.scrollDrag.pointerId = ev.pointerId;
    this.scrollDrag.startX = ev.clientX;
    this.scrollDrag.startScrollLeft = this.options.rootEl!.scrollLeft;
    this.scrollDrag.maxScroll = nextMetrics.maxScroll;
    this.scrollDrag.trackTravel = nextMetrics.trackTravel;
    window.addEventListener('pointermove', this.handleScrollBarPointerMove, { passive: false });
    window.addEventListener('pointerup', this.handleScrollBarPointerUp);
    window.addEventListener('pointercancel', this.handleScrollBarPointerUp);
  };
  private readonly handleScrollBarPointerMove = (ev: PointerEvent) => {
    if (ev.pointerId !== this.scrollDrag.pointerId || !this.options.rootEl) return;
    ev.preventDefault();
    const dx = ev.clientX - this.scrollDrag.startX;
    this.options.rootEl.scrollLeft = clamp(
      this.scrollDrag.startScrollLeft + ((dx / this.scrollDrag.trackTravel) * this.scrollDrag.maxScroll),
      0,
      this.scrollDrag.maxScroll,
    );
  };
  private readonly handleScrollBarPointerUp = (ev: PointerEvent) => {
    if (ev.pointerId !== this.scrollDrag.pointerId) return;
    window.removeEventListener('pointermove', this.handleScrollBarPointerMove);
    window.removeEventListener('pointerup', this.handleScrollBarPointerUp);
    window.removeEventListener('pointercancel', this.handleScrollBarPointerUp);
    this.scrollDrag.pointerId = -1;
  };

  constructor(private readonly options: ExtraAxisGizmoControllerOptions) {
    this.options.rootEl?.addEventListener('scroll', this.handleBandScroll, { passive: true });
    this.scrollBarEl?.addEventListener('pointerdown', this.handleScrollBarPointerDown);
    window.addEventListener('resize', this.handleBandScroll);
    requestAnimationFrame(this.handleBandScroll);
  }

  clearDynamicState() {
    this.autoRotateSpeeds.clear();
    this.pausedAutoRotateSpeeds.clear();
    this.angles.clear();
    this.anglePlaneKeys.clear();
  }

  perspectiveDimsFor(localN: number, axisMap: AxisMap): number[] {
    if (localN < 4) return [];
    const extraSet = new Set(this.currentExtraDims());
    const available = new Set<number>(axisMap.slice(0, localN));
    return Array.from(this.selectedPerspectiveDims).filter(
      dim => extraSet.has(dim) && available.has(dim),
    );
  }

  primaryExtraRotationDepthDim(localN: number, axisMap: AxisMap): number {
    if (localN < 4) return -1;
    const available = new Set<number>(axisMap.slice(0, localN));
    const plane = this.currentPlanes().find(candidate => available.has(candidate.depthDim));
    return plane?.depthDim ?? axisMap[localN - 1] ?? -1;
  }

  applyAutoRotation(dt: number) {
    const gizmoPlanes = this.currentPlanes();
    if (!gizmoPlanes.length || this.autoRotateSpeeds.size === 0) return;

    let rotated = false;
    for (const plane of gizmoPlanes) {
      const speed = this.autoRotateSpeeds.get(plane.depthDim) ?? 0;
      const multiplier = AUTO_ROTATE_SPEED_MULTIPLIERS[speed] ?? 0;
      if (multiplier <= 0) continue;
      if (plane.planeAxis < 0 || plane.planeAxis === plane.depthDim) continue;
      const delta = EXTRA_AXIS_AUTO_ROTATE_SPEED * multiplier * dt;
      this.options.getRot().applyGivensLeft(plane.planeAxis, plane.depthDim, delta);
      this.offsetAngle(plane, delta);
      rotated = true;
    }

    if (!rotated) return;
    this.sync();
    this.options.applySceneBackground();
  }

  toggleActiveAutoRotations() {
    const planes = this.currentPlanes();
    if (!planes.length) return;

    const activePlanes = planes.filter(plane => (this.autoRotateSpeeds.get(plane.depthDim) ?? 0) > 0);
    if (activePlanes.length) {
      this.pausedAutoRotateSpeeds.clear();
      for (const plane of activePlanes) {
        this.pausedAutoRotateSpeeds.set(plane.depthDim, this.autoRotateSpeeds.get(plane.depthDim) ?? 1);
      }
      for (const plane of planes) this.setAutoRotateSpeed(plane.depthDim, 0);
      return;
    }

    const hasPausedSpeed = planes.some(plane => (this.pausedAutoRotateSpeeds.get(plane.depthDim) ?? 0) > 0);
    for (const plane of planes) {
      const speed = hasPausedSpeed ? this.pausedAutoRotateSpeeds.get(plane.depthDim) ?? 0 : 1;
      this.setAutoRotateSpeed(plane.depthDim, speed);
    }
    this.pausedAutoRotateSpeeds.clear();
  }

  syncRotationAngles() {
    const planes = this.currentPlanes();
    if (planes.length < 2) return;

    this.ensureAnglesForPlanes(planes);
    const targetAngle = this.getAngle(planes[0].depthDim);
    let rotated = false;
    for (const plane of planes.slice(1)) {
      if (plane.planeAxis < 0 || plane.planeAxis === plane.depthDim) continue;
      const currentAngle = this.getAngle(plane.depthDim);
      const delta = normalizeSignedAngleDelta(targetAngle - currentAngle);
      this.setAngle(plane, targetAngle);
      if (Math.abs(delta) < 1e-4) continue;
      this.options.getRot().applyGivensLeft(plane.planeAxis, plane.depthDim, delta);
      rotated = true;
    }

    this.sync();
    if (!rotated) return;
    this.options.applySceneBackground();
    this.options.projectAndRenderAll();
  }

  resetRotations() {
    this.options.getRot().reset();
    this.angles.clear();
    this.anglePlaneKeys.clear();
    this.sync();
    this.options.applySceneBackground();
    this.options.projectAndRenderAll();
  }

  sync() {
    if (!this.options.rootEl) return;
    const planes = this.currentPlanes();
    this.ensureAnglesForPlanes(planes);
    const activeDepthDims = new Set(planes.map(plane => plane.depthDim));
    const freezeDomOrder = this.orderDrag.active;

    for (const [depthDim, ui] of this.uis) {
      if (!activeDepthDims.has(depthDim)) {
        if (this.drag.active && this.drag.depthAxis === depthDim) this.resetDragState();
        if (this.orderDrag.sourceDim === depthDim) this.endOrderDrag(false);
        ui.root.remove();
        this.uis.delete(depthDim);
        this.angles.delete(depthDim);
        this.anglePlaneKeys.delete(depthDim);
      }
    }

    for (const plane of planes) {
      let ui = this.uis.get(plane.depthDim);
      if (!ui) {
        ui = this.createUI(plane.depthDim);
        this.uis.set(plane.depthDim, ui);
      }
      if (!freezeDomOrder) {
        this.options.rootEl.appendChild(ui.root);
      } else if (!ui.root.parentElement && ui.root !== this.orderDrag.source) {
        this.options.rootEl.appendChild(ui.root);
      }

      const color = AXIS_PALETTE[plane.depthDim % AXIS_PALETTE.length];
      const depthLabel = axisLabel(plane.depthDim);
      const planeLabel = axisLabel(plane.planeAxis);
      const buttonScale = (ui.root.clientWidth || GIZMO_VIEWBOX_SIZE) / GIZMO_VIEWBOX_SIZE;
      const angle = this.getAngle(plane.depthDim);
      const dx = Math.cos(angle);
      const dy = Math.sin(angle);
      const startX = extraAxisGizmoCenter - dx * extraAxisGizmoRadius;
      const startY = extraAxisGizmoCenter - dy * extraAxisGizmoRadius;
      const endX = extraAxisGizmoCenter + dx * extraAxisGizmoRadius;
      const endY = extraAxisGizmoCenter + dy * extraAxisGizmoRadius;

      ui.root.style.setProperty('--extra-axis-color', color);
      ui.root.title = `Rotate global ${depthLabel} axis (${planeLabel}-${depthLabel} plane)`;
      ui.root.setAttribute('aria-label', ui.root.title);
      ui.root.classList.remove('disabled');
      ui.posButton.disabled = false;
      ui.negButton.disabled = false;
      ui.orderHandleButton.title = `Reorder ${depthLabel} axis`;
      ui.orderHandleButton.setAttribute('aria-label', ui.orderHandleButton.title);
      ui.posButton.textContent = depthLabel;
      ui.posButton.title = `Rotate ${planeLabel}-${depthLabel}`;
      ui.negButton.title = `Rotate ${planeLabel}-${depthLabel}`;
      ui.posButton.setAttribute('aria-label', ui.posButton.title);
      ui.negButton.setAttribute('aria-label', ui.negButton.title);

      ui.line.setAttribute('x1', `${startX}`);
      ui.line.setAttribute('y1', `${startY}`);
      ui.line.setAttribute('x2', `${endX}`);
      ui.line.setAttribute('y2', `${endY}`);
      ui.line.style.opacity = '0.9';

      ui.negButton.style.left = `${startX * buttonScale}px`;
      ui.negButton.style.top = `${startY * buttonScale}px`;
      ui.posButton.style.left = `${endX * buttonScale}px`;
      ui.posButton.style.top = `${endY * buttonScale}px`;
      ui.posButton.classList.remove('back');
      ui.negButton.classList.remove('back');
      ui.posButton.style.zIndex = '2';
      ui.negButton.style.zIndex = '1';
      this.setAutoRotateSpeed(plane.depthDim, this.autoRotateSpeeds.get(plane.depthDim) ?? 0);
      this.setPerspectiveDepth(plane.depthDim, this.selectedPerspectiveDims.has(plane.depthDim));
    }
    this.syncScrollIndicator();
  }

  private currentPlanes(): ExtraAxisGizmoPlane[] {
    const ordered = this.orderedVisibleDims();
    const activeAxes = this.currentActiveDims();
    const extraDims = ordered.filter(dim => !activeAxes.includes(dim));
    if (ordered.length < 2 || activeAxes.length === 0 || extraDims.length === 0) return [];

    const planes: ExtraAxisGizmoPlane[] = [];
    const usedPairs = new Set<string>();
    const pairKey = (a: number, b: number) => (a < b ? `${a}:${b}` : `${b}:${a}`);

    for (let extraIdx = 0; extraIdx < extraDims.length; extraIdx++) {
      const depthDim = extraDims[extraIdx];
      const baseSlot = ((extraIdx % activeAxes.length) + activeAxes.length) % activeAxes.length;
      const candidates: number[] = [];
      for (let offset = 0; offset < activeAxes.length; offset++) {
        const candidate = activeAxes[(baseSlot + offset) % activeAxes.length];
        if (!candidates.includes(candidate)) candidates.push(candidate);
      }
      for (const candidate of ordered) {
        if (!candidates.includes(candidate)) candidates.push(candidate);
      }

      let planeAxis = -1;
      for (const candidate of candidates) {
        if (candidate < 0 || candidate === depthDim) continue;
        const key = pairKey(candidate, depthDim);
        if (usedPairs.has(key)) continue;
        planeAxis = candidate;
        usedPairs.add(key);
        break;
      }

      if (planeAxis < 0) {
        planeAxis = candidates.find(candidate => candidate >= 0 && candidate !== depthDim) ?? -1;
      }
      if (planeAxis < 0 || planeAxis === depthDim) continue;
      usedPairs.add(pairKey(planeAxis, depthDim));
      planes.push({ planeAxis, depthDim });
    }
    return planes;
  }

  private orderedVisibleDims() {
    const nVis = this.options.getVisibleDims();
    const ordered = this.options.getAxesOrder().slice(0, nVis);
    if (nVis <= 0 || ordered.length === 0) return [];
    const offset = (((this.options.getAxesOffset() % nVis) + nVis) % nVis);
    return Array.from({ length: nVis }, (_, idx) => ordered[(offset + idx) % nVis] ?? idx);
  }

  private currentActiveDims() {
    const ordered = this.orderedVisibleDims();
    const active = [this.options.getParams().axesX, this.options.getParams().axesY, this.options.getParams().axesZ];
    return active.filter(dim => ordered.includes(dim));
  }

  private currentExtraDims() {
    const activeSet = new Set(this.currentActiveDims());
    return this.orderedVisibleDims().filter(dim => !activeSet.has(dim));
  }

  private getAngle(depthDim: number) {
    const existing = this.angles.get(depthDim);
    if (typeof existing === 'number') return existing;
    this.angles.set(depthDim, EXTRA_GIZMO_BASE_ANGLE);
    return EXTRA_GIZMO_BASE_ANGLE;
  }

  private ensureAnglesForPlanes(planes = this.currentPlanes()) {
    const rot = this.options.getRot();
    const R = rot.matrix;
    const N = rot.N;
    const activeDepthDims = new Set<number>();
    for (const plane of planes) {
      if (plane.planeAxis < 0 || plane.depthDim < 0 || plane.planeAxis >= N || plane.depthDim >= N) continue;
      activeDepthDims.add(plane.depthDim);
      const key = this.planeKey(plane);
      if (this.angles.has(plane.depthDim) && this.anglePlaneKeys.get(plane.depthDim) === key) continue;
      this.setAngle(plane, this.angleFromRotationMatrix(plane, R, N));
    }
    for (const dim of Array.from(this.angles.keys())) {
      if (activeDepthDims.has(dim)) continue;
      this.angles.delete(dim);
      this.anglePlaneKeys.delete(dim);
    }
  }

  private planeKey(plane: ExtraAxisGizmoPlane) {
    return `${plane.planeAxis}:${plane.depthDim}`;
  }

  private angleFromRotationMatrix(plane: ExtraAxisGizmoPlane, R: Float32Array, N: number) {
    const x = R[plane.planeAxis * N + plane.planeAxis] ?? 1;
    const y = R[plane.depthDim * N + plane.planeAxis] ?? 0;
    return normalizeSignedAngleDelta(EXTRA_GIZMO_BASE_ANGLE + Math.atan2(y, x));
  }

  private setAngle(plane: ExtraAxisGizmoPlane, angle: number) {
    this.angles.set(plane.depthDim, normalizeSignedAngleDelta(angle));
    this.anglePlaneKeys.set(plane.depthDim, this.planeKey(plane));
  }

  private offsetAngle(plane: ExtraAxisGizmoPlane, delta: number) {
    this.setAngle(plane, this.getAngle(plane.depthDim) + delta);
  }

  private setAutoRotateSpeed(depthDim: number, speed: number) {
    const normalizedSpeed = Number.isFinite(speed) ? Math.max(0, Math.min(3, Math.round(speed))) : 0;
    if (normalizedSpeed > 0) this.autoRotateSpeeds.set(depthDim, normalizedSpeed);
    else this.autoRotateSpeeds.delete(depthDim);

    const ui = this.uis.get(depthDim);
    if (!ui) return;

    const active = normalizedSpeed > 0;
    ui.autoToggleButton.classList.toggle('active', active);
    const speedKey = String(normalizedSpeed);
    if (ui.autoToggleButton.dataset.autoSpeed !== speedKey) {
      ui.autoToggleButton.dataset.autoSpeed = speedKey;
      ui.autoToggleButton.replaceChildren();
      const icon = document.createElement('span');
      icon.className = 'material-symbols-rounded';
      icon.setAttribute('aria-hidden', 'true');
      icon.textContent = AUTO_ROTATE_BUTTON_ICONS[normalizedSpeed] ?? AUTO_ROTATE_BUTTON_ICONS[0];
      ui.autoToggleButton.appendChild(icon);
    }
    const label = axisLabel(depthDim);
    const action = AUTO_ROTATE_BUTTON_ACTIONS[normalizedSpeed] ?? AUTO_ROTATE_BUTTON_ACTIONS[0];
    const title = `${action} ${label} axis`;
    ui.autoToggleButton.title = title;
    ui.autoToggleButton.setAttribute('aria-label', title);
    ui.autoToggleButton.setAttribute('aria-pressed', String(active));
  }

  private advanceAutoRotate(depthDim: number) {
    const currentSpeed = this.autoRotateSpeeds.get(depthDim) ?? 0;
    const nextSpeed = currentSpeed >= 3 ? 0 : currentSpeed + 1;
    this.setAutoRotateSpeed(depthDim, nextSpeed);
  }

  private scrollMetrics() {
    const root = this.options.rootEl;
    if (!root || !this.scrollBarEl || !this.scrollThumbEl) return null;
    const maxScroll = root.scrollWidth - root.clientWidth;
    if (maxScroll <= 1) return null;

    const barRect = this.scrollBarEl.getBoundingClientRect();
    const trackInset = 18;
    const trackWidth = Math.max(1, barRect.width - (trackInset * 2));
    const thumbWidth = Math.max(28, Math.min(trackWidth, trackWidth * (root.clientWidth / root.scrollWidth)));
    const trackTravel = Math.max(1, trackWidth - thumbWidth);
    return {
      maxScroll,
      thumbWidth,
      trackTravel,
      trackStart: barRect.left + trackInset,
      trackInset,
    };
  }

  private syncScrollIndicator() {
    const root = this.options.rootEl;
    if (!root || !this.scrollBarEl || !this.scrollThumbEl) return;
    const metrics = this.scrollMetrics();
    if (!metrics) {
      this.scrollBarEl.classList.add('inactive');
      return;
    }

    this.scrollBarEl.classList.remove('inactive');
    const left = metrics.trackInset + ((root.scrollLeft / metrics.maxScroll) * metrics.trackTravel);
    this.scrollThumbEl.style.width = `${metrics.thumbWidth}px`;
    this.scrollThumbEl.style.left = `${left}px`;
  }

  private setPerspectiveDepth(depthDim: number, active: boolean) {
    if (active) this.selectedPerspectiveDims.add(depthDim);
    else this.selectedPerspectiveDims.delete(depthDim);
    const ui = this.uis.get(depthDim);
    if (!ui) return;

    ui.perspectiveToggleButton.classList.toggle('active', active);
    const label = axisLabel(depthDim);
    const action = active ? 'Disable perspective depth' : 'Enable perspective depth';
    const title = `${action} for ${label} axis`;
    ui.perspectiveToggleButton.title = title;
    ui.perspectiveToggleButton.setAttribute('aria-label', title);
    ui.perspectiveToggleButton.setAttribute('aria-pressed', String(active));
  }

  private resetDragState() {
    const target = this.drag.target;
    if (target && this.drag.pointerId >= 0 && target.hasPointerCapture(this.drag.pointerId)) {
      target.releasePointerCapture(this.drag.pointerId);
    }
    target?.classList.remove('dragging');
    this.drag.active = false;
    this.drag.moved = false;
    this.drag.pointerId = -1;
    this.drag.lastAngle = 0;
    this.drag.planeAxis = -1;
    this.drag.depthAxis = -1;
    this.drag.target = null;
  }

  private beginDrag(ev: PointerEvent, plane: ExtraAxisGizmoPlane, gizmoEl: HTMLDivElement) {
    const angle = pointerAngleInExtraAxisGizmo(ev, gizmoEl);
    if (angle == null) return;

    this.drag.active = true;
    this.drag.moved = false;
    this.drag.pointerId = ev.pointerId;
    this.drag.lastAngle = angle;
    this.drag.planeAxis = plane.planeAxis;
    this.drag.depthAxis = plane.depthDim;
    this.drag.target = gizmoEl;
    try {
      gizmoEl.setPointerCapture(ev.pointerId);
    } catch {
      // Some browsers are strict about capture when pointerdown starts on a child.
    }
    gizmoEl.classList.add('dragging');
  }

  private endDrag(ev: PointerEvent) {
    if (ev.pointerId !== this.drag.pointerId) return;
    this.resetDragState();
  }

  private beginOrderHandleDrag(ev: PointerEvent, gizmoEl: HTMLDivElement, depthDim: number) {
    ev.preventDefault();
    ev.stopPropagation();
    if (ev.button !== 0 || this.orderDrag.pointerId !== -1) return;
    if (this.drag.active) this.resetDragState();
    this.orderDrag.pointerId = ev.pointerId;
    this.orderDrag.startX = ev.clientX;
    this.orderDrag.startY = ev.clientY;
    this.orderDrag.lastX = ev.clientX;
    this.orderDrag.lastY = ev.clientY;
    this.orderDrag.sourceDim = depthDim;
    this.orderDrag.source = gizmoEl;
    this.orderDrag.active = false;
    window.addEventListener('pointermove', this.handleOrderPointerMove, { passive: false });
    window.addEventListener('pointerup', this.handleOrderPointerUp);
    window.addEventListener('pointercancel', this.handleOrderPointerCancel);
  }

  private beginOrderDragPreview(ev: PointerEvent) {
    if (!this.options.rootEl || !this.orderDrag.source) return;
    const sourceRect = this.orderDrag.source.getBoundingClientRect();
    this.orderDrag.active = true;
    this.orderDrag.grabOffsetX = ev.clientX - sourceRect.left;
    this.orderDrag.grabOffsetY = ev.clientY - sourceRect.top;
    this.orderDrag.lastX = ev.clientX;
    this.orderDrag.lastY = ev.clientY;

    this.orderDrag.placeholder = document.createElement('div');
    this.orderDrag.placeholder.className = 'extra-axis-drop-placeholder';
    this.orderDrag.placeholder.style.width = `${sourceRect.width}px`;
    this.orderDrag.placeholder.style.height = `${sourceRect.height}px`;
    this.options.rootEl.insertBefore(this.orderDrag.placeholder, this.orderDrag.source.nextSibling);

    this.orderDrag.source.classList.add('extra-axis-order-source');
    this.orderDrag.source.style.display = 'none';

    this.orderDrag.ghost = this.orderDrag.source.cloneNode(true) as HTMLDivElement;
    this.orderDrag.ghost.classList.add('extra-axis-drag-ghost');
    this.orderDrag.ghost.style.display = '';
    this.orderDrag.ghost.style.width = `${sourceRect.width}px`;
    this.orderDrag.ghost.style.height = `${sourceRect.height}px`;
    document.body.appendChild(this.orderDrag.ghost);

    this.options.rootEl.classList.add('dragging');
    document.body.classList.add('extra-axis-order-dragging');
    this.updateOrderGhostPosition(ev.clientX, ev.clientY);
    this.updateProjectedAxisDropTarget(ev.clientX, ev.clientY);
    this.updateOrderPlaceholder(ev.clientX, ev.clientY);
    this.updateOrderAutoScroll(ev.clientX);
  }

  private orderAutoScrollDirection(clientX: number) {
    const root = this.options.rootEl;
    if (!root || !this.orderDrag.active) return 0;
    const maxScroll = root.scrollWidth - root.clientWidth;
    if (maxScroll <= 1) return 0;

    const rect = root.getBoundingClientRect();
    const edge = Math.max(28, Math.min(56, rect.width * 0.22));
    const leftDistance = clientX - rect.left;
    const rightDistance = rect.right - clientX;

    if (leftDistance < edge && root.scrollLeft > 0) {
      return -Math.min(1, Math.max(0.18, (edge - leftDistance) / edge));
    }
    if (rightDistance < edge && root.scrollLeft < maxScroll) {
      return Math.min(1, Math.max(0.18, (edge - rightDistance) / edge));
    }
    return 0;
  }

  private updateOrderAutoScroll(clientX: number) {
    if (this.orderAutoScrollDirection(clientX) === 0) {
      this.stopOrderAutoScroll();
      return;
    }
    if (this.orderAutoScroll.frame) return;
    this.orderAutoScroll.lastTs = performance.now();
    this.orderAutoScroll.frame = requestAnimationFrame(this.stepOrderAutoScroll);
  }

  private stopOrderAutoScroll() {
    if (this.orderAutoScroll.frame) cancelAnimationFrame(this.orderAutoScroll.frame);
    this.orderAutoScroll.frame = 0;
    this.orderAutoScroll.lastTs = 0;
  }

  private updateProjectedAxisDropTarget(clientX: number, clientY: number) {
    this.options.updateProjectedAxisDropTarget(
      clientX,
      clientY,
      this.orderDrag.ghost?.getBoundingClientRect() ?? null,
    );
  }

  private updateOrderPlaceholder(clientX: number, clientY: number) {
    if (!this.options.rootEl || !this.orderDrag.placeholder || !this.orderDrag.source) return;
    const candidates = Array.from(this.options.rootEl.querySelectorAll<HTMLDivElement>('.extra-axis-gizmo'))
      .filter(candidate => candidate !== this.orderDrag.placeholder && candidate !== this.orderDrag.source);
    let beforeEl: HTMLDivElement | null = null;

    for (const candidate of candidates) {
      const rect = candidate.getBoundingClientRect();
      const midX = rect.left + (rect.width * 0.5);
      const midY = rect.top + (rect.height * 0.5);
      const rowTolerance = rect.height * 0.45;
      const beforeByRow = clientY < (midY - rowTolerance);
      const beforeByColumn = Math.abs(clientY - midY) <= rowTolerance && clientX < midX;
      if (beforeByRow || beforeByColumn) {
        beforeEl = candidate;
        break;
      }
    }

    if (beforeEl) this.options.rootEl.insertBefore(this.orderDrag.placeholder, beforeEl);
    else this.options.rootEl.appendChild(this.orderDrag.placeholder);
  }

  private updateOrderGhostPosition(clientX: number, clientY: number) {
    if (!this.orderDrag.ghost) return;
    this.orderDrag.ghost.style.left = `${clientX - this.orderDrag.grabOffsetX}px`;
    this.orderDrag.ghost.style.top = `${clientY - this.orderDrag.grabOffsetY}px`;
  }

  private commitOrderDrag() {
    if (!this.options.rootEl || !this.orderDrag.active || !this.orderDrag.source || !this.orderDrag.placeholder) return;
    const draggedDim = this.orderDrag.sourceDim;
    if (draggedDim < 0) return;

    const orderedDims: number[] = [];
    for (const child of Array.from(this.options.rootEl.children)) {
      if (child === this.orderDrag.source) continue;
      if (child === this.orderDrag.placeholder) {
        orderedDims.push(draggedDim);
        continue;
      }
      const el = child as HTMLElement;
      if (!el.classList.contains('extra-axis-gizmo')) continue;
      const dim = Number(el.dataset.depthDim ?? -1);
      if (dim >= 0) orderedDims.push(dim);
    }

    this.options.reorderExtraAxes(orderedDims);
  }

  private clearOrderDragPreview() {
    if (this.orderDrag.ghost?.parentElement) this.orderDrag.ghost.parentElement.removeChild(this.orderDrag.ghost);
    if (this.orderDrag.placeholder?.parentElement) {
      this.orderDrag.placeholder.parentElement.removeChild(this.orderDrag.placeholder);
    }
    if (this.orderDrag.source) {
      this.orderDrag.source.style.display = '';
      this.orderDrag.source.classList.remove('extra-axis-order-source');
    }
    this.options.rootEl?.classList.remove('dragging');
    document.body.classList.remove('extra-axis-order-dragging');
    this.orderDrag.placeholder = null;
    this.orderDrag.ghost = null;
  }

  private endOrderDrag(commit: boolean) {
    this.stopOrderAutoScroll();
    window.removeEventListener('pointermove', this.handleOrderPointerMove);
    window.removeEventListener('pointerup', this.handleOrderPointerUp);
    window.removeEventListener('pointercancel', this.handleOrderPointerCancel);
    const needsResync = commit && this.orderDrag.active;
    const sourceDim = this.orderDrag.sourceDim;
    const targetSlot = needsResync ? this.options.takeProjectedAxisDropTarget() : null;
    if (!needsResync) this.options.clearProjectedAxisDropTarget();
    if (commit && targetSlot == null) this.commitOrderDrag();
    this.clearOrderDragPreview();
    this.orderDrag.pointerId = -1;
    this.orderDrag.startX = 0;
    this.orderDrag.startY = 0;
    this.orderDrag.grabOffsetX = 0;
    this.orderDrag.grabOffsetY = 0;
    this.orderDrag.lastX = 0;
    this.orderDrag.lastY = 0;
    this.orderDrag.active = false;
    this.orderDrag.sourceDim = -1;
    this.orderDrag.source = null;
    if (targetSlot != null && sourceDim >= 0) {
      this.options.swapExtraAxisWithProjection(sourceDim, targetSlot);
    } else if (needsResync) {
      this.sync();
    }
  }

  private createUI(depthDim: number): ExtraAxisGizmoUI {
    const root = document.createElement('div');
    root.className = 'extra-axis-gizmo';
    root.dataset.depthDim = String(depthDim);

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', `0 0 ${GIZMO_VIEWBOX_SIZE} ${GIZMO_VIEWBOX_SIZE}`);
    svg.setAttribute('aria-hidden', 'true');
    const ring = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    ring.setAttribute('class', 'ring');
    ring.setAttribute('cx', `${extraAxisGizmoCenter}`);
    ring.setAttribute('cy', `${extraAxisGizmoCenter}`);
    ring.setAttribute('r', `${extraAxisGizmoRadius + 3}`);
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', `${extraAxisGizmoCenter}`);
    line.setAttribute('y1', `${extraAxisGizmoCenter}`);
    line.setAttribute('x2', `${extraAxisGizmoCenter}`);
    line.setAttribute('y2', `${extraAxisGizmoCenter}`);
    svg.append(ring, line);

    const negButton = document.createElement('button');
    negButton.type = 'button';
    negButton.className = 'negative';
    const posButton = document.createElement('button');
    posButton.type = 'button';
    posButton.className = 'positive';
    const autoToggleButton = document.createElement('button');
    autoToggleButton.type = 'button';
    autoToggleButton.className = 'auto-toggle';
    autoToggleButton.innerHTML = `
      <span class="material-symbols-rounded" aria-hidden="true">play_arrow</span>
    `;
    const perspectiveToggleButton = document.createElement('button');
    perspectiveToggleButton.type = 'button';
    perspectiveToggleButton.className = 'perspective-toggle';
    perspectiveToggleButton.innerHTML = `
      <span class="material-symbols-rounded depth-icon" aria-hidden="true">vrpano</span>
    `;
    const orderHandleButton = document.createElement('button');
    orderHandleButton.type = 'button';
    orderHandleButton.className = 'axis-order-handle';
    orderHandleButton.setAttribute('aria-label', `Reorder ${axisLabel(depthDim)} axis`);

    const onPointerDown = (ev: PointerEvent) => {
      if (ev.pointerType !== 'mouse') ev.preventDefault();
      ev.stopPropagation();
      const plane = this.currentPlanes().find(candidate => candidate.depthDim === depthDim);
      if (!plane) return;
      this.beginDrag(ev, plane, root);
    };
    root.addEventListener('pointerdown', onPointerDown);
    negButton.addEventListener('pointerdown', onPointerDown);
    posButton.addEventListener('pointerdown', onPointerDown);
    autoToggleButton.addEventListener('pointerdown', ev => {
      if (ev.pointerType !== 'mouse') ev.preventDefault();
      ev.stopPropagation();
      if (ev.button !== 0) return;
      this.advanceAutoRotate(depthDim);
    });
    autoToggleButton.addEventListener('keydown', ev => {
      if (ev.key !== 'Enter' && ev.key !== ' ') return;
      ev.preventDefault();
      this.advanceAutoRotate(depthDim);
    });
    autoToggleButton.addEventListener('pointerup', ev => {
      ev.preventDefault();
      ev.stopPropagation();
    });
    autoToggleButton.addEventListener('dblclick', ev => {
      ev.preventDefault();
      ev.stopPropagation();
    });
    perspectiveToggleButton.addEventListener('pointerdown', ev => {
      if (ev.pointerType !== 'mouse') ev.preventDefault();
      ev.stopPropagation();
      if (ev.button !== 0) return;
      this.setPerspectiveDepth(depthDim, !this.selectedPerspectiveDims.has(depthDim));
      this.options.projectAndRenderAll();
    });
    perspectiveToggleButton.addEventListener('keydown', ev => {
      if (ev.key !== 'Enter' && ev.key !== ' ') return;
      ev.preventDefault();
      this.setPerspectiveDepth(depthDim, !this.selectedPerspectiveDims.has(depthDim));
      this.options.projectAndRenderAll();
    });
    perspectiveToggleButton.addEventListener('pointerup', ev => {
      ev.preventDefault();
      ev.stopPropagation();
    });
    perspectiveToggleButton.addEventListener('dblclick', ev => {
      ev.preventDefault();
      ev.stopPropagation();
    });
    orderHandleButton.addEventListener('pointerdown', ev => this.beginOrderHandleDrag(ev, root, depthDim));
    orderHandleButton.addEventListener('click', ev => {
      ev.preventDefault();
      ev.stopPropagation();
    });
    orderHandleButton.addEventListener('dblclick', ev => {
      ev.preventDefault();
      ev.stopPropagation();
    });

    root.addEventListener('pointermove', ev => this.handleDragMove(ev, root));
    root.addEventListener('pointerup', ev => {
      const wasDraggingThisGizmo = this.drag.active
        && ev.pointerId === this.drag.pointerId
        && this.drag.target === root;
      const movedWhileDragging = wasDraggingThisGizmo && this.drag.moved;
      this.endDrag(ev);
      if (movedWhileDragging) {
        ev.preventDefault();
        ev.stopPropagation();
      }
    });
    root.addEventListener('pointercancel', ev => this.endDrag(ev));

    root.append(svg, negButton, posButton, autoToggleButton, perspectiveToggleButton, orderHandleButton);
    return { root, line, negButton, posButton, autoToggleButton, perspectiveToggleButton, orderHandleButton };
  }

  private handleDragMove(ev: PointerEvent, root: HTMLDivElement) {
    if (!this.drag.active || ev.pointerId !== this.drag.pointerId || this.drag.target !== root) return;
    ev.preventDefault();
    const angle = pointerAngleInExtraAxisGizmo(ev, root);
    if (angle == null) return;
    const delta = normalizeSignedAngleDelta(angle - this.drag.lastAngle);
    this.drag.lastAngle = angle;
    if (Math.abs(delta) < 1e-4) return;
    this.drag.moved = true;
    if (this.drag.planeAxis < 0 || this.drag.depthAxis < 0 || this.drag.planeAxis === this.drag.depthAxis) return;

    this.options.getRot().applyGivensLeft(this.drag.planeAxis, this.drag.depthAxis, delta);
    this.offsetAngle({ planeAxis: this.drag.planeAxis, depthDim: this.drag.depthAxis }, delta);
    this.sync();
    this.options.applySceneBackground();
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}
