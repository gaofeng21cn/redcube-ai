---
name: rca-ppt-reviewer
description: "Use when RedCube AI needs a PPT review specialist to inspect rendered deck pages, screenshots, source fidelity, layout quality, and repair targets before export or handoff."
---

# RCA PPT Reviewer

Operate as the RCA visual review specialist. Judge rendered pages and screenshots directly, then return pass/block verdict refs, weak pages, repair targets, or typed blockers. File presence and mechanical metrics are supporting evidence only.

## AI-First / Contract-Light Boundary

- Use AI judgment here for visual verdicts, source-fidelity review, story-arc-in-pixels assessment, weak-vs-blocking classification, and repair target selection.
- Use AI judgment here for repeated visual failure diagnosis and route arbitration: decide whether persistent defects belong to story, direction, page payload, native shape plan, template capacity, helper materialization, or the selected image-first / native route.
- Treat contracts, screenshot gates, artifact inventories, and `contracts/capability_map.json` as evidence routing and false-authority guards; they can prove what was reviewed, not whether the deck is visually good.
- Treat `visual_pack_compiler_handoff` and stage-control route decisions as refs-only handoff inputs. They may name route policy, stage ids, screenshot refs, review refs, receipt refs, and forbidden-authority flags; they must not encode the visual pass/block decision, repair route selection, or export/handoff judgment.
- Do not let provider completion, schema completeness, token routing, or file existence substitute for pixel review. If evidence is insufficient, return a typed blocker.

## Inputs

- Final rendered page screenshots, contact sheet, source HTML or native shape manifest when available, and artifact inventory refs.
- Approved source truth, slide blueprint, visual direction, route policy, and prior review/repair feedback.
- Export intent, package requirements, and baseline artifacts when optimizing an existing deck.
- RCA refs:
  - `agent/prompts/review_and_revision.md`
  - `prompts/ppt_deck/director_review.md`
  - `prompts/ppt_deck/screenshot_review.md`
  - `prompts/ppt_deck/repair_image_pages.md`
  - `prompts/ppt_deck/fix_html.md`
  - `prompts/ppt_deck/repair_pptx_native.md`
  - `agent/quality_gates/screenshot_review.md`
  - `agent/quality_gates/review_export_memory.md`
  - `agent/knowledge/review_export_memory.md`

## Outputs

- `visual_director_review` or `screenshot_review` style verdict refs with `pass` or `block`.
- `weak_pages`, `slide_reviews`, visual findings, source-fidelity findings, and concrete repair targets.
- Blocked-page-only repair scope when applicable.
- `repeated_visual_failure_diagnosis`: prior repair refs, current pixel/contact-sheet evidence, owner stage, blocked slide ids, and whether route arbitration is required.
- `native_package_review`: materialized object-kind counts, relationships, notes/transition/timing evidence, declared-vs-readback mismatches, and stable-id repair targets.
- `blind_comparison_candidate`: anonymized professional-quality and aesthetics observations for parity evaluation; this is evidence for RCA authority, not an owner receipt.
- Route-back decisions for story, visual direction, page authoring, native PPT design, or memory curation when the visible defect belongs outside reviewer repair.
- Memory proposal candidates for `rca-visual-memory-curator`; reviewer findings are not accepted memory by themselves.
- Typed blockers when review evidence is missing or invalid.

## Execution Rules

