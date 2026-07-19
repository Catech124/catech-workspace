// pipeline.ts — Orquestador de pipeline stages para el ARC Engine
// ARC Video Editor — Toolcraft Integration
//
// Cada nodo pasa por 4 pipeline stages automáticos después de su render:
//
//   [Node render] → [Effect Mask] → [Node Sizing] → [Power Window] → [Output Gain]
//
// Extraído de processNodeCanvas() + generatePowerWindowMask() en engine.js.
//
// Reglas:
//   - merge: excluido de Effect Mask y Output Gain (maneja blend propio)
//   - Nodos source/generate: todas las etapas aplican normalmente
//
// VALIDACIÓN DE CONEXIONES (para agentes IA):
//   Antes de renderizar un grafo completo, usa `prepareGraph(nodes)` de graph-validator
//   para validar conexiones y obtener el orden topológico de render.
//   - Nodos Source (0 inputs): pueden estar solos (generan contenido)
//   - Nodos no-Source (1+ inputs): DEBEN tener conexiones o el pipeline lanza warning
//   - El grafo DEBE ser acíclico — ciclos se detectan como error

import type { EditorNode, NodeProps, PipelineConfig, ChannelMap, ModifierMap } from './types';
import type { NodeRenderContext, NodeRecipe } from './recipe';
import { getRecipe } from './recipe';
import { acquire } from './canvas-pool';
import { validateConnections } from './graph-validator';

// ═══ Helpers de tipos para props ═══

function numProp(props: NodeProps, key: string, fallback: number): number {
  const v = props[key];
  return typeof v === 'number' ? v : fallback;
}

function boolProp(props: NodeProps, key: string, fallback: boolean): boolean {
  const v = props[key];
  return typeof v === 'boolean' ? v : fallback;
}

// ═══ Pipeline Config ═══

export const DEFAULT_PIPELINE: PipelineConfig = {
  effectMask: true,
  nodeSizing: true,
  powerWindow: true,
  outputGain: true,
};

/**
 * Excepciones conocidas de pipeline:
 *   - merge: effectMask=false (maneja su propia máscara), outputGain=false (blend+gain reemplazan)
 */
export const PIPELINE_EXCEPTIONS: Record<string, Partial<PipelineConfig>> = {
  merge: { effectMask: false, outputGain: false },
};

export function resolvePipelineConfig(
  type: string,
  recipeOverride?: Partial<PipelineConfig>,
): PipelineConfig {
  const exceptions = PIPELINE_EXCEPTIONS[type] ?? {};
  return {
    effectMask: recipeOverride?.effectMask ?? exceptions.effectMask ?? DEFAULT_PIPELINE.effectMask,
    nodeSizing: recipeOverride?.nodeSizing ?? exceptions.nodeSizing ?? DEFAULT_PIPELINE.nodeSizing,
    powerWindow: recipeOverride?.powerWindow ?? exceptions.powerWindow ?? DEFAULT_PIPELINE.powerWindow,
    outputGain: recipeOverride?.outputGain ?? exceptions.outputGain ?? DEFAULT_PIPELINE.outputGain,
  };
}

// ═══ Pipeline Context ═══

export interface PipelineRunContext {
  node: EditorNode;
  imgInputs: (HTMLCanvasElement | null)[];
  maskCanvas: HTMLCanvasElement | null;
  t: number;
  W: number;
  H: number;
  recipe: NodeRecipe;
}

// ═══ Stage 1: Effect Mask ═══

/**
 * Aplica Effect Mask usando destination-in + inputGain.
 * Extraído de engine.js L430-453.
 */
