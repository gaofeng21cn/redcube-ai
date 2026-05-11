// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';

import {
  auditDeliverable,
  createDeliverable,
  getPublicationProjection,
  getReviewState,
  runDeliverableRoute,
  runtimeWatch,
} from './product-domain-action-test-api.ts';
import { getDeliverablePaths } from './package-surfaces.ts';
import { completeSourceReadiness } from './helpers/complete-source-readiness.ts';
import { withMockCodexRuntime } from './mock-codex-cli.ts';

const SHARED_GOVERNANCE_SURFACES = [
  'deliverable create',
  'deliverable audit',
  'deliverable run',
  'review watch',
  'auditDeliverable',
  'runtimeWatch',
  'getReviewState',
  'getPublicationProjection',
];

const REQUIRED_GOVERNANCE_SUMMARIES = [
  'source_readiness_summary',
  'gate_summary',
  'operator_handoff',
  'lifecycle_stage_summary',
];

function readJson(file) {
  return JSON.parse(readFileSync(file, 'utf-8'));
}

async function buildReviewReadyWorkspace({ workspaceRoot, overlay, profileId, deliverableId, title, goal, routes }) {
  await completeSourceReadiness({
    workspaceRoot,
    topicId: 'topic-a',
    title,
    brief: `${title} 的共享 source readiness`,
    keywords: ['甲状腺', '科普', 'mainline'],
  });

  const created = await createDeliverable({
    workspaceRoot,
    overlay,
    profileId,
    topicId: 'topic-a',
    deliverableId,
    title,
    goal,
  });

  for (const route of routes) {
    const result = await runDeliverableRoute({
      workspaceRoot,
      overlay,
      topicId: 'topic-a',
      deliverableId,
      route,
    });
    assert.equal(result.ok, true, route);
  }

  return created;
}

test('stable families expose one explicit governance_surface contract on create and canonical review surfaces', async () => {
  await withMockCodexRuntime(async () => {
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-governance-parity-'));

    const deck = await buildReviewReadyWorkspace({
      workspaceRoot,
      overlay: 'ppt_deck',
      profileId: 'lecture_student',
      deliverableId: 'deck-a',
      title: '甲状腺门诊教学 deck',
      goal: '给本科生讲授甲状腺基础知识',
      routes: ['storyline', 'detailed_outline', 'slide_blueprint', 'visual_direction', 'author_image_pages', 'visual_director_review', 'screenshot_review'],
    });
    const note = await buildReviewReadyWorkspace({
      workspaceRoot,
      overlay: 'xiaohongshu',
      profileId: 'standard_note',
      deliverableId: 'note-a',
      title: '甲状腺门诊小红书科普',
      goal: '为门诊患者生成可发布的科普图文',
      routes: ['research', 'storyline', 'single_note_plan', 'visual_direction', 'author_image_pages', 'visual_director_review', 'screenshot_review', 'publish_copy'],
    });
    const poster = await buildReviewReadyWorkspace({
      workspaceRoot,
      overlay: 'poster_onepager',
      profileId: 'knowledge_poster',
      deliverableId: 'poster-a',
      title: '甲状腺门诊知识海报',
      goal: '为门诊患者生成单页知识海报',
      routes: ['storyline', 'poster_blueprint', 'visual_direction', 'render_html', 'visual_director_review', 'screenshot_review', 'export_bundle'],
    });

    for (const created of [deck, note, poster]) {
      assert.deepEqual(created.governance_surface.shared_governance_surfaces, SHARED_GOVERNANCE_SURFACES);
      assert.deepEqual(created.governance_surface.required_summaries, REQUIRED_GOVERNANCE_SUMMARIES);
      assert.equal(typeof created.governance_surface.family_boundary.family_kind, 'string');
      assert.equal(created.governance_surface.runtime_topology.runtime_substrate_owner, 'Codex CLI');
      assert.equal(created.governance_surface.runtime_topology.runtime_substrate_surface, 'codex_cli_runtime');
      assert.equal(created.governance_surface.runtime_topology.deployment_host, 'codex_local_operator_host');
    }
    const posterPaths = getDeliverablePaths(workspaceRoot, 'topic-a', 'poster-a');
    const posterDirectorReviewMarkdown = readFileSync(
      path.join(posterPaths.reportsDir, 'poster-a_视觉总监复盘.md'),
      'utf-8',
    );
    assert.match(posterDirectorReviewMarkdown, /- review_owner: codex_cli_runtime/);
    assert.equal((posterDirectorReviewMarkdown.match(/codex_cli_runtime/g) || []).length, 1);

    const review = await getReviewState({ workspaceRoot, topicId: 'topic-a', deliverableId: 'deck-a' });
    const projection = await getPublicationProjection({ workspaceRoot, topicId: 'topic-a' });
    const audit = await auditDeliverable({
      workspaceRoot,
      overlay: 'ppt_deck',
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      mode: 'draft_new',
    });
    const watch = await runtimeWatch({
      workspaceRoot,
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      run: {
        run_id: 'run-deck-a-001',
        topic_id: 'topic-a',
        deliverable_id: 'deck-a',
        overlay: 'ppt_deck',
        current_stage: 'screenshot_review',
        status: 'completed',
      },
    });

    assert.deepEqual(review.governance_surface.shared_governance_surfaces, SHARED_GOVERNANCE_SURFACES);
    assert.deepEqual(audit.governance_surface, review.governance_surface);
    assert.deepEqual(watch.governance_surface, review.governance_surface);
    assert.deepEqual(
      projection.publication.deliverables['deck-a'].governance_surface,
      review.governance_surface,
    );
    assert.equal(review.governance_surface.runtime_topology.runtime_substrate_owner, 'Codex CLI');
    assert.equal(review.governance_surface.runtime_topology.product_mode, 'auto_only');
  });
});

