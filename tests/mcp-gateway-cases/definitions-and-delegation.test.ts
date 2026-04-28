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

test('listGatewayTools exposes deliverable-centric gateway actions in stable order', () => {
  const tools = listGatewayTools();

  assert.deepEqual(
    tools.map((tool) => tool.name),
    [
      'redcube_workspace',
      'redcube_sources',
      'redcube_deliverable',
      'redcube_review',
      'redcube_product_entry',
    ],
  );
});


test('MCP tool definitions keep runtime_watch on the same run-boundary locator truth as CLI review watch', () => {
  const definitions = getToolDefinitions();
  const workspace = definitions.find((tool) => tool.name === 'redcube_workspace');
  const sources = definitions.find((tool) => tool.name === 'redcube_sources');
  const deliverable = definitions.find((tool) => tool.name === 'redcube_deliverable');
  const review = definitions.find((tool) => tool.name === 'redcube_review');
  const productEntry = definitions.find((tool) => tool.name === 'redcube_product_entry');

  assert.equal(workspace?.description.includes('workspace/topic discovery'), true);
  assert.equal(sources?.description.includes('source intake/research'), true);
  assert.equal(deliverable?.description.includes('deliverable lifecycle execution'), true);
  assert.equal(review?.description.includes('deliverable boundary'), true);
  assert.equal(review?.description.includes('runtime watch'), true);
  assert.equal(productEntry?.description.includes('frontdesk'), true);
  assert.equal(productEntry?.description.includes('preflight'), true);
  assert.equal(productEntry?.description.includes('product-entry'), true);
  assert.equal(Object.hasOwn(review?.inputSchema || {}, 'runId'), true);
  assert.equal(Object.hasOwn(productEntry?.inputSchema || {}, 'entry_session_contract'), true);
  assert.equal(Object.hasOwn(productEntry?.inputSchema || {}, 'workspace_root'), true);
  assert.equal(Object.hasOwn(productEntry?.inputSchema || {}, 'return_surface_contract'), true);
  assert.equal(Object.hasOwn(productEntry?.inputSchema || {}, 'entry_session_id'), true);
  assert.equal(Object.hasOwn(workspace?.inputSchema || {}, 'action'), true);
  assert.equal(Object.hasOwn(sources?.inputSchema || {}, 'operation'), true);
});

test('callGatewayTool delegates to injected gateway action', async () => {
  const result = await callGatewayTool(
    'redcube_deliverable',
    withAction('create_deliverable', {
      workspaceRoot: '/tmp/redcube-workspace',
      overlay: 'ppt_deck',
      profileId: 'lecture_student',
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      title: '甲状腺门诊科普 deck',
      goal: '为本科生讲授甲状腺基础知识',
    }),
    {
      createDeliverable: async (request) => ({
        ok: true,
        deliverable: {
          overlay: request.overlay,
          profile_id: request.profileId,
          deliverable_id: request.deliverableId,
        },
      }),
    },
  );

  assert.equal(result.ok, true);
  assert.equal(result.deliverable.overlay, 'ppt_deck');
  assert.equal(result.deliverable.profile_id, 'lecture_student');
  assert.equal(result.deliverable.deliverable_id, 'deck-a');
});

test('callGatewayTool delegates source intake gateway action', async () => {
  const result = await callGatewayTool(
    'redcube_sources',
    withOperation('intake_source', {
      workspaceRoot: '/tmp/redcube-workspace',
      topicId: 'topic-a',
      title: '共享输入',
      brief: 'brief',
      keywords: ['a', 'b'],
      sourceFiles: [],
    }),
    {
      intakeSource: async (request) => ({
        ok: true,
        audit: {
          topic_id: request.topicId,
          status: 'pass',
        },
      }),
    },
  );

  assert.equal(result.ok, true);
  assert.equal(result.audit.topic_id, 'topic-a');
  assert.equal(result.audit.status, 'pass');
});

test('callGatewayTool delegates source research gateway action', async () => {
  const result = await callGatewayTool(
    'redcube_sources',
    withOperation('source_research', {
      workspaceRoot: '/tmp/redcube-workspace',
      topicId: 'topic-a',
      title: '共享输入',
      brief: 'brief',
      keywords: ['a', 'b'],
      sourceFiles: [],
    }),
    {
      researchSource: async (request) => ({
        ok: true,
        topicId: request.topicId,
        stage: 'source_augmentation_execution',
        planningReady: true,
        summary: {
          topic_id: request.topicId,
          planning_ready: true,
        },
      }),
    },
  );

  assert.equal(result.ok, true);
  assert.equal(result.topicId, 'topic-a');
  assert.equal(result.stage, 'source_augmentation_execution');
  assert.equal(result.planningReady, true);
});

