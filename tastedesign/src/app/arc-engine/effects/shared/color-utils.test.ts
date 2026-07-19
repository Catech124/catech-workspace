// color-utils.test.ts — Unit tests for shared color utilities
import { describe, expect, it } from "vitest";
import {
  rgbToHsl,
  hslToRgb,
  getLuminance,
  applyColorGrade,
} from "./color-utils";

describe("rgbToHsl", () => {
  it("converts pure red", () => {
    const [h, s, l] = rgbToHsl(255, 0, 0);
    expect(h).toBe(0);
    expect(s).toBe(100);
    expect(l).toBe(50);
  });

  it("converts pure green", () => {
    const [h, s, l] = rgbToHsl(0, 255, 0);
    expect(h).toBe(120);
    expect(s).toBe(100);
    expect(l).toBe(50);
  });

  it("converts pure blue", () => {
    const [h, s, l] = rgbToHsl(0, 0, 255);
    expect(h).toBe(240);
    expect(s).toBe(100);
    expect(l).toBe(50);
  });

  it("converts white", () => {
    const [, s, l] = rgbToHsl(255, 255, 255);
    expect(s).toBe(0);
    expect(l).toBe(100);
  });

  it("converts black", () => {
    const [, s, l] = rgbToHsl(0, 0, 0);
    expect(s).toBe(0);
    expect(l).toBe(0);
  });

  it("converts mid-gray", () => {
    const [, s, l] = rgbToHsl(128, 128, 128);
    expect(s).toBe(0);
    expect(l).toBe(50);
  });

  it("converts pure yellow", () => {
    const [h, s, l] = rgbToHsl(255, 255, 0);
    expect(h).toBe(60);
    expect(s).toBe(100);
    expect(l).toBe(50);
  });

  it("converts pure cyan", () => {
    const [h, s, l] = rgbToHsl(0, 255, 255);
    expect(h).toBe(180);
    expect(s).toBe(100);
    expect(l).toBe(50);
  });

  it("converts pure magenta", () => {
    const [h, s, l] = rgbToHsl(255, 0, 255);
    expect(h).toBe(300);
    expect(s).toBe(100);
    expect(l).toBe(50);
  });
});

describe("hslToRgb", () => {
  it("converts red back", () => {
    const [r, g, b] = hslToRgb(0, 100, 50);
    expect(r).toBe(255);
    expect(g).toBe(0);
    expect(b).toBe(0);
  });

  it("converts green back", () => {
    const [r, g, b] = hslToRgb(120, 100, 50);
    expect(r).toBe(0);
    expect(g).toBe(255);
    expect(b).toBe(0);
  });

  it("converts blue back", () => {
    const [r, g, b] = hslToRgb(240, 100, 50);
    expect(r).toBe(0);
    expect(g).toBe(0);
    expect(b).toBe(255);
  });

  it("converts white", () => {
    const [r, g, b] = hslToRgb(0, 0, 100);
    expect(r).toBe(255);
    expect(g).toBe(255);
    expect(b).toBe(255);
  });

  it("converts black", () => {
    const [r, g, b] = hslToRgb(0, 0, 0);
    expect(r).toBe(0);
    expect(g).toBe(0);
    expect(b).toBe(0);
  });

  it("roundtrip: rgb -> hsl -> rgb should be identity for exact values", () => {
    // Pure RGB primaries and grays roundtrip exactly
    const testCases: [number, number, number][] = [
      [255, 0, 0],
      [0, 255, 0],
      [0, 0, 255],
      [255, 255, 0],
      [0, 255, 255],
      [255, 0, 255],
      [0, 0, 0],
      [255, 255, 255],
      [128, 128, 128],
    ];
    for (const [r, g, b] of testCases) {
      const [h, s, l] = rgbToHsl(r, g, b);
      const [rr, gg, bb] = hslToRgb(h, s, l);
      expect(rr).toBe(r);
      expect(gg).toBe(g);
      expect(bb).toBe(b);
    }
  });

  it("roundtrip: non-primary colors may have ±2 rounding error", () => {
    // HSL conversion involves multiple Math.round() calls, so lossy
    // Some colors like (128,64,32) can drift by up to 2 due to accumulated rounding
    const testCases: [number, number, number][] = [
      [128, 64, 32],
      [200, 100, 50],
      [30, 150, 200],
      [10, 20, 30],
    ];
    for (const [r, g, b] of testCases) {
      const [h, s, l] = rgbToHsl(r, g, b);
      const [rr, gg, bb] = hslToRgb(h, s, l);
      // Allow ±2 rounding per channel due to integer rounding in HSL
      expect(Math.abs(rr - r)).toBeLessThanOrEqual(2);
      expect(Math.abs(gg - g)).toBeLessThanOrEqual(2);
      expect(Math.abs(bb - b)).toBeLessThanOrEqual(2);
    }
  });
});

describe("getLuminance", () => {
  it("black is 0", () => {
    expect(getLuminance(0, 0, 0)).toBe(0);
  });

  it("white is 1", () => {
    expect(getLuminance(255, 255, 255)).toBeCloseTo(1, 3);
  });

  it("is weighted: green > red > blue", () => {
    const lumR = getLuminance(255, 0, 0);
    const lumG = getLuminance(0, 255, 0);
    const lumB = getLuminance(0, 0, 255);
    expect(lumG).toBeGreaterThan(lumR);
    expect(lumR).toBeGreaterThan(lumB);
  });

  it("mid-gray 50%", () => {
    expect(getLuminance(128, 128, 128)).toBeCloseTo(0.5, 1);
  });
});

describe("applyColorGrade", () => {
  it("identity (no change)", () => {
    const [r, g, b] = applyColorGrade(100, 150, 200, 1, 1, 1, 0);
    expect(r).toBe(100);
    expect(g).toBe(150);
    expect(b).toBe(200);
  });

  it("brightness: 2x", () => {
    const [r, g, b] = applyColorGrade(50, 50, 50, 2, 1, 1, 0);
    expect(r).toBe(100);
    expect(g).toBe(100);
    expect(b).toBe(100);
  });

  it("brightness: 0.5x", () => {
    const [r, g, b] = applyColorGrade(200, 200, 200, 0.5, 1, 1, 0);
    expect(r).toBe(100);
    expect(g).toBe(100);
    expect(b).toBe(100);
  });

  it("contrast: 2x stretches around 128", () => {
    const [r, g, b] = applyColorGrade(100, 128, 150, 1, 2, 1, 0);
    // (100-128)*2+128 = 72  → clamped
    // (128-128)*2+128 = 128
    // (150-128)*2+128 = 172
    expect(r).toBe(72);
    expect(g).toBe(128);
    expect(b).toBe(172);
  });

  it("saturation: 0 gives gray", () => {
    const [r, g, b] = applyColorGrade(255, 0, 0, 1, 1, 0, 0);
    // Saturation 0: goes through HSL, s*0 = 0
    expect(r).toBe(g);
    expect(g).toBe(b);
  });

  it("hue shift: +120° turns red into green", () => {
    const [r, g, b] = applyColorGrade(255, 0, 0, 1, 1, 1, 120);
    expect(g).toBeGreaterThan(r);
    expect(g).toBeGreaterThan(b);
  });

  it("clamps values to [0, 255]", () => {
    const [r, g, b] = applyColorGrade(300, -50, 1000, 1, 1, 1, 0);
    expect(r).toBe(255);
    expect(g).toBe(0);
    expect(b).toBe(255);
  });
});