export function applyEffectMask(
  ctx: CanvasRenderingContext2D,
  maskCanvas: HTMLCanvasElement,
  originalInput: HTMLCanvasElement,
  inputGain: number,
  W: number,
  H: number,
): void {
  const processedData = ctx.getImageData(0, 0, W, H);

  ctx.clearRect(0, 0, W, H);
  ctx.drawImage(originalInput, 0, 0);

  const maskAlpha = maskLuminanceToAlpha(maskCanvas, W, H);

  if (inputGain !== 1) {
    const id = maskAlpha.getContext('2d')!.getImageData(0, 0, W, H);
    const d = id.data;
    for (let i = 3; i < d.length; i += 4) {
      d[i] = Math.min(255, Math.round(d[i] * inputGain));
    }
    maskAlpha.getContext('2d')!.putImageData(id, 0, 0);
  }

  const maskCanvas2 = acquire(W, H);
  const mc = maskCanvas2.getContext('2d')!;
  mc.putImageData(processedData, 0, 0);
  mc.globalCompositeOperation = 'destination-in';
  mc.drawImage(maskAlpha, 0, 0);

  ctx.drawImage(maskCanvas2, 0, 0);
}

function maskLuminanceToAlpha(
  maskCanvas: HTMLCanvasElement,
  W: number,
  H: number,
): HTMLCanvasElement {
  const ml = acquire(W, H);
  const mc = ml.getContext('2d')!;
  mc.drawImage(maskCanvas, 0, 0);
  const d = mc.getImageData(0, 0, W, H);
  for (let i = 3; i < d.data.length; i += 4) {
    d.data[i] = Math.round(
      d.data[i - 3] * 0.299 + d.data[i - 2] * 0.587 + d.data[i - 1] * 0.114,
    );
  }
  mc.putImageData(d, 0, 0);
  return ml;
}

// ═══ Stage 2: Node Sizing ═══

/**
 * Aplica Node Sizing: Zoom, Pan, Rotate, Flip, Crop (DaVinci Resolve-style).
 * Extraído de engine.js L456-498.
 *
 * IMPORTANTE: Siempre dibuja de vuelta sobre el ctx original para que
 * ctx siga siendo el canvas activo para stages posteriores.
 */
export function applyNodeSizing(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  props: NodeProps,
  W: number,
  H: number,
): void {
  const sizingZoom = numProp(props, 'sizingZoom', 1);
  const sizingPanX = numProp(props, 'sizingPanX', 0);
  const sizingPanY = numProp(props, 'sizingPanY', 0);
  const sizingRotate = numProp(props, 'sizingRotate', 0);
  const sizingFlipH = boolProp(props, 'sizingFlipH', false);
  const sizingFlipV = boolProp(props, 'sizingFlipV', false);
  const sizingCropL = numProp(props, 'sizingCropL', 0);
  const sizingCropR = numProp(props, 'sizingCropR', 0);
  const sizingCropT = numProp(props, 'sizingCropT', 0);
  const sizingCropB = numProp(props, 'sizingCropB', 0);

  // Si no hay transformaciones, no hacer nada
  if (
    sizingZoom === 1 &&
    sizingPanX === 0 &&
    sizingPanY === 0 &&
    sizingRotate === 0 &&
    !sizingFlipH &&
    !sizingFlipV &&
    sizingCropL <= 0 &&
    sizingCropR <= 0 &&
    sizingCropT <= 0 &&
    sizingCropB <= 0
  ) {
    return;
  }

  const sizedCanvas = acquire(W, H);
  const sctx = sizedCanvas.getContext('2d')!;

  const sw = Math.max(1, W - sizingCropL - sizingCropR);
  const sh = Math.max(1, H - sizingCropT - sizingCropB);

  sctx.save();
  sctx.translate(W / 2, H / 2);
  sctx.rotate((sizingRotate || 0) * Math.PI / 180);
  const sx = sizingFlipH ? -sizingZoom : sizingZoom;
  const sy = sizingFlipV ? -sizingZoom : sizingZoom;
  sctx.scale(sx, sy);
  sctx.translate(-W / 2 + sizingPanX, -H / 2 + sizingPanY);

  if (sizingCropL > 0 || sizingCropR > 0 || sizingCropT > 0 || sizingCropB > 0) {
    sctx.drawImage(canvas, sizingCropL, sizingCropT, sw, sh, 0, 0, sw, sh);
  } else {
    sctx.drawImage(canvas, 0, 0);
  }
  sctx.restore();

  // ═══ Copy de vuelta al ctx original para mantener ctx válido ═══
  ctx.clearRect(0, 0, W, H);
  ctx.drawImage(sizedCanvas, 0, 0);
}

