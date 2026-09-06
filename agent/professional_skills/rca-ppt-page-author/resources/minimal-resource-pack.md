# RCA PPT Page Author Minimal Resource Pack

## Payload Fields

- `page_contract`: `slide_id`, approved claim, proof object, visual direction ref, selected route, density band, text budget, required evidence, and review risk.
- `serial_page_pipeline`: read page contract, choose structural visual, place title/proof/evidence zones, check density, then emit route-specific payload.
- `ppt_visual_density`: reduce labels, slots, or secondary notes before shrinking text below the readable floor; if the page still fails, return a repair target.
- `editable_pptx_grammar`: every native shape needs role, zone id, bounds in inches, font size for text, visible fill/line when structural, z-order, and stable manifest id.
- `progressive_disclosure`: keep page-level hierarchy obvious at first glance; secondary detail moves to notes, appendix, or the next slide.
- `image_first_page_payload`: `slide_id`, current `style_ref`, prompt text, visible label budget, forbidden text, expected 16:9 output ref, import ref, and contact-sheet ref.
- `page_visual_proof_packet`: generated/rendered page ref, pixel screenshot ref, 16:9 normalization ref, contact-sheet ref, route source ref, native shape manifest ref when applicable, preserved-page hashes for blocked-slide repairs, and unresolved QA risks.
- `draft_to_review_gate`: generated/rendered page exists and is consumable; 16:9, contact-sheet, density, or repair gaps become named quality debt and repair targets before package/export consumes the best available page.
- `repeated_failure_triage`: slide id, previous repair evidence, current pixel/contact-sheet finding, owner stage, preserve/redraw decision, and whether route arbitration is required.

Owner: `redcube_ai`
State: `skill_local_resource`
Boundary: refs-only professional method resource. This file is not visual truth, an artifact body, an owner receipt, a quality verdict, an export verdict, or runtime state.

## Template

```text
page_contract:
  slide_id:
  approved_claim:
  proof_object:
  visual_direction_ref:
  selected_route:
  density_band:
  text_budget:
  required_evidence:
  review_risk:

serial_pipeline:
  upstream_ref:
  page_payload_ref:
  review_gate:
  repair_owner:

progressive_disclosure:
  primary_message:
  secondary_detail_destination:

editable_pptx_grammar:
  route_gate:
  zone_binding:
  stable_shape_id:

editable_shape_row:
  id:
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

image_first_page_payload:
  slide_id:
  style_ref:
  prompt_text:
  visible_label_budget:
  forbidden_text:
  expected_16x9_output_ref:
  import_ref:
  contact_sheet_ref:

draft_to_export_gate:
  generated_page_ref:
  normalized_16x9_ref:
  contact_sheet_review_ref:
  blocked_page_repairs:
  pptx_assembly_ref:
```

## Example

```text
slide_id: S02
approved_claim: The system already has evidence, but users cannot see the next owner action.
proof_object: status board with three lanes and one highlighted handoff gap
selected_route: author_image_pages
density_band: balanced
text_budget: title <= 13 words, 3 lane labels, 3 short evidence labels
review_risk: internal status words may leak into visible copy
```

## Checklist

- Source, story, blueprint, and visual direction exist for the page.
- The page uses a structural visual rather than decorative fragments.
- Progressive disclosure keeps secondary detail in notes, appendix, or the next slide.
- Text is shortened before font size drops below the readable floor.
- Native shapes have roles, zones, inch bounds, text sizes, and stable ids.
- Repair scope targets blocked pages only when review names them.
- Image-first pages are imported, normalized, and contact-sheet reviewed before PPTX assembly.
- Dense generated text is repaired by reducing labels and redrawing blocked pages.
