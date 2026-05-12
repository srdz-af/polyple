import * as THREE from 'three';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import type { ViewMode } from '../constants';
import {
  readStoredBoolean,
  readStoredColor,
  readStoredNumber,
  safeLocalStorageGet,
  safeLocalStorageSet,
} from '../utils/localStorage';

const HDR_BACKGROUND_SELECTION_KEY = 'blend.hdriSelection.v1';
const HDR_BACKGROUND_BLUR_KEY = 'blend.hdriBlur.v1';
const HDR_BACKGROUND_LIGHTNESS_KEY = 'blend.hdriLightness.v2';
const HDR_BACKGROUND_QUALITY_KEY = 'blend.hdriQuality.v1';
const PLAIN_BACKGROUND_COLOR_KEY = 'blend.plainBackgroundColor.v1';
const ENVIRONMENT_LIGHTING_KEY = 'blend.environmentLighting.v1';
const HDR_BACKGROUND_BLUR_DEFAULT = 0;
const HDR_BACKGROUND_LIGHTNESS_DEFAULT = 0.15;
const ENVIRONMENT_LIGHTING_DEFAULT = true;
const PLAIN_BACKGROUND_KEY = 'plain' as const;
const DEFAULT_SOLID_BACKGROUND_KEY = 'ferndale' as const;
const DEFAULT_HDR_QUALITY = 'sd' as const;
const HDR_QUALITIES = ['sd', 'hd'] as const;

const VITE_BASE_URL = (() => {
  const env = (import.meta as { env?: { BASE_URL?: unknown } }).env;
  if (typeof env?.BASE_URL !== 'string') return '';
  const trimmed = env.BASE_URL.trim();
  if (!trimmed) return '';
  const withLeadingSlash = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return withLeadingSlash.endsWith('/') ? withLeadingSlash : `${withLeadingSlash}/`;
})();

const APP_BASE_URL = (() => {
  if (VITE_BASE_URL) return VITE_BASE_URL;
  try {
    const path = new URL('.', document.baseURI).pathname;
    return path.endsWith('/') ? path : `${path}/`;
  } catch {
    return '/';
  }
})();

const HDR_BACKGROUND_OPTIONS = [
  {
    key: 'ferndale',
    label: 'Ferndale studio',
    preview: 'hdri/previews/ferndale_studio_12_1k.webp',
    urls: {
      sd: ['hdri/sd/ferndale_studio_12_1k.hdr'],
      hd: ['hdri/hd/ferndale_studio_12_2k.hdr'],
    },
  },
  {
    key: 'monochrome',
    label: 'Monochrome studio',
    preview: 'hdri/previews/monochrome_studio_02_1k.webp',
    urls: {
      sd: ['hdri/sd/monochrome_studio_02_1k.hdr'],
      hd: ['hdri/hd/monochrome_studio_02_2k.hdr'],
    },
  },
  {
    key: 'sundowner',
    label: 'Sundowner deck',
    preview: 'hdri/previews/sundowner_deck_1k.webp',
    urls: {
      sd: ['hdri/sd/sundowner_deck_1k.hdr'],
      hd: ['hdri/hd/sundowner_deck_2k.hdr'],
    },
  },
  {
    key: 'grasslands',
    label: 'Grasslands sunset',
    preview: 'hdri/previews/grasslands_sunset_1k.webp',
    urls: {
      sd: ['hdri/sd/grasslands_sunset_1k.hdr'],
      hd: ['hdri/hd/grasslands_sunset_2k.hdr'],
    },
  },
] as const;

type HdriBackgroundOption = (typeof HDR_BACKGROUND_OPTIONS)[number];
type HdriBackgroundKey = HdriBackgroundOption['key'];
type HdriQuality = (typeof HDR_QUALITIES)[number];
type BackgroundKey = HdriBackgroundKey | typeof PLAIN_BACKGROUND_KEY;
type BackgroundOption = HdriBackgroundOption | { key: typeof PLAIN_BACKGROUND_KEY; label: 'Plain background'; };

