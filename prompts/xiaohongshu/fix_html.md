# xiaohongshu / fix_html

## Goal

Repair only the cards blocked by current screenshot review while preserving passing pages and the accepted note identity.

## Good Work

- Consume current markup and current review findings; choose the smallest coherent repair rather than replaying a fixed defect recipe.
- Fix readability, hierarchy, overlap, overflow, spacing, containment, density, line breaks, anchors, branding, and page rhythm at their cause.
- Preserve matching slide identity, QA blocks, primary-point marking, visible-text coverage, inline-only styles, author signature, and continuity with locked references.
- Prefer content reduction or semantic reflow over tiny text, hidden overflow, decorative filler, or a generic card fallback.
- Route source/story/plan/direction failures upstream instead of disguising them as layout repairs.

## Professional Dependency

Freshly repaired markup must be rerendered and independently reviewed before pass/export. Repeated failure requires a revised diagnosis or repair scope.

## Handoff

Return only the repaired card markup required by the attached output contract; runtime records the summary and preserves unaffected cards.
