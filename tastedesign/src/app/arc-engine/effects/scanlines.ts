// scanlines.ts — Scanlines CRT effect
// ARC Engine

import type { NodeRenderContext } from '../recipe';
import { evalPropA } from '../sources/shared/prop-utils';

export function renderScanlines(ctx: NodeRenderContext): void {
  const { ctx: c, props, W, H, inputs, channels, modifiers, t, nodeId } = ctx;
  const source = inputs[0];
  if (!source) return;

  const opacity = Math.max(0, Math.min(1, evalPropA(nodeId, 'opacity', (props.opacity as number) ?? 0.3, channels, modifiers, t)));
  const size = Math.max(1, Math.round(evalPropA(nodeId, 'size', (props.size as number) ?? 2, channels, modifiers, t)));
  const curvature = Math.max(0, Math.min(1, evalPropA(nodeId, 'curvature', (props.curvature as number) ?? 0, channels, modifiers, t)));
  const flicker = Math.max(0, Math.min(1, evalPropA(nodeId, 'flicker', (props.flicker as number) ?? 0, channels, modifiers, t)));

  c.drawImage(source, 0, 0);
  const imgData = c.getImageData(0, 0, W, H);
  const d = imgData.data;

  const flickerAmount = flicker > 0 ? Math.sin(t * 60) * flicker * 40 : 0;

  // Scanlines
  for (let y = 0; y < H; y += size) {
    for (let dy = 0; dy < size && y + dy < H; dy++) {
      const row = (y + dy) * W * 4;
      const darken = 1 - (opacity * (1 - dy / size));
      // Apply flicker directly to scanline darkening
      const flickerDarken = flickerAmount > 0 ? Math.max(0, darken + flickerAmount / 255) : darken;
      for (let x = 0; x < W; x++) {
        const idx = row + x * 4;
        d[idx] = Math.round(d[idx] * flickerDarken);
        d[idx + 1] = Math.round(d[idx + 1] * flickerDarken);
        d[idx + 2] = Math.round(d[idx + 2] * flickerDarken);
      }
    }
  }

  // Screen curvature (independent of flicker)
  if (curvature > 0.01) {
    const cx = W / 2, cy = H / 2;
    const strength = curvature * 0.03;
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const dx = (x - cx) / cx, dy = (y - cy) / cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const v = Math.max(0, 1 - strength * dist * dist);
        const idx = (y * W + x) * 4;
        d[idx] = Math.round(d[idx] * v);
        d[idx + 1] = Math.round(d[idx + 1] * v);
        d[idx + 2] = Math.round(d[idx + 2] * v);
      }
    }
  }

  c.putImageData(imgData, 0, 0);
}
