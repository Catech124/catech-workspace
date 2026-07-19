// fast-noise.ts — FastNoise node renderer
// ARC Video Editor — Toolcraft Integration
//
// 3 tipos de ruido: perlin (valueNoise2D), simplex, worley
// Color ramp interpolado con lerpColor()
// Props: type, scale, seed, time, brightness, contrast, colorRamp
//
// Fixes aplicados:
//   - Usa acquireImageData() del pool (G11)
//   - Precomputa ramp colors (G13)

import type { NodeRenderContext } from '../recipe';
import { evalPropA } from '../sources/shared/prop-utils';
import { acquireImageData } from '../image-data-pool';

// ═══ Noise functions (ported from original ARC Editor) ═══

function hash(ix: number, iy: number): number {
  let n = ix * 374761393 + iy * 668265263;
  n = (n ^ (n >> 13)) * 1274126177;
  return (n & 0x7fffffff) / 0x7fffffff;
}

function smoothNoise(x: number, y: number): number {
  const ix = Math.floor(x), iy = Math.floor(y);
  const fx = x - ix, fy = y - iy;
  const sx = fx * fx * (3 - 2 * fx);
  const sy = fy * fy * (3 - 2 * fy);
  const n00 = hash(ix, iy);
  const n10 = hash(ix + 1, iy);
  const n01 = hash(ix, iy + 1);
  const n11 = hash(ix + 1, iy + 1);
  return n00 * (1 - sx) * (1 - sy) + n10 * sx * (1 - sy) + n01 * (1 - sx) * sy + n11 * sx * sy;
}

function valueNoise2D(x: number, y: number, scale: number, seed: number): number {
  const sx = x * scale + seed * 100;
  const sy = y * scale + seed * 100;
  return smoothNoise(sx, sy);
}

function simplexNoise2D(x: number, y: number, scale: number, seed: number): number {
  const sx = x * scale + seed * 100;
  const sy = y * scale + seed * 100;
  // Simplified simplex-like: sum of 3 octaves
  return (
    smoothNoise(sx, sy) * 0.5 +
    smoothNoise(sx * 2.1, sy * 2.1) * 0.25 +
    smoothNoise(sx * 4.3, sy * 4.3) * 0.125
  );
}

function worleyNoise2D(x: number, y: number, scale: number, seed: number): number {
  const sx = x * scale + seed * 100;
  const sy = y * scale + seed * 100;
  const ix = Math.floor(sx), iy = Math.floor(sy);
  let minDist = Infinity;
  for (let ox = -1; ox <= 1; ox++) {
    for (let oy = -1; oy <= 1; oy++) {
      const cx = ix + ox, cy = iy + oy;
      const dx = (sx - cx) - hash(cx, cy) * 2;
      const dy = (sy - cy) - hash(cx, cy + 100) * 2;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < minDist) minDist = dist;
    }
  }
  return Math.min(1, minDist);
}

/** Parse hex color to RGB tuple */
function parseHex(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [
    parseInt(h.substring(0, 2), 16) || 0,
    parseInt(h.substring(2, 4), 16) || 0,
    parseInt(h.substring(4, 6), 16) || 0,
  ];
}

/** Lerp between two RGB colors */
function lerpColor(c1: [number, number, number], c2: [number, number, number], t: number): [number, number, number] {
  return [
    Math.round(c1[0] + (c2[0] - c1[0]) * t),
    Math.round(c1[1] + (c2[1] - c1[1]) * t),
    Math.round(c1[2] + (c2[2] - c1[2]) * t),
  ];
}

export function renderFastNoise(ctx: NodeRenderContext): void {
  const { ctx: c, props, W, H, channels, modifiers, t, nodeId } = ctx;
  const noiseType = (props.type as string) || 'perlin';
  const scale = evalPropA(nodeId, 'scale', 0.02, channels, modifiers, t);
  const seed = evalPropA(nodeId, 'seed', 42, channels, modifiers, t);
  const time = evalPropA(nodeId, 'time', 0, channels, modifiers, t);
  const brightness = evalPropA(nodeId, 'brightness', 0.5, channels, modifiers, t);
  const contrast = evalPropA(nodeId, 'contrast', 0.5, channels, modifiers, t);
  const colorRamp = (props.colorRamp as string) || '#000000,#ffffff';

  // Precompute ramp colors (Fix G13)
  const rampHexes = colorRamp.split(',').map(s => s.trim()).filter(s => s.length > 0);
  const rampColors: [number, number, number][] = rampHexes.map(h => parseHex(h));
  if (rampColors.length < 2) {
    rampColors.push([255, 255, 255]);
  }

  const noiseFn = noiseType === 'simplex' ? simplexNoise2D
    : noiseType === 'worley' ? worleyNoise2D
    : valueNoise2D;

  // Use ImageData pool (Fix G11)
  const imageData = acquireImageData(W, H);
  const data = imageData.data;

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      let n = noiseFn(x, y, scale, seed + time * 0.1);
      // Remap brightness/contrast
      n = (n - 0.5) * contrast + 0.5;
      n = n + (brightness - 0.5);
      n = Math.max(0, Math.min(1, n));

      // Color ramp interpolation
      const rampT = n * (rampColors.length - 1);
      const rampIdx = Math.floor(rampT);
      const rampFrac = rampT - rampIdx;
      const ci = Math.min(rampIdx, rampColors.length - 2);
      const [r, g, b] = lerpColor(rampColors[ci], rampColors[ci + 1], rampFrac);

      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
      data[i + 3] = 255;
    }
  }

  c.putImageData(imageData, 0, 0);
}
