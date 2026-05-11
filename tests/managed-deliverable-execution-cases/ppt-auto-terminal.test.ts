// @ts-nocheck
import {
  test,
  assert,
  os,
  path,
  existsSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  writeFileSync,
  buildManagedRepeatedReviewRerunDecision,
  createRuntimeManagedRun,
  saveManagedRun,
  startRun,
  auditDeliverable,
  createDeliverable,
  getPublicationProjection,
  getReviewState,
  getManagedRun,
  runManagedDeliverable,
  superviseManagedRun,
  runtimeWatch,
  resolveWorkspaceContract,
  completeSourceReadiness,
  startMockCodexCli,
  withEnv,
  MODULE_DIR,
  MOCK_HERMES_AGENT_LOOP_BRIDGE_COMMAND,
  MOCK_REDCUBE_PYTHON_COMMAND,
  readJson,
  withoutUpdatedAt,
  runtimeDirEntries,
  assertNoManagedState,
  withMockCodexRuntime,
  withMockHermesAgentLoop,
} from './shared.ts';

test('managed rerun guard escalates repeated identical screenshot repair requests', () => {
  const managedRun = {
    stage_results: [
      {
        stage_id: 'screenshot_review',
        decision: 'rerun_from_review_stage',
        review_rerun_signature: {
          review_stage_id: 'screenshot_review',
          rerun_from_stage: 'repair_image_pages',
          target_slide_ids: ['S02'],
          blocking_reasons: ['block_content_fit_ok'],
        },
      },
    ],
  };
  const decision = buildManagedRepeatedReviewRerunDecision({
    managedRun,
    stageId: 'screenshot_review',
    rerunFromStage: 'repair_image_pages',
    targetSlideIds: ['S02'],
    blockingReasons: ['block_content_fit_ok'],
  });

  assert.equal(decision.shouldEscalate, true);
  assert.equal(decision.reason_code, 'repeated_review_rerun_without_progress');
  assert.equal(decision.signature.rerun_from_stage, 'repair_image_pages');
  assert.deepEqual(decision.signature.target_slide_ids, ['S02']);
});

test('managed execution defaults to auto_to_terminal and runs a ppt deliverable to final export with auditable prompt records', async () => {
  await withMockCodexRuntime(async () => {
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
    assert.equal(result.managed_run.stage_results.length, 9);
    assert.equal(
      result.managed_run.route_runs.some((stageRun) => stageRun.stage_id === 'repair_image_pages'),
      false,
    );
    assert.equal(
      result.managed_run.stage_results.some((stageResult) => stageResult.stage_id === 'repair_image_pages' && stageResult.status === 'skipped'),
      true,
    );
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
    assert.equal(result.managed_run.execution_plan.scheduler_kind, 'managed_deliverable_dag');
    assert.equal(result.managed_run.execution_plan.optimization.quality_gate_policy, 'preserve_stage_dependencies_and_review_hard_stops');
    assert.equal(result.managed_run.execution_plan.max_parallel_width >= 1, true);
    assert.equal(result.managed_run.execution_result.execution_kind, 'managed_dag_layer_execution');
    assert.equal(result.managed_run.execution_result.ok, true);
    assert.equal(result.managed_run.execution_result.layer_results.length, result.managed_run.execution_plan.layers.length);
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
    assert.equal(result.managed_run.requested_adapter, 'codex_cli');
    assert.equal(result.managed_run.active_adapter, 'codex_cli');
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

test('managed auto_to_terminal skips repair_image_pages when screenshot_review does not request a rerun', async () => {
  await withMockCodexRuntime(async () => {
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-managed-skip-fix-html-'));

    await completeSourceReadiness({
      workspaceRoot,
      topicId: 'topic-a',
      title: '甲状腺门诊科普',
      brief: '验证 happy path 不会无条件进入 repair_image_pages。',
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
    assert.deepEqual(
      result.managed_run.route_runs.map((stageRun) => stageRun.stage_id),
      [
        'storyline',
        'detailed_outline',
        'slide_blueprint',
        'visual_direction',
        'author_image_pages',
        'visual_director_review',
        'screenshot_review',
        'export_pptx',
      ],
    );
    assert.deepEqual(
      result.managed_run.stage_results.map((stageResult) => stageResult.stage_id),
      [
        'storyline',
        'detailed_outline',
        'slide_blueprint',
        'visual_direction',
        'author_image_pages',
        'visual_director_review',
        'screenshot_review',
        'repair_image_pages',
        'export_pptx',
      ],
    );
    assert.equal(
      result.managed_run.stage_results.some(
        (stageResult) => stageResult.stage_id === 'repair_image_pages' && stageResult.status === 'skipped',
      ),
      true,
    );
    assert.deepEqual(result.progress_projection.remaining_stages, []);
  });
});

test('managed execution stops at explicit stop_after_stage instead of auto-running to terminal', async () => {
  await withMockCodexRuntime(async () => {
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
    assert.equal(result.managed_run.execution_result.execution_kind, 'managed_dag_layer_execution');
    assert.equal(result.managed_run.execution_result.ok, true);
    assert.equal(result.managed_run.execution_result.stopped_layer_index, 1);
    assert.equal(result.managed_run.execution_result.layer_results.length, 2);
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
