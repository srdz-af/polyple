import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import {
  DEFAULT_SURFACE,
  normalizeSurface,
  toColorHex,
  type SurfaceState,
} from '../scene/surface';

export type TextureMaterialEntry = {
  id: string;
  name: string;
  surface: SurfaceState;
  objectLabels: string[];
};
type SurfaceTarget = {
  materialId: string;
  material: TextureMaterialEntry;
  materials: TextureMaterialEntry[];
  canSplit: boolean;
  hasObjectTarget: boolean;
};
const OPAQUE_ALPHA_THRESHOLD = 0.999;

type TextureEditorControllerOptions = {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  light: THREE.DirectionalLight;
  ambient: THREE.AmbientLight;
  hemi: THREE.HemisphereLight;
  getSurfaceTarget: () => SurfaceTarget | null;
  applySurfaceToTarget: (surface: SurfaceState, recordUndo: boolean) => boolean;
  assignMaterialToTarget: (materialId: string, recordUndo: boolean) => boolean;
  renameMaterial: (materialId: string, name: string, recordUndo: boolean) => boolean;
  splitMaterialForTarget: () => boolean;
};

export class TextureEditorController {
  private readonly panel = document.getElementById('texture-panel') as HTMLDivElement | null;
  private readonly materialScopedRows = Array.from(document.querySelectorAll<HTMLElement>('#texture-controls .texture-row[data-material-scope]'));
  private readonly previewCanvas = document.getElementById('texture-preview') as HTMLCanvasElement | null;
  private readonly materialTypeSelect = document.getElementById('texture-material-type') as HTMLSelectElement | null;
  private readonly materialTypeValue = document.getElementById('texture-material-type-value') as HTMLOutputElement | null;
  private readonly baseColorInput = document.getElementById('texture-base-color') as HTMLInputElement | null;
  private readonly baseColorValue = document.getElementById('texture-base-color-value') as HTMLOutputElement | null;
  private readonly metallicInput = document.getElementById('texture-metallic') as HTMLInputElement | null;
  private readonly metallicValue = document.getElementById('texture-metallic-value') as HTMLOutputElement | null;
  private readonly roughnessInput = document.getElementById('texture-roughness') as HTMLInputElement | null;
  private readonly roughnessValue = document.getElementById('texture-roughness-value') as HTMLOutputElement | null;
  private readonly alphaInput = document.getElementById('texture-alpha') as HTMLInputElement | null;
  private readonly alphaValue = document.getElementById('texture-alpha-value') as HTMLOutputElement | null;
  private readonly emissiveColorInput = document.getElementById('texture-emissive-color') as HTMLInputElement | null;
  private readonly emissiveColorValue = document.getElementById('texture-emissive-color-value') as HTMLOutputElement | null;
  private readonly emissiveIntensityInput = document.getElementById('texture-emissive-intensity') as HTMLInputElement | null;
  private readonly emissiveIntensityValue = document.getElementById('texture-emissive-intensity-value') as HTMLOutputElement | null;
  private readonly transmissionInput = document.getElementById('texture-transmission') as HTMLInputElement | null;
  private readonly transmissionValue = document.getElementById('texture-transmission-value') as HTMLOutputElement | null;
  private readonly iorInput = document.getElementById('texture-ior') as HTMLInputElement | null;
  private readonly iorValue = document.getElementById('texture-ior-value') as HTMLOutputElement | null;
  private readonly thicknessInput = document.getElementById('texture-thickness') as HTMLInputElement | null;
  private readonly thicknessValue = document.getElementById('texture-thickness-value') as HTMLOutputElement | null;
  private readonly attenuationColorInput = document.getElementById('texture-attenuation-color') as HTMLInputElement | null;
  private readonly attenuationColorValue = document.getElementById('texture-attenuation-color-value') as HTMLOutputElement | null;
  private readonly attenuationDistanceInput = document.getElementById('texture-attenuation-distance') as HTMLInputElement | null;
  private readonly attenuationDistanceValue = document.getElementById('texture-attenuation-distance-value') as HTMLOutputElement | null;
  private readonly clearcoatInput = document.getElementById('texture-clearcoat') as HTMLInputElement | null;
  private readonly clearcoatValue = document.getElementById('texture-clearcoat-value') as HTMLOutputElement | null;
  private readonly clearcoatRoughnessInput = document.getElementById('texture-clearcoat-roughness') as HTMLInputElement | null;
  private readonly clearcoatRoughnessValue = document.getElementById('texture-clearcoat-roughness-value') as HTMLOutputElement | null;
  private readonly specularIntensityInput = document.getElementById('texture-specular-intensity') as HTMLInputElement | null;
  private readonly specularIntensityValue = document.getElementById('texture-specular-intensity-value') as HTMLOutputElement | null;
  private readonly materialSelect = document.getElementById('texture-material-select') as HTMLSelectElement | null;
  private readonly materialNameInput = document.getElementById('texture-material-name') as HTMLInputElement | null;
  private readonly materialCount = document.getElementById('texture-material-count') as HTMLOutputElement | null;
  private readonly materialSplitButton = document.getElementById('texture-material-split') as HTMLButtonElement | null;
  private syncingTextureUI = false;
  private syncingMaterialUI = false;
  private previewRenderer: THREE.WebGLRenderer | null = null;
  private previewScene: THREE.Scene | null = null;
  private previewCamera: THREE.PerspectiveCamera | null = null;
  private previewCube: THREE.Mesh<THREE.BoxGeometry, THREE.Material> | null = null;
  private previewStandardMaterial: THREE.MeshStandardMaterial | null = null;
  private previewGlassMaterial: THREE.MeshPhysicalMaterial | null = null;
  private previewEnvironmentTarget: THREE.WebGLRenderTarget | null = null;
  private previewBackdropTexture: THREE.CanvasTexture | null = null;
  private textureControlsEnabled = false;

