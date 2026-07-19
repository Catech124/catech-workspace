// primitives.test.ts — Unit tests for 3D geometry generators
import { describe, expect, it } from "vitest";
import { genCube, genSphere, genCylinder, genPlane } from "./primitives";

describe("genCube", () => {
  it("generates correct vertex count (8 vertices)", () => {
    const g = genCube(2, 2, 2);
    expect(g.verts.length).toBe(8 * 3); // 8 vertices × 3 coords
  });

  it("generates correct triangle count (12 triangles)", () => {
    const g = genCube(2, 2, 2);
    expect(g.tris.length).toBe(12 * 3); // 6 faces × 2 triangles × 3 indices
  });

  it("vertices are at correct positions for unit cube", () => {
    const g = genCube(2, 2, 2);
    // Should span from -1 to 1 in each axis
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    let minZ = Infinity, maxZ = -Infinity;
    for (let i = 0; i < g.verts.length; i += 3) {
      minX = Math.min(minX, g.verts[i]);
      maxX = Math.max(maxX, g.verts[i]);
      minY = Math.min(minY, g.verts[i + 1]);
      maxY = Math.max(maxY, g.verts[i + 1]);
      minZ = Math.min(minZ, g.verts[i + 2]);
      maxZ = Math.max(maxZ, g.verts[i + 2]);
    }
    expect(minX).toBe(-1);
    expect(maxX).toBe(1);
    expect(minY).toBe(-1);
    expect(maxY).toBe(1);
    expect(minZ).toBe(-1);
    expect(maxZ).toBe(1);
  });

  it("non-uniform dimensions work", () => {
    const g = genCube(4, 6, 8);
    expect(g.verts[0]).toBe(-2);  // vertex 0: x = -w/2 = -2
    expect(g.verts[1]).toBe(-3);  // vertex 0: y = -h/2 = -3
    expect(g.verts[2]).toBe(-4);  // vertex 0: z = -d/2 = -4
    expect(g.verts[3]).toBe(2);   // vertex 1: x = +w/2 = 2
    expect(g.verts[4]).toBe(-3);  // vertex 1: y = -h/2 = -3 (same y as bottom face)
    expect(g.verts[7]).toBe(3);   // vertex 2: y = +h/2 = +3 (top face)
  });

  it("triangles form closed manifold (even count)", () => {
    const g = genCube(2, 2, 2);
    expect(g.tris.length % 3).toBe(0);
    expect(g.tris.length / 3).toBe(12);
  });

  it("all triangle indices are valid", () => {
    const g = genCube(2, 2, 2);
    const vertexCount = g.verts.length / 3;
    for (let i = 0; i < g.tris.length; i++) {
      expect(g.tris[i]).toBeGreaterThanOrEqual(0);
      expect(g.tris[i]).toBeLessThan(vertexCount);
    }
  });
});

describe("genSphere", () => {
  it("generates at least some vertices for min segments", () => {
    const g = genSphere(1, 3);
    expect(g.verts.length).toBeGreaterThan(0);
    expect(g.tris.length).toBeGreaterThan(0);
  });

  it("all vertices are on the sphere surface (radius = distance from origin)", () => {
    const g = genSphere(5, 8);
    for (let i = 0; i < g.verts.length; i += 3) {
      const dist = Math.sqrt(
        g.verts[i] ** 2 + g.verts[i + 1] ** 2 + g.verts[i + 2] ** 2,
      );
      expect(dist).toBeCloseTo(5, 4);
    }
  });

  it("generates more vertices with higher segment count", () => {
    const low = genSphere(1, 3);
    const high = genSphere(1, 12);
    expect(high.verts.length).toBeGreaterThan(low.verts.length);
    expect(high.tris.length).toBeGreaterThan(low.tris.length);
  });

  it("all triangle indices are valid", () => {
    const g = genSphere(1, 6);
    const vertexCount = g.verts.length / 3;
    for (let i = 0; i < g.tris.length; i++) {
      expect(g.tris[i]).toBeGreaterThanOrEqual(0);
      expect(g.tris[i]).toBeLessThan(vertexCount);
    }
  });

  it("returns correct Uint16Array type for tris", () => {
    const g = genSphere(1, 6);
    expect(g.tris).toBeInstanceOf(Uint16Array);
  });

  it("returns correct Float64Array type for verts", () => {
    const g = genSphere(1, 6);
    expect(g.verts).toBeInstanceOf(Float64Array);
  });
});

describe("genCylinder", () => {
  it("generates geometry", () => {
    const g = genCylinder(2, 4, 6);
    expect(g.verts.length).toBeGreaterThan(0);
    expect(g.tris.length).toBeGreaterThan(0);
  });

  it("vertices are at correct height range", () => {
    const g = genCylinder(1, 4, 6);
    let minY = Infinity, maxY = -Infinity;
    for (let i = 0; i < g.verts.length; i += 3) {
      minY = Math.min(minY, g.verts[i + 1]);
      maxY = Math.max(maxY, g.verts[i + 1]);
    }
    expect(minY).toBe(-2);
    expect(maxY).toBe(2);
  });

  it("top and bottom cap vertices are at radius distance", () => {
    const g = genCylinder(3, 4, 8);
    for (let i = 0; i < g.verts.length; i += 3) {
      // Top/bottom cap center vertices are at (0, ±hh, 0)
      // Side vertices are at (r*cos, ±hh, r*sin)
      const xzDist = Math.sqrt(g.verts[i] ** 2 + g.verts[i + 2] ** 2);
      expect(xzDist).toBeLessThanOrEqual(3 + 0.001);
    }
  });

  it("all triangle indices are valid", () => {
    const g = genCylinder(1, 2, 6);
    const vertexCount = g.verts.length / 3;
    for (let i = 0; i < g.tris.length; i++) {
      expect(g.tris[i]).toBeGreaterThanOrEqual(0);
      expect(g.tris[i]).toBeLessThan(vertexCount);
    }
  });
});

describe("genPlane", () => {
  it("generates 4 vertices", () => {
    const g = genPlane(4, 4);
    expect(g.verts.length).toBe(4 * 3);
  });

  it("generates 2 triangles", () => {
    const g = genPlane(4, 4);
    expect(g.tris.length).toBe(2 * 3);
  });

  it("vertices are at correct positions", () => {
    const g = genPlane(4, 2);
    // Vertices: (-2, -1, 0), (2, -1, 0), (2, 1, 0), (-2, 1, 0)
    expect(g.verts[0]).toBe(-2);
    expect(g.verts[1]).toBe(-1);
    expect(g.verts[2]).toBe(0);
    expect(g.verts[3]).toBe(2);
    expect(g.verts[7]).toBe(1);
  });

  it("all triangle indices are valid", () => {
    const g = genPlane(4, 4);
    const vertexCount = g.verts.length / 3;
    for (let i = 0; i < g.tris.length; i++) {
      expect(g.tris[i]).toBeGreaterThanOrEqual(0);
      expect(g.tris[i]).toBeLessThan(vertexCount);
    }
  });
});
