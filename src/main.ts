
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { SMAAPass } from 'three/examples/jsm/postprocessing/SMAAPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { MAX_N, type ViewMode } from './constants';
import { RotND } from './RotND';
import { NDProjector, canonicalP } from './geometry/NDProjector';
import {
  buildPrimitive,
  clonePrimitiveSurfaceTopology,
  type PrimitiveKind,
  type PrimitiveSurfaceTopology,
} from './geometry/primitives';
import {
  canonicalAxisMap,
  embedToMax,
  normalizeAxisMap,
  type AxisMap,
} from './geometry/projectionUtils';
import { buildProductMesh, type ProductMeshFactor } from './geometry/productMesh';
import {
  compactDimensionMajorVertices,
} from './geometry/bevelGeometry';
import {
  buildGeneratedCellTopology,
  cloneCellTopology,
  deleteCellAndPrune,
  surfaceTopologyFromCellTopology,
  type CellTopology,
} from './geometry/cellTopology';
import { BackgroundController, backgroundElementsFromDocument, type BackgroundUrlState } from './background/BackgroundController';
import { KeyboardCameraController } from './controls/KeyboardCameraController';
import { KeyboardShortcutController } from './interaction/KeyboardShortcutController';
import { TransformController } from './interaction/TransformController';
import { ViewportInteractionController, viewportContextMenuFromDocument } from './interaction/ViewportInteractionController';
import type { ViewportOperation } from './interaction/ViewportOperationManager';
import { createBidirectionalAxes, createFadingGrid } from './viewport/grid';
import { AxisGizmoController } from './ui/AxisGizmoController';
import { DimensionControlController } from './ui/DimensionControlController';
import { EditToolbarController } from './ui/EditToolbarController';
import { ModalOverlayController } from './ui/ModalOverlayController';
import { ObjectListController } from './ui/ObjectListController';
import { PaneController } from './ui/PaneController';
import { SceneControlTabsController } from './ui/SceneControlTabsController';
import { SceneFileControlsController } from './ui/SceneFileControlsController';
import { SceneLightPanelController } from './ui/SceneLightPanelController';
import { TextureEditorController } from './ui/TextureEditorController';
import { ViewModeController } from './ui/ViewModeController';
import { ViewportActionControlsController } from './ui/ViewportActionControlsController';
import { WelcomeSplashController, welcomeSplashElementsFromDocument } from './ui/WelcomeSplashController';
import { ViewportCaptureController, viewportCaptureElementsFromDocument } from './viewport/ViewportCaptureController';
import { HypercubeRenderer } from './rendering/HypercubeRenderer';
import { CachedGrainPass, ColorGradeShader, CopyFramePass, SmoothAfterimagePass } from './rendering/postProcessingPasses';
import { RenderEffectsController, clamp01, clampSigned01, renderEffectsElementsFromDocument } from './rendering/RenderEffectsController';
import {
  KeyframeTimelineController,
  normalizeAntialiasMode,
  normalizeRenderQuality,
  type AntialiasMode,
  type AnimationKeyframeState,
  type AnimationTimelineState,
  type RenderQuality,
} from './animation/KeyframeTimelineController';
import { completeAxisOrder, interpolateAnimationState } from './animation/animationInterpolation';
import { createSceneInstance, type InstanceGeometryData } from './scene/instanceFactory';
import { DEFAULT_SCENE_STATE } from './scene/defaultSceneState';
import { DuplicatePlacementOperationFactory } from './scene/DuplicatePlacementOperationFactory';
import { GeometryEditOperationFactory } from './scene/GeometryEditOperationFactory';
import { GeometryEditService } from './scene/GeometryEditService';
import { cloneObjectOrigin, computeObjectOrigin, type ObjectOrigin } from './scene/objectOrigin';
import { ProjectionPipeline } from './scene/ProjectionPipeline';
import { RenderSyncService } from './scene/RenderSyncService';
import { SceneMaterialService } from './scene/SceneMaterialService';
import { SceneObjectStore } from './scene/SceneObjectStore';
import { SceneSelectionService } from './scene/SceneSelectionService';
import { SceneHistory } from './scene/SceneHistory';
import {
  cloneSceneLightState,
  createSceneLightRuntime,
  disposeSceneLightRuntime,
  normalizeSceneLightState,
  rebuildSceneLightRuntimeKind,
  syncSceneLightRuntime,
  type SceneLightRuntime,
} from './scene/sceneLightRuntime';
import {
  deriveCellTopologyForGeometry,
  packCellTopologyForUrl,
  packSurfaceTopology,
  surfaceTopologyForEditedCellTopology,
  unpackCellTopology,
  unpackSurfaceTopology,
  type PackedCellTopology,
  type PackedTopology,
} from './scene/topologyState';
import {
  cloneTransformState,
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
} from './scene/sceneStateCodec';
import {
  clearScenePayloadFromCurrentUrl,
  createSceneUrlWithPayload,
  decodeSceneUrlPayload,
  encodeSceneUrlPayload,
  packF32,
  packU32,
  readScenePayloadFromText,
  readScenePayloadFromUrl,
  unpackF32,
  unpackU32,
} from './scene/sceneUrlState';
import { DEFAULT_SURFACE, cloneSurface, normalizeSurface, type SurfaceState } from './scene/surface';
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
} from './scene/types';
import type { ExtraAxisGizmoState } from './ui/ExtraAxisGizmoController';
import { copyTextToClipboard, downloadTextFile, timestampedSceneFileName } from './utils/fileExport';
type SceneLightDragHandle = 'position' | 'target';

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
const SCENE_LIGHT_MARKER_RADIUS = 0.025;
const SCENE_LIGHT_MARKER_PIXEL_DIAMETER = 11;
const SELECTED_SCENE_LIGHT_MARKER_PIXEL_DIAMETER = 15;
const SCENE_LIGHT_TARGET_PIXEL_DIAMETER = 10;
const MAX_UNDO_SNAPSHOT_BYTES = 64 * 1024 * 1024;
const SHADOW_MAP_SIZE_BY_QUALITY: Record<RenderQuality, number> = {
  full: 2048,
  high: 1024,
  medium: 512,
  low: 0,
};

let sceneUrlApplying = false;

function requestSceneUrlUpdate() {
  // Scene URLs are exported explicitly from the save button.
}

