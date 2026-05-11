import { VIEW_MODES, type ViewMode } from '../constants';
import { viewModeShortcutIndex, type KeyboardCameraController } from '../controls/KeyboardCameraController';
import type { EditCellDimension, TransformMode } from '../scene/types';
import { isPlainTextEditTarget, isTextEntryTarget } from '../ui/domTargets';
import type { EditOperationRequest } from './ViewportInteractionController';

type KeyboardShortcutControllerOptions = {
  isModalOpen: () => boolean;
  isEditMode: () => boolean;
  getTransformMode: () => TransformMode;
  isOperationActive: () => boolean;
  handleTransformConstraintKey: (key: string) => boolean;
  keyboardCamera: KeyboardCameraController;
  setViewMode: (mode: ViewMode) => void;
  toggleRecording: () => void;
  captureFrame: () => void;
  exportAnimation: () => void;
  toggleAnimationPlayback: () => void;
  toggleAxisAutoRotations: () => void;
  insertKeyframe: () => void;
  removeLastKeyframe: () => void;
  toggleEditMode: () => void;
  startTransformFromPointer: (mode: TransformMode, replaceActive?: boolean) => void;
  startEditOperationFromPointer: (request: EditOperationRequest, replaceActive?: boolean) => void;
  selectAllEditCells: () => void;
  showAddObjectMenuAtPointer: (replaceActive?: boolean) => void;
  duplicateSelectionFromPointer: (replaceActive?: boolean) => void;
  deleteOrConfirmSelection: () => void;
  hasSelection: () => boolean;
  undo: () => void;
  redo: () => void;
  togglePerfOverlay: () => void;
  setEditCellDimension: (dimension: EditCellDimension) => void;
  changePrimitiveDimension: (delta: number) => void;
};

export class KeyboardShortcutController {
  constructor(private readonly options: KeyboardShortcutControllerOptions) {}

  bind() {
    window.addEventListener('keydown', ev => this.handleUndoRedo(ev));
    window.addEventListener('keydown', ev => this.handleTransformConstraint(ev));
    window.addEventListener('keydown', ev => this.handleGeneralShortcut(ev));
    window.addEventListener('keyup', ev => this.options.keyboardCamera.handleKeyUp(ev));
  }

  private handleUndoRedo(ev: KeyboardEvent) {
    if (this.options.isModalOpen()) return;
    const key = ev.key.toLowerCase();
    const hasMod = ev.ctrlKey || ev.metaKey;
    if (!hasMod) return;
    const wantsUndo = key === 'z' && !ev.shiftKey;
    const wantsRedo = key === 'y' || (key === 'z' && ev.shiftKey);
    if (!wantsUndo && !wantsRedo) return;
    if (isPlainTextEditTarget(ev.target)) return;
    if (this.options.getTransformMode() !== 'none') return;

    ev.preventDefault();
    if (wantsUndo) this.options.undo();
    else this.options.redo();
  }

  private handleTransformConstraint(ev: KeyboardEvent) {
    if (this.options.isModalOpen()) return;
    if (isTextEntryTarget(ev.target)) return;
    const key = ev.key.toLowerCase();
    if (this.options.handleTransformConstraintKey(key)) ev.preventDefault();
  }

