// glitch.ts — Glitch / Datamosh effect
// ARC Engine

import type { NodeRenderContext } from '../recipe';
import { evalPropA } from '../sources/shared/prop-utils';

export function renderGlitch(ctx: NodeRenderContext): void {
  const { ctx: c, props, W, H, inputs, channels, modifiers, t, nodeId } = ctx;
  const source = inputs[0];
  if (!source) return;

  const intensity = evalPropA(nodeId, 'intensity', (props.intensity as number) ?? 0.3, channels, modifiers, t);
  const speed = evalPropA(nodeId, 'speed', (props.speed as number) ?? 1, channels, modifiers, t);
  const blocks = Math.max(1, Math.round(evalPropA(nodeId, 'blocks', (props.blocks as number) ?? 5, channels, modifiers, t)));
  const seed = evalPropA(nodeId, 'seed', (props.seed as number) ?? 0, channels, modifiers, t);

  if (intensity < 0.01) { c.drawImage(source, 0, 0); return; }

  // Draw source to canvas
  c.drawImage(source, 0, 0);
  const imgData = c.getImageData(0, 0, W, H);
  const d = imgData.data;

  const gt = t * speed + seed * 100;
  const maxShift = Math.round(W * intensity * 0.05);

  // Block displacement
  for (let b = 0; b < blocks; b++) {
    const hash = Math.sin(b * 12.9898 + gt) * 43758.5453;
    const by = Math.abs(Math.floor(hash * 100)) % H;
    const bh = Math.max(2, Math.abs(Math.floor(hash * 50)) % (H - by));
    const shift = Math.abs(Math.floor(Math.sin(hash + gt * 2) * maxShift));
    if (shift === 0) continue;

    for (let y = by; y < Math.min(by + bh, H); y++) {
      const row = y * W * 4;
      const shifted = new Uint8ClampedArray(W * 4);
      shifted.fill(0);
      for (let x = 0; x < W - shift; x++) {
        const si = x * 4;
        const di = (x + shift) * 4;
        shifted[di] = d[row + si];
        shifted[di + 1] = d[row + si + 1];
        shifted[di + 2] = d[row + si + 2];
        shifted[di + 3] = d[row + si + 3];
      }
      d.set(shifted, row);
    }
  }

  // RGB split
  if (intensity > 0.15) {
    const split = Math.round(maxShift * (0.3 + intensity * 0.7));
    for (let y = 0; y < H; y++) {
      const row = y * W * 4;
      const temp = new Uint8ClampedArray(d.buffer, row, W * 4);
      for (let x = 0; x < W; x++) {
        if (x + split < W) d[row + (x + split) * 4] = temp[x * 4];           // R
        if (x - split >= 0) d[row + (x - split) * 4 + 1] = temp[x * 4 + 1]; // G
        d[row + x * 4 + 2] = temp[x * 4 + 2];                                // B
      }
    }
  }

  c.putImageData(imgData, 0, 0);
}
