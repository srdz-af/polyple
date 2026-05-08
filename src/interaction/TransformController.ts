import * as THREE from 'three';
import type { RotND } from '../RotND';
import type { NDProjector } from '../geometry/NDProjector';
import { perspectiveScaleFrom, type AxisMap } from '../geometry/projectionUtils';
import type { HypercubeRenderer } from '../rendering/HypercubeRenderer';
import type { ObjectOrigin } from '../scene/objectOrigin';
import type { Instance, TransformMode, TransformState } from '../scene/types';

type TransformParams = {
  editMode: boolean;
  axesX: number;
  axesY: number;
  axesZ: number;
};

type TransformControllerOptions = {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  raycaster: THREE.Raycaster;
  ndc: THREE.Vector2;
  vertexGeo: THREE.BufferGeometry;
  moveButton: HTMLButtonElement | null;
  rotateButton: HTMLButtonElement | null;
  scaleButton: HTMLButtonElement | null;
  getParams: () => TransformParams;
  getN: () => number;
  getX: () => Float32Array;
  getM: () => number;
  getY: () => Float32Array;
  getRot: () => RotND;
  getProjector: () => NDProjector;
  getRendererND: () => HypercubeRenderer;
  getExtraInstances: () => Instance[];
  getBaseTransform: () => TransformState;
  getObjectOrigin: (idx: number) => ObjectOrigin | null;
  getBaseOriginalN: () => number;
  getBaseAxisMap: () => AxisMap;
  getSelectedInstance: () => number;
  getSelectedInstances: () => number[];
  getObjectVisible: (idx: number) => boolean;
  visibleDims: () => number;
  perspectiveDimsFor: (localN: number, axisMap: AxisMap) => number[];
  primaryExtraRotationDepthDim: (localN: number, axisMap: AxisMap) => number;
  extraRotationPlaneAxis: (lockAxis: -1 | 0 | 1 | 2, depthDim: number) => number;
  projectAndRenderAll: () => void;
  updateSelectionOutline: () => void;
  pushUndoSnapshot: () => void;
  onStateChange?: () => void;
};

type TransformOperation = {
  mode: TransformMode;
  instIdx: number;
  targetVertex: number;
  startPos: THREE.Vector3;
  startRot: THREE.Vector3;
  startScale: number;
  startMouse: THREE.Vector2;
  vertexStart: THREE.Vector3;
  axis: THREE.Vector3;
  plane: THREE.Plane;
  planeHitStart: THREE.Vector3;
  lastHit: THREE.Vector3;
  vertexDataStart: Float32Array | null;
  lockAxis: -1 | 0 | 1 | 2;
  objectDataStart: Float32Array | null;
  originDataStart: Float32Array | null;
  extraPlane: boolean;
  moveOffset: THREE.Vector3;
  objectStarts: ObjectTransformStart[];
  pivotWorldStart: THREE.Vector3;
};

type ObjectTransformStart = {
  instIdx: number;
  startPos: THREE.Vector3;
  startRot: THREE.Vector3;
  startScale: THREE.Vector3;
  originWorldStart: THREE.Vector3;
  objectDataStart: Float32Array | null;
  originDataStart: Float32Array | null;
};

function computeCenterFromPositions(positions: Float32Array, count: number) {
  if (!count) return new THREE.Vector3();
  let sumX = 0;
  let sumY = 0;
  let sumZ = 0;
  for (let i = 0; i < count; i++) {
    const pIdx = i * 3;
    sumX += positions[pIdx];
    sumY += positions[pIdx + 1];
    sumZ += positions[pIdx + 2];
  }
  return new THREE.Vector3(sumX / count, sumY / count, sumZ / count);
}

export class TransformController {
  private selectedVertex = -1;
  private selectionVertexMarker: THREE.Mesh | null = null;
  private vertexCloud: THREE.InstancedMesh | null = null;
  private axisGuide: THREE.Line | null = null;
  private extraPlaneGuide: THREE.Line | null = null;
  private readonly tmpVec = new THREE.Vector3();
  private readonly dragRotated = new Float32Array(32);
  private readonly dragRotatedNext = new Float32Array(32);
  private readonly dragZero = new THREE.Vector3();
  private readonly dragQuat = new THREE.Quaternion();
  private readonly dragEuler = new THREE.Euler();
  private readonly dragRS = new THREE.Matrix4();
  private readonly dragRSInv = new THREE.Matrix4();
  private readonly dragWorldCurrent = new THREE.Vector3();
  private readonly dragYCurrent = new THREE.Vector3();
  private readonly dragTranslation = new THREE.Vector3();
  private readonly dragTargetY = new THREE.Vector3();
  private readonly dragTmpVec = new THREE.Vector3();
  private readonly dragWorldTarget = new THREE.Vector3();
  private readonly dragOriginProjected = new THREE.Vector3();

