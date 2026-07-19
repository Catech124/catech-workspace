#!/usr/bin/env node

/**
 * validate-taste.js — Validador del Taste System (ADR 0006)
 *
 * Valida:
 *   - Formato de archivos .taste/<domain>/index.md (o taste.md legacy)
 *   - Metadatos (domain, confidence, updated, version)
 *   - Reglas individuales: `[id]` requerido, `(confidence: X.XX)` requerido
 *   - IDs duplicados dentro del mismo archivo
 *   - Claves de dominio en settings.json / settings.local.json
 *   - Estructura de overrides namespaced por dominio
 *
 * Uso:
 *   node tools/validate-taste.js              → Valida todo .taste/
 *   node tools/validate-taste.js --all        → Idem (detalle completo)
 *   node tools/validate-taste.js --package core → Valida solo un dominio
 *   node tools/validate-taste.js --fix        → Agrega [id] faltantes in-place
 *   node tools/validate-taste.js --stdout     → Solo salida de texto, sin colores
 *   node tools/validate-taste.js --quiet      → Solo errores, sin warnings
 */

const fs = require('fs');
const path = require('path');

const TASTE_DIR = path.join(__dirname, '..', '.taste');
const PROJECT_ROOT = path.join(__dirname, '..');

const REQUIRED_METADATA = ['domain', 'confidence', 'updated', 'version'];
const KNOWN_DOMAINS = new Set([
  'core', 'frontend', 'backend', 'nodes', 'animation', 'design', 'skills', 'tools', 'index'
]);

// Keys that mark a bullet as a pattern/anti-pattern descriptor (skip these)
const SKIP_KEYS = new Set(['trigger', 'action', 'rationale', 'description', 'why', 'instead']);

// ═══════════════════════════════════════════════════════════════════
// ═══ RULE PARSING ═══
// ═══════════════════════════════════════════════════════════════════

/**
 * Parse a markdown body and extract validation info from all bullets.
 *
 * Returns an array of { line, id, confidence, source, rawValue, issues } objects.
 * Each bullet's issues array contains { type: 'error'|'warning', message }.
 */
function parseBullets(body, filePath) {
  const bullets = [];
  const seenIds = new Map(); // id → line number for duplicate detection
  const lines = body.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Must start with "- " to be a bullet
    if (!trimmed.startsWith('- ')) continue;

    // Check if this is a section header line (e.g., "- **trigger:** ...")
    if (trimmed.match(/^-\s+\*\*\w+:\*\*/)) {
      const match = trimmed.match(/^-\s+\*\*(\w+):\*\*/);
      if (match && SKIP_KEYS.has(match[1].toLowerCase())) continue;
    }

    // Check for bold start (pattern/anti-pattern descriptors)
    if (/^-\s+\*\*/.test(trimmed) && !trimmed.includes('(confidence:')) continue;

    const issues = [];

    // Check for (confidence: X.XX) — required
    const confMatch = trimmed.match(/\(confidence:\s*([\d.]+)\)/);
    if (!confMatch) {
      issues.push({ type: 'error', message: 'Falta " (confidence: X.XX)" en la regla' });
    }

    let confidence = null;
    if (confMatch) {
      confidence = parseFloat(confMatch[1]);
      if (isNaN(confidence) || confidence < 0 || confidence > 1) {
        issues.push({ type: 'error', message: `confidence inválido: "${confMatch[1]}" — debe ser 0.0–1.0` });
      }
    }

    // Check for `[id]` — strongly recommended (only warn for bullets with (confidence:))
    const idMatch = trimmed.match(/`\[([\w-]+)\]`/);
    let id = idMatch ? idMatch[1] : null;
    if (!id && confMatch) {
      // Try to auto-generate a slug for the suggestion
      let rawValue = trimmed.replace(/^- /, '').replace(/`\[[\w-]+\]` /, '').replace(/\(confidence:\s*[\d.]+\)(?:\s*\/\/\s*\w+)?/, '').trim();
      const slug = slugifyRule(rawValue);
      issues.push({
        type: 'warning',
        message: `Falta \`[id]\` — sugerencia: \`[${slug}]\``
      });
      id = slug; // Use generated id for duplicate detection
    }

    // Check for duplicate IDs
    if (id && seenIds.has(id)) {
      issues.push({
        type: 'error',
        message: `ID duplicado \`[${id}]\` — también en línea ${seenIds.get(id)}`
      });
    }
    if (id && !seenIds.has(id)) {
      seenIds.set(id, i + 1); // 1-indexed line number
    }

    // Extract raw value (text minus id tag and confidence)
    let value = '';
    if (confMatch) {
      value = trimmed
        .replace(/^- /, '')
        .replace(/`\[[\w-]+\]`\s*/, '')
        .replace(/\s*\(confidence:\s*[\d.]+\)(\s*\/\/\s*\w+)?/, '')
        .trim();
    } else {
      value = trimmed.replace(/^- /, '').trim();
    }

    // Extract source if present
    const sourceMatch = trimmed.match(/\/\/\s*(\w+)/);
    const source = sourceMatch ? sourceMatch[1] : 'manual';

    // Always push the bullet, even without (confidence: X.XX), so the error reaches the report.
    // Pattern/anti-pattern descriptors are already filtered above by SKIP_KEYS.
    bullets.push({
      line: i + 1,
      id,
      confidence,
      source,
      value,
      issues,
      rawLine: trimmed
    });
  }

  return bullets;
}

