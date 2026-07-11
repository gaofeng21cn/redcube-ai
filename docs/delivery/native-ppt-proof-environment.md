# Native PPT Proof Environment

Owner: `RedCube AI`
Purpose: `native_ppt_proof_environment_support`
State: `active_support`
Machine boundary: 人读 proof environment support。机器真相继续归 native helper catalog、proof runner scripts、CI config、runtime-family source、workspace artifacts、rendered proof artifacts 和 review/export receipts。

## Scope

This environment is for renderer diagnostics and native proof readiness checks. It does not replace RedCube product-entry, runtime-family routes, `visual_director_review`, `screenshot_review`, or `export_pptx`.

Native PPT production proof requires true render proof from a supported renderer selected by RCA capability probe / auto bootstrap. The current supported renderer stack is LibreOffice headless -> PDF -> Poppler PNG. Operators do not need to preinstall LibreOffice as a precondition for selecting the native lane; RCA probes the host, may bootstrap through the repo-owned installer or proof container, and fails closed with typed blocker `missing_renderer_dependency` when no supported renderer can be resolved.

Microsoft PowerPoint, AppleScript, synthetic previews, HTML rendering, and `officecli validate` are not accepted proof surfaces for native PPT true render proof.

## AI-first Native PPTX Route

Native editable PPTX 的固定路线是：

`RCA AI-first design pack -> AI-authored editable_shape_plan -> officecli writer / validator -> LibreOffice / Poppler true render QA -> RCA visual_director_review -> RCA screenshot_review -> export_pptx`

其中 `contracts/runtime-program/ppt-native-ai-first-design-pack.json` 是设计纪律合同，不是模板资产、样片库或外部 agent 所有权转移。`editable_shape_plan` 必须由 AI executor 持有具体页面设计、版式语义、坐标、shape role、字体、色彩、connector 和非文字视觉信号；officecli writer / validator 和 Python native helper 只负责物化、保存、校验、渲染、导出 refs 和 fail-closed blocker，不能选择模板、补设计、替换 `design_spec_lock` 或写 RCA visual verdict。

AgentLab suite 只记录 refs：它可以读取 `contracts/production_acceptance/rca-ppt-three-route-agent-lab-suite.json`、收集 native terminal refs、比较 non-regression refs，并把报告交给 OPL / OMA 使用；它不能写 RCA visual truth、artifact body、visual memory body、owner receipt、quality verdict、export verdict，也不能把 suite score 升级成 `visual_ready`、`exportable`、`handoffable` 或 production soak complete。

Mock provider、mock Codex helper 和 deterministic fixture 只用于 route plumbing、contract validation、fail-closed check、officecli materialization、true render proof wiring 和 export-file wiring。它们不能作为 native visual sample、不能展示为视觉质量样片、不能证明真实设计质量。任何 native PPTX visual sample claim 都必须来自 live Codex executor 生成的 `editable_shape_plan`，并同时具备 `design_spec_lock`、`professional_design_brief`、true render screenshots、RCA visual director review、screenshot review 和 export evidence。

样片和证据实例必须落在真实 workspace / runtime artifact root，例如 `/Users/gaofeng/workspace/projects/redcube-ai/runtime-state/` 或具体交付 workspace 下的 runtime-state / artifacts / reports / publish 目录；开发 checkout 只保存 contract、locator、index、schema、refs-only proof 和文档，不保存 PPTX/PDF/PNG 样片或运行证据实例。

当前 native sample proof 只能关闭 native sample materialization / review / export proof lane、hub / connector regression 和 mock hard-count regression。它不声明 production visual-stage long soak、production readiness、domain ready、handoffable、visual ready 或全局完成。具体 dated evidence root、workspace refs、artifact refs 和 run/proof transcript 已折回 [RCA dated production evidence foldback](../history/process/2026-06-03-rca-dated-production-evidence-foldback.md) 与 [real-route evolution probe](../history/process/real-route-evolution-probe.md)；本文只保留当前 native route / proof environment 边界。

AgentLab refs-only suite：

```bash
opl agent-lab run --suite contracts/production_acceptance/rca-ppt-three-route-agent-lab-suite.json --json
```

该命令验证 suite 可读性、refs-only handoff 和 forbidden-authority boundary。它不创建 RCA visual truth，不检查 artifact body，也不能授权 `visual_ready`、`exportable`、`handoffable`、production soak complete 或 owner receipt body。

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

Native PPTX adopts the useful design discipline from `ppt-master`, `officecli-pptx`, PPTAgent, agent-slides, pptx-from-layouts, Presentations-style deck planning, template/schema based projects, and reference-analysis agents without adopting any of them as the RCA authoring owner. The AI-authored `editable_shape_plan` must hold the concrete slide design: `design_spec_lock`, `design_spec_lock.professional_design_brief`, `deck_layout_rhythm_plan`, `template_layout_grammar`, `template_layout_grammar.reference_discipline`, per-slide `template_layout_binding`, coordinates, shape roles, text, `layout_intent`, `composition_signature`, primary grid, non-text visual signal, and a checked anti-template-reuse statement.

