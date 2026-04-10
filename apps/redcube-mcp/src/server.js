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
  getManagedRun,
  superviseManagedRun,
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
  runManagedDeliverable,
  runtimeWatch,
} from '@redcube/gateway';
import * as z from 'zod/v4';

export const DEFAULT_GATEWAY_ACTIONS = {
  doctorWorkspace,
  listTopics,
  getOverlayCatalog,
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
  runManagedDeliverable,
  getManagedRun,
  superviseManagedRun,
  runDeliverableRoute,
  getRun,
  runtimeWatch,
  getReviewState,
  applyReviewMutation,
};

export const TOOL_DEFINITIONS = [
  {
    name: 'doctor',
    description: 'Inspect workspace contract and canonical directories on the diagnostic workspace surface.',
    actionKey: 'doctorWorkspace',
    inputSchema: {
      workspaceRoot: z.string().describe('Absolute workspace root path.'),
    },
  },
  {
    name: 'list_topics',
    description: 'List canonical topic records from the workspace.',
    actionKey: 'listTopics',
    inputSchema: {
      workspaceRoot: z.string().describe('Absolute workspace root path.'),
    },
  },
  {
    name: 'get_overlay_catalog',
    description: 'Read registry-driven overlay/profile discovery surface for onboarding.',
    actionKey: 'getOverlayCatalog',
    inputSchema: {},
  },
  {
    name: 'intake_source',
    description: 'Hydrate brief / keywords / source files into canonical shared source artifacts as the direct bootstrap writer.',
    actionKey: 'intakeSource',
    inputSchema: {
      workspaceRoot: z.string().describe('Absolute workspace root path.'),
      topicId: z.string().describe('Topic identifier.'),
      title: z.string().optional().describe('Topic title.'),
      brief: z.string().optional().describe('Short textual brief.'),
      keywords: z.union([z.string(), z.array(z.string())]).optional().describe('Keyword list or comma-separated keywords.'),
      sourceFiles: z.union([z.string(), z.array(z.string())]).optional().describe('Absolute source file paths or comma-separated file list.'),
      modeHint: z.string().optional().describe('Optional intake mode hint such as legacy_import.'),
    },
  },
  {
    name: 'source_research',
    description: 'Run the formal Source Readiness / Deep Research orchestration surface from intake through augmentation or canonical result staging until planning_ready or explicit staging.',
    actionKey: 'researchSource',
    inputSchema: {
      workspaceRoot: z.string().describe('Absolute workspace root path.'),
      topicId: z.string().describe('Topic identifier.'),
      title: z.string().optional().describe('Topic title.'),
      brief: z.string().optional().describe('Short textual brief.'),
      keywords: z.union([z.string(), z.array(z.string())]).optional().describe('Keyword list or comma-separated keywords.'),
      sourceFiles: z.union([z.string(), z.array(z.string())]).optional().describe('Absolute source file paths or comma-separated file list.'),
      modeHint: z.string().optional().describe('Optional intake mode hint such as legacy_import.'),
      payloadFile: z.string().optional().describe('Optional payload JSON file for result_file route.'),
      result: z.object({}).passthrough().optional().describe('Optional structured payload object for result_file route.'),
    },
  },
  {
    name: 'prepare_source_augmentation',
    description: 'Build the canonical Source Augmentation / Deep Research contract from current source readiness.',
    actionKey: 'prepareSourceAugmentation',
    inputSchema: {
      workspaceRoot: z.string().describe('Absolute workspace root path.'),
      topicId: z.string().describe('Topic identifier.'),
      title: z.string().optional().describe('Optional topic title override.'),
    },
  },
  {
    name: 'prepare_source_augmentation_result',
    description: 'Prepare the canonical result scaffold and target artifact path for an agent-native Source Augmentation / Deep Research route.',
    actionKey: 'prepareSourceAugmentationResult',
    inputSchema: {
      workspaceRoot: z.string().describe('Absolute workspace root path.'),
      topicId: z.string().describe('Topic identifier.'),
    },
  },
  {
    name: 'write_source_augmentation_result',
    description: 'Validate and write a Source Augmentation / Deep Research payload onto the canonical result artifact surface.',
    actionKey: 'writeSourceAugmentationResult',
    inputSchema: {
      workspaceRoot: z.string().describe('Absolute workspace root path.'),
      topicId: z.string().describe('Topic identifier.'),
      inputFile: z.string().optional().describe('Absolute payload JSON file path.'),
      payloadFile: z.string().optional().describe('Absolute payload JSON file path.'),
      result: z.object({}).passthrough().optional().describe('Structured payload object when not using payloadFile.'),
    },
  },
  {
    name: 'execute_source_augmentation',
    description: 'Execute the configured Source Augmentation / Deep Research executor and rewrite canonical source truth.',
    actionKey: 'executeSourceAugmentation',
    inputSchema: {
      workspaceRoot: z.string().describe('Absolute workspace root path.'),
      topicId: z.string().describe('Topic identifier.'),
    },
  },
  {
    name: 'create_deliverable',
    description: 'Create a canonical deliverable record under a topic.',
    actionKey: 'createDeliverable',
    inputSchema: {
      workspaceRoot: z.string().describe('Absolute workspace root path.'),
      overlay: z.string().describe('Overlay id, for example ppt_deck.'),
      profileId: z.string().describe('Overlay profile id, for example lecture_student.'),
      topicId: z.string().describe('Topic identifier.'),
      deliverableId: z.string().describe('Deliverable identifier.'),
      title: z.string().describe('Deliverable title.'),
      goal: z.string().describe('Deliverable goal expressed in business/task terms.'),
    },
  },
  {
    name: 'get_deliverable',
    description: 'Read one visual deliverable record with product-facing metadata.',
    actionKey: 'getDeliverable',
    inputSchema: {
      workspaceRoot: z.string().describe('Absolute workspace root path.'),
      topicId: z.string().describe('Topic identifier.'),
      deliverableId: z.string().describe('Deliverable identifier.'),
    },
  },
  {
    name: 'get_publication_projection',
    description: 'Read topic boundary publication projection rebuilt from canonical publish truth.',
    actionKey: 'getPublicationProjection',
    inputSchema: {
      workspaceRoot: z.string().describe('Absolute workspace root path.'),
      topicId: z.string().describe('Topic identifier.'),
    },
  },
  {
    name: 'audit_deliverable',
    description: 'Run preflight audit gates before higher-cost routes.',
    actionKey: 'auditDeliverable',
    inputSchema: {
      workspaceRoot: z.string().optional().describe('Absolute workspace root path when auditing a concrete deliverable surface.'),
      overlay: z.string().describe('Overlay id.'),
      topicId: z.string().optional().describe('Topic identifier when auditing a concrete deliverable surface.'),
      deliverableId: z.string().optional().describe('Deliverable identifier when auditing a concrete deliverable surface.'),
      mode: z.string().describe('Audit mode such as optimize_existing or draft_new.'),
      baselineDeliverableId: z.string().optional().describe('Approved baseline deliverable id when optimizing existing outputs.'),
    },
  },
  {
    name: 'review_render_output',
    description: 'Review rendered deliverable checks and decide rerun stage.',
    actionKey: 'reviewRenderOutput',
    inputSchema: {
      workspaceRoot: z.string().optional().describe('Absolute workspace root path when loading hydrated contract from disk.'),
      overlay: z.string().describe('Overlay id.'),
      topicId: z.string().optional().describe('Topic identifier when loading hydrated contract from disk.'),
      deliverableId: z.string().optional().describe('Deliverable identifier when loading hydrated contract from disk.'),
      checks: z.record(z.string(), z.unknown()).describe('Structured render review checks.'),
    },
  },
  {
    name: 'run_managed_deliverable',
    description: 'Run the managed control plane from the current deliverable through the remaining stages.',
    actionKey: 'runManagedDeliverable',
    inputSchema: {
      workspaceRoot: z.string().describe('Absolute workspace root path.'),
      overlay: z.string().describe('Overlay id.'),
      topicId: z.string().describe('Topic identifier.'),
      deliverableId: z.string().describe('Deliverable identifier.'),
      adapter: z.string().optional().describe('Executor adapter id.'),
      userIntent: z.string().optional().describe('User-facing request, for example 给我一个最终 PPT。'),
      stopAfterStage: z.string().optional().describe('Optional explicit stage boundary to stop after.'),
      mode: z.string().optional().describe('Execution mode such as draft_new or optimize_existing.'),
      baselineDeliverableId: z.string().optional().describe('Optional approved baseline deliverable id when optimizing existing outputs.'),
    },
  },
  {
    name: 'get_managed_run',
    description: 'Read a persisted managed execution record and controller-owned progress projection.',
    actionKey: 'getManagedRun',
    inputSchema: {
      workspaceRoot: z.string().describe('Absolute workspace root path.'),
      managedRunId: z.string().describe('Managed run identifier.'),
    },
  },
  {
    name: 'supervise_managed_run',
    description: 'Run one managed supervisor tick and refresh runtime supervision/progress/escalation surfaces.',
    actionKey: 'superviseManagedRun',
    inputSchema: {
      workspaceRoot: z.string().describe('Absolute workspace root path.'),
      managedRunId: z.string().describe('Managed run identifier.'),
    },
  },
  {
    name: 'run_deliverable_route',
    description: 'Run one deliverable route and return the current route execution surface.',
    actionKey: 'runDeliverableRoute',
    inputSchema: {
      workspaceRoot: z.string().describe('Absolute workspace root path.'),
      overlay: z.string().describe('Overlay id.'),
      topicId: z.string().describe('Topic identifier.'),
      deliverableId: z.string().describe('Deliverable identifier.'),
      route: z.string().describe('Route name, for example storyline.'),
      adapter: z.string().optional().describe('Executor adapter id.'),
    },
  },
  {
    name: 'get_run',
    description: 'Read a persisted runtime run record.',
    actionKey: 'getRun',
    inputSchema: {
      workspaceRoot: z.string().describe('Absolute workspace root path.'),
      runId: z.string().describe('Run identifier.'),
    },
  },
  {
    name: 'get_review_state',
    description: 'Read the deliverable boundary review state for one hydrated deliverable.',
    actionKey: 'getReviewState',
    inputSchema: {
      workspaceRoot: z.string().describe('Absolute workspace root path.'),
      topicId: z.string().describe('Topic identifier.'),
      deliverableId: z.string().describe('Deliverable identifier.'),
    },
  },
  {
    name: 'apply_review_mutation',
    description: 'Apply a platform-level review mutation such as request_changes or bind_baseline.',
    actionKey: 'applyReviewMutation',
    inputSchema: {
      workspaceRoot: z.string().describe('Absolute workspace root path.'),
      topicId: z.string().describe('Topic identifier.'),
      deliverableId: z.string().describe('Deliverable identifier.'),
      mutation: z.object({}).passthrough().describe('Structured review mutation payload.'),
    },
  },
  {
    name: 'runtime_watch',
    description: 'Summarize the run boundary runtime review-loop status from a canonical workspace/topic/deliverable/run locator or a provided run envelope.',
    actionKey: 'runtimeWatch',
    inputSchema: {
      workspaceRoot: z.string().optional().describe('Absolute workspace root path when loading hydrated contract from disk.'),
      topicId: z.string().optional().describe('Topic identifier when loading hydrated contract from disk.'),
      deliverableId: z.string().optional().describe('Deliverable identifier when loading hydrated contract from disk.'),
      runId: z.string().optional().describe('Run identifier on the canonical run boundary.'),
      run: z.object({}).passthrough().optional().describe('Preloaded run envelope to inspect when already resolved in-process.'),
    },
  },
];

