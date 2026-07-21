// ─── lib.mjs — Shared utilities for the Telegram ↔ Herdr bridge ───

import { readdirSync, readFileSync, existsSync, mkdirSync, writeFileSync, unlinkSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

// ─── Paths ──────────────────────────────────────────────────────────

export const pluginRoot = dirname(fileURLToPath(import.meta.url));

export function bridgeDataDir() {
  const custom = process.env.BRIDGE_DATA_DIR?.trim();
  if (custom) return custom;
  return pluginRoot;
}

export function pidPath() {
  return join(bridgeDataDir(), 'bridge.pid');
}

export function stopFilePath() {
  return join(bridgeDataDir(), 'bridge.stop');
}

// ─── .env loader ────────────────────────────────────────────────────

export function loadDotEnv() {
  const paths = [
    process.env.HERDR_PLUGIN_CONFIG_DIR
      ? join(process.env.HERDR_PLUGIN_CONFIG_DIR, '.env')
      : null,
    join(pluginRoot, '.env'),
    join(pluginRoot, '.env.example'),
  ].filter(Boolean);

  for (const p of [...new Set(paths)]) {
    loadDotEnvFile(p);
  }
}

function loadDotEnvFile(path) {
  let content;
  try {
    content = readFileSync(path, 'utf8');
  } catch {
    return;
  }
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (!key || process.env[key] !== undefined) continue;
    process.env[key] = stripQuotes(value);
  }
}

function stripQuotes(v) {
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    return v.slice(1, -1);
  }
  return v;
}

// ─── Helpers ────────────────────────────────────────────────────────

export function envBool(name, fallback = false) {
  const raw = process.env[name];
  if (raw === undefined || raw.trim() === '') return fallback;
  return !['0', 'false', 'no', 'off', 'disabled'].includes(raw.trim().toLowerCase());
}

export function envStr(name, fallback = '') {
  const raw = process.env[name];
  if (raw === undefined || raw.trim() === '') return fallback;
  return raw.trim();
}

export function envInt(name, fallback = 0) {
  const raw = process.env[name];
  if (raw === undefined || raw.trim() === '') return fallback;
  const n = parseInt(raw.trim(), 10);
  return isNaN(n) ? fallback : n;
}

export function log(...args) {
  const ts = new Date().toISOString().replace('T', ' ').slice(0, 19);
  console.log(`[${ts}] [BRIDGE]`, ...args);
}

export function warn(...args) {
  const ts = new Date().toISOString().replace('T', ' ').slice(0, 19);
  console.warn(`[${ts}] [WARN]`, ...args);
}

export function err(...args) {
  const ts = new Date().toISOString().replace('T', ' ').slice(0, 19);
  console.error(`[${ts}] [ERROR]`, ...args);
}

// ─── PID / Daemon helpers ──────────────────────────────────────────

export function writePid() {
  const p = pidPath();
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, String(process.pid) + '\n', 'utf8');
  log(`PID ${process.pid} written to ${p}`);
}

export function removePid() {
  try { unlinkSync(pidPath()); } catch { /* ignore */ }
}

export function isStopRequested() {
  return existsSync(stopFilePath());
}

export function clearStopFile() {
  try { unlinkSync(stopFilePath()); } catch { /* ignore */ }
}

// ─── Herdr socket / CLI helpers ────────────────────────────────────

// (Socket connection removed — bridge now uses CLI polling)

/**
 * Run a herdr CLI command and return parsed JSON result.
 */
export function herdrCli(...args) {
  const bin = process.env.HERDR_BIN_PATH || 'herdr';
  const result = spawnSync(bin, args, {
    encoding: 'utf8',
    timeout: 10000,
    windowsHide: true,
  });
  if (result.error) throw new Error(`herdr CLI error: ${result.error.message}`);
  if (result.status !== 0) {
    throw new Error(`herdr CLI exited ${result.status}: ${result.stderr?.trim() || result.stdout?.trim()}`);
  }
  try {
    return JSON.parse(result.stdout);
  } catch {
    return result.stdout.trim();
  }
}

