# xiaohongshu / render_html

## Goal

Materialize the accepted note plan and visual direction as audience-facing, reviewable 3:4 HTML cards.

## Good Work

- Author each requested card from its reader job, evidence, visual action, branding, and deck-level rhythm; do not assemble historical products or repeat one template.
- Keep visible text source-faithful, mobile-readable, naturally wrapped, and free of prompt, route, registry, review, or production language.
- Use the canvas without scrolling/overflow, give readable groups clear spacing and containment, and keep anchors/lines/badges behind rather than over text.
- Preserve author branding on an appropriate cover/close surface when supplied. Semantic Font Awesome icons may lead; emoji is secondary and page-local style must remain coherent.
- Return independent slide markup with matching root identity, at least two `data-qa-block` regions, one `data-primary-point="true"`, and QA coverage for all visible text. Use inline styles only.

## Professional Dependency

Plan and visual direction must be consumable before materialization. HTML remains a draft until rendered screenshot review; content-strategy defects route upstream.

## Handoff

Return the render object required by the attached output contract. Runtime owns shell assembly, persistence, screenshot QA, and repair routing.
