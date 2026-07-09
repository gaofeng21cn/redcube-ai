#!/usr/bin/env bash
set -euo pipefail

if [ "${OPL_REPO_TEMP_ENV_ACTIVE:-}" != "1" ]; then
  exec "$(dirname "$0")/run-with-repo-temp-env.sh" "$0" "$@"
fi

lane="${1:-smoke}"
shift || true
node --experimental-strip-types scripts/verify-lane.ts "$lane" --verify-wrapper "$@"
