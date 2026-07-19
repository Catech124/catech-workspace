# taste: frontend

> **domain:** Preferencias de UI/UX, Canvas, CSS y eventos del ARC Editor
> **confidence:** 0.88
> **updated:** 2026-06-30
> **version:** 1

## preferences

### copilot patterns (detected)

- Chat panel Copilot con toggle, minimizar y settings `[copilot-chat-panel]` (confidence: 1.0) // survey-detected
- 6 comandos slash integrados: ayuda, limpiar, reset, explosion, introvideo, cinema `[copilot-six-slash-commands]` (confidence: 0.98) // survey-detected
- Selector de modelos con 24 providers agrupados `[copilot-model-selector-24]` (confidence: 0.95) // survey-detected
- Panel arrastrable con persistencia de posición via localStorage `[copilot-draggable-panel]` (confidence: 0.95) // survey-detected
- Control de tamaño de fuente (✓ slider + persist) `[copilot-font-size-slider]` (confidence: 0.95) // survey-detected
- 5 acciones de grafo: addNode, setProp, connect, deleteNode, autoLayout `[copilot-five-graph-actions]` (confidence: 0.98) // survey-detected
- Contexto de composición enviado al LLM vía cpBuildGraphContext() `[copilot-graph-context-llm]` (confidence: 0.98) // survey-detected
- Chat persistente con historial + mensajes en localStorage `[copilot-chat-persist]` (confidence: 0.95) // survey-detected
- Resaltado de markdown (código, negrita, cursiva) `[copilot-markdown-highlight]` (confidence: 0.98) // survey-detected

### ui events (detected)

- 14 interacciones de grafo detectadas `[graph-interactions-14]` (confidence: 0.95) // survey-detected
  - Ctrl+Wheel zoom (0.2–3.0x) `[ctrl-wheel-zoom-0-2-3-0x]` (confidence: 0.95)
  - Middle-button pan `[middle-button-pan]` (confidence: 0.95)
  - Port-to-port connection drag `[port-to-port-connection-drag]` (confidence: 0.95)
  - Shift+drag wire insert (Fusion-style) `[shift-drag-wire-insert-fusion-style]` (confidence: 0.95)
  - Node drag with multi-select `[node-drag-with-multi-select]` (confidence: 0.95)
  - Marquee selection on empty area `[marquee-selection-on-empty-area]` (confidence: 0.95)
  - Output→Output auto-merge (Gap 2) `[output-output-auto-merge-gap-2]` (confidence: 0.95)
  - Drop on body auto-connect (Gap 1) `[drop-on-body-auto-connect-gap-1]` (confidence: 0.95)
  - Viewer dot assignment (v1/v2) `[viewer-dot-assignment-v1-v2]` (confidence: 0.95)
  - Ctrl+Click floating preview `[ctrl-click-floating-preview]` (confidence: 0.95)
  - Drag & drop media import `[drag-drop-media-import]` (confidence: 0.95)
  - Paste from clipboard media import `[paste-from-clipboard-media-import]` (confidence: 0.95)
  - Dynamic toolbar from NODE_DEFS categories `[dynamic-toolbar-defs]` (confidence: 0.95)
  - Right-click context menu `[right-click-context-menu]` (confidence: 0.95)
