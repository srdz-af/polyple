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
  renderQuality: RenderQuality;
  cameraWidth: number;
  cameraHeight: number;
};

export type RenderQuality = 'full' | 'high' | 'medium' | 'low';

type Keyframe = {
  frame: number;
  state: AnimationKeyframeState;
};

export type AnimationTimelineState = {
  settings: AnimationSettings;
  currentFrame: number;
  playing: boolean;
  cameraDimensionsFollowViewport: boolean;
  keyframes: Keyframe[];
};

type KeyframeTimelineControllerOptions = {
  captureState: () => AnimationKeyframeState;
  applyState: (state: AnimationKeyframeState) => void;
  interpolateState: (from: AnimationKeyframeState, to: AnimationKeyframeState, t: number) => AnimationKeyframeState;
  onSettingsChange?: (settings: AnimationSettings) => void;
  onBeforeKeyframeChange?: () => void;
  onStateChange?: () => void;
};

const DEFAULT_FPS = 60;
const DEFAULT_FRAME_COUNT = 180;
const DEFAULT_RENDER_QUALITY: RenderQuality = 'full';
const RENDER_QUALITIES: RenderQuality[] = ['full', 'high', 'medium', 'low'];
const MIN_FPS = 1;
const MAX_FPS = 120;
const MIN_FRAME_COUNT = 1;
const MAX_FRAME_COUNT = 12000;
const MIN_CAMERA_DIMENSION = 16;
const MAX_CAMERA_DIMENSION = 16384;

function viewportDimension(value: number, fallback: number) {
  const rounded = Math.round(Number.isFinite(value) ? value : fallback);
  return clamp(rounded, MIN_CAMERA_DIMENSION, MAX_CAMERA_DIMENSION);
}

