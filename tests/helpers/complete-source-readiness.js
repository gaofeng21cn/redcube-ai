import { readFileSync } from 'node:fs';

import {
  researchSource,
} from '@redcube/domain-entry';

function readJson(file) {
  return JSON.parse(readFileSync(file, 'utf-8'));
}

export function buildResolvedAugmentationPayload(request) {
  const gapIds = Array.isArray(request?.trigger?.blocking_evidence_gaps) && request.trigger.blocking_evidence_gaps.length > 0
    ? request.trigger.blocking_evidence_gaps
    : Array.isArray(request?.trigger?.evidence_gaps)
      ? request.trigger.evidence_gaps
      : [];

  return {
    topic_summary: `${request?.focus?.topic_summary || request?.title || request?.topic_id || 'topic'}（已到达 planning_ready）`,
    reference_source_list: [
      { reference_id: 'REF-001', label: '国家指南', url: 'https://example.com/guideline' },
      { reference_id: 'REF-002', label: '系统综述', url: 'https://example.com/review' },
    ],
    key_fact_groups: [
      { fact_id: 'FACT-001', label: '补齐后可直接支撑 Storyline 与 Plan 判断。', reference_id: 'REF-001' },
      { fact_id: 'FACT-002', label: '公开来源已可追溯并可被后续 family 消费。', reference_id: 'REF-002' },
    ],
    source_quality_notes: ['优先使用公开可追溯指南与综述。'],
    evidence_gap_resolution: gapIds.map((gapId) => ({
      gap_id: gapId,
      status: 'resolved',
      note: `已解决 ${gapId}`,
    })),
  };
}

export async function completeSourceReadiness({
  workspaceRoot,
  topicId,
  title,
  brief = '',
  keywords = [],
  sourceFiles = [],
}) {
  const previousCmd = process.env.REDCUBE_SOURCE_AUGMENT_CMD;
  const previousAdapter = process.env.REDCUBE_SOURCE_AUGMENT_ADAPTER;
  const previousResultFile = process.env.REDCUBE_SOURCE_AUGMENT_RESULT_FILE;
  delete process.env.REDCUBE_SOURCE_AUGMENT_CMD;
  process.env.REDCUBE_SOURCE_AUGMENT_ADAPTER = 'result_file';
  delete process.env.REDCUBE_SOURCE_AUGMENT_RESULT_FILE;

  try {
    const staged = await researchSource({
      workspaceRoot,
      topicId,
      title,
      brief,
      keywords,
      sourceFiles,
    });

    if (staged.planningReady === true) {
      return staged;
    }

    const request = readJson(staged.artifactFiles.sourceAugmentationRequestFile);
    const completed = await researchSource({
      workspaceRoot,
      topicId,
      title,
      brief,
      keywords,
      sourceFiles,
      result: buildResolvedAugmentationPayload(request),
    });

    if (completed.planningReady !== true) {
      throw new Error(`Source Readiness 未到 planning_ready: ${topicId}`);
    }

    return completed;
  } finally {
    if (previousCmd === undefined) delete process.env.REDCUBE_SOURCE_AUGMENT_CMD;
    else process.env.REDCUBE_SOURCE_AUGMENT_CMD = previousCmd;
    if (previousAdapter === undefined) delete process.env.REDCUBE_SOURCE_AUGMENT_ADAPTER;
    else process.env.REDCUBE_SOURCE_AUGMENT_ADAPTER = previousAdapter;
    if (previousResultFile === undefined) delete process.env.REDCUBE_SOURCE_AUGMENT_RESULT_FILE;
    else process.env.REDCUBE_SOURCE_AUGMENT_RESULT_FILE = previousResultFile;
  }
}
