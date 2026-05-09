type SceneHistoryOptions<TSnapshot> = {
  capture: () => TSnapshot;
  apply: (snapshot: TSnapshot) => void | Promise<void>;
  maxEntries?: number;
};

export class SceneHistory<TSnapshot> {
  private readonly undoStack: TSnapshot[] = [];
  private readonly redoStack: TSnapshot[] = [];
  private readonly maxEntries: number;
  private applying = false;

  constructor(private readonly options: SceneHistoryOptions<TSnapshot>) {
    this.maxEntries = options.maxEntries ?? 20;
  }

  push(snapshot?: TSnapshot) {
    if (this.applying) return;
    this.undoStack.push(snapshot ?? this.options.capture());
    if (this.undoStack.length > this.maxEntries) this.undoStack.shift();
    this.redoStack.length = 0;
  }

  async undo() {
    if (this.applying) return;
    const snapshot = this.undoStack.pop();
    if (!snapshot) return;
    this.redoStack.push(this.options.capture());
    this.applying = true;
    try {
      await this.options.apply(snapshot);
    } finally {
      this.applying = false;
    }
  }

  async redo() {
    if (this.applying) return;
    const snapshot = this.redoStack.pop();
    if (!snapshot) return;
    this.undoStack.push(this.options.capture());
    this.applying = true;
    try {
      await this.options.apply(snapshot);
    } finally {
      this.applying = false;
    }
  }
}
