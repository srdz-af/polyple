import { cellCount, getCellVertices, type CellTopology } from './cellTopology';

export const INSET_MAX_AMOUNT = 0.85;

type EditOperationMode = 'grouped' | 'individual';

export function cellVertexSignature(vertices: number[]) {
  return vertices.slice().sort((a, b) => a - b).join(':');
}

export function findCellIdByVertexSignature(topology: CellTopology | undefined, dimension: number, signature: string) {
  const count = cellCount(topology, dimension);
  for (let cellId = 0; cellId < count; cellId++) {
    if (cellVertexSignature(getCellVertices(topology, dimension, cellId)) === signature) return cellId;
  }
  return -1;
}

function normalizeEditOperationMode(mode: EditOperationMode | undefined): EditOperationMode {
  return mode === 'individual' ? 'individual' : 'grouped';
}

function selectedCellComponents(topology: CellTopology | undefined, dimension: number, cellIds: number[]) {
  const count = cellCount(topology, dimension);
  const validCellIds = cellIds
    .filter(cellId => Number.isInteger(cellId) && cellId >= 0 && cellId < count)
    .filter((cellId, index, arr) => arr.indexOf(cellId) === index);
  if (!topology || dimension <= 0 || validCellIds.length <= 1) return validCellIds.map(cellId => [cellId]);

  const lowerCount = cellCount(topology, dimension - 1);
  if (lowerCount <= 0) return validCellIds.map(cellId => [cellId]);

  const cellSets = new Map<number, Set<number>>();
  validCellIds.forEach(cellId => {
    cellSets.set(cellId, new Set(getCellVertices(topology, dimension, cellId)));
  });

  const parent = new Map<number, number>();
  validCellIds.forEach(cellId => parent.set(cellId, cellId));
  const find = (cellId: number): number => {
    const current = parent.get(cellId) ?? cellId;
    if (current === cellId) return current;
    const root = find(current);
    parent.set(cellId, root);
    return root;
  };
  const union = (a: number, b: number) => {
    const rootA = find(a);
    const rootB = find(b);
    if (rootA !== rootB) parent.set(rootB, rootA);
  };

  const boundaryOwners = new Map<string, number>();
  for (const cellId of validCellIds) {
    const selectedSet = cellSets.get(cellId);
    if (!selectedSet) continue;
    for (let lowerId = 0; lowerId < lowerCount; lowerId++) {
      const lowerCell = getCellVertices(topology, dimension - 1, lowerId);
      if (!lowerCell.length || !lowerCell.every(vertex => selectedSet.has(vertex))) continue;
      const signature = cellVertexSignature(lowerCell);
      const owner = boundaryOwners.get(signature);
      if (owner === undefined) boundaryOwners.set(signature, cellId);
      else union(owner, cellId);
    }
  }

  const components = new Map<number, number[]>();
  for (const cellId of validCellIds) {
    const root = find(cellId);
    const component = components.get(root);
    if (component) component.push(cellId);
    else components.set(root, [cellId]);
  }
  return Array.from(components.values());
}

export function selectedCellComponentSignatures(
  topology: CellTopology | undefined,
  dimension: number,
  cellIds: number[],
  mode: EditOperationMode,
) {
  const components = mode === 'grouped'
    ? selectedCellComponents(topology, dimension, cellIds)
    : cellIds.map(cellId => [cellId]);
  return components
    .map(component => component
      .map(cellId => cellVertexSignature(getCellVertices(topology, dimension, cellId)))
      .filter(signature => signature.length > 0))
    .filter(component => component.length > 0);
}

function dimensionMajorPoint(data: Float32Array, vertexCount: number, vertex: number) {
  const dimension = vertexCount > 0 ? Math.floor(data.length / vertexCount) : 0;
  const point = new Float64Array(dimension);
  if (vertex < 0 || vertex >= vertexCount) return point;
  for (let dim = 0; dim < dimension; dim++) point[dim] = data[(dim * vertexCount) + vertex] ?? 0;
  return point;
}

