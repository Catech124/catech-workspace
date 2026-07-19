# AGENTS.md — Quick reference

## Git — never auto-commit
Do NOT run `git commit` or `git push` unless the human explicitly asks. List what changed and stop.

## Roles de agentes — Planificador vs Implementador

Cuando el usuario te mencione como **"planificador"** o **"implementador"**, debes leer el archivo de reglas correspondiente y comportarte según ese rol.

| Rol | Archivo de reglas | Responsabilidad |
|-----|------------------|-----------------|
| 🏗️ **Planificador** | `roles/reglas_planificador.md` | Diseñar el plan, definir fases, crear tests, entregar chunks. **No toca código.** |
| 🔧 **Implementador** | `roles/reglas_implementador.md` | Implementar código, ejecutar tests, reportar estado. **No modifica planes.** |

### Flujo de trabajo conjunto
1. El **planificador** diseña el proyecto en fases atómicas (<30 min c/u)
2. El **planificador** entrega chunks al implementador
3. El **implementador** recibe el chunk, implementa, prueba y reporta
4. Si hay fallos, el implementador reporta y el planificador actualiza el plan
5. El ciclo se repite hasta completar el proyecto

### Canal de comunicación
Según las reglas, ambos roles se comunicarían mediante un archivo compartido `state.json` con middleware Odin, pero **este sistema no está implementado aún**. Ninguno interrumpe al otro en medio de una fase.

Mientras tanto, el canal real de comunicación entre roles es el sistema `instructions/` (escribir → detectar → ejecutar → reportar).

### Integración con el sistema de instrucciones
El flujo planificador↔implementador se conecta con el sistema de `instructions/`:
- El **planificador** escribe instrucciones/chunks en `instructions/` para que el implementador las ejecute
- El **implementador** detecta nuevas instrucciones via el cron (cada 5 min) o ejecutando `bash process-instructions.sh`
- Los resultados y reportes se pushean de vuelta al repo para que el planificador los lea
- Cuando trabajes como **planificador**, lee `roles/reglas_planificador.md`
- Cuando trabajes como **implementador**, lee `roles/reglas_implementador.md`

---

## Instrucciones automáticas (ChatGPT → Freebuff)
ChatGPT escribe instrucciones en `instructions/` → Freebuff las ejecuta.

**Flujo:**
1. Freebuff trabaja y pushea reportes a GitHub
2. ChatGPT lee el repo via extensión, analiza, decide qué hacer
3. ChatGPT escribe un archivo `.md` en `instructions/` con formato YAML frontmatter
4. Freebuff ejecuta `bash process-instructions.sh` o el cron lo hace automáticamente
5. Freebuff ejecuta la instrucción y pushea el resultado
6. ChatGPT lee el resultado y el ciclo continúa

**Comandos disponibles:** `summarize`, `analyze`, `refactor`, `write-readme`, `taste-survey`, `custom`

**Monitoreo automático:** El cron revisa cada 5 min si hay instrucciones nuevas:
```bash
crontab -l  # Ver cron activo
```

## 🔍 Búsqueda ultrarrápida de archivos

El sistema tiene herramientas instaladas para buscar archivos al instante:

| Herramienta | Versión | Ubicación | Uso |
|---|---|---|---|
| **`fd`** | v10.2.0 | `~/scripts/fd` | Buscar archivos por nombre/patrón |
| **`plocate`** | v1.1.19 | `/usr/bin/plocate` | Búsqueda instantánea por DB indexada (~0.3 ms) |
| **`rg` (ripgrep)** | v14.1.0 | `/usr/bin/rg` | Buscar texto DENTRO de archivos |
| **`fzf`** | v0.44.1 | `/usr/bin/fzf` | Filtrar resultados interactivamente |
| **`bat`** | — | `/usr/bin/bat` | Ver archivos con syntax highlighting |

### Comandos útiles

```bash
# Buscar archivos por nombre (usar ruta completa para evitar el fd roto de Windows)
~/scripts/fd '.md$' ~
~/scripts/fd -t f '.ts$' ~/freebuff-modified
~/scripts/fd --changed-within 24h '.md$' ~
~/scripts/fd 'transcribe' /mnt/c/Users/catec/

# Búsqueda instantánea por DB indexada (solo Linux, excluye /mnt/c)
plocate SKILL.md
plocate transcribe_parakeet.py
plocate -r 'wat.*SKILL'

# Buscar texto dentro de archivos
rg -l "onnxruntime" ~/

# Buscar + filtrar interactivamente
plocate -r '.' | fzf --preview 'bat --color=always {}'
```

