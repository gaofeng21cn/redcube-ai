# ppt_deck / fix_html

## Goal

Repair only the slides blocked by the current screenshot review, using the smallest coherent content or composition change.

## Scope

- Return only target slides from the repair context. Preserve locked/passing slides and use adjacent references only for continuity.
- Consume the current HTML plus current AI and mechanical findings. The findings describe observable defects; they do not prescribe a historical layout recipe.
- Keep the existing page family when it remains valid. Redesign the target page or route upstream when its story, evidence, visual direction, template capacity, or route is the real defect.

## Good Work

- Resolve the named readability, overlap, overflow, containment, hierarchy, spacing, density, line-break, page-number, and audience-language failures at their cause.
- Prefer shorter copy, clearer hierarchy, better container capacity, semantic reflow, or a different target-page composition over tiny text, hidden overflow, masking, or decorative filler.
- Preserve matching slide identity, QA anchors, primary-point marking, audience-visible text coverage, inline-only styles, public naming, and the deck typography/visual continuity.
- Do not expose review findings, revision context, prompt/route names, template registry, source ids, or private authoring notes in visible markup.

## Professional Dependency

A repaired slide must be rerendered and independently reviewed against its fresh pixels before any pass/export claim. Repeated failure should change the diagnosed cause or repair scope, not replay the same micro-adjustments.

## Handoff

Return the repaired slide markup required by the attached output contract. Runtime records the repair summary and preserves unaffected pages.
