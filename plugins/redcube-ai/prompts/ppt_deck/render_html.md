# ppt_deck / render_html

## Goal

Materialize the current `slide_blueprint` and `visual_direction` as audience-facing, reviewable 16:9 HTML slides.

## Scope

- For `slide_batch`, return only the requested slides. For `summary`, return only the render summary.
- Reuse locked reference slides only as continuity evidence for typography, palette, spacing, scale, and rhythm; do not copy their geometry.
- A focused revision brief applies only to its target slides. Preserve passing slides and their hashes unless an upstream design basis changed.

## Good Work

- Author each page from its claim, evidence, page role, visual thesis, and proof object. Use semantic composition appropriate to that page rather than a sample archetype or repeated card template.
- Keep all visible copy audience-facing and source-faithful. Speaker notes, transitions, page goals, source/material ids, route names, review instructions, and operator metadata stay out of markup.
- Produce stable 1152x648 pages with no scrolling or overflow, readable hierarchy, natural line breaks, clear title safe zones, balanced vertical use, and visible separation between readable groups.
- Preserve the shell contract (`slide-display-area`, navigation ids, and `slidesData`) and return per-slide markup in the attached output shape.
- Each slide root must carry its matching identity, at least two semantic `data-qa-block` regions, at least one `data-primary-point="true"`, and QA coverage for all visible text.
- Use inline styles or clean unlayered semantic tokens rather than global `!important` resets or runtime DOM patching hacks. Structural containers must actually contain their children; lines, anchors, icons, and badges cannot cover text. Keep slide interiors completely static (zero CSS animations or transitions). Font Awesome Free is available when a semantic icon helps.

## First-Draft HTML Craft Guardrails

Apply `agent/knowledge/ppt_style_calibration.md` (`## HTML Slide Visual System And First-Draft Craft`) on every initial slide:
- **Chrome & Corner-Hook Prevention**: Unify header eyebrow, title scale, citation pill, and tabular footer index across slides; on rounded cards (`12–16px` radius, `overflow: hidden`), inset vertical accent bars past top/bottom corners (`>= radius + 1px`) and horizontal accent bars past left/right corners (`>= radius + 2px`), and never apply full-width `border-top`/`border-left` at corner arcs.
- **Coordinate-Locked SVG & Connectors**: Route cross-column buses through open vertical/horizontal gutters using orthogonal paths and matching `marker-end` arrowheads with `6–10px` edge gaps—never pierce intermediate cards diagonally. Match SVG `viewBox` aspect ratios to container boxes (or use `preserveAspectRatio="none"` on orthogonal grid connectors), size SVG pills wider than labels above lines, and avoid `justify-content: space-between` above attached return loops.
- **Honest Data Scales & Metric Tracks**: Split bar tracks (`flex: 1; min-width: 0`) from fixed-width, `white-space: nowrap`, `tabular-nums` unit labels; keep summary rows on the identical Grid track as detail rows; position non-uniform scale ticks linearly by `(tick - min) / (max - min) * 100%` (never `justify-between`) and avoid uncalibrated 100% full bars.
- **Figures, QR, Icons & Typography**: Pair column proportions to natural figure aspect ratios (`> 2.2` wide paired with structured takeaways; `~1.1–1.2` near-square narrowed) to eliminate >20% dead zones; preserve QR aspect ratio and white quiet zones; keep 1-to-1 icon parity between legends and detail cards; prevent 1–2 char CJK orphan lines and split compounds via controlled measure, full-width punctuation, and `nowrap`; check same-row title/badge clearance, align sibling sub-blocks (`min-height`/grid), and avoid `overflow: hidden` inner clipping (`scrollHeight <= clientHeight + 4`).

## Professional Dependency

Do not materialize without a consumable blueprint and visual direction. HTML is a draft artifact until rendered screenshots are independently reviewed. Rendering cannot repair unsupported story/evidence; return a focused upstream repair target when needed.

## Handoff

Apply the page-author Skill's HTML rendering-fidelity method: current-source
navigation, settled font/image/layout evidence, role-based typography and
shared-asset identity. CSS font-family is not proof of the font actually used.
Missing runtime evidence remains explicit review debt, not invented success.

Return the render object required by the attached output contract. Runtime owns shell assembly, persistence, screenshots, and deterministic checks; the AI owns the audience-facing markup and composition.
