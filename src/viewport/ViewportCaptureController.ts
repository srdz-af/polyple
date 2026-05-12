import * as THREE from 'three';
import type { RenderQuality } from '../animation/KeyframeTimelineController';

type ViewportCaptureControllerOptions = {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.Camera;
  gridGroup: THREE.Object3D;
  axes: THREE.Object3D;
  cameraOverlayEl?: HTMLDivElement | null;
  renderButton: HTMLButtonElement | null;
  recordButton: HTMLButtonElement | null;
  captureButton: HTMLButtonElement | null;
  timerEl: HTMLSpanElement | null;
  setCaptureResolutionMode?: (quality: RenderQuality) => void;
  renderFrame?: () => void;
  renderAnimationFrame?: (frame: number) => void;
  onAnimationRenderStart?: () => void;
  onAnimationRenderStop?: () => void;
};

export function viewportCaptureElementsFromDocument() {
  return {
    cameraOverlayEl: document.getElementById('camera-view-overlay') as HTMLDivElement | null,
    renderButton: document.getElementById('render-animation-button') as HTMLButtonElement | null,
    recordButton: document.getElementById('record-viewport-button') as HTMLButtonElement | null,
    captureButton: document.getElementById('capture-frame-button') as HTMLButtonElement | null,
    timerEl: document.getElementById('record-viewport-timer') as HTMLSpanElement | null,
  } satisfies Pick<ViewportCaptureControllerOptions, 'cameraOverlayEl' | 'renderButton' | 'recordButton' | 'captureButton' | 'timerEl'>;
}

type RecordingMode = 'viewport' | 'animation';

type StartRecordingOptions = {
  mode: RecordingMode;
  filePrefix: string;
  autoStopMs: number | null;
  manualFrameCapture?: boolean;
  onStart?: () => void;
  onStop?: () => void;
};

type CaptureCropRect = {
  sx: number;
  sy: number;
  sw: number;
  sh: number;
};

const VIDEO_RECORDER_MIME_CANDIDATES = [
  'video/webm;codecs=vp9,opus',
  'video/webm;codecs=vp8,opus',
  'video/webm;codecs=h264,opus',
  'video/webm',
  'video/mp4',
] as const;
const DEFAULT_VIDEO_RECORDER_FPS = 60;
const VIDEO_RECORDER_MIN_BITRATE = 28_000_000;
const VIDEO_RECORDER_MAX_BITRATE = 140_000_000;
const MIN_CAMERA_CAPTURE_DIMENSION = 16;
const MAX_CAMERA_CAPTURE_DIMENSION = 16384;

function captureTimestamp() {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
}

