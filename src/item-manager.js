import { normalizeItemGeometry, viewportBounds } from "./geometry.js";

let fallbackId = 0;
export const MIN_FONT_SIZE = 10;
export const MAX_FONT_SIZE = 64;

function normalizeFontSize(value) {
  const parsed = Number(value);
  return Math.min(MAX_FONT_SIZE, Math.max(MIN_FONT_SIZE, Number.isFinite(parsed) ? parsed : 15));
}

function makeId() {
  fallbackId += 1;
  return globalThis.crypto?.randomUUID?.() ?? `overlay-${Date.now()}-${fallbackId}`;
}

export class OverlayItemManager {
  constructor({ layer, state, window, onStatus }) {
    this.layer = layer;
    this.state = state;
    this.window = window;
    this.onStatus = onStatus ?? (() => {});
    this.objectUrls = new Map();
    this.urlFiles = new Map();
    this.abortController = new AbortController();
    this.unsubscribe = state.subscribe(() => this.render());
    this.layer.ownerDocument.defaultView?.addEventListener("resize", () => this.keepItemsInBounds(), {
      signal: this.abortController.signal
    });
  }

  addText() {
    this.addItem({
      type: "text",
      width: 260,
      height: 130,
      textContent: "",
      fontSize: 15,
      isBold: false
    });
  }

  addFiles(files) {
    [...files].forEach((file) => {
      const type = file.type.startsWith("video/")
        ? "video"
        : file.type.startsWith("image/")
          ? "image"
          : null;
      if (!type) {
        this.onStatus(`Skipped unsupported file: ${file.name}`);
        return;
      }
      this.addItem({
        type,
        width: type === "video" ? 360 : 300,
        height: type === "video" ? 220 : 240,
        file,
        fileName: file.name,
        mimeType: file.type
      });
    });
  }

  addItem(values) {
    this.state.transaction((state) => {
      state.mode = "move";
      const offset = (state.items.length * 28) % 280;
      state.zOrder += 1;
      const geometry = normalizeItemGeometry({
        x: 80 + offset,
        y: 90 + offset,
        width: values.width,
        height: values.height
      }, this.window.innerWidth, this.window.innerHeight);
      state.items.push({
        id: makeId(),
        opacity: 1,
        zIndex: state.zOrder,
        ...values,
        ...geometry
      });
    });
  }

  render() {
    const currentIds = new Set(this.state.items.map((item) => item.id));
    for (const [id, url] of this.objectUrls) {
      const item = this.state.items.find((candidate) => candidate.id === id);
      if (!currentIds.has(id) || !item?.file || this.urlFiles.get(id) !== item.file) {
        this.window.URL.revokeObjectURL(url);
        this.objectUrls.delete(id);
        this.urlFiles.delete(id);
      }
    }

    this.layer.querySelectorAll(".overlay-item").forEach((element) => element.remove());
    this.state.items.forEach((item) => this.layer.appendChild(this.createElement(item)));
  }

