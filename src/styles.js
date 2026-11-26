export const styles = `
  :host {
    all: initial;
    display: block;
    color-scheme: dark;
    position: fixed;
    inset: 0;
    margin: 0 !important;
    padding: 0 !important;
    border: 0 !important;
    background: transparent !important;
    font-family: system-ui, -apple-system, sans-serif;
  }
  :host([popover]) { overflow: visible; }
  * { box-sizing: border-box; font-family: system-ui, -apple-system, sans-serif; }
  button, input, textarea { font: inherit; }
  #toolbar {
    position: fixed; top: 12px; left: 50%; transform: translateX(-50%);
    width: max-content; max-width: calc(100vw - 24px); background: #1e1e24;
    color: #f4f4f6; padding: 8px 10px; border: 1px solid #383842;
    border-radius: 10px; box-shadow: 0 8px 24px rgba(0,0,0,.35);
    display: flex; align-items: center; gap: 7px; pointer-events: auto;
    z-index: 2147483647; user-select: none; flex-wrap: wrap;
  }
  button, label.btn {
    background: #2b2b36; color: #fff; border: 1px solid #454554;
    padding: 5px 8px; border-radius: 6px; cursor: pointer; font-size: 12px;
  }
  button:hover, label.btn:hover { background: #3c3c4a; }
  button.active { background: #2563eb; border-color: #3b82f6; }
  button:disabled { opacity: .45; cursor: not-allowed; }
  button.danger:hover { background: #dc2626; border-color: #ef4444; }
  .divider { width: 1px; height: 20px; background: #454554; }
  .control-group { display: flex; align-items: center; gap: 5px; font-size: 12px; }
  input[type="range"] { width: 68px; cursor: pointer; }
  input[type="color"] { width: 27px; height: 27px; border: 0; background: none; cursor: pointer; }
  #opacity-val { min-width: 34px; }
  #status {
    position: fixed; top: 58px; left: 50%; transform: translateX(-50%);
    z-index: 2147483647; max-width: min(520px, 90vw); padding: 7px 10px;
    color: #fff; background: #111827; border-radius: 6px; font-size: 12px;
    pointer-events: none;
  }
  #status:empty { display: none; }
  #overlay-layer { position: fixed; inset: 0; width: 100%; height: 100%; }
  #draw-canvas { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }
  #draw-canvas.drawing-mode { pointer-events: auto; cursor: crosshair; touch-action: none; }
  .overlay-item {
    position: absolute; pointer-events: auto; border: 1px dashed rgba(59,130,246,.8);
    cursor: move; min-width: 60px; min-height: 40px; resize: both; overflow: hidden;
    display: flex; flex-direction: column; background: transparent;
  }
  .overlay-item.click-through {
    pointer-events: none !important; border-color: transparent !important; resize: none !important;
  }
  .overlay-item:hover .item-hud, .overlay-item:focus-within .item-hud { opacity: 1; }
  .item-hud {
    position: absolute; top: 0; left: 0; right: 0; min-height: 22px;
    background: rgba(17,24,39,.9); color: #fff; font-size: 10px; padding: 2px 5px;
    display: flex; justify-content: space-between; align-items: center; gap: 6px;
    opacity: 0; transition: opacity .15s; z-index: 2;
  }
  .item-hud .item-opacity { width: 50px; }
  .item-hud button { background: #ef4444; padding: 1px 5px; }
  .overlay-media, .overlay-text, .media-placeholder { width: 100%; height: 100%; }
  .overlay-media { object-fit: contain; pointer-events: none; display: block; }
  .overlay-text {
    background: rgba(255,255,255,.9); color: #111; border: 0;
    padding: 25px 8px 8px; font-size: 15px; resize: none; outline: none;
  }
  .media-placeholder {
    display: grid; place-items: center; padding: 28px 12px 12px; white-space: pre-line;
    text-align: center; color: #f8fafc; background: rgba(30,41,59,.88);
    font-size: 12px; pointer-events: none;
  }
`;