  private readonly transformOp: TransformOperation = {
    mode: 'none',
    instIdx: -1,
    targetVertex: -1,
    startPos: new THREE.Vector3(),
    startRot: new THREE.Vector3(),
    startScale: 1,
    startMouse: new THREE.Vector2(),
    vertexStart: new THREE.Vector3(),
    axis: new THREE.Vector3(),
    plane: new THREE.Plane(),
    planeHitStart: new THREE.Vector3(),
    lastHit: new THREE.Vector3(),
    vertexDataStart: null,
    lockAxis: -1,
    objectDataStart: null,
    originDataStart: null,
    extraPlane: false,
    moveOffset: new THREE.Vector3(),
    objectStarts: [],
    pivotWorldStart: new THREE.Vector3(),
  };

  private readonly controlTransformDrag = {
    active: false,
    started: false,
    pointerId: -1,
    mode: 'none' as TransformMode,
    startX: 0,
    startY: 0,
    sourceButton: null as HTMLButtonElement | null,
  };

  constructor(private readonly options: TransformControllerOptions) {}

  get mode() {
    return this.transformOp.mode;
  }

  isActive() {
    return this.transformOp.mode !== 'none';
  }

  getSelectedVertex() {
    return this.selectedVertex;
  }

  setSelectedVertex(vertex: number) {
    this.selectedVertex = vertex;
  }

  clearSelectionVisuals() {
    this.selectedVertex = -1;
    this.clearVertexMarker();
    this.clearVertexCloud();
  }

  clearVertexMarker() {
    if (this.selectionVertexMarker) {
      this.options.scene.remove(this.selectionVertexMarker);
      this.selectionVertexMarker = null;
    }
  }

  clearVertexCloud() {
    if (this.vertexCloud) {
      this.options.scene.remove(this.vertexCloud);
      this.vertexCloud = null;
    }
  }

  clearAxisGuide() {
    if (this.axisGuide) {
      this.options.scene.remove(this.axisGuide);
      this.axisGuide.geometry.dispose();
      this.axisGuide = null;
    }
    if (this.extraPlaneGuide) {
      this.options.scene.remove(this.extraPlaneGuide);
      this.extraPlaneGuide.geometry.dispose();
      this.extraPlaneGuide = null;
    }
  }

  updateVertexCloud(instIdx: number) {
    if (!this.options.getParams().editMode || !this.options.getObjectVisible(instIdx)) {
      this.clearVertexCloud();
      this.clearVertexMarker();
      return;
    }

    const rendererRef = instIdx === -1
      ? this.options.getRendererND()
      : this.options.getExtraInstances()[instIdx].renderer;
    const count = instIdx === -1 ? this.options.getM() : this.options.getExtraInstances()[instIdx].M;
    if (!rendererRef || count <= 0) return;

    this.clearVertexCloud();
    const mat = new THREE.MeshBasicMaterial({ color: 0xbfc7d5 });
    this.vertexCloud = new THREE.InstancedMesh(this.options.vertexGeo, mat, count);
    const dummy = new THREE.Object3D();
    const posArr = rendererRef.positions;
    for (let i = 0; i < count; i++) {
      const pIdx = i * 3;
      dummy.position.set(posArr[pIdx], posArr[pIdx + 1], posArr[pIdx + 2]);
      dummy.updateMatrix();
      this.vertexCloud.setMatrixAt(i, dummy.matrix);
    }
    this.vertexCloud.instanceMatrix.needsUpdate = true;
    this.vertexCloud.renderOrder = 5;
    this.options.scene.add(this.vertexCloud);
    if (this.selectedVertex >= 0) this.placeVertexMarker(instIdx, this.selectedVertex);
  }

  placeVertexMarker(instIdx: number, vertexIdx: number) {
    if (!this.options.getObjectVisible(instIdx)) return;
    if (!this.selectionVertexMarker) {
      const mat = new THREE.MeshBasicMaterial({ color: 0xffa64d, depthTest: false });
      this.selectionVertexMarker = new THREE.Mesh(this.options.vertexGeo, mat);
      this.selectionVertexMarker.renderOrder = 20;
    }
    this.selectionVertexMarker.scale.setScalar(1.35);
    const rendererRef = instIdx === -1
      ? this.options.getRendererND()
      : this.options.getExtraInstances()[instIdx].renderer;
    const posArr = rendererRef.positions;
    const pIdx = vertexIdx * 3;
    this.selectionVertexMarker.position.set(posArr[pIdx], posArr[pIdx + 1], posArr[pIdx + 2]);
    this.options.scene.add(this.selectionVertexMarker);
  }

  updateActionButtons() {
    const buttons: { mode: TransformMode; el: HTMLButtonElement | null; }[] = [
      { mode: 'move', el: this.options.moveButton },
      { mode: 'rotate', el: this.options.rotateButton },
      { mode: 'scale', el: this.options.scaleButton },
    ];
    const hasTarget = this.getObjectTransformSelection().length > 0;
    const busy = this.transformOp.mode !== 'none';

    for (const entry of buttons) {
      if (!entry.el) continue;
      entry.el.classList.toggle('active', this.transformOp.mode === entry.mode);
      entry.el.disabled = !hasTarget || busy;
    }
  }

