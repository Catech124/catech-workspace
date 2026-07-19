#!/bin/bash
# ============================================================
# process-instructions.sh
# Procesa instrucciones escritas por ChatGPT en instructions/
# y las ejecuta a través de Freebuff.
# ============================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROCESSED_DIR="$SCRIPT_DIR/instructions/processed"
INSTRUCTIONS_DIR="$SCRIPT_DIR/instructions"
LOG_FILE="$SCRIPT_DIR/instructions/processing.log"

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"
}

log "=== Iniciando procesamiento de instrucciones ==="

# 1. Traer los últimos cambios de GitHub
log "Pulling latest changes from GitHub..."
cd "$SCRIPT_DIR"
git pull origin main 2>&1 | tee -a "$LOG_FILE"

# 2. Buscar archivos .md nuevos en instructions/ (excluyendo README y processed/archive)
NEW_FILES=$(find "$INSTRUCTIONS_DIR" -maxdepth 1 -name "*.md" -not -name "README.md" -newer "$INSTRUCTIONS_DIR/.last-processed" 2>/dev/null || echo "")

if [ -z "$NEW_FILES" ]; then
  # Si no hay archivos más nuevos que .last-processed, buscar todos excepto README
  NEW_FILES=$(find "$INSTRUCTIONS_DIR" -maxdepth 1 -name "*.md" -not -name "README.md" 2>/dev/null || echo "")
  
  if [ -z "$NEW_FILES" ]; then
    log "No hay instrucciones nuevas para procesar."
    echo "---"
    echo "STATUS=idle"
    echo "MESSAGE=No new instructions found."
    exit 0
  fi
fi

# 3. Procesar cada instrucción
for FILE in $NEW_FILES; do
  FILENAME=$(basename "$FILE")
  log "Procesando: $FILENAME"
  
  # Extraer metadatos del frontmatter YAML
  COMMAND=$(grep -oP '(?<=^command: ).*' "$FILE" | head -1 | tr -d ' ')
  TARGET=$(grep -oP '(?<=^target: ").*?(?=")' "$FILE" | head -1)
  DESCRIPTION=$(grep -oP '(?<=^description: ").*?(?=")' "$FILE" | head -1)
  
  log "  Comando: $COMMAND"
  log "  Target: $TARGET"
  log "  Descripción: $DESCRIPTION"
  
  # 4. Ejecutar según el comando
  case "$COMMAND" in
    summarize)
      log "  → Ejecutando summarize en: $TARGET"
      echo ""
      echo "╔══════════════════════════════════════════════════════════════╗"
      echo "║  📋 INSTRUCCIÓN DE CHATGPT                                 ║"
      echo "╠══════════════════════════════════════════════════════════════╣"
      echo "║  Archivo: $FILENAME"
      echo "║  Comando: $COMMAND"
      echo "║  Target:  $TARGET"
      echo "║  Descripción: $DESCRIPTION"
      echo "╚══════════════════════════════════════════════════════════════╝"
      echo ""
      cat "$FILE"
      echo ""
      echo "───────────────────────────────────────────────"
      echo "Para ejecutar esta instrucción, usa Freebuff normalmente."
      echo "Cuando hayas terminado, el archivo se marcará como procesado."
      echo "───────────────────────────────────────────────"
      ;;
      
    analyze)
      log "  → Ejecutando analyze en: $TARGET"
      echo ""
      echo "╔══════════════════════════════════════════════════════════════╗"
      echo "║  🔍 ANÁLISIS SOLICITADO POR CHATGPT                        ║"
      echo "╠══════════════════════════════════════════════════════════════╣"
      echo "║  Archivo: $FILENAME"
      echo "║  Target:  $TARGET"
      echo "╚══════════════════════════════════════════════════════════════╝"
      echo ""
      cat "$FILE"
      echo ""
      echo "───────────────────────────────────────────────"
      ;;
      
    refactor)
      log "  → Ejecutando refactor en: $TARGET"
      echo ""
      echo "╔══════════════════════════════════════════════════════════════╗"
      echo "║  🔧 REFACTORIZACIÓN SOLICITADA POR CHATGPT                 ║"
      echo "╠══════════════════════════════════════════════════════════════╣"
      echo "║  Archivo: $FILENAME"
      echo "║  Target:  $TARGET"
      echo "╚══════════════════════════════════════════════════════════════╝"
      echo ""
      cat "$FILE"
      echo ""
      echo "───────────────────────────────────────────────"
      ;;
      
    write-readme)
      log "  → Ejecutando write-readme en: $TARGET"
      echo ""
      echo "╔══════════════════════════════════════════════════════════════╗"
      echo "║  📝 DOCUMENTACIÓN SOLICITADA POR CHATGPT                   ║"
      echo "╠══════════════════════════════════════════════════════════════╣"
      echo "║  Archivo: $FILENAME"
      echo "║  Target:  $TARGET"
      echo "╚══════════════════════════════════════════════════════════════╝"
      echo ""
      cat "$FILE"
      echo ""
      echo "───────────────────────────────────────────────"
      ;;
      
    taste-survey)
      log "  → Ejecutando Taste survey en: $TARGET"
      echo ""
      echo "╔══════════════════════════════════════════════════════════════╗"
      echo "║  🎯 TASTE SURVEY SOLICITADO POR CHATGPT                    ║"
      echo "╠══════════════════════════════════════════════════════════════╣"
      echo "║  Archivo: $FILENAME"
      echo "║  Target:  $TARGET"
      echo "╚══════════════════════════════════════════════════════════════╝"
      echo ""
      cat "$FILE"
      echo ""
      echo "───────────────────────────────────────────────"
      ;;
      
    custom|*)
      log "  → Ejecutando instrucción personalizada"
      echo ""
      echo "╔══════════════════════════════════════════════════════════════╗"
      echo "║  📋 INSTRUCCIÓN PERSONALIZADA DE CHATGPT                   ║"
      echo "╠══════════════════════════════════════════════════════════════╣"
      echo "║  Archivo: $FILENAME"
      echo "╚══════════════════════════════════════════════════════════════╝"
      echo ""
      cat "$FILE"
      echo ""
      echo "───────────────────────────────────────────────"
      ;;
  esac
  
  # Mover a processed después de mostrar (la ejecución real la hace Freebuff)
  mv "$FILE" "$PROCESSED_DIR/"
  log "  → Movido a processed/$FILENAME"
  
done

# 5. Actualizar marcador de último procesamiento
touch "$INSTRUCTIONS_DIR/.last-processed"

# 6. Commit del estado procesado
log "Committing processed instructions..."
git add instructions/
if git commit -m "feat(instructions): processed instructions batch" -m "Procesadas $(echo "$NEW_FILES" | wc -l) instrucciones" > /dev/null 2>&1; then
  git push origin main 2>&1 | tee -a "$LOG_FILE"
  log "✅ Push completado."
else
  log "ℹ️  No hay cambios nuevos para commit."
fi

log "=== Procesamiento completado ==="
echo "---"
echo "STATUS=completed"
echo "FILES_PROCESSED=$(echo "$NEW_FILES" | wc -l)"
