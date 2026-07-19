// sources/index.ts — Barrel exports + recipe registrations for Source nodes
// ARC Video Editor — Toolcraft Integration

import type { NodeRecipe } from '../recipe';
import { registerRecipe } from '../recipe';
import { renderBackground } from './background';
import { renderImageLoader } from './image-loader';
import { renderVideoLoader } from './video-loader';
import { renderText } from './text';

export { renderBackground } from './background';
export { renderImageLoader } from './image-loader';
export { renderVideoLoader } from './video-loader';
export { renderText } from './text';

/**
 * Register all source node recipes.
 */
export function registerSourceRecipes(): void {
  const recipes: NodeRecipe[] = [
    {
      type: 'background',
      render: renderBackground,
      pipeline: { effectMask: true, nodeSizing: false, powerWindow: false, outputGain: true },
      animatableProps: [],
    },
    {
      type: 'loader',
      render: renderImageLoader,
      animatableProps: ['brightness', 'contrast', 'gain'],
    },
    {
      type: 'image',
      render: renderImageLoader,
      animatableProps: ['brightness', 'contrast', 'gain'],
    },
    {
      type: 'video',
      render: renderVideoLoader,
      animatableProps: ['opacity'],
    },
    {
      type: 'text-plus',
      render: renderText,
      animatableProps: [
        'size', 'tracking', 'leading', 'x', 'y', 'rotation', 'opacity',
        'vAnchorOffset', 'hAnchorOffset', 'writeOnStart', 'writeOnEnd',
      ],
    },
  ];

  for (const recipe of recipes) {
    registerRecipe(recipe);
  }
}
