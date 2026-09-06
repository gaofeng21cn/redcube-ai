# RCA PPT Visual Director Minimal Resource Pack

## Payload Fields

- `spec_lock`: deck thesis, palette, typography scale, grid, motif, title safe zone, density ceiling, route policy, proof-object families, and forbidden regressions.
- `style_boundary`: what the deck may borrow from a reference deck, what must stay RCA-owned, and which visible elements must not appear as template skin.
- `rhythm_row`: `slide_id`, `page_role`, `proof_object`, `layout_family`, `density_band`, `peak_role`, `template_binding`, `repair_risk`.
- `ppt_visual_density`: classify each slide as `sparse`, `balanced`, or `dense`; dense pages need a named reason, readable floor, and split/shorten fallback.
- `progressive_disclosure`: move from overview to proof to decision through visible structure, not by revealing more small text on the same page.
- `page_visual_direction_row`: `slide_id`, `first_glance_hook`, `composition`, `visible_text_budget`, `style_ref`, `image_prompt_intent`, `density_risk`, and `repair_fallback`.
- `style_ref_lock`: approved reference deck/version, representative slide refs, allowed borrowings, forbidden stale refs, and owner approval state.
- `route_back_decision`: owner stage, reason, evidence ref, affected slide ids, and whether to repair story, template profile, route policy, page payload, or native shape plan.
- `visual_proof_plan`: required contact-sheet rhythm check, per-slide screenshot target, native QA refs when applicable, and proof that visible claims remain source-faithful.
- `visual_route_feasibility`: locked route, rejected alternatives, explicit native semantic admission evidence or `not_admitted`, pixel/contact-sheet evidence required, native QA required, and owner route-back if evidence is missing; this record cannot create native admission.
- `semantic_composition_map`: action-title promise, page role, required visual relation, accepted object families, and evidence a reviewer can observe.

Owner: `redcube_ai`
State: `skill_local_resource`
Boundary: refs-only professional method resource. This file is not visual truth, an artifact body, an owner receipt, a quality verdict, an export verdict, or runtime state.

Registry refs: `ppt-native-ai-first-design-pack.json#/communication_mode_registry`, `#/visualization_pattern_registry`, `#/professional_style_registry`; provenance audit: `ppt-master-learning-landing.json`.

## Template

```text
spec_lock:
  communication_mode_id:
  style_profile_id:
  custom_style_behavior:
  design_thesis:
  palette:
  typography:
  grid:
  motif:
  title_safe_zone:
  density_ceiling:
  route_policy:
  forbidden_regressions:

rhythm_row:
  slide_id:
  page_role:
  proof_object:
  layout_family:
  density_band:
  peak_role:
  template_binding:
  repair_risk:

visual_qa:
  screenshot_check:
  density_risk:
  repair_owner:

progressive_disclosure:
  overview_step:
  proof_step:
  decision_step:

page_visual_direction_row:
  slide_id:
  first_glance_hook:
  composition:
  visible_text_budget:
  style_ref:
  image_prompt_intent:
  density_risk:
  repair_fallback:

style_ref_lock:
  approved_reference_deck_or_version:
  representative_slide_refs:
  allowed_borrowings:
  forbidden_stale_refs:
  approval_state:

semantic_composition_map:
  slide_id:
  action_title_promise:
  required_visual_relation:
  visualization_pattern_id:
  visualization_selection_rationale:
  accepted_object_families:
  materialization_tradeoff:
  reviewer_observation:
```

## Example

```text
slide_id: S06
page_role: comparative_decision
proof_object: two-column tradeoff board with decision rail
layout_family: comparison_board
density_band: balanced
peak_role: decision_page
template_binding: title zone + two equal content zones + bottom source note
repair_risk: avoid repeated card grid from S04-S05
```

## Checklist

- The blueprint is approved and slide ids are stable.
- Style, grid, typography, and motif are locked before page authoring.
- Consecutive slides do not repeat the same first-glance composition.
- Progressive disclosure moves from overview to proof to decision before adding detail.
- Dense pages name a reason, readable floor, and split fallback.
- Reference decks contribute layout intelligence, not visual authority.
- Image-first visual direction is page-by-page before prompts are written.
- Current approved style refs override older familiar archive refs.
- Dependency, time, decision, and quantitative promises have visible relational encodings rather than decorative card grids.
- Native chart/table pages declare the fidelity-versus-data-editability tradeoff before authoring.
