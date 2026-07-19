// math.test.ts — Unit tests for 3D matrix math
import { describe, expect, it } from "vitest";
import {
  mat4Identity,
  mat4Mul,
  mat4MulVec4,
  mat4RotateX,
  mat4RotateY,
  mat4RotateZ,
  mat4Translate,
  mat4Scale,
  mat4Perspective,
  mat4LookAt,
} from "./math";

describe("mat4Identity", () => {
  it("creates a 4x4 identity matrix", () => {
    const m = mat4Identity();
    expect(m).toBeInstanceOf(Float64Array);
    expect(m.length).toBe(16);
    // Identity: diagonal = 1, rest = 0
    expect(m[0]).toBe(1);
    expect(m[5]).toBe(1);
    expect(m[10]).toBe(1);
    expect(m[15]).toBe(1);
    expect(m[1]).toBe(0);
    expect(m[4]).toBe(0);
  });
});

describe("mat4Mul", () => {
  it("multiplies two identity matrices -> identity", () => {
    const a = mat4Identity();
    const b = mat4Identity();
    const c = mat4Mul(a, b);
    expect(c[0]).toBe(1);
    expect(c[5]).toBe(1);
    expect(c[10]).toBe(1);
    expect(c[15]).toBe(1);
  });

  it("identity * X = X", () => {
    const id = mat4Identity();
    const t = mat4Translate(10, 20, 30);
    const r = mat4Mul(id, t);
    expect(r[12]).toBe(10);
    expect(r[13]).toBe(20);
    expect(r[14]).toBe(30);
  });

  it("multiplication is associative but not used in isolation here", () => {
    const a = mat4Translate(1, 2, 3);
    const b = mat4Scale(2, 2, 2);
    const c = mat4Mul(a, b);
    // After a * b: translate(1,2,3) * scale(2,2,2)
    // Scale applies first, then translate: [2,0,0,1, 0,2,0,2, 0,0,2,3, 0,0,0,1]
    expect(c[0]).toBe(2);
    expect(c[5]).toBe(2);
    expect(c[10]).toBe(2);
    expect(c[12]).toBe(1);
    expect(c[13]).toBe(2);
    expect(c[14]).toBe(3);
  });
});

describe("mat4MulVec4", () => {
  it("transforms a point by translation", () => {
    const t = mat4Translate(5, 10, 15);
    const v = new Float64Array([1, 2, 3, 1]);
    const out = mat4MulVec4(t, v);
    expect(out[0]).toBe(6);
    expect(out[1]).toBe(12);
    expect(out[2]).toBe(18);
    expect(out[3]).toBe(1);
  });

  it("transforms a point by scale", () => {
    const s = mat4Scale(2, 3, 4);
    const v = new Float64Array([1, 2, 3, 1]);
    const out = mat4MulVec4(s, v);
    expect(out[0]).toBe(2);
    expect(out[1]).toBe(6);
    expect(out[2]).toBe(12);
  });
});

describe("mat4RotateX", () => {
  it("rotates (0,1,0) by 90° around X -> (0,0,1)", () => {
    const r = mat4RotateX(Math.PI / 2);
    const v = new Float64Array([0, 1, 0, 1]);
    const out = mat4MulVec4(r, v);
    expect(out[1]).toBeCloseTo(0, 5);
    expect(out[2]).toBeCloseTo(1, 5);
  });
});

describe("mat4RotateY", () => {
  it("rotates (1,0,0) by 90° around Y -> (0,0,-1)", () => {
    const r = mat4RotateY(Math.PI / 2);
    const v = new Float64Array([1, 0, 0, 1]);
    const out = mat4MulVec4(r, v);
    expect(out[0]).toBeCloseTo(0, 5);
    expect(out[2]).toBeCloseTo(-1, 5);
  });
});

describe("mat4RotateZ", () => {
  it("rotates (1,0,0) by 90° around Z -> (0,1,0)", () => {
    const r = mat4RotateZ(Math.PI / 2);
    const v = new Float64Array([1, 0, 0, 1]);
    const out = mat4MulVec4(r, v);
    expect(out[0]).toBeCloseTo(0, 5);
    expect(out[1]).toBeCloseTo(1, 5);
  });
});

describe("mat4Translate", () => {
  it("creates translation matrix with correct values", () => {
    const m = mat4Translate(100, 200, 300);
    expect(m[12]).toBe(100);
    expect(m[13]).toBe(200);
    expect(m[14]).toBe(300);
    expect(m[15]).toBe(1);
  });
});

describe("mat4Scale", () => {
  it("creates scale matrix with correct values", () => {
    const m = mat4Scale(2, 3, 4);
    expect(m[0]).toBe(2);
    expect(m[5]).toBe(3);
    expect(m[10]).toBe(4);
  });
});

describe("mat4Perspective", () => {
  it("creates perspective matrix with sensible values", () => {
    const m = mat4Perspective(90, 16 / 9, 0.1, 100);
    // m[0] = f / aspect, f = 1/tan(45°) = 1
    expect(m[0]).toBeCloseTo(1 / (16 / 9), 3);
    // m[5] = f = 1
    expect(m[5]).toBeCloseTo(1, 3);
    // m[11] = -1 (always)
    expect(m[11]).toBe(-1);
    // m[14] = 2 * near * far / (near - far) = 2 * 0.1 * 100 / (0.1 - 100)
    expect(m[14]).toBeCloseTo(2 * 0.1 * 100 / (0.1 - 100), 3);
  });

  it("returns identity for zero FOV edge case? No — FOV=0 gives tan(0)=0, f=Infinity", () => {
    // Very small FOV should give very large f
    const m = mat4Perspective(1, 1, 0.1, 100);
    expect(m[0]).toBeGreaterThan(50);
  });
});

describe("mat4LookAt", () => {
  it("returns identity when eye == target", () => {
    const m = mat4LookAt(0, 0, 0, 0, 0, 0, 0, 1, 0);
    expect(m[0]).toBe(1);
    expect(m[5]).toBe(1);
    expect(m[10]).toBe(1);
    expect(m[15]).toBe(1);
  });

  it("looks at +Z from origin → forward is -Z in camera space", () => {
    const m = mat4LookAt(0, 0, 0, 0, 0, 1, 0, 1, 0);
    // Forward = normalize(eye - target) = (0,0,-1)
    // In lookAt, row 2 = forward direction (m[8..10])
    expect(m[2]).toBeCloseTo(0, 4);
    expect(m[6]).toBeCloseTo(0, 4);
    expect(m[10]).toBeCloseTo(-1, 4); // forward.z = -1
  });

  it("looking from (0,0,5) at origin → forward is (0,0,1)", () => {
    const m = mat4LookAt(0, 0, 5, 0, 0, 0, 0, 1, 0);
    // Forward = normalize(eye - target) = (0,0,5)/5 = (0,0,1)
    expect(m[2]).toBeCloseTo(0, 4);
    expect(m[6]).toBeCloseTo(0, 4);
    expect(m[10]).toBeCloseTo(1, 4);
    expect(m[12]).toBeCloseTo(0, 4);
    expect(m[13]).toBeCloseTo(0, 4);
    expect(m[14]).toBeCloseTo(-5, 4); // -dot(forward, eye) = -(0*0 + 0*0 + 1*5) = -5
  });
});
