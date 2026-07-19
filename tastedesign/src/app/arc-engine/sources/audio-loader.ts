// audio-loader.ts — Loader node for audio
// ARC Video Editor — Toolcraft Integration
//
// Shows a visual placeholder for audio files (waveform visualization placeholder).
// Fusion analog: Loader (MediaIn)
// Inputs: 0 | Outputs: 1 (Salida)
//
// Props:
//   src: string — URL del audio
//   gain: number (0+, animable)

import type { NodeRenderContext } from '../recipe';

export function renderAudioLoader(ctx: NodeRenderContext): void {
  const { ctx: c, props, W, H, t } = ctx;
  const src = (props.src as string) || '';
  if (!src) {
    c.fillStyle = '#1a1a1a';
    c.fillRect(0, 0, W, H);
    c.fillStyle = '#666';
    c.font = '24px sans-serif';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText('🎵 Drop audio here', W / 2, H / 2);
    return;
  }

  // Draw audio waveform visualization placeholder
  c.fillStyle = '#1a1a1a';
  c.fillRect(0, 0, W, H);

  // Waveform placeholder visualization
  const bars = 64;
  const barW = (W - 40) / bars;
  const maxH = H * 0.6;
  const baseY = H / 2;

  c.fillStyle = '#4a9a6a';
  for (let i = 0; i < bars; i++) {
    const barH = (Math.sin(i * 0.5 + (t ?? 0) * 2) * 0.5 + 0.5) * maxH;
    const x = 20 + i * barW;
    c.fillRect(x, baseY - barH / 2, barW - 1, barH);
  }

  // Audio info
  c.fillStyle = '#888';
  c.font = '14px sans-serif';
  c.textAlign = 'center';
  c.textBaseline = 'bottom';
  const filename = src.split('/').pop() || src.split('\\').pop() || src;
  c.fillText(`🔊 ${filename}`, W / 2, H - 20);
}
