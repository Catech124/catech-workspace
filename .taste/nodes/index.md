# taste: nodes

> **domain:** Convenciones del DAG de nodos (Fusion-style)
> **confidence:** 0.90
> **updated:** 2026-06-30
> **version:** 2

## preferences

### render pipeline (detected)

- **renderEffectNode**: 22 tipos `[render-effect-node-22]` (confidence: 0.98) // survey-detected
- **renderDistortionNode**: 6 tipos `[render-distortion-node-6]` (confidence: 0.98) // survey-detected
- **renderMaskNode**: 7 tipos `[render-mask-node-7]` (confidence: 0.98) // survey-detected
- **render3dNode**: 6 tipos `[render-3d-node-6]` (confidence: 0.98) // survey-detected
- Pipeline stages (4): `[pipeline-stages-4]` (confidence: 0.95)
  - Effect Mask (inputGain + destination-in) `[effect-mask-input-gain-pipe]` (confidence: 0.95)
  - Node Sizing (zoom/pan/rotate/flip/crop) `[node-sizing-transforms]` (confidence: 0.95)
  - Power Window (circle/rectangle/polygon/gradient) `[power-window-shapes]` (confidence: 0.95)
  - Output Gain (blend with original) `[output-gain-original-blend]` (confidence: 0.95)
- Static node cache con isNodeSubtreeStatic `[static-node-cache-survey]` (confidence: 0.95) // survey-detected
- Canvas pooling reutilizable `[canvas-pooling-reusable]` (confidence: 0.95) // survey-detected
- Power Window (DaVinci Resolve-style) `[power-window-davinci]` (confidence: 0.95) // survey-detected
- Node Sizing: zoom, pan, rotate, flip, crop `[node-sizing-zoom-pan-flip]` (confidence: 0.95) // survey-detected
- Output Gain: blending con original `[output-gain-blend]` (confidence: 0.95) // survey-detected
- Effect Mask con Input Gain `[effect-mask-input-gain]` (confidence: 0.95) // survey-detected
- 5 engine modules: engine-effects.js, engine-distortion.js, engine-masks.js, engine-3d.js, engine-generators.js `[five-engine-modules]` (confidence: 0.95)

### category breakdown

- 13 categorías de nodos en el toolbar `[toolbar-categories-13]` (confidence: 0.98) // survey-detected
- **source**: 5 tipos — background, image, text, video, loader `[category-source-5]` (confidence: 0.95) // survey-detected
- **generate**: 9 tipos — svg, rectangle, ellipse, polygon, gradient, grid, fast-noise, procedural-shapes, text-plus `[category-generate-9]` (confidence: 0.95) // survey-detected
- **composite**: 1 tipos — merge `[category-composite-1]` (confidence: 0.95) // survey-detected
- **transform**: 1 tipos — transform `[category-transform-1]` (confidence: 0.95) // survey-detected
- **blur**: 3 tipos — blur, directional-blur, defocus `[category-blur-3]` (confidence: 0.95) // survey-detected
- **color**: 3 tipos — colorgrade, hue-saturation, color-curves `[category-color-3]` (confidence: 0.95) // survey-detected
- **effects**: 8 tipos — noise, scanlines, vignette, glitch, glow, sharpen, soft-glow, pixelate `[category-effects-8]` (confidence: 0.95) // survey-detected
- **output**: 1 tipos — output `[category-output-1]` (confidence: 0.95) // survey-detected
- **keyer**: 5 tipos — luma-keyer, delta-keyer, chroma-keyer, hsl-qualifier, magic-mask `[category-keyer-5]` (confidence: 0.95) // survey-detected
- **mask**: 6 tipos — mask-rectangle, mask-ellipse, erode-dilate, matte-control, blur-matte, bitmap-matte-evaluator `[category-mask-6]` (confidence: 0.95) // survey-detected
- **distort**: 6 tipos — displacement, corner-position, lens-distort, ripple, stabilize, tracker `[category-distort-6]` (confidence: 0.95) // survey-detected
- **channel**: 2 tipos — channel-boolean, channel-shuffle `[category-channel-2]` (confidence: 0.95) // survey-detected
- **3d**: 6 tipos — shape-3d, text-3d, image-plane-3d, camera-3d, merge-3d, renderer-3d `[category-3d-6]` (confidence: 0.95) // survey-detected

### node types