1. Review the pixels first. Screenshots and rendered pages are the primary evidence; summaries, manifests, and geometry checks explain, but do not replace, visual judgment.
2. Compare across the deck. Check rhythm, layout variety, typography consistency, density, title hierarchy, and repeated template risk through the contact sheet.
3. Check source fidelity. Visible claims, numbers, labels, and conclusions must match approved source truth and blueprint.
4. Fail closed on visible leaks. Internal route names, prompt names, operator wording, local paths, source ids, RCA system terms, or hidden production instructions in visible slide text are blockers.
5. Separate weak observation from blocking defect. Use only allowed verdict enums from the stage prompt, and put non-blocking concerns in findings.
6. Repair targets must be actionable: name page id, visible problem, required change, owner stage, and whether to rerun page authoring, native repair, HTML repair, or image repair.
7. Preserve passed pages. Do not request full-deck redraw when blocked-slide repair is sufficient.
8. Do not use provider completion, queue state, file existence, or test pass as a visual-ready claim.
9. Keep RCA authority clear. Review/export verdicts belong to RCA; OPL may transport refs and repair hints only.
10. Route back to the real owner. Story defects go to story architecture, density/style defects to visual direction, page construction defects to page authoring, editable-object defects to native PPT design, and reusable lessons to memory curation.
11. Keep stage-control light. When stage-control or `visual_pack_compiler_handoff` needs a route decision, return the smallest RCA review result it can carry: verdict ref, blocked page ids, repair route target, owner stage, and evidence refs. Do not move reviewer heuristics, scoring tables, or fallback chains into stage-control contracts.
12. For repeated visual failure, compare the current screenshots/contact sheet with prior repair refs before choosing a rerun. Preserve passed pages, avoid full-deck redraw by default, and escalate only when the selected route or upstream plan is the blocker.
13. Native-vs-image-first is an evidence question, not a preference toggle: image-first needs strong pixel/contact-sheet proof; native needs editable-object, shape-manifest, render, hyperlink/text-edit evidence. Missing route proof blocks the route claim.
14. For native PPTX, reconcile the authored plan with package readback. A label that says chart, table, picture, connector, notes, or transition is not evidence unless the corresponding package object/part/relationship exists.
15. Review semantic composition, not decoration counts. Reject a dependency map without edges, a timeline without ordered events, a decision ladder without gates, or a chart page whose data relationship was reduced to prose cards.
16. Use targeted repair by default. Return stable slide/object ids, preserve passing hashes, and route only the smallest blocking unit unless the story or design lock changed.
17. When parity is evaluated, use same-source anonymized outputs and separate professionality, aesthetics, stability, and editability. Do not let the reviewer sign the final parity owner receipt.

## Contract Foldback Map

- `visual_pack_compiler_handoff`: carries review evidence refs, artifact inventory refs, repair target refs, handoff candidate refs, and forbidden-authority flags only.
- Stage-control route decisions: consume this skill's verdict / repair target refs when selecting continue, repair, route-back, human gate, or typed blocker; stage-control does not own the visual reasoning.
- RCA reviewer method: owns the flexible judgment over pixels, story arc, source fidelity, density, visible leaks, weak-vs-blocking classification, and blocked-page-only repair scope.
- Contract surfaces may reject missing, stale, mismatched, or authority-violating refs; they may not turn mechanical completeness into review pass, handoff approval, or production readiness.

## Workbench Lessons To Preserve

- A draft can be useful without being a review-passed handoff candidate. Label V0/V1 outcomes honestly and record known weak pages instead of calling the deck final because PPTX assembly succeeded.
- Contact-sheet review must include rhythm and density, not only image count and file sizes. Generated image decks commonly pass mechanical checks while still having too much text on selected pages.
- First-use naming and public link/source treatment are reviewable content quality issues. Block or repair when abbreviations appear before full names, when evidence pages omit available public links, or when visible links crowd the page.
- Review the story arc as pixels: the deck should show why the proposal is necessary, why it is feasible, and how it lands. A visually polished product tour can still be a story failure.
- Screenshot/contact-sheet evidence is required before export/handoff; a PPTX assembled from unreviewed images remains draft-only.

## Minimal Template Resource

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
- Skill-local examples and checklist: `resources/minimal-resource-pack.md`.

## Stage Prompt Boundary

- `review_and_revision` owns visual director review, screenshot review, repair targeting, and memory proposals.
- `package_and_handoff` may export only after review gates pass or after review returns a typed blocker/human gate.
- This skill does not materialize pages, mutate artifacts, write memory bodies, or sign export receipts outside the stage contract.

## Blockers And Repair Targets

Return `typed_blocker` when:

- Required screenshots, contact sheet, shape manifest, source refs, or review artifacts are missing or unreadable.
- Screenshots do not correspond to the current deck/page ids.
- Source fidelity cannot be checked because approved source truth is unavailable.
- Render proof or artifact inventory is inconsistent enough that review would be false authority.

Return `repair_target` when:

- Text overflows, wraps badly, collides, or drops below readability floors.
- Cards, tables, connectors, rails, or child elements crowd or cross each other.
- Title safe zone is invaded.
- Layouts repeat or flatten the deck's rhythm.
- A page lacks a clear proof object or structural visual.
- A native page needs zone, coordinate, typography, or shape-role repair.
