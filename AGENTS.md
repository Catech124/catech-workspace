# AGENTS.md — Quick reference

## Git — never auto-commit
Do NOT run `git commit` or `git push` unless the human explicitly asks. List what changed and stop.

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
