import * as THREE from 'three';
import type { ViewMode } from '../constants';

export type AnimationKeyframeState = {
  dimension: number;
  rotMatrix: Float32Array;
  axesOrder: number[];
  axesOffset: number;
  renderMode: ViewMode;
  bloomIntensity: number;
  motionBlurIntensity: number;
  cameraPosition: THREE.Vector3;
  cameraTarget: THREE.Vector3;
  cameraUp: THREE.Vector3;
  cameraFov: number;
  cameraZoom: number;
};

export type AnimationSettings = {
  fps: number;
  frameCount: number;
  fullResolution: boolean;
};

type Keyframe = {
  frame: number;
  state: AnimationKeyframeState;
};

type KeyframeTimelineControllerOptions = {
  captureState: () => AnimationKeyframeState;
  applyState: (state: AnimationKeyframeState) => void;
  interpolateState: (from: AnimationKeyframeState, to: AnimationKeyframeState, t: number) => AnimationKeyframeState;
  onSettingsChange?: (settings: AnimationSettings) => void;
};

const DEFAULT_FPS = 60;
const DEFAULT_FRAME_COUNT = 180;
const DEFAULT_FULL_RESOLUTION = true;
const MIN_FPS = 1;
const MAX_FPS = 120;
const MIN_FRAME_COUNT = 1;
const MAX_FRAME_COUNT = 12000;

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function readPositiveInteger(input: HTMLInputElement | null, fallback: number, min: number, max: number) {
  if (!input) return fallback;
  const parsed = Number.parseInt(input.value, 10);
  return clamp(Number.isFinite(parsed) ? parsed : fallback, min, max);
}

export class KeyframeTimelineController {
  private readonly playButton = document.getElementById('animation-play-button') as HTMLButtonElement | null;
  private readonly menuToggleButton = document.getElementById('render-menu-toggle') as HTMLButtonElement | null;
  private readonly menuEl = document.getElementById('render-menu') as HTMLDivElement | null;
  private readonly fpsInput = document.getElementById('recording-fps') as HTMLInputElement | null;
  private readonly frameCountInput = document.getElementById('animation-frame-count') as HTMLInputElement | null;
  private readonly fullResolutionToggleButton = document.getElementById('full-resolution-capture-toggle') as HTMLButtonElement | null;
  private readonly addKeyframeButton = document.getElementById('add-keyframe-button') as HTMLButtonElement | null;
  private readonly removeKeyframeButton = document.getElementById('remove-keyframe-button') as HTMLButtonElement | null;
  private readonly keyframeMenuEl = document.getElementById('animation-keyframe-menu') as HTMLDivElement | null;
  private readonly timelineEl = document.getElementById('animation-timeline') as HTMLDivElement | null;
  private readonly timelineContentEl = document.getElementById('animation-timeline-content') as HTMLDivElement | null;
  private readonly timelineProgressEl = document.getElementById('animation-timeline-progress') as HTMLDivElement | null;
  private readonly timelineMarkersEl = document.getElementById('animation-keyframe-markers') as HTMLDivElement | null;
  private readonly playheadEl = document.getElementById('animation-playhead') as HTMLDivElement | null;
  private readonly frameOutput = document.getElementById('animation-current-frame') as HTMLOutputElement | null;

  private readonly keyframes = new Map<number, AnimationKeyframeState>();
  private settings: AnimationSettings = {
    fps: DEFAULT_FPS,
    frameCount: DEFAULT_FRAME_COUNT,
    fullResolution: DEFAULT_FULL_RESOLUTION,
  };
  private currentFrame = 0;
  private playing = false;
  private playheadDragPointerId = -1;

  constructor(private readonly options: KeyframeTimelineControllerOptions) {}

