import {
  cellCount,
  getCellVertices,
  type BevelEdgeResult,
  type BevelFaceBoundaryResult,
  type BevelSelectedEdgesResult,
  type BevelVertexResult,
  type CellTopology,
} from './cellTopology';

export function compactDimensionMajorVertices(
  data: Float32Array,
  oldVertexCount: number,
  newVertexCount: number,
  vertexMap: Int32Array,
) {
  if (oldVertexCount <= 0 || newVertexCount <= 0) return new Float32Array();
  const dimension = Math.floor(data.length / oldVertexCount);
  const compacted = new Float32Array(dimension * newVertexCount);
  for (let oldVertex = 0; oldVertex < oldVertexCount; oldVertex++) {
    const newVertex = vertexMap[oldVertex];
    if (newVertex < 0) continue;
    for (let dim = 0; dim < dimension; dim++) {
      compacted[(dim * newVertexCount) + newVertex] = data[(dim * oldVertexCount) + oldVertex];
    }
  }
  return compacted;
}

export function appendDimensionMajorDuplicateVertices(
  data: Float32Array,
  oldVertexCount: number,
  sourceVertices: number[],
) {
  if (oldVertexCount <= 0 || !sourceVertices.length) return new Float32Array(data);
  const dimension = Math.floor(data.length / oldVertexCount);
  const newVertexCount = oldVertexCount + sourceVertices.length;
  const expanded = new Float32Array(dimension * newVertexCount);
  for (let dim = 0; dim < dimension; dim++) {
    const oldOffset = dim * oldVertexCount;
    const newOffset = dim * newVertexCount;
    expanded.set(data.subarray(oldOffset, oldOffset + oldVertexCount), newOffset);
    sourceVertices.forEach((sourceVertex, duplicateIndex) => {
      expanded[newOffset + oldVertexCount + duplicateIndex] = data[oldOffset + sourceVertex] ?? 0;
    });
  }
  return expanded;
}

export const BEVEL_MAX_AMOUNT = 0.995;

type BevelSphereBase = {
  dimension: number;
  origin: number[];
  tangentDistance: number;
  directions: Map<number, Float64Array>;
};

type LocalBevelSphere = {
  center: Float64Array;
  radius: number;
  endpointRadials: Map<number, Float64Array>;
};

function vectorDot(a: ArrayLike<number>, b: ArrayLike<number>) {
  let dot = 0;
  for (let i = 0; i < a.length; i++) dot += a[i] * b[i];
  return dot;
}

function vectorLength(vector: ArrayLike<number>) {
  return Math.sqrt(vectorDot(vector, vector));
}

function normalizedDeltaFromVertex(
  data: Float32Array,
  vertexCount: number,
  dimension: number,
  origin: number[],
  vertex: number,
) {
  const direction = new Float64Array(dimension);
  let lengthSq = 0;
  for (let dim = 0; dim < dimension; dim++) {
    const delta = (data[(dim * vertexCount) + vertex] ?? origin[dim]) - origin[dim];
    direction[dim] = delta;
    lengthSq += delta * delta;
  }
  const length = Math.sqrt(lengthSq);
  if (length <= 1e-8) return null;
  for (let dim = 0; dim < dimension; dim++) direction[dim] /= length;
  return { direction, length };
}

function solveLinearSystem(matrix: number[][], rhs: number[]) {
  const size = rhs.length;
  const augmented = matrix.map((row, idx) => [...row, rhs[idx]]);
  for (let col = 0; col < size; col++) {
    let pivot = col;
    for (let row = col + 1; row < size; row++) {
      if (Math.abs(augmented[row][col]) > Math.abs(augmented[pivot][col])) pivot = row;
    }
    if (Math.abs(augmented[pivot][col]) <= 1e-8) return null;
    if (pivot !== col) [augmented[pivot], augmented[col]] = [augmented[col], augmented[pivot]];

    const divisor = augmented[col][col];
    for (let entry = col; entry <= size; entry++) augmented[col][entry] /= divisor;
    for (let row = 0; row < size; row++) {
      if (row === col) continue;
      const factor = augmented[row][col];
      if (Math.abs(factor) <= 1e-12) continue;
      for (let entry = col; entry <= size; entry++) augmented[row][entry] -= factor * augmented[col][entry];
    }
  }
  return augmented.map(row => row[size]);
}

function slerpUnitVectors(a: ArrayLike<number>, b: ArrayLike<number>, t: number) {
  const dot = Math.max(-1, Math.min(1, vectorDot(a, b)));
  const result = new Float64Array(a.length);
  if (1 - Math.abs(dot) <= 1e-6) {
    for (let i = 0; i < a.length; i++) result[i] = ((1 - t) * a[i]) + (t * b[i]);
    const length = vectorLength(result);
    if (length > 1e-8) {
      for (let i = 0; i < result.length; i++) result[i] /= length;
    }
    return result;
  }

  const theta = Math.acos(dot);
  const sinTheta = Math.sin(theta);
  const wa = Math.sin((1 - t) * theta) / sinTheta;
  const wb = Math.sin(t * theta) / sinTheta;
  for (let i = 0; i < a.length; i++) result[i] = (wa * a[i]) + (wb * b[i]);
  return result;
}

function buildBevelSphere(
  data: Float32Array,
  oldVertexCount: number,
  selectedVertex: number,
  bevel: BevelVertexResult,
  amount: number,
): BevelSphereBase | null {
  const dimension = oldVertexCount > 0 ? Math.floor(data.length / oldVertexCount) : 0;
  if (dimension <= 0) return null;

  const origin = Array.from({ length: dimension }, (_entry, dim) => (
    data[(dim * oldVertexCount) + selectedVertex] ?? 0
  ));
  const neighborIds = Array.from(new Set(bevel.cuts.flatMap(cut => cut.neighbors)));
  const directions = new Map<number, Float64Array>();
  let minLength = Number.POSITIVE_INFINITY;
  for (const neighbor of neighborIds) {
    const delta = normalizedDeltaFromVertex(data, oldVertexCount, dimension, origin, neighbor);
    if (!delta) continue;
    directions.set(neighbor, delta.direction);
    minLength = Math.min(minLength, delta.length);
  }
  if (!directions.size || !Number.isFinite(minLength)) return null;

  const tangentDistance = Math.max(0, Math.min(BEVEL_MAX_AMOUNT, amount)) * minLength;
  if (tangentDistance <= 1e-8) return null;
  return {
    dimension,
    origin,
    tangentDistance,
    directions,
  };
}

