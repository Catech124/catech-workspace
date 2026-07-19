# taste: tools

> **domain:** Preferencias de toolchain, scripts y herramientas
> **confidence:** 0.90
> **updated:** 2026-06-30
> **version:** 1

## preferences

### git workflow (detected)

- Repositorio git inicializado (filemode=false, ignorecase=true) // survey-detected `[git-repo-initialized]` (confidence: 0.95) // survey
- Post-task automation: CLAUDE.md + graphify update `[git-post-task-automation]` (confidence: 0.98) // survey-detected
- .gitignore con 0 patrones () `[gitignore-zero-patterns]` (confidence: 0.95) // survey-detected
- 1 commits en historial `[git-one-commit-history]` (confidence: 1.0) // survey-detected
- Commits recientes: `feat: agregar 3 detectores al survey-taste.js — design token` `[git-recent-commits]` (confidence: 0.95) // survey-detected
- No auto-commit: el agente lista cambios, el humano revisa y commitea `[git-no-auto-commit]` (confidence: 0.98) // survey-detected

### testing patterns (detected)

- Browser-injected node composition test (IIFE + <script> tag) `[test-browser-injected]` (confidence: 1.0) // survey-detected
- Console error interception via `console.error` / `console.warn` override `[test-console-error-intercept]` (confidence: 1.0) // survey-detected
- 6 helper functions: testSingleNode, testWithBG, testDualInput, testChain, test3DChain, testWithTimeout `[test-helper-functions-6]` (confidence: 0.98) // survey-detected
- 11 source node types tested `[test-source-types-11]` (confidence: 0.95) // survey-detected
- 28 effect node types tested `[test-effect-types-28]` (confidence: 0.95) // survey-detected
- 3 dual-input node types (merge, displacement, channel-boolean) `[test-dual-input-types-3]` (confidence: 0.95) // survey-detected
- 15 composition chain tests (source → effect → ... → output) `[test-composition-chains-15]` (confidence: 0.98) // survey-detected
- Results stored in window.__nodeTestResults for inspection `[test-results-window]` (confidence: 0.98) // survey-detected
- Playwright integration test (chromium, headless) `[test-playwright-integration]` (confidence: 1.0) // survey-detected
- 5 test phases: Static ID verification → data-action attribute verification → data-toggle attribute verification → Interactive behavior tests → Console error audit `[test-five-phases]` (confidence: 0.98) // survey-detected
- 107 static IDs verified `[test-107-static-ids]` (confidence: 0.95) // survey-detected
- 22 data-action attributes verified `[test-22-data-actions]` (confidence: 0.95) // survey-detected
- 9 interactive behavior tests (tab switching, modals, buttons) `[test-9-interactive-behaviors]` (confidence: 0.90) // survey-detected
- Console error collector during test run `[test-console-error-collector]` (confidence: 0.95) // survey-detected
- Server startup with retry logic (maxRetries, 500ms interval) `[test-server-startup-retry]` (confidence: 0.90) // survey-detected
- Results tracking via check(label, condition, detail) `[test-results-tracking]` (confidence: 0.98) // survey-detected
- Vitest config: environment=node, setup=./test/setup.js, timeout=10000ms `[test-vitest-config]` (confidence: 0.98) // survey-detected

### package management

- Sin bundler: ES modules nativos importados via `<script type="module">` `[no-bundler-es-modules]` (confidence: 0.95) // survey-verified
- pnpm como gestor de paquetes preferido `[package-manager-pnpm]` (confidence: 0.85)
- npm como alternativa cuando pnpm no está disponible `[package-manager-npm-alt]` (confidence: 0.80)
- Sin bundler — ES modules nativos `[no-bundler-es-modules-native]` (confidence: 0.90) // survey-detected

### testing

