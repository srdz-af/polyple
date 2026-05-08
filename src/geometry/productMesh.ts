import {
  buildProductCellTopology,
  surfaceTopologyFromCellTopology,
  type CellTopology,
} from './cellTopology';
import type { PrimitiveSurfaceTopology } from './primitives';

export type ProductMeshFactor = {
  verts: Float32Array;
  vertexCount: number;
  dimension: number;
  edges: Uint32Array;
  cellTopology?: CellTopology;
  surfaceTopology?: PrimitiveSurfaceTopology;
};

export type ProductMeshGeometry = {
  verts: Float32Array;
  edges: Uint32Array;
  cellTopology?: CellTopology;
  surfaceTopology?: PrimitiveSurfaceTopology;
  vertexCount: number;
  dimension: number;
};

const MAX_PRODUCT_VERTICES = 50000;
const MAX_PRODUCT_EDGES = 500000;
const MAX_PRODUCT_SURFACE_TRIANGLES = 1000000;

function edgeKey(a: number, b: number) {
  return a < b ? `${a}:${b}` : `${b}:${a}`;
}

function addUniqueEdge(edges: number[], edgeKeys: Set<string>, a: number, b: number) {
  if (a === b) return;
  const key = edgeKey(a, b);
  if (edgeKeys.has(key)) return;
  edgeKeys.add(key);
  edges.push(a, b);
}

function makeTopology(triangles: number[], facetIds: number[]): PrimitiveSurfaceTopology | undefined {
  if (triangles.length < 3 || facetIds.length * 3 !== triangles.length) return undefined;
  return {
    triangles: new Uint32Array(triangles),
    facetIds: new Uint16Array(facetIds),
  };
}

function detectHypercubeDimension(vertexCount: number, edges: Uint32Array) {
  if (vertexCount < 4 || (vertexCount & (vertexCount - 1)) !== 0) return 0;
  const dimension = Math.log2(vertexCount);
  if (!Number.isInteger(dimension) || dimension <= 0) return 0;
  if (edges.length / 2 !== (vertexCount * dimension) / 2) return 0;

  const degree = new Uint16Array(vertexCount);
  for (let i = 0; i < edges.length; i += 2) {
    const a = edges[i];
    const b = edges[i + 1];
    if (a >= vertexCount || b >= vertexCount || a === b) return 0;
    const xor = a ^ b;
    if (xor === 0 || (xor & (xor - 1)) !== 0) return 0;
    degree[a]++;
    degree[b]++;
  }

  for (let v = 0; v < vertexCount; v++) {
    if (degree[v] !== dimension) return 0;
  }
  return dimension;
}

function hypercubeSurfaceTopology(vertexCount: number, edges: Uint32Array) {
  const dimension = detectHypercubeDimension(vertexCount, edges);
  if (dimension <= 0 || dimension > 30) return undefined;

  const triangles: number[] = [];
  const facetIds: number[] = [];
  let facetId = 0;
  for (let axisA = 0; axisA < dimension; axisA++) {
    for (let axisB = axisA + 1; axisB < dimension; axisB++) {
      const bitA = 1 << axisA;
      const bitB = 1 << axisB;
      for (let base = 0; base < vertexCount; base++) {
        if ((base & bitA) !== 0 || (base & bitB) !== 0) continue;
        const v00 = base;
        const v10 = base | bitA;
        const v01 = base | bitB;
        const v11 = base | bitA | bitB;
        triangles.push(v00, v10, v11, v00, v11, v01);
        facetIds.push(facetId, facetId);
        facetId++;
      }
    }
  }

  return makeTopology(triangles, facetIds);
}

function completeGraphTriangleTopology(vertexCount: number, edges: Uint32Array) {
  const edgeKeys = new Set<string>();
  for (let i = 0; i < edges.length; i += 2) edgeKeys.add(edgeKey(edges[i], edges[i + 1]));

  const triangles: number[] = [];
  const facetIds: number[] = [];
  let facetId = 0;
  for (let a = 0; a < vertexCount; a++) {
    for (let b = a + 1; b < vertexCount; b++) {
      if (!edgeKeys.has(edgeKey(a, b))) continue;
      for (let c = b + 1; c < vertexCount; c++) {
        if (!edgeKeys.has(edgeKey(a, c)) || !edgeKeys.has(edgeKey(b, c))) continue;
        triangles.push(a, b, c);
        facetIds.push(facetId++);
      }
    }
  }

  return makeTopology(triangles, facetIds);
}