/**
 * Generate a kebab-case slug from arbitrary text.
 */
function slugifyRule(text) {
  return text
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);
}

// ═══════════════════════════════════════════════════════════════════
// ═══ FILE PARSING ═══
// ═══════════════════════════════════════════════════════════════════

/**
 * Parse metadata from the "> **key:** value" frontmatter lines.
 */
function parseFrontmatter(content) {
  const metadata = {};
  const metaLines = content.match(/^> \*\*(\w+):\*\*\s*(.+)$/gm) || [];
  for (const line of metaLines) {
    const match = line.match(/> \*\*(\w+):\*\*\s*(.+)$/);
    if (match) metadata[match[1].toLowerCase()] = match[2].trim();
  }
  return metadata;
}

/**
 * Parse a single taste file and return validation results.
 */
function validateTasteFile(filePath, domainHint) {
  const errors = [];
  const warnings = [];
  const rules = [];

  if (!fs.existsSync(filePath)) {
    errors.push('Archivo no encontrado');
    return { errors, warnings, rules, metadata: {}, domain: domainHint || '?', sections: [] };
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  if (!content.trim()) {
    errors.push('Archivo vacío');
    return { errors, warnings, rules, metadata: {}, domain: domainHint || '?', sections: [] };
  }

  // 1. Parse title
  const titleMatch = content.match(/^# taste:\s*(\S+)/);
  const domain = titleMatch ? titleMatch[1] : (domainHint || '?');
  if (!titleMatch) {
    errors.push('Falta título "# taste: <domain>" al inicio');
  }

  // 2. Parse frontmatter metadata
  const metadata = parseFrontmatter(content);

  for (const key of REQUIRED_METADATA) {
    if (!metadata[key]) {
      errors.push(`Falta metadata requerida: "${key}"`);
    }
  }

  // Validate confidence
  if (metadata.confidence) {
    const conf = parseFloat(metadata.confidence);
    if (isNaN(conf) || conf < 0 || conf > 1) {
      errors.push(`confidence debe ser 0.0–1.0, se obtuvo: "${metadata.confidence}"`);
    }
  }

  // Validate updated format
  if (metadata.updated) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(metadata.updated)) {
      errors.push(`updated debe tener formato YYYY-MM-DD, se obtuvo: "${metadata.updated}"`);
    }
  }

  // 3. Check sections
  const sectionMatches = content.match(/^##\s+(preferences|patterns|anti-patterns|learned)$/gm) || [];
  const sections = sectionMatches.map(s => s.replace('## ', '').trim());

  if (!sections.includes('preferences')) {
    errors.push('Falta sección "## preferences"');
  }

  if (!sections.includes('patterns')) {
    warnings.push('No tiene sección "## patterns" (opcional pero recomendada)');
  }

  if (!sections.includes('anti-patterns')) {
    warnings.push('No tiene sección "## anti-patterns" (opcional pero recomendada)');
  }

  // 4. Extract body (everything after first ## section)
  const bodyMatch = content.match(/^##\s+.*$/m);
  const body = bodyMatch ? content.slice(bodyMatch.index).trim() : '';

  // 5. Parse bullets in the body
  const bullets = parseBullets(body, filePath);
  rules.push(...bullets);

  // Count rule-level errors and warnings
  for (const bullet of bullets) {
    for (const issue of bullet.issues) {
      if (issue.type === 'error') errors.push(`Línea ${bullet.line}: ${issue.message}`);
      else warnings.push(`Línea ${bullet.line}: ${issue.message}`);
    }
  }

  return { errors, warnings, rules, metadata, domain, sections };
}

// ═══════════════════════════════════════════════════════════════════
// ═══ SETTINGS VALIDATION ═══
// ═══════════════════════════════════════════════════════════════════

/**
 * Validate settings.json and settings.local.json files.
 */
function validateSettings(filePath, isLocal) {
  const errors = [];
  const warnings = [];
  const label = path.basename(filePath);

  if (!fs.existsSync(filePath)) {
    if (isLocal) {
      errors.push(`No existe ${label} (debe crearse como copia de settings.json)`);
    } else {
      errors.push(`No existe ${label}`);
    }
    return { errors, warnings, overrides: {} };
  }

  let parsed;
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    if (!raw.trim()) {
      errors.push(`${label}: archivo vacío`);
      return { errors, warnings, overrides: {} };
    }
    parsed = JSON.parse(raw);
  } catch (e) {
    errors.push(`${label}: JSON inválido — ${e.message}`);
    return { errors, warnings, overrides: {} };
  }

  // Validate required top-level keys
  if (!isLocal) {
    if (!parsed.tasteVersion) {
      errors.push(`${label}: falta "tasteVersion"`);
    }
  }

  // Warn if settings.local.json doesn't have overrides at all
  if (!("overrides" in parsed)) {
    warnings.push(`${label}: falta "overrides" — debería tener estructura namespaced: { "overrides": { "core": { ... }, "frontend": { ... } } }`);
  }

  // Validate overrides
  const overrides = parsed.overrides || {};

  if (typeof overrides !== 'object' || Array.isArray(overrides)) {
    errors.push(`${label}: "overrides" debe ser un objeto`);
    return { errors, warnings, overrides: {} };
  }

  for (const [domainKey, domainOverrides] of Object.entries(overrides)) {
    // Check if domain key is known
    if (!KNOWN_DOMAINS.has(domainKey)) {
      warnings.push(`${label}: dominio desconocido "${domainKey}" en overrides — debe ser uno de: ${[...KNOWN_DOMAINS].join(', ')}`);
    }

    // Validate each override entry
    if (typeof domainOverrides !== 'object' || domainOverrides === null || Array.isArray(domainOverrides)) {
      errors.push(`${label}: overrides["${domainKey}"] debe ser un objeto con entries por ruleId`);
      continue;
    }

    for (const [ruleId, ruleOverride] of Object.entries(domainOverrides)) {
      if (typeof ruleOverride !== 'object' || ruleOverride === null) {
        errors.push(`${label}: overrides["${domainKey}"]["${ruleId}"] debe ser un objeto { value?, confidence? }`);
        continue;
      }

      if (ruleOverride.confidence !== undefined) {
        const conf = ruleOverride.confidence;
        if (typeof conf !== 'number' || conf < 0 || conf > 1) {
          errors.push(`${label}: overrides["${domainKey}"]["${ruleId}"].confidence debe ser 0.0–1.0, se obtuvo: ${JSON.stringify(conf)}`);
        }
      }

      if (ruleOverride.value !== undefined && typeof ruleOverride.value !== 'string') {
        errors.push(`${label}: overrides["${domainKey}"]["${ruleId}"].value debe ser string, se obtuvo: ${typeof ruleOverride.value}`);
      }
    }
  }

  return { errors, warnings, overrides };
}

// ═══════════════════════════════════════════════════════════════════
// ═══ DIRECTORY SCANNING ═══
// ═══════════════════════════════════════════════════════════════════

/**
 * Find the taste file for a domain: index.md preferred, taste.md fallback.
 */
function findDomainFile(domain) {
  const dir = path.join(TASTE_DIR, domain);
  if (!fs.existsSync(dir)) return null;

  const indexPath = path.join(dir, 'index.md');
  if (fs.existsSync(indexPath)) return { path: indexPath, legacy: false };

  const tastePath = path.join(dir, 'taste.md');
  if (fs.existsSync(tastePath)) return { path: tastePath, legacy: true };

  return null;
}

/**
 * Scan all domain directories and the root index file.
 */
function scanTasteDir() {
  const results = [];

  if (!fs.existsSync(TASTE_DIR)) {
    console.error(`❌ No existe el directorio .taste/ en ${TASTE_DIR}`);
    process.exit(1);
  }

  // Root index file (taste.md at root)
  const rootIndexMd = path.join(TASTE_DIR, 'index.md');
  const rootTasteMd = path.join(TASTE_DIR, 'taste.md');

  if (fs.existsSync(rootIndexMd)) {
    const result = validateTasteFile(rootIndexMd, 'index');
    result.file = '.taste/index.md';
    result.legacy = false;
    results.push(result);
  } else if (fs.existsSync(rootTasteMd)) {
    const result = validateTasteFile(rootTasteMd, 'index');
    result.file = '.taste/taste.md';
    result.legacy = true;
    result.warnings.push('Archivo .taste/taste.md (legacy) — renombrar a index.md para ADR 0006');
    results.push(result);
  } else {
    results.push({
      file: '.taste/index.md',
      errors: ['No existe .taste/index.md ni .taste/taste.md (índice principal)'],
      warnings: [],
      rules: [],
      metadata: {},
      domain: 'index'
    });
  }

  // Scan subdirectories
  const entries = fs.readdirSync(TASTE_DIR, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name.startsWith('.') || entry.name === 'raw') continue;
    if (entry.name === 'node_modules') continue;

    const found = findDomainFile(entry.name);

    if (found) {
      const result = validateTasteFile(found.path, entry.name);
      result.file = path.join('.taste', entry.name, found.legacy ? 'taste.md' : 'index.md');
      result.legacy = found.legacy;
      if (found.legacy) {
        result.warnings.push(`Archivo ${entry.name}/taste.md (legacy) — renombrar a index.md para ADR 0006`);
      }
      results.push(result);
    } else {
      results.push({
        file: path.join('.taste', entry.name, 'index.md'),
        errors: [`No existe index.md ni taste.md en .taste/${entry.name}/`],
        warnings: [],
        rules: [],
        metadata: {},
        domain: entry.name
      });
    }
  }

  return results;
}

