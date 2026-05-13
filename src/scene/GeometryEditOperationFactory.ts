import { BEVEL_MAX_AMOUNT, appendDimensionMajorDuplicateVertices, batchEdgeBevelDistance, buildBeveledEdgeData, buildBeveledVertexData, edgeListFromCellTopology, findEdgeWithOrigins, initialVertexOrigins, remapOriginsAfterEdgeBevel, remapOriginsAfterVertexBevel } from '../geometry/bevelGeometry';
import { buildLoopCutVertexData, cellVertexSignature, collectEditBevelTargets, extrusionDirectionsForCells, findCellIdByVertexSignature, selectedCellComponentSignatures, writeInsetVertices, INSET_MAX_AMOUNT } from '../geometry/editOperationGeometry';
import { bevelEdge, bevelSelectedEdges, bevelVertices, extrudeCell, extrudeCells, getCellVertices, insetCell, insetCells, loopCutEdges, type CellTopology, type LoopCutEdge } from '../geometry/cellTopology';
import { clonePrimitiveSurfaceTopology, type PrimitiveSurfaceTopology } from '../geometry/primitives';
import { cloneCellTopology } from '../geometry/cellTopology';
import { surfaceTopologyForEditedCellTopology, surfaceTopologyFromPositionedCellTopology } from './topologyState';
import type { GeometryEditService, EditGeometrySnapshot } from './GeometryEditService';
import type { EditOperationMode, EditOperationRequest, ViewportAmountOperation } from '../interaction/ViewportInteractionController';

const BEVEL_MIN_SMOOTHNESS = 1;
const BEVEL_MAX_SMOOTHNESS = 32;

type EditSelectionSnapshot = {
  dimension: number;
  cellId: number;
  cellIds: number[];
  vertices: number[];
};

type EditOperationContext = {
  selection: EditSelectionSnapshot;
  topology: CellTopology;
};

type GeometryTargetState = {
  X: Float32Array;
  E: Uint32Array;
  M: number;
  cellTopology?: CellTopology;
  surfaceTopology?: PrimitiveSurfaceTopology;
};

type EditExtrusionToken<TUndoSnapshot> = {
  undoSnapshot: TUndoSnapshot;
  mode: EditOperationMode;
  instIdx: number;
  dimension: number;
  cellId: number;
  cellIds: number[];
  amount: number;
  extrudeGroups: Array<{
    sourceVertices: number[];
    capVertices: number[];
    directions: Float64Array[];
  }>;
  original: EditGeometrySnapshot;
};

type EditInsetToken<TUndoSnapshot> = {
  undoSnapshot: TUndoSnapshot;
  mode: EditOperationMode;
  instIdx: number;
  dimension: number;
  cellId: number;
  cellIds: number[];
  vertices: number[];
  sourceVertices: number[];
  insetVertices: number[];
  insetGroups: Array<{
    sourceVertices: number[];
    insetVertices: number[];
    cellVertices: number[][];
  }>;
  amount: number;
  original: EditGeometrySnapshot;
};

type EditBevelToken<TUndoSnapshot> = {
  undoSnapshot: TUndoSnapshot;
  mode: EditOperationMode;
  kind: 'vertex' | 'edge';
  inward: boolean;
  instIdx: number;
  dimension: number;
  cellId: number;
  cellIds: number[];
  vertices: number[];
  targetVertices: number[];
  targetEdges: Array<[number, number]>;
  targetEdgeIds: number[];
  amount: number;
  smoothness: number;
  applied: boolean;
  original: EditGeometrySnapshot;
};

type EditLoopCutToken<TUndoSnapshot> = {
  undoSnapshot: TUndoSnapshot;
  instIdx: number;
  dimension: 1;
  cellId: number;
  cellIds: number[];
  amount: number;
  cutCount: number;
  seedEdgeIds: number[];
  loopEdgeIds: number[];
  cuts: LoopCutEdge[];
  applied: boolean;
  original: EditGeometrySnapshot;
};

