// lighting.ts — Lighting calculations for software 3D renderer
// ARC Engine — Renderer 3D

/** Compute per-vertex normal from triangle (non-indexed) */
export function computeNormal(
  ax: number, ay: number, az: number,
  bx: number, by: number, bz: number,
  cx: number, cy: number, cz: number,
): [number, number, number] {
  const e1x = bx - ax, e1y = by - ay, e1z = bz - az;
  const e2x = cx - ax, e2y = cy - ay, e2z = cz - az;
  let nx = e1y * e2z - e1z * e2y;
  let ny = e1z * e2x - e1x * e2z;
  let nz = e1x * e2y - e1y * e2x;
  const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
  if (len > 0.0001) { nx /= len; ny /= len; nz /= len; }
  return [nx, ny, nz];
}

/** Compute lighting intensity for a given normal and light direction */
export function computeLighting(
  nx: number, ny: number, nz: number,
  lx: number, ly: number, lz: number,
  ambient: number,
): number {
  const ll = Math.sqrt(lx * lx + ly * ly + lz * lz);
  if (ll > 0.0001) {
    lx /= ll; ly /= ll; lz /= ll;
  }
  const diff = Math.max(0, nx * lx + ny * ly + nz * lz);
  return ambient + (1 - ambient) * diff;
}
