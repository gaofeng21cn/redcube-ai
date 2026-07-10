---
name: rca-ppt-story-architect
description: "Use when RedCube AI needs a PPT story specialist to turn frozen source truth into a claim spine, narrative sequence, detailed outline, or slide blueprint for an RCA ppt_deck stage without producing visual artifacts."
---

# RCA PPT Story Architect

Operate as the PPT narrative specialist inside the RCA stage chain. Keep the stage prompt as the canonical schema owner; use this skill to make the story work professional, source-faithful, page-by-page, and ready for visual direction.

## AI-First / Contract-Light Boundary

- Use AI judgment here for claim hierarchy, narrative pressure, slide sequencing, evidence placement, first-use naming, layout/story risk, and whether a weak outline needs merge, split, demotion, or route-back.
- Use AI judgment here when repeated visual failures point back to story: separate true rendering/layout defects from overloaded claims, weak audience motivation, broken sequence, missing first-use naming, or page-budget pressure.
- Treat contracts, stage prompts, and `contracts/capability_map.json` as locators and guardrails only: they name refs, required fields, tokens, forbidden surfaces, and verification paths; they do not decide the story.
- When a contract and the story conflict, keep the contract as the boundary and return a typed blocker or repair target instead of encoding narrative rules into a second machine checklist.

## Inputs

- Frozen source truth, source package refs, `source_materials_full_text`, and explicit user constraints.
- Audience, objective, language, page budget, hard page-count constraints, and review stop policy.
- Existing storyline, detailed outline, or slide blueprint refs when this is a continuation or repair.
- RCA refs:
  - `agent/prompts/source_intake.md`
  - `agent/prompts/communication_strategy.md`
  - `prompts/ppt_deck/storyline.md`
  - `prompts/ppt_deck/detailed_outline.md`
  - `prompts/ppt_deck/slide_blueprint.md`
  - `docs/references/native-ppt-open-source-design-discipline.md`

## Outputs

- A source-grounded narrative spine: audience problem, claim sequence, evidence placement, and decision path.
- A detailed outline that preserves approved source truth and page budget.
- A slide blueprint with one page goal, one action title, core claim, evidence points, public sources, speaker notes, and transition sentence per slide.
- `claim_spine_lock`: a stable claim id, supporting evidence refs, first-use naming, and the exact slides that introduce, prove, and resolve each claim.
- `story_risk_map`: pages likely to fail visual proof because the claim, evidence, page role, or transition is overloaded.
- `repeated_visual_failure_story_triage`: whether repeated pixel/contact-sheet failures should repair source/story, visual direction, page authoring, native design, or route policy.
- Route-back targets when an apparent visual defect is really a source, story, sequence, or page-budget problem.
- Typed blockers or repair targets when the source or upstream plan cannot support a professional deck.

## Execution Rules

1. Freeze the source first. If the source package is partial, conflicting, or too thin for the requested claim, return a typed blocker instead of inventing story material.
2. Build a claim spine before slide count. Each slide must earn its place by advancing the audience from problem to evidence to decision. When the user allows structural adjustment, optimize the story before preserving the old page count.
3. Use action titles. Do not write chapter labels as slide titles unless the stage explicitly asks for divider pages.
4. Keep visible slide fields audience-facing. Rewrite internal names, route labels, operator requirements, prompt names, and file paths into project-facing language.
5. Design page sequence serially. For every page, bind page role, claim, evidence, visual intent, and transition before moving to the next page.
6. Preserve hard constraints from the user or approved outline. Treat source suggestions and runtime seeds as references, not approved truth.
7. Flag overloaded pages early. A page that needs unrelated claims, too many proof objects, or tiny evidence labels should be split, shortened, or blocked before visual direction.
8. Plan for show-don't-tell. Prefer concrete proof objects, comparisons, timelines, system maps, metrics, and decisions over generic summary bullets.
9. Plan visual proof intent. Each slide should name what a screenshot reviewer can verify in pixels: proof object, visible claim, evidence source, and transition role.
10. Route back instead of decorating. If a future layout or review failure is caused by unsupported story logic, return the owner stage and required story repair.
11. For repeated visual failure, check story causes before asking for another redraw: unsupported claim, too many proof objects, unclear necessity/feasibility/landing path, stale first-use naming, or impossible page budget.
12. Keep RCA authority clear. External PPT practice is design discipline only; RCA source truth and stage prompts remain the owner surface.
13. Keep claim identity stable across outline, blueprint, speaker notes, and transitions. A claim may be split across pages, but it must not silently change meaning between stages.
14. Keep the route moving. When inputs are sufficient, emit the complete canonical stage artifact so the runtime can continue automatically; request a human decision only when a real source, scope, or approval boundary changes the story.
15. Reuse Stage Folder continuity. Accepted upstream artifacts, the current stage artifact, RCA receipt refs, and the existing current pointer are the progress record; do not add a custom baton payload or a second control plane.

