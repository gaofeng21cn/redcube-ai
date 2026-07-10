// @ts-nocheck
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  buildSourceTruthConsumptionSummary,
  getDeliverablePaths,
  resolvePythonNativeHelper,
} from '@redcube/runtime-protocol';
import { getReviewState, isBaselineApprovedState } from '@redcube/governance';
import { compareFailuresAndDensity, summarizeRelativeQuality } from '../../../relative-quality.js';
import { createPosterOnepagerAuthoringParts } from './authoring.js';
import { createPosterOnepagerCoreAssemblyHelpers } from './core-assembly-helpers.js';
import { createPosterOnepagerPromptSourceTruthHelpers } from './prompt-source-truth-helpers.js';
import { createPosterOnepagerReviewHelpers } from './review-helpers.js';
import {
  CODEX_DEFAULT_ADAPTER,
  createPosterOnepagerRouteReviewHelpers,
  generateStructuredArtifact,
  lifecycleStageForRoute,
} from './route-review-helpers.js';
import {
  ensureDir,
  getDeliverableViewSurfacePaths,
  normalizeInlineText,
  promoteStableView,
  readJson,
  readStageArtifact,
  runPython,
  safeArray,
  safeText,
  seedStableViewIfMissing,
  stageArtifactPath,
  writeJson,
  writeText,
} from './surface-helpers.js';

/**
 * @typedef {import('../types.js').PosterRuntimeRunRequest} PosterRuntimeRunRequest
 * @typedef {import('../types.js').PosterRuntimeRouteResult} PosterRuntimeRouteResult
 */

