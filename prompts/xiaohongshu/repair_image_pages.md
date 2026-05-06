# repair_image_pages

Repair only the blocked 3:4 Xiaohongshu image pages identified by `screenshot_review.blocked_slide_ids`.

Use the prior image page manifest, visual direction, and page-specific review feedback. Rebuild only the blocked page images; preserve unblocked pages and their hashes. Each repaired output remains one complete 3:4 PNG note page, not HTML, editable shapes, loose components, or a collage.

Keep the accepted note's visual system: same paper/app-card material, same signature grammar, same rhythm, same page family, and same fact whitelist. If a blocked page has factual, medical-object, text overflow, proportion, or style drift issues, fix the prompt and redraw that page.

Reference images are style anchors only. Do not copy their institution names, patient attributes, disease objects, page numbers, logos, QR codes, paper status, or other factual content into the repaired page.

Do not expose internal field names, prompt metadata, source ids, operator notes, or runtime labels in the visible page image.
