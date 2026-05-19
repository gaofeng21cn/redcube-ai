# Stage: visual_direction

Prompt policy: `agent/prompts/visual_direction.md`
Required skills: `agent/skills/visual_deliverable_authoring.md`
Quality gates: `agent/quality_gates/visual_authority_boundaries.md`, `agent/quality_gates/communication_and_direction.md`
Knowledge refs: `agent/knowledge/communication_visual_direction.md`

Requires:
- `communication_strategy_accepted`

Ensures:
- `visual_direction_accepted`

Runtime event refs:
- `runtime_event:rca.visual_direction.accepted`

Owner boundary:
- RCA owns visual direction acceptance.
- OPL transports and indexes visual direction refs.