type GeometryEditOperationFactoryOptions<TUndoSnapshot> = {
  baseSelection: number;
  getSelectedInstance: () => number;
  getEditMode: () => boolean;
  isGeometrySelectionIndex: (idx: number) => boolean;
  getObjectVisible: (idx: number) => boolean;
  selectedGeometryDimension: () => number;
  selectedEditOperationContext: () => EditOperationContext | null;
  getTargetState: (idx: number) => GeometryTargetState | null;
  setTargetState: (idx: number, state: GeometryTargetState) => void;
  refreshTargetSurface: (idx: number) => void;
  captureUndoSnapshot: () => TUndoSnapshot;
  editService: GeometryEditService<TUndoSnapshot>;
  clearEditSelection: () => void;
  setSelectedEditCells: (dimension: number, cellIds: number[], topology?: CellTopology) => void;
  setSelectedEditElement: (dimension: number, vertices: number[], cellId: number) => void;
  updateVertexCloud: (idx: number) => void;
  updateSelectionOutline: () => void;
  updateTransformActionButtons: () => void;
  rebuildGeometryRenderer: (idx: number) => void;
  refreshAfterGeometryChange: (idx: number, options?: { dirtyUrl?: boolean }) => void;
  projectAndRenderAll: () => void;
};

function normalizeEditOperationMode(mode: EditOperationMode | undefined): EditOperationMode {
  return mode === 'individual' ? 'individual' : 'grouped';
}

function isEditExtrusionToken<TUndoSnapshot>(token: unknown): token is EditExtrusionToken<TUndoSnapshot> {
  return typeof token === 'object'
    && token !== null
    && 'undoSnapshot' in token
    && 'instIdx' in token
    && 'dimension' in token
    && 'extrudeGroups' in token
    && 'original' in token;
}

function isEditInsetToken<TUndoSnapshot>(token: unknown): token is EditInsetToken<TUndoSnapshot> {
  return typeof token === 'object'
    && token !== null
    && 'undoSnapshot' in token
    && 'sourceVertices' in token
    && 'insetVertices' in token
    && 'original' in token;
}

function isEditBevelToken<TUndoSnapshot>(token: unknown): token is EditBevelToken<TUndoSnapshot> {
  return typeof token === 'object'
    && token !== null
    && 'kind' in token
    && 'inward' in token
    && 'instIdx' in token
    && 'dimension' in token
    && 'cellId' in token
    && 'amount' in token
    && 'smoothness' in token;
}

function isEditLoopCutToken<TUndoSnapshot>(token: unknown): token is EditLoopCutToken<TUndoSnapshot> {
  return typeof token === 'object'
    && token !== null
    && 'seedEdgeIds' in token
    && 'loopEdgeIds' in token
    && 'cutCount' in token
    && 'original' in token;
}

export class GeometryEditOperationFactory<TUndoSnapshot> {
  constructor(private readonly options: GeometryEditOperationFactoryOptions<TUndoSnapshot>) {}

  canStartExtrusion() {
    const context = this.options.selectedEditOperationContext();
    if (!context) return false;
    if (context.selection.dimension + 1 > this.options.selectedGeometryDimension()) return false;
    return this.selectedEditCellSignatures(context).length > 0;
  }

  canStartInset() {
    const context = this.options.selectedEditOperationContext();
    if (!context || context.selection.dimension < 1) return false;
    return this.selectedEditCellSignatures(context).length > 0;
  }

  canStartBevel(kind: 'vertex' | 'edge') {
    const context = this.options.selectedEditOperationContext();
    if (!context) return false;
    return collectEditBevelTargets(context.topology, context.selection, kind) !== null;
  }

  canStartLoopCut() {
    const context = this.options.selectedEditOperationContext();
    const selection = context?.selection;
    if (!context || !selection || selection.dimension !== 1) return false;
    const edgeIds = selection.cellIds.length ? selection.cellIds : [selection.cellId];
    return edgeIds.some(edgeId => getCellVertices(context.topology, 1, edgeId).length >= 2);
  }

  canStartOperation(request: EditOperationRequest) {
    if (request.type === 'extrude') return this.canStartExtrusion();
    if (request.type === 'inset') return this.canStartInset();
    if (request.type === 'loopCut') return this.canStartLoopCut();
    return this.canStartBevel(request.kind ?? 'edge');
  }

  createExtrusionOperation(mode: EditOperationMode = 'grouped'): ViewportAmountOperation | null {
    const token = this.extrudeSelectedEditCell(mode);
    if (!token) return null;
    return {
      kind: 'edit-extrusion',
      scope: 'edit',
      updateAmount: amount => this.updateEditExtrusion(token, amount),
      commit: () => this.commitEditExtrusion(token),
      cancel: () => this.cancelEditExtrusion(token),
    };
  }

  createInsetOperation(mode: EditOperationMode = 'grouped'): ViewportAmountOperation | null {
    const token = this.startEditInset(mode);
    if (!token) return null;
    return {
      kind: 'edit-inset',
      scope: 'edit',
      updateAmount: amount => this.updateEditInset(token, amount),
      commit: () => this.commitEditInset(token),
      cancel: () => this.cancelEditInset(token),
    };
  }

