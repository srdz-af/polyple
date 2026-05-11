import * as THREE from 'three';
import { MAX_N } from '../constants';
import { cloneSceneLightState, normalizeSceneLightState } from '../scene/sceneLightRuntime';
import type { SceneLightState } from '../scene/types';
import type { AnimationKeyframeState } from './KeyframeTimelineController';

export function lerpNumber(a: number, b: number, t: number) {
  return a + ((b - a) * t);
}

function lerpVector(a: THREE.Vector3, b: THREE.Vector3, t: number) {
  return new THREE.Vector3(
    lerpNumber(a.x, b.x, t),
    lerpNumber(a.y, b.y, t),
    lerpNumber(a.z, b.z, t),
  );
}

function lerpColorHex(a: number, b: number, t: number) {
  const ar = (a >> 16) & 0xff;
  const ag = (a >> 8) & 0xff;
  const ab = a & 0xff;
  const br = (b >> 16) & 0xff;
  const bg = (b >> 8) & 0xff;
  const bb = b & 0xff;
  return (
    (Math.round(lerpNumber(ar, br, t)) << 16)
    | (Math.round(lerpNumber(ag, bg, t)) << 8)
    | Math.round(lerpNumber(ab, bb, t))
  ) >>> 0;
}

function interpolateSceneLightState(from: SceneLightState, to: SceneLightState, t: number): SceneLightState {
  if (from.kind !== to.kind) return cloneSceneLightState(t < 0.5 ? from : to);
  return normalizeSceneLightState({
    id: t < 0.5 ? from.id : to.id,
    kind: from.kind,
    label: t < 0.5 ? from.label : to.label,
    color: lerpColorHex(from.color, to.color, t),
    intensity: lerpNumber(from.intensity, to.intensity, t),
    position: lerpVector(from.position, to.position, t),
    target: lerpVector(from.target, to.target, t),
    visible: t < 0.5 ? from.visible : to.visible,
    castShadow: t < 0.5 ? from.castShadow : to.castShadow,
  });
}

function interpolateSceneLights(from?: SceneLightState[], to?: SceneLightState[], t?: number): SceneLightState[] | undefined {
  if (!from && !to) return undefined;
  if (!from) return (t ?? 0) < 0.5 ? undefined : to?.map(cloneSceneLightState);
  if (!to) return (t ?? 0) < 0.5 ? from.map(cloneSceneLightState) : undefined;
  const result: SceneLightState[] = [];
  const usedToIds = new Set<string>();

  from.forEach((fromLight, index) => {
    const toLight = to.find(candidate => candidate.id === fromLight.id)
      ?? (to[index]?.kind === fromLight.kind ? to[index] : undefined);
    if (toLight) {
      usedToIds.add(toLight.id);
      result.push(interpolateSceneLightState(fromLight, toLight, t ?? 0));
    } else if ((t ?? 0) < 0.5) {
      result.push(cloneSceneLightState(fromLight));
    }
  });

  if ((t ?? 0) >= 0.5) {
    to.forEach(toLight => {
      if (!usedToIds.has(toLight.id)) result.push(cloneSceneLightState(toLight));
    });
  }

  return result;
}

function slerpDirection(a: THREE.Vector3, b: THREE.Vector3, t: number) {
  const from = a.clone().normalize();
  const to = b.clone().normalize();
  const dot = Math.max(-1, Math.min(1, from.dot(to)));

  if (dot > 0.9995) {
    return from.lerp(to, t).normalize();
  }

  if (dot < -0.9995) {
    const seed = Math.abs(from.x) < 0.9
      ? new THREE.Vector3(1, 0, 0)
      : new THREE.Vector3(0, 1, 0);
    const orthogonal = seed.sub(from.clone().multiplyScalar(seed.dot(from))).normalize();
    return from
      .multiplyScalar(Math.cos(Math.PI * t))
      .addScaledVector(orthogonal, Math.sin(Math.PI * t))
      .normalize();
  }

  const theta = Math.acos(dot);
  const sinTheta = Math.sin(theta);
  return from
    .multiplyScalar(Math.sin((1 - t) * theta) / sinTheta)
    .addScaledVector(to, Math.sin(t * theta) / sinTheta)
    .normalize();
}

