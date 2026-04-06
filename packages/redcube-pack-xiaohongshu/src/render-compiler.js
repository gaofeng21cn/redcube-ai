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

function displayValue(value, visibleDisplay = 'block') {
  return safeText(value) ? visibleDisplay : 'none';
}

function hydrateAuthoredMarkup(markupArtifact, slotValues) {
  let output = String(markupArtifact || '');
  for (const [name, value] of Object.entries(slotValues)) {
    output = output.replaceAll(slotToken(name), String(value ?? ''));
  }
  const unresolved = output.match(/__REDCUBE_SLOT_[A-Za-z0-9_]+__/g);
  if (unresolved) {
    throw new Error(`Unresolved xiaohongshu authored markup slots: ${Array.from(new Set(unresolved)).join(', ')}`);
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

function buildMarkupSlots(slide, canvas) {
  const accent = slide.director_contract.material_rules.main_accent;
  const warning = slide.director_contract.material_rules.warning_accent;
  const peakPage = slide.director_contract.peak_page;
  const roleLabel = slide.director_contract.page_role || slide.page_goal;
  const pageCoreContent = safeArray(slide.page_core_content);
  const supportCards = pageCoreContent.slice(1, 4);
  const contrastCards = pageCoreContent.slice(1, 4).map((text, index) => ({
    text,
    qa_block: ['correction', 'proof', 'extension'][index] || `contrast-${index + 1}`,
    label: ['真正顺序', '为什么', '补充'][index] || `要点${index + 1}`,
  }));
  const numberedCards = pageCoreContent.slice(0, 4).map((text, index) => ({
    text,
    index1: index + 1,
    offset_px: index * 8,
  }));
  const sourceItems = safeArray(slide.evidence_and_sources).slice(0, 2).map((source) => ({
    public_label: source.public_label,
  }));
  const evidenceRows = pageCoreContent.slice(1, 4).map((text) => ({ text }));
  const checklistRows = pageCoreContent.slice(0, 4).map((text) => ({ text }));

  const slots = {
    template_id: slotValue(slide.template_id),
    slide_id: slotValue(slide.slide_id),
    title: slotValue(slide.title),
    layout_family: slotValue(slide.layout_family),
    recipe_id: slotValue(slide.recipe_id),
    peak_page: slotValue(peakPage),
    director_role: slotValue(safeText(slide.director_contract.page_role)),
    speaker_seconds: slotValue(slide.speaker_seconds),
    canvas_width: slotValue(canvas.width),
    canvas_height: slotValue(canvas.height),
    root_background: slotValue(peakPage ? '#FFF7ED' : '#F8FAFC'),
    accent: slotValue(accent),
    warning: slotValue(warning),
    role_label: slotValue(roleLabel),
    visual_motif: slotValue(slide.director_contract.visual_motif),
    source_label_1: slotValue(slide.evidence_and_sources[0]?.public_label || ''),
    slide_no: slotValue(slide.slide_no),
    total_slides: slotValue(slide.total_slides),
    peak_badge_display: slotValue(peakPage ? 'inline-flex' : 'none'),
    hero_text: slotValue(pageCoreContent[0] || ''),
    content_1: slotValue(pageCoreContent[0] || ''),
    content_2: slotValue(pageCoreContent[1] || ''),
    content_3: slotValue(pageCoreContent[2] || ''),
    content_4: slotValue(pageCoreContent[3] || ''),
  };

  for (let index = 0; index < 3; index += 1) {
    const supportText = supportCards[index]?.text || '';
    const contrastCard = contrastCards[index] || {};
    const evidenceText = evidenceRows[index]?.text || '';
    slots[`support_card_${index + 1}_display`] = slotValue(displayValue(supportText));
    slots[`support_card_${index + 1}_text`] = slotValue(supportText);
    slots[`contrast_card_${index + 1}_display`] = slotValue(displayValue(contrastCard.text));
    slots[`contrast_card_${index + 1}_qa_block`] = slotValue(contrastCard.qa_block || '');
    slots[`contrast_card_${index + 1}_label`] = slotValue(contrastCard.label || '');
    slots[`contrast_card_${index + 1}_text`] = slotValue(contrastCard.text || '');
    slots[`evidence_row_${index + 1}_display`] = slotValue(displayValue(evidenceText));
    slots[`evidence_row_${index + 1}_text`] = slotValue(evidenceText);
  }

  for (let index = 0; index < 4; index += 1) {
    const numberedCard = numberedCards[index] || {};
    const checklistText = checklistRows[index]?.text || '';
    slots[`numbered_card_${index + 1}_display`] = slotValue(displayValue(numberedCard.text));
    slots[`numbered_card_${index + 1}_index`] = slotValue(numberedCard.index1 || '');
    slots[`numbered_card_${index + 1}_offset_px`] = slotValue(numberedCard.offset_px || 0);
    slots[`numbered_card_${index + 1}_text`] = slotValue(numberedCard.text || '');
    slots[`checklist_row_${index + 1}_display`] = slotValue(displayValue(checklistText));
    slots[`checklist_row_${index + 1}_text`] = slotValue(checklistText);
  }

  for (let index = 0; index < 2; index += 1) {
    const sourceLabel = sourceItems[index]?.public_label || '';
    slots[`source_item_${index + 1}_display`] = slotValue(displayValue(sourceLabel, 'inline-flex'));
    slots[`source_item_${index + 1}_label`] = slotValue(sourceLabel);
  }

  return slots;
}

export function compileXhsRenderSlides({ slides, visualDirection, canvas, recipeMarkupRegistry, recipeMarkupArtifacts }) {
  return safeArray(slides).map((slide) => {
    const materialRules = visualDirection?.material_rules || {};
    const recipeId = safeText(slide.render_recipe_id);
    const templateId = safeText(recipeMarkupRegistry?.[recipeId]);
    const markupArtifact = safeText(recipeMarkupArtifacts?.[recipeId]);

    if (!recipeId) {
      throw new Error(`Missing xiaohongshu render_recipe_id for slide: ${slide.slide_id}`);
    }
    if (!templateId || !markupArtifact) {
      throw new Error(`Missing xiaohongshu authored markup artifact for recipe: ${recipeId}`);
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
      layout_family: slide.layout_family,
      recipe_id: recipeId,
      template_id: templateId,
      page_goal: slide.page_goal,
      page_core_content: safeArray(slide.page_core_content),
      evidence_and_sources: safeArray(slide.evidence_and_sources),
      director_contract: {
        visual_motif: safeText(visualDirection?.visual_motif),
        source_language_discipline: safeText(visualDirection?.source_language_discipline),
        anti_template_constraints: safeArray(visualDirection?.anti_template_constraints),
        peak_page: safeArray(visualDirection?.peak_pages).includes(slide.slide_id),
        page_role: slide.progression_role,
        memory_hook: safeText(visualDirection?.memory_hook),
        material_rules: {
          paper_base: safeText(materialRules.paper_base, '#FFFBF0'),
          main_accent: safeText(materialRules.main_accent, '#2563EB'),
          warning_accent: safeText(materialRules.warning_accent, '#DC2626'),
        },
      },
      speaker_seconds: slide.layout_family === 'process_track' ? 40 : slide.layout_family === 'action_checklist' ? 32 : 36,
      total_slides: safeArray(slides).length,
      creative_sources: creativeSources,
      creative_authorship: {
        recipe_decision: creativeSources.recipe_selection,
        final_html_markup: creativeSources.final_markup,
      },
      markup_contract_source: 'prompt_pack_artifact',
      content: '',
    };

    compiled.content = hydrateAuthoredMarkup(markupArtifact, buildMarkupSlots(compiled, canvas));
    return compiled;
  });
}
