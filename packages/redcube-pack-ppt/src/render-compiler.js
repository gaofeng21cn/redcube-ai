function safeText(value, fallback = '') {
  const text = String(value || '').trim();
  return text || fallback;
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function escapeHtml(text) {
  return String(text || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function slotToken(name) {
  return `__REDCUBE_SLOT_${name}__`;
}

function slotValue(value) {
  return escapeHtml(String(value ?? ''));
}

function displayValue(value, visibleDisplay = 'grid') {
  return safeText(value) ? visibleDisplay : 'none';
}

function hydrateAuthoredMarkup(markupArtifact, slotValues) {
  let output = String(markupArtifact || '');
  for (const [name, value] of Object.entries(slotValues)) {
    output = output.replaceAll(slotToken(name), String(value ?? ''));
  }
  const unresolved = output.match(/__REDCUBE_SLOT_[A-Za-z0-9_]+__/g);
  if (unresolved) {
    throw new Error(`Unresolved ppt authored markup slots: ${Array.from(new Set(unresolved)).join(', ')}`);
  }
  return output;
}

function creativeSourceStamp({ route, lifecycleStage, authoredSurface, materializedFrom }) {
  return {
    owner: 'host_agent',
    primary_surface: 'codex_native_host_agent',
    stage_owner: 'codex_native_host_agent',
    route,
    lifecycle_stage: lifecycleStage,
    authored_surface: authoredSurface,
    materialized_from: materializedFrom,
  };
}

function textItems(slide) {
  return safeArray(slide.page_core_content)
    .map((item, index) => ({
      label: safeText(item?.label, index === 0 ? '核心句' : `展开${index}`),
      text: safeText(item?.text ?? item),
      index1: index + 1,
    }))
    .filter((item) => item.text);
}

function buildMarkupSlots(slide, canvas, templateId) {
  const items = textItems(slide);
  const leadText = safeText(items[0]?.text);
  const supportItems = items.slice(1, 4);
  const zoneItems = items.slice(1, 5);
  const axisItems = items.slice(0, 4);
  const ladderItems = items.slice(0, 4);
  const timelineItems = items.slice(0, 4);
  const summaryItems = items.slice(0, 4);
  const sourceLabels = safeArray(slide.evidence_and_sources)
    .map((source) => safeText(source?.public_label))
    .filter(Boolean);
  const peakPage = Boolean(slide.director_contract.peak_page);
  const paddedSlideNo = String(slide.slide_no).padStart(2, '0');
  const paddedTotalSlides = String(slide.total_slides).padStart(2, '0');

  const slots = {
    template_id: slotValue(templateId),
    slide_id: slotValue(slide.slide_id),
    title: slotValue(slide.title),
    layout_family: slotValue(slide.layout_family),
    recipe_id: slotValue(slide.recipe_id),
    peak_page: slotValue(peakPage),
    peak_badge_display: slotValue(peakPage ? 'inline-flex' : 'none'),
    speaker_seconds: slotValue(slide.speaker_seconds),
    canvas_width: slotValue(canvas.width),
    canvas_height: slotValue(canvas.height),
    canvas_color: slotValue(slide.palette.canvas),
    ink: slotValue(slide.palette.ink),
    accent: slotValue(slide.palette.accent),
    accent_soft: slotValue(slide.palette.accentSoft || '#DBEAFE'),
    success: slotValue(slide.palette.success || '#0F766E'),
    page_goal: slotValue(slide.page_goal),
    director_role: slotValue(slide.director_contract.director_role),
    visual_manifest: slotValue(slide.director_contract.visual_manifest),
    lead_text: slotValue(leadText),
    source_label_1: slotValue(sourceLabels[0] || ''),
    source_label_2: slotValue(sourceLabels[1] || ''),
    slide_no: slotValue(paddedSlideNo),
    total_slides: slotValue(paddedTotalSlides),
    hub_text: slotValue(leadText),
    north_text: slotValue(items[0]?.text || ''),
    east_text: slotValue(items[1]?.text || ''),
    south_text: slotValue(items[2]?.text || ''),
    west_text: slotValue(items[3]?.text || ''),
  };

  for (let index = 0; index < 4; index += 1) {
    const axisCard = axisItems[index] || {};
    const zoneCard = zoneItems[index] || {};
    const ladderRow = ladderItems[index] || {};
    const timelineCard = timelineItems[index] || {};
    const summaryCard = summaryItems[index] || {};

    slots[`axis_card_${index + 1}_display`] = slotValue(displayValue(axisCard.text, 'grid'));
    slots[`axis_card_${index + 1}_primary_point`] = slotValue(axisCard.text ? 'true' : 'false');
    slots[`axis_card_${index + 1}_index`] = slotValue(axisCard.index1 || '');
    slots[`axis_card_${index + 1}_text`] = slotValue(axisCard.text || '');

    slots[`zone_card_${index + 1}_display`] = slotValue(displayValue(zoneCard.text, 'grid'));
    slots[`zone_card_${index + 1}_primary_point`] = slotValue(zoneCard.text ? 'true' : 'false');
    slots[`zone_card_${index + 1}_index`] = slotValue(zoneCard.index1 || '');
    slots[`zone_card_${index + 1}_text`] = slotValue(zoneCard.text || '');

    slots[`ladder_row_${index + 1}_display`] = slotValue(displayValue(ladderRow.text, 'grid'));
    slots[`ladder_row_${index + 1}_primary_point`] = slotValue(ladderRow.text ? 'true' : 'false');
    slots[`ladder_row_${index + 1}_index`] = slotValue(ladderRow.index1 || '');
    slots[`ladder_row_${index + 1}_text`] = slotValue(ladderRow.text || '');

    slots[`timeline_card_${index + 1}_display`] = slotValue(displayValue(timelineCard.text, 'grid'));
    slots[`timeline_card_${index + 1}_primary_point`] = slotValue(timelineCard.text ? 'true' : 'false');
    slots[`timeline_card_${index + 1}_index`] = slotValue(timelineCard.index1 || '');
    slots[`timeline_card_${index + 1}_text`] = slotValue(timelineCard.text || '');

    slots[`summary_card_${index + 1}_display`] = slotValue(displayValue(summaryCard.text, 'grid'));
    slots[`summary_card_${index + 1}_primary_point`] = slotValue(summaryCard.text ? 'true' : 'false');
    slots[`summary_card_${index + 1}_index`] = slotValue(summaryCard.index1 || '');
    slots[`summary_card_${index + 1}_text`] = slotValue(summaryCard.text || '');
  }

  for (let index = 0; index < 3; index += 1) {
    const supportCard = supportItems[index] || {};
    slots[`support_card_${index + 1}_display`] = slotValue(displayValue(supportCard.text, 'grid'));
    slots[`support_card_${index + 1}_primary_point`] = slotValue(supportCard.text ? 'true' : 'false');
    slots[`support_card_${index + 1}_text`] = slotValue(supportCard.text || '');
  }

  return slots;
}

export function compilePptRenderSlides({ slides, visualDirection, canvas, recipeMarkupRegistry, recipeMarkupArtifacts }) {
  return safeArray(slides).map((slide) => {
    const recipeId = safeText(slide.render_recipe_id);
    const templateId = safeText(recipeMarkupRegistry?.[recipeId]);
    const markupArtifact = safeText(recipeMarkupArtifacts?.[recipeId]);

    if (!recipeId) {
      throw new Error(`Missing ppt render_recipe_id for slide: ${slide.slide_id}`);
    }
    if (!templateId || !markupArtifact) {
      throw new Error(`Missing ppt authored markup artifact for recipe: ${recipeId}`);
    }

    const creativeSources = {
      recipe_selection: creativeSourceStamp({
        route: 'render_html',
        lifecycleStage: 'visual_authorship',
        authoredSurface: 'recipe_selection',
        materializedFrom: 'prompt_pack_seed',
      }),
      final_markup: creativeSourceStamp({
        route: 'render_html',
        lifecycleStage: 'visual_authorship',
        authoredSurface: 'final_html_markup',
        materializedFrom: 'prompt_pack_artifact',
      }),
    };
    const compiled = {
      slide_id: slide.slide_id,
      slide_no: slide.slide_no,
      title: slide.title,
      layout_family: slide.visual_presentation.layout_family,
      recipe_id: recipeId,
      template_id: templateId,
      page_goal: slide.page_goal,
      page_core_content: safeArray(slide.page_core_content),
      evidence_and_sources: safeArray(slide.evidence_and_sources),
      speaker_seconds: slide.speaker_seconds,
      transition_sentence: slide.transition_sentence,
      director_contract: {
        peak_page: safeArray(visualDirection?.peak_pages).includes(slide.slide_id),
        director_role: safeArray(visualDirection?.page_role_table).find((item) => item.slide_id === slide.slide_id)?.page_role || slide.visual_presentation.layout_family,
        generator_instructions: safeArray(visualDirection?.final_instruction_to_html_generator),
        page_family_ceiling: visualDirection?.page_family_ceiling || {},
        visual_manifest: safeText(visualDirection?.visual_manifest),
      },
      palette: visualDirection?.palette || {
        canvas: '#F7F8FC',
        ink: '#0F172A',
        accent: '#2563EB',
      },
      total_slides: safeArray(slides).length,
      creative_sources: creativeSources,
      creative_authorship: {
        recipe_decision: creativeSources.recipe_selection,
        final_html_markup: creativeSources.final_markup,
      },
      markup_contract_source: 'prompt_pack_artifact',
      content: '',
    };
    compiled.content = hydrateAuthoredMarkup(markupArtifact, buildMarkupSlots(compiled, canvas, templateId));
    return compiled;
  });
}
