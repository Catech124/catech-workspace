# taste: skills

> **domain:** Playbooks reutilizables y workflows del agente
> **confidence:** 0.90
> **updated:** 2026-06-30
> **version:** 2

## preferences

### persistence system (detected)

- 11 métodos de persistencia detectados `[persistence-methods-11]` (confidence: 0.95) // survey-detected
- localStorage: 10 métodos `[localstorage-methods]` (confidence: 0.95)
  - Clave `STORAGE_KEY` = `arc-editor-project` `[storage-key-arc-editor]` (confidence: 0.95)
  - Clave `PROJECT_MANIFEST_KEY` = `arc-editor-manifest` `[project-manifest-key]` (confidence: 0.95)
  - Clave `PROJECT_PREFIX` = `arc-project-` `[clave-project-prefix-arc-project]` (confidence: 0.95)
- Auto-save debounced (500ms) via state:changed events `[auto-save-debounced-500ms]` (confidence: 0.95) // survey-detected
- Undo/Redo: 50 niveles, snapshots automáticos en SNAPSHOT_KEYS `[undo-redo-50-levels]` (confidence: 0.98) // survey-detected
- Batch operations: beginBatch/endBatch para operaciones atómicas `[batch-operations-atomic]` (confidence: 0.95) // survey-detected
- Project manifest (arc-editor-manifest) `[project-manifest]` (confidence: 0.90) // survey-detected
- File System Access API: 10 métodos para proyecto en disco (project.json + assets/) `[file-system-access-api]` (confidence: 0.95) // survey-detected
- Backend API (Express server): 4 endpoints `[backend-api-express]` (confidence: 0.90) // survey-detected
  - API.saveProject() `[api-saveproject]` (confidence: 0.95)
  - API.loadProject() `[api-loadproject]` (confidence: 0.95)
  - API.listProjects() `[api-listprojects]` (confidence: 0.95)
  - API.deleteProject() `[api-deleteproject]` (confidence: 0.95)
- Project dialog: save modal + load modal + project list `[project-dialog-save-load]` (confidence: 0.95) // survey-detected
- 3 métodos de persistencia: localStorage + File System Access API + Node.js server `[persistence-three-methods]` (confidence: 0.95) // survey-detected

### Herramientas del Taste System

- `tools/validate-taste.js` — valida formato y metadata de todos los `.taste/*/taste.md` `[tool-validate-taste]` (confidence: 0.98)
- `tools/compile-taste.js` — compila 8 packages → `COMPILED_TASTE.md` (uso como system prompt) `[tool-compile-taste]` (confidence: 0.98)
- `tools/survey-taste.js` — escanea el proyecto y sugiere reglas a agregar en `.taste/` `[tool-survey-taste]` (confidence: 0.90)
- **Flujo estándar**: survey → apply → validate → compile `[skill-flujo-estandar]` (confidence: 0.90)
- **Load order**: `taste.md` → `core/taste.md` → `frontend/taste.md` → `backend/taste.md` → `tools/taste.md` → `nodes/taste.md` → `animation/taste.md` → `skills/taste.md` `[skill-load-order]` (confidence: 0.95)

### Post-task automation

- Ejecutar `graphify update .` al finalizar cada tarea para mantener el knowledge graph actualizado `[post-task-graphify-update]` (confidence: 0.95)
- Sugerir `node tools/survey-taste.js` para detectar nuevas reglas `[post-task-suggest-survey]` (confidence: 0.85)
- Ejecutar `node tools/compile-taste.js` si se modificaron archivos `.taste/` `[post-task-compile-taste]` (confidence: 0.90)

### Dead code cleanup post-config

- Trigger: después de habilitar noUnusedLocals en tsconfig.json — cualquier regla strict que exponga dead code `[post-task-dead-code-trigger]` (confidence: 0.95)
- Action: ejecutar npx tsc --noEmit para listar errores, agrupar por tipo y limpiar sistemáticamente `[post-task-dead-code-action]` (confidence: 0.90)
- Action step: agrupar errores por tipo: imports, variables, parámetros, funciones muertas `[post-task-dead-code-group]` (confidence: 0.90)
- Action step: remover imports no usados individualmente `[post-task-dead-code-remove-imports]` (confidence: 0.90)
- Action step: simplificar variables temporales de un solo uso (inline directo) `[post-task-dead-code-inline-vars]` (confidence: 0.90)
- Action step: remover parámetros de función no usados y actualizar callers `[post-task-dead-code-remove-params]` (confidence: 0.90)
- Action step: remover funciones completas que nunca se llaman `[post-task-dead-code-remove-functions]` (confidence: 0.85)
- Rationale: habilitar reglas strict expone dead code acumulado. Limpiar sistemáticamente evita warning fatigue. `[post-task-dead-code-rationale]` (confidence: 0.90)

