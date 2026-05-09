import type { PrimitiveKind, PrimitiveSurfaceTopology } from './primitives';

export type GeneratedCellTopologyKind = PrimitiveKind | 'fallback' | 'segment' | 'polygon' | 'edited';

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

export type DeleteCellAndPruneResult = {
  topology: CellTopology;
  vertexMap: Int32Array;
  vertexCount: number;
  removedVertexCount: number;
  edges: Uint32Array;
};

export type ExtrudeCellResult = {
  topology: CellTopology;
  vertexCount: number;
  edges: Uint32Array;
  sourceVertices: number[];
  capVertices: number[];
  capCellId: number;
  extrudedCellId: number;
};

export type BevelVertexCut = {
  vertex: number;
  neighbors: number[];
  weights: number[];
};

export type BevelVertexResult = {
  topology: CellTopology;
  vertexMap: Int32Array;
  vertexCount: number;
  edges: Uint32Array;
  cuts: BevelVertexCut[];
  capCellId: number;
  smoothness: number;
};

const DEFAULT_PRODUCT_TOPOLOGY_MAX_CELLS = 250000;
const DEFAULT_PRODUCT_TOPOLOGY_MAX_VERTEX_REFS = 2000000;
const boundaryFaceCache = new WeakMap<CellTopology, Map<number, Map<number, number[]>>>();

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

export function getCellBoundaryFaceIds(topology: CellTopology | undefined, dimension: number, cellId: number) {
  if (!topology || dimension < 2 || cellId < 0) return [];
  const faceCount = cellCount(topology, 2);
  if (dimension === 2) return cellId < faceCount ? [cellId] : [];
  if (faceCount <= 0 || cellId >= cellCount(topology, dimension)) return [];

  let topologyCache = boundaryFaceCache.get(topology);
  if (!topologyCache) {
    topologyCache = new Map();
    boundaryFaceCache.set(topology, topologyCache);
  }

  let dimensionCache = topologyCache.get(dimension);
  if (!dimensionCache) {
    dimensionCache = new Map();
    topologyCache.set(dimension, dimensionCache);
  }

  const cached = dimensionCache.get(cellId);
  if (cached) return cached;

  const selected = new Set(getCellVertices(topology, dimension, cellId));
  const faceIds: number[] = [];
  for (let faceId = 0; faceId < faceCount; faceId++) {
    const face = getCellVertices(topology, 2, faceId);
    if (face.length >= 3 && face.every(vertex => selected.has(vertex))) {
      faceIds.push(faceId);
    }
  }
  dimensionCache.set(cellId, faceIds);
  return faceIds;
}

function cellVerticesForMutation(topology: CellTopology, dimension: number) {
  const count = cellCount(topology, dimension);
  const cells: number[][] = [];
  for (let cellId = 0; cellId < count; cellId++) cells.push(getCellVertices(topology, dimension, cellId));
  return cells;
}

function containsAllVertices(cell: number[], selected: Set<number>) {
  for (const vertex of selected) {
    if (!cell.includes(vertex)) return false;
  }
  return true;
}

function isSubsetCell(cell: number[], parent: Set<number>) {
  return cell.every(vertex => parent.has(vertex));
}

function sortedCellSignature(cell: number[]) {
  return [...cell].sort((a, b) => a - b).join(':');
}

function pushUniqueCell(cells: number[][], cell: number[], signatures?: Set<string>) {
  if (!cell.length) return -1;
  if (new Set(cell).size !== cell.length) return -1;
  if (signatures) {
    const signature = sortedCellSignature(cell);
    if (signatures.has(signature)) return -1;
    signatures.add(signature);
  }
  cells.push(cell);
  return cells.length - 1;
}

function referencedByHigherCell(
  cell: number[],
  cellsByDim: number[][][],
  finalKeep: boolean[][],
  dimension: number,
  highestDimension: number,
) {
  if (!cell.length) return false;
  for (let higherDim = dimension + 1; higherDim <= highestDimension; higherDim++) {
    const higherCells = cellsByDim[higherDim] ?? [];
    for (let cellId = 0; cellId < higherCells.length; cellId++) {
      if (!finalKeep[higherDim]?.[cellId]) continue;
      if (containsAllVertices(higherCells[cellId], new Set(cell))) return true;
    }
  }
  return false;
}