/**
 * Get current list of agents from herdr.
 * Returns:  agent array on success
 *           []     when herdr is running but no agents exist
 *           null   when herdr CLI is not found or errors
 */
export async function getAgents() {
  const bin = process.env.HERDR_BIN_PATH || 'herdr';
  const result = spawnSync(bin, ['agent', 'list'], {
    encoding: 'utf8',
    timeout: 10000,
    windowsHide: true,
  });

  // herdr not found in PATH
  if (result.error) {
    if (result.error.code === 'ENOENT') {
      warn('herdr CLI not found in PATH. Is herdr installed?');
    } else {
      warn('herdr CLI error:', result.error.message);
    }
    return null;
  }

  // herdr CLI error
  if (result.status !== 0) {
    warn(`herdr agent list exited ${result.status}: ${result.stderr?.trim() || result.stdout?.trim()}`);
    return null;
  }

  // Parse output — herdr agent list returns: { id, result: { type, agents: [...] } }
  const stdout = result.stdout.trim();
  if (!stdout) return [];

  try {
    const parsed = JSON.parse(stdout);
    // Navigate to result.agents (may be nested or flat)
    if (parsed?.result?.agents) {
      return parsed.result.agents;
    }
    if (Array.isArray(parsed)) {
      return parsed;
    }
    // Unexpected format, log and return empty
    warn('Unexpected herdr agent list format. Keys:', Object.keys(parsed).join(','));
    return [];
  } catch {
    // Non-JSON output might be an error or unexpected format
    warn('herdr agent list returned non-JSON output:', stdout.slice(0, 200));
    return [];
  }
}

/**
 * Get pane info from herdr.
 */
export async function getPane(paneId) {
  try {
    return herdrCli('pane', 'get', paneId);
  } catch (e) {
    warn(`Failed to get pane ${paneId}:`, e.message);
    return null;
  }
}

/**
 * Start a new agent in herdr.
 * CLI: herdr agent start <name> -- <executable> [args...]
 */
export async function agentStart(name, executable, args = []) {
  const bin = process.env.HERDR_BIN_PATH || 'herdr';
  const cmdArgs = ['agent', 'start', name, '--', executable, ...args];
  const result = spawnSync(bin, cmdArgs, {
    encoding: 'utf8',
    timeout: 15000,
    windowsHide: true,
  });
  if (result.error) throw new Error(`agent start failed: ${result.error.message}`);
  if (result.status !== 0) {
    throw new Error(`agent start exited ${result.status}: ${result.stderr?.trim() || result.stdout?.trim()}`);
  }
  // Return parsed JSON or raw output
  try { return JSON.parse(result.stdout); }
  catch { return result.stdout.trim(); }
}

/**
 * Run a raw shell command via herdr (for starting agents without herdr agent start).
 */
export async function runInPane(paneId, command, cwd) {
  const bin = process.env.HERDR_BIN_PATH || 'herdr';
  const args = ['pane', 'run', paneId, command];
  const result = spawnSync(bin, args, {
    encoding: 'utf8',
    timeout: 30000,
    windowsHide: true,
  });
  if (result.error) throw new Error(`pane run failed: ${result.error.message}`);
  if (result.status !== 0) {
    throw new Error(`pane run exited ${result.status}: ${result.stderr?.trim() || result.stdout?.trim()}`);
  }
  return result.stdout.trim();
}

/**
 * Send text input to a herdr agent pane (text + Enter key).
 * 1. herdr pane send-text <pane_id> <text>  — escribe el texto
 * 2. herdr pane send-keys <pane_id> enter     — presiona Enter
 */
