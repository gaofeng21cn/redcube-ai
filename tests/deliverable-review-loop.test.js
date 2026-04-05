import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';

import {
  auditDeliverable,
  createDeliverable,
  reviewRenderOutput,
  runDeliverableRoute,
  runtimeWatch,
} from '../packages/redcube-gateway/src/index.js';

test('auditDeliverable blocks optimize_existing task without baseline', async () => {
  const report = await auditDeliverable({
    overlay: 'ppt_deck',
    mode: 'optimize_existing',
    baselineDeliverableId: '',
  });

  assert.equal(report.status, 'block');
  assert.deepEqual(report.issues, ['baseline_missing']);
  assert.equal(report.rerun_from_stage, 'intake');
  assert.equal(report.recommended_action, 'bind_baseline_deliverable');
});

test('auditDeliverable blocks optimize_existing task when baseline is not approved', async () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-review-loop-'));

  await createDeliverable({
    workspaceRoot,
    overlay: 'xiaohongshu',
    profileId: 'standard_note',
    topicId: 'topic-a',
    deliverableId: 'baseline-a',
    title: '甲状腺门诊小红书 baseline',
    goal: '作为后续优化的旧版基线',
  });
  await createDeliverable({
    workspaceRoot,
    overlay: 'xiaohongshu',
    profileId: 'standard_note',
    topicId: 'topic-a',
    deliverableId: 'candidate-a',
    title: '甲状腺门诊小红书优化版',
    goal: '在现有基线之上继续优化',
  });

  const report = await auditDeliverable({
    workspaceRoot,
    overlay: 'xiaohongshu',
    topicId: 'topic-a',
    deliverableId: 'candidate-a',
    mode: 'optimize_existing',
    baselineDeliverableId: 'baseline-a',
  });

  assert.equal(report.status, 'block');
  assert.deepEqual(report.issues, ['baseline_not_approved']);
  assert.equal(report.rerun_from_stage, 'intake');
  assert.equal(report.recommended_action, 'approve_or_publish_baseline');
});

test('auditDeliverable blocks missing hydrated surface artifact', async () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-review-loop-'));

  await createDeliverable({
    workspaceRoot,
    overlay: 'ppt_deck',
    profileId: 'lecture_student',
    topicId: 'topic-a',
    deliverableId: 'deck-a',
    title: '甲状腺门诊科普 deck',
    goal: '为本科生讲授甲状腺基础知识',
  });
  rmSync(path.join(
    workspaceRoot,
    'topics',
    'topic-a',
    'deliverables',
    'deck-a',
    'contracts',
    'hydrated-deliverable.json',
  ));

  const report = await auditDeliverable({
    workspaceRoot,
    overlay: 'ppt_deck',
    topicId: 'topic-a',
    deliverableId: 'deck-a',
  });

  assert.equal(report.status, 'block');
  assert.deepEqual(report.issues, ['deliverable_contract_missing:hydrated_deliverable']);
  assert.equal(report.rerun_from_stage, 'intake');
  assert.equal(report.recommended_action, 'rehydrate_deliverable_surface');
});

test('reviewRenderOutput emits rerun target when visual density is too high', async () => {
  const report = await reviewRenderOutput({
    overlay: 'ppt_deck',
    checks: { visual_density_ok: false, overflow_free: true },
  });

  assert.equal(report.status, 'block');
  assert.deepEqual(report.issues, ['visual_density_too_high']);
  assert.equal(report.rerun_from_stage, 'visual_direction');
});

test('reviewRenderOutput reports missing visual density check separately', async () => {
  const report = await reviewRenderOutput({
    overlay: 'ppt_deck',
    checks: {},
  });

  assert.equal(report.status, 'block');
  assert.deepEqual(report.issues, ['visual_density_check_missing']);
  assert.equal(report.rerun_from_stage, 'render_review');
  assert.equal(report.recommended_action, 'supply_render_checks');
});

test('reviewRenderOutput loads lecture_student profile checks from hydrated contract', async () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-review-loop-'));

  await createDeliverable({
    workspaceRoot,
    overlay: 'ppt_deck',
    profileId: 'lecture_student',
    topicId: 'topic-a',
    deliverableId: 'deck-a',
    title: '甲状腺门诊科普 deck',
    goal: '为本科生讲授甲状腺基础知识',
  });

  const report = await reviewRenderOutput({
    workspaceRoot,
    topicId: 'topic-a',
    deliverableId: 'deck-a',
    overlay: 'ppt_deck',
    checks: {
      overflow_free: true,
      occlusion_free: true,
      visual_density_ok: true,
      speaker_fit_ok: true,
      teaching_progression_clear: true,
    },
  });

  assert.equal(report.status, 'block');
  assert.deepEqual(report.issues, ['term_explained_on_first_use_missing']);
  assert.equal(report.rerun_from_stage, 'storyline');
  assert.equal(report.recommended_action, 'supply_render_checks');
});

