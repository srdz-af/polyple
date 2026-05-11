export class SceneControlTabsController {
  private readonly buttons = Array.from(document.querySelectorAll('[data-scene-control-tab]')) as HTMLButtonElement[];
  private readonly panels = Array.from(document.querySelectorAll('[data-scene-control-panel]')) as HTMLElement[];
  private activeTab = '';
  private bound = false;

  setActive(tab: string) {
    this.activeTab = tab;
    this.buttons.forEach(button => {
      const active = button.dataset.sceneControlTab === tab;
      button.classList.toggle('active', active);
      button.setAttribute('aria-selected', String(active));
      button.tabIndex = active ? 0 : -1;
    });
    this.panels.forEach(panel => {
      panel.hidden = panel.dataset.sceneControlPanel !== tab;
    });
    window.dispatchEvent(new CustomEvent('scene-control-tab-change', { detail: { tab } }));
  }

  bind(defaultTab = 'environment') {
    if (!this.bound) {
      this.bound = true;
      this.buttons.forEach(button => {
        button.addEventListener('click', () => {
          if (button.dataset.sceneControlTab) this.setActive(button.dataset.sceneControlTab);
        });
      });
    }
    this.setActive(this.activeTab || defaultTab);
  }
}
