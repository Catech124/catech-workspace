// effects/index.ts — Barrel exports + Recipe registration function
// ARC Engine — Effects category

import type { NodeRecipe } from '../recipe';
import { registerRecipe } from '../recipe';

import { renderBlur } from './blur';
import { renderDirectionalBlur } from './directional-blur';
import { renderDefocus } from './defocus';
import { renderColorGrade } from './color-grade';
import { renderHueSaturation } from './hue-saturation';
import { renderColorCurves } from './color-curves';
import { renderGlow } from './glow';
import { renderGlitch } from './glitch';
import { renderNoise } from './noise';
import { renderScanlines } from './scanlines';
import { renderVignette } from './vignette';
import { renderPixelate } from './pixelate';
import { renderSharpen } from './sharpen';
import {
  renderLumaKeyer, renderChromaKeyer, renderDeltaKeyer,
  renderHSLQualifier, renderMagicMask,
} from './keyers';

export {
  renderBlur, renderDirectionalBlur, renderDefocus,
  renderColorGrade, renderHueSaturation, renderColorCurves,
  renderGlow, renderGlitch, renderNoise, renderScanlines,
  renderVignette, renderPixelate, renderSharpen,
  renderLumaKeyer, renderChromaKeyer, renderDeltaKeyer,
  renderHSLQualifier, renderMagicMask,
};

/**
 * Register all effect node recipes.
 */
export function registerEffectRecipes(): void {
  const recipes: NodeRecipe[] = [
    // Blur
    { type: 'blur', render: renderBlur, animatableProps: ['amount'] },
    { type: 'directional-blur', render: renderDirectionalBlur, animatableProps: ['length', 'angle'] },
    { type: 'defocus', render: renderDefocus, animatableProps: ['radius', 'quality'] },

    // Color
    { type: 'color-grade', render: renderColorGrade,
      animatableProps: ['liftR', 'liftG', 'liftB', 'gammaR', 'gammaG', 'gammaB', 'gainR', 'gainG', 'gainB', 'offsetR', 'offsetG', 'offsetB', 'contrast', 'pivot'] },
    { type: 'hue-saturation', render: renderHueSaturation, animatableProps: ['hue', 'saturation', 'lightness'] },
    { type: 'color-curves', render: renderColorCurves, animatableProps: [] },

    // Glow
    { type: 'glow', render: renderGlow,
      animatableProps: ['brightness', 'threshold', 'radius', 'quality', 'mix'] },

    // Simple effects
    { type: 'glitch', render: renderGlitch, animatableProps: ['intensity', 'speed', 'blocks', 'seed'] },
    { type: 'noise', render: renderNoise, animatableProps: ['amount', 'size', 'speed'] },
    { type: 'scanlines', render: renderScanlines, animatableProps: ['opacity', 'size', 'curvature', 'flicker'] },
    { type: 'vignette', render: renderVignette, animatableProps: ['amount', 'feather', 'roundness', 'highlight'] },
    { type: 'pixelate', render: renderPixelate, animatableProps: ['size', 'ratio'] },
    { type: 'sharpen', render: renderSharpen, animatableProps: ['amount', 'radius', 'threshold'] },

    // Keyers
    { type: 'luma-keyer', render: renderLumaKeyer, animatableProps: ['low', 'high', 'softness'] },
    { type: 'chroma-keyer', render: renderChromaKeyer,
      animatableProps: ['tolerance', 'softness', 'edgeThinning', 'spillSuppress'] },
    { type: 'delta-keyer', render: renderDeltaKeyer, animatableProps: ['tolerance', 'softness'] },
    { type: 'hsl-qualifier', render: renderHSLQualifier,
      animatableProps: ['hueLow', 'hueHigh', 'satLow', 'satHigh', 'lumLow', 'lumHigh', 'softness'] },
    { type: 'magic-mask', render: renderMagicMask, animatableProps: ['tolerance', 'refine'] },
  ];

  for (const recipe of recipes) {
    registerRecipe(recipe);
  }
}
