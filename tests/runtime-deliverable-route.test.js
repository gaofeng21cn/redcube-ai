import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { mkdtempSync, readFileSync } from 'node:fs';

import {
  createDeliverable,
  getDeliverable,
  getRun,
  runDeliverableRoute,
} from '../packages/redcube-gateway/src/index.js';
import { appendEvent } from '@redcube/runtime';

test('createDeliverable writes canonical deliverable metadata', async () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-runtime-'));

  const created = await createDeliverable({
    workspaceRoot,
    overlay: 'ppt_deck',
    profileId: 'lecture_student',
    topicId: 'topic-a',
    deliverableId: 'deck-a',
    title: '甲状腺门诊科普 deck',
    goal: '为本科生讲授甲状腺基础知识',
  });

  assert.equal(created.ok, true);
  assert.equal(created.surface_kind, 'deliverable_create');
  assert.equal(created.recommended_action, 'run_deliverable_route');
  assert.equal(created.summary.deliverable_id, 'deck-a');
  assert.equal(created.summary.overlay, 'ppt_deck');

  const stored = await getDeliverable({
    workspaceRoot,
    topicId: 'topic-a',
    deliverableId: 'deck-a',
  });

  assert.equal(stored.ok, true);
  assert.equal(stored.surface_kind, 'deliverable_record');
  assert.equal(stored.recommended_action, 'run_deliverable_route');
  assert.equal(stored.summary.deliverable_id, 'deck-a');
  assert.equal(stored.deliverable.overlay, 'ppt_deck');
  assert.equal(stored.deliverable.kind, 'ppt_deck');
  assert.equal(stored.deliverable.profile_id, 'lecture_student');
  assert.equal(stored.deliverable.goal, '为本科生讲授甲状腺基础知识');
  assert.equal(stored.deliverable.hydrated_contract_ref, 'contracts/hydrated-deliverable.json');
  assert.equal(stored.deliverable.slide_ratio, '16:9');
  assert.deepEqual(stored.deliverable.routes, [
    'storyline',
    'detailed_outline',
    'slide_blueprint',
    'visual_direction',
    'render_html',
    'screenshot_review',
    'export_pptx',
  ]);
});

test('createDeliverable supports xiaohongshu on the shared runtime mainline', async () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-runtime-'));

  const created = await createDeliverable({
    workspaceRoot,
    overlay: 'xiaohongshu',
    profileId: 'standard_note',
    topicId: 'topic-a',
    deliverableId: 'note-a',
    title: '甲状腺门诊小红书科普',
    goal: '为门诊患者生成可发布的科普图文',
  });

  assert.equal(created.ok, true);
  assert.equal(created.surface_kind, 'deliverable_create');
  assert.equal(created.recommended_action, 'run_deliverable_route');
  assert.equal(created.deliverable.overlay, 'xiaohongshu');
  assert.equal(created.deliverable.kind, 'xiaohongshu_note');
  assert.equal(created.deliverable.profile_id, 'standard_note');
  assert.deepEqual(created.deliverable.routes, ['research', 'storyline', 'single_note_plan', 'visual_direction', 'render_html', 'visual_director_review', 'screenshot_review', 'publish_copy', 'export_bundle']);
});

test('createDeliverable rejects unknown overlay ids', async () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-runtime-'));

  await assert.rejects(
    () => createDeliverable({
      workspaceRoot,
      overlay: 'poster',
      profileId: 'standard_note',
      topicId: 'topic-a',
      deliverableId: 'poster-a',
      title: '未知交付物',
      goal: '测试未知 overlay',
    }),
    /Unknown overlay: poster/,
  );
});

test('runDeliverableRoute uses host-agent executor by default', async () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-runtime-'));

  await createDeliverable({
    workspaceRoot,
    overlay: 'ppt_deck',
    profileId: 'lecture_student',
    topicId: 'topic-a',
    deliverableId: 'deck-a',
    title: '甲状腺门诊科普 deck',
    goal: '为本科生讲授甲状腺基础知识',
  });

  const result = await runDeliverableRoute({
    workspaceRoot,
    overlay: 'ppt_deck',
    topicId: 'topic-a',
    deliverableId: 'deck-a',
    route: 'storyline',
  });

  assert.equal(result.ok, true);
  assert.equal(result.surface_kind, 'route_run');
  assert.equal(result.recommended_action, 'continue');
  assert.equal(result.summary.route, 'storyline');
  assert.equal(result.run.executor.adapter, 'host_agent');
  assert.equal(result.run.status, 'completed');
  assert.equal(result.events.length >= 2, true);

  const stored = await getRun({ workspaceRoot, runId: result.run.run_id });
  assert.equal(stored.surface_kind, 'run_record');
  assert.equal(stored.recommended_action, 'review_runtime_state');
  assert.equal(stored.summary.run_id, result.run.run_id);
  assert.equal(stored.run.executor.adapter, 'host_agent');
  const artifact = JSON.parse(readFileSync(result.artifactFile, 'utf-8'));
  assert.equal(artifact.route, 'storyline');
  assert.equal(artifact.contract.profile_id, 'lecture_student');
  assert.equal(artifact.contract.goal, '为本科生讲授甲状腺基础知识');
  assert.equal(artifact.stage_contract.stage_id, 'storyline');
});

