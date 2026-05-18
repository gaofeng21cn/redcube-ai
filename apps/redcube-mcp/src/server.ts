#!/usr/bin/env node

import { pathToFileURL } from 'node:url';

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  auditDeliverable,
  applyReviewMutation,
  createDeliverable,
  doctorWorkspace,
  getDeliverable,
  invokeDomainEntry,
  invokeProductEntry,
  getProductEntryManifest,
  getProductEntrySession,
  getProductStatus,
  getProductStart,
  getProductPreflight,
  exportProductSidecar,
  dispatchProductSidecar,
  getOverlayCatalog,
  getPublicationProjection,
  getReviewState,
  getRun,
  intakeSource,
  researchSource,
  prepareSourceAugmentation,
  prepareSourceAugmentationResult,
  writeSourceAugmentationResult,
  executeSourceAugmentation,
  listTopics,
  reviewRenderOutput,
  runDeliverableRoute,
  runtimeWatch,
  buildRedCubeActionMetadata,
} from '@redcube/gateway';
import * as z from 'zod/v4';

type DomainActionMap = Record<string, ((args: Record<string, unknown>) => Promise<unknown>) | ((args?: unknown) => Promise<unknown>)>;
type ToolName = keyof typeof TOOL_ROUTE_DEFINITIONS;
type ToolArgs = Record<string, unknown>;

export const DEFAULT_DOMAIN_ACTIONS = {
  doctorWorkspace,
  listTopics,
  getOverlayCatalog,
  invokeDomainEntry,
  invokeProductEntry,
  getProductEntryManifest,
  getProductEntrySession,
  getProductStatus,
  getProductStart,
  getProductPreflight,
  exportProductSidecar,
  dispatchProductSidecar,
  createDeliverable,
  getDeliverable,
  getPublicationProjection,
  intakeSource,
  researchSource,
  prepareSourceAugmentation,
  prepareSourceAugmentationResult,
  writeSourceAugmentationResult,
  executeSourceAugmentation,
  auditDeliverable,
  reviewRenderOutput,
  invokeManagedDeliverableStagePlan,
  runDeliverableRoute,
  getRun,
  runtimeWatch,
  getReviewState,
  applyReviewMutation,
};

export const MCP_SURFACE_OWNER_BOUNDARY = Object.freeze({
  surface_kind: 'mcp_surface_owner_boundary',
  generated_interface_owner: 'one-person-lab',
  domain_handler_owner: 'redcube_ai',
  repo_local_redcube_mcp_role: 'domain_handler_target_or_direct_protocol_adapter_only',
  generic_session_shell_owner: 'one-person-lab',
  generic_workbench_owner: 'one-person-lab',
  default_managed_supervision_owner: 'one-person-lab',
  managed_supervision_route_role: 'retired_from_public_mcp_surface',
  source_route_role: 'opl_generated_source_wrapper_invokes_rca_source_readiness_handler',
  workbench_route_role: 'opl_generated_workbench_consumes_rca_operator_evidence_refs',
  redcube_mcp_is_unified_metadata_owner: false,
});

const ACTION_STRING = z.string().describe('Grouped task action selector.');
const OPERATION_STRING = z.string().describe('Grouped source operation selector.');
const WORKSPACE_ROOT = z.string().describe('Absolute workspace root path.');
const OPTIONAL_WORKSPACE_ROOT = z.string().optional().describe('Absolute workspace root path.');
const TOPIC_ID = z.string().describe('Topic identifier.');
const OPTIONAL_TOPIC_ID = z.string().optional().describe('Topic identifier.');
const DELIVERABLE_ID = z.string().describe('Deliverable identifier.');
const OPTIONAL_DELIVERABLE_ID = z.string().optional().describe('Deliverable identifier.');
const OVERLAY_ID = z.string().describe('Overlay id.');
const OPTIONAL_OVERLAY_ID = z.string().optional().describe('Overlay id.');
const STRING_ARRAY_OR_CSV = z.union([z.string(), z.array(z.string())]);
const PASSTHROUGH_OBJECT = z.object({}).passthrough();

