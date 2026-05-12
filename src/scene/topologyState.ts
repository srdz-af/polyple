import {
  buildGeneratedCellTopology,
  cellCount,
  cloneCellTopology,
  getCellVertices,
  surfaceTopologyFromCellTopology,
  type CellTopology,
} from '../geometry/cellTopology';
import type { PrimitiveKind, PrimitiveSurfaceTopology } from '../geometry/primitives';
import { packU16, packU32, unpackU16, unpackU32 } from './sceneUrlState';
import type { DataSource } from './types';

export type PackedTopology = [string, string];
export type PackedCellTopology = Array<PackedTopology | null>;

export function packSurfaceTopology(topology?: PrimitiveSurfaceTopology): PackedTopology | undefined {
  if (!topology) return undefined;
  return [packU32(topology.triangles), packU16(topology.facetIds)];
}

export function unpackSurfaceTopology(topology?: PackedTopology): PrimitiveSurfaceTopology | undefined {
  if (!topology) return undefined;
  return {
    triangles: unpackU32(topology[0]),
    facetIds: unpackU16(topology[1]),
  };
}

export function emptySurfaceTopology(): PrimitiveSurfaceTopology {
  return {
    triangles: new Uint32Array(),
    facetIds: new Uint16Array(),
  };
}

export function surfaceTopologyForEditedCellTopology(topology?: CellTopology): PrimitiveSurfaceTopology {
  return surfaceTopologyFromCellTopology(topology) ?? emptySurfaceTopology();
}

function dimensionMajorValue(data: Float32Array, vertexCount: number, dimension: number, vertex: number, axis: number) {
  return data[(axis * vertexCount) + vertex] ?? 0;
}

function projectFaceToLocal2D(
  data: Float32Array,
  vertexCount: number,
  dimension: number,
  vertices: number[],
) {
  if (dimension <= 1 || vertices.length < 3) return undefined;
  const origin = vertices[0];
  const u = new Float64Array(dimension);
  const v = new Float64Array(dimension);
  let uLengthSq = 0;

  for (let idx = 1; idx < vertices.length && uLengthSq <= 1e-16; idx++) {
    const vertex = vertices[idx];
    uLengthSq = 0;
    for (let axis = 0; axis < dimension; axis++) {
      const delta = dimensionMajorValue(data, vertexCount, dimension, vertex, axis)
        - dimensionMajorValue(data, vertexCount, dimension, origin, axis);
      u[axis] = delta;
      uLengthSq += delta * delta;
    }
  }
  if (uLengthSq <= 1e-16) return undefined;
  const uLength = Math.sqrt(uLengthSq);
  for (let axis = 0; axis < dimension; axis++) u[axis] /= uLength;

  let vLengthSq = 0;
  for (let idx = 1; idx < vertices.length && vLengthSq <= 1e-16; idx++) {
    const vertex = vertices[idx];
    let dotU = 0;
    for (let axis = 0; axis < dimension; axis++) {
      dotU += (dimensionMajorValue(data, vertexCount, dimension, vertex, axis)
        - dimensionMajorValue(data, vertexCount, dimension, origin, axis)) * u[axis];
    }
    vLengthSq = 0;
    for (let axis = 0; axis < dimension; axis++) {
      const delta = dimensionMajorValue(data, vertexCount, dimension, vertex, axis)
        - dimensionMajorValue(data, vertexCount, dimension, origin, axis);
      const component = delta - (dotU * u[axis]);
      v[axis] = component;
      vLengthSq += component * component;
    }
  }
  if (vLengthSq <= 1e-16) return undefined;
  const vLength = Math.sqrt(vLengthSq);
  for (let axis = 0; axis < dimension; axis++) v[axis] /= vLength;

  return vertices.map(vertex => {
    let x = 0;
    let y = 0;
    for (let axis = 0; axis < dimension; axis++) {
      const delta = dimensionMajorValue(data, vertexCount, dimension, vertex, axis)
        - dimensionMajorValue(data, vertexCount, dimension, origin, axis);
      x += delta * u[axis];
      y += delta * v[axis];
    }
    return { x, y };
  });
}

function signedPolygonArea2(points: Array<{ x: number; y: number }>, polygon: number[]) {
  let area = 0;
  for (let i = 0; i < polygon.length; i++) {
    const a = points[polygon[i]];
    const b = points[polygon[(i + 1) % polygon.length]];
    area += (a.x * b.y) - (b.x * a.y);
  }
  return area;
}

function cross2(a: { x: number; y: number }, b: { x: number; y: number }, c: { x: number; y: number }) {
  return ((b.x - a.x) * (c.y - a.y)) - ((b.y - a.y) * (c.x - a.x));
}

function pointInTriangle2D(
  point: { x: number; y: number },
  a: { x: number; y: number },
  b: { x: number; y: number },
  c: { x: number; y: number },
) {
  const c1 = cross2(a, b, point);
  const c2 = cross2(b, c, point);
  const c3 = cross2(c, a, point);
  const hasNegative = c1 < -1e-9 || c2 < -1e-9 || c3 < -1e-9;
  const hasPositive = c1 > 1e-9 || c2 > 1e-9 || c3 > 1e-9;
  return !(hasNegative && hasPositive);
}

