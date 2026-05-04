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
} from './gateway-test-api.ts';
import { completeSourceReadiness } from './helpers/complete-source-readiness.ts';
import {
  startMockCodexCli,
  withEnv,
} from './mock-codex-cli.ts';

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

async function withMockCodexHostAgent(testFn) {
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

test('ppt_deck canonical mainline closes through the current Codex host-agent runtime without drifting durable truth', async () => {
  await withMockCodexHostAgent(async () => {
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-hermes-canonical-'));

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
      assert.equal(result.run.executor.execution_model.mainline_adapter, 'host_agent', route);
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
      runId: lastResult.run.run_id,
    });

    assert.equal(lastResult.run.current_stage, 'export_pptx');
    assert.equal(review.governance_surface.runtime_topology.runtime_substrate_owner, 'Codex CLI');
    assert.equal(review.governance_surface.runtime_topology.deployment_host, 'codex_local_operator_host');
    assert.deepEqual(audit.review_state, review.state);
    assert.deepEqual(withoutUpdatedAt(audit.publication_projection), withoutUpdatedAt(projection.publication));
    assert.equal(audit.governance_surface.runtime_topology.runtime_substrate_surface, 'codex_native_host_agent');
    assert.equal(watch.run_id, lastResult.run.run_id);
    assert.equal(watch.governance_surface.runtime_topology.runtime_substrate_owner, 'Codex CLI');
    assert.equal(watch.review_state.current_status, review.state.current_status);
    assert.equal(
      watch.publication_projection.deliverables['deck-a'].current,
      projection.publication.deliverables['deck-a'].current,
    );
  });
});