type BackgroundControllerOptions = {
  scene: THREE.Scene;
  renderer: THREE.WebGLRenderer;
  pmrem: THREE.PMREMGenerator;
  fallbackEnvironmentTarget: THREE.WebGLRenderTarget;
  baseBackground: THREE.Color;
  editBackground: THREE.Color;
  selectorEl: HTMLDivElement | null;
  swatchButtons: HTMLButtonElement[];
  blurInput: HTMLInputElement | null;
  blurValue: HTMLOutputElement | null;
  lightnessInput: HTMLInputElement | null;
  lightnessValue: HTMLOutputElement | null;
  colorInput: HTMLInputElement | null;
  colorValue: HTMLOutputElement | null;
  environmentLightButton: HTMLButtonElement | null;
  qualityButtons: HTMLButtonElement[];
  controlsEl: HTMLDivElement | null;
  getRenderMode: () => ViewMode;
  getEditMode: () => boolean;
  onStateChange?: () => void;
};

export function backgroundElementsFromDocument() {
  return {
    selectorEl: document.getElementById('background-selector') as HTMLDivElement | null,
    swatchButtons: Array.from(document.querySelectorAll('#background-swatches .background-swatch[data-hdri]')) as HTMLButtonElement[],
    blurInput: document.getElementById('background-blur') as HTMLInputElement | null,
    blurValue: document.getElementById('background-blur-value') as HTMLOutputElement | null,
    lightnessInput: document.getElementById('background-lightness') as HTMLInputElement | null,
    lightnessValue: document.getElementById('background-lightness-value') as HTMLOutputElement | null,
    colorInput: document.getElementById('background-color') as HTMLInputElement | null,
    colorValue: document.getElementById('background-color-value') as HTMLOutputElement | null,
    environmentLightButton: document.getElementById('environment-light-toggle') as HTMLButtonElement | null,
    qualityButtons: Array.from(document.querySelectorAll('#background-quality-toggle button[data-hdri-quality]')) as HTMLButtonElement[],
    controlsEl: document.getElementById('background-controls') as HTMLDivElement | null,
  } satisfies Pick<BackgroundControllerOptions,
    | 'selectorEl'
    | 'swatchButtons'
    | 'blurInput'
    | 'blurValue'
    | 'lightnessInput'
    | 'lightnessValue'
    | 'colorInput'
    | 'colorValue'
    | 'environmentLightButton'
    | 'qualityButtons'
    | 'controlsEl'
  >;
}

export type BackgroundUrlState = {
  key: string;
  quality: HdriQuality;
  blur: number;
  lightness: number;
  color: number;
  environmentLighting: boolean;
};

const backgroundOptionByKey = new Map<BackgroundKey, BackgroundOption>([
  [PLAIN_BACKGROUND_KEY, { key: PLAIN_BACKGROUND_KEY, label: 'Plain background' }],
  ...HDR_BACKGROUND_OPTIONS.map(option => [option.key, option] as const),
]);

const hdrBackgroundOptionByKey = new Map<HdriBackgroundKey, HdriBackgroundOption>(
  HDR_BACKGROUND_OPTIONS.map(option => [option.key, option]),
);

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

function clampHdrLightness(value: number) {
  return Math.max(0, Math.min(2.0, value));
}

function isHdriBackgroundKey(key: BackgroundKey): key is HdriBackgroundKey {
  return key !== PLAIN_BACKGROUND_KEY;
}

function normalizeSolidBackgroundKey(value: string | null | undefined): HdriBackgroundKey {
  if (!value) return DEFAULT_SOLID_BACKGROUND_KEY;
  const match = HDR_BACKGROUND_OPTIONS.find(option => option.key === value);
  return match?.key ?? DEFAULT_SOLID_BACKGROUND_KEY;
}

function normalizeBackgroundKey(value: string | null | undefined): BackgroundKey {
  if (value === PLAIN_BACKGROUND_KEY) return PLAIN_BACKGROUND_KEY;
  return normalizeSolidBackgroundKey(value);
}

function normalizeHdrQuality(value: string | null | undefined): HdriQuality {
  return HDR_QUALITIES.includes(value as HdriQuality) ? value as HdriQuality : DEFAULT_HDR_QUALITY;
}

function finiteNumber(value: number | undefined, fallback: number) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function hdrCacheKey(key: HdriBackgroundKey, quality: HdriQuality) {
  return `${quality}:${key}`;
}

function hdrCandidateUrls(rawPath: string) {
  const clean = rawPath.replace(/^\/+/, '');
  const primary = `${APP_BASE_URL}${clean}`;
  if (APP_BASE_URL === '/') return [primary];
  return [primary, `/${clean}`];
}

function colorToHex(color: THREE.Color) {
  return `#${color.getHexString()}`;
}

