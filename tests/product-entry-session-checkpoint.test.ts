// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { existsSync, mkdtempSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import {
  getProductEntrySession,
  invokeProductEntry,
} from './product-domain-action-test-api.ts';
import { buildOplRouteAttemptIndexForTest } from './helpers/route-attempt-test-api.ts';
import { completeSourceReadiness } from './helpers/complete-source-readiness.ts';
import {
  startMockCodexCli,
  withEnv,
} from './mock-codex-cli.ts';
import { readJson, writeJson } from './helpers/json-io.ts';

const SERIAL_ENV_TEST = { concurrency: false };
const MOCK_REDCUBE_PYTHON_COMMAND = JSON.stringify([
  process.execPath,
  '--experimental-strip-types',
  fileURLToPath(new URL('./helpers/mock-redcube-python-with-playwright.ts', import.meta.url)),
]);

function readSessionUpdatedAt(first) {
  const updatedAt = Date.parse(readJson(first.entry_session.session_file).updated_at);
  assert.equal(Number.isFinite(updatedAt), true);
  return updatedAt;
}

function writeRouteRun(workspaceRoot, routeRun) {
  const routeRunFile = path.join(workspaceRoot, 'runtime', 'runs', `${routeRun.run_id}.json`);
  writeJson(routeRunFile, routeRun);
  return routeRunFile;
}

function invokeSessionProductEntry({ workspaceRoot, entrySessionId, deliveryRequest }) {
  return invokeProductEntry({
    workspace_locator: {
      workspace_root: workspaceRoot,
    },
    entry_session_contract: {
      entry_session_id: entrySessionId,
    },
    delivery_request: deliveryRequest,
  });
}

function startProductEntry({
  workspaceRoot,
  entrySessionId,
  deliverableId,
  title,
  goal,
}) {
  return invokeSessionProductEntry({
    workspaceRoot,
    entrySessionId,
    deliveryRequest: {
      deliverable_family: 'ppt_deck',
      topic_id: 'topic-a',
      deliverable_id: deliverableId,
      profile_id: 'lecture_student',
      title,
      goal,
      user_intent: '先做到故事主线',
      stop_after_stage: 'storyline',
    },
  });
}

function assertRefsOnlySession(session, entrySessionId) {
  assert.equal(session.ok, true);
  assert.equal(session.surface_kind, 'product_entry_session');
  assert.equal(session.projection_kind, 'rca_product_entry_session_domain_snapshot_refs');
  assert.equal(session.entry_session_ref.entry_session_id, entrySessionId);
  assert.equal(
    session.entry_session_ref.domain_snapshot_ref,
    `domain-snapshot:rca/product-entry-session/${entrySessionId}`,
  );
  assert.equal(session.operator_navigation_refs.generated_session_surface_ref, 'opl_generated:product_session');
  assert.equal(session.authority_boundary.refs_only, true);
  assert.equal(session.authority_boundary.rca_owns_generic_session_shell, false);
  assert.equal(session.authority_boundary.rca_owns_generic_workbench, false);
  for (const genericField of [
    'entry_session',
    'delivery_identity',
    'continuation_snapshot',
    'session_continuity',
    'progress_projection',
    'artifact_inventory',
    'workspace_receipt_inventory_projection',
    'native_proof_artifact_inventory',
    'ppt_deck_visual_route_session',
    'runtime_loop_closure',
    'review_state',
    'publication_projection',
    'opl_family_lifecycle_adapter',
    'family_orchestration',
  ]) {
    assert.equal(genericField in session, false, genericField);
  }
}

