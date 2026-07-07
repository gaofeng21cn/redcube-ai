// @ts-nocheck
export function createXiaohongshuRenderParts(deps) {
  const {
    CANVAS,
    CODEX_DEFAULT_ADAPTER,
    CREATIVE_MATERIALIZED_FROM,
    PAGE_FIX_ROUTE,
    attachCommon,
    buildAuthoringContext,
    buildDeterministicFixHtmlSummary,
    buildFixHtmlLocalInspection,
    buildFixHtmlRevisionContext,
    buildHtml,
    buildSignatureExposureGrammar,
    buildVisualAnchorSystem,
    creativeExecution,
    creativeSourceStamp,
    currentHtmlStageId,
    generateStructuredArtifact,
    generateStructuredArtifactBatch,
    getDeliverableViewSurfacePaths,
    hydrateRenderedSlideRootMetadata,
    loadOperatorRevisionBrief,
    loadPriorRenderedXhsSlideHtmlMap,
    markPublishBundleStaleAfterBlockedReview,
    normalizeStringList,
    promptRoute,
    readCurrentHtmlArtifact,
    readPromptPackText,
    readStageArtifact,
    renderContract,
    renderHtmlOutputContract,
    requireObjectArray,
    resolvePromptPackAsset,
    safeArray,
    safeFileMtimeMs,
    safeText,
    selectFixHtmlSlideIds,
    summarizePlanSlides,
    syncCandidateHtml,
    validateRenderedReviewAnchors,
    validateRenderedSlideContent,
  } = deps;
  function htmlDesignCompanion(contract) { const companion = renderContract(contract)?.ui_ux_quality_companion; return companion && typeof companion === 'object' ? companion : null; }
  function chunkArray(items, size) {
    const source = safeArray(items);
    const batchSize = Math.max(Number(size) || 1, 1);
    const batches = [];
    for (let index = 0; index < source.length; index += batchSize) {
      batches.push(source.slice(index, index + batchSize));
    }
    return batches;
  }

  async function generateRenderHtmlDraft(workspaceRoot, contract, deliverablePaths, adapter = CODEX_DEFAULT_ADAPTER) {
    const research = readStageArtifact(contract, deliverablePaths, 'research');
    const storyline = readStageArtifact(contract, deliverablePaths, 'storyline');
    const plan = readStageArtifact(contract, deliverablePaths, 'single_note_plan');
    const visual = readStageArtifact(contract, deliverablePaths, 'visual_direction');
    const sharedContext = {
      ...buildAuthoringContext({ workspaceRoot, contract, research }),
      storyline: storyline?.storyline || null,
      visual_direction: visual?.visual_direction || null,
      shell_contract: {
        ratio: CANVAS.ratio,
        width: CANVAS.width,
        height: CANVAS.height,
        controls: ['slide-display-area', 'prev-btn', 'next-btn'],
      },
      html_guardrails: [
        '每页输出完整 slide root，必须包含 data-slide-root=true 和匹配的 data-slide-id。',
        '每页至少提供 2 个语义化 data-qa-block，并至少标记 1 个 data-primary-point=true，供截图审稿读取布局结构。',
        '不要外链图片，不要脚本，不要 <style> block，不要把内部文档或模板注册表写进 HTML。',
        '版式由 AI 直接创作，不能退化成固定卡片模板拼装。',
      ], ui_ux_quality_companion: htmlDesignCompanion(contract),
    };
    const planSlides = summarizePlanSlides(plan);
    const renderBatchStages = chunkArray(planSlides, 1).map((slideBatch, batchIndex) => {
      const buildRenderBatchStage = ({ previousResults = [] } = {}) => ({
        family: 'xiaohongshu',
        route: 'render_html',
        promptRelativePath: promptRoute(contract, 'render_html'),
        context: {
          ...sharedContext,
          render_scope: 'page_batch',
          render_batch: {
            batch_index: batchIndex + 1,
            total_batches: planSlides.length,
            slide_ids: slideBatch.map((slide) => slide.slide_id),
          },
          reference_pages: safeArray(previousResults)
            .flatMap((result) => safeArray(result?.data?.slides))
            .map((slide) => ({
              slide_id: safeText(slide?.slide_id),
              content_html: safeText(slide?.content_html),
            }))
            .filter((slide) => slide.slide_id && slide.content_html)
            .slice(-2),
          plan: {
            slides: slideBatch,
          },
        },
        outputContract: renderHtmlOutputContract(),
        cwd: deliverablePaths.deliverableDir,
      });
      buildRenderBatchStage.stage_id = `render_html_batch_${batchIndex + 1}`;
      return buildRenderBatchStage;
    });
    const renderBatchResult = await (generateStructuredArtifactBatch || (async ({ stages }) => {
      const data = [];
      for (const stage of stages) {
        const stageInput = typeof stage === 'function'
          ? {
              ...stage({ previousResults: data, stage_id: stage.stage_id }),
              stage_id: stage.stage_id,
            }
          : stage;
        const result = await generateStructuredArtifact({ adapter, ...stageInput });
        data.push({
          stage_id: stageInput.stage_id,
          data: result.data,
          generationRuntime: result.generationRuntime,
        });
      }
      return {
        data,
        batchRuntime: {
          owner: safeText(data[0]?.generationRuntime?.owner),
          session_pool: {
            reuse_supported: false,
            reuse_claimed: false,
            reuse_status: 'wrapper_fallback_without_reuse',
            invocation_count: data.length,
          },
        },
      };
    }))({
      adapter,
      stages: renderBatchStages,
      cwd: deliverablePaths.deliverableDir,
      sessionPool: {
        descriptor_id: `xiaohongshu_render_html_${safeText(contract.deliverable_id || contract.title, 'deliverable')}`,
        reuse_strategy: 'same_session_if_supported',
      },
    });
    const batchSlides = safeArray(renderBatchResult?.data)
      .flatMap((result) => safeArray(result?.data?.slides));
    const { data: summaryData, generationRuntime } = await generateStructuredArtifact({
      adapter,
      family: 'xiaohongshu',
      route: 'render_html',
      promptRelativePath: promptRoute(contract, 'render_html'),
      context: {
        ...sharedContext,
        render_scope: 'summary',
        plan: {
          slides: planSlides.map((slide) => ({
            slide_id: slide.slide_id,
            title: slide.title,
            layout_family: slide.layout_family,
          })),
        },
        rendered_slide_ids: batchSlides.map((slide) => safeText(slide?.slide_id)).filter(Boolean),
      },
      outputContract: renderHtmlOutputContract(),
      cwd: deliverablePaths.deliverableDir,
    });
    return {
      data: {
        slides: batchSlides,
        render_summary: safeArray(summaryData?.render_summary),
      },
      generationRuntime,
      renderExecution: {
        route: 'render_html',
        mode: 'full_generation',
        batch_size: 1,
        batch_count: renderBatchStages.length,
        codex_batch_runtime: renderBatchResult?.batchRuntime || null,
        reference_window: 2,
        freshly_rendered_slide_ids: batchSlides.map((slide) => safeText(slide?.slide_id)).filter(Boolean),
        reused_slide_ids: [],
      },
    };
  }

  function materializeRenderedXhsSlides({
    planArtifact,
    visualArtifact,
    slideHtmlById,
    generationRuntime,
    route,
    adapter = CODEX_DEFAULT_ADAPTER,
  }) {
    const planSlides = safeArray(planArtifact?.single_note_plan?.slides);
    return planSlides.map((slide) => {
      const rawContent = slideHtmlById.get(slide.slide_id);
      if (!rawContent) {
        throw new Error(`${route} output missing slide: ${slide.slide_id}`);
      }
      const materialRules = visualArtifact?.visual_direction?.material_rules || {};
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
      const speakerSeconds = slide.layout_family === 'process_track' ? 40 : slide.layout_family === 'action_checklist' ? 32 : 36;
      const peakPage = safeArray(visualArtifact?.visual_direction?.peak_pages).includes(slide.slide_id);
      const pageRole = slide.progression_role;
      const content = validateRenderedReviewAnchors(
        hydrateRenderedSlideRootMetadata(rawContent, {
          'data-title': slide.title,
          'data-layout-family': slide.layout_family,
          'data-speaker-seconds': speakerSeconds,
          'data-recipe-id': slide.render_recipe_id,
          'data-template-id': 'upstream_ai_html',
          'data-peak-page': peakPage ? 'true' : 'false',
          'data-director-role': pageRole,
        }, slide.slide_id),
        slide.slide_id,
        'xiaohongshu',
      );
      return {
        slide_id: slide.slide_id,
        slide_no: slide.slide_no,
        title: slide.title,
        layout_family: slide.layout_family,
        recipe_id: slide.render_recipe_id,
        template_id: 'upstream_ai_html',
        page_goal: slide.page_goal,
        page_core_content: safeArray(slide.page_core_content),
        evidence_and_sources: safeArray(slide.evidence_and_sources),
        director_contract: {
          visual_motif: safeText(visualArtifact?.visual_direction?.visual_motif),
          source_language_discipline: safeText(visualArtifact?.visual_direction?.source_language_discipline),
          anti_template_constraints: safeArray(visualArtifact?.visual_direction?.anti_template_constraints),
          peak_page: peakPage,
          page_role: pageRole,
          memory_hook: safeText(visualArtifact?.visual_direction?.memory_hook),
          material_rules: {
            paper_base: safeText(materialRules.paper_base, '#FFFBF0'),
            main_accent: safeText(materialRules.main_accent, '#2563EB'),
            warning_accent: safeText(materialRules.warning_accent, '#DC2626'),
          },
        },
        speaker_seconds: speakerSeconds,
        total_slides: planSlides.length,
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
  }

  async function buildRenderHtml(workspaceRoot, contract, deliverablePaths, adapter = CODEX_DEFAULT_ADAPTER) {
    const plan = readStageArtifact(contract, deliverablePaths, 'single_note_plan');
    const visual = readStageArtifact(contract, deliverablePaths, 'visual_direction');
    const { data, generationRuntime, renderExecution } = await generateRenderHtmlDraft(
      workspaceRoot,
      contract,
      deliverablePaths,
      adapter,
    );
    const slideHtmlList = requireObjectArray(data?.slides, 'render_html.slides', { min: 1 });
    const slideHtmlById = new Map(slideHtmlList.map((item) => [safeText(item.slide_id), validateRenderedSlideContent(item.content_html, safeText(item.slide_id))]));
    const slides = materializeRenderedXhsSlides({
      planArtifact: plan,
      visualArtifact: visual,
      slideHtmlById,
      generationRuntime,
      route: 'render_html',
      adapter,
    });
    const contractRender = renderContract(contract);
    const renderPlan = {
      render_strategy: safeText(contractRender.render_strategy, 'upstream_structured_ai_html'),
      shell_file: resolvePromptPackAsset(contract, safeText(contractRender.shell_file, 'render_shell.html')),
      pack_id: safeText(contract?.prompt_pack?.pack_id),
      authored_markup_surface: CREATIVE_MATERIALIZED_FROM,
      markup_binding_model: 'slides_data_shell_only',
      director_contract: {
        visual_motif: safeText(visual?.visual_direction?.visual_motif),
        peak_pages: safeArray(visual?.visual_direction?.peak_pages),
        page_family_ceiling: visual?.visual_direction?.page_family_ceiling || {},
        anti_template_constraints: safeArray(visual?.visual_direction?.anti_template_constraints),
        source_language_discipline: safeText(visual?.visual_direction?.source_language_discipline),
        visual_anchor_system: visual?.visual_direction?.visual_anchor_system || buildVisualAnchorSystem(),
        signature_exposure_grammar: visual?.visual_direction?.signature_exposure_grammar || buildSignatureExposureGrammar(),
      }, html_design_companion: htmlDesignCompanion(contract),
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
    const viewSurfacePaths = getDeliverableViewSurfacePaths(deliverablePaths);
    const htmlFile = viewSurfacePaths.draftHtmlFile;
    const shellText = readPromptPackText(renderPlan.shell_file);
    deps.writeText(htmlFile, buildHtml({
      title: contract.title,
      slides,
      renderPlan,
      renderStrategy: renderPlan.render_strategy,
      shellText,
    }));
    return {
      ...attachCommon('render_html', contract, generationRuntime, adapter),
      creative_execution: creativeExecution('render_html', generationRuntime, adapter),
      render_execution: renderExecution,
      lifecycle_stage: 'visual_authorship',
      html_bundle: {
        html_file: htmlFile,
        page_count: slides.length,
        shell_contract: CANVAS,
        render_strategy: renderPlan.render_strategy,
        director_contract: renderPlan.director_contract, html_design_companion: renderPlan.html_design_companion,
        slides,
        render_summary: normalizeStringList(data?.render_summary, 'render_html.render_summary', { min: 1, max: 4 }),
      },
      artifact_refs: syncCandidateHtml(viewSurfacePaths, htmlFile),
    };
  }

  async function buildFixHtml(workspaceRoot, contract, deliverablePaths, adapter = CODEX_DEFAULT_ADAPTER) {
    const plan = readStageArtifact(contract, deliverablePaths, 'single_note_plan');
    const visual = readStageArtifact(contract, deliverablePaths, 'visual_direction');
    const currentRender = readCurrentHtmlArtifact(contract, deliverablePaths);
    const screenshotReview = readStageArtifact(contract, deliverablePaths, 'screenshot_review');
    const operatorRevisionBrief = loadOperatorRevisionBrief({
      deliverablePaths,
      minimumMtimeMs: safeFileMtimeMs(deps.stageArtifactPath(contract, deliverablePaths, 'screenshot_review')),
    });
    const revisionContext = buildFixHtmlRevisionContext(contract, deliverablePaths, operatorRevisionBrief);
    const targetSlideIds = selectFixHtmlSlideIds(plan, screenshotReview, operatorRevisionBrief);
    if (targetSlideIds.length === 0) {
      throw new Error('fix_html requires screenshot_review blocked pages, failed cover density checks, or operator-targeted slide ids');
    }
    const priorSlideHtmlById = loadPriorRenderedXhsSlideHtmlMap(currentRender);
    const targetSet = new Set(targetSlideIds);
    const preservedSlideIds = safeArray(plan?.single_note_plan?.slides)
      .map((slide) => safeText(slide?.slide_id))
      .filter((slideId) => slideId && !targetSet.has(slideId));
    const promptSlides = summarizePlanSlides(plan)
      .filter((slide) => targetSet.has(safeText(slide?.slide_id)))
      .map((slide) => ({
        ...slide,
        current_content_html: priorSlideHtmlById.get(safeText(slide?.slide_id)) || null,
      }));
    const { data, generationRuntime } = await generateStructuredArtifact({
      adapter,
      family: 'xiaohongshu',
      route: PAGE_FIX_ROUTE,
      promptRelativePath: promptRoute(contract, PAGE_FIX_ROUTE),
      context: {
        ...buildAuthoringContext({
          workspaceRoot,
          contract,
          research: readStageArtifact(contract, deliverablePaths, 'research'),
        }),
        storyline: readStageArtifact(contract, deliverablePaths, 'storyline')?.storyline || null,
        plan: {
          slides: promptSlides,
        },
        visual_direction: visual?.visual_direction || null,
        current_html_stage: currentHtmlStageId(contract, deliverablePaths),
        revision_context: revisionContext,
        repair_scope: {
          target_slide_ids: targetSlideIds,
          preserved_slide_ids: preservedSlideIds,
        },
        shell_contract: {
          ratio: CANVAS.ratio,
          width: CANVAS.width,
          height: CANVAS.height,
          controls: ['slide-display-area', 'prev-btn', 'next-btn'],
        },
        html_guardrails: [
          '只修当前点名卡片，未点名页面必须保持现有结构与视觉家族，不要整套重画。',
          '若当前卡片已有可用结构，优先局部修复遮挡、溢出、换行、层级和留白，不要换成另一套版式。',
          '必须保留 data-slide-root=true、匹配的 data-slide-id、至少 2 个 data-qa-block 和 1 个 data-primary-point=true。',
          '不要外链图片，不要脚本，不要 <style> block，不要把内部文档或制作流程写进画面。',
        ], ui_ux_quality_companion: htmlDesignCompanion(contract),
      },
      outputContract: deps.fixHtmlOutputContract(),
      localFileInspection: buildFixHtmlLocalInspection(screenshotReview, targetSlideIds),
      cwd: deliverablePaths.deliverableDir,
    });
    const freshSlideHtmlList = requireObjectArray(data?.slides, 'fix_html.slides', { min: 1, max: targetSlideIds.length });
    const freshSlideHtmlById = new Map(freshSlideHtmlList.map((item) => [
      safeText(item.slide_id),
      validateRenderedSlideContent(item.content_html, safeText(item.slide_id)),
    ]));
    const mergedSlideHtmlById = new Map(priorSlideHtmlById);
    for (const [slideId, html] of freshSlideHtmlById.entries()) {
      mergedSlideHtmlById.set(slideId, html);
    }
    const slides = materializeRenderedXhsSlides({
      planArtifact: plan,
      visualArtifact: visual,
      slideHtmlById: mergedSlideHtmlById,
      generationRuntime,
      route: PAGE_FIX_ROUTE,
      adapter,
    });
    const contractRender = renderContract(contract);
    const renderPlan = {
      render_strategy: safeText(contractRender.render_strategy, 'upstream_structured_ai_html'),
      shell_file: resolvePromptPackAsset(contract, safeText(contractRender.shell_file, 'render_shell.html')),
      pack_id: safeText(contract?.prompt_pack?.pack_id),
      authored_markup_surface: CREATIVE_MATERIALIZED_FROM,
      markup_binding_model: 'slides_data_shell_only',
      repair_scope: {
        target_slide_ids: targetSlideIds,
        current_html_stage: currentHtmlStageId(contract, deliverablePaths),
      },
      director_contract: {
        visual_motif: safeText(visual?.visual_direction?.visual_motif),
        peak_pages: safeArray(visual?.visual_direction?.peak_pages),
        page_family_ceiling: visual?.visual_direction?.page_family_ceiling || {},
        anti_template_constraints: safeArray(visual?.visual_direction?.anti_template_constraints),
        source_language_discipline: safeText(visual?.visual_direction?.source_language_discipline),
        visual_anchor_system: visual?.visual_direction?.visual_anchor_system || buildVisualAnchorSystem(),
        signature_exposure_grammar: visual?.visual_direction?.signature_exposure_grammar || buildSignatureExposureGrammar(),
      }, html_design_companion: htmlDesignCompanion(contract),
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
    const viewSurfacePaths = getDeliverableViewSurfacePaths(deliverablePaths);
    const htmlFile = viewSurfacePaths.draftHtmlFile;
    const shellText = readPromptPackText(renderPlan.shell_file);
    deps.writeText(htmlFile, buildHtml({
      title: contract.title,
      slides,
      renderPlan,
      renderStrategy: renderPlan.render_strategy,
      shellText,
    }));
    return {
      ...attachCommon(PAGE_FIX_ROUTE, contract, generationRuntime, adapter),
      creative_execution: creativeExecution(PAGE_FIX_ROUTE, generationRuntime, adapter),
      lifecycle_stage: 'visual_authorship',
      html_bundle: {
        html_file: htmlFile,
        page_count: slides.length,
        shell_contract: CANVAS,
        render_strategy: renderPlan.render_strategy,
        director_contract: renderPlan.director_contract, html_design_companion: renderPlan.html_design_companion,
        repair_scope: renderPlan.repair_scope,
        slides,
        render_summary: buildDeterministicFixHtmlSummary({
          targetSlideIds,
          revisionContext,
        }),
      },
      unit_repair_scope: {
        family: 'xiaohongshu',
        route: PAGE_FIX_ROUTE,
        scope: 'page',
        target_slide_ids: targetSlideIds,
        preserved_slide_ids: preservedSlideIds,
        source_review_stage: screenshotReview ? 'screenshot_review' : 'operator_revision_brief',
        input_boundary: 'target_page_plan_current_html_screenshot_feedback',
        output_boundary: 'target_page_html_array_only',
        screenshot_review_reuse: true,
      },
      artifact_refs: syncCandidateHtml(viewSurfacePaths, htmlFile),
      review_state_patch: {
        current_status: 'draft',
        ready_for_export: false,
        latest_review_stage: PAGE_FIX_ROUTE,
        latest_checks: {},
        pending_reviews: [],
        blocking_reasons: [],
        rerun_from_stage: null,
        rerun_policy: {
          status: 'idle',
          rerun_from_stage: null,
        },
      },
    };
  }

  return {
    buildRenderHtml,
    buildFixHtml,
  };
}