export class BackgroundController {
  private readonly scene: THREE.Scene;
  private readonly renderer: THREE.WebGLRenderer;
  private readonly pmrem: THREE.PMREMGenerator;
  private readonly fallbackEnvironmentTarget: THREE.WebGLRenderTarget;
  private readonly editBackground: THREE.Color;
  private readonly selectorEl: HTMLDivElement | null;
  private readonly swatchButtons: HTMLButtonElement[];
  private readonly blurInput: HTMLInputElement | null;
  private readonly blurValue: HTMLOutputElement | null;
  private readonly lightnessInput: HTMLInputElement | null;
  private readonly lightnessValue: HTMLOutputElement | null;
  private readonly colorInput: HTMLInputElement | null;
  private readonly colorValue: HTMLOutputElement | null;
  private readonly environmentLightButton: HTMLButtonElement | null;
  private readonly qualityButtons: HTMLButtonElement[];
  private readonly controlsEl: HTMLDivElement | null;
  private readonly getRenderMode: () => ViewMode;
  private readonly getEditMode: () => boolean;
  private readonly onStateChange?: () => void;
  private readonly hdrLoader = new RGBELoader();
  private readonly hdrBackgroundTextureCache = new Map<string, THREE.Texture>();
  private readonly hdrEnvironmentTargetCache = new Map<string, THREE.WebGLRenderTarget>();
  private readonly sceneBackgroundColor = new THREE.Color();
  private readonly plainBackgroundColor = new THREE.Color();
  private hdrBackgroundTexture: THREE.Texture | null = null;
  private hdrEnvironmentTexture: THREE.Texture | null = null;
  private activeBackgroundKey: BackgroundKey | null = null;
  private activeHdrQuality: HdriQuality | null = null;
  private hdrBackgroundLoadingKey: HdriBackgroundKey | null = null;
  private hdrBackgroundBlur = HDR_BACKGROUND_BLUR_DEFAULT;
  private hdrBackgroundLightness = HDR_BACKGROUND_LIGHTNESS_DEFAULT;
  private environmentLightingEnabled = ENVIRONMENT_LIGHTING_DEFAULT;
  private hdrQuality: HdriQuality = DEFAULT_HDR_QUALITY;

  constructor(options: BackgroundControllerOptions) {
    this.scene = options.scene;
    this.renderer = options.renderer;
    this.pmrem = options.pmrem;
    this.fallbackEnvironmentTarget = options.fallbackEnvironmentTarget;
    this.editBackground = options.editBackground;
    this.selectorEl = options.selectorEl;
    this.swatchButtons = options.swatchButtons;
    this.blurInput = options.blurInput;
    this.blurValue = options.blurValue;
    this.lightnessInput = options.lightnessInput;
    this.lightnessValue = options.lightnessValue;
    this.colorInput = options.colorInput;
    this.colorValue = options.colorValue;
    this.environmentLightButton = options.environmentLightButton;
    this.qualityButtons = options.qualityButtons;
    this.controlsEl = options.controlsEl;
    this.getRenderMode = options.getRenderMode;
    this.getEditMode = options.getEditMode;
    this.onStateChange = options.onStateChange;
    this.hdrBackgroundBlur = clamp01(readStoredNumber(HDR_BACKGROUND_BLUR_KEY, this.hdrBackgroundBlur));
    this.hdrBackgroundLightness = clampHdrLightness(
      readStoredNumber(HDR_BACKGROUND_LIGHTNESS_KEY, this.hdrBackgroundLightness),
    );
    this.plainBackgroundColor.setHex(readStoredColor(PLAIN_BACKGROUND_COLOR_KEY, options.baseBackground.getHex()));
    this.environmentLightingEnabled = readStoredBoolean(ENVIRONMENT_LIGHTING_KEY, this.environmentLightingEnabled);
    try {
      this.hdrQuality = normalizeHdrQuality(safeLocalStorageGet(HDR_BACKGROUND_QUALITY_KEY));
    } catch {
      this.hdrQuality = DEFAULT_HDR_QUALITY;
    }
    this.syncRenderControls();
  }