function factorTopology(factor: ProductMeshFactor) {
  return factor.surfaceTopology
    ?? hypercubeSurfaceTopology(factor.vertexCount, factor.edges)
    ?? completeGraphTriangleTopology(factor.vertexCount, factor.edges);
}

function buildStrides(factors: ProductMeshFactor[]) {
  const strides = new Uint32Array(factors.length);
  let stride = 1;
  for (let i = 0; i < factors.length; i++) {
    strides[i] = stride;
    stride *= factors[i].vertexCount;
  }
  return strides;
}

function productIndex(indices: number[], strides: Uint32Array) {
  let idx = 0;
  for (let i = 0; i < indices.length; i++) idx += indices[i] * strides[i];
  return idx;
}

function iterateContexts(
  factors: ProductMeshFactor[],
  skipped: Set<number>,
  callback: (indices: number[]) => void,
) {
  const indices = new Array<number>(factors.length).fill(0);
  const walk = (factorIdx: number) => {
    if (factorIdx >= factors.length) {
      callback(indices);
      return;
    }

    if (skipped.has(factorIdx)) {
      walk(factorIdx + 1);
      return;
    }

    for (let v = 0; v < factors[factorIdx].vertexCount; v++) {
      indices[factorIdx] = v;
      walk(factorIdx + 1);
    }
  };

  walk(0);
}

function buildProductVertices(factors: ProductMeshFactor[], strides: Uint32Array, vertexCount: number, dimension: number) {
  const verts = new Float32Array(dimension * vertexCount);
  const dimensionOffsets = new Uint16Array(factors.length);
  let dimOffset = 0;
  for (let f = 0; f < factors.length; f++) {
    dimensionOffsets[f] = dimOffset;
    dimOffset += factors[f].dimension;
  }

  for (let productVertex = 0; productVertex < vertexCount; productVertex++) {
    for (let f = 0; f < factors.length; f++) {
      const factor = factors[f];
      const sourceVertex = Math.floor(productVertex / strides[f]) % factor.vertexCount;
      const targetDimOffset = dimensionOffsets[f];
      for (let d = 0; d < factor.dimension; d++) {
        verts[(targetDimOffset + d) * vertexCount + productVertex] = factor.verts[d * factor.vertexCount + sourceVertex];
      }
    }
  }

  return verts;
}

function buildProductEdges(factors: ProductMeshFactor[], strides: Uint32Array) {
  const edges: number[] = [];
  const edgeKeys = new Set<string>();

  for (let factorIdx = 0; factorIdx < factors.length; factorIdx++) {
    const factor = factors[factorIdx];
    iterateContexts(factors, new Set([factorIdx]), indices => {
      for (let e = 0; e < factor.edges.length; e += 2) {
        indices[factorIdx] = factor.edges[e];
        const a = productIndex(indices, strides);
        indices[factorIdx] = factor.edges[e + 1];
        const b = productIndex(indices, strides);
        addUniqueEdge(edges, edgeKeys, a, b);
      }
    });
  }

  return new Uint32Array(edges);
}

function estimateProductEdgeCount(factors: ProductMeshFactor[], vertexCount: number) {
  return factors.reduce((sum, factor) => (
    sum + ((factor.edges.length / 2) * (vertexCount / factor.vertexCount))
  ), 0);
}

function estimateProductSurfaceTriangleCount(factors: ProductMeshFactor[], vertexCount: number) {
  let count = 0;
  const factorEdgeCounts = factors.map(factor => factor.edges.length / 2);

  factors.forEach((factor, factorIdx) => {
    const topology = factorTopology(factor);
    if (topology) count += (topology.triangles.length / 3) * (vertexCount / factor.vertexCount);
  });

  for (let a = 0; a < factors.length; a++) {
    for (let b = a + 1; b < factors.length; b++) {
      const contextCount = vertexCount / (factors[a].vertexCount * factors[b].vertexCount);
      count += factorEdgeCounts[a] * factorEdgeCounts[b] * contextCount * 2;
    }
  }

  return count;
}