  constructor(private readonly options: TextureEditorControllerOptions) {}

  initialize() {
    this.bindControls();
    window.addEventListener('scene-control-tab-change', ev => {
      if (!(ev instanceof CustomEvent) || ev.detail?.tab !== 'texture') return;
      requestAnimationFrame(() => this.updatePanel());
    });
    this.updatePanel();
  }

  updatePanel() {
    if (!this.panel) return;

    const target = this.options.getSurfaceTarget();
    const editable = !!target;
    this.textureControlsEnabled = editable;
    this.panel.classList.toggle('empty', !target);
    this.panel.classList.toggle('disabled', !editable);

    if (target) {
      this.syncMaterialControls(target);
      this.syncTextureControls(target.material.surface);
      this.setTextureInputsEnabled(editable, target.material.surface.materialType);
      this.renderTexturePreview(target.material.surface);
    } else {
      this.syncMaterialControls(null);
      this.syncTextureControls(DEFAULT_SURFACE);
      this.setTextureInputsEnabled(editable, DEFAULT_SURFACE.materialType);
      this.renderTexturePreview(DEFAULT_SURFACE);
    }
  }

  private syncMaterialControls(target: SurfaceTarget | null) {
    this.syncingMaterialUI = true;
    if (this.materialSelect) {
      this.materialSelect.replaceChildren();
      if (target) {
        target.materials.forEach(material => {
          const option = document.createElement('option');
          option.value = material.id;
          option.textContent = material.name;
          this.materialSelect?.appendChild(option);
        });
        this.materialSelect.value = target.materialId;
      } else {
        const option = document.createElement('option');
        option.value = '';
        option.textContent = 'No material';
        this.materialSelect.appendChild(option);
      }
    }

    const labels = target?.material.objectLabels ?? [];
    const count = labels.length;
    if (this.materialNameInput) this.materialNameInput.value = target?.material.name ?? '';
    if (this.materialCount) {
      this.materialCount.textContent = `${count}`;
      this.materialCount.title = labels.join(', ');
    }
    if (this.materialSplitButton) {
      this.materialSplitButton.disabled = !target || !target.canSplit || !this.textureControlsEnabled;
      this.materialSplitButton.title = !target?.hasObjectTarget
        ? 'Select an object to make its material independent'
        : target?.canSplit
          ? 'Make selected object use an independent material'
          : 'Selected object already has an independent material';
    }
    this.syncingMaterialUI = false;
  }

