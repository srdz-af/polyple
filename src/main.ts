
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { FullScreenQuad, Pass } from 'three/examples/jsm/postprocessing/Pass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
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
import {
  KeyframeTimelineController,
  type AnimationKeyframeState,
} from './animation/KeyframeTimelineController';
import { createSceneInstance, type InstanceGeometryData } from './scene/instanceFactory';
import { cloneObjectOrigin, computeObjectOrigin, type ObjectOrigin } from './scene/objectOrigin';
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

type PrimitiveMode = PrimitiveKind;

const DEFAULT_BLOOM_INTENSITY = 0;
const DEFAULT_MOTION_BLUR_INTENSITY = 0;
const MAX_VIEWPORT_PIXEL_RATIO = 2;
const LOW_RES_CAPTURE_PIXEL_RATIO_SCALE = 0.5;

class SmoothAfterimagePass extends Pass {
  uniforms: {
    tOld: THREE.IUniform<THREE.Texture | null>;
    tNew: THREE.IUniform<THREE.Texture | null>;
    blend: THREE.IUniform<number>;
  };

  private textureComp: THREE.WebGLRenderTarget;
  private textureOld: THREE.WebGLRenderTarget;
  private readonly compFsMaterial: THREE.ShaderMaterial;
  private readonly compFsQuad: FullScreenQuad;
  private readonly copyFsMaterial: THREE.MeshBasicMaterial;
  private readonly copyFsQuad: FullScreenQuad;
  private initialized = false;

  constructor(blend = 0.74) {
    super();

    this.uniforms = {
      tOld: { value: null },
      tNew: { value: null },
      blend: { value: blend },
    };

    this.textureComp = this.createTarget(window.innerWidth, window.innerHeight);
    this.textureOld = this.createTarget(window.innerWidth, window.innerHeight);
    this.compFsMaterial = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: `
        varying vec2 vUv;

        void main() {
          vUv = uv;
          gl_Position = vec4(position.xy, 0.0, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D tOld;
        uniform sampler2D tNew;
        uniform float blend;
        varying vec2 vUv;

        void main() {
          vec4 oldColor = texture2D(tOld, vUv);
          vec4 newColor = texture2D(tNew, vUv);
          gl_FragColor = mix(newColor, oldColor, blend);
        }
      `,
    });
    this.compFsQuad = new FullScreenQuad(this.compFsMaterial);
    this.copyFsMaterial = new THREE.MeshBasicMaterial();
    this.copyFsQuad = new FullScreenQuad(this.copyFsMaterial);
  }

  private createTarget(width: number, height: number) {
    return new THREE.WebGLRenderTarget(width, height, {
      magFilter: THREE.LinearFilter,
      minFilter: THREE.LinearFilter,
      type: THREE.HalfFloatType,
      depthBuffer: false,
      stencilBuffer: false,
    });
  }

  render(renderer: THREE.WebGLRenderer, writeBuffer: THREE.WebGLRenderTarget, readBuffer: THREE.WebGLRenderTarget) {
    if (!this.initialized) {
      this.copy(readBuffer.texture, renderer, this.textureOld);
      this.output(readBuffer.texture, renderer, writeBuffer);
      this.initialized = true;
      return;
    }

    this.uniforms.tOld.value = this.textureOld.texture;
    this.uniforms.tNew.value = readBuffer.texture;

    renderer.setRenderTarget(this.textureComp);
    this.compFsQuad.render(renderer);

    this.output(this.textureComp.texture, renderer, writeBuffer);

    const temp = this.textureOld;
    this.textureOld = this.textureComp;
    this.textureComp = temp;
  }

  setSize(width: number, height: number) {
    this.textureComp.setSize(width, height);
    this.textureOld.setSize(width, height);
    this.reset();
  }

  reset() {
    this.initialized = false;
  }

  dispose() {
    this.textureComp.dispose();
    this.textureOld.dispose();
    this.compFsMaterial.dispose();
    this.copyFsMaterial.dispose();
    this.compFsQuad.dispose();
    this.copyFsQuad.dispose();
  }

  private copy(texture: THREE.Texture, renderer: THREE.WebGLRenderer, target: THREE.WebGLRenderTarget) {
    this.copyFsMaterial.map = texture;
    renderer.setRenderTarget(target);
    this.copyFsQuad.render(renderer);
  }

  private output(texture: THREE.Texture, renderer: THREE.WebGLRenderer, writeBuffer: THREE.WebGLRenderTarget) {
    this.copyFsMaterial.map = texture;

    if (this.renderToScreen) {
      renderer.setRenderTarget(null);
    } else {
      renderer.setRenderTarget(writeBuffer);
      if (this.clear) renderer.clear();
    }

    this.copyFsQuad.render(renderer);
  }
}