function normalizeVector(vector: Float64Array) {
  let lengthSq = 0;
  for (let dim = 0; dim < vector.length; dim++) lengthSq += vector[dim] * vector[dim];
  if (lengthSq <= 1e-16) return false;
  const invLength = 1 / Math.sqrt(lengthSq);
  for (let dim = 0; dim < vector.length; dim++) vector[dim] *= invLength;
  return true;
}

function objectCenterND(data: Float32Array, vertexCount: number) {
  const dimension = vertexCount > 0 ? Math.floor(data.length / vertexCount) : 0;
  const center = new Float64Array(dimension);
  if (vertexCount <= 0) return center;
  for (let vertex = 0; vertex < vertexCount; vertex++) {
    for (let dim = 0; dim < dimension; dim++) center[dim] += data[(dim * vertexCount) + vertex] ?? 0;
  }
  for (let dim = 0; dim < dimension; dim++) center[dim] /= vertexCount;
  return center;
}

function orthonormalCellVectors(
  data: Float32Array,
  vertexCount: number,
  cell: number[],
) {
  const dimension = vertexCount > 0 ? Math.floor(data.length / vertexCount) : 0;
  if (!cell.length || dimension <= 0) return [];
  const anchor = dimensionMajorPoint(data, vertexCount, cell[0]);
  const basis: Float64Array[] = [];
  for (let idx = 1; idx < cell.length; idx++) {
    const vertex = cell[idx];
    if (vertex < 0 || vertex >= vertexCount) continue;
    const vector = dimensionMajorPoint(data, vertexCount, vertex);
    for (let dim = 0; dim < dimension; dim++) vector[dim] -= anchor[dim];
    for (const basisVector of basis) {
      let dot = 0;
      for (let dim = 0; dim < dimension; dim++) dot += vector[dim] * basisVector[dim];
      for (let dim = 0; dim < dimension; dim++) vector[dim] -= dot * basisVector[dim];
    }
    if (normalizeVector(vector)) basis.push(vector);
  }
  return basis;
}

function orthogonalizeAgainstBasis(vector: Float64Array, basis: Float64Array[]) {
  for (const basisVector of basis) {
    let dot = 0;
    for (let dim = 0; dim < vector.length; dim++) dot += vector[dim] * basisVector[dim];
    for (let dim = 0; dim < vector.length; dim++) vector[dim] -= dot * basisVector[dim];
  }
  return vector;
}

function localExtrusionDirectionForCell(
  data: Float32Array,
  vertexCount: number,
  cell: number[],
  objectCenter: Float64Array,
) {
  const dimension = vertexCount > 0 ? Math.floor(data.length / vertexCount) : 0;
  const direction = new Float64Array(dimension);
  if (!cell.length || dimension <= 0) {
    if (dimension > 0) direction[0] = 1;
    return direction;
  }

  const center = new Float64Array(dimension);
  let validCount = 0;
  for (const vertex of cell) {
    if (vertex < 0 || vertex >= vertexCount) continue;
    validCount++;
    for (let dim = 0; dim < dimension; dim++) center[dim] += data[(dim * vertexCount) + vertex] ?? 0;
  }
  if (validCount > 0) {
    for (let dim = 0; dim < dimension; dim++) {
      center[dim] /= validCount;
      direction[dim] = center[dim] - objectCenter[dim];
    }
  }

  const basis = orthonormalCellVectors(data, vertexCount, cell);
  orthogonalizeAgainstBasis(direction, basis);
  if (normalizeVector(direction)) return direction;

  for (let axis = 0; axis < dimension; axis++) {
    direction.fill(0);
    direction[axis] = 1;
    orthogonalizeAgainstBasis(direction, basis);
    if (normalizeVector(direction)) return direction;
  }

  direction.fill(0);
  if (dimension > 0) direction[0] = 1;
  return direction;
}