  private setTextureInputsEnabled(enabled: boolean, materialType = this.currentMaterialType()) {
    if (this.materialTypeSelect) this.materialTypeSelect.disabled = !enabled;
    if (this.baseColorInput) this.baseColorInput.disabled = !enabled;
    if (this.metallicInput) this.metallicInput.disabled = !enabled;
    if (this.roughnessInput) this.roughnessInput.disabled = !enabled;
    if (this.alphaInput) this.alphaInput.disabled = !enabled;
    if (this.emissiveColorInput) this.emissiveColorInput.disabled = !enabled;
    if (this.emissiveIntensityInput) this.emissiveIntensityInput.disabled = !enabled;
    if (this.transmissionInput) this.transmissionInput.disabled = !enabled;
    if (this.iorInput) this.iorInput.disabled = !enabled;
    if (this.thicknessInput) this.thicknessInput.disabled = !enabled;
    if (this.attenuationColorInput) this.attenuationColorInput.disabled = !enabled;
    if (this.attenuationDistanceInput) this.attenuationDistanceInput.disabled = !enabled;
    if (this.clearcoatInput) this.clearcoatInput.disabled = !enabled;
    if (this.clearcoatRoughnessInput) this.clearcoatRoughnessInput.disabled = !enabled;
    if (this.specularIntensityInput) this.specularIntensityInput.disabled = !enabled;
    if (this.materialSelect) this.materialSelect.disabled = !enabled;
    if (this.materialNameInput) this.materialNameInput.disabled = !enabled;
    if (this.materialSplitButton) this.materialSplitButton.disabled = !enabled || this.materialSplitButton.disabled;
    this.updateMaterialScopedRows(materialType, enabled);
  }

  private currentMaterialType(): SurfaceState['materialType'] {
    return this.materialTypeSelect?.value === 'glass' ? 'glass' : 'standard';
  }

  private updateMaterialScopedRows(materialType: SurfaceState['materialType'], enabled = this.textureControlsEnabled) {
    this.materialScopedRows.forEach(row => {
      const visible = row.dataset.materialScope === materialType;
      row.hidden = !visible;
      row.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLButtonElement>('input, select, button').forEach(control => {
        control.disabled = !enabled || !visible;
      });
    });
  }

  private syncTextureControls(surface: SurfaceState) {
    this.syncingTextureUI = true;
    if (this.materialTypeSelect) this.materialTypeSelect.value = surface.materialType;
    if (this.baseColorInput) this.baseColorInput.value = toColorHex(surface.color);
    if (this.metallicInput) this.metallicInput.value = `${surface.metalness}`;
    if (this.roughnessInput) this.roughnessInput.value = `${surface.roughness}`;
    if (this.alphaInput) this.alphaInput.value = `${surface.alpha}`;
    if (this.emissiveColorInput) this.emissiveColorInput.value = toColorHex(surface.emissiveColor);
    if (this.emissiveIntensityInput) this.emissiveIntensityInput.value = `${surface.emissiveIntensity}`;
    if (this.transmissionInput) this.transmissionInput.value = `${surface.transmission}`;
    if (this.iorInput) this.iorInput.value = `${surface.ior}`;
    if (this.thicknessInput) this.thicknessInput.value = `${surface.thickness}`;
    if (this.attenuationColorInput) this.attenuationColorInput.value = toColorHex(surface.attenuationColor);
    if (this.attenuationDistanceInput) this.attenuationDistanceInput.value = `${surface.attenuationDistance}`;
    if (this.clearcoatInput) this.clearcoatInput.value = `${surface.clearcoat}`;
    if (this.clearcoatRoughnessInput) this.clearcoatRoughnessInput.value = `${surface.clearcoatRoughness}`;
    if (this.specularIntensityInput) this.specularIntensityInput.value = `${surface.specularIntensity}`;
    if (this.materialTypeValue) this.materialTypeValue.textContent = surface.materialType === 'glass' ? 'Glass' : 'Standard';
    if (this.baseColorValue && this.baseColorInput) this.baseColorValue.textContent = this.baseColorInput.value;
    if (this.metallicValue) this.metallicValue.textContent = surface.metalness.toFixed(3);
    if (this.roughnessValue) this.roughnessValue.textContent = surface.roughness.toFixed(3);
    if (this.alphaValue) this.alphaValue.textContent = surface.alpha.toFixed(3);
    if (this.emissiveColorValue && this.emissiveColorInput) this.emissiveColorValue.textContent = this.emissiveColorInput.value;
    if (this.emissiveIntensityValue) this.emissiveIntensityValue.textContent = surface.emissiveIntensity.toFixed(2);
    if (this.transmissionValue) this.transmissionValue.textContent = surface.transmission.toFixed(3);
    if (this.iorValue) this.iorValue.textContent = surface.ior.toFixed(3);
    if (this.thicknessValue) this.thicknessValue.textContent = surface.thickness.toFixed(3);
    if (this.attenuationColorValue && this.attenuationColorInput) this.attenuationColorValue.textContent = this.attenuationColorInput.value;
    if (this.attenuationDistanceValue) this.attenuationDistanceValue.textContent = surface.attenuationDistance.toFixed(2);
    if (this.clearcoatValue) this.clearcoatValue.textContent = surface.clearcoat.toFixed(3);
    if (this.clearcoatRoughnessValue) this.clearcoatRoughnessValue.textContent = surface.clearcoatRoughness.toFixed(3);
    if (this.specularIntensityValue) this.specularIntensityValue.textContent = surface.specularIntensity.toFixed(3);
    this.updateMaterialScopedRows(surface.materialType);
    this.syncingTextureUI = false;
  }