function buildLocalBevelSphere(
  sphere: BevelSphereBase,
  neighborIds: number[],
): LocalBevelSphere | null {
  const activeNeighbors = Array.from(new Set(neighborIds))
    .filter(neighbor => sphere.directions.has(neighbor));
  if (activeNeighbors.length < 2) return null;
  const gram = activeNeighbors.map(a => activeNeighbors.map(b => (
    vectorDot(sphere.directions.get(a) ?? [], sphere.directions.get(b) ?? [])
  )));
  const rhs = activeNeighbors.map(() => sphere.tangentDistance);
  const coefficients = solveLinearSystem(gram, rhs);
  if (!coefficients) return null;

  const center = new Float64Array(sphere.dimension);
  activeNeighbors.forEach((neighbor, idx) => {
    const direction = sphere.directions.get(neighbor);
    if (!direction) return;
    const coefficient = coefficients[idx] ?? 0;
    for (let dim = 0; dim < sphere.dimension; dim++) center[dim] += coefficient * direction[dim];
  });

  const endpointRadials = new Map<number, Float64Array>();
  let radius = 0;
  for (const neighbor of activeNeighbors) {
    const direction = sphere.directions.get(neighbor);
    if (!direction) continue;
    const radial = new Float64Array(sphere.dimension);
    for (let dim = 0; dim < sphere.dimension; dim++) radial[dim] = (direction[dim] * sphere.tangentDistance) - center[dim];
    const radialLength = vectorLength(radial);
    if (radialLength <= 1e-8) continue;
    radius += radialLength;
    for (let dim = 0; dim < sphere.dimension; dim++) radial[dim] /= radialLength;
    endpointRadials.set(neighbor, radial);
  }
  if (!endpointRadials.size) return null;
  radius /= endpointRadials.size;

  return {
    center,
    radius,
    endpointRadials,
  };
}

function bevelArcPoint(
  sphere: BevelSphereBase,
  fromNeighbor: number,
  toNeighbor: number,
  fromWeight: number,
  toWeight: number,
) {
  const localSphere = buildLocalBevelSphere(sphere, [fromNeighbor, toNeighbor]);
  if (!localSphere) return null;

  const from = localSphere.endpointRadials.get(fromNeighbor);
  const to = localSphere.endpointRadials.get(toNeighbor);
  const total = fromWeight + toWeight;
  if (!from || !to || total <= 1e-8) return null;

  const radial = slerpUnitVectors(from, to, toWeight / total);
  const point = new Float64Array(sphere.dimension);
  for (let dim = 0; dim < sphere.dimension; dim++) {
    point[dim] = sphere.origin[dim]
      + localSphere.center[dim]
      + (radial[dim] * localSphere.radius);
  }
  return point;
}

function bevelEndpointPoint(sphere: BevelSphereBase, neighbor: number) {
  const direction = sphere.directions.get(neighbor);
  if (!direction) return null;
  const point = new Float64Array(sphere.dimension);
  for (let dim = 0; dim < sphere.dimension; dim++) {
    point[dim] = sphere.origin[dim] + (direction[dim] * sphere.tangentDistance);
  }
  return point;
}

function blendedBevelCapPoint(
  sphere: BevelSphereBase,
  neighbors: number[],
  weights: number[],
) {
  const point = new Float64Array(sphere.dimension);
  let totalWeight = 0;
  for (let i = 0; i < neighbors.length - 1; i++) {
    const weightA = weights[i] ?? 0;
    if (weightA <= 0) continue;
    for (let j = i + 1; j < neighbors.length; j++) {
      const weightB = weights[j] ?? 0;
      if (weightB <= 0) continue;
      const pairPoint = bevelArcPoint(sphere, neighbors[i], neighbors[j], weightA, weightB);
      if (!pairPoint) continue;

      const pairWeight = weightA * weightB;
      totalWeight += pairWeight;
      for (let dim = 0; dim < sphere.dimension; dim++) point[dim] += pairPoint[dim] * pairWeight;
    }
  }

  if (totalWeight <= 1e-8) return null;
  for (let dim = 0; dim < sphere.dimension; dim++) point[dim] /= totalWeight;
  return point;
}

function circleProfileFullness(segments: number) {
  const known = [0, 0.559, 0.642, 0.551, 0.646, 0.624, 0.646, 0.619, 0.647, 0.639, 0.647];
  if (segments >= 1 && segments <= known.length) return known[segments - 1];
  return segments % 2 === 0
    ? (2.4506 * 0.5) - (0.000003 * segments) - 0.6266
    : (2.3635 * 0.5) + (0.000152 * segments) - 0.6060;
}

function boundaryProfilePoint(
  sphere: BevelSphereBase,
  neighbors: number[],
  weights: number[],
) {
  const active: Array<{ neighbor: number; weight: number }> = [];
  for (let idx = 0; idx < neighbors.length; idx++) {
    const weight = weights[idx] ?? 0;
    if (weight > 1e-8) active.push({ neighbor: neighbors[idx], weight });
  }
  if (active.length === 1) return bevelEndpointPoint(sphere, active[0].neighbor);
  if (active.length === 2) {
    return bevelArcPoint(
      sphere,
      active[0].neighbor,
      active[1].neighbor,
      active[0].weight,
      active[1].weight,
    );
  }
  return null;
}

