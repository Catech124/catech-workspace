// keyers.ts — Keyers: Luma, Chroma, Delta, HSL Qualifier, Magic Mask
// ARC Engine

import type { NodeRenderContext } from '../recipe';
import { evalPropA } from '../sources/shared/prop-utils';
import { rgbToHsl, getLuminance } from './shared/color-utils';

// ── Inline hex helpers (shared across keyers) ──────────────────────
function hexR(h: string): number { const c = h.replace('#', ''); return parseInt((c.length === 3 ? c[0]+c[0] : c.substring(0,2)), 16) || 0; }
function hexG(h: string): number { const c = h.replace('#', ''); return parseInt((c.length === 3 ? c[1]+c[1] : c.substring(2,4)), 16) || 0; }
function hexB(h: string): number { const c = h.replace('#', ''); return parseInt((c.length === 3 ? c[2]+c[2] : c.substring(4,6)), 16) || 0; }

// ── RGB → YUV for chroma keyer ────────────────────────────────────
function rgbToYuv(r: number, g: number, b: number): [number, number, number] {
  return [
    0.299 * r + 0.587 * g + 0.114 * b,                                 // Y
   -0.147 * r - 0.289 * g + 0.436 * b,                                 // U
    0.615 * r - 0.515 * g - 0.100 * b,                                 // V
  ];
}

// ════════════════════════════════════════════════════════════════════
// 1. LUMA KEYER
// ════════════════════════════════════════════════════════════════════

export function renderLumaKeyer(ctx: NodeRenderContext): void {
  const { ctx: c, props, W, H, inputs, channels, modifiers, t, nodeId } = ctx;
  const source = inputs[0];
  if (!source) return;

  const low = evalPropA(nodeId, 'low', (props.low as number) ?? 0, channels, modifiers, t);
  const high = evalPropA(nodeId, 'high', (props.high as number) ?? 1, channels, modifiers, t);
  const softness = evalPropA(nodeId, 'softness', (props.softness as number) ?? 0, channels, modifiers, t);
  const invert = !!(props.invert as boolean);

  c.drawImage(source, 0, 0);
  const imgData = c.getImageData(0, 0, W, H);
  const d = imgData.data;
  const soft = Math.max(0.001, softness * (high - low));

  for (let i = 0; i < d.length; i += 4) {
    const lum = (d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114) / 255;
    let alpha: number;
    if (lum < low) alpha = 0;
    else if (lum < low + soft) alpha = (lum - low) / soft;
    else if (lum <= high - soft) alpha = 1;
    else if (lum <= high) alpha = (high - lum) / soft;
    else alpha = 0;

    if (invert) alpha = 1 - alpha;
    d[i] = Math.round(d[i] * alpha);
    d[i + 1] = Math.round(d[i + 1] * alpha);
    d[i + 2] = Math.round(d[i + 2] * alpha);
    d[i + 3] = Math.round(alpha * 255);
  }
  c.putImageData(imgData, 0, 0);
}

// ════════════════════════════════════════════════════════════════════
// 2. CHROMA KEYER
// ════════════════════════════════════════════════════════════════════

export function renderChromaKeyer(ctx: NodeRenderContext): void {
  const { ctx: c, props, W, H, inputs, channels, modifiers, t, nodeId } = ctx;
  const source = inputs[0];
  if (!source) return;

  const keyColor = (props.keyColor as string) ?? '#00ff00';
  const tolerance = evalPropA(nodeId, 'tolerance', (props.tolerance as number) ?? 0.3, channels, modifiers, t);
  const softness = evalPropA(nodeId, 'softness', (props.softness as number) ?? 0.1, channels, modifiers, t);
  const edgeThinning = evalPropA(nodeId, 'edgeThinning', (props.edgeThinning as number) ?? 0, channels, modifiers, t);
  const spillSuppress = evalPropA(nodeId, 'spillSuppress', (props.spillSuppress as number) ?? 0, channels, modifiers, t);
  const invert = !!(props.invert as boolean);

  const [, ku, kv] = rgbToYuv(hexR(keyColor), hexG(keyColor), hexB(keyColor));

  c.drawImage(source, 0, 0);
  const imgData = c.getImageData(0, 0, W, H);
  const d = imgData.data;
  const out = new Uint8ClampedArray(d.length);

  for (let i = 0; i < d.length; i += 4) {
    const [, u, v] = rgbToYuv(d[i], d[i + 1], d[i + 2]);
    const du = u - ku, dv = v - kv;
    const dist = Math.sqrt(du * du + dv * dv);
    const inner = tolerance * 0.5;
    const outer = inner + softness * 0.5;

    let alpha: number;
    if (dist < inner) alpha = 0;
    else if (dist < outer) alpha = (dist - inner) / (outer - inner);
    else alpha = 1;

    if (edgeThinning > 0) {
      alpha = alpha < 0.5
        ? Math.max(0, alpha - edgeThinning * alpha)
        : Math.min(1, alpha + edgeThinning * (1 - alpha));
    }
    if (invert) alpha = 1 - alpha;

    let sr = d[i], sg = d[i + 1], sb = d[i + 2];
    if (spillSuppress > 0 && alpha > 0.5) {
      const spill = Math.max(0, (sg - sr) * 0.5 + (sg - sb) * 0.5);
      sg = Math.max(0, sg - spill * spillSuppress * (1 - alpha));
    }

    out[i] = Math.round(sr * alpha);
    out[i + 1] = Math.round(sg * alpha);
    out[i + 2] = Math.round(sb * alpha);
    out[i + 3] = Math.round(alpha * 255);
  }

  c.putImageData(new ImageData(out, W, H), 0, 0);
}

