import { loadRenderPackCompiler } from '@redcube/pack-runtime';
export { compilePosterRenderSlides } from './render-compiler.js';

function safeText(value, fallback = '') {
  const text = String(value || '').trim();
  return text || fallback;
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function hydrateSeedVars(vars, prefix, values, max = 4) {
  const hydrated = { ...vars };
  for (let index = 0; index < max; index += 1) {
    const value = values[index] ?? values[0] ?? '';
    hydrated[`${prefix}_${index + 1}`] = value;
  }
  return hydrated;
}

function creativeSourceStamp({ route, lifecycleStage, authoredSurface, materializedFrom = 'prompt_pack_seed' }) {
  return {
    owner: 'hermes',
    primary_surface: 'hermes_backed_runtime_substrate',
    stage_owner: 'hermes_backed_runtime_substrate',
    route,
    lifecycle_stage: lifecycleStage,
    authored_surface: authoredSurface,
    materialized_from: materializedFrom,
  };
}

function creativeExecution(route, lifecycleStage) {
  return {
    owner: 'hermes',
    primary_surface: 'hermes_backed_runtime_substrate',
    route,
    lifecycle_stage: lifecycleStage,
    ownership_model: 'director_first',
  };
}

function buildBlueprintSeedVars(contract, storylineArtifact, deps) {
  const storyline = storylineArtifact?.storyline || {};
  let vars = {
    headline: safeText(storyline.headline, contract.title),
    subheadline: safeText(storyline.subheadline, contract.goal),
    audience_judgement: safeText(storyline.audience_judgement, contract.goal),
    why_now: safeText(storyline.why_now, contract.goal),
    proof_promise: safeText(storyline.proof_promise, contract.goal),
    call_to_action: safeText(storyline.call_to_action, contract.goal),
  };
  vars = hydrateSeedVars(vars, 'source_label', deps.sourceLabels(contract), 4);
  return vars;
}

function resolvePromptPackAsset(contract, relativePath, deps) {
  const assetPath = deps.safeText(relativePath);
  if (!assetPath) return '';
  if (assetPath.startsWith('prompts/')) return assetPath;
  const root = deps.safeText(contract?.prompt_pack?.root);
  if (!root) {
    throw new Error('poster_onepager hydrated contract 缺少 prompt_pack.root');
  }
  return `${root}/${assetPath}`;
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
  const slidesLiteral = `\n[${slides.map((slide) => `\n  { slideId: '${slide.slide_id}', title: ${JSON.stringify(slide.title)}, recipeId: '${slide.recipe_id}', templateId: '${slide.template_id}', content: \`${escapeTemplate(slide.content)}\` }`).join(',')}\n]`;
  return shellText
    .replaceAll('__REDCUBE_TITLE__', escapeHtml(title))
    .replaceAll('__REDCUBE_RENDER_STRATEGY__', escapeHtml(renderStrategy.replaceAll('_', '-')))
    .replaceAll('__REDCUBE_RENDER_PLAN__', escapeHtml(JSON.stringify(renderPlan)))
    .replaceAll('__REDCUBE_SLIDES_DATA__', slidesLiteral);
}

export function buildPosterBlueprint(contract, storylineArtifact, deps) {
  const seed = deps.promptSeed(contract, 'poster_blueprint', buildBlueprintSeedVars(contract, storylineArtifact, deps));
  const authoredBlueprint = seed?.poster_blueprint || {};
  const panels = deps.safeArray(authoredBlueprint.panels).map((panel) => ({
    panel_id: deps.safeText(panel.panel_id),
    region: deps.safeText(panel.region),
    label: deps.safeText(panel.label),
    text: deps.safeText(panel.text),
    support_points: deps.safeArray(panel.support_points).map((item) => deps.safeText(item)).filter(Boolean),
  }));
  if (panels.length === 0) {
    throw new Error(`Missing poster_onepager poster_blueprint runtime_seed for profile: ${contract.profile_id}`);
  }
  const sources = deps.sourceLabels(contract);
  const storyline = storylineArtifact?.storyline || {};
  return {
    ...deps.attachCommon('poster_blueprint', contract),
    creative_execution: creativeExecution('poster_blueprint', 'story_architecture'),
    lifecycle_stage: 'story_architecture',
    poster_blueprint: {
      headline: deps.safeText(authoredBlueprint.headline, storyline.headline),
      subheadline: deps.safeText(authoredBlueprint.subheadline, storyline.subheadline),
      render_recipe_id: deps.safeText(authoredBlueprint.render_recipe_id, 'poster.evidence_columns'),
      slides: [
        {
          slide_id: 'P01',
          slide_no: 1,
          title: deps.safeText(authoredBlueprint.headline, contract.title),
          layout_family: deps.safeText(panels[1]?.region || panels[0]?.region, 'evidence_columns'),
          render_recipe_id: deps.safeText(authoredBlueprint.render_recipe_id, 'poster.evidence_columns'),
          page_goal: deps.safeText(contract.goal),
          headline: deps.safeText(authoredBlueprint.headline, storyline.headline),
          subheadline: deps.safeText(authoredBlueprint.subheadline, storyline.subheadline),
          audience_judgement: deps.safeText(storyline.audience_judgement),
          why_now: deps.safeText(storyline.why_now),
          proof_promise: deps.safeText(storyline.proof_promise),
          call_to_action: deps.safeText(storyline.call_to_action),
          panels,
          evidence_and_sources: sources.slice(0, 2).map((source, sourceIndex) => ({
            source_id: `SRC-${sourceIndex + 1}`,
            public_label: source,
          })),
          visual_presentation: {
            layout_family: deps.safeText(panels[1]?.region || panels[0]?.region, 'evidence_columns'),
            anchor_tracks: deps.safeArray(authoredBlueprint.anchor_tracks).map((item) => deps.safeText(item)).filter(Boolean),
            canvas: deps.CANVAS,
          },
          creative_sources: {
            major_blueprint_text: creativeSourceStamp({
              route: 'poster_blueprint',
              lifecycleStage: 'story_architecture',
              authoredSurface: 'major_blueprint_text',
            }),
            render_recipe_id: creativeSourceStamp({
              route: 'poster_blueprint',
              lifecycleStage: 'visual_authorship',
              authoredSurface: 'render_recipe_id',
            }),
          },
        },
      ],
      quality_guards: {
        require_visual_direction_before_html: true,
        forbid_template_route_tokens: deps.BANNED_RENDER_TOKENS,
        canvas: deps.CANVAS,
      },
    },
  };
}

export function buildPosterVisualDirection(contract, blueprintArtifact, mode, baselineDeliverableId, deps) {
  const seed = deps.promptSeed(contract, 'visual_direction', { title: contract.title });
  const visualSeed = seed?.visual_direction || {};
  return {
    ...deps.attachCommon('visual_direction', contract),
    creative_execution: creativeExecution('visual_direction', 'visual_authorship'),
    lifecycle_stage: 'visual_authorship',
    mode,
    visual_direction: {
      visual_manifest: deps.safeText(visualSeed.visual_manifest),
      poster_motif: deps.safeText(visualSeed.poster_motif),
      peak_region: deps.safeText(visualSeed.peak_region, 'hero_band'),
      panel_emphasis: visualSeed.panel_emphasis || {},
      page_family_ceiling: visualSeed.page_family_ceiling || {},
      anti_template_constraints: deps.safeArray(visualSeed.anti_template_constraints),
      forbidden_regressions: deps.safeArray(visualSeed.forbidden_regressions),
      final_instruction_to_html_generator: deps.safeArray(visualSeed.final_instruction_to_html_generator),
      palette: {
        paper: deps.safeText(visualSeed?.palette?.paper, '#FFF9F1'),
        ink: deps.safeText(visualSeed?.palette?.ink, '#0F172A'),
        accent: deps.safeText(visualSeed?.palette?.accent, '#1D4ED8'),
        highlight: deps.safeText(visualSeed?.palette?.highlight, '#F97316'),
      },
      baseline_deliverable_id: mode === 'optimize_existing' ? deps.safeText(baselineDeliverableId) || null : null,
      creative_sources: {
        visual_manifest: creativeSourceStamp({
          route: 'visual_direction',
          lifecycleStage: 'visual_authorship',
          authoredSurface: 'visual_direction_major_expression',
        }),
        poster_motif: creativeSourceStamp({
          route: 'visual_direction',
          lifecycleStage: 'visual_authorship',
          authoredSurface: 'visual_direction_major_expression',
        }),
        page_family_ceiling: creativeSourceStamp({
          route: 'visual_direction',
          lifecycleStage: 'visual_authorship',
          authoredSurface: 'visual_direction_major_expression',
        }),
      },
      blueprint_slide_count: deps.safeArray(blueprintArtifact?.poster_blueprint?.slides).length,
    },
  };
}

export async function buildPosterRenderArtifact({ workspaceRoot, topicId, deliverableId, contract, deliverablePaths }, deps) {
  const blueprintArtifact = deps.readStageArtifact(contract, deliverablePaths, 'poster_blueprint');
  const visualArtifact = deps.readStageArtifact(contract, deliverablePaths, 'visual_direction');
  const contractRender = deps.renderContract(contract);
  const renderArtifact = deps.promptArtifact(contract, 'render_html')?.render_markup_artifact || {};
  const recipeMarkupRegistry = renderArtifact.authored_markup_registry || {};
  if (Object.keys(recipeMarkupRegistry).length === 0) {
    throw new Error(`Missing poster_onepager render_html authored markup registry for profile: ${contract.profile_id}`);
  }
  const compiler = await loadRenderPackCompiler(contract);
  const slides = await compiler.compileRenderSlides({
    slides: blueprintArtifact.poster_blueprint.slides,
    visualDirection: visualArtifact.visual_direction,
    canvas: deps.CANVAS,
    recipeMarkupRegistry,
    recipeMarkupArtifacts: Object.fromEntries(
      Object.entries(recipeMarkupRegistry).map(([recipeId, relativePath]) => [
        recipeId,
        deps.readPromptPackText(resolvePromptPackAsset(contract, deps.safeText(relativePath), deps)),
      ]),
    ),
  });
  const renderPlan = {
    render_strategy: deps.safeText(contractRender.render_strategy, 'prompt_director_first'),
    shell_file: resolvePromptPackAsset(contract, deps.safeText(contractRender.shell_file, 'render_shell.html'), deps),
    pack_id: deps.safeText(contract?.prompt_pack?.pack_id),
    authored_markup_surface: deps.safeText(renderArtifact.artifact_surface, 'prompt_pack_artifact'),
    markup_binding_model: deps.safeText(renderArtifact.binding_model, 'slot_hydration_only'),
    peak_region: deps.safeText(visualArtifact?.visual_direction?.peak_region, 'hero_band'),
    slides: slides.map((slide) => ({
      slide_id: slide.slide_id,
      title: slide.title,
      layout_family: slide.layout_family,
      recipe_id: slide.recipe_id,
      template_id: slide.template_id,
    })),
  };
  const htmlFile = deps.path.join(deliverablePaths.viewsDir, `${deliverableId}.html`);
  const slidesFile = deps.path.join(deliverablePaths.viewsDir, `${deliverableId}.slides.json`);
  const shellText = deps.readPromptPackText(renderPlan.shell_file);
  deps.writeText(htmlFile, buildHtml({
    title: contract.title,
    slides,
    renderPlan,
    renderStrategy: renderPlan.render_strategy,
    shellText,
  }));
  deps.writeJson(slidesFile, {
    title: contract.title,
    slides: slides.map((slide) => ({
      slideId: slide.slide_id,
      title: slide.title,
      recipeId: slide.recipe_id,
      content: slide.content,
    })),
  });
  return {
    ...deps.attachCommon('render_html', contract),
    creative_execution: creativeExecution('render_html', 'visual_authorship'),
    lifecycle_stage: 'visual_authorship',
    html_bundle: {
      html_file: htmlFile,
      page_count: slides.length,
      shell_contract: deps.CANVAS,
      render_strategy: renderPlan.render_strategy,
      director_contract: {
        poster_motif: deps.safeText(visualArtifact?.visual_direction?.poster_motif),
        peak_region: deps.safeText(visualArtifact?.visual_direction?.peak_region, 'hero_band'),
        page_family_ceiling: visualArtifact?.visual_direction?.page_family_ceiling || {},
        anti_template_constraints: deps.safeArray(visualArtifact?.visual_direction?.anti_template_constraints),
      },
      slides,
      render_plan: renderPlan,
    },
    artifact_refs: [htmlFile, slidesFile],
  };
}
