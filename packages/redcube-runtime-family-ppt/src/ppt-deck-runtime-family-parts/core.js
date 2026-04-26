import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';

import {
  generateStructuredArtifactBatchViaCodexCli,
  generateStructuredArtifactViaCodexCli,
} from '@redcube/codex-cli-client';
import {
  buildSourceTruthConsumptionSummary,
  getDeliverablePaths,
  resolveRedCubePythonCommand,
  resolvePythonNativeHelper,
} from '@redcube/runtime-protocol';
import {
  CODEX_DEFAULT_ADAPTER,
  HERMES_NATIVE_PROOF_ADAPTER,
  buildCodexExecutionModel,
  buildHermesNativeProofExecutionModel,
  generateStructuredArtifactViaHermesNativeProof,
} from '@redcube/hermes-substrate';
import { compareFailuresAndDensity, summarizeRelativeQuality } from '@redcube/reference-os';
import { getReviewState, isBaselineApprovedState } from '@redcube/governance';
import {
  buildPptDetailedOutlineArtifact,
  buildPptSlideBlueprintArtifact,
  buildPptVisualDirectionArtifact,
} from '../ppt-structured-artifact-builders.js';
import { createPptDeckAuthoringParts } from './authoring.js';
import { createPptDeckStageParts } from './stages.js';
import { createPptDeckSurfaceParts } from './surface.js';
import { createPptDeckCoreHelpers } from './core-helpers.js';

/**
 * @typedef {{
 *   status?: string,
 *   artifact_refs?: string[],
 *   review_state_patch?: {
 *     current_status?: string,
 *     ready_for_export?: boolean,
 *     latest_review_stage?: string,
 *     pending_reviews?: string[],
 *     blocking_reasons?: string[],
 *     rerun_from_stage?: string | null,
 *     rerun_policy?: {
 *       status?: string,
 *       rerun_from_stage?: string | null,
 *     },
 *   },
 *   html_bundle?: {
 *     html_file?: string,
 *     page_count?: number,
 *   },
 *   export_bundle?: {
 *     pptx_file?: string,
 *     pdf_file?: string,
 *     page_count?: number,
 *   },
 * }} PptRouteArtifact
 */