  createBevelOperation(
    smoothness: number,
    kind: 'vertex' | 'edge' = 'edge',
    inward = false,
    mode: EditOperationMode = 'grouped',
    setSmoothness?: (smoothness: number) => void,
  ): ViewportAmountOperation | null {
    let currentSmoothness = Math.max(BEVEL_MIN_SMOOTHNESS, Math.floor(smoothness));
    const token = this.startEditBevel(currentSmoothness, kind, inward, mode);
    if (!token) return null;
    const adjustSmoothness = (delta: number, amount: number) => {
      const nextSmoothness = Math.max(
        BEVEL_MIN_SMOOTHNESS,
        Math.min(BEVEL_MAX_SMOOTHNESS, currentSmoothness + delta),
      );
      if (nextSmoothness === currentSmoothness) return true;

      currentSmoothness = nextSmoothness;
      setSmoothness?.(currentSmoothness);
      this.updateEditBevel(token, amount, currentSmoothness);
      return true;
    };
    return {
      kind: 'edit-bevel',
      scope: 'edit',
      updateAmount: amount => this.updateEditBevel(token, amount, currentSmoothness),
      levelControl: {
        label: 'Bevel levels',
        min: BEVEL_MIN_SMOOTHNESS,
        max: BEVEL_MAX_SMOOTHNESS,
        getValue: () => currentSmoothness,
        adjust: adjustSmoothness,
      },
      updateWheel: (ev, amount) => {
        ev.preventDefault();
        ev.stopPropagation();
        ev.stopImmediatePropagation();
        return adjustSmoothness(ev.deltaY < 0 ? 1 : -1, amount);
      },
      commit: () => this.commitEditBevel(token),
      cancel: () => this.cancelEditBevel(token),
    };
  }

  createLoopCutOperation(
    cutCount: number,
    setCutCount?: (cutCount: number) => void,
  ): ViewportAmountOperation | null {
    let currentCutCount = Math.max(1, Math.floor(cutCount));
    const token = this.startEditLoopCut(currentCutCount);
    if (!token) return null;
    const adjustCutCount = (delta: number, amount: number) => {
      const nextCutCount = Math.max(1, Math.min(32, currentCutCount + delta));
      if (nextCutCount === currentCutCount) return true;
      currentCutCount = nextCutCount;
      setCutCount?.(currentCutCount);
      this.updateEditLoopCut(token, amount, currentCutCount);
      return true;
    };
    return {
      kind: 'edit-loop-cut',
      scope: 'edit',
      updateAmount: amount => this.updateEditLoopCut(token, amount, currentCutCount),
      levelControl: {
        label: 'Loop cuts',
        min: 1,
        max: 32,
        getValue: () => currentCutCount,
        adjust: adjustCutCount,
      },
      updateWheel: (ev, amount) => {
        ev.preventDefault();
        ev.stopPropagation();
        ev.stopImmediatePropagation();
        return adjustCutCount(ev.deltaY < 0 ? 1 : -1, amount);
      },
      commit: () => this.commitEditLoopCut(token),
      cancel: () => this.cancelEditLoopCut(token),
    };
  }

  private selectedEditCellSignatures(context = this.options.selectedEditOperationContext()) {
    if (!context) return [];
    const { selection, topology } = context;
    const selectedCellIds = selection.cellIds.length ? selection.cellIds : [selection.cellId];
    return selectedCellIds
      .map(cellId => cellVertexSignature(getCellVertices(topology, selection.dimension, cellId)))
      .filter(signature => signature.length > 0);
  }

  private validEditTarget() {
    const instIdx = this.options.getSelectedInstance();
    if (
      !this.options.getEditMode()
      || !this.options.isGeometrySelectionIndex(instIdx)
      || !this.options.getObjectVisible(instIdx)
    ) {
      return null;
    }
    return instIdx;
  }

  private targetState(instIdx: number) {
    return this.options.getTargetState(instIdx);
  }

  private setTargetState(instIdx: number, state: GeometryTargetState) {
    this.options.setTargetState(instIdx, state);
  }

  private restoreEditGeometrySnapshot(instIdx: number, original: EditGeometrySnapshot) {
    this.options.editService.restoreSnapshot(instIdx, original);
  }