function blenderStyleBevelCapPoint(
  sphere: BevelSphereBase,
  neighbors: number[],
  weights: number[],
  segments: number,
) {
  if (neighbors.length < 3) return null;
  const total = weights.reduce((sum, weight) => sum + Math.max(0, weight), 0);
  if (total <= 1e-8) return null;

  const normalized = weights.map(weight => Math.max(0, weight) / total);
  const minWeight = Math.min(...normalized);
  const centerT = Math.min(1, Math.max(0, minWeight * neighbors.length));

  const endpoints = neighbors.map(neighbor => bevelEndpointPoint(sphere, neighbor));
  if (endpoints.some(point => !point)) return null;

  const boundCenter = new Float64Array(sphere.dimension);
  for (const endpoint of endpoints) {
    if (!endpoint) continue;
    for (let dim = 0; dim < sphere.dimension; dim++) boundCenter[dim] += endpoint[dim] / endpoints.length;
  }

  const fullness = Math.min(1, Math.max(0, circleProfileFullness(segments)));
  const center = new Float64Array(sphere.dimension);
  for (let dim = 0; dim < sphere.dimension; dim++) {
    center[dim] = boundCenter[dim] + ((sphere.origin[dim] - boundCenter[dim]) * fullness);
  }

  if (centerT >= 1 - 1e-8) return center;

  const boundaryScale = 1 - (neighbors.length * minWeight);
  const boundaryWeights = boundaryScale > 1e-8
    ? normalized.map(weight => (weight - minWeight) / boundaryScale)
    : normalized;
  const boundary = boundaryProfilePoint(sphere, neighbors, boundaryWeights);
  if (!boundary) return center;

  const point = new Float64Array(sphere.dimension);
  for (let dim = 0; dim < sphere.dimension; dim++) {
    point[dim] = boundary[dim] + ((center[dim] - boundary[dim]) * centerT);
  }
  return point;
}

type AdjacentBevelVMesh = {
  count: number;
  seg: number;
  dimension: number;
  points: Array<Float64Array | undefined>;
};

function bevelVMeshIndex(vm: AdjacentBevelVMesh, side: number, ring: number, segment: number) {
  const ringCount = Math.floor(vm.seg / 2) + 1;
  return (((side * ringCount) + ring) * (vm.seg + 1)) + segment;
}

function bevelVMeshCanonical(vm: AdjacentBevelVMesh, side: number, ring: number, segment: number) {
  const count = vm.count;
  const seg = vm.seg;
  const half = Math.floor(seg / 2);
  const odd = seg % 2;
  const normalizedSide = ((side % count) + count) % count;
  if (!odd && ring === half && segment === half) return [0, ring, segment] as const;
  if (ring <= half - 1 + odd && segment <= half) return [normalizedSide, ring, segment] as const;
  if (segment <= half) return [((normalizedSide + count - 1) % count), segment, seg - ring] as const;
  return [((normalizedSide + 1) % count), seg - segment, ring] as const;
}

function createAdjacentBevelVMesh(count: number, seg: number, dimension: number): AdjacentBevelVMesh {
  const ringCount = Math.floor(seg / 2) + 1;
  return {
    count,
    seg,
    dimension,
    points: new Array(count * ringCount * (seg + 1)),
  };
}

function cloneVector(vector: ArrayLike<number>) {
  return Float64Array.from(Array.from({ length: vector.length }, (_entry, index) => vector[index] ?? 0));
}

function zeroVector(dimension: number) {
  return new Float64Array(dimension);
}

function addScaledVector(target: Float64Array, vector: ArrayLike<number>, scale: number) {
  for (let dim = 0; dim < target.length; dim++) target[dim] += (vector[dim] ?? 0) * scale;
}

function scaleVector(vector: Float64Array, scale: number) {
  for (let dim = 0; dim < vector.length; dim++) vector[dim] *= scale;
  return vector;
}

function averageVectors(vectors: Array<ArrayLike<number>>, dimension: number) {
  const result = zeroVector(dimension);
  if (!vectors.length) return result;
  for (const vector of vectors) addScaledVector(result, vector, 1 / vectors.length);
  return result;
}

function setBevelVMeshPoint(
  vm: AdjacentBevelVMesh,
  side: number,
  ring: number,
  segment: number,
  point: ArrayLike<number>,
) {
  const [canonicalSide, canonicalRing, canonicalSegment] = bevelVMeshCanonical(vm, side, ring, segment);
  vm.points[bevelVMeshIndex(vm, canonicalSide, canonicalRing, canonicalSegment)] = cloneVector(point);
}

function getBevelVMeshPoint(
  vm: AdjacentBevelVMesh,
  side: number,
  ring: number,
  segment: number,
) {
  const [canonicalSide, canonicalRing, canonicalSegment] = bevelVMeshCanonical(vm, side, ring, segment);
  return vm.points[bevelVMeshIndex(vm, canonicalSide, canonicalRing, canonicalSegment)] ?? zeroVector(vm.dimension);
}

function bevelProfileFallbackPoint(sphere: BevelSphereBase, fromNeighbor: number, toNeighbor: number, t: number) {
  const from = bevelEndpointPoint(sphere, fromNeighbor);
  const to = bevelEndpointPoint(sphere, toNeighbor);
  if (!from || !to) return null;
  const point = zeroVector(sphere.dimension);
  addScaledVector(point, from, 1 - t);
  addScaledVector(point, to, t);
  return point;
}

function bevelPatchProfilePoint(
  sphere: BevelSphereBase,
  orderedNeighbors: number[],
  side: number,
  segment: number,
  segments: number,
) {
  const count = orderedNeighbors.length;
  const from = orderedNeighbors[((side % count) + count) % count];
  const to = orderedNeighbors[(side + 1) % count];
  if (segment <= 0) return bevelEndpointPoint(sphere, from);
  if (segment >= segments) return bevelEndpointPoint(sphere, to);
  return bevelArcPoint(sphere, from, to, segments - segment, segment)
    ?? bevelProfileFallbackPoint(sphere, from, to, segment / segments);
}

