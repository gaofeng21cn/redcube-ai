---
name: rca-ppt-page-author
description: "Use when RedCube AI needs a PPT page authoring specialist to create or repair individual slide pages from approved story and visual direction while preserving RCA route policy and review gates."
---

# RCA PPT Page Author

## Runtime Summary

Author audience-facing pages from the accepted source, story/blueprint, visual direction, and selected route. Preserve claims, fit content at readable scale, choose semantic visuals, and emit route-appropriate proof expectations. Repair only blocked pages when possible; reroute story, direction, template, or route defects instead of hiding them with helper defaults.

Produce page plans or artifacts from the accepted upstream refs, with enough detail for later screenshot and export QA. Preserve page order and shared design decisions; independent page production does not require a serial executor.

## AI-First / Contract-Light Boundary

- Use AI judgment here for page composition, text-budget cuts, structural visual selection, route-specific payload quality, and blocked-page repair scope.
- Use AI judgment here to decide whether repeated visual failure is repairable inside the page payload or must route back to story, visual direction, template profiling, native design, or route selection.
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
- `page_visual_proof_packet`: rendered-page pixel refs expected for review, route source refs, contact-sheet membership, shape-manifest refs when native, blocked-slide scope, preserved-page hashes when repairing, and known QA risks.
- Typed blockers or repair targets for missing upstream contracts, capacity failure, route mismatch, or unsafe visible content.

## Execution Rules

For an existing-deck adaptation, use
[PPT Source Adaptation](../../knowledge/ppt_source_adaptation.md); for style or
object fidelity, use [PPT Style Calibration](../../knowledge/ppt_style_calibration.md).
Use [PPT Production Reuse](../../knowledge/ppt_production_reuse.md) for long decks,
targeted repair and recovery. Load only the relevant card. Include the current
page's source duty, exact content, object meanings and role-labeled references
in the generation brief. A style-only reference must not donate facts or anatomy.
Inspect calibration pages before scaling, and the whole changed page after a
local edit. Preserve unchanged media and notes instead of rebuilding passed pages.
Use the page input in `prompts/ppt_deck/image_first_prompt_template.md` for
exact copy, objects, required relationships, quantity bindings and reserved
verified assets. AI checks their meaning before generation and against the
whole output afterwards. Reference borrowing includes explicit exclusions;
bind shared craft, actual submitted prompt and input identities per attempt.

1. Consume the available source, story, blueprint, and visual direction for the page. Missing inputs produce bounded assumptions, repair targets, or a no-output diagnostic under the quality policy below.
2. Work from each page's current contract and check it against deck-level rhythm and style. Reuse already-read refs until an upstream change invalidates them.
3. Preserve approved claims and evidence. Do not rewrite the story to fit a convenient layout unless returning a repair target.
4. Keep visible text clean. Do not expose prompt names, source ids, local paths, route names, RCA internals, operator notes, or system fields.
5. Choose meaningful visual groups at readable scale. For image-first prompts, retain the objects, relations, evidence and labels required by the page role; do not maximize whitespace or minimize label counts at the expense of proof.
6. Use structural visuals, not decoration: connectors, rails, bands, timelines, maps, tables, charts, proof strips, and decision panels must carry first-glance logic.
7. Size content before committing layout. If text cannot fit at the readability floor, shorten copy, reduce slots, change layout, or return a repair target.
8. For repair, target only blocked pages when the review surface names them; preserve passed pages and record what feedback was consumed.
9. Treat helpers as materializers. Python, Office, screenshot, and export helpers execute the RCA plan and return evidence; they do not choose design or declare visual readiness.
10. Emit the proof packet with the page payload. A page is not reviewable unless the expected screenshot, contact-sheet, route-source, and native-shape evidence can be produced.
11. Route back when the page failure belongs to story, visual direction, template capacity, or route selection; do not hide it with helper defaults, smaller text, or post-processing.
12. When the same slide fails after a targeted repair, classify the repeated failure before another redraw: payload text budget, visual direction, story/claim overload, template capacity, native shape plan, helper output, or route mismatch.
13. Keep route claims honest. Image-first pages need 16:9 image/page refs and contact-sheet membership; native pages need editable shape evidence and render proof; do not mix those evidence types to upgrade the route.
14. For image-first materialization, follow `contracts/runtime-program/ppt-image-first-production-route.json#/api_contract`: prefer the active Codex built-in `image_gen` callable without checking `OPENAI_API_KEY`, then automatically call `agent/tools/generate-image.mjs` for Framework's `gpt-image-2` fallback if the tool is unavailable before image output.
15. Do not ask the user to approve the same-model fallback or configure a second key. Framework owns model connection and credential resolution; RCA sends only the image request and consumes the materialization receipt. Use a new output path for repairs, preserve approved pages, and reconcile an unknown outcome before another request.

