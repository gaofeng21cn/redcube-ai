// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { mkdtempSync } from 'node:fs';

import {
  buildCodexExecutorDescriptor,
  completeRouteRun,
  failRetiredHermesAgentAdapter,
  failRouteRun,
  startRouteRun,
} from './package-surfaces.ts';
import {
  appendRouteRunEvent,
} from '@redcube/runtime-protocol';

function tempWorkspaceRoot() {
  return mkdtempSync(path.join(os.tmpdir(), 'redcube-runtime-topology-'));
}

function oplAttempt(route = 'storyline') {
  return {
    owner: 'one-person-lab',
    provider_attempt_owner: 'one-person-lab',
    provider_attempt_ref: `opl-provider-attempt:test/${route}`,
    provider_attempt_ledger_ref: `attempt-ledger:opl/test/${route}`,
    stage_attempt_ref: `opl-stage-attempt:test/${route}`,
  };
}

test('completed route runs keep Codex runtime topology for Codex-native executor', () => {
  const workspaceRoot = tempWorkspaceRoot();
  const executor = buildCodexExecutorDescriptor();
  const run = startRouteRun({
    workspaceRoot,
    route: 'storyline',
    overlay: 'ppt_deck',
    target: 'deck-a',
    topicId: 'topic-a',
    deliverableId: 'deck-a',
    executor,
    crossProviderAttemptIndex: oplAttempt('storyline'),
  });

  const completed = completeRouteRun({
    workspaceRoot,
    runId: run.run_id,
    run,
    currentStage: 'storyline',
    stageResults: [{ stage: 'storyline', status: 'completed' }],
    artifactRefs: [],
    executor,
  });

  assert.equal(completed.runtime_topology.runtime_substrate_owner, 'Codex CLI');
  assert.equal(completed.runtime_topology.runtime_substrate_surface, 'codex_cli_runtime');
  assert.equal(completed.runtime_topology.generic_executor_adapter_owner, 'one-person-lab');
  assert.equal(completed.runtime_topology.domain_authority_owner, 'redcube_ai');
  assert.equal(completed.runtime_topology.rca_owns_generic_runtime, false);
  assert.equal(completed.route_run_record_boundary.generic_attempt_ledger_owner, 'one-person-lab');
  assert.equal(completed.route_run_record_boundary.rca_owns_generic_runtime_record_store, false);
  assert.equal(completed.runtime_topology.deployment_host_status, 'active_primary');
  assert.equal(
    completed.runtime_topology.domain_entry_protocol_role,
    'visual_deliverable_domain_entry_protocol_boundary',
  );
  assert.equal('gateway_role' in completed.runtime_topology, false);
});

test('failed route runs keep Codex runtime topology for Codex-native executor', () => {
  const workspaceRoot = tempWorkspaceRoot();
  const executor = buildCodexExecutorDescriptor();
  const run = startRouteRun({
    workspaceRoot,
    route: 'storyline',
    overlay: 'ppt_deck',
    target: 'deck-a',
    topicId: 'topic-a',
    deliverableId: 'deck-a',
    executor,
    crossProviderAttemptIndex: oplAttempt('storyline'),
  });

  const failed = failRouteRun({
    workspaceRoot,
    runId: run.run_id,
    run,
    currentStage: 'storyline',
    error: new Error('boom'),
    executor,
  });

  assert.equal(failed.runtime_topology.runtime_substrate_owner, 'Codex CLI');
  assert.equal(failed.runtime_topology.runtime_substrate_surface, 'codex_cli_runtime');
  assert.equal(failed.runtime_topology.generic_executor_adapter_owner, 'one-person-lab');
  assert.equal(failed.runtime_topology.rca_owns_generic_executor_adapter, false);
  assert.equal(failed.route_run_record_boundary.generic_event_log_owner, 'one-person-lab');
  assert.equal(failed.route_run_record_boundary.rca_owns_generic_event_log, false);
  assert.equal(failed.runtime_topology.deployment_host_status, 'active_primary');
  assert.equal(
    failed.runtime_topology.domain_entry_protocol_role,
    'visual_deliverable_domain_entry_protocol_boundary',
  );
  assert.equal('gateway_role' in failed.runtime_topology, false);
});

test('failed route runs retain diagnostic artifact refs from typed errors', () => {
  const workspaceRoot = tempWorkspaceRoot();
  const executor = buildCodexExecutorDescriptor();
  const run = startRouteRun({
    workspaceRoot,
    route: 'author_pptx_native',
    overlay: 'ppt_deck',
    target: 'deck-a',
    topicId: 'topic-a',
    deliverableId: 'deck-a',
    executor,
    crossProviderAttemptIndex: oplAttempt('author_pptx_native'),
  });
  const error = new Error('native structural blocker');
  error.artifact_refs = [
    '/tmp/native-candidate.json',
    '/tmp/native-structural-validation.json',
    '/tmp/native-candidate.json',
  ];

  const failed = failRouteRun({
    workspaceRoot,
    runId: run.run_id,
    run,
    currentStage: 'author_pptx_native',
    error,
    executor,
  });

  assert.deepEqual(failed.artifact_refs, [
    '/tmp/native-candidate.json',
    '/tmp/native-structural-validation.json',
  ]);
  assert.deepEqual(failed.error.artifact_refs, [
    '/tmp/native-candidate.json',
    '/tmp/native-structural-validation.json',
  ]);
});

test('route run events stay refs-only and do not create a local event log', () => {
  const workspaceRoot = tempWorkspaceRoot();
  const executor = buildCodexExecutorDescriptor();
  const run = startRouteRun({
    workspaceRoot,
    route: 'storyline',
    overlay: 'ppt_deck',
    target: 'deck-a',
    topicId: 'topic-a',
    deliverableId: 'deck-a',
    executor,
    crossProviderAttemptIndex: oplAttempt('storyline'),
  });

  const eventRef = appendRouteRunEvent(workspaceRoot, run.run_id, {
    event_id: 'event-1',
    kind: 'route_started',
    route: 'storyline',
  });

  assert.equal(eventRef.event_log_owner, 'one-person-lab');
  assert.equal(eventRef.local_event_log_written, false);
});

test('retired Hermes-Agent adapter fails closed at the executor boundary', () => {
  assert.throws(
    () => failRetiredHermesAgentAdapter({ surface: 'hermes_agent_api_server' }),
    /RCA-owned Hermes-Agent adapter has been retired.*adapter_deletion_gate_owner=opl_agent_executor_adapter/,
  );
});