// ═══════════════════════════════════════════════════════════════════
// ═══ FIX MODE ═══
// ═══════════════════════════════════════════════════════════════════

/**
 * Auto-fix: add `[id]` tags to rules that don't have them.
 * Also renames taste.md → index.md.
 */
function fixFile(filePath, dryRun = true) {
  const changes = [];
  const content = fs.readFileSync(filePath, 'utf-8');
  let modified = content;
  let changed = false;

  // Fix 1: Add [id] tags
  const lines = modified.split('\n');
  const newLines = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Only process bullets with (confidence: X.XX) but without [id]
    if (trimmed.startsWith('- ') && trimmed.includes('(confidence:') && !trimmed.match(/`\[[\w-]+\]`/)) {
      // Extract text for slug
      let text = trimmed
        .replace(/^- /, '')
        .replace(/\s*\(confidence:\s*[\d.]+\)(\s*\/\/\s*\w+)?\s*$/, '')
        .trim();

      // Skip if it's a pattern/anti-pattern descriptor
      if (text.match(/^\*\*\w+:\*\*/)) {
        newLines.push(line);
        continue;
      }
      if (text.startsWith('**')) {
        newLines.push(line);
        continue;
      }

      const slug = slugifyRule(text);
      // Insert [id] before (confidence: …)
      const fixedLine = trimmed.replace(/(\s*)(\(confidence:)/, ` \`[${slug}]\`$1$2`);

      // Preserve original indentation
      const indent = line.match(/^\s*/)[0];
      newLines.push(indent + fixedLine);

      changes.push(`  Línea ${i + 1}: agregado \`[${slug}]\``);
      changed = true;
    } else {
      newLines.push(line);
    }
  }

  if (changed && !dryRun) {
    fs.writeFileSync(filePath, newLines.join('\n'), 'utf-8');
  }

  return { changes, changed };
}