function buildProviderCurrentnessRun({
  first,
  runId,
  deliverableId,
  providerAttemptRef = undefined,
  providerAttemptLedgerRef = undefined,
  localSessionRef = undefined,
}) {
  const firstSessionUpdatedAt = readSessionUpdatedAt(first);
  const crossProviderAttemptIndex = {
    surface_kind: 'cross_provider_attempt_index',
    local_session_ref: localSessionRef ?? `product-entry-session:${first.entry_session.entry_session_id}`,
    local_route_run_ref: `route-run:${runId}`,
    provider_attempt_owner: 'one-person-lab',
  };
  if (providerAttemptRef !== undefined) {
    crossProviderAttemptIndex.provider_attempt_ref = providerAttemptRef;
  }
  if (providerAttemptLedgerRef !== undefined) {
    crossProviderAttemptIndex.provider_attempt_ledger_ref = providerAttemptLedgerRef;
  }
  return {
    run_id: runId,
    route: 'storyline',
    scope: 'deliverable',
    target: deliverableId,
    overlay: 'ppt_deck',
    topic_id: 'topic-a',
    deliverable_id: deliverableId,
    status: 'completed',
    started_at: new Date(firstSessionUpdatedAt + 1000).toISOString(),
    finished_at: new Date(firstSessionUpdatedAt + 2000).toISOString(),
    current_stage: 'storyline',
    stage_results: [{ stage: 'storyline', status: 'completed' }],
    artifact_refs: [`artifact:${runId}`],
    closeout: {
      closeout_ref: `rca-closeout:${deliverableId}/storyline`,
      consumed: true,
      owner: 'redcube_ai',
      route: 'storyline',
    },
    cross_provider_attempt_index: crossProviderAttemptIndex,
    progress_delta: {
      deliverable_progress_delta: {
        count: 1,
        refs: [`artifact:${runId}`],
        domain_alias: 'visual_deliverable_delta',
      },
      platform_repair_delta: {
        count: 0,
        refs: [],
        domain_alias: 'platform_interface_repair_delta',
      },
      progress_delta_classification: 'deliverable_progress',
    },
  };
}

async function withMockCodexRuntimeState(testFn) {
  const upstream = await startMockCodexCli();
  const runtimeStateRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-product-entry-state-'));
  const restoreEnv = withEnv({
    REDCUBE_CODEX_COMMAND: upstream.command,
    REDCUBE_PYTHON_COMMAND: MOCK_REDCUBE_PYTHON_COMMAND,
    REDCUBE_RUNTIME_STATE_ROOT: runtimeStateRoot,
  });
  try {
    return await testFn();
  } finally {
    restoreEnv();
    await upstream.close();
  }
}

async function prepareProductEntryWorkspace() {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-product-entry-'));

  await completeSourceReadiness({
    workspaceRoot,
    topicId: 'topic-a',
    title: 'Product entry checkpoint proof',
    brief: '验证 product-entry session checkpoint 与 workspace latest supervision 的一致性。',
    keywords: ['product-entry', 'checkpoint'],
  });

  return workspaceRoot;
}

test('getProductEntrySession projects the OPL stage execution plan checkpoint without a repo-local stage runner', SERIAL_ENV_TEST, async () => {
  await withMockCodexRuntimeState(async () => {
    const workspaceRoot = await prepareProductEntryWorkspace();

    const first = await startProductEntry({
      workspaceRoot,
      entrySessionId: 'session-stale-checkpoint',
      deliverableId: 'deck-stale-checkpoint',
      title: 'Product entry stale checkpoint proof',
      goal: '验证 product session 能吸收最新 OPL stage execution plan checkpoint',
    });

    const continued = await invokeSessionProductEntry({
      workspaceRoot,
      entrySessionId: 'session-stale-checkpoint',
      deliveryRequest: {
        user_intent: '继续推进',
        stop_after_stage: 'detailed_outline',
      },
    });

    const sessionFile = continued.entry_session.session_file;
    assert.notEqual(
      continued.continuation_snapshot.latest_stage_execution_plan_ref,
      first.continuation_snapshot.latest_stage_execution_plan_ref,
    );
    assert.equal(continued.continuation_snapshot.latest_stage_execution_plan_ref.startsWith('opl-stage-execution-plan:'), true);
    assert.equal(readJson(sessionFile).latest_surface_kind, 'opl_stage_execution_plan');

    const session = await getProductEntrySession({
      entry_session_id: 'session-stale-checkpoint',
    });

    assertRefsOnlySession(session, 'session-stale-checkpoint');
    assert.equal(
      session.currentness_refs.latest_stage_execution_plan_ref,
      continued.continuation_snapshot.latest_stage_execution_plan_ref,
    );
    assert.equal(
      readJson(sessionFile).latest_stage_execution_plan_ref,
      continued.continuation_snapshot.latest_stage_execution_plan_ref,
    );
    assert.equal(session.currentness_refs.latest_visual_run_ref, null);
  });
});

