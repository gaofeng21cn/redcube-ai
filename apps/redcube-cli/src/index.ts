import { executeCli as executeCliJs } from './cli-parts/dispatch.js';
import { getCliGatewayActions as getCliGatewayActionsJs } from './cli-parts/gateway-actions.js';
import { buildHelp as buildHelpJs } from './cli-parts/help.js';
import { parseArgs as parseArgsJs, resolveWorkspaceRoot as resolveWorkspaceRootJs } from './cli-parts/options.js';
import { main as mainJs, runCli as runCliJs } from './cli-parts/run.js';

import type {
  CliDependencies,
  CliGatewayActions,
  CliHelpSurface,
  CliOptions,
  CliRunSurface,
} from './types.js';

export function parseArgs(argv: string[]): CliOptions {
  return parseArgsJs(argv) as CliOptions;
}

export function resolveWorkspaceRoot(options: CliOptions, cwd?: () => string): string {
  return resolveWorkspaceRootJs(options, cwd);
}

export function getCliGatewayActions(overrides: Partial<CliGatewayActions> = {}): CliGatewayActions {
  return getCliGatewayActionsJs(overrides) as CliGatewayActions;
}

export async function buildHelp(gatewayActions?: CliGatewayActions): Promise<CliHelpSurface> {
  return buildHelpJs(gatewayActions as unknown as Record<string, unknown> | undefined) as Promise<CliHelpSurface>;
}

export async function executeCli(argv: string[], deps: CliDependencies = {}): Promise<CliRunSurface> {
  return executeCliJs(argv, deps) as Promise<CliRunSurface>;
}

export async function runCli(argv: string[], deps: CliDependencies = {}): Promise<CliRunSurface> {
  return runCliJs(argv, deps) as Promise<CliRunSurface>;
}

export async function main(argv?: string[], deps: CliDependencies = {}): Promise<CliRunSurface> {
  return mainJs(argv, deps) as Promise<CliRunSurface>;
}

export type {
  CliDependencies,
  CliGatewayActions,
  CliHelpSurface,
  CliOptions,
  CliPrivateProfileBootstrapRequest,
  CliPrivateProfileBundleRequest,
  CliPrivateProfileModule,
  CliPrivateProfileRequest,
  CliPrivateProfileResult,
  CliRunResult,
  CliRunSurface,
} from './types.js';
