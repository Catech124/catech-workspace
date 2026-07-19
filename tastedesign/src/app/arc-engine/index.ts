// index.ts — ARC Engine barrel exports
// ARC Video Editor — Toolcraft Integration

export * from './types';
export * from './evaluator';
export * from './canvas-pool';
export * from './image-data-pool';
export * from './registry';
export * from './sources/shared/prop-utils';
export * from './recipe';
export * from './pipeline';
export * from './sources/background';
export * from './sources/image-loader';
export * from './sources/video-loader';
export * from './sources/audio-loader';
export * from './sources/text';

// Generators
export * from './generators/shapes';
export * from './generators/gradient';
export * from './generators/grid';
export * from './generators/fast-noise';
export * from './generators/procedural-shapes';
export * from './generators/svg';

// Effects
export * from './effects/blur';
export * from './effects/directional-blur';
export * from './effects/defocus';
export * from './effects/color-grade';
export * from './effects/hue-saturation';
export * from './effects/color-curves';
export * from './effects/glow';
export * from './effects/glitch';
export * from './effects/noise';
export * from './effects/scanlines';
export * from './effects/vignette';
export * from './effects/pixelate';
export * from './effects/sharpen';
export * from './effects/keyers';
export * from './effects/shared/blur';
export * from './effects/shared/color-utils';
export * from './effects/shared/glow-utils';

export { registerEffectRecipes } from './effects';

// Distortion
export * from './distortion/displacement';
export * from './distortion/corner-position';
export * from './distortion/lens-distort';
export * from './distortion/ripple';
export * from './distortion/stabilize';
export * from './distortion/tracker';

export { registerDistortionRecipes } from './distortion';

// Masks
export * from './masks/mask-rectangle';
export * from './masks/mask-ellipse';
export * from './masks/matte-control';
export * from './masks/blur-matte';
export * from './masks/erode-dilate';
export * from './masks/bitmap-matte-evaluator';
export * from './masks/channel-boolean';
export * from './masks/channel-shuffle';

export { registerMaskRecipes } from './masks';

// Composite
export * from './composite/merge';
export * from './composite/transform';
export * from './composite/multimerge';

export { registerCompositeRecipes } from './composite';

// 3D
export * from './renderer-3d/math';
export * from './renderer-3d/primitives';
export * from './renderer-3d/camera';
export * from './renderer-3d/lighting';
export * from './renderer-3d/rasterizer';
export * from './renderer-3d/nodes';

export { register3DRecipes } from './renderer-3d';

import { registerSourceRecipes } from './sources';
import { registerGeneratorRecipes } from './generators';
import { registerEffectRecipes } from './effects';
import { registerDistortionRecipes } from './distortion';
import { registerMaskRecipes } from './masks';
import { registerCompositeRecipes } from './composite';
import { register3DRecipes as _register3D } from './renderer-3d';

/**
 * Register all ARC Engine node recipes with the recipe registry.
 * Must be called once at app startup, before any node is rendered.
 */
export function registerAllRecipes(): void {
  registerSourceRecipes();   // background, loader, image, video, text-plus
  registerGeneratorRecipes(); // rectangle, ellipse, polygon, gradient, grid, fast-noise, procedural-shapes, svg
  registerEffectRecipes();   // blur, directional-blur, defocus, color-grade, hue-saturation, color-curves, glow, glitch, noise, scanlines, vignette, pixelate, sharpen, luma-keyer, chroma-keyer, delta-keyer, hsl-qualifier, magic-mask
  registerDistortionRecipes(); // displacement, corner-position, lens-distort, ripple, stabilize, tracker
  registerMaskRecipes();     // mask-rectangle, mask-ellipse, matte-control, blur-matte, erode-dilate, bitmap-matte-evaluator, channel-boolean, channel-shuffle
  registerCompositeRecipes(); // merge, transform, multimerge
  _register3D();             // shape-3d, text-3d, image-plane-3d, camera-3d, merge-3d, renderer-3d
}
