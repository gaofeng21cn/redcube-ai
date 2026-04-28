// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { mkdtempSync, unlinkSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

import {
  callGatewayTool,
  getToolDefinitions,
  listGatewayTools,
} from '../../apps/redcube-mcp/dist/server.js';
import {
  createDeliverable,
  intakeSource,
  runDeliverableRoute,
  runManagedDeliverable,
} from '@redcube/gateway';
import { completeSourceReadiness } from '../helpers/complete-source-readiness.ts';
import {
  startMockCodexCli,
  withEnv,
} from '../helpers/mock-codex-cli.ts';

async function withMockHermesUpstream(testFn) {
  const upstream = await startMockCodexCli();
  const restoreEnv = withEnv({
    REDCUBE_CODEX_COMMAND: upstream.command,
  });
  try {
    return await testFn();
  } finally {
    restoreEnv();
    await upstream.close();
  }
}

function withAction(action, args = {}) {
  return {
    action,
    ...args,
  };
}

function withOperation(operation, args = {}) {
  return {
    operation,
    ...args,
  };
}

test('callGatewayTool rejects unknown tool names', async () => {
  await assert.rejects(
    () => callGatewayTool('unknown_tool', {}),
    /Unknown tool: unknown_tool/,
  );
});

test('stdio MCP server exposes tools and can execute runtime_watch', async () => {
  const serverPath = fileURLToPath(
    new URL('../../apps/redcube-mcp/dist/server.js', import.meta.url),
  );
  const repoRoot = fileURLToPath(new URL('../..', import.meta.url));
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [serverPath],
    cwd: repoRoot,
    env: { ...process.env },
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
      tools.tools.some((tool) => tool.name === 'redcube_review'),
    );

    const result = await client.callTool({
      name: 'redcube_review',
      arguments: withAction('runtime_watch', {
        run: {
          run_id: 'run-a',
          current_stage: 'storyline',
          status: 'running',
          pending_reviews: ['render_review'],
          resumable: true,
        },
      }),
    });

    assert.equal(result.isError, undefined);
    assert.equal(result.structuredContent.status, 'review_pending');
    assert.equal(result.structuredContent.current_stage, 'storyline');
    assert.deepEqual(result.structuredContent.pending_reviews, ['render_review']);
  } finally {
    await transport.close();
  }
});

test('stdio MCP server exposes current product-entry overview surfaces', async () => {
  const serverPath = fileURLToPath(
    new URL('../../apps/redcube-mcp/dist/server.js', import.meta.url),
  );
  const repoRoot = fileURLToPath(new URL('../..', import.meta.url));
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-mcp-product-entry-'));
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [serverPath],
    cwd: repoRoot,
    env: { ...process.env },
    stderr: 'pipe',
  });
  const client = new Client({
    name: 'redcube-mcp-test-client',
    version: '0.1.0',
  });

  await client.connect(transport);

  try {
    const tools = await client.listTools();
    const productEntryTool = tools.tools.find((tool) => tool.name === 'redcube_product_entry');
    assert.ok(productEntryTool);

    const frontdesk = await client.callTool({
      name: 'redcube_product_entry',
      arguments: withAction('get_product_frontdesk', { workspaceRoot }),
    });
    const start = await client.callTool({
      name: 'redcube_product_entry',
      arguments: withAction('get_product_start', { workspaceRoot }),
    });
    const preflight = await client.callTool({
      name: 'redcube_product_entry',
      arguments: withAction('get_product_preflight', { workspaceRoot }),
    });

    assert.equal(frontdesk.isError, undefined);
    assert.equal(frontdesk.structuredContent.surface_kind, 'product_frontdesk');
    assert.equal(frontdesk.structuredContent.frontdesk_surface.command, 'redcube product frontdesk');
    assert.equal(start.isError, undefined);
    assert.equal(start.structuredContent.surface_kind, 'product_entry_start');
    assert.equal(start.structuredContent.workspace_locator.workspace_root, workspaceRoot);
    assert.equal(preflight.isError, undefined);
    assert.equal(preflight.structuredContent.surface_kind, 'product_entry_preflight');
    assert.equal(preflight.structuredContent.workspace_locator.workspace_root, workspaceRoot);
  } finally {
    await transport.close();
  }
});

