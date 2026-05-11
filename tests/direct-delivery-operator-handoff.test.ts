// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { mkdtempSync } from 'node:fs';

import {
  auditDeliverable,
  createDeliverable,
  getPublicationProjection,
  getReviewState,
  runDeliverableRoute,
  runtimeWatch,
} from './product-domain-action-test-api.ts';
import { completeSourceReadiness } from './helpers/complete-source-readiness.ts';
import { withMockCodexRuntime } from './mock-codex-cli.ts';

async function runRoutes(workspaceRoot, overlay, topicId, deliverableId, routes) {
  for (const route of routes) {
    const result = await runDeliverableRoute({ workspaceRoot, overlay, topicId, deliverableId, route });
    assert.equal(result.ok, true, `${overlay}:${route}`);
  }
}

test('direct-delivery families expose one aligned operator_handoff summary across audit/watch/review/projection surfaces', async () => {
  await withMockCodexRuntime(async () => {
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-direct-handoff-'));
    await completeSourceReadiness({
      workspaceRoot,
      topicId: 'topic-a',
      title: '甲状腺门诊源材料',
      brief: '需要为 deck 与 poster 生成同题材交付。',
      keywords: ['甲状腺', '门诊', '科普'],
    });
    await createDeliverable({
      workspaceRoot,
      overlay: 'ppt_deck',
      profileId: 'lecture_student',
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      title: '甲状腺门诊科普 deck',
      goal: '为本科生讲授甲状腺基础知识',
    });
    await runRoutes(workspaceRoot, 'ppt_deck', 'topic-a', 'deck-a', [
      'storyline',
      'detailed_outline',
      'slide_blueprint',
      'visual_direction',
      'author_image_pages',
      'visual_director_review',
      'screenshot_review',
      'export_pptx',
    ]);

    const review = await getReviewState({ workspaceRoot, topicId: 'topic-a', deliverableId: 'deck-a' });
    const projection = await getPublicationProjection({ workspaceRoot, topicId: 'topic-a' });
    const audit = await auditDeliverable({ workspaceRoot, overlay: 'ppt_deck', topicId: 'topic-a', deliverableId: 'deck-a', mode: 'draft_new' });
    const watch = await runtimeWatch({
      workspaceRoot,
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      run: {
        run_id: 'run-deck-a-001',
        topic_id: 'topic-a',
        deliverable_id: 'deck-a',
        overlay: 'ppt_deck',
        current_stage: 'export_pptx',
        status: 'completed',
      },
    });

    const projectionEntry = projection.publication.deliverables['deck-a'];
    assert.deepEqual(review.operator_handoff, projectionEntry.operator_handoff);
    assert.deepEqual(audit.operator_handoff, projectionEntry.operator_handoff);
    assert.deepEqual(watch.operator_handoff, projectionEntry.operator_handoff);
    assert.deepEqual(review.lifecycle_stage_summary, projectionEntry.lifecycle_stage_summary);
    assert.deepEqual(audit.lifecycle_stage_summary, projectionEntry.lifecycle_stage_summary);
    assert.deepEqual(watch.lifecycle_stage_summary, projectionEntry.lifecycle_stage_summary);
    assert.equal(review.operator_handoff.handoff_kind, 'direct_delivery_operator');
    assert.equal(review.operator_handoff.gate_status, 'ready');
    assert.equal(review.operator_handoff.delivery_state_owner, 'required_export_artifact.delivery_state');
    assert.equal(review.operator_handoff.required_export_route, 'export_pptx');
    assert.equal(review.operator_handoff.required_export_bundle_id, 'lecture_student_bundle');
    assert.equal(review.operator_handoff.delivery_state_current, 'output_ready');
    assert.equal(review.operator_handoff.reopen_mutation_surface, 'request_changes');
    assert.equal(review.operator_handoff.closeout_mutation_surface, 'promote_baseline');
    assert.equal(review.lifecycle_stage_summary.stage_model, 'direct_delivery_human_workline');
    assert.deepEqual(review.lifecycle_stage_summary.human_workline, ['source_readiness', 'storyline', 'plan', 'visual', 'delivery']);
    assert.equal(review.lifecycle_stage_summary.human_to_macro_stage.plan, 'story_architecture');
    assert.equal(review.lifecycle_stage_summary.review_overlay_within, 'visual');
    assert.equal(review.lifecycle_stage_summary.operator_handoff_within, 'delivery');
    assert.equal(review.lifecycle_stage_summary.closeout_within, 'delivery');
    assert.equal(review.lifecycle_stage_summary.route_to_human_stage.detailed_outline, 'plan');
    assert.equal(review.lifecycle_stage_summary.route_to_human_stage.export_pptx, 'delivery');
    assert.equal(audit.gate_summary.operator_handoff_status, 'ready');
    assert.equal(watch.gate_summary.operator_handoff_status, 'ready');
    assert.equal(audit.gate_summary.delivery_state_owner, 'required_export_artifact.delivery_state');
  });
});

