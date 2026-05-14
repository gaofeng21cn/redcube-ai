import {
  callDomainTool as callDomainToolJs,
  createMcpServer as createMcpServerJs,
  getDomainActions as getDomainActionsJs,
  getToolDefinitions as getToolDefinitionsJs,
  listDomainTools as listDomainToolsJs,
  runStdioServer as runStdioServerJs,
} from './server.js';

import type {
  DomainActionMap,
  DomainToolDefinition,
  DomainToolSummary,
} from './types.js';

export function getDomainActions(overrides: DomainActionMap = {}): DomainActionMap {
  return getDomainActionsJs(overrides) as unknown as DomainActionMap;
}

export function getToolDefinitions(): DomainToolDefinition[] {
  return getToolDefinitionsJs() as DomainToolDefinition[];
}

export function listDomainTools(): DomainToolSummary[] {
  return listDomainToolsJs() as DomainToolSummary[];
}

export async function callDomainTool(
  name: string,
  args: Record<string, unknown>,
  deps: DomainActionMap = {},
): Promise<unknown> {
  return callDomainToolJs(name, args, deps);
}

export function createMcpServer(deps: DomainActionMap = {}) {
  return createMcpServerJs(deps);
}

export async function runStdioServer(deps: DomainActionMap = {}) {
  return runStdioServerJs(deps);
}

export type {
  DomainActionMap,
  DomainToolDefinition,
  DomainToolResponse,
  DomainToolSummary,
  McpServerDependencies,
} from './types.js';
