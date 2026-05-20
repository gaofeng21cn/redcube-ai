#!/usr/bin/env bash
set -euo pipefail

if [ "${OPL_REPO_TEMP_ENV_ACTIVE:-}" != "1" ]; then
  exec "$(dirname "$0")/run-with-repo-temp-env.sh" "$0" "$@"
fi

lane="${1:-smoke}"

node --experimental-strip-types scripts/line-budget.ts
scripts/repo-hygiene.sh --fix
scripts/repo-hygiene.sh

case "$lane" in
  smoke)
    npm run test:line-budget
    npm run test:smoke
    ;;
  fast)
    npm run test:line-budget
    npm run test:fast
    ;;
  ci)
    npm run test:line-budget
    npm run test:ci
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
  full-remaining)
    npm run test:full:remaining
    ;;
  full-with-historical)
    npm run test:full:with-historical
    ;;
  *)
    echo "Unknown lane: $lane" >&2
    echo "Usage: scripts/verify.sh [smoke|fast|ci|line-budget|structure|meta|family|integration|integration-remaining|e2e|historical|full|full-remaining|full-with-historical]" >&2
    exit 1
    ;;
esac
