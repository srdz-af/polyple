import { maxCellDimension, type CellTopology } from '../geometry/cellTopology';
import type { HypercubeRenderer } from '../rendering/HypercubeRenderer';
import type { TransformController } from '../interaction/TransformController';
import type { SceneObjectStore } from './SceneObjectStore';
import type { SceneLightState } from './types';

type SceneLightRuntimeLike = {
  state: SceneLightState;
};

type SceneSelectionServiceOptions<TLight extends SceneLightRuntimeLike> = {
  baseSelection: number;
  noSelection: number;
  getObjectStore: () => SceneObjectStore<TLight>;
  getLights: () => TLight[];
  getEditMode: () => boolean;
  getBaseRenderer: () => HypercubeRenderer;
  getInstanceRenderer: (idx: number) => HypercubeRenderer | undefined;
  getBaseVertexCount: () => number;
  getBaseObjectDimension: () => number;
  getInstanceObjectDimension: (idx: number) => number;
  getTransformController: () => TransformController | null;
  setSceneControlTab: (tab: 'environment' | 'render' | 'texture' | 'lights') => void;
  applySceneBackground: () => void;
  updateObjectList: () => void;
  updateSelectionOutline: () => void;
  updateVertexCloud: (idx: number) => void;
  syncSceneLightPanel: () => void;
  updateTexturePanel: () => void;
  updateTransformActionButtons: () => void;
  requestSceneUrlUpdate: () => void;
};

export class SceneSelectionService<TLight extends SceneLightRuntimeLike = SceneLightRuntimeLike> {
  private primarySelection: number;
  private selectedSelectionItems: number[];
  private selectedLightId = '';

  constructor(private readonly options: SceneSelectionServiceOptions<TLight>) {
    this.primarySelection = options.baseSelection;
    this.selectedSelectionItems = [options.baseSelection];
  }

  get primary() {
    return this.primarySelection;
  }

  get items() {
    return this.selectedSelectionItems;
  }

  get lightId() {
    return this.selectedLightId;
  }

  setLightId(id: string) {
    this.selectedLightId = id;
  }

  contains(idx: number) {
    return this.selectedSelectionItems.includes(idx);
  }

  getObjectVisible(idx: number) {
    return this.options.getObjectStore().getObjectVisible(idx);
  }

  normalizeSelectionIndex(idx: number) {
    return this.options.getObjectStore().normalizeSelectionIndex(idx);
  }

  isSelectableObject(idx: number) {
    return this.options.getObjectStore().isSelectableObject(idx) && this.getObjectVisible(idx);
  }

  isGeometrySelectionIndex(idx: number) {
    return this.options.getObjectStore().isGeometrySelectionIndex(idx);
  }

  isLightSelectionIndex(idx: number) {
    return this.options.getObjectStore().isLightSelectionIndex(idx);
  }

  lightSelectionIndex(lightIndex: number) {
    return this.options.getObjectStore().lightSelectionIndex(lightIndex);
  }

  lightIndexFromSelection(idx: number) {
    return this.options.getObjectStore().lightIndexFromSelection(idx);
  }

  lightRuntimeForSelection(idx: number) {
    return this.options.getObjectStore().lightRuntimeForSelection(idx);
  }

  selectedLightRuntime() {
    return this.options.getLights().find(runtime => runtime.state.id === this.selectedLightId) ?? null;
  }

  selectedLightSelectionIndex() {
    const index = this.options.getLights().findIndex(runtime => runtime.state.id === this.selectedLightId);
    return index >= 0 ? this.lightSelectionIndex(index) : this.options.noSelection;
  }

  ensureSelectedLightId() {
    if (!this.options.getLights().some(runtime => runtime.state.id === this.selectedLightId)) {
      this.selectedLightId = this.options.getLights()[0]?.state.id ?? '';
    }
    return this.selectedLightId;
  }

