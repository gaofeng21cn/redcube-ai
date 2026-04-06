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

function hydrateAuthoredMarkup(markupArtifact, slotValues) {
  let output = String(markupArtifact || '');
  for (const [name, value] of Object.entries(slotValues)) {
    output = output.replaceAll(slotToken(name), String(value ?? ''));
  }
  const unresolved = output.match(/__REDCUBE_SLOT_[A-Za-z0-9_]+__/g);
  if (unresolved) {
    throw new Error(`Unresolved poster authored markup slots: ${Array.from(new Set(unresolved)).join(', ')}`);
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

function buildMarkupSlots(slide) {
  const panels = safeArray(slide.panels);
  const sources = safeArray(slide.evidence_and_sources);
  const palette = slide.director_contract.palette || {};
  const slots = {
    slide_id: slotValue(slide.slide_id),
    title: slotValue(slide.title),
    layout_family: slotValue(slide.layout_family),
    recipe_id: slotValue(slide.recipe_id),
    director_role: slotValue(slide.director_contract.director_role),
    peak_badge_display: slotValue(slide.director_contract.peak_page ? 'inline-flex' : 'none'),
    accent: slotValue(palette.accent || '#1D4ED8'),
    highlight: slotValue(palette.highlight || '#F97316'),
    label_hero: slotValue(panels[0]?.label || '先看这句'),
    headline: slotValue(slide.headline),
    subheadline: slotValue(slide.subheadline),
    audience_judgement: slotValue(slide.audience_judgement),
    why_now: slotValue(slide.why_now),
    proof_promise: slotValue(slide.proof_promise),
    call_to_action: slotValue(slide.call_to_action),
    source_label_1: slotValue(sources[0]?.public_label || ''),
    source_label_2: slotValue(sources[1]?.public_label || ''),
  };
  for (let index = 0; index < 4; index += 1) {
    const panel = panels[index] || {};
    const supports = safeArray(panel.support_points);
    slots[`panel_${index + 1}_text`] = slotValue(panel.text || '');
    slots[`panel_${index + 1}_support_1`] = slotValue(supports[0] || '');
    slots[`panel_${index + 1}_support_2`] = slotValue(supports[1] || '');
    slots[`panel_${index + 1}_support_3`] = slotValue(supports[2] || '');
  }
  return slots;
}

export function compilePosterRenderSlides({ slides, visualDirection, canvas, recipeMarkupRegistry, recipeMarkupArtifacts }) {
  return safeArray(slides).map((slide) => {
    const recipeId = safeText(slide.render_recipe_id);
    const templateId = safeText(recipeMarkupRegistry?.[recipeId]);
    const markupArtifact = safeText(recipeMarkupArtifacts?.[recipeId]);

    if (!recipeId) {
      throw new Error(`Missing poster render_recipe_id for slide: ${slide.slide_id}`);
    }
    if (!templateId || !markupArtifact) {
      throw new Error(`Missing poster authored markup artifact for recipe: ${recipeId}`);
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
      headline: slide.headline,
      subheadline: slide.subheadline,
      audience_judgement: slide.audience_judgement,
      why_now: slide.why_now,
      proof_promise: slide.proof_promise,
      call_to_action: slide.call_to_action,
      panels: safeArray(slide.panels),
      evidence_and_sources: safeArray(slide.evidence_and_sources),
      director_contract: {
        peak_page: true,
        director_role: safeText(visualDirection?.peak_region, slide.layout_family),
        poster_motif: safeText(visualDirection?.poster_motif),
        peak_region: safeText(visualDirection?.peak_region, 'hero_band'),
        panel_emphasis: visualDirection?.panel_emphasis || {},
        anti_template_constraints: safeArray(visualDirection?.anti_template_constraints),
        palette: {
          paper: safeText(visualDirection?.palette?.paper, '#FFF9F1'),
          ink: safeText(visualDirection?.palette?.ink, '#0F172A'),
          accent: safeText(visualDirection?.palette?.accent, '#1D4ED8'),
          highlight: safeText(visualDirection?.palette?.highlight, '#F97316'),
        },
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

    compiled.content = hydrateAuthoredMarkup(markupArtifact, buildMarkupSlots(compiled, canvas));
    return compiled;
  });
}
