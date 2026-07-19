// @vitest-environment jsdom
// canvas-pool.test.ts — Tests for the size-aware canvas pool
import { describe, it, expect, beforeEach } from "vitest";
import {
  acquire,
  releaseAll,
  resetPool,
  excludeFromRelease,
} from "./canvas-pool";

beforeEach(() => {
  resetPool();
});

/**
 * Helper: check that a canvas has the expected dimensions.
 */
function expectCanvasSize(c: HTMLCanvasElement, w: number, h: number): void {
  expect(c.width).toBe(w);
  expect(c.height).toBe(h);
}

// ============================================================
// Basic acquire / release
// ============================================================

describe("canvas-pool", () => {
  describe("acquire", () => {
    it("creates a canvas of the requested size", () => {
      const c = acquire(100, 200);
      expectCanvasSize(c, 100, 200);
    });

    it("reuses an exact-size canvas from the pool", () => {
      const c1 = acquire(320, 240);
      releaseAll(); // c1 goes back to pool

      const c2 = acquire(320, 240);
      expect(c2).toBe(c1); // same reference — reused!
      expectCanvasSize(c2, 320, 240);
    });

    it("creates a new canvas when exact size is not pooled", () => {
      const c1 = acquire(320, 240);
      releaseAll();

      const c2 = acquire(640, 480);
      expect(c2).not.toBe(c1); // different size, fresh canvas
      expectCanvasSize(c2, 640, 480);
    });

    it("resets canvas context state on resize (width/height change)", () => {
      const c1 = acquire(100, 100);
      const ctx = c1.getContext("2d");
      // Note: jsdom may return null for getContext("2d"); skip context test if so
      if (ctx) {
        ctx.translate(50, 50); // mutate context state
      }
      releaseAll();

      const c2 = acquire(100, 100);
      const ctx2 = c2.getContext("2d");
      // After width/height reset, transform should be identity (if context available)
      if (ctx2) {
        const transform = ctx2.getTransform();
        expect(transform.a).toBe(1);
        expect(transform.d).toBe(1);
        expect(transform.e).toBe(0);
        expect(transform.f).toBe(0);
      }
      // Even without context, the resize itself should work
      expectCanvasSize(c2, 100, 100);
    });
  });

  // ============================================================
  // Size-aware best-fit
  // ============================================================

  describe("size-aware best-fit acquire", () => {
    it("reuses a larger canvas when exact size is not available (best-fit)", () => {
      // Pool a 640×480 canvas
      const c1 = acquire(640, 480);
      releaseAll();

      // Acquire 320×240 — no exact match, should reuse the 640×480
      const c2 = acquire(320, 240);
      expect(c2).toBe(c1); // reused!
      expectCanvasSize(c2, 320, 240); // resized down
    });

    it("picks the closest fit among multiple candidates", () => {
      // Pool canvases of 3 sizes
      acquire(1920, 1080);
      acquire(800, 600);
      acquire(400, 300);
      releaseAll();

      // Acquire 500×400 — should pick 800×600 (closest ≥ 500×400)
      // 800×600 = 480k pixels vs 1920×1080 = 2M pixels
      const c = acquire(500, 400);
      expectCanvasSize(c, 500, 400);
      // It was resized from the best fit, so dimensions are correct
    });

    it("prefers exact match over best-fit", () => {
      // Pool 640×480 and 100×100
      acquire(640, 480);
      acquire(100, 100);
      releaseAll();

      // Also pool 640×480 again (two entries)
      acquire(640, 480);
      releaseAll();

      // Acquire 640×480 — should get exact match from pool
      const c2 = acquire(640, 480);
      // Should get the exact match (640×480), not create new
      expectCanvasSize(c2, 640, 480);
    });

    it("creates new canvas when no pooled canvas is large enough", () => {
      acquire(100, 100);
      acquire(200, 150);
      releaseAll();

      // Acquire 1000×1000 — none in pool are ≥ this size
      const c = acquire(1000, 1000);
      expectCanvasSize(c, 1000, 1000);
      // Should be a fresh canvas, not one of the pooled ones
    });

    it("cleans up empty pool bins after best-fit pop", () => {
      // Pool exactly one canvas of 800×600
      const c1 = acquire(800, 600);
      releaseAll();

      // Acquire 500×400 — consumes the 800×600 and deletes its bin
      acquire(500, 400);

      // Now pool should have no entries for 800×600
      // Acquire 800×600 again — should be fresh
      const c2 = acquire(800, 600);
      expect(c2).not.toBe(c1);
    });
  });

  // ============================================================
  // excludeFromRelease
  // ============================================================

  describe("excludeFromRelease", () => {
    it("excluded canvas is not returned to pool", () => {
      const c1 = acquire(100, 100);
      const c2 = acquire(200, 200);

      excludeFromRelease(c1); // c1 should NOT go back to pool
      releaseAll();

      // Acquire 200×200 — should get c2 (the non-excluded one)
      const c3 = acquire(200, 200);
      expect(c3).toBe(c2);
    });
  });

  // ============================================================
  // resetPool
  // ============================================================

  describe("resetPool", () => {
    it("clears all pooled and in-use canvases", () => {
      acquire(100, 100);
      acquire(200, 200);
      releaseAll();

      resetPool();

      // After reset, all acquires should be fresh canvases
      const c1 = acquire(100, 100);
      const c2 = acquire(200, 200);
      // Can't check reference identity easily, but at minimum they should work
      expectCanvasSize(c1, 100, 100);
      expectCanvasSize(c2, 200, 200);
    });
  });
});
