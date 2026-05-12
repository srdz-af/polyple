import * as THREE from 'three';
import type { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { MAX_N, type ViewMode } from '../constants';
import type { BackgroundController } from '../background/BackgroundController';
import { RenderEffectsController, clamp01, clampSigned01 } from '../rendering/RenderEffectsController';
import {
  normalizeAntialiasMode,
  type AntialiasMode,
  type KeyframeTimelineController,
} from '../animation/KeyframeTimelineController';
import type { PaneController } from '../ui/PaneController';
import type { WelcomeSplashController } from '../ui/WelcomeSplashController';
import type { AxisGizmoController } from '../ui/AxisGizmoController';
import type { TransformController } from '../interaction/TransformController';
import type { SceneSelectionService } from './SceneSelectionService';
import { DEFAULT_SCENE_STATE } from './defaultSceneState';
import { SceneHistory } from './SceneHistory';
import {
  finiteInteger,
  finiteNumber,
  isPackedSceneUrlState,
  normalizeViewMode,
  packBackgroundState,
  packInstanceState,
  packMaterialState,
  packSceneLightState,
  packSurfaceState,
  packTimelineState,
  packTransformState,
  sanitizeSceneName,
  unpackBackgroundState,
  unpackSceneUrlSnapshot,
  unpackTimelineState,
  unpackVec3,
  type PackedCamera,
  type PackedSceneUrlState,
  type PrimitiveMode,
  type SceneCodecDefaults,
} from './sceneStateCodec';
import {
  clearScenePayloadFromCurrentUrl,
  createSceneUrlWithPayload,
  decodeSceneUrlPayload,
  encodeSceneUrlPayload,
  packF32,
  packU32,
  readScenePayloadFromText,
  readScenePayloadFromUrl,
} from './sceneUrlState';
import {
  packCellTopologyForUrl,
  packSurfaceTopology,
} from './topologyState';
import { normalizeSurface } from './surface';
import type { CellTopology } from '../geometry/cellTopology';
import type { PrimitiveSurfaceTopology } from '../geometry/primitives';
import type { SceneLightState, SceneSnapshot } from './types';
import { copyTextToClipboard, downloadTextFile, timestampedSceneFileName } from '../utils/fileExport';

type SceneStateParams = {
  N: number;
  primitive: PrimitiveMode;
  renderMode: ViewMode;
  editMode: boolean;
  axesX: number;
  axesY: number;
  axesZ: number;
  bloomIntensity: number;
  motionBlurIntensity: number;
  colorHue: number;
  colorSaturation: number;
  colorBrightness: number;
  colorContrast: number;
  grainIntensity: number;
  antialiasMode: AntialiasMode;
};

type SceneStateServiceOptions = {
  params: SceneStateParams;
  camera: THREE.PerspectiveCamera;
  controls: OrbitControls;
  worldUp: THREE.Vector3;
  defaultCameraPosition: THREE.Vector3;
  maxUndoSnapshotBytes: number;
  noSelection: number;
  defaults: {
    bloomIntensity: number;
    motionBlurIntensity: number;
    colorHue: number;
    colorSaturation: number;
    colorBrightness: number;
    colorContrast: number;
    grainIntensity: number;
  };
  createMaterialId: () => string;
  createSceneLightId: () => string;
  captureSnapshot: () => SceneSnapshot<PrimitiveMode>;
  applySnapshot: (snap: SceneSnapshot<PrimitiveMode>) => void;
  estimateUndoSnapshotBytes: () => number;
  getLights: () => SceneLightState[];
  getTimeline: () => KeyframeTimelineController | null;
  backgroundController: BackgroundController;
  renderEffects: RenderEffectsController;
  paneController: PaneController;
  welcomeSplashController: WelcomeSplashController;
  axisController: AxisGizmoController;
  transformController: TransformController;
  selectionService: SceneSelectionService;
  isGeometrySelectionIndex: (idx: number) => boolean;
  getObjectVisible: (idx: number) => boolean;
  setViewMode: (mode: ViewMode) => void;
  setEditMode: (enabled: boolean) => void;
  updateAxisGizmo: () => void;
  projectAndRenderAll: () => void;
  updateAxisLegend: () => void;
  renderAxisList: () => void;
  updateObjectList: () => void;
  updateSelectionOutline: () => void;
  updateTexturePanel: () => void;
  updateVertexCloud: (idx: number) => void;
  placeVertexMarker: (idx: number, vertexIdx: number) => void;
};

export class SceneStateService {
  readonly history: SceneHistory<PackedSceneUrlState>;
  private applying = false;
  private sceneName = '';

  constructor(private readonly options: SceneStateServiceOptions) {
    this.history = new SceneHistory({
      capture: () => this.captureUrlState(),
      apply: state => this.applyUrlState(state),
      maxEntries: 20,
    });
  }

  isApplying() {
    return this.applying;
  }

  setSceneName(name: string) {
    this.sceneName = sanitizeSceneName(name);
  }

  captureUrlState(sceneNameOverride = this.sceneName): PackedSceneUrlState {
    const snap = this.options.captureSnapshot();
    const editSelection = this.options.transformController.getEditSelection();
    const params = this.options.params;
    const packedSceneName = sanitizeSceneName(sceneNameOverride);
    return {
      v: 1,
      sn: packedSceneName || undefined,
      n: snap.N,
      x: packF32(snap.X),
      e: packU32(snap.E),
      ct: packCellTopologyForUrl(snap.primitive, snap.source, snap.cellTopology),
      st: packSurfaceTopology(snap.surfaceTopology),
      m: snap.M,
      ds: snap.source,
      l: snap.label,
      pn: snap.paramsN,
      pk: snap.primitive,
      rm: params.renderMode,
      em: params.editMode ? 1 : 0,
      fx: [
        params.bloomIntensity,
        params.motionBlurIntensity,
        params.colorHue,
        params.colorSaturation,
        params.colorBrightness,
        params.colorContrast,
        params.grainIntensity,
        params.antialiasMode === 'smaa' ? 1 : 0,
      ],
      r: packF32(snap.rotMatrix),
      ax: [snap.axes.x, snap.axes.y, snap.axes.z],
      ao: [...snap.axesOrder],
      of: snap.axesOffset,
      bam: [...snap.baseAxisMap],
      bt: packTransformState(snap.baseTransform),
      bo: packF32(snap.baseOrigin ? new Float32Array(snap.baseOrigin) : new Float32Array(MAX_N)),
      bn: snap.baseOrigN,
      bv: snap.baseVisible ? 1 : 0,
      ma: snap.materials?.map(packMaterialState),
      bm: snap.baseMaterialId,
      bs: packSurfaceState(normalizeSurface(snap.baseSurface)),
      si: snap.selectedInstance,
      ss: [...(snap.selectedInstances ?? [])],
      sv: this.options.transformController.getSelectedVertex(),
      es: editSelection?.cellIds.length ? [editSelection.dimension, [...editSelection.cellIds]] : undefined,
      i: snap.instances.map(packInstanceState),
      c: this.packCameraState(),
      bg: packBackgroundState(this.options.backgroundController.getUrlState()),
      li: this.options.getLights().map(packSceneLightState),
      tl: this.options.getTimeline() ? packTimelineState(this.options.getTimeline()!.getTimelineState()) : undefined,
      ag: this.options.axisController.getExtraAxisState(),
    };
  }

  async applyUrlState(state: PackedSceneUrlState) {
    this.applying = true;
    try {
      this.sceneName = sanitizeSceneName(state.sn);
      const params = this.options.params;
      const viewMode = normalizeViewMode(state.rm);
      params.renderMode = viewMode;
      this.options.applySnapshot(unpackSceneUrlSnapshot(state, this.sceneCodecDefaults()));
      this.options.setViewMode(viewMode);

      params.bloomIntensity = clamp01(finiteNumber(state.fx?.[0], this.options.defaults.bloomIntensity));
      params.motionBlurIntensity = clamp01(finiteNumber(state.fx?.[1], this.options.defaults.motionBlurIntensity));
      params.colorHue = clampSigned01(finiteNumber(state.fx?.[2], this.options.defaults.colorHue));
      params.colorSaturation = clampSigned01(finiteNumber(state.fx?.[3], this.options.defaults.colorSaturation));
      params.colorBrightness = clampSigned01(finiteNumber(state.fx?.[4], this.options.defaults.colorBrightness));
      params.colorContrast = clampSigned01(finiteNumber(state.fx?.[5], this.options.defaults.colorContrast));
      params.grainIntensity = clamp01(finiteNumber(state.fx?.[6], this.options.defaults.grainIntensity));
      params.antialiasMode = normalizeAntialiasMode(state.fx?.[7] === 1 ? 'smaa' : 'off');
      this.options.renderEffects.sync();

      this.options.axisController.applyExtraAxisState(state.ag);
      this.applyCameraState(state.c);
      this.options.setEditMode(state.em === 1);
      const packedEditSelection = Array.isArray(state.es) ? state.es : null;
      if (packedEditSelection && params.editMode && this.options.isGeometrySelectionIndex(this.options.selectionService.primary)) {
        const dimension = finiteInteger(packedEditSelection[0], 0);
        const cellIds = Array.isArray(packedEditSelection[1])
          ? packedEditSelection[1].map(cellId => finiteInteger(cellId, -1))
          : [];
        this.options.selectionService.restorePackedEditSelection(dimension, cellIds);
      } else {
        this.options.transformController.setSelectedVertex(finiteInteger(state.sv, -1));
      }
      const activeEditSelection = this.options.transformController.getEditSelection();
      if (params.editMode && activeEditSelection && this.options.getObjectVisible(this.options.selectionService.primary)) {
        this.options.updateVertexCloud(this.options.selectionService.primary);
        if (this.options.transformController.getSelectedVertex() >= 0) {
          this.options.placeVertexMarker(
            this.options.selectionService.primary,
            this.options.transformController.getSelectedVertex(),
          );
        }
      }

      this.options.getTimeline()?.applyTimelineState(
        state.tl ? unpackTimelineState(state.tl, this.sceneCodecDefaults()) : undefined,
        false,
      );
      await this.options.backgroundController.applyUrlState(unpackBackgroundState(state.bg));

      this.options.projectAndRenderAll();
      this.options.updateAxisLegend();
      this.options.renderAxisList();
      this.options.updateObjectList();
      this.options.updateSelectionOutline();
      this.options.updateTexturePanel();
    } finally {
      this.applying = false;
    }
  }

  async loadUrlPayload(payload: string, clearUrlAfterLoad: boolean) {
    const decoded = await decodeSceneUrlPayload(payload);
    if (!isPackedSceneUrlState(decoded)) {
      throw new Error('Invalid scene URL state.');
    }
    await this.applyUrlState(decoded);
    if (clearUrlAfterLoad) clearScenePayloadFromCurrentUrl();
    return decoded;
  }

  async loadPayloadSceneName(payload: string) {
    return sanitizeSceneName((await this.loadUrlPayload(payload, false)).sn);
  }

  hasUrlPayload() {
    return Boolean(readScenePayloadFromUrl());
  }

  async initializeFromUrlOrDefault(loadDefault = false) {
    const payload = readScenePayloadFromUrl();
    if (!payload) {
      if (loadDefault) await this.applyDefaultState();
      return;
    }

    try {
      await this.loadUrlPayload(payload, true);
    } catch (err) {
      console.warn('Unable to apply scene URL state', err);
      clearScenePayloadFromCurrentUrl();
    }
  }

  async applyDefaultState() {
    if (!isPackedSceneUrlState(DEFAULT_SCENE_STATE)) {
      console.warn('Default scene state is invalid.');
      return;
    }
    await this.applyUrlState(DEFAULT_SCENE_STATE);
  }

  async saveFile(sceneSaveButton: HTMLButtonElement | null) {
    if (!sceneSaveButton) return;
    const previousTitle = sceneSaveButton.title;
    sceneSaveButton.disabled = true;
    sceneSaveButton.title = 'Saving scene URL...';
    try {
      const nextSceneName = this.requestSceneNameForSave();
      const payload = await encodeSceneUrlPayload(this.captureUrlState(nextSceneName));
      this.options.welcomeSplashController.rememberScene(payload, nextSceneName);
      const sceneUrl = createSceneUrlWithPayload(payload);
      downloadTextFile(sceneUrl, timestampedSceneFileName());
      let copied = true;
      try {
        await copyTextToClipboard(sceneUrl);
      } catch (err) {
        copied = false;
        console.warn('Unable to copy scene URL to clipboard', err);
      }
      sceneSaveButton.title = copied ? 'Scene URL copied and downloaded' : 'Scene URL downloaded';
    } catch (err) {
      console.warn('Unable to save scene URL state', err);
      window.alert('Unable to save scene URL.');
    } finally {
      sceneSaveButton.disabled = false;
      window.setTimeout(() => {
        if (sceneSaveButton) sceneSaveButton.title = previousTitle;
      }, 1600);
    }
  }

  async loadFile(file: File | null | undefined) {
    if (!file) return false;
    try {
      const payload = readScenePayloadFromText(await file.text());
      if (!payload) throw new Error('Scene file does not contain a valid scene URL.');
      const state = await this.loadUrlPayload(payload, false);
      this.options.welcomeSplashController.rememberScene(payload, sanitizeSceneName(state.sn));
      this.options.welcomeSplashController.hide();
      return true;
    } catch (err) {
      console.warn('Unable to load scene URL state', err);
      window.alert(err instanceof Error ? err.message : 'Unable to load scene URL.');
      return false;
    }
  }

  pushUndoSnapshot() {
    if (this.applying) return;
    const estimatedBytes = this.options.estimateUndoSnapshotBytes();
    if (estimatedBytes > this.options.maxUndoSnapshotBytes) {
      console.warn(
        `Skipping undo snapshot because the scene is too large (${(estimatedBytes / 1024 / 1024).toFixed(1)} MB).`,
      );
      return;
    }
    this.history.push();
  }

  undo() {
    void this.history.undo();
  }

  redo() {
    void this.history.redo();
  }

  private requestSceneNameForSave() {
    const currentName = sanitizeSceneName(this.sceneName);
    const value = window.prompt('Scene name (optional)', currentName || '');
    if (value === null) return currentName;
    this.sceneName = sanitizeSceneName(value);
    return this.sceneName;
  }

  private sceneCodecDefaults(): SceneCodecDefaults {
    return {
      defaultCameraPosition: this.options.defaultCameraPosition,
      worldUp: this.options.worldUp,
      createMaterialId: this.options.createMaterialId,
      createSceneLightId: this.options.createSceneLightId,
      noSelection: this.options.noSelection,
      bloomIntensity: this.options.defaults.bloomIntensity,
      motionBlurIntensity: this.options.defaults.motionBlurIntensity,
      colorHue: this.options.defaults.colorHue,
      colorSaturation: this.options.defaults.colorSaturation,
      colorBrightness: this.options.defaults.colorBrightness,
      colorContrast: this.options.defaults.colorContrast,
      grainIntensity: this.options.defaults.grainIntensity,
    };
  }

  private packCameraState(): PackedCamera {
    const { camera, controls } = this.options;
    return [
      camera.position.x, camera.position.y, camera.position.z,
      controls.target.x, controls.target.y, controls.target.z,
      camera.up.x, camera.up.y, camera.up.z,
      camera.fov, camera.zoom,
    ];
  }

  private applyCameraState(state: PackedCamera | undefined) {
    if (!state) return;
    const { camera, controls } = this.options;
    camera.position.copy(unpackVec3(state, this.options.defaultCameraPosition));
    controls.target.copy(unpackVec3([state[3], state[4], state[5]], new THREE.Vector3()));
    camera.up.copy(unpackVec3([state[6], state[7], state[8]], this.options.worldUp).normalize());
    camera.fov = Math.max(1, Math.min(179, finiteNumber(state[9], camera.fov)));
    camera.zoom = Math.max(0.01, Math.min(100, finiteNumber(state[10], camera.zoom)));
    camera.updateProjectionMatrix();
    controls.update();
    this.options.updateAxisGizmo();
  }
}

export function byteLengthOfCellTopology(topology?: CellTopology) {
  if (!topology) return 0;
  return topology.cells.reduce((sum, dim) => (
    sum + (dim ? dim.offsets.byteLength + dim.vertices.byteLength : 0)
  ), 0);
}

export function byteLengthOfSurfaceTopology(topology?: PrimitiveSurfaceTopology) {
  if (!topology) return 0;
  return topology.triangles.byteLength + topology.facetIds.byteLength;
}
