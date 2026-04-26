#!/usr/bin/env node
import { realpathSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { fail, main } from './cli.ts';

export * from './cli.ts';

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