### Variable shadowing cascade

- Trigger: al renombrar variable local que shadowea un parámetro o variable externa `[shadowing-cascade-trigger]` (confidence: 0.90)
- Action: buscar todas las referencias en declaración, body, argumentos y shorthands de retorno `[shadowing-cascade-action]` (confidence: 0.90)
- Cascade target: la declaración local de la variable renombrada `[shadowing-cascade-declaration]` (confidence: 0.90)
- Cascade target: el uso de la variable en el body de la función `[shadowing-cascade-usage]` (confidence: 0.90)
- Cascade target: el paso como argumento a otras funciones, incluyendo object shorthands `[shadowing-cascade-argument]` (confidence: 0.90)
- Cascade target: propiedades en objetos de retorno con shorthand ({ variable }) — key debe coincidir con variable en scope `[shadowing-cascade-return]` (confidence: 0.90)
- Rationale: TypeScript no señala el shorthand problemático hasta tsc --noEmit — validación del object literal ocurre en compilación. `[shadowing-cascade-rationale]` (confidence: 0.90)

### Integración con wiki de Fusion

- Usar `wiki/` como fuente local autorizada para preguntas sobre UI/Inspector/Nodos de DaVinci Resolve Fusion `[wiki-local-authority]` (confidence: 0.95)
- **Protocolo de respuesta:**
  1. Leer `wiki/index.md` para identificar páginas relevantes `[wiki-protocol-paso-1]` (confidence: 0.98)
  2. Seguir `[[wikilinks]]` para profundizar en páginas fuente relevantes `[wiki-protocol-paso-2]` (confidence: 0.98)
  3. Citar nombres de páginas del wiki en la respuesta `[wiki-protocol-paso-3]` (confidence: 0.95)
  4. Si la respuesta NO está en el wiki, decirlo claramente y buscar información actualizada en línea en vez de depender solo del training data `[wiki-protocol-paso-4]` (confidence: 0.95)
- **Estructura del wiki:**
  - `wiki/index.md` — punto de entrada, lista todas las páginas y conteo de fuentes `[wiki-index-structure]` (confidence: 0.95)
  - `wiki/overview.md` — resumen cross-source que cita `[[source pages]]` `[wiki-overview-cross-source]` (confidence: 0.95)
  - `wiki/log.md` — registro append-only de cada ingest/refresh `[wiki-log-append-only]` (confidence: 0.95)
  - `wiki/sources/` — una página por fuente ingerida (`<slug>.md`) `[wiki-sources-per-slug]` (confidence: 0.95)
  - `wiki/.archive/` — fuentes soft-deleted (ignorar a menos que se necesiten) `[wiki-archive-deleted]` (confidence: 0.90)
  - `raw/` — capturas inmutables: `github/`, `youtube/`, `web/`, `assets/` `[wiki-raw-immutable-captures]` (confidence: 0.95)
- **Inbox management:** los agentes pueden agregar URLs a `inbox.md` en sección `## Pending` vía `queue`; el resto de ediciones en inbox.md son solo humanas `[wiki-inbox-management]` (confidence: 0.90)
- **Load order:** `wiki/index.md` → páginas fuente relevantes → raw files solo para citas directas `[wiki-load-order]` (confidence: 0.95)
- **Comandos:** `/pin-llm-wiki` (`init`, `run`, `lint`, `queue`, `remove`) para gestionar el wiki `[wiki-comandos]` (confidence: 0.95)
- **Disponibilidad:** el skill pin-llm-wiki corre en Claude Code, Cursor y GitHub Copilot `[wiki-disponibilidad]` (confidence: 0.95)
- **⚠️ No ejecutar `pin-llm-wiki run` automáticamente** — solo cuando el humano determine que hay nueva información externa relevante (documentación de Fusion, tutoriales, etc.) `[wiki-no-auto-run]` (confidence: 0.98)

### Exportación

- **WebM (MediaRecorder)**: método principal, rápido, sin codec externo — usar `captureStream(fps)` + `MediaRecorder` `[export-webm-primary]` (confidence: 0.95)
- **MP4 (FFmpeg.wasm)**: fallback para mayor compatibilidad — carga lazy desde CDN `[export-mp4-fallback]` (confidence: 0.85)
- **PNG/JPEG sequences**: exporta frames individuales como ZIP `[export-png-jpeg-seq]` (confidence: 0.90)
- **GIF**: encoder LZW inline en main.js `[export-gif-lzw]` (confidence: 0.85)
- **HTML standalone**: buildStandaloneHTML() con engine inline + data embebida `[export-html-standalone]` (confidence: 0.90)
- Resolución por defecto: 1920×1080 `[export-default-res-1920-1080]` (confidence: 0.95)
- FPS configurable (default: 30) `[export-fps-30-default]` (confidence: 0.95)

