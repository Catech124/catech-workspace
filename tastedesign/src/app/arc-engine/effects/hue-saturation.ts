// hue-saturation.ts — Hue vs Sat effect (HSL por canal de color)
// ARC Video Editor — Toolcraft Integration
// Fusion analog: Hue vs Sat / Color Warper
// Inputs: 1 (Background) | Outputs: 1 (Salida)
//
// Props: hue, saturation, lightness, red/green/blue/cyan/magenta/yellow weights
// Usa rgbToHsl/hslToRgb de shared/color-utils.ts

import type { NodeRenderContext } from '../recipe';
import { rgbToHsl, hslToRgb } from './shared/color-utils';

// Channel centers (degrees)
const CHANNEL_CENTERS: Record<string, number> = {
  red: 0, orange: 30, yellow: 60, green: 120,
  cyan: 180, blue: 240, purple: 270, magenta: 300,
};

/** Apply per-channel weight based on hue distance */
function channelWeight(hue: number, center: number): number {
  let dist = Math.abs(hue - center);
  if (dist > 180) dist = 360 - dist;
  return Math.max(0, 1 - dist / 30);
}

export function renderHueSaturation(ctx: NodeRenderContext): void {
  const { ctx: c, inputs, props, W, H } = ctx;
  const bg = inputs[0];
  if (!bg) return;

  const hue = (props.hue as number) ?? 0;
  const saturation = (props.saturation as number) ?? 1;
  const lightness = (props.lightness as number) ?? 1;

  c.drawImage(bg, 0, 0);
  const id = c.getImageData(0, 0, W, H);
  const d = id.data;

  for (let i = 0; i < d.length; i += 4) {
    let [h, s, l] = rgbToHsl(d[i], d[i + 1], d[i + 2]);

    // Per-channel weight modulation
    let hShift = hue;
    let sMult = saturation;
    let lMult = lightness;

    for (const [chName, center] of Object.entries(CHANNEL_CENTERS)) {
      const w = channelWeight(h, center);
      if (w > 0) {
        const chVal = (props[chName] as number) ?? 1;
        if (chVal !== 1) {
          // Apply per-channel adjustment
          hShift += (chVal - 1) * w * 30;
          sMult *= 1 + (chVal - 1) * w * 0.5;
          lMult *= 1 + (chVal - 1) * w * 0.3;
        }
      }
    }

    h = ((h + hShift) % 360 + 360) % 360;
    s = Math.max(0, Math.min(100, s * sMult));
    l = Math.max(0, Math.min(100, l * lMult));

    const [r, g, b] = hslToRgb(h, s, l);
    d[i] = r;
    d[i + 1] = g;
    d[i + 2] = b;
  }

  c.putImageData(id, 0, 0);
}