// ════════════════════════════════════════════════════════════════════
// 3. DELTA KEYER
// ════════════════════════════════════════════════════════════════════

export function renderDeltaKeyer(ctx: NodeRenderContext): void {
  const { ctx: c, props, W, H, inputs, channels, modifiers, t, nodeId } = ctx;
  const sourceA = inputs[0];
  const sourceB = inputs[1];
  if (!sourceA || !sourceB) return;

  const tolerance = evalPropA(nodeId, 'tolerance', (props.tolerance as number) ?? 0.1, channels, modifiers, t);
  const softness = evalPropA(nodeId, 'softness', (props.softness as number) ?? 0.05, channels, modifiers, t);
  const invert = !!(props.invert as boolean);

  c.drawImage(sourceA, 0, 0);
  const dataA = c.getImageData(0, 0, W, H).data;

  c.drawImage(sourceB, 0, 0);
  const dataB = c.getImageData(0, 0, W, H).data;

  c.drawImage(sourceA, 0, 0); // restore sourceA
  const outData = c.createImageData(W, H);
  const out = outData.data;

  for (let i = 0; i < dataA.length; i += 4) {
    const dr = Math.abs(dataA[i] - dataB[i]) / 255;
    const dg = Math.abs(dataA[i + 1] - dataB[i + 1]) / 255;
    const db = Math.abs(dataA[i + 2] - dataB[i + 2]) / 255;
    const diff = (dr + dg + db) / 3;

    let alpha: number;
    if (diff < tolerance) alpha = 0;
    else if (diff < tolerance + softness) alpha = (diff - tolerance) / softness;
    else alpha = 1;

    if (invert) alpha = 1 - alpha;
    out[i] = Math.round(dataA[i] * alpha);
    out[i + 1] = Math.round(dataA[i + 1] * alpha);
    out[i + 2] = Math.round(dataA[i + 2] * alpha);
    out[i + 3] = Math.round(alpha * 255);
  }

  c.putImageData(outData, 0, 0);
}

// ════════════════════════════════════════════════════════════════════
// 4. HSL QUALIFIER
// ════════════════════════════════════════════════════════════════════

export function renderHSLQualifier(ctx: NodeRenderContext): void {
  const { ctx: c, props, W, H, inputs, channels, modifiers, t, nodeId } = ctx;
  const source = inputs[0];
  if (!source) return;

  const hueLow = evalPropA(nodeId, 'hueLow', (props.hueLow as number) ?? 0, channels, modifiers, t);
  const hueHigh = evalPropA(nodeId, 'hueHigh', (props.hueHigh as number) ?? 1, channels, modifiers, t);
  const satLow = evalPropA(nodeId, 'satLow', (props.satLow as number) ?? 0, channels, modifiers, t);
  const satHigh = evalPropA(nodeId, 'satHigh', (props.satHigh as number) ?? 1, channels, modifiers, t);
  const lumLow = evalPropA(nodeId, 'lumLow', (props.lumLow as number) ?? 0, channels, modifiers, t);
  const lumHigh = evalPropA(nodeId, 'lumHigh', (props.lumHigh as number) ?? 1, channels, modifiers, t);
  const softness = evalPropA(nodeId, 'softness', (props.softness as number) ?? 0.1, channels, modifiers, t);
  const invert = !!(props.invert as boolean);

  c.drawImage(source, 0, 0);
  const imgData = c.getImageData(0, 0, W, H);
  const d = imgData.data;

  const hueFrom = hueLow * 360, hueTo = hueHigh * 360;
  const soft = softness * 0.5;
  const satLowN = satLow * 100, satHighN = satHigh * 100;
  const lumLowN = lumLow * 100, lumHighN = lumHigh * 100;
  const softSat = soft * 100;

  for (let i = 0; i < d.length; i += 4) {
    const hsl = rgbToHsl(d[i], d[i + 1], d[i + 2]);
    const h = hsl[0]; // 0-360 from rgbToHsl
    const s = hsl[1]; // 0-100 from rgbToHsl
    const l = hsl[2]; // 0-100 from rgbToHsl

    // Hue match with smooth falloff at range edges
    let hMatch = 0;
    if (hueTo > hueFrom) {
      if (h >= hueFrom && h <= hueTo) {
        hMatch = Math.min(1, Math.max(0, Math.min(
          (h - hueFrom) / ((soft * 360) || 1),
          (hueTo - h) / ((soft * 360) || 1),
        )));
      }
    } else {
      if ((h >= hueFrom && h <= 360) || (h >= 0 && h <= hueTo)) {
        const dist = Math.min(h >= hueFrom ? h - hueFrom : hueTo - h + 360, h <= hueTo ? hueTo - h : h - hueFrom + 360);
        hMatch = Math.min(1, Math.max(0, dist / ((soft * 360) || 1)));
      }
    }

    // Saturation match (0-100)
    let sMatch = 0;
    if (s >= satLowN - softSat && s <= satHighN + softSat) {
      sMatch = Math.min(1, Math.min(
        (s - (satLowN - softSat)) / (softSat || 0.01),
        ((satHighN + softSat) - s) / (softSat || 0.01),
      ));
    }

    // Luminance match (0-100)
    let lMatch = 0;
    if (l >= lumLowN - softSat && l <= lumHighN + softSat) {
      lMatch = Math.min(1, Math.min(
        (l - (lumLowN - softSat)) / (softSat || 0.01),
        ((lumHighN + softSat) - l) / (softSat || 0.01),
      ));
    }

    const alpha = Math.min(hMatch, sMatch, lMatch);
    const finalAlpha = invert ? 1 - alpha : alpha;

    d[i] = Math.round(d[i] * finalAlpha);
    d[i + 1] = Math.round(d[i + 1] * finalAlpha);
    d[i + 2] = Math.round(d[i + 2] * finalAlpha);
    d[i + 3] = Math.round(finalAlpha * 255);
  }

  c.putImageData(imgData, 0, 0);
}