  applySceneBackground(useEditMode: boolean) {
    if (useEditMode) {
      this.sceneBackgroundColor.copy(this.editBackground);
      this.scene.background = this.sceneBackgroundColor;
      this.scene.backgroundBlurriness = 0;
      this.scene.backgroundIntensity = 1;
      this.renderer.setClearColor(this.sceneBackgroundColor);
      return;
    }

    if (this.hdrBackgroundTexture) {
      this.scene.background = this.hdrBackgroundTexture;
      this.scene.backgroundBlurriness = this.hdrBackgroundBlur;
      this.scene.backgroundIntensity = this.hdrBackgroundLightness;
      return;
    }

    this.sceneBackgroundColor.copy(this.plainBackgroundColor);
    this.scene.background = this.sceneBackgroundColor;
    this.scene.backgroundBlurriness = 0;
    this.scene.backgroundIntensity = 1;
    this.renderer.setClearColor(this.sceneBackgroundColor);
  }

  initializeRenderControls() {
    this.syncRenderControls();
    this.environmentLightButton?.addEventListener('click', () => {
      this.environmentLightingEnabled = !this.environmentLightingEnabled;
      this.syncSceneEnvironment();
      this.storeRenderSettings();
      this.syncRenderControls();
      this.onStateChange?.();
    });

    this.blurInput?.addEventListener('input', () => {
      if (!this.blurInput) return;
      const next = clamp01(Number.parseFloat(this.blurInput.value));
      this.hdrBackgroundBlur = next;
      if (this.blurValue) this.blurValue.textContent = next.toFixed(2);
      this.applySceneBackground(this.getEditMode());
      this.storeRenderSettings();
      this.onStateChange?.();
    });

    this.lightnessInput?.addEventListener('input', () => {
      if (!this.lightnessInput) return;
      const next = clampHdrLightness(Number.parseFloat(this.lightnessInput.value));
      this.hdrBackgroundLightness = next;
      if (this.lightnessValue) this.lightnessValue.textContent = next.toFixed(2);
      this.applySceneBackground(this.getEditMode());
      this.storeRenderSettings();
      this.onStateChange?.();
    });

    this.colorInput?.addEventListener('input', () => {
      if (!this.colorInput) return;
      this.plainBackgroundColor.set(this.colorInput.value);
      if (this.colorValue) this.colorValue.textContent = colorToHex(this.plainBackgroundColor);
      this.applySceneBackground(this.getEditMode());
      this.storeRenderSettings();
      this.updateSwatchUI();
      this.onStateChange?.();
    });

    this.qualityButtons.forEach(button => {
      button.addEventListener('click', () => {
        const next = normalizeHdrQuality(button.dataset.hdriQuality);
        if (next === this.hdrQuality) return;
        this.hdrQuality = next;
        this.storeRenderSettings();
        this.updateSwatchUI();
        this.onStateChange?.();
        const activeKey = this.activeBackgroundKey;
        if (activeKey && isHdriBackgroundKey(activeKey)) {
          void this.setActiveBackground(activeKey);
        }
      });
    });
  }

  async initializeSelector() {
    if (!this.selectorEl || this.swatchButtons.length === 0) return;
    const swatchesStrip = this.selectorEl.querySelector<HTMLDivElement>('#background-swatches');
    if (swatchesStrip && swatchesStrip.dataset.wheelScrollBound !== 'true') {
      swatchesStrip.dataset.wheelScrollBound = 'true';
      swatchesStrip.addEventListener('wheel', ev => {
        if (swatchesStrip.scrollWidth <= swatchesStrip.clientWidth) return;
        const delta = Math.abs(ev.deltaY) >= Math.abs(ev.deltaX) ? ev.deltaY : ev.deltaX;
        if (Math.abs(delta) < 0.01) return;
        swatchesStrip.scrollLeft += delta;
        ev.preventDefault();
      }, { passive: false });
    }

    this.swatchButtons.forEach(button => {
      const key = normalizeBackgroundKey(button.dataset.hdri);
      const option = backgroundOptionByKey.get(key);
      if (option) {
        button.title = option.label;
        button.setAttribute('aria-label', option.label);
        if ('preview' in option) {
          button.style.setProperty('--swatch-image', `url('${APP_BASE_URL}${option.preview}')`);
        } else {
          button.style.removeProperty('--swatch-image');
        }
      }
      button.addEventListener('click', () => {
        void this.setActiveBackground(key).then(applied => {
          if (applied) this.onStateChange?.();
        });
      });
    });

    this.updateSwatchUI();

    if (this.getRenderMode() !== 'solid') {
      await this.setActiveBackground(PLAIN_BACKGROUND_KEY);
      return;
    }

    await this.setActiveBackground(PLAIN_BACKGROUND_KEY);
  }

