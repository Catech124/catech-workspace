/**
 * graph-validator.ts — Validación de conexiones y orden topológico del grafo de nodos.
 *
 * PROPÓSITO:
 *   Garantizar que el grafo de nodos esté correctamente conectado antes de renderizar.
 *   Todo nodo que no sea fuente (source) debe tener sus inputs conectados.
 *   El pipeline resuelve el orden topológico automáticamente.
 *
 * USO (para agentes IA):
 *   1. Antes de renderizar, llama a `validateConnections(nodes, registry)`
 *   2. Si devuelve errores, NO renderices — corrige las conexiones primero
 *   3. Usa `topologicalSort(nodes)` para obtener el orden de render correcto
 *
 * REGLAS:
 *   - Nodos Source (inputs.length === 0): pueden estar desconectados (generan contenido)
 *   - Nodos no-Source (inputs.length > 0): CADA input DEBE tener una conexión o error
 *   - Excepción: nodos con inputs opcionales (futuro) pueden tener conexión nula
 *   - Ciclos: se detectan y reportan como error
 */

import type { EditorNode } from './types';
import { getNodeDef } from './registry';

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

export interface ConnectionError {
  nodeId: string;
  nodeType: string;
  inputIndex: number;
  inputName: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ConnectionError[];
  warnings: string[];
}

// ---------------------------------------------------------------------------
// Validación de conexiones
// ---------------------------------------------------------------------------

/**
 * Valida que todos los nodos no-fuente tengan sus inputs conectados.
 *
 * @param nodes - Array de nodos del grafo
 * @returns ValidationResult con errores si hay conexiones faltantes
 */
