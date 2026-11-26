import { exportLayout, validateLayout } from "./layout.js";

export class Toolbar {
  constructor({ root, state, items, renderer, window, onDestroy }) {
    this.root = root;
    this.state = state;
    this.items = items;
    this.renderer = renderer;
    this.window = window;
    this.onDestroy = onDestroy;
    this.abortController = new AbortController();
    this.toolbarPosition = { left: 8, top: 12 };
    this.toolbarDrag = null;
    this.root.innerHTML = `
      <div id="toolbar" role="toolbar" aria-label="Research overlay tools">
        <span
          id="toolbar-drag-handle"
          class="toolbar-drag-handle"
          role="button"
          tabindex="0"
          aria-label="Drag toolbar"
          title="Drag toolbar"
        >⠿</span>
        <button id="btn-move" data-mode="move" title="Drag and position items">Move</button>
        <button id="btn-draw" data-mode="draw" title="Freehand drawing">Draw</button>
        <button id="btn-erase" data-mode="erase" title="Erase drawing">Erase</button>
        <input id="draw-color" type="color" value="#ef4444" aria-label="Brush color">
        <input id="brush-size" type="range" min="1" max="20" value="3" aria-label="Brush size">
        <div class="divider"></div>
        <button id="btn-add-text">+ Text</button>
        <label class="btn">+ Media
          <input id="file-input" type="file" accept="image/*,video/*" multiple hidden>
        </label>
        <div class="divider"></div>
        <div class="control-group">
          <label for="global-opacity">Opacity</label>
          <input id="global-opacity" type="range" min="0.1" max="1" step="0.05" value="1">
          <span id="opacity-val">100%</span>
        </div>
        <div class="divider"></div>
        <button id="btn-clickthrough" aria-pressed="false">Click-through: off</button>
        <button id="btn-undo" title="Undo (Ctrl/Cmd+Z)">Undo</button>
        <button id="btn-redo" title="Redo (Ctrl+Y or Cmd+Shift+Z)">Redo</button>
        <button id="btn-export">Export JSON</button>
        <label class="btn">Import JSON
          <input id="layout-input" type="file" accept="application/json,.json" hidden>
        </label>
        <button id="btn-clear" class="danger">Clear</button>
        <button id="btn-close" title="Hide overlay">Close</button>
      </div>
      <div id="status" role="status" aria-live="polite"></div>
      <div id="overlay-layer">
        <canvas id="draw-canvas"></canvas>
      </div>
    `;

    this.bind();
    this.initializeToolbarPosition();
    this.unsubscribe = state.subscribe(() => this.render());
  }

  get(id) {
    return this.root.querySelector(`#${id}`);
  }

  setStatus(message, error = false) {
    const status = this.get("status");
    status.textContent = message;
    status.style.color = error ? "#fecaca" : "#fff";
  }

  bind() {
    const signal = this.abortController.signal;
    const handle = this.get("toolbar-drag-handle");
    handle.addEventListener("pointerdown", (event) => this.onToolbarPointerDown(event), { signal });
    handle.addEventListener("pointermove", (event) => this.onToolbarPointerMove(event), { signal });
    handle.addEventListener("pointerup", (event) => this.onToolbarPointerUp(event), { signal });
    handle.addEventListener("pointercancel", () => this.endToolbarDrag(), { signal });
    this.root.querySelectorAll("[data-mode]").forEach((button) => {
      button.addEventListener("click", () => this.state.setMode(button.dataset.mode), { signal });
    });
    this.get("btn-add-text").addEventListener("click", () => this.items.addText(), { signal });
    this.get("file-input").addEventListener("change", (event) => {
      this.items.addFiles(event.target.files);
      event.target.value = "";
    }, { signal });
    this.get("global-opacity").addEventListener("input", (event) => {
      this.state.setGlobalOpacity(event.target.value);
    }, { signal });
    this.get("btn-clickthrough").addEventListener("click", () => this.state.toggleClickThrough(), { signal });
    this.get("btn-undo").addEventListener("click", () => this.state.undo(), { signal });
    this.get("btn-redo").addEventListener("click", () => this.state.redo(), { signal });
    this.get("btn-clear").addEventListener("click", () => {
      this.state.transaction((state) => {
        state.items = [];
        state.strokes = [];
      });
      this.setStatus("Layout cleared.");
    }, { signal });
    this.get("btn-export").addEventListener("click", () => this.exportJson(), { signal });
    this.get("layout-input").addEventListener("change", (event) => {
      this.importJson(event.target.files?.[0]);
      event.target.value = "";
    }, { signal });
    this.get("btn-close").addEventListener("click", () => this.onDestroy?.(), { signal });
    this.window.addEventListener("keydown", (event) => this.onKeyDown(event), { signal });
    this.window.addEventListener("resize", () => this.clampToolbarPosition(), { signal });
  }

  initializeToolbarPosition() {
    const toolbar = this.get("toolbar");
    const width = this.getToolbarWidth(toolbar);
    const left = Math.round((Math.max(16, this.window.innerWidth) - width) / 2);
    this.setToolbarPosition(left, 12);
  }

  getToolbarWidth(toolbar) {
    return toolbar.offsetWidth || toolbar.getBoundingClientRect().width || 0;
  }

  getToolbarHeight(toolbar) {
    return toolbar.offsetHeight || toolbar.getBoundingClientRect().height || 0;
  }

