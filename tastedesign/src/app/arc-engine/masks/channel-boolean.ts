// channel-boolean.ts — Channel Boolean: extract channel to RGB/A
// ARC Engine

import type { NodeRenderContext } from '../recipe';
import { getChannelValue } from './shared/channel-utils';
import type { ChannelSource } from './shared/channel-utils';

export function renderChannelBoolean(ctx: NodeRenderContext): void {
  const { ctx: c, props, W, H, inputs } = ctx;
  const source = inputs[0];
  if (!source) return;

  const toRGB = (props.toRGB as string) || 'red';
  const toAlpha = (props.toAlpha as string) || 'luminance';
  const invertRGB = !!(props.invertRGB as boolean);
  const invertAlpha = !!(props.invertAlpha as boolean);

  c.drawImage(source, 0, 0);
  const imgData = c.getImageData(0, 0, W, H);
  const d = imgData.data;

  for (let i = 0; i < d.length; i += 4) {
    const rgbVal = getChannelValue(d, i, toRGB as ChannelSource);
    const alphaVal = getChannelValue(d, i, toAlpha as ChannelSource);

    const r = invertRGB ? 255 - rgbVal : rgbVal;
    const g = invertRGB ? 255 - rgbVal : rgbVal;
    const b = invertRGB ? 255 - rgbVal : rgbVal;
    const a = invertAlpha ? 255 - alphaVal : alphaVal;

    d[i] = Math.max(0, Math.min(255, r));
    d[i + 1] = Math.max(0, Math.min(255, g));
    d[i + 2] = Math.max(0, Math.min(255, b));
    d[i + 3] = Math.max(0, Math.min(255, a));
  }

  c.putImageData(imgData, 0, 0);
}
