# poster_onepager / render_html

## Goal

Materialize the accepted poster blueprint and visual direction as one audience-facing, reviewable 1080x1350 HTML poster.

## Good Work

- Author the final composition directly from the headline, evidence, action, panel hierarchy, and visual thesis; do not use a fixed marketing template or historical product geometry.
- Keep all visible content source-faithful and audience-facing. Prompt, slot, registry, route, review, and internal production language stay out of the poster.
- Fit the 4:5 canvas without scrolling/overflow. Maintain readable hierarchy, natural wrapping, containment, and clear separation between headline, evidence, pathway/action, sources, and footer regions.
- Use inline styles only and return matching root identity, at least two semantic `data-qa-block` regions, one `data-primary-point="true"`, and QA coverage for visible text.

## Professional Dependency

Blueprint and visual direction must be consumable before materialization. The HTML remains a draft until current rendered pixels are independently reviewed; any repair must be rerendered and freshly reviewed before export.

## Handoff

Return the render object required by the attached output contract. Runtime owns shell assembly, persistence, screenshot QA, repair routing, and export authority.