const app = document.getElementById('app')!;
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
    loadPayload: async payload => sanitizeSceneName((await loadSceneUrlPayload(payload, false)).sn),
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
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
app.appendChild(renderer.domElement);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.setPixelRatio(Math.min(window.devicePixelRatio, MAX_VIEWPORT_PIXEL_RATIO));
renderer.shadowMap.enabled = false;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
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

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.01, 100);
const DEFAULT_CAMERA_POSITION = new THREE.Vector3(3.9, 2.7, 3.9);
camera.position.copy(DEFAULT_CAMERA_POSITION);
const composerRenderTarget = new THREE.WebGLRenderTarget(
  window.innerWidth * renderer.getPixelRatio(),
  window.innerHeight * renderer.getPixelRatio(),
  {
    type: THREE.HalfFloatType,
    samples: renderer.capabilities.isWebGL2 ? POSTPROCESSING_MSAA_SAMPLES : 0,
  },
);
composerRenderTarget.texture.name = 'ViewportPostprocess.rt1';
const composer = new EffectComposer(renderer, composerRenderTarget);
composer.addPass(new RenderPass(scene, camera));
const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0, 0.58, 0.22);
const afterimagePass = new SmoothAfterimagePass();
const colorGradePass = new ShaderPass(ColorGradeShader);
const smaaPass = new SMAAPass(window.innerWidth, window.innerHeight);
const grainPass = new CachedGrainPass(GRAIN_UPDATE_INTERVAL_FRAMES, GRAIN_TEXTURE_SCALE);
const copyFramePass = new CopyFramePass();
composer.addPass(bloomPass);
composer.addPass(afterimagePass);
composer.addPass(colorGradePass);
composer.addPass(smaaPass);
composer.addPass(grainPass);
composer.addPass(copyFramePass);
const captureResolutionViewportSize = new THREE.Vector2();
const fullViewportPixelRatio = () => Math.min(window.devicePixelRatio, MAX_VIEWPORT_PIXEL_RATIO);
let downsampleSceneOnly = false;

const RENDER_QUALITY_PIXEL_RATIO_SCALE: Record<RenderQuality, number> = {
  full: 1,
  high: 0.75,
  medium: 0.5,
  low: 0.25,
};
let currentRenderQuality: RenderQuality = 'full';

function setCaptureResolutionMode(renderQuality: RenderQuality) {
  renderer.getSize(captureResolutionViewportSize);
  const fullPixelRatio = fullViewportPixelRatio();
  const normalizedQuality = normalizeRenderQuality(renderQuality);
  currentRenderQuality = normalizedQuality;
  const nextDownsampleSceneOnly = normalizedQuality !== 'full';
  const qualityChanged = downsampleSceneOnly !== nextDownsampleSceneOnly;
  const scenePixelRatio = Math.max(0.25, fullPixelRatio * RENDER_QUALITY_PIXEL_RATIO_SCALE[normalizedQuality]);
  downsampleSceneOnly = nextDownsampleSceneOnly;

  renderer.setPixelRatio(fullPixelRatio);
  renderer.setSize(captureResolutionViewportSize.x, captureResolutionViewportSize.y, false);
  composer.setPixelRatio(scenePixelRatio);
  composer.setSize(captureResolutionViewportSize.x, captureResolutionViewportSize.y);
  if (qualityChanged) markProjectionDirty();
  syncSceneLightRuntimes();
  sceneLightPanel.sync();
}

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.addEventListener('change', () => requestSceneUrlUpdate());
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
let sceneMaterialService: SceneMaterialService;
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

const perfOverlay = document.createElement('div');
perfOverlay.id = 'perf-overlay';
perfOverlay.setAttribute('aria-hidden', 'true');
Object.assign(perfOverlay.style, {
  position: 'fixed',
  right: 'calc(10px + var(--safe-right))',
  top: 'calc(10px + var(--safe-top))',
  zIndex: '80',
  display: 'none',
  minWidth: '128px',
  boxSizing: 'border-box',
  padding: '7px 8px',
  border: '1px solid rgba(207, 241, 240, 0.2)',
  borderRadius: '7px',
  background: 'rgba(25, 23, 15, 0.78)',
  color: 'rgba(207, 241, 240, 0.94)',
  font: '700 10px/1.36 SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace',
  letterSpacing: '0.01em',
  pointerEvents: 'none',
  whiteSpace: 'pre',
  boxShadow: '0 10px 26px rgba(25, 23, 15, 0.36)',
  backdropFilter: 'blur(10px) saturate(1.08)',
  WebkitBackdropFilter: 'blur(10px) saturate(1.08)',
});
document.body.appendChild(perfOverlay);

let perfOverlayVisible = false;
let perfSampleStart = performance.now();
const perfStats = {
  frames: 0,
  cpuMs: 0,
  projectionMs: 0,
  projectionFrames: 0,
  renderMs: 0,
};

function resetPerfStats(now = performance.now()) {
  perfSampleStart = now;
  perfStats.frames = 0;
  perfStats.cpuMs = 0;
  perfStats.projectionMs = 0;
  perfStats.projectionFrames = 0;
  perfStats.renderMs = 0;
}

function togglePerfOverlay() {
  perfOverlayVisible = !perfOverlayVisible;
  perfOverlay.style.display = perfOverlayVisible ? 'block' : 'none';
  perfOverlay.setAttribute('aria-hidden', String(!perfOverlayVisible));
  resetPerfStats();
  if (perfOverlayVisible) perfOverlay.textContent = 'FPS --\nFrame --ms\nCPU --ms\nProj --\nRender --ms';
}

function recordPerfFrame(frameStart: number, projectionMs: number, renderMs: number) {
  if (!perfOverlayVisible) return;

  const now = performance.now();
  const cpuMs = Math.max(0, now - frameStart);

  perfStats.frames += 1;
  perfStats.cpuMs += cpuMs;
  perfStats.renderMs += renderMs;
  if (projectionMs > 0) {
    perfStats.projectionMs += projectionMs;
    perfStats.projectionFrames += 1;
  }

  const elapsed = now - perfSampleStart;
  if (elapsed < 500 || perfStats.frames === 0) return;

  const fps = (perfStats.frames * 1000) / elapsed;
  const avgFrameMs = elapsed / perfStats.frames;
  const avgCpuMs = perfStats.cpuMs / perfStats.frames;
  const avgRenderMs = perfStats.renderMs / perfStats.frames;
  const avgProjectionMs = perfStats.projectionFrames > 0
    ? `${(perfStats.projectionMs / perfStats.projectionFrames).toFixed(1)}ms`
    : 'idle';

  perfOverlay.textContent = [
    `FPS ${fps.toFixed(0)}`,
    `Frame ${avgFrameMs.toFixed(1)}ms`,
    `CPU ${avgCpuMs.toFixed(1)}ms`,
    `Proj ${avgProjectionMs}`,
    `Render ${avgRenderMs.toFixed(1)}ms`,
  ].join('\n');
  resetPerfStats(now);
}
let transformController: TransformController;
let viewportInteraction: ViewportInteractionController;
let textureEditor: TextureEditorController;

const raycaster = new THREE.Raycaster();
const ndc = new THREE.Vector2();

let sceneLightIdCounter = 1;
const sceneLights: SceneLightRuntime[] = [];
const sceneLightMarkerGeometry = new THREE.SphereGeometry(SCENE_LIGHT_MARKER_RADIUS, 12, 8);
const sceneLightDrag = {
  active: false,
  moved: false,
  pointerId: -1,
  lightId: '',
  handle: 'position' as SceneLightDragHandle,
  controlsEnabled: true,
  plane: new THREE.Plane(),
  startHit: new THREE.Vector3(),
  startPosition: new THREE.Vector3(),
  startTarget: new THREE.Vector3(),
};
const axes = createBidirectionalAxes(1000);
scene.add(axes);
const gridGroup = createFadingGrid({ y: 0 });
scene.add(gridGroup);
const referenceLineDepthMaterial = new THREE.MeshBasicMaterial();
referenceLineDepthMaterial.colorWrite = false;
referenceLineDepthMaterial.depthWrite = true;
referenceLineDepthMaterial.depthTest = true;
referenceLineDepthMaterial.side = THREE.DoubleSide;
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
let sceneHistory: SceneHistory<PackedSceneUrlState>;
let baseLabel = 'Hypercube';
let sceneName = '';
const BASE_SELECTION = -1;
const NO_SELECTION = -2;
const LIGHT_SELECTION_BASE = -1000;
let selectionOutlines: THREE.LineSegments[] = [];
let selectionOutlineKeys: number[] = [];
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
function createSceneLightId() {
  return `light_${sceneLightIdCounter++}`;
}

