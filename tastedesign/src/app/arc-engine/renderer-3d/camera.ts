// camera.ts — Camera view/projection calculation
// ARC Engine — Renderer 3D

import { mat4LookAt, mat4Perspective, mat4Mul } from './math';

/**
 * Build combined view-projection matrix from camera parameters.
 * Camera looks at target point (default: origin).
 */
export function buildViewProjection(
  posX: number, posY: number, posZ: number,
  rotX: number, rotY: number, _rotZ: number,
  fov: number, aspect: number, near: number, far: number,
): Float64Array {
  // Apply rotations to compute look direction
  const cosRx = Math.cos(rotX * Math.PI / 180);
  const sinRx = Math.sin(rotX * Math.PI / 180);
  const cosRy = Math.cos(rotY * Math.PI / 180);
  const sinRy = Math.sin(rotY * Math.PI / 180);

  // Look direction: forward along -Z after rotations
  const lookX = 0, lookY = 0, lookZ = -1;
  // Apply Y rotation then X rotation
  let lx = lookX * cosRy + lookZ * sinRy;
  let ly = lookY;
  let lz = -lookX * sinRy + lookZ * cosRy;

  const ly2 = ly * cosRx - lz * sinRx;
  lz = ly * sinRx + lz * cosRx;
  ly = ly2;

  const targetX = posX + lx;
  const targetY = posY + ly;
  const targetZ = posZ + lz;

  const view = mat4LookAt(posX, posY, posZ, targetX, targetY, targetZ, 0, 1, 0);
  const proj = mat4Perspective(fov, aspect, near, far);

  return mat4Mul(view, proj);
}