export function createPosterOnepagerRuntimeCore() {
  const MODULE_DIR = path.dirname(fileURLToPath(import.meta.url));
  const REPO_ROOT = path.resolve(MODULE_DIR, '../../../../../..');
  const PYTHON_REVIEW = resolvePythonNativeHelper(REPO_ROOT, 'ppt_deck_review');
  const CANVAS = Object.freeze({ ratio: '4:5', width: 1080, height: 1350 });
  const BANNED_RENDER_TOKENS = Object.freeze(['renderSlide', 'layoutByType', 'cardsGrid', 'pageType']);
  const CREATIVE_MATERIALIZED_FROM = 'codex_cli_json_output';
  const MIN_REVIEW_QA_BLOCKS = 2;
  const MIN_REVIEW_PRIMARY_POINTS = 1;
  const HARD_SCREENSHOT_BLOCKING_ISSUES = new Set(['overflow_detected']);
  const TARGETED_SCREENSHOT_MECHANICAL_ISSUES = new Set([
    'overflow_detected',
    'occlusion_detected',
    'visual_density_out_of_range',
    'block_content_overflow_detected',
  ]);
  const ROUTE_TO_SOURCE_TRUTH_CONSUMPTION_ROLE = Object.freeze({
    storyline: 'story_architecture',
    poster_blueprint: 'story_architecture',
    visual_direction: 'visual_authorship',
  });
  const {
    promptMeta,
    promptRoute,
    readPromptPackText,
    resolvePromptPackAsset,
    sourceLabels,
    sourceMaterialIds,
    sourceMaterials,
    sourceTruth,
    operatorMaterials,
  } = createPosterOnepagerPromptSourceTruthHelpers({ repoRoot: REPO_ROOT });
  
  function stageOrder(contract, stageId) {
    return safeArray(contract?.stage_sequence?.stages).findIndex((stage) => stage?.stage_id === stageId);
  }
  
  function rerunStageFromReviewSurface(contract, failedChecks, fallbackStage) {
    const rerunMap = contract?.review_surface?.rerun_from_stage || {};
    const candidates = safeArray(failedChecks)
      .map((checkId) => safeText(rerunMap?.[checkId], fallbackStage))
      .filter(Boolean);
    if (candidates.length === 0) return null;
    return candidates.reduce((earliest, candidate) => {
      if (!earliest) return candidate;
      const earliestOrder = stageOrder(contract, earliest);
      const candidateOrder = stageOrder(contract, candidate);
      if (candidateOrder === -1) return earliest;
      if (earliestOrder === -1 || candidateOrder < earliestOrder) return candidate;
      return earliest;
    }, null);
  }
  const routeReviewHelpers = createPosterOnepagerRouteReviewHelpers({ promptMeta, safeText });
  const {
    creativeExecution,
    creativeSourceStamp,
    primarySurface,
    reviewAuthorship,
  } = routeReviewHelpers;

  function refSegment(value, fallback) {
    return safeText(value, fallback).replace(/[^A-Za-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '') || fallback;
  }

  function attachCommon(route, contract, generationRuntime = null, adapter = CODEX_DEFAULT_ADAPTER) {
    const safeRoute = refSegment(route, 'route');
    const safeDeliverableId = refSegment(contract?.deliverable_id, 'deliverable');
    return {
      ...routeReviewHelpers.attachCommon(route, contract, generationRuntime, adapter),
      owner_receipt_refs: [`rca-owner-receipt:visual-stage:poster_onepager:${safeRoute}:${safeDeliverableId}`],
      typed_blocker_refs: [`rca-typed-blocker:visual-stage:poster_onepager:${safeRoute}:${safeDeliverableId}`],
    };
  }
  
  const {
    requireText,
    normalizeStringList,
    normalizePosterScreenshotAiSlideReviews,
    hasAiVisualBlock,
    buildAiFirstVisualSlideReview,
    aiFirstMechanicalCheckValue,
    requireObjectArray,
  } = createPosterOnepagerReviewHelpers({
    safeText,
    safeArray,
    sourceTruth,
    sourceMaterials,
    hardScreenshotBlockingIssues: HARD_SCREENSHOT_BLOCKING_ISSUES,
    targetedScreenshotMechanicalIssues: TARGETED_SCREENSHOT_MECHANICAL_ISSUES,
  });
  
  const authoringParts = createPosterOnepagerAuthoringParts({
    BANNED_RENDER_TOKENS,
    CANVAS,
    CODEX_DEFAULT_ADAPTER,
    CREATIVE_MATERIALIZED_FROM,
    MIN_REVIEW_PRIMARY_POINTS,
    MIN_REVIEW_QA_BLOCKS,
    attachCommon,
    creativeExecution,
    creativeSourceStamp,
    generateStructuredArtifact,
    lifecycleStageForRoute,
    normalizeStringList,
    operatorMaterials,
    promptRoute,
    readStageArtifact,
    requireObjectArray,
    requireText,
    safeArray,
    safeText,
    sourceLabels,
    sourceMaterialIds,
    sourceMaterials,
    sourceTruth,
  });
  const {
    buildAuthoringContext,
    buildPosterBlueprintArtifact,
    buildPosterVisualDirectionArtifact,
    buildStoryline,
    buildHtml,
    directorReviewOutputContract,
    loadRenderedPosterSlideHtmlMap,
    renderHtmlOutputContract,
    screenshotReviewOutputContract,
    stripHtml,
    summarizePanels,
    hydrateRenderedSlideRootMetadata,
    validateRenderedPosterHtml,
    validateRenderedReviewAnchors: authoringValidateRenderedReviewAnchors,
  } = authoringParts;
  function buildScreenshotReviewMarkdown(contract, reviewArtifact, reviewOwner) {
    const lines = [
      `# ${contract.title} 视觉质控`,
      '',
      `- review_owner: ${safeText(reviewOwner, 'codex_cli_runtime')}`,
      `- 状态: ${reviewArtifact.status}`,
      `- director_intent_landed: ${reviewArtifact.checks.director_intent_landed}`,
      `- anti_template_ok: ${reviewArtifact.checks.anti_template_ok}`,
      `- message_hierarchy_clear: ${reviewArtifact.checks.message_hierarchy_clear}`,
      `- overflow_free: ${reviewArtifact.checks.overflow_free}`,
      `- occlusion_free: ${reviewArtifact.checks.occlusion_free}`,
      `- visual_density_ok: ${reviewArtifact.checks.visual_density_ok}`,
      `- block_content_fit_ok: ${reviewArtifact.checks.block_content_fit_ok}`,
      '',
      '## AI 审阅结论',
      `- review_model: ${safeText(reviewArtifact.ai_review?.review_model)}`,
      `- weak_regions: ${safeArray(reviewArtifact.ai_review?.weak_regions).join(', ') || 'none'}`,
      `- review_summary: ${safeText(reviewArtifact.ai_review?.review_summary)}`,
      '',
      '## 分页记录',
    ];
    for (const slide of safeArray(reviewArtifact.slide_reviews)) {
      lines.push(`- ${safeText(slide.slide_id)} / ${safeText(slide.status)} / ${safeText(slide.screenshot_file)}`);
      if (slide.ai_review) {
        lines.push(`  - AI judgement: ${safeText(slide.ai_review.judgement)}`);
        lines.push(`  - AI findings: ${safeArray(slide.ai_review.visual_findings).join('；')}`);
        lines.push(`  - Recommended fix: ${safeText(slide.ai_review.recommended_fix, 'none')}`);
      }
    }
    if (reviewArtifact.baseline_review?.summary) {
      lines.push('', '## Baseline Relative Review', safeText(reviewArtifact.baseline_review.summary));
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
    const storylineArtifact = readStageArtifact(contract, deliverablePaths, 'storyline');
    const blueprintArtifact = readStageArtifact(contract, deliverablePaths, 'poster_blueprint');
    const visualArtifact = readStageArtifact(contract, deliverablePaths, 'visual_direction');
    const directorReviewArtifact = readStageArtifact(contract, deliverablePaths, 'visual_director_review');
    const renderedSlideHtmlById = loadRenderedPosterSlideHtmlMap(renderArtifact);
    return generateStructuredArtifact({
      adapter,
      family: 'poster_onepager',
      route: 'screenshot_review',
      promptRelativePath: promptRoute(contract, 'screenshot_review'),
      context: {
        ...buildAuthoringContext(contract),
        mode,
        storyline: storylineArtifact?.storyline || null,
        blueprint: {
          slides: safeArray(blueprintArtifact?.poster_blueprint?.slides).map((slide) => ({
            slide_id: slide.slide_id,
            title: slide.title,
            layout_family: slide.layout_family,
            render_recipe_id: slide.render_recipe_id,
            panels: summarizePanels(slide),
          })),
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
            source_html: renderedSlideHtmlById.get(safeText(slide.slide_id)) || null,
          })),
        },
      },
      outputContract: screenshotReviewOutputContract(),
      localFileInspection: slideReviews.map((slide, index) => ({
        label: `${slide.slide_id} ${safeText(slide.title, `Poster ${index + 1}`)}`.trim(),
        path: slide.screenshot_file,
        media_type: 'image/png',
        purpose: `Review rendered poster screenshot for ${slide.slide_id}`,
      })),
      cwd: deliverablePaths.deliverableDir,
    });
  }

  function computeBaselineReview(workspaceRoot, topicId, baselineDeliverableId, slideReviews) {
    const baselinePaths = getDeliverablePaths(workspaceRoot, topicId, baselineDeliverableId);
    const baselineContract = readJson(path.join(baselinePaths.deliverableDir, 'contracts', 'hydrated-deliverable.json'));
    const baselineArtifact = readStageArtifact(baselineContract, baselinePaths, 'screenshot_review');
    if (!baselineArtifact) {
      throw new Error(`Baseline screenshot review artifact missing: ${baselineDeliverableId}`);
    }
    const currentFailures = slideReviews.filter((slide) => safeArray(slide.issues).length > 0).length;
    const baselineFailures = safeArray(baselineArtifact.slide_reviews).filter((slide) => safeArray(slide.issues).length > 0).length;
    const currentDensity = slideReviews.reduce((sum, slide) => sum + Number(slide.metrics?.occupied_ratio || 0), 0) / Math.max(slideReviews.length, 1);
    const baselineDensity = safeArray(baselineArtifact.slide_reviews).reduce((sum, slide) => sum + Number(slide.metrics?.occupied_ratio || 0), 0) / Math.max(safeArray(baselineArtifact.slide_reviews).length, 1);
    const relativeQuality = compareFailuresAndDensity({
      currentFailures,
      baselineFailures,
      currentDensity,
      baselineDensity,
      densityTolerance: 0.2,
      densityDigits: 4,
      densityLabel: '平均占用率',
    });
    const passed = relativeQuality.verdict !== 'degraded';
    return {
      baseline_deliverable_id: baselineDeliverableId,
      baseline_review_file: stageArtifactPath(baselineContract, baselinePaths, 'screenshot_review'),
      current_average_density: Number(currentDensity.toFixed(4)),
      baseline_average_density: Number(baselineDensity.toFixed(4)),
      current_failed_slides: currentFailures,
      baseline_failed_slides: baselineFailures,
      baseline_comparison_passed: passed,
      relative_quality: relativeQuality,
      summary: summarizeRelativeQuality(relativeQuality),
    };
  }

  async function buildScreenshotReview(
    workspaceRoot,
    topicId,
    contract,
    deliverablePaths,
    mode,
    baselineDeliverableId,
    adapter = CODEX_DEFAULT_ADAPTER,
  ) {
    const renderArtifact = readStageArtifact(contract, deliverablePaths, 'render_html');
    const directorReview = readStageArtifact(contract, deliverablePaths, 'visual_director_review');
    const reviewMarkdown = path.join(deliverablePaths.reportsDir, `${deliverablePaths.deliverableId}_视觉质控复核.md`);
    const screenshotsDir = ensureDir(path.join(deliverablePaths.reportsDir, 'screenshots'));
    const args = [
      '--html', renderArtifact.html_bundle.html_file,
      '--output-dir', screenshotsDir,
      '--review-markdown', reviewMarkdown,
      '--max-primary-points', String(contract.layout_rules?.max_primary_points_per_poster || 4),
      '--frame-width', String(CANVAS.width),
      '--frame-height', String(CANVAS.height),
    ];
    if (mode === 'optimize_existing') {
      const baselinePaths = getDeliverablePaths(workspaceRoot, topicId, baselineDeliverableId);
      const baselineContract = readJson(path.join(baselinePaths.deliverableDir, 'contracts', 'hydrated-deliverable.json'));
      args.push('--baseline-review', stageArtifactPath(baselineContract, baselinePaths, 'screenshot_review'));
    }
    const python = runPython(PYTHON_REVIEW, args);
    const mechanicalSlideReviews = safeArray(python.slide_reviews).map((slide) => {
      const occupiedRatio = Number(slide?.metrics?.occupied_ratio || 0);
      const overlaps = safeArray(slide?.metrics?.overlaps);
      const overflowFree = Boolean(slide?.checks?.overflow_free);
      const occlusionFree = overlaps.length === 0;
      const visualDensityOk = occupiedRatio >= 0.18 && occupiedRatio <= 0.82;
      const blockContentFitOk = slide?.checks?.block_content_fit_ok !== false;
      const issues = [];
      if (!overflowFree) issues.push('overflow_detected');
      if (!occlusionFree) issues.push('occlusion_detected');
      if (!visualDensityOk) issues.push('visual_density_out_of_range');
      if (!blockContentFitOk) issues.push('block_content_overflow_detected');
      return {
        slide_id: slide.slide_id,
        title: slide.title,
        layout_family: safeText(slide.layout_family),
        screenshot_file: safeText(slide.screenshot_file),
        status: issues.length === 0 ? 'pass' : 'block',
        checks: {
          overflow_free: overflowFree,
          occlusion_free: occlusionFree,
          visual_density_ok: visualDensityOk,
          block_content_fit_ok: blockContentFitOk,
        },
        metrics: {
          occupied_ratio: Number(occupiedRatio.toFixed(4)),
          primary_points: Number(slide?.metrics?.primary_points || 0),
          overlaps,
        },
        issues,
      };
    });
    const { data, generationRuntime } = await generateScreenshotReviewDraft(
      contract,
      deliverablePaths,
      renderArtifact,
      mechanicalSlideReviews,
      python,
      mode,
      adapter,
    );
    const aiWeakRegions = normalizeStringList(data?.weak_regions, 'screenshot_review.weak_regions', { min: 0, max: 4 });
    const aiSlideReviews = normalizePosterScreenshotAiSlideReviews(data?.slide_reviews, mechanicalSlideReviews);
    const aiSlideReviewMap = new Map(aiSlideReviews.map((item) => [item.slide_id, item]));
    const slideReviews = mechanicalSlideReviews.map((slide) => buildAiFirstVisualSlideReview(
      slide,
      aiSlideReviewMap.get(slide.slide_id),
    ));
    const checks = {
      director_intent_landed: Boolean(directorReview?.visual_director_review?.director_intent_landed)
        && Boolean(data?.director_intent_landed),
      anti_template_ok: Boolean(directorReview?.visual_director_review?.anti_template_ok)
        && Boolean(data?.anti_template_ok),
      message_hierarchy_clear: Boolean(directorReview?.visual_director_review?.message_hierarchy_clear)
        && Boolean(data?.message_hierarchy_clear),
      ai_review_passed: slideReviews.every((slide) => !hasAiVisualBlock(slide?.ai_review)),
      overflow_free: slideReviews.every((slide) => slide.checks.overflow_free),
      occlusion_free: aiFirstMechanicalCheckValue(slideReviews, 'occlusion_free'),
      visual_density_ok: aiFirstMechanicalCheckValue(slideReviews, 'visual_density_ok'),
      block_content_fit_ok: aiFirstMechanicalCheckValue(slideReviews, 'block_content_fit_ok'),
    };
    const failedChecks = Object.entries(checks)
      .filter(([, value]) => value === false)
      .map(([key]) => key);
    const rerunFromStage = failedChecks.length === 0
      ? null
      : rerunStageFromReviewSurface(contract, failedChecks, 'render_html');
    const artifact = {
      ...attachCommon('screenshot_review', contract, generationRuntime, adapter),
      review_overlay: 'screenshot_review',
      review_authorship: reviewAuthorship('screenshot_review', generationRuntime, adapter),
      review_execution: {
        ...creativeExecution('screenshot_review', generationRuntime, adapter),
        overlay: 'screenshot_review',
      },
      mode,
      status: failedChecks.length === 0 ? 'pass' : 'block',
      checks,
      slide_reviews: slideReviews,
      ai_review: {
        review_model: 'screenshot_director_first_visual_judgement',
        director_intent_landed: Boolean(data?.director_intent_landed),
        anti_template_ok: Boolean(data?.anti_template_ok),
        message_hierarchy_clear: Boolean(data?.message_hierarchy_clear),
        weak_regions: aiWeakRegions,
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
        checks: python.checks,
        metrics: python.metrics,
      },
      report_markdown: reviewMarkdown,
      metrics: python.metrics,
      artifact_refs: [reviewMarkdown, ...slideReviews.map((slide) => slide.screenshot_file)].filter(Boolean),
      review_state_patch: {
        current_status: failedChecks.length === 0 ? 'export_ready' : 'blocked_for_revision',
        ready_for_export: failedChecks.length === 0,
        latest_review_stage: 'screenshot_review',
        latest_checks: checks,
        pending_reviews: failedChecks,
        blocking_reasons: failedChecks,
        rerun_from_stage: rerunFromStage,
        rerun_policy: {
          status: failedChecks.length === 0 ? 'idle' : 'rerun_required',
          rerun_from_stage: rerunFromStage,
        },
      },
    };
    if (mode === 'optimize_existing') {
      const baselineReview = computeBaselineReview(workspaceRoot, topicId, baselineDeliverableId, slideReviews);
      artifact.baseline_review = baselineReview;
      artifact.checks.baseline_comparison_passed = baselineReview.baseline_comparison_passed;
      artifact.review_state_patch.latest_checks.baseline_comparison_passed = baselineReview.baseline_comparison_passed;
      if (!baselineReview.baseline_comparison_passed) {
        artifact.status = 'block';
        artifact.review_state_patch.current_status = 'blocked_for_revision';
        artifact.review_state_patch.pending_reviews.push('baseline_comparison_passed');
        artifact.review_state_patch.blocking_reasons.push('baseline_comparison_passed');
        artifact.review_state_patch.rerun_from_stage = 'visual_direction';
        artifact.review_state_patch.rerun_policy = {
          status: 'rerun_required',
          rerun_from_stage: 'visual_direction',
        };
      }
    }
    writeText(
      reviewMarkdown,
      buildScreenshotReviewMarkdown(contract, artifact, primarySurface(generationRuntime)),
    );
    if (artifact.status === 'pass') {
      artifact.artifact_refs = [
        ...new Set([
          ...safeArray(artifact.artifact_refs),
          ...promoteStableView(
            getDeliverableViewSurfacePaths(deliverablePaths, deliverablePaths.deliverableId),
            renderArtifact.html_bundle.html_file,
            renderArtifact.html_bundle.slides_file,
          ),
        ]),
      ];
    }
    return artifact;
  }


  function ensurePrerequisites({ workspaceRoot, topicId, deliverableId, route, mode, baselineDeliverableId }) {
    const deliverablePaths = getDeliverablePaths(workspaceRoot, topicId, deliverableId);
    const storedContract = readJson(path.join(deliverablePaths.deliverableDir, 'contracts', 'hydrated-deliverable.json'));
    const required = safeArray(storedContract?.stage_requirements?.[route]?.requires_artifacts);
    const missing = required.filter((stageId) => !readStageArtifact(storedContract, deliverablePaths, stageId));
    if (missing.length > 0) {
      throw new Error(`Route ${route} requires completed stage artifacts: ${missing.join(', ')}`);
    }
    if (route === 'screenshot_review') {
      const directorReview = readStageArtifact(storedContract, deliverablePaths, 'visual_director_review');
      if (!directorReview || directorReview.status !== 'pass') {
        throw new Error('Route screenshot_review requires visual_director_review to pass before audit');
      }
    }
    if (route === 'export_bundle') {
      const reviewArtifact = readStageArtifact(storedContract, deliverablePaths, 'screenshot_review');
      if (!reviewArtifact || reviewArtifact.status !== 'pass') {
        throw new Error('Route export_bundle requires screenshot_review to pass before export');
      }
    }
    if (route === 'screenshot_review' && mode === 'optimize_existing' && !safeText(baselineDeliverableId)) {
      throw new Error('screenshot_review requires baselineDeliverableId in optimize_existing mode');
    }
    if (route === 'screenshot_review' && mode === 'optimize_existing' && safeText(baselineDeliverableId)) {
      const baselineState = getReviewState({ workspaceRoot, topicId, deliverableId: baselineDeliverableId }).state;
      if (!isBaselineApprovedState(baselineState)) {
        throw new Error(`Baseline deliverable is not approved: ${baselineDeliverableId}`);
      }
    }
    return { deliverablePaths };
  }


  const {
    buildDirectorReview,
    buildExportBundle,
    buildRenderHtmlArtifact,
  } = createPosterOnepagerCoreAssemblyHelpers({
    CANVAS,
    CODEX_DEFAULT_ADAPTER,
    CREATIVE_MATERIALIZED_FROM,
    attachCommon,
    authoringValidateRenderedReviewAnchors,
    buildAuthoringContext,
    buildHtml,
    creativeExecution,
    creativeSourceStamp,
    directorReviewOutputContract,
    generateStructuredArtifact,
    getDeliverableViewSurfacePaths,
    hydrateRenderedSlideRootMetadata,
    lifecycleStageForRoute,
    normalizeInlineText,
    normalizeStringList,
    promptRoute,
    primarySurface,
    readPromptPackText,
    readStageArtifact,
    renderHtmlOutputContract,
    requireObjectArray,
    requireText,
    resolvePromptPackAsset,
    rerunStageFromReviewSurface,
    reviewAuthorship,
    safeArray,
    safeText,
    seedStableViewIfMissing,
    stripHtml,
    summarizePanels,
    validateRenderedPosterHtml,
    writeJson,
    writeText,
  });

  return {
    CODEX_DEFAULT_ADAPTER,
    ROUTE_TO_SOURCE_TRUTH_CONSUMPTION_ROLE,
    buildDirectorReview,
    buildExportBundle,
    buildPosterBlueprintArtifact,
    buildPosterVisualDirectionArtifact,
    buildRenderHtmlArtifact,
    buildScreenshotReview,
    buildSourceTruthConsumptionSummary,
    buildStoryline,
    ensurePrerequisites,
    safeArray,
    sourceLabels,
  };
}
