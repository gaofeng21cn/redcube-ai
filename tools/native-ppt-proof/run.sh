#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$repo_root"

output_root="${REDCUBE_NATIVE_PPT_PROOF_OUTPUT_DIR:-artifacts/native-ppt-proof}"
skip_system_deps="${REDCUBE_NATIVE_PPT_PROOF_SKIP_SYSTEM_DEPS:-0}"
proof_python=""

usage() {
  cat <<'USAGE'
Usage: tools/native-ppt-proof/run.sh [--output-dir <dir>] [--skip-system-deps]

Runs the repo-owned native PPT proof lane:
  1. optional native proof dependency install
  2. Python native helper doctor
  3. product-entry manifest/status smoke
  4. true LibreOffice/Poppler native PPT fixture proof

Set REDCUBE_NATIVE_PPT_PROOF_SKIP_SYSTEM_DEPS=1 to skip tools/native-ppt-proof/install-deps.sh.
Set REDCUBE_NATIVE_PPT_PROOF_PYTHON, REDCUBE_TEST_PYTHON, or REDCUBE_PYTHON_COMMAND
to force the Python interpreter used by the proof runner.
USAGE
}

python_is_usable() {
  [ -n "$1" ] && [ -x "$1" ] && "$1" -c 'import sys; print(sys.executable)' >/dev/null 2>&1
}