export function createPptDeckRuntimeCore() {
  const MODULE_DIR = path.dirname(fileURLToPath(import.meta.url));
  const REPO_ROOT = path.resolve(MODULE_DIR, '../../../..');
  const PYTHON_REVIEW = resolvePythonNativeHelper(REPO_ROOT, 'ppt_deck_review');
  const PYTHON_EXPORT = resolvePythonNativeHelper(REPO_ROOT, 'ppt_deck_export');
  const PYTHON_NATIVE = resolvePythonNativeHelper(REPO_ROOT, 'ppt_deck_native');
  const NATIVE_PPT_ENGINE_CONTRACT = path.join(REPO_ROOT, 'contracts/runtime-program/ppt-native-python-engine-contract.json');
  const PROMPT_PACK = Object.freeze({
    storyline: 'prompts/ppt_deck/storyline.md',
    detailed_outline: 'prompts/ppt_deck/detailed_outline.md',
    slide_blueprint: 'prompts/ppt_deck/slide_blueprint.md',
    visual_direction: 'prompts/ppt_deck/visual_direction.md',
    render_html: 'prompts/ppt_deck/render_html.md',
    author_pptx_native: 'prompts/ppt_deck/author_pptx_native.md',
    fix_html: 'prompts/ppt_deck/fix_html.md',
    repair_pptx_native: 'prompts/ppt_deck/repair_pptx_native.md',
    visual_director_review: 'prompts/ppt_deck/director_review.md',
    screenshot_review: 'prompts/ppt_deck/screenshot_review.md',
    export_pptx: 'prompts/ppt_deck/export_pptx.md',
  });
  const STAGE_REQUIREMENTS = Object.freeze({
    storyline: { requires_artifacts: [] },
    detailed_outline: { requires_artifacts: ['storyline'] },
    slide_blueprint: { requires_artifacts: ['detailed_outline'] },
    visual_direction: { requires_artifacts: ['slide_blueprint'] },
    render_html: { requires_artifacts: ['slide_blueprint', 'visual_direction'] },
    author_pptx_native: { requires_artifacts: ['slide_blueprint', 'visual_direction'] },
    fix_html: { requires_artifacts: ['render_html', 'screenshot_review'] },
    repair_pptx_native: { requires_artifacts: ['author_pptx_native', 'screenshot_review'] },
    visual_director_review: { requires_artifacts: [] },
    screenshot_review: { requires_artifacts: ['visual_director_review'] },
    export_pptx: { requires_artifacts: ['screenshot_review'], requires_review_pass: true },
  });
  const CANVAS = Object.freeze({ width: 1152, height: 648, ratio: '16:9' });
  const RENDER_HTML_BATCH_SIZE = 6;
  const TARGETED_RENDER_HTML_BATCH_SIZE = 1;
  const SCREENSHOT_REVIEW_BATCH_SIZE = 3;
  const RENDER_REFERENCE_SLIDE_WINDOW = 3;
  const BANNED_RENDER_TOKENS = ['renderSlide', 'layoutByType', 'cardsGrid', 'pageType'];
  const CODEX_EXECUTION_MODEL = Object.freeze(buildCodexExecutionModel());
  const HERMES_NATIVE_PROOF_EXECUTION_MODEL = Object.freeze(buildHermesNativeProofExecutionModel());
  const CREATIVE_MATERIALIZED_FROM = 'codex_cli_json_output';
  const MIN_REVIEW_QA_BLOCKS = 2;
  const MIN_REVIEW_PRIMARY_POINTS = 1;
  const HARD_SCREENSHOT_BLOCKING_ISSUES = new Set(['overflow_detected']);
  const PAGE_FIX_ROUTE = 'fix_html';
  const TARGETED_SCREENSHOT_MECHANICAL_ISSUES = new Set([
    'overflow_detected',
    'occlusion_detected',
    'visual_density_out_of_range',
    'edge_clearance_out_of_range',
    'block_content_overflow_detected',
    'title_typography_inconsistent',
    'page_number_consistency_failed',
  ]);
  const TARGETED_SCREENSHOT_RERUN_CHECKS = new Set([
    'ai_review_passed',
    'overflow_free',
    'occlusion_free',
    'visual_density_ok',
    'edge_clearance_ok',
    'block_content_fit_ok',
    'title_typography_ok',
    'page_number_consistency_ok',
  ]);
  const ROUTE_TO_SOURCE_TRUTH_CONSUMPTION_ROLE = Object.freeze({
    storyline: 'story_architecture',
    detailed_outline: 'story_architecture',
    slide_blueprint: 'story_architecture',
    visual_direction: 'visual_authorship',
    author_pptx_native: 'visual_authorship',
    fix_html: 'visual_authorship',
    repair_pptx_native: 'visual_authorship',
  });
  const DEFAULT_TYPOGRAPHY_PLAN = Object.freeze({
    cover_title: Object.freeze({ font_size: 56, line_height: 1.08, font_weight: 800 }),
    body_title: Object.freeze({ font_size: 44, line_height: 1.12, font_weight: 780 }),
    section_lead: Object.freeze({ font_size: 24, line_height: 1.4, font_weight: 650 }),
    card_title: Object.freeze({ font_size: 21, line_height: 1.18, font_weight: 720 }),
    card_body: Object.freeze({ font_size: 16.5, line_height: 1.45, font_weight: 600 }),
    meta_label: Object.freeze({ font_size: 12.5, line_height: 1.1, font_weight: 600 }),
    page_no: Object.freeze({ font_size: 18, line_height: 1.0, font_weight: 600 }),
  });
  const PPT_PAGE_LIBRARY = Object.freeze([
    {
      page_type: 'cover_signal',
      layout_family: 'cover_signal',
      render_recipe_id: 'ppt.hero_signal',
      use_when: '封面页与讲课契约页',
    },
    {
      page_type: 'stakes_window',
      layout_family: 'multi_zone_compare',
      render_recipe_id: 'ppt.compare_zones',
      use_when: '讲为什么值得现在讲清',
    },
    {
      page_type: 'myth_fact_split',
      layout_family: 'multi_zone_compare',
      render_recipe_id: 'ppt.compare_zones',
      use_when: '讲常见误区与纠偏',
    },
    {
      page_type: 'mechanism_track',
      layout_family: 'timeline_band',
      render_recipe_id: 'ppt.timeline_rail',
      use_when: '讲步骤链路或机制主线',
    },
    {
      page_type: 'decision_gate',
      layout_family: 'judgement_ladder',
      render_recipe_id: 'ppt.judgement_ladder',
      use_when: '讲判断边界、停顿点与下一步动作',
    },
    {
      page_type: 'public_evidence',
      layout_family: 'multi_zone_compare',
      render_recipe_id: 'ppt.compare_zones',
      use_when: '讲公开证据与来源口径',
    },
    {
      page_type: 'ring_cross',
      layout_family: 'ring_cross',
      render_recipe_id: 'ppt.ring_cross',
      use_when: '讲四象限或四步动作框架',
    },
    {
      page_type: 'closure_peak',
      layout_family: 'summary_peak',
      render_recipe_id: 'ppt.summary_peak',
      use_when: '讲结尾带走点与收束页',
    },
  ]);
  const ALLOWED_RECIPE_IDS = new Set(PPT_PAGE_LIBRARY.map((item) => item.render_recipe_id));
  
  const {
    safeText,
    safeArray,
    chunkArray,
    normalizeInlineText,
    escapeHtml,
    escapeHtmlAttribute,
    escapeTemplate,
    countMatches,
    upsertHtmlAttribute,
    hydrateRenderedSlideRootMetadata,
    validateRenderedReviewAnchors,
    buildDeckHtml,
    ensureDir,
    writeJson,
    writeText,
    readJson,
    safeFileMtimeMs,
    formatTimestamp,
    stageArtifactPath,
    readStageArtifact,
    currentHtmlStageId,
    readCurrentHtmlArtifact,
    promptMeta,
    resolvePromptPackAsset,
    readPromptPackText,
    renderSeedValue,
    promptSeed,
    promptPackJsonSection,
    promptArtifact,
    isOperatorContextMaterial,
    sharedSourceTruth,
    sharedSourceReadinessPack,
    sharedSourceMaterials,
    sharedOperatorMaterials,
    audienceFacingMaterials,
    audienceFacingTextLines,
    extractAudienceFacingSnippet,
    sharedSourceMaterialIds,
    sharedSourceLabels,
    sharedSourceSnippet,
    sharedSourceInputMode,
    sharedSourceConfidence,
    sharedSourceSufficiencyStatus,
    sharedSourceDeepResearchState,
    sharedFactLibrarySummary,
    sharedSourceAudience,
    resolveSpeakerIdentity,
  } = createPptDeckCoreHelpers({
    REPO_ROOT,
    PROMPT_PACK,
    STAGE_REQUIREMENTS,
    MIN_REVIEW_QA_BLOCKS,
    MIN_REVIEW_PRIMARY_POINTS,
    PAGE_FIX_ROUTE,
  });

  const surfaceParts = createPptDeckSurfaceParts({
    ensureDir,
    existsSync,
    formatTimestamp,
    getDeliverablePaths,
    readCurrentHtmlArtifact,
    readJson,
    safeArray,
    safeFileMtimeMs,
    safeText,
    isOperatorContextMaterial,
    sharedSourceTruth,
    stageArtifactPath,
    writeJson,
    writeText,
  });
  const {
    appendArtifactRefs,
    attachRouteReviewReset,
    createReviewCapturePaths,
    getDeliverableViewSurfacePaths,
    loadOperatorRevisionBrief,
    seedDeliverableStableViews,
    syncPptCanonicalSurface,
  } = surfaceParts;

  function extraChecks(contract) {
    const required = safeArray(contract?.review_surface?.required_checks);
    return required.filter((check) => ![
      'overflow_free',
      'occlusion_free',
      'visual_density_ok',
      'speaker_fit_ok',
      'edge_clearance_ok',
      'block_content_fit_ok',
      'title_typography_ok',
      'page_number_consistency_ok',
    ].includes(check));
  }
  
  function deriveProfileChecks(contract, blueprintArtifact, storylineArtifact) {
    const slides = safeArray(blueprintArtifact?.slide_blueprint?.slides);
    const pageTypes = slides.map((slide) => slide.page_type);
    const layoutFamilies = slides.map((slide) => safeText(slide?.visual_presentation?.layout_family));
    switch (contract.profile_id) {
      case 'lecture_student':
        return {
          term_explained_on_first_use: slides.some((slide) => ['central_axis', 'myth_fact_split', 'cover_signal'].includes(slide.page_type) && safeArray(slide.page_core_content).length >= 2),
          teaching_progression_clear: ['cover_signal', 'mechanism_track', 'decision_gate', 'closure_peak'].every((type) => pageTypes.includes(type)),
        };
      case 'lecture_peer':
        return {
          novelty_position_clear: safeText(storylineArtifact?.storyline?.narrative_arc?.journey?.[0]).length > 0,
          method_boundary_explicit: pageTypes.includes('judgement_ladder')
            || pageTypes.includes('decision_gate')
            || layoutFamilies.includes('judgement_ladder'),
        };
      case 'executive_briefing':
        return {
          decision_implication_clear: slides.some((slide) => safeText(slide.page_goal).includes('动作') || safeText(slide.page_goal).includes('决策')),
          conclusion_up_front: safeText(slides[0]?.core_sentence || slides[0]?.page_core_content?.[0]?.text || '').length > 0,
        };
      case 'defense_deck':
        return {
          claim_evidence_traceable: slides.some((slide) => safeArray(slide.evidence_and_sources).length >= 2),
          backup_qa_ready: pageTypes.includes('ring_cross') || pageTypes.includes('summary_peak'),
        };
      default:
        return {};
    }
  }
  
  function deckPreset(profileId) {
    switch (profileId) {
      case 'lecture_student':
        return {
          speaker: '教学型讲者',
          audience: '医学生与住院学员',
          promise: '让学生看懂主题的核心概念、判断顺序与课堂带走点',
          speaker_seconds: 55,
        };
      case 'lecture_peer':
        return {
          speaker: '同行讲者',
          audience: '临床科研同行',
          promise: '让同行快速对齐主题主线、证据边界与可复用判断',
          speaker_seconds: 65,
        };
      case 'executive_briefing':
        return {
          speaker: '汇报型讲者',
          audience: '医院管理层',
          promise: '让决策者先看到主题要点、判断依据与后续动作',
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
  
  function executionModelForAdapter(adapter = CODEX_DEFAULT_ADAPTER) {
    return adapter === HERMES_NATIVE_PROOF_ADAPTER
      ? HERMES_NATIVE_PROOF_EXECUTION_MODEL
      : CODEX_EXECUTION_MODEL;
  }
  
  function creativeOwner(generationRuntime = null, adapter = CODEX_DEFAULT_ADAPTER) {
    if (adapter === HERMES_NATIVE_PROOF_ADAPTER) {
      if (safeText(generationRuntime?.creative_owner)) {
        return safeText(generationRuntime.creative_owner);
      }
      if (safeText(generationRuntime?.owner)) {
        return safeText(generationRuntime.owner);
      }
      return HERMES_NATIVE_PROOF_ADAPTER;
    }
    return 'host_agent';
  }
  
  function primarySurface(generationRuntime = null, adapter = CODEX_DEFAULT_ADAPTER) {
    if (safeText(generationRuntime?.primary_surface)) {
      return safeText(generationRuntime.primary_surface);
    }
    if (safeText(generationRuntime?.adapter_surface)) {
      return safeText(generationRuntime.adapter_surface);
    }
    return adapter === HERMES_NATIVE_PROOF_ADAPTER
      ? 'hermes_native_full_agent_loop'
      : 'codex_native_host_agent';
  }
  
  async function generateStructuredArtifact({
    adapter = CODEX_DEFAULT_ADAPTER,
    ...input
  }) {
    if (adapter === HERMES_NATIVE_PROOF_ADAPTER) {
      return generateStructuredArtifactViaHermesNativeProof(input);
    }
    return generateStructuredArtifactViaCodexCli(input);
  }

  async function generateStructuredArtifactBatch({
    adapter = CODEX_DEFAULT_ADAPTER,
    stages = [],
    ...input
  }) {
    if (adapter === HERMES_NATIVE_PROOF_ADAPTER) {
      const data = [];
      for (const stage of stages) {
        const result = await generateStructuredArtifactViaHermesNativeProof(stage);
        data.push({
          stage_id: safeText(stage?.stage_id),
          data: result.data,
          generationRuntime: result.generationRuntime,
        });
      }
      return {
        data,
        batchRuntime: {
          owner: HERMES_NATIVE_PROOF_ADAPTER,
          session_pool: {
            reuse_supported: false,
            reuse_claimed: false,
            reuse_status: 'unsupported_by_adapter',
            invocation_count: data.length,
          },
        },
      };
    }
    return generateStructuredArtifactBatchViaCodexCli({ stages, ...input });
  }
  
  function runtimeCreativeSource(
    protectedSurface,
    artifactSource,
    generationRuntime = null,
    adapter = CODEX_DEFAULT_ADAPTER,
  ) {
    return {
      owner: creativeOwner(generationRuntime, adapter),
      primary_surface: primarySurface(generationRuntime, adapter),
      stage_owner: primarySurface(generationRuntime, adapter),
      ownership_model: 'director_first',
      authored_surface: protectedSurface,
      materialized_from: artifactSource,
    };
  }
  
  function creativeSourceStamp({
    route,
    lifecycleStage,
    authoredSurface,
    materializedFrom = 'prompt_pack_seed',
    generationRuntime = null,
    adapter = CODEX_DEFAULT_ADAPTER,
  }) {
    return {
      ...runtimeCreativeSource(authoredSurface, materializedFrom, generationRuntime, adapter),
      route,
      lifecycle_stage: lifecycleStage,
      authored_surface: authoredSurface,
      materialized_from: materializedFrom,
    };
  }
  
  function lifecycleStageForRoute(contract, route) {
    return contract?.lifecycle_model?.route_to_stage?.[route] || null;
  }
  
  function stageOrder(contract, stageId) {
    const stages = [
      ...safeArray(contract?.stage_sequence?.stages),
      ...safeArray(contract?.stage_sequence?.alternate_stages),
    ];
    return stages.findIndex((stage) => stage?.stage_id === stageId);
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
  
  function slideNeedsTargetedRevision(slide) {
    if (!slide || typeof slide !== 'object') return false;
    if (safeText(slide?.status) === 'block') return true;
    if (hasAiVisualBlock(slide?.ai_review)) return true;
    const mechanicalIssues = safeArray(slide?.mechanical_issues).length > 0
      ? safeArray(slide?.mechanical_issues)
      : safeArray(slide?.issues);
    if (mechanicalIssues.some((issue) => safeText(issue) === 'page_number_consistency_failed')) {
      return true;
    }
    const aiJudgement = normalizeAiVisualJudgement(slide?.ai_review?.judgement);
    const recommendedFix = safeText(slide?.ai_review?.recommended_fix).toLowerCase();
    if (
      safeText(slide?.status) === 'pass'
      && aiJudgement === 'pass'
      && (!recommendedFix || recommendedFix === 'none')
    ) {
      return false;
    }
    return mechanicalIssues.some((issue) => TARGETED_SCREENSHOT_MECHANICAL_ISSUES.has(safeText(issue)));
  }
  
  function collectSlidesNeedingTargetedRevision(slideReviews) {
    return safeArray(slideReviews)
      .filter((slide) => slideNeedsTargetedRevision(slide))
      .filter((slide) => safeText(slide?.slide_id));
  }
  
  function deriveScreenshotReviewRerunStage(contract, failedChecks, slideReviews) {
    const normalizedFailedChecks = safeArray(failedChecks).map((check) => safeText(check)).filter(Boolean);
    if (normalizedFailedChecks.length === 0) return null;
    const targetedSlides = collectSlidesNeedingTargetedRevision(slideReviews);
    const onlyPageLevelFailures = normalizedFailedChecks.every((check) => TARGETED_SCREENSHOT_RERUN_CHECKS.has(check));
    if (onlyPageLevelFailures && targetedSlides.length > 0) {
      return PAGE_FIX_ROUTE;
    }
    return rerunStageFromReviewSurface(contract, normalizedFailedChecks, 'render_html');
  }
  
  function reviewOverlayForRoute(contract, route) {
    return contract?.lifecycle_model?.review_overlay_routes?.[route] || null;
  }
  
  function creativeExecution(routeOrLifecycleStage, generationRuntime = null, adapter = CODEX_DEFAULT_ADAPTER) {
    return {
      owner: creativeOwner(generationRuntime, adapter),
      primary_surface: primarySurface(generationRuntime, adapter),
      lifecycle_stage: routeOrLifecycleStage,
      ownership_model: 'director_first',
      ...(generationRuntime
        ? {
            generation_runtime: generationRuntime,
          }
        : {}),
    };
  }
  
  function attachCommon(route, contract, generationRuntime = null, adapter = CODEX_DEFAULT_ADAPTER) {
    return {
      route,
      overlay: contract.overlay,
      profile_id: contract.profile_id,
      produced_at: new Date().toISOString(),
      prompt_pack: promptMeta(route),
      lifecycle_stage: lifecycleStageForRoute(contract, route),
      review_overlay: reviewOverlayForRoute(contract, route),
      execution_model: generationRuntime?.execution_model || executionModelForAdapter(adapter),
    };
  }
  
  function pageBudget(profileId) {
    switch (profileId) {
      case 'executive_briefing':
        return { min_slides: 6, max_slides: 8 };
      case 'defense_deck':
        return { min_slides: 8, max_slides: 12 };
      default:
        return { min_slides: 8, max_slides: 10 };
    }
  }
  
  function requireText(value, label) {
    const text = safeText(value);
    if (!text) {
      throw new Error(`Missing ${label} in upstream ppt generation output`);
    }
    return text;
  }
  
  function normalizeStringList(value, label, { min = 1, max = 6 } = {}) {
    const list = safeArray(value)
      .map((item) => safeText(item))
      .filter(Boolean)
      .slice(0, max);
    if (list.length < min) {
      throw new Error(`Missing ${label} in upstream ppt generation output`);
    }
    return list;
  }
  
  function normalizePptScreenshotAiSlideReviews(value, mechanicalSlideReviews) {
    const expectedSlideIds = new Set(mechanicalSlideReviews.map((slide) => slide.slide_id));
    const reviews = safeArray(value).map((item, index) => {
      const slideId = requireText(item?.slide_id, `screenshot_review.slide_reviews[${index}].slide_id`);
      if (!expectedSlideIds.has(slideId)) {
        throw new Error(`Unexpected screenshot_review.slide_reviews[${index}].slide_id: ${slideId}`);
      }
      const rawJudgement = safeText(item?.judgement, 'pass');
      const judgement = normalizeAiVisualJudgement(rawJudgement);
      if (!['pass', 'block'].includes(judgement)) {
        throw new Error(`Invalid screenshot_review.slide_reviews[${index}].judgement: ${rawJudgement}`);
      }
      return {
        slide_id: slideId,
        judgement,
        visual_findings: normalizeStringList(
          item?.visual_findings,
          `screenshot_review.slide_reviews[${index}].visual_findings`,
          { min: 1, max: 4 },
        ),
        recommended_fix: safeText(item?.recommended_fix, judgement === 'pass' ? 'none' : 'revise_render_html'),
      };
    });
    if (reviews.length !== mechanicalSlideReviews.length) {
      throw new Error('screenshot_review.slide_reviews 必须覆盖全部截图页');
    }
    const covered = new Set(reviews.map((item) => item.slide_id));
    for (const slideId of expectedSlideIds) {
      if (!covered.has(slideId)) {
        throw new Error(`Missing screenshot_review.slide_reviews entry for ${slideId}`);
      }
    }
    return reviews;
  }
  
  function hasAiVisualPass(aiReview) {
    return normalizeAiVisualJudgement(aiReview?.judgement) === 'pass';
  }
  
  function hasAiVisualBlock(aiReview) {
    return normalizeAiVisualJudgement(aiReview?.judgement) === 'block';
  }
  
  function normalizeAiVisualJudgement(value) {
    const raw = safeText(value, 'pass').toLowerCase();
    if (['block', 'revise', 'fail', 'failed', 'reject', 'rejected', 'needs_revision', 'needs_rewrite'].includes(raw)) {
      return 'block';
    }
    if (['pass', 'ok', 'approved', 'approve', 'weak', 'minor', 'advisory', 'warn', 'warning', 'soft_pass', 'pass_with_minor_watch', 'pass_with_warnings', 'minor_watch'].includes(raw)) {
      return 'pass';
    }
    return raw;
  }
  
  function buildAiFirstVisualSlideReview(slide, aiReview) {
    const mechanicalIssues = safeArray(slide?.issues);
    const hardMechanicalIssues = mechanicalIssues.filter((issue) => HARD_SCREENSHOT_BLOCKING_ISSUES.has(issue));
    const aiIssues = hasAiVisualBlock(aiReview) ? ['ai_visual_risk'] : [];
    return {
      ...slide,
      status: hardMechanicalIssues.length === 0 && aiIssues.length === 0 ? 'pass' : 'block',
      issues: [...hardMechanicalIssues, ...aiIssues],
      mechanical_issues: mechanicalIssues,
      ai_review: aiReview || null,
    };
  }
  
  function aiFirstMechanicalCheckValue(slideReviews, checkKey) {
    return safeArray(slideReviews).every((slide) => Boolean(slide?.checks?.[checkKey]));
  }
  
  function validateRenderedSlideContent(content, slideId) {
    const html = requireText(content, `render_html.slides[${slideId}].content_html`);
    if (!/data-slide-root=(["'])true\1/.test(html)) {
      throw new Error(`ppt render_html slide missing data-slide-root=true: ${slideId}`);
    }
    if (!new RegExp(`data-slide-id=(["'])${slideId}\\1`).test(html)) {
      throw new Error(`ppt render_html slide missing matching data-slide-id: ${slideId}`);
    }
    if (/<script\b/i.test(html)) {
      throw new Error(`ppt render_html slide contains forbidden script tag: ${slideId}`);
    }
    if (/<style\b/i.test(html)) {
      throw new Error(`ppt render_html slide contains forbidden style tag: ${slideId}`);
    }
    return html;
  }
  
  function pptRuntimeFamilyPartsBoundary() {}
  
  const authoringParts = createPptDeckAuthoringParts({
    ALLOWED_RECIPE_IDS,
    CREATIVE_MATERIALIZED_FROM,
    DEFAULT_TYPOGRAPHY_PLAN,
    PROMPT_PACK,
    PPT_PAGE_LIBRARY,
    attachCommon,
    audienceFacingMaterials,
    creativeExecution,
    deckPreset,
    extractAudienceFacingSnippet,
    generateStructuredArtifact,
    lifecycleStageForRoute,
    normalizeStringList,
    pageBudget,
    requireText,
    resolveSpeakerIdentity,
    runtimeCreativeSource,
    safeArray,
    safeText,
    sharedFactLibrarySummary,
    sharedOperatorMaterials,
    sharedSourceAudience,
    sharedSourceConfidence,
    sharedSourceDeepResearchState,
    sharedSourceInputMode,
    sharedSourceLabels,
    sharedSourceMaterialIds,
    sharedSourceSufficiencyStatus,
  });
  const stageParts = createPptDeckStageParts({
    CANVAS,
    CODEX_DEFAULT_ADAPTER,
    CREATIVE_MATERIALIZED_FROM,
    PAGE_FIX_ROUTE,
    PROMPT_PACK,
    NATIVE_PPT_ENGINE_CONTRACT,
    PYTHON_EXPORT,
    PYTHON_NATIVE,
    PYTHON_REVIEW,
    RENDER_HTML_BATCH_SIZE,
    RENDER_REFERENCE_SLIDE_WINDOW,
    SCREENSHOT_REVIEW_BATCH_SIZE,
    STAGE_REQUIREMENTS,
    TARGETED_RENDER_HTML_BATCH_SIZE,
    aiFirstMechanicalCheckValue,
    attachCommon,
    buildAiFirstVisualSlideReview,
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
    ensureDir,
    existsSync,
    extraChecks,
    generateStructuredArtifact,
    generateStructuredArtifactBatch,
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
    primarySurface,
    readCurrentHtmlArtifact,
    readJson,
    readPromptPackText,
    readStageArtifact,
    requireText,
    resolvePromptPackAsset,
    resolveRedCubePythonCommand,
    safeArray,
    safeFileMtimeMs,
    safeText,
    seedDeliverableStableViews,
    stageArtifactPath,
    summarizeRelativeQuality,
    validateRenderedReviewAnchors,
    validateRenderedSlideContent,
    writeJson,
    writeText,
    ...authoringParts,
  });

  return {
    CODEX_DEFAULT_ADAPTER,
    CANVAS,
    BANNED_RENDER_TOKENS,
    CREATIVE_MATERIALIZED_FROM,
    PAGE_FIX_ROUTE,
    ROUTE_TO_SOURCE_TRUTH_CONSUMPTION_ROLE,
    appendArtifactRefs,
    attachCommon,
    attachRouteReviewReset,
    buildSourceTruthConsumptionSummary,
    getDeliverablePaths,
    lifecycleStageForRoute,
    readCurrentHtmlArtifact,
    readStageArtifact,
    safeArray,
    sharedSourceConfidence,
    sharedSourceLabels,
    syncPptCanonicalSurface,
    authoringParts,
    stageParts,
  };
}
