# taste: animation

> **domain:** Preferencias de animación (keyframes, modifiers, spline)
> **confidence:** 0.90
> **updated:** 2026-06-30
> **version:** 2

## preferences

### evalPropA node types (detected)

- 11 tipos de nodo usan `evalPropA()` para animación por keyframes + modifiers `[evalpropa-node-types]` (confidence: 0.98) // survey-detected
- Nodos animables: image, text, loader, rectangle, ellipse, polygon, gradient, grid, fast-noise, procedural-shapes, text-plus `[animatable-node-types]` (confidence: 0.95)
- Evaluación combinada: evaluateChannel(keyframes) + evalModifier(modifier) `[eval-channel-modifiers]` (confidence: 0.95) // survey-detected

### animatable properties (detected)

- 28 propiedades animables con color asignado en PROP_COLORS `[prop-colors-mapping]` (confidence: 0.98) // survey-detected
- 20 propiedades con DEFAULT_RANGES predefinidos `[default-ranges-predefined]` (confidence: 0.95) // survey-detected
- Props de capa: size, y, x, brightness, contrast, spacing, opacity, saturate, hue, rotation, scale, gain, tracking `[layer-props-size-x-brightness]` (confidence: 0.95) // survey-detected
- Props de nodo: cx, cy, rx, ry, radius, angle, width, height, columns, rows, gap, lineWidth, seed, time `[node-props-cx-cy-rx-radius]` (confidence: 0.95) // survey-detected
- Tipos de capa animables: text, image, video `[animatable-layer-types]` (confidence: 0.98) // survey-detected

### animation system (detected)

- Sistema de animación de 3 capas: animatedProps (diamantes) + Keyframes + Modifiers `[three-layer-animation-system]` (confidence: 0.95) // survey-detected
- keyframeAPI: setKeyframe / removeKeyframe / getKeyframes `[keyframe-api-crud]` (confidence: 0.98) // survey-detected
- modifierAPI: setModifier / removeModifier / getModifier `[modifier-api-crud]` (confidence: 0.95) // survey-detected
- animatedPropsAPI: toggleAnimatedProp / isAnimatedProp / getAnimatedPropKeys `[animated-props-api]` (confidence: 0.95) // survey-detected
- 5 easing types: linear, easeIn, easeOut, easeInOut, bezier `[easing-types-five]` (confidence: 0.98) // survey-detected
- 3 modifier types: oscillate, shake, step `[modifier-types-three]` (confidence: 0.95) // survey-detected
- Spline View con handles bezier, draggable keyframes, inspector `[spline-view-bezier-handles]` (confidence: 0.95) // survey-detected

### Sistema de animación (tres capas)

- **animatedProps (◆)**: diamantes en el inspector activan/desactivan propiedades en Spline View SIN crear keyframes `[layer-animated-props-diamonds]` (confidence: 0.95)
- **Keyframes**: valores en puntos específicos de tiempo con easing entre ellos `[layer-keyframes-easing]` (confidence: 0.95)
- **Modifiers**: oscilación/shake/step aplicados sobre el valor base `[layer-modifiers-osc-shake]` (confidence: 0.90)
- Evaluación combinada: `evaluateChannel(keyframes) + evalModifier(modifier)` `[eval-combinada-keyframes-modifiers]` (confidence: 0.95)
- Tanto capas de timeline COMO props de nodos tienen animación vía `evalPropA()` `[evalpropa-layers-and-nodes]` (confidence: 0.98)

### Keyframes

- `setKeyframe(entityId, propName, frame, value, ease, handleData?)` `[set-keyframe-signature]` (confidence: 0.98)
- `removeKeyframe(entityId, propName, frame)` `[remove-keyframe-signature]` (confidence: 0.98)
- `getKeyframes(entityId, propName)` → array sorted por frame `[get-keyframes-signature]` (confidence: 0.98)
- Cada keyframe tiene: `{ frame, value, ease, cpRight?, cpLeft? }` `[keyframe-structure]` (confidence: 0.98)
- Easing types: `linear`, `easeIn`, `easeOut`, `easeInOut`, `bezier` `[easing-types-list]` (confidence: 0.98)
- Bezier handles: `cpRight: { x, y }`, `cpLeft: { x, y }` — valores normalizados 0-1 sobre segmento `[bezier-handles-normalized]` (confidence: 0.95)
- Diamond visual en timeline: indica keyframe existente con color según easing `[keyframe-diamond-timeline]` (confidence: 0.95)
- Shift+Click en diamond: elimina keyframe `[shift-click-remove-keyframe]` (confidence: 0.95)

### Modifiers

- `setModifier(entityId, propName, type, params)` `[set-modifier-signature]` (confidence: 0.95)
- `removeModifier(entityId, propName)` `[remove-modifier-signature]` (confidence: 0.95)
- **oscillate**: `{ offset, amplitude, frequency, phase }` — sinusoidal `[modifier-oscillate]` (confidence: 0.95)
- **shake**: `{ offset, amplitude, frequency, smoothness }` — noise-based `[modifier-shake]` (confidence: 0.90)
- Modifiers se aplican en el render de NODOS y capas `[modifiers-applied-nodes-layers]` (confidence: 0.95)
- UI de modifiers en timeline: selector (static/oscillate/shake) + sliders `[modifiers-ui-timeline]` (confidence: 0.95)

