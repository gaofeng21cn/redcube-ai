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
  runtimeWatch,
  runDeliverableRoute,
  startMockCodexCli,
  withEnv,
  completeSourceReadiness,
  MODULE_DIR,
  withMockCodexRuntime,
} from './shared.js';
import { runDeliverableRoute as runRawRuntimeDeliverableRoute } from '@redcube/runtime';
import { invokeDomainEntry } from '../product-domain-action-test-api.js';
import { buildOplRouteAttemptIndexForTest } from '../helpers/route-attempt-test-api.ts';

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

test('runDeliverableRoute advances with transport quality debt when OPL stage attempt packet is missing', async () => {
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

    assert.equal(result.ok, true);
    assert.notEqual(result.surface_kind, 'typed_blocker');
    assert.equal(result.run.status, 'completed_with_quality_debt');
    assert.equal(result.run.cross_provider_attempt_index.status, 'missing_quality_debt');
    assert.equal(result.run.cross_provider_attempt_index.blocks_stage_transition, false);
    assert.equal(result.run.cross_provider_attempt_index.next_stage_may_start, true);
    assert.equal(result.run.cross_provider_attempt_index.route_selection_owner, 'codex_cli');
    assert.equal(result.run.cross_provider_attempt_index.can_claim_current_without_provider_ledger, false);
    assert.equal(existsSync(path.join(workspaceRoot, 'runtime', 'runs')), false);
    assert.equal(existsSync(path.join(workspaceRoot, 'runtime', 'events')), false);
  });
});

test('runDeliverableRoute records transport quality debt when OPL attempt metadata is incomplete', async () => {
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

    assert.equal(result.ok, true);
    assert.notEqual(result.surface_kind, 'typed_blocker');
    assert.equal(result.run.status, 'completed_with_quality_debt');
    assert.deepEqual(result.run.cross_provider_attempt_index.missing_refs, [
      'attempt_role',
      'no_context_inheritance',
      'provider_attempt_owner',
      'quality_round_index',
    ]);
    assert.equal(result.run.cross_provider_attempt_index.blocks_stage_transition, false);
    assert.equal(result.run.cross_provider_attempt_index.next_stage_may_start, true);
    assert.equal(result.run.cross_provider_attempt_index.can_claim_current_without_provider_ledger, false);
    assert.equal(existsSync(path.join(workspaceRoot, 'runtime', 'runs')), false);
  });
});

test('runDeliverableRoute hard-stops only explicit OPL attempt owner or identity mismatch', async () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-runtime-quality-attempt-identity-'));
  await createDeliverable({
    workspaceRoot,
    overlay: 'ppt_deck',
    profileId: 'lecture_student',
    topicId: 'topic-a',
    deliverableId: 'deck-a',
    title: 'Quality Attempt identity deck',
    goal: '验证 RCA 只在明确 owner/identity 冲突时硬停止。',
  });
  const mismatchedAttemptIndex = {
    ...buildOplRouteAttemptIndexForTest({ route: 'storyline' }),
    owner: 'redcube_ai',
    provider_attempt_owner: 'redcube_ai',
  };
  const result = await runRawRuntimeDeliverableRoute({
    workspaceRoot,
    overlay: 'ppt_deck',
    topicId: 'topic-a',
    deliverableId: 'deck-a',
    route: 'storyline',
    crossProviderAttemptIndex: mismatchedAttemptIndex,
  });
  assert.equal(result.ok, false);
  assert.equal(result.surface_kind, 'typed_blocker');
  assert.equal(result.typed_blocker.blocker_kind, 'stale_or_mismatched_stage_identity');
  assert.deepEqual(result.typed_blocker.identity_mismatch_reasons, ['provider_attempt_owner_mismatch']);
  assert.equal(result.error.recommended_action, 'resubmit_with_current_opl_attempt_identity');

  const domainEntryResult = await invokeDomainEntry({
    target_domain_id: 'redcube_ai',
    task_intent: 'run_deliverable_route',
    entry_mode: 'direct',
    workspace_locator: { workspace_root: workspaceRoot },
    runtime_session_contract: {
      runtime_owner: 'configured_family_runtime_provider',
      adapter_surface: 'opl_codex_executor',
      session_mode: 'ephemeral_run',
    },
    return_surface_contract: { surface_kind: 'route_run' },
    domain_payload: {
      deliverable_family: 'ppt_deck',
      topic_id: 'topic-a',
      deliverable_id: 'deck-a',
      route: 'storyline',
      cross_provider_attempt_index: mismatchedAttemptIndex,
    },
  });
  assert.equal(domainEntryResult.ok, false);
  assert.equal(domainEntryResult.recommended_action, 'resubmit_with_current_opl_attempt_identity');
  assert.equal(domainEntryResult.result_surface.surface_kind, 'typed_blocker');
  assert.equal(domainEntryResult.result_surface.recommended_action, 'resubmit_with_current_opl_attempt_identity');
});

