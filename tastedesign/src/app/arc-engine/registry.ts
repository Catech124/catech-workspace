// registry.ts — Node type registry for ARC Engine
// ARC Video Editor — Toolcraft Integration
//
// Define todos los tipos de nodo disponibles en el sistema, incluyendo
// props por defecto, inputs, outputs, colores e íconos.
// Extraído de NODE_DEFS en engine.js.

import type { NodeDef } from './types';

/**
 * Registro central de todos los tipos de nodo.
 * Cada entrada define metadatos, valores por defecto, y conexiones.
 *
 * Categorías: source, generate, effects, blur, color, keyer, distort,
 * mask, channel, composite, transform, 3d, output
 */
export const NODE_DEFS: Record<string, NodeDef> = {
  // ═══ Source ═══
  background: {
    name: 'Fondo', color: '#4a4a4a', icon: '🖌️', cat: 'source',
    desc: 'Genera un fondo sólido o degradado', toolbar: false,
    inputs: [], maskInput: true, outputs: ['Salida'],
    props: { type: 'solid', topColor: '#1a1a1a', bottomColor: '#0a0a0a' },
  },
  image: {
    name: 'Imagen', color: '#5a7a4a', icon: '🖼️', cat: 'source',
    desc: 'Carga una imagen desde URL', toolbar: false,
    inputs: [], maskInput: true, outputs: ['Salida'],
    props: { src: '', brightness: 1, contrast: 1, gain: 1 },
  },
  text: {
    name: 'Texto', color: '#4a6a8a', icon: '🔤', cat: 'source',
    desc: 'Texto animado con morphing', toolbar: false,
    inputs: [], maskInput: true, outputs: ['Salida'],
    props: { text: 'ARC', size: 120, color: '#ffffff', x: 960, y: 540, tracking: 0,
      morphStart: -1, morphEnter: 1.2, morphHold: 0.8, morphExit: 0.3 },
  },
  video: {
    name: 'Video', color: '#8a4a6a', icon: '🎬', cat: 'source',
    desc: 'Reproduce un clip de video', toolbar: false,
    inputs: [], maskInput: true, outputs: ['Salida'],
    props: { src: '', opacity: 1 },
  },
  loader: {
    name: 'Cargar', color: '#4a7abb', icon: '📂', cat: 'source',
    desc: 'Carga archivos multimedia (imagen, video, audio)',
    inputs: [], maskInput: true, outputs: ['Salida'],
    props: { src: '', fileType: 'auto', brightness: 1, contrast: 1, gain: 1 },
  },
  'text-plus': {
    name: 'Text+', color: '#3a9a6a', icon: '🔤', cat: 'generate',
    desc: 'Texto con formato avanzado, sombra y controles DaVinci Resolve-style',
    inputs: [], maskInput: true, outputs: ['Salida'],
    props: {
      text: 'LO QUE\\nYO QUIERA', font: 'Open Sans', style: 'Bold',
      size: 120, color: '#ffffff', outlineColor: '', outlineWidth: 0,
      tracking: 1, leading: 1.0, alignment: 'center', x: 960, y: 540,
      rotation: 0, opacity: 1,
      shadow: false, shadowColor: '#000000', shadowBlur: 10, shadowX: 2, shadowY: 2,
      vAnchor: 'center', vAnchorOffset: 0, vJustify: 0,
      hAnchor: 'center', hAnchorOffset: 0, hJustify: 0,
      direction: 'auto', lineDirection: 'auto',
      emphasis: 'none', writeOnStart: 0, writeOnEnd: 1,
    },
  },

  // ═══ Generate ═══
  svg: {
    name: 'SVG', color: '#5a7a5a', icon: '🎯', cat: 'generate',
    desc: 'Renderiza formas SVG desde texto',
    inputs: [], maskInput: true, outputs: ['Salida'],
    props: { svg: 'rect x=0 y=0 w=1920 h=1080 fill=#1a1a1a' },
  },
  rectangle: {
    name: 'Rectángulo', color: '#6a6a8a', icon: '⬜', cat: 'generate',
    desc: 'Genera un rectángulo con bordes redondeados',
    inputs: [], maskInput: true, outputs: ['Salida'],
    props: { x: 100, y: 100, width: 300, height: 200, rx: 0, fill: '#ffffff',
      stroke: '', sw: 1, softEdge: 0, invert: false },
  },
  ellipse: {
    name: 'Elipse', color: '#6a6a8a', icon: '⭕', cat: 'generate',
    desc: 'Genera una elipse rellena o con borde',
    inputs: [], maskInput: true, outputs: ['Salida'],
    props: { cx: 960, cy: 540, rx: 300, ry: 200, fill: '#ffffff',
      stroke: '', sw: 1, softEdge: 0, invert: false },
  },
  polygon: {
    name: 'Polígono', color: '#6a6a8a', icon: '⬠', cat: 'generate',
    desc: 'Genera un polígono regular o dibuja uno personalizado en el viewer',
    inputs: [], maskInput: true, outputs: ['Salida'],
    props: { cx: 960, cy: 540, radius: 200, sides: 5, rotation: 0, starRatio: 1,
      fill: '#ffffff', stroke: '', sw: 1, softEdge: 0, invert: false,
      polyMode: 'regular', points: '', tension: 0.3 },
  },
  gradient: {
    name: 'Gradiente', color: '#3a9a6a', icon: '🌈', cat: 'generate',
    desc: 'Genera un degradado lineal o radial con paradas de color',
    inputs: [], maskInput: true, outputs: ['Salida'],
    props: { type: 'linear', angle: 0, stops: '#000000,#ffffff', repeat: false },
  },
  grid: {
    name: 'Grid', color: '#3a9a6a', icon: '〰️', cat: 'generate',
    desc: 'Genera una cuadrícula personalizable',
    inputs: [], maskInput: true, outputs: ['Salida'],
    props: { columns: 8, rows: 6, gap: 2, fillMode: 'none',
      fillColors: '#ffffff,#333333', bg: '#000000', lineWidth: 1, lineColor: '#666666' },
  },
  'fast-noise': {
    name: 'FastNoise', color: '#3a9a6a', icon: '🌊', cat: 'generate',
    desc: 'Ruido procedural Perlin/Simplex/Worley con color ramp',
    inputs: [], maskInput: true, outputs: ['Salida'],
    props: { type: 'perlin', scale: 0.02, seed: 42, time: 0,
      brightness: 0.5, contrast: 0.5, colorRamp: '#000000,#ffffff', seamless: false },
  },
  'procedural-shapes': {
    name: 'Shapes', color: '#3a9a6a', icon: '✦', cat: 'generate',
    desc: 'Generador procedural de formas geométricas flotantes con animación',
    inputs: [], maskInput: true, outputs: ['Salida'],
    props: { count: 50, sizeMin: 15, sizeMax: 100,
      shapeTypes: 'circle,ellipse,rect,square', fillMode: 'fill',
      opacity: 0.85, speed: 1.0,
      palette: '#e53170,#f9a826,#00c9a7,#ff6b6b,#54a0ff', seed: 42 },
  },

  // ═══ Composite ═══
  merge: {
    name: 'Merge', color: '#6a4a8a', icon: '🔀', cat: 'composite',
    desc: 'Combina dos entradas con modos de mezcla y máscara',
    inputs: ['Background', 'Foreground'], maskInput: true, outputs: ['Salida'],
    props: { mode: 'source-over', blend: 1, centerX: 0, centerY: 0, size: 1, angle: 0, gain: 1 },
  },
  transform: {
    name: 'Transform', color: '#8a6a3a', icon: '📐', cat: 'transform',
    desc: 'Escala, rota y desplaza la imagen',
    inputs: ['Background'], maskInput: true, outputs: ['Salida'],
    props: { centerX: 0, centerY: 0, size: 1, angle: 0 },
  },

  // ═══ Blur ═══
  blur: {
    name: 'Blur', color: '#4a7a7a', icon: '🌫️', cat: 'blur',
    desc: 'Desenfoque gaussiano con control X/Y',
    inputs: ['Background'], maskInput: true, outputs: ['Salida'],
    props: { radiusX: 5, radiusY: 5, lockXY: true, iterations: 1 },
  },
  'directional-blur': {
    name: 'DirBlur', color: '#d4782a', icon: '💫', cat: 'blur',
    desc: 'Desenfoque direccional con ángulo y longitud',
    inputs: ['Background'], maskInput: true, outputs: ['Salida'],
    props: { angle: 0, length: 15, quality: 8 },
  },
  defocus: {
    name: 'Defocus', color: '#d4782a', icon: '💠', cat: 'blur',
    desc: 'Desenfoque de lente con forma de iris y curvatura',
    inputs: ['Background'], maskInput: true, outputs: ['Salida'],
    props: { radius: 5, shape: 'circle', quality: 5, curvature: 1 },
  },

  // ═══ Color ═══
  colorgrade: {
    name: 'Color', color: '#7a5a4a', icon: '🎨', cat: 'color',
    desc: 'Ajusta brillo, contraste, saturación y tono',
    inputs: ['Background'], maskInput: true, outputs: ['Salida'],
    props: { brightness: 1, contrast: 1, saturate: 1, hue: 0 },
  },
  'hue-saturation': {
    name: 'HueSat', color: '#7a9a3a', icon: '🎨', cat: 'color',
    desc: 'Ajusta tono/saturación/luminancia por canales individuales',
    inputs: ['Background'], maskInput: true, outputs: ['Salida'],
    props: { hue: 0, saturation: 1, lightness: 1,
      red: 1, green: 1, blue: 1, cyan: 1, magenta: 1, yellow: 1 },
  },
  'color-curves': {
    name: 'ColorCurves', color: '#7a9a3a', icon: '📈', cat: 'color',
    desc: 'Curvas RGB y HLS personalizables con splines',
    inputs: ['Background'], maskInput: true, outputs: ['Salida'],
    props: { mode: 'custom', channels: 'RGB', curveType: 'custom',
      points_r: '0,0,1,1', points_g: '0,0,1,1', points_b: '0,0,1,1', points_a: '0,0,1,1',
      pts_hue_hue: '0,0,1,1', pts_hue_sat: '0,1,1,1', pts_hue_lum: '0,1,1,1',
      pts_lum_sat: '0,1,1,1', pts_sat_sat: '0,1,1,1' },
  },

  // ═══ Effects ═══
  noise: {
    name: 'Ruido', color: '#5a5a3a', icon: '📺', cat: 'effects',
    desc: 'Añade ruido digital o granular',
    inputs: ['Background'], maskInput: true, outputs: ['Salida'],
    props: { opacity: 0.5, speed: 500, type: 'grain' },
  },
  scanlines: {
    name: 'Scanlines', color: '#3a5a5a', icon: '📺', cat: 'effects',
    desc: 'Simula líneas de escaneo CRT',
    inputs: ['Background'], maskInput: true, outputs: ['Salida'],
    props: { thickness: 1, opacity: 0.18 },
  },
  vignette: {
    name: 'Viñeta', color: '#3a3a5a', icon: '🌑', cat: 'effects',
    desc: 'Oscurece los bordes con forma circular o elíptica',
    inputs: ['Background'], maskInput: true, outputs: ['Salida'],
    props: { intensity: 0.85, shape: 'circle', softness: 0.3 },
  },
  glitch: {
    name: 'Glitch', color: '#7a3a3a', icon: '📟', cat: 'effects',
    desc: 'Efecto de glitch digital con periodicidad',
    inputs: ['Background'], maskInput: true, outputs: ['Salida'],
    props: { intensity: 1, period: 5 },
  },
  glow: {
    name: 'Glow', color: '#e8a030', icon: '☀️', cat: 'effects',
    desc: 'Brillo resplandeciente con umbral de luminancia',
    inputs: ['Background'], maskInput: true, outputs: ['Salida'],
    props: { radius: 15, brightness: 1.5, threshold: 0.5, color: '#ffffff' },
  },
  'soft-glow': {
    name: 'SoftGlow', color: '#e8a030', icon: '✨', cat: 'effects',
    desc: 'Brillo suave y resplandeciente con umbral',
    inputs: ['Background'], maskInput: true, outputs: ['Salida'],
    props: { radius: 20, brightness: 0.5, color: '#ffffff', threshold: 0.5 },
  },
  sharpen: {
    name: 'Sharpen', color: '#d4782a', icon: '🔪', cat: 'effects',
    desc: 'Enfoca la imagen con control de radio y umbral',
    inputs: ['Background'], maskInput: true, outputs: ['Salida'],
    props: { amount: 1, radius: 2, threshold: 0 },
  },
  pixelate: {
    name: 'Pixelate', color: '#3a8a8a', icon: '🔲', cat: 'effects',
    desc: 'Pixelado de la imagen con tamaño de bloque',
    inputs: ['Background'], maskInput: true, outputs: ['Salida'],
    props: { blockSize: 8, softness: 0 },
  },

  // ═══ Keyer ═══
  'luma-keyer': {
    name: 'LumaKey', color: '#8a7a3a', icon: '🔑', cat: 'keyer',
    desc: 'Crea una máscara basada en luminancia',
    inputs: ['Background'], maskInput: true, outputs: ['Salida'],
    props: { low: 0, high: 1, softness: 0.1, invert: false, output: 'matte' },
  },
  'chroma-keyer': {
    name: 'ChromaKey', color: '#4a8a4a', icon: '💚', cat: 'keyer',
    desc: 'Chroma key simple sobre fondo verde/azul',
    inputs: ['Background'], maskInput: true, outputs: ['Salida'],
    props: { keyColor: '#00ff00', tolerance: 0.15, blend: 0.05, softness: 0.1, output: 'image', invert: false },
  },
  'delta-keyer': {
    name: 'DeltaKeyer', color: '#4a8a4a', icon: '🟢', cat: 'keyer',
    desc: 'Keyer por diferencia de color con supresión de spill',
    inputs: ['Background'], maskInput: true, outputs: ['Salida'],
    props: { bgColor: '#00ff00', tolerance: 0.1, edgeSoftness: 0.1, spillSuppression: 0.5,
      preBlur: 0, postBlur: 0, output: 'image', invert: false },
  },
  'hsl-qualifier': {
    name: 'Qualifier', color: '#4a9a4a', icon: '🎯', cat: 'keyer',
    desc: 'Calificador HSL para keying avanzado',
    inputs: ['Background'], maskInput: true, outputs: ['Salida'],
    props: { hueCenter: 0, hueWidth: 60, hueSoft: 15,
      satLow: 0, satHigh: 1, satSoft: 0.05,
      lumLow: 0, lumHigh: 1, lumSoft: 0.05,
      blurRadius: 0, cleanBlack: 0, cleanWhite: 1,
      invert: false, output: 'image', previewMatte: false },
  },
  'magic-mask': {
    name: 'MagicMask', color: '#9a4a7a', icon: '✨', cat: 'keyer',
    desc: 'Máscara automática con pinceladas guía',
    inputs: ['Background'], maskInput: true, outputs: ['Salida'],
    props: { strokes: '', tolerance: 0.15, cleanBlack: 0, cleanWhite: 1,
      blurRadius: 2, erodeDilate: 0, invert: false, output: 'image', previewMatte: false,
      brushSize: 20, mode: 'add' },
  },

  // ═══ Distortion ═══
  displacement: {
    name: 'Displace', color: '#b84444', icon: '🌊', cat: 'distort',
    desc: 'Distorsiona usando un mapa de referencia por canal',
    inputs: ['Background', 'Ref'], maskInput: true, outputs: ['Salida'],
    props: { channelMode: 'rgba', refChannel: 'luminance', strength: 50, center: 0.5 },
  },
  'corner-position': {
    name: 'CornerPos', color: '#b84444', icon: '🔲', cat: 'distort',
    desc: 'Corrige perspectiva con 4 puntos de esquina',
    inputs: ['Background'], maskInput: true, outputs: ['Salida'],
    props: { tl: '0,0', tr: '1920,0', br: '1920,1080', bl: '0,1080', perspective: true, subsampling: 1 },
  },
  'lens-distort': {
    name: 'LensDistort', color: '#b84444', icon: '🔍', cat: 'distort',
    desc: 'Distorsión de lente: barril, cojín o pez',
    inputs: ['Background'], maskInput: true, outputs: ['Salida'],
    props: { type: 'barrel', strength: 50, centerX: 960, centerY: 540, scale: 1,
      chromatic: false, chromStrength: 10 },
  },
  ripple: {
    name: 'Ripple', color: '#b84444', icon: '🌊', cat: 'distort',
    desc: 'Efecto de onda/rizo con control de fase y decay',
    inputs: ['Background'], maskInput: true, outputs: ['Salida'],
    props: { type: 'circular', amplitude: 20, frequency: 10, phase: 0, speed: 0.5,
      centerX: 960, centerY: 540, decay: 0.5 },
  },
  stabilize: {
    name: 'Stabilize', color: '#b84444', icon: '🎯', cat: 'distort',
    desc: 'Estabiliza el movimiento de la imagen',
    inputs: ['Background'], maskInput: true, outputs: ['Salida'],
    props: { mode: 'translation', referenceFrame: 0, smoothness: 0.5, zoom: 1.05,
      useTracker: false, trackerData: '' },
  },
  tracker: {
    name: 'Tracker', color: '#9a7a3a', icon: '🎯', cat: 'distort',
    desc: 'Rastrea un punto en el movimiento frame a frame',
    inputs: ['Background'], maskInput: false, outputs: ['Salida'],
    props: { refFrame: 0, refX: 960, refY: 540, searchRadius: 50, patchSize: 21,
      data: '', confidence: 0, locked: false, showOverlay: true },
  },

  // ═══ Mask ═══
  'mask-rectangle': {
    name: 'MaskRect', color: '#6a6a8a', icon: '⬜', cat: 'mask',
    desc: 'Máscara rectangular con bordes suaves',
    inputs: [], maskInput: true, outputs: ['Salida'],
    props: { x: 100, y: 100, width: 1720, height: 880, softEdge: 0, invert: false },
  },
  'mask-ellipse': {
    name: 'MaskEllipse', color: '#6a6a8a', icon: '⭕', cat: 'mask',
    desc: 'Máscara elíptica con bordes suaves',
    inputs: [], maskInput: true, outputs: ['Salida'],
    props: { cx: 960, cy: 540, rx: 500, ry: 400, softEdge: 0, invert: false },
  },
  'matte-control': {
    name: 'MatteCtrl', color: '#7a5a4a', icon: '🎭', cat: 'mask',
    desc: 'Controla el canal alfa con curvas low/high/gamma',
    inputs: ['Background'], maskInput: true, outputs: ['Salida'],
    props: { low: 0, high: 1, gamma: 1, softness: 0, contrast: 1, brightness: 0, invert: false, premultiply: false },
  },
  'blur-matte': {
    name: 'BlurMatte', color: '#7a5a4a', icon: '🌫️', cat: 'mask',
    desc: 'Desenfoque suavizado del matte preservando bordes',
    inputs: ['Background'], maskInput: true, outputs: ['Salida'],
    props: { radius: 5, iterations: 3, edgePreserve: true, threshold: 0.5 },
  },
  'bitmap-matte-evaluator': {
    name: 'BMask', color: '#5a7a6a', icon: '🧮', cat: 'mask',
    desc: 'Evalúa expresiones matemáticas para generar máscara',
    inputs: ['Background'], maskInput: true, outputs: ['Salida'],
    props: { expression: 'l > 0.5', mode: 'alpha', premultiply: false, invert: false },
  },
  'erode-dilate': {
    name: 'ErodeDilate', color: '#7a5a4a', icon: '⭕', cat: 'mask',
    desc: 'Expande o contrae bordes del canal alfa',
    inputs: ['Background'], maskInput: true, outputs: ['Salida'],
    props: { type: 'erode', radius: 5, channels: 'alpha' },
  },

  // ═══ Channel ═══
  'channel-boolean': {
    name: 'ChanBool', color: '#8a6a6a', icon: '🔣', cat: 'channel',
    desc: 'Operaciones booleanas entre canales RGBA',
    inputs: ['Foreground', 'Background'], maskInput: true, outputs: ['Salida'],
    props: { toRGB: 'red', toAlpha: 'luminance', invertRGB: false, invertAlpha: false, clamp: true },
  },
  'channel-shuffle': {
    name: 'ChanShuffle', color: '#8a6a6a', icon: '🔀', cat: 'channel',
    desc: 'Reordena y mezcla canales de color',
    inputs: ['Background'], maskInput: true, outputs: ['Salida'],
    props: { rSource: 'first', gSource: 'first', bSource: 'first', aSource: 'first',
      rChannel: 'red', gChannel: 'green', bChannel: 'blue', aChannel: 'alpha', invert: false },
  },

  // ═══ 3D ═══
  'shape-3d': {
    name: 'Shape3D', color: '#8a4aaa', icon: '🧊', cat: '3d',
    desc: 'Primitivas 3D: cubo, esfera, cilindro y plano',
    inputs: [], maskInput: true, outputs: ['Salida'],
    props: { type: 'cube', width: 200, height: 200, depth: 200, segments: 1,
      color: '#ffffff', posX: 0, posY: 0, posZ: 0, rotX: 0, rotY: 0, rotZ: 0,
      scaleX: 1, scaleY: 1, scaleZ: 1 },
  },
  'text-3d': {
    name: 'Text3D', color: '#8a4aaa', icon: '📝', cat: '3d',
    desc: 'Texto 3D extruido con profundidad',
    inputs: [], maskInput: true, outputs: ['Salida'],
    props: { text: '3D', size: 100, color: '#ffffff', depth: 20,
      posX: 0, posY: 0, posZ: 0, rotX: 0, rotY: 0, rotZ: 0, scale: 1 },
  },
  'image-plane-3d': {
    name: 'ImgPlane3D', color: '#8a4aaa', icon: '🖼️', cat: '3d',
    desc: 'Plano texturizado para escena 3D',
    inputs: ['Texture'], outputs: ['Salida'],
    props: { width: 200, height: 200, posX: 0, posY: 0, posZ: 0, rotX: 0, rotY: 0, rotZ: 0, scaleX: 1, scaleY: 1 },
  },
  'camera-3d': {
    name: 'Camera3D', color: '#6a6aaa', icon: '📷', cat: '3d',
    desc: 'Cámara 3D con FOV y distancia near/far',
    inputs: ['Entrada'], outputs: ['Salida'],
    props: { posX: 0, posY: 0, posZ: -500, rotX: 0, rotY: 0, rotZ: 0, fov: 45, near: 1, far: 10000 },
  },
  'merge-3d': {
    name: 'Merge3D', color: '#6a4a8a', icon: '🔀', cat: '3d',
    desc: 'Combina objetos en la escena 3D',
    inputs: ['Background', 'Foreground'], outputs: ['Salida'],
    props: {},
  },
  'renderer-3d': {
    name: 'Renderer3D', color: '#aa4a4a', icon: '🎬', cat: '3d',
    desc: 'Renderiza la escena 3D a imagen 2D',
    inputs: ['Scene'], outputs: ['Salida'],
    props: { bgColor: '#000000', lighting: true, ambient: 0.3,
      lightDirX: -1, lightDirY: -1, lightDirZ: -1, wireframe: false },
  },

  // ═══ Output ═══
  output: {
    name: 'Salida', color: '#aa8822', icon: '🚪', cat: 'output',
    desc: 'Define el punto de salida de la composición',
    inputs: ['Background'], maskInput: true, outputs: [],
    props: { target: 'global' },
  },
};

/**
 * Obtiene la definición de un nodo por su type string.
 */
export function getNodeDef(type: string): NodeDef | undefined {
  return NODE_DEFS[type];
}

/**
 * Obtiene todas las categorías disponibles con sus colores.
 */
export function getCategories(): { cat: string; color: string }[] {
  const seen = new Set<string>();
  const result: { cat: string; color: string }[] = [];
  for (const def of Object.values(NODE_DEFS)) {
    if (!seen.has(def.cat)) {
      seen.add(def.cat);
      result.push({ cat: def.cat, color: def.color });
    }
  }
  return result;
}
