// generators/index.ts — Barrel exports + recipe registrations for Generator nodes
// ARC Video Editor — Toolcraft Integration

import type { NodeRecipe } from '../recipe';
import { registerRecipe } from '../recipe';
import { renderRectangle, renderEllipse, renderPolygon } from './shapes';
import { renderGradient } from './gradient';
import { renderGrid } from './grid';
import { renderFastNoise } from './fast-noise';
import { renderProceduralShapes } from './procedural-shapes';
import { renderSvg } from './svg';

export { renderRectangle, renderEllipse, renderPolygon } from './shapes';
export { renderGradient } from './gradient';
export { renderGrid } from './grid';
export { renderFastNoise } from './fast-noise';
export { renderProceduralShapes } from './procedural-shapes';
export { renderSvg } from './svg';

/**
 * Register all generator node recipes.
 */
export function registerGeneratorRecipes(): void {
  const recipes: NodeRecipe[] = [
    {
      type: 'rectangle',
      render: renderRectangle,
      animatableProps: ['x', 'y', 'width', 'height'],
    },
    {
      type: 'ellipse',
      render: renderEllipse,
      animatableProps: ['cx', 'cy', 'rx', 'ry'],
    },
    {
      type: 'polygon',
      render: renderPolygon,
      animatableProps: ['cx', 'cy', 'radius', 'sides', 'starRatio'],
    },
    {
      type: 'gradient',
      render: renderGradient,
      animatableProps: ['angle'],
    },
    {
      type: 'grid',
      render: renderGrid,
      animatableProps: ['columns', 'rows', 'gap', 'lineWidth'],
    },
    {
      type: 'fast-noise',
      render: renderFastNoise,
      animatableProps: ['scale', 'seed', 'time', 'brightness', 'contrast'],
    },
    {
      type: 'procedural-shapes',
      render: renderProceduralShapes,
      animatableProps: ['count', 'sizeMin', 'sizeMax', 'opacity', 'speed', 'seed'],
    },
    {
      type: 'svg',
      render: renderSvg,
      animatableProps: [],
    },
  ];

  for (const recipe of recipes) {
    registerRecipe(recipe);
  }
}
