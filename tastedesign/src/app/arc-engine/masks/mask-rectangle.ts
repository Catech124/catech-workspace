// mask-rectangle.ts — Rectangle Mask (garbage matte)
// ARC Engine
// Thin wrapper around shared/mask-utils generateShapeMask()

import type { NodeRenderContext } from '../recipe';
import { generateShapeMask } from './shared/mask-utils';

export function renderMaskRect(ctx: NodeRenderContext): void {
  const { ctx: c, props, W, H } = ctx;
  const x = (props.x as number) ?? 0;
  const y = (props.y as number) ?? 0;
  const w = (props.width as number) ?? W;
  const h = (props.height as number) ?? H;
  const softEdge = (props.softEdge as number) ?? 0;
  const invert = !!(props.invert as boolean);

  const mask = generateShapeMask('rectangle', { x, y, w, h, softEdge, invert }, W, H);
  c.drawImage(mask, 0, 0);
}