test('canonical publication projection, audit, and watch rebuild governance summaries after stored drift is detected', async () => {
  await withMockCodexRuntime(async () => {
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-governance-parity-'));
    await buildReviewReadyWorkspace({
      workspaceRoot,
      overlay: 'xiaohongshu',
      profileId: 'standard_note',
      deliverableId: 'note-a',
      title: '甲状腺门诊小红书科普',
      goal: '为门诊患者生成可发布的科普图文',
      routes: ['research', 'storyline', 'single_note_plan', 'visual_direction', 'author_image_pages', 'visual_director_review', 'screenshot_review', 'publish_copy'],
    });
    await buildReviewReadyWorkspace({
      workspaceRoot,
      overlay: 'poster_onepager',
      profileId: 'knowledge_poster',
      deliverableId: 'poster-a',
      title: '甲状腺门诊知识海报',
      goal: '为门诊患者生成单页知识海报',
      routes: ['storyline', 'poster_blueprint', 'visual_direction', 'render_html', 'visual_director_review', 'screenshot_review', 'export_bundle'],
    });

    const projection = await getPublicationProjection({ workspaceRoot, topicId: 'topic-a' });
    const projectionFile = projection.projection_file;
    const corrupted = readJson(projectionFile);
    delete corrupted.deliverables['note-a'].gate_summary;
    delete corrupted.deliverables['note-a'].governance_surface;
    corrupted.deliverables['poster-a'].operator_handoff = null;
    delete corrupted.deliverables['poster-a'].lifecycle_stage_summary;
    writeFileSync(projectionFile, JSON.stringify(corrupted, null, 2), 'utf-8');

    const rebuilt = await getPublicationProjection({ workspaceRoot, topicId: 'topic-a' });
    assert.equal(typeof rebuilt.publication.deliverables['note-a'].gate_summary?.source_planning_ready, 'boolean');
    assert.equal(rebuilt.publication.deliverables['note-a'].governance_surface?.runtime_topology?.runtime_substrate_owner, 'Codex CLI');
    const audit = await auditDeliverable({
      workspaceRoot,
      overlay: 'poster_onepager',
      topicId: 'topic-a',
      deliverableId: 'poster-a',
      mode: 'draft_new',
    });
    const watch = await runtimeWatch({
      workspaceRoot,
      topicId: 'topic-a',
      deliverableId: 'poster-a',
      run: {
        run_id: 'run-poster-a-001',
        topic_id: 'topic-a',
        deliverable_id: 'poster-a',
        overlay: 'poster_onepager',
        current_stage: 'export_bundle',
        status: 'completed',
      },
    });
    assert.equal(rebuilt.publication.deliverables['poster-a'].operator_handoff?.gate_status, 'ready');
    assert.equal(audit.operator_handoff?.gate_status, 'ready');
    assert.equal(watch.operator_handoff?.gate_status, 'ready');
    assert.equal(rebuilt.publication.deliverables['poster-a'].lifecycle_stage_summary?.stage_model, 'direct_delivery_human_workline');
    assert.equal(audit.lifecycle_stage_summary?.stage_model, 'direct_delivery_human_workline');
    assert.equal(watch.lifecycle_stage_summary?.stage_model, 'direct_delivery_human_workline');
  });
});
