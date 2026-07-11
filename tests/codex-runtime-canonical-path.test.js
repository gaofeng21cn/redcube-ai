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
} from './product-domain-action-test-api.js';
import { completeSourceReadiness } from './helpers/complete-source-readiness.js';
import {
  startMockCodexCli,
  withEnv,
} from './mock-codex-cli.js';

function withoutUpdatedAt(payload) {
  if (!payload || typeof payload !== 'object') {
    return payload;
  }
  const clone = JSON.parse(JSON.stringify(payload));
  if (clone && typeof clone === 'object' && 'updated_at' in clone) {
    delete clone.updated_at;
  }
  return clone;
}

async function withMockCodexRuntime(testFn) {
  const upstream = await startMockCodexCli();
  const restoreEnv = withEnv({
    REDCUBE_CODEX_COMMAND: upstream.command,
  });
  try {
    return await testFn();
  } finally {
    restoreEnv();
    await upstream.close();
  }
}

test('ppt_deck canonical mainline closes through Codex CLI runtime without drifting durable truth', async () => {
  await withMockCodexRuntime(async () => {
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-codex-canonical-'));

    await completeSourceReadiness({
      workspaceRoot,
      topicId: 'topic-a',
      title: '甲状腺门诊教学 deck',
      brief: '围绕甲状腺门诊主题准备一套最终可交付的教学 deck。',
      keywords: ['甲状腺', '教学', 'PPT'],
    });

    await createDeliverable({
      workspaceRoot,
      overlay: 'ppt_deck',
      profileId: 'lecture_student',
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      title: '甲状腺门诊教学 deck',
      goal: '给本科生讲授甲状腺基础知识',
    });

    const routes = [
      'storyline',
      'detailed_outline',
      'slide_blueprint',
      'visual_direction',
      'author_image_pages',
      'visual_director_review',
      'screenshot_review',
      'export_pptx',
    ];

    let lastResult = null;
    for (const route of routes) {
      const result = await runDeliverableRoute({
        workspaceRoot,
        overlay: 'ppt_deck',
        topicId: 'topic-a',
        deliverableId: 'deck-a',
        route,
      });
      assert.equal(result.ok, true, route);
      assert.equal(result.run.executor.execution_model.mainline_adapter, 'codex_cli', route);
      assert.equal(result.run.executor.execution_model.runtime_substrate_owner, 'Codex CLI', route);
      assert.equal(result.run.runtime_topology.runtime_substrate_owner, 'Codex CLI', route);
      lastResult = result;
    }

    const review = await getReviewState({
      workspaceRoot,
      topicId: 'topic-a',
      deliverableId: 'deck-a',
    });
    const projection = await getPublicationProjection({
      workspaceRoot,
      topicId: 'topic-a',
    });
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
    });

    assert.equal(lastResult.run.current_stage, 'export_pptx');
    assert.equal(review.governance_surface.runtime_topology.runtime_substrate_owner, 'Codex CLI');
    assert.equal(review.governance_surface.runtime_topology.deployment_host, 'codex_local_operator_host');
    assert.deepEqual(audit.review_state, review.state);
    assert.deepEqual(withoutUpdatedAt(audit.publication_projection), withoutUpdatedAt(projection.publication));
    assert.equal(audit.governance_surface.runtime_topology.runtime_substrate_surface, 'codex_cli_runtime');
    assert.equal(watch.surface_kind, 'rca_visual_review_refs_projection');
    assert.equal(watch.visual_review_semantics.review_status, review.state.current_status);
    assert.equal(watch.review_state_refs.canonical_review_state_ref, review.state_file);
    assert.equal(watch.review_state_refs.publication_projection_ref, projection.projection_file);
    assert.equal(Object.hasOwn(watch, 'run_id'), false);
    assert.equal(Object.hasOwn(watch, 'governance_surface'), false);
  });
});
