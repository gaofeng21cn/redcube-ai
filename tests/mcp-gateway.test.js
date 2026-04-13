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
} from '../apps/redcube-mcp/src/server.js';
import {
  createDeliverable,
  intakeSource,
  runDeliverableRoute,
  runManagedDeliverable,
} from '../packages/redcube-gateway/src/index.js';
import { completeSourceReadiness } from './helpers/complete-source-readiness.js';
import {
  startMockCodexCli,
  withEnv,
} from './helpers/mock-codex-cli.js';

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

test('listGatewayTools exposes deliverable-centric gateway actions in stable order', () => {
  const tools = listGatewayTools();

  assert.deepEqual(
    tools.map((tool) => tool.name),
    [
      'doctor',
      'list_topics',
      'get_overlay_catalog',
      'intake_source',
      'source_research',
      'prepare_source_augmentation',
      'prepare_source_augmentation_result',
      'write_source_augmentation_result',
      'execute_source_augmentation',
      'invoke_domain_entry',
      'invoke_product_entry',
      'invoke_federated_product_entry',
      'get_product_entry_session',
      'get_product_entry_manifest',
      'create_deliverable',
      'get_deliverable',
      'get_publication_projection',
      'audit_deliverable',
      'review_render_output',
      'run_managed_deliverable',
      'get_managed_run',
      'supervise_managed_run',
      'run_deliverable_route',
      'get_run',
      'get_review_state',
      'apply_review_mutation',
      'runtime_watch',
    ],
  );
});


test('MCP tool definitions keep runtime_watch on the same run-boundary locator truth as CLI review watch', () => {
  const definitions = getToolDefinitions();
  const watch = definitions.find((tool) => tool.name === 'runtime_watch');
  const review = definitions.find((tool) => tool.name === 'get_review_state');
  const projection = definitions.find((tool) => tool.name === 'get_publication_projection');
  const intake = definitions.find((tool) => tool.name === 'intake_source');
  const research = definitions.find((tool) => tool.name === 'source_research');
  const product = definitions.find((tool) => tool.name === 'invoke_product_entry');
  const federated = definitions.find((tool) => tool.name === 'invoke_federated_product_entry');
  const session = definitions.find((tool) => tool.name === 'get_product_entry_session');
  const manifest = definitions.find((tool) => tool.name === 'get_product_entry_manifest');

  assert.equal(intake?.description.includes('bootstrap writer'), true);
  assert.equal(research?.description.includes('planning_ready'), true);
  assert.equal(review?.description.includes('deliverable boundary'), true);
  assert.equal(projection?.description.includes('topic boundary'), true);
  assert.equal(watch?.description.includes('run boundary'), true);
  assert.equal(product?.description.includes('direct RedCube product-entry surface'), true);
  assert.equal(federated?.description.includes('OPL Gateway style handoff'), true);
  assert.equal(session?.description.includes('product-entry session'), true);
  assert.equal(manifest?.description.includes('product-entry manifest'), true);
  assert.equal(Object.hasOwn(watch?.inputSchema || {}, 'runId'), true);
  assert.equal(Object.hasOwn(product?.inputSchema || {}, 'entry_session_contract'), true);
  assert.equal(Object.hasOwn(manifest?.inputSchema || {}, 'workspace_root'), true);
  assert.equal(Object.hasOwn(federated?.inputSchema || {}, 'return_surface_contract'), true);
  assert.equal(Object.hasOwn(session?.inputSchema || {}, 'entry_session_id'), true);
});

