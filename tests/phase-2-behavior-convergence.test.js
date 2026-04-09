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
} from '../packages/redcube-gateway/src/index.js';
import { completeSourceReadiness } from './helpers/complete-source-readiness.js';

async function buildReviewReadyXiaohongshuWorkspace(workspaceRoot) {
  await completeSourceReadiness({
    workspaceRoot,
    topicId: 'topic-a',
    title: '甲状腺门诊小红书素材',
    brief: '为门诊患者准备甲状腺科普图文，需要覆盖检查、误区与就诊建议。',
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
}

test('audit, watch, review, and projection surfaces stay behavior-aligned on the same deliverable', async () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-phase2-behavior-'));
  await buildReviewReadyXiaohongshuWorkspace(workspaceRoot);

  const audit = await auditDeliverable({
    workspaceRoot,
    overlay: 'xiaohongshu',
    topicId: 'topic-a',
    deliverableId: 'note-a',
    mode: 'draft_new',
  });
  const review = await getReviewState({
    workspaceRoot,
    topicId: 'topic-a',
    deliverableId: 'note-a',
  });
  const projection = await getPublicationProjection({
    workspaceRoot,
    topicId: 'topic-a',
  });
  const watch = await runtimeWatch({
    workspaceRoot,
    topicId: 'topic-a',
    deliverableId: 'note-a',
    run: {
      run_id: 'run-note-a-001',
      overlay: 'xiaohongshu',
      current_stage: 'publish_copy',
      status: 'publish_ready',
    },
  });

  assert.equal(audit.status, 'pass');
  assert.deepEqual(audit.review_state, review.state);
  assert.deepEqual(audit.publication_projection, projection.publication);
  assert.deepEqual(audit.delivery_contract, watch.delivery_contract);
  assert.equal(audit.gate_summary?.delivery_projection_current, 'approval_pending');
  assert.equal(watch.gate_summary?.delivery_projection_current, 'approval_pending');
  assert.equal(audit.gate_summary?.delivery_projection_current, projection.publication.deliverables['note-a'].current);
  assert.equal(watch.review_state?.current_status, review.state.current_status);
  assert.equal(watch.publication_projection?.deliverables?.['note-a']?.current, projection.publication.deliverables['note-a'].current);
  assert.equal(watch.run_id, 'run-note-a-001');
});
