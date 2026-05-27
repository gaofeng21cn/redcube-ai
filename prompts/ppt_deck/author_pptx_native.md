# author_pptx_native

Use the approved slide blueprint and visual direction to materialize an editable PowerPoint-native deck. Preserve the storyline, slide count, audience-facing text, evidence labels, and visual direction. The output contract is a `.pptx` with editable native text boxes and shapes plus a shape manifest for review.

Visible text must be project-facing. Do not copy operator constraints, local filenames, route names, prompt names, `RCA`, `RedCube`, `product-entry`, `source intake`, or “do not expose” instructions into editable slide text. If upstream title, goal, blueprint, or visual direction already contains internal names, rewrite them as audience-facing labels such as “自主交付链路”, “可复核交付闭环”, or “从目标到导出的验收路径”.

Keep the title safe zone clear of section chips, left-top cards, badges, tags, and decorative labels. For tables, use at least 11pt body text, compact cell padding, and a dense readable grid rather than small text inside oversized empty cells.

Native PPTX authoring must pass the same readability floor as the rendered screenshot review:

- Treat the upstream `visual_direction` as the design spec lock for native PPTX. Choose explicit palette, typography, grid, motif, layout rhythm, and per-slide `layout_intent` before writing shapes; do not let the Python helper or officecli invent page structure.
- Every slide must include `layout_intent` with `rhetorical_role`, `composition_signature`, `primary_grid`, `visual_weight`, `negative_space_strategy`, `non_text_visual`, and `forbidden_template_reuse_checked: true`. The `composition_signature` must describe concrete geometry, not just a layout family label.
- Keep at least 75% of slide `composition_signature` values distinct in a normal deck, and never repeat the same concrete composition on three slides. Change the first-glance structure: hero callout, split comparison, horizontal timeline, gate ladder, radial/system map, synthesis band, chart/table/metric grid, or connector flow.
- Use PPT design floors from officecli-pptx as hard constraints: title at least 36pt, body at least 18pt, step/index labels at least 16pt, table body at least 11pt, 16:9 edge margin about 0.6in or more, and visible gaps between blocks. Solve fit by changing geometry or reducing slots, not by shrinking text.
- Use ppt-master-style spec discipline: lock the design system before page shapes, keep editable shapes grouped by semantic purpose, emit a manifest-friendly plan, and expect screenshot/render QA to fail closed on drift.
- Do not draw the common AI-slide title underline motif. Use whitespace, a side rail, a top band, a corner anchor, connector flow, or page-specific visual object instead.
- Every content slot that is visually drawn must be filled with audience-facing text; never emit a four-card or four-quadrant shape plan with only two or three real content slots.
- Each `point_text` must be a complete short teaching sentence with at least 12 meaningful CJK/Latin characters after punctuation is removed. Labels such as “目标：这页要教会什么” are too thin unless they explain the action and evidence.
- Route or stage labels such as `source readiness`, `storyline`, `detailed outline`, `slide blueprint`, `visual direction`, `screenshot review`, and `export` are never sufficient as standalone `point_text`; if needed, put them inside a sentence that explains what happens and what evidence is produced.
- `point_index` / step labels must remain readable at 16pt or larger; do not solve fit problems by shrinking labels or body text.
- Avoid three consecutive content slides with the same concrete layout variant or same `composition_signature`. Change the visual structure, not just the wording, when adjacent pages carry different rhetorical jobs.
- Prefer fewer, larger, well-filled cards over many tiny placeholders. If the content only has two or three points, choose a two-column or three-card composition rather than leaving an empty fourth slot.
