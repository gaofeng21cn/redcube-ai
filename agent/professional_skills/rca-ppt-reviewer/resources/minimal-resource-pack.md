# RCA PPT Reviewer Minimal Resource Pack

## Payload Fields

- `visual_qa`: inspect pixels, contact sheet rhythm, source fidelity, title hierarchy, text fit, collisions, crop, leaks, and export evidence before returning a verdict ref.
- `ppt_visual_density`: mark density as `pass`, `weak`, or `block` using screenshot evidence and the approved density band; never infer density from manifest counts alone.
- `repair_target_row`: `slide_id`, visible problem, source or design contract violated, required change, rerun route, owner stage, preserve-or-redraw scope.
- `handoff_evidence_check`: confirm review refs, screenshot refs, route source, PPTX/PDF refs, artifact gallery ref, unresolved weak/blocking pages, and forbidden-authority flags before package/handoff stages consume the result.
- `story_arc_visual_check`: pixels and titles prove necessity, feasibility, and landing path in order; product names do not outrun audience motivation.
- `draft_label_check`: declare `draft`, `reviewed_draft`, or `handoff_candidate` based on screenshot review and unresolved weak/blocking pages; this is not a production-readiness claim.
- `route_back_decision`: owner stage, blocked slide ids, evidence refs, required repair, and preserve-or-redraw scope.
- `memory_proposal_gate`: only propose reusable visual lessons; route every accept/reject decision to `rca-visual-memory-curator`.
- `repeated_visual_failure_diagnosis`: prior attempt refs, current pixel evidence, unchanged/changed defect, likely owner, route arbitration need, and smallest rerun scope.
- `route_arbitration_review`: route used, route claimed, required proof evidence, route mismatch if any, and repair owner for image-first, HTML, or native PPTX.
- `native_package_review`: planned kinds, readback kinds, relationship/part refs, notes/motion refs, mismatches, and stable-id repair targets.
- `blind_comparison_candidate`: anonymized pair refs, professionality findings, aesthetics findings, stability findings, edit-task findings, and forbidden authority claim.

Owner: `redcube_ai`
State: `skill_local_resource`
Boundary: refs-only professional method resource. This file is not visual truth, an artifact body, an owner receipt, a quality verdict, an export verdict, or runtime state.

Registry refs: `ppt-native-ai-first-design-pack.json#/communication_mode_registry`, `#/visualization_pattern_registry`, `#/professional_style_registry`; provenance audit: `ppt-master-learning-landing.json`.

## Template

```text
review_check:
  screenshot_ref:
  contact_sheet_ref:
  source_truth_ref:
  visual_direction_ref:
  route_source:
  verdict:
  weak_pages:
  blocked_pages:

semantic_composition_review:
  communication_mode_fit:
  visualization_pattern_id:
  required_observable_semantics:
  observable_semantics_verdict:

repair_target_row:
  slide_id:
  visible_problem:
  violated_contract:
  required_change:
  rerun_route:
  owner_stage:
  preserve_or_redraw:

visual_qa:
  pixel_evidence:
  source_fidelity:
  density_verdict:
  export_refs:

story_arc_visual_check:
  necessity_visible:
  feasibility_visible:
  landing_path_visible:
  product_names_do_not_outrun_motivation:

draft_label_check:
  label:
  unresolved_weak_pages:
  unresolved_blocked_pages:

native_package_review:
  planned_object_kinds:
  readback_object_kinds:
  relationship_and_part_refs:
  notes_motion_refs:
  declared_readback_mismatches:
  stable_id_repair_targets:

blind_comparison_candidate:
  anonymized_pair_refs:
  professionality_findings:
  aesthetics_findings:
  stability_findings:
  edit_task_findings:
  owner_receipt_forbidden: true
```

## Example

```text
slide_id: S07
visible_problem: title collides with badge and chart labels are below readable floor
violated_contract: visual_direction density band and title safe zone
required_change: remove badge, enlarge chart labels, move source note to footer
rerun_route: repair_image_pages
owner_stage: artifact_creation
preserve_or_redraw: redraw S07 only
```

## Checklist

- Review pixels and contact sheet rhythm before reading manifests.
- Source claims, numbers, labels, and conclusions match approved refs.
- Internal routes, local paths, prompt names, and operator wording in visible content require repair and close ready claims; progression follows the Stage quality budget.
- Weak findings and blocking defects use different fields.
- Candidate export may continue with explicit quality debt or a no-output diagnostic; accepted export claims require the declared review, screenshot, package, and owner evidence.
- Contact sheets are checked for rhythm and density, not only file count.
- Drafts with known weak pages stay labeled as drafts until repaired.
- Native labels are reconciled with package object/part/relationship readback.
- Title promises are rejected when the promised relation is absent from pixels and object structure.
- Same-source parity comparisons stay anonymized and do not self-sign an RCA owner receipt.
