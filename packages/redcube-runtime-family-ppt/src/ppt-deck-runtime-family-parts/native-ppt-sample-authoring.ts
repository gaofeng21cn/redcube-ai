type JsonRecord = Record<string, any>;

const SAMPLE_SAFE_ZONE_BLUEPRINTS = 'sample_status_proof_board zones title_zone:title:0.85,0.45,14.3,1.2,0.15|claim_zone:claim:0.85,1.72,14.3,1.1,0.15|status_zone:status:0.85,3.05,14.3,2.45,0.15|proof_zone:proof:0.85,5.95,14.3,1.55,0.15 shapes title:title_zone:0.95,0.58,13.6,0.92|core_sentence:claim_zone:0.95,1.9,13.6,0.78|input_hub_label:status_zone:1.18,3.28,4.8,0.58|proof_text:proof_zone:1.22,6.36,12.85,0.62 check zone_safe_bounds title<=0.95 claim<=0.80 card_text>=3.94x0.98 pad>=0.15 connector_thin>=0.03 connector_text_gap>=0.12';

export function nativePptSampleSafeZoneBlueprints(): JsonRecord {
  return { tuple_contract: SAMPLE_SAFE_ZONE_BLUEPRINTS };
}

interface NativePptSampleAuthoringDeps {
  aiFirstEditingContract: JsonRecord;
  safeArray(value: unknown): JsonRecord[];
  safeText(value: unknown, fallback?: string): string;
}