function buildProductSurfaceTopology(factors: ProductMeshFactor[], strides: Uint32Array) {
  const triangles: number[] = [];
  const facetIds: number[] = [];
  let facetId = 0;

  factors.forEach((factor, factorIdx) => {
    const topology = factorTopology(factor);
    if (!topology) return;

    iterateContexts(factors, new Set([factorIdx]), indices => {
      for (let t = 0; t < topology.triangles.length; t += 3) {
        indices[factorIdx] = topology.triangles[t];
        const a = productIndex(indices, strides);
        indices[factorIdx] = topology.triangles[t + 1];
        const b = productIndex(indices, strides);
        indices[factorIdx] = topology.triangles[t + 2];
        const c = productIndex(indices, strides);
        triangles.push(a, b, c);
        facetIds.push(facetId++);
      }
    });
  });

  for (let factorA = 0; factorA < factors.length; factorA++) {
    for (let factorB = factorA + 1; factorB < factors.length; factorB++) {
      const edgesA = factors[factorA].edges;
      const edgesB = factors[factorB].edges;
      iterateContexts(factors, new Set([factorA, factorB]), indices => {
        for (let ea = 0; ea < edgesA.length; ea += 2) {
          for (let eb = 0; eb < edgesB.length; eb += 2) {
            indices[factorA] = edgesA[ea];
            indices[factorB] = edgesB[eb];
            const v00 = productIndex(indices, strides);
            indices[factorA] = edgesA[ea + 1];
            const v10 = productIndex(indices, strides);
            indices[factorB] = edgesB[eb + 1];
            const v11 = productIndex(indices, strides);
            indices[factorA] = edgesA[ea];
            const v01 = productIndex(indices, strides);
            triangles.push(v00, v10, v11, v00, v11, v01);
            facetIds.push(facetId, facetId);
            facetId++;
          }
        }
      });
    }
  }

  return makeTopology(triangles, facetIds);
}

export function buildProductMesh(factors: ProductMeshFactor[], maxDimension: number): ProductMeshGeometry {
  if (factors.length < 2) throw new Error('Select at least two objects.');
  const dimension = factors.reduce((sum, factor) => sum + factor.dimension, 0);
  if (dimension > maxDimension) {
    throw new Error(`Product dimension is ${dimension}D, but the current limit is ${maxDimension}D.`);
  }

  let vertexCount = 1;
  for (const factor of factors) {
    if (factor.dimension <= 0 || factor.vertexCount <= 0) throw new Error('Selected objects must have geometry.');
    vertexCount *= factor.vertexCount;
    if (vertexCount > MAX_PRODUCT_VERTICES) {
      throw new Error(`Product would create ${vertexCount.toLocaleString()} vertices; limit is ${MAX_PRODUCT_VERTICES.toLocaleString()}.`);
    }
  }

  const edgeCount = estimateProductEdgeCount(factors, vertexCount);
  if (edgeCount > MAX_PRODUCT_EDGES) {
    throw new Error(`Product would create ${Math.ceil(edgeCount).toLocaleString()} edges; limit is ${MAX_PRODUCT_EDGES.toLocaleString()}.`);
  }

  const surfaceTriangleCount = estimateProductSurfaceTriangleCount(factors, vertexCount);
  if (surfaceTriangleCount > MAX_PRODUCT_SURFACE_TRIANGLES) {
    throw new Error(`Product would create ${Math.ceil(surfaceTriangleCount).toLocaleString()} surface triangles; limit is ${MAX_PRODUCT_SURFACE_TRIANGLES.toLocaleString()}.`);
  }

  const strides = buildStrides(factors);
  const cellTopology = buildProductCellTopology(factors, strides, { generatedKind: 'productMesh' });
  return {
    verts: buildProductVertices(factors, strides, vertexCount, dimension),
    edges: buildProductEdges(factors, strides),
    cellTopology,
    surfaceTopology: surfaceTopologyFromCellTopology(cellTopology) ?? buildProductSurfaceTopology(factors, strides),
    vertexCount,
    dimension,
  };
}
