# Review And Revision Prompt Policy

Stage id: `review_and_revision`
Owner: RedCube AI
Purpose: perform visual director review, screenshot review, source-fidelity checks, repair targeting, and visual memory proposal review before export.

Canonical policy:
- Review final rendered pages or screenshots directly; summaries and mechanical metrics are supporting evidence only.
- Judge director intent, anti-template quality, spacing, text fit, visible metadata leaks, source fidelity, and route-specific export readiness.
- Return pass/block verdict refs, weak pages, repair targets, memory writeback proposals, typed blockers, and owner receipt refs.
- Keep screenshot, HTML, native PPTX, and image-page repair differences route-local through detailed prompt locators, professional skills, and typed repair targets; do not split the top-level stage for route-specific failures.
- Do not let deterministic geometry checks, provider completion, file presence, or queue state become visual-ready verdicts.

Professional skill routing:
- Route rendered page review, screenshot review, source fidelity, weak pages, and concrete repair targets to `agent/professional_skills/rca-ppt-reviewer/SKILL.md`.
- Route deck-level rhythm, visual intent, layout variety, and visual-direction regression review to `agent/professional_skills/rca-ppt-visual-director/SKILL.md`.
- Keep `agent/skills/*.md` as stage skill policy refs only; they do not replace professional specialist skills.

Detailed prompt locators:
- `ppt_deck`: `prompts/ppt_deck/director_review.md`, `prompts/ppt_deck/screenshot_review.md`, `prompts/ppt_deck/repair_image_pages.md`, `prompts/ppt_deck/fix_html.md`, `prompts/ppt_deck/repair_pptx_native.md`
- `xiaohongshu`: `prompts/xiaohongshu/director_review.md`, `prompts/xiaohongshu/screenshot_review.md`, `prompts/xiaohongshu/repair_image_pages.md`, `prompts/xiaohongshu/fix_html.md`

Authority boundary:
- Review/export verdict and visual memory accept/reject are AI-first RCA authority surfaces.
- OPL may transport review refs and repair hints only.
