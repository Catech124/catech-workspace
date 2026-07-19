// mask-utils.ts — Shared mask utilities for Mask nodes
// ARC Engine
// generateShapeMask() for mask-rectangle and mask-ellipse

import { acquire } from '../../canvas-pool';

export type MaskShape = 'rectangle' | 'ellipse';

export interface ShapeMaskProps {
  x?: number; y?: number; w?: number; h?: number;
  cx?: number; cy?: number; rx?: number; ry?: number;
  softEdge?: number;
  invert?: boolean;
}

/**
 * Genera una máscara de forma blanca usando canvas pool.
 * Aplica softEdge (blur) e invert si están configurados.
 */
export function generateShapeMask(
  shape: MaskShape,
  props: ShapeMaskProps,
  W: number,
  H: number,
): HTMLCanvasElement {
  const canvas = acquire(W, H);
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#ffffff';

  if (shape === 'rectangle') {
    const x = props.x ?? 0;
    const y = props.y ?? 0;
    const w = props.w ?? W;
    const h = props.h ?? H;
    ctx.fillRect(x, y, w, h);
  } else {
    const cx = props.cx ?? W / 2;
    const cy = props.cy ?? H / 2;
    const rx = props.rx ?? W / 4;
    const ry = props.ry ?? H / 4;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  if (props.invert) {
    invertCanvas(canvas, W, H);
  }
  if (props.softEdge && props.softEdge > 0) {
    applySoftEdge(canvas, W, H, props.softEdge);
  }

  return canvas;
}

export function applySoftEdge(canvas: HTMLCanvasElement, _W: number, _H: number, radius: number): void {
  const ctx = canvas.getContext('2d')!;
  const r = Math.max(1, Math.round(radius));
  ctx.filter = `blur(${r}px)`;
  ctx.drawImage(canvas, 0, 0);
  ctx.filter = 'none';
}

export function invertCanvas(canvas: HTMLCanvasElement, W: number, H: number): void {
  const ctx = canvas.getContext('2d')!;
  const id = ctx.getImageData(0, 0, W, H);
  const d = id.data;
  for (let i = 0; i < d.length; i += 4) {
    d[i] = 255 - d[i];
    d[i + 1] = 255 - d[i + 1];
    d[i + 2] = 255 - d[i + 2];
    d[i + 3] = 255 - d[i + 3];
  }
  ctx.putImageData(id, 0, 0);
}
