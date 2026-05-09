# Native PPT Proof Environment

## Scope

This environment is for renderer diagnostics and Linux native proof readiness checks. It does not replace RedCube product-entry, runtime-family routes, `visual_director_review`, `screenshot_review`, or `export_pptx`.

Native PPT production proof uses LibreOffice headless -> PDF -> Poppler PNG. Microsoft PowerPoint, AppleScript, and synthetic previews are not accepted proof surfaces.

## Dependencies

Required Linux packages:

- `libreoffice`
- `poppler-utils`
- `fonts-noto-cjk`

Required project dependencies:

- Python packages from `.github/requirements/ci-python.txt`
- Node packages from `npm ci`

Install native proof system dependencies on the current machine:

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

The runner installs native proof system dependencies unless `--skip-system-deps` or `REDCUBE_NATIVE_PPT_PROOF_SKIP_SYSTEM_DEPS=1` is set, builds the TypeScript packages, checks the product-entry manifest/status native lane, and renders the `data_charts` suite from the V2 native PPT benchmark through LibreOffice headless -> PDF -> Poppler PNG. It writes `doctor.json`, `product-manifest.json`, `product-status.json`, `native-helper-output.json`, `proof-summary.json`, `artifact-index.json`, editable PPTX/PDF, shape manifest, and PNG screenshots under the output directory.

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

The doctor reports `renderer_availability.linux_native_proof` with blocked reasons and the suggested Docker command. Fast/meta tests only read diagnostics and importability; they must not invoke the real native PPT renderer or review/export gates.
