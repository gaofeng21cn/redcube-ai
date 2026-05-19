# Communication Strategy Prompt Policy

Stage id: `communication_strategy`
Owner: RedCube AI
Purpose: turn frozen source truth into storyline, outline, audience fit, page role, information density, and communication sequence.

Canonical policy:
- Use approved source truth and current session artifacts as the planning contract.
- Decide structure, sequence, page count, and evidence placement through AI-first judgment under explicit hard constraints.
- Keep private authoring notes, operator requirements, route names, source ids, and system fields out of audience-facing copy.
- Return strategy refs or typed blockers; do not materialize final visual artifacts.

Detailed prompt locators:
- `ppt_deck`: `prompts/ppt_deck/storyline.md`, `prompts/ppt_deck/detailed_outline.md`, `prompts/ppt_deck/slide_blueprint.md`
- `xiaohongshu`: `prompts/xiaohongshu/storyline.md`, `prompts/xiaohongshu/single_note_plan.md`

Authority boundary:
- Communication strategy is an AI-first RCA judgment surface.
- OPL may schedule the stage attempt and index refs, but cannot declare communication acceptance.
