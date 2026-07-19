/**
 * lint-slugs.js — Quality check for [id] tags in .taste/ files
 *
 * Analyzes all [id] slugs in .taste/<domain>/index.md and flags
 * quality issues: too long, accent-loss artifacts, truncation.
 *
 * Uso:
 *   node tools/improve-slugs.js --check              → check all slugs
 *
 * Quality rules:
 *   - Max length: 35 chars (warning > 35, error > 45)
 *   - No accent-loss artifacts: 'ci-n', 'si-n', 'gi-n' patterns
 *   - No truncation: slug should not end with '-' (truncated at 50)
 *   - No numeric prefix: slugs should not start with a digit
 */

const fs = require('fs');
const path = require('path');

const TASTE_DIR = path.join(__dirname, '..', '.taste');
const MAX_SLUG_LENGTH = 35;
const HARD_MAX_SLUG_LENGTH = 45;

/**
 * Check if a slug has accent-loss artifacts.
 * e.g., "animaci-n" should be "animacion" or "animation"
 * The pattern: word ending with 'ci-', 'si-', 'gi-' etc (lost ñ, ó, í, á, é)
 */
function hasAccentLoss(slug) {
  // Spanish accent loss: word-final accented vowel replaced with hyphen + consonant
  // e.g., "animacion" → "animaci-n" (ón lost → -n), "posición" → "posici-n"
  // Only detect patterns that strongly indicate lost accents, not compound English words.
  const patterns = [
    /(ci|si|gi|mi|ni)-[a-z]/, // e.g., "animaci-n", "posici-n" — NO incluir 'ti' (falsos positivos: multi-agent)
  ];
  return patterns.some(p => p.test(slug));
}

/**
 * Check if a slug ends with a truncated word (hyphen at end).
 */
function isTruncated(slug) {
  return slug.endsWith('-');
}

/**
 * Check if a slug starts with a numeric prefix.
 */
function hasNumericPrefix(slug) {
  return /^\d+-/.test(slug);
}

/**
 * Analyze all [id] slugs in a file and return quality issues.
 */
function analyzeFile(filePath) {
  if (!fs.existsSync(filePath)) return [];

  const content = fs.readFileSync(filePath, 'utf-8');
  const slugRegex = /`\[([\w-]+)\]`/g;
  const issues = [];
  let match;

  while ((match = slugRegex.exec(content)) !== null) {
    const slug = match[1];
    const lineNum = content.substring(0, match.index).split('\n').length;
    const slugIssues = [];

    // Check length
    if (slug.length > HARD_MAX_SLUG_LENGTH) {
      slugIssues.push(`ERROR: ${slug.length} chars (max ${HARD_MAX_SLUG_LENGTH})`);
    } else if (slug.length > MAX_SLUG_LENGTH) {
      slugIssues.push(`WARNING: ${slug.length} chars (recommended max ${MAX_SLUG_LENGTH})`);
    }

    // Check accent loss
    if (hasAccentLoss(slug)) {
      slugIssues.push('WARNING: posible pérdida de acentos/palabras incompletas');
    }

    // Check truncation
    if (isTruncated(slug)) {
      slugIssues.push('WARNING: slug truncado (termina en "-")');
    }

    // Check numeric prefix
    if (hasNumericPrefix(slug)) {
      slugIssues.push('WARNING: prefijo numérico — considerar renombrar');
    }

    if (slugIssues.length > 0) {
      issues.push({ line: lineNum, slug, issues: slugIssues });
    }
  }

  return issues;
}

function main() {
  const isCheck = process.argv.includes('--check');
  const domains = ['index', 'animation', 'backend', 'core', 'design', 'frontend', 'nodes', 'skills', 'tools'];

  if (!isCheck) {
    console.log('\n⚠️  improve-slugs.js ya no es un script de reemplazo masivo');
    console.log('   Los 332 slugs ya fueron mejorados en una ejecución anterior.');
    console.log('   Usa --check para analizar la calidad de los slugs actuales.');
    console.log('');
    console.log('  node tools/improve-slugs.js --check');
    return;
  }

  console.log('\n🔍 Lint de slugs — Reporte de Calidad');
  console.log('═'.repeat(60));

  let totalIssues = 0;
  let totalSlugs = 0;

  for (const domain of domains) {
    const actualPath = domain === 'index'
      ? path.join(TASTE_DIR, 'index.md')
      : path.join(TASTE_DIR, domain, 'index.md');

    const issues = analyzeFile(actualPath);
    totalSlugs += fs.existsSync(actualPath)
      ? (fs.readFileSync(actualPath, 'utf-8').match(/`\[[\w-]+\]`/g) || []).length
      : 0;

    if (issues.length > 0) {
      console.log(`\n  ${domain}/index.md — ${issues.length} issues:`);
      for (const issue of issues) {
        console.log(`    L${issue.line.toString().padEnd(4)} [${issue.slug.padEnd(35)}] ${issue.issues.join('; ')}`);
      }
      totalIssues += issues.length;
    } else {
      console.log(`\n  ${domain}/index.md — ✅ limpio`);
    }
  }

  console.log('');
  console.log(`  📊 ${totalSlugs} slugs analizados · ${totalIssues} issues encontrados`);
  console.log(totalIssues === 0 ? '  ✅ Todos los slugs en buen estado' : `  ⚠️  ${totalIssues} slugs requieren atención`);
  console.log('');
}

main();