  setSnapshot(primary: number, items?: number[], reconcile = true) {
    this.primarySelection = this.normalizeSelectionIndex(primary);
    this.selectedSelectionItems = (items ?? [this.primarySelection]).map(idx => this.normalizeSelectionIndex(idx));
    if (reconcile) this.reconcile();
    this.ensureSelectedLightId();
  }

  clear() {
    this.primarySelection = this.options.noSelection;
    this.selectedSelectionItems = [];
  }

  replaceWithVisibleBaseIfAvailable() {
    if (this.getObjectVisible(this.options.baseSelection)) {
      this.primarySelection = this.options.baseSelection;
      this.selectedSelectionItems = [this.options.baseSelection];
    } else {
      this.clear();
    }
  }

  repairAfterLightRemoval(removedSelection: number) {
    const removedWasSelected = this.selectedSelectionItems.includes(removedSelection);
    this.ensureSelectedLightId();
    if (removedWasSelected) {
      const nextSelection = this.selectedLightSelectionIndex();
      this.setSnapshot(nextSelection, nextSelection === this.options.noSelection ? [] : [nextSelection]);
      return;
    }

    this.selectedSelectionItems = this.selectedSelectionItems.filter(idx => this.isGeometrySelectionIndex(idx));
    this.primarySelection = this.isLightSelectionIndex(this.primarySelection)
      ? (this.selectedSelectionItems[0] ?? this.options.noSelection)
      : this.normalizeSelectionIndex(this.primarySelection);
    this.reconcile();
  }

  reconcile() {
    const normalized = this.selectedSelectionItems
      .map(idx => this.normalizeSelectionIndex(idx))
      .filter((idx, position, arr) => (
        idx !== this.options.noSelection
        && arr.indexOf(idx) === position
        && this.getObjectVisible(idx)
      ));

    const primary = this.normalizeSelectionIndex(this.primarySelection);
    if (primary !== this.options.noSelection && this.getObjectVisible(primary)) {
      this.primarySelection = primary;
      this.selectedSelectionItems = [primary, ...normalized.filter(idx => idx !== primary)];
    } else {
      this.selectedSelectionItems = normalized;
      this.primarySelection = this.selectedSelectionItems[0] ?? this.options.noSelection;
    }
    this.ensureSelectedLightId();
  }

  selectObject(idx: number, additive = false) {
    const normalizedIdx = this.normalizeSelectionIndex(idx);

    if (additive) {
      if (normalizedIdx === this.options.noSelection) return;
      if (!this.isSelectableObject(normalizedIdx)) return;
      if (this.primarySelection === this.options.noSelection) {
        this.primarySelection = normalizedIdx;
        this.selectedSelectionItems = [normalizedIdx];
      } else if (normalizedIdx !== this.primarySelection) {
        if (this.selectedSelectionItems.includes(normalizedIdx)) {
          this.selectedSelectionItems = this.selectedSelectionItems.filter(entry => entry !== normalizedIdx);
        } else {
          this.selectedSelectionItems.push(normalizedIdx);
        }
      }
    } else {
      this.primarySelection = this.isSelectableObject(normalizedIdx) ? normalizedIdx : this.options.noSelection;
      this.selectedSelectionItems = this.primarySelection === this.options.noSelection ? [] : [this.primarySelection];
    }

    this.reconcile();
    const selectedLight = this.lightRuntimeForSelection(this.primarySelection);
    if (selectedLight) {
      this.selectedLightId = selectedLight.state.id;
      this.options.setSceneControlTab('lights');
    }
    this.notifySelectionChanged();
  }