export async function sendToPane(paneId, text) {
  const bin = process.env.HERDR_BIN_PATH || 'herdr';

  // Step 1: Write the text
  const r1 = spawnSync(bin, ['pane', 'send-text', paneId, text], {
    encoding: 'utf8',
    timeout: 5000,
    windowsHide: true,
  });
  if (r1.error) throw new Error(`send-text failed: ${r1.error.message}`);
  if (r1.status !== 0) {
    throw new Error(`send-text exited ${r1.status}: ${r1.stderr?.trim() || r1.stdout?.trim()}`);
  }

  // Step 2: Press Enter (best-effort — text ya se escribió)
  const r2 = spawnSync(bin, ['pane', 'send-keys', paneId, 'enter'], {
    encoding: 'utf8',
    timeout: 5000,
    windowsHide: true,
  });
  if (r2.error || r2.status !== 0) {
    // Text already written, Enter is best-effort
    console.warn('No se pudo presionar Enter (el texto se escribi). Presioná Enter manualmente si es necesario.');
  }
}

/**
 * Read recent output from a herdr pane.
 */
export async function readPane(paneId, lines = 20) {
  try {
    const bin = process.env.HERDR_BIN_PATH || 'herdr';
    const result = spawnSync(bin, ['pane', 'read', paneId, '--source', 'recent-unwrapped', '--lines', String(lines)], {
      encoding: 'utf8',
      timeout: 5000,
      windowsHide: true,
    });
    if (result.status === 0) return result.stdout.trim();
    return '';
  } catch {
    return '';
  }
}

// ─── Telegram API ──────────────────────────────────────────────────

export function telegramApiUrl(token) {
  return `https://api.telegram.org/bot${token}`;
}

/**
 * Send a text message to a Telegram chat.
 */
export async function tgSendMessage(token, chatId, text, opts = {}) {
  const url = `${telegramApiUrl(token)}/sendMessage`;
  const body = {
    chat_id: chatId,
    text: String(text),
    parse_mode: opts.parse_mode || 'HTML',
    disable_web_page_preview: true,
    ...opts.extra,
  };
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`sendMessage failed: ${res.status} ${detail}`);
  }
  return res.json();
}

/**
 * Send a photo to a Telegram chat (from a local file path).
 */
export async function tgSendPhoto(token, chatId, filePath, caption = '') {
  const url = `${telegramApiUrl(token)}/sendPhoto`;
  const form = new FormData();
  form.append('chat_id', String(chatId));
  // For Node.js 26, we can use file uploads natively
  const fs = await import('node:fs');
  const blob = new Blob([fs.readFileSync(filePath)], { type: 'image/png' });
  form.append('photo', blob, filePath.split('/').pop().split('\\').pop());
  if (caption) form.append('caption', caption);

  const res = await fetch(url, { method: 'POST', body: form });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`sendPhoto failed: ${res.status} ${detail}`);
  }
  return res.json();
}

/**
 * Poll Telegram for new updates (long polling).
 */
export async function tgGetUpdates(token, offset, timeout = 30) {
  const url = `${telegramApiUrl(token)}/getUpdates?timeout=${timeout}&offset=${offset}`;
  const res = await fetch(url, { signal: AbortSignal.timeout((timeout + 5) * 1000) });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`getUpdates failed: ${res.status} ${detail}`);
  }
  return res.json();
}

/**
 * Download a Telegram photo (file from file_id).
 * Returns the local file path.
 */
export async function tgDownloadPhoto(token, fileId, destDir) {
  // Get file path
  const fileRes = await fetch(`${telegramApiUrl(token)}/getFile?file_id=${fileId}`);
  const fileData = await fileRes.json();
  if (!fileData.ok || !fileData.result?.file_path) {
    throw new Error(`getFile failed: ${JSON.stringify(fileData)}`);
  }

  const filePath = fileData.result.file_path;
  const fileName = `telegram_${Date.now()}_${filePath.split('/').pop()}`;
  const localPath = join(destDir, fileName);

  // Download
  const dlRes = await fetch(`https://api.telegram.org/file/bot${token}/${filePath}`);
  if (!dlRes.ok) throw new Error(`download failed: ${dlRes.status}`);

  const buffer = Buffer.from(await dlRes.arrayBuffer());
  mkdirSync(destDir, { recursive: true });
  writeFileSync(localPath, buffer);

  return localPath;
}


