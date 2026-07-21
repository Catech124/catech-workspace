#!/usr/bin/env node

// ─── bridge.mjs — Telegram ↔ Herdr bidirectional bridge (CLI polling) ─
//
// Instead of connecting to herdr's socket API (which uses platform-specific
// named pipes on Windows), this bridge polls `herdr agent list` every few
// seconds to detect agent status changes.
//
// Usage:
//   node bridge.mjs              # Run in foreground (debug)
//   bridge                       # Start in background (via bridge.bat)
//   stop-bridge                  # Stop (via stop-bridge.bat)
//   node bridge.mjs --status     # Check if running (PID)
//
// Environment (.env):
//   TELEGRAM_BOT_TOKEN    - Bot token from @BotFather
//   TELEGRAM_CHAT_ID      - Your Telegram chat ID
//   NOTIFY_ON_BLOCKED     - Notify when agent gets blocked (default: 1)
//   NOTIFY_ON_WORKING     - Notify when agent starts working (default: 0)
//   NOTIFY_ON_COMPLETE    - Notify when agent finishes a work cycle (default: 1)
//   BLOCKED_PREVIEW_LINES - Lines of context to show when blocked (default: 15)
//   POLL_INTERVAL_MS      - How often to poll herdr agent list (default: 3000)

import { existsSync, readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import {
  loadDotEnv,
  envBool, envStr, envInt,
  log, warn, err,
  writePid, removePid, isStopRequested, clearStopFile,
  pidPath, stopFilePath, bridgeDataDir,
  sendToPane, readPane, getAgents,
  agentStart, runInPane,
  tgSendMessage, tgSendPhoto, tgGetUpdates, tgDownloadPhoto,
  getFreebuffState,
  escapeHtml, titleCase,
} from './lib.mjs';

// ─── State ──────────────────────────────────────────────────────────

const state = {
  token: '',
  chatId: '',
  // agent_id -> { status, agent, pane_id, workspace, tab }
  agents: new Map(),
  // pane_id -> { lastLogState, lastAskUser } for Freebuff log detection
  freebuffLogs: new Map(),
  blockedPanes: new Map(),  // paneId -> { agent, workspace, tab }
  workCycles: new Map(),    // paneId -> { workingSince: timestamp, agent: string }
  targetAgent: null,        // { paneId, agent } — agent selected for messaging
  stopRequested: false,
  telegramOffset: 0,
  healthServer: null,
  herdrOk: false,
};

// ─── Herdr Agent Polling ───────────────────────────────────────────

async function pollHerdrAgents() {
  const interval = envInt('POLL_INTERVAL_MS', 3000);

  while (!state.stopRequested) {
    try {
      const agents = await getAgents();

      // null = herdr not available, [] = herdr running but no agents, [...] = agents found
      if (agents === null) {
        // herdr CLI not found or errored
        if (state.herdrOk) {
          warn('Lost connection to herdr — is it still running?');
        }
        state.herdrOk = false;
      } else if (Array.isArray(agents) && agents.length === 0) {
        // herdr is running but has no agents
        state.herdrOk = true;
      } else if (Array.isArray(agents)) {
        state.herdrOk = true;
        for (const a of agents) {
          const agentId = a.agent_id || a.pane_id || a.label;
          const paneId = a.pane_id;
          const status = a.agent_status || 'unknown';
          const agent = titleCase(a.agent || a.label || 'agent');

          if (!agentId || !paneId) continue;

          const prev = state.agents.get(agentId);
          const prevStatus = prev?.status;

          // Update known state
          state.agents.set(agentId, {
            status,
            agent,
            paneId,
            workspace: a.workspace_id || a.workspace_label || '',
            tab: a.tab_label || '',
          });

          // Detect status transitions
          if (prevStatus !== status) {
            log(`Agent "${agent}" (${paneId}): ${prevStatus || '?'} → ${status}`);

            if (status === 'blocked') {
              state.blockedPanes.set(paneId, {
                agent,
                paneId,
                workspace: a.workspace_id || a.workspace_label || '',
                tab: a.tab_label || '',
                timestamp: Date.now(),
              });
              // Clear any stale work cycle (blocked means agent is waiting for input)
              state.workCycles.delete(paneId);
              if (envBool('NOTIFY_ON_BLOCKED', true)) {
                await notifyBlocked(paneId, agent, a);
              }
            } else if (status === 'working') {
              // Agent started working — track the work cycle
              state.blockedPanes.delete(paneId);
              state.workCycles.set(paneId, { workingSince: Date.now(), agent });
              if (envBool('NOTIFY_ON_WORKING', false)) {
                await notifyWorking(paneId, agent, a);
              }
            } else if (status === 'done') {
              // Agent explicitly reported "done" by herdr — work cycle complete
              state.blockedPanes.delete(paneId);
              const cycle = state.workCycles.get(paneId);
              state.workCycles.delete(paneId);
              if (envBool('NOTIFY_ON_COMPLETE', true)) {
                await notifyWorkComplete(paneId, agent, a, cycle);
              }
            } else if (status === 'idle') {
              state.blockedPanes.delete(paneId);
              // If agent was working, this is a natural work completion (working → idle)
              const cycle = state.workCycles.get(paneId);
              if (cycle) {
                state.workCycles.delete(paneId);
                if (envBool('NOTIFY_ON_COMPLETE', true)) {
                  await notifyWorkComplete(paneId, agent, a, cycle);
                }
              }
            }
          }
        }
      }
    } catch (e) {
      if (state.herdrOk) {
        warn('herdr polling error:', e.message);
        state.herdrOk = false;
      }
    }

    // Wait before next poll (check stop file during sleep)
    for (let i = 0; i < Math.ceil(interval / 500); i++) {
      if (state.stopRequested || isStopRequested()) break;
      await sleep(500);
    }
    if (isStopRequested() && !state.stopRequested) {
      log('Stop file detected, shutting down...');
      state.stopRequested = true;
      break;
    }
  }
}

// ─── Notifications ─────────────────────────────────────────────────

async function notifyBlocked(paneId, agent, data) {
  try {
    const contextParts = [];
    if (data.workspace_label) contextParts.push(`📁 ${data.workspace_label}`);
    if (data.tab_label && data.tab_label !== data.workspace_label) {
      contextParts.push(`📑 ${data.tab_label}`);
    }
    const contextLine = contextParts.length ? `└─ ${contextParts.join(' · ')}` : '';

    const previewLines = envInt('BLOCKED_PREVIEW_LINES', 15);
    const output = await readPane(paneId, previewLines);
    const preview = output
      ? `\n\n<b>Último output:</b>\n<pre>${escapeHtml(output.slice(0, 1200))}</pre>`
      : '';

    const parts = [
      `🤖 <b>${escapeHtml(agent)}</b> está esperando tu respuesta`,
    ];
    if (contextLine) parts.push(`📍 ${contextLine}`);
    if (preview) parts.push('', '<b>Último output:</b>', preview);
    parts.push('', '💬 <i>Respondé a este mensaje para contestarle</i>');
    const message = parts.join('\n');

    await tgSendMessage(state.token, state.chatId, message);

    const entry = state.blockedPanes.get(paneId);
    if (entry) entry.lastNotified = Date.now();

    log(`Notified blocked "${agent}" (${paneId})`);
  } catch (e) {
    warn('Failed to notify blocked:', e.message);
  }
}

async function notifyWorking(paneId, agent, data) {
  try {
    const ctx = [data.workspace_label, data.tab_label].filter(Boolean);
    const ctxStr = ctx.length ? ` (${ctx.join(' · ')})` : '';
    const message = `🔄 <b>${escapeHtml(agent)}</b> está trabajando${ctxStr ? escapeHtml(ctxStr) : ''}...`;
    await tgSendMessage(state.token, state.chatId, message);
    log(`Notified working "${agent}" (${paneId})`);
  } catch (e) {
    warn('Failed to notify working:', e.message);
  }
}

async function notifyWorkComplete(paneId, agent, data, cycle) {
  try {
    const ctx = [data.workspace_label, data.tab_label].filter(Boolean);
    const ctxStr = ctx.length ? ` (${ctx.join(' · ')})` : '';
    
    let duration = '';
    if (cycle?.workingSince) {
      const elapsed = Math.round((Date.now() - cycle.workingSince) / 1000);
      if (elapsed >= 60) {
        duration = ` ⏱️ ${Math.floor(elapsed / 60)}m ${elapsed % 60}s`;
      } else {
        duration = ` ⏱️ ${elapsed}s`;
      }
    }
    
    const message = `✅ <b>${escapeHtml(agent)}</b> terminó${escapeHtml(ctxStr)}${duration}`;
    await tgSendMessage(state.token, state.chatId, message);
    log(`Notified complete "${agent}" (${paneId})${duration}`);
  } catch (e) {
    warn('Failed to notify complete:', e.message);
  }
}

// ─── Freebuff Log State Polling ───────────────────────────────────

async function pollFreebuffLogs() {
  const interval = envInt('FREEBUFF_LOG_POLL_MS', 2000);
  
  while (!state.stopRequested) {
    try {
      // Check each known freebuff agent's log
      for (const [agentId, agent] of state.agents) {
        const agentName = (agent.agent || '').toLowerCase();
        if (!agentName.startsWith('freebuff')) continue;
        
        // Determine account HOME dir based on agent name
        let accountHome = null;
        const numMatch = agentName.match(/freebuff[ -]*(\d+)/i);
        if (numMatch && numMatch[1] !== '1') {
          accountHome = `${process.env.HOME}/.freebuff-account${numMatch[1]}`;
        }
        
        const fbState = getFreebuffState(accountHome);
        if (!fbState) continue;
        
        const prev = state.freebuffLogs.get(agent.paneId) || {};
        
        // DETECT: ask_user tool call (agent is asking a question with timeout)
        if (fbState.state === 'question' && prev.lastAskUser !== fbState.timestamp) {
          state.freebuffLogs.set(agent.paneId, {
            ...prev,
            lastAskUser: fbState.timestamp,
            lastLogState: fbState.state,
          });
          
          if (envBool('NOTIFY_ON_QUESTION', true)) {
            const question = fbState.question || 'Question';
            const header = fbState.header ? ` (${fbState.header})` : '';
            const opts = fbState.options?.length 
              ? `\n<b>Options:</b> ${fbState.options.join(', ')}` 
              : '';
            
            await tgSendMessage(state.token, state.chatId, [
              `❓ <b>${escapeHtml(agent.agent)}</b> te pregunta${escapeHtml(header)}:`,
              '',
              `<i>${escapeHtml(question.slice(0, 500))}</i>`,
              opts,
              '',
              '💬 <i>Respondé a este mensaje para contestarle</i>',
            ].filter(Boolean).join('\n'));
            
            // Auto-target this agent for response
            state.targetAgent = { paneId: agent.paneId, agent: agent.agent };
            
            log(`Question from "${agent.agent}": ${question.slice(0, 80)}`);
          }
          continue;
        }
        
        // DETECT: working/executing → idle transition (agent finished, may need input)
        const wasWorking = prev.lastLogState === 'working' || prev.lastLogState === 'executing';
        const isNowIdle = fbState.state === 'idle';
        
        if (wasWorking && isNowIdle && prev.lastLogState !== 'idle') {
          state.freebuffLogs.set(agent.paneId, {
            ...prev,
            lastLogState: fbState.state,
            lastAskUser: prev.lastAskUser,
          });
          
          if (envBool('NOTIFY_ON_COMPLETE', true)) {
            const iter = fbState.iteration || '?';
            await tgSendMessage(state.token, state.chatId, [
              `✅ <b>${escapeHtml(agent.agent)}</b> terminó (step ${iter})`,
              '',
              '💬 <i>¿Necesita algo más? Escribile directamente.</i>',
            ].join('\n'));
            
            // Auto-target for follow-up
            state.targetAgent = { paneId: agent.paneId, agent: agent.agent };
            
            log(`Agent "${agent.agent}" completed step ${iter}`);
          }
          continue;
        }
        
        // Update tracked state
        if (prev.lastLogState !== fbState.state) {
          state.freebuffLogs.set(agent.paneId, {
            ...prev,
            lastLogState: fbState.state,
            lastAskUser: prev.lastAskUser,
          });
        }
      }
    } catch (e) {
      // Best-effort — don't crash the bridge
    }
    
    // Wait before next poll
    for (let i = 0; i < Math.ceil(interval / 500); i++) {
      if (state.stopRequested || isStopRequested()) break;
      await sleep(500);
    }
    if (isStopRequested() && !state.stopRequested) {
      state.stopRequested = true;
      break;
    }
  }
}

// ─── Telegram Polling ──────────────────────────────────────────────

async function pollTelegram() {
  if (!state.token || !state.chatId) {
    warn('TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not configured');
    return;
  }

  log('Starting Telegram polling...');

  while (!state.stopRequested) {
    try {
      const data = await tgGetUpdates(state.token, state.telegramOffset, 30);

      if (data.ok && data.result?.length > 0) {
        for (const update of data.result) {
          await handleTelegramUpdate(update);
          state.telegramOffset = (update.update_id || state.telegramOffset) + 1;
        }
      }
    } catch (e) {
      if (e.name === 'AbortError' || e.message?.includes('timed out')) {
        // Expected timeout from long polling, just loop
        continue;
      }
      warn('Telegram polling error:', e.message);
      await sleep(3000);
    }

    // Check stop file periodically
    if (isStopRequested()) {
      log('Stop file detected, shutting down...');
      state.stopRequested = true;
      break;
    }
  }

  log('Telegram polling stopped');
}

async function handleTelegramUpdate(update) {
  const msg = update.message;
  if (!msg) return;

  const chatId = String(msg.chat?.id);
  const text = (msg.text || msg.caption || '').trim();
  const isPrivate = msg.chat?.type === 'private';
  const isAuthorized = chatId === state.chatId;

  // Unauthorized access
  if (!isAuthorized) {
    if (isPrivate) {
      await tgSendMessage(state.token, chatId, '⛔ No estás autorizado a usar este bot.');
    }
    return;
  }

  // Commands
  if (text.startsWith('/')) {
    await handleCommand(text, chatId);
    return;
  }

  // ── Route message to agent ──────────────────────────────────────
  // Priority: 1) blocked agent (urgent), 2) target agent (manual selection)

  let destAgent = null;

  // First priority: a blocked agent
  if (state.blockedPanes.size > 0) {
    let latestTime = 0;
    for (const [pId, entry] of state.blockedPanes) {
      if ((entry.lastNotified || 0) > latestTime) {
        latestTime = entry.lastNotified || 0;
        destAgent = { paneId: pId, agent: entry.agent };
      }
    }
  }

  // Second priority: a target agent (manually selected by user)
  if (!destAgent && state.targetAgent) {
    destAgent = state.targetAgent;
  }

  // No agent available
  if (!destAgent) {
    const lines = [
      '🤷 No hay agentes bloqueados ni seleccionados.',
      '',
      'Usá /target &lt;nombre&gt; para elegir un agente y hablar con él.',
      'O usá /agents para ver los disponibles.',
    ];
    await tgSendMessage(state.token, chatId, lines.join('\n'));
    return;
  }

  // ── Photo handling ────────────────────────────────────────────────
  if (msg.photo) {
    const largest = msg.photo[msg.photo.length - 1];
    const caption = msg.caption?.trim() || '';
    try {
      const tempDir = join(bridgeDataDir(), 'photos');
      const localPath = await tgDownloadPhoto(state.token, largest.file_id, tempDir);
      const agentMsg = caption
        ? `📸 El usuario dice: ${caption}\n(imagen: ${localPath})`
        : `📸 Imagen del usuario (${localPath})`;
      await sendToPane(destAgent.paneId, agentMsg);
      await tgSendMessage(state.token, chatId,
        `📸 Imagen enviada a <b>${escapeHtml(destAgent.agent)}</b>`);
      log(`Photo sent to "${destAgent.agent}" (${destAgent.paneId})`);
    } catch (e) {
      warn('Photo error:', e.message);
      await tgSendMessage(state.token, chatId, `⚠️ Error: ${escapeHtml(e.message)}`);
    }
    return;
  }

  // ── Text to agent ────────────────────────────────────────────────
  if (text) {
    try {
      await sendToPane(destAgent.paneId, text);

      // Wait for agent to process, then read output
      await sleep(2000);
      const output = await readPane(destAgent.paneId, 30);
      const preview = output
        ? `<pre>${escapeHtml(output.slice(0, 2000))}</pre>`
        : '';

      const response = [
        `✉️ Mensaje enviado a <b>${escapeHtml(destAgent.agent)}</b>`,
        preview ? `\n<b>Respuesta:</b>\n${preview}` : '',
        state.targetAgent
          ? '\n💬 Seguí escribiendo para enviarle más mensajes'
          : '',
      ].filter(Boolean).join('\n');

      await tgSendMessage(state.token, chatId, response);
      log(`Sent to "${destAgent.agent}": "${text.slice(0, 60)}..."`);
    } catch (e) {
      warn('Send error:', e.message);
      await tgSendMessage(state.token, chatId, `⚠️ Error: ${escapeHtml(e.message)}`);
    }
  }
}

// ─── Commands ──────────────────────────────────────────────────────

async function handleCommand(text, chatId) {
  const cmd = text.split(/\s+/)[0].toLowerCase();

  switch (cmd) {
    case '/start':
    case '/help':
      const targetInfo = state.targetAgent
        ? `\n🎯 <b>Target activo:</b> ${escapeHtml(state.targetAgent.agent)}`
        : '\n🎯 <b>Sin target.</b> Usá /target &lt;nombre&gt; para elegir uno.';
      await tgSendMessage(state.token, chatId, [
        '🤖 <b>Herdr Telegram Bridge</b>',
        '',
        'Terminal remota para tus agentes de herdr.',
        '',
        '<b>Chat con agentes:</b>',
        '/target &lt;nombre&gt; — Elegir agente para hablar',
        '/agents — Listar agentes disponibles',
        '/output — Leer output del agente target',
        '/cancel — Dejar de apuntar al agente actual',
        '/talk &lt;nombre&gt; — Igual que /target',
        '',
        '<b>Iniciar agentes:</b>',
        '/start &lt;agente&gt; — Iniciar freebuff, pi, opencode, etc.',
        '',
        '<b>Control del bridge:</b>',
        '/bridge start — Info para iniciar el bridge',
        '/bridge status — Estado del bridge',
        '/bridge restart — Reiniciar el bridge',
        '/bridge stop — Detener el bridge',
        '/autostart on/off — Auto-arranque al iniciar Windows',
        '',
        '<b>Info:</b>',
        '/status — Estado general',
        '/help — Este mensaje',
        '',
        '<b>Uso normal:</b>',
        '1. Iniciá un agente: /start pi',
        '2. Elegí el agente: /target pi',
        '3. Escribí cualquier texto → se lo envía al agente',
        '4. Te responde con el output',
        '5. Mandá fotos para compartirlas',
        '6. Cuando un agente se bloquea te llega notificación automática',
        targetInfo,
      ].join('\n'));
      break;

    case '/status': {
      const lines = [
        '📊 <b>Estado del Bridge</b>',
        '',
        `🔌 herdr: ${state.herdrOk ? '✅ Conectado' : '❌ Sin conexión'}`,
        '📡 Telegram: ✅ Escuchando',
        `🧩 Agentes: ${state.agents.size}`,
        `⚠️ Bloqueados: ${state.blockedPanes.size}`,
      ];
      if (state.targetAgent) {
        lines.push(`🎯 Target: ${escapeHtml(state.targetAgent.agent)}`);
      }
      if (state.blockedPanes.size > 0) {
        lines.push('', '<b>Bloqueados:</b>');
        for (const [pId, e] of state.blockedPanes) {
          lines.push(`• ${escapeHtml(e.agent)} (${pId})`);
        }
      }
      await tgSendMessage(state.token, chatId, lines.join('\n'));
      break;
    }

    case '/list':
    case '/agents': {
      try {
        const agents = await getAgents();
        const lines = ['🤖 <b>Agentes en herdr</b>', ''];
        if (Array.isArray(agents) && agents.length > 0) {
          for (const a of agents) {
            const name = a.agent || a.label || a.pane_id || '?';
            const s = a.agent_status || 'unknown';
            const emoji = s === 'blocked' ? '⚠️' : s === 'working' ? '🔄' : s === 'done' ? '✅' : '💤';
            const isTarget = state.targetAgent && state.targetAgent.paneId === a.pane_id;
            lines.push(`${emoji} <b>${escapeHtml(titleCase(name))}</b> (${s})${isTarget ? ' 🎯 TARGET' : ''}`);
            if (a.workspace_id) lines.push(`   📁 ${a.workspace_id}`);
          }
          lines.push('', `Usá /target &lt;nombre&gt; para seleccionar uno.`);
        } else {
          lines.push('No se encontraron agentes.');
        }
        await tgSendMessage(state.token, chatId, lines.join('\n'));
      } catch (e) {
        await tgSendMessage(state.token, chatId, `⚠️ Error: ${escapeHtml(e.message)}`);
      }
      break;
    }

    case '/blocked':
      if (state.blockedPanes.size === 0) {
        await tgSendMessage(state.token, chatId, '✅ No hay agentes bloqueados.');
        return;
      }
      const blines = ['⚠️ <b>Agentes bloqueados:</b>', ''];
      for (const [pId, e] of state.blockedPanes) {
        blines.push(`• ${escapeHtml(e.agent)} (${pId})`);
        if (e.workspace) blines.push(`  📁 ${e.workspace}`);
      }
      await tgSendMessage(state.token, chatId, blines.join('\n'));
      break;

    case '/target':
    case '/talk': {
      const name = text.split(/\s+/).slice(1).join(' ').trim().toLowerCase();
      if (!name) {
        await tgSendMessage(state.token, chatId,
          'Usá: /target &lt;nombre&gt;\nEj: /target freebuff\n\nAgentes disponibles:\n' +
          [...state.agents.values()].map(a => `• ${escapeHtml(a.agent)} (${a.status})`).join('\n'));
        return;
      }
      // Find agent by name (case-insensitive partial match)
      let found = null;
      for (const a of state.agents.values()) {
        if (a.agent.toLowerCase().includes(name) || a.paneId.toLowerCase().includes(name)) {
          found = a;
          break;
        }
      }
      if (!found) {
        // Try via CLI
        try {
          const agents = await getAgents();
          if (Array.isArray(agents)) {
            for (const a of agents) {
              const agentName = (a.agent || a.label || '').toLowerCase();
              if (agentName.includes(name)) {
                found = { paneId: a.pane_id, agent: titleCase(a.agent || a.label) };
                break;
              }
            }
          }
        } catch {}
      }
      if (!found) {
        await tgSendMessage(state.token, chatId,
          `❌ No encontré un agente que se llame "${escapeHtml(name)}".\nUsá /agents para ver los disponibles.`);
        return;
      }
      state.targetAgent = { paneId: found.paneId, agent: found.agent };
      await tgSendMessage(state.token, chatId, [
        `🎯 <b>Target seleccionado:</b> ${escapeHtml(found.agent)}`,
        `📁 ${found.workspace || found.paneId}`,
        '',
        'Ahora cualquier mensaje que me mandes se lo enviaré a este agente.',
        'Usá /cancel para dejar de apuntarle.',
      ].join('\n'));
      log(`Target set: ${found.agent} (${found.paneId})`);
      break;
    }

    case '/cancel':
    case '/stop': {
      const was = state.targetAgent?.agent || 'none';
      state.targetAgent = null;
      await tgSendMessage(state.token, chatId,
        `❌ Target eliminado. Ya no apunto a <b>${escapeHtml(was)}</b>.`);
      log('Target cancelled');
      break;
    }

    case '/output':
    case '/read': {
      if (!state.targetAgent) {
        await tgSendMessage(state.token, chatId,
          'Primero seleccioná un agente con /target &lt;nombre&gt;.');
        return;
      }
      try {
        const output = await readPane(state.targetAgent.paneId, 30);
        if (!output) {
          await tgSendMessage(state.token, chatId,
            `📭 <b>${escapeHtml(state.targetAgent.agent)}</b> no tiene output reciente.`);
          return;
        }
        const msg = `📟 <b>Output de ${escapeHtml(state.targetAgent.agent)}:</b>\n<pre>${escapeHtml(output.slice(0, 3000))}</pre>`;
        await tgSendMessage(state.token, chatId, msg);
      } catch (e) {
        await tgSendMessage(state.token, chatId, `⚠️ Error: ${escapeHtml(e.message)}`);
      }
      break;
    }

    case '/start':
    case '/launch': {
      const name = text.split(/\s+/).slice(1).join(' ').trim().toLowerCase();
      if (!name) {
        await tgSendMessage(state.token, chatId, [
          'Usá: /start &lt;agente&gt;',
          '',
          'Agentes disponibles:',
          '• freebuff — Freebuff AI (cuenta #1)',
          '• freebuff-2 — Freebuff AI (cuenta #2)',
          '• freebuff-3 — Freebuff AI (cuenta #3)',
          '• freebuff-4 — Freebuff AI (cuenta #4)',
          '• pi — Pi agent',
          '• opencode — OpenCode',
          '• codex — Codex CLI',
          '• claude — Claude Code',
          '',
          'Ej: /start pi   o   /start freebuff-2',
        ].join('\n'));
        return;
      }

      const known = {
        freebuff:  { exec: 'freebuff',  args: [] },
        pi:        { exec: 'pi',        args: [] },
        opencode:  { exec: 'opencode',  args: [] },
        codex:     { exec: 'codex',     args: [] },
        claude:    { exec: 'claude',    args: [] },
      };

      // Detect freebuff agents by prefix (freebuff, freebuff-2, freebuff3, etc.)
      // Derive correct script name: freebuff-2 -> freebuff2, freebuff3 -> freebuff3
      let match = null;
      let execOverride = null;
      if (name.startsWith('freebuff')) {
        match = 'freebuff';
        execOverride = name.replace(/-/g, '');  // strip hyphens for script name
      }
      if (!match) {
        match = Object.keys(known).find(k => k.includes(name) || name.includes(k));
      }
      if (!match) {
        await tgSendMessage(state.token, chatId,
          `❌ No conozco el agente "${escapeHtml(name)}". Usá /start sin argumentos para ver los disponibles.`);
        return;
      }

      const info = { ...known[match], exec: execOverride || known[match].exec };
      await tgSendMessage(state.token, chatId, `🔄 Iniciando <b>${escapeHtml(match)}</b>...`);

      try {
        const result = await agentStart(match, info.exec, info.args);
        const ok = typeof result === 'object' ? (result.ok || result.success || true) : true;
        if (ok) {
          await tgSendMessage(state.token, chatId,
            `✅ <b>${escapeHtml(match)}</b> iniciado correctamente.\nUsá /target ${escapeHtml(match)} para hablar con él.`);
          log(`Agent started: ${match}`);
        } else {
          await tgSendMessage(state.token, chatId,
            `⚠️ ${escapeHtml(match)} iniciado pero con respuesta inesperada. Revisá herdr.`);
        }
      } catch (e) {
        await tgSendMessage(state.token, chatId,
          `❌ Error al iniciar ${escapeHtml(match)}: ${escapeHtml(e.message)}`);
      }
      break;
    }

    case '/bridge': {
      const sub = text.split(/\s+/)[1]?.toLowerCase();

      if (sub === 'start') {
        // Si recibimos este comando, el bridge YA está corriendo (porque recibió el mensaje)
        await tgSendMessage(state.token, chatId, [
          '✅ <b>El bridge ya está en ejecución</b>',
          'Si recibiste este mensaje, el bridge está activo.',
          '',
          'Usá /bridge restart — Para reiniciarlo',
          'Usá /bridge stop — Para detenerlo',
          'Usá /autostart on — Para que arranque solo al iniciar Windows',
          '',
          '📝 <b>Nota:</b> No se puede iniciar el bridge desde Telegram si está caído.',
          '   El auto-arranque (Task Scheduler) es la solución para que siempre esté disponible.',
        ].join('\n'));
        return;
      }

      if (sub === 'stop' || sub === 'off') {
        await tgSendMessage(state.token, chatId, '🛑 Deteniendo bridge...');
        log('Bridge stop requested via Telegram');
        // Signal shutdown via stop file
        try { writeFileSync(stopFilePath(), 'stop\n', 'utf8'); } catch {}
        state.stopRequested = true;
        // Give time for the message to be sent before exiting
        await sleep(1000);
        removePid();
        process.exit(0);
      }

      if (sub === 'restart' || sub === 'reload') {
        await tgSendMessage(state.token, chatId, '🔄 Reiniciando bridge...');
        log('Bridge restart requested via Telegram');
        // Spawn a new instance, then exit
        const { spawn } = await import('node:child_process');
        const child = spawn(process.argv[0], [process.argv[1]], {
          cwd: process.cwd(),
          stdio: 'ignore',
          detached: true,
          windowsHide: true,
        });
        child.unref();
        await sleep(1000);
        removePid();
        process.exit(0);
      }

      if (sub === 'status' || !sub) {
        const hasAutostart = existsSync(join(bridgeDataDir(), 'autostart.flag'));
        await tgSendMessage(state.token, chatId, [
          '🖥️ <b>Bridge Control</b>',
          '',
          '/bridge start — Info sobre cómo iniciar el bridge',
          '/bridge status — Este mensaje',
          '/bridge restart — Reiniciar el bridge',
          '/bridge stop — Detener el bridge',
          '',
          `PID: ${process.pid}`,
          `Uptime: ${Math.floor((Date.now() - startTime) / 1000)}s`,
          `herdr: ${state.herdrOk ? '✅' : '❌'}`, // trailing backtick
          `Auto-arranque: ${hasAutostart ? '✅ Instalado' : '❌ No instalado'}`,
          '',
          '💡 Usá /autostart on para que arranque solo al iniciar Windows.',
        ].join('\n'));
        return;
      }

      await tgSendMessage(state.token, chatId,
        `❓ Subcomando desconocido: ${escapeHtml(sub)}. Usá /bridge status.`);
      break;
    }

    case '/autostart': {
      const sub = text.split(/\s+/)[1]?.toLowerCase() || 'status';

      if (sub === 'on' || sub === 'install') {
        await tgSendMessage(state.token, chatId, [
          '🔄 Instalando auto-arranque...',
          '',
          '📌 <b>Importante:</b> Se necesita permisos de Administrador.',
          '   Vas a ver una ventana de UAC — aceptala para continuar.',
          '',
          '⏳ Procesando...',
        ].join('\n'));

        try {
          const scriptPath = join(bridgeDataDir(), 'install-autostart.ps1');
          if (!existsSync(scriptPath)) {
            throw new Error('Script install-autostart.ps1 no encontrado');
          }

          const result = spawnSync('powershell.exe', [
            '-NoProfile', '-ExecutionPolicy', 'Bypass',
            '-File', scriptPath,
          ], {
            encoding: 'utf8',
            timeout: 30000,
            windowsHide: false, // Show window for UAC
          });

          if (result.status === 0) {
            writeFileSync(join(bridgeDataDir(), 'autostart.flag'), '1\n', 'utf8');
            await tgSendMessage(state.token, chatId, [
              '✅ <b>Auto-arranque instalado correctamente</b>',
              '',
              'El bridge arrancará automáticamente cuando iniciés sesión en Windows.',
              '',
              '💡 <b>Probá ahora:</b> cerrá sesión y volvé a entrar,',
              '   o ejecutalo manualmente con /bridge start.',
            ].join('\n'));
            log('Autostart installed');
          } else {
            const errMsg = result.stderr?.trim() || result.stdout?.trim() || 'Error desconocido';
            throw new Error(errMsg.slice(0, 500));
          }
        } catch (e) {
          await tgSendMessage(state.token, chatId,
            `❌ Error al instalar auto-arranque: ${escapeHtml(e.message)}`);
          warn('Autostart install failed:', e.message);
        }
        return;
      }

      if (sub === 'off' || sub === 'remove' || sub === 'uninstall') {
        try {
          const scriptPath = join(bridgeDataDir(), 'install-autostart.ps1');
          const result = spawnSync('powershell.exe', [
            '-NoProfile', '-ExecutionPolicy', 'Bypass',
            '-File', scriptPath, '-Uninstall',
          ], {
            encoding: 'utf8',
            timeout: 15000,
            windowsHide: false,
          });

          try { unlinkSync(join(bridgeDataDir(), 'autostart.flag')); } catch {}

          if (result.status === 0) {
            await tgSendMessage(state.token, chatId,
              '✅ <b>Auto-arranque desinstalado.</b> El bridge ya no arrancará solo al iniciar Windows.');
            log('Autostart uninstalled');
          } else {
            await tgSendMessage(state.token, chatId,
              `⚠️ Comando ejecutado, pero puede haber errores: ${escapeHtml(result.stderr?.slice(0, 300) || '')}`);
          }
        } catch (e) {
          await tgSendMessage(state.token, chatId,
            `❌ Error: ${escapeHtml(e.message)}`);
        }
        return;
      }

      // Default: show status
      const hasFlag = existsSync(join(bridgeDataDir(), 'autostart.flag'));
      const lines = [
        '🔄 <b>Auto-arranque del Bridge</b>',
        '',
        `/autostart on  — Instalar (arranca al iniciar Windows)`,
        `/autostart off — Desinstalar`,
        '',
        `Estado: ${hasFlag ? '✅ Instalado' : '❌ No instalado'}`,
      ];

      if (hasFlag) {
        // Also check via schtasks
        try {
          const checkResult = spawnSync('schtasks', [
            '/query', '/tn', 'Herdr/HerdrTelegramBridge', '/fo', 'LIST', '/v',
          ], { encoding: 'utf8', timeout: 5000 });
          if (checkResult.status === 0) {
            const taskStatus = checkResult.stdout.match(/Estado:\s*(.+)/)?.[1]?.trim() || 'Desconocido';
            lines.push(`Tarea programada: ${taskStatus}`);
          }
        } catch {}
      }

      await tgSendMessage(state.token, chatId, lines.join('\n'));
      break;
    }
  }
}

// ─── Health Server (optional) ──────────────────────────────────────

async function startHealthServer() {
  const port = envInt('HEALTH_PORT', 0);
  if (!port) return;
  const http = await import('node:http');
  state.healthServer = http.createServer((req, res) => {
    if (req.url === '/health') {
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({
        herdr: state.herdrOk,
        agents: state.agents.size,
        blocked: state.blockedPanes.size,
        uptime: Math.floor((Date.now() - startTime) / 1000),
      }));
    } else {
      res.writeHead(404);
      res.end();
    }
  });
  state.healthServer.listen(port, () => log(`Health server on port ${port}`));
}