  handleConstraintKey(key: string) {
    if (key === 'w') {
      if (this.transformOp.mode === 'rotate') {
        this.transformOp.extraPlane = !this.transformOp.extraPlane;
        this.updateAxisGuide();
        return true;
      }
      return false;
    }
    if (key === 'x' || key === 'y' || key === 'z') {
      this.transformOp.lockAxis = key === 'x' ? 0 : key === 'y' ? 1 : 2;
      this.updateAxisGuide();
      return true;
    }
    return false;
  }

  startFromPointer(mode: TransformMode, pointer: { x: number; y: number }) {
    this.start(mode, { clientX: pointer.x, clientY: pointer.y });
  }

  start(mode: TransformMode, ev: { clientX: number; clientY: number }) {
    const selectedInstance = this.options.getSelectedInstance();
    const selectedObjects = this.getObjectTransformSelection();
    if (!selectedObjects.length) return;

    this.transformOp.mode = mode;
    this.transformOp.instIdx = selectedInstance;
    this.transformOp.targetVertex = this.options.getParams().editMode ? this.selectedVertex : -1;
    this.transformOp.startMouse.set(ev.clientX, ev.clientY);
    this.transformOp.objectStarts = [];

    if (this.transformOp.targetVertex >= 0) {
      const inst = this.transformOp.instIdx === -1 ? null : this.options.getExtraInstances()[this.transformOp.instIdx];
      const posArr = inst ? inst.renderer.positions : this.options.getRendererND().positions;
      const idx = this.transformOp.targetVertex * 3;
      this.transformOp.vertexStart.set(posArr[idx], posArr[idx + 1], posArr[idx + 2]);
      const src = inst ? inst.X : this.options.getX();
      const count = inst ? inst.M : this.options.getM();
      const N = this.options.getN();
      this.transformOp.vertexDataStart = new Float32Array(N);
      for (let d = 0; d < N; d++) this.transformOp.vertexDataStart[d] = src[d * count + this.transformOp.targetVertex];
      this.transformOp.startScale = 1;
      this.transformOp.plane.setFromNormalAndCoplanarPoint(this.options.camera.getWorldDirection(this.tmpVec).normalize(), this.transformOp.vertexStart);
      this.transformOp.planeHitStart.copy(this.transformOp.vertexStart);
      this.transformOp.lastHit.copy(this.transformOp.vertexStart);
      this.transformOp.lockAxis = -1;
      this.transformOp.extraPlane = false;
      return;
    }

    this.transformOp.objectStarts = selectedObjects.map(instIdx => this.createObjectTransformStart(instIdx, mode));
    const primaryStart = this.transformOp.objectStarts.find(start => start.instIdx === selectedInstance) ?? this.transformOp.objectStarts[0];
    if (!primaryStart) {
      this.transformOp.mode = 'none';
      return;
    }

    this.transformOp.startPos.copy(primaryStart.startPos);
    this.transformOp.startRot.copy(primaryStart.startRot);
    this.transformOp.startScale = primaryStart.startScale.x;
    this.transformOp.pivotWorldStart.copy(primaryStart.originWorldStart);
    this.transformOp.lockAxis = -1;
    this.transformOp.extraPlane = false;

    if (mode === 'move' || mode === 'rotate') {
      this.transformOp.objectDataStart = primaryStart.objectDataStart;
      this.transformOp.lastHit.set(0, 0, 0);
      if (mode === 'move') {
        const center = this.getObjectOriginWorldPosition(selectedInstance);
        this.transformOp.planeHitStart.copy(center);
        this.transformOp.plane.setFromNormalAndCoplanarPoint(this.options.camera.getWorldDirection(this.tmpVec).normalize(), center);
        const rect = this.options.renderer.domElement.getBoundingClientRect();
        this.options.ndc.set(((ev.clientX - rect.left) / rect.width) * 2 - 1, -((ev.clientY - rect.top) / rect.height) * 2 + 1);
        this.options.raycaster.setFromCamera(this.options.ndc, this.options.camera);
        const hit = this.options.raycaster.ray.intersectPlane(this.transformOp.plane, this.tmpVec);
        if (hit) {
          this.transformOp.lastHit.copy(hit);
          this.transformOp.moveOffset.copy(this.transformOp.planeHitStart).sub(hit);
        } else {
          this.transformOp.lastHit.copy(center);
          this.transformOp.moveOffset.set(0, 0, 0);
        }
      }
      this.transformOp.originDataStart = primaryStart.originDataStart;
    } else {
      this.transformOp.objectDataStart = null;
      this.transformOp.originDataStart = null;
    }
  }

