export class CanvasRenderer {
  constructor({ canvas, state, window, colorInput, sizeInput }) {
    this.canvas = canvas;
    this.state = state;
    this.window = window;
    this.colorInput = colorInput;
    this.sizeInput = sizeInput;
    this.context = canvas.getContext("2d");
    this.abortController = new AbortController();
    this.currentStroke = null;

    this.resize = this.resize.bind(this);
    this.render = this.render.bind(this);
    this.canvas.addEventListener("pointerdown", (event) => this.onPointerDown(event), {
      signal: this.abortController.signal
    });
    this.canvas.addEventListener("pointermove", (event) => this.onPointerMove(event), {
      signal: this.abortController.signal
    });
    this.window.addEventListener("pointerup", (event) => this.onPointerUp(event), {
      signal: this.abortController.signal
    });
    this.window.addEventListener("resize", this.resize, {
      signal: this.abortController.signal
    });
    this.unsubscribe = state.subscribe(this.render);
    this.resize();
  }

  resize() {
    const oldWidth = this.canvas.width;
    const oldHeight = this.canvas.height;
    const width = Math.max(1, Math.round(this.window.innerWidth));
    const height = Math.max(1, Math.round(this.window.innerHeight));
    if (!this.context || (oldWidth === width && oldHeight === height)) return;

    const backing = this.window.document.createElement("canvas");
    backing.width = oldWidth;
    backing.height = oldHeight;
    backing.getContext?.("2d")?.drawImage?.(this.canvas, 0, 0);
    this.canvas.width = width;
    this.canvas.height = height;
    this.context = this.canvas.getContext("2d");
    this.context.drawImage?.(backing, 0, 0);
    this.render();
  }

  onPointerDown(event) {
    if (!this.context || this.state.mode === "move" || this.state.clickThrough) return;
    this.currentStroke = {
      mode: this.state.mode,
      color: this.colorInput.value,
      size: Number(this.sizeInput.value) * (this.state.mode === "erase" ? 3 : 1),
      points: [{ x: event.clientX, y: event.clientY }]
    };
    this.canvas.setPointerCapture?.(event.pointerId);
  }

  onPointerMove(event) {
    if (!this.currentStroke) return;
    this.currentStroke.points.push({ x: event.clientX, y: event.clientY });
    this.renderStroke(this.currentStroke);
  }

  onPointerUp(event) {
    if (!this.currentStroke) return;
    const stroke = this.currentStroke;
    this.currentStroke = null;
    this.canvas.releasePointerCapture?.(event.pointerId);
    this.state.transaction((state) => state.strokes.push(stroke));
  }

  renderStroke(stroke) {
    if (!this.context || stroke.points.length === 0) return;
    const { context } = this;
    context.save?.();
    context.globalCompositeOperation = stroke.mode === "erase" ? "destination-out" : "source-over";
    context.strokeStyle = stroke.color;
    context.lineWidth = stroke.size;
    context.lineCap = "round";
    context.lineJoin = "round";
    context.beginPath();
    context.moveTo(stroke.points[0].x, stroke.points[0].y);
    stroke.points.slice(1).forEach((point) => context.lineTo(point.x, point.y));
    context.stroke();
    context.restore?.();
  }

  render() {
    if (!this.context) return;
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.state.strokes.forEach((stroke) => this.renderStroke(stroke));
    if (this.currentStroke) this.renderStroke(this.currentStroke);
  }

  destroy() {
    this.abortController.abort();
    this.unsubscribe();
  }
}
