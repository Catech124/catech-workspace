// transform.ts — Transform: scale, rotate, translate
// ARC Engine

import type { NodeRenderContext } from '../recipe';
import { evalPropA } from '../sources/shared/prop-utils';

export function renderTransform(ctx: NodeRenderContext): void {
  const { ctx: c, props, W, H, inputs, channels, modifiers, t, nodeId } = ctx;
  const source = inputs[0];
  if (!source) return;

  const centerX = evalPropA(nodeId, 'centerX', (props.centerX as number) ?? 0, channels, modifiers, t);
  const centerY = evalPropA(nodeId, 'centerY', (props.centerY as number) ?? 0, channels, modifiers, t);
  const size = evalPropA(nodeId, 'size', (props.size as number) ?? 1, channels, modifiers, t);
  const angle = evalPropA(nodeId, 'angle', (props.angle as number) ?? 0, channels, modifiers, t) * Math.PI / 180;

  const hw = W / 2, hh = H / 2;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const s = size;

  c.save();
  c.setTransform(
    s * cos, s * sin,
    -s * sin, s * cos,
    hw + centerX - s * cos * hw + s * sin * hh,
    hh + centerY - s * sin * hw - s * cos * hh,
  );
  c.drawImage(source, 0, 0);
  c.restore();
  c.setTransform(1, 0, 0, 1, 0, 0);
}
