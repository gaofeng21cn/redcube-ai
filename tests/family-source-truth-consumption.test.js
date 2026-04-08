import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { mkdtempSync, readFileSync } from 'node:fs';

import {
  createDeliverable,
  intakeSource,
  runDeliverableRoute,
} from '../packages/redcube-gateway/src/index.js';

function readJson(file) {
  return JSON.parse(readFileSync(file, 'utf-8'));
}

function expectSharedSummary(summary, role) {
  assert.equal(summary.authoritative_source_kind, 'shared_source_truth');
  assert.equal(summary.consumption_role, role);
  assert.equal(typeof summary.input_mode, 'string');
  assert.equal(typeof summary.confidence, 'string');
  assert.equal(typeof summary.material_count, 'number');
  assert.equal(Array.isArray(summary.material_ids), true);
  assert.equal(Array.isArray(summary.source_labels), true);
  assert.equal(summary.source_audit_status, 'pass');
  assert.equal(Array.isArray(summary.source_audit_blocking_reasons), true);
}

test('ppt_deck emits shared source_truth_consumption across story and visual routes', async () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-family-source-truth-'));
  await intakeSource({
    workspaceRoot,
    topicId: 'topic-a',
    title: '甲状腺门诊科普',
    brief: '为本科生讲授甲状腺基础知识，需要围绕定义、检查、误区与判断顺序组织正式课件。',
    keywords: ['甲状腺', '教学', '门诊科普'],
  });
  const created = await createDeliverable({
    workspaceRoot,
    overlay: 'ppt_deck',
    profileId: 'lecture_student',
    topicId: 'topic-a',
    deliverableId: 'deck-a',
    title: '甲状腺门诊科普 deck',
    goal: '为本科生讲授甲状腺基础知识',
  });
  const hydratedContract = readJson(path.join(path.dirname(created.deliverableFile), 'contracts', 'hydrated-deliverable.json'));
  assert.equal(hydratedContract.source_truth_contract.authoritative_surface, 'shared_source_truth');

  for (const [route, role] of [
    ['storyline', 'story_architecture'],
    ['detailed_outline', 'story_architecture'],
    ['slide_blueprint', 'story_architecture'],
    ['visual_direction', 'visual_authorship'],
  ]) {
    const result = await runDeliverableRoute({
      workspaceRoot,
      overlay: 'ppt_deck',
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      route,
    });
    assert.equal(result.ok, true, route);
    const artifact = readJson(result.artifactFile);
    expectSharedSummary(artifact.source_truth_consumption, role);
  }
});

test('xiaohongshu emits shared source_truth_consumption across source/story/visual routes', async () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-family-source-truth-'));
  await intakeSource({
    workspaceRoot,
    topicId: 'topic-a',
    title: '甲状腺门诊科普图文',
    brief: '为门诊患者生成可发布的小红书科普图文，需要强调检查、误区与行动建议。',
    keywords: ['甲状腺', '门诊', '小红书'],
  });
  const created = await createDeliverable({
    workspaceRoot,
    overlay: 'xiaohongshu',
    profileId: 'standard_note',
    topicId: 'topic-a',
    deliverableId: 'note-a',
    title: '甲状腺门诊小红书科普',
    goal: '为门诊患者生成可发布的科普图文',
  });
  const hydratedContract = readJson(path.join(path.dirname(created.deliverableFile), 'contracts', 'hydrated-deliverable.json'));
  assert.equal(hydratedContract.source_truth_contract.authoritative_surface, 'shared_source_truth');

  for (const [route, role] of [
    ['research', 'source_readiness'],
    ['storyline', 'story_architecture'],
    ['single_note_plan', 'story_architecture'],
    ['visual_direction', 'visual_authorship'],
  ]) {
    const result = await runDeliverableRoute({
      workspaceRoot,
      overlay: 'xiaohongshu',
      topicId: 'topic-a',
      deliverableId: 'note-a',
      route,
    });
    assert.equal(result.ok, true, route);
    const artifact = readJson(result.artifactFile);
    expectSharedSummary(artifact.source_truth_consumption, role);
  }
});

test('poster_onepager keeps guarded knowledge-poster boundary while emitting shared source_truth_consumption', async () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-family-source-truth-'));
  await intakeSource({
    workspaceRoot,
    topicId: 'topic-a',
    title: '甲状腺门诊知识海报',
    brief: '为门诊患者生成单页知识海报，需要强调判断顺序、证据要点和行动建议。',
    keywords: ['甲状腺', '海报', '门诊知识'],
  });
  const created = await createDeliverable({
    workspaceRoot,
    overlay: 'poster_onepager',
    profileId: 'knowledge_poster',
    topicId: 'topic-a',
    deliverableId: 'poster-a',
    title: '甲状腺门诊知识海报',
    goal: '为门诊患者生成单页知识海报',
  });
  const hydratedContract = readJson(path.join(path.dirname(created.deliverableFile), 'contracts', 'hydrated-deliverable.json'));
  assert.equal(hydratedContract.profile_id, 'knowledge_poster');
  assert.equal(hydratedContract.source_truth_contract.poster_guarded_boundary.academic_contract_active, false);

  for (const [route, role] of [
    ['storyline', 'story_architecture'],
    ['poster_blueprint', 'story_architecture'],
    ['visual_direction', 'visual_authorship'],
  ]) {
    const result = await runDeliverableRoute({
      workspaceRoot,
      overlay: 'poster_onepager',
      topicId: 'topic-a',
      deliverableId: 'poster-a',
      route,
    });
    assert.equal(result.ok, true, route);
    const artifact = readJson(result.artifactFile);
    expectSharedSummary(artifact.source_truth_consumption, role);
  }
});