function syncSceneLightIdCounter() {
  let max = 0;
  for (const { state } of sceneLights) {
    const match = /^light_(\d+)$/.exec(state.id);
    if (match) max = Math.max(max, Number.parseInt(match[1], 10));
  }
  sceneLightIdCounter = Math.max(sceneLightIdCounter, max + 1);
}

function sceneLightRuntimeOptions(selected = false) {
  return {
    scene,
    markerGeometry: sceneLightMarkerGeometry,
    createId: createSceneLightId,
    shadowMapSize: currentShadowMapSize,
    selected,
  };
}

function currentShadowMapSize() {
  return SHADOW_MAP_SIZE_BY_QUALITY[currentRenderQuality] ?? SHADOW_MAP_SIZE_BY_QUALITY.full;
}

function syncRendererShadowState() {
  const shadowMapSize = currentShadowMapSize();
  const enabled = shadowMapSize > 0 && sceneLights.some(runtime => runtime.state.visible && runtime.state.castShadow);
  renderer.shadowMap.enabled = enabled;
  renderer.shadowMap.needsUpdate = enabled;
}

function syncSceneLightRuntimes() {
  sceneLights.forEach(runtime => {
    const lightIndex = sceneLights.indexOf(runtime);
    syncSceneLightRuntime(runtime, sceneLightRuntimeOptions(
      lightIndex >= 0 && selectionService.items.includes(lightSelectionIndex(lightIndex)),
    ));
  });
  syncRendererShadowState();
}

function setSceneLights(states: SceneLightState[]) {
  sceneLights.splice(0).forEach(runtime => disposeSceneLightRuntime(scene, runtime));
  states.forEach(state => {
    sceneLights.push(createSceneLightRuntime(state, sceneLightRuntimeOptions(false)));
  });
  syncSceneLightIdCounter();
  if (!sceneLights.some(runtime => runtime.state.id === selectionService.lightId)) {
    selectionService.setLightId(sceneLights[0]?.state.id ?? '');
  }
  syncSceneLightRuntimes();
  sceneLightPanel.sync();
}

function applyAnimationLights(states: SceneLightState[] | undefined) {
  if (!states) return;
  const compatible = states.length === sceneLights.length
    && states.every((state, index) => sceneLights[index]?.state.id === state.id && sceneLights[index]?.state.kind === state.kind);

  if (!compatible) {
    setSceneLights(states.map(cloneSceneLightState));
    updateObjectList();
    return;
  }

  states.forEach((state, index) => {
    sceneLights[index].state = cloneSceneLightState(state);
  });
  syncSceneLightRuntimes();
  sceneLightPanel.sync();
}

function selectedSceneLightRuntime() {
  return selectionService?.selectedLightRuntime() ?? sceneLights.find(runtime => runtime.state.id === selectionService?.lightId) ?? null;
}

function lightSelectionIndex(lightIndex: number) {
  return selectionService?.lightSelectionIndex(lightIndex) ?? sceneObjectStore.lightSelectionIndex(lightIndex);
}

function isLightSelectionIndex(idx: number) {
  return selectionService?.isLightSelectionIndex(idx) ?? sceneObjectStore.isLightSelectionIndex(idx);
}

function sceneLightIndexFromSelection(idx: number) {
  return selectionService?.lightIndexFromSelection(idx) ?? sceneObjectStore.lightIndexFromSelection(idx);
}

function sceneLightRuntimeForSelection(idx: number) {
  return selectionService?.lightRuntimeForSelection(idx) ?? sceneObjectStore.lightRuntimeForSelection(idx);
}

function selectedSceneLightSelectionIndex() {
  return selectionService?.selectedLightSelectionIndex() ?? NO_SELECTION;
}

function isGeometrySelectionIndex(idx: number) {
  return selectionService?.isGeometrySelectionIndex(idx) ?? sceneObjectStore.isGeometrySelectionIndex(idx);
}

const sceneLightPanel = new SceneLightPanelController({
  getLights: () => sceneLights,
  getSelected: selectedSceneLightRuntime,
  selectLight: id => {
    selectionService.setLightId(id);
    selectObject(selectedSceneLightSelectionIndex());
  },
  setKind: setSelectedSceneLightKind,
  removeSelected: removeSelectedSceneLight,
  setShadow: enabled => updateSelectedSceneLight(state => {
    state.castShadow = enabled;
  }),
  setColor: color => updateSelectedSceneLight(state => {
    state.color = color;
  }),
  setIntensity: intensity => updateSelectedSceneLight(state => {
    state.intensity = intensity;
  }),
  currentShadowMapSize,
  syncRuntimes: syncSceneLightRuntimes,
});

function performRemoveSelectedSceneLight() {
  const selected = selectedSceneLightRuntime();
  if (!selected) return;
  pushUndoSnapshot();
  const index = sceneLights.indexOf(selected);
  const removedSelection = lightSelectionIndex(index);
  sceneLights.splice(index, 1);
  disposeSceneLightRuntime(scene, selected);
  selectionService.setLightId(sceneLights[Math.min(index, sceneLights.length - 1)]?.state.id ?? '');
  selectionService.repairAfterLightRemoval(removedSelection);
  sceneLightPanel.sync();
  updateObjectList();
  updateSelectionOutline();
  updateTransformActionButtons();
  requestSceneUrlUpdate();
}

function removeSelectedSceneLight() {
  if (viewportInteraction) viewportInteraction.runImmediateOperation('remove-scene-light', 'light', performRemoveSelectedSceneLight);
  else performRemoveSelectedSceneLight();
}

function performUpdateSelectedSceneLight(mutator: (state: SceneLightState) => void) {
  const selected = selectedSceneLightRuntime();
  if (!selected) return;
  const previousKind = selected.state.kind;
  pushUndoSnapshot();
  mutator(selected.state);
  selected.state = normalizeSceneLightState(selected.state);
  const selectedLightIdx = selectedSceneLightSelectionIndex();
  if (!selected.state.visible && selectionService.items.includes(selectedLightIdx)) {
    selectionService.clear();
  }
  if (selected.state.kind !== previousKind) {
    rebuildSceneLightRuntimeKind(selected, sceneLightRuntimeOptions(false));
  }
  syncSceneLightRuntimes();
  sceneLightPanel.sync();
  updateObjectList();
  updateTransformActionButtons();
  requestSceneUrlUpdate();
}

function updateSelectedSceneLight(mutator: (state: SceneLightState) => void) {
  const commit = () => performUpdateSelectedSceneLight(mutator);
  if (viewportInteraction) viewportInteraction.runImmediateOperation('update-scene-light', 'light', commit);
  else commit();
}

function setSelectedSceneLightKind(kind: SceneLightKind) {
  const selected = selectedSceneLightRuntime();
  if (!selected || selected.state.kind === kind) return;
  updateSelectedSceneLight(state => {
    state.kind = kind;
  });
}

