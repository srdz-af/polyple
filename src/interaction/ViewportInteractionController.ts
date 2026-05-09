import * as THREE from 'three';
import type { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { cellCount, getCellBoundaryFaceIds, getCellVertices, type CellTopology } from '../geometry/cellTopology';
import type { PrimitiveKind } from '../geometry/primitives';
import type { HypercubeRenderer } from '../rendering/HypercubeRenderer';
import type { Instance, SceneLightKind, TransformMode } from '../scene/types';
import type { KeyboardCameraController } from '../controls/KeyboardCameraController';
import type { TransformController } from './TransformController';

type ViewportParams = {
  editMode: boolean;
};

type PrimitiveMenuOption = {
  label: string;
  kind: PrimitiveKind;
};

type LightMenuOption = {
  label: string;
  kind: SceneLightKind;
};

type DuplicatePlacementToken = unknown;
type EditExtrusionToken = unknown;
type EditBevelToken = unknown;

const OBJECT_FOCUS_DOUBLE_CLICK_MS = 220;
const OBJECT_FOCUS_DOUBLE_CLICK_MAX_DIST = 8;
const CELL_CENTER_PICK_RADIUS = 16;
const CELL_CENTER_FALLBACK_RADIUS = 48;
const CELL_CYCLE_MAX_DIST = 10;
const BEVEL_MIN_SMOOTHNESS = 1;
const BEVEL_MAX_SMOOTHNESS = 32;

type CellPickCandidate = {
  cellId: number;
  vertices: number[];
  center: THREE.Vector2;
  depth: number;
  centerDist2: number;
  contains: boolean;
};

type ViewportInteractionControllerOptions = {
  renderer: THREE.WebGLRenderer;
  camera: THREE.PerspectiveCamera;
  controls: OrbitControls;
  raycaster: THREE.Raycaster;
  ndc: THREE.Vector2;
  contextMenuEl: HTMLDivElement | null;
  keyboardCamera: KeyboardCameraController;
  transformController: TransformController;
  primitiveMenuOptions: PrimitiveMenuOption[];
  lightMenuOptions: LightMenuOption[];
  baseSelection: number;
  noSelection: number;
  getParams: () => ViewportParams;
  getN: () => number;
  getX: () => Float32Array;
  getM: () => number;
  getBaseVisible: () => boolean;
  getSelectedInstance: () => number;
  getRendererND: () => HypercubeRenderer;
  getExtraInstances: () => Instance[];
  selectObject: (idx: number, additive?: boolean) => void;
  pushUndoSnapshot: () => void;
  addPrimitiveInstanceAt: (kind: PrimitiveKind, label: string, offset: THREE.Vector3, syncMode?: boolean) => void;
  addSceneLightAt: (kind: SceneLightKind, position: THREE.Vector3) => void;
  startDuplicatePlacement: (position: THREE.Vector3) => DuplicatePlacementToken | null;
  moveDuplicatePlacement: (token: DuplicatePlacementToken, position: THREE.Vector3) => void;
  commitDuplicatePlacement: (token: DuplicatePlacementToken) => void;
  cancelDuplicatePlacement: (token: DuplicatePlacementToken) => void;
  extrudeSelectedEditCell: () => EditExtrusionToken | null;
  commitEditExtrusion: (token: EditExtrusionToken) => void;
  cancelEditExtrusion: (token: EditExtrusionToken) => void;
  startEditBevel: (smoothness: number, kind?: 'vertex' | 'edge') => EditBevelToken | null;
  updateEditBevel: (token: EditBevelToken, amount: number, smoothness: number) => void;
  commitEditBevel: (token: EditBevelToken) => void;
  cancelEditBevel: (token: EditBevelToken) => void;
  insertKeyframe: () => void;
  removeLastKeyframe: () => void;
  deleteSelected: () => void;
  deleteSelectedEditCell: () => void;
  hasActiveSelection: () => boolean;
  canAddProductMesh: () => boolean;
  addProductMesh: () => void;
  recalculateSelectedOrigin: () => void;
  focusObjectOrigin: (idx: number) => void;
  cycleAxes: (step: number) => void;
};

export class ViewportInteractionController {
  private readonly clickPlane = new THREE.Plane();
  private readonly clickPoint = new THREE.Vector3();
  private readonly tmpVec = new THREE.Vector3();
  private readonly tmpVec2 = new THREE.Vector2();
  private lastPointer = { x: window.innerWidth - 180, y: window.innerHeight - 80 };
  private deletePending = false;
  private readonly lastObjectClick = {
    time: Number.NEGATIVE_INFINITY,
    x: 0,
    y: 0,
    instIdx: Number.NaN,
  };
  private readonly cellSelectionCycle = {
    instIdx: Number.NaN,
    dimension: -1,
    x: 0,
    y: 0,
    signature: '',
    index: -1,
  };
  private readonly axisDrag = {
    active: false,
    lastX: 0,
    accum: 0,
    prevZoom: true,
    prevPan: true,
  };
  private transformGizmoPrevControlsEnabled = true;
  private duplicatePlacement: {
    token: DuplicatePlacementToken;
    prevControlsEnabled: boolean;
  } | null = null;
  private editExtrusion: {
    token: EditExtrusionToken;
  } | null = null;
  private editBevel: {
    token: EditBevelToken;
    smoothness: number;
    amount: number;
    startX: number;
    startY: number;
  } | null = null;
  private suppressNextContextMenu = false;

  constructor(private readonly options: ViewportInteractionControllerOptions) {}

  bind() {
    const canvas = this.options.renderer.domElement;
    canvas.addEventListener('pointermove', ev => this.handleTransformPointerMove(ev));
    canvas.addEventListener('contextmenu', ev => this.handleContextMenu(ev));
    canvas.addEventListener('mousedown', ev => this.handleMiddleMouseDown(ev), { capture: true });
    canvas.addEventListener('pointerdown', ev => this.handlePointerDown(ev));
    canvas.addEventListener('wheel', ev => this.handleWheel(ev), { passive: false, capture: true });

    window.addEventListener('click', ev => this.hideContextMenuIfIdle(ev));
    window.addEventListener('pointerdown', ev => this.handleWindowPointerDown(ev), { capture: true });
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
    menu.classList.remove('submenu-left');
    menu.classList.add('primitive-menu');
    const spawnPoint = this.pickPointOnTargetPlane({ clientX: this.lastPointer.x, clientY: this.lastPointer.y });
    this.appendKeyframeActions(menu);
    this.appendMenuSeparator(menu);
    this.appendPrimitiveButtons(menu, spawnPoint, false);
    this.appendMenuSeparator(menu);
    this.appendLightButtons(menu, spawnPoint);
    this.placeMenu(menu, this.lastPointer.x, this.lastPointer.y, 196, 0, 380);
    menu.style.display = 'grid';
  }

  startTransformFromLastPointer(mode: TransformMode) {
    this.options.transformController.startFromPointer(mode, this.lastPointer);
  }

  startEditExtrusionFromLastPointer() {
    if (this.editExtrusion || this.duplicatePlacement) return;
    if (!this.options.getParams().editMode) return;
    if (this.options.transformController.isActive() || this.options.transformController.isGizmoDragging()) return;
    const token = this.options.extrudeSelectedEditCell();
    if (!token) return;
    this.options.transformController.startFromPointer('move', this.lastPointer);
    if (!this.options.transformController.isActive()) {
      this.options.cancelEditExtrusion(token);
      return;
    }
    this.editExtrusion = { token };
  }

  startEditBevelFromLastPointer(kind: 'vertex' | 'edge' = 'edge') {
    if (this.editBevel || this.editExtrusion || this.duplicatePlacement) return;
    if (!this.options.getParams().editMode) return;
    if (this.options.transformController.isActive() || this.options.transformController.isGizmoDragging()) return;
    const smoothness = BEVEL_MIN_SMOOTHNESS;
    const token = this.options.startEditBevel(smoothness, kind);
    if (!token) return;
    this.editBevel = {
      token,
      smoothness,
      amount: 0,
      startX: this.lastPointer.x,
      startY: this.lastPointer.y,
    };
  }

  startDuplicateFromLastPointer() {
    if (this.duplicatePlacement || this.options.getParams().editMode) return;
    if (this.options.transformController.isActive() || this.options.transformController.isGizmoDragging()) return;
    const point = this.pickPointOnTargetPlane({ clientX: this.lastPointer.x, clientY: this.lastPointer.y });
    const token = this.options.startDuplicatePlacement(point);
    if (!token) return;
    if (this.options.contextMenuEl) this.options.contextMenuEl.style.display = 'none';
    this.duplicatePlacement = {
      token,
      prevControlsEnabled: this.options.controls.enabled,
    };
    this.options.controls.enabled = false;
  }

  isDuplicatePlacementActive() {
    return this.duplicatePlacement !== null;
  }

  handleTransformConstraintKey(key: string) {
    const transformController = this.options.transformController;
    if (!transformController.isActive()) return false;
    return transformController.handleConstraintKey(key);
  }

  deleteOrConfirmSelection() {
    if (!this.hasDeleteTarget()) return;
    if (this.deletePending) {
      this.deletePending = false;
      if (this.options.contextMenuEl) this.options.contextMenuEl.style.display = 'none';
      this.deleteCurrentTarget();
    } else {
      this.showDeleteConfirm();
    }
  }

  private hasDeleteTarget() {
    return this.hasEditCellDeleteTarget() || this.options.hasActiveSelection();
  }

  private hasEditCellDeleteTarget() {
    return this.options.getParams().editMode && this.options.transformController.hasEditSelection();
  }

  private deleteCurrentTarget() {
    if (this.hasEditCellDeleteTarget()) this.options.deleteSelectedEditCell();
    else this.options.deleteSelected();
  }

  private showDeleteConfirm(ev?: MouseEvent) {
    const menu = this.options.contextMenuEl;
    if (!menu) return;
    this.deletePending = true;
    menu.replaceChildren();

    const confirm = document.createElement('button');
    confirm.textContent = 'Delete';
    confirm.onclick = () => {
      menu.style.display = 'none';
      this.deletePending = false;
      this.deleteCurrentTarget();
    };

    menu.append(confirm);
    const x = ev?.clientX ?? this.lastPointer.x;
    const y = ev?.clientY ?? this.lastPointer.y;
    menu.style.left = `${x}px`;
    menu.style.top = `${y}px`;
    menu.style.display = 'block';
  }

  private handleTransformPointerMove(ev: PointerEvent) {
    this.lastPointer = { x: ev.clientX, y: ev.clientY };
    if (this.updateEditBevel(ev)) return;
    if (this.updateDuplicatePlacement(ev)) return;
    if (this.options.transformController.isGizmoDragging()) return;
    if (!this.options.transformController.isActive()) return;
    ev.preventDefault();
    this.options.transformController.applyPointer(ev.clientX, ev.clientY);
  }

  private handleContextMenu(ev: MouseEvent) {
    if (this.suppressNextContextMenu) {
      this.suppressNextContextMenu = false;
      ev.preventDefault();
      ev.stopPropagation();
      return;
    }

    if (this.editBevel) {
      ev.preventDefault();
      this.finishEditBevel(false);
      return;
    }

    if (this.duplicatePlacement) {
      ev.preventDefault();
      this.finishDuplicatePlacement(false);
      return;
    }

    const menu = this.options.contextMenuEl;
    if (!menu) return;

    ev.preventDefault();
    this.lastPointer = { x: ev.clientX, y: ev.clientY };
    this.deletePending = false;
    menu.replaceChildren();
    menu.classList.remove('primitive-menu', 'submenu-left');
    const spawnPoint = this.pickPointOnTargetPlane(ev);

    if (this.options.getParams().editMode) {
      if (!this.options.transformController.hasEditSelection()) return;
      const label = this.options.transformController.editSelectionLabel();
      this.appendTransformAction(menu, `Move ${label}`, 'move', ev);
      this.appendTransformAction(menu, `Rotate ${label}`, 'rotate', ev);
      this.appendTransformAction(menu, `Scale ${label}`, 'scale', ev);
    } else if (!this.options.hasActiveSelection()) {
      menu.classList.add('primitive-menu');
      this.appendKeyframeActions(menu);
      this.appendMenuSeparator(menu);
      this.appendPrimitiveButtons(menu, spawnPoint);
      this.appendMenuSeparator(menu);
      this.appendLightButtons(menu, spawnPoint);
    } else {
      this.appendTransformAction(menu, 'Move', 'move', ev);
      this.appendTransformAction(menu, 'Rotate', 'rotate', ev);
      this.appendTransformAction(menu, 'Scale', 'scale', ev);
      if (this.options.canAddProductMesh()) {
        const productButton = document.createElement('button');
        productButton.textContent = 'Add product mesh';
        productButton.onclick = () => {
          menu.style.display = 'none';
          this.options.addProductMesh();
        };
        menu.appendChild(productButton);
      }
      const recalculateOriginButton = document.createElement('button');
      recalculateOriginButton.textContent = 'Recalculate origin';
      recalculateOriginButton.onclick = () => {
        menu.style.display = 'none';
        this.options.recalculateSelectedOrigin();
      };
      menu.appendChild(recalculateOriginButton);
      const deleteButton = document.createElement('button');
      deleteButton.textContent = 'Delete';
      deleteButton.onclick = clickEvent => {
        clickEvent.stopPropagation();
        this.showDeleteConfirm(ev);
      };
      menu.appendChild(deleteButton);
    }

    const primitiveMenu = menu.classList.contains('primitive-menu');
    this.placeMenu(menu, ev.clientX, ev.clientY, primitiveMenu ? 196 : 180, 0, primitiveMenu ? 380 : 150);
    menu.style.display = menu.childElementCount ? (primitiveMenu ? 'grid' : 'block') : 'none';
  }

  private placeMenu(
    menu: HTMLDivElement,
    clientX: number,
    clientY: number,
    estimatedWidth: number,
    estimatedSubmenuWidth = 0,
    estimatedHeight = 150,
  ) {
    const x = Math.max(12, Math.min(clientX, window.innerWidth - estimatedWidth - 12));
    const y = Math.max(12, Math.min(clientY, window.innerHeight - estimatedHeight));
    menu.style.left = `${x}px`;
    menu.style.top = `${y}px`;
    menu.classList.toggle('submenu-left', x + estimatedWidth + estimatedSubmenuWidth + 18 > window.innerWidth);
  }

  private appendKeyframeActions(menu: HTMLDivElement) {
    const insert = document.createElement('button');
    insert.textContent = 'Insert keyframe';
    insert.onclick = () => {
      menu.style.display = 'none';
      this.options.insertKeyframe();
    };

    const remove = document.createElement('button');
    remove.textContent = 'Remove last keyframe';
    remove.onclick = () => {
      menu.style.display = 'none';
      this.options.removeLastKeyframe();
    };

    menu.append(insert, remove);
  }

  private appendMenuSeparator(menu: HTMLDivElement) {
    const separator = document.createElement('div');
    separator.className = 'context-menu-separator';
    menu.appendChild(separator);
  }

  private appendPrimitiveButtons(container: HTMLElement, spawnPoint: THREE.Vector3, syncMode = true) {
    const menu = this.options.contextMenuEl;
    for (const opt of this.options.primitiveMenuOptions) {
      const btn = document.createElement('button');
      btn.textContent = opt.label;
      btn.onclick = () => {
        if (menu) menu.style.display = 'none';
        this.options.pushUndoSnapshot();
        this.options.addPrimitiveInstanceAt(opt.kind, `${opt.label} #${this.options.getExtraInstances().length + 1}`, spawnPoint, syncMode);
      };
      container.appendChild(btn);
    }
  }

  private appendLightButtons(container: HTMLElement, spawnPoint: THREE.Vector3) {
    const menu = this.options.contextMenuEl;
    for (const opt of this.options.lightMenuOptions) {
      const btn = document.createElement('button');
      btn.textContent = opt.label;
      btn.onclick = () => {
        if (menu) menu.style.display = 'none';
        this.options.pushUndoSnapshot();
        this.options.addSceneLightAt(opt.kind, spawnPoint);
      };
      container.appendChild(btn);
    }
  }

  private handleMiddleMouseDown(ev: MouseEvent) {
    if (ev.button !== 1) return;
    if (this.editBevel) {
      ev.preventDefault();
      ev.stopPropagation();
      return;
    }
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

    if (this.duplicatePlacement) {
      if (ev.button === 0) this.finishDuplicatePlacement(true);
      else if (ev.button === 2) this.finishDuplicatePlacement(false);
      ev.preventDefault();
      ev.stopPropagation();
      return;
    }

    if (ev.button === 0 && this.options.transformController.handleGizmoPointerDown(ev)) {
      this.transformGizmoPrevControlsEnabled = this.options.controls.enabled;
      this.options.controls.enabled = false;
      return;
    }

    if (this.options.transformController.isActive()) {
      if (ev.button === 0) {
        if (this.editExtrusion) {
          this.options.commitEditExtrusion(this.editExtrusion.token);
          this.editExtrusion = null;
        } else {
          this.options.pushUndoSnapshot();
        }
        this.options.transformController.finish(true);
      } else if (ev.button === 2) {
        this.options.transformController.finish(false);
        if (this.editExtrusion) {
          this.options.cancelEditExtrusion(this.editExtrusion.token);
          this.editExtrusion = null;
        }
      }
      ev.preventDefault();
      return;
    }

    if (ev.button !== 0) return;
    const selected = this.selectObjectFromPointer(ev);
    if (this.options.getParams().editMode) {
      ev.preventDefault();
      this.resetLastObjectClick();
      return;
    }
    if (!ev.shiftKey && selected !== this.options.noSelection && this.isObjectFocusDoubleClick(ev, selected)) {
      ev.preventDefault();
      this.options.focusObjectOrigin(selected);
      this.resetLastObjectClick();
    } else {
      this.recordObjectClick(ev, selected);
    }
  }

  private handleWindowPointerDown(ev: PointerEvent) {
    if (!this.editBevel) return;
    this.lastPointer = { x: ev.clientX, y: ev.clientY };
    if (ev.button === 0) {
      this.finishEditBevel(true);
    } else if (ev.button === 2) {
      this.suppressNextContextMenu = true;
      this.finishEditBevel(false);
    } else {
      return;
    }
    ev.preventDefault();
    ev.stopPropagation();
    ev.stopImmediatePropagation();
  }

  private handleWindowPointerMove(ev: PointerEvent) {
    if (this.updateEditBevel(ev)) return;
    if (this.updateDuplicatePlacement(ev)) return;
    if (this.options.transformController.handleGizmoPointerMove(ev, point => { this.lastPointer = point; })) return;
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
    if (this.duplicatePlacement && ev.button === 0) {
      this.finishDuplicatePlacement(true);
      ev.preventDefault();
      return;
    }
    if (this.options.transformController.handleGizmoPointerEnd(ev, true)) {
      this.options.controls.enabled = this.transformGizmoPrevControlsEnabled;
      return;
    }
    if (this.axisDrag.active) this.endAxisShiftDrag();
  }

  private handleWindowPointerCancel(ev: PointerEvent) {
    if (this.editBevel) {
      this.finishEditBevel(false);
      ev.preventDefault();
      return;
    }

    if (this.duplicatePlacement) {
      this.finishDuplicatePlacement(false);
      ev.preventDefault();
      return;
    }
    if (this.options.transformController.handleGizmoPointerEnd(ev, false)) {
      this.options.controls.enabled = this.transformGizmoPrevControlsEnabled;
      return;
    }
    if (this.editExtrusion && this.options.transformController.isActive()) {
      this.options.transformController.finish(false);
      this.options.cancelEditExtrusion(this.editExtrusion.token);
      this.editExtrusion = null;
      return;
    }
    if (this.axisDrag.active) this.endAxisShiftDrag();
  }

  private handleWindowBlur() {
    if (this.editBevel) this.finishEditBevel(false);
    if (this.duplicatePlacement) this.finishDuplicatePlacement(false);
    if (this.options.transformController.cancelGizmoDrag()) {
      this.options.controls.enabled = this.transformGizmoPrevControlsEnabled;
    }
    if (this.editExtrusion && this.options.transformController.isActive()) {
      this.options.transformController.finish(false);
      this.options.cancelEditExtrusion(this.editExtrusion.token);
      this.editExtrusion = null;
    }
    if (this.axisDrag.active) this.endAxisShiftDrag();
    this.options.keyboardCamera.clearKeys();
  }

  private hideContextMenuIfIdle(ev: MouseEvent) {
    const menu = this.options.contextMenuEl;
    const target = ev.target;
    if (this.editBevel) return;
    if (this.deletePending && target instanceof Node && menu?.contains(target)) return;
    if (menu) menu.style.display = 'none';
    this.deletePending = false;
  }

  private updateDuplicatePlacement(point: { clientX: number; clientY: number }) {
    if (!this.duplicatePlacement) return false;
    this.lastPointer = { x: point.clientX, y: point.clientY };
    this.options.moveDuplicatePlacement(this.duplicatePlacement.token, this.pickPointOnTargetPlane(point));
    return true;
  }

  private finishDuplicatePlacement(commit: boolean) {
    const placement = this.duplicatePlacement;
    if (!placement) return;
    this.duplicatePlacement = null;
    this.options.controls.enabled = placement.prevControlsEnabled;
    if (commit) this.options.commitDuplicatePlacement(placement.token);
    else this.options.cancelDuplicatePlacement(placement.token);
  }

  private handleWheel(ev: WheelEvent) {
    if (!this.editBevel) return;
    ev.preventDefault();
    ev.stopPropagation();
    ev.stopImmediatePropagation();

    const step = ev.deltaY < 0 ? 1 : -1;
    const smoothness = Math.max(
      BEVEL_MIN_SMOOTHNESS,
      Math.min(BEVEL_MAX_SMOOTHNESS, this.editBevel.smoothness + step),
    );
    if (smoothness === this.editBevel.smoothness) return;

    this.editBevel.smoothness = smoothness;
    this.options.updateEditBevel(this.editBevel.token, this.editBevel.amount, smoothness);
  }

  private updateEditBevel(point: { clientX: number; clientY: number }) {
    if (!this.editBevel) return false;
    this.lastPointer = { x: point.clientX, y: point.clientY };
    const dx = point.clientX - this.editBevel.startX;
    const dy = this.editBevel.startY - point.clientY;
    const amount = Math.max(0, Math.min(0.995, (dx + dy) * 0.004));
    if (Math.abs(amount - this.editBevel.amount) < 0.0005) return true;
    this.editBevel.amount = amount;
    this.options.updateEditBevel(this.editBevel.token, amount, this.editBevel.smoothness);
    return true;
  }

  private finishEditBevel(commit: boolean) {
    const bevel = this.editBevel;
    if (!bevel) return;
    this.editBevel = null;
    if (this.options.contextMenuEl) this.options.contextMenuEl.style.display = 'none';
    if (commit) this.options.commitEditBevel(bevel.token);
    else this.options.cancelEditBevel(bevel.token);
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
    if (M > 0 && this.options.getBaseVisible()) {
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
      this.options.selectObject(this.options.noSelection, ev.shiftKey);
      return this.options.noSelection;
    }

    const additive = ev.shiftKey && !this.options.getParams().editMode;
    this.options.selectObject(bestInst, additive);
    if (this.options.getParams().editMode) this.selectNearestEditElement(bestInst, mx, my, w, h, ev.altKey);
    return bestInst;
  }

  private isObjectFocusDoubleClick(ev: PointerEvent, instIdx: number) {
    const now = performance.now();
    const dt = now - this.lastObjectClick.time;
    const dx = ev.clientX - this.lastObjectClick.x;
    const dy = ev.clientY - this.lastObjectClick.y;
    return this.lastObjectClick.instIdx === instIdx
      && dt > 0
      && dt <= OBJECT_FOCUS_DOUBLE_CLICK_MS
      && ((dx * dx) + (dy * dy)) <= OBJECT_FOCUS_DOUBLE_CLICK_MAX_DIST * OBJECT_FOCUS_DOUBLE_CLICK_MAX_DIST;
  }

  private recordObjectClick(ev: PointerEvent, instIdx: number) {
    this.lastObjectClick.time = performance.now();
    this.lastObjectClick.x = ev.clientX;
    this.lastObjectClick.y = ev.clientY;
    this.lastObjectClick.instIdx = instIdx;
  }

  private resetLastObjectClick() {
    this.lastObjectClick.time = Number.NEGATIVE_INFINITY;
    this.lastObjectClick.instIdx = Number.NaN;
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

  private selectNearestEditElement(instIdx: number, mx: number, my: number, width: number, height: number, forceCycle = false) {
    const dimension = this.options.transformController.getEditCellDimension();
    if (dimension === 1) {
      this.selectNearestEdge(instIdx, mx, my, width, height);
      return;
    }
    if (dimension >= 2) {
      this.selectNearestCell(instIdx, dimension, mx, my, width, height, forceCycle);
      return;
    }
    this.selectNearestVertex(instIdx, mx, my, width, height);
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
    this.options.transformController.setSelectedEditElement(0, nearest >= 0 ? [nearest] : [], nearest);
    this.options.transformController.updateVertexCloud(instIdx);
  }

  private selectNearestEdge(instIdx: number, mx: number, my: number, width: number, height: number) {
    const targetRenderer = instIdx === this.options.baseSelection
      ? this.options.getRendererND()
      : this.options.getExtraInstances()[instIdx]?.renderer;
    if (!targetRenderer) return;

    const topology = targetRenderer.getCellTopologyForSelection();
    const posArr = targetRenderer.positions;
    let best: [number, number] | null = null;
    let bestCellId = -1;
    let bestD2 = Number.POSITIVE_INFINITY;
    const a = new THREE.Vector2();
    const b = new THREE.Vector2();
    const point = new THREE.Vector2(mx, my);

    const edgeCount = cellCount(topology, 1);
    for (let cellId = 0; cellId < edgeCount; cellId++) {
      const edge = getCellVertices(topology, 1, cellId);
      if (edge.length < 2) continue;
      const va = edge[0];
      const vb = edge[1];
      this.projectVertexToScreen(posArr, va, width, height, a);
      this.projectVertexToScreen(posArr, vb, width, height, b);
      const d2 = this.distancePointToSegmentSquared(point, a, b);
      if (d2 < bestD2) {
        bestD2 = d2;
        best = [va, vb];
        bestCellId = cellId;
      }
    }

    if (best && bestD2 < 32 * 32) {
      this.options.transformController.setSelectedEditElement(1, best, bestCellId);
    } else {
      this.options.transformController.clearEditSelection();
    }
    this.options.transformController.updateVertexCloud(instIdx);
  }

  private selectNearestCell(
    instIdx: number,
    dimension: number,
    mx: number,
    my: number,
    width: number,
    height: number,
    forceCycle = false,
  ) {
    const targetRenderer = instIdx === this.options.baseSelection
      ? this.options.getRendererND()
      : this.options.getExtraInstances()[instIdx]?.renderer;
    if (!targetRenderer) return;
    const topology = targetRenderer.getCellTopologyForSelection();
    if (!topology || cellCount(topology, dimension) <= 0) {
      this.options.transformController.clearEditSelection();
      this.options.transformController.updateVertexCloud(instIdx);
      return;
    }

    const point = new THREE.Vector2(mx, my);
    const posArr = targetRenderer.positions;
    const candidates = this.cellPickCandidates(topology, dimension, posArr, point, width, height);
    if (candidates.length) {
      const selected = this.selectCellCandidateFromCycle(instIdx, dimension, mx, my, candidates, forceCycle);
      this.options.transformController.setSelectedEditElement(dimension, selected.vertices, selected.cellId);
    } else {
      this.options.transformController.clearEditSelection();
    }
    this.options.transformController.updateVertexCloud(instIdx);
  }

  private cellPickCandidates(
    topology: CellTopology,
    dimension: number,
    positions: Float32Array,
    point: THREE.Vector2,
    width: number,
    height: number,
  ) {
    const all: CellPickCandidate[] = [];
    const count = cellCount(topology, dimension);
    for (let cellId = 0; cellId < count; cellId++) {
      const vertices = getCellVertices(topology, dimension, cellId);
      if (!vertices.length) continue;
      const screenSum = new THREE.Vector2();
      const worldSum = new THREE.Vector3();
      let validCount = 0;
      for (const vertex of vertices) {
        const pIdx = vertex * 3;
        if (pIdx < 0 || pIdx + 2 >= positions.length) continue;
        this.projectVertexToScreen(positions, vertex, width, height, this.tmpVec2);
        screenSum.add(this.tmpVec2);
        worldSum.x += positions[pIdx];
        worldSum.y += positions[pIdx + 1];
        worldSum.z += positions[pIdx + 2];
        validCount++;
      }
      if (validCount <= 0) continue;
      const center = screenSum.multiplyScalar(1 / validCount);
      const worldCenter = worldSum.multiplyScalar(1 / validCount);
      const depth = worldCenter.applyMatrix4(this.options.camera.matrixWorldInverse).z;
      all.push({
        cellId,
        vertices,
        center,
        depth,
        centerDist2: center.distanceToSquared(point),
        contains: dimension === 2
          ? this.cellContainsPoint(topology, dimension, cellId, vertices, positions, point, width, height)
          : false,
      });
    }

    const centerHits = all
      .filter(candidate => candidate.centerDist2 <= CELL_CENTER_PICK_RADIUS * CELL_CENTER_PICK_RADIUS)
      .sort((a, b) => (a.centerDist2 - b.centerDist2) || (b.depth - a.depth));
    if (centerHits.length) return centerHits;

    const areaHits = all
      .filter(candidate => candidate.contains)
      .sort((a, b) => b.depth - a.depth);
    if (areaHits.length) return areaHits;

    const nearest = all.sort((a, b) => a.centerDist2 - b.centerDist2)[0];
    return nearest?.centerDist2 <= CELL_CENTER_FALLBACK_RADIUS * CELL_CENTER_FALLBACK_RADIUS ? [nearest] : [];
  }

  private selectCellCandidateFromCycle(
    instIdx: number,
    dimension: number,
    mx: number,
    my: number,
    candidates: CellPickCandidate[],
    forceCycle: boolean,
  ) {
    const signature = candidates.map(candidate => candidate.cellId).join(':');
    const dx = mx - this.cellSelectionCycle.x;
    const dy = my - this.cellSelectionCycle.y;
    const sameStack = this.cellSelectionCycle.instIdx === instIdx
      && this.cellSelectionCycle.dimension === dimension
      && this.cellSelectionCycle.signature === signature
      && ((dx * dx) + (dy * dy)) <= CELL_CYCLE_MAX_DIST * CELL_CYCLE_MAX_DIST;

    let index = 0;
    if (candidates.length > 1 && (forceCycle || sameStack)) {
      index = sameStack
        ? (this.cellSelectionCycle.index + 1) % candidates.length
        : 1 % candidates.length;
    }

    this.cellSelectionCycle.instIdx = instIdx;
    this.cellSelectionCycle.dimension = dimension;
    this.cellSelectionCycle.x = mx;
    this.cellSelectionCycle.y = my;
    this.cellSelectionCycle.signature = signature;
    this.cellSelectionCycle.index = index;
    return candidates[index];
  }

  private cellContainsPoint(
    topology: CellTopology,
    dimension: number,
    cellId: number,
    vertices: number[],
    positions: Float32Array,
    point: THREE.Vector2,
    width: number,
    height: number,
  ) {
    if (dimension === 2) {
      return this.faceVerticesContainPoint(vertices, positions, point, width, height);
    }

    const boundaryFaceIds = getCellBoundaryFaceIds(topology, dimension, cellId);
    for (const faceId of boundaryFaceIds) {
      const faceVertices = getCellVertices(topology, 2, faceId);
      if (faceVertices.length < 3) continue;
      if (this.faceVerticesContainPoint(faceVertices, positions, point, width, height)) return true;
    }
    return false;
  }

  private faceVerticesContainPoint(
    vertices: number[],
    positions: Float32Array,
    point: THREE.Vector2,
    width: number,
    height: number,
  ) {
    if (vertices.length < 3) return false;
    const a = new THREE.Vector2();
    const b = new THREE.Vector2();
    const c = new THREE.Vector2();
    this.projectVertexToScreen(positions, vertices[0], width, height, a);
    for (let i = 1; i < vertices.length - 1; i++) {
      this.projectVertexToScreen(positions, vertices[i], width, height, b);
      this.projectVertexToScreen(positions, vertices[i + 1], width, height, c);
      if (this.pointInTriangle(point, a, b, c)) return true;
    }
    return false;
  }

  private projectVertexToScreen(
    positions: Float32Array,
    vertex: number,
    width: number,
    height: number,
    target: THREE.Vector2,
  ) {
    const pIdx = vertex * 3;
    this.tmpVec.set(positions[pIdx], positions[pIdx + 1], positions[pIdx + 2]).project(this.options.camera);
    return target.set((this.tmpVec.x * 0.5 + 0.5) * width, (-this.tmpVec.y * 0.5 + 0.5) * height);
  }

  private distancePointToSegmentSquared(point: THREE.Vector2, a: THREE.Vector2, b: THREE.Vector2) {
    const ab = b.clone().sub(a);
    const denom = ab.lengthSq();
    if (denom <= 1e-8) return point.distanceToSquared(a);
    const t = Math.max(0, Math.min(1, point.clone().sub(a).dot(ab) / denom));
    return point.distanceToSquared(a.clone().add(ab.multiplyScalar(t)));
  }

  private pointInTriangle(point: THREE.Vector2, a: THREE.Vector2, b: THREE.Vector2, c: THREE.Vector2) {
    const area = (p1: THREE.Vector2, p2: THREE.Vector2, p3: THREE.Vector2) => (
      ((p1.x * (p2.y - p3.y)) + (p2.x * (p3.y - p1.y)) + (p3.x * (p1.y - p2.y))) * 0.5
    );
    const total = Math.abs(area(a, b, c));
    if (total < 1e-6) return false;
    const sum = Math.abs(area(point, b, c)) + Math.abs(area(a, point, c)) + Math.abs(area(a, b, point));
    return Math.abs(sum - total) <= Math.max(0.5, total * 0.02);
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
    btn.disabled = !this.options.transformController.canUseTransformMode(mode);
    if (btn.disabled) btn.title = 'Vertex selections can only be moved';
    btn.onclick = () => {
      if (!this.options.transformController.canUseTransformMode(mode)) return;
      menu.style.display = 'none';
      this.options.transformController.setTransformMode(mode);
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

}
