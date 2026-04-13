import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { existsSync, mkdtempSync, readFileSync } from 'node:fs';

import {
  auditDeliverable,
  createDeliverable,
  getPublicationProjection,
  getReviewState,
  runDeliverableRoute,
  runtimeWatch,
} from '../packages/redcube-gateway/src/index.js';
import { runPosterOnepagerRoute } from '../packages/redcube-runtime-family-poster-onepager/src/index.js';
import { runPptDeckRoute } from '../packages/redcube-runtime-family-ppt/src/index.js';
import { runXiaohongshuRoute } from '../packages/redcube-runtime-family-xiaohongshu/src/index.js';
import { completeSourceReadiness } from './helpers/complete-source-readiness.js';

const CURRENT_PROGRAM_CONTRACT = 'contracts/runtime-program/current-program.json';
const TRANCHE_CONTRACT = 'contracts/runtime-program/hermes-stable-family-closure-truth.json';
const PREDECESSOR_CONTRACT = 'contracts/runtime-program/hermes-runtime-substrate-canonical-closure.json';
const TRANCHE_BRIEF = 'docs/program/hermes/hermes_stable_family_closure_truth.md';

function readJson(file) {
  return JSON.parse(readFileSync(file, 'utf-8'));
}

function loadHydratedContract(workspaceRoot, topicId, deliverableId) {
  return readJson(path.join(
    workspaceRoot,
    'topics',
    topicId,
    'deliverables',
    deliverableId,
    'contracts',
    'hydrated-deliverable.json',
  ));
}

test('stable family closure truth remains historical provenance under the repo-verified product-entry mainline', () => {
  const currentProgram = readJson(CURRENT_PROGRAM_CONTRACT);
  const contract = readJson(TRANCHE_CONTRACT);
  const predecessor = readJson(PREDECESSOR_CONTRACT);
  const brief = readFileSync(path.resolve(TRANCHE_BRIEF), 'utf-8');

  assert.equal(existsSync(path.resolve(TRANCHE_CONTRACT)), true);
  assert.equal(existsSync(path.resolve(TRANCHE_BRIEF)), true);
  assert.equal(contract.tranche_id, 'hermes_stable_family_closure_truth');
  assert.equal(contract.status, 'closeout_completed');
  assert.equal(contract.predecessor_tranche, predecessor.tranche_id);
  assert.equal(
    currentProgram.current_state.foundation_milestones.hermes_stable_family_closure_truth.status,
    'historical_local_migration_artifact',
  );
  assert.equal(currentProgram.current_state.phase_label, 'Repo-Verified Product Entry And OPL Federation');
  assert.equal(currentProgram.current_state.workstream, 'repo_verified_product_entry_and_opl_federation');
  assert.equal(currentProgram.current_state.active_baton.id, 'managed_product_entry_hardening');
  assert.equal(currentProgram.current_state.active_baton.status, 'closeout_completed');
  assert.deepEqual(currentProgram.current_state.active_baton.scope.required_identity_fields, [
    'program_id',
    'topic_id',
    'deliverable_id',
    'run_id',
  ]);
  assert.equal(
    currentProgram.current_state.active_baton.scope.required_downstream_domain_surfaces.includes('runDeliverableRoute'),
    true,
  );
  assert.equal(
    contract.required_behavior.includes(
      'routed family artifacts persist topic_id, deliverable_id, contract, and stage_contract across stable families',
    ),
    true,
  );
  assert.equal(brief.includes('第二条 human-publication family closure'), true);
  assert.equal(brief.includes('topic_id`、`deliverable_id`、`contract` 与 `stage_contract`'), true);
  assert.equal(brief.includes('历史说明'), true);
});

