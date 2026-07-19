// matte-control.ts — Matte Control: levels + gamma + contrast over alpha channel
// ARC Engine

import type { NodeRenderContext } from '../recipe';
import { evalPropA } from '../sources/shared/prop-utils';

export function renderMatteControl(ctx: NodeRenderContext): void {
  const { ctx: c, props, W, H, inputs, channels, modifiers, t, nodeId } = ctx;
  const source = inputs[0];
  if (!source) return;

  const low = evalPropA(nodeId, 'low', (props.low as number) ?? 0, channels, modifiers, t);
  const high = evalPropA(nodeId, 'high', (props.high as number) ?? 1, channels, modifiers, t);
  const gamma = evalPropA(nodeId, 'gamma', (props.gamma as number) ?? 1, channels, modifiers, t);
  const contrast = evalPropA(nodeId, 'contrast', (props.contrast as number) ?? 1, channels, modifiers, t);
  const brightness = evalPropA(nodeId, 'brightness', (props.brightness as number) ?? 0, channels, modifiers, t);
  const invert = !!(props.invert as boolean);
  const premultiply = !!(props.premultiply as boolean);

  c.drawImage(source, 0, 0);
  const imgData = c.getImageData(0, 0, W, H);
  const d = imgData.data;

  for (let i = 0; i < d.length; i += 4) {
    let a = d[i + 3] / 255;

    // Apply levels
    a = (a - low) / (high - low || 1);
    a = Math.max(0, Math.min(1, a));

    // Gamma
    if (gamma !== 1 && a > 0) a = Math.pow(a, 1 / gamma);

    // Contrast
    a = (a - 0.5) * contrast + 0.5;

    // Brightness
    a = a + brightness;

    a = Math.max(0, Math.min(1, a));

    if (invert) a = 1 - a;

    const newAlpha = Math.round(a * 255);
    if (premultiply) {
      d[i] = Math.round(d[i] * a);
      d[i + 1] = Math.round(d[i + 1] * a);
      d[i + 2] = Math.round(d[i + 2] * a);
    }
    d[i + 3] = newAlpha;
  }

  c.putImageData(imgData, 0, 0);
}
