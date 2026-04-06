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
    route,
    lifecycle_stage: lifecycleStage,
    authored_surface: authoredSurface,
    materialized_from: materializedFrom,
  };
}

function buildTemplateState(slide, canvas) {
  const accent = slide.director_contract.material_rules.main_accent;
  const warning = slide.director_contract.material_rules.warning_accent;
  const peakPage = slide.director_contract.peak_page;
  const roleLabel = slide.director_contract.page_role || slide.page_goal;
  const pageCoreContent = safeArray(slide.page_core_content);

  return {
    slide_id: slide.slide_id,
    title: slide.title,
    layout_family: slide.layout_family,
    recipe_id: slide.recipe_id,
    template_id: slide.template_id,
    peak_page: peakPage,
    director_role: safeText(slide.director_contract.page_role),
    speaker_seconds: slide.speaker_seconds,
    canvas_width: canvas.width,
    canvas_height: canvas.height,
    root_background: peakPage ? '#FFF7ED' : '#F8FAFC',
    accent,
    warning,
    role_label: roleLabel,
    visual_motif: slide.director_contract.visual_motif,
    source_label_1: slide.evidence_and_sources[0]?.public_label || '',
    slide_no: slide.slide_no,
    total_slides: slide.total_slides,
    hero_text: pageCoreContent[0] || '',
    content_1: pageCoreContent[0] || '',
    content_2: pageCoreContent[1] || '',
    content_3: pageCoreContent[2] || '',
    content_4: pageCoreContent[3] || '',
    support_cards: pageCoreContent.slice(1).map((text) => ({ text })),
    contrast_cards: pageCoreContent.slice(1).map((text, index) => ({
      text,
      qa_block: index === 0 ? 'correction' : 'proof',
      label: index === 0 ? '真正顺序' : '为什么',
    })),
    numbered_cards: pageCoreContent.map((text, index) => ({
      text,
      index1: index + 1,
      offset_px: index * 8,
    })),
    evidence_rows: pageCoreContent.slice(1).map((text) => ({ text })),
    source_items: safeArray(slide.evidence_and_sources).slice(0, 2).map((source) => ({
      public_label: source.public_label,
    })),
    checklist_rows: pageCoreContent.map((text) => ({ text })),
  };
}

export function compileXhsRenderSlides({ slides, visualDirection, renderContract, canvas, recipeTemplates }) {
  return safeArray(slides).map((slide) => {
    const materialRules = visualDirection?.material_rules || {};
    const recipeId = safeText(slide.render_recipe_id);
    const templateId = safeText(renderContract?.template_registry?.[recipeId]);
    const templateText = safeText(recipeTemplates?.[recipeId]);

    if (!recipeId) {
      throw new Error(`Missing xiaohongshu render_recipe_id for slide: ${slide.slide_id}`);
    }
    if (!templateId || !templateText) {
      throw new Error(`Missing xiaohongshu render template for recipe: ${recipeId}`);
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
        materializedFrom: 'prompt_pack_template',
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
      content: '',
    };

    compiled.content = renderTemplate(templateText, buildTemplateState(compiled, canvas));
    return compiled;
  });
}