test('stdio MCP server rejects runtime_watch when the topic locator does not match the persisted run identity', async () => {
  await withMockHermesUpstream(async () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-mcp-watch-mismatch-'));
  await completeSourceReadiness({
    workspaceRoot,
    topicId: 'topic-a',
    title: 'topic a source',
    brief: 'topic a',
    keywords: ['topic-a'],
  });
  await completeSourceReadiness({
    workspaceRoot,
    topicId: 'topic-b',
    title: 'topic b source',
    brief: 'topic b',
    keywords: ['topic-b'],
  });
  for (const topicId of ['topic-a', 'topic-b']) {
    await createDeliverable({
      workspaceRoot,
      overlay: 'ppt_deck',
      profileId: 'lecture_student',
      topicId,
      deliverableId: 'deck-a',
      title: `deck ${topicId}`,
      goal: `goal ${topicId}`,
    });
  }
  const runResult = await runDeliverableRoute({
    workspaceRoot,
    overlay: 'ppt_deck',
    topicId: 'topic-a',
    deliverableId: 'deck-a',
    route: 'storyline',
  });

  const serverPath = fileURLToPath(
    new URL('../../apps/redcube-mcp/dist/server.js', import.meta.url),
  );
  const repoRoot = fileURLToPath(new URL('../..', import.meta.url));
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [serverPath],
    cwd: repoRoot,
    env: { ...process.env },
    stderr: 'pipe',
  });
  const client = new Client({
    name: 'redcube-mcp-test-client',
    version: '0.1.0',
  });

  await client.connect(transport);

  try {
    const result = await client.callTool({
      name: 'redcube_review',
      arguments: withAction('runtime_watch', {
        workspaceRoot,
        topicId: 'topic-b',
        deliverableId: 'deck-a',
        runId: runResult.run.run_id,
      }),
    });

    assert.equal(result.isError, true);
    assert.match(result.content[0].text, /runtimeWatch topicId 与 run\.topic_id 不一致/);
    assert.equal(result.structuredContent.ok, false);
    assert.equal(result.structuredContent.error_kind, 'gateway_tool_error');
  } finally {
    await transport.close();
  }
  });
});

test('stdio MCP server preserves deliverable locator fields for audit_deliverable', async () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-mcp-audit-'));
  await completeSourceReadiness({
    workspaceRoot,
    topicId: 'topic-a',
    title: '甲状腺门诊科普素材',
    brief: '为本科生讲授甲状腺基础知识，需要可审计的 canonical source readiness。',
    keywords: ['甲状腺', '门诊', '科普'],
  });
  const created = await createDeliverable({
    workspaceRoot,
    overlay: 'ppt_deck',
    profileId: 'lecture_student',
    topicId: 'topic-a',
    deliverableId: 'deck-a',
    title: '甲状腺门诊科普 deck',
    goal: '为本科生讲授甲状腺基础知识',
  });
  unlinkSync(
    path.join(path.dirname(created.deliverableFile), 'contracts/review-surface.json'),
  );

  const serverPath = fileURLToPath(
    new URL('../../apps/redcube-mcp/dist/server.js', import.meta.url),
  );
  const repoRoot = fileURLToPath(new URL('../..', import.meta.url));
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [serverPath],
    cwd: repoRoot,
    env: { ...process.env },
    stderr: 'pipe',
  });
  const client = new Client({
    name: 'redcube-mcp-test-client',
    version: '0.1.0',
  });

  await client.connect(transport);

  try {
    const result = await client.callTool({
      name: 'redcube_review',
      arguments: withAction('audit_deliverable', {
        workspaceRoot,
        overlay: 'ppt_deck',
        topicId: 'topic-a',
        deliverableId: 'deck-a',
        mode: 'draft_new',
      }),
    });

    assert.equal(result.structuredContent.status, 'block');
    assert.deepEqual(
      result.structuredContent.issues,
      ['deliverable_contract_missing:review_surface'],
    );
  } finally {
    await transport.close();
  }
});

test('stdio MCP server returns operator-facing error metadata for failing tools', async () => {
  const serverPath = fileURLToPath(
    new URL('../../apps/redcube-mcp/dist/server.js', import.meta.url),
  );
  const repoRoot = fileURLToPath(new URL('../..', import.meta.url));
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [serverPath],
    cwd: repoRoot,
    env: { ...process.env },
    stderr: 'pipe',
  });
  const client = new Client({
    name: 'redcube-mcp-test-client',
    version: '0.1.0',
  });

  await client.connect(transport);

  try {
    const result = await client.callTool({
      name: 'redcube_deliverable',
      arguments: withAction('create_deliverable', {
        workspaceRoot: '/tmp/redcube-workspace',
        overlay: 'poster',
        profileId: 'default',
        topicId: 'topic-a',
        deliverableId: 'poster-a',
        title: '未知交付物',
        goal: '测试失败面',
      }),
    });

    assert.equal(result.isError, true);
    assert.equal(result.structuredContent.ok, false);
    assert.equal(result.structuredContent.error_kind, 'gateway_tool_error');
    assert.equal(result.structuredContent.recommended_action, 'inspect_tool_request');
    assert.match(result.structuredContent.error, /Unknown overlay/i);
  } finally {
    await transport.close();
  }
});

