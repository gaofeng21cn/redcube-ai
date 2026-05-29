# author_pptx_native_sample

Return one complete AI-authored editable native PPTX `editable_shape_plan` for one `native_visual_sample` slide. AI owns design, zones, coordinates, text, structural visuals, and bindings. Python/officecli only validates/materializes/renders.

Hard requirements:

- Include top-level `design_spec_lock`, `deck_layout_rhythm_plan`, `template_layout_grammar`, `slides`.
- `deck_layout_rhythm_plan` must use `slides: [{ slide_id, rhetorical_role, selected_archetype, primary_grid, composition_signature_budget, proof_object }]`; never use `per_slide`.
- `design_spec_lock` needs owner, motif, palette, type floors, grid gaps, rhythm, borrowed principles, QA gates, and `professional_design_brief`.
- Use canonical `bounds: { "left_in": number, "top_in": number, "width_in": number, "height_in": number }`; no `x/y/w/h` or alias bounds.
- Read `safe_zone_blueprints.tuple_contract` via `safe_zone_blueprints_ref`; copy/enlarge zones before shapes.
- `template_layout_grammar.archetype_catalog` is exactly the two sample contracts. Copy tuple contract into `template_layout_grammar.safe_zone_blueprints`. Include `reference_discipline` booleans before coordinates.
- Select exactly one archetype: `sample_status_proof_board` or `sample_decision_proof_split`. Do not use general deck archetypes.
- Each slide needs `layout_intent`, `template_layout_binding`, and `native_shapes`.
- Every non-decorative/non-auxiliary shape sets `layout_zone_id` and fits inside its declared zone.
- Text uses top-level `editable_text`, `font_size`, optional `margin_in`, `font`, `font_ea`, `color`; no nested font/text schema.
- No materializer defaults: visible text needs `font_size`; non-text content/structural shapes need `fill` or `line`; every visible shape needs `quality_role`.
- Allowed `quality_role`: `content`, `structural`, `decorative`, `auxiliary`. Repair exact shapes named by retry feedback.
- Visible proof text is one compact audience sentence; refs stay in metadata. Add one small auxiliary `page_number`.
- The three route cards are image-first default, HTML explicit, native PPTX explicit.

Allowed layouts:

- `sample_status_proof_board`: title + claim + input hub + exactly three large status cards in one horizontal row + short connectors + one proof band. Only title/claim/status/proof zones. `proof_zone>=1.35in`, `status_zone>=3.45in`; each card >=4.0in wide and >=1.35in high; paired `point_text>=0.96in`. Card panels are `content_panel`/`content`; structural objects are `input_hub`, connectors, `proof_band`. Floors: `core_sentence>=0.95in`, `evidence_item>=0.84in`, `input_hub_label>=0.54in`, width>=4.8in. Use `同一材料同步进入三路验证`. Connectors need positive bounds and 0.12in clearance.
- `sample_decision_proof_split`: title + claim + left decision panel + right proof stack + rail + bottom takeaway band. Do not reuse status-board geometry.

Forbidden:

- Helper/Python/officecli/template fallback layout inference.
- Floating cards or structural lines outside declared zones.
- Dense receipt ledger, artifact inventory, multiple proof text blocks, or generic equal-card slide.
- Dropping `template_layout_binding`, `layout_intent`, or `layout_zone_id` during retry.
