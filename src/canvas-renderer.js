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
    this.backingCanvas = this.window.document.createElement("canvas");
    this.backingContext = this.backingCanvas.getContext("2d");
    this.logicalWidth = 0;
    this.logicalHeight = 0;

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
    const width = Math.max(1, Math.round(this.window.innerWidth));
    const height = Math.max(1, Math.round(this.window.innerHeight));
    if (!this.context || !this.backingContext) return;

    this.canvas.width = width;
    this.canvas.height = height;
    this.context = this.canvas.getContext("2d");
    this.logicalWidth = Math.max(this.logicalWidth, width);
    this.logicalHeight = Math.max(this.logicalHeight, height);
    this.backingCanvas.width = this.logicalWidth;
    this.backingCanvas.height = this.logicalHeight;
    this.backingContext = this.backingCanvas.getContext("2d");
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

  drawStrokeTo(context, stroke) {
    const previous = this.context;
    this.context = context;
    this.renderStroke(stroke);
    this.context = previous;
  }

  render() {
    if (!this.context || !this.backingContext) return;
    this.backingContext.clearRect(0, 0, this.logicalWidth, this.logicalHeight);
    this.state.strokes.forEach((stroke) => this.drawStrokeTo(this.backingContext, stroke));
    if (this.currentStroke) this.drawStrokeTo(this.backingContext, this.currentStroke);

    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.context.drawImage?.(
      this.backingCanvas,
      0,
      0,
      this.canvas.width,
      this.canvas.height,
      0,
      0,
      this.canvas.width,
      this.canvas.height
    );
  }

  destroy() {
    this.abortController.abort();
    this.unsubscribe();
    this.backingCanvas.width = 1;
    this.backingCanvas.height = 1;
  }
}