function sabinGamma(valence: number) {
  if (valence < 3) return 0;
  if (valence === 3) return 0.065247584;
  if (valence === 4) return 0.25;
  if (valence === 5) return 0.401983447;
  if (valence === 6) return 0.523423277;
  const k = Math.cos(Math.PI / valence);
  const k2 = k * k;
  const k4 = k2 * k2;
  const k6 = k4 * k2;
  const y = Math.cbrt((Math.sqrt(3) * Math.sqrt((64 * k6) - (144 * k4) + (135 * k2) - 27)) + (9 * k));
  const x = (0.480749856769136 * y) - ((0.231120424783545 * ((12 * k2) - 9)) / y);
  return ((k * x) + (2 * k2) - 1) / (x * x * ((k * x) + 1));
}

function buildInitialAdjacentBevelVMesh(
  sphere: BevelSphereBase,
  orderedNeighbors: number[],
  targetSegments: number,
) {
  const vm = createAdjacentBevelVMesh(orderedNeighbors.length, 2, sphere.dimension);
  const boundaryCorners: Float64Array[] = [];
  for (let side = 0; side < orderedNeighbors.length; side++) {
    for (let segment = 0; segment <= 2; segment++) {
      const point = bevelPatchProfilePoint(sphere, orderedNeighbors, side, segment, 2);
      if (point) setBevelVMeshPoint(vm, side, 0, segment, point);
      if (segment === 0 && point) boundaryCorners.push(point);
    }
  }

  const boundaryCenter = averageVectors(boundaryCorners, sphere.dimension);
  const fullness = Math.min(1, Math.max(0, circleProfileFullness(targetSegments)));
  const center = cloneVector(boundaryCenter);
  for (let dim = 0; dim < sphere.dimension; dim++) {
    center[dim] += ((sphere.origin[dim] ?? 0) - boundaryCenter[dim]) * fullness;
  }
  setBevelVMeshPoint(vm, 0, 1, 1, center);
  return vm;
}

function copyAdjustedBoundary(source: AdjacentBevelVMesh, target: AdjacentBevelVMesh) {
  const adjusted = createAdjacentBevelVMesh(source.count, source.seg, source.dimension);
  for (let side = 0; side < source.count; side++) {
    for (let ring = 0; ring <= Math.floor(source.seg / 2); ring++) {
      for (let segment = 0; segment <= source.seg; segment++) {
        setBevelVMeshPoint(adjusted, side, ring, segment, getBevelVMeshPoint(source, side, ring, segment));
      }
    }
  }
  for (let side = 0; side < source.count; side++) {
    for (let segment = 0; segment < source.seg; segment++) {
      setBevelVMeshPoint(adjusted, side, 0, segment, getBevelVMeshPoint(target, side, 0, segment * 2));
    }
  }
  return adjusted;
}

