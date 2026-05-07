import { VIEW_MODES, type ViewMode } from '../constants';
import { viewModeShortcutIndex, type KeyboardCameraController } from '../controls/KeyboardCameraController';
import type { TransformMode } from '../scene/types';
import { isPlainTextEditTarget, isTextEntryTarget } from '../ui/domTargets';

type KeyboardShortcutControllerOptions = {
  isModalOpen: () => boolean;
  getTransformMode: () => TransformMode;
  handleTransformConstraintKey: (key: string) => boolean;
  keyboardCamera: KeyboardCameraController;
  setViewMode: (mode: ViewMode) => void;
  toggleRecording: () => void;
  captureFrame: () => void;
  exportAnimation: () => void;
  toggleAnimationPlayback: () => void;
  insertKeyframe: () => void;
  removeLastKeyframe: () => void;
  toggleEditMode: () => void;
  startTransformFromPointer: (mode: TransformMode) => void;
  showAddObjectMenuAtPointer: () => void;
  deleteOrConfirmSelection: () => void;
  hasSelection: () => boolean;
  undo: () => void;
  redo: () => void;
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
    if (this.options.getTransformMode() === 'none') return;
    const key = ev.key.toLowerCase();
    if (this.options.handleTransformConstraintKey(key)) ev.preventDefault();
  }

  private handleGeneralShortcut(ev: KeyboardEvent) {
    if (this.options.isModalOpen()) return;
    if (isTextEntryTarget(ev.target)) return;
    const key = ev.key.toLowerCase();
    const hasSystemMod = ev.ctrlKey || ev.metaKey || ev.altKey;
    const transformMode = this.options.getTransformMode();

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

    if (!hasSystemMod && !ev.shiftKey && transformMode === 'none' && ev.code === 'Space') {
      ev.preventDefault();
      this.options.toggleAnimationPlayback();
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
    if (hasSystemMod) return;

    if (transformMode !== 'none') return;
    if (!ev.shiftKey && (key === 'g' || key === 'r' || key === 's')) {
      ev.preventDefault();
      const modeMap: Record<'g' | 'r' | 's', TransformMode> = { g: 'move', r: 'rotate', s: 'scale' };
      this.options.startTransformFromPointer(modeMap[key as 'g' | 'r' | 's']);
      return;
    }
    if (key === 'a' && ev.shiftKey) {
      ev.preventDefault();
      this.options.showAddObjectMenuAtPointer();
      return;
    }
    if (!ev.shiftKey && key === 'x') {
      ev.preventDefault();
      if (!this.options.hasSelection()) return;
      this.options.deleteOrConfirmSelection();
    }
  }
}
