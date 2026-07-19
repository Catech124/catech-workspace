# taste: index

> **domain:** Freebuff Taste System — Índice principal
> **confidence:** 1.0
> **updated:** 2026-06-30
> **version:** 2

## preferences

### project

- **Nombre del proyecto:** ARC Editor (Editor de video node-based, 100% browser)
- **Stack:** HTML/CSS/JS vanilla (ES modules), sin frameworks ni bundlers
- **Servidor local:** Node.js (Express) en `ServidorLocal/`
- **Backend de AI:** Freebuff2API (Go) proxy a Codebuff upstream
- **AI Agent principal:** Freebuff (Codebuff CLI, modelo deepseek/deepseek-v4-flash)

### load order

Cuando Freebuff inicia una sesión, resuelve el taste en este orden. La resolución ocurre **por dominio** (cada TastePackage resuelve su propia cadena de prioridad de forma aislada).

#### Niveles de prioridad (mayor número = menor prioridad)

| Nivel | Ruta | Ámbito | Se commitea |
|-------|------|--------|-------------|
| **P1** | `.taste/settings.local.json` | Override por dominio (NO se commit) | ❌ |
| **P2** | `.taste/settings.json` | Override por dominio | ✅ |
| **P3** | `.taste/<domain>/index.md` | Reglas de un dominio | ✅ |
| **P4** | `~/.config/taste/` | Global del usuario — aplica a TODOS los dominios | Usuario |
| **P5** | `CLAUDE.md` | Legacy — aplica a TODOS los dominios | ✅ |
| **P6** | `FREEBIFF_CORE_ENGINEERING_RULES.md` (y similares) | Legacy — aplica a TODOS los dominios | ✅ |

Nota: La migración de `.taste/<domain>/taste.md` → `.taste/<domain>/index.md` es parte de la implementación de ADR 0006. Durante la transición, `compile-taste.js` busca `index.md` primero y cae a `taste.md` con un warning de deprecación.

#### Estrategias de merge

| Estrategia | Aplica a | Comportamiento |
|-----------|----------|----------------|
| **Deep merge** | Objetos anidados | Merge recursivo campo a campo. El nivel de mayor prioridad gana en conflicto. |
| **Shallow replace** | Primitivas (strings, numbers, booleans) | El valor de mayor prioridad reemplaza al de menor. Sin merge. |
| **Keyed merge** | Arrays de reglas (`rules[]`) | Merge por campo `id`, no por posición. Cada regla se mergea campo a campo. |

#### Confianza (confidence) — veto, no override direccional

Cada regla individual lleva un `(confidence: X.XX)` inline. Cuando dos reglas con el mismo `id` chocan entre niveles de prioridad:

| Confianza del override | Confianza de la base | Resultado |
|----------------------|---------------------|-----------|
| < 0.5 | ≥ 0.8 | **Gana la base** (override de baja confianza vetado) |
| < 0.5 | < 0.8 | Gana el override (ninguno es confiable, decide jerarquía) |
| ≥ 0.5 | cualquier | Gana el override (jerarquía decide) |
| cualquier | < 0.8 | Gana el override (base no es suficientemente confiable) |

> **Regla:** "El confidence es un veto, no un override direccional."

El confidence a nivel de paquete se calcula como `Math.min(...rules.confidence)`. Si `rules` está vacío → `null` (dashboard muestra "sin datos").

#### Algoritmo de resolución

Ver `docs/adr/0006-taste-resolution-and-merge-algorithm.md` para el pseudocódigo completo. El flujo general es:

```
resolveTaste() → { "core": mergedPkg, "frontend": mergedPkg, ... }

Por cada dominio:
  1. Leer los 6 niveles (P6 → P1)
  2. Validar CADA nivel con validate-taste.js
     → Si falla: EXCLUIR el nivel, log warning, continuar
  3. Mergear en orden ascendente de prioridad (P6 primero, P1 último)
     → Metadata: deep merge objects, shallow replace primitives
     → Rules: keyed merge por id, campo a campo, con veto por confidence
  4. Cada regla ganadora hereda _level (nivel de origen)
```

#### ID explícito por regla

Cada bullet de regla debe incluir un ID estable entre backticks:

```markdown
- Punto y coma obligatorio `[semicolon]` (confidence: 0.75) // survey
- SRP: archivos < 200 líneas `[srp-max-lines]` (confidence: 0.85)
```

- IDs son kebab-case slugs, estables ante cambios de texto. `[stable-kebab-ids]` (confidence: 0.95)
- Reglas sin ID explícito reciben un slugify automático + WARNING. `[auto-slugify-warning]` (confidence: 0.95)
- El ID permite referenciar la regla desde `settings.local.json` sin ambigüedad. `[id-references-settings-override]` (confidence: 0.95)

#### Schema de settings.local.json (P1) y settings.json (P2)

```json
{
  "overrides": {
    "core": {
      "srp": { "value": "archivos < 150 líneas", "confidence": 0.5 },
      "type_hints": { "value": false }
    },
    "frontend": {
      "srp": { "value": "componentes < 150 líneas" }
    }
  }
}
```

