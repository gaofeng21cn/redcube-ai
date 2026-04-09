import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import {
  getSourceArtifactPaths,
  validateSourceAugmentationRequestContract,
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

function augmentationStatusFromPack(sourceReadinessPack) {
  const state = safeText(sourceReadinessPack?.readiness?.deep_research_state, 'not_required');
  if (state === 'required') return 'required';
  if (state === 'recommended') return 'recommended';
  return 'not_required';
}

function executionModeForStatus(status) {
  if (status === 'required') return 'auto_required';
  if (status === 'recommended') return 'operator_optional';
  return 'not_needed';
}

function buildInvestigationLanes({ title, keywords, topicSummary, evidenceGaps, status }) {
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
}) {
  const status = augmentationStatusFromPack(sourceReadinessPack);
  const evidenceGaps = safeArray(sourceReadinessPack?.fact_library?.evidence_gaps)
    .map((item) => safeText(item))
    .filter(Boolean);
  const blockingEvidenceGaps = safeArray(sourceReadinessPack?.fact_library?.blocking_evidence_gaps)
    .map((item) => safeText(item))
    .filter(Boolean);
  const residualEvidenceGaps = safeArray(sourceReadinessPack?.fact_library?.residual_evidence_gaps)
    .map((item) => safeText(item))
    .filter(Boolean);
  const topicSummary = safeText(
    sourceReadinessPack?.fact_library?.topic_summary,
    safeText(sourceBrief?.brief_text, safeText(title, topicId)),
  );
  const keywords = safeArray(sourceBrief?.keywords).map((item) => safeText(item)).filter(Boolean);

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
      input_mode: safeText(sourceBrief?.input_mode, 'empty'),
      confidence: safeText(sourceBrief?.confidence, 'low'),
      source_audit_status: safeText(sourceAudit?.status, 'missing'),
      source_sufficiency_status: safeText(sourceReadinessPack?.readiness?.sufficiency_status, 'augmentation_required'),
      deep_research_state: safeText(sourceReadinessPack?.readiness?.deep_research_state, 'not_required'),
      blocking_evidence_gaps: blockingEvidenceGaps,
      residual_evidence_gaps: residualEvidenceGaps,
      evidence_gaps: evidenceGaps,
    },
    focus: {
      topic_summary: topicSummary,
      brief_text: safeText(sourceBrief?.brief_text),
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
    title: safeText(title) || safeText(sourceReadinessPack?.title, topicId),
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
