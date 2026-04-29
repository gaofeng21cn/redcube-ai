// @ts-nocheck
import { existsSync } from 'node:fs';

import { buildSourcePackFederationArtifact } from '@redcube/runtime-protocol';

import { buildSourceReadinessPack } from '../source-readiness-pack.js';
import { buildSourceAugmentationRequest } from '../source-augmentation-request.js';
import {
  sha256Text,
  unchangedSourcePackReuseDecision,
} from './fingerprint-reuse.js';
import { isConsumableSource } from './materialization.js';
import {
  readJsonIfExists,
  safeText,
  writeJson,
} from './workspace-setup.js';

export function stageResult(status, extra = {}) {
  return {
    status,
    produced_at: new Date().toISOString(),
    ...extra,
  };
}

export function sourceArtifactFiles(sourcePaths) {
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

export function buildSourceIntakeResponse({ sourcePaths, audit, augmentation, cacheStatus = 'miss' }) {
  return {
    ok: audit?.status === 'pass',
    topicId: sourcePaths.topicPaths.topicId,
    artifactFiles: sourceArtifactFiles(sourcePaths),
    audit,
    augmentation,
    cache_status: cacheStatus,
  };
}

export function reuseFrozenSourcePackIfAvailable({ sourcePaths, previousManifest, intakeSources }) {
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

export function inferInputMode({ modeHint, sources }) {
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

export function inferConfidence({ inputMode, materials }) {
  if (inputMode === 'brief_keywords') return 'low';
  return materials.length > 0 ? 'medium' : 'low';
}

export function assembleSourceIntakeArtifacts({
  workspaceRoot,
  sourcePaths,
  title,
  brief,
  normalizedKeywords,
  modeHint,
  intakeSources,
  extracted,
  readyMaterials,
  consumableReadyMaterials,
  previousManifest,
  frozenPackReuse,
}) {
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

  return {
    sourceIndex,
    extractedMaterials,
    sourceBrief,
    sourceAudit,
    sourceReadinessPack,
    sourcePackManifest,
    sourcePackFederation,
    sourceAugmentationRequest,
  };
}