test('getProductEntrySession resolves latest deliverable attempt first and blocks continuation on unconsumed closeout', SERIAL_ENV_TEST, async () => {
  await withMockCodexRuntimeState(async () => {
    const workspaceRoot = await prepareProductEntryWorkspace();

    const first = await startProductEntry({
      workspaceRoot,
      entrySessionId: 'session-closeout-first',
      deliverableId: 'deck-closeout-first',
      title: 'Product entry closeout-first proof',
      goal: '验证 continuation 先消费同 deliverable 最新 closeout',
    });

    const runId = 'run-closeout-first-latest';
    const closeoutRef = 'rca-closeout:deck-closeout-first/visual-director-block';
    const firstSessionUpdatedAt = readSessionUpdatedAt(first);
    const routeStartedAt = new Date(firstSessionUpdatedAt + 1000).toISOString();
    const routeFinishedAt = new Date(firstSessionUpdatedAt + 2000).toISOString();
    const routeRunFile = writeRouteRun(workspaceRoot, {
      run_id: runId,
      route: 'visual_director_review',
      scope: 'deliverable',
      target: 'deck-closeout-first',
      overlay: 'ppt_deck',
      topic_id: 'topic-a',
      deliverable_id: 'deck-closeout-first',
      status: 'quality_blocked',
      started_at: routeStartedAt,
      finished_at: routeFinishedAt,
      current_stage: 'visual_director_review',
      stage_results: [{ stage: 'visual_director_review', status: 'quality_blocked' }],
      artifact_refs: [],
      telemetry: null,
      error_kind: 'quality_blocked',
      rerun_linkage: {
        rerun_count: 1,
        previous_run_id: first.continuation_snapshot.latest_run_id,
        source_stage: 'visual_director_review',
        blocking_review: 'screenshot_review',
        baseline_deliverable_id: null,
      },
      error: {
        code: 'quality_blocked',
        message: 'visual director closeout is not consumed',
        failure_kind: 'quality_blocked',
        target_slide_ids: ['S01'],
        blocking_reasons: ['layout_density'],
        recommended_action: 'consume_closeout_before_continuation',
        artifact_file: '',
        artifact_refs: [],
      },
      closeout: {
        closeout_ref: closeoutRef,
        consumed: false,
        owner: 'redcube_ai',
        route: 'visual_director_review',
        blocker_kind: 'route_closeout_unconsumed',
        next_required_owner_action: 'consume_route_closeout_before_new_plan',
      },
      progress_delta: {
        deliverable_progress_delta: { count: 0, refs: [], domain_alias: 'visual_deliverable_delta' },
        platform_repair_delta: {
          count: 1,
          refs: ['route_closeout_unconsumed'],
          domain_alias: 'platform_interface_repair_delta',
        },
        progress_delta_classification: 'platform_repair',
      },
      stall_lineage: {
        lineage_id: 'stall-lineage-closeout-first',
        repeated_block_count: 2,
        repeat_budget: {
          max_repeats: 2,
          remaining_repeats: 0,
          budget_exhausted: true,
        },
      },
    });

    const session = await getProductEntrySession({
      entry_session_id: 'session-closeout-first',
    });

    const typedBlockerRef = `rca-typed-blocker:route-closeout-unconsumed:${closeoutRef}`;
    assertRefsOnlySession(session, 'session-closeout-first');
    assert.equal(session.currentness_refs.latest_visual_run_ref, `route-run:${runId}`);
    assert.equal(session.currentness_refs.latest_stage_execution_plan_ref, null);
    assert.equal(session.currentness_refs.latest_surface_kind, 'typed_blocker');
    assert.equal(session.currentness_refs.typed_blocker_ref, typedBlockerRef);
    assert.deepEqual(session.currentness_refs.next_forced_delta_refs, [
      typedBlockerRef,
      closeoutRef,
      `route-run:${runId}`,
    ]);

    const blockedContinuation = await invokeSessionProductEntry({
      workspaceRoot,
      entrySessionId: 'session-closeout-first',
      deliveryRequest: {
        user_intent: '继续推进到最终 PPT',
        stop_after_stage: 'visual_direction',
      },
    });

    assert.equal(blockedContinuation.ok, false);
    assert.equal(blockedContinuation.surface_kind, 'product_entry');
    assert.equal(blockedContinuation.domain_entry_surface.result_surface.surface_kind, 'typed_blocker');
    assert.equal(blockedContinuation.domain_entry_surface.result_surface.blocker_kind, 'route_closeout_unconsumed');
    assert.equal(blockedContinuation.summary.actual_surface_kind, 'typed_blocker');
    assert.equal(blockedContinuation.summary.target_handle, runId);
    assert.equal(blockedContinuation.continuation_snapshot.latest_run_id, runId);
    assert.equal(blockedContinuation.progress_projection.progress_delta_classification, 'platform_repair');

    const sessionRecord = readJson(first.entry_session.session_file);
    assert.equal(sessionRecord.latest_run_id, runId);
    assert.equal(sessionRecord.latest_surface_kind, 'typed_blocker');
    assert.equal(existsSync(routeRunFile), true);
  });
});

