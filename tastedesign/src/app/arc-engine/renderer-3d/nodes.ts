// nodes.ts — 3D node render functions
// ARC Engine — Renderer 3D
// Data nodes (shape-3d, text-3d, image-plane-3d, camera-3d, merge-3d) cache geometry/scene data.
// renderer-3d is the only node that actually rasterizes to 2D.

import type { NodeRenderContext } from '../recipe';
import { evalPropA } from '../sources/shared/prop-utils';
import { mat4Mul, mat4Translate, mat4RotateX, mat4RotateY, mat4RotateZ, mat4Scale, mat4MulVec4 } from './math';
import { buildViewProjection } from './camera';
import { rasterize } from './rasterizer';

// ── 1. Shape 3D ───────────────────────────────────────────────────
// Generates mesh geometry (cube, sphere, cylinder, plane) and caches it.
// Renders as a 2D preview (simple wireframe indicator) in non-renderer-3d context.

export function renderShape3D(ctx: NodeRenderContext): void {
  const { ctx: c, props, W, H } = ctx;
  const type = (props.type as string) || 'cube';
  const color = (props.color as string) || '#ffffff';

  // Preview: draw icon + label
  c.fillStyle = '#1a1a2e';
  c.fillRect(0, 0, W, H);
  c.fillStyle = color;
  c.font = '48px sans-serif';
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  const icons: Record<string, string> = { cube: '🧊', sphere: '🔮', cylinder: '🥫', plane: '⬜' };
  c.fillText(icons[type] || '🧊', W / 2, H / 2 - 20);
  c.font = '14px sans-serif';
  c.fillStyle = '#888';
  c.fillText(`3D: ${type}`, W / 2, H / 2 + 30);
}

// ── 2. Text 3D ────────────────────────────────────────────────────
// Preview only. Actual 3D text extrusion not implemented in software renderer.

export function renderText3D(ctx: NodeRenderContext): void {
  const { ctx: c, props, W, H } = ctx;
  const text = (props.text as string) || '3D';
  const color = (props.color as string) || '#ffffff';

  c.fillStyle = '#1a1a2e';
  c.fillRect(0, 0, W, H);
  c.fillStyle = color;
  c.font = 'bold 48px sans-serif';
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText(text, W / 2, H / 2 - 20);
  c.font = '14px sans-serif';
  c.fillStyle = '#888';
  c.fillText('3D Text (extrusion not implemented)', W / 2, H / 2 + 30);
}

// ── 3. Image Plane 3D ─────────────────────────────────────────────
// Projects a 2D image onto a plane in 3D space. Preview = passthrough.

export function renderImagePlane3D(ctx: NodeRenderContext): void {
  const { ctx: c, W, H, inputs } = ctx;
  const texture = inputs[0];
  if (texture) {
    c.drawImage(texture, 0, 0);
  } else {
    c.fillStyle = '#1a1a2e';
    c.fillRect(0, 0, W, H);
    c.fillStyle = '#666';
    c.font = '16px sans-serif';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText('3D Image Plane (connect texture)', W / 2, H / 2);
  }
}

// ── 4. Camera 3D ──────────────────────────────────────────────────
// Passthrough with camera overlay indicator.

export function renderCamera3D(ctx: NodeRenderContext): void {
  const { ctx: c, W, H, inputs } = ctx;
  const source = inputs[0];
  if (source) {
    c.drawImage(source, 0, 0);
  } else {
    c.fillStyle = '#1a1a2e';
    c.fillRect(0, 0, W, H);
  }
  // Camera overlay
  c.fillStyle = 'rgba(255,255,255,0.3)';
  c.font = '14px sans-serif';
  c.textAlign = 'left';
  c.textBaseline = 'top';
  c.fillText('📷 Camera 3D', 8, 8);
}

// ── 5. Merge 3D ───────────────────────────────────────────────────
// Combines two 3D scene canvases. Simple stacking.

export function renderMerge3D(ctx: NodeRenderContext): void {
  const { ctx: c, inputs } = ctx;
  const bg = inputs[0];
  const fg = inputs[1];
  if (bg) c.drawImage(bg, 0, 0);
  if (fg) c.drawImage(fg, 0, 0);
}

// ── 6. Renderer 3D ────────────────────────────────────────────────
// THE actual rasterizer. Takes scene input, builds model/view/proj matrices,
// transforms vertices, rasterizes with z-buffer and lighting.