- Vitest como framework de tests unitarios `[test-vitest-unit]` (confidence: 0.85)
- Playwright para tests de integración `[test-playwright-e2e]` (confidence: 0.85) // survey-verified
- Tests unitarios para engine, node-controller, state.js `[test-unit-engine-controller]` (confidence: 0.80)
- playwright como framework de tests `[test-playwright-framework]` (confidence: 0.80) // survey-detected
- **Configuración Vitest:** `vitest.config.js` con `environment: 'node'`, `testTimeout: 10000`, setup en `./test/setup.js` `[vitest-config-env-node]` (confidence: 0.95)
- **Naming de tests:** funciones descriptivas con prefijo `test[Operación][Contexto]` — ej. `testSingleNode`, `testWithBG`, `testDualInput`, `testChain`, `test3DChain`, `testWithTimeout` `[test-naming-convention]` (confidence: 0.90)
- **Sin librería de mocking:** el proyecto es vanilla JS sin mocks — los tests se ejecutan contra el Store global (`window.Store`) y el API del editor (`window.__editor`) reales, no simulados `[no-mocking-vanilla-js]` (confidence: 0.95)
- **Estructura de test unitario (node_composition_test.js):** `cleanNodes()` → `addNode()` → `connect()` → `waitRender()` → verificar errores via console interceptor `[unit-test-node-composition]` (confidence: 0.95)
- **Estructura de test de integración (Playwright):** 6 fases secuenciales — Static ID verification → data-action attributes → data-toggle attributes → Interactive behavior (tab switching, modal open/close, copilot, context menu) → Console error audit → Report `[integration-test-playwright]` (confidence: 0.95)
- **Test runner en browser:** `node_composition_test.js` se inyecta via `<script>` tag para correr en contexto del navegador, no como módulo `[browser-test-runner]` (confidence: 0.90)
- **Error tracking:** intercepción de `console.error` y `console.warn` para capturar errores de render sin romper el pipeline `[error-tracking-console]` (confidence: 0.95)

### export

- Exportación a WebM (MediaRecorder) soportada `[export-webm-mediarecorder]` (confidence: 0.90) // survey-detected
- Exportación a MP4 (FFmpeg.wasm) soportada `[export-mp4-ffmpeg-wasm]` (confidence: 0.90) // survey-detected
- Exportación a PNG sequence soportada `[export-png-sequence]` (confidence: 0.90) // survey-detected
- Exportación a JPEG sequence soportada `[export-jpeg-sequence]` (confidence: 0.90) // survey-detected
- Exportación a GIF soportada `[export-gif-lzw]` (confidence: 0.90) // survey-detected
- ZIP packaging con ZipWriter store-mode `[export-zip-packaging]` (confidence: 0.95) // survey-detected
- Standalone engine via buildStandaloneEngineSource() `[export-standalone-engine]` (confidence: 0.90) // survey-detected
- YouTube import via backend API + scene detection `[export-youtube-import]` (confidence: 0.85) // survey-detected
- Scene detection con FFmpeg.wasm `[export-scene-detection]` (confidence: 0.85) // survey-detected
- Resolución por defecto: 1920x1080 @ 30fps `[export-default-res-1920x1080]` (confidence: 0.95) // survey-detected
- 5 formatos de exportación detectados `[export-formats-5]` (confidence: 0.95) // survey-detected
  - WebM (MediaRecorder) `[export-webm-format]` (confidence: 0.90) // survey-detected
  - MP4 (FFmpeg.wasm) `[export-mp4-format]` (confidence: 0.90) // survey-detected
  - PNG sequence `[export-png-format]` (confidence: 0.90) // survey-detected
  - JPEG sequence `[export-jpeg-format]` (confidence: 0.90) // survey-detected
  - GIF (LZW encoder inline) `[export-gif-format]` (confidence: 0.90) // survey-detected

### code quality

- Sin TypeScript: JavaScript vanilla con JSDoc opcional `[no-typescript-vanilla-jsdoc]` (confidence: 0.90)
- Sin linter configurado globalmente — consistencia vía taste `[no-global-linter]` (confidence: 0.75)

