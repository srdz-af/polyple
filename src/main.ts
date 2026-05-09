
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { FullScreenQuad, Pass } from 'three/examples/jsm/postprocessing/Pass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { SMAAPass } from 'three/examples/jsm/postprocessing/SMAAPass.js';
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
import {
  buildGeneratedCellTopology,
  cellCount,
  cloneCellTopology,
  deleteCellAndPrune,
  maxCellDimension,
  surfaceTopologyFromCellTopology,
  type CellTopology,
} from './geometry/cellTopology';
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
  normalizeAntialiasMode,
  normalizeRenderQuality,
  type AntialiasMode,
  type AnimationKeyframeState,
  type AnimationTimelineState,
  type RenderQuality,
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
  SceneLightKind,
  SceneLightState,
  SceneMaterialState,
  SceneSnapshot,
  TransformMode,
  TransformState,
} from './scene/types';
import type { ExtraAxisGizmoState } from './ui/ExtraAxisGizmoController';

type PrimitiveMode = PrimitiveKind;
type SceneLightHelper = THREE.PointLightHelper | THREE.DirectionalLightHelper;
type SceneLightMarker = THREE.Mesh<THREE.BufferGeometry, THREE.MeshBasicMaterial>;
type SceneLightRuntime = {
  state: SceneLightState;
  light: THREE.PointLight | THREE.DirectionalLight;
  helper: SceneLightHelper;
  marker: SceneLightMarker;
};
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
type PackedSurface = [
  0 | 1,
  number, number, number, number,
  number, number, number, number, number,
  number, number, number, number, number,
];
type PackedSceneMaterial = [string, string, PackedSurface];
type PackedTopology = [string, string];
type PackedCellTopology = Array<PackedTopology | null>;
type PackedBackgroundState = [string, string, number, number, number];
type PackedSceneLight = [0 | 1, string, string, number, number, PackedVec3, 0 | 1, 0 | 1];
type PackedAnimationSettings = [number, number, number, number, number];
type PackedAnimationKeyframeState = {
  d: number;
  r: string;
  o: number[];
  f: number;
  m: ViewMode;
  b: number;
  mb: number;
  ch?: number;
  cs?: number;
  cb?: number;
  cc?: number;
  gi?: number;
  aa?: 0 | 1;
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
  ct?: PackedCellTopology;
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
  mi?: string;
  s: PackedSurface;
};
type PackedSceneUrlState = {
  v: 1;
  n: number;
  x: string;
  e: string;
  ct?: PackedCellTopology;
  st?: PackedTopology;
  m: number;
  ds: DataSource;
  l: string;
  pn: number;
  pk: PrimitiveMode;
  rm: ViewMode;
  em: 0 | 1;
  fx: [number, number, number, number, number, number, number, 0 | 1];
  r: string;
  ax: [number, number, number];
  ao: number[];
  of: number;
  bam: number[];
  bt: PackedTransform;
  bo: string;
  bn: number;
  bv: 0 | 1;
  ma?: PackedSceneMaterial[];
  bm?: string;
  bs: PackedSurface;
  si: number;
  ss: number[];
  sv: number;
  i: PackedInstanceState[];
  c: PackedCamera;
  bg: PackedBackgroundState;
  li?: PackedSceneLight[];
  tl?: PackedAnimationTimelineState;
  pc: 0 | 1;
  ag?: ExtraAxisGizmoState;
};

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

class CachedGrainPass extends Pass {
  readonly uniforms = {
    tDiffuse: { value: null as THREE.Texture | null },
    tNoise: { value: null as THREE.Texture | null },
    intensity: { value: 0 },
  };

  private readonly noiseUniforms = {
    seed: { value: 0 },
    resolution: { value: new THREE.Vector2(1, 1) },
  };

  private readonly noiseMaterial = new THREE.ShaderMaterial({
    uniforms: this.noiseUniforms,
    vertexShader: /* glsl */`
      void main() {
        gl_Position = vec4(position.xy, 0.0, 1.0);
      }
    `,
    fragmentShader: /* glsl */`
      uniform float seed;
      uniform vec2 resolution;

      float hash(vec2 p) {
        p = fract(p * vec2(123.34, 456.21));
        p += dot(p, p + 45.32 + seed);
        return fract(p.x * p.y);
      }

      void main() {
        vec2 pixel = floor(gl_FragCoord.xy);
        float noise = hash(pixel / max(resolution, vec2(1.0)));
        gl_FragColor = vec4(vec3(noise), 1.0);
      }
    `,
    depthTest: false,
    depthWrite: false,
  });

