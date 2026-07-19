// corner-position.ts — Corner Positioning perspective warp
// ARC Engine
// Maps 4 corner points (tl, tr, br, bl) to a bilinear perspective transform.

import type { NodeRenderContext } from '../recipe';
import { renderWarp } from './shared/warp-core';

interface CornerPt { x: number; y: number; }

// Cache parsed points so we don't split strings every frame
let _cacheKey = '';
let _cachedPts: [CornerPt, CornerPt, CornerPt, CornerPt] = [
  { x: 0, y: 0 }, { x: 1920, y: 0 },
  { x: 1920, y: 1080 }, { x: 0, y: 1080 },
];

function parseCorner(props: Record<string, unknown>, W: number, H: number): [CornerPt, CornerPt, CornerPt, CornerPt] {
  const tl = (props.tl as string) || '0,0';
  const tr = (props.tr as string) || `${W},0`;
  const br = (props.br as string) || `${W},${H}`;
  const bl = (props.bl as string) || `0,${H}`;
  const key = `${tl}|${tr}|${br}|${bl}`;
  if (key === _cacheKey) return _cachedPts;

  const parse = (s: string): CornerPt => {
    const [sx, sy] = s.split(',').map(Number);
    return { x: isNaN(sx) ? 0 : sx, y: isNaN(sy) ? 0 : sy };
  };
  _cachedPts = [parse(tl), parse(tr), parse(br), parse(bl)];
  _cacheKey = key;
  return _cachedPts;
}

export function renderCornerPosition(ctx: NodeRenderContext): void {
  const { ctx: c, props, W, H, inputs, t } = ctx;
  const source = inputs[0];
  if (!source) return;

  const [tl, tr, br, bl] = parseCorner(props, W, H);

  renderWarp(c, source, (x, y) => {
    const u = x / W;
    const v = y / H;
    const um = 1 - u, vm = 1 - v;

    // Bilinear interpolation between the 4 corners
    const topX = tl.x * um + tr.x * u;
    const topY = tl.y * um + tr.y * u;
    const botX = bl.x * um + br.x * u;
    const botY = bl.y * um + br.y * u;

    const sx = topX * vm + botX * v;
    const sy = topY * vm + botY * v;

    return { sx, sy };
  }, t, W, H);
}
