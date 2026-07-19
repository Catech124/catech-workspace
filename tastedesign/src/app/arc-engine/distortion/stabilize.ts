// stabilize.ts — Motion stabilization + edge fill
// ARC Engine
// Parses tracker data, computes inverse offset with smoothness, applies zoom + translate.
// Edge fill: nearest-neighbor search for transparent borders.

import type { NodeRenderContext } from '../recipe';
import { evalPropA } from '../sources/shared/prop-utils';

interface TrackerFrame { frame: number; x: number; y: number; }

let _cacheKey = '';
let _cachedTracker: TrackerFrame[] = [];

function parseTracker(data: string): TrackerFrame[] {
  if (data === _cacheKey) return _cachedTracker;
  const frames: TrackerFrame[] = [];
  const parts = data.split(';');
  for (const part of parts) {
    const [f, x, y] = part.split(',').map(Number);
    if (!isNaN(f) && !isNaN(x) && !isNaN(y)) {
      frames.push({ frame: f, x, y });
    }
  }
  _cachedTracker = frames;
  _cacheKey = data;
  return frames;
}

export function renderStabilize(ctx: NodeRenderContext): void {
  const { ctx: c, props, W, H, inputs, t, nodeId, channels, modifiers } = ctx;
  const source = inputs[0];
  if (!source) return;

  const smoothness = evalPropA(nodeId, 'smoothness', (props.smoothness as number) ?? 0.5, channels, modifiers, t);
  const zoom = evalPropA(nodeId, 'zoom', (props.zoom as number) ?? 1.05, channels, modifiers, t);
  const useTracker = !!(props.useTracker as boolean);
  const trackerData = (props.trackerData as string) || '';

  c.drawImage(source, 0, 0);

  if (useTracker && trackerData) {
    const frames = parseTracker(trackerData);
    if (frames.length === 0) return;

    // Find nearest frame to current time
    const frameIndex = Math.floor(t * 30); // Assume 30fps
    let nearest = frames[0];
    let minDist = Infinity;
    for (const f of frames) {
      const dist = Math.abs(f.frame - frameIndex);
      if (dist < minDist) { minDist = dist; nearest = f; }
    }

    // Compute offset relative to reference (first frame)
    const ref = frames[0];
    const offsetX = (nearest.x - ref.x) * (1 - smoothness);
    const offsetY = (nearest.y - ref.y) * (1 - smoothness);

    // Apply inverse offset with zoom
    c.save();
    c.resetTransform();
    c.clearRect(0, 0, W, H);

    const scale = zoom;
    const tx = W / 2 - (W / 2 - offsetX) * scale;
    const ty = H / 2 - (H / 2 - offsetY) * scale;

    c.drawImage(source, tx, ty, W * scale, H * scale);

    // Edge fill: detect transparent pixels and fill with nearest neighbor
    const imgData = c.getImageData(0, 0, W, H);
    const d = imgData.data;
    const fillSize = Math.min(10, Math.round(W * 0.01));

    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const idx = (y * W + x) * 4;
        if (d[idx + 3] > 0) continue; // Skip opaque pixels

        // Search 5x5 neighborhood for nearest opaque pixel
        let foundR = 0, foundG = 0, foundB = 0, foundCount = 0;
        for (let dy = -fillSize; dy <= fillSize && foundCount === 0; dy++) {
          for (let dx = -fillSize; dx <= fillSize && foundCount === 0; dx++) {
            const px = x + dx, py = y + dy;
            if (px < 0 || px >= W || py < 0 || py >= H) continue;
            const ni = (py * W + px) * 4;
            if (d[ni + 3] > 0) {
              foundR = d[ni]; foundG = d[ni + 1]; foundB = d[ni + 2];
              foundCount++;
            }
          }
        }
        if (foundCount > 0) {
          d[idx] = foundR; d[idx + 1] = foundG;
          d[idx + 2] = foundB; d[idx + 3] = 255;
        }
      }
    }
    c.putImageData(imgData, 0, 0);
    c.restore();
  } else {
    // No tracker data: just zoom passthrough
    c.drawImage(source, 0, 0);
  }
}