  notifySelectionChanged() {
    const transformController = this.options.getTransformController();
    transformController?.clearEditSelection();
    this.options.updateObjectList();
    this.options.updateSelectionOutline();
    this.options.applySceneBackground();
    transformController?.clearVertexMarker();
    transformController?.clearVertexCloud();
    transformController?.clearFaceCenterCloud();
    transformController?.clearEditWireOverlay();
    if (
      this.options.getEditMode()
      && this.isGeometrySelectionIndex(this.primarySelection)
      && this.getObjectVisible(this.primarySelection)
    ) {
      this.options.updateVertexCloud(this.primarySelection);
    }
    this.options.syncSceneLightPanel();
    this.options.updateTexturePanel();
    this.options.updateTransformActionButtons();
    this.options.requestSceneUrlUpdate();
  }

  selectedObjectRenderer() {
    if (!this.isGeometrySelectionIndex(this.primarySelection)) return undefined;
    return this.primarySelection === this.options.baseSelection
      ? this.options.getBaseRenderer()
      : this.options.getInstanceRenderer(this.primarySelection);
  }

  selectedObjectCellTopology() {
    return this.selectedObjectRenderer()?.getCellTopologyForSelection();
  }

  maxEditableCellDimensionForSelection() {
    return maxCellDimension(this.selectedObjectCellTopology());
  }

  selectedObjectDimension() {
    if (!this.isGeometrySelectionIndex(this.primarySelection)) return 0;
    if (this.primarySelection === this.options.baseSelection) {
      return this.options.getBaseVertexCount() > 0 ? this.options.getBaseObjectDimension() : 0;
    }
    return this.options.getInstanceObjectDimension(this.primarySelection);
  }

  clampActiveDimension() {
    const transformController = this.options.getTransformController();
    if (!transformController) return;
    const maxDim = this.maxEditableCellDimensionForSelection();
    if (transformController.getEditCellDimension() > maxDim) {
      transformController.setEditCellDimension(maxDim);
    }
  }

  setEditCellDimension(dimension: number) {
    const transformController = this.options.getTransformController();
    if (!transformController) return;
    const maxDim = this.maxEditableCellDimensionForSelection();
    transformController.setEditCellDimension(Math.max(0, Math.min(maxDim, Math.floor(dimension))));
    if (
      this.options.getEditMode()
      && this.isGeometrySelectionIndex(this.primarySelection)
      && this.getObjectVisible(this.primarySelection)
    ) {
      this.options.updateVertexCloud(this.primarySelection);
    }
    this.options.updateTransformActionButtons();
  }

  selectAllEditCells() {
    const transformController = this.options.getTransformController();
    if (
      !transformController
      || !this.options.getEditMode()
      || !this.isGeometrySelectionIndex(this.primarySelection)
      || !this.getObjectVisible(this.primarySelection)
    ) {
      return;
    }
    const topology = this.selectedObjectCellTopology();
    if (!topology) return;
    const dimension = transformController.getEditCellDimension();
    transformController.selectAllEditCells(dimension, topology);
    this.options.updateVertexCloud(this.primarySelection);
    this.options.updateSelectionOutline();
    this.options.updateTransformActionButtons();
  }

  restorePackedEditSelection(dimension: number, cellIds: number[]) {
    const transformController = this.options.getTransformController();
    if (!transformController) return;
    transformController.setSelectedEditCells(dimension, cellIds, this.selectedObjectCellTopology());
  }

  selectedEditOperationContext() {
    const transformController = this.options.getTransformController();
    if (
      !transformController
      || !this.options.getEditMode()
      || !this.isGeometrySelectionIndex(this.primarySelection)
      || !this.getObjectVisible(this.primarySelection)
    ) {
      return null;
    }
    const selection = transformController.getEditSelection();
    if (!selection || selection.cellId < 0 || !selection.vertices.length) return null;
    const topology = this.selectedObjectCellTopology();
    if (!topology) return null;
    return { selection, topology: topology as CellTopology };
  }

  hasActiveSelection() {
    return this.selectedSelectionItems.some(idx => this.isSelectableObject(idx));
  }

  selectedGeometryObjects() {
    return this.selectedSelectionItems.filter(idx => this.isGeometrySelectionIndex(idx) && this.isSelectableObject(idx));
  }
}
