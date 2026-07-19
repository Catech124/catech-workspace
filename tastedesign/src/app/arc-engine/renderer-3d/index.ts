// renderer-3d/index.ts — Barrel exports + Recipe registration
// ARC Engine — 3D category

import type { NodeRecipe } from '../recipe';
import { registerRecipe } from '../recipe';
import { renderShape3D, renderText3D, renderImagePlane3D, renderCamera3D, renderMerge3D, renderRenderer3D } from './nodes';

export { renderShape3D, renderText3D, renderImagePlane3D, renderCamera3D, renderMerge3D, renderRenderer3D };
export * from './math';
export * from './primitives';
export * from './camera';
export * from './lighting';
export * from './rasterizer';

/**
 * Register all 3D node recipes.
 */
export function register3DRecipes(): void {
  const recipes: NodeRecipe[] = [
    { type: 'shape-3d', render: renderShape3D, animatableProps: [] },
    { type: 'text-3d', render: renderText3D, animatableProps: [] },
    { type: 'image-plane-3d', render: renderImagePlane3D, animatableProps: [] },
    { type: 'camera-3d', render: renderCamera3D, animatableProps: [] },
    { type: 'merge-3d', render: renderMerge3D, animatableProps: [] },
    { type: 'renderer-3d', render: renderRenderer3D, animatableProps: ['ambient'] },
  ];

  for (const recipe of recipes) {
    registerRecipe(recipe);
  }
}
