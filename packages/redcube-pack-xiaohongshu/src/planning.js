import { loadRenderPackCompiler } from '@redcube/pack-runtime';

function hydrateSeedVars(vars, prefix, values, max = 6) {
  const hydrated = { ...vars };
  for (let index = 0; index < max; index += 1) {
    const value = values[index] ?? values[0] ?? '';
    hydrated[`${prefix}_${index + 1}`] = value;
  }
  return hydrated;
}

function creativeSourceStamp({ route, lifecycleStage, authoredSurface, materializedFrom = 'prompt_pack_seed' }) {
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

function creativeExecution(route, lifecycleStage) {
  return {
    owner: 'host_agent',
    primary_surface: 'codex_native_host_agent',
    route,
    lifecycle_stage: lifecycleStage,
    ownership_model: 'director_first',
  };
}

function buildPlanSeedVars(contract, storyline, research, deps) {
  const sources = deps.safeArray(research?.research?.public_sources).length > 0
    ? research.research.public_sources
    : deps.sourceLabels(contract);
  const sourceClaims = deps.sourceMaterials(contract)
    .map((material) => deps.safeText(material.excerpt || material.content_text).replace(/\s+/g, ' ').slice(0, 64))
    .filter(Boolean);
  let vars = {
    title: contract.title,
    audience_judgement: deps.safeText(storyline?.storyline?.audience_judgement, deps.inferAudience(contract)),
    why_now: deps.safeText(storyline?.storyline?.why_now, deps.inferWhyNow(contract)),
    tension: deps.safeText(storyline?.storyline?.tension, deps.inferTension(contract)),
    memory_hook: deps.safeText(storyline?.storyline?.memory_hook, deps.inferMemoryHook(contract)),
  };
  vars = hydrateSeedVars(vars, 'source_label', sources, 6);
  vars = hydrateSeedVars(vars, 'source_claim', sourceClaims.length > 0 ? sourceClaims : sources, 6);
  return vars;
}

export function buildXhsPlanSlides(contract, storyline, research, deps) {
  const seed = deps.promptSeed(contract, 'single_note_plan', buildPlanSeedVars(contract, storyline, research, deps));
  const slides = deps.safeArray(seed?.plan?.slides);
  const sources = deps.safeArray(research?.research?.public_sources).length > 0 ? research.research.public_sources : deps.sourceLabels(contract);
  return slides.map((slide, index) => ({
    slide_id: slide.slide_id,
    slide_no: index + 1,
    title: slide.title,
    layout_family: slide.layout_family,
    render_recipe_id: deps.safeText(slide.render_recipe_id),
    page_goal: slide.page_goal,
    progression_role: deps.safeText(slide.progression_role, ['hook', 'tension', 'explain', 'mechanism_peak', 'evidence_peak', 'memory_close'][index] || 'explain'),
    core_sentence: deps.safeText(slide.core_sentence, deps.safeArray(slide.page_core_content)[0]),
    page_core_content: deps.safeArray(slide.page_core_content),
    visual_presentation: slide.visual_presentation,
    source_language: deps.safeText(slide.source_language, '来源必须翻译成读者能理解的公开口径'),
    evidence_and_sources: sources.map((source, sourceIndex) => ({
      source_id: `SRC-${index + 1}-${sourceIndex + 1}`,
      public_label: source,
    })),
    speaker_notes: deps.safeText(slide.speaker_notes),
    transition: deps.safeText(slide.transition, index === slides.length - 1 ? '最后收束成可收藏的行动清单。' : `下一页进入：${slides[index + 1].title}`),
    transition_sentence: deps.safeText(slide.transition, index === slides.length - 1 ? '最后收束成可收藏的行动清单。' : `下一页进入：${slides[index + 1].title}`),
    creative_sources: {
      page_core_content: creativeSourceStamp({
        route: 'single_note_plan',
        lifecycleStage: 'story_architecture',
        authoredSurface: 'page_core_content',
      }),
      visual_presentation: creativeSourceStamp({
        route: 'single_note_plan',
        lifecycleStage: 'story_architecture',
        authoredSurface: 'visual_presentation',
      }),
      render_recipe_id: creativeSourceStamp({
        route: 'single_note_plan',
        lifecycleStage: 'visual_authorship',
        authoredSurface: 'render_recipe_id',
      }),
    },
    creative_authorship: {
      page_core_content: creativeSourceStamp({
        route: 'single_note_plan',
        lifecycleStage: 'story_architecture',
        authoredSurface: 'page_core_content',
      }),
      visual_presentation: creativeSourceStamp({
        route: 'single_note_plan',
        lifecycleStage: 'story_architecture',
        authoredSurface: 'visual_presentation',
      }),
    },
  }));
}

export function buildXhsVisualDirection(contract, deliverablePaths, mode, baselineDeliverableId, deps) {
  const plan = deps.readStageArtifact(contract, deliverablePaths, 'single_note_plan');
  const storyline = deps.readStageArtifact(contract, deliverablePaths, 'storyline');
  const seed = deps.promptSeed(contract, 'visual_direction');
  const slides = deps.safeArray(plan?.single_note_plan?.slides);
  const visualSeed = seed?.visual_direction || {};
  const pageRoleTable = slides.map((slide) => ({
    slide_id: slide.slide_id,
    title: slide.title,
    page_role: slide.progression_role,
    first_glance: slide.visual_presentation?.main_visual_action || slide.title,
    second_glance: slide.page_goal,
  }));
  return {
    ...deps.attachCommon('visual_direction', contract),
    creative_execution: creativeExecution('visual_direction', 'visual_authorship'),
    mode,
    lifecycle_stage: 'visual_authorship',
    visual_direction: {
      director_statement: deps.safeText(visualSeed.director_statement),
      visual_motif: deps.safeText(visualSeed.visual_motif),
      material_rules: visualSeed.material_rules,
      rhythm_curve: deps.safeArray(visualSeed.rhythm_curve),
      peak_pages: deps.safeArray(visualSeed.peak_pages),
      page_family_ceiling: visualSeed.page_family_ceiling || {},
      anti_template_constraints: deps.safeArray(visualSeed.anti_template_constraints),
      source_language_discipline: deps.safeText(visualSeed.source_language_discipline),
      source_truth_confidence: deps.sourceConfidence(contract) || deps.safeText(storyline?.storyline?.source_truth_confidence),
      page_role_table: pageRoleTable,
      forbidden_regressions: deps.safeArray(visualSeed.forbidden_regressions),
      baseline_deliverable_id: mode === 'optimize_existing' ? baselineDeliverableId : null,
      memory_hook: deps.safeText(storyline?.storyline?.memory_hook, deps.inferMemoryHook(contract)),
      creative_sources: {
        director_statement: creativeSourceStamp({
          route: 'visual_direction',
          lifecycleStage: 'visual_authorship',
          authoredSurface: 'director_statement',
        }),
        visual_motif: creativeSourceStamp({
          route: 'visual_direction',
          lifecycleStage: 'visual_authorship',
          authoredSurface: 'visual_motif',
        }),
        rhythm_curve: creativeSourceStamp({
          route: 'visual_direction',
          lifecycleStage: 'visual_authorship',
          authoredSurface: 'rhythm_curve',
        }),
        page_family_ceiling: creativeSourceStamp({
          route: 'visual_direction',
          lifecycleStage: 'visual_authorship',
          authoredSurface: 'page_family_ceiling',
        }),
      },
      creative_authorship: {
        visual_direction: creativeSourceStamp({
          route: 'visual_direction',
          lifecycleStage: 'visual_authorship',
          authoredSurface: 'visual_direction',
        }),
      },
    },
  };
}

function escapeHtml(text) {
  return String(text || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function escapeTemplate(text) {
  return String(text || '').replaceAll('\\', '\\\\').replaceAll('`', '\\`').replaceAll('${', '\\${');
}

function buildHtml({ title, slides, renderPlan, renderStrategy, shellText }) {
  const slidesLiteral = `[\n${slides.map((slide) => `  { slideId: '${slide.slide_id}', title: ${JSON.stringify(slide.title)}, recipeId: '${slide.recipe_id}', content: \`${escapeTemplate(slide.content)}\` }`).join(',\n')}\n]`;
  return shellText
    .replaceAll('__REDCUBE_TITLE__', escapeHtml(title))
    .replaceAll('__REDCUBE_RENDER_STRATEGY__', escapeHtml(renderStrategy.replaceAll('_', '-')))
    .replaceAll('__REDCUBE_RENDER_PLAN__', escapeHtml(JSON.stringify(renderPlan)))
    .replaceAll('__REDCUBE_SLIDES_DATA__', slidesLiteral);
}

export async function buildXhsRenderHtml(contract, deliverablePaths, deps) {
  const plan = deps.readStageArtifact(contract, deliverablePaths, 'single_note_plan');
  const visual = deps.readStageArtifact(contract, deliverablePaths, 'visual_direction');
  const contractRender = deps.renderContract(contract);
  const renderArtifact = deps.promptArtifact(contract, 'render_html')?.render_markup_artifact || {};
  const recipeMarkupRegistry = renderArtifact.authored_markup_registry || {};
  if (Object.keys(recipeMarkupRegistry).length === 0) {
    throw new Error(`Missing xiaohongshu render_html authored markup registry for profile: ${contract.profile_id}`);
  }
  const compiler = await loadRenderPackCompiler(contract);
  const slides = await compiler.compileRenderSlides({
    slides: deps.safeArray(plan?.single_note_plan?.slides),
    visualDirection: visual?.visual_direction || {},
    canvas: deps.CANVAS,
    recipeMarkupRegistry,
    recipeMarkupArtifacts: Object.fromEntries(
      Object.entries(recipeMarkupRegistry).map(([recipeId, relativePath]) => [
        recipeId,
        deps.readPromptPackText(deps.resolvePromptPackAsset(contract, deps.safeText(relativePath))),
      ]),
    ),
  });
  const visualDirection = visual?.visual_direction || {};
  const renderPlan = {
    render_strategy: deps.safeText(contractRender.render_strategy, 'prompt_director_first'),
    shell_file: deps.resolvePromptPackAsset(contract, deps.safeText(contractRender.shell_file, 'render_shell.html')),
    pack_id: deps.safeText(contract?.prompt_pack?.pack_id),
    authored_markup_surface: deps.safeText(renderArtifact.artifact_surface, 'prompt_pack_artifact'),
    markup_binding_model: deps.safeText(renderArtifact.binding_model, 'slot_hydration_only'),
    director_contract: {
      visual_motif: deps.safeText(visualDirection.visual_motif),
      peak_pages: deps.safeArray(visualDirection.peak_pages),
      page_family_ceiling: visualDirection.page_family_ceiling || {},
      anti_template_constraints: deps.safeArray(visualDirection.anti_template_constraints),
      source_language_discipline: deps.safeText(visualDirection.source_language_discipline),
    },
    slides: slides.map((slide) => ({
      slide_id: slide.slide_id,
      title: slide.title,
      layout_family: slide.layout_family,
      recipe_id: slide.recipe_id,
      template_id: slide.template_id,
      peak_page: slide.director_contract.peak_page,
      director_role: slide.director_contract.page_role,
    })),
  };
  const htmlFile = deps.path.join(deliverablePaths.viewsDir, `${deliverablePaths.deliverableId}.html`);
  const shellText = deps.readPromptPackText(renderPlan.shell_file);
  deps.writeText(htmlFile, buildHtml({
    title: contract.title,
    slides,
    renderPlan,
    renderStrategy: renderPlan.render_strategy,
    shellText,
  }));
  return {
    ...deps.attachCommon('render_html', contract),
    creative_execution: creativeExecution('render_html', 'visual_authorship'),
    lifecycle_stage: 'visual_authorship',
    html_bundle: {
      html_file: htmlFile,
      page_count: slides.length,
      shell_contract: deps.CANVAS,
      render_strategy: renderPlan.render_strategy,
      director_contract: renderPlan.director_contract,
      slides,
    },
    artifact_refs: [htmlFile],
  };
}
