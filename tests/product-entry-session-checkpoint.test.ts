// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import {
  getProductEntrySession,
  invokeProductEntry,
} from './product-domain-action-test-api.ts';
import { completeSourceReadiness } from './helpers/complete-source-readiness.ts';
import {
  startMockCodexCli,
  withEnv,
} from './mock-codex-cli.ts';

const SERIAL_ENV_TEST = { concurrency: false };
const MOCK_REDCUBE_PYTHON_COMMAND = JSON.stringify([
  process.execPath,
  '--experimental-strip-types',
  fileURLToPath(new URL('./helpers/mock-redcube-python-with-playwright.ts', import.meta.url)),
]);

function readJson(file) {
  return JSON.parse(readFileSync(file, 'utf-8'));
}

function writeJson(file, value) {
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, 'utf-8');
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

    const first = await invokeProductEntry({
      workspace_locator: {
        workspace_root: workspaceRoot,
      },
      entry_session_contract: {
        entry_session_id: 'session-stale-checkpoint',
      },
      delivery_request: {
        deliverable_family: 'ppt_deck',
        topic_id: 'topic-a',
        deliverable_id: 'deck-stale-checkpoint',
        profile_id: 'lecture_student',
        title: 'Product entry stale checkpoint proof',
        goal: '验证 product session 能吸收最新 OPL stage execution plan checkpoint',
        user_intent: '先做到故事主线',
        stop_after_stage: 'storyline',
      },
    });

    const continued = await invokeProductEntry({
      workspace_locator: {
        workspace_root: workspaceRoot,
      },
      entry_session_contract: {
        entry_session_id: 'session-stale-checkpoint',
      },
      delivery_request: {
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

    assert.equal(
      session.continuation_snapshot.latest_stage_execution_plan_ref,
      continued.continuation_snapshot.latest_stage_execution_plan_ref,
    );
    assert.equal(
      session.session_continuity.restore_point.latest_stage_execution_plan_ref,
      continued.continuation_snapshot.latest_stage_execution_plan_ref,
    );
    assert.equal(
      readJson(sessionFile).latest_stage_execution_plan_ref,
      continued.continuation_snapshot.latest_stage_execution_plan_ref,
    );
    assert.equal(session.runtime_loop_closure.resume_point.checkpoint_locator_field, 'continuation_snapshot.latest_stage_execution_plan_ref');
  });
});

test('getProductEntrySession resolves latest deliverable attempt first and blocks continuation on unconsumed closeout', SERIAL_ENV_TEST, async () => {
  await withMockCodexRuntimeState(async () => {
    const workspaceRoot = await prepareProductEntryWorkspace();

    const first = await invokeProductEntry({
      workspace_locator: {
        workspace_root: workspaceRoot,
      },
      entry_session_contract: {
        entry_session_id: 'session-closeout-first',
      },
      delivery_request: {
        deliverable_family: 'ppt_deck',
        topic_id: 'topic-a',
        deliverable_id: 'deck-closeout-first',
        profile_id: 'lecture_student',
        title: 'Product entry closeout-first proof',
        goal: '验证 continuation 先消费同 deliverable 最新 closeout',
        user_intent: '先做到故事主线',
        stop_after_stage: 'storyline',
      },
    });

    const runId = 'run-closeout-first-latest';
    const closeoutRef = 'rca-closeout:deck-closeout-first/visual-director-block';
    const routeRunFile = path.join(workspaceRoot, 'runtime', 'runs', `${runId}.json`);
    const firstSessionRecord = readJson(first.entry_session.session_file);
    const firstSessionUpdatedAt = Date.parse(firstSessionRecord.updated_at);
    assert.equal(Number.isFinite(firstSessionUpdatedAt), true);
    const routeStartedAt = new Date(firstSessionUpdatedAt + 1000).toISOString();
    const routeFinishedAt = new Date(firstSessionUpdatedAt + 2000).toISOString();
    writeJson(routeRunFile, {
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

    assert.equal(session.continuation_snapshot.latest_run_id, runId);
    assert.equal(session.continuation_snapshot.latest_stage_execution_plan_ref, null);
    assert.equal(session.continuation_snapshot.closeout_first_blocker.surface_kind, 'typed_blocker');
    assert.equal(session.continuation_snapshot.closeout_first_blocker.blocker_kind, 'route_closeout_unconsumed');
    assert.equal(session.continuation_snapshot.closeout_first_blocker.blocker_ref, `rca-typed-blocker:route-closeout-unconsumed:${closeoutRef}`);
    assert.deepEqual(session.progress_projection.deliverable_progress_delta, {
      count: 0,
      refs: [],
      domain_alias: 'visual_deliverable_delta',
    });
    assert.deepEqual(session.progress_projection.platform_repair_delta, {
      count: 1,
      refs: ['route_closeout_unconsumed'],
      domain_alias: 'platform_interface_repair_delta',
    });
    assert.equal(session.progress_projection.progress_delta_classification, 'platform_repair');
    assert.equal(session.runtime_loop_closure.control_policy.approval_required, true);
    assert.equal(session.runtime_loop_closure.control_policy.recommended_action, 'consume_route_closeout');
    assert.deepEqual(session.runtime_loop_closure.stall_lineage.repeat_budget, {
      max_repeats: 2,
      remaining_repeats: 0,
      budget_exhausted: true,
    });

    const blockedContinuation = await invokeProductEntry({
      workspace_locator: {
        workspace_root: workspaceRoot,
      },
      entry_session_contract: {
        entry_session_id: 'session-closeout-first',
      },
      delivery_request: {
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

test('getProductEntrySession preserves a newer route-run checkpoint over stale legacy checkpoint projection', SERIAL_ENV_TEST, async () => {
  await withMockCodexRuntimeState(async () => {
    const workspaceRoot = await prepareProductEntryWorkspace();

    await invokeProductEntry({
      workspace_locator: {
        workspace_root: workspaceRoot,
      },
      entry_session_contract: {
        entry_session_id: 'session-route-checkpoint',
      },
      delivery_request: {
        deliverable_family: 'ppt_deck',
        topic_id: 'topic-a',
        deliverable_id: 'deck-route-checkpoint',
        profile_id: 'lecture_student',
        title: 'Product entry route checkpoint proof',
        goal: '验证 route-run checkpoint 不被旧 checkpoint projection 覆盖',
        user_intent: '先做到故事主线',
        stop_after_stage: 'storyline',
      },
    });

    const routeRun = await invokeProductEntry({
      workspace_locator: {
        workspace_root: workspaceRoot,
      },
      entry_session_contract: {
        entry_session_id: 'session-route-checkpoint',
      },
      delivery_request: {
        route: 'storyline',
        user_intent: '直接重跑故事主线',
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

    assert.equal(
      session.continuation_snapshot.latest_run_id,
      routeRun.continuation_snapshot.latest_run_id,
    );
    assert.equal('latest_stage_execution_plan_ref' in session.continuation_snapshot, true);
    assert.equal(
      session.session_continuity.restore_point.latest_handle,
      routeRun.continuation_snapshot.latest_run_id,
    );
    assert.equal(readJson(sessionFile).latest_surface_kind, 'route_run');
  });
});
