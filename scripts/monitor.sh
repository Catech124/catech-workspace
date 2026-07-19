#!/usr/bin/env bash
# ============================================================================
# monitor.sh — Script helper para monitoreo en vivo de procesos largos
# ============================================================================
# Ubicación permanente: ~/scripts/monitor.sh
#
# Permite ejecutar comandos largos con nohup (persisten entre sub-agentes)
# y leer el raw output directamente desde el log.
# ============================================================================
set -euo pipefail

SESSION_DIR="/tmp/monitor-sessions"
VERSION="1.0.0"

# --- Funciones auxiliares ---

usage() {
  cat <<EOF
Uso: $0 <comando> [args]

Comandos:
  start <id> "<comando>"    Inicia un comando largo en background con nohup
  status <id>               Muestra el output raw completo del log
  stream <id> <segs>        Monitorea cada 0.5s por N segundos (en vivo)
  cancel <id>               Mata el proceso (SIGTERM)
  wait <id> [timeout]       Espera a que termine y muestra todo
  last <id> [N]             Últimas N líneas del log (default: 20)
  list                      Lista todas las sesiones activas
  clean <id>                Limpia logs de una sesión terminada
  version                   Muestra la versión del script

Ejemplos:
  $0 start transcripcion "sleep 30 && echo listo"
  $0 status transcripcion
  $0 stream transcripcion 8
  $0 cancel transcripcion
  $0 wait transcripcion 120
  $0 last transcripcion 10
  $0 list
  $0 clean transcripcion
EOF
  exit 1
}

ensure_session_dir() {
  mkdir -p "$SESSION_DIR"
}

get_log() {
  echo "$SESSION_DIR/$1.log"
}

get_pid() {
  echo "$SESSION_DIR/$1.pid"
}

is_running() {
  local pid_file
  pid_file=$(get_pid "$1")
  if [[ -f "$pid_file" ]]; then
    local pid
    pid=$(cat "$pid_file")
    if kill -0 "$pid" 2>/dev/null; then
      return 0
    fi
  fi
  return 1
}

timestamp() {
  date '+%Y-%m-%d %H:%M:%S'
}

# --- Comandos ---

cmd_start() {
  local id="$1"
  shift
  local comando="$*"

  if [[ -z "$id" || -z "$comando" ]]; then
    echo "❌ Uso: $0 start <id> \"<comando>\""
    exit 1
  fi

  ensure_session_dir

  if is_running "$id"; then
    echo "❌ La sesión '$id' ya está en ejecución. Cancélala primero."
    exit 1
  fi

  local log_file
  log_file=$(get_log "$id")
  local pid_file
  pid_file=$(get_pid "$id")

  # Limpiar logs anteriores si existen
  rm -f "$log_file" "$pid_file"

  echo "[$(timestamp)] ▶️  Iniciando sesión '$id'..." | tee -a "$log_file"
  echo "[$(timestamp)] 📋 Comando: $comando" | tee -a "$log_file"
  echo "[$(timestamp)] 🆔 PID: \$\$" >> "$log_file"

  # Ejecutar con nohup para que persista entre sub-agentes
  nohup bash -c "
    echo \$\$ > '$pid_file'
    echo \"[$(timestamp)] ✅ Proceso iniciado (PID: \$\$)\"
    $comando
    echo \"[$(timestamp)] ⏹️  Proceso terminado (exit code: \$?)\"
  " >> "$log_file" 2>&1 &

  local child_pid=$!
  echo "$child_pid" > "$pid_file"
  echo "✅ Sesión '$id' iniciada (PID: $child_pid)"
  echo "📝 Log: $log_file"
}

cmd_status() {
  local id="$1"

  if [[ -z "$id" ]]; then
    echo "❌ Uso: $0 status <id>"
    exit 1
  fi

  local log_file
  log_file=$(get_log "$id")

  if [[ ! -f "$log_file" ]]; then
    echo "❌ No existe la sesión '$id'"
    exit 1
  fi

  if is_running "$id"; then
    echo "🟢 Sesión '$id' está EN EJECUCIÓN"
  else
    echo "🔴 Sesión '$id' está TERMINADA"
  fi
  echo "────────────────────────────────────────"
  cat "$log_file"
}

cmd_cancel() {
  local id="$1"

  if [[ -z "$id" ]]; then
    echo "❌ Uso: $0 cancel <id>"
    exit 1
  fi

  if ! is_running "$id"; then
    echo "⚠️  La sesión '$id' no está en ejecución"
    exit 0
  fi

  local pid
  pid=$(cat "$(get_pid "$id")")
  echo "🛑 Cancelando sesión '$id' (PID: $pid)..."
  kill "$pid" 2>/dev/null || true
  echo "[$(timestamp)] 🛑 Proceso cancelado por el usuario" >> "$(get_log "$id")"
  echo "✅ Sesión '$id' cancelada"
}