  bind() {
    if (this.fpsInput) this.fpsInput.value = String(this.settings.fps);
    if (this.frameCountInput) this.frameCountInput.value = String(this.settings.frameCount);

    this.playButton?.addEventListener('click', () => this.togglePlayback());
    this.menuToggleButton?.addEventListener('click', ev => {
      ev.stopPropagation();
      this.toggleMenu();
    });
    this.menuEl?.addEventListener('click', ev => ev.stopPropagation());
    this.keyframeMenuEl?.addEventListener('click', ev => ev.stopPropagation());
    document.addEventListener('click', () => {
      this.closeMenu();
      this.closeKeyframeMenu();
    });

    this.fpsInput?.addEventListener('input', () => this.syncSettingsFromInputs());
    this.frameCountInput?.addEventListener('input', () => this.syncSettingsFromInputs());
    this.fullResolutionToggleButton?.addEventListener('click', () => this.toggleFullResolutionCapture());
    this.addKeyframeButton?.addEventListener('click', () => {
      this.addKeyframeAtCurrentFrame();
      this.closeKeyframeMenu();
    });
    this.removeKeyframeButton?.addEventListener('click', () => {
      this.removeKeyframeAtCurrentFrame();
      this.closeKeyframeMenu();
    });
    this.timelineEl?.addEventListener('pointerdown', ev => this.scrubToPointer(ev));
    this.timelineEl?.addEventListener('contextmenu', ev => this.openKeyframeMenu(ev));
    this.playheadEl?.addEventListener('pointerdown', ev => this.startPlayheadDrag(ev));

    this.syncFullResolutionButton();
    this.syncSettingsFromInputs();
    this.render();
  }

  update(dt: number) {
    if (!this.playing) return;
    const frameCount = Math.max(1, this.settings.frameCount);
    const nextFrame = (this.currentFrame + (dt * this.settings.fps)) % frameCount;
    this.setCurrentFrame(nextFrame, true);
  }

  getSettings(): AnimationSettings {
    return { ...this.settings };
  }

  isPlaying() {
    return this.playing;
  }

  hasKeyframes() {
    return this.keyframes.size > 0;
  }

  addKeyframeAtCurrentFrame() {
    const frame = this.roundedCurrentFrame();
    this.keyframes.set(frame, this.options.captureState());
    this.render();
  }

  removeLastKeyframe() {
    const frame = this.lastKeyframeAtOrBeforeCurrentFrame();
    if (frame == null) return;
    this.keyframes.delete(frame);
    this.render();
  }

  playFromStart() {
    this.setCurrentFrame(0, true);
    this.setPlaying(true);
  }

  seekToFrame(frame: number, applyState = true) {
    this.setCurrentFrame(frame, applyState);
  }

  pause() {
    this.setPlaying(false);
  }

  togglePlayback() {
    if (this.playing) {
      this.setPlaying(false);
      return;
    }
    if (this.currentFrame >= this.settings.frameCount - 1) this.setCurrentFrame(0, true);
    this.setPlaying(true);
  }

  private setPlaying(active: boolean) {
    this.playing = active;
    this.playButton?.classList.toggle('active', active);
    this.playButton?.setAttribute('aria-pressed', String(active));
    const label = active ? 'Pause animation' : 'Play animation';
    if (this.playButton) {
      this.playButton.title = label;
      this.playButton.setAttribute('aria-label', label);
    }
    const icon = this.playButton?.querySelector('.material-symbols-rounded');
    if (icon) icon.textContent = active ? 'pause' : 'play_arrow';
  }

  private toggleMenu() {
    const open = !this.menuEl?.classList.contains('open');
    this.setMenuOpen(open);
  }

  private closeMenu() {
    this.setMenuOpen(false);
  }

  private setMenuOpen(open: boolean) {
    this.menuEl?.classList.toggle('open', open);
    this.menuToggleButton?.classList.toggle('active', open);
    this.menuToggleButton?.setAttribute('aria-expanded', String(open));
  }

