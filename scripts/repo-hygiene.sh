#!/usr/bin/env bash
set -euo pipefail

tracked="$(
  git ls-files -- \
    ':(glob)**/dist/**' \
    ':(glob)**/build/**' \
    ':(glob)**/out/**' \
    ':(glob)**/__pycache__/**' \
    ':(glob)**/*.egg-info/**' \
    ':(glob)**/.DS_Store' \
    ':(glob)**/.codex/**' \
    ':(glob)**/.omx/**' \
    ':(glob)**/.runtime-program/**' \
    ':(glob)**/runtime-state/**' \
    .agent-contract-baseline.json
)"

if [ -n "$tracked" ]; then
  printf '%s\n%s\n' 'repo hygiene: forbidden tracked paths:' "$tracked" >&2
  exit 1
fi

agents_files="$(git ls-files -- .agents)"
if [ "$agents_files" != ".agents/plugins/marketplace.json" ]; then
  printf '%s\n%s\n' 'repo hygiene: unexpected tracked .agents paths:' "$agents_files" >&2
  exit 1
fi