### YouTube Import + Scene Detection

- `downloadFromYouTube(url)`: envía URL al backend `POST /api/download-youtube`, recibe MP4 como blob `[youtube-download-post]` (confidence: 0.90)
- `detectScenes(videoUrl, sensitivity)`: usa FFmpeg.wasm con filtro `select='gt(scene,X)',showinfo` `[scene-detect-ffmpeg]` (confidence: 0.85)
- Slider de sensibilidad (0.1–0.9) para ajustar umbral — se persiste en `props._sceneSens` `[scene-sensitivity-slider]` (confidence: 0.85)
- Botón "🧩 Auto-split en capas": divide video en capas individuales por escena `[scene-auto-split-layers]` (confidence: 0.85)
- Omite segmentos < 0.3s (transiciones cortas) `[scene-skip-short-segments]` (confidence: 0.90)

### graphify navigation

- `graphify query "<question>"` es la primera herramienta para preguntas sobre el codebase, cuando `graphify-out/graph.json` existe `[graphify-query-first]` (confidence: 0.95)
- `graphify path "<A>" "<B>"` para relaciones entre archivos y dependencias `[graphify-path-relations]` (confidence: 0.95)
- `graphify explain "<concept>"` para conceptos específicos del proyecto `[graphify-explain-concept]` (confidence: 0.95)
- Si `graphify-out/wiki/index.md` existe, usarlo para navegación amplia en vez de leer archivos fuente directamente `[graphify-wiki-navigation]` (confidence: 0.90)
- Leer `graphify-out/GRAPH_REPORT.md` solo para revisiones amplias de arquitectura o cuando query/path/explain no proporcionen suficiente contexto `[graphify-report-review]` (confidence: 0.95)
- `graphify update .` se ejecuta post-task (ver post-task automation) `[graphify-update-post-task]` (confidence: 0.95)

### AI Copilot

- Integración con OpenRouter para generación de nodos por texto `[copilot-openrouter-integration]` (confidence: 0.85)
- Comandos en copilot.js: `addNode(type, props, x, y)`, autoLayout, etc. `[copilot-commands-add-node]` (confidence: 0.85)
- Responde en markdown con bloques de comando `{"action":"addNode",...}` `[copilot-respond-markdown]` (confidence: 0.80)
- Estado actual: **🔴 Por diagnosticar** — el AI responde pero no crea nodos en el grafo `[copilot-status-needs-diagnosis]` (confidence: 0.70)

### Rendimiento

→ Ver `animation/taste.md` (performance budget consolidado) para targets numéricos, pooling, cache, downscale y prioridades (confidence: 0.95)

### Store y Persistencia

- `state.js`: Store central con eventos (`key:changed`) y auto-snapshot para undo `[store-central-events]` (confidence: 0.98)
- **Undo/Redo**: 50 niveles máximo, snapshots automáticos al mutar keys trackeadas `[store-undo-redo]` (confidence: 0.98)
- **beginBatch/endBatch**: operaciones atómicas sin múltiples snapshots `[store-batch-operations]` (confidence: 0.95)
- **Auto-save**: debounced 500ms a localStorage vía `state:changed` + `history:changed` events `[store-auto-save]` (confidence: 0.95)
- **3 métodos de persistencia**: localStorage, File System Access API (disco local), Node.js server (:3000) `[store-three-methods]` (confidence: 0.95)
- **Project manifest**: lista de proyectos guardados en `localStorage` key `arc-editor-manifest` `[store-project-manifest]` (confidence: 0.90)
- Keys de proyecto: `arc-project-{name}` `[store-project-keys]` (confidence: 0.90)


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

## anti-patterns

- **No hacer `git commit` automático** — dejar que el humano revise los diffs `[no-auto-git-commit]` (confidence: 0.98) — → Ver `tools/taste.md` (git workflow) para reglas detalladas
- **No instalar paquetes globales** — usar `npm install` (o pnpm/bun/yarn según proyecto) sin `-g` `[no-global-packages]` (confidence: 0.95)
- **No olvidar ejecutar survey después de cambios grandes** — las reglas del taste quedan desactualizadas `[no-forget-survey]` (confidence: 0.85)
- **No compartir `settings.local.json`** — está en `.gitignore` por diseño, contiene overrides personales `[no-share-settings-local]` (confidence: 0.98)
- **No hardcodear URLs de CDN en export standalone** — el HTML exportado debe ser autocontenido `[no-hardcode-cdn-urls]` (confidence: 0.90)
- **No modificar nodos sin snapshot** — imposibilita undo de la operación `[no-modify-no-snapshot]` (confidence: 0.98)
- **No asumir que `captureStream` existe** — Safari/Firefox no lo soportan, tener fallback `[no-assume-capture-stream]` (confidence: 0.90)