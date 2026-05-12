import type { PrimitiveKind, PrimitiveSurfaceTopology } from './primitives';
import type {
  BevelEdgeCut,
  BevelEdgeResult,
  BevelFaceBoundaryResult,
  BevelSelectedEdgesResult,
  BevelVertexCut,
  BevelVertexPatch,
  BevelVertexPatchPoint,
  BevelVertexResult,
  CellTopology,
  CellTopologyDim,
  DeleteCellAndPruneResult,
  ExtrudeCellResult,
  ExtrudeCellsResult,
  GeneratedCellTopologyKind,
  InsetCellResult,
  InsetCellsResult,
  ProductCellTopologyFactor,
  ProductCellTopologyLimits,
} from './cellTopologyTypes';

export { surfaceTopologyFromCellTopology } from './cellTopologySurface';
export type {
  BevelEdgeCut,
  BevelEdgeResult,
  BevelFaceBoundaryResult,
  BevelSelectedEdgesResult,
  BevelVertexCut,
  BevelVertexPatch,
  BevelVertexPatchPoint,
  BevelVertexResult,
  CellTopology,
  CellTopologyDim,
  DeleteCellAndPruneResult,
  ExtrudeCellResult,
  ExtrudeCellsResult,
  GeneratedCellTopologyKind,
  InsetCellResult,
  InsetCellsResult,
  ProductCellTopologyFactor,
  ProductCellTopologyLimits,
} from './cellTopologyTypes';

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

function referencedByAnyHigherCell(topology: CellTopology, dimension: number, cell: number[]) {
  if (!cell.length) return false;
  const selected = new Set(cell);
  const highestDimension = maxCellDimension(topology);
  for (let higherDim = dimension + 1; higherDim <= highestDimension; higherDim++) {
    const higherCount = cellCount(topology, higherDim);
    for (let cellId = 0; cellId < higherCount; cellId++) {
      if (containsAllVertices(getCellVertices(topology, higherDim, cellId), selected)) return true;
    }
  }
  return false;
}

