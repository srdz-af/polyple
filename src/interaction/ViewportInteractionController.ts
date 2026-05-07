import * as THREE from 'three';
import type { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { PrimitiveKind } from '../geometry/primitives';
import type { HypercubeRenderer } from '../rendering/HypercubeRenderer';
import type { Instance, TransformMode } from '../scene/types';
import type { KeyboardCameraController } from '../controls/KeyboardCameraController';
import type { TransformController } from './TransformController';

type ViewportParams = {
  editMode: boolean;
  sliceDim: number;
};

type PrimitiveMenuOption = {
  label: string;
  kind: PrimitiveKind;
};

type ViewportInteractionControllerOptions = {
  renderer: THREE.WebGLRenderer;
  camera: THREE.PerspectiveCamera;
  controls: OrbitControls;
  raycaster: THREE.Raycaster;
  ndc: THREE.Vector2;
  tooltipEl: HTMLDivElement | null;
  contextMenuEl: HTMLDivElement | null;
  keyboardCamera: KeyboardCameraController;
  transformController: TransformController;
  primitiveMenuOptions: PrimitiveMenuOption[];
  baseSelection: number;
  noSelection: number;
  getParams: () => ViewportParams;
  setSliceDim: (dim: number) => void;
  getN: () => number;
  getX: () => Float32Array;
  getM: () => number;
  getBaseVisible: () => boolean;
  getSelectedInstance: () => number;
  getRendererND: () => HypercubeRenderer;
  getExtraInstances: () => Instance[];
  selectObject: (idx: number) => void;
  placeVertexMarker: (instIdx: number, vertexIdx: number) => void;
  pushUndoSnapshot: () => void;
  addPrimitiveInstanceAt: (kind: PrimitiveKind, label: string, offset: THREE.Vector3, syncMode?: boolean) => void;
  deleteSelected: () => void;
  hasActiveSelection: () => boolean;
  applySliceFilter: () => void;
  cycleAxes: (step: number) => void;
};

export class ViewportInteractionController {
  private readonly clickPlane = new THREE.Plane();
  private readonly clickPoint = new THREE.Vector3();
  private readonly tmpVec = new THREE.Vector3();
  private lastPointer = { x: window.innerWidth - 180, y: window.innerHeight - 80 };
  private deletePending = false;
  private readonly axisDrag = {
    active: false,
    lastX: 0,
    accum: 0,
    prevZoom: true,
    prevPan: true,
  };

  constructor(private readonly options: ViewportInteractionControllerOptions) {}

  bind() {
    const canvas = this.options.renderer.domElement;
    canvas.addEventListener('pointermove', ev => this.handleHover(ev));
    canvas.addEventListener('pointermove', ev => this.handleTransformPointerMove(ev));
    canvas.addEventListener('pointerleave', () => this.options.tooltipEl?.classList.remove('visible'));
    canvas.addEventListener('contextmenu', ev => this.handleContextMenu(ev));
    canvas.addEventListener('wheel', ev => this.handleWheel(ev));
    canvas.addEventListener('mousedown', ev => this.handleMiddleMouseDown(ev), { capture: true });
    canvas.addEventListener('pointerdown', ev => this.handlePointerDown(ev));

    window.addEventListener('click', () => this.hideContextMenuIfIdle());
    window.addEventListener('pointermove', ev => this.handleWindowPointerMove(ev));
    window.addEventListener('pointerup', ev => this.handleWindowPointerUp(ev));
    window.addEventListener('pointercancel', ev => this.handleWindowPointerCancel(ev));
    window.addEventListener('blur', () => this.handleWindowBlur());
  }

  cancelAxisShiftDrag() {
    this.endAxisShiftDrag();
  }

  showAddObjectMenuAtLastPointer() {
    const menu = this.options.contextMenuEl;
    if (!menu) return;
    menu.replaceChildren();
    menu.classList.add('primitive-menu');
    const spawnPoint = this.pickPointOnTargetPlane({ clientX: this.lastPointer.x, clientY: this.lastPointer.y });
    for (const opt of this.options.primitiveMenuOptions) {
      const btn = document.createElement('button');
      btn.textContent = opt.label;
      btn.onclick = () => {
        menu.style.display = 'none';
        this.options.pushUndoSnapshot();
        this.options.addPrimitiveInstanceAt(opt.kind, `${opt.label} #${this.options.getExtraInstances().length + 1}`, spawnPoint, false);
      };
      menu.appendChild(btn);
    }
    this.placeMenu(menu, this.lastPointer.x, this.lastPointer.y, 196);
    menu.style.display = 'grid';
  }

  startTransformFromLastPointer(mode: TransformMode) {
    this.options.transformController.startFromPointer(mode, this.lastPointer);
  }

  deleteOrConfirmSelection() {
    if (!this.options.hasActiveSelection()) return;
    if (this.deletePending) {
      this.deletePending = false;
      if (this.options.contextMenuEl) this.options.contextMenuEl.style.display = 'none';
      this.options.deleteSelected();
    } else {
      this.showDeleteConfirm();
    }
  }

  private showDeleteConfirm(ev?: MouseEvent) {
    const menu = this.options.contextMenuEl;
    if (!menu) return;
    this.deletePending = true;
    menu.replaceChildren();

    const title = document.createElement('div');
    title.textContent = 'Delete?';
    title.style.padding = '8px 12px';
    title.style.fontWeight = '700';

    const confirm = document.createElement('button');
    confirm.textContent = 'Confirm';
    confirm.onclick = () => {
      menu.style.display = 'none';
      this.deletePending = false;
      this.options.deleteSelected();
    };

    const cancel = document.createElement('button');
    cancel.textContent = 'Cancel';
    cancel.onclick = () => {
      this.deletePending = false;
      menu.style.display = 'none';
    };

    menu.append(title, confirm, cancel);
    const x = ev?.clientX ?? this.lastPointer.x;
    const y = ev?.clientY ?? this.lastPointer.y;
    menu.style.left = `${x}px`;
    menu.style.top = `${y}px`;
    menu.style.display = 'block';
  }

  private handleHover(ev: PointerEvent) {
    const tooltipEl = this.options.tooltipEl;
    if (!tooltipEl) return;

    const rect = this.options.renderer.domElement.getBoundingClientRect();
    const mx = ev.clientX - rect.left;
    const my = ev.clientY - rect.top;
    const w = rect.width;
    const h = rect.height;
    let best = -1;
    let bestDist2 = Number.POSITIVE_INFINITY;
    let selectedHoverInst = -1;

    const considerPoint = (px: number, py: number, pz: number, idx: number, instIdx: number) => {
      this.tmpVec.set(px, py, pz).project(this.options.camera);
      const sx = (this.tmpVec.x * 0.5 + 0.5) * w;
      const sy = (-this.tmpVec.y * 0.5 + 0.5) * h;
      const dx = sx - mx;
      const dy = sy - my;
      const d2 = dx * dx + dy * dy;
      if (d2 < bestDist2) {
        bestDist2 = d2;
        best = idx;
        selectedHoverInst = instIdx;
      }
    };

    if (this.options.getBaseVisible()) {
      const rendererND = this.options.getRendererND();
      const M = this.options.getM();
      for (let i = 0; i < M; i++) {
        const pIdx = i * 3;
        considerPoint(rendererND.positions[pIdx], rendererND.positions[pIdx + 1], rendererND.positions[pIdx + 2], i, this.options.baseSelection);
      }
    }

    this.options.getExtraInstances().forEach((inst, instIdx) => {
      if (!inst.visible) return;
      const pos = inst.renderer.positions;
      for (let i = 0; i < inst.M; i++) {
        const pIdx = i * 3;
        considerPoint(pos[pIdx], pos[pIdx + 1], pos[pIdx + 2], i, instIdx);
      }
    });

    const thresh2 = 30 * 30;
    if (best >= 0 && bestDist2 < thresh2) {
      const hoverData = selectedHoverInst >= 0 && this.options.getExtraInstances()[selectedHoverInst]
        ? { coords: this.options.getExtraInstances()[selectedHoverInst].X, count: this.options.getExtraInstances()[selectedHoverInst].M }
        : { coords: this.options.getX(), count: this.options.getM() };
      const lines = this.formatCoords(this.options.getN(), hoverData.coords, hoverData.count, best);
      tooltipEl.replaceChildren();
      const title = document.createElement('div');
      title.style.fontWeight = '600';
      title.style.marginBottom = '4px';
      title.textContent = `v${best}`;
      const body = document.createElement('div');
      body.innerHTML = lines.join('<br>');
      tooltipEl.append(title, body);
      tooltipEl.style.left = `${ev.clientX}px`;
      tooltipEl.style.top = `${ev.clientY}px`;
      tooltipEl.classList.add('visible');
    } else {
      tooltipEl.classList.remove('visible');
    }

  }

  private handleTransformPointerMove(ev: PointerEvent) {
    this.lastPointer = { x: ev.clientX, y: ev.clientY };
    if (!this.options.transformController.isActive()) return;
    ev.preventDefault();
    this.options.transformController.applyPointer(ev.clientX, ev.clientY);
  }

  private handleContextMenu(ev: MouseEvent) {
    const menu = this.options.contextMenuEl;
    if (!menu) return;

    ev.preventDefault();
    this.lastPointer = { x: ev.clientX, y: ev.clientY };
    this.deletePending = false;
    menu.replaceChildren();
    menu.classList.remove('primitive-menu');
    const spawnPoint = this.pickPointOnTargetPlane(ev);

    if (this.options.getParams().editMode) {
      if (this.options.transformController.getSelectedVertex() < 0) return;
      this.appendTransformAction(menu, 'Move vertex', 'move', ev);
    } else if (!this.options.hasActiveSelection()) {
      menu.classList.add('primitive-menu');
      for (const opt of this.options.primitiveMenuOptions) {
        const btn = document.createElement('button');
        btn.textContent = opt.label;
        btn.onclick = () => {
          menu.style.display = 'none';
          this.options.pushUndoSnapshot();
          this.options.addPrimitiveInstanceAt(opt.kind, `${opt.label} #${this.options.getExtraInstances().length + 1}`, spawnPoint);
        };
        menu.appendChild(btn);
      }
    } else {
      this.appendTransformAction(menu, 'Move', 'move', ev);
      this.appendTransformAction(menu, 'Rotate', 'rotate', ev);
      this.appendTransformAction(menu, 'Scale', 'scale', ev);
      const deleteButton = document.createElement('button');
      deleteButton.textContent = 'Delete';
      deleteButton.onclick = () => this.showDeleteConfirm(ev);
      menu.appendChild(deleteButton);
    }

    const primitiveMenu = menu.classList.contains('primitive-menu');
    this.placeMenu(menu, ev.clientX, ev.clientY, primitiveMenu ? 196 : 180);
    menu.style.display = menu.childElementCount ? (primitiveMenu ? 'grid' : 'block') : 'none';
  }

  private placeMenu(menu: HTMLDivElement, clientX: number, clientY: number, estimatedWidth: number) {
    const x = Math.max(12, Math.min(clientX, window.innerWidth - estimatedWidth - 12));
    const y = Math.max(12, Math.min(clientY, window.innerHeight - 150));
    menu.style.left = `${x}px`;
    menu.style.top = `${y}px`;
  }

  private handleWheel(ev: WheelEvent) {
    if (!this.options.getParams().editMode) return;
    ev.preventDefault();
    const dir = ev.deltaY > 0 ? 1 : -1;
    const next = Math.max(-1, Math.min(this.options.getN() - 1, this.options.getParams().sliceDim + dir));
    this.options.setSliceDim(next);
    this.options.applySliceFilter();
  }

  private handleMiddleMouseDown(ev: MouseEvent) {
    if (ev.button !== 1) return;
    ev.preventDefault();
    ev.stopPropagation();
    this.axisDrag.active = true;
    this.axisDrag.lastX = ev.clientX;
    this.axisDrag.accum = 0;
    this.axisDrag.prevZoom = this.options.controls.enableZoom;
    this.axisDrag.prevPan = this.options.controls.enablePan;
    this.options.controls.enableZoom = false;
    this.options.controls.enablePan = false;
  }

  private handlePointerDown(ev: PointerEvent) {
    if (this.axisDrag.active) return;
    this.lastPointer = { x: ev.clientX, y: ev.clientY };

    if (this.options.transformController.isActive()) {
      if (ev.button === 0) {
        this.options.pushUndoSnapshot();
        this.options.transformController.finish(true);
      } else if (ev.button === 2) {
        this.options.transformController.finish(false);
      }
      ev.preventDefault();
      return;
    }

    if (ev.button !== 0) return;
    this.selectObjectFromPointer(ev);
  }

  private handleWindowPointerMove(ev: PointerEvent) {
    if (this.options.transformController.handleControlPointerMove(ev, point => { this.lastPointer = point; })) return;
    if (!this.axisDrag.active) return;
    if ((ev.buttons & 4) === 0) {
      this.endAxisShiftDrag();
      return;
    }

    ev.preventDefault();
    const dx = ev.clientX - this.axisDrag.lastX;
    this.axisDrag.lastX = ev.clientX;
    this.axisDrag.accum += dx;
    const threshold = 35;
    let steps = 0;
    while (this.axisDrag.accum > threshold) {
      steps++;
      this.axisDrag.accum -= threshold;
    }
    while (this.axisDrag.accum < -threshold) {
      steps--;
      this.axisDrag.accum += threshold;
    }
    if (steps !== 0) this.options.cycleAxes(steps);
  }

  private handleWindowPointerUp(ev: PointerEvent) {
    if (this.options.transformController.handleControlPointerEnd(ev, true)) return;
    if (this.axisDrag.active) this.endAxisShiftDrag();
  }

  private handleWindowPointerCancel(ev: PointerEvent) {
    this.options.transformController.handleControlPointerEnd(ev, false);
    if (this.axisDrag.active) this.endAxisShiftDrag();
  }

  private handleWindowBlur() {
    if (this.axisDrag.active) this.endAxisShiftDrag();
    this.options.keyboardCamera.clearKeys();
  }

  private hideContextMenuIfIdle() {
    if (this.deletePending) return;
    if (this.options.contextMenuEl) this.options.contextMenuEl.style.display = 'none';
    this.deletePending = false;
  }

  private selectObjectFromPointer(ev: PointerEvent) {
    const rect = this.options.renderer.domElement.getBoundingClientRect();
    const mx = ev.clientX - rect.left;
    const my = ev.clientY - rect.top;
    const w = rect.width;
    const h = rect.height;
    const rendererND = this.options.getRendererND();
    const M = this.options.getM();
    const extraInstances = this.options.getExtraInstances();

    const screenBounds = (positions: Float32Array, count: number) => {
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;
      for (let i = 0; i < count; i++) {
        const pIdx = i * 3;
        this.tmpVec.set(positions[pIdx], positions[pIdx + 1], positions[pIdx + 2]).project(this.options.camera);
        const sx = (this.tmpVec.x * 0.5 + 0.5) * w;
        const sy = (-this.tmpVec.y * 0.5 + 0.5) * h;
        if (sx < minX) minX = sx;
        if (sx > maxX) maxX = sx;
        if (sy < minY) minY = sy;
        if (sy > maxY) maxY = sy;
      }
      return { minX, maxX, minY, maxY };
    };

    const candidates: { instIdx: number; contains: boolean; area: number; }[] = [];
    if (M > 0) {
      const box = screenBounds(rendererND.positions, M);
      const contains = mx >= box.minX && mx <= box.maxX && my >= box.minY && my <= box.maxY;
      const area = (box.maxX - box.minX) * (box.maxY - box.minY);
      candidates.push({ instIdx: this.options.baseSelection, contains, area });
    }
    extraInstances.forEach((inst, idx) => {
      if (!inst.visible) return;
      const box = screenBounds(inst.renderer.positions, inst.M);
      const contains = mx >= box.minX && mx <= box.maxX && my >= box.minY && my <= box.maxY;
      const area = (box.maxX - box.minX) * (box.maxY - box.minY);
      candidates.push({ instIdx: idx, contains, area });
    });

    let bestInst = this.options.baseSelection;
    const containing = candidates.filter(candidate => candidate.contains && isFinite(candidate.area));
    if (containing.length) {
      containing.sort((a, b) => a.area - b.area);
      bestInst = containing[0].instIdx;
    } else {
      bestInst = this.nearestInstanceByVertex(mx, my, w, h);
    }

    if (bestInst === this.options.noSelection) {
      this.options.selectObject(this.options.noSelection);
      return;
    }

    this.options.selectObject(bestInst);
    if (this.options.getParams().editMode) this.selectNearestVertex(bestInst, mx, my, w, h);
  }

  private nearestInstanceByVertex(mx: number, my: number, width: number, height: number) {
    let bestInst = this.options.noSelection;
    let bestDist2 = Number.POSITIVE_INFINITY;
    const consider = (px: number, py: number, pz: number, instIdx: number) => {
      this.tmpVec.set(px, py, pz).project(this.options.camera);
      const sx = (this.tmpVec.x * 0.5 + 0.5) * width;
      const sy = (-this.tmpVec.y * 0.5 + 0.5) * height;
      const dx = sx - mx;
      const dy = sy - my;
      const d2 = dx * dx + dy * dy;
      if (d2 < bestDist2) {
        bestDist2 = d2;
        bestInst = instIdx;
      }
    };

    if (this.options.getBaseVisible()) {
      const rendererND = this.options.getRendererND();
      for (let i = 0; i < this.options.getM(); i++) {
        const pIdx = i * 3;
        consider(rendererND.positions[pIdx], rendererND.positions[pIdx + 1], rendererND.positions[pIdx + 2], this.options.baseSelection);
      }
    }
    this.options.getExtraInstances().forEach((inst, idx) => {
      if (!inst.visible) return;
      const pos = inst.renderer.positions;
      for (let i = 0; i < inst.M; i++) {
        const pIdx = i * 3;
        consider(pos[pIdx], pos[pIdx + 1], pos[pIdx + 2], idx);
      }
    });

    return bestDist2 < 35 * 35 ? bestInst : this.options.noSelection;
  }

  private selectNearestVertex(instIdx: number, mx: number, my: number, width: number, height: number) {
    const targetRenderer = instIdx === this.options.baseSelection
      ? this.options.getRendererND()
      : this.options.getExtraInstances()[instIdx].renderer;
    const posArr = targetRenderer.positions;
    let nearest = -1;
    let nearestD2 = Number.POSITIVE_INFINITY;
    const count = instIdx === this.options.baseSelection ? this.options.getM() : this.options.getExtraInstances()[instIdx].M;
    for (let i = 0; i < count; i++) {
      const pIdx = i * 3;
      this.tmpVec.set(posArr[pIdx], posArr[pIdx + 1], posArr[pIdx + 2]).project(this.options.camera);
      const sx = (this.tmpVec.x * 0.5 + 0.5) * width;
      const sy = (-this.tmpVec.y * 0.5 + 0.5) * height;
      const dx = sx - mx;
      const dy = sy - my;
      const d2 = dx * dx + dy * dy;
      if (d2 < nearestD2) {
        nearestD2 = d2;
        nearest = i;
      }
    }
    this.options.transformController.setSelectedVertex(nearest);
    this.options.placeVertexMarker(instIdx, nearest);
  }

  private pickPointOnTargetPlane(point: { clientX: number; clientY: number }) {
    const rect = this.options.renderer.domElement.getBoundingClientRect();
    this.options.ndc.set(
      ((point.clientX - rect.left) / rect.width) * 2 - 1,
      -((point.clientY - rect.top) / rect.height) * 2 + 1,
    );
    this.clickPlane.setFromNormalAndCoplanarPoint(this.options.camera.getWorldDirection(this.tmpVec).normalize(), this.options.controls.target);
    this.options.raycaster.setFromCamera(this.options.ndc, this.options.camera);
    const hit = this.options.raycaster.ray.intersectPlane(this.clickPlane, this.clickPoint);
    return hit ? this.clickPoint.clone() : this.options.controls.target.clone();
  }

  private appendTransformAction(menu: HTMLDivElement, label: string, mode: TransformMode, ev: MouseEvent) {
    const btn = document.createElement('button');
    btn.textContent = label;
    btn.onclick = () => {
      menu.style.display = 'none';
      this.options.transformController.start(mode, ev);
    };
    menu.appendChild(btn);
  }

  private endAxisShiftDrag() {
    if (!this.axisDrag.active) return;
    this.axisDrag.active = false;
    this.axisDrag.accum = 0;
    this.options.controls.enableZoom = this.axisDrag.prevZoom;
    this.options.controls.enablePan = this.axisDrag.prevPan;
  }

  private formatCoords(Nloc: number, coords: Float32Array, count: number, idx: number) {
    const parts: string[] = [];
    for (let d = 0; d < Nloc; d++) {
      const value = coords[d * count + idx];
      parts.push(`d${d}: ${value.toFixed(3)}`);
    }
    return parts;
  }
}
