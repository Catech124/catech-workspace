// image-loader.ts — Loader node for images
// ARC Video Editor — Toolcraft Integration
//
// Loads and renders image files with brightness/contrast/gain controls.
// Fusion analog: Loader (MediaIn)
// Inputs: 0 | Outputs: 1 (Salida)
//
// Props:
//   src: string — URL de la imagen
//   brightness: number (0-2, animable)
//   contrast: number (0-2, animable)
//   gain: number (0+, animable)

import type { NodeRenderContext } from '../recipe';
import { evalPropA } from './shared/prop-utils';

const imageCache = new Map<string, { img: HTMLImageElement; lastAccess: number }>();
const MAX_CACHE = 100;

function getCachedImage(src: string): HTMLImageElement | null {
  if (!src) return null;

  const cached = imageCache.get(src);
  if (cached) {
    cached.lastAccess = Date.now();
    return cached.img;
  }

  if (imageCache.size >= MAX_CACHE) {
    // LRU eviction
    let oldestKey = '';
    let oldestTime = Infinity;
    for (const [key, entry] of imageCache) {
      if (entry.lastAccess < oldestTime) {
        oldestTime = entry.lastAccess;
        oldestKey = key;
      }
    }
    if (oldestKey) imageCache.delete(oldestKey);
  }

  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.src = src;
  imageCache.set(src, { img, lastAccess: Date.now() });
  return img;
}

export function renderImageLoader(ctx: NodeRenderContext): void {
  const { ctx: c, props, W, H, channels, modifiers, t, nodeId } = ctx;
  const src = (props.src as string) || '';

  const brightness = evalPropA(nodeId, 'brightness', 1, channels, modifiers, t);
  const contrast = evalPropA(nodeId, 'contrast', 1, channels, modifiers, t);
  const gain = evalPropA(nodeId, 'gain', 1, channels, modifiers, t);

  if (!src) {
    // Show placeholder
    c.fillStyle = '#1a1a1a';
    c.fillRect(0, 0, W, H);
    c.fillStyle = '#666';
    c.font = '24px sans-serif';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText('📁 Drop file here', W / 2, H / 2);
    return;
  }

  const img = getCachedImage(src);
  if (!img) return;

  if (!img.complete || img.naturalWidth === 0) {
    // Show loading
    c.fillStyle = '#1a1a1a';
    c.fillRect(0, 0, W, H);
    c.fillStyle = '#888';
    c.font = '20px sans-serif';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText('⏳ Loading...', W / 2, H / 2);
    return;
  }

  c.save();
  c.globalAlpha = Math.max(0, gain);

  // Apply brightness/contrast via CSS filter or direct pixel manipulation
  if (brightness !== 1 || contrast !== 1) {
    c.filter = `brightness(${brightness}) contrast(${contrast})`;
  }

  // Center and cover the canvas
  const scale = Math.max(W / img.naturalWidth, H / img.naturalHeight);
  const sw = img.naturalWidth * scale;
  const sh = img.naturalHeight * scale;
  const sx = (W - sw) / 2;
  const sy = (H - sh) / 2;
  c.drawImage(img, sx, sy, sw, sh);

  c.restore();
}
