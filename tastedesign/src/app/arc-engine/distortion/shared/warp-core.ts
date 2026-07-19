// warp-core.ts — Shared warp utilities for Distortion nodes
// ARC Engine
// 4 of 6 distortion nodes share the same boilerplate: getImageData → forEachPixel with warpFn → putImageData
// This module provides renderWarp() and bilinearSample() to eliminate duplication.

import { acquireImageData, releaseImageData } from '../../image-data-pool';

/**
 * Warp function signature: given (x, y, pixelIndex, time), return the source sample point.
 * Return null to leave the pixel unchanged (uses nearest-neighbor from source).
 */
export type WarpFn = (x: number, y: number, i: number, t: number) => { sx: number; sy: number } | null;

/**
 * Pipeline warp compartido: drawImage → getImageData → forEachPixel con warpFn → putImageData.
 * Usa acquireImageData() del pool para zero alloc.
 * Dibuja el resultado en ctx.
 */
export function renderWarp(
  ctx: CanvasRenderingContext2D,
  srcCanvas: HTMLCanvasElement,
  warpFn: WarpFn,
  t: number,
  W: number,
  H: number,
): void {
  ctx.drawImage(srcCanvas, 0, 0);
  const srcId = ctx.getImageData(0, 0, W, H);
  const srcData = srcId.data;

  const resultId = acquireImageData(W, H);
  const result = resultId.data;

  // Copy source as default (pixels where warpFn returns null will remain unchanged)
  for (let i = 0; i < srcData.length; i++) {
    result[i] = srcData[i];
  }

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      const sample = warpFn(x, y, i, t);
      if (sample && sample.sx >= 0 && sample.sx < W && sample.sy >= 0 && sample.sy < H) {
        const s = bilinearSample(srcData, W, H, sample.sx, sample.sy);
        result[i] = s[0];
        result[i + 1] = s[1];
        result[i + 2] = s[2];
        result[i + 3] = s[3];
      }
    }
  }

  ctx.putImageData(resultId, 0, 0);
  releaseImageData(resultId);
}

/**
 * Bilinear interpolation sampler.
 */
export function bilinearSample(
  data: Uint8ClampedArray,
  W: number,
  H: number,
  x: number,
  y: number,
): [number, number, number, number] {
  const ix = Math.floor(x), iy = Math.floor(y);
  const fx = x - ix, fy = y - iy;
  const x0 = Math.max(0, Math.min(W - 2, ix));
  const y0 = Math.max(0, Math.min(H - 2, iy));
  const x1 = x0 + 1, y1 = y0 + 1;
  const i00 = (y0 * W + x0) * 4;
  const i10 = (y0 * W + x1) * 4;
  const i01 = (y1 * W + x0) * 4;
  const i11 = (y1 * W + x1) * 4;
  return [
    Math.round(data[i00] * (1 - fx) * (1 - fy) + data[i10] * fx * (1 - fy) + data[i01] * (1 - fx) * fy + data[i11] * fx * fy),
    Math.round(data[i00 + 1] * (1 - fx) * (1 - fy) + data[i10 + 1] * fx * (1 - fy) + data[i01 + 1] * (1 - fx) * fy + data[i11 + 1] * fx * fy),
    Math.round(data[i00 + 2] * (1 - fx) * (1 - fy) + data[i10 + 2] * fx * (1 - fy) + data[i01 + 2] * (1 - fx) * fy + data[i11 + 2] * fx * fy),
    Math.round(data[i00 + 3] * (1 - fx) * (1 - fy) + data[i10 + 3] * fx * (1 - fy) + data[i01 + 3] * (1 - fx) * fy + data[i11 + 3] * fx * fy),
  ];
}
