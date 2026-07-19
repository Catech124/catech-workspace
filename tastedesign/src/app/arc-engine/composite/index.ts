// composite/index.ts — Barrel exports + Recipe registration
// ARC Engine — Composite category

import type { NodeRecipe } from '../recipe';
import { registerRecipe } from '../recipe';
import { renderMerge } from './merge';
import { renderTransform } from './transform';
import { renderMultiMerge } from './multimerge';

export { renderMerge, renderTransform, renderMultiMerge };

/**
 * Register all composite node recipes.
 */
export function registerCompositeRecipes(): void {
  const recipes: NodeRecipe[] = [
    { type: 'merge', render: renderMerge, animatableProps: ['blend', 'gain', 'centerX', 'centerY', 'size', 'angle'] },
    { type: 'transform', render: renderTransform, animatableProps: ['centerX', 'centerY', 'size', 'angle'] },
    { type: 'multimerge', render: renderMultiMerge, animatableProps: [] },
  ];

  for (const recipe of recipes) {
    registerRecipe(recipe);
  }
}