function sceneLightMarkerScale(position: THREE.Vector3, pixelDiameter: number) {
  const viewportHeight = Math.max(1, renderer.domElement.clientHeight || renderer.domElement.height);
  const cameraSpace = tmpVec.copy(position).applyMatrix4(camera.matrixWorldInverse);
  const distance = Math.max(0.01, Math.abs(cameraSpace.z));
  const visibleHeight = (2 * distance * Math.tan(THREE.MathUtils.degToRad(camera.fov) * 0.5)) / camera.zoom;
  const worldDiameter = (pixelDiameter / viewportHeight) * visibleHeight;
  return Math.max(0.01, worldDiameter / (SCENE_LIGHT_MARKER_RADIUS * 2));
}

function updateSceneLightMarkersScreenSpace() {
  sceneLights.forEach(runtime => {
    const lightIndex = sceneLights.indexOf(runtime);
    const selected = lightIndex >= 0 && selectionService.items.includes(lightSelectionIndex(lightIndex));
    if (runtime.marker.visible) {
      runtime.marker.scale.setScalar(sceneLightMarkerScale(
        runtime.marker.position,
        selected ? SELECTED_SCENE_LIGHT_MARKER_PIXEL_DIAMETER : SCENE_LIGHT_MARKER_PIXEL_DIAMETER,
      ));
    }
    if (runtime.targetMarker.visible) {
      runtime.targetMarker.scale.setScalar(sceneLightMarkerScale(runtime.targetMarker.position, SCENE_LIGHT_TARGET_PIXEL_DIAMETER));
    }
  });
}

function pickSceneLightHandle(ev: PointerEvent) {
  const markers = sceneLights
    .flatMap(runtime => [runtime.targetMarker, runtime.marker])
    .filter(marker => marker.visible);
  if (!markers.length) return null;

  const rect = renderer.domElement.getBoundingClientRect();
  ndc.set(
    ((ev.clientX - rect.left) / rect.width) * 2 - 1,
    -((ev.clientY - rect.top) / rect.height) * 2 + 1,
  );
  raycaster.setFromCamera(ndc, camera);
  const hit = raycaster.intersectObjects(markers, false)[0];
  const lightId = hit?.object.userData.sceneLightId;
  if (typeof lightId !== 'string') return null;
  const runtime = sceneLights.find(entry => entry.state.id === lightId) ?? null;
  if (!runtime) return null;
  const handle: SceneLightDragHandle = hit.object.userData.sceneLightHandle === 'target' ? 'target' : 'position';
  return { runtime, handle };
}

function createSceneLightDragOperation(ev: PointerEvent): ViewportOperation | null {
  if (ev.button !== 0 || PARAMS.editMode || transformController.isActive() || transformController.isGizmoDragging()) return null;
  const lightHit = pickSceneLightHandle(ev);
  if (!lightHit) return null;

  selectionService.setLightId(lightHit.runtime.state.id);
  selectObject(selectedSceneLightSelectionIndex());
  const runtime = lightHit.runtime;
  const handle = lightHit.handle;
  const dragPoint = handle === 'target' ? runtime.state.target : runtime.state.position;
  camera.getWorldDirection(tmpVec).normalize();
  sceneLightDrag.plane.setFromNormalAndCoplanarPoint(tmpVec, dragPoint);
  raycaster.setFromCamera(ndc, camera);
  const planeHit = raycaster.ray.intersectPlane(sceneLightDrag.plane, tmpVec);
  sceneLightDrag.active = true;
  sceneLightDrag.moved = false;
  sceneLightDrag.pointerId = ev.pointerId;
  sceneLightDrag.lightId = runtime.state.id;
  sceneLightDrag.handle = handle;
  sceneLightDrag.controlsEnabled = controls.enabled;
  sceneLightDrag.startPosition.copy(runtime.state.position);
  sceneLightDrag.startTarget.copy(runtime.state.target);
  sceneLightDrag.startHit.copy(planeHit ?? dragPoint);
  controls.enabled = false;
  try {
    renderer.domElement.setPointerCapture(ev.pointerId);
  } catch {
    // Window handlers still keep the drag alive if pointer capture is unavailable.
  }
  return {
    kind: 'scene-light-drag',
    scope: 'light',
    blocksCamera: true,
    blocksSelection: true,
    blocksContextMenu: true,
    usesPointerCapture: true,
    usesPointerLock: true,
    updatePointer: (point, pointerEvent) => (pointerEvent ? updateSceneLightDrag(pointerEvent, point) : false),
    commit: () => {
      endSceneLightDrag(null, true);
    },
    cancel: () => {
      endSceneLightDrag(null, false);
    },
    cleanup: () => {
      try {
        if (renderer.domElement.hasPointerCapture(sceneLightDrag.pointerId)) {
          renderer.domElement.releasePointerCapture(sceneLightDrag.pointerId);
        }
      } catch {
        // Pointer capture release is best-effort.
      }
    },
  };
}

function updateSceneLightDrag(ev: PointerEvent, point: { clientX: number; clientY: number } = ev) {
  if (!sceneLightDrag.active || ev.pointerId !== sceneLightDrag.pointerId) return false;
  const runtime = sceneLights.find(entry => entry.state.id === sceneLightDrag.lightId);
  if (!runtime) return false;

  const rect = renderer.domElement.getBoundingClientRect();
  ndc.set(
    ((point.clientX - rect.left) / rect.width) * 2 - 1,
    -((point.clientY - rect.top) / rect.height) * 2 + 1,
  );
  raycaster.setFromCamera(ndc, camera);
  const hit = raycaster.ray.intersectPlane(sceneLightDrag.plane, tmpVec);
  if (!hit) return true;

  const nextPoint = (sceneLightDrag.handle === 'target' ? sceneLightDrag.startTarget : sceneLightDrag.startPosition)
    .clone()
    .add(hit.sub(sceneLightDrag.startHit));
  const movedDistance = sceneLightDrag.handle === 'target'
    ? nextPoint.distanceToSquared(sceneLightDrag.startTarget)
    : nextPoint.distanceToSquared(sceneLightDrag.startPosition);
  if (!sceneLightDrag.moved && movedDistance > 1e-8) {
    pushUndoSnapshot();
    sceneLightDrag.moved = true;
  }
  if (sceneLightDrag.handle === 'target') {
    setLightTargetForRuntime(runtime, nextPoint);
  } else {
    setLightPositionForSelection(lightSelectionIndex(sceneLights.indexOf(runtime)), nextPoint);
  }
  ev.preventDefault();
  return true;
}

function endSceneLightDrag(ev: PointerEvent | null, commit: boolean) {
  if (!sceneLightDrag.active || (ev && ev.pointerId !== sceneLightDrag.pointerId)) return false;
  try {
    if (renderer.domElement.hasPointerCapture(sceneLightDrag.pointerId)) {
      renderer.domElement.releasePointerCapture(sceneLightDrag.pointerId);
    }
  } catch {
    // Pointer capture release is best-effort.
  }
  if (!commit) {
    const runtime = sceneLights.find(entry => entry.state.id === sceneLightDrag.lightId);
    if (runtime) {
      runtime.state.position.copy(sceneLightDrag.startPosition);
      runtime.state.target.copy(sceneLightDrag.startTarget);
    }
  }
  controls.enabled = sceneLightDrag.controlsEnabled;
  sceneLightDrag.active = false;
  sceneLightDrag.pointerId = -1;
  sceneLightDrag.lightId = '';
  sceneLightDrag.handle = 'position';
  sceneLightDrag.moved = false;
  sceneLightPanel.sync();
  if (commit) requestSceneUrlUpdate();
  ev?.preventDefault();
  return true;
}

