#!/usr/bin/env bash
set -euo pipefail

npm run test:line-budget
npm run --silent build

NODE_NO_WARNINGS=1 node --experimental-strip-types --test \
  tests/product-entry.test.ts \
  tests/product-entry-runtime-manager-registration.test.ts \
  tests/product-entry-session-checkpoint.test.ts \
  tests/product-entry-cases/domain-memory-ref-adapter.test.ts \
  tests/product-entry-cases/manifest-and-start-surfaces.test.ts \
  tests/product-entry-cases/runtime-and-sidecar-surfaces.test.ts
