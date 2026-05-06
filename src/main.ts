
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { MAX_N, type ViewMode } from './constants';
import { RotND } from './RotND';
import { NDProjector, canonicalP } from './geometry/NDProjector';
import { buildPrimitive, type PrimitiveKind } from './geometry/primitives';
import {
  canonicalAxisMap,
  embedToMax,
  normalizeAxisMap,
  type AxisMap,
} from './geometry/projectionUtils';
import { BackgroundController } from './background/BackgroundController';
import { KeyboardCameraController } from './controls/KeyboardCameraController';
import { KeyboardShortcutController } from './interaction/KeyboardShortcutController';
import { TransformController } from './interaction/TransformController';
import { ViewportInteractionController } from './interaction/ViewportInteractionController';
import { createFadingGrid } from './viewport/grid';
import { AxisGizmoController } from './ui/AxisGizmoController';
import { ModalOverlayController } from './ui/ModalOverlayController';
import { ObjectListController } from './ui/ObjectListController';
import { PaneController } from './ui/PaneController';
import { TextureEditorController } from './ui/TextureEditorController';
import { ViewModeController } from './ui/ViewModeController';
import { ViewportCaptureController } from './viewport/ViewportCaptureController';
import { HypercubeRenderer } from './rendering/HypercubeRenderer';
import { createSceneInstance, type InstanceGeometryData } from './scene/instanceFactory';
import { ProjectionPipeline } from './scene/ProjectionPipeline';
import { SceneHistory } from './scene/SceneHistory';
import { DEFAULT_SURFACE, cloneSurface, normalizeSurface, surfacesEqual, type SurfaceState } from './scene/surface';
import type {
  DataSource,
  Instance,
  InstanceSnapshot,
  ProjectionAxes,
  SceneSnapshot,
  TransformMode,
  TransformState,
} from './scene/types';

type ProjMode = 'Canonical' | 'PCA';
type PrimitiveMode = PrimitiveKind;

const app = document.getElementById('app')!;
const tooltipEl = document.getElementById('tooltip') as HTMLDivElement | null;
const ctxMenu = document.getElementById('context-menu') as HTMLDivElement | null;
const recordViewportButton = document.getElementById('record-viewport-button') as HTMLButtonElement | null;
const recordViewportTimer = document.getElementById('record-viewport-timer') as HTMLSpanElement | null;
const captureFrameButton = document.getElementById('capture-frame-button') as HTMLButtonElement | null;
const editModeToggle = document.getElementById('edit-mode-toggle') as HTMLButtonElement | null;
const transformMoveButton = document.getElementById('transform-move-button') as HTMLButtonElement | null;
const transformRotateButton = document.getElementById('transform-rotate-button') as HTMLButtonElement | null;
const transformScaleButton = document.getElementById('transform-scale-button') as HTMLButtonElement | null;
const dimensionValue = document.getElementById('dimension-value') as HTMLOutputElement | null;
const dimensionDownButton = document.getElementById('dimension-down') as HTMLButtonElement | null;
const dimensionUpButton = document.getElementById('dimension-up') as HTMLButtonElement | null;
const modalOverlayController = new ModalOverlayController();
const paneController = new PaneController();

// --- Three.js setup ---
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
app.appendChild(renderer.domElement);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const scene = new THREE.Scene();
const baseBackground = new THREE.Color(0x10141a);
const editBackground = new THREE.Color(0x141414);
scene.background = baseBackground.clone();
renderer.setClearColor(scene.background);
const pmrem = new THREE.PMREMGenerator(renderer);
const fallbackEnvironmentTarget = pmrem.fromScene(new RoomEnvironment(), 0.04);
scene.environment = fallbackEnvironmentTarget.texture;
const backgroundController = new BackgroundController({
  scene,
  renderer,
  pmrem,
  fallbackEnvironmentTarget,
  baseBackground,
  editBackground,
  selectorEl: document.getElementById('background-selector') as HTMLDivElement | null,
  swatchButtons: Array.from(document.querySelectorAll('#background-swatches .background-swatch[data-hdri]')) as HTMLButtonElement[],
  blurInput: document.getElementById('background-blur') as HTMLInputElement | null,
  blurValue: document.getElementById('background-blur-value') as HTMLOutputElement | null,
  lightnessInput: document.getElementById('background-lightness') as HTMLInputElement | null,
  lightnessValue: document.getElementById('background-lightness-value') as HTMLOutputElement | null,
  controlsEl: document.getElementById('background-controls') as HTMLDivElement | null,
  getRenderMode: () => PARAMS.renderMode,
  getEditMode: () => PARAMS.editMode,
});

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.01, 100);
const DEFAULT_CAMERA_POSITION = new THREE.Vector3(3.9, 2.7, 3.9);
camera.position.copy(DEFAULT_CAMERA_POSITION);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
const worldUp = new THREE.Vector3(0, 1, 0);
let keyboardCamera: KeyboardCameraController;