resolve_proof_python() {
  for candidate in \
    "${REDCUBE_NATIVE_PPT_PROOF_PYTHON:-}" \
    "${REDCUBE_TEST_PYTHON:-}" \
    "${REDCUBE_PYTHON_COMMAND:-}" \
    "$(command -v python3 2>/dev/null || true)" \
    "$HOME/.codex/projects/redcube-ai/runtime-state/python/stable-playwright/venv/bin/python" \
    "/opt/homebrew/bin/python3" \
    "/usr/bin/python3"
  do
    if python_is_usable "$candidate"; then
      printf '%s\n' "$candidate"
      return 0
    fi
  done
  echo "No usable Python interpreter found for native PPT proof runner." >&2
  echo "Set REDCUBE_NATIVE_PPT_PROOF_PYTHON or run tools/native-ppt-proof/install-deps.sh in a Python-ready environment." >&2
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

proof_python="$(resolve_proof_python)"
output_root="$("$proof_python" -c 'import pathlib,sys; print(pathlib.Path(sys.argv[1]).resolve())' "$output_root")"
workspace_root="$output_root/workspace"
fixture_input="$output_root/native-helper-input.json"
doctor_report="$output_root/doctor.json"
manifest_report="$output_root/product-manifest.json"
status_report="$output_root/product-status.json"
helper_report="$output_root/native-helper-output.json"
summary_report="$output_root/proof-summary.json"
artifact_index_report="$output_root/artifact-index.json"
native_dir="$output_root/native-helper"
preview_dir="$native_dir/previews"

mkdir -p "$output_root" "$workspace_root" "$native_dir" "$preview_dir"

if [ "$skip_system_deps" != "1" ]; then
  tools/native-ppt-proof/install-deps.sh
fi

npm run --silent build

PYTHONPATH="$repo_root/python${PYTHONPATH:+:$PYTHONPATH}" \
  "$proof_python" -m redcube_ai.native_helpers.doctor > "$doctor_report"

node apps/redcube-cli/dist/cli.js product manifest \
  --workspace-root "$workspace_root" > "$manifest_report"

node apps/redcube-cli/dist/cli.js product status \
  --workspace-root "$workspace_root" > "$status_report"

"$proof_python" - "$repo_root/tests/fixtures/ppt-native-visual-benchmark/benchmark.json" "$fixture_input" <<'PY'
import json
import sys
from pathlib import Path

fixture = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
suite = next(
    (item for item in fixture.get("suites", []) if item.get("suite_id") == "data_charts"),
    (fixture.get("suites") or [fixture])[0],
)
payload = {
    "fixture_id": fixture["fixture_id"],
    "suite_id": suite.get("suite_id"),
    "route": "author_pptx_native",
    "editable_shape_plan": suite["editable_shape_plan"],
}
Path(sys.argv[2]).write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
PY

PYTHONPATH="$repo_root/python${PYTHONPATH:+:$PYTHONPATH}" \
  "$proof_python" -m redcube_ai.native_helpers.ppt_deck.native \
    --input-json "$fixture_input" \
    --mode author \
    --output-pptx "$native_dir/benchmark-author.pptx" \
    --shape-manifest "$native_dir/benchmark-shape-manifest.json" \
    --preview-dir "$preview_dir" \
    --output-pdf "$native_dir/benchmark-author.pdf" \
    --engine-contract "$repo_root/contracts/runtime-program/ppt-native-python-engine-contract.json" \
    > "$helper_report"

"$proof_python" - "$doctor_report" "$manifest_report" "$status_report" "$helper_report" "$summary_report" <<'PY'
import json
import sys
from pathlib import Path

doctor = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
manifest = json.loads(Path(sys.argv[2]).read_text(encoding="utf-8"))
status = json.loads(Path(sys.argv[3]).read_text(encoding="utf-8"))
helper = json.loads(Path(sys.argv[4]).read_text(encoding="utf-8"))
summary_file = Path(sys.argv[5])

proof_lane = (
    manifest.get("deliverable_facade", {})
    .get("family_route_policy", {})
    .get("ppt_deck", {})
    .get("native_ppt_proof_lane", {})
)
status_lane = (
    status.get("product_entry_manifest", {})
    .get("deliverable_facade", {})
    .get("family_route_policy", {})
    .get("ppt_deck", {})
    .get("native_ppt_proof_lane", {})
)
render_proof = helper.get("render_proof", {})

failures = []
if doctor.get("status") != "ok":
    failures.append(f"doctor status is {doctor.get('status')!r}")
if not doctor.get("renderer_availability", {}).get("linux_native_proof", {}).get("available"):
    failures.append("doctor linux_native_proof is not available")
if proof_lane.get("default_enabled") is not False:
    failures.append("product-entry native proof lane must remain default_enabled=false")
if proof_lane.get("runnable_routes") != ["author_pptx_native", "repair_pptx_native"]:
    failures.append("product-entry native proof lane runnable routes mismatch")
if status_lane.get("default_enabled") is not False:
    failures.append("status native proof lane must remain default_enabled=false")
if helper.get("status") != "completed":
    failures.append(f"native helper status is {helper.get('status')!r}")
if render_proof.get("renderer_kind") != "libreoffice_headless":
    failures.append("native helper did not use LibreOffice headless")
if render_proof.get("renderer_pipeline") != "libreoffice_headless_pdf_png_v1":
    failures.append("native helper renderer pipeline mismatch")
if render_proof.get("synthetic_preview") is not False:
    failures.append("native helper produced synthetic preview")
if int(render_proof.get("slide_count") or 0) != 6:
    failures.append("native helper fixture should render six slides")
for file in [
    helper.get("pptx_file"),
    helper.get("pdf_file"),
    helper.get("shape_manifest_file"),
    *render_proof.get("preview_screenshots", []),
]:
    if not file or not Path(file).exists():
        failures.append(f"expected artifact missing: {file}")

summary = {
    "status": "failed" if failures else "passed",
    "failures": failures,
    "doctor_status": doctor.get("status"),
    "renderer_available": doctor.get("renderer_availability", {}).get("linux_native_proof", {}).get("available"),
    "product_entry_native_lane": {
        "status": proof_lane.get("status"),
        "default_enabled": proof_lane.get("default_enabled"),
        "runnable_routes": proof_lane.get("runnable_routes"),
        "preserved_gates": proof_lane.get("preserved_gates"),
    },
    "native_helper": {
        "status": helper.get("status"),
        "page_count": helper.get("page_count"),
        "renderer_kind": render_proof.get("renderer_kind"),
        "renderer_pipeline": render_proof.get("renderer_pipeline"),
        "pptx_file": helper.get("pptx_file"),
        "pdf_file": helper.get("pdf_file"),
        "shape_manifest_file": helper.get("shape_manifest_file"),
        "preview_screenshots": render_proof.get("preview_screenshots", []),
    },
}
summary_file.write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")
print(json.dumps(summary, ensure_ascii=False, indent=2))
if failures:
    raise SystemExit(1)
PY

"$proof_python" tools/native-ppt-proof/build-artifact-index.py \
  --output-dir "$output_root" \
  --index-file "$artifact_index_report"
