# Stage: communication_strategy

Prompt policy: `agent/prompts/communication_strategy.md`
Required skills: `agent/skills/visual_deliverable_authoring.md`
Quality gates: `agent/quality_gates/visual_authority_boundaries.md`, `agent/quality_gates/communication_and_direction.md`
Knowledge refs: `agent/knowledge/communication_visual_direction.md`

Requires:
- `source_truth_frozen`

Ensures:
- `communication_strategy_accepted`

Runtime event refs:
- `runtime_event:rca.communication_strategy.accepted`

Owner boundary:
- RCA owns audience, storyline, outline, and page role judgment.
- OPL cannot convert provider completion into communication acceptance.
