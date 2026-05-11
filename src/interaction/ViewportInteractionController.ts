import * as THREE from 'three';
import type { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { cellCount, getCellBoundaryFaceIds, getCellVertices, type CellTopology } from '../geometry/cellTopology';
import type { PrimitiveKind } from '../geometry/primitives';
import type { HypercubeRenderer } from '../rendering/HypercubeRenderer';
import type { Instance, SceneLightKind, TransformMode } from '../scene/types';
import type { KeyboardCameraController } from '../controls/KeyboardCameraController';
import type { TransformController } from './TransformController';
import { ViewportOperationManager, type ViewportOperation, type ViewportPointerPoint } from './ViewportOperationManager';

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

export function viewportContextMenuFromDocument() {
  return document.getElementById('context-menu') as HTMLDivElement | null;
}

export type EditOperationMode = 'grouped' | 'individual';
export type ViewportAmountOperation = Omit<ViewportOperation, 'updatePointer' | 'updateWheel'> & {
  updateAmount: (amount: number) => void;
  updateWheel?: (ev: WheelEvent, amount: number) => boolean | void;
};

const OBJECT_FOCUS_DOUBLE_CLICK_MS = 220;
const OBJECT_FOCUS_DOUBLE_CLICK_MAX_DIST = 8;
const OBJECT_VERTEX_PICK_RADIUS = 24;
const OBJECT_EDGE_PICK_RADIUS = 12;
const VIRTUAL_CURSOR_SIZE_PX = 10;
const CELL_CENTER_PICK_RADIUS = 16;
const CELL_CENTER_FALLBACK_RADIUS = 48;
const CELL_CYCLE_MAX_DIST = 10;
const BEVEL_MIN_SMOOTHNESS = 1;
const BEVEL_MAX_SMOOTHNESS = 32;
const INSET_MAX_AMOUNT = 0.85;
const INSET_INITIAL_AMOUNT = 0.18;
const INSET_POINTER_SCALE = 0.0025;
const BEVEL_POINTER_SCALE = 0.004;
const EXTRUSION_POINTER_SCALE = 0.01;
const OPERATION_HANDLE_BASE_LENGTH = 42;
const OPERATION_HANDLE_MAX_EXTRA_LENGTH = 58;
const OPERATION_HANDLE_DOT_SIZE = 10;
const OPERATION_HANDLE_LINE_WIDTH = 2;

type CellPickCandidate = {
  cellId: number;
  vertices: number[];
  center: THREE.Vector2;
  depth: number;
  centerDist2: number;
  contains: boolean;
};

type ScalarEditOperationOptions = {
  initialAmount?: number;
  scale: number;
  signed?: boolean;
  min?: number;
  max?: number;
  epsilon?: number;
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
  createDuplicatePlacementOperation: (
    position: THREE.Vector3,
    pickPosition: (point: ViewportPointerPoint) => THREE.Vector3,
  ) => ViewportOperation | null;
  createEditExtrusionOperation: (mode?: EditOperationMode) => ViewportAmountOperation | null;
  createEditInsetOperation: (mode?: EditOperationMode) => ViewportAmountOperation | null;
  createEditBevelOperation: (
    smoothness: number,
    kind?: 'vertex' | 'edge',
    inward?: boolean,
    mode?: EditOperationMode,
    setSmoothness?: (smoothness: number) => void,
  ) => ViewportAmountOperation | null;
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
  private readonly operationManager = new ViewportOperationManager();
  private transformGizmoPrevControlsEnabled = true;
  private transformGizmoEndEvent: PointerEvent | null = null;
  private lastBevelSmoothness = BEVEL_MIN_SMOOTHNESS;
  private suppressNextContextMenu = false;
  private pointerLockReleaseRequested = false;
  private readonly pointerLockStart = { x: this.lastPointer.x, y: this.lastPointer.y };
  private readonly pointerLockPoint = { clientX: this.lastPointer.x, clientY: this.lastPointer.y };
  private virtualCursorEl: HTMLDivElement | null = null;
  private scalarEditHandle: {
    root: HTMLDivElement;
    line: HTMLDivElement;
    dot: HTMLDivElement;
  } | null = null;

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
    document.addEventListener('pointerlockchange', () => this.handlePointerLockChange());
  }

  cancelAxisShiftDrag() {
    if (this.operationManager.isKind('axis-shift')) this.operationManager.finish(false);
  }

  private prepareOperationStart(replaceActive = false) {
    if (!this.operationManager.isActive()) return true;
    if (!replaceActive) return false;
    this.operationManager.finish(false);
    return !this.operationManager.isActive();
  }

  private startViewportOperation(operation: ViewportOperation) {
    const usesPointerLock = Boolean(operation.usesPointerLock && this.canUseOperationPointerLock());
    const cleanup = operation.cleanup;
    const updatePointer = operation.updatePointer;
    const wrapped: ViewportOperation = {
      ...operation,
      usesPointerLock,
      updatePointer: updatePointer
        ? (point, ev) => {
          this.lastPointer = { x: point.clientX, y: point.clientY };
          return updatePointer(point, ev);
        }
        : undefined,
      cleanup: () => {
        if (usesPointerLock) this.releaseOperationPointerLock();
        cleanup?.();
      },
    };
    const started = this.operationManager.start(wrapped);
    if (started && usesPointerLock) this.requestOperationPointerLock();
    return started;
  }

  private canUseOperationPointerLock() {
    return window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  }

  private requestOperationPointerLock() {
    const canvas = this.options.renderer.domElement;
    this.pointerLockStart.x = this.lastPointer.x;
    this.pointerLockStart.y = this.lastPointer.y;
    this.pointerLockPoint.clientX = this.lastPointer.x;
    this.pointerLockPoint.clientY = this.lastPointer.y;
    this.showVirtualCursor();
    if (document.pointerLockElement === canvas) return;
    try {
      const lockResult = canvas.requestPointerLock();
      if (lockResult instanceof Promise) lockResult.catch(() => undefined);
    } catch {
      // Pointer lock is a progressive enhancement; normal bounded dragging remains available.
    }
  }

  private releaseOperationPointerLock() {
    this.hideVirtualCursor();
    const canvas = this.options.renderer.domElement;
    if (document.pointerLockElement !== canvas) return;
    this.pointerLockReleaseRequested = true;
    this.lastPointer = { x: this.pointerLockStart.x, y: this.pointerLockStart.y };
    try {
      document.exitPointerLock();
    } catch {
      this.pointerLockReleaseRequested = false;
    }
  }

  private handlePointerLockChange() {
    const canvas = this.options.renderer.domElement;
    if (document.pointerLockElement === canvas) return;
    if (this.pointerLockReleaseRequested) {
      this.pointerLockReleaseRequested = false;
      return;
    }
    if (this.operationManager.current?.usesPointerLock) this.operationManager.finish(false);
  }

  private operationPointerPoint(ev: PointerEvent) {
    if (document.pointerLockElement === this.options.renderer.domElement && this.operationManager.current?.usesPointerLock) {
      this.pointerLockPoint.clientX += ev.movementX || 0;
      this.pointerLockPoint.clientY += ev.movementY || 0;
      this.updateVirtualCursor();
      return this.pointerLockPoint;
    }
    this.pointerLockPoint.clientX = ev.clientX;
    this.pointerLockPoint.clientY = ev.clientY;
    if (this.operationManager.current?.usesPointerLock) this.updateVirtualCursor();
    return this.pointerLockPoint;
  }

  private showVirtualCursor() {
    const cursor = this.ensureVirtualCursor();
    cursor.style.display = 'block';
    this.updateVirtualCursor();
  }

  private hideVirtualCursor() {
    if (this.virtualCursorEl) this.virtualCursorEl.style.display = 'none';
  }

  private ensureVirtualCursor() {
    if (this.virtualCursorEl) return this.virtualCursorEl;
    const cursor = document.createElement('div');
    cursor.setAttribute('aria-hidden', 'true');
    cursor.className = 'material-symbols-rounded';
    cursor.textContent = 'drag_pan';
    Object.assign(cursor.style, {
      position: 'fixed',
      left: '0px',
      top: '0px',
      width: `${VIRTUAL_CURSOR_SIZE_PX}px`,
      height: `${VIRTUAL_CURSOR_SIZE_PX}px`,
      color: 'rgba(207, 241, 240, 0.98)',
      fontSize: `${VIRTUAL_CURSOR_SIZE_PX}px`,
      lineHeight: `${VIRTUAL_CURSOR_SIZE_PX}px`,
      fontVariationSettings: '"FILL" 0, "wght" 600, "GRAD" 0, "opsz" 20',
      textShadow: '0 0 2px rgba(25, 23, 15, 0.94), 0 0 4px rgba(25, 23, 15, 0.58)',
      boxSizing: 'border-box',
      display: 'none',
      pointerEvents: 'none',
      transform: 'translate(-50%, -50%)',
      zIndex: '2147483647',
    });
    document.body.append(cursor);
    this.virtualCursorEl = cursor;
    return cursor;
  }

  private updateVirtualCursor() {
    if (!this.virtualCursorEl || this.virtualCursorEl.style.display === 'none') return;
    const rect = this.options.renderer.domElement.getBoundingClientRect();
    const wrap = (value: number, min: number, size: number) => {
      if (!Number.isFinite(value) || size <= 0) return min;
      return min + ((((value - min) % size) + size) % size);
    };
    const x = wrap(this.pointerLockPoint.clientX, rect.left, rect.width);
    const y = wrap(this.pointerLockPoint.clientY, rect.top, rect.height);
    this.virtualCursorEl.style.left = `${x}px`;
    this.virtualCursorEl.style.top = `${y}px`;
  }

  private ensureScalarEditHandle() {
    if (this.scalarEditHandle) return this.scalarEditHandle;
    const root = document.createElement('div');
    const line = document.createElement('div');
    const dot = document.createElement('div');
    root.setAttribute('aria-hidden', 'true');
    Object.assign(root.style, {
      position: 'fixed',
      inset: '0',
      zIndex: '2147483646',
      pointerEvents: 'none',
      display: 'none',
    });
    Object.assign(line.style, {
      position: 'fixed',
      left: '0px',
      top: '0px',
      width: '1px',
      height: `${OPERATION_HANDLE_LINE_WIDTH}px`,
      background: 'rgba(255, 255, 255, 0.92)',
      boxShadow: '0 0 2px rgba(25, 23, 15, 0.9)',
      transformOrigin: '0 50%',
      borderRadius: '999px',
    });
    Object.assign(dot.style, {
      position: 'fixed',
      left: '0px',
      top: '0px',
      width: `${OPERATION_HANDLE_DOT_SIZE}px`,
      height: `${OPERATION_HANDLE_DOT_SIZE}px`,
      background: 'rgba(255, 255, 255, 0.98)',
      boxShadow: '0 0 2px rgba(25, 23, 15, 0.95), 0 0 5px rgba(25, 23, 15, 0.45)',
      borderRadius: '50%',
      transform: 'translate(-50%, -50%)',
    });
    root.append(line, dot);
    document.body.append(root);
    this.scalarEditHandle = { root, line, dot };
    return this.scalarEditHandle;
  }

  private hideScalarEditHandle() {
    if (this.scalarEditHandle) this.scalarEditHandle.root.style.display = 'none';
  }

  private updateScalarEditHandle(kind: string, amount: number) {
    const geometry = this.scalarEditHandleGeometry(kind, amount);
    if (!geometry) {
      this.hideScalarEditHandle();
      return;
    }
    const handle = this.ensureScalarEditHandle();
    const dx = geometry.end.x - geometry.start.x;
    const dy = geometry.end.y - geometry.start.y;
    const length = Math.hypot(dx, dy);
    if (!Number.isFinite(length) || length < 1) {
      this.hideScalarEditHandle();
      return;
    }

    handle.root.style.display = 'block';
    handle.line.style.left = `${geometry.start.x}px`;
    handle.line.style.top = `${geometry.start.y - (OPERATION_HANDLE_LINE_WIDTH / 2)}px`;
    handle.line.style.width = `${length}px`;
    handle.line.style.transform = `rotate(${Math.atan2(dy, dx)}rad)`;
    handle.dot.style.left = `${geometry.end.x}px`;
    handle.dot.style.top = `${geometry.end.y}px`;
  }

  private scalarEditHandleGeometry(kind: string, amount: number) {
    const selection = this.options.transformController.getEditSelection();
    if (!selection?.vertices.length) return null;
    const instIdx = this.options.getSelectedInstance();
    const target = instIdx === this.options.baseSelection
      ? { positions: this.options.getRendererND().positions, count: this.options.getM() }
      : (() => {
        const inst = this.options.getExtraInstances()[instIdx];
        return inst ? { positions: inst.renderer.positions, count: inst.M } : null;
      })();
    if (!target || target.count <= 0 || !this.options.getParams().editMode) return null;

    const center = new THREE.Vector3();
    let centerCount = 0;
    for (const vertex of selection.vertices) {
      if (vertex < 0 || vertex >= target.count) continue;
      const pIdx = vertex * 3;
      center.x += target.positions[pIdx];
      center.y += target.positions[pIdx + 1];
      center.z += target.positions[pIdx + 2];
      centerCount++;
    }
    if (!centerCount) return null;
    center.multiplyScalar(1 / centerCount);

    const objectCenter = new THREE.Vector3();
    for (let vertex = 0; vertex < target.count; vertex++) {
      const pIdx = vertex * 3;
      objectCenter.x += target.positions[pIdx];
      objectCenter.y += target.positions[pIdx + 1];
      objectCenter.z += target.positions[pIdx + 2];
    }
    objectCenter.multiplyScalar(1 / target.count);

    const rect = this.options.renderer.domElement.getBoundingClientRect();
    const start = this.projectWorldToClient(center, rect);
    if (!start) return null;
    const objectScreen = this.projectWorldToClient(objectCenter, rect);
    let direction = objectScreen ? start.clone().sub(objectScreen) : new THREE.Vector2(0, -1);
    if (!Number.isFinite(direction.x) || !Number.isFinite(direction.y) || direction.lengthSq() < 16) {
      direction = kind === 'edit-inset' ? new THREE.Vector2(1, 0) : new THREE.Vector2(0, -1);
    }
    direction.normalize();

    if (amount < 0) direction.multiplyScalar(-1);
    const normalizedAmount = kind === 'edit-extrusion'
      ? Math.min(1, Math.abs(amount) / 2.4)
      : Math.min(1, Math.abs(amount));
    const length = OPERATION_HANDLE_BASE_LENGTH + (normalizedAmount * OPERATION_HANDLE_MAX_EXTRA_LENGTH);
    const end = start.clone().add(direction.multiplyScalar(length));
    return { start, end };
  }

  private projectWorldToClient(point: THREE.Vector3, rect: DOMRect) {
    this.tmpVec.copy(point).project(this.options.camera);
    if (!Number.isFinite(this.tmpVec.x) || !Number.isFinite(this.tmpVec.y) || !Number.isFinite(this.tmpVec.z)) return null;
    return new THREE.Vector2(
      rect.left + ((this.tmpVec.x * 0.5 + 0.5) * rect.width),
      rect.top + ((-this.tmpVec.y * 0.5 + 0.5) * rect.height),
    );
  }

  showAddObjectMenuAtLastPointer(replaceActive = false) {
    if (!this.prepareOperationStart(replaceActive)) return;
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

  startTransformFromLastPointer(mode: TransformMode, replaceActive = false) {
    if (!this.prepareOperationStart(replaceActive)) return;
    this.options.transformController.startFromPointer(mode, this.lastPointer);
    if (!this.options.transformController.isActive()) return;
    if (!this.startViewportOperation({
      kind: 'transform',
      scope: this.options.getParams().editMode ? 'edit' : 'object',
      blocksCamera: true,
      blocksSelection: true,
      blocksContextMenu: true,
      usesPointerLock: true,
      updatePointer: (point, pointerEvent) => {
        this.lastPointer = { x: point.clientX, y: point.clientY };
        this.options.transformController.applyPointer(point.clientX, point.clientY, !!pointerEvent?.ctrlKey);
        return true;
      },
      commit: () => {
        this.options.pushUndoSnapshot();
        this.options.transformController.finish(true);
      },
      cancel: () => this.options.transformController.finish(false),
    })) {
      this.options.transformController.finish(false);
    }
  }

  private startScalarEditOperation(operation: ViewportAmountOperation, options: ScalarEditOperationOptions) {
    let amount = options.initialAmount ?? 0;
    const startX = this.lastPointer.x;
    const startY = this.lastPointer.y;
    const clampAmount = (value: number) => {
      const min = options.min ?? (options.signed ? Number.NEGATIVE_INFINITY : 0);
      const max = options.max ?? Number.POSITIVE_INFINITY;
      return Math.max(min, Math.min(max, value));
    };
    const applyAmount = (nextAmount: number, force = false) => {
      const clamped = clampAmount(nextAmount);
      if (!force && Math.abs(clamped - amount) < (options.epsilon ?? 0.0005)) return true;
      amount = clamped;
      operation.updateAmount(amount);
      this.updateScalarEditHandle(operation.kind, amount);
      return true;
    };

    const started = this.startViewportOperation({
      ...operation,
      blocksCamera: operation.blocksCamera ?? true,
      blocksSelection: operation.blocksSelection ?? true,
      blocksContextMenu: operation.blocksContextMenu ?? true,
      usesPointerLock: operation.usesPointerLock ?? true,
      updatePointer: point => {
        const dx = point.clientX - startX;
        const dy = startY - point.clientY;
        const baseAmount = options.signed ? 0 : (options.initialAmount ?? 0);
        return applyAmount(baseAmount + ((dx + dy) * options.scale));
      },
      updateWheel: operation.updateWheel
        ? ev => {
          const handled = operation.updateWheel?.(ev, amount);
          this.updateScalarEditHandle(operation.kind, amount);
          return handled;
        }
        : undefined,
      cleanup: () => {
        this.hideScalarEditHandle();
        if (this.options.contextMenuEl) this.options.contextMenuEl.style.display = 'none';
        operation.cleanup?.();
      },
    });
    if (started) applyAmount(amount, true);
    return started;
  }

  startEditExtrusionFromLastPointer(replaceActive = false) {
    const repeatSameOperation = this.operationManager.isKind('edit-extrusion') && replaceActive;
    if (!this.prepareOperationStart(replaceActive)) return;
    if (!this.options.getParams().editMode) return;
    if (this.options.transformController.isActive() || this.options.transformController.isGizmoDragging()) return;
    const operation = this.options.createEditExtrusionOperation(repeatSameOperation ? 'individual' : 'grouped');
    if (!operation) return;
    if (!this.startScalarEditOperation(operation, {
      scale: EXTRUSION_POINTER_SCALE,
      signed: true,
      epsilon: 0.001,
    })) {
      operation.cancel?.();
      operation.cleanup?.();
    }
  }

  startEditInsetFromLastPointer(replaceActive = false) {
    const repeatSameOperation = this.operationManager.isKind('edit-inset') && replaceActive;
    if (!this.prepareOperationStart(replaceActive)) return;
    if (!this.options.getParams().editMode) return;
    if (this.options.transformController.isActive() || this.options.transformController.isGizmoDragging()) return;
    const operation = this.options.createEditInsetOperation(repeatSameOperation ? 'individual' : 'grouped');
    if (!operation) return;
    if (!this.startScalarEditOperation(operation, {
      initialAmount: INSET_INITIAL_AMOUNT,
      scale: INSET_POINTER_SCALE,
      min: 0,
      max: INSET_MAX_AMOUNT,
    })) {
      operation.cancel?.();
      operation.cleanup?.();
    }
  }

  startEditBevelFromLastPointer(kind: 'vertex' | 'edge' = 'edge', inward = false, replaceActive = false) {
    const repeatSameOperation = this.operationManager.isKind('edit-bevel') && replaceActive;
    if (!this.prepareOperationStart(replaceActive)) return;
    if (!this.options.getParams().editMode) return;
    if (this.options.transformController.isActive() || this.options.transformController.isGizmoDragging()) return;
    const smoothness = this.lastBevelSmoothness;
    const operation = this.options.createEditBevelOperation(
      smoothness,
      kind,
      inward,
      repeatSameOperation ? 'individual' : 'grouped',
      nextSmoothness => {
        this.lastBevelSmoothness = nextSmoothness;
      },
    );
    if (!operation) return;
    if (!this.startScalarEditOperation(operation, {
      scale: BEVEL_POINTER_SCALE,
      min: 0,
      max: 0.995,
    })) {
      operation.cancel?.();
      operation.cleanup?.();
    }
  }

  startDuplicateFromLastPointer(replaceActive = false) {
    if (!this.prepareOperationStart(replaceActive)) return;
    if (this.options.getParams().editMode) return;
    if (this.options.transformController.isActive() || this.options.transformController.isGizmoDragging()) return;
    const point = this.pickPointOnTargetPlane({ clientX: this.lastPointer.x, clientY: this.lastPointer.y });
    const operation = this.options.createDuplicatePlacementOperation(point, pointerPoint => this.pickPointOnTargetPlane(pointerPoint));
    if (!operation) return;
    if (this.options.contextMenuEl) this.options.contextMenuEl.style.display = 'none';
    if (!this.startViewportOperation(operation)) {
      operation.cancel?.();
      operation.cleanup?.();
    }
  }

  isOperationActive() {
    return this.operationManager.isActive();
  }

  isOperationKind(kind: string) {
    return this.operationManager.isKind(kind);
  }

  startOperation(operation: ViewportOperation) {
    return this.startViewportOperation(operation);
  }

  updateActiveOperationPointer(ev: PointerEvent) {
    return this.operationManager.updatePointer(this.operationPointerPoint(ev), ev);
  }

  finishOperation(commit: boolean) {
    return this.operationManager.finish(commit);
  }

  handleTransformConstraintKey(key: string) {
    const transformController = this.options.transformController;
    if (!transformController.isActive()) return false;
    return transformController.handleConstraintKey(key);
  }

  deleteOrConfirmSelection() {
    if (!this.hasDeleteTarget()) return;
    if (this.operationManager.isKind('delete-confirm')) {
      this.operationManager.finish(true);
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
    if (this.operationManager.isActive()) return;
    menu.replaceChildren();

    const confirm = document.createElement('button');
    confirm.textContent = 'Delete';
    confirm.onclick = () => {
      this.operationManager.finish(true);
    };

    menu.append(confirm);
    const x = ev?.clientX ?? this.lastPointer.x;
    const y = ev?.clientY ?? this.lastPointer.y;
    menu.style.left = `${x}px`;
    menu.style.top = `${y}px`;
    menu.style.display = 'block';
    this.startViewportOperation({
      kind: 'delete-confirm',
      scope: this.options.getParams().editMode ? 'edit' : 'object',
      blocksSelection: true,
      commit: () => this.deleteCurrentTarget(),
      cleanup: () => {
        menu.style.display = 'none';
      },
    });
  }

  private runImmediateOperation(kind: string, scope: 'edit' | 'object' | 'viewport' | 'light' | 'axis', commit: () => void) {
    if (!this.startViewportOperation({ kind, scope, commit })) return;
    this.operationManager.finish(true);
  }

  private suppressContextMenuIfRightClick(ev: PointerEvent | MouseEvent) {
    if (ev.button === 2) this.suppressNextContextMenu = true;
  }

  private consumeOperationPointerEvent(ev: PointerEvent) {
    ev.preventDefault();
    ev.stopPropagation();
    ev.stopImmediatePropagation();
  }

  private finishOperationFromPointer(ev: PointerEvent, commit: boolean) {
    this.suppressContextMenuIfRightClick(ev);
    const finished = this.operationManager.finish(commit);
    if (finished) this.consumeOperationPointerEvent(ev);
    return finished;
  }

  private handleTransformPointerMove(ev: PointerEvent) {
    const point = this.operationPointerPoint(ev);
    this.lastPointer = { x: point.clientX, y: point.clientY };
    if (this.operationManager.updatePointer(point, ev)) return;
    if (this.options.transformController.isGizmoDragging()) return;
    if (!this.options.transformController.isActive()) return;
    ev.preventDefault();
    this.options.transformController.applyPointer(point.clientX, point.clientY, ev.ctrlKey);
  }

  private handleContextMenu(ev: MouseEvent) {
    if (this.suppressNextContextMenu) {
      this.suppressNextContextMenu = false;
      ev.preventDefault();
      ev.stopPropagation();
      return;
    }

    if (this.operationManager.current?.blocksContextMenu) {
      ev.preventDefault();
      this.operationManager.finish(false);
      return;
    }

    const menu = this.options.contextMenuEl;
    if (!menu) return;

    ev.preventDefault();
    this.lastPointer = { x: ev.clientX, y: ev.clientY };
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
          this.runImmediateOperation('add-product-mesh', 'object', () => this.options.addProductMesh());
        };
        menu.appendChild(productButton);
      }
      const recalculateOriginButton = document.createElement('button');
      recalculateOriginButton.textContent = 'Recalculate origin';
      recalculateOriginButton.onclick = () => {
        menu.style.display = 'none';
        this.runImmediateOperation('recalculate-origin', 'object', () => this.options.recalculateSelectedOrigin());
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
        this.runImmediateOperation('add-primitive', 'object', () => {
          this.options.pushUndoSnapshot();
          this.options.addPrimitiveInstanceAt(opt.kind, `${opt.label} #${this.options.getExtraInstances().length + 1}`, spawnPoint, syncMode);
        });
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
        this.runImmediateOperation('add-scene-light', 'light', () => {
          this.options.pushUndoSnapshot();
          this.options.addSceneLightAt(opt.kind, spawnPoint);
        });
      };
      container.appendChild(btn);
    }
  }

  private handleMiddleMouseDown(ev: MouseEvent) {
    if (ev.button !== 1) return;
    if (this.operationManager.isKind('edit-bevel')) {
      ev.preventDefault();
      ev.stopPropagation();
      return;
    }
    if (this.operationManager.isActive()) return;
    ev.preventDefault();
    ev.stopPropagation();
    this.lastPointer = { x: ev.clientX, y: ev.clientY };
    let lastX = this.lastPointer.x;
    let accum = 0;
    const prevZoom = this.options.controls.enableZoom;
    const prevPan = this.options.controls.enablePan;
    this.options.controls.enableZoom = false;
    this.options.controls.enablePan = false;
    this.startViewportOperation({
      kind: 'axis-shift',
      scope: 'axis',
      blocksCamera: true,
      usesPointerLock: true,
      updatePointer: (point, pointerEvent) => {
        if (!pointerEvent) return false;
        if ((pointerEvent.buttons & 4) === 0) {
          this.operationManager.finish(true);
          return true;
        }

        pointerEvent.preventDefault();
        this.lastPointer = { x: point.clientX, y: point.clientY };
        const dx = point.clientX - lastX;
        lastX = point.clientX;
        accum += dx;
        const threshold = 35;
        let steps = 0;
        while (accum > threshold) {
          steps++;
          accum -= threshold;
        }
        while (accum < -threshold) {
          steps--;
          accum += threshold;
        }
        if (steps !== 0) this.options.cycleAxes(steps);
        return true;
      },
      cleanup: () => {
        accum = 0;
        this.options.controls.enableZoom = prevZoom;
        this.options.controls.enablePan = prevPan;
      },
    });
  }

  private handlePointerDown(ev: PointerEvent) {
    if (this.operationManager.isKind('axis-shift')) return;
    this.lastPointer = { x: ev.clientX, y: ev.clientY };

    if (this.operationManager.isKind('duplicate-placement')) {
      if (ev.button === 0) this.finishOperationFromPointer(ev, true);
      else if (ev.button === 2) this.finishOperationFromPointer(ev, false);
      return;
    }

    if (ev.button === 0 && this.options.transformController.handleGizmoPointerDown(ev)) {
      this.transformGizmoPrevControlsEnabled = this.options.controls.enabled;
      this.options.controls.enabled = false;
      if (!this.startViewportOperation({
        kind: 'transform-gizmo',
        scope: this.options.getParams().editMode ? 'edit' : 'object',
        blocksCamera: true,
        blocksSelection: true,
        blocksContextMenu: true,
        usesPointerCapture: true,
        usesPointerLock: true,
        updatePointer: (point, pointerEvent) => (
          pointerEvent
            ? this.options.transformController.handleGizmoPointerMove(
              pointerEvent,
              nextPoint => { this.lastPointer = nextPoint; },
              { x: point.clientX, y: point.clientY },
            )
            : false
        ),
        commit: () => {
          if (this.transformGizmoEndEvent) this.options.transformController.handleGizmoPointerEnd(this.transformGizmoEndEvent, true);
          else this.options.transformController.cancelGizmoDrag();
        },
        cancel: () => {
          if (this.transformGizmoEndEvent) this.options.transformController.handleGizmoPointerEnd(this.transformGizmoEndEvent, false);
          else this.options.transformController.cancelGizmoDrag();
        },
        cleanup: () => {
          this.options.controls.enabled = this.transformGizmoPrevControlsEnabled;
        },
      })) {
        this.options.transformController.cancelGizmoDrag();
        this.options.controls.enabled = this.transformGizmoPrevControlsEnabled;
      }
      return;
    }

    if (this.options.transformController.isActive()) {
      if (ev.button === 0) {
        if (this.operationManager.isKind('edit-extrusion')) {
          this.finishOperationFromPointer(ev, true);
        } else if (this.operationManager.isKind('transform')) {
          this.finishOperationFromPointer(ev, true);
        } else {
          this.options.pushUndoSnapshot();
          this.options.transformController.finish(true);
          this.consumeOperationPointerEvent(ev);
        }
      } else if (ev.button === 2) {
        this.suppressContextMenuIfRightClick(ev);
        if (this.operationManager.isKind('edit-extrusion')) this.finishOperationFromPointer(ev, false);
        else if (this.operationManager.isKind('transform')) this.finishOperationFromPointer(ev, false);
        else {
          this.options.transformController.finish(false);
          this.consumeOperationPointerEvent(ev);
        }
      }
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
    if (
      !this.operationManager.isKind('edit-bevel')
      && !this.operationManager.isKind('edit-inset')
      && !this.operationManager.isKind('edit-extrusion')
    ) return;
    this.lastPointer = { x: ev.clientX, y: ev.clientY };
    if (ev.button === 0) {
      this.finishOperationFromPointer(ev, true);
    } else if (ev.button === 2) {
      this.finishOperationFromPointer(ev, false);
    } else {
      return;
    }
  }

  private handleWindowPointerMove(ev: PointerEvent) {
    if (this.operationManager.updatePointer(this.operationPointerPoint(ev), ev)) return;
  }

  private handleWindowPointerUp(ev: PointerEvent) {
    if (this.operationManager.isKind('duplicate-placement') && ev.button === 0) {
      this.operationManager.finish(true);
      ev.preventDefault();
      return;
    }
    if (this.operationManager.isKind('transform-gizmo')) {
      this.transformGizmoEndEvent = ev;
      this.operationManager.finish(true);
      this.transformGizmoEndEvent = null;
      return;
    }
    if (this.operationManager.isKind('axis-shift')) this.operationManager.finish(true);
  }

  private handleWindowPointerCancel(ev: PointerEvent) {
    if (
      this.operationManager.isKind('edit-bevel')
      || this.operationManager.isKind('edit-inset')
      || this.operationManager.isKind('edit-extrusion')
    ) {
      this.operationManager.finish(false);
      ev.preventDefault();
      return;
    }

    if (this.operationManager.isKind('duplicate-placement')) {
      this.operationManager.finish(false);
      ev.preventDefault();
      return;
    }
    if (this.operationManager.isKind('transform-gizmo')) {
      this.transformGizmoEndEvent = ev;
      this.operationManager.finish(false);
      this.transformGizmoEndEvent = null;
      return;
    }
    if (this.operationManager.isKind('transform')) {
      this.operationManager.finish(false);
      return;
    }
    if (this.operationManager.isKind('axis-shift')) this.operationManager.finish(false);
  }

  private handleWindowBlur() {
    if (this.operationManager.hasScope('edit')) this.operationManager.finish(false);
    if (this.operationManager.isKind('transform')) this.operationManager.finish(false);
    if (this.operationManager.isKind('duplicate-placement')) this.operationManager.finish(false);
    if (this.operationManager.isKind('transform-gizmo')) this.operationManager.finish(false);
    if (this.operationManager.isKind('axis-shift')) this.operationManager.finish(false);
    this.options.keyboardCamera.clearKeys();
  }

  private hideContextMenuIfIdle(ev: MouseEvent) {
    const menu = this.options.contextMenuEl;
    const target = ev.target;
    if (this.operationManager.current?.blocksContextMenu) return;
    if (this.operationManager.isKind('delete-confirm') && target instanceof Node && menu?.contains(target)) return;
    if (this.operationManager.isKind('delete-confirm')) {
      this.operationManager.finish(false);
      return;
    }
    if (menu) menu.style.display = 'none';
  }

  private handleWheel(ev: WheelEvent) {
    this.operationManager.updateWheel(ev);
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

    const candidates: {
      instIdx: number;
      containsSurface: boolean;
      distance2: number;
      area: number;
    }[] = [];
    if (M > 0 && this.options.getBaseVisible()) {
      const hit = this.objectScreenHit(rendererND, M, mx, my, w, h);
      if (hit.hit) candidates.push({ instIdx: this.options.baseSelection, ...hit });
    }
    extraInstances.forEach((inst, idx) => {
      if (!inst.visible) return;
      const hit = this.objectScreenHit(inst.renderer, inst.M, mx, my, w, h);
      if (hit.hit) candidates.push({ instIdx: idx, ...hit });
    });

    candidates.sort((a, b) => {
      if (a.containsSurface !== b.containsSurface) return a.containsSurface ? -1 : 1;
      if (a.containsSurface && b.containsSurface) return a.area - b.area;
      return a.distance2 - b.distance2;
    });
    const bestInst = candidates[0]?.instIdx ?? this.options.noSelection;

    if (bestInst === this.options.noSelection) {
      if (this.options.getParams().editMode && ev.shiftKey) return this.options.noSelection;
      this.options.selectObject(this.options.noSelection, ev.shiftKey);
      return this.options.noSelection;
    }

    const editMode = this.options.getParams().editMode;
    const additive = ev.shiftKey && !editMode;
    if (!(editMode && ev.shiftKey && bestInst === this.options.getSelectedInstance())) {
      this.options.selectObject(bestInst, additive);
    }
    if (editMode) this.selectNearestEditElement(bestInst, mx, my, w, h, ev.shiftKey, ev.altKey);
    return bestInst;
  }

  private objectScreenHit(
    renderer: HypercubeRenderer,
    count: number,
    mx: number,
    my: number,
    width: number,
    height: number,
  ) {
    const positions = renderer.positions;
    const screen = new Float32Array(count * 2);
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    let nearestVertexDist2 = Number.POSITIVE_INFINITY;
    let nearestEdgeDist2 = Number.POSITIVE_INFINITY;

    for (let i = 0; i < count; i++) {
      const pIdx = i * 3;
      this.tmpVec.set(positions[pIdx], positions[pIdx + 1], positions[pIdx + 2]).project(this.options.camera);
      const sx = (this.tmpVec.x * 0.5 + 0.5) * width;
      const sy = (-this.tmpVec.y * 0.5 + 0.5) * height;
      const sIdx = i * 2;
      screen[sIdx] = sx;
      screen[sIdx + 1] = sy;
      if (!Number.isFinite(sx) || !Number.isFinite(sy)) continue;
      if (sx < minX) minX = sx;
      if (sx > maxX) maxX = sx;
      if (sy < minY) minY = sy;
      if (sy > maxY) maxY = sy;
      const dx = sx - mx;
      const dy = sy - my;
      nearestVertexDist2 = Math.min(nearestVertexDist2, (dx * dx) + (dy * dy));
    }

    const point = this.tmpVec2.set(mx, my);
    const a = new THREE.Vector2();
    const b = new THREE.Vector2();
    const c = new THREE.Vector2();
    let containsSurface = false;
    const surface = renderer.getSurfaceTopologyForSelection();
    if (surface) {
      const triangles = surface.triangles;
      for (let i = 0; i + 2 < triangles.length; i += 3) {
        const ia = triangles[i] * 2;
        const ib = triangles[i + 1] * 2;
        const ic = triangles[i + 2] * 2;
        if (ia + 1 >= screen.length || ib + 1 >= screen.length || ic + 1 >= screen.length) continue;
        a.set(screen[ia], screen[ia + 1]);
        b.set(screen[ib], screen[ib + 1]);
        c.set(screen[ic], screen[ic + 1]);
        if (!Number.isFinite(a.x + a.y + b.x + b.y + c.x + c.y)) continue;
        if (this.pointInTriangle(point, a, b, c)) {
          containsSurface = true;
          break;
        }
      }
    }

    if (!containsSurface) {
      const edges = renderer.allEdges;
      for (let i = 0; i + 1 < edges.length; i += 2) {
        const ia = edges[i] * 2;
        const ib = edges[i + 1] * 2;
        if (ia + 1 >= screen.length || ib + 1 >= screen.length) continue;
        a.set(screen[ia], screen[ia + 1]);
        b.set(screen[ib], screen[ib + 1]);
        if (!Number.isFinite(a.x + a.y + b.x + b.y)) continue;
        nearestEdgeDist2 = Math.min(nearestEdgeDist2, this.distancePointToSegmentSquared(point, a, b));
      }
    }

    const vertexRadius2 = OBJECT_VERTEX_PICK_RADIUS * OBJECT_VERTEX_PICK_RADIUS;
    const edgeRadius2 = OBJECT_EDGE_PICK_RADIUS * OBJECT_EDGE_PICK_RADIUS;
    const distance2 = Math.min(nearestVertexDist2, nearestEdgeDist2);
    return {
      hit: containsSurface || nearestVertexDist2 <= vertexRadius2 || nearestEdgeDist2 <= edgeRadius2,
      containsSurface,
      distance2,
      area: (maxX - minX) * (maxY - minY),
    };
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

  private selectNearestEditElement(
    instIdx: number,
    mx: number,
    my: number,
    width: number,
    height: number,
    additive = false,
    forceCycle = false,
  ) {
    const dimension = this.options.transformController.getEditCellDimension();
    if (dimension === 1) {
      this.selectNearestEdge(instIdx, mx, my, width, height, additive);
      return;
    }
    if (dimension >= 2) {
      this.selectNearestCell(instIdx, dimension, mx, my, width, height, additive, forceCycle);
      return;
    }
    this.selectNearestVertex(instIdx, mx, my, width, height, additive);
  }

  private selectNearestVertex(instIdx: number, mx: number, my: number, width: number, height: number, additive = false) {
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
    if (additive) this.options.transformController.toggleSelectedEditElement(0, nearest >= 0 ? [nearest] : [], nearest, targetRenderer.getCellTopologyForSelection());
    else this.options.transformController.setSelectedEditElement(0, nearest >= 0 ? [nearest] : [], nearest);
    this.options.transformController.updateVertexCloud(instIdx);
  }

  private selectNearestEdge(instIdx: number, mx: number, my: number, width: number, height: number, additive = false) {
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
      if (additive) this.options.transformController.toggleSelectedEditElement(1, best, bestCellId, topology);
      else this.options.transformController.setSelectedEditElement(1, best, bestCellId);
    } else if (!additive) {
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
    additive = false,
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
      if (additive) this.options.transformController.toggleSelectedEditElement(dimension, selected.vertices, selected.cellId, topology);
      else this.options.transformController.setSelectedEditElement(dimension, selected.vertices, selected.cellId);
    } else if (!additive) {
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

}
