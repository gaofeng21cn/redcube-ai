---
name: rca-ppt-page-author
description: "Use when RedCube AI needs a PPT page authoring specialist to create or repair individual slide pages from approved story and visual direction while preserving RCA route policy and review gates."
---

# RCA PPT Page Author

Operate as the page-level author inside RCA artifact creation. Produce page plans or artifacts only from approved upstream contracts, one page at a time, with enough detail for later screenshot and export QA.

## AI-First / Contract-Light Boundary

- Use AI judgment here for page composition, text-budget cuts, structural visual selection, route-specific payload quality, and blocked-page repair scope.
- Treat helpers, manifests, route policy, and `contracts/capability_map.json` as materialization and locator support only; they do not author the page, rebalance layout, or declare visual readiness.
- Keep contracts light by returning explicit page payloads, repair targets, or typed blockers instead of adding hidden fallback rules or post-processing heuristics to make weak pages pass.

## Inputs

- Approved source truth, storyline, detailed outline, slide blueprint, and visual direction.
- Selected route: image-first, HTML, or native editable PPTX.
- Page id, page role, evidence points, visual intent, repair feedback, and route constraints.
- RCA refs:
  - `agent/prompts/artifact_creation.md`
  - `prompts/ppt_deck/author_image_pages.md`
  - `prompts/ppt_deck/render_html.md`
  - `prompts/ppt_deck/author_pptx_native.md`
  - `prompts/ppt_deck/repair_image_pages.md`
  - `prompts/ppt_deck/fix_html.md`
  - `prompts/ppt_deck/repair_pptx_native.md`
  - `agent/skills/visual_deliverable_authoring.md`
  - `agent/skills/native_helper_policy.md`

## Outputs

- Page-by-page artifact authoring instructions, route-specific page payloads, or blocked-slide repair plans.
- For native PPTX: editable shape plan fragments with explicit roles, bounds, typography, fills/lines, zone binding, and manifest-friendly ids.
- For image-first/HTML: page content and render intent that keeps visible text audience-facing and QA-readable.
- Typed blockers or repair targets for missing upstream contracts, capacity failure, route mismatch, or unsafe visible content.

## Execution Rules

1. Respect serial gates. Do not author a page before source, story, blueprint, and visual direction exist for that page.
2. Work page by page. Re-read the page contract before authoring, then check it against deck-level rhythm and style.
3. Preserve approved claims and evidence. Do not rewrite the story to fit a convenient layout unless returning a repair target.
4. Keep visible text clean. Do not expose prompt names, source ids, local paths, route names, RCA internals, operator notes, or system fields.
5. Prefer fewer, larger, meaningful visual groups over many small cards. For image-first prompts, use fewer than the maximum readable labels; generated text often becomes denser and less controllable than the written prompt suggests.
6. Use structural visuals, not decoration: connectors, rails, bands, timelines, maps, tables, charts, proof strips, and decision panels must carry first-glance logic.
7. Size content before committing layout. If text cannot fit at the readability floor, shorten copy, reduce slots, change layout, or return a repair target.
8. For repair, target only blocked pages when the review surface names them; preserve passed pages and record what feedback was consumed.
9. Treat helpers as materializers. Python, Office, screenshot, and export helpers execute the RCA plan and return evidence; they do not choose design or declare visual readiness.

## Workbench Lessons To Preserve

- Do not skip route gates: visual direction -> page prompts/payloads -> generated/rendered pages -> contact sheet -> visual QA -> PPTX assembly/export. A PPTX made before screenshot review is only a draft artifact.
- For image-first decks, every generated page must be imported into the artifact workspace, normalized to 16:9, included in a contact sheet, and only then wrapped into PPTX.
- Keep full-page image PPTX honest. It is acceptable for the image-first route, but it must not be described as native editable PPTX.
- When a page is text-dense after generation, redraw the page with fewer labels rather than accepting tiny generated text. Preserve unaffected pages and repair only the blocked slide ids when possible.
- Page authoring must consume the current approved style refs. If the style source changes, regenerate prompts or payloads that cite the old style rather than mixing old and new visual lines.

## Minimal Template Resource

- `page_contract`: `slide_id`, approved claim, proof object, visual direction ref, selected route, density band, text budget, required evidence, and review risk.
- `serial_page_pipeline`: read page contract, choose structural visual, place title/proof/evidence zones, check density, then emit route-specific payload.
- `ppt_visual_density`: reduce labels, slots, or secondary notes before shrinking text below the readable floor; if the page still fails, return a repair target.
- `editable_pptx_grammar`: every native shape needs role, zone id, bounds in inches, font size for text, visible fill/line when structural, z-order, and stable manifest id.
- `progressive_disclosure`: keep page-level hierarchy obvious at first glance; secondary detail moves to notes, appendix, or the next slide.
- `image_first_page_payload`: `slide_id`, current `style_ref`, prompt text, visible label budget, forbidden text, expected 16:9 output ref, import ref, and contact-sheet ref.
- `draft_to_export_gate`: generated/rendered page exists, 16:9 normalized page exists, contact sheet reviewed, blocked pages repaired, then PPTX assembly.
- Skill-local examples and checklist: `resources/minimal-resource-pack.md`.

## Stage Prompt Boundary

- `artifact_creation` owns artifact production under selected route policy.
- This skill does not approve communication strategy, visual direction, review verdict, export readiness, or owner receipt.
- `review_and_revision` decides whether rendered pages pass or need repair.
- `package_and_handoff` exports only after review gates pass.

## Blockers And Repair Targets

Return `typed_blocker` when:

- Required upstream artifacts are missing, stale, or not approved.
- The selected route conflicts with the requested deliverable, such as claiming native editable PPTX while only wrapping page images.
- Materialization cannot proceed without missing assets, font constraints, template refs, or runtime evidence.
- A helper/preflight failure cannot be repaired inside the current page contract.

Return `repair_target` when:

- Visible text leaks internal/operator language.
- Layout cannot hold content at readable size.
- Connectors, rails, labels, or panels collide.
- The page lacks a real structural visual.
- A blocked page needs changed archetype, reduced slots, rewritten labels, or updated coordinates.