function cubicSubdivideBevelVMesh(
  input: AdjacentBevelVMesh,
  sphere: BevelSphereBase,
  orderedNeighbors: number[],
) {
  const nsIn = input.seg;
  const nsInHalf = Math.floor(nsIn / 2);
  const nsOut = nsIn * 2;
  const output = createAdjacentBevelVMesh(input.count, nsOut, input.dimension);

  for (let side = 0; side < input.count; side++) {
    setBevelVMeshPoint(output, side, 0, 0, getBevelVMeshPoint(input, side, 0, 0));
    for (let segment = 1; segment < nsIn; segment++) {
      const point = cloneVector(getBevelVMeshPoint(input, side, 0, segment));
      const acc = zeroVector(input.dimension);
      addScaledVector(acc, getBevelVMeshPoint(input, side, 0, segment - 1), 1);
      addScaledVector(acc, getBevelVMeshPoint(input, side, 0, segment + 1), 1);
      addScaledVector(acc, point, -2);
      addScaledVector(point, acc, -1 / 6);
      setBevelVMeshPoint(output, side, 0, segment * 2, point);
    }
  }

  for (let side = 0; side < input.count; side++) {
    for (let segment = 1; segment < nsOut; segment += 2) {
      const point = bevelPatchProfilePoint(sphere, orderedNeighbors, side, segment, nsOut);
      if (!point) continue;
      const acc = zeroVector(input.dimension);
      addScaledVector(acc, getBevelVMeshPoint(output, side, 0, segment - 1), 1);
      addScaledVector(acc, getBevelVMeshPoint(output, side, 0, segment + 1), 1);
      addScaledVector(acc, point, -2);
      addScaledVector(point, acc, -1 / 6);
      setBevelVMeshPoint(output, side, 0, segment, point);
    }
  }

  const adjustedInput = copyAdjustedBoundary(input, output);

  for (let side = 0; side < input.count; side++) {
    for (let ring = 0; ring < nsInHalf; ring++) {
      for (let segment = 0; segment < nsInHalf; segment++) {
        const point = averageVectors([
          getBevelVMeshPoint(adjustedInput, side, ring, segment),
          getBevelVMeshPoint(adjustedInput, side, ring, segment + 1),
          getBevelVMeshPoint(adjustedInput, side, ring + 1, segment),
          getBevelVMeshPoint(adjustedInput, side, ring + 1, segment + 1),
        ], input.dimension);
        setBevelVMeshPoint(output, side, (2 * ring) + 1, (2 * segment) + 1, point);
      }
    }
  }

  for (let side = 0; side < input.count; side++) {
    for (let ring = 0; ring < nsInHalf; ring++) {
      for (let segment = 1; segment <= nsInHalf; segment++) {
        const point = averageVectors([
          getBevelVMeshPoint(adjustedInput, side, ring, segment),
          getBevelVMeshPoint(adjustedInput, side, ring + 1, segment),
          getBevelVMeshPoint(output, side, (2 * ring) + 1, (2 * segment) - 1),
          getBevelVMeshPoint(output, side, (2 * ring) + 1, (2 * segment) + 1),
        ], input.dimension);
        setBevelVMeshPoint(output, side, (2 * ring) + 1, 2 * segment, point);
      }
    }
  }

  for (let side = 0; side < input.count; side++) {
    for (let ring = 1; ring < nsInHalf; ring++) {
      for (let segment = 0; segment < nsInHalf; segment++) {
        const point = averageVectors([
          getBevelVMeshPoint(adjustedInput, side, ring, segment),
          getBevelVMeshPoint(adjustedInput, side, ring, segment + 1),
          getBevelVMeshPoint(output, side, (2 * ring) - 1, (2 * segment) + 1),
          getBevelVMeshPoint(output, side, (2 * ring) + 1, (2 * segment) + 1),
        ], input.dimension);
        setBevelVMeshPoint(output, side, 2 * ring, (2 * segment) + 1, point);
      }
    }
  }

  const gamma = 0.25;
  const beta = -gamma;
  for (let side = 0; side < input.count; side++) {
    for (let ring = 1; ring < nsInHalf; ring++) {
      for (let segment = 1; segment <= nsInHalf; segment++) {
        const edgeCenter = averageVectors([
          getBevelVMeshPoint(output, side, 2 * ring, (2 * segment) - 1),
          getBevelVMeshPoint(output, side, 2 * ring, (2 * segment) + 1),
          getBevelVMeshPoint(output, side, (2 * ring) - 1, 2 * segment),
          getBevelVMeshPoint(output, side, (2 * ring) + 1, 2 * segment),
        ], input.dimension);
        const faceCenter = averageVectors([
          getBevelVMeshPoint(output, side, (2 * ring) - 1, (2 * segment) - 1),
          getBevelVMeshPoint(output, side, (2 * ring) + 1, (2 * segment) - 1),
          getBevelVMeshPoint(output, side, (2 * ring) - 1, (2 * segment) + 1),
          getBevelVMeshPoint(output, side, (2 * ring) + 1, (2 * segment) + 1),
        ], input.dimension);
        const point = cloneVector(edgeCenter);
        addScaledVector(point, faceCenter, beta);
        addScaledVector(point, getBevelVMeshPoint(adjustedInput, side, ring, segment), gamma);
        setBevelVMeshPoint(output, side, 2 * ring, 2 * segment, point);
      }
    }
  }

  const centerGamma = sabinGamma(input.count);
  const centerBeta = -centerGamma;
  const edgeSum = zeroVector(input.dimension);
  const faceSum = zeroVector(input.dimension);
  for (let side = 0; side < input.count; side++) {
    addScaledVector(edgeSum, getBevelVMeshPoint(output, side, nsIn, nsIn - 1), 1);
    addScaledVector(faceSum, getBevelVMeshPoint(output, side, nsIn - 1, nsIn - 1), 1);
    addScaledVector(faceSum, getBevelVMeshPoint(output, side, nsIn - 1, nsIn + 1), 1);
  }
  scaleVector(edgeSum, 1 / input.count);
  const center = cloneVector(edgeSum);
  addScaledVector(center, faceSum, centerBeta / (2 * input.count));
  addScaledVector(center, getBevelVMeshPoint(adjustedInput, 0, nsInHalf, nsInHalf), centerGamma);
  for (let side = 0; side < input.count; side++) setBevelVMeshPoint(output, side, nsIn, nsIn, center);

  for (let side = 0; side < input.count; side++) {
    for (let segment = 0; segment <= nsOut; segment++) {
      const point = bevelPatchProfilePoint(sphere, orderedNeighbors, side, segment, nsOut);
      if (point) setBevelVMeshPoint(output, side, 0, segment, point);
    }
  }
  return output;
}

function sampleBevelVMesh(source: AdjacentBevelVMesh, side: number, ring: number, segment: number) {
  const maxRing = Math.floor(source.seg / 2);
  const clampedRing = Math.max(0, Math.min(maxRing, ring));
  const clampedSegment = Math.max(0, Math.min(source.seg, segment));
  const r0 = Math.floor(clampedRing);
  const r1 = Math.min(maxRing, Math.ceil(clampedRing));
  const s0 = Math.floor(clampedSegment);
  const s1 = Math.min(source.seg, Math.ceil(clampedSegment));
  const rt = clampedRing - r0;
  const st = clampedSegment - s0;
  const p00 = getBevelVMeshPoint(source, side, r0, s0);
  const p10 = getBevelVMeshPoint(source, side, r1, s0);
  const p01 = getBevelVMeshPoint(source, side, r0, s1);
  const p11 = getBevelVMeshPoint(source, side, r1, s1);
  const point = zeroVector(source.dimension);
  addScaledVector(point, p00, (1 - rt) * (1 - st));
  addScaledVector(point, p10, rt * (1 - st));
  addScaledVector(point, p01, (1 - rt) * st);
  addScaledVector(point, p11, rt * st);
  return point;
}

function resampleBevelVMesh(
  source: AdjacentBevelVMesh,
  targetSegments: number,
  sphere: BevelSphereBase,
  orderedNeighbors: number[],
) {
  const target = createAdjacentBevelVMesh(source.count, targetSegments, source.dimension);
  const scale = source.seg / targetSegments;
  const targetHalf = Math.floor(targetSegments / 2);
  for (let side = 0; side < target.count; side++) {
    for (let ring = 0; ring <= targetHalf; ring++) {
      for (let segment = 0; segment <= targetSegments; segment++) {
        const point = sampleBevelVMesh(source, side, ring * scale, segment * scale);
        setBevelVMeshPoint(target, side, ring, segment, point);
      }
    }
  }
  for (let side = 0; side < target.count; side++) {
    for (let segment = 0; segment <= targetSegments; segment++) {
      const point = bevelPatchProfilePoint(sphere, orderedNeighbors, side, segment, targetSegments);
      if (point) setBevelVMeshPoint(target, side, 0, segment, point);
    }
  }
  return target;
}