- 56 tipos de nodo definidos en NODE_DEFS (engine.js) en 13 categorías `[node-defs-56-types]` (confidence: 1.0) // survey-detected
- 51/56 nodos tienen soporte de máscara (maskInput: true) `[mask-support-51-of-56]` (confidence: 0.95)
- 14 generadores animables (source + generate) `[generators-animatable-14]` (confidence: 0.90)

### Estructura de nodos

- Cada nodo tiene `id` único (formato `n{nextId++}`), `type`, `name`, `x`, `y`, `inputs[]`, `outputs[]`, `props{}` `[node-structure-id-type-props]` (confidence: 0.98)
- Inputs tienen `{ id, label, connection: null | { nodeId, portId, type }, type }` `[input-structure]` (confidence: 0.98)
- Outputs tienen `{ id: 'out', label, type: 'image' }` `[output-structure]` (confidence: 0.95)
- `NODE_DEFS` en `engine.js` define 40+ tipos con categoría, color, icono, descripción, inputs y props por defecto `[node-defs-40-plus-types]` (confidence: 0.99)
- `NODE_COLORS` en `node-graph.js` asigna color de borde por tipo `[node-colors-by-type]` (confidence: 0.95)

### Categorías de nodos (orden en toolbar)

- **source**: background, image, text, video, loader `[toolbar-source-5]` (confidence: 0.98)
- **composite**: merge `[toolbar-composite-1]` (confidence: 0.98)
- **transform**: transform `[toolbar-transform-1]` (confidence: 0.98)
- **blur**: blur, directional-blur, defocus `[toolbar-blur-3]` (confidence: 0.98)
- **color**: colorgrade, hue-saturation, color-curves `[toolbar-color-3]` (confidence: 0.98)
- **effects**: noise, scanlines, vignette, glitch, glow, sharpen, soft-glow, pixelate `[toolbar-effects-8]` (confidence: 0.98)
- **generate**: svg, rectangle, ellipse, polygon, gradient, grid, fast-noise, procedural-shapes, text-plus `[toolbar-generate-9]` (confidence: 0.98)
- **keyer**: luma-keyer, delta-keyer, chroma-keyer, hsl-qualifier, magic-mask `[toolbar-keyer-5]` (confidence: 0.98)
- **mask**: mask-rectangle, mask-ellipse, erode-dilate, matte-control, blur-matte, bitmap-matte-evaluator `[toolbar-mask-6]` (confidence: 0.98)
- **channel**: channel-boolean, channel-shuffle `[toolbar-channel-2]` (confidence: 0.98)
- **distort**: displacement, corner-position, lens-distort, ripple, stabilize, tracker `[toolbar-distort-6]` (confidence: 0.98)
- **3d**: shape-3d, text-3d, image-plane-3d, camera-3d, merge-3d, renderer-3d `[toolbar-3d-6]` (confidence: 0.98)
- **output**: output `[toolbar-output-1]` (confidence: 0.98)

### Render 3D (engine-3d.js)

- 6 tipos de nodos 3D: `shape-3d`, `text-3d`, `image-plane-3d`, `camera-3d`, `merge-3d`, `renderer-3d` `[node-3d-six-types]` (confidence: 0.98)
- Pipeline 3D completo: `_3dModelMatrix` → `_3dViewMatrix` → `mat4Perspective` → `_3dRasterize` `[pipeline-3d-complete]` (confidence: 0.95)
- `camera-3d` define FOV, near/far planes y posición/rotación — el `renderer-3d` usa la última cámara en el cache `[camera-3d-fov-params]` (confidence: 0.90)
- `merge-3d` recolecta meshes del cache 3D según prefijo de nodeId `[merge-3d-collect-meshes]` (confidence: 0.85)
- `renderer-3d` renderiza todos los meshes del cache 3D con iluminación (ambient + directional) `[renderer-3d-meshes-lighting]` (confidence: 0.90)
- `image-plane-3d` acepta input de textura (el resto de nodos 3D son generadores puros) `[image-plane-3d-texture]` (confidence: 0.90)
- Primitivas: `_3dGenCube(w,h,d)`, `_3dGenSphere(r,segs)`, `_3dGenCylinder(r,h,segs)`, `_3dGenPlane(w,h)` `[primitives-gen-cube-sphere]` (confidence: 0.95)

### Static Node Cache (engine.js)

