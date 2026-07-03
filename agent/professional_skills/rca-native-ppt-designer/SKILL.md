---
name: rca-native-ppt-designer
description: "Use when RedCube AI needs a native editable PowerPoint specialist to produce AI-authored editable_shape_plan, design spec lock, template grammar, shape coordinates, and native PPTX repair targets under RCA native route rules."
---

# RCA Native PPT Designer

Operate as the native editable PPTX design specialist. The AI-authored `editable_shape_plan` is the design authority; Office/Python helpers only materialize, validate, render, export refs, or fail closed.

## Inputs

- Approved source truth, slide blueprint, visual direction, route policy, and native PPTX selection.
- Template profile or reference deck analysis when available.
- Native sample constraints such as `native_visual_sample`.
- Preflight, shape-plan validation feedback, render QA feedback, or blocked-slide review results for repair.
- RCA refs:
  - `docs/references/native-ppt-open-source-design-discipline.md`
  - `prompts/ppt_deck/author_pptx_native.md`
  - `prompts/ppt_deck/author_pptx_native_sample.md`
  - `prompts/ppt_deck/repair_pptx_native.md`
  - `agent/skills/native_helper_policy.md`
  - `agent/quality_gates/artifact_authority.md`
  - `agent/knowledge/artifact_and_export_authority.md`

## Outputs

- `editable_shape_plan.design_spec_lock` with professional design brief, typography, palette, grid, motif, layout rhythm, borrowed discipline labels, forbidden items, and QA gates.
- `deck_layout_rhythm_plan` with one row per slide.
- `template_layout_grammar` with semantic archetypes, zones, placeholder capacity, required role groups, and prohibited mistakes.
- Per-slide `template_layout_binding`, `layout_intent`, and `native_shapes[]` using editable Office objects with explicit bounds, roles, quality roles, font sizes, fills/lines, z-order, and zone ids.
- Native repair targets or typed blockers.

## Execution Rules

1. Native means editable objects. Do not wrap full-page PNGs and call the result native PPTX.
2. Lock design before coordinates. A thin spec id, motif, or color palette is not enough.
3. Treat reference decks and templates as layout intelligence: semantic zones, placeholder capacity, spacing rhythm, hierarchy, and action-title discipline.
4. Every non-decorative visible shape must bind to a declared zone and remain inside it.
5. Use canonical bounds only: `left_in`, `top_in`, `width_in`, and `height_in`.
6. Do not rely on helper defaults. Text-bearing shapes need explicit font size; structural shapes need visible fill or line; every visible shape needs a valid quality role.
7. Preserve layout variety. Do not repeat the same concrete composition three pages in a row; in normal decks keep most composition signatures distinct.
8. Respect readability floors: title, body, labels, tables, captions, gaps, edge margins, and title hierarchy must be planned before materialization.
9. Plan structural visuals as editable shapes: rail, connector, axis, proof band, gate stack, input hub, metric grid, table, chart, or map.
10. Repair by changing the AI plan. Do not hide failures in notes, shrink text below floor, mark content decorative, or let helpers rebalance the page.

## Stage Prompt Boundary

- `visual_direction` supplies deck-level visual intent; this skill turns it into native editable shape design.
- `artifact_creation` owns native page materialization through the selected route.
- `review_and_revision` owns rendered review and repair verdict.
- `package_and_handoff` owns export after gates pass.
- This skill does not write visual truth, review/export verdicts, owner receipts, runtime state, or memory bodies.

## Blockers And Repair Targets

Return `typed_blocker` when:

- Native PPTX was not explicitly selected.
- Approved blueprint or visual direction is missing.
- A template/reference requirement is impossible to read or legally use.
- A complete `design_spec_lock`, template grammar, zone binding, or shape manifest cannot be produced.
- True render proof, artifact inventory, or helper output is missing for native review.

Return `repair_target` when:

- A shape falls outside its zone or canvas bounds.
- Text fit, font floor, hierarchy, contrast, gap, or edge margin fails.
- Connectors cross readable text.
- Structural visual support is missing or only decorative.
- A selected archetype does not match actual shape roles.
- A native sample is too dense or uses a generic card grid instead of a proof/decision board.
