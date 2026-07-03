# Communication Strategy Prompt Policy

Stage id: `communication_strategy`
Owner: RedCube AI
Purpose: turn frozen source truth into storyline, outline, audience fit, page role, information density, and communication sequence.

Canonical policy:
- Use approved source truth and current session artifacts as the planning contract.
- Decide structure, sequence, page count, and evidence placement through AI-first judgment under explicit hard constraints.
- Keep private authoring notes, operator requirements, route names, source ids, and system fields out of audience-facing copy.
- Return strategy refs or typed blockers; do not materialize final visual artifacts.

Professional skill routing:
- Route PPT claim spine, storyline, detailed outline, page roles, density, and slide blueprint work to `agent/professional_skills/rca-ppt-story-architect/SKILL.md`.
- Keep `agent/skills/*.md` as stage skill policy refs only; they do not replace the professional specialist skill.

Detailed prompt locators:
- `ppt_deck`: `prompts/ppt_deck/storyline.md`, `prompts/ppt_deck/detailed_outline.md`, `prompts/ppt_deck/slide_blueprint.md`
- `xiaohongshu`: `prompts/xiaohongshu/storyline.md`, `prompts/xiaohongshu/single_note_plan.md`

Authority boundary:
- Communication strategy is an AI-first RCA judgment surface.
- OPL may schedule the stage attempt and index refs, but cannot declare communication acceptance.
