// blur-matte.ts — Blur Matte: blur con edge preservation sobre canal alpha
// ARC Engine

import type { NodeRenderContext } from '../recipe';
import { evalPropA } from '../sources/shared/prop-utils';
import { acquireImageData, releaseImageData } from '../image-data-pool';

export function renderBlurMatte(ctx: NodeRenderContext): void {
  const { ctx: c, props, W, H, inputs, channels, modifiers, t, nodeId } = ctx;
  const source = inputs[0];
  if (!source) return;

  const radius = evalPropA(nodeId, 'radius', (props.radius as number) ?? 5, channels, modifiers, t);
  const iterations = Math.max(1, Math.min(3, Math.round(evalPropA(nodeId, 'iterations', (props.iterations as number) ?? 3, channels, modifiers, t))));
  const edgePreserve = (props.edgePreserve as boolean) ?? true;
  const threshold = evalPropA(nodeId, 'threshold', (props.threshold as number) ?? 0.5, channels, modifiers, t);

  c.drawImage(source, 0, 0);
  const imgData = c.getImageData(0, 0, W, H);
  const d = imgData.data;

  // Extract alpha channel to separate buffer
  const alphaId = acquireImageData(W, H);
  const alpha = alphaId.data;
  for (let i = 0; i < d.length; i += 4) {
    const a = d[i + 3];
    alpha[i] = a;
    alpha[i + 1] = a;
    alpha[i + 2] = a;
    alpha[i + 3] = 255;
  }

  // Box blur on alpha
  const rad = Math.max(1, Math.round(radius));
  for (let iter = 0; iter < iterations; iter++) {
    // Horizontal pass
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        let sum = 0, count = 0;
        const startX = Math.max(0, x - rad);
        const endX = Math.min(W - 1, x + rad);
        const centerAlpha = d[(y * W + x) * 4 + 3];
        for (let sx = startX; sx <= endX; sx++) {
          const si = (y * W + sx) * 4;
          // Edge preserve: skip pixels whose alpha differs too much from center
          if (edgePreserve) {
            const diff = Math.abs(d[si + 3] - centerAlpha);
            if (diff > threshold * 255) continue;
          }
          sum += alpha[si];
          count++;
        }
        const di = (y * W + x) * 4;
        alpha[di] = count > 0 ? sum / count : alpha[di];
        alpha[di + 1] = alpha[di];
        alpha[di + 2] = alpha[di];
      }
    }
    // Vertical pass
    for (let x = 0; x < W; x++) {
      for (let y = 0; y < H; y++) {
        let sum = 0, count = 0;
        const startY = Math.max(0, y - rad);
        const endY = Math.min(H - 1, y + rad);
        const centerAlpha = d[(y * W + x) * 4 + 3];
        for (let sy = startY; sy <= endY; sy++) {
          const si = (sy * W + x) * 4;
          if (edgePreserve) {
            const diff = Math.abs(d[si + 3] - centerAlpha);
            if (diff > threshold * 255) continue;
          }
          sum += alpha[si];
          count++;
        }
        const di = (y * W + x) * 4;
        alpha[di] = count > 0 ? sum / count : alpha[di];
        alpha[di + 1] = alpha[di];
        alpha[di + 2] = alpha[di];
      }
    }
  }

  // Copy blurred alpha back to original
  for (let i = 0; i < d.length; i += 4) {
    d[i + 3] = Math.round(alpha[i]);
  }

  c.putImageData(imgData, 0, 0);
  releaseImageData(alphaId);
}
