// @ts-nocheck

function words(value) {
  return String(value).trim().split(/\s+/).filter(Boolean);
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function safeText(value, fallback = '') {
  const text = String(value || '').trim();
  return text || fallback;
}

const NATIVE_BOUND_KEYS = [
  ['left_in', 'x_in'],
  ['top_in', 'y_in'],
  ['width_in', 'w_in'],
  ['height_in', 'h_in'],
];
const NATIVE_TEXT_KINDS = new Set(['text', 'text_box']);
const NATIVE_ROLE_FONT_SIZE = { title: 44, point_index: 16, subtitle: 24, core_sentence: 24 };
const CONTENT_DEPTH_EXCLUDED_ROLES = new Set(words(`
  title subtitle core_sentence evidence_item metric metric_label panel_title speaker_identity route_label point_text_short
  boundary_note page_number page_no cover_meta footer meta point_index caption date page source_note
`));
const TEXT_CAPACITY_EXCLUDED_ROLES = new Set(words('title subtitle page_number page_no meta cover_meta footer point_index'));
const LEAD_SENTENCE_ROLES = new Set(words('lead intro thesis takeaway core_sentence'));

function rounded4(value) {
  return Number(value.toFixed(4));
}

function roundedBounds(bounds) {
  return {
    left_in: rounded4(bounds.left_in),
    top_in: rounded4(bounds.top_in),
    width_in: rounded4(bounds.width_in),
    height_in: rounded4(bounds.height_in),
  };
}

function normalizeFailure(reason) {
  return {
    ok: false,
    stage: 'normalize_slide_data',
    failure_count: 1,
    failures: [{
      reason,
    }],
  };
}

function nativePlanKind(shape) {
  return safeText(shape?.kind || shape?.type || shape?.role).toLowerCase();
}

function nativePlanBounds(shape) {
  const bounds = shape?.bounds && typeof shape.bounds === 'object' ? shape.bounds : {};
  const values = Object.fromEntries(NATIVE_BOUND_KEYS.map(([key, alternate]) => [key, Number(bounds[key] ?? bounds[alternate])]));
  if (
    NATIVE_BOUND_KEYS.some(([key]) => !Number.isFinite(values[key]))
    || values.left_in < 0
    || values.top_in < 0
    || values.width_in <= 0
    || values.height_in <= 0
    || values.left_in + values.width_in > 16
    || values.top_in + values.height_in > 9
  ) {
    return null;
  }
  return values;
}

function nativePlanShapeText(shape) {
  return safeText(shape?.editable_text || shape?.text || shape?.label);
}

function nativePlanFontSize(shape) {
  const explicit = Number(shape?.font_size || shape?.size_pt || shape?.size || 0);
  if (Number.isFinite(explicit) && explicit > 0) return explicit;
  return NATIVE_ROLE_FONT_SIZE[safeText(shape?.role)] || 18;
}

function charWidthFactor(char) {
  if (/\s/.test(char)) return 0.32;
  if (char.codePointAt(0) > 127) return 0.95;
  if (/[A-Z]/.test(char)) return 0.68;
  return ['-', '/', ':'].includes(char) ? 0.38 : 0.56;
}

function weightedTextWidthPt(text, fontSize) {
  return [...String(text || '')].reduce((width, char) => width + fontSize * charWidthFactor(char), 0);
}

function estimatedTextHeightIn(shape, bounds) {
  const text = nativePlanShapeText(shape);
  if (!text) return 0;
  const fontSize = nativePlanFontSize(shape);
  const usableWidthPt = Math.max((bounds.width_in - 0.04) * 72, 1);
  const estimatedLines = Math.max(1, Math.ceil(weightedTextWidthPt(text, fontSize) / usableWidthPt));
  return (estimatedLines * fontSize * 1.18 / 72) + 0.04;
}

function nativePlanLineBoundsFailure(shape, bounds) {
  const kind = nativePlanKind(shape);
  if (!['line', 'connector'].includes(kind)) return null;
  if (bounds && bounds.width_in >= 0.03 && bounds.height_in >= 0.03) return null;
  return {
    reason: bounds ? 'ai_first_connector_thickness_too_small' : 'ai_first_connector_bounds_not_numeric',
    shape_id: safeText(shape?.shape_id, '<missing-shape-id>'),
    kind,
    width_in: bounds?.width_in ?? null,
    height_in: bounds?.height_in ?? null,
    minimum_thickness_in: 0.03,
  };
}

function isNativePlanTextShape(shape) {
  return (
    safeText(shape?.quality_role || 'content') === 'content'
    && NATIVE_TEXT_KINDS.has(nativePlanKind(shape))
    && nativePlanShapeText(shape)
    && nativePlanBounds(shape)
  );
}

function nativePlanVisibleTextBounds(shape) {
  const bounds = nativePlanBounds(shape);
  return bounds
    ? { ...bounds, height_in: Math.min(bounds.height_in, estimatedTextHeightIn(shape, bounds)) }
    : null;
}

function nativePlanOverlapArea(left, right) {
  const overlapW = Math.max(0, Math.min(left.left_in + left.width_in, right.left_in + right.width_in) - Math.max(left.left_in, right.left_in));
  const overlapH = Math.max(0, Math.min(left.top_in + left.height_in, right.top_in + right.height_in) - Math.max(left.top_in, right.top_in));
  return overlapW * overlapH;
}

function nativePlanTextOverlapFailures(shapes) {
  const textShapes = shapes.filter(isNativePlanTextShape);
  return textShapes.flatMap((leftShape, leftIndex) => {
    const leftBounds = nativePlanVisibleTextBounds(leftShape);
    return textShapes.slice(leftIndex + 1).flatMap((rightShape) => {
      const rightBounds = nativePlanVisibleTextBounds(rightShape);
      const overlapArea = leftBounds && rightBounds ? nativePlanOverlapArea(leftBounds, rightBounds) : 0;
      return overlapArea > 0.0024
        ? [{
            reason: 'ai_first_text_box_overlap',
            shape_id: safeText(leftShape?.shape_id, '<missing-shape-id>'),
            other_shape_id: safeText(rightShape?.shape_id, '<missing-shape-id>'),
            overlap_area_in2: rounded4(overlapArea),
          }]
        : [];
    });
  });
}

function normalizedContentCharCount(text) {
  return [...String(text || '')]
    .filter((char) => !/\s/.test(char) && !['，', '。', '、', ',', '.', ':', '：', ';', '；'].includes(char))
    .length;
}

function nativePlanContentDepthFailures(shapes) {
  return shapes.flatMap((shape) => {
    if (
      safeText(shape?.quality_role || 'content') !== 'content'
      || CONTENT_DEPTH_EXCLUDED_ROLES.has(safeText(shape?.role))
      || !nativePlanShapeText(shape)
    ) {
      return [];
    }
    const charCount = normalizedContentCharCount(nativePlanShapeText(shape));
    return charCount < 12
      ? [{
          reason: 'ai_first_content_depth_too_low',
          shape_id: safeText(shape?.shape_id, '<missing-shape-id>'),
          role: safeText(shape?.role),
          text_char_count: charCount,
          threshold: 12,
        }]
      : [];
  });
}

function nativePlanPageNumberFailures(shapes) {
  return shapes.some((shape) => (
    ['page_number', 'page_no', 'page'].includes(safeText(shape?.role))
    && nativePlanShapeText(shape)
  ))
    ? []
    : [{ reason: 'ai_first_page_number_missing' }];
}

function nativePlanTextCapacityFailure(shape, bounds) {
  if (!NATIVE_TEXT_KINDS.has(nativePlanKind(shape)) || !bounds) return null;
  const text = nativePlanShapeText(shape);
  if (!text) return null;
  const role = safeText(shape?.role);
  if (TEXT_CAPACITY_EXCLUDED_ROLES.has(role)) return null;
  const fontSize = nativePlanFontSize(shape);
  const compactMinimum = LEAD_SENTENCE_ROLES.has(role) && fontSize >= 20 && text.length >= 12
    ? 0.95
    : text.length >= 18 ? 0.84 : 0.54;
  if (fontSize >= 18 && bounds.height_in < compactMinimum) {
    return {
      reason: 'ai_first_text_box_height_below_readability_floor',
      shape_id: safeText(shape?.shape_id, '<missing-shape-id>'),
      role,
      font_size: fontSize,
      text_char_count: text.length,
      height_in: rounded4(bounds.height_in),
      minimum_height_in: compactMinimum,
    };
  }
  return null;
}

function nativePlanPanelSafeAreaFailures(shapes) {
  const panels = shapes.filter((shape) => (
    nativePlanBounds(shape)
    && ['content_panel', 'input_panel', 'source_panel'].includes(safeText(shape?.role))
  ));
  const textShapes = shapes.filter((shape) => (
    safeText(shape?.quality_role || 'content') === 'content'
    && ['text', 'text_box'].includes(safeText(shape?.kind || shape?.type || shape?.role).toLowerCase())
    && nativePlanShapeText(shape)
    && nativePlanBounds(shape)
  ));
  const failures = [];
  for (const panel of panels) {
    const panelBounds = nativePlanBounds(panel);
    if (!panelBounds) continue;
    const safeLeft = panelBounds.left_in + 0.15;
    const safeTop = panelBounds.top_in + 0.15;
    const safeRight = panelBounds.left_in + panelBounds.width_in - 0.15;
    const safeBottom = panelBounds.top_in + panelBounds.height_in - 0.15;
    for (const textShape of textShapes) {
      const textBounds = nativePlanBounds(textShape);
      if (!textBounds) continue;
      const centerX = textBounds.left_in + textBounds.width_in / 2;
      const centerY = textBounds.top_in + textBounds.height_in / 2;
      if (
        centerX < panelBounds.left_in
        || centerX > panelBounds.left_in + panelBounds.width_in
        || centerY < panelBounds.top_in
        || centerY > panelBounds.top_in + panelBounds.height_in
      ) {
        continue;
      }
      const textRight = textBounds.left_in + textBounds.width_in;
      const textBottom = textBounds.top_in + textBounds.height_in;
      if (
        textBounds.left_in >= safeLeft
        && textBounds.top_in >= safeTop
        && textRight <= safeRight
        && textBottom <= safeBottom
      ) {
        continue;
      }
      failures.push({
        reason: 'ai_first_text_panel_safe_area_violation',
        shape_id: safeText(textShape?.shape_id, '<missing-shape-id>'),
        panel_shape_id: safeText(panel?.shape_id, '<missing-panel-id>'),
        role: safeText(textShape?.role),
        required_inset_in: 0.15,
        panel_bounds: roundedBounds(panelBounds),
        panel_safe_bounds: {
          left_in: rounded4(safeLeft),
          top_in: rounded4(safeTop),
          right_in: rounded4(safeRight),
          bottom_in: rounded4(safeBottom),
        },
        shape_bounds: roundedBounds(textBounds),
        required_delta_in: {
          left: rounded4(Math.max(0, safeLeft - textBounds.left_in)),
          top: rounded4(Math.max(0, safeTop - textBounds.top_in)),
          right: rounded4(Math.max(0, textRight - safeRight)),
          bottom: rounded4(Math.max(0, textBottom - safeBottom)),
        },
        geometry_repair_instruction: 'Keep the text box fully inside its containing visual panel with the required inset on all sides; shrink the text box, enlarge the panel, or move the text.',
      });
    }
  }
  return failures;
}

function nativePlanDeckRhythmValidation(plan, slides) {
  const deckRhythm = plan?.deck_layout_rhythm_plan && typeof plan.deck_layout_rhythm_plan === 'object'
    ? plan.deck_layout_rhythm_plan
    : {};
  if (
    deckRhythm?.required !== true
    || safeText(deckRhythm?.owner) !== 'llm_agent'
    || safeArray(deckRhythm?.slides).length !== slides.length
  ) {
    return normalizeFailure('ai_first_deck_layout_rhythm_plan_missing');
  }

  const rhythmFailures = [];
  let currentArchetypeRun = [];
  let currentGridRun = [];
  const rhythmRows = slides.map((slide, index) => {
    const binding = slide?.template_layout_binding || {};
    const layoutIntent = slide?.layout_intent || {};
    return {
      slide_id: safeText(slide?.slide_id, `S${String(index + 1).padStart(2, '0')}`),
      selected_archetype: safeText(binding?.selected_archetype),
      primary_grid: safeText(layoutIntent?.primary_grid),
      composition_signature: safeText(layoutIntent?.composition_signature),
    };
  });

  for (const row of rhythmRows) {
    currentArchetypeRun = row.selected_archetype && currentArchetypeRun.at(-1)?.selected_archetype === row.selected_archetype
      ? [...currentArchetypeRun, row]
      : [row];
    currentGridRun = row.primary_grid && currentGridRun.at(-1)?.primary_grid === row.primary_grid
      ? [...currentGridRun, row]
      : [row];
    if (currentArchetypeRun.length === 3) {
      rhythmFailures.push({
        reason: 'native_deck_consecutive_selected_archetype_repetition',
        slide_ids: currentArchetypeRun.map((item) => item.slide_id),
      });
    }
    if (currentGridRun.length === 3) {
      rhythmFailures.push({
        reason: 'native_deck_consecutive_primary_grid_repetition',
        slide_ids: currentGridRun.map((item) => item.slide_id),
      });
    }
  }

  const compositionSignatures = rhythmRows.map((row) => row.composition_signature).filter(Boolean);
  if (
    compositionSignatures.length === slides.length
    && new Set(compositionSignatures).size < Math.ceil(slides.length * 0.75)
  ) {
    rhythmFailures.push({
      reason: 'native_deck_distinct_composition_share_too_low',
    });
  }
  if (rhythmFailures.length === 0) {
    return null;
  }
  return {
    ok: false,
    stage: 'ai_first_shape_plan_preflight',
    slide_count: slides.length,
    failure_count: rhythmFailures.length,
    failures: [{
      slide_id: '__deck__',
      title: 'Deck layout rhythm',
      failures: rhythmFailures,
    }],
  };
}

export function buildNativePlanValidationPayload(input) {
  const plan = input?.editable_shape_plan || {};
  const designSpecLock = plan?.design_spec_lock && typeof plan.design_spec_lock === 'object'
    ? plan.design_spec_lock
    : {};
  if (
    !safeText(designSpecLock?.spec_id)
    || !safeText(designSpecLock?.owner)
    || !safeText(designSpecLock?.motif)
    || safeArray(designSpecLock?.layout_archetypes).length < 3
  ) {
    return normalizeFailure('ai_first_design_spec_lock_missing');
  }

  const slides = safeArray(plan?.slides);
  const rhythmValidation = nativePlanDeckRhythmValidation(plan, slides);
  if (rhythmValidation) return rhythmValidation;

  const failures = slides.map((slide, index) => {
    const slideId = safeText(slide?.slide_id, `S${String(index + 1).padStart(2, '0')}`);
    const slideFailures = [];
    const layoutIntent = slide?.layout_intent && typeof slide.layout_intent === 'object'
      ? slide.layout_intent
      : {};
    const missingLayoutIntent = [
      'rhetorical_role',
      'composition_signature',
      'primary_grid',
      'visual_weight',
      'negative_space_strategy',
      'non_text_visual',
    ].filter((key) => !safeText(layoutIntent?.[key]));
    if (missingLayoutIntent.length > 0 || layoutIntent?.forbidden_template_reuse_checked !== true) {
      slideFailures.push({
        reason: 'ai_first_layout_intent_incomplete',
        missing_fields: missingLayoutIntent,
      });
    }

    const shapes = safeArray(slide?.native_shapes);
    slideFailures.push(...nativePlanTextOverlapFailures(shapes));
    slideFailures.push(...nativePlanPanelSafeAreaFailures(shapes));
    slideFailures.push(...nativePlanContentDepthFailures(shapes));
    slideFailures.push(...nativePlanPageNumberFailures(shapes));
    for (const shape of shapes) {
      const shapeId = safeText(shape?.shape_id, '<missing-shape-id>');
      const kind = nativePlanKind(shape);
      const role = safeText(shape?.role);
      const bounds = nativePlanBounds(shape);
      if (!bounds) slideFailures.push({ reason: 'ai_first_shape_bounds_invalid', shape_id: shapeId });

      const lineFailure = nativePlanLineBoundsFailure(shape, bounds);
      if (lineFailure) slideFailures.push(lineFailure);
      if (NATIVE_TEXT_KINDS.has(kind) && !nativePlanShapeText(shape)) {
        slideFailures.push({ reason: 'ai_first_text_missing', shape_id: shapeId });
      }
      if (role === 'point_index' && nativePlanFontSize(shape) < 16) {
        slideFailures.push({ reason: 'ai_first_point_index_too_small', shape_id: shapeId });
      }
      const textFailure = nativePlanTextCapacityFailure(shape, bounds);
      if (textFailure) slideFailures.push(textFailure);
    }
    return slideFailures.length > 0
      ? {
          slide_id: slideId,
          title: safeText(slide?.title),
          failures: slideFailures,
        }
      : null;
  }).filter(Boolean);
  return {
    ok: failures.length === 0,
    stage: 'ai_first_shape_plan_preflight',
    slide_count: slides.length,
    failure_count: failures.reduce((count, slide) => count + safeArray(slide.failures).length, 0),
    failures,
  };
}