  private openKeyframeMenu(ev: MouseEvent) {
    if (!this.keyframeMenuEl) return;
    ev.preventDefault();
    ev.stopPropagation();
    this.scrubToPointer(ev as unknown as PointerEvent);
    const width = 140;
    const x = clamp(ev.clientX, 8, Math.max(8, window.innerWidth - width - 8));
    const y = clamp(ev.clientY, 8, Math.max(8, window.innerHeight - 74));
    this.keyframeMenuEl.style.left = `${x}px`;
    this.keyframeMenuEl.style.top = `${y}px`;
    this.keyframeMenuEl.classList.add('open');
    this.render();
  }

  private closeKeyframeMenu() {
    this.keyframeMenuEl?.classList.remove('open');
  }

  private syncSettingsFromInputs() {
    const fps = readPositiveInteger(this.fpsInput, this.settings.fps, MIN_FPS, MAX_FPS);
    const frameCount = readPositiveInteger(
      this.frameCountInput,
      this.settings.frameCount,
      MIN_FRAME_COUNT,
      MAX_FRAME_COUNT,
    );

    this.settings = {
      fps,
      frameCount,
      fullResolution: this.settings.fullResolution,
    };
    if (this.fpsInput) this.fpsInput.value = String(fps);
    if (this.frameCountInput) this.frameCountInput.value = String(frameCount);

    const maxFrame = Math.max(0, frameCount - 1);
    for (const frame of Array.from(this.keyframes.keys())) {
      if (frame > maxFrame) this.keyframes.delete(frame);
    }
    if (this.currentFrame > maxFrame) this.currentFrame = maxFrame;

    this.options.onSettingsChange?.(this.getSettings());
    this.render();
  }

  private toggleFullResolutionCapture() {
    this.settings.fullResolution = !this.settings.fullResolution;
    this.syncFullResolutionButton();
    this.options.onSettingsChange?.(this.getSettings());
  }

  private syncFullResolutionButton() {
    if (!this.fullResolutionToggleButton) return;
    this.fullResolutionToggleButton.classList.toggle('active', this.settings.fullResolution);
    this.fullResolutionToggleButton.setAttribute('aria-pressed', String(this.settings.fullResolution));
    const state = this.settings.fullResolution ? 'on' : 'off';
    const label = `Full-resolution capture ${state}`;
    this.fullResolutionToggleButton.title = label;
    this.fullResolutionToggleButton.setAttribute('aria-label', label);
  }

  private removeKeyframeAtCurrentFrame() {
    this.removeLastKeyframe();
  }

  private scrubToPointer(ev: PointerEvent) {
    if (this.playheadDragPointerId >= 0) return;
    if (!this.timelineContentEl) return;
    ev.preventDefault();
    const rect = this.timelineContentEl.getBoundingClientRect();
    const ratio = rect.width > 0 ? clamp((ev.clientX - rect.left) / rect.width, 0, 1) : 0;
    this.setCurrentFrame(ratio * Math.max(0, this.settings.frameCount - 1), true);
  }

  private startPlayheadDrag(ev: PointerEvent) {
    if (!this.playheadEl) return;
    ev.preventDefault();
    ev.stopPropagation();
    this.playheadDragPointerId = ev.pointerId;
    this.playheadEl.setPointerCapture(ev.pointerId);
    this.playheadEl.addEventListener('pointermove', this.handlePlayheadDrag);
    this.playheadEl.addEventListener('pointerup', this.endPlayheadDrag);
    this.playheadEl.addEventListener('pointercancel', this.endPlayheadDrag);
  }

  private readonly handlePlayheadDrag = (ev: PointerEvent) => {
    if (ev.pointerId !== this.playheadDragPointerId || !this.timelineContentEl) return;
    ev.preventDefault();
    const rect = this.timelineContentEl.getBoundingClientRect();
    const ratio = rect.width > 0 ? clamp((ev.clientX - rect.left) / rect.width, 0, 1) : 0;
    this.setCurrentFrame(ratio * Math.max(0, this.settings.frameCount - 1), true);
  };

