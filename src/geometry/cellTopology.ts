import type { PrimitiveKind, PrimitiveSurfaceTopology } from './primitives';

export type GeneratedCellTopologyKind = PrimitiveKind | 'fallback' | 'segment' | 'polygon';

export type CellTopologyDim = {
  offsets: Uint32Array;
  vertices: Uint32Array;
};

export type CellTopology = {
  cells: Array<CellTopologyDim | undefined>;
  generatedKind?: GeneratedCellTopologyKind;
  sourceDimension?: number;
};

export type ProductCellTopologyFactor = {
  vertexCount: number;
  cellTopology?: CellTopology;
};

export type ProductCellTopologyLimits = {
  maxCells?: number;
  maxVertexRefs?: number;
  generatedKind?: GeneratedCellTopologyKind;
};

const DEFAULT_PRODUCT_TOPOLOGY_MAX_CELLS = 250000;
const DEFAULT_PRODUCT_TOPOLOGY_MAX_VERTEX_REFS = 2000000;

function makeCellDim(cells: number[][]): CellTopologyDim {
  const offsets = new Uint32Array(cells.length + 1);
  let total = 0;
  for (let i = 0; i < cells.length; i++) {
    offsets[i] = total;
    total += cells[i].length;
  }
  offsets[cells.length] = total;

  const vertices = new Uint32Array(total);
  let write = 0;
  for (const cell of cells) {
    for (const vertex of cell) vertices[write++] = vertex;
  }
  return { offsets, vertices };
}

function vertexCells(vertexCount: number) {
  const offsets = new Uint32Array(vertexCount + 1);
  const vertices = new Uint32Array(vertexCount);
  for (let i = 0; i < vertexCount; i++) {
    offsets[i] = i;
    vertices[i] = i;
  }
  offsets[vertexCount] = vertexCount;
  return { offsets, vertices };
}

function edgeCells(edges: Uint32Array) {
  const cells: number[][] = [];
  for (let i = 0; i < edges.length; i += 2) cells.push([edges[i], edges[i + 1]]);
  return makeCellDim(cells);
}

function combinations(count: number, choose: number): number[][] {
  const result: number[][] = [];
  const current: number[] = [];
  const walk = (start: number) => {
    if (current.length === choose) {
      result.push([...current]);
      return;
    }
    for (let i = start; i <= count - (choose - current.length); i++) {
      current.push(i);
      walk(i + 1);
      current.pop();
    }
  };
  walk(0);
  return result;
}

function isHypercubeGraph(vertexCount: number, dimension: number, edges: Uint32Array) {
  if (dimension < 0 || dimension > 30 || vertexCount !== (1 << dimension)) return false;
  if ((edges.length / 2) !== (vertexCount * dimension) / 2) return false;
  const degree = new Uint16Array(vertexCount);
  for (let i = 0; i < edges.length; i += 2) {
    const a = edges[i];
    const b = edges[i + 1];
    if (a >= vertexCount || b >= vertexCount || a === b) return false;
    const diff = a ^ b;
    if (diff === 0 || (diff & (diff - 1)) !== 0) return false;
    degree[a]++;
    degree[b]++;
  }
  for (let vertex = 0; vertex < vertexCount; vertex++) {
    if (degree[vertex] !== dimension) return false;
  }
  return true;
}

function isSimplexGraph(vertexCount: number, dimension: number, edges: Uint32Array) {
  if (dimension < 1 || vertexCount !== dimension + 1) return false;
  if ((edges.length / 2) !== (vertexCount * (vertexCount - 1)) / 2) return false;
  const seen = new Set<string>();
  for (let i = 0; i < edges.length; i += 2) {
    const a = edges[i];
    const b = edges[i + 1];
    if (a >= vertexCount || b >= vertexCount || a === b) return false;
    seen.add(a < b ? `${a}:${b}` : `${b}:${a}`);
  }
  return seen.size === edges.length / 2;
}

