// recipe.ts — NodeRecipe: el contrato que cada tipo de nodo debe implementar
// ARC Video Editor — Toolcraft Integration
//
// Cada nodo del ARC Engine tiene una "receta" que define:
//   1. Cómo se renderiza (render function)
//   2. En qué pipeline stages participa (pipeline config)
//   3. Qué props son animables (opcional)
//
// El orquestador (pipeline.ts) usa esta receta para aplicar los pipeline stages
// automáticamente después del render de cada nodo.

import type { NodeProps, ChannelMap, ModifierMap, PipelineConfig } from './types';

// ═══ Render Context ═══

/**
 * Contexto de renderizado que se pasa a la función render de cada receta.
 */
export interface NodeRenderContext {
  /** Contexto 2D del canvas donde se debe dibujar el resultado */
  ctx: CanvasRenderingContext2D;
  /** Canvases de entrada resueltos (por orden de inputs en NODE_DEFS) */
  inputs: (HTMLCanvasElement | null)[];
  /** Props del nodo (valores planos, NO evaluados con keyframes) */
  props: NodeProps;
  /** Tiempo actual en segundos */
  t: number;
  /** Ancho del canvas de salida */
  W: number;
  /** Alto del canvas de salida */
  H: number;
  /** Canales animados (keyframes) — opcional, solo si el nodo usa evalPropA */
  channels?: ChannelMap;
  /** ID del nodo actual — necesario para evalPropA */
  nodeId: string;
  /** Modificadores animados — opcional, solo si el nodo usa evalPropA */
  modifiers?: ModifierMap;
}

// ═══ Render Function ═══

/**
 * Función de render que cada nodo debe implementar.
 * Recibe el contexto y dibuja directamente en ctx.
 *
 * IMPORTANTE: La función SOLO debe dibujar la lógica específica del nodo.
 * Los pipeline stages (Effect Mask, Node Sizing, etc.) los aplica
 * pipeline.ts automáticamente.
 */
export type NodeRenderFn = (context: NodeRenderContext) => void;

// ═══ Recipe Interface ═══

/**
 * Receta de un nodo — define todo lo que el orquestador necesita saber
 * para procesar un tipo de nodo específico.
 *
 * Cada nodo en el sistema (blur, merge, loader, etc.) debe tener
 * una receta registrada en el recipe registry.
 */
export interface NodeRecipe {
  /** Identificador único del tipo de nodo (ej. 'blur', 'merge', 'loader') */
  type: string;

  /** Función de render específica del nodo */
  render: NodeRenderFn;

  /**
   * Configuración de pipeline stages.
   * Por defecto todos los stages están activos (true).
   * Excepciones conocidas:
   *   - 'merge': effectMask=false, outputGain=false
   *   - nodos source/generate: effectMask=true
   */
  pipeline?: Partial<PipelineConfig>;

  /**
   * Lista de nombres de props que son animables (usan evalPropA).
   * Si está vacío o undefined, el nodo no usa animación por keyframes.
   * Ejemplo: ['brightness', 'contrast', 'gain'] para loader
   */
  animatableProps?: string[];
}

// ═══ Recipe Registry ═══

/**
 * Registro global de recetas.
 * Cada tipo de nodo se registra aquí con su receta.
 */
const _recipeRegistry = new Map<string, NodeRecipe>();

/**
 * Registra una receta para un tipo de nodo.
 * Se debe llamar una vez al inicio (o lazy import cuando se necesite).
 */
export function registerRecipe(recipe: NodeRecipe): void {
  _recipeRegistry.set(recipe.type, recipe);
}

/**
 * Obtiene la receta para un tipo de nodo.
 * Returns undefined si el tipo no está registrado.
 */
export function getRecipe(type: string): NodeRecipe | undefined {
  return _recipeRegistry.get(type);
}

/**
 * Obtiene todas las recetas registradas.
 */
export function getAllRecipes(): NodeRecipe[] {
  return Array.from(_recipeRegistry.values());
}

/**
 * Limpia el registro de recetas (útil para tests).
 */
export function clearRecipeRegistry(): void {
  _recipeRegistry.clear();
}