// ════════════════════════════════════════════════════════════════════
// 5. MAGIC MASK (placeholder — AI-powered rotoscoping)
// ════════════════════════════════════════════════════════════════════

export function renderMagicMask(ctx: NodeRenderContext): void {
  const { ctx: c, props, W, H, inputs, channels, modifiers, t, nodeId } = ctx;
  const source = inputs[0];
  if (!source) return;

  const mode = (props.mode as string) ?? 'fg';
  const tolerance = evalPropA(nodeId, 'tolerance', (props.tolerance as number) ?? 0.3, channels, modifiers, t);
  const refine = evalPropA(nodeId, 'refine', (props.refine as number) ?? 0, channels, modifiers, t);

  c.drawImage(source, 0, 0);
  const imgData = c.getImageData(0, 0, W, H);
  const d = imgData.data;

  if (mode === 'fg') {
    const fgR = evalPropA(nodeId, 'fgR', (props.fgR as number) ?? 50, channels, modifiers, t);
    const fgG = evalPropA(nodeId, 'fgG', (props.fgG as number) ?? 180, channels, modifiers, t);
    const fgB = evalPropA(nodeId, 'fgB', (props.fgB as number) ?? 50, channels, modifiers, t);
    const fgHSL = rgbToHsl(fgR, fgG, fgB);

    for (let i = 0; i < d.length; i += 4) {
      const hsl = rgbToHsl(d[i], d[i + 1], d[i + 2]);
      // hsl is [0-360, 0-100, 0-100], normalize to [0-1] for distance calc
      const hDiff = Math.min(Math.abs(hsl[0] - fgHSL[0]), 360 - Math.abs(hsl[0] - fgHSL[0])) / 360;
      const sDiff = Math.abs(hsl[1] - fgHSL[1]) / 100;
      const lDiff = Math.abs(hsl[2] - fgHSL[2]) / 100;
      const dist = (hDiff + sDiff * 0.3 + lDiff * 0.1) / (1 + 0.3 + 0.1);

      let alpha = Math.max(0, 1 - dist / (tolerance || 0.01));
      alpha = Math.min(1, alpha);

      if (refine > 0 && alpha > 0.1 && alpha < 0.9) {
        alpha = alpha < 0.5 ? Math.pow(alpha, 1 + refine) : 1 - Math.pow(1 - alpha, 1 + refine);
      }

      d[i] = Math.round(d[i] * alpha);
      d[i + 1] = Math.round(d[i + 1] * alpha);
      d[i + 2] = Math.round(d[i + 2] * alpha);
      d[i + 3] = Math.round(alpha * 255);
    }
  } else if (mode === 'bg') {
    for (let i = 0; i < d.length; i += 4) {
      const lum = getLuminance(d[i], d[i + 1], d[i + 2]);
      const alpha = Math.max(0, 1 - (lum < 0.1 || lum > 0.9 ? 0 : 1 - tolerance * 0.5));
      d[i] = Math.round(d[i] * alpha);
      d[i + 1] = Math.round(d[i + 1] * alpha);
      d[i + 2] = Math.round(d[i + 2] * alpha);
      d[i + 3] = Math.round(alpha * 255);
    }
  }

  c.putImageData(imgData, 0, 0);
}