// ─── Freebuff Log Detection ────────────────────────────────────────

/**
 * Read Freebuff's JSONL log and determine agent state.
 * Uses the structured log file instead of screen scraping.
 *
 * @param {string} [accountHome] - Optional HOME dir for multi-account (freebuff2/3/4)
 * @returns {object|null} State object or null if no Freebuff log found
 */
export function getFreebuffState(accountHome = null) {
  const home = accountHome || process.env.HOME;
  const projectsDir = `${home}/.config/manicode/projects`;
  
  try {
    
    if (!existsSync(projectsDir)) return null;
    
    const projects = readdirSync(projectsDir, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => d.name);
    
    for (const proj of projects.sort().reverse()) {
      const chatsDir = `${projectsDir}/${proj}/chats`;
      
      const sessions = readdirSync(chatsDir, { withFileTypes: true })
        .filter(d => d.isDirectory())
        .map(d => d.name)
        .sort()
        .reverse();
      
      for (const session of sessions) {
        const logPath = `${chatsDir}/${session}/log.jsonl`;
        if (!existsSync(logPath)) continue;
        
        // Read the log file (JSONL files are small, readFileSync is fine)
        const raw = readFileSync(logPath, 'utf8');
        const lines = raw.trim().split('\n');
        const lastLine = lines[lines.length - 1]?.trim();
        
        let entry;
        try { entry = JSON.parse(lastLine); }
        catch { continue; }
        
        if (!entry.data) continue;
        
        const data = entry.data;
        
        // Detect ask_user tool call
        const askUserCall = data.toolCalls?.find(
          tc => tc.toolName === 'ask_user'
        );
        
        if (askUserCall) {
          return {
            state: 'question',
            method: 'ask_user_tool',
            question: askUserCall.input?.question || askUserCall.input?.message || 'Question',
            header: askUserCall.input?.header || '',
            options: askUserCall.input?.options || [],
            pid: entry.pid,
            timestamp: entry.timestamp,
            iteration: data.iteration,
            model: data.model,
            agentId: data.agentId,
            shouldEndTurn: data.shouldEndTurn,
            account: accountHome || home,
          };
        }
        
        // Detect state from shouldEndTurn
        if (data.shouldEndTurn === true) {
          return {
            state: 'idle',
            method: 'log_jsonl',
            pid: entry.pid,
            timestamp: entry.timestamp,
            iteration: data.iteration,
            model: data.model,
            agentId: data.agentId,
            shouldEndTurn: true,
            account: accountHome || home,
          };
        }
        
        if (data.toolCalls?.length > 0) {
          return {
            state: 'executing',
            method: 'log_jsonl',
            pid: entry.pid,
            timestamp: entry.timestamp,
            iteration: data.iteration,
            model: data.model,
            agentId: data.agentId,
            toolCount: data.toolCalls.length,
            toolNames: data.toolCalls.map(tc => tc.toolName),
            shouldEndTurn: false,
            account: accountHome || home,
          };
        }
        
        return {
          state: 'working',
          method: 'log_jsonl',
          pid: entry.pid,
          timestamp: entry.timestamp,
          iteration: data.iteration,
          model: data.model,
          agentId: data.agentId,
          shouldEndTurn: false,
          account: accountHome || home,
        };
      }
    }
    return null; // No active Freebuff session found
  } catch (e) {
    // Silently fail — log detection is best-effort
    return null;
  }
}


// ─── Formatting helpers ─────────────────────────────────────────────

export function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function titleCase(str) {
  const s = String(str).trim();
  if (!s) return 'Agent';
  return s.charAt(0).toUpperCase() + s.slice(1);
}