### H3 full-slide text generation

When the selected route is a user's requested from-scratch H3 full-slide path,
keep H3 responsible for the complete page, including lettering and visual
relationships. Freeze one byte-identical `shared_style_prefix` for the batch;
write each page as a structured payload with `title`, `first_glance`,
`reading_order`, `objects`, `exact_copy`, `evidence`, and `avoid`. Do not replace
this route with illustration-only assets plus HTML/PPT text. Submit the same
route, aspect ratio, area, and `n` for all pages, keep corresponding finished
pages out of inputs, and treat verified scientific images as a separate asset
role. Review the batch together before accepting a page. Drift routes back to
the shared prefix or page-family rule and requires from-scratch regeneration;
page-local style patches, filters, and text overlays are not repairs.

If the user selects a provider direct API after observing host-side prompt
rewriting, use that provider route and record the submitted prompt plus any
provider-reported revised prompt. For MiniMax H3 Image, pure text-to-image
with prompt enhancement disabled is the faithful route; an image reference
may force the edit path and re-enable enhancement. Keep this distinction in the
page proof packet and do not report a successful API call as visual readiness.

Freeze reuse inputs from the selected page's actual submitted request, not the
last edited prompt. Keep accepted shared art separate from experimental payloads;
record whether the user accepted route stability, cross-page coherence or art
quality. Follow the direct-API baseline guidance in
`agent/knowledge/ppt_style_calibration.md` without page-local art overrides.

## Workbench Lessons To Preserve

- Do not skip route gates: visual direction -> page prompts/payloads -> generated/rendered pages -> contact sheet -> visual QA -> PPTX assembly/export. A PPTX made before screenshot review is only a draft artifact.
- For image-first decks, every generated page must be imported into the artifact workspace, normalized to 16:9, included in a contact sheet, and only then wrapped into PPTX.
- Keep full-page image PPTX honest. It is acceptable for the image-first route, but it must not be described as native editable PPTX.
- When generated text is too dense, improve hierarchy/composition and shorten redundant explanation while preserving essential evidence and publication attribution. Route a genuine capacity conflict to story/direction; do not silently delete proof or accept tiny text.
- Page authoring must consume the current approved style refs. If the style source changes, regenerate prompts or payloads that cite the old style rather than mixing old and new visual lines.
- Native PPTX pages must carry shape-manifest and render-proof expectations before reviewer QA; an editable claim without those refs is a route mismatch.

## Source-Faithful Image Repairs

Keep the page's content whitelist separate from its style reference. A reference supplies visual language, not sample sizes, titles, institutions or production instructions. Preserve verified publication status on each research-bearing method/result page; follow the accepted compact citation format instead of repeating a full paper title.

For medical imagery, verify modality, anatomy, plane and before/after pairing, not only the CT/MRI label. Mechanisms must distinguish training inputs, practical use and interpretation; do not fabricate curves, error bars or geographic locations as decoration. A local edit can change neighboring numbers, arrows or objects, so emit the whole affected page for renewed content review. Repeated failure on the same object should lead to a corrected content/reference-driven reconstruction within the existing repair budget, not endless cosmetic retries.

Keep blueprint, active prompt, image, speaker text, source records and PPTX notes consistent with the same current page data. When a desired content improvement changes approved story meaning, return it to the story owner rather than changing source authority inside page authoring.

## HTML Rendering Fidelity

For the selected HTML lane, lock one shared visual-system contract across cover,
chapter dividers (stage rail and target-language footer), content slides, and
ending slides (`agent/knowledge/ppt_style_calibration.md`, `## HTML Slide Visual
System And First-Draft Craft`), and preserve the brief's typeface and
role-based scale without forcing all roles into one size. Do not inject global
`!important` resets or runtime DOM patching scripts; when pairing with utility
frameworks that emit unlayered preflight rules, keep semantic chrome classes
outside `@layer`, and keep slide interiors static with zero CSS animations or
`transition` rules.

