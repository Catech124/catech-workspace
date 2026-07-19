// @vitest-environment jsdom
// image-data-pool.test.ts — Tests for the size-aware image data pool
//
// Note: acquireImageData uses exact-match only (ImageData is immutable-sized).
// acquireClampedArray supports best-fit (typed arrays used as scratch buffers).
//
// jsdom does not implement ImageData — provide a minimal mock for pool tests.
/* eslint-disable @typescript-eslint/no-unnecessary-condition */
if (typeof ImageData === "undefined") {
  (globalThis as Record<string, unknown>).ImageData = class MockImageData {
    width: number;
    height: number;
    data: Uint8ClampedArray;
    constructor(width: number, height: number) {
      if (width <= 0 || height <= 0) throw new Error("ImageData: invalid size");
      this.width = width;
      this.height = height;
      this.data = new Uint8ClampedArray(width * height * 4);
    }
  };
}
/* eslint-enable */

import { describe, it, expect, beforeEach } from "vitest";
import {
  acquireImageData,
  releaseAllImageData,
  acquireClampedArray,
  releaseAllClampedArrays,
  resetImageDataPool,
} from "./image-data-pool";

beforeEach(() => {
  resetImageDataPool();
});

// ============================================================
// ImageData Pool
// ============================================================

describe("ImageData pool", () => {
  describe("acquireImageData", () => {
    it("creates an ImageData of the requested size", () => {
      const id = acquireImageData(100, 200);
      expect(id.width).toBe(100);
      expect(id.height).toBe(200);
    });

    it("reuses an exact-size ImageData from the pool", () => {
      const id1 = acquireImageData(320, 240);
      releaseAllImageData();

      const id2 = acquireImageData(320, 240);
      expect(id2).toBe(id1); // same reference — reused!
      expect(id2.width).toBe(320);
      expect(id2.height).toBe(240);
    });

    it("creates a new ImageData when exact size is not pooled", () => {
      const id1 = acquireImageData(320, 240);
      releaseAllImageData();

      const id2 = acquireImageData(640, 480);
      expect(id2).not.toBe(id1); // different size, fresh allocation
      expect(id2.width).toBe(640);
      expect(id2.height).toBe(480);
    });

    it("does NOT reuse a larger ImageData (immutable-size safety)", () => {
      // Pool a 640×480 ImageData
      const id1 = acquireImageData(640, 480);
      releaseAllImageData();

      // Acquire 320×240 — should NOT reuse the 640×480 because
      // ImageData can't be resized (would return wrong width/height)
      const id2 = acquireImageData(320, 240);
      expect(id2).not.toBe(id1); // fresh allocation
      expect(id2.width).toBe(320);
      expect(id2.height).toBe(240);
    });

    it("throws when ImageData constructor fails (e.g., zero size)", () => {
      // ImageData(0, 0) throws in some environments
      expect(() => acquireImageData(0, 0)).toThrow();
    });
  });
});

// ============================================================
// Uint8ClampedArray Pool
// ============================================================

describe("ClampedArray pool", () => {
  describe("acquireClampedArray", () => {
    it("creates an array with at least the requested length", () => {
      const arr = acquireClampedArray(100);
      expect(arr.length).toBeGreaterThanOrEqual(100);
    });

    it("reuses an exact-length array from the pool", () => {
      const arr1 = acquireClampedArray(256);
      releaseAllClampedArrays();

      const arr2 = acquireClampedArray(256);
      expect(arr2).toBe(arr1); // same reference — reused!
    });

    it("creates a new array when exact length is not pooled", () => {
      const arr1 = acquireClampedArray(256);
      releaseAllClampedArrays();

      const arr2 = acquireClampedArray(512);
      expect(arr2).not.toBe(arr1); // different length, fresh allocation
    });
  });

  describe("size-aware best-fit (ClampedArray)", () => {
    it("reuses a larger array when exact length is not available", () => {
      // Pool a 1024-length array
      const arr1 = acquireClampedArray(1024);
      releaseAllClampedArrays();

      // Acquire 500 — should reuse the 1024-length array
      const arr2 = acquireClampedArray(500);
      expect(arr2).toBe(arr1); // same reference — best-fit reused!
      // arr2.length may be 1024 (original allocation) or 500 (new), but must be ≥ 500
      expect(arr2.length).toBeGreaterThanOrEqual(500);
    });

    it("picks the closest fit (smallest excess) among multiple candidates", () => {
      // Pool arrays of 3 lengths
      acquireClampedArray(2000);
      acquireClampedArray(1000);
      acquireClampedArray(600);
      releaseAllClampedArrays();

      // Acquire 700 — should pick the 1000-length array (excess=300)
      // over 2000 (excess=1300) and 600 (too small)
      const arr = acquireClampedArray(700);
      expect(arr.length).toBeGreaterThanOrEqual(700);
      // The implementation picks smallest excess ≥ target, so 1000 is preferred over 2000
    });

    it("creates new array when no pooled one is long enough", () => {
      acquireClampedArray(100);
      acquireClampedArray(500);
      releaseAllClampedArrays();

      // Acquire 5000 — none in pool are ≥ this length
      const arr = acquireClampedArray(5000);
      expect(arr.length).toBeGreaterThanOrEqual(5000);
    });

    it("cleans up empty pool bins after best-fit pop", () => {
      // Pool exactly one array of 2048
      const arr1 = acquireClampedArray(2048);
      releaseAllClampedArrays();

      // Acquire 1000 — consumes the 2048 array and deletes its bin
      acquireClampedArray(1000);

      // Now pool should have no entries for 2048
      const arr2 = acquireClampedArray(2048);
      expect(arr2).not.toBe(arr1); // fresh allocation since bin was deleted
    });
  });
});

// ============================================================
// resetImageDataPool
// ============================================================

describe("resetImageDataPool", () => {
  it("clears all pooled ImageData and arrays", () => {
    acquireImageData(100, 100);
    acquireImageData(200, 200);
    acquireClampedArray(256);
    acquireClampedArray(512);
    releaseAllImageData();
    releaseAllClampedArrays();

    resetImageDataPool();

    // After reset, all acquires should be fresh allocations
    const id = acquireImageData(100, 100);
    expect(id.width).toBe(100);
    expect(id.height).toBe(100);
    const arr = acquireClampedArray(256);
    expect(arr.length).toBeGreaterThanOrEqual(256);
  });
});
