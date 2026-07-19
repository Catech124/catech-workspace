// text.ts — Text+ node renderer (DaVinci Resolve-style)
// ARC Video Editor — Toolcraft Integration
//
// Renders multi-line text with full formatting: write-on animation,
// shadow, outline, emphasis, and vAnchor/hAnchor positioning.
// Fusion analog: Text+
// Inputs: 0 | Outputs: 1 (Salida)
//
// Props: text, font, style, size, color, tracking, leading, alignment,
//   x, y, rotation, opacity, vAnchor/hAnchor + offset, writeOnStart/End,
//   shadow (color/blur/x/y), outline (color/width), emphasis

import type { NodeRenderContext } from '../recipe';
import { evalPropA } from './shared/prop-utils';

export function renderText(ctx: NodeRenderContext): void {
  const { ctx: c, props, W, H, channels, modifiers, t, nodeId } = ctx;

  // ── Read props with evalPropA ──
  const text = (props.text as string) || 'ARC';
  const font = (props.font as string) || 'Space Grotesk';
  const style = (props.style as string) || '700';
  const size = evalPropA(nodeId, 'size', 120, channels, modifiers, t);
  const color = (props.color as string) || '#ffffff';
  const tracking = evalPropA(nodeId, 'tracking', 0, channels, modifiers, t);
  const leading = evalPropA(nodeId, 'leading', 1.0, channels, modifiers, t);
  const alignment = (props.alignment as string) || 'center';
  const x = evalPropA(nodeId, 'x', W / 2, channels, modifiers, t);
  const y = evalPropA(nodeId, 'y', H / 2, channels, modifiers, t);
  const rotation = evalPropA(nodeId, 'rotation', 0, channels, modifiers, t);
  const opacity = evalPropA(nodeId, 'opacity', 1, channels, modifiers, t);

  const vAnchor = (props.vAnchor as string) || 'center';
  const hAnchor = (props.hAnchor as string) || 'center';
  const vAnchorOffset = evalPropA(nodeId, 'vAnchorOffset', 0, channels, modifiers, t);
  const hAnchorOffset = evalPropA(nodeId, 'hAnchorOffset', 0, channels, modifiers, t);

  const writeOnStart = evalPropA(nodeId, 'writeOnStart', 0, channels, modifiers, t);
  const writeOnEnd = evalPropA(nodeId, 'writeOnEnd', 1, channels, modifiers, t);

  const shadow = props.shadow as boolean;
  const shadowColor = (props.shadowColor as string) || '#000000';
  const shadowBlur = (props.shadowBlur as number) || 10;
  const shadowX = (props.shadowX as number) || 2;
  const shadowY = (props.shadowY as number) || 2;

  const outlineColor = (props.outlineColor as string) || '';
  const outlineWidth = (props.outlineWidth as number) || 0;

  const emphasis = (props.emphasis as string) || 'none';

  // ── Prepare text ──
  const lines = text.split('\\n');
  const fontSize = Math.max(1, size);
  const fontStr = `${style} ${fontSize}px ${font}`;
  const lineHeight = fontSize * (leading || 1.0);
  const totalTextHeight = lines.length * lineHeight;

  // ── Write-on: calculate visible chars ──
  const writeOnProgress = Math.max(0, Math.min(1, writeOnEnd));
  const writeOnStartVal = Math.max(0, Math.min(1, writeOnStart));

  // Measure each line and calculate total chars
  c.font = fontStr;
  const linesInfo = lines.map((line: string) => ({
    text: line,
    width: c.measureText(line).width,
    // Grapheme-safe split for write-on
    chars: [...line],
  }));
  const totalChars = linesInfo.reduce((sum: number, li: { chars: string[] }) => sum + li.chars.length, 0);
  const visibleChars = Math.round(totalChars * writeOnProgress);
  const startSkip = Math.round(totalChars * writeOnStartVal);

  // ── Calculate position based on anchors ──
  let posX = x;
  let posY = y;

  switch (hAnchor) {
    case 'left': posX = x + (tracking || 0); break;
    case 'right': posX = x - (tracking || 0); break;
    default: break; // center
  }
  posX += hAnchorOffset;

  switch (vAnchor) {
    case 'top': posY = y + totalTextHeight / 2; break;
    case 'bottom': posY = y - totalTextHeight / 2; break;
    default: break; // center
  }
  posY += vAnchorOffset;

  // ── Render ──
  c.save();
  c.globalAlpha = Math.max(0, opacity);

  // Apply rotation around center
  if (rotation !== 0) {
    c.translate(x, y);
    c.rotate((rotation * Math.PI) / 180);
    c.translate(-x, -y);
  }

  c.font = fontStr;
  c.textAlign = alignment as CanvasTextAlign;
  c.textBaseline = 'middle';

  let charCount = 0;
  const startY = posY - totalTextHeight / 2;

  for (let l = 0; l < linesInfo.length; l++) {
    const li = linesInfo[l];
    const lineY = startY + l * lineHeight + lineHeight / 2;

    // Calculate line-specific X based on alignment
    let lineX = posX;
    if (alignment === 'left') {
      lineX = 0;
    } else if (alignment === 'right') {
      lineX = W;
    }

    // Write-on per character
    let lineRendered = '';
    const lineEnd = charCount + li.chars.length;

    if (lineEnd <= startSkip) {
      charCount = lineEnd;
      continue;
    }

    for (let ci = 0; ci < li.chars.length; ci++) {
      const globalIdx = charCount + ci;
      if (globalIdx < startSkip) continue;
      if (globalIdx >= startSkip + visibleChars) break;
      lineRendered += li.chars[ci];
    }

    if (!lineRendered) {
      charCount = lineEnd;
      continue;
    }

    // If tracking is active, render char by char
    if (tracking !== 0) {
      let cx = lineX;
      for (const ch of lineRendered) {
        // Shadow
        if (shadow) {
          c.save();
          c.shadowColor = shadowColor;
          c.shadowBlur = shadowBlur;
          c.shadowOffsetX = shadowX;
          c.shadowOffsetY = shadowY;
          c.fillStyle = color;
          c.fillText(ch, cx, lineY);
          c.restore();
        } else if (outlineColor && outlineWidth > 0) {
          c.strokeStyle = outlineColor;
          c.lineWidth = outlineWidth;
          c.lineJoin = 'round';
          c.strokeText(ch, cx, lineY);
          c.fillStyle = color;
          c.fillText(ch, cx, lineY);
        } else {
          c.fillStyle = color;
          c.fillText(ch, cx, lineY);
        }

        // Emphasis per char
        if (emphasis === 'underline') {
          c.strokeStyle = color;
          c.lineWidth = 2;
          c.beginPath();
          c.moveTo(cx - (tracking || fontSize) / 2, lineY + fontSize / 4);
          c.lineTo(cx + (tracking || fontSize) / 2, lineY + fontSize / 4);
          c.stroke();
        } else if (emphasis === 'strikethrough') {
          c.strokeStyle = color;
          c.lineWidth = 2;
          c.beginPath();
          c.moveTo(cx - (tracking || fontSize) / 2, lineY);
          c.lineTo(cx + (tracking || fontSize) / 2, lineY);
          c.stroke();
        }

        cx += tracking || fontSize;
      }
    } else {
      // Normal render (whole line, no tracking)
      if (shadow) {
        c.save();
        c.shadowColor = shadowColor;
        c.shadowBlur = shadowBlur;
        c.shadowOffsetX = shadowX;
        c.shadowOffsetY = shadowY;
        c.fillStyle = color;
        c.fillText(lineRendered, lineX, lineY);
        c.restore();
      } else if (outlineColor && outlineWidth > 0) {
        c.strokeStyle = outlineColor;
        c.lineWidth = outlineWidth;
        c.lineJoin = 'round';
        c.strokeText(lineRendered, lineX, lineY);
        c.fillStyle = color;
        c.fillText(lineRendered, lineX, lineY);
      } else {
        c.fillStyle = color;
        c.fillText(lineRendered, lineX, lineY);
      }

      // Emphasis
      if (emphasis === 'underline') {
        const m = c.measureText(lineRendered);
        c.strokeStyle = color;
        c.lineWidth = 2;
        c.beginPath();
        c.moveTo(lineX - m.width / 2, lineY + fontSize / 4);
        c.lineTo(lineX + m.width / 2, lineY + fontSize / 4);
        c.stroke();
      } else if (emphasis === 'strikethrough') {
        const m = c.measureText(lineRendered);
        c.strokeStyle = color;
        c.lineWidth = 2;
        c.beginPath();
        c.moveTo(lineX - m.width / 2, lineY);
        c.lineTo(lineX + m.width / 2, lineY);
        c.stroke();
      }
    }

    charCount = lineEnd;
  }

  c.restore();
}
