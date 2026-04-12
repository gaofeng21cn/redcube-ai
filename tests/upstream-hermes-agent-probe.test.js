import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { once } from 'node:events';

import {
  buildHermesAgentProbeHeaders,
  probeHermesAgentUpstream,
  readHermesAgentUpstreamConfig,
} from '../packages/redcube-hermes-agent-client/src/index.js';

test('readHermesAgentUpstreamConfig fails closed when base url is missing', () => {
  assert.throws(
    () => readHermesAgentUpstreamConfig({ REDCUBE_HERMES_UPSTREAM_BASE_URL: '' }),
    /REDCUBE_HERMES_UPSTREAM_BASE_URL 不能为空/,
  );
});

test('buildHermesAgentProbeHeaders adds bearer token when configured', () => {
  const headers = buildHermesAgentProbeHeaders({
    baseUrl: 'http://127.0.0.1:8642',
    apiKey: 'secret',
    modelName: 'hermes-agent',
  });

  assert.equal(headers.Authorization, 'Bearer secret');
  assert.equal(headers.Accept, 'application/json');
});

test('probeHermesAgentUpstream proves health, models, and run-event surfaces against a live upstream endpoint', async () => {
  const server = http.createServer((request, response) => {
    if (!request.url) {
      response.writeHead(500).end();
      return;
    }

    if (request.url === '/v1/health') {
      response.writeHead(200, { 'content-type': 'application/json' });
      response.end(JSON.stringify({ ok: true }));
      return;
    }

    if (request.url === '/v1/models') {
      response.writeHead(200, { 'content-type': 'application/json' });
      response.end(JSON.stringify({
        data: [
          { id: 'hermes-agent' },
        ],
      }));
      return;
    }

    if (request.url === '/v1/runs' && request.method === 'POST') {
      response.writeHead(202, { 'content-type': 'application/json' });
      response.end(JSON.stringify({ run_id: 'run_test_123', status: 'started' }));
      return;
    }

    if (request.url === '/v1/runs/run_test_123/events') {
      response.writeHead(200, { 'content-type': 'text/event-stream' });
      response.write('data: {"event":"run.completed","run_id":"run_test_123","output":"READY"}\n\n');
      response.end();
      return;
    }

    response.writeHead(404).end();
  });

  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  if (!address || typeof address === 'string') {
    throw new Error('server address unavailable');
  }

  try {
    const result = await probeHermesAgentUpstream({
      config: {
        baseUrl: `http://127.0.0.1:${address.port}`,
        apiKey: '',
        modelName: 'hermes-agent',
      },
      requireRunSurface: true,
    });

    assert.equal(result.ok, true);
    assert.equal(result.runtime_owner, 'upstream_hermes_agent');
    assert.equal(result.steps.health.ok, true);
    assert.equal(result.steps.models.ok, true);
    assert.equal(result.steps.run_surface.ok, true);
    assert.equal(result.steps.run_surface.terminal_event, 'run.completed');
  } finally {
    server.close();
    await once(server, 'close');
  }
});
