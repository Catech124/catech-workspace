// evaluator.ts — Keyframe + modifier evaluation for ARC Engine
// ARC Video Editor — Toolcraft Integration
//
// Evalúa keyframes (canales animados) y modifiers (oscilate/shake/step)
// para producir valores animados en tiempo real.
//
// Extraído de util.js y engine-generators.js del ARC Editor original.

import type { ChannelMap, Modifier, ModifierMap } from './types';

// ═══ Math Utilities ═══

export function clamp(min: number, v: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

/**
 * Cubic bezier interpolation between 4 control points.
 */
export function bezierCubic(t: number, p0: number, p1: number, p2: number, p3: number): number {
  const u = 1 - t;
  return u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3;
}

/**
 * Easing function — maps linear t [0,1] through an easing curve.
 */
export function easeValue(t: number, ease?: string): number {
  if (ease === 'easeIn') return bezierCubic(t, 0, 0.42, 1, 1);
  if (ease === 'easeOut') return bezierCubic(t, 0, 0.58, 0, 1);
  if (ease === 'easeInOut') return bezierCubic(t, 0.42, 0, 0.58, 1);
  return t;
}

// ═══ Keyframe Evaluation ═══

/**
 * Evaluate a channel's keyframes at time t.
 * Returns the interpolated value, or null if no keyframes exist.
 */
export function evaluateChannel(channels: ChannelMap, key: string, t: number): number | null {
  const ch = channels[key];
  if (!ch || !ch.length) return null;
  if (ch.length === 1) return ch[0].value;
  if (t <= ch[0].frame) return ch[0].value;
  if (t >= ch[ch.length - 1].frame) return ch[ch.length - 1].value;

  for (let i = 0; i < ch.length - 1; i++) {
    if (t >= ch[i].frame && t <= ch[i + 1].frame) {
      const segLen = ch[i + 1].frame - ch[i].frame;
      if (segLen <= 0) return ch[i].value;
      const lt = (t - ch[i].frame) / segLen;
      const eased = easeValue(lt, ch[i].ease || 'linear');
      return ch[i].value + (ch[i + 1].value - ch[i].value) * eased;
    }
  }
  return ch[ch.length - 1].value;
}

// ═══ Modifier Evaluation ═══

/**
 * Oscillate modifier: sinusoidal oscillation.
 * offset + amplitude * sin(t * frequency + phase)
 */
export function evalOscillate(p: Modifier & { type: 'oscillate' }, t: number): number {
  return (p.offset || 0) + (p.amplitude || 1) * Math.sin(t * (p.frequency || 1) + (p.phase || 0));
}

/**
 * Internal smooth noise function — used by evalShake.
 * Based on hashNoise/smoothNoise from noise.js.
 */
function smoothNoise2D(x: number): number {
  const ix = Math.floor(x);
  const fx = x - ix;
  const sx = fx * fx * (3 - 2 * fx);

  function hashNoise(ix: number): number {
    let n = (ix * 374761393 + 668265263) & 0x7fffffff;
    n = (n ^ (n >> 13)) * 1274126177;
    return (n & 0x7fffffff) / 0x7fffffff;
  }

  return hashNoise(ix) * (1 - sx) + hashNoise(ix + 1) * sx;
}

/**
 * Shake modifier: pseudo-random but smooth variation.
 * offset + noise(t * frequency) * amplitude
 */
export function evalShake(p: Modifier & { type: 'shake' }, t: number): number {
  const freq = p.frequency || 5;
  const amp = p.amplitude || 1;
  const offset = p.offset || 0;
  const noise =
    smoothNoise2D(t * freq) * 0.6 +
    smoothNoise2D(t * freq * 2.1) * 0.3 +
    smoothNoise2D(t * freq * 4.3) * 0.1;
  return offset + (noise - 0.5) * 2 * amp;
}

/**
 * Step modifier: square wave oscillation.
 * offset + (±amplitude) based on duty cycle.
 */
export function evalStep(p: Modifier & { type: 'step' }, t: number): number {
  const offset = p.offset || 0;
  const amplitude = p.amplitude || 1;
  const frequency = p.frequency || 1;
  const dutyCycle = p.dutyCycle !== undefined ? p.dutyCycle : 0.5;
  const phase = p.phase || 0;
  const cyclePos = ((t * frequency + phase / (Math.PI * 2)) % 1 + 1) % 1;
  const high = cyclePos < dutyCycle;
  return offset + (high ? amplitude : -amplitude);
}

/**
 * Dispatch to the correct modifier evaluator based on type.
 */
export function evalModifier(mod: Modifier, t: number): number | null {
  if (!mod || !mod.type) return null;
  if (mod.type === 'oscillate') return evalOscillate(mod, t);
  if (mod.type === 'shake') return evalShake(mod, t);
  if (mod.type === 'step') return evalStep(mod, t);
  return null;
}

/**
 * Combined keyframe + modifier evaluation.
 * Returns: keyframe value + modifier value, or the static fallback.
 */
export function evalProp(
  channels: ChannelMap,
  modifiers: ModifierMap,
  key: string,
  t: number,
  staticVal: number,
): number {
  const base = evaluateChannel(channels, key, t);
  const mod = modifiers[key] ? evalModifier(modifiers[key], t) : null;
  if (base === null && mod === null) return staticVal;
  return (base !== null ? base : staticVal) + (mod || 0);
}
