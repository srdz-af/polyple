import * as THREE from 'three';
import type { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { MAX_N, AXIS_PALETTE, type ViewMode } from '../constants';
import type { RotND } from '../RotND';
import { canonicalAxisMap, type AxisMap } from '../geometry/projectionUtils';
import type { ProjectionAxes } from '../scene/types';
import { ExtraAxisGizmoController } from './ExtraAxisGizmoController';
import {
  axisGizmoCenter,
  axisGizmoRadius,
  axisLabel,
  GIZMO_VIEWBOX_SIZE,
} from './axisGizmoShared';

type AxisParams = {
  N: number;
  renderMode: ViewMode;
  editMode: boolean;
  axesX: number;
  axesY: number;
  axesZ: number;
};

type AxisGizmoPart = {
  slot: 0 | 1 | 2;
  vector: THREE.Vector3;
  button: HTMLButtonElement;
  line: SVGLineElement;
};

type AxisGizmoControllerOptions = {
  camera: THREE.PerspectiveCamera;
  controls: OrbitControls;
  worldUp: THREE.Vector3;
  axesHelper: THREE.AxesHelper;
  getParams: () => AxisParams;
  getN: () => number;
  getRot: () => RotND;
  clearAxisGuide: () => void;
  projectAndRenderAll: () => void;
  applySceneBackground: () => void;
  setPaneCollapsed: (collapsed: boolean) => void;
  getPaneCollapsed: () => boolean;
};

export class AxisGizmoController {
  private readonly axisGizmoEl = document.getElementById('axis-gizmo') as HTMLDivElement | null;
  private readonly axisLegend = document.getElementById('axis-legend') as HTMLDivElement | null;
  private readonly axisCycleButton = document.getElementById('axis-cycle-button') as HTMLButtonElement | null;
  private readonly axisSyncRotationsButton = document.getElementById('axis-sync-rotations-button') as HTMLButtonElement | null;
  private readonly paneToggleButton = document.getElementById('pane-toggle') as HTMLButtonElement | null;
  private readonly axisGizmoParts: AxisGizmoPart[] = [];
  private readonly extraAxisGizmos: ExtraAxisGizmoController;
  private projectionControlsBound = false;
  private axisSwapTargetActive = false;
  private axisSwapHoverPart: AxisGizmoPart | null = null;
  private readonly isometricInverseCameraQuaternion = new THREE.Quaternion();
  private readonly axisGizmoDrag = {
    active: false,
    moved: false,
    pointerId: -1,
    lastX: 0,
    lastY: 0,
    snapVector: null as THREE.Vector3 | null,
  };
  axesOrder: number[] = Array.from({ length: MAX_N }, (_, i) => i);
  axesOffset = 0;

  constructor(private readonly options: AxisGizmoControllerOptions) {
    this.extraAxisGizmos = new ExtraAxisGizmoController({
      rootEl: document.getElementById('extra-axis-gizmos') as HTMLDivElement | null,
      getVisibleDims: () => this.visibleDims(),
      getAxesOrder: () => this.axesOrder,
      getAxesOffset: () => this.axesOffset,
      getParams: () => this.options.getParams(),
      getRot: () => this.options.getRot(),
      applySceneBackground: () => this.options.applySceneBackground(),
      projectAndRenderAll: () => this.options.projectAndRenderAll(),
      reorderExtraAxes: orderedExtraDims => this.reorderExtraAxes(orderedExtraDims),
      updateProjectedAxisDropTarget: (clientX, clientY, ghostRect) => {
        this.updateProjectedAxisDropTarget(clientX, clientY, ghostRect);
      },
      takeProjectedAxisDropTarget: () => this.takeProjectedAxisDropTarget(),
      clearProjectedAxisDropTarget: () => this.clearProjectedAxisDropTarget(),
      swapExtraAxisWithProjection: (depthDim, targetSlot) => {
        this.swapExtraAxisWithProjection(depthDim, targetSlot);
      },
    });

    const isoCamera = new THREE.PerspectiveCamera();
    isoCamera.position.set(1, 1, 1);
    isoCamera.up.copy(this.options.worldUp);
    isoCamera.lookAt(0, 0, 0);
    this.isometricInverseCameraQuaternion.copy(isoCamera.quaternion).invert();
  }

  init() {
    this.initAxisGizmo();
    this.bindProjectionControls();
  }

  visibleDims() {
    return Math.max(3, Math.min(this.options.getParams().N, MAX_N));
  }

  setAxisOrder(order: number[]) {
    this.axesOrder = [...order];
  }

  resetAxisOrder(n = this.options.getN()) {
    this.axesOrder = Array.from({ length: n }, (_, i) => i);
    this.axesOffset = 0;
  }

  clearDynamicState() {
    this.extraAxisGizmos.clearDynamicState();
  }

  normalizeVisibleAxes(nVis = this.visibleDims()) {
    const count = Math.max(3, Math.min(nVis, MAX_N));
    const projectionOrder = this.projectionOrder();
    const visible: number[] = [];
    for (const dim of projectionOrder) {
      if (dim >= 0 && dim < count && !visible.includes(dim)) visible.push(dim);
    }
    for (let dim = 0; dim < count; dim++) {
      if (!visible.includes(dim)) visible.push(dim);
    }

    const hidden: number[] = [];
    for (const dim of this.axesOrder) {
      if (dim >= count && dim < MAX_N && !hidden.includes(dim)) hidden.push(dim);
    }
    for (let dim = count; dim < MAX_N; dim++) {
      if (!hidden.includes(dim)) hidden.push(dim);
    }

    this.axesOrder = [...visible, ...hidden];
    this.axesOffset = 0;
    const params = this.options.getParams();
    params.axesX = visible[0] ?? 0;
    params.axesY = visible[1] ?? 1;
    params.axesZ = visible[2] ?? 2;
    this.options.clearAxisGuide();
  }

  currentAxisMap(localN: number): AxisMap {
    const source = this.axesOrder.slice(0, this.visibleDims());
    const activeAxes = source.length ? source : canonicalAxisMap(MAX_N);
    const count = Math.max(0, Math.min(localN, MAX_N));
    return Array.from({ length: count }, (_, dim) => activeAxes[(this.axesOffset + dim) % activeAxes.length] ?? dim);
  }

  private projectionOrder() {
    const nVis = this.visibleDims();
    if (nVis <= 0) return [];
    const order = this.axesOrder.slice(0, nVis);
    const offset = (((this.axesOffset % nVis) + nVis) % nVis);
    return Array.from({ length: nVis }, (_, idx) => order[(offset + idx) % nVis] ?? idx);
  }

  perspectiveDimsFor(localN: number, axisMap: AxisMap): number[] {
    return this.extraAxisGizmos.perspectiveDimsFor(localN, axisMap);
  }

  primaryExtraRotationDepthDim(localN: number, axisMap: AxisMap): number {
    return this.extraAxisGizmos.primaryExtraRotationDepthDim(localN, axisMap);
  }

  extraRotationPlaneAxis(lockAxis: -1 | 0 | 1 | 2, depthDim: number, n: number) {
    const params = this.options.getParams();
    const axes = [params.axesX, params.axesY, params.axesZ].map(dim => Math.max(0, Math.min(n - 1, dim % n)));
    const preferred = axes[lockAxis >= 0 ? lockAxis : 0];
    if (preferred !== depthDim) return preferred;
    return axes.find(dim => dim !== depthDim) ?? -1;
  }

  setProjectionAxes({ x, y, z }: ProjectionAxes) {
    const params = this.options.getParams();
    const nVis = this.visibleDims();
    const list = this.axesOrder.slice(0, nVis);
    const clamp = (v: number) => {
      const idx = list.indexOf(v);
      return idx >= 0 ? v : list[0] ?? 0;
    };
    params.axesX = clamp(x);
    params.axesY = clamp(y);
    params.axesZ = clamp(z);
    const idx = list.indexOf(params.axesX);
    if (idx >= 0) this.axesOffset = idx;
    this.options.clearAxisGuide();
    this.updateAxisLegend();
    this.renderAxisList();
    this.options.projectAndRenderAll();
  }

  cycleAxes(step: number) {
    const params = this.options.getParams();
    const n = this.visibleDims();
    if (n < 3) return;
    this.axesOffset = (((this.axesOffset + step) % n) + n) % n;
    this.setProjectionAxes({
      x: this.axesOrder[this.axesOffset % n],
      y: this.axesOrder[(this.axesOffset + 1) % n],
      z: this.axesOrder[(this.axesOffset + 2) % n],
    });
  }

  updateAxesHelperColors() {
    const params = this.options.getParams();
    const colorAttr = this.options.axesHelper.geometry.getAttribute('color') as THREE.BufferAttribute | undefined;
    if (!colorAttr) return;
    const cX = new THREE.Color(AXIS_PALETTE[params.axesX % AXIS_PALETTE.length]);
    const cY = new THREE.Color(AXIS_PALETTE[params.axesY % AXIS_PALETTE.length]);
    const cZ = new THREE.Color(AXIS_PALETTE[params.axesZ % AXIS_PALETTE.length]);
    colorAttr.setXYZ(0, cX.r, cX.g, cX.b);
    colorAttr.setXYZ(1, cX.r, cX.g, cX.b);
    colorAttr.setXYZ(2, cY.r, cY.g, cY.b);
    colorAttr.setXYZ(3, cY.r, cY.g, cY.b);
    colorAttr.setXYZ(4, cZ.r, cZ.g, cZ.b);
    colorAttr.setXYZ(5, cZ.r, cZ.g, cZ.b);
    colorAttr.needsUpdate = true;
  }

  updateAxisLegend() {
    this.updateAxesHelperColors();
    if (!this.axisLegend) return;
    const nVis = this.visibleDims();
    const badges = Array.from({ length: nVis }).map((_, i) => {
      const color = AXIS_PALETTE[i % AXIS_PALETTE.length];
      return `<span class="badge" style="background:${color};">${axisLabel(i)}</span>`;
    }).join('');
    this.axisLegend.innerHTML = `<h4 style="margin:0 0 6px 0; font-size:12px; color:#e6ecf5;">Axes</h4><div>${badges}</div>`;
  }

  renderAxisList() {
    this.bindProjectionControls();
    if (this.axisCycleButton) this.axisCycleButton.disabled = this.visibleDims() < 3;
    if (this.axisSyncRotationsButton) this.axisSyncRotationsButton.disabled = this.visibleDims() < 4;
    this.options.setPaneCollapsed(this.options.getPaneCollapsed());
    this.extraAxisGizmos.sync();
  }

  applyAutoRotation(dt: number) {
    this.extraAxisGizmos.applyAutoRotation(dt);
  }

  toggleActiveAutoRotations() {
    this.extraAxisGizmos.toggleActiveAutoRotations();
  }

  snapCameraToAxis(axis: THREE.Vector3) {
    const { camera, controls, worldUp } = this.options;
    const target = controls.target.clone();
    const distance = Math.max(camera.position.distanceTo(target), 0.8);
    const direction = axis.clone().normalize();

    camera.up.copy(worldUp);
    camera.position.copy(target).addScaledVector(direction, distance);
    camera.lookAt(target);
    controls.update();
    this.updateAxisGizmo();
  }

  updateAxisGizmo() {
    if (!this.axisGizmoParts.length) return;

    const params = this.options.getParams();
    const axisButtonScale = this.axisGizmoEl
      ? (this.axisGizmoEl.clientWidth || GIZMO_VIEWBOX_SIZE) / GIZMO_VIEWBOX_SIZE
      : 1;
    const inverseCamera = this.axisSwapTargetActive
      ? this.isometricInverseCameraQuaternion
      : this.options.camera.quaternion.clone().invert();
    const activeDims = [params.axesX, params.axesY, params.axesZ];
    this.axisGizmoEl?.classList.toggle('axis-swap-target', this.axisSwapTargetActive);
    for (const part of this.axisGizmoParts) {
      const dim = activeDims[part.slot] ?? part.slot;
      const label = axisLabel(dim);
      const color = AXIS_PALETTE[dim % AXIS_PALETTE.length];
      const isPositive = part.vector.getComponent(part.slot) > 0;
      const signedLabel = `${isPositive ? '+' : '-'}${label}`;
      part.button.textContent = isPositive ? label : '';
      part.button.title = `View ${signedLabel}`;
      part.button.setAttribute('aria-label', part.button.title);
      part.button.style.setProperty('--axis-color', color);
      part.line.style.stroke = color;

      const viewVector = part.vector.clone().applyQuaternion(inverseCamera);
      const x = axisGizmoCenter + viewVector.x * axisGizmoRadius;
      const y = axisGizmoCenter - viewVector.y * axisGizmoRadius;
      const isBack = viewVector.z > 0;

      part.button.style.left = `${x * axisButtonScale}px`;
      part.button.style.top = `${y * axisButtonScale}px`;
      part.button.style.zIndex = `${Math.round((1 - viewVector.z) * 100)}`;
      part.button.classList.toggle('back', isBack);

      part.line.setAttribute('x1', `${axisGizmoCenter}`);
      part.line.setAttribute('y1', `${axisGizmoCenter}`);
      part.line.setAttribute('x2', `${x}`);
      part.line.setAttribute('y2', `${y}`);
      part.line.style.opacity = isBack ? '0.34' : '0.82';
    }

    this.updateAxisSwapHighlights();
    this.extraAxisGizmos.sync();
  }

  private updateProjectedAxisDropTarget(
    clientX: number,
    clientY: number,
    ghostRect: DOMRectReadOnly | null,
  ) {
    if (!this.axisGizmoEl) return;
    const axisRect = this.axisGizmoEl.getBoundingClientRect();
    const pointerOverAxis = pointInRect(clientX, clientY, axisRect);
    const overlapsAxis = pointerOverAxis || (ghostRect ? rectsOverlap(axisRect, ghostRect) : false);
    if (!overlapsAxis) {
      this.clearProjectedAxisDropTarget();
      return;
    }

    if (!this.axisSwapTargetActive) {
      this.axisSwapTargetActive = true;
      this.updateAxisGizmo();
    }

    const hoverPart = this.pickAxisSwapHoverPart(clientX, clientY, ghostRect);
    if (hoverPart === this.axisSwapHoverPart) return;
    this.axisSwapHoverPart = hoverPart;
    this.updateAxisSwapHighlights();
  }

  private takeProjectedAxisDropTarget(): 0 | 1 | 2 | null {
    const slot = this.axisSwapHoverPart?.slot ?? null;
    this.clearProjectedAxisDropTarget();
    return slot;
  }

  private clearProjectedAxisDropTarget() {
    if (!this.axisSwapTargetActive && !this.axisSwapHoverPart) return;
    this.axisSwapTargetActive = false;
    this.axisSwapHoverPart = null;
    this.axisGizmoEl?.classList.remove('axis-swap-target');
    this.updateAxisSwapHighlights();
    this.updateAxisGizmo();
  }

  private pickAxisSwapHoverPart(
    clientX: number,
    clientY: number,
    ghostRect: DOMRectReadOnly | null,
  ) {
    const points = [{ x: clientX, y: clientY }];
    if (ghostRect) {
      points.push({
        x: ghostRect.left + (ghostRect.width * 0.5),
        y: ghostRect.top + (ghostRect.height * 0.5),
      });
    }

    let best: { part: AxisGizmoPart; distance: number } | null = null;
    for (const part of this.axisGizmoParts) {
      const rect = part.button.getBoundingClientRect();
      const cx = rect.left + (rect.width * 0.5);
      const cy = rect.top + (rect.height * 0.5);
      const hitRadius = Math.max(18, Math.min(28, Math.max(rect.width, rect.height) * 1.15));
      for (const point of points) {
        const distance = Math.hypot(point.x - cx, point.y - cy);
        if (distance > hitRadius) continue;
        if (!best || distance < best.distance) best = { part, distance };
      }
    }
    return best?.part ?? null;
  }

  private updateAxisSwapHighlights() {
    for (const part of this.axisGizmoParts) {
      const active = this.axisSwapHoverPart === part;
      part.button.classList.toggle('axis-swap-hover', active);
      part.line.classList.toggle('axis-swap-hover', active);
    }
  }

  private swapExtraAxisWithProjection(depthDim: number, targetSlot: 0 | 1 | 2) {
    const nVis = this.visibleDims();
    if (nVis <= 3) return;
    const params = this.options.getParams();
    const activeDims: [number, number, number] = [params.axesX, params.axesY, params.axesZ];
    const projectedDim = activeDims[targetSlot];
    if (projectedDim === depthDim) return;

    const projectionOrder = this.projectionOrder();
    if (!projectionOrder.includes(depthDim) || !projectionOrder.includes(projectedDim)) return;

    const nextActiveDims: [number, number, number] = [...activeDims];
    nextActiveDims[targetSlot] = depthDim;

    const activeSet = new Set(activeDims);
    const currentExtraDims = projectionOrder.filter(dim => !activeSet.has(dim));
    const extraIndex = currentExtraDims.indexOf(depthDim);
    if (extraIndex < 0) return;
    currentExtraDims[extraIndex] = projectedDim;

    this.axesOrder = [...nextActiveDims, ...currentExtraDims, ...this.axesOrder.slice(nVis)];
    this.axesOffset = 0;
    this.setProjectionAxes({
      x: nextActiveDims[0],
      y: nextActiveDims[1],
      z: nextActiveDims[2],
    });
  }

  private reorderExtraAxes(orderedExtraDims: number[]) {
    const nVis = this.visibleDims();
    if (nVis <= 3) return;
    const projectionOrder = this.projectionOrder();
    const activeDims = projectionOrder.slice(0, 3);
    const currentExtraDims = projectionOrder.slice(3);
    const extraSet = new Set(currentExtraDims);
    const nextExtraDims: number[] = [];

    for (const dim of orderedExtraDims) {
      if (!extraSet.has(dim) || nextExtraDims.includes(dim)) continue;
      nextExtraDims.push(dim);
    }
    for (const dim of currentExtraDims) {
      if (!nextExtraDims.includes(dim)) nextExtraDims.push(dim);
    }

    this.axesOrder = [...activeDims, ...nextExtraDims, ...this.axesOrder.slice(nVis)];
    this.axesOffset = 0;
    this.setProjectionAxes({
      x: activeDims[0] ?? 0,
      y: activeDims[1] ?? 1,
      z: activeDims[2] ?? 2,
    });
  }

  private bindProjectionControls() {
    if (this.projectionControlsBound) return;
    this.axisCycleButton?.addEventListener('click', () => this.cycleAxes(1));
    this.axisSyncRotationsButton?.addEventListener('click', () => this.extraAxisGizmos.resetRotations());
    this.paneToggleButton?.addEventListener('click', () => {
      this.options.setPaneCollapsed(!this.options.getPaneCollapsed());
    });
    this.projectionControlsBound = true;
  }

  private initAxisGizmo() {
    if (!this.axisGizmoEl) return;

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    this.axisGizmoEl.appendChild(svg);

    const axesConfig: { slot: 0 | 1 | 2; vector: THREE.Vector3 }[] = [
      { slot: 0, vector: new THREE.Vector3(1, 0, 0) },
      { slot: 1, vector: new THREE.Vector3(0, 1, 0) },
      { slot: 2, vector: new THREE.Vector3(0, 0, 1) },
    ];

    for (const axis of axesConfig) {
      for (const sign of [1, -1]) {
        const vector = axis.vector.clone().multiplyScalar(sign);
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        svg.appendChild(line);

        const button = document.createElement('button');
        button.type = 'button';
        button.classList.toggle('negative', sign < 0);
        button.addEventListener('pointerdown', ev => {
          ev.preventDefault();
          ev.stopPropagation();
          this.beginAxisGizmoDrag(ev, vector);
        });
        button.addEventListener('click', ev => {
          ev.preventDefault();
          ev.stopPropagation();
          if (!this.axisGizmoDrag.moved) this.snapCameraToAxis(vector);
        });
        this.axisGizmoEl.appendChild(button);
        this.axisGizmoParts.push({ slot: axis.slot, vector, button, line });
      }
    }

    this.axisGizmoEl.addEventListener('pointerdown', ev => {
      ev.preventDefault();
      ev.stopPropagation();
      this.beginAxisGizmoDrag(ev);
    });

    this.axisGizmoEl.addEventListener('pointermove', ev => {
      if (!this.axisGizmoDrag.active || ev.pointerId !== this.axisGizmoDrag.pointerId) return;
      ev.preventDefault();

      const dx = ev.clientX - this.axisGizmoDrag.lastX;
      const dy = ev.clientY - this.axisGizmoDrag.lastY;
      this.axisGizmoDrag.lastX = ev.clientX;
      this.axisGizmoDrag.lastY = ev.clientY;
      if (Math.abs(dx) + Math.abs(dy) > 2) this.axisGizmoDrag.moved = true;

      this.orbitCameraFromGizmo(dx, dy);
    });

    this.axisGizmoEl.addEventListener('pointerup', ev => {
      if (ev.pointerId !== this.axisGizmoDrag.pointerId) return;
      if (!this.axisGizmoDrag.moved && this.axisGizmoDrag.snapVector) {
        this.snapCameraToAxis(this.axisGizmoDrag.snapVector);
      }
      this.axisGizmoDrag.active = false;
      this.axisGizmoDrag.pointerId = -1;
      this.axisGizmoDrag.snapVector = null;
      if (this.axisGizmoEl?.hasPointerCapture(ev.pointerId)) {
        this.axisGizmoEl.releasePointerCapture(ev.pointerId);
      }
      this.axisGizmoEl?.classList.remove('dragging');
    });

    this.axisGizmoEl.addEventListener('pointercancel', ev => {
      if (ev.pointerId !== this.axisGizmoDrag.pointerId) return;
      this.axisGizmoDrag.active = false;
      this.axisGizmoDrag.pointerId = -1;
      this.axisGizmoDrag.snapVector = null;
      if (this.axisGizmoEl?.hasPointerCapture(ev.pointerId)) {
        this.axisGizmoEl.releasePointerCapture(ev.pointerId);
      }
      this.axisGizmoEl?.classList.remove('dragging');
    });

    this.updateAxisGizmo();
  }

  private beginAxisGizmoDrag(ev: PointerEvent, snapVector?: THREE.Vector3) {
    if (!this.axisGizmoEl) return;

    this.axisGizmoDrag.active = true;
    this.axisGizmoDrag.moved = false;
    this.axisGizmoDrag.pointerId = ev.pointerId;
    this.axisGizmoDrag.lastX = ev.clientX;
    this.axisGizmoDrag.lastY = ev.clientY;
    this.axisGizmoDrag.snapVector = snapVector?.clone() ?? null;
    try {
      this.axisGizmoEl.setPointerCapture(ev.pointerId);
    } catch {
      // Some browsers are strict about capture when pointerdown starts on a child.
    }
    this.axisGizmoEl.classList.add('dragging');
  }

  private orbitCameraFromGizmo(dx: number, dy: number) {
    const { camera, controls, worldUp } = this.options;
    camera.up.copy(worldUp);
    const offset = camera.position.clone().sub(controls.target);
    const spherical = new THREE.Spherical().setFromVector3(offset);
    const rotateSpeed = 0.008;
    const minPolar = 0.01;
    const maxPolar = Math.PI - 0.01;

    spherical.theta -= dx * rotateSpeed;
    spherical.phi = Math.max(minPolar, Math.min(maxPolar, spherical.phi - dy * rotateSpeed));
    offset.setFromSpherical(spherical);
    camera.position.copy(controls.target).add(offset);
    camera.lookAt(controls.target);
    controls.update();
    this.updateAxisGizmo();
  }
}

function pointInRect(x: number, y: number, rect: DOMRectReadOnly) {
  return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
}

function rectsOverlap(a: DOMRectReadOnly, b: DOMRectReadOnly) {
  return a.left <= b.right && a.right >= b.left && a.top <= b.bottom && a.bottom >= b.top;
}
