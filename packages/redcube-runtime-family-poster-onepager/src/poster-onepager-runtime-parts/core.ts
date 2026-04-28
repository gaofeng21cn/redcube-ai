// @ts-nocheck
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';

import {
  buildSourceTruthConsumptionSummary,
  getDeliverablePaths,
  resolvePythonNativeHelper,
} from '@redcube/runtime-protocol';
import { getReviewState, isBaselineApprovedState } from '@redcube/governance';
import { createPosterOnepagerAuthoringParts } from './authoring.js';
import { createPosterOnepagerScreenshotReviewParts } from './core-screenshot-review.js';
import { createPosterOnepagerPromptSourceTruthHelpers } from './prompt-source-truth-helpers.js';
import { createPosterOnepagerReviewHelpers } from './review-helpers.js';
import {
  CODEX_DEFAULT_ADAPTER,
  createPosterOnepagerRouteReviewHelpers,
  generateStructuredArtifact,
  lifecycleStageForRoute,
  reviewOverlayForRoute,
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
 * @typedef {import('./types.js').PosterRuntimeRunRequest} PosterRuntimeRunRequest
 * @typedef {import('./types.js').PosterRuntimeRouteResult} PosterRuntimeRouteResult
 */

export function createPosterOnepagerRuntimeCore() {
  const MODULE_DIR = path.dirname(fileURLToPath(import.meta.url));
  const REPO_ROOT = path.resolve(MODULE_DIR, '../../../..');
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
    publicSources,
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
  const {
    attachCommon,
    creativeExecution,
    creativeSourceStamp,
    primarySurface,
    reviewAuthorship,
  } = createPosterOnepagerRouteReviewHelpers({ promptMeta, safeText });
  
  const {
    requireText,
    normalizeStringList,
    normalizePosterScreenshotAiSlideReviews,
    hasAiVisualPass,
    hasAiVisualBlock,
    normalizeAiVisualJudgement,
    buildAiFirstVisualSlideReview,
    aiFirstMechanicalCheckValue,
    slideNeedsTargetedRevision,
    requireObjectArray,
    audienceFacingLines,
    extractAudienceFacingSnippet,
    sourceTopicSummary,
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
    extractAudienceFacingSnippet,
    generateStructuredArtifact,
    lifecycleStageForRoute,
    normalizeStringList,
    operatorMaterials,
    promptRoute,
    readStageArtifact,
    requireObjectArray,
    requireText,
    reviewOverlayForRoute,
    safeArray,
    safeText,
    sourceLabels,
    sourceMaterialIds,
    sourceMaterials,
    sourceTruth,
    stageOrder,
    publicSources,
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
  const {
    buildScreenshotReview,
  } = createPosterOnepagerScreenshotReviewParts({
    CANVAS,
    CODEX_DEFAULT_ADAPTER,
    CREATIVE_MATERIALIZED_FROM,
    PYTHON_REVIEW,
    attachCommon,
    aiFirstMechanicalCheckValue,
    buildAiFirstVisualSlideReview,
    buildAuthoringContext,
    creativeExecution,
    creativeSourceStamp,
    ensureDir,
    generateStructuredArtifact,
    getDeliverableViewSurfacePaths,
    hasAiVisualBlock,
    loadRenderedPosterSlideHtmlMap,
    normalizePosterScreenshotAiSlideReviews,
    normalizeStringList,
    primarySurface,
    promoteStableView,
    promptRoute,
    readJson,
    readStageArtifact,
    requireText,
    rerunStageFromReviewSurface,
    reviewAuthorship,
    runPython,
    safeArray,
    safeText,
    screenshotReviewOutputContract,
    stageArtifactPath,
    summarizePanels,
    writeText,
  });

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

  function renderContract(contract) {
    return contract?.prompt_pack?.render_contract || {};
  }
  
  async function generateRenderHtmlDraft(
    contract,
    deliverablePaths,
    adapter = CODEX_DEFAULT_ADAPTER,
  ) {
    const blueprintArtifact = readStageArtifact(contract, deliverablePaths, 'poster_blueprint');
    const visualArtifact = readStageArtifact(contract, deliverablePaths, 'visual_direction');
    const { data, generationRuntime } = await generateStructuredArtifact({
      adapter,
      family: 'poster_onepager',
      route: 'render_html',
      promptRelativePath: promptRoute(contract, 'render_html'),
      context: {
        ...buildAuthoringContext(contract),
        blueprint: {
          slides: safeArray(blueprintArtifact?.poster_blueprint?.slides).map((slide) => ({
            slide_id: slide.slide_id,
            title: slide.title,
            layout_family: slide.layout_family,
            render_recipe_id: slide.render_recipe_id,
            headline: slide.headline,
            subheadline: slide.subheadline,
            audience_judgement: slide.audience_judgement,
            why_now: slide.why_now,
            proof_promise: slide.proof_promise,
            call_to_action: slide.call_to_action,
            panels: summarizePanels(slide),
            public_sources: safeArray(slide.evidence_and_sources).map((item) => item.public_label),
            anchor_tracks: safeArray(slide?.visual_presentation?.anchor_tracks),
          })),
        },
        visual_direction: visualArtifact?.visual_direction || null,
        shell_contract: {
          ratio: CANVAS.ratio,
          width: CANVAS.width,
          height: CANVAS.height,
          controls: ['slide-display-area', 'prev-btn', 'next-btn'],
        },
        html_guardrails: [
          '输出完整 4:5 单页 HTML，必须包含 data-slide-root=true 与匹配的 data-slide-id。',
          '至少提供 2 个语义化 data-qa-block，并至少标记 1 个 data-primary-point=true，供截图审稿读取布局结构。',
          '不要使用 renderSlide/layoutByType/cardsGrid/pageType，不要输出 <script>/<style> block，也不要把模板注册表或内部文档写入 HTML。',
          'HTML 必须由 AI 直接创作，不得退化成固定模板 compiler 或 slot 填空产物。',
        ],
      },
      outputContract: renderHtmlOutputContract(),
    });
    return {
      blueprintArtifact,
      visualArtifact,
      data,
      generationRuntime,
    };
  }
  
  async function buildRenderHtmlArtifact({
    deliverableId,
    contract,
    deliverablePaths,
    adapter = CODEX_DEFAULT_ADAPTER,
  }) {
    const {
      blueprintArtifact,
      visualArtifact,
      data,
      generationRuntime,
    } = await generateRenderHtmlDraft(contract, deliverablePaths, adapter);
    const slideHtmlById = new Map(
      requireObjectArray(data?.slides, 'render_html.slides', { min: 1, max: 2 }).map((slide) => [
        safeText(slide.slide_id),
        validateRenderedPosterHtml(slide.content_html, safeText(slide.slide_id)),
      ]),
    );
    const blueprintSlides = safeArray(blueprintArtifact?.poster_blueprint?.slides);
    if (blueprintSlides.length === 0) {
      throw new Error('upstream poster render_html requires poster_blueprint slides');
    }
    const peakRegion = safeText(visualArtifact?.visual_direction?.peak_region) || (() => { throw new Error('poster render_html requires visual_direction.peak_region from AI-authored visual direction'); })();
    const slides = blueprintSlides.map((slide) => {
      const rawContent = slideHtmlById.get(slide.slide_id);
      if (!rawContent) {
        throw new Error(`upstream poster render_html missing slide: ${slide.slide_id}`);
      }
      const recipeDecision = creativeSourceStamp({
        route: 'render_html',
        lifecycleStage: 'visual_authorship',
        authoredSurface: 'recipe_selection',
        materializedFrom: CREATIVE_MATERIALIZED_FROM,
        generationRuntime,
        adapter,
      });
      const finalMarkup = creativeSourceStamp({
        route: 'render_html',
        lifecycleStage: 'visual_authorship',
        authoredSurface: 'final_html_markup',
        materializedFrom: CREATIVE_MATERIALIZED_FROM,
        generationRuntime,
        adapter,
      });
      const content = authoringValidateRenderedReviewAnchors(
        hydrateRenderedSlideRootMetadata(rawContent, {
          'data-title': slide.title,
          'data-layout-family': slide.layout_family,
          'data-speaker-seconds': 45,
          'data-recipe-id': slide.render_recipe_id,
          'data-template-id': 'upstream_ai_html',
          'data-peak-region': peakRegion,
          'data-director-role': peakRegion,
        }, slide.slide_id),
        slide.slide_id,
        'poster',
      );
      return {
        slide_id: slide.slide_id,
        title: slide.title,
        layout_family: slide.layout_family,
        recipe_id: slide.render_recipe_id,
        template_id: 'upstream_ai_html',
        director_contract: {
          peak_region: peakRegion,
          poster_motif: safeText(visualArtifact?.visual_direction?.poster_motif),
          panel_emphasis: visualArtifact?.visual_direction?.panel_emphasis || {},
          anti_template_constraints: safeArray(visualArtifact?.visual_direction?.anti_template_constraints),
          final_instruction_to_html_generator: safeArray(visualArtifact?.visual_direction?.final_instruction_to_html_generator),
        },
        palette: visualArtifact?.visual_direction?.palette || {
          paper: '#FFF9F1',
          ink: '#0F172A',
          accent: '#1D4ED8',
          highlight: '#F97316',
        },
        creative_sources: {
          recipe_selection: recipeDecision,
          final_markup: finalMarkup,
        },
        creative_authorship: {
          recipe_selection: recipeDecision,
          final_html_markup: finalMarkup,
        },
        markup_contract_source: CREATIVE_MATERIALIZED_FROM,
        content,
      };
    });
    const contractRender = renderContract(contract);
    const renderPlan = {
      render_strategy: safeText(contractRender.render_strategy, 'upstream_structured_ai_html'),
      shell_file: resolvePromptPackAsset(contract, safeText(contractRender.shell_file, 'render_shell.html')),
      pack_id: safeText(contract?.prompt_pack?.pack_id),
      authored_markup_surface: CREATIVE_MATERIALIZED_FROM,
      markup_binding_model: 'slides_data_shell_only',
      peak_region: peakRegion,
      slides: slides.map((slide) => ({
        slide_id: slide.slide_id,
        title: slide.title,
        layout_family: slide.layout_family,
        recipe_id: slide.recipe_id,
        template_id: slide.template_id,
      })),
    };
    const viewSurfacePaths = getDeliverableViewSurfacePaths(deliverablePaths, deliverableId);
    const htmlFile = viewSurfacePaths.draftHtmlFile;
    const slidesFile = viewSurfacePaths.draftSlidesFile;
    const shellText = readPromptPackText(renderPlan.shell_file);
    writeText(htmlFile, buildHtml({
      title: contract.title,
      slides,
      renderPlan,
      renderStrategy: renderPlan.render_strategy,
      shellText,
    }));
    writeJson(slidesFile, {
      title: contract.title,
      slides: slides.map((slide) => ({
        slideId: slide.slide_id,
        title: slide.title,
        recipeId: slide.recipe_id,
        content: slide.content,
      })),
    });
    return {
      ...attachCommon('render_html', contract, generationRuntime, adapter),
      creative_execution: creativeExecution(
        lifecycleStageForRoute(contract, 'render_html') || 'visual_authorship',
        generationRuntime,
        adapter,
      ),
      lifecycle_stage: lifecycleStageForRoute(contract, 'render_html') || 'visual_authorship',
      html_bundle: {
        html_file: htmlFile,
        slides_file: slidesFile,
        page_count: slides.length,
        shell_contract: CANVAS,
        render_strategy: renderPlan.render_strategy,
        director_contract: {
          poster_motif: safeText(visualArtifact?.visual_direction?.poster_motif),
          peak_region: peakRegion,
          page_family_ceiling: visualArtifact?.visual_direction?.page_family_ceiling || {},
          anti_template_constraints: safeArray(visualArtifact?.visual_direction?.anti_template_constraints),
        },
        render_summary: normalizeStringList(data?.render_summary, 'render_html.render_summary', { min: 1, max: 4 }),
        slides,
        render_plan: renderPlan,
      },
      artifact_refs: [htmlFile, slidesFile, ...seedStableViewIfMissing(viewSurfacePaths, htmlFile, slidesFile)],
    };
  }
  

  async function generateDirectorReviewDraft(
    contract,
    deliverablePaths,
    adapter = CODEX_DEFAULT_ADAPTER,
  ) {
    const storylineArtifact = readStageArtifact(contract, deliverablePaths, 'storyline');
    const blueprintArtifact = readStageArtifact(contract, deliverablePaths, 'poster_blueprint');
    const visualArtifact = readStageArtifact(contract, deliverablePaths, 'visual_direction');
    const renderArtifact = readStageArtifact(contract, deliverablePaths, 'render_html');
    const { data, generationRuntime } = await generateStructuredArtifact({
      adapter,
      family: 'poster_onepager',
      route: 'visual_director_review',
      promptRelativePath: promptRoute(contract, 'visual_director_review'),
      context: {
        ...buildAuthoringContext(contract),
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
        render_summary: safeArray(renderArtifact?.html_bundle?.slides).map((slide) => ({
          slide_id: slide.slide_id,
          title: slide.title,
          layout_family: slide.layout_family,
          peak_region: slide.director_contract?.peak_region,
          text_excerpt: normalizeInlineText(stripHtml(slide.content), 220),
        })),
      },
      outputContract: directorReviewOutputContract(),
    });
    return {
      data,
      generationRuntime,
    };
  }
  
  async function buildDirectorReview(contract, deliverablePaths, adapter = CODEX_DEFAULT_ADAPTER) {
    const { data, generationRuntime } = await generateDirectorReviewDraft(contract, deliverablePaths, adapter);
    const checks = {
      director_intent_landed: Boolean(data?.director_intent_landed),
      anti_template_ok: Boolean(data?.anti_template_ok),
      message_hierarchy_clear: Boolean(data?.message_hierarchy_clear),
      evidence_trace_clear: Boolean(data?.evidence_trace_clear),
    };
    const failedChecks = Object.entries(checks)
      .filter(([, value]) => value === false)
      .map(([key]) => key);
    const weakRegions = normalizeStringList(data?.weak_regions, 'visual_director_review.weak_regions', { min: 0, max: 4 });
    const reviewSummary = requireText(data?.review_summary, 'visual_director_review.review_summary');
    const status = failedChecks.length === 0 ? 'pass' : 'block';
    const reviewFile = path.join(deliverablePaths.reportsDir, `${deliverablePaths.deliverableId}_视觉总监复盘.md`);
    const reviewOwner = primarySurface(generationRuntime, adapter);
    writeText(reviewFile, [
      '# 视觉总监复盘',
      '',
      `- review_owner: ${reviewOwner}`,
      `- director_intent_landed: ${checks.director_intent_landed}`,
      `- anti_template_ok: ${checks.anti_template_ok}`,
      `- message_hierarchy_clear: ${checks.message_hierarchy_clear}`,
      `- evidence_trace_clear: ${checks.evidence_trace_clear}`,
      `- weak_regions: ${weakRegions.join(', ') || 'none'}`,
      `- review_summary: ${reviewSummary}`,
    ].join('\n'));
    const rerunFromStage = status === 'pass'
      ? null
      : rerunStageFromReviewSurface(contract, failedChecks, 'visual_director_review');
    return {
      ...attachCommon('visual_director_review', contract, generationRuntime, adapter),
      review_overlay: 'visual_director_review',
      review_authorship: reviewAuthorship('visual_director_review', generationRuntime, adapter),
      review_execution: {
        ...creativeExecution('visual_director_review', generationRuntime, adapter),
        overlay: 'visual_director_review',
      },
      status,
      visual_director_review: {
        review_model: 'director_first_visual_judgement',
        director_intent_landed: checks.director_intent_landed,
        anti_template_ok: checks.anti_template_ok,
        message_hierarchy_clear: checks.message_hierarchy_clear,
        evidence_trace_clear: checks.evidence_trace_clear,
        weak_regions: weakRegions,
        rewrite_action: safeText(data?.rewrite_action, status === 'pass' ? 'none' : 'revise_render_html'),
        review_summary: reviewSummary,
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
        latest_checks: checks,
        pending_reviews: failedChecks,
        blocking_reasons: failedChecks,
        rerun_from_stage: rerunFromStage,
        rerun_policy: {
          status: status === 'pass' ? 'idle' : 'rerun_required',
          rerun_from_stage: rerunFromStage,
        },
      },
    };
  }
  
  function buildExportBundle(contract, deliverablePaths, adapter = CODEX_DEFAULT_ADAPTER) {
    const reviewArtifact = readStageArtifact(contract, deliverablePaths, 'screenshot_review');
    const stableViewHtmlFile = getDeliverableViewSurfacePaths(
      deliverablePaths,
      deliverablePaths.deliverableId,
    ).stableHtmlFile;
    if (!existsSync(stableViewHtmlFile)) {
      throw new Error(`Route export_bundle requires reviewed stable HTML surface before export: ${stableViewHtmlFile}`);
    }
    const manifestFile = path.join(deliverablePaths.reportsDir, `${deliverablePaths.deliverableId}-publish-manifest.json`);
    const exportBundle = {
      source_html: stableViewHtmlFile,
      png_files: safeArray(reviewArtifact.slide_reviews).map((slide) => slide.screenshot_file).filter(Boolean),
      review_markdown: safeText(reviewArtifact.report_markdown),
      publish_manifest_file: manifestFile,
      delivery_state: {
        current: 'output_ready',
        next: null,
      },
    };
    writeJson(manifestFile, exportBundle);
    return {
      ...attachCommon('export_bundle', contract, null, adapter),
      status: 'completed',
      export_bundle: exportBundle,
      artifact_refs: [manifestFile, stableViewHtmlFile, exportBundle.review_markdown, ...exportBundle.png_files].filter(Boolean),
      review_state_patch: {
        current_status: 'completed',
        ready_for_export: true,
        latest_review_stage: 'export_bundle',
        latest_checks: {
          director_intent_landed: true,
          anti_template_ok: true,
          message_hierarchy_clear: true,
          overflow_free: true,
          occlusion_free: true,
          visual_density_ok: true,
        },
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
