# Cross-Stage Meta Review Prompt Policy

Stage id: `review_and_revision`
Owner: RedCube AI
Purpose: independently review the whole deck after the artifact-creation quality cycle and route defects to the earliest canonical Stage that can close their root cause.

Canonical policy:
- Review final rendered pages or screenshots directly; summaries and mechanical metrics are supporting evidence only.
- Judge director intent, anti-template quality, spacing, text fit, visible metadata leaks, source fidelity, and route-specific export readiness.
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
- This Stage consumes the exact artifacts, route-local QA evidence, and the controller-materialized `artifact_creation` Review receipt rather than replaying those checks.

Authority boundary:
- RCA owns the deck-level Meta Review verdict and defect-owner matrix.
- OPL owns the independent StageRun/Attempt identities, context-isolation enforcement, route-back transport, and stale-ref invalidation transport.
