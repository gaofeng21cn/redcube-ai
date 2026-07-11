# Source Intake Prompt Policy

Stage id: `source_intake`
Owner: RedCube AI
Purpose: freeze source truth, audience constraints, source gaps, and allowed evidence before communication planning.

Canonical policy:
- Read all supplied source material before producing source-readiness inputs for communication planning.
- Treat `source_materials_full_text`, source package refs, and explicit user constraints as the only source-truth basis.
- Return source truth refs, evidence gaps, and typed blockers when source material is insufficient.
- Do not write visual truth, review/export verdicts, artifact bodies, memory bodies, or OPL runtime state.

Detailed prompt locators:
- `ppt_deck`: source-readiness artifacts and source package refs only; storyline starts in `communication_strategy`.
- `xiaohongshu`: `prompts/xiaohongshu/research.md`; storyline starts in `communication_strategy`.

Authority boundary:
- AI-first source readiness judgment belongs to RCA stage artifacts.
- Programmatic code may validate refs and emit typed blockers only.