function buildAdjacentBevelPatchVMesh(
  sphere: BevelSphereBase,
  orderedNeighbors: number[],
  targetSegments: number,
) {
  if (orderedNeighbors.length < 3 || targetSegments < 2) return null;
  let vm = buildInitialAdjacentBevelVMesh(sphere, orderedNeighbors, targetSegments);
  while (vm.seg < targetSegments) vm = cubicSubdivideBevelVMesh(vm, sphere, orderedNeighbors);
  if (vm.seg !== targetSegments) vm = resampleBevelVMesh(vm, targetSegments, sphere, orderedNeighbors);
  return vm;
}

function writeDimensionMajorBevelPoint(
  data: Float32Array,
  vertexCount: number,
  vertex: number,
  point: ArrayLike<number>,
  origin: ArrayLike<number>,
  inward: boolean,
) {
  for (let dim = 0; dim < point.length; dim++) {
    const value = inward ? origin[dim] - (point[dim] - origin[dim]) : point[dim];
    data[(dim * vertexCount) + vertex] = value;
  }
}

function applyBeveledVertexPatches(
  data: Float32Array,
  bevel: BevelVertexResult,
  sphereFor: (sourceVertex: number) => BevelSphereBase | null,
  inward: boolean,
) {
  for (const patch of bevel.patches) {
    const sphere = sphereFor(patch.sourceVertex);
    if (!sphere) continue;
    const vm = buildAdjacentBevelPatchVMesh(sphere, patch.orderedNeighbors, patch.segments);
    if (!vm) continue;
    for (const pointRef of patch.points) {
      const point = getBevelVMeshPoint(vm, pointRef.side, pointRef.ring, pointRef.segment);
      writeDimensionMajorBevelPoint(data, bevel.vertexCount, pointRef.vertex, point, sphere.origin, inward);
    }
  }
}

export function buildBeveledVertexData(
  data: Float32Array,
  oldVertexCount: number,
  selectedVertex: number,
  bevel: BevelVertexResult,
  amount: number,
  inward = false,
) {
  const dimension = oldVertexCount > 0 ? Math.floor(data.length / oldVertexCount) : 0;
  const next = new Float32Array(dimension * bevel.vertexCount);
  for (let oldVertex = 0; oldVertex < oldVertexCount; oldVertex++) {
    const mapped = bevel.vertexMap[oldVertex];
    if (mapped < 0) continue;
    for (let dim = 0; dim < dimension; dim++) {
      next[(dim * bevel.vertexCount) + mapped] = data[(dim * oldVertexCount) + oldVertex];
    }
  }

  const spheres = new Map<number, BevelSphereBase | null>();
  const sphereFor = (sourceVertex: number) => {
    if (!spheres.has(sourceVertex)) {
      spheres.set(sourceVertex, buildBevelSphere(data, oldVertexCount, sourceVertex, bevel, amount));
    }
    return spheres.get(sourceVertex) ?? null;
  };
  for (const cut of bevel.cuts) {
    const sourceVertex = cut.sourceVertex ?? selectedVertex;
    const sphere = sphereFor(sourceVertex);
    if (!sphere) continue;
    if (cut.neighbors.length === 1) {
      const point = bevelEndpointPoint(sphere, cut.neighbors[0]);
      if (point) writeDimensionMajorBevelPoint(next, bevel.vertexCount, cut.vertex, point, sphere.origin, inward);
      continue;
    }

    let point: Float64Array | null = null;
    if (cut.neighbors.length === 2) {
      point = bevelArcPoint(
        sphere,
        cut.neighbors[0],
        cut.neighbors[1],
        cut.weights[0] ?? 0,
        cut.weights[1] ?? 0,
      );
    } else {
      point = blenderStyleBevelCapPoint(sphere, cut.neighbors, cut.weights, bevel.smoothness)
        ?? blendedBevelCapPoint(sphere, cut.neighbors, cut.weights);
    }
    if (!point) continue;

    writeDimensionMajorBevelPoint(next, bevel.vertexCount, cut.vertex, point, sphere.origin, inward);
  }
  applyBeveledVertexPatches(next, bevel, sphereFor, inward);
  return next;
}