function interpolateCameraPosition(
  fromPosition: THREE.Vector3,
  fromTarget: THREE.Vector3,
  toPosition: THREE.Vector3,
  toTarget: THREE.Vector3,
  t: number,
) {
  const target = lerpVector(fromTarget, toTarget, t);
  const fromOffset = fromPosition.clone().sub(fromTarget);
  const toOffset = toPosition.clone().sub(toTarget);
  const fromDistance = fromOffset.length();
  const toDistance = toOffset.length();

  if (fromDistance < 1e-6 || toDistance < 1e-6) {
    return lerpVector(fromPosition, toPosition, t);
  }

  const direction = slerpDirection(fromOffset, toOffset, t);
  return target.addScaledVector(direction, lerpNumber(fromDistance, toDistance, t));
}

export function completeAxisOrder(order: number[]) {
  const next = order.filter(dim => Number.isInteger(dim) && dim >= 0 && dim < MAX_N);
  for (let dim = 0; dim < MAX_N; dim++) {
    if (!next.includes(dim)) next.push(dim);
  }
  return next.slice(0, MAX_N);
}

function orthonormalizeRows(raw: Float32Array, dimension: number) {
  const out = new Float32Array(raw);
  const row = new Float32Array(dimension);

  for (let r = 0; r < dimension; r++) {
    for (let c = 0; c < dimension; c++) row[c] = out[r * dimension + c] ?? 0;

    for (let prev = 0; prev < r; prev++) {
      let dot = 0;
      for (let c = 0; c < dimension; c++) dot += row[c] * out[prev * dimension + c];
      for (let c = 0; c < dimension; c++) row[c] -= dot * out[prev * dimension + c];
    }

    let lenSq = 0;
    for (let c = 0; c < dimension; c++) lenSq += row[c] * row[c];

    if (lenSq < 1e-8) {
      row.fill(0);
      row[r] = 1;
      for (let prev = 0; prev < r; prev++) {
        let dot = 0;
        for (let c = 0; c < dimension; c++) dot += row[c] * out[prev * dimension + c];
        for (let c = 0; c < dimension; c++) row[c] -= dot * out[prev * dimension + c];
      }
      lenSq = 0;
      for (let c = 0; c < dimension; c++) lenSq += row[c] * row[c];
    }

    const invLen = lenSq > 1e-8 ? 1 / Math.sqrt(lenSq) : 1;
    for (let c = 0; c < dimension; c++) out[r * dimension + c] = row[c] * invLen;
  }

  return out;
}

export function interpolateAnimationState(
  from: AnimationKeyframeState,
  to: AnimationKeyframeState,
  t: number,
  fallbackDimension: number,
  fallbackRotMatrix: Float32Array,
): AnimationKeyframeState {
  const dimension = from.dimension === to.dimension ? from.dimension : fallbackDimension;
  const matrixLength = dimension * dimension;
  const blended = new Float32Array(matrixLength);
  const cameraTarget = lerpVector(from.cameraTarget, to.cameraTarget, t);
  if (from.rotMatrix.length === matrixLength && to.rotMatrix.length === matrixLength) {
    for (let i = 0; i < matrixLength; i++) blended[i] = lerpNumber(from.rotMatrix[i], to.rotMatrix[i], t);
  } else {
    blended.set(fallbackRotMatrix.slice(0, matrixLength));
  }

  return {
    dimension,
    rotMatrix: orthonormalizeRows(blended, dimension),
    axesOrder: t < 0.5 ? completeAxisOrder(from.axesOrder) : completeAxisOrder(to.axesOrder),
    axesOffset: Math.round(lerpNumber(from.axesOffset, to.axesOffset, t)),
    renderMode: t < 0.5 ? from.renderMode : to.renderMode,
    bloomIntensity: lerpNumber(from.bloomIntensity, to.bloomIntensity, t),
    motionBlurIntensity: lerpNumber(from.motionBlurIntensity, to.motionBlurIntensity, t),
    colorHue: lerpNumber(from.colorHue, to.colorHue, t),
    colorSaturation: lerpNumber(from.colorSaturation, to.colorSaturation, t),
    colorBrightness: lerpNumber(from.colorBrightness, to.colorBrightness, t),
    colorContrast: lerpNumber(from.colorContrast, to.colorContrast, t),
    grainIntensity: lerpNumber(from.grainIntensity, to.grainIntensity, t),
    antialiasMode: t < 0.5 ? from.antialiasMode : to.antialiasMode,
    cameraPosition: interpolateCameraPosition(from.cameraPosition, from.cameraTarget, to.cameraPosition, to.cameraTarget, t),
    cameraTarget,
    cameraUp: lerpVector(from.cameraUp, to.cameraUp, t).normalize(),
    cameraFov: lerpNumber(from.cameraFov, to.cameraFov, t),
    cameraZoom: lerpNumber(from.cameraZoom, to.cameraZoom, t),
    lights: interpolateSceneLights(from.lights, to.lights, t),
  };
}