  syncForRenderMode() {
    if (this.activeBackgroundKey == null) {
      void this.setActiveBackground(PLAIN_BACKGROUND_KEY);
      return;
    }
    this.updateSwatchUI();
  }

  setHdrQuality(quality: 'sd' | 'hd') {
    const next = normalizeHdrQuality(quality);
    if (next === this.hdrQuality) return;
    this.hdrQuality = next;
    this.storeRenderSettings();
    this.updateSwatchUI();
    this.onStateChange?.();
    const activeKey = this.activeBackgroundKey;
    if (activeKey && isHdriBackgroundKey(activeKey)) {
      void this.setActiveBackground(activeKey);
    }
  }

  getUrlState(): BackgroundUrlState {
    return {
      key: this.activeBackgroundKey ?? this.getStoredHdrBackgroundKey(),
      quality: this.hdrQuality,
      blur: this.hdrBackgroundBlur,
      lightness: this.hdrBackgroundLightness,
      color: this.plainBackgroundColor.getHex(),
      environmentLighting: this.environmentLightingEnabled,
    };
  }

  async applyUrlState(state: Partial<BackgroundUrlState> | null | undefined) {
    if (!state) return;
    this.hdrQuality = normalizeHdrQuality(state.quality);
    this.hdrBackgroundBlur = clamp01(finiteNumber(state.blur, this.hdrBackgroundBlur));
    this.hdrBackgroundLightness = clampHdrLightness(
      finiteNumber(state.lightness, this.hdrBackgroundLightness),
    );
    this.plainBackgroundColor.setHex(Math.max(0, Math.min(0xffffff, finiteNumber(state.color, this.plainBackgroundColor.getHex()) >>> 0)));
    if (typeof state.environmentLighting === 'boolean') {
      this.environmentLightingEnabled = state.environmentLighting;
    }
    this.storeRenderSettings();
    this.syncRenderControls();
    await this.setActiveBackground(normalizeBackgroundKey(state.key));
    this.syncSceneEnvironment();
  }

