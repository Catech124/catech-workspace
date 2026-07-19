// noise.ts — Film Grain / Noise effect
// ARC Engine

import type { NodeRenderContext } from '../recipe';
import { evalPropA } from '../sources/shared/prop-utils';

// Module-level fast PRNG (avoids creating function each frame)
function fastRand(state: number): number {
  state = (state * 1664525 + 1013904223) & 0x7fffffff;
  return state / 0x7fffffff;
}

export function renderNoise(ctx: NodeRenderContext): void {
  const { ctx: c, props, W, H, inputs, channels, modifiers, t, nodeId } = ctx;
  const source = inputs[0];
  if (!source) return;

  const amount = Math.max(0, Math.min(1, evalPropA(nodeId, 'amount', (props.amount as number) ?? 0.1, channels, modifiers, t)));
  const size = Math.max(1, Math.round(evalPropA(nodeId, 'size', (props.size as number) ?? 1, channels, modifiers, t)));
  const mono = !!(props.monochrome as boolean);
  const speed = evalPropA(nodeId, 'speed', (props.speed as number) ?? 1, channels, modifiers, t);

  if (amount < 0.001) { c.drawImage(source, 0, 0); return; }

  c.drawImage(source, 0, 0);
  const imgData = c.getImageData(0, 0, W, H);
  const d = imgData.data;

  const seed = Math.floor(t * 100 * speed);
  let rng = seed;

  if (size <= 1) {
    // Per-pixel noise
    if (mono) {
      for (let i = 0; i < d.length; i += 4) {
        const n = (fastRand(rng++) - 0.5) * 2 * amount * 255;
        d[i] = Math.max(0, Math.min(255, d[i] + n));
        d[i + 1] = Math.max(0, Math.min(255, d[i + 1] + n));
        d[i + 2] = Math.max(0, Math.min(255, d[i + 2] + n));
      }
    } else {
      for (let i = 0; i < d.length; i += 4) {
        d[i] = Math.max(0, Math.min(255, d[i] + (fastRand(rng++) - 0.5) * 2 * amount * 255));
        d[i + 1] = Math.max(0, Math.min(255, d[i + 1] + (fastRand(rng++) - 0.5) * 2 * amount * 255));
        d[i + 2] = Math.max(0, Math.min(255, d[i + 2] + (fastRand(rng++) - 0.5) * 2 * amount * 255));
      }
    }
  } else {
    // Block noise
    for (let y = 0; y < H; y += size) {
      for (let x = 0; x < W; x += size) {
        if (mono) {
          const n = (fastRand(rng++) - 0.5) * 2 * amount * 255;
          for (let dy = 0; dy < size && y + dy < H; dy++) {
            for (let dx = 0; dx < size && x + dx < W; dx++) {
              const idx = ((y + dy) * W + (x + dx)) * 4;
              d[idx] = Math.max(0, Math.min(255, d[idx] + n));
              d[idx + 1] = Math.max(0, Math.min(255, d[idx + 1] + n));
              d[idx + 2] = Math.max(0, Math.min(255, d[idx + 2] + n));
            }
          }
        } else {
          const nr = (fastRand(rng++) - 0.5) * 2 * amount * 255;
          const ng = (fastRand(rng++) - 0.5) * 2 * amount * 255;
          const nb = (fastRand(rng++) - 0.5) * 2 * amount * 255;
          for (let dy = 0; dy < size && y + dy < H; dy++) {
            for (let dx = 0; dx < size && x + dx < W; dx++) {
              const idx = ((y + dy) * W + (x + dx)) * 4;
              d[idx] = Math.max(0, Math.min(255, d[idx] + nr));
              d[idx + 1] = Math.max(0, Math.min(255, d[idx + 1] + ng));
              d[idx + 2] = Math.max(0, Math.min(255, d[idx + 2] + nb));
            }
          }
        }
      }
    }
  }

  c.putImageData(imgData, 0, 0);
}