  private restoreTokenEditSelection(token: { instIdx: number; dimension: number; cellId: number; cellIds: number[] }) {
    const topology = this.targetState(token.instIdx)?.cellTopology;
    const cellIds = token.cellIds.length ? token.cellIds : [token.cellId];
    this.options.setSelectedEditCells(token.dimension, cellIds, topology);
  }

  private extrudeSelectedEditCell(mode: EditOperationMode = 'grouped'): EditExtrusionToken<TUndoSnapshot> | null {
    const instIdx = this.validEditTarget();
    if (instIdx === null) return null;
    const context = this.options.selectedEditOperationContext();
    const selection = context?.selection;
    if (!context || !selection || selection.cellId < 0) return null;
    if (selection.dimension + 1 > this.options.selectedGeometryDimension()) return null;

    const selectedCellIds = selection.cellIds.length ? selection.cellIds : [selection.cellId];
    const operationMode = normalizeEditOperationMode(mode);
    const selectedCellSignatureGroups = selectedCellComponentSignatures(context.topology, selection.dimension, selectedCellIds, operationMode);
    if (!selectedCellSignatureGroups.length) return null;
    const original = this.options.editService.captureSnapshot(instIdx);
    if (!original) return null;

    const undoSnapshot = this.options.captureUndoSnapshot();
    this.options.clearEditSelection();
    const capSignatures: string[] = [];
    const extrudeGroups: EditExtrusionToken<TUndoSnapshot>['extrudeGroups'] = [];
    for (const signatureGroup of selectedCellSignatureGroups) {
      const current = this.targetState(instIdx);
      if (!current) continue;
      const cellIds = signatureGroup
        .map(signature => findCellIdByVertexSignature(current.cellTopology, selection.dimension, signature))
        .filter(cellId => cellId >= 0);
      if (!cellIds.length) continue;
      const groupCellVertices = cellIds.map(cellId => getCellVertices(current.cellTopology, selection.dimension, cellId));
      const extrusion = operationMode === 'grouped'
        ? extrudeCells(current.cellTopology, selection.dimension, cellIds, current.M)
        : extrudeCell(current.cellTopology, selection.dimension, cellIds[0], current.M);
      if (!extrusion) continue;
      const directions = extrusionDirectionsForCells(
        current.X,
        current.M,
        extrusion.sourceVertices,
        groupCellVertices,
      );

      const nextState: GeometryTargetState = {
        ...current,
        X: appendDimensionMajorDuplicateVertices(current.X, current.M, extrusion.sourceVertices),
        M: extrusion.vertexCount,
        E: new Uint32Array(extrusion.edges),
        cellTopology: extrusion.topology,
        surfaceTopology: surfaceTopologyForEditedCellTopology(extrusion.topology),
      };
      this.setTargetState(instIdx, nextState);
      const capCellIds = 'capCellIds' in extrusion ? extrusion.capCellIds : [extrusion.capCellId];
      capCellIds.forEach(capCellId => {
        capSignatures.push(cellVertexSignature(getCellVertices(extrusion.topology, selection.dimension, capCellId)));
      });
      extrudeGroups.push({
        sourceVertices: extrusion.sourceVertices,
        capVertices: extrusion.capVertices,
        directions,
      });
    }
    if (!capSignatures.length) {
      this.restoreEditGeometrySnapshot(instIdx, original);
      return null;
    }

    this.options.rebuildGeometryRenderer(instIdx);
    this.options.projectAndRenderAll();
    const nextTopology = this.targetState(instIdx)?.cellTopology;
    this.options.setSelectedEditCells(
      selection.dimension,
      capSignatures.map(signature => findCellIdByVertexSignature(nextTopology, selection.dimension, signature)).filter(cellId => cellId >= 0),
      nextTopology,
    );
    this.options.updateVertexCloud(instIdx);
    this.options.updateSelectionOutline();
    this.options.updateTransformActionButtons();
    return {
      undoSnapshot,
      mode: operationMode,
      instIdx,
      dimension: selection.dimension,
      cellId: selection.cellId,
      cellIds: [...selection.cellIds],
      amount: 0,
      extrudeGroups,
      original,
    };
  }

