"use client";

import * as React from "react";

import { useToolcraft } from "@/toolcraft/runtime/react";
import { processNode } from "./arc-engine/pipeline";
import { excludeFromRelease, releaseAll, resetPool } from "./arc-engine/canvas-pool";
import { releaseAllImageData, releaseAllClampedArrays } from "./arc-engine/image-data-pool";
import type { EditorNode, NodeConnection, NodeInput } from "./arc-engine/types";
import type { ProcessNodeOptions } from "./arc-engine/pipeline";

// ============================================================
// Helpers
// ============================================================

/**
 * Topological sort (Kahn's algorithm) of the node graph.
 * Returns nodes in render order (dependencies first, dependents last).
 */
function topologicalSort(nodes: EditorNode[]): EditorNode[] {
  const nodeMap = new Map<string, EditorNode>();
  for (const n of nodes) nodeMap.set(n.id, n);

  const inDegree = new Map<string, number>();
  const adj = new Map<string, string[]>();

  for (const n of nodes) {
    if (!inDegree.has(n.id)) inDegree.set(n.id, 0);
    if (!adj.has(n.id)) adj.set(n.id, []);

    for (const input of n.inputs) {
      const conn = input?.connection;
      if (conn && nodeMap.has(conn.nodeId)) {
        // Edge: conn.nodeId → n.id
        const deps = adj.get(conn.nodeId);
        if (deps) deps.push(n.id);
        inDegree.set(n.id, (inDegree.get(n.id) || 0) + 1);
      }
    }
  }

  // Start with nodes that have no dependencies
  const queue: string[] = [];
  for (const [id, deg] of inDegree) {
    if (deg === 0) queue.push(id);
  }

  const sorted: EditorNode[] = [];
  while (queue.length > 0) {
    const id = queue.shift()!;
    const node = nodeMap.get(id);
    if (node) sorted.push(node);

    for (const neighbor of adj.get(id) || []) {
      const newDeg = (inDegree.get(neighbor) || 1) - 1;
      inDegree.set(neighbor, newDeg);
      if (newDeg === 0) queue.push(neighbor);
    }
  }

  // If some nodes weren't sorted (cycle), append them anyway
  if (sorted.length < nodes.length) {
    const sortedIds = new Set(sorted.map((n) => n.id));
    for (const n of nodes) {
      if (!sortedIds.has(n.id)) sorted.push(n);
    }
  }

  return sorted;
}

/**
 * Resolve input canvases for a node given the processed outputs map.
 * Returns an array matching the node's NODE_DEFS inputs by order.
 * Returns null for inputs that have no connection or unresolved output.
 */
function resolveInputs(
  node: EditorNode,
  outputs: Map<string, HTMLCanvasElement>,
): (HTMLCanvasElement | null)[] {
  return node.inputs.map((input: NodeInput) => {
    const conn: NodeConnection | undefined = input?.connection;
    if (!conn) return null;
    return outputs.get(conn.nodeId) ?? null;
  });
}

/**
 * Find the output node (node of type 'output') from the graph.
 * Falls back to the last node in topological sort order if no output node is found.
 */
function findOutputNode(nodes: EditorNode[]): EditorNode | null {
  for (const n of nodes) {
    if (n.type === "output") return n;
  }
  return nodes.length > 0 ? nodes[nodes.length - 1] : null;
}

// ============================================================
// ARC Editor Canvas Component
// ============================================================

/**
 * ARC Editor Canvas — processes the node graph through the ARC Engine
 * and renders the result to the Toolcraft canvas slot.
 *
 * Render flow per frame:
 *   1. Parse graph.nodes from Toolcraft runtime state
 *   2. Topological sort the node graph
 *   3. For each node in order: resolve inputs → processNode() → cache output
 *   4. Composite output node result onto the screen canvas
 *   5. Release all pooled canvases/ImageData back to the pool
 *   6. If playing, requestAnimationFrame for the next frame
 */
