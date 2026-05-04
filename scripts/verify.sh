#!/usr/bin/env bash
set -euo pipefail

lane="${1:-smoke}"

node --experimental-strip-types scripts/line-budget.ts

case "$lane" in
  smoke|fast)
    npm run test:line-budget
    npm run test:fast
    ;;
  line-budget)
    npm run test:line-budget
    ;;
  structure)
    npm run test:line-budget
    scripts/run-structural-quality-gate.sh
    ;;
  meta)
    npm run test:meta
    ;;
  family)
    npm run test:family
    ;;
  integration)
    npm run test:integration
    ;;
  integration-remaining)
    npm run test:integration:remaining
    ;;
  e2e)
    npm run test:e2e
    ;;
  historical)
    npm run test:historical
    ;;
  full)
    npm run test:full
    ;;
  *)
    echo "Unknown lane: $lane" >&2
    echo "Usage: scripts/verify.sh [smoke|fast|line-budget|structure|meta|family|integration|integration-remaining|e2e|historical|full]" >&2
    exit 1
    ;;
esac