### TypeScript en proyectos Toolcraft

- `noUnusedLocals: true` en `tsconfig.json` como rule de CI para detectar imports, variables y parámetros muertos — equivalente a un linter de dead code, cero dependencias extra `[ts-no-unused-locals-ci]` (confidence: 0.95)
- Dead code pattern: imports de módulos/funciones que nunca se usan en el archivo `[ts-dead-imports]` (confidence: 0.95)
- Dead code pattern: variables locales declaradas pero nunca leídas `[ts-dead-variables]` (confidence: 0.95)
- Dead code pattern: parámetros de función que nunca se referencian en el body `[ts-dead-parameters]` (confidence: 0.95)
- Dead code pattern: funciones completas que nunca se llaman `[ts-dead-functions]` (confidence: 0.90)
- Variable shadowing: cuando una variable local tiene el mismo nombre que un parámetro o variable externa, renombrar la local puede requerir cambios en cascada — revisar todas las referencias antes de renombrar `[ts-variable-shadowing-cascade]` (confidence: 0.90)
- Taste compiler rule: las bullets de reglas no deben empezar con `**` (bold) — el parser `parseRulesFromMarkdown` las filtra silenciosamente como pattern descriptors. Usar texto plano al inicio y aplicar bold solo en medio de la oración. `[taste-rule-no-leading-bold]` (confidence: 0.95)

### git workflow

- **El agente nunca hace git commit o git push automáticamente** — solo cuando el humano lo pide explícitamente `[agent-never-auto-commit]` (confidence: 0.98)
- Al finalizar una tarea, listar qué archivos cambiaron y detenerse; el humano revisa diffs y ejecuta commit/push manualmente `[git-post-task-list-changes]` (confidence: 0.95)
- `git diff` antes de cualquier operación destructiva para verificar cambios esperados `[git-diff-before-destructive]` (confidence: 0.90)
- `git status --short` para confirmar que no hay archivos privados o sensibles staged (.env, data/, logs/, settings.local.json) `[git-status-short-check]` (confidence: 0.95)
- `git log --oneline -10` para entender el contexto reciente antes de hacer cambios significativos `[git-log-oneline-context]` (confidence: 0.85)
- `git diff --check` para detectar whitespace errors y conflict markers antes de commit `[git-diff-check-whitespace]` (confidence: 0.90)
- Si no hay historial de git, establecer convenciones de commit messages antes del primer commit — por defecto, no hay convenciones establecidas `[git-no-history-set-conventions]` (confidence: 0.90)

### documentation / ADR

- ADRs se guardan en `docs/adr/` con formato `NNNN-description.md` `[adr-location-format]` (confidence: 0.98)
- Formato ADR: YAML frontmatter con `adr`, `title`, `status` (accepted | proposed | deprecated) `[adr-yaml-frontmatter]` (confidence: 0.98)
- `docs/adr/NODE_API_GUIDE.md` es la guía técnica de API — se actualiza manualmente cuando cambian interfaces de nodos, animación o inspectores `[adr-node-api-guide]` (confidence: 0.95)
- `CONTEXT.md` es el documento integral del proyecto — se actualiza después de implementaciones significativas (nuevos sistemas, cambios de arquitectura, migraciones) `[doc-context-md-integral]` (confidence: 0.95)
- `README.md` es la landing page del repo — contiene resumen ejecutivo del proyecto y enlaces a docs/ `[doc-readme-landing]` (confidence: 0.95)
- `CLAUDE.md` es el entry point del agente — referencia al Taste System (`.taste/`) como fuente de verdad, load order priority 5, y reglas de post-task automation `[doc-claude-md-entry]` (confidence: 0.98)
- `AGENTS.md` contiene instrucciones específicas para el agente — incluye reglas de wiki Fusion, git never-auto-commit y estructura del proyecto `[doc-agents-md-instructions]` (confidence: 0.98)
- Las lecciones (`lessons/`) son archivos HTML auto-contenidos que documentan conceptos específicos (nodos Fusion, resúmenes de video) — no tienen formato fijo `[doc-lessons-html]` (confidence: 0.90)
- Los archivos de referencia (`reference/`) son HTML estáticos que documentan APIs o conceptos externos — no se editan directamente `[doc-reference-html]` (confidence: 0.90)
- El Taste System (`.taste/`) es la fuente de verdad para reglas de ingeniería — los archivos legacy (`CLAUDE.md`, `FREEBIFF_CORE_ENGINEERING_RULES.md`) son fallback `[doc-taste-system-authority]` (confidence: 0.98)



