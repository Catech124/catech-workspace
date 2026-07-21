---
name: toolcraft-workflow
description: Construye una app de diseño personalizada con Toolcraft by Pixel Point. Sigue el workflow completo: preflight, brainstorming, schema, implementación, verificación y dev server.
argument-hint: "Describe qué herramienta de diseño quieres construir (ej. generador de gradientes, efecto ASCII, patrones geométricos)"
---

# Toolcraft Workflow — Build a Design App

> **Proyecto:** `C:\Users\catec\tastedesign`
> **Stack:** React 19 + TypeScript 6 + Vite 8 + Tailwind 4 + TanStack Router + Base UI

## 1. Preflight

Antes de editar cualquier código, DEBES:

1. Leer `C:\Users\catec\tastedesign\AGENTS.md` (contrato principal — 72 reglas)
2. Leer `C:\Users\catec\tastedesign\docs\toolcraft\workflow.md` (ruteo de tareas)
3. Clasificar el proyecto como **Generated app**
4. Clasificar el tipo de tarea según la tabla en workflow.md
5. Elegir y registrar un **Verification Tier** antes de implementar
6. No editar archivos de implementación hasta completar el preflight

## 2. Brainstorming

Antes de escribir código, haz un brainstorming para decidir:

- **Product behavior** — ¿qué hace la app? ¿sube imágenes, genera arte, exporta?
- **Canvas sizing** — ¿tamaño fijo, editable, responsive?
- **Panels** — ¿qué paneles/controles necesita?
- **Media flow** — ¿upload, drag-drop, paste, cámara?
- **Controls** — sliders, colores, selects, uploads, etc.
- **Export** — PNG, Video, GIF, SVG, Copy?
- **Renderer technique** — DOM, SVG, Canvas 2D, WebGL, mixto?
- **Timeline/Layers** — ¿necesita animación o capas?
- **Persistence** — localStorage, URL params?

## 3. Docs a Leer Según el Tipo de App

| Si tu app es... | Lee estos docs |
|---|---|
| App simple (1 canvas + controles) | `schema-reference.md`, `component-rules.md`, `acceptance-testing.md` |
| App con renderer custom | + `renderer-technique.md`, `performance.md` |
| App con animación/timeline | + `component-rules.md`, `performance.md` |
| App con layers | + `component-rules.md` |
| Efecto de imagen/video | + `renderer-technique.md`, `performance.md` |
| Export/background | + `component-rules.md`, `performance.md` |

## 4. Implementación

### Archivos clave que editar:

| Archivo | Propósito |
|---|---|
| `src/app/app-schema.ts` | 🎯 **Schema de la app** — define controles, defaults, persistencia, export |
| `src/app/app-acceptance.ts` | Matriz de entidades visibles para tests |
| `src/app/app-performance.ts` | Config de escenarios de rendimiento |
| `src/routes/root.tsx` | Ruta raíz (mantener delgada) |

### Reglas importantes:

- Usar `defineToolcraft` de `@/toolcraft/runtime`
- Renderizar con `<ToolcraftApp schema={appSchema} />`
- El output del producto va en `canvasContent`
- No recrear controles, paneles o toolbar manualmente
- Usar schema `defaultValue` para todo control reseteable
- Mantener `docs/toolcraft/agent-worklog.md` actualizado

## 5. Verification Tiers

| Tier | Cuándo | Comando |
|---|---|---|
| **Tier 0** | Solo docs/copy | `pnpm typecheck` |
| **Tier 1** | Cambio visual de control | Test unitario + browser check |
| **Tier 2** | Schema/behavior | `pnpm verify:quick` + browser acceptance |
| **Tier 3** | Renderer/canvas | `pnpm verify:quick` + browser + perf targeted |
| **Tier 4** | **Entrega final** | `pnpm verify:final` + browser perf + `pnpm dev` |

## 6. Comandos Rápidos

```bash
cd C:\Users\catec\tastedesign

# Iniciar dev server
npm run dev

# Typecheck
npm run typecheck

# Test rápido (docs + integridad + unit)
npm test

# Verify completo (sin browser perf)
npm run verify:quick

# Verify final (entrega)
npm run verify:final

# Browser tests
npm run test:browser

# Build producción
npm run build
```

## 7. Worklog

Después de cada implementación significativa, actualizar `docs/toolcraft/agent-worklog.md` con:

- **Request**: qué se pidió
- **Task type**: schema, renderer, timeline, etc.
- **Resultado visible**: qué cambió para el usuario
- **Source checked**: referencias, docs leídos
- **Reglas aplicadas**: qué reglas de AGENTS.md se usaron
- **Archivos cambiados**: lista
- **Verificación**: qué tiers se corrieron
- **Riesgos**: qué queda pendiente

## 8. Flujo Completo

```
1. Cargar esta skill (@toolcraft-workflow)
2. Describir la app que quieres construir
3. Leer AGENTS.md + workflow.md + docs específicos
4. Brainstorming de la app (controles, canvas, export)
5. Elegir Verification Tier
6. Implementar schema en src/app/app-schema.ts
7. Actualizar acceptance + performance si aplica
8. npm run verify:quick
9. Actualizar worklog
10. npm run dev
```

## 9. Ejemplos de Prompts

```
"Build a gradient generator tool where I can:
- Pick start and end colors (color pickers)
- Choose gradient type (linear, radial, conic)
- Control angle with a slider
- Export as PNG at 2K/4K/8K"
```

```
"Build an ASCII art effect tool where I can:
- Upload an image
- Control character density and size
- Pick foreground/background colors
- Export result as PNG"
```

```
"Build a geometric pattern generator with:
- Shape picker (circles, triangles, hexagons)
- Grid density and spacing controls
- Random color palette generator
- Export as SVG and PNG"
```
