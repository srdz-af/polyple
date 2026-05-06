type PaneControllerOptions = {
  breakpoint?: number;
};

export class PaneController {
  private readonly breakpoint: number;
  private collapsed = this.isMobileViewport();
  private viewportWasMobile = this.isMobileViewport();

  constructor(options: PaneControllerOptions = {}) {
    this.breakpoint = options.breakpoint ?? 680;
  }

  get isCollapsed() {
    return this.collapsed;
  }

  setCollapsed(collapsed: boolean) {
    this.collapsed = collapsed;
    document.body.classList.toggle('pane-collapsed', this.collapsed);
    const paneToggleButton = document.getElementById('pane-toggle') as HTMLButtonElement | null;
    if (paneToggleButton) {
      paneToggleButton.setAttribute('aria-expanded', String(!this.collapsed));
      paneToggleButton.setAttribute('aria-label', this.collapsed ? 'Show panel details' : 'Hide panel details');
      paneToggleButton.title = this.collapsed ? 'Show panel details' : 'Hide panel details';
    }
  }

  syncToViewport(force = false) {
    const isMobile = this.isMobileViewport();
    if (!force && isMobile === this.viewportWasMobile) return;
    this.viewportWasMobile = isMobile;
    this.setCollapsed(isMobile);
  }

  private isMobileViewport() {
    return window.innerWidth <= this.breakpoint;
  }
}
