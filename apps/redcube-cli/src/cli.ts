#!/usr/bin/env node

import { realpathSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';

import {
  executeCli as executeCliJs,
  getCliGatewayActions as getCliGatewayActionsJs,
  main as mainJs,
  runCli as runCliJs,
} from './cli-parts/dispatch.js';
import { buildHelp as buildHelpJs } from './cli-parts/help.js';
import { fail } from './cli-parts/output.js';
import {
  parseArgs as parseArgsJs,
  resolveWorkspaceRoot as resolveWorkspaceRootJs,
} from './cli-parts/options.js';
import type {
  CliDependenciesMap,
  GatewayActionMap,
  JsonMap,
} from './cli-parts/types.js';

export function parseArgs(argv: string[]): JsonMap {
  return parseArgsJs(argv);
}

export function resolveWorkspaceRoot(options: JsonMap, cwd?: () => string): string {
  return resolveWorkspaceRootJs(options, cwd);
}

export function getCliGatewayActions(overrides: GatewayActionMap = {}): JsonMap {
  return getCliGatewayActionsJs(overrides);
}

export async function buildHelp(gatewayActions?: GatewayActionMap): Promise<JsonMap> {
  const actions = gatewayActions || getCliGatewayActionsJs();
  return buildHelpJs(actions);
}

export async function executeCli(argv: string[], deps: CliDependenciesMap = {}): Promise<JsonMap> {
  return executeCliJs(argv, deps);
}

export async function runCli(argv: string[], deps: CliDependenciesMap = {}): Promise<JsonMap> {
  return runCliJs(argv, deps);
}

export async function main(argv = process.argv.slice(2), deps: CliDependenciesMap = {}): Promise<JsonMap> {
  return mainJs(argv, deps);
}

function isDirectExecution() {
  if (!process.argv[1]) {
    return false;
  }

  const modulePath = fileURLToPath(import.meta.url);

  try {
    return realpathSync(modulePath) === realpathSync(process.argv[1]);
  } catch {
    return import.meta.url === pathToFileURL(process.argv[1]).href;
  }
}

if (isDirectExecution()) {
  main().catch((error) => {
    fail(error instanceof Error ? error.message : String(error));
  });
}
