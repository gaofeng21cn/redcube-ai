# repair_image_pages

Repair only the blocked image-first PPT pages identified by `screenshot_review.blocked_slide_ids`.

Use the prior image page manifest, visual direction, and slide-specific review feedback. Rebuild only the blocked slide images; preserve unblocked pages and their hashes. Each repaired output remains one complete 16:9 PNG slide page, not editable shapes and not loose visual elements.

Keep the accepted profile/revision and shared craft prefix. Preserve its actual
lettering, color, line and object treatment while repairing the page's own
composition. Do not introduce a default notebook/marker aesthetic or copy
scenery from a craft-only reference.

Repair by redrawing the blocked page from the same source truth and verified asset policy. Do not use PIL, Canvas, HTML, or manual image-patching scripts to fix composition, text, facts, page numbers, or hallucinated assets. Deterministic overlays are allowed only for real verified medical-image/QR/download/UI/paper/logo assets declared in the overlay manifest.

Repair the cause in the page input (copy, object identity, relation, quantity
binding or reference scope), then inspect the entire new page. Preserve all
unaffected selected images, notes, actual request snapshots and review refs.
Keep first-generation evidence separate from the later usable selection.

Keep the same fact whitelist as `author_image_pages`: do not invent QR codes, URLs, DOI strings, logos, hospital names, patient demographics, publication status, page numbers, slide numbers, or chapter corner labels.

Do not expose internal field names, prompt metadata, source ids, operator notes, or runtime labels in the visible slide image.

If the blocked reason includes operator-language leakage, remove the metadata phrase and rewrite it as audience-facing project content. If the blocked reason includes title safe zone, remove the section chip/card/tag from the title area. If it includes table legibility or sparse cards, enlarge table text to at least 11pt-equivalent and reduce empty padding rather than shrinking text further.
