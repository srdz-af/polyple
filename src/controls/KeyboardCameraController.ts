import * as THREE from 'three';
import type { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

type KeyboardCameraControllerOptions = {
  camera: THREE.PerspectiveCamera;
  controls: OrbitControls;
  defaultCameraPosition: THREE.Vector3;
  worldUp: THREE.Vector3;
  isTransformActive: () => boolean;
  onCameraChange: () => void;
};

const DEFAULT_ORBIT_TARGET = new THREE.Vector3(0, 0, 0);
const ORBIT_RATE = 1.9;
const ZOOM_RATE = 2.6;
const ZOOM_MIN_DISTANCE = 0.2;
const ZOOM_MAX_DISTANCE = 80;
const CAMERA_SMOOTHING_RATE = 18;
const FOCUS_TRANSITION_SECONDS = 0.54;
const FOCUS_EASE_STRENGTH = 0.65;

export function viewModeShortcutIndex(ev: KeyboardEvent) {
  const keyMatch = /^[1-8]$/.test(ev.key) ? Number.parseInt(ev.key, 10) - 1 : -1;
  if (keyMatch >= 0) return keyMatch;

  const codeMatch = /^(?:Digit|Numpad)([1-8])$/.exec(ev.code);
  return codeMatch ? Number.parseInt(codeMatch[1], 10) - 1 : -1;
}

export class KeyboardCameraController {
  private readonly offset = new THREE.Vector3();
  private readonly spherical = new THREE.Spherical();
  private readonly targetOffset = new THREE.Vector3();
  private readonly currentOffset = new THREE.Vector3();
  private readonly focusStartTarget = new THREE.Vector3();
  private readonly focusEndTarget = new THREE.Vector3();
  private readonly focusCurrentTarget = new THREE.Vector3();
  private readonly focusOffset = new THREE.Vector3();
  private readonly keys = {
    left: false,
    right: false,
    up: false,
    down: false,
    ctrl: false,
  };
  private smoothingActive = false;
  private focusTransitionActive = false;
  private focusTransitionElapsed = 0;

  constructor(private readonly options: KeyboardCameraControllerOptions) {}

  handleKeyDown(ev: KeyboardEvent, key: string) {
    if (this.options.isTransformActive()) return false;
    if (ev.metaKey || ev.altKey || ev.shiftKey) return false;

    if (key === 'control') {
      this.keys.ctrl = true;
      return false;
    }

    if (this.setArrowKey(key, true)) {
      this.keys.ctrl = ev.ctrlKey;
      ev.preventDefault();
      return true;
    }

    return false;
  }

  handleKeyUp(ev: KeyboardEvent) {
    const key = ev.key.toLowerCase();
    if (key === 'control') {
      this.keys.ctrl = false;
      return;
    }
    this.setArrowKey(key, false);
  }

  clearKeys() {
    this.keys.left = false;
    this.keys.right = false;
    this.keys.up = false;
    this.keys.down = false;
    this.keys.ctrl = false;
  }

  recenterCamera() {
    this.smoothingActive = false;
    this.focusTransitionActive = false;
    this.targetOffset.copy(this.options.defaultCameraPosition);
    this.currentOffset.copy(this.options.defaultCameraPosition);
    this.setCameraToTargetOffset(this.options.controls.target, this.options.defaultCameraPosition);
  }

  resetFocus() {
    const { camera, controls, defaultCameraPosition } = this.options;
    const offset = camera.position.clone().sub(controls.target);
    if (offset.lengthSq() < 1e-8) offset.copy(defaultCameraPosition);

    this.smoothingActive = false;
    this.focusTransitionActive = false;
    this.targetOffset.copy(offset);
    this.currentOffset.copy(offset);
    this.setCameraToTargetOffset(DEFAULT_ORBIT_TARGET, offset);
  }

  focusOn(target: THREE.Vector3) {
    const { camera, controls, defaultCameraPosition } = this.options;
    const offset = camera.position.clone().sub(controls.target);
    if (offset.lengthSq() < 1e-8) offset.copy(defaultCameraPosition);

    this.smoothingActive = false;
    this.targetOffset.copy(offset);
    this.currentOffset.copy(offset);
    this.focusOffset.copy(offset);
    this.focusStartTarget.copy(controls.target);
    this.focusEndTarget.copy(target);
    this.focusTransitionElapsed = 0;
    this.focusTransitionActive = true;
  }

  update(dt: number) {
    this.applyInput(dt);
    this.applySmoothing(dt);
    this.applyFocusTransition(dt);
  }

  private setCameraToTargetOffset(target: THREE.Vector3, offset: THREE.Vector3) {
    const { camera, controls, worldUp, onCameraChange } = this.options;
    controls.target.copy(target);
    camera.up.copy(worldUp);
    camera.position.copy(target).add(offset);
    camera.lookAt(target);
    controls.update();
    onCameraChange();
  }

  private queueOffset(offset: THREE.Vector3) {
    this.targetOffset.copy(offset);
    this.smoothingActive = true;
  }

  private getPlanningOffset() {
    if (this.smoothingActive) {
      this.offset.copy(this.targetOffset);
    } else {
      this.offset.copy(this.options.camera.position).sub(this.options.controls.target);
    }
    if (this.offset.lengthSq() < 1e-8) {
      this.offset.copy(this.options.defaultCameraPosition);
    }
    return this.offset;
  }

  private applyInput(dt: number) {
    if (this.options.isTransformActive()) return;
    const horizontal = Number(this.keys.left) - Number(this.keys.right);
    const vertical = Number(this.keys.down) - Number(this.keys.up);
    if (horizontal !== 0 || vertical !== 0) this.focusTransitionActive = false;

    if (this.keys.ctrl) {
      if (vertical === 0) return;
      this.zoomTowardOrigin(Math.exp(vertical * ZOOM_RATE * dt));
      return;
    }

    if (horizontal === 0 && vertical === 0) return;
    this.orbitAroundOrigin(horizontal * ORBIT_RATE * dt, vertical * ORBIT_RATE * dt);
  }

  private applySmoothing(dt: number) {
    if (!this.smoothingActive) return;
    this.offset.copy(this.options.camera.position).sub(this.options.controls.target);
    if (this.offset.lengthSq() < 1e-8) {
      this.offset.copy(this.options.defaultCameraPosition);
    }
    const alpha = 1 - Math.exp(-dt * CAMERA_SMOOTHING_RATE);
    this.currentOffset.copy(this.offset).lerp(this.targetOffset, alpha);
    if (this.currentOffset.distanceToSquared(this.targetOffset) < 0.00001) {
      this.currentOffset.copy(this.targetOffset);
      this.smoothingActive = false;
    }
    this.setCameraToTargetOffset(this.options.controls.target, this.currentOffset);
  }

  private applyFocusTransition(dt: number) {
    if (!this.focusTransitionActive) return;
    this.focusTransitionElapsed += dt;
    const t = Math.min(1, this.focusTransitionElapsed / FOCUS_TRANSITION_SECONDS);
    const easeOut = 1 - Math.pow(1 - t, 3);
    const eased = THREE.MathUtils.lerp(t, easeOut, FOCUS_EASE_STRENGTH);
    this.focusCurrentTarget.copy(this.focusStartTarget).lerp(this.focusEndTarget, eased);

    if (t >= 1) {
      this.focusTransitionActive = false;
      this.focusCurrentTarget.copy(this.focusEndTarget);
    }
    this.setCameraToTargetOffset(this.focusCurrentTarget, this.focusOffset);
  }

  private orbitAroundOrigin(thetaDelta: number, phiDelta: number) {
    const offset = this.getPlanningOffset();
    this.spherical.setFromVector3(offset);
    this.spherical.theta += thetaDelta;
    this.spherical.phi = Math.max(0.01, Math.min(Math.PI - 0.01, this.spherical.phi + phiDelta));
    offset.setFromSpherical(this.spherical);
    this.queueOffset(offset);
  }

  private zoomTowardOrigin(scale: number) {
    const offset = this.getPlanningOffset();
    const distance = Math.max(ZOOM_MIN_DISTANCE, Math.min(ZOOM_MAX_DISTANCE, offset.length() * scale));
    offset.normalize().multiplyScalar(distance);
    this.queueOffset(offset);
  }

  private setArrowKey(key: string, pressed: boolean) {
    if (key === 'arrowleft') {
      this.keys.left = pressed;
      return true;
    }
    if (key === 'arrowright') {
      this.keys.right = pressed;
      return true;
    }
    if (key === 'arrowup') {
      this.keys.up = pressed;
      return true;
    }
    if (key === 'arrowdown') {
      this.keys.down = pressed;
      return true;
    }
    return false;
  }
}
