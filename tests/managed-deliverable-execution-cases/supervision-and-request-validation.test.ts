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
  MOCK_HERMES_NATIVE_BRIDGE_COMMAND,
  MOCK_REDCUBE_PYTHON_COMMAND,
  readJson,
  withoutUpdatedAt,
  runtimeDirEntries,
  assertNoManagedState,
  withMockHermesUpstream,
  withMockHermesNativeProof,
} from './shared.ts';

test('managed supervision marks a stale active route run instead of reporting it as live', async () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-managed-stale-active-run-'));

  await createDeliverable({
    workspaceRoot,
    overlay: 'ppt_deck',
    profileId: 'lecture_student',
    topicId: 'topic-a',
    deliverableId: 'deck-a',
    title: '托管 stale active run',
    goal: '验证 supervisor 不把旧 running route run 当作活跃 worker',
  });

  const activeRun = startRun({
    workspaceRoot,
    route: 'render_html',
    overlay: 'ppt_deck',
    target: 'deck-a',
    topicId: 'topic-a',
    deliverableId: 'deck-a',
    executor: { adapter: 'host_agent', execution_surface: 'codex_native_host_agent' },
  });
  const activeRunFile = path.join(workspaceRoot, 'runtime', 'runs', `${activeRun.run_id}.json`);
  const staleActiveRun = readJson(activeRunFile);
  staleActiveRun.started_at = '2020-01-01T00:00:00.000Z';
  staleActiveRun.telemetry = { ...(staleActiveRun.telemetry || {}), started_at: staleActiveRun.started_at };
  writeFileSync(activeRunFile, JSON.stringify(staleActiveRun, null, 2), 'utf-8');

  const managedRun = createRuntimeManagedRun({
    workspaceRoot,
    overlay: 'ppt_deck',
    topicId: 'topic-a',
    deliverableId: 'deck-a',
    userIntent: '继续完成 PPT',
    adapter: 'host_agent',
  });
  managedRun.status = 'running';
  managedRun.current_stage = 'render_html';
  managedRun.worker_running = true;
  managedRun.active_run_id = activeRun.run_id;
  managedRun.runtime_health_status = 'live';
  managedRun.runtime_bridge = { owner: 'codex_cli', adapter_surface: '@redcube/codex-cli-client' };
  managedRun.runtime_liveness_audit = {
    status: 'live',
    checked_at: new Date().toISOString(),
    reason_code: 'stage_execution_in_progress',
  };
  saveManagedRun({ workspaceRoot, managedRun });

  const supervised = await superviseManagedRun({
    workspaceRoot,
    managedRunId: managedRun.managed_run_id,
  });

  assert.equal(supervised.ok, true);
  assert.equal(supervised.managed_run.worker_running, false);
  assert.equal(supervised.managed_run.active_run_id, null);
  assert.equal(supervised.managed_run.runtime_health_status, 'escalated');
  assert.equal(supervised.managed_run.parking_reason_code, 'active_route_run_stale');
  assert.equal(
    supervised.managed_run.current_blockers.some((blocker) => blocker.includes(`active route run ${activeRun.run_id} marked expired`)),
    true,
  );
  assert.equal(supervised.runtime_supervision.health_status, 'escalated');
  assert.equal(supervised.runtime_supervision.worker_running, false);
  assert.equal(supervised.runtime_supervision.active_run_id, null);

  const persistedActiveRun = readJson(activeRunFile);
  assert.equal(persistedActiveRun.status, 'expired');
  assert.equal(persistedActiveRun.stale_run_audit.status_after, 'expired');
});

test('managed execution fails closed when Codex CLI proof is blocked', async () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-managed-upstream-blocked-'));
  const restoreEnv = withEnv({
    REDCUBE_CODEX_COMMAND: JSON.stringify([process.execPath, '-e', 'process.exit(2)']),
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