  private ensureTexturePreview() {
    if (!this.previewCanvas || this.previewRenderer) return;

    const rendererRef = new THREE.WebGLRenderer({
      canvas: this.previewCanvas,
      antialias: true,
      alpha: true,
    });
    rendererRef.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    rendererRef.outputColorSpace = THREE.SRGBColorSpace;
    rendererRef.toneMapping = this.options.renderer.toneMapping;
    rendererRef.toneMappingExposure = this.options.renderer.toneMappingExposure;
    rendererRef.setClearColor(0x000000, 0);

    const cameraRef = new THREE.PerspectiveCamera(36, 1, 0.1, 10);
    cameraRef.position.set(1.8, 1.35, 1.9);
    cameraRef.lookAt(0, 0, 0);

    const sceneRef = new THREE.Scene();
    sceneRef.background = null;
    const previewPmrem = new THREE.PMREMGenerator(rendererRef);
    this.previewEnvironmentTarget = previewPmrem.fromScene(new RoomEnvironment(), 0.04);
    previewPmrem.dispose();
    sceneRef.environment = this.previewEnvironmentTarget.texture;
    this.addPreviewBackdrop(sceneRef, cameraRef);

    const cubeMaterial = new THREE.MeshStandardMaterial({
      color: DEFAULT_SURFACE.color,
      metalness: DEFAULT_SURFACE.metalness,
      roughness: DEFAULT_SURFACE.roughness,
      transparent: false,
      opacity: DEFAULT_SURFACE.alpha,
      emissive: DEFAULT_SURFACE.emissiveColor,
      emissiveIntensity: DEFAULT_SURFACE.emissiveIntensity,
      envMapIntensity: 1.8,
      side: THREE.DoubleSide,
    });
    const glassMaterial = new THREE.MeshPhysicalMaterial({
      color: DEFAULT_SURFACE.color,
      metalness: 0,
      roughness: DEFAULT_SURFACE.roughness,
      transparent: true,
      opacity: DEFAULT_SURFACE.alpha,
      transmission: DEFAULT_SURFACE.transmission,
      ior: DEFAULT_SURFACE.ior,
      thickness: DEFAULT_SURFACE.thickness,
      attenuationDistance: DEFAULT_SURFACE.attenuationDistance,
      attenuationColor: DEFAULT_SURFACE.attenuationColor,
      clearcoat: DEFAULT_SURFACE.clearcoat,
      clearcoatRoughness: DEFAULT_SURFACE.clearcoatRoughness,
      specularIntensity: DEFAULT_SURFACE.specularIntensity,
      emissive: DEFAULT_SURFACE.emissiveColor,
      emissiveIntensity: DEFAULT_SURFACE.emissiveIntensity,
      envMapIntensity: 1.8,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const cube = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), cubeMaterial);
    cube.rotation.set(0.45, 0.68, 0);
    sceneRef.add(cube);

    const previewLight = new THREE.DirectionalLight(0xffffff, Math.max(1.2, this.options.light.intensity * 1.25));
    previewLight.position.set(2.4, 2.2, 2.8);
    const previewFill = new THREE.DirectionalLight(0xc6d8ff, 0.55);
    previewFill.position.set(-2.1, 1.0, 1.5);
    const previewRim = new THREE.DirectionalLight(0xffe6c4, 0.42);
    previewRim.position.set(0.7, 1.35, -2.6);
    const previewAmbient = new THREE.AmbientLight(0xffffff, Math.max(0.42, this.options.ambient.intensity));
    const previewHemi = new THREE.HemisphereLight(
      this.options.hemi.color.getHex(),
      this.options.hemi.groundColor.getHex(),
      Math.max(0.72, this.options.hemi.intensity),
    );
    sceneRef.add(previewAmbient, previewHemi, previewLight, previewFill, previewRim);

    this.previewRenderer = rendererRef;
    this.previewScene = sceneRef;
    this.previewCamera = cameraRef;
    this.previewCube = cube;
    this.previewStandardMaterial = cubeMaterial;
    this.previewGlassMaterial = glassMaterial;
  }

