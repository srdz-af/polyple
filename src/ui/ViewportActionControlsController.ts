import type { TransformMode } from '../scene/types';

type ViewportActionControlsOptions = {
  getEditMode: () => boolean;
  setEditMode: (active: boolean) => void;
  toggleTransformMode: (mode: TransformMode) => void;
  recenterCamera: () => void;
  resetFocus: () => void;
};

export class ViewportActionControlsController {
  private readonly editModeToggle = document.getElementById('edit-mode-toggle') as HTMLButtonElement | null;
  private readonly mobileFullscreenToggle = document.getElementById('mobile-fullscreen-toggle') as HTMLButtonElement | null;
  private readonly moveButton = document.getElementById('transform-move-button') as HTMLButtonElement | null;
  private readonly rotateButton = document.getElementById('transform-rotate-button') as HTMLButtonElement | null;
  private readonly scaleButton = document.getElementById('transform-scale-button') as HTMLButtonElement | null;
  private readonly cameraRecenterButton = document.getElementById('camera-recenter-button') as HTMLButtonElement | null;
  private readonly focusResetButton = document.getElementById('focus-reset-button') as HTMLButtonElement | null;
  private bound = false;

  constructor(private readonly options: ViewportActionControlsOptions) {}

  transformButtonElements() {
    return {
      moveButton: this.moveButton,
      rotateButton: this.rotateButton,
      scaleButton: this.scaleButton,
    };
  }

  syncEditMode() {
    if (!this.editModeToggle) return;
    const active = this.options.getEditMode();
    this.editModeToggle.classList.toggle('active', active);
    this.editModeToggle.setAttribute('aria-pressed', String(active));
  }

  syncFullscreen() {
    if (!this.mobileFullscreenToggle) return;
    if (!this.fullscreenAvailable()) {
      this.mobileFullscreenToggle.hidden = true;
      return;
    }
    const active = document.fullscreenElement != null;
    const label = active ? 'Exit fullscreen' : 'Enter fullscreen';
    const icon = this.mobileFullscreenToggle.querySelector('.material-symbols-rounded');
    this.mobileFullscreenToggle.hidden = false;
    this.mobileFullscreenToggle.classList.toggle('active', active);
    this.mobileFullscreenToggle.setAttribute('aria-label', label);
    this.mobileFullscreenToggle.title = label;
    if (icon) icon.textContent = active ? 'fullscreen_exit' : 'fullscreen';
  }

  bind() {
    if (this.bound) return;
    this.bound = true;
    this.editModeToggle?.addEventListener('click', () => this.options.setEditMode(!this.options.getEditMode()));
    this.mobileFullscreenToggle?.addEventListener('click', () => void this.toggleMobileFullscreen());
    document.addEventListener('fullscreenchange', () => this.syncFullscreen());
    [
      { el: this.moveButton, mode: 'move' as TransformMode },
      { el: this.rotateButton, mode: 'rotate' as TransformMode },
      { el: this.scaleButton, mode: 'scale' as TransformMode },
    ].forEach(entry => {
      entry.el?.addEventListener('click', () => this.options.toggleTransformMode(entry.mode));
    });
    this.cameraRecenterButton?.addEventListener('click', this.options.recenterCamera);
    this.focusResetButton?.addEventListener('click', this.options.resetFocus);
    this.syncEditMode();
    this.syncFullscreen();
  }

  private fullscreenAvailable() {
    return typeof document.documentElement.requestFullscreen === 'function'
      && typeof document.exitFullscreen === 'function';
  }

  private async toggleMobileFullscreen() {
    if (!this.fullscreenAvailable()) return;
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await document.documentElement.requestFullscreen({ navigationUI: 'hide' });
      }
    } catch (err) {
      console.warn('Fullscreen toggle failed', err);
    } finally {
      this.syncFullscreen();
    }
  }
}
