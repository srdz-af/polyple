import * as THREE from 'three';
import { MAX_N } from '../constants';

export type AxisMap = number[];

export function canonicalAxisMap(localN: number): AxisMap {
  const count = Math.max(0, Math.min(localN, MAX_N));
  return Array.from({ length: count }, (_, dim) => dim);
}

export function normalizeAxisMap(axisMap: AxisMap | undefined, localN: number): AxisMap {
  const fallback = canonicalAxisMap(localN);
  const used = new Set<number>();

  return fallback.map((fallbackDim, dim) => {
    const mapped = axisMap?.[dim];
    const valid = typeof mapped === 'number'
      && Number.isInteger(mapped)
      && mapped >= 0
      && mapped < MAX_N
      && !used.has(mapped);
    const out = valid ? mapped : fallbackDim;
    used.add(out);
    return out;
  });
}

export function embedToMax(localVerts: Float32Array, localN: number, axisMap: AxisMap) {
  const V = localVerts.length / localN;
  const out = new Float32Array(MAX_N * V);
  for (let d = 0; d < localN; d++) {
    const dim = axisMap[d] ?? d;
    for (let v = 0; v < V; v++) {
      out[dim * V + v] = localVerts[d * V + v];
    }
  }
  return out;
}

export function perspectiveScaleFrom(rotated: ArrayLike<number>, perspectiveDims: number[]) {
  if (perspectiveDims.length === 0) return 1;
  const k = 0.6;
  let scale = 1;
  for (const dim of perspectiveDims) {
    const value = rotated[dim] ?? 0;
    const denom = Math.max(0.05, 1 - (k * value));
    scale /= denom;
  }
  return Math.min(80, Math.max(0.01, scale));
}

export function recenterProjected(Yarr: Float32Array, Mloc: number, target = new THREE.Vector3()) {
  if (Mloc === 0) return target.set(0, 0, 0);
  let sumX = 0;
  let sumY = 0;
  let sumZ = 0;
  for (let i = 0; i < Mloc; i++) {
    sumX += Yarr[i];
    sumY += Yarr[Mloc + i];
    sumZ += Yarr[2 * Mloc + i];
  }
  const cx = sumX / Mloc;
  const cy = sumY / Mloc;
  const cz = sumZ / Mloc;
  for (let i = 0; i < Mloc; i++) {
    Yarr[i] -= cx;
    Yarr[Mloc + i] -= cy;
    Yarr[2 * Mloc + i] -= cz;
  }
  return target.set(cx, cy, cz);
}