  beginControlDrag(mode: TransformMode, ev: PointerEvent) {
    if (mode === 'none') return;
    if (this.transformOp.mode !== 'none') return;
    if (!this.getObjectTransformSelection().length) return;

    ev.preventDefault();
    ev.stopPropagation();
    this.controlTransformDrag.active = true;
    this.controlTransformDrag.started = false;
    this.controlTransformDrag.pointerId = ev.pointerId;
    this.controlTransformDrag.mode = mode;
    this.controlTransformDrag.startX = ev.clientX;
    this.controlTransformDrag.startY = ev.clientY;
    this.controlTransformDrag.sourceButton = ev.currentTarget as HTMLButtonElement | null;
    try {
      this.controlTransformDrag.sourceButton?.setPointerCapture(ev.pointerId);
    } catch {
      // Some browsers may reject capture when pointerdown starts from nested SVG nodes.
    }
  }

  handleControlPointerMove(ev: PointerEvent, setLastPointer: (point: { x: number; y: number }) => void) {
    if (!this.controlTransformDrag.active || ev.pointerId !== this.controlTransformDrag.pointerId) return false;

    ev.preventDefault();
    setLastPointer({ x: ev.clientX, y: ev.clientY });
    if (!this.controlTransformDrag.started) {
      const moved = Math.hypot(ev.clientX - this.controlTransformDrag.startX, ev.clientY - this.controlTransformDrag.startY);
      if (moved < 3) return true;
      this.options.pushUndoSnapshot();
      this.start(this.controlTransformDrag.mode, ev);
      this.controlTransformDrag.started = this.transformOp.mode !== 'none';
      if (!this.controlTransformDrag.started) {
        this.resetControlDrag();
        return true;
      }
      this.updateActionButtons();
    }
    this.applyPointer(ev.clientX, ev.clientY);
    return true;
  }

  handleControlPointerEnd(ev: PointerEvent, commit: boolean) {
    if (!this.controlTransformDrag.active || ev.pointerId !== this.controlTransformDrag.pointerId) return false;

    if (this.controlTransformDrag.sourceButton?.hasPointerCapture(ev.pointerId)) {
      this.controlTransformDrag.sourceButton.releasePointerCapture(ev.pointerId);
    }
    const shouldFinish = this.controlTransformDrag.started && this.transformOp.mode !== 'none';
    if (shouldFinish) this.finish(commit);
    this.resetControlDrag();
    ev.preventDefault();
    return true;
  }

  applyPointer(clientX: number, clientY: number) {
    if (this.transformOp.mode === 'none') return;

    const dx = clientX - this.transformOp.startMouse.x;
    const dy = clientY - this.transformOp.startMouse.y;
    const extraInstances = this.options.getExtraInstances();
    const rendererND = this.options.getRendererND();

    if (this.transformOp.targetVertex >= 0) {
      const inst = this.transformOp.instIdx === -1 ? null : extraInstances[this.transformOp.instIdx];
      const posArr = inst ? inst.renderer.positions : rendererND.positions;
      const idx = this.transformOp.targetVertex * 3;
      const rect = this.options.renderer.domElement.getBoundingClientRect();
      this.options.ndc.set(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1);
      this.options.raycaster.setFromCamera(this.options.ndc, this.options.camera);
      this.transformOp.plane.setFromNormalAndCoplanarPoint(this.options.camera.getWorldDirection(this.tmpVec).normalize(), this.transformOp.planeHitStart);
      const hit = this.options.raycaster.ray.intersectPlane(this.transformOp.plane, this.tmpVec);
      if (!hit) return;
      const dragWorld = this.dragWorldTarget;

      if (this.transformOp.mode === 'move') {
        const locked = this.transformOp.lockAxis;
        dragWorld.set(
          locked === 1 || locked === 2 ? this.transformOp.vertexStart.x : hit.x,
          locked === 0 || locked === 2 ? this.transformOp.vertexStart.y : hit.y,
          locked === 0 || locked === 1 ? this.transformOp.vertexStart.z : hit.z,
        );
        this.transformOp.lastHit.copy(dragWorld);
      } else if (this.transformOp.mode === 'scale') {
        const fromOrigin = hit.clone().sub(this.transformOp.planeHitStart);
        const base = this.transformOp.vertexStart.clone().sub(this.transformOp.planeHitStart);
        const baseLen = base.length();
        const newLen = fromOrigin.length();
        const s = baseLen > 1e-6 ? newLen / baseLen : 1;
        const scaled = base.multiplyScalar(s).add(this.transformOp.planeHitStart);
        dragWorld.copy(scaled);
        this.transformOp.lastHit.copy(scaled);
      } else if (this.transformOp.mode === 'rotate') {
        const base = this.transformOp.vertexStart.clone().sub(this.transformOp.planeHitStart);
        const cur = hit.clone().sub(this.transformOp.planeHitStart);
        const angle = Math.atan2(cur.y, cur.x) - Math.atan2(base.y, base.x);
        const q = new THREE.Quaternion().setFromAxisAngle(this.transformOp.axis, angle);
        base.applyQuaternion(q).add(this.transformOp.planeHitStart);
        dragWorld.copy(base);
        this.transformOp.lastHit.copy(base);
      } else {
        return;
      }

      if (!this.setDraggedVertexFromWorldPosition(this.transformOp.instIdx, this.transformOp.targetVertex, dragWorld)) return;
      this.options.projectAndRenderAll();
      const refreshed = inst ? inst.renderer.positions : rendererND.positions;
      if (this.selectionVertexMarker) this.selectionVertexMarker.position.set(refreshed[idx], refreshed[idx + 1], refreshed[idx + 2]);
    } else {
      this.applyObjectTransform(clientX, clientY, dx, dy);
    }

    this.options.projectAndRenderAll();
    this.options.updateSelectionOutline();
    this.updateAxisGuide();
  }

