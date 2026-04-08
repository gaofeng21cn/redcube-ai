import path from 'node:path';
import { spawnSync } from 'node:child_process';
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';

import {
  getSourceArtifactPaths,
  resolveWorkspaceContract,
} from '@redcube/runtime-protocol';
import { buildSourceReadinessPack } from './source-readiness-pack.js';

function ensureDir(dir) {
  mkdirSync(dir, { recursive: true });
  return dir;
}

function writeJson(file, value) {
  ensureDir(path.dirname(file));
  writeFileSync(file, JSON.stringify(value, null, 2), 'utf-8');
}

function safeText(value) {
  return String(value || '').trim();
}

function normalizeKeywords(input) {
  if (Array.isArray(input)) {
    return input.map((item) => safeText(item)).filter(Boolean);
  }
  return safeText(input)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeSourceFiles(input) {
  if (Array.isArray(input)) {
    return input.map((item) => safeText(item)).filter(Boolean);
  }
  return safeText(input)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function detectSourceKind(file) {
  const ext = path.extname(file).toLowerCase();
  if (ext === '.md' || ext === '.markdown') return 'markdown';
  if (ext === '.txt') return 'text';
  if (ext === '.pdf') return 'pdf';
  return 'unsupported';
}

function buildTopicRecord(topicId, title) {
  return {
    topic_id: topicId,
    title: title || topicId,
    status: 'source_ready',
  };
}

function ensureWorkspaceAndTopic({ workspaceRoot, topicId, title }) {
  const contract = resolveWorkspaceContract({ workspaceRoot });
  const sourcePaths = getSourceArtifactPaths(workspaceRoot, topicId);

  ensureDir(contract.workspaceRoot);
  if (!existsSync(contract.workspaceFile)) {
    writeJson(contract.workspaceFile, {
      workspace_version: 1,
      mode: 'agent_first_runtime',
    });
  }

  ensureDir(sourcePaths.topicPaths.topicDir);
  ensureDir(sourcePaths.topicPaths.inputsDir);
  ensureDir(sourcePaths.topicPaths.canonicalDir);
  if (!existsSync(sourcePaths.topicPaths.topicFile)) {
    writeJson(sourcePaths.topicPaths.topicFile, buildTopicRecord(sourcePaths.topicPaths.topicId, title));
  }

  return sourcePaths;
}

function materialInboxDir(topicPaths) {
  return ensureDir(path.join(topicPaths.inputsDir, 'raw_materials', 'source-intake'));
}

function stageResult(status, extra = {}) {
  return {
    status,
    produced_at: new Date().toISOString(),
    ...extra,
  };
}

function copySourceIntoTopic(sourceFile, topicPaths, index) {
  const absolute = path.resolve(sourceFile);
  if (!existsSync(absolute)) {
    throw new Error(`source file 不存在: ${sourceFile}`);
  }
  if (absolute.startsWith(path.resolve(topicPaths.inputsDir))) {
    return {
      absolute_path: absolute,
      relative_path: path.relative(topicPaths.topicDir, absolute),
    };
  }

  const fileName = `${String(index + 1).padStart(2, '0')}-${path.basename(absolute)}`;
  const target = path.join(materialInboxDir(topicPaths), fileName);
  cpSync(absolute, target);
  return {
    absolute_path: target,
    relative_path: path.relative(topicPaths.topicDir, target),
  };
}

function createBriefSources({ brief, keywords, title }) {
  const sources = [];
  if (safeText(brief)) {
    sources.push({
      source_id: 'SRC-BRIEF',
      kind: 'brief',
      relative_path: null,
      absolute_path: null,
      title,
      brief_text: safeText(brief),
      status: 'ready',
    });
  }
  if (keywords.length > 0) {
    sources.push({
      source_id: 'SRC-KEYWORDS',
      kind: 'keywords',
      relative_path: null,
      absolute_path: null,
      keywords,
      status: 'ready',
    });
  }
  return sources;
}

function extractPdfSource(source) {
  const mineruToken = safeText(process.env.MINERU_TOKEN);
  const extractorCmd = safeText(process.env.MINERU_EXTRACTOR_CMD);

  if (!mineruToken) {
    return {
      status: 'blocked',
      blocking_reason: 'mineru_token_missing_for_pdf_extraction',
    };
  }
  if (!extractorCmd) {
    return {
      status: 'blocked',
      blocking_reason: 'mineru_extractor_unconfigured',
    };
  }

  const result = spawnSync(extractorCmd, [source.absolute_path], {
    encoding: 'utf-8',
    maxBuffer: 16 * 1024 * 1024,
  });
  const text = safeText(result.stdout);
  if (result.status !== 0 || !text) {
    return {
      status: 'blocked',
      blocking_reason: safeText(result.stderr) || 'mineru_pdf_extraction_failed',
    };
  }

  return {
    status: 'ready',
    content_text: text,
  };
}

function extractSourceContent(source) {
  if (source.kind === 'brief') {
    return {
      status: 'ready',
      content_text: source.brief_text,
    };
  }
  if (source.kind === 'keywords') {
    return {
      status: 'ready',
      content_text: source.keywords.join(' / '),
    };
  }
  if (source.kind === 'markdown' || source.kind === 'text') {
    return {
      status: 'ready',
      content_text: readFileSync(source.absolute_path, 'utf-8'),
    };
  }
  if (source.kind === 'pdf') {
    return extractPdfSource(source);
  }
  return {
    status: 'blocked',
    blocking_reason: `unsupported_source_kind:${source.kind}`,
  };
}

function inferInputMode({ modeHint, sources }) {
  if (modeHint === 'legacy_import') return 'legacy_import';
  const kinds = new Set(sources.map((source) => source.kind));
  if (kinds.size === 0) return 'empty';
  if ([...kinds].every((kind) => kind === 'brief' || kind === 'keywords')) {
    return 'brief_keywords';
  }
  if (kinds.size === 1 && kinds.has('pdf')) {
    return 'pdf';
  }
  if (kinds.has('brief') || kinds.has('keywords')) {
    return 'mixed';
  }
  return 'files';
}

function inferConfidence({ inputMode, materials }) {
  if (inputMode === 'brief_keywords') return 'low';
  if (inputMode === 'legacy_import') return materials.length > 0 ? 'medium' : 'low';
  return materials.length > 0 ? 'medium' : 'low';
}

export async function intakeSource({
  workspaceRoot,
  topicId,
  title = '',
  brief = '',
  keywords = [],
  sourceFiles = [],
  modeHint = '',
}) {
  const normalizedKeywords = normalizeKeywords(keywords);
  const normalizedSourceFiles = normalizeSourceFiles(sourceFiles);
  const sourcePaths = ensureWorkspaceAndTopic({ workspaceRoot, topicId, title: safeText(title) });
  const copiedFileSources = normalizedSourceFiles.map((file, index) => {
    const copied = copySourceIntoTopic(file, sourcePaths.topicPaths, index);
    return {
      source_id: `SRC-FILE-${index + 1}`,
      kind: detectSourceKind(copied.absolute_path),
      ...copied,
      status: 'queued',
    };
  });
  const intakeSources = [
    ...createBriefSources({ brief, keywords: normalizedKeywords, title: safeText(title) || topicId }),
    ...copiedFileSources,
  ];

  if (intakeSources.length === 0) {
    throw new Error('source intake 至少需要 brief、keywords 或 sourceFiles 之一');
  }

  const extracted = intakeSources.map((source) => {
    const extraction = extractSourceContent(source);
    return {
      ...source,
      status: extraction.status,
      blocking_reason: extraction.blocking_reason || '',
      content_text: extraction.content_text || '',
    };
  });

  const readyMaterials = extracted
    .filter((source) => source.status === 'ready')
    .map((source, index) => ({
      material_id: `MAT-${String(index + 1).padStart(3, '0')}`,
      source_id: source.source_id,
      kind: source.kind,
      relative_path: source.relative_path,
      content_text: source.content_text,
      excerpt: source.content_text.slice(0, 240),
    }));

  const inputMode = inferInputMode({ modeHint, sources: intakeSources });
  const confidence = inferConfidence({ inputMode, materials: readyMaterials });
  const blockingReasons = extracted
    .filter((source) => source.status === 'blocked')
    .map((source) => source.kind === 'pdf' ? 'pdf_extraction_failed' : source.blocking_reason)
    .filter(Boolean);
  const auditStatus = blockingReasons.length > 0 || readyMaterials.length === 0 ? 'block' : 'pass';

  const stageResults = {
    intake_source: stageResult('pass', { source_count: intakeSources.length }),
    extract_source: stageResult(blockingReasons.length > 0 ? 'block' : 'pass', {
      extracted_count: readyMaterials.length,
      blocked_count: extracted.filter((source) => source.status === 'blocked').length,
    }),
    normalize_source: stageResult(readyMaterials.length > 0 ? 'pass' : 'block', {
      material_count: readyMaterials.length,
      input_mode: inputMode,
      confidence,
    }),
    source_audit: stageResult(auditStatus, {
      blocking_reasons: blockingReasons,
    }),
  };

  const sourceIndex = {
    schema_version: 1,
    topic_id: sourcePaths.topicPaths.topicId,
    input_mode: inputMode,
    confidence,
    sources: extracted.map((source) => ({
      source_id: source.source_id,
      kind: source.kind,
      relative_path: source.relative_path,
      status: source.status,
      blocking_reason: source.blocking_reason || null,
    })),
    stage_results: stageResults,
  };

  const extractedMaterials = {
    schema_version: 1,
    topic_id: sourcePaths.topicPaths.topicId,
    materials: readyMaterials,
    blocked_sources: extracted
      .filter((source) => source.status === 'blocked')
      .map((source) => ({
        source_id: source.source_id,
        kind: source.kind,
        relative_path: source.relative_path,
        blocking_reason: source.blocking_reason,
      })),
  };

  const sourceBrief = {
    schema_version: 1,
    topic_id: sourcePaths.topicPaths.topicId,
    title: safeText(title) || sourcePaths.topicPaths.topicId,
    input_mode: inputMode,
    confidence,
    brief_text: safeText(brief),
    keywords: normalizedKeywords,
    material_count: readyMaterials.length,
    material_ids: readyMaterials.map((material) => material.material_id),
  };

  const sourceAudit = {
    schema_version: 1,
    topic_id: sourcePaths.topicPaths.topicId,
    status: auditStatus,
    completed_stages: ['intake_source', 'extract_source', 'normalize_source', 'source_audit'],
    blocking_reasons: blockingReasons,
    checks: {
      source_index_written: true,
      extracted_materials_written: true,
      source_brief_written: true,
      consumable_materials_present: readyMaterials.length > 0,
      pdf_extraction_ready: !extracted.some((source) => source.kind === 'pdf' && source.status === 'blocked'),
    },
  };

  const sourceReadinessPack = buildSourceReadinessPack({
    topicId: sourcePaths.topicPaths.topicId,
    title: safeText(title) || sourcePaths.topicPaths.topicId,
    sourceIndex,
    extractedMaterials,
    sourceBrief,
    sourceAudit,
  });

  writeJson(sourcePaths.sourceIndexFile, sourceIndex);
  writeJson(sourcePaths.extractedMaterialsFile, extractedMaterials);
  writeJson(sourcePaths.sourceBriefFile, sourceBrief);
  writeJson(sourcePaths.sourceAuditFile, sourceAudit);
  writeJson(sourcePaths.sourceReadinessPackFile, sourceReadinessPack);

  return {
    ok: auditStatus === 'pass',
    topicId: sourcePaths.topicPaths.topicId,
    artifactFiles: {
      sourceIndexFile: sourcePaths.sourceIndexFile,
      extractedMaterialsFile: sourcePaths.extractedMaterialsFile,
      sourceAuditFile: sourcePaths.sourceAuditFile,
      sourceBriefFile: sourcePaths.sourceBriefFile,
      sourceReadinessPackFile: sourcePaths.sourceReadinessPackFile,
    },
    audit: sourceAudit,
  };
}
