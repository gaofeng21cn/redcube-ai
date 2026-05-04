#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
compare_ref="${OPL_QUALITY_DETAILS_COMPARE_REF:-origin/main}"
output_dir="${OPL_QUALITY_DETAILS_OUTPUT_DIR:-artifacts/opl-quality-details}"
limit="${OPL_QUALITY_DETAILS_LIMIT:-20}"
json_limit="${OPL_QUALITY_DETAILS_JSON_LIMIT:-50}"
focus="${OPL_QUALITY_DETAILS_FOCUS:-auto}"
opl_command="${OPL_COMMAND:-}"
if [ -z "$opl_command" ]; then
  opl_command="${OPL_QUALITY_DETAILS_BIN:-/Users/gaofeng/workspace/one-person-lab/bin/opl}"
fi

mkdir -p "$repo_root/$output_dir"

if ! command -v "$opl_command" >/dev/null 2>&1; then
  echo "OPL quality details unavailable: '$opl_command' command was not found." >&2
  exit 127
fi

compare_args=(--compare-ref "$compare_ref")

"$opl_command" quality details \
  --root "$repo_root" \
  --format markdown \
  --limit "$limit" \
  --focus "$focus" \
  "${compare_args[@]}"

"$opl_command" quality details \
  --root "$repo_root" \
  --format json \
  --limit "$json_limit" \
  --focus "$focus" \
  "${compare_args[@]}" \
  > "$repo_root/$output_dir/quality-details.json"
