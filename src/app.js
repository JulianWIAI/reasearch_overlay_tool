import { CanvasRenderer } from "./canvas-renderer.js";
import { OverlayItemManager } from "./item-manager.js";
import { OverlayState } from "./state.js";
import { styles } from "./styles.js";
import { Toolbar } from "./toolbar.js";

export const HOST_ID = "research-overlay-host";

const HOST_STYLES = {
  position: "fixed",
  inset: "0",
  width: "100vw",
  height: "100vh",
  margin: "0",
  padding: "0",
  border: "0",
  zIndex: "2147483647",
  pointerEvents: "none",
  isolation: "isolate",
  contain: "layout style paint",
  transform: "none",
  filter: "none",
  perspective: "none",
  background: "transparent"
};

export class ResearchOverlayApp {
  constructor({ document = globalThis.document, window = globalThis.window } = {}) {
    this.document = document;
    this.window = window;
    this.destroyed = false;
    this.host = document.createElement("div");
    this.host.id = HOST_ID;
    this.host.setAttribute("popover", "manual");
    this.host.setAttribute("aria-label", "Research overlay");
    this.host.setAttribute("role", "presentation");
    this.applyHostStyles();
    const shadow = this.host.attachShadow({ mode: "open" });
    const style = document.createElement("style");
    style.textContent = styles;
    shadow.appendChild(style);
    this.root = document.createElement("div");
    shadow.appendChild(this.root);
    document.documentElement.appendChild(this.host);
    this.useTopLayer();

    this.state = new OverlayState();
    this.toolbar = new Toolbar({
      root: this.root,
      state: this.state,
      items: null,
      renderer: null,
      window,
      onDestroy: () => this.hide()
    });
    this.items = new OverlayItemManager({
      layer: this.root.querySelector("#overlay-layer"),
      state: this.state,
      window,
      onStatus: (message) => this.toolbar.setStatus(message)
    });
    this.toolbar.items = this.items;
    this.renderer = new CanvasRenderer({
      canvas: this.root.querySelector("#draw-canvas"),
      state: this.state,
      window,
      colorInput: this.root.querySelector("#draw-color"),
      sizeInput: this.root.querySelector("#brush-size")
    });
    this.toolbar.renderer = this.renderer;

    this.unsubscribe = this.state.subscribe(() => this.syncHost());
    this.pageHide = () => this.destroy();
    window.addEventListener("pagehide", this.pageHide);
    this.host.__researchOverlayController = this;
  }

  syncHost() {
    this.host.style.setProperty("display", this.state.visible ? "block" : "none", "important");
    this.host.dataset.active = String(this.state.active);
    this.host.dataset.visible = String(this.state.visible);
  }

  applyHostStyles() {
    for (const [property, value] of Object.entries(HOST_STYLES)) {
      this.host.style.setProperty(property.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`), value, "important");
    }
  }

  useTopLayer() {
    try {
      this.host.showPopover?.();
      this.host.dataset.topLayer = typeof this.host.showPopover === "function" ? "true" : "fallback";
    } catch {
      this.host.dataset.topLayer = "fallback";
    }
  }

  toggle() {
    this.state.setVisibility(!this.state.visible);
    return this.state.active;
  }

  show() {
    this.state.setVisibility(true);
    return true;
  }

  hide() {
    this.state.setVisibility(false);
    return false;
  }

  destroy() {
    if (this.destroyed) return;
    this.destroyed = true;
    this.state.active = false;
    this.window.removeEventListener("pagehide", this.pageHide);
    this.unsubscribe();
    this.renderer.destroy();
    this.items.destroy();
    this.toolbar.destroy();
    try {
      this.host.hidePopover?.();
    } catch {
      // The host may already have been removed by page navigation.
    }
    delete this.host.__researchOverlayController;
    this.host.remove();
  }
}

export function mountResearchOverlay(options) {
  return new ResearchOverlayApp(options);
}
