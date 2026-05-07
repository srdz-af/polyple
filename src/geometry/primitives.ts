export type PrimitiveKind =
  | 'hypercube'
  | 'spikedHypercube'
  | 'cross'
  | 'simplex'
  | 'simplexPrism'
  | 'demicube'
  | 'cell24'
  | 'duoprism';

export type PrimitiveSurfaceTopology = {
  triangles: Uint32Array;
  facetIds: Uint16Array;
};

export type PrimitiveGeometry = {
  verts: Float32Array;
  edges: Uint32Array;
  surfaceTopology?: PrimitiveSurfaceTopology;
  V: number;
};

function addEdge(edges: number[], a: number, b: number) {
  if (a === b) return;
  edges.push(a, b);
}

export function clonePrimitiveSurfaceTopology(
  topology?: PrimitiveSurfaceTopology,
): PrimitiveSurfaceTopology | undefined {
  if (!topology) return undefined;
  return {
    triangles: new Uint32Array(topology.triangles),
    facetIds: new Uint16Array(topology.facetIds),
  };
}

function normalizeToHalfExtent(verts: Float32Array) {
  let maxAbs = 0;
  for (let i = 0; i < verts.length; i++) {
    maxAbs = Math.max(maxAbs, Math.abs(verts[i]));
  }

  if (maxAbs <= 0) return;
  const scale = 0.5 / maxAbs;
  for (let i = 0; i < verts.length; i++) verts[i] *= scale;
}

function squaredDistance(verts: Float32Array, N: number, V: number, a: number, b: number) {
  let sum = 0;
  for (let d = 0; d < N; d++) {
    const diff = verts[d * V + a] - verts[d * V + b];
    sum += diff * diff;
  }
  return sum;
}

function parity(mask: number) {
  let p = 0;
  let rest = mask;
  while (rest) {
    p ^= rest & 1;
    rest >>= 1;
  }
  return p;
}

export function hypercubeEdges(N: number): PrimitiveGeometry {
  const V = 1 << N;
  const verts = new Float32Array(N * V);

  for (let v = 0; v < V; v++) {
    for (let d = 0; d < N; d++) {
      verts[d * V + v] = ((v >> d) & 1) ? 0.5 : -0.5;
    }
  }

  const edges: number[] = [];
  for (let v = 0; v < V; v++) {
    for (let d = 0; d < N; d++) {
      const u = v ^ (1 << d);
      if (u > v) addEdge(edges, v, u);
    }
  }

  return { verts, edges: new Uint32Array(edges), V };
}

export function spikedHypercubeEdges(N: number): PrimitiveGeometry {
  const cornerCount = 1 << N;
  const apexCount = 2 * N;
  const V = cornerCount + apexCount;
  const verts = new Float32Array(N * V);
  const baseExtent = 0.28;
  const spikeExtent = 0.5;

  for (let v = 0; v < cornerCount; v++) {
    for (let d = 0; d < N; d++) {
      verts[d * V + v] = ((v >> d) & 1) ? baseExtent : -baseExtent;
    }
  }

  const apexIndex = (axis: number, positive: boolean) => cornerCount + axis * 2 + (positive ? 1 : 0);
  for (let axis = 0; axis < N; axis++) {
    const negativeApex = apexIndex(axis, false);
    const positiveApex = apexIndex(axis, true);
    verts[axis * V + negativeApex] = -spikeExtent;
    verts[axis * V + positiveApex] = spikeExtent;
  }

  const edges: number[] = [];
  for (let v = 0; v < cornerCount; v++) {
    for (let d = 0; d < N; d++) {
      const u = v ^ (1 << d);
      if (u > v) addEdge(edges, v, u);
    }
  }

  for (let axis = 0; axis < N; axis++) {
    for (const positive of [false, true]) {
      const apex = apexIndex(axis, positive);
      const bitValue = positive ? 1 : 0;
      for (let v = 0; v < cornerCount; v++) {
        if (((v >> axis) & 1) === bitValue) addEdge(edges, apex, v);
      }
    }
  }

  const triangles: number[] = [];
  const facetIds: number[] = [];
  let facetId = 0;
  for (let axis = 0; axis < N; axis++) {
    for (const positive of [false, true]) {
      const apex = apexIndex(axis, positive);
      const bitValue = positive ? 1 : 0;
      for (let edgeAxis = 0; edgeAxis < N; edgeAxis++) {
        if (edgeAxis === axis) continue;
        const edgeBit = 1 << edgeAxis;
        for (let base = 0; base < cornerCount; base++) {
          if (((base >> axis) & 1) !== bitValue) continue;
          if ((base & edgeBit) !== 0) continue;
          triangles.push(apex, base, base | edgeBit);
          facetIds.push(facetId);
        }
      }
      facetId++;
    }
  }

  return {
    verts,
    edges: new Uint32Array(edges),
    surfaceTopology: {
      triangles: new Uint32Array(triangles),
      facetIds: new Uint16Array(facetIds),
    },
    V,
  };
}