test('getProductEntrySession fails closed when a newer route run lacks OPL provider attempt ledger evidence', SERIAL_ENV_TEST, async () => {
  await withMockCodexRuntimeState(async () => {
    const workspaceRoot = await prepareProductEntryWorkspace();

    const first = await startProductEntry({
      workspaceRoot,
      entrySessionId: 'session-provider-currentness',
      deliverableId: 'deck-provider-currentness',
      title: 'Product entry provider currentness proof',
      goal: '验证 currentness 必须区分本地 session ref 与 OPL provider attempt ledger ref',
    });

    const runId = 'run-provider-currentness-local-only';
    const firstSessionUpdatedAt = readSessionUpdatedAt(first);
    writeRouteRun(workspaceRoot, {
      run_id: runId,
      route: 'storyline',
      scope: 'deliverable',
      target: 'deck-provider-currentness',
      overlay: 'ppt_deck',
      topic_id: 'topic-a',
      deliverable_id: 'deck-provider-currentness',
      status: 'completed',
      started_at: new Date(firstSessionUpdatedAt + 1000).toISOString(),
      finished_at: new Date(firstSessionUpdatedAt + 2000).toISOString(),
      current_stage: 'storyline',
      stage_results: [{ stage: 'storyline', status: 'completed' }],
      artifact_refs: ['artifact:local-only-storyline'],
      closeout: {
        closeout_ref: 'rca-closeout:deck-provider-currentness/storyline',
        consumed: true,
        owner: 'redcube_ai',
        route: 'storyline',
      },
      progress_delta: {
        deliverable_progress_delta: {
          count: 1,
          refs: ['artifact:local-only-storyline'],
          domain_alias: 'visual_deliverable_delta',
        },
        platform_repair_delta: {
          count: 0,
          refs: [],
          domain_alias: 'platform_interface_repair_delta',
        },
        progress_delta_classification: 'deliverable_progress',
      },
    });

    const session = await getProductEntrySession({
      entry_session_id: 'session-provider-currentness',
    });

    const typedBlockerRef = `rca-typed-blocker:missing-provider-attempt-ledger:route-run:${runId}`;
    assertRefsOnlySession(session, 'session-provider-currentness');
    assert.equal(session.currentness_refs.latest_visual_run_ref, `route-run:${runId}`);
    assert.equal(session.currentness_refs.latest_surface_kind, 'typed_blocker');
    assert.equal(session.currentness_refs.provider_attempt_ref, null);
    assert.equal(session.currentness_refs.provider_attempt_ledger_ref, null);
    assert.equal(session.currentness_refs.typed_blocker_ref, typedBlockerRef);
    assert.equal(
      session.currentness_refs.next_forced_delta_refs.includes(
        'product-entry-session:session-provider-currentness',
      ),
      true,
    );
    assert.equal(session.currentness_refs.next_forced_delta_refs.includes(`route-run:${runId}`), true);
    assert.equal(session.currentness_refs.next_forced_delta_refs.includes(typedBlockerRef), true);
  });
});

