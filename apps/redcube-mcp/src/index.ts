import {
  callGatewayTool as callGatewayToolJs,
  createMcpServer as createMcpServerJs,
  getDomainActions as getDomainActionsJs,
  getToolDefinitions as getToolDefinitionsJs,
  listGatewayTools as listGatewayToolsJs,
  runStdioServer as runStdioServerJs,
} from './server.js';

import type {
  DomainActionMap,
  GatewayToolDefinition,
  GatewayToolSummary,
} from './types.js';

export function getDomainActions(overrides: DomainActionMap = {}): DomainActionMap {
  return getDomainActionsJs(overrides) as unknown as DomainActionMap;
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
  deps: DomainActionMap = {},
): Promise<unknown> {
  return callGatewayToolJs(name, args, deps);
}

export function createMcpServer(deps: DomainActionMap = {}) {
  return createMcpServerJs(deps);
}

export async function runStdioServer(deps: DomainActionMap = {}) {
  return runStdioServerJs(deps);
}

export type {
  DomainActionMap,
  GatewayToolDefinition,
  GatewayToolResponse,
  GatewayToolSummary,
  McpServerDependencies,
} from './types.js';
