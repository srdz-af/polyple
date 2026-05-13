import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { MAX_N, type ViewMode } from '../constants';
import { RotND } from '../RotND';
import { NDProjector, canonicalP } from '../geometry/NDProjector';
import {
  buildPrimitive,
  clonePrimitiveSurfaceTopology,
  type PrimitiveKind,
  type PrimitiveSurfaceTopology,
} from '../geometry/primitives';
import {
  canonicalAxisMap,
  embedToMax,
  normalizeAxisMap,
  type AxisMap,
} from '../geometry/projectionUtils';
import type { ProductMeshFactor } from '../geometry/productMesh';
import {
  compactDimensionMajorVertices,
} from '../geometry/bevelGeometry';
import {
  buildGeneratedCellTopology,
  cloneCellTopology,
  deleteCellAndPrune,
  surfaceTopologyFromCellTopology,
  type CellTopology,
} from '../geometry/cellTopology';
import { BackgroundController, backgroundElementsFromDocument, type BackgroundUrlState } from '../background/BackgroundController';
import { KeyboardCameraController } from '../controls/KeyboardCameraController';
import { KeyboardShortcutController } from '../interaction/KeyboardShortcutController';
import { SelectionOutlineRenderer } from '../interaction/SelectionOutlineRenderer';
import { TransformController } from '../interaction/TransformController';
import { ViewportInteractionController, viewportContextMenuFromDocument } from '../interaction/ViewportInteractionController';
import { ViewportRenderRuntime } from '../viewport/ViewportRenderRuntime';
import { AxisGizmoController } from '../ui/AxisGizmoController';
import { DimensionControlController } from '../ui/DimensionControlController';
import { EditToolbarController } from '../ui/EditToolbarController';
import { ModalOverlayController } from '../ui/ModalOverlayController';
import { ObjectListController } from '../ui/ObjectListController';
import { PaneController } from '../ui/PaneController';
import { SceneControlTabsController } from '../ui/SceneControlTabsController';
import { SceneFileControlsController } from '../ui/SceneFileControlsController';
import { TextureEditorController } from '../ui/TextureEditorController';
import { ViewModeController } from '../ui/ViewModeController';
import { ViewportActionControlsController } from '../ui/ViewportActionControlsController';
import { WelcomeSplashController, welcomeSplashElementsFromDocument } from '../ui/WelcomeSplashController';
import { ViewportCaptureController, viewportCaptureElementsFromDocument } from '../viewport/ViewportCaptureController';
import { HypercubeRenderer } from '../rendering/HypercubeRenderer';
import { PerformanceOverlayController } from '../rendering/PerformanceOverlayController';
import { RenderEffectsController, renderEffectsElementsFromDocument } from '../rendering/RenderEffectsController';
import {
  KeyframeTimelineController,
  type AntialiasMode,
  type AnimationKeyframeState,
  type AnimationTimelineState,
  type RenderQuality,
} from '../animation/KeyframeTimelineController';
import { completeAxisOrder, interpolateAnimationState } from '../animation/animationInterpolation';
import type { InstanceGeometryData } from '../scene/instanceFactory';
import { DuplicatePlacementOperationFactory } from '../scene/DuplicatePlacementOperationFactory';
import { GeometryEditOperationFactory } from '../scene/GeometryEditOperationFactory';
import { GeometryEditService } from '../scene/GeometryEditService';
import { cloneObjectOrigin, computeObjectOrigin, type ObjectOrigin } from '../scene/objectOrigin';
import { ProjectionPipeline } from '../scene/ProjectionPipeline';
import { RenderSyncService } from '../scene/RenderSyncService';
import { SceneMaterialService } from '../scene/SceneMaterialService';
import { SceneObjectService } from '../scene/SceneObjectService';
import { SceneObjectStore } from '../scene/SceneObjectStore';
import { SceneSelectionService } from '../scene/SceneSelectionService';
import { SceneLightService } from '../scene/SceneLightService';
import { SceneStateService, byteLengthOfCellTopology, byteLengthOfSurfaceTopology } from '../scene/SceneStateService';
import type { SceneLightRuntime } from '../scene/sceneLightRuntime';
import {
  deriveCellTopologyForGeometry,
  surfaceTopologyForEditedCellTopology,
} from '../scene/topologyState';
import {
  cloneTransformState,
  type PackedSceneUrlState,
  type PrimitiveMode,
} from '../scene/sceneStateCodec';
import { DEFAULT_SURFACE, cloneSurface, type SurfaceState } from '../scene/surface';
import type {
  DataSource,
  Instance,
  InstanceSnapshot,
  ProjectionAxes,
  SceneLightKind,
  SceneLightState,
  SceneSnapshot,
  TransformMode,
  TransformState,
} from '../scene/types';
import type { ExtraAxisGizmoState } from '../ui/ExtraAxisGizmoController';


export class PolypleApp {
  private readonly confirmExitHandler = (ev: BeforeUnloadEvent) => {
    ev.preventDefault();
    ev.returnValue = '';
  };

  constructor(private readonly app: HTMLElement) {}

