import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import {
  getSourceArtifactPaths,
  validateSourceAugmentationRequestContract,
  validateSourceAugmentationResultContract,
} from '@redcube/runtime-protocol';

type JsonRecord = Record<string, unknown>;

interface SourceArtifactPaths {
  sourceAugmentationRequestFile: string;
  sourceAugmentationResultFile: string;
}

function asRecord(value: unknown): JsonRecord {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as JsonRecord : {};
}

function ensureDir(dir: string): string {
  mkdirSync(dir, { recursive: true });
  return dir;
}

function writeJson(file: string, value: unknown): void {
  ensureDir(path.dirname(file));
  writeFileSync(file, JSON.stringify(value, null, 2), 'utf-8');
}

function readJson(file: string): JsonRecord {
  return JSON.parse(readFileSync(file, 'utf-8')) as JsonRecord;
}

function safeText(value: unknown, fallback = ''): string {
  const text = String(value || '').trim();
  return text || fallback;
}

function safeArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function loadCanonicalAugmentationRequest(sourcePaths: SourceArtifactPaths): JsonRecord {
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

function buildDraftEvidenceGapResolution(request: JsonRecord): JsonRecord[] {
  return safeArray(asRecord(request.trigger).evidence_gaps)
    .map((gapId) => safeText(gapId))
    .filter(Boolean)
    .map((gapId) => ({
      gap_id: gapId,
      status: 'unresolved',
      note: '',
    }));
}

function normalizeResultPayload(value: unknown) {
  const payload = asRecord(value);
  return {
    topic_summary: safeText(payload.topic_summary),
    reference_source_list: safeArray(payload.reference_source_list).map((item) => ({
      reference_id: safeText(asRecord(item).reference_id),
      label: safeText(asRecord(item).label),
      url: safeText(asRecord(item).url),
    })),
    key_fact_groups: safeArray(payload.key_fact_groups).map((item) => ({
      fact_id: safeText(asRecord(item).fact_id),
      label: safeText(asRecord(item).label),
      reference_id: safeText(asRecord(item).reference_id),
    })),
    source_quality_notes: safeArray(payload.source_quality_notes)
      .map((item) => safeText(item))
      .filter(Boolean),
    evidence_gap_resolution: safeArray(payload.evidence_gap_resolution).map((item) => ({
      gap_id: safeText(asRecord(item).gap_id),
      status: safeText(asRecord(item).status),
      note: safeText(asRecord(item).note),
    })),
  };
}

function buildResultDraft(request: JsonRecord): JsonRecord {
  return {
    schema_version: 1,
    topic_id: safeText(request.topic_id),
    request_kind: 'shared_source_readiness_augmentation_result',
    status: 'completed',
    readiness_target: safeText(request.readiness_target, 'planning_ready'),
    topic_summary: safeText(asRecord(request.focus).topic_summary),
    reference_source_list: [],
    key_fact_groups: [],
    source_quality_notes: [],
    evidence_gap_resolution: buildDraftEvidenceGapResolution(request),
  };
}

function buildResultContract(request: JsonRecord, payload: unknown): JsonRecord {
  const normalized = normalizeResultPayload(payload);
  return {
    schema_version: 1,
    topic_id: safeText(request.topic_id),
    request_kind: 'shared_source_readiness_augmentation_result',
    status: 'completed',
    readiness_target: safeText(request.readiness_target, 'planning_ready'),
    topic_summary: normalized.topic_summary,
    reference_source_list: normalized.reference_source_list,
    key_fact_groups: normalized.key_fact_groups,
    source_quality_notes: normalized.source_quality_notes,
    evidence_gap_resolution: normalized.evidence_gap_resolution,
  };
}

function loadWriteInput({
  inputFile,
  payloadFile,
  result,
}: {
  inputFile?: string;
  payloadFile?: string;
  result?: unknown;
}): JsonRecord {
  const explicitInputFile = safeText(inputFile || payloadFile);
  if (explicitInputFile) {
    return readJson(path.resolve(explicitInputFile));
  }
  if (result && typeof result === 'object' && !Array.isArray(result)) {
    return result as JsonRecord;
  }
  throw new Error('source augmentation result write 需要 result、inputFile 或 payloadFile');
}

export async function prepareSourceAugmentationResult({
  workspaceRoot,
  topicId,
}: {
  workspaceRoot: string;
  topicId: string;
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
}: {
  workspaceRoot: string;
  topicId: string;
  inputFile?: string;
  payloadFile?: string;
  result?: JsonRecord | null;
}) {
  const sourcePaths = getSourceArtifactPaths(workspaceRoot, topicId);
  const request = loadCanonicalAugmentationRequest(sourcePaths);
  const resultInput = loadWriteInput({ inputFile, payloadFile, result });
  const resultContract = buildResultContract(request, resultInput);
  const validation = validateSourceAugmentationResultContract(resultContract, {
    expectedTopicId: safeText(request.topic_id),
    requiredEvidenceGaps: safeArray(asRecord(request.trigger).evidence_gaps)
      .map((gapId) => safeText(gapId))
      .filter(Boolean),
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
