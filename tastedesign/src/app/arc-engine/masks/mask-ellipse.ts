// mask-ellipse.ts — Ellipse Mask (garbage matte)
// ARC Engine
// Thin wrapper around shared/mask-utils generateShapeMask()

import type { NodeRenderContext } from '../recipe';
import { generateShapeMask } from './shared/mask-utils';

export function renderMaskEllipse(ctx: NodeRenderContext): void {
  const { ctx: c, props, W, H } = ctx;
  const cx = (props.cx as number) ?? W / 2;
  const cy = (props.cy as number) ?? H / 2;
  const rx = (props.rx as number) ?? W / 4;
  const ry = (props.ry as number) ?? H / 4;
  const softEdge = (props.softEdge as number) ?? 0;
  const invert = !!(props.invert as boolean);

  const mask = generateShapeMask('ellipse', { cx, cy, rx, ry, softEdge, invert }, W, H);
  c.drawImage(mask, 0, 0);
}
