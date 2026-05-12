export class PerformanceOverlayController {
  private visible = false;
  private sampleStart = performance.now();
  private readonly stats = {
    frames: 0,
    cpuMs: 0,
    projectionMs: 0,
    projectionFrames: 0,
    renderMs: 0,
  };
  private readonly overlay: HTMLDivElement;

  constructor() {
    this.overlay = document.createElement('div');
    this.overlay.id = 'perf-overlay';
    this.overlay.setAttribute('aria-hidden', 'true');
    Object.assign(this.overlay.style, {
      position: 'fixed',
      right: 'calc(10px + var(--safe-right))',
      top: 'calc(10px + var(--safe-top))',
      zIndex: '80',
      display: 'none',
      minWidth: '128px',
      boxSizing: 'border-box',
      padding: '7px 8px',
      border: '1px solid rgba(207, 241, 240, 0.2)',
      borderRadius: '7px',
      background: 'rgba(25, 23, 15, 0.78)',
      color: 'rgba(207, 241, 240, 0.94)',
      font: '700 10px/1.36 SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace',
      letterSpacing: '0.01em',
      pointerEvents: 'none',
      whiteSpace: 'pre',
      boxShadow: '0 10px 26px rgba(25, 23, 15, 0.36)',
      backdropFilter: 'blur(10px) saturate(1.08)',
      WebkitBackdropFilter: 'blur(10px) saturate(1.08)',
    });
    document.body.appendChild(this.overlay);
  }

  toggle() {
    this.visible = !this.visible;
    this.overlay.style.display = this.visible ? 'block' : 'none';
    this.overlay.setAttribute('aria-hidden', String(!this.visible));
    this.reset();
    if (this.visible) this.overlay.textContent = 'FPS --\nFrame --ms\nCPU --ms\nProj --\nRender --ms';
  }

  recordFrame(frameStart: number, projectionMs: number, renderMs: number) {
    if (!this.visible) return;

    const now = performance.now();
    const cpuMs = Math.max(0, now - frameStart);

    this.stats.frames += 1;
    this.stats.cpuMs += cpuMs;
    this.stats.renderMs += renderMs;
    if (projectionMs > 0) {
      this.stats.projectionMs += projectionMs;
      this.stats.projectionFrames += 1;
    }

    const elapsed = now - this.sampleStart;
    if (elapsed < 500 || this.stats.frames === 0) return;

    const fps = (this.stats.frames * 1000) / elapsed;
    const avgFrameMs = elapsed / this.stats.frames;
    const avgCpuMs = this.stats.cpuMs / this.stats.frames;
    const avgRenderMs = this.stats.renderMs / this.stats.frames;
    const avgProjectionMs = this.stats.projectionFrames > 0
      ? `${(this.stats.projectionMs / this.stats.projectionFrames).toFixed(1)}ms`
      : 'idle';

    this.overlay.textContent = [
      `FPS ${fps.toFixed(0)}`,
      `Frame ${avgFrameMs.toFixed(1)}ms`,
      `CPU ${avgCpuMs.toFixed(1)}ms`,
      `Proj ${avgProjectionMs}`,
      `Render ${avgRenderMs.toFixed(1)}ms`,
    ].join('\n');
    this.reset(now);
  }

  private reset(now = performance.now()) {
    this.sampleStart = now;
    this.stats.frames = 0;
    this.stats.cpuMs = 0;
    this.stats.projectionMs = 0;
    this.stats.projectionFrames = 0;
    this.stats.renderMs = 0;
  }
}
