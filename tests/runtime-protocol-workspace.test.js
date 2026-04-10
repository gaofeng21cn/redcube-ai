import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';

import {
  createManagedRunRecord,
  createRunRecord,
  getNotePaths,
  getTopicPaths,
  resolveWorkspaceContract,
} from '@redcube/runtime-protocol';

test('resolveWorkspaceContract returns canonical workspace metadata paths', () => {
  const workspaceRoot = path.join('/tmp', 'redcube-workspace');
  const contract = resolveWorkspaceContract({ workspaceRoot });

  assert.equal(contract.workspaceRoot, workspaceRoot);
  assert.equal(contract.workspaceFile, path.join(workspaceRoot, 'redcube.workspace.json'));
  assert.equal(contract.topicsDir, path.join(workspaceRoot, 'topics'));
  assert.equal(contract.runtimeDir, path.join(workspaceRoot, 'runtime'));
  assert.equal(contract.publishDir, path.join(workspaceRoot, 'publish'));
});

test('topic and note paths are derived from the canonical workspace root', () => {
  const workspaceRoot = path.join('/tmp', 'redcube-workspace');
  const topicPaths = getTopicPaths(workspaceRoot, 'topic-a');
  const notePaths = getNotePaths(workspaceRoot, 'topic-a', 'note-01');

  assert.equal(topicPaths.topicDir, path.join(workspaceRoot, 'topics', 'topic-a'));
  assert.equal(topicPaths.canonicalDir, path.join(workspaceRoot, 'topics', 'topic-a', 'canonical'));
  assert.equal(notePaths.noteDir, path.join(workspaceRoot, 'topics', 'topic-a', 'notes', 'note-01'));
  assert.equal(notePaths.artifactsDir, path.join(notePaths.noteDir, 'artifacts'));
  assert.equal(notePaths.reportsDir, path.join(notePaths.noteDir, 'reports'));
});

test('createRunRecord creates a stable minimal run envelope', () => {
  const run = createRunRecord({
    runId: 'run-001',
    route: 'topic.storyline',
    scope: 'topic',
    target: 'topic-a',
    overlay: 'xiaohongshu',
  });

  assert.deepEqual(run, {
    run_id: 'run-001',
    managed_run_id: null,
    route: 'topic.storyline',
    scope: 'topic',
    target: 'topic-a',
    overlay: 'xiaohongshu',
    status: 'running',
    started_at: null,
    finished_at: null,
    current_stage: null,
    stage_results: [],
    artifact_refs: [],
    telemetry: {
      run_id: 'run-001',
      route: 'topic.storyline',
      overlay: 'xiaohongshu',
      scope: 'topic',
      target: 'topic-a',
      executor_kind: null,
      execution_surface: null,
      status: 'running',
      started_at: null,
      finished_at: null,
      latency_ms: null,
      prompt_tokens: null,
      completion_tokens: null,
      estimated_cost: null,
    },
    error_kind: null,
    rerun_linkage: {
      rerun_count: 0,
      previous_run_id: null,
      source_stage: null,
      blocking_review: null,
      baseline_deliverable_id: null,
    },
    error: null,
  });
});

test('createManagedRunRecord creates a fail-closed managed envelope with typed supervision defaults', () => {
  const managedRun = createManagedRunRecord({
    managedRunId: 'managed-001',
    overlay: 'ppt_deck',
    topicId: 'topic-a',
    deliverableId: 'deck-a',
    userIntent: '给我一个最终 PPT',
  });

  assert.deepEqual(managedRun, {
    managed_run_id: 'managed-001',
    overlay: 'ppt_deck',
    topic_id: 'topic-a',
    deliverable_id: 'deck-a',
    status: 'running',
    mode: 'auto_to_terminal',
    stop_after_stage: null,
    user_intent: {
      request: '给我一个最终 PPT',
    },
    adapter: null,
    requested_adapter: 'host_agent',
    active_adapter: 'host_agent',
    adapter_switches: [],
    started_at: null,
    finished_at: null,
    current_stage: null,
    active_run_id: null,
    worker_running: false,
    runtime_liveness_audit: {
      status: 'none',
      checked_at: null,
      reason_code: 'managed_run_not_started',
    },
    runtime_health_status: 'degraded',
    parking_reason_code: null,
    requires_human_confirmation: false,
    requires_external_secret: false,
    route_runs: [],
    stage_results: [],
    latest_events: [],
    current_blockers: [],
    next_system_action: null,
    needs_user_decision: false,
    final_artifact_refs: [],
  });
});

test('getTopicPaths rejects unsafe topic ids', () => {
  assert.throws(() => getTopicPaths('/tmp/redcube', '../topic-a'), {
    message: /topicId/,
  });
  assert.throws(() => getTopicPaths('/tmp/redcube', 'topic/a'), {
    message: /topicId/,
  });
});

test('getNotePaths rejects unsafe note ids', () => {
  assert.throws(() => getNotePaths('/tmp/redcube', 'topic-a', '../note-01'), {
    message: /noteId/,
  });
  assert.throws(() => getNotePaths('/tmp/redcube', 'topic-a', 'note/01'), {
    message: /noteId/,
  });
});

test('createRunRecord rejects missing identity fields', () => {
  const template = {
    runId: 'run-001',
    route: 'topic.storyline',
    scope: 'topic',
    target: 'topic-a',
    overlay: 'xiaohongshu',
  };

  const required = ['runId', 'route', 'scope', 'target', 'overlay'];
  for (const field of required) {
    const input = { ...template };
    delete input[field];
    assert.throws(() => createRunRecord(input), {
      message: new RegExp(field),
    });
  }
});
