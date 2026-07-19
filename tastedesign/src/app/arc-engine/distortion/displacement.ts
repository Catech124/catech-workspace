// displacement.ts — Displacement map distortion
// ARC Engine
// 2 inputs: Background + Ref (displacement map)
// Each pixel: sx = x + (ref.r - center) * strength, sy = y + (ref.g - center) * strength

import type { NodeRenderContext } from '../recipe';
import { renderWarp } from './shared/warp-core';

export function renderDisplacement(ctx: NodeRenderContext): void {
  const { ctx: c, props, W, H, inputs, t } = ctx;
  const source = inputs[0];
  const refCanvas = inputs[1];
  if (!source) return;

  const channelMode = (props.channelMode as string) || 'rgba';
  const strength = (props.strength as number) ?? 50;
  const center = (props.center as number) ?? 0.5;

  // If no ref input, passthrough
  if (!refCanvas) {
    c.drawImage(source, 0, 0);
    return;
  }

  // Read ref data once
  const refCtx = refCanvas.getContext('2d');
  if (!refCtx) { c.drawImage(source, 0, 0); return; }
  const refData = refCtx.getImageData(0, 0, W, H).data;
  const centerVal = Math.round(center * 255);

  renderWarp(c, source, (x, y, _i) => {
    const ri = (y * W + x) * 4;
    let dr: number, dg: number;

    if (channelMode === 'rgba') {
      dr = refData[ri] - centerVal;
      dg = refData[ri + 1] - centerVal;
    } else {
      const lum = (refData[ri] * 0.299 + refData[ri + 1] * 0.587 + refData[ri + 2] * 0.114);
      dr = lum - centerVal;
      dg = lum - centerVal;
    }

    const sx = x + (dr / 255) * strength;
    const sy = y + (dg / 255) * strength;
    return { sx, sy };
  }, t, W, H);
}
