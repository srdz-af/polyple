import { cloneCellTopology, type CellTopology } from '../geometry/cellTopology';
import { clonePrimitiveSurfaceTopology, type PrimitiveSurfaceTopology } from '../geometry/primitives';
import type { SceneHistory } from './SceneHistory';
import type { RenderSyncService } from './RenderSyncService';

export type EditGeometrySnapshot = {
  X: Float32Array;
  E: Uint32Array;
  M: number;
  cellTopology?: CellTopology;
  surfaceTopology?: PrimitiveSurfaceTopology;
};

type GeometryTargetState = EditGeometrySnapshot;

type GeometryEditServiceOptions<TUndoSnapshot> = {
  baseSelection: number;
  getBaseState: () => GeometryTargetState;
  setBaseState: (state: EditGeometrySnapshot) => void;
  getInstanceState: (idx: number) => GeometryTargetState | null;
  setInstanceState: (idx: number, state: EditGeometrySnapshot) => void;
  getObjectVisible: (idx: number) => boolean;
  isSceneApplying: () => boolean;
  history: SceneHistory<TUndoSnapshot>;
  renderSync: RenderSyncService;
};

export class GeometryEditService<TUndoSnapshot> {
  constructor(private readonly options: GeometryEditServiceOptions<TUndoSnapshot>) {}

  captureSnapshot(instIdx: number): EditGeometrySnapshot | null {
    if (!this.options.getObjectVisible(instIdx)) return null;
    const state = instIdx === this.options.baseSelection
      ? this.options.getBaseState()
      : this.options.getInstanceState(instIdx);
    if (!state || state.M <= 0) return null;
    return {
      X: new Float32Array(state.X),
      E: new Uint32Array(state.E),
      M: state.M,
      cellTopology: cloneCellTopology(state.cellTopology),
      surfaceTopology: clonePrimitiveSurfaceTopology(state.surfaceTopology),
    };
  }

  restoreSnapshot(instIdx: number, snapshot: EditGeometrySnapshot) {
    const restored = {
      X: new Float32Array(snapshot.X),
      E: new Uint32Array(snapshot.E),
      M: snapshot.M,
      cellTopology: cloneCellTopology(snapshot.cellTopology),
      surfaceTopology: clonePrimitiveSurfaceTopology(snapshot.surfaceTopology),
    };
    if (instIdx === this.options.baseSelection) this.options.setBaseState(restored);
    else this.options.setInstanceState(instIdx, restored);
    this.options.renderSync.rebuildGeometryRenderer(instIdx);
  }

  commit(undoSnapshot: TUndoSnapshot, instIdx: number) {
    if (this.options.isSceneApplying()) return false;
    this.options.history.push(undoSnapshot);
    this.options.renderSync.refreshAfterGeometryChange(instIdx);
    return true;
  }
}
