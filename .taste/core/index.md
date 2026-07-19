# taste: core

> **domain:** Reglas de ingeniería fundamentales del proyecto ARC Editor
> **confidence:** 0.95
> **updated:** 2026-06-30
> **version:** 1
> **migrated_from:** FREEBIFF_CORE_ENGINEERING_RULES.md

## preferences

### schema (detected)

- Schema version 2.0.0 con 11 definiciones de nodo en 8 categorías `[schema-v2-11-node-defs]` (confidence: 0.98) // survey-detected
- 2 tipos de puerto: video_stream (max 1 conn), mask (max 1 conn) `[schema-port-types]` (confidence: 0.98) // survey-detected
- 7 tipos de propiedad: string → widget:text, number → widget:number, range → widget:slider, color → widget:color-picker, boolean → widget:toggle, select → widget:dropdown, media → widget:file-picker `[schema-prop-types]` (confidence: 0.98) // survey-detected
- schema.json es la única fuente de verdad — no inventar tipos, nodos o parámetros que no existan aquí `[schema-json-source-of-truth]` (confidence: 0.98) // survey-detected
- 11 reglas de flujo de datos en dataFlow.rules `[dataflow-rules-11]` (confidence: 0.95) // survey-detected
- Sistema de animación definido en schema: 3 modifiers (description, oscillate, shake) `[schema-animation-modifiers]` (confidence: 0.95) // survey-detected
- Pipeline de render definido: 6 pasos, caché: true `[schema-render-pipeline]` (confidence: 0.95) // survey-detected
- Modelo de capas con 5 campos: id, start, duration, hidden, locked `[schema-layer-model]` (confidence: 0.95) // survey-detected
- Efectos globales: noise, noiseOpacity, noiseSpeed, scanlines, vignette, glitch, blur, saturation, hueRotate `[schema-global-effects]` (confidence: 0.90) // survey-detected
- 12 modos de mezcla definidos con compositeOp mapping `[blend-modes-12]` (confidence: 0.95) // survey-detected
- 5 funciones de easing definidas con fórmulas `[easing-functions-5]` (confidence: 0.95) // survey-detected
- 21 formatos de media soportados (image/video/audio) `[media-formats-21]` (confidence: 0.95) // survey-detected

### code style

- Punto y coma obligatorio `[semicolon-required]` (confidence: 0.75) // survey-detected
- Comillas simples como default `[single-quotes-default]` (confidence: 0.70) // survey-detected

### architecture

- La fuente de la verdad para tipos de nodos es `NODE_DEFS` en `engine.js` — no inventar tipos, parámetros o props que no existan allí `[source-of-truth-node-defs]` (confidence: 0.95)
- `schema.json` contiene la definición de esquemas complementarios (grafos, conexiones), no los tipos runtime de nodos `[schema-json-complementary]` (confidence: 0.90)
- SRP: archivos < 200 líneas, sino dividir en submódulos lógicos `[srp-200-lines-max]` (confidence: 0.85)
- Cero magia, cero suposiciones: si las instrucciones son ambiguas, preguntar `[zero-magic-zero-assumptions]` (confidence: 0.95)
- Sin código defensivo genérico: capturar solo errores esperados, no try/catch genéricos `[no-generic-defensive-code]` (confidence: 0.80)
- Modularidad: cada archivo debe hacer solo una cosa `[modularity-single-responsibility]` (confidence: 0.90)
- Sin TypeScript: JavaScript vanilla con JSDoc opcional — decisión arquitectónica `[no-typescript-vanilla-jsdoc]` (confidence: 0.90)

### workflow

- Graphify primero: leer dependencias antes de modificar funciones importadas `[graphify-first-read-deps]` (confidence: 0.95)
- Comentarios senior: documentar POR QUÉ, no QUÉ `[senior-comments-why-not-what]` (confidence: 0.85)
- Testing primero: escribir test antes o junto con la implementación `[testing-first-write-before-code]` (confidence: 0.80)

## patterns

### Schema validation before new types

- **trigger:** Antes de agregar un nuevo tipo de nodo o parámetro
- **action:** Verificar que exista en `NODE_DEFS` (engine.js) — no inventar tipos que no estén definidos
- **rationale:** El sistema de render delega por tipo de nodo; un tipo inexistente causa renderizado nulo

## anti-patterns

### God Object / Monoarchivo

- **description:** Archivos que superan las 200 líneas sin dividirse
- **why:** Dependencias ocultas, difícil de testear, difícil de navegar para IA
- **instead:** Dividir en submódulos lógicos con SRP

### Código Defensivo Genérico

- **description:** Envolver todo en try/catch sin capturar errores específicos
- **why:** Oculta bugs reales, hace el código más difícil de depurar
- **instead:** Capturar solo errores esperados (archivo no encontrado, error de decodificación, etc.)