/**
 * Auto-fix: rename taste.md → index.md in all domain directories.
 */
function fixRenameTasteMd(dryRun = true) {
  const changes = [];

  if (!fs.existsSync(TASTE_DIR)) return changes;

  const entries = fs.readdirSync(TASTE_DIR, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name.startsWith('.')) continue;

    const tastePath = path.join(TASTE_DIR, entry.name, 'taste.md');
    const indexPath = path.join(TASTE_DIR, entry.name, 'index.md');

    if (fs.existsSync(tastePath) && !fs.existsSync(indexPath)) {
      if (!dryRun) {
        fs.renameSync(tastePath, indexPath);
      }
      changes.push(`  Renombrado .taste/${entry.name}/taste.md → index.md`);
    }
  }

  // Root file
  const rootTaste = path.join(TASTE_DIR, 'taste.md');
  const rootIndex = path.join(TASTE_DIR, 'index.md');
  if (fs.existsSync(rootTaste) && !fs.existsSync(rootIndex)) {
    if (!dryRun) {
      fs.renameSync(rootTaste, rootIndex);
    }
    changes.push('  Renombrado .taste/taste.md → index.md');
  }

  return changes;
}

// ═══════════════════════════════════════════════════════════════════
// ═══ REPORT ═══
// ═══════════════════════════════════════════════════════════════════