  private updateEditExtrusion(token: unknown, amount: number) {
    if (!isEditExtrusionToken<TUndoSnapshot>(token)) return;
    token.amount = amount;
    const target = this.targetState(token.instIdx);
    if (!target || target.M <= 0) return;
    const dimension = Math.floor(target.X.length / target.M);
    const originalVertexCount = token.original.M;
    const originalDimension = Math.floor(token.original.X.length / Math.max(1, originalVertexCount));
    if (dimension <= 0 || originalDimension !== dimension) return;

    for (const group of token.extrudeGroups) {
      group.sourceVertices.forEach((sourceVertex, idx) => {
        const capVertex = group.capVertices[idx];
        const direction = group.directions[idx];
        if (sourceVertex < 0 || sourceVertex >= originalVertexCount || capVertex < 0 || capVertex >= target.M || !direction) return;
        for (let dim = 0; dim < dimension; dim++) {
          const source = token.original.X[(dim * originalVertexCount) + sourceVertex] ?? 0;
          target.X[(dim * target.M) + capVertex] = source + ((direction[dim] ?? 0) * token.amount);
        }
      });
    }

    this.options.refreshTargetSurface(token.instIdx);
    this.options.projectAndRenderAll();
    if (this.options.getEditMode() && this.options.getObjectVisible(token.instIdx)) this.options.updateVertexCloud(token.instIdx);
  }

  private commitEditExtrusion(token: unknown) {
    if (!isEditExtrusionToken<TUndoSnapshot>(token)) return;
    this.options.editService.commit(token.undoSnapshot, token.instIdx);
  }

  private cancelEditExtrusion(token: unknown) {
    if (!isEditExtrusionToken<TUndoSnapshot>(token)) return;
    this.restoreEditGeometrySnapshot(token.instIdx, token.original);
    this.restoreTokenEditSelection(token);
    this.options.projectAndRenderAll();
    if (this.options.getEditMode() && this.options.getObjectVisible(token.instIdx)) this.options.updateVertexCloud(token.instIdx);
    this.options.updateSelectionOutline();
    this.options.updateTransformActionButtons();
  }

  private startEditInset(mode: EditOperationMode = 'grouped'): EditInsetToken<TUndoSnapshot> | null {
    const instIdx = this.validEditTarget();
    if (instIdx === null) return null;
    const context = this.options.selectedEditOperationContext();
    const selection = context?.selection;
    if (!context || !selection || selection.cellId < 0 || selection.dimension < 1) return null;

    const selectedCellIds = selection.cellIds.length ? selection.cellIds : [selection.cellId];
    const operationMode = normalizeEditOperationMode(mode);
    const selectedCellSignatureGroups = selectedCellComponentSignatures(context.topology, selection.dimension, selectedCellIds, operationMode);
    if (!selectedCellSignatureGroups.length) return null;
    const original = this.options.editService.captureSnapshot(instIdx);
    if (!original) return null;

    const undoSnapshot = this.options.captureUndoSnapshot();
    this.options.clearEditSelection();
    const insetGroups: EditInsetToken<TUndoSnapshot>['insetGroups'] = [];
    const insetSignatures: string[] = [];
    const allSourceVertices: number[] = [];
    const allInsetVertices: number[] = [];
    for (const signatureGroup of selectedCellSignatureGroups) {
      const current = this.targetState(instIdx);
      if (!current) continue;
      const cellIds = signatureGroup
        .map(signature => findCellIdByVertexSignature(current.cellTopology, selection.dimension, signature))
        .filter(cellId => cellId >= 0);
      if (!cellIds.length) continue;
      const groupCellVertices = cellIds.map(cellId => getCellVertices(current.cellTopology, selection.dimension, cellId));
      const inset = operationMode === 'grouped'
        ? insetCells(current.cellTopology, selection.dimension, cellIds, current.M)
        : insetCell(current.cellTopology, selection.dimension, cellIds[0], current.M);
      if (!inset) continue;

      const nextState: GeometryTargetState = {
        ...current,
        X: appendDimensionMajorDuplicateVertices(current.X, current.M, inset.sourceVertices),
        M: inset.vertexCount,
        E: new Uint32Array(inset.edges),
        cellTopology: inset.topology,
        surfaceTopology: surfaceTopologyForEditedCellTopology(inset.topology),
      };
      this.setTargetState(instIdx, nextState);
      const insetCellIds = 'insetCellIds' in inset ? inset.insetCellIds : [inset.insetCellId];
      insetCellIds.forEach(insetCellId => {
        insetSignatures.push(cellVertexSignature(getCellVertices(inset.topology, selection.dimension, insetCellId)));
      });
      insetGroups.push({
        sourceVertices: inset.sourceVertices,
        insetVertices: inset.insetVertices,
        cellVertices: groupCellVertices,
      });
      allSourceVertices.push(...inset.sourceVertices);
      allInsetVertices.push(...inset.insetVertices);
    }
    if (!insetGroups.length) {
      this.restoreEditGeometrySnapshot(instIdx, original);
      return null;
    }

    this.options.rebuildGeometryRenderer(instIdx);
    this.options.projectAndRenderAll();
    const nextTopology = this.targetState(instIdx)?.cellTopology;
    const insetCellIds = insetSignatures
      .map(signature => findCellIdByVertexSignature(nextTopology, selection.dimension, signature))
      .filter(cellId => cellId >= 0);
    this.options.setSelectedEditCells(selection.dimension, insetCellIds, nextTopology);
    this.options.updateVertexCloud(instIdx);
    this.options.updateSelectionOutline();
    this.options.updateTransformActionButtons();

    return {
      undoSnapshot,
      mode: operationMode,
      instIdx,
      dimension: selection.dimension,
      cellId: insetCellIds[0] ?? -1,
      cellIds: [...selection.cellIds],
      vertices: [...selection.vertices],
      sourceVertices: allSourceVertices,
      insetVertices: allInsetVertices,
      insetGroups,
      amount: 0,
      original,
    };
  }