- Overrides para reglas EXISTENTES pueden omitir `value` o `confidence` (se heredan de la base). `[overrides-can-omit-value]` (confidence: 0.95)
- Overrides para reglas NUEVAS (sin base) DEBEN incluir `confidence`. `[new-overrides-need-confidence]` (confidence: 0.95)
- Claves de dominio desconocidas generan un warning (no fallo silencioso). `[unknown-domain-warning]` (confidence: 0.95)

#### Formato de regla: `[id]` + `(confidence)` requeridos

Toda regla en un archivo de paquete (P3) debe tener:
- Formato: `` `[id]` `` — identificador estable `[formato-ejemplo-id]` (confidence: 0.95)
- Formato: `` `[slug-ejemplo]` (confidence: 0.95) `` — número entre 0 y 1 `[formato-ejemplo-confidence]` (confidence: 0.95)
- `// source` opcional — `survey` o `manual` (default: manual) `[default-source-manual]` (confidence: 0.95)

`validate-taste.js` rechaza cualquier regla que falte alguno de estos campos.

### Orden de compilación

El orden en que los packages aparecen en `COMPILED_TASTE.md` es: **index primero, luego orden alfabético** de directorios. Este orden determina el desempate cuando dos reglas tienen el mismo `confidence`.

| Orden | Package | Dominio | Archivo |
|---|---|---|---|
| 0 | **index** | Metadata global, load order, cross-references | `.taste/taste.md` |
| 1 | **animation** | Keyframes, modifiers, spline, performance budget, propiedades animables | `.taste/animation/taste.md` |
| 2 | **backend** | Python/FastAPI, Go, Express, Docker, env vars | `.taste/backend/taste.md` |
| 3 | **core** | Fundamentos de ingeniería, schema.json, arquitectura | `.taste/core/taste.md` |
| 4 | **design** | Design Tokens (Figma → Style Dictionary → CSS/JS) | `.taste/design/taste.md` |
| 5 | **frontend** | UI/UX, Canvas, CSS, eventos, timeline, inspector | `.taste/frontend/taste.md` |
| 6 | **nodes** | DAG de nodos, render pipeline, conexiones, categorías | `.taste/nodes/taste.md` |
| 7 | **skills** | Playbooks del agente, persistencia, rendimiento, patrones | `.taste/skills/taste.md` |
| 8 | **tools** | Toolchain, testing, export, git workflow, documentation / ADR, code quality | `.taste/tools/taste.md` |

## packages

### core — Fundamentos de ingeniería

| Campo | Valor |
|---|---|
| **Confidence** | 0.95 |
| **Estado** | ✅ Activo |
| **Secciones** | schema (detected), code style, architecture, workflow |
| **Patrones** | Schema validation before new types |
| **Anti-patrones** | God Object, Código Defensivo Genérico |
| **→ Referencia a** | `nodes` (schema.json como fuente de verdad) |

### frontend — UI/UX

| Campo | Valor |
|---|---|
| **Confidence** | 0.88 |
| **Estado** | ✅ Activo |
| **Secciones** | ui events, rendering, css, keyboard shortcuts, ui interaction, inspector panel, timeline view |
| **Patrones** | Module structure (ES modules nativos), Canvas initialization |
| **Anti-patrones** | Inline styles in JS, Bloquear el Main Thread |
| **→ Referencia a** | `nodes` (node graph UI), `animation` (spline view), `skills` (persistence, performance) |

### backend — Backend (Python/Go/Express)

| Campo | Valor |
|---|---|
| **Confidence** | 0.85 |
| **Estado** | ✅ Activo |
| **Secciones** | python, go, api design, servidor local, docker, freebuff2api endpoints, upstream proxy, config / env vars, security / threat model |
| **Patrones** | Pydantic validation, Async separation |
| **Anti-patrones** | Raw dict access, Blocking calls in async routes |
| **→ Referencia a** | `skills` (AI Copilot API) |

### nodes — DAG de nodos

| Campo | Valor |
|---|---|
| **Confidence** | 0.90 |
| **Estado** | ✅ Activo |
| **Versión** | 2 |
| **Secciones clave** | render pipeline, category breakdown (13 cats, 56 tipos), node structure, render 3D, static cache, connection conventions, Fusion-style features, evalPropA limits |
| **Patrones** | Auto-merge chain, render pipeline, carga multimedia, error boundaries |
| **Anti-patrones** | Conexiones circulares, mutar NODE_DEFS, eliminar anchors |
| **→ Referencia a** | `animation` (evalPropA en generadores), `frontend` (node-view, node-graph), `core` (schema.json) |

### animation — Keyframes y modifiers

| Campo | Valor |
|---|---|
| **Confidence** | 0.90 |
| **Estado** | ✅ Activo |
| **Versión** | 2 |
| **Secciones clave** | evalPropA node types, animatable properties (28 props), animation system (3 capas), keyframes, modifiers (oscillate/shake/step), spline view, PROP_COLORS, DEFAULT_RANGES, performance budget (16ms, pooling, cache, downscale) |
| **Patrones** | Toggle animatedProp, crear/modificar keyframe, undo/redo seguro |
| **Anti-patrones** | Mutar animationChannels, olvidar Store.snapshot(), hardcodear easing |
| **→ Referencia a** | `nodes` (evalPropA limits), `frontend` (timeline, inspector, spline), `skills` (persistencia animatedProps), `frontend` (rendering) |

