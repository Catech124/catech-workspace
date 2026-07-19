// prop-utils.ts — evalPropA() shared utility for source and generator nodes
// ARC Video Editor — Toolcraft Integration
//
// Extraída de engine-generators.js donde estaba definida inline ~12 veces.
// Ahora es la única fuente de verdad para evaluar propiedades animables
// en nodos source y generator (loader, text, background, shapes, etc.)

import { evaluateChannel, evalModifier } from '../../evaluator';
import type { ChannelMap, ModifierMap } from '../../types';

/**
 * Evalúa una propiedad animable: keyframe + modifier + fallback.
 *
 * @param nodeId - ID del nodo (se concatena con key para formar fullKey)
 * @param key - Nombre de la propiedad (ej. 'brightness', 'size', 'x')
 * @param fallback - Valor por defecto si no hay keyframes ni modifiers
 * @param channels - Mapa de canales animados (keyframes)
 * @param modifiers - Mapa de modifiers
 * @param t - Tiempo actual en segundos
 */
export function evalPropA(
  nodeId: string,
  key: string,
  fallback: number,
  channels?: ChannelMap,
  modifiers?: ModifierMap,
  t?: number,
): number {
  const fullKey = `${nodeId}_${key}`;
  const time = t ?? 0;
  const base = channels ? evaluateChannel(channels, fullKey, time) : null;
  let mod: number | null = null;
  if (modifiers && modifiers[fullKey]) {
    mod = evalModifier(modifiers[fullKey], time);
  }
  if (base === null && mod === null) return fallback;
  return (base !== null ? base : fallback) + (mod || 0);
}