> ⚠️ Usa siempre `~/scripts/fd` porque el `fd` de Windows (`/mnt/c/Users/catec/AppData/Roaming/npm/fd`) está roto y tiene prioridad en el PATH.

### Carpetas ignoradas (`.fdignore` + `.rgignore`)

Para búsquedas instantáneas, estas carpetas se ignoran automáticamente:
- `.freebuff-account*` (~1 GB, logs de chats)
- `.bun/` (909 MB, caché Bun)
- `node22/` (538 MB, binarios Node.js)
- `playwrighter/` (343 MB, Python virtualenv)
- `node_modules/` (~300 MB, dependencias npm)

> Antes: `fd .md ~` → TIMEOUT (>30s) | Ahora: `fd .md ~` → INSTANTÁNEO (<1s)

---

## 🌐 Conexión SSH a Windows (WSL → Windows)

Acceso SSH desde WSL hacia Windows para ejecutar comandos remotos.

| Aspecto | Detalle |
|---|---|
| **Host SSH** | `windows` (configurado en `~/.ssh/config`) |
| **Llave** | `~/.ssh/id_ed25519_vm` |
| **Conexión** | ✅ Establecida y verificada |
| **Uso principal** | Ejecutar Python, scripts y comandos en Windows desde WSL |

### Comandos básicos

```bash
# Verificar conexión
ssh windows echo ok

# Ejecutar comandos en Windows
ssh windows "where python"

# Ejecutar Python del venv en Windows
ssh windows "ruta/al/venv/Scripts/python.exe --version"

# Ejecutar un script en Windows
ssh windows "ruta/al/venv/Scripts/python.exe ruta/al/script.py"

# Verificar versión de una herramienta en Windows
ssh windows "ruta/a/la/herramienta.exe --version"
```

> 💡 Para las rutas exactas, consulta `docs/dependencias-windows.md`.

### Ventajas sobre `/mnt/c/`

| Aspecto | `/mnt/c/` (montaje) | SSH `windows` |
|---|---|---|
| Ejecutar .exe | ❌ No funciona | ✅ Sí, corre en Windows nativo |
| Velocidad I/O | Lento (DrvFs) | ✅ Rápido (NTFS) |
| Permisos | ❌ Problemas | ✅ Usuario Windows real |

---

## 🖥️ monitor.sh — Script helper para monitoreo en vivo

Script para ejecutar comandos largos con `nohup` (persisten entre sub-agentes) y leer el output raw.

**Ubicación:** `~/scripts/monitor.sh` | **Uso:** `bash ~/scripts/monitor.sh`

### Comandos

| Comando | Qué hace |
|---|---|
| `start <id> "<comando>"` | Inicia un comando largo en background con nohup |
| `status <id>` | Muestra el output **raw completo** del log |
| `stream <id> <segs>` | Monitorea cada 0.5s por N segundos |
| `cancel <id>` | Mata el proceso (SIGTERM) |
| `wait <id> [timeout]` | Espera a que termine y muestra todo |
| `last <id> [N]` | Últimas N líneas del log |
| `list` | Lista todas las sesiones activas |
| `clean <id>` | Limpia logs de una sesión terminada |

### Ejemplos

```bash
# Iniciar comando largo
bash ~/scripts/monitor.sh start transcripcion "sleep 30 && echo listo"

# Ver progreso en RAW
bash ~/scripts/monitor.sh status transcripcion

# Streaming en vivo por 8 segundos
bash ~/scripts/monitor.sh stream transcripcion 8

# Leer el log directamente (raw output exacto)
cat /tmp/monitor-sessions/transcripcion.log

# Cancelar si algo sale mal
bash ~/scripts/monitor.sh cancel transcripcion

# Esperar a que termine (timeout 120s)
bash ~/scripts/monitor.sh wait transcripcion 120

# Listar sesiones activas
bash ~/scripts/monitor.sh list
```

Los logs quedan en `/tmp/monitor-sessions/<id>.log`.

---

## 🤖 Telegram Bridge (Herdr ↔ Telegram)

Bridge bidireccional que conecta Telegram con los agentes de Herdr.

### 📍 Ubicación