const app = document.getElementById('app')!;
const tooltipEl = document.getElementById('tooltip') as HTMLDivElement | null;
const ctxMenu = document.getElementById('context-menu') as HTMLDivElement | null;
const renderAnimationButton = document.getElementById('render-animation-button') as HTMLButtonElement | null;
const recordViewportButton = document.getElementById('record-viewport-button') as HTMLButtonElement | null;
const recordViewportTimer = document.getElementById('record-viewport-timer') as HTMLSpanElement | null;
const captureFrameButton = document.getElementById('capture-frame-button') as HTMLButtonElement | null;
const cameraViewOverlay = document.getElementById('camera-view-overlay') as HTMLDivElement | null;
const editModeToggle = document.getElementById('edit-mode-toggle') as HTMLButtonElement | null;
const transformMoveButton = document.getElementById('transform-move-button') as HTMLButtonElement | null;
const transformRotateButton = document.getElementById('transform-rotate-button') as HTMLButtonElement | null;
const transformScaleButton = document.getElementById('transform-scale-button') as HTMLButtonElement | null;
const dimensionValue = document.getElementById('dimension-value') as HTMLOutputElement | null;
const dimensionDownButton = document.getElementById('dimension-down') as HTMLButtonElement | null;
const dimensionUpButton = document.getElementById('dimension-up') as HTMLButtonElement | null;
const cameraRecenterButton = document.getElementById('camera-recenter-button') as HTMLButtonElement | null;
const focusResetButton = document.getElementById('focus-reset-button') as HTMLButtonElement | null;
const bloomIntensityInput = document.getElementById('bloom-intensity') as HTMLInputElement | null;
const bloomIntensityValue = document.getElementById('bloom-intensity-value') as HTMLOutputElement | null;
const motionBlurIntensityInput = document.getElementById('motion-blur-intensity') as HTMLInputElement | null;
const motionBlurIntensityValue = document.getElementById('motion-blur-intensity-value') as HTMLOutputElement | null;
const modalOverlayController = new ModalOverlayController();
const paneController = new PaneController();

// --- Three.js setup ---
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
app.appendChild(renderer.domElement);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.setPixelRatio(Math.min(window.devicePixelRatio, MAX_VIEWPORT_PIXEL_RATIO));

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
  qualityButtons: Array.from(document.querySelectorAll('#background-quality-toggle button[data-hdri-quality]')) as HTMLButtonElement[],
  controlsEl: document.getElementById('background-controls') as HTMLDivElement | null,
  getRenderMode: () => PARAMS.renderMode,
  getEditMode: () => PARAMS.editMode,
});

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.01, 100);
const DEFAULT_CAMERA_POSITION = new THREE.Vector3(3.9, 2.7, 3.9);
camera.position.copy(DEFAULT_CAMERA_POSITION);
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0, 0.58, 0.22);
const afterimagePass = new SmoothAfterimagePass();
composer.addPass(bloomPass);
composer.addPass(afterimagePass);
const captureResolutionViewportSize = new THREE.Vector2();
const fullViewportPixelRatio = () => Math.min(window.devicePixelRatio, MAX_VIEWPORT_PIXEL_RATIO);
let downsampleSceneOnly = false;

