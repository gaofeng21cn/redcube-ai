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
import { runDeliverableRoute as runRawRuntimeDeliverableRoute } from '@redcube/runtime';

test('getRun rejects unsafe run identifiers', async () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-runtime-'));

  await assert.rejects(
    () => getRun({ workspaceRoot, runId: '../run-a' }),
    /runId 不能包含路径分隔符/,
  );
});

test('getRun fails closed to OPL stage attempt/provider ledger refs for local lookup', async () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-runtime-lookup-retired-'));

  await assert.rejects(
    () => getRun({ workspaceRoot, runId: 'run-a' }),
    (error) => {
      assert.match(error.message, /RCA-local route-run lookup is retired/);
      assert.equal(error.surface_kind, 'typed_blocker');
      assert.equal(error.blocker_kind, 'rca_local_route_run_lookup_retired');
      assert.equal(error.typed_blocker.run_id, 'run-a');
      assert.deepEqual(error.typed_blocker.required_refs, [
        'opl_stage_attempt_ref',
        'provider_attempt_ref',
        'provider_attempt_ledger_ref',
      ]);
      assert.equal(error.typed_blocker.owner_boundary.rca_owns_generic_attempt_ledger, false);
      return true;
    },
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

test('runDeliverableRoute returns typed blocker when OPL stage attempt packet is missing', async () => {
  await withMockCodexRuntime(async () => {
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-runtime-opl-owner-boundary-'));

    await createDeliverable({
      workspaceRoot,
      overlay: 'ppt_deck',
      profileId: 'lecture_student',
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      title: 'Route owner boundary deck',
      goal: '验证 RCA route runner 不能默认持有执行 owner',
    });

    const result = await runRawRuntimeDeliverableRoute({
      workspaceRoot,
      overlay: 'ppt_deck',
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      route: 'storyline',
    });

    assert.equal(result.ok, false);
    assert.equal(result.surface_kind, 'typed_blocker');
    assert.equal(result.return_shape, 'typed_blocker');
    assert.equal(result.typed_blocker.blocker_kind, 'missing_opl_stage_attempt');
    assert.equal(result.run.status, 'typed_blocker');
    assert.equal(result.run.route_execution_owner_boundary.default_execution_owner, 'opl_stage_attempt_or_typed_blocker');
    assert.equal(existsSync(path.join(workspaceRoot, 'runtime', 'runs')), false);
    assert.equal(existsSync(path.join(workspaceRoot, 'runtime', 'events')), false);
  });
});

test('runDeliverableRoute rejects provider refs without OPL owner evidence', async () => {
  await withMockCodexRuntime(async () => {
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-runtime-opl-owner-ref-'));

    await createDeliverable({
      workspaceRoot,
      overlay: 'ppt_deck',
      profileId: 'lecture_student',
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      title: 'Route owner boundary deck',
      goal: '验证 provider refs 不能缺少 OPL owner',
    });

    const result = await runRawRuntimeDeliverableRoute({
      workspaceRoot,
      overlay: 'ppt_deck',
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      route: 'storyline',
      crossProviderAttemptIndex: {
        provider_attempt_ref: 'opl-provider-attempt:test/redcube_ai/topic-a/deck-a/storyline',
        provider_attempt_ledger_ref: 'attempt-ledger:opl/test/redcube_ai/storyline',
        stage_attempt_ref: 'opl-stage-attempt:test/redcube_ai/topic-a/deck-a/storyline',
      },
    });

    assert.equal(result.ok, false);
    assert.equal(result.surface_kind, 'typed_blocker');
    assert.equal(result.typed_blocker.blocker_kind, 'missing_opl_stage_attempt');
    assert.deepEqual(result.typed_blocker.missing_refs, ['provider_attempt_owner']);
    assert.equal(existsSync(path.join(workspaceRoot, 'runtime', 'runs')), false);
  });
});

test('runDeliverableRoute rejects retired external_llm adapter before creating durable run state', async () => {
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

    await assert.rejects(
      () => runDeliverableRoute({
        workspaceRoot,
        overlay: 'ppt_deck',
        topicId: 'topic-a',
        deliverableId: 'deck-a',
        route: 'detailed_outline',
        adapter: 'external_llm',
      }),
      /Unsupported executor adapter: external_llm/,
    );

    assert.equal(existsSync(path.join(workspaceRoot, 'runtime', 'runs')), false);
    assert.equal(existsSync(path.join(workspaceRoot, 'runtime', 'events')), false);
  });
});

test('runDeliverableRoute rejects retired hermes adapter alias before creating durable run state', async () => {
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

    await assert.rejects(
      () => runDeliverableRoute({
        workspaceRoot,
        overlay: 'ppt_deck',
        topicId: 'topic-a',
        deliverableId: 'deck-a',
        route: 'detailed_outline',
        adapter: 'hermes',
      }),
      /Unsupported executor adapter: hermes/,
    );

    assert.equal(existsSync(path.join(workspaceRoot, 'runtime', 'runs')), false);
    assert.equal(existsSync(path.join(workspaceRoot, 'runtime', 'events')), false);
  });
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
