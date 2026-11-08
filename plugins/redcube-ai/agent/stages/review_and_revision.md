# Stage: review_and_revision (Cross-Stage Meta Review)

Prompt policy: `agent/prompts/review_and_revision.md`
Required skills: `agent/skills/visual_deliverable_authoring.md`, `agent/skills/visual_memory_policy.md`
Professional skills: `agent/professional_skills/rca-ppt-reviewer/SKILL.md`, `agent/professional_skills/rca-ppt-visual-director/SKILL.md`, and `agent/professional_skills/rca-visual-memory-curator/SKILL.md` only for the screenshot-review summary's optional non-authority proposal candidate.
Quality gates: `agent/quality_gates/visual_authority_boundaries.md`, `agent/quality_gates/review_export_memory.md`
Knowledge refs: `agent/knowledge/review_export_memory.md`

Requires:
- `artifact_candidate_rendered`
- `independent_stage_review_receipt_recorded`

Ensures:
- `cross_stage_meta_review_receipt_recorded`
- `defect_owner_route_recorded_when_not_passed`

Runtime event refs:
- `runtime_event:rca.review_and_revision.gate_recorded`

Owner boundary:
- RCA owns the deck-level Meta Review verdict and defect-owner judgment.
- OPL provides an independent StageRun/Attempt, transports route-back refs, and prevents upstream conversation inheritance.
- Meta Review never edits upstream artifacts directly.