function cancelSceneLightDrag() {
  if (!sceneLightDrag.active) return false;
  const runtime = sceneLights.find(entry => entry.state.id === sceneLightDrag.lightId);
  if (runtime) {
    runtime.state.position.copy(sceneLightDrag.startPosition);
    runtime.state.target.copy(sceneLightDrag.startTarget);
  }
  controls.enabled = sceneLightDrag.controlsEnabled;
  sceneLightDrag.active = false;
  sceneLightDrag.pointerId = -1;
  sceneLightDrag.lightId = '';
  sceneLightDrag.handle = 'position';
  sceneLightDrag.moved = false;
  sceneLightPanel.sync();
  return true;
}

function getLightPositionForSelection(idx: number) {
  return sceneLightRuntimeForSelection(idx)?.state.position.clone() ?? null;
}

function setLightPositionForSelection(idx: number, position: THREE.Vector3) {
  const runtime = sceneLightRuntimeForSelection(idx);
  if (!runtime) return;
  const delta = position.clone().sub(runtime.state.position);
  runtime.state.position.copy(position);
  if (runtime.state.kind === 'directional') runtime.state.target.add(delta);
  syncSceneLightRuntimes();
  requestSceneUrlUpdate();
}

function setLightTargetForRuntime(runtime: SceneLightRuntime, target: THREE.Vector3) {
  if (runtime.state.kind !== 'directional') return;
  if (target.distanceToSquared(runtime.state.position) < 1e-8) return;
  runtime.state.target.copy(target);
  syncSceneLightRuntimes();
  requestSceneUrlUpdate();
}

function objectMaterialId(idx: number) {
  return sceneObjectStore.objectMaterialId(idx);
}

function packCameraState(): PackedCamera {
  return [
    camera.position.x, camera.position.y, camera.position.z,
    controls.target.x, controls.target.y, controls.target.z,
    camera.up.x, camera.up.y, camera.up.z,
    camera.fov, camera.zoom,
  ];
}

function applyCameraState(state: PackedCamera | undefined) {
  if (!state) return;
  camera.position.copy(unpackVec3(state, DEFAULT_CAMERA_POSITION));
  controls.target.copy(unpackVec3([state[3], state[4], state[5]], new THREE.Vector3()));
  camera.up.copy(unpackVec3([state[6], state[7], state[8]], worldUp).normalize());
  camera.fov = Math.max(1, Math.min(179, finiteNumber(state[9], camera.fov)));
  camera.zoom = Math.max(0.01, Math.min(100, finiteNumber(state[10], camera.zoom)));
  camera.updateProjectionMatrix();
  controls.update();
  updateAxisGizmo();
}

function sceneCodecDefaults(): SceneCodecDefaults {
  return {
    defaultCameraPosition: DEFAULT_CAMERA_POSITION,
    worldUp,
    createMaterialId: () => sceneMaterialService.createMaterialId(),
    createSceneLightId,
    noSelection: NO_SELECTION,
    bloomIntensity: DEFAULT_BLOOM_INTENSITY,
    motionBlurIntensity: DEFAULT_MOTION_BLUR_INTENSITY,
    colorHue: DEFAULT_COLOR_HUE,
    colorSaturation: DEFAULT_COLOR_SATURATION,
    colorBrightness: DEFAULT_COLOR_BRIGHTNESS,
    colorContrast: DEFAULT_COLOR_CONTRAST,
    grainIntensity: DEFAULT_GRAIN_INTENSITY,
  };
}

function captureSceneUrlState(sceneNameOverride = sceneName): PackedSceneUrlState {
  const snap = captureSnapshot();
  const editSelection = transformController.getEditSelection();
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
    rm: PARAMS.renderMode,
    em: PARAMS.editMode ? 1 : 0,
    fx: [
      PARAMS.bloomIntensity,
      PARAMS.motionBlurIntensity,
      PARAMS.colorHue,
      PARAMS.colorSaturation,
      PARAMS.colorBrightness,
      PARAMS.colorContrast,
      PARAMS.grainIntensity,
      PARAMS.antialiasMode === 'smaa' ? 1 : 0,
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
    sv: transformController.getSelectedVertex(),
    es: editSelection?.cellIds.length ? [editSelection.dimension, [...editSelection.cellIds]] : undefined,
    i: snap.instances.map(packInstanceState),
    c: packCameraState(),
    bg: packBackgroundState(backgroundController.getUrlState()),
    li: sceneLights.map(runtime => packSceneLightState(runtime.state)),
    tl: animationTimeline ? packTimelineState(animationTimeline.getTimelineState()) : undefined,
    pc: paneController.isCollapsed ? 1 : 0,
    ag: axisController.getExtraAxisState(),
  };
}

async function applySceneUrlState(state: PackedSceneUrlState) {
  sceneUrlApplying = true;
  try {
    sceneName = sanitizeSceneName(state.sn);
    const viewMode = normalizeViewMode(state.rm);
    PARAMS.renderMode = viewMode;
    applySnapshot(unpackSceneUrlSnapshot(state, sceneCodecDefaults()));
    setViewMode(viewMode);

    PARAMS.bloomIntensity = clamp01(finiteNumber(state.fx?.[0], DEFAULT_BLOOM_INTENSITY));
    PARAMS.motionBlurIntensity = clamp01(finiteNumber(state.fx?.[1], DEFAULT_MOTION_BLUR_INTENSITY));
    PARAMS.colorHue = clampSigned01(finiteNumber(state.fx?.[2], DEFAULT_COLOR_HUE));
    PARAMS.colorSaturation = clampSigned01(finiteNumber(state.fx?.[3], DEFAULT_COLOR_SATURATION));
    PARAMS.colorBrightness = clampSigned01(finiteNumber(state.fx?.[4], DEFAULT_COLOR_BRIGHTNESS));
    PARAMS.colorContrast = clampSigned01(finiteNumber(state.fx?.[5], DEFAULT_COLOR_CONTRAST));
    PARAMS.grainIntensity = clamp01(finiteNumber(state.fx?.[6], DEFAULT_GRAIN_INTENSITY));
    PARAMS.antialiasMode = normalizeAntialiasMode(state.fx?.[7] === 1 ? 'smaa' : 'off');
    renderEffects.sync();

    axisController.applyExtraAxisState(state.ag);
    paneController.setCollapsed(state.pc === 1);
    applyCameraState(state.c);
    setEditMode(state.em === 1);
    const packedEditSelection = Array.isArray(state.es) ? state.es : null;
    if (packedEditSelection && PARAMS.editMode && isGeometrySelectionIndex(selectionService.primary)) {
      const dimension = finiteInteger(packedEditSelection[0], 0);
      const cellIds = Array.isArray(packedEditSelection[1])
        ? packedEditSelection[1].map(cellId => finiteInteger(cellId, -1))
        : [];
      selectionService.restorePackedEditSelection(dimension, cellIds);
    } else {
      transformController.setSelectedVertex(finiteInteger(state.sv, -1));
    }
    const activeEditSelection = transformController.getEditSelection();
    if (PARAMS.editMode && activeEditSelection && getObjectVisible(selectionService.primary)) {
      updateVertexCloud(selectionService.primary);
      if (transformController.getSelectedVertex() >= 0) placeVertexMarker(selectionService.primary, transformController.getSelectedVertex());
    }

    animationTimeline?.applyTimelineState(state.tl ? unpackTimelineState(state.tl, sceneCodecDefaults()) : undefined, false);
    await backgroundController.applyUrlState(unpackBackgroundState(state.bg));

    projectAndRenderAll();
    updateAxisLegend();
    renderAxisList();
    updateObjectList();
    updateSelectionOutline();
    textureEditor.updatePanel();
  } finally {
    sceneUrlApplying = false;
  }
}

