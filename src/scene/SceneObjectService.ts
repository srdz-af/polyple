import * as THREE from 'three';
import { MAX_N, type ViewMode } from '../constants';
import { buildPrimitive, clonePrimitiveSurfaceTopology, type PrimitiveKind } from '../geometry/primitives';
import { canonicalAxisMap, embedToMax, normalizeAxisMap, type AxisMap } from '../geometry/projectionUtils';
import { cloneCellTopology } from '../geometry/cellTopology';
import { buildProductMesh, type ProductMeshFactor } from '../geometry/productMesh';
import type { NDProjector } from '../geometry/NDProjector';
import type { SceneMaterialService } from './SceneMaterialService';
import { createSceneInstance, type InstanceGeometryData } from './instanceFactory';
import { cloneObjectOrigin, computeObjectOrigin } from './objectOrigin';
import { deriveCellTopologyForGeometry } from './topologyState';
import { cloneTransformState } from './sceneStateCodec';
import type { Instance, InstanceSnapshot, TransformState } from './types';
import { HypercubeRenderer } from '../rendering/HypercubeRenderer';
import { cloneSurface, type SurfaceState } from './surface';

type SceneObjectServiceOptions = {
  scene: THREE.Scene;
  instances: Instance[];
  materialService: SceneMaterialService;
  getProjector: () => NDProjector;
  getRenderMode: () => ViewMode;
  getPrimitiveKind: () => PrimitiveKind;
  getPrimitiveDimension: () => number;
  currentAxisMap: (localN: number) => AxisMap;
  getBaseInstanceData: () => InstanceGeometryData | null;
  getBaseLabel: () => string;
  setBaseLabel: (label: string) => void;
  getBaseTransform: () => TransformState;
  getBaseVisible: () => boolean;
  setBaseVisible: (visible: boolean) => void;
  getBaseSurface: () => SurfaceState;
  getBaseOriginWorldPosition: () => THREE.Vector3 | null;
  recalculateBaseOrigin: () => boolean;
  getBaseMaterialId: () => string;
  defaultMaterialName: string;
  pushUndoSnapshot: () => void;
  projectAndRenderAll: () => void;
  setViewMode: (mode: ViewMode) => void;
  updateObjectList: () => void;
  requestSceneUrlUpdate: () => void;
  clearSelection: () => void;
  clearSelectionOutlines: () => void;
  updateSelectionOutline: () => void;
};

export class SceneObjectService {
  constructor(private readonly options: SceneObjectServiceOptions) {}

  createPrimitiveData(kind: PrimitiveKind, dimension: number): InstanceGeometryData {
    const data = buildPrimitive(kind, dimension);
    const axisMap = this.options.currentAxisMap(dimension);
    const verts = embedToMax(data.verts, dimension, axisMap);
    return {
      verts,
      edges: data.edges,
      cellTopology: cloneCellTopology(data.cellTopology),
      surfaceTopology: clonePrimitiveSurfaceTopology(data.surfaceTopology),
      V: data.V,
      kind,
      axisMap,
      originalN: dimension,
      origin: computeObjectOrigin(verts, data.V, MAX_N),
    };
  }

  restoreInstanceSnapshot(snap: InstanceSnapshot): Instance {
    const instanceRenderer = new HypercubeRenderer(this.options.scene);
    const cellTopology = deriveCellTopologyForGeometry(
      snap.kind,
      snap.originalN,
      snap.M,
      snap.E,
      snap.surfaceTopology,
      snap.cellTopology,
    );
    instanceRenderer.build(snap.M, snap.E, snap.surfaceTopology, cellTopology);
    const material = this.options.materialService.ensureMaterialSlot(snap.materialId, snap.surface, snap.label);
    const surface = cloneSurface(material.surface);
    instanceRenderer.setSurface(surface);
    instanceRenderer.setMode(this.options.getRenderMode());

    return {
      renderer: instanceRenderer,
      Y: new Float32Array(3 * snap.M),
      X: new Float32Array(snap.X),
      E: new Uint32Array(snap.E),
      cellTopology: cloneCellTopology(cellTopology),
      surfaceTopology: clonePrimitiveSurfaceTopology(snap.surfaceTopology),
      M: snap.M,
      offset: snap.offset.clone(),
      label: snap.label,
      kind: snap.kind,
      transform: cloneTransformState(snap.transform),
      origin: cloneObjectOrigin(snap.origin, snap.X, snap.M, MAX_N),
      originalN: snap.originalN,
      axisMap: normalizeAxisMap(snap.axisMap, snap.originalN),
      visible: snap.visible,
      materialId: material.id,
      surface,
    };
  }

