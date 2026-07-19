#!/usr/bin/env node

/**
 * survey-taste.js — Escáner del Taste System
 *
 * Escanea el proyecto y detecta automáticamente preferencias de codificación,
 * herramientas, y patrones para sugerir entradas en .taste/<domain>/taste.md.
 *
 * Uso:
 *   node tools/survey-taste.js                   → Mostrar sugerencias
 *   node tools/survey-taste.js --apply            → Escribir sugerencias en los .taste/
 *   node tools/survey-taste.js --diff             → Mostrar diff sin aplicar
 *   node tools/survey-taste.js --package tools    → Solo escanear un dominio
 *   node tools/survey-taste.js --verbose          → Output detallado
 */

const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.join(__dirname, '..');
const TASTE_DIR = path.join(PROJECT_ROOT, '.taste');

// --- Detectores ---

async function detectPackageManager() {
  const files = [
    { name: 'pnpm-lock.yaml', pm: 'pnpm', confidence: 0.95 },
    { name: 'pnpm-lock.yml', pm: 'pnpm', confidence: 0.90 },
    { name: 'yarn.lock', pm: 'yarn', confidence: 0.90 },
    { name: 'package-lock.json', pm: 'npm', confidence: 0.85 },
    { name: 'bun.lock', pm: 'bun', confidence: 0.95 },
    { name: 'bun.lockb', pm: 'bun', confidence: 0.90 },
  ];

  for (const f of files) {
    const filePath = path.join(PROJECT_ROOT, f.name);
    if (fs.existsSync(filePath)) {
      return { detected: f.pm, confidence: f.confidence, evidence: f.name };
    }
  }

  // Fallback: buscar en package.json devDependencies
  const pkgPath = path.join(PROJECT_ROOT, 'package.json');
  if (fs.existsSync(pkgPath)) {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    const allDeps = { ...pkg.devDependencies, ...pkg.dependencies };
    if (allDeps['pnpm']) return { detected: 'pnpm', confidence: 0.7, evidence: 'package.json has pnpm dep' };
  }

  // Buscar también en frontend/ y agent-dashboard/
  for (const subdir of ['frontend', 'agent-dashboard']) {
    const subPkgPath = path.join(PROJECT_ROOT, subdir, 'package.json');
    if (fs.existsSync(subPkgPath)) {
      try {
        const subPkg = JSON.parse(fs.readFileSync(subPkgPath, 'utf-8'));
        if (subPkg.packageManager?.startsWith('pnpm')) {
          return { detected: 'pnpm', confidence: 0.85, evidence: `${subdir}/package.json has pnpm` };
        }
      } catch {}
    }
  }

  return { detected: 'unknown', confidence: 0.3, evidence: 'no lock file found' };
}

async function detectTestFramework() {
  const configs = [
    { file: 'vitest.config.js', framework: 'vitest', confidence: 0.95 },
    { file: 'vitest.config.ts', framework: 'vitest', confidence: 0.95 },
    { file: 'jest.config.js', framework: 'jest', confidence: 0.90 },
    { file: 'jest.config.ts', framework: 'jest', confidence: 0.90 },
  ];

  for (const c of configs) {
    if (fs.existsSync(path.join(PROJECT_ROOT, c.file))) {
      return { detected: c.framework, confidence: c.confidence, evidence: c.file };
    }
  }

  // Buscar en package.json files
  for (const subdir of ['', 'frontend', 'agent-dashboard']) {
    const pkgPath = path.join(PROJECT_ROOT, subdir, 'package.json');
    if (fs.existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
        const allDeps = { ...pkg.devDependencies, ...pkg.dependencies };
        if (allDeps['vitest']) return { detected: 'vitest', confidence: 0.85, evidence: `package.json (${subdir || 'root'}) has vitest` };
        if (allDeps['jest']) return { detected: 'jest', confidence: 0.85, evidence: `package.json (${subdir || 'root'}) has jest` };
        if (allDeps['playwright']) return { detected: 'playwright', confidence: 0.80, evidence: `package.json (${subdir || 'root'}) has playwright` };
      } catch {}
    }
  }

  return { detected: 'unknown', confidence: 0.3, evidence: 'no test config found' };
}

async function detectBundler() {
  const bundlers = [
    { file: 'vite.config.js', name: 'vite', confidence: 0.95 },
    { file: 'vite.config.ts', name: 'vite', confidence: 0.95 },
    { file: 'webpack.config.js', name: 'webpack', confidence: 0.90 },
    { file: 'rollup.config.js', name: 'rollup', confidence: 0.90 },
    { file: 'esbuild.config.js', name: 'esbuild', confidence: 0.85 },
    { file: 'parcel.config.js', name: 'parcel', confidence: 0.85 },
  ];

  for (const b of bundlers) {
    if (fs.existsSync(path.join(PROJECT_ROOT, b.file))) {
      return { detected: b.name, confidence: b.confidence, evidence: b.file };
    }
  }

  // Check for "no bundler" pattern: direct <script type="module"> imports
  const htmlFiles = [];
  try {
    const frontendDir = path.join(PROJECT_ROOT, 'frontend');
    if (fs.existsSync(frontendDir)) {
      for (const f of fs.readdirSync(frontendDir)) {
        if (f.endsWith('.html')) htmlFiles.push(path.join(frontendDir, f));
      }
    }
  } catch {}

  for (const htmlFile of htmlFiles) {
    const content = fs.readFileSync(htmlFile, 'utf-8');
    if (/<script[^>]*type="module"[^>]*>/i.test(content) && !content.includes('vite') && !content.includes('webpack')) {
      return { detected: 'none (vanilla ES modules)', confidence: 0.90, evidence: `<script type="module"> detected in ${path.basename(htmlFile)}` };
    }
  }

  return { detected: 'unknown', confidence: 0.3, evidence: 'no bundler config found' };
}

async function detectIndentation() {
  // Sample JS files to detect indent style
  const sampleFiles = [];
  for (const dir of ['frontend', 'agent-dashboard/js', 'Freebuff2API']) {
    const fullDir = path.join(PROJECT_ROOT, dir);
    if (fs.existsSync(fullDir)) {
      try {
        const files = fs.readdirSync(fullDir).filter(f => f.endsWith('.js') || f.endsWith('.go'));
        // Tomar hasta 3 archivos
        for (const f of files.slice(0, 3)) {
          sampleFiles.push(path.join(fullDir, f));
        }
      } catch {}
    }
  }

  if (sampleFiles.length === 0) {
    return { detected: 'unknown', confidence: 0.2, evidence: 'no source files to sample' };
  }

  let spacesCount = 0;
  let tabsCount = 0;
  let spaceSize = 0;
  let totalLines = 0;

  for (const file of sampleFiles) {
    try {
      const content = fs.readFileSync(file, 'utf-8');
      const lines = content.split('\n');
      for (const line of lines) {
        const trimmed = line.replace(/\s+$/, '');
        if (trimmed.startsWith('\t')) {
          tabsCount++;
        } else {
          const spaces = trimmed.match(/^ +/);
          if (spaces) {
            spacesCount++;
            const size = spaces[0].length;
            if (spaceSize === 0) spaceSize = size;
            else if (size > 0 && size < spaceSize) spaceSize = size;
          }
        }
        totalLines++;
      }
    } catch {}
  }

  if (tabsCount > spacesCount) {
    return { detected: 'tabs', confidence: 0.85, evidence: `tabs: ${tabsCount}, spaces: ${spacesCount}` };
  } else if (spacesCount > 0) {
    return { detected: `${spaceSize} spaces`, confidence: 0.85, evidence: `${spaceSize}-space indent in ${sampleFiles.length} files` };
  }

  return { detected: 'unknown', confidence: 0.3, evidence: 'ambiguous' };
}