- `_staticNodeCache` evita re-renderizar nodos sin animación entre frames `[static-cache-no-re-render]` (confidence: 0.95)
- `TIME_DEPENDENT_TYPES` (no cacheados): noise, glitch, fast-noise, ripple, video, tracker, text, loader, procedural-shapes `[time-dependent-node-types]` (confidence: 0.95)
- `isNodeSubtreeStatic()` verifica recursivamente si el subtree completo es estático `[is-node-subtree-static]` (confidence: 0.90)
- La caché se invalida con `invalidateStaticCache()` al mutar nodos/conexiones `[invalidate-static-cache]` (confidence: 0.90)
- El cache almacena canvases independientes (creados con `document.createElement('canvas')`, NO del pool) `[cache-uses-independent-canvas]` (confidence: 0.90)

### Convenciones de conexión

- Input `bg` (Background) es el input principal por defecto — color de wire: `#d4a017` (gold) `[connection-input-bg-default]` (confidence: 0.95)
- Input `fg` (Foreground) en Merge — wire entra desde arriba, color: `#4caf50` (green) `[connection-input-fg-merge]` (confidence: 0.95)
- Input `mask` (Effect Mask) en todos los nodos — wire entra desde abajo, color: `#3b82f6` (blue) `[connection-input-mask]` (confidence: 0.95)
- Output→Output: auto-crea Merge node en medio (Gap 2) `[connection-output-output-gap2]` (confidence: 0.90)
- Drop on node body: auto-conecta al primer input disponible (Gap 1) `[connection-drop-body-gap1]` (confidence: 0.90)
- Shift+drag sobre wire: inserta nodo entre dos conectados (Fusion-style) `[connection-shift-drag-insert]` (confidence: 0.85)
- Ctrl+T en Merge: swap inputs (Background ↔ Foreground) `[connection-ctrl-t-swap]` (confidence: 0.90)
- Click en wire: elimina conexión `[connection-click-remove]` (confidence: 0.95)
- Máscaras: todos los nodos excepto `tracker`, `image-plane-3d`, `merge-3d`, `camera-3d`, `renderer-3d` tienen `maskInput: true` `[mask-exceptions-3d-tracker]` (confidence: 0.98)

### Indicadores visuales de nodo

- **⊞ Node Sizing**: zoom, pan, rotate, flip, crop activos `[indicator-node-sizing]` (confidence: 0.90)
- **🔑 Key**: outputGain ≠ 1, inputGain ≠ 1, o invertMask activo `[indicator-key]` (confidence: 0.90)
- **● Color wheels**: colorgrade o hue-saturation con valores no-default `[indicator-color-wheels]` (confidence: 0.90)
- **∿ Curves**: color-curves con puntos personalizados `[indicator-curves]` (confidence: 0.90)
- **◑ Qualifier**: chroma-keyer, delta-keyer, luma-keyer, mask nodes `[indicator-qualifier]` (confidence: 0.90)
- **◎ Blur/Sharpen**: blur, sharpen, defocus, glow, soft-glow con radio > 0 `[indicator-blur-sharpen]` (confidence: 0.90)
- **Viewer dots**: cada nodo tiene dots v1/v2 para asignar a viewer 1 o 2 `[indicator-viewer-dots]` (confidence: 0.95)

### DaVinci Resolve-style features

- **Node Sizing**: zoom, pan (X/Y), rotate, flip (H/V), crop (L/R/T/B) en props de cada nodo `[feature-node-sizing]` (confidence: 0.95)
- **Power Window**: shape (`pwShape`: circle/rectangle/polygon/gradient), center (`pwCenterX`, `pwCenterY`), size (`pwSize`), aspect (`pwAspect`), rotate (`pwRotate`), softness (`pwSoftness`), opacity (`pwOpacity`), invert (`pwInvert`), numPoints (`pwNumPoints`), gradientAngle (`pwGradientAngle`) `[feature-power-window]` (confidence: 0.95)
- **Output Gain**: blending del resultado procesado con el original `[feature-output-gain]` (confidence: 0.95)
- **Input Gain**: ajusta fuerza del key/mask antes de aplicar `[feature-input-gain]` (confidence: 0.90)
- **Effect Mask**: máscara aplicada a nivel de nodo, post-procesamiento `[feature-effect-mask]` (confidence: 0.95)

### Pool de recursos: estrategias size-aware

Tres tipos de pool comparten el patrón `acquire`/`release` pero cada uno tiene una estrategia size-aware distinta según la naturaleza del recurso:

- Canvas pool (canvas-pool.ts): best-fit por área (W × H). Seguro porque un canvas se redimensiona via width/height setters. `[pool-canvas-best-fit-by-area]` (confidence: 0.95)
- ImageData pool (image-data-pool.ts): exact-match only. ImageData es immutable-sized — no se puede cambiar su width/height después de creado. Devolver tamaño mayor rompe putImageData() y código que itera sobre id.width/id.height. `[pool-imagedata-exact-match-only]` (confidence: 0.95)
- ClampedArray pool (image-data-pool.ts): best-fit por excess (menor diferencia entre longitud solicitada y disponible). Seguro porque los Uint8ClampedArray son scratch buffers — el caller controla bounds. `[pool-clamped-array-best-fit-by-excess]` (confidence: 0.95)
- Regla general: recursos redimensionables (canvas) → best-fit; recursos inmutable-sized (ImageData) → exact-match; scratch buffers 1D (ClampedArray) → best-fit por excess. `[pool-size-aware-strategy-rule]` (confidence: 0.90)

### Bug pattern: `getImageData` return value descartado

`canvas.getImageData(0, 0, W, H)` **siempre devuelve un nuevo `ImageData`** con los píxeles actuales del canvas. Si se descarta este valor y se usan datos del pool en su lugar, el buffer contiene datos **stale** de frames anteriores:

```ts
// ❌ BUG: getImageData() descartado, pool data stale
const id = acquireImageData(W, H);
c.getImageData(0, 0, W, H);  // ← return value descartado!
const srcData = id.data.slice();  // ← datos basura del pool
```

```ts
// ✅ CORRECTO: capturar getImageData() + pool para output
const srcId = c.getImageData(0, 0, W, H);
const srcData = srcId.data;
const result = boxBlur(srcData, W, H, radiusX, radiusY, iterations);
const id = acquireImageData(W, H);
for (let i = 0; i < result.length; i++) id.data[i] = result[i];
c.putImageData(id, 0, 0);
```

- El patrón correcto: getImageData() para **leer** píxeles del canvas, acquireImageData() para **escribir** el resultado procesado. `[pool-getimagedata-never-discard]` (confidence: 0.95)

### Animación en nodos: límites de evalPropA

- `evalPropA(key, fallback)` evalúa keyframes + modifiers SOLO en nodos **generadores**: engine-generators.js `[evalpropa-generators-only]` (confidence: 0.98)
- Nodos de **efectos** (engine-effects.js): merge, blur, glow, colorgrade, color-curves, etc. NO usan `evalPropA` — sus props internas no son animables por keyframes. La animación de un efecto se logra animando las props del generador que le antecede `[evalpropa-effect-nodes-no]` (confidence: 0.95)
- Nodos de **distorsión** (engine-distortion.js): displacement, corner-position, lens-distort, ripple — NO usan `evalPropA` `[evalpropa-distort-nodes-no]` (confidence: 0.95)
- Nodos de **máscara** (engine-masks.js): channel-boolean, matte-control, etc. — NO usan `evalPropA` `[evalpropa-mask-nodes-no]` (confidence: 0.95)
- Nodos **3D** (engine-3d.js): NO usan `evalPropA` `[evalpropa-3d-nodes-no]` (confidence: 0.95)
- Las props de efectos se controlan en tiempo real via sliders en el inspector, no via keyframes `[effect-props-real-time-sliders]` (confidence: 0.90)

### Nodos especiales

- **Anchors** (`isAnchor: true`): auto-generados por capas de timeline, no se pueden eliminar `[special-anchors]` (confidence: 0.98)
- **AutoLayer** (`isAutoLayer: true`): merge chain auto-generada entre capas `[special-auto-layer]` (confidence: 0.95)
- **Auto Layer Output** (`id: 'auto_layer_output'`): output de la merge chain automática `[special-auto-layer-output]` (confidence: 0.95)
- **Auto FX Output** (`id: 'auto_fx_output'`): output de la cadena de efectos automática `[special-auto-fx-output]` (confidence: 0.85)

## patterns

### Patrón: auto-merge chain de capas

Cuando hay múltiples capas en la timeline, se genera automáticamente una cadena de Merge nodes:
```
anchor_layer_1 → Merge 1 (fg: anchor_layer_1, bg: anchor_composite)
anchor_layer_2 → Merge 2 (fg: anchor_layer_2, bg: Merge 1)
...
auto_layer_output (bg: último Merge)
```
`[patron-auto-merge-chain]` (confidence: 0.95)

### Patrón: render pipeline (resolveNodeOutput)