async function loadSceneUrlPayload(payload: string, clearUrlAfterLoad: boolean) {
  const decoded = await decodeSceneUrlPayload(payload);
  if (!isPackedSceneUrlState(decoded)) {
    throw new Error('Invalid scene URL state.');
  }
  await applySceneUrlState(decoded);
  if (clearUrlAfterLoad) clearScenePayloadFromCurrentUrl();
  return decoded;
}

async function applyDefaultSceneState() {
  if (!isPackedSceneUrlState(DEFAULT_SCENE_STATE)) {
    console.warn('Default scene state is invalid.');
    return;
  }
  await applySceneUrlState(DEFAULT_SCENE_STATE);
}

async function initializeSceneUrlState(loadDefault = false) {
  const payload = readScenePayloadFromUrl();
  if (!payload) {
    if (loadDefault) await applyDefaultSceneState();
    return;
  }

  try {
    await loadSceneUrlPayload(payload, true);
  } catch (err) {
    console.warn('Unable to apply scene URL state', err);
    clearScenePayloadFromCurrentUrl();
  }
}

function requestSceneNameForSave() {
  const currentName = sanitizeSceneName(sceneName);
  const value = window.prompt('Scene name (optional)', currentName || baseLabel || '');
  if (value === null) return currentName;
  sceneName = sanitizeSceneName(value);
  return sceneName;
}