function assertHermesExecutionModel(result, route, topicId, deliverableId) {
  assert.equal(result.route, route);
  assert.equal(result.topic_id, topicId);
  assert.equal(result.deliverable_id, deliverableId);
  assert.equal(result.stage_contract?.stage_id, route);
  assert.equal(result.execution_model.mainline_adapter, 'host_agent');
  assert.equal(result.execution_model.primary_surface, 'codex_native_host_agent');
  assert.equal(result.execution_model.runtime_substrate_owner, 'Codex CLI');
  assert.equal(result.execution_model.deployment_host, 'codex_local_operator_host');
  assert.equal(result.execution_model.deployment_host_status, 'transition_only');
  assert.equal(result.execution_model.freeze_origin_milestone, 'P19.A');
}

test('stable family runtime routes expose one Hermes execution-model truth before gateway wrapping', async () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-hermes-stable-family-'));

  await completeSourceReadiness({
    workspaceRoot,
    topicId: 'topic-a',
    title: 'Hermes stable family closure',
    brief: '验证 stable family runtime route output 直接暴露 Hermes execution truth。',
    keywords: ['Codex CLI', 'runtime', 'closure'],
  });

  await createDeliverable({
    workspaceRoot,
    overlay: 'ppt_deck',
    profileId: 'lecture_student',
    topicId: 'topic-a',
    deliverableId: 'deck-a',
    title: 'Hermes PPT deck',
    goal: '验证 ppt family runtime 直接暴露 Hermes execution truth',
  });
  await createDeliverable({
    workspaceRoot,
    overlay: 'xiaohongshu',
    profileId: 'standard_note',
    topicId: 'topic-a',
    deliverableId: 'note-a',
    title: 'Hermes 小红书笔记',
    goal: '验证 xiaohongshu family runtime 直接暴露 Hermes execution truth',
  });
  await createDeliverable({
    workspaceRoot,
    overlay: 'poster_onepager',
    profileId: 'knowledge_poster',
    topicId: 'topic-a',
    deliverableId: 'poster-a',
    title: 'Hermes 知识海报',
    goal: '验证 poster family runtime 直接暴露 Hermes execution truth',
  });

  const ppt = await runPptDeckRoute({
    workspaceRoot,
    topicId: 'topic-a',
    deliverableId: 'deck-a',
    route: 'storyline',
    contract: loadHydratedContract(workspaceRoot, 'topic-a', 'deck-a'),
  });
  const xhs = await runXiaohongshuRoute({
    workspaceRoot,
    topicId: 'topic-a',
    deliverableId: 'note-a',
    route: 'research',
    contract: loadHydratedContract(workspaceRoot, 'topic-a', 'note-a'),
  });
  const poster = await runPosterOnepagerRoute({
    workspaceRoot,
    topicId: 'topic-a',
    deliverableId: 'poster-a',
    route: 'storyline',
    contract: loadHydratedContract(workspaceRoot, 'topic-a', 'poster-a'),
  });

  assertHermesExecutionModel(ppt, 'storyline', 'topic-a', 'deck-a');
  assert.equal(ppt.contract.profile_id, 'lecture_student');
  assertHermesExecutionModel(xhs, 'research', 'topic-a', 'note-a');
  assert.equal(xhs.contract.profile_id, 'standard_note');
  assertHermesExecutionModel(poster, 'storyline', 'topic-a', 'poster-a');
  assert.equal(poster.contract.profile_id, 'knowledge_poster');
});

