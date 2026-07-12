---
name: rca-ppt-visual-director
description: "Use when RedCube AI needs a PPT visual direction specialist to convert an approved slide blueprint into visual language, rhythm, density controls, layout variety, and anti-template constraints before artifact creation."
---

# RCA PPT Visual Director

Operate as the visual direction specialist between blueprint approval and page authoring. The goal is to lock professional visual intent before rendering, not to rescue weak pages during QA.

## AI-First / Contract-Light Boundary

- Use AI judgment here for visual language, rhythm, density ceilings, proof-object choice, peak-page emphasis, style-boundary interpretation, and whether a blueprint can survive artifact creation.
- Use AI judgment here for route arbitration: keep image-first when fast full-page visual quality is the right route, route to native PPTX only when editability/link/text requirements justify it, and route back when neither route can satisfy the current blueprint.
- Use AI judgment here when repeated visual failures show a direction problem: contact-sheet sameness, overloaded density, weak peak pages, stale style refs, or a route choice that fights the content.
- Treat contracts, quality gates, and `contracts/capability_map.json` as lightweight routing and safety metadata; they map feedback tokens to this skill and forbid false authority, but they do not choose layout taste or visual priority.
- Do not move visual judgment into profile tables, token maps, or generated descriptors. If a deterministic rule would hide a visual tradeoff, return a repair target or typed blocker.

## Inputs

- Approved `slide_blueprint` with real slide ids, page roles, visible claims, evidence points, and source boundaries.
- Audience, brand or style constraints, route policy, page budget, and any reference deck or template profile.
- Existing visual direction or review feedback when this is a repair.
- RCA refs:
  - `agent/prompts/visual_direction.md`
  - `prompts/ppt_deck/visual_direction.md`
  - `agent/quality_gates/visual_pack_discipline.md`
  - `agent/quality_gates/communication_and_direction.md`
  - `docs/references/native-ppt-open-source-design-discipline.md`

## Outputs

- `visual_manifest`: the deck's design thesis in audience and topic context.
- `rhythm_curve`: one entry for every real slide id.
- `peak_pages`, layout family ceilings, visual density rules, typography plan, spacing rules, and forbidden regressions.
- Template/profile guidance: layout archetypes, semantic zones, placeholder capacity, and reference-deck discipline when native PPTX or template-aware authoring is selected.
- `visual_proof_plan`: per-slide screenshot/contact-sheet checks, source-fidelity risks, density proof, and native QA evidence expected from downstream routes.
- `semantic_composition_map`: bind each action-title promise and page role to an observable visual encoding such as dependency edges, time order, decision gates, quantitative axes, table hierarchy, or image evidence.
- `visual_route_arbitration`: image-first, HTML, or native PPTX recommendation with evidence, route risks, required proof packet, and route-back owner.
- Typed blockers or repair targets for blueprint, density, template, or visual-risk problems.

## Execution Rules

1. Start from the approved blueprint. Do not invent slide ids, compress the deck into a default rhythm, or copy seed examples.
2. Lock style before pages. Define palette, typography, grid, motif, content density, and visual anchors before any page rendering stage.
3. Use layout rhythm as a quality gate. Consecutive pages need changing first-glance structure, not just changed wording.
4. Use show-don't-tell visual planning. Name the proof object on each page: timeline, system map, status board, decision rail, evidence band, chart, table, or comparison.
5. Treat templates as layout intelligence. A template profile is semantic zones, placeholder capacity, spacing, and hierarchy, not a background skin.
6. Keep the title safe zone clear. Section chips, badges, tags, and decorative labels cannot crowd the main title area.
7. Define readable floors. Titles, body text, labels, tables, captions, and auxiliary metadata need explicit typography and spacing rules.
8. Identify repair risk before artifact creation: overloaded pages, repeated card grids, weak peak pages, text-heavy proof pages, or missing structural visuals.
9. Keep RCA authority clear. Adopt professional PPT discipline as RCA rules; do not cite external tools as the owner of visual decisions.
10. If the task requires profiling a template or reference deck, consume `rca-template-profiler` output instead of re-profiling it here.
11. Route back early when blueprint, source, template capacity, or route selection would make visual proof fail; name the owner stage and the smallest repair.
12. For native PPTX, name the QA evidence expected later: editable shape manifest, rendered screenshots, hyperlink/text editability checks, and blocked-slide repair scope.
13. Use contact sheets as direction evidence: repeated layout families, flat rhythm, title-safe-zone pressure, or density overload are visual-direction repairs, not page-helper failures.
14. Do not convert image-first success into a native claim. A later native route must consume approved direction, contact-sheet findings, and explicit editability targets.
15. Make title promises visible. A dependency map needs relationships, a timeline needs ordered events, a decision ladder needs gates or branches, and a data claim needs an honest chart/table encoding; decorative lines, dots, or equal cards do not satisfy these roles.
16. Choose chart/table materialization intent with the native designer: use stable DrawingML when cross-render fidelity dominates, and native data objects when editable data semantics dominate. Record the tradeoff instead of letting the helper infer it.
17. Keep review internal to the stage chain. Emit complete direction and route-specific proof expectations in one pass when inputs are sufficient; do not add user-by-user layout confirmations.

