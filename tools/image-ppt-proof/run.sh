#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$repo_root"

output_root="${REDCUBE_IMAGE_PPT_PROOF_OUTPUT_DIR:-artifacts/image-ppt-proof}"
fixture_file="${REDCUBE_IMAGE_PPT_PROOF_FIXTURE:-tests/fixtures/ppt-image-first-lightweight/fixture.json}"
style_reference_dir="${REDCUBE_IMAGE_PPT_PROOF_STYLE_REFERENCE_DIR:-}"
image_generation_mode="${REDCUBE_IMAGE_PPT_PROOF_MODE:-mock}"
skip_system_deps="${REDCUBE_IMAGE_PPT_PROOF_SKIP_SYSTEM_DEPS:-0}"
proof_python=""

usage() {
  printf '%s\n' \
    'Usage: tools/image-ppt-proof/run.sh [--output-dir <dir>] [--fixture <file>] [--style-reference-dir <dir>] [--mock-image-generation|--live-image-generation] [--skip-system-deps]' \
    '' \
    'Runs the repo-owned image-first PPT proof lane:' \
    '  1. optional native PPT proof dependency install' \
    '  2. deterministic prompt manifest creation' \
    '  3. mock image generation or Codex-native live imagegen task execution' \
    '  4. PPTX/PDF/export bundle/gallery/final delivery manifest emission' \
    '  5. artifact-index.json retention contract build' \
    '' \
    'Default mode is --mock-image-generation and never calls a real API.' \
    'Live mode delegates raster generation to the Codex executor native imagegen skill; RCA does not read provider Base URL or API tokens.'
}

python_is_usable() {
  [ -n "$1" ] && [ -x "$1" ] && "$1" -c 'import sys; print(sys.executable)' >/dev/null 2>&1
}

resolve_proof_python() {
  for candidate in \
    "${REDCUBE_IMAGE_PPT_PROOF_PYTHON:-}" \
    "${REDCUBE_NATIVE_PPT_PROOF_PYTHON:-}" \
    "${REDCUBE_TEST_PYTHON:-}" \
    "${REDCUBE_PYTHON_COMMAND:-}" \
    "$HOME/.codex/projects/redcube-ai/runtime-state/python/stable-playwright/venv/bin/python" \
    "/opt/homebrew/bin/python3" \
    "/usr/bin/python3" \
    "$(command -v python3 2>/dev/null || true)"
  do
    if python_is_usable "$candidate"; then
      printf '%s\n' "$candidate"
      return 0
    fi
  done
  echo "No usable Python interpreter found for image PPT proof runner." >&2
  echo "Set REDCUBE_IMAGE_PPT_PROOF_PYTHON or REDCUBE_TEST_PYTHON." >&2
  return 127
}

while [ "$#" -gt 0 ]; do
  case "$1" in
    --output-dir)
      if [ "$#" -lt 2 ]; then
        echo "--output-dir requires a value" >&2
        exit 2
      fi
      output_root="$2"
      shift 2
      ;;
    --fixture)
      if [ "$#" -lt 2 ]; then
        echo "--fixture requires a value" >&2
        exit 2
      fi
      fixture_file="$2"
      shift 2
      ;;
    --style-reference-dir)
      if [ "$#" -lt 2 ]; then
        echo "--style-reference-dir requires a value" >&2
        exit 2
      fi
      style_reference_dir="$2"
      shift 2
      ;;
    --mock-image-generation)
      image_generation_mode="mock"
      shift
      ;;
    --live-image-generation)
      image_generation_mode="live"
      shift
      ;;
    --skip-system-deps)
      skip_system_deps=1
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage >&2
      exit 2
      ;;
  esac
done

if [ "$image_generation_mode" != "mock" ] && [ "$image_generation_mode" != "live" ]; then
  echo "Image generation mode must be mock or live." >&2
  exit 2
fi

proof_python="$(resolve_proof_python)"
output_root="$("$proof_python" -c 'import pathlib,sys; print(pathlib.Path(sys.argv[1]).resolve())' "$output_root")"
workspace_root="$output_root/workspace"
image_dir="$output_root/images"
export_dir="$output_root/export"
gallery_dir="$output_root/gallery"
run_manifest="$output_root/run-manifest.json"
prompt_manifest="$output_root/prompt-manifest.json"
image_manifest="$output_root/image-manifest.json"
style_manifest="$output_root/style-manifest.json"
proof_summary="$output_root/proof-summary.json"
artifact_index="$output_root/artifact-index.json"

mkdir -p "$output_root" "$workspace_root" "$image_dir" "$export_dir" "$gallery_dir"

if [ "$skip_system_deps" != "1" ]; then
  tools/native-ppt-proof/install-deps.sh
fi

"$proof_python" tools/image-ppt-proof/run-proof.py \
  --output-dir "$output_root" \
  --image-generation-mode "$image_generation_mode" \
  --fixture "$fixture_file" \
  ${style_reference_dir:+--style-reference-dir "$style_reference_dir"}

"$proof_python" tools/image-ppt-proof/build-artifact-index.py \
  --output-dir "$output_root" \
  --index-file "$artifact_index"
