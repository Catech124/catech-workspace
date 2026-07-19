// primitives.ts — 3D geometry generators: cube, sphere, cylinder, plane
// ARC Engine — Renderer 3D
// Each returns { verts: Float64Array (xyzxyz...), tris: Uint16Array (abcabc...) }

export interface Geometry {
  verts: Float64Array;  // interleaved x,y,z per vertex
  tris: Uint16Array;    // triangle indices (3 per triangle)
}

/** Generate a cube centered at origin with given width, height, depth */
export function genCube(w: number, h: number, d: number): Geometry {
  const hw = w / 2, hh = h / 2, hd = d / 2;
  const verts = new Float64Array([
    -hw, -hh, -hd,  hw, -hh, -hd,  hw, hh, -hd, -hw, hh, -hd,
    -hw, -hh,  hd,  hw, -hh,  hd,  hw, hh,  hd, -hw, hh,  hd,
  ]);
  const tris = new Uint16Array([
    0,1,2, 0,2,3,
    4,6,5, 4,7,6,
    1,5,6, 1,6,2,
    0,3,7, 0,7,4,
    3,2,6, 3,6,7,
    0,4,5, 0,5,1,
  ]);
  return { verts, tris };
}

/** Generate a sphere with given radius and segment count */
export function genSphere(radius: number, segs: number): Geometry {
  const rings = Math.max(3, segs);
  const sectors = Math.max(3, segs * 2);
  const verts: number[] = [];
  const tris: number[] = [];

  for (let r = 0; r <= rings; r++) {
    const theta = r * Math.PI / rings;
    for (let s = 0; s <= sectors; s++) {
      const phi = s * 2 * Math.PI / sectors;
      verts.push(radius * Math.sin(theta) * Math.cos(phi));
      verts.push(radius * Math.cos(theta));
      verts.push(radius * Math.sin(theta) * Math.sin(phi));
    }
  }

  for (let r = 0; r < rings; r++) {
    for (let s = 0; s < sectors; s++) {
      const a = r * (sectors + 1) + s;
      const b = a + sectors + 1;
      tris.push(a, b, a + 1);
      tris.push(b, b + 1, a + 1);
    }
  }

  return { verts: new Float64Array(verts), tris: new Uint16Array(tris) };
}

/** Generate a cylinder with given radius, height, and segment count */
export function genCylinder(radius: number, height: number, segs: number): Geometry {
  const n = Math.max(3, segs);
  const verts: number[] = [];
  const tris: number[] = [];
  const hh = height / 2;

  for (let i = 0; i < n; i++) {
    const a = i * 2 * Math.PI / n;
    verts.push(Math.cos(a) * radius, hh, Math.sin(a) * radius);
  }
  for (let i = 0; i < n; i++) {
    const a = i * 2 * Math.PI / n;
    verts.push(Math.cos(a) * radius, -hh, Math.sin(a) * radius);
  }

  const topCenter = verts.length / 3;
  verts.push(0, hh, 0);
  const botCenter = verts.length / 3;
  verts.push(0, -hh, 0);

  for (let i = 0; i < n; i++) {
    const ni = (i + 1) % n;
    tris.push(i, ni, i + n);
    tris.push(ni, ni + n, i + n);
  }
  for (let i = 0; i < n; i++) {
    const ni = (i + 1) % n;
    tris.push(topCenter, ni, i);
  }
  for (let i = 0; i < n; i++) {
    const ni = (i + 1) % n;
    tris.push(botCenter, i + n, ni + n);
  }

  return { verts: new Float64Array(verts), tris: new Uint16Array(tris) };
}

/** Generate a plane on the XY plane with given width, height */
export function genPlane(w: number, h: number): Geometry {
  const hw = w / 2, hh = h / 2;
  return {
    verts: new Float64Array([-hw, -hh, 0,  hw, -hh, 0,  hw, hh, 0, -hw, hh, 0]),
    tris: new Uint16Array([0, 1, 2, 0, 2, 3]),
  };
}
