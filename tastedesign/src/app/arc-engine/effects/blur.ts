// blur.ts — Blur effect (gaussiano)
// ARC Video Editor — Toolcraft Integration
// Fusion analog: Blur
// Inputs: 1 (Background) | Outputs: 1 (Salida)
//
// Props: radiusX, radiusY, lockXY, iterations
// Usa ctx.filter para blur simétrico, boxBlur para asimétrico.

import type { NodeRenderContext } from '../recipe';
import { boxBlur } from './shared/blur';
import { acquireImageData } from '../image-data-pool';

export function renderBlur(ctx: NodeRenderContext): void {
  const { ctx: c, inputs, props, W, H } = ctx;
  const bg = inputs[0];
  if (!bg) return;

  const radiusX = (props.radiusX as number) || 5;
  const radiusY = (props.radiusY as number) || 5;
  const lockXY = props.lockXY as boolean;
  const iterations = (props.iterations as number) || 1;

  c.drawImage(bg, 0, 0);

  // Symmetric blur: use CSS filter (fast)
  if (lockXY && radiusX === radiusY) {
    c.filter = `blur(${radiusX}px)`;
    c.drawImage(bg, 0, 0);
    c.filter = 'none';
    return;
  }

  // Asymmetric blur: use boxBlur
  // Capture canvas pixels into a pooled ImageData
  const srcId = c.getImageData(0, 0, W, H);
  const srcData = srcId.data;
  const result = boxBlur(srcData, W, H, radiusX, radiusY, iterations);

  // Write result into a pooled ImageData for the output
  const id = acquireImageData(W, H);

  for (let i = 0; i < result.length; i++) {
    id.data[i] = result[i];
  }
  c.putImageData(id, 0, 0);
}
