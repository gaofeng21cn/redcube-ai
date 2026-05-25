// @ts-nocheck
import {
  assert,
  callDomainTool,
  completeSourceReadiness,
  createDeliverable,
  intakeSource,
  listDomainTools,
  mkdtempSync,
  os,
  path,
  runDeliverableRoute,
  test,
  withAction,
  withMockCodexRuntime,
  withOperation,
} from '../product-domain-action-case-shared.ts';

test('callDomainTool keeps product-entry MCP limited to direct domain entry targets', async () => {
  const direct = await callDomainTool(
    'redcube_product_entry',
    withAction('invoke_product_entry', {
      workspace_locator: { workspace_root: '/tmp/redcube-workspace' },
      entry_session_contract: { entry_session_id: 'session-a' },
      delivery_request: {
        deliverable_family: 'ppt_deck',
        topic_id: 'topic-a',
        deliverable_id: 'deck-a',
      },
    }),
    {
      invokeProductEntry: async (request) => ({
        ok: true,
        surface_kind: 'product_entry',
        product_entry_contract_id: 'redcube_product_entry',
        entry_session: {
          entry_session_id: request.entry_session_contract.entry_session_id,
        },
        family_orchestration: {
          action_graph_ref: {
            ref_kind: 'json_pointer',
            ref: '/family_orchestration/action_graph',
          },
          action_graph: {
            graph_id: 'redcube_product_entry_overview_graph',
          },
          human_gates: [{ gate_id: 'redcube_operator_review_gate' }],
          resume_contract: {
            surface_kind: 'product_entry_session',
            session_locator_field: 'entry_session.entry_session_id',
          },
        },
      }),
    },
  );
  assert.equal(direct.surface_kind, 'product_entry');
  assert.equal(direct.entry_session.entry_session_id, 'session-a');
  assert.equal(direct.family_orchestration.action_graph_ref.ref, '/family_orchestration/action_graph');
  assert.equal(direct.family_orchestration.action_graph.graph_id, 'redcube_product_entry_overview_graph');
  for (const action of [
    'dispatch_domain_action_adapter',
    'get_product_entry_session',
    'get_product_status',
    'get_product_start',
    'get_product_preflight',
  ]) {
    await assert.rejects(
      () => callDomainTool('redcube_product_entry', withAction(action, {}), {}),
      new RegExp(`Unsupported redcube_product_entry action: ${action}`),
    );
  }
});

test('callDomainTool can return normalized discovery surfaces for doctor and topic catalog', async () => {
  const doctor = await callDomainTool(
    'redcube_workspace',
    withAction('doctor_workspace', { workspaceRoot: '/tmp/redcube-workspace' }),
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
  const topics = await callDomainTool(
    'redcube_workspace',
    withAction('list_topics', { workspaceRoot: '/tmp/redcube-workspace' }),
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

test('callDomainTool delegates publication projection product/domain action', async () => {
  const result = await callDomainTool(
    'redcube_review',
    withAction('get_publication_projection', {
      workspaceRoot: '/tmp/redcube-workspace',
      topicId: 'topic-a',
    }),
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

test('callDomainTool can return operator-facing deliverable and route-run surfaces', async () => {
  const deliverable = await callDomainTool(
    'redcube_deliverable',
    withAction('get_deliverable', {
      workspaceRoot: '/tmp/redcube-workspace',
      topicId: 'topic-a',
      deliverableId: 'deck-a',
    }),
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
  const routeRun = await callDomainTool(
    'redcube_deliverable',
    withAction('run_deliverable_route', {
      workspaceRoot: '/tmp/redcube-workspace',
      overlay: 'ppt_deck',
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      route: 'storyline',
    }),
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

test('callDomainTool maps OPL stage-plan execution to the domain entry', async () => {
  const stagePlan = await callDomainTool(
    'redcube_deliverable',
    withAction('run_opl_stage_execution_plan', {
      workspaceRoot: '/tmp/redcube-workspace',
      overlay: 'ppt_deck',
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      userIntent: '给我一个最终 PPT',
    }),
    {
      invokeOplStageExecutionPlan: async () => ({
        ok: true,
        surface_kind: 'domain_entry',
        summary: {
          actual_surface_kind: 'opl_stage_execution_plan',
          target_handle: 'opl-stage-execution-plan:ppt_deck:topic-a:deck-a:auto-to-terminal',
        },
        result_surface: {
          surface_kind: 'opl_stage_execution_plan',
          plan_ref: 'opl-stage-execution-plan:ppt_deck:topic-a:deck-a:auto-to-terminal',
          execution_model: {
            repo_local_stage_runner_active_caller: false,
          },
        },
      }),
    },
  );

  assert.equal(stagePlan.surface_kind, 'domain_entry');
  assert.equal(stagePlan.summary.actual_surface_kind, 'opl_stage_execution_plan');
  assert.equal(stagePlan.result_surface.execution_model.repo_local_stage_runner_active_caller, false);
});



test('callDomainTool delegates review mutation product/domain action', async () => {
  const result = await callDomainTool(
    'redcube_review',
    withAction('apply_review_mutation', {
      workspaceRoot: '/tmp/redcube-workspace',
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      mutation: { type: 'request_changes' },
    }),
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

test('callDomainTool can return operator-facing quality summary surfaces', async () => {
  const result = await callDomainTool(
    'redcube_review',
    withAction('get_review_state', {
      workspaceRoot: '/tmp/redcube-workspace',
      topicId: 'topic-a',
      deliverableId: 'deck-a',
    }),
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

test('listDomainTools descriptions keep review mutation and product-entry domain-handler ownership visible', () => {
  const tools = listDomainTools();
  const reviewTool = tools.find((tool) => tool.name === 'redcube_review');
  const deliverableTool = tools.find((tool) => tool.name === 'redcube_deliverable');
  const sourcesTool = tools.find((tool) => tool.name === 'redcube_sources');
  const workspaceTool = tools.find((tool) => tool.name === 'redcube_workspace');
  const productEntryTool = tools.find((tool) => tool.name === 'redcube_product_entry');

  assert.match(reviewTool.description, /mutation/i);
  assert.match(reviewTool.description, /runtime watch default wrapper is owned by OPL/i);
  assert.match(deliverableTool.description, /route/i);
  assert.match(sourcesTool.description, /augmentation/i);
  assert.match(workspaceTool.description, /topic/i);
  assert.match(productEntryTool.description, /domain-handler target/i);
  assert.match(productEntryTool.description, /wrappers are owned by OPL/i);
});
