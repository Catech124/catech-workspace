// procedural-shapes.ts — Procedural Shapes node renderer
// ARC Video Editor — Toolcraft Integration
//
// Generador de formas animadas flotantes con seeded random.
// Props: count, sizeMin, sizeMax, opacity, speed, seed, shapeTypes, fillMode, palette

import type { NodeRenderContext } from '../recipe';
import { evalPropA } from '../sources/shared/prop-utils';

// Seeded PRNG (constants, not redeclared per frame — Fix G15)
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

export function renderProceduralShapes(ctx: NodeRenderContext): void {
  const { ctx: c, props, W, H, channels, modifiers, t, nodeId } = ctx;
  const count = Math.round(evalPropA(nodeId, 'count', 50, channels, modifiers, t));
  const sizeMin = evalPropA(nodeId, 'sizeMin', 15, channels, modifiers, t);
  const sizeMax = evalPropA(nodeId, 'sizeMax', 100, channels, modifiers, t);
  const opacity = evalPropA(nodeId, 'opacity', 0.85, channels, modifiers, t);
  const speed = evalPropA(nodeId, 'speed', 1.0, channels, modifiers, t);
  const seedNum = evalPropA(nodeId, 'seed', 42, channels, modifiers, t);
  const shapeTypes = (props.shapeTypes as string) || 'circle,ellipse,rect,square';
  const fillMode = (props.fillMode as string) || 'fill';
  const palette = (props.palette as string) || '#e53170,#f9a826,#00c9a7,#ff6b6b,#54a0ff';

  const types = shapeTypes.split(',').map((s: string) => s.trim());
  const colors = palette.split(',').map((s: string) => s.trim());
  const n = Math.max(1, Math.min(200, count));

  // Draw subtle background grid
  c.fillStyle = '#1a1a1a';
  c.fillRect(0, 0, W, H);
  c.strokeStyle = '#2a2a2a';
  c.lineWidth = 0.5;
  for (let x = 0; x < W; x += 60) {
    c.beginPath(); c.moveTo(x, 0); c.lineTo(x, H); c.stroke();
  }
  for (let y = 0; y < H; y += 60) {
    c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke();
  }

  // Generate shapes with deterministic seeding
  const rng = seededRandom(seedNum);

  for (let i = 0; i < n; i++) {
    const rx = rng();
    const ry = rng();
    const rz = rng();
    const rw = rng();
    const rv = rng();

    const x = rx * W;
    const y = ry * H;
    const size = sizeMin + rz * (sizeMax - sizeMin);
    const shapeType = types[Math.floor(rw * types.length)];
    const color = colors[Math.floor(rv * colors.length)];

    // Animation: floating + breathing + rotation
    const floatX = Math.sin(t * speed * 0.5 + i * 1.7) * 30;
    const floatY = Math.cos(t * speed * 0.3 + i * 2.3) * 30;
    const breath = 0.8 + 0.2 * Math.sin(t * speed + i);
    const rot = (t * speed * 20 + i * 45) % 360;

    c.save();
    c.translate(x + floatX, y + floatY);
    c.rotate((rot * Math.PI) / 180);
    c.globalAlpha = opacity * (0.5 + 0.5 * Math.sin(t * speed + i * 0.7));

    const s = size * breath;

    if (fillMode === 'fill' || fillMode === 'both') {
      c.fillStyle = color;
    }
    if (fillMode === 'stroke' || fillMode === 'both') {
      c.strokeStyle = color;
      c.lineWidth = 2;
    }

    switch (shapeType) {
      case 'circle':
        c.beginPath();
        c.arc(0, 0, s / 2, 0, Math.PI * 2);
        if (fillMode === 'fill' || fillMode === 'both') c.fill();
        if (fillMode === 'stroke' || fillMode === 'both') c.stroke();
        break;
      case 'ellipse':
        c.beginPath();
        c.ellipse(0, 0, s / 2, s / 3, 0, 0, Math.PI * 2);
        if (fillMode === 'fill' || fillMode === 'both') c.fill();
        if (fillMode === 'stroke' || fillMode === 'both') c.stroke();
        break;
      case 'rect':
      case 'square':
        if (fillMode === 'fill' || fillMode === 'both') c.fillRect(-s / 2, -s / 2, s, s);
        if (fillMode === 'stroke' || fillMode === 'both') c.strokeRect(-s / 2, -s / 2, s, s);
        break;
    }

    c.restore();
  }
}
