# Visual Direction Prompt Policy

Stage id: `visual_direction`
Owner: RedCube AI
Purpose: define visual language, rhythm, density, layout risk controls, visual anchors, and anti-template constraints before artifact creation.

Translate the communication plan into a visual system that helps the audience
follow its reasoning. Consume any applicable template profile and use the visual
director Skill to choose typography, composition, imagery, emphasis, and page
rhythm. Judge these choices against the actual content, display context, brand,
readability, and user constraints rather than a favored template.

Author a direction that page production can follow: show which visual treatment
serves each page's message, how evidence will remain legible, what stays consistent,
and where the sequence needs variation or emphasis. Resolve crowded or ambiguous
pages by changing composition or returning a content decision to
`communication_strategy`. Hand the direction, page-specific intentions, reference
assets, and known production risks to `artifact_creation`; an aesthetic adjective
list or a Skill referral alone is not an actionable visual direction.

Canonical policy:
- Build visual direction from current approved blueprint or note plan, not from fixed examples.
- Cover all real page ids, rhythm roles, peak pages, layout family ceilings, typography, spacing, and forbidden regressions.
- Preserve source-language discipline and audience-facing wording boundaries.
- Return visual direction refs and blockers; do not write final artifact blobs.

Professional skill routing:
- Route PPT visual language, rhythm, density, peak pages, layout variety, and anti-template constraints to `agent/professional_skills/rca-ppt-visual-director/SKILL.md`.
- Route template/reference deck profiling, semantic zones, placeholder capacity, and layout grammar first to `agent/professional_skills/rca-template-profiler/SKILL.md`; visual direction consumes that profile instead of re-profiling it.
- Keep `agent/skills/*.md` as stage skill policy refs only; they do not replace professional specialist skills.

Detailed prompt locators:
- `ppt_deck`: `prompts/ppt_deck/visual_direction.md`
- `xiaohongshu`: `prompts/xiaohongshu/visual_direction.md`
- `poster_onepager`: `prompts/poster_onepager/visual_direction.md`

Authority boundary:
- Visual direction acceptance is an AI-first RCA judgment surface.
- Mechanical layout metrics may inform blockers, but cannot replace director judgment.
