// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildDeckRecord,
  evaluateStoryboardGate,
  hydratePptDeckContract,
} from './helpers/package-surfaces.ts';

test('buildDeckRecord emits canonical ppt deck metadata', () => {
  const hydratedContract = hydratePptDeckContract({
    topicId: 'topic-a',
    deliverableId: 'deck-a',
    title: '甲状腺门诊科普 deck',
    profileId: 'lecture_student',
    goal: '为本科生讲授甲状腺基础知识',
  });
  const deck = buildDeckRecord({
    topicId: 'topic-a',
    deliverableId: 'deck-a',
    title: '甲状腺门诊科普 deck',
    profileId: 'lecture_student',
    goal: '为本科生讲授甲状腺基础知识',
    hydratedContract,
  });

  assert.equal(deck.topic_id, 'topic-a');
  assert.equal(deck.deliverable_id, 'deck-a');
  assert.equal(deck.title, '甲状腺门诊科普 deck');
  assert.equal(deck.overlay, 'ppt_deck');
  assert.equal(deck.kind, 'ppt_deck');
  assert.equal(deck.profile_id, 'lecture_student');
  assert.equal(deck.goal, '为本科生讲授甲状腺基础知识');
  assert.equal(deck.hydrated_contract_ref, 'contracts/hydrated-deliverable.json');
  assert.equal(deck.slide_ratio, '16:9');
  assert.equal(deck.status, 'draft');
  assert.deepEqual(deck.routes, [
    'storyline',
    'detailed_outline',
    'slide_blueprint',
    'visual_direction',
    'render_html',
    'visual_director_review',
    'screenshot_review',
    'fix_html',
    'export_pptx',
  ]);
});

test('buildDeckRecord rejects blank required fields', () => {
  assert.throws(
    () => buildDeckRecord({
      topicId: 'topic-a',
      deliverableId: '',
      title: '甲状腺门诊科普 deck',
      profileId: 'lecture_student',
      goal: '为本科生讲授甲状腺基础知识',
      hydratedContract: hydratePptDeckContract({
        topicId: 'topic-a',
        deliverableId: 'deck-a',
        title: '甲状腺门诊科普 deck',
        profileId: 'lecture_student',
        goal: '为本科生讲授甲状腺基础知识',
      }),
    }),
    /Missing deliverable field: deliverableId/,
  );
});

test('hydratePptDeckContract emits profile-specific teaching and executive rules', () => {
  const lectureStudent = hydratePptDeckContract({
    topicId: 'topic-a',
    deliverableId: 'deck-a',
    title: '甲状腺门诊科普 deck',
    profileId: 'lecture_student',
    goal: '为本科生讲授甲状腺基础知识',
  });
  const executiveBriefing = hydratePptDeckContract({
    topicId: 'topic-a',
    deliverableId: 'deck-b',
    title: '门诊改造汇报 deck',
    profileId: 'executive_briefing',
    goal: '向院领导汇报门诊容量与改造建议',
  });

  assert.equal(
    lectureStudent.review_surface.required_checks.includes('term_explained_on_first_use'),
    true,
  );
  assert.equal(lectureStudent.layout_rules.density_mode, 'teaching_spread');
  assert.equal(lectureStudent.export_bundle.bundle_id, 'lecture_student_bundle');
  assert.equal(lectureStudent.delivery_contract.required_export_bundle_id, 'lecture_student_bundle');
  assert.equal(lectureStudent.delivery_contract.required_export_route, 'export_pptx');
  assert.equal(lectureStudent.prompt_pack.render_contract.default_visual_route, 'render_html');
  assert.equal(
    lectureStudent.prompt_pack.render_contract.ui_ux_quality_companion.source_skill_id,
    'ui-ux-pro-max',
  );
  assert.equal(
    lectureStudent.prompt_pack.render_contract.ui_ux_quality_companion.activation_surface,
    'internal_stage_context',
  );
  assert.deepEqual(
    lectureStudent.prompt_pack.render_contract.ui_ux_quality_companion.applies_to_routes,
    ['render_html', 'fix_html'],
  );
  assert.equal(
    lectureStudent.prompt_pack.render_contract.ui_ux_quality_companion.public_skill_policy,
    'do_not_register_as_public_redcube_skill',
  );
  assert.equal(lectureStudent.prompt_pack.render_contract.native_ppt_proof_lane.status, 'opt_in_proof_lane');
  assert.deepEqual(
    lectureStudent.prompt_pack.render_contract.native_ppt_proof_lane.replaces_routes,
    ['render_html', 'fix_html'],
  );
  assert.deepEqual(
    lectureStudent.prompt_pack.render_contract.native_ppt_proof_lane.preserved_gates,
    ['visual_director_review', 'screenshot_review', 'export_pptx'],
  );

  assert.equal(
    executiveBriefing.review_surface.required_checks.includes('decision_implication_clear'),
    true,
  );
  assert.equal(executiveBriefing.layout_rules.max_primary_points_per_slide, 3);
  assert.equal(executiveBriefing.export_bundle.include_presenter_notes, false);
  assert.equal(executiveBriefing.delivery_contract.required_export_bundle_id, 'executive_briefing_bundle');
});

test('evaluateStoryboardGate blocks empty slide list', () => {
  const report = evaluateStoryboardGate({ slides: [] });

  assert.equal(report.status, 'block');
  assert.deepEqual(report.blockers, ['slides_empty']);
  assert.equal(report.metrics.slide_count, 0);
  assert.equal(report.next_action, 'rerun_storyboard');
});

test('evaluateStoryboardGate passes when storyboard has slides', () => {
  const report = evaluateStoryboardGate({
    slides: [
      { slide_id: 'slide-1', title: '问题提出' },
      { slide_id: 'slide-2', title: '方法路径' },
    ],
  });

  assert.equal(report.status, 'pass');
  assert.deepEqual(report.blockers, []);
  assert.equal(report.metrics.slide_count, 2);
  assert.equal(report.next_action, 'continue');
});

test('evaluateStoryboardGate blocks malformed slide entries', () => {
  const report = evaluateStoryboardGate({
    slides: [null, {}],
  });

  assert.equal(report.status, 'block');
  assert.deepEqual(report.blockers, ['slides_invalid']);
  assert.equal(report.metrics.slide_count, 0);
  assert.equal(report.next_action, 'rerun_storyboard');
});
