// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { mkdtempSync } from 'node:fs';

import {
  buildCodexExecutorDescriptor,
  completeRouteRun,
  failRouteRun,
  generateStructuredArtifactViaHermesAgentStructuredCall,
  runAgentLoopViaHermesAgentApi,
  startRouteRun,
  structuredCallViaHermesAgentApi,
} from './package-surfaces.ts';
import {
  appendRouteRunEvent,
  readRouteRunEvents,
} from '@redcube/runtime-protocol';

function tempWorkspaceRoot() {
  return mkdtempSync(path.join(os.tmpdir(), 'redcube-runtime-topology-'));
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
    allowLocalDiagnosticRecord: true,
  });

  const completed = completeRouteRun({
    workspaceRoot,
    runId: run.run_id,
    currentStage: 'storyline',
    stageResults: [{ stage: 'storyline', status: 'completed' }],
    artifactRefs: [],
    executor,
  });

  assert.equal(completed.runtime_topology.runtime_substrate_owner, 'Codex CLI');
  assert.equal(completed.runtime_topology.runtime_substrate_surface, 'codex_cli_runtime');
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
    allowLocalDiagnosticRecord: true,
  });

  const failed = failRouteRun({
    workspaceRoot,
    runId: run.run_id,
    currentStage: 'storyline',
    error: new Error('boom'),
    executor,
  });

  assert.equal(failed.runtime_topology.runtime_substrate_owner, 'Codex CLI');
  assert.equal(failed.runtime_topology.runtime_substrate_surface, 'codex_cli_runtime');
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
    allowLocalDiagnosticRecord: true,
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

test('route run events round-trip through the extracted refs-only record store', () => {
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
    allowLocalDiagnosticRecord: true,
  });

  appendRouteRunEvent(workspaceRoot, run.run_id, {
    event_id: 'event-1',
    kind: 'route_started',
    route: 'storyline',
  });

  assert.deepEqual(readRouteRunEvents(workspaceRoot, run.run_id), [{
    event_id: 'event-1',
    kind: 'route_started',
    route: 'storyline',
  }]);
});

test('retired Hermes-Agent API entrypoints fail closed instead of running mock proof backend', async () => {
  await assert.rejects(
    () => structuredCallViaHermesAgentApi({
      baseUrl: 'http://127.0.0.1:1',
      model: 'caller-compat-model',
      messages: [{ role: 'user', content: 'return structured JSON' }],
    }),
    /RCA-owned Hermes-Agent API client has been retired/,
  );

  await assert.rejects(
    () => generateStructuredArtifactViaHermesAgentStructuredCall({
      family: 'ppt_deck',
      route: 'render_html',
      promptRelativePath: 'prompts/ppt_deck/render_html.md',
      context: {},
      outputContract: {},
      env: { REDCUBE_HERMES_AGENT_API_BASE_URL: 'http://127.0.0.1:1' },
    }),
    /adapter_deletion_gate_owner=opl_agent_executor_adapter/,
  );

  await assert.rejects(
    () => runAgentLoopViaHermesAgentApi({
      baseUrl: 'http://127.0.0.1:1',
      model: 'caller-compat-model',
      input: { task: 'execute agent loop' },
    }),
    /active production importers still require the exported symbol/,
  );
});
