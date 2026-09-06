# Native Object Semantics

Load this reference only when the admitted native plan contains charts, tables,
links, mathematical notation, or custom geometry. The RCA plan owns source
meaning and object intent; helpers own exact materialization and package
readback. PPT Master is a pattern source, not a runtime dependency.

## Data Objects

Choose `native_data_object` when editing the underlying chart/table data is
required. Choose `stable_drawingml` with explicit `drawingml_shapes` when
shape-level editing and viewer fidelity serve the requested result. Neither
choice changes the deck's native admission or permits a full-page-image claim.

- A chart declares `chart_type`, exact ordered `categories`, and `series` with
  names, values, and optional colors. Keep title, units, scales, source notes,
  emphasis, and companion text consistent with the approved source and pixels.
  Never invent missing values or drop observations to fit a supported type.
- A table declares complete rectangular `data`, `first_row`, and applicable
  header/body typography and colors. Current inline OfficeCLI table cells must
  not contain comma or semicolon; a diagnostic is preferable to truncation.
  Rich-cell spans and per-cell borders from the upstream semantic-table v2
  schema are not RCA payload fields. Preserve that meaning in explicit editable
  DrawingML or return a scoped capability/repair diagnostic.
- Native objects and shape-built alternatives are authored from the same source
  values. Reconcile actual chart type, category order, every series value, table
  cell, part, and relationship with the plan after materialization. A matching
  file hash proves identity, not data or visual equivalence.
- A helper's supported types and fields bound implementation, not content.
  Unsupported XY/ChartEx/combo schemas or style fields must not be silently
  treated as a simpler category chart. Keep source data and the best readable
  candidate, close the unsupported claim, and return the affected object to its
  design owner. Do not import upstream SVG markers or conversion scripts.

## Hyperlinks

Use exact destinations supplied by the source or user. The local authoring
interface is `link` on an editable text/shape object, or on a run in
`paragraphs[].runs[]`; surrounding paragraph text remains ordinary editable
content. The complete object and an inline run may have different destinations.

```json
{
  "shape_id": "S01-source",
  "kind": "text_box",
  "text": "Read the source",
  "paragraphs": [{
    "text": "Read the source",
    "runs": [
      {"text": "Read the "},
      {"text": "source", "link": "https://example.com/source"}
    ]
  }]
}
```

Add the normal explicit bounds, typography, role, and zone fields. Supported
targets are absolute `https:`, `http:`, `mailto:`, `tel:` URIs and `slide[N]`
jumps within the final 1-based roster. Resolve slide ids to that roster only
after ordering is fixed. Missing or ambiguous targets are content debt, not
permission to guess a URL. File/script/macro actions are not hyperlink payloads.
Current authored links cover text and shape objects; imported untouched links
remain source-package content. Do not claim linked images, groups, or charts
without an admitted helper path and exact object/relationship proof.

After saving, inspect object and inline text targets through package readback.
The helper verifies exact text spans and destinations, including Unicode text.
Changed slide order invalidates affected jumps and requires fresh readback.
Visual review still checks link visibility, contrast, and readable click labels.

## Mathematical Content

Keep exact mathematical source and reserve enough height for fractions,
radicals, matrices, and nested scripts. Ordinary short variables may remain
editable text when their mathematical meaning is unchanged.

PPT Master v6.3.0 adds its own LaTeX/mhchem-to-OMML compiler, inline and block
markers, and a PowerPoint-specific rendering contract. RCA's typed materializer
does not currently expose that compiler or an equivalent validated math object.
OfficeCLI having a generic `equation` command alone does not prove the same
input profile, source fidelity, or cross-viewer rendering. Do not label ordinary
text, a raster preview, or unvalidated OMML as an editable native formula.
Preserve exact source in the plan and return a scoped capability diagnostic for
structural editable math, while continuing with a non-ready candidate as allowed
by the stage quality policy. The upstream compiler/runtime is not imported.

## Shapes And Connectors

Choose contour from the object's relationship and communication job; inspect
the relevant local preset families when needed. There is no full-vocabulary
reading gate or requirement to explain every rejected primitive. Neutral
rectangles and unframed text remain valid when they serve the page.

Keep independently edited, linked, or animated objects separate. Use supported
preset geometry, real directed connectors, groups, or explicit custom path
commands. A custom path proves editable resulting geometry, not editable Boolean
operand history. Preserve imported template/master semantics instead of
reselecting their contours. No copied SVG body, upstream registry renderer,
Boolean engine, or icon corpus is required.

## Provenance

- Source: `hugohe3/ppt-master`, commit
  `d3d81fe3cf4cc642de225159586308bbe98eeb4d`, Skill v6.3.0.
- Inspected references: `native-data-interface.md`, `native-formula.md`,
  `native-hyperlinks.md`, `native-shape-authoring.md`.
- Local implementation: `native_layouts_parts/officecli.py`,
  `native_layouts_parts/materializer.py`, `native_hyperlinks.py`,
  `native_package.py`, and `officecli_readback.py` under the RCA native helper.
- Acceptance: `tests/ppt-native-editability-regression.test.js`,
  `tests/ppt-native-quality-package-readback.test.js`,
  `tests/ppt-native-template-preservation.test.js`, and real native render proof.
