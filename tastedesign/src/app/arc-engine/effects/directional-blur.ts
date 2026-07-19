// directional-blur.ts — Directional Blur effect
// ARC Video Editor — Toolcraft Integration
// Fusion analog: Directional Blur
// Inputs: 1 (Background) | Outputs: 1 (Salida)
//
// Props: angle, length, quality
// Usa directionalBlurSamples() de shared/blur.ts

import type { NodeRenderContext } from '../recipe';
import { directionalBlurSamples } from './shared/blur';

// Cache simple: samples por (angle, length, quality)
const _samplesCache = new Map<string, { dx: number; dy: number; alpha: number }[]>();

function getCachedSamples(angle: number, length: number, quality: number) {
  const key = `${angle.toFixed(1)},${length},${quality}`;
  let samples = _samplesCache.get(key);
  if (!samples) {
    samples = directionalBlurSamples(angle, length, quality);
    _samplesCache.set(key, samples);
  }
  return samples;
}

export function renderDirectionalBlur(ctx: NodeRenderContext): void {
  const { ctx: c, inputs, props } = ctx;
  const bg = inputs[0];
  if (!bg) return;

  const angle = (props.angle as number) || 0;
  const length = (props.length as number) || 15;
  const quality = (props.quality as number) || 8;

  const samples = getCachedSamples(angle, length, quality);

  c.drawImage(bg, 0, 0);

  for (const s of samples) {
    c.globalAlpha = s.alpha;
    c.drawImage(bg, s.dx, s.dy);
  }

  c.globalAlpha = 1;
}