export function crossPolytopeEdges(N: number): PrimitiveGeometry {
  const V = 2 * N;
  const verts = new Float32Array(N * V);

  for (let axis = 0; axis < N; axis++) {
    const idxPos = 2 * axis;
    const idxNeg = idxPos + 1;

    for (let d = 0; d < N; d++) {
      const val = d === axis ? 0.5 : 0;
      verts[d * V + idxPos] = val;
      verts[d * V + idxNeg] = -val;
    }
  }

  const edges: number[] = [];
  for (let a = 0; a < V; a++) {
    for (let b = a + 1; b < V; b++) {
      if (Math.floor(a / 2) !== Math.floor(b / 2)) addEdge(edges, a, b);
    }
  }

  return { verts, edges: new Uint32Array(edges), V };
}

export function simplexEdges(N: number): PrimitiveGeometry {
  const V = N + 1;
  const verts = new Float32Array(N * V);

  for (let axis = 0; axis < N; axis++) {
    verts[axis * V + axis + 1] = 1;
  }

  const centroid = new Float32Array(N);
  for (let d = 0; d < N; d++) {
    let sum = 0;
    for (let v = 0; v < V; v++) sum += verts[d * V + v];
    centroid[d] = sum / V;
  }

  for (let d = 0; d < N; d++) {
    const c = centroid[d];
    for (let v = 0; v < V; v++) verts[d * V + v] -= c;
  }

  normalizeToHalfExtent(verts);

  const edges: number[] = [];
  for (let a = 0; a < V; a++) {
    for (let b = a + 1; b < V; b++) addEdge(edges, a, b);
  }

  return { verts, edges: new Uint32Array(edges), V };
}

export function simplexPrismEdges(N: number): PrimitiveGeometry {
  const baseDim = Math.max(2, N - 1);
  const base = simplexEdges(baseDim);
  const baseV = base.V;
  const V = baseV * 2;
  const verts = new Float32Array(N * V);
  const extrudeDim = Math.min(N - 1, baseDim);

  for (let v = 0; v < baseV; v++) {
    for (let d = 0; d < baseDim; d++) {
      const val = base.verts[d * baseV + v];
      verts[d * V + v] = val;
      verts[d * V + v + baseV] = val;
    }

    verts[extrudeDim * V + v] = -0.4;
    verts[extrudeDim * V + v + baseV] = 0.4;
  }

  const edges: number[] = [];
  for (let e = 0; e < base.edges.length; e += 2) {
    const a = base.edges[e];
    const b = base.edges[e + 1];
    addEdge(edges, a, b);
    addEdge(edges, a + baseV, b + baseV);
  }

  for (let v = 0; v < baseV; v++) addEdge(edges, v, v + baseV);

  return { verts, edges: new Uint32Array(edges), V };
}

