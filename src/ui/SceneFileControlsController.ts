type SceneFileControlsOptions = {
  undo: () => void;
  redo: () => void;
  saveScene: (button: HTMLButtonElement | null) => void | Promise<void>;
  loadSceneFile: (file: File | null | undefined) => unknown | Promise<unknown>;
  hideWelcome: () => void;
};

export class SceneFileControlsController {
  private readonly undoButton = document.getElementById('scene-undo-button') as HTMLButtonElement | null;
  private readonly redoButton = document.getElementById('scene-redo-button') as HTMLButtonElement | null;
  private readonly saveButton = document.getElementById('scene-save-button') as HTMLButtonElement | null;
  private readonly loadButton = document.getElementById('scene-load-button') as HTMLButtonElement | null;
  private readonly loadInput = document.getElementById('scene-load-input') as HTMLInputElement | null;
  private readonly welcomeSplash = document.getElementById('welcome-splash') as HTMLDivElement | null;
  private readonly welcomeLoadButton = document.getElementById('welcome-load-scene-button') as HTMLButtonElement | null;
  private readonly welcomeCloseButton = document.getElementById('welcome-close-button') as HTMLButtonElement | null;
  private bound = false;

  constructor(private readonly options: SceneFileControlsOptions) {}

  bind() {
    if (this.bound) return;
    this.bound = true;
    this.undoButton?.addEventListener('click', this.options.undo);
    this.redoButton?.addEventListener('click', this.options.redo);
    this.saveButton?.addEventListener('click', () => void this.options.saveScene(this.saveButton));
    this.loadButton?.addEventListener('click', () => this.loadInput?.click());
    this.welcomeLoadButton?.addEventListener('click', () => this.loadInput?.click());
    this.welcomeCloseButton?.addEventListener('click', this.options.hideWelcome);
    this.welcomeSplash?.addEventListener('click', ev => {
      if (ev.target === this.welcomeSplash) this.options.hideWelcome();
    });
    this.loadInput?.addEventListener('change', () => {
      void Promise.resolve(this.options.loadSceneFile(this.loadInput?.files?.[0])).finally(() => {
        if (this.loadInput) this.loadInput.value = '';
      });
    });
  }
}
