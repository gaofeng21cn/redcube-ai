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
    'visual_director_review',
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

test('createDeliverable supports poster_onepager on the shared runtime mainline', async () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-runtime-'));

  const created = await createDeliverable({
    workspaceRoot,
    overlay: 'poster_onepager',
    profileId: 'knowledge_poster',
    topicId: 'topic-a',
    deliverableId: 'poster-a',
    title: '甲状腺门诊知识海报',
    goal: '为门诊患者生成单页知识海报',
  });

  assert.equal(created.ok, true);
  assert.equal(created.surface_kind, 'deliverable_create');
  assert.equal(created.recommended_action, 'run_deliverable_route');
  assert.equal(created.deliverable.overlay, 'poster_onepager');
  assert.equal(created.deliverable.kind, 'poster_onepager');
  assert.equal(created.deliverable.profile_id, 'knowledge_poster');
  assert.deepEqual(created.deliverable.routes, [
    'storyline',
    'poster_blueprint',
    'visual_direction',
    'render_html',
    'visual_director_review',
    'screenshot_review',
    'export_bundle',
  ]);
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
  assert.equal(result.run.executor.primary, true);
  assert.equal(result.run.executor.execution_surface, 'codex_native_host_agent');
  assert.equal(result.run.executor.creative_execution, 'agent_first_director_first');
  assert.equal(result.run.executor.external_llm_role, 'optional_compatibility_adapter');
  assert.equal(result.run.executor.execution_model.mainline_adapter, 'host_agent');
  assert.equal(result.run.executor.execution_model.primary_surface, 'codex_native_host_agent');
  assert.equal(result.run.executor.execution_model.agent_first_requires_external_llm, false);
  assert.equal(result.run.executor.execution_model.freeze_origin_milestone, 'P19.A');
  assert.equal(result.run.status, 'completed');
  assert.equal(result.events.length >= 2, true);

  const stored = await getRun({ workspaceRoot, runId: result.run.run_id });
  assert.equal(stored.surface_kind, 'run_record');
  assert.equal(stored.recommended_action, 'review_runtime_state');
  assert.equal(stored.summary.run_id, result.run.run_id);
  assert.equal(stored.run.executor.adapter, 'host_agent');
  assert.equal(stored.run.executor.execution_surface, 'codex_native_host_agent');
  assert.equal(stored.run.executor.execution_model.mainline_adapter, 'host_agent');
  assert.equal(stored.run.executor.execution_model.freeze_origin_milestone, 'P19.A');
  assert.equal(stored.run_telemetry.run_id, result.run.run_id);
  assert.equal(stored.run_telemetry.route, 'storyline');
  assert.equal(stored.run_telemetry.executor_kind, 'host_agent');
  assert.equal(stored.error_taxonomy.error_kind, null);
  assert.equal(stored.rerun_analytics.rerun_count, 0);
  assert.equal(stored.cost_summary.executor_identity, 'codex_native_host_agent');
  assert.equal(stored.quality_drift_summary.relative_quality_verdict, null);
  assert.equal(stored.approval_throughput_summary.pending_review_count, 0);
  const artifact = JSON.parse(readFileSync(result.artifactFile, 'utf-8'));
  assert.equal(artifact.route, 'storyline');
  assert.equal(artifact.contract.profile_id, 'lecture_student');
  assert.equal(artifact.contract.goal, '为本科生讲授甲状腺基础知识');
  assert.equal(artifact.stage_contract.stage_id, 'storyline');
  assert.equal(artifact.execution_model.mainline_adapter, 'host_agent');
  assert.equal(artifact.execution_model.primary_surface, 'codex_native_host_agent');
  assert.equal(artifact.execution_model.external_llm_role, 'optional_compatibility_adapter');
  assert.equal(artifact.execution_model.freeze_origin_milestone, 'P19.A');
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
  assert.equal(result.run.executor.execution_model.mainline_adapter, 'host_agent');
  assert.equal(result.run.current_stage, 'detailed_outline');
  const artifact = JSON.parse(readFileSync(result.artifactFile, 'utf-8'));
  assert.equal(artifact.stage_contract.stage_id, 'detailed_outline');
  assert.equal(artifact.contract.profile_id, 'lecture_peer');
  assert.equal(artifact.execution_model.mainline_adapter, 'host_agent');
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
  assert.equal(result.surface_kind, 'route_run');
  assert.equal(result.error_kind, 'route_failure');
  assert.equal(result.recommended_action, 'inspect_run_failure');
  assert.equal(result.run.status, 'failed');
  assert.equal(result.run.executor.adapter, 'external_llm');
  assert.equal(result.run.executor.primary, false);
  assert.equal(result.run.executor.execution_surface, 'external_llm_adapter');
  assert.equal(result.run.executor.compatibility_role, 'optional_compatibility_adapter');
  assert.equal(result.run.executor.execution_model.freeze_origin_milestone, 'P19.A');
  assert.equal(
    result.run.error.message,
    'Unsupported route for adapter external_llm: detailed_outline',
  );

  const stored = await getRun({ workspaceRoot, runId: result.run.run_id });
  assert.equal(stored.run.status, 'failed');
  assert.equal(stored.run.executor.execution_surface, 'external_llm_adapter');
  assert.equal(stored.run.executor.execution_model.freeze_origin_milestone, 'P19.A');
  assert.equal(stored.run_telemetry.executor_kind, 'external_llm');
  assert.equal(stored.error_taxonomy.error_kind, 'execution_error');
  assert.equal(stored.approval_throughput_summary.blocked, true);
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

test('runDeliverableRoute supports poster_onepager routes on shared runtime', async () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-runtime-'));

  await createDeliverable({
    workspaceRoot,
    overlay: 'poster_onepager',
    profileId: 'knowledge_poster',
    topicId: 'topic-a',
    deliverableId: 'poster-a',
    title: '甲状腺门诊知识海报',
    goal: '为门诊患者生成单页知识海报',
  });

  const result = await runDeliverableRoute({
    workspaceRoot,
    overlay: 'poster_onepager',
    topicId: 'topic-a',
    deliverableId: 'poster-a',
    route: 'storyline',
  });

  assert.equal(result.ok, true);
  const artifact = JSON.parse(readFileSync(result.artifactFile, 'utf-8'));
  assert.equal(artifact.overlay, 'poster_onepager');
  assert.equal(artifact.route, 'storyline');
  assert.equal(typeof artifact.storyline.headline, 'string');
});

