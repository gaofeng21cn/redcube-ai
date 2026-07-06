import { existsSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import {
  getSourceArtifactPaths,
  validateSourceAugmentationRequestContract,
} from '@redcube/runtime-protocol';
import { ensureDir, readJson, safeText } from './runtime-utils.js';

type JsonRecord = Record<string, unknown>;
type AugmentationStatus = 'required' | 'recommended' | 'not_required';

function asRecord(value: unknown): JsonRecord {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as JsonRecord : {};
}

function writeJson(file: string, value: unknown): void {
  ensureDir(path.dirname(file));
  writeFileSync(file, JSON.stringify(value, null, 2), 'utf-8');
}

function safeArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function augmentationStatusFromPack(sourceReadinessPack: JsonRecord): AugmentationStatus {
  const state = safeText(asRecord(sourceReadinessPack.readiness).deep_research_state, 'not_required');
  if (state === 'required') return 'required';
  if (state === 'recommended') return 'recommended';
  return 'not_required';
}

function executionModeForStatus(status: AugmentationStatus): string {
  if (status === 'required') return 'auto_required';
  if (status === 'recommended') return 'operator_optional';
  return 'not_needed';
}

function buildInvestigationLanes({
  title,
  keywords,
  topicSummary,
  evidenceGaps,
  status,
}: {
  title: string;
  keywords: unknown[];
  topicSummary: string;
  evidenceGaps: string[];
  status: AugmentationStatus;
}): JsonRecord[] {
  const focusTerms = safeArray(keywords).map((item) => safeText(item)).filter(Boolean);
  const lanes = [
    {
      lane_id: 'core_topic_facts',
      priority: 'required',
      objective: `补全 ${safeText(title, topicSummary)} 的主题定义、适用边界与核心事实`,
      deliverable_value: '支撑后续 Storyline / Plan 对主题主线的判断',
      focus_terms: focusTerms,
    },
  ];

  if (evidenceGaps.includes('public_evidence_missing')) {
    lanes.push({
      lane_id: 'public_evidence_traceability',
      priority: 'required',
      objective: '补全公开、可追溯、可引用的来源列表与对应关键事实',
      deliverable_value: '支撑事实库的可信引用与后续 visual / delivery 的可追溯性',
      focus_terms: focusTerms,
    });
  }

  if (evidenceGaps.includes('consumable_material_missing')) {
    lanes.push({
      lane_id: 'fact_library_expansion',
      priority: 'required',
      objective: '补全可直接消费的关键事实分组、判断句与行动相关事实',
      deliverable_value: '把稀薄输入扩成可直接被 family 消费的事实库',
      focus_terms: focusTerms,
    });
  }

  if (status !== 'not_required') {
    lanes.push({
      lane_id: 'storyline_supporting_facts',
      priority: status === 'required' ? 'required' : 'suggested',
      objective: '补全支撑 Storyline / Plan 的判断顺序、误区成本与行动建议相关事实',
      deliverable_value: '让后续 Storyline 与 Plan 不需要继续承担补事实职责',
      focus_terms: focusTerms,
    });
  }

  return lanes;
}

export function buildSourceAugmentationRequest({
  topicId,
  title,
  sourceBrief,
  sourceAudit,
  sourceReadinessPack,
}: {
  topicId: string;
  title: string;
  sourceBrief: JsonRecord;
  sourceAudit: JsonRecord;
  sourceReadinessPack: JsonRecord;
}): JsonRecord {
  const status = augmentationStatusFromPack(sourceReadinessPack);
  const factLibrary = asRecord(sourceReadinessPack.fact_library);
  const readiness = asRecord(sourceReadinessPack.readiness);
  const evidenceGaps = safeArray(factLibrary.evidence_gaps)
    .map((item) => safeText(item))
    .filter(Boolean);
  const blockingEvidenceGaps = safeArray(factLibrary.blocking_evidence_gaps)
    .map((item) => safeText(item))
    .filter(Boolean);
  const residualEvidenceGaps = safeArray(factLibrary.residual_evidence_gaps)
    .map((item) => safeText(item))
    .filter(Boolean);
  const topicSummary = safeText(
    factLibrary.topic_summary,
    safeText(title, topicId),
  );
  const keywords = safeArray(sourceBrief.keywords).map((item) => safeText(item)).filter(Boolean);

  return {
    schema_version: 1,
    topic_id: topicId,
    title: safeText(title, topicId),
    request_kind: 'shared_source_readiness_augmentation',
    status,
    execution_mode: executionModeForStatus(status),
    readiness_target: 'planning_ready',
    authoritative_inputs: {
      source_brief: 'canonical/source-brief.json',
      source_audit: 'canonical/source-audit.json',
      source_readiness_pack: 'canonical/source-readiness-pack.json',
    },
    trigger: {
      input_mode: safeText(sourceBrief.input_mode, 'empty'),
      confidence: safeText(sourceBrief.confidence, 'low'),
      source_audit_status: safeText(sourceAudit.status, 'missing'),
      source_sufficiency_status: safeText(readiness.sufficiency_status, 'augmentation_required'),
      deep_research_state: safeText(readiness.deep_research_state, 'not_required'),
      blocking_evidence_gaps: blockingEvidenceGaps,
      residual_evidence_gaps: residualEvidenceGaps,
      evidence_gaps: evidenceGaps,
    },
    focus: {
      topic_summary: topicSummary,
      brief_text: safeText(sourceBrief.brief_text),
      keywords,
      required_outputs: [
        'topic_summary',
        'key_fact_groups',
        'reference_source_list',
        'source_quality_notes',
        'evidence_gap_resolution',
      ],
    },
    investigation_lanes: buildInvestigationLanes({
      title: safeText(title, topicId),
      keywords,
      topicSummary,
      evidenceGaps,
      status,
    }),
  };
}

export async function prepareSourceAugmentation({
  workspaceRoot,
  topicId,
  title = '',
}: {
  workspaceRoot: string;
  topicId: string;
  title?: string;
}) {
  const sourcePaths = getSourceArtifactPaths(workspaceRoot, topicId);
  const requiredFiles = [
    sourcePaths.sourceBriefFile,
    sourcePaths.sourceAuditFile,
    sourcePaths.sourceReadinessPackFile,
  ];

  for (const file of requiredFiles) {
    if (!existsSync(file)) {
      throw new Error(`source augmentation 需要已有 canonical source readiness: ${file}`);
    }
  }

  const sourceBrief = readJson(sourcePaths.sourceBriefFile);
  const sourceAudit = readJson(sourcePaths.sourceAuditFile);
  const sourceReadinessPack = readJson(sourcePaths.sourceReadinessPackFile);
  const augmentation = buildSourceAugmentationRequest({
    topicId,
    title: safeText(title) || safeText(sourceReadinessPack.title, topicId),
    sourceBrief,
    sourceAudit,
    sourceReadinessPack,
  });
  const validation = validateSourceAugmentationRequestContract(augmentation);
  if (!validation.ok) {
    throw new Error(`source augmentation request contract invalid: ${validation.errors.join('; ')}`);
  }

  writeJson(sourcePaths.sourceAugmentationRequestFile, augmentation);

  return {
    ok: true,
    topicId,
    artifactFiles: {
      sourceAugmentationRequestFile: sourcePaths.sourceAugmentationRequestFile,
    },
    augmentation,
  };
}
