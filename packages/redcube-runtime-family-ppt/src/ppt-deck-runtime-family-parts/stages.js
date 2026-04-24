import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';

import { createPptDeckRenderStageParts } from './render.js';

export function createPptDeckStageParts(deps) {
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
    readCurrentHtmlArtifact: providedReadCurrentHtmlArtifact,
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

  const readCurrentHtmlArtifact = providedReadCurrentHtmlArtifact || ((contract, deliverablePaths) => (
    readStageArtifact(contract, deliverablePaths, currentHtmlStageId(contract, deliverablePaths))
  ));
  const renderParts = createPptDeckRenderStageParts({
    ...deps,
    readCurrentHtmlArtifact,
  });
  const { loadPriorRenderedSlideHtmlMap } = renderParts;

  async function generateDirectorReviewDraft(contract, deliverablePaths, adapter = CODEX_DEFAULT_ADAPTER) {
    const renderArtifact = readCurrentHtmlArtifact(contract, deliverablePaths);
    const blueprintArtifact = readStageArtifact(contract, deliverablePaths, 'slide_blueprint');
    const visualArtifact = readStageArtifact(contract, deliverablePaths, 'visual_direction');
    const { data, generationRuntime } = await generateStructuredArtifact({
      adapter,
      family: 'ppt_deck',
      route: 'visual_director_review',
      promptRelativePath: PROMPT_PACK.visual_director_review,
      context: {
        ...buildAuthoringContext(contract),
        blueprint: {
          slides: summarizeBlueprintSlides(blueprintArtifact),
        },
        visual_direction: visualArtifact?.visual_direction || null,
        render_summary: safeArray(renderArtifact?.html_bundle?.slides).map((slide) => ({
          slide_id: slide.slide_id,
          title: slide.title,
          layout_family: slide.layout_family,
          peak_page: slide.director_contract?.peak_page,
          text_excerpt: normalizeInlineText(String(slide.content || '').replace(/<[^>]+>/g, ' '), 220),
        })),
      },
      outputContract: directorReviewOutputContract(),
    });
    return {
      data,
      generationRuntime,
    };
  }

  function ensurePrerequisites({ workspaceRoot, topicId, deliverableId, route, mode, baselineDeliverableId }) {
    const deliverablePaths = getDeliverablePaths(workspaceRoot, topicId, deliverableId);
    const contract = readJson(path.join(deliverablePaths.deliverableDir, 'contracts', 'hydrated-deliverable.json'));
    const missing = safeArray(deps.STAGE_REQUIREMENTS?.[route]?.requires_artifacts)
      .filter((stageId) => !readStageArtifact(contract, deliverablePaths, stageId));
    if (missing.length > 0) {
      throw new Error(`Route ${route} requires completed stage artifacts: ${missing.join(', ')}`);
    }
    if (route === 'screenshot_review' && mode === 'optimize_existing' && !safeText(baselineDeliverableId)) {
      throw new Error('screenshot_review requires baselineDeliverableId in optimize_existing mode');
    }
    if (route === 'screenshot_review' && mode === 'optimize_existing' && safeText(baselineDeliverableId)) {
      const baselineState = getReviewState({
        workspaceRoot,
        topicId,
        deliverableId: baselineDeliverableId,
      }).state;
      if (!isBaselineApprovedState(baselineState)) {
        throw new Error(`Baseline deliverable is not approved: ${baselineDeliverableId}`);
      }
    }
    const currentHtmlStage = currentHtmlStageId(contract, deliverablePaths);
    const currentHtmlMtimeMs = safeFileMtimeMs(stageArtifactPath(contract, deliverablePaths, currentHtmlStage));
    if (route === PAGE_FIX_ROUTE) {
      const screenshotReviewMtimeMs = safeFileMtimeMs(stageArtifactPath(contract, deliverablePaths, 'screenshot_review'));
      if (screenshotReviewMtimeMs < currentHtmlMtimeMs) {
        throw new Error('Route fix_html requires screenshot_review based on the current HTML; rerun screenshot_review first');
      }
    }
    if (route === 'screenshot_review') {
      const directorReviewArtifact = readStageArtifact(contract, deliverablePaths, 'visual_director_review');
      if (!directorReviewArtifact || directorReviewArtifact.status !== 'pass') {
        throw new Error('Route screenshot_review requires visual_director_review to pass before audit');
      }
      const directorReviewMtimeMs = safeFileMtimeMs(stageArtifactPath(contract, deliverablePaths, 'visual_director_review'));
      if (directorReviewMtimeMs < currentHtmlMtimeMs) {
        throw new Error('Route screenshot_review requires visual_director_review to be rerun after the latest HTML changes');
      }
    }
    if (route === 'export_pptx') {
      const reviewArtifact = readStageArtifact(contract, deliverablePaths, 'screenshot_review');
      if (!reviewArtifact || reviewArtifact.status !== 'pass') {
        throw new Error('Route export_pptx requires screenshot_review to pass before export');
      }
      const screenshotReviewMtimeMs = safeFileMtimeMs(stageArtifactPath(contract, deliverablePaths, 'screenshot_review'));
      if (screenshotReviewMtimeMs < currentHtmlMtimeMs) {
        throw new Error('Route export_pptx requires screenshot_review to be rerun after the latest HTML changes');
      }
    }
  }

  function runPython(script, args) {
    if (!(mainExistsSync || existsSync)(script)) {
      throw new Error(`Missing ppt_deck python helper: ${script}`);
    }
    const pythonCommand = resolveRedCubePythonCommand();
    const result = spawnSync(pythonCommand.command, [script, ...args], { encoding: 'utf-8', maxBuffer: 16 * 1024 * 1024 });
    if (result.status !== 0) {
      throw new Error((result.stderr || result.stdout || `ppt_deck python helper failed: ${script}`).trim());
    }
    return {
      command: pythonCommand.command,
      payload: JSON.parse(result.stdout),
    };
  }

  function hashReviewInput(renderArtifact) {
    const htmlFile = safeText(renderArtifact?.html_bundle?.html_file);
    const hash = createHash('sha256');
    hash.update('ppt_deck_screenshot_mechanics:v1\n');
    hash.update(`${CANVAS.width}x${CANVAS.height}\n`);
    hash.update(htmlFile);
    hash.update('\n');
    if (htmlFile && (mainExistsSync || existsSync)(htmlFile)) {
      hash.update(readFileSync(htmlFile));
    }
    hash.update('\nslides\n');
    hash.update(JSON.stringify(safeArray(renderArtifact?.html_bundle?.slides).map((slide) => ({
      slide_id: safeText(slide?.slide_id),
      title: safeText(slide?.title),
      html: safeText(slide?.html || slide?.content_html || slide?.content),
    }))));
    return hash.digest('hex');
  }

  function cachedMechanicalReview(priorArtifact, hash) {
    if (safeText(priorArtifact?.mechanical_review?.hash) !== hash) return null;
    const slideReviews = safeArray(priorArtifact?.mechanical_review?.slide_reviews);
    if (slideReviews.length === 0) return null;
    return {
      checks: priorArtifact.mechanical_review.checks || {},
      metrics: priorArtifact.mechanical_review.metrics || {},
      baseline: priorArtifact.mechanical_review.baseline || null,
      device_scale_factor: priorArtifact.review_capture?.device_scale_factor || 2,
      screenshot_dimensions: priorArtifact.review_capture?.screenshot_dimensions || null,
      slide_reviews: slideReviews,
    };
  }

  function mechanicalCacheMetadata(cacheStatus, hash) {
    return {
      cache_status: cacheStatus,
      hash,
      freshness: cacheStatus === 'hit' ? 'current' : 'fresh',
    };
  }

  function hashFileIfPresent(hash, file) {
    const resolvedFile = safeText(file);
    hash.update(resolvedFile);
    hash.update('\n');
    if (resolvedFile && (mainExistsSync || existsSync)(resolvedFile)) {
      hash.update(readFileSync(resolvedFile));
    }
    hash.update('\n');
  }

  function hashExportPreviewInput({ stableViewHtmlFile, reviewArtifact }) {
    const hash = createHash('sha256');
    hash.update('ppt_deck_export_preview:v1\n');
    hash.update(`${CANVAS.width}x${CANVAS.height}\n`);
    hashFileIfPresent(hash, stableViewHtmlFile);
    hash.update('screenshots\n');
    for (const slide of safeArray(reviewArtifact?.slide_reviews)) {
      hash.update(safeText(slide?.slide_id));
      hash.update('\n');
      hashFileIfPresent(hash, slide?.screenshot_file);
      hash.update(JSON.stringify(slide?.metrics || {}));
      hash.update('\n');
    }
    return hash.digest('hex');
  }

  function exportPreviewCacheMetadata(cacheStatus, hash) {
    return {
      cache_status: cacheStatus,
      hash,
      freshness: cacheStatus === 'hit' ? 'current' : 'fresh',
    };
  }

  function exportPreviewMetricsFromPayload({ exportPayload, renderArtifact, reviewArtifact }) {
    return {
      page_count: Number(exportPayload?.page_count || 0),
      render_page_count: Number(renderArtifact?.html_bundle?.page_count || 0),
      reviewed_page_count: safeArray(reviewArtifact?.slide_reviews).length,
      page_count_match: Number(exportPayload?.page_count || 0) === Number(renderArtifact?.html_bundle?.page_count || 0),
    };
  }

  function cachedExportPreview(priorArtifact, hash) {
    if (safeText(priorArtifact?.export_bundle?.preview_cache?.hash) !== hash) return null;
    const pptxFile = safeText(priorArtifact?.export_bundle?.pptx_file);
    const pdfFile = safeText(priorArtifact?.export_bundle?.pdf_file);
    if (!pptxFile || !(mainExistsSync || existsSync)(pptxFile)) return null;
    if (pdfFile && !(mainExistsSync || existsSync)(pdfFile)) return null;
    const metrics = priorArtifact?.export_bundle?.preview_metrics;
    if (!metrics || typeof metrics !== 'object') return null;
    return {
      page_count: Number(metrics.page_count || 0),
      metrics,
    };
  }

  function computeSlideReview(page, blueprintSlide, maxPrimaryPoints) {
    const metrics = {
      text_char_count: Number(page.text_chars || page.metrics?.text_char_count || 0),
      block_count: Number(page.zone_count || page.metrics?.block_count || 0),
      overlap_pairs: Number(page.overlap_pairs || page.metrics?.overlap_pairs || 0),
      clipped_nodes: Number(page.clipped_nodes || page.metrics?.clipped_nodes || 0),
    };
    const overflowFree = Boolean(page.overflow_free);
    const occlusionFree = metrics.clipped_nodes === 0 && metrics.overlap_pairs === 0;
    const visualDensityOk = metrics.block_count <= maxPrimaryPoints + 4 && metrics.text_char_count <= 340;
    const speakerFitOk = Number(blueprintSlide?.speaker_seconds || 0) >= 20 && Number(blueprintSlide?.speaker_seconds || 0) <= 120;
    const issues = [];
    if (!overflowFree) issues.push('overflow_detected');
    if (!occlusionFree) issues.push('occlusion_detected');
    if (!visualDensityOk) issues.push('visual_density_out_of_range');
    if (!speakerFitOk) issues.push('speaker_fit_out_of_range');
    return {
      slide_id: page.slide_id,
      title: page.title,
      layout_family: blueprintSlide?.visual_presentation?.layout_family || '',
      screenshot_file: page.screenshot_path,
      status: issues.length === 0 ? 'pass' : 'block',
      checks: {
        overflow_free: overflowFree,
        occlusion_free: occlusionFree,
        visual_density_ok: visualDensityOk,
        speaker_fit_ok: speakerFitOk,
      },
      metrics: {
        text_char_count: metrics.text_char_count,
        block_count: metrics.block_count,
        overlap_pairs: metrics.overlap_pairs,
      },
      issues,
    };
  }

  function summarizeChecks(slideReviews, contract) {
    const base = {
      overflow_free: slideReviews.every((slide) => slide.checks.overflow_free),
      occlusion_free: slideReviews.every((slide) => slide.checks.occlusion_free),
      visual_density_ok: slideReviews.every((slide) => slide.checks.visual_density_ok),
      speaker_fit_ok: slideReviews.every((slide) => slide.checks.speaker_fit_ok),
    };
    for (const check of extraChecks(contract)) {
      base[check] = true;
    }
    return base;
  }

  async function baselineComparison({ workspaceRoot, topicId, baselineDeliverableId, slideReviews }) {
    const baselinePaths = getDeliverablePaths(workspaceRoot, topicId, baselineDeliverableId);
    const baselineContract = readJson(path.join(baselinePaths.deliverableDir, 'contracts', 'hydrated-deliverable.json'));
    const baselineArtifact = readStageArtifact(baselineContract, baselinePaths, 'screenshot_review');
    if (!baselineArtifact) {
      throw new Error(`Baseline screenshot review artifact missing: ${baselineDeliverableId}`);
    }
    const currentFailures = slideReviews.filter((slide) => slide.issues.length > 0).length;
    const baselineFailures = safeArray(baselineArtifact.slide_reviews).filter((slide) => safeArray(slide.issues).length > 0).length;
    const currentDensity = slideReviews.reduce((sum, slide) => sum + Number(slide.metrics.text_char_count || 0), 0) / Math.max(slideReviews.length, 1);
    const baselineDensity = safeArray(baselineArtifact.slide_reviews).reduce((sum, slide) => sum + Number(slide.metrics?.text_char_count || 0), 0) / Math.max(safeArray(baselineArtifact.slide_reviews).length, 1);
    const relativeQuality = await compareFailuresAndDensity({
      currentFailures,
      baselineFailures,
      currentDensity,
      baselineDensity,
      densityTolerance: 18,
      densityDigits: 2,
      densityLabel: '平均文本量',
    });
    const passed = relativeQuality.verdict !== 'degraded';
    return {
      baseline_deliverable_id: baselineDeliverableId,
      baseline_failures: baselineFailures,
      current_failures: currentFailures,
      baseline_average_text: Number(baselineDensity.toFixed(2)),
      current_average_text: Number(currentDensity.toFixed(2)),
      summary: summarizeRelativeQuality(relativeQuality),
      passed,
      relative_quality: relativeQuality,
    };
  }

  function buildReviewMarkdown(contract, reviewArtifact, reviewOwner) {
    const lines = [
      `# ${contract.title} 视觉质控`,
      '',
      `- review_owner: ${safeText(reviewOwner, 'codex_native_host_agent')}`,
      `- 状态：${reviewArtifact.status}`,
    ];
    if (reviewArtifact.review_capture) {
      lines.push(`- capture_id：${safeText(reviewArtifact.review_capture.capture_id)}`);
      lines.push(`- capture_screenshots_dir：${safeText(reviewArtifact.review_capture.screenshots_dir)}`);
      if (reviewArtifact.review_capture.review_markdown_file) {
        lines.push(`- capture_review_markdown：${safeText(reviewArtifact.review_capture.review_markdown_file)}`);
      }
      if (Number.isFinite(Number(reviewArtifact.review_capture.device_scale_factor))) {
        lines.push(`- device_scale_factor：${Number(reviewArtifact.review_capture.device_scale_factor)}`);
      }
      const screenshotWidth = Number(reviewArtifact.review_capture?.screenshot_dimensions?.width || 0);
      const screenshotHeight = Number(reviewArtifact.review_capture?.screenshot_dimensions?.height || 0);
      if (screenshotWidth > 0 && screenshotHeight > 0) {
        lines.push(`- screenshot_dimensions：${screenshotWidth}x${screenshotHeight}`);
      }
    }
    lines.push(
      `- director_intent_landed：${reviewArtifact.checks.director_intent_landed}`,
      `- anti_template_ok：${reviewArtifact.checks.anti_template_ok}`,
      `- overflow_free：${reviewArtifact.checks.overflow_free}`,
      `- occlusion_free：${reviewArtifact.checks.occlusion_free}`,
      `- visual_density_ok：${reviewArtifact.checks.visual_density_ok}`,
      `- speaker_fit_ok：${reviewArtifact.checks.speaker_fit_ok}`,
      `- edge_clearance_ok：${reviewArtifact.checks.edge_clearance_ok}`,
      `- block_content_fit_ok：${reviewArtifact.checks.block_content_fit_ok}`,
      `- title_typography_ok：${reviewArtifact.checks.title_typography_ok}`,
    );
    if (Object.hasOwn(reviewArtifact.checks, 'baseline_comparison_passed')) {
      lines.push(`- baseline_comparison_passed：${reviewArtifact.checks.baseline_comparison_passed}`);
    }
    if (reviewArtifact.ai_review?.review_summary) {
      lines.push('', '## AI 审阅结论');
      lines.push(`- review_model：${safeText(reviewArtifact.ai_review.review_model)}`);
      lines.push(`- weak_pages：${safeArray(reviewArtifact.ai_review.weak_pages).join(', ') || 'none'}`);
      lines.push(`- review_summary：${reviewArtifact.ai_review.review_summary}`);
    }
    lines.push('', '## 分页记录');
    for (const slide of reviewArtifact.slide_reviews) {
      lines.push(`- ${slide.slide_id} / ${slide.layout_family} / ${slide.status} / ${slide.screenshot_file}`);
      if (slide.ai_review) {
        lines.push(`  - AI judgement: ${slide.ai_review.judgement}`);
        lines.push(`  - AI findings: ${safeArray(slide.ai_review.visual_findings).join('；')}`);
        lines.push(`  - Recommended fix: ${safeText(slide.ai_review.recommended_fix, 'none')}`);
      }
    }
    if (reviewArtifact.baseline_review?.summary) {
      lines.push('', '## Baseline Relative Review', reviewArtifact.baseline_review.summary);
    }
    return `${lines.join('\n')}\n`;
  }

  async function generateScreenshotReviewDraft(
    contract,
    deliverablePaths,
    renderArtifact,
    slideReviews,
    reviewPayload,
    mode,
    adapter = CODEX_DEFAULT_ADAPTER,
  ) {
    const blueprintArtifact = readStageArtifact(contract, deliverablePaths, 'slide_blueprint');
    const visualArtifact = readStageArtifact(contract, deliverablePaths, 'visual_direction');
    const directorReviewArtifact = readStageArtifact(contract, deliverablePaths, 'visual_director_review');
    const renderedSlideHtmlById = loadPriorRenderedSlideHtmlMap(renderArtifact);
    const sharedContext = {
      ...buildAuthoringContext(contract),
      mode,
      blueprint: {
        slides: summarizeBlueprintSlides(blueprintArtifact),
      },
      visual_direction: visualArtifact?.visual_direction || null,
      director_review: directorReviewArtifact?.visual_director_review || null,
      screenshot_mechanics: {
        source_html_file: safeText(renderArtifact?.html_bundle?.html_file) || null,
        overall_checks: reviewPayload?.checks || null,
        metrics: reviewPayload?.metrics || null,
        baseline: reviewPayload?.baseline || null,
        slides: slideReviews.map((slide) => ({
          slide_id: slide.slide_id,
          title: slide.title,
          layout_family: slide.layout_family,
          status: slide.status,
          issues: slide.issues,
          occupied_ratio: slide.metrics?.occupied_ratio ?? null,
          primary_points: slide.metrics?.primary_points ?? null,
          speaker_seconds: slide.metrics?.speaker_seconds ?? null,
          edge_clearance_failures: slide.metrics?.edge_clearance_failures ?? [],
          title_font_size: slide.metrics?.title_font_size ?? null,
          title_font_reference: slide.metrics?.title_font_reference ?? null,
          title_font_delta: slide.metrics?.title_font_delta ?? null,
          source_html: renderedSlideHtmlById.get(safeText(slide.slide_id)) || null,
        })),
      },
    };
    const aiSlideReviews = [];
    aiSlideReviews.push(...(await Promise.all(chunkArray(slideReviews, SCREENSHOT_REVIEW_BATCH_SIZE).map(async (slideBatch) => {
      const { data: batchData } = await generateStructuredArtifact({
        adapter,
        family: 'ppt_deck',
        route: 'screenshot_review',
        promptRelativePath: PROMPT_PACK.screenshot_review,
        context: {
          ...sharedContext,
          review_scope: 'slide_batch',
          screenshot_mechanics: {
            ...sharedContext.screenshot_mechanics,
            slides: slideBatch.map((slide) => ({
              slide_id: slide.slide_id,
              title: slide.title,
              layout_family: slide.layout_family,
              status: slide.status,
              issues: slide.issues,
              occupied_ratio: slide.metrics?.occupied_ratio ?? null,
              primary_points: slide.metrics?.primary_points ?? null,
              speaker_seconds: slide.metrics?.speaker_seconds ?? null,
              edge_clearance_failures: slide.metrics?.edge_clearance_failures ?? [],
              title_font_size: slide.metrics?.title_font_size ?? null,
              title_font_reference: slide.metrics?.title_font_reference ?? null,
              title_font_delta: slide.metrics?.title_font_delta ?? null,
              source_html: renderedSlideHtmlById.get(safeText(slide.slide_id)) || null,
            })),
          },
        },
        outputContract: screenshotReviewSlideBatchOutputContract(),
        localFileInspection: slideBatch.map((slide, index) => ({
          label: `${slide.slide_id} ${safeText(slide.title, `Slide ${index + 1}`)}`.trim(),
          path: slide.screenshot_file,
          media_type: 'image/png',
          purpose: `Review rendered lecture slide screenshot for ${slide.slide_id}`,
        })),
        cwd: deliverablePaths.deliverableDir,
      });
      return normalizePptScreenshotAiSlideReviews(batchData?.slide_reviews, slideBatch);
    }))).flat());
    const { data, generationRuntime } = await generateStructuredArtifact({
      adapter,
      family: 'ppt_deck',
      route: 'screenshot_review',
      promptRelativePath: PROMPT_PACK.screenshot_review,
      context: {
        ...sharedContext,
        review_scope: 'summary',
        ai_slide_reviews: aiSlideReviews,
      },
      outputContract: screenshotReviewSummaryOutputContract(),
      cwd: deliverablePaths.deliverableDir,
    });
    return {
      data,
      aiSlideReviews,
      generationRuntime,
    };
  }

  async function buildDirectorReview(contract, deliverablePaths, adapter = CODEX_DEFAULT_ADAPTER) {
    const { data, generationRuntime } = await generateDirectorReviewDraft(contract, deliverablePaths, adapter);
    const directorIntentLanded = Boolean(data?.director_intent_landed);
    const antiTemplateOk = Boolean(data?.anti_template_ok);
    const memoryHookPresent = Boolean(data?.memory_hook_present);
    const peakPagesLanded = Boolean(data?.peak_pages_landed ?? true);
    const weakPages = normalizeStringList(data?.weak_pages, 'visual_director_review.weak_pages', { min: 0, max: 4 });
    const homogeneousLayoutRisk = Number(data?.homogeneous_layout_risk || 0);
    const reviewSummary = requireText(data?.review_summary, 'visual_director_review.review_summary');
    const status = directorIntentLanded && antiTemplateOk && peakPagesLanded ? 'pass' : 'block';
    const reviewFile = path.join(deliverablePaths.reportsDir, `${deliverablePaths.deliverableId}_视觉总监复盘.md`);
    const reviewOwner = primarySurface(generationRuntime, adapter);
    writeText(reviewFile, [
      '# 视觉总监复盘',
      '',
      `- review_owner: ${reviewOwner}`,
      `- director_intent_landed: ${directorIntentLanded}`,
      `- anti_template_ok: ${antiTemplateOk}`,
      `- peak_pages_landed: ${peakPagesLanded}`,
      `- memory_hook_present: ${memoryHookPresent}`,
      `- homogeneous_layout_risk: ${homogeneousLayoutRisk}`,
      `- weak_pages: ${weakPages.join(',') || 'none'}`,
      `- review_summary: ${reviewSummary || 'none'}`,
    ].join('\n'));
    return {
      ...attachCommon('visual_director_review', contract, generationRuntime, adapter),
      review_execution: {
        ...creativeExecution('visual_director_review', generationRuntime, adapter),
        overlay: 'visual_director_review',
      },
      review_overlay: 'visual_director_review',
      status,
      visual_director_review: {
        review_model: 'director_first_visual_judgement',
        director_intent_landed: directorIntentLanded,
        anti_template_ok: antiTemplateOk,
        peak_pages_landed: peakPagesLanded,
        memory_hook_present: memoryHookPresent,
        weak_pages: weakPages,
        homogeneous_layout_risk: homogeneousLayoutRisk,
        review_summary: reviewSummary,
        rewrite_action: safeText(data?.rewrite_action) || (status === 'pass' ? 'none' : 'revise_render_html'),
        overlay_handoff: 'screenshot_review',
        creative_sources: {
          review_judgement: creativeSourceStamp({
            route: 'visual_director_review',
            lifecycleStage: 'review_overlay',
            authoredSurface: 'visual_director_review_decision',
            materializedFrom: CREATIVE_MATERIALIZED_FROM,
            generationRuntime,
            adapter,
          }),
        },
      },
      artifact_refs: [reviewFile],
      review_state_patch: {
        current_status: status === 'pass' ? 'director_review_passed' : 'blocked_for_revision',
        ready_for_export: false,
        latest_review_stage: 'visual_director_review',
        latest_checks: {
          director_intent_landed: directorIntentLanded,
          anti_template_ok: antiTemplateOk,
          memory_hook_present: memoryHookPresent,
        },
        pending_reviews: status === 'pass' ? [] : ['director_intent_landed', 'anti_template_ok'],
        blocking_reasons: status === 'pass' ? [] : ['director_intent_landed', 'anti_template_ok'],
        rerun_from_stage: status === 'pass' ? null : 'render_html',
        rerun_policy: {
          status: status === 'pass' ? 'idle' : 'rerun_required',
          rerun_from_stage: status === 'pass' ? null : 'render_html',
        },
      },
    };
  }

  async function buildScreenshotReviewArtifact({
    workspaceRoot,
    topicId,
    deliverableId,
    contract,
    mode,
    baselineDeliverableId,
    adapter = CODEX_DEFAULT_ADAPTER,
  }) {
    const deliverablePaths = getDeliverablePaths(workspaceRoot, topicId, deliverableId);
    const renderArtifact = readCurrentHtmlArtifact(contract, deliverablePaths);
    const blueprintArtifact = readStageArtifact(contract, deliverablePaths, 'slide_blueprint');
    const storylineArtifact = readStageArtifact(contract, deliverablePaths, 'storyline');
    const directorReviewArtifact = readStageArtifact(contract, deliverablePaths, 'visual_director_review');
    const preflightArtifact = buildScreenshotReviewPreflightArtifact(contract, renderArtifact, adapter);
    if (preflightArtifact) return preflightArtifact;
    const reviewMarkdown = path.join(deliverablePaths.reportsDir, `${deliverableId}_视觉质控.md`);
    const reviewCapture = createReviewCapturePaths(deliverablePaths, deliverableId);
    const args = [
      '--html', renderArtifact.html_bundle.html_file,
      '--output-dir', reviewCapture.screenshotsDir,
      '--review-markdown', reviewCapture.reviewMarkdownFile,
      '--max-primary-points', String(contract.layout_rules?.max_primary_points_per_slide || 5),
      '--device-scale-factor', '2',
    ];
    if (mode === 'optimize_existing') {
      const baselinePaths = getDeliverablePaths(workspaceRoot, topicId, baselineDeliverableId);
      const baselineContract = readJson(path.join(baselinePaths.deliverableDir, 'contracts', 'hydrated-deliverable.json'));
      const baselineArtifact = readStageArtifact(baselineContract, baselinePaths, 'screenshot_review');
      if (!baselineArtifact) {
        throw new Error(`Baseline screenshot review artifact missing: ${baselineDeliverableId}`);
      }
      args.push('--baseline-review', stageArtifactPath(baselineContract, baselinePaths, 'screenshot_review'));
    }
    const reviewHash = hashReviewInput(renderArtifact);
    const priorReviewArtifact = readStageArtifact(contract, deliverablePaths, 'screenshot_review');
    const cachedPayload = cachedMechanicalReview(priorReviewArtifact, reviewHash);
    const cacheStatus = cachedPayload ? 'hit' : 'miss';
    const python = cachedPayload ? { command: 'cache', payload: cachedPayload } : runPython(PYTHON_REVIEW, args);
    const reviewPayload = python.payload;
    const mechanicalSlideReviews = safeArray(reviewPayload.slide_reviews).map((slide) => ({
      ...slide,
      status: safeArray(slide?.issues).length === 0 ? 'pass' : 'block',
    }));
    const aiReviewPromise = generateScreenshotReviewDraft(
      contract,
      deliverablePaths,
      renderArtifact,
      mechanicalSlideReviews,
      reviewPayload,
      mode,
      adapter,
    );
    const baselineReviewPromise = mode === 'optimize_existing'
      ? Promise.resolve(baselineComparison({
          workspaceRoot,
          topicId,
          baselineDeliverableId,
          slideReviews: mechanicalSlideReviews,
        }))
      : Promise.resolve(null);
    const [
      { data, aiSlideReviews, generationRuntime },
      baselineReview,
    ] = await Promise.all([aiReviewPromise, baselineReviewPromise]);
    const aiWeakPages = normalizeStringList(data?.weak_pages, 'screenshot_review.weak_pages', { min: 0, max: 4 });
    const aiSlideReviewMap = new Map(aiSlideReviews.map((item) => [item.slide_id, item]));
    const slideReviews = mechanicalSlideReviews.map((slide) => buildAiFirstVisualSlideReview(
      slide,
      aiSlideReviewMap.get(slide.slide_id),
    ));
    const latestChecks = {
      director_intent_landed: Boolean(directorReviewArtifact?.visual_director_review?.director_intent_landed)
        && Boolean(data?.director_intent_landed),
      anti_template_ok: Boolean(directorReviewArtifact?.visual_director_review?.anti_template_ok)
        && Boolean(data?.anti_template_ok),
      ai_review_passed: slideReviews.every((slide) => !hasAiVisualBlock(slide?.ai_review)),
      overflow_free: slideReviews.every((slide) => slide.checks.overflow_free),
      occlusion_free: aiFirstMechanicalCheckValue(slideReviews, 'occlusion_free'),
      visual_density_ok: aiFirstMechanicalCheckValue(slideReviews, 'visual_density_ok'),
      speaker_fit_ok: aiFirstMechanicalCheckValue(slideReviews, 'speaker_fit_ok'),
      edge_clearance_ok: aiFirstMechanicalCheckValue(slideReviews, 'edge_clearance_ok'),
      block_content_fit_ok: aiFirstMechanicalCheckValue(slideReviews, 'block_content_fit_ok'),
      title_typography_ok: aiFirstMechanicalCheckValue(slideReviews, 'title_typography_ok'),
      ...(baselineReview
        ? { baseline_comparison_passed: baselineReview.passed }
        : {}),
      ...deriveProfileChecks(contract, blueprintArtifact, storylineArtifact),
    };
    const failedChecks = Object.entries(latestChecks)
      .filter(([, value]) => value === false)
      .map(([key]) => key);
    const status = failedChecks.length === 0 ? 'pass' : 'block';
    const rerunFromStage = status === 'pass'
      ? null
      : deriveScreenshotReviewRerunStage(contract, failedChecks, slideReviews);
    const artifact = {
      ...attachCommon('screenshot_review', contract, generationRuntime, adapter),
      review_execution: {
        ...creativeExecution('screenshot_review', generationRuntime, adapter),
        overlay: 'screenshot_review',
      },
      review_overlay: 'screenshot_review',
      mode,
      status,
      mechanical_cache: mechanicalCacheMetadata(cacheStatus, reviewHash),
      checks: latestChecks,
      review_capture: {
        capture_id: reviewCapture.captureId,
        screenshots_dir: reviewCapture.screenshotsDir,
        review_markdown_file: reviewCapture.reviewMarkdownFile,
        device_scale_factor: Number(reviewPayload.device_scale_factor || 2),
        screenshot_dimensions: reviewPayload.screenshot_dimensions || null,
      },
      slide_reviews: slideReviews,
      ai_review: {
        review_model: 'screenshot_director_first_visual_judgement',
        director_intent_landed: Boolean(data?.director_intent_landed),
        anti_template_ok: Boolean(data?.anti_template_ok),
        weak_pages: aiWeakPages,
        review_summary: requireText(data?.review_summary, 'screenshot_review.review_summary'),
        slide_reviews: aiSlideReviews,
        creative_sources: {
          review_judgement: creativeSourceStamp({
            route: 'screenshot_review',
            lifecycleStage: 'review_overlay',
            authoredSurface: 'screenshot_review_decision',
            materializedFrom: CREATIVE_MATERIALIZED_FROM,
            generationRuntime,
            adapter,
          }),
        },
      },
      mechanical_review: {
        review_model: 'python_screenshot_layout_checks',
        ...mechanicalCacheMetadata(cacheStatus, reviewHash),
        checks: reviewPayload.checks,
        metrics: reviewPayload.metrics,
        baseline: reviewPayload.baseline || null,
        slide_reviews: mechanicalSlideReviews,
      },
      report_markdown: reviewMarkdown,
      metrics: reviewPayload.metrics,
      artifact_refs: [
        reviewMarkdown,
        reviewCapture.reviewMarkdownFile,
        ...slideReviews.map((slide) => slide.screenshot_file),
      ].filter(Boolean),
      review_state_patch: {
        current_status: status === 'pass' ? 'export_ready' : 'blocked_for_revision',
        ready_for_export: status === 'pass',
        latest_review_stage: 'screenshot_review',
        latest_checks: latestChecks,
        pending_reviews: failedChecks,
        blocking_reasons: failedChecks,
        rerun_from_stage: rerunFromStage,
        rerun_policy: {
          status: status === 'pass' ? 'idle' : 'rerun_required',
          rerun_from_stage: rerunFromStage,
        },
      },
    };
    if (baselineReview) {
      artifact.baseline_review = {
        ...baselineReview,
        baseline_comparison_passed: baselineReview.passed,
      };
    }
    const renderedReviewMarkdown = buildReviewMarkdown(
      contract,
      artifact,
      primarySurface(generationRuntime, adapter),
    );
    writeText(reviewCapture.reviewMarkdownFile, renderedReviewMarkdown);
    writeText(reviewMarkdown, renderedReviewMarkdown);
    return artifact;
  }

  function countHtmlMatches(html, pattern) {
    return safeText(html).match(pattern)?.length || 0;
  }

  function hasHtmlAttribute(html, name) {
    return new RegExp(`\\s${name}=(['"]).+?\\1`, 'i').test(safeText(html));
  }

  function buildScreenshotReviewPreflightArtifact(contract, renderArtifact, adapter) {
    const failures = [];
    for (const slide of safeArray(renderArtifact?.html_bundle?.slides)) {
      const slideId = safeText(slide?.slide_id);
      const html = safeText(slide?.content);
      const missingAnchors = [];
      const missingSlideMetadata = [];
      if (!/data-slide-root=(['"])true\1/i.test(html)) missingAnchors.push('data-slide-root');
      if (slideId && !new RegExp(`data-slide-id=(['"])${slideId}\\1`, 'i').test(html)) missingAnchors.push('data-slide-id');
      if (countHtmlMatches(html, /data-qa-block=(['"])[^'"]+\1/gi) < 2) missingAnchors.push('data-qa-block');
      if (countHtmlMatches(html, /data-primary-point=(['"])true\1/gi) < 1) missingAnchors.push('data-primary-point');
      for (const metadataName of [
        'data-title',
        'data-layout-family',
        'data-speaker-seconds',
        'data-recipe-id',
        'data-template-id',
        'data-peak-page',
        'data-director-role',
      ]) {
        if (!hasHtmlAttribute(html, metadataName)) missingSlideMetadata.push(metadataName);
      }
      const sourceTraceMissing = safeArray(slide?.evidence_and_sources).length === 0;
      if (missingAnchors.length > 0 || missingSlideMetadata.length > 0 || sourceTraceMissing) {
        failures.push({
          slide_id: slideId,
          title: safeText(slide?.title),
          status: 'block',
          missing_anchors: missingAnchors,
          missing_slide_metadata: missingSlideMetadata,
          source_trace_missing: sourceTraceMissing,
          recommended_fix: 'rerun fix_html before screenshot AI review',
        });
      }
    }
    if (failures.length === 0) return null;
    const targetSlideIds = failures.map((failure) => safeText(failure.slide_id)).filter(Boolean);
    const checks = {
      html_review_anchors_ok: failures.every((failure) => safeArray(failure.missing_anchors).length === 0),
      slide_metadata_ok: failures.every((failure) => safeArray(failure.missing_slide_metadata).length === 0),
      source_trace_ok: failures.every((failure) => !failure.source_trace_missing),
      ai_review_passed: false,
    };
    const failedChecks = Object.entries(checks)
      .filter(([, value]) => value === false)
      .map(([key]) => key);
    return {
      ...attachCommon('screenshot_review', contract, null, adapter),
      review_overlay: 'screenshot_review',
      mode: 'preflight',
      status: 'block',
      issues: ['preflight_gate_failed'],
      checks,
      preflight_gate: {
        status: 'block',
        gate_model: 'deterministic_ppt_screenshot_review_preflight',
        ai_review_skipped: true,
        target_slide_ids: targetSlideIds,
        failures,
      },
      slide_reviews: failures,
      artifact_refs: [safeText(renderArtifact?.html_bundle?.html_file)].filter(Boolean),
      review_state_patch: {
        current_status: 'blocked_for_revision',
        ready_for_export: false,
        latest_review_stage: 'screenshot_review',
        latest_checks: checks,
        pending_reviews: failedChecks,
        blocking_reasons: failedChecks,
        rerun_from_stage: PAGE_FIX_ROUTE,
        rerun_policy: {
          status: 'rerun_required',
          rerun_from_stage: PAGE_FIX_ROUTE,
          default_route: PAGE_FIX_ROUTE,
          scope: 'slide',
          target_slide_ids: targetSlideIds,
          source_review_stage: 'preflight_gate',
        },
      },
    };
  }

  function buildExportArtifact({
    workspaceRoot,
    topicId,
    deliverableId,
    contract,
    adapter = CODEX_DEFAULT_ADAPTER,
  }) {
    const deliverablePaths = getDeliverablePaths(workspaceRoot, topicId, deliverableId);
    const reviewArtifact = readStageArtifact(contract, deliverablePaths, 'screenshot_review');
    const renderArtifact = readCurrentHtmlArtifact(contract, deliverablePaths);
    const publishDir = ensureDir(path.join(deliverablePaths.deliverableDir, 'publish'));
    const pptxFile = path.join(publishDir, `${deliverableId}.pptx`);
    const pdfFile = path.join(publishDir, `${deliverableId}.pdf`);
    const notesFile = path.join(publishDir, `${deliverableId}-presenter-notes.md`);
    const blueprintArtifact = readStageArtifact(contract, deliverablePaths, 'slide_blueprint');
    writeText(notesFile, blueprintArtifact.slide_blueprint.slides.map((slide) => `## ${slide.slide_id} ${slide.title}\n\n${slide.speaker_notes}`).join('\n\n'));
    const screenshotsDir = safeText(reviewArtifact?.review_capture?.screenshots_dir);
    if (!screenshotsDir) {
      throw new Error('Route export_pptx requires screenshot_review immutable capture screenshots; rerun screenshot_review before export');
    }
    if (!(mainExistsSync || existsSync)(screenshotsDir)) {
      throw new Error(`Reviewed screenshot capture directory not found: ${screenshotsDir}`);
    }
    const stableViewHtmlFile = getDeliverableViewSurfacePaths(deliverablePaths, deliverableId).stableHtmlFile;
    if (!(mainExistsSync || existsSync)(stableViewHtmlFile)) {
      throw new Error(`Route export_pptx requires reviewed stable HTML surface before export: ${stableViewHtmlFile}`);
    }
    const previewHash = hashExportPreviewInput({ stableViewHtmlFile, reviewArtifact });
    const priorExportArtifact = readStageArtifact(contract, deliverablePaths, 'export_pptx');
    const cachedPreview = cachedExportPreview(priorExportArtifact, previewHash);
    const previewCacheStatus = cachedPreview ? 'hit' : 'miss';
    const python = cachedPreview ? { command: 'cache', payload: cachedPreview } : runPython(PYTHON_EXPORT, [
      '--screenshots-dir', screenshotsDir,
      '--output-pptx', pptxFile,
      '--output-pdf', pdfFile,
    ]);
    const exportPayload = python.payload;
    const pptxPath = cachedPreview ? (priorExportArtifact.export_bundle.pptx_file || pptxFile) : (exportPayload.pptx_file || exportPayload.pptx_path);
    const pdfPath = cachedPreview ? (priorExportArtifact.export_bundle.pdf_file || pdfFile) : (exportPayload.pdf_file || exportPayload.pdf_path);
    const previewMetrics = cachedPreview?.metrics || exportPreviewMetricsFromPayload({ exportPayload, renderArtifact, reviewArtifact });
    return {
      ...attachCommon('export_pptx', contract, null, adapter),
      status: 'completed',
      review_state_patch: {
        current_status: 'completed',
        ready_for_export: true,
        latest_review_stage: 'export_pptx',
        pending_reviews: [],
        blocking_reasons: [],
        rerun_from_stage: null,
        rerun_policy: {
          status: 'idle',
          rerun_from_stage: null,
        },
      },
      export_bundle: {
        source_html: stableViewHtmlFile,
        pptx_file: pptxPath,
        pdf_file: pdfPath,
        presenter_notes_file: notesFile,
        review_capture: reviewArtifact.review_capture || null,
        delivery_state: {
          current: 'output_ready',
          next: null,
        },
        page_count: exportPayload.page_count,
        page_count_match: previewMetrics.page_count_match,
        preview_cache: exportPreviewCacheMetadata(previewCacheStatus, previewHash),
        preview_metrics: previewMetrics,
        real_conversion_invocation: {
          tool: python.command,
          script: 'packages/redcube-runtime/scripts/ppt_deck_export.py',
          command: ['--screenshots-dir', screenshotsDir, '--output-pptx', pptxFile, '--output-pdf', pdfFile],
        },
      },
      artifact_refs: [stableViewHtmlFile, pptxPath, pdfPath, notesFile].filter(Boolean),
    };
  }

  return {
    ...renderParts,
    buildDirectorReview,
    buildExportArtifact,
    buildScreenshotReviewArtifact,
    ensurePrerequisites,
  };
}