```
resolveNodeOutput(nodeId)
  → Resuelve recursivamente inputs (depth-first)
  → processNodeCanvas(node, imgInputs, maskCanvas, t, W, H)
    → Delega a renderEffectNode / renderDistortionNode / renderMaskNode / render3dNode / renderGeneratorNode
    → Aplica Effect Mask (inputGain + destination-in)
    → Aplica Node Sizing (zoom, pan, rotate, flip, crop)
    → Aplica Power Window
    → Aplica Output Gain
  → Caché de nodos estáticos (subtree sin time-dependence)
```
`[patron-render-pipeline]` (confidence: 0.95)

### Patrón: carga de archivos multimedia

Drag & drop o paste en nodeArea crea un nodo `loader`:
- Imagen (.png, .jpg, .gif, .webp, .bmp) → fileType: 'image' `[image-filetype-loader]` (confidence: 0.95)
- Video (.mp4, .webm, .mov, .avi, .mkv, .ogg) → fileType: 'video' `[video-filetype-loader]` (confidence: 0.95)
- Audio (.mp3, .wav, .ogg, .flac, .aac, .m4a) → fileType: 'audio' `[audio-filetype-loader]` (confidence: 0.95)
`[patron-media-load]` (confidence: 0.98)

### Patrón: navigación del grafo

- Ctrl+Wheel: zoom (0.2x–3.0x) centrado en cursor `[navigate-ctrl-wheel-zoom]` (confidence: 0.98)
- Middle-button drag: pan del grafo `[navigate-middle-pan]` (confidence: 0.98)
- Marquee selection: drag en área vacía `[navigate-marquee-select]` (confidence: 0.95)
- Ctrl+Click: toggle selección múltiple `[navigate-ctrl-click-toggle]` (confidence: 0.95)
- Shift+Click: añadir a selección `[navigate-shift-click-add]` (confidence: 0.95)
- Ctrl+Click en nodo: floating preview `[navigate-ctrl-click-preview]` (confidence: 0.95)

### Patrón: error boundaries en el render pipeline

`processNodeCanvas()` tiene un `try/catch` genérico alrededor del dispatch de render:
```js
try {
  // dispatchear al renderizador según el tipo de nodo
} catch (e) {
  console.warn('Engine: node error', node.id, e);
}
```
- Este catch captura errores de render (imagen no cargada, canvas corrupto, etc.) y permite que el pipeline continúe `[error-boundary-catch-render]` (confidence: 0.95)
- Excepción a la regla "Sin código defensivo genérico" de core: aquí es intencional porque un nodo roto no debe romper la composición entera `[error-boundary-exception]` (confidence: 0.90)
- Si un nodo falla, su output es `undefined` y el siguiente nodo en la cadena recibe `null` como input — el pipeline maneja nulls gracefulmente `[error-boundary-undefined-fallback]` (confidence: 0.90)

## anti-patterns

- **No crear conexiones circulares**: el DAG no detecta ciclos — causaría recursión infinita `[no-circular-connections]` (confidence: 0.90)
- **No eliminar anchors manualmente**: son auto-generados por las capas, el sistema los recrea `[no-delete-anchors]` (confidence: 0.95)
- **No hardcodear colores**: usar `NODE_COLORS` en `node-graph.js` para consistencia `[no-hardcode-colors]` (confidence: 0.90)
- **No modificar NODE_DEFS directamente en runtime**: clonar con `JSON.parse(JSON.stringify(def.props))` en `addNode` `[no-mutate-node-defs]` (confidence: 0.95)
- **No confiar en que un nodo existe**: siempre verificar con `nodes.find()` y guard con `if (!n) return` `[no-trust-node-exists]` (confidence: 0.90)
- **No mutar el array `nodes` directamente sin pasar por `Store.set`**: el store emite eventos necesarios para UI. Usar spread operator o `structuredClone` para inmutabilidad `[no-direct-nodes-mutation]` (confidence: 0.98)
- **No inventar APIs, tipos de nodos o props que no existen en `NODE_DEFS`**: `NODE_DEFS` en `engine.js` es la única fuente autorizada de tipos `[no-invent-apis]` (confidence: 0.95)
- **No olvidar `maskInput` en nuevos tipos de nodo**: agregar `maskInput: true` en la definición; los nodos 3D y tracker son excepciones intencionales `[no-forget-mask-input]` (confidence: 0.90)
- **No usar IDs genéricos**: siempre prefijar con `n` para nodos y `l` para capas `[no-generic-ids]` (confidence: 0.90)