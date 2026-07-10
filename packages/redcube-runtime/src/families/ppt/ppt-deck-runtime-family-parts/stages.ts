// @ts-nocheck
import path from 'node:path';

import { createPptDeckImagePageStageParts } from './image-pages.js';
import { createPptDeckRenderStageParts } from './render.js';
import { createPptDeckNativePptStageParts } from './native-ppt.js';
import { createPptDeckExportStageParts } from './export.js';
import { createPptDeckDirectorReviewParts } from './stage-director-review.js';
import {
  collectIncrementalScreenshotReviewTargetSlideIds,
} from './incremental-review-scope.js';
import { createPptRenderReviewMachineGateBuilder } from './render-review-machine-gate.js';
import {
  buildReviewExportCloseout,
  reviewExportBlockerKind,
} from './review-export-closeout.js';
import { materializePptScreenshotReviewCapture } from './screenshot-capture.js';
import { createPptDeckScreenshotReviewMechanicsParts } from './stage-screenshot-review-mechanics.js';
import { createPptDeckScreenshotPreflightParts } from './stage-screenshot-preflight.js';
import { createPptDeckScreenshotReviewRuntimeParts } from './stage-screenshot-review-runtime.js';
import { createPptDeckStageReviewScopeParts } from './stage-review-scope.js';

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
    assertClaimSpineArtifactContinuity,
    attachCommon,
    buildAiFirstVisualSlideReview,
    buildAuthoringContext,
    buildRenderReviewMachineGate: providedBuildRenderReviewMachineGate,
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
    stageArtifactMtimeMs,
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
  const imagePageParts = createPptDeckImagePageStageParts({
    ...deps,
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
    imagePagesMechanicalReviewPayload,
    isImagePagesArtifact,
    isNativePptArtifact,
    nativeMechanicalReviewPayload,
    readCurrentVisualArtifact,
    summarizeImagePages,
    summarizeNativeSlides,
    visualArtifactMtimeMs,
  } = nativePptParts;
  const exportParts = createPptDeckExportStageParts({
    ...deps,
    PYTHON_EXPORT,
    PYTHON_NATIVE,
    isImagePagesArtifact,
    isNativePptArtifact,
    readCurrentVisualArtifact,
  });
  const {
    buildExportArtifact,
    hashReviewInput,
  } = exportParts;
  const { buildDirectorReview } = createPptDeckDirectorReviewParts({
    ...deps,
    currentVisualStageId,
    isImagePagesArtifact,
    isNativePptArtifact,
    loadPriorRenderedSlideHtmlMap,
    mainExistsSync,
    readCurrentVisualArtifact,
    summarizeImagePages,
    summarizeNativeSlides,
  });
  const buildRenderReviewMachineGate = typeof providedBuildRenderReviewMachineGate === 'function'
    ? providedBuildRenderReviewMachineGate
    : createPptRenderReviewMachineGateBuilder({ safeArray, safeText });
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
    imagePagesMechanicalReviewPayload,
    isImagePagesArtifact,
    readJson,
    readStageArtifact,
    safeArray,
    safeText,
    stageArtifactPath,
  });
  const {
    buildPriorPassDigest,
    buildRuntimeRollup,
    mergeSlideReviewList,
    normalizeStructuredRuntimeCall,
  } = createPptDeckScreenshotReviewRuntimeParts({
    hasAiVisualBlock,
    safeArray,
    safeText,
    slideIdSet,
  });

  function mechanicalOnlyReviewDraft(slideReviews, reviewPayload) {
    const blockedSlides = safeArray(slideReviews).filter((slide) => safeArray(slide?.issues).length > 0);
    return {
      data: {
        director_intent_landed: blockedSlides.length === 0,
        anti_template_ok: blockedSlides.length === 0,
        weak_pages: blockedSlides.map((slide) => safeText(slide?.slide_id)).filter(Boolean).slice(0, 4),
        review_summary: blockedSlides.length === 0
          ? 'Mechanical screenshot review passed without AI escalation.'
          : 'Mechanical screenshot review blocked native PPTX before AI visual judgement; rerun repair from the indicated native quality issues.',
      },
      aiSlideReviews: safeArray(slideReviews).map((slide) => ({
        slide_id: safeText(slide?.slide_id),
        judgement: safeArray(slide?.issues).length > 0 ? 'block' : 'pass',
        visual_findings: safeArray(slide?.issues).length > 0
          ? safeArray(slide?.issues).map((issue) => `mechanical issue: ${safeText(issue)}`).filter(Boolean).slice(0, 4)
          : ['mechanical checks passed'],
        recommended_fix: safeArray(slide?.issues).length > 0
          ? 'repair_pptx_native'
          : 'none',
      })),
      generationRuntime: {
        owner: 'redcube_ai',
        adapter_surface: 'deterministic_native_mechanical_gate',
        run_id: `mechanical_gate_${safeText(reviewPayload?.source_surface_kind, 'screenshot_review')}`,
        session_id: 'mechanical_gate',
        review_scope: 'mechanical_only',
        prompt_bytes: 0,
        context_bytes: 0,
        estimated_prompt_tokens: 0,
        child_calls: [],
      },
    };
  }

  function normalizeVisualMemoryProposal({ data, status, deliverableId, slideReviews, closeout, captureManifest, reviewMarkdown }) {
    const rawProposal = data?.visual_memory_proposal || {};
    const rawCandidate = rawProposal?.candidate || {};
    const reviewedSlideIds = new Set(
      safeArray(slideReviews).map((slide) => safeText(slide?.slide_id)).filter(Boolean),
    );
    const evidenceSlideIds = [...new Set(
      safeArray(rawCandidate?.evidence_slide_ids)
        .map((slideId) => safeText(slideId))
        .filter((slideId) => reviewedSlideIds.has(slideId)),
    )];
    const evidenceFindings = [...new Set(
      safeArray(rawCandidate?.evidence_findings).map((finding) => safeText(finding)).filter(Boolean),
    )];
    const reusablePattern = safeText(rawCandidate?.reusable_pattern);
    const stageScope = safeText(rawCandidate?.stage_scope);
    const applicability = safeText(rawCandidate?.applicability);
    const caveat = safeText(rawCandidate?.caveat);
    const candidateComplete = safeText(rawProposal?.status) === 'proposal_candidate'
      && reusablePattern
      && stageScope
      && applicability
      && caveat
      && evidenceSlideIds.length > 0
      && evidenceFindings.length > 0;

    if (status !== 'pass' || !candidateComplete) {
      return {
        status: 'skip',
        skip_reason: status !== 'pass'
          ? 'review_not_passed'
          : safeText(rawProposal?.status) === 'skip'
            ? safeText(rawProposal?.reason, 'no_reusable_pattern')
            : 'invalid_or_incomplete_proposal_candidate',
        non_authority: true,
        non_blocking: true,
        proposal_candidate: null,
        accept_reject_status: 'not_requested',
        accept_reject_receipt_refs: [],
      };
    }

    const evidenceSlideIdSet = new Set(evidenceSlideIds);
    const evidenceRefs = [...new Set([
      ...safeArray(closeout?.review_export_refs).map((ref) => safeText(ref)),
      safeText(captureManifest?.manifest_file),
      safeText(reviewMarkdown),
      ...safeArray(slideReviews)
        .filter((slide) => evidenceSlideIdSet.has(safeText(slide?.slide_id)))
        .map((slide) => safeText(slide?.screenshot_file)),
    ].filter(Boolean))];
    return {
      status: 'proposal_candidate',
      skip_reason: null,
      non_authority: true,
      non_blocking: true,
      proposal_candidate: {
        proposal_ref: `rca-visual-memory-proposal-candidate:ppt_deck:screenshot_review:${safeText(deliverableId)}`,
        deliverable_family: 'ppt_deck',
        source_stage: 'screenshot_review',
        reusable_pattern: reusablePattern,
        stage_scope: stageScope,
        applicability,
        caveat,
        evidence_slide_ids: evidenceSlideIds,
        evidence_findings: evidenceFindings,
        evidence_refs: evidenceRefs,
      },
      accept_reject_status: 'pending_rca_memory_owner',
      accept_reject_receipt_refs: [],
    };
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
    const imagePagesReviewInput = isImagePagesArtifact(renderArtifact);
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
          source_html_file: imagePagesReviewInput ? null : safeText(renderArtifact?.html_bundle?.html_file) || null,
          source_visual_route: safeText(renderArtifact?.route) || null,
          source_surface_kind: imagePagesReviewInput
            ? 'image_pages'
            : isNativePptArtifact(renderArtifact) ? 'native_pptx' : 'html',
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
          source_html: imagePagesReviewInput ? null : renderedSlideHtmlById.get(safeText(slide.slide_id)) || null,
          source_png: imagePagesReviewInput ? safeText(slide.screenshot_file) : null,
        })),
      },
    };
    const reviewBatchSize = Math.max(1, Number(SCREENSHOT_REVIEW_BATCH_SIZE || 1));
    const slideReviewBatches = safeArray(chunkArray
      ? chunkArray(slideReviews, reviewBatchSize)
      : safeArray(slideReviews).map((slide) => [slide]))
      .map((batch) => safeArray(batch).filter(Boolean))
      .filter((batch) => batch.length > 0);
    const batchResults = await Promise.all(slideReviewBatches.map(async (slideBatch) => {
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
              source_html: imagePagesReviewInput ? null : renderedSlideHtmlById.get(safeText(slide.slide_id)) || null,
              source_png: imagePagesReviewInput ? safeText(slide.screenshot_file) : null,
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
    const imagePagesReviewInput = isImagePagesArtifact(renderArtifact);
    const blueprintArtifact = readStageArtifact(contract, deliverablePaths, 'slide_blueprint');
    const storylineArtifact = readStageArtifact(contract, deliverablePaths, 'storyline');
    const directorReviewArtifact = readStageArtifact(contract, deliverablePaths, 'visual_director_review');
    const preflightArtifact = nativeReviewInput || imagePagesReviewInput ? null : buildScreenshotReviewPreflightArtifact(contract, renderArtifact, adapter);
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
      imagePagesReviewInput,
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
      imagePagesReviewInput,
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
    const hasMechanicalBlock = mechanicalSlideReviewsForAi.some((slide) => safeArray(slide?.issues).length > 0);
    const aiReviewPromise = nativeReviewInput && hasMechanicalBlock
      ? Promise.resolve(mechanicalOnlyReviewDraft(mechanicalSlideReviewsForAi, reviewPayload))
      : generateScreenshotReviewDraft(
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
      : imagePagesReviewInput ? 'repair_image_pages'
        : nativeReviewInput ? 'repair_pptx_native' : deriveScreenshotReviewRerunStage(contract, failedChecks, slideReviews);
    const artifactRefs = [
      reviewMarkdown,
      reviewCapture.reviewMarkdownFile,
      captureManifest.manifest_file,
      ...slideReviews.map((slide) => slide.screenshot_file),
    ].filter(Boolean);
    const closeout = buildReviewExportCloseout({
      family: 'ppt_deck',
      route: 'screenshot_review',
      deliverableId,
      status,
      blockerKind: reviewExportBlockerKind({
        route: 'screenshot_review',
        failedChecks,
        slideReviews,
      }),
      blockingReasons: failedChecks,
      nextRequiredOwnerAction: rerunFromStage,
      artifactRefs,
    });
    const visualMemoryProposal = normalizeVisualMemoryProposal({
      data,
      status,
      deliverableId,
      slideReviews,
      closeout,
      captureManifest,
      reviewMarkdown,
    });
    const artifact = {
      ...attachCommon('screenshot_review', contract, generationRuntime, adapter),
      ...closeout,
      review_execution: {
        ...creativeExecution('screenshot_review', generationRuntime, adapter),
        overlay: 'screenshot_review',
        review_scope: incrementalReview ? 'incremental_page_review' : 'full_deck_review',
        ai_review_skipped_for_native_mechanical_block: nativeReviewInput && hasMechanicalBlock,
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
        source_visual_route: safeText(renderArtifact?.route) || null,
        screenshots_dir: nativeReviewInput
          ? path.dirname(safeText(safeArray(renderArtifact?.native_ppt_bundle?.preview_screenshots)[0], reviewCapture.screenshotsDir))
          : imagePagesReviewInput
            ? path.dirname(safeText(slideReviews[0]?.screenshot_file, reviewCapture.screenshotsDir))
          : reviewCapture.screenshotsDir,
        review_markdown_file: reviewCapture.reviewMarkdownFile,
        manifest_file: captureManifest.manifest_file,
        store_dir: captureManifest.store_dir,
        capture_mode: captureManifest.capture_mode || (incrementalReview ? 'delta' : 'full'),
        requires_full_materialization_before_export: incrementalReview,
        device_scale_factor: Number(reviewPayload.device_scale_factor || 2),
        screenshot_dimensions: reviewPayload.screenshot_dimensions || null,
      },
      render_review_machine_gate: buildRenderReviewMachineGate({
        sourceSurfaceKind: nativeReviewInput ? 'native_pptx'
          : imagePagesReviewInput ? 'image_pages' : 'html',
        renderedPageRefs: nativeReviewInput ? safeArray(renderArtifact?.native_ppt_bundle?.preview_screenshots) : [],
        imagePngRefs: imagePagesReviewInput
          ? slideReviews.map((slide) => safeText(slide?.screenshot_file)).filter(Boolean)
          : [],
        pageManifestRef: captureManifest.manifest_file,
        materialGapRefs: safeArray(reviewPayload?.material_gap_refs),
        brandGapRefs: safeArray(reviewPayload?.brand_gap_refs),
        typedBlockerRefs: safeArray(reviewPayload?.typed_blocker_refs),
        slideReviews,
        failedChecks,
        rerunFromStage,
      }),
      slide_reviews: slideReviews,
      visual_memory_proposal: visualMemoryProposal,
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
      artifact_refs: artifactRefs,
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
      primarySurface(generationRuntime),
    );
    writeText(reviewCapture.reviewMarkdownFile, renderedReviewMarkdown);
    writeText(reviewMarkdown, renderedReviewMarkdown);
    return artifact;
  }


  function reviewArtifactRerunFromStage(artifact) {
    const rerunPolicy = artifact?.review_state_patch?.rerun_policy || {};
    return safeText(artifact?.review_state_patch?.rerun_from_stage)
      || (
        safeText(rerunPolicy?.status) === 'rerun_required'
          ? safeText(rerunPolicy?.rerun_from_stage)
          : ''
      );
  }

  function reviewArtifactRequestsRoute(artifact, routeId) {
    return safeText(artifact?.status) === 'block'
      && reviewArtifactRerunFromStage(artifact) === routeId;
  }

  function ensurePrerequisites({ workspaceRoot, topicId, deliverableId, route, mode, baselineDeliverableId }) {
    const deliverablePaths = getDeliverablePaths(workspaceRoot, topicId, deliverableId);
    const contract = readJson(path.join(deliverablePaths.deliverableDir, 'contracts', 'hydrated-deliverable.json'));
    const missing = safeArray(deps.STAGE_REQUIREMENTS?.[route]?.requires_artifacts)
      .filter((stageId) => !readStageArtifact(contract, deliverablePaths, stageId));
    if (missing.length > 0) {
      throw new Error(`Route ${route} requires completed stage artifacts: ${missing.join(', ')}`);
    }
    if (deps.STAGE_REQUIREMENTS?.[route]
      && !['storyline', 'detailed_outline', 'slide_blueprint', 'visual_direction'].includes(route)) {
      assertClaimSpineArtifactContinuity(
        readStageArtifact(contract, deliverablePaths, 'storyline'),
        readStageArtifact(contract, deliverablePaths, 'detailed_outline'),
        readStageArtifact(contract, deliverablePaths, 'slide_blueprint'),
        readStageArtifact(contract, deliverablePaths, 'visual_direction'),
      );
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
    const currentHtmlMtimeMs = stageArtifactMtimeMs(contract, deliverablePaths, currentHtmlStage);
    const currentVisualStage = currentVisualStageId(contract, deliverablePaths);
    const currentVisualMtimeMs = visualArtifactMtimeMs(contract, deliverablePaths);
    if (route === PAGE_FIX_ROUTE) {
      const screenshotReviewMtimeMs = stageArtifactMtimeMs(contract, deliverablePaths, 'screenshot_review');
      if (screenshotReviewMtimeMs < currentHtmlMtimeMs) {
        throw new Error('Route fix_html requires screenshot_review based on the current HTML; rerun screenshot_review first');
      }
    }
    if (route === 'repair_pptx_native') {
      const directorReviewArtifact = readStageArtifact(contract, deliverablePaths, 'visual_director_review');
      const directorReviewMtimeMs = stageArtifactMtimeMs(contract, deliverablePaths, 'visual_director_review');
      const screenshotReviewMtimeMs = stageArtifactMtimeMs(contract, deliverablePaths, 'screenshot_review');
      const authorMtimeMs = stageArtifactMtimeMs(contract, deliverablePaths, 'author_pptx_native');
      const hasFreshScreenshotRepairRequest = screenshotReviewMtimeMs >= authorMtimeMs
        && reviewArtifactRequestsRoute(readStageArtifact(contract, deliverablePaths, 'screenshot_review'), 'repair_pptx_native');
      const hasFreshDirectorRepairRequest = directorReviewMtimeMs >= authorMtimeMs
        && reviewArtifactRequestsRoute(directorReviewArtifact, 'repair_pptx_native');
      if (!hasFreshScreenshotRepairRequest && !hasFreshDirectorRepairRequest) {
        throw new Error('Route repair_pptx_native requires visual_director_review or screenshot_review based on the current native PPTX and requesting repair_pptx_native; rerun visual_director_review or screenshot_review first');
      }
    }
    if (route === 'repair_image_pages') {
      const directorReviewArtifact = readStageArtifact(contract, deliverablePaths, 'visual_director_review');
      const directorReviewMtimeMs = stageArtifactMtimeMs(contract, deliverablePaths, 'visual_director_review');
      const repairMtimeMs = stageArtifactMtimeMs(contract, deliverablePaths, 'repair_image_pages');
      const screenshotReviewMtimeMs = stageArtifactMtimeMs(contract, deliverablePaths, 'screenshot_review');
      const screenshotReviewArtifact = readStageArtifact(contract, deliverablePaths, 'screenshot_review');
      const authorMtimeMs = stageArtifactMtimeMs(contract, deliverablePaths, 'author_image_pages');
      const currentImageMtimeMs = Math.max(authorMtimeMs, repairMtimeMs);
      const hasFreshScreenshotRepairRequest = screenshotReviewMtimeMs >= currentImageMtimeMs
        && reviewArtifactRequestsRoute(screenshotReviewArtifact, 'repair_image_pages');
      const hasFreshDirectorRepairRequest = directorReviewMtimeMs >= currentImageMtimeMs
        && reviewArtifactRequestsRoute(directorReviewArtifact, 'repair_image_pages');
      if (!hasFreshScreenshotRepairRequest && !hasFreshDirectorRepairRequest) {
        throw new Error('Route repair_image_pages requires visual_director_review or screenshot_review based on the current image pages and requesting repair_image_pages; rerun visual_director_review or screenshot_review first');
      }
    }
    if (route === 'visual_director_review' && !currentVisualStage) {
      throw new Error('Route visual_director_review requires author_image_pages, render_html, or author_pptx_native before review');
    }
    if (route === 'screenshot_review') {
      const directorReviewArtifact = readStageArtifact(contract, deliverablePaths, 'visual_director_review');
      const screenshotFeedbackOnlyRoute = reviewArtifactRequestsRoute(directorReviewArtifact, 'repair_pptx_native')
        ? 'repair_pptx_native'
        : '';
      if (!directorReviewArtifact || (directorReviewArtifact.status !== 'pass' && !screenshotFeedbackOnlyRoute)) {
        throw new Error('Route screenshot_review requires visual_director_review to pass before audit');
      }
      const directorReviewMtimeMs = stageArtifactMtimeMs(contract, deliverablePaths, 'visual_director_review');
      if (directorReviewMtimeMs < currentVisualMtimeMs) {
        throw new Error('Route screenshot_review requires visual_director_review to be rerun after the latest visual changes');
      }
    }
    if (route === 'export_pptx') {
      const reviewArtifact = readStageArtifact(contract, deliverablePaths, 'screenshot_review');
      if (!reviewArtifact || reviewArtifact.status !== 'pass') {
        throw new Error('Route export_pptx requires screenshot_review to pass before export');
      }
      const screenshotReviewMtimeMs = stageArtifactMtimeMs(contract, deliverablePaths, 'screenshot_review');
      if (screenshotReviewMtimeMs < currentVisualMtimeMs) {
        throw new Error('Route export_pptx requires screenshot_review to be rerun after the latest visual changes');
      }
    }
  }


  return {
    ...renderParts,
    ...imagePageParts,
    ...nativePptParts,
    buildDirectorReview,
    buildExportArtifact,
    buildScreenshotReviewArtifact,
    ensurePrerequisites,
  };
}
