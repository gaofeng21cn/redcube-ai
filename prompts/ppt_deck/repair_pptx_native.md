# repair_pptx_native

Use the latest screenshot review feedback to revise the existing PowerPoint-native deck. Target only blocked slides when the review surface identifies them, preserve passed slides, and emit an updated editable `.pptx` plus a repair log that records consumed feedback.

Treat operator-language leakage, title-safe-zone conflicts, table text below 11pt, and sparse oversized table/card containers as hard repair targets. Repair by changing the editable shape plan and native table/text geometry, not by hiding the issue in notes or reducing visible font size.

When screenshot review reports `native_slot_fill_failed`, `native_content_depth_failed`, `block_content_overflow_detected`, `audience_label_below_readability_floor`, `native_grid_balance_failed`, or `anti_template_failed`, repair the actual native page structure:

- Preserve the AI-first boundary: update `layout_intent` and `native_shapes`; do not rely on Python helper templates, notes, hidden text, or officecli defaults for design repair.
- When feedback mentions repeated layout, repeated composition, or `composition_signature`, change the concrete geometry and write a new `layout_intent.composition_signature`. A renamed variant with the same top-title/core/card-row skeleton is still a failed repair.
- Remove decorative title-underlines and long horizontal rules under headings. Use a different motif such as side rail, corner anchor, connector path, map axis, chart/table/metric grid, or visual band.
- Re-apply the spec lock: title >= 36pt, body >= 18pt, index labels >= 16pt, table body >= 11pt, sufficient margins/gaps, and no content outside bounds.
- Match the number of visual slots to the number of real points; do not keep an empty 4-slot template for 2 or 3 points.
- Rewrite thin labels into complete audience-facing sentences with enough explanation to stand alone on a projected slide.
- Do not replace a complete point with a route or stage label such as `source readiness`, `storyline`, `detailed outline`, `slide blueprint`, `visual direction`, `screenshot review`, or `export`. Those labels may appear only inside a complete audience-facing sentence that explains the action and proof.
- When feedback asks for a gate, loop, evidence band, or route sequence, materialize those as distinct editable text groups with explicit connector geometry; do not collapse them into a generic four-zone comparison or four short labels.
- Increase card geometry or reduce slot count before lowering text size. Body text stays at or above 18pt and step labels stay at or above 16pt.
- If the blocked slide is part of a repeated layout run, change its concrete layout variant so the sequence has a different rhythm.
- Preserve unblocked slides, but the targeted blocked slide may change layout family when that is necessary to pass RCA review/export gates.