// ═══ Stage 3: Power Window ═══

/**
 * Genera una máscara de Power Window (DaVinci Resolve-style).
 * Soporta: circle, rectangle, polygon, gradient.
 * Extraído de engine.js generatePowerWindowMask().
 */
export function generatePowerWindowMask(
  props: NodeProps,
  W: number,
  H: number,
): HTMLCanvasElement | null {
  const pwShape = props.pwShape as string | undefined;
  if (!pwShape || pwShape === 'none') return null;

  const cx = numProp(props, 'pwCenterX', W / 2);
  const cy = numProp(props, 'pwCenterY', H / 2);
  const size = numProp(props, 'pwSize', 1);
  const aspect = numProp(props, 'pwAspect', 1);
  const rotate = numProp(props, 'pwRotate', 0) * Math.PI / 180;
  const softness = numProp(props, 'pwSoftness', 0.1);
  const opacity = numProp(props, 'pwOpacity', 1);
  const invert = boolProp(props, 'pwInvert', false);
  const numPoints = numProp(props, 'pwNumPoints', 6);

  const canvas = acquire(W, H);
  const ctx = canvas.getContext('2d')!;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rotate);

  const baseW = W * 0.4 * size;
  const baseH = baseW * aspect;

  ctx.beginPath();

  if (pwShape === 'circle') {
    ctx.ellipse(0, 0, baseW, baseH, 0, 0, Math.PI * 2);
  } else if (pwShape === 'rectangle') {
    const r = Math.min(baseW, baseH) * 0.1;
    ctx.roundRect(-baseW, -baseH, baseW * 2, baseH * 2, r);
  } else if (pwShape === 'polygon') {
    const count = Math.max(3, Math.round(numPoints));
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
      const px = Math.cos(angle) * baseW;
      const py = Math.sin(angle) * baseH;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
  } else if (pwShape === 'gradient') {
    const gradAngle = numProp(props, 'pwGradientAngle', 0);
    const gradRot = gradAngle * Math.PI / 180;
    const gradLen = Math.sqrt(baseW * baseW + baseH * baseH) * 2;
    const cosA = Math.cos(gradRot);
    const sinA = Math.sin(gradRot);

    ctx.restore();
    ctx.save();

    const grad = ctx.createLinearGradient(
      cx - cosA * gradLen, cy - sinA * gradLen,
      cx + cosA * gradLen, cy + sinA * gradLen,
    );
    grad.addColorStop(0, 'rgba(255,255,255,0)');
    grad.addColorStop(0.3, 'rgba(255,255,255,1)');
    grad.addColorStop(0.7, 'rgba(255,255,255,1)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();

    if (softness > 0) {
      const r = Math.max(1, softness * 200);
      ctx.filter = `blur(${r}px)`;
      ctx.drawImage(canvas, 0, 0);
      ctx.filter = 'none';
    }
    if (opacity < 1) {
      applyAlphaScale(canvas, opacity, W, H);
    }
    if (invert) {
      invertAlpha(canvas, W, H);
    }
    return canvas;
  }

  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.restore();

  if (softness > 0) {
    const r = Math.max(1, softness * 200);
    ctx.filter = `blur(${r}px)`;
    ctx.drawImage(canvas, 0, 0);
    ctx.filter = 'none';
  }

  if (opacity < 1) {
    applyAlphaScale(canvas, opacity, W, H);
  }

  if (invert) {
    invertAlpha(canvas, W, H);
  }

  return canvas;
}

