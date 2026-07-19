// masks/index.ts — Barrel exports + Recipe registration
// ARC Engine — Mask category

import type { NodeRecipe } from '../recipe';
import { registerRecipe } from '../recipe';
import { renderMaskRect } from './mask-rectangle';
import { renderMaskEllipse } from './mask-ellipse';
import { renderMatteControl } from './matte-control';
import { renderBlurMatte } from './blur-matte';
import { renderErodeDilate } from './erode-dilate';
import { renderBitmapMatte } from './bitmap-matte-evaluator';
import { renderChannelBoolean } from './channel-boolean';
import { renderChannelShuffle } from './channel-shuffle';

export {
  renderMaskRect, renderMaskEllipse, renderMatteControl,
  renderBlurMatte, renderErodeDilate, renderBitmapMatte,
  renderChannelBoolean, renderChannelShuffle,
};

/**
 * Register all mask node recipes.
 */
export function registerMaskRecipes(): void {
  const recipes: NodeRecipe[] = [
    { type: 'mask-rectangle', render: renderMaskRect, animatableProps: [] },
    { type: 'mask-ellipse', render: renderMaskEllipse, animatableProps: [] },
    { type: 'matte-control', render: renderMatteControl, animatableProps: ['low', 'high', 'gamma', 'contrast', 'brightness'] },
    { type: 'blur-matte', render: renderBlurMatte, animatableProps: ['radius', 'iterations', 'threshold'] },
    { type: 'erode-dilate', render: renderErodeDilate, animatableProps: ['radius'] },
    { type: 'bitmap-matte-evaluator', render: renderBitmapMatte, animatableProps: [] },
    { type: 'channel-boolean', render: renderChannelBoolean, animatableProps: [] },
    { type: 'channel-shuffle', render: renderChannelShuffle, animatableProps: [] },
  ];

  for (const recipe of recipes) {
    registerRecipe(recipe);
  }
}