  finish(commit: boolean) {
    if (this.transformOp.mode === 'none') return;

    const extraInstances = this.options.getExtraInstances();
    const rendererND = this.options.getRendererND();
    const params = this.options.getParams();
    const N = this.options.getN();
    const M = this.options.getM();

    if (commit) {
      if (this.transformOp.targetVertex >= 0) {
        const inst = this.transformOp.instIdx === -1 ? null : extraInstances[this.transformOp.instIdx];
        const posArr = inst ? inst.renderer.positions : rendererND.positions;
        const idx = this.transformOp.targetVertex * 3;
        this.dragWorldTarget.set(posArr[idx], posArr[idx + 1], posArr[idx + 2]);
        this.setDraggedVertexFromWorldPosition(this.transformOp.instIdx, this.transformOp.targetVertex, this.dragWorldTarget);
      }
    } else {
      if (this.transformOp.targetVertex >= 0) {
        const inst = this.transformOp.instIdx === -1 ? null : extraInstances[this.transformOp.instIdx];
        const posArr = inst ? inst.renderer.positions : rendererND.positions;
        const idx = this.transformOp.targetVertex * 3;
        posArr[idx] = this.transformOp.vertexStart.x;
        posArr[idx + 1] = this.transformOp.vertexStart.y;
        posArr[idx + 2] = this.transformOp.vertexStart.z;
        const targetRenderer = inst ? inst.renderer : rendererND;
        if (this.transformOp.vertexDataStart) {
          const src = inst ? inst.X : this.options.getX();
          const count = inst ? inst.M : M;
          for (let d = 0; d < N; d++) src[d * count + this.transformOp.targetVertex] = this.transformOp.vertexDataStart[d];
        }
        if (inst) {
          this.options.getProjector().project(inst.X, inst.M, inst.Y);
          inst.renderer.writeInterleavedFrom(inst.Y);
        } else {
          this.options.getProjector().project(this.options.getX(), M, this.options.getY());
          rendererND.writeInterleavedFrom(this.options.getY());
        }
        (targetRenderer.geometry.getAttribute('position') as THREE.BufferAttribute).needsUpdate = true;
        targetRenderer.geometry.computeBoundingBox();
        targetRenderer.geometry.computeBoundingSphere();
        if (this.selectionVertexMarker) this.selectionVertexMarker.position.set(posArr[idx], posArr[idx + 1], posArr[idx + 2]);
      } else {
        for (const start of this.transformOp.objectStarts) {
          const target = this.getObjectTransformTarget(start.instIdx);
          const data = this.getObjectData(start.instIdx);
          if (data && start.objectDataStart) data.src.set(start.objectDataStart);
          if (start.originDataStart) this.options.getObjectOrigin(start.instIdx)?.set(start.originDataStart);
          target?.pos.copy(start.startPos);
          target?.rot.copy(start.startRot);
          target?.scale.copy(start.startScale);
        }
      }
    }

    this.transformOp.mode = 'none';
    this.transformOp.vertexDataStart = null;
    this.transformOp.lockAxis = -1;
    this.transformOp.objectDataStart = null;
    this.transformOp.originDataStart = null;
    this.transformOp.extraPlane = false;
    this.transformOp.objectStarts = [];
    this.clearAxisGuide();
    this.transformOp.moveOffset.set(0, 0, 0);
    this.options.projectAndRenderAll();
    if (params.editMode && this.selectedVertex >= 0) this.placeVertexMarker(this.options.getSelectedInstance(), this.selectedVertex);
    this.options.updateSelectionOutline();
    this.updateActionButtons();
    if (commit) this.options.onStateChange?.();
  }