export function demicubeEdges(N: number): PrimitiveGeometry {
  if (N < 3) return simplexEdges(N);

  const masks: number[] = [];
  const indexByMask = new Map<number, number>();
  const total = 1 << N;
  for (let mask = 0; mask < total; mask++) {
    if (parity(mask) !== 0) continue;
    indexByMask.set(mask, masks.length);
    masks.push(mask);
  }

  const V = masks.length;
  const verts = new Float32Array(N * V);
  for (let v = 0; v < V; v++) {
    const mask = masks[v];
    for (let d = 0; d < N; d++) {
      verts[d * V + v] = ((mask >> d) & 1) ? 0.5 : -0.5;
    }
  }

  const edges: number[] = [];
  for (let v = 0; v < V; v++) {
    const mask = masks[v];
    for (let a = 0; a < N; a++) {
      for (let b = a + 1; b < N; b++) {
        const other = mask ^ (1 << a) ^ (1 << b);
        const u = indexByMask.get(other);
        if (u != null && u > v) addEdge(edges, v, u);
      }
    }
  }

  return { verts, edges: new Uint32Array(edges), V };
}

export function cell24Edges(N: number): PrimitiveGeometry {
  if (N < 4) return crossPolytopeEdges(N);

  const V = 24;
  const verts = new Float32Array(N * V);
  let v = 0;
  for (let a = 0; a < 4; a++) {
    for (let b = a + 1; b < 4; b++) {
      for (const sa of [-0.5, 0.5]) {
        for (const sb of [-0.5, 0.5]) {
          verts[a * V + v] = sa;
          verts[b * V + v] = sb;
          v++;
        }
      }
    }
  }

  const edges: number[] = [];
  const edgeDistance2 = 0.5;
  for (let a = 0; a < V; a++) {
    for (let b = a + 1; b < V; b++) {
      if (Math.abs(squaredDistance(verts, 4, V, a, b) - edgeDistance2) < 1e-6) {
        addEdge(edges, a, b);
      }
    }
  }

  return { verts, edges: new Uint32Array(edges), V };
}

export function duoprismEdges(N: number): PrimitiveGeometry {
  if (N < 4) return polygonRingEdges(N, 16);

  const segmentsA = 8;
  const segmentsB = 8;
  const V = segmentsA * segmentsB;
  const verts = new Float32Array(N * V);
  const radius = 0.42;
  const index = (a: number, b: number) => ((a + segmentsA) % segmentsA) * segmentsB + ((b + segmentsB) % segmentsB);

  for (let a = 0; a < segmentsA; a++) {
    const theta = (a / segmentsA) * Math.PI * 2;
    for (let b = 0; b < segmentsB; b++) {
      const phi = (b / segmentsB) * Math.PI * 2;
      const v = index(a, b);
      verts[v] = Math.cos(theta) * radius;
      verts[V + v] = Math.sin(theta) * radius;
      verts[2 * V + v] = Math.cos(phi) * radius;
      verts[3 * V + v] = Math.sin(phi) * radius;
    }
  }

  const edges: number[] = [];
  for (let a = 0; a < segmentsA; a++) {
    for (let b = 0; b < segmentsB; b++) {
      const v = index(a, b);
      addEdge(edges, v, index(a + 1, b));
      addEdge(edges, v, index(a, b + 1));
    }
  }

  return { verts, edges: new Uint32Array(edges), V };
}

function polygonRingEdges(N: number, segments: number): PrimitiveGeometry {
  const V = segments;
  const verts = new Float32Array(N * V);
  for (let v = 0; v < V; v++) {
    const theta = (v / V) * Math.PI * 2;
    verts[v] = Math.cos(theta) * 0.5;
    if (N > 1) verts[V + v] = Math.sin(theta) * 0.5;
  }

  const edges: number[] = [];
  for (let v = 0; v < V; v++) addEdge(edges, v, (v + 1) % V);
  return { verts, edges: new Uint32Array(edges), V };
}

export function buildPrimitive(kind: PrimitiveKind, N: number): PrimitiveGeometry {
  switch (kind) {
    case 'hypercube':
      return hypercubeEdges(N);
    case 'spikedHypercube':
      return spikedHypercubeEdges(N);
    case 'cross':
      return crossPolytopeEdges(N);
    case 'simplex':
      return simplexEdges(N);
    case 'simplexPrism':
      return simplexPrismEdges(N);
    case 'demicube':
      return demicubeEdges(N);
    case 'cell24':
      return cell24Edges(N);
    case 'duoprism':
      return duoprismEdges(N);
  }
}