test('stdio MCP server can create deliverable, run declared route, and fetch run state', async () => {
  await withMockHermesUpstream(async () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-mcp-run-'));
  const serverPath = fileURLToPath(
    new URL('../../apps/redcube-mcp/dist/server.js', import.meta.url),
  );
  const repoRoot = fileURLToPath(new URL('../..', import.meta.url));
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [serverPath],
    cwd: repoRoot,
    env: { ...process.env },
    stderr: 'pipe',
  });
  const client = new Client({
    name: 'redcube-mcp-test-client',
    version: '0.1.0',
  });

  await client.connect(transport);

  try {
    const created = await client.callTool({
      name: 'redcube_deliverable',
      arguments: withAction('create_deliverable', {
        workspaceRoot,
        overlay: 'ppt_deck',
        profileId: 'lecture_peer',
        topicId: 'topic-a',
        deliverableId: 'deck-a',
        title: '同行讲解 deck',
        goal: '向小同行解释问题、方法、证据与边界',
      }),
    });

    assert.equal(created.structuredContent.deliverable.profile_id, 'lecture_peer');

    const preflight = await client.callTool({
      name: 'redcube_deliverable',
      arguments: withAction('run_deliverable_route', {
        workspaceRoot,
        overlay: 'ppt_deck',
        topicId: 'topic-a',
        deliverableId: 'deck-a',
        route: 'storyline',
      }),
    });

    assert.equal(preflight.structuredContent.ok, true);
    assert.equal(preflight.structuredContent.run.current_stage, 'storyline');

    const runResult = await client.callTool({
      name: 'redcube_deliverable',
      arguments: withAction('run_deliverable_route', {
        workspaceRoot,
        overlay: 'ppt_deck',
        topicId: 'topic-a',
        deliverableId: 'deck-a',
        route: 'detailed_outline',
      }),
    });

    assert.equal(runResult.structuredContent.ok, true);
    assert.equal(runResult.structuredContent.run.current_stage, 'detailed_outline');

    const runState = await client.callTool({
      name: 'redcube_deliverable',
      arguments: withAction('get_run', {
        workspaceRoot,
        runId: runResult.structuredContent.run.run_id,
      }),
    });

    assert.equal(runState.structuredContent.run.status, 'completed');
    assert.equal(runState.structuredContent.run.current_stage, 'detailed_outline');

    const watch = await client.callTool({
      name: 'redcube_review',
      arguments: withAction('runtime_watch', {
        workspaceRoot,
        topicId: 'topic-a',
        deliverableId: 'deck-a',
        runId: runResult.structuredContent.run.run_id,
      }),
    });

    assert.equal(watch.structuredContent.run_id, runResult.structuredContent.run.run_id);
    assert.equal(watch.structuredContent.current_stage, 'detailed_outline');
  } finally {
    await transport.close();
  }
  });
});

test('stdio MCP server can create and run xiaohongshu deliverable routes on shared runtime', async () => {
  await withMockHermesUpstream(async () => {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-mcp-xhs-'));
  const serverPath = fileURLToPath(
    new URL('../../apps/redcube-mcp/dist/server.js', import.meta.url),
  );
  const repoRoot = fileURLToPath(new URL('../..', import.meta.url));
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [serverPath],
    cwd: repoRoot,
    env: { ...process.env },
    stderr: 'pipe',
  });
  const client = new Client({
    name: 'redcube-mcp-test-client',
    version: '0.1.0',
  });

  await client.connect(transport);

  try {
    const created = await client.callTool({
      name: 'redcube_deliverable',
      arguments: withAction('create_deliverable', {
        workspaceRoot,
        overlay: 'xiaohongshu',
        profileId: 'standard_note',
        topicId: 'topic-a',
        deliverableId: 'note-a',
        title: '甲状腺门诊小红书科普',
        goal: '为门诊患者生成可发布的科普图文',
      }),
    });

    assert.equal(created.structuredContent.deliverable.overlay, 'xiaohongshu');
    assert.equal(created.structuredContent.deliverable.profile_id, 'standard_note');

    const runResult = await client.callTool({
      name: 'redcube_deliverable',
      arguments: withAction('run_deliverable_route', {
        workspaceRoot,
        overlay: 'xiaohongshu',
        topicId: 'topic-a',
        deliverableId: 'note-a',
        route: 'research',
      }),
    });

    assert.equal(runResult.structuredContent.ok, true);
    assert.equal(runResult.structuredContent.run.current_stage, 'research');

    const runState = await client.callTool({
      name: 'redcube_deliverable',
      arguments: withAction('get_run', {
        workspaceRoot,
        runId: runResult.structuredContent.run.run_id,
      }),
    });

    assert.equal(runState.structuredContent.run.status, 'completed');
    assert.equal(runState.structuredContent.run.current_stage, 'research');
  } finally {
    await transport.close();
  }
  });
});
