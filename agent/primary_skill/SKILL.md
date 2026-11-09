---
name: redcube-ai
description: Use when Codex needs RedCube AI (RCA) to create, revise, review, or package a visual deliverable such as a slide deck/PPT, poster, social visual, or visual handoff.
---

# RedCube AI

Canonical OPL Agent and Package id is `rca`; `redcube-ai` is the repository, Codex plugin, and Skill carrier name. Operate RCA only through its installed OPL-generated interfaces and hosted StageRun.

## Admission

- Admit RCA for visual-deliverable work. A request for a PPT, presentation, or slides is a visual-deliverable request even when the requested final filename ends in `.pptx`.
- A selected or `@`-mentioned OMA / OPL Meta Agent does not authorize Agent engineering. Keep the work in RCA unless the user explicitly asks to create, take over, improve, or modify an Agent, Skill, prompt, contract, evaluation, or source.
- Validator, render, screenshot, or QA failures authorize repair of the current deliverable only. They do not authorize modification of RCA itself.
- Do not bypass RCA with generic `Presentations`, `python-pptx`, Office automation, ad-hoc scripts, or direct checkout edits unless the user explicitly asks to explore an alternative implementation route.
- Before materializing files, bind the current StageRun identity, exact input refs, deliverable target, and RCA authority scope.

## Action Routing

Use only the public actions declared in `contracts/action_catalog.json`:

- `invoke_product_entry`: normal entry for a complete visual deliverable. Use this by default.
- `run_image_ppt_proof`: focused image-first PPT proof beginning at `artifact_creation`; use only when the request is specifically for that proof lane.
- `run_native_ppt_proof`: focused editable-native PPT proof beginning at `artifact_creation`; use only after explicit native admission.

For a `ppt_deck`, decide the authoring lane from the complete current user request:

- Default to `author_image_pages / repair_image_pages` and a final `pptx_with_full_slide_images` container.
- Generic “PPT”, “slides”, or `.pptx` wording; an attached/reference PPTX; a hospital/company template; “follow this template/style”; speaker notes; PDF export; or an Agent/helper preference is not enough to admit native authoring.
- Admit `author_pptx_native / repair_pptx_native` only when the user explicitly requires editable text, shapes, charts, tables, native PowerPoint objects, DrawingML, editable masters/layouts/placeholders/themes, or explicitly requests the native PPTX route.
- Treat these as semantic boundary examples, not trigger tokens. The decisive Codex Attempt owns whole-request judgment; keyword, regex, extension, or deterministic-script selection is forbidden.
- When evidence is missing or ambiguous, select image-first without asking a route-preference question. Never claim that image-page contents are editable.

## Default Workflow

1. Invoke `invoke_product_entry` once and preserve one StageRun lineage from source intake through handoff.
   Bind the exact `project_id` from the authorized workspace inventory. All three
   hosted actions resolve this identity to the registered project root; do not
   substitute an arbitrary path or omit project-specific knowledge.
2. For PPT decks, follow `storyline -> detailed_outline -> slide_blueprint -> visual_direction -> author_image_pages -> visual_director_review -> screenshot_review -> export_pptx` unless explicit native admission selected the locked native lane.
3. Generate each image-first slide as a complete 16:9 page image, review the rendered pages, repair only identified slide ids, and package the accepted best pages into a valid `.pptx`.
4. For long decks, keep source intake, plan, production, review, and package work in the same recoverable StageRun. Preserve approved storyline, outline, and slide-blueprint refs rather than recompressing them into a new prompt.
5. Preserve user requests for plan review, approval, or staged continuation as a declared human-review intent. The hosted controller materializes the gate; RCA does not create a private pause/resume mechanism.
6. Lock the selected image/native/HTML lane for the deliverable. Validator or repair failure cannot silently switch lanes.

For HTML fidelity, use the page-author's actual-render method and the reviewer's
actual-font/final-file evidence method. For image-heavy review, retain accepted
page refs and remaining work in the existing StageRun artifacts, budget bytes
separately from tokens, and serialize image-bearing tool results only on routes
with observed ordering incompatibility. Tool-output errors do not prove that
execution failed; return a redacted diagnostic to the hosted controller without
fabricating outputs or replaying the full image history. Source/render/package
currentness, final-copy fidelity and native-viewer evidence remain distinct.

## Image Generation Execution