test('callGatewayTool delegates source augmentation gateway action', async () => {
  const result = await callGatewayTool(
    'redcube_sources',
    withOperation('prepare_source_augmentation', {
      workspaceRoot: '/tmp/redcube-workspace',
      topicId: 'topic-a',
    }),
    {
      prepareSourceAugmentation: async (request) => ({
        ok: true,
        topicId: request.topicId,
        augmentation: {
          status: 'required',
          readiness_target: 'planning_ready',
        },
      }),
    },
  );

  assert.equal(result.ok, true);
  assert.equal(result.topicId, 'topic-a');
  assert.equal(result.augmentation.status, 'required');
  assert.equal(result.augmentation.readiness_target, 'planning_ready');
});

test('callGatewayTool delegates source augmentation result preparation gateway action', async () => {
  const result = await callGatewayTool(
    'redcube_sources',
    withOperation('prepare_source_augmentation_result', {
      workspaceRoot: '/tmp/redcube-workspace',
      topicId: 'topic-a',
    }),
    {
      prepareSourceAugmentationResult: async (request) => ({
        ok: true,
        topicId: request.topicId,
        artifactFiles: {
          sourceAugmentationResultFile: '/tmp/redcube-workspace/topics/topic-a/canonical/source-augmentation-result.json',
        },
        resultDraft: {
          topic_id: request.topicId,
        },
      }),
    },
  );

  assert.equal(result.ok, true);
  assert.equal(result.topicId, 'topic-a');
  assert.equal(result.resultDraft.topic_id, 'topic-a');
});

test('callGatewayTool delegates source augmentation result write gateway action', async () => {
  const result = await callGatewayTool(
    'redcube_sources',
    withOperation('write_source_augmentation_result', {
      workspaceRoot: '/tmp/redcube-workspace',
      topicId: 'topic-a',
      payloadFile: '/tmp/research-result.json',
    }),
    {
      writeSourceAugmentationResult: async (request) => ({
        ok: true,
        topicId: request.topicId,
        artifactFiles: {
          sourceAugmentationResultFile: '/tmp/redcube-workspace/topics/topic-a/canonical/source-augmentation-result.json',
        },
        resultContract: {
          topic_id: request.topicId,
          status: 'completed',
        },
      }),
    },
  );

  assert.equal(result.ok, true);
  assert.equal(result.topicId, 'topic-a');
  assert.equal(result.resultContract.status, 'completed');
});

test('callGatewayTool delegates source augmentation execution gateway action', async () => {
  const result = await callGatewayTool(
    'redcube_sources',
    withOperation('execute_source_augmentation', {
      workspaceRoot: '/tmp/redcube-workspace',
      topicId: 'topic-a',
    }),
    {
      executeSourceAugmentation: async (request) => ({
        ok: true,
        topicId: request.topicId,
        report: {
          status: 'completed',
          readiness_target: 'planning_ready',
        },
      }),
    },
  );

  assert.equal(result.ok, true);
  assert.equal(result.topicId, 'topic-a');
  assert.equal(result.report.status, 'completed');
  assert.equal(result.report.readiness_target, 'planning_ready');
});

test('callGatewayTool delegates overlay catalog gateway action', async () => {
  const result = await callGatewayTool(
    'redcube_workspace',
    withAction('get_overlay_catalog'),
    {
      getOverlayCatalog: async () => ({
        ok: true,
        surface_kind: 'overlay_catalog',
        recommended_action: 'create_deliverable',
        summary: {
          total_overlays: 1,
          total_profiles: 1,
        },
        overlays: [{ overlay_id: 'poster', profiles: ['default'] }],
      }),
    },
  );

  assert.equal(result.ok, true);
  assert.equal(result.surface_kind, 'overlay_catalog');
  assert.equal(result.recommended_action, 'create_deliverable');
  assert.equal(result.summary.total_overlays, 1);
  assert.deepEqual(result.overlays, [{ overlay_id: 'poster', profiles: ['default'] }]);
});
