// merge.ts — Merge: 2-input compositing with transform, blend mode, and mask
// ARC Engine

import type { NodeRenderContext } from '../recipe';
import { evalPropA } from '../sources/shared/prop-utils';

export function renderMerge(ctx: NodeRenderContext): void {
  const { ctx: c, props, W, H, inputs, channels, modifiers, t, nodeId } = ctx;
  const bg = inputs[0];
  const fg = inputs[1];

  // Draw background first
  if (bg) c.drawImage(bg, 0, 0);
  if (!fg) return;

  const mode = (props.mode as string) || 'source-over';
  const blend = evalPropA(nodeId, 'blend', (props.blend as number) ?? 1, channels, modifiers, t);
  const gain = evalPropA(nodeId, 'gain', (props.gain as number) ?? 1, channels, modifiers, t);
  const centerX = evalPropA(nodeId, 'centerX', (props.centerX as number) ?? 0, channels, modifiers, t);
  const centerY = evalPropA(nodeId, 'centerY', (props.centerY as number) ?? 0, channels, modifiers, t);
  const size = evalPropA(nodeId, 'size', (props.size as number) ?? 1, channels, modifiers, t);
  const angle = evalPropA(nodeId, 'angle', (props.angle as number) ?? 0, channels, modifiers, t) * Math.PI / 180;

  const alpha = Math.max(0, Math.min(1, blend * gain));
  const hw = W / 2, hh = H / 2;

  c.save();
  c.globalAlpha = alpha;
  c.globalCompositeOperation = mode as GlobalCompositeOperation;

  // Single setTransform for translate(center) + rotate + scale + translate(-center)
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const s = size;
  c.setTransform(
    s * cos, s * sin,
    -s * sin, s * cos,
    hw + centerX - s * cos * hw + s * sin * hh,
    hh + centerY - s * sin * hw - s * cos * hh,
  );

  // Mask support: if we have a mask input (accessed via ctx's maskCanvas property)
  // For now, we handle mask via a simplified approach: direct drawImage
  c.drawImage(fg, 0, 0);

  c.restore();

  // Reset global state
  c.globalAlpha = 1;
  c.globalCompositeOperation = 'source-over';
  c.setTransform(1, 0, 0, 1, 0, 0);
}