function orderedHypercubeCellVertices(fixedMask: number, freeAxes: number[]) {
  if (freeAxes.length === 2) {
    const [a, b] = freeAxes;
    return [fixedMask, fixedMask | (1 << a), fixedMask | (1 << a) | (1 << b), fixedMask | (1 << b)];
  }

  const vertices: number[] = [];
  const count = 1 << freeAxes.length;
  for (let selector = 0; selector < count; selector++) {
    let vertex = fixedMask;
    for (let i = 0; i < freeAxes.length; i++) {
      if ((selector & (1 << i)) !== 0) vertex |= 1 << freeAxes[i];
    }
    vertices.push(vertex);
  }
  return vertices;
}

export function cloneCellTopology(topology?: CellTopology): CellTopology | undefined {
  if (!topology) return undefined;
  return {
    cells: topology.cells.map(dim => dim ? {
      offsets: new Uint32Array(dim.offsets),
      vertices: new Uint32Array(dim.vertices),
    } : undefined),
    generatedKind: topology.generatedKind,
    sourceDimension: topology.sourceDimension,
  };
}

export function cellCount(topology: CellTopology | undefined, dimension: number) {
  const dim = topology?.cells[dimension];
  return dim ? Math.max(0, dim.offsets.length - 1) : 0;
}

export function maxCellDimension(topology?: CellTopology) {
  if (!topology) return 0;
  for (let dim = topology.cells.length - 1; dim >= 0; dim--) {
    if (cellCount(topology, dim) > 0) return dim;
  }
  return 0;
}

export function getCellVertices(topology: CellTopology | undefined, dimension: number, cellId: number) {
  const dim = topology?.cells[dimension];
  if (!dim || cellId < 0 || cellId >= dim.offsets.length - 1) return [];
  const start = dim.offsets[cellId];
  const end = dim.offsets[cellId + 1];
  return Array.from(dim.vertices.subarray(start, end));
}

export function buildCellTopologyFromEdgesAndSurface(
  vertexCount: number,
  edges: Uint32Array,
  surfaceTopology?: PrimitiveSurfaceTopology,
): CellTopology {
  return {
    cells: [
      vertexCells(vertexCount),
      edgeCells(edges),
      surfaceTopologyToCellDim(surfaceTopology),
    ],
    generatedKind: 'fallback',
  };
}

export function buildHypercubeCellTopology(dimension: number): CellTopology {
  const cells: Array<CellTopologyDim | undefined> = [vertexCells(1 << dimension)];
  const axes = Array.from({ length: dimension }, (_v, idx) => idx);

  for (let cellDim = 1; cellDim <= dimension; cellDim++) {
    const dimCells: number[][] = [];
    for (const freeAxes of combinations(dimension, cellDim)) {
      const free = new Set(freeAxes);
      const fixedAxes = axes.filter(axis => !free.has(axis));
      const fixedCount = 1 << fixedAxes.length;
      for (let fixedSelector = 0; fixedSelector < fixedCount; fixedSelector++) {
        let fixedMask = 0;
        for (let i = 0; i < fixedAxes.length; i++) {
          if ((fixedSelector & (1 << i)) !== 0) fixedMask |= 1 << fixedAxes[i];
        }
        dimCells.push(orderedHypercubeCellVertices(fixedMask, freeAxes));
      }
    }
    cells[cellDim] = makeCellDim(dimCells);
  }

  return { cells, generatedKind: 'hypercube', sourceDimension: dimension };
}

export function buildSimplexCellTopology(dimension: number): CellTopology {
  const vertexCount = dimension + 1;
  const cells: Array<CellTopologyDim | undefined> = [vertexCells(vertexCount)];
  for (let cellDim = 1; cellDim <= dimension; cellDim++) {
    cells[cellDim] = makeCellDim(combinations(vertexCount, cellDim + 1));
  }
  return { cells, generatedKind: 'simplex', sourceDimension: dimension };
}

export function buildSegmentCellTopology(): CellTopology {
  return {
    cells: [
      vertexCells(2),
      makeCellDim([[0, 1]]),
    ],
    generatedKind: 'segment',
    sourceDimension: 1,
  };
}

