import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';

import * as runtimeProtocol from '../packages/redcube-runtime-protocol/src/index.js';

function getValidator(name) {
  assert.equal(typeof runtimeProtocol[name], 'function', `${name} 必须由 runtime-protocol 导出`);
  return runtimeProtocol[name];
}

function buildValidRequest() {
  return {
    schema_version: 1,
    topic_id: 'topic-contract',
    title: '甲状腺门诊沟通',
    request_kind: 'shared_source_readiness_augmentation',
    status: 'required',
    execution_mode: 'auto_required',
    readiness_target: 'planning_ready',
    authoritative_inputs: {
      source_brief: 'canonical/source-brief.json',
      source_audit: 'canonical/source-audit.json',
      source_readiness_pack: 'canonical/source-readiness-pack.json',
    },
    trigger: {
      input_mode: 'brief_keywords',
      confidence: 'low',
      source_audit_status: 'pass',
      source_sufficiency_status: 'augmentation_required',
      deep_research_state: 'required',
      evidence_gaps: ['public_evidence_missing', 'consumable_material_missing'],
    },
    focus: {
      topic_summary: '围绕甲状腺门诊沟通补全可追溯的公开事实与行动判断。',
      brief_text: '只有主题和粗略想法，需要补料。',
      keywords: ['甲状腺', '门诊', '患者沟通'],
      required_outputs: [
        'topic_summary',
        'key_fact_groups',
        'reference_source_list',
        'source_quality_notes',
        'evidence_gap_resolution',
      ],
    },
    investigation_lanes: [
      {
        lane_id: 'core_topic_facts',
        priority: 'required',
        objective: '补全主题定义、适用边界与核心事实',
        deliverable_value: '支撑后续 Storyline / Plan 判断',
        focus_terms: ['甲状腺', '门诊'],
      },
    ],
  };
}

function buildValidResult() {
  return {
    schema_version: 1,
    topic_id: 'topic-contract',
    request_kind: 'shared_source_readiness_augmentation_result',
    status: 'completed',
    readiness_target: 'planning_ready',
    topic_summary: '甲状腺门诊沟通需要先解释判断顺序，再解释术语与下一步动作。',
    reference_source_list: [
      {
        reference_id: 'REF-001',
        label: '国家指南',
        url: 'https://example.com/guideline',
      },
    ],
    key_fact_groups: [
      {
        fact_id: 'FACT-001',
        label: 'TSH 异常后需要结合 FT4 判断下一步动作。',
        reference_id: 'REF-001',
      },
    ],
    source_quality_notes: ['优先使用近年的公开指南与系统综述。'],
    evidence_gap_resolution: [
      {
        gap_id: 'public_evidence_missing',
        status: 'resolved',
        note: '已补入可追溯公开来源。',
      },
      {
        gap_id: 'consumable_material_missing',
        status: 'unresolved',
        note: '仍建议补充更多门诊沟通实例。',
      },
    ],
  };
}

test('runtime-protocol exposes source augmentation contract validators', () => {
  getValidator('validateSourceAugmentationRequestContract');
  getValidator('validateSourceAugmentationResultContract');
});

test('runtime-protocol exposes canonical source augmentation result artifact path', () => {
  const getPaths = getValidator('getSourceArtifactPaths');
  const paths = getPaths('/tmp/redcube-workspace', 'topic-contract');

  assert.equal(
    paths.sourceAugmentationResultFile,
    path.join('/tmp/redcube-workspace', 'topics', 'topic-contract', 'canonical', 'source-augmentation-result.json'),
  );
});

test('validateSourceAugmentationRequestContract accepts canonical source augmentation request', () => {
  const validate = getValidator('validateSourceAugmentationRequestContract');
  const validation = validate(buildValidRequest());

  assert.equal(validation.ok, true);
  assert.deepEqual(validation.errors, []);
});

test('validateSourceAugmentationResultContract rejects dangling fact reference ids', () => {
  const validate = getValidator('validateSourceAugmentationResultContract');
  const result = buildValidResult();
  result.key_fact_groups[0].reference_id = 'REF-404';

  const validation = validate(result);

  assert.equal(validation.ok, false);
  assert.equal(
    validation.errors.some((item) => String(item).includes('reference_id')),
    true,
  );
});

test('validateSourceAugmentationResultContract requires every request evidence gap to appear in result', () => {
  const validate = getValidator('validateSourceAugmentationResultContract');
  const result = buildValidResult();
  result.evidence_gap_resolution = [
    {
      gap_id: 'public_evidence_missing',
      status: 'resolved',
      note: '已补入可追溯公开来源。',
    },
  ];

  const validation = validate(result, {
    requiredEvidenceGaps: ['public_evidence_missing', 'consumable_material_missing'],
  });

  assert.equal(validation.ok, false);
  assert.equal(
    validation.errors.some((item) => String(item).includes('consumable_material_missing')),
    true,
  );
});
