// video-loader.ts — Loader node for videos
// ARC Video Editor — Toolcraft Integration
//
// Loads and renders video files with opacity control.
// Fusion analog: Loader (MediaIn)
// Inputs: 0 | Outputs: 1 (Salida)
//
// Props:
//   src: string — URL del video
//   opacity: number (0-1, animable)

import type { NodeRenderContext } from '../recipe';
import { evalPropA } from './shared/prop-utils';

const videoCache = new Map<string, { video: HTMLVideoElement; lastAccess: number }>();
const MAX_CACHE = 50;

function getCachedVideo(src: string): HTMLVideoElement | null {
  if (!src) return null;

  const cached = videoCache.get(src);
  if (cached) {
    cached.lastAccess = Date.now();
    return cached.video;
  }

  if (videoCache.size >= MAX_CACHE) {
    let oldestKey = '';
    let oldestTime = Infinity;
    for (const [key, entry] of videoCache) {
      if (entry.lastAccess < oldestTime) {
        oldestTime = entry.lastAccess;
        oldestKey = key;
      }
    }
    if (oldestKey) {
      const old = videoCache.get(oldestKey);
      if (old) {
        old.video.pause();
        old.video.src = '';
      }
      videoCache.delete(oldestKey);
    }
  }

  const video = document.createElement('video');
  video.crossOrigin = 'anonymous';
  video.src = src;
  video.muted = true;
  video.loop = true;
  video.playsInline = true;

  // Attempt autoplay
  const playPromise = video.play();
  if (playPromise) {
    playPromise.catch(() => {
      // Autoplay blocked — will try on user gesture
      video.muted = true;
      video.play().catch(() => {
        // Store for retry on interaction
        (video as any)._autoplayBlocked = true;
      });
    });
  }

  videoCache.set(src, { video, lastAccess: Date.now() });
  return video;
}

// Global user gesture handler for blocked autoplay
let _gestureHandlerAttached = false;
function attachGestureHandler(): void {
  if (_gestureHandlerAttached) return;
  _gestureHandlerAttached = true;
  const handler = () => {
    for (const [, entry] of videoCache) {
      const v = entry.video;
      if ((v as any)._autoplayBlocked) {
        v.play().catch(() => {});
        delete (v as any)._autoplayBlocked;
      }
    }
  };
  document.addEventListener('click', handler, { once: false });
  document.addEventListener('keydown', handler, { once: false });
}

export function renderVideoLoader(ctx: NodeRenderContext): void {
  const { ctx: c, props, W, H, channels, modifiers, t, nodeId } = ctx;
  const src = (props.src as string) || '';
  const opacity = evalPropA(nodeId, 'opacity', 1, channels, modifiers, t);

  if (!src) {
    c.fillStyle = '#1a1a1a';
    c.fillRect(0, 0, W, H);
    c.fillStyle = '#666';
    c.font = '24px sans-serif';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText('📁 Drop video here', W / 2, H / 2);
    return;
  }

  attachGestureHandler();
  const video = getCachedVideo(src);
  if (!video) return;

  if (video.readyState < 2) {
    c.fillStyle = '#1a1a1a';
    c.fillRect(0, 0, W, H);
    c.fillStyle = '#888';
    c.font = '20px sans-serif';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText('⏳ Loading video...', W / 2, H / 2);
    return;
  }

  c.save();
  c.globalAlpha = Math.max(0, opacity);

  const scale = Math.max(W / video.videoWidth, H / video.videoHeight);
  const sw = video.videoWidth * scale;
  const sh = video.videoHeight * scale;
  const sx = (W - sw) / 2;
  const sy = (H - sh) / 2;
  c.drawImage(video, sx, sy, sw, sh);

  c.restore();
}
