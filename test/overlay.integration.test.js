import { afterEach, describe, expect, it, vi } from "vitest";
import { mountResearchOverlay } from "../src/app.js";
import { SCHEMA_VERSION } from "../src/layout.js";

let app;

function mount() {
  app = mountResearchOverlay();
  return app.root;
}

function button(root, id) {
  return root.querySelector(`#${id}`);
}

function setFiles(input, files) {
  Object.defineProperty(input, "files", {
    configurable: true,
    value: files
  });
  input.dispatchEvent(new Event("change", { bubbles: true }));
}

function pointer(target, type, x = 0, y = 0) {
  const event = new MouseEvent(type, { bubbles: true, composed: true, clientX: x, clientY: y });
  Object.defineProperty(event, "pointerId", { value: 1 });
  target.dispatchEvent(event);
}

afterEach(() => app?.destroy());

describe("toolbar modes and shortcuts", () => {
  it("switches move, draw, and erase modes; Escape returns to move", () => {
    const root = mount();
    expect(app.state.mode).toBe("move");

    button(root, "btn-draw").click();
    expect(app.state.mode).toBe("draw");
    expect(button(root, "draw-canvas").classList.contains("drawing-mode")).toBe(true);

    button(root, "btn-erase").click();
    expect(app.state.mode).toBe("erase");
    expect(button(root, "draw-canvas").classList.contains("drawing-mode")).toBe(true);

    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    expect(app.state.mode).toBe("move");
    expect(button(root, "draw-canvas").classList.contains("drawing-mode")).toBe(false);
  });

  it("does not intercept Escape while typing in an overlay textarea", () => {
    const root = mount();
    button(root, "btn-add-text").click();
    button(root, "btn-draw").click();
    const textarea = root.querySelector("textarea");

    textarea.dispatchEvent(new KeyboardEvent("keydown", {
      key: "Escape",
      bubbles: true,
      composed: true
    }));
    expect(app.state.mode).toBe("draw");
  });
});

describe("overlay items", () => {
  it("adds, edits, moves, changes opacity, and removes text", () => {
    const root = mount();
    button(root, "btn-add-text").click();

    const textarea = root.querySelector("textarea");
    textarea.value = "Interview notes";
    textarea.dispatchEvent(new Event("change", { bubbles: true }));
    expect(app.state.items[0].textContent).toBe("Interview notes");

    const wrapper = root.querySelector(".overlay-item");
    wrapper.getBoundingClientRect = () => ({
      left: 80,
      right: 340,
      top: 90,
      bottom: 220,
      x: 80,
      y: 90,
      width: 260,
      height: 130
    });
    Object.defineProperty(wrapper, "offsetWidth", { configurable: true, value: 260 });
    Object.defineProperty(wrapper, "offsetHeight", { configurable: true, value: 130 });
    pointer(wrapper, "pointerdown", 90, 100);
    pointer(wrapper, "pointermove", 170, 220);
    pointer(wrapper, "pointerup", 170, 220);
    expect(app.state.items[0]).toMatchObject({ x: 160, y: 210 });

    const opacity = root.querySelector(".item-opacity");
    opacity.value = "0.45";
    opacity.dispatchEvent(new Event("input", { bubbles: true }));
    opacity.dispatchEvent(new Event("change", { bubbles: true }));
    expect(app.state.items[0].opacity).toBe(0.45);
    expect(root.querySelector("textarea").style.opacity).toBe("0.45");

    root.querySelector(".del-btn").click();
    expect(app.state.items).toHaveLength(0);
    expect(root.querySelector(".overlay-item")).toBeNull();
  });

  it("creates image and video wrappers and revokes their object URLs on removal and teardown", () => {
    const root = mount();
    const input = root.querySelector("#file-input");
    const image = new File(["image"], "evidence.gif", { type: "image/gif" });
    const video = new File(["video"], "demo.mp4", { type: "video/mp4" });

    setFiles(input, [image, video]);
    expect(root.querySelectorAll(".overlay-item")).toHaveLength(2);
    expect(root.querySelector('[data-type="image"] img')).not.toBeNull();
    expect(root.querySelector('[data-type="video"] video')).not.toBeNull();
    expect(window.URL.createObjectURL).toHaveBeenCalledTimes(2);

    root.querySelector('[data-type="image"] .del-btn').click();
    expect(window.URL.revokeObjectURL).toHaveBeenCalledTimes(1);
    app.destroy();
    expect(window.URL.revokeObjectURL).toHaveBeenCalledTimes(2);
    app = null;
  });
});

describe("click-through behavior", () => {
  it("makes items and canvas non-interactive while preserving toolbar interaction", () => {
    const root = mount();
    button(root, "btn-add-text").click();
    button(root, "btn-draw").click();
    button(root, "btn-clickthrough").click();

    expect(app.state.clickThrough).toBe(true);
    expect(app.state.mode).toBe("move");
    expect(root.querySelector(".overlay-item").classList.contains("click-through")).toBe(true);
    expect(button(root, "draw-canvas").classList.contains("drawing-mode")).toBe(false);
    expect(button(root, "btn-clickthrough").getAttribute("aria-pressed")).toBe("true");
    expect(getComputedStyle(button(root, "toolbar")).pointerEvents).toBe("auto");
  });
});

