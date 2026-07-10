# Source Intake Prompt Policy

Stage id: `source_intake`
Owner: RedCube AI
Purpose: freeze source truth, source readiness, research refs, source gaps, and allowed evidence before communication planning.

Canonical policy:
- Read all supplied source material before producing source readiness or research refs.
- Treat `source_materials_full_text`, source package refs, and explicit user constraints as the only source-truth basis.
- Return source truth refs, research refs, evidence gaps, and typed blockers when source material is insufficient.
- Leave storyline, outline, page-role, and communication-sequence judgment to `communication_strategy`.
- Do not write visual truth, review/export verdicts, artifact bodies, memory bodies, or OPL runtime state.

Detailed prompt locators:
- `xiaohongshu`: `prompts/xiaohongshu/research.md`

Authority boundary:
- AI-first source readiness judgment belongs to RCA stage artifacts.
- Programmatic code may validate refs and emit typed blockers only.
