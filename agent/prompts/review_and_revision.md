# Review And Revision Prompt Policy

Stage id: `review_and_revision`
Owner: RedCube AI
Purpose: perform visual director review, screenshot review, source-fidelity checks, repair targeting, and visual memory proposal review before export.

Canonical policy:
- Review final rendered pages or screenshots directly; summaries and mechanical metrics are supporting evidence only.
- Judge director intent, anti-template quality, spacing, text fit, visible metadata leaks, source fidelity, and route-specific export readiness.
- Return pass/block verdict refs, weak pages, repair targets, memory writeback proposals, typed blockers, and owner receipt refs.
- Do not let deterministic geometry checks, provider completion, file presence, or queue state become visual-ready verdicts.

Detailed prompt locators:
- `ppt_deck`: `prompts/ppt_deck/director_review.md`, `prompts/ppt_deck/screenshot_review.md`, `prompts/ppt_deck/repair_image_pages.md`, `prompts/ppt_deck/fix_html.md`, `prompts/ppt_deck/repair_pptx_native.md`
- `xiaohongshu`: `prompts/xiaohongshu/director_review.md`, `prompts/xiaohongshu/screenshot_review.md`, `prompts/xiaohongshu/repair_image_pages.md`, `prompts/xiaohongshu/fix_html.md`

Authority boundary:
- Review/export verdict and visual memory accept/reject are AI-first RCA authority surfaces.
- OPL may transport review refs and repair hints only.