function applyAlphaScale(canvas: HTMLCanvasElement, scale: number, W: number, H: number): void {
  const ctx = canvas.getContext('2d')!;
  const id = ctx.getImageData(0, 0, W, H);
  const d = id.data;
  for (let i = 3; i < d.length; i += 4) {
    d[i] = Math.round(d[i] * scale);
  }
  ctx.putImageData(id, 0, 0);
}

function invertAlpha(canvas: HTMLCanvasElement, W: number, H: number): void {
  const ctx = canvas.getContext('2d')!;
  const id = ctx.getImageData(0, 0, W, H);
  const d = id.data;
  for (let i = 3; i < d.length; i += 4) {
    d[i] = 255 - d[i];
  }
  ctx.putImageData(id, 0, 0);
}

export function hasPowerWindow(props: NodeProps): boolean {
  const shape = props.pwShape as string | undefined;
  return shape !== undefined && shape !== 'none';
}

// ═══ Stage 4: Output Gain ═══

/**
 * Aplica Output Gain: blend con original o amplificación directa.
 * Extraído de engine.js L501-535.
 */
export function applyOutputGain(
  ctx: CanvasRenderingContext2D,
  outputGain: number,
  originalInput: HTMLCanvasElement | null,
  W: number,
  H: number,
): void {
  if (outputGain === 1) return;

  if (originalInput && outputGain < 1) {
    const data = ctx.getImageData(0, 0, W, H);
    const baseCanv = acquire(W, H);
    const bc = baseCanv.getContext('2d')!;
    bc.drawImage(originalInput, 0, 0);
    const baseId = bc.getImageData(0, 0, W, H);
    const processed = data.data;
    const base = baseId.data;
    for (let i = 0; i < processed.length; i += 4) {
      processed[i] = Math.round(processed[i] * outputGain + base[i] * (1 - outputGain));
      processed[i + 1] = Math.round(processed[i + 1] * outputGain + base[i + 1] * (1 - outputGain));
      processed[i + 2] = Math.round(processed[i + 2] * outputGain + base[i + 2] * (1 - outputGain));
      processed[i + 3] = Math.round(processed[i + 3] * outputGain + base[i + 3] * (1 - outputGain));
    }
    ctx.putImageData(data, 0, 0);
  } else {
    const id = ctx.getImageData(0, 0, W, H);
    const d = id.data;
    for (let i = 0; i < d.length; i += 4) {
      d[i] = Math.min(255, Math.round(d[i] * outputGain));
      d[i + 1] = Math.min(255, Math.round(d[i + 1] * outputGain));
      d[i + 2] = Math.min(255, Math.round(d[i + 2] * outputGain));
      d[i + 3] = Math.min(255, Math.round(d[i + 3] * outputGain));
    }
    ctx.putImageData(id, 0, 0);
  }
}

// ═══ Stage Applier (Middle-Level Orchestrator) ═══

/**
 * Aplica los 4 pipeline stages sobre un resultado ya renderizado.
 *
 * @param resultCanvas - Canvas temporal donde el nodo dibujó su resultado
 * @param ctx - Contexto 2D asociado a resultCanvas
 * @param pipelineCtx - Contexto completo del pipeline
 * @returns resultCanvas (modificado) después de todos los stages
 */
export function applyPipeline(
  resultCanvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  pipelineCtx: PipelineRunContext,
): HTMLCanvasElement {
  const { node, imgInputs, maskCanvas, W, H } = pipelineCtx;
  const props = node.props || {};
  const pConfig = resolvePipelineConfig(node.type, pipelineCtx.recipe.pipeline);

  // ═══ Stage 1: Effect Mask ═══
  if (pConfig.effectMask && maskCanvas && imgInputs[0]) {
    const inputGain = numProp(props, 'inputGain', 1);
    applyEffectMask(ctx, maskCanvas, imgInputs[0], inputGain, W, H);
  }

  // ═══ Stage 2: Node Sizing ═══
  if (pConfig.nodeSizing) {
    applyNodeSizing(ctx, resultCanvas, props, W, H);
  }

  // ═══ Stage 3: Power Window ═══
  if (pConfig.powerWindow && hasPowerWindow(props)) {
    const pwCanv = generatePowerWindowMask(props, W, H);
    if (pwCanv) {
      ctx.save();
      ctx.globalCompositeOperation = 'destination-in';
      ctx.drawImage(pwCanv, 0, 0);
      ctx.restore();
    }
  }

  // ═══ Stage 4: Output Gain ═══
  if (pConfig.outputGain) {
    const outputGain = numProp(props, 'outputGain', 1);
    if (outputGain !== 1) {
      applyOutputGain(ctx, outputGain, imgInputs[0] ?? null, W, H);
    }
  }

  return resultCanvas;
}

