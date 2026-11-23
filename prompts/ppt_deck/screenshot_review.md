# ppt_deck / screenshot_review

Read each page against the same exact-copy, object, required-relationship,
quantity-binding and verified-asset brief consumed by its author. Check what
the actual arrows, branches and objects imply: a mandatory human gate must not
have a bypass; a metric must retain its input/task scope; a count encoded as
cells must match that count. Inspect craft-reference contamination and whether
real scientific assets remain authentic and correctly cropped. These are AI
judgments over pixels and sources, not keyword or field-completeness checks.

For unchanged reviewed pages, consume the image/notes/recipe hashes from the
actual export readback. A matching `review_binding` can support reuse of the
existing review; it cannot create a review or accept it. Changed layers,
geometry, crops or notes invalidate that recipe binding. New composites need
pixel review and QR scanning of the final use; contact sheets only establish
whole-deck rhythm for pages already individually reviewed.

Review the final rendered screenshots page by page before export. The pixels are the primary evidence; source HTML, geometry metrics, manifests, and prior director notes may explain intent but cannot excuse a visible defect.

Judge source fidelity, audience-facing language, title and information hierarchy, text fit, collisions, crop, spacing, density, layout rhythm, structural meaning, and cross-page consistency. For HTML decks, explicitly check pixels for rounded-border corner hooks, diagonal connectors piercing cards or shifted off grid centers by SVG `viewBox` letterboxing, floating return loops, labels overflowing SVG pills, `overflow: hidden` inner card clipping, uncalibrated 100% bars or mismatched non-uniform scale ticks, wrapped numeric/unit labels, >20% dead zones beside real figures or inside wide cards, legend-vs-card icon swaps, CJK 1–2 char trailing orphans, same-row badge/title overlap, and zero CSS animations. For native PPTX, compare declared charts, tables, pictures, connectors, groups, paths, notes, transitions, and timing with package/object readback. Report only defects visible in the current evidence and choose the smallest stable-id repair scope that preserves passing pages.

Return the attached schema with `director_intent_landed`, `anti_template_ok`, `weak_pages`, `review_summary`, and per-slide `pass` or `block` judgments. For summary review, emit at most one evidence-backed non-authority visual-memory proposal candidate; otherwise skip it. Mechanical metrics support the host-agent judgment and never replace it.

Blocked pages route to targeted repair, then rerender and fresh review. Only fresh review of the repaired bytes can support export.

Use `agent/professional_skills/rca-ppt-reviewer/SKILL.md` for actual-font and
final-file evidence and image-heavy Attempt continuity. Distinguish pixel defects
from line-box warnings, and request-byte failures from missing or misordered tool
results. Keep findings and remaining page refs in the current StageRun artifacts;
do not reload all accepted images or invent a separate recovery session.
