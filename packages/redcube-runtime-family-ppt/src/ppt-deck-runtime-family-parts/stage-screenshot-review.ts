// @ts-nocheck
import path from 'node:path';

import {
  collectIncrementalScreenshotReviewTargetSlideIds,
} from './incremental-review-scope.js';
import { materializePptScreenshotReviewCapture } from './screenshot-capture.js';
import { createPptDeckScreenshotReviewMechanicsParts } from './stage-screenshot-review-mechanics.js';
import { createPptDeckScreenshotPreflightParts } from './stage-screenshot-preflight.js';
import { createPptDeckStageReviewScopeParts } from './stage-review-scope.js';

export function createPptDeckScreenshotReviewParts(deps) {
  const {
    CODEX_DEFAULT_ADAPTER,
    CREATIVE_MATERIALIZED_FROM,
    PAGE_FIX_ROUTE,
    PROMPT_PACK,
    PYTHON_REVIEW,
    SCREENSHOT_MECHANICAL_REVIEW_RULESET_ID = 'ppt_deck_screenshot_mechanics:v3:parent-surface-target-audit',
    aiFirstMechanicalCheckValue,
    attachCommon,
    buildAiFirstVisualSlideReview,
    buildAuthoringContext,
    collectSlidesNeedingTargetedRevision,
    compareFailuresAndDensity,
    createReviewCapturePaths,
    creativeExecution,
    creativeSourceStamp,
    deriveProfileChecks,
    deriveScreenshotReviewRerunStage,
    generateStructuredArtifact,
    getDeliverablePaths,
    hasAiVisualBlock,
    hashReviewInput,
    isNativePptArtifact,
    loadPriorRenderedSlideHtmlMap,
    mainExistsSync,
    nativeMechanicalReviewPayload,
    normalizeInlineText,
    normalizePptScreenshotAiSlideReviews,
    normalizeStringList,
    primarySurface,
    readCurrentVisualArtifact,
    readJson,
    readStageArtifact,
    requireText,
    safeArray,
    safeText,
    screenshotReviewSlideBatchOutputContract,
    screenshotReviewSummaryOutputContract,
    stageArtifactPath,
    summarizeBlueprintSlides,
    summarizeRelativeQuality,
    writeText,
  } = deps;
  const {
    buildPageLocalVisualDirectionContext,
    filterSlideScopedArray,
    slideIdSet,
  } = createPptDeckStageReviewScopeParts({ safeArray, safeText });
  const {
    buildReviewMarkdown,
    buildScreenshotReviewPreflightArtifact,
  } = createPptDeckScreenshotPreflightParts(deps);
  const {
    applyMergedMechanicalConsistency,
    buildLatestScreenshotChecks,
    buildMechanicalReviewArgs,
    cachedMechanicalReview,
    loadPriorCaptureManifest,
    mechanicalCacheMetadata,
    resolveMechanicalReviewExecution,
    summarizeMechanicalChecksFromSlides,
  } = createPptDeckScreenshotReviewMechanicsParts({
    PAGE_FIX_ROUTE,
    PYTHON_REVIEW,
    SCREENSHOT_MECHANICAL_REVIEW_RULESET_ID,
    aiFirstMechanicalCheckValue,
    deriveProfileChecks,
    getDeliverablePaths,
    hasAiVisualBlock,
    mainExistsSync,
    nativeMechanicalReviewPayload,
    readJson,
    readStageArtifact,
    safeArray,
    safeText,
    stageArtifactPath,
  });

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

  function runtimeNumber(value) {
    return typeof value === 'number' && Number.isFinite(value) ? value : 0;
  }

  function runtimeCachedTokens(runtime) {
    return runtimeNumber(runtime?.cached_tokens)
      || runtimeNumber(runtime?.provider_usage?.cached_tokens)
      || runtimeNumber(runtime?.usage?.cached_tokens);
  }

  function normalizeStructuredRuntimeCall(runtime, {
    callKind,
    reviewScope,
    targetSlideIds = [],
  }) {
    const call = {
      ...(runtime || {}),
      call_kind: callKind,
      review_scope: reviewScope,
      target_slide_ids: safeArray(targetSlideIds).map((slideId) => safeText(slideId)).filter(Boolean),
    };
    const cachedTokens = runtimeCachedTokens(call);
    if (cachedTokens > 0) call.cached_tokens = cachedTokens;
    if (cachedTokens > 0) call.cache_hit = true;
    return call;
  }

  function sumRuntimeMetric(calls, key) {
    return safeArray(calls).reduce((total, call) => total + runtimeNumber(call?.[key]), 0);
  }

  function rollupRuntimeMetric(calls, summaryRuntime, key) {
    const total = sumRuntimeMetric(calls, key);
    if (total) return total;
    const summaryValue = runtimeNumber(summaryRuntime?.[key]);
    return summaryValue || null;
  }

  function buildRuntimeRollup(summaryRuntime, childCalls) {
    const calls = safeArray(childCalls);
    return {
      ...(summaryRuntime || {}),
      review_scope: 'summary',
      prompt_bytes: rollupRuntimeMetric(calls, summaryRuntime, 'prompt_bytes'),
      context_bytes: rollupRuntimeMetric(calls, summaryRuntime, 'context_bytes'),
      estimated_prompt_tokens: rollupRuntimeMetric(calls, summaryRuntime, 'estimated_prompt_tokens'),
      prompt_tokens: rollupRuntimeMetric(calls, summaryRuntime, 'prompt_tokens'),
      completion_tokens: rollupRuntimeMetric(calls, summaryRuntime, 'completion_tokens'),
      total_tokens: rollupRuntimeMetric(calls, summaryRuntime, 'total_tokens'),
      cached_tokens: sumRuntimeMetric(calls, 'cached_tokens') || runtimeCachedTokens(summaryRuntime) || null,
      cache_hit: calls.some((call) => call?.cache_hit === true) || null,
      child_calls: calls,
    };
  }

  function buildPriorPassDigest({ priorReviewArtifact, targetSlideIds, allSlideReviews }) {
    const targetIds = slideIdSet(targetSlideIds);
    const allIds = safeArray(allSlideReviews).map((slide) => safeText(slide?.slide_id)).filter(Boolean);
    const priorSlides = safeArray(priorReviewArtifact?.slide_reviews);
    const reusedSlideIds = (allIds.length > 0 ? allIds : priorSlides.map((slide) => safeText(slide?.slide_id)).filter(Boolean))
      .filter((slideId) => slideId && !targetIds.has(slideId));
    const blockedPriorSlides = priorSlides
      .filter((slide) => safeText(slide?.status) === 'block' || hasAiVisualBlock(slide?.ai_review))
      .map((slide) => safeText(slide?.slide_id))
      .filter(Boolean);
    return {
      source_review_stage: 'screenshot_review',
      carry_forward_policy: 'reused pages keep prior passed AI and mechanical judgement until final full export gate',
      target_slide_ids: [...targetIds],
      reused_slide_ids: reusedSlideIds,
      prior_passed_slide_count: priorSlides.filter((slide) => !blockedPriorSlides.includes(safeText(slide?.slide_id))).length,
      prior_blocked_slide_ids: blockedPriorSlides,
      prior_weak_pages: safeArray(priorReviewArtifact?.ai_review?.weak_pages),
    };
  }

  async function generateScreenshotReviewDraft(
    contract,
    deliverablePaths,
    renderArtifact,
    slideReviews,
    reviewPayload,
    mode,
    adapter = CODEX_DEFAULT_ADAPTER,
    reviewOptions = {},
  ) {
    const blueprintArtifact = readStageArtifact(contract, deliverablePaths, 'slide_blueprint');
    const visualArtifact = readStageArtifact(contract, deliverablePaths, 'visual_direction');
    const directorReviewArtifact = readStageArtifact(contract, deliverablePaths, 'visual_director_review');
    const renderedSlideHtmlById = loadPriorRenderedSlideHtmlMap(renderArtifact);
    const blueprintSlides = summarizeBlueprintSlides(blueprintArtifact);
    const visualDirection = visualArtifact?.visual_direction || null;
    const incrementalReview = reviewOptions?.incrementalReview === true;
    const targetSlideIds = incrementalReview
      ? safeArray(reviewOptions?.targetSlideIds).map((slideId) => safeText(slideId)).filter(Boolean)
      : [];
    const summaryBlueprintSlides = incrementalReview
      ? filterSlideScopedArray(blueprintSlides, targetSlideIds)
      : blueprintSlides.map((slide) => ({
          slide_id: slide.slide_id,
          title: slide.title,
          layout_family: slide.layout_family,
        }));
    const summaryVisualDirection = incrementalReview
      ? buildPageLocalVisualDirectionContext(visualDirection, targetSlideIds)
      : visualDirection;
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
    const batchResults = await Promise.all(safeArray(slideReviews).map(async (slide) => {
      const slideBatch = [slide];
      const batchSlideIds = slideBatch.map((item) => safeText(item?.slide_id)).filter(Boolean);
      const { data: batchData, generationRuntime: batchRuntime } = await generateStructuredArtifact({
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
      return {
        aiSlideReviews: normalizePptScreenshotAiSlideReviews(batchData?.slide_reviews, slideBatch),
        generationRuntime: normalizeStructuredRuntimeCall(batchRuntime, {
          callKind: 'slide_batch',
          reviewScope: 'slide_batch',
          targetSlideIds: batchSlideIds,
        }),
      };
    }));
    const aiSlideReviews = batchResults.flatMap((result) => result.aiSlideReviews);
    const { data, generationRuntime } = await generateStructuredArtifact({
      adapter,
      family: 'ppt_deck',
      route: 'screenshot_review',
      promptRelativePath: PROMPT_PACK.screenshot_review,
      context: {
        ...sharedContext,
        review_scope: 'summary',
        blueprint: {
          slides: summaryBlueprintSlides,
        },
        visual_direction: summaryVisualDirection,
        prior_pass_digest: incrementalReview
          ? buildPriorPassDigest({
              priorReviewArtifact: reviewOptions?.priorReviewArtifact || null,
              targetSlideIds,
              allSlideReviews: reviewOptions?.allSlideReviews || slideReviews,
            })
          : null,
        ai_slide_reviews: aiSlideReviews,
      },
      outputContract: screenshotReviewSummaryOutputContract(),
      cwd: deliverablePaths.deliverableDir,
    });
    const summaryCall = normalizeStructuredRuntimeCall(generationRuntime, {
      callKind: 'summary',
      reviewScope: 'summary',
      targetSlideIds,
    });
    return {
      data,
      aiSlideReviews,
      generationRuntime: buildRuntimeRollup(generationRuntime, [
        ...batchResults.map((result) => result.generationRuntime),
        summaryCall,
      ]),
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
    const args = buildMechanicalReviewArgs({
      workspaceRoot,
      topicId,
      baselineDeliverableId,
      contract,
      renderArtifact,
      reviewCapture,
      mode,
      nativeReviewInput,
    });
    const reviewHash = hashReviewInput(renderArtifact);
    const priorReviewArtifact = readStageArtifact(contract, deliverablePaths, 'screenshot_review');
    const priorCaptureManifest = loadPriorCaptureManifest(priorReviewArtifact);
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
    const python = resolveMechanicalReviewExecution({
      cacheStatus,
      cachedPayload,
      nativeReviewInput,
      renderArtifact,
      args,
    });
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
      {
        incrementalReview,
        targetSlideIds: incrementalTargetSlideIds,
        allSlideReviews: mechanicalSlideReviews,
        priorReviewArtifact,
      },
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
      targetSlideIds: incrementalTargetSlideIds,
      priorCaptureManifest,
      captureMode: incrementalReview ? 'delta' : 'full',
    });
    const mergedAiSlideReviews = slideReviews
      .map((slide) => slide?.ai_review ? { slide_id: safeText(slide?.slide_id), ...slide.ai_review } : null)
      .filter(Boolean);
    const latestChecks = buildLatestScreenshotChecks({
      contract,
      blueprintArtifact,
      storylineArtifact,
      directorReviewArtifact,
      data,
      slideReviews,
      baselineReview,
    });
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
        capture_mode: captureManifest.capture_mode || (incrementalReview ? 'delta' : 'full'),
        requires_full_materialization_before_export: incrementalReview,
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

  return {
    buildScreenshotReviewArtifact,
  };
}