const TOOL_ROUTE_DEFINITIONS = {
  redcube_workspace: {
    selector: 'action',
    routes: {
      doctor_workspace: 'doctorWorkspace',
      list_topics: 'listTopics',
      get_overlay_catalog: 'getOverlayCatalog',
    },
  },
  redcube_sources: {
    selector: 'operation',
    routes: {
      intake_source: 'intakeSource',
      source_research: 'researchSource',
      prepare_source_augmentation: 'prepareSourceAugmentation',
      prepare_source_augmentation_result: 'prepareSourceAugmentationResult',
      write_source_augmentation_result: 'writeSourceAugmentationResult',
      execute_source_augmentation: 'executeSourceAugmentation',
    },
  },
  redcube_deliverable: {
    selector: 'action',
    routes: {
      create_deliverable: 'createDeliverable',
      get_deliverable: 'getDeliverable',
      run_managed_deliverable: 'invokeManagedDeliverableStagePlan',
      run_deliverable_route: 'runDeliverableRoute',
      get_run: 'getRun',
    },
  },
  redcube_review: {
    selector: 'action',
    routes: {
      get_publication_projection: 'getPublicationProjection',
      audit_deliverable: 'auditDeliverable',
      review_render_output: 'reviewRenderOutput',
      get_review_state: 'getReviewState',
      apply_review_mutation: 'applyReviewMutation',
      runtime_watch: 'runtimeWatch',
    },
  },
  redcube_product_entry: {
    selector: 'action',
    routes: {
    },
  },
};

const ACTION_METADATA = buildRedCubeActionMetadata();
const MCP_TOOL_METADATA = new Map(ACTION_METADATA.mcp_tools.map((tool) => [tool.name, tool]));
const MCP_ROUTE_METADATA = Object.fromEntries(
  Object.entries(ACTION_METADATA.mcp_route_definitions).map(([name, definition]) => {
    const base = TOOL_ROUTE_DEFINITIONS[name as ToolName];
    const catalogRoutes = definition.routes || {};
    const routes = Object.keys(catalogRoutes).length > 0
      ? catalogRoutes
      : base?.routes || {};
    return [
      name,
      {
        selector: definition.selector || base?.selector,
        routes,
      },
    ];
  }),
);

function getMcpToolProjection(name: string) {
  return MCP_TOOL_METADATA.get(name)?.action_catalog_projection;
}

