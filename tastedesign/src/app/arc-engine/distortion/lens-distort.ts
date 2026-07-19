// lens-distort.ts — Lens Distortion: barrel, pincushion, fisheye + chromatic aberration
// ARC Engine

import type { NodeRenderContext } from '../recipe';
import { evalPropA } from '../sources/shared/prop-utils';
import { renderWarp } from './shared/warp-core';
import { acquireImageData, releaseImageData } from '../image-data-pool';

export function renderLensDistort(ctx: NodeRenderContext): void {
  const { ctx: c, props, W, H, inputs, channels, modifiers, t, nodeId } = ctx;
  const source = inputs[0];
  if (!source) return;

  const type = (props.type as string) || 'barrel';
  const strength = evalPropA(nodeId, 'strength', (props.strength as number) ?? 50, channels, modifiers, t);
  const centerX = (props.centerX as number) ?? W / 2;
  const centerY = (props.centerY as number) ?? H / 2;
  const chromatic = !!(props.chromatic as boolean);
  const chromStrength = evalPropA(nodeId, 'chromStrength', (props.chromStrength as number) ?? 10, channels, modifiers, t);

  const k = (strength / 10000) * (type === 'pincushion' ? -1 : 1);
  const cx = centerX, cy = centerY;
  const maxR = Math.sqrt(
    Math.max(cx * cx + cy * cy, (W - cx) * (W - cx) + cy * cy,
      cx * cx + (H - cy) * (H - cy), (W - cx) * (W - cx) + (H - cy) * (H - cy))
  );

  if (type === 'fisheye') {
    renderWarp(c, source, (x, y) => {
      const dx = x - cx, dy = y - cy;
      const r = Math.sqrt(dx * dx + dy * dy) / maxR;
      const scale = k > 0 ? 1 / (Math.abs(k) * r + 1) : 1 + k * r;
      return { sx: cx + dx * scale, sy: cy + dy * scale };
    }, t, W, H);
  } else if (chromatic) {
    // Chromatic aberration: sample R, G, B at different positions
    // Must bypass renderWarp since it only supports one sample per pixel
    c.drawImage(source, 0, 0);
    const srcId = c.getImageData(0, 0, W, H);
    const src = srcId.data;
    const resultId = acquireImageData(W, H);
    const result = resultId.data;
    const chOff = chromStrength / maxR;

    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const i = (y * W + x) * 4;
        const dx = x - cx, dy = y - cy;
        const r = Math.sqrt(dx * dx + dy * dy) / maxR;
        const r2 = r * r;

        // Sample each channel at its own position
        const scaleR = 1 + (k + chOff) * r2;
        const scaleG = 1 + k * r2;
        const scaleB = 1 + (k - chOff) * r2;

        const sxR = cx + dx * scaleR, syR = cy + dy * scaleR;
        const sxG = cx + dx * scaleG, syG = cy + dy * scaleG;
        const sxB = cx + dx * scaleB, syB = cy + dy * scaleB;

        const sr = sampleChannel(src, W, H, sxR, syR, 0);
        const sg = sampleChannel(src, W, H, sxG, syG, 1);
        const sb = sampleChannel(src, W, H, sxB, syB, 2);

        result[i] = sr;
        result[i + 1] = sg;
        result[i + 2] = sb;
        result[i + 3] = src[i + 3];
      }
    }
    c.putImageData(resultId, 0, 0);
    releaseImageData(resultId);
  } else {
    renderWarp(c, source, (x, y) => {
      const dx = x - cx, dy = y - cy;
      const r = Math.sqrt(dx * dx + dy * dy) / maxR;
      const scale = 1 + k * r * r;
      return { sx: cx + dx * scale, sy: cy + dy * scale };
    }, t, W, H);
  }
}

/** Sample a single channel (0=R, 1=G, 2=B) at position (sx, sy) using bilinear interpolation */
function sampleChannel(
  data: Uint8ClampedArray, W: number, H: number,
  sx: number, sy: number, ch: number,
): number {
  if (sx < 0 || sx >= W || sy < 0 || sy >= H) return 0;
  const ix = Math.floor(sx), iy = Math.floor(sy);
  const fx = sx - ix, fy = sy - iy;
  const x0 = Math.max(0, Math.min(W - 2, ix));
  const y0 = Math.max(0, Math.min(H - 2, iy));
  const x1 = x0 + 1, y1 = y0 + 1;
  const v00 = data[(y0 * W + x0) * 4 + ch];
  const v10 = data[(y0 * W + x1) * 4 + ch];
  const v01 = data[(y1 * W + x0) * 4 + ch];
  const v11 = data[(y1 * W + x1) * 4 + ch];
  return Math.round(v00 * (1 - fx) * (1 - fy) + v10 * fx * (1 - fy) + v01 * (1 - fx) * fy + v11 * fx * fy);
}