function shouldOpenCellOnExtrude(topology: CellTopology, dimension: number, cellId: number, cell: number[]) {
  if (referencedByAnyHigherCell(topology, dimension, cell)) return true;
  if (dimension <= 1 || cellId < 0 || !cell.length) return false;

  const selected = new Set(cell);
  const lowerBoundaryCells = cellVerticesForMutation(topology, dimension - 1)
    .filter(boundary => boundary.length > 0 && isSubsetCell(boundary, selected));
  if (!lowerBoundaryCells.length) return false;

  const sameDimensionCells = cellVerticesForMutation(topology, dimension);
  return lowerBoundaryCells.every(boundary => {
    const boundarySet = new Set(boundary);
    for (let otherCellId = 0; otherCellId < sameDimensionCells.length; otherCellId++) {
      if (otherCellId === cellId) continue;
      if (isSubsetCell(boundary, new Set(sameDimensionCells[otherCellId]))) return true;
      if (containsAllVertices(sameDimensionCells[otherCellId], boundarySet)) return true;
    }
    return false;
  });
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

function addFaceBoundaryEdges(edgeCellsTarget: number[][], edgeSignatures: Set<string>, face: number[]) {
  for (let idx = 0; idx < face.length; idx++) {
    const a = face[idx];
    const b = face[(idx + 1) % face.length];
    if (a === b) continue;
    pushUniqueCell(edgeCellsTarget, [a, b], edgeSignatures);
  }
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
  if (shouldOpenCellOnExtrude(topology, dimension, cellId, selectedCell)) {
    const selectedSignature = sortedCellSignature(selectedCell);
    cellsByDim[dimension] = cellsByDim[dimension].filter((cell, idx) => (
      idx !== cellId && sortedCellSignature(cell) !== selectedSignature
    ));
  }

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

function uniqueValidCellIds(topology: CellTopology, dimension: number, cellIds: number[]) {
  const count = cellCount(topology, dimension);
  return cellIds
    .filter(cellId => Number.isInteger(cellId) && cellId >= 0 && cellId < count)
    .filter((cellId, index, arr) => arr.indexOf(cellId) === index);
}

function selectedCellClosure(topology: CellTopology, dimension: number, selectedCellIds: number[]) {
  const selectedCells = selectedCellIds
    .map(cellId => getCellVertices(topology, dimension, cellId))
    .filter(cell => cell.length > 0);
  const selectedSets = selectedCells.map(cell => new Set(cell));
  const sourceVertices: number[] = [];
  for (const cell of selectedCells) {
    for (const vertex of cell) {
      if (!sourceVertices.includes(vertex)) sourceVertices.push(vertex);
    }
  }

  const closureCells: number[][][] = Array.from({ length: dimension + 1 }, () => []);
  closureCells[0] = sourceVertices.map(vertex => [vertex]);
  for (let dim = 1; dim < dimension; dim++) {
    const cells = cellVerticesForMutation(topology, dim);
    closureCells[dim] = cells.filter(cell => (
      cell.length > 0 && selectedSets.some(selectedSet => isSubsetCell(cell, selectedSet))
    ));
  }
  closureCells[dimension] = selectedCells.map(cell => [...cell]);

  const boundaryCells: number[][][] = Array.from({ length: Math.max(1, dimension) }, () => []);
  if (dimension >= 1) {
    if (dimension === 1) {
      boundaryCells[0] = closureCells[0].filter(cell => (
        selectedSets.filter(selectedSet => isSubsetCell(cell, selectedSet)).length === 1
      ));
    } else {
      boundaryCells[dimension - 1] = closureCells[dimension - 1].filter(cell => (
        selectedSets.filter(selectedSet => isSubsetCell(cell, selectedSet)).length === 1
      ));
      for (let dim = dimension - 2; dim >= 0; dim--) {
        const boundaryParents = boundaryCells[dim + 1].map(cell => new Set(cell));
        boundaryCells[dim] = closureCells[dim].filter(cell => (
          boundaryParents.some(parent => isSubsetCell(cell, parent))
        ));
      }
    }
  }

  return {
    selectedCells,
    sourceVertices,
    closureCells,
    boundaryCells,
  };
}

export function extrudeCells(
  topology: CellTopology | undefined,
  dimension: number,
  cellIds: number[],
  vertexCount: number,
): ExtrudeCellsResult | undefined {
  if (!topology || vertexCount < 0 || dimension < 0) return undefined;
  const selectedCellIds = uniqueValidCellIds(topology, dimension, cellIds);
  if (!selectedCellIds.length) return undefined;
  if (selectedCellIds.length === 1) {
    const extrusion = extrudeCell(topology, dimension, selectedCellIds[0], vertexCount);
    if (!extrusion) return undefined;
    return {
      ...extrusion,
      capCellIds: [extrusion.capCellId],
      extrudedCellIds: [extrusion.extrudedCellId],
    };
  }

  const {
    sourceVertices,
    closureCells,
    boundaryCells,
  } = selectedCellClosure(topology, dimension, selectedCellIds);
  if (!sourceVertices.length) return undefined;

  const highestSourceDimension = Math.max(maxCellDimension(topology), dimension);
  const highestTargetDimension = Math.max(highestSourceDimension, dimension + 1);
  const duplicateOf = new Map<number, number>();
  sourceVertices.forEach((vertex, index) => {
    duplicateOf.set(vertex, vertexCount + index);
  });

  const cellsByDim = Array.from({ length: highestTargetDimension + 1 }, (_entry, dim) => {
    if (dim === 0) return Array.from({ length: vertexCount }, (_vertex, vertex) => [vertex]);
    return dim <= highestSourceDimension ? cellVerticesForMutation(topology, dim) : [];
  });
  const selectedSignaturesToOpen = new Set(
    selectedCellIds.flatMap(cellId => {
      const cell = getCellVertices(topology, dimension, cellId);
      return shouldOpenCellOnExtrude(topology, dimension, cellId, cell)
        ? [sortedCellSignature(cell)]
        : [];
    }),
  );
  if (selectedSignaturesToOpen.size) {
    cellsByDim[dimension] = cellsByDim[dimension].filter(cell => !selectedSignaturesToOpen.has(sortedCellSignature(cell)));
  }

  sourceVertices.forEach(vertex => {
    cellsByDim[0].push([duplicateOf.get(vertex) ?? vertex]);
  });

  const capCellIds: number[] = [];
  for (let dim = 1; dim <= dimension; dim++) {
    const targetCells = cellsByDim[dim];
    const signatures = new Set(targetCells.map(sortedCellSignature));
    for (const cell of closureCells[dim]) {
      const topCell = cell.map(vertex => duplicateOf.get(vertex) ?? -1);
      if (topCell.some(vertex => vertex < 0)) continue;
      const nextId = pushUniqueCell(targetCells, topCell, signatures);
      if (dim === dimension && nextId >= 0) capCellIds.push(nextId);
    }
  }

  const extrudedCellIds: number[] = [];
  for (let dim = 0; dim <= dimension; dim++) {
    const sourceCells = dim === dimension ? closureCells[dimension] : boundaryCells[dim];
    const targetDim = dim + 1;
    const targetCells = cellsByDim[targetDim];
    const signatures = new Set(targetCells.map(sortedCellSignature));
    for (const cell of sourceCells) {
      const duplicates = cell.map(vertex => duplicateOf.get(vertex) ?? -1);
      if (duplicates.some(vertex => vertex < 0)) continue;
      const prism = cell.length === 1
        ? [cell[0], duplicates[0]]
        : [
            ...cell,
            ...duplicates.slice().reverse(),
          ];
      const nextId = pushUniqueCell(targetCells, prism, signatures);
      if (dim === dimension && nextId >= 0) extrudedCellIds.push(nextId);
    }
  }

  const capVertices = sourceVertices
    .map(vertex => duplicateOf.get(vertex) ?? -1)
    .filter(vertex => vertex >= 0);
  if (!capCellIds.length || !capVertices.length || !extrudedCellIds.length) return undefined;

  const newCells = cellsByDim.map(cells => cells.length ? makeCellDim(cells) : undefined);
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
    capCellIds,
    extrudedCellIds,
  };
}

export function insetCell(
  topology: CellTopology | undefined,
  dimension: number,
  cellId: number,
  vertexCount: number,
): InsetCellResult | undefined {
  if (!topology || vertexCount < 0 || dimension < 1 || cellId < 0) return undefined;
  const targetCount = cellCount(topology, dimension);
  if (cellId >= targetCount) return undefined;

  const selectedCell = getCellVertices(topology, dimension, cellId);
  const sourceVertices = selectedCell
    .filter(vertex => Number.isInteger(vertex) && vertex >= 0 && vertex < vertexCount)
    .filter((vertex, index, arr) => arr.indexOf(vertex) === index);
  if (sourceVertices.length < 2) return undefined;

  const highestDimension = Math.max(maxCellDimension(topology), dimension);
  const selectedSet = new Set(sourceVertices);
  const duplicateOf = new Map<number, number>();
  sourceVertices.forEach((vertex, index) => {
    duplicateOf.set(vertex, vertexCount + index);
  });

  const cellsByDim = Array.from({ length: highestDimension + 1 }, (_entry, dim) => {
    if (dim === 0) return Array.from({ length: vertexCount }, (_vertex, vertex) => [vertex]);
    return dim <= highestDimension ? cellVerticesForMutation(topology, dim) : [];
  });

  const selectedSignature = sortedCellSignature(selectedCell);
  cellsByDim[dimension] = cellsByDim[dimension].filter((cell, idx) => (
    idx !== cellId && sortedCellSignature(cell) !== selectedSignature
  ));

  const closureCells: number[][][] = Array.from({ length: dimension + 1 }, () => []);
  closureCells[0] = sourceVertices.map(vertex => [vertex]);
  for (let dim = 1; dim <= dimension; dim++) {
    const cells = cellVerticesForMutation(topology, dim);
    let selectedPresent = false;
    for (const cell of cells) {
      if (!cell.length || !cell.every(vertex => selectedSet.has(vertex))) continue;
      if (dim === dimension && sortedCellSignature(cell) !== selectedSignature) continue;
      closureCells[dim].push(cell);
      if (dim === dimension) selectedPresent = true;
    }
    if (dim === dimension && !selectedPresent) closureCells[dim].push(selectedCell);
  }

  sourceVertices.forEach(vertex => {
    cellsByDim[0].push([duplicateOf.get(vertex) ?? vertex]);
  });

  let insetCellId = -1;
  for (let dim = 1; dim <= dimension; dim++) {
    const targetCells = cellsByDim[dim];
    const signatures = new Set(targetCells.map(sortedCellSignature));
    for (const cell of closureCells[dim]) {
      const inset = cell.map(vertex => duplicateOf.get(vertex) ?? -1);
      if (inset.some(vertex => vertex < 0)) continue;
      const nextId = pushUniqueCell(targetCells, inset, signatures);
      if (dim === dimension && insetCellId < 0) insetCellId = nextId;
    }
  }

  for (let dim = 0; dim < dimension; dim++) {
    const targetDim = dim + 1;
    const targetCells = cellsByDim[targetDim];
    const signatures = new Set(targetCells.map(sortedCellSignature));
    for (const cell of closureCells[dim]) {
      const duplicates = cell.map(vertex => duplicateOf.get(vertex) ?? -1);
      if (duplicates.some(vertex => vertex < 0)) continue;
      const wall = cell.length === 1
        ? [cell[0], duplicates[0]]
        : [
            ...cell,
            ...duplicates.slice().reverse(),
          ];
      pushUniqueCell(targetCells, wall, signatures);
    }
  }

  const newCells = cellsByDim.map(cells => cells.length ? makeCellDim(cells) : undefined);
  const insetVertices = sourceVertices
    .map(vertex => duplicateOf.get(vertex) ?? -1)
    .filter(vertex => vertex >= 0);
  if (insetCellId < 0 || !insetVertices.length) return undefined;

  return {
    topology: {
      cells: newCells,
      generatedKind: 'edited',
      sourceDimension: topology.sourceDimension,
    },
    vertexCount: vertexCount + sourceVertices.length,
    edges: edgeListFromCells(cellsByDim[1]),
    sourceVertices,
    insetVertices,
    insetCellId,
  };
}

export function insetCells(
  topology: CellTopology | undefined,
  dimension: number,
  cellIds: number[],
  vertexCount: number,
): InsetCellsResult | undefined {
  if (!topology || vertexCount < 0 || dimension < 1) return undefined;
  const selectedCellIds = uniqueValidCellIds(topology, dimension, cellIds);
  if (!selectedCellIds.length) return undefined;
  if (selectedCellIds.length === 1) {
    const inset = insetCell(topology, dimension, selectedCellIds[0], vertexCount);
    if (!inset) return undefined;
    return {
      ...inset,
      insetCellIds: [inset.insetCellId],
    };
  }

  const {
    sourceVertices,
    closureCells,
    boundaryCells,
  } = selectedCellClosure(topology, dimension, selectedCellIds);
  if (sourceVertices.length < 2) return undefined;

  const highestDimension = Math.max(maxCellDimension(topology), dimension);
  const duplicateOf = new Map<number, number>();
  sourceVertices.forEach((vertex, index) => {
    duplicateOf.set(vertex, vertexCount + index);
  });

  const selectedSignatures = new Set(selectedCellIds.map(cellId => sortedCellSignature(getCellVertices(topology, dimension, cellId))));
  const internalClosureSignaturesByDim = new Map<number, Set<string>>();
  for (let dim = 1; dim < dimension; dim++) {
    const boundarySignatures = new Set((boundaryCells[dim] ?? []).map(sortedCellSignature));
    const internalSignatures = new Set<string>();
    for (const cell of closureCells[dim] ?? []) {
      const signature = sortedCellSignature(cell);
      if (!boundarySignatures.has(signature)) internalSignatures.add(signature);
    }
    if (internalSignatures.size) internalClosureSignaturesByDim.set(dim, internalSignatures);
  }
  const cellsByDim = Array.from({ length: highestDimension + 1 }, (_entry, dim) => {
    if (dim === 0) return Array.from({ length: vertexCount }, (_vertex, vertex) => [vertex]);
    const cells = dim <= highestDimension ? cellVerticesForMutation(topology, dim) : [];
    if (dim === dimension) return cells.filter(cell => !selectedSignatures.has(sortedCellSignature(cell)));
    const internalSignatures = internalClosureSignaturesByDim.get(dim);
    return internalSignatures
      ? cells.filter(cell => !internalSignatures.has(sortedCellSignature(cell)))
      : cells;
  });

  sourceVertices.forEach(vertex => {
    cellsByDim[0].push([duplicateOf.get(vertex) ?? vertex]);
  });

  const insetCellIds: number[] = [];
  for (let dim = 1; dim <= dimension; dim++) {
    const targetCells = cellsByDim[dim];
    const signatures = new Set(targetCells.map(sortedCellSignature));
    for (const cell of closureCells[dim]) {
      const inset = cell.map(vertex => duplicateOf.get(vertex) ?? -1);
      if (inset.some(vertex => vertex < 0)) continue;
      const nextId = pushUniqueCell(targetCells, inset, signatures);
      if (dim === dimension && nextId >= 0) insetCellIds.push(nextId);
    }
  }

  for (let dim = 0; dim < dimension; dim++) {
    const targetDim = dim + 1;
    const targetCells = cellsByDim[targetDim];
    const signatures = new Set(targetCells.map(sortedCellSignature));
    for (const cell of boundaryCells[dim]) {
      const duplicates = cell.map(vertex => duplicateOf.get(vertex) ?? -1);
      if (duplicates.some(vertex => vertex < 0)) continue;
      const wall = cell.length === 1
        ? [cell[0], duplicates[0]]
        : [
            ...cell,
            ...duplicates.slice().reverse(),
          ];
      pushUniqueCell(targetCells, wall, signatures);
    }
  }

  const insetVertices = sourceVertices
    .map(vertex => duplicateOf.get(vertex) ?? -1)
    .filter(vertex => vertex >= 0);
  if (!insetCellIds.length || !insetVertices.length) return undefined;

  const newCells = cellsByDim.map(cells => cells.length ? makeCellDim(cells) : undefined);
  return {
    topology: {
      cells: newCells,
      generatedKind: 'edited',
      sourceDimension: topology.sourceDimension,
    },
    vertexCount: vertexCount + sourceVertices.length,
    edges: edgeListFromCells(cellsByDim[1]),
    sourceVertices,
    insetVertices,
    insetCellIds,
  };
}

export function bevelVertices(
  topology: CellTopology | undefined,
  vertexIds: number[],
  vertexCount: number,
  smoothness = 1,
): BevelVertexResult | undefined {
  if (!topology || vertexCount <= 0) return undefined;
  const requestedVertices = vertexIds
    .filter((vertex, index, arr) => Number.isInteger(vertex) && vertex >= 0 && vertex < vertexCount && arr.indexOf(vertex) === index);
  if (!requestedVertices.length) return undefined;

  const layerCount = Math.max(1, Math.min(32, Math.floor(smoothness)));
  const highestSourceDimension = maxCellDimension(topology);
  const sourceCellsByDim: number[][][] = Array.from({ length: highestSourceDimension + 1 }, (_entry, dim) => (
    dim > 0 ? cellVerticesForMutation(topology, dim) : []
  ));

  type VertexBevelAnalysis = {
    vertex: number;
    incidentNeighbors: number[];
    neighborIndexByVertex: Map<number, number>;
    generatedByWeights: Map<string, number>;
    profileByPair: Map<string, number[]>;
    faceProfilePairs: Array<[number, number]>;
    createdProfiles: number[][];
  };

  const incidentNeighborsFor = (vertexId: number) => {
    const neighbors: number[] = [];
    for (let edgeId = 0; edgeId < cellCount(topology, 1); edgeId++) {
      const edge = getCellVertices(topology, 1, edgeId);
      if (edge.length < 2 || !edge.includes(vertexId)) continue;
      const neighbor = edge[0] === vertexId ? edge[1] : edge[0];
      if (neighbor >= 0 && neighbor < vertexCount && !neighbors.includes(neighbor)) neighbors.push(neighbor);
    }
    return neighbors;
  };

  const analysesByVertex = new Map<number, VertexBevelAnalysis>();
  for (const vertex of requestedVertices) {
    const incidentNeighbors = incidentNeighborsFor(vertex);
    if (incidentNeighbors.length < 2) continue;
    const neighborIndexByVertex = new Map<number, number>();
    incidentNeighbors.forEach((neighbor, index) => neighborIndexByVertex.set(neighbor, index));
    analysesByVertex.set(vertex, {
      vertex,
      incidentNeighbors,
      neighborIndexByVertex,
      generatedByWeights: new Map(),
      profileByPair: new Map(),
      faceProfilePairs: [],
      createdProfiles: [],
    });
  }
  if (!analysesByVertex.size) return undefined;

  const selectedSet = new Set(analysesByVertex.keys());
  const vertexMap = new Int32Array(vertexCount);
  vertexMap.fill(-1);
  let nextVertex = 0;
  for (let vertex = 0; vertex < vertexCount; vertex++) {
    if (selectedSet.has(vertex)) continue;
    vertexMap[vertex] = nextVertex++;
  }

  const cuts: BevelVertexCut[] = [];
  const patches: BevelVertexPatch[] = [];
  const weightsFor = (analysis: VertexBevelAnalysis, entries: Array<[number, number]>) => {
    const weights = new Array(analysis.incidentNeighbors.length).fill(0);
    for (const [neighborIndex, weight] of entries) weights[neighborIndex] = Math.max(0, weight);
    return weights;
  };

  const capVertex = (analysis: VertexBevelAnalysis, weights: number[], keySuffix = '') => {
    const key = keySuffix ? `${weights.join(':')}|${keySuffix}` : weights.join(':');
    const existing = analysis.generatedByWeights.get(key);
    if (typeof existing === 'number') return existing;
    const vertex = nextVertex++;
    analysis.generatedByWeights.set(key, vertex);
    const neighbors: number[] = [];
    const normalizedWeights: number[] = [];
    weights.forEach((weight, index) => {
      if (weight <= 0) return;
      neighbors.push(analysis.incidentNeighbors[index]);
      normalizedWeights.push(weight / layerCount);
    });
    cuts.push({ vertex, sourceVertex: analysis.vertex, neighbors, weights: normalizedWeights });
    return vertex;
  };

  const boundaryCut = (analysis: VertexBevelAnalysis, neighbor: number) => {
    const index = analysis.neighborIndexByVertex.get(neighbor);
    return typeof index === 'number' ? capVertex(analysis, weightsFor(analysis, [[index, layerCount]])) : -1;
  };

  const profileKey = (a: number, b: number) => `${a}:${b}`;
  const unorderedProfileKey = (a: number, b: number) => (a < b ? `${a}:${b}` : `${b}:${a}`);
  const ensureProfile = (analysis: VertexBevelAnalysis, fromNeighbor: number, toNeighbor: number) => {
    if (fromNeighbor === toNeighbor) {
      const cut = boundaryCut(analysis, fromNeighbor);
      return cut >= 0 ? [cut] : undefined;
    }
    const existing = analysis.profileByPair.get(profileKey(fromNeighbor, toNeighbor));
    if (existing) return existing;
    const from = analysis.neighborIndexByVertex.get(fromNeighbor);
    const to = analysis.neighborIndexByVertex.get(toNeighbor);
    if (typeof from !== 'number' || typeof to !== 'number') return undefined;
    const sequence: number[] = [];
    for (let step = 0; step <= layerCount; step++) {
      sequence.push(capVertex(analysis, weightsFor(analysis, [
        [from, layerCount - step],
        [to, step],
      ])));
    }
    analysis.profileByPair.set(profileKey(fromNeighbor, toNeighbor), sequence);
    analysis.profileByPair.set(profileKey(toNeighbor, fromNeighbor), [...sequence].reverse());
    analysis.createdProfiles.push(sequence);
    return sequence;
  };

  const recordFaceProfilePair = (analysis: VertexBevelAnalysis, fromNeighbor: number, toNeighbor: number) => {
    if (fromNeighbor === toNeighbor) return;
    const key = unorderedProfileKey(fromNeighbor, toNeighbor);
    if (analysis.faceProfilePairs.some(([a, b]) => unorderedProfileKey(a, b) === key)) return;
    analysis.faceProfilePairs.push([fromNeighbor, toNeighbor]);
  };

  const incidentNeighborsInCell = (analysis: VertexBevelAnalysis, cell: number[]) => {
    const source = new Set(cell);
    return analysis.incidentNeighbors.filter(neighbor => source.has(neighbor));
  };

  const profileNeighborsInFace = (analysis: VertexBevelAnalysis, face: number[], vertexIndex: number) => {
    const count = face.length;
    if (count <= 1) return null;
    const findNeighbor = (step: -1 | 1) => {
      for (let offset = 1; offset < count; offset++) {
        const candidate = face[(vertexIndex + (step * offset) + count) % count];
        if (analysis.neighborIndexByVertex.has(candidate)) return candidate;
      }
      return -1;
    };
    const prev = findNeighbor(-1);
    const next = findNeighbor(1);
    if (prev >= 0 && next >= 0 && prev !== next) return [prev, next];
    const fallback = incidentNeighborsInCell(analysis, face);
    const candidates = [
      prev,
      next,
      ...fallback,
    ].filter((neighbor, index, arr) => neighbor >= 0 && arr.indexOf(neighbor) === index);
    if (candidates.length >= 2) return [candidates[0], candidates[1]];
    if (candidates.length === 1) return [candidates[0], candidates[0]];
    return null;
  };

  const linkPairsForNeighborSet = (analysis: VertexBevelAnalysis, allowed: Set<number>) => {
    const pairs: Array<[number, number]> = [];
    const seen = new Set<string>();
    const addPair = (a: number, b: number) => {
      if (a === b || !allowed.has(a) || !allowed.has(b)) return;
      const key = unorderedProfileKey(a, b);
      if (seen.has(key)) return;
      seen.add(key);
      pairs.push([a, b]);
    };

    for (const [a, b] of analysis.faceProfilePairs) addPair(a, b);
    if (pairs.length) return pairs;

    for (const sourceFace of sourceCellsByDim[2] ?? []) {
      if (!sourceFace.includes(analysis.vertex)) continue;
      const idx = sourceFace.indexOf(analysis.vertex);
      if (idx < 0) continue;
      const profileNeighbors = profileNeighborsInFace(analysis, sourceFace, idx);
      if (!profileNeighbors) continue;
      addPair(profileNeighbors[0], profileNeighbors[1]);
    }

    return pairs;
  };

  const orderedLinkCycle = (analysis: VertexBevelAnalysis, cellNeighbors: number[]) => {
    const allowed = new Set(cellNeighbors);
    const adjacency = new Map<number, Set<number>>();
    const addLinkEdge = (a: number, b: number) => {
      if (a === b) return;
      let aSet = adjacency.get(a);
      if (!aSet) {
        aSet = new Set();
        adjacency.set(a, aSet);
      }
      aSet.add(b);
      let bSet = adjacency.get(b);
      if (!bSet) {
        bSet = new Set();
        adjacency.set(b, bSet);
      }
      bSet.add(a);
    };

    for (const [prev, next] of linkPairsForNeighborSet(analysis, allowed)) addLinkEdge(prev, next);

    if (cellNeighbors.some(neighbor => (adjacency.get(neighbor)?.size ?? 0) !== 2)) return null;

    const order: number[] = [];
    const start = cellNeighbors[0];
    let previous = -1;
    let current = start;
    for (let guard = 0; guard < cellNeighbors.length; guard++) {
      order.push(current);
      const next = Array.from(adjacency.get(current) ?? [])
        .find(candidate => candidate !== previous && (candidate !== start || order.length === cellNeighbors.length));
      if (next === undefined) return null;
      previous = current;
      current = next;
    }
    return current === start && order.length === cellNeighbors.length ? order : null;
  };

  const linkTrianglesForNeighborSet = (analysis: VertexBevelAnalysis, allowed: Set<number>) => {
    const triangles: number[][] = [];
    const seen = new Set<string>();
    const addTriangle = (vertices: number[]) => {
      const unique = vertices.filter((vertex, index, arr) => vertex >= 0 && arr.indexOf(vertex) === index);
      if (unique.length !== 3 || unique.some(vertex => !allowed.has(vertex))) return;
      const signature = sortedCellSignature(unique);
      if (seen.has(signature)) return;
      seen.add(signature);
      triangles.push(unique);
    };

    for (const sourceVolume of sourceCellsByDim[3] ?? []) {
      if (!sourceVolume.includes(analysis.vertex)) continue;
      addTriangle(incidentNeighborsInCell(analysis, sourceVolume));
    }

    if (triangles.length) return triangles;

    const pairs = linkPairsForNeighborSet(analysis, allowed);
    const neighbors = Array.from(allowed);
    const pairKeys = new Set(pairs.map(([a, b]) => unorderedProfileKey(a, b)));
    for (let a = 0; a < neighbors.length - 2; a++) {
      for (let b = a + 1; b < neighbors.length - 1; b++) {
        for (let c = b + 1; c < neighbors.length; c++) {
          const na = neighbors[a];
          const nb = neighbors[b];
          const nc = neighbors[c];
          if (!pairKeys.has(unorderedProfileKey(na, nb))) continue;
          if (!pairKeys.has(unorderedProfileKey(nb, nc))) continue;
          if (!pairKeys.has(unorderedProfileKey(nc, na))) continue;
          addTriangle([na, nb, nc]);
        }
      }
    }
    return triangles;
  };

  const remapCell = (cell: number[]) => {
    const remapped = cell.map(vertex => vertexMap[vertex]).filter(vertex => vertex >= 0);
    return remapped.length === cell.length ? remapped : [];
  };

  const dedupeSequence = (sequence: number[]) => {
    const result: number[] = [];
    for (const vertex of sequence) {
      if (vertex < 0) continue;
      if (result[result.length - 1] === vertex) continue;
      result.push(vertex);
    }
    if (result.length > 1 && result[0] === result[result.length - 1]) result.pop();
    return result;
  };

  const replaceSelectedVerticesInFace = (face: number[]) => {
    const nextFace: number[] = [];
    for (let idx = 0; idx < face.length; idx++) {
      const vertex = face[idx];
      const analysis = analysesByVertex.get(vertex);
      if (analysis) {
        const profileNeighbors = profileNeighborsInFace(analysis, face, idx);
        if (!profileNeighbors) return [];
        const [prev, next] = profileNeighbors;
        const profile = ensureProfile(analysis, prev, next);
        if (!profile?.length) return [];
        recordFaceProfilePair(analysis, prev, next);
        nextFace.push(...profile);
        continue;
      }
      const mapped = vertexMap[vertex];
      if (mapped >= 0) nextFace.push(mapped);
    }
    return dedupeSequence(nextFace);
  };

  const replacementCutsForCell = (analysis: VertexBevelAnalysis, cell: number[]) => {
    const cutsForCell: number[] = [];
    const seen = new Set<number>();
    for (const neighbor of incidentNeighborsInCell(analysis, cell)) {
      const cut = boundaryCut(analysis, neighbor);
      if (cut < 0 || seen.has(cut)) continue;
      seen.add(cut);
      cutsForCell.push(cut);
    }
    return cutsForCell;
  };

  const replaceSelectedVerticesInCell = (cell: number[]) => {
    const nextCell: number[] = [];
    const seen = new Set<number>();
    for (const vertex of cell) {
      if (selectedSet.has(vertex)) continue;
      const mapped = vertexMap[vertex];
      if (mapped < 0 || seen.has(mapped)) continue;
      seen.add(mapped);
      nextCell.push(mapped);
    }
    for (const vertex of cell) {
      const analysis = analysesByVertex.get(vertex);
      if (!analysis) continue;
      for (const cut of replacementCutsForCell(analysis, cell)) {
        if (seen.has(cut)) continue;
        seen.add(cut);
        nextCell.push(cut);
      }
    }
    return nextCell;
  };

  const cellsByDim: number[][][] = Array.from({ length: highestSourceDimension + 1 }, () => []);
  for (let dim = 1; dim <= highestSourceDimension; dim++) {
    const sourceCells = sourceCellsByDim[dim] ?? [];
    const targetCells = cellsByDim[dim];
    const signatures = new Set<string>();
    for (const cell of sourceCells) {
      const selectedInCell = cell.filter(vertex => selectedSet.has(vertex));
      if (!selectedInCell.length) {
        pushUniqueCell(targetCells, remapCell(cell), signatures);
        continue;
      }

      if (dim === 1 && cell.length >= 2) {
        const a = cell[0];
        const b = cell[1];
        const aAnalysis = analysesByVertex.get(a);
        const bAnalysis = analysesByVertex.get(b);
        const nextEdge: number[] = [];
        if (aAnalysis) nextEdge.push(boundaryCut(aAnalysis, b));
        else if (vertexMap[a] >= 0) nextEdge.push(vertexMap[a]);
        if (bAnalysis) nextEdge.push(boundaryCut(bAnalysis, a));
        else if (vertexMap[b] >= 0) nextEdge.push(vertexMap[b]);
        pushUniqueCell(targetCells, nextEdge, signatures);
        continue;
      }

      if (dim === 2) {
        pushUniqueCell(targetCells, replaceSelectedVerticesInFace(cell), signatures);
        continue;
      }

      pushUniqueCell(targetCells, replaceSelectedVerticesInCell(cell), signatures);
    }
  }

  const edgeSignatures = new Set((cellsByDim[1] ?? []).map(sortedCellSignature));
  const addCapEdge = (a: number, b: number) => {
    if (a === b) return;
    pushUniqueCell(cellsByDim[1], [a, b], edgeSignatures);
  };
  for (const analysis of analysesByVertex.values()) {
    for (const profile of analysis.createdProfiles) {
      for (let idx = 0; idx < profile.length - 1; idx++) addCapEdge(profile[idx], profile[idx + 1]);
    }
  }

  const capCellSignaturesByDim = new Map<number, Set<string>>();
  const capSignaturesFor = (dimension: number) => {
    while (cellsByDim.length <= dimension) cellsByDim.push([]);
    let signatures = capCellSignaturesByDim.get(dimension);
    if (!signatures) {
      signatures = new Set((cellsByDim[dimension] ?? []).map(sortedCellSignature));
      capCellSignaturesByDim.set(dimension, signatures);
    }
    return signatures;
  };

  let capCellId = -1;
  const addPolygonCapPatch = (
    analysis: VertexBevelAnalysis,
    neighborIds: number[],
    faceSignatures: Set<string>,
  ) => {
    const pushCapFace = (face: number[]) => {
      const nextFace = dedupeSequence(face);
      const nextId = pushUniqueCell(cellsByDim[2], nextFace, faceSignatures);
      if (nextId >= 0) addFaceBoundaryEdges(cellsByDim[1], edgeSignatures, nextFace);
      return nextId;
    };

    const addProfilePairFanCap = (center: number, linkPairs: Array<[number, number]>) => {
      let firstCellId = -1;
      for (const [from, to] of linkPairs) {
        const profile = ensureProfile(analysis, from, to);
        if (!profile || profile.length < 2) continue;
        for (let idx = 0; idx < profile.length - 1; idx++) {
          const nextId = pushCapFace([profile[idx], profile[idx + 1], center]);
          if (firstCellId < 0 && nextId >= 0) firstCellId = nextId;
        }
      }
      return firstCellId;
    };

    const linkPairs = linkPairsForNeighborSet(analysis, new Set(neighborIds));
    const ordered = orderedLinkCycle(analysis, neighborIds);
    const centerNeighborIds = ordered ?? Array.from(new Set(linkPairs.flatMap(([a, b]) => [a, b])));
    if (centerNeighborIds.length < 3) return -1;
    const orderedIndices = centerNeighborIds.map(neighbor => analysis.neighborIndexByVertex.get(neighbor));
    if (orderedIndices.some(index => typeof index !== 'number')) return -1;
    const centerWeights = new Array(analysis.incidentNeighbors.length).fill(0);
    const centerWeight = layerCount / centerNeighborIds.length;
    for (const index of orderedIndices) {
      if (typeof index === 'number') centerWeights[index] = centerWeight;
    }
    const center = capVertex(analysis, centerWeights);

    const addLinkTriangleGridCap = (linkTriangles: number[][]) => {
      let firstCellId = -1;
      const gridVertex = (triangle: number[], aWeight: number, bWeight: number, cWeight: number) => {
        const a = analysis.neighborIndexByVertex.get(triangle[0]);
        const b = analysis.neighborIndexByVertex.get(triangle[1]);
        const c = analysis.neighborIndexByVertex.get(triangle[2]);
        if (typeof a !== 'number' || typeof b !== 'number' || typeof c !== 'number') return -1;
        return capVertex(analysis, weightsFor(analysis, [
          [a, aWeight],
          [b, bWeight],
          [c, cWeight],
        ]));
      };

      for (const triangle of linkTriangles) {
        ensureProfile(analysis, triangle[0], triangle[1]);
        ensureProfile(analysis, triangle[1], triangle[2]);
        ensureProfile(analysis, triangle[2], triangle[0]);
        for (let a = 0; a < layerCount; a++) {
          for (let b = 0; b < layerCount - a; b++) {
            const c = layerCount - a - b;
            const v00 = gridVertex(triangle, a, b, c);
            const v10 = gridVertex(triangle, a + 1, b, c - 1);
            const v01 = gridVertex(triangle, a, b + 1, c - 1);
            if (v00 >= 0 && v10 >= 0 && v01 >= 0) {
              const nextId = pushCapFace([v00, v10, v01]);
              if (firstCellId < 0 && nextId >= 0) firstCellId = nextId;
            }
            if (c < 2) continue;
            const v11 = gridVertex(triangle, a + 1, b + 1, c - 2);
            if (v10 >= 0 && v11 >= 0 && v01 >= 0) {
              const nextId = pushCapFace([v10, v11, v01]);
              if (firstCellId < 0 && nextId >= 0) firstCellId = nextId;
            }
          }
        }
      }
      return firstCellId;
    };

    if (!ordered) {
      const triangleCapId = addLinkTriangleGridCap(linkTrianglesForNeighborSet(analysis, new Set(centerNeighborIds)));
      return triangleCapId >= 0 ? triangleCapId : addProfilePairFanCap(center, linkPairs);
    }
    const ns = layerCount;
    const ns2 = Math.floor(ns / 2);
    const odd = ns % 2;
    const count = ordered.length;
    const pointByKey = new Map<string, number>();
    const patchPoints: BevelVertexPatchPoint[] = [];
    const recordedPatchVertices = new Set<number>();
    const canonicalCoord = (side: number, ring: number, segment: number) => {
      const normalizedSide = ((side % count) + count) % count;
      if (!odd && ring === ns2 && segment === ns2) return [0, ring, segment] as const;
      if (ring <= ns2 - 1 + odd && segment <= ns2) return [normalizedSide, ring, segment] as const;
      if (segment <= ns2) return [((normalizedSide + count - 1) % count), segment, ns - ring] as const;
      return [((normalizedSide + 1) % count), ns - segment, ring] as const;
    };
    const profileWeights = (side: number, segment: number) => {
      const from = analysis.neighborIndexByVertex.get(ordered[side]);
      const to = analysis.neighborIndexByVertex.get(ordered[(side + 1) % count]);
      if (typeof from !== 'number' || typeof to !== 'number') return undefined;
      return weightsFor(analysis, [
        [from, ns - segment],
        [to, segment],
      ]);
    };
    const blendWeights = (side: number, ring: number, segment: number) => {
      const boundaryWeights = profileWeights(side, segment);
      if (!boundaryWeights) return centerWeights;
      if (ring <= 0 || ns2 <= 0) return boundaryWeights;
      const centerT = Math.min(1, ring / ns2);
      return boundaryWeights.map((weight, index) => (
        (weight * (1 - centerT)) + ((centerWeights[index] ?? 0) * centerT)
      ));
    };
    const recordPatchPoint = (vertex: number, side: number, ring: number, segment: number) => {
      if (recordedPatchVertices.has(vertex)) return;
      recordedPatchVertices.add(vertex);
      patchPoints.push({ vertex, side, ring, segment });
    };
    const meshVertex = (side: number, ring: number, segment: number) => {
      const [canonicalSide, canonicalRing, canonicalSegment] = canonicalCoord(side, ring, segment);
      const key = `${canonicalSide}:${canonicalRing}:${canonicalSegment}`;
      const existing = pointByKey.get(key);
      if (typeof existing === 'number') return existing;
      const profile = ensureProfile(
        analysis,
        ordered[canonicalSide],
        ordered[(canonicalSide + 1) % count],
      );
      let vertex = -1;
      if (canonicalRing === 0) {
        vertex = profile?.[canonicalSegment] ?? -1;
      } else {
        const keySuffix = odd && canonicalRing === ns2
          ? `odd-center-row:${canonicalSide}:${canonicalSegment}`
          : '';
        vertex = capVertex(
          analysis,
          blendWeights(canonicalSide, canonicalRing, canonicalSegment),
          keySuffix,
        );
      }
      if (vertex < 0) return -1;
      pointByKey.set(key, vertex);
      recordPatchPoint(vertex, canonicalSide, canonicalRing, canonicalSegment);
      return vertex;
    };

    let firstCellId = -1;
    if (ns <= 1) {
      const polygon = ordered
        .map((_neighbor, side) => meshVertex(side, 0, 0))
        .filter(vertex => vertex >= 0);
      return pushCapFace(polygon);
    }

    for (let side = 0; side < count; side++) {
      for (let ring = 0; ring < ns2; ring++) {
        for (let segment = 0; segment < ns2 + odd; segment++) {
          const face = [
            meshVertex(side, ring, segment),
            meshVertex(side, ring, segment + 1),
            meshVertex(side, ring + 1, segment + 1),
            meshVertex(side, ring + 1, segment),
          ];
          if (face.some(vertex => vertex < 0)) continue;
          const nextId = pushCapFace(face);
          if (firstCellId < 0 && nextId >= 0) firstCellId = nextId;
        }
      }
    }

    if (odd) {
      const centerFace = ordered
        .map((_neighbor, side) => meshVertex(side, ns2, ns2))
        .filter(vertex => vertex >= 0);
      const nextId = pushCapFace(centerFace);
      if (firstCellId < 0 && nextId >= 0) firstCellId = nextId;
    }

    if (firstCellId >= 0 && patchPoints.length) {
      patches.push({
        sourceVertex: analysis.vertex,
        orderedNeighbors: [...ordered],
        segments: ns,
        points: patchPoints,
      });
    }
    return firstCellId;
  };

  if (highestSourceDimension >= 2) {
    const faceSignatures = capSignaturesFor(2);
    for (const analysis of analysesByVertex.values()) {
      const capNeighborSet = new Set<number>();
      for (const [a, b] of linkPairsForNeighborSet(analysis, new Set(analysis.incidentNeighbors))) {
        capNeighborSet.add(a);
        capNeighborSet.add(b);
      }
      const capNeighbors = Array.from(capNeighborSet);
      if (capNeighbors.length < 3) continue;
      const nextId = addPolygonCapPatch(analysis, capNeighbors, faceSignatures);
      if (capCellId < 0 && nextId >= 0) capCellId = nextId;
    }
  }

  const capVerticesForNeighborSet = (analysis: VertexBevelAnalysis, neighborSet: Set<number>) => (
    cuts
      .filter(cut => cut.sourceVertex === analysis.vertex
        && cut.neighbors.length > 0
        && cut.neighbors.every(neighbor => neighborSet.has(neighbor)))
      .map(cut => cut.vertex)
  );

  for (let sourceDim = 4; sourceDim <= highestSourceDimension; sourceDim++) {
    const capDim = sourceDim - 1;
    const signatures = capSignaturesFor(capDim);
    for (const sourceCell of sourceCellsByDim[sourceDim] ?? []) {
      for (const vertex of sourceCell) {
        const analysis = analysesByVertex.get(vertex);
        if (!analysis) continue;
        const neighborSet = new Set(incidentNeighborsInCell(analysis, sourceCell));
        if (neighborSet.size < capDim + 1) continue;
        const capVertices = capVerticesForNeighborSet(analysis, neighborSet);
        if (capVertices.length < capDim + 1) continue;
        const nextId = pushUniqueCell(cellsByDim[capDim], capVertices, signatures);
        if (capCellId < 0 && nextId >= 0) capCellId = nextId;
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
    patches,
    capCellId,
    smoothness: layerCount,
  };
}

export function bevelVertex(
  topology: CellTopology | undefined,
  vertexId: number,
  vertexCount: number,
  smoothness = 1,
): BevelVertexResult | undefined {
  return bevelVertices(topology, [vertexId], vertexCount, smoothness);
}

export function bevelEdge(
  topology: CellTopology | undefined,
  edgeCellId: number,
  vertexCount: number,
  smoothness = 1,
): BevelEdgeResult | undefined {
  if (!topology || edgeCellId < 0 || edgeCellId >= cellCount(topology, 1)) return undefined;
  const selectedEdge = getCellVertices(topology, 1, edgeCellId);
  if (selectedEdge.length < 2) return undefined;
  const edgeA = selectedEdge[0];
  const edgeB = selectedEdge[1];
  if (edgeA < 0 || edgeB < 0 || edgeA >= vertexCount || edgeB >= vertexCount || edgeA === edgeB) {
    return undefined;
  }

  const layerCount = Math.max(1, Math.min(32, Math.floor(smoothness)));
  const highestSourceDimension = maxCellDimension(topology);

  const vertexMap = new Int32Array(vertexCount);
  vertexMap.fill(-1);
  let nextVertex = 0;
  for (let vertex = 0; vertex < vertexCount; vertex++) {
    if (vertex === edgeA || vertex === edgeB) continue;
    vertexMap[vertex] = nextVertex++;
  }

  const hasSelectedEdge = (cell: number[]) => cell.includes(edgeA) && cell.includes(edgeB);
  const hasAffectedEndpoint = (cell: number[]) => cell.includes(edgeA) || cell.includes(edgeB);
  const edgeKey = `${Math.min(edgeA, edgeB)}:${Math.max(edgeA, edgeB)}`;
  const faceCutByFaceId = new Map<number, [number, number]>();
  const cutByEndpointNeighbor = new Map<string, number>();
  const profileByEndpointNeighbors = new Map<string, number[]>();
  const cuts: BevelEdgeCut[] = [];
  const sourceCellsByDim: number[][][] = Array.from({ length: highestSourceDimension + 1 }, (_entry, dim) => (
    dim > 0 ? cellVerticesForMutation(topology, dim) : []
  ));
  const cutKey = (endpoint: number, sideNeighbor: number) => `${endpoint}:${sideNeighbor}`;
  const cutFor = (endpoint: number, sideNeighbor: number) => (
    cutByEndpointNeighbor.get(cutKey(endpoint, sideNeighbor)) ?? -1
  );
  const profileKey = (endpoint: number, sideA: number, sideB: number) => `${endpoint}:${sideA}:${sideB}`;
  const profileSequence = (endpoint: number, sideA: number, sideB: number) => (
    profileByEndpointNeighbors.get(profileKey(endpoint, sideA, sideB))
  );

  const selectedEdgeSideNeighbor = (face: number[], endpoint: number) => {
    const idx = face.indexOf(endpoint);
    if (idx < 0) return -1;
    const prev = face[(idx - 1 + face.length) % face.length];
    const next = face[(idx + 1) % face.length];
    if (prev === edgeA || prev === edgeB) return next;
    if (next === edgeA || next === edgeB) return prev;
    return -1;
  };

  const ensureFaceCuts = (faceId: number, face: number[]) => {
    const existing = faceCutByFaceId.get(faceId);
    if (existing) return existing;
    const sideA = selectedEdgeSideNeighbor(face, edgeA);
    const sideB = selectedEdgeSideNeighbor(face, edgeB);
    if (sideA < 0 || sideB < 0) return undefined;
    let cutA = cutFor(edgeA, sideA);
    if (cutA < 0) {
      cutA = nextVertex++;
      cutByEndpointNeighbor.set(cutKey(edgeA, sideA), cutA);
      cuts.push({ vertex: cutA, endpoint: edgeA, faceId, sideNeighbor: sideA });
    }
    let cutB = cutFor(edgeB, sideB);
    if (cutB < 0) {
      cutB = nextVertex++;
      cutByEndpointNeighbor.set(cutKey(edgeB, sideB), cutB);
      cuts.push({ vertex: cutB, endpoint: edgeB, faceId, sideNeighbor: sideB });
    }
    const pair: [number, number] = [cutA, cutB];
    faceCutByFaceId.set(faceId, pair);
    return pair;
  };

  for (let faceId = 0; faceId < (sourceCellsByDim[2]?.length ?? 0); faceId++) {
    const face = sourceCellsByDim[2][faceId];
    if (hasSelectedEdge(face)) ensureFaceCuts(faceId, face);
  }
  if (!cuts.length) return undefined;

  const sideNeighborsByEndpoint = new Map<number, number[]>();
  const addEndpointSideNeighbor = (endpoint: number, sideNeighbor: number) => {
    let neighbors = sideNeighborsByEndpoint.get(endpoint);
    if (!neighbors) {
      neighbors = [];
      sideNeighborsByEndpoint.set(endpoint, neighbors);
    }
    if (!neighbors.includes(sideNeighbor)) neighbors.push(sideNeighbor);
  };
  for (const cut of cuts) addEndpointSideNeighbor(cut.endpoint, cut.sideNeighbor);

  const ensureEndpointProfile = (endpoint: number, sideA: number, sideB: number) => {
    const existing = profileSequence(endpoint, sideA, sideB);
    if (existing) return existing;
    const start = cutFor(endpoint, sideA);
    const end = cutFor(endpoint, sideB);
    if (start < 0 || end < 0) return undefined;
    const sequence = [start];
    for (let step = 1; step < layerCount; step++) {
      const vertex = nextVertex++;
      cuts.push({
        vertex,
        endpoint,
        faceId: -1,
        sideNeighbor: sideA,
        sideNeighborB: sideB,
        profileT: step / layerCount,
      });
      sequence.push(vertex);
    }
    sequence.push(end);
    profileByEndpointNeighbors.set(profileKey(endpoint, sideA, sideB), sequence);
    profileByEndpointNeighbors.set(profileKey(endpoint, sideB, sideA), [...sequence].reverse());
    return sequence;
  };

  for (const [endpoint, neighbors] of sideNeighborsByEndpoint) {
    if (neighbors.length !== 2) continue;
    ensureEndpointProfile(endpoint, neighbors[0], neighbors[1]);
  }

  const faceIdsInCell = (cell: number[]) => {
    const source = new Set(cell);
    const faceIds: number[] = [];
    for (let faceId = 0; faceId < (sourceCellsByDim[2]?.length ?? 0); faceId++) {
      const face = sourceCellsByDim[2][faceId];
      if (hasSelectedEdge(face) && isSubsetCell(face, source) && faceCutByFaceId.has(faceId)) {
        faceIds.push(faceId);
      }
    }
    return faceIds;
  };
  const selectedEdgeFaceIds = () => {
    const faceIds: number[] = [];
    for (let faceId = 0; faceId < (sourceCellsByDim[2]?.length ?? 0); faceId++) {
      const face = sourceCellsByDim[2][faceId];
      if (hasSelectedEdge(face) && faceCutByFaceId.has(faceId)) faceIds.push(faceId);
    }
    return faceIds;
  };

  const cutVerticesForFaceIds = (faceIds: number[]) => {
    if (faceIds.length === 2) {
      const first = faceCutByFaceId.get(faceIds[0]);
      const second = faceCutByFaceId.get(faceIds[1]);
      if (first && second) return [first[0], first[1], second[1], second[0]];
    }
    return faceIds.flatMap(faceId => Array.from(faceCutByFaceId.get(faceId) ?? []));
  };

  const endpointProfileForFacePair = (endpoint: number, firstFaceId: number, secondFaceId: number) => {
    const firstFace = sourceCellsByDim[2]?.[firstFaceId];
    const secondFace = sourceCellsByDim[2]?.[secondFaceId];
    if (!firstFace || !secondFace) return undefined;
    const firstSide = selectedEdgeSideNeighbor(firstFace, endpoint);
    const secondSide = selectedEdgeSideNeighbor(secondFace, endpoint);
    if (firstSide < 0 || secondSide < 0) return undefined;
    return ensureEndpointProfile(endpoint, firstSide, secondSide);
  };

  const bevelStripFacesForFaceIds = (faceIds: number[]) => {
    if (faceIds.length !== 2) return [];
    const edgeAProfile = endpointProfileForFacePair(edgeA, faceIds[0], faceIds[1]);
    const edgeBProfile = endpointProfileForFacePair(edgeB, faceIds[0], faceIds[1]);
    if (!edgeAProfile || !edgeBProfile || edgeAProfile.length !== edgeBProfile.length || edgeAProfile.length < 2) {
      const fallback = cutVerticesForFaceIds(faceIds);
      return fallback.length >= 3 ? [fallback] : [];
    }
    const faces: number[][] = [];
    for (let step = 0; step < edgeAProfile.length - 1; step++) {
      faces.push([edgeAProfile[step], edgeBProfile[step], edgeBProfile[step + 1], edgeAProfile[step + 1]]);
    }
    return faces;
  };

  const remapCell = (cell: number[]) => {
    const remapped = cell.map(vertex => vertexMap[vertex]).filter(vertex => vertex >= 0);
    return remapped.length === cell.length ? remapped : [];
  };

  const pushMappedVertex = (target: number[], vertex: number) => {
    const mapped = vertexMap[vertex];
    if (mapped >= 0) target.push(mapped);
  };

  const endpointReplacementInFace = (face: number[], endpointIndex: number) => {
    const endpoint = face[endpointIndex];
    const prev = face[(endpointIndex - 1 + face.length) % face.length];
    const next = face[(endpointIndex + 1) % face.length];
    const prevCut = cutFor(endpoint, prev);
    const nextCut = cutFor(endpoint, next);
    if (prevCut < 0 && nextCut < 0) return [];
    const profile = prevCut >= 0 && nextCut >= 0 ? ensureEndpointProfile(endpoint, prev, next) : undefined;
    if (profile) return profile;
    if (prevCut >= 0 && nextCut >= 0) return prevCut === nextCut ? [prevCut] : [prevCut, nextCut];
    return [prevCut >= 0 ? prevCut : nextCut];
  };

  const replaceSelectedEdgeInFace = (faceId: number, face: number[]) => {
    const cutsForFace = faceCutByFaceId.get(faceId);
    if (!cutsForFace) return [];
    const [cutA, cutB] = cutsForFace;
    const nextFace: number[] = [];
    for (let idx = 0; idx < face.length; idx++) {
      const current = face[idx];
      const next = face[(idx + 1) % face.length];
      if (current === edgeA && next === edgeB) {
        nextFace.push(cutA, cutB);
        idx++;
        continue;
      }
      if (current === edgeB && next === edgeA) {
        nextFace.push(cutB, cutA);
        idx++;
        continue;
      }
      pushMappedVertex(nextFace, current);
    }
    return nextFace;
  };

  const replaceAffectedEndpointsInFace = (face: number[]) => {
    const nextFace: number[] = [];
    for (let idx = 0; idx < face.length; idx++) {
      const current = face[idx];
      if (current === edgeA || current === edgeB) {
        const replacement = endpointReplacementInFace(face, idx);
        if (!replacement.length) return [];
        nextFace.push(...replacement);
      } else {
        pushMappedVertex(nextFace, current);
      }
    }
    return nextFace;
  };

  const cutVerticesInCell = (cell: number[]) => {
    const source = new Set(cell);
    const result: number[] = [];
    const seen = new Set<number>();
    for (const cut of cuts) {
      if (!source.has(cut.endpoint) || !source.has(cut.sideNeighbor) || seen.has(cut.vertex)) continue;
      if (cut.sideNeighborB !== undefined && !source.has(cut.sideNeighborB)) continue;
      seen.add(cut.vertex);
      result.push(cut.vertex);
    }
    return result;
  };

  const replaceAffectedEndpointsInCell = (cell: number[]) => {
    const nextCell: number[] = [];
    const seen = new Set<number>();
    for (const vertex of cell) {
      if (vertex === edgeA || vertex === edgeB) continue;
      const mapped = vertexMap[vertex];
      if (mapped < 0 || seen.has(mapped)) continue;
      seen.add(mapped);
      nextCell.push(mapped);
    }
    for (const cutVertex of cutVerticesInCell(cell)) {
      if (seen.has(cutVertex)) continue;
      seen.add(cutVertex);
      nextCell.push(cutVertex);
    }
    return nextCell;
  };

  const nextCellsByDim: number[][][] = Array.from({ length: highestSourceDimension + 1 }, () => []);
  nextCellsByDim[0] = Array.from({ length: nextVertex }, (_entry, vertex) => [vertex]);

  for (let dim = 1; dim <= highestSourceDimension; dim++) {
    const signatures = new Set<string>();
    const sourceCells = sourceCellsByDim[dim] ?? [];
    for (let cellId = 0; cellId < sourceCells.length; cellId++) {
      const cell = sourceCells[cellId];
      if (dim === 1 && sortedCellSignature(cell) === edgeKey) continue;
      if (dim === 1 && hasAffectedEndpoint(cell)) {
        const endpoint = cell[0] === edgeA || cell[0] === edgeB ? cell[0] : cell[1];
        const neighbor = cell[0] === endpoint ? cell[1] : cell[0];
        const cutVertex = cutFor(endpoint, neighbor);
        const mappedNeighbor = vertexMap[neighbor];
        if (cutVertex >= 0 && mappedNeighbor >= 0) {
          pushUniqueCell(nextCellsByDim[1], [cutVertex, mappedNeighbor], signatures);
        }
        continue;
      }
      if (dim === 2 && hasSelectedEdge(cell)) {
        pushUniqueCell(nextCellsByDim[2], replaceSelectedEdgeInFace(cellId, cell), signatures);
        continue;
      }
      if (dim === 2 && hasAffectedEndpoint(cell)) {
        pushUniqueCell(nextCellsByDim[2], replaceAffectedEndpointsInFace(cell), signatures);
        continue;
      }
      if (dim >= 3 && hasAffectedEndpoint(cell)) {
        pushUniqueCell(nextCellsByDim[dim], replaceAffectedEndpointsInCell(cell), signatures);
        continue;
      }
      pushUniqueCell(nextCellsByDim[dim], remapCell(cell), signatures);
    }
  }

  const edgeSignatures = new Set((nextCellsByDim[1] ?? []).map(sortedCellSignature));
  for (const [cutA, cutB] of faceCutByFaceId.values()) pushUniqueCell(nextCellsByDim[1], [cutA, cutB], edgeSignatures);

  for (let dim = 3; dim <= highestSourceDimension; dim++) {
    const replacementDim = dim - 1;
    const signatures = new Set((nextCellsByDim[replacementDim] ?? []).map(sortedCellSignature));
    for (const sourceCell of sourceCellsByDim[dim] ?? []) {
      if (!hasSelectedEdge(sourceCell)) continue;
      const faceIds = faceIdsInCell(sourceCell);
      if (replacementDim === 2) {
        for (const stripFace of bevelStripFacesForFaceIds(faceIds)) {
          pushUniqueCell(nextCellsByDim[replacementDim], stripFace, signatures);
        }
        continue;
      }
      const cutVertices = cutVerticesForFaceIds(faceIds);
      pushUniqueCell(nextCellsByDim[replacementDim], cutVertices, signatures);
    }
  }

  const surfaceStripSignatures = new Set((nextCellsByDim[2] ?? []).map(sortedCellSignature));
  for (const stripFace of bevelStripFacesForFaceIds(selectedEdgeFaceIds().slice(0, 2))) {
    pushUniqueCell(nextCellsByDim[2], stripFace, surfaceStripSignatures);
  }

  for (const faces of nextCellsByDim[2] ? [nextCellsByDim[2]] : []) {
    for (const face of faces) addFaceBoundaryEdges(nextCellsByDim[1], edgeSignatures, face);
  }

  nextCellsByDim[0] = Array.from({ length: nextVertex }, (_entry, vertex) => [vertex]);
  const newCells = nextCellsByDim.map(cells => cells.length ? makeCellDim(cells) : undefined);
  return {
    topology: {
      cells: newCells,
      generatedKind: 'edited',
      sourceDimension: topology.sourceDimension,
    },
    vertexMap,
    vertexCount: nextVertex,
    edges: edgeListFromCells(nextCellsByDim[1]),
    cuts,
    edgeVertices: [edgeA, edgeB],
    smoothness: layerCount,
  };
}

export function bevelFaceBoundary(
  topology: CellTopology | undefined,
  faceCellId: number,
  vertexCount: number,
  smoothness = 1,
): BevelFaceBoundaryResult | undefined {
  if (!topology || faceCellId < 0 || faceCellId >= cellCount(topology, 2)) return undefined;
  const selectedFace = getCellVertices(topology, 2, faceCellId)
    .filter(vertex => Number.isInteger(vertex) && vertex >= 0 && vertex < vertexCount);
  if (selectedFace.length < 3 || new Set(selectedFace).size !== selectedFace.length) return undefined;

  const layerCount = Math.max(1, Math.min(32, Math.floor(smoothness)));
  const highestSourceDimension = maxCellDimension(topology);
  const selectedSet = new Set(selectedFace);
  const sourceCellsByDim: number[][][] = Array.from({ length: highestSourceDimension + 1 }, (_entry, dim) => (
    dim > 0 ? cellVerticesForMutation(topology, dim) : []
  ));

  const vertexMap = new Int32Array(vertexCount);
  vertexMap.fill(-1);
  let nextVertex = 0;
  for (let vertex = 0; vertex < vertexCount; vertex++) {
    if (selectedSet.has(vertex)) continue;
    vertexMap[vertex] = nextVertex++;
  }

  const cuts: BevelEdgeCut[] = [];
  const cutByEndpointNeighbor = new Map<string, number>();
  const profileByEndpointNeighbors = new Map<string, number[]>();
  const cornerProfileByEndpointOuter = new Map<string, number[]>();
  const cutKey = (endpoint: number, sideNeighbor: number) => `${endpoint}:${sideNeighbor}`;
  const profileKey = (endpoint: number, sideA: number, sideB: number) => `${endpoint}:${sideA}:${sideB}`;
  const cornerProfileKey = (endpoint: number, outerSide: number) => `${endpoint}:corner:${outerSide}`;
  const cornerKey = (endpoint: number, sideA: number, sideB: number) => (
    sideA < sideB ? `${endpoint}:${sideA}:${sideB}` : `${endpoint}:${sideB}:${sideA}`
  );
  const cornerMeetByEndpointNeighbors = new Map<string, number>();
  const cutFor = (endpoint: number, sideNeighbor: number) => (
    cutByEndpointNeighbor.get(cutKey(endpoint, sideNeighbor)) ?? -1
  );
  const ensureCut = (endpoint: number, sideNeighbor: number, sourceFaceId: number) => {
    if (!selectedSet.has(endpoint) || endpoint === sideNeighbor || sideNeighbor < 0 || sideNeighbor >= vertexCount) {
      return -1;
    }
    const key = cutKey(endpoint, sideNeighbor);
    const existing = cutByEndpointNeighbor.get(key);
    if (typeof existing === 'number') return existing;
    const vertex = nextVertex++;
    cutByEndpointNeighbor.set(key, vertex);
    cuts.push({ vertex, endpoint, faceId: sourceFaceId, sideNeighbor });
    return vertex;
  };
  const ensureCornerMeet = (endpoint: number, sideA: number, sideB: number) => {
    const key = cornerKey(endpoint, sideA, sideB);
    const existing = cornerMeetByEndpointNeighbors.get(key);
    if (typeof existing === 'number') return existing;
    const vertex = nextVertex++;
    cornerMeetByEndpointNeighbors.set(key, vertex);
    cuts.push({
      vertex,
      endpoint,
      faceId: faceCellId,
      sideNeighbor: sideA,
      sideNeighborB: sideB,
      profileT: 0.5,
      cornerMeet: true,
    });
    return vertex;
  };
  const ensureProfile = (endpoint: number, sideA: number, sideB: number) => {
    if (sideA === sideB) {
      const cut = ensureCut(endpoint, sideA, faceCellId);
      return cut >= 0 ? [cut] : undefined;
    }
    const existing = profileByEndpointNeighbors.get(profileKey(endpoint, sideA, sideB));
    if (existing) return existing;
    const start = ensureCut(endpoint, sideA, faceCellId);
    const end = ensureCut(endpoint, sideB, faceCellId);
    if (start < 0 || end < 0) return undefined;
    const sequence = [start];
    for (let step = 1; step < layerCount; step++) {
      const vertex = nextVertex++;
      cuts.push({
        vertex,
        endpoint,
        faceId: -1,
        sideNeighbor: sideA,
        sideNeighborB: sideB,
        profileT: step / layerCount,
      });
      sequence.push(vertex);
    }
    sequence.push(end);
    profileByEndpointNeighbors.set(profileKey(endpoint, sideA, sideB), sequence);
    profileByEndpointNeighbors.set(profileKey(endpoint, sideB, sideA), [...sequence].reverse());
    return sequence;
  };
  const selectedCornerMeet = (endpoint: number) => {
    const idx = selectedFace.indexOf(endpoint);
    if (idx < 0) return -1;
    const prev = selectedFace[(idx - 1 + selectedFace.length) % selectedFace.length];
    const next = selectedFace[(idx + 1) % selectedFace.length];
    return ensureCornerMeet(endpoint, prev, next);
  };
  const ensureCornerProfileForOuter = (endpoint: number, externalSide: number) => {
    const inner = selectedCornerMeet(endpoint);
    const outer = ensureCut(endpoint, externalSide, faceCellId);
    if (inner < 0 || outer < 0) return undefined;
    if (layerCount <= 1) return [inner, outer];
    const key = cornerProfileKey(endpoint, externalSide);
    const existing = cornerProfileByEndpointOuter.get(key);
    if (existing) return existing;
    const idx = selectedFace.indexOf(endpoint);
    if (idx < 0) return undefined;
    const prev = selectedFace[(idx - 1 + selectedFace.length) % selectedFace.length];
    const next = selectedFace[(idx + 1) % selectedFace.length];
    const sequence = [inner];
    for (let step = 1; step < layerCount; step++) {
      const vertex = nextVertex++;
      cuts.push({
        vertex,
        endpoint,
        faceId: -1,
        sideNeighbor: prev,
        sideNeighborB: next,
        profileOuterNeighbor: externalSide,
        profileT: step / layerCount,
      });
      sequence.push(vertex);
    }
    sequence.push(outer);
    cornerProfileByEndpointOuter.set(key, sequence);
    return sequence;
  };

  const boundaryEdges = selectedFace.map((a, idx) => ({
    a,
    b: selectedFace[(idx + 1) % selectedFace.length],
    prev: selectedFace[(idx - 1 + selectedFace.length) % selectedFace.length],
    next: selectedFace[(idx + 2) % selectedFace.length],
    externalFaces: [] as Array<{ faceId: number; sideA: number; sideB: number }>,
  }));
  const boundaryEdgeSignatures = new Set(boundaryEdges.map(edge => (
    sortedCellSignature([edge.a, edge.b])
  )));

  const sideNeighborInFace = (face: number[], endpoint: number, otherEndpoint: number) => {
    const idx = face.indexOf(endpoint);
    if (idx < 0) return -1;
    const prev = face[(idx - 1 + face.length) % face.length];
    const next = face[(idx + 1) % face.length];
    if (prev === otherEndpoint) return next;
    if (next === otherEndpoint) return prev;
    return -1;
  };

  for (const edge of boundaryEdges) {
    ensureCut(edge.a, edge.b, faceCellId);
    ensureCut(edge.b, edge.a, faceCellId);
    for (let faceId = 0; faceId < (sourceCellsByDim[2]?.length ?? 0); faceId++) {
      if (faceId === faceCellId) continue;
      const face = sourceCellsByDim[2][faceId];
      if (!face.includes(edge.a) || !face.includes(edge.b)) continue;
      const sideA = sideNeighborInFace(face, edge.a, edge.b);
      const sideB = sideNeighborInFace(face, edge.b, edge.a);
      if (sideA < 0 || sideB < 0) continue;
      ensureCut(edge.a, sideA, faceId);
      ensureCut(edge.b, sideB, faceId);
      edge.externalFaces.push({ faceId, sideA, sideB });
    }
  }

  for (let idx = 0; idx < selectedFace.length; idx++) {
    const endpoint = selectedFace[idx];
    const prev = selectedFace[(idx - 1 + selectedFace.length) % selectedFace.length];
    const next = selectedFace[(idx + 1) % selectedFace.length];
    ensureCornerMeet(endpoint, prev, next);
  }

  const dedupeSequence = (sequence: number[]) => {
    const result: number[] = [];
    for (const vertex of sequence) {
      if (vertex < 0) continue;
      if (result[result.length - 1] === vertex) continue;
      result.push(vertex);
    }
    if (result.length > 1 && result[0] === result[result.length - 1]) result.pop();
    return result;
  };

  const selectedFaceReplacement = () => {
    return selectedFace
      .map(endpoint => selectedCornerMeet(endpoint))
      .filter(vertex => vertex >= 0);
  };

  const edgeContainsSelectedBoundary = (edge: number[]) => (
    edge.length >= 2 && boundaryEdgeSignatures.has(sortedCellSignature([edge[0], edge[1]]))
  );

  const replaceBoundaryEdgeInFace = (
    faceId: number,
    face: number[],
    edgeA: number,
    edgeB: number,
    cutA: number,
    cutB: number,
  ) => {
    const nextFace: number[] = [];
    for (let idx = 0; idx < face.length; idx++) {
      const current = face[idx];
      const next = face[(idx + 1) % face.length];
      if (current === edgeA && next === edgeB) {
        nextFace.push(cutA, cutB);
        idx++;
        continue;
      }
      if (current === edgeB && next === edgeA) {
        nextFace.push(cutB, cutA);
        idx++;
        continue;
      }
      const mapped = vertexMap[current];
      if (mapped >= 0) nextFace.push(mapped);
    }
    return dedupeSequence(nextFace);
  };

  const replacementForSelectedEndpointInFace = (face: number[], endpointIndex: number) => {
    const endpoint = face[endpointIndex];
    const prev = face[(endpointIndex - 1 + face.length) % face.length];
    const next = face[(endpointIndex + 1) % face.length];
    const prevCut = cutFor(endpoint, prev);
    const nextCut = cutFor(endpoint, next);
    if (prevCut < 0 && nextCut < 0) return [];
    const profile = prevCut >= 0 && nextCut >= 0 ? ensureProfile(endpoint, prev, next) : undefined;
    if (profile) return profile;
    return [prevCut >= 0 ? prevCut : nextCut];
  };

  const replaceSelectedEndpointsInFace = (face: number[]) => {
    const nextFace: number[] = [];
    for (let idx = 0; idx < face.length; idx++) {
      const vertex = face[idx];
      if (selectedSet.has(vertex)) {
        const replacement = replacementForSelectedEndpointInFace(face, idx);
        if (!replacement.length) return [];
        nextFace.push(...replacement);
      } else {
        const mapped = vertexMap[vertex];
        if (mapped >= 0) nextFace.push(mapped);
      }
    }
    return dedupeSequence(nextFace);
  };

  const cutVerticesInCell = (cell: number[]) => {
    const source = new Set(cell);
    const result: number[] = [];
    const seen = new Set<number>();
    for (const cut of cuts) {
      if (!source.has(cut.endpoint) || !source.has(cut.sideNeighbor)) continue;
      if (cut.sideNeighborB !== undefined && !source.has(cut.sideNeighborB)) continue;
      if (cut.profileOuterNeighbor !== undefined && !source.has(cut.profileOuterNeighbor)) continue;
      if (seen.has(cut.vertex)) continue;
      seen.add(cut.vertex);
      result.push(cut.vertex);
    }
    return result;
  };

  const replaceSelectedVerticesInCell = (cell: number[]) => {
    const nextCell: number[] = [];
    const seen = new Set<number>();
    for (const vertex of cell) {
      if (selectedSet.has(vertex)) continue;
      const mapped = vertexMap[vertex];
      if (mapped < 0 || seen.has(mapped)) continue;
      seen.add(mapped);
      nextCell.push(mapped);
    }
    for (const cutVertex of cutVerticesInCell(cell)) {
      if (seen.has(cutVertex)) continue;
      seen.add(cutVertex);
      nextCell.push(cutVertex);
    }
    return nextCell;
  };

  const nextCellsByDim: number[][][] = Array.from({ length: highestSourceDimension + 1 }, () => []);
  nextCellsByDim[0] = Array.from({ length: nextVertex }, (_entry, vertex) => [vertex]);

  for (let dim = 1; dim <= highestSourceDimension; dim++) {
    const signatures = new Set<string>();
    const sourceCells = sourceCellsByDim[dim] ?? [];
    for (let cellId = 0; cellId < sourceCells.length; cellId++) {
      const cell = sourceCells[cellId];
      if (dim === 1 && edgeContainsSelectedBoundary(cell)) continue;
      if (dim === 1 && cell.some(vertex => selectedSet.has(vertex))) {
        const selectedEndpoint = cell.find(vertex => selectedSet.has(vertex)) ?? -1;
        const other = cell.find(vertex => vertex !== selectedEndpoint) ?? -1;
        const cut = cutFor(selectedEndpoint, other);
        const mappedOther = vertexMap[other];
        if (cut >= 0 && mappedOther >= 0) pushUniqueCell(nextCellsByDim[1], [cut, mappedOther], signatures);
        continue;
      }
      if (dim === 2 && cellId === faceCellId) {
        pushUniqueCell(nextCellsByDim[2], selectedFaceReplacement(), signatures);
        continue;
      }
      if (dim === 2) {
        const boundaryEdge = boundaryEdges.find(edge => cell.includes(edge.a) && cell.includes(edge.b));
        if (boundaryEdge) {
          const external = boundaryEdge.externalFaces.find(entry => entry.faceId === cellId);
          const cutA = external ? cutFor(boundaryEdge.a, external.sideA) : -1;
          const cutB = external ? cutFor(boundaryEdge.b, external.sideB) : -1;
          if (cutA >= 0 && cutB >= 0) {
            pushUniqueCell(
              nextCellsByDim[2],
              replaceBoundaryEdgeInFace(cellId, cell, boundaryEdge.a, boundaryEdge.b, cutA, cutB),
              signatures,
            );
            continue;
          }
        }
        if (cell.some(vertex => selectedSet.has(vertex))) {
          pushUniqueCell(nextCellsByDim[2], replaceSelectedEndpointsInFace(cell), signatures);
          continue;
        }
      }
      if (dim >= 3 && cell.some(vertex => selectedSet.has(vertex))) {
        pushUniqueCell(nextCellsByDim[dim], replaceSelectedVerticesInCell(cell), signatures);
        continue;
      }
      const remapped = cell.map(vertex => vertexMap[vertex]).filter(vertex => vertex >= 0);
      pushUniqueCell(nextCellsByDim[dim], remapped.length === cell.length ? remapped : [], signatures);
    }
  }

  const faceSignatures = new Set((nextCellsByDim[2] ?? []).map(sortedCellSignature));
  const addFace = (face: number[]) => {
    const clean = dedupeSequence(face);
    return clean.length >= 3 ? pushUniqueCell(nextCellsByDim[2], clean, faceSignatures) : -1;
  };

  for (const edge of boundaryEdges) {
    for (const external of edge.externalFaces) {
      const profileA = ensureCornerProfileForOuter(edge.a, external.sideA);
      const profileB = ensureCornerProfileForOuter(edge.b, external.sideB);
      if (!profileA || !profileB || profileA.length !== profileB.length || profileA.length < 2) continue;
      for (let step = 0; step < profileA.length - 1; step++) {
        addFace([profileA[step], profileB[step], profileB[step + 1], profileA[step + 1]]);
      }
    }
  }

  const edgeSignatures = new Set((nextCellsByDim[1] ?? []).map(sortedCellSignature));
  for (const faces of nextCellsByDim[2] ? [nextCellsByDim[2]] : []) {
    for (const face of faces) addFaceBoundaryEdges(nextCellsByDim[1], edgeSignatures, face);
  }

  nextCellsByDim[0] = Array.from({ length: nextVertex }, (_entry, vertex) => [vertex]);
  const newCells = nextCellsByDim.map(cells => cells.length ? makeCellDim(cells) : undefined);
  return {
    topology: {
      cells: newCells,
      generatedKind: 'edited',
      sourceDimension: topology.sourceDimension,
    },
    vertexMap,
    vertexCount: nextVertex,
    edges: edgeListFromCells(nextCellsByDim[1]),
    cuts,
    faceVertices: selectedFace,
    smoothness: layerCount,
  };
}

export function bevelSelectedEdges(
  topology: CellTopology | undefined,
  edgeCellIds: number[],
  vertexCount: number,
  smoothness = 1,
): BevelSelectedEdgesResult | undefined {
  if (!topology) return undefined;
  const selectedEdgeIds = edgeCellIds
    .filter((edgeId, index, arr) => Number.isInteger(edgeId) && edgeId >= 0 && arr.indexOf(edgeId) === index)
    .filter(edgeId => edgeId < cellCount(topology, 1));
  if (!selectedEdgeIds.length) return undefined;
  if (selectedEdgeIds.length === 1) return bevelEdge(topology, selectedEdgeIds[0], vertexCount, smoothness);

  const selectedSignatures = new Set<string>();
  for (const edgeId of selectedEdgeIds) {
    const edge = getCellVertices(topology, 1, edgeId);
    if (edge.length >= 2) selectedSignatures.add(sortedCellSignature([edge[0], edge[1]]));
  }

  for (let faceId = 0; faceId < cellCount(topology, 2); faceId++) {
    const face = getCellVertices(topology, 2, faceId);
    if (face.length !== selectedSignatures.size || face.length < 3) continue;
    let matches = true;
    for (let idx = 0; idx < face.length; idx++) {
      const edgeSignature = sortedCellSignature([face[idx], face[(idx + 1) % face.length]]);
      if (!selectedSignatures.has(edgeSignature)) {
        matches = false;
        break;
      }
    }
    if (matches) return bevelFaceBoundary(topology, faceId, vertexCount, smoothness);
  }

  return undefined;
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
