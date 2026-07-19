// sharpen.ts — Sharpen / Unsharp Mask effect
// ARC Engine

import type { NodeRenderContext } from '../recipe';
import { evalPropA } from '../sources/shared/prop-utils';
import { gaussianBlurSepia } from './shared/blur';

export function renderSharpen(ctx: NodeRenderContext): void {
  const { ctx: c, props, W, H, inputs, channels, modifiers, t, nodeId } = ctx;
  const source = inputs[0];
  if (!source) return;

  const amount = Math.max(0, Math.min(5, evalPropA(nodeId, 'amount', (props.amount as number) ?? 0.5, channels, modifiers, t)));
  const radius = Math.max(0.5, Math.min(5, evalPropA(nodeId, 'radius', (props.radius as number) ?? 1, channels, modifiers, t)));
  const threshold = Math.max(0, Math.min(1, evalPropA(nodeId, 'threshold', (props.threshold as number) ?? 0, channels, modifiers, t)));

  if (amount < 0.001) { c.drawImage(source, 0, 0); return; }

  c.drawImage(source, 0, 0);
  const srcData = c.getImageData(0, 0, W, H);
  const src = srcData.data;

  // Create blurred version
  const blurRadius = Math.max(1, Math.round(radius));
  const blurred = gaussianBlurSepia(srcData, W, H, blurRadius);
  const blr = blurred.data;

  // Unsharp mask
  const outData = c.createImageData(W, H);
  const out = outData.data;
  const thresholdVal = Math.round(threshold * 255);

  for (let i = 0; i < src.length; i += 4) {
    const dr = src[i] - blr[i];
    const dg = src[i + 1] - blr[i + 1];
    const db = src[i + 2] - blr[i + 2];
    const mag = Math.sqrt(dr * dr + dg * dg + db * db);

    if (mag < thresholdVal) {
      out[i] = src[i]; out[i + 1] = src[i + 1]; out[i + 2] = src[i + 2];
    } else {
      out[i] = Math.max(0, Math.min(255, Math.round(src[i] + dr * amount)));
      out[i + 1] = Math.max(0, Math.min(255, Math.round(src[i + 1] + dg * amount)));
      out[i + 2] = Math.max(0, Math.min(255, Math.round(src[i + 2] + db * amount)));
    }
    out[i + 3] = src[i + 3];
  }

  c.putImageData(outData, 0, 0);
}
