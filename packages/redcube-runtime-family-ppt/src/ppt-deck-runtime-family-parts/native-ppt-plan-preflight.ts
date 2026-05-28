import path from 'node:path';

type JsonRecord = Record<string, any>;
type NativePptRoute = 'author_pptx_native' | 'repair_pptx_native';

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
  function validationFeedbackFixes(validationFeedback: JsonRecord | null | undefined): JsonRecord[] {
    return safeArray(validationFeedback?.required_shape_fixes)
      .map((fix) => {
        const requiredHeight = Number(fix?.required_height_in || 0);
        const requiredFontSize = Number(fix?.required_font_size || 0);
        const requiredTextCharCount = Number(fix?.required_text_char_count || 0);
        const requiredGap = Number(fix?.required_gap_in || 0);
        const requiredConnectorThickness = Number(fix?.required_connector_thickness_in || 0);
        return {
          slide_id: safeText(fix?.slide_id),
          shape_id: safeText(fix?.shape_id),
          other_shape_id: safeText(fix?.other_shape_id),
          reason: safeText(fix?.reason),
          role: safeText(fix?.role),
          font_size: Number(fix?.font_size || 0) || null,
          current_height_in: Number(fix?.current_height_in || 0) || null,
          minimum_height_in: Number(fix?.minimum_height_in || 0) || null,
          suggested_height_in: Number(fix?.suggested_height_in || 0) || null,
          required_height_in: Number.isFinite(requiredHeight) && requiredHeight > 0 ? requiredHeight : null,
          required_font_size: Number.isFinite(requiredFontSize) && requiredFontSize > 0 ? requiredFontSize : null,
          current_text_char_count: Number(fix?.current_text_char_count || 0) || null,
          required_text_char_count: Number.isFinite(requiredTextCharCount) && requiredTextCharCount > 0
            ? requiredTextCharCount
            : null,
          overlap_area_in2: Number(fix?.overlap_area_in2 || 0) || null,
          required_gap_in: Number.isFinite(requiredGap) && requiredGap > 0 ? requiredGap : null,
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
          || Number(fix.required_font_size || 0) > 0
          || Number(fix.required_text_char_count || 0) > 0
          || Boolean(fix.text_repair_instruction)
          || Number(fix.required_gap_in || 0) > 0
          || Boolean(fix.geometry_repair_instruction)
          || Number(fix.required_connector_thickness_in || 0) > 0
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
  ) {
    const contract = nativeShapePlanOutputContract(route);
    const exactFixes = validationFeedbackFixes(validationFeedback);
    if (exactFixes.length === 0) return contract;
    return {
      ...contract,
      native_shape_plan_validation_feedback_contract: {
        contract_kind: 'native_pptx_preflight_retry_exact_shape_fixes_v1',
        previous_attempt: Number(validationFeedback?.previous_attempt || 0) || null,
        required: true,
        enforcement: 'the returned editable_shape_plan must satisfy every exact_shape_fix before materialization',
        instruction: 'For each exact_shape_fix, find the matching native_shapes[] item by shape_id and satisfy every non-null requirement on that same shape. Set bounds.height_in to required_height_in or larger when present; set font_size to required_font_size or larger when present; rewrite editable_text so normalized audience text reaches required_text_char_count when present. If other_shape_id and required_gap_in are present, move or resize shape_id and/or other_shape_id so the two visible text boxes no longer overlap and keep at least required_gap_in clearance. If required_connector_thickness_in is present, set both width_in and height_in positive and at least that thickness for line/connector shapes. If the existing composition has no room, redesign the page geometry, reduce slots, or shorten text while preserving meaning. Do not return the same failing text, the same failing font size, the same failing height, the same overlap, or a zero/negative connector dimension.',
        exact_shape_fixes: exactFixes,
        global_shape_class_fixes: safeArray(validationFeedback?.global_shape_class_fixes),
      },
      editable_shape_plan: {
        ...(contract.editable_shape_plan || {}),
        validation_retry_contract: {
          contract_kind: 'native_pptx_preflight_retry_exact_shape_fixes_v1',
          required: true,
          exact_shape_fixes: exactFixes,
          global_shape_class_fixes: safeArray(validationFeedback?.global_shape_class_fixes),
          per_shape_acceptance_rule: 'for every matching shape_id, native_shapes[] must satisfy all provided exact fixes: height >= required_height_in, font_size >= required_font_size, normalized editable_text length >= required_text_char_count, and no visible text overlap with other_shape_id when required_gap_in is present',
          global_shape_class_acceptance_rule: 'When global_shape_class_fixes are present, apply them to every matching role/class in the whole slide, not only the shape_ids that failed in the previous attempt.',
          line_connector_acceptance_rule: 'For failed line or connector shapes, both width_in and height_in must be positive; the thin dimension must be at least required_connector_thickness_in when provided, otherwise at least 0.03in.',
          redesign_allowed_when_space_is_tight: true,
        },
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

  function nativePreflightRequiredConnectorThickness(failure: JsonRecord): number | null {
    const reason = safeText(failure?.reason);
    if (reason === 'ai_first_connector_thickness_too_small' || reason === 'ai_first_connector_bounds_not_numeric') {
      const minimum = Number(failure?.minimum_thickness_in || 0);
      return Number.isFinite(minimum) && minimum > 0 ? minimum : 0.03;
    }
    return null;
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
    if (reason === 'ai_first_connector_thickness_too_small' || reason === 'ai_first_connector_bounds_not_numeric') {
      return 'For line/connector shapes, keep both bounds.width_in and bounds.height_in positive; use a thin dimension of at least 0.03in so Office can materialize it.';
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
          repair_instruction: 'For one-slide native samples, either shorten the title to one line, reduce title font to 34-38pt, or use a near full-width title box. Do not keep 44pt in a narrow column.',
          title_font_size_max_when_wrapping: 38,
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
    if (reasons.has('ai_first_structural_text_collision')) {
      rules.push({
        rule_id: 'native_structural_line_text_clearance',
        applies_to_roles: ['body_sentence', 'evidence_item', 'gate_card', 'metric', 'panel_title', 'point_text', 'route_label', 'takeaway'],
        repair_instruction: 'Treat connector rails as real visible objects. Do not place readable text on top of rails, tracks, or connectors. Route lines in separate lanes, behind empty gutters, or around labels with at least 0.12in clearance.',
        required_gap_in: 0.12,
      });
    }
    return rules;
  }

  function buildNativeValidationFeedback({
    validation,
    attemptIndex,
    attemptArtifactRefs,
  }: {
    validation: JsonRecord;
    attemptIndex: number;
    attemptArtifactRefs: string[];
  }): JsonRecord {
    const failures = safeArray(validation?.payload?.failures)
      .flatMap((slide) => safeArray(slide?.failures).map((failure) => ({
        slide_id: safeText(slide?.slide_id),
        shape_id: safeText(failure?.shape_id),
        other_shape_id: safeText(failure?.other_shape_id),
        reason: safeText(failure?.reason),
        role: safeText(failure?.role),
        font_size: Number(failure?.font_size || 0),
        current_height_in: Number(failure?.height_in || 0) || null,
        minimum_height_in: Number(failure?.minimum_height_in || 0) || null,
        suggested_height_in: Number(failure?.suggested_height_in || 0) || null,
        required_height_in: nativePreflightRequiredHeight(failure),
        required_font_size: nativePreflightRequiredFontSize(failure),
        current_text_char_count: Number(failure?.text_char_count || 0) || null,
        required_text_char_count: nativePreflightRequiredTextCharCount(failure),
        overlap_area_in2: Number(failure?.overlap_area_in2 || 0) || null,
        required_gap_in: ['ai_first_text_box_overlap', 'ai_first_structural_text_collision'].includes(safeText(failure?.reason))
          ? 0.12
          : null,
        required_connector_thickness_in: nativePreflightRequiredConnectorThickness(failure),
        geometry_repair_instruction: nativePreflightGeometryRepairInstruction(failure),
        text_repair_instruction: safeText(failure?.reason) === 'ai_first_content_depth_too_low'
          ? 'Rewrite editable_text as a complete audience-facing teaching phrase or sentence with at least 12 meaningful CJK/Latin characters after punctuation is removed; labels such as visual review, screenshot review, export, PDF, or screenshot alone are too thin.'
          : '',
      })));
    return {
      repair_request: [
        'Regenerate editable_shape_plan only and fix every failed shape before materialization.',
        'For each failed shape_id listed in required_shape_fixes, change that exact native_shapes[] item until every listed height, font, and text-depth requirement is satisfied.',
        'If vertical space is tight, enlarge the container, move neighboring objects, shorten the text while preserving meaning, or use fewer lanes/cards; do not keep the old height.',
        'Do not return any text-bearing panel_title, point_text, body, core_sentence, lead, thesis, intro, or takeaway below the validator minimum.',
        'Do not return any content text box below 18pt unless its role is explicitly auxiliary or point_index.',
        'For ai_first_content_depth_too_low, rewrite that exact shape editable_text into a complete audience-facing phrase or sentence with at least 12 meaningful characters; changing only geometry cannot fix this failure.',
        'For ai_first_text_box_overlap, move or resize shape_id and/or other_shape_id until their visible text boxes no longer overlap and keep at least required_gap_in clearance.',
        'For ai_first_structural_text_collision, reroute the connector/rail or move the text so structural lines do not pass through readable text; keep at least required_gap_in clearance and preserve the visual flow.',
        'For ai_first_text_capacity_exceeded, required_height_in is derived from suggested_height_in plus a conservative buffer; use it as a hard floor, not a target to shave.',
        'For ai_first_connector_thickness_too_small and ai_first_shape_bounds_invalid, repair the exact geometry instead of changing the shape role or hiding the shape.',
        'Titles usually need at least 1.65in when wrapping; 18pt compact labels should reserve about 0.96in when the validator reports a fit failure.',
        'For ai_first_shape_kind_not_officecli_materializable, replace the kind with a value from allowed_shape_kinds or remove that decorative shape.',
      ].join(' '),
      previous_attempt: attemptIndex,
      allowed_shape_kinds: ['text_box', 'text', 'rect', 'rectangle', 'rounded_rect', 'panel', 'oval', 'circle', 'line', 'connector'],
      required_shape_fixes: failures,
      global_shape_class_fixes: nativePreflightGlobalRepairRules(failures),
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
