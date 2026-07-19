// image-data-pool.ts — Pool para reutilizar ImageData y Uint8ClampedArray
// ARC Video Editor — Toolcraft Integration
//
// Evita alocar W*H*4 bytes por frame en blur, displacement, glow, keyers, etc.
// El pool libera todos los buffers al final de renderFrame().
//
// Size-aware acquisition:
//   acquireImageData(W, H) primero busca match exacto. Si no hay, itera el pool
//   para encontrar un ImageData con width ≥ W AND height ≥ H, eligiendo el de
//   menor área (best-fit). Esto evita alocar cuando hay uno ligeramente mayor.
//
// Uso:
//   import { acquireImageData, releaseAllImageData,
//            acquireClampedArray, releaseAllClampedArrays } from './image-data-pool';
//
//   const id = acquireImageData(W, H);  // en vez de ctx.createImageData(W, H)
//   // ... modificar id.data ...
//   ctx.putImageData(id, 0, 0);
//   // no release manual — releaseAllImageData() se llama al final del frame
//
// Para Uint8ClampedArray (boxBlur):
//   const arr = acquireClampedArray(length);  // en vez de new Uint8ClampedArray(length)
//   // ... usar ...
//   // release al final del frame via releaseAllClampedArrays()

const _idPool = new Map<string, ImageData[]>();
const _idInUse = new Set<ImageData>();
const _arrPool = new Map<string, Uint8ClampedArray[]>();
const _arrInUse = new Set<Uint8ClampedArray>();

const MAX_ID_PER_SIZE = 8;
const MAX_ARR_PER_SIZE = 16;

// ═══ ImageData Pool ═══

/**
 * Acquire an ImageData of exactly (W×H) pixels using size-aware lazy matching.
 *
 * Note: Unlike canvases, ImageData is immutable-sized — we cannot resize a
 * pooled ImageData. Therefore only exact-match reuse is supported (no best-fit).
 */
export function acquireImageData(W: number, H: number): ImageData {
  const exactKey = `${W}x${H}`;
  const exactBin = _idPool.get(exactKey);

  if (exactBin && exactBin.length > 0) {
    const id = exactBin.pop()!;
    _idInUse.add(id);
    return id;
  }

  const id = new ImageData(W, H);
  _idInUse.add(id);
  return id;
}

export function releaseImageData(id: ImageData): void {
  if (!id) return;
  _idInUse.delete(id);
  const key = `${id.width}x${id.height}`;
  const pool = _idPool.get(key);
  if (!pool) {
    _idPool.set(key, [id]);
  } else if (pool.length < MAX_ID_PER_SIZE) {
    pool.push(id);
  }
}

export function releaseAllImageData(): void {
  for (const id of _idInUse) {
    const key = `${id.width}x${id.height}`;
    const pool = _idPool.get(key);
    if (!pool) {
      _idPool.set(key, [id]);
    } else if (pool.length < MAX_ID_PER_SIZE) {
      pool.push(id);
    }
  }
  _idInUse.clear();
}

// ═══ Uint8ClampedArray Pool ═══

/**
 * Acquire a Uint8ClampedArray of at least `length` elements using
 * size-aware lazy matching.
 *
 * Strategy:
 *   1. Exact match: if an array of exact length exists, reuse it.
 *   2. Best-fit search: iterate the pool for an array with length ≥ requested,
 *      picking the one with smallest excess.
 *   3. If not found, create a new array.
 */
export function acquireClampedArray(length: number): Uint8ClampedArray {
  let arr: Uint8ClampedArray | null = null;

  // ═══ Phase 1: exact match ═══
  const exactKey = String(length);
  const exactBin = _arrPool.get(exactKey);
  if (exactBin && exactBin.length > 0) {
    arr = exactBin.pop()!;
    _arrInUse.add(arr);
    return arr;
  }

  // ═══ Phase 2: best-fit search ═══
  let bestKey: string | null = null;
  let bestExcess = Infinity;

  for (const [key, bin] of _arrPool) {
    if (key === exactKey) continue;
    if (bin.length === 0) continue;

    const poolLen = parseInt(key, 10);
    if (Number.isFinite(poolLen) && poolLen >= length) {
      const excess = poolLen - length;
      if (excess < bestExcess) {
        bestExcess = excess;
        bestKey = key;
      }
    }
  }

  if (bestKey !== null) {
    const bin = _arrPool.get(bestKey)!;
    arr = bin.pop()!;
    if (bin.length === 0) _arrPool.delete(bestKey);
  }

  // ═══ Phase 3: create new if no match found ═══
  if (!arr) {
    arr = new Uint8ClampedArray(length);
  }

  _arrInUse.add(arr);
  return arr;
}

export function releaseClampedArray(arr: Uint8ClampedArray): void {
  if (!arr) return;
  _arrInUse.delete(arr);
  const key = String(arr.length);
  const pool = _arrPool.get(key);
  if (!pool) {
    _arrPool.set(key, [arr]);
  } else if (pool.length < MAX_ARR_PER_SIZE) {
    pool.push(arr);
  }
}

export function releaseAllClampedArrays(): void {
  for (const arr of _arrInUse) {
    const key = String(arr.length);
    const pool = _arrPool.get(key);
    if (!pool) {
      _arrPool.set(key, [arr]);
    } else if (pool.length < MAX_ARR_PER_SIZE) {
      pool.push(arr);
    }
  }
  _arrInUse.clear();
}

export function resetImageDataPool(): void {
  _idPool.clear();
  _idInUse.clear();
  _arrPool.clear();
  _arrInUse.clear();
}