test('getProductEntrySession fails closed when provider attempt binding is partial or local-session-masqueraded', SERIAL_ENV_TEST, async () => {
  const cases = [
    {
      entrySessionId: 'session-provider-ref-without-ledger',
      deliverableId: 'deck-provider-ref-without-ledger',
      runId: 'run-provider-ref-without-ledger',
      providerAttemptRef: 'opl-provider-attempt:redcube_ai/storyline/attempt-001',
      providerAttemptLedgerRef: undefined,
    },
    {
      entrySessionId: 'session-ledger-without-provider-ref',
      deliverableId: 'deck-ledger-without-provider-ref',
      runId: 'run-ledger-without-provider-ref',
      providerAttemptRef: undefined,
      providerAttemptLedgerRef: 'attempt-ledger:opl/redcube_ai/storyline',
    },
    {
      entrySessionId: 'session-local-ref-masquerades-provider',
      deliverableId: 'deck-local-ref-masquerades-provider',
      runId: 'run-local-ref-masquerades-provider',
      providerAttemptRef: 'product-entry-session:session-local-ref-masquerades-provider',
      providerAttemptLedgerRef: 'attempt-ledger:opl/redcube_ai/storyline',
    },
  ];

  for (const currentnessCase of cases) {
    await withMockCodexRuntimeState(async () => {
      const workspaceRoot = await prepareProductEntryWorkspace();
      const first = await startProductEntry({
        workspaceRoot,
        entrySessionId: currentnessCase.entrySessionId,
        deliverableId: currentnessCase.deliverableId,
        title: 'Product entry provider binding fail-closed proof',
        goal: '验证 provider attempt 与 ledger binding 不完整时不能 claim current',
      });

      writeRouteRun(workspaceRoot, buildProviderCurrentnessRun({
        first,
        runId: currentnessCase.runId,
        deliverableId: currentnessCase.deliverableId,
        providerAttemptRef: currentnessCase.providerAttemptRef,
        providerAttemptLedgerRef: currentnessCase.providerAttemptLedgerRef,
      }));

      const session = await getProductEntrySession({
        entry_session_id: currentnessCase.entrySessionId,
      });

      const typedBlockerRef = `rca-typed-blocker:missing-provider-attempt-ledger:route-run:${currentnessCase.runId}`;
      const acceptedProviderAttemptRef = currentnessCase.providerAttemptRef?.startsWith('product-entry-session:')
        ? null
        : currentnessCase.providerAttemptRef ?? null;
      assertRefsOnlySession(session, currentnessCase.entrySessionId);
      assert.equal(session.currentness_refs.latest_visual_run_ref, `route-run:${currentnessCase.runId}`);
      assert.equal(session.currentness_refs.latest_surface_kind, 'typed_blocker');
      assert.equal(session.currentness_refs.provider_attempt_ref, acceptedProviderAttemptRef);
      assert.equal(
        session.currentness_refs.provider_attempt_ledger_ref,
        currentnessCase.providerAttemptLedgerRef ?? null,
      );
      assert.equal(session.currentness_refs.typed_blocker_ref, typedBlockerRef);
      assert.equal(session.currentness_refs.next_forced_delta_refs.includes(typedBlockerRef), true);
    });
  }
});

