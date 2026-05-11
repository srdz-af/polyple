import * as THREE from 'three';
import { MAX_N, type ViewMode } from '../constants';
import { buildPrimitive, clonePrimitiveSurfaceTopology, type PrimitiveKind } from '../geometry/primitives';
import { embedToMax, normalizeAxisMap, type AxisMap } from '../geometry/projectionUtils';
import { cloneCellTopology } from '../geometry/cellTopology';
import type { NDProjector } from '../geometry/NDProjector';
import type { SceneMaterialService } from './SceneMaterialService';
import { createSceneInstance, type InstanceGeometryData } from './instanceFactory';
import { cloneObjectOrigin, computeObjectOrigin } from './objectOrigin';
import { deriveCellTopologyForGeometry } from './topologyState';
import { cloneTransformState } from './sceneStateCodec';
import type { Instance, InstanceSnapshot } from './types';
import { HypercubeRenderer } from '../rendering/HypercubeRenderer';
import { cloneSurface } from './surface';

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
  getBaseMaterialId: () => string;
  defaultMaterialName: string;
  pushUndoSnapshot: () => void;
  projectAndRenderAll: () => void;
  setViewMode: (mode: ViewMode) => void;
  updateObjectList: () => void;
  requestSceneUrlUpdate: () => void;
  clearSelection: () => void;
  clearSelectionOutlines: () => void;
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
}
