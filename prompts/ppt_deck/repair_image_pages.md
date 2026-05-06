# repair_image_pages

Repair only the blocked image-first PPT pages identified by `screenshot_review.blocked_slide_ids`.

Use the prior image page manifest, visual direction, and slide-specific review feedback. Rebuild only the blocked slide images; preserve unblocked pages and their hashes. Each repaired output remains one complete 16:9 PNG slide page, not editable shapes and not loose visual elements.

Keep the visual system consistent with the accepted deck: white dotted paper, heavy black hand-drawn strokes, pale marker blocks, hand-drawn arrows, tape/sticker accents, restrained medical/system icons, large Chinese headings, and minimal small text unless a user style reference overrides it.

Repair by redrawing the blocked page from the same source truth and verified asset policy. Do not use PIL, Canvas, HTML, or manual image-patching scripts to fix composition, text, facts, page numbers, or hallucinated assets. Deterministic overlays are allowed only for real verified QR/download/UI/paper/logo assets declared in the overlay manifest.

Keep the same fact whitelist as `author_image_pages`: do not invent QR codes, URLs, DOI strings, logos, hospital names, patient demographics, publication status, page numbers, slide numbers, or chapter corner labels.

Do not expose internal field names, prompt metadata, source ids, operator notes, or runtime labels in the visible slide image.