export const TOOL_DEFINITIONS = [
  {
    name: 'redcube_workspace',
    description: MCP_TOOL_METADATA.get('redcube_workspace')?.description
      || 'Grouped workspace/topic discovery surface for workspace doctor, topic catalog, and overlay catalog actions.',
    action_catalog_projection: getMcpToolProjection('redcube_workspace'),
    inputSchema: {
      action: ACTION_STRING,
      workspaceRoot: WORKSPACE_ROOT.optional(),
    },
  },
  {
    name: 'redcube_sources',
    description: MCP_TOOL_METADATA.get('redcube_sources')?.description
      || 'Grouped source intake/research and augmentation surface for canonical source readiness and augmentation orchestration.',
    action_catalog_projection: getMcpToolProjection('redcube_sources'),
    inputSchema: {
      operation: OPERATION_STRING,
      workspaceRoot: WORKSPACE_ROOT.optional(),
      topicId: TOPIC_ID.optional(),
      title: z.string().optional().describe('Topic title.'),
      brief: z.string().optional().describe('Short textual brief.'),
      keywords: STRING_ARRAY_OR_CSV.optional().describe('Keyword list or comma-separated keywords.'),
      sourceFiles: STRING_ARRAY_OR_CSV.optional().describe('Absolute source file paths or comma-separated file list.'),
      modeHint: z.string().optional().describe('Optional intake mode hint for source intake classification.'),
      inputFile: z.string().optional().describe('Absolute payload JSON file path.'),
      payloadFile: z.string().optional().describe('Absolute payload JSON file path.'),
      result: PASSTHROUGH_OBJECT.optional().describe('Optional structured payload object.'),
    },
  },
  {
    name: 'redcube_deliverable',
    description: MCP_TOOL_METADATA.get('redcube_deliverable')?.description
      || 'Grouped deliverable lifecycle execution surface for create/get/run and OPL stage-plan handoff across one deliverable boundary.',
    action_catalog_projection: getMcpToolProjection('redcube_deliverable'),
    inputSchema: {
      action: ACTION_STRING,
      workspaceRoot: WORKSPACE_ROOT.optional(),
      overlay: OVERLAY_ID.optional(),
      profileId: z.string().optional().describe('Overlay profile id.'),
      topicId: TOPIC_ID.optional(),
      deliverableId: DELIVERABLE_ID.optional(),
      title: z.string().optional().describe('Deliverable title.'),
      goal: z.string().optional().describe('Deliverable goal.'),
      route: z.string().optional().describe('Route name.'),
      adapter: z.string().optional().describe('Executor adapter id.'),
      userIntent: z.string().optional().describe('User-facing request.'),
      stopAfterStage: z.string().optional().describe('Optional explicit stage boundary to stop after.'),
      mode: z.string().optional().describe('Execution mode such as draft_new or optimize_existing.'),
      baselineDeliverableId: z.string().optional().describe('Optional approved baseline deliverable id.'),
      managedRunId: z.string().optional().describe('Managed run identifier.'),
      runId: z.string().optional().describe('Run identifier.'),
    },
  },
  {
    name: 'redcube_review',
    description: MCP_TOOL_METADATA.get('redcube_review')?.description
      || 'Grouped deliverable boundary review surface for publication projection, audit, review mutation, and runtime watch actions.',
    action_catalog_projection: getMcpToolProjection('redcube_review'),
    inputSchema: {
      action: ACTION_STRING,
      workspaceRoot: OPTIONAL_WORKSPACE_ROOT,
      overlay: OPTIONAL_OVERLAY_ID,
      topicId: OPTIONAL_TOPIC_ID,
      deliverableId: OPTIONAL_DELIVERABLE_ID,
      mode: z.string().optional().describe('Audit mode such as optimize_existing or draft_new.'),
      baselineDeliverableId: z.string().optional().describe('Approved baseline deliverable id when optimizing existing outputs.'),
      checks: z.record(z.string(), z.unknown()).optional().describe('Structured render review checks.'),
      mutation: PASSTHROUGH_OBJECT.optional().describe('Structured review mutation payload.'),
      runId: z.string().optional().describe('Run identifier on the canonical run boundary.'),
      run: PASSTHROUGH_OBJECT.optional().describe('Preloaded run envelope to inspect when already resolved in-process.'),
    },
  },
  {
    name: 'redcube_product_entry',
    description: MCP_TOOL_METADATA.get('redcube_product_entry')?.description
      || 'Grouped product-entry surface for status, start, preflight, direct, session, manifest, sidecar, and domain-entry actions.',
    action_catalog_projection: getMcpToolProjection('redcube_product_entry'),
    inputSchema: {
      action: ACTION_STRING,
      target_domain_id: z.string().optional().describe('Target domain id. Must be redcube_ai.'),
      task_intent: z.string().optional().describe('Task intent such as run_managed_deliverable or run_deliverable_route.'),
      entry_mode: z.string().optional().describe('Required entry mode such as opl_hosted or service_call.'),
      workspace_root: z.string().optional().describe('Absolute workspace root path.'),
      workspaceRoot: z.string().optional().describe('Absolute workspace root path.'),
      workspace_locator: z.object({
        workspace_root: z.string().describe('Absolute workspace root path.'),
      }).optional().describe('Machine-readable workspace locator.'),
      runtime_session_contract: z.object({
        runtime_owner: z.string().describe('Runtime owner.'),
        adapter_surface: z.string().optional().describe('Adapter surface identifier.'),
        session_mode: z.string().optional().describe('Session mode such as ephemeral_run.'),
      }).optional().describe('Runtime session contract.'),
      return_surface_contract: z.object({
        surface_kind: z.string().describe('Required return surface.'),
      }).optional().describe('Requested return surface contract.'),
      domain_payload: z.object({
        deliverable_family: z.string().describe('RedCube deliverable family / overlay id.'),
        topic_id: z.string().describe('Topic identifier.'),
        deliverable_id: z.string().describe('Deliverable identifier.'),
        route: z.string().optional().describe('Route name when task_intent is run_deliverable_route.'),
        adapter: z.string().optional().describe('Optional executor adapter id.'),
        user_intent: z.string().optional().describe('Optional user intent for managed execution.'),
        lifecycle_policy: z.string().optional().describe('Optional lifecycle policy such as operator_review_after_plan.'),
        stop_after_stage: z.string().optional().describe('Optional explicit stop-after stage.'),
        mode: z.string().optional().describe('Execution mode such as draft_new.'),
        baseline_deliverable_id: z.string().optional().describe('Optional baseline deliverable id.'),
      }).optional().describe('RedCube visual-domain payload.'),
      entry_session_contract: z.object({
        entry_session_id: z.string().describe('Durable product-entry session identifier.'),
      }).optional().describe('Product-entry session contract.'),
      entry_session_id: z.string().optional().describe('Durable product-entry session identifier.'),
      delivery_request: z.object({
        deliverable_family: z.string().optional().describe('RedCube deliverable family / overlay id.'),
        topic_id: z.string().optional().describe('Topic identifier.'),
        deliverable_id: z.string().optional().describe('Deliverable identifier.'),
        profile_id: z.string().optional().describe('Profile id when deliverable creation is required.'),
        title: z.string().optional().describe('Deliverable title when deliverable creation is required.'),
        goal: z.string().optional().describe('Deliverable goal when deliverable creation is required.'),
        route: z.string().optional().describe('Route name when task_intent is run_deliverable_route.'),
        adapter: z.string().optional().describe('Optional executor adapter id.'),
        user_intent: z.string().optional().describe('Optional user request for managed execution.'),
        lifecycle_policy: z.string().optional().describe('Optional lifecycle policy such as operator_review_after_plan.'),
        stop_after_stage: z.string().optional().describe('Optional explicit stop-after stage.'),
        mode: z.string().optional().describe('Execution mode such as draft_new.'),
        baseline_deliverable_id: z.string().optional().describe('Optional baseline deliverable id when optimizing existing outputs.'),
      }).optional().describe('Product-entry delivery request.'),
    },
  },
];

