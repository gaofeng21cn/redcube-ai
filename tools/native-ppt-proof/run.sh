#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$repo_root"

export PATH="$HOME/.local/bin:$PATH"

proof_cache_root="${CODEX_HOME:-$HOME/.codex}/projects/redcube-ai/runtime-state/native-ppt-proof-cache"
proof_tmp_root="/tmp/rca-native-ppt-proof"
mkdir -p \
  "$proof_tmp_root" \
  "$proof_cache_root/pycache" \
  "$proof_cache_root/pytest-cache" \
  "$proof_cache_root/uv-cache" \
  "$proof_cache_root/uv-project-venv"
export TMPDIR="$proof_tmp_root/"
export PYTHONDONTWRITEBYTECODE=1
export PYTHONPYCACHEPREFIX="$proof_cache_root/pycache"
export PYTEST_ADDOPTS="${PYTEST_ADDOPTS:+$PYTEST_ADDOPTS }-p no:cacheprovider -o cache_dir=$proof_cache_root/pytest-cache"
export UV_CACHE_DIR="$proof_cache_root/uv-cache"
export UV_PROJECT_ENVIRONMENT="$proof_cache_root/uv-project-venv"

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
package_readback_report="$output_root/native-package-readback.json"
quality_verdict_report="$output_root/native-quality-verdict.json"
summary_report="$output_root/proof-summary.json"
artifact_index_report="$output_root/artifact-index.json"
native_dir="$output_root/native-helper"
preview_dir="$native_dir/previews"
suite_id="data_charts"

mkdir -p "$output_root" "$workspace_root" "$native_dir" "$preview_dir"

if [ "$skip_system_deps" != "1" ]; then
  tools/native-ppt-proof/install-deps.sh
fi
renderer_auto_install=1
if [ "$skip_system_deps" = "1" ]; then
  renderer_auto_install=0
fi

npm run --silent build

PYTHONPATH="$repo_root/python${PYTHONPATH:+:$PYTHONPATH}" \
  "$proof_python" -m redcube_ai.native_helpers.doctor > "$doctor_report"

node --input-type=module - "$workspace_root" "$manifest_report" "$status_report" <<'NODE'
import fs from 'node:fs';

import {
  getProductEntryManifest,
  getProductStatus,
} from './packages/redcube-domain-entry/dist/index.js';

const [, , workspaceRoot, manifestReport, statusReport] = process.argv;
const request = { workspace_root: workspaceRoot };
const manifest = await getProductEntryManifest(request);
const status = await getProductStatus(request);

fs.writeFileSync(manifestReport, `${JSON.stringify(manifest, null, 2)}\n`);
fs.writeFileSync(statusReport, `${JSON.stringify(status, null, 2)}\n`);
NODE

node --experimental-strip-types tools/native-ppt-proof/build-fixture-input.ts \
  "$repo_root/tests/fixtures/ppt-native-visual-benchmark/benchmark.json" \
  "$fixture_input" \
  "$suite_id"

PYTHONPATH="$repo_root/python${PYTHONPATH:+:$PYTHONPATH}" \
  REDCUBE_NATIVE_PPT_RENDERER_AUTO_INSTALL="$renderer_auto_install" \
  "$proof_python" -m redcube_ai.native_helpers.ppt_deck.native \
    --input-json "$fixture_input" \
    --mode author \
    --output-pptx "$native_dir/benchmark-author.pptx" \
    --shape-manifest "$native_dir/benchmark-shape-manifest.json" \
    --preview-dir "$preview_dir" \
    --output-pdf "$native_dir/benchmark-author.pdf" \
    --engine-contract "$repo_root/contracts/runtime-program/ppt-native-python-engine-contract.json" \
    > "$helper_report"

PYTHONPATH="$repo_root/python${PYTHONPATH:+:$PYTHONPATH}" \
  "$proof_python" -m redcube_ai.native_helpers.ppt_deck.native_package \
    "$native_dir/benchmark-author.pptx" \
    --pretty \
    > "$package_readback_report"

if ! node --experimental-strip-types tools/native-ppt-proof/evaluate-quality.ts \
  --fixture "$repo_root/tests/fixtures/ppt-native-visual-benchmark/benchmark.json" \
  --suite-id "$suite_id" \
  --package-readback "$package_readback_report" \
  --shape-manifest "$native_dir/benchmark-shape-manifest.json" \
  --output "$quality_verdict_report" \
  >/dev/null
then
  quality_gate_failed=1
else
  quality_gate_failed=0
fi

"$proof_python" - "$doctor_report" "$manifest_report" "$status_report" "$helper_report" "$package_readback_report" "$quality_verdict_report" "$summary_report" <<'PY'
import json
import sys
from pathlib import Path

doctor = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
manifest = json.loads(Path(sys.argv[2]).read_text(encoding="utf-8"))
status = json.loads(Path(sys.argv[3]).read_text(encoding="utf-8"))
helper = json.loads(Path(sys.argv[4]).read_text(encoding="utf-8"))
package_readback = json.loads(Path(sys.argv[5]).read_text(encoding="utf-8"))
quality_verdict = json.loads(Path(sys.argv[6]).read_text(encoding="utf-8"))
summary_file = Path(sys.argv[7])

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
if quality_verdict.get("status") != "pass_candidate":
    failures.append("native PPT package quality verdict requires route-back")
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
    "native_package_readback": {
        "status": "completed",
        "pptx_sha256": package_readback.get("pptx_sha256"),
        "slide_count": package_readback.get("slide_count"),
        "object_type_counts": package_readback.get("object_type_counts", {}),
        "notes_slide_count": package_readback.get("notes_slide_count"),
        "transition_count": package_readback.get("transition_count"),
        "animation_count": package_readback.get("animation_count"),
        "part_counts": package_readback.get("part_counts", {}),
    },
    "native_quality_verdict": {
        "status": quality_verdict.get("status"),
        "verdict_kind": quality_verdict.get("verdict_kind"),
        "failed_gate_ids": [
            gate.get("gate_id")
            for gate in quality_verdict.get("gates", [])
            if gate.get("status") == "failed"
        ],
        "owner_verdict_claimed": quality_verdict.get("authority", {}).get("owner_verdict_claimed"),
    },
}
summary_file.write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")
print(json.dumps(summary, ensure_ascii=False, indent=2))
PY

"$proof_python" tools/native-ppt-proof/build-artifact-index.py \
  --output-dir "$output_root" \
  --index-file "$artifact_index_report"

"$proof_python" - "$summary_report" "$quality_gate_failed" <<'PY'
import json
import sys
from pathlib import Path

summary = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
quality_gate_failed = int(sys.argv[2])
if summary.get("status") != "passed" or quality_gate_failed:
    raise SystemExit(1)
PY