function edgeListFromCells(edges: number[][] | undefined) {
  if (!edges?.length) return new Uint32Array();
  const packed: number[] = [];
  for (const edge of edges) {
    if (edge.length < 2) continue;
    packed.push(edge[0], edge[1]);
  }
  return new Uint32Array(packed);
}

export function deleteCellAndPrune(
  topology: CellTopology | undefined,
  dimension: number,
  cellId: number,
  vertexCount: number,
): DeleteCellAndPruneResult | undefined {
  if (!topology || vertexCount < 0 || dimension < 0 || cellId < 0) return undefined;
  const targetCount = cellCount(topology, dimension);
  if (cellId >= targetCount) return undefined;

  const highestSourceDimension = Math.max(maxCellDimension(topology), dimension);
  const cellsByDim = Array.from({ length: highestSourceDimension + 1 }, (_entry, dim) => {
    if (dim === 0 && cellCount(topology, 0) <= 0) {
      return Array.from({ length: vertexCount }, (_vertex, vertex) => [vertex]);
    }
    return cellVerticesForMutation(topology, dim);
  });

  const selectedCell = cellsByDim[dimension]?.[cellId];
  if (!selectedCell?.length) return undefined;
  const selectedSet = new Set(selectedCell);
  const keep = cellsByDim.map(cells => cells.map(() => true));
  keep[dimension][cellId] = false;

  for (let dim = dimension + 1; dim < cellsByDim.length; dim++) {
    const cells = cellsByDim[dim];
    for (let idx = 0; idx < cells.length; idx++) {
      if (containsAllVertices(cells[idx], selectedSet)) keep[dim][idx] = false;
    }
  }

  let highestRemainingDimension = -1;
  for (let dim = keep.length - 1; dim >= dimension; dim--) {
    if (keep[dim].some(Boolean)) {
      highestRemainingDimension = dim;
      break;
    }
  }

  const vertexMap = new Int32Array(vertexCount);
  vertexMap.fill(-1);
  if (highestRemainingDimension < 0) {
    return {
      topology: { cells: [vertexCells(0)], generatedKind: 'edited', sourceDimension: topology.sourceDimension },
      vertexMap,
      vertexCount: 0,
      removedVertexCount: vertexCount,
      edges: new Uint32Array(),
    };
  }

  const finalKeep = keep.map(cells => cells.map(() => false));
  finalKeep[highestRemainingDimension] = keep[highestRemainingDimension].slice();
  for (let dim = highestRemainingDimension - 1; dim >= 0; dim--) {
    const cells = cellsByDim[dim];
    for (let idx = 0; idx < cells.length; idx++) {
      if (!keep[dim][idx]) continue;
      finalKeep[dim][idx] = referencedByHigherCell(cells[idx], cellsByDim, finalKeep, dim, highestRemainingDimension);
    }
  }

  const usedVertices = new Set<number>();
  if (highestRemainingDimension === 0) {
    finalKeep[0].forEach((enabled, vertex) => {
      if (enabled && vertex < vertexCount) usedVertices.add(vertex);
    });
  } else {
    for (let dim = 1; dim <= highestRemainingDimension; dim++) {
      const cells = cellsByDim[dim] ?? [];
      for (let idx = 0; idx < cells.length; idx++) {
        if (!finalKeep[dim]?.[idx]) continue;
        cells[idx].forEach(vertex => {
          if (vertex >= 0 && vertex < vertexCount) usedVertices.add(vertex);
        });
      }
    }
  }

  const sortedVertices = Array.from(usedVertices).sort((a, b) => a - b);
  sortedVertices.forEach((oldVertex, newVertex) => {
    vertexMap[oldVertex] = newVertex;
  });

  const newCells: Array<CellTopologyDim | undefined> = [vertexCells(sortedVertices.length)];
  const remappedCellsByDim: number[][][] = [sortedVertices.map((_oldVertex, vertex) => [vertex])];
  for (let dim = 1; dim <= highestRemainingDimension; dim++) {
    const cells = cellsByDim[dim] ?? [];
    const remapped: number[][] = [];
    for (let idx = 0; idx < cells.length; idx++) {
      if (!finalKeep[dim]?.[idx]) continue;
      const cell = cells[idx];
      const next = cell.map(vertex => vertexMap[vertex]).filter(vertex => vertex >= 0);
      if (next.length !== cell.length) continue;
      remapped.push(next);
    }
    remappedCellsByDim[dim] = remapped;
    newCells[dim] = remapped.length ? makeCellDim(remapped) : undefined;
  }

  return {
    topology: {
      cells: newCells,
      generatedKind: 'edited',
      sourceDimension: topology.sourceDimension,
    },
    vertexMap,
    vertexCount: sortedVertices.length,
    removedVertexCount: vertexCount - sortedVertices.length,
    edges: edgeListFromCells(remappedCellsByDim[1]),
  };
}

