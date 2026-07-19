// gradient.ts — Gradient node renderer
// ARC Video Editor — Toolcraft Integration
//
// 4 tipos: linear (con ángulo), radial, conic (con fallback), reflected
// Props: type, angle, stops (CSV de colores hex)
//
// Fixes aplicados:
//   - reflected: clona array stops con [...stops] para no mutar original
//   - conic: fallback simulado con múltiples stops angulares

import type { NodeRenderContext } from '../recipe';
import { evalPropA } from '../sources/shared/prop-utils';

export interface GradientProps {
  type?: 'linear' | 'radial' | 'conic' | 'reflected';
  angle?: number;
  stops?: string;
}

function parseStops(stopsStr: string): string[] {
  return stopsStr.split(',').map(s => s.trim()).filter(s => s.length > 0);
}

export function renderGradient(ctx: NodeRenderContext): void {
  const { ctx: c, props, W, H, channels, modifiers, t, nodeId } = ctx;
  const type = (props.type as string) || 'linear';
  const angle = evalPropA(nodeId, 'angle', 0, channels, modifiers, t);
  const stopsStr = (props.stops as string) || '#000000,#ffffff';

  // Clone stops array to avoid mutation (Fix G6)
  const colors = [...parseStops(stopsStr)];
  if (colors.length < 2) {
    c.fillStyle = colors[0] || '#000';
    c.fillRect(0, 0, W, H);
    return;
  }

  let gradient: CanvasGradient;

  switch (type) {
    case 'linear': {
      const rad = (angle * Math.PI) / 180;
      const cx = W / 2, cy = H / 2;
      const len = Math.sqrt(W * W + H * H) / 2;
      const x0 = cx - Math.cos(rad) * len;
      const y0 = cy - Math.sin(rad) * len;
      const x1 = cx + Math.cos(rad) * len;
      const y1 = cy + Math.sin(rad) * len;
      gradient = c.createLinearGradient(x0, y0, x1, y1);
      break;
    }
    case 'radial': {
      gradient = c.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H) / 2);
      break;
    }
    case 'conic': {
      // Conic fallback: simulated with multiple linear gradient segments
      // that approximate a conic gradient
      const segs = 36;
      const step = (Math.PI * 2) / segs;
      const rad = (angle * Math.PI) / 180;
      const cx = W / 2, cy = H / 2;
      const maxR = Math.sqrt(W * W + H * H) / 2;

      for (let i = 0; i < segs; i++) {
        const a0 = rad + i * step;
        const a1 = rad + (i + 1) * step;
        const t0 = i / segs;
        const t1 = (i + 1) / segs;

        // Interpolate colors
        const ci0 = t0 * (colors.length - 1);
        const ci1 = t1 * (colors.length - 1);
        const idx0 = Math.floor(ci0);
        const idx1 = Math.floor(ci1);
        const c0 = colors[Math.min(idx0, colors.length - 1)];
        const c2 = colors[Math.min(idx1, colors.length - 1)];

        const x0 = cx + Math.cos(a0) * maxR;
        const y0 = cy + Math.sin(a0) * maxR;
        const x1 = cx + Math.cos(a1) * maxR;
        const y1 = cy + Math.sin(a1) * maxR;

        const segGrad = c.createLinearGradient(x0, y0, x1, y1);
        segGrad.addColorStop(0, c0);
        segGrad.addColorStop(1, c2);
        c.fillStyle = segGrad;
        c.beginPath();
        c.moveTo(cx, cy);
        c.lineTo(x0, y0);
        c.lineTo(x1, y1);
        c.closePath();
        c.fill();
      }
      return;
    }
    case 'reflected': {
      // Reflected: mirror the stops
      const reversed = [...colors].reverse();
      const reflectedColors = [...colors, ...reversed];
      const rad = (angle * Math.PI) / 180;
      const cx = W / 2, cy = H / 2;
      const len = Math.sqrt(W * W + H * H) / 2;
      const x0 = cx - Math.cos(rad) * len;
      const y0 = cy - Math.sin(rad) * len;
      const x1 = cx + Math.cos(rad) * len;
      const y1 = cy + Math.sin(rad) * len;
      gradient = c.createLinearGradient(x0, y0, x1, y1);
      for (let i = 0; i < reflectedColors.length; i++) {
        gradient.addColorStop(i / (reflectedColors.length - 1), reflectedColors[i]);
      }
      c.fillStyle = gradient;
      c.fillRect(0, 0, W, H);
      return;
    }
    default: {
      c.fillStyle = colors[0];
      c.fillRect(0, 0, W, H);
      return;
    }
  }

  // Apply color stops for linear/radial
  for (let i = 0; i < colors.length; i++) {
    gradient.addColorStop(i / (colors.length - 1), colors[i]);
  }

  c.fillStyle = gradient;
  c.fillRect(0, 0, W, H);
}
