import * as THREE from 'three';
import type { SceneLightKind, SceneLightState } from './types';

export type SceneLightHelper = THREE.PointLightHelper | THREE.SpotLightHelper;
export type SceneLightMarker = THREE.Mesh<THREE.BufferGeometry, THREE.MeshBasicMaterial>;
export type SceneLightDirectionLine = THREE.Line<THREE.BufferGeometry, THREE.LineBasicMaterial>;
export type SceneLightRuntime = {
  state: SceneLightState;
  light: THREE.PointLight | THREE.SpotLight;
  helper: SceneLightHelper;
  marker: SceneLightMarker;
  targetMarker: SceneLightMarker;
  directionLine: SceneLightDirectionLine;
};

export type SceneLightRuntimeOptions = {
  scene: THREE.Scene;
  markerGeometry: THREE.BufferGeometry;
  createId: () => string;
  shadowMapSize: () => number;
  selected?: boolean;
};

const SCENE_SPOT_DIRECTION_ANGLE = Math.PI / 2;
const SCENE_SPOT_DIRECTION_PENUMBRA = 0.08;

function finiteNumber(value: unknown, fallback = 0) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

export function normalizeSceneLightState(
  state: Partial<SceneLightState>,
  createId: () => string = () => `light_${Date.now().toString(36)}`,
): SceneLightState {
  const kind: SceneLightKind = state.kind === 'directional' ? 'directional' : 'point';
  const fallbackPosition = kind === 'point' ? new THREE.Vector3(1.8, 1.8, 1.8) : new THREE.Vector3(2, 3, 4);
  const position = state.position?.clone() ?? fallbackPosition;
  const target = state.target?.clone() ?? new THREE.Vector3();
  if (kind === 'directional' && target.distanceToSquared(position) < 1e-8) {
    target.copy(position).add(new THREE.Vector3(0, -1, 0));
  }
  return {
    id: state.id?.trim() || createId(),
    kind,
    label: state.label?.trim() || `${kind === 'point' ? 'Point' : 'Directional'} light`,
    color: Math.max(0, Math.min(0xffffff, (state.color ?? 0xffffff) >>> 0)),
    intensity: Math.max(0, finiteNumber(state.intensity, kind === 'point' ? 3 : 1)),
    position,
    target,
    visible: state.visible !== false,
    castShadow: state.castShadow === true,
  };
}

export function cloneSceneLightState(lightState: SceneLightState): SceneLightState {
  return normalizeSceneLightState({
    ...lightState,
    position: lightState.position.clone(),
    target: lightState.target?.clone() ?? new THREE.Vector3(),
  }, () => lightState.id);
}

function createSceneLightObject(scene: THREE.Scene, state: SceneLightState) {
  const object = state.kind === 'point'
    ? new THREE.PointLight(state.color, state.intensity, 0, 2)
    : new THREE.SpotLight(state.color, state.intensity, 0, SCENE_SPOT_DIRECTION_ANGLE, SCENE_SPOT_DIRECTION_PENUMBRA, 2);
  object.name = state.id;
  if (object instanceof THREE.SpotLight) {
    object.target.position.copy(state.target);
    scene.add(object.target);
  }
  scene.add(object);
  return object;
}

function configureLightHelperMaterials(object: THREE.Object3D, color: number, opacity = 0.82) {
  object.traverse(child => {
    child.renderOrder = 42;
    const material = (child as THREE.Line | THREE.Mesh).material as THREE.Material | THREE.Material[] | undefined;
    const materials = Array.isArray(material) ? material : (material ? [material] : []);
    materials.forEach(entry => {
      entry.depthTest = false;
      entry.depthWrite = false;
      entry.transparent = true;
      entry.opacity = opacity;
      if ('color' in entry && entry.color instanceof THREE.Color) entry.color.setHex(color);
    });
  });
}

function createSceneLightHelper(scene: THREE.Scene, state: SceneLightState, lightObject: THREE.PointLight | THREE.SpotLight): SceneLightHelper {
  const helper = lightObject instanceof THREE.PointLight
    ? new THREE.PointLightHelper(lightObject, 0.25, state.color)
    : new THREE.SpotLightHelper(lightObject, state.color);
  helper.name = `${state.id}-helper`;
  helper.visible = false;
  configureLightHelperMaterials(helper, state.color);
  scene.add(helper);
  return helper;
}

function createSceneLightMarker(
  scene: THREE.Scene,
  markerGeometry: THREE.BufferGeometry,
  state: SceneLightState,
): SceneLightMarker {
  const material = new THREE.MeshBasicMaterial({
    color: state.color,
    transparent: true,
    opacity: 0.68,
    depthTest: false,
    depthWrite: false,
  });
  const marker = new THREE.Mesh(markerGeometry, material);
  marker.name = `${state.id}-marker`;
  marker.renderOrder = 41;
  marker.userData.sceneLightId = state.id;
  marker.userData.sceneLightHandle = 'position';
  marker.visible = false;
  scene.add(marker);
  return marker;
}

function createSceneLightTargetMarker(
  scene: THREE.Scene,
  markerGeometry: THREE.BufferGeometry,
  state: SceneLightState,
): SceneLightMarker {
  const material = new THREE.MeshBasicMaterial({
    color: state.color,
    transparent: true,
    opacity: 0.86,
    depthTest: false,
    depthWrite: false,
    wireframe: true,
  });
  const marker = new THREE.Mesh(markerGeometry, material);
  marker.name = `${state.id}-target-marker`;
  marker.renderOrder = 43;
  marker.userData.sceneLightId = state.id;
  marker.userData.sceneLightHandle = 'target';
  marker.visible = false;
  scene.add(marker);
  return marker;
}