  captureInstanceSnapshot(idx: number, duplicateLabel: (label: string) => string): InstanceSnapshot | null {
    if (idx === -1) {
      const data = this.options.getBaseInstanceData();
      if (!data || !this.options.getBaseVisible()) return null;
      return {
        X: new Float32Array(data.verts),
        E: new Uint32Array(data.edges),
        cellTopology: cloneCellTopology(data.cellTopology),
        surfaceTopology: clonePrimitiveSurfaceTopology(data.surfaceTopology),
        M: data.V,
        offset: this.options.getBaseTransform().pos.clone(),
        label: duplicateLabel(this.options.getBaseLabel()),
        kind: data.kind,
        transform: cloneTransformState(this.options.getBaseTransform()),
        origin: cloneObjectOrigin(data.origin, data.verts, data.V, MAX_N),
        originalN: data.originalN,
        axisMap: [...data.axisMap],
        visible: true,
        materialId: this.options.getBaseMaterialId(),
        surface: cloneSurface(this.options.getBaseSurface()),
      };
    }

    const inst = this.options.instances[idx];
    if (!inst || !inst.visible) return null;
    return {
      X: new Float32Array(inst.X),
      E: new Uint32Array(inst.E),
      cellTopology: cloneCellTopology(inst.cellTopology),
      surfaceTopology: clonePrimitiveSurfaceTopology(inst.surfaceTopology),
      M: inst.M,
      offset: inst.offset.clone(),
      label: duplicateLabel(inst.label),
      kind: inst.kind,
      transform: cloneTransformState(inst.transform),
      origin: new Float32Array(inst.origin),
      originalN: inst.originalN,
      axisMap: [...inst.axisMap],
      visible: true,
      materialId: inst.materialId,
      surface: cloneSurface(inst.surface),
    };
  }

  insertInstance(data: InstanceGeometryData, offset: THREE.Vector3, label: string, materialId: string, syncMode = true) {
    const material = this.options.materialService.ensureMaterialSlot(materialId);
    const inst = createSceneInstance({
      scene: this.options.scene,
      projector: this.options.getProjector(),
      data,
      offset,
      label,
      materialId: material.id,
      surface: material.surface,
      renderMode: this.options.getRenderMode(),
      projectionN: MAX_N,
    });
    this.options.instances.push(inst);
    this.options.projectAndRenderAll();
    if (syncMode) this.options.setViewMode(this.options.getRenderMode());
    this.options.updateObjectList();
    this.options.requestSceneUrlUpdate();
    return inst;
  }

  addPrimitiveInstanceAt(kind: PrimitiveKind, label: string, offset: THREE.Vector3, syncMode = true) {
    const materialId = this.options.materialService.defaultMaterialId(this.options.defaultMaterialName);
    this.insertInstance(this.createPrimitiveData(kind, this.options.getPrimitiveDimension()), offset, label, materialId, syncMode);
  }

  clearExtraInstances() {
    this.options.clearSelectionOutlines();
    this.options.instances.forEach(inst => inst.renderer.destroy());
    this.options.instances.length = 0;
    this.options.clearSelection();
  }

  setGeometryVisible(idx: number, visible: boolean) {
    if (idx === -1) {
      this.options.setBaseVisible(visible);
      return true;
    }
    const inst = this.options.instances[idx];
    if (!inst) return false;
    inst.visible = visible;
    return true;
  }

  renameGeometryObject(idx: number, label: string) {
    if (idx === -1) {
      this.options.setBaseLabel(label);
      return true;
    }
    const inst = this.options.instances[idx];
    if (!inst) return false;
    inst.label = label;
    return true;
  }

  deleteGeometryObjects(indices: number[]) {
    for (const idx of [...indices].sort((a, b) => b - a)) {
      const inst = this.options.instances[idx];
      if (!inst) continue;
      inst.renderer.destroy();
      this.options.instances.splice(idx, 1);
    }
  }

  addInstanceAt(offset: THREE.Vector3, recordUndo = true) {
    if (recordUndo) this.options.pushUndoSnapshot();
    const baseData = this.options.getBaseInstanceData();
    const data = baseData
      ?? this.createPrimitiveData(this.options.getPrimitiveKind(), this.options.getPrimitiveDimension());
    const materialId = baseData
      ? this.options.getBaseMaterialId()
      : this.options.materialService.defaultMaterialId(this.options.defaultMaterialName);
    const label = `${data.kind} #${this.options.instances.length + 1}`;
    this.insertInstance(data, offset, label, materialId);
  }

