#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
compare_ref="${OPL_QUALITY_DETAILS_COMPARE_REF:-origin/main}"
codex_home="${CODEX_HOME:-$HOME/.codex}"
default_output_dir="$codex_home/projects/redcube-ai/runtime-state/quality-details"
output_dir="${OPL_QUALITY_DETAILS_OUTPUT_DIR:-$default_output_dir}"
limit="${OPL_QUALITY_DETAILS_LIMIT:-20}"
json_limit="${OPL_QUALITY_DETAILS_JSON_LIMIT:-50}"
focus="${OPL_QUALITY_DETAILS_FOCUS:-auto}"
opl_command="${OPL_COMMAND:-}"
if [ -z "$opl_command" ]; then
  if [ -n "${OPL_QUALITY_DETAILS_BIN:-}" ]; then
    opl_command="$OPL_QUALITY_DETAILS_BIN"
  elif [ -n "${OPL_BIN:-}" ]; then
    opl_command="$OPL_BIN"
  elif [ -n "${OPL_FRAMEWORK_ROOT:-}" ] && [ -x "${OPL_FRAMEWORK_ROOT}/bin/opl" ]; then
    opl_command="${OPL_FRAMEWORK_ROOT}/bin/opl"
  elif [ -x "$repo_root/../one-person-lab/bin/opl" ]; then
    opl_command="$repo_root/../one-person-lab/bin/opl"
  else
    opl_command="opl"
  fi
fi

case "$output_dir" in
  /*) output_path="$output_dir" ;;
  *) output_path="$repo_root/$output_dir" ;;
esac

mkdir -p "$output_path"

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
  > "$output_path/quality-details.json"
