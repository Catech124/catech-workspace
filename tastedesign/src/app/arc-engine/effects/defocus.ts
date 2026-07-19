// defocus.ts — Defocus effect (lens blur with iris)
// ARC Video Editor — Toolcraft Integration
// Fusion analog: Defocus
// Inputs: 1 (Background) | Outputs: 1 (Salida)
//
// Props: radius, shape (circle|hexagon), quality, curvature
// Usa defocusSamples() de shared/blur.ts con cache

import type { NodeRenderContext } from '../recipe';
import { defocusSamples } from './shared/blur';

const _samplesCache = new Map<string, { dx: number; dy: number; alpha: number }[]>();

function getCachedSamples(radius: number, shape: string, quality: number, curvature: number) {
  const key = `${radius},${shape},${quality},${curvature.toFixed(2)}`;
  let samples = _samplesCache.get(key);
  if (!samples) {
    samples = defocusSamples(radius, shape, quality, curvature);
    _samplesCache.set(key, samples);
  }
  return samples;
}

export function renderDefocus(ctx: NodeRenderContext): void {
  const { ctx: c, inputs, props } = ctx;
  const bg = inputs[0];
  if (!bg) return;

  const radius = (props.radius as number) || 5;
  const shape = (props.shape as string) || 'circle';
  const quality = (props.quality as number) || 5;
  const curvature = (props.curvature as number) || 1;

  const samples = getCachedSamples(radius, shape, quality, curvature);

  c.drawImage(bg, 0, 0);

  for (const s of samples) {
    c.globalAlpha = s.alpha;
    c.drawImage(bg, s.dx, s.dy);
  }

  c.globalAlpha = 1;
}
