import { colorFromInput, colorToHex, finiteNumber } from '../scene/sceneStateCodec';
import type { SceneLightKind, SceneLightState } from '../scene/types';

type SceneLightPanelRuntime = {
  state: SceneLightState;
};

type SceneLightPanelOptions = {
  getLights: () => SceneLightPanelRuntime[];
  getSelected: () => SceneLightPanelRuntime | null;
  selectLight: (id: string) => void;
  setKind: (kind: SceneLightKind) => void;
  removeSelected: () => void;
  setShadow: (enabled: boolean) => void;
  setColor: (color: number) => void;
  setIntensity: (intensity: number) => void;
  currentShadowMapSize: () => number;
  syncRuntimes: () => void;
};

export class SceneLightPanelController {
  private readonly select = document.getElementById('scene-light-select') as HTMLSelectElement | null;
  private readonly pointButton = document.getElementById('scene-light-add-point') as HTMLButtonElement | null;
  private readonly directionalButton = document.getElementById('scene-light-add-directional') as HTMLButtonElement | null;
  private readonly removeButton = document.getElementById('scene-light-remove') as HTMLButtonElement | null;
  private readonly shadowInput = document.getElementById('scene-light-shadow') as HTMLInputElement | null;
  private readonly shadowValue = document.getElementById('scene-light-shadow-value') as HTMLOutputElement | null;
  private readonly colorInput = document.getElementById('scene-light-color') as HTMLInputElement | null;
  private readonly colorValue = document.getElementById('scene-light-color-value') as HTMLOutputElement | null;
  private readonly intensityInput = document.getElementById('scene-light-intensity') as HTMLInputElement | null;
  private bound = false;

  constructor(private readonly options: SceneLightPanelOptions) {}

  sync() {
    const lights = this.options.getLights();
    const selected = this.options.getSelected();
    if (this.select) {
      this.select.replaceChildren();
      if (lights.length) {
        lights.forEach(runtime => {
          const option = document.createElement('option');
          option.value = runtime.state.id;
          option.textContent = runtime.state.label;
          this.select?.appendChild(option);
        });
        this.select.value = selected?.state.id ?? lights[0].state.id;
      } else {
        const option = document.createElement('option');
        option.value = '';
        option.textContent = 'No lights';
        this.select.appendChild(option);
      }
      this.select.disabled = lights.length === 0;
    }

    const enabled = !!selected;
    if (this.removeButton) this.removeButton.disabled = !enabled;
    if (this.pointButton) {
      this.pointButton.disabled = !enabled;
      this.pointButton.classList.toggle('active', selected?.state.kind === 'point');
      this.pointButton.setAttribute('aria-pressed', String(selected?.state.kind === 'point'));
    }
    if (this.directionalButton) {
      this.directionalButton.disabled = !enabled;
      this.directionalButton.classList.toggle('active', selected?.state.kind === 'directional');
      this.directionalButton.setAttribute('aria-pressed', String(selected?.state.kind === 'directional'));
    }
    if (this.shadowInput) {
      this.shadowInput.disabled = !enabled;
      this.shadowInput.checked = selected?.state.castShadow ?? false;
    }
    if (this.shadowValue) {
      if (!selected?.state.castShadow) this.shadowValue.textContent = 'Off';
      else this.shadowValue.textContent = this.options.currentShadowMapSize() > 0 ? 'On' : 'Quality off';
    }
    if (this.colorInput) {
      this.colorInput.disabled = !enabled;
      this.colorInput.value = colorToHex(selected?.state.color ?? 0xffffff);
    }
    if (this.colorValue) this.colorValue.textContent = colorToHex(selected?.state.color ?? 0xffffff);
    if (this.intensityInput) {
      this.intensityInput.disabled = !enabled;
      this.intensityInput.value = `${selected?.state.intensity ?? 0}`;
    }
    this.options.syncRuntimes();
  }

  bind() {
    if (this.bound) return;
    this.bound = true;

    this.select?.addEventListener('change', () => {
      this.options.selectLight(this.select?.value ?? '');
    });
    this.pointButton?.addEventListener('click', () => this.options.setKind('point'));
    this.directionalButton?.addEventListener('click', () => this.options.setKind('directional'));
    this.removeButton?.addEventListener('click', this.options.removeSelected);
    this.shadowInput?.addEventListener('change', () => {
      this.options.setShadow(!!this.shadowInput?.checked);
    });
    this.colorInput?.addEventListener('change', () => {
      const selected = this.options.getSelected();
      this.options.setColor(colorFromInput(this.colorInput?.value ?? '', selected?.state.color ?? 0xffffff));
    });
    this.intensityInput?.addEventListener('change', () => {
      const selected = this.options.getSelected();
      this.options.setIntensity(finiteNumber(Number.parseFloat(this.intensityInput?.value ?? ''), selected?.state.intensity ?? 0));
    });
    this.sync();
  }
}