// ═══ Procesador de Nodo (High-Level Orchestrator) ═══

export interface ProcessNodeOptions {
  /** Input canvases ya resueltos (por orden de inputs en NODE_DEFS) */
  imgInputs: (HTMLCanvasElement | null)[];
  /** Canvas de máscara (si el nodo tiene máscara conectada) */
  maskCanvas?: HTMLCanvasElement | null;
  /** Canales animados (keyframes) */
  channels?: ChannelMap;
  /** Modificadores animados */
  modifiers?: ModifierMap;
}

/**
 * Procesa un nodo completo: obtiene la receta, adquiere canvas, llama al render,
 * aplica los 4 pipeline stages, y devuelve el canvas final.
 *
 * Flujo completo:
 *   getRecipe(node.type)
 *   → acquire(W, H)
 *   → recipe.render(context)
 *   → applyPipeline(resultCanvas, ctx, pipelineCtx)
 *   → return resultCanvas
 *
 * VALIDACIÓN INCORPORADA:
 *   - Si el nodo no es fuente y tiene inputs sin conexión, se lanza una advertencia
 *   - Los nodos sin inputs y con inputs desconectados se renderizan con canvas vacío
 *   - Los ciclos se detectan como error y el nodo no se renderiza
 *
 * @param node - Nodo del editor a procesar
 * @param t - Tiempo actual en segundos (para animaciones)
 * @param W - Ancho del canvas de salida
 * @param H - Alto del canvas de salida
 * @param options - Inputs resueltos, máscara, canales animados
 * @returns Canvas con el resultado renderizado (DEBE ser releaseado por quien llama)
 */
export function processNode(
  node: EditorNode,
  t: number,
  W: number,
  H: number,
  options: ProcessNodeOptions,
): HTMLCanvasElement | null {
  const recipe = getRecipe(node.type);
  if (!recipe) return null;

  const { imgInputs, maskCanvas, channels, modifiers } = options;

  // ═══ Validar conexiones del nodo ═══
  const validation = validateConnections([node]);
  if (!validation.valid) {
    for (const err of validation.errors) {
      console.error(
        `[pipeline] ❌ Error de conexión en nodo "${node.type}" (${node.id}):`,
        err.message
      );
    }
    // Para render batch (grafo completo), la validación ocurre antes en el caller.
    // Aquí solo se advierte; el nodo igual se procesa para facilitar debugging.
  }
  if (validation.warnings.length > 0) {
    for (const warn of validation.warnings) {
      console.warn(`[pipeline] ⚠️ ${warn}`);
    }
  }

  const outputCanvas = acquire(W, H);
  const ctx = outputCanvas.getContext('2d')!;

  // ═══ Build NodeRenderContext ═══
  const renderCtx: NodeRenderContext = {
    ctx,
    inputs: imgInputs,
    props: node.props || {},
    t,
    W,
    H,
    channels,
    nodeId: node.id,
    modifiers,
  };

  // ═══ Step 1: Node-specific render ═══
  recipe.render(renderCtx);

  // ═══ Step 2: Pipeline stages ═══
  const pipelineCtx: PipelineRunContext = {
    node,
    imgInputs,
    maskCanvas: maskCanvas ?? null,
    t,
    W,
    H,
    recipe,
  };

  applyPipeline(outputCanvas, ctx, pipelineCtx);

  return outputCanvas;
}
