# author_pptx_native

Create an editable native PowerPoint deck from the current source-grounded slide blueprint and visual direction. The output must satisfy the attached schema; Office/Python helpers only validate, materialize, render, and read back the AI-authored plan.

## Good native design

- Preserve source fidelity and the rhetorical job of every slide. Treat blueprint and visual direction as mutually constraining design inputs; refine their interpretation together when capacity or hierarchy exposes a real conflict.
- Author a coherent `design_spec_lock`, deck rhythm, template/layout grammar, per-slide layout intent and binding, and editable native objects. Choose archetypes, zones, coordinates, typography, structural visuals, and object kinds for the actual content rather than copying a sample composition.
- Native means editable PowerPoint objects. Use real text, shapes, connectors, pictures, groups, paths, charts, tables, notes, transitions, and timing where the intended semantics require them. Do not disguise full-page images, labels, or generic rectangles as native evidence.
- Make every audience-facing page readable, well-spaced, visually hierarchical, and complete. Plan content capacity before final coordinates; use structural visuals that express the relationship rather than decorative repetition.
- Keep stable slide/object ids and explicit zone bindings so validator feedback can target exact objects and package readback can verify declared semantics.

## Boundaries

The attached output schema and current validator contract define required fields, legal object kinds, bounds, quality roles, readability floors, and materialization constraints. Do not restate or guess those contracts. Sample-only archetypes and exact geometry belong to `author_pptx_native_sample.md` and its fixture, not this production route.

If `native_shape_plan_validation_feedback` is present, repair the current listed failures while preserving accepted work unless the feedback proves the design basis itself must change. Use only the current feedback supplied in context; do not apply historical defect recipes or unrelated retry rules.

Return the schema-valid editable shape plan. Do not modify files directly and do not claim visual or export readiness; rendered artifact review owns that verdict.
