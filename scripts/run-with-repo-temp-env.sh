#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -eq 0 ]; then
  echo "Usage: scripts/run-with-repo-temp-env.sh <command> [args...]" >&2
  exit 2
fi

repo_root="$(cd "$(dirname "$0")/.." && pwd -P)"

external_env_value() {
  local name="$1"
  local fallback="$2"
  local current="${!name:-}"
  if [ -n "${current}" ] && [ "${current}" != "${repo_root}" ] && [[ "${current}" != "${repo_root}/"* ]]; then
    printf '%s' "${current}"
    return
  fi
  printf '%s' "${fallback}"
}

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
  "${repo_temp_root}/xdg-cache" \
  "${repo_temp_root}/opl-state"

export TMPDIR="$(external_env_value TMPDIR "${repo_temp_root}/tmp/")"
export OPL_REPO_TEMP_ENV_ACTIVE=1
export OPL_REPO_TEMP_ROOT="${repo_temp_root}"
export PYTHONDONTWRITEBYTECODE="${PYTHONDONTWRITEBYTECODE:-1}"
export PYTHONPYCACHEPREFIX="$(external_env_value PYTHONPYCACHEPREFIX "${repo_temp_root}/python/pycache")"
export PYTEST_ADDOPTS="${PYTEST_ADDOPTS:-} -p no:cacheprovider -o cache_dir=${repo_temp_root}/python/pytest-cache"
export UV_CACHE_DIR="$(external_env_value UV_CACHE_DIR "${repo_temp_root}/uv/cache")"
export UV_PROJECT_ENVIRONMENT="$(external_env_value UV_PROJECT_ENVIRONMENT "${repo_temp_root}/uv/project-venv")"
export NPM_CONFIG_CACHE="$(external_env_value NPM_CONFIG_CACHE "${repo_temp_root}/npm/cache")"
export npm_config_cache="${NPM_CONFIG_CACHE}"
export NODE_COMPILE_CACHE="$(external_env_value NODE_COMPILE_CACHE "${repo_temp_root}/node/compile-cache")"
export XDG_CACHE_HOME="$(external_env_value XDG_CACHE_HOME "${repo_temp_root}/xdg-cache")"
export OPL_STATE_DIR="${repo_temp_root}/opl-state"

"$@"