| Componente | Ruta |
|---|---|
| **Bridge principal** | `~/.freebuff-account2/herdr-telegram-bridge/bridge.mjs` |
| **Librería** | `~/.freebuff-account2/herdr-telegram-bridge/lib.mjs` |
| **Configuración (token)** | `~/.freebuff-account2/herdr-telegram-bridge/.env` |
| **Ejemplo de config** | `~/.freebuff-account2/herdr-telegram-bridge/.env.example` |
| **Script de inicio** | `~/.freebuff-account2/herdr-telegram-bridge/start-bridge.sh` |
| **Script de parada** | `~/.freebuff-account2/herdr-telegram-bridge/stop-bridge.sh` |
| **Copia en el repo** | `docs/telegram-bridge.mjs` y `docs/telegram-bridge-lib.mjs` |

### 🔐 Token y configuración

El token del bot de Telegram y el chat ID están en el archivo `.env`:
```bash
cat ~/.freebuff-account2/herdr-telegram-bridge/.env
```

Variables principales:
- `TELEGRAM_BOT_TOKEN` — Token del bot creado con @BotFather
- `TELEGRAM_CHAT_ID` — ID numérico del chat de Telegram
- `NOTIFY_ON_BLOCKED` — Notificar cuando un agente se bloquea (1/0)
- `NOTIFY_ON_DONE` — Notificar cuando completa (1/0)
- `BLOCKED_PREVIEW_LINES` — Líneas de preview al notificar bloqueo

### 🚀 Comandos

```bash
# Ver estado
cd ~/.freebuff-account2/herdr-telegram-bridge && node bridge.mjs --status

# Iniciar en foreground (debug)
node bridge.mjs

# Iniciar en background
bash start-bridge.sh

# Detener
bash stop-bridge.sh
```

### 📱 Funcionalidades

- Notifica a Telegram cuando un agente se bloquea, empieza a trabajar o termina
- Permite responder a los agentes desde Telegram
- Soporta fotos desde Telegram al agente
- Comandos: `/target`, `/agents`, `/start`, `/output`, `/cancel`, `/bridge`, `/autostart`
- Detecta preguntas de Freebuff (`ask_user`) y las reenvía a Telegram

### 📄 Documentación

El AGENTS.md para ChatGPT (guía para que ChatGPT colabore con Freebuff) se encuentra en:
- **Windows:** `C:\Users\catec\Downloads\AGENTS.md`
- **Enviado a:** Telegram (chat con el bot)

## 📦 Dependencias del sistema

Para conocer las rutas exactas de dependencias instaladas en Windows (yt-dlp, Python, modelo Parakeet, scripts), consulta el archivo:

> **`docs/dependencias-windows.md`** — Árbol de instalaciones y guía de uso de herramientas.

Este archivo contiene el inventario completo de dependencias verificadas. Úsalo como referencia cuando necesites una ruta específica.

---

## AI subagents (Claude, ChatGPT, Gemini, DeepSeek, Kimi, ChatGLM)

**Path:** `/mnt/c/Users/catec/agent-dashboard`

**Architecture:** Windows-only subagents. The orchestrator runs from WSL2 but dispatches all work to Windows via SSH. The Linux/WSL subagents have been removed.

### Before running — pre-flight SSH check (MANDATORY, 5s)
```bash
# Key must have correct permissions, then test SSH tunnel:
chmod 600 ~/.ssh/id_ed25519_vm 2>/dev/null
ssh windows echo ok
```
If `Permission denied` → `chmod 600 ~/.ssh/id_ed25519_vm` and retry.
If `Connection refused` → the SSH tunnel to Windows is down. Tell the user.

### Quick commands
```bash
cd /mnt/c/Users/catec/agent-dashboard

# Ask Claude (~25s)
python3 subagent-orchestrator.py --provider claude --account 1 --prompt "..."

# Long analysis (600s safety net)
python3 subagent-orchestrator.py --provider claude --account 1 --full --prompt "..."

# Auto-rotate if account fails
python3 subagent-orchestrator.py --provider claude --rotate --prompt "..."

# Check account status
python3 subagent-orchestrator.py --status --provider claude
```

### Providers: claude, chatgpt, gemini, deepseek, kimi, chatglm
All use `--account 1` (or 2, 3). All 3 accounts active. Sessions expire ~7 days. No cooldowns.

### Don'ts
- No parallelism (shared chromedriver)
- No images via SSH
- Quotes around multi-word prompts

### If it fails
- `AUTH_REQUIRED` → re-login on Windows: `python login-survey-win.py --provider claude --account 1`
- `Timeout` → use `--full` or `--rotate`
- Any SSH error → run pre-flight check above
