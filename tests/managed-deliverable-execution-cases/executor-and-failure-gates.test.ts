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
  withMockHermesUpstream,
  withMockHermesAgentLoop,
} from './shared.ts';

test('managed execution accepts explicit hermes_agent adapter and keeps it as the active executor', async () => {
  await withMockHermesAgentLoop(async () => {
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-managed-hermes-proof-'));

    await completeSourceReadiness({
      workspaceRoot,
      topicId: 'topic-a',
      title: 'Hermes proof managed route',
      brief: '只需要先验证 storyline 阶段的 Hermes-Agent loop full agent loop。',
      keywords: ['Hermes', 'proof'],
    });

    await createDeliverable({
      workspaceRoot,
      overlay: 'ppt_deck',
      profileId: 'lecture_student',
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      title: 'Hermes proof managed route',
      goal: '验证托管运行可显式走 Hermes-Agent loop adapter',
    });

    const result = await runManagedDeliverable({
      workspaceRoot,
      overlay: 'ppt_deck',
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      userIntent: '先只跑 storyline',
      stopAfterStage: 'storyline',
      adapter: 'hermes_agent',
    });

    assert.equal(result.ok, true);
    assert.equal(result.summary.status, 'stopped_after_stage');
    assert.equal(result.managed_run.requested_adapter, 'hermes_agent');
    assert.equal(result.managed_run.active_adapter, 'hermes_agent');
    assert.equal(result.managed_run.runtime_bridge?.owner, 'hermes_agent');
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
    assert.equal(stored.managed_run.requested_adapter, 'hermes_agent');
    assert.equal(stored.managed_run.active_adapter, 'hermes_agent');
    assert.equal(stored.managed_run.runtime_bridge?.owner, 'hermes_agent');
    assert.equal(stored.runtime_supervision.runtime_owner, 'hermes_agent');
  });
});

test('managed DAG execution fails closed and does not advance dependent stages after route failure', async () => {
  const upstream = await startMockCodexCli();
  const restoreEnv = withEnv({
    REDCUBE_CODEX_COMMAND: upstream.command,
    REDCUBE_PYTHON_COMMAND: MOCK_REDCUBE_PYTHON_COMMAND,
    REDCUBE_MOCK_FAIL_ROUTE: 'detailed_outline',
  });
  try {
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-managed-dag-fail-'));

    await completeSourceReadiness({
      workspaceRoot,
      topicId: 'topic-a',
      title: 'DAG fail-closed 验证',
      brief: '验证 DAG 执行不会越过失败阶段继续跑依赖阶段。',
      keywords: ['DAG', 'fail-closed'],
    });

    await createDeliverable({
      workspaceRoot,
      overlay: 'ppt_deck',
      profileId: 'lecture_student',
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      title: 'DAG fail-closed deck',
      goal: '验证 managed DAG route failure stop semantics',
    });

    const result = await runManagedDeliverable({
      workspaceRoot,
      overlay: 'ppt_deck',
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      userIntent: '给我一个最终 PPT',
    });

    assert.equal(result.ok, false);
    assert.equal(result.managed_run.status, 'escalated');
    assert.equal(result.managed_run.execution_result.execution_kind, 'managed_dag_layer_execution');
    assert.equal(result.managed_run.execution_result.ok, false);
    assert.equal(result.managed_run.execution_result.failed_layer_index, 2);
    assert.equal(
      result.managed_run.execution_result.layer_results.at(-1).task_results[0].task_id,
      'ppt_deck:deck-a:detailed_outline',
    );
    assert.deepEqual(
      result.managed_run.route_runs.map((stageRun) => stageRun.stage_id),
      ['storyline', 'detailed_outline', 'detailed_outline'],
    );
    assert.deepEqual(
      result.managed_run.route_runs
        .filter((stageRun) => stageRun.stage_id === 'detailed_outline')
        .map((stageRun) => stageRun.attempt),
      [1, 2],
    );
    assert.equal(
      result.managed_run.route_runs.some((stageRun) => stageRun.stage_id === 'slide_blueprint'),
      false,
    );
    assert.equal(result.runtime_supervision.health_status, 'escalated');
    assert.equal(result.escalation_record.escalation_status, 'escalated');
    const stored = await getManagedRun({
      workspaceRoot,
      managedRunId: result.managed_run.managed_run_id,
    });
    assert.equal(stored.managed_run.status, 'escalated');
    assert.equal(stored.progress_projection.content_status, 'blocked_by_runtime');
    assert.equal(stored.runtime_supervision.health_status, 'escalated');
    assert.equal(stored.escalation_record.escalation_status, 'escalated');
  } finally {
    restoreEnv();
    await upstream.close();
  }
});

test('managed control plane rejects retired external_llm adapter before creating durable managed state', async () => {
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

    await assert.rejects(
      () => runManagedDeliverable({
        workspaceRoot,
        overlay: 'ppt_deck',
        topicId: 'topic-a',
        deliverableId: 'deck-a',
        userIntent: '给我一个最终 PPT',
        adapter: 'external_llm',
      }),
      /Unsupported executor adapter: external_llm/,
    );

    assertNoManagedState(workspaceRoot);
  });
});
