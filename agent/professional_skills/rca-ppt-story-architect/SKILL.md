---
name: rca-ppt-story-architect
description: "Use when RedCube AI needs a PPT story specialist to turn frozen source truth into a claim spine, narrative sequence, detailed outline, or slide blueprint for an RCA ppt_deck stage without producing visual artifacts."
---

# RCA PPT Story Architect

## Runtime Summary

Turn the accepted source and audience goal into a claim spine, storyline, slide roles, evidence placement, and transitions. Preserve source meaning and public naming while allowing outline, blueprint, capacity, and visual discoveries to iterate. Route unsupported claims or structural overload upstream instead of solving them with layout.

Keep the stage prompt as the schema owner. On continuation or repair, reuse accepted source and claim refs, and revise only story decisions affected by current feedback or changed user constraints.

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

1. Freeze the source first. If the source package is partial, conflicting, or too thin for the requested claim, preserve the gap as quality debt and continue with a bounded candidate or no-output diagnostic instead of inventing story material; reserve typed blockers for the explicit hard-stop whitelist.
2. Build a claim spine before slide count. Each slide must earn its place by advancing the audience from problem to evidence to decision. When the user allows structural adjustment, optimize the story before preserving the old page count.
3. Use action titles. Do not write chapter labels as slide titles unless the stage explicitly asks for divider pages.
4. Keep visible slide fields audience-facing. Rewrite internal names, route labels, operator requirements, prompt names, and file paths into project-facing language.
5. Design page sequence serially. For every page, bind page role, claim, evidence, visual intent, and transition before moving to the next page.
6. Preserve hard constraints from the user or approved outline. Treat source suggestions and runtime seeds as references, not approved truth.
7. Flag overloaded pages early. A page that needs unrelated claims, too many proof objects, or tiny evidence labels should be split or shortened within the quality budget; if it remains overloaded, record quality debt and continue with the best consumable plan.
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
- First appearance of a named project, method, product, or evidence source should use its full name and a public source/link when available. Later slides may use abbreviations after the first-use contract is clear, unless the user requires the full name on every appearance. Preserve explicitly requested application order and naming.
- A "clear logic but weak effect" review usually means the spine is under-motivated or over-named. Repair by moving the audience problem and proof threshold earlier, not by adding more product labels.
- If a live talk or user review says a middle chapter causes a break, treat that as a story-architecture defect. Merge, demote, or split the chapter before sending the deck to visual direction.

## Revising An Accepted Lecture

Approval of the narrative preserves its claim spine, key evidence, and speaker-led concept progression; it does not freeze every sentence or diagram. Within the current revision scope, inspect necessity, repetition, mechanism, figure-text agreement, and practical value, including pages already redrawn. For a deck-wide request, record each page's role, transition, evidence needs, defect, and keep/rewrite/restructure decision in the existing blueprint before grouped repairs. A local fix need not become a deck-wide rewrite.

Judge information sufficiency by page role. A mechanism needs inputs and meaningful relationships; a research claim needs its task, essential result and publication identity; a bridge must motivate the next step without pre-empting its explanation. Empty space, word counts, card counts, and fixed neighboring-page ratios cannot establish quality. Merge or split only when the narrative and current page constraints justify it.

Keep on-slide proof distinct from spoken explanation and full source records. Academic method and result pages should retain verified journal/year or actual publication status; full titles, DOI and experimental conditions belong in notes/source records when the brief calls for compact citations. Never strengthen conclusions by merging metrics across incompatible cohorts or settings, confusing percent with percentage points, or treating a model score as proof of clinical benefit. Freeze verified facts, not weak wording.

## Design Registry Consumption

- Consult relevant entries of `contracts/runtime-program/ppt-native-ai-first-design-pack.json#/communication_mode_registry` and `#/visualization_pattern_registry` for new or changed story decisions. Emit `communication_mode_id` (or a fully stated custom behavior), plus a `visualization_pattern_id` and selection rationale for every proof-bearing slide; preserve still-current selections without a repeat catalog scan.
- Use `contracts/runtime-program/ppt-master-learning-landing.json` only as provenance and coverage. If no registry pattern honestly fits, keep the proof intent and record a bespoke-composition rationale; never name an upstream template as local authority.

## Resources

Load [minimal-resource-pack.md](resources/minimal-resource-pack.md) when authoring a new payload or when field-level examples are needed. Accepted current payload refs can be reused without loading the examples again.

## Stage Prompt Boundary

- `source_intake` owns source readiness and source gaps.
- `communication_strategy` owns storyline, outline, page role, density, and sequence.
- This skill sharpens the specialist judgment inside those stages; it does not replace their schemas, route policy, or acceptance gates.
- Do not generate final slide images, HTML, PPTX, screenshots, export bundles, review verdicts, owner receipts, runtime state, or visual memory decisions.

## Blockers And Repair Targets

If no consumable source or planning artifact is produced, return a no-output diagnostic and quality debt as the next stage input.

Return `typed_blocker` only when:
- The requested claim is legally or authoritatively disallowed, or requires an explicit owner decision.
- Permission, credential, approval, authority, or stage identity/currentness prevents continuation.

Missing detail, contradictory evidence, unsupported conclusions, page-count ambiguity, stale-but-readable inputs, and incomplete audience/language constraints become quality debt and explicit assumptions when a consumable storyline/outline/blueprint can still be produced. They block unsupported claims and ready status, not downstream drafting.

Return `repair_target` when:

- A slide repeats another slide's job.
- A title is a topic label instead of a claim.
- Evidence is present in notes but missing from visible slide fields.
- A page is too dense for later layout or placeholder capacity.
- Internal RCA/operator wording appears in audience-facing fields.
- A visual or reviewer finding points back to source truth, claim order, page role, or first-use naming rather than page rendering.
