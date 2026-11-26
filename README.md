# ResearchOverlayTool

A Manifest V3 research and visual-annotation overlay for Chrome and Microsoft Edge. Draw on a page, add text, images, GIFs, and videos, and export a portable layout without modifying the host website.

## Why I Built It

I wanted a lightweight way to capture research observations directly over web applications while preserving the original page. The overlay is useful for UX reviews, competitive analysis, bug reproduction, and design feedback: annotations remain temporary, tab-local, and non-destructive.

## Architecture & Shadow DOM Isolation

The extension is organized around focused modules:

- `src/state.js` owns tab-local UI state and bounded 50-step undo/redo snapshots.
- `src/canvas-renderer.js` records vector stroke commands and redraws through an offscreen-aware resize path.
- `src/item-manager.js` owns item geometry, editing, dragging, object URLs, and cleanup.
- `src/toolbar.js` binds the toolbar, JSON workflows, status feedback, and keyboard shortcuts.
- `src/layout.js` defines and validates the versioned layout schema.
- `src/app.js` assembles the overlay, coordinates teardown, and tracks explicit active/visible state.
- `src/background.js` is not source-side—the generated MV3 service worker is the root `background.js`.

The UI and canvas live inside an open Shadow DOM. Scoped styles cannot leak into the host page, and the page's styles cannot accidentally restyle the toolbar or overlays. Host-level listeners are limited and use `AbortController` for deterministic teardown. `esbuild` bundles `src/content-entry.js` into the root `content.js`, so Chrome and Edge inject one self-contained file with no extension runtime dependencies.

## Key Engineering Trade-offs & Known Limitations

- **Local media is intentionally not embedded in JSON.** Export stores item metadata and file names, but browser object URLs cannot be reopened by another session. Imported media is rendered as a clearly labeled placeholder and can be restored by re-adding the local file.
- **Canvas data is command-based.** Redrawable stroke commands preserve geometry during viewport resize, but very large drawings consume more memory and redraw work than a flattened bitmap.
- **Browser-restricted pages cannot be injected.** Pages such as `chrome://`, `edge://`, `about:`, and extension pages block content scripts. The service worker handles these URLs without attempting injection and displays a badge warning.
- **State is per tab and session.** Layouts survive until the tab navigates/reloads or the overlay is torn down; use JSON export for persistence.
- **Click-through is an overlay state, not page access.** It disables interaction on overlay items and the canvas while leaving the host page usable.

## What I Would Improve Next

1. Persist opt-in layouts through `chrome.storage.local`.
2. Add item layering controls and keyboard-accessible drag/resize handles.
3. Support portable remote-media URLs with explicit security and privacy checks.
4. Add Playwright smoke tests in real Chrome and Edge builds.
5. Add localization, configurable keyboard shortcuts, and annotation themes.

## Setup

Requirements: Node.js 20+ and npm.

```powershell
npm install
npm run build
npm test
```

### Load the extension in Chrome or Edge

1. Run `npm run build`.
2. Open `chrome://extensions` or `edge://extensions`.
3. Enable **Developer mode**.
4. Choose **Load unpacked** and select this repository folder.
5. Click the extension action on a normal web page to show or hide the overlay.

### Development

- `npm test` runs Vitest integration tests in jsdom.
- `npm run test:watch` starts the test watcher.
- `npm run build` regenerates the self-contained MV3 `content.js`.

The checked-in manifest and `background.js` can be loaded directly after running the build. Runtime code does not use React, a framework, or any package loaded from the page.
