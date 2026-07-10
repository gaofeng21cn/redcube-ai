# Stage: review_and_revision

Prompt policy: `agent/prompts/review_and_revision.md`
Required skills: `agent/skills/visual_deliverable_authoring.md`, `agent/skills/visual_memory_policy.md`
Professional skills: `agent/professional_skills/rca-ppt-reviewer/SKILL.md`, `agent/professional_skills/rca-ppt-visual-director/SKILL.md`, `agent/professional_skills/rca-visual-memory-curator/SKILL.md` for evidence-backed proposal candidates only.
Quality gates: `agent/quality_gates/visual_authority_boundaries.md`, `agent/quality_gates/review_export_memory.md`
Knowledge refs: `agent/knowledge/review_export_memory.md`

Requires:
- `artifact_candidate_rendered`

Ensures:
- `visual_review_gate_receipt_recorded`

Runtime event refs:
- `runtime_event:rca.review_and_revision.gate_recorded`

Owner boundary:
- RCA owns review verdict, repair target judgment, and visual memory accept/reject.
- OPL transports review and repair refs only.
