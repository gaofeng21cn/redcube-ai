#!/usr/bin/env node
import { pathToFileURL } from 'node:url';

import { runStdioServer } from './server.ts';

export * from './server.ts';

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
