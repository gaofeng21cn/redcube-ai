import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

import {
  callGatewayTool,
  listGatewayTools,
} from '../apps/redcube-mcp/src/server.js';

test('listGatewayTools exposes deliverable-centric gateway actions in stable order', () => {
  const tools = listGatewayTools();

  assert.deepEqual(
    tools.map((tool) => tool.name),
    [
      'doctor',
      'list_topics',
      'create_deliverable',
      'get_deliverable',
      'audit_deliverable',
      'review_render_output',
      'run_deliverable_route',
      'get_run',
      'runtime_watch',
    ],
  );
});

test('callGatewayTool delegates to injected gateway action', async () => {
  const result = await callGatewayTool(
    'create_deliverable',
    {
      workspaceRoot: '/tmp/redcube-workspace',
      overlay: 'ppt_deck',
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      title: '甲状腺门诊科普 deck',
    },
    {
      createDeliverable: async (request) => ({
        ok: true,
        deliverable: {
          overlay: request.overlay,
          deliverable_id: request.deliverableId,
        },
      }),
    },
  );

  assert.equal(result.ok, true);
  assert.equal(result.deliverable.overlay, 'ppt_deck');
  assert.equal(result.deliverable.deliverable_id, 'deck-a');
});

test('callGatewayTool rejects unknown tool names', async () => {
  await assert.rejects(
    () => callGatewayTool('unknown_tool', {}),
    /Unknown tool: unknown_tool/,
  );
});

test('stdio MCP server exposes tools and can execute runtime_watch', async () => {
  const serverPath = fileURLToPath(
    new URL('../apps/redcube-mcp/src/server.js', import.meta.url),
  );
  const repoRoot = fileURLToPath(new URL('..', import.meta.url));
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [serverPath],
    cwd: repoRoot,
    stderr: 'pipe',
  });
  const client = new Client({
    name: 'redcube-mcp-test-client',
    version: '0.1.0',
  });

  await client.connect(transport);

  try {
    const tools = await client.listTools();
    assert.ok(
      tools.tools.some((tool) => tool.name === 'runtime_watch'),
    );

    const result = await client.callTool({
      name: 'runtime_watch',
      arguments: {
        run: {
          run_id: 'run-a',
          current_stage: 'storyline',
          status: 'running',
          pending_reviews: ['render_review'],
          resumable: true,
        },
      },
    });

    assert.equal(result.isError, undefined);
    assert.equal(result.structuredContent.status, 'review_pending');
    assert.equal(result.structuredContent.current_stage, 'storyline');
    assert.deepEqual(result.structuredContent.pending_reviews, ['render_review']);
  } finally {
    await transport.close();
  }
});
