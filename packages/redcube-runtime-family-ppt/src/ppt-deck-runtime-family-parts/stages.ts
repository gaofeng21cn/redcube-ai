// @ts-nocheck
import path from 'node:path';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { runRedCubePythonHelper } from '@redcube/runtime-protocol';

import { createPptDeckRenderStageParts } from './render.js';
import { createPptDeckNativePptStageParts } from './native-ppt.js';
import { createPptDeckExportStageParts } from './export.js';
import {
  collectIncrementalDirectorReviewTargetSlideIds,
  collectIncrementalScreenshotReviewTargetSlideIds,
} from './incremental-review-scope.js';
import { materializePptScreenshotReviewCapture } from './screenshot-capture.js';

export function createPptDeckStageParts(deps) {
  const {
    CANVAS,
    CODEX_DEFAULT_ADAPTER,
    CREATIVE_MATERIALIZED_FROM,
    PAGE_FIX_ROUTE,
    PROMPT_PACK,
    PYTHON_EXPORT,
    PYTHON_NATIVE,
    PYTHON_REVIEW,
    RENDER_HTML_BATCH_SIZE,
    RENDER_REFERENCE_SLIDE_WINDOW,
    SCREENSHOT_MECHANICAL_REVIEW_RULESET_ID = 'ppt_deck_screenshot_mechanics:v3:parent-surface-target-audit',
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
  const nativePptParts = createPptDeckNativePptStageParts({
    ...deps,
    PYTHON_NATIVE,
    readCurrentHtmlArtifact,
  });
  const {
    buildNativePptArtifact,
    currentVisualStageId,
    isNativePptArtifact,
    nativeMechanicalReviewPayload,
    readCurrentVisualArtifact,
    summarizeNativeSlides,
    visualArtifactMtimeMs,
  } = nativePptParts;
  const exportParts = createPptDeckExportStageParts({
    ...deps,
    PYTHON_EXPORT,
    PYTHON_NATIVE,
    isNativePptArtifact,
    readCurrentVisualArtifact,
  });
  const {
    buildExportArtifact,
    hashReviewInput,
  } = exportParts;

  function buildDirectorPreflightContext(preflight, slideIds) {
    return {
      anti_template_ok: Boolean(preflight?.antiTemplateOk),
      weak_pages: filterSlideScopedArray(preflight?.weakPages, slideIds),
      findings: safeArray(preflight?.findings)
        .filter((finding) => {
          const text = safeText(finding);
          return safeArray(slideIds).some((slideId) => text.includes(safeText(slideId)));
        }),
      slides: safeArray(slideIds).map((slideId) => ({
        slide_id: safeText(slideId),
        weak_page: filterSlideScopedArray(preflight?.weakPages, [slideId]).length > 0,
        findings: safeArray(preflight?.findings).filter((finding) => safeText(finding).includes(safeText(slideId))),
      })),
    };
  }

  async function generateDirectorReviewDraft(contract, deliverablePaths, preflight, adapter = CODEX_DEFAULT_ADAPTER) {
    const renderArtifact = readCurrentVisualArtifact(contract, deliverablePaths);
    const currentVisualStage = currentVisualStageId(contract, deliverablePaths);
    const blueprintArtifact = readStageArtifact(contract, deliverablePaths, 'slide_blueprint');
    const visualArtifact = readStageArtifact(contract, deliverablePaths, 'visual_direction');
    const priorReviewArtifact = readStageArtifact(contract, deliverablePaths, 'visual_director_review');
    const incrementalTargetSlideIds = collectIncrementalDirectorReviewTargetSlideIds({
      renderArtifact,
      priorReviewArtifact,
      currentVisualStage,
      pageFixRoute: PAGE_FIX_ROUTE,
    });
    const incrementalReview = incrementalTargetSlideIds.length > 0;
    const targetSlideIdSet = slideIdSet(incrementalTargetSlideIds);
    const renderedSlideHtmlById = loadPriorRenderedSlideHtmlMap(renderArtifact);
    const renderSummary = isNativePptArtifact(renderArtifact)
      ? summarizeNativeSlides(renderArtifact).map((slide) => ({
          slide_id: slide.slide_id,
          title: slide.title,
          layout_family: slide.layout_family,
          peak_page: false,
          text_excerpt: `native editable PPTX: ${slide.shape_count} shapes, ${slide.text_box_count} text boxes`,
        }))
      : safeArray(renderArtifact?.html_bundle?.slides).map((slide) => ({
          slide_id: slide.slide_id,
          title: slide.title,
          layout_family: slide.layout_family,
          peak_page: slide.director_contract?.peak_page,
          text_excerpt: normalizeInlineText(String(slide.content || '').replace(/<[^>]+>/g, ' '), 220),
          ...(incrementalReview
            ? { source_html: renderedSlideHtmlById.get(safeText(slide.slide_id)) || null }
            : {}),
        }));
    const reviewRenderSummary = incrementalReview
      ? renderSummary.filter((slide) => targetSlideIdSet.has(safeText(slide?.slide_id)))
      : renderSummary;
    const reviewedSlideIds = incrementalReview
      ? incrementalTargetSlideIds
      : renderSummary.map((slide) => safeText(slide?.slide_id)).filter(Boolean);
    const { data, generationRuntime } = await generateStructuredArtifact({
      adapter,
      family: 'ppt_deck',
      route: 'visual_director_review',
      promptRelativePath: PROMPT_PACK.visual_director_review,
      context: {
        ...buildAuthoringContext(contract),
        review_scope: incrementalReview ? 'incremental_page_review' : 'full_deck_review',
        blueprint: {
          slides: incrementalReview
            ? filterSlideScopedArray(summarizeBlueprintSlides(blueprintArtifact), incrementalTargetSlideIds)
            : summarizeBlueprintSlides(blueprintArtifact),
        },
        visual_direction: incrementalReview
          ? buildPageLocalVisualDirectionContext(visualArtifact?.visual_direction || null, incrementalTargetSlideIds)
          : visualArtifact?.visual_direction || null,
        render_summary: reviewRenderSummary,
        director_preflight: incrementalReview
          ? buildDirectorPreflightContext(preflight, incrementalTargetSlideIds)
          : null,
        source_surface_kind: isNativePptArtifact(renderArtifact) ? 'native_pptx' : 'html',
      },
      outputContract: directorReviewOutputContract(),
    });
    return {
      data,
      generationRuntime,
      reviewScope: incrementalReview ? 'incremental_page_review' : 'full_deck_review',
      reviewedSlideIds,
      reusedSlideIds: incrementalReview
        ? renderSummary
            .map((slide) => safeText(slide?.slide_id))
            .filter((slideId) => slideId && !targetSlideIdSet.has(slideId))
        : [],
      priorReviewArtifact: incrementalReview ? priorReviewArtifact : null,
    };
  }

  function visibleAudienceText(html) {
    return normalizeInlineText(safeText(html).replace(/<script\b[\s\S]*?<\/script>/gi, ' ').replace(/<style\b[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/&(nbsp|amp|lt|gt|quot|#39);/g, ' '), 1200);
  }

  function directorHtmlPreflight(renderArtifact) {
    const slides = safeArray(renderArtifact?.html_bundle?.slides);
    const weakPages = new Set();
    const findings = [];
    const metadataLeakPatterns = [
      /当前节点\s*[：:]\s*\d+\s*\/\s*\d+/i,
      /下一步\s*(进入|是|为|[:：])/i,
      /制作目标\s*[：:]/i,
      /\b(operator|internal)\b/i,
      /\bprompt\s*(pack|file|artifact|seed|contract|context|output)\b/i,
      /prompt\s*(输出|生成|写入|文案|指令|上下文)/i,
      /(制作者|内部)(流程|节点|提示|文案|审查|复盘)/i,
    ];
    for (const slide of slides) {
      const slideId = safeText(slide?.slide_id);
      const visibleText = visibleAudienceText(slide?.content || slide?.content_html || slide?.html);
      const leaked = metadataLeakPatterns.some((pattern) => pattern.test(visibleText));
      if (leaked) { weakPages.add(slideId); findings.push(`${slideId}: audience-facing metadata leak`); }
    }
    let currentRun = [];
    let longestRun = [];
    for (const slide of slides) {
      const html = safeText(slide?.content || slide?.content_html || slide?.html);
      const qaCardBlocks = (html.match(/data-qa-block="[^"]*(card|panel|grid)[^"]*"/gi) || []).length;
      const roundedBlocks = (html.match(/border-radius\s*:/gi) || []).length;
      const borderedBlocks = (html.match(/border\s*:\s*\d+px\s+solid/gi) || []).length;
      const whitePanels = (html.match(/background(?:-color)?\s*:\s*(#fff(fff)?|white|rgb\(\s*255\s*,\s*255\s*,\s*255\s*\))/gi) || []).length
        + (visibleAudienceText(html).match(/白色父面板/g) || []).length;
      const cardDensity = qaCardBlocks >= 3 || roundedBlocks >= 12 || borderedBlocks >= 8;
      const denseWhiteCard = cardDensity && whitePanels >= 3;
      currentRun = denseWhiteCard ? [...currentRun, slide] : [];
      if (currentRun.length > longestRun.length) longestRun = currentRun;
    }
    if (longestRun.length >= 4) for (const slide of longestRun) weakPages.add(safeText(slide?.slide_id));
    if (longestRun.length >= 4) findings.push(`homogeneous white-card run: ${longestRun.map((slide) => safeText(slide?.slide_id)).join(',')}`);
    const homogeneousLayoutRisk = longestRun.length >= 4 ? Math.min(0.95, 0.35 + (longestRun.length / Math.max(slides.length, 1))) : 0;
    return { antiTemplateOk: findings.length === 0, weakPages: [...weakPages].filter(Boolean), homogeneousLayoutRisk, findings };
  }

  function directorNativePptPreflight(nativeArtifact) {
    const slides = summarizeNativeSlides(nativeArtifact);
    const weakPages = [];
    const findings = [];
    for (const slide of slides) {
      if (Number(slide.shape_count || 0) < 3 || Number(slide.text_box_count || 0) < 2) {
        weakPages.push(slide.slide_id);
        findings.push(`${slide.slide_id}: native PPT shape manifest too thin`);
      }
      if (!safeText(slide.preview_screenshot_file) || !(mainExistsSync || existsSync)(slide.preview_screenshot_file)) {
        weakPages.push(slide.slide_id);
        findings.push(`${slide.slide_id}: native PPT preview screenshot missing`);
      }
    }
    return {
      antiTemplateOk: findings.length === 0,
      weakPages: [...new Set(weakPages)].filter(Boolean),
      homogeneousLayoutRisk: 0.12,
      findings,
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
    const currentVisualStage = currentVisualStageId(contract, deliverablePaths);
    const currentVisualMtimeMs = visualArtifactMtimeMs(contract, deliverablePaths);
    if (route === PAGE_FIX_ROUTE) {
      const screenshotReviewMtimeMs = safeFileMtimeMs(stageArtifactPath(contract, deliverablePaths, 'screenshot_review'));
      if (screenshotReviewMtimeMs < currentHtmlMtimeMs) {
        throw new Error('Route fix_html requires screenshot_review based on the current HTML; rerun screenshot_review first');
      }
    }
    if (route === 'repair_pptx_native') {
      const screenshotReviewMtimeMs = safeFileMtimeMs(stageArtifactPath(contract, deliverablePaths, 'screenshot_review'));
      const authorMtimeMs = safeFileMtimeMs(stageArtifactPath(contract, deliverablePaths, 'author_pptx_native'));
      if (screenshotReviewMtimeMs < authorMtimeMs) {
        throw new Error('Route repair_pptx_native requires screenshot_review based on the current native PPTX; rerun screenshot_review first');
      }
    }
    if (route === 'visual_director_review' && !currentVisualStage) {
      throw new Error('Route visual_director_review requires render_html or author_pptx_native before review');
    }
    if (route === 'screenshot_review') {
      const directorReviewArtifact = readStageArtifact(contract, deliverablePaths, 'visual_director_review');
      if (!directorReviewArtifact || directorReviewArtifact.status !== 'pass') {
        throw new Error('Route screenshot_review requires visual_director_review to pass before audit');
      }
      const directorReviewMtimeMs = safeFileMtimeMs(stageArtifactPath(contract, deliverablePaths, 'visual_director_review'));
      if (directorReviewMtimeMs < currentVisualMtimeMs) {
        throw new Error('Route screenshot_review requires visual_director_review to be rerun after the latest visual changes');
      }
    }
    if (route === 'export_pptx') {
      const reviewArtifact = readStageArtifact(contract, deliverablePaths, 'screenshot_review');
      if (!reviewArtifact || reviewArtifact.status !== 'pass') {
        throw new Error('Route export_pptx requires screenshot_review to pass before export');
      }
      const screenshotReviewMtimeMs = safeFileMtimeMs(stageArtifactPath(contract, deliverablePaths, 'screenshot_review'));
      if (screenshotReviewMtimeMs < currentVisualMtimeMs) {
        throw new Error('Route export_pptx requires screenshot_review to be rerun after the latest visual changes');
      }
    }
  }

  function runPython(helper, args) {
    return runRedCubePythonHelper(helper, args, {
      fileExists: mainExistsSync || existsSync,
      missingMessagePrefix: 'Missing ppt_deck python helper',
      failureMessagePrefix: 'ppt_deck python helper failed',
    });
  }

  function cachedMechanicalReview(priorArtifact, hash) {
    if (safeText(priorArtifact?.mechanical_review?.ruleset_id) !== SCREENSHOT_MECHANICAL_REVIEW_RULESET_ID) return null;
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
      ruleset_id: SCREENSHOT_MECHANICAL_REVIEW_RULESET_ID,
      freshness: cacheStatus === 'hit' ? 'current' : 'fresh',
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
      if (reviewArtifact.review_capture.manifest_file) {
        lines.push(`- capture_manifest：${safeText(reviewArtifact.review_capture.manifest_file)}`);
      }
      if (reviewArtifact.review_capture.store_dir) {
        lines.push(`- capture_store_dir：${safeText(reviewArtifact.review_capture.store_dir)}`);
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
      `- page_number_consistency_ok：${reviewArtifact.checks.page_number_consistency_ok}`,
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

  function slideIdSet(slideIds = []) {
    return new Set(safeArray(slideIds).map((slideId) => safeText(slideId)).filter(Boolean));
  }

  function filterSlideScopedArray(value, slideIds) {
    const allowedSlideIds = slideIdSet(slideIds);
    return safeArray(value).filter((item) => {
      const itemSlideId = safeText(typeof item === 'string' ? item : item?.slide_id);
      return itemSlideId && allowedSlideIds.has(itemSlideId);
    });
  }

  function buildPageLocalVisualDirectionContext(visualDirection, slideIds) {
    const normalizedVisualDirection = visualDirection || {};
    return {
      mode: normalizedVisualDirection.mode,
      what_it_is: normalizedVisualDirection.what_it_is,
      what_it_is_not: normalizedVisualDirection.what_it_is_not,
      visual_manifest: normalizedVisualDirection.visual_manifest,
      palette: normalizedVisualDirection.palette,
      typography_plan: normalizedVisualDirection.typography_plan,
      page_family_ceiling: normalizedVisualDirection.page_family_ceiling || {},
      final_instruction_to_html_generator: safeArray(normalizedVisualDirection.final_instruction_to_html_generator),
      forbidden_regressions: safeArray(normalizedVisualDirection.forbidden_regressions),
      peak_pages: filterSlideScopedArray(normalizedVisualDirection.peak_pages, slideIds),
      page_role_table: filterSlideScopedArray(normalizedVisualDirection.page_role_table, slideIds),
      rhythm_curve: filterSlideScopedArray(normalizedVisualDirection.rhythm_curve, slideIds),
    };
  }

  function mergeSlideReviewList(priorReviews, freshReviews, targetSlideIds) {
    const targetIds = slideIdSet(targetSlideIds);
    const freshById = new Map(
      safeArray(freshReviews)
        .map((slide) => [safeText(slide?.slide_id), slide])
        .filter(([slideId]) => slideId),
    );
    const merged = [];
    const seen = new Set();
    for (const prior of safeArray(priorReviews)) {
      const slideId = safeText(prior?.slide_id);
      if (!slideId) continue;
      const fresh = targetIds.has(slideId) ? freshById.get(slideId) : null;
      merged.push(fresh || prior);
      seen.add(slideId);
    }
    for (const fresh of safeArray(freshReviews)) {
      const slideId = safeText(fresh?.slide_id);
      if (slideId && !seen.has(slideId)) merged.push(fresh);
    }
    return merged;
  }

  function titleConsistencyExempt(review) {
    return safeText(review?.slide_id) === 'S01' || safeText(review?.layout_family) === 'cover_signal';
  }

  function refreshMechanicalStatus(review) {
    const issues = safeArray(review?.issues);
    return {
      ...review,
      status: issues.length === 0 ? 'pass' : 'block',
      issues,
    };
  }

  function pageNumberReferenceCandidates(slideReviews) {
    return safeArray(slideReviews)
      .map((slide) => slide?.metrics?.page_number_audit || {})
      .filter((audit) => audit?.present);
  }

  function pageNumberReferencePayload(reference) {
    if (!reference) return null;
    return {
      text: reference.text,
      syntax_family: reference.syntax_family,
      position_family: reference.position_family,
      font_size: reference.font_size,
      color_rgb: reference.color_rgb,
      rect: reference.rect,
    };
  }

  function pageNumberPositionFailure(current, reference) {
    if (safeText(current?.position_family) !== safeText(reference?.position_family)) return true;
    const currentRect = current?.rect || {};
    const referenceRect = reference?.rect || {};
    for (const key of ['left', 'top', 'right_gap', 'bottom_gap']) {
      const currentValue = currentRect[key];
      const referenceValue = referenceRect[key];
      if (currentValue == null || referenceValue == null) continue;
      if (Math.abs(Number(currentValue) - Number(referenceValue)) > 8) return true;
    }
    return false;
  }

  function pageNumberColorFailure(current, reference) {
    const currentRgb = safeArray(current?.color_rgb);
    const referenceRgb = safeArray(reference?.color_rgb);
    if (currentRgb.length < 3 || referenceRgb.length < 3) return false;
    return [0, 1, 2].some((index) => Math.abs(Number(currentRgb[index]) - Number(referenceRgb[index])) > 18);
  }

  function applyMergedPageNumberConsistency(slideReviews) {
    const reference = pageNumberReferenceCandidates(slideReviews)[0] || null;
    const referencePayload = pageNumberReferencePayload(reference);
    for (const review of safeArray(slideReviews)) {
      const checks = review.checks || {};
      const metrics = review.metrics || {};
      const audit = metrics.page_number_audit || { present: false };
      review.checks = checks;
      review.metrics = metrics;
      metrics.page_number_audit = audit;
      const failures = [];
      if (reference && audit?.present) {
        if (safeText(audit.syntax_family) !== safeText(reference.syntax_family)) failures.push('syntax_family');
        if (pageNumberPositionFailure(audit, reference)) failures.push('position');
        if (Math.abs(Number(audit.font_size || 0) - Number(reference.font_size || 0)) > 1.5) failures.push('font_size');
        if (pageNumberColorFailure(audit, reference)) failures.push('color');
      }
      audit.reference = referencePayload;
      audit.failures = failures;
      checks.page_number_consistency_ok = failures.length === 0;
      const withoutPageNumberIssue = safeArray(review.issues)
        .filter((issue) => safeText(issue) !== 'page_number_consistency_failed');
      review.issues = failures.length === 0
        ? withoutPageNumberIssue
        : [...withoutPageNumberIssue, 'page_number_consistency_failed'];
    }
    return safeArray(slideReviews).map((slide) => refreshMechanicalStatus(slide));
  }

  function applyMergedMechanicalConsistency(slideReviews) {
    return applyMergedPageNumberConsistency(applyMergedTitleTypographyConsistency(slideReviews));
  }

  function applyMergedTitleTypographyConsistency(slideReviews) {
    const bodySizes = safeArray(slideReviews)
      .filter((slide) => !titleConsistencyExempt(slide))
      .map((slide) => Number(slide?.metrics?.title_font_size || 0))
      .filter((size) => size > 0)
      .sort((left, right) => left - right);
    const reference = bodySizes.length === 0
      ? 0
      : bodySizes[Math.floor((bodySizes.length - 1) / 2)];
    for (const review of safeArray(slideReviews)) {
      const checks = review.checks || {};
      const metrics = review.metrics || {};
      review.checks = checks;
      review.metrics = metrics;
      const withoutTitleIssue = safeArray(review.issues)
        .filter((issue) => safeText(issue) !== 'title_typography_inconsistent');
      if (titleConsistencyExempt(review)) {
        checks.title_typography_ok = true;
        metrics.title_font_reference = reference ? Number(reference.toFixed(2)) : null;
        metrics.title_font_delta = 0;
        review.issues = withoutTitleIssue;
        continue;
      }
      const fontSize = Number(metrics.title_font_size || 0);
      if (reference <= 0 || fontSize <= 0) {
        checks.title_typography_ok = false;
        metrics.title_font_reference = reference ? Number(reference.toFixed(2)) : null;
        metrics.title_font_delta = null;
        review.issues = [...withoutTitleIssue, 'title_typography_inconsistent'];
        continue;
      }
      const delta = Math.abs(fontSize - reference);
      checks.title_typography_ok = delta <= 2.5;
      metrics.title_font_reference = Number(reference.toFixed(2));
      metrics.title_font_delta = Number(delta.toFixed(2));
      review.issues = checks.title_typography_ok
        ? withoutTitleIssue
        : [...withoutTitleIssue, 'title_typography_inconsistent'];
    }
    return safeArray(slideReviews).map((slide) => refreshMechanicalStatus(slide));
  }

  function summarizeMechanicalChecksFromSlides(slideReviews) {
    const keys = [
      'overflow_free',
      'occlusion_free',
      'visual_density_ok',
      'speaker_fit_ok',
      'edge_clearance_ok',
      'block_content_fit_ok',
      'title_typography_ok',
      'page_number_consistency_ok',
    ];
    return Object.fromEntries(keys.map((key) => [
      key,
      safeArray(slideReviews).every((slide) => slide?.checks?.[key] !== false),
    ]));
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
    const blueprintSlides = summarizeBlueprintSlides(blueprintArtifact);
    const visualDirection = visualArtifact?.visual_direction || null;
    const sharedContext = {
      ...buildAuthoringContext(contract),
      mode,
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
          page_number_audit: slide.metrics?.page_number_audit ?? null,
          source_html: renderedSlideHtmlById.get(safeText(slide.slide_id)) || null,
        })),
      },
    };
    const aiSlideReviews = [];
    aiSlideReviews.push(...(await Promise.all(safeArray(slideReviews).map(async (slide) => {
      const slideBatch = [slide];
      const batchSlideIds = slideBatch.map((item) => safeText(item?.slide_id)).filter(Boolean);
      const { data: batchData } = await generateStructuredArtifact({
        adapter,
        family: 'ppt_deck',
        route: 'screenshot_review',
        promptRelativePath: PROMPT_PACK.screenshot_review,
        context: {
          ...sharedContext,
          review_scope: 'slide_batch',
          blueprint: {
            slides: filterSlideScopedArray(blueprintSlides, batchSlideIds),
          },
          visual_direction: buildPageLocalVisualDirectionContext(visualDirection, batchSlideIds),
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
              page_number_audit: slide.metrics?.page_number_audit ?? null,
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
        blueprint: {
          slides: blueprintSlides.map((slide) => ({
            slide_id: slide.slide_id,
            title: slide.title,
            layout_family: slide.layout_family,
          })),
        },
        visual_direction: visualDirection,
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
    const renderArtifact = readCurrentVisualArtifact(contract, deliverablePaths);
    const preflight = isNativePptArtifact(renderArtifact)
      ? directorNativePptPreflight(renderArtifact)
      : directorHtmlPreflight(renderArtifact);
    const {
      data,
      generationRuntime,
      reviewScope,
      reviewedSlideIds,
      reusedSlideIds,
      priorReviewArtifact,
    } = await generateDirectorReviewDraft(contract, deliverablePaths, preflight, adapter);
    const priorReview = priorReviewArtifact?.visual_director_review || null;
    const incrementalReview = reviewScope === 'incremental_page_review';
    const targetSlideIds = slideIdSet(reviewedSlideIds);
    const priorWeakPages = incrementalReview
      ? safeArray(priorReview?.weak_pages).filter((slideId) => !targetSlideIds.has(safeText(slideId)))
      : [];
    const directorIntentLanded = Boolean(data?.director_intent_landed)
      && (!incrementalReview || Boolean(priorReview?.director_intent_landed));
    const antiTemplateOk = Boolean(data?.anti_template_ok)
      && preflight.antiTemplateOk
      && (!incrementalReview || Boolean(priorReview?.anti_template_ok));
    const memoryHookPresent = Boolean(data?.memory_hook_present);
    const peakPagesLanded = Boolean(data?.peak_pages_landed ?? true)
      && (!incrementalReview || Boolean(priorReview?.peak_pages_landed ?? true));
    const weakPages = [...new Set([
      ...priorWeakPages,
      ...normalizeStringList(data?.weak_pages, 'visual_director_review.weak_pages', { min: 0, max: 4 }),
      ...preflight.weakPages,
    ])];
    const homogeneousLayoutRisk = Math.max(
      Number(data?.homogeneous_layout_risk || 0),
      Number(incrementalReview ? priorReview?.homogeneous_layout_risk || 0 : 0),
      preflight.homogeneousLayoutRisk,
    );
    const reviewSummary = [
      requireText(data?.review_summary, 'visual_director_review.review_summary'),
      ...preflight.findings.map((finding) => `deterministic preflight blocked ${finding}`),
    ].join(' ');
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
        review_scope: reviewScope,
        reviewed_slide_ids: reviewedSlideIds,
        reused_slide_ids: reusedSlideIds,
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
        deterministic_preflight: {
          gate_model: 'deterministic_ppt_director_review_preflight',
          anti_template_ok: preflight.antiTemplateOk,
          weak_pages: preflight.weakPages,
          findings: preflight.findings,
        },
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
    const renderArtifact = readCurrentVisualArtifact(contract, deliverablePaths);
    const nativeReviewInput = isNativePptArtifact(renderArtifact);
    const blueprintArtifact = readStageArtifact(contract, deliverablePaths, 'slide_blueprint');
    const storylineArtifact = readStageArtifact(contract, deliverablePaths, 'storyline');
    const directorReviewArtifact = readStageArtifact(contract, deliverablePaths, 'visual_director_review');
    const preflightArtifact = nativeReviewInput ? null : buildScreenshotReviewPreflightArtifact(contract, renderArtifact, adapter);
    if (preflightArtifact) return preflightArtifact;
    const reviewMarkdown = path.join(deliverablePaths.reportsDir, `${deliverableId}_视觉质控.md`);
    const reviewCapture = createReviewCapturePaths(deliverablePaths, deliverableId);
    const args = nativeReviewInput
      ? []
      : [
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
    const priorMechanicalRulesetCurrent = safeText(priorReviewArtifact?.mechanical_review?.ruleset_id) === SCREENSHOT_MECHANICAL_REVIEW_RULESET_ID;
    const incrementalTargetSlideIds = priorMechanicalRulesetCurrent ? collectIncrementalScreenshotReviewTargetSlideIds({
      renderArtifact,
      priorReviewArtifact,
      pageFixRoute: PAGE_FIX_ROUTE,
    }) : [];
    const incrementalReview = incrementalTargetSlideIds.length > 0;
    if (incrementalReview && !nativeReviewInput) {
      args.push('--slide-ids', incrementalTargetSlideIds.join(','));
    }
    const cachedPayload = cachedMechanicalReview(priorReviewArtifact, reviewHash);
    const cacheStatus = cachedPayload && !incrementalReview ? 'hit' : 'miss';
    const python = cacheStatus === 'hit'
      ? { command: 'cache', payload: cachedPayload }
      : (nativeReviewInput
          ? { command: 'native_ppt_shape_manifest', payload: nativeMechanicalReviewPayload(renderArtifact) }
          : runPython(PYTHON_REVIEW, args));
    const reviewPayload = python.payload;
    const freshMechanicalSlideReviews = safeArray(reviewPayload.slide_reviews).map((slide) => ({
      ...slide,
      status: safeArray(slide?.issues).length === 0 ? 'pass' : 'block',
    }));
    const mechanicalSlideReviews = applyMergedMechanicalConsistency(incrementalReview
      ? mergeSlideReviewList(
          priorReviewArtifact?.mechanical_review?.slide_reviews || priorReviewArtifact?.slide_reviews,
          freshMechanicalSlideReviews,
          incrementalTargetSlideIds,
        )
      : freshMechanicalSlideReviews);
    const mechanicalSlideReviewsForAi = incrementalReview
      ? mechanicalSlideReviews.filter((slide) => slideIdSet(incrementalTargetSlideIds).has(safeText(slide?.slide_id)))
      : mechanicalSlideReviews;
    const aiReviewPromise = generateScreenshotReviewDraft(
      contract,
      deliverablePaths,
      renderArtifact,
      mechanicalSlideReviewsForAi,
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
    const freshSlideReviews = mechanicalSlideReviewsForAi.map((slide) => buildAiFirstVisualSlideReview(
      slide,
      aiSlideReviewMap.get(slide.slide_id),
    ));
    const candidateSlideReviews = applyMergedMechanicalConsistency(
      incrementalReview
        ? mergeSlideReviewList(priorReviewArtifact?.slide_reviews, freshSlideReviews, incrementalTargetSlideIds)
        : freshSlideReviews,
    );
    const {
      captureManifest,
      slideReviews,
      mechanicalSlideReviews: capturedMechanicalSlideReviews,
    } = materializePptScreenshotReviewCapture({
      deliverablePaths,
      reviewCapture,
      slideReviews: candidateSlideReviews,
      mechanicalSlideReviews,
    });
    const mergedAiSlideReviews = slideReviews
      .map((slide) => slide?.ai_review ? { slide_id: safeText(slide?.slide_id), ...slide.ai_review } : null)
      .filter(Boolean);
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
      page_number_consistency_ok: aiFirstMechanicalCheckValue(slideReviews, 'page_number_consistency_ok'),
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
      : nativeReviewInput ? 'repair_pptx_native' : deriveScreenshotReviewRerunStage(contract, failedChecks, slideReviews);
    const artifact = {
      ...attachCommon('screenshot_review', contract, generationRuntime, adapter),
      review_execution: {
        ...creativeExecution('screenshot_review', generationRuntime, adapter),
        overlay: 'screenshot_review',
        review_scope: incrementalReview ? 'incremental_page_review' : 'full_deck_review',
        reviewed_slide_ids: incrementalReview
          ? incrementalTargetSlideIds
          : slideReviews.map((slide) => safeText(slide?.slide_id)).filter(Boolean),
        reused_slide_ids: incrementalReview
          ? slideReviews
              .map((slide) => safeText(slide?.slide_id))
              .filter((slideId) => slideId && !slideIdSet(incrementalTargetSlideIds).has(slideId))
          : [],
      },
      review_overlay: 'screenshot_review',
      mode,
      status,
      mechanical_cache: mechanicalCacheMetadata(cacheStatus, reviewHash),
      checks: latestChecks,
      review_capture: {
        capture_id: reviewCapture.captureId,
        screenshots_dir: nativeReviewInput
          ? path.dirname(safeText(safeArray(renderArtifact?.native_ppt_bundle?.preview_screenshots)[0], reviewCapture.screenshotsDir))
          : reviewCapture.screenshotsDir,
        review_markdown_file: reviewCapture.reviewMarkdownFile,
        manifest_file: captureManifest.manifest_file,
        store_dir: captureManifest.store_dir,
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
        slide_reviews: mergedAiSlideReviews,
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
        python_helper_invocation: python.package_module
          ? {
              helper_id: python.helper_id,
              package_module: python.package_module,
              command: [...python.argv, ...args],
            }
          : null,
        checks: summarizeMechanicalChecksFromSlides(mechanicalSlideReviews),
        metrics: {
          ...(reviewPayload.metrics || {}),
          slide_count: capturedMechanicalSlideReviews.length,
          reviewed_slide_count: mechanicalSlideReviewsForAi.length,
        },
        baseline: reviewPayload.baseline || null,
        slide_reviews: capturedMechanicalSlideReviews,
        incremental_review: incrementalReview
          ? {
              reviewed_slide_ids: incrementalTargetSlideIds,
              reused_slide_ids: slideReviews
                .map((slide) => safeText(slide?.slide_id))
                .filter((slideId) => slideId && !slideIdSet(incrementalTargetSlideIds).has(slideId)),
            }
          : null,
      },
      report_markdown: reviewMarkdown,
      metrics: reviewPayload.metrics,
      artifact_refs: [
        reviewMarkdown,
        reviewCapture.reviewMarkdownFile,
        captureManifest.manifest_file,
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

  return {
    ...renderParts,
    ...nativePptParts,
    buildDirectorReview,
    buildExportArtifact,
    buildScreenshotReviewArtifact,
    ensurePrerequisites,
  };
}