export function extrudeCell(
  topology: CellTopology | undefined,
  dimension: number,
  cellId: number,
  vertexCount: number,
): ExtrudeCellResult | undefined {
  if (!topology || vertexCount < 0 || dimension < 0 || cellId < 0) return undefined;
  const targetCount = cellCount(topology, dimension);
  if (cellId >= targetCount) return undefined;

  const selectedCell = getCellVertices(topology, dimension, cellId);
  const sourceVertices = selectedCell
    .filter(vertex => Number.isInteger(vertex) && vertex >= 0 && vertex < vertexCount)
    .filter((vertex, index, arr) => arr.indexOf(vertex) === index);
  if (!sourceVertices.length) return undefined;

  const highestSourceDimension = Math.max(maxCellDimension(topology), dimension);
  const highestTargetDimension = Math.max(highestSourceDimension, dimension + 1);
  const selectedSet = new Set(sourceVertices);
  const duplicateOf = new Map<number, number>();
  sourceVertices.forEach((vertex, index) => {
    duplicateOf.set(vertex, vertexCount + index);
  });

  const cellsByDim = Array.from({ length: highestTargetDimension + 1 }, (_entry, dim) => {
    if (dim === 0) return Array.from({ length: vertexCount }, (_vertex, vertex) => [vertex]);
    return dim <= highestSourceDimension ? cellVerticesForMutation(topology, dim) : [];
  });

  const closureCells: number[][][] = Array.from({ length: dimension + 1 }, () => []);
  closureCells[0] = sourceVertices.map(vertex => [vertex]);
  for (let dim = 1; dim <= dimension; dim++) {
    const cells = cellVerticesForMutation(topology, dim);
    const selectedSignature = dim === dimension ? sortedCellSignature(selectedCell) : '';
    let selectedPresent = false;
    for (const cell of cells) {
      if (!cell.length || !cell.every(vertex => selectedSet.has(vertex))) continue;
      closureCells[dim].push(cell);
      if (dim === dimension && sortedCellSignature(cell) === selectedSignature) selectedPresent = true;
    }
    if (dim === dimension && !selectedPresent) closureCells[dim].push(selectedCell);
  }

  sourceVertices.forEach(vertex => {
    cellsByDim[0].push([duplicateOf.get(vertex) ?? vertex]);
  });
  let capCellId = dimension === 0 ? (duplicateOf.get(sourceVertices[0]) ?? -1) : -1;

  for (let dim = 1; dim <= dimension; dim++) {
    const topCells = closureCells[dim]
      .map(cell => cell.map(vertex => duplicateOf.get(vertex) ?? -1))
      .filter(cell => cell.every(vertex => vertex >= 0));
    const targetCells = cellsByDim[dim];
    for (const cell of topCells) {
      const nextId = targetCells.length;
      targetCells.push(cell);
      if (dim === dimension && capCellId < 0) capCellId = nextId;
    }
  }

  let extrudedCellId = -1;
  for (let dim = 0; dim <= dimension; dim++) {
    const targetDim = dim + 1;
    const targetCells = cellsByDim[targetDim];
    const signatures = new Set(targetCells.map(sortedCellSignature));
    for (const cell of closureCells[dim]) {
      const duplicates = cell.map(vertex => duplicateOf.get(vertex) ?? -1);
      if (duplicates.some(vertex => vertex < 0)) continue;
      const prism = cell.length === 1
        ? [cell[0], duplicates[0]]
        : [
            ...cell,
            ...duplicates.slice().reverse(),
          ];
      const nextId = pushUniqueCell(targetCells, prism, signatures);
      if (dim === dimension && nextId >= 0) extrudedCellId = nextId;
    }
  }

  const newCells = cellsByDim.map(cells => cells.length ? makeCellDim(cells) : undefined);
  const capVertices = sourceVertices
    .map(vertex => duplicateOf.get(vertex) ?? -1)
    .filter(vertex => vertex >= 0);
  if (capCellId < 0 || !capVertices.length || extrudedCellId < 0) return undefined;

  return {
    topology: {
      cells: newCells,
      generatedKind: 'edited',
      sourceDimension: topology.sourceDimension,
    },
    vertexCount: vertexCount + sourceVertices.length,
    edges: edgeListFromCells(cellsByDim[1]),
    sourceVertices,
    capVertices,
    capCellId,
    extrudedCellId,
  };
}