export function validateConnections(
  nodes: EditorNode[],
): ValidationResult {
  const errors: ConnectionError[] = [];
  const warnings: string[] = [];
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  // Detectar ciclos
  const cycleErrors = detectCycles(nodes);
  if (cycleErrors.length > 0) {
    errors.push(...cycleErrors);
    return { valid: false, errors, warnings };
  }

  for (const node of nodes) {
    const def = getNodeDef(node.type);
    if (!def) {
      warnings.push(`Nodo "${node.id}" tipo "${node.type}" no tiene NodeDef registrado`);
      continue;
    }

    // Los nodos Source (0 inputs) no necesitan conexiones
    if (!def.inputs || def.inputs.length === 0) {
      continue;
    }

    // Validar cada input del nodo
    for (let i = 0; i < def.inputs.length; i++) {
      const inputName = def.inputs[i];
      const nodeInput = node.inputs?.[i];

      if (!nodeInput || !nodeInput.connection || !nodeInput.connection.nodeId) {
        errors.push({
          nodeId: node.id,
          nodeType: node.type,
          inputIndex: i,
          inputName,
          message: `Nodo "${node.type}" (${node.id}) — input #${i} "${inputName}" no tiene conexión. ` +
            `Los nodos de tipo "${node.type}" REQUIEREN una conexión en su input "${inputName}". ` +
            `Conecta este input a la salida de otro nodo antes de renderizar.`,
        });
        continue;
      }

      // Verificar que el nodo origen existe en el grafo
      const sourceNodeId = nodeInput.connection.nodeId;
      if (!nodeMap.has(sourceNodeId)) {
        errors.push({
          nodeId: node.id,
          nodeType: node.type,
          inputIndex: i,
          inputName,
          message: `Nodo "${node.type}" (${node.id}) — input #${i} "${inputName}" apunta al nodo ` +
            `"${sourceNodeId}" que NO existe en el grafo. Verifica el ID del nodo origen.`,
        });
      }
    }
  }

  // Advertencia para nodos aislados (sin conexiones de entrada ni salida)
  const connectedNodeIds = new Set<string>();
  for (const node of nodes) {
    for (const input of node.inputs || []) {
      if (input.connection?.nodeId) {
        connectedNodeIds.add(input.connection.nodeId);
        connectedNodeIds.add(node.id);
      }
    }
  }
  for (const node of nodes) {
    const def = getNodeDef(node.type);
    if (def && def.inputs && def.inputs.length > 0 && !connectedNodeIds.has(node.id)) {
      warnings.push(
        `Nodo "${node.type}" (${node.id}) no está conectado a nada — está flotando en el grafo. ` +
        `Los nodos aislados no se renderizan.`
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

// ---------------------------------------------------------------------------
// Detección de ciclos
// ---------------------------------------------------------------------------

function detectCycles(nodes: EditorNode[]): ConnectionError[] {
  const errors: ConnectionError[] = [];
  const visited = new Set<string>();
  const inStack = new Set<string>();

  function dfs(nodeId: string): boolean {
    if (inStack.has(nodeId)) return true;
    if (visited.has(nodeId)) return false;

    visited.add(nodeId);
    inStack.add(nodeId);

    const node = nodes.find((n) => n.id === nodeId);
    if (node) {
      for (const input of node.inputs || []) {
        if (input.connection?.nodeId) {
          if (dfs(input.connection.nodeId)) {
            errors.push({
              nodeId: node.id,
              nodeType: node.type,
              inputIndex: node.inputs?.indexOf(input) ?? 0,
              inputName: '',
              message: `Ciclo detectado: el nodo "${node.type}" (${node.id}) forma parte de un ciclo. ` +
                `Los grafos de nodos DEBEN ser acíclicos. Revisa las conexiones.`,
            });
            return true;
          }
        }
      }
    }

    inStack.delete(nodeId);
    return false;
  }

  for (const node of nodes) {
    if (!visited.has(node.id)) {
      dfs(node.id);
    }
  }

  return errors;
}

// ---------------------------------------------------------------------------
// Orden topológico (Kahn's algorithm)
// ---------------------------------------------------------------------------

/**
 * Ordena los nodos topológicamente para que se rendericen en el orden correcto.
 * Los Source nodes (sin inputs) primero, luego los que dependen de ellos.
 *
 * @param nodes - Array de nodos del grafo
 * @returns Nodos ordenados topológicamente (source → effect → composite → output)
 */
export function topologicalSort(nodes: EditorNode[]): EditorNode[] {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const inDegree = new Map<string, number>();
  const adjacency = new Map<string, string[]>();

  // Inicializar
  for (const node of nodes) {
    inDegree.set(node.id, 0);
    adjacency.set(node.id, []);
  }

  // Construir grafo dirigido: edge from source → target
  // Si A.inputs[0].connection.nodeId = B, entonces B produce output que A consume
  // Orden de render: B primero, luego A
  // Así que edge: B → A (B debe renderizarse antes que A)
  for (const node of nodes) {
    for (const input of node.inputs || []) {
      if (input.connection?.nodeId) {
        const sourceId = input.connection.nodeId;
        if (nodeMap.has(sourceId)) {
          adjacency.get(sourceId)!.push(node.id);
          inDegree.set(node.id, (inDegree.get(node.id) || 0) + 1);
        }
      }
    }
  }

  // Kahn's algorithm
  const queue: string[] = [];
  for (const [id, degree] of inDegree) {
    if (degree === 0) queue.push(id);
  }

  const sorted: EditorNode[] = [];
  while (queue.length > 0) {
    const id = queue.shift()!;
    const node = nodeMap.get(id);
    if (node) sorted.push(node);

    for (const neighbor of adjacency.get(id) || []) {
      const newDegree = (inDegree.get(neighbor) || 1) - 1;
      inDegree.set(neighbor, newDegree);
      if (newDegree === 0) queue.push(neighbor);
    }
  }

  // Si hay nodos que no se incluyeron, hay un ciclo
  if (sorted.length < nodes.length) {
    console.warn(
      `[graph-validator] ⚠️ No se pudieron ordenar ${nodes.length - sorted.length} nodo(s). ` +
      `Posible ciclo en el grafo. Los nodos no ordenados se agregarán al final.`
    );
    const sortedIds = new Set(sorted.map((n) => n.id));
    for (const node of nodes) {
      if (!sortedIds.has(node.id)) sorted.push(node);
    }
  }

  return sorted;
}

/**
 * Función principal para preparar un grafo de nodos para render.
 * Valida conexiones y retorna el orden topológico.
 *
 * @param nodes - Array de nodos del grafo
 * @returns { sorted: EditorNode[], errors: ConnectionError[], warnings: string[] }
 */
export function prepareGraph(
  nodes: EditorNode[],
): {
  sorted: EditorNode[];
  errors: ConnectionError[];
  warnings: string[];
} {
  // 1. Validar conexiones
  const validation = validateConnections(nodes);

  // 2. Orden topológico (aún con errores, para debugging)
  const sorted = topologicalSort(nodes);

  return {
    sorted,
    errors: validation.errors,
    warnings: validation.warnings,
  };
}