  getObjectTransform(idx: number) {
    return idx === -1 ? this.options.getBaseTransform() : this.options.instances[idx]?.transform;
  }

  getProductFactor(idx: number, visibleDimensionCount: number): ProductMeshFactor | null {
    const source = idx === -1 ? this.options.getBaseInstanceData() : null;
    const instance = idx === -1 ? null : this.options.instances[idx];
    const vertexCount = source?.V ?? instance?.M ?? 0;
    if (vertexCount <= 0) return null;

    const sourceVertices = source?.verts ?? instance?.X;
    const sourceEdges = source?.edges ?? instance?.E;
    const sourceCellTopology = source?.cellTopology ?? instance?.cellTopology;
    const sourceSurfaceTopology = source?.surfaceTopology ?? instance?.surfaceTopology;
    const sourceOrigin = source?.origin ?? instance?.origin;
    const sourceOriginalN = source?.originalN ?? instance?.originalN ?? visibleDimensionCount;
    const sourceAxisMap = source?.axisMap ?? instance?.axisMap ?? canonicalAxisMap(sourceOriginalN);
    if (!sourceVertices || !sourceEdges || !sourceOrigin) return null;

    const dimension = Math.max(1, Math.min(MAX_N, sourceOriginalN || visibleDimensionCount));
    const axisMap = normalizeAxisMap(sourceAxisMap, dimension);
    const verts = new Float32Array(dimension * vertexCount);
    for (let d = 0; d < dimension; d++) {
      const ambientDim = axisMap[d] ?? d;
      const originValue = sourceOrigin[ambientDim] ?? 0;
      for (let v = 0; v < vertexCount; v++) {
        verts[d * vertexCount + v] = sourceVertices[ambientDim * vertexCount + v] - originValue;
      }
    }

    return {
      verts,
      vertexCount,
      dimension,
      edges: new Uint32Array(sourceEdges),
      cellTopology: cloneCellTopology(sourceCellTopology),
      surfaceTopology: clonePrimitiveSurfaceTopology(sourceSurfaceTopology),
    };
  }

  addProductMeshFromSelection(
    selected: number[],
    parentMaterialId: string,
    parentTransform: TransformState | undefined,
    visibleDimensionCount: number,
  ) {
    if (selected.length < 2) return null;
    const factors = selected.map(idx => this.getProductFactor(idx, visibleDimensionCount));
    if (factors.some(factor => !factor)) {
      throw new Error('Product mesh requires valid selected geometry.');
    }

    const product = buildProductMesh(factors as ProductMeshFactor[], MAX_N);
    const axisMap = canonicalAxisMap(product.dimension);
    const verts = embedToMax(product.verts, product.dimension, axisMap);
    const inst = this.insertInstance({
      verts,
      edges: product.edges,
      cellTopology: cloneCellTopology(product.cellTopology)
        ?? deriveCellTopologyForGeometry('productMesh', product.dimension, product.vertexCount, product.edges, product.surfaceTopology),
      surfaceTopology: clonePrimitiveSurfaceTopology(product.surfaceTopology),
      V: product.vertexCount,
      kind: 'productMesh',
      axisMap,
      originalN: product.dimension,
      origin: new Float32Array(MAX_N),
    }, new THREE.Vector3(0, 0, 0), `Product #${this.options.instances.length + 1}`, parentMaterialId);

    if (parentTransform) {
      inst.transform.scale.copy(parentTransform.scale);
      this.options.projectAndRenderAll();
      this.options.updateObjectList();
    }
    this.options.requestSceneUrlUpdate();
    return inst;
  }

  moveGeometryOriginToWorldPosition(idx: number, position: THREE.Vector3, currentPosition: THREE.Vector3 | null) {
    const transform = this.getObjectTransform(idx);
    if (!transform || !currentPosition) return false;
    const delta = position.clone().sub(currentPosition);
    transform.pos.add(delta);
    if (idx >= 0) this.options.instances[idx]?.offset.add(delta);
    this.options.projectAndRenderAll();
    this.options.updateSelectionOutline();
    return true;
  }

  recalculateGeometryOrigin(idx: number) {
    if (idx === -1) {
      return this.options.recalculateBaseOrigin();
    }

    const inst = this.options.instances[idx];
    if (!inst) return false;
    computeObjectOrigin(inst.X, inst.M, MAX_N, inst.origin);
    return true;
  }
}
