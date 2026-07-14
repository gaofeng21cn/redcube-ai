# Package And Handoff Prompt Policy

Stage id: `package_and_handoff`
Owner: RedCube AI
Purpose: export final files, package manifests, publication copy, resume handles, artifact inventory refs, and owner handoff receipts.

Canonical policy:
- Always materialize the best available export candidate or a no-output diagnostic. Review debt blocks export-ready and handoff-ready claims, not stage progression; include repair refs when useful.
- Produce real files and machine-readable manifest refs; metadata alone cannot stand in for PPTX, PDF, PNG, HTML, caption, or bundle outputs.
- Record source review refs, conversion invocation refs, page-count checks, artifact inventory refs, and handoff receipt refs.
- Treat every producer or repairer output as a package candidate pending formal Review. Producer and repairer Attempts may issue artifact-identity receipts, but they cannot authorize quality, export, publication, handoff-ready, or owner-accepted claims.
- This StageRun uses a controller-managed formal quality loop: `producer -> reviewer -> repairer -> re_reviewer`, with at most three repair rounds. The current executor call performs only its injected Attempt role; it must not run the whole sequence or create the next StageAttempt. Only the OPL StageRunController creates each fresh role Attempt. Reviewer and re-reviewer Attempts use new Codex threads with no producer or repairer conversation inheritance.
- Bind Review to the exact Meta Review successor bytes and hashes. Inspect final exported-file render equivalence, publication-copy fidelity to accepted source, presenter-notes consistency with final visible content, manifest/file/hash closure, and operator handoff usability.
- Keep package Review delta-scoped. Do not repeat the deck-wide Meta Review or reopen already accepted upstream judgments unless final-byte evidence exposes an upstream defect.
- Repair only defects owned by this Stage, including conversion, ordering, package structure, caption/notes materialization, manifest refs, and final-byte rendering regressions. Route story, source, visual-direction, or artifact-authoring defects back to their real owner Stage.
- Producer and repairer return artifact identity and, for repairer, the complete `repair_map`; neither returns `route_impact.stage_quality_cycle.outcome` or a Stage route decision. A reviewer or re-reviewer returns `route_impact.stage_route_decision` for `pass`, `quality_debt`, final-budget `repair_required` with consumable bytes, or a pre-exhaustion `repair_required` whose narrowest owning Stage is a different declared Stage. A package-local defect with repair budget remaining returns only a recommendation so the controller creates this Stage's repairer. An upstream-owned defect may instead terminate this StageRun with `decision_kind=route_back`, a `target_stage_id` different from `package_and_handoff`, and non-empty evidence refs; this is the only terminal route allowed for `repair_required` before budget exhaustion. Hard gates and zero-output attempts return no route decision or recommendation.
- A terminal reviewer or re-reviewer supplies the decisive exact-byte quality outcome and Stage route decision; it does not create a receipt-level verdict, sign an owner receipt, or set a ready flag. At final budget, `repair_required` remains the Review outcome and the controller closes the consumable candidate as `completed_with_quality_debt`. The controller verifies fresh reviewer/producer session identities, maps the outcome to the formal Review receipt verdict, and binds that receipt to the exact candidate receipt, refs, bytes, sizes, and hashes. RCA's owner-receipt authority function then validates the formal receipt and signs the domain owner receipt used by export-ready, publication-ready, handoff-ready, or owner-accepted projections. Re-review must additionally close all prior required findings against the repair map; any repair regression or critical new finding that reopens repair becomes a required finding with a collision-free `finding_id`. Optional observations do not reopen repair and are compatible with `pass`.
- Do not let OPL generated surfaces write artifact bodies, visual truth, memory bodies, review/export verdicts, or owner receipts.

Professional skill routing:
- Route export-readiness review evidence, weak page carryover, package blockers, and handoff repair targets to `agent/professional_skills/rca-ppt-reviewer/SKILL.md`.
- Deterministic export may conditionally preserve an existing non-authority visual-memory proposal from screenshot review and bind terminal review/export refs. It does not invoke the Curator, generate a new proposal, wait for optional memory, or self-sign accept/reject authority.
- Keep native/Office/PPT helpers limited to export, validation, package manifests, and evidence refs; helpers do not authorize review/export verdicts.

Detailed prompt locators:
- `ppt_deck`: `prompts/ppt_deck/export_pptx.md`
- `xiaohongshu`: `prompts/xiaohongshu/publish_copy.md`, `prompts/xiaohongshu/export_bundle.md`
- `poster_onepager`: `prompts/poster_onepager/export_bundle.md`

Authority boundary:
- RCA owns export readiness, artifact mutation authorization, and owner receipt signing.
- OPL StageRunController owns Attempt creation, repair-round budget, receipt materialization, and Stage transition. OPL generated surfaces consume handoff refs and keep generic session/workbench projections; they do not make RCA visual/export judgments.
