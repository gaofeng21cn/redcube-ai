import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';

import {
  buildSourcePackFederationArtifact,
  getSourceArtifactPaths,
  resolveWorkspaceContract,
} from '@redcube/runtime-protocol';
import { ensureWorkspaceXiaohongshuAuthorTemplate } from '@redcube/redcube-config/xiaohongshu-author-profile';
import { buildSourceReadinessPack } from './source-readiness-pack.js';
import { buildSourceAugmentationRequest } from './source-augmentation-request.js';

function ensureDir(dir) {
  mkdirSync(dir, { recursive: true });
  return dir;
}

function writeJson(file, value) {
  ensureDir(path.dirname(file));
  writeFileSync(file, JSON.stringify(value, null, 2), 'utf-8');
}

function readJsonIfExists(file) {
  if (!existsSync(file)) return null;
  return JSON.parse(readFileSync(file, 'utf-8'));
}

function sha256Text(value) {
  return createHash('sha256').update(String(value || ''), 'utf-8').digest('hex');
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

function normalizeOperatorFiles(input) {
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

function isOperatorContextSource(source) {
  const kind = safeText(source?.kind);
  return safeText(source?.source_role) === 'operator_context'
    || kind === 'brief'
    || kind === 'keywords';
}

function isConsumableSource(source) {
  return !isOperatorContextSource(source);
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
  ensureWorkspaceXiaohongshuAuthorTemplate({
    workspaceRoot: contract.workspaceRoot,
  });

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

function copySourceIntoTopic(sourceFile, topicPaths, index, sourceLabel = 'source') {
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

  const fileName = `${sourceLabel}-${String(index + 1).padStart(2, '0')}-${path.basename(absolute)}`;
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
      source_role: 'operator_context',
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
      source_role: 'operator_context',
      relative_path: null,
      absolute_path: null,
      keywords,
      status: 'ready',
    });
  }
  return sources;
}

function sourceContentHashInput(source) {
  if (source.kind === 'brief') return `brief\n${safeText(source.brief_text)}`;
  if (source.kind === 'keywords') return `keywords\n${source.keywords.join('\n')}`;
  if (source.kind === 'markdown' || source.kind === 'text' || source.kind === 'pdf') {
    return readFileSync(source.absolute_path);
  }
  return `${source.kind}\n${safeText(source.relative_path)}`;
}

function enrichSourceFingerprint(source) {
  const content = sourceContentHashInput(source);
  const contentHash = createHash('sha256').update(content).digest('hex');
  return {
    ...source,
    content_hash: contentHash,
  };
}

function previousSourceByHash(previousManifest) {
  return new Map(
    (Array.isArray(previousManifest?.sources) ? previousManifest.sources : [])
      .filter((source) => safeText(source?.content_hash))
      .map((source) => [source.content_hash, source]),
  );
}

function previousMaterialBySourceHash(previousManifest, previousMaterials) {
  const materialById = new Map(
    (Array.isArray(previousMaterials?.materials) ? previousMaterials.materials : [])
      .filter((material) => safeText(material?.material_id))
      .map((material) => [material.material_id, material]),
  );
  return new Map(
    (Array.isArray(previousManifest?.sources) ? previousManifest.sources : [])
      .map((source) => [safeText(source?.content_hash), materialById.get(safeText(source?.material_id))])
      .filter(([contentHash, material]) => contentHash && material),
  );
}

function unchangedSourcePackReuseDecision({ previousManifest, intakeSources }) {
  if (!previousManifest || safeText(previousManifest.artifact_kind) !== 'source_pack_manifest') {
    return {
      canReuseFrozenPack: false,
      reason: 'previous_manifest_missing',
    };
  }
  const previousSources = Array.isArray(previousManifest.sources) ? previousManifest.sources : [];
  if (previousSources.length !== intakeSources.length) {
    return {
      canReuseFrozenPack: false,
      reason: 'source_count_changed',
    };
  }
  const previousKeys = previousSources
    .map((source) => `${safeText(source.source_role)}:${safeText(source.kind)}:${safeText(source.content_hash)}`)
    .sort();
  const currentKeys = intakeSources
    .map((source) => `${safeText(source.source_role)}:${safeText(source.kind)}:${safeText(source.content_hash)}`)
    .sort();
  const unchanged = previousKeys.every((key, index) => key === currentKeys[index]);
  return {
    canReuseFrozenPack: unchanged,
    reason: unchanged ? 'unchanged_source_manifest' : 'source_content_changed',
  };
}

function sourceArtifactFiles(sourcePaths) {
  return {
    sourceIndexFile: sourcePaths.sourceIndexFile,
    extractedMaterialsFile: sourcePaths.extractedMaterialsFile,
    sourceAuditFile: sourcePaths.sourceAuditFile,
    sourceBriefFile: sourcePaths.sourceBriefFile,
    sourceReadinessPackFile: sourcePaths.sourceReadinessPackFile,
    sourcePackManifestFile: sourcePaths.sourcePackManifestFile,
    sourcePackFederationFile: sourcePaths.sourcePackFederationFile,
    sourceAugmentationRequestFile: sourcePaths.sourceAugmentationRequestFile,
  };
}

