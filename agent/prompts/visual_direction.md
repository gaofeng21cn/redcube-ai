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
- For PPT work, apply `agent/knowledge/ppt_style_calibration.md`: bind reference roles, specify the accepted mark-making/material/lettering, and calibrate representative risks before scaling. Existing current accepted pages may suffice. Do not turn calibration into an additional approval gate.
- Resolve a selectable `style_profile_id` from `prompts/ppt_deck/style_profiles.json` and the professional style registry. Keep the profile independent from `communication_mode_id` and visualization-pattern selection. The profile supplies visual language and anti-regression checks; it cannot rewrite the claim spine, facts, page duties, or native-route admission.
- For image-first lecture pages, the direction must explicitly state the first-glance object, relationship encoding, visible-copy budget, and the selected profile's prompt recipe. A decorative scene with text added later is an invalid direction.
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

- Select the reference-input strategy for the actual image route. Text-only calibration is valid; do not make an image anchor mandatory. For independent comparisons exclude corresponding finished pages and retain honest first-pass evidence; usable-delivery work continues through authorized recipe improvement and from-scratch generation.

- On mixed-object medical pages, specify the selected craft separately for characters, anatomy diagrams, dossiers/tools, relationships and lettering. Global style words and a passing simple scene do not establish stable rendering across those object classes.

- For the optional HTML slide route, lock one deck-wide visual system under `agent/knowledge/ppt_style_calibration.md` (`## HTML Slide Visual System And First-Draft Craft`) covering unified cover/chapter-rail/content/ending tokens, section accents, static zero-animation surfaces, inset corner-hook avoidance, honest chart scales, and aspect-matched media framing.
