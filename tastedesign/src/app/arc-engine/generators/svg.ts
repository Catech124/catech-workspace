// svg.ts — SVG node renderer (mini SVG parser)
// ARC Video Editor — Toolcraft Integration
//
// Mini-lenguaje SVG: 'rect x=0 y=0 w=100 h=100 fill=red'
// Soporta: rect, circle, ellipse, line, polygon, path (Path2D)
//
// Fixes aplicados:
//   - Parser mejorado: soporta quotes, valores multi-palabra (G17)
//   - Validación numérica con isNaN (G18)

import type { NodeRenderContext } from '../recipe';

export interface SvgProps {
  svg?: string;
}

/** Parse 'key=value key2=value2' syntax supporting quoted values */
function parseAttrs(str: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  const regex = /(\w+)=(?:"([^"]*)"|(\S+))/g;
  let match;
  while ((match = regex.exec(str)) !== null) {
    attrs[match[1]] = match[2] !== undefined ? match[2] : match[3];
  }
  return attrs;
}

/** Safe parseFloat with NaN validation (Fix G18) */
function safeNum(val: string | undefined, fallback: number): number {
  if (val === undefined || val === '') return fallback;
  const n = parseFloat(val);
  return isNaN(n) ? fallback : n;
}

export function renderSvg(ctx: NodeRenderContext): void {
  const { ctx: c, W, H } = ctx;
  const svgStr = (ctx.props.svg as string) || 'rect x=0 y=0 w=100 h=100 fill=#1a1a1a';

  // Parse commands
  const commands = svgStr.trim().split('\n').map(line => line.trim()).filter(Boolean);

  c.fillStyle = 'transparent';
  c.clearRect(0, 0, W, H);

  for (const cmdStr of commands) {
    const spaceIdx = cmdStr.indexOf(' ');
    const shapeName = spaceIdx > 0 ? cmdStr.substring(0, spaceIdx) : cmdStr;
    const attrsStr = spaceIdx > 0 ? cmdStr.substring(spaceIdx + 1) : '';
    const attrs = parseAttrs(attrsStr);

    try {
      switch (shapeName) {
        case 'rect': {
          const x = safeNum(attrs.x, 0);
          const y = safeNum(attrs.y, 0);
          const w = safeNum(attrs.w, 100);
          const h = safeNum(attrs.h, 100);
          const rx = safeNum(attrs.rx, 0);
          const fill = attrs.fill || '#ffffff';
          const stroke = attrs.stroke || '';
          const sw = safeNum(attrs.sw, 1);

          c.fillStyle = fill;
          if (rx > 0) {
            c.beginPath();
            c.roundRect(x, y, w, h, rx);
            c.fill();
          } else {
            c.fillRect(x, y, w, h);
          }

          if (stroke) {
            c.strokeStyle = stroke;
            c.lineWidth = sw;
            c.strokeRect(x, y, w, h);
          }
          break;
        }
        case 'circle': {
          const cx = safeNum(attrs.cx, W / 2);
          const cy = safeNum(attrs.cy, H / 2);
          const r = safeNum(attrs.r, 50);
          const fill = attrs.fill || '#ffffff';
          const stroke = attrs.stroke || '';

          c.fillStyle = fill;
          c.beginPath();
          c.arc(cx, cy, r, 0, Math.PI * 2);
          c.fill();

          if (stroke) {
            c.strokeStyle = stroke;
            c.lineWidth = safeNum(attrs.sw, 1);
            c.stroke();
          }
          break;
        }
        case 'ellipse': {
          const cx = safeNum(attrs.cx, W / 2);
          const cy = safeNum(attrs.cy, H / 2);
          const rx = safeNum(attrs.rx, 100);
          const ry = safeNum(attrs.ry, 50);
          const fill = attrs.fill || '#ffffff';
          const stroke = attrs.stroke || '';

          c.fillStyle = fill;
          c.beginPath();
          c.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
          c.fill();

          if (stroke) {
            c.strokeStyle = stroke;
            c.lineWidth = safeNum(attrs.sw, 1);
            c.stroke();
          }
          break;
        }
        case 'line': {
          const x1 = safeNum(attrs.x1, 0);
          const y1 = safeNum(attrs.y1, 0);
          const x2 = safeNum(attrs.x2, W);
          const y2 = safeNum(attrs.y2, H);
          const color = attrs.color || '#ffffff';

          c.strokeStyle = color;
          c.lineWidth = safeNum(attrs.sw, 1);
          c.beginPath();
          c.moveTo(x1, y1);
          c.lineTo(x2, y2);
          c.stroke();
          break;
        }
        case 'polygon': {
          const pointsStr = attrs.points || '';
          if (pointsStr) {
            const pts = pointsStr.split(' ').map(p => {
              const [px, py] = p.split(',').map(Number);
              return { x: px, y: py };
            }).filter(p => !isNaN(p.x) && !isNaN(p.y));
            const fill = attrs.fill || '#ffffff';

            if (pts.length >= 3) {
              c.fillStyle = fill;
              c.beginPath();
              c.moveTo(pts[0].x, pts[0].y);
              for (let i = 1; i < pts.length; i++) {
                c.lineTo(pts[i].x, pts[i].y);
              }
              c.closePath();
              c.fill();
            }
          }
          break;
        }
        case 'path': {
          const d = attrs.d || '';
          if (d) {
            const path = new Path2D(d);
            const fill = attrs.fill || '#ffffff';
            const stroke = attrs.stroke || '';
            c.fillStyle = fill;
            c.fill(path);
            if (stroke) {
              c.strokeStyle = stroke;
              c.lineWidth = safeNum(attrs.sw, 1);
              c.stroke(path);
            }
          }
          break;
        }
      }
    } catch {
      // Silently skip invalid shapes
    }
  }
}