test('direct-delivery operator_handoff stays blocked when canonical source readiness is missing even if export output is ready', async () => {
  await withMockCodexRuntime(async () => {
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-direct-handoff-blocked-'));
    await createDeliverable({
      workspaceRoot,
      overlay: 'poster_onepager',
      profileId: 'knowledge_poster',
      topicId: 'topic-a',
      deliverableId: 'poster-a',
      title: '甲状腺门诊知识海报',
      goal: '为门诊患者生成单页知识海报',
    });
    await runRoutes(workspaceRoot, 'poster_onepager', 'topic-a', 'poster-a', [
      'storyline',
      'poster_blueprint',
      'visual_direction',
      'render_html',
      'visual_director_review',
      'screenshot_review',
      'export_bundle',
    ]);

    const review = await getReviewState({ workspaceRoot, topicId: 'topic-a', deliverableId: 'poster-a' });
    const projection = await getPublicationProjection({ workspaceRoot, topicId: 'topic-a' });
    const audit = await auditDeliverable({ workspaceRoot, overlay: 'poster_onepager', topicId: 'topic-a', deliverableId: 'poster-a', mode: 'draft_new' });
    const projectionEntry = projection.publication.deliverables['poster-a'];

    assert.equal(projectionEntry.current, 'output_ready');
    assert.equal(review.operator_handoff.gate_status, 'blocked');
    assert.equal(review.operator_handoff.blocking_reasons.includes('source_audit_missing'), true);
    assert.equal(review.lifecycle_stage_summary.route_to_human_stage.poster_blueprint, 'plan');
    assert.equal(audit.status, 'block');
    assert.equal(audit.operator_handoff.gate_status, 'blocked');
    assert.equal(audit.gate_summary.operator_handoff_status, 'blocked');
  });
});

test('human-publication family keeps explicit publish gate and does not expose direct-delivery lifecycle_stage_summary or operator_handoff', async () => {
  await withMockCodexRuntime(async () => {
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-direct-handoff-xhs-'));
    await completeSourceReadiness({
      workspaceRoot,
      topicId: 'topic-a',
      title: '甲状腺门诊小红书素材',
      brief: '为门诊患者准备甲状腺科普图文。',
      keywords: ['甲状腺', '门诊', '科普'],
    });
    await createDeliverable({
      workspaceRoot,
      overlay: 'xiaohongshu',
      profileId: 'standard_note',
      topicId: 'topic-a',
      deliverableId: 'note-a',
      title: '甲状腺门诊小红书科普',
      goal: '为门诊患者生成可发布的科普图文',
    });
    await runRoutes(workspaceRoot, 'xiaohongshu', 'topic-a', 'note-a', [
      'research',
      'storyline',
      'single_note_plan',
      'visual_direction',
      'render_html',
      'visual_director_review',
      'screenshot_review',
      'publish_copy',
      'export_bundle',
    ]);

    const review = await getReviewState({ workspaceRoot, topicId: 'topic-a', deliverableId: 'note-a' });
    const projection = await getPublicationProjection({ workspaceRoot, topicId: 'topic-a' });
    const audit = await auditDeliverable({ workspaceRoot, overlay: 'xiaohongshu', topicId: 'topic-a', deliverableId: 'note-a', mode: 'draft_new' });
    const watch = await runtimeWatch({
      workspaceRoot,
      topicId: 'topic-a',
      deliverableId: 'note-a',
      run: {
        run_id: 'run-note-a-001',
        topic_id: 'topic-a',
        deliverable_id: 'note-a',
        overlay: 'xiaohongshu',
        current_stage: 'export_bundle',
        status: 'completed',
      },
    });

    assert.equal(review.operator_handoff ?? null, null);
    assert.equal(review.lifecycle_stage_summary ?? null, null);
    assert.equal(projection.publication.deliverables['note-a'].operator_handoff ?? null, null);
    assert.equal(projection.publication.deliverables['note-a'].lifecycle_stage_summary ?? null, null);
    assert.equal(audit.operator_handoff ?? null, null);
    assert.equal(audit.lifecycle_stage_summary ?? null, null);
    assert.equal(watch.operator_handoff ?? null, null);
    assert.equal(watch.lifecycle_stage_summary ?? null, null);
    assert.equal(projection.publication.deliverables['note-a'].current, 'approval_pending');
  });
});