export function buildBeveledEdgeData(
  data: Float32Array,
  oldVertexCount: number,
  bevel: BevelEdgeResult | BevelFaceBoundaryResult | BevelSelectedEdgesResult,
  amount: number,
  fixedDistance?: number,
  inward = false,
) {
  const dimension = oldVertexCount > 0 ? Math.floor(data.length / oldVertexCount) : 0;
  const next = new Float32Array(dimension * bevel.vertexCount);
  for (let oldVertex = 0; oldVertex < oldVertexCount; oldVertex++) {
    const mapped = bevel.vertexMap[oldVertex];
    if (mapped < 0) continue;
    for (let dim = 0; dim < dimension; dim++) {
      next[(dim * bevel.vertexCount) + mapped] = data[(dim * oldVertexCount) + oldVertex];
    }
  }

  let minLength = Number.POSITIVE_INFINITY;
  for (const cut of bevel.cuts) {
    for (const neighbor of [cut.sideNeighbor, cut.sideNeighborB, cut.profileOuterNeighbor]) {
      if (neighbor === undefined) continue;
      let lengthSq = 0;
      for (let dim = 0; dim < dimension; dim++) {
        const delta = data[(dim * oldVertexCount) + neighbor] - data[(dim * oldVertexCount) + cut.endpoint];
        lengthSq += delta * delta;
      }
      const length = Math.sqrt(lengthSq);
      if (length > 1e-8) minLength = Math.min(minLength, length);
    }
  }
  if (!Number.isFinite(minLength)) return next;

  const unitDirection = (endpoint: number, neighbor: number) => {
    const direction = new Float64Array(dimension);
    let lengthSq = 0;
    for (let dim = 0; dim < dimension; dim++) {
      const delta = data[(dim * oldVertexCount) + neighbor] - data[(dim * oldVertexCount) + endpoint];
      direction[dim] = delta;
      lengthSq += delta * delta;
    }
    const length = Math.sqrt(lengthSq);
    if (length <= 1e-8) return null;
    for (let dim = 0; dim < dimension; dim++) direction[dim] /= length;
    return { direction, length };
  };

  const distance = fixedDistance ?? (Math.max(0, Math.min(BEVEL_MAX_AMOUNT, amount)) * minLength);
  const reflectPointAcrossChord = (
    point: Float64Array,
    start: Float64Array,
    end: Float64Array,
  ) => {
    const chord = new Float64Array(dimension);
    const rel = new Float64Array(dimension);
    let chordLengthSq = 0;
    let relDotChord = 0;
    for (let dim = 0; dim < dimension; dim++) {
      chord[dim] = end[dim] - start[dim];
      rel[dim] = point[dim] - start[dim];
      chordLengthSq += chord[dim] * chord[dim];
      relDotChord += rel[dim] * chord[dim];
    }
    if (chordLengthSq <= 1e-8) return point;
    const projectedT = relDotChord / chordLengthSq;
    const reflected = new Float64Array(dimension);
    for (let dim = 0; dim < dimension; dim++) {
      const projection = start[dim] + (chord[dim] * projectedT);
      reflected[dim] = (projection * 2) - point[dim];
    }
    return reflected;
  };
  for (const cut of bevel.cuts) {
    const endpoint = cut.endpoint;
    const first = unitDirection(endpoint, cut.sideNeighbor);
    if (!first) continue;

    if (cut.sideNeighborB === undefined) {
      const cutDistance = Math.min(distance, first.length * BEVEL_MAX_AMOUNT);
      for (let dim = 0; dim < dimension; dim++) {
        const origin = data[(dim * oldVertexCount) + endpoint];
        const displacement = first.direction[dim] * cutDistance;
        next[(dim * bevel.vertexCount) + cut.vertex] = origin + displacement;
      }
      continue;
    }

    const second = unitDirection(endpoint, cut.sideNeighborB);
    if (!second) continue;
    const outer = cut.profileOuterNeighbor !== undefined
      ? unitDirection(endpoint, cut.profileOuterNeighbor)
      : null;
    const cutDistance = Math.min(
      distance,
      first.length * BEVEL_MAX_AMOUNT,
      second.length * BEVEL_MAX_AMOUNT,
      outer ? outer.length * BEVEL_MAX_AMOUNT : Number.POSITIVE_INFINITY,
    );
    if (outer) {
      const t = Math.max(0, Math.min(1, cut.profileT ?? 0.5));
      let dot = 0;
      for (let dim = 0; dim < dimension; dim++) dot += first.direction[dim] * second.direction[dim];
      dot = Math.max(-0.999, Math.min(0.999, dot));
      const sinAngle = Math.sqrt(Math.max(0, 1 - (dot * dot)));
      const scale = sinAngle > 1e-6 ? cutDistance / sinAngle : cutDistance * 0.5;
      const oneMinusT = 1 - t;
      const point = new Float64Array(dimension);
      const innerPoint = new Float64Array(dimension);
      const outerPoint = new Float64Array(dimension);
      for (let dim = 0; dim < dimension; dim++) {
        const origin = data[(dim * oldVertexCount) + endpoint];
        innerPoint[dim] = origin + ((first.direction[dim] + second.direction[dim]) * scale);
        outerPoint[dim] = origin + (outer.direction[dim] * cutDistance);
        point[dim] = (
          (innerPoint[dim] * oneMinusT * oneMinusT)
          + (origin * 2 * oneMinusT * t)
          + (outerPoint[dim] * t * t)
        );
      }
      const finalPoint = inward ? reflectPointAcrossChord(point, innerPoint, outerPoint) : point;
      for (let dim = 0; dim < dimension; dim++) next[(dim * bevel.vertexCount) + cut.vertex] = finalPoint[dim];
      continue;
    }
    if (cut.cornerMeet) {
      let dot = 0;
      for (let dim = 0; dim < dimension; dim++) dot += first.direction[dim] * second.direction[dim];
      dot = Math.max(-0.999, Math.min(0.999, dot));
      const sinAngle = Math.sqrt(Math.max(0, 1 - (dot * dot)));
      const scale = sinAngle > 1e-6 ? cutDistance / sinAngle : cutDistance * 0.5;
      for (let dim = 0; dim < dimension; dim++) {
        const origin = data[(dim * oldVertexCount) + endpoint];
        const displacement = (first.direction[dim] + second.direction[dim]) * scale;
        next[(dim * bevel.vertexCount) + cut.vertex] = origin + displacement;
      }
      continue;
    }
    const t = Math.max(0, Math.min(1, cut.profileT ?? 0.5));
    let dot = 0;
    for (let dim = 0; dim < dimension; dim++) dot += first.direction[dim] * second.direction[dim];
    dot = Math.max(-0.999, Math.min(0.999, dot));

    if (Math.abs(1 + dot) < 1e-5) {
      for (let dim = 0; dim < dimension; dim++) {
        const origin = data[(dim * oldVertexCount) + endpoint];
        const a = first.direction[dim] * cutDistance;
        const b = second.direction[dim] * cutDistance;
        const displacement = (a * (1 - t)) + (b * t);
        next[(dim * bevel.vertexCount) + cut.vertex] = origin + displacement;
      }
      continue;
    }

    const centerScale = cutDistance / (1 + dot);
    const start = new Float64Array(dimension);
    const end = new Float64Array(dimension);
    let startLengthSq = 0;
    let endLengthSq = 0;
    for (let dim = 0; dim < dimension; dim++) {
      const center = centerScale * (first.direction[dim] + second.direction[dim]);
      start[dim] = (first.direction[dim] * cutDistance) - center;
      end[dim] = (second.direction[dim] * cutDistance) - center;
      startLengthSq += start[dim] * start[dim];
      endLengthSq += end[dim] * end[dim];
    }
    const radius = Math.sqrt(startLengthSq);
    const endRadius = Math.sqrt(endLengthSq);
    if (radius <= 1e-8 || endRadius <= 1e-8) continue;
    let profileDot = 0;
    for (let dim = 0; dim < dimension; dim++) {
      start[dim] /= radius;
      end[dim] /= endRadius;
      profileDot += start[dim] * end[dim];
    }
    profileDot = Math.max(-1, Math.min(1, profileDot));
    const angle = Math.acos(profileDot);
    const sinAngle = Math.sin(angle);
    const arcPoint = new Float64Array(dimension);
    const startPoint = new Float64Array(dimension);
    const endPoint = new Float64Array(dimension);
    for (let dim = 0; dim < dimension; dim++) {
      const origin = data[(dim * oldVertexCount) + endpoint];
      const center = centerScale * (first.direction[dim] + second.direction[dim]);
      const arcDirection = Math.abs(sinAngle) > 1e-6
        ? ((Math.sin((1 - t) * angle) * start[dim]) + (Math.sin(t * angle) * end[dim])) / sinAngle
        : (start[dim] * (1 - t)) + (end[dim] * t);
      const displacement = center + (arcDirection * radius);
      arcPoint[dim] = origin + displacement;
      startPoint[dim] = origin + (first.direction[dim] * cutDistance);
      endPoint[dim] = origin + (second.direction[dim] * cutDistance);
    }
    const finalPoint = inward ? reflectPointAcrossChord(arcPoint, startPoint, endPoint) : arcPoint;
    for (let dim = 0; dim < dimension; dim++) next[(dim * bevel.vertexCount) + cut.vertex] = finalPoint[dim];
  }

  return next;
}