export function renderRenderer3D(ctx: NodeRenderContext): void {
  const { ctx: c, props, W, H, inputs, channels, modifiers, t, nodeId } = ctx;
  const scene = inputs[0];
  if (!scene) {
    c.fillStyle = '#000';
    c.fillRect(0, 0, W, H);
    return;
  }

  const bgColor = (props.bgColor as string) || '#000000';
  const lighting = !!(props.lighting as boolean);
  const ambient = evalPropA(nodeId, 'ambient', (props.ambient as number) ?? 0.3, channels, modifiers, t);
  const lightDirX = (props.lightDirX as number) ?? -1;
  const lightDirY = (props.lightDirY as number) ?? -1;
  const lightDirZ = (props.lightDirZ as number) ?? -1;
  const wireframe = !!(props.wireframe as boolean);

  // Read scene data (stashed on the canvas by data nodes)
  const sceneData = (scene as any).__sceneData;
  if (!sceneData || !sceneData.verts || !sceneData.tris) {
    // No 3D data: clear with bg color
    c.fillStyle = bgColor;
    c.fillRect(0, 0, W, H);
    c.fillStyle = '#444';
    c.font = '16px sans-serif';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText('3D Scene (connect shape/text nodes)', W / 2, H / 2);
    return;
  }

  // Build camera from scene data or use defaults
  const cam = sceneData.camera || { posX: 0, posY: 0, posZ: -500, rotX: 0, rotY: 0, rotZ: 0, fov: 45, near: 1, far: 10000 };
  const aspect = W / H;
  const vp = buildViewProjection(cam.posX, cam.posY, cam.posZ, cam.rotX, cam.rotY, cam.rotZ, cam.fov, aspect, cam.near, cam.far);

  // Build model matrix for each mesh in the scene
  const meshes = sceneData.meshes || [{ verts: sceneData.verts, tris: sceneData.tris, color: '#ffffff' }];

  c.fillStyle = bgColor;
  c.fillRect(0, 0, W, H);

  const imgData = c.getImageData(0, 0, W, H);
  const d = imgData.data;
  const zbuf = new Float32Array(W * H);
  zbuf.fill(1);

  for (const mesh of meshes) {
    const modelMat = buildModelMatrix(mesh);
    const mvp = mat4Mul(modelMat, vp);

    const { verts, tris } = mesh;
    const vertexCount = verts.length / 3;
    const transformed = new Float64Array(vertexCount * 4);

    for (let j = 0; j < vertexCount; j++) {
      const v = mat4MulVec4(mvp, new Float64Array([verts[j * 3], verts[j * 3 + 1], verts[j * 3 + 2], 1]));
      if (Math.abs(v[3]) > 0.0001) {
        v[0] /= v[3]; v[1] /= v[3]; v[2] /= v[3];
      }
      transformed[j * 4]     = (v[0] * 0.5 + 0.5) * W;
      transformed[j * 4 + 1] = (-v[1] * 0.5 + 0.5) * H;
      transformed[j * 4 + 2] = v[2];
      transformed[j * 4 + 3] = v[3];
    }

    rasterize(d, zbuf, transformed, tris, verts, W, H, {
      lighting, ambient, lightDirX, lightDirY, lightDirZ, wireframe,
      color: mesh.color || '#ffffff',
    });
  }

  c.putImageData(imgData, 0, 0);
}

/** Build a model matrix from mesh transform data */
function buildModelMatrix(mesh: any): Float64Array {
  const px = mesh.posX || 0, py = mesh.posY || 0, pz = mesh.posZ || 0;
  const rx = (mesh.rotX || 0) * Math.PI / 180;
  const ry = (mesh.rotY || 0) * Math.PI / 180;
  const rz = (mesh.rotZ || 0) * Math.PI / 180;
  const sx = mesh.scaleX ?? 1, sy = mesh.scaleY ?? 1, sz = mesh.scaleZ ?? 1;

  let m = mat4Translate(px, py, pz);
  m = mat4Mul(m, mat4RotateX(rx));
  m = mat4Mul(m, mat4RotateY(ry));
  m = mat4Mul(m, mat4RotateZ(rz));
  m = mat4Mul(m, mat4Scale(sx, sy, sz));
  return m;
}
