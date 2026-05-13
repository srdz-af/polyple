import type { PrimitiveKind } from './primitives';

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

export type ExtrudeCellsResult = {
  topology: CellTopology;
  vertexCount: number;
  edges: Uint32Array;
  sourceVertices: number[];
  capVertices: number[];
  capCellIds: number[];
  extrudedCellIds: number[];
};

export type InsetCellResult = {
  topology: CellTopology;
  vertexCount: number;
  edges: Uint32Array;
  sourceVertices: number[];
  insetVertices: number[];
  insetCellId: number;
};

export type InsetCellsResult = {
  topology: CellTopology;
  vertexCount: number;
  edges: Uint32Array;
  sourceVertices: number[];
  insetVertices: number[];
  insetCellIds: number[];
};

export type LoopCutEdge = {
  edgeId: number;
  sourceA: number;
  sourceB: number;
  cutVertices: number[];
  segmentEdgeIds: number[];
};

export type LoopCutEdgesResult = {
  topology: CellTopology;
  vertexCount: number;
  edges: Uint32Array;
  loopEdgeIds: number[];
  cutLineEdgeIds: number[];
  cuts: LoopCutEdge[];
};

export type BevelVertexCut = {
  vertex: number;
  sourceVertex?: number;
  neighbors: number[];
  weights: number[];
};

export type BevelVertexPatchPoint = {
  vertex: number;
  side: number;
  ring: number;
  segment: number;
};

export type BevelVertexPatch = {
  sourceVertex: number;
  orderedNeighbors: number[];
  segments: number;
  points: BevelVertexPatchPoint[];
};

export type BevelVertexResult = {
  topology: CellTopology;
  vertexMap: Int32Array;
  vertexCount: number;
  edges: Uint32Array;
  cuts: BevelVertexCut[];
  patches: BevelVertexPatch[];
  capCellId: number;
  smoothness: number;
};

export type BevelEdgeCut = {
  vertex: number;
  endpoint: number;
  faceId: number;
  sideNeighbor: number;
  sideNeighborB?: number;
  profileOuterNeighbor?: number;
  profileT?: number;
  cornerMeet?: boolean;
};

export type BevelEdgeResult = {
  topology: CellTopology;
  vertexMap: Int32Array;
  vertexCount: number;
  edges: Uint32Array;
  cuts: BevelEdgeCut[];
  edgeVertices: [number, number];
  smoothness: number;
};

export type BevelFaceBoundaryResult = {
  topology: CellTopology;
  vertexMap: Int32Array;
  vertexCount: number;
  edges: Uint32Array;
  cuts: BevelEdgeCut[];
  faceVertices: number[];
  smoothness: number;
};

export type BevelSelectedEdgesResult = BevelEdgeResult | BevelFaceBoundaryResult;
