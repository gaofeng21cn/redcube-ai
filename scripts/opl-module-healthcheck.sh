#!/usr/bin/env bash
set -euo pipefail

npm run --silent line-budget
npm run --silent build

NODE_NO_WARNINGS=1 node --test \
  tests/product-entry.test.js \
  tests/product-entry-runtime-manager-registration.test.js \
  tests/product-entry-session-checkpoint.test.js
