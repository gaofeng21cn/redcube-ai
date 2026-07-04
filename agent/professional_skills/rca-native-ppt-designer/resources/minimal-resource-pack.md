# RCA Native PPT Designer Minimal Resource Pack

Owner: `redcube_ai`
State: `skill_local_resource`
Boundary: refs-only professional method resource. This file is not visual truth, an artifact body, an owner receipt, a quality verdict, an export verdict, or runtime state.

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