  updateAxisGuide() {
    this.clearAxisGuide();
    if (this.transformOp.mode === 'none') return;
    const hasAxis = this.transformOp.lockAxis !== -1;
    const axisIdx = hasAxis ? this.transformOp.lockAxis : 0;
    const dir = new THREE.Vector3(
      axisIdx === 0 ? 1 : 0,
      axisIdx === 1 ? 1 : 0,
      axisIdx === 2 ? 1 : 0,
    );
    if (!hasAxis && !this.transformOp.extraPlane) return;

    let center = new THREE.Vector3();
    if (this.transformOp.targetVertex >= 0) {
      const inst = this.transformOp.instIdx === -1 ? null : this.options.getExtraInstances()[this.transformOp.instIdx];
      const posArr = inst ? inst.renderer.positions : this.options.getRendererND().positions;
      const idx = this.transformOp.targetVertex * 3;
      center.set(posArr[idx], posArr[idx + 1], posArr[idx + 2]);
    } else {
      center = this.getObjectOriginWorldPosition(this.transformOp.instIdx);
    }

    const len = 3;
    const points = [
      center.clone().addScaledVector(dir, -len),
      center.clone().addScaledVector(dir, len),
    ];
    if (hasAxis) {
      const geom = new THREE.BufferGeometry().setFromPoints(points);
      const mat = new THREE.LineBasicMaterial({ color: 0xffa64d, linewidth: 2, depthTest: false, transparent: true, opacity: 0.9 });
      this.axisGuide = new THREE.Line(geom, mat);
      this.axisGuide.renderOrder = 30;
      this.options.scene.add(this.axisGuide);
    }
    if (this.transformOp.extraPlane) {
      const extraDir = new THREE.Vector3(0, 0, 0);
      extraDir.copy(dir).cross(this.options.camera.getWorldDirection(this.tmpVec).normalize()).normalize();
      if (extraDir.lengthSq() === 0) extraDir.copy(this.options.camera.up).normalize();
      const extraLen = 2;
      const extraPoints = [
        center.clone().addScaledVector(extraDir, -extraLen),
        center.clone().addScaledVector(extraDir, extraLen),
      ];
      const extraGeom = new THREE.BufferGeometry().setFromPoints(extraPoints);
      const extraMat = new THREE.LineBasicMaterial({ color: 0xc084fc, linewidth: 2, depthTest: false, transparent: true, opacity: 0.9 });
      this.extraPlaneGuide = new THREE.Line(extraGeom, extraMat);
      this.extraPlaneGuide.renderOrder = 31;
      this.options.scene.add(this.extraPlaneGuide);
    }
  }

  private getObjectTransformSelection() {
    const selectedInstance = this.options.getSelectedInstance();
    const selected = this.options.getSelectedInstances()
      .filter((idx, position, arr) => arr.indexOf(idx) === position && this.options.getObjectVisible(idx));
    if (selectedInstance !== -2 && this.options.getObjectVisible(selectedInstance) && !selected.includes(selectedInstance)) {
      selected.unshift(selectedInstance);
    }
    return selected;
  }

  private getObjectTransformTarget(instIdx: number) {
    if (instIdx === -1) return this.options.getBaseTransform();
    return this.options.getExtraInstances()[instIdx]?.transform ?? null;
  }

  private getObjectData(instIdx: number) {
    if (instIdx === -1) {
      return {
        src: this.options.getX(),
        count: this.options.getM(),
        originalN: this.options.getBaseOriginalN() || this.options.visibleDims(),
        axisMap: this.options.getBaseAxisMap(),
      };
    }

    const inst = this.options.getExtraInstances()[instIdx];
    if (!inst) return null;
    return {
      src: inst.X,
      count: inst.M,
      originalN: inst.originalN,
      axisMap: inst.axisMap,
    };
  }

  private createObjectTransformStart(instIdx: number, mode: TransformMode): ObjectTransformStart {
    const target = this.getObjectTransformTarget(instIdx);
    const data = this.getObjectData(instIdx);
    const origin = this.options.getObjectOrigin(instIdx);
    const shouldCaptureData = mode === 'rotate';
    return {
      instIdx,
      startPos: target?.pos.clone() ?? new THREE.Vector3(),
      startRot: target?.rot.clone() ?? new THREE.Vector3(),
      startScale: target?.scale.clone() ?? new THREE.Vector3(1, 1, 1),
      originWorldStart: this.getObjectOriginWorldPosition(instIdx),
      objectDataStart: shouldCaptureData && data ? new Float32Array(data.src) : null,
      originDataStart: shouldCaptureData && origin ? new Float32Array(origin) : null,
    };
  }

  private applyObjectTransform(
    clientX: number,
    clientY: number,
    dx: number,
    dy: number,
  ) {
    if (this.transformOp.mode === 'move') {
      const rect = this.options.renderer.domElement.getBoundingClientRect();
      this.options.ndc.set(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1);
      this.options.raycaster.setFromCamera(this.options.ndc, this.options.camera);
      const hit = this.options.raycaster.ray.intersectPlane(this.transformOp.plane, this.tmpVec);
      if (!hit) return;
      const delta = hit.clone().add(this.transformOp.moveOffset).sub(this.transformOp.planeHitStart);
      if (this.transformOp.lockAxis === 0) {
        delta.y = 0;
        delta.z = 0;
      } else if (this.transformOp.lockAxis === 1) {
        delta.x = 0;
        delta.z = 0;
      } else if (this.transformOp.lockAxis === 2) {
        delta.x = 0;
        delta.y = 0;
      }
      this.transformOp.objectStarts.forEach(start => this.applyObjectMove(start, delta));
      this.transformOp.lastHit.copy(hit);
      return;
    }

    if (this.transformOp.mode === 'rotate') {
      if (this.transformOp.extraPlane) {
        this.applyObjectExtraPlaneRotation(dx, dy);
      } else {
        this.applyObjectViewRotation(dx, dy);
      }
      return;
    }

    if (this.transformOp.mode === 'scale') {
      this.applyObjectScale(dx, dy);
    }
  }

