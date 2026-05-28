// @ts-nocheck

export function nativePlanPanelSafeAreaFailures({
  nativePlanBounds,
  nativePlanShapeText,
  safeText,
  shapes,
}) {
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
        geometry_repair_instruction: 'Keep the text box fully inside its containing visual panel with the required inset on all sides; shrink the text box, enlarge the panel, or move the text.',
      });
    }
  }
  return failures;
}

export function nativePlanDeckRhythmValidation({
  plan,
  safeArray,
  safeText,
  slides,
}) {
  const deckRhythm = plan?.deck_layout_rhythm_plan && typeof plan.deck_layout_rhythm_plan === 'object'
    ? plan.deck_layout_rhythm_plan
    : {};
  if (
    deckRhythm?.required !== true
    || safeText(deckRhythm?.owner) !== 'llm_agent'
    || safeArray(deckRhythm?.slides).length !== slides.length
  ) {
    return {
      ok: false,
      stage: 'normalize_slide_data',
      failure_count: 1,
      failures: [{
        reason: 'ai_first_deck_layout_rhythm_plan_missing',
      }],
    };
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