function createSceneLightDirectionLine(scene: THREE.Scene, state: SceneLightState): SceneLightDirectionLine {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3));
  const material = new THREE.LineBasicMaterial({
    color: state.color,
    transparent: true,
    opacity: 0.72,
    depthTest: false,
    depthWrite: false,
  });
  const line = new THREE.Line(geometry, material);
  line.name = `${state.id}-direction-line`;
  line.renderOrder = 42;
  line.visible = false;
  scene.add(line);
  return line;
}

export function createSceneLightRuntime(state: SceneLightState, options: SceneLightRuntimeOptions): SceneLightRuntime {
  const normalized = normalizeSceneLightState(state, options.createId);
  const lightObject = createSceneLightObject(options.scene, normalized);
  const runtime: SceneLightRuntime = {
    state: normalized,
    light: lightObject,
    helper: createSceneLightHelper(options.scene, normalized, lightObject),
    marker: createSceneLightMarker(options.scene, options.markerGeometry, normalized),
    targetMarker: createSceneLightTargetMarker(options.scene, options.markerGeometry, normalized),
    directionLine: createSceneLightDirectionLine(options.scene, normalized),
  };
  syncSceneLightRuntime(runtime, options);
  return runtime;
}

export function syncSceneLightShadow(runtime: SceneLightRuntime, shadowMapSize: number) {
  const enabled = runtime.state.visible && runtime.state.castShadow && shadowMapSize > 0;
  runtime.light.castShadow = enabled;
  if (!enabled) return;

  runtime.light.shadow.mapSize.set(shadowMapSize, shadowMapSize);
  runtime.light.shadow.bias = -0.00025;
  runtime.light.shadow.normalBias = 0.02;
  runtime.light.shadow.camera.near = runtime.light instanceof THREE.PointLight ? 0.05 : 0.1;
  runtime.light.shadow.camera.far = 100;
  if (runtime.light instanceof THREE.SpotLight) {
    runtime.light.shadow.focus = 1;
  }
  runtime.light.shadow.camera.updateProjectionMatrix();
  runtime.light.shadow.needsUpdate = true;
}

export function syncSceneLightRuntime(runtime: SceneLightRuntime, options: Pick<SceneLightRuntimeOptions, 'shadowMapSize' | 'selected'>) {
  const { state, light, helper, marker, targetMarker, directionLine } = runtime;
  const selected = options.selected === true;
  light.name = state.id;
  light.color.setHex(state.color);
  light.intensity = state.intensity;
  light.position.copy(state.position);
  light.visible = state.visible;
  if (light instanceof THREE.SpotLight) {
    light.angle = SCENE_SPOT_DIRECTION_ANGLE;
    light.penumbra = SCENE_SPOT_DIRECTION_PENUMBRA;
    light.distance = 0;
    light.decay = 2;
    light.target.position.copy(state.target);
    light.target.updateMatrixWorld();
  }
  marker.name = `${state.id}-marker`;
  marker.userData.sceneLightId = state.id;
  marker.userData.sceneLightHandle = 'position';
  marker.position.copy(state.position);
  marker.visible = state.visible;
  marker.material.color.setHex(state.color);
  marker.material.opacity = selected ? 1 : 0.68;

  const showDirectionHandle = state.visible && selected && state.kind === 'directional';
  targetMarker.name = `${state.id}-target-marker`;
  targetMarker.userData.sceneLightId = state.id;
  targetMarker.userData.sceneLightHandle = 'target';
  targetMarker.position.copy(state.target);
  targetMarker.visible = showDirectionHandle;
  targetMarker.material.color.setHex(state.color);
  targetMarker.material.opacity = showDirectionHandle ? 0.92 : 0;

  directionLine.name = `${state.id}-direction-line`;
  directionLine.visible = showDirectionHandle;
  directionLine.material.color.setHex(state.color);
  const positions = directionLine.geometry.getAttribute('position') as THREE.BufferAttribute;
  positions.setXYZ(0, state.position.x, state.position.y, state.position.z);
  positions.setXYZ(1, state.target.x, state.target.y, state.target.z);
  positions.needsUpdate = true;

  helper.name = `${state.id}-helper`;
  helper.visible = state.visible && selected && state.kind === 'point';
  configureLightHelperMaterials(helper, state.color, selected ? 0.92 : 0.72);
  helper.update();
  syncSceneLightShadow(runtime, options.shadowMapSize());
}

export function disposeSceneLightRuntime(scene: THREE.Scene, runtime: SceneLightRuntime) {
  scene.remove(runtime.helper);
  runtime.helper.dispose();
  scene.remove(runtime.marker);
  runtime.marker.material.dispose();
  scene.remove(runtime.targetMarker);
  runtime.targetMarker.material.dispose();
  scene.remove(runtime.directionLine);
  runtime.directionLine.geometry.dispose();
  runtime.directionLine.material.dispose();
  scene.remove(runtime.light);
  if (runtime.light instanceof THREE.SpotLight) scene.remove(runtime.light.target);
  runtime.light.dispose();
}

export function rebuildSceneLightRuntimeKind(runtime: SceneLightRuntime, options: SceneLightRuntimeOptions) {
  options.scene.remove(runtime.helper);
  runtime.helper.dispose();
  options.scene.remove(runtime.light);
  if (runtime.light instanceof THREE.SpotLight) options.scene.remove(runtime.light.target);
  runtime.light.dispose();
  runtime.light = createSceneLightObject(options.scene, runtime.state);
  runtime.helper = createSceneLightHelper(options.scene, runtime.state, runtime.light);
  syncSceneLightRuntime(runtime, options);
}
