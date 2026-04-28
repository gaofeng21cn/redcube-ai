// @ts-nocheck
import {
  assert,
  callGatewayTool,
  completeSourceReadiness,
  createDeliverable,
  intakeSource,
  listGatewayTools,
  mkdtempSync,
  os,
  path,
  runDeliverableRoute,
  runManagedDeliverable,
  test,
  withAction,
  withMockHermesUpstream,
  withOperation,
} from '../gateway-case-shared.ts';

test('callGatewayTool delegates product-entry gateway actions', async () => {
  const direct = await callGatewayTool(
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
  const federated = await callGatewayTool(
    'redcube_product_entry',
    withAction('invoke_federated_product_entry', {
      target_domain_id: 'redcube_ai',
      task_intent: 'run_managed_deliverable',
      entry_mode: 'opl_gateway',
      workspace_locator: { workspace_root: '/tmp/redcube-workspace' },
      runtime_session_contract: { runtime_owner: 'upstream_hermes_agent' },
      return_surface_contract: { surface_kind: 'product_entry' },
      entry_session_contract: { entry_session_id: 'session-a' },
      delivery_request: {
        deliverable_family: 'ppt_deck',
        topic_id: 'topic-a',
        deliverable_id: 'deck-a',
      },
    }),
    {
      invokeFederatedProductEntry: async (request) => ({
        ok: true,
        surface_kind: 'federated_product_entry',
        federated_product_entry_contract_id: 'opl_gateway_federated_product_entry',
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
        summary: {
          entry_session_id: request.entry_session_contract.entry_session_id,
        },
      }),
    },
  );
  const session = await callGatewayTool(
    'redcube_product_entry',
    withAction('get_product_entry_session', {
      entry_session_id: 'session-a',
    }),
    {
      getProductEntrySession: async (request) => ({
        ok: true,
        surface_kind: 'product_entry_session',
        entry_session: {
          entry_session_id: request.entry_session_id,
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
  const frontdesk = await callGatewayTool(
    'redcube_product_entry',
    withAction('get_product_frontdesk', {
      workspaceRoot: '/tmp/redcube-workspace',
    }),
    {
      getProductFrontdesk: async (request) => ({
        ok: true,
        surface_kind: 'product_frontdesk',
        frontdesk_surface: {
          command: 'redcube product frontdesk',
          workspace_root: request.workspaceRoot,
        },
      }),
    },
  );
  const start = await callGatewayTool(
    'redcube_product_entry',
    withAction('get_product_start', {
      workspaceRoot: '/tmp/redcube-workspace',
    }),
    {
      getProductStart: async (request) => ({
        ok: true,
        surface_kind: 'product_entry_start',
        workspace_locator: {
          workspace_root: request.workspaceRoot,
        },
      }),
    },
  );
  const preflight = await callGatewayTool(
    'redcube_product_entry',
    withAction('get_product_preflight', {
      workspaceRoot: '/tmp/redcube-workspace',
    }),
    {
      getProductPreflight: async (request) => ({
        ok: true,
        surface_kind: 'product_entry_preflight',
        workspace_locator: {
          workspace_root: request.workspaceRoot,
        },
      }),
    },
  );

  assert.equal(direct.surface_kind, 'product_entry');
  assert.equal(direct.entry_session.entry_session_id, 'session-a');
  assert.equal(direct.family_orchestration.action_graph_ref.ref, '/family_orchestration/action_graph');
  assert.equal(direct.family_orchestration.action_graph.graph_id, 'redcube_product_entry_overview_graph');
  assert.equal(federated.surface_kind, 'federated_product_entry');
  assert.equal(federated.summary.entry_session_id, 'session-a');
  assert.equal(federated.family_orchestration.human_gates[0].gate_id, 'redcube_operator_review_gate');
  assert.equal(session.surface_kind, 'product_entry_session');
  assert.equal(session.entry_session.entry_session_id, 'session-a');
  assert.equal(session.family_orchestration.resume_contract.surface_kind, 'product_entry_session');
  assert.equal(frontdesk.surface_kind, 'product_frontdesk');
  assert.equal(frontdesk.frontdesk_surface.command, 'redcube product frontdesk');
  assert.equal(start.surface_kind, 'product_entry_start');
  assert.equal(start.workspace_locator.workspace_root, '/tmp/redcube-workspace');
  assert.equal(preflight.surface_kind, 'product_entry_preflight');
  assert.equal(preflight.workspace_locator.workspace_root, '/tmp/redcube-workspace');
});

test('callGatewayTool can return normalized discovery surfaces for doctor and topic catalog', async () => {
  const doctor = await callGatewayTool(
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
  const topics = await callGatewayTool(
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

test('callGatewayTool delegates publication projection gateway action', async () => {
  const result = await callGatewayTool(
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

test('callGatewayTool can return operator-facing deliverable and route-run surfaces', async () => {
  const deliverable = await callGatewayTool(
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
  const routeRun = await callGatewayTool(
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

test('callGatewayTool delegates managed deliverable execution and managed run lookup', async () => {
  const managed = await callGatewayTool(
    'redcube_deliverable',
    withAction('run_managed_deliverable', {
      workspaceRoot: '/tmp/redcube-workspace',
      overlay: 'ppt_deck',
      topicId: 'topic-a',
      deliverableId: 'deck-a',
      userIntent: '给我一个最终 PPT',
    }),
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
    'redcube_deliverable',
    withAction('get_managed_run', {
      workspaceRoot: '/tmp/redcube-workspace',
      managedRunId: 'managed-a',
    }),
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
    'redcube_deliverable',
    withAction('supervise_managed_run', {
      workspaceRoot: '/tmp/redcube-workspace',
      managedRunId: 'managed-a',
    }),
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

test('callGatewayTool can return operator-facing quality summary surfaces', async () => {
  const result = await callGatewayTool(
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

test('listGatewayTools descriptions mention quality-facing runtime watch and review mutation surfaces', () => {
  const tools = listGatewayTools();
  const reviewTool = tools.find((tool) => tool.name === 'redcube_review');
  const deliverableTool = tools.find((tool) => tool.name === 'redcube_deliverable');
  const sourcesTool = tools.find((tool) => tool.name === 'redcube_sources');
  const workspaceTool = tools.find((tool) => tool.name === 'redcube_workspace');
  const productEntryTool = tools.find((tool) => tool.name === 'redcube_product_entry');

  assert.match(reviewTool.description, /mutation/i);
  assert.match(reviewTool.description, /runtime watch/i);
  assert.match(deliverableTool.description, /route/i);
  assert.match(sourcesTool.description, /augmentation/i);
  assert.match(workspaceTool.description, /topic/i);
  assert.match(productEntryTool.description, /OPL bridge/i);
});
