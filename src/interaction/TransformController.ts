import * as THREE from 'three';
import type { RotND } from '../RotND';
import { AXIS_PALETTE } from '../constants';
import { cellCount, getCellBoundaryFaceIds, getCellVertices, type CellTopology } from '../geometry/cellTopology';
import type { NDProjector } from '../geometry/NDProjector';
import { perspectiveScaleFrom, type AxisMap } from '../geometry/projectionUtils';
import type { HypercubeRenderer } from '../rendering/HypercubeRenderer';
import type { ObjectOrigin } from '../scene/objectOrigin';
import type { EditCellDimension, Instance, TransformMode, TransformState } from '../scene/types';
import { EditOverlayRenderer } from './EditOverlayRenderer';

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
  isLightSelection: (idx: number) => boolean;
  getLightPosition: (idx: number) => THREE.Vector3 | null;
  setLightPosition: (idx: number, position: THREE.Vector3) => void;
  visibleDims: () => number;
  perspectiveDimsFor: (localN: number, axisMap: AxisMap) => number[];
  primaryExtraRotationDepthDim: (localN: number, axisMap: AxisMap) => number;
  extraRotationPlaneAxis: (lockAxis: -1 | 0 | 1 | 2, depthDim: number) => number;
  projectAndRenderAll: () => void;
  updateSelectionOutline: () => void;
  pushUndoSnapshot: () => void;
  onEditSelectionChange?: () => void;
  onStateChange?: () => void;
};

type TransformOperation = {
  mode: TransformMode;
  instIdx: number;
  targetVertex: number;
  targetVertices: number[];
  startPos: THREE.Vector3;
  startRot: THREE.Vector3;
  startScale: number;
  startMouse: THREE.Vector2;
  vertexStart: THREE.Vector3;
  editVertexStarts: THREE.Vector3[];
  editProjectedStarts: THREE.Vector3[];
  editLocalDirections: Map<number, THREE.Vector3>;
  axis: THREE.Vector3;
  plane: THREE.Plane;
  planeHitStart: THREE.Vector3;
  lastHit: THREE.Vector3;
  vertexDataStart: Float32Array | null;
  lockAxis: -1 | 0 | 1 | 2;
  localAxisDim: number;
  extraAxisDim: number;
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
  lightPositionStart: THREE.Vector3 | null;
};

type TransformGizmoConstraint = {
  kind: 'free' | 'axis' | 'extra';
  axisSlot: -1 | 0 | 1 | 2;
  extraDim: number;
};

const VERTEX_MARKER_PIXEL_DIAMETER = 8;
const CELL_CENTER_MARKER_PIXEL_DIAMETER = 6.5;
const SELECTED_MARKER_PIXEL_DIAMETER = 11;
const TRANSFORM_GIZMO_MIN_PIXEL_RADIUS = 54;
const TRANSFORM_GIZMO_HANDLE_PIXEL_DIAMETER = 15;
const TRANSFORM_GIZMO_HANDLE_PICK_RADIUS_PX = 18;
const TRANSFORM_GIZMO_HANDLE_COARSE_PICK_RADIUS_PX = 34;
const TRANSFORM_GIZMO_SEGMENTS = 96;
const MIN_TRANSFORM_SCALE = 1e-4;
const PROJECTED_AXIS_DIRECTIONS = [
  new THREE.Vector3(1, 0, 0),
  new THREE.Vector3(0, 1, 0),
  new THREE.Vector3(0, 0, 1),
];
const FREE_HANDLE_COLOR = AXIS_PALETTE[7];
const FREE_GIZMO_CONSTRAINT: TransformGizmoConstraint = {
  kind: 'free',
  axisSlot: -1,
  extraDim: -1,
};
const PROJECTED_AXIS_CONSTRAINTS: TransformGizmoConstraint[] = [
  { kind: 'axis', axisSlot: 0, extraDim: -1 },
  { kind: 'axis', axisSlot: 1, extraDim: -1 },
  { kind: 'axis', axisSlot: 2, extraDim: -1 },
];
const AXIS_LOCK_KEYS = ['x', 'y', 'z', 'w', 'v', 'u', 't', 's'];

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

function computeCenterFromVectors(points: THREE.Vector3[]) {
  if (!points.length) return new THREE.Vector3();
  const center = new THREE.Vector3();
  points.forEach(point => center.add(point));
  return center.multiplyScalar(1 / points.length);
}

function editCellLabel(dimension: number) {
  if (dimension === 0) return 'vertex';
  if (dimension === 1) return 'edge';
  if (dimension === 2) return 'face';
  if (dimension === 3) return 'volume';
  return `${dimension}-cell`;
}