## Workbench Lessons To Preserve

- For product/platform or capability decks, default the narrative test to `necessity -> feasibility -> landing path` unless the approved brief says otherwise. Do not open with a product-family tour before the audience understands why the change is needed.
- First appearance of a named project, method, product, or evidence source should use its full name and a public source/link when available. Later slides may use abbreviations after the first-use contract is clear.
- A "clear logic but weak effect" review usually means the spine is under-motivated or over-named. Repair by moving the audience problem and proof threshold earlier, not by adding more product labels.
- If a live talk or user review says a middle chapter causes a break, treat that as a story-architecture defect. Merge, demote, or split the chapter before sending the deck to visual direction.

## Minimal Template Resource

- `serial_pipeline`: `source_lock -> claim_spine -> detailed_outline -> slide_blueprint -> visual_direction_ready`. Each step names the accepted input ref, output ref, next gate, and repair owner before the next step starts.
- `story_spec_lock`: audience, goal, non-negotiable source refs, forbidden claims, slide ids, page roles, action-title language, evidence placement, and approval state.
- `progressive_disclosure`: one audience decision per page, one proof object per page, and one transition into the next page; overflow becomes a split-page or repair target.
- `blueprint_row`: `slide_id`, `page_role`, `action_title`, `core_claim`, `evidence_refs`, `proof_object`, `visible_text_budget`, `speaker_note_goal`, `transition`.
- `first_use_contract`: full visible name, accepted abbreviation, public link/source ref when allowed, and the slide where abbreviation becomes safe.
- `necessity_feasibility_landing_check`: the outline names the audience problem, why existing tools fail, what proof makes the proposed route feasible, and what adoption path is credible.
- `visual_proof_intent`: per slide visible proof object, screenshot-checkable claim, source-fidelity risk, and route-back owner if proof would fail.
- `claim_spine_lock`: claim id, source refs, introduction slide, proof slide, resolution slide, and forbidden drift.
- `repeated_visual_failure_story_triage`: contact-sheet or screenshot evidence, affected slide ids, likely story defect, required blueprint repair, and downstream owner to retry after story repair.
- Skill-local examples and checklist: `resources/minimal-resource-pack.md`.

## Stage Prompt Boundary

- `source_intake` owns source readiness and source gaps.
- `communication_strategy` owns storyline, outline, page role, density, and sequence.
- This skill sharpens the specialist judgment inside those stages; it does not replace their schemas, route policy, or acceptance gates.
- Do not generate final slide images, HTML, PPTX, screenshots, export bundles, review verdicts, owner receipts, runtime state, or visual memory decisions.

## Blockers And Repair Targets

Return `typed_blocker` when:

- Required source material is missing, contradictory, or not allowed for the requested claim.
- The user asks for a conclusion the source cannot support.
- Page count, audience, language, or approval state is ambiguous enough to change the deck structure.
- Existing upstream artifacts are stale or do not match the current source truth.

Return `repair_target` when:

- A slide repeats another slide's job.
- A title is a topic label instead of a claim.
- Evidence is present in notes but missing from visible slide fields.
- A page is too dense for later layout or placeholder capacity.
- Internal RCA/operator wording appears in audience-facing fields.
- A visual or reviewer finding points back to source truth, claim order, page role, or first-use naming rather than page rendering.
