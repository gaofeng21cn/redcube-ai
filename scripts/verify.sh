#!/usr/bin/env bash
set -euo pipefail

lane="${1:-smoke}"

case "$lane" in
  smoke|fast)
    npm run test:fast
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
    echo "Usage: scripts/verify.sh [smoke|fast|meta|family|integration|e2e|historical|full]" >&2
    exit 1
    ;;
esac
