## freebuff engineering rules (Taste System)

**IMPORTANTE:** Las reglas activas de ingeniería están en `.taste/` (Taste System).
- El archivo `FREEBIFF_CORE_ENGINEERING_RULES.md` se mantiene como **fallback legacy** durante la transición.
- Ver `.taste/taste.md` para el load order completo.

## Taste System — Load Order

Cuando inicies una sesión, resuelve las preferencias en este orden:

```
Prioridad 1: .taste/settings.local.json       ← Override local (no se commit)
Prioridad 2: .taste/settings.json              ← Config del proyecto
Prioridad 3: .taste/<domain>/taste.md          ← Taste packages
Prioridad 4: ~/.config/taste/                  ← Taste global (futuro)
Prioridad 5: FREEBIFF_CORE_ENGINEERING_RULES.md ← Legacy fallback
```

**Paquetes activos:** core, frontend, backend, tools, nodes, animation, skills.
- Lee `.taste/taste.md` para el índice y cross-links entre dominios.
- Si hay conflicto entre reglas del mismo nivel, gana la de mayor confidence.

## pin-llm-wiki — LLM Wiki de DaVinci Resolve Fusion

@AGENTS.md

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.

## Post-Task Automation

**REGLAS QUE DEBES SEGUIR AL FINALIZAR CADA TAREA DE CÓDIGO:**

- **Siempre:** Ejecuta `graphify update .` para mantener el grafo de dependencias actualizado. Es AST-only, no consume tokens ni créditos, y es instantáneo.
- **Si la tarea involucra nuevos patrones:** Considera sugerir `node tools/survey-taste.js` para detectar automáticamente preferencias.
- **No ejecutes `pin-llm-wiki run` automáticamente** — solo cuando tú o yo determinemos que hay nueva información externa relevante (documentación de Fusion, tutoriales, etc.).

## WezTerm Agent Status

Si estás ejecutándote dentro de WezTerm (lo más probable), DEBES reportar tu estado actual al sistema de indicadores de la barra de tabs:

- **Al iniciar una tarea:**
  ```bash
  "$HOME/wezterm-status.bat" working
  ```
- **Al completar una tarea:**
  ```bash
  "$HOME/wezterm-status.bat" idle
  ```
- **Cuando necesites input del usuario:**
  ```bash
  "$HOME/wezterm-status.bat" blocked
  ```

  > Nota: `$HOME` es `C:\Users\catec` en este sistema.

Esto hará que la barra de tabs de WezTerm muestre:
- ● naranja = trabajando
- ✘ rojo = bloqueado (esperando input)
- Sin icono = inactivo

El script está en `%USERPROFILE%\wezterm-status.bat` y también hay una versión PowerShell en `%USERPROFILE%\wezterm-status.ps1`.