export function extrusionDirectionsForCells(
  data: Float32Array,
  vertexCount: number,
  sourceVertices: number[],
  cellVertices: number[][],
) {
  const dimension = vertexCount > 0 ? Math.floor(data.length / vertexCount) : 0;
  const objectCenter = objectCenterND(data, vertexCount);
  const cellDirections = cellVertices.map(cell => localExtrusionDirectionForCell(data, vertexCount, cell, objectCenter));
  return sourceVertices.map(sourceVertex => {
    const direction = new Float64Array(dimension);
    let contributors = 0;
    cellVertices.forEach((cell, idx) => {
      if (!cell.includes(sourceVertex)) return;
      const cellDirection = cellDirections[idx];
      for (let dim = 0; dim < dimension; dim++) direction[dim] += cellDirection[dim];
      contributors++;
    });
    if (contributors <= 0) {
      const fallback = cellDirections[0];
      if (fallback) direction.set(fallback);
    }
    if (!normalizeVector(direction) && dimension > 0) direction[0] = 1;
    return direction;
  });
}


function originalVertexVector(
  original: Float32Array,
  originalVertexCount: number,
  dimension: number,
  vertex: number,
) {
  const vector = new Float64Array(dimension);
  if (vertex < 0 || vertex >= originalVertexCount) return vector;
  for (let dim = 0; dim < dimension; dim++) {
    vector[dim] = original[(dim * originalVertexCount) + vertex] ?? 0;
  }
  return vector;
}

function orthonormalCellBasis(
  original: Float32Array,
  originalVertexCount: number,
  dimension: number,
  cell: number[],
) {
  if (!cell.length) return [];
  const anchor = originalVertexVector(original, originalVertexCount, dimension, cell[0]);
  const basis: Float64Array[] = [];
  const minLengthSq = 1e-16;
  for (let idx = 1; idx < cell.length; idx++) {
    const vertex = cell[idx];
    if (vertex < 0 || vertex >= originalVertexCount) continue;
    const vector = originalVertexVector(original, originalVertexCount, dimension, vertex);
    for (let dim = 0; dim < dimension; dim++) vector[dim] -= anchor[dim];
    for (const basisVector of basis) {
      let dot = 0;
      for (let dim = 0; dim < dimension; dim++) dot += vector[dim] * basisVector[dim];
      for (let dim = 0; dim < dimension; dim++) vector[dim] -= basisVector[dim] * dot;
    }
    let lengthSq = 0;
    for (let dim = 0; dim < dimension; dim++) lengthSq += vector[dim] * vector[dim];
    if (lengthSq <= minLengthSq) continue;
    const invLength = 1 / Math.sqrt(lengthSq);
    for (let dim = 0; dim < dimension; dim++) vector[dim] *= invLength;
    basis.push(vector);
  }
  return basis.map(vector => ({ anchor, vector }));
}

function projectPointToCellSpan(
  point: Float64Array,
  span: Array<{ anchor: Float64Array; vector: Float64Array }>,
) {
  if (!span.length) return point;
  const dimension = point.length;
  const anchor = span[0].anchor;
  const next = new Float64Array(anchor);
  for (const { vector } of span) {
    let dot = 0;
    for (let dim = 0; dim < dimension; dim++) dot += (point[dim] - anchor[dim]) * vector[dim];
    for (let dim = 0; dim < dimension; dim++) next[dim] += vector[dim] * dot;
  }
  return next;
}

function constrainInsetTargetToOwnerCells(
  target: Float64Array,
  original: Float32Array,
  originalVertexCount: number,
  dimension: number,
  sourceVertex: number,
  ownerCells: number[][],
) {
  if (!ownerCells.length) return target;
  const spans = ownerCells
    .map(cell => orthonormalCellBasis(original, originalVertexCount, dimension, cell))
    .filter(span => span.length > 0 && span.length < dimension);
  if (!spans.length) return target;

  let point = target;
  for (let pass = 0; pass < 12; pass++) {
    for (const span of spans) point = projectPointToCellSpan(point, span);
  }

  // Numerical drift can move a constrained point imperceptibly away from the original shared vertex span.
  const source = originalVertexVector(original, originalVertexCount, dimension, sourceVertex);
  let finite = true;
  for (let dim = 0; dim < dimension; dim++) {
    if (!Number.isFinite(point[dim])) finite = false;
  }
  return finite ? point : source;
}