  createElement(item) {
    const wrapper = this.layer.ownerDocument.createElement("div");
    wrapper.className = "overlay-item";
    wrapper.dataset.itemId = item.id;
    wrapper.dataset.type = item.type;
    wrapper.classList.toggle("click-through", this.state.clickThrough);
    wrapper.style.left = `${item.x}px`;
    wrapper.style.top = `${item.y}px`;
    wrapper.style.width = `${item.width}px`;
    wrapper.style.height = `${item.height}px`;
    wrapper.style.zIndex = String(item.zIndex);
    wrapper.tabIndex = -1;

    const hud = this.layer.ownerDocument.createElement("div");
    hud.className = "item-hud";
    hud.innerHTML = `
      <span class="item-drag-handle" aria-label="Drag overlay item" title="Drag overlay item">
        <span aria-hidden="true">⠿</span>
        <span class="coords">X:${Math.round(item.x)}, Y:${Math.round(item.y)}</span>
      </span>
      ${item.type === "text" ? `
        <label class="text-font-control" title="Font size">
          <span class="visually-hidden">Font size</span>
          <input class="item-font-size" type="number" min="${MIN_FONT_SIZE}" max="${MAX_FONT_SIZE}"
            step="1" value="${normalizeFontSize(item.fontSize)}" aria-label="Font size in pixels">
          <span aria-hidden="true">px</span>
        </label>
        <button class="bold-toggle${item.isBold ? " active" : ""}" type="button"
          aria-label="Toggle bold" aria-pressed="${Boolean(item.isBold)}" title="Toggle bold">B</button>
      ` : ""}
      <input class="item-opacity" type="range" min="0.1" max="1" step="0.05"
        value="${item.opacity}" aria-label="Item opacity" title="Item opacity">
      <button class="del-btn" type="button" aria-label="Remove item" title="Remove item">×</button>
    `;
    wrapper.appendChild(hud);

    const content = this.createContent(item);
    wrapper.appendChild(content);

    this.bindOpacity(wrapper, content, item);
    this.bindTextStyling(wrapper, content, item);
    this.bindRemoval(wrapper, item);
    this.bindGeometry(wrapper, item, content, hud.querySelector(".coords"));
    this.bindText(content, item);
    return wrapper;
  }

  createContent(item) {
    const document = this.layer.ownerDocument;
    if (item.type === "text") {
      const textarea = document.createElement("textarea");
      textarea.className = "overlay-text";
      textarea.placeholder = "Type an annotation…";
      textarea.value = item.textContent;
      textarea.style.opacity = String(item.opacity);
      textarea.style.fontSize = `${normalizeFontSize(item.fontSize)}px`;
      textarea.style.fontWeight = item.isBold ? "700" : "400";
      textarea.setAttribute("aria-label", "Annotation text");
      return textarea;
    }

    let source = null;
    if (item.file) {
      source = this.objectUrls.get(item.id);
      if (!source) {
        source = this.window.URL.createObjectURL(item.file);
        this.objectUrls.set(item.id, source);
        this.urlFiles.set(item.id, item.file);
      }
    }

    if (source && item.type === "video") {
      const video = document.createElement("video");
      video.className = "overlay-media";
      video.src = source;
      video.autoplay = true;
      video.loop = true;
      video.muted = true;
      video.playsInline = true;
      video.style.opacity = String(item.opacity);
      return video;
    }
    if (source) {
      const image = document.createElement("img");
      image.className = "overlay-media";
      image.src = source;
      image.alt = item.fileName || "Overlay media";
      image.style.opacity = String(item.opacity);
      return image;
    }

    const placeholder = document.createElement("div");
    placeholder.className = "media-placeholder";
    placeholder.textContent = item.fileName
      ? `${item.fileName}\nRe-add this local file to restore the media.`
      : "Local media is not embedded in JSON. Re-add the file to restore it.";
    placeholder.style.opacity = String(item.opacity);
    return placeholder;
  }

  bindOpacity(wrapper, content, item) {
    const slider = wrapper.querySelector(".item-opacity");
    slider.addEventListener("pointerdown", (event) => event.stopPropagation());
    slider.addEventListener("input", () => {
      content.style.opacity = slider.value;
    });
    slider.addEventListener("change", () => {
      const opacity = Number(slider.value);
      this.state.transaction(() => {
        const current = this.state.items.find((candidate) => candidate.id === item.id);
        if (current) current.opacity = opacity;
      });
    });
  }

  bindRemoval(wrapper, item) {
    const button = wrapper.querySelector(".del-btn");
    button.addEventListener("pointerdown", (event) => event.stopPropagation());
    button.addEventListener("click", () => {
      this.state.transaction((state) => {
        state.items = state.items.filter((candidate) => candidate.id !== item.id);
      });
    });
  }

