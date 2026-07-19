// color-utils.ts — Shared color utilities for ARC Engine effects
// ARC Video Editor — Toolcraft Integration
//
// Conversiones HSL y applyColorGrade compartidas entre colorgrade,
// hue-saturation, color-curves, keyers, etc.

/**
 * Convert RGB [0-255] to HSL [0-360, 0-100, 0-100]
 */
export function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, Math.round(l * 100)];

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) * 60;
  else if (max === gn) h = ((bn - rn) / d + 2) * 60;
  else h = ((rn - gn) / d + 4) * 60;

  return [Math.round(h), Math.round(s * 100), Math.round(l * 100)];
}

/**
 * Convert HSL [0-360, 0-100, 0-100] to RGB [0-255]
 */
export function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const hn = h / 360, sn = s / 100, ln = l / 100;
  if (sn === 0) {
    const v = Math.round(ln * 255);
    return [v, v, v];
  }

  const hue2rgb = (p: number, q: number, t: number): number => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };

  const q = ln < 0.5 ? ln * (1 + sn) : ln + sn - ln * sn;
  const p = 2 * ln - q;
  return [
    Math.round(hue2rgb(p, q, hn + 1 / 3) * 255),
    Math.round(hue2rgb(p, q, hn) * 255),
    Math.round(hue2rgb(p, q, hn - 1 / 3) * 255),
  ];
}

/**
 * Get luminance from RGB [0-255] values.
 * Returns value in range [0, 1].
 */
export function getLuminance(r: number, g: number, b: number): number {
  return (r * 0.299 + g * 0.587 + b * 0.114) / 255;
}

/**
 * Apply color grade to a single RGB pixel.
 * brightness (0-2), contrast (0-2), saturation (0-2), hue (-180 to 180)
 */
export function applyColorGrade(
  r: number, g: number, b: number,
  brightness: number,
  contrast: number,
  saturate: number,
  hue: number,
): [number, number, number] {
  let nr = r, ng = g, nb = b;

  // Brightness
  if (brightness !== 1) {
    nr *= brightness;
    ng *= brightness;
    nb *= brightness;
  }

  // Contrast
  if (contrast !== 1) {
    nr = (nr - 128) * contrast + 128;
    ng = (ng - 128) * contrast + 128;
    nb = (nb - 128) * contrast + 128;
  }

  // Saturation + Hue via HSL
  if (saturate !== 1 || hue !== 0) {
    let [h, s, l] = rgbToHsl(
      Math.max(0, Math.min(255, Math.round(nr))),
      Math.max(0, Math.min(255, Math.round(ng))),
      Math.max(0, Math.min(255, Math.round(nb))),
    );
    h = ((h + hue) % 360 + 360) % 360;
    s = Math.max(0, Math.min(100, s * saturate));
    [nr, ng, nb] = hslToRgb(h, s, l);
  }

  return [
    Math.max(0, Math.min(255, Math.round(nr))),
    Math.max(0, Math.min(255, Math.round(ng))),
    Math.max(0, Math.min(255, Math.round(nb))),
  ];
}