  private applyObjectMove(start: ObjectTransformStart, delta: THREE.Vector3) {
    const target = this.getObjectTransformTarget(start.instIdx);
    if (!target) return;
    target.pos.copy(start.startPos).add(delta);
  }

  private applyObjectExtraPlaneRotation(dx: number, dy: number) {
    const primaryStart = this.transformOp.objectStarts.find(start => start.instIdx === this.transformOp.instIdx)
      ?? this.transformOp.objectStarts[0];
    if (!primaryStart) return;
    const primaryData = this.getObjectData(primaryStart.instIdx);
    if (!primaryData) return;

    const dimB = this.options.primaryExtraRotationDepthDim(primaryData.originalN, primaryData.axisMap);
    const dimA = this.options.extraRotationPlaneAxis(this.transformOp.lockAxis, dimB);
    if (dimA < 0 || dimB < 0 || dimA === dimB) return;

    const pivotA = primaryStart.originDataStart?.[dimA] ?? 0;
    const pivotB = primaryStart.originDataStart?.[dimB] ?? 0;
    const angle = (dx - dy) * 0.01;
    const c = Math.cos(angle);
    const s = Math.sin(angle);

    this.transformOp.objectStarts.forEach(start => {
      const data = this.getObjectData(start.instIdx);
      if (!data || !start.objectDataStart || data.count <= 0) return;
      const origin = this.options.getObjectOrigin(start.instIdx);

      for (let i = 0; i < data.count; i++) {
        const a0 = start.objectDataStart[dimA * data.count + i] - pivotA;
        const b0 = start.objectDataStart[dimB * data.count + i] - pivotB;
        data.src[dimA * data.count + i] = pivotA + (a0 * c - b0 * s);
        data.src[dimB * data.count + i] = pivotB + (a0 * s + b0 * c);
      }

      if (origin && start.originDataStart) {
        const a0 = (start.originDataStart[dimA] ?? 0) - pivotA;
        const b0 = (start.originDataStart[dimB] ?? 0) - pivotB;
        origin[dimA] = pivotA + (a0 * c - b0 * s);
        origin[dimB] = pivotB + (a0 * s + b0 * c);
      }
    });
  }

  private objectRotationDelta(dx: number, dy: number) {
    const deltaX = dx * 0.005;
    const deltaY = dy * 0.005;
    if (this.transformOp.lockAxis === 0) return new THREE.Vector3(deltaY, 0, 0);
    if (this.transformOp.lockAxis === 1) return new THREE.Vector3(0, deltaX, 0);
    if (this.transformOp.lockAxis === 2) return new THREE.Vector3(0, 0, deltaX);
    return new THREE.Vector3(deltaY, deltaX, 0);
  }

  private applyObjectViewRotation(dx: number, dy: number) {
    const delta = this.objectRotationDelta(dx, dy);
    this.dragEuler.set(delta.x, delta.y, delta.z);
    this.dragQuat.setFromEuler(this.dragEuler);

    this.transformOp.objectStarts.forEach(start => {
      const target = this.getObjectTransformTarget(start.instIdx);
      if (!target) return;
      target.rot.set(
        start.startRot.x + delta.x,
        start.startRot.y + delta.y,
        start.startRot.z + delta.z,
      );

      const rotatedOrigin = start.originWorldStart
        .clone()
        .sub(this.transformOp.pivotWorldStart)
        .applyQuaternion(this.dragQuat)
        .add(this.transformOp.pivotWorldStart);
      target.pos.copy(start.startPos).add(rotatedOrigin.sub(start.originWorldStart));
    });
  }

  private applyObjectScale(dx: number, dy: number) {
    const delta = (dx - dy) * 0.005;
    const scale = Math.max(0.1, Math.min(5, this.transformOp.startScale + delta));
    const scaleFactor = scale / Math.max(this.transformOp.startScale, 1e-6);

    this.transformOp.objectStarts.forEach(start => {
      const target = this.getObjectTransformTarget(start.instIdx);
      if (!target) return;
      target.scale.copy(start.startScale).multiplyScalar(scaleFactor);
      const scaledOrigin = start.originWorldStart
        .clone()
        .sub(this.transformOp.pivotWorldStart)
        .multiplyScalar(scaleFactor)
        .add(this.transformOp.pivotWorldStart);
      target.pos.copy(start.startPos).add(scaledOrigin.sub(start.originWorldStart));
    });
  }

