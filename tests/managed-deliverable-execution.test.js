import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { existsSync, mkdtempSync, readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import {
  auditDeliverable,
  createDeliverable,
  getPublicationProjection,
  getReviewState,
  getManagedRun,
  runManagedDeliverable,
  superviseManagedRun,
  runtimeWatch,
} from '../packages/redcube-gateway/src/index.js';
import { resolveWorkspaceContract } from '../packages/redcube-runtime-protocol/src/index.js';
import { completeSourceReadiness } from './helpers/complete-source-readiness.js';
import {
  startMockCodexCli,
  withEnv,
} from './helpers/mock-codex-cli.js';

const MODULE_DIR = path.dirname(fileURLToPath(import.meta.url));
const MOCK_HERMES_NATIVE_BRIDGE_COMMAND = JSON.stringify([
  process.execPath,
  path.join(MODULE_DIR, 'helpers/mock-hermes-native-bridge.mjs'),
]);

function readJson(file) {
  return JSON.parse(readFileSync(file, 'utf-8'));
}

function runtimeDirEntries(workspaceRoot, relativeDir) {
  const runtimeDir = resolveWorkspaceContract({ workspaceRoot }).runtimeDir;
  const dir = path.join(runtimeDir, relativeDir);
  return existsSync(dir) ? readdirSync(dir) : [];
}

function assertNoManagedState(workspaceRoot) {
  assert.deepEqual(runtimeDirEntries(workspaceRoot, 'managed-runs'), []);
  assert.deepEqual(runtimeDirEntries(workspaceRoot, 'managed-progress'), []);
  assert.deepEqual(runtimeDirEntries(workspaceRoot, 'managed-stage-records'), []);
  assert.deepEqual(runtimeDirEntries(workspaceRoot, 'managed-supervision'), []);
  assert.deepEqual(runtimeDirEntries(workspaceRoot, 'managed-escalation'), []);
}

async function withMockHermesUpstream(testFn) {
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

async function withMockHermesNativeProof(testFn) {
  const restoreEnv = withEnv({
    REDCUBE_HERMES_NATIVE_BRIDGE_COMMAND: MOCK_HERMES_NATIVE_BRIDGE_COMMAND,
  });
  try {
    return await testFn();
  } finally {
    restoreEnv();
  }
}

test('managed execution defaults to auto_to_terminal and runs a ppt deliverable to final export with auditable prompt records', async () => {
  await withMockHermesUpstream(async () => {
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-managed-run-'));

    await completeSourceReadiness({
      workspaceRoot,
      topicId: 'topic-a',
      title: '甲状腺门诊科普',
      brief: '面向本科生准备一份最终可交付的课堂 PPT。',
      keywords: ['甲状腺', 'PPT'],
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

    const result = await runManagedDeliverable({
      workspaceRoot,
      overlay: 'ppt_deck',
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      userIntent: '给我一个最终 PPT',
    });

    assert.equal(result.ok, true);
    assert.equal(result.surface_kind, 'managed_run');
    assert.equal(result.summary.status, 'completed');
    assert.equal(result.managed_run.mode, 'auto_to_terminal');
    assert.equal(result.managed_run.stop_after_stage, null);
    assert.equal(result.managed_run.current_stage, 'export_pptx');
    assert.equal(result.managed_run.route_runs.length, 8);
    assert.equal(result.managed_run.stage_results.length, 8);
    assert.equal(
      result.managed_run.route_runs.every((stageRun) => /^run[-_]/.test(stageRun.route_run_id)),
      true,
    );
    assert.equal(
      result.managed_run.route_runs.every((stageRun) => stageRun.route_run_id !== result.managed_run.managed_run_id),
      true,
    );
    assert.equal(result.managed_run.runtime_bridge?.owner, 'codex_cli');
    assert.equal(result.managed_run.runtime_bridge?.adapter_surface, '@redcube/codex-cli-client');
    assert.equal(result.progress_projection.current_stage, 'export_pptx');
    assert.equal(result.progress_projection.needs_user_decision, false);
    assert.equal(result.progress_projection.final_artifact_refs.length > 0, true);
    assert.equal(result.progress_projection.latest_events.length >= 4, true);
    assert.equal(result.progress_projection.content_status, 'completed');
    assert.deepEqual(result.progress_projection.remaining_stages, []);
    assert.equal(result.progress_projection.completed_stages.includes('storyline'), true);
    assert.equal(result.progress_projection.completed_stages.includes('export_pptx'), true);
    assert.match(result.progress_projection.human_report.recent_completion, /\d{2}:\d{2}/);
    assert.match(result.progress_projection.human_report.mainline_status, /主线/);
    assert.match(result.progress_projection.human_report.runtime_health, /runtime/i);
    assert.match(result.progress_projection.latest_events[0].summary, /\d{2}:\d{2}/);
    assert.equal(
      result.progress_projection.latest_events.every((event) => !String(event.summary).includes('run-')),
      true,
    );
    assert.equal(result.managed_run.requested_adapter, 'host_agent');
    assert.equal(result.managed_run.active_adapter, 'host_agent');
    assert.equal(result.managed_run.active_run_id, null);
    assert.equal(result.managed_run.worker_running, false);
    assert.equal(result.managed_run.runtime_liveness_audit.status, 'none');
    assert.equal(result.runtime_supervision.health_status, 'completed');
    assert.equal(result.runtime_supervision.runtime_liveness_audit.status, 'none');
    assert.equal(result.runtime_supervision.worker_running, false);
    assert.equal(result.runtime_supervision.active_run_id, null);
    assert.equal(result.runtime_supervision.needs_human_intervention, false);
    assert.equal(result.runtime_supervision.runtime_owner, 'codex_cli');
    assert.equal(result.escalation_record.escalation_status, 'none');
    assert.equal(typeof result.runtime_supervision.refs.runtime_supervision_path, 'string');
    assert.equal(typeof result.runtime_supervision.refs.progress_projection_path, 'string');
    assert.equal(typeof result.runtime_supervision.refs.escalation_record_path, 'string');

    const firstStageRun = result.managed_run.route_runs[0];
    const firstPromptAudit = readJson(firstStageRun.prompt_audit_ref);
    assert.equal(firstPromptAudit.managed_run_id, result.managed_run.managed_run_id);
    assert.equal(firstPromptAudit.stage_id, 'storyline');
    assert.equal(firstPromptAudit.input.user_intent.request, '给我一个最终 PPT');
    assert.equal(Boolean(firstPromptAudit.input.deliverable_contract), true);
    assert.equal(Array.isArray(firstPromptAudit.input.upstream_stage_outputs), true);
    assert.equal(Array.isArray(firstPromptAudit.input.existing_artifacts), true);
    assert.equal(Boolean(firstPromptAudit.input.route_strategy), true);
    assert.equal(typeof firstPromptAudit.effective_prompt, 'string');
    assert.equal(firstPromptAudit.effective_prompt.length > 0, true);
    assert.equal(typeof firstPromptAudit.model, 'string');
    assert.equal(typeof firstPromptAudit.tool_policy, 'string');
    assert.equal(Array.isArray(firstPromptAudit.input_refs), true);
    assert.equal(Array.isArray(firstPromptAudit.output_refs), true);

    const finalStageRun = result.managed_run.route_runs.at(-1);
    const finalIngestion = readJson(finalStageRun.result_ref);
    assert.equal(typeof finalIngestion.summary, 'string');
    assert.equal(Array.isArray(finalIngestion.artifacts), true);
    assert.equal(finalIngestion.decision, 'complete_managed_run');
    assert.equal(finalIngestion.next_action, 'finalize_delivery');
    assert.equal(finalIngestion.blocking_reason, null);

    const stored = await getManagedRun({
      workspaceRoot,
      managedRunId: result.managed_run.managed_run_id,
    });
    assert.equal(stored.ok, true);
    assert.equal(stored.surface_kind, 'managed_run_record');
    assert.equal(stored.summary.managed_run_id, result.managed_run.managed_run_id);
    assert.equal(stored.managed_run.runtime_bridge?.owner, 'codex_cli');
    assert.equal(stored.runtime_supervision.runtime_owner, 'codex_cli');
    assert.deepEqual(stored.progress_projection, result.progress_projection);
    assert.deepEqual(stored.runtime_supervision, result.runtime_supervision);
    assert.deepEqual(stored.escalation_record, result.escalation_record);

    const supervised = await superviseManagedRun({
      workspaceRoot,
      managedRunId: result.managed_run.managed_run_id,
    });
    assert.equal(supervised.ok, true);
    assert.equal(supervised.surface_kind, 'managed_supervision');
    assert.equal(supervised.summary.managed_run_id, result.managed_run.managed_run_id);
    assert.equal(supervised.runtime_supervision.health_status, 'completed');
    assert.equal(supervised.runtime_supervision.runtime_owner, 'codex_cli');
  });
});

test('managed execution stops at explicit stop_after_stage instead of auto-running to terminal', async () => {
  await withMockHermesUpstream(async () => {
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-managed-stop-'));

    await completeSourceReadiness({
      workspaceRoot,
      topicId: 'topic-a',
      title: '甲状腺门诊科普',
      brief: '这次只需要先确认主线故事。',
      keywords: ['甲状腺', '故事线'],
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

    const result = await runManagedDeliverable({
      workspaceRoot,
      overlay: 'ppt_deck',
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      userIntent: '先给我主线故事',
      stopAfterStage: 'storyline',
    });

    assert.equal(result.ok, true);
    assert.equal(result.summary.status, 'stopped_after_stage');
    assert.equal(result.managed_run.mode, 'stop_after_stage');
    assert.equal(result.managed_run.stop_after_stage, 'storyline');
    assert.equal(result.managed_run.current_stage, 'storyline');
    assert.equal(result.managed_run.runtime_bridge?.owner, 'codex_cli');
    assert.equal(result.managed_run.parking_reason_code, 'user_requested_stop_after_stage');
    assert.equal(result.managed_run.requires_human_confirmation, true);
    assert.deepEqual(
      result.managed_run.route_runs.map((stageRun) => stageRun.stage_id),
      ['storyline'],
    );
    assert.equal(result.progress_projection.current_stage, 'storyline');
    assert.equal(result.progress_projection.needs_user_decision, true);
    assert.match(result.progress_projection.next_system_action, /等待.*决定是否继续/i);
    assert.equal(result.progress_projection.content_status, 'paused_for_user_request');
    assert.equal(result.progress_projection.final_artifact_refs.length, 0);
    assert.equal(result.runtime_supervision.health_status, 'paused');
    assert.equal(result.runtime_supervision.needs_human_intervention, true);
    assert.equal(result.runtime_supervision.runtime_owner, 'codex_cli');
    assert.equal(result.escalation_record.escalation_status, 'none');

    const stored = await getManagedRun({
      workspaceRoot,
      managedRunId: result.managed_run.managed_run_id,
    });
    assert.equal(stored.managed_run.status, 'stopped_after_stage');
    assert.equal(stored.progress_projection.needs_user_decision, true);
    assert.equal(stored.runtime_supervision.health_status, 'paused');
    assert.equal(stored.runtime_supervision.runtime_owner, 'codex_cli');
  });
});

test('managed execution accepts explicit hermes_native_proof adapter and keeps it as the active executor', async () => {
  await withMockHermesNativeProof(async () => {
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-managed-hermes-proof-'));

    await completeSourceReadiness({
      workspaceRoot,
      topicId: 'topic-a',
      title: 'Hermes proof managed route',
      brief: '只需要先验证 storyline 阶段的 Hermes-native full agent loop。',
      keywords: ['Hermes', 'proof'],
    });

    await createDeliverable({
      workspaceRoot,
      overlay: 'ppt_deck',
      profileId: 'lecture_student',
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      title: 'Hermes proof managed route',
      goal: '验证托管运行可显式走 Hermes-native proof adapter',
    });

    const result = await runManagedDeliverable({
      workspaceRoot,
      overlay: 'ppt_deck',
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      userIntent: '先只跑 storyline',
      stopAfterStage: 'storyline',
      adapter: 'hermes_native_proof',
    });

    assert.equal(result.ok, true);
    assert.equal(result.summary.status, 'stopped_after_stage');
    assert.equal(result.managed_run.requested_adapter, 'hermes_native_proof');
    assert.equal(result.managed_run.active_adapter, 'hermes_native_proof');
    assert.equal(result.managed_run.adapter_switches.length, 0);
    assert.equal(result.managed_run.runtime_bridge?.owner, 'hermes_native_proof');
    assert.equal(result.managed_run.runtime_bridge?.model_selection, 'inherit_local_hermes_default');
    assert.equal(result.managed_run.runtime_bridge?.reasoning_selection, 'inherit_local_hermes_default');
    assert.equal(result.managed_run.route_runs.length, 1);

    const stageRun = result.managed_run.route_runs[0];
    const stageResult = readJson(stageRun.result_ref);
    assert.equal(stageResult.decision, 'stop_after_stage');

    const stored = await getManagedRun({
      workspaceRoot,
      managedRunId: result.managed_run.managed_run_id,
    });
    assert.equal(stored.managed_run.requested_adapter, 'hermes_native_proof');
    assert.equal(stored.managed_run.active_adapter, 'hermes_native_proof');
    assert.equal(stored.managed_run.runtime_bridge?.owner, 'hermes_native_proof');
    assert.equal(stored.runtime_supervision.runtime_owner, 'hermes_native_proof');
  });
});

test('managed control plane keeps managed execution by switching back to the primary adapter when compatibility routing stops downstream progress', async () => {
  await withMockHermesUpstream(async () => {
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-managed-failure-'));

    await completeSourceReadiness({
      workspaceRoot,
      topicId: 'topic-a',
      title: '甲状腺门诊科普',
      brief: '验证托管执行的结构化失败回写。',
      keywords: ['甲状腺', '失败'],
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

    const result = await runManagedDeliverable({
      workspaceRoot,
      overlay: 'ppt_deck',
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      userIntent: '给我一个最终 PPT',
      adapter: 'external_llm',
    });

    assert.equal(result.ok, true);
    assert.equal(result.summary.status, 'completed');
    assert.equal(result.managed_run.requested_adapter, 'external_llm');
    assert.equal(result.managed_run.active_adapter, 'host_agent');
    assert.equal(result.managed_run.runtime_bridge?.owner, 'codex_cli');
    assert.equal(result.managed_run.adapter_switches.length, 1);
    assert.deepEqual(result.managed_run.adapter_switches[0], {
      at: result.managed_run.adapter_switches[0].at,
      from_adapter: 'external_llm',
      to_adapter: 'host_agent',
      reason_code: 'compatibility_adapter_route_unsupported',
      stage_id: 'detailed_outline',
    });
    assert.equal(
      result.managed_run.adapter_switches[0].from_adapter,
      result.managed_run.requested_adapter,
    );
    assert.notEqual(
      result.managed_run.adapter_switches[0].from_adapter,
      result.managed_run.active_adapter,
    );
    assert.equal(
      result.managed_run.adapter_switches[0].to_adapter,
      result.managed_run.active_adapter,
    );
    assert.equal(result.managed_run.current_stage, 'export_pptx');
    const detailedOutlineRuns = result.managed_run.route_runs.filter(
      (stageRun) => stageRun.stage_id === 'detailed_outline',
    );
    assert.equal(detailedOutlineRuns.length, 2);
    const initialDetailedOutline = readJson(detailedOutlineRuns[0].result_ref);
    const retriedDetailedOutline = readJson(detailedOutlineRuns[1].result_ref);
    assert.equal(initialDetailedOutline.decision, 'switch_to_primary_adapter');
    assert.equal(
      initialDetailedOutline.controller_decision.reason_code,
      'compatibility_adapter_route_unsupported',
    );
    assert.equal(retriedDetailedOutline.decision, 'advance_to_next_stage');
    assert.equal(result.progress_projection.current_blockers.length, 0);
    assert.equal(result.progress_projection.needs_user_decision, false);
    assert.match(result.progress_projection.latest_events.at(-1).summary, /\d{2}:\d{2}/);
    assert.equal(result.runtime_supervision.health_status, 'completed');
    assert.equal(result.runtime_supervision.needs_human_intervention, false);
    assert.equal(result.runtime_supervision.runtime_owner, 'codex_cli');
    assert.equal(result.escalation_record.escalation_status, 'none');
  });
});

test('managed execution keeps xiaohongshu on the Codex-backed human-publication closure without drifting durable truth', async () => {
  await withMockHermesUpstream(async () => {
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-managed-xhs-'));

    await completeSourceReadiness({
      workspaceRoot,
      topicId: 'topic-a',
      title: '甲状腺门诊小红书科普',
      brief: '验证托管执行在小红书 human-publication 闭环上的真值一致性。',
      keywords: ['甲状腺', '小红书'],
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

    const result = await runManagedDeliverable({
      workspaceRoot,
      overlay: 'xiaohongshu',
      topicId: 'topic-a',
      deliverableId: 'note-a',
      userIntent: '给我一篇最终可发布的小红书图文',
    });

    assert.equal(result.ok, true);
    assert.equal(result.summary.status, 'completed');
    assert.equal(result.managed_run.overlay, 'xiaohongshu');
    assert.equal(result.managed_run.runtime_bridge?.owner, 'codex_cli');
    assert.equal(result.managed_run.current_stage, 'export_bundle');
    assert.deepEqual(
      result.managed_run.route_runs.map((stageRun) => stageRun.stage_id),
      [
        'research',
        'storyline',
        'single_note_plan',
        'visual_direction',
        'render_html',
        'visual_director_review',
        'screenshot_review',
        'publish_copy',
        'export_bundle',
      ],
    );
    assert.equal(result.progress_projection.current_stage, 'export_bundle');
    assert.equal(result.progress_projection.content_status, 'completed');
    assert.equal(result.runtime_supervision.health_status, 'completed');
    assert.equal(result.runtime_supervision.runtime_owner, 'codex_cli');
    assert.equal(result.escalation_record.escalation_status, 'none');

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
      runId: result.managed_run.route_runs.at(-1).route_run_id,
    });

  assert.equal(review.state.current_status, 'publish_ready');
  assert.equal(review.state.approval_state.required, true);
  assert.equal(review.state.approval_state.status, 'pending_human');
  assert.equal(review.state.publish_state.current, 'approval_pending');
  assert.equal(review.governance_surface.family_boundary.human_publication, true);
  assert.equal(review.governance_surface.runtime_topology.runtime_substrate_owner, 'Codex CLI');

  const noteProjection = projection.publication.deliverables['note-a'];
  assert.equal(noteProjection.projection_model, 'human_publication');
  assert.equal(noteProjection.current, 'approval_pending');
  assert.equal(noteProjection.next, 'approved_pending_publish');
  assert.equal(noteProjection.delivery_state.current, 'output_ready');
  assert.equal(noteProjection.governance_surface.family_boundary.human_publication, true);
  assert.equal(noteProjection.governance_surface.runtime_topology.runtime_substrate_owner, 'Codex CLI');

  assert.deepEqual(audit.review_state, review.state);
  assert.deepEqual(audit.publication_projection, projection.publication);
  assert.equal(audit.gate_summary.approval_required, true);
  assert.equal(audit.gate_summary.delivery_projection_current, 'approval_pending');
  assert.equal(audit.governance_surface.runtime_topology.runtime_substrate_surface, 'codex_native_host_agent');

  assert.equal(watch.run_id, result.managed_run.route_runs.at(-1).route_run_id);
  assert.equal(watch.review_state.current_status, review.state.current_status);
  assert.equal(
    watch.publication_projection.deliverables['note-a'].current,
    noteProjection.current,
  );
    assert.equal(watch.governance_surface.runtime_topology.runtime_substrate_owner, 'Codex CLI');
  });
});

test('managed execution keeps poster_onepager on the guarded knowledge-poster closure without drifting direct-delivery truth', async () => {
  await withMockHermesUpstream(async () => {
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-managed-poster-'));

    await completeSourceReadiness({
      workspaceRoot,
      topicId: 'topic-a',
      title: '甲状腺门诊知识海报',
      brief: '验证托管执行在 guarded knowledge-poster 闭环上的真值一致性。',
      keywords: ['甲状腺', '海报'],
    });

    await createDeliverable({
      workspaceRoot,
      overlay: 'poster_onepager',
      profileId: 'knowledge_poster',
      topicId: 'topic-a',
      deliverableId: 'poster-a',
      title: '甲状腺门诊知识海报',
      goal: '为门诊患者生成一张知识海报',
    });

    const result = await runManagedDeliverable({
      workspaceRoot,
      overlay: 'poster_onepager',
      topicId: 'topic-a',
      deliverableId: 'poster-a',
      userIntent: '给我一张最终可交付的知识海报',
    });

    assert.equal(result.ok, true);
    assert.equal(result.summary.status, 'completed');
    assert.equal(result.managed_run.overlay, 'poster_onepager');
    assert.equal(result.managed_run.runtime_bridge?.owner, 'codex_cli');
    assert.equal(result.managed_run.current_stage, 'export_bundle');
    assert.deepEqual(
      result.managed_run.route_runs.map((stageRun) => stageRun.stage_id),
      [
        'storyline',
        'poster_blueprint',
        'visual_direction',
        'render_html',
        'visual_director_review',
        'screenshot_review',
        'export_bundle',
      ],
    );
    assert.equal(result.progress_projection.current_stage, 'export_bundle');
    assert.equal(result.progress_projection.content_status, 'completed');
    assert.equal(result.runtime_supervision.health_status, 'completed');
    assert.equal(result.runtime_supervision.runtime_owner, 'codex_cli');
    assert.equal(result.escalation_record.escalation_status, 'none');

    const review = await getReviewState({
      workspaceRoot,
      topicId: 'topic-a',
      deliverableId: 'poster-a',
    });
    const projection = await getPublicationProjection({
      workspaceRoot,
      topicId: 'topic-a',
    });
    const audit = await auditDeliverable({
      workspaceRoot,
      overlay: 'poster_onepager',
      topicId: 'topic-a',
      deliverableId: 'poster-a',
      mode: 'draft_new',
    });
    const watch = await runtimeWatch({
      workspaceRoot,
      topicId: 'topic-a',
      deliverableId: 'poster-a',
      runId: result.managed_run.route_runs.at(-1).route_run_id,
    });

  assert.equal(review.state.current_status, 'completed');
  assert.equal(review.state.approval_state.status, 'not_required');
  assert.equal(review.state.publish_state.current, 'not_applicable');
  assert.equal(review.governance_surface.family_boundary.guarded_knowledge_poster, true);
  assert.equal(review.governance_surface.runtime_topology.runtime_substrate_owner, 'Codex CLI');

  const posterProjection = projection.publication.deliverables['poster-a'];
  assert.equal(posterProjection.projection_model, 'direct_delivery');
  assert.equal(posterProjection.current, 'output_ready');
  assert.equal(posterProjection.delivery_state.current, 'output_ready');
  assert.equal(posterProjection.operator_handoff.gate_status, 'ready');
  assert.equal(posterProjection.governance_surface.family_boundary.guarded_knowledge_poster, true);
  assert.equal(posterProjection.governance_surface.runtime_topology.runtime_substrate_owner, 'Codex CLI');

  assert.deepEqual(audit.review_state, review.state);
  assert.deepEqual(audit.publication_projection, projection.publication);
  assert.equal(audit.gate_summary.operator_handoff_status, 'ready');
  assert.equal(audit.gate_summary.delivery_projection_current, 'output_ready');
  assert.equal(audit.governance_surface.runtime_topology.runtime_substrate_surface, 'codex_native_host_agent');

  assert.equal(watch.run_id, result.managed_run.route_runs.at(-1).route_run_id);
  assert.equal(watch.review_state.current_status, review.state.current_status);
  assert.equal(
    watch.publication_projection.deliverables['poster-a'].current,
    posterProjection.current,
  );
    assert.equal(watch.governance_surface.runtime_topology.runtime_substrate_owner, 'Codex CLI');
  });
});

test('managed execution fails closed when Codex CLI proof is blocked', async () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-managed-upstream-blocked-'));
  const restoreEnv = withEnv({
    REDCUBE_HERMES_UPSTREAM_BASE_URL: 'http://127.0.0.1:1',
    REDCUBE_HERMES_UPSTREAM_MODEL: 'hermes-agent',
    REDCUBE_HERMES_UPSTREAM_API_KEY: undefined,
  });

  try {
    await completeSourceReadiness({
      workspaceRoot,
      topicId: 'topic-a',
      title: '上游阻断验证',
      brief: '验证 Codex CLI 不可达时托管执行会 fail-closed。',
      keywords: ['Codex CLI', 'blocked'],
    });

    await createDeliverable({
      workspaceRoot,
      overlay: 'ppt_deck',
      profileId: 'lecture_student',
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      title: '上游阻断 deck',
      goal: '验证 upstream fail-closed',
    });

    await assert.rejects(
      () => runManagedDeliverable({
        workspaceRoot,
        overlay: 'ppt_deck',
        topicId: 'topic-a',
        deliverableId: 'deck-a',
        userIntent: '给我一个最终 PPT',
      }),
      /Codex CLI/i,
    );

    assertNoManagedState(workspaceRoot);
  } finally {
    restoreEnv();
  }
});

test('managed execution rejects overlay mismatch before creating durable managed state', async () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-managed-overlay-mismatch-'));

  await completeSourceReadiness({
    workspaceRoot,
    topicId: 'topic-a',
    title: '托管 overlay mismatch',
    brief: '验证 managed preflight 会在 overlay 漂移时 fail-closed。',
    keywords: ['托管', 'overlay'],
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

  await assert.rejects(
    () => runManagedDeliverable({
      workspaceRoot,
      overlay: 'xiaohongshu',
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      userIntent: '给我一个最终 PPT',
    }),
    /overlay mismatch: expected ppt_deck, got xiaohongshu/,
  );

  assertNoManagedState(workspaceRoot);
});

test('managed execution rejects undeclared stop_after_stage before creating durable managed state', async () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-managed-stop-mismatch-'));

  await completeSourceReadiness({
    workspaceRoot,
    topicId: 'topic-a',
    title: '托管 stopAfterStage mismatch',
    brief: '验证 managed preflight 不会忽略未声明的 stopAfterStage。',
    keywords: ['托管', 'stopAfterStage'],
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

  await assert.rejects(
    () => runManagedDeliverable({
      workspaceRoot,
      overlay: 'ppt_deck',
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      userIntent: '给我一个最终 PPT',
      stopAfterStage: 'publish_copy',
    }),
    /stopAfterStage mismatch: publish_copy is not declared by hydrated deliverable contract/,
  );

  assertNoManagedState(workspaceRoot);
});