export function buildPolygonCellTopology(vertexCount: number): CellTopology {
  const edges: number[][] = [];
  for (let vertex = 0; vertex < vertexCount; vertex++) edges.push([vertex, (vertex + 1) % vertexCount]);
  return {
    cells: [
      vertexCells(vertexCount),
      makeCellDim(edges),
      vertexCount >= 3 ? makeCellDim([Array.from({ length: vertexCount }, (_v, idx) => idx)]) : undefined,
    ],
    generatedKind: 'polygon',
    sourceDimension: 2,
  };
}

export function buildCrossPolytopeCellTopology(dimension: number): CellTopology {
  const vertexCount = 2 * dimension;
  const cells: Array<CellTopologyDim | undefined> = [vertexCells(vertexCount)];
  const axes = Array.from({ length: dimension }, (_v, idx) => idx);

  for (let cellDim = 1; cellDim < dimension; cellDim++) {
    const dimCells: number[][] = [];
    for (const selectedAxes of combinations(dimension, cellDim + 1)) {
      const signCount = 1 << selectedAxes.length;
      for (let signMask = 0; signMask < signCount; signMask++) {
        dimCells.push(selectedAxes.map((axis, idx) => (axis * 2) + (((signMask >> idx) & 1) ? 1 : 0)));
      }
    }
    cells[cellDim] = makeCellDim(dimCells);
  }

  if (dimension >= 1) {
    cells[dimension] = makeCellDim([axes.flatMap(axis => [axis * 2, (axis * 2) + 1])]);
  }

  return { cells, generatedKind: 'cross', sourceDimension: dimension };
}

export function buildSimplexPrismCellTopology(dimension: number): CellTopology | undefined {
  const baseDimension = Math.max(2, dimension - 1);
  const baseVertexCount = baseDimension + 1;
  return buildProductCellTopology(
    [
      { vertexCount: baseVertexCount, cellTopology: buildSimplexCellTopology(baseDimension) },
      { vertexCount: 2, cellTopology: buildSegmentCellTopology() },
    ],
    new Uint32Array([1, baseVertexCount]),
    { generatedKind: 'simplexPrism' },
  );
}

export function buildDuoprismCellTopology(segmentsA: number, segmentsB: number): CellTopology | undefined {
  return buildProductCellTopology(
    [
      { vertexCount: segmentsA, cellTopology: buildPolygonCellTopology(segmentsA) },
      { vertexCount: segmentsB, cellTopology: buildPolygonCellTopology(segmentsB) },
    ],
    new Uint32Array([segmentsB, 1]),
    { generatedKind: 'duoprism' },
  );
}

export function buildProductCellTopology(
  factors: ProductCellTopologyFactor[],
  strides: Uint32Array,
  limits: ProductCellTopologyLimits = {},
): CellTopology | undefined {
  if (!factors.length || factors.some(factor => !factor.cellTopology)) return undefined;

  const maxCells = limits.maxCells ?? DEFAULT_PRODUCT_TOPOLOGY_MAX_CELLS;
  const maxVertexRefs = limits.maxVertexRefs ?? DEFAULT_PRODUCT_TOPOLOGY_MAX_VERTEX_REFS;
  const factorMaxDims = factors.map(factor => maxCellDimension(factor.cellTopology));
  const totalDimension = factorMaxDims.reduce((sum, dim) => sum + dim, 0);
  const cells: Array<CellTopologyDim | undefined> = [];
  let totalCells = 0;
  let totalVertexRefs = 0;

  const productVerticesFor = (selected: number[][]) => {
    const vertices: number[] = [];
    const walk = (factorIdx: number, index: number) => {
      if (factorIdx >= selected.length) {
        vertices.push(index);
        return;
      }
      const stride = strides[factorIdx] ?? 1;
      for (const vertex of selected[factorIdx]) walk(factorIdx + 1, index + (vertex * stride));
    };
    walk(0, 0);
    return vertices;
  };

  for (let targetDim = 0; targetDim <= totalDimension; targetDim++) {
    const dimCells: number[][] = [];
    const selectedVertices: number[][] = [];

    const walkFactors = (factorIdx: number, remainingDim: number) => {
      if (totalCells > maxCells || totalVertexRefs > maxVertexRefs) return;
      if (factorIdx >= factors.length) {
        if (remainingDim !== 0) return;
        const vertices = productVerticesFor(selectedVertices);
        totalCells++;
        totalVertexRefs += vertices.length;
        if (totalCells <= maxCells && totalVertexRefs <= maxVertexRefs) dimCells.push(vertices);
        return;
      }

      const topology = factors[factorIdx].cellTopology;
      if (!topology) return;
      const maxDim = Math.min(factorMaxDims[factorIdx], remainingDim);
      for (let dim = 0; dim <= maxDim; dim++) {
        const count = cellCount(topology, dim);
        for (let cellId = 0; cellId < count; cellId++) {
          selectedVertices.push(getCellVertices(topology, dim, cellId));
          walkFactors(factorIdx + 1, remainingDim - dim);
          selectedVertices.pop();
          if (totalCells > maxCells || totalVertexRefs > maxVertexRefs) return;
        }
      }
    };

    walkFactors(0, targetDim);
    if (totalCells > maxCells || totalVertexRefs > maxVertexRefs) return undefined;
    cells[targetDim] = dimCells.length ? makeCellDim(dimCells) : undefined;
  }

  return { cells, generatedKind: limits.generatedKind ?? 'productMesh', sourceDimension: totalDimension };
}

