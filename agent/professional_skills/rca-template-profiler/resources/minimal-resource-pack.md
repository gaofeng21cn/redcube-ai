# RCA Template Profiler Minimal Resource Pack

Owner: `redcube_ai`
State: `skill_local_resource`
Boundary: refs-only professional method resource. This file is not visual truth, an artifact body, an owner receipt, a quality verdict, an export verdict, or runtime state.

## Template

```text
template_profile_row:
  layout_id:
  use_case:
  zones:
  required_roles:
  title_safe_zone:
  template_capacity:
  content_capacity:
  minimum_font_floor:
  spacing_rules:
  reuse_ceiling:

placeholder_capacity:
  zone_id:
  max_headline_length:
  max_body_length:
  object_count:
  allowed_objects:
  safe_inset:
  overflow_risk:

editable_pptx_grammar:
  stable_zone_id:
  allowed_shape_roles:
  coordinate_bounds:
  prohibited_mistakes:

current_style_ref_pack:
  current_source_deck_or_version:
  representative_page_refs:
  allowed_reuse:
  stale_refs_to_reject:
  prompt_facing_density_limits:
```

## Example

```text
layout_id: evidence_band_with_decision_panel
use_case: proof page that ends in a decision
zones: title, evidence_band, decision_panel, source_note
required_roles: action_title, evidence_label, decision_label, source_note
content_capacity: 3 evidence items and 1 decision sentence
minimum_font_floor: body 18 pt, labels 14 pt
reuse_ceiling: no more than 2 consecutive pages
```

## Checklist

- Profile semantic zones before colors, fonts, or background images.
- Each placeholder has a role, capacity estimate, and readable floor.
- Title, body, evidence, label, caption, and footer roles stay separate.
- Reference deck patterns are adapted into RCA rules, not copied as authority.
- Native routes receive stable zone ids and prohibited mistakes.
- The latest approved visual line is profiled before older archive decks.
- Representative refs cover cover, roadmap, proof, system map, dense evidence, and closing behavior.
