# Visual Direction Prompt Policy

Stage id: `visual_direction`
Owner: RedCube AI
Purpose: define visual language, rhythm, density, layout risk controls, visual anchors, and anti-template constraints before artifact creation.

Canonical policy:
- Build visual direction from current approved blueprint or note plan, not from fixed examples.
- Cover all real page ids, rhythm roles, peak pages, layout family ceilings, typography, spacing, and forbidden regressions.
- Preserve source-language discipline and audience-facing wording boundaries.
- Return visual direction refs and blockers; do not write final artifact blobs.

Detailed prompt locators:
- `ppt_deck`: `prompts/ppt_deck/visual_direction.md`
- `xiaohongshu`: `prompts/xiaohongshu/visual_direction.md`

Authority boundary:
- Visual direction acceptance is an AI-first RCA judgment surface.
- Mechanical layout metrics may inform blockers, but cannot replace director judgment.
