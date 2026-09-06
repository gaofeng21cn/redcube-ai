# RCA PPT Story Architect Minimal Resource Pack

## Payload Fields

- `serial_pipeline`: `source_lock -> claim_spine -> detailed_outline -> slide_blueprint -> visual_direction_ready`. Each step names the accepted input ref, output ref, next gate, and repair owner before the next step starts.
- `story_spec_lock`: audience, goal, non-negotiable source refs, forbidden claims, slide ids, page roles, action-title language, evidence placement, and approval state.
- `progressive_disclosure`: one audience decision per page, one proof object per page, and one transition into the next page; overflow becomes a split-page or repair target.
- `blueprint_row`: `slide_id`, `page_role`, `action_title`, `core_claim`, `evidence_refs`, `proof_object`, `visible_text_budget`, `speaker_note_goal`, `transition`.
- `first_use_contract`: full visible name, accepted abbreviation, public link/source ref when allowed, and the slide where abbreviation becomes safe.
- `necessity_feasibility_landing_check`: the outline names the audience problem, why existing tools fail, what proof makes the proposed route feasible, and what adoption path is credible.
- `visual_proof_intent`: per slide visible proof object, screenshot-checkable claim, source-fidelity risk, and route-back owner if proof would fail.
- `claim_spine_lock`: claim id, source refs, introduction slide, proof slide, resolution slide, and forbidden drift.
- `repeated_visual_failure_story_triage`: contact-sheet or screenshot evidence, affected slide ids, likely story defect, required blueprint repair, and downstream owner to retry after story repair.

Owner: `redcube_ai`
State: `skill_local_resource`
Boundary: refs-only professional method resource. This file is not visual truth, an artifact body, an owner receipt, a quality verdict, an export verdict, or runtime state.

Registry refs: `ppt-native-ai-first-design-pack.json#/communication_mode_registry`, `#/visualization_pattern_registry`; provenance audit: `ppt-master-learning-landing.json`.

## Template

```text
story_spec_lock:
  communication_mode_id:
  communication_mode_behavior:
  audience:
  goal:
  source_refs:
  forbidden_claims:
  slide_budget:
  approval_state:

serial_pipeline:
  accepted_input_ref:
  output_ref:
  next_gate:
  repair_owner:

progressive_disclosure:
  first_glance_decision:
  overflow_action:

blueprint_row:
  slide_id:
  page_role:
  action_title:
  core_claim:
  evidence_refs:
  proof_object:
  visualization_pattern_id:
  visualization_selection_rationale:
  visible_text_budget:
  speaker_note_goal:
  transition:

first_use_contract:
  full_visible_name:
  accepted_abbreviation:
  public_link_or_source_ref:
  first_use_slide_id:

necessity_feasibility_landing_check:
  audience_problem:
  why_existing_tools_fail:
  feasibility_proof:
  credible_landing_path:

claim_spine_lock:
  - claim_id:
    claim_text:
    source_refs:
    first_use_naming:
      full_visible_name:
      accepted_abbreviation:
      first_use_slide_id:
    introduction_slide_id:
    proof_slide_ids:
    resolution_slide_id:
    forbidden_drift:
```

## Example

```text
slide_id: S03
page_role: evidence_turn
action_title: The current workflow loses time at the approval handoff
core_claim: The problem is not content generation speed; it is unclear owner acceptance.
evidence_refs: source:intake-notes#handoff-gap, source:operator-log#blocked-review
proof_object: handoff swimlane with blocked owner decision marker
visible_text_budget: title <= 14 words, 3 evidence labels, no internal route ids
speaker_note_goal: explain why the next slide evaluates the owner route
transition: This makes owner-route clarity the next design constraint.
```

## Checklist

- Source refs are frozen before claims are written.
- Every slide has one audience decision, one proof object, and one transition.
- Progressive disclosure is explicit: overflow becomes a split-page or repair target.
- Action titles state claims, not topic labels.
- Dense slides have split/shorten repair targets before visual direction.
- Visible text contains no local paths, prompt names, route names, or operator wording.
- Product/platform decks motivate necessity before naming the product family.
- First-use project names include full names and source/link refs when allowed.
- Claim ids remain stable across outline, blueprint, notes, and transitions.
- Progress continuity reuses Stage Folder upstream artifact refs, the current stage artifact, RCA receipt refs, and the existing current pointer; no custom baton payload is created.
