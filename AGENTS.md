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
Ambos roles se comunican mediante un archivo compartido `state.json`. Ninguno interrumpe al otro en medio de una fase.

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
