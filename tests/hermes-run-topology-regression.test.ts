// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { mkdtempSync } from 'node:fs';
import { createServer } from 'node:http';

import {
  buildCodexExecutorDescriptor,
  completeHermesRun,
  failHermesRun,
  runAgentLoopViaHermesAgentApi,
  startHermesRun,
  structuredCallViaHermesAgentApi,
} from '@redcube/hermes-substrate';

function tempWorkspaceRoot() {
  return mkdtempSync(path.join(os.tmpdir(), 'redcube-hermes-topology-'));
}

async function startMockHermesAgentApiServer() {
  const requests = [];
  const server = createServer(async (request, response) => {
    const chunks = [];
    for await (const chunk of request) {
      chunks.push(chunk);
    }
    const bodyText = Buffer.concat(chunks).toString('utf-8');
    const body = bodyText ? JSON.parse(bodyText) : null;
    requests.push({
      method: request.method,
      url: request.url,
      body,
    });
    response.setHeader('content-type', 'application/json');

    if (request.method === 'POST' && request.url === '/v1/chat/completions') {
      response.end(JSON.stringify({
        id: 'chatcmpl-mock-1',
        provider: 'mock-hermes-provider',
        model: 'server-selected-model',
        session_id: 'session-chat-1',
        run_id: 'run-chat-1',
        choices: [
          {
            message: {
              content: JSON.stringify({
                ok: true,
                route: 'structured_call',
              }),
            },
          },
        ],
      }));
      return;
    }

    if (request.method === 'POST' && request.url === '/v1/runs') {
      response.end(JSON.stringify({
        id: 'run-agent-1',
        provider: 'mock-hermes-provider',
        model: 'server-selected-agent-loop-model',
        session_id: 'session-agent-1',
        run_id: 'run-agent-1',
        output: {
          ok: true,
          route: 'agent_loop',
        },
      }));
      return;
    }

    if (request.method === 'GET' && request.url === '/v1/runs/run-agent-1/events') {
      response.end(JSON.stringify({
        events: [
          { type: 'run.started', run_id: 'run-agent-1' },
          { type: 'run.completed', run_id: 'run-agent-1' },
        ],
      }));
      return;
    }

    response.statusCode = 404;
    response.end(JSON.stringify({ error: 'not_found' }));
  });

  await new Promise((resolve) => {
    server.listen(0, '127.0.0.1', resolve);
  });
  const address = server.address();
  assert.equal(typeof address, 'object');
  assert.notEqual(address, null);
  return {
    baseUrl: `http://127.0.0.1:${address.port}`,
    requests,
    close: () => new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    }),
  };
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

test('Hermes-Agent API structured_call posts chat completions and records server-selected proof', async () => {
  const server = await startMockHermesAgentApiServer();
  try {
    const result = await structuredCallViaHermesAgentApi({
      baseUrl: server.baseUrl,
      model: 'caller-compat-model',
      messages: [
        { role: 'user', content: 'return structured JSON' },
      ],
    });

    assert.deepEqual(result.data, {
      ok: true,
      route: 'structured_call',
    });
    assert.equal(result.proof.call_surface, 'structured_call');
    assert.equal(result.proof.endpoint, '/v1/chat/completions');
    assert.equal(result.proof.provider, 'mock-hermes-provider');
    assert.equal(result.proof.model, 'server-selected-model');
    assert.equal(result.proof.requested_model, 'caller-compat-model');
    assert.equal(result.proof.request_model_role, 'api_compatibility_only');
    assert.equal(result.proof.model_selection_basis, 'hermes_agent_server_runtime');
    assert.equal(result.proof.session_id, 'session-chat-1');
    assert.equal(result.proof.run_id, 'run-chat-1');
    assert.deepEqual(result.proof.run_events, []);
    assert.equal(server.requests[0].method, 'POST');
    assert.equal(server.requests[0].url, '/v1/chat/completions');
    assert.equal(server.requests[0].body.model, 'caller-compat-model');
  } finally {
    await server.close();
  }
});

test('Hermes-Agent API agent_loop creates a run and reads run events into proof', async () => {
  const server = await startMockHermesAgentApiServer();
  try {
    const result = await runAgentLoopViaHermesAgentApi({
      baseUrl: server.baseUrl,
      model: 'caller-compat-model',
      input: {
        task: 'execute agent loop',
      },
    });

    assert.deepEqual(result.data, {
      ok: true,
      route: 'agent_loop',
    });
    assert.equal(result.proof.call_surface, 'agent_loop');
    assert.equal(result.proof.provider, 'mock-hermes-provider');
    assert.equal(result.proof.model, 'server-selected-agent-loop-model');
    assert.equal(result.proof.requested_model, 'caller-compat-model');
    assert.equal(result.proof.session_id, 'session-agent-1');
    assert.equal(result.proof.run_id, 'run-agent-1');
    assert.deepEqual(result.proof.run_events, [
      { type: 'run.started', run_id: 'run-agent-1' },
      { type: 'run.completed', run_id: 'run-agent-1' },
    ]);
    assert.deepEqual(
      server.requests.map((entry) => `${entry.method} ${entry.url}`),
      ['POST /v1/runs', 'GET /v1/runs/run-agent-1/events'],
    );
    assert.equal(server.requests[0].body.model, 'caller-compat-model');
  } finally {
    await server.close();
  }
});