test('xiaohongshu human-publication closure stays Hermes-backed without drifting durable truth', async () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-hermes-xhs-closure-'));

  await completeSourceReadiness({
    workspaceRoot,
    topicId: 'topic-a',
    title: '甲状腺门诊小红书科普',
    brief: '围绕甲状腺门诊主题准备一篇可发布、可审阅的小红书图文。',
    keywords: ['甲状腺', '门诊', '小红书'],
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

  const routes = [
    'research',
    'storyline',
    'single_note_plan',
    'visual_direction',
    'render_html',
    'visual_director_review',
    'screenshot_review',
    'publish_copy',
    'export_bundle',
  ];

  let lastResult = null;
  for (const route of routes) {
    const result = await runDeliverableRoute({
      workspaceRoot,
      overlay: 'xiaohongshu',
      topicId: 'topic-a',
      deliverableId: 'note-a',
      route,
    });
    assert.equal(result.ok, true, route);
    assert.equal(result.run.executor.execution_model.runtime_substrate_owner, 'Codex CLI', route);
    assert.equal(result.run.runtime_topology.runtime_substrate_owner, 'Codex CLI', route);
    lastResult = result;
  }

  const artifact = readJson(lastResult.artifactFile);
  const review = await getReviewState({
    workspaceRoot,
    topicId: 'topic-a',
    deliverableId: 'note-a',
  });
  const projection = await getPublicationProjection({
    workspaceRoot,
    topicId: 'topic-a',
  });
  const audit = await auditDeliverable({
    workspaceRoot,
    overlay: 'xiaohongshu',
    topicId: 'topic-a',
    deliverableId: 'note-a',
    mode: 'draft_new',
  });
  const watch = await runtimeWatch({
    workspaceRoot,
    topicId: 'topic-a',
    deliverableId: 'note-a',
    runId: lastResult.run.run_id,
  });

  assert.equal(artifact.route, 'export_bundle');
  assert.equal(artifact.topic_id, 'topic-a');
  assert.equal(artifact.deliverable_id, 'note-a');
  assert.equal(artifact.contract.profile_id, 'standard_note');
  assert.equal(artifact.stage_contract.stage_id, 'export_bundle');
  assert.equal(artifact.execution_model.runtime_substrate_owner, 'Codex CLI');
  assert.equal(artifact.execution_model.freeze_origin_milestone, 'P19.A');
  assert.equal(artifact.export_bundle.delivery_state.current, 'output_ready');
  assert.equal(existsSync(artifact.export_bundle.html_file), true);
  assert.equal(existsSync(artifact.export_bundle.caption_file), true);
  assert.equal(Array.isArray(artifact.export_bundle.png_files), true);
  assert.equal(artifact.export_bundle.png_files.length > 0, true);

  assert.equal(review.governance_surface.family_boundary.human_publication, true);
  assert.equal(review.governance_surface.runtime_topology.runtime_substrate_owner, 'Codex CLI');
  assert.equal(review.state.current_status, 'publish_ready');
  assert.equal(review.state.approval_state.required, true);
  assert.equal(review.state.approval_state.status, 'pending_human');
  assert.equal(review.state.publish_state.current, 'approval_pending');

  const noteProjection = projection.publication.deliverables['note-a'];
  assert.equal(noteProjection.projection_model, 'human_publication');
  assert.equal(noteProjection.current, 'approval_pending');
  assert.equal(noteProjection.next, 'approved_pending_publish');
  assert.equal(noteProjection.delivery_state.current, 'output_ready');
  assert.equal(noteProjection.governance_surface.runtime_topology.runtime_substrate_owner, 'Codex CLI');
  assert.equal(noteProjection.source_readiness_summary.planning_ready, true);

  assert.deepEqual(audit.review_state, review.state);
  assert.deepEqual(audit.publication_projection, projection.publication);
  assert.equal(audit.governance_surface.runtime_topology.runtime_substrate_surface, 'codex_native_host_agent');
  assert.equal(audit.gate_summary.source_planning_ready, true);
  assert.equal(audit.gate_summary.approval_required, true);
  assert.equal(audit.gate_summary.delivery_projection_current, 'approval_pending');

  assert.equal(watch.run_id, lastResult.run.run_id);
  assert.equal(watch.governance_surface.runtime_topology.runtime_substrate_owner, 'Codex CLI');
  assert.equal(watch.review_state.current_status, review.state.current_status);
  assert.equal(
    watch.publication_projection.deliverables['note-a'].current,
    noteProjection.current,
  );
  assert.equal(
    watch.publication_projection.deliverables['note-a'].delivery_state.current,
    noteProjection.delivery_state.current,
  );
});
