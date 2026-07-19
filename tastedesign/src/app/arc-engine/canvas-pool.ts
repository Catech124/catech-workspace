// canvas-pool.ts — Reusable canvas pool to eliminate GC churn
// ARC Video Editor — Toolcraft Integration
//
// Usage:
//   import { acquire, releaseAll, excludeFromRelease, resetPool } from './canvas-pool';
//   const c = acquire(W, H);       // get a canvas (pooled or fresh)
//   // ... render to c ...
//   excludeFromRelease(c);         // if c is the final result to keep
//   releaseAll();                  // return all OTHER canvases to pool
//
// Size-aware acquisition:
//   acquire(W, H) first tries to find an exact-size match. If none exists,
//   it searches the pool for any canvas AT LEAST (W×H) and picks the
//   closest fit (smallest area ≥ requested). This avoids allocating a new
//   canvas when a slightly larger one is available — useful when the
//   editor viewport changes size.

const _pool = new Map<string, HTMLCanvasElement[]>();
const _inUse = new Set<HTMLCanvasElement>();
const MAX_PER_SIZE = 12;

/**
 * Acquire a canvas of exactly (W×H) pixels using size-aware lazy matching.
 *
 * Strategy:
 *   1. Exact match: if a canvas of size W×H exists in the pool, reuse it.
 *   2. Best-fit search: iterate the pool to find a canvas NAV ${W}x${H}
 *      with width ≥ W AND height ≥ H, picking the one with smallest area.
 *   3. If found, resize to W×H (which clears canvas + resets context state).
 *   4. If not found, create a new canvas.
 */
export function acquire(W: number, H: number): HTMLCanvasElement {
  let c: HTMLCanvasElement | null = null;

  // ═══ Phase 1: exact match ═══
  const exactKey = `${W}x${H}`;
  const exactBin = _pool.get(exactKey);
  if (exactBin && exactBin.length > 0) {
    c = exactBin.pop()!;
    c.width = W;
    c.height = H;
    _inUse.add(c);
    return c;
  }

  // ═══ Phase 2: best-fit search (size-aware lazy match) ═══
  let bestKey: string | null = null;
  let bestArea = Infinity;

  for (const [key, bin] of _pool) {
    if (key === exactKey) continue; // already checked above
    if (bin.length === 0) continue;

    const [pw, ph] = parseSizeKey(key);
    if (pw >= W && ph >= H) {
      const area = pw * ph;
      if (area < bestArea) {
        bestArea = area;
        bestKey = key;
      }
    }
  }

  if (bestKey !== null) {
    const bin = _pool.get(bestKey)!;
    c = bin.pop()!;
    // Clean up empty bins to avoid iterating dead keys next time
    if (bin.length === 0) _pool.delete(bestKey);
  }

  // ═══ Phase 3: create new if no match found ═══
  if (!c) {
    if (typeof OffscreenCanvas !== 'undefined') {
      c = new OffscreenCanvas(W, H) as unknown as HTMLCanvasElement;
    } else {
      c = document.createElement('canvas');
    }
  }

  // Resize to exact requested dimensions (also clears canvas context state)
  c.width = W;
  c.height = H;

  _inUse.add(c);
  return c;
}

/**
 * Parse a pool key `${W}x${H}` back into numbers.
 * Returns [0, 0] for invalid keys (should never happen in practice).
 */
function parseSizeKey(key: string): [number, number] {
  const sep = key.indexOf('x');
  if (sep === -1) return [0, 0];
  const w = parseInt(key.slice(0, sep), 10);
  const h = parseInt(key.slice(sep + 1), 10);
  return [Number.isFinite(w) ? w : 0, Number.isFinite(h) ? h : 0];
}

/**
 * Remove a canvas from the in-use tracking so it won't be returned
 * to the pool on the next releaseAll(). Call this on the FINAL
 * composited result that gets drawn to screen.
 */
export function excludeFromRelease(canvas: HTMLCanvasElement): void {
  _inUse.delete(canvas);
}

/**
 * Return all currently-tracked canvases to the pool for reuse.
 * Canvas contents are cleared before pooling.
 */
export function releaseAll(): void {
  for (const c of _inUse) {
    // Resetting width/height to the same values clears the canvas
    // and resets context state (transform, clip, etc.)
    c.width = c.width;
    c.height = c.height;
    const key = `${c.width}x${c.height}`;
    if (!_pool.has(key)) _pool.set(key, []);
    const arr = _pool.get(key)!;
    if (arr.length < MAX_PER_SIZE) {
      arr.push(c);
    }
  }
  _inUse.clear();
}

/**
 * Clear the entire pool — useful for memory cleanup when
 * composition dimensions change significantly.
 */
export function resetPool(): void {
  _pool.clear();
  _inUse.clear();
}