test('poster_onepager mainline runs through review and export on shared runtime', async () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-runtime-'));

  await createDeliverable({
    workspaceRoot,
    overlay: 'poster_onepager',
    profileId: 'knowledge_poster',
    topicId: 'topic-a',
    deliverableId: 'poster-a',
    title: '甲状腺门诊知识海报',
    goal: '为门诊患者生成单页知识海报',
  });

  for (const route of [
    'storyline',
    'poster_blueprint',
    'visual_direction',
    'render_html',
    'visual_director_review',
    'screenshot_review',
    'export_bundle',
  ]) {
    const result = await runDeliverableRoute({
      workspaceRoot,
      overlay: 'poster_onepager',
      topicId: 'topic-a',
      deliverableId: 'poster-a',
      route,
    });
    assert.equal(result.ok, true);
  }

  const screenshotArtifact = JSON.parse(readFileSync(path.join(
    workspaceRoot,
    'topics/topic-a/deliverables/poster-a/artifacts/quality_gate.json',
  ), 'utf-8'));
  const exportArtifact = JSON.parse(readFileSync(path.join(
    workspaceRoot,
    'topics/topic-a/deliverables/poster-a/artifacts/publish_bundle.json',
  ), 'utf-8'));

  assert.equal(screenshotArtifact.status, 'pass');
  assert.equal(screenshotArtifact.review_state_patch.rerun_from_stage, null);
  assert.equal(exportArtifact.status, 'completed');
  assert.equal(exportArtifact.export_bundle.png_files.length, 1);
  assert.equal(typeof exportArtifact.export_bundle.source_html, 'string');
});
