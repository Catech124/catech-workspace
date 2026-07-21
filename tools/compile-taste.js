#!/usr/bin/env node

/**
 * compile-taste.js — Compilador del Taste System (ADR 0006)
 *
 * Compila todos los packages .taste/<domain>/index.md en un solo markdown
 * optimizado para que el agente AI lo lea como system prompt.
 *
 * Algoritmo:
 *   1. Por cada dominio, resuelve cadena de 6 niveles de prioridad (P6→P1)
 *   2. Cada nivel se valida con validate-taste.js antes de entrar al merge
 *   3. Merge usa 3 estrategias: deep objects, shallow primitives, keyed rules
 *   4. Rules se mergean por id con veto por confidence
 *   5. Cada regla ganadora hereda _level (nivel de origen)
 *   6. Patrones y anti-patrones se preservan del nivel de mayor prioridad que los define
 *
 * Uso:
 *   node tools/compile-taste.js                → COMPILED_TASTE.md
 *   node tools/compile-taste.js --stdout       → imprime por stdout
 *   node tools/compile-taste.js --verbose      → incluye _level tracking
 *   node tools/compile-taste.js --output out.md  → archivo custom
 *   node tools/compile-taste.js --packages core,frontend → solo esos
 */

const fs = require('fs');
const path = require('path');

const TASTE_DIR = path.join(__dirname, '..', '.taste');
const DEFAULT_OUTPUT = path.join(__dirname, '..', 'COMPILED_TASTE.md');
const PROJECT_ROOT = path.join(__dirname, '..');

// ═══════════════════════════════════════════════════════════════════
// ═══ DOMAIN REGISTRY ═══
// ═══════════════════════════════════════════════════════════════════

const DOMAINS = [
  'core', 'frontend', 'backend', 'nodes', 'animation', 'design', 'skills', 'tools'
];

const KNOWN_DOMAINS = new Set(DOMAINS);

// ═══════════════════════════════════════════════════════════════════
// ═══ PARSE: extract [id] and (confidence) from markdown bullets ═══
// ═══════════════════════════════════════════════════════════════════

/**
 * Parse rules from markdown body.
 *
 * Supports two formats:
 *   1. (NEW) "- text `[id]` more text (confidence: X.XX) // source"
 *   2. (LEGACY) "- text more text (confidence: X.XX) // source" — slugify ID
 *
 * Skips bullets that are pattern/anti-pattern descriptors
 * (trigger, action, rationale, description, why, instead).
 * Bullets without (confidence: X.XX) are ignored entirely.
 */
function parseRulesFromMarkdown(body) {
  const rules = [];
  const seenIds = new Set();

  // Pattern/anti-pattern keys to skip
  const skipKeys = new Set(['trigger', 'action', 'rationale', 'description', 'why', 'instead']);

  // Match bullets with (confidence: X.XX) — both with and without [id]
  const bulletRegex = /^- (.*?\S) (?:`\[([\w-]+)\]` )?\(confidence:\s*([\d.]+)\)(?:\s*\/\/\s*(\w+))?/gm;
  let match;
  while ((match = bulletRegex.exec(body)) !== null) {
    const rawValue = match[1].trim();
    const explicitId = match[2];
    const confidence = parseFloat(match[3]);
    const source = match[4] || 'manual';

    // Skip pattern/anti-pattern descriptors
    const firstWord = rawValue.replace(/^\*\*/, '').replace(/\*\*$/, '').split(/\s+/)[0];
    if (skipKeys.has(firstWord)) continue;
    if (rawValue.startsWith('**')) continue;  // bold-marked keys

    if (confidence < 0 || confidence > 1 || isNaN(confidence)) continue;

    let id = explicitId;
    let value = rawValue;

    if (!id) {
      // No [id] tag — generate slug from rule value
      id = slugifyRule(value);
      console.warn(`  ⚠️  Rule without [id]: "${id}" — add \`[${id}]\` to stabilize`);
    }

    if (!seenIds.has(id)) {
      seenIds.add(id);
      rules.push({ id, value, confidence, source });
    }
  }

  return rules;
}

/**
 * Extract patterns section from markdown body.
 * Returns the raw markdown content of ## patterns (if present).
 */
