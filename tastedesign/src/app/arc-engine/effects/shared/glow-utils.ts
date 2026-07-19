// glow-utils.ts — Shared glow utilities for ARC Engine effects
// ARC Video Editor — Toolcraft Integration
//
// Lógica de threshold → blur → tint → composite compartida entre glow y soft-glow.
// Extraída de engine-effects.js donde estaba duplicada.

/**
 * Extract bright regions from an ImageData based on luminance threshold.
 * Returns a new Uint8ClampedArray with alpha = luminance-based mask.
 */
export function extractBrightRegions(
  data: Uint8ClampedArray,
  _W: number,
  _H: number,
  threshold: number,
): Uint8ClampedArray {
  const result = new Uint8ClampedArray(data.length);
  for (let i = 0; i < data.length; i += 4) {
    const lum = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
    // Soft threshold
    const alpha = lum >= threshold * 255 ? 255
      : lum >= (threshold - 0.1) * 255 ? (lum - (threshold - 0.1) * 255) / (0.1 * 255) * 255
      : 0;
    result[i] = data[i];
    result[i + 1] = data[i + 1];
    result[i + 2] = data[i + 2];
    result[i + 3] = Math.round(alpha);
  }
  return result;
}

/**
 * Apply glow color tint to bright regions.
 * Uses screen-like composite with the original data.
 */
export function applyGlowTint(
  glowData: Uint8ClampedArray,
  color: string,
  brightness: number,
): void {
  // Parse hex color
  const h = color.replace('#', '');
  const cr = parseInt(h.substring(0, 2), 16) || 255;
  const cg = parseInt(h.substring(2, 4), 16) || 255;
  const cb = parseInt(h.substring(4, 6), 16) || 255;

  for (let i = 0; i < glowData.length; i += 4) {
    const alpha = glowData[i + 3] / 255;
    if (alpha > 0) {
      const intensity = alpha * brightness;
      glowData[i] = Math.min(255, Math.round(cr * intensity + glowData[i] * (1 - alpha)));
      glowData[i + 1] = Math.min(255, Math.round(cg * intensity + glowData[i + 1] * (1 - alpha)));
      glowData[i + 2] = Math.min(255, Math.round(cb * intensity + glowData[i + 2] * (1 - alpha)));
      glowData[i + 3] = Math.round(alpha * 255);
    }
  }
}