describe("undo and redo", () => {
  it("restores add, edit, move, opacity, and remove transitions", () => {
    const root = mount();
    const undo = () => button(root, "btn-undo").click();
    const redo = () => button(root, "btn-redo").click();

    button(root, "btn-add-text").click();
    undo();
    expect(app.state.items).toHaveLength(0);
    redo();
    expect(app.state.items).toHaveLength(1);

    let textarea = root.querySelector("textarea");
    textarea.value = "Version 1";
    textarea.dispatchEvent(new Event("change", { bubbles: true }));
    undo();
    expect(app.state.items[0].textContent).toBe("");
    redo();
    expect(app.state.items[0].textContent).toBe("Version 1");

    const wrapper = root.querySelector(".overlay-item");
    wrapper.getBoundingClientRect = () => ({
      left: 80,
      right: 340,
      top: 90,
      bottom: 220,
      width: 260,
      height: 130
    });
    Object.defineProperty(wrapper, "offsetWidth", { configurable: true, value: 260 });
    Object.defineProperty(wrapper, "offsetHeight", { configurable: true, value: 130 });
    pointer(wrapper, "pointerdown", 90, 100);
    pointer(wrapper, "pointermove", 340, 250);
    pointer(wrapper, "pointerup", 340, 250);
    expect(app.state.items[0]).toMatchObject({ x: 330, y: 240 });
    undo();
    expect(app.state.items[0]).toMatchObject({ x: 80, y: 90 });
    redo();
    expect(app.state.items[0]).toMatchObject({ x: 330, y: 240 });

    root.querySelector(".del-btn").click();
    undo();
    expect(app.state.items).toHaveLength(1);
    redo();
    expect(app.state.items).toHaveLength(0);
  });

  it("bounds history to 50 snapshots", () => {
    const root = mount();
    for (let index = 0; index < 60; index += 1) {
      app.state.transaction((state) => {
        state.strokes.push({
          mode: "draw",
          color: "#000000",
          size: 2,
          points: [{ x: index, y: index }, { x: index + 1, y: index + 1 }]
        });
      });
    }
    expect(app.state.undoStack).toHaveLength(50);
    let undoCount = 0;
    while (button(root, "btn-undo").disabled === false) {
      button(root, "btn-undo").click();
      undoCount += 1;
    }
    expect(undoCount).toBe(50);
    expect(app.state.strokes).toHaveLength(10);
  });
});

describe("layout export and import", () => {
  it("exports a versioned downloadable JSON layout", async () => {
    const root = mount();
    button(root, "btn-add-text").click();
    let blob;
    window.URL.createObjectURL.mockImplementation((value) => {
      blob = value;
      return "blob:export";
    });
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    button(root, "btn-export").click();
    expect(blob).toBeInstanceOf(Blob);
    expect(window.URL.createObjectURL).toHaveBeenCalledWith(blob);

    const text = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsText(blob);
    });
    const layout = JSON.parse(text);
    expect(layout.schemaVersion).toBe(SCHEMA_VERSION);
    expect(layout.items[0]).toMatchObject({
      type: "text",
      x: 80,
      y: 90
    });
  });

  it("imports valid layouts and safely rejects malformed JSON", async () => {
    const root = mount();
    const input = button(root, "layout-input");
    const valid = {
      schemaVersion: SCHEMA_VERSION,
      globalOpacity: 0.7,
      items: [{
        id: "imported-1",
        type: "image",
        x: 12,
        y: 24,
        width: 300,
        height: 200,
        opacity: 0.8,
        zIndex: 4,
        textContent: "",
        media: { fileName: "proof.png", mimeType: "image/png" }
      }],
      canvas: { strokes: [] }
    };
    const validFile = new File(["unused"], "layout.json", { type: "application/json" });
    validFile.text = async () => JSON.stringify(valid);
    setFiles(input, [validFile]);
    await vi.waitFor(() => expect(app.state.items[0]?.id).toBe("imported-1"));
    expect(root.querySelector(".media-placeholder")).not.toBeNull();
    expect(button(root, "status").textContent).toMatch(/Local media/);

    const invalidFile = new File(["unused"], "broken.json", { type: "application/json" });
    invalidFile.text = async () => '{"schemaVersion":';
    setFiles(input, [invalidFile]);
    await vi.waitFor(() => expect(button(root, "status").textContent).toMatch(/^Import failed:/));
    expect(app.state.items[0].id).toBe("imported-1");
  });

  it("rejects untrusted geometry without replacing the current layout", async () => {
    const root = mount();
    button(root, "btn-add-text").click();
    const file = new File(["unused"], "unsafe.json", { type: "application/json" });
    file.text = async () => JSON.stringify({
      schemaVersion: SCHEMA_VERSION,
      items: [{
        id: "unsafe",
        type: "text",
        x: 1e9,
        y: 0,
        width: 100,
        height: 100,
        opacity: 1,
        zIndex: 1,
        textContent: ""
      }],
      canvas: { strokes: [] }
    });

    setFiles(button(root, "layout-input"), [file]);
    await vi.waitFor(() => expect(button(root, "status").textContent).toMatch(/safe import bounds/));
    expect(app.state.items[0].id).not.toBe("unsafe");
  });
});