  private readonly endPlayheadDrag = (ev: PointerEvent) => {
    if (ev.pointerId !== this.playheadDragPointerId || !this.playheadEl) return;
    if (this.playheadEl.hasPointerCapture(ev.pointerId)) this.playheadEl.releasePointerCapture(ev.pointerId);
    this.playheadEl.removeEventListener('pointermove', this.handlePlayheadDrag);
    this.playheadEl.removeEventListener('pointerup', this.endPlayheadDrag);
    this.playheadEl.removeEventListener('pointercancel', this.endPlayheadDrag);
    this.playheadDragPointerId = -1;
  };

  private setCurrentFrame(frame: number, applyState: boolean) {
    this.currentFrame = clamp(frame, 0, Math.max(0, this.settings.frameCount - 1));
    if (applyState) {
      const state = this.stateAtFrame(this.currentFrame);
      if (state) this.options.applyState(state);
    }
    this.render();
  }

  private stateAtFrame(frame: number) {
    const frames = this.sortedFrames();
    if (frames.length === 0) return null;
    if (frames.length === 1 || frame <= frames[0]) return this.keyframes.get(frames[0]) ?? null;
    const last = frames[frames.length - 1];
    if (frame >= last) return this.keyframes.get(last) ?? null;

    for (let i = 0; i < frames.length - 1; i++) {
      const leftFrame = frames[i];
      const rightFrame = frames[i + 1];
      if (frame < leftFrame || frame > rightFrame) continue;
      const left = this.keyframes.get(leftFrame);
      const right = this.keyframes.get(rightFrame);
      if (!left || !right) return left ?? right ?? null;
      const t = rightFrame === leftFrame ? 0 : (frame - leftFrame) / (rightFrame - leftFrame);
      return this.options.interpolateState(left, right, t);
    }

    return null;
  }

  private sortedFrames() {
    return Array.from(this.keyframes.keys()).sort((a, b) => a - b);
  }

  private lastKeyframeAtOrBeforeCurrentFrame() {
    const current = this.roundedCurrentFrame();
    let last: number | null = null;
    for (const frame of this.sortedFrames()) {
      if (frame > current) break;
      last = frame;
    }
    return last;
  }

  private roundedCurrentFrame() {
    return Math.round(this.currentFrame);
  }

  private frameRatio(frame: number) {
    const maxFrame = Math.max(1, this.settings.frameCount - 1);
    return clamp(frame / maxFrame, 0, 1);
  }

  private render() {
    if (this.timelineContentEl) this.timelineContentEl.style.width = '100%';

    const currentRatio = this.frameRatio(this.currentFrame);
    if (this.timelineProgressEl) this.timelineProgressEl.style.width = `${currentRatio * 100}%`;
    if (this.playheadEl) this.playheadEl.style.left = `${currentRatio * 100}%`;
    if (this.frameOutput) {
      const frame = this.roundedCurrentFrame();
      this.frameOutput.textContent = `${frame}/${Math.max(0, this.settings.frameCount - 1)}`;
    }

    if (this.removeKeyframeButton) {
      this.removeKeyframeButton.disabled = this.lastKeyframeAtOrBeforeCurrentFrame() == null;
    }
    this.renderMarkers();
  }

  private renderMarkers() {
    if (!this.timelineMarkersEl) return;
    this.timelineMarkersEl.replaceChildren();
    for (const frame of this.sortedFrames()) {
      const marker = document.createElement('button');
      marker.type = 'button';
      marker.className = 'animation-keyframe-marker';
      marker.style.left = `${this.frameRatio(frame) * 100}%`;
      marker.title = `Keyframe ${frame}`;
      marker.setAttribute('aria-label', `Jump to keyframe ${frame}`);
      marker.classList.toggle('active', frame === this.roundedCurrentFrame());
      marker.addEventListener('click', ev => {
        ev.stopPropagation();
        this.setCurrentFrame(frame, true);
      });
      this.timelineMarkersEl.appendChild(marker);
    }
  }
}
