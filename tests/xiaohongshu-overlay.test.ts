// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildTopicRecord,
  buildXiaohongshuDeliverableRecord,
  evaluateStorylineGate,
  hydrateXiaohongshuContract,
} from './helpers/package-surfaces.ts';

test('buildTopicRecord emits canonical xiaohongshu topic metadata', () => {
  const topic = buildTopicRecord({ topicId: 'topic-a', title: '甲状腺科普系列' });

  assert.equal(topic.topic_id, 'topic-a');
  assert.equal(topic.overlay, 'xiaohongshu');
  assert.equal(topic.status, 'draft');
  assert.deepEqual(topic.routes, ['research', 'storyline', 'single_note_plan', 'visual_direction', 'render_html', 'visual_director_review', 'screenshot_review', 'fix_html', 'publish_copy', 'export_bundle']);
});

test('evaluateStorylineGate blocks empty storyline content', () => {
  const report = evaluateStorylineGate({ storylineText: '' });

  assert.equal(report.status, 'block');
  assert.deepEqual(report.blockers, ['storyline_empty']);
});

test('evaluateStorylineGate passes well-formed storyline content', () => {
  const report = evaluateStorylineGate({
    storylineText: '# 叙事逻辑\n\n## 核心冲突\n\n围绕误区到行动组织内容。',
  });

  assert.equal(report.status, 'pass');
  assert.deepEqual(report.blockers, []);
});

test('hydrateXiaohongshuContract emits standard_note contract on shared runtime model', () => {
  const contract = hydrateXiaohongshuContract({
    topicId: 'topic-a',
    deliverableId: 'note-a',
    title: '甲状腺门诊小红书科普',
    goal: '为门诊患者生成可发布的科普图文',
    profileId: 'standard_note',
  });

  assert.equal(contract.overlay, 'xiaohongshu');
  assert.equal(contract.profile_id, 'standard_note');
  assert.equal(contract.deliverable_kind, 'xiaohongshu_note');
  assert.deepEqual(
    contract.stage_sequence.stages.map((stage) => stage.stage_id),
    ['research', 'storyline', 'single_note_plan', 'visual_direction', 'render_html', 'visual_director_review', 'screenshot_review', 'fix_html', 'publish_copy', 'export_bundle'],
  );
  assert.equal(contract.export_bundle.bundle_id, 'xiaohongshu_standard_bundle');
  assert.equal(contract.prompt_pack.render_contract.compiler_module ?? null, null);
  assert.equal(contract.prompt_pack.render_contract.compiler_export ?? null, null);
  assert.equal(
    contract.prompt_pack.render_contract.ui_ux_quality_companion.source_skill_id,
    'ui-ux-pro-max',
  );
  assert.equal(
    contract.prompt_pack.render_contract.ui_ux_quality_companion.activation_surface,
    'internal_stage_context',
  );
  assert.deepEqual(
    contract.prompt_pack.render_contract.ui_ux_quality_companion.applies_to_routes,
    ['render_html', 'fix_html'],
  );
  assert.equal(
    contract.prompt_pack.render_contract.ui_ux_quality_companion.public_skill_policy,
    'do_not_register_as_public_redcube_skill',
  );
  assert.equal(contract.delivery_contract.required_export_route, 'export_bundle');
  assert.equal(contract.delivery_contract.human_gate.required, true);
});

test('buildXiaohongshuDeliverableRecord emits canonical xiaohongshu deliverable metadata', () => {
  const hydratedContract = hydrateXiaohongshuContract({
    topicId: 'topic-a',
    deliverableId: 'note-a',
    title: '甲状腺门诊小红书科普',
    goal: '为门诊患者生成可发布的科普图文',
    profileId: 'standard_note',
  });
  const deliverable = buildXiaohongshuDeliverableRecord({
    topicId: 'topic-a',
    deliverableId: 'note-a',
    title: '甲状腺门诊小红书科普',
    goal: '为门诊患者生成可发布的科普图文',
    profileId: 'standard_note',
    hydratedContract,
  });

  assert.equal(deliverable.overlay, 'xiaohongshu');
  assert.equal(deliverable.kind, 'xiaohongshu_note');
  assert.equal(deliverable.deliverable_kind, 'xiaohongshu_note');
  assert.equal(deliverable.profile_id, 'standard_note');
  assert.equal(deliverable.hydrated_contract_ref, 'contracts/hydrated-deliverable.json');
  assert.deepEqual(deliverable.routes, ['research', 'storyline', 'single_note_plan', 'visual_direction', 'render_html', 'visual_director_review', 'screenshot_review', 'fix_html', 'publish_copy', 'export_bundle']);
});
