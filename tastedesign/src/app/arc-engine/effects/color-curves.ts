// color-curves.ts — Color Curves effect (RGB + HLS splines)
// ARC Video Editor — Toolcraft Integration
// Fusion analog: Color Curves
// Inputs: 1 (Background) | Outputs: 1 (Salida)
//
// Soporta curvas RGB por canal y curvas HLS (Hue vs Hue/Sat/Lum, Lum vs Sat, Sat vs Sat)
// Presets: linear, contrast, negative, bright, dark

import type { NodeRenderContext } from '../recipe';
import { rgbToHsl, hslToRgb } from './shared/color-utils';

// ═══ Curve presets ═══
const CURVE_PRESETS: Record<string, string> = {
  linear: '0,0,1,1',
  contrast: '0,0,0.25,0.25,0.75,0.75,1,1',
  negative: '0,1,1,0',
  bright: '0,0.1,1,1',
  dark: '0,0,1,0.9',
};

/** Parse curve points string → array of {x, y} */
function parseCurvePoints(str: string): { x: number; y: number }[] {
  const nums = str.split(',').map(Number);
  const points: { x: number; y: number }[] = [];
  for (let i = 0; i < nums.length - 1; i += 2) {
    if (!isNaN(nums[i]) && !isNaN(nums[i + 1])) {
      points.push({ x: Math.max(0, Math.min(1, nums[i])), y: Math.max(0, Math.min(1, nums[i + 1])) });
    }
  }
  return points;
}

/** Evaluate a curve at position t using linear interpolation between points */
function evalCurve(points: { x: number; y: number }[], t: number): number {
  if (points.length === 0) return t;
  if (points.length === 1) return points[0].y;
  if (t <= points[0].x) return points[0].y;
  if (t >= points[points.length - 1].x) return points[points.length - 1].y;

  for (let i = 0; i < points.length - 1; i++) {
    if (t >= points[i].x && t <= points[i + 1].x) {
      const seg = points[i + 1].x - points[i].x;
      if (seg <= 0) return points[i].y;
      const f = (t - points[i].x) / seg;
      return points[i].y + (points[i + 1].y - points[i].y) * f;
    }
  }
  return t;
}

export function renderColorCurves(ctx: NodeRenderContext): void {
  const { ctx: c, inputs, props, W, H } = ctx;
  const bg = inputs[0];
  if (!bg) return;

  const mode = (props.mode as string) || 'custom';
  const preset = (props.preset as string) || 'linear';
  const channels = (props.channels as string) || 'RGB';

  // Resolve curve points
  const curveStr = mode === 'preset' ? (CURVE_PRESETS[preset] || CURVE_PRESETS.linear) : '';

  const pointsR = parseCurvePoints((props.points_r as string) || curveStr || '0,0,1,1');
  const pointsG = parseCurvePoints((props.points_g as string) || curveStr || '0,0,1,1');
  const pointsB = parseCurvePoints((props.points_b as string) || curveStr || '0,0,1,1');
  const pointsA = parseCurvePoints((props.points_a as string) || curveStr || '0,0,1,1');

  const ptsHueHue = parseCurvePoints((props.pts_hue_hue as string) || '0,0,1,1');
  const ptsHueSat = parseCurvePoints((props.pts_hue_sat as string) || '0,1,1,1');
  const ptsHueLum = parseCurvePoints((props.pts_hue_lum as string) || '0,1,1,1');
  const ptsLumSat = parseCurvePoints((props.pts_lum_sat as string) || '0,1,1,1');
  const ptsSatSat = parseCurvePoints((props.pts_sat_sat as string) || '0,1,1,1');

  c.drawImage(bg, 0, 0);
  const id = c.getImageData(0, 0, W, H);
  const d = id.data;

  for (let i = 0; i < d.length; i += 4) {
    let r = d[i], g = d[i + 1], b = d[i + 2], a = d[i + 3];
    const rN = r / 255, gN = g / 255, bN = b / 255, aN = a / 255;

    // RGB curves
    if (channels === 'RGB' || channels === 'R') r = Math.round(evalCurve(pointsR, rN) * 255);
    if (channels === 'RGB' || channels === 'G') g = Math.round(evalCurve(pointsG, gN) * 255);
    if (channels === 'RGB' || channels === 'B') b = Math.round(evalCurve(pointsB, bN) * 255);
    if (channels === 'RGB' || channels === 'Alpha') a = Math.round(evalCurve(pointsA, aN) * 255);

    // HLS curves
    let [h, s, l] = rgbToHsl(r, g, b);
    const hN = h / 360, sN = s / 100, lN = l / 100;

    h = Math.round(evalCurve(ptsHueHue, hN) * 360);
    s = Math.round(evalCurve(ptsHueSat, hN) * 100);
    l = Math.round(evalCurve(ptsHueLum, hN) * 100);

    // Lum vs Sat, Sat vs Sat
    s = Math.round(evalCurve(ptsLumSat, lN) * 100);
    s = Math.round(evalCurve(ptsSatSat, sN) * 100);

    const [cr, cg, cb] = hslToRgb(h, s, l);
    d[i] = cr;
    d[i + 1] = cg;
    d[i + 2] = cb;
    d[i + 3] = a;
  }

  c.putImageData(id, 0, 0);
}