  private syncRenderControls() {
    if (this.blurInput) this.blurInput.value = this.hdrBackgroundBlur.toFixed(2);
    if (this.blurValue) this.blurValue.textContent = this.hdrBackgroundBlur.toFixed(2);
    if (this.lightnessInput) this.lightnessInput.value = this.hdrBackgroundLightness.toFixed(2);
    if (this.lightnessValue) this.lightnessValue.textContent = this.hdrBackgroundLightness.toFixed(2);
    if (this.colorInput) this.colorInput.value = colorToHex(this.plainBackgroundColor);
    if (this.colorValue) this.colorValue.textContent = colorToHex(this.plainBackgroundColor);
    if (this.environmentLightButton) {
      this.environmentLightButton.textContent = this.environmentLightingEnabled ? 'On' : 'Off';
      this.environmentLightButton.classList.toggle('active', this.environmentLightingEnabled);
      this.environmentLightButton.setAttribute('aria-pressed', String(this.environmentLightingEnabled));
      this.environmentLightButton.title = this.environmentLightingEnabled
        ? 'Disable environment lighting'
        : 'Enable environment lighting';
    }
    this.qualityButtons.forEach(button => {
      const quality = normalizeHdrQuality(button.dataset.hdriQuality);
      const active = quality === this.hdrQuality;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
  }

  private storeRenderSettings() {
    try {
      safeLocalStorageSet(HDR_BACKGROUND_BLUR_KEY, String(this.hdrBackgroundBlur));
      safeLocalStorageSet(HDR_BACKGROUND_LIGHTNESS_KEY, String(this.hdrBackgroundLightness));
      safeLocalStorageSet(HDR_BACKGROUND_QUALITY_KEY, this.hdrQuality);
      safeLocalStorageSet(PLAIN_BACKGROUND_COLOR_KEY, String(this.plainBackgroundColor.getHex()));
      safeLocalStorageSet(ENVIRONMENT_LIGHTING_KEY, this.environmentLightingEnabled ? '1' : '0');
    } catch {
      // Storage may be unavailable in private sessions.
    }
  }

  private syncSceneEnvironment() {
    this.scene.environment = this.environmentLightingEnabled
      ? this.hdrEnvironmentTexture ?? this.fallbackEnvironmentTarget.texture
      : null;
  }

  private getStoredHdrBackgroundKey(): HdriBackgroundKey {
    try {
      return normalizeSolidBackgroundKey(safeLocalStorageGet(HDR_BACKGROUND_SELECTION_KEY));
    } catch {
      return DEFAULT_SOLID_BACKGROUND_KEY;
    }
  }

  private storeHdrBackgroundKey(key: HdriBackgroundKey) {
    try {
      safeLocalStorageSet(HDR_BACKGROUND_SELECTION_KEY, key);
    } catch {
      // Storage may be unavailable in private sessions.
    }
  }

  private updateSwatchUI() {
    const controlsEnabled = this.activeBackgroundKey != null && this.activeBackgroundKey !== PLAIN_BACKGROUND_KEY;
    this.selectorEl?.classList.remove('plain-only');
    this.controlsEl?.classList.toggle('disabled', !controlsEnabled);
    if (this.blurInput) this.blurInput.disabled = !controlsEnabled;
    if (this.lightnessInput) this.lightnessInput.disabled = !controlsEnabled;
    this.syncRenderControls();
    this.qualityButtons.forEach(button => {
      button.disabled = !controlsEnabled;
    });

    this.swatchButtons.forEach(button => {
      const key = normalizeBackgroundKey(button.dataset.hdri);
      if (key === PLAIN_BACKGROUND_KEY) button.style.setProperty('--plain-background-color', colorToHex(this.plainBackgroundColor));
      const loading = isHdriBackgroundKey(key) && key === this.hdrBackgroundLoadingKey;
      const active = key === this.activeBackgroundKey;
      button.classList.toggle('loading', loading);
      button.classList.toggle('active', active);
      button.disabled = loading;
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
  }

  private async setActiveBackground(key: BackgroundKey) {
    const option = backgroundOptionByKey.get(key);
    if (!option) return false;

    if (!isHdriBackgroundKey(key)) {
      if (this.activeBackgroundKey === PLAIN_BACKGROUND_KEY && !this.hdrBackgroundTexture) {
        this.hdrEnvironmentTexture = null;
        this.syncSceneEnvironment();
        return true;
      }
      this.activeBackgroundKey = PLAIN_BACKGROUND_KEY;
      this.activeHdrQuality = null;
      this.hdrBackgroundTexture = null;
      this.hdrEnvironmentTexture = null;
      this.syncSceneEnvironment();
      this.applySceneBackground(this.getEditMode());
      this.updateSwatchUI();
      return true;
    }

    const hdriOption = hdrBackgroundOptionByKey.get(key);
    if (!hdriOption) return false;
    if (this.hdrBackgroundLoadingKey === key) return false;
    if (this.activeBackgroundKey === key && this.activeHdrQuality === this.hdrQuality && this.hdrBackgroundTexture) return true;

    this.hdrBackgroundLoadingKey = key;
    this.updateSwatchUI();
    try {
      const cacheKey = hdrCacheKey(key, this.hdrQuality);
      let hdrTexture = this.hdrBackgroundTextureCache.get(cacheKey);
      if (!hdrTexture) {
        const candidates = new Set<string>();
        for (const rawPath of hdriOption.urls[this.hdrQuality]) {
          hdrCandidateUrls(rawPath).forEach(url => candidates.add(url));
        }
        for (const candidateUrl of candidates) {
          try {
            hdrTexture = await this.hdrLoader.loadAsync(candidateUrl);
            break;
          } catch {
            // Try next URL candidate.
          }
        }
        if (!hdrTexture) {
          return false;
        }
        hdrTexture.mapping = THREE.EquirectangularReflectionMapping;
        this.hdrBackgroundTextureCache.set(cacheKey, hdrTexture);
      }

      let environmentTarget = this.hdrEnvironmentTargetCache.get(cacheKey);
      if (!environmentTarget) {
        environmentTarget = this.pmrem.fromEquirectangular(hdrTexture);
        this.hdrEnvironmentTargetCache.set(cacheKey, environmentTarget);
      }

      this.activeBackgroundKey = key;
      this.activeHdrQuality = this.hdrQuality;
      this.hdrBackgroundTexture = hdrTexture;
      this.hdrEnvironmentTexture = environmentTarget.texture;
      this.syncSceneEnvironment();
      this.applySceneBackground(this.getEditMode());
      this.storeHdrBackgroundKey(key);
      return true;
    } catch {
      return false;
    } finally {
      this.hdrBackgroundLoadingKey = null;
      this.updateSwatchUI();
    }
  }
}