let startTime = Date.now();

// ─── Shutdown ──────────────────────────────────────────────────────

async function shutdown(signal) {
  if (state.stopRequested) return;
  state.stopRequested = true;
  log(`Shutting down (${signal})...`);

  if (state.healthServer) {
    try { state.healthServer.close(); } catch {}
  }
  removePid();
  log('Bridge stopped. Bye! 👋');
  process.exit(0);
}

function setupSignals() {
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('exit', () => removePid());
}

// ─── Main ──────────────────────────────────────────────────────────

async function main() {
  loadDotEnv();
  clearStopFile();

  // CLI commands
  const args = process.argv.slice(2);
  const cmd = args[0]?.toLowerCase();

  if (cmd === '--stop' || cmd === 'stop') {
    if (!existsSync(pidPath())) {
      console.log('Bridge is not running.');
      process.exit(0);
    }
    writeFileSync(stopFilePath(), 'stop\n', 'utf8');
    console.log('Stop signal sent.');
    process.exit(0);
  }

  if (cmd === '--status' || cmd === 'status') {
    if (existsSync(pidPath())) {
      console.log(`Bridge is running (PID: ${readFileSync(pidPath(), 'utf8').trim()})`);
    } else {
      console.log('Bridge is not running.');
    }
    process.exit(0);
  }

  if (cmd === '--daemon' || cmd === 'daemon') {
    // El daemon ahora se maneja desde start-bridge.bat / bridge.bat
    // que ejecutan 'node bridge.mjs' directamente (sin --daemon).
    // Este flag se mantiene por compatibilidad pero avisa al usuario.
    console.log('NOTICE: --daemon ya no se usa. Ejecutá "bridge" o "node bridge.mjs" directamente.');
    process.exit(0);
  }

  // Start
  log('╔══════════════════════════════════════════╗');
  log('║    Herdr ↔ Telegram Bridge v0.2.0       ║');
  log('╚══════════════════════════════════════════╝');

  state.token = envStr('TELEGRAM_BOT_TOKEN');
  state.chatId = envStr('TELEGRAM_CHAT_ID');

  if (!state.token || !state.chatId) {
    err('.env: TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID required');
    process.exit(1);
  }

  writePid();
  setupSignals();
  await startHealthServer();

  log(`Configured for chat: ${state.chatId}`);
  log('Starting Telegram polling + herdr agent polling...');

  // Run all polling loops concurrently
  await Promise.all([
    pollTelegram(),
    pollHerdrAgents(),
    pollFreebuffLogs(),
  ]);

  await shutdown('done');
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

main().catch(e => {
  err('Fatal:', e.message);
  process.exit(1);
});
