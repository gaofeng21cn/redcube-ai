#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo_root"

if ! command -v sentrux >/dev/null 2>&1; then
  echo "Sentrux structural gate unavailable: 'sentrux' command was not found." >&2
  exit 127
fi

sentrux --version
sentrux analytics off || true

sentrux_status=0

if [ -f .sentrux/baseline.json ]; then
  sentrux gate . || sentrux_status=$?
else
  echo "No .sentrux/baseline.json found; saving structural baseline for this run."
  sentrux gate --save . || sentrux_status=$?
fi

if [ -f .sentrux/rules.toml ]; then
  sentrux check . || {
    check_status=$?
    if [ "$sentrux_status" -eq 0 ]; then
      sentrux_status="$check_status"
    fi
  }
else
  echo "No .sentrux/rules.toml found; skipping Sentrux rules check."
fi

if [ "$sentrux_status" -ne 0 ]; then
  echo "Sentrux failed with exit code $sentrux_status; running OPL quality details with compare-ref."
  scripts/run-opl-quality-details.sh || echo "OPL quality details failed; preserving Sentrux exit code $sentrux_status." >&2
fi

exit "$sentrux_status"