function downloadBlob(name: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

function recordingFileExtensionFromMime(mimeType: string) {
  if (mimeType.includes('mp4')) return 'mp4';
  return 'webm';
}

function clampCaptureDimension(value: number, fallback: number) {
  const rounded = Math.round(Number.isFinite(value) ? value : fallback);
  return Math.max(MIN_CAMERA_CAPTURE_DIMENSION, Math.min(MAX_CAMERA_CAPTURE_DIMENSION, rounded));
}

function formatRecordingElapsed(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function pickRecorderMimeType() {
  if (typeof MediaRecorder === 'undefined') return '';
  for (const candidate of VIDEO_RECORDER_MIME_CANDIDATES) {
    try {
      if (MediaRecorder.isTypeSupported(candidate)) return candidate;
    } catch {
      // Ignore and try next.
    }
  }
  return '';
}

export class ViewportCaptureController {
  private recorder: MediaRecorder | null = null;
  private recorderStream: MediaStream | null = null;
  private recorderChunks: Blob[] = [];
  private recorderMimeType = 'video/webm';
  private gridVisibleBeforeCapture = true;
  private axesVisibleBeforeCapture = true;
  private recordingFinalized = false;
  private recordingStartedAt = 0;
  private recordingTimerIntervalId: number | null = null;
  private recordingStopTimeoutId: number | null = null;
  private finalStopTimeoutId: number | null = null;
  private animationRenderTimeoutId: number | null = null;
  private recordingFps = DEFAULT_VIDEO_RECORDER_FPS;
  private recordingFrameCount = 180;
  private renderQuality: RenderQuality = 'full';
  private cameraCaptureWidth = clampCaptureDimension(window.innerWidth, 1280);
  private cameraCaptureHeight = clampCaptureDimension(window.innerHeight, 720);
  private recordingMode: RecordingMode | null = null;
  private recordingFilePrefix = 'blend-viewport';
  private recordingStopCallback: (() => void) | null = null;
  private manualFrameCapture = false;
  private captureResolutionAdjusted = false;
  private captureCanvas: HTMLCanvasElement | null = null;
  private captureCanvasContext: CanvasRenderingContext2D | null = null;
  private captureBlitRafId: number | null = null;

  constructor(private readonly options: ViewportCaptureControllerOptions) {}

  setRecordingSettings(
    fps: number,
    frameCount: number,
    renderQuality: RenderQuality = this.renderQuality,
    cameraWidth = this.cameraCaptureWidth,
    cameraHeight = this.cameraCaptureHeight,
  ) {
    this.recordingFps = Math.max(1, Math.min(120, Math.round(Number.isFinite(fps) ? fps : DEFAULT_VIDEO_RECORDER_FPS)));
    this.recordingFrameCount = Math.max(1, Math.min(12000, Math.round(Number.isFinite(frameCount) ? frameCount : 180)));
    this.renderQuality = renderQuality;
    this.cameraCaptureWidth = clampCaptureDimension(cameraWidth, this.cameraCaptureWidth);
    this.cameraCaptureHeight = clampCaptureDimension(cameraHeight, this.cameraCaptureHeight);
    this.updateCameraViewOverlay();
  }

  bindControls() {
    this.setRecordButtonState(false);
    this.setRenderButtonState(false);
    this.updateCameraViewOverlay();
    this.options.renderButton?.addEventListener('click', () => this.renderAnimation());
    this.options.recordButton?.addEventListener('click', () => this.toggleRecording());
    this.options.captureButton?.addEventListener('click', () => this.captureFrame());
  }

  onViewportResize() {
    this.updateCameraViewOverlay();
  }

  toggleRecording() {
    if (this.isRecording()) {
      this.stopRecording();
      return;
    }
    this.startRecording({
      mode: 'viewport',
      filePrefix: 'blend-viewport',
      autoStopMs: null,
    });
  }

  renderAnimation() {
    if (this.isRecording()) {
      this.stopRecording();
      return;
    }
    if (!this.options.renderAnimationFrame) {
      alert('Animation rendering is not configured.');
      return;
    }

    const frameCount = this.recordingFrameCount;
    const frameDelayMs = 1000 / this.recordingFps;
    let frame = 0;

    const renderNextFrame = () => {
      if (!this.isRecording() || this.recordingMode !== 'animation') return;

      this.options.renderAnimationFrame?.(frame);
      this.renderCanvasFrame();
      this.drawRendererToCaptureCanvas();
      this.requestCanvasStreamFrame();

      frame += 1;
      if (frame >= frameCount) {
        this.scheduleFinalRecordingStop(frameDelayMs);
        return;
      }
      this.animationRenderTimeoutId = window.setTimeout(renderNextFrame, frameDelayMs);
    };

    this.startRecording({
      mode: 'animation',
      filePrefix: 'blend-animation',
      autoStopMs: null,
      manualFrameCapture: true,
      onStart: () => {
        this.options.onAnimationRenderStart?.();
        renderNextFrame();
      },
      onStop: () => this.options.onAnimationRenderStop?.(),
    });
  }

  captureFrame() {
    if (this.isRecording()) {
      alert('Stop the current recording before taking a screenshot.');
      return;
    }

    const { gridGroup, axes } = this.options;
    const previousGridVisibility = gridGroup.visible;
    const previousAxesVisibility = axes.visible;
    this.applyCaptureResolution();
    gridGroup.visible = false;
    axes.visible = false;
    this.renderCanvasFrame();
    try {
      if (!this.drawRendererToCaptureCanvas()) throw new Error('capture-failed');
      const dataUrl = this.captureCanvas!.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `blend-frame-${captureTimestamp()}.png`;
      a.click();
    } catch {
      alert('Unable to capture frame.');
    } finally {
      gridGroup.visible = previousGridVisibility;
      axes.visible = previousAxesVisibility;
      this.restoreCaptureResolution();
      this.renderCanvasFrame();
    }
  }

  private isRecording() {
    return !!this.recorder && this.recorder.state !== 'inactive';
  }

  private updateRecordingTimer() {
    const { timerEl } = this.options;
    if (!timerEl || this.recordingStartedAt <= 0) return;
    const elapsed = performance.now() - this.recordingStartedAt;
    timerEl.textContent = formatRecordingElapsed(elapsed);
  }

  private stopRecordingTimer() {
    const { timerEl } = this.options;
    if (this.recordingTimerIntervalId != null) {
      window.clearInterval(this.recordingTimerIntervalId);
      this.recordingTimerIntervalId = null;
    }
    this.recordingStartedAt = 0;
    if (!timerEl) return;
    timerEl.classList.remove('active');
    timerEl.textContent = '00:00';
    timerEl.setAttribute('aria-hidden', 'true');
  }

  private clearRecordingStopTimeout() {
    if (this.recordingStopTimeoutId == null) return;
    window.clearTimeout(this.recordingStopTimeoutId);
    this.recordingStopTimeoutId = null;
  }

  private clearFinalStopTimeout() {
    if (this.finalStopTimeoutId == null) return;
    window.clearTimeout(this.finalStopTimeoutId);
    this.finalStopTimeoutId = null;
  }

  private clearAnimationRenderTimeout() {
    if (this.animationRenderTimeoutId == null) return;
    window.clearTimeout(this.animationRenderTimeoutId);
    this.animationRenderTimeoutId = null;
  }

  private startRecordingTimer() {
    const { timerEl } = this.options;
    this.stopRecordingTimer();
    this.recordingStartedAt = performance.now();
    if (!timerEl) return;
    timerEl.classList.add('active');
    timerEl.setAttribute('aria-hidden', 'false');
    this.updateRecordingTimer();
    this.recordingTimerIntervalId = window.setInterval(() => this.updateRecordingTimer(), 250);
  }

  private setRecordButtonState(recording: boolean) {
    const { recordButton } = this.options;
    if (!recordButton) return;
    recordButton.disabled = this.recordingMode === 'animation';
    recordButton.classList.toggle('recording', recording);
    recordButton.classList.toggle('active', recording);
    const label = recording ? 'Stop viewport recording (Shift+R)' : 'Record viewport (Shift+R)';
    recordButton.title = label;
    recordButton.setAttribute('aria-label', label);
    const icon = recordButton.querySelector('.material-symbols-rounded');
    if (icon) icon.textContent = recording ? 'stop' : 'screen_record';
  }

  private setRenderButtonState(rendering: boolean) {
    const { renderButton } = this.options;
    if (!renderButton) return;
    renderButton.disabled = this.recordingMode === 'viewport';
    renderButton.classList.toggle('recording', rendering);
    renderButton.classList.toggle('active', rendering);
    const label = rendering ? 'Stop animation render' : 'Render animation video (Ctrl+Shift+E)';
    renderButton.title = label;
    renderButton.setAttribute('aria-label', label);
    const icon = renderButton.querySelector('.material-symbols-rounded');
    if (icon) icon.textContent = rendering ? 'stop' : 'vr180_create2d';
  }

  private captureOutputSize() {
    return {
      width: clampCaptureDimension(this.cameraCaptureWidth, window.innerWidth),
      height: clampCaptureDimension(this.cameraCaptureHeight, window.innerHeight),
    };
  }

  private captureCropRect(targetWidth: number, targetHeight: number): CaptureCropRect {
    const sourceCanvas = this.options.renderer.domElement;
    const sourceWidth = Math.max(1, sourceCanvas.width);
    const sourceHeight = Math.max(1, sourceCanvas.height);
    const rect = this.options.renderer.domElement.getBoundingClientRect();
    const cssWidth = Math.max(1, rect.width);
    const cssHeight = Math.max(1, rect.height);
    const fitScale = Math.min(1, cssWidth / targetWidth, cssHeight / targetHeight);
    const frameCssWidth = targetWidth * fitScale;
    const frameCssHeight = targetHeight * fitScale;

    const cropWidth = Math.max(1, frameCssWidth * (sourceWidth / cssWidth));
    const cropHeight = Math.max(1, frameCssHeight * (sourceHeight / cssHeight));

    const sx = Math.max(0, (sourceWidth - cropWidth) * 0.5);
    const sy = Math.max(0, (sourceHeight - cropHeight) * 0.5);
    return { sx, sy, sw: cropWidth, sh: cropHeight };
  }

  private ensureCaptureCanvas(width: number, height: number) {
    if (!this.captureCanvas) {
      this.captureCanvas = document.createElement('canvas');
      this.captureCanvasContext = this.captureCanvas.getContext('2d', { alpha: false });
    }
    if (!this.captureCanvas || !this.captureCanvasContext) return false;
    if (this.captureCanvas.width !== width) this.captureCanvas.width = width;
    if (this.captureCanvas.height !== height) this.captureCanvas.height = height;
    return true;
  }

  private drawRendererToCaptureCanvas() {
    const { width, height } = this.captureOutputSize();
    if (!this.ensureCaptureCanvas(width, height)) return false;
    const context = this.captureCanvasContext!;
    const sourceCanvas = this.options.renderer.domElement;
    const crop = this.captureCropRect(width, height);
    context.drawImage(
      sourceCanvas,
      crop.sx,
      crop.sy,
      crop.sw,
      crop.sh,
      0,
      0,
      width,
      height,
    );
    return true;
  }

  private updateCameraViewOverlay() {
    const overlayEl = this.options.cameraOverlayEl;
    if (!overlayEl) return;

    const { width: targetWidth, height: targetHeight } = this.captureOutputSize();
    const rect = this.options.renderer.domElement.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) {
      overlayEl.style.display = 'none';
      return;
    }

    const fitScale = Math.min(1, rect.width / targetWidth, rect.height / targetHeight);
    const overlayWidth = targetWidth * fitScale;
    const overlayHeight = targetHeight * fitScale;

    overlayEl.style.display = 'block';
    overlayEl.style.left = `${rect.left + ((rect.width - overlayWidth) * 0.5)}px`;
    overlayEl.style.top = `${rect.top + ((rect.height - overlayHeight) * 0.5)}px`;
    overlayEl.style.width = `${overlayWidth}px`;
    overlayEl.style.height = `${overlayHeight}px`;
  }

  private startCaptureBlitLoop() {
    this.stopCaptureBlitLoop();
    const blit = () => {
      if (!this.isRecording() || this.recordingMode !== 'viewport') {
        this.captureBlitRafId = null;
        return;
      }
      this.drawRendererToCaptureCanvas();
      this.captureBlitRafId = window.requestAnimationFrame(blit);
    };
    blit();
  }

  private stopCaptureBlitLoop() {
    if (this.captureBlitRafId == null) return;
    window.cancelAnimationFrame(this.captureBlitRafId);
    this.captureBlitRafId = null;
  }

  private renderCanvasFrame() {
    const { renderer, scene, camera } = this.options;
    if (this.options.renderFrame) {
      this.options.renderFrame();
      return;
    }
    renderer.render(scene, camera);
  }

  private requestCanvasStreamFrame() {
    if (!this.manualFrameCapture) return;
    const track = this.recorderStream?.getVideoTracks()[0] as CanvasCaptureMediaStreamTrack | undefined;
    track?.requestFrame?.();
  }

  private requestRecorderData() {
    try {
      if (this.recorder?.state === 'recording') this.recorder.requestData();
    } catch {
      // Some encoders reject explicit flush requests; stopping still flushes data.
    }
  }

  private scheduleFinalRecordingStop(frameDelayMs: number) {
    this.clearFinalStopTimeout();
    this.requestRecorderData();
    this.finalStopTimeoutId = window.setTimeout(() => this.stopRecording(), Math.ceil(frameDelayMs));
  }

  private recommendedRecordingBitrate() {
    const { width, height } = this.captureOutputSize();
    const pixelCount = Math.max(1, width * height);
    const bitsPerPixelFrame = pixelCount >= (3840 * 2160)
      ? 0.16
      : pixelCount >= (2560 * 1440)
        ? 0.2
        : 0.24;
    const target = Math.round(pixelCount * this.recordingFps * bitsPerPixelFrame);
    return Math.max(VIDEO_RECORDER_MIN_BITRATE, Math.min(VIDEO_RECORDER_MAX_BITRATE, target));
  }

  private finalizeRecording(downloadVideo: boolean) {
    if (this.recordingFinalized) return;
    this.recordingFinalized = true;

    const { gridGroup, axes } = this.options;
    const mimeType = this.recorderMimeType;
    const chunks = this.recorderChunks;
    const stream = this.recorderStream;
    const filePrefix = this.recordingFilePrefix;
    const stopCallback = this.recordingStopCallback;

    this.recorder = null;
    this.recorderStream = null;
    this.recorderChunks = [];
    this.stopCaptureBlitLoop();
    this.clearRecordingStopTimeout();
    this.clearFinalStopTimeout();
    this.clearAnimationRenderTimeout();

    stream?.getTracks().forEach(track => track.stop());
    gridGroup.visible = this.gridVisibleBeforeCapture;
    axes.visible = this.axesVisibleBeforeCapture;
    this.restoreCaptureResolution();
    this.renderCanvasFrame();
    this.stopRecordingTimer();
    this.recordingMode = null;
    this.recordingStopCallback = null;
    this.manualFrameCapture = false;
    this.setRecordButtonState(false);
    this.setRenderButtonState(false);
    stopCallback?.();

    if (!downloadVideo) return;
    if (chunks.length === 0) {
      alert('Recording stopped, but no video data was captured.');
      return;
    }
    const blob = new Blob(chunks, { type: mimeType || 'video/webm' });
    const ext = recordingFileExtensionFromMime(blob.type || mimeType);
    downloadBlob(`${filePrefix}-${captureTimestamp()}.${ext}`, blob);
  }

  private stopRecording() {
    if (!this.recorder) return;
    this.stopCaptureBlitLoop();
    this.clearFinalStopTimeout();
    this.clearAnimationRenderTimeout();
    try {
      if (this.recorder.state !== 'inactive') {
        this.requestRecorderData();
        this.recorder.stop();
      } else {
        this.finalizeRecording(true);
      }
    } catch {
      this.finalizeRecording(false);
    }
  }

  private startRecording(options: StartRecordingOptions) {
    if (typeof MediaRecorder === 'undefined') {
      alert('Viewport recording is not supported in this browser.');
      return false;
    }
    const { gridGroup, axes } = this.options;
    this.applyCaptureResolution();
    if (!this.drawRendererToCaptureCanvas() || !this.captureCanvas) {
      this.restoreCaptureResolution();
      alert('Viewport capture canvas is unavailable.');
      return false;
    }
    const captureStream = this.captureCanvas.captureStream?.bind(this.captureCanvas);
    if (!captureStream) {
      this.restoreCaptureResolution();
      alert('Viewport recording is not supported in this browser.');
      return false;
    }

    let stream = captureStream(options.manualFrameCapture ? 0 : this.recordingFps);
    this.manualFrameCapture = !!options.manualFrameCapture
      && typeof (stream.getVideoTracks()[0] as CanvasCaptureMediaStreamTrack | undefined)?.requestFrame === 'function';
    if (options.manualFrameCapture && !this.manualFrameCapture) {
      stream.getTracks().forEach(track => track.stop());
      stream = captureStream(this.recordingFps);
    }

    const mimeType = pickRecorderMimeType();
    const videoBitsPerSecond = this.recommendedRecordingBitrate();
    let recorder: MediaRecorder;
    try {
      recorder = mimeType
        ? new MediaRecorder(stream, { mimeType, videoBitsPerSecond })
        : new MediaRecorder(stream, { videoBitsPerSecond });
    } catch {
      try {
        recorder = mimeType
          ? new MediaRecorder(stream, { mimeType })
          : new MediaRecorder(stream);
      } catch {
        stream.getTracks().forEach(track => track.stop());
        this.restoreCaptureResolution();
        alert('Unable to start viewport recording.');
        return false;
      }
    }

    this.recorder = recorder;
    this.recorderStream = stream;
    this.recorderChunks = [];
    this.recorderMimeType = recorder.mimeType || mimeType || 'video/webm';
    this.gridVisibleBeforeCapture = gridGroup.visible;
    this.axesVisibleBeforeCapture = axes.visible;
    this.recordingMode = options.mode;
    this.recordingFilePrefix = options.filePrefix;
    this.recordingStopCallback = options.onStop ?? null;
    this.recordingFinalized = false;

    recorder.ondataavailable = ev => {
      if (ev.data && ev.data.size > 0) this.recorderChunks.push(ev.data);
    };
    recorder.onerror = () => {
      alert('Viewport recording failed.');
      this.finalizeRecording(false);
    };
    recorder.onstop = () => {
      this.finalizeRecording(true);
    };

    gridGroup.visible = false;
    axes.visible = false;
    this.renderCanvasFrame();
    this.drawRendererToCaptureCanvas();
    this.setRecordButtonState(options.mode === 'viewport');
    this.setRenderButtonState(options.mode === 'animation');
    this.startRecordingTimer();

    try {
      recorder.start(200);
      if (options.mode === 'viewport' && !this.manualFrameCapture) {
        this.startCaptureBlitLoop();
      }
      if (options.autoStopMs != null) {
        this.recordingStopTimeoutId = window.setTimeout(() => this.stopRecording(), options.autoStopMs);
      }
      options.onStart?.();
      return true;
    } catch {
      this.finalizeRecording(false);
      alert('Unable to start viewport recording.');
      return false;
    }
  }

  private applyCaptureResolution() {
    if (this.captureResolutionAdjusted || this.renderQuality === 'full') return;
    this.options.setCaptureResolutionMode?.(this.renderQuality);
    this.captureResolutionAdjusted = true;
  }

  private restoreCaptureResolution() {
    if (!this.captureResolutionAdjusted) return;
    this.options.setCaptureResolutionMode?.(this.renderQuality);
    this.captureResolutionAdjusted = false;
  }
}