export function getDomainActions(overrides = {}) {
  return {
    ...DEFAULT_DOMAIN_ACTIONS,
    ...overrides,
  };
}

export async function invokeManagedDeliverableStagePlan(args: Record<string, unknown>) {
  return invokeDomainEntry({
    target_domain_id: 'redcube_ai',
    task_intent: 'run_managed_deliverable',
    entry_mode: 'mcp_deliverable_action',
    workspace_locator: {
      workspace_root: String(args.workspaceRoot || args.workspace_root || ''),
    },
    runtime_session_contract: {
      runtime_owner: 'configured_family_runtime_provider',
      session_mode: 'ephemeral_run',
    },
    return_surface_contract: {
      surface_kind: 'opl_stage_execution_plan',
    },
    domain_payload: {
      deliverable_family: String(args.overlay || args.deliverable_family || ''),
      topic_id: String(args.topicId || args.topic_id || ''),
      deliverable_id: String(args.deliverableId || args.deliverable_id || ''),
      route: typeof args.route === 'string' ? args.route : undefined,
      adapter: typeof args.adapter === 'string' ? args.adapter : undefined,
      user_intent: typeof args.userIntent === 'string' ? args.userIntent : String(args.user_intent || ''),
      stop_after_stage: typeof args.stopAfterStage === 'string' ? args.stopAfterStage : String(args.stop_after_stage || ''),
      mode: typeof args.mode === 'string' ? args.mode : 'draft_new',
      baseline_deliverable_id: typeof args.baselineDeliverableId === 'string'
        ? args.baselineDeliverableId
        : String(args.baseline_deliverable_id || ''),
    },
  });
}

