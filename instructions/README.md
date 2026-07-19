# 📋 Sistema de Instrucciones Automáticas

ChatGPT escribe instrucciones aquí → Freebuff las ejecuta automáticamente.

## ✍️ Cómo escribir una instrucción (para ChatGPT)

Crea un archivo `.md` en esta carpeta con el siguiente formato:

```markdown
---
command: summarize | analyze | refactor | write-readme | custom
target: "ruta/del/proyecto/"
description: "Breve descripción de lo que debe hacer Freebuff"
---

## Contexto

Explica aquí el contexto relevante, qué ha pasado antes, qué necesitas que Freebuff sepa.

## Instrucciones detalladas

1. Paso a paso lo que debe hacer Freebuff
2. Archivos específicos a modificar
3. Qué output se espera

## Criterios de éxito

- [ ] Criterio 1
- [ ] Criterio 2
```

### Comandos disponibles

| Comando | Qué hace |
|---|---|
| `summarize` | Freebuff analiza el proyecto y escribe un resumen de estado |
| `analyze` | Freebuff hace un análisis profundo de un área específica |
| `refactor` | Freebuff ejecuta una refactorización |
| `write-readme` | Freebuff crea o actualiza documentación |
| `custom` | Freebuff ejecuta instrucciones personalizadas |
| `taste-survey` | Freebuff ejecuta una encuesta de Taste sobre el proyecto |

### Nomenclatura de archivos

Usa nombres descriptivos: `YYYY-MM-DD-breve-descripcion.md`

Ejemplo: `2026-07-19-analizar-tastedesign.md`

## 🔄 Flujo

```
ChatGPT → escribe .md en instructions/ → push a GitHub →
Freebuff detecta → lee → ejecuta → mueve a processed/ →
push del resultado a GitHub → ChatGPT lo ve
```
