---
name: rca-ppt-visual-director
description: "Use when RedCube AI needs a PPT visual direction specialist to convert an approved slide blueprint into visual language, rhythm, density controls, layout variety, and anti-template constraints before artifact creation."
---

# RCA PPT Visual Director

Operate as the visual direction specialist between blueprint approval and page authoring. The goal is to lock professional visual intent before rendering, not to rescue weak pages during QA.

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

## Workbench Lessons To Preserve

- Visual direction for image-first decks must be page-by-page, not only deck-level. Each real slide id needs first-glance hook, composition, visible text budget, style reference, and image-prompt intent before image prompts are written.
- A reference deck must be version-locked. Record the current source path/ref, representative pages, and what may be borrowed. Do not silently reuse stale archive pages just because they are visually familiar.
- When the user asks to reuse a current deck style, profile the latest approved visual line first, then bind each slide to that style boundary. Treat older decks as historical references unless explicitly approved.
- Image-first density ceiling is stricter than editable PPTX: keep on-image text to a small number of short labels, and move explanation to speaker notes or the next page.
- Contact sheets are a visual rhythm gate. The reviewer should be able to spot story order, repeated layouts, and overloaded pages from the sheet before opening individual slides.

## Minimal Template Resource

- `spec_lock`: deck thesis, palette, typography scale, grid, motif, title safe zone, density ceiling, route policy, proof-object families, and forbidden regressions.
- `style_boundary`: what the deck may borrow from a reference deck, what must stay RCA-owned, and which visible elements must not appear as template skin.
- `rhythm_row`: `slide_id`, `page_role`, `proof_object`, `layout_family`, `density_band`, `peak_role`, `template_binding`, `repair_risk`.
- `ppt_visual_density`: classify each slide as `sparse`, `balanced`, or `dense`; dense pages need a named reason, readable floor, and split/shorten fallback.
- `progressive_disclosure`: move from overview to proof to decision through visible structure, not by revealing more small text on the same page.
- `page_visual_direction_row`: `slide_id`, `first_glance_hook`, `composition`, `visible_text_budget`, `style_ref`, `image_prompt_intent`, `density_risk`, and `repair_fallback`.
- `style_ref_lock`: approved reference deck/version, representative slide refs, allowed borrowings, forbidden stale refs, and owner approval state.
- Skill-local examples and checklist: `resources/minimal-resource-pack.md`.

## Stage Prompt Boundary

- `visual_direction` owns visual language, rhythm, page family ceilings, density controls, and forbidden regressions.
- `artifact_creation` consumes the approved visual direction; it must not rediscover the deck style from scratch.
- `review_and_revision` judges rendered pages; this skill supplies the intended standard, not the final verdict.
- Do not materialize PPTX/PNG/HTML, mutate artifacts, sign review/export receipts, or override route policy.

## Blockers And Repair Targets

Return `typed_blocker` when:

- The blueprint is missing real slide ids, visible claims, evidence, or page roles.
- Brand/template requirements conflict with source truth or readability.
- The requested visual style requires assets or reference material that is unavailable.
- The deck cannot meet hard page count and readability constraints without owner decision.

Return `repair_target` when:

- Rhythm repeats the same composition too often.
- A page has no first-glance proof object.
- Typography, table, or card density cannot pass the readability floor.
- Visual direction contains internal route/operator wording.
- Template/profile capacity is too low for planned content.
