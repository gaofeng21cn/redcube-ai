# Stage: package_and_handoff

Prompt policy: `agent/prompts/package_and_handoff.md`
Required skills: `agent/skills/native_helper_policy.md`
Professional skills: `agent/professional_skills/rca-ppt-reviewer/SKILL.md`. Existing non-authority visual-memory proposals are conditionally transported by deterministic export, not regenerated or accepted/rejected in this stage.
Quality gates: `agent/quality_gates/visual_authority_boundaries.md`, `agent/quality_gates/artifact_authority.md`, `agent/quality_gates/review_export_memory.md`
Knowledge refs: `agent/knowledge/artifact_and_export_authority.md`, `agent/knowledge/owner_receipt_policy.md`

Requires:
- `visual_review_gate_receipt_recorded`

Ensures:
- `export_handoff_receipt_recorded`
- `final_byte_handoff_review_receipt_recorded`

Runtime event refs:
- `runtime_event:rca.package_and_handoff.export_handoff_recorded`

Owner boundary:
- RCA owns export readiness and owner receipt signing.
- OPL consumes handoff refs for generated session/workbench/projection surfaces.
- Producer and repairer own package materialization only and cannot return a Review outcome. Reviewer and re-reviewer provide the decisive exact-byte quality outcome and terminal Stage route judgment. A package-local `repair_required` continues the bounded Repair/Re-review loop while budget remains; an upstream-owned required finding may instead close this StageRun early with an evidence-backed `route_back` to a different declared Stage. Final-budget `repair_required` over consumable bytes closes as quality debt rather than reopening or blocking. The OPL controller materializes the formal Review receipt; RCA owner authority consumes that receipt and the exact artifact identity before signing any final quality/export/publication/ready owner claim.
