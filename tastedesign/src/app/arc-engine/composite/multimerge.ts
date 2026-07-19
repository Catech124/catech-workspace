// multimerge.ts — MultiMerge: N-input stacking with per-layer opacity and blend mode
// ARC Engine
// New node (not in original ARC Editor). Stacks any number of inputs sequentially,
// each with independent opacity and blend mode.

import type { NodeRenderContext } from '../recipe';

export interface MultiMergeInputProps {
  id: string;
  opacity: number;
  mode: string;
  enabled: boolean;
}

export function renderMultiMerge(ctx: NodeRenderContext): void {
  const { ctx: c, props, inputs } = ctx;

  if (inputs.length === 0) return;

  // First input is the base (drawn without blend)
  const base = inputs[0];
  if (base) c.drawImage(base, 0, 0);

  // Stack remaining inputs with their per-layer props
  const inputProps = (props.inputs as MultiMergeInputProps[]) || [];

  for (let i = 1; i < inputs.length; i++) {
    const layer = inputs[i];
    if (!layer) continue;

    const layerProps = inputProps[i];
    if (layerProps && !layerProps.enabled) continue;

    const opacity = layerProps?.opacity ?? 1;
    const mode = layerProps?.mode || 'source-over';

    c.save();
    c.globalAlpha = opacity;
    c.globalCompositeOperation = mode as GlobalCompositeOperation;
    c.drawImage(layer, 0, 0);
    c.restore();
  }

  c.globalAlpha = 1;
  c.globalCompositeOperation = 'source-over';
}