function extractPatterns(body) {
  const patternsMatch = body.match(/## patterns\n([\s\S]*?)(?=\n## |\n$)/);
  return patternsMatch ? patternsMatch[1].trim() : null;
}

/**
 * Extract anti-patterns section from markdown body.
 * Returns the raw markdown content of ## anti-patterns (if present).
 */
function extractAntiPatterns(body) {
  const antiMatch = body.match(/## anti-patterns\n([\s\S]*?)(?=\n## |\n$)/);
  return antiMatch ? antiMatch[1].trim() : null;
}

/**
 * Generate a kebab-case slug from rule text.
 */
function slugifyRule(text) {
  return text
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);
}

/**
 * Parse YAML frontmatter metadata from a markdown file.
 * Expects lines like: "> **key:** value"
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
 * Parse domain from markdown title "# taste: <domain>"
 */
function parseDomainFromTitle(content) {
  const titleMatch = content.match(/^# taste:\s*(\S+)/);
  return titleMatch ? titleMatch[1] : null;
}

/**
 * Extract body (everything after first ## section header)
 */
function extractBody(content) {
  const bodyMatch = content.match(/^##\s+.*$/m);
  if (!bodyMatch) return '';
  return content.slice(bodyMatch.index).trim();
}

// ═══════════════════════════════════════════════════════════════════
// ═══ READ & VALIDATE ═══
// ═══════════════════════════════════════════════════════════════════

/**
 * findDomainFile(domain) → path or null
 *
 * Search for index.md first, fallback to taste.md with deprecation warning.
 */
function findDomainFile(domain) {
  const dir = path.join(TASTE_DIR, domain);
  if (!fs.existsSync(dir)) return null;

  const indexPath = path.join(dir, 'index.md');
  if (fs.existsSync(indexPath)) return indexPath;

  const tastePath = path.join(dir, 'taste.md');
  if (fs.existsSync(tastePath)) {
    console.warn(`  ⚠️  ${domain}/taste.md (legacy) — rename to index.md`);
    return tastePath;
  }

  return null;
}

/**
 * parsePackageFile(filePath) → { rules, metadata, patterns, antiPatterns, body, domain } or null
 *
 * Parses a markdown taste file, extracting:
 *   - Rules from ## preferences (with [id] and (confidence))
 *   - Patterns from ## patterns (raw markdown)
 *   - Anti-patterns from ## anti-patterns (raw markdown)
 */
function parsePackageFile(filePath) {
  if (!filePath || !fs.existsSync(filePath)) return null;

  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    if (!content.trim()) return null;

    const metadata = parseFrontmatter(content);
    const domain = parseDomainFromTitle(content) || path.basename(path.dirname(filePath));
    const body = extractBody(content);
    const rules = parseRulesFromMarkdown(body);
    const patterns = extractPatterns(body);
    const antiPatterns = extractAntiPatterns(body);

    return { domain, metadata, body, rules, patterns, antiPatterns, _file: filePath };
  } catch (e) {
    console.warn(`  ❌ ${filePath}: parse error — ${e.message}`);
    return null;
  }
}

/**
 * parseSettingsFile(filePath, domain) → { rules, metadata } or null
 *
 * Parses a JSON settings file and extracts only the overrides for the given domain.
 * Returns null if no overrides for this domain exist.
 */
function parseSettingsFile(filePath, domain) {
  if (!filePath || !fs.existsSync(filePath)) return null;

  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    if (!raw.trim()) return null;

    const parsed = JSON.parse(raw);
    const overrides = parsed.overrides || {};

    // Warn about unknown domain keys
    for (const key of Object.keys(overrides)) {
      if (!KNOWN_DOMAINS.has(key) && key !== 'global') {
        console.warn(`  ⚠️  ${path.basename(filePath)}: unknown domain "${key}"`);
      }
    }

    const domainOverrides = overrides[domain] || {};
    const rules = Object.entries(domainOverrides).map(([id, fields]) => ({
      id,
      ...(typeof fields === 'object' && fields !== null ? fields : { value: String(fields) })
    }));

    if (rules.length === 0) return null;

    return {
      domain,
      metadata: { ...parsed.metadata || {}, _isSettings: true },
      body: '',
      rules,
      patterns: null,
      antiPatterns: null,
      _file: filePath,
      _isSettings: true
    };
  } catch (e) {
    console.warn(`  ❌ ${filePath}: JSON parse error — ${e.message}`);
    return null;
  }
}

/**
 * findClaudeMdPath() → path or null
 */
function findClaudeMdPath() {
  const claudeFile = path.join(PROJECT_ROOT, 'CLAUDE.md');
  if (fs.existsSync(claudeFile)) return claudeFile;
  return null;
}

/**
 * findGlobalConfigPath() → path or null
 */
function findGlobalConfigPath() {
  const home = process.env.HOME || process.env.USERPROFILE;
  if (!home) return null;
  const configDir = path.join(home, '.config', 'taste');
  if (fs.existsSync(configDir)) return configDir;
  return null;
}

// ═══════════════════════════════════════════════════════════════════
// ═══ VALIDATE ═══
// ═══════════════════════════════════════════════════════════════════

/**
 * validatePackage(pkg) → { valid, errors }
 *
 * Checks that a parsed package has valid rules.
 * Returns the validated package (null if invalid) — single pass.
 */
function validateAndFilter(pkg) {
  if (!pkg) return null;

  const errors = [];

  if (pkg._isSettings) {
    for (const rule of (pkg.rules || [])) {
      if (!rule.id) errors.push(`rule missing id`);
    }
  } else {
    for (const rule of (pkg.rules || [])) {
      if (!rule.id) errors.push(`rule missing [id] — all rules must have an id`);
      if (rule.confidence == null || typeof rule.confidence !== 'number' ||
          isNaN(rule.confidence) || rule.confidence < 0 || rule.confidence > 1) {
        errors.push(`rule "${rule.id || 'unknown'}" missing or invalid (confidence: X.XX)`);
      }
    }
  }

  if (errors.length > 0) {
    console.warn(`  ⚠️  ${pkg._file || pkg.domain}: validation failed — ${errors.join('; ')}`);
    return null;
  }

  return pkg;
}

// ═══════════════════════════════════════════════════════════════════
// ═══ MERGE ALGORITHM ═══
// ═══════════════════════════════════════════════════════════════════

/**
 * mergePackage(lowerPkg, higherPkg, levelName) → mergedPkg
 *
 * Three strategies:
 *   - Deep merge: nested objects
 *   - Shallow replace: primitives
 *   - Keyed merge: rules[] merged by id with veto
 *   - Last-wins: patterns and anti-patterns (from highest priority level)
 */
function mergePackage(lowerPkg, higherPkg, levelName) {
  const merged = {};

  const allKeys = new Set([
    ...Object.keys(lowerPkg || {}),
    ...Object.keys(higherPkg || {})
  ]);

  for (const key of allKeys) {
    if (key === 'rules' || key === '_file' || key === '_isSettings' ||
        key === '_levels' || key === 'patterns' || key === 'antiPatterns') continue;

    const lower = lowerPkg ? lowerPkg[key] : undefined;
    const higher = higherPkg ? higherPkg[key] : undefined;

    if (higher === undefined) {
      merged[key] = lower;
    } else if (lower === undefined) {
      merged[key] = higher;
    } else if (isPlainObject(lower) && isPlainObject(higher)) {
      merged[key] = { ...lower, ...higher };
    } else {
      merged[key] = higher;
    }
  }

  // Track levels
  merged._levels = [
    ...(lowerPkg?._levels || []),
    ...(higherPkg ? [levelName] : [])
  ];

  // Patterns and anti-patterns: last-wins (highest priority level that has them)
  merged.patterns = higherPkg?.patterns ?? lowerPkg?.patterns ?? null;
  merged.antiPatterns = higherPkg?.antiPatterns ?? lowerPkg?.antiPatterns ?? null;

  // Merge rules (keyed by id)
  merged.rules = mergeRules(
    lowerPkg?.rules || [],
    higherPkg?.rules || [],
    levelName
  );

  // Calculate package confidence
  merged.confidence = calculatePackageConfidence(merged.rules);

  return merged;
}

/**
 * mergeRules(baseRules, overrideRules, levelName) → mergedRules
 *
 * Keyed merge by id with confidence veto.
 * Override inherits missing fields from base (campo a campo).
 */
function mergeRules(baseRules, overrideRules, levelName) {
  const map = new Map();

  for (const rule of baseRules) {
    if (rule.id == null) continue;
    map.set(rule.id, { ...rule, _level: rule._level || 'unknown' });
  }

  for (const override of overrideRules) {
    if (override.id == null) continue;

    const base = map.get(override.id);

    if (base) {
      const merged = { ...base, ...override, _level: levelName };

      const overrideConf = override.confidence != null ? override.confidence : base.confidence;
      const baseConf = base.confidence != null ? base.confidence : 1;

      if (overrideConf < 0.5 && baseConf >= 0.8) {
        console.log(`  [veto] "${override.id}": kept ${base._level} (conf ${baseConf}) over ${levelName} (conf ${overrideConf})`);
      } else {
        map.set(override.id, merged);
      }
    } else {
      if (override.confidence == null || typeof override.confidence !== 'number') {
        console.warn(`  ⚠️  "${override.id}" from ${levelName}: skipped (new rule without confidence)`);
        continue;
      }
      map.set(override.id, { ...override, _level: levelName });
    }
  }

  return [...map.values()];
}

function calculatePackageConfidence(rules) {
  const confidences = rules
    .map(r => r.confidence)
    .filter(c => c != null && typeof c === 'number' && !isNaN(c));

  if (confidences.length === 0) return null;
  return Math.min(...confidences);
}

function isPlainObject(obj) {
  return obj !== null && typeof obj === 'object' && !Array.isArray(obj);
}

// ═══════════════════════════════════════════════════════════════════
// ═══ RESOLUTION ═══
// ═══════════════════════════════════════════════════════════════════

/**
 * resolveTaste(cache) → { domainName: mergedPackage }
 *
 * Resolves all domains independently. Shares cache for P4, P5, P6.
 */
function resolveTaste(cache) {
  cache = cache || {};
  const result = {};

  for (const domain of DOMAINS) {
    result[domain] = resolveTasteForDomain(domain, cache);
  }

  result.index = resolveTasteForDomain('index', cache);
  return result;
}

/**
 * resolveTasteForDomain(domain, cache) → mergedPackage
 *
 * Folds P6 → P1 for one domain. Validates each level once.
 */
function resolveTasteForDomain(domain, cache) {
  const level5 = validateAndFilter(
    readLevel('P5:CLAUDE.md', cache, () => {
      const p = findClaudeMdPath();
      return p ? parsePackageFile(p) : null;
    })
  );

  const level4 = validateAndFilter(
    readLevel('P4:global-config', cache, () => {
      const dir = findGlobalConfigPath();
      if (!dir) return null;
      return parsePackageFile(path.join(dir, domain + '.md'));
    })
  );

  const level3 = validateAndFilter(
    (() => {
      const f = findDomainFile(domain);
      return f ? parsePackageFile(f) : null;
    })()
  );

  const level2 = validateAndFilter(
    parseSettingsFile(path.join(TASTE_DIR, 'settings.json'), domain)
  );

  const level1 = validateAndFilter(
    parseSettingsFile(path.join(TASTE_DIR, 'settings.local.json'), domain)
  );

  // Fold levels P5 → P1 in ascending priority
  const levels = [
    { name: 'P5:CLAUDE.md', pkg: level5 },
    { name: 'P4:global-config', pkg: level4 },
    { name: `P3:.taste/${domain}/index.md`, pkg: level3 },
    { name: 'P2:settings.json', pkg: level2 },
    { name: 'P1:settings.local.json', pkg: level1 },
  ].filter(l => l.pkg !== null);

  let merged = {};
  for (const level of levels) {
    merged = mergePackage(merged, level.pkg, level.name);
  }

  merged.domain = domain;
  if (level3) merged.metadata = { ...merged.metadata, ...level3.metadata };

  return merged;
}

/**
 * readLevel(cacheKey, cache, reader) → parsed package or null
 *
 * Caches shared levels (P4, P5, P6) across domains.
 */
function readLevel(cacheKey, cache, reader) {
  if (cache[cacheKey] !== undefined) return cache[cacheKey];
  cache[cacheKey] = reader() || null;
  return cache[cacheKey];
}

// ═══════════════════════════════════════════════════════════════════
// ═══ COMPILE OUTPUT ═══
// ═══════════════════════════════════════════════════════════════════

/**
 * compile(mergedPackages, options) → markdown string
 */
function compile(mergedPackages, options) {
  const lines = [];
  const now = new Date().toISOString().split('T')[0];
  const verbose = options?.verbose || false;

  lines.push('# COMPILED TASTE — Freebuff System Prompt');
  lines.push('');
  lines.push(`> **compiled:** ${now}`);
  const pkgCount = Object.keys(mergedPackages).filter(k => k !== 'index').length;
  lines.push(`> **packages:** ${pkgCount}`);
  lines.push(`> **source:** .taste/ (Taste System v1.0.0, ADR 0006)`);
  lines.push('');

  // Package summary
  lines.push('## Packages');
  lines.push('');
  lines.push('| Package | Domain | Rules | Patterns | Confidence | Levels |');
  lines.push('|---|---|---|---|---|---|');

  for (const [domain, pkg] of Object.entries(mergedPackages)) {
    if (domain === 'index' || !pkg) continue;
    const ruleCount = pkg.rules?.length || 0;
    const hasPatterns = pkg.patterns ? '✅' : '—';
    const conf = pkg.confidence != null ? pkg.confidence.toFixed(2) : '—';
    const levels = pkg._levels?.length || 0;
    const domainDesc = pkg.metadata?.domain || domain;
    lines.push(`| ${domain} | ${domainDesc} | ${ruleCount} | ${hasPatterns} | ${conf} | ${levels} |`);
  }
  lines.push('');

  // Per-domain output
  for (const [domain, pkg] of Object.entries(mergedPackages)) {
    if (!pkg || !pkg.rules || pkg.rules.length === 0) continue;

    lines.push('---');
    lines.push('');
    lines.push(`## ${domain}`);
    lines.push('');
    lines.push(`> ${pkg.metadata?.domain || domain}`);
    lines.push(`> **confidence:** ${pkg.confidence != null ? pkg.confidence.toFixed(2) : '—'}`);
    if (pkg.metadata?.updated) lines.push(`> **updated:** ${pkg.metadata.updated}`);
    if (pkg.metadata?.version) lines.push(`> **version:** ${pkg.metadata.version}`);
    lines.push('');

    // ── Preferences (rules) ──
    lines.push('## preferences');
    lines.push('');

    for (const rule of pkg.rules) {
      let line = `- ${rule.value} \`[${rule.id}]\` (confidence: ${(rule.confidence || 0).toFixed(2)})`;
      if (rule.source) line += ` // ${rule.source}`;
      if (verbose && rule._level) line += ` ← ${rule._level}`;
      lines.push(line);
    }
    lines.push('');

    // ── Patterns ──
    if (pkg.patterns) {
      lines.push('## patterns');
      lines.push('');
      // Patterns section has subsections like ### Pattern Name
      // Restore the markdown hierarchy
      const patternLines = pkg.patterns.split('\n');
      for (const pl of patternLines) {
        if (pl.startsWith('### ')) {
          lines.push(pl);
          lines.push('');
        } else if (pl.trim()) {
          lines.push(pl);
        } else {
          lines.push('');
        }
      }
      lines.push('');
    }

    // ── Anti-patterns ──
    if (pkg.antiPatterns) {
      lines.push('## anti-patterns');
      lines.push('');
      const antiLines = pkg.antiPatterns.split('\n');
      for (const al of antiLines) {
        if (al.startsWith('### ')) {
          lines.push(al);
          lines.push('');
        } else if (al.trim()) {
          lines.push(al);
        } else {
          lines.push('');
        }
      }
      lines.push('');
    }

    // Summary footer
    lines.push(`> **${pkg.rules.length} rules · confidence ${pkg.confidence != null ? pkg.confidence.toFixed(2) : '—'}**`);
    if (pkg._levels && pkg._levels.length > 0) {
      lines.push(`> **levels:** ${pkg._levels.join(', ')}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

// ═══════════════════════════════════════════════════════════════════
// ═══ VERBOSE OUTPUT ═══
// ═══════════════════════════════════════════════════════════════════

function printVerboseInfo(mergedPackages) {
  console.log('');
  console.log('📦 Per-rule provenance:');
  console.log('');

  for (const [domain, pkg] of Object.entries(mergedPackages)) {
    if (domain === 'index' || !pkg || !pkg.rules || pkg.rules.length === 0) continue;

    console.log(`  ── ${domain} (conf: ${pkg.confidence != null ? pkg.confidence.toFixed(2) : '—'}) ──`);

    for (const rule of pkg.rules) {
      const conf = rule.confidence != null ? rule.confidence.toFixed(2) : '??';
      const level = rule._level || 'unknown';
      console.log(`    ${rule.id.padEnd(20)} ${conf.padEnd(6)} ← ${level}`);
    }
    console.log('');
  }
}

// ═══════════════════════════════════════════════════════════════════
// ═══ CLI ═══
// ═══════════════════════════════════════════════════════════════════

function main() {
  const args = process.argv.slice(2);
  let outputPath = DEFAULT_OUTPUT;
  let toStdout = false;
  let packageFilter = null;
  let verboseFlag = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--output' && i + 1 < args.length) {
      outputPath = path.resolve(args[++i]);
    } else if (args[i] === '--stdout') {
      toStdout = true;
    } else if (args[i] === '--verbose') {
      verboseFlag = true;
    } else if (args[i] === '--packages' && i + 1 < args.length) {
      packageFilter = args[++i];
    }
  }

  const cache = {};
  let mergedPackages = resolveTaste(cache);

  if (packageFilter) {
    const filterSet = new Set(packageFilter.split(',').map(s => s.trim()));
    const filtered = {};
    for (const [name, pkg] of Object.entries(mergedPackages)) {
      if (filterSet.has(name)) filtered[name] = pkg;
    }
    mergedPackages = filtered;
  }

  const pkgCount = Object.keys(mergedPackages).filter(k => k !== 'index').length;
  const totalRules = Object.values(mergedPackages)
    .filter(p => p && p.rules)
    .reduce((sum, p) => sum + p.rules.length, 0);

  if (verboseFlag) printVerboseInfo(mergedPackages);

  const markdown = compile(mergedPackages, { verbose: verboseFlag });

  if (toStdout) {
    console.log(markdown);
  } else {
    let prevSize = 0;
    if (fs.existsSync(outputPath)) {
      const bakPath = outputPath + '.bak';
      prevSize = fs.statSync(outputPath).size;
      try { fs.copyFileSync(outputPath, bakPath); } catch (e) {}
    }

    fs.writeFileSync(outputPath, markdown, 'utf-8');
    const stats = fs.statSync(outputPath);
    const kb = (stats.size / 1024).toFixed(1);

    const diffBytes = stats.size - prevSize;
    const diffKb = (diffBytes / 1024).toFixed(1);
    const diffSign = diffBytes > 0 ? '+' : '';

    console.log('');
    console.log(`✅ COMPILED_TASTE.md generado — ${pkgCount} packages · ${totalRules} reglas · ${kb} KB`);
    console.log(`   📄 ${outputPath}`);
    if (prevSize > 0) {
      const prevKb = (prevSize / 1024).toFixed(1);
      console.log(`   📊 vs anterior: ${prevKb} KB → ${kb} KB (${diffSign}${diffKb} KB)`);
      console.log(`   💾 Backup guardado: ${outputPath}.bak`);
    }
    console.log('');
    console.log('📦 Packages compilados:');
    for (const [domain, pkg] of Object.entries(mergedPackages)) {
      if (domain === 'index' || !pkg) continue;
      const conf = pkg.confidence != null ? pkg.confidence.toFixed(2) : '?';
      const rules = pkg.rules?.length || 0;
      const hasP = pkg.patterns ? ' 📋' : '';
      const hasA = pkg.antiPatterns ? ' 🚫' : '';
      console.log(`   ${domain.padEnd(12)} conf: ${conf.padEnd(5)} ${String(rules).padEnd(3)} reglas${hasP}${hasA} · ${pkg._levels?.length || 0} niveles`);
    }
  }
}

main();
