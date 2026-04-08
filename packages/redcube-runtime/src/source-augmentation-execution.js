import path from 'node:path';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';

import {
  getSourceArtifactPaths,
  validateSourceAugmentationRequestContract,
} from '@redcube/runtime-protocol';

import { executeSourceAugmentationWithCommand } from './source-augmentation-executor.js';

function ensureDir(dir) {
  mkdirSync(dir, { recursive: true });
  return dir;
}

function writeJson(file, value) {
  ensureDir(path.dirname(file));
  writeFileSync(file, JSON.stringify(value, null, 2), 'utf-8');
}

function readJson(file) {
  return JSON.parse(readFileSync(file, 'utf-8'));
}

function safeText(value, fallback = '') {
  const text = String(value || '').trim();
  return text || fallback;
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function nextSequence(items, prefix) {
  const values = safeArray(items)
    .map((item) => safeText(item))
    .filter((id) => id.startsWith(prefix))
    .map((id) => Number(id.slice(prefix.length)))
    .filter((value) => Number.isFinite(value));
  return (values.length > 0 ? Math.max(...values) : 0) + 1;
}

function uniqueStrings(values) {
  return [...new Set(safeArray(values).map((item) => safeText(item)).filter(Boolean))];
}

function referenceDisplayLabel(source) {
  const label = safeText(source?.label);
  const url = safeText(source?.url);
  if (label && url) return `${label} | ${url}`;
  return label || url;
}

function buildBlockedReport({ topicId, request, blockingReason }) {
  return {
    schema_version: 1,
    topic_id: topicId,
    request_kind: 'shared_source_readiness_augmentation_execution',
    status: 'blocked',
    readiness_target: safeText(request?.readiness_target, 'planning_ready'),
    blocking_reason: safeText(blockingReason, 'source_augmentation_execution_failed'),
    resolved_evidence_gaps: [],
    unresolved_evidence_gaps: safeArray(request?.trigger?.evidence_gaps),
    added_source_count: 0,
    added_material_count: 0,
  };
}

function applyAugmentation({
  sourceIndex,
  extractedMaterials,
  sourceBrief,
  sourceAudit,
  sourceReadinessPack,
  executorOutput,
  executionSurface,
}) {
  const references = safeArray(executorOutput?.reference_source_list).map((item) => ({
    reference_id: safeText(item?.reference_id),
    label: safeText(item?.label),
    url: safeText(item?.url),
  }));
  const facts = safeArray(executorOutput?.key_fact_groups).map((item) => ({
    fact_id: safeText(item?.fact_id),
    label: safeText(item?.label),
    reference_id: safeText(item?.reference_id),
  }));
  const evidenceGapResolution = safeArray(executorOutput?.evidence_gap_resolution).map((item) => ({
    gap_id: safeText(item?.gap_id),
    status: safeText(item?.status),
    note: safeText(item?.note),
  }));
  const resolvedEvidenceGaps = uniqueStrings(
    evidenceGapResolution
      .filter((item) => item.status === 'resolved')
      .map((item) => item.gap_id),
  );
  const unresolvedEvidenceGaps = uniqueStrings(
    evidenceGapResolution
      .filter((item) => item.status === 'unresolved')
      .map((item) => item.gap_id),
  );
  const sourceQualityNotes = uniqueStrings(executorOutput?.source_quality_notes);

  const nextSourceSeq = nextSequence(
    safeArray(sourceIndex?.sources).map((item) => item?.source_id),
    'SRC-AUG-',
  );
  const nextMaterialSeq = nextSequence(
    safeArray(extractedMaterials?.materials).map((item) => item?.material_id),
    'MAT-',
  );

  const appendedSources = references.map((source, index) => ({
    source_id: `SRC-AUG-${String(nextSourceSeq + index).padStart(3, '0')}`,
    reference_id: source.reference_id,
    kind: 'web',
    relative_path: referenceDisplayLabel(source),
    status: 'ready',
    blocking_reason: null,
  }));
  const appendedSourceByReferenceId = new Map(
    appendedSources.map((item) => [item.reference_id, item]),
  );

  const appendedMaterials = facts.map((fact, index) => {
    const matchedSource = appendedSourceByReferenceId.get(fact.reference_id) || null;
    return {
      material_id: `MAT-${String(nextMaterialSeq + index).padStart(3, '0')}`,
      augmentation_fact_id: fact.fact_id,
      reference_id: fact.reference_id,
      source_id: matchedSource?.source_id || '',
      kind: 'web',
      relative_path: matchedSource?.relative_path || '',
      content_text: fact.label,
      excerpt: fact.label.slice(0, 240),
    };
  });

  const mergedSourceIndex = {
    ...sourceIndex,
    confidence: appendedMaterials.length > 0 ? 'medium' : sourceIndex?.confidence,
    sources: [
      ...safeArray(sourceIndex?.sources),
      ...appendedSources,
    ],
  };

  const mergedExtractedMaterials = {
    ...extractedMaterials,
    materials: [
      ...safeArray(extractedMaterials?.materials),
      ...appendedMaterials,
    ],
  };

  const mergedSourceBrief = {
    ...sourceBrief,
    confidence: appendedMaterials.length > 0 ? 'medium' : safeText(sourceBrief?.confidence, 'low'),
    material_count: safeArray(mergedExtractedMaterials?.materials).length,
    material_ids: safeArray(mergedExtractedMaterials?.materials).map((item) => item.material_id),
  };

  const completedStages = uniqueStrings([
    ...safeArray(sourceAudit?.completed_stages),
    'source_augmentation',
  ]);
  const mergedSourceAudit = {
    ...sourceAudit,
    completed_stages: completedStages,
    checks: {
      ...(sourceAudit?.checks || {}),
      source_augmentation_executed: true,
    },
  };

  const mergedReferenceList = uniqueStrings([
    ...safeArray(sourceReadinessPack?.fact_library?.reference_source_list),
    ...appendedSources.map((item) => item.relative_path),
  ]);
  const mergedKeyFactGroups = [
    ...safeArray(sourceReadinessPack?.fact_library?.key_fact_groups),
    ...appendedMaterials.map((material) => ({
      fact_id: material.material_id,
      augmentation_fact_id: material.augmentation_fact_id,
      reference_id: material.reference_id,
      label: material.excerpt,
      source_id: material.source_id,
    })),
  ];
  const readinessStatus = unresolvedEvidenceGaps.length === 0 ? 'planning_ready' : 'augmentation_required';
  const deepResearchState = unresolvedEvidenceGaps.length === 0 ? 'completed' : 'recommended';

  const mergedSourceReadinessPack = {
    ...sourceReadinessPack,
    readiness: {
      ...(sourceReadinessPack?.readiness || {}),
      confidence: mergedSourceBrief.confidence,
      sufficiency_status: readinessStatus,
      deep_research_state: deepResearchState,
      material_count: mergedSourceBrief.material_count,
      material_ids: mergedSourceBrief.material_ids,
      audit_status: safeText(mergedSourceAudit?.status, 'pass'),
    },
    fact_library: {
      ...(sourceReadinessPack?.fact_library || {}),
      topic_summary: safeText(
        executorOutput?.topic_summary,
        sourceReadinessPack?.fact_library?.topic_summary,
      ),
      reference_source_list: mergedReferenceList,
      key_fact_groups: mergedKeyFactGroups,
      source_quality_notes: uniqueStrings([
        ...safeArray(sourceReadinessPack?.fact_library?.source_quality_notes),
        ...sourceQualityNotes,
      ]),
      evidence_gaps: unresolvedEvidenceGaps,
    },
  };

  const report = {
    schema_version: 1,
    topic_id: safeText(sourceReadinessPack?.topic_id, sourceBrief?.topic_id),
    request_kind: 'shared_source_readiness_augmentation_execution',
    status: 'completed',
    readiness_target: 'planning_ready',
    execution_surface: safeText(executionSurface, 'external_command'),
    resolved_evidence_gaps: resolvedEvidenceGaps,
    unresolved_evidence_gaps: unresolvedEvidenceGaps,
    topic_summary: safeText(mergedSourceReadinessPack?.fact_library?.topic_summary),
    source_quality_notes: sourceQualityNotes,
    evidence_gap_resolution: evidenceGapResolution,
    added_source_count: appendedSources.length,
    added_material_count: appendedMaterials.length,
    added_sources: appendedSources.map((item) => ({
      source_id: item.source_id,
      reference_id: item.reference_id,
      public_label: item.relative_path,
    })),
    added_material_ids: appendedMaterials.map((item) => item.material_id),
  };

  return {
    report,
    sourceIndex: mergedSourceIndex,
    extractedMaterials: mergedExtractedMaterials,
    sourceBrief: mergedSourceBrief,
    sourceAudit: mergedSourceAudit,
    sourceReadinessPack: mergedSourceReadinessPack,
  };
}

export async function executeSourceAugmentation({
  workspaceRoot,
  topicId,
}) {
  const sourcePaths = getSourceArtifactPaths(workspaceRoot, topicId);
  const requiredFiles = [
    sourcePaths.sourceIndexFile,
    sourcePaths.extractedMaterialsFile,
    sourcePaths.sourceAuditFile,
    sourcePaths.sourceBriefFile,
    sourcePaths.sourceReadinessPackFile,
    sourcePaths.sourceAugmentationRequestFile,
  ];

  for (const file of requiredFiles) {
    if (!existsSync(file)) {
      throw new Error(`source augmentation execution 需要已有 canonical source readiness contract: ${file}`);
    }
  }

  const sourceIndex = readJson(sourcePaths.sourceIndexFile);
  const extractedMaterials = readJson(sourcePaths.extractedMaterialsFile);
  const sourceAudit = readJson(sourcePaths.sourceAuditFile);
  const sourceBrief = readJson(sourcePaths.sourceBriefFile);
  const sourceReadinessPack = readJson(sourcePaths.sourceReadinessPackFile);
  const request = readJson(sourcePaths.sourceAugmentationRequestFile);
  const requestValidation = validateSourceAugmentationRequestContract(request);
  if (!requestValidation.ok) {
    const report = buildBlockedReport({
      topicId,
      request,
      blockingReason: `source augmentation request contract invalid: ${requestValidation.errors.join('; ')}`,
    });
    writeJson(sourcePaths.sourceAugmentationReportFile, report);
    return {
      ok: false,
      topicId,
      artifactFiles: {
        sourceAugmentationReportFile: sourcePaths.sourceAugmentationReportFile,
      },
      report,
    };
  }

  if (safeText(request?.status) === 'not_required') {
    const report = {
      schema_version: 1,
      topic_id: topicId,
      request_kind: 'shared_source_readiness_augmentation_execution',
      status: 'skipped',
      readiness_target: safeText(request?.readiness_target, 'planning_ready'),
      blocking_reason: null,
      resolved_evidence_gaps: [],
      unresolved_evidence_gaps: [],
      added_source_count: 0,
      added_material_count: 0,
    };
    writeJson(sourcePaths.sourceAugmentationReportFile, report);
    return {
      ok: true,
      topicId,
      artifactFiles: {
        sourceAugmentationReportFile: sourcePaths.sourceAugmentationReportFile,
      },
      report,
    };
  }

  const execution = executeSourceAugmentationWithCommand({
    command: process.env.REDCUBE_SOURCE_AUGMENT_CMD,
    requestFile: sourcePaths.sourceAugmentationRequestFile,
    request,
  });
  if (!execution.ok) {
    const report = buildBlockedReport({
      topicId,
      request,
      blockingReason: execution.blockingReason,
    });
    writeJson(sourcePaths.sourceAugmentationReportFile, report);
    return {
      ok: false,
      topicId,
      artifactFiles: {
        sourceAugmentationReportFile: sourcePaths.sourceAugmentationReportFile,
      },
      report,
    };
  }

  const applied = applyAugmentation({
    sourceIndex,
    extractedMaterials,
    sourceBrief,
    sourceAudit,
    sourceReadinessPack,
    executorOutput: execution.executorOutput,
    executionSurface: execution.executionSurface,
  });

  writeJson(sourcePaths.sourceIndexFile, applied.sourceIndex);
  writeJson(sourcePaths.extractedMaterialsFile, applied.extractedMaterials);
  writeJson(sourcePaths.sourceBriefFile, applied.sourceBrief);
  writeJson(sourcePaths.sourceAuditFile, applied.sourceAudit);
  writeJson(sourcePaths.sourceReadinessPackFile, applied.sourceReadinessPack);
  writeJson(sourcePaths.sourceAugmentationReportFile, applied.report);

  return {
    ok: true,
    topicId,
    artifactFiles: {
      sourceAugmentationReportFile: sourcePaths.sourceAugmentationReportFile,
    },
    report: applied.report,
  };
}
