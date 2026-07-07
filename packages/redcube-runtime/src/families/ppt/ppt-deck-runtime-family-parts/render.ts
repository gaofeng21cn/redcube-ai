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
    executionShape = null,
    hermesProfile = null,
    executorRouting = null,
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
          '若标题或短句在当前字号梯度下能单行成立，就不要主动插入换行。',
          '中文短术语和核心词组必须完整阅读；不得把“科研路径”“质量边界”“署名责任”“可审查”“医生监督”等词拆成单字尾行。',
          '页面纵向信息分布必须均衡：不要把大部分文字和主结构都压在中段，底部也要承担信息收束或结构支撑，避免出现上重中挤下空的大块死白。',
          '整套 deck 的页码语法必须一致：要么统一用两位纯页码，要么统一用当前页/总页数，不允许个别页单独换一套样式。',
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
        '若 source 或 title 中存在内部管理编号、项目编号或 material/source ID，而用户给出了对外汇报口径，听众可见文本必须使用对外标签；内部编号只允许留在 provenance 和 artifact 元数据。',
        '不要把“建议怎么讲”“可发表表达”“待确认的写作口径”“讲稿备忘录”做成投影片正文；这些内容只能影响讲者备注或被压成听众可理解的研究结论/边界。',
        '标题区与导语区必须形成独立安全带；主体白板、轨道、横带、标签和大型结构不得侵入 header 的首屏阅读入口。',
        'foundation / substrate / base band 只承担结构基座，不得压住正文、说明卡片、讲者信息或封面辅助卡；所有可读内容都必须完整留在页边界内。',
        '任何带字元素都必须拥有独立留白：标签、badge、航线节点、callout、段落、底部说明和图内节点不得彼此遮挡，也不得跨压导航轨道或解释段。',
        '若同一页面家族重复出现，后续页面必须切换首眼信号、构图重心或风险张力，不能只是上一页的弱化复写。',
        '对 audit_tension / timeline_band 的第二段推进页，controller 必须继续做唯一主峰；红色风险支路必须收成短窄阻断支路，不能膨胀成第二主图。',
        '若页面同时承载主链说明与风险提示，底部说明区最多保留 2 块；第 3 个观点必须并入主图注释或节点说明，不得再扩成整排说明带。',
        '若某页 blueprint 附带 revision_focus，必须把它当作该页的硬重画 brief；recommended_fix 提到删减、收短、并入、合并的元素时，必须字面落实，不能保留同样抢眼的等价变体。',
        '正文页主标题字号需要在整套 deck 中保持一致，除封面外不要突然缩小；如果空间不足，优先压缩卡片正文、减少说明字数或重排结构，不要先牺牲标题一致性。',
        '整套 deck 的标题、卡片标题、正文、标签与页码必须遵守同一套 typography_plan；不要让某一页整体更大或更小。',
        '若批次上下文提供 reference_slides，只能把 slide_identity、source_html_hash 与 visual_summary 当成连续风格锚点，用于对齐 style tokens、typography、palette、spacing 与卡片尺度；不得复制、继承或改写参考页的布局结构。',
        '连接线、时间线、轨道线必须退到节点徽标和数字圆点下层；不允许线条压在数字、badge 或关键词前景上。',
        '中文讲课页默认中文优先表达；除 contract / review state / publish surface 等必要术语外，不要无意义夹杂英文，术语若出现也要尽量配中文语义。',
        '所有正文、标签、节点和卡片文案都要在自然语义处分行，优先减少字数和调整容器，不要把中英文硬挤到同一行直到溢出。',
        '若标题或短句在当前字号梯度下本可单行成立，就不要主动插入 <br/>；短中文词组只能在自然语义处换行。',
        '中文短术语和核心词组必须完整阅读；不得把“科研路径”“质量边界”“署名责任”“可审查”“医生监督”等词拆成单字尾行。空间不足时用更短文案、更宽容器、语义换行，或用 inline-block/word-break: keep-all 保护短词。',
        '页面纵向质量分布必须均衡：不能把主要文字信息只堆在 40%-70% 的中段高度；底部必须参与结构承载、总结收束或留白平衡，避免底部只剩装饰条而上中段过挤。',
        '若双区对照页的主峰卡、节点链和说明条都集中在中段，必须通过下移、扩底部承载区或重分配信息层次来拉开纵向分布，不要让页面下五分之一长期空置。',
        '对 multi_zone_compare 的“左拆右并”页面，左侧辅助区必须明显窄于且轻于右侧主峰区；不要把左区做成接近等权的大面板，导致整页读成保守双栏。',
        '多区页面里，主峰区宽度与视觉权重都必须显著高于辅助区；如果辅助区已经承担三张以上卡片，优先缩短它、压轻它，而不是继续加宽。',
        '页码的位置、语法、字重和灰度必须在整套 deck 中保持一致，不允许某页突然从两位页码切成“当前页 / 总页数”或相反。',
        'ring_cross 四向骨架页必须保持中心与上下左右卡片近似等距，不能出现单方向明显贴近中心的失衡。',
        '风险支路只允许一个紧凑 warning badge 与一段短 stub；禁止横向长红线穿越主链中轴，绿色判断词若保留则计入底部说明总数。',
        '若已有上一轮通过的 render_html 产物，且 revision_context 只点名部分 blocked slides，则只重画这些页面，其余通过页应保持原样复用，不要重新发明已通过页面。',
        '若 revision_context 点名了 blocked slides 或遮挡问题，必须优先重建这些页面，先消除裁切/遮挡，再保留导演结构意图。',
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
      executionShape,
      hermesProfile,
      executorRouting,
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
      executionShape,
      hermesProfile,
      executorRouting,
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
    executionShape = null,
    hermesProfile = null,
    executorRouting = null,
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
      executionShape,
      hermesProfile,
      executorRouting,
    });
    const slideHtmlList = safeArray(data?.slides).filter((item) => item && typeof item === 'object');
    if (slideHtmlList.length === 0) {
      throw new Error(`upstream ppt ${route} must contain at least one slide`);
    }
    const slideHtmlById = new Map(slideHtmlList.map((item) => [
      safeText(item.slide_id),
      validateRenderedSlideContent(item.content_html, safeText(item.slide_id)),
    ]));
    const revisionFocusBySlideId = buildRenderRevisionFocusMap(revisionContext);
    const slidesMarkup = safeArray(blueprintArtifact?.slide_blueprint?.slides).map((slide) => {
      const rawContent = slideHtmlById.get(slide.slide_id);
      if (!rawContent) {
        throw new Error(`upstream ppt ${route} missing slide: ${slide.slide_id}`);
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
      return {
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
      };
    });
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
    return {
      ...attachCommon(route, contract, generationRuntime, adapter),
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
        render_summary: normalizeStringList(data?.render_summary, `${route}.render_summary`, { min: 1, max: 4 }),
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