test('reviewRenderOutput loads executive_briefing profile checks from hydrated contract', async () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-review-loop-'));

  await createDeliverable({
    workspaceRoot,
    overlay: 'ppt_deck',
    profileId: 'executive_briefing',
    topicId: 'topic-a',
    deliverableId: 'deck-a',
    title: '门诊改造汇报 deck',
    goal: '向院领导汇报门诊容量与改造建议',
  });

  const report = await reviewRenderOutput({
    workspaceRoot,
    topicId: 'topic-a',
    deliverableId: 'deck-a',
    overlay: 'ppt_deck',
    checks: {
      overflow_free: true,
      occlusion_free: true,
      visual_density_ok: true,
      speaker_fit_ok: true,
      decision_implication_clear: false,
      conclusion_up_front: true,
    },
  });

  assert.equal(report.status, 'block');
  assert.deepEqual(report.issues, ['decision_implication_clear_failed']);
  assert.equal(report.rerun_from_stage, 'storyline');
  assert.equal(report.recommended_action, 'revise_render_output');
});

test('runtimeWatch reports pending review loop state', async () => {
  const report = await runtimeWatch({
    run: {
      run_id: 'run-1',
      current_stage: 'render_review',
      status: 'blocked',
      pending_reviews: ['render_review'],
      resumable: true,
    },
  });

  assert.equal(report.ok, true);
  assert.equal(report.run_id, 'run-1');
  assert.equal(report.current_stage, 'render_review');
  assert.equal(report.status, 'review_pending');
  assert.deepEqual(report.pending_reviews, ['render_review']);
  assert.equal(report.resumable, true);
});

test('runtimeWatch exposes export bundle obligations from hydrated contract', async () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-review-loop-'));

  await createDeliverable({
    workspaceRoot,
    overlay: 'ppt_deck',
    profileId: 'defense_deck',
    topicId: 'topic-a',
    deliverableId: 'deck-a',
    title: '正式答辩 deck',
    goal: '用于正式答辩并覆盖潜在质询',
  });

  const report = await runtimeWatch({
    workspaceRoot,
    topicId: 'topic-a',
    deliverableId: 'deck-a',
    run: {
      run_id: 'run-1',
      current_stage: 'export_pptx',
      status: 'blocked',
      pending_reviews: ['backup_qa_ready'],
      resumable: true,
    },
  });

  assert.equal(report.ok, true);
  assert.equal(report.profile_id, 'defense_deck');
  assert.equal(report.required_export_bundle.bundle_id, 'defense_deck_bundle');
  assert.equal(report.required_export_bundle.include_backup_slides, true);
});

test('runtimeWatch exposes publication projection separately from canonical review state', async () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-review-loop-'));

  await createDeliverable({
    workspaceRoot,
    overlay: 'xiaohongshu',
    profileId: 'standard_note',
    topicId: 'topic-a',
    deliverableId: 'note-a',
    title: '甲状腺门诊小红书科普',
    goal: '为门诊患者生成可发布的科普图文',
  });

  for (const route of ['research', 'storyline', 'single_note_plan', 'visual_direction', 'render_html', 'visual_director_review', 'screenshot_review', 'publish_copy']) {
    const result = await runDeliverableRoute({
      workspaceRoot,
      overlay: 'xiaohongshu',
      topicId: 'topic-a',
      deliverableId: 'note-a',
      route,
    });
    assert.equal(result.ok, true, route);
  }

  const report = await runtimeWatch({
    workspaceRoot,
    topicId: 'topic-a',
    deliverableId: 'note-a',
    run: {
      run_id: 'run-1',
      current_stage: 'publish_copy',
      status: 'completed',
      pending_reviews: [],
      resumable: false,
    },
  });

  assert.equal(report.review_state.publish_state.current, 'approval_pending');
  assert.equal(report.publication_projection.current, 'approval_pending');
});

test('@redcube/gateway manifest declares runtime dependency for review loop actions', () => {
  const gatewayPackageJson = JSON.parse(
    readFileSync(path.resolve('packages/redcube-gateway/package.json'), 'utf-8'),
  );
  const runtimePackageJson = JSON.parse(
    readFileSync(path.resolve('packages/redcube-runtime/package.json'), 'utf-8'),
  );

  assert.equal(
    gatewayPackageJson.dependencies?.['@redcube/runtime'],
    runtimePackageJson.version,
  );
});
