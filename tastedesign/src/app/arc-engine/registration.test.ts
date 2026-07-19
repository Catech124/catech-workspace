// registration.test.ts — Unit tests for registerAllRecipes()
import { describe, expect, it, beforeEach } from "vitest";
import { clearRecipeRegistry, getAllRecipes } from "./recipe";
import { registerAllRecipes } from "./index";
import { NODE_DEFS } from "./registry";

describe("registerAllRecipes", () => {
  beforeEach(() => {
    // Fresh registry before each test
    clearRecipeRegistry();
  });

  it("registers all 54 node recipes across 7 categories", () => {
    registerAllRecipes();

    const recipes = getAllRecipes();
    expect(recipes.length).toBe(54);
  });

  it("registers 5 source recipes", () => {
    registerAllRecipes();

    const sourceTypes = [
      "background", "loader", "image", "video", "text-plus",
    ];
    for (const type of sourceTypes) {
      expect(getAllRecipes().find((r) => r.type === type)).toBeDefined();
    }
  });

  it("registers 8 generator recipes", () => {
    registerAllRecipes();

    const genTypes = [
      "rectangle", "ellipse", "polygon", "gradient",
      "grid", "fast-noise", "procedural-shapes", "svg",
    ];
    for (const type of genTypes) {
      expect(getAllRecipes().find((r) => r.type === type)).toBeDefined();
    }
  });

  it("registers 18 effect recipes", () => {
    registerAllRecipes();

    const effectTypes = [
      "blur", "directional-blur", "defocus",
      "color-grade", "hue-saturation", "color-curves",
      "glow",
      "glitch", "noise", "scanlines", "vignette", "pixelate", "sharpen",
      "luma-keyer", "chroma-keyer", "delta-keyer",
      "hsl-qualifier", "magic-mask",
    ];
    for (const type of effectTypes) {
      expect(getAllRecipes().find((r) => r.type === type)).toBeDefined();
    }
  });

  it("registers 6 distortion recipes", () => {
    registerAllRecipes();

    const distortTypes = [
      "displacement", "corner-position", "lens-distort",
      "ripple", "stabilize", "tracker",
    ];
    for (const type of distortTypes) {
      expect(getAllRecipes().find((r) => r.type === type)).toBeDefined();
    }
  });

  it("registers 8 mask + channel recipes", () => {
    registerAllRecipes();

    const maskTypes = [
      "mask-rectangle", "mask-ellipse",
      "matte-control", "blur-matte", "erode-dilate",
      "bitmap-matte-evaluator",
      "channel-boolean", "channel-shuffle",
    ];
    for (const type of maskTypes) {
      expect(getAllRecipes().find((r) => r.type === type)).toBeDefined();
    }
  });

  it("registers 3 composite recipes", () => {
    registerAllRecipes();

    const compTypes = ["merge", "transform", "multimerge"];
    for (const type of compTypes) {
      expect(getAllRecipes().find((r) => r.type === type)).toBeDefined();
    }
  });

  it("registers 6 3D recipes", () => {
    registerAllRecipes();

    const d3Types = [
      "shape-3d", "text-3d", "image-plane-3d",
      "camera-3d", "merge-3d", "renderer-3d",
    ];
    for (const type of d3Types) {
      expect(getAllRecipes().find((r) => r.type === type)).toBeDefined();
    }
  });

  it("each recipe has a render function", () => {
    registerAllRecipes();

    for (const recipe of getAllRecipes()) {
      expect(typeof recipe.render).toBe("function");
    }
  });

  it("every recipe type maps to a NODE_DEFS or is expected to not have one", () => {
    registerAllRecipes();

    // Recipe types that deliberately have no matching NODE_DEFS:
    // - 'multimerge': compositing utility, not a standalone node def
    const noDefs = new Set(["multimerge"]);

    const recipes = getAllRecipes();
    for (const recipe of recipes) {
      if (noDefs.has(recipe.type)) continue;

      // Some recipe types use hyphen-notation while NODE_DEFS uses camelCase
      // e.g. 'color-grade' recipe ↔ 'colorgrade' NODE_DEFS
      const defType = recipe.type.replace(/-/g, "");
      const existsInDefs = NODE_DEFS[recipe.type] !== undefined ||
        NODE_DEFS[defType] !== undefined;
      expect(existsInDefs, `Recipe "${recipe.type}" has no matching NODE_DEFS`).toBe(true);
    }
  });

  it("is idempotent — calling twice registers same types", () => {
    registerAllRecipes();
    const first = getAllRecipes().map((r) => r.type).sort();

    clearRecipeRegistry();
    registerAllRecipes();
    registerAllRecipes(); // call again
    const second = getAllRecipes().map((r) => r.type).sort();

    expect(second).toEqual(first);
  });

  it("registers no duplicate types", () => {
    registerAllRecipes();

    const types = getAllRecipes().map((r) => r.type);
    const unique = new Set(types);
    expect(unique.size).toBe(types.length);
  });

  it("does not register 'text', 'soft-glow', or 'output' (no recipes for those types)", () => {
    registerAllRecipes();

    const types = getAllRecipes().map((r) => r.type);
    expect(types).not.toContain("text");
    expect(types).not.toContain("soft-glow");
    expect(types).not.toContain("output");
  });
});