- For `author_image_pages` and `repair_image_pages`, prefer the Codex system skill `imagegen` and the built-in `image_gen` tool. Determine tool availability only from the active executor tool inventory; the callable may be rendered as `image_gen.imagegen` or `image_gen__imagegen`. Skill installation alone is not proof that a hosted executor injected the tool.
- The built-in route does not require `OPENAI_API_KEY`. Do not inspect, request, or block on that environment variable before calling an available built-in tool.
- If the built-in tool is absent or confirmed unavailable before execution, immediately use the automatic API fallback in `contracts/runtime-program/ppt-image-first-production-route.json`. An unknown built-in execution outcome requires reconciliation before fallback. Selecting RCA's default image-first route already authorizes this same-model fallback; do not ask the user to confirm it and do not ask them to create, paste, or export another API key first.
- Call `node <RCA package root>/agent/tools/generate-image.mjs` with a JSON request on stdin: `prompt`, a new `output_path`, optional `size`, `quality`, `background`, `reference_image_paths` and `timeout_ms`. The helper calls `runDomainImageGeneration` from `opl-framework/domain-task-runtime` with `gpt-image-2`; reference images select the edit operation. Framework resolves the configured model connection and keeps credentials inside its process. RCA does not read provider configuration or install a second image client.
- The helper resolves the Framework-owned package link. If the public entry is missing, return `framework_image_generation_unavailable` for Framework installation/link repair. If the provider rejects the call or the outcome is unknown, return the redacted failure code and outcome. Do not retry an unknown result or overwrite an existing image; reconcile first. Image materialization does not approve visual quality or export readiness.

## Quality And Hard Stops

- Treat retry and repair counts as quality budgets, not transition gates. After initial production, allow at most three `repairer + re_reviewer` rounds, then continue with the best readable artifact and explicit quality debt.
- Any readable partial artifact, review finding, failed attempt, or negative result may feed the next declared stage as `completed` or `completed_with_quality_debt`.
- If no consumable page exists or output is corrupt/unreadable, materialize a no-output/failure diagnostic and continue the declared route with readiness claims closed.
- Only executor unavailability, permission/credential/safety or authority boundaries, wrong-target identity/currentness, an irreversible action, or an explicit human decision may hard-stop progress.
- Quality debt may recommend a route-back or targeted repair, but it cannot create an unbounded loop. It always blocks `visual_ready`, `export_ready`, production-ready, and equivalent claims.

## Output Expectations

- Return RCA artifact, review/export, memory, typed blocker, owner receipt, and StageRun/Attempt lineage refs; do not return a parallel private session or status model.
- For the default PPT route, return a legal `.pptx` whose pages are complete slide images, plus the page manifest and review evidence. State that internal slide objects are not editable.
- Name the selected authoring lane and any exhausted repair budget or remaining quality debt.
- Use OPL-generated status/workbench surfaces to report progress and resume the same invocation.

## References

Resolve these refs from the installed RCA carrier root, two directories above
this installed Skill. It contains the owner-projected declarative pack, contracts,
native helpers, and reference docs. Edit the canonical owner sources when
maintaining RCA, then regenerate the carrier with `scripts/sync_carrier.py`.
Load the contract or professional resource for the selected action and stage,
and reuse accepted refs while their source, user constraints, and scope remain current.

- `contracts/action_catalog.json`
- `agent/stages/manifest.json`
- `contracts/runtime-program/ppt-image-first-production-route.json`
- `contracts/stage_quality_cycle_policy.json`
- `contracts/owner_receipt_contract.json`
- `agent/professional_skills/rca-ppt-page-author/SKILL.md`
- `agent/professional_skills/rca-ppt-reviewer/SKILL.md`
- `docs/project.md`
- `docs/architecture.md`
- `docs/status.md`

## Durable Knowledge And User Sources

Use OPL knowledge recall for the current repository, domain, stage and
authorized workspace/project context. The hosted StageRun binds one exact
snapshot for producer, reviewer and repair roles. Cite selected knowledge IDs,
scopes and digests; a frozen snapshot records what this task used.

The product catalog at contracts/durable_knowledge_catalog.json indexes
agent/knowledge/. Keep product, owner/team, topic and project scopes separate
from mechanism, policy, state and decision content kinds. A person's visual
preferences belong to their owner or topic source; one deck's audience and
style decisions belong to its project. Current production state retains its
observation time and validity instead of becoming a permanent style rule.

Bind each private knowledge item to its single editable source through the
Framework's authorized source bindings. Existing Obsidian notes remain there;
without a personal library, ordinary workspace Markdown is the source. Both
can be used in one task. Do not require an intermediate Markdown copy, move
project artifacts into a personal library, or create an RCA-specific personal
knowledge store. Runtime snapshots, proposals and receipts remain execution
records, not alternate editable knowledge.

Review currentness, permissions and source revisions before use. Missing
optional pattern examples do not block production; missing required audience
constraints or source authorization block the decisions that depend on them.
Source changes invalidate affected derived summaries, and revoked access cannot
be bypassed through a previous snapshot. Before a real publish/export action,
recheck its required source authorization and action-critical constraints.

Propose reusable lessons with source evidence, the intended scope and the base
revision. RCA or the authorized knowledge owner accepts their semantic content;
Framework provides shared version checks, scoped snapshots and recoverable
write mechanics. Apply accepted updates to the original source and use the new
version in the next task. Private experience requires explicit review and
de-identification before entering the distributable product knowledge.