test('callGatewayTool delegates to injected gateway action', async () => {
  const result = await callGatewayTool(
    'create_deliverable',
    {
      workspaceRoot: '/tmp/redcube-workspace',
      overlay: 'ppt_deck',
      profileId: 'lecture_student',
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      title: '甲状腺门诊科普 deck',
      goal: '为本科生讲授甲状腺基础知识',
    },
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
    'intake_source',
    {
      workspaceRoot: '/tmp/redcube-workspace',
      topicId: 'topic-a',
      title: '共享输入',
      brief: 'brief',
      keywords: ['a', 'b'],
      sourceFiles: [],
    },
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
    'source_research',
    {
      workspaceRoot: '/tmp/redcube-workspace',
      topicId: 'topic-a',
      title: '共享输入',
      brief: 'brief',
      keywords: ['a', 'b'],
      sourceFiles: [],
    },
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
    'prepare_source_augmentation',
    {
      workspaceRoot: '/tmp/redcube-workspace',
      topicId: 'topic-a',
    },
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
    'prepare_source_augmentation_result',
    {
      workspaceRoot: '/tmp/redcube-workspace',
      topicId: 'topic-a',
    },
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
    'write_source_augmentation_result',
    {
      workspaceRoot: '/tmp/redcube-workspace',
      topicId: 'topic-a',
      payloadFile: '/tmp/research-result.json',
    },
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
    'execute_source_augmentation',
    {
      workspaceRoot: '/tmp/redcube-workspace',
      topicId: 'topic-a',
    },
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
    'get_overlay_catalog',
    {},
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

test('callGatewayTool delegates product-entry gateway actions', async () => {
  const direct = await callGatewayTool(
    'invoke_product_entry',
    {
      workspace_locator: { workspace_root: '/tmp/redcube-workspace' },
      entry_session_contract: { entry_session_id: 'session-a' },
      delivery_request: {
        deliverable_family: 'ppt_deck',
        topic_id: 'topic-a',
        deliverable_id: 'deck-a',
      },
    },
    {
      invokeProductEntry: async (request) => ({
        ok: true,
        surface_kind: 'product_entry',
        product_entry_contract_id: 'redcube_product_entry',
        entry_session: {
          entry_session_id: request.entry_session_contract.entry_session_id,
        },
      }),
    },
  );
  const federated = await callGatewayTool(
    'invoke_federated_product_entry',
    {
      target_domain_id: 'redcube_ai',
      task_intent: 'run_managed_deliverable',
      entry_mode: 'opl_gateway',
      workspace_locator: { workspace_root: '/tmp/redcube-workspace' },
      runtime_session_contract: { runtime_owner: 'codex_cli' },
      return_surface_contract: { surface_kind: 'product_entry' },
      entry_session_contract: { entry_session_id: 'session-a' },
      delivery_request: {
        deliverable_family: 'ppt_deck',
        topic_id: 'topic-a',
        deliverable_id: 'deck-a',
      },
    },
    {
      invokeFederatedProductEntry: async (request) => ({
        ok: true,
        surface_kind: 'federated_product_entry',
        federated_product_entry_contract_id: 'opl_gateway_federated_product_entry',
        summary: {
          entry_session_id: request.entry_session_contract.entry_session_id,
        },
      }),
    },
  );
  const session = await callGatewayTool(
    'get_product_entry_session',
    {
      entry_session_id: 'session-a',
    },
    {
      getProductEntrySession: async (request) => ({
        ok: true,
        surface_kind: 'product_entry_session',
        entry_session: {
          entry_session_id: request.entry_session_id,
        },
      }),
    },
  );

  assert.equal(direct.surface_kind, 'product_entry');
  assert.equal(direct.entry_session.entry_session_id, 'session-a');
  assert.equal(federated.surface_kind, 'federated_product_entry');
  assert.equal(federated.summary.entry_session_id, 'session-a');
  assert.equal(session.surface_kind, 'product_entry_session');
  assert.equal(session.entry_session.entry_session_id, 'session-a');
});

test('callGatewayTool can return normalized discovery surfaces for doctor and topic catalog', async () => {
  const doctor = await callGatewayTool(
    'doctor',
    { workspaceRoot: '/tmp/redcube-workspace' },
    {
      doctorWorkspace: async () => ({
        ok: true,
        surface_kind: 'workspace_doctor',
        recommended_action: 'continue',
        summary: {
          workspace_file_exists: true,
        },
      }),
    },
  );
  const topics = await callGatewayTool(
    'list_topics',
    { workspaceRoot: '/tmp/redcube-workspace' },
    {
      listTopics: async () => ({
        ok: true,
        surface_kind: 'topic_catalog',
        recommended_action: 'create_or_import_topic',
        summary: {
          total_topics: 0,
        },
        topics: [],
      }),
    },
  );

  assert.equal(doctor.surface_kind, 'workspace_doctor');
  assert.equal(doctor.summary.workspace_file_exists, true);
  assert.equal(topics.surface_kind, 'topic_catalog');
  assert.equal(topics.recommended_action, 'create_or_import_topic');
  assert.equal(topics.summary.total_topics, 0);
});

test('callGatewayTool delegates publication projection gateway action', async () => {
  const result = await callGatewayTool(
    'get_publication_projection',
    {
      workspaceRoot: '/tmp/redcube-workspace',
      topicId: 'topic-a',
    },
    {
      getPublicationProjection: async (request) => ({
        ok: true,
        surface_kind: 'publication_projection',
        topic_id: request.topicId,
        state_type: 'projection',
        publication: { current: 'approval_pending' },
        canonical_source: { kind: 'review_state.publish_state' },
      }),
    },
  );

  assert.equal(result.ok, true);
  assert.equal(result.surface_kind, 'publication_projection');
  assert.equal(result.publication.current, 'approval_pending');
  assert.equal(result.canonical_source.kind, 'review_state.publish_state');
});

test('callGatewayTool can return operator-facing deliverable and route-run surfaces', async () => {
  const deliverable = await callGatewayTool(
    'get_deliverable',
    {
      workspaceRoot: '/tmp/redcube-workspace',
      topicId: 'topic-a',
      deliverableId: 'deck-a',
    },
    {
      getDeliverable: async () => ({
        ok: true,
        surface_kind: 'deliverable_record',
        recommended_action: 'audit_deliverable',
        summary: { deliverable_id: 'deck-a' },
        deliverable: { deliverable_id: 'deck-a' },
      }),
    },
  );
  const routeRun = await callGatewayTool(
    'run_deliverable_route',
    {
      workspaceRoot: '/tmp/redcube-workspace',
      overlay: 'ppt_deck',
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      route: 'storyline',
    },
    {
      runDeliverableRoute: async () => ({
        ok: true,
        surface_kind: 'route_run',
        recommended_action: 'continue',
        summary: { route: 'storyline' },
        run: { run_id: 'run-a' },
      }),
    },
  );

  assert.equal(deliverable.surface_kind, 'deliverable_record');
  assert.equal(deliverable.recommended_action, 'audit_deliverable');
  assert.equal(routeRun.surface_kind, 'route_run');
  assert.equal(routeRun.summary.route, 'storyline');
});

test('callGatewayTool delegates managed deliverable execution and managed run lookup', async () => {
  const managed = await callGatewayTool(
    'run_managed_deliverable',
    {
      workspaceRoot: '/tmp/redcube-workspace',
      overlay: 'ppt_deck',
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      userIntent: '给我一个最终 PPT',
    },
    {
      runManagedDeliverable: async () => ({
        ok: true,
        surface_kind: 'managed_run',
        summary: {
          managed_run_id: 'managed-a',
          status: 'completed',
          current_stage: 'export_pptx',
        },
        managed_run: {
          managed_run_id: 'managed-a',
          status: 'completed',
        },
        progress_projection: {
          current_stage: 'export_pptx',
          latest_events: [],
        },
        runtime_supervision: {
          health_status: 'completed',
        },
        escalation_record: {
          escalation_status: 'none',
        },
      }),
      getManagedRun: async () => ({
        ok: true,
        surface_kind: 'managed_run_record',
        summary: {
          managed_run_id: 'managed-a',
          status: 'completed',
          current_stage: 'export_pptx',
        },
        managed_run: {
          managed_run_id: 'managed-a',
          status: 'completed',
        },
        progress_projection: {
          current_stage: 'export_pptx',
          latest_events: [],
        },
        runtime_supervision: {
          health_status: 'completed',
        },
        escalation_record: {
          escalation_status: 'none',
        },
      }),
      superviseManagedRun: async () => ({
        ok: true,
        surface_kind: 'managed_supervision',
        summary: {
          managed_run_id: 'managed-a',
          status: 'completed',
          current_stage: 'export_pptx',
        },
        managed_run: {
          managed_run_id: 'managed-a',
          status: 'completed',
        },
        progress_projection: {
          current_stage: 'export_pptx',
          latest_events: [],
        },
        runtime_supervision: {
          health_status: 'completed',
        },
        escalation_record: {
          escalation_status: 'none',
        },
      }),
    },
  );

  const stored = await callGatewayTool(
    'get_managed_run',
    {
      workspaceRoot: '/tmp/redcube-workspace',
      managedRunId: 'managed-a',
    },
    {
      getManagedRun: async () => ({
        ok: true,
        surface_kind: 'managed_run_record',
        summary: {
          managed_run_id: 'managed-a',
          status: 'completed',
          current_stage: 'export_pptx',
        },
        managed_run: {
          managed_run_id: 'managed-a',
          status: 'completed',
        },
        progress_projection: {
          current_stage: 'export_pptx',
          latest_events: [],
        },
        runtime_supervision: {
          health_status: 'completed',
        },
        escalation_record: {
          escalation_status: 'none',
        },
      }),
    },
  );

  const supervised = await callGatewayTool(
    'supervise_managed_run',
    {
      workspaceRoot: '/tmp/redcube-workspace',
      managedRunId: 'managed-a',
    },
    {
      superviseManagedRun: async () => ({
        ok: true,
        surface_kind: 'managed_supervision',
        summary: {
          managed_run_id: 'managed-a',
          status: 'completed',
          current_stage: 'export_pptx',
        },
        managed_run: {
          managed_run_id: 'managed-a',
          status: 'completed',
        },
        progress_projection: {
          current_stage: 'export_pptx',
          latest_events: [],
        },
        runtime_supervision: {
          health_status: 'completed',
        },
        escalation_record: {
          escalation_status: 'none',
        },
      }),
    },
  );

  assert.equal(managed.surface_kind, 'managed_run');
  assert.equal(managed.summary.managed_run_id, 'managed-a');
  assert.equal(stored.surface_kind, 'managed_run_record');
  assert.equal(stored.summary.managed_run_id, 'managed-a');
  assert.equal(supervised.surface_kind, 'managed_supervision');
  assert.equal(supervised.runtime_supervision.health_status, 'completed');
});



test('callGatewayTool delegates review mutation gateway action', async () => {
  const result = await callGatewayTool(
    'apply_review_mutation',
    {
      workspaceRoot: '/tmp/redcube-workspace',
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      mutation: { type: 'request_changes' },
    },
    {
      applyReviewMutation: async (request) => ({
        ok: true,
        state: {
          topic_id: request.topicId,
          deliverable_id: request.deliverableId,
          current_status: 'blocked_for_revision',
        },
      }),
    },
  );

  assert.equal(result.ok, true);
  assert.equal(result.state.current_status, 'blocked_for_revision');
  assert.equal(result.state.deliverable_id, 'deck-a');
});

test('callGatewayTool can return operator-facing quality summary surfaces', async () => {
  const result = await callGatewayTool(
    'get_review_state',
    {
      workspaceRoot: '/tmp/redcube-workspace',
      topicId: 'topic-a',
      deliverableId: 'deck-a',
    },
    {
      getReviewState: async () => ({
        ok: true,
        surface_kind: 'review_state',
        state: { deliverable_id: 'deck-a' },
        quality_summary: {
          relative_quality_verdict: 'acceptable',
          baseline_promotion_state: 'promoted',
        },
      }),
    },
  );

  assert.equal(result.quality_summary.relative_quality_verdict, 'acceptable');
  assert.equal(result.quality_summary.baseline_promotion_state, 'promoted');
  assert.equal(result.surface_kind, 'review_state');
});

test('listGatewayTools descriptions mention quality-facing runtime watch and review mutation surfaces', () => {
  const tools = listGatewayTools();
  const reviewMutation = tools.find((tool) => tool.name === 'apply_review_mutation');
  const runtimeWatch = tools.find((tool) => tool.name === 'runtime_watch');
  const getDeliverableTool = tools.find((tool) => tool.name === 'get_deliverable');
  const runRouteTool = tools.find((tool) => tool.name === 'run_deliverable_route');

  assert.match(reviewMutation.description, /mutation/i);
  assert.match(runtimeWatch.description, /review-loop status/i);
  assert.doesNotMatch(getDeliverableTool.description, /from disk/i);
  assert.doesNotMatch(runRouteTool.description, /host-agent runtime adapter/i);
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
    new URL('../apps/redcube-mcp/src/server.js', import.meta.url),
  );
  const repoRoot = fileURLToPath(new URL('..', import.meta.url));
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
      name: 'runtime_watch',
      arguments: {
        workspaceRoot,
        topicId: 'topic-b',
        deliverableId: 'deck-a',
        runId: runResult.run.run_id,
      },
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
    new URL('../apps/redcube-mcp/src/server.js', import.meta.url),
  );
  const repoRoot = fileURLToPath(new URL('..', import.meta.url));
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
      name: 'audit_deliverable',
      arguments: {
        workspaceRoot,
        overlay: 'ppt_deck',
        topicId: 'topic-a',
        deliverableId: 'deck-a',
        mode: 'draft_new',
      },
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
    new URL('../apps/redcube-mcp/src/server.js', import.meta.url),
  );
  const repoRoot = fileURLToPath(new URL('..', import.meta.url));
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
      name: 'create_deliverable',
      arguments: {
        workspaceRoot: '/tmp/redcube-workspace',
        overlay: 'poster',
        profileId: 'default',
        topicId: 'topic-a',
        deliverableId: 'poster-a',
        title: '未知交付物',
        goal: '测试失败面',
      },
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
    new URL('../apps/redcube-mcp/src/server.js', import.meta.url),
  );
  const repoRoot = fileURLToPath(new URL('..', import.meta.url));
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
      name: 'create_deliverable',
      arguments: {
        workspaceRoot,
        overlay: 'ppt_deck',
        profileId: 'lecture_peer',
        topicId: 'topic-a',
        deliverableId: 'deck-a',
        title: '同行讲解 deck',
        goal: '向小同行解释问题、方法、证据与边界',
      },
    });

    assert.equal(created.structuredContent.deliverable.profile_id, 'lecture_peer');

    const preflight = await client.callTool({
      name: 'run_deliverable_route',
      arguments: {
        workspaceRoot,
        overlay: 'ppt_deck',
        topicId: 'topic-a',
        deliverableId: 'deck-a',
        route: 'storyline',
      },
    });

    assert.equal(preflight.structuredContent.ok, true);
    assert.equal(preflight.structuredContent.run.current_stage, 'storyline');

    const runResult = await client.callTool({
      name: 'run_deliverable_route',
      arguments: {
        workspaceRoot,
        overlay: 'ppt_deck',
        topicId: 'topic-a',
        deliverableId: 'deck-a',
        route: 'detailed_outline',
      },
    });

    assert.equal(runResult.structuredContent.ok, true);
    assert.equal(runResult.structuredContent.run.current_stage, 'detailed_outline');

    const runState = await client.callTool({
      name: 'get_run',
      arguments: {
        workspaceRoot,
        runId: runResult.structuredContent.run.run_id,
      },
    });

    assert.equal(runState.structuredContent.run.status, 'completed');
    assert.equal(runState.structuredContent.run.current_stage, 'detailed_outline');

    const watch = await client.callTool({
      name: 'runtime_watch',
      arguments: {
        workspaceRoot,
        topicId: 'topic-a',
        deliverableId: 'deck-a',
        runId: runResult.structuredContent.run.run_id,
      },
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
    new URL('../apps/redcube-mcp/src/server.js', import.meta.url),
  );
  const repoRoot = fileURLToPath(new URL('..', import.meta.url));
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
      name: 'create_deliverable',
      arguments: {
        workspaceRoot,
        overlay: 'xiaohongshu',
        profileId: 'standard_note',
        topicId: 'topic-a',
        deliverableId: 'note-a',
        title: '甲状腺门诊小红书科普',
        goal: '为门诊患者生成可发布的科普图文',
      },
    });

    assert.equal(created.structuredContent.deliverable.overlay, 'xiaohongshu');
    assert.equal(created.structuredContent.deliverable.profile_id, 'standard_note');

    const runResult = await client.callTool({
      name: 'run_deliverable_route',
      arguments: {
        workspaceRoot,
        overlay: 'xiaohongshu',
        topicId: 'topic-a',
        deliverableId: 'note-a',
        route: 'research',
      },
    });

    assert.equal(runResult.structuredContent.ok, true);
    assert.equal(runResult.structuredContent.run.current_stage, 'research');

    const runState = await client.callTool({
      name: 'get_run',
      arguments: {
        workspaceRoot,
        runId: runResult.structuredContent.run.run_id,
      },
    });

    assert.equal(runState.structuredContent.run.status, 'completed');
    assert.equal(runState.structuredContent.run.current_stage, 'research');
  } finally {
    await transport.close();
  }
  });
});
