// @ts-nocheck
import {
  test,
  assert,
  os,
  path,
  existsSync,
  mkdtempSync,
  readFileSync,
  utimesSync,
  writeFileSync,
  createDeliverable,
  getDeliverable,
  getRun,
  runtimeWatch,
  runDeliverableRoute,
  appendEvent,
  startRun,
  startMockCodexCli,
  withEnv,
  completeSourceReadiness,
  MODULE_DIR,
  MOCK_HERMES_AGENT_LOOP_BRIDGE_COMMAND,
  withMockCodexRuntime,
  withMockHermesAgentLoop,
} from './shared.ts';

test('runDeliverableRoute uses Codex-backed executor by default', async () => {
  await withMockCodexRuntime(async () => {
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
    assert.match(result.run.run_id, /^run[-_]/);
    assert.equal(result.run.executor.adapter, 'codex_cli');
    assert.equal(result.run.executor.primary, true);
    assert.equal(result.run.executor.execution_surface, 'codex_cli_runtime');
    assert.equal(result.run.executor.creative_execution, 'agent_first_director_first');
    assert.equal(result.run.executor.execution_model.mainline_adapter, 'codex_cli');
    assert.equal(result.run.executor.execution_model.primary_surface, 'codex_cli_runtime');
    assert.equal(result.run.executor.execution_model.freeze_origin_milestone, 'P19.A');
    assert.equal(result.run.executor.codex_cli_runtime?.owner, 'codex_cli');
    assert.equal(result.run.executor.codex_cli_runtime?.adapter_surface, 'opl_codex_executor');
    assert.equal(result.run.topic_id, 'topic-a');
    assert.equal(result.run.deliverable_id, 'deck-a');
    assert.equal(result.run.status, 'completed');
    assert.equal(result.events.some((event) => event?.type === 'codex_route_started'), true);

    const stored = await getRun({ workspaceRoot, runId: result.run.run_id });
    assert.equal(stored.surface_kind, 'run_record');
    assert.equal(stored.recommended_action, 'review_runtime_state');
    assert.equal(stored.summary.run_id, result.run.run_id);
    assert.equal(stored.run.topic_id, 'topic-a');
    assert.equal(stored.run.deliverable_id, 'deck-a');
    assert.equal(stored.run.executor.adapter, 'codex_cli');
    assert.equal(stored.run.executor.execution_surface, 'codex_cli_runtime');
    assert.equal(stored.run.executor.execution_model.mainline_adapter, 'codex_cli');
    assert.equal(stored.run.executor.execution_model.freeze_origin_milestone, 'P19.A');
    assert.equal(stored.run.executor.codex_cli_runtime?.owner, 'codex_cli');
    assert.equal(stored.run.executor.codex_cli_runtime?.model_selection, 'inherit_local_codex_default');
    assert.equal(stored.run_telemetry.run_id, result.run.run_id);
    assert.equal(stored.run_telemetry.route, 'storyline');
    assert.equal(stored.run_telemetry.executor_kind, 'codex_cli');
    assert.equal(stored.run_telemetry.prompt_pack_file, 'prompts/ppt_deck/storyline.md');
    assert.equal(Number.isInteger(stored.run_telemetry.prompt_bytes), true);
    assert.equal(stored.run_telemetry.prompt_bytes > 0, true);
    assert.equal(Number.isInteger(stored.run_telemetry.context_bytes), true);
    assert.equal(stored.run_telemetry.context_bytes > 0, true);
    assert.deepEqual(stored.run_telemetry.prompt_files, ['prompts/ppt_deck/storyline.md']);
    assert.deepEqual(stored.run_telemetry.slide_scope.target_slide_ids, []);
    assert.equal(stored.run.telemetry.prompt_pack_file, 'prompts/ppt_deck/storyline.md');
    assert.equal(stored.error_taxonomy.error_kind, null);
    assert.equal(stored.rerun_analytics.rerun_count, 0);
    assert.equal(stored.cost_summary.executor_identity, 'codex_cli_runtime');
    assert.equal(stored.quality_drift_summary.relative_quality_verdict, null);
    assert.equal(stored.approval_throughput_summary.pending_review_count, 0);
    const artifact = JSON.parse(readFileSync(result.artifactFile, 'utf-8'));
    assert.equal(artifact.route, 'storyline');
    assert.equal(artifact.contract.profile_id, 'lecture_student');
    assert.equal(artifact.contract.goal, '为本科生讲授甲状腺基础知识');
    assert.equal(artifact.stage_contract.stage_id, 'storyline');
    assert.equal(artifact.execution_model.mainline_adapter, 'codex_cli');
    assert.equal(artifact.execution_model.primary_surface, 'codex_cli_runtime');
    assert.equal(artifact.execution_model.freeze_origin_milestone, 'P19.A');
    assert.equal(artifact.execution_model.codex_cli_runtime?.owner, 'codex_cli');
  });
});

test('runDeliverableRoute executes other declared stages through Codex-backed executor', async () => {
  await withMockCodexRuntime(async () => {
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
    assert.match(result.run.run_id, /^run[-_]/);
    assert.equal(result.run.executor.adapter, 'codex_cli');
    assert.equal(result.run.executor.execution_model.mainline_adapter, 'codex_cli');
    assert.equal(result.run.executor.codex_cli_runtime?.owner, 'codex_cli');
    assert.equal(result.run.current_stage, 'detailed_outline');
    const artifact = JSON.parse(readFileSync(result.artifactFile, 'utf-8'));
    assert.equal(artifact.stage_contract.stage_id, 'detailed_outline');
    assert.equal(artifact.contract.profile_id, 'lecture_peer');
    assert.equal(artifact.execution_model.mainline_adapter, 'codex_cli');
  });
});

test('runDeliverableRoute fails closed for explicit retired hermes_agent adapter without changing the default executor', async () => {
  await withMockCodexRuntime(async () => {
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-runtime-hermes-retired-'));

    await createDeliverable({
      workspaceRoot,
      overlay: 'ppt_deck',
      profileId: 'lecture_student',
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      title: 'Hermes-Agent retired route',
      goal: '验证 RedCube 显式 Hermes-Agent adapter 退役后 fail closed',
    });

    await assert.rejects(
      () => runDeliverableRoute({
        workspaceRoot,
        overlay: 'ppt_deck',
        topicId: 'topic-a',
        deliverableId: 'deck-a',
        route: 'storyline',
        adapter: 'hermes_agent',
      }),
      /RCA-owned Hermes-Agent adapter has been retired/,
    );
  });
});