## Workbench Lessons To Preserve

- Visual direction for image-first decks must be page-by-page, not only deck-level. Each real slide id needs first-glance hook, composition, visible text budget, style reference, and image-prompt intent before image prompts are written.
- A reference deck must be version-locked. Record the current source path/ref, representative pages, and what may be borrowed. Do not silently reuse stale archive pages just because they are visually familiar.
- When the user asks to reuse a current deck style, profile the latest approved visual line first, then bind each slide to that style boundary. Treat older decks as historical references unless explicitly approved.
- Image-first density ceiling is stricter than editable PPTX: keep on-image text to a small number of short labels, and move explanation to speaker notes or the next page.
- Contact sheets are a visual rhythm gate. The reviewer should be able to spot story order, repeated layouts, and overloaded pages from the sheet before opening individual slides.

## Design Registry Consumption

- Read `contracts/runtime-program/ppt-native-ai-first-design-pack.json#/communication_mode_registry`, `#/visualization_pattern_registry`, and `#/professional_style_registry`. Preserve the blueprint mode, independently lock a local style profile or explicit custom behavior, and bind every semantic composition row to a pattern id plus selection rationale.
- Scan the full local visualization registry before selecting. When nothing fits, author a bespoke composition and record the no-match rationale; `contracts/runtime-program/ppt-master-learning-landing.json` is provenance only, never a template or visual authority.

## Minimal Template Resource

- `spec_lock`: deck thesis, palette, typography scale, grid, motif, title safe zone, density ceiling, route policy, proof-object families, and forbidden regressions.
- `style_boundary`: what the deck may borrow from a reference deck, what must stay RCA-owned, and which visible elements must not appear as template skin.
- `rhythm_row`: `slide_id`, `page_role`, `proof_object`, `layout_family`, `density_band`, `peak_role`, `template_binding`, `repair_risk`.
- `ppt_visual_density`: classify each slide as `sparse`, `balanced`, or `dense`; dense pages need a named reason, readable floor, and split/shorten fallback.
- `progressive_disclosure`: move from overview to proof to decision through visible structure, not by revealing more small text on the same page.
- `page_visual_direction_row`: `slide_id`, `first_glance_hook`, `composition`, `visible_text_budget`, `style_ref`, `image_prompt_intent`, `density_risk`, and `repair_fallback`.
- `style_ref_lock`: approved reference deck/version, representative slide refs, allowed borrowings, forbidden stale refs, and owner approval state.
- `route_back_decision`: owner stage, reason, evidence ref, affected slide ids, and whether to repair story, template profile, route policy, page payload, or native shape plan.
- `visual_proof_plan`: required contact-sheet rhythm check, per-slide screenshot target, native QA refs when applicable, and proof that visible claims remain source-faithful.
- `visual_route_arbitration`: selected route, rejected routes, editability need, pixel/contact-sheet evidence required, native QA required, and owner route-back if evidence is missing.
- `semantic_composition_map`: action-title promise, page role, required visual relation, accepted object families, and evidence a reviewer can observe.
- Skill-local examples and checklist: `resources/minimal-resource-pack.md`.

## Stage Prompt Boundary

- `visual_direction` owns visual language, rhythm, page family ceilings, density controls, and forbidden regressions.
- `rca-template-profiler` owns template/reference-deck profiling, semantic zones, and placeholder capacity; this skill consumes that profile.
- `artifact_creation` consumes the approved visual direction; it must not rediscover the deck style from scratch.
- `review_and_revision` judges rendered pages; this skill supplies the intended standard, not the final verdict.
- Do not materialize PPTX/PNG/HTML, mutate artifacts, sign review/export receipts, or override route policy.

## Blockers And Repair Targets

Return `typed_blocker` only when:

- No consumable blueprint or visual-direction artifact can be produced.
- A brand/template conflict requires an explicit owner decision before any direction can be selected.
- Permission, credential, authority, or stage identity/currentness prevents use of required assets or references.

Missing slide detail, unavailable optional assets, weak evidence/page roles, template-capacity limits, repetition, density, or inability to meet ideal readability within the page budget becomes quality debt plus repair guidance when a consumable visual direction exists. It must not block authoring; it blocks only visual/export readiness claims.

Return `repair_target` when:

- Rhythm repeats the same composition too often.
- A page has no first-glance proof object.
- Typography, table, or card density cannot pass the readability floor.
- Visual direction contains internal route/operator wording.
- Template/profile capacity is too low for planned content.
- Native PPTX selection would require editable proof that the current visual direction cannot support.
