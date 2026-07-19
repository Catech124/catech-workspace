// distortion/index.ts — Barrel exports + Recipe registration
// ARC Engine — Distortion category

import type { NodeRecipe } from '../recipe';
import { registerRecipe } from '../recipe';
import { renderDisplacement } from './displacement';
import { renderCornerPosition } from './corner-position';
import { renderLensDistort } from './lens-distort';
import { renderRipple } from './ripple';
import { renderStabilize } from './stabilize';
import { renderTracker } from './tracker';

export {
  renderDisplacement, renderCornerPosition, renderLensDistort,
  renderRipple, renderStabilize, renderTracker,
};

/**
 * Register all distortion node recipes.
 */
export function registerDistortionRecipes(): void {
  const recipes: NodeRecipe[] = [
    { type: 'displacement', render: renderDisplacement, animatableProps: ['strength'] },
    { type: 'corner-position', render: renderCornerPosition, animatableProps: [] },
    { type: 'lens-distort', render: renderLensDistort, animatableProps: ['strength', 'chromStrength'] },
    { type: 'ripple', render: renderRipple, animatableProps: ['amplitude', 'frequency', 'phase', 'speed', 'decay'] },
    { type: 'stabilize', render: renderStabilize, animatableProps: ['smoothness', 'zoom'] },
    { type: 'tracker', render: renderTracker, animatableProps: [] },
  ];

  for (const recipe of recipes) {
    registerRecipe(recipe);
  }
}