test('runDeliverableRoute leaves role, round, route choice, and context-shape judgment to OPL/Codex', async () => {
  await withMockCodexRuntime(async () => {
    const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-runtime-quality-attempt-passive-'));
    await createDeliverable({
      workspaceRoot,
      overlay: 'ppt_deck',
      profileId: 'lecture_student',
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      title: 'Quality Attempt passive metadata deck',
      goal: '验证 RCA route handler 不再充当第二套 Attempt 控制面。',
    });

    const cases = [
      {
        name: 'producer may invoke a QA helper route for in-thread refinement',
        route: 'visual_director_review',
        index: buildOplRouteAttemptIndexForTest({ route: 'visual_director_review', attemptRole: 'producer', qualityRoundIndex: 0 }),
        transportDebt: false,
      },
      {
        name: 'reviewer route choice is not inferred from the route name',
        route: 'storyline',
        index: buildOplRouteAttemptIndexForTest({ route: 'storyline', attemptRole: 'reviewer', qualityRoundIndex: 0 }),
        transportDebt: false,
      },
      {
        name: 'round validity belongs to the OPL StageRun controller',
        route: 'storyline',
        index: buildOplRouteAttemptIndexForTest({ route: 'storyline', attemptRole: 'repairer', qualityRoundIndex: 0 }),
        transportDebt: false,
      },
      {
        name: 'producer round metadata is transported without RCA rejection',
        route: 'storyline',
        index: buildOplRouteAttemptIndexForTest({ route: 'storyline', attemptRole: 'producer', qualityRoundIndex: 1 }),
        transportDebt: false,
      },
      {
        name: 'missing fresh-context evidence becomes quality debt',
        route: 'storyline',
        index: {
          ...buildOplRouteAttemptIndexForTest({ route: 'storyline', attemptRole: 'producer' }),
          no_context_inheritance: false,
        },
        transportDebt: true,
      },
    ];

    for (const testCase of cases) {
      const result = await runRawRuntimeDeliverableRoute({
        workspaceRoot,
        overlay: 'ppt_deck',
        topicId: 'topic-a',
        deliverableId: 'deck-a',
        route: testCase.route,
        crossProviderAttemptIndex: testCase.index,
      });
      assert.equal(result.ok, true, testCase.name);
      assert.notEqual(result.surface_kind, 'typed_blocker', testCase.name);
      assert.equal(result.run.cross_provider_attempt_index.rca_role_round_or_context_gate_applied, false, testCase.name);
      assert.equal(
        result.run.cross_provider_attempt_index.status,
        testCase.transportDebt ? 'missing_quality_debt' : 'current',
        testCase.name,
      );
      if (testCase.transportDebt) {
        assert.equal(result.run.status, 'completed_with_quality_debt', testCase.name);
        assert.equal(result.run.cross_provider_attempt_index.next_stage_may_start, true, testCase.name);
      }
    }
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
