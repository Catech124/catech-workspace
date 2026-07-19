// glow.ts — Unified Glow + Soft Glow effect
// ARC Engine
// Combines the old glow and soft-glow into one effect with quality parameter

import type { NodeRenderContext } from '../recipe';
import { evalPropA } from '../sources/shared/prop-utils';
import { gaussianBlurSepia } from './shared/blur';
import { getLuminance } from './shared/color-utils';

export function renderGlow(ctx: NodeRenderContext): void {
  const { ctx: c, props, W, H, inputs, channels, modifiers, t, nodeId } = ctx;
  const source = inputs[0];
  if (!source) return;

  const brightness = evalPropA(nodeId, 'brightness', (props.brightness as number) ?? 1, channels, modifiers, t);
  const threshold = evalPropA(nodeId, 'threshold', (props.threshold as number) ?? 0.3, channels, modifiers, t);
  const radius = evalPropA(nodeId, 'radius', (props.radius as number) ?? 10, channels, modifiers, t);
  const quality = evalPropA(nodeId, 'quality', (props.quality as number) ?? 0, channels, modifiers, t);
  const color = (props.color as string) ?? '#ffffff';
  const mix = evalPropA(nodeId, 'mix', (props.mix as number) ?? 1, channels, modifiers, t);

  // Step 1: Source to brightCanvas
  c.drawImage(source, 0, 0);
  const srcData = c.getImageData(0, 0, W, H);
  const d = srcData.data;

  for (let i = 0; i < d.length; i += 4) {
    const lum = getLuminance(d[i], d[i + 1], d[i + 2]);
    const scaled = Math.max(0, lum - threshold) / (1 - threshold || 1);
    const alpha = scaled * brightness;
    d[i] = Math.round(d[i] * alpha);
    d[i + 1] = Math.round(d[i + 1] * alpha);
    d[i + 2] = Math.round(d[i + 2] * alpha);
    d[i + 3] = Math.round(d[i + 3] * alpha);
  }
  c.putImageData(srcData, 0, 0);

  // Step 2: Blur the bright areas (in-place on ctx's canvas)
  const blurPasses = quality > 0.5 ? 3 : 2;
  const blurRadius = Math.max(1, Math.round(radius));

  let blurredSrc = c.getImageData(0, 0, W, H);
  for (let pass = 0; pass < blurPasses; pass++) {
    blurredSrc = gaussianBlurSepia(blurredSrc, W, H, blurRadius);
  }

  // Step 3: Color the glow pixels and composite onto source
  const glowR = hexR(color), glowG = hexG(color), glowB = hexB(color);
  const cData = blurredSrc.data;
  for (let i = 0; i < cData.length; i += 4) {
    const a = cData[i + 3] / 255;
    cData[i] = Math.round(glowR * a + cData[i] * (1 - a));
    cData[i + 1] = Math.round(glowG * a + cData[i + 1] * (1 - a));
    cData[i + 2] = Math.round(glowB * a + cData[i + 2] * (1 - a));
  }

  // Step 4: Composite with original (manual blend since putImageData ignores globalAlpha)
  c.drawImage(source, 0, 0);
  const outData = c.getImageData(0, 0, W, H);
  const out = outData.data;
  const glow = blurredSrc.data;
  for (let i = 0; i < out.length; i += 4) {
    const ga = glow[i + 3] / 255 * mix;
    if (ga <= 0) continue;
    out[i]     = Math.round(glow[i] * ga + out[i] * (1 - ga));
    out[i + 1] = Math.round(glow[i + 1] * ga + out[i + 1] * (1 - ga));
    out[i + 2] = Math.round(glow[i + 2] * ga + out[i + 2] * (1 - ga));
    out[i + 3] = Math.min(255, out[i + 3] + Math.round(glow[i + 3] * ga));
  }
  c.putImageData(outData, 0, 0);
}

// Inline hex helpers (lighter than importing from shared)
function hexR(h: string): number { const c = h.replace('#', ''); return parseInt((c.length === 3 ? c[0]+c[0] : c.substring(0,2)), 16) || 255; }
function hexG(h: string): number { const c = h.replace('#', ''); return parseInt((c.length === 3 ? c[1]+c[1] : c.substring(2,4)), 16) || 255; }
function hexB(h: string): number { const c = h.replace('#', ''); return parseInt((c.length === 3 ? c[2]+c[2] : c.substring(4,6)), 16) || 255; }