- Indicadores visuales de tipo Fusion: Node Sizing (⊞), Key palette (🔑), Color wheels (●), Curves (∿), Qualifier (◑), Blur/Sharpen (◎) `[fusion-indicators-visual]` (confidence: 0.95) // survey-detected
- Colores de wire por rol: bg -> gold (#d4a017), fg -> green (#4caf50), mask -> blue (#3b82f6), matte -> yellow (#fc0) `[wire-colors-by-role]` (confidence: 0.95) // survey-detected
- 3 atajos de teclado detectados `[keyboard-shortcuts-detected]` (confidence: 0.95) // survey-detected
  - Delete (Remove node) `[delete-remove-node]` (confidence: 0.95)
  - 1 (Timeline view) `[timeline-view-key-1]` (confidence: 0.95)
  - 2 (Nodes view) `[nodes-view-key-2]` (confidence: 0.95)
- Binding pattern: DOMContentLoaded + querySelector + event delegation via data-action `[binding-domcontentloaded-delegation]` (confidence: 0.95) // survey-detected

### rendering

- Canvas 2D para renderizado de nodos `[canvas-2d-node-render]` (confidence: 0.95)
- `requestAnimationFrame` para actualizaciones del canvas `[request-animation-frame]` (confidence: 0.90)
- Web Workers para procesamiento pesado (cálculos de nodos matemáticos) `[web-workers-heavy-compute]` (confidence: 0.85)
→ Ver `animation/taste.md` (performance budget) para pooling, cache, downscale y frame budget (confidence: 0.95)

### css

- BEM para CSS: clases descriptivas como `.node-panel__input--active` `[css-bem-naming]` (confidence: 0.80)
- Tema oscuro slate: fondo `#0d1117`, texto `#e6edf3`, acento azul `#58a6ff` `[css-dark-theme-slate]` (confidence: 0.90)
- Sin estilos en línea via JavaScript excepto para posiciones dinámicas `[css-no-inline-styles]` (confidence: 0.85)
- CSS Grid para layouts complejos, Flexbox para componentes lineales `[css-grid-flexbox]` (confidence: 0.85)- Indentación: tabs `[indentacion-tabs]` (confidence: 0.85) // survey-detected

### keyboard shortcuts

- Ctrl+S: Guardar proyecto `[shortcut-ctrl-s-save]` (confidence: 0.98)
- Ctrl+O: Abrir proyecto `[shortcut-ctrl-o-open]` (confidence: 0.98)
- Ctrl+Shift+N: Nuevo proyecto `[shortcut-ctrl-shift-n-new]` (confidence: 0.95)
- Ctrl+Z: Undo `[shortcut-ctrl-z-undo]` (confidence: 0.98)
- Ctrl+Y: Redo `[shortcut-ctrl-y-redo]` (confidence: 0.98)
- Ctrl+D: Duplicar nodos seleccionados `[shortcut-ctrl-d-duplicate]` (confidence: 0.95)
- Ctrl+T: Swap inputs de Merge `[shortcut-ctrl-t-swap-merge]` (confidence: 0.95)
- Ctrl+A: Seleccionar todos los nodos `[shortcut-ctrl-a-select-all]` (confidence: 0.95)
- 1/2/3: Cambiar vista Timeline/Nodes/Spline `[shortcut-1-2-3-views]` (confidence: 0.98)
- Delete: Eliminar nodo(s) seleccionado(s) `[shortcut-delete-node]` (confidence: 0.98)
- Escape: Cerrar menú contextual / deseleccionar `[shortcut-escape-deselect]` (confidence: 0.95)

### ui interaction

- Drag desde toolbar: crea nodo en la posición de drop `[drag-toolbar-create-node]` (confidence: 0.98)
- Click en nodo: selecciona `[click-node-select]` (confidence: 0.98)
- Click + drag en canvas vacío: marquee selection `[click-drag-marquee-select]` (confidence: 0.95)
- Click en wire: elimina conexión `[connection-click-remove]` (confidence: 0.95)
- Drag desde output port a input port: crea conexión `[drag-port-to-port-connect]` (confidence: 0.98)
- Drop en body de nodo: auto-conecta al primer input disponible `[drop-node-body-autoconnect]` (confidence: 0.95)
- Shift+drag sobre wire: inserta nodo entre dos conectados (Fusion-style) `[connection-shift-drag-insert]` (confidence: 0.90)
- Ctrl+Click en nodo: floating preview `[navigate-ctrl-click-preview]` (confidence: 0.95)
- Ctrl+Wheel en canvas: zoom (0.2x–3.0x) centrado en cursor `[ctrl-wheel-zoom-centered]` (confidence: 0.98)
- Middle-button drag: pan del grafo `[navigate-middle-pan]` (confidence: 0.98)

### inspector panel

- 4 tabs: Controls / Modifiers / Spline / LUTs `[inspector-four-tabs]` (confidence: 0.95)
- Controls tab: sliders para props numéricas, color pickers, dropdowns para enums `[inspector-controls-tab]` (confidence: 0.95)
- Modifiers tab: selector (static/oscillate/shake/step) + sliders de parámetros `[inspector-modifiers-tab]` (confidence: 0.95)
- Spline tab: editor de keyframes con time input, value input, easing dropdown, handles bezier X/Y `[inspector-spline-tab]` (confidence: 0.95)
- LUTs tab: lookup table management `[inspector-luts-tab]` (confidence: 0.80)
- Inspector se actualiza al seleccionar nodo o capa `[inspector-update-on-select]` (confidence: 0.95)

### timeline view

- Layers list con thumbnails, nombres, toggle de visibilidad `[timeline-layers-list]` (confidence: 0.95)
- Playhead draggable sobre ruler `[timeline-playhead-draggable]` (confidence: 0.98)
- In/out points para rango de composición `[timeline-in-out-points]` (confidence: 0.90)
- Snapping a frames, keyframes y bordes de capa `[timeline-snapping]` (confidence: 0.90)
- Track height ajustable `[timeline-track-height]` (confidence: 0.85)
- Keyframes visibles como diamonds en cada track layer `[timeline-keyframe-diamonds]` (confidence: 0.95)

## patterns

### Module structure

- **trigger:** Crear un nuevo archivo JS
- **action:** Usar ES modules nativos (`export` / `import`), sin bundlers
- **rationale:** El proyecto no usa bundler por decisión arquitectónica

### Canvas initialization

- **trigger:** Inicializar un canvas
- **action:** Obtener contexto 2D una vez, reusarlo, actualizar via requestAnimationFrame
- **rationale:** Crear contextos nuevos en cada frame es ineficiente y causa GC

## anti-patterns

### Inline styles in JS

- **description:** Usar `element.style.property = value` para estilos que no son posiciones dinámicas
- **why:** Dificulta el mantenimiento, rompe la separación de concerns
- **instead:** Usar clases BEM definidas en style.css

### Bloquear el Main Thread

- **description:** Procesamiento pesado (blurs, glows, cálculos de nodos) en el hilo principal
- **why:** Bloquea la UI, causa jank a 60fps
- **instead:** Mover a Web Workers o usar OffscreenCanvas
