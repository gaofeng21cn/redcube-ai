# Stage: artifact_creation

Prompt policy: `agent/prompts/artifact_creation.md`
Required skills: `agent/skills/visual_deliverable_authoring.md`, `agent/skills/native_helper_policy.md`
Professional skills: `agent/professional_skills/rca-ppt-page-author/SKILL.md` for page authoring, `agent/professional_skills/rca-template-profiler/SKILL.md` for template capacity/profile ownership, and `agent/professional_skills/rca-native-ppt-designer/SKILL.md` for native PPTX shape-plan ownership after native route selection.
Quality gates: `agent/quality_gates/visual_authority_boundaries.md`, `agent/quality_gates/artifact_authority.md`
Knowledge refs: `agent/knowledge/artifact_and_export_authority.md`

Requires:
- `visual_direction_accepted`

Ensures:
- `artifact_candidate_rendered`
- `independent_stage_review_receipt_recorded`

Runtime event refs:
- `runtime_event:rca.artifact_creation.candidate_rendered`

Owner boundary:
- RCA owns artifact mutation authorization and canonical artifact authority.
- OPL holds attempt/runtime refs only.
- Producer, reviewer, repairer, and re-reviewer are separate StageAttempts with fresh executor sessions under the same StageRun.