function setCaptureResolutionMode(fullResolution: boolean) {
  renderer.getSize(captureResolutionViewportSize);
  const fullPixelRatio = fullViewportPixelRatio();
  const scenePixelRatio = fullResolution
    ? fullPixelRatio
    : Math.max(0.25, fullPixelRatio * LOW_RES_CAPTURE_PIXEL_RATIO_SCALE);
  downsampleSceneOnly = !fullResolution;

  renderer.setPixelRatio(fullPixelRatio);
  renderer.setSize(captureResolutionViewportSize.x, captureResolutionViewportSize.y, false);
  composer.setPixelRatio(scenePixelRatio);
  composer.setSize(captureResolutionViewportSize.x, captureResolutionViewportSize.y);
}

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
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
const referenceLineDepthMaterial = new THREE.MeshBasicMaterial();
referenceLineDepthMaterial.colorWrite = false;
referenceLineDepthMaterial.depthWrite = true;
referenceLineDepthMaterial.depthTest = true;
let animationTimeline: KeyframeTimelineController | null = null;
let animationVideoRendering = false;
const viewportCapture = new ViewportCaptureController({
  renderer,
  scene,
  camera,
  gridGroup,
  axes,
  cameraOverlayEl: cameraViewOverlay,
  renderButton: renderAnimationButton,
  recordButton: recordViewportButton,
  captureButton: captureFrameButton,
  timerEl: recordViewportTimer,
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
let sceneHistory: SceneHistory<SceneSnapshot<PrimitiveMode>>;
let baseLabel = 'Hypercube';
const BASE_SELECTION = -1;
const NO_SELECTION = -2;
let selectedInstance: number = BASE_SELECTION; // -1 base, >=0 extra, -2 none
let selectionOutline: THREE.LineSegments | null = null;
const baseTransform = { pos: new THREE.Vector3(), rot: new THREE.Vector3(), scale: new THREE.Vector3(1,1,1) };
let baseOrigin: ObjectOrigin = new Float32Array(MAX_N);
let baseOriginalN = 0;
let baseAxisMap: AxisMap = Array.from({ length: MAX_N }, (_, i) => i);
let baseVisible = true;
let baseSurface: SurfaceState = cloneSurface(DEFAULT_SURFACE);
let baseSurfaceTopology: PrimitiveSurfaceTopology | undefined;
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
    baseSurface: cloneSurface(baseSurface),
    selectedInstance,
    instances: extraInstances.map(inst => ({
      X: new Float32Array(inst.X),
      E: new Uint32Array(inst.E),
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
  rebuildState(snap.N, snap.X, snap.E, snap.source, snap.baseOrigN, snap.baseAxisMap, snap.surfaceTopology);
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
  baseSurface = normalizeSurface(snap.baseSurface);
  rendererND.setSurface(baseSurface);
  extraInstances.push(...snap.instances.map(restoreInstanceSnapshot));
  selectedInstance = snap.selectedInstance >= 0 && snap.selectedInstance < extraInstances.length
    ? snap.selectedInstance
    : (M > 0 ? BASE_SELECTION : NO_SELECTION);
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

function getObjectOrigin(idx: number) {
  if (idx === BASE_SELECTION) return M > 0 ? baseOrigin : null;
  return extraInstances[idx]?.origin ?? null;
}

function getObjectOriginWorldPosition(idx: number, target = new THREE.Vector3()) {
  if (idx === BASE_SELECTION && M > 0 && baseVisible) return target.copy(rendererND.originPosition);
  const inst = extraInstances[idx];
  if (!inst || !inst.visible) return null;
  return target.copy(inst.renderer.originPosition);
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
  applySliceFilter();
  updateSelectionOutline();
}

function focusObjectOrigin(idx: number) {
  const origin = getObjectOriginWorldPosition(idx, tmpVec);
  if (!origin) return;
  keyboardCamera.focusOn(origin);
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
  instanceRenderer.build(snap.M, snap.E, snap.surfaceTopology);
  const surface = normalizeSurface(snap.surface);
  instanceRenderer.setSurface(surface);
  instanceRenderer.setMode(PARAMS.renderMode);

  return {
    renderer: instanceRenderer,
    Y: new Float32Array(3 * snap.M),
    X: new Float32Array(snap.X),
    E: new Uint32Array(snap.E),
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
    surface,
  };
}

const rendererND = new HypercubeRenderer(scene);
if (M > 0) {
  rendererND.build(M, E, baseSurfaceTopology);
  rendererND.setMode('solid');
}

// --- UI state ---
const PARAMS = {
  N: 4,
  primitive: 'hypercube' as PrimitiveMode,
  // Slicing
  sliceDim: -1,
  sliceMin: -0.5,
  sliceMax: 0.5,
  renderMode: 'solid' as ViewMode,
  editMode: false,
  axesX: 0,
  axesY: 1,
  axesZ: 2,
  bloomIntensity: DEFAULT_BLOOM_INTENSITY,
  motionBlurIntensity: DEFAULT_MOTION_BLUR_INTENSITY,
};

function clamp01(value: number) {
  return Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
}

function motionBlurBlendFromIntensity(intensity: number) {
  if (intensity <= 0) return 0;
  return 0.54 + (clamp01(intensity) * 0.4);
}

function syncRenderEffects() {
  PARAMS.bloomIntensity = clamp01(PARAMS.bloomIntensity);
  PARAMS.motionBlurIntensity = clamp01(PARAMS.motionBlurIntensity);

  bloomPass.enabled = PARAMS.bloomIntensity > 0.001;
  bloomPass.strength = PARAMS.bloomIntensity * 1.6;
  bloomPass.radius = 0.46 + (PARAMS.bloomIntensity * 0.28);
  bloomPass.threshold = 0.22;

  afterimagePass.enabled = PARAMS.motionBlurIntensity > 0.001;
  afterimagePass.uniforms.blend.value = motionBlurBlendFromIntensity(PARAMS.motionBlurIntensity);
  if (!afterimagePass.enabled) afterimagePass.reset();

  if (bloomIntensityInput) bloomIntensityInput.value = PARAMS.bloomIntensity.toFixed(2);
  if (bloomIntensityValue) bloomIntensityValue.textContent = PARAMS.bloomIntensity.toFixed(2);
  if (motionBlurIntensityInput) motionBlurIntensityInput.value = PARAMS.motionBlurIntensity.toFixed(2);
  if (motionBlurIntensityValue) motionBlurIntensityValue.textContent = PARAMS.motionBlurIntensity.toFixed(2);
}

function hasRenderEffects() {
  return bloomPass.enabled || afterimagePass.enabled;
}

function lerpNumber(a: number, b: number, t: number) {
  return a + ((b - a) * t);
}

function lerpVector(a: THREE.Vector3, b: THREE.Vector3, t: number) {
  return new THREE.Vector3(
    lerpNumber(a.x, b.x, t),
    lerpNumber(a.y, b.y, t),
    lerpNumber(a.z, b.z, t),
  );
}

function slerpDirection(a: THREE.Vector3, b: THREE.Vector3, t: number) {
  const from = a.clone().normalize();
  const to = b.clone().normalize();
  const dot = Math.max(-1, Math.min(1, from.dot(to)));

  if (dot > 0.9995) {
    return from.lerp(to, t).normalize();
  }

  if (dot < -0.9995) {
    const seed = Math.abs(from.x) < 0.9
      ? new THREE.Vector3(1, 0, 0)
      : new THREE.Vector3(0, 1, 0);
    const orthogonal = seed.sub(from.clone().multiplyScalar(seed.dot(from))).normalize();
    return from
      .multiplyScalar(Math.cos(Math.PI * t))
      .addScaledVector(orthogonal, Math.sin(Math.PI * t))
      .normalize();
  }

  const theta = Math.acos(dot);
  const sinTheta = Math.sin(theta);
  return from
    .multiplyScalar(Math.sin((1 - t) * theta) / sinTheta)
    .addScaledVector(to, Math.sin(t * theta) / sinTheta)
    .normalize();
}

function interpolateCameraPosition(
  fromPosition: THREE.Vector3,
  fromTarget: THREE.Vector3,
  toPosition: THREE.Vector3,
  toTarget: THREE.Vector3,
  t: number,
) {
  const target = lerpVector(fromTarget, toTarget, t);
  const fromOffset = fromPosition.clone().sub(fromTarget);
  const toOffset = toPosition.clone().sub(toTarget);
  const fromDistance = fromOffset.length();
  const toDistance = toOffset.length();

  if (fromDistance < 1e-6 || toDistance < 1e-6) {
    return lerpVector(fromPosition, toPosition, t);
  }

  const direction = slerpDirection(fromOffset, toOffset, t);
  return target.addScaledVector(direction, lerpNumber(fromDistance, toDistance, t));
}

function completeAxisOrder(order: number[]) {
  const next = order.filter(dim => Number.isInteger(dim) && dim >= 0 && dim < MAX_N);
  for (let dim = 0; dim < MAX_N; dim++) {
    if (!next.includes(dim)) next.push(dim);
  }
  return next.slice(0, MAX_N);
}

function orthonormalizeRows(raw: Float32Array, dimension: number) {
  const out = new Float32Array(raw);
  const row = new Float32Array(dimension);

  for (let r = 0; r < dimension; r++) {
    for (let c = 0; c < dimension; c++) row[c] = out[r * dimension + c] ?? 0;

    for (let prev = 0; prev < r; prev++) {
      let dot = 0;
      for (let c = 0; c < dimension; c++) dot += row[c] * out[prev * dimension + c];
      for (let c = 0; c < dimension; c++) row[c] -= dot * out[prev * dimension + c];
    }

    let lenSq = 0;
    for (let c = 0; c < dimension; c++) lenSq += row[c] * row[c];

    if (lenSq < 1e-8) {
      row.fill(0);
      row[r] = 1;
      for (let prev = 0; prev < r; prev++) {
        let dot = 0;
        for (let c = 0; c < dimension; c++) dot += row[c] * out[prev * dimension + c];
        for (let c = 0; c < dimension; c++) row[c] -= dot * out[prev * dimension + c];
      }
      lenSq = 0;
      for (let c = 0; c < dimension; c++) lenSq += row[c] * row[c];
    }

    const invLen = lenSq > 1e-8 ? 1 / Math.sqrt(lenSq) : 1;
    for (let c = 0; c < dimension; c++) out[r * dimension + c] = row[c] * invLen;
  }

  return out;
}

function captureAnimationState(): AnimationKeyframeState {
  return {
    dimension: N,
    rotMatrix: new Float32Array(rot.matrix),
    axesOrder: completeAxisOrder(axisController.axesOrder),
    axesOffset: axisController.axesOffset,
    renderMode: PARAMS.renderMode,
    bloomIntensity: PARAMS.bloomIntensity,
    motionBlurIntensity: PARAMS.motionBlurIntensity,
    cameraPosition: camera.position.clone(),
    cameraTarget: controls.target.clone(),
    cameraUp: camera.up.clone(),
    cameraFov: camera.fov,
    cameraZoom: camera.zoom,
  };
}

function interpolateAnimationState(from: AnimationKeyframeState, to: AnimationKeyframeState, t: number): AnimationKeyframeState {
  const dimension = from.dimension === to.dimension ? from.dimension : N;
  const matrixLength = dimension * dimension;
  const blended = new Float32Array(matrixLength);
  const cameraTarget = lerpVector(from.cameraTarget, to.cameraTarget, t);
  if (from.rotMatrix.length === matrixLength && to.rotMatrix.length === matrixLength) {
    for (let i = 0; i < matrixLength; i++) blended[i] = lerpNumber(from.rotMatrix[i], to.rotMatrix[i], t);
  } else {
    blended.set(rot.matrix.slice(0, matrixLength));
  }

  return {
    dimension,
    rotMatrix: orthonormalizeRows(blended, dimension),
    axesOrder: t < 0.5 ? completeAxisOrder(from.axesOrder) : completeAxisOrder(to.axesOrder),
    axesOffset: Math.round(lerpNumber(from.axesOffset, to.axesOffset, t)),
    renderMode: t < 0.5 ? from.renderMode : to.renderMode,
    bloomIntensity: lerpNumber(from.bloomIntensity, to.bloomIntensity, t),
    motionBlurIntensity: lerpNumber(from.motionBlurIntensity, to.motionBlurIntensity, t),
    cameraPosition: interpolateCameraPosition(from.cameraPosition, from.cameraTarget, to.cameraPosition, to.cameraTarget, t),
    cameraTarget,
    cameraUp: lerpVector(from.cameraUp, to.cameraUp, t).normalize(),
    cameraFov: lerpNumber(from.cameraFov, to.cameraFov, t),
    cameraZoom: lerpNumber(from.cameraZoom, to.cameraZoom, t),
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
  syncRenderEffects();

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

function renderReferenceLinesClean(gridWasVisible: boolean, axesWereVisible: boolean) {
  if (!gridWasVisible && !axesWereVisible) return;

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
    child.visible = (child === gridGroup && gridWasVisible) || (child === axes && axesWereVisible);
  }
  renderer.render(scene, camera);

  for (const { child, visible } of childVisibility) child.visible = visible;
  scene.background = previousBackground;
  scene.overrideMaterial = previousOverrideMaterial;
  renderer.autoClear = previousAutoClear;
}

function renderEffectsFrame() {
  const gridWasVisible = gridGroup.visible;
  const axesWereVisible = axes.visible;

  gridGroup.visible = false;
  axes.visible = false;
  composer.render();

  gridGroup.visible = gridWasVisible;
  axes.visible = axesWereVisible;
  renderReferenceLinesClean(gridWasVisible, axesWereVisible);
}

function renderViewportFrame() {
  projectAndRenderAll();
  controls.update();
  updateTransformActionButtons();
  updateAxisGizmo();
  if (hasRenderEffects() || downsampleSceneOnly) renderEffectsFrame();
  else renderer.render(scene, camera);
}

function bindRenderEffectControls() {
  bloomIntensityInput?.addEventListener('input', () => {
    PARAMS.bloomIntensity = clamp01(Number.parseFloat(bloomIntensityInput.value));
    syncRenderEffects();
  });
  motionBlurIntensityInput?.addEventListener('input', () => {
    PARAMS.motionBlurIntensity = clamp01(Number.parseFloat(motionBlurIntensityInput.value));
    syncRenderEffects();
  });
  syncRenderEffects();
}

transformController = new TransformController({
  scene,
  camera,
  renderer,
  raycaster,
  ndc,
  vertexGeo,
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
  getObjectOrigin,
  getBaseOriginalN: () => baseOriginalN,
  getBaseAxisMap: () => baseAxisMap,
  getSelectedInstance: () => selectedInstance,
  getObjectVisible,
  visibleDims,
  perspectiveDimsFor,
  primaryExtraRotationDepthDim: (localN, axisMap) => axisController.primaryExtraRotationDepthDim(localN, axisMap),
  extraRotationPlaneAxis,
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
  axisController.normalizeVisibleAxes(next);
  updateDimensionControl();
  renderAxisList();
  updateAxisLegend();
  projectAndRenderAll();
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
  { label: 'Spiked hypercube', kind: 'spikedHypercube' },
  { label: 'Cross polytope', kind: 'cross' },
  { label: 'Simplex', kind: 'simplex' },
  { label: 'Simplex prism', kind: 'simplexPrism' },
  { label: 'Demicube', kind: 'demicube' },
  { label: '24-cell', kind: 'cell24' },
  { label: 'Duoprism', kind: 'duoprism' },
];

viewportInteraction = new ViewportInteractionController({
  renderer,
  camera,
  controls,
  raycaster,
  ndc,
  tooltipEl,
  contextMenuEl: ctxMenu,
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
  insertKeyframe: () => animationTimeline?.addKeyframeAtCurrentFrame(),
  removeLastKeyframe: () => animationTimeline?.removeLastKeyframe(),
  deleteSelected,
  hasActiveSelection,
  recalculateSelectedOrigin: () => recalculateObjectOrigin(selectedInstance),
  focusObjectOrigin,
  applySliceFilter,
  cycleAxes,
});

function createPrimitiveData(kind: PrimitiveKind, dimension: number): InstanceGeometryData {
  const data = buildPrimitive(kind, dimension);
  const axisMap = currentAxisMap(dimension);
  const verts = embedToMax(data.verts, dimension, axisMap);
  return {
    verts,
    edges: data.edges,
    surfaceTopology: clonePrimitiveSurfaceTopology(data.surfaceTopology),
    V: data.V,
    kind,
    axisMap,
    originalN: dimension,
    origin: computeObjectOrigin(verts, data.V, MAX_N),
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
  const surface = M > 0 && baseVisible ? cloneSurface(baseSurface) : cloneSurface(DEFAULT_SURFACE);
  const label = `${data.kind} #${extraInstances.length + 1}`;
  insertInstance(data, offset, label, surface);
}

function rebuildState(
  newN: number,
  newX: Float32Array,
  newE: Uint32Array,
  source: DataSource,
  localN?: number,
  axisMap?: AxisMap,
  surfaceTopology?: PrimitiveSurfaceTopology,
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
  baseSurface = cloneSurface(DEFAULT_SURFACE);
  baseSurfaceTopology = clonePrimitiveSurfaceTopology(surfaceTopology);
  axisController.resetAxisOrder(N);
  PARAMS.axesX = axisController.axesOrder[0] ?? 0;
  PARAMS.axesY = axisController.axesOrder[1] ?? 1;
  PARAMS.axesZ = axisController.axesOrder[2] ?? 2;
  if (PARAMS.sliceDim >= ambientN) PARAMS.sliceDim = ambientN - 1;
  if (M > 0) {
    rendererND.build(M, E, baseSurfaceTopology);
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
  axisController.clearDynamicState();
  PARAMS.renderMode = 'faceted';
  PARAMS.sliceDim = -1;
  PARAMS.sliceMin = -0.5;
  PARAMS.sliceMax = 0.5;

  const rebuilt = buildPrimitive(PARAMS.primitive, targetN);
  const axisMap = canonicalAxisMap(targetN);
  const embedded = embedToMax(rebuilt.verts, targetN, axisMap);
  rebuildState(MAX_N, embedded, rebuilt.edges, 'primitive', targetN, axisMap, rebuilt.surfaceTopology);

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

animationTimeline = new KeyframeTimelineController({
  captureState: captureAnimationState,
  applyState: applyAnimationState,
  interpolateState: interpolateAnimationState,
  onSettingsChange: settings => {
    viewportCapture.setRecordingSettings(
      settings.fps,
      settings.frameCount,
      settings.fullResolution,
      settings.cameraWidth,
      settings.cameraHeight,
    );
    if (!settings.fullResolution) {
      backgroundController.setHdrQuality('sd');
    }
    setCaptureResolutionMode(settings.fullResolution);
  },
});
animationTimeline.bind();
viewportCapture.bindControls();
modalOverlayController.bindControls();
bindRenderEffectControls();
editModeToggle?.addEventListener('click', () => setEditMode(!PARAMS.editMode));
[
  { el: transformMoveButton, mode: 'move' as TransformMode },
  { el: transformRotateButton, mode: 'rotate' as TransformMode },
  { el: transformScaleButton, mode: 'scale' as TransformMode },
].forEach(entry => {
  entry.el?.addEventListener('pointerdown', ev => transformController.beginControlDrag(entry.mode, ev));
});
dimensionDownButton?.addEventListener('click', () => setNewPrimitiveDimension(PARAMS.N - 1));
dimensionUpButton?.addEventListener('click', () => setNewPrimitiveDimension(PARAMS.N + 1));
cameraRecenterButton?.addEventListener('click', () => keyboardCamera.recenterCamera());
focusResetButton?.addEventListener('click', () => keyboardCamera.resetFocus());
new KeyboardShortcutController({
  isModalOpen: () => modalOverlayController.isOpen(),
  getTransformMode: () => transformController.mode,
  handleTransformConstraintKey,
  keyboardCamera,
  setViewMode: mode => setViewMode(mode),
  toggleRecording: () => viewportCapture.toggleRecording(),
  captureFrame: () => viewportCapture.captureFrame(),
  exportAnimation: () => viewportCapture.renderAnimation(),
  toggleAnimationPlayback: () => animationTimeline?.togglePlayback(),
  toggleAxisAutoRotations: () => axisController.toggleActiveAutoRotations(),
  insertKeyframe: () => animationTimeline?.addKeyframeAtCurrentFrame(),
  removeLastKeyframe: () => animationTimeline?.removeLastKeyframe(),
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
  if (animationTimeline?.isPlaying()) {
    animationTimeline.update(dt);
  } else if (!animationVideoRendering) {
    applyAutoRotation(dt);
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
