import { CANONICAL_BOUNDS_SCHEMA, type JsonRecord, type NativePptRoute } from './shared.js';

interface NativePptPlanRetryContractDeps {
  nativeShapePlanOutputContract(route: NativePptRoute): JsonRecord;
  safeArray(value: unknown): JsonRecord[];
  safeText(value: unknown, fallback?: string): string;
  structuralFeedbackFixes(validationFeedback: JsonRecord | null | undefined): JsonRecord[];
  validationFeedbackFixes(validationFeedback: JsonRecord | null | undefined): JsonRecord[];
}

export function createNativePptPlanRetryContractParts({
  nativeShapePlanOutputContract,
  safeArray,
  safeText,
  structuralFeedbackFixes,
  validationFeedbackFixes,
}: NativePptPlanRetryContractDeps) {
  function nativeShapePlanOutputContractForAttempt(
    route: NativePptRoute,
    validationFeedback: JsonRecord | null | undefined,
    baseContract?: JsonRecord | null,
  ) {
    const contract = baseContract && typeof baseContract === 'object'
      ? baseContract
      : nativeShapePlanOutputContract(route);
    const exactFixes = validationFeedbackFixes(validationFeedback);
    const structuralFixes = structuralFeedbackFixes(validationFeedback);
    if (exactFixes.length === 0 && structuralFixes.length === 0) return contract;
    const isCompactSample = safeText(contract?.editable_shape_plan?.authoring_mode) === 'native_visual_sample_compact';
    if (isCompactSample) {
      const retryContract = {
        contract_kind: 'native_pptx_compact_sample_retry_exact_fixes_v1',
        previous_attempt: Number(validationFeedback?.previous_attempt || 0) || null,
        required: true,
        enforcement: 'full editable_shape_plan must satisfy every compact retry fix before Python materialization',
        instruction: [
          'Return the full editable_shape_plan, not a patch.',
          'Preserve accepted design_spec_lock, deck_layout_rhythm_plan, template_layout_grammar, slide template_layout_binding, zones, layout_intent, and layout_zone_id bindings unless a listed fix explicitly requires redesign.',
          'For each exact_shape_fix, update the same native_shapes[] shape_id.',
          'If reason is ai_first_page_number_missing, add one small auxiliary page_number shape with quality_role=auxiliary.',
          'For height/width/font/text fixes, meet or exceed required_height_in, required_width_in, required_font_size, and required_text_char_count.',
          'For zone or panel fixes, use zone_bounds/zone_safe_bounds/panel_safe_bounds/required_delta_in and keep the whole shape inside the declared safe area.',
          'For content-depth fixes, rewrite the exact editable_text into a 12+ meaningful-character audience phrase; input_hub_label is visible content and should read like 同一材料同步进入三条路线验证, not a tiny label.',
          'For connector-thickness fixes, keep both bounds.width_in and bounds.height_in positive and at least 0.03in for every line/connector shape.',
          'For structural-text collisions, reroute connector lanes outside text boxes and keep at least 0.12in clearance from readable text.',
          'For compact sample status board, keep exactly the selected sample archetype contract, three status cards when using sample_status_proof_board, one proof sentence, and no visible boundary-note/takeaway overflow.',
        ].join(' '),
        exact_shape_fixes: exactFixes,
        required_structural_fixes: structuralFixes,
        global_shape_class_fixes: safeArray(validationFeedback?.global_shape_class_fixes),
        native_shape_plan_structural_preservation_contract: {
          required: true,
          template_layout_binding_preservation_required: true,
          materializer_inference_allowed: false,
          zone_safe_inset_in_min: 0.15,
          zone_gap_in_min: 0.32,
          zone_inset_in_min: 0.15,
        },
      };
      return {
        ...contract,
        native_shape_plan_validation_feedback_contract: retryContract,
        ...(structuralFixes.length > 0
          ? {
              native_shape_plan_structural_retry_contract: {
                contract_kind: 'native_pptx_compact_sample_structural_retry_v1',
                previous_attempt: Number(validationFeedback?.previous_attempt || 0) || null,
                required: true,
                required_structural_fixes: structuralFixes,
                required_design_spec_lock_fields: [
                  'spec_id',
                  'owner=llm_agent',
                  'motif',
                  'palette.background_or_canvas+ink+accent',
                  'typography.title_pt_min>=40 for native_visual_sample',
                  'typography.body_pt_min>=18',
                  'grid.edge_margin_in_min>=0.6',
                  'grid.inter_block_gap_in_min>=0.32',
                  'layout_rhythm',
                  'professional_design_brief',
                  'borrowed_principles string array, not object',
                  'qa_gates string array, not object',
                ],
                canonical_bounds_schema: CANONICAL_BOUNDS_SCHEMA,
                materializer_inference_allowed: false,
                instruction: 'Repair only listed missing structure. design_spec_lock.borrowed_principles and design_spec_lock.qa_gates must be string arrays, not keyed objects.',
              },
            }
          : {}),
        ...(validationFeedback?.passed_structure_preservation_contract
          ? {
              passed_structure_preservation_contract: validationFeedback.passed_structure_preservation_contract,
            }
          : {}),
        editable_shape_plan: {
          ...(contract.editable_shape_plan || {}),
          validation_retry_contract: {
            contract_kind: retryContract.contract_kind,
            required: true,
            exact_shape_fixes: exactFixes,
            required_structural_fixes: structuralFixes,
            global_shape_class_fixes: safeArray(validationFeedback?.global_shape_class_fixes),
            acceptance_rule: 'Each listed shape_id or structural missing field must be repaired in the returned full editable_shape_plan; helper inference and partial patch output are forbidden.',
          },
          ...(validationFeedback?.passed_structure_preservation_contract
            ? {
                passed_structure_preservation_contract: validationFeedback.passed_structure_preservation_contract,
              }
            : {}),
        },
      };
    }
    return {
      ...contract,
      ...(exactFixes.length > 0
        ? {
            native_shape_plan_validation_feedback_contract: {
              contract_kind: 'native_pptx_preflight_retry_exact_shape_fixes_v1',
              previous_attempt: Number(validationFeedback?.previous_attempt || 0) || null,
              required: true,
              enforcement: 'the returned editable_shape_plan must satisfy every exact_shape_fix before materialization',
              instruction: 'For each exact_shape_fix, find the matching native_shapes[] item by shape_id and satisfy every non-null requirement on that same shape. Set quality_role to required_quality_role when present; allowed values are only content, structural, decorative, and auxiliary. Set bounds.height_in to required_height_in or larger when present; set bounds.width_in to required_width_in or larger when present; set font_size to required_font_size or larger when present; rewrite editable_text so normalized audience text reaches required_text_char_count when present. If required_inside_zone and zone_bounds are present, move or resize shape_id so its full bounds stay inside the named layout_zone_id zone_safe_bounds when provided, otherwise zone_bounds, keeping required_zone_inset_in when provided; required_delta_in reports the current left/top/right/bottom overflow. If other_shape_id and required_gap_in are present, move or resize shape_id and/or other_shape_id so the two visible text boxes no longer overlap and keep at least required_gap_in clearance. If panel_shape_id and required_inset_in are present, keep the whole text box inside panel_safe_bounds when provided, otherwise inside that panel with at least required_inset_in on left, top, right, and bottom; required_delta_in reports the current panel padding bleed. If required_connector_thickness_in is present, set both width_in and height_in positive and at least that thickness for line/connector shapes. If the existing composition has no room, redesign the page geometry, reduce slots, or shorten text while preserving meaning. Do not return the same failing quality_role, the same failing text, the same failing font size, the same failing height, the same failing width, the same outside-zone geometry, the same overlap, the same panel padding bleed, or a zero/negative connector dimension.',
              native_shape_plan_structural_preservation_contract: {
                required: true,
                template_layout_binding_preservation_required: true,
                materializer_inference_allowed: false,
                zone_safe_inset_in_min: 0.15,
                zone_gap_in_min: 0.32,
                zone_inset_in_min: 0.15,
                instruction: 'When repairing Python validation failures, preserve or strengthen the structural template contract. Do not remove editable_shape_plan.template_layout_grammar, slides[].template_layout_binding, zones, safe_inset_in, or native_shapes[].layout_zone_id. Every zone must keep safe_inset_in >= 0.15 and every non-decorative/non-auxiliary shape, including structural rails, connectors, bands, and content text, must remain bound to a declared zone.',
              },
              exact_shape_fixes: exactFixes,
              global_shape_class_fixes: safeArray(validationFeedback?.global_shape_class_fixes),
            },
          }
        : {}),
      ...(structuralFixes.length > 0
        ? {
            native_shape_plan_structural_retry_contract: {
              contract_kind: 'native_pptx_structural_shape_plan_retry_v1',
              previous_attempt: Number(validationFeedback?.previous_attempt || 0) || null,
              required: true,
              enforcement: 'the returned editable_shape_plan must repair every missing required structure before any native materialization or Python validation',
              output_shape_required: {
                editable_shape_plan_required: true,
                full_deck_regeneration_required: true,
                slide_binding_required_before_shapes: true,
                materializer_inference_allowed: false,
                required_top_level_fields: [
                  'editable_shape_plan.design_spec_lock',
                  'editable_shape_plan.deck_layout_rhythm_plan.slides',
                  'editable_shape_plan.template_layout_grammar',
                  'editable_shape_plan.template_layout_grammar.reference_discipline',
                  'editable_shape_plan.slides',
                ],
                required_design_spec_lock_fields: [
                  'spec_id',
                  'owner=llm_agent',
                  'motif',
                  'palette.background_or_canvas+ink+accent',
                  'typography.title_pt_min>=40 for native_visual_sample',
                  'typography.body_pt_min>=18',
                  'grid.edge_margin_in_min>=0.6',
                  'grid.inter_block_gap_in_min>=0.32',
                  'layout_rhythm',
                  'professional_design_brief',
                  'borrowed_principles string array, not object',
                  'qa_gates string array, not object',
                ],
                per_slide_required_fields: [
                  'slide_id',
                  'layout_intent',
                  'template_layout_binding',
                  'native_shapes',
                ],
                template_layout_binding_required_fields: [
                  'selected_archetype',
                  'archetype_instance_id',
                  'rhythm_role',
                  'zone_gap_in_min',
                  'zone_inset_in_min',
                  'zones',
                ],
                zone_required_fields: ['zone_id', 'semantic_role', 'bounds', 'intended_content', 'min_font_pt', 'safe_inset_in'],
                native_shape_required_binding_field: 'layout_zone_id',
                structural_shape_binding_required: true,
              },
              instruction: [
                'Regenerate the full editable_shape_plan, not a partial patch.',
                'Preserve the complete already accepted structure unless a listed failure explicitly requires changing it: editable_shape_plan.design_spec_lock, editable_shape_plan.deck_layout_rhythm_plan, editable_shape_plan.template_layout_grammar, every slides[].template_layout_binding, every declared zone, every layout_intent, and every native_shapes[].layout_zone_id.',
                'Do not ask the materializer, Python helper, officecli, or RCA runtime to infer template layout, zones, role groups, rhythm rows, or layout_zone_id values.',
                'For deck-scope fixes, add the missing top-level contract exactly at editable_shape_plan.<required field>.',
                'design_spec_lock.borrowed_principles and design_spec_lock.qa_gates must be arrays of strings. Do not return keyed objects for these fields.',
                'For slide-scope fixes, add or repair that slide template_layout_binding, zones, layout_intent, native_shapes, shape quality roles, and layout_zone_id bindings.',
                'Return template_layout_binding as a sibling field of native_shapes inside each slide object, not inside native_shapes, layout_intent, notes, or prose.',
                CANONICAL_BOUNDS_SCHEMA.instruction,
                'Every non-decorative/non-auxiliary shape must bind to a declared zone on the same slide and stay inside that zone. This includes structural rails, connectors, proof bands, decision rails, evidence axes, gate panels, content panels, and audience text.',
              ].join(' '),
              canonical_bounds_schema: CANONICAL_BOUNDS_SCHEMA,
              required_structural_fixes: structuralFixes,
            },
          }
        : {}),
      ...(validationFeedback?.passed_structure_preservation_contract
        ? {
            passed_structure_preservation_contract: validationFeedback.passed_structure_preservation_contract,
          }
        : {}),
      editable_shape_plan: {
        ...(contract.editable_shape_plan || {}),
        ...(exactFixes.length > 0
          ? {
              validation_retry_contract: {
                contract_kind: 'native_pptx_preflight_retry_exact_shape_fixes_v1',
                required: true,
                exact_shape_fixes: exactFixes,
                global_shape_class_fixes: safeArray(validationFeedback?.global_shape_class_fixes),
                per_shape_acceptance_rule: 'for every matching shape_id, native_shapes[] must satisfy all provided exact fixes: quality_role equals required_quality_role when present, height >= required_height_in, width >= required_width_in, font_size >= required_font_size, normalized editable_text length >= required_text_char_count, full containment inside layout zone_safe_bounds or zone_bounds when required_inside_zone is present, no visible text overlap with other_shape_id when required_gap_in is present, and full containment inside panel_safe_bounds or panel_shape_id with required_inset_in when present',
                global_shape_class_acceptance_rule: 'When global_shape_class_fixes are present, apply them to every matching role/class in the whole slide, not only the shape_ids that failed in the previous attempt.',
                line_connector_acceptance_rule: 'For failed line or connector shapes, both width_in and height_in must be positive; the thin dimension must be at least required_connector_thickness_in when provided, otherwise at least 0.03in.',
                structural_preservation_acceptance_rule: 'Python validation repair must still return a full structural plan: preserve template_layout_grammar, each slide template_layout_binding, all declared zones, safe_inset_in >= 0.15, zone_gap_in_min >= 0.32, zone_inset_in_min >= 0.15, and layout_zone_id bindings for all non-decorative/non-auxiliary shapes.',
                redesign_allowed_when_space_is_tight: true,
              },
            }
          : {}),
        ...(structuralFixes.length > 0
          ? {
              structural_retry_contract: {
                contract_kind: 'native_pptx_structural_shape_plan_retry_v1',
                required: true,
                required_structural_fixes: structuralFixes,
                deck_acceptance_rule: 'top-level design_spec_lock, deck_layout_rhythm_plan, and template_layout_grammar must all be present, complete, and owned by llm_agent when required; design_spec_lock must include motif, palette, typography, grid, layout_rhythm, borrowed_principles, and qa_gates',
                slide_acceptance_rule: 'each slide must include template_layout_binding with selected archetype, archetype instance, rhythm role, zones, safe insets, and matching layout_zone_id on every non-decorative/non-auxiliary shape, including structural rails/connectors/bands',
                output_shape_required: 'Return editable_shape_plan.slides[].template_layout_binding as a slide-level sibling of native_shapes. Do not hide it under layout_intent, notes, shape metadata, or prose.',
                canonical_bounds_acceptance_rule: CANONICAL_BOUNDS_SCHEMA.instruction,
                canonical_bounds_schema: CANONICAL_BOUNDS_SCHEMA,
                structure_preservation_rule: 'Preserve design_spec_lock, deck_layout_rhythm_plan, template_layout_grammar, slides[].template_layout_binding, zones, layout_intent, native_shapes[], and layout_zone_id bindings unless a required_structural_fix explicitly names that field.',
                materializer_inference_allowed: false,
              },
            }
          : {}),
        ...(validationFeedback?.passed_structure_preservation_contract
          ? {
              passed_structure_preservation_contract: validationFeedback.passed_structure_preservation_contract,
            }
          : {}),
      },
    };
  }

  return { nativeShapePlanOutputContractForAttempt };
}
