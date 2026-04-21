import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { mkdtempSync } from 'node:fs';

import {
  createDeliverable,
  getPublicationProjection,
  runDeliverableRoute,
} from '../packages/redcube-gateway/src/index.js';
import { withMockHermesUpstream } from './helpers/mock-codex-cli.js';

async function runRoutes(workspaceRoot, overlay, topicId, deliverableId, routes) {
  for (const route of routes) {
    const result = await runDeliverableRoute({
      workspaceRoot,
      overlay,
      topicId,
      deliverableId,
      route,
    });
    assert.equal(result.ok, true, `${overlay}:${route}`);
  }
}

test('topic publication projection converges direct-delivery and human-publication families through hydrated delivery contracts', async () => {
  await withMockHermesUpstream(async () => {
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-publication-projection-'));

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
      'render_html',
      'visual_director_review',
      'screenshot_review',
      'export_pptx',
    ]);

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

    const projection = await getPublicationProjection({ workspaceRoot, topicId: 'topic-a' });
    assert.equal(projection.ok, true);
    assert.equal(projection.canonical_source.kind, 'review_state.delivery_projection');
    assert.equal(projection.publication.schema_version, 2);
    assert.equal(projection.publication.projection_kind, 'topic_delivery_projection');
    assert.equal(projection.publication.current, 'approval_pending');

    const deckEntry = projection.publication.deliverables['deck-a'];
    assert.equal(deckEntry.required_export_route, 'export_pptx');
    assert.equal(deckEntry.required_export_bundle_id, 'lecture_student_bundle');
    assert.equal(deckEntry.approval_required, false);
    assert.equal(deckEntry.current, 'output_ready');
    assert.equal(deckEntry.delivery_state.current, 'output_ready');
    assert.equal(deckEntry.lifecycle_stage_summary.stage_model, 'direct_delivery_human_workline');
    assert.equal(deckEntry.lifecycle_stage_summary.route_to_human_stage.detailed_outline, 'plan');
    assert.equal(deckEntry.lifecycle_stage_summary.route_to_human_stage.export_pptx, 'delivery');

    const noteEntry = projection.publication.deliverables['note-a'];
    assert.equal(noteEntry.required_export_route, 'export_bundle');
    assert.equal(noteEntry.required_export_bundle_id, 'xiaohongshu_standard_bundle');
    assert.equal(noteEntry.approval_required, true);
    assert.equal(noteEntry.current, 'approval_pending');
    assert.equal(noteEntry.delivery_state.current, 'output_ready');
    assert.equal(noteEntry.lifecycle_stage_summary ?? null, null);

    const posterEntry = projection.publication.deliverables['poster-a'];
    assert.equal(posterEntry.required_export_route, 'export_bundle');
    assert.equal(posterEntry.required_export_bundle_id, 'poster_onepager_bundle');
    assert.equal(posterEntry.approval_required, false);
    assert.equal(posterEntry.current, 'output_ready');
    assert.equal(posterEntry.delivery_state.current, 'output_ready');
    assert.equal(posterEntry.lifecycle_stage_summary.stage_model, 'direct_delivery_human_workline');
    assert.equal(posterEntry.lifecycle_stage_summary.route_to_human_stage.poster_blueprint, 'plan');
    assert.equal(posterEntry.lifecycle_stage_summary.route_to_human_stage.export_bundle, 'delivery');
  });
});
