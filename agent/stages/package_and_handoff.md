# Stage: package_and_handoff

Prompt policy: `agent/prompts/package_and_handoff.md`
Required skills: `agent/skills/native_helper_policy.md`
Quality gates: `agent/quality_gates/visual_authority_boundaries.md`, `agent/quality_gates/artifact_authority.md`, `agent/quality_gates/review_export_memory.md`
Knowledge refs: `agent/knowledge/artifact_and_export_authority.md`, `agent/knowledge/owner_receipt_policy.md`

Requires:
- `visual_review_gate_receipt_recorded`

Ensures:
- `export_handoff_receipt_recorded`

Runtime event refs:
- `runtime_event:rca.package_and_handoff.export_handoff_recorded`

Owner boundary:
- RCA owns export readiness and owner receipt signing.
- OPL consumes handoff refs for generated session/workbench/projection surfaces.