### graphify

- `graphify update .` post-task para mantener grafo actualizado `[graphify-update-post]` (confidence: 0.95)
- `graphify query` como primera fuente para preguntas del código `[graphify-query-first-source]` (confidence: 0.90)
- `graphify explain` para conceptos específicos `[graphify-explain-specific]` (confidence: 0.85)

### slug quality

- `tools/improve-slugs.js` — linter de calidad para `[id]` slugs en `.taste/*/index.md` `[slug-linter-improve-slugs]` (confidence: 0.95)
- Uso: `node tools/improve-slugs.js --check` — analiza los 346 slugs y reporta issues de calidad `[slug-linter-check-flag]` (confidence: 0.95)
- **4 reglas de calidad:** `[slug-quality-rules-four]` (confidence: 0.95)
  - **Longitud máxima:** WARNING > 35 chars, ERROR > 45 chars — slugs legibles y cortos `[slug-rule-max-length]` (confidence: 0.90)
  - **Sin acentos perdidos:** detecta patrones `animaci-n`, `posici-n` (ci/si/gi/mi/ni seguido de guión + letra) `[slug-rule-accent-loss]` (confidence: 0.95)
  - **Sin truncamiento:** slug no debe terminar en `-` (signo de truncamiento al generar slugify) `[slug-rule-no-truncation]` (confidence: 0.90)
  - **Sin prefijo numérico:** slugs no deben empezar con dígito (ej. `11-tipos-de-nodo` → `node-types-11`) `[slug-rule-no-numeric-prefix]` (confidence: 0.90)
- Origen: originalmente fue un script one-shot que mapeó ~450 slugs viejos a versiones mejoradas (332 aplicados), luego refactorizado a linter permanente con `--check` `[slug-linter-origin-refactored]` (confidence: 0.95)

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

## anti-patterns

### Instalar dependencias globales

- **description:** Usar `npm install -g` para herramientas del proyecto
- **why:** Contamina el entorno global, difícil de reproducir
- **instead:** Usar `npx` o dependencias dev en `package.json`

### Bundler lock-in

- **description:** Agregar un bundler (webpack, vite) solo por conveniencia
- **why:** El proyecto es vanilla JS por diseño; un bundler agregaría complejidad innecesaria
- **instead:** Usar ES modules nativos; si se necesita optimización, evaluar caso por caso

### Git commit automático desde el agente

- **description:** El agente ejecuta `git commit` o `git push` sin instrucción explícita del humano
- **why:** El humano pierde la oportunidad de revisar los diffs antes de que los cambios queden registrados; commits automáticos sin contexto semántico
- **instead:** Dejar que el humano revise los cambios con `git diff` y ejecute commit/push manualmente; el agente solo lista qué archivos se modificaron

### Ignorar .gitignore

- **description:** Stagge ar archivos que deberían estar en `.gitignore` (settings.local.json, .env, data/, dist/ en algunos proyectos)
- **why:** Expone información sensible (API keys, config local, datos de usuario) en el repositorio
- **instead:** Ejecutar `git status --short` antes de sugerir o preparar un commit para verificar que no hay archivos sensibles staged
