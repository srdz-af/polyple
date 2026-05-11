import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { SMAAPass } from 'three/examples/jsm/postprocessing/SMAAPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { normalizeAntialiasMode, type AntialiasMode } from '../animation/KeyframeTimelineController';
import { CachedGrainPass, SmoothAfterimagePass } from './postProcessingPasses';

export type RenderEffectsParams = {
  bloomIntensity: number;
  motionBlurIntensity: number;
  colorHue: number;
  colorSaturation: number;
  colorBrightness: number;
  colorContrast: number;
  grainIntensity: number;
  antialiasMode: AntialiasMode;
};

type RenderEffectsElements = {
  bloomIntensityInput: HTMLInputElement | null;
  bloomIntensityValue: HTMLOutputElement | null;
  motionBlurIntensityInput: HTMLInputElement | null;
  motionBlurIntensityValue: HTMLOutputElement | null;
  colorHueInput: HTMLInputElement | null;
  colorHueValue: HTMLOutputElement | null;
  colorSaturationInput: HTMLInputElement | null;
  colorSaturationValue: HTMLOutputElement | null;
  colorBrightnessInput: HTMLInputElement | null;
  colorBrightnessValue: HTMLOutputElement | null;
  colorContrastInput: HTMLInputElement | null;
  colorContrastValue: HTMLOutputElement | null;
  renderAntialiasSelect: HTMLSelectElement | null;
  renderAntialiasValue: HTMLOutputElement | null;
  grainIntensityInput: HTMLInputElement | null;
  grainIntensityValue: HTMLOutputElement | null;
};

type RenderEffectsPasses = {
  bloomPass: UnrealBloomPass;
  afterimagePass: SmoothAfterimagePass;
  colorGradePass: ShaderPass;
  smaaPass: SMAAPass;
  grainPass: CachedGrainPass;
};

export function clamp01(value: number) {
  return Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
}

export function clampSigned01(value: number) {
  return Math.max(-1, Math.min(1, Number.isFinite(value) ? value : 0));
}

function motionBlurBlendFromIntensity(intensity: number) {
  if (intensity <= 0) return 0;
  return 0.54 + (clamp01(intensity) * 0.4);
}

export class RenderEffectsController {
  private bound = false;

  constructor(
    private readonly params: RenderEffectsParams,
    private readonly passes: RenderEffectsPasses,
    private readonly elements: RenderEffectsElements,
    private readonly onChange: () => void,
  ) {}