async function saveSceneStateFile(sceneSaveButton: HTMLButtonElement | null) {
  if (!sceneSaveButton) return;
  const previousTitle = sceneSaveButton.title;
  sceneSaveButton.disabled = true;
  sceneSaveButton.title = 'Saving scene URL...';
  try {
    const nextSceneName = requestSceneNameForSave();
    const payload = await encodeSceneUrlPayload(captureSceneUrlState(nextSceneName));
    welcomeSplashController.rememberScene(payload, nextSceneName);
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

async function loadSceneStateFile(file: File | null | undefined) {
  if (!file) return false;
  try {
    const payload = readScenePayloadFromText(await file.text());
    if (!payload) throw new Error('Scene file does not contain a valid scene URL.');
    const state = await loadSceneUrlPayload(payload, false);
    welcomeSplashController.rememberScene(payload, sanitizeSceneName(state.sn));
    welcomeSplashController.hide();
    return true;
  } catch (err) {
    console.warn('Unable to load scene URL state', err);
    window.alert(err instanceof Error ? err.message : 'Unable to load scene URL.');
    return false;
  }
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
    lights: sceneLights.map(runtime => ({
      ...runtime.state,
      position: runtime.state.position.clone(),
      target: runtime.state.target.clone(),
    })),
  };
}

function byteLengthOfCellTopology(topology?: CellTopology) {
  if (!topology) return 0;
  return topology.cells.reduce((sum, dim) => (
    sum + (dim ? dim.offsets.byteLength + dim.vertices.byteLength : 0)
  ), 0);
}

function byteLengthOfSurfaceTopology(topology?: PrimitiveSurfaceTopology) {
  if (!topology) return 0;
  return topology.triangles.byteLength + topology.facetIds.byteLength;
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
  if (sceneUrlApplying) return;
  const estimatedBytes = estimateUndoSnapshotBytes();
  if (estimatedBytes > MAX_UNDO_SNAPSHOT_BYTES) {
    console.warn(
      `Skipping undo snapshot because the scene is too large (${(estimatedBytes / 1024 / 1024).toFixed(1)} MB).`,
    );
    return;
  }
  sceneHistory.push();
}

function undoSceneSnapshot() {
  void sceneHistory.undo();
}

function redoSceneSnapshot() {
  void sceneHistory.redo();
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
  setSceneLights((snap.lights ?? []).map(lightState => ({
    ...lightState,
    position: lightState.position.clone(),
    target: lightState.target?.clone() ?? new THREE.Vector3(),
  })));
  selectionService.setSnapshot(snap.selectedInstance, snap.selectedInstances ?? [snap.selectedInstance]);
  reconcileSelection();
  projectAndRenderAll();
  updateDimensionControl();
  updateObjectList();
  selectObject(selectionService.primary, selectionService.primary !== NO_SELECTION);
  requestSceneUrlUpdate();
}

sceneHistory = new SceneHistory({
  capture: captureSceneUrlState,
  apply: applySceneUrlState,
  maxEntries: 20,
});

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

  if (idx === -1) {
    baseVisible = visible;
  } else if (sceneLightRuntimeForSelection(idx)) {
    const runtime = sceneLightRuntimeForSelection(idx);
    if (runtime) runtime.state.visible = visible;
  } else if (extraInstances[idx]) {
    extraInstances[idx].visible = visible;
  }

  applyObjectVisibility();
  if (!visible && selectionService.items.includes(idx)) {
    removeSelectionOutlines();
    transformController.clearSelectionVisuals();
  }
  reconcileSelection();
  selectObject(selectionService.primary, selectionService.primary !== NO_SELECTION);
  sceneLightPanel.sync();
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
  if (idx === -1) {
    baseLabel = label;
  } else if (lightRuntime) {
    lightRuntime.state.label = label;
    selectionService.setLightId(lightRuntime.state.id);
    sceneLightPanel.sync();
  } else {
    extraInstances[idx].label = label;
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

function removeSelectionOutlines() {
  selectionOutlines.forEach(outline => {
    scene.remove(outline);
    if (Array.isArray(outline.material)) outline.material.forEach(material => material.dispose());
    else outline.material.dispose();
  });
  selectionOutlines = [];
  selectionOutlineKeys = [];
}

function selectionGeometry(idx: number) {
  if (idx === BASE_SELECTION) return M > 0 ? rendererND.line.geometry : null;
  return extraInstances[idx]?.renderer.line.geometry ?? null;
}

function buildSelectionOutline(geom: THREE.BufferGeometry, primary: boolean) {
  const mat = new THREE.LineBasicMaterial({
    color: 0xffa64d,
    transparent: true,
    opacity: primary ? 1 : 0.38,
    depthTest: false,
    depthWrite: false,
  });
  const outline = new THREE.LineSegments(geom, mat);
  outline.renderOrder = primary ? 10 : 9;
  return outline;
}

function selectObject(idx: number, additive = false) {
  selectionService.selectObject(idx, additive);
}

function updateSelectionOutline() {
  reconcileSelection();
  const desiredKeys = PARAMS.editMode
    ? []
    : selectionService.items.filter(idx => getObjectVisible(idx) && selectionGeometry(idx));
  const unchanged = desiredKeys.length === selectionOutlineKeys.length
    && desiredKeys.every((idx, i) => idx === selectionOutlineKeys[i]);
  if (unchanged) {
    selectionOutlines.forEach(outline => {
      if (!scene.children.includes(outline)) scene.add(outline);
    });
    return;
  }

  removeSelectionOutlines();
  if (PARAMS.editMode) return;

  desiredKeys.forEach((idx, selectionIdx) => {
    if (!getObjectVisible(idx)) return;
    const geom = selectionGeometry(idx);
    if (!geom) return;
    const outline = buildSelectionOutline(geom, selectionIdx === 0);
    selectionOutlines.push(outline);
    selectionOutlineKeys.push(idx);
    scene.add(outline);
  });
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
  if (idx === BASE_SELECTION) {
    if (M <= 0 || !baseVisible) return null;
    return {
      X: new Float32Array(X),
      E: new Uint32Array(E),
      cellTopology: cloneCellTopology(baseCellTopology),
      surfaceTopology: clonePrimitiveSurfaceTopology(baseSurfaceTopology),
      M,
      offset: baseTransform.pos.clone(),
      label: duplicateLabel(baseLabel),
      kind: PARAMS.primitive,
      transform: cloneTransformState(baseTransform),
      origin: new Float32Array(baseOrigin),
      originalN: baseOriginalN || PARAMS.N,
      axisMap: [...baseAxisMap],
      visible: true,
      materialId: baseMaterialId,
      surface: cloneSurface(baseSurface),
    };
  }

  const inst = extraInstances[idx];
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

function moveObjectOriginToWorldPosition(idx: number, position: THREE.Vector3) {
  const lightRuntime = sceneLightRuntimeForSelection(idx);
  if (lightRuntime) {
    const delta = position.clone().sub(lightRuntime.state.position);
    lightRuntime.state.position.copy(position);
    if (lightRuntime.state.kind === 'directional') lightRuntime.state.target.add(delta);
    syncSceneLightRuntimes();
    return true;
  }

  const transform = idx === BASE_SELECTION ? baseTransform : extraInstances[idx]?.transform;
  const current = getObjectOriginWorldPosition(idx);
  if (!transform || !current) return false;
  const delta = position.clone().sub(current);
  transform.pos.add(delta);
  if (idx >= 0) extraInstances[idx]?.offset.add(delta);
  projectAndRenderAll();
  updateSelectionOutline();
  return true;
}

function recalculateObjectOrigin(idx: number) {
  const origin = getObjectOrigin(idx);
  if (!origin) return;

  pushUndoSnapshot();
  if (idx === BASE_SELECTION) {
    computeObjectOrigin(X, M, MAX_N, baseOrigin);
  } else {
    const inst = extraInstances[idx];
    if (!inst) return;
    computeObjectOrigin(inst.X, inst.M, MAX_N, inst.origin);
  }
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
  const source = idx === BASE_SELECTION
    ? {
      X,
      M,
      E,
      cellTopology: baseCellTopology,
      surfaceTopology: baseSurfaceTopology,
      origin: baseOrigin,
      originalN: baseOriginalN || visibleDims(),
      axisMap: baseAxisMap,
    }
    : extraInstances[idx];
  if (!source || source.M <= 0) return null;

  const dimension = Math.max(1, Math.min(MAX_N, source.originalN || visibleDims()));
  const axisMap = normalizeAxisMap(source.axisMap, dimension);
  const verts = new Float32Array(dimension * source.M);
  for (let d = 0; d < dimension; d++) {
    const ambientDim = axisMap[d] ?? d;
    const originValue = source.origin[ambientDim] ?? 0;
    for (let v = 0; v < source.M; v++) {
      verts[d * source.M + v] = source.X[ambientDim * source.M + v] - originValue;
    }
  }

  return {
    verts,
    vertexCount: source.M,
    dimension,
    edges: new Uint32Array(source.E),
    cellTopology: cloneCellTopology(source.cellTopology),
    surfaceTopology: clonePrimitiveSurfaceTopology(source.surfaceTopology),
  };
}

function getObjectSurface(idx: number) {
  return idx === BASE_SELECTION ? baseSurface : extraInstances[idx]?.surface;
}

function getObjectTransform(idx: number) {
  return idx === BASE_SELECTION ? baseTransform : extraInstances[idx]?.transform;
}

function addProductMeshFromSelection() {
  const selected = selectedProductObjects();
  if (selected.length < 2) return;

  const factors = selected.map(getObjectProductFactor);
  if (factors.some(factor => !factor)) {
    window.alert('Product mesh requires valid selected geometry.');
    return;
  }

  let product;
  try {
    product = buildProductMesh(factors as ProductMeshFactor[], MAX_N);
  } catch (err) {
    window.alert(err instanceof Error ? err.message : 'Unable to build product mesh.');
    return;
  }

  const axisMap = canonicalAxisMap(product.dimension);
  const verts = embedToMax(product.verts, product.dimension, axisMap);
  const origin = new Float32Array(MAX_N);
  const parentIdx = selected[0];
  const parentMaterialId = objectMaterialId(parentIdx) || sceneMaterialService.defaultMaterialId();
  const parentTransform = getObjectTransform(parentIdx);
  const label = `Product #${extraInstances.length + 1}`;

  pushUndoSnapshot();
  const inst = insertInstance({
    verts,
    edges: product.edges,
    cellTopology: cloneCellTopology(product.cellTopology)
      ?? deriveCellTopologyForGeometry('productMesh', product.dimension, product.vertexCount, product.edges, product.surfaceTopology),
    surfaceTopology: clonePrimitiveSurfaceTopology(product.surfaceTopology),
    V: product.vertexCount,
    kind: 'productMesh',
    axisMap,
    originalN: product.dimension,
    origin,
  }, new THREE.Vector3(0, 0, 0), label, parentMaterialId);

  if (parentTransform) {
    inst.transform.scale.copy(parentTransform.scale);
    projectAndRenderAll();
    updateObjectList();
  }
  requestSceneUrlUpdate();
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
  for (const idx of deleteIndices) {
    const inst = extraInstances[idx];
    if (!inst) continue;
    inst.renderer.destroy();
    extraInstances.splice(idx, 1);
  }
  for (const idx of deleteLightIndices) {
    const runtime = sceneLights[idx];
    if (!runtime) continue;
    sceneLights.splice(idx, 1);
    disposeSceneLightRuntime(scene, runtime);
  }
  if (deleteLightIndices.length) selectionService.setLightId(sceneLights[0]?.state.id ?? '');
  if (keepBaseSelected) selectionService.setSnapshot(BASE_SELECTION, [BASE_SELECTION]);
  else selectionService.clear();
  sceneMaterialService.reconcile();
  projectAndRenderAll();
  sceneLightPanel.sync();
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
  getLights: () => sceneLights,
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
  const instanceRenderer = new HypercubeRenderer(scene);
  const cellTopology = deriveCellTopologyForGeometry(
    snap.kind,
    snap.originalN,
    snap.M,
    snap.E,
    snap.surfaceTopology,
    snap.cellTopology,
  );
  instanceRenderer.build(snap.M, snap.E, snap.surfaceTopology, cellTopology);
  const material = sceneMaterialService.ensureMaterialSlot(snap.materialId, snap.surface, snap.label);
  const surface = cloneSurface(material.surface);
  instanceRenderer.setSurface(surface);
  instanceRenderer.setMode(PARAMS.renderMode);

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

const rendererND = new HypercubeRenderer(scene);
if (M > 0) {
  rendererND.build(M, E, baseSurfaceTopology, baseCellTopology);
  rendererND.setMode('solid');
}

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
    lights: sceneLights.map(runtime => cloneSceneLightState(runtime.state)),
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
  applyAnimationLights(state.lights);

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

function renderAxesClean(axesWereVisible: boolean) {
  if (!axesWereVisible) return;

  const previousAutoClear = renderer.autoClear;
  const previousBackground = scene.background;
  const previousOverrideMaterial = scene.overrideMaterial;
  const childVisibility = scene.children.map(child => ({ child, visible: child.visible }));

  renderer.autoClear = false;
  scene.background = null;

  gridGroup.visible = false;
  axes.visible = false;
  scene.overrideMaterial = referenceLineDepthMaterial;
  renderer.clearDepth();
  renderer.render(scene, camera);
  scene.overrideMaterial = previousOverrideMaterial;

  for (const { child } of childVisibility) {
    child.visible = child === axes && axesWereVisible;
  }
  renderer.render(scene, camera);

  for (const { child, visible } of childVisibility) child.visible = visible;
  scene.background = previousBackground;
  scene.overrideMaterial = previousOverrideMaterial;
  renderer.autoClear = previousAutoClear;
}

function renderEffectsFrame() {
  const axesWereVisible = axes.visible;

  axes.visible = false;
  composer.render();

  axes.visible = axesWereVisible;
  renderAxesClean(axesWereVisible);
}

function renderViewportFrame() {
  const frameStart = performance.now();
  const projectionMs = projectIfDirty();
  controls.update();
  transformController.updateScreenSpaceMarkerScales();
  updateSceneLightMarkersScreenSpace();
  updateAxisGizmo();
  const renderStart = performance.now();
  if (renderEffects.hasEffects() || downsampleSceneOnly) renderEffectsFrame();
  else renderer.render(scene, camera);
  recordPerfFrame(frameStart, projectionMs, performance.now() - renderStart);
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
  getLights: () => sceneLights,
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
  syncSceneLightPanel: () => sceneLightPanel.sync(),
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
  isSceneApplying: () => sceneUrlApplying,
  history: sceneHistory,
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
  pushUndoSnapshot: snapshot => sceneHistory.push(snapshot),
  createLightDuplicate: (idx, position) => {
    const lightRuntime = sceneLightRuntimeForSelection(idx);
    if (!lightRuntime) return null;
    const state = cloneSceneLightState(lightRuntime.state);
    const delta = position.clone().sub(state.position);
    state.id = createSceneLightId();
    state.label = duplicateLabel(state.label);
    state.position.copy(position);
    if (state.kind === 'directional') state.target.add(delta);
    const runtime = createSceneLightRuntime(state, sceneLightRuntimeOptions(false));
    sceneLights.push(runtime);
    selectionService.setLightId(state.id);
    selectObject(lightSelectionIndex(sceneLights.length - 1));
    updateObjectList();
    sceneLightPanel.sync();
    return runtime;
  },
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
    const idx = sceneLights.indexOf(runtime);
    if (idx >= 0) moveObjectOriginToWorldPosition(lightSelectionIndex(idx), position);
  },
  moveInstanceDuplicate: (instance, position) => {
    const idx = extraInstances.indexOf(instance);
    if (idx >= 0) moveObjectOriginToWorldPosition(idx, position);
  },
  removeLightDuplicate: runtime => {
    const idx = sceneLights.indexOf(runtime);
    if (idx >= 0) {
      sceneLights.splice(idx, 1);
      disposeSceneLightRuntime(scene, runtime);
    }
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
    sceneLightPanel.sync();
    textureEditor.updatePanel();
    updateTransformActionButtons();
  },
  refreshAfterCommit: () => {
    updateObjectList();
    updateSelectionOutline();
    sceneLightPanel.sync();
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
});

function createPrimitiveData(kind: PrimitiveKind, dimension: number): InstanceGeometryData {
  const data = buildPrimitive(kind, dimension);
  const axisMap = currentAxisMap(dimension);
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

function insertInstance(data: InstanceGeometryData, offset: THREE.Vector3, label: string, materialId: string, syncMode = true) {
  const material = sceneMaterialService.ensureMaterialSlot(materialId);
  const inst = createSceneInstance({
    scene,
    projector,
    data,
    offset,
    label,
    materialId: material.id,
    surface: material.surface,
    renderMode: PARAMS.renderMode,
    projectionN: MAX_N,
  });
  extraInstances.push(inst);
  projectAndRenderAll();
  if (syncMode && setViewMode) setViewMode(PARAMS.renderMode);
  updateObjectList();
  requestSceneUrlUpdate();
  return inst;
}

function addPrimitiveInstanceAt(kind: PrimitiveKind, label: string, offset: THREE.Vector3, syncMode = true) {
  const materialId = sceneMaterialService.defaultMaterialId('Material 1');
  insertInstance(createPrimitiveData(kind, PARAMS.N), offset, label, materialId, syncMode);
}

function addSceneLightAt(kind: SceneLightKind, position: THREE.Vector3) {
  const index = sceneLights.filter(runtime => runtime.state.kind === kind).length + 1;
  const label = `${kind === 'point' ? 'Point' : 'Directional'} light ${index}`;
  const target = kind === 'directional' && position.lengthSq() < 1e-8
    ? new THREE.Vector3(0, -1, 0)
    : new THREE.Vector3();
  const state = normalizeSceneLightState({
    id: createSceneLightId(),
    kind,
    label,
    position: position.clone(),
    target,
  });
  sceneLights.push(createSceneLightRuntime(state, sceneLightRuntimeOptions(false)));
  selectionService.setLightId(state.id);
  selectObject(lightSelectionIndex(sceneLights.length - 1));
  setSceneControlTab('lights');
  updateObjectList();
  sceneLightPanel.sync();
  requestSceneUrlUpdate();
}

function clearExtraInstances() {
  removeSelectionOutlines();
  extraInstances.forEach(inst => inst.renderer.destroy());
  extraInstances.length = 0;
  selectionService.clear();
}

function addInstanceAt(offset: THREE.Vector3, recordUndo = true) {
  if (recordUndo) pushUndoSnapshot();
  let data: InstanceGeometryData;
  if (M > 0 && baseVisible) {
    data = {
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
  } else {
    data = createPrimitiveData(PARAMS.primitive, PARAMS.N);
  }
  const materialId = M > 0 && baseVisible
    ? baseMaterialId
    : sceneMaterialService.defaultMaterialId('Material 1');
  const label = `${data.kind} #${extraInstances.length + 1}`;
  insertInstance(data, offset, label, materialId);
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
  sceneName = '';
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
sceneLightPanel.bind();
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
const startupScenePayload = readScenePayloadFromUrl();
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
  const w = window.innerWidth, h = window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
  composer.setSize(w, h);
  viewportCapture.onViewportResize();
  paneController.syncToViewport();
  textureEditor.updatePanel();
});
