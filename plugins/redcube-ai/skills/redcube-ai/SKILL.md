---
name: redcube-ai
description: Use when Codex needs RedCube AI (RCA) to create, revise, review, or package a visual deliverable such as a slide deck/PPT, poster, social visual, or visual handoff. Ordinary PPT/PPTX requests default to full-slide images packaged in a .pptx container; select native editable PowerPoint only when the current user explicitly requires editable/native objects. Do not use for Agent engineering merely because OMA is mentioned.
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
2. For PPT decks, follow `storyline -> detailed_outline -> slide_blueprint -> visual_direction -> author_image_pages -> visual_director_review -> screenshot_review -> export_pptx` unless explicit native admission selected the locked native lane.
3. Generate each image-first slide as a complete 16:9 page image, review the rendered pages, repair only identified slide ids, and package the accepted best pages into a valid `.pptx`.
4. For long decks, keep source intake, plan, production, review, and package work in the same recoverable StageRun. Preserve approved storyline, outline, and slide-blueprint refs rather than recompressing them into a new prompt.
5. Preserve user requests for plan review, approval, or staged continuation as a declared human-review intent. The hosted controller materializes the gate; RCA does not create a private pause/resume mechanism.
6. Lock the selected image/native/HTML lane for the deliverable. Validator or repair failure cannot silently switch lanes.

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

- `contracts/action_catalog.json`
- `agent/stages/manifest.json`
- `contracts/runtime-program/ppt-image-first-production-route.json`
- `contracts/stage_quality_cycle_policy.json`
- `contracts/owner_receipt_contract.json`
- `docs/project.md`
- `docs/architecture.md`
- `docs/status.md`
