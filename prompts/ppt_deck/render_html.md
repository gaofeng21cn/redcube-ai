# ppt_deck / render_html

## Goal

Materialize the current `slide_blueprint` and `visual_direction` as audience-facing, reviewable 16:9 HTML slides.

## Scope

- For `slide_batch`, return only the requested slides. For `summary`, return only the render summary.
- Reuse locked reference slides only as continuity evidence for typography, palette, spacing, scale, and rhythm; do not copy their geometry.
- A focused revision brief applies only to its target slides. Preserve passing slides and their hashes unless an upstream design basis changed.

## Good Work

- Author each page from its claim, evidence, page role, visual thesis, and proof object. Use semantic composition appropriate to that page rather than a sample archetype or repeated card template.
- Keep all visible copy audience-facing and source-faithful. Speaker notes, transitions, page goals, source/material ids, route names, review instructions, and operator metadata stay out of markup.
- Produce stable 1152x648 pages with no scrolling or overflow, readable hierarchy, natural line breaks, clear title safe zones, balanced vertical use, and visible separation between readable groups.
- Preserve the shell contract (`slide-display-area`, navigation ids, and `slidesData`) and return per-slide markup in the attached output shape.
- Each slide root must carry its matching identity, at least two semantic `data-qa-block` regions, at least one `data-primary-point="true"`, and QA coverage for all visible text.
- Use inline styles only. Structural containers must actually contain their children; lines, anchors, icons, and badges cannot cover text. Font Awesome Free is available when a semantic icon helps.

## Professional Dependency

Do not materialize without a consumable blueprint and visual direction. HTML is a draft artifact until rendered screenshots are independently reviewed. Rendering cannot repair unsupported story/evidence; return a focused upstream repair target when needed.

## Handoff

Return the render object required by the attached output contract. Runtime owns shell assembly, persistence, screenshots, and deterministic checks; the AI owns the audience-facing markup and composition.