export function ArcEditorCanvas(): React.JSX.Element {
  const { state } = useToolcraft();
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const animFrameRef = React.useRef<number>(0);
  const prevCanvasSizeRef = React.useRef<{ width: number; height: number } | null>(null);

  const canvasSize = state.canvas.size;
  const currentTime = state.timeline.currentTimeSeconds;
  const isPlaying = state.timeline.isPlaying;
  const duration = state.timeline.durationSeconds;

  // Read node graph from Toolcraft runtime state
  const allValues = state.values as Record<string, unknown>;
  const rawNodes = allValues["graph.nodes"];
  const nodes: EditorNode[] = Array.isArray(rawNodes) ? (rawNodes as EditorNode[]) : [];

  const nodeCount = Array.isArray(nodes) ? nodes.length : 0;

  // ═══ Reset pool when canvas size changes ═══
  const prevSize = prevCanvasSizeRef.current;
  if (
    prevSize &&
    (prevSize.width !== canvasSize.width || prevSize.height !== canvasSize.height)
  ) {
    // Canvas size changed — discard stale pooled canvases of the old size
    resetPool();
  }
  prevCanvasSizeRef.current = { width: canvasSize.width, height: canvasSize.height };

  // ═══ Render Frame ═══
  const renderFrame = React.useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (!Array.isArray(nodes) || nodes.length === 0) {
      // Empty graph: clear canvas
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.clearRect(0, 0, canvasSize.width, canvasSize.height);
      return;
    }

    const W = canvasSize.width;
    const H = canvasSize.height;
    const t = currentTime;

    // Reset pool dimensions if canvas size changed
    // (pooled canvases of wrong size will be discarded on acquire)

    // Step 1: Topological sort
    const sorted = topologicalSort(nodes);

    // Step 2: Process each node in order
    const outputs = new Map<string, HTMLCanvasElement>();

    for (const node of sorted) {
      // Skip output node — it's a virtual node with no recipe.
      // Its inputs will be resolved below for screen compositing.
      if (node.type === "output") continue;

      const imgInputs = resolveInputs(node, outputs);

      // Build process options: inputs + optional mask canvas
      // The mask canvas is typically connected as a named input
      const options: ProcessNodeOptions = {
        imgInputs,
      };

      const result = processNode(node, t, W, H, options);
      if (result) {
        outputs.set(node.id, result);
      }
    }

    // Step 3: Composite the output node result onto the screen canvas
    const outputNode = findOutputNode(nodes);
    const screenCtx = canvas.getContext("2d");
    if (screenCtx && outputNode) {
      if (outputNode.type === "output") {
        // Output node is virtual — draw its first resolved input
        // (the composition result connected by the user)
        const bgInput = resolveInputs(outputNode, outputs)[0];
        if (bgInput) {
          screenCtx.clearRect(0, 0, W, H);
          screenCtx.drawImage(bgInput, 0, 0);
        }
      } else {
        // No output node: draw the last processed / fallback node directly
        const outputCanvas = outputs.get(outputNode.id);
        if (outputCanvas) {
          screenCtx.clearRect(0, 0, W, H);
          screenCtx.drawImage(outputCanvas, 0, 0);
        }
      }
    }

    // Step 4: Release all pooled resources
    // Exclude the screen canvas from release (it's the final output)
    excludeFromRelease(canvas);
    releaseAll();
    releaseAllImageData();
    releaseAllClampedArrays();
  }, [nodes, canvasSize, currentTime]);

  // ═══ Ref holding the latest renderFrame ═══
  // Avoids re-creating the RAF loop every time renderFrame changes (e.g. every time tick)
  const renderFrameRef = React.useRef(renderFrame);
  renderFrameRef.current = renderFrame;

  // ═══ Effect: render when state changes ═══
  React.useLayoutEffect(() => {
    renderFrameRef.current();
  }, [renderFrame]);

  // ═══ Effect: animation loop when playing ═══
  React.useLayoutEffect(() => {
    if (!isPlaying) return;

    let running = true;

    const loop = (): void => {
      if (!running) return;
      renderFrameRef.current();
      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      running = false;
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying]);
  // NOTE: only depends on [isPlaying] — reads latest renderFrame via ref

  // ═══ Cleanup on unmount ═══
  React.useEffect(() => {
    return () => {
      cancelAnimationFrame(animFrameRef.current);
      resetPool();
    };
  }, []);

  // ═══ Render debug info ═══
  return (
    <div
      className="relative flex h-full w-full items-center justify-center bg-zinc-950"
      data-arc-engine-canvas=""
    >
      {/* Canvas output surface — ARC Engine renders here */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 block"
        data-arc-engine-render=""
        data-arc-engine-canvas=""
        height={canvasSize.height}
        width={canvasSize.width}
      />

      {/* Overlay — shows state info while in development */}
      <div
        className="pointer-events-none absolute bottom-2 left-2 z-10 flex select-none flex-col gap-1 rounded bg-black/60 px-2 py-1 font-mono text-[10px] leading-tight text-white/60 backdrop-blur-sm"
        data-arc-engine-debug=""
      >
        <span>
          {canvasSize.width}&times;{canvasSize.height}
        </span>
        <span>
          {currentTime.toFixed(2)}s / {duration.toFixed(1)}s
        </span>
        <span>{isPlaying ? "▶ playing" : "⏸ paused"}</span>
        <span>{nodeCount} nodes</span>
      </div>
    </div>
  );
}
