import {
  executeCli as executeCliJs,
  getCliDomainActions as getCliDomainActionsJs,
  main as mainJs,
  runCli as runCliJs,
} from './cli-parts/dispatch.js';
import { buildHelp as buildHelpJs } from './cli-parts/help.js';
import { buildCommandHelp as buildCommandHelpJs } from './cli-parts/help.js';
import { parseArgs as parseArgsJs, resolveWorkspaceRoot as resolveWorkspaceRootJs } from './cli-parts/options.js';

import type {
  CliDependencies,
  CliDomainActions,
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

export function getCliDomainActions(overrides: Partial<CliDomainActions> = {}): CliDomainActions {
  return getCliDomainActionsJs(overrides) as CliDomainActions;
}

export async function buildHelp(domainActions?: CliDomainActions): Promise<CliHelpSurface> {
  const actions = domainActions || getCliDomainActionsJs();
  return buildHelpJs(actions as unknown as Record<string, unknown>) as Promise<CliHelpSurface>;
}

export function buildCommandHelp(commandKey: string): Record<string, unknown> | null {
  return buildCommandHelpJs(commandKey);
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
  CliDomainActions,
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