  private addPreviewBackdrop(sceneRef: THREE.Scene, cameraRef: THREE.Camera) {
    this.previewBackdropTexture = this.createPreviewBackdropTexture();
    this.previewBackdropTexture.wrapS = THREE.RepeatWrapping;
    this.previewBackdropTexture.wrapT = THREE.RepeatWrapping;
    this.previewBackdropTexture.repeat.set(1.35, 1);
    this.previewBackdropTexture.colorSpace = THREE.SRGBColorSpace;

    const backdropMaterial = new THREE.MeshBasicMaterial({
      map: this.previewBackdropTexture,
      side: THREE.DoubleSide,
      toneMapped: false,
    });
    const backdrop = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 2.25), backdropMaterial);
    const viewDir = new THREE.Vector3().subVectors(new THREE.Vector3(), cameraRef.position).normalize();
    backdrop.position.copy(viewDir.multiplyScalar(1.16));
    backdrop.lookAt(cameraRef.position);
    backdrop.renderOrder = -20;
    sceneRef.add(backdrop);

    const floorMaterial = backdropMaterial.clone();
    floorMaterial.map = this.previewBackdropTexture;
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(2.3, 2.3), floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, -0.68, 0);
    floor.renderOrder = -10;
    sceneRef.add(floor);
  }

  private createPreviewBackdropTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.CanvasTexture(canvas);

    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#f6d47d');
    gradient.addColorStop(0.48, '#4f7dd8');
    gradient.addColorStop(1, '#141a23');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const size = 32;
    for (let y = 0; y < canvas.height; y += size) {
      for (let x = 0; x < canvas.width; x += size) {
        ctx.fillStyle = ((x / size + y / size) % 2 === 0)
          ? 'rgba(255,255,255,0.34)'
          : 'rgba(0,0,0,0.26)';
        ctx.fillRect(x, y, size, size);
      }
    }

    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    ctx.lineWidth = 3;
    for (let x = -canvas.height; x < canvas.width; x += 48) {
      ctx.beginPath();
      ctx.moveTo(x, canvas.height);
      ctx.lineTo(x + canvas.height, 0);
      ctx.stroke();
    }

    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.beginPath();
    ctx.arc(196, 58, 26, 0, Math.PI * 2);
    ctx.fill();

    return new THREE.CanvasTexture(canvas);
  }

  private renderTexturePreview(surface: SurfaceState | null) {
    this.ensureTexturePreview();
    if (!this.previewRenderer || !this.previewScene || !this.previewCamera || !this.previewCube || !this.previewCanvas) return;

    const width = Math.max(1, this.previewCanvas.clientWidth);
    const height = Math.max(1, this.previewCanvas.clientHeight);
    this.previewRenderer.setSize(width, height, false);
    this.previewCamera.aspect = width / height;
    this.previewCamera.updateProjectionMatrix();

    if (!surface) {
      this.previewRenderer.clear();
      return;
    }

    this.applyPreviewMaterials(surface);
    this.previewCube.material = surface.materialType === 'glass'
      ? this.previewGlassMaterial ?? this.previewCube.material
      : this.previewStandardMaterial ?? this.previewCube.material;

    this.previewRenderer.render(this.previewScene, this.previewCamera);
  }

  private applyPreviewMaterials(surface: SurfaceState) {
    if (this.previewStandardMaterial) {
      const material = this.previewStandardMaterial;
      material.color.setHex(surface.color);
      material.metalness = surface.metalness;
      material.roughness = surface.roughness;
      material.opacity = surface.alpha;
      material.emissive.setHex(surface.emissiveColor);
      material.emissiveIntensity = surface.emissiveIntensity;
      material.transparent = surface.alpha < OPAQUE_ALPHA_THRESHOLD;
      material.alphaHash = false;
      material.alphaToCoverage = false;
      material.depthWrite = true;
      material.needsUpdate = true;
    }

    if (this.previewGlassMaterial) {
      const material = this.previewGlassMaterial;
      material.color.setHex(surface.color);
      material.metalness = 0;
      material.roughness = surface.roughness;
      material.opacity = surface.alpha;
      material.transparent = true;
      material.transmission = surface.transmission;
      material.ior = surface.ior;
      material.thickness = surface.thickness;
      material.attenuationDistance = surface.attenuationDistance;
      material.attenuationColor.setHex(surface.attenuationColor);
      material.clearcoat = surface.clearcoat;
      material.clearcoatRoughness = surface.clearcoatRoughness;
      material.specularIntensity = surface.specularIntensity;
      material.emissive.setHex(surface.emissiveColor);
      material.emissiveIntensity = surface.emissiveIntensity;
      material.alphaHash = false;
      material.alphaToCoverage = false;
      material.depthWrite = false;
      material.needsUpdate = true;
    }
  }

  private readSurfaceFromTextureInputs() {
    if (!this.baseColorInput || !this.metallicInput || !this.roughnessInput || !this.alphaInput) return;
    return normalizeSurface({
      materialType: this.materialTypeSelect?.value === 'glass' ? 'glass' : 'standard',
      color: Number.parseInt(this.baseColorInput.value.replace('#', ''), 16),
      metalness: Number.parseFloat(this.metallicInput.value),
      roughness: Number.parseFloat(this.roughnessInput.value),
      alpha: Number.parseFloat(this.alphaInput.value),
      emissiveColor: Number.parseInt((this.emissiveColorInput?.value ?? toColorHex(DEFAULT_SURFACE.emissiveColor)).replace('#', ''), 16),
      emissiveIntensity: Number.parseFloat(this.emissiveIntensityInput?.value ?? `${DEFAULT_SURFACE.emissiveIntensity}`),
      transmission: Number.parseFloat(this.transmissionInput?.value ?? `${DEFAULT_SURFACE.transmission}`),
      ior: Number.parseFloat(this.iorInput?.value ?? `${DEFAULT_SURFACE.ior}`),
      thickness: Number.parseFloat(this.thicknessInput?.value ?? `${DEFAULT_SURFACE.thickness}`),
      attenuationColor: Number.parseInt((this.attenuationColorInput?.value ?? toColorHex(DEFAULT_SURFACE.attenuationColor)).replace('#', ''), 16),
      attenuationDistance: Number.parseFloat(this.attenuationDistanceInput?.value ?? `${DEFAULT_SURFACE.attenuationDistance}`),
      clearcoat: Number.parseFloat(this.clearcoatInput?.value ?? `${DEFAULT_SURFACE.clearcoat}`),
      clearcoatRoughness: Number.parseFloat(this.clearcoatRoughnessInput?.value ?? `${DEFAULT_SURFACE.clearcoatRoughness}`),
      specularIntensity: Number.parseFloat(this.specularIntensityInput?.value ?? `${DEFAULT_SURFACE.specularIntensity}`),
    });
  }

  private applyTextureFromInputs(recordUndo: boolean) {
    if (this.syncingTextureUI) return;
    const surface = this.readSurfaceFromTextureInputs();
    if (!surface) return;
    this.applySurface(surface, recordUndo);
  }

  private applySurface(surface: SurfaceState, recordUndo: boolean) {
    const nextSurface = normalizeSurface(surface);
    this.options.applySurfaceToTarget(nextSurface, recordUndo);
    this.syncTextureControls(nextSurface);
    this.renderTexturePreview(nextSurface);
  }

  private bindControls() {
    if (!this.panel) return;

    this.materialTypeSelect?.addEventListener('change', () => {
      if (this.materialTypeValue && this.materialTypeSelect) {
        this.materialTypeValue.textContent = this.materialTypeSelect.value === 'glass' ? 'Glass' : 'Standard';
      }
      this.updateMaterialScopedRows(this.currentMaterialType());
      this.applyTextureFromInputs(true);
    });
    this.baseColorInput?.addEventListener('input', () => {
      if (this.baseColorValue && this.baseColorInput) this.baseColorValue.textContent = this.baseColorInput.value;
      this.applyTextureFromInputs(false);
    });
    this.emissiveColorInput?.addEventListener('input', () => {
      if (this.emissiveColorValue && this.emissiveColorInput) this.emissiveColorValue.textContent = this.emissiveColorInput.value;
      this.applyTextureFromInputs(false);
    });
    this.attenuationColorInput?.addEventListener('input', () => {
      if (this.attenuationColorValue && this.attenuationColorInput) this.attenuationColorValue.textContent = this.attenuationColorInput.value;
      this.applyTextureFromInputs(false);
    });
    this.bindRangeInput(this.metallicInput, this.metallicValue, 3, false);
    this.bindRangeInput(this.roughnessInput, this.roughnessValue, 3, false);
    this.bindRangeInput(this.alphaInput, this.alphaValue, 3, false);
    this.bindRangeInput(this.emissiveIntensityInput, this.emissiveIntensityValue, 2, false);
    this.bindRangeInput(this.transmissionInput, this.transmissionValue, 3, false);
    this.bindRangeInput(this.iorInput, this.iorValue, 3, false);
    this.bindRangeInput(this.thicknessInput, this.thicknessValue, 3, false);
    this.bindRangeInput(this.attenuationDistanceInput, this.attenuationDistanceValue, 2, false);
    this.bindRangeInput(this.clearcoatInput, this.clearcoatValue, 3, false);
    this.bindRangeInput(this.clearcoatRoughnessInput, this.clearcoatRoughnessValue, 3, false);
    this.bindRangeInput(this.specularIntensityInput, this.specularIntensityValue, 3, false);

    this.baseColorInput?.addEventListener('change', () => this.applyTextureFromInputs(true));
    this.emissiveColorInput?.addEventListener('change', () => this.applyTextureFromInputs(true));
    this.attenuationColorInput?.addEventListener('change', () => this.applyTextureFromInputs(true));
    this.bindRangeInput(this.metallicInput, this.metallicValue, 3, true);
    this.bindRangeInput(this.roughnessInput, this.roughnessValue, 3, true);
    this.bindRangeInput(this.alphaInput, this.alphaValue, 3, true);
    this.bindRangeInput(this.emissiveIntensityInput, this.emissiveIntensityValue, 2, true);
    this.bindRangeInput(this.transmissionInput, this.transmissionValue, 3, true);
    this.bindRangeInput(this.iorInput, this.iorValue, 3, true);
    this.bindRangeInput(this.thicknessInput, this.thicknessValue, 3, true);
    this.bindRangeInput(this.attenuationDistanceInput, this.attenuationDistanceValue, 2, true);
    this.bindRangeInput(this.clearcoatInput, this.clearcoatValue, 3, true);
    this.bindRangeInput(this.clearcoatRoughnessInput, this.clearcoatRoughnessValue, 3, true);
    this.bindRangeInput(this.specularIntensityInput, this.specularIntensityValue, 3, true);

    this.materialSelect?.addEventListener('change', () => {
      if (this.syncingMaterialUI || !this.materialSelect) return;
      if (!this.materialSelect.value) return;
      this.options.assignMaterialToTarget(this.materialSelect.value, true);
      this.updatePanel();
    });
    this.materialNameInput?.addEventListener('change', () => {
      if (this.syncingMaterialUI || !this.materialNameInput) return;
      const target = this.options.getSurfaceTarget();
      if (!target) return;
      this.options.renameMaterial(target.materialId, this.materialNameInput.value, true);
      this.updatePanel();
    });
    this.materialSplitButton?.addEventListener('click', () => {
      if (this.syncingMaterialUI) return;
      this.options.splitMaterialForTarget();
      this.updatePanel();
    });
  }

  private bindRangeInput(input: HTMLInputElement | null, output: HTMLOutputElement | null, digits: number, commit: boolean) {
    input?.addEventListener(commit ? 'change' : 'input', () => {
      if (output && input) output.textContent = Number.parseFloat(input.value).toFixed(digits);
      this.applyTextureFromInputs(commit);
    });
  }

}
