import { beforeEach, vi } from "vitest";

function createContext() {
  return {
    beginPath: vi.fn(),
    clearRect: vi.fn(),
    drawImage: vi.fn(),
    lineTo: vi.fn(),
    moveTo: vi.fn(),
    restore: vi.fn(),
    save: vi.fn(),
    stroke: vi.fn()
  };
}

HTMLCanvasElement.prototype.getContext = vi.fn(() => createContext());
HTMLElement.prototype.setPointerCapture ??= vi.fn();
HTMLElement.prototype.releasePointerCapture ??= vi.fn();

beforeEach(() => {
  document.body.replaceChildren();
  document.documentElement.removeAttribute("style");
  Object.defineProperty(window, "innerWidth", { configurable: true, value: 1280 });
  Object.defineProperty(window, "innerHeight", { configurable: true, value: 720 });
  window.URL.createObjectURL = vi.fn(() => `blob:test-${Math.random()}`);
  window.URL.revokeObjectURL = vi.fn();
});
