# taste: design

> **domain:** Sistema de Design Tokens (Figma → Style Dictionary → CSS/JS)
> **confidence:** 0.88
> **updated:** 2026-06-30
> **version:** 1

## preferences

### design tokens (detected)

- 10 categorías de tokens (135 tokens totales) `[design-categories-10]` (confidence: 0.95) // survey-detected
  - animation: 13 tokens (duration, easing) `[design-cat-animation]` (confidence: 0.95)
  - border: 10 tokens (radius, width) `[design-cat-border]` (confidence: 0.95)
  - breakpoint: 6 tokens `[design-cat-breakpoint]` (confidence: 0.95)
  - color: 28 tokens (primary, neutral, text) `[design-cat-color]` (confidence: 0.95)
  - opacity: 12 tokens `[design-cat-opacity]` (confidence: 0.95)
  - shadow: 4 tokens `[design-cat-shadow]` (confidence: 0.95)
  - sizing: 16 tokens (icon, avatar, input, container) `[design-cat-sizing]` (confidence: 0.95)
  - spacing: 13 tokens `[design-cat-spacing]` (confidence: 0.95)
  - font: 23 tokens (family, size, weight, lineHeight) `[design-cat-font]` (confidence: 0.95)
  - z: 10 tokens (index) `[design-cat-z]` (confidence: 0.95)
- Style Dictionary ^5.4.4 con build.js + config.js `[design-style-dictionary]` (confidence: 0.95) // survey-detected
- Outputs compilados en dist/: CSS vars, JS module, JSON flat, Tailwind `[design-outputs-four]` (confidence: 0.95) // survey-detected
- Integración Figma via Tokens Studio (provider: github) `[design-figma-tokens-studio]` (confidence: 0.95) // survey-detected

### token categories

- **Color** (`tokens/color.json`): 10 primary (50–900), 10 neutral (50–900), 4 semantic (success/warning/error/info), background, 3 text (primary/secondary/inverse) `[token-color]` (confidence: 0.98)
- **Typography** (`tokens/typography.json`): 3 font families (sans/serif/mono), 9 sizes (xs→5xl), 5 weights (light→bold), 6 line heights (none→loose) `[token-typography]` (confidence: 0.98)
- **Spacing** (`tokens/spacing.json`): 13 valores (0→24), 4px base unit, auto-escala `[token-spacing]` (confidence: 0.98)
- **Sizing** (`tokens/sizing.json`): 4 sub-categorías — icon (xs→xl), avatar (sm→xl), input (sm→lg), container (sm→xl) `[token-sizing]` (confidence: 0.98)
- **Border** (`tokens/border.json`): 6 radius (none→full), 4 widths (none→thick) `[token-border]` (confidence: 0.98)
- **Shadow** (`tokens/shadow.json`): 4 niveles (sm/md/lg/xl) con valores de sombra CSS `[token-shadow]` (confidence: 0.98)
- **Opacity** (`tokens/opacity.json`): 12 niveles (0→100, step 10) `[token-opacity]` (confidence: 0.98)
- **Breakpoint** (`tokens/breakpoint.json`): 6 breakpoints (xs→2xl), 480px→1536px `[token-breakpoint]` (confidence: 0.98)
- **Z-Index** (`tokens/z-index.json`): 10 capas (dropdown→max), 100–9999 `[token-z]` (confidence: 0.98)
- **Animation** (`tokens/animation.json`): 6 duraciones (instant→slowest), 7 easings (linear→bounce) `[token-animation]` (confidence: 0.98)

### build pipeline

- **Style Dictionary v5.x** como compilador de tokens a código (`style-dictionary` npm package) `[build-style-dictionary]` (confidence: 0.95)
- **4 formatos de salida** configurados en `design-tokens/config.js` `[build-four-formats]` (confidence: 0.95)
  - CSS Variables (`dist/css/_variables.css`) — web nativa `[css-variables-output]` (confidence: 0.98)
  - JavaScript Module (`dist/js/tokens.js`) — React, Vue, etc. `[js-module-output]` (confidence: 0.98)
  - JSON nested (`dist/json/tokens.json`) — consumo general `[json-nested-output]` (confidence: 0.95)
  - Tailwind JSON (`dist/tailwind/tokens.json`) — Tailwind CSS config `[tailwind-config-output]` (confidence: 0.95)
- **Build command:** `npm run build` (ejecuta `node build.js`) desde `design-tokens/` `[build-command]` (confidence: 0.98)
- **Transform group:** `css` para CSS (css/variables format), `js` para JS/JSON/Tailwind `[build-transform-group]` (confidence: 0.95)
- **Source:** todos los `tokens/**/*.json` definidos en `config.js` `[build-source-all]` (confidence: 0.95)
- Output en `dist/` no se edita manualmente — se regenera con build `[dist-read-only-regenerated]` (confidence: 0.95)

### figma integration

- **Tokens Studio for Figma** plugin conecta Figma → GitHub → repositorio local vía `tokens-studio.config.json` `[figma-tokens-studio-plugin]` (confidence: 0.95)
- Flujo: Figma (diseño) → Tokens Studio (plugin) → GitHub (push) → `git pull` local → `npm run build` → `dist/` `[figma-github-sync-flow]` (confidence: 0.95)
- **Personal Access Token (PAT)** de GitHub con scope `repo` necesario para sincronización `[figma-pat-github]` (confidence: 0.90)
- `tokens-studio.config.json` documenta la configuración, no se importa automáticamente `[tokens-studio-config-docs]` (confidence: 0.95)
- Tokens Studio trabaja con un solo archivo JSON, no múltiples — los archivos en `tokens/` son la versión local `[single-file-vs-multi-json]` (confidence: 0.90)

### token usage conventions

- **CSS:** importar `dist/css/_variables.css` y usar `var(--token-name)` `[convention-css-vars]` (confidence: 0.98)
- **JS/React:** importar `dist/js/tokens.js` y acceder como `tokens.color.primary["500"]` `[convention-js-react]` (confidence: 0.95)
- **Tailwind:** importar `dist/tailwind/tokens.json` en `tailwind.config.js` → `theme.extend` `[convention-tailwind]` (confidence: 0.95)
- **Nunca hardcodear valores** que tienen token — usar la variable CSS o el token JS correspondiente `[convention-no-hardcode]` (confidence: 0.95)
- **Respetar la escala:** usar el token semántico correcto (p.ej. `--spacing-4` en vez de `16px`, `--color-primary-500` en vez de `#6366f1`) `[convention-respect-scale]` (confidence: 0.95)
- **No crear variantes ad-hoc:** si un color/espaciado no existe, agregarlo al token JSON en vez de hardcodear `[convention-no-ad-hoc]` (confidence: 0.90)

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

## anti-patterns

- **No editar archivos en `dist/` manualmente** — se sobrescriben en el próximo build `[no-edit-dist-manual]` (confidence: 0.98)
- **No hardcodear valores de tokens en CSS/JS** — usar las variables/tokens para mantener consistencia con Figma `[no-hardcode-tokens]` (confidence: 0.95)
- **No compartir el PAT de GitHub** — está en el plugin local de Tokens Studio, no en el repo `[no-share-pat]` (confidence: 0.98)
- **No crear tokens sin documentar en Figma** — los tokens deben tener correspondencia con el design system en Figma, no solo en código `[no-undocumented-tokens]` (confidence: 0.85)
- **No mezclar unidades** — spacing usa px, typography usa rem, sizing usa px. Mantener la convención por categoría `[no-mix-units]` (confidence: 0.90)