  setToolbarPosition(left, top) {
    const toolbar = this.get("toolbar");
    const margin = 8;
    const width = this.getToolbarWidth(toolbar);
    const height = this.getToolbarHeight(toolbar);
    const availableWidth = Math.max(margin, this.window.innerWidth - margin - width);
    const availableHeight = Math.max(margin, this.window.innerHeight - margin - height);
    this.toolbarPosition = {
      left: Math.round(Math.min(Math.max(left, margin), availableWidth)),
      top: Math.round(Math.min(Math.max(top, margin), availableHeight))
    };
    toolbar.style.left = `${this.toolbarPosition.left}px`;
    toolbar.style.top = `${this.toolbarPosition.top}px`;
    toolbar.style.transform = "none";
  }

  clampToolbarPosition() {
    this.setToolbarPosition(this.toolbarPosition.left, this.toolbarPosition.top);
  }

  onToolbarPointerDown(event) {
    if (event.button !== undefined && event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    this.toolbarDrag = {
      pointerId: event.pointerId,
      offsetX: event.clientX - this.toolbarPosition.left,
      offsetY: event.clientY - this.toolbarPosition.top
    };
    event.currentTarget.setPointerCapture?.(event.pointerId);
    event.currentTarget.classList.add("dragging");
  }

  onToolbarPointerMove(event) {
    if (!this.toolbarDrag || event.pointerId !== this.toolbarDrag.pointerId) return;
    event.preventDefault();
    this.setToolbarPosition(
      event.clientX - this.toolbarDrag.offsetX,
      event.clientY - this.toolbarDrag.offsetY
    );
  }

  onToolbarPointerUp(event) {
    if (!this.toolbarDrag || event.pointerId !== this.toolbarDrag.pointerId) return;
    event.currentTarget.releasePointerCapture?.(event.pointerId);
    this.endToolbarDrag();
  }

  endToolbarDrag() {
    this.toolbarDrag = null;
    this.get("toolbar-drag-handle").classList.remove("dragging");
  }

  onKeyDown(event) {
    if (!this.state.visible || !this.state.active) return;
    const element = event.composedPath?.()[0] ?? event.target;
    if (element?.tagName === "INPUT" || element?.tagName === "TEXTAREA" || element?.isContentEditable) return;

    const modifier = event.ctrlKey || event.metaKey;
    if (event.key === "Escape") {
      if (this.state.clickThrough) this.state.toggleClickThrough(false);
      else if (this.state.mode !== "move") this.state.setMode("move");
      return;
    }
    if (!modifier) return;
    const key = event.key.toLowerCase();
    if (key === "z" && !event.shiftKey) {
      event.preventDefault();
      this.state.undo();
    } else if (key === "y" || (key === "z" && event.shiftKey)) {
      event.preventDefault();
      this.state.redo();
    }
  }

  exportJson() {
    const payload = JSON.stringify(exportLayout(this.state), null, 2);
    const blob = new this.window.Blob([payload], { type: "application/json" });
    const url = this.window.URL.createObjectURL(blob);
    const link = this.root.ownerDocument.createElement("a");
    link.href = url;
    link.download = "research-overlay-layout.json";
    link.click();
    this.window.setTimeout(() => this.window.URL.revokeObjectURL(url), 0);
    this.setStatus("Layout exported. Local media files are referenced by name, not embedded.");
  }

  async importJson(file) {
    if (!file) return;
    try {
      const text = await this.readFile(file);
      const parsed = JSON.parse(text);
      const layout = validateLayout(parsed);
      this.state.transaction((state) => Object.assign(state, layout));
      this.items.keepItemsInBounds();
      this.setStatus(
        `Imported ${layout.items.length} item(s). Local media appears as placeholders until re-added.`
      );
    } catch (error) {
      this.setStatus(`Import failed: ${error instanceof Error ? error.message : "Invalid JSON file."}`, true);
    }
  }

  readFile(file) {
    if (typeof file.text === "function") return file.text();
    return new Promise((resolve, reject) => {
      const reader = new this.window.FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error ?? new Error("Unable to read file."));
      reader.readAsText(file);
    });
  }

  render() {
    this.get("btn-move").classList.toggle("active", this.state.mode === "move");
    this.get("btn-draw").classList.toggle("active", this.state.mode === "draw");
    this.get("btn-erase").classList.toggle("active", this.state.mode === "erase");
    this.get("draw-canvas").classList.toggle(
      "drawing-mode",
      !this.state.clickThrough && ["draw", "erase"].includes(this.state.mode)
    );
    this.get("overlay-layer").style.opacity = String(this.state.globalOpacity);
    this.get("global-opacity").value = String(this.state.globalOpacity);
    this.get("opacity-val").textContent = `${Math.round(this.state.globalOpacity * 100)}%`;
    const clickThrough = this.get("btn-clickthrough");
    clickThrough.classList.toggle("active", this.state.clickThrough);
    clickThrough.setAttribute("aria-pressed", String(this.state.clickThrough));
    clickThrough.textContent = `Click-through: ${this.state.clickThrough ? "on" : "off"}`;
    this.get("btn-undo").disabled = !this.state.canUndo;
    this.get("btn-redo").disabled = !this.state.canRedo;
  }

  destroy() {
    this.abortController.abort();
    this.unsubscribe();
  }
}