  private updateEditInset(token: unknown, amount: number) {
    if (!isEditInsetToken<TUndoSnapshot>(token)) return;
    token.amount = Math.max(0, Math.min(INSET_MAX_AMOUNT, amount));
    const target = this.targetState(token.instIdx);
    if (!target || target.M <= 0) return;
    const groups = token.insetGroups?.length
      ? token.insetGroups
      : [{ sourceVertices: token.sourceVertices, insetVertices: token.insetVertices, cellVertices: [] }];
    groups.forEach(group => {
      writeInsetVertices(
        target.X,
        token.original.X,
        target.M,
        token.original.M,
        group.sourceVertices,
        group.insetVertices,
        token.amount,
        group.cellVertices,
      );
    });
    this.options.refreshTargetSurface(token.instIdx);
    this.options.projectAndRenderAll();
    if (this.options.getEditMode() && this.options.getObjectVisible(token.instIdx)) this.options.updateVertexCloud(token.instIdx);
  }

  private commitEditInset(token: unknown) {
    if (!isEditInsetToken<TUndoSnapshot>(token)) return;
    this.options.editService.commit(token.undoSnapshot, token.instIdx);
  }

  private cancelEditInset(token: unknown) {
    if (!isEditInsetToken<TUndoSnapshot>(token)) return;
    this.restoreEditGeometrySnapshot(token.instIdx, token.original);
    this.restoreTokenEditSelection(token);
    this.options.projectAndRenderAll();
    if (this.options.getEditMode() && this.options.getObjectVisible(token.instIdx)) this.options.updateVertexCloud(token.instIdx);
    this.options.updateSelectionOutline();
    this.options.updateTransformActionButtons();
  }

  private startEditLoopCut(cutCount: number): EditLoopCutToken<TUndoSnapshot> | null {
    const instIdx = this.validEditTarget();
    if (instIdx === null) return null;
    const context = this.options.selectedEditOperationContext();
    const selection = context?.selection;
    if (!context || !selection || selection.dimension !== 1 || selection.cellId < 0) return null;

    const seedEdgeIds = (selection.cellIds.length ? selection.cellIds : [selection.cellId])
      .filter(edgeId => getCellVertices(context.topology, 1, edgeId).length >= 2)
      .filter((edgeId, index, arr) => arr.indexOf(edgeId) === index);
    if (!seedEdgeIds.length) return null;

    const original = this.options.editService.captureSnapshot(instIdx);
    if (!original) return null;
    const token: EditLoopCutToken<TUndoSnapshot> = {
      undoSnapshot: this.options.captureUndoSnapshot(),
      instIdx,
      dimension: 1,
      cellId: selection.cellId,
      cellIds: [...selection.cellIds],
      amount: 0.5,
      cutCount: Math.max(1, Math.floor(cutCount)),
      seedEdgeIds,
      loopEdgeIds: [],
      cuts: [],
      applied: false,
      original,
    };
    if (!this.applyEditLoopCutPreview(token)) {
      this.restoreEditGeometrySnapshot(instIdx, original);
      return null;
    }
    return token;
  }

