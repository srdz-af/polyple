
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { FullScreenQuad, Pass } from 'three/examples/jsm/postprocessing/Pass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { MAX_N, VIEW_MODES, type ViewMode } from './constants';
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
import { BackgroundController, type BackgroundUrlState } from './background/BackgroundController';
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
  type AnimationTimelineState,
} from './animation/KeyframeTimelineController';
import { createSceneInstance, type InstanceGeometryData } from './scene/instanceFactory';
import { cloneObjectOrigin, computeObjectOrigin, type ObjectOrigin } from './scene/objectOrigin';
import { ProjectionPipeline } from './scene/ProjectionPipeline';
import { SceneHistory } from './scene/SceneHistory';
import {
  clearScenePayloadFromCurrentUrl,
  createSceneUrlWithPayload,
  decodeSceneUrlPayload,
  encodeSceneUrlPayload,
  packF32,
  packU16,
  packU32,
  readScenePayloadFromText,
  readScenePayloadFromUrl,
  unpackF32,
  unpackU16,
  unpackU32,
} from './scene/sceneUrlState';
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
import type { ExtraAxisGizmoState } from './ui/ExtraAxisGizmoController';

type PrimitiveMode = PrimitiveKind;
type PackedVec3 = [number, number, number];
type PackedTransform = [
  number, number, number,
  number, number, number,
  number, number, number,
];
type PackedCamera = [
  number, number, number,
  number, number, number,
  number, number, number,
  number, number,
];
type PackedSurface = [number, number, number, number];
type PackedTopology = [string, string];
type PackedBackgroundState = [string, string, number, number];
type PackedAnimationSettings = [number, number, 0 | 1, number, number];
type PackedAnimationKeyframeState = {
  d: number;
  r: string;
  o: number[];
  f: number;
  m: ViewMode;
  b: number;
  mb: number;
  c: PackedCamera;
};
type PackedAnimationTimelineState = {
  s: PackedAnimationSettings;
  c: number;
  p: 0 | 1;
  fv: 0 | 1;
  k: Array<[number, PackedAnimationKeyframeState]>;
};
type PackedInstanceState = {
  x: string;
  e: string;
  st?: PackedTopology;
  m: number;
  o: PackedVec3;
  l: string;
  k: PrimitiveMode;
  t: PackedTransform;
  g: string;
  n: number;
  a: number[];
  v: 0 | 1;
  s: PackedSurface;
};
type PackedSceneUrlState = {
  v: 1;
  n: number;
  x: string;
  e: string;
  st?: PackedTopology;
  m: number;
  ds: DataSource;
  l: string;
  pn: number;
  pk: PrimitiveMode;
  rm: ViewMode;
  em: 0 | 1;
  fx: [number, number];
  r: string;
  ax: [number, number, number];
  ao: number[];
  of: number;
  bam: number[];
  bt: PackedTransform;
  bo: string;
  bn: number;
  bv: 0 | 1;
  bs: PackedSurface;
  si: number;
  ss: number[];
  sv: number;
  i: PackedInstanceState[];
  c: PackedCamera;
  bg: PackedBackgroundState;
  tl?: PackedAnimationTimelineState;
  pc: 0 | 1;
  ag?: ExtraAxisGizmoState;
};

const DEFAULT_BLOOM_INTENSITY = 0;
const DEFAULT_MOTION_BLUR_INTENSITY = 0;
const MAX_VIEWPORT_PIXEL_RATIO = 2;
const LOW_RES_CAPTURE_PIXEL_RATIO_SCALE = 0.5;

let sceneUrlApplying = false;

function requestSceneUrlUpdate() {
  // Scene URLs are exported explicitly from the save button.
}

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

class CopyFramePass extends Pass {
  private readonly material = new THREE.MeshBasicMaterial();
  private readonly fsQuad = new FullScreenQuad(this.material);

  constructor() {
    super();
    this.needsSwap = true;
  }

  render(renderer: THREE.WebGLRenderer, writeBuffer: THREE.WebGLRenderTarget, readBuffer: THREE.WebGLRenderTarget) {
    this.material.map = readBuffer.texture;

    if (this.renderToScreen) {
      renderer.setRenderTarget(null);
    } else {
      renderer.setRenderTarget(writeBuffer);
      if (this.clear) renderer.clear();
    }

    this.fsQuad.render(renderer);
  }