function buildSourceIntakeResponse({ sourcePaths, audit, augmentation, cacheStatus = 'miss' }) {
  return {
    ok: audit?.status === 'pass',
    topicId: sourcePaths.topicPaths.topicId,
    artifactFiles: sourceArtifactFiles(sourcePaths),
    audit,
    augmentation,
    cache_status: cacheStatus,
  };
}

function reuseFrozenSourcePackIfAvailable({ sourcePaths, previousManifest, intakeSources }) {
  const reuseDecision = unchangedSourcePackReuseDecision({ previousManifest, intakeSources });
  if (!reuseDecision.canReuseFrozenPack) return null;
  const sourceAudit = readJsonIfExists(sourcePaths.sourceAuditFile);
  const sourceAugmentationRequest = readJsonIfExists(sourcePaths.sourceAugmentationRequestFile);
  const existingFiles = sourceArtifactFiles(sourcePaths);
  if (!sourceAudit || !sourceAugmentationRequest || !Object.values(existingFiles).every((file) => existsSync(file))) {
    return null;
  }
  const nextManifest = {
    ...previousManifest,
    reuse: {
      ...(previousManifest.reuse || {}),
      previous_manifest_available: true,
      frozen_source_pack_reused: true,
      skip_reason: reuseDecision.reason,
      reused_source_count: intakeSources.length,
      changed_source_count: 0,
    },
  };
  writeJson(sourcePaths.sourcePackManifestFile, nextManifest);
  return buildSourceIntakeResponse({
    sourcePaths,
    audit: sourceAudit,
    augmentation: sourceAugmentationRequest,
    cacheStatus: 'hit',
  });
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
  if (modeHint === 'historical_intake_import' || modeHint === 'legacy_import') {
    return 'historical_intake_import';
  }
  const kinds = new Set(
    sources
      .filter((source) => {
        const kind = safeText(source?.kind);
        return kind === 'brief' || kind === 'keywords' || isConsumableSource(source);
      })
      .map((source) => source.kind),
  );
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
  if (inputMode === 'historical_intake_import') return materials.length > 0 ? 'medium' : 'low';
  return materials.length > 0 ? 'medium' : 'low';
}

