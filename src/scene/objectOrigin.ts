export type ObjectOrigin = Float32Array<ArrayBufferLike>;

export function computeObjectOrigin(
  coords: Float32Array<ArrayBufferLike>,
  count: number,
  dimensions: number,
  target?: ObjectOrigin,
) {
  const dimCount = Math.max(0, dimensions);
  const out: ObjectOrigin = target && target.length >= dimCount ? target : new Float32Array(dimCount);
  out.fill(0, 0, dimCount);
  if (count <= 0) return out;

  for (let d = 0; d < dimCount; d++) {
    let sum = 0;
    const offset = d * count;
    for (let i = 0; i < count; i++) sum += coords[offset + i] ?? 0;
    out[d] = sum / count;
  }
  return out;
}

export function cloneObjectOrigin(
  origin: ArrayLike<number> | undefined,
  coords: Float32Array<ArrayBufferLike>,
  count: number,
  dimensions: number,
) {
  const out: ObjectOrigin = new Float32Array(Math.max(0, dimensions));
  if (!origin || origin.length < dimensions) return computeObjectOrigin(coords, count, dimensions, out);

  for (let d = 0; d < dimensions; d++) {
    const value = origin[d];
    if (!Number.isFinite(value)) return computeObjectOrigin(coords, count, dimensions, out);
    out[d] = value;
  }
  return out;
}