Prevent recurring HTML first-draft geometry and typography defects at authoring
time: inset rounded-card accents past `border-radius` corners so no corner hooks
appear and use `1px` dividers instead of corner `border-top` lines; route
cross-column SVG connectors cleanly through open gutters (`6–10px` edge gaps)
with matched `viewBox` aspect ratios or `preserveAspectRatio="none"` on orthogonal
grid buses so arrows stay centered on cards; widen SVG pill containers past label
text above stroke lines; avoid `justify-content: space-between` above adjacent
return loops; split bar tracks (`min-width: 0`) from `nowrap`, `tabular-nums`
unit columns and align summary rows on the exact detail Grid; place non-uniform
scale ticks linearly by `(tick - min) / (max - min) * 100%`; match column ratios
to real figure aspect ratios (pairing `>2.2` wide visuals with structured text),
preserve QR quiet zones, and keep 1-to-1 icon parity across legends and cards;
protect CJK prose from 1–2 character trailing orphans (`nowrap` on short compounds
and full-width punctuation), verify title/pill horizontal clearance, and align
sibling sub-blocks across columns. Existing paper figures retain their original
lettering; they are not CSS font failures.

Emit render expectations for current source bytes and dependencies. Cache-busting
must reach the actual navigation URL, not merely a variable updated after the
render command was assembled. Wait for fonts, image decoding and settled layout
before screenshots, and again after viewport changes. Record failed image loads
and check fixed-height `overflow: hidden` boxes for silent inner clipping
(`scrollHeight > clientHeight + 4` or `scrollWidth > clientWidth + 4`) as well as
active CSS animations/transitions before review. CSS declarations and computed
font-family do not establish the actual font used for each script or SVG label;
request platform-font evidence when typography fidelity is material.

Keep source, rendered-page refs and speaker notes aligned to the same slide ids.
Before repairing a shared or linked page asset, resolve its target and consumers
so a short-deck repair cannot silently overwrite the master. A current HTML page
does not establish that the PPTX or handoff copy has been regenerated.

## Resources

Load [minimal-resource-pack.md](resources/minimal-resource-pack.md) when authoring a new payload or when field-level examples are needed. Accepted current payload refs can be reused without loading the examples again.

## Stage Prompt Boundary

- `artifact_creation` owns artifact production under selected route policy.
- This skill does not approve communication strategy, visual direction, review verdict, export readiness, or owner receipt.
- `review_and_revision` decides whether rendered pages pass or need repair.
- `package_and_handoff` may export the best readable non-ready candidate or a no-output diagnostic after quality debt. Passing review gates is required for `visual_ready` and `export_ready` claims, not for candidate delivery.

## Blockers And Repair Targets

Zero, corrupt, or unreadable output becomes a no-output/failure diagnostic and quality debt for the next declared stage. Preserve the original failed bytes when useful for repair; do not represent them as a valid PPTX.

Return `typed_blocker` only when:
- The selected route conflicts with the authoring-lane authority lock, such as claiming native editable PPTX while only wrapping page images.
- Permission, credential, explicit human approval, authority, or stage identity/currentness prevents continuation.

Missing optional assets, fonts, template refs, runtime evidence, helper/preflight proof, layout quality, or partial page failures become `completed_with_quality_debt` when at least one readable page artifact exists. Preserve successful pages, spend the bounded repair budget on failed pages, then continue with the best available page set without ready claims.

Return `repair_target` when:

- Visible text leaks internal/operator language.
- Layout cannot hold content at readable size.
- Connectors, rails, labels, or panels collide.
- The page lacks a real structural visual.
- A blocked page needs changed archetype, reduced slots, rewritten labels, or updated coordinates.
- The failure should route back to source/story, visual direction, template profile, or native shape planning instead of being patched inside materialization.

## Optional References And One-Pass Evaluation

Follow the visual direction's selected input strategy. A reference image is
optional; text-only generation is valid when selected by the brief or route
calibration. Keep the style description coherent and the scientific copy exact.
Do not send corresponding finished outputs when evaluating independent authoring.
Keep first-pass evidence honest. From-scratch authoring does not end the
delivery task after one failed invocation: improve the initial text/director
brief and continue authorized independent generation until usable, preserving
accepted pages. Do not substitute a later output into the first-pass record.
Only an explicit experiment-only call limit imposes that scoped limit.
