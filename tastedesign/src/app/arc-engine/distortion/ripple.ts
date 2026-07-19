// ripple.ts — Ripple wave distortion: circular or linear
// ARC Engine

import type { NodeRenderContext } from '../recipe';
import { evalPropA } from '../sources/shared/prop-utils';
import { renderWarp } from './shared/warp-core';

export function renderRipple(ctx: NodeRenderContext): void {
  const { ctx: c, props, W, H, inputs, channels, modifiers, t, nodeId } = ctx;
  const source = inputs[0];
  if (!source) return;

  const type = (props.type as string) || 'circular';
  const amplitude = evalPropA(nodeId, 'amplitude', (props.amplitude as number) ?? 20, channels, modifiers, t);
  const frequency = evalPropA(nodeId, 'frequency', (props.frequency as number) ?? 10, channels, modifiers, t);
  const phase = evalPropA(nodeId, 'phase', (props.phase as number) ?? 0, channels, modifiers, t);
  const speed = evalPropA(nodeId, 'speed', (props.speed as number) ?? 0.5, channels, modifiers, t);
  const centerX = (props.centerX as number) ?? W / 2;
  const centerY = (props.centerY as number) ?? H / 2;
  const decay = evalPropA(nodeId, 'decay', (props.decay as number) ?? 0.5, channels, modifiers, t);

  const animPhase = phase + t * speed * Math.PI * 2;
  const cx = centerX, cy = centerY;
  const maxD = Math.sqrt(cx * cx + cy * cy);

  renderWarp(c, source, (x, y) => {
    const dx = x - cx, dy = y - cy;
    let offset: number;

    if (type === 'circular') {
      const dist = Math.sqrt(dx * dx + dy * dy);
      const decayFactor = Math.exp(-decay * dist / maxD * 10);
      offset = amplitude * Math.sin(dist * frequency / 100 + animPhase) * decayFactor;
    } else {
      // Linear: waves parallel to X axis
      const dist = Math.abs(dy);
      const decayFactor = Math.exp(-decay * dist / (H / 2) * 10);
      offset = amplitude * Math.sin((x + y) * frequency / 100 + animPhase) * decayFactor;
    }

    const sx = x + offset;
    const sy = y + offset;
    return { sx, sy };
  }, t, W, H);
}