  private applyEditLoopCutPreview(token: EditLoopCutToken<TUndoSnapshot>) {
    this.restoreEditGeometrySnapshot(token.instIdx, token.original);
    const target = this.targetState(token.instIdx);
    if (!target || !target.cellTopology || target.M <= 0) return false;
    const cut = loopCutEdges(target.cellTopology, token.seedEdgeIds, target.M, token.cutCount);
    if (!cut) return false;

    token.loopEdgeIds = cut.loopEdgeIds;
    token.cuts = cut.cuts;
    const nextState: GeometryTargetState = {
      ...target,
      X: buildLoopCutVertexData(target.X, target.M, cut.vertexCount, cut.cuts, token.amount),
      M: cut.vertexCount,
      E: new Uint32Array(cut.edges),
      cellTopology: cut.topology,
      surfaceTopology: surfaceTopologyForEditedCellTopology(cut.topology),
    };
    this.setTargetState(token.instIdx, nextState);
    this.options.rebuildGeometryRenderer(token.instIdx);
    const selectedEdges = cut.cutLineEdgeIds.length
      ? cut.cutLineEdgeIds
      : cut.cuts.flatMap(entry => entry.segmentEdgeIds);
    this.options.setSelectedEditCells(1, selectedEdges, cut.topology);
    this.options.refreshAfterGeometryChange(token.instIdx, { dirtyUrl: false });
    token.applied = true;
    return true;
  }

  private updateEditLoopCut(token: unknown, amount: number, cutCount: number) {
    if (!isEditLoopCutToken<TUndoSnapshot>(token)) return;
    token.amount = Math.max(0, Math.min(1, amount));
    token.cutCount = Math.max(1, Math.floor(cutCount));
    this.applyEditLoopCutPreview(token);
  }

  private commitEditLoopCut(token: unknown) {
    if (!isEditLoopCutToken<TUndoSnapshot>(token)) return;
    if (!token.applied) {
      this.restoreEditGeometrySnapshot(token.instIdx, token.original);
      this.options.refreshAfterGeometryChange(token.instIdx, { dirtyUrl: false });
      return;
    }
    this.options.editService.commit(token.undoSnapshot, token.instIdx);
  }

  private cancelEditLoopCut(token: unknown) {
    if (!isEditLoopCutToken<TUndoSnapshot>(token)) return;
    this.restoreEditGeometrySnapshot(token.instIdx, token.original);
    const topology = this.targetState(token.instIdx)?.cellTopology;
    const cellIds = token.cellIds.length ? token.cellIds : [token.cellId];
    this.options.setSelectedEditCells(1, cellIds, topology);
    this.options.refreshAfterGeometryChange(token.instIdx, { dirtyUrl: false });
  }

  private startEditBevel(
    smoothness: number,
    kind: 'vertex' | 'edge' = 'edge',
    inward = false,
    mode: EditOperationMode = 'grouped',
  ): EditBevelToken<TUndoSnapshot> | null {
    const instIdx = this.validEditTarget();
    if (instIdx === null) return null;
    const context = this.options.selectedEditOperationContext();
    const selection = context?.selection;
    if (!context || !selection || selection.cellId < 0 || !selection.vertices.length) return null;
    const operationMode = normalizeEditOperationMode(mode);
    const targets = collectEditBevelTargets(context.topology, selection, kind, operationMode);
    if (!targets) return null;
    const original = this.options.editService.captureSnapshot(instIdx);
    if (!original) return null;
    return {
      undoSnapshot: this.options.captureUndoSnapshot(),
      mode: operationMode,
      kind,
      inward,
      instIdx,
      dimension: selection.dimension,
      cellId: selection.cellId,
      cellIds: [...selection.cellIds],
      vertices: [...selection.vertices],
      targetVertices: targets.targetVertices,
      targetEdges: targets.targetEdges,
      targetEdgeIds: targets.targetEdgeIds,
      amount: 0,
      smoothness: Math.max(1, Math.floor(smoothness)),
      applied: false,
      original,
    };
  }

  private restoreEditBevelTarget(token: EditBevelToken<TUndoSnapshot>) {
    this.restoreEditGeometrySnapshot(token.instIdx, token.original);
  }