export function bevelVertex(
  topology: CellTopology | undefined,
  vertexId: number,
  vertexCount: number,
  smoothness = 1,
): BevelVertexResult | undefined {
  if (!topology || vertexId < 0 || vertexId >= vertexCount) return undefined;

  const incidentNeighbors: number[] = [];
  for (let edgeId = 0; edgeId < cellCount(topology, 1); edgeId++) {
    const edge = getCellVertices(topology, 1, edgeId);
    if (edge.length < 2 || !edge.includes(vertexId)) continue;
    const neighbor = edge[0] === vertexId ? edge[1] : edge[0];
    if (neighbor >= 0 && neighbor < vertexCount && !incidentNeighbors.includes(neighbor)) {
      incidentNeighbors.push(neighbor);
    }
  }
  if (incidentNeighbors.length < 2) return undefined;

  const vertexMap = new Int32Array(vertexCount);
  vertexMap.fill(-1);
  let nextVertex = 0;
  for (let vertex = 0; vertex < vertexCount; vertex++) {
    if (vertex === vertexId) continue;
    vertexMap[vertex] = nextVertex++;
  }

  const layerCount = Math.max(1, Math.min(32, Math.floor(smoothness)));
  const neighborIndexByVertex = new Map<number, number>();
  incidentNeighbors.forEach((neighbor, index) => {
    neighborIndexByVertex.set(neighbor, index);
  });
  const capVertexByKey = new Map<string, number>();
  const cuts: BevelVertexCut[] = [];

  const compositionKey = (weights: number[]) => weights.join(':');
  const capVertex = (weights: number[]) => {
    const key = compositionKey(weights);
    const existing = capVertexByKey.get(key);
    if (typeof existing === 'number') return existing;
    const vertex = nextVertex++;
    capVertexByKey.set(key, vertex);
    const neighbors: number[] = [];
    const normalizedWeights: number[] = [];
    weights.forEach((weight, index) => {
      if (weight <= 0) return;
      neighbors.push(incidentNeighbors[index]);
      normalizedWeights.push(weight / layerCount);
    });
    cuts.push({ vertex, neighbors, weights: normalizedWeights });
    return vertex;
  };

  const weightsFor = (entries: Array<[number, number]>) => {
    const weights = new Array(incidentNeighbors.length).fill(0);
    for (const [neighborIndex, weight] of entries) weights[neighborIndex] = weight;
    return weights;
  };

  const endpointWeights = (neighbor: number) => {
    const index = neighborIndexByVertex.get(neighbor);
    return typeof index === 'number' ? weightsFor([[index, layerCount]]) : null;
  };

  const arcBetween = (fromNeighbor: number, toNeighbor: number) => {
    const from = neighborIndexByVertex.get(fromNeighbor);
    const to = neighborIndexByVertex.get(toNeighbor);
    if (typeof from !== 'number' || typeof to !== 'number') return [];
    const vertices: number[] = [];
    for (let step = 0; step <= layerCount; step++) {
      vertices.push(capVertex(weightsFor([
        [from, layerCount - step],
        [to, step],
      ])));
    }
    return vertices;
  };

  const highestSourceDimension = maxCellDimension(topology);
  const highestCapDimension = Math.min(highestSourceDimension, incidentNeighbors.length - 1);
  const highestTargetDimension = Math.max(highestSourceDimension, highestCapDimension);
  const cellsByDim: number[][][] = Array.from({ length: highestTargetDimension + 1 }, () => []);

  const remapCell = (cell: number[]) => {
    const remapped = cell.map(vertex => vertexMap[vertex]).filter(vertex => vertex >= 0);
    return remapped.length === cell.length ? remapped : [];
  };

  const replacementForFaceVertex = (face: number[], selectedIndex: number) => {
    const prev = face[(selectedIndex - 1 + face.length) % face.length];
    const next = face[(selectedIndex + 1) % face.length];
    return arcBetween(prev, next);
  };

  const replaceFaceVertexWithArc = (face: number[], selectedIndex: number) => {
    const arc = replacementForFaceVertex(face, selectedIndex);
    if (!arc.length) return [];
    const nextCell = [...arc];
    let idx = (selectedIndex + 1) % face.length;
    while (idx !== selectedIndex) {
      const remapped = vertexMap[face[idx]];
      if (remapped >= 0) nextCell.push(remapped);
      idx = (idx + 1) % face.length;
    }
    return nextCell;
  };

  for (let dim = 1; dim <= highestSourceDimension; dim++) {
    const sourceCells = cellVerticesForMutation(topology, dim);
    const targetCells = cellsByDim[dim];
    const signatures = new Set<string>();

    for (const cell of sourceCells) {
      if (!cell.includes(vertexId)) {
        pushUniqueCell(targetCells, remapCell(cell), signatures);
        continue;
      }

      if (dim === 1) {
        const neighbor = cell[0] === vertexId ? cell[1] : cell[0];
        const remappedNeighbor = vertexMap[neighbor];
        const endpoint = endpointWeights(neighbor);
        const cut = endpoint ? capVertex(endpoint) : -1;
        if (cut >= 0 && remappedNeighbor >= 0) pushUniqueCell(targetCells, [cut, remappedNeighbor], signatures);
        continue;
      }

      if (dim === 2) {
        const selectedIndex = cell.indexOf(vertexId);
        pushUniqueCell(targetCells, replaceFaceVertexWithArc(cell, selectedIndex), signatures);
        continue;
      }

      const selected = new Set(cell);
      const nextCell = cell
        .filter(vertex => vertex !== vertexId)
        .map(vertex => vertexMap[vertex])
        .filter(vertex => vertex >= 0);
      for (const neighbor of incidentNeighbors) {
        if (!selected.has(neighbor)) continue;
        const endpoint = endpointWeights(neighbor);
        if (endpoint) nextCell.push(capVertex(endpoint));
      }
      pushUniqueCell(targetCells, nextCell, signatures);
    }
  }

  const capEdgeSignatures = new Set((cellsByDim[1] ?? []).map(sortedCellSignature));
  const addCapEdge = (a: number, b: number) => {
    if (a === b) return;
    pushUniqueCell(cellsByDim[1], [a, b], capEdgeSignatures);
  };
  for (let a = 0; a < incidentNeighbors.length; a++) {
    for (let b = a + 1; b < incidentNeighbors.length; b++) {
      const arc = arcBetween(incidentNeighbors[a], incidentNeighbors[b]);
      for (let idx = 0; idx < arc.length - 1; idx++) addCapEdge(arc[idx], arc[idx + 1]);
    }
  }

  let capCellId = -1;
  if (highestCapDimension >= 2) {
    const faceSignatures = new Set((cellsByDim[2] ?? []).map(sortedCellSignature));
    const tripleVertex = (a: number, b: number, c: number, wa: number, wb: number, wc: number) => (
      capVertex(weightsFor([[a, wa], [b, wb], [c, wc]]))
    );
    for (let a = 0; a < incidentNeighbors.length - 2; a++) {
      for (let b = a + 1; b < incidentNeighbors.length - 1; b++) {
        for (let c = b + 1; c < incidentNeighbors.length; c++) {
          for (let i = 0; i < layerCount; i++) {
            for (let j = 0; j < layerCount - i; j++) {
              const k = layerCount - i - j;
              const va = tripleVertex(a, b, c, i, j, k);
              const vb = tripleVertex(a, b, c, i + 1, j, k - 1);
              const vc = tripleVertex(a, b, c, i, j + 1, k - 1);
              const nextId = pushUniqueCell(cellsByDim[2], [va, vb, vc], faceSignatures);
              if (capCellId < 0 && nextId >= 0) capCellId = nextId;
            }
          }
          for (let i = 0; i < layerCount - 1; i++) {
            for (let j = 0; j < layerCount - i - 1; j++) {
              const k = layerCount - i - j;
              const va = tripleVertex(a, b, c, i + 1, j, k - 1);
              const vb = tripleVertex(a, b, c, i + 1, j + 1, k - 2);
              const vc = tripleVertex(a, b, c, i, j + 1, k - 1);
              pushUniqueCell(cellsByDim[2], [va, vb, vc], faceSignatures);
            }
          }
        }
      }
    }
  }

  cellsByDim[0] = Array.from({ length: nextVertex }, (_entry, vertex) => [vertex]);
  const newCells = cellsByDim.map(cells => cells.length ? makeCellDim(cells) : undefined);
  return {
    topology: {
      cells: newCells,
      generatedKind: 'edited',
      sourceDimension: topology.sourceDimension,
    },
    vertexMap,
    vertexCount: nextVertex,
    edges: edgeListFromCells(cellsByDim[1]),
    cuts,
    capCellId,
    smoothness: layerCount,
  };
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

function cellVerticesByDimension(topology: CellTopology, dimension: number) {
  const count = cellCount(topology, dimension);
  const cells: number[][] = [];
  for (let cellId = 0; cellId < count; cellId++) cells.push(getCellVertices(topology, dimension, cellId));
  return cells;
}

function verticesAreSubset(vertices: number[], parent: Set<number>) {
  return vertices.every(vertex => parent.has(vertex));
}

export function buildSpikedCellTopology(
  baseTopology: CellTopology,
  baseVertexCount: number,
  generatedKind: GeneratedCellTopologyKind,
): CellTopology | undefined {
  const baseDimension = maxCellDimension(baseTopology);
  if (baseDimension < 2) return undefined;

  const boundaryDimension = baseDimension - 1;
  const boundaryCells = cellVerticesByDimension(baseTopology, boundaryDimension);
  if (!boundaryCells.length) return undefined;

  const cells: Array<number[][]> = [];
  for (let dim = 0; dim <= baseDimension; dim++) {
    cells[dim] = cellVerticesByDimension(baseTopology, dim);
  }

  boundaryCells.forEach((boundaryVertices, boundaryId) => {
    const apex = baseVertexCount + boundaryId;
    const boundarySet = new Set(boundaryVertices);
    for (let sourceDim = 0; sourceDim <= boundaryDimension; sourceDim++) {
      for (const sourceVertices of cellVerticesByDimension(baseTopology, sourceDim)) {
        if (!verticesAreSubset(sourceVertices, boundarySet)) continue;
        const targetDim = sourceDim + 1;
        if (!cells[targetDim]) cells[targetDim] = [];
        cells[targetDim].push([apex, ...sourceVertices]);
      }
    }
  });

  return {
    cells: cells.map(dimCells => dimCells?.length ? makeCellDim(dimCells) : undefined),
    generatedKind,
    sourceDimension: baseTopology.sourceDimension ?? baseDimension,
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
  if (kind === 'plane' && vertexCount === 4) {
    return buildPolygonCellTopology(4);
  }
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
  if (kind === 'spikedHypercube') {
    return buildSpikedCellTopology(buildHypercubeCellTopology(dimension), 1 << dimension, kind)
      ?? buildCellTopologyFromEdgesAndSurface(vertexCount, edges, surfaceTopology);
  }
  if (kind === 'spikedCross') {
    return buildSpikedCellTopology(buildCrossPolytopeCellTopology(dimension), 2 * dimension, kind)
      ?? buildCellTopologyFromEdgesAndSurface(vertexCount, edges, surfaceTopology);
  }
  if (kind === 'spikedSimplex') {
    return buildSpikedCellTopology(buildSimplexCellTopology(dimension), dimension + 1, kind)
      ?? buildCellTopologyFromEdgesAndSurface(vertexCount, edges, surfaceTopology);
  }
  if (kind === 'spikedSimplexPrism') {
    const base = buildSimplexPrismCellTopology(dimension);
    const baseVertexCount = (Math.max(2, dimension - 1) + 1) * 2;
    return (base ? buildSpikedCellTopology(base, baseVertexCount, kind) : undefined)
      ?? buildCellTopologyFromEdgesAndSurface(vertexCount, edges, surfaceTopology);
  }
  if (kind === 'spikedDuoprism') {
    const baseVertexCount = dimension < 4 && vertexCount % 2 === 0 ? vertexCount / 2 : 64;
    const base = dimension < 4
      ? buildPolygonCellTopology(Math.max(3, baseVertexCount))
      : buildDuoprismCellTopology(8, 8);
    return (base ? buildSpikedCellTopology(base, baseVertexCount, kind) : undefined)
      ?? buildCellTopologyFromEdgesAndSurface(vertexCount, edges, surfaceTopology);
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