async function detectCodeStyle() {
  // Sample JS files for semicolons and quotes
  const sampleFiles = [];
  const frontendDir = path.join(PROJECT_ROOT, 'frontend');
  if (fs.existsSync(frontendDir)) {
    try {
      const files = fs.readdirSync(frontendDir).filter(f => f.endsWith('.js'));
      for (const f of files.slice(0, 5)) {
        sampleFiles.push(path.join(frontendDir, f));
      }
    } catch {}
  }

  const dashboardDir = path.join(PROJECT_ROOT, 'agent-dashboard');
  if (fs.existsSync(dashboardDir)) {
    try {
      const jsDir = path.join(dashboardDir, 'js');
      if (fs.existsSync(jsDir)) {
        const files = fs.readdirSync(jsDir).filter(f => f.endsWith('.js'));
        for (const f of files.slice(0, 3)) {
          sampleFiles.push(path.join(jsDir, f));
        }
      }
    } catch {}
  }

  if (sampleFiles.length === 0) {
    return { semicolons: 'unknown', quotes: 'unknown', evidence: 'no JS files to sample' };
  }

  let semiCount = 0;
  let noSemiCount = 0;
  let singleQuotes = 0;
  let doubleQuotes = 0;
  let templateLiterals = 0;

  for (const file of sampleFiles) {
    try {
      const content = fs.readFileSync(file, 'utf-8');
      const lines = content.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        // Saltar comentarios y strings multilinea
        if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) continue;

        // Contar ; al final de línea no-vacía
        if (trimmed.length > 0 && !trimmed.startsWith('//')) {
          if (trimmed.endsWith(';')) semiCount++;
          else if (trimmed.endsWith('}') || trimmed.endsWith('{') || trimmed.endsWith(',') || trimmed.endsWith(')')) {
            // No contar llaves y paréntesis como "no semi"
          } else if (!trimmed.startsWith('import') && trimmed.length > 2 && !trimmed.includes('function') && !trimmed.startsWith('export')) {
            noSemiCount++;
          }
        }

        // Contar quotes (solo en líneas que no sean strings completos)
        const sq = (trimmed.match(/'/g) || []).length;
        const dq = (trimmed.match(/"/g) || []).length;
        const tl = (trimmed.match(/`/g) || []).length;
        singleQuotes += sq;
        doubleQuotes += dq;
        templateLiterals += tl;
      }
    } catch {}
  }

  const semiStyle = semiCount > noSemiCount ? 'semicolons' : 'no-semicolons';
  const quoteStyle = singleQuotes > doubleQuotes ? 'single' : 'double';

  return {
    semicolons: semiStyle,
    quotes: quoteStyle,
    templateLiterals,
    evidence: `semi: ${semiStyle} (${semiCount}/${semiCount + noSemiCount}), quotes: ${quoteStyle} (S:${singleQuotes} D:${doubleQuotes} T:${templateLiterals})`
  };
}

async function detectSchemaNodeTypes() {
  const schemaPath = path.join(PROJECT_ROOT, 'schema.json');
  if (!fs.existsSync(schemaPath)) {
    return { nodeTypes: [], categoryCount: 0, nodeDefinitions: [], propertyTypes: [], portTypes: [], hasAnimationSystem: false, hasRenderPipeline: false, hasLayerModel: false, hasGlobalEffects: false, hasDataFlow: false, hasMediaTypes: false, blendModeCount: 0, easingFunctionCount: 0, evidence: 'no schema.json found' };
  }

  try {
    const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf-8'));

    const result = {
      schemaVersion: schema.schemaVersion || schema.version || 'unknown',
      nodeTypes: [],
      categoryCount: 0,
      totalNodes: 0,
      // Node definitions (comprehensive)
      nodeDefinitions: [],
      nodeDefinitionCount: 0,
      nodeCategories: [],
      nodeCategoryCount: 0,
      // Port types
      portTypes: [],
      portTypeCount: 0,
      // Property types
      propertyTypes: [],
      propertyTypeCount: 0,
      // Animation system
      hasAnimationSystem: false,
      animationChannels: false,
      animationModifiers: [],
      // Render pipeline
      hasRenderPipeline: false,
      pipelineSteps: [],
      hasCaching: false,
      // Layer model
      hasLayerModel: false,
      layerFields: [],
      // Global effects
      hasGlobalEffects: false,
      globalEffectParams: [],
      // Data flow
      hasDataFlow: false,
      dataFlowRules: 0,
      // Media types
      hasMediaTypes: false,
      mediaTypeFormats: [],
      // Blend modes
      blendModeCount: 0,
      // Easing functions
      easingFunctionCount: 0,
      // UI defaults
      hasUIDefaults: false,
      uiDefaultKeys: [],
      evidenceParts: [],
    };

    // --- Node definitions (nodeDefinitions) ---
    if (schema.nodeDefinitions) {
      const defs = schema.nodeDefinitions;
      result.nodeDefinitionCount = Object.keys(defs).length;
      result.nodeDefinitions = Object.entries(defs).map(([key, def]) => ({
        key,
        name: def.name || key,
        category: def.category || 'other',
        supportsMask: def.supportsMask || false,
        paramCount: def.parameters ? Object.keys(def.parameters).length : 0,
        inputCount: def.inputs ? Object.keys(def.inputs).length : 0,
      }));

      // Extract categories
      const cats = new Set(result.nodeDefinitions.map(d => d.category));
      result.nodeCategoryCount = cats.size;
      result.nodeCategories = [...cats];

      result.evidenceParts.push(`${result.nodeDefinitionCount} node definitions in ${result.nodeCategoryCount} categories`);
    }

    // Fallback: legacy structure (nodes array or nodeTypes)
    if (result.nodeDefinitionCount === 0) {
      if (Array.isArray(schema.nodeTypes)) {
        result.nodeTypes = schema.nodeTypes.map(n => n.type || n.name || JSON.stringify(n));
        result.totalNodes = result.nodeTypes.length;
      } else if (Array.isArray(schema.nodes)) {
        result.nodeTypes = schema.nodes.map(n => n.type || n.name || JSON.stringify(n));
        result.totalNodes = result.nodeTypes.length;
      } else if (schema.definitions) {
        result.nodeTypes = Object.keys(schema.definitions);
        result.totalNodes = result.nodeTypes.length;
      }
    }

    // Legacy category count
    if (schema.categories) {
      result.categoryCount = schema.categories.length;
    }

    // --- Port types ---
    if (schema.portTypes) {
      result.portTypes = Object.entries(schema.portTypes).map(([key, pt]) => ({
        name: key,
        description: pt.description || '',
        maxConnections: pt.maxConnections || 1,
        compatibleTypes: pt.compatibleTypes || [],
      }));
      result.portTypeCount = result.portTypes.length;
      result.evidenceParts.push(`${result.portTypeCount} port types`);
    }

    // --- Property types ---
    if (schema.propertyTypes) {
      result.propertyTypes = Object.entries(schema.propertyTypes).map(([key, pt]) => ({
        name: key,
        widget: pt.widget || 'unknown',
        required: pt.required || [],
      }));
      result.propertyTypeCount = result.propertyTypes.length;
      result.evidenceParts.push(`${result.propertyTypeCount} property types (${result.propertyTypes.map(p => p.name).join(', ')})`);
    }

    // --- Animation system ---
    if (schema.animationSystem) {
      result.hasAnimationSystem = true;
      if (schema.animationSystem.channels) result.animationChannels = true;
      if (schema.animationSystem.modifiers) {
        result.animationModifiers = Object.keys(schema.animationSystem.modifiers);
      }
      result.evidenceParts.push(`animation system with ${result.animationModifiers.length} modifier types`);
    }

    // --- Render pipeline ---
    if (schema.renderPipeline) {
      result.hasRenderPipeline = true;
      if (schema.renderPipeline.steps) {
        result.pipelineSteps = Object.values(schema.renderPipeline.steps).map(s => s.operation || s.description || '');
      }
      if (schema.renderPipeline.caching) result.hasCaching = true;
      result.evidenceParts.push(`render pipeline: ${result.pipelineSteps.length} steps`);
    }

    // --- Layer model ---
    if (schema.layerModel) {
      result.hasLayerModel = true;
      if (schema.layerModel.fields) {
        result.layerFields = Object.keys(schema.layerModel.fields);
      }
      result.evidenceParts.push(`layer model: ${result.layerFields.length} fields`);
    }

    // --- Global effects ---
    if (schema.globalEffects) {
      result.hasGlobalEffects = true;
      if (schema.globalEffects.parameters) {
        result.globalEffectParams = Object.keys(schema.globalEffects.parameters);
      }
      result.evidenceParts.push(`${result.globalEffectParams.length} global effects`);
    }

    // --- Data flow rules ---
    if (schema.dataFlow) {
      result.hasDataFlow = true;
      if (schema.dataFlow.rules) {
        result.dataFlowRules = schema.dataFlow.rules.length;
      }
      result.evidenceParts.push(`${result.dataFlowRules} data flow rules`);
    }

    // --- Media types ---
    if (schema.mediaTypes) {
      result.hasMediaTypes = true;
      const formats = [];
      for (const [type, def] of Object.entries(schema.mediaTypes)) {
        if (def.formats) formats.push(...def.formats.map(f => `${type}:${f}`));
      }
      result.mediaTypeFormats = formats;
      result.evidenceParts.push(`${Object.keys(schema.mediaTypes).length} media types`);
    }

    // --- Blend modes ---
    if (Array.isArray(schema.blendModes)) {
      result.blendModeCount = schema.blendModes.length;
      result.evidenceParts.push(`${result.blendModeCount} blend modes`);
    }

    // --- Easing functions ---
    if (schema.easingFunctions) {
      result.easingFunctionCount = Object.keys(schema.easingFunctions).length;
    }

    // --- UI defaults ---
    if (schema.uiDefaults) {
      result.hasUIDefaults = true;
      result.uiDefaultKeys = Object.keys(schema.uiDefaults);
    }

    result.totalNodes = result.nodeDefinitionCount || result.nodeTypes.length;
    result.categoryCount = result.nodeCategoryCount || result.categoryCount;

    return {
      ...result,
      evidence: result.evidenceParts.join(' | '),
    };
  } catch (e) {
    return { nodeDefinitionCount: 0, portTypeCount: 0, propertyTypeCount: 0, schemaVersion: 'unknown', hasAnimationSystem: false, animationChannels: false, animationModifiers: [], hasRenderPipeline: false, pipelineSteps: [], hasCaching: false, hasLayerModel: false, layerFields: [], hasGlobalEffects: false, globalEffectParams: [], hasDataFlow: false, dataFlowRules: 0, hasMediaTypes: false, mediaTypeFormats: [], blendModeCount: 0, easingFunctionCount: 0, hasUIDefaults: false, uiDefaultKeys: [], nodeDefinitions: [], nodeCategories: [], portTypes: [], propertyTypes: [], nodeTypes: [], categoryCount: 0, totalNodes: 0, error: e.message, evidence: `schema.json parse error: ${e.message}` };
  }
}

async function detectExportFormats() {
  const mainJsPath = path.join(PROJECT_ROOT, 'frontend', 'main.js');
  const enginePath = path.join(PROJECT_ROOT, 'frontend', 'engine.js');

  const result = {
    formats: [],
    hasStandaloneEngine: false,
    hasHTMLExport: false,
    hasZIPExport: false,
    hasYouTubeImport: false,
    hasSceneDetection: false,
    defaultResolution: '1920x1080',
    defaultFPS: 30,
    methods: [],
    evidenceParts: [],
  };

  // --- Scan main.js ---
  if (fs.existsSync(mainJsPath)) {
    try {
      const content = fs.readFileSync(mainJsPath, 'utf-8');

      // Export formats
      if (content.includes('MediaRecorder') || content.includes('captureStream')) result.formats.push('WebM (MediaRecorder)');
      if (content.includes('ffmpeg') || content.includes('exportMP4')) result.formats.push('MP4 (FFmpeg.wasm)');
      if (content.includes('png-sequence')) result.formats.push('PNG sequence');
      if (content.includes('jpg-sequence')) result.formats.push('JPEG sequence');
      if (content.includes('exportGIF') || content.includes('encodeGIF')) result.formats.push('GIF (LZW encoder inline)');

      // ZIP utility
      if (content.includes('class ZipWriter')) {
        result.hasZIPExport = true;
        result.methods.push('ZIP (ZipWriter store-mode)');
      }

      // YouTube import
      if (content.includes('downloadFromYouTube')) {
        result.hasYouTubeImport = true;
        result.methods.push('YouTube import (backend API)');
      }

      // Scene detection
      const selectPat = 'gt(scene,';
      if (content.includes('detectScenes') || content.includes(selectPat)) {
        result.hasSceneDetection = true;
        result.methods.push('Scene detection (FFmpeg.wasm)');
      }

      // Default resolution
      const resMatch = content.match(/document\.getElementById\(['"]cW['"]\)\.value\s*\|\|\s*(\d+)/);
      if (resMatch) result.defaultResolution = resMatch[1] + 'x' + (content.match(/document\.getElementById\(['"]cH['"]\)\.value\s*\|\|\s*(\d+)/) || ['', '1080'])[1];

      // Default FPS
      const fpsMatch = content.match(/document\.getElementById\(['"]fps['"]\)\.value\s*\|\|\s*(\d+)/);
      if (fpsMatch) result.defaultFPS = parseInt(fpsMatch[1]);

      result.evidenceParts.push(`main.js: ${result.formats.length} formats, FPS ${result.defaultFPS}, res ${result.defaultResolution}`);
    } catch {
      result.evidenceParts.push('error reading main.js');
    }
  }

  // --- Scan engine.js for standalone export ---
  if (fs.existsSync(enginePath)) {
    try {
      const content = fs.readFileSync(enginePath, 'utf-8');

      if (content.includes('buildStandaloneEngineSource')) {
        result.hasStandaloneEngine = true;
        result.methods.push('Standalone engine (.toString() serialization)');
      }

      result.evidenceParts.push('engine.js: standalone engine export available');
    } catch {
      result.evidenceParts.push('error reading engine.js');
    }
  }

  return {
    ...result,
    evidence: result.evidenceParts.join(' | '),
  };
}

async function detectRenderPipeline() {
  const enginePath = path.join(PROJECT_ROOT, 'frontend', 'engine.js');
  const engineEffectsPath = path.join(PROJECT_ROOT, 'frontend', 'engine-effects.js');
  const engineDistPath = path.join(PROJECT_ROOT, 'frontend', 'engine-distortion.js');
  const engineMasksPath = path.join(PROJECT_ROOT, 'frontend', 'engine-masks.js');
  const engine3dPath = path.join(PROJECT_ROOT, 'frontend', 'engine-3d.js');
  const engineGenPath = path.join(PROJECT_ROOT, 'frontend', 'engine-generators.js');
  const poolPath = path.join(PROJECT_ROOT, 'frontend', 'canvas-pool.js');

  const files = {
    engine: fs.existsSync(enginePath) ? fs.readFileSync(enginePath, 'utf-8') : '',
    effects: fs.existsSync(engineEffectsPath) ? fs.readFileSync(engineEffectsPath, 'utf-8') : '',
    distort: fs.existsSync(engineDistPath) ? fs.readFileSync(engineDistPath, 'utf-8') : '',
    masks: fs.existsSync(engineMasksPath) ? fs.readFileSync(engineMasksPath, 'utf-8') : '',
    '3d': fs.existsSync(engine3dPath) ? fs.readFileSync(engine3dPath, 'utf-8') : '',
    generators: fs.existsSync(engineGenPath) ? fs.readFileSync(engineGenPath, 'utf-8') : '',
  };

  const result = {
    engineFiles: [],
    rendererDispatch: [],
    pipelineStages: [],
    hasStaticNodeCache: false,
    hasCanvasPool: false,
    hasImageDataPool: false,
    hasPowerWindow: false,
    hasNodeSizing: false,
    hasOutputGain: false,
    hasEffectMask: false,
    nodeCount: { effect: 0, distortion: 0, mask: 0, '3d': 0, generator: 0 },
    totalNodesByRenderer: 0,
    evidenceParts: [],
  };

  if (!files.engine) {
    result.evidenceParts.push('no engine.js found');
    return { ...result, evidence: 'no engine.js found' };
  }

  // Detect engine files
  if (files.effects) result.engineFiles.push('engine-effects.js');
  if (files.distort) result.engineFiles.push('engine-distortion.js');
  if (files.masks) result.engineFiles.push('engine-masks.js');
  if (files['3d']) result.engineFiles.push('engine-3d.js');
  if (files.generators) result.engineFiles.push('engine-generators.js');

  // Detect renderer dispatch by parsing processNodeCanvas type checks
  const dispatchSection = files.engine.match(/function processNodeCanvas[\s\S]*?(?=\nfunction resolveNodeOutput)/);
  if (dispatchSection) {
    const dispatch = dispatchSection[0];

    // Extract node types sent to each renderer from the if/else chain
    // renderEffectNode block
    const effectMatch = dispatch.match(/type === '([^']+)'(?:\s*\|\|\s*type === '([^']+)')*/);

    // More precise: extract all type strings from the if/else chain
    const typeRegex = /type\s*===\s*'([^']+)'/g;
    const allTypes = [];
    let tm;
    while ((tm = typeRegex.exec(dispatch)) !== null) {
      allTypes.push(tm[1]);
    }

    // Find where each renderer block starts by looking for the function calls
    const blocks = dispatch.split(/\} else if \(/);
    for (const block of blocks) {
      if (block.includes('renderEffectNode')) {
        const types = block.match(/type === '([^']+)'/g);
        result.rendererDispatch.push({ renderer: 'renderEffectNode', types: (types || []).map(t => t.replace("type === '", '').replace("'", '')) });
      } else if (block.includes('renderDistortionNode')) {
        const types = block.match(/type === '([^']+)'/g);
        result.rendererDispatch.push({ renderer: 'renderDistortionNode', types: (types || []).map(t => t.replace("type === '", '').replace("'", '')) });
      } else if (block.includes('renderMaskNode')) {
        const types = block.match(/type === '([^']+)'/g);
        result.rendererDispatch.push({ renderer: 'renderMaskNode', types: (types || []).map(t => t.replace("type === '", '').replace("'", '')) });
      } else if (block.includes('render3dNode')) {
        const types = block.match(/type === '([^']+)'/g);
        result.rendererDispatch.push({ renderer: 'render3dNode', types: (types || []).map(t => t.replace("type === '", '').replace("'", '')) });
      } else if (block.includes('renderGeneratorNode')) {
        // Generator is the else/default — count all types not in other blocks
        // But we can detect the comment or the function name
        result.rendererDispatch.push({ renderer: 'renderGeneratorNode (default)', types: ['→ all remaining NODE_DEFS types'] });
      }
    }

    // Count node types per renderer
    for (const entry of result.rendererDispatch) {
      if (entry.renderer === 'renderGeneratorNode (default)') continue; // counted separately
      const count = entry.types.length;
      const key = entry.renderer.replace('render', '').replace('Node', '').toLowerCase();
      if (key === 'effect') result.nodeCount.effect = count;
      else if (key === 'distortion') result.nodeCount.distortion = count;
      else if (key === 'mask') result.nodeCount.mask = count;
      else if (key === '3d') result.nodeCount['3d'] = count;
    }

    // Count generators/total from all type matches
    result.totalNodesByRenderer = allTypes.length; // all explicitly matched types
  }

  // Pipeline stages (processNodeCanvas post-processing)
  if (files.engine.includes('Effect Mask')) result.hasEffectMask = true;
  if (files.engine.includes('Node Sizing')) result.hasNodeSizing = true;
  if (files.engine.includes('Power Window')) result.hasPowerWindow = true;
  if (files.engine.includes('Output Gain')) result.hasOutputGain = true;

  result.pipelineStages = [];
  if (result.hasEffectMask) result.pipelineStages.push('Effect Mask (inputGain + destination-in)');
  if (result.hasNodeSizing) result.pipelineStages.push('Node Sizing (zoom/pan/rotate/flip/crop)');
  if (result.hasPowerWindow) result.pipelineStages.push('Power Window (circle/rectangle/polygon/gradient)');
  if (result.hasOutputGain) result.pipelineStages.push('Output Gain (blend with original)');

  // Static node cache
  result.hasStaticNodeCache = files.engine.includes('_staticNodeCache') && files.engine.includes('isNodeSubtreeStatic');

  // Canvas pool
  if (fs.existsSync(poolPath)) {
    const poolContent = fs.readFileSync(poolPath, 'utf-8');
    result.hasCanvasPool = poolContent.includes('function acquire') && poolContent.includes('function releaseAll');
  }

  // ImageData pool
  result.hasImageDataPool = files.engine.includes('acquireImageData') && files.engine.includes('acquireClampedArray');

  // 3D renderer details
  if (files['3d']) {
    result.evidenceParts.push('engine-3d.js: 6 node types with _3dRasterize pipeline');
  }

  result.evidenceParts.push(`${result.rendererDispatch.length} renderers, ${result.pipelineStages.length} pipeline stages`);

  return {
    ...result,
    evidence: result.evidenceParts.join(' | '),
  };
}

async function detectNodeTypesFromEngine() {
  const enginePath = path.join(PROJECT_ROOT, 'frontend', 'engine.js');
  if (!fs.existsSync(enginePath)) {
    return { categories: {}, totalNodes: 0, categoriesCount: 0, maskInputCount: 0, evidence: 'no frontend/engine.js' };
  }

  try {
    const content = fs.readFileSync(enginePath, 'utf-8');

    // Extraer el bloque NODE_DEFS
    const nodeDefsMatch = content.match(/const NODE_DEFS\s*=\s*\{([\s\S]*?)\};\n/);
    if (!nodeDefsMatch) {
      return { categories: {}, totalNodes: 0, categoriesCount: 0, maskInputCount: 0, evidence: 'NODE_DEFS not found in engine.js' };
    }

    const nodeDefsBlock = nodeDefsMatch[1];

    // Parsear cada entrada usando brace-counting (robusto contra anidamiento)
    const categories = {};
    let totalNodes = 0;
    let maskInputCount = 0;
    let generatorCount = 0;
    let effectCount = 0;

    // Encontrar entradas top-level del NODE_DEFS
    // Cada entrada empieza en su propia línea con 2 espacios exactos: "  key: {"
    // o "  'key-name': {" para keys con guiones
    // Las props anidadas tienen 4+ espacios de indentación
    // Usar "\n  (?! )" para diferenciar 2 espacios de 4+ espacios
    const entryStartRegex = /\n  (?! )'?([\w][\w-]*)'?:\s*\{/g;
    let entryMatch;

    while ((entryMatch = entryStartRegex.exec(nodeDefsBlock)) !== null) {
      const key = entryMatch[1];
      const matchStart = entryMatch.index; // posición del \n

      // Encontrar el '{' que abre el objeto
      const bracePos = matchStart + 1; // empezar justo después del \n
      let openBrace = nodeDefsBlock.indexOf('{', bracePos);
      if (openBrace < 0) continue;

      // Balancear braces desde openBrace
      let depth = 1;
      let pos = openBrace + 1;
      while (depth > 0 && pos < nodeDefsBlock.length) {
        const ch = nodeDefsBlock[pos];
        if (ch === '{') depth++;
        else if (ch === '}') depth--;
        pos++;
      }

      // Extraer el contenido completo de la entrada (desde el \n hasta el } de cierre)
      const fullEntry = nodeDefsBlock.slice(matchStart, pos);

      // Extraer cat del contenido completo
      const catMatch = fullEntry.match(/\bcat:\s*'([^']+)'/);
      const cat = catMatch ? catMatch[1] : 'other';

      if (!categories[cat]) categories[cat] = [];
      categories[cat].push(key);
      totalNodes++;

      // Detectar maskInput en la entrada completa
      if (/\bmaskInput:\s*true\b/.test(fullEntry)) {
        maskInputCount++;
      }

      // Clasificar entre generadores animables vs efectos
      if (['source', 'generate'].includes(cat)) {
        generatorCount++;
      } else if (!['output', '3d'].includes(cat)) {
        effectCount++;
      }
    }

    return {
      categories,
      totalNodes,
      categoriesCount: Object.keys(categories).length,
      maskInputCount,
      maskInputRatio: totalNodes > 0 ? (maskInputCount / totalNodes) : 0,
      generatorCount,
      effectCount,
      evidence: `${totalNodes} tipos en ${Object.keys(categories).length} categorías, ${maskInputCount} con maskInput, ${generatorCount} generadores`
    };
  } catch (e) {
    return { categories: {}, totalNodes: 0, categoriesCount: 0, maskInputCount: 0, evidence: `error parsing: ${e.message}` };
  }
}

async function detectCopilotPatterns() {
  const copilotPath = path.join(PROJECT_ROOT, 'frontend', 'copilot.js');

  const result = {
    hasCopilotJS: false,
    // Architecture
    esModuleImports: [],
    apiEndpoint: null,
    chatPersistence: false,
    hasLocalStorageKeys: false,
    localStorageKeys: [],
    // UI components
    hasPanelSystem: false,
    hasSkillsSystem: false,
    skillCount: 0,
    skillNames: [],
    hasModelSelector: false,
    modelProviderCount: 0,
    hasFontSizeControl: false,
    panelDraggable: false,
    hasResizeObserver: false,
    // API
    hasHealthCheck: false,
    hasModelAPI: false,
    hasChatAPI: false,
    modelLoadingFallback: false,
    // Context & Commands
    hasBuildContext: false,
    hasBuildGraphContext: false,
    hasCommandExecution: false,
    supportedActions: [],
    hasAutoLayout: false,
    // Features
    hasMarkdownRendering: false,
    hasEventDelegation: false,
    hasContextTracking: false,
    hasInputAutoResize: false,
    hasKeyboardShortcuts: false,
    evidenceParts: [],
  };

  if (!fs.existsSync(copilotPath)) {
    result.evidenceParts.push('no copilot.js found');
    return { ...result, evidence: 'no copilot.js found' };
  }

  try {
    const content = fs.readFileSync(copilotPath, 'utf-8');
    result.hasCopilotJS = true;

    // --- Architecture ---
    const importRegex = /import\s+\{([^}]+)\}\s+from\s+'([^']+)'/g;
    let im;
    while ((im = importRegex.exec(content)) !== null) {
      const names = im[1].split(',').map(n => n.trim());
      for (const n of names) {
        result.esModuleImports.push(`${n} (from ${im[2]})`);
      }
    }

    // API endpoint
    if (content.includes('CP_API =')) {
      result.apiEndpoint = 'location.origin || localhost:8765';
    }

    // Chat persistence
    result.chatPersistence = content.includes('cpSaveChat') &&
      content.includes('cpRestoreChat') &&
      content.includes('cpHistory');

    // LocalStorage keys
    const lsKeys = ['cpPanelW', 'cpPanelH', 'cpPanelLeft', 'cpPanelTop',
      'cpFontSize', 'cpModel', 'cpHistory', 'cpMessages'];
    for (const key of lsKeys) {
      if (content.includes(`'${key}'`)) result.localStorageKeys.push(key);
    }
    result.hasLocalStorageKeys = result.localStorageKeys.length > 0;

    // --- UI Components ---
    // Panel system
    result.hasPanelSystem = content.includes('cpToggle') &&
      content.includes('cpMinimize') &&
      content.includes('classList.toggle');

    // Skills system
    const skillsMatch = content.match(/var cpSkills\s*=\s*\[([\s\S]*?)\];/);
    if (skillsMatch) {
      result.hasSkillsSystem = true;
      const nameRegex = /name:\s*'([^']+)'/g;
      let nm;
      while ((nm = nameRegex.exec(skillsMatch[1])) !== null) {
        result.skillNames.push(nm[1]);
      }
      result.skillCount = result.skillNames.length;
    }

    // Model selector
    result.hasModelSelector = content.includes('cpSelectedModel') &&
      content.includes('cpModelSelect') &&
      content.includes('cpLoadModels');

    // Provider display names
    const providerMatch = content.match(/var cpProviderNames\s*=\s*\{([\s\S]*?)\};/);
    if (providerMatch) {
      const providerRegex = /'([^']+)':\s*'([^']+)'/g;
      let ppm;
      const providers = [];
      while ((ppm = providerRegex.exec(providerMatch[1])) !== null) {
        providers.push(ppm[1]);
      }
      result.modelProviderCount = providers.length;
    }

    // Font size control
    result.hasFontSizeControl = content.includes('cpFontSize') &&
      content.includes('cpChangeFontSize') &&
      content.includes('cpFontSlider');

    // Draggable panel
    result.panelDraggable = content.includes('var dragging = false') &&
      content.includes('mousedown') &&
      content.includes('mouseup');

    // ResizeObserver
    result.hasResizeObserver = content.includes('ResizeObserver');

    // --- API ---
    result.hasHealthCheck = content.includes('/api/health');
    result.hasModelAPI = content.includes('/api/models');
    result.hasChatAPI = content.includes('/api/chat');
    result.modelLoadingFallback = content.includes('fallback') ||
      content.includes('AbortSignal.timeout');

    // --- Context & Commands ---
    result.hasBuildContext = content.includes('function cpBuildContext()');
    result.hasBuildGraphContext = content.includes('function cpBuildGraphContext()');

    // Command execution
    result.hasCommandExecution = content.includes('cpExecuteCommands') &&
      content.includes('cpRunCommand');
    const actionRegex = /case\s+'([^']+)':/g;
    let ac;
    const actions = [];
    while ((ac = actionRegex.exec(content)) !== null) {
      actions.push(ac[1]);
    }
    result.supportedActions = actions;
    result.hasAutoLayout = actions.includes('autoLayout');

    // --- Features ---
    result.hasMarkdownRendering = content.includes('cpRenderMd') &&
      content.includes('<strong>') &&
      content.includes('<code>');

    result.hasEventDelegation = content.includes('e.target.closest') &&
      content.includes('.cp-skill-item');

    result.hasContextTracking = content.includes('Store.on') &&
      content.includes('RENDER_GRAPH');

    result.hasInputAutoResize = content.includes('input') &&
      content.includes('this.style.height');

    // Keyboard shortcuts
    result.hasKeyboardShortcuts = content.includes('cpHandleKey') &&
      content.includes('Escape') &&
      content.includes('ArrowDown');

    result.evidenceParts.push(`copilot.js: ${result.esModuleImports.length} imports, ${result.skillCount} skills, ${result.modelProviderCount} providers, ${result.supportedActions.length} actions`);
  } catch (e) {
    result.evidenceParts.push(`error reading copilot.js: ${e.message}`);
  }

  return {
    ...result,
    evidence: result.evidenceParts.join(' | '),
  };
}

async function detectTestingPatterns() {
  const nodeCompPath = path.join(PROJECT_ROOT, 'frontend', 'node_composition_test.js');
  const integPath = path.join(PROJECT_ROOT, 'frontend', 'integration_test.js');
  const vitestPath = path.join(PROJECT_ROOT, 'frontend', 'vitest.config.js');

  const result = {
    hasNodeCompositionTest: false,
    hasIntegrationTest: false,
    // Node composition test patterns
    iifeWrapped: false,
    browserInjected: false,
    consoleErrorInterception: false,
    testFunctions: [],
    testCount: 0,
    sourceNodeCount: 0,
    effectNodeCount: 0,
    chainCount: 0,
    dualInputCount: 0,
    hasEditorAccess: false,
    hasStoreAccess: false,
    resultsStorage: null,
    errorInterceptionMethods: [],
    nodeTypesTested: [],
    // Integration test patterns
    playwrightFramework: false,
    testPhases: [],
    phaseCount: 0,
    staticIdCount: 0,
    dataActionCount: 0,
    interactiveTestCount: 0,
    consoleErrorCollector: false,
    serverStartupRetry: false,
    checkFunctionPattern: null,
    // Vitest patterns
    vitestConfig: false,
    vitestEnvironment: null,
    vitestSetupFile: null,
    vitestTimeout: 0,
    evidenceParts: [],
  };

  // --- node_composition_test.js ---
  if (fs.existsSync(nodeCompPath)) {
    try {
      const content = fs.readFileSync(nodeCompPath, 'utf-8');
      result.hasNodeCompositionTest = true;

      // IIFE pattern
      result.iifeWrapped = content.includes('(function runNodeTest()') || content.includes('(function()');

      // Browser injection comment
      result.browserInjected = content.includes('Pega en consola del navegador') ||
        content.includes('script.src =') ||
        content.includes('document.body.appendChild(script)');

      // Console error interception
      result.consoleErrorInterception = content.includes('console.error = function') &&
        content.includes('console.warn = function');
      if (result.consoleErrorInterception) {
        result.errorInterceptionMethods.push('console.error capture');
        result.errorInterceptionMethods.push('console.warn capture (Engine: prefix filter)');
      }

      // Test functions
      const testFns = ['testSingleNode', 'testWithBG', 'testDualInput', 'testChain', 'test3DChain', 'testWithTimeout'];
      for (const fn of testFns) {
        if (content.includes('function ' + fn)) result.testFunctions.push(fn);
      }

      // Test count from results tracking
      const passMatch = content.match(/results\.pass\.length/);
      if (passMatch) result.testCount = content.match(/console\.log\(`✅ Pasaron: \$\{results\.pass\.length}`\)/) ? 'runtime (tracked in results)' : 'static';

      // Editor access
      result.hasEditorAccess = content.includes('window.__editor');
      result.hasStoreAccess = content.includes('window.Store');

      // Results storage
      if (content.includes('window.__nodeTestResults')) result.resultsStorage = 'window.__nodeTestResults';

      // Node types tested (from arrays and test calls)
      const sourceMatch = content.match(/const sources\s*=\s*\[([^\]]+)\]/);
      if (sourceMatch) {
        result.sourceNodeCount = sourceMatch[1].split(',').length;
        const types = sourceMatch[1].match(/'([^']+)'/g);
        if (types) result.nodeTypesTested.push(...types.map(t => t.replace(/'/g, '')));
      }

      const effectMatch = content.match(/const effects\s*=\s*\[([^\]]+)\]/);
      if (effectMatch) {
        result.effectNodeCount = effectMatch[1].split(',').length;
        const types = effectMatch[1].match(/'([^']+)'/g);
        if (types) result.nodeTypesTested.push(...types.map(t => t.replace(/'/g, '')));
      }

      const dualMatch = content.match(/const dual\s*=\s*\[([^\]]+)\]/);
      if (dualMatch) {
        result.dualInputCount = dualMatch[1].split(',').length + 1; // +1 for channel-boolean
      }

      // Chain tests
      result.chainCount = (content.match(/testChain\(\[/g) || []).length;

      result.evidenceParts.push(`node_composition_test.js: ${result.testFunctions.length} test functions, ${result.sourceNodeCount || '?'} source + ${result.effectNodeCount || '?'} effect nodes`);
    } catch (e) {
      result.evidenceParts.push(`error reading node_composition_test.js: ${e.message}`);
    }
  }

  // --- integration_test.js ---
  if (fs.existsSync(integPath)) {
    try {
      const content = fs.readFileSync(integPath, 'utf-8');
      result.hasIntegrationTest = true;

      // Playwright
      result.playwrightFramework = content.includes("require('playwright')") &&
        content.includes('chromium.launch');

      // Test phases (numbered in comments)
      const phaseLabels = [
        { marker: 'Phase 1', label: 'Static ID verification' },
        { marker: 'Phase 2', label: 'data-action attribute verification' },
        { marker: 'Phase 3', label: 'data-toggle attribute verification' },
        { marker: 'Phase 4', label: 'Interactive behavior tests' },
        { marker: 'Phase 5', label: 'Console error audit' },
      ];
      for (const ph of phaseLabels) {
        if (content.includes(ph.marker)) result.testPhases.push(ph.label);
      }

      result.phaseCount = result.testPhases.length;

      // Static ID count
      const staticMatch = content.match(/const STATIC_IDS\s*=\s*\[([\s\S]*?)\];/);
      if (staticMatch) {
        const ids = staticMatch[1].match(/'([^']+)'/g);
        result.staticIdCount = ids ? ids.length : 0;
      }

      // Data action count
      const actionMatch = content.match(/const DATA_ACTIONS\s*=\s*\[([\s\S]*?)\];/);
      if (actionMatch) {
        const actions = actionMatch[1].match(/'([^']+)'/g);
        result.dataActionCount = actions ? actions.length : 0;
      }

      // Interactive tests
      const interactiveTests = [
        'Tab switching', 'Project modal', 'Export modal',
        'Play button', 'Button type', 'Zoom slider',
        'Copilot panel', 'Context menu', 'Node area',
        'Media pool', 'Console error check'
      ];
      const foundTests = [];
      for (const t of interactiveTests) {
        if (content.includes(t)) foundTests.push(t);
      }
      result.interactiveTestCount = foundTests.length;

      // Console error collector
      result.consoleErrorCollector = content.includes('consoleErrors = []') &&
        content.includes("msg.type() === 'error'");

      // Server startup retry
      result.serverStartupRetry = content.includes('maxRetries') && content.includes('500');

      // Check function pattern
      if (content.includes('function check(label, condition, detail)')) {
        result.checkFunctionPattern = 'check(label, condition, detail)';
      }

      result.evidenceParts.push(`integration_test.js: ${result.phaseCount} phases, ${result.staticIdCount} static IDs, ${result.dataActionCount} data-actions, ${result.interactiveTestCount} interactive tests`);
    } catch (e) {
      result.evidenceParts.push(`error reading integration_test.js: ${e.message}`);
    }
  }

  // --- vitest.config.js ---
  if (fs.existsSync(vitestPath)) {
    try {
      const content = fs.readFileSync(vitestPath, 'utf-8');
      result.vitestConfig = true;

      const envMatch = content.match(/environment:\s+'([^']+)'/);
      if (envMatch) result.vitestEnvironment = envMatch[1];

      const setupMatch = content.match(/setupFiles:\s+\['([^']+)'\]/);
      if (setupMatch) result.vitestSetupFile = setupMatch[1];

      const timeoutMatch = content.match(/testTimeout:\s+(\d+)/);
      if (timeoutMatch) result.vitestTimeout = parseInt(timeoutMatch[1]);

      result.evidenceParts.push(`vitest.config.js: ${result.vitestEnvironment || '?'} env, ${result.vitestTimeout || '?'}ms timeout`);
    } catch (e) {
      result.evidenceParts.push(`error reading vitest.config.js: ${e.message}`);
    }
  }

  // Summary
  if (!result.hasNodeCompositionTest && !result.hasIntegrationTest && !result.vitestConfig) {
    result.evidenceParts.push('no test files found');
  }

  return {
    ...result,
    evidence: result.evidenceParts.join(' | '),
  };
}

async function detectDesignTokens() {
  const tokensDir = path.join(PROJECT_ROOT, 'design-tokens', 'tokens');
  const configPath = path.join(PROJECT_ROOT, 'design-tokens', 'config.js');
  const buildPath = path.join(PROJECT_ROOT, 'design-tokens', 'build.js');
  const pkgPath = path.join(PROJECT_ROOT, 'design-tokens', 'package.json');
  const tsConfigPath = path.join(PROJECT_ROOT, 'design-tokens', 'tokens-studio.config.json');
  const distDir = path.join(PROJECT_ROOT, 'design-tokens', 'dist');

  const result = {
    hasDesignTokens: false,
    tokenCategories: [],
    tokenCategoryCount: 0,
    totalTokens: 0,
    styleDictionaryVersion: null,
    outputFormats: [],
    hasBuiltOutput: false,
    hasFigmaIntegration: false,
    figmaProvider: null,
    tokenDetails: [],
    evidenceParts: [],
  };

  // Check if design-tokens directory exists
  if (!fs.existsSync(tokensDir)) {
    result.evidenceParts.push('no design-tokens directory');
    return { ...result, evidence: 'no design-tokens directory' };
  }

  // --- Scan token JSON files ---
  try {
    const tokenFiles = fs.readdirSync(tokensDir).filter(f => f.endsWith('.json'));
    if (tokenFiles.length === 0) {
      result.evidenceParts.push('no token JSON files found');
      return { ...result, evidence: 'no token JSON files found' };
    }

    result.hasDesignTokens = true;
    const allCategories = [];
    let totalTokens = 0;

    for (const file of tokenFiles) {
      try {
        const filePath = path.join(tokensDir, file);
        const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

        // Extract top-level categories from the JSON
        for (const [category, catContent] of Object.entries(content)) {
          // Count leaf tokens (entries with a "value" property)
          const tokenCount = countLeafTokens(catContent);

          // Extract sub-categories
          const subCategories = [];
          for (const [key, val] of Object.entries(catContent)) {
            if (val && typeof val === 'object' && !val.value) {
              // It's a sub-category if the child objects also don't have "value" directly
              const hasNestedValue = Object.values(val).some(v => v && typeof v === 'object' && v.value);
              if (hasNestedValue || Object.keys(val).length > 1) {
                subCategories.push(key);
              }
            }
          }

          allCategories.push({
            file,
            category,
            tokenCount,
            subCategories: subCategories.length > 0 ? subCategories : undefined,
            subCategoryCount: subCategories.length,
          });
          totalTokens += tokenCount;
        }
      } catch (e) {
        result.evidenceParts.push(`error parsing ${file}: ${e.message}`);
      }
    }

    result.tokenCategories = allCategories;
    result.tokenCategoryCount = allCategories.length;
    result.totalTokens = totalTokens;
    result.evidenceParts.push(`${allCategories.length} token categories (${totalTokens} total tokens)`);
  } catch (e) {
    result.evidenceParts.push(`error scanning tokens: ${e.message}`);
  }

  // --- Detect Style Dictionary version from package.json ---
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
      if (pkg.dependencies && pkg.dependencies['style-dictionary']) {
        result.styleDictionaryVersion = pkg.dependencies['style-dictionary'];
        result.evidenceParts.push(`Style Dictionary ${result.styleDictionaryVersion}`);
      }
    } catch {}
  }

  // --- Detect output formats from config.js ---
  if (fs.existsSync(configPath)) {
    try {
      const configContent = fs.readFileSync(configPath, 'utf-8');
      const formatRegex = /destination:\s+'[^']+'\n\s+format:\s+'([^']+)'/g;
      let fm;
      const formats = [];
      while ((fm = formatRegex.exec(configContent)) !== null) {
        formats.push(fm[1]);
      }

      const platformRegex = /(\w+):\s*\{[\s\S]*?transformGroup:\s+'([^']+)'/g;
      let pm;
      const platforms = [];
      while ((pm = platformRegex.exec(configContent)) !== null) {
        platforms.push({ name: pm[1], transformGroup: pm[2] });
      }

      result.outputFormats = platforms;
      result.evidenceParts.push(`${platforms.length} output platforms: ${platforms.map(p => p.name).join(', ')}`);
    } catch {}
  }

  // --- Detect built output ---
  if (fs.existsSync(distDir)) {
    try {
      const cssExists = fs.existsSync(path.join(distDir, 'css', '_variables.css'));
      const jsExists = fs.existsSync(path.join(distDir, 'js', 'tokens.js'));
      const jsonExists = fs.existsSync(path.join(distDir, 'json', 'tokens.json'));
      const tailwindExists = fs.existsSync(path.join(distDir, 'tailwind', 'tokens.json'));
      result.hasBuiltOutput = cssExists || jsExists || jsonExists || tailwindExists;
      if (result.hasBuiltOutput) {
        result.evidenceParts.push('built output detected in dist/');
      }
    } catch {}
  }

  // --- Detect Figma integration ---
  if (fs.existsSync(tsConfigPath)) {
    try {
      const tsConfig = JSON.parse(fs.readFileSync(tsConfigPath, 'utf-8'));
      result.hasFigmaIntegration = true;
      result.figmaProvider = tsConfig.provider || 'github';
      result.evidenceParts.push(`Figma integration (Tokens Studio, provider: ${result.figmaProvider})`);
    } catch {
      // tokens-studio.config.json has comments, so JSON.parse may fail
      // Fallback: detect by filename presence
      result.hasFigmaIntegration = true;
      result.figmaProvider = 'github (inferred from filename)';
      result.evidenceParts.push('Figma integration (tokens-studio.config.json present)');
    }
  }

  // --- Build summary ---
  const evidenceParts = result.evidenceParts.join(' | ');
  return { ...result, evidence: evidenceParts };
}

/**
 * Count leaf tokens in a nested token object.
 * A leaf token has a "value" property.
 */
function countLeafTokens(obj) {
  if (!obj || typeof obj !== 'object') return 0;
  if (obj.value !== undefined) return 1;
  let count = 0;
  for (const val of Object.values(obj)) {
    count += countLeafTokens(val);
  }
  return count;
}



async function detectGitWorkflow() {
  const gitConfigPath = path.join(PROJECT_ROOT, ".git", "config");
  const agentsMdPath = path.join(PROJECT_ROOT, "AGENTS.md");
  const claudeMdPath = path.join(PROJECT_ROOT, "CLAUDE.md");
  const gitIgnorePath = path.join(PROJECT_ROOT, ".gitignore");
  const gitHooksDir = path.join(PROJECT_ROOT, ".git", "hooks");

  const result = {
    isGitRepo: false,
    fileMode: false,
    bare: false,
    ignoreCase: true,
    hasNeverAutoCommitRule: false,
    hasHumanReviewsDiffs: false,
    agentCommitRule: null,
    hasPostTaskAutomation: false,
    hasGraphifyUpdate: false,
    hasGitIgnore: false,
    gitIgnorePatternCount: 0,
    gitIgnoreCategories: [],
    hasPreCommitHook: false,
    hasCommitMsgHook: false,
    commitCount: 0,
    recentCommits: [],
    evidenceParts: [],
  };

  // --- .git/config ---
  if (fs.existsSync(gitConfigPath)) {
    try {
      const cfg = fs.readFileSync(gitConfigPath, "utf-8");
      result.isGitRepo = true;
      result.fileMode = cfg.includes("filemode = false");
      result.bare = cfg.includes("bare = false");
      result.ignoreCase = cfg.includes("ignorecase = true");
      result.evidenceParts.push(".git/config: git repo initialized");
    } catch { result.evidenceParts.push("error reading .git/config"); }
  }

  // --- AGENTS.md ---
  if (fs.existsSync(agentsMdPath)) {
    try {
      const cfg = fs.readFileSync(agentsMdPath, "utf-8");
      result.hasNeverAutoCommitRule = cfg.includes("Git \u2014 never auto-commit");
      result.hasHumanReviewsDiffs = cfg.includes("human reviews diffs");
      if (cfg.includes("Do not run git commit")) {
        result.agentCommitRule = "Never auto-commit: agent lists changes, human reviews and commits";
      }
      result.evidenceParts.push("AGENTS.md: never-auto-commit rule found");
    } catch { result.evidenceParts.push("error reading AGENTS.md"); }
  }

  // --- CLAUDE.md ---
  if (fs.existsSync(claudeMdPath)) {
    try {
      const cfg = fs.readFileSync(claudeMdPath, "utf-8");
      result.hasPostTaskAutomation = cfg.includes("Post-Task Automation");
      result.hasGraphifyUpdate = cfg.includes("graphify update");
      result.evidenceParts.push("CLAUDE.md: post-task automation rules found");
    } catch { result.evidenceParts.push("error reading CLAUDE.md"); }
  }

  // --- .gitignore ---
  if (fs.existsSync(gitIgnorePath)) {
    try {
      const cfg = fs.readFileSync(gitIgnorePath, "utf-8");
      result.hasGitIgnore = true;
      const lines = cfg.split('\\n').map(function(l) { return l.trim(); }).filter(function(l) { return l && !l.startsWith("#"); });
      result.gitIgnorePatternCount = lines.length;
      var categories = [];
      if (cfg.indexOf("node_modules") >= 0) categories.push("node_modules");
      if (cfg.indexOf(".env") >= 0) categories.push("env files");
      if (cfg.indexOf("dist") >= 0) categories.push("build output");
      result.gitIgnoreCategories = categories;
      result.evidenceParts.push(".gitignore: " + result.gitIgnorePatternCount + " patterns");
    } catch { result.evidenceParts.push("error reading .gitignore"); }
  }

  // --- Git hooks ---
  if (fs.existsSync(gitHooksDir)) {
    try {
      var hooks = fs.readdirSync(gitHooksDir);
      result.hasPreCommitHook = hooks.indexOf("pre-commit") >= 0;
      result.hasCommitMsgHook = hooks.indexOf("commit-msg") >= 0;
    } catch {}
  }

  // --- Commit history ---
  try {
    const { execSync } = require("child_process");
    const logOutput = execSync("git log --oneline -5 2>&1", { cwd: PROJECT_ROOT, encoding: "utf-8", timeout: 5000 });
    const lines = logOutput.trim().split('\\n').filter(function(l) { return l.trim(); });
    result.commitCount = lines.length;
    result.recentCommits = lines.slice(0, 3).map(function(l) {
      return l.replace(/^[a-f0-9]+\s+/, "").slice(0, 60);
    });
    if (result.commitCount > 0) {
      result.evidenceParts.push("git log: " + result.commitCount + " commits");
    }
  } catch {
    result.evidenceParts.push("no commit history");
  }

  if (!result.isGitRepo) {
    result.evidenceParts.push("no git repository found");
  }

  return {
    ...result,
    evidence: result.evidenceParts.join(" | "),
  };
}



async function detectDocumentationPatterns() {
  const docsAdrDir = path.join(PROJECT_ROOT, 'docs', 'adr');
  const contextMdPath = path.join(PROJECT_ROOT, 'CONTEXT.md');
  const readmeMdPath = path.join(PROJECT_ROOT, 'README.md');
  const claudeMdPath = path.join(PROJECT_ROOT, 'CLAUDE.md');
  const agentsMdPath = path.join(PROJECT_ROOT, 'AGENTS.md');
  const lessonsDir = path.join(PROJECT_ROOT, 'lessons');
  const referenceDir = path.join(PROJECT_ROOT, 'reference');
  const tasteDir = path.join(PROJECT_ROOT, '.taste');

  const result = {
    hasAdrDir: false,
    adrFiles: [],
    adrCount: 0,
    adrYamlFrontmatter: false,
    adrStatuses: [],
    hasContextMd: false,
    contextLastUpdated: null,
    hasReadmeMd: false,
    hasClaudeMd: false,
    claudeTasteReference: false,
    claudeLoadOrder: false,
    hasAgentsMd: false,
    agentsGitRules: false,
    agentsWikiStructure: false,
    hasLessons: false,
    lessonCount: 0,
    lessonFormats: [],
    hasReference: false,
    referenceCount: 0,
    referenceFormats: [],
    hasTasteDir: false,
    tastePackageCount: 0,
    tasteActive: false,
    evidenceParts: [],
  };

  // --- docs/adr/ ---
  if (fs.existsSync(docsAdrDir)) {
    try {
      const files = fs.readdirSync(docsAdrDir).filter(function(f) { return f.endsWith('.md'); });
      result.hasAdrDir = true;
      result.adrFiles = files;
      result.adrCount = files.length;
      result.evidenceParts.push('docs/adr/: ' + result.adrCount + ' files');

      // Check ADR format: YAML frontmatter
      for (const file of files) {
        try {
          const filePath = path.join(docsAdrDir, file);
          const fileContent = fs.readFileSync(filePath, 'utf-8');
          const firstLine = fileContent.trim().split('\n')[0];
          if (firstLine === '---') {
            result.adrYamlFrontmatter = true;
            // Extract status from frontmatter
            const statusMatch = fileContent.match(/^status:\s*(\S+)/m);
            if (statusMatch && !result.adrStatuses.includes(statusMatch[1])) {
              result.adrStatuses.push(statusMatch[1]);
            }
          }
        } catch {}
      }
    } catch {
      result.evidenceParts.push('error reading docs/adr/');
    }
  }

  // --- CONTEXT.md ---
  if (fs.existsSync(contextMdPath)) {
    try {
      const cfg = fs.readFileSync(contextMdPath, 'utf-8');
      result.hasContextMd = true;
      const updatedMatch = cfg.match(/^> \*\*Última actualización:\*\*\s*(.+)$/m);
      if (updatedMatch) {
        result.contextLastUpdated = updatedMatch[1].trim();
      }
      result.evidenceParts.push('CONTEXT.md: project context document');
    } catch {
      result.evidenceParts.push('error reading CONTEXT.md');
    }
  }

  // --- README.md ---
  if (fs.existsSync(readmeMdPath)) {
    try {
      const cfg = fs.readFileSync(readmeMdPath, 'utf-8');
      result.hasReadmeMd = true;
      result.evidenceParts.push('README.md: project landing page');
    } catch {}
  }

  // --- CLAUDE.md ---
  if (fs.existsSync(claudeMdPath)) {
    try {
      const cfg = fs.readFileSync(claudeMdPath, 'utf-8');
      result.hasClaudeMd = true;
      result.claudeTasteReference = cfg.includes('.taste/') || cfg.includes('Taste System');
      result.claudeLoadOrder = cfg.includes('Prioridad 1') && cfg.includes('Load Order');
      result.evidenceParts.push('CLAUDE.md: agent entry point');
    } catch {}
  }

  // --- AGENTS.md ---
  if (fs.existsSync(agentsMdPath)) {
    try {
      const cfg = fs.readFileSync(agentsMdPath, 'utf-8');
      result.hasAgentsMd = true;
      result.agentsGitRules = cfg.includes('never auto-commit');
      result.agentsWikiStructure = cfg.includes('wiki/') && cfg.includes('index.md');
      result.evidenceParts.push('AGENTS.md: agent instructions');
    } catch {}
  }

  // --- lessons/ ---
  if (fs.existsSync(lessonsDir)) {
    try {
      const files = fs.readdirSync(lessonsDir);
      result.hasLessons = true;
      result.lessonCount = files.length;
      const formats = new Set();
      for (const f of files) {
        const ext = path.extname(f);
        if (ext) formats.add(ext);
      }
      result.lessonFormats = Array.from(formats);
      result.evidenceParts.push('lessons/: ' + result.lessonCount + ' files');
    } catch {}
  }

  // --- reference/ ---
  if (fs.existsSync(referenceDir)) {
    try {
      const files = fs.readdirSync(referenceDir);
      result.hasReference = true;
      result.referenceCount = files.length;
      const formats = new Set();
      for (const f of files) {
        const ext = path.extname(f);
        if (ext) formats.add(ext);
      }
      result.referenceFormats = Array.from(formats);
      result.evidenceParts.push('reference/: ' + result.referenceCount + ' files');
    } catch {}
  }

  // --- .taste/ ---
  if (fs.existsSync(tasteDir)) {
    try {
      const dirs = fs.readdirSync(tasteDir).filter(function(d) {
        const fullPath = path.join(tasteDir, d);
        return fs.statSync(fullPath).isDirectory() && d !== '.archive' && d.charAt(0) !== '.';
      });
      result.hasTasteDir = true;
      result.tastePackageCount = dirs.length;
      // Check if COMPILED_TASTE.md exists in project root
      result.tasteActive = fs.existsSync(path.join(PROJECT_ROOT, 'COMPILED_TASTE.md'));
      result.evidenceParts.push('.taste/: ' + result.tastePackageCount + ' packages' + (result.tasteActive ? ', active' : ''));
    } catch {}
  }

  if (!result.hasAdrDir && !result.hasContextMd && !result.hasClaudeMd && !result.hasLessons) {
    result.evidenceParts.push('no documentation found');
  }

  return {
    ...result,
    evidence: result.evidenceParts.join(' | '),
  };
}



async function detectPostTaskAutomation() {
  const claudePath = path.join(PROJECT_ROOT, 'CLAUDE.md');
  if (!fs.existsSync(claudePath)) {
    return { hasAutomation: false, evidence: 'no CLAUDE.md' };
  }

  try {
    const content = fs.readFileSync(claudePath, 'utf-8');
    const hasGraphify = content.includes('graphify update');
    const hasTaste = content.includes('.taste/') || content.includes('Taste System');

    return {
      hasAutomation: hasGraphify,
      hasTasteReference: hasTaste,
      evidence: `graphify post-task: ${hasGraphify}, taste reference: ${hasTaste}`
    };
  } catch {
    return { hasAutomation: false, evidence: 'error reading CLAUDE.md' };
  }
}

async function detectUIEventsPatterns() {
  const uiEventsPath = path.join(PROJECT_ROOT, 'frontend', 'ui_events.js');
  const nodeGraphPath = path.join(PROJECT_ROOT, 'frontend', 'node-graph.js');
  const nodeViewPath = path.join(PROJECT_ROOT, 'frontend', 'node-view.js');
  const mainJsPath = path.join(PROJECT_ROOT, 'frontend', 'main.js');

  const files = {
    uiEvents: fs.existsSync(uiEventsPath) ? fs.readFileSync(uiEventsPath, 'utf-8') : '',
    nodeGraph: fs.existsSync(nodeGraphPath) ? fs.readFileSync(nodeGraphPath, 'utf-8') : '',
    nodeView: fs.existsSync(nodeViewPath) ? fs.readFileSync(nodeViewPath, 'utf-8') : '',
    main: fs.existsSync(mainJsPath) ? fs.readFileSync(mainJsPath, 'utf-8') : '',
  };

  const result = {
    // Event binding
    eventBindingPattern: null,
    domReadyListeners: 0,
    delegationListeners: 0,
    storeEventSubscriptions: 0,

    // UI domains
    hasToolbarEvents: false,
    hasViewSwitcher: false,
    hasProjectDialog: false,
    hasTimelineControls: false,
    hasCopilotPanel: false,
    hasContextMenu: false,
    hasExportModal: false,
    hasFilePicker: false,
    hasCollapseToggles: false,

    // Node graph interactions
    hasNodeZoom: false,
    zoomRange: null,
    hasNodePan: false,
    panButton: null,
    hasWireRendering: false,
    wireRoleColors: [],
    hasNodeIndicators: false,
    nodeIndicatorTypes: [],
    hasWireInsert: false,
    hasConnectionDrag: false,
    hasViewerDots: false,
    hasDynamicPortPositioning: false,
    hasSvgBadge: false,

    // Node view interactions
    hasNodeDrag: false,
    hasMultiDrag: false,
    hasMarqueeSelection: false,
    hasConnHoverHighlight: false,
    hasAutoMerge: false,
    hasAutoConnect: false,
    hasMediaDragDrop: false,
    hasPasteImport: false,
    hasFloatingPreview: false,
    hasDynamicToolbar: false,
    hasEscapeClose: false,

    // Keyboard shortcuts
    keyboardShortcuts: [],

    evidenceParts: [],
  };

  // --- ui_events.js: Event binding layer ---
  if (files.uiEvents) {
    result.eventBindingPattern = 'DOMContentLoaded + querySelector';
    result.domReadyListeners = (files.uiEvents.match(/addEventListener\(/g) || []).length;

    // Detect UI domains
    if (files.uiEvents.includes('tabTimeline') || files.uiEvents.includes('tabNodes') || files.uiEvents.includes('tabSpline')) result.hasViewSwitcher = true;
    if (files.uiEvents.includes('projectModal') || files.uiEvents.includes('projectSaveName') || files.uiEvents.includes('openProjectDialog')) result.hasProjectDialog = true;
    if (files.uiEvents.includes('playBtn') || files.uiEvents.includes('seek') || files.uiEvents.includes('zoom')) result.hasTimelineControls = true;
    if (files.uiEvents.includes('cpToggle') || files.uiEvents.includes('cpMinimize') || files.uiEvents.includes('cpSend')) result.hasCopilotPanel = true;
    if (files.uiEvents.includes('ctx-delete') || files.uiEvents.includes('ctx-duplicate') || files.uiEvents.includes('ctxAction')) result.hasContextMenu = true;
    if (files.uiEvents.includes('exportFormat') || files.uiEvents.includes('exportResolution') || files.uiEvents.includes('exportFrameRange')) result.hasExportModal = true;
    if (files.uiEvents.includes('_filePicker')) result.hasFilePicker = true;
    if (files.uiEvents.includes('data-toggle') && files.uiEvents.includes('collapse')) result.hasCollapseToggles = true;

    // Toolbar events
    if (files.uiEvents.includes('cW') || files.uiEvents.includes('cH') || files.uiEvents.includes('globalDur')) result.hasToolbarEvents = true;

    // Event delegation pattern
    if (files.uiEvents.includes('[data-action')) result.delegationListeners = (files.uiEvents.match(/data-action/g) || []).length;

    result.evidenceParts.push(`ui_events.js: ${result.domReadyListeners} event listeners`);
  }

  // --- node-graph.js: Graph interactions ---
  if (files.nodeGraph) {
    // Zoom
    if (files.nodeGraph.includes('nodeZoom') && files.nodeGraph.includes('ZOOM_MIN') && files.nodeGraph.includes('ZOOM_MAX')) {
      result.hasNodeZoom = true;
      const zoomMin = files.nodeGraph.match(/ZOOM_MIN\s*=\s*([\d.]+)/);
      const zoomMax = files.nodeGraph.match(/ZOOM_MAX\s*=\s*([\d.]+)/);
      if (zoomMin && zoomMax) result.zoomRange = `${zoomMin[1]}–${zoomMax[1]}x`;
    }

    // Pan
    if (files.nodeGraph.includes('panDrag') && files.nodeGraph.includes('panX') && files.nodeGraph.includes('panY')) {
      result.hasNodePan = true;
      result.panButton = 'middle-button (mouse button 1)';
    }

    // Wire rendering
    if (files.nodeGraph.includes('renderWires') || files.nodeGraph.includes('C${')) result.hasWireRendering = true;

    // Wire colors by role
    const wireColors = [];
    if (files.nodeGraph.includes("toPortId === 'bg'")) wireColors.push('bg -> gold (#d4a017)');
    if (files.nodeGraph.includes("toPortId === 'fg'")) wireColors.push('fg -> green (#4caf50)');
    if (files.nodeGraph.includes("toPortId === 'mask'")) wireColors.push('mask -> blue (#3b82f6)');
    if (files.nodeGraph.includes("toPortId === 'matte'")) wireColors.push('matte -> yellow (#fc0)');
    result.wireRoleColors = wireColors;

    // Node indicators
    if (files.nodeGraph.includes('getNodeIndicators')) {
      result.hasNodeIndicators = true;
      const indicatorTypes = [];
      if (files.nodeGraph.includes("'sizing'")) indicatorTypes.push('Node Sizing (⊞)');
      if (files.nodeGraph.includes("'key'")) indicatorTypes.push('Key palette (🔑)');
      if (files.nodeGraph.includes("'color'")) indicatorTypes.push('Color wheels (●)');
      if (files.nodeGraph.includes("'curves'")) indicatorTypes.push('Curves (∿)');
      if (files.nodeGraph.includes("'qualifier'")) indicatorTypes.push('Qualifier (◑)');
      if (files.nodeGraph.includes("'blur'")) indicatorTypes.push('Blur/Sharpen (◎)');
      result.nodeIndicatorTypes = indicatorTypes;
    }

    // Wire insert (Fusion-style)
    if (files.nodeGraph.includes('checkWireInsertTarget') || files.nodeGraph.includes('performWireInsert')) result.hasWireInsert = true;

    // Connection drag
    if (files.nodeGraph.includes('startConnection') || files.nodeGraph.includes('updateTempWire')) result.hasConnectionDrag = true;

    // Viewer dots
    if (files.nodeGraph.includes('viewerDots') || files.nodeGraph.includes('assignViewer')) result.hasViewerDots = true;

    // Dynamic port positioning
    if (files.nodeGraph.includes('leftPortCount') && files.nodeGraph.includes('portY')) result.hasDynamicPortPositioning = true;

    // SVG badge
    if (files.nodeGraph.includes('parseSvgElements') || files.nodeGraph.includes('SVG_ELEMENT_ICONS')) result.hasSvgBadge = true;

    result.evidenceParts.push('node-graph.js: zoom/pan/wires/indicators/connections');
  }

  // --- node-view.js: Orchestrator ---
  if (files.nodeView) {
    // Node drag
    if (files.nodeView.includes('dragState') && files.nodeView.includes('mousemove')) result.hasNodeDrag = true;
    if (files.nodeView.includes('dragState.multi') || files.nodeView.includes('dragOffsets')) result.hasMultiDrag = true;

    // Marquee selection
    if (files.nodeView.includes('marqueeState') || files.nodeView.includes('finishMarquee')) result.hasMarqueeSelection = true;

    // Connection hover highlight
    if (files.nodeView.includes('drag-over') || files.nodeView.includes('connDrag.hoverNodeId')) result.hasConnHoverHighlight = true;

    // Auto-merge (Output→Output)
    if (files.nodeView.includes('autoMerge') || files.nodeView.includes("portType === 'output' && tT === 'output'")) {
      result.hasAutoMerge = true;
    }

    // Auto-connect (drop on node body)
    if (files.nodeView.includes('Gap 1') || files.nodeView.includes("portType === 'output'")) result.hasAutoConnect = true;

    // Media drag & drop
    if (files.nodeView.includes('dragover') || files.nodeView.includes('dropHighlightEl')) result.hasMediaDragDrop = true;

    // Paste from clipboard
    if (files.nodeView.includes('paste') && files.nodeView.includes('clipboardData')) result.hasPasteImport = true;

    // Floating preview
    if (files.nodeView.includes('openFloatingPreview') || files.nodeView.includes('setupFloatingPreview')) result.hasFloatingPreview = true;

    // Dynamic toolbar from NODE_DEFS
    if (files.nodeView.includes('buildNodeToolbar') || files.nodeView.includes('CATEGORY_LABELS')) result.hasDynamicToolbar = true;

    // Escape to close
    if (files.nodeView.includes("e.key === 'Escape'")) result.hasEscapeClose = true;

    result.evidenceParts.push('node-view.js: drag/selection/merge/media/toolbar');
  }

  // --- main.js: Keyboard shortcuts ---
  if (files.main) {
    const shortcuts = [];
    const shortcutMap = {
      "e.ctrlKey && e.key === 's'": 'Ctrl+S (Save)',
      "e.ctrlKey && e.key === 'o'": 'Ctrl+O (Open)',
      "e.ctrlKey && e.key === 'z'": 'Ctrl+Z (Undo)',
      "e.ctrlKey && e.key === 'y'": 'Ctrl+Y (Redo)',
      "e.ctrlKey && e.key === 'd'": 'Ctrl+D (Duplicate)',
      "e.ctrlKey && e.key === 't'": 'Ctrl+T (Swap Merge inputs)',
      "e.ctrlKey && e.key === 'a'": 'Ctrl+A (Select all)',
      "e.key === 'Delete'": 'Delete (Remove node)',
      "e.key === 'Escape'": 'Escape (Close menu / deselect)',
      "e.key === '1'": '1 (Timeline view)',
      "e.key === '2'": '2 (Nodes view)',
      "e.key === '3'": '3 (Spline view)',
    };
    for (const [pattern, label] of Object.entries(shortcutMap)) {
      // Check for both single-quote and double-quote variants
      const re1 = pattern.replace(/'/g, "'");
      const re2 = pattern.replace(/'/g, '"');
      if (files.main.includes(re1) || files.main.includes(re2)) {
        shortcuts.push(label);
      }
    }
    result.keyboardShortcuts = shortcuts;
    if (shortcuts.length > 0) {
      result.evidenceParts.push(`main.js: ${shortcuts.length} keyboard shortcuts`);
    }
  }

  // Build evidence summary
  const interactionCount = [result.hasNodeDrag, result.hasMarqueeSelection, result.hasConnectionDrag, result.hasWireInsert, result.hasAutoMerge, result.hasAutoConnect].filter(Boolean).length;
  const uiDomains = [result.hasViewSwitcher, result.hasProjectDialog, result.hasTimelineControls, result.hasCopilotPanel, result.hasContextMenu, result.hasExportModal].filter(Boolean).length;
  result.evidenceParts.push(`${uiDomains} UI domains, ${interactionCount} node graph interactions, ${result.keyboardShortcuts.length} shortcuts`);

  return {
    ...result,
    evidence: result.evidenceParts.join(' | '),
  };
}

async function detectPersistencePatterns() {
  const statePath = path.join(PROJECT_ROOT, 'frontend', 'state.js');
  const fsPath = path.join(PROJECT_ROOT, 'frontend', 'project-fs.js');
  const mainJsPath = path.join(PROJECT_ROOT, 'frontend', 'main.js');

  const files = {
    state: fs.existsSync(statePath) ? fs.readFileSync(statePath, 'utf-8') : '',
    projectFS: fs.existsSync(fsPath) ? fs.readFileSync(fsPath, 'utf-8') : '',
    main: fs.existsSync(mainJsPath) ? fs.readFileSync(mainJsPath, 'utf-8') : '',
  };

  const result = {
    hasLocalStorage: false,
    localStorageKeys: [],
    hasManifest: false,
    hasAutoSave: false,
    autoSaveDelay: 0,
    hasUndoRedo: false,
    maxHistory: 0,
    hasBatchOps: false,
    hasFSAA: false,
    fsaaMethods: [],
    hasBackendAPI: false,
    backendAPIEndpoints: [],
    hasProjectDialog: false,
    hasMediaPool: false,
    hasYouTubeImport: false,
    persistenceMethods: [],
    evidenceParts: [],
  };

  // --- state.js: localStorage persistence ---
  if (files.state) {
    // localStorage API
    if (files.state.includes('localStorage.getItem')) result.hasLocalStorage = true;
    if (files.state.includes('localStorage.setItem')) result.hasLocalStorage = true;
    if (files.state.includes('localStorage.removeItem')) result.hasLocalStorage = true;

    // Storage keys
    const keyRegex = /const\s+(STORAGE_KEY|PROJECT_MANIFEST_KEY|PROJECT_PREFIX)\s*=\s*'([^']+)'/g;
    let km;
    while ((km = keyRegex.exec(files.state)) !== null) {
      result.localStorageKeys.push({ name: km[1], value: km[2] });
    }

    // Project manifest
    if (files.state.includes('getManifest') && files.state.includes('saveManifest')) {
      result.hasManifest = true;
    }

    // Auto-save
    if (files.state.includes('autoSaveTimer') && files.state.includes('AUTO_SAVE_DELAY')) {
      result.hasAutoSave = true;
      const delayMatch = files.state.match(/AUTO_SAVE_DELAY\s*=\s*(\d+)/);
      if (delayMatch) result.autoSaveDelay = parseInt(delayMatch[1]);
    }

    // Undo/Redo
    if (files.state.includes('undoStack') && files.state.includes('redoStack')) {
      result.hasUndoRedo = true;
      const maxMatch = files.state.match(/MAX_HISTORY\s*=\s*(\d+)/);
      if (maxMatch) result.maxHistory = parseInt(maxMatch[1]);
    }

    // Batch operations
    if (files.state.includes('beginBatch') && files.state.includes('endBatch')) {
      result.hasBatchOps = true;
    }

    // Persistence methods exported
    const methods = ['saveToStorage', 'loadFromStorage', 'clearStorage', 'hasSavedProject',
      'saveProjectAs', 'loadProjectByName', 'listProjects', 'deleteProject',
      'getCurrentProjectName', 'onProjectNameChange'];
    const foundMethods = methods.filter(m => files.state.includes('function ' + m) || files.state.includes(m + ' ='));
    result.persistenceMethods.push(...foundMethods.map(m => `localStorage.${m}()`));

    result.evidenceParts.push('state.js: localStorage persistence + undo/redo system');
  }

  // --- project-fs.js: File System Access API ---
  if (files.projectFS) {
    if (files.projectFS.includes('showDirectoryPicker')) {
      result.hasFSAA = true;
    }

    // FSAA methods — detect by function name + '(' to handle both sync and async
    const fsaaMethods = ['isFSAvailable', 'pickSaveDirectory', 'pickLoadDirectory',
      'saveProjectToDir', 'loadProjectFromDir', 'ensureAssetsDir',
      'copyFileToAssets', 'readAsset', 'listAssets', 'getDirDisplayName'];
    for (const m of fsaaMethods) {
      // Check both 'function foo(' and 'async function foo(' patterns
      if (files.projectFS.includes(m + '(')) {
        result.fsaaMethods.push(m);
      }
    }

    result.persistenceMethods.push('File System Access API (project.json + assets/)');
    result.evidenceParts.push(`project-fs.js: ${result.fsaaMethods.length} FSAA methods`);
  }

  // --- main.js: backend API + disk save/load ---
  if (files.main) {
    // Backend API (Express server)
    if (files.main.includes('API.saveProject') || files.main.includes('API.loadProject') ||
        files.main.includes('API.listProjects') || files.main.includes('API.deleteProject')) {
      result.hasBackendAPI = true;
      const endpoints = [];
      if (files.main.includes('API.saveProject')) endpoints.push('saveProject');
      if (files.main.includes('API.loadProject')) endpoints.push('loadProject');
      if (files.main.includes('API.listProjects')) endpoints.push('listProjects');
      if (files.main.includes('API.deleteProject')) endpoints.push('deleteProject');
      result.backendAPIEndpoints = endpoints;
    }

    // Disk save/load via FSAA
    if (files.main.includes('saveToDisk') && files.main.includes('loadFromDisk')) {
      result.hasFSAA = true; // also detected in main.js
      if (!result.persistenceMethods.includes('File System Access API (project.json + assets/)')) {
        result.persistenceMethods.push('File System Access API (via main.js saveToDisk/loadFromDisk)');
      }
    }

    // Project dialog
    if (files.main.includes('openProjectDialog') && files.main.includes('closeProjectDialog')) {
      result.hasProjectDialog = true;
    }

    // Media pool
    if (files.main.includes('mediaPool') || files.main.includes('initMediaPool')) {
      result.hasMediaPool = true;
    }

    // YouTube import
    if (files.main.includes('downloadFromYouTube')) {
      result.hasYouTubeImport = true;
    }

    result.evidenceParts.push('main.js: backend API + disk save/load + project dialog');
  }

  // Build final evidence
  const count = result.persistenceMethods.length;
  result.evidenceParts.push(`${count} persistence methods: ${result.persistenceMethods.join(', ')}`);

  return {
    ...result,
    evidence: result.evidenceParts.join(' | '),
  };
}

async function detectAnimationPatterns() {
  const timelinePath = path.join(PROJECT_ROOT, 'frontend', 'timeline-controller.js');
  const splinePath = path.join(PROJECT_ROOT, 'frontend', 'spline-view.js');
  const statePath = path.join(PROJECT_ROOT, 'frontend', 'state.js');
  const enginePath = path.join(PROJECT_ROOT, 'frontend', 'engine.js');
  const enginesGenPath = path.join(PROJECT_ROOT, 'frontend', 'engine-generators.js');

  const files = {
    timeline: fs.existsSync(timelinePath) ? fs.readFileSync(timelinePath, 'utf-8') : '',
    spline: fs.existsSync(splinePath) ? fs.readFileSync(splinePath, 'utf-8') : '',
    state: fs.existsSync(statePath) ? fs.readFileSync(statePath, 'utf-8') : '',
    engine: fs.existsSync(enginePath) ? fs.readFileSync(enginePath, 'utf-8') : '',
    generators: fs.existsSync(enginesGenPath) ? fs.readFileSync(enginesGenPath, 'utf-8') : '',
  };

  const result = {
    keyframeAPI: false,
    modifierAPI: false,
    animatedPropsAPI: false,
    propColorsCount: 0,
    defaultRangesCount: 0,
    easingTypes: [],
    modifierTypes: [],
    animatableLayerTypes: [],
    evalPropNodeTypes: [],
    hasSplineView: false,
    hasEvalPropInEngine: false,
    hasFramePipeline: false,
    totalPropColors: 0,
    propColorEntries: {},
    evidenceParts: [],
  };

  // --- timeline-controller.js ---
  if (files.timeline) {
    if (/export\s+\{\s*[^}]*\bsetKeyframe\b[^}]*\}/s.test(files.timeline)) result.keyframeAPI = true;
    if (/export\s+\{\s*[^}]*\bsetModifier\b[^}]*\}/s.test(files.timeline)) result.modifierAPI = true;
    if (/export\s+\{\s*[^}]*\btoggleAnimatedProp\b[^}]*\}/s.test(files.timeline)) result.animatedPropsAPI = true;

    // Modifier types (check engine.js for evalOscillate/evalShake functions)
    if (files.engine.includes('evalOscillate')) result.modifierTypes.push('oscillate');
    if (files.engine.includes('evalShake')) result.modifierTypes.push('shake');
    if (files.engine.includes('evalStep')) result.modifierTypes.push('step');

    result.evidenceParts.push('timeline-controller.js: keyframe+modifier+animatedProps API');
  }

  // --- spline-view.js ---
  if (files.spline) {
    // Extract PROP_COLORS
    const propColorsMatch = files.spline.match(/const PROP_COLORS\s*=\s*\{([\s\S]*?)\};/);
    if (propColorsMatch) {
      const propColorsBlock = propColorsMatch[1];
      const propEntries = propColorsBlock.match(/\s{2}([\w]+):/g);
      result.propColorsCount = propEntries ? propEntries.length : 0;
      result.totalPropColors = propEntries ? propEntries.length : 0;

      // Extract prop -> color mapping
      const propRegex = /\s{2}([\w]+):\s*'([^']+)'/g;
      let pm;
      while ((pm = propRegex.exec(propColorsBlock)) !== null) {
        result.propColorEntries[pm[1]] = pm[2];
      }
    }

    // DEFAULT_RANGES
    const defaultRangesMatch = files.spline.match(/const DEFAULT_RANGES\s*=\s*\{([\s\S]*?)\};/);
    if (defaultRangesMatch) {
      const rangeLines = defaultRangesMatch[1].match(/\s{2}[\w]+:/g);
      result.defaultRangesCount = rangeLines ? rangeLines.length : 0;
    }

    // Easing types from the context menu
    if (files.spline.includes('linear')) result.easingTypes.push('linear');
    if (files.spline.includes('easeIn') && files.spline.includes('Ease In')) result.easingTypes.push('easeIn');
    if (files.spline.includes('easeOut') && files.spline.includes('Ease Out')) result.easingTypes.push('easeOut');
    if (files.spline.includes('easeInOut') && files.spline.includes('Ease In Out')) result.easingTypes.push('easeInOut');
    if (files.spline.includes('bezier')) result.easingTypes.push('bezier');

    result.hasSplineView = files.spline.includes('renderSplineEditor') && files.spline.includes('initSplineEditor');

    // Layer types with animatable props
    if (files.spline.includes("layer.type === 'text'")) result.animatableLayerTypes.push('text');
    if (files.spline.includes("layer.type === 'image'")) result.animatableLayerTypes.push('image');
    if (files.spline.includes("layer.type === 'video'")) result.animatableLayerTypes.push('video');

    result.evidenceParts.push('spline-view.js: Fusion-style spline editor with bezier handles');
  }

  // --- state.js ---
  if (files.state) {
    if (files.state.includes('animationChannels')) result.evidenceParts.push('state.js: animationChannels store');
    if (files.state.includes('modifiers')) result.evidenceParts.push('state.js: modifiers store');
    if (files.state.includes('animatedProps')) result.evidenceParts.push('state.js: animatedProps store');
  }

  // --- engine.js (evalProp, renderFrame, drawLayerBase) ---
  if (files.engine) {
    result.hasEvalPropInEngine = files.engine.includes('function evalProp');
    result.hasFramePipeline = files.engine.includes('function renderFrame') && files.engine.includes('function drawLayerBase');

    // animated layer types from drawLayerBase
    if (files.engine.includes("l.type === 'image'")) {
      if (!result.animatableLayerTypes.includes('image')) result.animatableLayerTypes.push('image');
    }
    if (files.engine.includes("l.type === 'text'")) {
      if (!result.animatableLayerTypes.includes('text')) result.animatableLayerTypes.push('text');
    }
    if (files.engine.includes("l.type === 'video'")) {
      if (!result.animatableLayerTypes.includes('video')) result.animatableLayerTypes.push('video');
    }

    result.evidenceParts.push('engine.js: evalProp + renderFrame pipeline');
  }

  // --- engine-generators.js (evalPropA node types) ---
  if (files.generators) {
    // Find which generator node types call evalPropA in their switch cases
    const caseRegex = /case\s+'([^']+)':/g;
    const evalPropARefs = (files.generators.match(/evalPropA\(/g) || []).length;
    const switchCases = [];
    let casePositions = [];
    let cm;
    while ((cm = caseRegex.exec(files.generators)) !== null) {
      casePositions.push({ key: cm[1], index: cm.index });
    }
    for (let i = 0; i < casePositions.length; i++) {
      const start = casePositions[i].index;
      // El siguiente case empieza en la posición del próximo, o fin de archivo
      const end = i < casePositions.length - 1 ? casePositions[i + 1].index : files.generators.length;
      const caseBlock = files.generators.slice(start, end);
      if (caseBlock.includes('evalPropA')) {
        switchCases.push(casePositions[i].key);
      }
    }
    result.evalPropNodeTypes = [...new Set(switchCases)];

    result.evidenceParts.push(`engine-generators.js: ${evalPropARefs} evalPropA calls across ${result.evalPropNodeTypes.length} node types`);
  }

  // Build summary evidence
  const evidenceParts = [
    `keyframeAPI: ${result.keyframeAPI}`,
    `modifierAPI: ${result.modifierAPI}`,
    `animatedPropsAPI: ${result.animatedPropsAPI}`,
    `propColors: ${result.propColorsCount}`,
    `defaultRanges: ${result.defaultRangesCount}`,
    `easingTypes: ${result.easingTypes.join(',') || 'none'}`,
    `splineView: ${result.hasSplineView}`,
    `evalPropNodeTypes: ${result.evalPropNodeTypes.length}`,
    ...result.evidenceParts,
  ];

  return {
    ...result,
    evidence: evidenceParts.join(' | '),
  };
}

// --- Generación de sugerencias ---

function generateSuggestions(results) {
  const suggestions = [];

  // Package manager → tools
  if (results.packageManager.detected !== 'unknown') {
    suggestions.push({
      package: 'tools',
      category: 'package management',
      lines: [
        `- \`${results.packageManager.detected}\` como gestor de paquetes principal (confidence: ${results.packageManager.confidence.toFixed(2)}) // survey-detected`
      ],
      evidence: results.packageManager.evidence
    });
  }

  // Test framework → tools
  if (results.testFramework.detected !== 'unknown') {
    suggestions.push({
      package: 'tools',
      category: 'testing',
      lines: [
        `- ${results.testFramework.detected} como framework de tests (confidence: ${results.testFramework.confidence.toFixed(2)}) // survey-detected`
      ],
      evidence: results.testFramework.evidence
    });
  }

  // Bundler → tools
  if (results.bundler.detected !== 'unknown') {
    const isVanilla = results.bundler.detected.includes('none');
    suggestions.push({
      package: 'tools',
      category: isVanilla ? 'package management' : 'build',
      lines: [
        isVanilla
          ? `- Sin bundler — ES modules nativos (confidence: ${results.bundler.confidence.toFixed(2)}) // survey-detected`
          : `- Bundler: ${results.bundler.detected} (confidence: ${results.bundler.confidence.toFixed(2)}) // survey-detected`
      ],
      evidence: results.bundler.evidence
    });
  }

  // Indentation → tools / frontend
  if (results.indentation.detected !== 'unknown') {
    suggestions.push({
      package: 'frontend',
      category: 'css',
      lines: [
        `- Indentación: ${results.indentation.detected} (confidence: ${results.indentation.confidence.toFixed(2)}) // survey-detected`
      ],
      evidence: results.indentation.evidence
    });
  }

  // Code style → frontend
  if (results.codeStyle.semicolons !== 'unknown') {
    suggestions.push({
      package: 'core',
      category: 'code style',
      lines: [
        `- ${results.codeStyle.semicolons === 'semicolons' ? 'Punto y coma obligatorio' : 'Sin punto y coma'} (confidence: 0.75) // survey-detected`,
        `- Comillas ${results.codeStyle.quotes === 'single' ? 'simples' : 'dobles'} como default (confidence: 0.70) // survey-detected`
      ],
      evidence: results.codeStyle.evidence
    });
  }

  // Node types from engine.js NODE_DEFS
  if (results.nodeEngine.totalNodes > 0) {
    const catEntries = Object.entries(results.nodeEngine.categories);
    const catSummary = catEntries.map(([cat, nodes]) => `  - **${cat}** (${nodes.length}): ${nodes.slice(0, 4).join(', ')}${nodes.length > 4 ? '...' : ''}`).join('\n');

    suggestions.push({
      package: 'nodes',
      category: 'node types',
      lines: [
        `- ${results.nodeEngine.totalNodes} tipos de nodo definidos en NODE_DEFS (engine.js) en ${results.nodeEngine.categoriesCount} categorías (confidence: 1.0) // survey-detected`,
        `- ${results.nodeEngine.maskInputCount}/${results.nodeEngine.totalNodes} nodos tienen soporte de máscara (maskInput: true) (confidence: 0.95)`,
        `- ${results.nodeEngine.generatorCount} generadores animables (source + generate) (confidence: 0.90)`
      ],
      evidence: results.nodeEngine.evidence
    });
  }



  // Node categories overview → nodes
  if (results.nodeEngine.totalNodes > 0 && Object.keys(results.nodeEngine.categories).length > 0) {
    const catEntries = Object.entries(results.nodeEngine.categories);
    const categoryLines = catEntries.map(([cat, nodes]) =>
      `- **${cat}**: ${nodes.length} tipos — ${nodes.join(', ')} (confidence: 0.95) // survey-detected`
    );

    suggestions.push({
      package: 'nodes',
      category: 'category breakdown',
      lines: [
        `- ${results.nodeEngine.categoriesCount} categorías de nodos en el toolbar (confidence: 0.98) // survey-detected`,
        ...categoryLines
      ],
      evidence: results.nodeEngine.evidence
    });
  }

  // Export formats → tools (enhanced)
  if (results.exportFormats.formats.length > 0) {
    const formatLines = [
      `- ${results.exportFormats.formats.length} formatos de exportación detectados (confidence: 0.95) // survey-detected`,
      ...results.exportFormats.formats.map(f => `  - ${f} (confidence: 0.90) // survey-detected`),
    ];
    if (results.exportFormats.hasZIPExport) formatLines.push(`- ZIP packaging con ZipWriter store-mode (confidence: 0.95) // survey-detected`);
    if (results.exportFormats.hasStandaloneEngine) formatLines.push(`- Standalone engine via buildStandaloneEngineSource() (confidence: 0.90) // survey-detected`);
    if (results.exportFormats.hasYouTubeImport) formatLines.push(`- YouTube import via backend API + scene detection (confidence: 0.85) // survey-detected`);
    if (results.exportFormats.hasSceneDetection) formatLines.push(`- Scene detection con FFmpeg.wasm (confidence: 0.85) // survey-detected`);

    formatLines.push(`- Resolución por defecto: ${results.exportFormats.defaultResolution} @ ${results.exportFormats.defaultFPS}fps (confidence: 0.95) // survey-detected`);

    suggestions.push({
      package: 'tools',
      category: 'export',
      lines: formatLines,
      evidence: results.exportFormats.evidence
    });
  }

  // Persistence patterns → skills
  if (results.persistence.hasLocalStorage || results.persistence.hasFSAA || results.persistence.hasBackendAPI) {
    const persistLines = [];

    persistLines.push(`- ${results.persistence.persistenceMethods.length} métodos de persistencia detectados (confidence: 0.95) // survey-detected`);

    if (results.persistence.hasLocalStorage) {
      persistLines.push(`- localStorage: ${results.persistence.persistenceMethods.filter(m => m.includes('localStorage')).length} métodos`);
      if (results.persistence.localStorageKeys.length > 0) {
        for (const k of results.persistence.localStorageKeys) {
          persistLines.push(`  - Clave \`${k.name}\` = \`${k.value}\``);
        }
      }
    }

    if (results.persistence.hasAutoSave) {
      persistLines.push(`- Auto-save debounced (${results.persistence.autoSaveDelay}ms) via state:changed events (confidence: 0.95) // survey-detected`);
    }

    if (results.persistence.hasUndoRedo) {
      persistLines.push(`- Undo/Redo: ${results.persistence.maxHistory} niveles, snapshots automáticos en SNAPSHOT_KEYS (confidence: 0.98) // survey-detected`);
    }

    if (results.persistence.hasBatchOps) {
      persistLines.push(`- Batch operations: beginBatch/endBatch para operaciones atómicas (confidence: 0.95) // survey-detected`);
    }

    if (results.persistence.hasManifest) {
      persistLines.push(`- Project manifest (${results.persistence.localStorageKeys.filter(k => k.name === 'PROJECT_MANIFEST_KEY').map(k => k.value).join(', ')}) (confidence: 0.90) // survey-detected`);
    }

    if (results.persistence.hasFSAA) {
      persistLines.push(`- File System Access API: ${results.persistence.fsaaMethods.length} métodos para proyecto en disco (project.json + assets/) (confidence: 0.95) // survey-detected`);
    }

    if (results.persistence.hasBackendAPI) {
      persistLines.push(`- Backend API (Express server): ${results.persistence.backendAPIEndpoints.length} endpoints (confidence: 0.90) // survey-detected`);
      for (const ep of results.persistence.backendAPIEndpoints) {
        persistLines.push(`  - API.${ep}()`);
      }
    }

    if (results.persistence.hasProjectDialog) {
      persistLines.push(`- Project dialog: save modal + load modal + project list (confidence: 0.95) // survey-detected`);
    }

    persistLines.push(`- 3 métodos de persistencia: localStorage + File System Access API + Node.js server (confidence: 0.95) // survey-detected`);

    suggestions.push({
      package: 'skills',
      category: 'persistence system (detected)',
      lines: persistLines,
      evidence: results.persistence.evidence
    });
  }

  // Render pipeline → nodes
  if (results.renderPipeline.engineFiles.length > 0) {
    const dispatchLines = [];
    for (const entry of results.renderPipeline.rendererDispatch) {
      const typeList = entry.types.length <= 5 ? entry.types.join(', ') : `${entry.types.length} tipos`;
      dispatchLines.push(`- **${entry.renderer}**: ${typeList} (confidence: 0.98) // survey-detected`);
    }

    dispatchLines.push(`- Pipeline stages (${results.renderPipeline.pipelineStages.length}):`);
    for (const stage of results.renderPipeline.pipelineStages) {
      dispatchLines.push(`  - ${stage}`);
    }

    if (results.renderPipeline.hasStaticNodeCache) dispatchLines.push(`- Static node cache con isNodeSubtreeStatic (confidence: 0.95) // survey-detected`);
    if (results.renderPipeline.hasCanvasPool) dispatchLines.push(`- Canvas pooling reutilizable (confidence: 0.95) // survey-detected`);
    if (results.renderPipeline.hasPowerWindow) dispatchLines.push(`- Power Window (DaVinci Resolve-style) (confidence: 0.95) // survey-detected`);
    if (results.renderPipeline.hasNodeSizing) dispatchLines.push(`- Node Sizing: zoom, pan, rotate, flip, crop (confidence: 0.95) // survey-detected`);
    if (results.renderPipeline.hasOutputGain) dispatchLines.push(`- Output Gain: blending con original (confidence: 0.95) // survey-detected`);
    if (results.renderPipeline.hasEffectMask) dispatchLines.push(`- Effect Mask con Input Gain (confidence: 0.95) // survey-detected`);

    dispatchLines.push(`- ${results.renderPipeline.engineFiles.length} engine modules: ${results.renderPipeline.engineFiles.join(', ')}`);

    suggestions.push({
      package: 'nodes',
      category: 'render pipeline (detected)',
      lines: dispatchLines,
      evidence: results.renderPipeline.evidence
    });
  }

  // Animation patterns → animation
  if (results.animation.keyframeAPI || results.animation.modifierAPI) {
    const propColorLines = Object.entries(results.animation.propColorEntries || {})
      .map(([prop, color]) => `  - ${prop}: \`${color}\``);

    suggestions.push({
      package: 'animation',
      category: 'animation system (detected)',
      lines: [
        `- Sistema de animación de 3 capas: animatedProps (diamantes) + Keyframes + Modifiers (confidence: 0.95) // survey-detected`,
        `- keyframeAPI: setKeyframe / removeKeyframe / getKeyframes (confidence: 0.98) // survey-detected`,
        `- modifierAPI: setModifier / removeModifier / getModifier (confidence: 0.95) // survey-detected`,
        `- animatedPropsAPI: toggleAnimatedProp / isAnimatedProp / getAnimatedPropKeys (confidence: 0.95) // survey-detected`,
        `- ${results.animation.easingTypes.length} easing types: ${results.animation.easingTypes.join(', ')} (confidence: 0.98) // survey-detected`,
        `- ${results.animation.modifierTypes.length} modifier types: ${results.animation.modifierTypes.join(', ') || 'none'} (confidence: 0.95) // survey-detected`,
        `- Spline View con handles bezier, draggable keyframes, inspector (confidence: 0.95) // survey-detected`,
      ],
      evidence: results.animation.evidence
    });
  }

  if (results.animation.propColorsCount > 0) {
    const propNames = Object.keys(results.animation.propColorEntries || {});
    // Group by domain
    const layerProps = ['size','x','y','opacity','brightness','contrast','spacing','saturate','hue','rotation','scale','gain','tracking'];
    const nodeProps = ['cx','cy','rx','ry','radius','angle','width','height','columns','rows','gap','lineWidth','seed','time'];
    const layerFound = propNames.filter(p => layerProps.includes(p));
    const nodeFound = propNames.filter(p => nodeProps.includes(p));

    suggestions.push({
      package: 'animation',
      category: 'animatable properties (detected)',
      lines: [
        `- ${results.animation.propColorsCount} propiedades animables con color asignado en PROP_COLORS (confidence: 0.98) // survey-detected`,
        `- ${results.animation.defaultRangesCount} propiedades con DEFAULT_RANGES predefinidos (confidence: 0.95) // survey-detected`,
        `- Props de capa: ${layerFound.join(', ')} (confidence: 0.95) // survey-detected`,
        `- Props de nodo: ${nodeFound.join(', ')} (confidence: 0.95) // survey-detected`,
        `- Tipos de capa animables: ${results.animation.animatableLayerTypes.join(', ')} (confidence: 0.98) // survey-detected`,
      ],
      evidence: `PROP_COLORS: ${results.animation.propColorsCount}, DEFAULT_RANGES: ${results.animation.defaultRangesCount}`
    });
  }

  if (results.animation.evalPropNodeTypes.length > 0) {
    suggestions.push({
      package: 'animation',
      category: 'evalPropA node types (detected)',
      lines: [
        `- ${results.animation.evalPropNodeTypes.length} tipos de nodo usan \`evalPropA()\` para animación por keyframes + modifiers (confidence: 0.98) // survey-detected`,
        `- Nodos animables: ${results.animation.evalPropNodeTypes.join(', ')}`,
        `- Evaluación combinada: evaluateChannel(keyframes) + evalModifier(modifier) (confidence: 0.95) // survey-detected`,
      ],
      evidence: `evalPropA node types: ${results.animation.evalPropNodeTypes.join(', ')}`
    });
  }

  // Schema patterns → core
  if (results.schemaNodes.nodeDefinitionCount > 0) {
    const schemaLines = [];

    schemaLines.push(`- Schema version ${results.schemaNodes.schemaVersion} con ${results.schemaNodes.nodeDefinitionCount} definiciones de nodo en ${results.schemaNodes.nodeCategories.length} categorías (confidence: 0.98) // survey-detected`);
    schemaLines.push(`- ${results.schemaNodes.portTypeCount} tipos de puerto: ${results.schemaNodes.portTypes.map(p => `${p.name} (max ${p.maxConnections} conn)`).join(', ')} (confidence: 0.98) // survey-detected`);
    schemaLines.push(`- ${results.schemaNodes.propertyTypeCount} tipos de propiedad: ${results.schemaNodes.propertyTypes.map(p => `${p.name} → widget:${p.widget}`).join(', ')} (confidence: 0.98) // survey-detected`);
    schemaLines.push(`- schema.json es la única fuente de verdad — no inventar tipos, nodos o parámetros que no existan aquí (confidence: 0.98) // survey-detected`);

    if (results.schemaNodes.hasDataFlow) {
      schemaLines.push(`- ${results.schemaNodes.dataFlowRules} reglas de flujo de datos en dataFlow.rules (confidence: 0.95) // survey-detected`);
    }
    if (results.schemaNodes.hasAnimationSystem) {
      schemaLines.push(`- Sistema de animación definido en schema: ${results.schemaNodes.animationModifiers.length} modifiers (${results.schemaNodes.animationModifiers.join(', ')}) (confidence: 0.95) // survey-detected`);
    }
    if (results.schemaNodes.hasRenderPipeline) {
      schemaLines.push(`- Pipeline de render definido: ${results.schemaNodes.pipelineSteps.length} pasos, caché: ${results.schemaNodes.hasCaching} (confidence: 0.95) // survey-detected`);
    }
    if (results.schemaNodes.hasLayerModel) {
      schemaLines.push(`- Modelo de capas con ${results.schemaNodes.layerFields.length} campos: ${results.schemaNodes.layerFields.join(', ')} (confidence: 0.95) // survey-detected`);
    }
    if (results.schemaNodes.hasGlobalEffects) {
      schemaLines.push(`- Efectos globales: ${results.schemaNodes.globalEffectParams.join(', ')} (confidence: 0.90) // survey-detected`);
    }
    if (results.schemaNodes.blendModeCount > 0) {
      schemaLines.push(`- ${results.schemaNodes.blendModeCount} modos de mezcla definidos con compositeOp mapping (confidence: 0.95) // survey-detected`);
    }
    if (results.schemaNodes.easingFunctionCount > 0) {
      schemaLines.push(`- ${results.schemaNodes.easingFunctionCount} funciones de easing definidas con fórmulas (confidence: 0.95) // survey-detected`);
    }
    if (results.schemaNodes.hasMediaTypes) {
      schemaLines.push(`- ${results.schemaNodes.mediaTypeFormats.length} formatos de media soportados (image/video/audio) (confidence: 0.95) // survey-detected`);
    }

    suggestions.push({
      package: 'core',
      category: 'schema (detected)',
      lines: schemaLines,
      evidence: results.schemaNodes.evidence
    });
  }

  
  // Documentation / ADR patterns → tools
  if (results.documentationPatterns.hasAdrDir || results.documentationPatterns.hasContextMd || results.documentationPatterns.hasClaudeMd) {
    const docLines = [];

    if (results.documentationPatterns.hasAdrDir) {
      docLines.push(`- ${results.documentationPatterns.adrCount} ADR(s) en docs/adr/ con formato NNNN-description.md (confidence: 0.98) // survey-detected`);
      docLines.push(`- ADR statuses: ${results.documentationPatterns.adrStatuses.join(', ') || 'accepted'} (confidence: 0.98) // survey-detected`);
    }
    if (results.documentationPatterns.hasContextMd) {
      docLines.push(`- CONTEXT.md: documento integral del proyecto (última actualización: ${results.documentationPatterns.contextLastUpdated || '?'}) (confidence: 0.95) // survey-detected`);
    }
    if (results.documentationPatterns.hasReadmeMd) {
      docLines.push('- README.md: landing page del proyecto con enlaces a docs/ (confidence: 0.95) // survey-detected');
    }
    if (results.documentationPatterns.hasClaudeMd) {
      const tasteRef = results.documentationPatterns.claudeTasteReference ? ', referencia al Taste System' : '';
      docLines.push(`- CLAUDE.md: entry point del agente${tasteRef} (confidence: 0.98) // survey-detected`);
    }
    if (results.documentationPatterns.hasAgentsMd) {
      const gitRules = results.documentationPatterns.agentsGitRules ? ' + reglas git' : '';
      docLines.push(`- AGENTS.md: instrucciones específicas para el agente${gitRules} (confidence: 0.98) // survey-detected`);
    }
    if (results.documentationPatterns.hasLessons) {
      docLines.push(`- ${results.documentationPatterns.lessonCount} lecciones en lessons/ (${results.documentationPatterns.lessonFormats.join(', ')}) (confidence: 0.90) // survey-detected`);
    }
    if (results.documentationPatterns.hasReference) {
      docLines.push(`- ${results.documentationPatterns.referenceCount} archivos de referencia en reference/ (${results.documentationPatterns.referenceFormats.join(', ')}) (confidence: 0.90) // survey-detected`);
    }
    if (results.documentationPatterns.tasteActive) {
      docLines.push(`- Taste System activo: ${results.documentationPatterns.tastePackageCount} packages (confidence: 1.0) // survey-detected`);
    }

    suggestions.push({
      package: 'tools',
      category: 'documentation / ADR (detected)',
      lines: docLines,
      evidence: results.documentationPatterns.evidence
    });
  }

  // Design tokens → design
  // Testing patterns → tools
  if (results.testingPatterns.hasNodeCompositionTest || results.testingPatterns.hasIntegrationTest) {
    const testLines = [];

    // Node composition test
    if (results.testingPatterns.hasNodeCompositionTest) {
      testLines.push(`- Browser-injected node composition test (IIFE + <script> tag) (confidence: 1.0) // survey-detected`);
      testLines.push(`- Console error interception via \`console.error\` / \`console.warn\` override (confidence: 1.0) // survey-detected`);
      testLines.push(`- ${results.testingPatterns.testFunctions.length} helper functions: ${results.testingPatterns.testFunctions.join(', ')} (confidence: 0.98) // survey-detected`);
      if (results.testingPatterns.sourceNodeCount > 0) testLines.push(`- ${results.testingPatterns.sourceNodeCount} source node types tested (confidence: 0.95) // survey-detected`);
      if (results.testingPatterns.effectNodeCount > 0) testLines.push(`- ${results.testingPatterns.effectNodeCount} effect node types tested (confidence: 0.95) // survey-detected`);
      if (results.testingPatterns.dualInputCount > 0) testLines.push(`- ${results.testingPatterns.dualInputCount} dual-input node types (merge, displacement, channel-boolean) (confidence: 0.95) // survey-detected`);
      if (results.testingPatterns.chainCount > 0) testLines.push(`- ${results.testingPatterns.chainCount} composition chain tests (source → effect → ... → output) (confidence: 0.98) // survey-detected`);
      if (results.testingPatterns.resultsStorage) testLines.push(`- Results stored in ${results.testingPatterns.resultsStorage} for inspection (confidence: 0.98) // survey-detected`);
    }

    // Integration test
    if (results.testingPatterns.hasIntegrationTest) {
      testLines.push(`- Playwright integration test (chromium, headless) (confidence: 1.0) // survey-detected`);
      testLines.push(`- ${results.testingPatterns.phaseCount} test phases: ${results.testingPatterns.testPhases.join(' → ')} (confidence: 0.98) // survey-detected`);
      testLines.push(`- ${results.testingPatterns.staticIdCount} static IDs verified (confidence: 0.95) // survey-detected`);
      testLines.push(`- ${results.testingPatterns.dataActionCount} data-action attributes verified (confidence: 0.95) // survey-detected`);
      testLines.push(`- ${results.testingPatterns.interactiveTestCount} interactive behavior tests (tab switching, modals, buttons) (confidence: 0.90) // survey-detected`);
      if (results.testingPatterns.consoleErrorCollector) testLines.push(`- Console error collector during test run (confidence: 0.95) // survey-detected`);
      if (results.testingPatterns.serverStartupRetry) testLines.push(`- Server startup with retry logic (maxRetries, 500ms interval) (confidence: 0.90) // survey-detected`);
      if (results.testingPatterns.checkFunctionPattern) testLines.push(`- Results tracking via ${results.testingPatterns.checkFunctionPattern} (confidence: 0.98) // survey-detected`);
    }

    // Vitest config
    if (results.testingPatterns.vitestConfig) {
      testLines.push(`- Vitest config: environment=${results.testingPatterns.vitestEnvironment || '?'}, setup=${results.testingPatterns.vitestSetupFile || '?'}, timeout=${results.testingPatterns.vitestTimeout || '?'}ms (confidence: 0.98) // survey-detected`);
    }

    suggestions.push({
      package: 'tools',
      category: 'testing patterns (detected)',
      lines: testLines,
      evidence: results.testingPatterns.evidence
    });
  }

  // Design tokens → design
  if (results.designTokens.hasDesignTokens) {
    const dtLines = [];

    dtLines.push(`- ${results.designTokens.tokenCategoryCount} categorías de tokens (${results.designTokens.totalTokens} tokens totales) // survey-detected`);

    for (const cat of results.designTokens.tokenCategories) {
      const subs = cat.subCategoryCount > 0 ? ` (${cat.subCategories.join(', ')})` : '';
      dtLines.push(`  - ${cat.category}: ${cat.tokenCount} tokens${subs}`);
    }

    if (results.designTokens.styleDictionaryVersion) {
      dtLines.push(`- Style Dictionary ${results.designTokens.styleDictionaryVersion} con build.js + config.js // survey-detected`);
    }

    if (results.designTokens.outputFormats.length > 0) {
      dtLines.push(`- ${results.designTokens.outputFormats.length} plataformas de salida: ${results.designTokens.outputFormats.map(p => `${p.name} (${p.transformGroup})`).join(', ')} // survey-detected`);
    }

    if (results.designTokens.hasBuiltOutput) {
      dtLines.push(`- Outputs compilados en dist/: CSS vars, JS module, JSON flat, Tailwind // survey-detected`);
    }

    if (results.designTokens.hasFigmaIntegration) {
      dtLines.push(`- Integración Figma via Tokens Studio (provider: ${results.designTokens.figmaProvider}) // survey-detected`);
    }

    suggestions.push({
      package: 'design',
      category: 'design tokens (detected)',
      lines: dtLines,
      evidence: results.designTokens.evidence
    });
  }  // Copilot patterns → frontend
  if (results.copilotPatterns.hasCopilotJS) {
    const cpLines = [];

    cpLines.push(`- Chat panel Copilot con toggle, minimizar y settings (confidence: 1.0) // survey-detected`);
    cpLines.push(`- ${results.copilotPatterns.skillCount} comandos slash integrados: ${results.copilotPatterns.skillNames.join(', ')} (confidence: 0.98) // survey-detected`);
    cpLines.push(`- Selector de modelos con ${results.copilotPatterns.modelProviderCount} providers agrupados (confidence: 0.95) // survey-detected`);
    cpLines.push(`- Panel arrastrable con persistencia de posición via localStorage (confidence: 0.95) // survey-detected`);
    cpLines.push(`- Control de tamaño de fuente (${results.copilotPatterns.hasFontSizeControl ? '✓ slider + persist' : '✗'}) (confidence: 0.95) // survey-detected`);
    cpLines.push(`- ${results.copilotPatterns.supportedActions.length} acciones de grafo: ${results.copilotPatterns.supportedActions.join(', ')} (confidence: 0.98) // survey-detected`);
    cpLines.push(`- Contexto de composición enviado al LLM vía cpBuildGraphContext() (confidence: 0.98) // survey-detected`);
    cpLines.push(`- Chat persistente con historial + mensajes en localStorage (confidence: 0.95) // survey-detected`);
    cpLines.push(`- Resaltado de markdown (código, negrita, cursiva) (confidence: 0.98) // survey-detected`);

    suggestions.push({
      package: 'frontend',
      category: 'copilot patterns (detected)',
      lines: cpLines,
      evidence: results.copilotPatterns.evidence
    });
  }

  // Git workflow → tools
  if (results.gitWorkflow.isGitRepo) {
    const gitLines = [];
    gitLines.push(`- Repositorio git inicializado (filemode=${results.gitWorkflow.fileMode ? 'false' : '?'}, ignorecase=${results.gitWorkflow.ignoreCase ? 'true' : '?'}) // survey-detected`);
    if (results.gitWorkflow.agentCommitRule) {
      gitLines.push(`- Regla de commit: ${results.gitWorkflow.agentCommitRule} (confidence: 1.0) // survey-detected`);
    }
    if (results.gitWorkflow.hasPostTaskAutomation) {
      gitLines.push(`- Post-task automation: CLAUDE.md + graphify update (confidence: 0.98) // survey-detected`);
    }
    if (results.gitWorkflow.hasGitIgnore) {
      gitLines.push(`- .gitignore con ${results.gitWorkflow.gitIgnorePatternCount} patrones (${results.gitWorkflow.gitIgnoreCategories.join(', ')}) (confidence: 0.95) // survey-detected`);
    }
    if (results.gitWorkflow.commitCount > 0) {
      gitLines.push(`- ${results.gitWorkflow.commitCount} commits en historial (confidence: 1.0) // survey-detected`);
      if (results.gitWorkflow.recentCommits.length > 0) {
        const commitsList = results.gitWorkflow.recentCommits.map(function(c) { return '`' + c + '`'; }).join(', ');
        gitLines.push(`- Commits recientes: ${commitsList} (confidence: 0.95) // survey-detected`);
      }
    }
    if (results.gitWorkflow.hasPreCommitHook) {
      gitLines.push(`- Pre-commit hook presente (confidence: 0.95) // survey-detected`);
    }
    if (results.gitWorkflow.hasNeverAutoCommitRule) {
      gitLines.push(`- No auto-commit: el agente lista cambios, el humano revisa y commitea (confidence: 0.98) // survey-detected`);
    }
    suggestions.push({
      package: 'tools',
      category: 'git workflow (detected)',
      lines: gitLines,
      evidence: results.gitWorkflow.evidence
    });
  }

  // UI Events patterns → frontend
  if (results.uiEvents.hasNodeZoom || results.uiEvents.hasNodeDrag || results.uiEvents.hasMarqueeSelection) {
    const uiLines = [];

    // Node graph interactions
    const interactions = [];
    if (results.uiEvents.hasNodeZoom) interactions.push(`Ctrl+Wheel zoom (${results.uiEvents.zoomRange || '0.2x-3.0x'})`);
    if (results.uiEvents.hasNodePan) interactions.push('Middle-button pan');
    if (results.uiEvents.hasConnectionDrag) interactions.push('Port-to-port connection drag');
    if (results.uiEvents.hasWireInsert) interactions.push('Shift+drag wire insert (Fusion-style)');
    if (results.uiEvents.hasNodeDrag) interactions.push(results.uiEvents.hasMultiDrag ? 'Node drag with multi-select' : 'Node drag');
    if (results.uiEvents.hasMarqueeSelection) interactions.push('Marquee selection on empty area');
    if (results.uiEvents.hasAutoMerge) interactions.push('Output→Output auto-merge (Gap 2)');
    if (results.uiEvents.hasAutoConnect) interactions.push('Drop on body auto-connect (Gap 1)');
    if (results.uiEvents.hasViewerDots) interactions.push('Viewer dot assignment (v1/v2)');
    if (results.uiEvents.hasFloatingPreview) interactions.push('Ctrl+Click floating preview');
    if (results.uiEvents.hasMediaDragDrop) interactions.push('Drag & drop media import');
    if (results.uiEvents.hasPasteImport) interactions.push('Paste from clipboard media import');
    if (results.uiEvents.hasDynamicToolbar) interactions.push('Dynamic toolbar from NODE_DEFS categories');
    if (results.uiEvents.hasContextMenu) interactions.push('Right-click context menu');

    uiLines.push(`- ${interactions.length} interacciones de grafo detectadas (confidence: 0.95) // survey-detected`);
    uiLines.push(...interactions.map(i => `  - ${i}`));

    // Node indicators
    if (results.uiEvents.nodeIndicatorTypes.length > 0) {
      uiLines.push(`- Indicadores visuales de tipo Fusion: ${results.uiEvents.nodeIndicatorTypes.join(', ')} (confidence: 0.95) // survey-detected`);
    }

    // Wire colors
    if (results.uiEvents.wireRoleColors.length > 0) {
      uiLines.push(`- Colores de wire por rol: ${results.uiEvents.wireRoleColors.join(', ')} (confidence: 0.95) // survey-detected`);
    }

    // Keyboard shortcuts
    if (results.uiEvents.keyboardShortcuts.length > 0) {
      uiLines.push(`- ${results.uiEvents.keyboardShortcuts.length} atajos de teclado detectados (confidence: 0.95) // survey-detected`);
      uiLines.push(...results.uiEvents.keyboardShortcuts.map(s => `  - ${s}`));
    }

    // Event binding pattern
    if (results.uiEvents.eventBindingPattern) {
      uiLines.push(`- Binding pattern: ${results.uiEvents.eventBindingPattern} + event delegation via data-action (confidence: 0.95) // survey-detected`);
    }

    suggestions.push({
      package: 'frontend',
      category: 'ui events (detected)',
      lines: uiLines,
      evidence: results.uiEvents.evidence
    });
  }

  return suggestions;
}

// --- Render de sugerencias ---

function renderSuggestions(suggestions, showDiff) {
  if (suggestions.length === 0) {
    console.log('\n🔍 Survey: No se detectaron sugerencias nuevas');
    return;
  }

  console.log(`\n🔍 Taste Survey — ${suggestions.length} sugerencias`);
  console.log('═'.repeat(60));

  // Agrupar por paquete
  const byPackage = {};
  for (const s of suggestions) {
    if (!byPackage[s.package]) byPackage[s.package] = [];
    byPackage[s.package].push(s);
  }

  for (const [pkgName, pkgSuggestions] of Object.entries(byPackage)) {
    console.log(`\n📦 ${pkgName}/taste.md:`);

    for (const s of pkgSuggestions) {
      console.log(`   ### ${s.category}`);
      for (const line of s.lines) {
        console.log(`     ${line}`);
      }
      if (showDiff) {
        console.log(`     📎 evidencia: ${s.evidence}`);
      }
    }
  }

  console.log('\n' + '═'.repeat(60));
  console.log(`📊 Total: ${suggestions.length} sugerencias en ${Object.keys(byPackage).length} packages`);
  console.log('');
}

// --- Apply (escribe las sugerencias en los taste.md) ---

function applySuggestions(suggestions) {
  for (const s of suggestions) {
    const tastePath = path.join(TASTE_DIR, s.package, 'taste.md');
    if (!fs.existsSync(tastePath)) {
      console.log(`⚠️  No existe ${tastePath}, saltando`);
      continue;
    }

    let content = fs.readFileSync(tastePath, 'utf-8');

    // Buscar la categoría dentro de preferences
    // [\s\S]*? captura hasta el próximo ### o ## (o fin de archivo)
    // Sin flag 'm' para que $ solo matchee fin real del string, no cada newline
    const categoryRegex = new RegExp(
      `(###\\s*${escapeRegex(s.category)}\\n)([\\s\\S]*?)(?=\\n### |\\n## |$)`
    );

    if (categoryRegex.test(content)) {
      // Categoría existe → agregar líneas después del último bullet
      content = content.replace(categoryRegex, (match, header, body) => {
        // Evitar duplicados: comparar línea por línea (case-insensitive)
        const existingLines = body.split('\n').map(l => l.trim().toLowerCase());
        const newLines = s.lines
          .filter(line => {
            const key = line.trim().slice(0, 50).toLowerCase();
            return !existingLines.some(el => el.includes(key));
          })
          .map(l => l + '\n').join('');
        if (!newLines) {
          console.log(`   ⏭️  Saltado: ${s.package}/taste.md → ${s.category} (ya existe)`);
          return match;
        }
        // Limpiar whitespace redundante
        const cleanedBody = body.replace(/\n{3,}/g, '\n\n').trimEnd();
        return header + cleanedBody + (cleanedBody ? '\n' : '') + newLines;
      });
    } else {
      // Categoría no existe → crearla después de ## preferences
      const newSection = `\n### ${s.category}\n\n${s.lines.map(l => l + '\n').join('')}`;
      content = content.replace(/## preferences\n/, '## preferences\n' + newSection);
    }

    fs.writeFileSync(tastePath, content, 'utf-8');
    console.log(`   ✅ Aplicado: ${s.package}/taste.md → ${s.category} (${s.lines.length} líneas)`);
  }
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// --- Reporte completo ---

async function generateReport(results) {
  console.log('\n🔍 Taste Survey — Escaneo del Proyecto');
  console.log('═'.repeat(60));

  const reportData = {
    packageManager: results.packageManager,
    testFramework: results.testFramework,
    bundler: results.bundler,
    indentation: results.indentation,
    codeStyle: results.codeStyle,
    schemaNodes: results.schemaNodes,
    nodeEngine: results.nodeEngine,
    animation: results.animation,
    exportFormats: results.exportFormats,
    uiEvents: results.uiEvents,
    renderPipeline: results.renderPipeline,
    persistence: results.persistence,
    designTokens: results.designTokens,
    testingPatterns: results.testingPatterns,
    copilotPatterns: results.copilotPatterns,
    gitWorkflow: results.gitWorkflow,
    documentationPatterns: results.documentationPatterns,
    postTaskAutomation: results.postTaskAutomation,
    timestamp: new Date().toISOString()
  };

  const reportPath = path.join(TASTE_DIR, 'survey-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2), 'utf-8');
  console.log(`\n📊 Reporte guardado: ${reportPath}`);
  console.log('═'.repeat(60));

  return reportData;
}

// --- CLI ---

async function main() {
  const args = process.argv.slice(2);
  const apply = args.includes('--apply');
  const showDiff = args.includes('--diff') || args.includes('--verbose');
  const verbose = args.includes('--verbose');

  console.log('\n🔍 Taste Survey — Escaneando proyecto...\n');

  // Ejecutar detectores en paralelo
  const results = {
    packageManager: await detectPackageManager(),
    testFramework: await detectTestFramework(),
    bundler: await detectBundler(),
    indentation: await detectIndentation(),
    codeStyle: await detectCodeStyle(),
    schemaNodes: await detectSchemaNodeTypes(),
    nodeEngine: await detectNodeTypesFromEngine(),
    animation: await detectAnimationPatterns(),
    exportFormats: await detectExportFormats(),
    renderPipeline: await detectRenderPipeline(),
    persistence: await detectPersistencePatterns(),
    uiEvents: await detectUIEventsPatterns(),
    designTokens: await detectDesignTokens(),
    testingPatterns: await detectTestingPatterns(),
    copilotPatterns: await detectCopilotPatterns(),
    gitWorkflow: await detectGitWorkflow(),
    documentationPatterns: await detectDocumentationPatterns(),
    postTaskAutomation: await detectPostTaskAutomation()
  };

  // Mostrar resultados del scan
  console.log('📋 Resultados del escaneo:');
  console.log(`   📦 Package manager: ${results.packageManager.detected} (conf: ${results.packageManager.confidence})`);
  console.log(`   🧪 Test framework:  ${results.testFramework.detected} (conf: ${results.testFramework.confidence})`);
  console.log(`   🔧 Bundler:         ${results.bundler.detected} (conf: ${results.bundler.confidence})`);
  console.log(`   📐 Indentación:     ${results.indentation.detected} (conf: ${results.indentation.confidence})`);
  console.log(`   🔤 Semicolons:      ${results.codeStyle.semicolons}`);
  console.log(`   💬 Quotes:          ${results.codeStyle.quotes}`);
  console.log(`   📊 Schema:           ${results.schemaNodes.nodeDefinitionCount} node defs, ${results.schemaNodes.portTypeCount} ports, ${results.schemaNodes.propertyTypeCount} props, v${results.schemaNodes.schemaVersion}`);
  if (results.schemaNodes.hasAnimationSystem) console.log(`   🎞️ Schema animation:  channels=${results.schemaNodes.animationChannels}, modifiers=${results.schemaNodes.animationModifiers.length}`);
  if (results.schemaNodes.hasRenderPipeline) console.log(`   🔧 Schema pipeline:   ${results.schemaNodes.pipelineSteps.length} steps, cache=${results.schemaNodes.hasCaching}`);
  if (results.schemaNodes.hasLayerModel) console.log(`   📋 Schema layers:     ${results.schemaNodes.layerFields.length} fields`);
  if (results.schemaNodes.hasGlobalEffects) console.log(`   🌫️ Schema effects:    ${results.schemaNodes.globalEffectParams.length} params`);
  if (results.schemaNodes.blendModeCount > 0) console.log(`   🎨 Schema blends:     ${results.schemaNodes.blendModeCount} modes`);
  if (results.schemaNodes.hasDataFlow) console.log(`   📜 Schema rules:      ${results.schemaNodes.dataFlowRules} data flow rules`);
  console.log(`   🔀 Node types (engine.js): ${results.nodeEngine.totalNodes} tipos en ${results.nodeEngine.categoriesCount} categorías`);
  console.log(`   📤 Export:          ${results.exportFormats.formats.length} formats, standalone=${results.exportFormats.hasStandaloneEngine}, ZIP=${results.exportFormats.hasZIPExport}`);
  console.log(`   🔧 Render pipeline: ${results.renderPipeline.rendererDispatch.length} renderers, ${results.renderPipeline.pipelineStages.length} stages`);
  console.log(`   💾 Persistence:     localStorage=${results.persistence.hasLocalStorage}, FSAA=${results.persistence.hasFSAA}, API=${results.persistence.hasBackendAPI}`);
  console.log(`   🎬 Animation API:   keyframes=${results.animation.keyframeAPI}, modifiers=${results.animation.modifierAPI}, props=✓`);
  console.log(`   🖱️ UI Events:        ${results.uiEvents.domReadyListeners} listeners, ${results.uiEvents.keyboardShortcuts.length} shortcuts, ${results.uiEvents.wireRoleColors.length} wire roles`);
  console.log(`   🎨 Prop colors:     ${results.animation.propColorsCount} properties, ${results.animation.defaultRangesCount} ranges`);
  console.log(`   🔀 evalPropA nodes: ${results.animation.evalPropNodeTypes.length} node types`);
  console.log(`   🧪 Testing:         node_comp=${results.testingPatterns.hasNodeCompositionTest}, integ=${results.testingPatterns.hasIntegrationTest}, vitest=${results.testingPatterns.vitestConfig}`);
  console.log(`   🔬 Test details:    ${results.testingPatterns.testFunctions.length} helpers, ${results.testingPatterns.phaseCount} phases, ${results.testingPatterns.staticIdCount} IDs, ${results.testingPatterns.dataActionCount} actions`);
  console.log(`   🤖 Copilot:         ${results.copilotPatterns.hasCopilotJS ? `✓ ${results.copilotPatterns.skillCount} skills, ${results.copilotPatterns.modelProviderCount} providers, ${results.copilotPatterns.supportedActions.length} actions` : '✗'}`);
  console.log(`   📋 Git workflow:     repo=${results.gitWorkflow.isGitRepo}, commits=${results.gitWorkflow.commitCount}, rules=${results.gitWorkflow.hasNeverAutoCommitRule ? "✓" : "✗"}, ignore=${results.gitWorkflow.hasGitIgnore ? "✓" : "✗"}`);

  console.log(`   📖 Documentation:   ADR=${results.documentationPatterns.adrCount}, lessons=${results.documentationPatterns.lessonCount}, refs=${results.documentationPatterns.referenceCount}, tastePkgs=${results.documentationPatterns.tastePackageCount}`);  console.log(`   🎨 Design tokens:   ${results.designTokens.tokenCategoryCount} categories, ${results.designTokens.totalTokens} tokens, SD ${results.designTokens.styleDictionaryVersion || '?'}`);
  console.log(`   🖼️ Output formats:  ${results.designTokens.outputFormats.map(p => p.name).join(', ') || 'none'}`);
  console.log(`   🎭 Figma sync:      ${results.designTokens.hasFigmaIntegration ? '✓ (' + results.designTokens.figmaProvider + ')' : '✗'}`);

  if (verbose) {
    console.log(`\n   📎 Evidencia detallada:`);
    for (const [key, val] of Object.entries(results)) {
      console.log(`      ${key}: ${val.evidence}`);
    }
  }

  // Generar sugerencias
  const suggestions = generateSuggestions(results);
  renderSuggestions(suggestions, showDiff);

  // Aplicar si --apply
  if (apply && suggestions.length > 0) {
    console.log('\n📝 Aplicando sugerencias...');
    applySuggestions(suggestions);
    console.log('\n✅ Survey aplicado. Ejecuta "node tools/validate-taste.js" para verificar.');
  }

  // Guardar reporte
  await generateReport(results);
}

// --- Ejecutar ---

if (require.main === module) {
  main().catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
  });
}

module.exports = { detectPackageManager, detectTestFramework, detectBundler, detectIndentation, detectCodeStyle, detectSchemaNodeTypes, detectNodeTypesFromEngine, detectAnimationPatterns, detectExportFormats, detectRenderPipeline, detectPersistencePatterns, detectUIEventsPatterns, detectDesignTokens, detectTestingPatterns, detectCopilotPatterns, detectDocumentationPatterns, detectGitWorkflow, detectPostTaskAutomation };
