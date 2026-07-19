# COMPILED TASTE — Freebuff System Prompt

> **compiled:** 2026-07-04
> **packages:** 8
> **source:** .taste/ (Taste System v1.0.0, ADR 0006)

## Packages

| Package | Domain | Rules | Patterns | Confidence | Levels |
|---|---|---|---|---|---|
| core | Reglas de ingeniería fundamentales del proyecto ARC Editor | 24 | ✅ | 0.50 | 5 |
| frontend | Preferencias de UI/UX, Canvas, CSS y eventos del ARC Editor | 54 | ✅ | 0.60 | 5 |
| backend | Preferencias de backend (Python/FastAPI + Go) | 31 | ✅ | 0.80 | 3 |
| nodes | Convenciones del DAG de nodos (Fusion-style) | 61 | ✅ | 0.85 | 4 |
| animation | Preferencias de animación (keyframes, modifiers, spline) | 44 | ✅ | 0.90 | 3 |
| design | Sistema de Design Tokens (Figma → Style Dictionary → CSS/JS) | 8 | ✅ | 0.90 | 3 |
| skills | Playbooks reutilizables y workflows del agente | 51 | ✅ | 0.70 | 3 |
| tools | Preferencias de toolchain, scripts y herramientas | 74 | ✅ | 0.75 | 4 |

---

## core

> Reglas de ingeniería fundamentales del proyecto ARC Editor
> **confidence:** 0.50
> **updated:** 2026-06-30
> **version:** 1

## preferences

- Schema version 2.0.0 con 11 definiciones de nodo en 8 categorías `[schema-v2-11-node-defs]` (confidence: 0.98) // survey
- 2 tipos de puerto: video_stream (max 1 conn), mask (max 1 conn) `[schema-port-types]` (confidence: 0.98) // survey
- 7 tipos de propiedad: string → widget:text, number → widget:number, range → widget:slider, color → widget:color-picker, boolean → widget:toggle, select → widget:dropdown, media → widget:file-picker `[schema-prop-types]` (confidence: 0.98) // survey
- schema.json es la única fuente de verdad — no inventar tipos, nodos o parámetros que no existan aquí `[schema-json-source-of-truth]` (confidence: 0.98) // survey
- 11 reglas de flujo de datos en dataFlow.rules `[dataflow-rules-11]` (confidence: 0.95) // survey
- Sistema de animación definido en schema: 3 modifiers (description, oscillate, shake) `[schema-animation-modifiers]` (confidence: 0.95) // survey
- Pipeline de render definido: 6 pasos, caché: true `[schema-render-pipeline]` (confidence: 0.95) // survey
- Modelo de capas con 5 campos: id, start, duration, hidden, locked `[schema-layer-model]` (confidence: 0.95) // survey
- Efectos globales: noise, noiseOpacity, noiseSpeed, scanlines, vignette, glitch, blur, saturation, hueRotate `[schema-global-effects]` (confidence: 0.90) // survey
- 12 modos de mezcla definidos con compositeOp mapping `[blend-modes-12]` (confidence: 0.95) // survey
- 5 funciones de easing definidas con fórmulas `[easing-functions-5]` (confidence: 0.95) // survey
- 21 formatos de media soportados (image/video/audio) `[media-formats-21]` (confidence: 0.95) // survey
- opcional `[semicolon-required]` (confidence: 0.75) // survey
- double-quotes preferidas `[single-quotes-default]` (confidence: 0.70) // survey
- La fuente de la verdad para tipos de nodos es `NODE_DEFS` en `engine.js` — no inventar tipos, parámetros o props que no existan allí `[source-of-truth-node-defs]` (confidence: 0.95) // manual
- `schema.json` contiene la definición de esquemas complementarios (grafos, conexiones), no los tipos runtime de nodos `[schema-json-complementary]` (confidence: 0.90) // manual
- archivos < 150 líneas `[srp-200-lines-max]` (confidence: 0.50) // manual
- si hay ambigüedad, preguntar antes de asumir `[zero-magic-zero-assumptions]` (confidence: 0.95) // manual
- Sin código defensivo genérico: capturar solo errores esperados, no try/catch genéricos `[no-generic-defensive-code]` (confidence: 0.80) // manual
- Modularidad: cada archivo debe hacer solo una cosa `[modularity-single-responsibility]` (confidence: 0.90) // manual
- Sin TypeScript: JavaScript vanilla con JSDoc opcional — decisión arquitectónica `[no-typescript-vanilla-jsdoc]` (confidence: 0.90) // manual
- Graphify primero: leer dependencias antes de modificar funciones importadas `[graphify-first-read-deps]` (confidence: 0.95) // manual
- Comentarios senior: documentar POR QUÉ, no QUÉ `[senior-comments-why-not-what]` (confidence: 0.85) // manual
- TDD estricto: escribir test ANTES del código `[testing-first-write-before-code]` (confidence: 0.95) // manual

## patterns

### Schema validation before new types


- **trigger:** Antes de agregar un nuevo tipo de nodo o parámetro
- **action:** Verificar que exista en `NODE_DEFS` (engine.js) — no inventar tipos que no estén definidos
- **rationale:** El sistema de render delega por tipo de nodo; un tipo inexistente causa renderizado nulo

> **24 rules · confidence 0.50**
> **levels:** P6:legacy, P5:CLAUDE.md, P3:.taste/core/index.md, P2:settings.json, P1:settings.local.json

---

## frontend

> Preferencias de UI/UX, Canvas, CSS y eventos del ARC Editor
> **confidence:** 0.60
> **updated:** 2026-06-30
> **version:** 1

## preferences

