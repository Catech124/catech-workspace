// channel-shuffle.ts — Channel Shuffle: full channel remapping
// ARC Engine

import type { NodeRenderContext } from '../recipe';
import { remapChannels } from './shared/channel-utils';
import type { ChannelSource } from './shared/channel-utils';

export function renderChannelShuffle(ctx: NodeRenderContext): void {
  const { ctx: c, props, W, H, inputs } = ctx;
  const fg = inputs[0];
  const bg = inputs[1];
  if (!fg) return;

  const rSource = (props.rSource as string) || 'first';
  const gSource = (props.gSource as string) || 'first';
  const bSource = (props.bSource as string) || 'first';
  const aSource = (props.aSource as string) || 'first';
  const rChannel = (props.rChannel as string) || 'red';
  const gChannel = (props.gChannel as string) || 'green';
  const bChannel = (props.bChannel as string) || 'blue';
  const aChannel = (props.aChannel as string) || 'alpha';
  const invert = !!(props.invert as boolean);

  // Read both inputs
  c.drawImage(fg, 0, 0);
  const fgData = c.getImageData(0, 0, W, H).data;

  let bgData: Uint8ClampedArray | null = null;
  if (bg) {
    c.drawImage(bg, 0, 0);
    bgData = c.getImageData(0, 0, W, H).data;
  }

  const result = remapChannels(fgData, bgData, {
    r: { source: rSource as 'first' | 'second', channel: rChannel as ChannelSource },
    g: { source: gSource as 'first' | 'second', channel: gChannel as ChannelSource },
    b: { source: bSource as 'first' | 'second', channel: bChannel as ChannelSource },
    a: { source: aSource as 'first' | 'second', channel: aChannel as ChannelSource },
    invert,
  });

  // Create ImageData via OffscreenCanvas to avoid TS lib mismatch
  const offscreen = new OffscreenCanvas(W, H);
  const octx = offscreen.getContext('2d')!;
  const outImg = octx.createImageData(W, H);
  for (let i = 0; i < result.length; i++) outImg.data[i] = result[i];
  c.putImageData(outImg, 0, 0);
}
