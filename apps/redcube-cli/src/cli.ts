#!/usr/bin/env node

import { main as cliMain } from './cli-parts/dispatch.js';
import { fail } from './cli-parts/output.js';

if (import.meta.main) {
  cliMain().catch((error) => {
    fail(error instanceof Error ? error.message : String(error));
  });
}