`design_spec_lock` controls the deck style system. `deck_layout_rhythm_plan` controls the contact-sheet rhythm before page coordinates exist: the AI must plan each slide's rhetorical role, selected archetype, primary grid, composition budget and proof object, with no three-slide repetition and at least 75% distinct concrete composition in normal decks. `template_layout_grammar` controls the professional layout skeleton before shapes exist: the AI must define real archetype contracts with usage, description, required zones, content schema, required role groups and prohibited mistakes, select an archetype, declare semantic zones with bounds, gaps and safe insets, then bind non-decorative audience-facing shapes to those zones through `layout_zone_id` and keep those shapes inside their declared zones. `template_layout_grammar.reference_discipline` must make template profile, semantic layout selection, placeholder capacity, reference deck analysis, and action-title hierarchy explicit even when no user template file is provided. Preflight verifies the selected archetype is actually fulfilled by visible shape roles and filled required zones; an archetype name without matching structure is rejected before the PPTX writer runs. This is the part RCA absorbs from mature PPT agents and skills: design and layout are front-loaded into the AI contract; QA only blocks drift and returns exact repair feedback.

The native helper does not choose templates or redesign pages. It also does not infer visual defaults for missing shape design fields: `quality_role`, text `font_size`, and non-text fill/line styling must come from the AI-authored shape plan. `slide_blueprint.slides` is context only and cannot substitute for `editable_shape_plan.slides`. The helper validates and materializes the plan, runs officecli writer / QA gates, renders the PPTX through LibreOffice / Poppler, and emits the shape manifest consumed by RCA review gates.

`officecli` is therefore the editable PPTX materializer, not the designer. `ppt-master` is the reference for process discipline: lock a design spec before page authoring, make every page carry a concrete visual plan, run page-level SVG / rendered QA before export, and treat visual drift as a re-authoring problem. RCA keeps those ideas inside its own `visual_direction -> author_pptx_native -> visual_director_review -> screenshot_review -> export_pptx` chain; it does not hand product-entry ownership to `ppt-master`.

Mock Codex helpers are only deterministic test doubles. They may generate fixed shape plans so CI can prove route plumbing, contract validation, fail-closed checks, OfficeCLI materialization, true render proof, and export file wiring. They are not templates, not native PPTX design references, and must not be displayed as visual quality samples. Any native PPTX visual sample claim requires a live Codex executor shape plan plus `editable_shape_plan.design_spec_lock`, per-slide layout intent, LibreOffice / Poppler screenshots, RCA visual director review, screenshot review, and export evidence.

Native visual samples are activated through product-entry machine input, not by patching runtime files or manually selecting helper templates. `delivery_request.constraints.native_visual_sample=true` must hydrate into `contracts/hydrated-deliverable.json`, route cache keys must include the constraint surface, and `author_pptx_native` must then use `prompts/ppt_deck/author_pptx_native_sample.md` with `native_visual_sample_compact`. Existing deliverables may be rehydrated with new constraints by `redcube product invoke` / `redcube native-ppt proof`; the native helper still only validates, materializes, renders, and exports the AI-authored shape plan.

The hard design floor is:

- explicit layout intent and composition signature for every slide;
- deck-level rhythm plan before coordinates, with no repeated selected archetype or primary grid for three consecutive slides;
- top-level `template_layout_grammar` and per-slide `template_layout_binding`;
- archetype catalog entries that include usage, layout description, required zones, content schema and prohibited mistakes;
- selected archetypes fulfilled by actual visible role groups and required-zone coverage before materialization;
- non-decorative audience-facing shapes bound to declared zones and contained by those zones;
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

- Python packages from `pyproject.toml` and the exact `uv.lock` resolution
- Node packages from `npm ci`

Manually running the installer is optional operator preparation, not a product-entry precondition:

```bash
tools/native-ppt-proof/install-deps.sh
```

On macOS this installs LibreOffice through Homebrew cask and Poppler / Noto CJK fonts through Homebrew packages. On Debian or Ubuntu this installs `libreoffice`, `poppler-utils`, and `fonts-noto-cjk` through `apt-get`.

Run the same diagnostics surface locally:

```bash
export UV_PROJECT_ENVIRONMENT="$(mktemp -d)/redcube-ai-native-helper-venv"
uv sync --locked --no-dev --extra native --no-install-project
npm ci
PYTHONPATH=python "$UV_PROJECT_ENVIRONMENT/bin/python" -m redcube_ai.native_helpers.doctor
```

`UV_PROJECT_ENVIRONMENT` must stay outside the checkout. `--no-install-project` keeps the source tree free of `.venv` and `*.egg-info`; native helper callers use the existing `PYTHONPATH=python` package boundary.

Run the repo-owned native proof runner:

```bash
tools/native-ppt-proof/run.sh --output-dir artifacts/native-ppt-proof
```

Run a product-entry native one-slide sample proof through the controlled helper surface:

```bash
npm run --prefix /Users/gaofeng/workspace/redcube-ai redcube -- native-ppt proof \
  --workspace-root <workspace-root> \
  --entry-session-id <entry-session-id> \
  --topic-id <topic-id> \
  --deliverable-id <deliverable-id> \
  --route author_pptx_native \
  --native-sample-slide-count 1
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
