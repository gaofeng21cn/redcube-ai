#!/usr/bin/env node

import { realpathSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';

import {
  executeCli as executeCliJs,
  getCliDomainActions as getCliDomainActionsJs,
  main as mainJs,
  runCli as runCliJs,
} from './cli-parts/dispatch.js';
import { buildHelp as buildHelpJs } from './cli-parts/help.js';
import { buildCommandHelp as buildCommandHelpJs } from './cli-parts/help.js';
import { fail } from './cli-parts/output.js';
import {
  parseArgs as parseArgsJs,
  resolveWorkspaceRoot as resolveWorkspaceRootJs,
} from './cli-parts/options.js';
import type {
  CliDependenciesMap,
  DomainActionMap,
  JsonMap,
} from './cli-parts/types.js';

export function parseArgs(argv: string[]): JsonMap {
  return parseArgsJs(argv);
}

export function resolveWorkspaceRoot(options: JsonMap, cwd?: () => string): string {
  return resolveWorkspaceRootJs(options, cwd);
}

export function getCliDomainActions(overrides: DomainActionMap = {}): JsonMap {
  return getCliDomainActionsJs(overrides);
}

export async function buildHelp(domainActions?: DomainActionMap): Promise<JsonMap> {
  const actions = domainActions || getCliDomainActionsJs();
  return buildHelpJs(actions);
}

export function buildCommandHelp(commandKey: string): JsonMap | null {
  return buildCommandHelpJs(commandKey);
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