  private applyEditBevelPreview(token: EditBevelToken<TUndoSnapshot>) {
    this.restoreEditBevelTarget(token);
    if (token.cellId < 0 || token.amount <= 0) {
      token.applied = false;
      this.options.projectAndRenderAll();
      if (this.options.getEditMode() && this.options.getObjectVisible(token.instIdx)) this.options.updateVertexCloud(token.instIdx);
      return;
    }

    const target = this.targetState(token.instIdx);
    const topology = target?.cellTopology;
    const oldVertexCount = target?.M ?? 0;
    const oldX = target?.X;
    if (!oldX || oldVertexCount <= 0) return;

    let currentTopology = topology;
    let currentX = oldX;
    let currentVertexCount = oldVertexCount;
    let currentOrigins = initialVertexOrigins(oldVertexCount);
    const sharedEdgeDistance = token.kind === 'edge'
      ? batchEdgeBevelDistance(oldX, oldVertexCount, token.targetEdges, token.amount)
      : undefined;
    let appliedAny = false;

    if (token.kind === 'vertex') {
      const bevel = bevelVertices(currentTopology, token.targetVertices, currentVertexCount, token.smoothness);
      if (!bevel) return;
      const sourceVertex = token.targetVertices[0] ?? -1;
      const nextX = buildBeveledVertexData(currentX, currentVertexCount, sourceVertex, bevel, token.amount, token.inward);
      currentOrigins = remapOriginsAfterVertexBevel(currentOrigins, sourceVertex, bevel);
      currentTopology = bevel.topology;
      currentX = nextX;
      currentVertexCount = bevel.vertexCount;
      appliedAny = true;
    } else if (token.targetEdgeIds.length > 1) {
      const bevel = bevelSelectedEdges(currentTopology, token.targetEdgeIds, currentVertexCount, token.smoothness);
      if (!bevel) return;
      const nextX = buildBeveledEdgeData(currentX, currentVertexCount, bevel, token.amount, sharedEdgeDistance, token.inward);
      currentOrigins = remapOriginsAfterEdgeBevel(currentOrigins, bevel);
      currentTopology = bevel.topology;
      currentX = nextX;
      currentVertexCount = bevel.vertexCount;
      appliedAny = true;
    } else {
      for (const [originA, originB] of token.targetEdges) {
        const currentEdge = findEdgeWithOrigins(
          currentTopology,
          currentOrigins,
          originA,
          originB,
          currentX,
          currentVertexCount,
        );
        if (currentEdge < 0) continue;
        const bevel = bevelEdge(currentTopology, currentEdge, currentVertexCount, token.smoothness);
        if (!bevel) continue;
        const nextX = buildBeveledEdgeData(currentX, currentVertexCount, bevel, token.amount, sharedEdgeDistance, token.inward);
        currentOrigins = remapOriginsAfterEdgeBevel(currentOrigins, bevel);
        currentTopology = bevel.topology;
        currentX = nextX;
        currentVertexCount = bevel.vertexCount;
        appliedAny = true;
      }
    }
    if (!appliedAny || !currentTopology) return;

    const nextSurfaceTopology = surfaceTopologyFromPositionedCellTopology(currentTopology, currentX, currentVertexCount)
      ?? surfaceTopologyForEditedCellTopology(currentTopology);

    this.options.clearEditSelection();
    this.setTargetState(token.instIdx, {
      X: new Float32Array(currentX),
      M: currentVertexCount,
      E: new Uint32Array(edgeListFromCellTopology(currentTopology)),
      cellTopology: cloneCellTopology(currentTopology),
      surfaceTopology: clonePrimitiveSurfaceTopology(nextSurfaceTopology),
    });
    this.options.rebuildGeometryRenderer(token.instIdx);
    token.applied = true;
    this.options.refreshAfterGeometryChange(token.instIdx, { dirtyUrl: false });
  }

  private updateEditBevel(token: unknown, amount: number, smoothness: number) {
    if (!isEditBevelToken<TUndoSnapshot>(token)) return;
    token.amount = Math.max(0, Math.min(BEVEL_MAX_AMOUNT, amount));
    token.smoothness = Math.max(1, Math.floor(smoothness));
    this.applyEditBevelPreview(token);
  }

  private commitEditBevel(token: unknown) {
    if (!isEditBevelToken<TUndoSnapshot>(token)) return;
    if (!token.applied) {
      this.restoreEditBevelTarget(token);
      this.options.refreshAfterGeometryChange(token.instIdx, { dirtyUrl: false });
      return;
    }
    this.options.editService.commit(token.undoSnapshot, token.instIdx);
  }

  private cancelEditBevel(token: unknown) {
    if (!isEditBevelToken<TUndoSnapshot>(token)) return;
    this.restoreEditBevelTarget(token);
    const topology = this.targetState(token.instIdx)?.cellTopology;
    if (token.cellIds.length && topology) this.options.setSelectedEditCells(token.dimension, token.cellIds, topology);
    else this.options.setSelectedEditElement(token.dimension, token.vertices, token.cellId);
    this.options.refreshAfterGeometryChange(token.instIdx, { dirtyUrl: false });
  }
}
