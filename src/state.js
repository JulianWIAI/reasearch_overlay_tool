export const HISTORY_LIMIT = 50;

function cloneLayout(state) {
  return {
    globalOpacity: state.globalOpacity,
    items: state.items.map((item) => ({ ...item })),
    strokes: state.strokes.map((stroke) => ({
      ...stroke,
      points: stroke.points.map((point) => ({ ...point }))
    })),
    zOrder: state.zOrder
  };
}

function layoutsEqual(left, right) {
  const normalize = (layout) => ({
    ...layout,
    items: layout.items.map(({ element, file, source, ...item }) => item)
  });
  return JSON.stringify(normalize(left)) === JSON.stringify(normalize(right));
}

export class OverlayState {
  constructor(options = {}) {
    this.historyLimit = options.historyLimit ?? HISTORY_LIMIT;
    this.mode = "move";
    this.globalOpacity = 1;
    this.clickThrough = false;
    this.visible = true;
    this.active = true;
    this.items = [];
    this.strokes = [];
    this.zOrder = 0;
    this.undoStack = [];
    this.redoStack = [];
    this.listeners = new Set();
  }

  subscribe(listener) {
    this.listeners.add(listener);
    listener(this);
    return () => this.listeners.delete(listener);
  }

  notify() {
    this.listeners.forEach((listener) => listener(this));
  }

  snapshot() {
    return cloneLayout(this);
  }

  setMode(mode) {
    if (!["move", "draw", "erase"].includes(mode)) {
      throw new TypeError(`Unsupported overlay mode: ${mode}`);
    }
    this.mode = mode;
    this.notify();
  }

  setGlobalOpacity(opacity) {
    const parsed = Number(opacity);
    this.globalOpacity = Math.min(1, Math.max(0.1, Number.isFinite(parsed) ? parsed : 1));
    this.notify();
  }

  toggleClickThrough(force) {
    this.clickThrough = typeof force === "boolean" ? force : !this.clickThrough;
    if (this.clickThrough) this.mode = "move";
    this.notify();
  }

  setVisibility(visible) {
    this.visible = Boolean(visible);
    this.active = this.visible;
    this.notify();
  }

  transaction(mutator) {
    const before = this.snapshot();
    mutator(this);
    const after = this.snapshot();
    if (layoutsEqual(before, after)) return false;
    this.undoStack.push(before);
    if (this.undoStack.length > this.historyLimit) this.undoStack.shift();
    this.redoStack.length = 0;
    this.notify();
    return true;
  }

  undo() {
    const previous = this.undoStack.pop();
    if (!previous) return false;
    this.redoStack.push(this.snapshot());
    this.restore(previous);
    return true;
  }

  redo() {
    const next = this.redoStack.pop();
    if (!next) return false;
    this.undoStack.push(this.snapshot());
    if (this.undoStack.length > this.historyLimit) this.undoStack.shift();
    this.restore(next);
    return true;
  }

  restore(snapshot) {
    Object.assign(this, cloneLayout(snapshot));
    this.notify();
  }

  get canUndo() {
    return this.undoStack.length > 0;
  }

  get canRedo() {
    return this.redoStack.length > 0;
  }
}