### design — Design Tokens

| Campo | Valor |
|---|---|
| **Confidence** | 0.88 |
| **Estado** | ✅ Activo (nuevo) |
| **Secciones clave** | token categories (10 cats), build pipeline (4 formats, Style Dictionary), Figma integration (Tokens Studio), usage conventions (CSS/JS/Tailwind) |
| **Patrones** | Agregar nuevo token, sync desde Figma |
| **Anti-patrones** | Editar dist/ manualmente, hardcodear tokens, compartir PAT, crear tokens sin Figma, mezclar unidades |
| **→ Referencia a** | `frontend` (CSS consume tokens), `tools` (style-dictionary npm dep) |

### tools — Toolchain

| Campo | Valor |
|---|---|
| **Confidence** | 0.90 |
| **Estado** | ✅ Activo |
| **Secciones** | package management (pnpm, sin bundler), testing (vitest, Playwright), export (5 formatos), git workflow, documentation / ADR, code quality (sin TS), graphify |
| **Patrones** | Taste lint pre-commit |
| **Anti-patrones** | Dependencias globales, Bundler lock-in |
| **→ Referencia a** | `skills` (post-task automation) |

### skills — Playbooks del agente

| Campo | Valor |
|---|---|
| **Confidence** | 0.90 |
| **Estado** | ✅ Activo |
| **Versión** | 2 |
| **Secciones clave** | persistence system (3 métodos, 11+ métodos FSAA), herramientas taste, post-task automation, wiki Fusion, graphify navigation, exportación, YouTube Import, AI Copilot, rendimiento (→ ver animation), Store |
| **Patrones** | Plan before code, flujo taste, guardar proyecto, render composición |
| **Anti-patrones** | git commit automático, instalar globales, omitir survey, compartir settings.local.json |
| **→ Referencia a** | `tools` (survey→validate→compile), `frontend` (rendering), `nodes` (render pipeline), `animation` (persistencia, performance budget consolidado), `core` (workflow) |

### Cross-reference matrix

| Desde \ Hacia | core | frontend | backend | nodes | animation | design | tools | skills |
|---|---|---|---|---|---|---|---|---|
| **core** | — | architecture | — | schema.json | — | — | — | workflow |
| **frontend** | SRP | — | — | node-graph UI | spline view | tokens CSS | — | persistence, perf |
| **backend** | — | — | — | — | — | — | — | AI Copilot API |
| **nodes** | schema.json | node-view | — | — | evalPropA limits | — | — | render patterns |
| **animation** | — | timeline, inspector | — | evalPropA limits | — | — | — | persistence |
| **design** | — | CSS vars | — | — | animation tokens | — | style-dictionary build | — |
| **tools** | — | — | — | — | — | style-dictionary dep | — | post-task |
| **skills** | workflow | rendering | — | render pipeline | performance, persistence | — | survey→compile | — |

### Reglas de resolución (cross-reference, legacy)

Estas reglas aplican cuando NO se ha implementado aún el algoritmo de ADR 0006 (resolución por dominio con merge keyed). Una vez implementado `compile-taste.js` con el algoritmo de ADR 0006, estas reglas son reemplazadas automáticamente.

1. **Mismo nivel de prioridad:** gana la regla con mayor `confidence` explícito
2. **Confidence igual:** gana el package que aparece primero en el load order (orden alfabético)
3. **Cross-package:** la versión más específica (menor dominio) tiene prioridad sobre la más genérica
4. **Survey-detected vs manual:** las reglas detectadas por survey tienen prioridad si son más recientes (ver `updated` en metadata)

### Herramientas del sistema

| Herramienta | Función | Uso |
|---|---|---|
| `tools/survey-taste.js` | Escanea el proyecto y detecta nuevas reglas | `--diff` (preview), `--apply` (escribir), `--verbose` (detalle) |
| `tools/validate-taste.js` | Valida formato y metadata de todos los `.taste/*/taste.md` | `--all` (todos los packages) |
| `tools/compile-taste.js` | Compila todos los packages → `COMPILED_TASTE.md` | `--stdout`, `--output out.md`, `--packages core,frontend` |

### Flujo estándar

```bash
# 1. Detectar nuevas reglas
node tools/survey-taste.js --diff    # ver qué va a cambiar
node tools/survey-taste.js --apply   # aplicar sugerencias

# 2. Validar formato
node tools/validate-taste.js --all

# 3. Compilar para system prompt
node tools/compile-taste.js
```

### Estado del sistema

- **9 packages activos:** index, core, design, frontend, backend, nodes, animation, tools, skills
- **Sugerencias activas (survey):** 14 — UI events, schema, persistence, render pipeline, animation system, export, testing, code style
- **Legacy:** `FREEBIFF_CORE_ENGINEERING_RULES.md` y `CLAUDE.md` se mantienen como fallback
- **Local overrides:** `.taste/settings.local.json` (no commiteado)