  private handleGeneralShortcut(ev: KeyboardEvent) {
    if (this.options.isModalOpen()) return;
    if (isTextEntryTarget(ev.target)) return;
    if (ev.defaultPrevented) return;
    const key = ev.key.toLowerCase();
    const hasSystemMod = ev.ctrlKey || ev.metaKey || ev.altKey;
    const transformMode = this.options.getTransformMode();
    const operationActive = this.options.isOperationActive();
    const canReplaceOperation = transformMode === 'none' || operationActive;

    if (!hasSystemMod && transformMode === 'none') {
      if (ev.key === '+' || ev.key === '=' || ev.code === 'NumpadAdd') {
        ev.preventDefault();
        this.options.changePrimitiveDimension(1);
        return;
      }
      if (ev.key === '-' || ev.key === '_' || ev.code === 'NumpadSubtract') {
        ev.preventDefault();
        this.options.changePrimitiveDimension(-1);
        return;
      }
    }

    if (!hasSystemMod && !ev.shiftKey && transformMode === 'none' && this.options.isEditMode()) {
      const dimension = viewModeShortcutIndex(ev);
      if (dimension >= 0 && dimension <= 7) {
        ev.preventDefault();
        this.options.setEditCellDimension(dimension);
        return;
      }
    }

    if (!hasSystemMod && !ev.shiftKey && transformMode === 'none') {
      const mode = VIEW_MODES[viewModeShortcutIndex(ev)];
      if (mode) {
        ev.preventDefault();
        this.options.setViewMode(mode);
        return;
      }
    }

    if (this.options.keyboardCamera.handleKeyDown(ev, key)) return;

    if ((ev.ctrlKey || ev.metaKey) && ev.shiftKey && !ev.altKey && transformMode === 'none' && key === 'e') {
      ev.preventDefault();
      this.options.exportAnimation();
      return;
    }
    if ((ev.ctrlKey || ev.metaKey) && ev.shiftKey && !ev.altKey && transformMode === 'none' && key === 'd') {
      ev.preventDefault();
      this.options.togglePerfOverlay();
      return;
    }

    if (!hasSystemMod && !ev.shiftKey && canReplaceOperation && this.options.isEditMode() && key === 'e') {
      ev.preventDefault();
      this.options.startEditOperationFromPointer({ type: 'extrude' }, operationActive);
      return;
    }
    if (!hasSystemMod && !ev.shiftKey && canReplaceOperation && this.options.isEditMode() && key === 'i') {
      ev.preventDefault();
      this.options.startEditOperationFromPointer({ type: 'inset' }, operationActive);
      return;
    }
    if (!hasSystemMod && !ev.shiftKey && canReplaceOperation && this.options.isEditMode() && key === 'b') {
      ev.preventDefault();
      this.options.startEditOperationFromPointer({ type: 'bevel', kind: 'edge' }, operationActive);
      return;
    }
    if (!hasSystemMod && ev.shiftKey && canReplaceOperation && this.options.isEditMode() && key === 'b') {
      ev.preventDefault();
      this.options.startEditOperationFromPointer({ type: 'bevel', kind: 'vertex' }, operationActive);
      return;
    }
    if (!ev.ctrlKey && !ev.metaKey && ev.altKey && !ev.shiftKey && canReplaceOperation && this.options.isEditMode() && key === 'b') {
      ev.preventDefault();
      this.options.startEditOperationFromPointer({ type: 'bevel', kind: 'edge', inward: true }, operationActive);
      return;
    }
    if (!ev.ctrlKey && !ev.metaKey && ev.altKey && ev.shiftKey && canReplaceOperation && this.options.isEditMode() && key === 'b') {
      ev.preventDefault();
      this.options.startEditOperationFromPointer({ type: 'bevel', kind: 'vertex', inward: true }, operationActive);
      return;
    }

    if (!hasSystemMod && !ev.shiftKey && transformMode === 'none' && ev.code === 'Space') {
      ev.preventDefault();
      this.options.toggleAnimationPlayback();
      return;
    }

    if (!hasSystemMod && transformMode === 'none' && key === 'p') {
      ev.preventDefault();
      this.options.toggleAxisAutoRotations();
      return;
    }

    if (!hasSystemMod && !ev.shiftKey && transformMode === 'none' && key === 'i') {
      ev.preventDefault();
      this.options.insertKeyframe();
      return;
    }
    if (!hasSystemMod && !ev.shiftKey && transformMode === 'none' && key === 'u') {
      ev.preventDefault();
      this.options.removeLastKeyframe();
      return;
    }

    if (!hasSystemMod && ev.shiftKey && transformMode === 'none') {
      if (key === 'r') {
        ev.preventDefault();
        this.options.toggleRecording();
        return;
      }
      if (key === 's') {
        ev.preventDefault();
        this.options.captureFrame();
        return;
      }
    }

    if (ev.key === 'Tab') {
      ev.preventDefault();
      this.options.toggleEditMode();
    }
    if ((ev.ctrlKey || ev.metaKey) && !ev.shiftKey && !ev.altKey && transformMode === 'none' && key === 'a') {
      if (this.options.isEditMode()) {
        ev.preventDefault();
        this.options.selectAllEditCells();
      }
      return;
    }
    if (hasSystemMod) return;

    if (transformMode !== 'none' && !operationActive) return;
    if (!ev.shiftKey && (key === 'g' || key === 'r' || key === 's')) {
      ev.preventDefault();
      const modeMap: Record<'g' | 'r' | 's', TransformMode> = { g: 'move', r: 'rotate', s: 'scale' };
      this.options.startTransformFromPointer(modeMap[key as 'g' | 'r' | 's'], operationActive);
      return;
    }
    if (transformMode !== 'none') return;
    if (key === 'a' && ev.shiftKey) {
      ev.preventDefault();
      this.options.showAddObjectMenuAtPointer(operationActive);
      return;
    }
    if (key === 'd' && ev.shiftKey && !this.options.isEditMode()) {
      ev.preventDefault();
      if (!this.options.hasSelection()) return;
      this.options.duplicateSelectionFromPointer(operationActive);
      return;
    }
    if (!ev.shiftKey && key === 'x') {
      ev.preventDefault();
      if (!this.options.hasSelection()) return;
      this.options.deleteOrConfirmSelection();
    }
  }
}