cmd_stream() {
  local id="$1"
  local segs="${2:-5}"

  if [[ -z "$id" ]]; then
    echo "❌ Uso: $0 stream <id> <segs>"
    exit 1
  fi

  local log_file
  log_file=$(get_log "$id")

  if [[ ! -f "$log_file" ]]; then
    echo "❌ No existe la sesión '$id'"
    exit 1
  fi

  local last_size=0
  local end_time
  end_time=$(( $(date +%s) + segs ))

  echo "📡 Streaming sesión '$id' por ${segs}s (cada 0.5s)..."
  echo "────────────────────────────────────────"

  while [[ $(date +%s) -lt $end_time ]]; do
    if [[ -f "$log_file" ]]; then
      local current_size
      current_size=$(wc -c < "$log_file")
      if [[ "$current_size" -gt "$last_size" ]]; then
        tail -c +$((last_size + 1)) "$log_file"
        last_size=$current_size
      fi
    fi
    sleep 0.5
  done

  echo "────────────────────────────────────────"
  echo "✅ Streaming finalizado"
}

cmd_wait() {
  local id="$1"
  local timeout="${2:-300}"

  if [[ -z "$id" ]]; then
    echo "❌ Uso: $0 wait <id> [timeout]"
    exit 1
  fi

  local log_file
  log_file=$(get_log "$id")

  if [[ ! -f "$log_file" ]]; then
    echo "❌ No existe la sesión '$id'"
    exit 1
  fi

  local end_time
  end_time=$(( $(date +%s) + timeout ))
  local last_size=0

  echo "⏳ Esperando a que termine sesión '$id' (timeout: ${timeout}s)..."

  while [[ $(date +%s) -lt $end_time ]]; do
    if ! is_running "$id"; then
      echo "✅ Sesión '$id' terminó"
      echo "────────────────────────────────────────"
      cat "$log_file"
      return 0
    fi

    # Mostrar progreso incremental
    if [[ -f "$log_file" ]]; then
      local current_size
      current_size=$(wc -c < "$log_file")
      if [[ "$current_size" -gt "$last_size" ]]; then
        tail -c +$((last_size + 1)) "$log_file"
        last_size=$current_size
      fi
    fi

    sleep 1
  done

  echo "⚠️  Timeout de ${timeout}s alcanzado, sesión '$id' aún en ejecución"
  return 1
}

cmd_last() {
  local id="$1"
  local n="${2:-20}"

  if [[ -z "$id" ]]; then
    echo "❌ Uso: $0 last <id> [N]"
    exit 1
  fi

  local log_file
  log_file=$(get_log "$id")

  if [[ ! -f "$log_file" ]]; then
    echo "❌ No existe la sesión '$id'"
    exit 1
  fi

  tail -n "$n" "$log_file"
}

cmd_list() {
  ensure_session_dir
  local count=0

  echo "📋 Sesiones en $SESSION_DIR:"
  echo "────────────────────────────────────────"

  for log_file in "$SESSION_DIR"/*.log; do
    [[ -f "$log_file" ]] || continue
    local id
    id=$(basename "$log_file" .log)
    local estado

    if is_running "$id"; then
      estado="🟢 EN EJECUCIÓN"
    else
      estado="🔴 TERMINADA"
    fi

    local size
    size=$(du -h "$log_file" | cut -f1)
    local modified
    modified=$(stat -c "%y" "$log_file" 2>/dev/null | cut -d. -f1)

    printf "  %-20s %-20s %6s  %s\n" "$id" "$estado" "$size" "$modified"
    count=$((count + 1))
  done

  if [[ "$count" -eq 0 ]]; then
    echo "  (no hay sesiones)"
  fi
  echo "────────────────────────────────────────"
  echo "Total: $count sesiones"
}

cmd_clean() {
  local id="$1"

  if [[ -z "$id" ]]; then
    echo "❌ Uso: $0 clean <id>"
    exit 1
  fi

  if is_running "$id"; then
    echo "⚠️  La sesión '$id' está en ejecución. Cancélala primero."
    exit 1
  fi

  rm -f "$(get_log "$id")" "$(get_pid "$id")"
  echo "✅ Logs de sesión '$id' eliminados"
}

# --- Main ---

[[ $# -lt 1 ]] && usage

CMD="$1"
shift

case "$CMD" in
  start)   cmd_start "$@" ;;
  status)  cmd_status "$@" ;;
  stream)  cmd_stream "$@" ;;
  cancel)  cmd_cancel "$@" ;;
  wait)    cmd_wait "$@" ;;
  last)    cmd_last "$@" ;;
  list)    cmd_list "$@" ;;
  clean)   cmd_clean "$@" ;;
  version) echo "monitor.sh v$VERSION" ;;
  *)       usage ;;
esac
