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
  intakeSource,
} from './product-domain-action-test-api.js';
import { completeSourceReadiness } from './helpers/complete-source-readiness.js';

test('auditDeliverable blocks when source_audit passes but planning_ready is still false', async () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-source-gate-'));

  await intakeSource({
    workspaceRoot,
    topicId: 'topic-a',
    title: '甲状腺门诊沟通',
    brief: '只有主题和关键词，需要先补齐公开事实材料。',
    keywords: ['甲状腺', '门诊', '患者沟通'],
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

  const report = await auditDeliverable({
    workspaceRoot,
    overlay: 'ppt_deck',
    topicId: 'topic-a',
    deliverableId: 'deck-a',
    mode: 'draft_new',
  });

  assert.equal(report.status, 'block');
  assert.equal(report.issues.includes('source_readiness_not_planning_ready'), true);
  assert.equal(report.recommended_action, 'run_source_research');
  assert.equal(report.source_readiness_summary?.canonical_source?.kind, 'shared_source_truth.source_readiness_gate');
  assert.equal(report.source_readiness_summary?.planning_ready, false);
  assert.equal(report.source_readiness_summary?.sufficiency_status, 'augmentation_required');
  assert.equal(report.source_readiness_summary?.deep_research_state, 'required');
  assert.equal(report.source_readiness_summary?.blocking_evidence_gaps.includes('public_evidence_missing'), true);
  assert.equal(report.gate_summary?.source_planning_ready, false);
  assert.equal(report.gate_summary?.source_next_required_surface, 'source_research');
});

test('planning_ready gate converges across audit/review/projection after source research finishes', async () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-source-gate-ready-'));

  const research = await completeSourceReadiness({
    workspaceRoot,
    topicId: 'topic-a',
    title: '甲状腺门诊沟通',
    brief: '只有主题和关键词，需要先补齐公开事实材料。',
    keywords: ['甲状腺', '门诊', '患者沟通'],
  });
  assert.equal(research.planningReady, true);

  await createDeliverable({
    workspaceRoot,
    overlay: 'xiaohongshu',
    profileId: 'standard_note',
    topicId: 'topic-a',
    deliverableId: 'note-a',
    title: '甲状腺门诊科普图文',
    goal: '为门诊患者生成可发布的科普图文',
  });

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
  assert.equal(audit.status, 'pass');
  assert.equal(audit.source_readiness_summary?.planning_ready, true);
  assert.equal(audit.gate_summary?.source_planning_ready, true);
  assert.equal(review.source_readiness_summary?.planning_ready, true);
  assert.equal(review.gate_summary?.source_planning_ready, true);
  assert.equal(projection.publication.deliverables['note-a'].source_readiness_summary.planning_ready, true);
  assert.equal(projection.publication.deliverables['note-a'].gate_summary.source_planning_ready, true);
});
