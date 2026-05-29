import path from 'node:path';

type JsonRecord = Record<string, any>;
type NativePptRoute = 'author_pptx_native' | 'repair_pptx_native';

const CANONICAL_BOUNDS_SCHEMA = Object.freeze({
  required_object: '{ left_in, top_in, width_in, height_in }',
  canonical_keys: ['left_in', 'top_in', 'width_in', 'height_in'],
  forbidden_alias_keys: ['x', 'y', 'w', 'h', 'left', 'top', 'right', 'bottom', 'width', 'height'],
  instruction: 'Use only bounds.left_in, bounds.top_in, bounds.width_in, and bounds.height_in for every zone and shape. Do not use x/y/w/h, left/top/right/bottom, or width/height aliases.',
});

const ALLOWED_QUALITY_ROLES = ['content', 'decorative', 'auxiliary', 'structural'];

interface NativePptPlanPreflightDeps {
  nativeShapePlanOutputContract(route: NativePptRoute): JsonRecord;
  safeArray(value: unknown): JsonRecord[];
  safeText(value: unknown, fallback?: string): string;
}

export function createNativePptPlanPreflightParts({
  nativeShapePlanOutputContract,
  safeArray,
  safeText,
}: NativePptPlanPreflightDeps) {
  function nativePreflightRequiredQualityRole(failure: JsonRecord): string {
    if (safeText(failure?.reason) !== 'ai_first_quality_role_missing_or_invalid') return '';
    const explicit = safeText(failure?.required_quality_role).toLowerCase();
    if (ALLOWED_QUALITY_ROLES.includes(explicit)) return explicit;
    const role = safeText(failure?.role).toLowerCase();
    const kind = safeText(failure?.kind).toLowerCase();
    if (['page_number', 'page_no', 'page', 'footer', 'meta', 'cover_meta', 'speaker_identity', 'source_note', 'date', 'caption'].includes(role)) {
      return 'auxiliary';
    }
    if (['title', 'subtitle', 'core_sentence', 'lead', 'intro', 'thesis', 'body', 'body_sentence', 'point_text', 'route_label', 'gate_card', 'panel_title', 'takeaway', 'evidence_item', 'metric'].includes(role)) {
      return 'content';
    }
    if (
      ['line', 'connector', 'oval', 'circle'].includes(kind)
      || /axis|band|bridge|connector|flow|gate|hub|ladder|map|metric|rail|stack|table|timeline|track/.test(role)
    ) {
      return 'structural';
    }
    return 'decorative';
  }

  function structuralFeedbackFixes(validationFeedback: JsonRecord | null | undefined): JsonRecord[] {
    return safeArray(validationFeedback?.required_structural_fixes)
      .map((fix) => ({
        scope: safeText(fix?.scope, 'slide'),
        slide_id: safeText(fix?.slide_id),
        reason: safeText(fix?.reason),
        missing_fields: safeArray(fix?.missing_fields).map((field) => safeText(field)).filter(Boolean),
        required_fields: safeArray(fix?.required_fields).map((field) => safeText(field)).filter(Boolean),
        invalid_template_binding_fields: safeArray(fix?.invalid_template_binding_fields)
          .map((field) => safeText(field))
          .filter(Boolean),
        invalid_template_zones: safeArray(fix?.invalid_template_zones),
        invalid_shapes: safeArray(fix?.invalid_shapes),
        selected_archetype: safeText(fix?.selected_archetype || fix?.archetype_id),
        zone_id: safeText(fix?.zone_id || fix?.layout_zone_id),
        current_height_in: Number(fix?.current_height_in || fix?.height_in || 0) || null,
        minimum_height_in: Number(fix?.minimum_height_in || 0) || null,
        required_height_in: Number(fix?.required_height_in || 0) || null,
        current_width_in: Number(fix?.current_width_in || fix?.width_in || 0) || null,
        minimum_width_in: Number(fix?.minimum_width_in || 0) || null,
        required_width_in: Number(fix?.required_width_in || 0) || null,
        content_panel_count: Number(fix?.content_panel_count || 0) || null,
        point_text_count: Number(fix?.point_text_count || 0) || null,
        expected_count: Number(fix?.expected_count || 0) || null,
        excess_point_text_count: Number(fix?.excess_point_text_count || 0) || null,
        repair_instruction: safeText(fix?.repair_instruction),
      }))
      .filter((fix) => fix.reason && (fix.scope === 'deck' || fix.slide_id));
  }

  function validationFeedbackFixes(validationFeedback: JsonRecord | null | undefined): JsonRecord[] {
    return safeArray(validationFeedback?.required_shape_fixes)
      .map((fix) => {
        const requiredHeight = Number(fix?.required_height_in || 0);
        const requiredFontSize = Number(fix?.required_font_size || 0);
        const requiredTextCharCount = Number(fix?.required_text_char_count || fix?.threshold || 0);
        const requiredGap = Number(fix?.required_gap_in || 0);
        const requiredInset = Number(fix?.required_inset_in || 0);
        const requiredZoneInset = Number(fix?.required_zone_inset_in || 0);
        const requiredConnectorThickness = Number(fix?.required_connector_thickness_in || 0);
        const requiredWidth = Number(fix?.required_width_in || 0);
        const requiredQualityRole = safeText(fix?.required_quality_role).toLowerCase();
        const panelShapeId = safeText(fix?.panel_shape_id);
        const zoneBounds = fix?.zone_bounds && typeof fix.zone_bounds === 'object' ? fix.zone_bounds : null;
        const zoneSafeBounds = fix?.zone_safe_bounds && typeof fix.zone_safe_bounds === 'object' ? fix.zone_safe_bounds : null;
        const panelBounds = fix?.panel_bounds && typeof fix.panel_bounds === 'object' ? fix.panel_bounds : null;
        const panelSafeBounds = fix?.panel_safe_bounds && typeof fix.panel_safe_bounds === 'object' ? fix.panel_safe_bounds : null;
        const shapeBounds = fix?.shape_bounds && typeof fix.shape_bounds === 'object' ? fix.shape_bounds : null;
        const requiredDelta = fix?.required_delta_in && typeof fix.required_delta_in === 'object' ? fix.required_delta_in : null;
        return {
          slide_id: safeText(fix?.slide_id),
          shape_id: safeText(fix?.shape_id),
          other_shape_id: safeText(fix?.other_shape_id || panelShapeId),
          panel_shape_id: panelShapeId || null,
          reason: safeText(fix?.reason),
          role: safeText(fix?.role),
          actual_quality_role: safeText(fix?.actual_quality_role || fix?.actual),
          required_quality_role: ALLOWED_QUALITY_ROLES.includes(requiredQualityRole) ? requiredQualityRole : '',
          allowed_quality_roles: safeArray(fix?.allowed_quality_roles || fix?.allowed)
            .map((role) => safeText(role))
            .filter(Boolean),
          layout_zone_id: safeText(fix?.layout_zone_id),
          font_size: Number(fix?.font_size || 0) || null,
          current_height_in: Number(fix?.current_height_in || 0) || null,
          current_width_in: Number(fix?.current_width_in || fix?.width_in || 0) || null,
          minimum_height_in: Number(fix?.minimum_height_in || 0) || null,
          suggested_height_in: Number(fix?.suggested_height_in || 0) || null,
          required_height_in: Number.isFinite(requiredHeight) && requiredHeight > 0 ? requiredHeight : null,
          required_width_in: Number.isFinite(requiredWidth) && requiredWidth > 0 ? requiredWidth : null,
          required_font_size: Number.isFinite(requiredFontSize) && requiredFontSize > 0 ? requiredFontSize : null,
          current_text_char_count: Number(fix?.current_text_char_count || fix?.text_char_count || 0) || null,
          required_text_char_count: Number.isFinite(requiredTextCharCount) && requiredTextCharCount > 0
            ? requiredTextCharCount
            : null,
          overlap_area_in2: Number(fix?.overlap_area_in2 || 0) || null,
          required_gap_in: Number.isFinite(requiredGap) && requiredGap > 0 ? requiredGap : null,
          required_inset_in: Number.isFinite(requiredInset) && requiredInset > 0 ? requiredInset : null,
          required_inside_zone: fix?.required_inside_zone === true || null,
          required_zone_inset_in: Number.isFinite(requiredZoneInset) && requiredZoneInset > 0 ? requiredZoneInset : null,
          zone_bounds: zoneBounds,
          zone_safe_bounds: zoneSafeBounds,
          panel_bounds: panelBounds,
          panel_safe_bounds: panelSafeBounds,
          shape_bounds: shapeBounds,
          required_delta_in: requiredDelta,
          geometry_repair_instruction: safeText(fix?.geometry_repair_instruction),
          required_connector_thickness_in: Number.isFinite(requiredConnectorThickness) && requiredConnectorThickness > 0
            ? requiredConnectorThickness
            : null,
          text_repair_instruction: safeText(fix?.text_repair_instruction),
        };
      })
      .filter((fix) => (
        fix.shape_id
        && (
          Number(fix.required_height_in || 0) > 0
          || Number(fix.required_width_in || 0) > 0
          || Number(fix.required_font_size || 0) > 0
          || Number(fix.required_text_char_count || 0) > 0
          || Boolean(fix.text_repair_instruction)
          || Number(fix.required_gap_in || 0) > 0
          || Number(fix.required_inset_in || 0) > 0
          || Boolean(fix.required_inside_zone)
          || Number(fix.required_zone_inset_in || 0) > 0
          || Boolean(fix.zone_bounds)
          || Boolean(fix.zone_safe_bounds)
          || Boolean(fix.panel_bounds)
          || Boolean(fix.panel_safe_bounds)
          || Boolean(fix.geometry_repair_instruction)
          || Boolean(fix.required_delta_in)
          || Number(fix.required_connector_thickness_in || 0) > 0
          || Boolean(fix.required_quality_role)
        )
      ));
  }

  function nativePreflightRequiredHeight(failure: JsonRecord): number | null {
    const suggested = Number(failure?.suggested_height_in || 0);
    const minimum = Number(failure?.minimum_height_in || 0);
    const base = Number.isFinite(suggested) && suggested > 0
      ? suggested
      : Number.isFinite(minimum) && minimum > 0 ? minimum : 0;
    if (base <= 0) return null;
    const role = safeText(failure?.role);
    const fontSize = Number(failure?.font_size || 0);
    const roleFloor = role === 'title'
      ? 1.65
      : fontSize >= 20 && ['core_sentence', 'lead', 'intro', 'thesis', 'takeaway'].includes(role)
        ? 1.25
        : fontSize >= 18 ? 0.96 : 0;
    return Number((Math.max(base + 0.25, roleFloor)).toFixed(3));
  }

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

  function nativeAttemptArtifactFile(baseFile: string, attemptIndex: number, suffix: string): string {
    const extension = path.extname(baseFile);
    const stem = path.join(path.dirname(baseFile), path.basename(baseFile, extension));
    return `${stem}-attempt-${String(attemptIndex).padStart(2, '0')}${suffix}${extension || '.json'}`;
  }

  function nativePreflightRequiredFontSize(failure: JsonRecord): number | null {
    const reason = safeText(failure?.reason);
    if (reason === 'ai_first_body_text_too_small') return 18;
    if (reason === 'ai_first_point_index_too_small') return 16;
    return null;
  }

  function nativePreflightRequiredTextCharCount(failure: JsonRecord): number | null {
    return safeText(failure?.reason) === 'ai_first_content_depth_too_low' ? 12 : null;
  }

  function nativePreflightRequiredWidth(failure: JsonRecord): number | null {
    const reason = safeText(failure?.reason);
    if (reason !== 'ai_first_route_label_unbalanced_wrap') return null;
    const minimum = Number(failure?.minimum_width_in || 0);
    return Number.isFinite(minimum) && minimum > 0 ? minimum : 4.2;
  }

  function nativePreflightRequiredZoneInset(failure: JsonRecord): number | null {
    if (safeText(failure?.reason) !== 'ai_first_shape_outside_template_layout_zone') return null;
    return 0.02;
  }

  function nativePreflightNormalizationStructuralFixes(normalizationFailures: JsonRecord[]): JsonRecord[] {
    return safeArray(normalizationFailures)
      .flatMap((failure) => {
        const reason = safeText(failure?.reason);
        if (reason === 'ai_first_design_spec_lock_missing') {
          const missingFields = safeArray(failure?.missing_fields)
            .map((field) => safeText(field))
            .filter(Boolean);
          return [{
            scope: 'deck',
            slide_id: '',
            reason,
            missing_fields: missingFields.length > 0
              ? missingFields.map((field) => `editable_shape_plan.design_spec_lock.${field}`)
              : ['editable_shape_plan.design_spec_lock'],
            required_fields: [
              'design_spec_lock.spec_id',
              'design_spec_lock.owner=llm_agent',
              'design_spec_lock.motif',
              'design_spec_lock.palette.background_or_canvas+ink+accent',
              'design_spec_lock.typography.title_pt_min>=40 for native_visual_sample',
              'design_spec_lock.typography.body_pt_min>=18',
              'design_spec_lock.grid.edge_margin_in_min>=0.6',
              'design_spec_lock.grid.inter_block_gap_in_min>=0.32',
              'design_spec_lock.layout_rhythm',
              'design_spec_lock.professional_design_brief',
              'design_spec_lock.borrowed_principles includes ppt_master_style_spec_lock, template_layout_grammar, template_profile, semantic_layout_selection, reference_deck_analysis, per_page_visual_plan, layout_rhythm, rendered_quality_gate',
              'design_spec_lock.qa_gates includes bounds, font_floor, text_fit, structural_visual, layout_variety',
            ],
            repair_instruction: missingFields.length > 0
              ? `Repair editable_shape_plan.design_spec_lock without helper inference. Add or correct these AI-authored fields: ${missingFields.join(', ')}.`
              : 'Repair editable_shape_plan.design_spec_lock without helper inference. It must include the complete AI-authored design system before shape coordinates.',
          }];
        }
        if (reason === 'ai_first_template_layout_grammar_missing') {
          const grammarFailures = safeArray(failure?.grammar_failures);
          const missingFields = grammarFailures
            .map((item) => safeText(item?.reason))
            .filter(Boolean)
            .map((item) => `editable_shape_plan.template_layout_grammar.${item}`);
          return [{
            scope: 'deck',
            slide_id: '',
            reason,
            missing_fields: missingFields.length > 0
              ? missingFields
              : ['editable_shape_plan.template_layout_grammar'],
            required_fields: [
              'template_layout_grammar.owner=llm_agent',
              'template_layout_grammar.required=true',
              'template_layout_grammar.materializer_role=execute_selected_archetype_zones_only',
              'template_layout_grammar.helper_template_layout_allowed=false',
              'template_layout_grammar.reference_discipline.template_profile_required=true',
              'template_layout_grammar.reference_discipline.semantic_layout_selection_required=true',
              'template_layout_grammar.reference_discipline.placeholder_capacity_required=true',
              'template_layout_grammar.reference_discipline.reference_deck_analysis_required=true',
              'template_layout_grammar.reference_discipline.action_title_required=true',
              'template_layout_grammar.reference_discipline.source_projects includes ppt-master, agent-slides, PPTAgent, pptx-from-layouts-skill, officecli-pptx',
              'template_layout_grammar.archetype_catalog>=3 or compact sample mode with exactly the two sample archetypes',
              'template_layout_grammar.archetype_catalog[].use_when',
              'template_layout_grammar.archetype_catalog[].layout_description',
              'template_layout_grammar.archetype_catalog[].required_zones',
              'template_layout_grammar.archetype_catalog[].content_schema.required_shape_roles',
              'template_layout_grammar.archetype_catalog[].content_schema.required_shape_role_groups',
            ],
            repair_instruction: 'Repair editable_shape_plan.template_layout_grammar as an AI-authored layout contract. For native_visual_sample_compact, include exactly sample_status_proof_board and sample_decision_proof_split with complete archetype contracts; otherwise provide at least three complete archetypes. Do not ask Python, officecli, or the materializer to infer template intelligence.',
            grammar_failures: grammarFailures,
          }];
        }
        return [];
      });
  }

  function nativePreflightStructuralFixesFromFailures(failures: JsonRecord[]): JsonRecord[] {
    const structuralFixes: JsonRecord[] = [];
    for (const failure of failures) {
      const reason = safeText(failure?.reason);
      const slideId = safeText(failure?.slide_id);
      if (!slideId) continue;
      if (reason === 'ai_first_page_number_missing') {
        structuralFixes.push({
          scope: 'slide',
          slide_id: slideId,
          reason,
          missing_fields: ['native_shapes[role=page_number]'],
          required_fields: [
            'native_shapes[].role=page_number',
            'native_shapes[].quality_role=auxiliary',
            'native_shapes[].editable_text',
            'native_shapes[].bounds',
          ],
          repair_instruction: 'Add a small auxiliary page_number text box for this slide while preserving the already accepted design_spec_lock, deck_layout_rhythm_plan, template_layout_grammar, template_layout_binding, layout_intent, zones, and every existing layout_zone_id binding.',
        });
        continue;
      }
      if (reason === 'ai_first_visual_structure_missing') {
        structuralFixes.push({
          scope: 'slide',
          slide_id: slideId,
          reason,
          missing_fields: ['native_shapes[quality_role=structural]'],
          required_fields: [
            'layout_intent.non_text_visual describes a concrete structure',
            'native_shapes[].quality_role=structural',
            'native_shapes[].role includes flow_connector | proof_band | input_hub | gate_stack_panel | evidence_axis',
            'native_shapes[].kind in line | connector | oval | circle | rect | rounded_rect | panel',
            'structural shapes have visible fill or line styling and positive materializable bounds',
          ],
          repair_instruction: 'Redesign the page skeleton before moving text. Add at least one visible editable structural object such as a flow connector, proof band, input hub, gate stack, evidence axis, or decision rail. The structural object must be a real native shape with quality_role=structural, materializable kind, visible styling, positive bounds, and a role that explains the first-glance visual structure.',
        });
        continue;
      }
      if (reason === 'ai_first_structural_role_not_specific') {
        const shapeId = safeText(failure?.shape_id, '<missing-shape-id>');
        structuralFixes.push({
          scope: 'slide',
          slide_id: slideId,
          reason,
          missing_fields: [`native_shapes[${shapeId}].role`],
          required_fields: [
            'quality_role=structural shapes use a role with structural meaning',
            'role includes proof_band | decision_rail | input_hub | evidence_axis | gate_stack_panel | flow_connector | bridge_connector | metric_grid',
            'generic content_panel is quality_role=content unless it is renamed to a structural role and carries first-glance logic',
          ],
          repair_instruction: 'Rename or redesign the structural shape so its role carries the visual logic. A generic content_panel marked quality_role=structural is not accepted as a structural visual; use proof_band, decision_rail, input_hub, evidence_axis, gate_stack_panel, flow_connector, bridge_connector, or another structural role with visible geometry.',
        });
        continue;
      }
      if (reason === 'ai_first_visual_support_shape_count_too_low') {
        structuralFixes.push({
          scope: 'slide',
          slide_id: slideId,
          reason,
          missing_fields: ['native_shapes[quality_role=structural|decorative]'],
          required_fields: [
            'at least two visible non-text support shapes',
            'at least one support shape is structural, not filler decoration',
            'support shapes are editable native primitives with visible fill or line',
            'each structural support shape has layout_zone_id bound to a declared zone',
          ],
          repair_instruction: 'Add at least two visible editable non-text support shapes, with at least one structural shape that carries the slide logic. Use support shapes to make the layout read as a designed board, dashboard, timeline, or flow; do not add invisible accents or background panels just to raise the count.',
        });
        continue;
      }
      if (reason === 'ai_first_mechanical_card_template_detected') {
        structuralFixes.push({
          scope: 'slide',
          slide_id: slideId,
          reason,
          missing_fields: ['non_mechanical_composition_skeleton'],
          required_fields: [
            'layout_intent.composition_signature changes away from equal card grid',
            'template_layout_binding zones include a structural zone such as proof_zone | decision_zone | flow_zone | evidence_axis_zone',
            'native_shapes include structural visual objects that connect or prioritize content',
            'content panels are reduced, merged, or subordinated to the structural visual hierarchy',
          ],
          repair_instruction: 'Do not keep the same equal-card composition. Re-plan the slide as an executive board or decision dashboard with a first-glance hierarchy: one dominant claim/decision/proof area, fewer large content slots, and visible structural shapes such as a proof band, decision rail, input hub, evidence axis, or gate connector. A row of content_panel cards plus text is still invalid even if the text fits.',
        });
        continue;
      }
      if (
        [
          'ai_first_native_sample_archetype_not_capacity_safe',
          'ai_first_native_sample_forbidden_general_archetype',
          'ai_first_native_sample_status_board_overloaded_with_takeaway',
          'ai_first_native_sample_evidence_axis_text_collision_risk',
          'ai_first_native_sample_flow_structure_missing',
          'ai_first_native_sample_decision_rail_missing',
          'ai_first_native_sample_zone_too_short',
          'ai_first_native_sample_status_slots_not_exact',
          'ai_first_native_sample_status_card_quality_role_invalid',
          'ai_first_native_sample_status_card_too_small',
          'ai_first_native_sample_status_text_box_too_short',
          'ai_first_native_sample_status_text_wrap_too_deep',
          'ai_first_native_sample_status_text_too_long',
          'ai_first_native_sample_input_hub_missing', 'ai_first_native_sample_input_hub_too_small',
          'ai_first_native_sample_input_hub_too_short', 'ai_first_native_sample_input_hub_font_too_small',
          'ai_first_native_sample_input_hub_not_centered', 'ai_first_native_sample_input_hub_does_not_span_card_centers',
          'ai_first_native_sample_horizontal_bus_forbidden', 'ai_first_native_sample_connector_count_invalid',
          'ai_first_native_sample_connector_detached_from_hub', 'ai_first_native_sample_connector_card_alignment_invalid',
          'ai_first_native_sample_connector_direction_missing', 'ai_first_native_sample_connector_kind_invalid',
          'ai_first_native_sample_connector_not_vertical_drop',
          'ai_first_native_sample_too_many_proof_text_blocks',
          'ai_first_native_sample_boundary_note_forbidden',
        ].includes(reason)
      ) {
        const selectedArchetype = safeText(failure?.selected_archetype || failure?.archetype_id);
        const zoneId = safeText(failure?.zone_id || failure?.layout_zone_id);
        const currentHeight = Number(failure?.height_in || failure?.current_height_in || 0) || null;
        const minimumHeight = Number(failure?.minimum_height_in || 0) || null;
        const requiredHeight = nativePreflightRequiredHeight(failure);
        const contentPanelCount = Number(failure?.content_panel_count || 0) || null;
        const pointTextCount = Number(failure?.point_text_count || 0) || null;
        const expectedCount = Number(failure?.expected_count || 0) || null;
        const statusSlotInstruction = reason === 'ai_first_native_sample_status_slots_not_exact'
          ? 'For sample_status_proof_board, keep exactly three point_text shapes paired with the three content_panel cards. If there is an extra summary/cluster/overall conclusion point_text in status_zone, merge that sentence into the single proof_zone evidence_item or convert the shape to non-text structural proof_band; do not leave it as a fourth status card text.'
          : '';
        structuralFixes.push({
          scope: 'slide',
          slide_id: slideId,
          reason,
          missing_fields: ['native_visual_sample_capacity_safe_archetype'],
          selected_archetype: selectedArchetype,
          zone_id: zoneId,
          current_height_in: currentHeight,
          minimum_height_in: minimumHeight,
          required_height_in: requiredHeight,
          content_panel_count: contentPanelCount,
          point_text_count: pointTextCount,
          expected_count: expectedCount,
          excess_point_text_count: pointTextCount && expectedCount && pointTextCount > expectedCount
            ? pointTextCount - expectedCount
            : null,
          required_fields: [
            'template_layout_binding.selected_archetype=sample_status_proof_board | sample_decision_proof_split',
            'template_layout_grammar.archetype_catalog includes the selected sample archetype contract',
            'sample_status_proof_board uses only title_zone, claim_zone, status_zone, proof_zone',
          'sample_status_proof_board includes an input_hub and flow/merge connectors from shared input to route cards to proof band',
            'sample_status_proof_board input_hub is a dominant centered hub at least 10.4in wide and 0.82in high, spans all three route-card centers, and uses at least 22pt visible label text',
            'sample_status_proof_board route-card arrows are exactly three straight vertical kind=connector drops, start at the hub bottom, align to each route-card center, land on the card top edge, and carry explicit arrow direction such as tailEnd=triangle or line.end_arrow=true',
            'sample_status_proof_board has exactly three large status cards, each at least 4.0in wide and 1.35in high, with point_text fully inside the card safe area',
            'sample_status_proof_board content_panel card backgrounds are quality_role=content, while input_hub, connectors, and proof_band are quality_role=structural',
            'sample_status_proof_board has exactly three point_text shapes in status_zone, paired one-to-one with the three content_panel cards; any overall conclusion belongs in proof_zone evidence_item, not a fourth status point_text',
            'sample_status_proof_board card point_text is concise enough for at most two estimated 18pt lines, normally 22 meaningful CJK/Latin chars or fewer, with text box height at least 0.96in',
            'sample_status_proof_board proof_zone has one proof/evidence sentence only',
            'sample_decision_proof_split includes a visible decision_rail or proof_rail connecting decision, proof stack, and takeaway',
            'sample_status_proof_board has no takeaway_zone, takeaway_panel, separate bottom takeaway text, boundary_note visible text, or evidence axis plus evidence text in the same compact proof band',
          ],
          repair_instruction: [
            'Re-plan the one-slide native sample with a capacity-safe sample archetype and a visible causal path.',
            selectedArchetype ? `Preserve or intentionally replace selected_archetype=${selectedArchetype}; if preserving it, satisfy its zone capacity floors before emitting shapes.` : '',
            zoneId && requiredHeight ? `Resize template_layout_binding.zones[${zoneId}].bounds.height_in to at least ${requiredHeight}in and keep related shapes inside that resized zone.` : '',
            'Use sample_status_proof_board for title + claim + input hub + exactly three large equal-height status cards + flow/merge connectors + one proof band containing one compact evidence sentence, or sample_decision_proof_split for title + claim + left decision panel + right proof stack + decision/proof rail + one bottom takeaway band.',
            'Set the three route content_panel card backgrounds to quality_role=content. Do not mark generic content_panel cards as structural; structural belongs to input_hub, connector arrows, and proof_band.',
            'The status-board input_hub must be a large centered flow node spanning all three card centers; connector geometry must visibly split from that hub to all three card centers. Do not return a horizontal bus, three isolated short ticks, or a hub that only covers the middle/left route card.',
            'Use exactly three straight vertical kind=connector card landing arrows so officecli writes real PPT connector shapes; do not use kind=line, diagonal elbows, horizontal bus lines, or wide connector boxes for those arrows.',
            statusSlotInstruction,
            'Status card text must be rewritten as concise labels/short phrases before coordinates; do not force long explanatory sentences into narrow cards.',
            'Do not combine status cards, evidence band, evidence axis, boundary notes, and separate takeaway panel on one page.',
          ].filter(Boolean).join(' '),
        });
      }
    }
    return structuralFixes;
  }

  function nativePreflightRequiredConnectorThickness(failure: JsonRecord): number | null {
    const reason = safeText(failure?.reason);
    if (reason === 'ai_first_connector_thickness_too_small' || reason === 'ai_first_connector_bounds_not_numeric') {
      const minimum = Number(failure?.minimum_thickness_in || 0);
      return Number.isFinite(minimum) && minimum > 0 ? minimum : 0.03;
    }
    return null;
  }

  function nativePreflightRequiredInset(failure: JsonRecord): number | null {
    const reason = safeText(failure?.reason);
    if (!['ai_first_text_panel_safe_area_violation', 'ai_first_text_card_internal_padding_too_small'].includes(reason)) return null;
    const requiredInset = Number(failure?.required_inset_in || 0);
    return Number.isFinite(requiredInset) && requiredInset > 0 ? requiredInset : 0.15;
  }

  function nativePreflightGeometryRepairInstruction(failure: JsonRecord): string {
    const reason = safeText(failure?.reason);
    if (reason === 'ai_first_text_box_overlap') {
      const otherShapeId = safeText(failure?.other_shape_id, '<other-shape-id>');
      return `Move or resize this text box and/or ${otherShapeId} so their visible text rectangles do not overlap; keep at least 0.12in clearance on one axis and preserve reading order.`;
    }
    if (reason === 'ai_first_structural_text_collision') {
      const otherShapeId = safeText(failure?.other_shape_id, '<connector-or-rail-shape-id>');
      return `Reroute ${otherShapeId} around this text box or move this text box away from the connector/rail; keep at least 0.12in clearance between structural lines and readable text.`;
    }
    if (reason === 'ai_first_text_panel_safe_area_violation') {
      const panelShapeId = safeText(failure?.panel_shape_id, '<panel-shape-id>');
      return `Move or resize this text box so it sits fully inside ${panelShapeId} panel_safe_bounds when provided, otherwise with at least 0.15in inset on all sides. Use required_delta_in to correct the left/top/right/bottom padding bleed; a text box centered in a panel still fails if any edge bleeds into the panel padding.`;
    }
    if (reason === 'ai_first_text_card_internal_padding_too_small') {
      return 'This filled text card owns its visible card background, so it must carry internal text padding directly. Set margin to at least required_inset_in, enlarge the card, or split it into a background panel plus a separate inset text box.';
    }
    if (reason === 'ai_first_shape_outside_template_layout_zone') {
      const layoutZoneId = safeText(failure?.layout_zone_id, '<layout-zone-id>');
      return `Move or resize this shape so its full bounds fit inside the declared ${layoutZoneId} zone_safe_bounds when provided, otherwise zone_bounds. Use required_delta_in to correct the left/top/right/bottom overflow. If the current zone is too small for readable text, enlarge or redesign that zone and keep the shape bound to the same semantic role; do not leave a planned-zone shape floating outside its zone.`;
    }
    if (reason === 'ai_first_route_label_unbalanced_wrap') {
      return 'Short route or gate labels must read as a balanced one-line label. Widen the label box to required_width_in or shorten the text; do not keep a narrow wrapped label.';
    }
    if (reason === 'ai_first_connector_thickness_too_small' || reason === 'ai_first_connector_bounds_not_numeric') {
      return 'For line/connector shapes, keep both bounds.width_in and bounds.height_in positive; use a thin dimension of at least 0.03in so Office can materialize it.';
    }
    if (reason === 'ai_first_quality_role_missing_or_invalid') {
      const requiredQualityRole = nativePreflightRequiredQualityRole(failure);
      return `Set this same shape's quality_role to ${requiredQualityRole || 'one of content, structural, decorative, auxiliary'}; do not use primary, secondary, body, title, visual, or role-like labels as quality_role values.`;
    }
    if (reason === 'ai_first_shape_bounds_invalid') {
      return 'Move and resize the shape inside the 16x9 canvas with positive width_in and height_in; keep the full shape within slide bounds.';
    }
    return '';
  }

  function nativePreflightGlobalRepairRules(fixes: JsonRecord[]): JsonRecord[] {
    const reasons = new Set(fixes.map((fix) => safeText(fix?.reason)).filter(Boolean));
    const roles = new Set(fixes.map((fix) => safeText(fix?.role)).filter(Boolean));
    const rules: JsonRecord[] = [];
    if (reasons.has('ai_first_text_capacity_exceeded') || reasons.has('ai_first_text_box_height_below_readability_floor')) {
      if (roles.has('title')) {
        rules.push({
          rule_id: 'native_sample_title_fit_rule',
          applies_to_roles: ['title'],
          repair_instruction: 'For one-slide native samples, shorten the title to one line or use a near full-width title box so the title can stay 40-44pt. Do not flatten hierarchy with a 36-38pt title over 20pt body.',
          title_font_size_min: 40,
          title_font_size_max_when_wrapping: 44,
          title_width_in_min_for_44pt: 11.8,
          title_height_in_min_when_wrapping: 1.55,
        });
      }
      if ([...roles].some((role) => [
        'boundary_note',
        'body_sentence',
        'evidence_item',
        'metric',
        'point_text',
        'route_label',
        'takeaway',
      ].includes(role))) {
        rules.push({
          rule_id: 'native_sample_compact_content_text_floor',
          applies_to_roles: ['boundary_note', 'body_sentence', 'evidence_item', 'metric', 'point_text', 'route_label', 'takeaway'],
          repair_instruction: 'Apply this to every matching content text shape in the slide, not only the failed shape_id. Use fewer metric/receipt labels, wider panels, or shorter text instead of creating another short text box.',
          required_font_size_min: 18,
          required_height_in_min: 1.05,
          required_width_in_min: 2.8,
          max_metric_or_receipt_labels_for_one_slide_sample: 3,
        });
      }
    }
    if (reasons.has('ai_first_text_box_overlap') || reasons.has('ai_first_structural_text_collision')) {
      rules.push({
        rule_id: 'native_sample_bottom_band_separation',
        applies_to_roles: ['boundary_note', 'evidence_item', 'metric', 'takeaway'],
        repair_instruction: 'Do not stack takeaway, metric, and evidence note in the same vertical band. Use one takeaway band plus one evidence note, or move metrics into route cards. Keep at least 0.12in vertical clearance between all visible text rectangles.',
        required_gap_in: 0.12,
        one_slide_bottom_content_blocks_max: 2,
      });
    }
    if (reasons.has('ai_first_text_panel_safe_area_violation')) {
      rules.push({
        rule_id: 'native_panel_text_safe_area_inset',
        applies_to_roles: ['body_sentence', 'evidence_item', 'gate_card', 'metric', 'point_text', 'route_label', 'takeaway'],
        repair_instruction: 'For each text box whose center is inside a visual panel, keep its entire bounds inside that panel with at least 0.15in inset on all sides. Enlarge the panel or shorten the text instead of sharing the panel coordinates.',
        required_inset_in: 0.15,
      });
    }
    if (reasons.has('ai_first_text_card_internal_padding_too_small')) {
      rules.push({
        rule_id: 'native_filled_text_card_internal_padding',
        applies_to_roles: ['body_sentence', 'evidence_item', 'gate_card', 'metric', 'point_text', 'route_label', 'takeaway'],
        repair_instruction: 'For filled text_box cards, set margin >= 0.15in on the same shape, or use a separate filled panel plus an inset text box. Do not let a card rely on officecli default 0.02in text margins.',
        required_inset_in: 0.15,
      });
    }
    if (reasons.has('ai_first_shape_outside_template_layout_zone')) {
      rules.push({
        rule_id: 'native_template_zone_containment',
        applies_to_roles: ['body_sentence', 'core_sentence', 'evidence_item', 'gate_card', 'metric', 'point_text', 'route_label', 'takeaway'],
        repair_instruction: 'Every non-decorative/non-auxiliary shape with layout_zone_id must be fully inside the declared zone bounds. Use fewer zones, enlarge the zone, or move the shape; do not keep a floating shape outside its selected template zone.',
        required_inside_zone: true,
        required_zone_inset_in: 0.02,
      });
    }
    if (reasons.has('ai_first_route_label_unbalanced_wrap')) {
      rules.push({
        rule_id: 'native_short_label_one_line_fit',
        applies_to_roles: ['route_label', 'gate_card'],
        repair_instruction: 'Short route/gate labels should fit as one line. Use width >= 4.2in or shorten the label; sentence-length content belongs in point_text instead of route_label.',
        required_width_in_min: 4.2,
      });
    }
    if (reasons.has('ai_first_structural_text_collision')) {
      rules.push({
        rule_id: 'native_structural_line_text_clearance',
        applies_to_roles: ['body_sentence', 'evidence_item', 'gate_card', 'metric', 'panel_title', 'point_text', 'route_label', 'takeaway'],
        repair_instruction: 'Treat connector rails as real visible objects. Do not place readable text on top of rails, tracks, or connectors. Route lines in separate lanes, behind empty gutters, or around labels with at least 0.12in clearance.',
        required_gap_in: 0.12,
      });
    }
    if (
      reasons.has('ai_first_visual_structure_missing')
      || reasons.has('ai_first_visual_support_shape_count_too_low')
      || reasons.has('ai_first_mechanical_card_template_detected')
      || reasons.has('ai_first_structural_role_not_specific')
      || reasons.has('ai_first_native_sample_archetype_not_capacity_safe')
      || reasons.has('ai_first_native_sample_forbidden_general_archetype')
      || reasons.has('ai_first_native_sample_status_board_overloaded_with_takeaway')
      || reasons.has('ai_first_native_sample_status_card_quality_role_invalid')
      || reasons.has('ai_first_native_sample_evidence_axis_text_collision_risk')
      || reasons.has('ai_first_native_sample_input_hub_too_small')
      || reasons.has('ai_first_native_sample_input_hub_too_short')
      || reasons.has('ai_first_native_sample_input_hub_font_too_small')
      || reasons.has('ai_first_native_sample_input_hub_not_centered')
      || reasons.has('ai_first_native_sample_input_hub_does_not_span_card_centers')
      || reasons.has('ai_first_native_sample_horizontal_bus_forbidden')
      || reasons.has('ai_first_native_sample_connector_count_invalid')
      || reasons.has('ai_first_native_sample_connector_detached_from_hub')
      || reasons.has('ai_first_native_sample_connector_card_alignment_invalid')
      || reasons.has('ai_first_native_sample_connector_direction_missing')
      || reasons.has('ai_first_native_sample_connector_kind_invalid')
      || reasons.has('ai_first_native_sample_connector_not_vertical_drop')
    ) {
      rules.push({
        rule_id: 'native_non_mechanical_visual_skeleton',
        applies_to_roles: ['content_panel', 'point_text', 'evidence_item', 'takeaway', 'metric'],
        repair_instruction: 'Rebuild the slide skeleton instead of only resizing cards. Add at least two visible editable support shapes, including at least one structural object such as flow_connector, proof_band, input_hub, evidence_axis, decision_rail, or gate_stack_panel. For one-slide native samples, use sample_status_proof_board or sample_decision_proof_split and make the flow explicit: shared input -> route outputs -> proof/decision band. Reduce or merge equal cards so the first-glance layout is not a generic card grid.',
        required_visual_support_shape_count_min: 2,
        required_structural_visual_count_min: 1,
        mechanical_equal_card_grid_allowed: false,
        recommended_one_slide_structures: ['sample_status_proof_board', 'sample_decision_proof_split', 'decision_rail_plus_proof_band', 'input_hub_to_three_outputs'],
      });
    }
    return rules;
  }

  function buildNativeValidationFeedback({
    validation,
    attemptIndex,
    attemptArtifactRefs,
    previousValidationFeedback = null,
  }: {
    validation: JsonRecord;
    attemptIndex: number;
    attemptArtifactRefs: string[];
    previousValidationFeedback?: JsonRecord | null;
  }): JsonRecord {
    const normalizationFailures = safeText(validation?.payload?.stage) === 'normalize_slide_data'
      ? safeArray(validation?.payload?.failures)
      : [];
    const failures = safeArray(validation?.payload?.failures)
      .flatMap((slide) => safeArray(slide?.failures).map((failure) => ({
        slide_id: safeText(slide?.slide_id),
        shape_id: safeText(failure?.shape_id),
        archetype_id: safeText(failure?.archetype_id || failure?.selected_archetype),
        missing_role_groups: safeArray(failure?.missing_role_groups).map((group) => safeText(group)).filter(Boolean),
        other_shape_id: safeText(failure?.other_shape_id || failure?.panel_shape_id),
        panel_shape_id: safeText(failure?.panel_shape_id),
        reason: safeText(failure?.reason),
        role: safeText(failure?.role),
        actual_quality_role: safeText(failure?.actual),
        required_quality_role: nativePreflightRequiredQualityRole(failure),
        allowed_quality_roles: safeArray(failure?.allowed).map((role) => safeText(role)).filter(Boolean),
        layout_zone_id: safeText(failure?.layout_zone_id || failure?.zone_id),
        font_size: Number(failure?.font_size || 0),
        current_width_in: Number(failure?.width_in || failure?.shape_bounds?.width_in || 0) || null,
        current_height_in: Number(failure?.height_in || 0) || null,
        content_panel_count: Number(failure?.content_panel_count || 0) || null,
        point_text_count: Number(failure?.point_text_count || 0) || null,
        expected_count: Number(failure?.expected_count || 0) || null,
        minimum_height_in: Number(failure?.minimum_height_in || 0) || null,
        suggested_height_in: Number(failure?.suggested_height_in || 0) || null,
        required_height_in: nativePreflightRequiredHeight(failure),
        required_width_in: nativePreflightRequiredWidth(failure),
        required_font_size: nativePreflightRequiredFontSize(failure),
        current_text_char_count: Number(failure?.text_char_count || 0) || null,
        required_text_char_count: nativePreflightRequiredTextCharCount(failure),
        overlap_area_in2: Number(failure?.overlap_area_in2 || 0) || null,
        required_gap_in: ['ai_first_text_box_overlap', 'ai_first_structural_text_collision'].includes(safeText(failure?.reason))
          ? 0.12
          : null,
        required_inset_in: nativePreflightRequiredInset(failure),
        required_inside_zone: safeText(failure?.reason) === 'ai_first_shape_outside_template_layout_zone' ? true : null,
        required_zone_inset_in: nativePreflightRequiredZoneInset(failure),
        zone_bounds: failure?.zone_bounds && typeof failure.zone_bounds === 'object' ? failure.zone_bounds : null,
        zone_safe_bounds: failure?.zone_safe_bounds && typeof failure.zone_safe_bounds === 'object' ? failure.zone_safe_bounds : null,
        panel_bounds: failure?.panel_bounds && typeof failure.panel_bounds === 'object' ? failure.panel_bounds : null,
        panel_safe_bounds: failure?.panel_safe_bounds && typeof failure.panel_safe_bounds === 'object' ? failure.panel_safe_bounds : null,
        shape_bounds: failure?.shape_bounds && typeof failure.shape_bounds === 'object' ? failure.shape_bounds : null,
        required_delta_in: failure?.required_delta_in && typeof failure.required_delta_in === 'object' ? failure.required_delta_in : null,
        required_connector_thickness_in: nativePreflightRequiredConnectorThickness(failure),
        geometry_repair_instruction: nativePreflightGeometryRepairInstruction(failure),
        text_repair_instruction: safeText(failure?.reason) === 'ai_first_content_depth_too_low'
          ? 'Rewrite editable_text as a complete audience-facing teaching phrase or sentence with at least 12 meaningful CJK/Latin characters after punctuation is removed; labels such as visual review, screenshot review, export, PDF, or screenshot alone are too thin.'
          : safeText(failure?.reason) === 'ai_first_route_label_unbalanced_wrap'
            ? 'Shorten this route/gate label or change the content role to point_text with enough width; do not keep the awkward wrapped short label.'
          : '',
      })));
    const previousExactFixes = safeArray(previousValidationFeedback?.required_shape_fixes);
    const currentFixKeys = new Set(failures.map((fix) => `${safeText(fix?.slide_id)}:${safeText(fix?.shape_id)}:${safeText(fix?.reason)}`));
    const carriedExactFixes = previousExactFixes.filter((fix) => {
      const shapeId = safeText(fix?.shape_id);
      if (!shapeId) return false;
      return !currentFixKeys.has(`${safeText(fix?.slide_id)}:${shapeId}:${safeText(fix?.reason)}`);
    });
    const mergedFailures = [...carriedExactFixes, ...failures];
    const structuralFailures = [
      ...nativePreflightNormalizationStructuralFixes(normalizationFailures),
      ...nativePreflightStructuralFixesFromFailures(failures),
    ];
    return {
      repair_request: [
        'Regenerate editable_shape_plan only and fix every failed shape before materialization.',
        'Preserve any previously accepted design_spec_lock, deck_layout_rhythm_plan, template_layout_grammar, slide template_layout_binding, zones, layout_intent, and existing layout_zone_id values unless a listed failure explicitly requires changing that structure.',
        'For each failed shape_id listed in required_shape_fixes, change that exact native_shapes[] item until every listed height, font, and text-depth requirement is satisfied.',
        'For ai_first_page_number_missing, add an auxiliary page_number text box; do not delete or rewrite template_layout_binding, deck_layout_rhythm_plan, template_layout_grammar, or content shape zone bindings just to add the page number.',
        'If vertical space is tight, enlarge the container, move neighboring objects, shorten the text while preserving meaning, or use fewer lanes/cards; do not keep the old height.',
        'Do not return any text-bearing panel_title, point_text, body, core_sentence, lead, thesis, intro, or takeaway below the validator minimum.',
        'Do not return any content text box below 18pt unless its role is explicitly auxiliary or point_index.',
        'For ai_first_content_depth_too_low, rewrite that exact shape editable_text into a complete audience-facing phrase or sentence with at least 12 meaningful characters; changing only geometry cannot fix this failure. For input_hub_label, use a compact visible phrase such as 同一材料同步进入三条路线验证, not 同一材料 or 共同输入.',
        'For ai_first_quality_role_missing_or_invalid, set that exact shape quality_role to the listed required_quality_role. Allowed values are content, structural, decorative, and auxiliary. Do not use primary, secondary, body, title, visual, or any other role-like label as quality_role.',
        'For ai_first_text_box_overlap, move or resize shape_id and/or other_shape_id until their visible text boxes no longer overlap and keep at least required_gap_in clearance.',
        'For ai_first_structural_text_collision, reroute the connector/rail or move the text so structural lines do not pass through readable text; keep at least required_gap_in clearance and preserve the visual flow. For sample_status_proof_board, route connectors in lanes above or between cards instead of through point_text boxes.',
        'For ai_first_text_panel_safe_area_violation, use panel_shape_id/other_shape_id as the containing panel and place the failed text box completely inside panel_safe_bounds when provided, otherwise with at least 0.15in inset on all sides; use required_delta_in to correct the exact edge bleed, and if needed enlarge the panel or shorten the text.',
        'For ai_first_text_card_internal_padding_too_small, set margin on that exact filled text box to at least required_inset_in, enlarge the card, or split the card into a filled background panel plus a separate inset text box. Do not depend on officecli default 0.02in margins.',
        'For ai_first_shape_outside_template_layout_zone, use layout_zone_id, zone_bounds, zone_safe_bounds, shape_bounds, required_zone_inset_in, and required_delta_in to move or resize the exact shape so the whole rectangle stays inside the declared zone safe bounds. If the zone itself is too small, redesign or enlarge that zone and keep the same layout_zone_id binding instead of dropping the binding.',
        'For ai_first_visual_structure_missing, add a real editable structural visual object with quality_role=structural, visible fill or line styling, positive materializable bounds, and a structural role such as flow_connector, proof_band, input_hub, evidence_axis, decision_rail, or gate_stack_panel.',
        'For ai_first_structural_role_not_specific, rename or redesign the failed structural shape so its role carries a structural hint. Do not mark a generic content_panel as structural.',
        'For sample_status_proof_board content_panel card backgrounds, set quality_role=content. Keep structural only for the input_hub, connector arrows, proof_band, rails, and other first-glance visual logic.',
        'Every structural visual object must also carry layout_zone_id bound to a declared semantic zone; rails/connectors/bands without layout_zone_id are incomplete even when the shape is visible.',
        'For ai_first_visual_support_shape_count_too_low, add at least two visible non-text support shapes and make at least one structural. Support shapes must clarify the slide logic; invisible accents, empty cards, and duplicated panels do not count. Bind each support shape to a declared zone.',
        'For ai_first_mechanical_card_template_detected, do not keep the same row of equal content_panel cards. Redesign the composition around a dominant decision/proof area plus structural connector/band/axis, reduce or merge card slots, and update layout_intent.composition_signature and template zones to match. Bind all new structural shapes to layout zones.',
        'For ai_first_native_sample_* failures, re-plan one slide with sample_status_proof_board or sample_decision_proof_split. Status board: title, claim, input hub, exactly three large cards, exactly three status_zone point_text shapes, connectors, one proof band. Any conclusion belongs in proof_zone evidence_item/proof_band, not a fourth status point_text. Cards >=4.0x1.35in; point_text inside card safe area, box >=0.96in, 12-22 meaningful chars, max two 18pt lines. Proof band has one compact evidence sentence; no boundary_note, separate takeaway, or proof axis over proof text. Decision split must include a rail.',
        'For status-board point_text content-depth failures, rewrite each route-card phrase to 12-22 meaningful chars; labels like 先确认输入共享, 可审图可导出, or export are invalid.',
        'For native sample input hub / connector alignment failures, make the input_hub a dominant centered shared-input card at least 10.4in wide and 0.82in high, spanning all route-card centers. Align exactly one straight vertical directional connector to each card center, start it at the hub bottom, and land it on the card top edge. Set tailEnd=triangle/arrow or line.end_arrow=true on route-card connectors.',
        'For native sample connector kind/drop failures, change the card landing arrows to exactly three kind=connector drops with tailEnd/headEnd or line.end_arrow, keep width about 0.03-0.04in, and make height at least 0.66in; kind=line, horizontal bus lines, diagonal elbows, and short ticks are not enough for route-card arrows.',
        'For ai_first_template_layout_required_role_group_missing, add or reclassify a visible content shape so the selected archetype required role group is actually represented; do not switch archetype just to bypass the missing role group.',
        'For ai_first_route_label_unbalanced_wrap, widen the exact label to required_width_in or shorten/re-role the text so it reads as one balanced line.',
        'For ai_first_text_capacity_exceeded, required_height_in is derived from suggested_height_in plus a conservative buffer; use it as a hard floor, not a target to shave.',
        'For ai_first_connector_thickness_too_small and ai_first_shape_bounds_invalid, repair the exact geometry instead of changing the shape role or hiding the shape; every line/connector must have both width_in and height_in >= 0.03.',
        'For gate_card, takeaway, evidence_item, metric, route_label, and point_text roles, avoid short labels. Use full teaching phrases with at least 12 meaningful characters and reserve at least the reported required_height_in/minimum_height_in.',
        'Titles usually need at least 1.65in when wrapping; 18pt compact labels should reserve about 0.96in when the validator reports a fit failure.',
        'For ai_first_shape_kind_not_officecli_materializable, replace the kind with a value from allowed_shape_kinds or remove that decorative shape.',
      ].join(' '),
      previous_attempt: attemptIndex,
      allowed_shape_kinds: ['text_box', 'text', 'rect', 'rectangle', 'rounded_rect', 'panel', 'oval', 'circle', 'line', 'connector'],
      required_shape_fixes: mergedFailures,
      required_structural_fixes: structuralFailures,
      global_shape_class_fixes: nativePreflightGlobalRepairRules(mergedFailures),
      passed_structure_preservation_contract: {
        contract_kind: 'native_pptx_retry_preserve_passed_layout_structure_v1',
        required: true,
        preserve_fields: [
          'editable_shape_plan.design_spec_lock',
          'editable_shape_plan.deck_layout_rhythm_plan',
          'editable_shape_plan.template_layout_grammar',
          'editable_shape_plan.slides[].template_layout_binding',
          'editable_shape_plan.slides[].layout_intent',
          'editable_shape_plan.slides[].native_shapes[].layout_zone_id',
        ],
        page_number_missing_rule: 'Fix page_number_missing by adding an auxiliary page_number shape; do not drop or regenerate accepted template layout bindings or zone assignments.',
      },
      validator: validation.payload,
      attempt_artifact_refs: [...attemptArtifactRefs],
    };
  }

  return {
    buildNativeValidationFeedback,
    nativeAttemptArtifactFile,
    nativeShapePlanOutputContractForAttempt,
  };
}
