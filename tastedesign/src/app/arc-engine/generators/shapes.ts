// shapes.ts — Rectangle, Ellipse & Polygon (CONSOLIDADOS)
// ARC Video Editor — Toolcraft Integration
//
// Los 3 nodos comparten renderShape() con softEdge + invert + canvas pool.
// Fusion analogs: Rectangle Mask, Ellipse Mask, Polygon
//
// Props unificadas: fill, stroke, sw, softEdge, invert
//   Rect: x, y, width, height
//   Ellipse: cx, cy, rx, ry
//   Polygon: cx, cy, radius, sides, starRatio, polyMode, points, tension

import type { NodeRenderContext } from '../recipe';
import { evalPropA } from '../sources/shared/prop-utils';
import { acquire } from '../canvas-pool';

export interface ShapeProps {
  x?: number; y?: number; width?: number; height?: number;
  cx?: number; cy?: number; rx?: number; ry?: number;
  radius?: number; sides?: number; starRatio?: number;
  polyMode?: string; points?: string; tension?: number;
  fill?: string; stroke?: string; sw?: number;
  softEdge?: number; invert?: boolean;
}

/** Catmull-Rom spline interpolation */
function catmullRom(points: { x: number; y: number }[]): { x: number; y: number }[] {
  if (points.length < 2) return points;
  const result: { x: number; y: number }[] = [];
  for (let i = 0; i < points.length; i++) {
    const p0 = points[(i - 1 + points.length) % points.length];
    const p1 = points[i];
    const p2 = points[(i + 1) % points.length];
    const p3 = points[(i + 2) % points.length];
    for (let s = 0; s <= 8; s++) {
      const u = s / 8;
      const u2 = u * u, u3 = u2 * u;
      const x = 0.5 * (
        (2 * p1.x) +
        (-p0.x + p2.x) * u +
        (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * u2 +
        (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * u3
      );
      const y = 0.5 * (
        (2 * p1.y) +
        (-p0.y + p2.y) * u +
        (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * u2 +
        (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * u3
      );
      result.push({ x, y });
    }
  }
  return result;
}

/** Shared shape rendering with softEdge + invert + canvas pool */
function renderShape(
  ctx: CanvasRenderingContext2D,
  drawFn: (c: CanvasRenderingContext2D) => void,
  props: ShapeProps,
  W: number,
  H: number,
): void {
  const canvas = acquire(W, H);
  const c = canvas.getContext('2d')!;

  const fill = (props.fill as string) || '#ffffff';
  const stroke = props.stroke as string;
  const sw = (props.sw as number) || 1;

  c.fillStyle = fill;
  drawFn(c);

  if (stroke) {
    c.strokeStyle = stroke;
    c.lineWidth = sw;
    c.stroke();
  }

  // Invert
  if (props.invert) {
    c.globalCompositeOperation = 'destination-out';
    c.fillRect(0, 0, W, H);
    c.globalCompositeOperation = 'source-over';
  }

  // SoftEdge
  if (props.softEdge && props.softEdge > 0) {
    const r = Math.max(1, Math.round(props.softEdge));
    c.filter = `blur(${r}px)`;
    const bCanvas = acquire(W, H);
    const bc = bCanvas.getContext('2d')!;
    bc.drawImage(canvas, 0, 0);
    c.filter = 'none';
    c.clearRect(0, 0, W, H);
    c.drawImage(bCanvas, 0, 0);
  }

  ctx.drawImage(canvas, 0, 0);
}

export function renderRectangle(ctx: NodeRenderContext): void {
  const { ctx: c, props, W, H, channels, modifiers, t, nodeId } = ctx;
  const x = evalPropA(nodeId, 'x', (props.x as number) ?? 100, channels, modifiers, t);
  const y = evalPropA(nodeId, 'y', (props.y as number) ?? 100, channels, modifiers, t);
  const width = evalPropA(nodeId, 'width', (props.width as number) ?? 300, channels, modifiers, t);
  const height = evalPropA(nodeId, 'height', (props.height as number) ?? 200, channels, modifiers, t);
  const rx = (props.rx as number) || 0;

  renderShape(c, (cc) => {
    if (rx > 0) {
      cc.beginPath();
      cc.roundRect(x, y, width, height, rx);
      cc.fill();
    } else {
      cc.fillRect(x, y, width, height);
    }
  }, props as ShapeProps, W, H);
}

export function renderEllipse(ctx: NodeRenderContext): void {
  const { ctx: c, props, W, H, channels, modifiers, t, nodeId } = ctx;
  const cx = evalPropA(nodeId, 'cx', (props.cx as number) ?? W / 2, channels, modifiers, t);
  const cy = evalPropA(nodeId, 'cy', (props.cy as number) ?? H / 2, channels, modifiers, t);
  const rx = evalPropA(nodeId, 'rx', (props.rx as number) ?? 300, channels, modifiers, t);
  const ry = evalPropA(nodeId, 'ry', (props.ry as number) ?? 200, channels, modifiers, t);

  renderShape(c, (cc) => {
    cc.beginPath();
    cc.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    cc.fill();
  }, props as ShapeProps, W, H);
}

export function renderPolygon(ctx: NodeRenderContext): void {
  const { ctx: c, props, W, H, channels, modifiers, t, nodeId } = ctx;
  const cx = evalPropA(nodeId, 'cx', (props.cx as number) ?? W / 2, channels, modifiers, t);
  const cy = evalPropA(nodeId, 'cy', (props.cy as number) ?? H / 2, channels, modifiers, t);
  const radius = evalPropA(nodeId, 'radius', (props.radius as number) ?? 200, channels, modifiers, t);
  const sides = evalPropA(nodeId, 'sides', (props.sides as number) ?? 5, channels, modifiers, t);
  const starRatio = evalPropA(nodeId, 'starRatio', (props.starRatio as number) ?? 1, channels, modifiers, t);
  const polyMode = (props.polyMode as string) || 'regular';
  const pointsStr = (props.points as string) || '';

  renderShape(c, (cc) => {
    if (polyMode === 'custom' && pointsStr) {
      // Custom points
      const pts = pointsStr.split(';').map(p => {
        const [px, py] = p.split(',').map(Number);
        return { x: px, y: py };
      }).filter(p => !isNaN(p.x) && !isNaN(p.y));

      if (pts.length >= 3) {
        const smoothed = catmullRom(pts);
        cc.beginPath();
        cc.moveTo(smoothed[0].x, smoothed[0].y);
        for (let i = 1; i < smoothed.length; i++) {
          cc.lineTo(smoothed[i].x, smoothed[i].y);
        }
        cc.closePath();
        cc.fill();
        return;
      }
    }

    // Regular polygon
    const count = Math.max(3, Math.round(sides));
    cc.beginPath();
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
      const r = i % 2 === 1 && starRatio !== 1 ? radius * starRatio : radius;
      const px = cx + Math.cos(angle) * r;
      const py = cy + Math.sin(angle) * r;
      if (i === 0) cc.moveTo(px, py);
      else cc.lineTo(px, py);
    }
    cc.closePath();
    cc.fill();
  }, props as ShapeProps, W, H);
}
