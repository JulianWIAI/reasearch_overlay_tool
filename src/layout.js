export const SCHEMA_VERSION = 1;

const ITEM_TYPES = new Set(["text", "image", "video"]);

function isFiniteNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

export function exportLayout(state, now = new Date()) {
  return {
    schemaVersion: SCHEMA_VERSION,
    app: "ResearchOverlayTool",
    exportedAt: now.toISOString(),
    globalOpacity: state.globalOpacity,
    items: state.items.map((item) => ({
      id: item.id,
      type: item.type,
      x: item.x,
      y: item.y,
      width: item.width,
      height: item.height,
      opacity: item.opacity,
      zIndex: item.zIndex,
      textContent: item.type === "text" ? item.textContent : "",
      media: item.type === "text"
        ? null
        : {
            fileName: item.fileName || null,
            mimeType: item.mimeType || null,
            portable: false,
            note: "Local media is intentionally not embedded. Re-add the file after import."
          }
    })),
    canvas: {
      strokes: state.strokes
    }
  };
}

export function validateLayout(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("The layout must be a JSON object.");
  }
  if (value.schemaVersion !== SCHEMA_VERSION) {
    throw new Error(`Unsupported schemaVersion. Expected ${SCHEMA_VERSION}.`);
  }
  if (!Array.isArray(value.items)) throw new Error("The layout items field must be an array.");
  if (value.items.length > 500) throw new Error("The layout contains too many items (maximum 500).");

  const ids = new Set();
  const items = value.items.map((item, index) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      throw new Error(`Item ${index + 1} must be an object.`);
    }
    if (typeof item.id !== "string" || !item.id || ids.has(item.id)) {
      throw new Error(`Item ${index + 1} has an invalid or duplicate id.`);
    }
    ids.add(item.id);
    if (!ITEM_TYPES.has(item.type)) throw new Error(`Item ${item.id} has an invalid type.`);
    for (const field of ["x", "y", "width", "height", "opacity", "zIndex"]) {
      if (!isFiniteNumber(item[field])) {
        throw new Error(`Item ${item.id} has an invalid ${field}.`);
      }
    }
    if (item.width < 1 || item.height < 1 || item.opacity < 0.1 || item.opacity > 1) {
      throw new Error(`Item ${item.id} has dimensions or opacity outside the allowed range.`);
    }
    if (
      item.x < -10000 || item.x > 10000 ||
      item.y < -10000 || item.y > 10000 ||
      item.width > 10000 || item.height > 10000
    ) {
      throw new Error(`Item ${item.id} has geometry outside the safe import bounds.`);
    }
    if (item.type === "text" && typeof item.textContent !== "string") {
      throw new Error(`Text item ${item.id} is missing textContent.`);
    }
    return {
      id: item.id,
      type: item.type,
      x: item.x,
      y: item.y,
      width: item.width,
      height: item.height,
      opacity: item.opacity,
      zIndex: Math.round(item.zIndex),
      textContent: item.type === "text" ? item.textContent.slice(0, 100000) : "",
      fileName: typeof item.media?.fileName === "string" ? item.media.fileName : "",
      mimeType: typeof item.media?.mimeType === "string" ? item.media.mimeType : "",
      file: null,
      source: null
    };
  });

  const strokes = Array.isArray(value.canvas?.strokes) ? value.canvas.strokes : [];
  if (strokes.length > 1000) throw new Error("The layout contains too many canvas strokes.");
  const safeStrokes = strokes.map((stroke, index) => {
    if (!stroke || !["draw", "erase"].includes(stroke.mode) || !Array.isArray(stroke.points)) {
      throw new Error(`Canvas stroke ${index + 1} is invalid.`);
    }
    if (!/^#[0-9a-f]{6}$/i.test(stroke.color || "") || !isFiniteNumber(stroke.size)) {
      throw new Error(`Canvas stroke ${index + 1} has invalid style data.`);
    }
    if (stroke.points.length > 10000) throw new Error(`Canvas stroke ${index + 1} has too many points.`);
    return {
      mode: stroke.mode,
      color: stroke.color,
      size: Math.min(100, Math.max(1, stroke.size)),
      points: stroke.points.map((point) => {
        if (!isFiniteNumber(point?.x) || !isFiniteNumber(point?.y)) {
          throw new Error(`Canvas stroke ${index + 1} has invalid points.`);
        }
        return { x: point.x, y: point.y };
      })
    };
  });

  const globalOpacity = isFiniteNumber(value.globalOpacity) ? value.globalOpacity : 1;
  return {
    globalOpacity: Math.min(1, Math.max(0.1, globalOpacity)),
    items,
    strokes: safeStrokes,
    zOrder: items.reduce((maximum, item) => Math.max(maximum, item.zIndex), 0)
  };
}