### Spline View

- Editor Fusion-style con curvas de animación, keyframes draggables y handles tangentes `[spline-editor-fusion-style]` (confidence: 0.95)
- Actúa sobre la entidad activa: nodo seleccionado O capa seleccionada `[spline-active-entity]` (confidence: 0.95)
- **Doble-click** en canvas spline: crea keyframe en ese punto `[spline-double-click-keyframe]` (confidence: 0.95)
- **Right-click** en keyframe: menú de easing (Linear / Ease In / Ease Out / Ease In Out / Bezier) `[spline-right-click-easing]` (confidence: 0.95)
- **Arrow keys**: nudge posición (Left/Right: 0.1s, Up/Down: 2% del rango) `[spline-arrow-nudge]` (confidence: 0.95)
- **Shift+Arrow**: nudge 5x `[spline-shift-arrow-5x]` (confidence: 0.95)
- **Delete/Backspace**: elimina keyframe seleccionado `[spline-delete-keyframe]` (confidence: 0.95)
- **Drag handles**: ajusta tangentes bezier `[spline-drag-handles]` (confidence: 0.90)
- **Inspector panel**: time input, value input, easing dropdown, handles X/Y `[spline-inspector-panel]` (confidence: 0.95)
- **Dashed lines**: propiedades activas sin keyframes (animatedProps=ON, 0 keyframes) — hover muestra tooltip `[spline-dashed-lines]` (confidence: 0.95)
- **Grid**: divisiones horizontales (5) + verticales (según duración) `[spline-grid]` (confidence: 0.90)
- **Playhead**: línea vertical amarilla sincronizada con timeline `[spline-playhead]` (confidence: 0.98)

### Propiedades animables (PROP_COLORS)

| Propiedad | Color | Nombre | Nodos que la usan |
|---|---|---|---|
| size | `#ffcc44` | Size | text, text-plus |
| x | `#7a9eff` | Pos X | text, text-plus, rectangle, ellipse, polygon |
| y | `#66dd88` | Pos Y | text, text-plus, rectangle, ellipse, polygon |
| opacity | `#ff6688` | Opacidad | layers, text-plus |
| brightness | `#7a9eff` | Brillo | image, loader |
| contrast | `#dd8844` | Contraste | image, loader |
| spacing | `#9966dd` | Spacing | text |
| saturate | `#44ddaa` | Saturación | colorgrade |
| hue | `#ff66aa` | Hue | colorgrade |
| cx | `#7a9eff` | Centro X | ellipse, polygon |
| cy | `#66dd88` | Centro Y | ellipse, polygon |
| rx | `#ffcc44` | Radio X | ellipse |
| ry | `#ff6688` | Radio Y | ellipse |
| radius | `#dd8844` | Radio | blur, glow, polygon |
| rotation | `#44ddaa` | Rotación | text-plus, polygon |
| scale | `#9966dd` | Escala | transform |
| gain | `#ff66aa` | Ganancia | loader, merge |
| tracking | `#44ddff` | Tracking | text, text-plus |
| width | `#ff8844` | Ancho | rectangle |
| height | `#ff4488` | Alto | rectangle |
| columns | `#44ddaa` | Columnas | grid |
| rows | `#66bbff` | Filas | grid |
| gap | `#9977dd` | Separación | grid |
| lineWidth | `#ffbb44` | Grosor línea | grid |
| seed | `#dd88ff` | Semilla | fast-noise, procedural-shapes |
| time | `#88ddff` | Tiempo | fast-noise |

(confidence: 0.95)

### DEFAULT_RANGES

- Cada propiedad tiene un rango por defecto para escalar el eje Y del spline `[default-ranges-per-prop]` (confidence: 0.90)
- Rango se auto-ajusta al valor mínimo/máximo de los keyframes + padding 15% `[range-auto-adjust-keyframes]` (confidence: 0.95)
- Propiedades sin keyframes usan `DEFAULT_RANGES` para línea punteada `[default-ranges-no-keyframes]` (confidence: 0.90)

### performance budget

- **Target: 60fps (16ms por frame)** para playback en tiempo real `[perf-target-60fps]` (confidence: 0.95)
- **Frame budget allocation:**
  - Render pipeline: ~8ms (processNodeCanvas + compositing) `[render-pipeline-8ms]` (confidence: 0.85)
  - UI updates: ~3ms (inspector, timeline, spline) `[ui-updates-3ms]` (confidence: 0.85)
  - Headroom: ~5ms para GC, input processing, resize `[headroom-5ms-gc]` (confidence: 0.85)

### Canvas & ImageData Pooling

