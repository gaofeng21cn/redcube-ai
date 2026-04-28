// @ts-nocheck
import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { mkdtempSync } from 'node:fs';

import {
  applyReviewMutation,
  createDeliverable,
  intakeSource,
  runDeliverableRoute,
} from './gateway-test-api.ts';
import {
  buildReferencePromotionReport,
  buildReferenceReplacementReport,
} from '@redcube/runtime';
import {
  startMockCodexCli,
  withEnv,
} from './helpers/mock-codex-cli.ts';

let promotedCatalogWorkspaceRoot = '';
let restoreEnv = () => {};
let upstream = null;

async function promoteReference({ workspaceRoot, deliverableId, promotedReferenceId, baselineDeliverableId = '' }) {
  await createDeliverable({
    workspaceRoot,
    overlay: 'xiaohongshu',
    profileId: 'standard_note',
    topicId: 'topic-a',
    deliverableId,
    title: '甲状腺门诊小红书科普',
    goal: '为门诊患者生成可发布的科普图文',
  });

  for (const route of ['research', 'storyline', 'single_note_plan', 'visual_direction', 'render_html', 'visual_director_review', 'screenshot_review', 'publish_copy']) {
    const result = await runDeliverableRoute({
      workspaceRoot,
      overlay: 'xiaohongshu',
      topicId: 'topic-a',
      deliverableId,
      route,
      mode: baselineDeliverableId ? 'optimize_existing' : 'draft_new',
      baselineDeliverableId,
    });
    assert.equal(result.ok, true, route);
  }

  await applyReviewMutation({
    workspaceRoot,
    topicId: 'topic-a',
    deliverableId,
    mutation: {
      type: 'approve_publish',
      actor: 'human',
      notes: `approve ${deliverableId}`,
    },
  });

  await applyReviewMutation({
    workspaceRoot,
    topicId: 'topic-a',
    deliverableId,
    mutation: {
      type: 'promote_baseline',
      actor: 'human',
      promoted_reference_id: promotedReferenceId,
      notes: `promote ${deliverableId}`,
    },
  });
}

async function createBaselineDeliverable({ workspaceRoot, deliverableId }) {
  await createDeliverable({
    workspaceRoot,
    overlay: 'xiaohongshu',
    profileId: 'standard_note',
    topicId: 'topic-a',
    deliverableId,
    title: '甲状腺门诊小红书科普',
    goal: '为门诊患者生成可发布的科普图文',
  });
  for (const route of ['research', 'storyline', 'single_note_plan', 'visual_direction', 'render_html', 'visual_director_review', 'screenshot_review', 'publish_copy']) {
    const result = await runDeliverableRoute({
      workspaceRoot,
      overlay: 'xiaohongshu',
      topicId: 'topic-a',
      deliverableId,
      route,
    });
    assert.equal(result.ok, true, route);
  }
  await applyReviewMutation({
    workspaceRoot,
    topicId: 'topic-a',
    deliverableId,
    mutation: {
      type: 'approve_publish',
      actor: 'human',
      notes: `approve ${deliverableId}`,
    },
  });
}

before(async () => {
  upstream = await startMockCodexCli();
  restoreEnv = withEnv({
    REDCUBE_CODEX_COMMAND: upstream.command,
  });

  promotedCatalogWorkspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-reference-replacement-'));
  await intakeSource({
    workspaceRoot: promotedCatalogWorkspaceRoot,
    topicId: 'topic-a',
    title: '甲状腺门诊小红书科普',
    brief: '用于 reference promotion/replacement report 的样本',
    keywords: ['甲状腺', '门诊'],
  });

  await createBaselineDeliverable({
    workspaceRoot: promotedCatalogWorkspaceRoot,
    deliverableId: 'baseline-a',
  });
  await promoteReference({
    workspaceRoot: promotedCatalogWorkspaceRoot,
    deliverableId: 'candidate-b',
    promotedReferenceId: 'xhs-standard-note-v2',
    baselineDeliverableId: 'baseline-a',
  });
  await promoteReference({
    workspaceRoot: promotedCatalogWorkspaceRoot,
    deliverableId: 'candidate-c',
    promotedReferenceId: 'xhs-standard-note-v3',
    baselineDeliverableId: 'candidate-b',
  });
});

after(async () => {
  restoreEnv();
  if (upstream) {
    await upstream.close();
  }
});

test('reference-os exposes promoted reference reporting surface for the current catalog', () => {
  const report = buildReferencePromotionReport({ workspaceRoot: promotedCatalogWorkspaceRoot });

  assert.equal(report.surface_kind, 'reference_promotion_report');
  assert.equal(Array.isArray(report.promoted_references), true);
  assert.deepEqual(
    report.promoted_references.map((item) => item.promoted_reference_id).sort(),
    ['xhs-standard-note-v2', 'xhs-standard-note-v3'],
  );
  assert.deepEqual(
    report.promoted_references.map((item) => item.deliverable_id).sort(),
    ['candidate-b', 'candidate-c'],
  );
  assert.equal(report.promoted_references.every((item) => item.overlay === 'xiaohongshu'), true);
  assert.equal(report.promoted_references.every((item) => item.profile_id === 'standard_note'), true);
});

test('reference-os exposes machine-readable replacement report for superseded promoted references', () => {
  const report = buildReferenceReplacementReport({ workspaceRoot: promotedCatalogWorkspaceRoot });
  assert.equal(report.surface_kind, 'reference_replacement_report');
  assert.equal(Array.isArray(report.replacements), true);
  assert.equal(report.replacements.length, 1);
  assert.equal(report.replacements[0].superseded_reference_id, 'xhs-standard-note-v2');
  assert.equal(report.replacements[0].replacement_reference_id, 'xhs-standard-note-v3');
  assert.equal(report.replacements[0].overlay, 'xiaohongshu');
  assert.equal(report.replacements[0].profile_id, 'standard_note');
});
