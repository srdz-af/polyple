import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { SMAAPass } from 'three/examples/jsm/postprocessing/SMAAPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { CachedGrainPass, ColorGradeShader, CopyFramePass, SmoothAfterimagePass } from '../rendering/postProcessingPasses';
import { normalizeRenderQuality, type RenderQuality } from '../animation/KeyframeTimelineController';
import { createBidirectionalAxes, createFadingGrid } from './grid';

type ViewportRenderRuntimeOptions = {
  app: HTMLElement;
  maxPixelRatio: number;
  msaaSamples: number;
  grainUpdateIntervalFrames: number;
  grainTextureScale: number;
  defaultCameraPosition: THREE.Vector3;
  onCameraChange: () => void;
  markProjectionDirty: () => void;
  syncSceneLights: () => void;
};

type RenderFrameOptions = {
  projectIfDirty: () => number;
  updateScreenSpaceMarkers: () => void;
  updateSceneLightMarkers: () => void;
  updateAxisGizmo: () => void;
  hasEffects: () => boolean;
  recordFrame: (frameStart: number, projectionMs: number, renderMs: number) => void;
};

const RENDER_QUALITY_PIXEL_RATIO_SCALE: Record<RenderQuality, number> = {
  full: 1,
  high: 0.75,
  medium: 0.5,
  low: 0.25,
};

export class ViewportRenderRuntime {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene: THREE.Scene;
  readonly camera: THREE.PerspectiveCamera;
  readonly controls: OrbitControls;
  readonly composer: EffectComposer;
  readonly bloomPass: UnrealBloomPass;
  readonly afterimagePass: SmoothAfterimagePass;
  readonly colorGradePass: ShaderPass;
  readonly smaaPass: SMAAPass;
  readonly grainPass: CachedGrainPass;
  readonly copyFramePass: CopyFramePass;
  readonly axes: THREE.LineSegments;
  readonly gridGroup: THREE.Group;
  private readonly referenceLineDepthMaterial = new THREE.MeshBasicMaterial();
  private readonly captureResolutionViewportSize = new THREE.Vector2();
  private downsampleSceneOnly = false;
  private currentQuality: RenderQuality = 'full';

  constructor(private readonly options: ViewportRenderRuntimeOptions) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    options.app.appendChild(this.renderer.domElement);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.setPixelRatio(this.fullPixelRatio());
    this.renderer.shadowMap.enabled = false;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.scene = new THREE.Scene();
    this.axes = createBidirectionalAxes(1000);
    this.axes.name = 'polyple-axes';
    this.scene.add(this.axes);
    this.gridGroup = createFadingGrid({ y: 0 });
    this.scene.add(this.gridGroup);
    this.referenceLineDepthMaterial.colorWrite = false;
    this.referenceLineDepthMaterial.depthWrite = true;
    this.referenceLineDepthMaterial.depthTest = true;
    this.referenceLineDepthMaterial.side = THREE.DoubleSide;
    this.camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.01, 100);
    this.camera.position.copy(options.defaultCameraPosition);

    const composerRenderTarget = new THREE.WebGLRenderTarget(
      window.innerWidth * this.renderer.getPixelRatio(),
      window.innerHeight * this.renderer.getPixelRatio(),
      {
        type: THREE.HalfFloatType,
        samples: this.renderer.capabilities.isWebGL2 ? options.msaaSamples : 0,
      },
    );
    composerRenderTarget.texture.name = 'ViewportPostprocess.rt1';
    this.composer = new EffectComposer(this.renderer, composerRenderTarget);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0, 0.58, 0.22);
    this.afterimagePass = new SmoothAfterimagePass();
    this.colorGradePass = new ShaderPass(ColorGradeShader);
    this.smaaPass = new SMAAPass(window.innerWidth, window.innerHeight);
    this.grainPass = new CachedGrainPass(options.grainUpdateIntervalFrames, options.grainTextureScale);
    this.copyFramePass = new CopyFramePass();
    this.composer.addPass(this.bloomPass);
    this.composer.addPass(this.afterimagePass);
    this.composer.addPass(this.colorGradePass);
    this.composer.addPass(this.smaaPass);
    this.composer.addPass(this.grainPass);
    this.composer.addPass(this.copyFramePass);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.addEventListener('change', options.onCameraChange);
  }

  get renderQuality() {
    return this.currentQuality;
  }

  setCaptureResolutionMode(renderQuality: RenderQuality) {
    this.renderer.getSize(this.captureResolutionViewportSize);
    const fullPixelRatio = this.fullPixelRatio();
    const normalizedQuality = normalizeRenderQuality(renderQuality);
    this.currentQuality = normalizedQuality;
    const nextDownsampleSceneOnly = normalizedQuality !== 'full';
    const qualityChanged = this.downsampleSceneOnly !== nextDownsampleSceneOnly;
    const scenePixelRatio = Math.max(0.25, fullPixelRatio * RENDER_QUALITY_PIXEL_RATIO_SCALE[normalizedQuality]);
    this.downsampleSceneOnly = nextDownsampleSceneOnly;

    this.renderer.setPixelRatio(fullPixelRatio);
    this.renderer.setSize(this.captureResolutionViewportSize.x, this.captureResolutionViewportSize.y, false);
    this.composer.setPixelRatio(scenePixelRatio);
    this.composer.setSize(this.captureResolutionViewportSize.x, this.captureResolutionViewportSize.y);
    if (qualityChanged) this.options.markProjectionDirty();
    this.options.syncSceneLights();
  }

  renderFrame(options: RenderFrameOptions) {
    const frameStart = performance.now();
    const projectionMs = options.projectIfDirty();
    this.controls.update();
    options.updateScreenSpaceMarkers();
    options.updateSceneLightMarkers();
    options.updateAxisGizmo();
    const renderStart = performance.now();
    if (options.hasEffects() || this.downsampleSceneOnly) this.renderEffectsFrame();
    else this.renderer.render(this.scene, this.camera);
    options.recordFrame(frameStart, projectionMs, performance.now() - renderStart);
  }

  resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    this.composer.setSize(w, h);
  }

  private renderEffectsFrame() {
    const axesWereVisible = this.axes.visible;

    this.axes.visible = false;
    this.composer.render();

    this.axes.visible = axesWereVisible;
    this.renderAxesClean(axesWereVisible);
  }

  private renderAxesClean(axesWereVisible: boolean) {
    if (!axesWereVisible) return;

    const previousAutoClear = this.renderer.autoClear;
    const previousBackground = this.scene.background;
    const previousOverrideMaterial = this.scene.overrideMaterial;
    const childVisibility = this.scene.children.map(child => ({ child, visible: child.visible }));

    this.renderer.autoClear = false;
    this.scene.background = null;

    this.gridGroup.visible = false;
    this.axes.visible = false;
    this.scene.overrideMaterial = this.referenceLineDepthMaterial;
    this.renderer.clearDepth();
    this.renderer.render(this.scene, this.camera);
    this.scene.overrideMaterial = previousOverrideMaterial;

    for (const { child } of childVisibility) {
      child.visible = child === this.axes && axesWereVisible;
    }
    this.renderer.render(this.scene, this.camera);

    for (const { child, visible } of childVisibility) child.visible = visible;
    this.scene.background = previousBackground;
    this.scene.overrideMaterial = previousOverrideMaterial;
    this.renderer.autoClear = previousAutoClear;
  }

  private fullPixelRatio() {
    return Math.min(window.devicePixelRatio, this.options.maxPixelRatio);
  }
}