test('getProductEntrySession records provider attempt ledger refs when a newer route run carries cross-provider index evidence', SERIAL_ENV_TEST, async () => {
  await withMockCodexRuntimeState(async () => {
    const workspaceRoot = await prepareProductEntryWorkspace();

    const first = await startProductEntry({
      workspaceRoot,
      entrySessionId: 'session-provider-currentness-ready',
      deliverableId: 'deck-provider-currentness-ready',
      title: 'Product entry provider currentness ready proof',
      goal: '验证 provider attempt ledger evidence 能随 currentness 投影',
    });

    const runId = 'run-provider-currentness-indexed';
    const providerAttemptRef = 'opl-provider-attempt:redcube_ai/storyline/attempt-001';
    const providerAttemptLedgerRef = 'attempt-ledger:opl/redcube_ai/storyline';
    writeRouteRun(workspaceRoot, buildProviderCurrentnessRun({
      first,
      runId,
      deliverableId: 'deck-provider-currentness-ready',
      providerAttemptRef,
      providerAttemptLedgerRef,
    }));

    const session = await getProductEntrySession({
      entry_session_id: 'session-provider-currentness-ready',
    });

    assertRefsOnlySession(session, 'session-provider-currentness-ready');
    assert.equal(session.currentness_refs.latest_visual_run_ref, `route-run:${runId}`);
    assert.equal(session.currentness_refs.latest_surface_kind, 'route_run');
    assert.equal(session.currentness_refs.typed_blocker_ref, null);
    assert.equal(session.currentness_refs.provider_attempt_ref, providerAttemptRef);
    assert.equal(session.currentness_refs.provider_attempt_ledger_ref, providerAttemptLedgerRef);
    assert.deepEqual(session.currentness_refs.next_forced_delta_refs, [`artifact:${runId}`]);
  });
});

test('getProductEntrySession preserves a newer route-run checkpoint over stale legacy checkpoint projection', SERIAL_ENV_TEST, async () => {
  await withMockCodexRuntimeState(async () => {
    const workspaceRoot = await prepareProductEntryWorkspace();

    await startProductEntry({
      workspaceRoot,
      entrySessionId: 'session-route-checkpoint',
      deliverableId: 'deck-route-checkpoint',
      title: 'Product entry route checkpoint proof',
      goal: '验证 route-run checkpoint 不被旧 checkpoint projection 覆盖',
    });

    const routeRun = await invokeSessionProductEntry({
      workspaceRoot,
      entrySessionId: 'session-route-checkpoint',
      deliveryRequest: {
        route: 'storyline',
        user_intent: '直接重跑故事主线',
        cross_provider_attempt_index: buildOplRouteAttemptIndexForTest({
          route: 'storyline',
          runId: 'session-route-checkpoint/storyline',
          topicId: 'topic-a',
          deliverableId: 'deck-route-checkpoint',
        }),
      },
    });

    assert.equal(routeRun.domain_entry_surface.result_surface.surface_kind, 'route_run');
    assert.equal(Boolean(routeRun.continuation_snapshot.latest_run_id), true);
    assert.equal('latest_stage_execution_plan_ref' in routeRun.continuation_snapshot, true);
    assert.equal(
      routeRun.domain_entry_surface.result_surface.artifact.contract.user_intent,
      '直接重跑故事主线',
    );
    assert.equal(
      routeRun.domain_entry_surface.result_surface.artifact.contract.delivery_request.user_intent,
      '直接重跑故事主线',
    );

    const sessionFile = routeRun.entry_session.session_file;
    assert.equal(readJson(sessionFile).latest_surface_kind, 'route_run');

    const session = await getProductEntrySession({
      entry_session_id: 'session-route-checkpoint',
    });

    assertRefsOnlySession(session, 'session-route-checkpoint');
    assert.equal(
      session.currentness_refs.latest_visual_run_ref,
      `route-run:${routeRun.continuation_snapshot.latest_run_id}`,
    );
    assert.equal(session.currentness_refs.latest_stage_execution_plan_ref, null);
    assert.equal(session.currentness_refs.latest_surface_kind, 'route_run');
    assert.equal(readJson(sessionFile).latest_surface_kind, 'route_run');
  });
});