- Chat panel Copilot con toggle, minimizar y settings `[copilot-chat-panel]` (confidence: 1.00) // survey
- 6 comandos slash integrados: ayuda, limpiar, reset, explosion, introvideo, cinema `[copilot-six-slash-commands]` (confidence: 0.98) // survey
- Selector de modelos con 24 providers agrupados `[copilot-model-selector-24]` (confidence: 0.95) // survey
- Panel arrastrable con persistencia de posición via localStorage `[copilot-draggable-panel]` (confidence: 0.95) // survey
- Control de tamaño de fuente (✓ slider + persist) `[copilot-font-size-slider]` (confidence: 0.95) // survey
- 5 acciones de grafo: addNode, setProp, connect, deleteNode, autoLayout `[copilot-five-graph-actions]` (confidence: 0.98) // survey
- Contexto de composición enviado al LLM vía cpBuildGraphContext() `[copilot-graph-context-llm]` (confidence: 0.98) // survey
- Chat persistente con historial + mensajes en localStorage `[copilot-chat-persist]` (confidence: 0.95) // survey
- Resaltado de markdown (código, negrita, cursiva) `[copilot-markdown-highlight]` (confidence: 0.98) // survey
- 14 interacciones de grafo detectadas `[graph-interactions-14]` (confidence: 0.95) // survey
- Indicadores visuales de tipo Fusion: Node Sizing (⊞), Key palette (🔑), Color wheels (●), Curves (∿), Qualifier (◑), Blur/Sharpen (◎) `[fusion-indicators-visual]` (confidence: 0.95) // survey
- Colores de wire por rol: bg -> gold (#d4a017), fg -> green (#4caf50), mask -> blue (#3b82f6), matte -> yellow (#fc0) `[wire-colors-by-role]` (confidence: 0.95) // survey
- 3 atajos de teclado detectados `[keyboard-shortcuts-detected]` (confidence: 0.95) // survey
- Binding pattern: DOMContentLoaded + querySelector + event delegation via data-action `[binding-domcontentloaded-delegation]` (confidence: 0.95) // survey
- Canvas 2D para renderizado de nodos `[canvas-2d-node-render]` (confidence: 0.95) // manual
- `requestAnimationFrame` para actualizaciones del canvas `[request-animation-frame]` (confidence: 0.90) // manual
- Web Workers para procesamiento pesado (cálculos de nodos matemáticos) `[web-workers-heavy-compute]` (confidence: 0.85) // manual
- clases BEM descriptivas `[css-bem-naming]` (confidence: 0.80) // manual
- fondo #0d1117, texto #e6edf3 `[css-dark-theme-slate]` (confidence: 0.60) // manual
- Sin estilos en línea via JavaScript excepto para posiciones dinámicas `[css-no-inline-styles]` (confidence: 0.85) // manual
- CSS Grid para layouts complejos, Flexbox para componentes lineales `[css-grid-flexbox]` (confidence: 0.85) // manual
- Ctrl+S: Guardar proyecto `[shortcut-ctrl-s-save]` (confidence: 0.98) // manual
- Ctrl+O: Abrir proyecto `[shortcut-ctrl-o-open]` (confidence: 0.98) // manual
- Ctrl+Shift+N: Nuevo proyecto `[shortcut-ctrl-shift-n-new]` (confidence: 0.95) // manual
- Ctrl+Z: Undo (50 niveles) `[shortcut-ctrl-z-undo]` (confidence: 0.98) // manual
- Ctrl+Y: Redo `[shortcut-ctrl-y-redo]` (confidence: 0.98) // manual
- Ctrl+D: Duplicar nodos seleccionados `[shortcut-ctrl-d-duplicate]` (confidence: 0.95) // manual
- Ctrl+T: Swap inputs de Merge `[shortcut-ctrl-t-swap-merge]` (confidence: 0.95) // manual
- Ctrl+A: Seleccionar todos los nodos `[shortcut-ctrl-a-select-all]` (confidence: 0.95) // manual
- 1/2/3: Cambiar vista Timeline/Nodes/Spline `[shortcut-1-2-3-views]` (confidence: 0.98) // manual
- Delete: Eliminar nodo(s) seleccionado(s) `[shortcut-delete-node]` (confidence: 0.98) // manual
- Escape: Cerrar menú contextual / deseleccionar `[shortcut-escape-deselect]` (confidence: 0.95) // manual
- Drag desde toolbar: crea nodo en la posición de drop `[drag-toolbar-create-node]` (confidence: 0.98) // manual
- Click en nodo: selecciona `[click-node-select]` (confidence: 0.98) // manual
- Click + drag en canvas vacío: marquee selection `[click-drag-marquee-select]` (confidence: 0.95) // manual
- Click en wire: elimina conexión `[connection-click-remove]` (confidence: 0.95) // manual
- Drag desde output port a input port: crea conexión `[drag-port-to-port-connect]` (confidence: 0.98) // manual
- Drop en body de nodo: auto-conecta al primer input disponible `[drop-node-body-autoconnect]` (confidence: 0.95) // manual
- Shift+drag sobre wire: inserta nodo entre dos conectados (Fusion-style) `[connection-shift-drag-insert]` (confidence: 0.90) // manual
- Ctrl+Click en nodo: floating preview `[navigate-ctrl-click-preview]` (confidence: 0.95) // manual
- Ctrl+Wheel en canvas: zoom (0.2x–3.0x) centrado en cursor `[ctrl-wheel-zoom-centered]` (confidence: 0.98) // manual
- Middle-button drag: pan del grafo `[navigate-middle-pan]` (confidence: 0.98) // manual
- 4 tabs: Controls / Modifiers / Spline / LUTs `[inspector-four-tabs]` (confidence: 0.95) // manual
- Controls tab: sliders para props numéricas, color pickers, dropdowns para enums `[inspector-controls-tab]` (confidence: 0.95) // manual
- Modifiers tab: selector (static/oscillate/shake/step) + sliders de parámetros `[inspector-modifiers-tab]` (confidence: 0.95) // manual
- Spline tab: editor de keyframes con time input, value input, easing dropdown, handles bezier X/Y `[inspector-spline-tab]` (confidence: 0.95) // manual
- LUTs tab: lookup table management `[inspector-luts-tab]` (confidence: 0.80) // manual
- Inspector se actualiza al seleccionar nodo o capa `[inspector-update-on-select]` (confidence: 0.95) // manual
- Layers list con thumbnails, nombres, toggle de visibilidad `[timeline-layers-list]` (confidence: 0.95) // manual
- Playhead draggable sobre ruler `[timeline-playhead-draggable]` (confidence: 0.98) // manual
- In/out points para rango de composición `[timeline-in-out-points]` (confidence: 0.90) // manual
- Snapping a frames, keyframes y bordes de capa `[timeline-snapping]` (confidence: 0.90) // manual
- Track height ajustable `[timeline-track-height]` (confidence: 0.85) // manual
- Keyframes visibles como diamonds en cada track layer `[timeline-keyframe-diamonds]` (confidence: 0.95) // manual

## patterns

### Module structure


- **trigger:** Crear un nuevo archivo JS
- **action:** Usar ES modules nativos (`export` / `import`), sin bundlers
- **rationale:** El proyecto no usa bundler por decisión arquitectónica

### Canvas initialization


- **trigger:** Inicializar un canvas
- **action:** Obtener contexto 2D una vez, reusarlo, actualizar via requestAnimationFrame
- **rationale:** Crear contextos nuevos en cada frame es ineficiente y causa GC

> **54 rules · confidence 0.60**
> **levels:** P6:legacy, P5:CLAUDE.md, P3:.taste/frontend/index.md, P2:settings.json, P1:settings.local.json

---

## backend

> Preferencias de backend (Python/FastAPI + Go)
> **confidence:** 0.80
> **updated:** 2026-06-30
> **version:** 1

## preferences

- Type hints obligatorios en todas las funciones y métodos `[type-hints-required]` (confidence: 0.95) // manual
- Pydantic para toda validación de entrada/salida de la API `[pydantic-validation-api]` (confidence: 0.90) // manual
- `async def` para rutas FastAPI y llamadas de red `[async-def-fastapi-routes]` (confidence: 0.85) // manual
- `asyncio.to_thread` para procesamiento pesado (OpenCV, FFmpeg) `[asyncio-to-thread-heavy]` (confidence: 0.80) // manual
- PEP 8: formatear con Black + Ruff `[pep8-black-ruff]` (confidence: 0.90) // manual
- Estructura estándar: `main.go` + `server.go` + `models.go` + handlers `[go-standard-structure]` (confidence: 0.85) // manual
- `net/http` con `gorilla/mux` o similar para rutas `[net-http-gorilla-mux]` (confidence: 0.80) // manual
- JSON como formato de intercambio `[json-exchange-format]` (confidence: 0.90) // manual
- Config via JSON + variables de entorno `[config-json-env-vars]` (confidence: 0.85) // manual
- REST endpoints con naming semántico: `GET /api/taste/packages` `[rest-semantic-naming]` (confidence: 0.90) // manual
- WebSocket para eventos en tiempo real `[websocket-real-time-events]` (confidence: 0.85) // manual
- Rate limiting y validación en cada endpoint `[rate-limiting-per-endpoint]` (confidence: 0.85) // manual
- Errores con código HTTP semántico + mensaje descriptivo `[http-error-semantic-codes]` (confidence: 0.90) // manual
- Servidor Express.js en `ServidorLocal/server.js` `[express-server-local]` (confidence: 0.95) // manual
- Puerto: 3000, bind a 0.0.0.0 `[port-3000-bind-all]` (confidence: 0.98) // manual
- CORS habilitado, JSON body limit: 50mb `[cors-json-50mb]` (confidence: 0.95) // manual
- Endpoints: `[endpoints]` (confidence: 0.95) // manual
- Static files: sirve `~/Downloads/arc-editor/` `[static-files-arc-editor]` (confidence: 0.90) // manual
- `GET /healthz` — health check con uptime y token state `[go-healthz-uptime]` (confidence: 0.95) // manual
- `GET /v1/models` — lista modelos del ModelRegistry con metadatos `[go-v1-models-list]` (confidence: 0.95) // manual
- `POST /v1/chat/completions` — proxy OpenAI-compatible al upstream `[go-v1-chat-completions]` (confidence: 0.95) // manual
- `POST /v1/messages` — proxy Claude API-compatible (convierte payload al formato upstream) `[go-v1-messages-proxy]` (confidence: 0.95) // manual
- `POST /v1/messages/count_tokens` — estimación de tokens `[go-v1-count-tokens]` (confidence: 0.90) // manual
- Middleware: autenticación via `x-api-key` header o `Authorization: Bearer` `[go-auth-middleware]` (confidence: 0.95) // manual
- ModelRegistry: mapea model IDs → agent IDs para routing de requests `[go-model-registry-routing]` (confidence: 0.90) // manual
- Response streaming: SSE para chat completions + eventos `[go-response-streaming-sse]` (confidence: 0.95) // manual
- Métodos: `StartRun`, `FinishRun` (agent lifecycle), `ChatCompletions` (AI proxy) `[upstream-start-finish-run]` (confidence: 0.95) // manual
- Auth: `Authorization: Bearer {AUTH_TOKEN}`, rotation automática cada 6h `[upstream-auth-bearer-rotation]` (confidence: 0.95) // manual
- Soporte HTTP proxy via `HTTP_PROXY` env var `[upstream-http-proxy]` (confidence: 0.90) // manual
- Tool schema normalization: resuelve `$ref`, simplifica `anyOf`/`oneOf` nullable `[upstream-tool-schema]` (confidence: 0.90) // manual
- Inyecta metadatos upstream: `codebuff_metadata.run_id`, `cost_mode: free`, `freebuff_instance_id` `[upstream-inject-metadata]` (confidence: 0.95) // manual

## patterns

### Pydantic validation


- **trigger:** Crear un nuevo endpoint API
- **action:** Definir modelo Pydantic para request y response antes de implementar la ruta
- **rationale:** Validación automática, documentación OpenAPI gratis

### Async separation


- **trigger:** Operación que puede durar > 100ms
- **action:** Si es I/O usar async/await. Si es CPU-bound usar asyncio.to_thread o BackgroundTasks
- **rationale:** No bloquear el event loop de FastAPI

> **31 rules · confidence 0.80**
> **levels:** P6:legacy, P5:CLAUDE.md, P3:.taste/backend/index.md

---

## nodes

> Convenciones del DAG de nodos (Fusion-style)
> **confidence:** 0.85
> **updated:** 2026-06-30
> **version:** 2

## preferences

- Pipeline stages (4): `[pipeline-stages-4]` (confidence: 0.95) // manual
- Static node cache con isNodeSubtreeStatic `[static-node-cache-survey]` (confidence: 0.95) // survey
- Canvas pooling reutilizable `[canvas-pooling-reusable]` (confidence: 0.95) // survey
- Power Window (DaVinci Resolve-style) `[power-window-davinci]` (confidence: 0.95) // survey
- Node Sizing: zoom, pan, rotate, flip, crop `[node-sizing-zoom-pan-flip]` (confidence: 0.95) // survey
- Output Gain: blending con original `[output-gain-blend]` (confidence: 0.95) // survey
- Effect Mask con Input Gain `[effect-mask-input-gain]` (confidence: 0.95) // survey
- 5 engine modules: engine-effects.js, engine-distortion.js, engine-masks.js, engine-3d.js, engine-generators.js `[five-engine-modules]` (confidence: 0.95) // manual
- 13 categorías de nodos en el toolbar `[toolbar-categories-13]` (confidence: 0.98) // survey
- 56 tipos de nodo definidos en NODE_DEFS (engine.js) en 13 categorías `[node-defs-56-types]` (confidence: 1.00) // survey
- 51/56 nodos tienen soporte de máscara (maskInput: true) `[mask-support-51-of-56]` (confidence: 0.95) // manual
- 14 generadores animables (source + generate) `[generators-animatable-14]` (confidence: 0.90) // manual
- Cada nodo tiene `id` único (formato `n{nextId++}`), `type`, `name`, `x`, `y`, `inputs[]`, `outputs[]`, `props{}` `[node-structure-id-type-props]` (confidence: 0.98) // manual
- Inputs tienen `{ id, label, connection: null | { nodeId, portId, type }, type }` `[input-structure]` (confidence: 0.98) // manual
- Outputs tienen `{ id: 'out', label, type: 'image' }` `[output-structure]` (confidence: 0.95) // manual
- `NODE_DEFS` en `engine.js` define 40+ tipos con categoría, color, icono, descripción, inputs y props por defecto `[node-defs-40-plus-types]` (confidence: 0.99) // manual
- `NODE_COLORS` en `node-graph.js` asigna color de borde por tipo `[node-colors-by-type]` (confidence: 0.95) // manual
- 6 tipos de nodos 3D: `shape-3d`, `text-3d`, `image-plane-3d`, `camera-3d`, `merge-3d`, `renderer-3d` `[node-3d-six-types]` (confidence: 0.98) // manual
- Pipeline 3D completo: `_3dModelMatrix` → `_3dViewMatrix` → `mat4Perspective` → `_3dRasterize` `[pipeline-3d-complete]` (confidence: 0.95) // manual
- `camera-3d` define FOV, near/far planes y posición/rotación — el `renderer-3d` usa la última cámara en el cache `[camera-3d-fov-params]` (confidence: 0.90) // manual
- `merge-3d` recolecta meshes del cache 3D según prefijo de nodeId `[merge-3d-collect-meshes]` (confidence: 0.85) // manual
- `renderer-3d` renderiza todos los meshes del cache 3D con iluminación (ambient + directional) `[renderer-3d-meshes-lighting]` (confidence: 0.90) // manual
- `image-plane-3d` acepta input de textura (el resto de nodos 3D son generadores puros) `[image-plane-3d-texture]` (confidence: 0.90) // manual
- Primitivas: `_3dGenCube(w,h,d)`, `_3dGenSphere(r,segs)`, `_3dGenCylinder(r,h,segs)`, `_3dGenPlane(w,h)` `[primitives-gen-cube-sphere]` (confidence: 0.95) // manual
- `_staticNodeCache` evita re-renderizar nodos sin animación entre frames `[static-cache-no-re-render]` (confidence: 0.95) // manual
- `TIME_DEPENDENT_TYPES` (no cacheados): noise, glitch, fast-noise, ripple, video, tracker, text, loader, procedural-shapes `[time-dependent-node-types]` (confidence: 0.95) // manual
- `isNodeSubtreeStatic()` verifica recursivamente si el subtree completo es estático `[is-node-subtree-static]` (confidence: 0.90) // manual
- La caché se invalida con `invalidateStaticCache()` al mutar nodos/conexiones `[invalidate-static-cache]` (confidence: 0.90) // manual
- El cache almacena canvases independientes (creados con `document.createElement('canvas')`, NO del pool) `[cache-uses-independent-canvas]` (confidence: 0.90) // manual
- Input `bg` (Background) es el input principal por defecto — color de wire: `#d4a017` (gold) `[connection-input-bg-default]` (confidence: 0.95) // manual
- Input `fg` (Foreground) en Merge — wire entra desde arriba, color: `#4caf50` (green) `[connection-input-fg-merge]` (confidence: 0.95) // manual
- Input `mask` (Effect Mask) en todos los nodos — wire entra desde abajo, color: `#3b82f6` (blue) `[connection-input-mask]` (confidence: 0.95) // manual
- Output→Output: auto-crea Merge node en medio (Gap 2) `[connection-output-output-gap2]` (confidence: 0.90) // manual
- Drop on node body: auto-conecta al primer input disponible (Gap 1) `[connection-drop-body-gap1]` (confidence: 0.90) // manual
- Shift+drag sobre wire: inserta nodo entre dos conectados (Fusion-style) `[connection-shift-drag-insert]` (confidence: 0.85) // manual
- Ctrl+T en Merge: swap inputs (Background ↔ Foreground) `[connection-ctrl-t-swap]` (confidence: 0.90) // manual
- Click en wire: elimina conexión `[connection-click-remove]` (confidence: 0.95) // manual
- Máscaras: todos los nodos excepto `tracker`, `image-plane-3d`, `merge-3d`, `camera-3d`, `renderer-3d` tienen `maskInput: true` `[mask-exceptions-3d-tracker]` (confidence: 0.98) // manual
- Canvas pool (canvas-pool.ts): best-fit por área (W × H). Seguro porque un canvas se redimensiona via width/height setters. `[pool-canvas-best-fit-by-area]` (confidence: 0.95) // manual
- ImageData pool (image-data-pool.ts): exact-match only. ImageData es immutable-sized — no se puede cambiar su width/height después de creado. Devolver tamaño mayor rompe putImageData() y código que itera sobre id.width/id.height. `[pool-imagedata-exact-match-only]` (confidence: 0.95) // manual
- ClampedArray pool (image-data-pool.ts): best-fit por excess (menor diferencia entre longitud solicitada y disponible). Seguro porque los Uint8ClampedArray son scratch buffers — el caller controla bounds. `[pool-clamped-array-best-fit-by-excess]` (confidence: 0.95) // manual
- Regla general: recursos redimensionables (canvas) → best-fit; recursos inmutable-sized (ImageData) → exact-match; scratch buffers 1D (ClampedArray) → best-fit por excess. `[pool-size-aware-strategy-rule]` (confidence: 0.90) // manual
- El patrón correcto: getImageData() para **leer** píxeles del canvas, acquireImageData() para **escribir** el resultado procesado. `[pool-getimagedata-never-discard]` (confidence: 0.95) // manual
- `evalPropA(key, fallback)` evalúa keyframes + modifiers SOLO en nodos **generadores**: engine-generators.js `[evalpropa-generators-only]` (confidence: 0.98) // manual
- Nodos de **efectos** (engine-effects.js): merge, blur, glow, colorgrade, color-curves, etc. NO usan `evalPropA` — sus props internas no son animables por keyframes. La animación de un efecto se logra animando las props del generador que le antecede `[evalpropa-effect-nodes-no]` (confidence: 0.95) // manual
- Nodos de **distorsión** (engine-distortion.js): displacement, corner-position, lens-distort, ripple — NO usan `evalPropA` `[evalpropa-distort-nodes-no]` (confidence: 0.95) // manual
- Nodos de **máscara** (engine-masks.js): channel-boolean, matte-control, etc. — NO usan `evalPropA` `[evalpropa-mask-nodes-no]` (confidence: 0.95) // manual
- Nodos **3D** (engine-3d.js): NO usan `evalPropA` `[evalpropa-3d-nodes-no]` (confidence: 0.95) // manual
- Las props de efectos se controlan en tiempo real via sliders en el inspector, no via keyframes `[effect-props-real-time-sliders]` (confidence: 0.90) // manual
- Imagen (.png, .jpg, .gif, .webp, .bmp) → fileType: 'image' `[image-filetype-loader]` (confidence: 0.95) // manual
- Video (.mp4, .webm, .mov, .avi, .mkv, .ogg) → fileType: 'video' `[video-filetype-loader]` (confidence: 0.95) // manual
- Audio (.mp3, .wav, .ogg, .flac, .aac, .m4a) → fileType: 'audio' `[audio-filetype-loader]` (confidence: 0.95) // manual
- Ctrl+Wheel: zoom (0.2x–3.0x) centrado en cursor `[navigate-ctrl-wheel-zoom]` (confidence: 0.98) // manual
- Middle-button drag: pan del grafo `[navigate-middle-pan]` (confidence: 0.98) // manual
- Marquee selection: drag en área vacía `[navigate-marquee-select]` (confidence: 0.95) // manual
- Ctrl+Click: toggle selección múltiple `[navigate-ctrl-click-toggle]` (confidence: 0.95) // manual
- Shift+Click: añadir a selección `[navigate-shift-click-add]` (confidence: 0.95) // manual
- Ctrl+Click en nodo: floating preview `[navigate-ctrl-click-preview]` (confidence: 0.95) // manual
- Este catch captura errores de render (imagen no cargada, canvas corrupto, etc.) y permite que el pipeline continúe `[error-boundary-catch-render]` (confidence: 0.95) // manual
- Excepción a la regla "Sin código defensivo genérico" de core: aquí es intencional porque un nodo roto no debe romper la composición entera `[error-boundary-exception]` (confidence: 0.90) // manual
- Si un nodo falla, su output es `undefined` y el siguiente nodo en la cadena recibe `null` como input — el pipeline maneja nulls gracefulmente `[error-boundary-undefined-fallback]` (confidence: 0.90) // manual

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

> **61 rules · confidence 0.85**
> **levels:** P6:legacy, P5:CLAUDE.md, P3:.taste/nodes/index.md, P1:settings.local.json

---

## animation

> Preferencias de animación (keyframes, modifiers, spline)
> **confidence:** 0.90
> **updated:** 2026-06-30
> **version:** 2

## preferences

- 11 tipos de nodo usan `evalPropA()` para animación por keyframes + modifiers `[evalpropa-node-types]` (confidence: 0.98) // survey
- Nodos animables: image, text, loader, rectangle, ellipse, polygon, gradient, grid, fast-noise, procedural-shapes, text-plus `[animatable-node-types]` (confidence: 0.95) // manual
- Evaluación combinada: evaluateChannel(keyframes) + evalModifier(modifier) `[eval-channel-modifiers]` (confidence: 0.95) // survey
- 28 propiedades animables con color asignado en PROP_COLORS `[prop-colors-mapping]` (confidence: 0.98) // survey
- 20 propiedades con DEFAULT_RANGES predefinidos `[default-ranges-predefined]` (confidence: 0.95) // survey
- Props de capa: size, y, x, brightness, contrast, spacing, opacity, saturate, hue, rotation, scale, gain, tracking `[layer-props-size-x-brightness]` (confidence: 0.95) // survey
- Props de nodo: cx, cy, rx, ry, radius, angle, width, height, columns, rows, gap, lineWidth, seed, time `[node-props-cx-cy-rx-radius]` (confidence: 0.95) // survey
- Tipos de capa animables: text, image, video `[animatable-layer-types]` (confidence: 0.98) // survey
- Sistema de animación de 3 capas: animatedProps (diamantes) + Keyframes + Modifiers `[three-layer-animation-system]` (confidence: 0.95) // survey
- keyframeAPI: setKeyframe / removeKeyframe / getKeyframes `[keyframe-api-crud]` (confidence: 0.98) // survey
- modifierAPI: setModifier / removeModifier / getModifier `[modifier-api-crud]` (confidence: 0.95) // survey
- animatedPropsAPI: toggleAnimatedProp / isAnimatedProp / getAnimatedPropKeys `[animated-props-api]` (confidence: 0.95) // survey
- 5 easing types: linear, easeIn, easeOut, easeInOut, bezier `[easing-types-five]` (confidence: 0.98) // survey
- 3 modifier types: oscillate, shake, step `[modifier-types-three]` (confidence: 0.95) // survey
- Spline View con handles bezier, draggable keyframes, inspector `[spline-view-bezier-handles]` (confidence: 0.95) // survey
- Evaluación combinada: `evaluateChannel(keyframes) + evalModifier(modifier)` `[eval-combinada-keyframes-modifiers]` (confidence: 0.95) // manual
- Tanto capas de timeline COMO props de nodos tienen animación vía `evalPropA()` `[evalpropa-layers-and-nodes]` (confidence: 0.98) // manual
- `setKeyframe(entityId, propName, frame, value, ease, handleData?)` `[set-keyframe-signature]` (confidence: 0.98) // manual
- `removeKeyframe(entityId, propName, frame)` `[remove-keyframe-signature]` (confidence: 0.98) // manual
- `getKeyframes(entityId, propName)` → array sorted por frame `[get-keyframes-signature]` (confidence: 0.98) // manual
- Cada keyframe tiene: `{ frame, value, ease, cpRight?, cpLeft? }` `[keyframe-structure]` (confidence: 0.98) // manual
- Easing types: `linear`, `easeIn`, `easeOut`, `easeInOut`, `bezier` `[easing-types-list]` (confidence: 0.98) // manual
- Bezier handles: `cpRight: { x, y }`, `cpLeft: { x, y }` — valores normalizados 0-1 sobre segmento `[bezier-handles-normalized]` (confidence: 0.95) // manual
- Diamond visual en timeline: indica keyframe existente con color según easing `[keyframe-diamond-timeline]` (confidence: 0.95) // manual
- Shift+Click en diamond: elimina keyframe `[shift-click-remove-keyframe]` (confidence: 0.95) // manual
- `setModifier(entityId, propName, type, params)` `[set-modifier-signature]` (confidence: 0.95) // manual
- `removeModifier(entityId, propName)` `[remove-modifier-signature]` (confidence: 0.95) // manual
- Modifiers se aplican en el render de NODOS y capas `[modifiers-applied-nodes-layers]` (confidence: 0.95) // manual
- UI de modifiers en timeline: selector (static/oscillate/shake) + sliders `[modifiers-ui-timeline]` (confidence: 0.95) // manual
- Editor Fusion-style con curvas de animación, keyframes draggables y handles tangentes `[spline-editor-fusion-style]` (confidence: 0.95) // manual
- Actúa sobre la entidad activa: nodo seleccionado O capa seleccionada `[spline-active-entity]` (confidence: 0.95) // manual
- Cada propiedad tiene un rango por defecto para escalar el eje Y del spline `[default-ranges-per-prop]` (confidence: 0.90) // manual
- Rango se auto-ajusta al valor mínimo/máximo de los keyframes + padding 15% `[range-auto-adjust-keyframes]` (confidence: 0.95) // manual
- Propiedades sin keyframes usan `DEFAULT_RANGES` para línea punteada `[default-ranges-no-keyframes]` (confidence: 0.90) // manual
- `drawLayerBase()` evalúa keyframes vía `evalProp(channels, modifiers, key, t, fallback)` `[draw-layer-base-eval-prop]` (confidence: 0.95) // manual
- Tipos de capa: text (size, y, spacing), image (brightness, contrast), video (opacity) `[layer-types-text-image]` (confidence: 0.95) // manual
- Morph animation en texto: enter/hold/exit con opacity + blur + scale `[morph-animation-text]` (confidence: 0.90) // manual
- Layer-level opacity se bakea en el canvas antes de pasar al merge chain `[layer-opacity-baked-pre-merge]` (confidence: 0.95) // manual
- `evalPropA(key, fallback)`: evalúa BOTH keyframes (vía `evaluateChannel`) AND modifiers (vía `evalModifier`) `[evalpropa-keyframes-modifiers]` (confidence: 0.98) // manual
- Todos los generadores usan `evalPropA()` en sus props numéricas `[generators-use-evalpropa]` (confidence: 0.98) // manual
- Text+: size, tracking, leading, x, y, rotation, opacity, vAnchorOffset, vJustify, hAnchorOffset, hJustify, writeOnStart, writeOnEnd `[text-plus-animatable-props]` (confidence: 0.95) // manual
- Formas: rectangle (x, y, width, height, rx), ellipse (cx, cy, rx, ry), polygon (cx, cy, radius, rotation) `[shape-animatable-props]` (confidence: 0.95) // manual
- Procedural shapes: count, sizeMin, sizeMax, opacity, speed, seed `[procedural-shapes-props]` (confidence: 0.90) // manual
- Loader: brightness, contrast, gain `[loader-animatable-props]` (confidence: 0.95) // manual

## patterns

### Patrón: toggle animatedProp


```js
// Activar/desactivar propiedad en Spline View
toggleAnimatedProp(entityId, propName);

// Verificar si está activa
isAnimatedProp(entityId, propName); // boolean

// Obtener props activas
getAnimatedPropKeys(entityId); // ['size', 'opacity', ...]
```
`[patron-toggle-animated-prop]` (confidence: 0.98)

### Patrón: crear keyframe


```js
Store.snapshot();
setKeyframe(layerId, propName, currentTime, currentValue, 'easeInOut');
if (!isAnimatedProp(entityId, propName)) {
  toggleAnimatedProp(entityId, propName); // auto-activar diamond
}
renderSplineEditor();
Store.emit(EVENTS.REBUILD);
```
`[patron-crear-keyframe]` (confidence: 0.95)

### Patrón: modificar keyframe


```js
Store.snapshot();
removeKeyframe(entityId, propName, oldFrame);
setKeyframe(entityId, propName, newFrame, newValue, 'bezier', {
  cpRight: { x: 0.35, y: 0.35 },
  cpLeft: { x: 0.65, y: 0.65 },
});
renderSplineEditor();
```
`[patron-modificar-keyframe]` (confidence: 0.95)

### Patrón: undo/redo seguro para animación


Siempre llamar `Store.snapshot()` ANTES de mutar keyframes, modifiers o animatedProps `[undo-snapshot-before-mutate]` (confidence: 0.98)
Para operaciones múltiples, usar `beginBatch()` / `endBatch()` `[undo-batch-operations]` (confidence: 0.95)

> **44 rules · confidence 0.90**
> **levels:** P6:legacy, P5:CLAUDE.md, P3:.taste/animation/index.md

---

## design

> Sistema de Design Tokens (Figma → Style Dictionary → CSS/JS)
> **confidence:** 0.90
> **updated:** 2026-06-30
> **version:** 1

## preferences

- 10 categorías de tokens (135 tokens totales) `[design-categories-10]` (confidence: 0.95) // survey
- Style Dictionary ^5.4.4 con build.js + config.js `[design-style-dictionary]` (confidence: 0.95) // survey
- Outputs compilados en dist/: CSS vars, JS module, JSON flat, Tailwind `[design-outputs-four]` (confidence: 0.95) // survey
- Integración Figma via Tokens Studio (provider: github) `[design-figma-tokens-studio]` (confidence: 0.95) // survey
- Output en `dist/` no se edita manualmente — se regenera con build `[dist-read-only-regenerated]` (confidence: 0.95) // manual
- Flujo: Figma (diseño) → Tokens Studio (plugin) → GitHub (push) → `git pull` local → `npm run build` → `dist/` `[figma-github-sync-flow]` (confidence: 0.95) // manual
- `tokens-studio.config.json` documenta la configuración, no se importa automáticamente `[tokens-studio-config-docs]` (confidence: 0.95) // manual
- Tokens Studio trabaja con un solo archivo JSON, no múltiples — los archivos en `tokens/` son la versión local `[single-file-vs-multi-json]` (confidence: 0.90) // manual

## patterns

### Patrón: agregar un nuevo token


1. Editar el archivo JSON correspondiente en `design-tokens/tokens/` (confidence: 0.95)
2. Ejecutar `npm run build` desde `design-tokens/` (confidence: 0.98)
3. Los 4 formatos de salida se regeneran automáticamente (confidence: 0.95)
4. Importar la variable/valor actualizado desde `dist/` (confidence: 0.95)
- **rationale:** Un solo cambio propaga a todos los formatos, manteniendo consistencia `[rationale-single-change-propagates]` (confidence: 0.90)

### Patrón: sync desde Figma


1. Diseñar con Tokens Studio en Figma (confidence: 0.90)
2. Push desde el plugin Tokens Studio a GitHub (confidence: 0.85)
3. `git pull` en local (confidence: 0.95)
4. `npm run build` para regenerar `dist/` (confidence: 0.95)
- **rationale:** Los tokens viven en Figma como fuente de diseño, el código consume la versión build `[rationale-tokens-in-figma]` (confidence: 0.90)

> **8 rules · confidence 0.90**
> **levels:** P6:legacy, P5:CLAUDE.md, P3:.taste/design/index.md

---

## skills

> Playbooks reutilizables y workflows del agente
> **confidence:** 0.70
> **updated:** 2026-06-30
> **version:** 2

## preferences

- 11 métodos de persistencia detectados `[persistence-methods-11]` (confidence: 0.95) // survey
- localStorage: 10 métodos `[localstorage-methods]` (confidence: 0.95) // manual
- Auto-save debounced (500ms) via state:changed events `[auto-save-debounced-500ms]` (confidence: 0.95) // survey
- Undo/Redo: 50 niveles, snapshots automáticos en SNAPSHOT_KEYS `[undo-redo-50-levels]` (confidence: 0.98) // survey
- Batch operations: beginBatch/endBatch para operaciones atómicas `[batch-operations-atomic]` (confidence: 0.95) // survey
- Project manifest (arc-editor-manifest) `[project-manifest]` (confidence: 0.90) // survey
- File System Access API: 10 métodos para proyecto en disco (project.json + assets/) `[file-system-access-api]` (confidence: 0.95) // survey
- Backend API (Express server): 4 endpoints `[backend-api-express]` (confidence: 0.90) // survey
- Project dialog: save modal + load modal + project list `[project-dialog-save-load]` (confidence: 0.95) // survey
- 3 métodos de persistencia: localStorage + File System Access API + Node.js server `[persistence-three-methods]` (confidence: 0.95) // survey
- `tools/validate-taste.js` — valida formato y metadata de todos los `.taste/*/taste.md` `[tool-validate-taste]` (confidence: 0.98) // manual
- `tools/compile-taste.js` — compila 8 packages → `COMPILED_TASTE.md` (uso como system prompt) `[tool-compile-taste]` (confidence: 0.98) // manual
- `tools/survey-taste.js` — escanea el proyecto y sugiere reglas a agregar en `.taste/` `[tool-survey-taste]` (confidence: 0.90) // manual
- Ejecutar `graphify update .` al finalizar cada tarea para mantener el knowledge graph actualizado `[post-task-graphify-update]` (confidence: 0.95) // manual
- Sugerir `node tools/survey-taste.js` para detectar nuevas reglas `[post-task-suggest-survey]` (confidence: 0.85) // manual
- Ejecutar `node tools/compile-taste.js` si se modificaron archivos `.taste/` `[post-task-compile-taste]` (confidence: 0.90) // manual
- Trigger: después de habilitar noUnusedLocals en tsconfig.json — cualquier regla strict que exponga dead code `[post-task-dead-code-trigger]` (confidence: 0.95) // manual
- Action: ejecutar npx tsc --noEmit para listar errores, agrupar por tipo y limpiar sistemáticamente `[post-task-dead-code-action]` (confidence: 0.90) // manual
- Action step: agrupar errores por tipo: imports, variables, parámetros, funciones muertas `[post-task-dead-code-group]` (confidence: 0.90) // manual
- Action step: remover imports no usados individualmente `[post-task-dead-code-remove-imports]` (confidence: 0.90) // manual
- Action step: simplificar variables temporales de un solo uso (inline directo) `[post-task-dead-code-inline-vars]` (confidence: 0.90) // manual
- Action step: remover parámetros de función no usados y actualizar callers `[post-task-dead-code-remove-params]` (confidence: 0.90) // manual
- Action step: remover funciones completas que nunca se llaman `[post-task-dead-code-remove-functions]` (confidence: 0.85) // manual
- Rationale: habilitar reglas strict expone dead code acumulado. Limpiar sistemáticamente evita warning fatigue. `[post-task-dead-code-rationale]` (confidence: 0.90) // manual
- Trigger: al renombrar variable local que shadowea un parámetro o variable externa `[shadowing-cascade-trigger]` (confidence: 0.90) // manual
- Action: buscar todas las referencias en declaración, body, argumentos y shorthands de retorno `[shadowing-cascade-action]` (confidence: 0.90) // manual
- Cascade target: la declaración local de la variable renombrada `[shadowing-cascade-declaration]` (confidence: 0.90) // manual
- Cascade target: el uso de la variable en el body de la función `[shadowing-cascade-usage]` (confidence: 0.90) // manual
- Cascade target: el paso como argumento a otras funciones, incluyendo object shorthands `[shadowing-cascade-argument]` (confidence: 0.90) // manual
- Cascade target: propiedades en objetos de retorno con shorthand ({ variable }) — key debe coincidir con variable en scope `[shadowing-cascade-return]` (confidence: 0.90) // manual
- Rationale: TypeScript no señala el shorthand problemático hasta tsc --noEmit — validación del object literal ocurre en compilación. `[shadowing-cascade-rationale]` (confidence: 0.90) // manual
- Usar `wiki/` como fuente local autorizada para preguntas sobre UI/Inspector/Nodos de DaVinci Resolve Fusion `[wiki-local-authority]` (confidence: 0.95) // manual
- Resolución por defecto: 1920×1080 `[export-default-res-1920-1080]` (confidence: 0.95) // manual
- FPS configurable (default: 30) `[export-fps-30-default]` (confidence: 0.95) // manual
- `downloadFromYouTube(url)`: envía URL al backend `POST /api/download-youtube`, recibe MP4 como blob `[youtube-download-post]` (confidence: 0.90) // manual
- `detectScenes(videoUrl, sensitivity)`: usa FFmpeg.wasm con filtro `select='gt(scene,X)',showinfo` `[scene-detect-ffmpeg]` (confidence: 0.85) // manual
- Slider de sensibilidad (0.1–0.9) para ajustar umbral — se persiste en `props._sceneSens` `[scene-sensitivity-slider]` (confidence: 0.85) // manual
- Botón "🧩 Auto-split en capas": divide video en capas individuales por escena `[scene-auto-split-layers]` (confidence: 0.85) // manual
- Omite segmentos < 0.3s (transiciones cortas) `[scene-skip-short-segments]` (confidence: 0.90) // manual
- `graphify query "<question>"` es la primera herramienta para preguntas sobre el codebase, cuando `graphify-out/graph.json` existe `[graphify-query-first]` (confidence: 0.95) // manual
- `graphify path "<A>" "<B>"` para relaciones entre archivos y dependencias `[graphify-path-relations]` (confidence: 0.95) // manual
- `graphify explain "<concept>"` para conceptos específicos del proyecto `[graphify-explain-concept]` (confidence: 0.95) // manual
- Si `graphify-out/wiki/index.md` existe, usarlo para navegación amplia en vez de leer archivos fuente directamente `[graphify-wiki-navigation]` (confidence: 0.90) // manual
- Leer `graphify-out/GRAPH_REPORT.md` solo para revisiones amplias de arquitectura o cuando query/path/explain no proporcionen suficiente contexto `[graphify-report-review]` (confidence: 0.95) // manual
- `graphify update .` se ejecuta post-task (ver post-task automation) `[graphify-update-post-task]` (confidence: 0.95) // manual
- Integración con OpenRouter para generación de nodos por texto `[copilot-openrouter-integration]` (confidence: 0.85) // manual
- Comandos en copilot.js: `addNode(type, props, x, y)`, autoLayout, etc. `[copilot-commands-add-node]` (confidence: 0.85) // manual
- Responde en markdown con bloques de comando `{"action":"addNode",...}` `[copilot-respond-markdown]` (confidence: 0.80) // manual
- Estado actual: **🔴 Por diagnosticar** — el AI responde pero no crea nodos en el grafo `[copilot-status-needs-diagnosis]` (confidence: 0.70) // manual
- `state.js`: Store central con eventos (`key:changed`) y auto-snapshot para undo `[store-central-events]` (confidence: 0.98) // manual
- Keys de proyecto: `arc-project-{name}` `[store-project-keys]` (confidence: 0.90) // manual

## patterns

### Patrón: plan before code


- **trigger:** Al recibir cualquier instrucción de implementación (confidence: 0.95)
- **action:** Listar archivos relevantes y plan de acción en bullet points ANTES de escribir código (confidence: 0.95)
- **rationale:** Reduce iteraciones, asegura alineación con el humano, y permite detectar edge cases temprano (confidence: 0.90)

### Patrón: flujo completo del Taste System


```bash
# 1. Escanear el proyecto para detectar reglas
node tools/survey-taste.js --diff    # ver qué va a cambiar
node tools/survey-taste.js --apply   # aplicar sugerencias

# 2. Validar formato
node tools/validate-taste.js --all

# 3. Compilar para system prompt
node tools/compile-taste.js
```
`[patron-taste-flow]` (confidence: 0.95)

### Patrón: post-task automation


1. Ejecutar `graphify update .` `[patron-post-task-graphify]` (confidence: 0.95)
2. Ejecutar `node tools/compile-taste.js` si se modificaron `.taste/` `[patron-post-task-compile]` (confidence: 0.90)
3. Ejecutar `node tools/validate-taste.js --all` para verificar integridad `[patron-post-task-validate]` (confidence: 0.90)
4. Sugerir `node tools/survey-taste.js` para detectar nuevas reglas `[patron-post-task-survey]` (confidence: 0.85)

### Patrón: renderizar composición


```js
renderFrame({
  layers,           // [...{ id, type, name, start, duration, props }]
  channels,         // { layerId_propName: [{ frame, value, ease }] }
  modifiers,        // { layerId_propName: { type, amplitude, ... } }
  nodes,            // DAG de nodos
  t,                // currentTime
  W, H              // resolución
});
```
`[patron-render-composition]` (confidence: 0.95)

### Patrón: guardar proyecto


```js
// En disco (File System Access API)
await saveToDisk(project);

// En localStorage (auto-save)
Store.saveProjectAs('mi-proyecto');

// En servidor Node.js
fetch('/api/projects', { method: 'POST', body: JSON.stringify(data) });
```
`[patron-save-project]` (confidence: 0.95)

> **51 rules · confidence 0.70**
> **levels:** P6:legacy, P5:CLAUDE.md, P3:.taste/skills/index.md

---

## tools

> Preferencias de toolchain, scripts y herramientas
> **confidence:** 0.75
> **updated:** 2026-06-30
> **version:** 1

## preferences

- Repositorio git inicializado (filemode=false, ignorecase=true) // survey-detected `[git-repo-initialized]` (confidence: 0.95) // survey
- Post-task automation: CLAUDE.md + graphify update `[git-post-task-automation]` (confidence: 0.98) // survey
- .gitignore con 0 patrones () `[gitignore-zero-patterns]` (confidence: 0.95) // survey
- 1 commits en historial `[git-one-commit-history]` (confidence: 1.00) // survey
- Commits recientes: `feat: agregar 3 detectores al survey-taste.js — design token` `[git-recent-commits]` (confidence: 0.95) // survey
- No auto-commit: el agente lista cambios, el humano revisa y commitea `[git-no-auto-commit]` (confidence: 0.98) // survey
- Browser-injected node composition test (IIFE + <script> tag) `[test-browser-injected]` (confidence: 1.00) // survey
- Console error interception via `console.error` / `console.warn` override `[test-console-error-intercept]` (confidence: 1.00) // survey
- 6 helper functions: testSingleNode, testWithBG, testDualInput, testChain, test3DChain, testWithTimeout `[test-helper-functions-6]` (confidence: 0.98) // survey
- 11 source node types tested `[test-source-types-11]` (confidence: 0.95) // survey
- 28 effect node types tested `[test-effect-types-28]` (confidence: 0.95) // survey
- 3 dual-input node types (merge, displacement, channel-boolean) `[test-dual-input-types-3]` (confidence: 0.95) // survey
- 15 composition chain tests (source → effect → ... → output) `[test-composition-chains-15]` (confidence: 0.98) // survey
- Results stored in window.__nodeTestResults for inspection `[test-results-window]` (confidence: 0.98) // survey
- Playwright integration test (chromium, headless) `[test-playwright-integration]` (confidence: 1.00) // survey
- 5 test phases: Static ID verification → data-action attribute verification → data-toggle attribute verification → Interactive behavior tests → Console error audit `[test-five-phases]` (confidence: 0.98) // survey
- 107 static IDs verified `[test-107-static-ids]` (confidence: 0.95) // survey
- 22 data-action attributes verified `[test-22-data-actions]` (confidence: 0.95) // survey
- 9 interactive behavior tests (tab switching, modals, buttons) `[test-9-interactive-behaviors]` (confidence: 0.90) // survey
- Console error collector during test run `[test-console-error-collector]` (confidence: 0.95) // survey
- Server startup with retry logic (maxRetries, 500ms interval) `[test-server-startup-retry]` (confidence: 0.90) // survey
- Results tracking via check(label, condition, detail) `[test-results-tracking]` (confidence: 0.98) // survey
- Vitest config: environment=node, setup=./test/setup.js, timeout=10000ms `[test-vitest-config]` (confidence: 0.98) // survey
- Sin bundler: ES modules nativos importados via `<script type="module">` `[no-bundler-es-modules]` (confidence: 0.95) // survey
- pnpm como gestor de paquetes preferido `[package-manager-pnpm]` (confidence: 0.85) // manual
- npm como alternativa cuando pnpm no está disponible `[package-manager-npm-alt]` (confidence: 0.80) // manual
- Sin bundler — ES modules nativos `[no-bundler-es-modules-native]` (confidence: 0.90) // survey
- Vitest como framework de tests unitarios `[test-vitest-unit]` (confidence: 0.85) // manual
- Playwright para tests de integración `[test-playwright-e2e]` (confidence: 0.85) // survey
- Tests unitarios para engine, node-controller, state.js `[test-unit-engine-controller]` (confidence: 0.80) // manual
- playwright como framework de tests `[test-playwright-framework]` (confidence: 0.80) // survey
- Exportación a WebM (MediaRecorder) soportada `[export-webm-mediarecorder]` (confidence: 0.90) // survey
- Exportación a MP4 (FFmpeg.wasm) soportada `[export-mp4-ffmpeg-wasm]` (confidence: 0.90) // survey
- Exportación a PNG sequence soportada `[export-png-sequence]` (confidence: 0.90) // survey
- Exportación a JPEG sequence soportada `[export-jpeg-sequence]` (confidence: 0.90) // survey
- Exportación a GIF soportada `[export-gif-lzw]` (confidence: 0.90) // survey
- ZIP packaging con ZipWriter store-mode `[export-zip-packaging]` (confidence: 0.95) // survey
- Standalone engine via buildStandaloneEngineSource() `[export-standalone-engine]` (confidence: 0.90) // survey
- YouTube import via backend API + scene detection `[export-youtube-import]` (confidence: 0.85) // survey
- Scene detection con FFmpeg.wasm `[export-scene-detection]` (confidence: 0.85) // survey
- Resolución por defecto: 1920x1080 @ 30fps `[export-default-res-1920x1080]` (confidence: 0.95) // survey
- 5 formatos de exportación detectados `[export-formats-5]` (confidence: 0.95) // survey
- Sin TypeScript: JavaScript vanilla con JSDoc opcional `[no-typescript-vanilla-jsdoc]` (confidence: 0.90) // manual
- Sin linter configurado globalmente — consistencia vía taste `[no-global-linter]` (confidence: 0.75) // manual
- `noUnusedLocals: true` en `tsconfig.json` como rule de CI para detectar imports, variables y parámetros muertos — equivalente a un linter de dead code, cero dependencias extra `[ts-no-unused-locals-ci]` (confidence: 0.95) // manual
- Dead code pattern: imports de módulos/funciones que nunca se usan en el archivo `[ts-dead-imports]` (confidence: 0.95) // manual
- Dead code pattern: variables locales declaradas pero nunca leídas `[ts-dead-variables]` (confidence: 0.95) // manual
- Dead code pattern: parámetros de función que nunca se referencian en el body `[ts-dead-parameters]` (confidence: 0.95) // manual
- Dead code pattern: funciones completas que nunca se llaman `[ts-dead-functions]` (confidence: 0.90) // manual
- Variable shadowing: cuando una variable local tiene el mismo nombre que un parámetro o variable externa, renombrar la local puede requerir cambios en cascada — revisar todas las referencias antes de renombrar `[ts-variable-shadowing-cascade]` (confidence: 0.90) // manual
- Taste compiler rule: las bullets de reglas no deben empezar con `**` (bold) — el parser `parseRulesFromMarkdown` las filtra silenciosamente como pattern descriptors. Usar texto plano al inicio y aplicar bold solo en medio de la oración. `[taste-rule-no-leading-bold]` (confidence: 0.95) // manual
- Al finalizar una tarea, listar qué archivos cambiaron y detenerse; el humano revisa diffs y ejecuta commit/push manualmente `[git-post-task-list-changes]` (confidence: 0.95) // manual
- `git diff` antes de cualquier operación destructiva para verificar cambios esperados `[git-diff-before-destructive]` (confidence: 0.90) // manual
- `git status --short` para confirmar que no hay archivos privados o sensibles staged (.env, data/, logs/, settings.local.json) `[git-status-short-check]` (confidence: 0.95) // manual
- `git log --oneline -10` para entender el contexto reciente antes de hacer cambios significativos `[git-log-oneline-context]` (confidence: 0.85) // manual
- `git diff --check` para detectar whitespace errors y conflict markers antes de commit `[git-diff-check-whitespace]` (confidence: 0.90) // manual
- Si no hay historial de git, establecer convenciones de commit messages antes del primer commit — por defecto, no hay convenciones establecidas `[git-no-history-set-conventions]` (confidence: 0.90) // manual
- ADRs se guardan en `docs/adr/` con formato `NNNN-description.md` `[adr-location-format]` (confidence: 0.98) // manual
- Formato ADR: YAML frontmatter con `adr`, `title`, `status` (accepted | proposed | deprecated) `[adr-yaml-frontmatter]` (confidence: 0.98) // manual
- `docs/adr/NODE_API_GUIDE.md` es la guía técnica de API — se actualiza manualmente cuando cambian interfaces de nodos, animación o inspectores `[adr-node-api-guide]` (confidence: 0.95) // manual
- `CONTEXT.md` es el documento integral del proyecto — se actualiza después de implementaciones significativas (nuevos sistemas, cambios de arquitectura, migraciones) `[doc-context-md-integral]` (confidence: 0.95) // manual
- `README.md` es la landing page del repo — contiene resumen ejecutivo del proyecto y enlaces a docs/ `[doc-readme-landing]` (confidence: 0.95) // manual
- `CLAUDE.md` es el entry point del agente — referencia al Taste System (`.taste/`) como fuente de verdad, load order priority 5, y reglas de post-task automation `[doc-claude-md-entry]` (confidence: 0.98) // manual
- `AGENTS.md` contiene instrucciones específicas para el agente — incluye reglas de wiki Fusion, git never-auto-commit y estructura del proyecto `[doc-agents-md-instructions]` (confidence: 0.98) // manual
- Las lecciones (`lessons/`) son archivos HTML auto-contenidos que documentan conceptos específicos (nodos Fusion, resúmenes de video) — no tienen formato fijo `[doc-lessons-html]` (confidence: 0.90) // manual
- Los archivos de referencia (`reference/`) son HTML estáticos que documentan APIs o conceptos externos — no se editan directamente `[doc-reference-html]` (confidence: 0.90) // manual
- El Taste System (`.taste/`) es la fuente de verdad para reglas de ingeniería — los archivos legacy (`CLAUDE.md`, `FREEBIFF_CORE_ENGINEERING_RULES.md`) son fallback `[doc-taste-system-authority]` (confidence: 0.98) // manual
- `graphify update .` post-task para mantener grafo actualizado `[graphify-update-post]` (confidence: 0.95) // manual
- `graphify query` como primera fuente para preguntas del código `[graphify-query-first-source]` (confidence: 0.90) // manual
- `graphify explain` para conceptos específicos `[graphify-explain-specific]` (confidence: 0.85) // manual
- `tools/improve-slugs.js` — linter de calidad para `[id]` slugs en `.taste/*/index.md` `[slug-linter-improve-slugs]` (confidence: 0.95) // manual
- Uso: `node tools/improve-slugs.js --check` — analiza los 346 slugs y reporta issues de calidad `[slug-linter-check-flag]` (confidence: 0.95) // manual
- Origen: originalmente fue un script one-shot que mapeó ~450 slugs viejos a versiones mejoradas (332 aplicados), luego refactorizado a linter permanente con `--check` `[slug-linter-origin-refactored]` (confidence: 0.95) // manual
- usar AI solo para boilerplate, no para lógica de dominio `[ai-code-generation]` (confidence: 0.85)

## patterns

### Test naming convention


- **trigger:** Crear un nuevo archivo de test (confidence: 0.95)
- **action:** Nombrar con prefijo descriptivo tipo `test{Nodo}{Contexto}` — ej. `testSingleNode`, `testWithBG`, `testDualInput`, `testChain`, `test3DChain`, `testWithTimeout` (confidence: 0.90)
- **rationale:** El naming descriptivo permite identificar qué test falló sin leer el código; el patrón `test[Operación][Contexto]` es consistente con los tests existentes (confidence: 0.90)

### Test structure: node composition test


- **trigger:** Escribir un test de composición de nodos (confidence: 0.95)
- **action:** Seguir el patrón: limpiar nodos previos → agregar nodos → conectar → esperar render → verificar errores via console interceptor (confidence: 0.95)
- **rationale:** El render pipeline captura errores gracefulmente (try/catch en processNodeCanvas), por lo que la forma más confiable de detectar fallos es monitorear console.warn/error (confidence: 0.90)

### Test structure: Playwright integration


- **trigger:** Escribir un test de integración end-to-end (confidence: 0.90)
- **action:** Seguir el patrón de 6 fases: Static IDs → data-action → data-toggle → Interactive behavior → Console error audit → Report con passed/failed counts (confidence: 0.95)
- **rationale:** El proyecto no tiene bundler ni framework, por lo que los tests de integración deben verificar elementos DOM directamente y simular clicks/user interactions via Playwright API (confidence: 0.90)

### Git: Post-task diff review


- **trigger:** Al completar cualquier tarea de código (confidence: 0.95)
- **action:** Mostrar al humano los archivos modificados con `git diff --stat`, sin hacer commit (confidence: 0.95)
- **rationale:** El humano revisa los diffs y decide cuándo y cómo commitear (confidence: 0.95)

### Doc: New ADR decision


- **trigger:** Antes de implementar una decisión de diseño con trade-offs significativos (confidence: 0.95)
- **action:** Crear `docs/adr/NNNN-description.md` siguiendo el formato YAML frontmatter con `adr`, `title`, `status` + contexto → decisión → consecuencias (confidence: 0.98)
- **rationale:** Los ADRs capturan el contexto y las alternativas consideradas para que futuros contribuyentes entiendan por qué se tomaron ciertas decisiones (confidence: 0.95)

### Doc: Update NODE_API_GUIDE.md


- **trigger:** Después de agregar un nuevo tipo de nodo, cambiar interfaces de API, agregar propiedades animables, o modificar el inspector/Spline View (confidence: 0.95)
- **action:** Actualizar `docs/adr/NODE_API_GUIDE.md` — agregar entrada en tabla de nodos, ejemplos de código, y referencia de archivos (confidence: 0.95)
- **rationale:** La guía de API es la referencia técnica principal para desarrolladores y agentes que trabajan con nodos, animación y modifiers (confidence: 0.95)

### Doc: Update CONTEXT.md


- **trigger:** Después de una implementación significativa: nuevo sistema, cambio de arquitectura, migración, o cambios en la estructura del proyecto (confidence: 0.95)
- **action:** Actualizar `CONTEXT.md` — agregar entrada en Implementaciones Completadas, actualizar estructura de archivos si cambió, y modificar fecha de última actualización (confidence: 0.95)
- **rationale:** `CONTEXT.md` es el documento integral que los agentes leen al inicio de una sesión para entender el estado completo del proyecto (confidence: 0.95)

### Doc: Update README.md


- **trigger:** Después de cambios estructurales que afectan la descripción del proyecto, nuevas capacidades principales, o cambios en la stack (confidence: 0.90)
- **action:** Actualizar la sección relevante en `README.md` — nuevo sistema, nueva integración, o cambio de stack/arquitectura (confidence: 0.90)
- **rationale:** `README.md` es la cara del proyecto en GitHub y la primera fuente de información para nuevos visitantes (confidence: 0.95)

### Taste lint pre-commit


- **trigger:** Antes de cada commit que modifique .taste/
- **action:** Ejecutar `node tools/validate-taste.js --all`
- **rationale:** Asegura que el taste siempre esté en formato válido

### Lint: slug quality pre-commit


- **trigger:** Antes de cada commit que modifique .taste/*/index.md (confidence: 0.90)
- **action:** Ejecutar `node tools/improve-slugs.js --check` — reporta issues de calidad en slugs [id]: longitud > 35 chars, acentos perdidos, truncamiento, prefijos numéricos (confidence: 0.90)
- **rationale:** Los slugs son el identificador único de cada regla; mantenerlos legibles y consistentes evita duplicados y confusión en compilación y override matching (confidence: 0.90)

> **74 rules · confidence 0.75**
> **levels:** P6:legacy, P5:CLAUDE.md, P3:.taste/tools/index.md, P1:settings.local.json
