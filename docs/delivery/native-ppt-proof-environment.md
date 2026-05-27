# Native PPT Proof Environment

Owner: `RedCube AI`
Purpose: `native_ppt_proof_environment_support`
State: `active_support`
Machine boundary: 人读 proof environment support。机器真相继续归 native helper catalog、proof runner scripts、CI config、runtime-family source、workspace artifacts、rendered proof artifacts 和 review/export receipts。

## Scope

This environment is for renderer diagnostics and native proof readiness checks. It does not replace RedCube product-entry, runtime-family routes, `visual_director_review`, `screenshot_review`, or `export_pptx`.

Native PPT production proof requires true render proof from a supported renderer selected by RCA capability probe / auto bootstrap. The current supported renderer stack is LibreOffice headless -> PDF -> Poppler PNG. Operators do not need to preinstall LibreOffice as a precondition for selecting the native lane; RCA probes the host, may bootstrap through the repo-owned installer or proof container, and fails closed with typed blocker `missing_renderer_dependency` when no supported renderer can be resolved.

Microsoft PowerPoint, AppleScript, synthetic previews, HTML rendering, and `officecli validate` are not accepted proof surfaces for native PPT true render proof.

## Quality Non-Regression Surface

Native editable PPTX exposes a refs-only quality non-regression surface for OPL Agent Lab at `contracts/runtime-program/ppt-native-pptx-quality-nonregression.json`.

The surface contains shape manifest metric refs, editable shape plan refs, true render proof refs, blocked-page-only `repair_pptx_native` evidence refs, export proof summary refs, and standard Agent Lab suite input refs. Agent Lab may compare and score those refs for optimization, but that score is not an RCA visual verdict and cannot authorize visual ready, exportable, handoffable, artifact writes, memory body writes, or quality/export verdicts.

The route boundary remains unchanged:

- `author_pptx_native` and `repair_pptx_native` are explicit optional native PPTX routes.
- The default `ppt_deck` visual route remains image-first page authoring.
- `visual_director_review`, `screenshot_review`, and `export_pptx` remain required RCA-owned gates.
- The Python helper can execute, validate, render/export, and emit shape/render/repair refs; it cannot replace the AI creative owner or write visual truth.

## Renderer Resolution

Native proof dependency handling is contract-backed:

- `renderer_selection_policy`: `capability_probe_auto_bootstrap`
- `supported_renderers`: `libreoffice_headless` with pipeline `libreoffice_headless_pdf_png_v1`
- required capabilities: `soffice_headless`, `pdftoppm`
- repo-owned installer: `tools/native-ppt-proof/install-deps.sh`
- proof container: `tools/native-ppt-proof/Dockerfile`
- fail-closed typed blocker: `missing_renderer_dependency`

RCA may install or provide these system dependencies for proof execution:

- `libreoffice`
- `poppler-utils`
- `fonts-noto-cjk`

Required project dependencies:

- Python packages from `.github/requirements/ci-python.txt`
- Node packages from `npm ci`

Manually running the installer is optional operator preparation, not a product-entry precondition:

```bash
tools/native-ppt-proof/install-deps.sh
```

On macOS this installs LibreOffice through Homebrew cask and Poppler / Noto CJK fonts through Homebrew packages. On Debian or Ubuntu this installs `libreoffice`, `poppler-utils`, and `fonts-noto-cjk` through `apt-get`.

Run the same diagnostics surface locally:

```bash
python3 -m pip install -r .github/requirements/ci-python.txt
npm ci
python3 -m redcube_ai.native_helpers.doctor
```

Run the repo-owned native proof runner:

```bash
tools/native-ppt-proof/run.sh --output-dir artifacts/native-ppt-proof
```

The runner probes native proof system dependencies and installs them unless `--skip-system-deps` or `REDCUBE_NATIVE_PPT_PROOF_SKIP_SYSTEM_DEPS=1` is set, builds the TypeScript packages, checks the product-entry manifest/status native lane, and renders the `data_charts` suite from the V2 native PPT benchmark through LibreOffice headless -> PDF -> Poppler PNG. It writes `doctor.json`, `product-manifest.json`, `product-status.json`, `native-helper-output.json`, `proof-summary.json`, `artifact-index.json`, editable PPTX/PDF, shape manifest, and PNG screenshots under the output directory.

The native proof CI job is intentionally optional. It runs on `workflow_dispatch`, the nightly schedule, or a pull request labeled `native-ppt-proof`; default push and PR quality jobs keep true renderer execution out of the fast/meta lane.

For a full product-entry smoke instead of the fixture runner, use:

```bash
REDCUBE_TEST_PYTHON=/path/to/playwright-enabled/python \
  node --experimental-strip-types --test tests/product-entry-native-ppt-live-proof.test.ts
```

Build and run the Docker proof image:

```bash
docker build -f tools/native-ppt-proof/Dockerfile -t redcube-native-ppt-proof .
docker run --rm -it -v "$PWD:/workspace" -w /workspace redcube-native-ppt-proof bash -lc "npm ci && tools/native-ppt-proof/run.sh --skip-system-deps --output-dir artifacts/native-ppt-proof"
```

The doctor reports `renderer_availability.linux_native_proof` with blocked reasons and the suggested Docker command. If capability probing and auto bootstrap cannot resolve LibreOffice headless plus Poppler, the native proof lane remains fail-closed with `missing_renderer_dependency`; synthetic previews, HTML proof, and `officecli validate` remain disallowed substitutes. Fast/meta tests only read diagnostics and importability; they must not invoke the real native PPT renderer or review/export gates.
