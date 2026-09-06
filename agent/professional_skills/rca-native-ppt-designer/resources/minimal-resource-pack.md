# RCA Native PPT Designer Minimal Resource Pack

## Payload Fields

- `spec_lock`: `design_spec_lock_id`, design thesis, palette, typography, grid, motif, rhythm, route constraints, QA gates, and forbidden native shortcuts.
- `native_pptx_editability`: the deck must remain editable through Office shapes, text, tables, charts, and connectors; full-page images can only be explicit visual assets, not the slide body.
- `editable_pptx_grammar`: `template_layout_grammar`, `template_layout_binding`, and `native_shapes[]` must use editable Office objects, declared zones, inch bounds, role ids, quality roles, font sizes, fills/lines, and z-order.
- `shape_row`: `id`, `slide_id`, `role`, `zone_id`, `left_in`, `top_in`, `width_in`, `height_in`, `text`, `font_size_pt`, `fill`, `line`, `z_order`, `quality_role`.
- `native_repair_loop`: repair the plan, rerender, compare screenshots, update shape manifest refs, then return review/export refs, quality debt, or a no-output diagnostic; typed blocker remains reserved for the explicit hard-stop whitelist.
- `image_to_native_followup`: consume approved director notes, source refs, contact-sheet findings, and selected editable targets before writing native shapes.
- `native_ppt_qa_plan`: shape manifest refs, screenshot refs, editable-object checks, hyperlink/text checks, expected reviewer checks, and blocked-slide-only repair scope.
- `native_admission_readback`: exact current-user semantic evidence, decision owner, selected slides, rejected image-first/native alternatives, contact-sheet evidence, required native QA refs, and route-back owner. This record verifies admission but cannot create it.
- `repeated_native_failure_triage`: prior render refs, current screenshot/shape-manifest mismatch, owner boundary, preserved slides, and next repair route.
- `native_route_back`: owner stage, affected slide ids, failed evidence, and whether the fix belongs to template profile, visual direction, page authoring, or native shape plan.
- `typed_native_object`: stable id, object kind, semantic role, materialization intent, editable payload, relationships, bounds/z-order, and package readback expectation.
- `presentation_semantics`: slide id, speaker notes, transition, timing, optional animation timeline, and static-readability assertion.

Owner: `redcube_ai`
State: `skill_local_resource`
Boundary: refs-only professional method resource. This file is not visual truth, an artifact body, an owner receipt, a quality verdict, an export verdict, or runtime state.

Registry refs: `ppt-native-ai-first-design-pack.json#/visualization_pattern_registry`, `#/professional_style_registry`, `#/connector_semantics`; provenance audit: `ppt-master-learning-landing.json`.

## Template

```text
design_spec_lock:
  design_spec_lock_id:
  design_thesis:
  palette:
  typography:
  grid:
  motif:
  route_constraints:
  qa_gates:
  forbidden_native_shortcuts:

registry_selection:
  visualization_pattern_id:
  required_observable_semantics:
  materialization_mode:

editable_pptx_grammar:
  zone_ids:
  role_ids:
  coordinate_bounds:
  hierarchy:
  prohibited_mistakes:

native_shape:
  id:
  slide_id:
  role:
  zone_id:
  left_in:
  top_in:
  width_in:
  height_in:
  text:
  font_size_pt:
  fill:
  line:
  z_order:
  quality_role:

image_to_native_followup:
  approved_director_notes_ref:
  contact_sheet_findings_ref:
  selected_editable_targets:
  source_refs:
  native_shape_plan_ref:

typed_native_object:
  stable_id:
  object_kind:
  semantic_role:
  materialization_intent:
  editable_payload:
  relationship_refs:
  bounds:
  z_order:
  package_readback_expectation:

presentation_semantics:
  slide_id:
  speaker_notes:
  transition:
  timing:
  animation_timeline:
  static_readability_assertion:
```

## Example

```text
slide_id: S05
template_layout_binding: decision_rail_with_evidence_band
native_shapes:
  - id: S05-title
    role: action_title
    zone_id: title
    left_in: 0.55
    top_in: 0.35
    width_in: 12.2
    height_in: 0.55
    font_size_pt: 30
    quality_role: primary_text
```

## Checklist

- Native PPTX was explicitly selected.
- Full-page images are not used as the slide body.
- Every visible non-decorative shape binds to a declared zone.
- Text shapes declare font size; structural shapes declare fill or line.
- Repair changes the AI-authored plan, then rerenders and reviews screenshots.
- Full-page PNG decks are image-first artifacts, not native editable evidence.
- Native follow-up starts from director notes and review findings, not blind pixel tracing.
- Unknown object kinds fail closed; they never become generic rectangles.
- Chart/table intent is explicitly `stable_drawingml` or `native_data_object`.
- Notes, transition, timing, and optional animation are tied to stable slide ids and remain statically readable.
