// erode-dilate.ts — Erode / Dilate morphological operations on alpha
// ARC Engine

import type { NodeRenderContext } from '../recipe';
import { evalPropA } from '../sources/shared/prop-utils';
import { acquireImageData, releaseImageData } from '../image-data-pool';

export function renderErodeDilate(ctx: NodeRenderContext): void {
  const { ctx: c, props, W, H, inputs, channels, modifiers, t, nodeId } = ctx;
  const source = inputs[0];
  if (!source) return;

  const type = (props.type as string) || 'erode';
  const radius = Math.max(1, Math.round(evalPropA(nodeId, 'radius', (props.radius as number) ?? 5, channels, modifiers, t)));
  const channelsMode = (props.channels as string) || 'alpha';

  c.drawImage(source, 0, 0);
  const imgData = c.getImageData(0, 0, W, H);
  const d = imgData.data;

  const resultId = acquireImageData(W, H);
  const result = resultId.data;

  const isErode = type === 'erode';

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const idx = (y * W + x) * 4;

      let minVal = 255, maxVal = 0;
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const px = x + dx, py = y + dy;
          if (px < 0 || px >= W || py < 0 || py >= H) continue;
          const ni = (py * W + px) * 4;
          let val: number;
          if (channelsMode === 'alpha') {
            val = d[ni + 3];
          } else if (channelsMode === 'rgb') {
            val = (d[ni] + d[ni + 1] + d[ni + 2]) / 3;
          } else {
            val = (d[ni] + d[ni + 1] + d[ni + 2] + d[ni + 3]) / 4;
          }
          if (val < minVal) minVal = val;
          if (val > maxVal) maxVal = val;
        }
      }

      const outVal = isErode ? minVal : maxVal;
      if (channelsMode === 'alpha') {
        result[idx] = d[idx];
        result[idx + 1] = d[idx + 1];
        result[idx + 2] = d[idx + 2];
        result[idx + 3] = outVal;
      } else {
        result[idx] = outVal;
        result[idx + 1] = outVal;
        result[idx + 2] = outVal;
        result[idx + 3] = d[idx + 3];
      }
    }
  }

  c.putImageData(resultId, 0, 0);
  releaseImageData(resultId);
}