export function writeInsetVertices(
  data: Float32Array,
  original: Float32Array,
  vertexCount: number,
  originalVertexCount: number,
  sourceVertices: number[],
  insetVertices: number[],
  amount: number,
  cellVertices: number[][] = [],
) {
  if (vertexCount <= 0 || originalVertexCount <= 0 || !sourceVertices.length || sourceVertices.length !== insetVertices.length) return;
  const dimension = Math.floor(data.length / vertexCount);
  const originalDimension = Math.floor(original.length / originalVertexCount);
  if (dimension <= 0 || originalDimension !== dimension) return;
  const center = new Float64Array(dimension);
  for (const sourceVertex of sourceVertices) {
    for (let dim = 0; dim < dimension; dim++) {
      center[dim] += original[(dim * originalVertexCount) + sourceVertex] ?? 0;
    }
  }
  for (let dim = 0; dim < dimension; dim++) center[dim] /= sourceVertices.length;
  const t = Math.max(0, Math.min(INSET_MAX_AMOUNT, amount));
  sourceVertices.forEach((sourceVertex, idx) => {
    const insetVertex = insetVertices[idx];
    if (insetVertex < 0 || insetVertex >= vertexCount) return;
    const target = new Float64Array(dimension);
    for (let dim = 0; dim < dimension; dim++) {
      const source = original[(dim * originalVertexCount) + sourceVertex] ?? 0;
      target[dim] = source + ((center[dim] - source) * t);
    }
    const ownerCells = cellVertices.filter(cell => cell.includes(sourceVertex));
    const constrained = constrainInsetTargetToOwnerCells(
      target,
      original,
      originalVertexCount,
      dimension,
      sourceVertex,
      ownerCells,
    );
    for (let dim = 0; dim < dimension; dim++) {
      data[(dim * vertexCount) + insetVertex] = constrained[dim];
    }
  });
}


export function collectEditBevelTargets(
  topology: CellTopology | undefined,
  selection: { dimension: number; cellId: number; cellIds?: number[]; vertices: number[] },
  kind: 'vertex' | 'edge',
  mode: EditOperationMode = 'grouped',
) {
  if (!topology) return null;
  const selectedVertices = selection.vertices
    .filter(vertex => Number.isInteger(vertex) && vertex >= 0)
    .filter((vertex, index, arr) => arr.indexOf(vertex) === index);
  if (!selectedVertices.length) return null;

  if (kind === 'vertex') {
    return {
      targetVertices: selectedVertices,
      targetEdges: [] as Array<[number, number]>,
      targetEdgeIds: [] as number[],
    };
  }

  const targetEdges: Array<[number, number]> = [];
  const targetEdgeIds: number[] = [];
  const seen = new Set<string>();
  const selectedSet = new Set(selectedVertices);
  const addEdge = (edgeId: number, edge: number[]) => {
    if (edge.length < 2) return;
    const a = edge[0];
    const b = edge[1];
    if (!selectedSet.has(a) || !selectedSet.has(b) || a === b) return;
    const signature = a < b ? `${a}:${b}` : `${b}:${a}`;
    if (seen.has(signature)) return;
    seen.add(signature);
    targetEdges.push([a, b]);
    targetEdgeIds.push(edgeId);
  };

  if (selection.dimension === 1) {
    const edgeIds = selection.cellIds?.length ? selection.cellIds : [selection.cellId];
    edgeIds.forEach(edgeId => addEdge(edgeId, getCellVertices(topology, 1, edgeId)));
  } else {
    const selectedCellIds = selection.cellIds?.length ? selection.cellIds : [selection.cellId];
    const selectedCellSets = selectedCellIds
      .map(cellId => new Set(getCellVertices(topology, selection.dimension, cellId)))
      .filter(set => set.size > 0);
    for (let edgeId = 0; edgeId < cellCount(topology, 1); edgeId++) {
      const edge = getCellVertices(topology, 1, edgeId);
      if (edge.length < 2) continue;
      const containingCount = selectedCellSets.filter(cellSet => edge.every(vertex => cellSet.has(vertex))).length;
      if (mode === 'grouped' ? containingCount === 1 : containingCount > 0) addEdge(edgeId, edge);
    }
  }

  return targetEdges.length ? { targetVertices: [] as number[], targetEdges, targetEdgeIds } : null;
}