export function initialVertexOrigins(vertexCount: number) {
  return Int32Array.from({ length: vertexCount }, (_entry, vertex) => vertex);
}

function vertexDistanceSquared(data: Float32Array, vertexCount: number, a: number, b: number) {
  if (a < 0 || b < 0 || a >= vertexCount || b >= vertexCount) return 0;
  const dimension = vertexCount > 0 ? Math.floor(data.length / vertexCount) : 0;
  let lengthSq = 0;
  for (let dim = 0; dim < dimension; dim++) {
    const delta = data[(dim * vertexCount) + b] - data[(dim * vertexCount) + a];
    lengthSq += delta * delta;
  }
  return lengthSq;
}

export function findEdgeWithOrigins(
  topology: CellTopology | undefined,
  origins: Int32Array,
  originA: number,
  originB: number,
  data?: Float32Array,
  vertexCount = origins.length,
) {
  if (!topology || originA === originB) return -1;
  const edgeCount = cellCount(topology, 1);
  let bestEdge = -1;
  let bestLengthSq = -1;
  for (let edgeId = 0; edgeId < edgeCount; edgeId++) {
    const edge = getCellVertices(topology, 1, edgeId);
    if (edge.length < 2) continue;
    const a = origins[edge[0]];
    const b = origins[edge[1]];
    if ((a !== originA || b !== originB) && (a !== originB || b !== originA)) continue;
    if (!data) return edgeId;
    const lengthSq = vertexDistanceSquared(data, vertexCount, edge[0], edge[1]);
    if (lengthSq > bestLengthSq) {
      bestLengthSq = lengthSq;
      bestEdge = edgeId;
    }
  }
  return bestEdge;
}

export function edgeListFromCellTopology(topology: CellTopology | undefined) {
  const packed: number[] = [];
  const edgeCount = cellCount(topology, 1);
  for (let edgeId = 0; edgeId < edgeCount; edgeId++) {
    const edge = getCellVertices(topology, 1, edgeId);
    if (edge.length >= 2) packed.push(edge[0], edge[1]);
  }
  return packed;
}

export function batchEdgeBevelDistance(
  data: Float32Array,
  vertexCount: number,
  targetEdges: Array<[number, number]>,
  amount: number,
) {
  let minLengthSq = Number.POSITIVE_INFINITY;
  for (const [a, b] of targetEdges) {
    const lengthSq = vertexDistanceSquared(data, vertexCount, a, b);
    if (lengthSq > 1e-12) minLengthSq = Math.min(minLengthSq, lengthSq);
  }
  return Number.isFinite(minLengthSq)
    ? Math.max(0, Math.min(BEVEL_MAX_AMOUNT, amount)) * Math.sqrt(minLengthSq)
    : undefined;
}

export function remapOriginsAfterVertexBevel(
  origins: Int32Array,
  selectedVertex: number,
  bevel: BevelVertexResult,
) {
  const next = new Int32Array(bevel.vertexCount);
  next.fill(-1);
  for (let vertex = 0; vertex < origins.length; vertex++) {
    const mapped = bevel.vertexMap[vertex];
    if (mapped >= 0) next[mapped] = origins[vertex];
  }
  const selectedOrigin = origins[selectedVertex] ?? -1;
  for (const cut of bevel.cuts) next[cut.vertex] = origins[cut.sourceVertex ?? selectedVertex] ?? selectedOrigin;
  return next;
}

export function remapOriginsAfterEdgeBevel(
  origins: Int32Array,
  bevel: BevelEdgeResult | BevelFaceBoundaryResult | BevelSelectedEdgesResult,
) {
  const next = new Int32Array(bevel.vertexCount);
  next.fill(-1);
  for (let vertex = 0; vertex < origins.length; vertex++) {
    const mapped = bevel.vertexMap[vertex];
    if (mapped >= 0) next[mapped] = origins[vertex];
  }
  for (const cut of bevel.cuts) next[cut.vertex] = origins[cut.endpoint] ?? -1;
  return next;
}
