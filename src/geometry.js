export const MIN_ITEM_WIDTH = 60;
export const MIN_ITEM_HEIGHT = 40;

function finiteOr(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

export function clamp(value, minimum, maximum) {
  return Math.min(Math.max(value, minimum), Math.max(minimum, maximum));
}

export function viewportBounds(window) {
  return {
    width: Math.max(1, finiteOr(window.innerWidth, 1)),
    height: Math.max(1, finiteOr(window.innerHeight, 1))
  };
}

export function normalizeItemGeometry(item, viewportWidth, viewportHeight) {
  const boundsWidth = Math.max(1, finiteOr(viewportWidth, 1));
  const boundsHeight = Math.max(1, finiteOr(viewportHeight, 1));
  const width = clamp(
    finiteOr(item.width, MIN_ITEM_WIDTH),
    Math.min(MIN_ITEM_WIDTH, boundsWidth),
    boundsWidth
  );
  const height = clamp(
    finiteOr(item.height, MIN_ITEM_HEIGHT),
    Math.min(MIN_ITEM_HEIGHT, boundsHeight),
    boundsHeight
  );

  return {
    x: Math.round(clamp(finiteOr(item.x, 0), 0, boundsWidth - width)),
    y: Math.round(clamp(finiteOr(item.y, 0), 0, boundsHeight - height)),
    width: Math.round(width),
    height: Math.round(height)
  };
}
