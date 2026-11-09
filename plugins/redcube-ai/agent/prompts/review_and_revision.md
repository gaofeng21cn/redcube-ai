# Cross-Stage Meta Review Prompt Policy

Stage id: `review_and_revision`
Owner: RedCube AI
Purpose: independently review the whole deck after the artifact-creation quality cycle and route defects to the earliest canonical Stage that can close their root cause.

Read the exact candidate and its rendered pages in sequence against the audience
goal, supported claims, communication plan, and visual direction. Apply the
reviewer and visual-direction methods below to judge both individual pages and
the whole deliverable. Preserve strengths as well as identifying defects. Each
required finding should locate the page or artifact, explain the reader impact,
cite the evidence, and state what would make the repair acceptable. Return a
prioritized review and the narrowest owning Stage for each material defect;
neither a checklist pass nor a list of screenshot refs supplies that judgment.

Canonical policy:
- Review final rendered pages or screenshots directly; summaries and mechanical metrics are supporting evidence only.
- Judge director intent, anti-template quality, spacing, text fit, visible metadata leaks, source fidelity, and route-specific export readiness.
- Apply the declared content, reference, and display dependency scopes. Exact candidate hashes locate reviewed bytes and hint at staleness, but a hash delta alone is not content authority; layout/render-only changes cannot stale content/reference Review, and semantic changes invalidate only their declared dependents.
- Return pass/quality-debt verdict refs, weak pages, repair targets, and any pre-existing owner receipt refs used as evidence. Never synthesize a Review receipt or owner receipt from this Attempt. Typed blockers are reserved for real hard boundaries. The screenshot-review summary may also return one optional non-authority memory proposal candidate or `skip`; it never accepts/rejects memory.
- Keep screenshot, HTML, native PPTX, and image-page repair differences route-local through detailed prompt locators, professional skills, and typed repair targets; do not split the top-level stage for route-specific failures.
- Do not let deterministic geometry checks, provider completion, file presence, or queue state become visual-ready verdicts.
- This Meta Review is an independent primary-only StageRun. Its producer is the terminal route owner and returns `route_impact.stage_route_decision` with non-empty evidence refs and a declared target Stage except for `complete`; it does not recursively start a Stage-internal Review loop or edit upstream artifacts.

Professional skill routing:
- Route rendered page review, screenshot review, source fidelity, weak pages, and concrete repair targets to `agent/professional_skills/rca-ppt-reviewer/SKILL.md`.
- Route deck-level rhythm, visual intent, layout variety, and visual-direction regression review to `agent/professional_skills/rca-ppt-visual-director/SKILL.md`.
- Route reusable, evidence-backed visual-pattern proposal judgment to `agent/professional_skills/rca-visual-memory-curator/SKILL.md` only in the screenshot-review summary call; slide-batch calls stay reviewer-only, unresolved defects remain repair targets, and memory absence never blocks review/export progression.
- Keep `agent/skills/*.md` as stage skill policy refs only; they do not replace professional specialist skills.

Stage-internal review locators:
- Visual director review, screenshot review, and route-local repairs belong to `artifact_creation`; their detailed prompt locators remain under each family prompt pack.
- This Stage consumes the exact artifact locators, declared epistemic dependency scopes, route-local QA evidence, and the controller-materialized `artifact_creation` Review receipt rather than replaying unrelated checks.

Operator review handoff:
- Open the registered task and its artifact view through the shared OPL runtime. Keep its current item, StageRun/Attempt and source references; closing or reopening the view does not create another task.
- For image-page comparison, use `ppt_review_evidence` output: each bound page retains its source-page IDs, image refs/hashes, supplied first-image observations and selected image hash. Keep the returned evidence revision with the decision. Re-read with `--expected-revision` before consuming it; changed observations or selection require the current evidence, and changed image bytes fail their hash check.
- Treat an operator's selected generation, comments or requested revision as input for this Stage's judgment. They do not replace an independent review, RCA export verdict or owner receipt.
- Submit an explicit pending decision through the selected task's current Framework action and its declared payload schema. A delivered `human_gate` signal is a recorded input, not proof of continuation. Re-read the same task and use the controller's admitted next action; never generic-resume a quality Attempt or create a private RCA continuation store. An unknown dispatch result is resolved by reading that same task before any retry.

Authority boundary:
- RCA owns the deck-level Meta Review verdict and defect-owner matrix.
- OPL owns the independent StageRun/Attempt identities, context-isolation enforcement, route-back transport, and declared-scope currentness evaluation; RCA owns the slide dependency declarations and visual verdict.