  dispose() {
    this.material.dispose();
    this.fsQuad.dispose();
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
const mobileFullscreenToggle = document.getElementById('mobile-fullscreen-toggle') as HTMLButtonElement | null;
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
const sceneUndoButton = document.getElementById('scene-undo-button') as HTMLButtonElement | null;
const sceneRedoButton = document.getElementById('scene-redo-button') as HTMLButtonElement | null;
const sceneSaveButton = document.getElementById('scene-save-button') as HTMLButtonElement | null;
const sceneLoadButton = document.getElementById('scene-load-button') as HTMLButtonElement | null;
const sceneLoadInput = document.getElementById('scene-load-input') as HTMLInputElement | null;
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
  onStateChange: () => requestSceneUrlUpdate(),
});

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.01, 100);
const DEFAULT_CAMERA_POSITION = new THREE.Vector3(3.9, 2.7, 3.9);
camera.position.copy(DEFAULT_CAMERA_POSITION);
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0, 0.58, 0.22);
const afterimagePass = new SmoothAfterimagePass();
const copyFramePass = new CopyFramePass();
composer.addPass(bloomPass);
composer.addPass(afterimagePass);
composer.addPass(copyFramePass);
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
let projectionPipeline: ProjectionPipeline;
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
referenceLineDepthMaterial.side = THREE.DoubleSide;
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
let sceneHistory: SceneHistory<PackedSceneUrlState>;
let baseLabel = 'Hypercube';
const BASE_SELECTION = -1;
const NO_SELECTION = -2;
let selectedInstance: number = BASE_SELECTION; // -1 base, >=0 extra, -2 none
let selectedInstances: number[] = [BASE_SELECTION];
let selectionOutlines: THREE.LineSegments[] = [];
let selectionOutlineKeys: number[] = [];
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
  onCameraChange: () => {
    updateAxisGizmo();
    requestSceneUrlUpdate();
  },
});
function cloneTransformState(transform: TransformState): TransformState {
  return {
    pos: transform.pos.clone(),
    rot: transform.rot.clone(),
    scale: transform.scale.clone(),
  };
}

function finiteNumber(value: unknown, fallback = 0) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function finiteInteger(value: unknown, fallback = 0) {
  return Math.round(finiteNumber(value, fallback));
}

function normalizedAxisDim(value: unknown, fallback = 0) {
  return Math.max(0, Math.min(MAX_N - 1, finiteInteger(value, fallback)));
}

function normalizeViewMode(mode: unknown): ViewMode {
  return VIEW_MODES.includes(mode as ViewMode) ? mode as ViewMode : 'solid';
}

function packVec3(vec: THREE.Vector3): PackedVec3 {
  return [vec.x, vec.y, vec.z];
}

function unpackVec3(values: ArrayLike<unknown> | undefined, fallback = new THREE.Vector3()) {
  return new THREE.Vector3(
    finiteNumber(values?.[0], fallback.x),
    finiteNumber(values?.[1], fallback.y),
    finiteNumber(values?.[2], fallback.z),
  );
}

function packTransformState(transform: TransformState): PackedTransform {
  return [
    transform.pos.x, transform.pos.y, transform.pos.z,
    transform.rot.x, transform.rot.y, transform.rot.z,
    transform.scale.x, transform.scale.y, transform.scale.z,
  ];
}

function unpackTransformState(values: ArrayLike<unknown> | undefined): TransformState {
  return {
    pos: unpackVec3(values),
    rot: unpackVec3(values ? [values[3], values[4], values[5]] : undefined),
    scale: unpackVec3(values ? [values[6], values[7], values[8]] : undefined, new THREE.Vector3(1, 1, 1)),
  };
}

function packSurfaceState(surface: SurfaceState): PackedSurface {
  return [surface.color, surface.metalness, surface.roughness, surface.alpha];
}

function unpackSurfaceState(surface: ArrayLike<unknown> | undefined) {
  return normalizeSurface({
    color: finiteInteger(surface?.[0], DEFAULT_SURFACE.color),
    metalness: finiteNumber(surface?.[1], DEFAULT_SURFACE.metalness),
    roughness: finiteNumber(surface?.[2], DEFAULT_SURFACE.roughness),
    alpha: finiteNumber(surface?.[3], DEFAULT_SURFACE.alpha),
  });
}

