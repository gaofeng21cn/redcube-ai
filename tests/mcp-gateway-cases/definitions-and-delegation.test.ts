// @ts-nocheck
import {
  assert,
  callGatewayTool,
  Client,
  completeSourceReadiness,
  createDeliverable,
  fileURLToPath,
  getToolDefinitions,
  listGatewayTools,
  mkdtempSync,
  os,
  path,
  runDeliverableRoute,
  StdioClientTransport,
  test,
  unlinkSync,
  withAction,
  withMockHermesUpstream,
  withOperation,
} from '../gateway-case-shared.ts';

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
  assert.equal(productEntry?.description.includes('status'), true);
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

    const status = await client.callTool({
      name: 'redcube_product_entry',
      arguments: withAction('get_product_status', { workspaceRoot }),
    });
    const start = await client.callTool({
      name: 'redcube_product_entry',
      arguments: withAction('get_product_start', { workspaceRoot }),
    });
    const preflight = await client.callTool({
      name: 'redcube_product_entry',
      arguments: withAction('get_product_preflight', { workspaceRoot }),
    });

    assert.equal(status.isError, undefined);
    assert.equal(status.structuredContent.surface_kind, 'product_status');
    assert.equal(status.structuredContent.entry_status_surface.command, 'redcube product status');
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
