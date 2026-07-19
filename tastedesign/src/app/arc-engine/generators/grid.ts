// grid.ts — Grid node renderer
// ARC Video Editor — Toolcraft Integration
//
// Cuadrícula personalizable con fill modes: none, solid (ajedrez), stripe
// Props: columns, rows, gap, fillMode, fillColors, bg, lineWidth, lineColor
//
// Fixes aplicados:
//   - Eliminado strokeRect redundante (G10) — las últimas líneas ya dibujan el borde

import type { NodeRenderContext } from '../recipe';
import { evalPropA } from '../sources/shared/prop-utils';

export function renderGrid(ctx: NodeRenderContext): void {
  const { ctx: c, props, W, H, channels, modifiers, t, nodeId } = ctx;
  const columns = Math.round(evalPropA(nodeId, 'columns', 8, channels, modifiers, t));
  const rows = Math.round(evalPropA(nodeId, 'rows', 6, channels, modifiers, t));
  const gap = evalPropA(nodeId, 'gap', 2, channels, modifiers, t);
  const fillMode = (props.fillMode as string) || 'none';
  const fillColors = (props.fillColors as string) || '#ffffff,#333333';
  const bg = (props.bg as string) || '#000000';
  const lineWidth = evalPropA(nodeId, 'lineWidth', 1, channels, modifiers, t);
  const lineColor = (props.lineColor as string) || '#666666';

  const nCols = Math.max(1, columns);
  const nRows = Math.max(1, rows);
  const colors = fillColors.split(',').map(s => s.trim());

  // Background
  c.fillStyle = bg;
  c.fillRect(0, 0, W, H);

  const cellW = (W - gap * (nCols + 1)) / nCols;
  const cellH = (H - gap * (nRows + 1)) / nRows;

  for (let r = 0; r < nRows; r++) {
    for (let col = 0; col < nCols; col++) {
      const x = gap + col * (cellW + gap);
      const y = gap + r * (cellH + gap);

      // Fill based on mode
      if (fillMode === 'solid' || fillMode === 'stripe') {
        const colorIdx = fillMode === 'solid'
          ? (r + col) % colors.length
          : r % colors.length;
        c.fillStyle = colors[colorIdx] || '#fff';
        c.fillRect(x, y, cellW, cellH);
      }

      // Draw cell border (Fix G10: no redundant strokeRect — this IS the border)
      c.strokeStyle = lineColor;
      c.lineWidth = lineWidth;
      c.strokeRect(x, y, cellW, cellH);
    }
  }
}
