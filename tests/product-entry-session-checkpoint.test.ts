// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { mkdtempSync, readFileSync } from 'node:fs';
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

test('getProductEntrySession projects the OPL stage execution plan checkpoint without a repo-local managed run', SERIAL_ENV_TEST, async () => {
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
        goal: '验证 product session 能吸收 workspace latest managed run',
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
    assert.equal(continued.continuation_snapshot.latest_managed_run_id, null);
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
    assert.equal(routeRun.continuation_snapshot.latest_managed_run_id, null);
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
    assert.equal(session.continuation_snapshot.latest_managed_run_id, null);
    assert.equal(
      session.session_continuity.restore_point.latest_handle,
      routeRun.continuation_snapshot.latest_run_id,
    );
    assert.equal(readJson(sessionFile).latest_surface_kind, 'route_run');
  });
});