test('runDeliverableRoute executes other declared stages through host-agent executor', async () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-runtime-'));

  await createDeliverable({
    workspaceRoot,
    overlay: 'ppt_deck',
    profileId: 'lecture_peer',
    topicId: 'topic-a',
    deliverableId: 'deck-a',
    title: '同行讲解 deck',
    goal: '向小同行解释问题、方法、证据与边界',
  });

  const preflight = await runDeliverableRoute({
    workspaceRoot,
    overlay: 'ppt_deck',
    topicId: 'topic-a',
    deliverableId: 'deck-a',
    route: 'storyline',
  });
  assert.equal(preflight.ok, true);

  const result = await runDeliverableRoute({
    workspaceRoot,
    overlay: 'ppt_deck',
    topicId: 'topic-a',
    deliverableId: 'deck-a',
    route: 'detailed_outline',
  });

  assert.equal(result.ok, true);
  assert.equal(result.run.executor.adapter, 'host_agent');
  assert.equal(result.run.current_stage, 'detailed_outline');
  const artifact = JSON.parse(readFileSync(result.artifactFile, 'utf-8'));
  assert.equal(artifact.stage_contract.stage_id, 'detailed_outline');
  assert.equal(artifact.contract.profile_id, 'lecture_peer');
});

test('getRun rejects unsafe run identifiers', async () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-runtime-'));

  await assert.rejects(
    () => getRun({ workspaceRoot, runId: '../run-a' }),
    /runId 不能包含路径分隔符/,
  );
});

test('appendEvent rejects unsafe run identifiers', () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-runtime-'));

  assert.throws(
    () => appendEvent(workspaceRoot, '../run-a', { type: 'test' }),
    /runId 不能包含路径分隔符/,
  );
});

test('runDeliverableRoute rejects unsafe route segments', async () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-runtime-'));

  await createDeliverable({
    workspaceRoot,
    overlay: 'ppt_deck',
    profileId: 'lecture_student',
    topicId: 'topic-a',
    deliverableId: 'deck-a',
    title: '甲状腺门诊科普 deck',
    goal: '为本科生讲授甲状腺基础知识',
  });

  await assert.rejects(
    () => runDeliverableRoute({
      workspaceRoot,
      overlay: 'ppt_deck',
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      route: '../storyline',
    }),
    /route 不能包含路径分隔符/,
  );
});

test('runDeliverableRoute rejects overlay mismatch against stored deliverable', async () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-runtime-'));

  await createDeliverable({
    workspaceRoot,
    overlay: 'ppt_deck',
    profileId: 'lecture_student',
    topicId: 'topic-a',
    deliverableId: 'deck-a',
    title: '甲状腺门诊科普 deck',
    goal: '为本科生讲授甲状腺基础知识',
  });

  await assert.rejects(
    () => runDeliverableRoute({
      workspaceRoot,
      overlay: 'xiaohongshu',
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      route: 'storyline',
    }),
    /overlay mismatch: expected ppt_deck, got xiaohongshu/,
  );
});

test('runDeliverableRoute records failed run when secondary adapter cannot run declared route', async () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-runtime-'));

  await createDeliverable({
    workspaceRoot,
    overlay: 'ppt_deck',
    profileId: 'lecture_student',
    topicId: 'topic-a',
    deliverableId: 'deck-a',
    title: '甲状腺门诊科普 deck',
    goal: '为本科生讲授甲状腺基础知识',
  });

  const result = await runDeliverableRoute({
    workspaceRoot,
    overlay: 'ppt_deck',
    topicId: 'topic-a',
    deliverableId: 'deck-a',
    route: 'detailed_outline',
    adapter: 'external_llm',
  });

  assert.equal(result.ok, false);
  assert.equal(result.run.status, 'failed');
  assert.equal(
    result.run.error.message,
    'Unsupported route for adapter external_llm: detailed_outline',
  );

  const stored = await getRun({ workspaceRoot, runId: result.run.run_id });
  assert.equal(stored.run.status, 'failed');
});

test('runDeliverableRoute rejects route not declared by hydrated deliverable contract', async () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-runtime-'));

  await createDeliverable({
    workspaceRoot,
    overlay: 'ppt_deck',
    profileId: 'lecture_student',
    topicId: 'topic-a',
    deliverableId: 'deck-a',
    title: '甲状腺门诊科普 deck',
    goal: '为本科生讲授甲状腺基础知识',
  });

  await assert.rejects(
    () => runDeliverableRoute({
      workspaceRoot,
      overlay: 'ppt_deck',
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      route: 'publish_live',
    }),
    /Route publish_live is not declared by hydrated deliverable contract/,
  );
});

test('runDeliverableRoute supports xiaohongshu routes on shared runtime', async () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-runtime-'));

  await createDeliverable({
    workspaceRoot,
    overlay: 'xiaohongshu',
    profileId: 'standard_note',
    topicId: 'topic-a',
    deliverableId: 'note-a',
    title: '甲状腺门诊小红书科普',
    goal: '为门诊患者生成可发布的科普图文',
  });

  const result = await runDeliverableRoute({
    workspaceRoot,
    overlay: 'xiaohongshu',
    topicId: 'topic-a',
    deliverableId: 'note-a',
    route: 'research',
  });

  assert.equal(result.ok, true);
  const artifact = JSON.parse(readFileSync(result.artifactFile, 'utf-8'));
  assert.equal(artifact.overlay, 'xiaohongshu');
  assert.equal(artifact.route, 'research');
  assert.equal(typeof artifact.research.topic_summary, 'string');
});