function packSurfaceTopology(topology?: PrimitiveSurfaceTopology): PackedTopology | undefined {
  if (!topology) return undefined;
  return [packU32(topology.triangles), packU16(topology.facetIds)];
}

function unpackSurfaceTopology(topology?: PackedTopology): PrimitiveSurfaceTopology | undefined {
  if (!topology) return undefined;
  return {
    triangles: unpackU32(topology[0]),
    facetIds: unpackU16(topology[1]),
  };
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

function packBackgroundState(state: BackgroundUrlState): PackedBackgroundState {
  return [state.key, state.quality, state.blur, state.lightness];
}

function unpackBackgroundState(state: PackedBackgroundState | undefined): BackgroundUrlState | undefined {
  if (!state) return undefined;
  return {
    key: typeof state[0] === 'string' ? state[0] : 'ferndale',
    quality: state[1] === 'hd' ? 'hd' : 'sd',
    blur: finiteNumber(state[2], 0),
    lightness: finiteNumber(state[3], 0.15),
  };
}

function packAnimationKeyframeState(state: AnimationKeyframeState): PackedAnimationKeyframeState {
  return {
    d: state.dimension,
    r: packF32(state.rotMatrix),
    o: [...state.axesOrder],
    f: state.axesOffset,
    m: state.renderMode,
    b: state.bloomIntensity,
    mb: state.motionBlurIntensity,
    c: [
      state.cameraPosition.x, state.cameraPosition.y, state.cameraPosition.z,
      state.cameraTarget.x, state.cameraTarget.y, state.cameraTarget.z,
      state.cameraUp.x, state.cameraUp.y, state.cameraUp.z,
      state.cameraFov, state.cameraZoom,
    ],
  };
}

function unpackAnimationKeyframeState(state: PackedAnimationKeyframeState): AnimationKeyframeState {
  return {
    dimension: Math.max(3, Math.min(MAX_N, finiteInteger(state.d, MAX_N))),
    rotMatrix: unpackF32(state.r),
    axesOrder: Array.isArray(state.o) ? state.o.map((dim, idx) => normalizedAxisDim(dim, idx)) : [],
    axesOffset: finiteInteger(state.f, 0),
    renderMode: normalizeViewMode(state.m),
    bloomIntensity: clamp01(finiteNumber(state.b, DEFAULT_BLOOM_INTENSITY)),
    motionBlurIntensity: clamp01(finiteNumber(state.mb, DEFAULT_MOTION_BLUR_INTENSITY)),
    cameraPosition: unpackVec3(state.c, DEFAULT_CAMERA_POSITION),
    cameraTarget: unpackVec3([state.c[3], state.c[4], state.c[5]], new THREE.Vector3()),
    cameraUp: unpackVec3([state.c[6], state.c[7], state.c[8]], worldUp).normalize(),
    cameraFov: Math.max(1, Math.min(179, finiteNumber(state.c[9], 50))),
    cameraZoom: Math.max(0.01, Math.min(100, finiteNumber(state.c[10], 1))),
  };
}

function packTimelineState(state: AnimationTimelineState): PackedAnimationTimelineState {
  return {
    s: [
      state.settings.fps,
      state.settings.frameCount,
      state.settings.fullResolution ? 1 : 0,
      state.settings.cameraWidth,
      state.settings.cameraHeight,
    ],
    c: state.currentFrame,
    p: state.playing ? 1 : 0,
    fv: state.cameraDimensionsFollowViewport ? 1 : 0,
    k: state.keyframes.map(keyframe => [keyframe.frame, packAnimationKeyframeState(keyframe.state)]),
  };
}

function unpackTimelineState(state: PackedAnimationTimelineState): AnimationTimelineState {
  return {
    settings: {
      fps: finiteInteger(state.s[0], 60),
      frameCount: finiteInteger(state.s[1], 180),
      fullResolution: state.s[2] === 1,
      cameraWidth: finiteInteger(state.s[3], window.innerWidth),
      cameraHeight: finiteInteger(state.s[4], window.innerHeight),
    },
    currentFrame: finiteNumber(state.c, 0),
    playing: state.p === 1,
    cameraDimensionsFollowViewport: state.fv === 1,
    keyframes: state.k.map(([frame, keyframe]) => ({
      frame: finiteInteger(frame, 0),
      state: unpackAnimationKeyframeState(keyframe),
    })),
  };
}

function packInstanceState(instance: InstanceSnapshot): PackedInstanceState {
  return {
    x: packF32(instance.X),
    e: packU32(instance.E),
    st: packSurfaceTopology(instance.surfaceTopology),
    m: instance.M,
    o: packVec3(instance.offset),
    l: instance.label,
    k: instance.kind,
    t: packTransformState(instance.transform),
    g: packF32(instance.origin ? new Float32Array(instance.origin) : new Float32Array(MAX_N)),
    n: instance.originalN,
    a: [...instance.axisMap],
    v: instance.visible ? 1 : 0,
    s: packSurfaceState(normalizeSurface(instance.surface)),
  };
}

function unpackInstanceState(instance: PackedInstanceState): InstanceSnapshot {
  return {
    X: unpackF32(instance.x),
    E: unpackU32(instance.e),
    surfaceTopology: unpackSurfaceTopology(instance.st),
    M: finiteInteger(instance.m, 0),
    offset: unpackVec3(instance.o),
    label: typeof instance.l === 'string' ? instance.l : 'Object',
    kind: instance.k,
    transform: unpackTransformState(instance.t),
    origin: unpackF32(instance.g),
    originalN: Math.max(1, Math.min(MAX_N, finiteInteger(instance.n, MAX_N))),
    axisMap: Array.isArray(instance.a) ? instance.a.map((dim, idx) => normalizedAxisDim(dim, idx)) : [],
    visible: instance.v === 1,
    surface: unpackSurfaceState(instance.s),
  };
}

function captureSceneUrlState(): PackedSceneUrlState {
  const snap = captureSnapshot();
  return {
    v: 1,
    n: snap.N,
    x: packF32(snap.X),
    e: packU32(snap.E),
    st: packSurfaceTopology(snap.surfaceTopology),
    m: snap.M,
    ds: snap.source,
    l: snap.label,
    pn: snap.paramsN,
    pk: snap.primitive,
    rm: PARAMS.renderMode,
    em: PARAMS.editMode ? 1 : 0,
    fx: [PARAMS.bloomIntensity, PARAMS.motionBlurIntensity],
    r: packF32(snap.rotMatrix),
    ax: [snap.axes.x, snap.axes.y, snap.axes.z],
    ao: [...snap.axesOrder],
    of: snap.axesOffset,
    bam: [...snap.baseAxisMap],
    bt: packTransformState(snap.baseTransform),
    bo: packF32(snap.baseOrigin ? new Float32Array(snap.baseOrigin) : new Float32Array(MAX_N)),
    bn: snap.baseOrigN,
    bv: snap.baseVisible ? 1 : 0,
    bs: packSurfaceState(normalizeSurface(snap.baseSurface)),
    si: snap.selectedInstance,
    ss: [...(snap.selectedInstances ?? [])],
    sv: transformController.getSelectedVertex(),
    i: snap.instances.map(packInstanceState),
    c: packCameraState(),
    bg: packBackgroundState(backgroundController.getUrlState()),
    tl: animationTimeline ? packTimelineState(animationTimeline.getTimelineState()) : undefined,
    pc: paneController.isCollapsed ? 1 : 0,
    ag: axisController.getExtraAxisState(),
  };
}

function unpackSceneUrlSnapshot(state: PackedSceneUrlState): SceneSnapshot<PrimitiveMode> {
  return {
    N: Math.max(1, Math.min(MAX_N, finiteInteger(state.n, MAX_N))),
    X: unpackF32(state.x),
    E: unpackU32(state.e),
    surfaceTopology: unpackSurfaceTopology(state.st),
    M: finiteInteger(state.m, 0),
    source: state.ds === 'custom' ? 'custom' : 'primitive',
    label: typeof state.l === 'string' ? state.l : 'Scene',
    paramsN: Math.max(3, Math.min(MAX_N, finiteInteger(state.pn, MAX_N))),
    primitive: state.pk,
    rotMatrix: unpackF32(state.r),
    axes: {
      x: normalizedAxisDim(state.ax?.[0], 0),
      y: normalizedAxisDim(state.ax?.[1], 1),
      z: normalizedAxisDim(state.ax?.[2], 2),
    },
    axesOrder: Array.isArray(state.ao) ? state.ao.map((dim, idx) => normalizedAxisDim(dim, idx)) : [],
    axesOffset: finiteInteger(state.of, 0),
    baseAxisMap: Array.isArray(state.bam) ? state.bam.map((dim, idx) => normalizedAxisDim(dim, idx)) : [],
    baseTransform: unpackTransformState(state.bt),
    baseOrigin: unpackF32(state.bo),
    baseOrigN: Math.max(1, Math.min(MAX_N, finiteInteger(state.bn, MAX_N))),
    baseVisible: state.bv === 1,
    baseSurface: unpackSurfaceState(state.bs),
    selectedInstance: finiteInteger(state.si, NO_SELECTION),
    selectedInstances: Array.isArray(state.ss) ? state.ss.map(idx => finiteInteger(idx, NO_SELECTION)) : [],
    instances: state.i.map(unpackInstanceState),
  };
}

function isPackedSceneUrlState(value: unknown): value is PackedSceneUrlState {
  return typeof value === 'object' && value !== null && (value as { v?: unknown }).v === 1;
}

async function applySceneUrlState(state: PackedSceneUrlState) {
  sceneUrlApplying = true;
  try {
    const viewMode = normalizeViewMode(state.rm);
    PARAMS.renderMode = viewMode;
    applySnapshot(unpackSceneUrlSnapshot(state));
    setViewMode(viewMode);

    PARAMS.bloomIntensity = clamp01(finiteNumber(state.fx?.[0], DEFAULT_BLOOM_INTENSITY));
    PARAMS.motionBlurIntensity = clamp01(finiteNumber(state.fx?.[1], DEFAULT_MOTION_BLUR_INTENSITY));
    syncRenderEffects();

    axisController.applyExtraAxisState(state.ag);
    paneController.setCollapsed(state.pc === 1);
    applyCameraState(state.c);
    setEditMode(state.em === 1);
    transformController.setSelectedVertex(finiteInteger(state.sv, -1));
    if (PARAMS.editMode && transformController.getSelectedVertex() >= 0 && getObjectVisible(selectedInstance)) {
      updateVertexCloud(selectedInstance);
      placeVertexMarker(selectedInstance, transformController.getSelectedVertex());
    }

    animationTimeline?.applyTimelineState(state.tl ? unpackTimelineState(state.tl) : undefined, false);
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
}

async function initializeSceneUrlState() {
  const payload = readScenePayloadFromUrl();
  if (!payload) return;

  try {
    await loadSceneUrlPayload(payload, true);
  } catch (err) {
    console.warn('Unable to apply scene URL state', err);
    clearScenePayloadFromCurrentUrl();
  }
}

async function saveSceneStateFile() {
  if (!sceneSaveButton) return;
  const previousTitle = sceneSaveButton.title;
  sceneSaveButton.disabled = true;
  sceneSaveButton.title = 'Saving scene URL...';
  try {
    const payload = await encodeSceneUrlPayload(captureSceneUrlState());
    const sceneUrl = createSceneUrlWithPayload(payload);
    downloadTextFile(sceneUrl, sceneStateFileName());
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
  if (!file) return;
  try {
    const payload = readScenePayloadFromText(await file.text());
    if (!payload) throw new Error('Scene file does not contain a valid scene URL.');
    await loadSceneUrlPayload(payload, false);
  } catch (err) {
    console.warn('Unable to load scene URL state', err);
    window.alert(err instanceof Error ? err.message : 'Unable to load scene URL.');
  } finally {
    if (sceneLoadInput) sceneLoadInput.value = '';
  }
}

function downloadTextFile(text: string, fileName: string) {
  const blobUrl = URL.createObjectURL(new Blob([`${text}\n`], { type: 'text/plain;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(blobUrl);
}

function sceneStateFileName() {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  return `blend-scene-${stamp}.txt`;
}

async function copyTextToClipboard(text: string) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }
  } catch {
    // Fall through to legacy copy.
  }

  const input = document.createElement('textarea');
  input.value = text;
  input.style.position = 'fixed';
  input.style.left = '-9999px';
  input.style.top = '0';
  document.body.appendChild(input);
  input.focus();
  input.select();
  const copied = document.execCommand('copy');
  input.remove();
  if (!copied) throw new Error('Clipboard copy failed.');
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
    selectedInstances: [...selectedInstances],
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
  if (sceneUrlApplying) return;
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
  selectedInstance = snap.selectedInstance === BASE_SELECTION && M > 0
    ? BASE_SELECTION
    : (snap.selectedInstance >= 0 && snap.selectedInstance < extraInstances.length ? snap.selectedInstance : NO_SELECTION);
  selectedInstances = (snap.selectedInstances ?? [selectedInstance]).map(normalizeSelectionIndex);
  reconcileSelection();
  projectAndRenderAll();
  updateDimensionControl();
  updateObjectList();
  selectObject(selectedInstance, selectedInstance !== NO_SELECTION);
  requestSceneUrlUpdate();
}

sceneHistory = new SceneHistory({
  capture: captureSceneUrlState,
  apply: applySceneUrlState,
  maxEntries: 20,
});

function getObjectVisible(idx: number) {
  if (idx === BASE_SELECTION) return M > 0 && baseVisible;
  return extraInstances[idx]?.visible ?? false;
}

function normalizeSelectionIndex(idx: number) {
  if (idx === BASE_SELECTION) return M > 0 ? BASE_SELECTION : NO_SELECTION;
  if (idx >= 0 && extraInstances[idx]) return idx;
  return NO_SELECTION;
}

function isSelectableObject(idx: number) {
  const normalizedIdx = normalizeSelectionIndex(idx);
  return normalizedIdx !== NO_SELECTION && getObjectVisible(normalizedIdx);
}

function reconcileSelection() {
  const normalized = selectedInstances
    .map(normalizeSelectionIndex)
    .filter((idx, position, arr) => idx !== NO_SELECTION && arr.indexOf(idx) === position && getObjectVisible(idx));

  const primary = normalizeSelectionIndex(selectedInstance);
  if (primary !== NO_SELECTION && getObjectVisible(primary)) {
    selectedInstances = [primary, ...normalized.filter(idx => idx !== primary)];
    selectedInstance = primary;
  } else {
    selectedInstances = normalized;
    selectedInstance = selectedInstances[0] ?? NO_SELECTION;
  }
}

function setObjectVisible(idx: number, visible: boolean, recordUndo = true) {
  if (recordUndo && getObjectVisible(idx) !== visible) pushUndoSnapshot();

  if (idx === -1) {
    baseVisible = visible;
  } else if (extraInstances[idx]) {
    extraInstances[idx].visible = visible;
  }

  applyObjectVisibility();
  if (!visible && selectedInstances.includes(idx)) {
    removeSelectionOutlines();
    transformController.clearSelectionVisuals();
  }
  reconcileSelection();
  selectObject(selectedInstance, selectedInstance !== NO_SELECTION);
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
  requestSceneUrlUpdate();
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

  if (changed) requestSceneUrlUpdate();
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
  const normalizedIdx = normalizeSelectionIndex(idx);

  if (additive) {
    if (normalizedIdx === NO_SELECTION) return;
    if (!isSelectableObject(normalizedIdx)) return;
    if (selectedInstance === NO_SELECTION) {
      selectedInstance = normalizedIdx;
      selectedInstances = [normalizedIdx];
    } else if (normalizedIdx !== selectedInstance) {
      if (selectedInstances.includes(normalizedIdx)) {
        selectedInstances = selectedInstances.filter(entry => entry !== normalizedIdx);
      } else {
        selectedInstances.push(normalizedIdx);
      }
    }
  } else {
    selectedInstance = isSelectableObject(normalizedIdx) ? normalizedIdx : NO_SELECTION;
    selectedInstances = selectedInstance === NO_SELECTION ? [] : [selectedInstance];
  }

  reconcileSelection();
  transformController.setSelectedVertex(-1);
  updateObjectList();
  updateSelectionOutline();
  backgroundController.applySceneBackground(PARAMS.editMode);
  transformController.clearVertexMarker();
  transformController.clearVertexCloud();
  if (PARAMS.editMode && getObjectVisible(selectedInstance)) updateVertexCloud(selectedInstance);
  textureEditor.updatePanel();
  updateTransformActionButtons();
  requestSceneUrlUpdate();
}

function updateSelectionOutline() {
  reconcileSelection();
  const desiredKeys = PARAMS.editMode
    ? []
    : selectedInstances.filter(idx => getObjectVisible(idx) && selectionGeometry(idx));
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
  updateSelectionOutline();
  requestSceneUrlUpdate();
}

function focusObjectOrigin(idx: number) {
  const origin = getObjectOriginWorldPosition(idx, tmpVec);
  if (!origin) return;
  keyboardCamera.focusOn(origin);
}

function selectedProductObjects() {
  return selectedInstances.filter(isSelectableObject);
}

function canAddProductMesh() {
  return selectedProductObjects().length >= 2;
}

function getObjectProductFactor(idx: number): ProductMeshFactor | null {
  const source = idx === BASE_SELECTION
    ? { X, M, E, surfaceTopology: baseSurfaceTopology, origin: baseOrigin, originalN: baseOriginalN || visibleDims(), axisMap: baseAxisMap }
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
  const parentSurface = getObjectSurface(parentIdx);
  const parentTransform = getObjectTransform(parentIdx);
  const label = `Product #${extraInstances.length + 1}`;

  pushUndoSnapshot();
  const inst = insertInstance({
    verts,
    edges: product.edges,
    surfaceTopology: clonePrimitiveSurfaceTopology(product.surfaceTopology),
    V: product.vertexCount,
    kind: 'productMesh',
    axisMap,
    originalN: product.dimension,
    origin,
  }, new THREE.Vector3(0, 0, 0), label, cloneSurface(parentSurface ?? DEFAULT_SURFACE));

  if (parentTransform) {
    inst.transform.scale.copy(parentTransform.scale);
    projectAndRenderAll();
    updateObjectList();
  }
  requestSceneUrlUpdate();
}

function deleteSelected() {
  const deleteIndices = selectedInstances.filter(idx => idx >= 0).sort((a, b) => b - a);
  if (!deleteIndices.length) return;
  const keepBaseSelected = selectedInstances.includes(BASE_SELECTION) && getObjectVisible(BASE_SELECTION);
  pushUndoSnapshot();
  removeSelectionOutlines();
  for (const idx of deleteIndices) {
    const inst = extraInstances[idx];
    if (!inst) continue;
    inst.renderer.dispose();
    extraInstances.splice(idx, 1);
  }
  selectedInstance = keepBaseSelected ? BASE_SELECTION : NO_SELECTION;
  selectedInstances = keepBaseSelected ? [BASE_SELECTION] : [];
  projectAndRenderAll();
  updateObjectList();
  selectObject(selectedInstance);
  requestSceneUrlUpdate();
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
  getSelectedIndices: () => selectedInstances,
  onSelect: (idx, additive) => selectObject(idx, additive),
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
    requestSceneUrlUpdate();
  });
  motionBlurIntensityInput?.addEventListener('input', () => {
    PARAMS.motionBlurIntensity = clamp01(Number.parseFloat(motionBlurIntensityInput.value));
    syncRenderEffects();
    requestSceneUrlUpdate();
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
  getSelectedInstances: () => selectedInstances,
  getObjectVisible,
  visibleDims,
  perspectiveDimsFor,
  primaryExtraRotationDepthDim: (localN, axisMap) => axisController.primaryExtraRotationDepthDim(localN, axisMap),
  extraRotationPlaneAxis,
  projectAndRenderAll,
  updateSelectionOutline,
  pushUndoSnapshot,
  onStateChange: () => requestSceneUrlUpdate(),
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
  onStateChange: () => requestSceneUrlUpdate(),
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
  requestSceneUrlUpdate();
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
  requestSceneUrlUpdate();
}

function fullscreenAvailable() {
  return typeof document.documentElement.requestFullscreen === 'function'
    && typeof document.exitFullscreen === 'function';
}

function updateMobileFullscreenToggle() {
  if (!mobileFullscreenToggle) return;
  if (!fullscreenAvailable()) {
    mobileFullscreenToggle.hidden = true;
    return;
  }
  const active = document.fullscreenElement != null;
  const label = active ? 'Exit fullscreen' : 'Enter fullscreen';
  const icon = mobileFullscreenToggle.querySelector('.material-symbols-rounded');
  mobileFullscreenToggle.hidden = false;
  mobileFullscreenToggle.classList.toggle('active', active);
  mobileFullscreenToggle.setAttribute('aria-label', label);
  mobileFullscreenToggle.title = label;
  if (icon) icon.textContent = active ? 'fullscreen_exit' : 'fullscreen';
}

async function toggleMobileFullscreen() {
  if (!fullscreenAvailable()) return;
  try {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else {
      await document.documentElement.requestFullscreen({ navigationUI: 'hide' });
    }
  } catch (err) {
    console.warn('Fullscreen toggle failed', err);
  } finally {
    updateMobileFullscreenToggle();
  }
}

function updateTransformActionButtons() {
  transformController.updateActionButtons();
}

function hasActiveSelection() {
  return selectedInstances.some(isSelectableObject);
}

function handleTransformConstraintKey(key: string) {
  return transformController.handleConstraintKey(key);
}

const primitiveMenuOptions: { label: string; kind: PrimitiveKind }[] = [
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
  canAddProductMesh,
  addProductMesh: addProductMeshFromSelection,
  recalculateSelectedOrigin: () => recalculateObjectOrigin(selectedInstance),
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
    surfaceTopology: clonePrimitiveSurfaceTopology(data.surfaceTopology),
    V: data.V,
    kind,
    axisMap,
    originalN: dimension,
    origin: computeObjectOrigin(verts, data.V, MAX_N),
  };
}

function insertInstance(data: InstanceGeometryData, offset: THREE.Vector3, label: string, surface: SurfaceState, syncMode = true) {
  const inst = createSceneInstance({
    scene,
    projector,
    data,
    offset,
    label,
    surface,
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
  insertInstance(createPrimitiveData(kind, PARAMS.N), offset, label, cloneSurface(DEFAULT_SURFACE), syncMode);
}

function clearExtraInstances() {
  removeSelectionOutlines();
  extraInstances.forEach(inst => inst.renderer.dispose());
  extraInstances.length = 0;
  selectedInstance = NO_SELECTION;
  selectedInstances = [];
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
  if (M > 0) {
    rendererND.build(M, E, baseSurfaceTopology);
    rendererND.setSurface(baseSurface);
    rendererND.setMode(PARAMS.renderMode);
    if (setViewMode) setViewMode(currentMode);
    projectAndRenderAll();
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

  const rebuilt = buildPrimitive(PARAMS.primitive, targetN);
  const axisMap = canonicalAxisMap(targetN);
  const embedded = embedToMax(rebuilt.verts, targetN, axisMap);
  rebuildState(MAX_N, embedded, rebuilt.edges, 'primitive', targetN, axisMap, rebuilt.surfaceTopology);

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
  requestSceneUrlUpdate();
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
  onBeforeKeyframeChange: () => pushUndoSnapshot(),
  onStateChange: () => requestSceneUrlUpdate(),
});
animationTimeline.bind();
viewportCapture.bindControls();
modalOverlayController.bindControls();
bindRenderEffectControls();
editModeToggle?.addEventListener('click', () => setEditMode(!PARAMS.editMode));
mobileFullscreenToggle?.addEventListener('click', () => void toggleMobileFullscreen());
document.addEventListener('fullscreenchange', updateMobileFullscreenToggle);
updateMobileFullscreenToggle();
sceneUndoButton?.addEventListener('click', () => undoSceneSnapshot());
sceneRedoButton?.addEventListener('click', () => redoSceneSnapshot());
sceneSaveButton?.addEventListener('click', () => void saveSceneStateFile());
sceneLoadButton?.addEventListener('click', () => sceneLoadInput?.click());
sceneLoadInput?.addEventListener('change', () => {
  void loadSceneStateFile(sceneLoadInput.files?.[0]);
});
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
void backgroundSelectorReady
  .then(() => initializeSceneUrlState())
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
    if (applyAutoRotation(dt)) requestSceneUrlUpdate();
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