function printTableRow(cols, widths) {
  const row = '│ ' + cols.map((c, i) => String(c).padEnd(widths[i])).join(' │ ') + ' │';
  return row;
}

function printReport(results, settingsResults, options) {
  const quiet = options.quiet || false;
  const showAll = options.showAll || false;

  let totalErrors = 0;
  let totalWarnings = 0;
  let totalRules = 0;
  let rulesWithId = 0;

  console.log('\n📋 Taste System — Reporte de Validación (ADR 0006)');

  // ── Settings ──
  console.log('\n📁 Settings:');
  for (const [label, sr] of settingsResults) {
    const icon = sr.errors.length === 0 ? '✅' : '❌';
    console.log(`  ${icon} ${label}`);
    for (const err of sr.errors) {
      console.log(`     ❌ ${err}`);
      totalErrors++;
    }
    for (const warn of sr.warnings) {
      console.log(`     ⚠️  ${warn}`);
      if (!quiet) totalWarnings++;
    }
  }

  // ── Packages table ──
  console.log('\n📦 Paquetes:');
  console.log('  ┌──────────┬────────────┬───────┬────────┬──────────┬──────────┐');
  console.log('  │ Package  │ File       │ Rules │ [id]   │ Conf.    │ Estado   │');
  console.log('  ├──────────┼────────────┼───────┼────────┼──────────┼──────────┤');

  for (const r of results) {
    const pkgStr = (r.domain || '?').padEnd(8);
    const fileStr = (path.basename(r.file || '')).padEnd(10);
    const rulesCount = r.rules.length;
    const withId = r.rules.filter(b => {
      const hasId = b.rawLine.match(/`\[[\w-]+\]`/);
      return hasId;
    }).length;
    const confStr = r.metadata.confidence ? r.metadata.confidence.padEnd(8) : '—       ';
    const errCount = r.errors.length;
    const warnCount = r.warnings.length;

    let stateIcon = '✅';
    let stateStr = 'OK      ';
    if (errCount > 0) { stateIcon = '❌'; stateStr = `${errCount} err`; }
    else if (warnCount > 0 && !quiet) { stateIcon = '⚠️'; stateStr = `${warnCount} warn`; }

    console.log(`  │ ${pkgStr} │ ${fileStr} │ ${String(rulesCount).padEnd(5)} │ ${String(withId).padEnd(6)} │ ${confStr} │ ${stateStr.padEnd(7)}│`);
    totalRules += rulesCount;
    rulesWithId += withId;

    if ((showAll || errCount > 0) && errCount > 0) {
      for (const err of r.errors) {
        console.log(`  │          │            │       │        │          │ ❌ ${err.padEnd(24)}│`);
      }
    }
    if (!quiet && warnCount > 0) {
      for (const warn of r.warnings) {
        if (warn.includes('sugerencia') || showAll) {
          console.log(`  │          │            │       │        │          │ ⚠️  ${warn.padEnd(24)}│`);
        }
      }
    }
  }

  console.log('  └──────────┴────────────┴───────┴────────┴──────────┴──────────┘');

  // ── Summary ──
  const idPct = totalRules > 0 ? Math.round(rulesWithId / totalRules * 100) : 0;
  console.log('');
  console.log(`  📊 ${results.length} paquetes · ${totalRules} reglas · ${rulesWithId} con [id] (${idPct}%)`);
  console.log(`  ${totalErrors > 0 ? '❌' : '✅'} ${totalErrors} errores · ${totalWarnings > 0 ? `⚠️ ${totalWarnings} warnings` : 'sin warnings'}`);
  console.log('');

  return { totalErrors, totalWarnings, totalRules, rulesWithId };
}