function triangulateProjectedPolygon(points: Array<{ x: number; y: number }>) {
  if (points.length < 3) return undefined;
  if (points.length === 3) return [[0, 1, 2]];
  const polygon = points.map((_point, index) => index);
  const area = signedPolygonArea2(points, polygon);
  if (Math.abs(area) <= 1e-12) return undefined;
  const ccw = area > 0;
  const triangles: number[][] = [];
  let guard = 0;

  while (polygon.length > 3 && guard++ < points.length * points.length) {
    let earIndex = -1;
    for (let i = 0; i < polygon.length; i++) {
      const prev = polygon[(i - 1 + polygon.length) % polygon.length];
      const curr = polygon[i];
      const next = polygon[(i + 1) % polygon.length];
      const turn = cross2(points[prev], points[curr], points[next]);
      if (ccw ? turn <= 1e-10 : turn >= -1e-10) continue;

      let containsPoint = false;
      for (const candidate of polygon) {
        if (candidate === prev || candidate === curr || candidate === next) continue;
        if (pointInTriangle2D(points[candidate], points[prev], points[curr], points[next])) {
          containsPoint = true;
          break;
        }
      }
      if (containsPoint) continue;
      earIndex = i;
      triangles.push(ccw ? [prev, curr, next] : [prev, next, curr]);
      break;
    }

    if (earIndex < 0) return undefined;
    polygon.splice(earIndex, 1);
  }

  if (polygon.length === 3) {
    triangles.push(ccw ? [polygon[0], polygon[1], polygon[2]] : [polygon[0], polygon[2], polygon[1]]);
  }
  return triangles.length ? triangles : undefined;
}

export function surfaceTopologyFromPositionedCellTopology(
  topology: CellTopology | undefined,
  data: Float32Array,
  vertexCount: number,
): PrimitiveSurfaceTopology | undefined {
  if (!topology || vertexCount <= 0) return undefined;
  const dimension = Math.floor(data.length / vertexCount);
  if (dimension <= 0) return undefined;

  const triangles: number[] = [];
  const facetIds: number[] = [];
  const faceCount = cellCount(topology, 2);
  for (let faceId = 0; faceId < faceCount; faceId++) {
    const seen = new Set<number>();
    const face = getCellVertices(topology, 2, faceId).filter(vertex => {
      if (vertex < 0 || vertex >= vertexCount || seen.has(vertex)) return false;
      seen.add(vertex);
      return true;
    });
    if (face.length < 3) continue;
    if (face.length === 3) {
      triangles.push(face[0], face[1], face[2]);
      facetIds.push(faceId & 0xffff);
      continue;
    }

    const projected = projectFaceToLocal2D(data, vertexCount, dimension, face);
    const localTriangles = projected ? triangulateProjectedPolygon(projected) : undefined;
    if (localTriangles) {
      for (const triangle of localTriangles) {
        triangles.push(face[triangle[0]], face[triangle[1]], face[triangle[2]]);
        facetIds.push(faceId & 0xffff);
      }
      continue;
    }

    for (let i = 1; i < face.length - 1; i++) {
      triangles.push(face[0], face[i], face[i + 1]);
      facetIds.push(faceId & 0xffff);
    }
  }

  if (triangles.length < 3 || facetIds.length * 3 !== triangles.length) return undefined;
  return {
    triangles: new Uint32Array(triangles),
    facetIds: new Uint16Array(facetIds),
  };
}

export function shouldPackCellTopology(
  kind: PrimitiveKind,
  source: DataSource | undefined,
  topology?: CellTopology,
) {
  if (!topology) return false;
  if (source === 'custom' || kind === 'productMesh') return true;

  const generated = topology.generatedKind;
  if (!generated || generated === 'fallback') return false;
  if (generated === kind) return false;
  if (kind === 'plane' && generated === 'polygon') return false;
  if (kind === 'duoprism' && generated === 'polygon') return false;
  return true;
}

export function packCellTopologyForUrl(
  kind: PrimitiveKind,
  source: DataSource | undefined,
  topology?: CellTopology,
): PackedCellTopology | undefined {
  if (!shouldPackCellTopology(kind, source, topology)) return undefined;
  if (!topology) return undefined;
  const packed = topology.cells.map(dim => dim ? [packU32(dim.offsets), packU32(dim.vertices)] as PackedTopology : null);
  while (packed.length > 0 && packed[packed.length - 1] === null) packed.pop();
  return packed.length ? packed : undefined;
}

export function unpackCellTopology(topology?: PackedCellTopology): CellTopology | undefined {
  if (!Array.isArray(topology)) return undefined;
  return {
    cells: topology.map(dim => (
      Array.isArray(dim)
        ? { offsets: unpackU32(dim[0]), vertices: unpackU32(dim[1]) }
        : undefined
    )),
    generatedKind: 'edited',
  };
}

export function deriveCellTopologyForGeometry(
  kind: PrimitiveKind,
  originalN: number,
  vertexCount: number,
  edges: Uint32Array,
  surfaceTopology?: PrimitiveSurfaceTopology,
  cellTopology?: CellTopology,
) {
  return cloneCellTopology(cellTopology)
    ?? buildGeneratedCellTopology(kind, originalN, vertexCount, edges, surfaceTopology);
}
