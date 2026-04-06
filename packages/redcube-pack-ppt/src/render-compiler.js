function safeText(value, fallback = '') {
  const text = String(value || '').trim();
  return text || fallback;
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function escapeHtml(text) {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function readPath(target, path) {
  return String(path || '')
    .split('.')
    .filter(Boolean)
    .reduce((value, key) => (value == null ? undefined : value[key]), target);
}

function renderTemplate(template, vars) {
  let output = String(template || '');

  output = output.replace(/{{#each ([a-zA-Z0-9_.]+)}}([\s\S]*?){{\/each}}/g, (_match, path, block) => {
    const items = safeArray(readPath(vars, path));
    return items.map((item, index) => renderTemplate(block, {
      ...vars,
      ...(item && typeof item === 'object' ? item : { value: item }),
      index,
      index1: index + 1,
    })).join('');
  });

  output = output.replace(/{{#if ([a-zA-Z0-9_.]+)}}([\s\S]*?){{\/if}}/g, (_match, path, block) => (
    readPath(vars, path) ? renderTemplate(block, vars) : ''
  ));

  return output.replace(/{{([a-zA-Z0-9_.]+)}}/g, (_match, path) => escapeHtml(readPath(vars, path)));
}

function creativeSourceStamp({ route, lifecycleStage, authoredSurface, materializedFrom }) {
  return {
    owner: 'host_agent',
    primary_surface: 'codex_native_host_agent',
    stage_owner: 'codex_native_host_agent',
    ownership_model: 'director_first',
    route,
    lifecycle_stage: lifecycleStage,
    authored_surface: authoredSurface,
    materialized_from: materializedFrom,
  };
}

function buildTemplateState(slide, canvas) {
  const items = safeArray(slide.page_core_content).map((item, index) => ({
    label: safeText(item.label, index === 0 ? '核心句' : `展开${index}`),
    text: safeText(item.text),
    index1: index + 1,
  }));
  const lead = items[0]?.text || '';
  const supporting = items.slice(1);
  const sourceItems = safeArray(slide.evidence_and_sources).map((source) => ({ public_label: source.public_label }));
  return {
    slide_id: slide.slide_id,
    slide_no: String(slide.slide_no).padStart(2, '0'),
    total_slides: String(slide.total_slides).padStart(2, '0'),
    title: slide.title,
    page_goal: slide.page_goal,
    layout_family: slide.layout_family,
    recipe_id: slide.recipe_id,
    template_id: slide.template_id,
    peak_page: slide.director_contract.peak_page,
    director_role: slide.director_contract.director_role,
    speaker_seconds: slide.speaker_seconds,
    canvas_width: canvas.width,
    canvas_height: canvas.height,
    palette_canvas: slide.palette.canvas,
    palette_ink: slide.palette.ink,
    palette_accent: slide.palette.accent,
    palette_soft: slide.palette.accentSoft || '#DBEAFE',
    palette_success: slide.palette.success || '#0F766E',
    lead_text: lead,
    lead_label: items[0]?.label || '核心句',
    visual_manifest: slide.director_contract.visual_manifest,
    source_items: sourceItems,
    points: items.length > 0 ? items : [{ label: '核心句', text: lead, index1: 1 }],
    secondary_points: supporting,
    hub_text: lead || slide.page_goal,
    north_text: supporting[0]?.text || '',
    east_text: supporting[1]?.text || '',
    south_text: supporting[2]?.text || slide.transition_sentence,
    west_text: supporting[3]?.text || slide.transition_sentence,
  };
}

export function compilePptRenderSlides({ slides, visualDirection, renderContract, canvas, recipeTemplates }) {
  return safeArray(slides).map((slide) => {
    const recipeId = safeText(slide.render_recipe_id);
    const templateId = safeText(renderContract?.template_registry?.[recipeId]);
    const templateText = safeText(recipeTemplates?.[recipeId]);

    if (!recipeId) {
      throw new Error(`Missing ppt render_recipe_id for slide: ${slide.slide_id}`);
    }
    if (!templateId || !templateText) {
      throw new Error(`Missing ppt render template for recipe: ${recipeId}`);
    }

    const creativeSources = {
      recipe_selection: creativeSourceStamp({
        route: 'render_html',
        lifecycleStage: 'visual_authorship',
        authoredSurface: 'recipe_selection',
        materializedFrom: 'prompt_runtime_seed',
      }),
      final_markup: creativeSourceStamp({
        route: 'render_html',
        lifecycleStage: 'visual_authorship',
        authoredSurface: 'final_html_markup',
        materializedFrom: 'prompt_runtime_template',
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
      template_contract_source: 'prompt_pack',
      content: '',
    };
    compiled.content = renderTemplate(templateText, buildTemplateState(compiled, canvas));
    return compiled;
  });
}
