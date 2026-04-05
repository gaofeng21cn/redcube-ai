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
  getReviewState,
  getRun,
  intakeSource,
  listTopics,
  reviewRenderOutput,
  runDeliverableRoute,
  runtimeWatch,
} from '@redcube/gateway';
import * as z from 'zod/v4';

const DEFAULT_GATEWAY_ACTIONS = {
  doctorWorkspace,
  listTopics,
  createDeliverable,
  getDeliverable,
  intakeSource,
  auditDeliverable,
  reviewRenderOutput,
  runDeliverableRoute,
  getRun,
  runtimeWatch,
  getReviewState,
  applyReviewMutation,
};

const TOOL_DEFINITIONS = [
  {
    name: 'doctor',
    description: 'Inspect workspace contract and canonical directories.',
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
    name: 'intake_source',
    description: 'Hydrate brief / keywords / source files into canonical shared source artifacts.',
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
    description: 'Read one canonical deliverable record from disk.',
    actionKey: 'getDeliverable',
    inputSchema: {
      workspaceRoot: z.string().describe('Absolute workspace root path.'),
      topicId: z.string().describe('Topic identifier.'),
      deliverableId: z.string().describe('Deliverable identifier.'),
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
    name: 'run_deliverable_route',
    description: 'Run one deliverable route through the host-agent runtime adapter.',
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
    description: 'Read the platform-level review state for one deliverable.',
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
    description: 'Summarize current runtime review-loop status from a run envelope.',
    actionKey: 'runtimeWatch',
    inputSchema: {
      workspaceRoot: z.string().optional().describe('Absolute workspace root path when loading hydrated contract from disk.'),
      topicId: z.string().optional().describe('Topic identifier when loading hydrated contract from disk.'),
      deliverableId: z.string().optional().describe('Deliverable identifier when loading hydrated contract from disk.'),
      run: z.object({}).passthrough().describe('Run envelope to inspect.'),
    },
  },
];

function getGatewayActions(overrides = {}) {
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
