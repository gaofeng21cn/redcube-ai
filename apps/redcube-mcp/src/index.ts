import {
  callGatewayTool as callGatewayToolJs,
  createMcpServer as createMcpServerJs,
  getGatewayActions as getGatewayActionsJs,
  getToolDefinitions as getToolDefinitionsJs,
  listGatewayTools as listGatewayToolsJs,
  runStdioServer as runStdioServerJs,
} from './server.js';

import type {
  GatewayActionMap,
  GatewayToolDefinition,
  GatewayToolSummary,
} from './types.js';

export function getGatewayActions(overrides: GatewayActionMap = {}): GatewayActionMap {
  return getGatewayActionsJs(overrides) as unknown as GatewayActionMap;
}

export function getToolDefinitions(): GatewayToolDefinition[] {
  return getToolDefinitionsJs() as GatewayToolDefinition[];
}

export function listGatewayTools(): GatewayToolSummary[] {
  return listGatewayToolsJs() as GatewayToolSummary[];
}

export async function callGatewayTool(
  name: string,
  args: Record<string, unknown>,
  deps: GatewayActionMap = {},
): Promise<unknown> {
  return callGatewayToolJs(name, args, deps);
}

export function createMcpServer(deps: GatewayActionMap = {}) {
  return createMcpServerJs(deps);
}

export async function runStdioServer(deps: GatewayActionMap = {}) {
  return runStdioServerJs(deps);
}

export type {
  GatewayActionMap,
  GatewayToolDefinition,
  GatewayToolResponse,
  GatewayToolSummary,
  McpServerDependencies,
} from './types.js';