- **Canvas pool** (`canvas-pool.js`): máximo 12 canvases intermedios reutilizados por tamaño `[pool-canvas-max-12]` (confidence: 0.95)
- **ImageData pool**: reutiliza ImageData y ClampedArray para blur/glow/displace vía `acquireImageData()` / `acquireClampedArray()` `[pool-imagedata-reuse]` (confidence: 0.90)
- **Pool cleanup**: `releaseAll()` se llama al rebuild del grafo `[pool-cleanup-release]` (confidence: 0.90)
- **No crear contextos 2D nuevos por frame** — obtener una vez al init, reutilizar `[pool-no-new-contexts]` (confidence: 0.98)

### Downscale & Cache

- **Downscale 0.5x durante playback**: render a resolución reducida (−75% píxeles), upscale al mostrar `[cache-downscale-0-5x]` (confidence: 0.95)
- **Static node cache** (`_staticNodeCache` + `isNodeSubtreeStatic`): evita re-renderizar nodos sin animación entre frames consecutivos `[cache-static-node]` (confidence: 0.90)
- **Node types time-dependent (no cacheados):** noise, glitch, fast-noise, ripple, video, tracker, text, loader, procedural-shapes `[cache-time-dependent-types]` (confidence: 0.95)
- **Downscale se desactiva en pausa** para mostrar calidad completa al editar `[cache-downscale-pause-off]` (confidence: 0.90)

### Prioridad de optimizaciones

1. **Pooling primero** — canvas pool + ImageData pool (mayor impacto, mínimo esfuerzo) `[opt-priority-pooling]` (confidence: 0.95)
2. **Static cache** — evitar re-render de nodos estáticos (segundo mayor impacto) `[opt-priority-static-cache]` (confidence: 0.90)
3. **Downscale durante playback** — sacrificar calidad por velocidad cuando es crítico `[opt-priority-downscale]` (confidence: 0.95)
4. **Web Workers** — mover cálculos pesados (nodos matemáticos, procesamiento de imágenes) fuera del main thread `[opt-priority-web-workers]` (confidence: 0.85)
5. **requestAnimationFrame** para sincronizar actualizaciones con el vsync del monitor, no `setInterval` `[opt-priority-raf]` (confidence: 0.98)

### Animación de capas (timeline)

- `drawLayerBase()` evalúa keyframes vía `evalProp(channels, modifiers, key, t, fallback)` `[draw-layer-base-eval-prop]` (confidence: 0.95)
- Tipos de capa: text (size, y, spacing), image (brightness, contrast), video (opacity) `[layer-types-text-image]` (confidence: 0.95)
- Morph animation en texto: enter/hold/exit con opacity + blur + scale `[morph-animation-text]` (confidence: 0.90)
- Layer-level opacity se bakea en el canvas antes de pasar al merge chain `[layer-opacity-baked-pre-merge]` (confidence: 0.95)

### Animación de nodos (engine-generators)

- `evalPropA(key, fallback)`: evalúa BOTH keyframes (vía `evaluateChannel`) AND modifiers (vía `evalModifier`) `[evalpropa-keyframes-modifiers]` (confidence: 0.98)
- Todos los generadores usan `evalPropA()` en sus props numéricas `[generators-use-evalpropa]` (confidence: 0.98)
- Text+: size, tracking, leading, x, y, rotation, opacity, vAnchorOffset, vJustify, hAnchorOffset, hJustify, writeOnStart, writeOnEnd `[text-plus-animatable-props]` (confidence: 0.95)
- Formas: rectangle (x, y, width, height, rx), ellipse (cx, cy, rx, ry), polygon (cx, cy, radius, rotation) `[shape-animatable-props]` (confidence: 0.95)
- Procedural shapes: count, sizeMin, sizeMax, opacity, speed, seed `[procedural-shapes-props]` (confidence: 0.90)
- Loader: brightness, contrast, gain `[loader-animatable-props]` (confidence: 0.95)

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

## anti-patterns

- **No mutar `animationChannels` directamente**: usar `setKeyframe` / `removeKeyframe`, no modificar el array in-place `[no-mutar-animation-channels]` (confidence: 0.95)
- **No olvidar `Store.snapshot()` al modificar animación**: sin snapshot, undo no funciona `[no-forget-snapshot]` (confidence: 0.98)
- **No hardcodear easing**: preferir `easeInOut` para motion natural en lugar de `linear` `[no-hardcode-easing]` (confidence: 0.85)
- **No duplicar keyframes en el mismo frame**: `setKeyframe` filtra por diferencia < 0.01s, pero verificar antes `[no-duplicate-keyframes]` (confidence: 0.90)
- **No animar props no-numéricas**: animatedProps solo funciona con `typeof prop === 'number'` `[no-animate-non-numeric]` (confidence: 0.95)
- **No olvidar `animatedProps` en persistencia**: `serializeState()` debe incluir `animatedProps` y `restoreFromData()` restaurarlo `[no-forget-animated-props-persist]` (confidence: 0.95)
- **No usar valores default fijos en evalPropA**: pasar el valor del prop como fallback para que el slider refleje el valor real `[no-fixed-default-evalpropa]` (confidence: 0.90)