import type { ViewMode } from '../constants';
import type { CellTopology } from '../geometry/cellTopology';
import type { PrimitiveSurfaceTopology } from '../geometry/primitives';
import type { HypercubeRenderer } from '../rendering/HypercubeRenderer';
import type { SurfaceState } from './surface';
import type { Instance } from './types';

export type RenderableGeometryState = {
  M: number;
  E: Uint32Array;
  surfaceTopology?: PrimitiveSurfaceTopology;
  cellTopology?: CellTopology;
  surface: SurfaceState;
};

type RenderSyncOptions = {
  getRenderMode: () => ViewMode;
  getEditMode: () => boolean;
  getBaseRenderer: () => HypercubeRenderer;
  getBaseGeometry: () => RenderableGeometryState;
  getInstance: (idx: number) => Instance | undefined;
  getObjectVisible: (idx: number) => boolean;
  projectAndRenderAll: () => void;
  applyObjectVisibility: () => void;
  updateObjectList: () => void;
  updateSelectionOutline: () => void;
  updateTransformActionButtons: () => void;
  updateVertexCloud: (idx: number) => void;
  requestSceneUrlUpdate: () => void;
};

export type RenderSyncRefreshOptions = {
  project?: boolean;
  applyVisibility?: boolean;
  objectList?: boolean;
  selectionOutline?: boolean;
  transformActions?: boolean;
  vertexCloud?: boolean;
  dirtyUrl?: boolean;
};

export class RenderSyncService {
  constructor(private readonly options: RenderSyncOptions) {}

  rebuildBaseRenderer() {
    const base = this.options.getBaseGeometry();
    this.rebuildRenderer(this.options.getBaseRenderer(), base);
  }

  rebuildInstanceRenderer(instance: Instance) {
    this.rebuildRenderer(instance.renderer, instance);
  }

  rebuildGeometryRenderer(instIdx: number) {
    if (instIdx < 0) {
      this.rebuildBaseRenderer();
      return;
    }
    const instance = this.options.getInstance(instIdx);
    if (instance) this.rebuildInstanceRenderer(instance);
  }

  refreshAfterGeometryChange(instIdx: number, refreshOptions: RenderSyncRefreshOptions = {}) {
    const {
      project = true,
      applyVisibility = true,
      objectList = true,
      selectionOutline = true,
      transformActions = true,
      vertexCloud = true,
      dirtyUrl = true,
    } = refreshOptions;

    if (project) this.options.projectAndRenderAll();
    if (applyVisibility) this.options.applyObjectVisibility();
    if (objectList) this.options.updateObjectList();
    if (selectionOutline) this.options.updateSelectionOutline();
    if (transformActions) this.options.updateTransformActionButtons();
    if (vertexCloud && this.options.getEditMode() && this.options.getObjectVisible(instIdx)) {
      this.options.updateVertexCloud(instIdx);
    }
    if (dirtyUrl) this.options.requestSceneUrlUpdate();
  }

  private rebuildRenderer(renderer: HypercubeRenderer, state: RenderableGeometryState) {
    renderer.build(state.M, state.E, state.surfaceTopology, state.cellTopology);
    renderer.setSurface(state.surface);
    renderer.setMode(this.options.getRenderMode());
  }
}
