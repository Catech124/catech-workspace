// math.ts — 4×4 Matrix Math & Vec4 operations for software 3D renderer
// ARC Engine — Renderer 3D

/** Create identity 4×4 matrix (column-major, 16 elements) */
export function mat4Identity(): Float64Array {
  const m = new Float64Array(16);
  m[0] = 1; m[5] = 1; m[10] = 1; m[15] = 1;
  return m;
}

/** Multiply two 4×4 matrices: out = a × b */
export function mat4Mul(a: Float64Array, b: Float64Array): Float64Array {
  const out = new Float64Array(16);
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      let sum = 0;
      for (let k = 0; k < 4; k++) sum += a[k * 4 + j] * b[i * 4 + k];
      out[i * 4 + j] = sum;
    }
  }
  return out;
}

/** Multiply 4×4 matrix by 4-component vector */
export function mat4MulVec4(m: Float64Array, v: Float64Array): Float64Array {
  return new Float64Array([
    m[0] * v[0] + m[4] * v[1] + m[8]  * v[2] + m[12] * v[3],
    m[1] * v[0] + m[5] * v[1] + m[9]  * v[2] + m[13] * v[3],
    m[2] * v[0] + m[6] * v[1] + m[10] * v[2] + m[14] * v[3],
    m[3] * v[0] + m[7] * v[1] + m[11] * v[2] + m[15] * v[3],
  ]);
}

/** Create rotation matrix around X axis */
export function mat4RotateX(angle: number): Float64Array {
  const c = Math.cos(angle), s = Math.sin(angle);
  const m = mat4Identity();
  m[5] = c;  m[6] = s;  m[9] = -s; m[10] = c;
  return m;
}

/** Create rotation matrix around Y axis */
export function mat4RotateY(angle: number): Float64Array {
  const c = Math.cos(angle), s = Math.sin(angle);
  const m = mat4Identity();
  m[0] = c; m[2] = -s; m[8] = s; m[10] = c;
  return m;
}

/** Create rotation matrix around Z axis */
export function mat4RotateZ(angle: number): Float64Array {
  const c = Math.cos(angle), s = Math.sin(angle);
  const m = mat4Identity();
  m[0] = c; m[1] = s; m[4] = -s; m[5] = c;
  return m;
}

/** Create translation matrix */
export function mat4Translate(x: number, y: number, z: number): Float64Array {
  const m = mat4Identity();
  m[12] = x; m[13] = y; m[14] = z;
  return m;
}

/** Create scale matrix */
export function mat4Scale(x: number, y: number, z: number): Float64Array {
  const m = mat4Identity();
  m[0] = x; m[5] = y; m[10] = z;
  return m;
}

/** Create perspective projection matrix */
export function mat4Perspective(fovDeg: number, aspect: number, near: number, far: number): Float64Array {
  const f = 1 / Math.tan(fovDeg * Math.PI / 360);
  const rangeInv = 1 / (near - far);
  const m = new Float64Array(16);
  m[0] = f / aspect;
  m[5] = f;
  m[10] = (near + far) * rangeInv;
  m[11] = -1;
  m[14] = 2 * near * far * rangeInv;
  return m;
}

/** Create look-at view matrix */
export function mat4LookAt(
  px: number, py: number, pz: number,
  tx: number, ty: number, tz: number,
  upx: number, upy: number, upz: number,
): Float64Array {
  let zx = px - tx, zy = py - ty, zz = pz - tz;
  const zl = Math.sqrt(zx * zx + zy * zy + zz * zz);
  if (zl < 0.0001) return mat4Identity();
  zx /= zl; zy /= zl; zz /= zl;

  let xx = upy * zz - upz * zy, xy = upz * zx - upx * zz, xz = upx * zy - upy * zx;
  const xl = Math.sqrt(xx * xx + xy * xy + xz * xz);
  if (xl < 0.0001) return mat4Identity();
  xx /= xl; xy /= xl; xz /= xl;

  const yx = zy * xz - zz * xy, yy = zz * xx - zx * xz, yz = zx * xy - zy * xx;

  const m = new Float64Array(16);
  m[0] = xx;  m[1] = yx;  m[2] = zx;  m[3] = 0;
  m[4] = xy;  m[5] = yy;  m[6] = zy;  m[7] = 0;
  m[8] = xz;  m[9] = yz;  m[10] = zz; m[11] = 0;
  m[12] = -(xx * px + xy * py + xz * pz);
  m[13] = -(yx * px + yy * py + yz * pz);
  m[14] = -(zx * px + zy * py + zz * pz);
  m[15] = 1;
  return m;
}
