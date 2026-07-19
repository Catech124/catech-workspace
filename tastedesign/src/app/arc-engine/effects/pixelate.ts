// pixelate.ts — Pixelate / Mosaic effect
// ARC Engine

import type { NodeRenderContext } from '../recipe';
import { evalPropA } from '../sources/shared/prop-utils';

export function renderPixelate(ctx: NodeRenderContext): void {
  const { ctx: c, props, W, H, inputs, channels, modifiers, t, nodeId } = ctx;
  const source = inputs[0];
  if (!source) return;

  const size = Math.max(2, Math.round(evalPropA(nodeId, 'size', (props.size as number) ?? 10, channels, modifiers, t)));
  const shape = (props.shape as string) ?? 'square';
  const ratio = Math.max(0.1, evalPropA(nodeId, 'ratio', (props.ratio as number) ?? 1, channels, modifiers, t));

  c.drawImage(source, 0, 0);
  const imgData = c.getImageData(0, 0, W, H);
  const d = imgData.data;

  const blockW = Math.round(size * ratio);
  const blockH = size;

  if (shape === 'square') {
    for (let y = 0; y < H; y += blockH) {
      for (let x = 0; x < W; x += blockW) {
        const sx = Math.min(x + Math.floor(blockW / 2), W - 1);
        const sy = Math.min(y + Math.floor(blockH / 2), H - 1);
        const si = (sy * W + sx) * 4;
        const r = d[si], g = d[si + 1], b = d[si + 2], a = d[si + 3];
        for (let dy = 0; dy < blockH && y + dy < H; dy++) {
          for (let dx = 0; dx < blockW && x + dx < W; dx++) {
            const idx = ((y + dy) * W + (x + dx)) * 4;
            d[idx] = r; d[idx + 1] = g; d[idx + 2] = b; d[idx + 3] = a;
          }
        }
      }
    }
  } else {
    // Circle pixelation
    const radius = blockW / 2;
    for (let y = 0; y < H; y += blockH) {
      for (let x = 0; x < W; x += blockW) {
        const cpx = Math.min(x + blockW / 2, W - 1);
        const cpy = Math.min(y + blockH / 2, H - 1);
        const si = (Math.round(cpy) * W + Math.round(cpx)) * 4;
        const r = d[si], g = d[si + 1], b = d[si + 2], a = d[si + 3];
        for (let dy = -Math.floor(blockH / 2); dy < Math.ceil(blockH / 2); dy++) {
          for (let dx = -Math.floor(blockW / 2); dx < Math.ceil(blockW / 2); dx++) {
            if (dx * dx + dy * dy > radius * radius) continue;
            const px = x + Math.floor(blockW / 2) + dx;
            const py = y + Math.floor(blockH / 2) + dy;
            if (px < 0 || px >= W || py < 0 || py >= H) continue;
            const idx = (py * W + px) * 4;
            d[idx] = r; d[idx + 1] = g; d[idx + 2] = b; d[idx + 3] = a;
          }
        }
      }
    }
  }

  c.putImageData(imgData, 0, 0);
}