export function nativePptSampleLayoutProfile(contract: JsonRecord): JsonRecord | null {
  const constraints = contract?.delivery_request?.constraints && typeof contract.delivery_request.constraints === 'object'
    ? contract.delivery_request.constraints
    : {};
  if (constraints.native_visual_sample !== true) return null;
  const expectedSlideCount = Number(constraints.expected_slide_count || constraints.exact_slides || constraints.max_slides || 1);
  return {
    profile_id: 'native_ppt_one_slide_visual_sample_layout_v1',
    required: true,
    source: 'delivery_request.constraints.native_visual_sample',
    expected_slide_count: Number.isFinite(expectedSlideCount) && expectedSlideCount > 0 ? Math.floor(expectedSlideCount) : 1,
    layout_authority: 'llm_agent',
    materializer_authority: 'execute_validate_export_only',
    allowed_sample_archetypes: ['sample_status_proof_board', 'sample_decision_proof_split'],
    forbidden_archetypes: [
      'executive_status_board',
      'decision_dashboard',
      'professional_system_map',
      'evidence_timeline',
      'risk_control_matrix',
    ],
    capacity_rules: {
      max_audience_text_shapes: 8,
      max_bottom_text_blocks: 1,
      max_status_items: 3,
      evidence_text_max_cjk_chars: 28,
      title_font_pt_range: [34, 38],
      min_text_panel_safe_inset_in: 0.15,
      exact_status_card_count: 3,
      status_card_width_in_min: 4.0,
      status_card_height_in_min: 1.35,
      status_card_text_box_height_in_min: 0.96,
      status_card_point_text_max_estimated_lines: 2,
      status_card_point_text_max_cjk_chars: 22,
      input_hub_label_min_cjk_chars: 12,
      input_hub_label_max_cjk_chars: 16,
      input_hub_label_width_in_min: 4.8,
      input_hub_label_height_in_min: 0.54,
      connector_thickness_in_min: 0.03,
      connector_text_clearance_in_min: 0.12,
      connector_lane_must_stay_inside_declared_zone: true,
      proof_zone_visible_text_blocks_max: 1,
      boundary_note_visible_text_allowed: false,
      no_separate_takeaway_panel_for_status_board: true,
    },
    safe_zone_blueprints: { tuple_contract: SAMPLE_SAFE_ZONE_BLUEPRINTS },
    required_design_decision: 'Pick one capacity-safe sample archetype before coordinates and make the causal path visible. For sample_status_proof_board, use title + claim + one input_hub feeding exactly three large equal-height status cards + short flow/merge connectors into one proof band; each status card must be at least 4.0in wide and 1.35in high, and its point_text must sit fully inside the card safe area. Keep each card point_text concise enough for at most two estimated 18pt lines, normally 12-22 meaningful CJK/Latin chars, with text box height at least 0.96in; if a sentence needs more, rewrite it shorter before coordinates. The input_hub label is visible content, so make it a compact 12-16 meaningful-char phrase such as 同一材料同步进入三路验证, not a 7-character label; reserve at least 4.8in width and 0.54in height. layout_intent.non_text_visual must explicitly state the first-glance path as shared input -> three route cards -> proof band. Every flow_connector or merge_connector must sit completely inside its declared zone, have both bounds dimensions >= 0.03in, and keep at least 0.12in clearance from readable text: keep split and merge connectors inside status_zone lanes above/between cards, unless the connector is fully inside the top of proof_zone. The proof band may contain only one compact evidence sentence; merge the takeaway into the claim or proof sentence and do not place boundary_note/scope text on the visible slide. For sample_decision_proof_split, use title + claim + left decision panel + right proof stack + visible decision/proof rail + one bottom takeaway band. Do not combine status cards, evidence band, evidence axis, boundary notes, and a separate takeaway panel on the same one-slide sample.',
    archetype_contracts: [
      {
        archetype_id: 'sample_status_proof_board',
        required_zones: ['title_zone', 'claim_zone', 'status_zone', 'proof_zone'],
        required_role_groups: ['title_text', 'core_claim_text', 'content_container', 'audience_body_text', 'structural_visual', 'evidence_or_metric_text'],
        required_flow_roles: ['input_hub', 'flow_connector'],
        exact_content_slots: {
          status_zone: {
            content_panel_count: 3,
            point_text_count: 3,
            content_panel_width_in_min: 4.0,
            content_panel_height_in_min: 1.35,
            point_text_box_height_in_min: 0.96,
            point_text_max_estimated_lines: 2,
            point_text_max_cjk_chars: 22,
            input_hub_label_min_cjk_chars: 12,
            input_hub_label_max_cjk_chars: 16,
            input_hub_label_width_in_min: 4.8,
            input_hub_label_height_in_min: 0.54,
            connector_thickness_in_min: 0.03,
            connector_text_clearance_in_min: 0.12,
            connector_zone_rule: 'flow_connector and merge_connector must be fully inside the declared status_zone or proof_zone safe bounds; prefer keeping split and merge connectors inside status_zone above the proof band, and never draw connectors in the unclaimed gutter between zones',
          },
          proof_zone: {
            text_block_count_max: 1,
            boundary_note_allowed: false,
          },
        },
        zone_floor_in: {
          title_zone: 1.15,
          claim_zone: 1.05,
          status_zone: 2.10,
          proof_zone: 1.35,
        },
        prohibited: ['takeaway_zone', 'takeaway_panel', 'separate bottom takeaway text', 'artifact inventory receipts', 'connector-heavy flow map'],
      },
      {
        archetype_id: 'sample_decision_proof_split',
        required_zones: ['title_zone', 'claim_zone', 'decision_zone', 'proof_zone', 'takeaway_zone'],
        required_role_groups: ['title_text', 'core_claim_text', 'content_container', 'audience_body_text', 'structural_visual', 'evidence_or_metric_text', 'takeaway_text'],
        required_flow_roles: ['decision_rail'],
        zone_floor_in: {
          title_zone: 1.15,
          claim_zone: 1.05,
          decision_zone: 3.00,
          proof_zone: 3.00,
          takeaway_zone: 1.20,
        },
        prohibited: ['three equal status cards plus separate proof and takeaway bands', 'artifact inventory receipts', 'connector-heavy flow map'],
      },
    ],
  };
}