  private setDraggedVertexFromWorldPosition(instIdx: number, vertexIdx: number, worldPos: THREE.Vector3) {
    const inst = instIdx === -1 ? null : this.options.getExtraInstances()[instIdx];
    const src = inst ? inst.X : this.options.getX();
    const count = inst ? inst.M : this.options.getM();
    const yArr = inst ? inst.Y : this.options.getY();
    const transform = inst ? inst.transform : this.options.getBaseTransform();
    const originalN = inst ? inst.originalN : this.options.getBaseOriginalN() || this.options.visibleDims();
    const axisMap = inst ? inst.axisMap : this.options.getBaseAxisMap();
    const origin = this.options.getObjectOrigin(instIdx);
    const N = this.options.getN();

    if (vertexIdx < 0 || vertexIdx >= count) return false;

    const posArr = inst ? inst.renderer.positions : this.options.getRendererND().positions;
    const pIdx = vertexIdx * 3;

    this.dragEuler.set(transform.rot.x, transform.rot.y, transform.rot.z);
    this.dragQuat.setFromEuler(this.dragEuler);
    this.dragRS.compose(this.dragZero, this.dragQuat, transform.scale);
    this.dragRSInv.copy(this.dragRS).invert();

    this.dragWorldCurrent.set(posArr[pIdx], posArr[pIdx + 1], posArr[pIdx + 2]);
    this.dragYCurrent.set(yArr[vertexIdx], yArr[count + vertexIdx], yArr[2 * count + vertexIdx]);
    this.dragTmpVec.copy(this.dragYCurrent).applyMatrix4(this.dragRS);
    this.dragTranslation.copy(this.dragWorldCurrent).sub(this.dragTmpVec);

    this.dragTargetY.copy(worldPos).sub(this.dragTranslation).applyMatrix4(this.dragRSInv);

    const R = this.options.getRot().matrix;
    for (let d = 0; d < N; d++) {
      let acc = 0;
      for (let a = 0; a < N; a++) acc += R[d * N + a] * src[a * count + vertexIdx];
      this.dragRotated[d] = acc;
      this.dragRotatedNext[d] = acc;
    }

    const params = this.options.getParams();
    const axes = [params.axesX % N, params.axesY % N, params.axesZ % N].map(v => Math.max(0, Math.min(N - 1, v)));
    const perspectiveDims = this.options.perspectiveDimsFor(originalN, axisMap);
    const originProjected = origin
      ? this.projectOriginForDrag(origin, axes, perspectiveDims, this.dragOriginProjected)
      : this.dragOriginProjected.set(0, 0, 0);
    const projectedTargets = [
      this.dragTargetY.x + originProjected.x,
      this.dragTargetY.y + originProjected.y,
      this.dragTargetY.z + originProjected.z,
    ] as const;

    let scale = 1;
    const iterations = perspectiveDims.length > 0 ? 6 : 1;
    for (let iter = 0; iter < iterations; iter++) {
      scale = perspectiveScaleFrom(this.dragRotatedNext, perspectiveDims);
      for (let c = 0; c < 3; c++) {
        const dim = axes[c];
        this.dragRotatedNext[dim] = projectedTargets[c] / scale;
      }
    }
    scale = perspectiveScaleFrom(this.dragRotatedNext, perspectiveDims);

    for (let c = 0; c < 3; c++) {
      const dim = axes[c];
      const projected = projectedTargets[c];
      this.dragRotatedNext[dim] = projected / scale;
    }

    for (let a = 0; a < N; a++) {
      let acc = 0;
      for (let d = 0; d < N; d++) acc += R[d * N + a] * this.dragRotatedNext[d];
      src[a * count + vertexIdx] = acc;
    }

    return true;
  }

  private projectOriginForDrag(
    origin: ObjectOrigin,
    axes: number[],
    perspectiveDims: number[],
    target: THREE.Vector3,
  ) {
    const N = this.options.getN();
    const R = this.options.getRot().matrix;
    for (let d = 0; d < N; d++) {
      let acc = 0;
      for (let a = 0; a < N; a++) acc += R[d * N + a] * (origin[a] ?? 0);
      this.dragRotated[d] = acc;
    }

    if (N >= 4) {
      const scale = perspectiveScaleFrom(this.dragRotated, perspectiveDims);
      return target.set(
        (this.dragRotated[axes[0]] ?? 0) * scale,
        (this.dragRotated[axes[1]] ?? 0) * scale,
        (this.dragRotated[axes[2]] ?? 0) * scale,
      );
    }

    const P = this.options.getProjector().P;
    const projected = [0, 0, 0];
    for (let c = 0; c < 3; c++) {
      let acc = 0;
      const offset = c * N;
      for (let k = 0; k < N; k++) acc += (P[offset + k] ?? 0) * (this.dragRotated[k] ?? 0);
      projected[c] = acc;
    }
    return target.set(projected[0], projected[1], projected[2]);
  }

  private getObjectOriginWorldPosition(instIdx: number) {
    if (instIdx === -1 && this.options.getM() > 0) return this.options.getRendererND().originPosition.clone();
    if (instIdx >= 0) {
      const inst = this.options.getExtraInstances()[instIdx];
      if (inst) return inst.renderer.originPosition.clone();
    }
    return computeCenterFromPositions(this.options.getRendererND().positions, this.options.getM());
  }

  private resetControlDrag() {
    this.controlTransformDrag.active = false;
    this.controlTransformDrag.started = false;
    this.controlTransformDrag.pointerId = -1;
    this.controlTransformDrag.mode = 'none';
    this.controlTransformDrag.sourceButton = null;
  }
}
