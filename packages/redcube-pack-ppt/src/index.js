import { loadRenderPackCompiler } from '@redcube/pack-runtime';
export { compilePptRenderSlides } from './render-compiler.js';

function escapeHtml(text) {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeTemplate(text) {
  return String(text || '').replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
}

function buildDeckHtml({ title, slidesMarkup, renderPlan, renderStrategy, shellText }) {
  const slidesLiteral = `\n[${slidesMarkup.map((slide) => `\n  { slideId: '${slide.slide_id}', title: ${JSON.stringify(slide.title)}, layoutFamily: '${slide.layout_family}', recipeId: '${slide.recipe_id}', templateId: '${slide.template_id}', content: \`${escapeTemplate(slide.content)}\` }`).join(',')}\n]`;
  return shellText
    .replaceAll('__PPT_DECK_TITLE__', escapeHtml(title))
    .replaceAll('__REDCUBE_RENDER_STRATEGY__', escapeHtml(renderStrategy.replaceAll('_', '-')))
    .replaceAll('__REDCUBE_RENDER_PLAN__', escapeHtml(JSON.stringify(renderPlan)))
    .replaceAll('__PPT_DECK_SLIDES_DATA__', slidesLiteral);
}

function deckPreset(profileId) {
  switch (profileId) {
    case 'lecture_student':
      return {
        speaker: '教学型讲者',
        audience: '医学生与住院学员',
        promise: '让学生看懂 AI 不是工具清单，而是问题拆解、证据判断与执行闭环',
        speaker_seconds: 55,
      };
    case 'lecture_peer':
      return {
        speaker: '同行讲者',
        audience: '临床科研同行',
        promise: '让同行快速对齐问题、方法、证据与边界',
        speaker_seconds: 65,
      };
    case 'executive_briefing':
      return {
        speaker: '汇报型讲者',
        audience: '医院管理层',
        promise: '让决策者先看到关键判断，再理解资源路径与风险',
        speaker_seconds: 45,
      };
    default:
      return {
        speaker: '正式讲者',
        audience: '专业听众',
        promise: '让听众带走可复用的判断框架与动作路径',
        speaker_seconds: 60,
      };
  }
}

function anchorTracksForFamily(layoutFamily) {
  switch (layoutFamily) {
    case 'central_axis':
      return ['vertical-axis', 'judgement-stops'];
    case 'timeline_band':
      return ['horizontal-track', 'timeline-stops'];
    case 'judgement_ladder':
      return ['ladder-rungs', 'action-checkpoints'];
    case 'ring_cross':
      return ['center-hub', 'cross-zones'];
    case 'multi_zone_compare':
      return ['left-zone', 'center-divider', 'right-zone'];
    default:
      return ['title-column', 'argument-band'];
  }
}

function creativeSourceStamp({ route, lifecycleStage, authoredSurface, materializedFrom = 'prompt_runtime_seed' }) {
  return {
    owner: 'host_agent',
    primary_surface: 'codex_native_host_agent',
    stage_owner: 'codex_native_host_agent',
    route,
    lifecycle_stage: lifecycleStage,
    ownership_model: 'director_first',
    authored_surface: authoredSurface,
    materialized_from: materializedFrom,
  };
}

function creativeExecution(lifecycleStage) {
  return {
    owner: 'host_agent',
    primary_surface: 'codex_native_host_agent',
    lifecycle_stage: lifecycleStage,
    ownership_model: 'director_first',
  };
}

function buildOutlineSeedVars(contract, deps) {
  const publicSources = deps.sharedSourceLabels(contract);
  return {
    title: deps.safeText(contract.title || '未命名课件'),
    goal: deps.safeText(contract.goal || '讲清主线与动作'),
    profile_id: contract.profile_id,
    public_source_1: publicSources[0],
    public_source_2: publicSources[1],
    public_source_3: publicSources[2],
  };
}

function resolvePromptPackAsset(contract, relativePath, deps) {
  const assetPath = deps.safeText(relativePath);
  if (!assetPath) return '';
  if (assetPath.startsWith('prompts/')) {
    return assetPath;
  }
  const root = deps.safeText(contract?.prompt_pack?.root, 'prompts/ppt_deck');
  return `${root}/${assetPath}`;
}

function outlineSeed(contract, deps) {
  return deps.promptSeed('detailed_outline', buildOutlineSeedVars(contract, deps)) || {};
}

export function buildPptOutlineSlides(contract, deps) {
  const publicSources = deps.sharedSourceLabels(contract);
  const seed = outlineSeed(contract, deps);
  const slides = deps.safeArray(seed?.slides);

  if (slides.length === 0) {
    throw new Error(`Missing ppt_deck detailed_outline runtime_seed for profile: ${contract.profile_id}`);
  }

  return slides.map((slide) => {
    if (!deps.safeText(slide.render_recipe_id)) {
      throw new Error(`Missing ppt render_recipe_id in detailed_outline seed: ${slide.slide_id}`);
    }

    return {
      ...slide,
      public_sources: deps.safeArray(slide.public_sources).length > 0
        ? slide.public_sources
        : publicSources.slice(0, 3),
    };
  });
}

function toBlueprintContent(slide, deps) {
  const explicit = deps.safeArray(slide.page_core_content);
  const fallback = [
    deps.safeText(slide.core_sentence),
    ...deps.safeArray(slide.evidence_points),
  ].filter(Boolean);
  const items = explicit.length > 0 ? explicit : fallback;
  return items.map((text, index) => ({
    label: index === 0 ? '核心句' : `展开${index}`,
    text,
  }));
}

function hydrateBlueprintSlidesFromPromptPack(contract, slides, deps) {
  const preset = deckPreset(contract.profile_id);
  return slides.map((slide, index) => ({
    slide_id: slide.slide_id,
    slide_no: slide.slide_no,
    page_type: slide.page_type,
    title: slide.title,
    page_goal: slide.page_goal,
    core_sentence: slide.core_sentence,
    render_recipe_id: slide.render_recipe_id,
    page_core_content: toBlueprintContent(slide, deps),
    visual_presentation: {
      layout_family: slide.layout_family,
      anchor_tracks: deps.safeArray(slide.visual_anchor_tracks).length > 0
        ? slide.visual_anchor_tracks
        : anchorTracksForFamily(slide.layout_family),
      canvas: deps.CANVAS,
    },
    evidence_and_sources: deps.safeArray(slide.public_sources).map((source, sourceIndex) => ({
      source_id: `SRC-${slide.slide_no}-${sourceIndex + 1}`,
      public_label: source,
    })),
    speaker_notes: deps.safeText(slide.speaker_notes)
      || `${deps.safeText(slide.core_sentence)}。先用一句话点明本页任务，再按 ${deps.safeArray(slide.evidence_points).length} 个展开点说明为什么这一步不能跳过。`,
    speaker_seconds: preset.speaker_seconds + (slide.layout_family === 'judgement_ladder' ? 10 : 0),
    transition_sentence: deps.safeText(slide.transition_sentence)
      || (index === slides.length - 1
        ? '最后用一句总结把主线收束。'
        : `讲完这一页后，顺着“${slides[index + 1].title}”进入下一页。`),
    creative_sources: {
      page_core_content: creativeSourceStamp({
        route: 'slide_blueprint',
        lifecycleStage: 'story_architecture',
        authoredSurface: 'major_blueprint_text',
      }),
      speaker_notes: creativeSourceStamp({
        route: 'slide_blueprint',
        lifecycleStage: 'story_architecture',
        authoredSurface: 'major_blueprint_text',
      }),
      transition_sentence: creativeSourceStamp({
        route: 'slide_blueprint',
        lifecycleStage: 'story_architecture',
        authoredSurface: 'major_blueprint_text',
      }),
    },
    creative_authorship: {
      page_core_content: creativeSourceStamp({
        route: 'slide_blueprint',
        lifecycleStage: 'story_architecture',
        authoredSurface: 'major_blueprint_text',
      }),
      speaker_notes: creativeSourceStamp({
        route: 'slide_blueprint',
        lifecycleStage: 'story_architecture',
        authoredSurface: 'major_blueprint_text',
      }),
      transition_sentence: creativeSourceStamp({
        route: 'slide_blueprint',
        lifecycleStage: 'story_architecture',
        authoredSurface: 'major_blueprint_text',
      }),
    },
  }));
}

export function buildPptDetailedOutline(contract, deps) {
  const seed = outlineSeed(contract, deps);
  const slides = buildPptOutlineSlides(contract, deps);
  return {
    ...deps.attachCommon('detailed_outline', contract),
    creative_execution: creativeExecution(contract.lifecycle_model?.route_to_stage?.detailed_outline || 'story_architecture'),
    lifecycle_stage: contract.lifecycle_model?.route_to_stage?.detailed_outline || 'story_architecture',
    detailed_outline: {
      chapter_structure: deps.safeArray(seed?.chapter_structure),
      page_budget: {
        total_slides: slides.length,
      },
      slides: slides.map((slide, index) => ({
        slide_no: String(slide.slide_no).padStart(2, '0'),
        title: slide.title,
        page_objective: slide.page_objective,
        core_sentence: slide.core_sentence,
        evidence_points: slide.evidence_points,
        public_sources: slide.public_sources,
        page_core_content: toBlueprintContent(slide, deps).map((item) => item.text),
        speaker_notes: deps.safeText(slide.speaker_notes)
          || `${deps.safeText(slide.core_sentence)}。先用一句话点明本页任务，再按 ${deps.safeArray(slide.evidence_points).length} 个展开点说明为什么这一步不能跳过。`,
        transition_sentence: deps.safeText(slide.transition_sentence)
          || (index === slides.length - 1
            ? '最后用一句总结把主线收束。'
            : `讲完这一页后，顺着“${slides[index + 1].title}”进入下一页。`),
        render_recipe_id: slide.render_recipe_id,
        creative_sources: {
          major_text: creativeSourceStamp({
            route: 'detailed_outline',
            lifecycleStage: 'story_architecture',
            authoredSurface: 'outline_major_text',
          }),
        },
        creative_authorship: {
          major_text: creativeSourceStamp({
            route: 'detailed_outline',
            lifecycleStage: 'story_architecture',
            authoredSurface: 'outline_major_text',
          }),
        },
      })),
    },
  };
}

export function buildPptSlideBlueprint(contract, deps) {
  const seed = deps.promptSeed('slide_blueprint') || {};
  const slides = buildPptOutlineSlides(contract, deps);
  return {
    ...deps.attachCommon('slide_blueprint', contract),
    creative_execution: creativeExecution(contract.lifecycle_model?.route_to_stage?.slide_blueprint || 'story_architecture'),
    lifecycle_stage: contract.lifecycle_model?.route_to_stage?.slide_blueprint || 'story_architecture',
    slide_blueprint: {
      chapter_goal: deps.safeText(seed?.chapter_goal),
      slides: hydrateBlueprintSlidesFromPromptPack(contract, slides, deps),
      quality_guards: {
        ...(seed?.quality_guards || {}),
        require_visual_direction_before_html: true,
        forbid_template_route_tokens: deps.BANNED_RENDER_TOKENS,
        canvas: deps.CANVAS,
      },
      profile_checks: deps.safeArray(seed?.profile_checks?.[contract.profile_id]),
    },
  };
}

export function buildPptVisualDirection(contract, blueprintArtifact, mode, baselineDeliverableId, deps) {
  const slides = blueprintArtifact.slide_blueprint.slides;
  const visualSeed = deps.promptSeed('visual_direction', { title: contract.title })?.visual_direction || {};
  return {
    ...deps.attachCommon('visual_direction', contract),
    creative_execution: creativeExecution(contract.lifecycle_model?.route_to_stage?.visual_direction || 'visual_authorship'),
    lifecycle_stage: contract.lifecycle_model?.route_to_stage?.visual_direction || 'visual_authorship',
    visual_direction: {
      visual_manifest: deps.safeText(visualSeed.visual_manifest),
      what_it_is: deps.safeArray(visualSeed.what_it_is),
      what_it_is_not: deps.safeArray(visualSeed.what_it_is_not),
      palette: visualSeed.palette,
      continuity_constraints: deps.safeArray(visualSeed.continuity_constraints),
      rhythm_curve: deps.safeArray(visualSeed.rhythm_curve),
      peak_pages: deps.safeArray(visualSeed.peak_pages),
      page_family_ceiling: visualSeed.page_family_ceiling || {},
      forbidden_regressions: deps.safeArray(visualSeed.forbidden_regressions),
      page_role_table: slides.map((slide) => ({
        slide_id: slide.slide_id,
        title: slide.title,
        page_role: slide.visual_presentation.layout_family,
        first_glance: slide.visual_presentation.anchor_tracks[0],
        second_glance: slide.visual_presentation.anchor_tracks[1] || slide.visual_presentation.anchor_tracks[0],
      })),
      final_instruction_to_html_generator: deps.safeArray(visualSeed.final_instruction_to_html_generator),
      source_truth_confidence: deps.sharedSourceConfidence(contract) || 'low',
      baseline_deliverable_id: deps.safeText(baselineDeliverableId) || null,
      mode,
      creative_sources: {
        visual_manifest: creativeSourceStamp({
          route: 'visual_direction',
          lifecycleStage: 'visual_authorship',
          authoredSurface: 'visual_direction_major_expression',
        }),
        rhythm_curve: creativeSourceStamp({
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
      creative_authorship: {
        visual_direction: creativeSourceStamp({
          route: 'visual_direction',
          lifecycleStage: 'visual_authorship',
          authoredSurface: 'visual_direction_major_expression',
        }),
      },
    },
  };
}

export async function buildPptRenderArtifact({ workspaceRoot, topicId, deliverableId, contract, deliverablePaths }, deps) {
  const blueprintArtifact = deps.readStageArtifact(contract, deliverablePaths, 'slide_blueprint');
  const visualArtifact = deps.readStageArtifact(contract, deliverablePaths, 'visual_direction');
  const contractRender = deps.renderContract(contract);
  const compiler = await loadRenderPackCompiler(contract);
  const slidesMarkup = await compiler.compileRenderSlides({
    slides: blueprintArtifact.slide_blueprint.slides,
    visualDirection: visualArtifact.visual_direction,
    renderContract: contractRender,
    canvas: deps.CANVAS,
    recipeTemplates: Object.fromEntries(
      Object.entries(contractRender.template_registry || {}).map(([recipeId, relativePath]) => [
        recipeId,
        deps.readPromptPackText(resolvePromptPackAsset(contract, relativePath, deps)),
      ]),
    ),
  });
  const renderPlan = {
    render_strategy: deps.safeText(contractRender.render_strategy, 'prompt_director_first'),
    shell_file: deps.safeText(contractRender.shell_file, 'render_shell.html'),
    pack_id: deps.safeText(contract?.prompt_pack?.pack_id),
    generator_instructions: deps.safeArray(visualArtifact.visual_direction?.final_instruction_to_html_generator),
    peak_pages: deps.safeArray(visualArtifact.visual_direction?.peak_pages),
    page_family_ceiling: visualArtifact.visual_direction?.page_family_ceiling || {},
    slides: slidesMarkup.map((slide) => ({
      slide_id: slide.slide_id,
      title: slide.title,
      layout_family: slide.layout_family,
      recipe_id: slide.recipe_id,
      template_id: slide.template_id,
      peak_page: slide.director_contract.peak_page,
    })),
  };
  const htmlFile = deps.path.join(deliverablePaths.viewsDir, `${deliverableId}.html`);
  const slidesFile = deps.path.join(deliverablePaths.viewsDir, `${deliverableId}.slides.json`);
  const shellText = deps.readPromptPackText(resolvePromptPackAsset(
    contract,
    deps.safeText(contractRender.shell_file, 'render_shell.html'),
    deps,
  ));
  deps.writeText(htmlFile, buildDeckHtml({
    title: contract.title,
    slidesMarkup,
    renderPlan,
    renderStrategy: renderPlan.render_strategy,
    shellText,
  }));
  deps.writeJson(slidesFile, {
    title: contract.title,
    slides: slidesMarkup.map((slide) => ({
      slideId: slide.slide_id,
      title: slide.title,
      recipeId: slide.recipe_id,
      content: slide.content,
    })),
  });
  return {
    ...deps.attachCommon('render_html', contract),
    creative_execution: creativeExecution(contract.lifecycle_model?.route_to_stage?.render_html || 'visual_authorship'),
    lifecycle_stage: contract.lifecycle_model?.route_to_stage?.render_html || 'visual_authorship',
    html_bundle: {
      html_file: htmlFile,
      slides_file: slidesFile,
      page_count: slidesMarkup.length,
      render_strategy: renderPlan.render_strategy,
      generator_instructions: renderPlan.generator_instructions,
      shell_contract: {
        ratio: deps.CANVAS.ratio,
        width: deps.CANVAS.width,
        height: deps.CANVAS.height,
        controls: ['slide-display-area', 'prev-btn', 'next-btn'],
      },
      slides: slidesMarkup,
    },
    artifact_refs: [htmlFile, slidesFile],
  };
}
