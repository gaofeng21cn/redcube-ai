#!/usr/bin/env node

import { realpathSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { main as cliMain } from './cli-parts/dispatch.js';
import { fail } from './cli-parts/output.js';

export { executeCli, getCliDomainActions, main, runCli } from './cli-parts/dispatch.js';
export { buildCommandHelp, buildHelp } from './cli-parts/help.js';
export { parseArgs, resolveWorkspaceRoot } from './cli-parts/options.js';

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
  cliMain().catch((error) => {
    fail(error instanceof Error ? error.message : String(error));
  });
}
