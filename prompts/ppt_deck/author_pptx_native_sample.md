Return one AI-authored PPTX `editable_shape_plan` for one sample slide. AI owns design/zones/coords/text; Python/officecli validates/materializes/renders.

Rules:
- Include `design_spec_lock`, `deck_layout_rhythm_plan`, `template_layout_grammar`, `slides`.
- `template_layout_grammar.reference_discipline.source_projects` must include `ppt-master`, `PPTAgent`, `officecli-pptx`, `presenton`, and `ppt-agent-skills`.
- `design_spec_lock.borrowed_principles`/`qa_gates` are string arrays, not objects. `borrowed_principles` must include `ppt_master_style_spec_lock`, `template_layout_grammar`, `template_profile`, `semantic_layout_selection`, `reference_deck_analysis`, `per_page_visual_plan`, `layout_rhythm`, and `rendered_quality_gate`.
- `professional_design_brief` has `reference_style_family` and `capacity_strategy`.
- `deck_layout_rhythm_plan.slides[]` uses `{slide_id,rhetorical_role,selected_archetype,primary_grid,composition_signature_budget,proof_object}`; no `per_slide`.
- Use `bounds:{left_in,top_in,width_in,height_in}` only.
- Copy `safe_zone_blueprints.tuple_contract` before shapes.
- Catalog exactly `sample_status_proof_board` + `sample_decision_proof_split`; choose one. No general ones.
- Each slide has `layout_intent`, `template_layout_binding`, `native_shapes`; non-decorative/non-auxiliary shapes set `layout_zone_id` and fit.
- Text uses top-level `editable_text`, `font_size`, optional `margin_in/font/font_ea/color`; no nested style.
- Visible shapes need `quality_role: content|structural|decorative|auxiliary`; no defaults.
- Typography: title 40-44pt; body/core/point/proof 18pt; title/body>=2. Add one auxiliary `page_number`.

Layout:
- `sample_status_proof_board`: title + claim + input hub + 3 status cards + connectors + one proof band. Zones title/claim/status/proof only. `proof_zone>=1.35in`, `status_zone>=3.45in`; card>=4.0x1.35in and `quality_role=content`; each card has exactly one `point_text>=1.05in`, 12-22 chars. Do not add separate `route_label` text shapes; fold route names into the point_text sentence. Hub text `同一材料同步进入三条路线验证`, >=10.4x0.82in, >=22pt, centered, spans card centers. Exactly 3 vertical `kind=connector` arrows drop hub-bottom to card-top centers; w<=0.04in, h>=0.66in, gap>=0.12in, `tailEnd=triangle` or `line.end_arrow=true`. No horizontal bus/ticks. Proof text is one compact sentence and its text box is >=1.05in high at 18pt.
- `sample_decision_proof_split`: title + claim + left decision panel + right proof stack + rail + bottom takeaway band; no status-board geometry.

Forbidden: helper inference, floating shapes, receipts, inventory, multiple proof texts, equal-card slide, dropped bindings.
