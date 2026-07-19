// rasterizer.ts — Software triangle rasterizer with z-buffer
// ARC Engine — Renderer 3D
// Receives transformed vertices, draws filled triangles with flat shading + z-buffer

import { computeNormal, computeLighting } from './lighting';

export interface RasterizeOptions {
  lighting: boolean;
  ambient: number;
  lightDirX: number;
  lightDirY: number;
  lightDirZ: number;
  wireframe: boolean;
  color: string;
}

/** Rasterize a set of triangles onto an ImageData buffer */
export function rasterize(
  d: Uint8ClampedArray,
  zbuf: Float32Array,
  transformed: Float64Array,  // [x,y,z,w] per vertex (mapped to screen)
  tris: Uint16Array,
  verts: Float64Array,        // original vertex positions for normal calc
  W: number,
  H: number,
  options: RasterizeOptions,
): void {
  if (!transformed || !tris || tris.length < 3) return;

  const color = parseHexColor(options.color);

  for (let i = 0; i < tris.length; i += 3) {
    const ia = tris[i], ib = tris[i + 1], ic = tris[i + 2];
    const p0x = transformed[ia * 4], p0y = transformed[ia * 4 + 1], p0z = transformed[ia * 4 + 2];
    const p1x = transformed[ib * 4], p1y = transformed[ib * 4 + 1], p1z = transformed[ib * 4 + 2];
    const p2x = transformed[ic * 4], p2y = transformed[ic * 4 + 1], p2z = transformed[ic * 4 + 2];

    // Compute lighting
    let light = 1;
    if (options.lighting) {
      const [nx, ny, nz] = computeNormal(
        verts[ia * 3], verts[ia * 3 + 1], verts[ia * 3 + 2],
        verts[ib * 3], verts[ib * 3 + 1], verts[ib * 3 + 2],
        verts[ic * 3], verts[ic * 3 + 1], verts[ic * 3 + 2],
      );
      light = computeLighting(nx, ny, nz, options.lightDirX, options.lightDirY, options.lightDirZ, options.ambient);
    }

    // Screen-space triangle
    const minX = Math.max(0, Math.floor(Math.min(p0x, p1x, p2x)));
    const maxX = Math.min(W - 1, Math.ceil(Math.max(p0x, p1x, p2x)));
    const minY = Math.max(0, Math.floor(Math.min(p0y, p1y, p2y)));
    const maxY = Math.min(H - 1, Math.ceil(Math.max(p0y, p1y, p2y)));

    // Edge function area
    const area = (p1x - p0x) * (p2y - p0y) - (p2x - p0x) * (p1y - p0y);
    if (Math.abs(area) < 0.001) continue;

    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        // Barycentric coordinates
        const v0x = p2x - p0x, v0y = p2y - p0y;
        const v1x = p1x - p0x, v1y = p1y - p0y;
        const v2x = x - p0x, v2y = y - p0y;
        const dot00 = v0x * v0x + v0y * v0y;
        const dot01 = v0x * v1x + v0y * v1y;
        const dot02 = v0x * v2x + v0y * v2y;
        const dot11 = v1x * v1x + v1y * v1y;
        const dot12 = v1x * v2x + v1y * v2y;
        const inv = 1 / (dot00 * dot11 - dot01 * dot01 || 0.0001);
        const u = (dot11 * dot02 - dot01 * dot12) * inv;
        const v = (dot00 * dot12 - dot01 * dot02) * inv;

        if (u < 0 || v < 0 || u + v > 1) continue;

        // Interpolate Z
        const z = p0z + u * (p2z - p0z) + v * (p1z - p0z);

        const idx = (y * W + x);
        if (z >= zbuf[idx]) continue;
        zbuf[idx] = z;

        const pi = idx * 4;
        if (options.wireframe) {
          const edge = u < 0.02 || v < 0.02 || u + v > 0.98;
          if (edge) {
            d[pi] = 255; d[pi + 1] = 255; d[pi + 2] = 255; d[pi + 3] = 255;
          }
        } else {
          const l = Math.max(0, Math.min(1, light));
          d[pi]     = Math.round(color.r * l);
          d[pi + 1] = Math.round(color.g * l);
          d[pi + 2] = Math.round(color.b * l);
          d[pi + 3] = 255;
        }
      }
    }
  }
}

function parseHexColor(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.substring(0, 2), 16) || 255,
    g: parseInt(h.substring(2, 4), 16) || 255,
    b: parseInt(h.substring(4, 6), 16) || 255,
  };
}