// ═══════════════════════════════════════════════════════════════════
// ═══ CLI ═══
// ═══════════════════════════════════════════════════════════════════

function main() {
  const args = process.argv.slice(2);
  const fixMode = args.includes('--fix');
  const quiet = args.includes('--quiet');
  const showAll = args.includes('--all');
  const packageFilter = args.includes('--package') ? args[args.indexOf('--package') + 1] : null;

  // ── Fix mode (--fix) ──
  if (fixMode) {
    console.log('\n🔧 Taste System — Modo Fix');
    console.log('═'.repeat(50));

    // Step 1: Rename taste.md → index.md
    const renameChanges = fixRenameTasteMd(false);
    if (renameChanges.length > 0) {
      console.log('\n📁 Renombrando archivos:');
      for (const c of renameChanges) console.log(`  ${c}`);
    } else {
      console.log('\n📁 No hay taste.md legacy que renombrar');
    }

    // Step 2: Add [id] tags
    const results = scanTasteDir();
    let totalIdChanges = 0;

    for (const r of results) {
      if (r.file && !r.file.endsWith('(missing)')) {
        const absPath = path.join(PROJECT_ROOT, r.file);
        if (fs.existsSync(absPath)) {
          const { changes, changed } = fixFile(absPath, false);
          if (changed) {
            console.log(`\n📝 ${r.file}:`);
            for (const c of changes) console.log(`  ${c}`);
            totalIdChanges += changes.length;
          }
        }
      }
    }

    console.log(`\n✅ Fix completo: ${totalIdChanges} IDs agregados, ${renameChanges.length} archivos renombrados`);
    return;
  }

  // ── Validation mode ──
  const results = scanTasteDir();
  const settingsResults = [
    ['settings.json', validateSettings(path.join(TASTE_DIR, 'settings.json'), false)],
    ['settings.local.json', validateSettings(path.join(TASTE_DIR, 'settings.local.json'), true)]
  ];

  const { totalErrors } = printReport(results, settingsResults, { quiet, showAll });

  // ── Per-package validation (--package) ──
  if (packageFilter) {
    const filtered = results.filter(r => r.domain === packageFilter);
    if (filtered.length === 0) {
      console.log(`❌ No se encontró el paquete "${packageFilter}"`);
      process.exit(1);
    }

    console.log(`\n📦 Detalle: ${packageFilter}`);
    console.log('─'.repeat(50));

    for (const r of filtered) {
      console.log(`  Archivo: ${r.file}`);
      console.log(`  Dominio: ${r.domain}`);
      console.log(`  Metadata:`);
      for (const [k, v] of Object.entries(r.metadata)) {
        console.log(`    ${k}: ${v}`);
      }

      if (r.rules.length > 0) {
        console.log(`  Reglas (${r.rules.length}):`);
        for (const b of r.rules) {
          const hasId = b.rawLine.match(/`\[[\w-]+\]`/) ? '✅' : '⚠️';
          const confStr = b.confidence != null ? (b.confidence).toFixed(2) : '??';
          const idStr = b.id || '—';
          console.log(`    ${hasId} [${idStr.padEnd(20)}] conf: ${confStr} — ${b.value.slice(0, 60)}`);
        }
      }

      console.log('');
      if (r.errors.length > 0) {
        console.log('  ❌ Errores:');
        for (const e of r.errors) console.log(`    ${e}`);
      }
      if (r.warnings.length > 0) {
        console.log('  ⚠️  Warnings:');
        for (const w of r.warnings) console.log(`    ${w}`);
      }
    }
  }

  if (totalErrors > 0) {
    console.log('\n❌ Validación fallida — corregir errores antes de compilar\n');
    process.exit(1);
  } else {
    console.log('\n✅ Taste System válido — todos los packages OK\n');
  }
}

main();