let axisController: AxisGizmoController;
const visibleDims = () => axisController.visibleDims();
const currentAxisMap = (localN: number) => axisController.currentAxisMap(localN);
const perspectiveDimsFor = (localN: number, axisMap: AxisMap) => axisController.perspectiveDimsFor(localN, axisMap);
const wRotationPlaneAxis = (lockAxis: -1 | 0 | 1 | 2, depthDim: number) => axisController.wRotationPlaneAxis(lockAxis, depthDim, N);
const setProjectionAxes = (axes: ProjectionAxes) => axisController.setProjectionAxes(axes);
const cycleAxes = (step: number) => axisController.cycleAxes(step);
const renderAxisList = () => axisController.renderAxisList();
const updateAxisLegend = () => axisController.updateAxisLegend();
const updateAxisGizmo = () => axisController.updateAxisGizmo();
const applyAutoRotation = (dt: number) => axisController.applyAutoRotation(dt);
let projectionPipeline: ProjectionPipeline;
const applySliceFilter = () => projectionPipeline.applySliceFilter();
const projectAndRenderAll = () => projectionPipeline.projectAndRenderAll();
let transformController: TransformController;
let viewportInteraction: ViewportInteractionController;

const raycaster = new THREE.Raycaster();
const ndc = new THREE.Vector2();

