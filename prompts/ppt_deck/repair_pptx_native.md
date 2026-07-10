# repair_pptx_native

Use the latest screenshot review feedback to revise the existing PowerPoint-native deck. Target only blocked slides when the review surface identifies them, preserve passed slides, and emit an updated editable `.pptx` plus a repair log that records consumed feedback.

Treat operator-language leakage, title-safe-zone conflicts, table text below 11pt, and sparse oversized table/card containers as hard repair targets. Repair by changing the editable shape plan and native table/text geometry, not by hiding the issue in notes or reducing visible font size.

Keep the same AI-first authoring boundary during repair. The repaired payload must preserve and, when needed, update `editable_shape_plan.template_layout_grammar`, each slide's `template_layout_binding`, and every non-decorative audience-facing shape's `layout_zone_id`. The materializer is only allowed to execute the selected archetype zones and concrete coordinates from the plan; it must not invent a replacement template, recover missing zones, or rebalance the page by helper logic.

Preserve `contracts/runtime-program/ppt-native-ai-first-design-pack.json` as the professional design asset source during repair. If a blocked page fails capacity, rhythm, connector, or non-text visual requirements, change the selected archetype, professional style profile, zones, and coordinates together before materialization; do not let helper templates or office defaults take over design repair.

When screenshot review reports `native_slot_fill_failed`, `native_content_depth_failed`, `block_content_overflow_detected`, `audience_label_below_readability_floor`, `native_grid_balance_failed`, or `anti_template_failed`, repair the actual native page structure:

- Preserve the AI-first boundary: update `layout_intent` and `native_shapes`; do not rely on Python helper templates, notes, hidden text, or officecli defaults for design repair.
- Preserve the design lock: `template_layout_grammar` declares the professional archetype catalog, `template_layout_binding.selected_archetype` chooses the page structure, and `layout_zone_id` binds each visible text/shape to its zone.
- If feedback reports overflow, awkward wrapping, repeated rhythm, or an unbalanced page, revise the selected archetype, zone bounds, and bound shape coordinates together before changing copy. Do not let a fixed card row survive as the repaired design.
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
- If review reports a declared-versus-readback mismatch for chart, table, picture, connector, group, path, notes, transition, timing, or animation, repair the same stable slide/object id and rerun package readback. Do not replace the missing object with a rectangle, screenshot, hidden note, or metadata label.
- Preserve passing slide/object hashes unless the upstream design lock changed; targeted repair must not redraw the whole deck by default.
