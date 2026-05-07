import * as THREE from 'three';

type ViewportCaptureControllerOptions = {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.Camera;
  gridGroup: THREE.Object3D;
  axes: THREE.Object3D;
  renderButton: HTMLButtonElement | null;
  recordButton: HTMLButtonElement | null;
  captureButton: HTMLButtonElement | null;
  timerEl: HTMLSpanElement | null;
  setCaptureResolutionMode?: (fullResolution: boolean) => void;
  renderFrame?: () => void;
  renderAnimationFrame?: (frame: number) => void;
  onAnimationRenderStart?: () => void;
  onAnimationRenderStop?: () => void;
};

type RecordingMode = 'viewport' | 'animation';

type StartRecordingOptions = {
  mode: RecordingMode;
  filePrefix: string;
  autoStopMs: number | null;
  manualFrameCapture?: boolean;
  onStart?: () => void;
  onStop?: () => void;
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

const recorderBufferSize = new THREE.Vector2();

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
  private fullResolutionCapture = true;
  private recordingMode: RecordingMode | null = null;
  private recordingFilePrefix = 'blend-viewport';
  private recordingStopCallback: (() => void) | null = null;
  private manualFrameCapture = false;
  private captureResolutionAdjusted = false;

  constructor(private readonly options: ViewportCaptureControllerOptions) {}

  setRecordingSettings(fps: number, frameCount: number, fullResolution = this.fullResolutionCapture) {
    this.recordingFps = Math.max(1, Math.min(120, Math.round(Number.isFinite(fps) ? fps : DEFAULT_VIDEO_RECORDER_FPS)));
    this.recordingFrameCount = Math.max(1, Math.min(12000, Math.round(Number.isFinite(frameCount) ? frameCount : 180)));
    this.fullResolutionCapture = !!fullResolution;
  }

  bindControls() {
    this.setRecordButtonState(false);
    this.setRenderButtonState(false);
    this.options.renderButton?.addEventListener('click', () => this.renderAnimation());
    this.options.recordButton?.addEventListener('click', () => this.toggleRecording());
    this.options.captureButton?.addEventListener('click', () => this.captureFrame());
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

    const { gridGroup, axes, renderer } = this.options;
    const previousGridVisibility = gridGroup.visible;
    const previousAxesVisibility = axes.visible;
    this.applyCaptureResolution();
    gridGroup.visible = false;
    axes.visible = false;
    this.renderCanvasFrame();
    try {
      const dataUrl = renderer.domElement.toDataURL('image/png');
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
    this.options.renderer.getDrawingBufferSize(recorderBufferSize);
    const pixelCount = Math.max(1, recorderBufferSize.x * recorderBufferSize.y);
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
    const { renderer, gridGroup, axes } = this.options;
    this.applyCaptureResolution();
    const captureStream = renderer.domElement.captureStream?.bind(renderer.domElement);
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
    this.setRecordButtonState(options.mode === 'viewport');
    this.setRenderButtonState(options.mode === 'animation');
    this.startRecordingTimer();

    try {
      recorder.start(200);
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
    if (this.captureResolutionAdjusted || this.fullResolutionCapture) return;
    this.options.setCaptureResolutionMode?.(false);
    this.captureResolutionAdjusted = true;
  }

  private restoreCaptureResolution() {
    if (!this.captureResolutionAdjusted) return;
    this.options.setCaptureResolutionMode?.(true);
    this.captureResolutionAdjusted = false;
  }
}