  sync() {
    const { params, passes, elements } = this;
    params.bloomIntensity = clamp01(params.bloomIntensity);
    params.motionBlurIntensity = clamp01(params.motionBlurIntensity);
    params.colorHue = clampSigned01(params.colorHue);
    params.colorSaturation = clampSigned01(params.colorSaturation);
    params.colorBrightness = clampSigned01(params.colorBrightness);
    params.colorContrast = clampSigned01(params.colorContrast);
    params.grainIntensity = clamp01(params.grainIntensity);
    params.antialiasMode = normalizeAntialiasMode(params.antialiasMode);

    passes.bloomPass.enabled = params.bloomIntensity > 0.001;
    passes.bloomPass.strength = params.bloomIntensity * 1.6;
    passes.bloomPass.radius = 0.46 + (params.bloomIntensity * 0.28);
    passes.bloomPass.threshold = 0.22;

    passes.afterimagePass.enabled = params.motionBlurIntensity > 0.001;
    passes.afterimagePass.uniforms.blend.value = motionBlurBlendFromIntensity(params.motionBlurIntensity);
    if (!passes.afterimagePass.enabled) passes.afterimagePass.reset();

    passes.colorGradePass.enabled = Math.abs(params.colorHue) > 0.001
      || Math.abs(params.colorSaturation) > 0.001
      || Math.abs(params.colorBrightness) > 0.001
      || Math.abs(params.colorContrast) > 0.001;
    passes.colorGradePass.uniforms.hue.value = params.colorHue;
    passes.colorGradePass.uniforms.saturation.value = params.colorSaturation;
    passes.colorGradePass.uniforms.brightness.value = params.colorBrightness;
    passes.colorGradePass.uniforms.contrast.value = params.colorContrast;

    passes.smaaPass.enabled = params.antialiasMode === 'smaa';

    passes.grainPass.enabled = params.grainIntensity > 0.001;
    passes.grainPass.setIntensity(params.grainIntensity);

    if (elements.bloomIntensityInput) elements.bloomIntensityInput.value = params.bloomIntensity.toFixed(2);
    if (elements.bloomIntensityValue) elements.bloomIntensityValue.textContent = params.bloomIntensity.toFixed(2);
    if (elements.motionBlurIntensityInput) elements.motionBlurIntensityInput.value = params.motionBlurIntensity.toFixed(2);
    if (elements.motionBlurIntensityValue) elements.motionBlurIntensityValue.textContent = params.motionBlurIntensity.toFixed(2);
    if (elements.colorHueInput) elements.colorHueInput.value = params.colorHue.toFixed(2);
    if (elements.colorHueValue) elements.colorHueValue.textContent = params.colorHue.toFixed(2);
    if (elements.colorSaturationInput) elements.colorSaturationInput.value = params.colorSaturation.toFixed(2);
    if (elements.colorSaturationValue) elements.colorSaturationValue.textContent = params.colorSaturation.toFixed(2);
    if (elements.colorBrightnessInput) elements.colorBrightnessInput.value = params.colorBrightness.toFixed(2);
    if (elements.colorBrightnessValue) elements.colorBrightnessValue.textContent = params.colorBrightness.toFixed(2);
    if (elements.colorContrastInput) elements.colorContrastInput.value = params.colorContrast.toFixed(2);
    if (elements.colorContrastValue) elements.colorContrastValue.textContent = params.colorContrast.toFixed(2);
    if (elements.renderAntialiasSelect) elements.renderAntialiasSelect.value = params.antialiasMode;
    if (elements.renderAntialiasValue) elements.renderAntialiasValue.textContent = params.antialiasMode === 'smaa' ? 'SMAA' : 'Native';
    if (elements.grainIntensityInput) elements.grainIntensityInput.value = params.grainIntensity.toFixed(2);
    if (elements.grainIntensityValue) elements.grainIntensityValue.textContent = params.grainIntensity.toFixed(2);
  }

  hasEffects() {
    const { passes } = this;
    return passes.bloomPass.enabled
      || passes.afterimagePass.enabled
      || passes.colorGradePass.enabled
      || passes.smaaPass.enabled
      || passes.grainPass.enabled;
  }

  bind() {
    if (this.bound) return;
    this.bound = true;
    const bindRange = (input: HTMLInputElement | null, apply: (value: number) => void) => {
      input?.addEventListener('input', () => {
        const value = Number.parseFloat(input.value);
        apply(Number.isFinite(value) ? value : 0);
        this.sync();
        this.onChange();
      });
    };

    bindRange(this.elements.bloomIntensityInput, value => {
      this.params.bloomIntensity = clamp01(value);
    });
    bindRange(this.elements.motionBlurIntensityInput, value => {
      this.params.motionBlurIntensity = clamp01(value);
    });
    bindRange(this.elements.colorHueInput, value => {
      this.params.colorHue = clampSigned01(value);
    });
    bindRange(this.elements.colorSaturationInput, value => {
      this.params.colorSaturation = clampSigned01(value);
    });
    bindRange(this.elements.colorBrightnessInput, value => {
      this.params.colorBrightness = clampSigned01(value);
    });
    bindRange(this.elements.colorContrastInput, value => {
      this.params.colorContrast = clampSigned01(value);
    });
    bindRange(this.elements.grainIntensityInput, value => {
      this.params.grainIntensity = clamp01(value);
    });

    this.elements.renderAntialiasSelect?.addEventListener('change', () => {
      this.params.antialiasMode = normalizeAntialiasMode(this.elements.renderAntialiasSelect?.value);
      this.sync();
      this.onChange();
    });

    this.sync();
  }
}
