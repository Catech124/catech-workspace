// color-grade.ts — Color Grade effect (brightness/contrast/saturation/hue)
// ARC Video Editor — Toolcraft Integration
// Fusion analog: Color Corrector (primarias)
// Inputs: 1 (Background) | Outputs: 1 (Salida)
//
// Props: brightness, contrast, saturate, hue
// Usa applyColorGrade() de shared/color-utils.ts

import type { NodeRenderContext } from '../recipe';
import { applyColorGrade } from './shared/color-utils';

export function renderColorGrade(ctx: NodeRenderContext): void {
  const { ctx: c, inputs, props, W, H } = ctx;
  const bg = inputs[0];
  if (!bg) return;

  const brightness = (props.brightness as number) ?? 1;
  const contrast = (props.contrast as number) ?? 1;
  const saturate = (props.saturate as number) ?? 1;
  const hue = (props.hue as number) ?? 0;

  c.drawImage(bg, 0, 0);
  const id = c.getImageData(0, 0, W, H);
  const d = id.data;

  for (let i = 0; i < d.length; i += 4) {
    const [r, g, b] = applyColorGrade(d[i], d[i + 1], d[i + 2], brightness, contrast, saturate, hue);
    d[i] = r;
    d[i + 1] = g;
    d[i + 2] = b;
  }

  c.putImageData(id, 0, 0);
}