  start() {
    window.addEventListener('beforeunload', this.confirmExitHandler);

    const DEFAULT_BLOOM_INTENSITY = 0;
    const DEFAULT_MOTION_BLUR_INTENSITY = 0;
    const DEFAULT_COLOR_HUE = 0;
    const DEFAULT_COLOR_SATURATION = 0;
    const DEFAULT_COLOR_BRIGHTNESS = 0;
    const DEFAULT_COLOR_CONTRAST = 0;
    const DEFAULT_GRAIN_INTENSITY = 0;
    const DEFAULT_ANTIALIAS_MODE: AntialiasMode = 'off';
    const MAX_VIEWPORT_PIXEL_RATIO = 2;
    const POSTPROCESSING_MSAA_SAMPLES = 4;
    const GRAIN_UPDATE_INTERVAL_FRAMES = 3;
    const GRAIN_TEXTURE_SCALE = 0.5;
    const MAX_UNDO_SNAPSHOT_BYTES = 64 * 1024 * 1024;
    let sceneStateService: SceneStateService;
    
    function requestSceneUrlUpdate() {
      // Scene URLs are exported explicitly from the save button.
    }
    
    const app = this.app;
    const modalOverlayController = new ModalOverlayController();
    const paneController = new PaneController();
    const sceneControlTabs = new SceneControlTabsController();
    const dimensionControl = new DimensionControlController({
      getDimension: () => PARAMS.N,
      setDimension: value => setNewPrimitiveDimension(value),
    });
    const welcomeSplashController = new WelcomeSplashController(
      welcomeSplashElementsFromDocument(),
      {
      loadPayload: payload => sceneStateService.loadPayloadSceneName(payload),
      },
    );
    const sceneFileControls = new SceneFileControlsController({
      undo: undoSceneSnapshot,
      redo: redoSceneSnapshot,
      saveScene: button => saveSceneStateFile(button),
      loadSceneFile: loadSceneStateFile,
      hideWelcome: () => welcomeSplashController.hide(),
    });
    const viewportActionControls = new ViewportActionControlsController({
      getEditMode: () => PARAMS.editMode,
      setEditMode,
      toggleTransformMode: mode => transformController.toggleTransformMode(mode),
      recenterCamera: () => keyboardCamera.recenterCamera(),
      resetFocus: () => keyboardCamera.resetFocus(),
    });
    
    function setSceneControlTab(tab: string) {
      sceneControlTabs.setActive(tab);
    }
    
    sceneControlTabs.bind('environment');
    
    // --- Three.js setup ---
    const DEFAULT_CAMERA_POSITION = new THREE.Vector3(3.9, 2.7, 3.9);
    const renderRuntime = new ViewportRenderRuntime({
      app,
      maxPixelRatio: MAX_VIEWPORT_PIXEL_RATIO,
      msaaSamples: POSTPROCESSING_MSAA_SAMPLES,
      grainUpdateIntervalFrames: GRAIN_UPDATE_INTERVAL_FRAMES,
      grainTextureScale: GRAIN_TEXTURE_SCALE,
      defaultCameraPosition: DEFAULT_CAMERA_POSITION,
      onCameraChange: () => requestSceneUrlUpdate(),
      markProjectionDirty,
      syncSceneLights: () => {
        sceneLightService?.syncRuntimes();
        sceneLightService?.syncPanel();
      },
    });
    const {
      renderer,
      scene,
      camera,
      controls,
      axes,
      gridGroup,
      bloomPass,
      afterimagePass,
      colorGradePass,
      smaaPass,
      grainPass,
    } = renderRuntime;
    const setCaptureResolutionMode = (renderQuality: RenderQuality) => renderRuntime.setCaptureResolutionMode(renderQuality);
    const baseBackground = new THREE.Color(0x10141a);
    const editBackground = new THREE.Color(0x141414);
    scene.background = baseBackground.clone();
    renderer.setClearColor(scene.background);
    const pmrem = new THREE.PMREMGenerator(renderer);
    const fallbackEnvironmentTarget = pmrem.fromScene(new RoomEnvironment(), 0.04);
    scene.environment = null;
    const backgroundController = new BackgroundController({
      scene,
      renderer,
      pmrem,
      fallbackEnvironmentTarget,
      baseBackground,
      editBackground,
      ...backgroundElementsFromDocument(),
      getRenderMode: () => PARAMS.renderMode,
      getEditMode: () => PARAMS.editMode,
      onStateChange: () => requestSceneUrlUpdate(),
    });
    
    const worldUp = new THREE.Vector3(0, 1, 0);
    let keyboardCamera: KeyboardCameraController;
    
    let axisController: AxisGizmoController;
    const visibleDims = () => axisController.visibleDims();
    const currentAxisMap = (localN: number) => axisController.currentAxisMap(localN);
    const perspectiveDimsFor = (localN: number, axisMap: AxisMap) => axisController.perspectiveDimsFor(localN, axisMap);
    const extraRotationPlaneAxis = (lockAxis: -1 | 0 | 1 | 2, depthDim: number) => axisController.extraRotationPlaneAxis(lockAxis, depthDim, N);
    const setProjectionAxes = (axes: ProjectionAxes) => axisController.setProjectionAxes(axes);
    const cycleAxes = (step: number) => axisController.cycleAxes(step);
    const renderAxisList = () => axisController.renderAxisList();
    const updateAxisLegend = () => axisController.updateAxisLegend();
    const updateAxisGizmo = () => axisController.updateAxisGizmo();
    const applyAutoRotation = (dt: number) => axisController.applyAutoRotation(dt);
    let projectionPipeline: ProjectionPipeline | null = null;
    let renderSync: RenderSyncService;
    let sceneLightService: SceneLightService;
    let sceneMaterialService: SceneMaterialService;
    let sceneObjectService: SceneObjectService;
    let sceneObjectStore: SceneObjectStore<SceneLightRuntime>;
    let geometryEditService: GeometryEditService<PackedSceneUrlState>;
    let geometryEditOperationFactory: GeometryEditOperationFactory<PackedSceneUrlState>;
    let duplicatePlacementFactory: DuplicatePlacementOperationFactory<PackedSceneUrlState, Instance, SceneLightRuntime>;
    let selectionService: SceneSelectionService<SceneLightRuntime>;
    let editToolbar: EditToolbarController | null = null;
    let projectionDirty = true;
    
    function markProjectionDirty() {
      projectionDirty = true;
    }
    
    function projectIfDirty() {
      if (!projectionDirty || !projectionPipeline) return 0;
      const start = performance.now();
      projectionPipeline.projectAndRenderAll();
      projectionDirty = false;
      return performance.now() - start;
    }
    
    const projectAndRenderAll = () => {
      markProjectionDirty();
      projectIfDirty();
    };
    
    const perfOverlay = new PerformanceOverlayController();
    const togglePerfOverlay = () => perfOverlay.toggle();
    const recordPerfFrame = (frameStart: number, projectionMs: number, renderMs: number) => {
      perfOverlay.recordFrame(frameStart, projectionMs, renderMs);
    };
    let transformController: TransformController;
    let viewportInteraction: ViewportInteractionController;
    let selectionOutlineRenderer: SelectionOutlineRenderer;
    let textureEditor: TextureEditorController;
    
    const raycaster = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    
    let animationTimeline: KeyframeTimelineController | null = null;
    let animationVideoRendering = false;
    const viewportCapture = new ViewportCaptureController({
      renderer,
      scene,
      camera,
      gridGroup,
      axes,
      ...viewportCaptureElementsFromDocument(),
      setCaptureResolutionMode,
      renderFrame: () => renderViewportFrame(),
      renderAnimationFrame: frame => animationTimeline?.seekToFrame(frame, true),
      onAnimationRenderStart: () => {
        animationVideoRendering = true;
        animationTimeline?.pause();
      },
      onAnimationRenderStop: () => {
        animationVideoRendering = false;
        animationTimeline?.pause();
      },
    });
    const vertexGeo = new THREE.SphereGeometry(0.012, 8, 8);
    
    // --- N-D state ---
    let N = MAX_N;
    let X = new Float32Array();
    let E = new Uint32Array();
    let M = 0;
    let rot = new RotND(N);
    let projector = new NDProjector(N, rot.matrix, canonicalP(N));
    let Y = new Float32Array();
    let dataSource: DataSource = 'primitive';
    const edgesFallback = new Uint32Array([0, 0]);
    const tmpVec = new THREE.Vector3();
    const tmpN = new Float32Array(32);
    const tmpCenter = new THREE.Vector3();
    let setViewMode: (mode: ViewMode) => void;
    
    let baseLabel = 'Hypercube';
    const BASE_SELECTION = -1;
    const NO_SELECTION = -2;
    const LIGHT_SELECTION_BASE = -1000;
    const baseTransform = { pos: new THREE.Vector3(), rot: new THREE.Vector3(), scale: new THREE.Vector3(1,1,1) };
    let baseOrigin: ObjectOrigin = new Float32Array(MAX_N);
    let baseOriginalN = 0;
    let baseAxisMap: AxisMap = Array.from({ length: MAX_N }, (_, i) => i);
    let baseVisible = true;
    let baseSurface: SurfaceState = cloneSurface(DEFAULT_SURFACE);
    let baseMaterialId = 'mat_1';
    let baseCellTopology: CellTopology | undefined;
    let baseSurfaceTopology: PrimitiveSurfaceTopology | undefined;
    keyboardCamera = new KeyboardCameraController({
      camera,
      controls,
      defaultCameraPosition: DEFAULT_CAMERA_POSITION,
      worldUp,
      isTransformActive: () => transformController?.isActive() ?? false,
      onCameraChange: () => {
        updateAxisGizmo();
        requestSceneUrlUpdate();
      },
    });
    sceneLightService = new SceneLightService({
      scene,
      renderer,
      camera,
      controls,
      raycaster,
      ndc,
      lightSelectionBase: LIGHT_SELECTION_BASE,
      noSelection: NO_SELECTION,
      getRenderQuality: () => renderRuntime.renderQuality,
      getEditMode: () => PARAMS.editMode,
      getSelectedItems: () => selectionService?.items ?? [],
      getSelectedLightId: () => selectionService?.lightId ?? '',
      setSelectedLightId: id => selectionService?.setLightId(id),
      clearSelection: () => selectionService?.clear(),
      repairSelectionAfterLightRemoval: removedSelection => selectionService?.repairAfterLightRemoval(removedSelection),
      selectObject: (idx, additive) => selectObject(idx, additive),
      setSceneControlTab: tab => setSceneControlTab(tab),
      isTransformActive: () => transformController?.isActive() ?? false,
      isTransformGizmoDragging: () => transformController?.isGizmoDragging() ?? false,
      pushUndoSnapshot,
      runImmediateOperation: (kind, scope, commit) => {
        if (viewportInteraction) viewportInteraction.runImmediateOperation(kind, scope, commit);
        else commit();
      },
      requestSceneUrlUpdate,
      updateObjectList,
      updateSelectionOutline,
      updateTransformActionButtons,
    });
    function createSceneLightId() {
      return sceneLightService.createId();
    }
    
    function setSceneLights(states: SceneLightState[]) {
      sceneLightService.setLights(states);
    }
    
    function selectedSceneLightRuntime() {
      return sceneLightService?.selectedRuntime() ?? null;
    }
    
    function lightSelectionIndex(lightIndex: number) {
      return sceneLightService.lightSelectionIndex(lightIndex);
    }
    
    function isLightSelectionIndex(idx: number) {
      return sceneLightService?.isLightSelectionIndex(idx) ?? false;
    }
    
    function sceneLightIndexFromSelection(idx: number) {
      return sceneLightService?.indexFromSelection(idx) ?? -1;
    }
    
    function sceneLightRuntimeForSelection(idx: number) {
      return sceneLightService?.runtimeForSelection(idx) ?? null;
    }
    
    function selectedSceneLightSelectionIndex() {
      return sceneLightService?.selectedSelectionIndex() ?? NO_SELECTION;
    }
    
    function isGeometrySelectionIndex(idx: number) {
      return selectionService?.isGeometrySelectionIndex(idx) ?? sceneObjectStore.isGeometrySelectionIndex(idx);
    }
    
    function getLightPositionForSelection(idx: number) {
      return sceneLightService.getPositionForSelection(idx);
    }
    
    function setLightPositionForSelection(idx: number, position: THREE.Vector3) {
      sceneLightService.setPositionForSelection(idx, position);
    }

    function createSceneLightDragOperation(ev: PointerEvent) {
      return sceneLightService.createDragOperation(ev);
    }
    
    function objectMaterialId(idx: number) {
      return sceneObjectStore.objectMaterialId(idx);
    }
    
    function captureSceneUrlState(sceneNameOverride?: string): PackedSceneUrlState {
      return sceneStateService.captureUrlState(sceneNameOverride);
    }
    
    async function initializeSceneUrlState(loadDefault = false) {
      await sceneStateService.initializeFromUrlOrDefault(loadDefault);
    }
    
    async function saveSceneStateFile(sceneSaveButton: HTMLButtonElement | null) {
      await sceneStateService.saveFile(sceneSaveButton);
    }
    
    async function loadSceneStateFile(file: File | null | undefined) {
      return sceneStateService.loadFile(file);
    }
    
    function captureSnapshot(): SceneSnapshot<PrimitiveMode> {
      sceneMaterialService.reconcile();
      return {
        N,
        X: new Float32Array(X),
        E: new Uint32Array(E),
        cellTopology: cloneCellTopology(baseCellTopology),
        surfaceTopology: clonePrimitiveSurfaceTopology(baseSurfaceTopology),
        M,
        source: dataSource,
        label: baseLabel,
        paramsN: PARAMS.N,
        primitive: PARAMS.primitive,
        rotMatrix: new Float32Array(rot.matrix),
        axes: { x: PARAMS.axesX, y: PARAMS.axesY, z: PARAMS.axesZ },
        axesOrder: [...axisController.axesOrder],
        axesOffset: axisController.axesOffset,
        baseAxisMap: [...baseAxisMap],
        baseTransform: cloneTransformState(baseTransform),
        baseOrigin: new Float32Array(baseOrigin),
        baseOrigN: baseOriginalN,
        baseVisible,
        materials: sceneMaterialService.materialsSnapshot(),
        baseMaterialId,
        baseSurface: cloneSurface(baseSurface),
        selectedInstance: selectionService.primary,
        selectedInstances: [...selectionService.items],
        instances: extraInstances.map(inst => ({
          X: new Float32Array(inst.X),
          E: new Uint32Array(inst.E),
          cellTopology: cloneCellTopology(inst.cellTopology),
          surfaceTopology: clonePrimitiveSurfaceTopology(inst.surfaceTopology),
          M: inst.M,
          offset: inst.offset.clone(),
          label: inst.label,
          kind: inst.kind,
          transform: cloneTransformState(inst.transform),
          origin: new Float32Array(inst.origin),
          originalN: inst.originalN,
          axisMap: [...inst.axisMap],
          visible: inst.visible,
          materialId: inst.materialId,
          surface: cloneSurface(inst.surface),
        })),
        lights: sceneLightService.getLightStates(),
      };
    }
    
    function estimateUndoSnapshotBytes() {
      let bytes = 0;
      bytes += X.byteLength + E.byteLength + Y.byteLength + rot.matrix.byteLength;
      bytes += baseOrigin.byteLength;
      bytes += byteLengthOfCellTopology(baseCellTopology);
      bytes += byteLengthOfSurfaceTopology(baseSurfaceTopology);
      for (const inst of extraInstances) {
        bytes += inst.X.byteLength + inst.Y.byteLength + inst.E.byteLength + inst.origin.byteLength;
        bytes += byteLengthOfCellTopology(inst.cellTopology);
        bytes += byteLengthOfSurfaceTopology(inst.surfaceTopology);
      }
      // Undo snapshots are URL-packed, so binary payloads expand into base64 strings.
      return Math.ceil(bytes * 4 / 3);
    }
    
    function pushUndoSnapshot() {
      sceneStateService.pushUndoSnapshot();
    }
    
    function undoSceneSnapshot() {
      sceneStateService.undo();
    }
    
    function redoSceneSnapshot() {
      sceneStateService.redo();
    }
    
    function applySnapshot(snap: SceneSnapshot<PrimitiveMode>) {
      PARAMS.N = snap.paramsN;
      PARAMS.primitive = snap.primitive;
      rebuildState(snap.N, snap.X, snap.E, snap.source, snap.baseOrigN, snap.baseAxisMap, snap.surfaceTopology, snap.cellTopology);
      if (snap.materials?.length) {
        sceneMaterialService.setMaterials(snap.materials);
      } else {
        const derived = sceneMaterialService.deriveMaterialsFromSurfaces(
          { surface: snap.baseSurface, materialId: snap.baseMaterialId },
          snap.instances.map(instance => ({ surface: instance.surface, materialId: instance.materialId })),
        );
        snap.baseMaterialId = derived.baseMaterialId;
        snap.instances.forEach((instance, idx) => {
          instance.materialId = derived.instanceMaterialIds[idx];
        });
      }
      if (snap.rotMatrix.length === rot.matrix.length) rot.matrix.set(snap.rotMatrix);
      baseLabel = snap.label;
      PARAMS.axesX = snap.axes.x; PARAMS.axesY = snap.axes.y; PARAMS.axesZ = snap.axes.z;
      axisController.setAxisOrder(snap.axesOrder);
      axisController.axesOffset = snap.axesOffset;
      baseTransform.pos.copy(snap.baseTransform.pos);
      baseTransform.rot.copy(snap.baseTransform.rot);
      baseTransform.scale.copy(snap.baseTransform.scale);
      baseOrigin = cloneObjectOrigin(snap.baseOrigin, X, M, MAX_N);
      baseVisible = snap.baseVisible;
      baseMaterialId = snap.baseMaterialId || sceneMaterialService.defaultMaterialId() || baseMaterialId;
      baseSurface = sceneMaterialService.surfaceForMaterialOrFallback(baseMaterialId, snap.baseSurface);
      rendererND.setSurface(baseSurface);
      extraInstances.push(...snap.instances.map(restoreInstanceSnapshot));
      sceneMaterialService.reconcile();
      if (M > 0) sceneMaterialService.setObjectMaterialId(BASE_SELECTION, baseMaterialId);
      extraInstances.forEach((inst, idx) => sceneMaterialService.setObjectMaterialId(idx, inst.materialId));
      setSceneLights(snap.lights ?? []);
      selectionService.setSnapshot(snap.selectedInstance, snap.selectedInstances ?? [snap.selectedInstance]);
      reconcileSelection();
      projectAndRenderAll();
      updateDimensionControl();
      updateObjectList();
      selectObject(selectionService.primary, selectionService.primary !== NO_SELECTION);
      requestSceneUrlUpdate();
    }
    
    function getObjectVisible(idx: number) {
      return selectionService?.getObjectVisible(idx) ?? sceneObjectStore.getObjectVisible(idx);
    }
    
    function normalizeSelectionIndex(idx: number) {
      return selectionService?.normalizeSelectionIndex(idx) ?? sceneObjectStore.normalizeSelectionIndex(idx);
    }
    
    function isSelectableObject(idx: number) {
      return selectionService?.isSelectableObject(idx) ?? (sceneObjectStore.isSelectableObject(idx) && getObjectVisible(idx));
    }
    
    function reconcileSelection() {
      selectionService.reconcile();
    }
    
    function setObjectVisible(idx: number, visible: boolean, recordUndo = true) {
      if (recordUndo && getObjectVisible(idx) !== visible) pushUndoSnapshot();
    
      const runtime = sceneLightRuntimeForSelection(idx);
      if (runtime) {
        if (runtime) runtime.state.visible = visible;
      } else {
        sceneObjectService.setGeometryVisible(idx, visible);
      }
    
      applyObjectVisibility();
      if (!visible && selectionService.items.includes(idx)) {
        removeSelectionOutlines();
        transformController.clearSelectionVisuals();
      }
      reconcileSelection();
      selectObject(selectionService.primary, selectionService.primary !== NO_SELECTION);
      sceneLightService.syncPanel();
      requestSceneUrlUpdate();
    }
    
    function applyObjectVisibility() {
      rendererND.group.visible = M > 0 && baseVisible;
      extraInstances.forEach(inst => {
        inst.renderer.group.visible = inst.visible;
      });
    }
    
    function renameObject(idx: number, value: string) {
      const label = value.trim();
      if (!label) {
        updateObjectList();
        return;
      }
    
      const lightRuntime = sceneLightRuntimeForSelection(idx);
      const current = idx === -1 ? baseLabel : (lightRuntime?.state.label ?? extraInstances[idx]?.label);
      if (!current || current === label) {
        updateObjectList();
        return;
      }
    
      pushUndoSnapshot();
      if (lightRuntime) {
        lightRuntime.state.label = label;
        selectionService.setLightId(lightRuntime.state.id);
        sceneLightService.syncPanel();
      } else {
        sceneObjectService.renameGeometryObject(idx, label);
      }
      updateObjectList();
      textureEditor.updatePanel();
      requestSceneUrlUpdate();
    }
    
    function updateObjectList() {
      objectListController.update();
    }
    
    textureEditor = new TextureEditorController({
      renderer,
      getSurfaceTarget: () => sceneMaterialService.getTextureMaterialTarget(),
      applySurfaceToTarget: (surface, recordUndo) => sceneMaterialService.applySurfaceToSelectionMaterial(surface, recordUndo),
      assignMaterialToTarget: (materialId, recordUndo) => sceneMaterialService.assignMaterialToSelection(materialId, recordUndo),
      renameMaterial: (materialId, name, recordUndo) => sceneMaterialService.renameMaterial(materialId, name, recordUndo),
      splitMaterialForTarget: () => sceneMaterialService.splitSelectedMaterial(true),
    });
    
    function selectObject(idx: number, additive = false) {
      selectionService.selectObject(idx, additive);
    }
    
    function removeSelectionOutlines() {
      selectionOutlineRenderer.clear();
    }

    function updateSelectionOutline() {
      selectionOutlineRenderer.update();
    }
    
    function clearAxisGuide() {
      transformController.clearAxisGuide();
    }
    
    function updateAxisGuide() {
      transformController.updateAxisGuide();
    }
    
    function updateVertexCloud(instIdx: number) {
      selectionService?.clampActiveDimension();
      transformController.updateVertexCloud(instIdx);
    }
    
    function placeVertexMarker(instIdx: number, vertexIdx: number) {
      transformController.placeVertexMarker(instIdx, vertexIdx);
    }
    
    function getObjectOrigin(idx: number) {
      if (idx === BASE_SELECTION) return M > 0 ? baseOrigin : null;
      return extraInstances[idx]?.origin ?? null;
    }
    
    function getObjectOriginWorldPosition(idx: number, target = new THREE.Vector3()) {
      if (idx === BASE_SELECTION && M > 0 && baseVisible) return target.copy(rendererND.originPosition);
      const lightRuntime = sceneLightRuntimeForSelection(idx);
      if (lightRuntime?.state.visible) return target.copy(lightRuntime.state.position);
      const inst = extraInstances[idx];
      if (!inst || !inst.visible) return null;
      return target.copy(inst.renderer.originPosition);
    }
    
    function duplicateLabel(label: string) {
      return `${label || 'Object'} copy`;
    }
    
    function instanceSnapshotForSelection(idx: number): InstanceSnapshot | null {
      return sceneObjectService.captureInstanceSnapshot(idx, duplicateLabel);
    }
    
    function moveObjectOriginToWorldPosition(idx: number, position: THREE.Vector3) {
      const lightRuntime = sceneLightRuntimeForSelection(idx);
      if (lightRuntime) {
        const delta = position.clone().sub(lightRuntime.state.position);
        lightRuntime.state.position.copy(position);
        if (lightRuntime.state.kind === 'directional') lightRuntime.state.target.add(delta);
        sceneLightService.syncRuntimes();
        return true;
      }
    
      return sceneObjectService.moveGeometryOriginToWorldPosition(idx, position, getObjectOriginWorldPosition(idx));
    }
    
    function recalculateObjectOrigin(idx: number) {
      const origin = getObjectOrigin(idx);
      if (!origin) return;
    
      pushUndoSnapshot();
      if (!sceneObjectService.recalculateGeometryOrigin(idx)) return;
      projectAndRenderAll();
      updateSelectionOutline();
      requestSceneUrlUpdate();
    }
    
    function focusObjectOrigin(idx: number) {
      const origin = getObjectOriginWorldPosition(idx, tmpVec);
      if (!origin) return;
      keyboardCamera.focusOn(origin);
    }
    
    function selectedProductObjects() {
      return selectionService.selectedGeometryObjects();
    }
    
    function canAddProductMesh() {
      return selectedProductObjects().length >= 2;
    }
    
    function getObjectProductFactor(idx: number): ProductMeshFactor | null {
      return sceneObjectService.getProductFactor(idx, visibleDims());
    }
    
    function getObjectSurface(idx: number) {
      return idx === BASE_SELECTION ? baseSurface : extraInstances[idx]?.surface;
    }
    
    function getObjectTransform(idx: number) {
      return sceneObjectService.getObjectTransform(idx);
    }
    
    function addProductMeshFromSelection() {
      const selected = selectedProductObjects();
      if (selected.length < 2) return;
    
      const factors = selected.map(getObjectProductFactor);
      if (factors.some(factor => !factor)) {
        window.alert('Product mesh requires valid selected geometry.');
        return;
      }
    
      const parentIdx = selected[0];
      const parentMaterialId = objectMaterialId(parentIdx) || sceneMaterialService.defaultMaterialId();
      const parentTransform = getObjectTransform(parentIdx);
    
      pushUndoSnapshot();
      try {
        sceneObjectService.addProductMeshFromSelection(selected, parentMaterialId, parentTransform, visibleDims());
      } catch (err) {
        window.alert(err instanceof Error ? err.message : 'Unable to build product mesh.');
      }
    }
    
    function deleteSelected() {
      const deleteIndices = selectionService.items.filter(idx => idx >= 0).sort((a, b) => b - a);
      const deleteLightIndices = selectionService.items
        .map(sceneLightIndexFromSelection)
        .filter((idx, position, arr) => idx >= 0 && arr.indexOf(idx) === position)
        .sort((a, b) => b - a);
      if (!deleteIndices.length && !deleteLightIndices.length) return;
      const keepBaseSelected = selectionService.items.includes(BASE_SELECTION) && getObjectVisible(BASE_SELECTION);
      pushUndoSnapshot();
      removeSelectionOutlines();
      sceneObjectService.deleteGeometryObjects(deleteIndices);
      for (const idx of deleteLightIndices) {
        const runtime = sceneLightService.getLights()[idx];
        if (!runtime) continue;
        sceneLightService.removeRuntime(runtime);
      }
      if (deleteLightIndices.length) sceneLightService.ensureSelectedId();
      if (keepBaseSelected) selectionService.setSnapshot(BASE_SELECTION, [BASE_SELECTION]);
      else selectionService.clear();
      sceneMaterialService.reconcile();
      projectAndRenderAll();
      sceneLightService.syncPanel();
      updateObjectList();
      selectObject(selectionService.primary);
      requestSceneUrlUpdate();
    }
    
    function deleteSelectedEditCell() {
      if (!PARAMS.editMode || !getObjectVisible(selectionService.primary)) return;
      const selection = transformController.getEditSelection();
      if (!selection || selection.cellId < 0) return;
    
      const targetIsBase = selectionService.primary === BASE_SELECTION;
      const target = targetIsBase ? null : extraInstances[selectionService.primary];
      const topology = targetIsBase ? baseCellTopology : target?.cellTopology;
      const vertexCount = targetIsBase ? M : (target?.M ?? 0);
      const deletion = deleteCellAndPrune(topology, selection.dimension, selection.cellId, vertexCount);
      if (!deletion) return;
    
      pushUndoSnapshot();
      transformController.clearSelectionVisuals();
      removeSelectionOutlines();
    
      if (targetIsBase) {
        X = compactDimensionMajorVertices(X, M, deletion.vertexCount, deletion.vertexMap);
        M = deletion.vertexCount;
        Y = new Float32Array(3 * M);
        E = new Uint32Array(deletion.edges);
        baseCellTopology = deletion.topology;
        baseSurfaceTopology = surfaceTopologyForEditedCellTopology(baseCellTopology);
        if (M > 0) {
          renderSync.rebuildBaseRenderer();
        } else {
          baseVisible = false;
          baseOrigin = new Float32Array(MAX_N);
          rendererND.dispose?.();
          selectionService.clear();
        }
      } else if (target) {
        target.X = compactDimensionMajorVertices(target.X, target.M, deletion.vertexCount, deletion.vertexMap);
        target.M = deletion.vertexCount;
        target.Y = new Float32Array(3 * target.M);
        target.E = new Uint32Array(deletion.edges);
        target.cellTopology = deletion.topology;
        target.surfaceTopology = surfaceTopologyForEditedCellTopology(target.cellTopology);
        if (target.M > 0) {
          renderSync.rebuildInstanceRenderer(target);
        } else {
          target.renderer.destroy();
          extraInstances.splice(selectionService.primary, 1);
          selectionService.clear();
        }
      }
    
      reconcileSelection();
      sceneMaterialService.reconcile();
      renderSync.refreshAfterGeometryChange(selectionService.primary);
    }
    
    function selectedGeometryDimension() {
      if (!isGeometrySelectionIndex(selectionService.primary)) return 0;
      if (selectionService.primary === BASE_SELECTION) return baseOriginalN || PARAMS.N;
      return extraInstances[selectionService.primary]?.originalN ?? 0;
    }
    
    const extraInstances: Instance[] = [];
    sceneObjectStore = new SceneObjectStore<SceneLightRuntime>({
      baseSelection: BASE_SELECTION,
      noSelection: NO_SELECTION,
      lightSelectionBase: LIGHT_SELECTION_BASE,
      getBase: () => ({
        M,
        label: baseLabel,
        originalN: baseOriginalN,
        paramsN: PARAMS.N,
        visible: baseVisible,
        materialId: baseMaterialId,
      }),
      getInstances: () => extraInstances,
      getLights: () => sceneLightService.getLights(),
    });
    sceneMaterialService = new SceneMaterialService({
      baseSelection: BASE_SELECTION,
      getBase: () => ({
        M,
        materialId: baseMaterialId,
        surface: baseSurface,
      }),
      setBaseMaterialId: materialId => {
        baseMaterialId = materialId;
      },
      getInstances: () => extraInstances,
      getSelectedIndex: () => selectionService.primary,
      isGeometrySelectionIndex,
      isSelectableObject,
      objectMaterialId,
      objectLabel: idx => sceneObjectStore.objectLabel(idx),
      materialUsageRows: materialId => sceneObjectStore.materialUsageRows(materialId),
      referencedMaterialIds: () => sceneObjectStore.referencedMaterialIds(),
      applyMaterialToObject: (idx, material) => {
        if (idx === BASE_SELECTION) {
          baseMaterialId = material.id;
          baseSurface = cloneSurface(material.surface);
          rendererND.setSurface(baseSurface);
          rendererND.refreshSurface();
          return true;
        }
    
        const inst = extraInstances[idx];
        if (!inst) return false;
        inst.materialId = material.id;
        inst.surface = cloneSurface(material.surface);
        inst.renderer.setSurface(inst.surface);
        inst.renderer.refreshSurface();
        return true;
      },
      pushUndoSnapshot,
      updateObjectList,
      updateTexturePanel: () => textureEditor.updatePanel(),
      requestSceneUrlUpdate,
    });
    sceneObjectService = new SceneObjectService({
      scene,
      instances: extraInstances,
      materialService: sceneMaterialService,
      getProjector: () => projector,
      getRenderMode: () => PARAMS.renderMode,
      getPrimitiveKind: () => PARAMS.primitive,
      getPrimitiveDimension: () => PARAMS.N,
      currentAxisMap,
      getBaseInstanceData: () => {
        if (M <= 0 || !baseVisible) return null;
        return {
          verts: new Float32Array(X),
          edges: new Uint32Array(E),
          cellTopology: cloneCellTopology(baseCellTopology),
          surfaceTopology: clonePrimitiveSurfaceTopology(baseSurfaceTopology),
          V: M,
          kind: PARAMS.primitive,
          axisMap: [...baseAxisMap],
          originalN: baseOriginalN || PARAMS.N,
          origin: new Float32Array(baseOrigin),
        };
      },
      getBaseLabel: () => baseLabel,
      setBaseLabel: label => {
        baseLabel = label;
      },
      getBaseTransform: () => baseTransform,
      getBaseVisible: () => baseVisible,
      setBaseVisible: visible => {
        baseVisible = visible;
      },
      getBaseSurface: () => baseSurface,
      getBaseOriginWorldPosition: () => (M > 0 && baseVisible ? rendererND.originPosition.clone() : null),
      recalculateBaseOrigin: () => {
        if (M <= 0) return false;
        computeObjectOrigin(X, M, MAX_N, baseOrigin);
        return true;
      },
      getBaseMaterialId: () => baseMaterialId,
      defaultMaterialName: 'Material 1',
      pushUndoSnapshot,
      projectAndRenderAll,
      setViewMode: mode => setViewMode?.(mode),
      updateObjectList,
      requestSceneUrlUpdate,
      clearSelection: () => selectionService.clear(),
      clearSelectionOutlines: removeSelectionOutlines,
      updateSelectionOutline,
    });
    const objectListController = new ObjectListController({
      getRows: () => sceneObjectStore.objectRows(),
      getSelectedIndex: () => selectionService.primary,
      getSelectedIndices: () => selectionService.items,
      onSelect: (idx, additive) => selectObject(idx, additive),
      onToggleVisibility: (idx, visible) => setObjectVisible(idx, visible),
      onRename: (idx, value) => renameObject(idx, value),
      onAfterUpdate: () => updateAxisLegend(),
    });
    
    function restoreInstanceSnapshot(snap: InstanceSnapshot): Instance {
      return sceneObjectService.restoreInstanceSnapshot(snap);
    }
    
    const rendererND = new HypercubeRenderer(scene);
    if (M > 0) {
      rendererND.build(M, E, baseSurfaceTopology, baseCellTopology);
      rendererND.setMode('solid');
    }
    selectionOutlineRenderer = new SelectionOutlineRenderer({
      scene,
      getEditMode: () => PARAMS.editMode,
      getSelectionItems: () => selectionService?.items ?? [],
      getObjectVisible,
      getSelectionGeometry: idx => {
        if (idx === BASE_SELECTION) return M > 0 ? rendererND.line.geometry : null;
        return extraInstances[idx]?.renderer.line.geometry ?? null;
      },
      reconcileSelection: () => selectionService?.reconcile(),
    });
    
    // --- UI state ---
    const PARAMS = {
      N: 4,
      primitive: 'hypercube' as PrimitiveMode,
      renderMode: 'solid' as ViewMode,
      editMode: false,
      axesX: 0,
      axesY: 1,
      axesZ: 2,
      bloomIntensity: DEFAULT_BLOOM_INTENSITY,
      motionBlurIntensity: DEFAULT_MOTION_BLUR_INTENSITY,
      colorHue: DEFAULT_COLOR_HUE,
      colorSaturation: DEFAULT_COLOR_SATURATION,
      colorBrightness: DEFAULT_COLOR_BRIGHTNESS,
      colorContrast: DEFAULT_COLOR_CONTRAST,
      grainIntensity: DEFAULT_GRAIN_INTENSITY,
      antialiasMode: DEFAULT_ANTIALIAS_MODE as AntialiasMode,
    };
    
    const renderEffects = new RenderEffectsController(
      PARAMS,
      { bloomPass, afterimagePass, colorGradePass, smaaPass, grainPass },
      renderEffectsElementsFromDocument(),
      requestSceneUrlUpdate,
    );
    
    function captureAnimationState(): AnimationKeyframeState {
      return {
        dimension: N,
        rotMatrix: new Float32Array(rot.matrix),
        axesOrder: completeAxisOrder(axisController.axesOrder),
        axesOffset: axisController.axesOffset,
        renderMode: PARAMS.renderMode,
        bloomIntensity: PARAMS.bloomIntensity,
        motionBlurIntensity: PARAMS.motionBlurIntensity,
        colorHue: PARAMS.colorHue,
        colorSaturation: PARAMS.colorSaturation,
        colorBrightness: PARAMS.colorBrightness,
        colorContrast: PARAMS.colorContrast,
        grainIntensity: PARAMS.grainIntensity,
        antialiasMode: PARAMS.antialiasMode,
        cameraPosition: camera.position.clone(),
        cameraTarget: controls.target.clone(),
        cameraUp: camera.up.clone(),
        cameraFov: camera.fov,
        cameraZoom: camera.zoom,
        lights: sceneLightService.getLightStates(),
      };
    }
    
    function syncProjectionAxesFromOrder() {
      const nVis = axisController.visibleDims();
      if (nVis <= 0) return;
      axisController.axesOffset = (((axisController.axesOffset % nVis) + nVis) % nVis);
      PARAMS.axesX = axisController.axesOrder[axisController.axesOffset % nVis] ?? 0;
      PARAMS.axesY = axisController.axesOrder[(axisController.axesOffset + 1) % nVis] ?? 1;
      PARAMS.axesZ = axisController.axesOrder[(axisController.axesOffset + 2) % nVis] ?? 2;
    }
    
    function applyAnimationState(state: AnimationKeyframeState) {
      if (state.dimension === N && state.rotMatrix.length === rot.matrix.length) {
        rot.matrix.set(state.rotMatrix);
      }
    
      axisController.setAxisOrder(completeAxisOrder(state.axesOrder));
      axisController.axesOffset = state.axesOffset;
      syncProjectionAxesFromOrder();
    
      PARAMS.bloomIntensity = state.bloomIntensity;
      PARAMS.motionBlurIntensity = state.motionBlurIntensity;
      PARAMS.colorHue = state.colorHue;
      PARAMS.colorSaturation = state.colorSaturation;
      PARAMS.colorBrightness = state.colorBrightness;
      PARAMS.colorContrast = state.colorContrast;
      PARAMS.grainIntensity = state.grainIntensity;
      PARAMS.antialiasMode = state.antialiasMode;
      renderEffects.sync();
      sceneLightService.applyAnimationLights(state.lights);
    
      if (PARAMS.renderMode !== state.renderMode) setViewMode(state.renderMode);
    
      camera.position.copy(state.cameraPosition);
      camera.up.copy(state.cameraUp);
      camera.fov = state.cameraFov;
      camera.zoom = state.cameraZoom;
      camera.updateProjectionMatrix();
      controls.target.copy(state.cameraTarget);
      controls.update();
    
      updateAxisLegend();
      renderAxisList();
      projectAndRenderAll();
    }
    
    function renderViewportFrame() {
      renderRuntime.renderFrame({
        projectIfDirty,
        updateScreenSpaceMarkers: () => transformController.updateScreenSpaceMarkerScales(),
        updateSceneLightMarkers: () => sceneLightService.updateScreenSpaceMarkers(),
        updateAxisGizmo,
        hasEffects: () => renderEffects.hasEffects(),
        recordFrame: recordPerfFrame,
      });
    }
    
    transformController = new TransformController({
      scene,
      camera,
      renderer,
      raycaster,
      ndc,
      vertexGeo,
      ...viewportActionControls.transformButtonElements(),
      getParams: () => PARAMS,
      getN: () => N,
      getX: () => X,
      getM: () => M,
      getY: () => Y,
      getRot: () => rot,
      getProjector: () => projector,
      getRendererND: () => rendererND,
      getExtraInstances: () => extraInstances,
      getBaseTransform: () => baseTransform,
      getObjectOrigin,
      getBaseOriginalN: () => baseOriginalN,
      getBaseAxisMap: () => baseAxisMap,
      getSelectedInstance: () => selectionService.primary,
      getSelectedInstances: () => selectionService.items,
      getObjectVisible,
      isLightSelection: isLightSelectionIndex,
      getLightPosition: getLightPositionForSelection,
      setLightPosition: setLightPositionForSelection,
      visibleDims,
      perspectiveDimsFor,
      primaryExtraRotationDepthDim: (localN, axisMap) => axisController.primaryExtraRotationDepthDim(localN, axisMap),
      extraRotationPlaneAxis,
      projectAndRenderAll,
      updateSelectionOutline,
      pushUndoSnapshot,
      onEditSelectionChange: () => updateTransformActionButtons(),
      onStateChange: () => requestSceneUrlUpdate(),
    });
    selectionService = new SceneSelectionService<SceneLightRuntime>({
      baseSelection: BASE_SELECTION,
      noSelection: NO_SELECTION,
      getObjectStore: () => sceneObjectStore,
      getLights: () => sceneLightService.getLights(),
      getEditMode: () => PARAMS.editMode,
      getBaseRenderer: () => rendererND,
      getInstanceRenderer: idx => extraInstances[idx]?.renderer,
      getBaseVertexCount: () => M,
      getBaseObjectDimension: () => baseOriginalN || visibleDims(),
      getInstanceObjectDimension: idx => extraInstances[idx]?.originalN ?? 0,
      getTransformController: () => transformController ?? null,
      setSceneControlTab,
      applySceneBackground: () => backgroundController.applySceneBackground(PARAMS.editMode),
      updateObjectList,
      updateSelectionOutline,
      updateVertexCloud,
      syncSceneLightPanel: () => sceneLightService.syncPanel(),
      updateTexturePanel: () => textureEditor.updatePanel(),
      updateTransformActionButtons,
      requestSceneUrlUpdate,
    });
    axisController = new AxisGizmoController({
      camera,
      controls,
      worldUp,
      axesHelper: axes,
      getParams: () => PARAMS,
      getN: () => N,
      getRot: () => rot,
      clearAxisGuide,
      projectAndRenderAll,
      markProjectionDirty,
      applySceneBackground: () => backgroundController.applySceneBackground(PARAMS.editMode),
      setPaneCollapsed: collapsed => paneController.setCollapsed(collapsed),
      getPaneCollapsed: () => paneController.isCollapsed,
      onStateChange: () => {
        markProjectionDirty();
        requestSceneUrlUpdate();
      },
    });
    axisController.init();
    sceneStateService = new SceneStateService({
      params: PARAMS,
      camera,
      controls,
      worldUp,
      defaultCameraPosition: DEFAULT_CAMERA_POSITION,
      maxUndoSnapshotBytes: MAX_UNDO_SNAPSHOT_BYTES,
      noSelection: NO_SELECTION,
      defaults: {
        bloomIntensity: DEFAULT_BLOOM_INTENSITY,
        motionBlurIntensity: DEFAULT_MOTION_BLUR_INTENSITY,
        colorHue: DEFAULT_COLOR_HUE,
        colorSaturation: DEFAULT_COLOR_SATURATION,
        colorBrightness: DEFAULT_COLOR_BRIGHTNESS,
        colorContrast: DEFAULT_COLOR_CONTRAST,
        grainIntensity: DEFAULT_GRAIN_INTENSITY,
      },
      createMaterialId: () => sceneMaterialService.createMaterialId(),
      createSceneLightId,
      captureSnapshot,
      applySnapshot,
      estimateUndoSnapshotBytes,
      getLights: () => sceneLightService.getLightStates(),
      getTimeline: () => animationTimeline,
      backgroundController,
      renderEffects,
      paneController,
      welcomeSplashController,
      axisController,
      transformController,
      selectionService,
      isGeometrySelectionIndex,
      getObjectVisible,
      setViewMode: mode => setViewMode(mode),
      setEditMode,
      updateAxisGizmo,
      projectAndRenderAll,
      updateAxisLegend,
      renderAxisList,
      updateObjectList,
      updateSelectionOutline,
      updateTexturePanel: () => textureEditor.updatePanel(),
      updateVertexCloud,
      placeVertexMarker,
    });
    projectionPipeline = new ProjectionPipeline({
      getN: () => N,
      getX: () => X,
      getM: () => M,
      getY: () => Y,
      getRot: () => rot,
      getProjector: () => projector,
      getParams: () => PARAMS,
      getRendererND: () => rendererND,
      getExtraInstances: () => extraInstances,
      getBaseTransform: () => baseTransform,
      getBaseOrigin: () => baseOrigin,
      getBaseOriginalN: () => baseOriginalN,
      getBaseAxisMap: () => baseAxisMap,
      visibleDims,
      perspectiveDimsFor,
      applyObjectVisibility,
      updateSelectionOutline,
      updateVertexCloud: () => updateVertexCloud(selectionService.primary),
      updateAxisGuide,
      tmpN,
      tmpVec,
      tmpCenter,
    });
    
    renderSync = new RenderSyncService({
      getRenderMode: () => PARAMS.renderMode,
      getEditMode: () => PARAMS.editMode,
      getBaseRenderer: () => rendererND,
      getBaseGeometry: () => ({
        M,
        E,
        surfaceTopology: baseSurfaceTopology,
        cellTopology: baseCellTopology,
        surface: baseSurface,
      }),
      getInstance: idx => extraInstances[idx],
      getObjectVisible,
      projectAndRenderAll,
      applyObjectVisibility,
      updateObjectList,
      updateSelectionOutline,
      updateTransformActionButtons,
      updateVertexCloud,
      requestSceneUrlUpdate,
    });
    
    geometryEditService = new GeometryEditService<PackedSceneUrlState>({
      baseSelection: BASE_SELECTION,
      getBaseState: () => ({
        X,
        E,
        M,
        cellTopology: baseCellTopology,
        surfaceTopology: baseSurfaceTopology,
      }),
      setBaseState: state => {
        X = new Float32Array(state.X);
        M = state.M;
        Y = new Float32Array(3 * M);
        E = new Uint32Array(state.E);
        baseCellTopology = cloneCellTopology(state.cellTopology);
        baseSurfaceTopology = clonePrimitiveSurfaceTopology(state.surfaceTopology);
        if (M > 0) baseVisible = true;
      },
      getInstanceState: idx => {
        const target = extraInstances[idx];
        return target ? {
          X: target.X,
          E: target.E,
          M: target.M,
          cellTopology: target.cellTopology,
          surfaceTopology: target.surfaceTopology,
        } : null;
      },
      setInstanceState: (idx, state) => {
        const target = extraInstances[idx];
        if (!target) return;
        target.X = new Float32Array(state.X);
        target.M = state.M;
        target.Y = new Float32Array(3 * target.M);
        target.E = new Uint32Array(state.E);
        target.cellTopology = cloneCellTopology(state.cellTopology);
        target.surfaceTopology = clonePrimitiveSurfaceTopology(state.surfaceTopology);
      },
      getObjectVisible,
      isSceneApplying: () => sceneStateService.isApplying(),
      history: sceneStateService.history,
      renderSync,
    });
    
    duplicatePlacementFactory = new DuplicatePlacementOperationFactory<PackedSceneUrlState, Instance, SceneLightRuntime>({
      noSelection: NO_SELECTION,
      getEditMode: () => PARAMS.editMode,
      getSelectedInstance: () => selectionService.primary,
      getSelectedInstances: () => selectionService.items,
      getControlsEnabled: () => controls.enabled,
      setControlsEnabled: enabled => {
        controls.enabled = enabled;
      },
      isGeometrySelectionIndex,
      captureUndoSnapshot: captureSceneUrlState,
      pushUndoSnapshot: snapshot => sceneStateService.history.push(snapshot),
      createLightDuplicate: (idx, position) => (
        sceneLightService.duplicateFromSelection(idx, position, duplicateLabel)
      ),
      createInstanceDuplicate: (idx, position) => {
        const snapshot = instanceSnapshotForSelection(idx);
        if (!snapshot) return null;
        const instance = restoreInstanceSnapshot(snapshot);
        extraInstances.push(instance);
        const duplicateIndex = extraInstances.length - 1;
        projectAndRenderAll();
        selectObject(duplicateIndex);
        moveObjectOriginToWorldPosition(duplicateIndex, position);
        updateObjectList();
        textureEditor.updatePanel();
        return instance;
      },
      moveLightDuplicate: (runtime, position) => {
        const idx = sceneLightService.indexOf(runtime);
        if (idx >= 0) moveObjectOriginToWorldPosition(lightSelectionIndex(idx), position);
      },
      moveInstanceDuplicate: (instance, position) => {
        const idx = extraInstances.indexOf(instance);
        if (idx >= 0) moveObjectOriginToWorldPosition(idx, position);
      },
      removeLightDuplicate: runtime => {
        sceneLightService.removeRuntime(runtime);
      },
      removeInstanceDuplicate: instance => {
        const idx = extraInstances.indexOf(instance);
        if (idx >= 0) {
          instance.renderer.destroy();
          extraInstances.splice(idx, 1);
        }
      },
      restoreSelection: (primary, items) => {
        selectionService.setSnapshot(primary, items);
        const selectedLight = sceneLightRuntimeForSelection(selectionService.primary);
        if (selectedLight) selectionService.setLightId(selectedLight.state.id);
        else selectionService.ensureSelectedLightId();
      },
      refreshAfterRestoreSelection: () => {
        updateObjectList();
        updateSelectionOutline();
        sceneLightService.syncPanel();
        textureEditor.updatePanel();
        updateTransformActionButtons();
      },
      refreshAfterCommit: () => {
        updateObjectList();
        updateSelectionOutline();
        sceneLightService.syncPanel();
        textureEditor.updatePanel();
        requestSceneUrlUpdate();
      },
      projectAndRenderAll,
    });
    
    geometryEditOperationFactory = new GeometryEditOperationFactory<PackedSceneUrlState>({
      baseSelection: BASE_SELECTION,
      getSelectedInstance: () => selectionService.primary,
      getEditMode: () => PARAMS.editMode,
      isGeometrySelectionIndex,
      getObjectVisible,
      selectedGeometryDimension,
      selectedEditOperationContext: () => selectionService.selectedEditOperationContext(),
      getTargetState: idx => {
        if (idx === BASE_SELECTION) {
          return {
            X,
            E,
            M,
            cellTopology: baseCellTopology,
            surfaceTopology: baseSurfaceTopology,
          };
        }
        const target = extraInstances[idx];
        return target ? {
          X: target.X,
          E: target.E,
          M: target.M,
          cellTopology: target.cellTopology,
          surfaceTopology: target.surfaceTopology,
        } : null;
      },
      setTargetState: (idx, state) => {
        if (idx === BASE_SELECTION) {
          X = new Float32Array(state.X);
          M = state.M;
          Y = new Float32Array(3 * M);
          E = new Uint32Array(state.E);
          baseCellTopology = cloneCellTopology(state.cellTopology);
          baseSurfaceTopology = clonePrimitiveSurfaceTopology(state.surfaceTopology);
          return;
        }
        const target = extraInstances[idx];
        if (!target) return;
        target.X = new Float32Array(state.X);
        target.M = state.M;
        target.Y = new Float32Array(3 * target.M);
        target.E = new Uint32Array(state.E);
        target.cellTopology = cloneCellTopology(state.cellTopology);
        target.surfaceTopology = clonePrimitiveSurfaceTopology(state.surfaceTopology);
      },
      refreshTargetSurface: idx => {
        if (idx === BASE_SELECTION) rendererND.refreshSurface();
        else extraInstances[idx]?.renderer.refreshSurface();
      },
      captureUndoSnapshot: captureSceneUrlState,
      editService: geometryEditService,
      clearEditSelection: () => transformController.clearEditSelection(),
      setSelectedEditCells: (dimension, cellIds, topology) => transformController.setSelectedEditCells(dimension, cellIds, topology),
      setSelectedEditElement: (dimension, vertices, cellId) => transformController.setSelectedEditElement(dimension, vertices, cellId),
      updateVertexCloud,
      updateSelectionOutline,
      updateTransformActionButtons,
      rebuildGeometryRenderer: idx => renderSync.rebuildGeometryRenderer(idx),
      refreshAfterGeometryChange: (idx, options) => renderSync.refreshAfterGeometryChange(idx, options),
      projectAndRenderAll,
    });
    
    editToolbar = new EditToolbarController({
      getEditMode: () => PARAMS.editMode,
      getObjectVisible: () => getObjectVisible(selectionService.primary),
      getObjectDimension: selectedObjectDimension,
      getTopology: selectedObjectCellTopology,
      getActiveCellDimension: () => transformController.getEditCellDimension(),
      setCellDimension: setEditCellDimension,
      canStartOperation: request => geometryEditOperationFactory?.canStartOperation(request) ?? false,
      startOperation: request => viewportInteraction.startEditOperationFromLastPointer(request, true),
      getOperationLevelState: () => viewportInteraction?.getActiveEditOperationLevelState() ?? null,
      changeOperationLevel: delta => viewportInteraction?.changeActiveEditOperationLevel(delta),
    });
    
    function updateDimensionControl() {
      dimensionControl.sync();
    }
    
    function setNewPrimitiveDimension(value: number) {
      if (!Number.isFinite(value)) {
        updateDimensionControl();
        return;
      }
      const next = Math.max(3, Math.min(MAX_N, Math.round(value)));
      PARAMS.N = next;
      axisController.normalizeVisibleAxes(next);
      updateDimensionControl();
      renderAxisList();
      updateAxisLegend();
      projectAndRenderAll();
      requestSceneUrlUpdate();
    }
    
    function updateEditModeToggle() {
      viewportActionControls.syncEditMode();
    }
    
    function applyEditMode(active: boolean) {
      PARAMS.editMode = active;
      backgroundController.applySceneBackground(PARAMS.editMode);
      updateEditModeToggle();
    
      transformController.clearEditSelection();
      if (!PARAMS.editMode) {
        transformController.clearVertexCloud();
        transformController.clearFaceCenterCloud();
        transformController.clearEditWireOverlay();
      } else {
        updateVertexCloud(selectionService.primary);
      }
      updateSelectionOutline();
      updateTransformActionButtons();
      requestSceneUrlUpdate();
    }
    
    function setEditMode(active: boolean) {
      const commit = () => applyEditMode(active);
      if (viewportInteraction) viewportInteraction.runImmediateOperation('set-edit-mode', 'viewport', commit);
      else commit();
    }
    
    function updateTransformActionButtons() {
      if (transformController) transformController.updateActionButtons();
      editToolbar?.sync();
    }
    
    function hasActiveSelection() {
      return selectionService.hasActiveSelection();
    }
    
    function handleTransformConstraintKey(key: string) {
      return viewportInteraction.handleTransformConstraintKey(key);
    }
    
    function maxEditableCellDimensionForSelection() {
      return selectionService.maxEditableCellDimensionForSelection();
    }
    
    function selectedObjectDimension() {
      return selectionService.selectedObjectDimension();
    }
    
    function selectedObjectCellTopology() {
      return selectionService.selectedObjectCellTopology();
    }
    
    function setEditCellDimension(dimension: number) {
      selectionService.setEditCellDimension(dimension);
    }
    
    function selectAllEditCells() {
      selectionService.selectAllEditCells();
    }
    
    const primitiveMenuOptions: { label: string; kind: PrimitiveKind }[] = [
      { label: 'Plane', kind: 'plane' },
      { label: 'Hypercube', kind: 'hypercube' },
      { label: 'Spiked hypercube', kind: 'spikedHypercube' },
      { label: 'Cross polytope', kind: 'cross' },
      { label: 'Spiked cross polytope', kind: 'spikedCross' },
      { label: 'Simplex', kind: 'simplex' },
      { label: 'Spiked simplex', kind: 'spikedSimplex' },
      { label: 'Simplex prism', kind: 'simplexPrism' },
      { label: 'Spiked simplex prism', kind: 'spikedSimplexPrism' },
      { label: 'Demicube', kind: 'demicube' },
      { label: 'Spiked demicube', kind: 'spikedDemicube' },
      { label: '24-cell', kind: 'cell24' },
      { label: 'Spiked 24-cell', kind: 'spikedCell24' },
      { label: 'Duoprism', kind: 'duoprism' },
      { label: 'Spiked duoprism', kind: 'spikedDuoprism' },
    ];
    
    const lightMenuOptions: { label: string; kind: SceneLightKind }[] = [
      { label: 'Point light', kind: 'point' },
      { label: 'Directional light', kind: 'directional' },
    ];
    
    const insertKeyframeOperation = () => {
      const commit = () => animationTimeline?.addKeyframeAtCurrentFrame();
      if (viewportInteraction) viewportInteraction.runImmediateOperation('insert-keyframe', 'viewport', commit);
      else commit();
    };
    const removeKeyframeOperation = () => {
      const commit = () => animationTimeline?.removeLastKeyframe();
      if (viewportInteraction) viewportInteraction.runImmediateOperation('remove-keyframe', 'viewport', commit);
      else commit();
    };
    
    viewportInteraction = new ViewportInteractionController({
      renderer,
      camera,
      controls,
      raycaster,
      ndc,
      contextMenuEl: viewportContextMenuFromDocument(),
      keyboardCamera,
      transformController,
      primitiveMenuOptions,
      lightMenuOptions,
      baseSelection: BASE_SELECTION,
      noSelection: NO_SELECTION,
      getParams: () => PARAMS,
      getN: () => N,
      getX: () => X,
      getM: () => M,
      getBaseVisible: () => baseVisible,
      getSelectedInstance: () => selectionService.primary,
      getSelectedCellTopology: selectedObjectCellTopology,
      getRendererND: () => rendererND,
      getExtraInstances: () => extraInstances,
      selectObject,
      pushUndoSnapshot,
      addPrimitiveInstanceAt,
      addSceneLightAt,
      createDuplicatePlacementOperation: (position, pickPosition) => duplicatePlacementFactory.createOperation(position, pickPosition),
      createEditExtrusionOperation: mode => geometryEditOperationFactory.createExtrusionOperation(mode),
      createEditInsetOperation: mode => geometryEditOperationFactory.createInsetOperation(mode),
      createEditBevelOperation: (smoothness, kind, inward, mode, setSmoothness) => (
        geometryEditOperationFactory.createBevelOperation(smoothness, kind, inward, mode, setSmoothness)
      ),
      createEditLoopCutOperation: (cutCount, setCutCount) => (
        geometryEditOperationFactory.createLoopCutOperation(cutCount, setCutCount)
      ),
      createSceneLightDragOperation,
      insertKeyframe: insertKeyframeOperation,
      removeLastKeyframe: removeKeyframeOperation,
      deleteSelected,
      deleteSelectedEditCell,
      hasActiveSelection,
      canAddProductMesh,
      addProductMesh: addProductMeshFromSelection,
      recalculateSelectedOrigin: () => recalculateObjectOrigin(selectionService.primary),
      focusObjectOrigin,
      cycleAxes,
      onOperationStateChange: updateTransformActionButtons,
    });
    
    function createPrimitiveData(kind: PrimitiveKind, dimension: number): InstanceGeometryData {
      return sceneObjectService.createPrimitiveData(kind, dimension);
    }
    
    function insertInstance(data: InstanceGeometryData, offset: THREE.Vector3, label: string, materialId: string, syncMode = true) {
      return sceneObjectService.insertInstance(data, offset, label, materialId, syncMode);
    }
    
    function addPrimitiveInstanceAt(kind: PrimitiveKind, label: string, offset: THREE.Vector3, syncMode = true) {
      sceneObjectService.addPrimitiveInstanceAt(kind, label, offset, syncMode);
    }
    
    function addSceneLightAt(kind: SceneLightKind, position: THREE.Vector3) {
      sceneLightService.addLightAt(kind, position);
    }
    
    function clearExtraInstances() {
      sceneObjectService.clearExtraInstances();
    }
    
    function addInstanceAt(offset: THREE.Vector3, recordUndo = true) {
      sceneObjectService.addInstanceAt(offset, recordUndo);
    }
    
    function rebuildState(
      newN: number,
      newX: Float32Array,
      newE: Uint32Array,
      source: DataSource,
      localN?: number,
      axisMap?: AxisMap,
      surfaceTopology?: PrimitiveSurfaceTopology,
      cellTopology?: CellTopology,
    ) {
      axisController.clearDynamicState();
      viewportInteraction?.cancelAxisShiftDrag();
      controls.enableZoom = true;
      controls.enablePan = true;
      controls.enableRotate = true;
      controls.enabled = true;
      controls.reset();
      camera.position.copy(DEFAULT_CAMERA_POSITION);
      // ensure render mode persists
      const currentMode = PARAMS.renderMode;
      dataSource = source;
      const ambientN = MAX_N;
      N = ambientN;
      PARAMS.N = Math.min(PARAMS.N, MAX_N);
      X = new Float32Array(newX);
      E = newE.length ? new Uint32Array(newE) : edgesFallback;
      M = ambientN > 0 ? Math.floor(newX.length / ambientN) : 0;
      rot = new RotND(ambientN);
      projector = new NDProjector(ambientN, rot.matrix, canonicalP(ambientN));
      Y = new Float32Array(3 * M);
      clearExtraInstances();
      baseVisible = true;
      baseTransform.pos.set(0,0,0);
      baseTransform.rot.set(0,0,0);
      baseTransform.scale.set(1,1,1);
      baseOrigin = computeObjectOrigin(X, M, MAX_N, baseOrigin);
      baseOriginalN = localN ?? visibleDims();
      baseAxisMap = normalizeAxisMap(axisMap, baseOriginalN);
      sceneMaterialService.setMaterials([{
        id: 'mat_1',
        name: 'Material 1',
        surface: cloneSurface(DEFAULT_SURFACE),
      }]);
      baseMaterialId = sceneMaterialService.defaultMaterialId('Material 1');
      baseSurface = sceneMaterialService.surfaceForMaterialOrFallback(baseMaterialId, DEFAULT_SURFACE);
      baseCellTopology = deriveCellTopologyForGeometry(PARAMS.primitive, baseOriginalN, M, E, surfaceTopology, cellTopology);
      baseSurfaceTopology = clonePrimitiveSurfaceTopology(surfaceTopology)
        ?? surfaceTopologyFromCellTopology(baseCellTopology);
      axisController.resetAxisOrder(N);
      PARAMS.axesX = axisController.axesOrder[0] ?? 0;
      PARAMS.axesY = axisController.axesOrder[1] ?? 1;
      PARAMS.axesZ = axisController.axesOrder[2] ?? 2;
      if (M > 0) {
        renderSync.rebuildBaseRenderer();
        if (setViewMode) setViewMode(currentMode);
        projectAndRenderAll();
      } else {
        // no base geometry
        rendererND.dispose?.();
      }
      updateDimensionControl();
      baseLabel = source === 'custom' ? 'Custom' : 'Hypercube';
      sceneStateService?.setSceneName('');
      updateObjectList();
      selectObject(BASE_SELECTION);
      updateAxisLegend();
      renderAxisList();
    }
    
    function resetToIsometric() {
      const targetN = 6;
      PARAMS.N = targetN;
      PARAMS.primitive = 'hypercube';
      axisController.clearDynamicState();
      PARAMS.renderMode = 'faceted';
    
      const rebuilt = buildPrimitive(PARAMS.primitive, targetN);
      const axisMap = canonicalAxisMap(targetN);
      const embedded = embedToMax(rebuilt.verts, targetN, axisMap);
      rebuildState(MAX_N, embedded, rebuilt.edges, 'primitive', targetN, axisMap, rebuilt.surfaceTopology, rebuilt.cellTopology);
    
      controls.reset();
      camera.position.copy(DEFAULT_CAMERA_POSITION);
    }
    projectAndRenderAll();
    updateAxisLegend();
    renderAxisList();
    updateObjectList();
    backgroundController.applySceneBackground(PARAMS.editMode);
    updateDimensionControl();
    updateEditModeToggle();
    textureEditor.initialize();
    backgroundController.initializeRenderControls();
    const backgroundSelectorReady = backgroundController.initializeSelector();
    
    const viewModeController = new ViewModeController({
      getMode: () => PARAMS.renderMode,
      setMode: mode => setViewMode(mode),
    });
    function applyViewMode(mode: ViewMode) {
      PARAMS.renderMode = mode;
      rendererND.setMode(mode);
      extraInstances.forEach(inst => {
        inst.renderer.setMode(mode);
      });
      textureEditor.updatePanel();
      viewModeController.syncButtons();
      backgroundController.syncForRenderMode();
      requestSceneUrlUpdate();
    }
    setViewMode = (mode: ViewMode) => {
      const commit = () => applyViewMode(mode);
      if (viewportInteraction) viewportInteraction.runImmediateOperation('set-view-mode', 'viewport', commit);
      else commit();
    };
    viewModeController.bind();
    backgroundController.syncForRenderMode();
    
    if (M === 0 && extraInstances.length === 0) {
      addInstanceAt(new THREE.Vector3(0, 0, 0), false);
      selectObject(0);
    }
    
    animationTimeline = new KeyframeTimelineController({
      captureState: captureAnimationState,
      applyState: applyAnimationState,
      interpolateState: (from, to, t) => interpolateAnimationState(from, to, t, N, rot.matrix),
      onSettingsChange: settings => {
        viewportCapture.setRecordingSettings(
          settings.fps,
          settings.frameCount,
          settings.renderQuality,
          settings.cameraWidth,
          settings.cameraHeight,
        );
        if (settings.renderQuality !== 'full') {
          backgroundController.setHdrQuality('sd');
        }
        setCaptureResolutionMode(settings.renderQuality);
      },
      onBeforeKeyframeChange: () => pushUndoSnapshot(),
      onStateChange: () => requestSceneUrlUpdate(),
    });
    animationTimeline.bind();
    viewportCapture.bindControls();
    modalOverlayController.bindControls();
    renderEffects.bind();
    sceneLightService.bindPanel();
    editToolbar?.bind();
    dimensionControl.bind();
    sceneFileControls.bind();
    viewportActionControls.bind();
    new KeyboardShortcutController({
      isModalOpen: () => modalOverlayController.isOpen(),
      getTransformMode: () => transformController.mode,
      isOperationActive: () => viewportInteraction.isOperationActive(),
      isEditMode: () => PARAMS.editMode,
      handleTransformConstraintKey,
      keyboardCamera,
      setViewMode: mode => setViewMode(mode),
      toggleRecording: () => viewportCapture.toggleRecording(),
      captureFrame: () => viewportCapture.captureFrame(),
      exportAnimation: () => viewportCapture.renderAnimation(),
      toggleAnimationPlayback: () => animationTimeline?.togglePlayback(),
      toggleAxisAutoRotations: () => axisController.toggleActiveAutoRotations(),
      insertKeyframe: insertKeyframeOperation,
      removeLastKeyframe: removeKeyframeOperation,
      toggleEditMode: () => setEditMode(!PARAMS.editMode),
      startTransformFromPointer: (mode, replaceActive) => viewportInteraction.startTransformFromLastPointer(mode, replaceActive),
      startEditOperationFromPointer: (request, replaceActive) => viewportInteraction.startEditOperationFromLastPointer(request, replaceActive),
      selectAllEditCells,
      showAddObjectMenuAtPointer: replaceActive => viewportInteraction.showAddObjectMenuAtLastPointer(replaceActive),
      duplicateSelectionFromPointer: replaceActive => viewportInteraction.startDuplicateFromLastPointer(replaceActive),
      deleteOrConfirmSelection: () => viewportInteraction.deleteOrConfirmSelection(),
      hasSelection: hasActiveSelection,
      undo: undoSceneSnapshot,
      redo: redoSceneSnapshot,
      togglePerfOverlay,
      setEditCellDimension,
      changePrimitiveDimension: delta => setNewPrimitiveDimension(PARAMS.N + delta),
    }).bind();
    
    updateTransformActionButtons();
    paneController.syncToViewport(true);
    viewportInteraction.bind();
    const startupScenePayload = sceneStateService.hasUrlPayload();
    void backgroundSelectorReady
      .then(async () => {
        await initializeSceneUrlState(true);
        if (!startupScenePayload) welcomeSplashController.showIfNeeded();
      })
      .catch(err => {
        console.warn('Unable to initialize scene URL state', err);
      });
    window.addEventListener('hashchange', () => {
      void initializeSceneUrlState();
    });
    
    // --- Animation ---
    const clock = new THREE.Clock();
    
    function animate() {
      const dt = Math.min(clock.getDelta(), 0.05);
      if (animationTimeline?.isPlaying()) {
        animationTimeline.update(dt);
      } else if (!animationVideoRendering) {
        if (applyAutoRotation(dt)) {
          markProjectionDirty();
          requestSceneUrlUpdate();
        }
      }
    
      if (!animationVideoRendering) keyboardCamera.update(dt);
      renderViewportFrame();
      requestAnimationFrame(animate);
    }
    animate();
    
    // --- Resize ---
    window.addEventListener('resize', () => {
      renderRuntime.resize();
      viewportCapture.onViewportResize();
      paneController.syncToViewport();
      textureEditor.updatePanel();
    });
    
  }

  dispose() {
    window.removeEventListener('beforeunload', this.confirmExitHandler);
    // Runtime cleanup is intentionally incremental; existing handlers are process-lifetime bound for now.
  }
}