export function getGatewayActions(overrides = {}) {
  return {
    ...DEFAULT_GATEWAY_ACTIONS,
    ...overrides,
  };
}

function findToolDefinition(name) {
  return TOOL_DEFINITIONS.find((tool) => tool.name === name) || null;
}

function toToolResponse(result) {
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

function toToolError(error) {
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
      error_kind: 'gateway_tool_error',
      recommended_action: 'inspect_tool_request',
      error: message,
    },
    isError: true,
  };
}

export function listGatewayTools() {
  return TOOL_DEFINITIONS.map(({ name, description }) => ({
    name,
    description,
  }));
}

export function getToolDefinitions() {
  return TOOL_DEFINITIONS;
}

export async function callGatewayTool(name, args, deps = {}) {
  const definition = findToolDefinition(name);
  if (!definition) {
    throw new Error(`Unknown tool: ${name}`);
  }

  const actions = getGatewayActions(deps);
  const action = actions[definition.actionKey];
  if (typeof action !== 'function') {
    throw new Error(`Gateway action not configured: ${definition.actionKey}`);
  }

  return action(args);
}

export function createMcpServer(deps = {}) {
  const server = new McpServer({
    name: 'redcube-gateway',
    version: '0.1.0',
  });

  for (const tool of TOOL_DEFINITIONS) {
    server.registerTool(
      tool.name,
      {
        description: tool.description,
        inputSchema: tool.inputSchema,
      },
      async (args) => {
        try {
          const result = await callGatewayTool(tool.name, args, deps);
          return toToolResponse(result);
        } catch (error) {
          return toToolError(error);
        }
      },
    );
  }

  return server;
}

export async function runStdioServer(deps = {}) {
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
