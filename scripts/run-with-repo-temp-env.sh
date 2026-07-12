#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -eq 0 ]; then
  echo "Usage: scripts/run-with-repo-temp-env.sh <command> [args...]" >&2
  exit 2
fi

repo_root="$(cd "$(dirname "$0")/.." && pwd -P)"
opl_bin="${OPL_BIN:-${repo_root}/node_modules/opl-framework/bin/opl}"
framework_link_check_status=0
framework_link_check_output="$(
  "${opl_bin}" packages link-framework \
    --agent-root "${repo_root}" \
    --check \
    --json 2>&1
)" || framework_link_check_status=$?
if [ "${framework_link_check_status}" -ne 0 ]; then
  printf '%s\n' "${framework_link_check_output}" >&2
  exit "${framework_link_check_status}"
fi

cleanup_temp_root=0
if [ -n "${OPL_REPO_TEMP_ROOT:-}" ]; then
  repo_temp_root="${OPL_REPO_TEMP_ROOT}"
else
  repo_temp_root="$(mktemp -d "${OPL_SHORT_TMPDIR:-/tmp}/redcube-repo-temp.XXXXXX")"
  cleanup_temp_root=1
fi

cleanup() {
  if [ "${cleanup_temp_root}" = "1" ]; then
    rm -rf "${repo_temp_root}"
  fi
}
trap cleanup EXIT

mkdir -p \
  "${repo_temp_root}/tmp" \
  "${repo_temp_root}/python/pycache" \
  "${repo_temp_root}/python/pytest-cache" \
  "${repo_temp_root}/uv/cache" \
  "${repo_temp_root}/uv/project-venv" \
  "${repo_temp_root}/npm/cache" \
  "${repo_temp_root}/node/compile-cache" \
  "${repo_temp_root}/xdg-cache"

export TMPDIR="${repo_temp_root}/tmp/"
export OPL_REPO_TEMP_ENV_ACTIVE=1
export OPL_REPO_TEMP_ROOT="${repo_temp_root}"
export PYTHONDONTWRITEBYTECODE="${PYTHONDONTWRITEBYTECODE:-1}"
export PYTHONPYCACHEPREFIX="${repo_temp_root}/python/pycache"
export PYTEST_ADDOPTS="${PYTEST_ADDOPTS:-} -p no:cacheprovider -o cache_dir=${repo_temp_root}/python/pytest-cache"
export UV_CACHE_DIR="${repo_temp_root}/uv/cache"
export UV_PROJECT_ENVIRONMENT="${repo_temp_root}/uv/project-venv"
export NPM_CONFIG_CACHE="${repo_temp_root}/npm/cache"
export npm_config_cache="${NPM_CONFIG_CACHE}"
export NODE_COMPILE_CACHE="${repo_temp_root}/node/compile-cache"
export XDG_CACHE_HOME="${repo_temp_root}/xdg-cache"

"$@"
