import type { PrimitiveSurfaceTopology } from './primitives';
import type { CellTopology } from './cellTopologyTypes';

export function surfaceTopologyFromCellTopology(topology?: CellTopology): PrimitiveSurfaceTopology | undefined {
  const faces = topology?.cells[2];
  if (!faces) return undefined;

  const triangles: number[] = [];
  const facetIds: number[] = [];
  for (let cellId = 0; cellId < faces.offsets.length - 1; cellId++) {
    const start = faces.offsets[cellId];
    const end = faces.offsets[cellId + 1];
    const count = end - start;
    if (count < 3) continue;
    const anchor = faces.vertices[start];
    for (let i = start + 1; i < end - 1; i++) {
      triangles.push(anchor, faces.vertices[i], faces.vertices[i + 1]);
      facetIds.push(cellId & 0xffff);
    }
  }

  if (triangles.length < 3 || facetIds.length * 3 !== triangles.length) return undefined;
  return {
    triangles: new Uint32Array(triangles),
    facetIds: new Uint16Array(facetIds),
  };
}
