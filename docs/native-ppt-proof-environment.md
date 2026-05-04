# Native PPT Proof Environment

This environment is for renderer diagnostics and Linux native proof readiness checks. It does not replace RedCube product-entry, runtime-family routes, `visual_director_review`, `screenshot_review`, or `export_pptx`.

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

Build and run the Docker proof image:

```bash
docker build -f tools/native-ppt-proof/Dockerfile -t redcube-native-ppt-proof .
docker run --rm -it -v "$PWD:/workspace" -w /workspace redcube-native-ppt-proof bash -lc "npm ci && python3 -m redcube_ai.native_helpers.doctor"
```

The doctor reports `renderer_availability.linux_native_proof` with blocked reasons and the suggested Docker command. Fast/meta tests only read diagnostics and importability; they must not invoke the real native PPT renderer or review/export gates.