export function createNativePptSampleAuthoringParts({
  aiFirstEditingContract,
  safeArray,
  safeText,
}: NativePptSampleAuthoringDeps) {
  function compactNumber(value: unknown): number | null {
    const parsed = Number(value || 0);
    return Number.isFinite(parsed) && parsed > 0 ? Number(parsed.toFixed(3)) : null;
  }

  function compactText(value: unknown, limit = 280): string {
    const text = safeText(value);
    return text.length > limit ? `${text.slice(0, limit)}...` : text;
  }

  function compactBounds(value: unknown): JsonRecord | null {
    if (!value || typeof value !== 'object') return null;
    const bounds = value as JsonRecord;
    const compact = {
      left_in: compactNumber(bounds.left_in),
      top_in: compactNumber(bounds.top_in),
      width_in: compactNumber(bounds.width_in),
      height_in: compactNumber(bounds.height_in),
    };
    return Object.values(compact).some((item) => item != null) ? compact : null;
  }

  function compactFix(fix: JsonRecord): JsonRecord {
    return Object.fromEntries(Object.entries({
      slide_id: safeText(fix?.slide_id),
      shape_id: safeText(fix?.shape_id),
      other_shape_id: safeText(fix?.other_shape_id),
      panel_shape_id: safeText(fix?.panel_shape_id),
      reason: safeText(fix?.reason),
      role: safeText(fix?.role),
      actual_quality_role: safeText(fix?.actual_quality_role || fix?.actual),
      required_quality_role: safeText(fix?.required_quality_role),
      layout_zone_id: safeText(fix?.layout_zone_id || fix?.zone_id),
      selected_archetype: safeText(fix?.selected_archetype || fix?.archetype_id),
      current_height_in: compactNumber(fix?.current_height_in || fix?.height_in),
      current_width_in: compactNumber(fix?.current_width_in || fix?.width_in),
      minimum_height_in: compactNumber(fix?.minimum_height_in),
      minimum_width_in: compactNumber(fix?.minimum_width_in),
      required_height_in: compactNumber(fix?.required_height_in),
      required_width_in: compactNumber(fix?.required_width_in),
      content_panel_count: compactNumber(fix?.content_panel_count),
      point_text_count: compactNumber(fix?.point_text_count),
      expected_count: compactNumber(fix?.expected_count),
      excess_point_text_count: compactNumber(fix?.excess_point_text_count),
      required_font_size: compactNumber(fix?.required_font_size),
      required_text_char_count: compactNumber(fix?.required_text_char_count),
      required_gap_in: compactNumber(fix?.required_gap_in),
      required_inset_in: compactNumber(fix?.required_inset_in),
      required_inside_zone: fix?.required_inside_zone === true || null,
      required_zone_inset_in: compactNumber(fix?.required_zone_inset_in),
      required_connector_thickness_in: compactNumber(fix?.required_connector_thickness_in),
      zone_bounds: compactBounds(fix?.zone_bounds),
      zone_safe_bounds: compactBounds(fix?.zone_safe_bounds),
      panel_bounds: compactBounds(fix?.panel_bounds),
      panel_safe_bounds: compactBounds(fix?.panel_safe_bounds),
      shape_bounds: compactBounds(fix?.shape_bounds),
      required_delta_in: fix?.required_delta_in && typeof fix.required_delta_in === 'object'
        ? fix.required_delta_in
        : null,
      geometry_repair_instruction: compactText(fix?.geometry_repair_instruction),
      text_repair_instruction: compactText(fix?.text_repair_instruction),
      repair_instruction: compactText(fix?.repair_instruction),
    }).filter(([, value]) => (
      value != null
      && value !== ''
      && (!Array.isArray(value) || value.length > 0)
    )));
  }

  function compactStructuralFix(fix: JsonRecord): JsonRecord {
    return Object.fromEntries(Object.entries({
      ...compactFix(fix),
      scope: safeText(fix?.scope, 'slide'),
      missing_fields: safeArray(fix?.missing_fields).map((field) => safeText(field)).filter(Boolean).slice(0, 8),
      required_fields: safeArray(fix?.required_fields).map((field) => safeText(field)).filter(Boolean).slice(0, 12),
      invalid_template_binding_fields: safeArray(fix?.invalid_template_binding_fields)
        .map((field) => safeText(field))
        .filter(Boolean)
        .slice(0, 8),
      invalid_template_zones: safeArray(fix?.invalid_template_zones).slice(0, 4),
      invalid_shapes: safeArray(fix?.invalid_shapes).slice(0, 6),
      grammar_failures: safeArray(fix?.grammar_failures).slice(0, 4),
      required_archetype_ids: safeArray(fix?.required_archetype_ids).map((item) => safeText(item)).filter(Boolean),
      forbidden_catalog_archetypes: safeArray(fix?.forbidden_catalog_archetypes).map((item) => safeText(item)).filter(Boolean),
    }).filter(([, value]) => (
      value != null
      && value !== ''
      && (!Array.isArray(value) || value.length > 0)
    )));
  }

  function compactValidator(validationFeedback: JsonRecord | null | undefined): JsonRecord | null {
    const validator = validationFeedback?.validator;
    if (!validator || typeof validator !== 'object') return null;
    const slideFailures = safeArray(validator.failures)
      .map((slide) => {
        const failures = safeArray(slide?.failures).map(compactFix).filter((fix) => safeText(fix.reason));
        return {
          slide_id: safeText(slide?.slide_id),
          failures,
        };
      })
      .filter((slide) => slide.slide_id || slide.failures.length > 0);
    return {
      ok: validator?.ok === true,
      stage: safeText(validator?.stage),
      failure_count: Number(validator?.failure_count || slideFailures.reduce((sum, slide) => sum + slide.failures.length, 0)) || 0,
      slide_count: Number(validator?.slide_count || 0) || null,
      failures: slideFailures,
      full_validator_payload_omitted: true,
    };
  }

  function compactNativeSampleValidationFeedback(validationFeedback: JsonRecord | null | undefined): JsonRecord | null {
    if (!validationFeedback) return null;
    return {
      feedback_kind: 'native_pptx_compact_sample_retry_feedback_v1',
      previous_attempt: Number(validationFeedback?.previous_attempt || 0) || null,
      repair_request: 'Return a full editable_shape_plan and fix the listed same-shape failures; preserve accepted design_spec_lock, deck_layout_rhythm_plan, template_layout_grammar, template_layout_binding, zones, layout_intent, and layout_zone_id bindings unless a listed fix explicitly requires a geometry redesign.',
      validator: compactValidator(validationFeedback),
      required_shape_fixes: safeArray(validationFeedback?.required_shape_fixes).map(compactFix),
      required_structural_fixes: safeArray(validationFeedback?.required_structural_fixes).map(compactStructuralFix),
      global_shape_class_fixes: safeArray(validationFeedback?.global_shape_class_fixes)
        .map((fix) => ({
          rule_id: safeText(fix?.rule_id),
          applies_to_roles: safeArray(fix?.applies_to_roles).map((role) => safeText(role)).filter(Boolean),
          repair_instruction: compactText(fix?.repair_instruction),
          required_height_in_min: compactNumber(fix?.required_height_in_min),
          required_width_in_min: compactNumber(fix?.required_width_in_min),
          required_inset_in: compactNumber(fix?.required_inset_in),
          required_gap_in: compactNumber(fix?.required_gap_in),
          required_inside_zone: fix?.required_inside_zone === true || null,
        }))
        .filter((fix) => safeText(fix.rule_id)),
      passed_structure_preservation_contract: validationFeedback?.passed_structure_preservation_contract
        ? {
            contract_kind: safeText(validationFeedback.passed_structure_preservation_contract.contract_kind),
            required: validationFeedback.passed_structure_preservation_contract.required === true,
            preserve_fields: safeArray(validationFeedback.passed_structure_preservation_contract.preserve_fields)
              .map((field) => safeText(field))
              .filter(Boolean),
            page_number_missing_rule: safeText(validationFeedback.passed_structure_preservation_contract.page_number_missing_rule),
          }
        : null,
      attempt_artifact_refs: safeArray(validationFeedback?.attempt_artifact_refs).map((ref) => safeText(ref)).filter(Boolean),
      retry_contract_ref: 'output_contract.native_shape_plan_validation_feedback_contract',
      full_feedback_payload_omitted: true,
    };
  }

  function compactNativeSampleProfile(profile: JsonRecord | null): JsonRecord | null {
    if (!profile) return null;
    return {
      profile_id: safeText(profile?.profile_id),
      required: profile?.required === true,
      source: safeText(profile?.source),
      expected_slide_count: Number(profile?.expected_slide_count || 1),
      layout_authority: safeText(profile?.layout_authority, 'llm_agent'),
      materializer_authority: safeText(profile?.materializer_authority, 'execute_validate_export_only'),
      allowed_sample_archetypes: safeArray(profile?.allowed_sample_archetypes).map((item) => safeText(item)).filter(Boolean),
      forbidden_archetypes: safeArray(profile?.forbidden_archetypes).map((item) => safeText(item)).filter(Boolean),
      capacity_rules: {
        max_audience_text_shapes: Number(profile?.capacity_rules?.max_audience_text_shapes || 8),
        max_status_items: Number(profile?.capacity_rules?.max_status_items || 3),
        proof_zone_visible_text_blocks_max: Number(profile?.capacity_rules?.proof_zone_visible_text_blocks_max || 1),
        min_text_panel_safe_inset_in: Number(profile?.capacity_rules?.min_text_panel_safe_inset_in || 0.15),
        exact_status_card_count: Number(profile?.capacity_rules?.exact_status_card_count || 3),
        status_card_width_in_min: Number(profile?.capacity_rules?.status_card_width_in_min || 4.0),
        status_card_height_in_min: Number(profile?.capacity_rules?.status_card_height_in_min || 1.35),
        status_card_text_box_height_in_min: Number(profile?.capacity_rules?.status_card_text_box_height_in_min || 0.96),
        status_card_point_text_max_estimated_lines: Number(profile?.capacity_rules?.status_card_point_text_max_estimated_lines || 2),
        status_card_point_text_max_cjk_chars: Number(profile?.capacity_rules?.status_card_point_text_max_cjk_chars || 22),
      },
      safe_zone_blueprints_ref: profile?.safe_zone_blueprints
        ? 'output_contract.editable_shape_plan.template_layout_grammar.safe_zone_blueprints'
        : null,
      contract_ref: 'output_contract.editable_shape_plan.template_layout_grammar',
    };
  }

  function compactNativeTargetSlides(blueprint: JsonRecord, unitRepairScope: JsonRecord): JsonRecord[] {
    const slides = safeArray(blueprint?.slides);
    const targetSlideIds = new Set(safeArray(unitRepairScope?.target_slide_ids).map((slide) => safeText(slide)).filter(Boolean));
    const selected = slides.filter((slide) => targetSlideIds.size === 0 || targetSlideIds.has(safeText(slide?.slide_id)));
    return (selected.length > 0 ? selected : slides.slice(0, 1))
      .slice(0, 1)
      .map((slide, index) => ({
        slide_id: safeText(slide?.slide_id, `S${String(index + 1).padStart(2, '0')}`),
        title: safeText(slide?.title),
        core_sentence: safeText(slide?.core_sentence),
        page_core_content: safeArray(slide?.page_core_content).slice(0, 3),
        evidence_and_sources: safeArray(slide?.evidence_and_sources).slice(0, 3),
        visual_presentation: {
          layout_family: safeText(slide?.visual_presentation?.layout_family || slide?.layout_family),
          visual_role: safeText(slide?.visual_presentation?.visual_role),
        },
      }));
  }

  function compactNativeSampleContext({
    contract,
    baseAuthoringContext,
    blueprintArtifact,
    visualArtifact,
    unitRepairScope,
    repairFeedback,
    validationFeedback,
    attemptIndex,
  }: JsonRecord): JsonRecord {
    const sampleProfile = nativePptSampleLayoutProfile(contract);
    const blueprint = blueprintArtifact?.slide_blueprint || {};
    const visualDirection = visualArtifact?.visual_direction || {};
    const targetSlides = compactNativeTargetSlides(blueprint, unitRepairScope);
    return {
      native_ppt_authoring_mode: 'native_visual_sample_compact',
      title: safeText(baseAuthoringContext?.title || contract?.title),
      goal: safeText(baseAuthoringContext?.goal || contract?.goal || contract?.delivery_request?.goal),
      ai_first_editing_contract: aiFirstEditingContract,
      native_ppt_sample_layout_profile: compactNativeSampleProfile(sampleProfile),
      unit_repair_scope: {
        ...unitRepairScope,
        target_slide_ids: targetSlides.map((slide) => safeText(slide?.slide_id)).filter(Boolean),
      },
      blueprint: {
        slide_count: targetSlides.length,
        expected_slide_count: targetSlides.length,
        slides: targetSlides,
      },
      visual_direction: {
        design_thesis: safeText(visualDirection?.design_thesis || visualDirection?.thesis || visualDirection?.visual_thesis),
        audience_takeaway: safeText(visualDirection?.audience_takeaway || visualDirection?.takeaway),
        style_keywords: safeArray(visualDirection?.style_keywords || visualDirection?.visual_keywords).slice(0, 6),
        palette: visualDirection?.palette || visualDirection?.color_palette || null,
        typography: visualDirection?.typography || null,
        layout_principles: safeArray(visualDirection?.layout_principles || visualDirection?.composition_principles).slice(0, 5),
      },
      repair_feedback: safeArray(repairFeedback),
      native_shape_plan_validation_feedback: compactNativeSampleValidationFeedback(validationFeedback),
      native_shape_plan_attempt_index: attemptIndex,
    };
  }

  return {
    compactNativeSampleContext,
    compactNativeSampleValidationFeedback,
  };
}
