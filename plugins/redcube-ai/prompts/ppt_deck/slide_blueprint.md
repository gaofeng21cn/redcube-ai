# ppt_deck / slide_blueprint

## Goal

Turn the current detailed outline into an executable page-by-page content and rhetoric contract for visual direction and materialization.

## Good Work

- Consume the current `detailed_outline`, full source/evidence table, audience goal, and hard constraints. Do not replace accepted outline decisions with source slide suggestions or default page patterns.
- For every real slide, specify the audience-facing title/claim/evidence/content, page role, visual presentation intent, public sources, private notes, transition, and render recipe.
- Preserve source-backed numerical evidence and the accepted `claim_spine_lock` exactly; map its introduction, proof, and resolution roles to real slide ids.
- Separate audience content from authoring/runtime metadata. Internal ids, route names, prompt names, operator instructions, and private notes must not become visible slide copy.
- Let page composition vary with the claim and proof object. Template or canvas capacity may trigger a focused blueprint revision; do not force overloaded content into rendering.
- In the existing per-page content/render fields, distinguish `exact_copy` from
  `objects`, `required_relationships`, `quantity_bindings` and `verified_assets`.
  Bind each quantity to its task, input condition, metric, unit and source;
  describe important arrow endpoints/direction, mandatory decision gates and
  any forbidden inference. Counts that carry meaning need an explicit visual
  encoding (for example, four visible cells out of sixteen). Use empty lists
  where a page has no such requirement; do not invent fields as visible copy.
- Identify evidence that must retain original bytes before composition. Reserve
  its region and source/crop, while keeping explanatory generated objects
  recognizable as teaching diagrams. Keep coordinates and production guidance
  outside `exact_copy`. AI checks whether the resulting explanation is coherent;
  field presence alone cannot establish that.

## Professional Dependency

The blueprint must be consumable before claim-bearing materialization. It can co-evolve with visual direction, but changed claims or evidence route back to story/source rather than being solved visually.

## Handoff

For an existing-deck adaptation, bind each target page's source-page refs, page duty, essential comparison/mechanism and transition inside the existing content/source fields. Translation or restyling preserves the source duties; concise adaptation may bind multiple pages or add a necessary bridge. Verify the actual source page, not merely its number or a historical alignment label.

Return the slide-blueprint object required by the attached output contract. The result must give visual direction and each authoring route enough content, source, hierarchy, and transition detail without prescribing sample geometry.