function findToolDefinition(name: string) {
  return TOOL_DEFINITIONS.find((tool) => tool.name === name) || null;
}

function toToolResponse(result: unknown) {
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(result, null, 2),
      },
    ],
    structuredContent: result,
  };
}

function toToolError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return {
    content: [
      {
        type: 'text',
        text: message,
      },
    ],
    structuredContent: {
      ok: false,
      error_kind: 'domain_tool_error',
      recommended_action: 'inspect_tool_request',
      error: message,
    },
    isError: true,
  };
}

export function listDomainTools() {
  return TOOL_DEFINITIONS.map(({ name, description }) => ({
    name,
    description,
    generated_interface_owner: 'one-person-lab',
    domain_handler_owner: 'redcube_ai',
    repo_local_handler_target_only: true,
  }));
}

export function getToolDefinitions() {
  return TOOL_DEFINITIONS;
}

export async function callDomainTool(name: string, args: ToolArgs, deps: Partial<DomainActionMap> = {}) {
  const definition = findToolDefinition(name);
  if (!definition) {
    throw new Error(`Unknown tool: ${name}`);
  }

  const routeDefinition = MCP_ROUTE_METADATA[name as ToolName] || TOOL_ROUTE_DEFINITIONS[name as ToolName];
  if (!routeDefinition) {
    throw new Error(`Tool routing not configured: ${name}`);
  }

  const selectorValue = args?.[routeDefinition.selector];
  if (typeof selectorValue !== 'string') {
    throw new Error(`${name} requires ${routeDefinition.selector}.`);
  }

  const actionKey = (routeDefinition.routes as Record<string, string>)[selectorValue];
  if (!actionKey) {
    throw new Error(`Unsupported ${name} ${routeDefinition.selector}: ${selectorValue}`);
  }

  const forwardedArgs = {
    ...args,
  };
  delete forwardedArgs[routeDefinition.selector];

  const actions = getDomainActions(deps) as Partial<DomainActionMap>;
  const action = actions[actionKey];
  if (typeof action !== 'function') {
    throw new Error(`Domain action not configured: ${actionKey}`);
  }

  return action(forwardedArgs);
}

export function createMcpServer(deps: Partial<DomainActionMap> = {}) {
  const server = new McpServer({
    name: 'redcube-gateway',
    version: '0.1.0',
  });

  for (const tool of TOOL_DEFINITIONS) {
    server.registerTool(
      tool.name,
      {
        description: tool.description,
        inputSchema: tool.inputSchema as unknown as Record<string, z.ZodType>,
      },
      (async (args: ToolArgs) => {
        try {
          const result = await callDomainTool(tool.name, args, deps);
          return toToolResponse(result);
        } catch (error) {
          return toToolError(error);
        }
      }) as any,
    );
  }

  return server;
}

export async function runStdioServer(deps: Partial<DomainActionMap> = {}) {
  const server = createMcpServer(deps);
  const transport = new StdioServerTransport();
  await server.connect(transport);
  return server;
}

function isDirectExecution() {
  if (!process.argv[1]) {
    return false;
  }

  return import.meta.url === pathToFileURL(process.argv[1]).href;
}

if (isDirectExecution()) {
  runStdioServer().catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.stack || error.message : String(error)}\n`);
    process.exit(1);
  });
}
