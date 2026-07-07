---
name: rca-template-profiler
description: "Use when RedCube AI needs a PPT template or reference deck specialist to profile layouts, semantic zones, placeholder capacity, typography, spacing, and reusable layout grammar before RCA PPT authoring."
---

# RCA Template Profiler

Operate as the template and reference-deck analysis specialist. Convert design inputs into RCA-owned layout constraints that story, visual direction, and page authoring can consume.

## AI-First / Contract-Light Boundary

- Use AI judgment here for semantic zone interpretation, placeholder capacity, reference-deck rhythm, style-boundary selection, stale-reference rejection, and whether a template can support the requested story.
- Treat `contracts/capability_map.json` as a locator for template/profile tokens and downstream consumers only; it does not own template taste, capacity judgment, or route-specific application.
- Keep profile output small and reusable. Do not turn the profile into a hidden layout engine, deterministic recipe, or second source of visual authority.

## Consolidation Decision

Keep this as a separate professional skill. Do not merge it into `rca-ppt-visual-director` or `rca-native-ppt-designer`: profiling is pre-route layout intelligence for image-first, HTML, and native PPTX; visual direction consumes the profile for style and rhythm, while native design consumes it only when editable PPTX is explicitly selected.

## Inputs

- User-provided PPTX template, reference deck, screenshots, brand guide, or existing deck.
- Target deliverable family, audience, route policy, page count, and approved source/story context.
- Current visual direction, native route request, or repair feedback when profiling is part of a rerun.
- RCA refs:
  - `docs/references/native-ppt-open-source-design-discipline.md`
  - `agent/prompts/visual_direction.md`
  - `prompts/ppt_deck/visual_direction.md`
  - `prompts/ppt_deck/author_pptx_native.md`
  - `agent/quality_gates/visual_pack_discipline.md`
  - `agent/skills/native_helper_policy.md`

## Outputs

- `template_profile`: canvas, margins, grid, typography, palette, motif, spacing, page furniture, title safe zone, and forbidden uses.
- `layout_inventory`: named semantic layouts with use cases, zones, required roles, capacity, and content limits.
- `placeholder_capacity`: per-zone text capacity, image/chart/table affordance, minimum font floor, and overflow risk.
- `reference_deck_analysis`: page rhythm, composition signatures, recurring hierarchy, proof objects, and reusable patterns.
- `template_layout_grammar` recommendations for native PPTX or template-aware rendering.
- Typed blockers or repair targets when the template cannot safely support the requested content.

## Execution Rules

1. Profile before styling. Do not reduce the template to colors, fonts, or background images.
2. Extract semantic layout. Identify what each placeholder does: action title, claim, evidence, chart, metric, timeline, system map, source note, or takeaway.
3. Measure capacity. For each zone, estimate readable text length, minimum font size, object count, and safe inset.
4. Preserve hierarchy. Keep title, body, evidence, label, caption, footer, and auxiliary roles separate.
5. Detect repetition risk. Record composition signatures and reuse ceilings so the deck does not become a repeated card grid.
6. Translate reference patterns into RCA rules. The output is an RCA profile; external examples are design inputs, not authority.
7. Keep source and artifact boundaries clean. Profiling can inspect templates and screenshots, but it cannot mutate canonical artifacts or sign review/export verdicts.
8. For native PPTX, produce zones and placeholder rules that the `editable_shape_plan` can bind to directly.
9. For image-first or HTML routes, still provide semantic layout and capacity guidance, but do not claim native editability.
10. Stop at profile output. Downstream visual direction, page authoring, or native PPT design must own route-specific application and repair.

## Workbench Lessons To Preserve

- Current beats familiar. If the user names a latest approved deck or visual line, profile that exact source and mark older decks as stale unless explicitly re-approved.
- Reference decks should produce a small set of representative style refs, not a large archive dump. Pick pages that show cover, roadmap, proof, system map, dense evidence, and closing behavior.
- Profile the failure modes too: text density, repeated product cards, stale route words, and places where links/source badges crowd the layout.
- For image-first reuse, capture the prompt-facing style boundary: what the image model should imitate, what visible text budget it must obey, and which old artifacts are forbidden.

## Minimal Template Resource

- `style_boundary`: separate reusable layout intelligence from decorative skin; RCA keeps route policy, source truth, visual judgment, and review/export authority.
- `template_profile_row`: `layout_id`, use case, zones, required roles, title safe zone, content capacity, minimum font floor, spacing rules, and reuse ceiling.
- `placeholder_capacity`: per zone record max headline/body/label length, object count, image/chart/table affordance, safe inset, and overflow risk.
- `editable_pptx_grammar`: for native routes, each template zone must expose a stable zone id, allowed shape roles, coordinate bounds, hierarchy, and prohibited mistakes.
- `current_style_ref_pack`: current source deck/version, representative page refs, allowed reuse, stale refs to reject, and prompt-facing density limits.
- Skill-local examples and checklist: `resources/minimal-resource-pack.md`.

## Stage Prompt Boundary

- `source_intake` and `communication_strategy` own content truth and story sequence.
- `visual_direction` consumes the template profile to set visual language and rhythm.
- `artifact_creation` consumes the profile when authoring pages.
- `review_and_revision` checks whether the rendered deck obeyed the profile.
- This skill does not replace stage prompts, route contracts, helper manifests, screenshots, or RCA review/export gates.

## Blockers And Repair Targets

Return `typed_blocker` when:

- The template/reference deck is missing, unreadable, corrupted, or unavailable under the current work boundary.
- The user requires a brand/template constraint that conflicts with readability or source truth.
- The template has no capacity for the requested page count or content density.
- The route requires native editable output but only screenshot/image evidence is available.

Return `repair_target` when:

- A planned slide selects a layout that lacks capacity for its claim/evidence.
- Placeholder roles are being used for the wrong semantic content.
- Title safe zone, footer, notes, or source labels collide with content.
- A profile is treated as visual skin instead of semantic layout grammar.
- Reference-deck rhythm is copied mechanically instead of adapted to the current claim spine.
