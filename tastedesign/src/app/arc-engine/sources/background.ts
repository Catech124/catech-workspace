// background.ts — Background node renderer
// ARC Video Editor — Toolcraft Integration
//
// Generates a solid color or gradient background.
// Fusion analog: Background
// Inputs: 0 | Outputs: 1 (Salida)
// Pipeline: Effect Mask → Output Gain
//
// Props:
//   type: 'solid' | 'horizontal' | 'vertical' | 'radial'
//   topColor: string (hex) — color único (solid) o superior (gradient)
//   bottomColor: string (hex) — color inferior (gradient only)

import type { NodeRenderContext } from '../recipe';

export interface BackgroundProps {
  type?: 'solid' | 'horizontal' | 'vertical' | 'radial';
  topColor?: string;
  bottomColor?: string;
}

export function renderBackground(ctx: NodeRenderContext): void {
  const { ctx: c, props, W, H } = ctx;
  const type = (props.type as string) || 'solid';
  const topColor = (props.topColor as string) || '#1a1a1a';
  const bottomColor = (props.bottomColor as string) || '#0a0a0a';

  if (type === 'solid') {
    c.fillStyle = topColor;
    c.fillRect(0, 0, W, H);
    return;
  }

  let gradient: CanvasGradient;

  switch (type) {
    case 'horizontal':
      gradient = c.createLinearGradient(0, 0, W, 0);
      gradient.addColorStop(0, topColor);
      gradient.addColorStop(1, bottomColor);
      break;
    case 'vertical':
      gradient = c.createLinearGradient(0, 0, 0, H);
      gradient.addColorStop(0, topColor);
      gradient.addColorStop(1, bottomColor);
      break;
    case 'radial':
      gradient = c.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H) / 2);
      gradient.addColorStop(0, topColor);
      gradient.addColorStop(1, bottomColor);
      break;
    default:
      c.fillStyle = topColor;
      c.fillRect(0, 0, W, H);
      return;
  }

  c.fillStyle = gradient;
  c.fillRect(0, 0, W, H);
}