const light = new THREE.DirectionalLight(0xffffff, 1.0);
light.position.set(2, 3, 4);
const ambient = new THREE.AmbientLight(0xffffff, 0.3);
const hemi = new THREE.HemisphereLight(0x88aaff, 0x090b12, 0.6);
scene.add(ambient, hemi, light);
const axes = new THREE.AxesHelper(1000);
axes.position.set(0, -0.6, 0);
scene.add(axes);
const gridGroup = createFadingGrid({ y: -0.6 });
scene.add(gridGroup);
const viewportCapture = new ViewportCaptureController({
  renderer,
  scene,
  camera,
  gridGroup,
  axes,
  recordButton: recordViewportButton,
  captureButton: captureFrameButton,
  timerEl: recordViewportTimer,
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
let pcaCache: Float32Array | null = null;
let projectionDirty = true;
let setViewMode: (mode: ViewMode) => void;
let sceneHistory: SceneHistory<SceneSnapshot<PrimitiveMode>>;
let baseLabel = 'Hypercube';
const BASE_SELECTION = -1;
const NO_SELECTION = -2;
let selectedInstance: number = BASE_SELECTION; // -1 base, >=0 extra, -2 none
let selectionOutline: THREE.LineSegments | null = null;
const baseTransform = { pos: new THREE.Vector3(), rot: new THREE.Vector3(), scale: new THREE.Vector3(1,1,1) };
let baseOriginalN = 0;
let baseAxisMap: AxisMap = Array.from({ length: MAX_N }, (_, i) => i);
let baseVisible = true;
let baseSurface: SurfaceState = cloneSurface(DEFAULT_SURFACE);
keyboardCamera = new KeyboardCameraController({
  camera,
  controls,
  defaultCameraPosition: DEFAULT_CAMERA_POSITION,
  worldUp,
  isTransformActive: () => transformController?.isActive() ?? false,
  onCameraChange: () => updateAxisGizmo(),
});
function cloneTransformState(transform: TransformState): TransformState {
  return {
    pos: transform.pos.clone(),
    rot: transform.rot.clone(),
    scale: transform.scale.clone(),
  };
}

function captureSnapshot(): SceneSnapshot<PrimitiveMode> {
  return {
    N,
    X: new Float32Array(X),
    E: new Uint32Array(E),
    M,
    source: dataSource,
    label: baseLabel,
    paramsN: PARAMS.N,
    primitive: PARAMS.primitive,
    axes: { x: PARAMS.axesX, y: PARAMS.axesY, z: PARAMS.axesZ },
    axesOrder: [...axisController.axesOrder],
    axesOffset: axisController.axesOffset,
    baseAxisMap: [...baseAxisMap],
    baseTransform: cloneTransformState(baseTransform),
    baseOrigN: baseOriginalN,
    baseVisible,
    baseSurface: cloneSurface(baseSurface),
    selectedInstance,
    instances: extraInstances.map(inst => ({
      X: new Float32Array(inst.X),
      E: new Uint32Array(inst.E),
      M: inst.M,
      offset: inst.offset.clone(),
      label: inst.label,
      kind: inst.kind,
      transform: cloneTransformState(inst.transform),
      originalN: inst.originalN,
      axisMap: [...inst.axisMap],
      visible: inst.visible,
      surface: cloneSurface(inst.surface),
    })),
  };
}

function pushUndoSnapshot() {
  sceneHistory.push();
}

function undoSceneSnapshot() {
  sceneHistory.undo();
}

function redoSceneSnapshot() {
  sceneHistory.redo();
}

function applySnapshot(snap: SceneSnapshot<PrimitiveMode>) {
  PARAMS.N = snap.paramsN;
  PARAMS.primitive = snap.primitive;
  rebuildState(snap.N, snap.X, snap.E, snap.source, snap.baseOrigN, snap.baseAxisMap);
  baseLabel = snap.label;
  PARAMS.axesX = snap.axes.x; PARAMS.axesY = snap.axes.y; PARAMS.axesZ = snap.axes.z;
  axisController.setAxisOrder(snap.axesOrder);
  axisController.axesOffset = snap.axesOffset;
  baseTransform.pos.copy(snap.baseTransform.pos);
  baseTransform.rot.copy(snap.baseTransform.rot);
  baseTransform.scale.copy(snap.baseTransform.scale);
  baseVisible = snap.baseVisible;
  baseSurface = normalizeSurface(snap.baseSurface);
  rendererND.setSurface(baseSurface);
  extraInstances.push(...snap.instances.map(restoreInstanceSnapshot));
  selectedInstance = snap.selectedInstance >= 0 && snap.selectedInstance < extraInstances.length
    ? snap.selectedInstance
    : (M > 0 ? BASE_SELECTION : NO_SELECTION);
  projectionDirty = true;
  projectAndRenderAll();
  applySliceFilter();
  updateDimensionControl();
  updateObjectList();
  selectObject(selectedInstance);
}

sceneHistory = new SceneHistory({
  capture: captureSnapshot,
  apply: applySnapshot,
  maxEntries: 20,
});

function getObjectVisible(idx: number) {
  if (idx === BASE_SELECTION) return M > 0 && baseVisible;
  return extraInstances[idx]?.visible ?? false;
}

function setObjectVisible(idx: number, visible: boolean, recordUndo = true) {
  if (recordUndo && getObjectVisible(idx) !== visible) pushUndoSnapshot();

  if (idx === -1) {
    baseVisible = visible;
  } else if (extraInstances[idx]) {
    extraInstances[idx].visible = visible;
  }

  applyObjectVisibility();
  if (!visible && idx === selectedInstance) {
    if (selectionOutline) { scene.remove(selectionOutline); selectionOutline = null; }
    transformController.clearSelectionVisuals();
  }
  selectObject(selectedInstance);
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

  const current = idx === -1 ? baseLabel : extraInstances[idx]?.label;
  if (!current || current === label) {
    updateObjectList();
    return;
  }

  pushUndoSnapshot();
  if (idx === -1) {
    baseLabel = label;
  } else {
    extraInstances[idx].label = label;
  }
  updateObjectList();
}

function updateObjectList() {
  objectListController.update();
}

function getSurfaceTarget(idx: number): { surface: SurfaceState; renderer: HypercubeRenderer; } | null {
  if (idx === BASE_SELECTION) return M > 0 ? { surface: baseSurface, renderer: rendererND } : null;
  const inst = extraInstances[idx];
  return inst ? { surface: inst.surface, renderer: inst.renderer } : null;
}

function applySurfaceToSelection(surface: SurfaceState, recordUndo: boolean) {
  const target = getSurfaceTarget(selectedInstance);
  if (!target) return false;
  const nextSurface = normalizeSurface(surface);
  const changed = !surfacesEqual(target.surface, nextSurface);
  if (changed && recordUndo) pushUndoSnapshot();

  if (changed) {
    if (selectedInstance === BASE_SELECTION) {
      baseSurface = nextSurface;
      rendererND.setSurface(baseSurface);
      rendererND.refreshSurface();
    } else {
      const inst = extraInstances[selectedInstance];
      if (!inst) return false;
      inst.surface = nextSurface;
      inst.renderer.setSurface(inst.surface);
      inst.renderer.refreshSurface();
    }
  }

  return changed;
}

const textureEditor = new TextureEditorController({
  renderer,
  scene,
  light,
  ambient,
  hemi,
  getSurfaceTarget: () => getSurfaceTarget(selectedInstance),
  applySurfaceToTarget: applySurfaceToSelection,
});

function selectObject(idx: number) {
  let normalizedIdx = idx;
  if (normalizedIdx === BASE_SELECTION && M <= 0) normalizedIdx = NO_SELECTION;
  if (normalizedIdx >= 0 && !extraInstances[normalizedIdx]) normalizedIdx = NO_SELECTION;
  if (normalizedIdx < NO_SELECTION) normalizedIdx = NO_SELECTION;

  selectedInstance = normalizedIdx;
  transformController.setSelectedVertex(-1);
  updateObjectList();
  if (selectionOutline) { scene.remove(selectionOutline); selectionOutline = null; }
  const buildOutline = (geom: THREE.BufferGeometry) => {
    const mat = new THREE.LineBasicMaterial({ color: 0xffa64d, transparent: true, opacity: 1, depthTest: false, depthWrite: false });
    const outline = new THREE.LineSegments(geom, mat);
    outline.renderOrder = 10;
    return outline;
  };
  if (normalizedIdx === BASE_SELECTION) {
    if (M > 0) selectionOutline = buildOutline(rendererND.line.geometry);
  } else if (normalizedIdx >= 0) {
    const inst = extraInstances[normalizedIdx];
    selectionOutline = buildOutline(inst.renderer.line.geometry);
  }
  if (selectionOutline && !PARAMS.editMode && getObjectVisible(normalizedIdx)) {
    scene.add(selectionOutline);
  }
  backgroundController.applySceneBackground(PARAMS.editMode);
  transformController.clearVertexMarker();
  transformController.clearVertexCloud();
  if (PARAMS.editMode && getObjectVisible(normalizedIdx)) updateVertexCloud(normalizedIdx);
  textureEditor.updatePanel();
  updateTransformActionButtons();
}

function updateSelectionOutline() {
  if (!selectionOutline) return;
  if (PARAMS.editMode || !getObjectVisible(selectedInstance)) {
    scene.remove(selectionOutline); selectionOutline = null;
    return;
  }
  if (!scene.children.includes(selectionOutline)) scene.add(selectionOutline);
}

function clearAxisGuide() {
  transformController.clearAxisGuide();
}

function updateAxisGuide() {
  transformController.updateAxisGuide();
}

function updateVertexCloud(instIdx: number) {
  transformController.updateVertexCloud(instIdx);
}

function placeVertexMarker(instIdx: number, vertexIdx: number) {
  transformController.placeVertexMarker(instIdx, vertexIdx);
}

function deleteSelected() {
  if (selectedInstance < 0) return;
  pushUndoSnapshot();
  const inst = extraInstances[selectedInstance];
  inst.renderer.dispose();
  extraInstances.splice(selectedInstance, 1);
  selectedInstance = NO_SELECTION;
  if (selectionOutline) { scene.remove(selectionOutline); selectionOutline = null; }
  projectAndRenderAll();
  applySliceFilter();
  updateObjectList();
  selectObject(selectedInstance);
}

const extraInstances: Instance[] = [];
const objectListController = new ObjectListController({
  getRows: () => [
    ...(M > 0 ? [{ idx: BASE_SELECTION, label: baseLabel, dimension: baseOriginalN || PARAMS.N, visible: baseVisible }] : []),
    ...extraInstances.map((inst, idx) => ({
      idx,
      label: inst.label,
      dimension: inst.originalN,
      visible: inst.visible,
    })),
  ],
  getSelectedIndex: () => selectedInstance,
  onSelect: idx => selectObject(idx),
  onToggleVisibility: (idx, visible) => setObjectVisible(idx, visible),
  onRename: (idx, value) => renameObject(idx, value),
  onAfterUpdate: () => updateAxisLegend(),
});

function restoreInstanceSnapshot(snap: InstanceSnapshot): Instance {
  const instanceRenderer = new HypercubeRenderer(scene);
  instanceRenderer.build(snap.M, snap.E);
  const surface = normalizeSurface(snap.surface);
  instanceRenderer.setSurface(surface);
  instanceRenderer.setMode(PARAMS.renderMode);

  return {
    renderer: instanceRenderer,
    Y: new Float32Array(3 * snap.M),
    X: new Float32Array(snap.X),
    E: new Uint32Array(snap.E),
    M: snap.M,
    offset: snap.offset.clone(),
    label: snap.label,
    kind: snap.kind,
    transform: cloneTransformState(snap.transform),
    originalN: snap.originalN,
    axisMap: normalizeAxisMap(snap.axisMap, snap.originalN),
    visible: snap.visible,
    surface,
  };
}

const rendererND = new HypercubeRenderer(scene);
if (M > 0) {
  rendererND.build(M, E);
  rendererND.setMode('solid');
}

// --- UI state ---
const PARAMS = {
  N: 4,
  primitive: 'hypercube' as PrimitiveMode,
  projection: 'Canonical' as ProjMode,
  // Slicing
  sliceDim: -1,
  sliceMin: -0.5,
  sliceMax: 0.5,
  renderMode: 'solid' as ViewMode,
  editMode: false,
  axesX: 0,
  axesY: 1,
  axesZ: 2,
};
transformController = new TransformController({
  scene,
  camera,
  renderer,
  raycaster,
  ndc,
  vertexGeo,
  statusBar: null,
  moveButton: transformMoveButton,
  rotateButton: transformRotateButton,
  scaleButton: transformScaleButton,
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
  getBaseOriginalN: () => baseOriginalN,
  getBaseAxisMap: () => baseAxisMap,
  getSelectedInstance: () => selectedInstance,
  getObjectVisible,
  visibleDims,
  perspectiveDimsFor,
  wRotationPlaneAxis,
  setProjectionDirty: dirty => { projectionDirty = dirty; },
  projectAndRenderAll,
  applySliceFilter,
  updateSelectionOutline,
  pushUndoSnapshot,
});
axisController = new AxisGizmoController({
  camera,
  controls,
  worldUp,
  axesHelper: axes,
  getParams: () => PARAMS,
  getN: () => N,
  getRot: () => rot,
  markProjectionDirty: () => { projectionDirty = true; },
  clearAxisGuide,
  projectAndRenderAll,
  applySceneBackground: () => backgroundController.applySceneBackground(PARAMS.editMode),
  setPaneCollapsed: collapsed => paneController.setCollapsed(collapsed),
  getPaneCollapsed: () => paneController.isCollapsed,
});
axisController.init();
projectionPipeline = new ProjectionPipeline({
  getN: () => N,
  getX: () => X,
  getM: () => M,
  getY: () => Y,
  getRot: () => rot,
  getProjector: () => projector,
  getPcaCache: () => pcaCache,
  setPcaCache: cache => { pcaCache = cache; },
  isProjectionDirty: () => projectionDirty,
  setProjectionDirty: dirty => { projectionDirty = dirty; },
  getParams: () => PARAMS,
  getRendererND: () => rendererND,
  getExtraInstances: () => extraInstances,
  getBaseTransform: () => baseTransform,
  getBaseOriginalN: () => baseOriginalN,
  getBaseAxisMap: () => baseAxisMap,
  visibleDims,
  perspectiveDimsFor,
  onPcaAxesChanged: newAxes => {
    PARAMS.axesX = newAxes.x;
    PARAMS.axesY = newAxes.y;
    PARAMS.axesZ = newAxes.z;
    axisController.axesOffset = axisController.axesOrder.indexOf(PARAMS.axesX);
    updateAxisLegend();
    renderAxisList();
  },
  applyObjectVisibility,
  updateSelectionOutline,
  updateVertexCloud: () => updateVertexCloud(selectedInstance),
  updateAxisGuide,
  applySceneBackground: () => backgroundController.applySceneBackground(PARAMS.editMode),
  clearVertexCloud: () => transformController.clearVertexCloud(),
  tmpN,
  tmpVec,
  tmpCenter,
});

function updateDimensionControl() {
  if (dimensionValue) dimensionValue.textContent = `${PARAMS.N}D`;
  if (dimensionDownButton) dimensionDownButton.disabled = PARAMS.N <= 3;
  if (dimensionUpButton) dimensionUpButton.disabled = PARAMS.N >= MAX_N;
}

function setNewPrimitiveDimension(value: number) {
  if (!Number.isFinite(value)) {
    updateDimensionControl();
    return;
  }
  const next = Math.max(3, Math.min(MAX_N, Math.round(value)));
  PARAMS.N = next;
  const nVis = visibleDims();
  axisController.axesOffset = (((axisController.axesOffset % nVis) + nVis) % nVis);
  const visibleOrder = axisController.axesOrder.slice(0, nVis);
  PARAMS.axesX = visibleOrder[axisController.axesOffset % nVis] ?? 0;
  PARAMS.axesY = visibleOrder[(axisController.axesOffset + 1) % nVis] ?? 1;
  PARAMS.axesZ = visibleOrder[(axisController.axesOffset + 2) % nVis] ?? 2;
  updateDimensionControl();
  renderAxisList();
  updateAxisLegend();
}

function updateEditModeToggle() {
  if (!editModeToggle) return;
  editModeToggle.classList.toggle('active', PARAMS.editMode);
  editModeToggle.setAttribute('aria-pressed', String(PARAMS.editMode));
}

function setEditMode(active: boolean) {
  PARAMS.editMode = active;
  backgroundController.applySceneBackground(PARAMS.editMode);
  updateEditModeToggle();

  transformController.setSelectedVertex(-1);
  transformController.clearVertexMarker();
  if (!PARAMS.editMode) {
    transformController.clearVertexCloud();
  } else {
    updateVertexCloud(selectedInstance);
  }
  updateSelectionOutline();
  updateTransformActionButtons();
}

function updateTransformActionButtons() {
  transformController.updateActionButtons();
}

function hasActiveSelection() {
  return (selectedInstance === BASE_SELECTION && M > 0) || selectedInstance >= 0;
}

function handleTransformConstraintKey(key: string) {
  return transformController.handleConstraintKey(key);
}

const primitiveMenuOptions: { label: string; kind: PrimitiveKind }[] = [
  { label: 'Hypercube', kind: 'hypercube' },
  { label: 'Cross polytope', kind: 'cross' },
  { label: 'Simplex', kind: 'simplex' },
  { label: 'Simplex prism', kind: 'simplexPrism' },
];

viewportInteraction = new ViewportInteractionController({
  renderer,
  camera,
  controls,
  raycaster,
  ndc,
  tooltipEl,
  contextMenuEl: ctxMenu,
  statusBar: null,
  keyboardCamera,
  transformController,
  primitiveMenuOptions,
  baseSelection: BASE_SELECTION,
  noSelection: NO_SELECTION,
  getParams: () => PARAMS,
  setSliceDim: dim => { PARAMS.sliceDim = dim; },
  getN: () => N,
  getX: () => X,
  getM: () => M,
  getBaseVisible: () => baseVisible,
  getSelectedInstance: () => selectedInstance,
  getRendererND: () => rendererND,
  getExtraInstances: () => extraInstances,
  selectObject,
  placeVertexMarker,
  pushUndoSnapshot,
  addPrimitiveInstanceAt,
  deleteSelected,
  hasActiveSelection,
  applySliceFilter,
  cycleAxes,
});

function createPrimitiveData(kind: PrimitiveKind, dimension: number): InstanceGeometryData {
  const data = buildPrimitive(kind, dimension);
  const axisMap = currentAxisMap(dimension);
  return {
    verts: embedToMax(data.verts, dimension, axisMap),
    edges: data.edges,
    V: data.V,
    kind,
    axisMap,
    originalN: dimension,
  };
}

function insertInstance(data: InstanceGeometryData, offset: THREE.Vector3, label: string, surface: SurfaceState, syncMode = true) {
  extraInstances.push(createSceneInstance({
    scene,
    projector,
    data,
    offset,
    label,
    surface,
    renderMode: PARAMS.renderMode,
    sliceDim: PARAMS.sliceDim,
    sliceMin: PARAMS.sliceMin,
    sliceMax: PARAMS.sliceMax,
    projectionN: MAX_N,
  }));
  projectAndRenderAll();
  applySliceFilter();
  if (syncMode && setViewMode) setViewMode(PARAMS.renderMode);
  updateObjectList();
}

function addPrimitiveInstanceAt(kind: PrimitiveKind, label: string, offset: THREE.Vector3, syncMode = true) {
  insertInstance(createPrimitiveData(kind, PARAMS.N), offset, label, cloneSurface(DEFAULT_SURFACE), syncMode);
}

function clearExtraInstances() {
  extraInstances.forEach(inst => inst.renderer.dispose());
  extraInstances.length = 0;
  selectedInstance = NO_SELECTION;
}

function addInstanceAt(offset: THREE.Vector3, recordUndo = true) {
  if (recordUndo) pushUndoSnapshot();
  let data: InstanceGeometryData;
  if (M > 0 && baseVisible) {
    data = {
      verts: new Float32Array(X),
      edges: new Uint32Array(E),
      V: M,
      kind: PARAMS.primitive,
      axisMap: [...baseAxisMap],
      originalN: baseOriginalN || PARAMS.N,
    };
  } else {
    data = createPrimitiveData(PARAMS.primitive, PARAMS.N);
  }
  const surface = M > 0 && baseVisible ? cloneSurface(baseSurface) : cloneSurface(DEFAULT_SURFACE);
  const label = `${data.kind} #${extraInstances.length + 1}`;
  insertInstance(data, offset, label, surface);
}

function rebuildState(newN: number, newX: Float32Array, newE: Uint32Array, source: DataSource, localN?: number, axisMap?: AxisMap) {
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
  pcaCache = null;
  projectionDirty = true;
  clearExtraInstances();
  baseVisible = true;
  baseTransform.pos.set(0,0,0);
  baseTransform.rot.set(0,0,0);
  baseTransform.scale.set(1,1,1);
  baseOriginalN = localN ?? visibleDims();
  baseAxisMap = normalizeAxisMap(axisMap, baseOriginalN);
  baseSurface = cloneSurface(DEFAULT_SURFACE);
  axisController.resetAxisOrder(N);
  PARAMS.axesX = axisController.axesOrder[0] ?? 0;
  PARAMS.axesY = axisController.axesOrder[1] ?? 1;
  PARAMS.axesZ = axisController.axesOrder[2] ?? 2;
  if (PARAMS.sliceDim >= ambientN) PARAMS.sliceDim = ambientN - 1;
  if (M > 0) {
    rendererND.build(M, E);
    rendererND.setSurface(baseSurface);
    rendererND.setMode(PARAMS.renderMode);
    if (setViewMode) setViewMode(currentMode);
    projectAndRenderAll();
    applySliceFilter();
  } else {
    // no base geometry
    rendererND.dispose?.();
  }
  updateDimensionControl();
  baseLabel = source === 'custom' ? 'Custom' : 'Hypercube';
  updateObjectList();
  selectObject(BASE_SELECTION);
  updateAxisLegend();
  renderAxisList();
}

function resetToIsometric() {
  const targetN = 6;
  PARAMS.N = targetN;
  PARAMS.primitive = 'hypercube';
  PARAMS.projection = 'PCA';
  axisController.clearDynamicState();
  PARAMS.renderMode = 'faceted';
  PARAMS.sliceDim = -1;
  PARAMS.sliceMin = -0.5;
  PARAMS.sliceMax = 0.5;

  const rebuilt = buildPrimitive(PARAMS.primitive, targetN);
  const axisMap = canonicalAxisMap(targetN);
  const embedded = embedToMax(rebuilt.verts, targetN, axisMap);
  rebuildState(MAX_N, embedded, rebuilt.edges, 'primitive', targetN, axisMap);

  controls.reset();
  camera.position.copy(DEFAULT_CAMERA_POSITION);
}
projectAndRenderAll();
applySliceFilter();
updateAxisLegend();
renderAxisList();
updateObjectList();
backgroundController.applySceneBackground(PARAMS.editMode);
updateDimensionControl();
updateEditModeToggle();
textureEditor.initialize();
backgroundController.initializeRenderControls();
void backgroundController.initializeSelector();

const viewModeController = new ViewModeController({
  getMode: () => PARAMS.renderMode,
  setMode: mode => setViewMode(mode),
});
setViewMode = (mode: ViewMode) => {
  PARAMS.renderMode = mode;
  rendererND.setMode(mode);
  rendererND.refreshSurface();
  extraInstances.forEach(inst => {
    inst.renderer.setMode(mode);
    inst.renderer.refreshSurface();
  });
  textureEditor.updatePanel();
  viewModeController.syncButtons();
  backgroundController.syncForRenderMode();
};
viewModeController.bind();
backgroundController.syncForRenderMode();

if (M === 0 && extraInstances.length === 0) {
  addInstanceAt(new THREE.Vector3(0, 0, 0), false);
  selectObject(0);
}

viewportCapture.bindControls();
modalOverlayController.bindControls();
editModeToggle?.addEventListener('click', () => setEditMode(!PARAMS.editMode));
[
  { el: transformMoveButton, mode: 'move' as TransformMode },
  { el: transformRotateButton, mode: 'rotate' as TransformMode },
  { el: transformScaleButton, mode: 'scale' as TransformMode },
].forEach(entry => {
  entry.el?.addEventListener('pointerdown', ev => transformController.beginToolbarDrag(entry.mode, ev));
});
dimensionDownButton?.addEventListener('click', () => setNewPrimitiveDimension(PARAMS.N - 1));
dimensionUpButton?.addEventListener('click', () => setNewPrimitiveDimension(PARAMS.N + 1));
new KeyboardShortcutController({
  isModalOpen: () => modalOverlayController.isOpen(),
  getTransformMode: () => transformController.mode,
  handleTransformConstraintKey,
  keyboardCamera,
  setViewMode: mode => setViewMode(mode),
  toggleRecording: () => viewportCapture.toggleRecording(),
  captureFrame: () => viewportCapture.captureFrame(),
  toggleEditMode: () => setEditMode(!PARAMS.editMode),
  startTransformFromPointer: mode => viewportInteraction.startTransformFromLastPointer(mode),
  showAddObjectMenuAtPointer: () => viewportInteraction.showAddObjectMenuAtLastPointer(),
  deleteOrConfirmSelection: () => viewportInteraction.deleteOrConfirmSelection(),
  hasSelection: hasActiveSelection,
  undo: undoSceneSnapshot,
  redo: redoSceneSnapshot,
}).bind();

updateTransformActionButtons();
paneController.syncToViewport(true);
modalOverlayController.initializeMobileOnboarding();
viewportInteraction.bind();

// --- Animation ---
const clock = new THREE.Clock();

function animate() {
  const dt = Math.min(clock.getDelta(), 0.05);
  applyAutoRotation(dt);

  projectAndRenderAll();

  controls.update();
  keyboardCamera.update(dt);
  updateTransformActionButtons();
  updateAxisGizmo();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
animate();

// --- Resize ---
window.addEventListener('resize', () => {
  const w = window.innerWidth, h = window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
  paneController.syncToViewport();
  textureEditor.updatePanel();
});