  bindTextStyling(wrapper, content, item) {
    if (item.type !== "text") return;
    const fontSize = wrapper.querySelector(".item-font-size");
    const boldToggle = wrapper.querySelector(".bold-toggle");
    fontSize.addEventListener("pointerdown", (event) => event.stopPropagation());
    boldToggle.addEventListener("pointerdown", (event) => event.stopPropagation());

    fontSize.addEventListener("change", () => {
      const value = normalizeFontSize(fontSize.value);
      this.state.transaction((state) => {
        const current = state.items.find((candidate) => candidate.id === item.id);
        if (current) current.fontSize = value;
      });
    });
    boldToggle.addEventListener("click", () => {
      this.state.transaction((state) => {
        const current = state.items.find((candidate) => candidate.id === item.id);
        if (current) current.isBold = !current.isBold;
      });
    });
  }

  bindText(content, item) {
    if (item.type !== "text") return;
    content.addEventListener("change", () => {
      this.state.transaction((state) => {
        const current = state.items.find((candidate) => candidate.id === item.id);
        if (current) current.textContent = content.value;
      });
    });
  }

  bindGeometry(wrapper, item, content, coordinates) {
    let gesture = null;

    wrapper.addEventListener("pointerdown", (event) => {
      if (this.state.clickThrough || this.state.mode !== "move") return;
      const dragHandle = event.target.closest(".item-drag-handle");
      if (event.target.closest(".item-hud") && !dragHandle) return;
      if (event.target === content && content.tagName === "TEXTAREA") return;
      if (dragHandle) {
        event.preventDefault();
        event.stopPropagation();
      }
      wrapper.classList.add("is-dragging");
      const rect = wrapper.getBoundingClientRect();
      gesture = {
        pointerId: event.pointerId,
        resize: event.clientX > rect.right - 18 && event.clientY > rect.bottom - 18,
        offsetX: event.clientX - rect.left,
        offsetY: event.clientY - rect.top
      };
      wrapper.setPointerCapture?.(event.pointerId);
    });

    wrapper.addEventListener("pointermove", (event) => {
      if (!gesture || gesture.resize || event.pointerId !== gesture.pointerId) return;
      const geometry = normalizeItemGeometry({
        x: event.clientX - gesture.offsetX,
        y: event.clientY - gesture.offsetY,
        width: item.width,
        height: item.height
      }, this.window.innerWidth, this.window.innerHeight);
      wrapper.style.left = `${geometry.x}px`;
      wrapper.style.top = `${geometry.y}px`;
      coordinates.textContent = `X:${geometry.x}, Y:${geometry.y}`;
    });

    wrapper.addEventListener("pointerup", (event) => {
      if (!gesture) return;
      const geometry = this.readGeometry(wrapper);
      gesture = null;
      wrapper.classList.remove("is-dragging");
      wrapper.releasePointerCapture?.(event.pointerId);
      this.state.transaction((state) => {
        const current = state.items.find((candidate) => candidate.id === item.id);
        if (current) Object.assign(current, geometry);
      });
    });

    wrapper.addEventListener("pointercancel", () => {
      gesture = null;
      wrapper.classList.remove("is-dragging");
      this.render();
    });
  }

  readGeometry(wrapper) {
    return normalizeItemGeometry({
      x: Number.parseFloat(wrapper.style.left) || 0,
      y: Number.parseFloat(wrapper.style.top) || 0,
      width: Math.max(60, Number.parseFloat(wrapper.style.width) || wrapper.offsetWidth),
      height: Math.max(40, Number.parseFloat(wrapper.style.height) || wrapper.offsetHeight)
    }, this.window.innerWidth, this.window.innerHeight);
  }

  keepItemsInBounds() {
    if (!this.state.items.length) return;
    const bounds = viewportBounds(this.window);
    let changed = false;
    for (const item of this.state.items) {
      const geometry = normalizeItemGeometry(item, bounds.width, bounds.height);
      if (Object.keys(geometry).some((key) => geometry[key] !== item[key])) {
        Object.assign(item, geometry);
        changed = true;
      }
    }
    if (changed) this.state.notify();
  }

  destroy() {
    this.abortController.abort();
    this.unsubscribe();
    for (const url of this.objectUrls.values()) this.window.URL.revokeObjectURL(url);
    this.objectUrls.clear();
    this.urlFiles.clear();
    this.layer.replaceChildren();
  }
}