export async function intakeSource({
  workspaceRoot,
  topicId,
  title = '',
  brief = '',
  keywords = [],
  sourceFiles = [],
  operatorFiles = [],
  modeHint = '',
}) {
  const normalizedKeywords = normalizeKeywords(keywords);
  const normalizedSourceFiles = normalizeSourceFiles(sourceFiles);
  const normalizedOperatorFiles = normalizeOperatorFiles(operatorFiles);
  const sourcePaths = ensureWorkspaceAndTopic({ workspaceRoot, topicId, title: safeText(title) });
  const copiedFileSources = normalizedSourceFiles.map((file, index) => {
    const copied = copySourceIntoTopic(file, sourcePaths.topicPaths, index, 'content');
    return {
      source_id: `SRC-FILE-${index + 1}`,
      kind: detectSourceKind(copied.absolute_path),
      source_role: 'content_source',
      ...copied,
      status: 'queued',
    };
  });
  const copiedOperatorSources = normalizedOperatorFiles.map((file, index) => {
    const copied = copySourceIntoTopic(file, sourcePaths.topicPaths, index, 'operator');
    return {
      source_id: `SRC-OP-${index + 1}`,
      kind: detectSourceKind(copied.absolute_path),
      source_role: 'operator_context',
      ...copied,
      status: 'queued',
    };
  });
  const intakeSources = [
    ...createBriefSources({ brief, keywords: normalizedKeywords, title: safeText(title) || topicId }),
    ...copiedFileSources,
    ...copiedOperatorSources,
  ].map((source) => enrichSourceFingerprint(source));

  if (intakeSources.length === 0) {
    throw new Error('source intake 至少需要 brief、keywords 或 sourceFiles 之一');
  }

  const previousManifest = readJsonIfExists(sourcePaths.sourcePackManifestFile);
  const previousExtractedMaterials = readJsonIfExists(sourcePaths.extractedMaterialsFile);
  const frozenPackResponse = reuseFrozenSourcePackIfAvailable({ sourcePaths, previousManifest, intakeSources });
  if (frozenPackResponse) {
    return frozenPackResponse;
  }
  const frozenPackReuse = unchangedSourcePackReuseDecision({ previousManifest, intakeSources });
  const priorSourcesByHash = previousSourceByHash(previousManifest);
  const priorMaterialsByHash = previousMaterialBySourceHash(previousManifest, previousExtractedMaterials);

  const extracted = intakeSources.map((source) => {
    const priorSource = priorSourcesByHash.get(source.content_hash);
    const priorMaterial = priorMaterialsByHash.get(source.content_hash);
    if (priorSource?.extraction?.status === 'ready' && priorMaterial) {
      return {
        ...source,
        status: 'ready',
        blocking_reason: '',
        content_text: priorMaterial.content_text || '',
        reused: true,
        reused_material: priorMaterial,
        previous_source_id: safeText(priorSource.source_id),
      };
    }
    const extraction = extractSourceContent(source);
    return {
      ...source,
      status: extraction.status,
      blocking_reason: extraction.blocking_reason || '',
      content_text: extraction.content_text || '',
      reused: false,
    };
  });

  const readyMaterials = extracted
    .filter((source) => source.status === 'ready')
    .map((source, index) => {
      const materialId = `MAT-${String(index + 1).padStart(3, '0')}`;
      if (source.reused && source.reused_material) {
        return {
          ...source.reused_material,
          material_id: materialId,
          source_id: source.source_id,
          relative_path: source.relative_path,
        };
      }
      return {
        material_id: materialId,
        source_id: source.source_id,
        kind: source.kind,
        source_role: safeText(source.source_role),
        relative_path: source.relative_path,
        content_text: source.content_text,
        excerpt: source.content_text.slice(0, 240),
      };
    });
  const consumableReadyMaterials = readyMaterials.filter((material) => isConsumableSource(material));

  const inputMode = inferInputMode({ modeHint, sources: intakeSources });
  const confidence = inferConfidence({ inputMode, materials: consumableReadyMaterials });
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
      consumable_material_count: consumableReadyMaterials.length,
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
      source_role: safeText(source.source_role),
      relative_path: source.relative_path,
      content_hash: source.content_hash,
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
    consumable_material_count: consumableReadyMaterials.length,
    consumable_material_ids: consumableReadyMaterials.map((material) => material.material_id),
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
      consumable_materials_present: consumableReadyMaterials.length > 0,
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
  const sourceAugmentationRequest = buildSourceAugmentationRequest({
    topicId: sourcePaths.topicPaths.topicId,
    title: safeText(title) || sourcePaths.topicPaths.topicId,
    sourceBrief,
    sourceAudit,
    sourceReadinessPack,
  });
  const sourcePackFederation = buildSourcePackFederationArtifact({
    workspaceRoot,
    topicId: sourcePaths.topicPaths.topicId,
    sourceIndex,
    extractedMaterials,
    sourceBrief,
    sourceAudit,
    sourceReadinessPack,
  });
  const materialIdBySourceId = new Map(readyMaterials.map((material) => [material.source_id, material.material_id]));
  const sourcePackManifest = {
    schema_version: 1,
    artifact_kind: 'source_pack_manifest',
    topic_id: sourcePaths.topicPaths.topicId,
    hash_algorithm: 'sha256',
    input_mode: inputMode,
    readiness: {
      audit_status: sourceAudit.status,
      sufficiency_status: sourceReadinessPack.readiness.sufficiency_status,
      planning_ready: sourceReadinessPack.readiness.planning_ready,
      release_blocked: sourceReadinessPack.readiness.release_blocked,
    },
    reuse: {
      previous_manifest_available: previousManifest !== null,
      frozen_source_pack_reused: frozenPackReuse.canReuseFrozenPack,
      skip_reason: frozenPackReuse.reason,
      reused_source_count: extracted.filter((source) => source.reused === true).length,
      changed_source_count: extracted.filter((source) => source.reused !== true).length,
    },
    sources: extracted.map((source) => ({
      source_id: source.source_id,
      previous_source_id: source.previous_source_id || null,
      kind: source.kind,
      source_role: safeText(source.source_role),
      relative_path: source.relative_path,
      content_hash: source.content_hash,
      status: source.status,
      material_id: materialIdBySourceId.get(source.source_id) || null,
      extraction: {
        status: source.status,
        reused: source.reused === true,
        blocking_reason: source.blocking_reason || null,
      },
      evidence_index: {
        reused: source.reused === true,
        content_hash: sha256Text(`${source.content_hash}\n${safeText(source.content_text)}`),
        material_id: materialIdBySourceId.get(source.source_id) || null,
      },
    })),
  };

  writeJson(sourcePaths.sourceIndexFile, sourceIndex);
  writeJson(sourcePaths.extractedMaterialsFile, extractedMaterials);
  writeJson(sourcePaths.sourceBriefFile, sourceBrief);
  writeJson(sourcePaths.sourceAuditFile, sourceAudit);
  writeJson(sourcePaths.sourceReadinessPackFile, sourceReadinessPack);
  writeJson(sourcePaths.sourcePackManifestFile, sourcePackManifest);
  writeJson(sourcePaths.sourcePackFederationFile, sourcePackFederation);
  writeJson(sourcePaths.sourceAugmentationRequestFile, sourceAugmentationRequest);

  return buildSourceIntakeResponse({
    sourcePaths,
    audit: sourceAudit,
    augmentation: sourceAugmentationRequest,
    cacheStatus: 'miss',
  });
}
