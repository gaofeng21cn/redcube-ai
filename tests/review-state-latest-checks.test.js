import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { mkdtempSync, readFileSync } from 'node:fs';

import {
  createDeliverable,
} from '../packages/redcube-gateway/src/index.js';
import {
  persistReviewStatePatch,
} from '@redcube/governance';

function readJson(file) {
  return JSON.parse(readFileSync(file, 'utf-8'));
}

test('persistReviewStatePatch replaces artifact-authored latest_checks instead of leaking stale failures across newer stages', async () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-review-state-checks-'));
  await createDeliverable({
    workspaceRoot,
    overlay: 'ppt_deck',
    profileId: 'lecture_peer',
    topicId: 'topic-a',
    deliverableId: 'deck-a',
    title: 'Review State Regression Deck',
    goal: '锁定 latest_checks 不能把旧失败项带到新阶段',
  });

  persistReviewStatePatch({
    workspaceRoot,
    topicId: 'topic-a',
    deliverableId: 'deck-a',
    patch: {
      current_status: 'blocked_for_revision',
      ready_for_export: false,
      latest_review_stage: 'screenshot_review',
      latest_checks: {
        goal_driven_layout_ok: false,
        ai_review_passed: false,
      },
      pending_reviews: ['goal_driven_layout_ok', 'ai_review_passed'],
      blocking_reasons: ['goal_driven_layout_ok', 'ai_review_passed'],
      rerun_from_stage: 'fix_html',
      rerun_policy: {
        status: 'rerun_required',
        rerun_from_stage: 'fix_html',
      },
    },
  });

  const refreshed = persistReviewStatePatch({
    workspaceRoot,
    topicId: 'topic-a',
    deliverableId: 'deck-a',
    patch: {
      current_status: 'export_ready',
      ready_for_export: true,
      latest_review_stage: 'screenshot_review',
      latest_checks: {
        ai_review_passed: true,
        edge_clearance_ok: true,
      },
      pending_reviews: [],
      blocking_reasons: [],
      rerun_from_stage: null,
      rerun_policy: {
        status: 'idle',
        rerun_from_stage: null,
      },
    },
  });

  assert.deepEqual(refreshed.state.latest_checks, {
    ai_review_passed: true,
    edge_clearance_ok: true,
  });
  assert.equal(Object.hasOwn(refreshed.state.latest_checks, 'goal_driven_layout_ok'), false);

  const completed = persistReviewStatePatch({
    workspaceRoot,
    topicId: 'topic-a',
    deliverableId: 'deck-a',
    patch: {
      current_status: 'completed',
      ready_for_export: true,
      latest_review_stage: 'export_pptx',
      pending_reviews: [],
      blocking_reasons: [],
      rerun_from_stage: null,
      rerun_policy: {
        status: 'idle',
        rerun_from_stage: null,
      },
    },
  });

  assert.deepEqual(completed.state.latest_checks, {
    ai_review_passed: true,
    edge_clearance_ok: true,
  });

  const stored = readJson(path.join(
    workspaceRoot,
    'topics',
    'topic-a',
    'deliverables',
    'deck-a',
    'reports',
    'review-state.json',
  ));
  assert.deepEqual(stored.latest_checks, {
    ai_review_passed: true,
    edge_clearance_ok: true,
  });
});
