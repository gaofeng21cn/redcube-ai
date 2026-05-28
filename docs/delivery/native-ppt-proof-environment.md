# Native PPT Proof Environment

Owner: `RedCube AI`
Purpose: `native_ppt_proof_environment_support`
State: `active_support`
Machine boundary: 人读 proof environment support。机器真相继续归 native helper catalog、proof runner scripts、CI config、runtime-family source、workspace artifacts、rendered proof artifacts 和 review/export receipts。

## Scope

This environment is for renderer diagnostics and native proof readiness checks. It does not replace RedCube product-entry, runtime-family routes, `visual_director_review`, `screenshot_review`, or `export_pptx`.

Native PPT production proof requires true render proof from a supported renderer selected by RCA capability probe / auto bootstrap. The current supported renderer stack is LibreOffice headless -> PDF -> Poppler PNG. Operators do not need to preinstall LibreOffice as a precondition for selecting the native lane; RCA probes the host, may bootstrap through the repo-owned installer or proof container, and fails closed with typed blocker `missing_renderer_dependency` when no supported renderer can be resolved.

Microsoft PowerPoint, AppleScript, synthetic previews, HTML rendering, and `officecli validate` are not accepted proof surfaces for native PPT true render proof.

## OfficeCLI Materializer Discipline

RCA remains the native PPTX workflow owner. The `officecli-pptx` skill is not adopted as the native authoring loop, and it does not replace RCA `storyline -> detailed_outline -> slide_blueprint -> visual_direction -> author_pptx_native -> visual_director_review -> screenshot_review -> export_pptx`.

The adopted boundary is a materializer / QA discipline:

- `author_pptx_native` and `repair_pptx_native` stay RCA routes.
- The current PPTX writer remains `officecli_pptx_materializer`.
- Future officecli writer adapters must still report into the RCA native route artifact, shape manifest, review state, and export bundle.
- `officecli save` before `close`, `officecli validate`, `officecli view issues`, and `officecli view text` are gate refs for editable PPTX QA.
- `officecli validate` and `officecli view issues` can catch writer or text-box defects, but they cannot substitute for LibreOffice headless true render proof or RCA screenshot review.
- Native CJK rendering should prefer `Noto Sans CJK SC` when an officecli-backed adapter materializes or validates Chinese PPTX output.

## Design Discipline

Native PPTX adopts the useful design discipline from `ppt-master` and `officecli-pptx` without adopting either as the RCA authoring owner. The AI-authored `editable_shape_plan` must hold the concrete slide design: `design_spec_lock`, `template_layout_grammar`, per-slide `template_layout_binding`, coordinates, shape roles, text, `layout_intent`, `composition_signature`, primary grid, non-text visual signal, and a checked anti-template-reuse statement.

`design_spec_lock` controls the deck style system. `template_layout_grammar` controls the professional layout skeleton before shapes exist: the AI must select an archetype, declare semantic zones with bounds, gaps and safe insets, then bind non-decorative audience-facing shapes to those zones through `layout_zone_id`. This is the part RCA absorbs from mature PPT agents and skills: design and layout are front-loaded into the AI contract; QA only blocks drift and returns exact repair feedback.

The native helper does not choose templates or redesign pages. It validates and materializes the plan, runs officecli writer / QA gates, renders the PPTX through LibreOffice / Poppler, and emits the shape manifest consumed by RCA review gates.

`officecli` is therefore the editable PPTX materializer, not the designer. `ppt-master` is the reference for process discipline: lock a design spec before page authoring, make every page carry a concrete visual plan, run page-level SVG / rendered QA before export, and treat visual drift as a re-authoring problem. RCA keeps those ideas inside its own `visual_direction -> author_pptx_native -> visual_director_review -> screenshot_review -> export_pptx` chain; it does not hand product-entry ownership to `ppt-master`.

Mock Codex helpers are only deterministic test doubles. They may generate fixed shape plans so CI can prove route plumbing, contract validation, fail-closed checks, OfficeCLI materialization, true render proof, and export file wiring. They are not templates, not native PPTX design references, and must not be displayed as visual quality samples. Any native PPTX visual sample claim requires a live Codex executor shape plan plus `editable_shape_plan.design_spec_lock`, per-slide layout intent, LibreOffice / Poppler screenshots, RCA visual director review, screenshot review, and export evidence.

The hard design floor is:

- explicit layout intent and composition signature for every slide;
- top-level `template_layout_grammar` and per-slide `template_layout_binding`;
- no decorative title underline motif;
- no empty four-card template posing as design;
- no three-slide repeated concrete composition;
- distinct concrete composition for at least 75% of slides in normal decks;
- readable typography, filled slots, content depth, grid balance, and non-text visual metrics in the shape manifest;
- chart, table, and metric-grid shapes require non-empty matching metrics, otherwise screenshot review fails closed.

## Quality Non-Regression Surface

Native editable PPTX exposes a refs-only quality non-regression surface for OPL Agent Lab at `contracts/runtime-program/ppt-native-pptx-quality-nonregression.json`.

The surface contains shape manifest metric refs, editable shape plan refs, true render proof refs, blocked-page-only `repair_pptx_native` evidence refs, export proof summary refs, and standard Agent Lab suite input refs. Agent Lab may compare and score those refs for optimization, but that score is not an RCA visual verdict and cannot authorize visual ready, exportable, handoffable, artifact writes, memory body writes, or quality/export verdicts.

Native PPTX proof is valid only when the shape manifest carries readable typography and layout gates in addition to true render proof: body text must stay at or above the readability floor, title/body hierarchy must remain explicit, title and core sentence text must not collide, and block-content overflow must fail closed. These gates are part of the RCA `screenshot_review` input surface, not post-export manual inspection.

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