function viewportDimensions() {
  return {
    width: viewportDimension(window.innerWidth, 1280),
    height: viewportDimension(window.innerHeight, 720),
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function readPositiveInteger(input: HTMLInputElement | null, fallback: number, min: number, max: number) {
  if (!input) return fallback;
  const parsed = Number.parseInt(input.value, 10);
  return clamp(Number.isFinite(parsed) ? parsed : fallback, min, max);
}

function finiteNumber(value: unknown, fallback: number) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

export function normalizeRenderQuality(value: unknown): RenderQuality {
  return RENDER_QUALITIES.includes(value as RenderQuality) ? value as RenderQuality : DEFAULT_RENDER_QUALITY;
}

function cloneKeyframeState(state: AnimationKeyframeState): AnimationKeyframeState {
  return {
    dimension: state.dimension,
    rotMatrix: new Float32Array(state.rotMatrix),
    axesOrder: [...state.axesOrder],
    axesOffset: state.axesOffset,
    renderMode: state.renderMode,
    bloomIntensity: state.bloomIntensity,
    motionBlurIntensity: state.motionBlurIntensity,
    cameraPosition: state.cameraPosition.clone(),
    cameraTarget: state.cameraTarget.clone(),
    cameraUp: state.cameraUp.clone(),
    cameraFov: state.cameraFov,
    cameraZoom: state.cameraZoom,
  };
}

export class KeyframeTimelineController {
  private readonly playButton = document.getElementById('animation-play-button') as HTMLButtonElement | null;
  private readonly prevFrameButton = document.getElementById('animation-prev-frame-button') as HTMLButtonElement | null;
  private readonly nextFrameButton = document.getElementById('animation-next-frame-button') as HTMLButtonElement | null;
  private readonly fpsInput = document.getElementById('recording-fps') as HTMLInputElement | null;
  private readonly frameCountInput = document.getElementById('animation-frame-count') as HTMLInputElement | null;
  private readonly cameraWidthInput = document.getElementById('camera-width') as HTMLInputElement | null;
  private readonly cameraHeightInput = document.getElementById('camera-height') as HTMLInputElement | null;
  private readonly renderQualitySelect = document.getElementById('render-quality') as HTMLSelectElement | null;
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
  private cameraDimensionsFollowViewport = true;
  private settings: AnimationSettings = {
    fps: DEFAULT_FPS,
    frameCount: DEFAULT_FRAME_COUNT,
    renderQuality: DEFAULT_RENDER_QUALITY,
    cameraWidth: viewportDimensions().width,
    cameraHeight: viewportDimensions().height,
  };
  private currentFrame = 0;
  private playing = false;
  private playheadDragPointerId = -1;

  constructor(private readonly options: KeyframeTimelineControllerOptions) {}

  bind() {
    if (this.fpsInput) this.fpsInput.value = String(this.settings.fps);
    if (this.frameCountInput) this.frameCountInput.value = String(this.settings.frameCount);
    if (this.cameraWidthInput) this.cameraWidthInput.value = String(this.settings.cameraWidth);
    if (this.cameraHeightInput) this.cameraHeightInput.value = String(this.settings.cameraHeight);

    this.playButton?.addEventListener('click', () => this.togglePlayback());
    this.prevFrameButton?.addEventListener('click', () => this.stepFrame(-1));
    this.nextFrameButton?.addEventListener('click', () => this.stepFrame(1));
    [this.playButton, this.prevFrameButton, this.nextFrameButton].forEach(button => {
      button?.addEventListener('pointerdown', ev => ev.stopPropagation());
      button?.addEventListener('click', ev => ev.stopPropagation());
    });
    this.keyframeMenuEl?.addEventListener('click', ev => ev.stopPropagation());
    document.addEventListener('click', () => {
      this.closeKeyframeMenu();
    });

    this.fpsInput?.addEventListener('change', () => this.syncSettingsFromInputs());
    this.frameCountInput?.addEventListener('change', () => this.syncSettingsFromInputs());
    this.cameraWidthInput?.addEventListener('change', () => this.handleCameraDimensionsInput());
    this.cameraHeightInput?.addEventListener('change', () => this.handleCameraDimensionsInput());
    this.renderQualitySelect?.addEventListener('change', () => this.handleRenderQualityChange());
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
    window.addEventListener('resize', this.handleWindowResize);

    this.syncRenderQualitySelect();
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

  getTimelineState(): AnimationTimelineState {
    return {
      settings: this.getSettings(),
      currentFrame: this.currentFrame,
      playing: this.playing,
      cameraDimensionsFollowViewport: this.cameraDimensionsFollowViewport,
      keyframes: this.sortedFrames().map(frame => ({
        frame,
        state: cloneKeyframeState(this.keyframes.get(frame)!),
      })),
    };
  }

  applyTimelineState(state: Partial<AnimationTimelineState> | null | undefined, applyCurrentFrameState = false) {
    if (!state) return;
    const fallbackViewport = viewportDimensions();
    const settings = state.settings ?? this.settings;
    this.cameraDimensionsFollowViewport = typeof state.cameraDimensionsFollowViewport === 'boolean'
      ? state.cameraDimensionsFollowViewport
      : this.cameraDimensionsFollowViewport;
    this.settings = {
      fps: clamp(Math.round(finiteNumber(settings.fps, this.settings.fps)), MIN_FPS, MAX_FPS),
      frameCount: clamp(Math.round(finiteNumber(settings.frameCount, this.settings.frameCount)), MIN_FRAME_COUNT, MAX_FRAME_COUNT),
      renderQuality: normalizeRenderQuality(settings.renderQuality),
      cameraWidth: viewportDimension(settings.cameraWidth, fallbackViewport.width),
      cameraHeight: viewportDimension(settings.cameraHeight, fallbackViewport.height),
    };

    this.keyframes.clear();
    for (const keyframe of state.keyframes ?? []) {
      const frame = clamp(Math.round(finiteNumber(keyframe.frame, 0)), 0, this.settings.frameCount - 1);
      if (keyframe.state) this.keyframes.set(frame, cloneKeyframeState(keyframe.state));
    }

    if (this.fpsInput) this.fpsInput.value = String(this.settings.fps);
    if (this.frameCountInput) this.frameCountInput.value = String(this.settings.frameCount);
    if (this.cameraWidthInput) this.cameraWidthInput.value = this.cameraDimensionsFollowViewport ? '' : String(this.settings.cameraWidth);
    if (this.cameraHeightInput) this.cameraHeightInput.value = this.cameraDimensionsFollowViewport ? '' : String(this.settings.cameraHeight);
    this.syncRenderQualitySelect();
    this.options.onSettingsChange?.(this.getSettings());
    this.setCurrentFrame(finiteNumber(state.currentFrame, 0), applyCurrentFrameState);
    this.setPlaying(Boolean(state.playing));
    this.render();
  }

  isPlaying() {
    return this.playing;
  }

  hasKeyframes() {
    return this.keyframes.size > 0;
  }

  addKeyframeAtCurrentFrame() {
    const frame = this.roundedCurrentFrame();
    this.options.onBeforeKeyframeChange?.();
    this.keyframes.set(frame, this.options.captureState());
    this.render();
    this.options.onStateChange?.();
  }

  removeLastKeyframe() {
    const frame = this.lastKeyframeAtOrBeforeCurrentFrame();
    if (frame == null) return;
    this.options.onBeforeKeyframeChange?.();
    this.keyframes.delete(frame);
    this.render();
    this.options.onStateChange?.();
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

  private stepFrame(direction: -1 | 1) {
    if (this.playing) this.setPlaying(false);
    this.setCurrentFrame(this.roundedCurrentFrame() + direction, true);
  }

  private setPlaying(active: boolean) {
    const changed = this.playing !== active;
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
    if (changed) this.options.onStateChange?.();
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
    let cameraWidth = this.settings.cameraWidth;
    let cameraHeight = this.settings.cameraHeight;
    if (this.cameraDimensionsFollowViewport) {
      const viewport = viewportDimensions();
      cameraWidth = viewport.width;
      cameraHeight = viewport.height;
    } else {
      cameraWidth = readPositiveInteger(
        this.cameraWidthInput,
        this.settings.cameraWidth,
        MIN_CAMERA_DIMENSION,
        MAX_CAMERA_DIMENSION,
      );
      cameraHeight = readPositiveInteger(
        this.cameraHeightInput,
        this.settings.cameraHeight,
        MIN_CAMERA_DIMENSION,
        MAX_CAMERA_DIMENSION,
      );
    }

    this.settings = {
      fps,
      frameCount,
      renderQuality: this.settings.renderQuality,
      cameraWidth,
      cameraHeight,
    };
    if (this.fpsInput) this.fpsInput.value = String(fps);
    if (this.frameCountInput) this.frameCountInput.value = String(frameCount);
    if (this.cameraWidthInput) this.cameraWidthInput.value = String(cameraWidth);
    if (this.cameraHeightInput) this.cameraHeightInput.value = String(cameraHeight);

    const maxFrame = Math.max(0, frameCount - 1);
    for (const frame of Array.from(this.keyframes.keys())) {
      if (frame > maxFrame) this.keyframes.delete(frame);
    }
    if (this.currentFrame > maxFrame) this.currentFrame = maxFrame;

    this.options.onSettingsChange?.(this.getSettings());
    this.render();
    this.options.onStateChange?.();
  }

  private handleCameraDimensionsInput() {
    const cameraWidthRaw = this.cameraWidthInput?.value.trim() ?? '';
    const cameraHeightRaw = this.cameraHeightInput?.value.trim() ?? '';
    this.cameraDimensionsFollowViewport = !cameraWidthRaw || !cameraHeightRaw;
    this.syncSettingsFromInputs();
  }

  private readonly handleWindowResize = () => {
    if (!this.cameraDimensionsFollowViewport) return;
    const viewport = viewportDimensions();
    if (
      viewport.width === this.settings.cameraWidth
      && viewport.height === this.settings.cameraHeight
    ) return;
    this.settings = {
      ...this.settings,
      cameraWidth: viewport.width,
      cameraHeight: viewport.height,
    };
    if (this.cameraWidthInput) this.cameraWidthInput.value = String(viewport.width);
    if (this.cameraHeightInput) this.cameraHeightInput.value = String(viewport.height);
    this.options.onSettingsChange?.(this.getSettings());
    this.options.onStateChange?.();
  };

  private handleRenderQualityChange() {
    this.settings.renderQuality = normalizeRenderQuality(this.renderQualitySelect?.value);
    this.syncRenderQualitySelect();
    this.options.onSettingsChange?.(this.getSettings());
    this.options.onStateChange?.();
  }

  private syncRenderQualitySelect() {
    if (!this.renderQualitySelect) return;
    this.renderQualitySelect.value = this.settings.renderQuality;
    const label = `Render quality: ${this.renderQualitySelect.selectedOptions[0]?.textContent ?? this.settings.renderQuality}`;
    this.renderQualitySelect.title = label;
    this.renderQualitySelect.setAttribute('aria-label', label);
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
    const previousFrame = this.currentFrame;
    this.currentFrame = clamp(frame, 0, Math.max(0, this.settings.frameCount - 1));
    if (applyState) {
      const state = this.stateAtFrame(this.currentFrame);
      if (state) this.options.applyState(state);
    }
    this.render();
    if (Math.abs(previousFrame - this.currentFrame) > 1e-6) this.options.onStateChange?.();
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
