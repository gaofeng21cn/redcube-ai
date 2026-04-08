import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import {
  getSourceArtifactPaths,
  validateSourceAugmentationRequestContract,
  validateSourceAugmentationResultContract,
} from '@redcube/runtime-protocol';

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

function loadCanonicalAugmentationRequest(sourcePaths) {
  if (!existsSync(sourcePaths.sourceAugmentationRequestFile)) {
    throw new Error(`source augmentation result 需要已有 canonical request: ${sourcePaths.sourceAugmentationRequestFile}`);
  }

  const request = readJson(sourcePaths.sourceAugmentationRequestFile);
  const validation = validateSourceAugmentationRequestContract(request);
  if (!validation.ok) {
    throw new Error(`source augmentation request contract invalid: ${validation.errors.join('; ')}`);
  }

  return request;
}

function buildDraftEvidenceGapResolution(request) {
  return safeArray(request?.trigger?.evidence_gaps)
    .map((gapId) => safeText(gapId))
    .filter(Boolean)
    .map((gapId) => ({
      gap_id: gapId,
      status: 'unresolved',
      note: '',
    }));
}

function normalizeResultPayload(value) {
  const payload = value || {};
  return {
    topic_summary: safeText(payload.topic_summary),
    reference_source_list: safeArray(payload.reference_source_list).map((item) => ({
      reference_id: safeText(item?.reference_id),
      label: safeText(item?.label),
      url: safeText(item?.url),
    })),
    key_fact_groups: safeArray(payload.key_fact_groups).map((item) => ({
      fact_id: safeText(item?.fact_id),
      label: safeText(item?.label),
      reference_id: safeText(item?.reference_id),
    })),
    source_quality_notes: safeArray(payload.source_quality_notes)
      .map((item) => safeText(item))
      .filter(Boolean),
    evidence_gap_resolution: safeArray(payload.evidence_gap_resolution).map((item) => ({
      gap_id: safeText(item?.gap_id),
      status: safeText(item?.status),
      note: safeText(item?.note),
    })),
  };
}

function buildResultDraft(request) {
  return {
    schema_version: 1,
    topic_id: safeText(request?.topic_id),
    request_kind: 'shared_source_readiness_augmentation_result',
    status: 'completed',
    readiness_target: safeText(request?.readiness_target, 'planning_ready'),
    topic_summary: safeText(request?.focus?.topic_summary),
    reference_source_list: [],
    key_fact_groups: [],
    source_quality_notes: [],
    evidence_gap_resolution: buildDraftEvidenceGapResolution(request),
  };
}

function buildResultContract(request, payload) {
  const normalized = normalizeResultPayload(payload);
  return {
    schema_version: 1,
    topic_id: safeText(request?.topic_id),
    request_kind: 'shared_source_readiness_augmentation_result',
    status: 'completed',
    readiness_target: safeText(request?.readiness_target, 'planning_ready'),
    topic_summary: normalized.topic_summary,
    reference_source_list: normalized.reference_source_list,
    key_fact_groups: normalized.key_fact_groups,
    source_quality_notes: normalized.source_quality_notes,
    evidence_gap_resolution: normalized.evidence_gap_resolution,
  };
}

function loadWriteInput({ inputFile, payloadFile, result }) {
  const explicitInputFile = safeText(inputFile || payloadFile);
  if (explicitInputFile) {
    return readJson(path.resolve(explicitInputFile));
  }
  if (result && typeof result === 'object' && !Array.isArray(result)) {
    return result;
  }
  throw new Error('source augmentation result write 需要 result、inputFile 或 payloadFile');
}

export async function prepareSourceAugmentationResult({
  workspaceRoot,
  topicId,
}) {
  const sourcePaths = getSourceArtifactPaths(workspaceRoot, topicId);
  const request = loadCanonicalAugmentationRequest(sourcePaths);
  const resultDraft = buildResultDraft(request);

  writeJson(sourcePaths.sourceAugmentationResultFile, resultDraft);

  return {
    ok: true,
    topicId,
    artifactFiles: {
      sourceAugmentationRequestFile: sourcePaths.sourceAugmentationRequestFile,
      sourceAugmentationResultFile: sourcePaths.sourceAugmentationResultFile,
    },
    request,
    resultDraft,
  };
}

export async function writeSourceAugmentationResult({
  workspaceRoot,
  topicId,
  inputFile = '',
  payloadFile = '',
  result = null,
}) {
  const sourcePaths = getSourceArtifactPaths(workspaceRoot, topicId);
  const request = loadCanonicalAugmentationRequest(sourcePaths);
  const resultInput = loadWriteInput({ inputFile, payloadFile, result });
  const resultContract = buildResultContract(request, resultInput);
  const validation = validateSourceAugmentationResultContract(resultContract, {
    expectedTopicId: safeText(request?.topic_id),
    requiredEvidenceGaps: safeArray(request?.trigger?.evidence_gaps),
  });

  if (!validation.ok) {
    throw new Error(`source augmentation result contract invalid: ${validation.errors.join('; ')}`);
  }

  writeJson(sourcePaths.sourceAugmentationResultFile, resultContract);

  return {
    ok: true,
    topicId,
    artifactFiles: {
      sourceAugmentationRequestFile: sourcePaths.sourceAugmentationRequestFile,
      sourceAugmentationResultFile: sourcePaths.sourceAugmentationResultFile,
    },
    resultContract,
  };
}
