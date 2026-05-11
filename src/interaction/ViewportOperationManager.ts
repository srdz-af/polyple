export type ViewportOperationScope = 'edit' | 'object' | 'viewport' | 'light' | 'axis';

export type ViewportPointerPoint = {
  clientX: number;
  clientY: number;
};

export type ViewportOperation = {
  kind: string;
  scope: ViewportOperationScope;
  blocksCamera?: boolean;
  blocksSelection?: boolean;
  blocksContextMenu?: boolean;
  usesPointerCapture?: boolean;
  usesPointerLock?: boolean;
  updatePointer?: (point: ViewportPointerPoint, ev?: PointerEvent) => boolean | void;
  updateWheel?: (ev: WheelEvent) => boolean | void;
  commit?: () => void;
  cancel?: () => void;
  cleanup?: () => void;
};

export class ViewportOperationManager {
  private active: ViewportOperation | null = null;

  get current() {
    return this.active;
  }

  isActive() {
    return this.active !== null;
  }

  isKind(kind: string) {
    return this.active?.kind === kind;
  }

  hasScope(scope: ViewportOperationScope) {
    return this.active?.scope === scope;
  }

  start(operation: ViewportOperation) {
    if (this.active) return false;
    this.active = operation;
    return true;
  }

  updatePointer(point: ViewportPointerPoint, ev?: PointerEvent) {
    if (!this.active?.updatePointer) return false;
    return this.active.updatePointer(point, ev) !== false;
  }

  updateWheel(ev: WheelEvent) {
    if (!this.active?.updateWheel) return false;
    return this.active.updateWheel(ev) !== false;
  }

  finish(commit: boolean) {
    const operation = this.active;
    if (!operation) return false;
    this.active = null;
    try {
      if (commit) operation.commit?.();
      else operation.cancel?.();
    } finally {
      operation.cleanup?.();
    }
    return true;
  }

  cancel() {
    return this.finish(false);
  }
}
