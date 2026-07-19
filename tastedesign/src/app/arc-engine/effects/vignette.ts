// vignette.ts — Vignette effect
// ARC Engine

import type { NodeRenderContext } from '../recipe';
import { evalPropA } from '../sources/shared/prop-utils';

export function renderVignette(ctx: NodeRenderContext): void {
  const { ctx: c, props, W, H, inputs, channels, modifiers, t, nodeId } = ctx;
  const source = inputs[0];
  if (!source) return;

  const amount = Math.max(0, Math.min(1, evalPropA(nodeId, 'amount', (props.amount as number) ?? 0.5, channels, modifiers, t)));
  const feather = Math.max(0, Math.min(1, evalPropA(nodeId, 'feather', (props.feather as number) ?? 0.5, channels, modifiers, t)));
  const roundness = Math.max(0.1, Math.min(2, evalPropA(nodeId, 'roundness', (props.roundness as number) ?? 1, channels, modifiers, t)));
  const color = (props.color as string) ?? '#000000';
  const highlight = Math.max(0, Math.min(1, evalPropA(nodeId, 'highlight', (props.highlight as number) ?? 0, channels, modifiers, t)));

  if (amount < 0.001) { c.drawImage(source, 0, 0); return; }

  c.drawImage(source, 0, 0);
  const imgData = c.getImageData(0, 0, W, H);
  const d = imgData.data;

  const cx = W / 2, cy = H / 2;
  const rx = W / 2, ry = H / 2;
  const featherInv = 1 - feather;
  const vR = hexR(color), vG = hexG(color), vB = hexB(color);

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const dx = (x - cx) / rx;
      const dy = (y - cy) / ry;
      const dist = Math.sqrt(dx * dx + (dy / roundness) * (dy / roundness));
      let falloff = Math.max(0, dist - featherInv) / (1 - featherInv || 1);
      falloff = Math.min(1, falloff * amount);
      if (falloff <= 0) continue;

      const idx = (y * W + x) * 4;
      const lum = (d[idx] * 0.299 + d[idx + 1] * 0.587 + d[idx + 2] * 0.114) / 255;
      const hl = Math.max(0, (lum - (1 - highlight)) / (highlight || 1));
      const blend = falloff * (1 - hl * 0.5);

      d[idx] = Math.round(d[idx] * (1 - blend) + vR * blend);
      d[idx + 1] = Math.round(d[idx + 1] * (1 - blend) + vG * blend);
      d[idx + 2] = Math.round(d[idx + 2] * (1 - blend) + vB * blend);
    }
  }

  c.putImageData(imgData, 0, 0);
}

function hexR(h: string): number { const c = h.replace('#', ''); return parseInt((c.length === 3 ? c[0]+c[0] : c.substring(0,2)), 16) || 0; }
function hexG(h: string): number { const c = h.replace('#', ''); return parseInt((c.length === 3 ? c[1]+c[1] : c.substring(2,4)), 16) || 0; }
function hexB(h: string): number { const c = h.replace('#', ''); return parseInt((c.length === 3 ? c[2]+c[2] : c.substring(4,6)), 16) || 0; }
