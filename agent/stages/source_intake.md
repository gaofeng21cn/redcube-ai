# Stage: source_intake

Prompt policy: `agent/prompts/source_intake.md`
Required skills: `agent/skills/visual_deliverable_authoring.md`
Professional skills: none; source truth is frozen before PPT-specific professional routing begins.
Quality gates: `agent/quality_gates/visual_authority_boundaries.md`, `agent/quality_gates/source_and_truth.md`
Knowledge refs: `agent/knowledge/visual_truth_boundaries.md`

Requires:
- `visual_delivery_request_received`

Ensures:
- `source_truth_frozen`

Runtime event refs:
- `runtime_event:rca.source_intake.source_truth_frozen`

Owner boundary:
- RCA owns source readiness and source truth refs.
- OPL consumes refs and schedules attempts.