export class TransformController {
  private editCellDimension: EditCellDimension = 0;
  private selectedVertex = -1;
  private selectedEditVertices: number[] = [];
  private selectedCellId = -1;
  private selectedCellIds: number[] = [];
  private readonly editOverlays: EditOverlayRenderer;
  private axisGuide: THREE.Line | null = null;
  private extraPlaneGuide: THREE.Line | null = null;
  private activeTransformMode: TransformMode = 'none';
  private transformGizmo: THREE.Group | null = null;
  private transformGizmoRings: THREE.LineLoop[] = [];
  private transformGizmoHandles: THREE.Mesh[] = [];
  private transformGizmoExtraHandles: THREE.Mesh[] = [];
  private transformGizmoExtraSignature = '';
  private readonly transformGizmoCenter = new THREE.Vector3();
  private readonly transformGizmoPickWorld = new THREE.Vector3();
  private pendingGizmoConstraint: TransformGizmoConstraint | null = null;
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
    targetVertices: [],
    startPos: new THREE.Vector3(),
    startRot: new THREE.Vector3(),
    startScale: 1,
    startMouse: new THREE.Vector2(),
    vertexStart: new THREE.Vector3(),
    editVertexStarts: [],
    editProjectedStarts: [],
    editLocalDirections: new Map(),
    axis: new THREE.Vector3(),
    plane: new THREE.Plane(),
    planeHitStart: new THREE.Vector3(),
    lastHit: new THREE.Vector3(),
    vertexDataStart: null,
    lockAxis: -1,
    localAxisDim: -1,
    extraAxisDim: -1,
    objectDataStart: null,
    originDataStart: null,
    extraPlane: false,
    moveOffset: new THREE.Vector3(),
    objectStarts: [],
    pivotWorldStart: new THREE.Vector3(),
  };

  private readonly gizmoDrag = {
    active: false,
    pointerId: -1,
    pointerCaptureTarget: null as HTMLElement | null,
  };

  constructor(private readonly options: TransformControllerOptions) {
    this.editOverlays = new EditOverlayRenderer({
      scene: options.scene,
      camera: options.camera,
      renderer: options.renderer,
    });
  }

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
    this.editCellDimension = 0;
    this.selectedVertex = vertex;
    this.selectedEditVertices = vertex >= 0 ? [vertex] : [];
    this.selectedCellId = vertex;
    this.selectedCellIds = vertex >= 0 ? [vertex] : [];
    this.updateActionButtons();
    this.options.onEditSelectionChange?.();
  }

  getEditCellDimension() {
    return this.editCellDimension;
  }

  setEditCellDimension(dimension: EditCellDimension) {
    const next = Math.max(0, Math.floor(dimension));
    if (this.editCellDimension === next) return;
    this.editCellDimension = next;
    this.clearEditSelection();
  }

  setSelectedEditElement(dimension: EditCellDimension, vertices: number[], cellId = -1) {
    this.editCellDimension = Math.max(0, Math.floor(dimension));
    const uniqueVertices = vertices
      .filter(vertex => Number.isInteger(vertex) && vertex >= 0)
      .filter((vertex, index, arr) => arr.indexOf(vertex) === index);
    this.selectedEditVertices = uniqueVertices;
    this.selectedVertex = this.editCellDimension === 0 && uniqueVertices.length ? uniqueVertices[0] : -1;
    this.selectedCellId = cellId;
    this.selectedCellIds = cellId >= 0 ? [cellId] : [];
    this.updateActionButtons();
    this.options.onEditSelectionChange?.();
  }

  setSelectedEditCells(dimension: EditCellDimension, cellIds: number[], topology: CellTopology | undefined) {
    const nextDimension = Math.max(0, Math.floor(dimension));
    this.editCellDimension = nextDimension;
    const count = cellCount(topology, nextDimension);
    const nextCellIds = cellIds
      .filter(cellId => Number.isInteger(cellId) && cellId >= 0 && cellId < count)
      .filter((cellId, index, arr) => arr.indexOf(cellId) === index);
    const vertices: number[] = [];
    for (const cellId of nextCellIds) {
      for (const vertex of getCellVertices(topology, nextDimension, cellId)) {
        if (vertex >= 0 && !vertices.includes(vertex)) vertices.push(vertex);
      }
    }
    this.selectedCellIds = nextCellIds;
    this.selectedCellId = nextCellIds[nextCellIds.length - 1] ?? -1;
    this.selectedEditVertices = vertices;
    this.selectedVertex = nextDimension === 0 && vertices.length ? vertices[0] : -1;
    if (!nextCellIds.length) this.clearEditSelection();
    else {
      this.updateActionButtons();
      this.options.onEditSelectionChange?.();
    }
  }

  toggleSelectedEditElement(
    dimension: EditCellDimension,
    vertices: number[],
    cellId: number,
    topology: CellTopology | undefined,
  ) {
    const nextDimension = Math.max(0, Math.floor(dimension));
    const currentCellIds = this.editCellDimension === nextDimension ? [...this.selectedCellIds] : [];
    const existingIndex = currentCellIds.indexOf(cellId);
    if (existingIndex >= 0) currentCellIds.splice(existingIndex, 1);
    else if (cellId >= 0) currentCellIds.push(cellId);

    if (topology) {
      this.setSelectedEditCells(nextDimension, currentCellIds, topology);
      return;
    }

    if (existingIndex >= 0) {
      this.clearEditSelection();
      return;
    }
    this.setSelectedEditElement(nextDimension, vertices, cellId);
  }

  selectAllEditCells(dimension: EditCellDimension, topology: CellTopology | undefined) {
    const nextDimension = Math.max(0, Math.floor(dimension));
    const count = cellCount(topology, nextDimension);
    this.setSelectedEditCells(nextDimension, Array.from({ length: count }, (_entry, cellId) => cellId), topology);
  }

  clearEditSelection() {
    this.selectedVertex = -1;
    this.selectedEditVertices = [];
    this.selectedCellId = -1;
    this.selectedCellIds = [];
    this.clearVertexMarker();
    this.clearEditComponentOverlay();
    this.updateActionButtons();
    this.options.onEditSelectionChange?.();
  }

  hasEditSelection() {
    return this.selectedEditVertices.length > 0;
  }

  getEditSelection() {
    if (!this.hasEditSelection()) return null;
    return {
      dimension: this.editCellDimension,
      cellId: this.selectedCellId,
      cellIds: [...this.selectedCellIds],
      vertices: [...this.selectedEditVertices],
      label: this.editSelectionLabel(),
    };
  }

  editSelectionLabel() {
    return editCellLabel(this.editCellDimension);
  }

  clearSelectionVisuals() {
    this.clearEditSelection();
    this.clearVertexMarker();
    this.clearVertexCloud();
    this.clearFaceCenterCloud();
    this.clearEditWireOverlay();
    this.clearEditComponentOverlay();
    this.clearTransformMode();
  }

  clearVertexMarker() {
    this.editOverlays.clearSelectionVertexMarker();
  }

  clearVertexCloud() {
    this.editOverlays.clearVertexCloud();
  }

  clearFaceCenterCloud() {
    this.editOverlays.clearFaceCenterCloud();
  }

  clearEditWireOverlay() {
    this.editOverlays.clearEditWireOverlay();
  }

  clearEditComponentOverlay() {
    this.editOverlays.clearEditComponentOverlay();
  }

  private clearEditFaceTintOverlay() {
    this.editOverlays.clearEditFaceTintOverlay();
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
      this.clearFaceCenterCloud();
      this.clearEditWireOverlay();
      this.clearEditComponentOverlay();
      return;
    }

    if (this.editCellDimension !== 0) {
      this.clearVertexCloud();
      this.clearVertexMarker();
      if (this.editCellDimension >= 2) this.updateFaceCenterCloud(instIdx);
      else this.clearFaceCenterCloud();
      this.updateEditWireOverlay(instIdx);
      this.updateEditComponentOverlay(instIdx);
      return;
    }

    this.clearFaceCenterCloud();
    this.clearEditWireOverlay();
    this.clearEditComponentOverlay();

    const rendererRef = instIdx === -1
      ? this.options.getRendererND()
      : this.options.getExtraInstances()[instIdx].renderer;
    const count = instIdx === -1 ? this.options.getM() : this.options.getExtraInstances()[instIdx].M;
    if (!rendererRef || count <= 0) return;

    this.clearVertexCloud();
    const mat = new THREE.MeshBasicMaterial({
      color: 0xbfc7d5,
      depthTest: false,
      depthWrite: false,
    });
    const vertexCloud = new THREE.InstancedMesh(this.options.vertexGeo, mat, count);
    const dummy = new THREE.Object3D();
    const posArr = rendererRef.positions;
    for (let i = 0; i < count; i++) {
      const pIdx = i * 3;
      dummy.position.set(posArr[pIdx], posArr[pIdx + 1], posArr[pIdx + 2]);
      dummy.updateMatrix();
      vertexCloud.setMatrixAt(i, dummy.matrix);
    }
    vertexCloud.instanceMatrix.needsUpdate = true;
    vertexCloud.renderOrder = 5;
    this.editOverlays.setVertexCloud(vertexCloud);
    if (this.selectedEditVertices.length) this.placeVertexMarkers(instIdx, this.selectedEditVertices);
  }

  private updateFaceCenterCloud(instIdx: number) {
    const rendererRef = instIdx === -1
      ? this.options.getRendererND()
      : this.options.getExtraInstances()[instIdx]?.renderer;
    const topology = rendererRef?.getCellTopologyForSelection();
    const dim = this.editCellDimension;
    const count = cellCount(topology, dim);
    if (!rendererRef || !topology || count <= 0) {
      this.clearFaceCenterCloud();
      return;
    }

    const centers: Array<{ sum: THREE.Vector3; count: number }> = [];
    const posArr = rendererRef.positions;
    for (let cellId = 0; cellId < count; cellId++) {
      const vertices = getCellVertices(topology, dim, cellId);
      const center = { sum: new THREE.Vector3(), count: 0 };
      for (const vertex of vertices) {
        const pIdx = vertex * 3;
        if (pIdx < 0 || pIdx + 2 >= posArr.length) continue;
        center.sum.x += posArr[pIdx];
        center.sum.y += posArr[pIdx + 1];
        center.sum.z += posArr[pIdx + 2];
        center.count += 1;
      }
      if (center.count > 0) centers.push(center);
    }

    this.clearFaceCenterCloud();
    const entries = centers.filter(center => center.count > 0);
    if (!entries.length) return;

    const mat = new THREE.MeshBasicMaterial({
      color: 0xffd08a,
      transparent: true,
      opacity: 0.88,
      depthTest: false,
      depthWrite: false,
    });
    const faceCenterCloud = new THREE.InstancedMesh(this.options.vertexGeo, mat, entries.length);
    const dummy = new THREE.Object3D();
    entries.forEach((center, idx) => {
      dummy.position.copy(center.sum).multiplyScalar(1 / center.count);
      dummy.scale.setScalar(0.72);
      dummy.updateMatrix();
      faceCenterCloud.setMatrixAt(idx, dummy.matrix);
    });
    faceCenterCloud.instanceMatrix.needsUpdate = true;
    faceCenterCloud.renderOrder = 23;
    this.editOverlays.setFaceCenterCloud(faceCenterCloud);
  }

  updateScreenSpaceMarkerScales() {
    this.editOverlays.updateScreenSpaceMarkerScales({
      vertex: VERTEX_MARKER_PIXEL_DIAMETER,
      faceCenter: CELL_CENTER_MARKER_PIXEL_DIAMETER,
      selected: SELECTED_MARKER_PIXEL_DIAMETER,
    });
    this.updateTransformGizmo();
  }

  private screenSpaceMarkerScale(position: THREE.Vector3, pixelDiameter: number) {
    return this.editOverlays.screenSpaceMarkerScale(position, pixelDiameter);
  }

  private updateEditWireOverlay(instIdx: number) {
    const rendererRef = instIdx === -1
      ? this.options.getRendererND()
      : this.options.getExtraInstances()[instIdx]?.renderer;
    if (!rendererRef?.line?.geometry) {
      this.clearEditWireOverlay();
      return;
    }

    if (this.editOverlays.hasEditWireGeometry(rendererRef.line.geometry)) {
      this.editOverlays.ensureEditWireOverlayInScene();
      return;
    }

    this.clearEditWireOverlay();
    const mat = new THREE.LineBasicMaterial({
      color: 0xffa64d,
      transparent: true,
      opacity: 0.62,
      depthTest: false,
      depthWrite: false,
    });
    const editWireOverlay = new THREE.LineSegments(rendererRef.line.geometry, mat);
    editWireOverlay.renderOrder = 18;
    this.editOverlays.setEditWireOverlay(editWireOverlay);
  }

  private updateEditComponentOverlay(instIdx: number) {
    this.clearEditComponentOverlay();
    if (!this.selectedEditVertices.length) return;

    const rendererRef = instIdx === -1
      ? this.options.getRendererND()
      : this.options.getExtraInstances()[instIdx]?.renderer;
    if (!rendererRef) return;

    const points: THREE.Vector3[] = [];
    const posArr = rendererRef.positions;
    const pushVertexTo = (target: THREE.Vector3[], vertex: number) => {
      const pIdx = vertex * 3;
      if (pIdx < 0 || pIdx + 2 >= posArr.length) return false;
      target.push(new THREE.Vector3(posArr[pIdx], posArr[pIdx + 1], posArr[pIdx + 2]));
      return true;
    };
    const pushVertex = (vertex: number) => { pushVertexTo(points, vertex); };
    const topology = rendererRef.getCellTopologyForSelection();
    const selectedCellIds = this.selectedCellIds.length
      ? this.selectedCellIds
      : (this.selectedCellId >= 0 ? [this.selectedCellId] : []);

    if (this.editCellDimension === 1) {
      if (topology && selectedCellIds.length) {
        selectedCellIds.forEach(cellId => {
          const edge = getCellVertices(topology, 1, cellId);
          if (edge.length < 2) return;
          pushVertex(edge[0]);
          pushVertex(edge[1]);
        });
      } else {
        if (this.selectedEditVertices.length < 2) return;
        pushVertex(this.selectedEditVertices[0]);
        pushVertex(this.selectedEditVertices[1]);
      }
    } else if (this.editCellDimension >= 2) {
      if (!topology) return;
      const tintPoints: THREE.Vector3[] = [];
      const edgeCounts = new Map<string, [number, number, number]>();
      const addFaceEdge = (a: number, b: number) => {
        const key = a < b ? `${a}:${b}` : `${b}:${a}`;
        const current = edgeCounts.get(key);
        if (current) current[2] += 1;
        else edgeCounts.set(key, [a, b, 1]);
      };
      const addFace = (faceVertices: number[]) => {
        if (faceVertices.length < 3) return;
        const tintStart = tintPoints.length;
        for (let i = 1; i < faceVertices.length - 1; i++) {
          pushVertexTo(tintPoints, faceVertices[0]);
          pushVertexTo(tintPoints, faceVertices[i]);
          pushVertexTo(tintPoints, faceVertices[i + 1]);
        }
        if (tintPoints.length === tintStart) return;
        for (let i = 0; i < faceVertices.length; i++) {
          addFaceEdge(faceVertices[i], faceVertices[(i + 1) % faceVertices.length]);
        }
      };

      if (this.editCellDimension === 2) {
        if (selectedCellIds.length) selectedCellIds.forEach(cellId => addFace(getCellVertices(topology, 2, cellId)));
        else addFace(this.selectedEditVertices);
      } else {
        const faceIds = selectedCellIds.flatMap(cellId => (
          getCellBoundaryFaceIds(topology, this.editCellDimension, cellId)
        ));
        if (faceIds.length) {
          faceIds.forEach(faceId => addFace(getCellVertices(topology, 2, faceId)));
        } else {
          const selected = new Set(this.selectedEditVertices);
          const faceCount = cellCount(topology, 2);
          for (let faceId = 0; faceId < faceCount; faceId++) {
            const faceVertices = getCellVertices(topology, 2, faceId);
            if (faceVertices.length >= 3 && faceVertices.every(vertex => selected.has(vertex))) addFace(faceVertices);
          }
        }
      }

      this.createFaceTintOverlay(tintPoints);
      let edgeEntries = Array.from(edgeCounts.values()).filter(([, , count]) => count === 1);
      if (!edgeEntries.length) edgeEntries = Array.from(edgeCounts.values());
      edgeEntries.forEach(([a, b]) => {
        pushVertex(a);
        pushVertex(b);
      });
    }

    if (points.length < 2) return;
    const geom = new THREE.BufferGeometry().setFromPoints(points);
    const mat = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.96,
      depthTest: false,
      depthWrite: false,
    });
    const editComponentOverlay = new THREE.LineSegments(geom, mat);
    editComponentOverlay.renderOrder = 22;
    this.editOverlays.setEditComponentOverlay(editComponentOverlay);
  }

  private createFaceTintOverlay(points: THREE.Vector3[]) {
    if (points.length < 3) return;
    const geom = new THREE.BufferGeometry().setFromPoints(points);
    const mat = new THREE.MeshBasicMaterial({
      color: 0xffa64d,
      transparent: true,
      opacity: 0.26,
      depthTest: false,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const editFaceTintOverlay = new THREE.Mesh(geom, mat);
    editFaceTintOverlay.renderOrder = 21;
    this.editOverlays.setEditFaceTintOverlay(editFaceTintOverlay);
  }

  placeVertexMarker(instIdx: number, vertexIdx: number) {
    this.placeVertexMarkers(instIdx, [vertexIdx]);
  }

  private placeVertexMarkers(instIdx: number, vertexIndices: number[]) {
    if (!this.options.getObjectVisible(instIdx)) return;
    const rendererRef = instIdx === -1
      ? this.options.getRendererND()
      : this.options.getExtraInstances()[instIdx].renderer;
    const count = instIdx === -1 ? this.options.getM() : this.options.getExtraInstances()[instIdx].M;
    const posArr = rendererRef.positions;
    const vertices = vertexIndices
      .filter(vertex => Number.isInteger(vertex) && vertex >= 0 && vertex < count)
      .filter((vertex, index, arr) => arr.indexOf(vertex) === index);
    this.clearVertexMarker();
    if (!vertices.length) return;

    const mat = new THREE.MeshBasicMaterial({
      color: 0xffa64d,
      depthTest: false,
      depthWrite: false,
    });
    const selectionVertexMarker = new THREE.InstancedMesh(this.options.vertexGeo, mat, vertices.length);
    const dummy = new THREE.Object3D();
    vertices.forEach((vertex, idx) => {
      const pIdx = vertex * 3;
      dummy.position.set(posArr[pIdx], posArr[pIdx + 1], posArr[pIdx + 2]);
      dummy.scale.setScalar(this.screenSpaceMarkerScale(dummy.position, SELECTED_MARKER_PIXEL_DIAMETER));
      dummy.updateMatrix();
      selectionVertexMarker.setMatrixAt(idx, dummy.matrix);
    });
    selectionVertexMarker.instanceMatrix.needsUpdate = true;
    selectionVertexMarker.renderOrder = 20;
    this.editOverlays.setSelectionVertexMarker(selectionVertexMarker);
  }

  updateActionButtons() {
    const buttons: { mode: TransformMode; el: HTMLButtonElement | null; }[] = [
      { mode: 'move', el: this.options.moveButton },
      { mode: 'rotate', el: this.options.rotateButton },
      { mode: 'scale', el: this.options.scaleButton },
    ];
    if (!this.canUseTransformMode(this.activeTransformMode)) this.activeTransformMode = 'none';

    for (const entry of buttons) {
      if (!entry.el) continue;
      const enabled = this.canUseTransformMode(entry.mode);
      entry.el.classList.toggle('active', this.activeTransformMode === entry.mode);
      entry.el.disabled = !enabled;
    }
    this.updateTransformGizmo();
  }

  setTransformMode(mode: TransformMode) {
    if (mode === this.activeTransformMode) {
      this.updateActionButtons();
      return;
    }
    if (this.transformOp.mode !== 'none') this.finish(false);
    if (!this.canUseTransformMode(mode)) return;
    this.activeTransformMode = mode;
    this.updateActionButtons();
  }

  toggleTransformMode(mode: TransformMode) {
    if (mode === 'none' || this.activeTransformMode === mode) this.clearTransformMode();
    else this.setTransformMode(mode);
  }

  clearTransformMode() {
    if (this.transformOp.mode !== 'none') this.finish(false);
    this.activeTransformMode = 'none';
    this.pendingGizmoConstraint = null;
    this.clearTransformGizmo();
    this.updateActionButtons();
  }

  private hasTransformTarget() {
    return this.options.getParams().editMode
      ? this.hasEditSelection()
      : this.getObjectTransformSelection().length > 0;
  }

  canUseTransformMode(mode: TransformMode) {
    if (mode === 'none') return true;
    if (!this.hasTransformTarget()) return false;
    if (!this.options.getParams().editMode && this.getObjectTransformSelection().some(idx => this.options.isLightSelection(idx))) {
      return mode === 'move';
    }
    return !(this.options.getParams().editMode && this.editCellDimension === 0 && mode !== 'move');
  }

  private updateTransformGizmo() {
    if (this.activeTransformMode === 'none' || !this.hasTransformTarget()) {
      this.clearTransformGizmo();
      return;
    }

    const bounds = this.computeTransformGizmoBounds();
    if (!bounds) {
      this.clearTransformGizmo();
      return;
    }

    this.ensureTransformGizmo();
    if (!this.transformGizmo) return;

    const minRadius = this.screenSpaceWorldRadius(bounds.center, TRANSFORM_GIZMO_MIN_PIXEL_RADIUS);
    const radius = Math.max(bounds.radius * 1.18, minRadius, 0.08);
    const handleScale = this.screenSpaceMarkerScale(bounds.center, TRANSFORM_GIZMO_HANDLE_PIXEL_DIAMETER) / radius;
    const extraDims = this.extraAxisDimsForTransformTarget();
    this.syncTransformGizmoExtraHandles(extraDims);
    this.updateTransformGizmoColors(extraDims);

    this.transformGizmo.position.copy(bounds.center);
    this.transformGizmo.quaternion.identity();
    this.transformGizmo.scale.setScalar(radius);
    this.transformGizmoHandles.forEach(handle => {
      handle.scale.setScalar(handleScale);
    });
    if (!this.options.scene.children.includes(this.transformGizmo)) this.options.scene.add(this.transformGizmo);
  }

  private ensureTransformGizmo() {
    if (this.transformGizmo) return;

    const group = new THREE.Group();
    group.name = 'TransformGizmo';
    group.renderOrder = 35;

    this.transformGizmoRings = [0, 1, 2].map(axisSlot => {
      const ring = new THREE.LineLoop(
        new THREE.BufferGeometry().setFromPoints(this.createGizmoRingPoints(axisSlot)),
        new THREE.LineBasicMaterial({
          color: this.axisPaletteColor(axisSlot),
          transparent: true,
          opacity: 0.72,
          depthTest: false,
          depthWrite: false,
        }),
      );
      ring.renderOrder = 35;
      group.add(ring);
      return ring;
    });

    const makeHandle = (color: THREE.ColorRepresentation, constraint: TransformGizmoConstraint, position: THREE.Vector3) => {
      const handle = new THREE.Mesh(
        this.options.vertexGeo,
        new THREE.MeshBasicMaterial({
          color,
          transparent: true,
          opacity: 0.96,
          depthTest: false,
          depthWrite: false,
        }),
      );
      handle.position.copy(position);
      handle.renderOrder = 36;
      handle.userData.transformGizmoHandle = true;
      handle.userData.transformGizmoConstraint = constraint;
      group.add(handle);
      return handle;
    };

    this.transformGizmoHandles = [
      makeHandle(FREE_HANDLE_COLOR, FREE_GIZMO_CONSTRAINT, new THREE.Vector3(0, 0, 0)),
      ...PROJECTED_AXIS_DIRECTIONS.map((direction, axisSlot) => makeHandle(
        this.axisPaletteColor(axisSlot),
        PROJECTED_AXIS_CONSTRAINTS[axisSlot],
        direction,
      )),
    ];

    this.transformGizmo = group;
    this.options.scene.add(group);
  }

  private syncTransformGizmoExtraHandles(extraDims: number[]) {
    if (!this.transformGizmo) return;
    const signature = extraDims.join(':');
    if (signature === this.transformGizmoExtraSignature) return;

    for (const handle of this.transformGizmoExtraHandles) {
      this.transformGizmo.remove(handle);
      this.transformGizmoHandles = this.transformGizmoHandles.filter(entry => entry !== handle);
      this.disposeRenderable(handle);
    }
    this.transformGizmoExtraHandles = [];
    this.transformGizmoExtraSignature = signature;

    extraDims.forEach((dim, index) => {
      const handle = new THREE.Mesh(
        this.options.vertexGeo,
        new THREE.MeshBasicMaterial({
          color: this.axisPaletteColor(dim),
          transparent: true,
          opacity: 0.96,
          depthTest: false,
          depthWrite: false,
        }),
      );
      handle.position.copy(this.extraHandleDirection(index, extraDims.length));
      handle.renderOrder = 36;
      handle.userData.transformGizmoHandle = true;
      handle.userData.transformGizmoConstraint = {
        kind: 'extra',
        axisSlot: -1,
        extraDim: dim,
      } satisfies TransformGizmoConstraint;
      this.transformGizmo?.add(handle);
      this.transformGizmoExtraHandles.push(handle);
      this.transformGizmoHandles.push(handle);
    });
  }

  private extraHandleDirection(index: number, total: number) {
    if (total <= 1) return new THREE.Vector3(1, 1, 1).normalize().multiplyScalar(1.18);
    const angle = ((index + 0.5) / total) * Math.PI * 2;
    const z = index % 2 === 0 ? 0.58 : -0.58;
    const radial = Math.sqrt(Math.max(0, 1 - (z * z)));
    return new THREE.Vector3(Math.cos(angle) * radial, Math.sin(angle) * radial, z)
      .normalize()
      .multiplyScalar(1.18);
  }

  private updateTransformGizmoColors(extraDims: number[]) {
    const params = this.options.getParams();
    const activeDims = [params.axesX, params.axesY, params.axesZ];
    this.transformGizmoRings.forEach((ring, axisSlot) => {
      this.setRenderableColor(ring.material, this.axisPaletteColor(activeDims[axisSlot] ?? axisSlot));
    });
    this.transformGizmoHandles.forEach((handle, index) => {
      if (index === 0) {
        this.setRenderableColor(handle.material, FREE_HANDLE_COLOR);
      } else if (index >= 1 && index <= 3) {
        this.setRenderableColor(handle.material, this.axisPaletteColor(activeDims[index - 1] ?? index - 1));
      }
    });
    this.transformGizmoExtraHandles.forEach((handle, index) => {
      this.setRenderableColor(handle.material, this.axisPaletteColor(extraDims[index] ?? index + 3));
    });
  }

  private axisPaletteColor(dim: number) {
    const index = ((dim % AXIS_PALETTE.length) + AXIS_PALETTE.length) % AXIS_PALETTE.length;
    return AXIS_PALETTE[index];
  }

  private setRenderableColor(material: THREE.Material | THREE.Material[], color: THREE.ColorRepresentation) {
    if (Array.isArray(material)) {
      material.forEach(entry => this.setRenderableColor(entry, color));
      return;
    }
    if ('color' in material && material.color instanceof THREE.Color) material.color.set(color);
  }

  private disposeRenderable(object: THREE.Object3D) {
    const renderable = object as THREE.Mesh | THREE.Line;
    if ('geometry' in renderable && renderable.geometry !== this.options.vertexGeo) {
      renderable.geometry.dispose();
    }
    if ('material' in renderable) {
      const material = renderable.material;
      if (Array.isArray(material)) material.forEach(entry => entry.dispose());
      else material.dispose();
    }
  }

  private createGizmoRingPoints(axisSlot: number) {
    const points: THREE.Vector3[] = [];
    for (let i = 0; i < TRANSFORM_GIZMO_SEGMENTS; i++) {
      const angle = (i / TRANSFORM_GIZMO_SEGMENTS) * Math.PI * 2;
      const a = Math.cos(angle);
      const b = Math.sin(angle);
      if (axisSlot === 0) points.push(new THREE.Vector3(0, a, b));
      else if (axisSlot === 1) points.push(new THREE.Vector3(a, 0, b));
      else points.push(new THREE.Vector3(a, b, 0));
    }
    return points;
  }

  private clearTransformGizmo() {
    if (!this.transformGizmo) return;
    this.options.scene.remove(this.transformGizmo);
    const materials = new Set<THREE.Material>();
    this.transformGizmo.traverse(object => {
      const maybeRenderable = object as THREE.Mesh | THREE.Line;
      if ('geometry' in maybeRenderable && maybeRenderable.geometry !== this.options.vertexGeo) {
        maybeRenderable.geometry.dispose();
      }
      if ('material' in maybeRenderable) {
        const material = maybeRenderable.material;
        if (Array.isArray(material)) material.forEach(entry => materials.add(entry));
        else materials.add(material);
      }
    });
    materials.forEach(material => material.dispose());
    this.transformGizmo = null;
    this.transformGizmoRings = [];
    this.transformGizmoHandles = [];
    this.transformGizmoExtraHandles = [];
    this.transformGizmoExtraSignature = '';
  }

  private pickTransformGizmoConstraint(ev: PointerEvent): TransformGizmoConstraint | null {
    if (!this.transformGizmoHandles.length || !this.transformGizmo) return null;
    const rect = this.options.renderer.domElement.getBoundingClientRect();
    this.options.ndc.set(
      ((ev.clientX - rect.left) / rect.width) * 2 - 1,
      -((ev.clientY - rect.top) / rect.height) * 2 + 1,
    );
    this.options.raycaster.setFromCamera(this.options.ndc, this.options.camera);
    const hit = this.options.raycaster
      .intersectObjects(this.transformGizmoHandles, false)
      .find(entry => entry.object.visible);
    const constraint = hit?.object.userData.transformGizmoConstraint as TransformGizmoConstraint | undefined;
    if (constraint) return constraint;

    this.transformGizmo.updateMatrixWorld(true);
    const coarsePointer = ev.pointerType === 'touch'
      || (typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches);
    const pickRadius = coarsePointer
      ? TRANSFORM_GIZMO_HANDLE_COARSE_PICK_RADIUS_PX
      : TRANSFORM_GIZMO_HANDLE_PICK_RADIUS_PX;
    const pickRadiusSq = pickRadius * pickRadius;
    let bestDistanceSq = pickRadiusSq;
    let bestConstraint: TransformGizmoConstraint | null = null;

    for (const handle of this.transformGizmoHandles) {
      if (!handle.visible) continue;
      handle.getWorldPosition(this.transformGizmoPickWorld);
      this.transformGizmoPickWorld.project(this.options.camera);
      if (this.transformGizmoPickWorld.z < -1 || this.transformGizmoPickWorld.z > 1) continue;
      const screenX = rect.left + ((this.transformGizmoPickWorld.x + 1) * 0.5 * rect.width);
      const screenY = rect.top + ((1 - this.transformGizmoPickWorld.y) * 0.5 * rect.height);
      const dx = ev.clientX - screenX;
      const dy = ev.clientY - screenY;
      const distanceSq = (dx * dx) + (dy * dy);
      if (distanceSq > bestDistanceSq) continue;
      bestDistanceSq = distanceSq;
      bestConstraint = handle.userData.transformGizmoConstraint as TransformGizmoConstraint | undefined ?? null;
    }

    return bestConstraint;
  }

  private computeTransformGizmoBounds() {
    let sumX = 0;
    let sumY = 0;
    let sumZ = 0;
    let count = 0;
    this.forEachTransformTargetPosition((x, y, z) => {
      sumX += x;
      sumY += y;
      sumZ += z;
      count++;
    });
    if (!count) return null;

    this.transformGizmoCenter.set(sumX / count, sumY / count, sumZ / count);
    let radius = 0;
    this.forEachTransformTargetPosition((x, y, z) => {
      radius = Math.max(radius, this.tmpVec.set(x, y, z).distanceTo(this.transformGizmoCenter));
    });
    return { center: this.transformGizmoCenter, radius };
  }

  private extraAxisDimsForTransformTarget() {
    const instIdx = this.options.getParams().editMode
      ? this.options.getSelectedInstance()
      : this.getObjectTransformSelection()[0];
    if (instIdx === undefined) return [];
    const data = this.getObjectData(instIdx);
    if (!data || data.originalN < 4) return [];

    const params = this.options.getParams();
    const projected = new Set([params.axesX, params.axesY, params.axesZ]);
    const available = data.axisMap
      .slice(0, data.originalN)
      .filter(dim => Number.isInteger(dim) && dim >= 0 && !projected.has(dim))
      .filter((dim, index, arr) => arr.indexOf(dim) === index);
    if (!available.length) return [];

    const primary = this.options.primaryExtraRotationDepthDim(data.originalN, data.axisMap);
    if (available.includes(primary)) {
      return [primary, ...available.filter(dim => dim !== primary)];
    }
    return available;
  }

  private forEachTransformTargetPosition(visitor: (x: number, y: number, z: number) => void) {
    const visitRenderer = (positions: Float32Array, count: number, vertices?: number[]) => {
      if (vertices) {
        for (const vertex of vertices) {
          if (vertex < 0 || vertex >= count) continue;
          const pIdx = vertex * 3;
          visitor(positions[pIdx], positions[pIdx + 1], positions[pIdx + 2]);
        }
        return;
      }
      for (let i = 0; i < count; i++) {
        const pIdx = i * 3;
        visitor(positions[pIdx], positions[pIdx + 1], positions[pIdx + 2]);
      }
    };

    if (this.options.getParams().editMode) {
      const instIdx = this.options.getSelectedInstance();
      if (!this.options.getObjectVisible(instIdx)) return;
      const rendererRef = instIdx === -1
        ? this.options.getRendererND()
        : this.options.getExtraInstances()[instIdx]?.renderer;
      const count = instIdx === -1 ? this.options.getM() : this.options.getExtraInstances()[instIdx]?.M ?? 0;
      if (rendererRef && count > 0) visitRenderer(rendererRef.positions, count, this.selectedEditVertices);
      return;
    }

    this.getObjectTransformSelection().forEach(instIdx => {
      if (this.options.isLightSelection(instIdx)) {
        const position = this.options.getLightPosition(instIdx);
        if (position) visitor(position.x, position.y, position.z);
        return;
      }
      if (instIdx === -1) {
        visitRenderer(this.options.getRendererND().positions, this.options.getM());
        return;
      }
      const inst = this.options.getExtraInstances()[instIdx];
      if (inst) visitRenderer(inst.renderer.positions, inst.M);
    });
  }

  private screenSpaceWorldRadius(position: THREE.Vector3, pixelRadius: number) {
    const viewportHeight = Math.max(1, this.options.renderer.domElement.clientHeight || this.options.renderer.domElement.height);
    const cameraSpace = this.tmpVec.copy(position).applyMatrix4(this.options.camera.matrixWorldInverse);
    const distance = Math.max(0.01, Math.abs(cameraSpace.z));
    const visibleHeight = (2 * distance * Math.tan(THREE.MathUtils.degToRad(this.options.camera.fov) * 0.5)) / this.options.camera.zoom;
    return (pixelRadius / viewportHeight) * visibleHeight;
  }

  private releaseGizmoPointer(pointerId: number) {
    const target = this.gizmoDrag.pointerCaptureTarget;
    if (target?.hasPointerCapture(pointerId)) target.releasePointerCapture(pointerId);
  }

  private resetGizmoDrag() {
    this.gizmoDrag.active = false;
    this.gizmoDrag.pointerId = -1;
    this.gizmoDrag.pointerCaptureTarget = null;
  }

  handleConstraintKey(key: string) {
    const dim = AXIS_LOCK_KEYS.indexOf(key);
    if (dim < 0) return false;
    return this.lockTransformToAxisDim(dim);
  }

  private lockTransformToAxisDim(dim: number) {
    if (this.transformOp.mode === 'none') return false;
    if (!this.transformAxisAvailable(dim)) return false;

    if (this.options.isLightSelection(this.transformOp.instIdx)) {
      this.transformOp.lockAxis = dim as 0 | 1 | 2;
      this.transformOp.localAxisDim = -1;
      this.transformOp.extraAxisDim = -1;
      this.transformOp.extraPlane = false;
      this.updateAxisGuide();
      return true;
    }

    const params = this.options.getParams();
    const projected = [params.axesX, params.axesY, params.axesZ];
    const projectedSlot = projected.indexOf(dim);
    if (projectedSlot >= 0) {
      if (this.transformOp.lockAxis === projectedSlot && this.transformOp.extraAxisDim < 0 && this.transformOp.localAxisDim !== dim) {
        this.transformOp.localAxisDim = dim;
        this.updateAxisGuide();
        return true;
      }
      this.transformOp.lockAxis = projectedSlot as 0 | 1 | 2;
      this.transformOp.localAxisDim = -1;
      this.transformOp.extraAxisDim = -1;
      this.transformOp.extraPlane = false;
      this.updateAxisGuide();
      return true;
    }

    this.transformOp.lockAxis = -1;
    this.transformOp.localAxisDim = -1;
    this.transformOp.extraAxisDim = dim;
    this.transformOp.extraPlane = this.transformOp.mode === 'rotate';
    this.updateAxisGuide();
    return true;
  }

  private transformAxisAvailable(dim: number) {
    if (this.options.isLightSelection(this.transformOp.instIdx)) return dim >= 0 && dim <= 2;
    const data = this.getObjectData(this.transformOp.instIdx);
    if (!data) return false;
    return data.axisMap.slice(0, data.originalN).includes(dim);
  }

  private localAxisSlotForDim(dim: number) {
    const data = this.getObjectData(this.transformOp.instIdx);
    if (!data) return -1;
    const slot = data.axisMap.slice(0, data.originalN).indexOf(dim);
    return slot >= 0 && slot <= 2 ? slot : -1;
  }

  private localAxisDirectionForDim(dim: number) {
    if (this.transformOp.targetVertices.length > 0 && this.transformOp.editLocalDirections.size > 0) {
      return this.averageEditLocalDirection();
    }
    const slot = this.localAxisSlotForDim(dim);
    if (slot < 0) return null;
    const primaryStart = this.transformOp.objectStarts.find(start => start.instIdx === this.transformOp.instIdx)
      ?? this.transformOp.objectStarts[0];
    const transform = this.getObjectTransformTarget(this.transformOp.instIdx);
    const rotation = primaryStart?.startRot ?? transform?.rot;
    if (!rotation) return null;
    this.dragEuler.set(rotation.x, rotation.y, rotation.z);
    return PROJECTED_AXIS_DIRECTIONS[slot].clone().applyEuler(this.dragEuler).normalize();
  }

  private averageEditLocalDirection() {
    const direction = new THREE.Vector3();
    this.transformOp.editLocalDirections.forEach(value => direction.add(value));
    if (direction.lengthSq() <= 1e-10) return null;
    return direction.normalize();
  }

  startFromPointer(mode: TransformMode, pointer: { x: number; y: number }) {
    this.start(mode, { clientX: pointer.x, clientY: pointer.y });
  }

  start(mode: TransformMode, ev: { clientX: number; clientY: number }) {
    if (!this.canUseTransformMode(mode)) return;
    this.activeTransformMode = mode;
    const selectedInstance = this.options.getSelectedInstance();
    const selectedObjects = this.getObjectTransformSelection();
    if (this.options.getParams().editMode) {
      if (!this.startEditTransform(mode, selectedInstance, ev)) return;
      this.updateActionButtons();
      return;
    }
    if (!selectedObjects.length) return;

    this.transformOp.mode = mode;
    this.transformOp.instIdx = selectedInstance;
    this.transformOp.targetVertex = -1;
    this.transformOp.targetVertices = [];
    this.transformOp.editVertexStarts = [];
    this.transformOp.editProjectedStarts = [];
    this.transformOp.editLocalDirections = new Map();
    this.transformOp.startMouse.set(ev.clientX, ev.clientY);
    this.transformOp.objectStarts = [];

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
    this.transformOp.localAxisDim = -1;
    this.transformOp.extraAxisDim = -1;
    this.transformOp.extraPlane = false;
    this.applyPendingGizmoConstraint();

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
    this.updateActionButtons();
  }

  private startEditTransform(mode: TransformMode, selectedInstance: number, ev: { clientX: number; clientY: number }) {
    if (!this.options.getObjectVisible(selectedInstance) || !this.selectedEditVertices.length) return false;

    const data = this.getObjectData(selectedInstance);
    const rendererRef = selectedInstance === -1
      ? this.options.getRendererND()
      : this.options.getExtraInstances()[selectedInstance]?.renderer;
    if (!data || !rendererRef) return false;

    const vertices = this.selectedEditVertices
      .filter(vertex => vertex >= 0 && vertex < data.count)
      .filter((vertex, index, arr) => arr.indexOf(vertex) === index);
    if (!vertices.length) return false;

    const posArr = rendererRef.positions;
    const yArr = selectedInstance === -1 ? this.options.getY() : this.options.getExtraInstances()[selectedInstance].Y;
    this.transformOp.mode = mode;
    this.transformOp.instIdx = selectedInstance;
    this.transformOp.targetVertex = vertices[0];
    this.transformOp.targetVertices = vertices;
    this.transformOp.startMouse.set(ev.clientX, ev.clientY);
    this.transformOp.objectStarts = [];
    this.transformOp.editVertexStarts = vertices.map(vertex => {
      const pIdx = vertex * 3;
      return new THREE.Vector3(posArr[pIdx], posArr[pIdx + 1], posArr[pIdx + 2]);
    });
    this.transformOp.editLocalDirections = this.computeEditLocalDirections(
      rendererRef.getCellTopologyForSelection(),
      posArr,
      data.count,
      vertices,
    );
    this.transformOp.editProjectedStarts = vertices.map(vertex => new THREE.Vector3(
      yArr[vertex],
      yArr[data.count + vertex],
      yArr[(2 * data.count) + vertex],
    ));
    this.transformOp.vertexStart.copy(computeCenterFromVectors(this.transformOp.editVertexStarts));
    this.transformOp.vertexDataStart = new Float32Array(data.src);
    this.transformOp.startScale = 1;
    this.transformOp.axis.copy(this.options.camera.getWorldDirection(this.tmpVec).normalize());
    this.transformOp.plane.setFromNormalAndCoplanarPoint(this.transformOp.axis, this.transformOp.vertexStart);
    this.transformOp.planeHitStart.copy(this.transformOp.vertexStart);
    this.transformOp.lastHit.copy(this.transformOp.vertexStart);
    this.transformOp.lockAxis = -1;
    this.transformOp.localAxisDim = -1;
    this.transformOp.extraAxisDim = -1;
    this.transformOp.extraPlane = false;
    this.applyPendingGizmoConstraint();
    this.transformOp.objectDataStart = null;
    this.transformOp.originDataStart = null;

    const rect = this.options.renderer.domElement.getBoundingClientRect();
    this.options.ndc.set(((ev.clientX - rect.left) / rect.width) * 2 - 1, -((ev.clientY - rect.top) / rect.height) * 2 + 1);
    this.options.raycaster.setFromCamera(this.options.ndc, this.options.camera);
    const hit = this.options.raycaster.ray.intersectPlane(this.transformOp.plane, this.tmpVec);
    if (hit) this.transformOp.moveOffset.copy(this.transformOp.vertexStart).sub(hit);
    else this.transformOp.moveOffset.set(0, 0, 0);
    return true;
  }

  private computeEditLocalDirections(
    topology: CellTopology | undefined,
    positions: Float32Array,
    vertexCount: number,
    fallbackVertices: number[],
  ) {
    const directions = new Map<number, THREE.Vector3>();
    if (!topology || this.editCellDimension < 1) return directions;

    const selectedCellIds = this.selectedCellIds.length
      ? this.selectedCellIds
      : (this.selectedCellId >= 0 ? [this.selectedCellId] : []);
    if (!selectedCellIds.length) return directions;

    const objectCenter = new THREE.Vector3();
    for (let vertex = 0; vertex < vertexCount; vertex++) {
      const idx = vertex * 3;
      objectCenter.x += positions[idx] ?? 0;
      objectCenter.y += positions[idx + 1] ?? 0;
      objectCenter.z += positions[idx + 2] ?? 0;
    }
    if (vertexCount > 0) objectCenter.multiplyScalar(1 / vertexCount);

    const pointFor = (vertex: number) => {
      const idx = vertex * 3;
      return new THREE.Vector3(positions[idx] ?? 0, positions[idx + 1] ?? 0, positions[idx + 2] ?? 0);
    };
    const directionForCell = (vertices: number[]) => {
      const points = vertices.map(pointFor);
      if (!points.length) return null;
      const center = computeCenterFromVectors(points);

      let direction: THREE.Vector3 | null = null;
      if (points.length >= 3) {
        for (let i = 1; i < points.length - 1; i++) {
          const a = points[i].clone().sub(points[0]);
          const b = points[i + 1].clone().sub(points[0]);
          const n = a.cross(b);
          if (n.lengthSq() > 1e-10) {
            direction = n.normalize();
            break;
          }
        }
      }
      if (!direction && points.length >= 2) {
        direction = points[1].clone().sub(points[0]).normalize();
      }
      if (!direction || direction.lengthSq() <= 1e-10) {
        direction = center.clone().sub(objectCenter);
        if (direction.lengthSq() <= 1e-10) direction.set(1, 0, 0);
        else direction.normalize();
      }

      const outward = center.clone().sub(objectCenter);
      if (outward.lengthSq() > 1e-10 && direction.dot(outward) < 0) direction.multiplyScalar(-1);
      return direction;
    };

    const addDirection = (vertex: number, direction: THREE.Vector3) => {
      if (!fallbackVertices.includes(vertex)) return;
      const current = directions.get(vertex);
      if (current) current.add(direction);
      else directions.set(vertex, direction.clone());
    };

    selectedCellIds.forEach(cellId => {
      const cellVertices = getCellVertices(topology, this.editCellDimension, cellId);
      const surfaceVertices = this.editCellDimension === 2
        ? [cellVertices]
        : getCellBoundaryFaceIds(topology, this.editCellDimension, cellId)
          .map(faceId => getCellVertices(topology, 2, faceId))
          .filter(vertices => vertices.length >= 3);
      const faces = surfaceVertices.length ? surfaceVertices : [cellVertices];
      faces.forEach(vertices => {
        const direction = directionForCell(vertices);
        if (!direction) return;
        cellVertices.forEach(vertex => addDirection(vertex, direction));
      });
    });

    directions.forEach(direction => {
      if (direction.lengthSq() <= 1e-10) direction.set(1, 0, 0);
      else direction.normalize();
    });
    return directions;
  }

  private applyPendingGizmoConstraint() {
    const constraint = this.pendingGizmoConstraint ?? FREE_GIZMO_CONSTRAINT;
    this.transformOp.lockAxis = constraint.kind === 'axis' ? constraint.axisSlot : -1;
    this.transformOp.localAxisDim = -1;
    this.transformOp.extraAxisDim = constraint.kind === 'extra' ? constraint.extraDim : -1;
    this.transformOp.extraPlane = constraint.kind === 'extra' && this.transformOp.mode === 'rotate';
  }

  handleGizmoPointerDown(ev: PointerEvent) {
    if (ev.button !== 0 || this.activeTransformMode === 'none' || this.transformOp.mode !== 'none') return false;
    if (!this.transformGizmo || !this.hasTransformTarget()) return false;
    const constraint = this.pickTransformGizmoConstraint(ev);
    if (!constraint) return false;

    ev.preventDefault();
    ev.stopPropagation();
    ev.stopImmediatePropagation();
    this.pendingGizmoConstraint = constraint;
    this.start(this.activeTransformMode, ev);
    this.pendingGizmoConstraint = null;
    if (this.transformOp.mode === 'none') return true;
    this.options.pushUndoSnapshot();

    this.gizmoDrag.active = true;
    this.gizmoDrag.pointerId = ev.pointerId;
    this.gizmoDrag.pointerCaptureTarget = this.options.renderer.domElement;
    try {
      this.gizmoDrag.pointerCaptureTarget.setPointerCapture(ev.pointerId);
    } catch {
      // Pointer capture is best-effort; window-level handlers still keep the drag alive.
    }
    this.updateActionButtons();
    return true;
  }

  handleGizmoPointerMove(
    ev: PointerEvent,
    setLastPointer: (point: { x: number; y: number }) => void,
    point: { x: number; y: number } = { x: ev.clientX, y: ev.clientY },
  ) {
    if (!this.gizmoDrag.active || ev.pointerId !== this.gizmoDrag.pointerId) return false;
    ev.preventDefault();
    setLastPointer(point);
    this.applyPointer(point.x, point.y, ev.ctrlKey);
    return true;
  }

  handleGizmoPointerEnd(ev: PointerEvent, commit: boolean) {
    if (!this.gizmoDrag.active || ev.pointerId !== this.gizmoDrag.pointerId) return false;
    this.releaseGizmoPointer(ev.pointerId);
    if (this.transformOp.mode !== 'none') this.finish(commit);
    this.resetGizmoDrag();
    ev.preventDefault();
    return true;
  }

  cancelGizmoDrag() {
    if (!this.gizmoDrag.active) return false;
    this.releaseGizmoPointer(this.gizmoDrag.pointerId);
    if (this.transformOp.mode !== 'none') this.finish(false);
    this.resetGizmoDrag();
    return true;
  }

  isGizmoDragging() {
    return this.gizmoDrag.active;
  }

  applyPointer(clientX: number, clientY: number, snapToInteger = false) {
    if (this.transformOp.mode === 'none') return;

    const dx = clientX - this.transformOp.startMouse.x;
    const dy = clientY - this.transformOp.startMouse.y;

    if (this.transformOp.targetVertices.length > 0) {
      if (!this.applyEditTransform(clientX, clientY, dx, dy, snapToInteger)) return;
    } else {
      this.applyObjectTransform(clientX, clientY, dx, dy, snapToInteger);
    }

    this.options.projectAndRenderAll();
    this.options.updateSelectionOutline();
    this.updateAxisGuide();
  }

  private snapVectorToInteger(value: THREE.Vector3) {
    value.set(
      Math.round(value.x),
      Math.round(value.y),
      Math.round(value.z),
    );
    return value;
  }

  private applyEditTransform(clientX: number, clientY: number, dx: number, dy: number, snapToInteger: boolean) {
    const rect = this.options.renderer.domElement.getBoundingClientRect();
    this.options.ndc.set(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1);
    this.options.raycaster.setFromCamera(this.options.ndc, this.options.camera);
    this.transformOp.axis.copy(this.options.camera.getWorldDirection(this.tmpVec).normalize());
    this.transformOp.plane.setFromNormalAndCoplanarPoint(this.transformOp.axis, this.transformOp.planeHitStart);
    const hit = this.options.raycaster.ray.intersectPlane(this.transformOp.plane, this.tmpVec);
    if (!hit) return false;

    const locked = this.transformOp.lockAxis;
    const center = this.transformOp.vertexStart;
    const targets: THREE.Vector3[] = [];
    if (this.transformOp.extraAxisDim >= 0) return this.applyEditExtraTransform(dx, dy, snapToInteger);

    if (this.transformOp.mode === 'move') {
      const targetCenter = hit.clone().add(this.transformOp.moveOffset);
      const delta = targetCenter.sub(center);
      const localDir = this.transformOp.localAxisDim >= 0 ? this.localAxisDirectionForDim(this.transformOp.localAxisDim) : null;
      if (this.transformOp.localAxisDim >= 0 && this.transformOp.editLocalDirections.size > 0) {
        const scalar = localDir ? delta.dot(localDir) : delta.length();
        this.transformOp.editVertexStarts.forEach((start, index) => {
          const vertex = this.transformOp.targetVertices[index];
          const direction = this.transformOp.editLocalDirections.get(vertex) ?? localDir ?? new THREE.Vector3(1, 0, 0);
          targets.push(start.clone().add(direction.clone().multiplyScalar(scalar)));
        });
        this.transformOp.lastHit.copy(center).add((localDir ?? delta.clone().normalize()).multiplyScalar(scalar));
      } else if (localDir) {
        delta.copy(localDir).multiplyScalar(delta.dot(localDir));
        this.transformOp.editVertexStarts.forEach(start => targets.push(start.clone().add(delta)));
        this.transformOp.lastHit.copy(center).add(delta);
      } else if (locked === 0) {
        delta.y = 0;
        delta.z = 0;
        this.transformOp.editVertexStarts.forEach(start => targets.push(start.clone().add(delta)));
        this.transformOp.lastHit.copy(center).add(delta);
      } else if (locked === 1) {
        delta.x = 0;
        delta.z = 0;
        this.transformOp.editVertexStarts.forEach(start => targets.push(start.clone().add(delta)));
        this.transformOp.lastHit.copy(center).add(delta);
      } else if (locked === 2) {
        delta.x = 0;
        delta.y = 0;
        this.transformOp.editVertexStarts.forEach(start => targets.push(start.clone().add(delta)));
        this.transformOp.lastHit.copy(center).add(delta);
      } else {
        this.transformOp.editVertexStarts.forEach(start => targets.push(start.clone().add(delta)));
        this.transformOp.lastHit.copy(center).add(delta);
      }
    } else if (this.transformOp.mode === 'scale') {
      const scale = Math.max(MIN_TRANSFORM_SCALE, 1 + ((dx - dy) * 0.005));
      const localDir = this.transformOp.localAxisDim >= 0 ? this.localAxisDirectionForDim(this.transformOp.localAxisDim) : null;
      this.transformOp.editVertexStarts.forEach(start => {
        const offset = start.clone().sub(center);
        if (localDir) {
          const parallel = localDir.clone().multiplyScalar(offset.dot(localDir));
          offset.sub(parallel).add(parallel.multiplyScalar(scale));
        } else if (locked === 0) offset.x *= scale;
        else if (locked === 1) offset.y *= scale;
        else if (locked === 2) offset.z *= scale;
        else offset.multiplyScalar(scale);
        targets.push(offset.add(center));
      });
      this.transformOp.lastHit.copy(center);
    } else if (this.transformOp.mode === 'rotate') {
      const localDir = this.transformOp.localAxisDim >= 0 ? this.localAxisDirectionForDim(this.transformOp.localAxisDim) : null;
      const axis = localDir ?? (locked === 0
        ? new THREE.Vector3(1, 0, 0)
        : locked === 1
          ? new THREE.Vector3(0, 1, 0)
          : locked === 2
            ? new THREE.Vector3(0, 0, 1)
            : this.transformOp.axis);
      const angle = (dx - dy) * 0.01;
      const q = new THREE.Quaternion().setFromAxisAngle(axis, angle);
      this.transformOp.editVertexStarts.forEach(start => {
        targets.push(start.clone().sub(center).applyQuaternion(q).add(center));
      });
      this.transformOp.lastHit.copy(center);
    } else {
      return false;
    }

    if (snapToInteger && this.transformOp.mode === 'move') {
      targets.forEach(target => this.snapVectorToInteger(target));
    }

    for (let i = 0; i < this.transformOp.targetVertices.length; i++) {
      if (!this.setDraggedVertexFromWorldPosition(
        this.transformOp.instIdx,
        this.transformOp.targetVertices[i],
        targets[i],
        this.transformOp.editVertexStarts[i],
        this.transformOp.editProjectedStarts[i],
        this.transformOp.vertexDataStart,
      )) return false;
    }

    return true;
  }

  private applyEditExtraTransform(dx: number, dy: number, snapToInteger: boolean) {
    const data = this.getObjectData(this.transformOp.instIdx);
    const sourceStart = this.transformOp.vertexDataStart;
    const dim = this.transformOp.extraAxisDim;
    if (!data || !sourceStart || !this.objectDataHasAxis(data, dim)) return false;

    const offset = dim * data.count;
    const delta = this.pointerExtraDelta(dx, dy, this.transformOp.vertexStart);
    if (this.transformOp.mode === 'move') {
      for (const vertex of this.transformOp.targetVertices) {
        const value = sourceStart[offset + vertex] + delta;
        data.src[offset + vertex] = snapToInteger ? Math.round(value) : value;
      }
      return true;
    }

    if (this.transformOp.mode === 'scale') {
      const scale = Math.max(MIN_TRANSFORM_SCALE, 1 + ((dx - dy) * 0.005));
      const pivot = this.averageSourceValue(sourceStart, data.count, dim, this.transformOp.targetVertices);
      for (const vertex of this.transformOp.targetVertices) {
        const start = sourceStart[offset + vertex];
        data.src[offset + vertex] = pivot + ((start - pivot) * scale);
      }
      return true;
    }

    if (this.transformOp.mode === 'rotate') {
      const params = this.options.getParams();
      const n = this.options.getN();
      const axes = [params.axesX % n, params.axesY % n, params.axesZ % n].map(value => Math.max(0, Math.min(n - 1, value)));
      const dimA = axes[this.transformOp.lockAxis >= 0 ? this.transformOp.lockAxis : 0];
      const dimB = dim;
      if (dimA === dimB || !this.objectDataHasAxis(data, dimA)) return false;
      const offsetA = dimA * data.count;
      const offsetB = dimB * data.count;
      const pivotA = this.averageSourceValue(sourceStart, data.count, dimA, this.transformOp.targetVertices);
      const pivotB = this.averageSourceValue(sourceStart, data.count, dimB, this.transformOp.targetVertices);
      const angle = (dx - dy) * 0.01;
      const c = Math.cos(angle);
      const s = Math.sin(angle);
      for (const vertex of this.transformOp.targetVertices) {
        const a0 = sourceStart[offsetA + vertex] - pivotA;
        const b0 = sourceStart[offsetB + vertex] - pivotB;
        data.src[offsetA + vertex] = pivotA + (a0 * c - b0 * s);
        data.src[offsetB + vertex] = pivotB + (a0 * s + b0 * c);
      }
      return true;
    }

    return false;
  }

  finish(commit: boolean) {
    if (this.transformOp.mode === 'none') return;

    const params = this.options.getParams();

    if (!commit) {
      if (this.transformOp.targetVertices.length > 0) {
        const data = this.getObjectData(this.transformOp.instIdx);
        if (data && this.transformOp.vertexDataStart) data.src.set(this.transformOp.vertexDataStart);
      } else {
        for (const start of this.transformOp.objectStarts) {
          if (start.lightPositionStart) {
            this.options.setLightPosition(start.instIdx, start.lightPositionStart);
            continue;
          }
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
    this.transformOp.targetVertex = -1;
    this.transformOp.targetVertices = [];
    this.transformOp.editVertexStarts = [];
    this.transformOp.editProjectedStarts = [];
    this.transformOp.editLocalDirections = new Map();
    this.transformOp.vertexDataStart = null;
    this.transformOp.lockAxis = -1;
    this.transformOp.localAxisDim = -1;
    this.transformOp.extraAxisDim = -1;
    this.transformOp.objectDataStart = null;
    this.transformOp.originDataStart = null;
    this.transformOp.extraPlane = false;
    this.transformOp.objectStarts = [];
    this.clearAxisGuide();
    this.transformOp.moveOffset.set(0, 0, 0);
    this.options.projectAndRenderAll();
    if (params.editMode) this.updateVertexCloud(this.options.getSelectedInstance());
    this.options.updateSelectionOutline();
    this.updateActionButtons();
    if (commit) this.options.onStateChange?.();
  }

  updateAxisGuide() {
    this.clearAxisGuide();
    if (this.transformOp.mode === 'none') return;
    const guide = this.transformAxisGuide();
    if (!guide) return;

    let center = new THREE.Vector3();
    if (this.transformOp.targetVertices.length > 0) {
      const inst = this.transformOp.instIdx === -1 ? null : this.options.getExtraInstances()[this.transformOp.instIdx];
      const posArr = inst ? inst.renderer.positions : this.options.getRendererND().positions;
      const points = this.transformOp.targetVertices.map(vertex => {
        const idx = vertex * 3;
        return new THREE.Vector3(posArr[idx], posArr[idx + 1], posArr[idx + 2]);
      });
      center = computeCenterFromVectors(points);
    } else {
      center = this.getObjectOriginWorldPosition(this.transformOp.instIdx);
    }

    const len = Math.max(3, this.computeTransformGizmoBounds()?.radius ?? 0);
    const points = [
      center.clone().addScaledVector(guide.direction, -len),
      center.clone().addScaledVector(guide.direction, len),
    ];
    const geom = new THREE.BufferGeometry().setFromPoints(points);
    const mat = new THREE.LineBasicMaterial({ color: guide.color, linewidth: 2, depthTest: false, transparent: true, opacity: 0.92 });
    this.axisGuide = new THREE.Line(geom, mat);
    this.axisGuide.renderOrder = 30;
    this.options.scene.add(this.axisGuide);
  }

  private transformAxisGuide() {
    const params = this.options.getParams();
    if (this.transformOp.localAxisDim >= 0) {
      const direction = this.localAxisDirectionForDim(this.transformOp.localAxisDim);
      if (direction) {
        return {
          direction,
          color: this.axisPaletteColor(this.transformOp.localAxisDim),
        };
      }
    }
    if (this.transformOp.lockAxis >= 0 && this.transformOp.extraAxisDim < 0) {
      const axisSlot = this.transformOp.lockAxis;
      const projectedDim = this.options.isLightSelection(this.transformOp.instIdx)
        ? axisSlot
        : ([params.axesX, params.axesY, params.axesZ][axisSlot] ?? axisSlot);
      return {
        direction: PROJECTED_AXIS_DIRECTIONS[axisSlot].clone().normalize(),
        color: this.axisPaletteColor(projectedDim),
      };
    }
    if (this.transformOp.extraAxisDim >= 0) {
      const extraDims = this.extraAxisDimsForTransformTarget();
      const index = Math.max(0, extraDims.indexOf(this.transformOp.extraAxisDim));
      const total = Math.max(1, extraDims.length);
      return {
        direction: this.extraHandleDirection(index, total).normalize(),
        color: this.axisPaletteColor(this.transformOp.extraAxisDim),
      };
    }
    return null;
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

  private objectDataHasAxis(data: { originalN: number; axisMap: AxisMap }, dim: number) {
    return dim >= 0 && data.axisMap.slice(0, data.originalN).includes(dim);
  }

  private pointerExtraDelta(dx: number, dy: number, position: THREE.Vector3) {
    return (dx - dy) * this.screenSpaceWorldRadius(position, 1);
  }

  private averageSourceValue(source: Float32Array, count: number, dim: number, vertices: number[]) {
    if (!vertices.length) return 0;
    const offset = dim * count;
    let sum = 0;
    let valid = 0;
    for (const vertex of vertices) {
      if (vertex < 0 || vertex >= count) continue;
      sum += source[offset + vertex];
      valid++;
    }
    return valid > 0 ? sum / valid : 0;
  }

  private createObjectTransformStart(instIdx: number, mode: TransformMode): ObjectTransformStart {
    if (this.options.isLightSelection(instIdx)) {
      const position = this.options.getLightPosition(instIdx) ?? new THREE.Vector3();
      return {
        instIdx,
        startPos: position.clone(),
        startRot: new THREE.Vector3(),
        startScale: new THREE.Vector3(1, 1, 1),
        originWorldStart: position.clone(),
        objectDataStart: null,
        originDataStart: null,
        lightPositionStart: position.clone(),
      };
    }

    const target = this.getObjectTransformTarget(instIdx);
    const data = this.getObjectData(instIdx);
    const origin = this.options.getObjectOrigin(instIdx);
    const shouldCaptureData = !!data && (mode === 'rotate' || data.originalN >= 4 || this.pendingGizmoConstraint?.kind === 'extra');
    return {
      instIdx,
      startPos: target?.pos.clone() ?? new THREE.Vector3(),
      startRot: target?.rot.clone() ?? new THREE.Vector3(),
      startScale: target?.scale.clone() ?? new THREE.Vector3(1, 1, 1),
      originWorldStart: this.getObjectOriginWorldPosition(instIdx),
      objectDataStart: shouldCaptureData && data ? new Float32Array(data.src) : null,
      originDataStart: shouldCaptureData && origin ? new Float32Array(origin) : null,
      lightPositionStart: null,
    };
  }

  private applyObjectTransform(
    clientX: number,
    clientY: number,
    dx: number,
    dy: number,
    snapToInteger: boolean,
  ) {
    if (this.transformOp.mode === 'move') {
      if (this.transformOp.extraAxisDim >= 0) {
        this.applyObjectExtraMove(dx, dy, snapToInteger);
        return;
      }
      const rect = this.options.renderer.domElement.getBoundingClientRect();
      this.options.ndc.set(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1);
      this.options.raycaster.setFromCamera(this.options.ndc, this.options.camera);
      const hit = this.options.raycaster.ray.intersectPlane(this.transformOp.plane, this.tmpVec);
      if (!hit) return;
      const delta = hit.clone().add(this.transformOp.moveOffset).sub(this.transformOp.planeHitStart);
      const localDir = this.transformOp.localAxisDim >= 0 ? this.localAxisDirectionForDim(this.transformOp.localAxisDim) : null;
      if (localDir) {
        delta.copy(localDir).multiplyScalar(delta.dot(localDir));
      } else if (this.transformOp.lockAxis === 0) {
        delta.y = 0;
        delta.z = 0;
      } else if (this.transformOp.lockAxis === 1) {
        delta.x = 0;
        delta.z = 0;
      } else if (this.transformOp.lockAxis === 2) {
        delta.x = 0;
        delta.y = 0;
      }
      this.transformOp.objectStarts.forEach(start => this.applyObjectMove(start, delta, snapToInteger));
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
      if (this.transformOp.extraAxisDim >= 0) {
        this.applyObjectExtraScale(dx, dy);
        return;
      }
      this.applyObjectScale(dx, dy);
    }
  }

  private applyObjectMove(start: ObjectTransformStart, delta: THREE.Vector3, snapToInteger: boolean) {
    if (start.lightPositionStart) {
      const position = start.lightPositionStart.clone().add(delta);
      this.options.setLightPosition(start.instIdx, snapToInteger ? this.snapVectorToInteger(position) : position);
      return;
    }
    const target = this.getObjectTransformTarget(start.instIdx);
    if (!target) return;
    target.pos.copy(start.startPos).add(delta);
    if (snapToInteger) this.snapVectorToInteger(target.pos);
  }

  private applyObjectExtraMove(dx: number, dy: number, snapToInteger: boolean) {
    const dim = this.transformOp.extraAxisDim;
    const delta = this.pointerExtraDelta(dx, dy, this.transformOp.pivotWorldStart);
    this.transformOp.objectStarts.forEach(start => {
      const data = this.getObjectData(start.instIdx);
      const origin = this.options.getObjectOrigin(start.instIdx);
      if (!data || !start.objectDataStart || !this.objectDataHasAxis(data, dim)) return;
      const offset = dim * data.count;
      for (let i = 0; i < data.count; i++) {
        const value = start.objectDataStart[offset + i] + delta;
        data.src[offset + i] = snapToInteger ? Math.round(value) : value;
      }
      if (origin && start.originDataStart) {
        const value = (start.originDataStart[dim] ?? 0) + delta;
        origin[dim] = snapToInteger ? Math.round(value) : value;
      }
    });
  }

  private applyObjectExtraPlaneRotation(dx: number, dy: number) {
    const primaryStart = this.transformOp.objectStarts.find(start => start.instIdx === this.transformOp.instIdx)
      ?? this.transformOp.objectStarts[0];
    if (!primaryStart) return;
    const primaryData = this.getObjectData(primaryStart.instIdx);
    if (!primaryData) return;

    const dimB = this.transformOp.extraAxisDim >= 0
      ? this.transformOp.extraAxisDim
      : this.options.primaryExtraRotationDepthDim(primaryData.originalN, primaryData.axisMap);
    const dimA = this.options.extraRotationPlaneAxis(this.transformOp.lockAxis, dimB);
    if (dimA < 0 || dimB < 0 || dimA === dimB || !this.objectDataHasAxis(primaryData, dimA) || !this.objectDataHasAxis(primaryData, dimB)) return;

    const pivotA = primaryStart.originDataStart?.[dimA] ?? 0;
    const pivotB = primaryStart.originDataStart?.[dimB] ?? 0;
    const angle = (dx - dy) * 0.01;
    const c = Math.cos(angle);
    const s = Math.sin(angle);

    this.transformOp.objectStarts.forEach(start => {
      const data = this.getObjectData(start.instIdx);
      if (!data || !start.objectDataStart || data.count <= 0 || !this.objectDataHasAxis(data, dimA) || !this.objectDataHasAxis(data, dimB)) return;
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
    if (this.transformOp.localAxisDim >= 0) {
      const slot = this.localAxisSlotForDim(this.transformOp.localAxisDim);
      if (slot === 0) return new THREE.Vector3(deltaY, 0, 0);
      if (slot === 1) return new THREE.Vector3(0, deltaX, 0);
      if (slot === 2) return new THREE.Vector3(0, 0, deltaX);
    }
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
    const scale = Math.max(MIN_TRANSFORM_SCALE, this.transformOp.startScale + delta);
    const scaleFactor = scale / Math.max(this.transformOp.startScale, MIN_TRANSFORM_SCALE);

    this.transformOp.objectStarts.forEach(start => {
      const target = this.getObjectTransformTarget(start.instIdx);
      if (!target) return;
      target.scale.copy(start.startScale);
      const scaledOrigin = start.originWorldStart.clone().sub(this.transformOp.pivotWorldStart);
      const localSlot = this.transformOp.localAxisDim >= 0 ? this.localAxisSlotForDim(this.transformOp.localAxisDim) : -1;
      if (localSlot === 0) {
        target.scale.x = start.startScale.x * scaleFactor;
        const localDir = this.localAxisDirectionForDim(this.transformOp.localAxisDim);
        if (localDir) {
          const parallel = localDir.clone().multiplyScalar(scaledOrigin.dot(localDir));
          scaledOrigin.sub(parallel).add(parallel.multiplyScalar(scaleFactor));
        }
      } else if (localSlot === 1) {
        target.scale.y = start.startScale.y * scaleFactor;
        const localDir = this.localAxisDirectionForDim(this.transformOp.localAxisDim);
        if (localDir) {
          const parallel = localDir.clone().multiplyScalar(scaledOrigin.dot(localDir));
          scaledOrigin.sub(parallel).add(parallel.multiplyScalar(scaleFactor));
        }
      } else if (localSlot === 2) {
        target.scale.z = start.startScale.z * scaleFactor;
        const localDir = this.localAxisDirectionForDim(this.transformOp.localAxisDim);
        if (localDir) {
          const parallel = localDir.clone().multiplyScalar(scaledOrigin.dot(localDir));
          scaledOrigin.sub(parallel).add(parallel.multiplyScalar(scaleFactor));
        }
      } else if (this.transformOp.lockAxis === 0) {
        target.scale.x = start.startScale.x * scaleFactor;
        scaledOrigin.x *= scaleFactor;
      } else if (this.transformOp.lockAxis === 1) {
        target.scale.y = start.startScale.y * scaleFactor;
        scaledOrigin.y *= scaleFactor;
      } else if (this.transformOp.lockAxis === 2) {
        target.scale.z = start.startScale.z * scaleFactor;
        scaledOrigin.z *= scaleFactor;
      } else {
        target.scale.multiplyScalar(scaleFactor);
        scaledOrigin.multiplyScalar(scaleFactor);
      }
      scaledOrigin.add(this.transformOp.pivotWorldStart);
      target.pos.copy(start.startPos).add(scaledOrigin.sub(start.originWorldStart));
    });
  }

  private applyObjectExtraScale(dx: number, dy: number) {
    const dim = this.transformOp.extraAxisDim;
    const delta = (dx - dy) * 0.005;
    const scale = Math.max(MIN_TRANSFORM_SCALE, this.transformOp.startScale + delta);
    const scaleFactor = scale / Math.max(this.transformOp.startScale, MIN_TRANSFORM_SCALE);
    const primaryStart = this.transformOp.objectStarts.find(start => start.instIdx === this.transformOp.instIdx)
      ?? this.transformOp.objectStarts[0];
    const pivot = primaryStart?.originDataStart?.[dim] ?? 0;

    this.transformOp.objectStarts.forEach(start => {
      const data = this.getObjectData(start.instIdx);
      const origin = this.options.getObjectOrigin(start.instIdx);
      if (!data || !start.objectDataStart || !this.objectDataHasAxis(data, dim)) return;
      const offset = dim * data.count;
      for (let i = 0; i < data.count; i++) {
        const value = start.objectDataStart[offset + i];
        data.src[offset + i] = pivot + ((value - pivot) * scaleFactor);
      }
      if (origin && start.originDataStart) {
        const value = start.originDataStart[dim] ?? 0;
        origin[dim] = pivot + ((value - pivot) * scaleFactor);
      }
    });
  }

  private setDraggedVertexFromWorldPosition(
    instIdx: number,
    vertexIdx: number,
    worldPos: THREE.Vector3,
    worldStart?: THREE.Vector3,
    projectedStart?: THREE.Vector3,
    sourceStart?: Float32Array | null,
  ) {
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

    if (worldStart) this.dragWorldCurrent.copy(worldStart);
    else this.dragWorldCurrent.set(posArr[pIdx], posArr[pIdx + 1], posArr[pIdx + 2]);
    if (projectedStart) this.dragYCurrent.copy(projectedStart);
    else this.dragYCurrent.set(yArr[vertexIdx], yArr[count + vertexIdx], yArr[2 * count + vertexIdx]);
    this.dragTmpVec.copy(this.dragYCurrent).applyMatrix4(this.dragRS);
    this.dragTranslation.copy(this.dragWorldCurrent).sub(this.dragTmpVec);

    this.dragTargetY.copy(worldPos).sub(this.dragTranslation).applyMatrix4(this.dragRSInv);

    const R = this.options.getRot().matrix;
    for (let d = 0; d < N; d++) {
      let acc = 0;
      for (let a = 0; a < N; a++) {
        const value = sourceStart ? sourceStart[a * count + vertexIdx] : src[a * count + vertexIdx];
        acc += R[d * N + a] * value;
      }
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
    if (this.options.isLightSelection(instIdx)) {
      return this.options.getLightPosition(instIdx)?.clone() ?? new THREE.Vector3();
    }
    if (instIdx === -1 && this.options.getM() > 0) return this.options.getRendererND().originPosition.clone();
    if (instIdx >= 0) {
      const inst = this.options.getExtraInstances()[instIdx];
      if (inst) return inst.renderer.originPosition.clone();
    }
    return computeCenterFromPositions(this.options.getRendererND().positions, this.options.getM());
  }

}