  private readonly blendMaterial = new THREE.ShaderMaterial({
    uniforms: this.uniforms,
    vertexShader: /* glsl */`
      varying vec2 vUv;

      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */`
      uniform sampler2D tDiffuse;
      uniform sampler2D tNoise;
      uniform float intensity;

      varying vec2 vUv;

      void main() {
        vec4 color = texture2D(tDiffuse, vUv);
        float grain = texture2D(tNoise, vUv).r - 0.5;
        color.rgb = clamp(color.rgb + grain * intensity * 0.36, 0.0, 1.0);
        gl_FragColor = color;
      }
    `,
    depthTest: false,
    depthWrite: false,
  });

  private readonly noiseFsQuad = new FullScreenQuad(this.noiseMaterial);
  private readonly blendFsQuad = new FullScreenQuad(this.blendMaterial);
  private readonly textureScale: number;
  private readonly updateIntervalFrames: number;
  private noiseTarget: THREE.WebGLRenderTarget;
  private frameIndex = 0;
  private needsNoiseUpdate = true;

  constructor(updateIntervalFrames = 3, textureScale = 0.5) {
    super();
    this.needsSwap = true;
    this.updateIntervalFrames = Math.max(1, Math.round(updateIntervalFrames));
    this.textureScale = Math.max(0.1, Math.min(1, textureScale));
    this.noiseTarget = this.createNoiseTarget(1, 1);
    this.uniforms.tNoise.value = this.noiseTarget.texture;
  }

  setIntensity(intensity: number) {
    this.uniforms.intensity.value = Math.max(0, Math.min(1, Number.isFinite(intensity) ? intensity : 0));
  }

  setSize(width: number, height: number) {
    const nextWidth = Math.max(1, Math.round(width * this.textureScale));
    const nextHeight = Math.max(1, Math.round(height * this.textureScale));
    this.noiseTarget.setSize(nextWidth, nextHeight);
    this.noiseUniforms.resolution.value.set(nextWidth, nextHeight);
    this.needsNoiseUpdate = true;
  }

  render(renderer: THREE.WebGLRenderer, writeBuffer: THREE.WebGLRenderTarget, readBuffer: THREE.WebGLRenderTarget) {
    if (this.needsNoiseUpdate || this.frameIndex % this.updateIntervalFrames === 0) {
      this.updateNoiseTexture(renderer);
      this.needsNoiseUpdate = false;
    }
    this.frameIndex = (this.frameIndex + 1) % this.updateIntervalFrames;

    this.uniforms.tDiffuse.value = readBuffer.texture;
    this.uniforms.tNoise.value = this.noiseTarget.texture;

    if (this.renderToScreen) {
      renderer.setRenderTarget(null);
    } else {
      renderer.setRenderTarget(writeBuffer);
      if (this.clear) renderer.clear();
    }

    this.blendFsQuad.render(renderer);
  }

  dispose() {
    this.noiseTarget.dispose();
    this.noiseMaterial.dispose();
    this.blendMaterial.dispose();
    this.noiseFsQuad.dispose();
    this.blendFsQuad.dispose();
  }

  private createNoiseTarget(width: number, height: number) {
    const target = new THREE.WebGLRenderTarget(width, height, {
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
      depthBuffer: false,
      stencilBuffer: false,
    });
    target.texture.name = 'CachedGrainPass.noise';
    return target;
  }

  private updateNoiseTexture(renderer: THREE.WebGLRenderer) {
    this.noiseUniforms.seed.value = Math.random() * 1000;
    renderer.setRenderTarget(this.noiseTarget);
    renderer.clear();
    this.noiseFsQuad.render(renderer);
  }
}

const ColorGradeShader = {
  name: 'ColorGradeShader',
  uniforms: {
    tDiffuse: { value: null },
    hue: { value: 0 },
    saturation: { value: 0 },
    brightness: { value: 0 },
    contrast: { value: 0 },
  },
  vertexShader: /* glsl */`
    varying vec2 vUv;

    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */`
    uniform sampler2D tDiffuse;
    uniform float hue;
    uniform float saturation;
    uniform float brightness;
    uniform float contrast;

    varying vec2 vUv;

    void main() {
      vec4 color = texture2D(tDiffuse, vUv);

      float angle = hue * 3.14159265;
      float s = sin(angle);
      float c = cos(angle);
      vec3 weights = (vec3(2.0 * c, -sqrt(3.0) * s - c, sqrt(3.0) * s - c) + 1.0) / 3.0;
      color.rgb = vec3(
        dot(color.rgb, weights.xyz),
        dot(color.rgb, weights.zxy),
        dot(color.rgb, weights.yzx)
      );

      float luma = dot(color.rgb, vec3(0.2126, 0.7152, 0.0722));
      color.rgb = mix(vec3(luma), color.rgb, 1.0 + saturation);

      // Exposure-style brightness: negative always darkens, positive always brightens.
      color.rgb *= exp2(brightness);

      float contrastScale = contrast > 0.0 ? 1.0 / max(0.001, 1.0 - contrast) : 1.0 + contrast;
      color.rgb = (color.rgb - 0.5) * contrastScale + 0.5;

      gl_FragColor = color;
    }
  `,
};

const app = document.getElementById('app')!;
const ctxMenu = document.getElementById('context-menu') as HTMLDivElement | null;
const renderAnimationButton = document.getElementById('render-animation-button') as HTMLButtonElement | null;
const recordViewportButton = document.getElementById('record-viewport-button') as HTMLButtonElement | null;
const recordViewportTimer = document.getElementById('record-viewport-timer') as HTMLSpanElement | null;
const captureFrameButton = document.getElementById('capture-frame-button') as HTMLButtonElement | null;
const cameraViewOverlay = document.getElementById('camera-view-overlay') as HTMLDivElement | null;
const editModeToggle = document.getElementById('edit-mode-toggle') as HTMLButtonElement | null;
const editCellDimensionButtons = document.getElementById('edit-cell-dimension-buttons') as HTMLDivElement | null;
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
const colorHueInput = document.getElementById('color-hue') as HTMLInputElement | null;
const colorHueValue = document.getElementById('color-hue-value') as HTMLOutputElement | null;
const colorSaturationInput = document.getElementById('color-saturation') as HTMLInputElement | null;
const colorSaturationValue = document.getElementById('color-saturation-value') as HTMLOutputElement | null;
const colorBrightnessInput = document.getElementById('color-brightness') as HTMLInputElement | null;
const colorBrightnessValue = document.getElementById('color-brightness-value') as HTMLOutputElement | null;
const colorContrastInput = document.getElementById('color-contrast') as HTMLInputElement | null;
const colorContrastValue = document.getElementById('color-contrast-value') as HTMLOutputElement | null;
const renderAntialiasSelect = document.getElementById('render-antialias') as HTMLSelectElement | null;
const renderAntialiasValue = document.getElementById('render-antialias-value') as HTMLOutputElement | null;
const grainIntensityInput = document.getElementById('grain-intensity') as HTMLInputElement | null;
const grainIntensityValue = document.getElementById('grain-intensity-value') as HTMLOutputElement | null;
const sceneUndoButton = document.getElementById('scene-undo-button') as HTMLButtonElement | null;
const sceneRedoButton = document.getElementById('scene-redo-button') as HTMLButtonElement | null;
const sceneSaveButton = document.getElementById('scene-save-button') as HTMLButtonElement | null;
const sceneLoadButton = document.getElementById('scene-load-button') as HTMLButtonElement | null;
const sceneLoadInput = document.getElementById('scene-load-input') as HTMLInputElement | null;
const sceneLightSelect = document.getElementById('scene-light-select') as HTMLSelectElement | null;
const sceneLightAddPointButton = document.getElementById('scene-light-add-point') as HTMLButtonElement | null;
const sceneLightAddDirectionalButton = document.getElementById('scene-light-add-directional') as HTMLButtonElement | null;
const sceneLightRemoveButton = document.getElementById('scene-light-remove') as HTMLButtonElement | null;
const sceneLightLabelInput = document.getElementById('scene-light-label') as HTMLInputElement | null;
const sceneLightKindValue = document.getElementById('scene-light-kind-value') as HTMLOutputElement | null;
const sceneLightVisibleInput = document.getElementById('scene-light-visible') as HTMLInputElement | null;
const sceneLightVisibleValue = document.getElementById('scene-light-visible-value') as HTMLOutputElement | null;
const sceneLightShadowInput = document.getElementById('scene-light-shadow') as HTMLInputElement | null;
const sceneLightShadowValue = document.getElementById('scene-light-shadow-value') as HTMLOutputElement | null;
const sceneLightColorInput = document.getElementById('scene-light-color') as HTMLInputElement | null;
const sceneLightColorValue = document.getElementById('scene-light-color-value') as HTMLOutputElement | null;
const sceneLightIntensityInput = document.getElementById('scene-light-intensity') as HTMLInputElement | null;
const sceneLightIntensityValue = document.getElementById('scene-light-intensity-value') as HTMLOutputElement | null;
const sceneLightXInput = document.getElementById('scene-light-x') as HTMLInputElement | null;
const sceneLightYInput = document.getElementById('scene-light-y') as HTMLInputElement | null;
const sceneLightZInput = document.getElementById('scene-light-z') as HTMLInputElement | null;
const sceneControlTabButtons = Array.from(document.querySelectorAll('[data-scene-control-tab]')) as HTMLButtonElement[];
const sceneControlPanels = Array.from(document.querySelectorAll('[data-scene-control-panel]')) as HTMLElement[];
const modalOverlayController = new ModalOverlayController();
const paneController = new PaneController();

function setSceneControlTab(tab: string) {
  sceneControlTabButtons.forEach(button => {
    const active = button.dataset.sceneControlTab === tab;
    button.classList.toggle('active', active);
    button.setAttribute('aria-selected', String(active));
    button.tabIndex = active ? 0 : -1;
  });
  sceneControlPanels.forEach(panel => {
    panel.hidden = panel.dataset.sceneControlPanel !== tab;
  });
  window.dispatchEvent(new CustomEvent('scene-control-tab-change', { detail: { tab } }));
}

sceneControlTabButtons.forEach(button => {
  button.addEventListener('click', () => {
    if (button.dataset.sceneControlTab) setSceneControlTab(button.dataset.sceneControlTab);
  });
});
setSceneControlTab('environment');

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
  colorInput: document.getElementById('background-color') as HTMLInputElement | null,
  colorValue: document.getElementById('background-color-value') as HTMLOutputElement | null,
  qualityButtons: Array.from(document.querySelectorAll('#background-quality-toggle button[data-hdri-quality]')) as HTMLButtonElement[],
  controlsEl: document.getElementById('background-controls') as HTMLDivElement | null,
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
  syncSceneLightControls();
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
  border: '1px solid rgba(255, 255, 255, 0.14)',
  borderRadius: '7px',
  background: 'rgba(8, 11, 18, 0.72)',
  color: 'rgba(236, 243, 255, 0.92)',
  font: '700 10px/1.36 SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace',
  letterSpacing: '0.01em',
  pointerEvents: 'none',
  whiteSpace: 'pre',
  boxShadow: '0 10px 26px rgba(0, 0, 0, 0.28)',
  backdropFilter: 'blur(10px) saturate(0.85)',
  WebkitBackdropFilter: 'blur(10px) saturate(0.85)',
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

const raycaster = new THREE.Raycaster();
const ndc = new THREE.Vector2();

const light = new THREE.DirectionalLight(0xffffff, 1.0);
light.position.set(2, 3, 4);
const ambient = new THREE.AmbientLight(0xffffff, 0.3);
const hemi = new THREE.HemisphereLight(0x88aaff, 0x090b12, 0.6);
scene.add(ambient, hemi, light);
let sceneLightIdCounter = 1;
let selectedSceneLightId = '';
const sceneLights: SceneLightRuntime[] = [];
const sceneLightMarkerGeometry = new THREE.SphereGeometry(SCENE_LIGHT_MARKER_RADIUS, 12, 8);
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
let baseMaterialId = 'mat_1';
let materialSlots: SceneMaterialState[] = [{ id: baseMaterialId, name: 'Material 1', surface: cloneSurface(DEFAULT_SURFACE) }];
let materialIdCounter = 2;
let textureEditorMaterialId = baseMaterialId;
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

function colorToHex(color: number) {
  return `#${Math.max(0, Math.min(0xffffff, color >>> 0)).toString(16).padStart(6, '0')}`;
}

function colorFromInput(value: string | undefined, fallback = 0xffffff) {
  if (!value) return fallback;
  const parsed = Number.parseInt(value.replace('#', ''), 16);
  return Number.isFinite(parsed) ? Math.max(0, Math.min(0xffffff, parsed >>> 0)) : fallback;
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
  return [
    surface.materialType === 'glass' ? 1 : 0,
    surface.color,
    surface.metalness,
    surface.roughness,
    surface.alpha,
    surface.transmission,
    surface.ior,
    surface.thickness,
    surface.attenuationDistance,
    surface.attenuationColor,
    surface.clearcoat,
    surface.clearcoatRoughness,
    surface.specularIntensity,
    surface.emissiveColor,
    surface.emissiveIntensity,
  ];
}

function unpackSurfaceState(surface: ArrayLike<unknown> | undefined) {
  return normalizeSurface({
    materialType: surface?.[0] === 1 ? 'glass' : 'standard',
    color: finiteInteger(surface?.[1], DEFAULT_SURFACE.color),
    metalness: finiteNumber(surface?.[2], DEFAULT_SURFACE.metalness),
    roughness: finiteNumber(surface?.[3], DEFAULT_SURFACE.roughness),
    alpha: finiteNumber(surface?.[4], DEFAULT_SURFACE.alpha),
    transmission: finiteNumber(surface?.[5], DEFAULT_SURFACE.transmission),
    ior: finiteNumber(surface?.[6], DEFAULT_SURFACE.ior),
    thickness: finiteNumber(surface?.[7], DEFAULT_SURFACE.thickness),
    attenuationDistance: finiteNumber(surface?.[8], DEFAULT_SURFACE.attenuationDistance),
    attenuationColor: finiteInteger(surface?.[9], DEFAULT_SURFACE.attenuationColor),
    clearcoat: finiteNumber(surface?.[10], DEFAULT_SURFACE.clearcoat),
    clearcoatRoughness: finiteNumber(surface?.[11], DEFAULT_SURFACE.clearcoatRoughness),
    specularIntensity: finiteNumber(surface?.[12], DEFAULT_SURFACE.specularIntensity),
    emissiveColor: finiteInteger(surface?.[13], DEFAULT_SURFACE.emissiveColor),
    emissiveIntensity: finiteNumber(surface?.[14], DEFAULT_SURFACE.emissiveIntensity),
  });
}

function packMaterialState(material: SceneMaterialState): PackedSceneMaterial {
  return [material.id, material.name, packSurfaceState(normalizeSurface(material.surface))];
}

function unpackMaterialState(material: PackedSceneMaterial | undefined, fallbackIndex: number): SceneMaterialState | null {
  if (!Array.isArray(material)) return null;
  const id = typeof material[0] === 'string' && material[0].trim() ? material[0].trim() : createMaterialId();
  const name = typeof material[1] === 'string' && material[1].trim() ? material[1].trim() : `Material ${fallbackIndex + 1}`;
  return {
    id,
    name,
    surface: unpackSurfaceState(material[2]),
  };
}

function createMaterialId() {
  return `mat_${materialIdCounter++}`;
}

function syncMaterialIdCounter() {
  let max = 0;
  for (const material of materialSlots) {
    const match = /^mat_(\d+)$/.exec(material.id);
    if (match) max = Math.max(max, Number.parseInt(match[1], 10));
  }
  materialIdCounter = Math.max(materialIdCounter, max + 1);
}

function createSceneMaterial(surface: SurfaceState, name?: string): SceneMaterialState {
  const materialNumber = materialSlots.length + 1;
  return {
    id: createMaterialId(),
    name: name?.trim() || `Material ${materialNumber}`,
    surface: cloneSurface(normalizeSurface(surface)),
  };
}

function setSceneMaterials(materials: SceneMaterialState[]) {
  materialSlots = materials.length
    ? materials.map((material, idx) => ({
      id: material.id || `mat_${idx + 1}`,
      name: material.name?.trim() || `Material ${idx + 1}`,
      surface: cloneSurface(normalizeSurface(material.surface)),
    }))
    : [createSceneMaterial(DEFAULT_SURFACE, 'Material 1')];
  syncMaterialIdCounter();
}

function materialSlotById(id: string | undefined) {
  return materialSlots.find(material => material.id === id) ?? null;
}

function ensureMaterialSlot(id: string | undefined, fallbackSurface = DEFAULT_SURFACE, fallbackName?: string) {
  const existing = materialSlotById(id);
  if (existing) return existing;

  const material = createSceneMaterial(fallbackSurface, fallbackName);
  materialSlots.push(material);
  return material;
}

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

function normalizeSceneLightState(state: Partial<SceneLightState>): SceneLightState {
  const kind: SceneLightKind = state.kind === 'directional' ? 'directional' : 'point';
  const fallbackPosition = kind === 'point' ? new THREE.Vector3(1.8, 1.8, 1.8) : new THREE.Vector3(2, 3, 4);
  return {
    id: state.id?.trim() || createSceneLightId(),
    kind,
    label: state.label?.trim() || `${kind === 'point' ? 'Point' : 'Directional'} light`,
    color: Math.max(0, Math.min(0xffffff, (state.color ?? 0xffffff) >>> 0)),
    intensity: Math.max(0, Math.min(20, finiteNumber(state.intensity, kind === 'point' ? 3 : 1))),
    position: state.position?.clone() ?? fallbackPosition,
    visible: state.visible !== false,
    castShadow: state.castShadow === true,
  };
}

function createSceneLightObject(state: SceneLightState) {
  const object = state.kind === 'point'
    ? new THREE.PointLight(state.color, state.intensity, 0, 2)
    : new THREE.DirectionalLight(state.color, state.intensity);
  object.name = state.id;
  if (object instanceof THREE.DirectionalLight) {
    object.target.position.set(0, 0, 0);
    scene.add(object.target);
  }
  scene.add(object);
  return object;
}

function configureLightHelperMaterials(object: THREE.Object3D, color: number, opacity = 0.82) {
  object.traverse(child => {
    child.renderOrder = 42;
    const material = (child as THREE.Line | THREE.Mesh).material as THREE.Material | THREE.Material[] | undefined;
    const materials = Array.isArray(material) ? material : (material ? [material] : []);
    materials.forEach(entry => {
      entry.depthTest = false;
      entry.depthWrite = false;
      entry.transparent = true;
      entry.opacity = opacity;
      if ('color' in entry && entry.color instanceof THREE.Color) entry.color.setHex(color);
    });
  });
}

function createSceneLightHelper(state: SceneLightState, lightObject: THREE.PointLight | THREE.DirectionalLight): SceneLightHelper {
  const helper = lightObject instanceof THREE.PointLight
    ? new THREE.PointLightHelper(lightObject, 0.25, state.color)
    : new THREE.DirectionalLightHelper(lightObject, 0.55, state.color);
  helper.name = `${state.id}-helper`;
  helper.visible = false;
  configureLightHelperMaterials(helper, state.color);
  scene.add(helper);
  return helper;
}

function createSceneLightMarker(state: SceneLightState): SceneLightMarker {
  const material = new THREE.MeshBasicMaterial({
    color: state.color,
    transparent: true,
    opacity: 0.68,
    depthTest: false,
    depthWrite: false,
  });
  const marker = new THREE.Mesh(sceneLightMarkerGeometry, material);
  marker.name = `${state.id}-marker`;
  marker.renderOrder = 41;
  marker.userData.sceneLightId = state.id;
  marker.visible = false;
  scene.add(marker);
  return marker;
}

function createSceneLightRuntime(state: SceneLightState): SceneLightRuntime {
  const normalized = normalizeSceneLightState(state);
  const lightObject = createSceneLightObject(normalized);
  const runtime: SceneLightRuntime = {
    state: normalized,
    light: lightObject,
    helper: createSceneLightHelper(normalized, lightObject),
    marker: createSceneLightMarker(normalized),
  };
  syncSceneLightRuntime(runtime);
  return runtime;
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

function syncSceneLightShadow(runtime: SceneLightRuntime) {
  const shadowMapSize = currentShadowMapSize();
  const enabled = runtime.state.visible && runtime.state.castShadow && shadowMapSize > 0;
  runtime.light.castShadow = enabled;
  if (!enabled) return;

  runtime.light.shadow.mapSize.set(shadowMapSize, shadowMapSize);
  runtime.light.shadow.bias = -0.00025;
  runtime.light.shadow.normalBias = 0.02;
  runtime.light.shadow.camera.near = runtime.light instanceof THREE.PointLight ? 0.05 : 0.1;
  runtime.light.shadow.camera.far = 100;
  if (runtime.light instanceof THREE.DirectionalLight) {
    const shadowCamera = runtime.light.shadow.camera as THREE.OrthographicCamera;
    shadowCamera.left = -20;
    shadowCamera.right = 20;
    shadowCamera.top = 20;
    shadowCamera.bottom = -20;
    shadowCamera.updateProjectionMatrix();
  } else {
    runtime.light.shadow.camera.updateProjectionMatrix();
  }
  runtime.light.shadow.needsUpdate = true;
}

function syncSceneLightRuntime(runtime: SceneLightRuntime) {
  const { state, light, helper, marker } = runtime;
  const selected = state.id === selectedSceneLightId;
  light.name = state.id;
  light.color.setHex(state.color);
  light.intensity = state.intensity;
  light.position.copy(state.position);
  light.visible = state.visible;
  if (light instanceof THREE.DirectionalLight) {
    light.target.position.set(0, 0, 0);
    light.target.updateMatrixWorld();
  }
  marker.name = `${state.id}-marker`;
  marker.userData.sceneLightId = state.id;
  marker.position.copy(state.position);
  marker.visible = state.visible;
  marker.material.color.setHex(state.color);
  marker.material.opacity = selected ? 1 : 0.68;

  helper.name = `${state.id}-helper`;
  helper.visible = state.visible && selected;
  configureLightHelperMaterials(helper, state.color, selected ? 0.92 : 0.72);
  helper.update();
  syncSceneLightShadow(runtime);
}

function syncSceneLightRuntimes() {
  sceneLights.forEach(syncSceneLightRuntime);
  syncRendererShadowState();
}

function disposeSceneLightRuntime(runtime: SceneLightRuntime) {
  scene.remove(runtime.helper);
  runtime.helper.dispose();
  scene.remove(runtime.marker);
  runtime.marker.material.dispose();
  scene.remove(runtime.light);
  if (runtime.light instanceof THREE.DirectionalLight) scene.remove(runtime.light.target);
  runtime.light.dispose();
}

function setSceneLights(states: SceneLightState[]) {
  sceneLights.splice(0).forEach(disposeSceneLightRuntime);
  states.forEach(state => {
    sceneLights.push(createSceneLightRuntime(state));
  });
  syncSceneLightIdCounter();
  if (!sceneLights.some(runtime => runtime.state.id === selectedSceneLightId)) {
    selectedSceneLightId = sceneLights[0]?.state.id ?? '';
  }
  syncSceneLightRuntimes();
  syncSceneLightControls();
}

function selectedSceneLightRuntime() {
  return sceneLights.find(runtime => runtime.state.id === selectedSceneLightId) ?? null;
}

function syncSceneLightControls() {
  const selected = selectedSceneLightRuntime();
  if (sceneLightSelect) {
    sceneLightSelect.replaceChildren();
    if (sceneLights.length) {
      sceneLights.forEach(runtime => {
        const option = document.createElement('option');
        option.value = runtime.state.id;
        option.textContent = runtime.state.label;
        sceneLightSelect.appendChild(option);
      });
      sceneLightSelect.value = selected?.state.id ?? sceneLights[0].state.id;
    } else {
      const option = document.createElement('option');
      option.value = '';
      option.textContent = 'No lights';
      sceneLightSelect.appendChild(option);
    }
    sceneLightSelect.disabled = sceneLights.length === 0;
  }

  const enabled = !!selected;
  if (sceneLightRemoveButton) sceneLightRemoveButton.disabled = !enabled;
  if (sceneLightLabelInput) {
    sceneLightLabelInput.disabled = !enabled;
    sceneLightLabelInput.value = selected?.state.label ?? '';
  }
  if (sceneLightKindValue) sceneLightKindValue.textContent = selected?.state.kind === 'directional' ? 'Directional' : (selected ? 'Point' : 'None');
  if (sceneLightVisibleInput) {
    sceneLightVisibleInput.disabled = !enabled;
    sceneLightVisibleInput.checked = selected?.state.visible ?? false;
  }
  if (sceneLightVisibleValue) sceneLightVisibleValue.textContent = selected?.state.visible ? 'On' : 'Off';
  if (sceneLightShadowInput) {
    sceneLightShadowInput.disabled = !enabled;
    sceneLightShadowInput.checked = selected?.state.castShadow ?? false;
  }
  if (sceneLightShadowValue) {
    if (!selected?.state.castShadow) sceneLightShadowValue.textContent = 'Off';
    else sceneLightShadowValue.textContent = currentShadowMapSize() > 0 ? 'On' : 'Quality off';
  }
  if (sceneLightColorInput) {
    sceneLightColorInput.disabled = !enabled;
    sceneLightColorInput.value = colorToHex(selected?.state.color ?? 0xffffff);
  }
  if (sceneLightColorValue) sceneLightColorValue.textContent = colorToHex(selected?.state.color ?? 0xffffff);
  if (sceneLightIntensityInput) {
    sceneLightIntensityInput.disabled = !enabled;
    sceneLightIntensityInput.value = `${selected?.state.intensity ?? 0}`;
  }
  if (sceneLightIntensityValue) sceneLightIntensityValue.textContent = (selected?.state.intensity ?? 0).toFixed(2);
  if (sceneLightXInput) {
    sceneLightXInput.disabled = !enabled;
    sceneLightXInput.value = `${selected?.state.position.x ?? 0}`;
  }
  if (sceneLightYInput) {
    sceneLightYInput.disabled = !enabled;
    sceneLightYInput.value = `${selected?.state.position.y ?? 0}`;
  }
  if (sceneLightZInput) {
    sceneLightZInput.disabled = !enabled;
    sceneLightZInput.value = `${selected?.state.position.z ?? 0}`;
  }
  syncSceneLightRuntimes();
}

function addSceneLight(kind: SceneLightKind) {
  pushUndoSnapshot();
  const index = sceneLights.filter(runtime => runtime.state.kind === kind).length + 1;
  const state = normalizeSceneLightState({
    id: createSceneLightId(),
    kind,
    label: `${kind === 'point' ? 'Point' : 'Directional'} light ${index}`,
  });
  sceneLights.push(createSceneLightRuntime(state));
  selectedSceneLightId = state.id;
  syncSceneLightRuntimes();
  syncSceneLightControls();
  requestSceneUrlUpdate();
}

function removeSelectedSceneLight() {
  const selected = selectedSceneLightRuntime();
  if (!selected) return;
  pushUndoSnapshot();
  const index = sceneLights.indexOf(selected);
  sceneLights.splice(index, 1);
  disposeSceneLightRuntime(selected);
  selectedSceneLightId = sceneLights[Math.min(index, sceneLights.length - 1)]?.state.id ?? '';
  syncSceneLightControls();
  requestSceneUrlUpdate();
}

function updateSelectedSceneLight(mutator: (state: SceneLightState) => void) {
  const selected = selectedSceneLightRuntime();
  if (!selected) return;
  pushUndoSnapshot();
  mutator(selected.state);
  selected.state = normalizeSceneLightState(selected.state);
  syncSceneLightRuntimes();
  syncSceneLightControls();
  requestSceneUrlUpdate();
}

function bindSceneLightControls() {
  sceneLightSelect?.addEventListener('change', () => {
    selectedSceneLightId = sceneLightSelect.value;
    syncSceneLightControls();
  });
  sceneLightAddPointButton?.addEventListener('click', () => addSceneLight('point'));
  sceneLightAddDirectionalButton?.addEventListener('click', () => addSceneLight('directional'));
  sceneLightRemoveButton?.addEventListener('click', removeSelectedSceneLight);
  sceneLightLabelInput?.addEventListener('change', () => {
    updateSelectedSceneLight(state => {
      state.label = sceneLightLabelInput.value.trim() || state.label;
    });
  });
  sceneLightVisibleInput?.addEventListener('change', () => {
    updateSelectedSceneLight(state => {
      state.visible = !!sceneLightVisibleInput.checked;
    });
  });
  sceneLightShadowInput?.addEventListener('change', () => {
    updateSelectedSceneLight(state => {
      state.castShadow = !!sceneLightShadowInput.checked;
    });
  });
  sceneLightColorInput?.addEventListener('change', () => {
    updateSelectedSceneLight(state => {
      state.color = colorFromInput(sceneLightColorInput.value, state.color);
    });
  });
  sceneLightIntensityInput?.addEventListener('change', () => {
    updateSelectedSceneLight(state => {
      state.intensity = finiteNumber(Number.parseFloat(sceneLightIntensityInput.value), state.intensity);
    });
  });
  const updatePosition = () => {
    updateSelectedSceneLight(state => {
      state.position.set(
        finiteNumber(Number.parseFloat(sceneLightXInput?.value ?? ''), state.position.x),
        finiteNumber(Number.parseFloat(sceneLightYInput?.value ?? ''), state.position.y),
        finiteNumber(Number.parseFloat(sceneLightZInput?.value ?? ''), state.position.z),
      );
    });
  };
  sceneLightXInput?.addEventListener('change', updatePosition);
  sceneLightYInput?.addEventListener('change', updatePosition);
  sceneLightZInput?.addEventListener('change', updatePosition);
  syncSceneLightControls();
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
    if (!runtime.marker.visible) return;
    const selected = runtime.state.id === selectedSceneLightId;
    runtime.marker.scale.setScalar(sceneLightMarkerScale(
      runtime.marker.position,
      selected ? SELECTED_SCENE_LIGHT_MARKER_PIXEL_DIAMETER : SCENE_LIGHT_MARKER_PIXEL_DIAMETER,
    ));
  });
}

function handleSceneLightPointerDown(ev: PointerEvent) {
  if (ev.button !== 0 || PARAMS.editMode || transformController.isActive() || transformController.isGizmoDragging()) return;
  const markers = sceneLights
    .map(runtime => runtime.marker)
    .filter(marker => marker.visible);
  if (!markers.length) return;

  const rect = renderer.domElement.getBoundingClientRect();
  ndc.set(
    ((ev.clientX - rect.left) / rect.width) * 2 - 1,
    -((ev.clientY - rect.top) / rect.height) * 2 + 1,
  );
  raycaster.setFromCamera(ndc, camera);
  const hit = raycaster.intersectObjects(markers, false)[0];
  const lightId = hit?.object.userData.sceneLightId;
  if (typeof lightId !== 'string') return;

  selectedSceneLightId = lightId;
  selectObject(NO_SELECTION);
  syncSceneLightControls();
  ev.preventDefault();
  ev.stopPropagation();
  ev.stopImmediatePropagation();
}

function objectLabelForMaterialList(idx: number) {
  if (idx === BASE_SELECTION) return baseLabel;
  return extraInstances[idx]?.label ?? `Object ${idx + 1}`;
}

function objectMaterialId(idx: number) {
  if (idx === BASE_SELECTION) return baseMaterialId;
  return extraInstances[idx]?.materialId ?? '';
}

function setObjectMaterialId(idx: number, materialId: string) {
  const material = ensureMaterialSlot(materialId);
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
}

function materialUsageRows(materialId: string) {
  const rows: { idx: number; label: string }[] = [];
  if (M > 0 && baseMaterialId === materialId) rows.push({ idx: BASE_SELECTION, label: baseLabel });
  extraInstances.forEach((inst, idx) => {
    if (inst.materialId === materialId) rows.push({ idx, label: inst.label });
  });
  return rows;
}

function referencedMaterialIds() {
  const ids = new Set<string>();
  if (M > 0) ids.add(baseMaterialId);
  extraInstances.forEach(inst => ids.add(inst.materialId));
  return ids;
}

function reconcileSceneMaterials() {
  if (!materialSlots.length) setSceneMaterials([createSceneMaterial(DEFAULT_SURFACE, 'Material 1')]);

  if (M > 0 && !materialSlotById(baseMaterialId)) {
    const matched = materialSlots.find(material => surfacesEqual(material.surface, baseSurface));
    baseMaterialId = matched?.id ?? ensureMaterialSlot(undefined, baseSurface, 'Material 1').id;
  }

  extraInstances.forEach((inst, idx) => {
    if (materialSlotById(inst.materialId)) return;
    const matched = materialSlots.find(material => surfacesEqual(material.surface, inst.surface));
    inst.materialId = matched?.id ?? ensureMaterialSlot(undefined, inst.surface, `Material ${idx + 2}`).id;
  });

  const used = referencedMaterialIds();
  materialSlots = materialSlots.filter(material => used.has(material.id));
  if (!materialSlots.length) {
    const material = createSceneMaterial(DEFAULT_SURFACE, 'Material 1');
    materialSlots = [material];
    if (M > 0) baseMaterialId = material.id;
  }
}

function sceneMaterialEntriesForTexture() {
  reconcileSceneMaterials();
  return materialSlots.map(material => {
    const usage = materialUsageRows(material.id);
    return {
      id: material.id,
      name: material.name,
      surface: cloneSurface(material.surface),
      objectLabels: usage.map(row => row.label),
    };
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

function emptySurfaceTopology(): PrimitiveSurfaceTopology {
  return {
    triangles: new Uint32Array(),
    facetIds: new Uint16Array(),
  };
}

function surfaceTopologyForEditedCellTopology(topology?: CellTopology): PrimitiveSurfaceTopology {
  return surfaceTopologyFromCellTopology(topology) ?? emptySurfaceTopology();
}

function shouldPackCellTopology(
  kind: PrimitiveKind,
  source: DataSource | undefined,
  topology?: CellTopology,
) {
  if (!topology) return false;
  if (source === 'custom' || kind === 'productMesh') return true;

  const generated = topology.generatedKind;
  if (!generated || generated === 'fallback') return false;
  if (generated === kind) return false;
  if (kind === 'duoprism' && generated === 'polygon') return false;
  return true;
}

function packCellTopologyForUrl(
  kind: PrimitiveKind,
  source: DataSource | undefined,
  topology?: CellTopology,
): PackedCellTopology | undefined {
  if (!shouldPackCellTopology(kind, source, topology)) return undefined;
  if (!topology) return undefined;
  const packed = topology.cells.map(dim => dim ? [packU32(dim.offsets), packU32(dim.vertices)] as PackedTopology : null);
  while (packed.length > 0 && packed[packed.length - 1] === null) packed.pop();
  return packed.length ? packed : undefined;
}

function unpackCellTopology(topology?: PackedCellTopology): CellTopology | undefined {
  if (!Array.isArray(topology)) return undefined;
  return {
    cells: topology.map(dim => (
      Array.isArray(dim)
        ? { offsets: unpackU32(dim[0]), vertices: unpackU32(dim[1]) }
        : undefined
    )),
    generatedKind: 'edited',
  };
}

function deriveCellTopologyForGeometry(
  kind: PrimitiveKind,
  originalN: number,
  vertexCount: number,
  edges: Uint32Array,
  surfaceTopology?: PrimitiveSurfaceTopology,
  cellTopology?: CellTopology,
) {
  return cloneCellTopology(cellTopology)
    ?? buildGeneratedCellTopology(kind, originalN, vertexCount, edges, surfaceTopology);
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
  return [state.key, state.quality, state.blur, state.lightness, state.color];
}

function unpackBackgroundState(state: PackedBackgroundState | undefined): BackgroundUrlState | undefined {
  if (!state) return undefined;
  return {
    key: typeof state[0] === 'string' ? state[0] : 'ferndale',
    quality: state[1] === 'hd' ? 'hd' : 'sd',
    blur: finiteNumber(state[2], 0),
    lightness: finiteNumber(state[3], 0.15),
    color: finiteInteger(state[4], 0x10141a),
  };
}

function packSceneLightState(lightState: SceneLightState): PackedSceneLight {
  return [
    lightState.kind === 'directional' ? 1 : 0,
    lightState.id,
    lightState.label,
    lightState.color,
    lightState.intensity,
    [lightState.position.x, lightState.position.y, lightState.position.z],
    lightState.visible ? 1 : 0,
    lightState.castShadow ? 1 : 0,
  ];
}

function unpackSceneLightState(state: PackedSceneLight | undefined, fallbackIndex: number): SceneLightState | null {
  if (!Array.isArray(state)) return null;
  const kind: SceneLightKind = state[0] === 1 ? 'directional' : 'point';
  return normalizeSceneLightState({
    id: typeof state[1] === 'string' && state[1].trim() ? state[1].trim() : createSceneLightId(),
    kind,
    label: typeof state[2] === 'string' && state[2].trim()
      ? state[2].trim()
      : `${kind === 'point' ? 'Point' : 'Directional'} light ${fallbackIndex + 1}`,
    color: finiteInteger(state[3], 0xffffff),
    intensity: finiteNumber(state[4], kind === 'point' ? 3 : 1),
    position: unpackVec3(state[5], kind === 'point' ? new THREE.Vector3(1.8, 1.8, 1.8) : new THREE.Vector3(2, 3, 4)),
    visible: state[6] !== 0,
    castShadow: state[7] === 1,
  });
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
    ch: state.colorHue,
    cs: state.colorSaturation,
    cb: state.colorBrightness,
    cc: state.colorContrast,
    gi: state.grainIntensity,
    aa: state.antialiasMode === 'smaa' ? 1 : 0,
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
    colorHue: clampSigned01(finiteNumber(state.ch, DEFAULT_COLOR_HUE)),
    colorSaturation: clampSigned01(finiteNumber(state.cs, DEFAULT_COLOR_SATURATION)),
    colorBrightness: clampSigned01(finiteNumber(state.cb, DEFAULT_COLOR_BRIGHTNESS)),
    colorContrast: clampSigned01(finiteNumber(state.cc, DEFAULT_COLOR_CONTRAST)),
    grainIntensity: clamp01(finiteNumber(state.gi, DEFAULT_GRAIN_INTENSITY)),
    antialiasMode: normalizeAntialiasMode(state.aa === 1 ? 'smaa' : 'off'),
    cameraPosition: unpackVec3(state.c, DEFAULT_CAMERA_POSITION),
    cameraTarget: unpackVec3([state.c[3], state.c[4], state.c[5]], new THREE.Vector3()),
    cameraUp: unpackVec3([state.c[6], state.c[7], state.c[8]], worldUp).normalize(),
    cameraFov: Math.max(1, Math.min(179, finiteNumber(state.c[9], 50))),
    cameraZoom: Math.max(0.01, Math.min(100, finiteNumber(state.c[10], 1))),
  };
}

function packRenderQuality(quality: RenderQuality) {
  switch (quality) {
    case 'low': return 0;
    case 'high': return 2;
    case 'medium': return 3;
    case 'full':
    default: return 1;
  }
}

function unpackRenderQuality(value: unknown): RenderQuality {
  if (value === 0) return 'low';
  if (value === 2) return 'high';
  if (value === 3) return 'medium';
  return 'full';
}

function packTimelineState(state: AnimationTimelineState): PackedAnimationTimelineState {
  return {
    s: [
      state.settings.fps,
      state.settings.frameCount,
      packRenderQuality(state.settings.renderQuality),
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
      renderQuality: unpackRenderQuality(state.s[2]),
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
    ct: packCellTopologyForUrl(instance.kind, undefined, instance.cellTopology),
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
    mi: instance.materialId,
    s: packSurfaceState(normalizeSurface(instance.surface)),
  };
}

function unpackInstanceState(instance: PackedInstanceState): InstanceSnapshot {
  return {
    X: unpackF32(instance.x),
    E: unpackU32(instance.e),
    cellTopology: unpackCellTopology(instance.ct),
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
    materialId: typeof instance.mi === 'string' ? instance.mi : '',
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
    i: snap.instances.map(packInstanceState),
    c: packCameraState(),
    bg: packBackgroundState(backgroundController.getUrlState()),
    li: sceneLights.map(runtime => packSceneLightState(runtime.state)),
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
    cellTopology: unpackCellTopology(state.ct),
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
    materials: Array.isArray(state.ma)
      ? state.ma.map((material, idx) => unpackMaterialState(material, idx)).filter((material): material is SceneMaterialState => !!material)
      : undefined,
    baseMaterialId: typeof state.bm === 'string' ? state.bm : '',
    baseSurface: unpackSurfaceState(state.bs),
    selectedInstance: finiteInteger(state.si, NO_SELECTION),
    selectedInstances: Array.isArray(state.ss) ? state.ss.map(idx => finiteInteger(idx, NO_SELECTION)) : [],
    instances: state.i.map(unpackInstanceState),
    lights: Array.isArray(state.li)
      ? state.li.map((lightState, idx) => unpackSceneLightState(lightState, idx)).filter((lightState): lightState is SceneLightState => !!lightState)
      : [],
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
    PARAMS.colorHue = clampSigned01(finiteNumber(state.fx?.[2], DEFAULT_COLOR_HUE));
    PARAMS.colorSaturation = clampSigned01(finiteNumber(state.fx?.[3], DEFAULT_COLOR_SATURATION));
    PARAMS.colorBrightness = clampSigned01(finiteNumber(state.fx?.[4], DEFAULT_COLOR_BRIGHTNESS));
    PARAMS.colorContrast = clampSigned01(finiteNumber(state.fx?.[5], DEFAULT_COLOR_CONTRAST));
    PARAMS.grainIntensity = clamp01(finiteNumber(state.fx?.[6], DEFAULT_GRAIN_INTENSITY));
    PARAMS.antialiasMode = normalizeAntialiasMode(state.fx?.[7] === 1 ? 'smaa' : 'off');
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
  reconcileSceneMaterials();
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
    materials: materialSlots.map(material => ({
      id: material.id,
      name: material.name,
      surface: cloneSurface(material.surface),
    })),
    baseMaterialId,
    baseSurface: cloneSurface(baseSurface),
    selectedInstance,
    selectedInstances: [...selectedInstances],
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
  rebuildState(snap.N, snap.X, snap.E, snap.source, snap.baseOrigN, snap.baseAxisMap, snap.surfaceTopology, snap.cellTopology);
  if (snap.materials?.length) {
    setSceneMaterials(snap.materials);
  } else {
    const derivedMaterials: SceneMaterialState[] = [];
    const addDerivedMaterial = (surface: SurfaceState | undefined, name: string, id?: string) => {
      const normalized = normalizeSurface(surface);
      const existing = id
        ? derivedMaterials.find(material => material.id === id)
        : derivedMaterials.find(material => surfacesEqual(material.surface, normalized));
      if (existing) return existing.id;
      const material = {
        id: id || `mat_${derivedMaterials.length + 1}`,
        name,
        surface: normalized,
      };
      derivedMaterials.push(material);
      return material.id;
    };
    snap.baseMaterialId = addDerivedMaterial(snap.baseSurface, 'Material 1', snap.baseMaterialId);
    snap.instances.forEach((instance, idx) => {
      instance.materialId = addDerivedMaterial(instance.surface, `Material ${idx + 2}`, instance.materialId);
    });
    setSceneMaterials(derivedMaterials);
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
  baseMaterialId = snap.baseMaterialId || materialSlots[0]?.id || baseMaterialId;
  baseSurface = cloneSurface(materialSlotById(baseMaterialId)?.surface ?? normalizeSurface(snap.baseSurface));
  rendererND.setSurface(baseSurface);
  extraInstances.push(...snap.instances.map(restoreInstanceSnapshot));
  reconcileSceneMaterials();
  if (M > 0) setObjectMaterialId(BASE_SELECTION, baseMaterialId);
  extraInstances.forEach((inst, idx) => setObjectMaterialId(idx, inst.materialId));
  setSceneLights((snap.lights ?? []).map(lightState => ({
    ...lightState,
    position: lightState.position.clone(),
  })));
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
  textureEditor.updatePanel();
  requestSceneUrlUpdate();
}

function updateObjectList() {
  objectListController.update();
}

function getTextureMaterialTarget() {
  reconcileSceneMaterials();
  const hasObjectTarget = isSelectableObject(selectedInstance);
  const materialId = hasObjectTarget
    ? objectMaterialId(selectedInstance)
    : (materialSlotById(textureEditorMaterialId)?.id ?? materialSlots[0]?.id ?? ensureMaterialSlot(undefined).id);
  const material = ensureMaterialSlot(materialId);
  textureEditorMaterialId = material.id;
  const usage = materialUsageRows(material.id);
  return {
    materialId: material.id,
    material: {
      id: material.id,
      name: material.name,
      surface: cloneSurface(material.surface),
      objectLabels: usage.map(row => row.label),
    },
    materials: sceneMaterialEntriesForTexture(),
    canSplit: hasObjectTarget && usage.length > 1,
    hasObjectTarget,
  };
}

function assignMaterialToSelection(materialId: string, recordUndo: boolean) {
  const material = materialSlotById(materialId);
  if (!material) return false;

  if (!isSelectableObject(selectedInstance)) {
    textureEditorMaterialId = material.id;
    textureEditor.updatePanel();
    return true;
  }

  if (objectMaterialId(selectedInstance) === material.id) return false;
  if (recordUndo) pushUndoSnapshot();
  const changed = setObjectMaterialId(selectedInstance, material.id);
  if (!changed) return false;
  textureEditorMaterialId = material.id;
  reconcileSceneMaterials();
  updateObjectList();
  textureEditor.updatePanel();
  requestSceneUrlUpdate();
  return true;
}

function renameSceneMaterial(materialId: string, name: string, recordUndo: boolean) {
  const material = materialSlotById(materialId);
  const clean = name.trim();
  if (!material || !clean || material.name === clean) {
    textureEditor.updatePanel();
    return false;
  }
  if (recordUndo) pushUndoSnapshot();
  material.name = clean;
  textureEditor.updatePanel();
  requestSceneUrlUpdate();
  return true;
}

function splitSelectedMaterial(recordUndo: boolean) {
  if (!isSelectableObject(selectedInstance)) return false;
  const current = materialSlotById(objectMaterialId(selectedInstance));
  if (!current) return false;
  const usage = materialUsageRows(current.id);
  if (usage.length <= 1) return false;
  if (recordUndo) pushUndoSnapshot();
  const label = objectLabelForMaterialList(selectedInstance);
  const material = createSceneMaterial(current.surface, `${label} material`);
  materialSlots.push(material);
  const changed = setObjectMaterialId(selectedInstance, material.id);
  if (!changed) return false;
  reconcileSceneMaterials();
  updateObjectList();
  textureEditor.updatePanel();
  requestSceneUrlUpdate();
  return true;
}

function applySurfaceToSelectionMaterial(surface: SurfaceState, recordUndo: boolean) {
  const material = ensureMaterialSlot(
    isSelectableObject(selectedInstance) ? objectMaterialId(selectedInstance) : textureEditorMaterialId,
  );
  textureEditorMaterialId = material.id;
  const nextSurface = normalizeSurface(surface);
  const changed = !surfacesEqual(material.surface, nextSurface);
  if (changed && recordUndo) pushUndoSnapshot();

  if (changed) {
    material.surface = cloneSurface(nextSurface);
    if (M > 0 && baseMaterialId === material.id) setObjectMaterialId(BASE_SELECTION, material.id);
    extraInstances.forEach((inst, idx) => {
      if (inst.materialId === material.id) setObjectMaterialId(idx, material.id);
    });
  }

  if (changed) {
    requestSceneUrlUpdate();
  }
  return changed;
}

const textureEditor = new TextureEditorController({
  renderer,
  scene,
  light,
  ambient,
  hemi,
  getSurfaceTarget: getTextureMaterialTarget,
  applySurfaceToTarget: applySurfaceToSelectionMaterial,
  assignMaterialToTarget: assignMaterialToSelection,
  renameMaterial: renameSceneMaterial,
  splitMaterialForTarget: () => splitSelectedMaterial(true),
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
  transformController.clearEditSelection();
  updateObjectList();
  updateSelectionOutline();
  backgroundController.applySceneBackground(PARAMS.editMode);
  transformController.clearVertexMarker();
  transformController.clearVertexCloud();
  transformController.clearFaceCenterCloud();
  transformController.clearEditWireOverlay();
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
  const rendererRef = instIdx === BASE_SELECTION ? rendererND : extraInstances[instIdx]?.renderer;
  const maxDim = maxCellDimension(rendererRef?.getCellTopologyForSelection());
  if (transformController.getEditCellDimension() > maxDim) transformController.setEditCellDimension(maxDim);
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
  const parentMaterialId = objectMaterialId(parentIdx) || materialSlots[0]?.id || ensureMaterialSlot(undefined).id;
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

function compactDimensionMajorVertices(
  data: Float32Array,
  oldVertexCount: number,
  newVertexCount: number,
  vertexMap: Int32Array,
) {
  if (oldVertexCount <= 0 || newVertexCount <= 0) return new Float32Array();
  const dimension = Math.floor(data.length / oldVertexCount);
  const compacted = new Float32Array(dimension * newVertexCount);
  for (let oldVertex = 0; oldVertex < oldVertexCount; oldVertex++) {
    const newVertex = vertexMap[oldVertex];
    if (newVertex < 0) continue;
    for (let dim = 0; dim < dimension; dim++) {
      compacted[(dim * newVertexCount) + newVertex] = data[(dim * oldVertexCount) + oldVertex];
    }
  }
  return compacted;
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
  reconcileSceneMaterials();
  projectAndRenderAll();
  updateObjectList();
  selectObject(selectedInstance);
  requestSceneUrlUpdate();
}

function deleteSelectedEditCell() {
  if (!PARAMS.editMode || !getObjectVisible(selectedInstance)) return;
  const selection = transformController.getEditSelection();
  if (!selection || selection.cellId < 0) return;

  const targetIsBase = selectedInstance === BASE_SELECTION;
  const target = targetIsBase ? null : extraInstances[selectedInstance];
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
      rendererND.build(M, E, baseSurfaceTopology, baseCellTopology);
      rendererND.setSurface(baseSurface);
      rendererND.setMode(PARAMS.renderMode);
    } else {
      baseVisible = false;
      baseOrigin = new Float32Array(MAX_N);
      rendererND.dispose?.();
      selectedInstance = NO_SELECTION;
      selectedInstances = [];
    }
  } else if (target) {
    target.X = compactDimensionMajorVertices(target.X, target.M, deletion.vertexCount, deletion.vertexMap);
    target.M = deletion.vertexCount;
    target.Y = new Float32Array(3 * target.M);
    target.E = new Uint32Array(deletion.edges);
    target.cellTopology = deletion.topology;
    target.surfaceTopology = surfaceTopologyForEditedCellTopology(target.cellTopology);
    if (target.M > 0) {
      target.renderer.build(target.M, target.E, target.surfaceTopology, target.cellTopology);
      target.renderer.setSurface(target.surface);
      target.renderer.setMode(PARAMS.renderMode);
    } else {
      target.renderer.dispose();
      extraInstances.splice(selectedInstance, 1);
      selectedInstance = NO_SELECTION;
      selectedInstances = [];
    }
  }

  reconcileSelection();
  reconcileSceneMaterials();
  projectAndRenderAll();
  applyObjectVisibility();
  updateObjectList();
  updateSelectionOutline();
  updateTransformActionButtons();
  if (PARAMS.editMode && getObjectVisible(selectedInstance)) updateVertexCloud(selectedInstance);
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
  const cellTopology = deriveCellTopologyForGeometry(
    snap.kind,
    snap.originalN,
    snap.M,
    snap.E,
    snap.surfaceTopology,
    snap.cellTopology,
  );
  instanceRenderer.build(snap.M, snap.E, snap.surfaceTopology, cellTopology);
  const material = ensureMaterialSlot(snap.materialId, normalizeSurface(snap.surface), snap.label);
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

function clamp01(value: number) {
  return Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
}

function clampSigned01(value: number) {
  return Math.max(-1, Math.min(1, Number.isFinite(value) ? value : 0));
}

function motionBlurBlendFromIntensity(intensity: number) {
  if (intensity <= 0) return 0;
  return 0.54 + (clamp01(intensity) * 0.4);
}

function syncRenderEffects() {
  PARAMS.bloomIntensity = clamp01(PARAMS.bloomIntensity);
  PARAMS.motionBlurIntensity = clamp01(PARAMS.motionBlurIntensity);
  PARAMS.colorHue = clampSigned01(PARAMS.colorHue);
  PARAMS.colorSaturation = clampSigned01(PARAMS.colorSaturation);
  PARAMS.colorBrightness = clampSigned01(PARAMS.colorBrightness);
  PARAMS.colorContrast = clampSigned01(PARAMS.colorContrast);
  PARAMS.grainIntensity = clamp01(PARAMS.grainIntensity);
  PARAMS.antialiasMode = normalizeAntialiasMode(PARAMS.antialiasMode);

  bloomPass.enabled = PARAMS.bloomIntensity > 0.001;
  bloomPass.strength = PARAMS.bloomIntensity * 1.6;
  bloomPass.radius = 0.46 + (PARAMS.bloomIntensity * 0.28);
  bloomPass.threshold = 0.22;

  afterimagePass.enabled = PARAMS.motionBlurIntensity > 0.001;
  afterimagePass.uniforms.blend.value = motionBlurBlendFromIntensity(PARAMS.motionBlurIntensity);
  if (!afterimagePass.enabled) afterimagePass.reset();

  colorGradePass.enabled = Math.abs(PARAMS.colorHue) > 0.001
    || Math.abs(PARAMS.colorSaturation) > 0.001
    || Math.abs(PARAMS.colorBrightness) > 0.001
    || Math.abs(PARAMS.colorContrast) > 0.001;
  colorGradePass.uniforms.hue.value = PARAMS.colorHue;
  colorGradePass.uniforms.saturation.value = PARAMS.colorSaturation;
  colorGradePass.uniforms.brightness.value = PARAMS.colorBrightness;
  colorGradePass.uniforms.contrast.value = PARAMS.colorContrast;

  smaaPass.enabled = PARAMS.antialiasMode === 'smaa';

  grainPass.enabled = PARAMS.grainIntensity > 0.001;
  grainPass.setIntensity(PARAMS.grainIntensity);

  if (bloomIntensityInput) bloomIntensityInput.value = PARAMS.bloomIntensity.toFixed(2);
  if (bloomIntensityValue) bloomIntensityValue.textContent = PARAMS.bloomIntensity.toFixed(2);
  if (motionBlurIntensityInput) motionBlurIntensityInput.value = PARAMS.motionBlurIntensity.toFixed(2);
  if (motionBlurIntensityValue) motionBlurIntensityValue.textContent = PARAMS.motionBlurIntensity.toFixed(2);
  if (colorHueInput) colorHueInput.value = PARAMS.colorHue.toFixed(2);
  if (colorHueValue) colorHueValue.textContent = PARAMS.colorHue.toFixed(2);
  if (colorSaturationInput) colorSaturationInput.value = PARAMS.colorSaturation.toFixed(2);
  if (colorSaturationValue) colorSaturationValue.textContent = PARAMS.colorSaturation.toFixed(2);
  if (colorBrightnessInput) colorBrightnessInput.value = PARAMS.colorBrightness.toFixed(2);
  if (colorBrightnessValue) colorBrightnessValue.textContent = PARAMS.colorBrightness.toFixed(2);
  if (colorContrastInput) colorContrastInput.value = PARAMS.colorContrast.toFixed(2);
  if (colorContrastValue) colorContrastValue.textContent = PARAMS.colorContrast.toFixed(2);
  if (renderAntialiasSelect) renderAntialiasSelect.value = PARAMS.antialiasMode;
  if (renderAntialiasValue) renderAntialiasValue.textContent = PARAMS.antialiasMode === 'smaa' ? 'SMAA' : 'Native';
  if (grainIntensityInput) grainIntensityInput.value = PARAMS.grainIntensity.toFixed(2);
  if (grainIntensityValue) grainIntensityValue.textContent = PARAMS.grainIntensity.toFixed(2);
}

function hasRenderEffects() {
  return bloomPass.enabled
    || afterimagePass.enabled
    || colorGradePass.enabled
    || smaaPass.enabled
    || grainPass.enabled;
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
    colorHue: lerpNumber(from.colorHue, to.colorHue, t),
    colorSaturation: lerpNumber(from.colorSaturation, to.colorSaturation, t),
    colorBrightness: lerpNumber(from.colorBrightness, to.colorBrightness, t),
    colorContrast: lerpNumber(from.colorContrast, to.colorContrast, t),
    grainIntensity: lerpNumber(from.grainIntensity, to.grainIntensity, t),
    antialiasMode: t < 0.5 ? from.antialiasMode : to.antialiasMode,
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
  PARAMS.colorHue = state.colorHue;
  PARAMS.colorSaturation = state.colorSaturation;
  PARAMS.colorBrightness = state.colorBrightness;
  PARAMS.colorContrast = state.colorContrast;
  PARAMS.grainIntensity = state.grainIntensity;
  PARAMS.antialiasMode = state.antialiasMode;
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
  if (hasRenderEffects() || downsampleSceneOnly) renderEffectsFrame();
  else renderer.render(scene, camera);
  recordPerfFrame(frameStart, projectionMs, performance.now() - renderStart);
}

function bindRenderEffectControls() {
  const bindRange = (
    input: HTMLInputElement | null,
    apply: (value: number) => void,
  ) => {
    input?.addEventListener('input', () => {
      apply(Number.parseFloat(input.value));
      syncRenderEffects();
      requestSceneUrlUpdate();
    });
  };

  bindRange(bloomIntensityInput, value => {
    PARAMS.bloomIntensity = clamp01(value);
  });
  bindRange(motionBlurIntensityInput, value => {
    PARAMS.motionBlurIntensity = clamp01(value);
  });
  bindRange(colorHueInput, value => {
    PARAMS.colorHue = clampSigned01(value);
  });
  bindRange(colorSaturationInput, value => {
    PARAMS.colorSaturation = clampSigned01(value);
  });
  bindRange(colorBrightnessInput, value => {
    PARAMS.colorBrightness = clampSigned01(value);
  });
  bindRange(colorContrastInput, value => {
    PARAMS.colorContrast = clampSigned01(value);
  });
  bindRange(grainIntensityInput, value => {
    PARAMS.grainIntensity = clamp01(value);
  });

  renderAntialiasSelect?.addEventListener('change', () => {
    PARAMS.antialiasMode = normalizeAntialiasMode(renderAntialiasSelect.value);
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

  transformController.clearEditSelection();
  if (!PARAMS.editMode) {
    transformController.clearVertexCloud();
    transformController.clearFaceCenterCloud();
    transformController.clearEditWireOverlay();
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
  if (transformController) transformController.updateActionButtons();
  updateEditCellDimensionButtons();
}

function hasActiveSelection() {
  return selectedInstances.some(isSelectableObject);
}

function handleTransformConstraintKey(key: string) {
  return viewportInteraction.handleTransformConstraintKey(key);
}

function maxEditableCellDimensionForSelection() {
  const rendererRef = selectedInstance === BASE_SELECTION
    ? rendererND
    : extraInstances[selectedInstance]?.renderer;
  return maxCellDimension(rendererRef?.getCellTopologyForSelection());
}

function editCellDimensionIcon(dimension: number) {
  if (dimension === 0) return 'line_end_circle';
  if (dimension === 1) return 'diagonal_line';
  if (dimension === 2) return 'square';
  if (dimension === 3) return 'deployed_code';
  return `filter_${Math.max(4, Math.min(8, dimension))}`;
}

function editCellDimensionTitle(dimension: number) {
  if (dimension === 0) return 'Vertex selection (1)';
  if (dimension === 1) return 'Edge selection (2)';
  if (dimension === 2) return 'Face selection (3)';
  if (dimension === 3) return 'Volume selection (4)';
  return `${dimension}-cell selection (${dimension + 1})`;
}

function selectedObjectDimension() {
  if (selectedInstance === BASE_SELECTION) return M > 0 ? (baseOriginalN || visibleDims()) : 0;
  return extraInstances[selectedInstance]?.originalN ?? 0;
}

function selectedObjectCellTopology() {
  const rendererRef = selectedInstance === BASE_SELECTION
    ? rendererND
    : extraInstances[selectedInstance]?.renderer;
  return rendererRef?.getCellTopologyForSelection();
}

function updateEditCellDimensionButtons() {
  if (!editCellDimensionButtons || !transformController) return;

  const topology = selectedObjectCellTopology();
  const objectDimension = selectedObjectDimension();
  const count = PARAMS.editMode && getObjectVisible(selectedInstance)
    ? Math.max(0, Math.min(MAX_N, objectDimension))
    : 0;

  if (!topology || count <= 0) {
    editCellDimensionButtons.hidden = true;
    editCellDimensionButtons.dataset.signature = '';
    editCellDimensionButtons.replaceChildren();
    return;
  }

  const active = transformController.getEditCellDimension();
  const availability = Array.from({ length: count }, (_entry, dimension) => cellCount(topology, dimension) > 0);
  const signature = `${count}:${active}:${availability.map(enabled => enabled ? '1' : '0').join('')}`;
  if (editCellDimensionButtons.dataset.signature === signature) {
    editCellDimensionButtons.hidden = false;
    return;
  }

  editCellDimensionButtons.dataset.signature = signature;
  editCellDimensionButtons.hidden = false;
  editCellDimensionButtons.replaceChildren();

  for (let dimension = 0; dimension < count; dimension++) {
    const button = document.createElement('button');
    const icon = document.createElement('span');
    const enabled = availability[dimension];
    button.type = 'button';
    button.className = dimension === active ? 'active' : '';
    button.disabled = !enabled;
    button.title = editCellDimensionTitle(dimension);
    button.setAttribute('aria-label', button.title);
    button.setAttribute('aria-pressed', String(dimension === active));
    icon.className = 'material-symbols-rounded';
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = editCellDimensionIcon(dimension);
    button.appendChild(icon);
    button.addEventListener('click', () => setEditCellDimension(dimension));
    editCellDimensionButtons.appendChild(button);
  }
}

function setEditCellDimension(dimension: number) {
  const maxDim = maxEditableCellDimensionForSelection();
  transformController.setEditCellDimension(Math.max(0, Math.min(maxDim, Math.floor(dimension))));
  if (PARAMS.editMode && getObjectVisible(selectedInstance)) updateVertexCloud(selectedInstance);
  updateTransformActionButtons();
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
  pushUndoSnapshot,
  addPrimitiveInstanceAt,
  insertKeyframe: () => animationTimeline?.addKeyframeAtCurrentFrame(),
  removeLastKeyframe: () => animationTimeline?.removeLastKeyframe(),
  deleteSelected,
  deleteSelectedEditCell,
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
  const material = ensureMaterialSlot(materialId);
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
  const materialId = materialSlots[0]?.id ?? ensureMaterialSlot(undefined, DEFAULT_SURFACE, 'Material 1').id;
  insertInstance(createPrimitiveData(kind, PARAMS.N), offset, label, materialId, syncMode);
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
    : (materialSlots[0]?.id ?? ensureMaterialSlot(undefined, DEFAULT_SURFACE, 'Material 1').id);
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
  setSceneMaterials([{
    id: 'mat_1',
    name: 'Material 1',
    surface: cloneSurface(DEFAULT_SURFACE),
  }]);
  baseMaterialId = materialSlots[0]?.id ?? 'mat_1';
  baseSurface = cloneSurface(materialSlotById(baseMaterialId)?.surface ?? DEFAULT_SURFACE);
  baseCellTopology = deriveCellTopologyForGeometry(PARAMS.primitive, baseOriginalN, M, E, surfaceTopology, cellTopology);
  baseSurfaceTopology = clonePrimitiveSurfaceTopology(surfaceTopology)
    ?? surfaceTopologyFromCellTopology(baseCellTopology);
  axisController.resetAxisOrder(N);
  PARAMS.axesX = axisController.axesOrder[0] ?? 0;
  PARAMS.axesY = axisController.axesOrder[1] ?? 1;
  PARAMS.axesZ = axisController.axesOrder[2] ?? 2;
  if (M > 0) {
    rendererND.build(M, E, baseSurfaceTopology, baseCellTopology);
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
setViewMode = (mode: ViewMode) => {
  PARAMS.renderMode = mode;
  rendererND.setMode(mode);
  extraInstances.forEach(inst => {
    inst.renderer.setMode(mode);
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
bindRenderEffectControls();
bindSceneLightControls();
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
  entry.el?.addEventListener('click', () => transformController.toggleTransformMode(entry.mode));
});
dimensionDownButton?.addEventListener('click', () => setNewPrimitiveDimension(PARAMS.N - 1));
dimensionUpButton?.addEventListener('click', () => setNewPrimitiveDimension(PARAMS.N + 1));
cameraRecenterButton?.addEventListener('click', () => keyboardCamera.recenterCamera());
focusResetButton?.addEventListener('click', () => keyboardCamera.resetFocus());
new KeyboardShortcutController({
  isModalOpen: () => modalOverlayController.isOpen(),
  getTransformMode: () => transformController.mode,
  isEditMode: () => PARAMS.editMode,
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
  togglePerfOverlay,
  setEditCellDimension,
}).bind();

updateTransformActionButtons();
paneController.syncToViewport(true);
modalOverlayController.initializeMobileOnboarding();
renderer.domElement.addEventListener('pointerdown', handleSceneLightPointerDown, { capture: true });
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
