// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { mkdtempSync } from 'node:fs';

import {
  buildCodexExecutorDescriptor,
  completeHermesRun,
  failHermesRun,
  startHermesRun,
} from '@redcube/hermes-substrate';

function tempWorkspaceRoot() {
  return mkdtempSync(path.join(os.tmpdir(), 'redcube-hermes-topology-'));
}

test('completeHermesRun keeps Codex runtime topology for Codex-native executor', () => {
  const workspaceRoot = tempWorkspaceRoot();
  const executor = buildCodexExecutorDescriptor();
  const run = startHermesRun({
    workspaceRoot,
    route: 'storyline',
    overlay: 'ppt_deck',
    target: 'deck-a',
    topicId: 'topic-a',
    deliverableId: 'deck-a',
    executor,
  });

  const completed = completeHermesRun({
    workspaceRoot,
    runId: run.run_id,
    currentStage: 'storyline',
    stageResults: [{ stage: 'storyline', status: 'completed' }],
    artifactRefs: [],
    executor,
  });

  assert.equal(completed.runtime_topology.runtime_substrate_owner, 'Codex CLI');
  assert.equal(completed.runtime_topology.runtime_substrate_surface, 'codex_native_host_agent');
  assert.equal(completed.runtime_topology.deployment_host_status, 'active_primary');
});

test('failHermesRun keeps Codex runtime topology for Codex-native executor', () => {
  const workspaceRoot = tempWorkspaceRoot();
  const executor = buildCodexExecutorDescriptor();
  const run = startHermesRun({
    workspaceRoot,
    route: 'storyline',
    overlay: 'ppt_deck',
    target: 'deck-a',
    topicId: 'topic-a',
    deliverableId: 'deck-a',
    executor,
  });

  const failed = failHermesRun({
    workspaceRoot,
    runId: run.run_id,
    currentStage: 'storyline',
    error: new Error('boom'),
    executor,
  });

  assert.equal(failed.runtime_topology.runtime_substrate_owner, 'Codex CLI');
  assert.equal(failed.runtime_topology.runtime_substrate_surface, 'codex_native_host_agent');
  assert.equal(failed.runtime_topology.deployment_host_status, 'active_primary');
});