export function buildGeneratedCellTopology(
  kind: PrimitiveKind,
  dimension: number,
  vertexCount: number,
  edges: Uint32Array,
  surfaceTopology?: PrimitiveSurfaceTopology,
): CellTopology {
  if (kind === 'hypercube' && isHypercubeGraph(vertexCount, dimension, edges)) {
    return buildHypercubeCellTopology(dimension);
  }
  if (kind === 'simplex' && isSimplexGraph(vertexCount, dimension, edges)) {
    return buildSimplexCellTopology(dimension);
  }
  if (kind === 'cross' && vertexCount === 2 * dimension) {
    return buildCrossPolytopeCellTopology(dimension);
  }
  if (kind === 'simplexPrism' && vertexCount === (Math.max(2, dimension - 1) + 1) * 2) {
    return buildSimplexPrismCellTopology(dimension)
      ?? buildCellTopologyFromEdgesAndSurface(vertexCount, edges, surfaceTopology);
  }
  if (kind === 'duoprism') {
    if (dimension < 4 && vertexCount >= 3) return buildPolygonCellTopology(vertexCount);
    const side = Math.sqrt(vertexCount);
    if (Number.isInteger(side) && side >= 3) {
      return buildDuoprismCellTopology(side, side)
        ?? buildCellTopologyFromEdgesAndSurface(vertexCount, edges, surfaceTopology);
    }
  }
  return buildCellTopologyFromEdgesAndSurface(vertexCount, edges, surfaceTopology);
}

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

function surfaceTopologyToCellDim(topology?: PrimitiveSurfaceTopology): CellTopologyDim | undefined {
  if (!topology || topology.triangles.length < 3 || topology.facetIds.length * 3 !== topology.triangles.length) {
    return undefined;
  }

  const groups = new Map<number, { vertices: number[]; seen: Set<number> }>();
  for (let triangle = 0; triangle < topology.facetIds.length; triangle++) {
    const facetId = topology.facetIds[triangle];
    let group = groups.get(facetId);
    if (!group) {
      group = { vertices: [], seen: new Set() };
      groups.set(facetId, group);
    }
    const offset = triangle * 3;
    for (let i = 0; i < 3; i++) {
      const vertex = topology.triangles[offset + i];
      if (group.seen.has(vertex)) continue;
      group.seen.add(vertex);
      group.vertices.push(vertex);
    }
  }

  const cells = Array.from(groups.entries())
    .sort(([a], [b]) => a - b)
    .map(([, group]) => group.vertices)
    .filter(vertices => vertices.length >= 3);
  return cells.length ? makeCellDim(cells) : undefined;
}
