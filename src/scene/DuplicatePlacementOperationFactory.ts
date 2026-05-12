import * as THREE from 'three';
import type { ViewportOperation, ViewportPointerPoint } from '../interaction/ViewportOperationManager';

type DuplicatePlacement<TUndoSnapshot, TInstance, TLight> = {
  undoSnapshot: TUndoSnapshot;
  originalSelectedInstance: number;
  originalSelectedInstances: number[];
  instance?: TInstance;
  lightRuntime?: TLight;
};

type DuplicatePlacementOperationFactoryOptions<TUndoSnapshot, TInstance, TLight> = {
  noSelection: number;
  getEditMode: () => boolean;
  getSelectedInstance: () => number;
  getSelectedInstances: () => number[];
  getControlsEnabled: () => boolean;
  setControlsEnabled: (enabled: boolean) => void;
  isGeometrySelectionIndex: (idx: number) => boolean;
  captureUndoSnapshot: () => TUndoSnapshot;
  pushUndoSnapshot: (snapshot: TUndoSnapshot) => void;
  createLightDuplicate: (idx: number, position: THREE.Vector3) => TLight | null;
  createInstanceDuplicate: (idx: number, position: THREE.Vector3) => TInstance | null;
  moveLightDuplicate: (runtime: TLight, position: THREE.Vector3) => void;
  moveInstanceDuplicate: (instance: TInstance, position: THREE.Vector3) => void;
  removeLightDuplicate: (runtime: TLight) => void;
  removeInstanceDuplicate: (instance: TInstance) => void;
  restoreSelection: (primary: number, items: number[]) => void;
  refreshAfterRestoreSelection: () => void;
  refreshAfterCommit: () => void;
  projectAndRenderAll: () => void;
};

export class DuplicatePlacementOperationFactory<TUndoSnapshot, TInstance, TLight> {
  constructor(private readonly options: DuplicatePlacementOperationFactoryOptions<TUndoSnapshot, TInstance, TLight>) {}

  createOperation(
    position: THREE.Vector3,
    pickPosition: (point: ViewportPointerPoint) => THREE.Vector3,
  ): ViewportOperation | null {
    const token = this.startPlacement(position);
    if (!token) return null;
    const prevControlsEnabled = this.options.getControlsEnabled();
    this.options.setControlsEnabled(false);
    return {
      kind: 'duplicate-placement',
      scope: 'object',
      blocksCamera: true,
      blocksSelection: true,
      blocksContextMenu: true,
      usesPointerLock: true,
      updatePointer: point => {
        this.movePlacement(token, pickPosition(point));
        return true;
      },
      commit: () => this.commitPlacement(token),
      cancel: () => this.cancelPlacement(token),
      cleanup: () => {
        this.options.setControlsEnabled(prevControlsEnabled);
      },
    };
  }

  private startPlacement(position: THREE.Vector3): DuplicatePlacement<TUndoSnapshot, TInstance, TLight> | null {
    const selected = this.options.getSelectedInstance();
    if (this.options.getEditMode() || selected === this.options.noSelection) return null;
    const undoSnapshot = this.options.captureUndoSnapshot();
    const originalSelectedInstance = selected;
    const originalSelectedInstances = [...this.options.getSelectedInstances()];

    const lightRuntime = this.options.createLightDuplicate(selected, position);
    if (lightRuntime) {
      return {
        undoSnapshot,
        originalSelectedInstance,
        originalSelectedInstances,
        lightRuntime,
      };
    }

    if (!this.options.isGeometrySelectionIndex(selected)) return null;
    const instance = this.options.createInstanceDuplicate(selected, position);
    if (!instance) return null;
    return {
      undoSnapshot,
      originalSelectedInstance,
      originalSelectedInstances,
      instance,
    };
  }

  private movePlacement(token: DuplicatePlacement<TUndoSnapshot, TInstance, TLight>, position: THREE.Vector3) {
    if (token.lightRuntime) {
      this.options.moveLightDuplicate(token.lightRuntime, position);
      return;
    }
    if (token.instance) this.options.moveInstanceDuplicate(token.instance, position);
  }

  private restoreSelectionAfterPlacement(token: DuplicatePlacement<TUndoSnapshot, TInstance, TLight>) {
    this.options.restoreSelection(token.originalSelectedInstance, token.originalSelectedInstances);
    this.options.refreshAfterRestoreSelection();
  }

  private cancelPlacement(token: DuplicatePlacement<TUndoSnapshot, TInstance, TLight>) {
    if (token.lightRuntime) this.options.removeLightDuplicate(token.lightRuntime);
    if (token.instance) this.options.removeInstanceDuplicate(token.instance);
    this.restoreSelectionAfterPlacement(token);
    this.options.projectAndRenderAll();
  }

  private commitPlacement(token: DuplicatePlacement<TUndoSnapshot, TInstance, TLight>) {
    this.options.pushUndoSnapshot(token.undoSnapshot);
    this.options.refreshAfterCommit();
  }
}
