// lighting.test.ts — Unit tests for 3D lighting
import { describe, expect, it } from "vitest";
import { computeNormal, computeLighting } from "./lighting";

describe("computeNormal", () => {
  it("computes normal for XY plane triangle", () => {
    // Triangle on XY plane: Z should be 1
    const [, , nz] = computeNormal(0, 0, 0, 1, 0, 0, 0, 1, 0);
    // Cross product of (1,0,0) × (0,1,0) = (0,0,1)
    expect(nz).toBeCloseTo(1, 5);
  });

  it("computes normal for YZ plane triangle", () => {
    const [nx, , ] = computeNormal(0, 0, 0, 0, 1, 0, 0, 0, 1);
    // Cross product of (0,1,0) × (0,0,1) = (1,0,0)
    expect(nx).toBeCloseTo(1, 5);
  });

  it("normal has unit length", () => {
    const [nx, ny, nz] = computeNormal(0, 0, 0, 3, 1, 0, 1, 4, 0);
    const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
    expect(len).toBeCloseTo(1, 5);
  });

  it("returns [0,0,0] for degenerate triangle (colinear points)", () => {
    // All points on same line → normal computation fails
    const [nx, ny, nz] = computeNormal(0, 0, 0, 1, 1, 0, 2, 2, 0);
    // Cross product should be near zero, division by small number
    // The current implementation divides by sqrt(0.0001) minimum
    expect(nx).toBeCloseTo(0, 4);
    expect(ny).toBeCloseTo(0, 4);
    expect(nz).toBeCloseTo(0, 4);
  });

  it("normal direction follows right-hand rule", () => {
    // Triangle winding: (0,0,0) → (1,0,0) → (0,1,0) should produce +Z
    const [, , nz] = computeNormal(0, 0, 0, 1, 0, 0, 0, 1, 0);
    expect(nz).toBeGreaterThan(0);

    // Reversed winding should produce -Z
    const [, , nz2] = computeNormal(0, 0, 0, 0, 1, 0, 1, 0, 0);
    expect(nz2).toBeLessThan(0);
  });
});

describe("computeLighting", () => {
  it("full illumination when normal faces light directly", () => {
    const intensity = computeLighting(0, 0, 1, 0, 0, 1, 0.3);
    // diffuse = 1, ambient + (1-ambient)*1 = 0.3 + 0.7 = 1.0
    expect(intensity).toBe(1);
  });

  it("ambient only when normal is perpendicular to light", () => {
    const intensity = computeLighting(0, 0, 1, 1, 0, 0, 0.3);
    // diffuse = 0, ambient + (1-ambient)*0 = 0.3
    expect(intensity).toBe(0.3);
  });

  it("no light when normal faces away from light", () => {
    const intensity = computeLighting(0, 0, 1, 0, 0, -1, 0.3);
    // diffuse = max(0, -1) = 0, ambient = 0.3
    expect(intensity).toBe(0.3);
  });

  it("ambient of 0 gives no light on opposite side", () => {
    const intensity = computeLighting(0, 0, 1, 0, 0, -1, 0);
    expect(intensity).toBe(0);
  });

  it("light direction is normalized automatically", () => {
    // Unnormalized light direction (0, 0, 100) → normalized to (0, 0, 1)
    const intensity = computeLighting(0, 0, 1, 0, 0, 100, 0.2);
    expect(intensity).toBe(1);
  });

  it("normal is not normalized but provided as unit", () => {
    // If normal is already unit length, it works correctly
    const nx = 1 / Math.sqrt(3);
    const ny = 1 / Math.sqrt(3);
    const nz = 1 / Math.sqrt(3);
    const intensity = computeLighting(nx, ny, nz, 0, 0, 1, 0);
    const diff = nx * 0 + ny * 0 + nz * 1; // = 1/√3 ≈ 0.577
    expect(intensity).toBeCloseTo(diff, 4);
  });

  it("zero-length light direction falls back to ambient only", () => {
    const intensity = computeLighting(0, 0, 1, 0, 0, 0, 0.5);
    expect(intensity).toBe(0.5);
  });
});
