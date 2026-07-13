// @ts-nocheck
import { createPptDeckRenderBatchCacheParts } from './render-batch-cache.js';
import { createPptDeckRenderRevisionParts } from './render-revision.js';

export function createPptDeckRenderStageParts(deps) {
  const {
    CANVAS,
    CODEX_DEFAULT_ADAPTER,
    CREATIVE_MATERIALIZED_FROM,
    PAGE_FIX_ROUTE,
    PROMPT_PACK,
    PYTHON_EXPORT,
    PYTHON_REVIEW,
    RENDER_HTML_BATCH_SIZE,
    RENDER_REFERENCE_SLIDE_WINDOW,
    SCREENSHOT_REVIEW_BATCH_SIZE,
    TARGETED_RENDER_HTML_BATCH_SIZE,
    aiFirstMechanicalCheckValue,
    attachCommon,
    buildAiFirstVisualSlideReview,
    buildAuthoringContext,
    buildDeckHtml,
    chunkArray,
    collectSlidesNeedingTargetedRevision,
    compareFailuresAndDensity,
    createReviewCapturePaths,
    creativeExecution,
    creativeSourceStamp,
    currentHtmlStageId,
    deriveProfileChecks,
    deriveScreenshotReviewRerunStage,
    directorReviewOutputContract,
    ensureDir,
    existsSync: mainExistsSync,
    extraChecks,
    generateStructuredArtifact,
    getDeliverablePaths,
    getDeliverableViewSurfacePaths,
    getReviewState,
    hasAiVisualBlock,
    hydrateRenderedSlideRootMetadata,
    isBaselineApprovedState,
    loadOperatorRevisionBrief,
    normalizeInlineText,
    normalizePptScreenshotAiSlideReviews,
    normalizeStringList,
    normalizeTypographyPlan,
    primarySurface,
    readCurrentHtmlArtifact,
    readJson,
    readPromptPackText,
    readStageArtifact,
    renderHtmlOutputContract,
    renderHtmlSummaryOutputContract,
    requireText,
    resolvePromptPackAsset,
    resolveRedCubePythonCommand,
    safeArray,
    safeFileMtimeMs,
    safeText,
    screenshotReviewSlideBatchOutputContract,
    screenshotReviewSummaryOutputContract,
    seedDeliverableStableViews,
    stageArtifactPath,
    summarizeBlueprintSlides,
    summarizeRelativeQuality,
    validateRenderedReviewAnchors,
    validateRenderedSlideContent,
    writeJson,
    writeText,
  } = deps;
  const {
    buildRenderBatchCacheKey,
    buildRenderBatchReferenceSlides,
    buildRenderBatchStageId,
    executeRenderBatchStagesDurably,
    renderBatchCacheFile,
  } = createPptDeckRenderBatchCacheParts(deps);
  const {
    buildRenderHtmlBlueprintSlides,
    buildRenderHtmlSectionBatches,
    buildRenderRevisionContext,
    buildRenderRevisionFocusMap,
    buildRenderRevisionLocalFileInspection,
    buildRenderSummaryRevisionDigest,
    buildRenderVisualDirectionContext,
    computeRenderRevisionFreshness,
    filterRenderRevisionContextForSlides,
    htmlDesignCompanion,
    htmlRouteQualityCompanion,
    loadPriorRenderedSlideHtmlMap,
    planRenderHtmlExecution,
    renderContract,
  } = createPptDeckRenderRevisionParts(deps);

  function renderedSlideTitle(contentHtml, fallbackTitle) {
    const headingMatch = safeText(contentHtml).match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i);
    const headingText = headingMatch
      ? normalizeInlineText(headingMatch[1].replace(/<[^>]+>/g, ' '), 160)
      : '';
    return headingText || safeText(fallbackTitle);
  }

  async function generateRenderHtmlDraft({
    workspaceRoot,
    deliverableId,
    contract,
    deliverablePaths,
    route = 'render_html',
    requireTargetedRevision = false,
    adapter = CODEX_DEFAULT_ADAPTER,
  }) {
    const blueprintArtifact = readStageArtifact(contract, deliverablePaths, 'slide_blueprint');
    const detailedOutlineArtifact = readStageArtifact(contract, deliverablePaths, 'detailed_outline');
    const visualArtifact = readStageArtifact(contract, deliverablePaths, 'visual_direction');
    const previousRenderArtifact = readCurrentHtmlArtifact(contract, deliverablePaths);
    const revisionFreshness = computeRenderRevisionFreshness(contract, deliverablePaths, route);
    const sharedRevisionContext = buildRenderRevisionContext({
      workspaceRoot,
      contract,
      deliverablePaths,
      deliverableId,
      minimumMtimeMs: revisionFreshness.revision_floor_mtime_ms,
    });
    const priorRenderedSlides = loadPriorRenderedSlideHtmlMap(previousRenderArtifact);
    const blueprintSlides = buildRenderHtmlBlueprintSlides(
      blueprintArtifact,
      sharedRevisionContext,
      detailedOutlineArtifact,
    );
    const renderPlan = planRenderHtmlExecution({
      blueprintSlides,
      revisionContext: sharedRevisionContext,
      priorRenderArtifact: previousRenderArtifact,
      forceFullRegeneration: revisionFreshness.force_full_regeneration,
    });
    if (requireTargetedRevision && renderPlan.mode !== 'targeted_revision_only') {
      throw new Error(`Route ${route} requires targeted revision context and a prior current HTML artifact`);
    }
    const promptRelativePath = PROMPT_PACK[route] || PROMPT_PACK.render_html;
    const renderBatchSize = renderPlan.mode === 'targeted_revision_only'
      ? TARGETED_RENDER_HTML_BATCH_SIZE
      : RENDER_HTML_BATCH_SIZE;
    const typographyPlan = normalizeTypographyPlan(visualArtifact?.visual_direction?.typography_plan);
    const fullVisualDirection = {
      ...(visualArtifact?.visual_direction || {}),
      typography_plan: typographyPlan,
    };
    const htmlQualityCompanion = htmlRouteQualityCompanion(contract);
    const sharedContext = {
      ...buildAuthoringContext(contract),
      deck_style_reference: {
        typography_plan: typographyPlan,
        reference_window: RENDER_REFERENCE_SLIDE_WINDOW,
        continuity_rules: [
          '整套 deck 使用同一套标题、卡片标题、正文、标签与页码字号梯度；除封面外，不允许某页整体突然变大或缩小。',
          '若按 batch 生成，后续批次只能参考前面最多三页的 style tokens、typography、palette、spacing 与 visual summary，不得继承其布局结构。',
          '自然换行、纵向信息分布和页码语法应在全套视觉体系内保持可读与一致。',
        ],
      },
      shell_contract: {
        ratio: CANVAS.ratio,
        width: CANVAS.width,
        height: CANVAS.height,
        controls: ['slide-display-area', 'prev-btn', 'next-btn'],
      },
      html_guardrails: [
        '每页输出完整 slide root，必须包含 data-slide-root=true 与匹配的 data-slide-id。',
        '每页至少提供 2 个语义化 data-qa-block，并至少标记 1 个 data-primary-point=true，供截图审稿读取布局结构。',
        '严格遵守 audience_visibility_contract：speaker_notes、transition_sentence、page_goal、page_objective、visual_anchor_tracks、operator_playbook、revision_context、source_id、material_id 都是作者/系统工作面，不得被写入任何听众可见标题、正文、页脚、badge 或卡片。',
        '使用用户批准的对外命名；内部编号、讲稿/制作说明和审阅语言只留在作者或 provenance 面。',
        '标题、主体、注释、页脚和所有带字元素必须按当前视觉方向保持可读层级、自然换行、稳定包含关系、清楚间距与完整画幅。',
        '结构线、视觉锚点、图标、badge 和装饰不得遮挡或替代正文语义；重复页面家族应按当前 claim/proof object 形成真实差异。',
        '若某页带 revision_focus，消费其当前 findings、keep/avoid 和 recommended_fix，但由 executor 选择能关闭根因的最小 coherent repair。',
        'reference_slides 只提供 style/typography/palette/spacing 连续性，不提供可复制布局。',
        '若已有上一轮通过的 render_html 产物，且 revision_context 只点名部分 blocked slides，则只重画这些页面，其余通过页应保持原样复用，不要重新发明已通过页面。',
        '不要使用 renderSlide/layoutByType/cardsGrid/pageType，不要输出 <script>/<style> block，也不要把模板注册表或内部文档写入 HTML。',
        'HTML 必须由 AI 直接创作，不得退化成固定 slot/template compiler 产物。',
      ],
      ui_ux_quality_companion: htmlDesignCompanion(contract),
      html_route_quality_companion: htmlQualityCompanion,
      deck_slide_count: blueprintSlides.length,
    };
    const slideBatches = renderPlan.mode === 'targeted_revision_only'
      ? chunkArray(renderPlan.slides_to_render, renderBatchSize)
      : buildRenderHtmlSectionBatches(renderPlan.slides_to_render, renderBatchSize);
    const availableReferenceSlides = renderPlan.mode === 'targeted_revision_only'
      ? new Map(priorRenderedSlides)
      : new Map();
    const renderBatchStages = [];
    for (const [batchIndex, slideBatch] of slideBatches.entries()) {
      const promptSlides = slideBatch.map((slide) => ({
        ...slide,
        current_content_html: priorRenderedSlides.get(safeText(slide?.slide_id)) || null,
      }));
      const buildRenderBatchStage = ({ previousResults = [] } = {}) => {
        const renderedSlideHtmlById = new Map(availableReferenceSlides);
        for (const result of safeArray(previousResults)) {
          for (const slide of safeArray(result?.data?.slides)) {
            const slideId = safeText(slide?.slide_id);
            const contentHtml = safeText(slide?.content_html);
            if (slideId && contentHtml) {
              renderedSlideHtmlById.set(slideId, contentHtml);
            }
          }
        }
        const referenceSlides = route === PAGE_FIX_ROUTE
          ? []
          : buildRenderBatchReferenceSlides({
              blueprintSlides,
              slideBatch,
              renderedSlideHtmlById,
            });
        const batchSlideIds = promptSlides.map((slide) => slide.slide_id);
        const visualDirectionContext = buildRenderVisualDirectionContext(
          fullVisualDirection,
          batchSlideIds,
          route,
        );
        const revisionContext = filterRenderRevisionContextForSlides(
          sharedRevisionContext,
          batchSlideIds,
        );
        const cacheKey = buildRenderBatchCacheKey({
          route,
          renderPlan,
          revisionFreshness,
          promptSlides,
          referenceSlides,
          promptRelativePath,
          visualDirectionContext,
          revisionContext,
        });
        return {
          family: 'ppt_deck',
          route,
          promptRelativePath,
          context: {
            ...sharedContext,
            visual_direction: visualDirectionContext,
            render_scope: 'slide_batch',
            rerender_mode: renderPlan.mode,
            render_batch: {
              batch_index: batchIndex + 1,
              total_batches: slideBatches.length,
              batch_mode: renderPlan.mode === 'targeted_revision_only' ? 'targeted_revision_batch' : 'section_batch',
              chapter_id: safeText(promptSlides[0]?.chapter_id),
              slide_ids: promptSlides.map((slide) => slide.slide_id),
            },
            reference_slides: referenceSlides,
            blueprint: {
              slides: promptSlides,
            },
            revision_context: revisionContext,
          },
          outputContract: renderHtmlOutputContract(),
          cwd: deliverablePaths.deliverableDir,
          localFileInspection: buildRenderRevisionLocalFileInspection({
            deliverablePaths,
            slideBatch,
            revisionContext: sharedRevisionContext,
          }),
          cache_key: cacheKey,
          cache_file: renderBatchCacheFile(deliverablePaths, route, buildRenderBatchStage.stage_id),
          promptSlides,
          referenceSlides,
        };
      };
      buildRenderBatchStage.stage_id = buildRenderBatchStageId(route, batchIndex, slideBatch);
      renderBatchStages.push(buildRenderBatchStage);
    }
    const renderBatchResult = await executeRenderBatchStagesDurably({
      adapter,
      deliverablePaths,
      route,
      stages: renderBatchStages,
      parallel: route === PAGE_FIX_ROUTE,
    });
    const freshlyRenderedSlides = [];
    for (const stageResult of safeArray(renderBatchResult?.data)) {
      const batchData = stageResult?.data || {};
      const batchSlides = safeArray(batchData?.slides).filter((item) => item && typeof item === 'object');
      freshlyRenderedSlides.push(...batchSlides);
      for (const slide of batchSlides) {
        const slideId = safeText(slide?.slide_id);
        const contentHtml = safeText(slide?.content_html);
        if (!slideId || !contentHtml) continue;
        availableReferenceSlides.set(slideId, contentHtml);
      }
    }
    const freshlyRenderedById = new Map(
      freshlyRenderedSlides.map((slide) => [safeText(slide?.slide_id), slide]),
    );
    const renderedSlides = blueprintSlides.map((slide) => {
      const slideId = safeText(slide?.slide_id);
      return freshlyRenderedById.get(slideId) || renderPlan.reused_slides.get(slideId);
    }).filter(Boolean);
    const { data: summaryData, generationRuntime } = await generateStructuredArtifact({
      adapter,
      family: 'ppt_deck',
      route,
      promptRelativePath,
      context: {
        ...sharedContext,
        visual_direction: buildRenderVisualDirectionContext(
          fullVisualDirection,
          freshlyRenderedSlides.map((slide) => safeText(slide?.slide_id)).filter(Boolean),
          route,
        ),
        render_scope: 'summary',
        rerender_mode: renderPlan.mode,
        blueprint: {
          slides: blueprintSlides.map((slide) => ({
            slide_id: slide.slide_id,
            title: slide.title,
            layout_family: slide.layout_family,
          })),
        },
        rendered_slide_ids: freshlyRenderedSlides.map((slide) => safeText(slide?.slide_id)).filter(Boolean),
        reused_slide_ids: [...renderPlan.reused_slides.keys()],
        revision_context: buildRenderSummaryRevisionDigest({
          revisionContext: sharedRevisionContext,
          renderedSlideIds: freshlyRenderedSlides.map((slide) => safeText(slide?.slide_id)).filter(Boolean),
          reusedSlideIds: [...renderPlan.reused_slides.keys()],
        }),
      },
      outputContract: renderHtmlSummaryOutputContract(),
      cwd: deliverablePaths.deliverableDir,
    });
    return {
      data: {
        slides: renderedSlides,
        render_summary: safeArray(summaryData?.render_summary),
      },
      generationRuntime,
      revisionContext: sharedRevisionContext,
      renderExecution: {
        route,
        mode: renderPlan.mode,
        force_full_regeneration: revisionFreshness.force_full_regeneration,
        batch_size: renderBatchSize,
        batch_count: slideBatches.length,
        codex_batch_runtime: renderBatchResult?.batchRuntime || null,
        reference_window: RENDER_REFERENCE_SLIDE_WINDOW,
        targeted_slide_ids: renderPlan.slides_to_render.map((slide) => safeText(slide?.slide_id)).filter(Boolean),
        freshly_rendered_slide_ids: freshlyRenderedSlides.map((slide) => safeText(slide?.slide_id)).filter(Boolean),
        reused_slide_ids: [...renderPlan.reused_slides.keys()],
      },
    };
  }

  async function buildRenderHtmlArtifact({
    workspaceRoot,
    deliverableId,
    contract,
    deliverablePaths,
    route = 'render_html',
    adapter = CODEX_DEFAULT_ADAPTER,
  }) {
    const blueprintArtifact = readStageArtifact(contract, deliverablePaths, 'slide_blueprint');
    const visualArtifact = readStageArtifact(contract, deliverablePaths, 'visual_direction');
    const { data, generationRuntime, revisionContext, renderExecution } = await generateRenderHtmlDraft({
      workspaceRoot,
      deliverableId,
      contract,
      deliverablePaths,
      route,
      requireTargetedRevision: route === PAGE_FIX_ROUTE,
      adapter,
    });
    const slideHtmlList = safeArray(data?.slides).filter((item) => item && typeof item === 'object');
    if (slideHtmlList.length === 0) {
      throw new Error(`upstream ppt ${route} must contain at least one slide`);
    }
    const renderFailures = [];
    const slideHtmlById = new Map();
    for (const item of slideHtmlList) {
      const slideId = safeText(item.slide_id);
      try {
        slideHtmlById.set(slideId, validateRenderedSlideContent(item.content_html, slideId));
      } catch (error) {
        renderFailures.push({
          slide_id: slideId,
          error: error instanceof Error ? error.message : String(error),
          failure_kind: 'unusable_html_page',
        });
      }
    }
    const revisionFocusBySlideId = buildRenderRevisionFocusMap(revisionContext);
    const blueprintSlides = safeArray(blueprintArtifact?.slide_blueprint?.slides);
    const slidesMarkup = blueprintSlides.flatMap((slide) => {
      const rawContent = slideHtmlById.get(slide.slide_id);
      if (!rawContent) {
        if (!renderFailures.some((failure) => failure.slide_id === slide.slide_id)) {
          renderFailures.push({
            slide_id: slide.slide_id,
            error: `upstream ppt ${route} missing slide`,
            failure_kind: 'missing_html_page',
          });
        }
        return [];
      }
      const recipeDecision = creativeSourceStamp({
        route,
        lifecycleStage: 'visual_authorship',
        authoredSurface: 'recipe_selection',
        materializedFrom: CREATIVE_MATERIALIZED_FROM,
        generationRuntime,
        adapter,
      });
      const finalMarkup = creativeSourceStamp({
        route,
        lifecycleStage: 'visual_authorship',
        authoredSurface: 'final_html_markup',
        materializedFrom: CREATIVE_MATERIALIZED_FROM,
        generationRuntime,
        adapter,
      });
      const peakPage = safeArray(visualArtifact?.visual_direction?.peak_pages).includes(slide.slide_id);
      const directorRole = safeArray(visualArtifact?.visual_direction?.page_role_table).find((item) => item.slide_id === slide.slide_id)?.page_role
        || slide.visual_presentation.layout_family;
      const content = validateRenderedReviewAnchors(
        hydrateRenderedSlideRootMetadata(rawContent, {
          'data-title': renderedSlideTitle(rawContent, slide.title),
          'data-layout-family': slide.visual_presentation.layout_family,
          'data-speaker-seconds': Number(slide.speaker_seconds || 0),
          'data-recipe-id': slide.render_recipe_id,
          'data-template-id': 'upstream_ai_html',
          'data-peak-page': peakPage ? 'true' : 'false',
          'data-director-role': directorRole,
        }, slide.slide_id),
        slide.slide_id,
      );
      return [{
        slide_id: slide.slide_id,
        slide_no: slide.slide_no,
        title: renderedSlideTitle(content, slide.title),
        layout_family: slide.visual_presentation.layout_family,
        recipe_id: slide.render_recipe_id,
        template_id: 'upstream_ai_html',
        page_goal: slide.page_goal,
        page_core_content: safeArray(slide.page_core_content),
        revision_focus: revisionFocusBySlideId.get(safeText(slide.slide_id)) || null,
        evidence_and_sources: safeArray(slide.evidence_and_sources),
        speaker_seconds: slide.speaker_seconds,
        transition_sentence: slide.transition_sentence,
        director_contract: {
          peak_page: peakPage,
          director_role: directorRole,
          generator_instructions: safeArray(visualArtifact?.visual_direction?.final_instruction_to_html_generator),
          page_family_ceiling: visualArtifact?.visual_direction?.page_family_ceiling || {},
          visual_manifest: safeText(visualArtifact?.visual_direction?.visual_manifest),
        },
        palette: visualArtifact?.visual_direction?.palette || {
          canvas: '#F7F8FC',
          ink: '#0F172A',
          accent: '#2563EB',
        },
        total_slides: safeArray(blueprintArtifact?.slide_blueprint?.slides).length,
        creative_sources: {
          recipe_selection: recipeDecision,
          final_markup: finalMarkup,
        },
        creative_authorship: {
          recipe_decision: recipeDecision,
          final_html_markup: finalMarkup,
        },
        markup_contract_source: CREATIVE_MATERIALIZED_FROM,
        content,
      }];
    });
    if (slidesMarkup.length === 0) {
      const error = new Error(`upstream ppt ${route} produced no consumable HTML pages`);
      error.failure_kind = 'no_output_diagnostic';
      throw error;
    }
    const contractRender = renderContract(contract);
    const renderPlan = {
      render_strategy: safeText(contractRender.render_strategy, 'upstream_structured_ai_html'),
      shell_file: resolvePromptPackAsset(contract, safeText(contractRender.shell_file, 'render_shell.html'), { safeText }),
      pack_id: safeText(contract?.prompt_pack?.pack_id),
      authored_markup_surface: CREATIVE_MATERIALIZED_FROM,
      markup_binding_model: 'slides_data_shell_only',
      generator_instructions: safeArray(visualArtifact?.visual_direction?.final_instruction_to_html_generator),
      peak_pages: safeArray(visualArtifact?.visual_direction?.peak_pages),
      page_family_ceiling: visualArtifact?.visual_direction?.page_family_ceiling || {},
      rerender_mode: safeText(renderExecution?.mode, 'full_regeneration'),
      render_execution: renderExecution || null,
      html_design_companion: htmlDesignCompanion(contract),
      html_route_quality_companion: htmlRouteQualityCompanion(contract),
      slides: slidesMarkup.map((slide) => ({
        slide_id: slide.slide_id,
        title: slide.title,
        layout_family: slide.layout_family,
        recipe_id: slide.recipe_id,
        template_id: slide.template_id,
        peak_page: slide.director_contract.peak_page,
        director_role: slide.director_contract.director_role,
      })),
    };
    const viewSurfacePaths = getDeliverableViewSurfacePaths(deliverablePaths, deliverableId);
    const htmlFile = viewSurfacePaths.draftHtmlFile;
    const slidesFile = viewSurfacePaths.draftSlidesFile;
    const shellText = readPromptPackText(renderPlan.shell_file);
    writeText(htmlFile, buildDeckHtml({
      title: contract.title,
      slidesMarkup,
      renderPlan,
      renderStrategy: renderPlan.render_strategy,
      shellText,
    }));
    writeJson(slidesFile, {
      title: contract.title,
      slides: slidesMarkup.map((slide) => ({
        slideId: slide.slide_id,
        title: slide.title,
        recipeId: slide.recipe_id,
        content: slide.content,
      })),
    });
    const stableViewRefs = seedDeliverableStableViews(viewSurfacePaths, htmlFile, slidesFile);
    const targetedSlideIds = renderExecution?.mode === 'targeted_revision_only'
      ? safeArray(renderExecution?.targeted_slide_ids).map((slideId) => safeText(slideId)).filter(Boolean)
      : [];
    const targetedRerun = targetedSlideIds.length > 0
      ? {
          default_route: PAGE_FIX_ROUTE,
          scope: 'slide',
          target_slide_ids: targetedSlideIds,
          reused_slide_ids: safeArray(renderExecution?.reused_slide_ids).map((slideId) => safeText(slideId)).filter(Boolean),
          source_review_stages: ['visual_director_review', 'screenshot_review'],
        }
      : null;
    const renderSummary = safeArray(data?.render_summary).length > 0
      ? normalizeStringList(data?.render_summary, `${route}.render_summary`, { min: 1, max: 4 })
      : ['HTML page authoring completed with missing summary quality debt.'];
    if (safeArray(data?.render_summary).length === 0) {
      renderFailures.push({ failure_kind: 'missing_render_summary', error: 'render_summary missing' });
    }
    return {
      ...attachCommon(route, contract, generationRuntime, adapter),
      status: renderFailures.length > 0 ? 'completed_with_quality_debt' : 'completed',
      quality_debt: renderFailures.length > 0 ? {
        status: 'recorded_non_blocking',
        reasons: ['html_authoring_partial_failure'],
        failures: renderFailures,
        failed_slide_ids: renderFailures.map((failure) => safeText(failure?.slide_id)).filter(Boolean),
        blocks_stage_transition: false,
        blocks_ready_claims: true,
      } : null,
      creative_execution: creativeExecution(
        contract.lifecycle_model?.route_to_stage?.[route] || contract.lifecycle_model?.route_to_stage?.render_html || 'visual_authorship',
        generationRuntime,
        adapter,
      ),
      render_execution: renderExecution || null,
      html_route_quality_companion: renderPlan.html_route_quality_companion,
      revision_context: revisionContext || null,
      ...(targetedRerun ? { targeted_rerun: targetedRerun } : {}),
      lifecycle_stage: contract.lifecycle_model?.route_to_stage?.[route] || contract.lifecycle_model?.route_to_stage?.render_html || 'visual_authorship',
      html_bundle: {
        html_file: htmlFile,
        slides_file: slidesFile,
        page_count: slidesMarkup.length,
        render_strategy: renderPlan.render_strategy,
        generator_instructions: renderPlan.generator_instructions,
        expected_page_count: blueprintSlides.length,
        actual_page_count: slidesMarkup.length,
        page_count_gate_pass: slidesMarkup.length === blueprintSlides.length,
        render_summary: renderSummary,
        render_execution: renderExecution || null,
        html_design_companion: renderPlan.html_design_companion,
        html_route_quality_companion: renderPlan.html_route_quality_companion,
        shell_contract: {
          ratio: CANVAS.ratio,
          width: CANVAS.width,
          height: CANVAS.height,
          controls: ['slide-display-area', 'prev-btn', 'next-btn'],
        },
        slides: slidesMarkup,
      },
      artifact_refs: [htmlFile, slidesFile, ...stableViewRefs],
    };
  }


  return {
    buildRenderHtmlArtifact,
    loadPriorRenderedSlideHtmlMap,
  };
}
