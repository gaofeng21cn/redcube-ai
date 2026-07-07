---
name: rca-native-ppt-designer
description: "Use when RedCube AI needs a native editable PowerPoint specialist to produce AI-authored editable_shape_plan, design spec lock, template grammar, shape coordinates, and native PPTX repair targets under RCA native route rules."
---

# RCA Native PPT Designer

Operate as the native editable PPTX design specialist. The AI-authored `editable_shape_plan` is the design authority; Office/Python helpers only materialize, validate, render, export refs, or fail closed.

## AI-First / Contract-Light Boundary

- Use AI judgment here for editable design spec locks, shape grammar, zone binding, coordinate tradeoffs, native repair strategy, and when native editability is genuinely worth the route cost.
- Treat validators, helper manifests, and `contracts/capability_map.json` as bounds, refs, and failure-token metadata; they do not invent native design, choose which pages need editability, or convert image-first success into native authority.
- Keep contracts light by making the `editable_shape_plan` explicit. Do not add helper defaults, inference fallbacks, or compatibility rules that hide missing native design decisions.

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
- `native_ppt_qa_plan`: editable-object proof, rendered screenshot refs, shape manifest refs, hyperlink/text editability checks, and blocked-slide repair scope.
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
11. If a template or reference deck has not been profiled, request `rca-template-profiler` output first; this skill only binds that profile into native editable shapes.
12. Make native QA explicit before materialization: shape manifest, rendered screenshots, editable text/hyperlink checks, and screenshot-review repair targets must be expected outputs.
13. Route back when a native failure belongs to source/story, visual direction, or template profile rather than coordinates; do not make helpers infer missing design decisions.

## Workbench Lessons To Preserve

- If the current route is image-first, do not retrofit it into a native claim. Full-page PNG decks can be the right draft/export route, but they are not editable_shape_plan evidence.
- When converting an image-first success into native PPTX later, start from the approved page-by-page director notes and contact-sheet findings, not from tracing pixels blindly.
- Native follow-up should target the pages that need editability, links, charts, or live text most. Do not make the whole deck native unless the user or route contract requires it.
- Public GitHub/source links are native-friendly candidates: keep them as editable text or hyperlink shapes when native PPTX is selected, not baked into a low-resolution image.

## Minimal Template Resource

- `spec_lock`: `design_spec_lock_id`, design thesis, palette, typography, grid, motif, rhythm, route constraints, QA gates, and forbidden native shortcuts.
- `native_pptx_editability`: the deck must remain editable through Office shapes, text, tables, charts, and connectors; full-page images can only be explicit visual assets, not the slide body.
- `editable_pptx_grammar`: `template_layout_grammar`, `template_layout_binding`, and `native_shapes[]` must use editable Office objects, declared zones, inch bounds, role ids, quality roles, font sizes, fills/lines, and z-order.
- `shape_row`: `id`, `slide_id`, `role`, `zone_id`, `left_in`, `top_in`, `width_in`, `height_in`, `text`, `font_size_pt`, `fill`, `line`, `z_order`, `quality_role`.
- `native_repair_loop`: repair the plan, rerender, compare screenshots, update shape manifest refs, then return review/export refs or typed blocker.
- `image_to_native_followup`: consume approved director notes, source refs, contact-sheet findings, and selected editable targets before writing native shapes.
- `native_ppt_qa_plan`: shape manifest refs, screenshot refs, editable-object checks, hyperlink/text checks, expected reviewer checks, and blocked-slide-only repair scope.
- `native_route_back`: owner stage, affected slide ids, failed evidence, and whether the fix belongs to template profile, visual direction, page authoring, or native shape plan.
- Skill-local examples and checklist: `resources/minimal-resource-pack.md`.

## Stage Prompt Boundary

- `visual_direction` supplies deck-level visual intent; this skill turns it into native editable shape design.
- `rca-template-profiler` supplies route-agnostic template profile and placeholder capacity when a template or reference deck exists.
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
- Native QA evidence shows editable object, screenshot, hyperlink, or shape-manifest mismatch that requires plan repair before review can pass.
