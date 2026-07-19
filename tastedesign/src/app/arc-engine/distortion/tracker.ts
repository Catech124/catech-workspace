// tracker.ts — Tracker node (passthrough)
// ARC Engine
// Renders the input unchanged. The overlay (crosshair + tracking path) is drawn by node-viewer.js.
// This node exists to hold tracker data props and expose them to the viewer.

import type { NodeRenderContext } from '../recipe';

export function renderTracker(ctx: NodeRenderContext): void {
  const { ctx: c, inputs } = ctx;
  const source = inputs[0];
  if (!source) { return; }
  c.drawImage(source, 0, 0);
}
