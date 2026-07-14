#!/usr/bin/env bash
set -euo pipefail

npm run --silent line-budget
npm run --silent build

NODE_NO_WARNINGS=1 node --test \
  tests/opl-agent-pack-contracts-semantic-pack.test.js \
  tests/opl-agent-package-manifest.test.js \
  tests/rca-functional-audit-retirement.test.js \
  tests/rca-private-platform-retirement-readback.test.js
