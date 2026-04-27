// @ts-nocheck
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
  HERMES_AGENT_EXECUTOR_BACKEND,
  HERMES_DEFAULT_ADAPTER,
  HERMES_NATIVE_PROOF_ADAPTER,
  buildCodexExecutionModel,
  buildHermesExecutionModel,
  buildHermesNativeProofExecutionModel,
  generateStructuredArtifactViaHermesAgentApi,
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
import {
  ALLOWED_RECIPE_IDS,
  BANNED_RENDER_TOKENS,
  CANVAS,
  CREATIVE_MATERIALIZED_FROM,
  DEFAULT_TYPOGRAPHY_PLAN,
  HARD_SCREENSHOT_BLOCKING_ISSUES,
  MIN_REVIEW_PRIMARY_POINTS,
  MIN_REVIEW_QA_BLOCKS,
  PAGE_FIX_ROUTE,
  PPT_PAGE_LIBRARY,
  PROMPT_PACK,
  RENDER_HTML_BATCH_SIZE,
  RENDER_REFERENCE_SLIDE_WINDOW,
  ROUTE_TO_SOURCE_TRUTH_CONSUMPTION_ROLE,
  SCREENSHOT_MECHANICAL_REVIEW_RULESET_ID,
  SCREENSHOT_REVIEW_BATCH_SIZE,
  STAGE_REQUIREMENTS,
  TARGETED_RENDER_HTML_BATCH_SIZE,
  TARGETED_SCREENSHOT_MECHANICAL_ISSUES,
  TARGETED_SCREENSHOT_RERUN_CHECKS,
} from './core-constants.js';

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
  const CODEX_EXECUTION_MODEL = Object.freeze(buildCodexExecutionModel());
  const HERMES_AGENT_EXECUTION_MODEL = Object.freeze(buildHermesExecutionModel());
  const HERMES_NATIVE_PROOF_EXECUTION_MODEL = Object.freeze(buildHermesNativeProofExecutionModel());

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
  
  function isHermesAgentAdapter(adapter = CODEX_DEFAULT_ADAPTER) {
    const requested = safeText(adapter);
    return requested === HERMES_DEFAULT_ADAPTER || requested === HERMES_AGENT_EXECUTOR_BACKEND;
  }

  function executionModelForAdapter(adapter = CODEX_DEFAULT_ADAPTER) {
    if (adapter === HERMES_NATIVE_PROOF_ADAPTER) return HERMES_NATIVE_PROOF_EXECUTION_MODEL;
    if (isHermesAgentAdapter(adapter)) return HERMES_AGENT_EXECUTION_MODEL;
    return CODEX_EXECUTION_MODEL;
  }
  
  function creativeOwner(generationRuntime = null, adapter = CODEX_DEFAULT_ADAPTER) {
    if (isHermesAgentAdapter(adapter)) {
      if (safeText(generationRuntime?.creative_owner)) {
        return safeText(generationRuntime.creative_owner);
      }
      if (safeText(generationRuntime?.owner)) {
        return safeText(generationRuntime.owner);
      }
      return HERMES_AGENT_EXECUTOR_BACKEND;
    }
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
    if (isHermesAgentAdapter(adapter)) {
      return 'hermes_agent_api_server';
    }
    return adapter === HERMES_NATIVE_PROOF_ADAPTER
      ? 'hermes_native_full_agent_loop'
      : 'codex_native_host_agent';
  }
  
  async function generateStructuredArtifact({
    adapter = CODEX_DEFAULT_ADAPTER,
    ...input
  }) {
    if (isHermesAgentAdapter(adapter)) {
      return generateStructuredArtifactViaHermesAgentApi(input);
    }
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
    if (isHermesAgentAdapter(adapter)) {
      const data = [];
      for (const stage of stages) {
        const result = await generateStructuredArtifactViaHermesAgentApi(stage);
        data.push({
          stage_id: safeText(stage?.stage_id),
          data: result.data,
          generationRuntime: result.generationRuntime,
        });
      }
      return {
        data,
        batchRuntime: {
          owner: HERMES_AGENT_EXECUTOR_BACKEND,
          session_pool: {
            reuse_supported: false,
            reuse_claimed: false,
            reuse_status: 'unsupported_by_adapter',
            invocation_count: data.length,
          },
        },
      };
    }
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
  
  function pageBudget(profileId, contract = null) {
    void profileId;
    const directTextFields = [
      safeText(contract?.title),
      safeText(contract?.goal),
      safeText(contract?.user_intent),
      safeText(contract?.userIntent),
      safeText(contract?.delivery_request?.goal),
      safeText(contract?.delivery_request?.user_intent),
      safeText(contract?.delivery_request?.userIntent),
      safeText(contract?.operator_playbook?.brief_text),
      safeText(contract?.operator_playbook?.user_intent),
    ];
    const sourceTextFields = [
      safeText(contract?.shared_source_truth?.source_brief?.brief_text),
      safeText(contract?.source_truth?.source_brief?.brief_text),
      ...safeArray(contract?.shared_source_truth?.extracted_materials?.materials)
        .flatMap((material) => [
          safeText(material?.title),
          safeText(material?.content_text),
          safeText(material?.content_markdown),
          safeText(material?.excerpt),
        ]),
      ...safeArray(contract?.source_truth?.extracted_materials?.materials)
        .flatMap((material) => [
          safeText(material?.title),
          safeText(material?.content_text),
          safeText(material?.content_markdown),
          safeText(material?.excerpt),
        ]),
      ...safeArray(contract?.materials)
        .flatMap((material) => [
          safeText(material?.title),
          safeText(material?.content_text),
          safeText(material?.content_markdown),
          safeText(material?.excerpt),
        ]),
    ];
    const directCorpus = directTextFields.filter(Boolean).join('\n');
    const sourceCorpus = sourceTextFields.filter(Boolean).join('\n');
    const corpus = [directCorpus, sourceCorpus].filter(Boolean).join('\n');
    const numberValue = (value) => {
      const number = Number(value);
      return Number.isFinite(number) && number > 0 ? Math.floor(number) : null;
    };
    const chineseNumberValue = (value) => {
      const raw = safeText(value);
      if (/^\d+$/.test(raw)) return numberValue(raw);
      const digits = {
        一: 1,
        二: 2,
        两: 2,
        三: 3,
        四: 4,
        五: 5,
        六: 6,
        七: 7,
        八: 8,
        九: 9,
        十: 10,
      };
      if (raw === '十') return 10;
      if (/^十[一二两三四五六七八九]$/.test(raw)) return 10 + digits[raw[1]];
      if (/^[一二两三四五六七八九]十$/.test(raw)) return digits[raw[0]] * 10;
      if (/^[一二两三四五六七八九]十[一二两三四五六七八九]$/.test(raw)) {
        return digits[raw[0]] * 10 + digits[raw[2]];
      }
      return digits[raw] || null;
    };

    const hardConstraints = {};
    const planningSignals = [];
    const addSignal = (signal) => {
      const key = JSON.stringify(signal);
      if (planningSignals.some((item) => JSON.stringify(item) === key)) return;
      planningSignals.push(signal);
    };
    const firstHardUpperBound = [...directCorpus.matchAll(/(?:不超过|最多|上限|不多于|至多|<=|≤)\s*(\d{1,3})\s*(?:页|张|slides?)/gi)]
      .map((match) => numberValue(match[1]))
      .find((value) => value !== null);
    if (firstHardUpperBound !== undefined) {
      hardConstraints.max_slides = firstHardUpperBound;
    }
    const firstHardLowerBound = [...directCorpus.matchAll(/(?:不少于|至少|下限|不低于|>=|≥)\s*(\d{1,3})\s*(?:页|张|slides?)/gi)]
      .filter((match) => !/(?:每(?:一)?(?:篇|个|项|部分|研究)|per\s+(?:paper|item|section))\s*$/i.test(directCorpus.slice(Math.max(0, match.index - 12), match.index)))
      .map((match) => numberValue(match[1]))
      .find((value) => value !== null);
    if (firstHardLowerBound !== undefined) {
      hardConstraints.min_slides = firstHardLowerBound;
    }
    const firstHardExact = [
      ...directCorpus.matchAll(/(?:必须|固定|正好|恰好|严格|总页数)\s*(?:做成|生成|制作|控制为|为|=)?\s*(\d{1,3})\s*(?:页|张|slides?)(?!\s*(?:以内|以下|内))/gi),
      ...directCorpus.matchAll(/(?:做成|生成|制作)\s*(\d{1,3})\s*(?:页|张|slides?)\s*(?:整|固定|版本)?/gi),
    ]
      .filter((match) => !/(?:不超过|最多|上限|不多于|至多|<=|≤|建议|推荐)\s*$/i.test(directCorpus.slice(Math.max(0, match.index - 10), match.index)))
      .map((match) => numberValue(match[1]))
      .find((value) => value !== null);
    if (firstHardExact !== undefined) {
      hardConstraints.exact_slides = firstHardExact;
    }

    for (const match of corpus.matchAll(/(?:建议|推荐|目标|期望|控制在|页数|幻灯片|deck|slides?)?[^\d\n]{0,10}(\d{1,3})\s*(?:[-–—~至到])\s*(\d{1,3})\s*(?:页|张|slides?)/gi)) {
      let min = numberValue(match[1]);
      let max = numberValue(match[2]);
      if (min === null || max === null) continue;
      if (min > max) [min, max] = [max, min];
      addSignal({
        kind: 'suggested_range',
        min_slides: min,
        max_slides: max,
        binding: 'suggestion_only',
      });
    }
    const countExplicitSlidePlanItems = () => {
      const countConsecutive = (numbers) => {
        const uniqueNumbers = [...new Set(numbers.filter((value) => value !== null))].sort((a, b) => a - b);
        const groups = [];
        let current = [];
        for (const itemNo of uniqueNumbers) {
          const previous = current[current.length - 1];
          if (current.length === 0 || itemNo === previous + 1) {
            current.push(itemNo);
          } else {
            groups.push(current);
            current = [itemNo];
          }
        }
        if (current.length > 0) groups.push(current);
        return groups
          .filter((group) => group.length >= 6 && (group[0] === 1 || group.length >= 10))
          .map((group) => group.length)
          .sort((a, b) => b - a)[0] || 0;
      };
      const slideHeadingCount = countConsecutive(
        [...corpus.matchAll(/^\s*#{1,6}\s*Slide\s+(\d{1,3})\s*[：:.-]?/gim)]
          .map((match) => numberValue(match[1])),
      );
      const lines = corpus.split(/\r?\n/);
      const groups = [];
      let current = [];
      let inSlidePlanBlock = false;
      const flush = () => {
        if (current.length > 0) {
          groups.push(current);
          current = [];
        }
      };
      for (const line of lines) {
        const match = line.match(/^\s*(\d{1,3})[.、)、)]\s*(\S[\s\S]*)$/);
        const isSlidePlanHeading = !match && /(?:推荐|建议|批准|approved).*(?:逐页|每页|页内容|页结构|页计划|幻灯片|slides?|PPT)|(?:逐页|每页).*(?:内容|结构|计划)|slide\s*plan/i.test(line);
        if (isSlidePlanHeading) {
          flush();
          inSlidePlanBlock = true;
          continue;
        }
        if (/^\s{0,3}#{1,4}\s+\S/.test(line) && !isSlidePlanHeading) {
          flush();
          inSlidePlanBlock = false;
          continue;
        }
        const itemNo = match ? numberValue(match[1]) : null;
        const itemText = match ? safeText(match[2]) : '';
        const slideLike = inSlidePlanBlock
          || /页|封面|结束|总览|目录|论文|篇|研究|结果|边界|问题|模型|评分|队列|方法|证据|风险|负担|Knosp|slide|PPT|汇报|总结|引言|结论|临床|终点/i.test(itemText);
        if (itemNo === null || !slideLike) {
          flush();
          continue;
        }
        const previous = current[current.length - 1];
        if (current.length === 0 || itemNo === previous.itemNo + 1) {
          current.push({ itemNo, itemText });
        } else {
          flush();
          current.push({ itemNo, itemText });
        }
      }
      flush();
      const numberedListCount = groups
        .filter((group) => group.length >= 6 && (group[0].itemNo === 1 || group.length >= 10))
        .map((group) => group.length)
        .sort((a, b) => b - a)[0] || 0;
      return Math.max(slideHeadingCount, numberedListCount);
    };
    const slidePlanCount = countExplicitSlidePlanItems();
    if (slidePlanCount > 0) {
      addSignal({
        kind: 'source_slide_plan_suggestion',
        total_slides: slidePlanCount,
        binding: 'suggestion_only',
      });
    }
    const countNamedItems = () => {
      const ordinals = new Set(
        [...corpus.matchAll(/第\s*([一二两三四五六七八九十\d]{1,3})\s*篇/g)]
          .map((match) => chineseNumberValue(match[1]))
          .filter((value) => value !== null),
      );
      const paperNumbers = new Set(
        [...corpus.matchAll(/\bPaper\s*0?(\d{1,2})\b/gi)]
          .map((match) => numberValue(match[1]))
          .filter((value) => value !== null),
      );
      const explicitCount = [...corpus.matchAll(/([一二两三四五六七八九十\d]{1,3})\s*篇(?:成文)?(?:论文|研究|文章)?/g)]
        .map((match) => chineseNumberValue(match[1]))
        .filter((value) => value !== null)
        .sort((a, b) => b - a)[0] || 0;
      return Math.max(ordinals.size, paperNumbers.size, explicitCount);
    };
    const perItemMinimum = [...corpus.matchAll(/(?:每(?:一)?(?:篇|个|项|部分|研究)|至少\s*每(?:一)?(?:篇|个|项|部分|研究))\s*(?:至少|不少于|最低)?\s*(\d{1,2})\s*页/g)]
      .map((match) => numberValue(match[1]))
      .filter((value) => value !== null)
      .sort((a, b) => b - a)[0] || 0;
    const namedItemCount = countNamedItems();
    if (perItemMinimum > 0 && namedItemCount > 0) {
      addSignal({
        kind: 'per_item_coverage_guidance',
        named_item_count: namedItemCount,
        per_item_minimum_slides: perItemMinimum,
        binding: 'suggestion_only',
      });
    }
    return {
      contract_id: 'ppt_deck_ai_first_page_constraints_v1',
      policy: 'Program only carries explicit hard page constraints. Suggested ranges, source slide plans, and per-item coverage hints are context for the AI authoring stage, not validator-owned slide budgets. The full source text is provided so AI decides page count and structure directly.',
      hard_constraints: hardConstraints,
      planning_signals: planningSignals,
    };
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
    const visibleText = html
      .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    const leakedMarker = [
      /\bspeaker_notes\b/i,
      /\btransition_sentence\b/i,
      /\bpage_goal\b/i,
      /\bpage_objective\b/i,
      /\bvisual_anchor_tracks\b/i,
      /\bsource_id\b/i,
      /\bmaterial_id\b/i,
      /\bPaper\s*00[1-4]\b/i,
      /\b00[1-4]\b/,
      /\bSRC-(?:FILE|OP|BRIEF|KEYWORDS|AUG)?-?\d*\b/i,
      /\bMAT-\d+\b/i,
      /建议怎么讲|建议表达|来源口径|可发表表达|发表表达边界|待确认的写作口径|写作口径/,
      /讲稿\s*备忘录|讲者备注|演讲备注|讲稿备注|提醒讲者|怎么讲这一页/,
      /讲稿备忘录/,
      /内部管理编号/,
      /制作目标\s*[：:]/,
    ].find((pattern) => pattern.test(visibleText));
    if (leakedMarker) {
      throw new Error(`ppt render_html slide contains audience-visible authoring metadata: ${slideId}`);
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
    audienceFacingTextLines,
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
    SCREENSHOT_MECHANICAL_REVIEW_RULESET_ID,
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
