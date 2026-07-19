// blur.ts — Shared blur utilities for ARC Engine effects
// ARC Video Editor — Toolcraft Integration
//
// Funciones compartidas entre blur, directional-blur, defocus

import { acquireClampedArray, releaseClampedArray } from '../../image-data-pool';

/**
 * Box blur (separated passes: horizontal then vertical).
 * Ported from engine-effects.js boxBlur().
 */
export function boxBlur(
  src: Uint8ClampedArray,
  W: number,
  H: number,
  radiusX: number,
  radiusY: number,
  iterations: number,
): Uint8ClampedArray {
  const len = src.length;
  const tmp = acquireClampedArray(len);
  const result = acquireClampedArray(len);

  // Copy source to result
  for (let i = 0; i < len; i++) result[i] = src[i];

  const rx = Math.max(1, Math.round(radiusX));
  const ry = Math.max(1, Math.round(radiusY));

  for (let iter = 0; iter < Math.max(1, iterations); iter++) {
    // Horizontal pass
    for (let y = 0; y < H; y++) {
      const rowStart = y * W * 4;
      for (let x = 0; x < W; x++) {
        let r = 0, g = 0, b = 0, a = 0;
        let count = 0;
        const startX = Math.max(0, x - rx);
        const endX = Math.min(W - 1, x + rx);
        for (let sx = startX; sx <= endX; sx++) {
          const si = rowStart + sx * 4;
          r += result[si];
          g += result[si + 1];
          b += result[si + 2];
          a += result[si + 3];
          count++;
        }
        const di = rowStart + x * 4;
        if (count > 0) {
          tmp[di] = r / count;
          tmp[di + 1] = g / count;
          tmp[di + 2] = b / count;
          tmp[di + 3] = a / count;
        }
      }
    }

    // Vertical pass
    for (let x = 0; x < W; x++) {
      for (let y = 0; y < H; y++) {
        let r = 0, g = 0, b = 0, a = 0;
        let count = 0;
        const startY = Math.max(0, y - ry);
        const endY = Math.min(H - 1, y + ry);
        for (let sy = startY; sy <= endY; sy++) {
          const si = (sy * W + x) * 4;
          r += tmp[si];
          g += tmp[si + 1];
          b += tmp[si + 2];
          a += tmp[si + 3];
          count++;
        }
        const di = (y * W + x) * 4;
        if (count > 0) {
          result[di] = r / count;
          result[di + 1] = g / count;
          result[di + 2] = b / count;
          result[di + 3] = a / count;
        }
      }
    }
  }

  releaseClampedArray(tmp);
  return result;
}

/**
 * 1-pass Gaussian blur via Box Blur approximation (3 passes).
 * Takes ImageData, returns new ImageData.
 */
export function gaussianBlurSepia(
  src: ImageData,
  W: number,
  H: number,
  radius: number,
): ImageData {
  const r = Math.max(1, Math.round(radius));
  const blurred = boxBlur(src.data, W, H, r, r, 3);
  // Create ImageData via a temp canvas to avoid TS lib mismatch
  const offscreen = new OffscreenCanvas(W, H);
  const octx = offscreen.getContext('2d')!;
  const out = octx.createImageData(W, H);
  for (let i = 0; i < blurred.length; i++) out.data[i] = blurred[i];
  return out;
}

/**
 * Precalculates sample offsets for directional blur.
 * Returns array of {dx, dy, alpha} offsets.
 */
export function directionalBlurSamples(
  angle: number,
  length: number,
  quality: number,
): { dx: number; dy: number; alpha: number }[] {
  const steps = Math.max(3, Math.round(quality));
  const rad = (angle * Math.PI) / 180;
  const samples: { dx: number; dy: number; alpha: number }[] = [];

  for (let i = 0; i < steps; i++) {
    const t = (i / (steps - 1)) * 2 - 1; // [-1, 1]
    const dx = Math.cos(rad) * t * length;
    const dy = Math.sin(rad) * t * length;
    const alpha = 1 / steps;
    samples.push({ dx, dy, alpha });
  }

  return samples;
}

/**
 * Precalculates iris-shaped sample offsets for defocus.
 * Returns array of {dx, dy, alpha} offsets.
 */
export function defocusSamples(
  radius: number,
  shape: string,
  quality: number,
  curvature: number,
): { dx: number; dy: number; alpha: number }[] {
  const samples: { dx: number; dy: number; alpha: number }[] = [];
  const count = Math.max(3, Math.round(quality));

  if (shape === 'hexagon') {
    // Hexagonal iris
    for (let ring = 0; ring < count; ring++) {
      const t = ring / count;
      const r = radius * t;
      const angleStep = (Math.PI * 2) / 6;
      for (let side = 0; side < 6; side++) {
        const a = side * angleStep + t * 0.1;
        samples.push({
          dx: Math.cos(a) * r,
          dy: Math.sin(a) * r,
          alpha: 1 / (count * 6),
        });
      }
    }
  } else {
    // Circular iris with curvature
    for (let i = 0; i < count; i++) {
      const t = i / count;
      const r = radius * Math.pow(t, 1 / Math.max(0.1, curvature));
      const a = t * Math.PI * 2 * 3;
      samples.push({
        dx: Math.cos(a) * r,
        dy: Math.sin(a) * r,
        alpha: 1 / count,
      });
    }
  }

  return samples;
}
