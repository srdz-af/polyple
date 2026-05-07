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

const ORBIT_TARGET = new THREE.Vector3(0, 0, 0);
const ORBIT_RATE = 1.9;
const ZOOM_RATE = 2.6;
const ZOOM_MIN_DISTANCE = 0.2;
const ZOOM_MAX_DISTANCE = 80;

export function viewModeShortcutIndex(ev: KeyboardEvent) {
  const keyMatch = /^[1-4]$/.test(ev.key) ? Number.parseInt(ev.key, 10) - 1 : -1;
  if (keyMatch >= 0) return keyMatch;

  const codeMatch = /^(?:Digit|Numpad)([1-4])$/.exec(ev.code);
  return codeMatch ? Number.parseInt(codeMatch[1], 10) - 1 : -1;
}

export class KeyboardCameraController {
  private readonly offset = new THREE.Vector3();
  private readonly spherical = new THREE.Spherical();
  private readonly targetOffset = new THREE.Vector3();
  private readonly currentOffset = new THREE.Vector3();
  private readonly keys = {
    left: false,
    right: false,
    up: false,
    down: false,
    ctrl: false,
  };
  private smoothingActive = false;

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

  update(dt: number) {
    this.applyInput(dt);
    this.applySmoothing(dt);
  }

  private setCameraToOriginOffset(offset: THREE.Vector3) {
    const { camera, controls, worldUp, onCameraChange } = this.options;
    controls.target.copy(ORBIT_TARGET);
    camera.up.copy(worldUp);
    camera.position.copy(ORBIT_TARGET).add(offset);
    camera.lookAt(ORBIT_TARGET);
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
      this.offset.copy(this.options.camera.position).sub(ORBIT_TARGET);
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
    this.offset.copy(this.options.camera.position).sub(ORBIT_TARGET);
    if (this.offset.lengthSq() < 1e-8) {
      this.offset.copy(this.options.defaultCameraPosition);
    }
    const alpha = 1 - Math.exp(-dt * 14);
    this.currentOffset.copy(this.offset).lerp(this.targetOffset, alpha);
    if (this.currentOffset.distanceToSquared(this.targetOffset) < 0.00001) {
      this.currentOffset.copy(this.targetOffset);
      this.smoothingActive = false;
    }
    this.setCameraToOriginOffset(this.currentOffset);
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
