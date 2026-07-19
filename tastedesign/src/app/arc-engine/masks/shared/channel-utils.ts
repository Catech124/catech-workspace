// channel-utils.ts — Shared channel utilities for Channel nodes
// ARC Engine

export type ChannelSource = 'red' | 'green' | 'blue' | 'alpha' | 'luminance' | 'zero' | 'one';

/**
 * Obtiene el valor de un canal específico desde ImageData.
 * Compartido entre channel-boolean y channel-shuffle.
 */
export function getChannelValue(
  data: Uint8ClampedArray | null,
  i: number,
  channel: ChannelSource,
): number {
  if (!data) return 0;
  switch (channel) {
    case 'red':       return data[i];
    case 'green':     return data[i + 1];
    case 'blue':      return data[i + 2];
    case 'alpha':     return data[i + 3];
    case 'luminance': return Math.round(data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
    case 'zero':      return 0;
    case 'one':       return 255;
  }
}

export interface ChannelMapping {
  r: { source: 'first' | 'second'; channel: ChannelSource };
  g: { source: 'first' | 'second'; channel: ChannelSource };
  b: { source: 'first' | 'second'; channel: ChannelSource };
  a: { source: 'first' | 'second'; channel: ChannelSource };
  invert?: boolean;
}

/**
 * Reordena canales RGBA según un mapeo.
 * firstData = foreground, secondData = background (opcional).
 */
export function remapChannels(
  firstData: Uint8ClampedArray,
  secondData: Uint8ClampedArray | null,
  mapping: ChannelMapping,
): Uint8ClampedArray {
  const result = new Uint8ClampedArray(firstData.length);
  const invert = mapping.invert || false;

  for (let i = 0; i < firstData.length; i += 4) {
    const srcR = mapping.r.source === 'second' ? secondData : firstData;
    const srcG = mapping.g.source === 'second' ? secondData : firstData;
    const srcB = mapping.b.source === 'second' ? secondData : firstData;
    const srcA = mapping.a.source === 'second' ? secondData : firstData;

    let r = getChannelValue(srcR, i, mapping.r.channel);
    let g = getChannelValue(srcG, i, mapping.g.channel);
    let b = getChannelValue(srcB, i, mapping.b.channel);
    let a = getChannelValue(srcA, i, mapping.a.channel);

    if (invert) { r = 255 - r; g = 255 - g; b = 255 - b; a = 255 - a; }

    result[i] = Math.max(0, Math.min(255, r));
    result[i + 1] = Math.max(0, Math.min(255, g));
    result[i + 2] = Math.max(0, Math.min(255, b));
    result[i + 3] = Math.max(0, Math.min(255, a));
  }
  return result;
}
