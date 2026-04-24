import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

import { generateStructuredArtifactViaCodexCli } from '@redcube/codex-cli-client';
import {
  buildSourceTruthConsumptionSummary,
  getDeliverablePaths,
  resolveRedCubePythonCommand,
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
import { createPosterOnepagerAuthoringParts } from './authoring.js';

/**
 * @typedef {import('./types.js').PosterRuntimeRunRequest} PosterRuntimeRunRequest
 * @typedef {import('./types.js').PosterRuntimeRouteResult} PosterRuntimeRouteResult
 */

export function createPosterOnepagerRuntimeCore() {
  const MODULE_DIR = path.dirname(fileURLToPath(import.meta.url));
  const REPO_ROOT = path.resolve(MODULE_DIR, '../../../..');
  const PYTHON_REVIEW = path.join(MODULE_DIR, '../../../redcube-runtime/scripts/ppt_deck_review.py');
  const CANVAS = Object.freeze({ ratio: '4:5', width: 1080, height: 1350 });
  const BANNED_RENDER_TOKENS = Object.freeze(['renderSlide', 'layoutByType', 'cardsGrid', 'pageType']);
  const CODEX_EXECUTION_MODEL = Object.freeze(buildCodexExecutionModel());
  const HERMES_NATIVE_PROOF_EXECUTION_MODEL = Object.freeze(buildHermesNativeProofExecutionModel());
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
  
  function safeText(value, fallback = '') {
    const text = String(value || '').trim();
    return text || fallback;
  }
  
  function safeArray(value) {
    return Array.isArray(value) ? value : [];
  }
  
  function ensureDir(dir) {
    mkdirSync(dir, { recursive: true });
    return dir;
  }
  
  function copySurfaceFile(source, destination) {
    const sourceFile = safeText(source);
    const destinationFile = safeText(destination);
    if (!sourceFile || !destinationFile || !existsSync(sourceFile)) return null;
    ensureDir(path.dirname(destinationFile));
    writeFileSync(destinationFile, readFileSync(sourceFile));
    return destinationFile;
  }
  
  function getDeliverableViewSurfacePaths(deliverablePaths, deliverableId) {
    return {
      stableHtmlFile: path.join(deliverablePaths.viewsDir, `${deliverableId}.html`),
      stableSlidesFile: path.join(deliverablePaths.viewsDir, `${deliverableId}.slides.json`),
      draftHtmlFile: path.join(deliverablePaths.viewsDir, `${deliverableId}.draft.html`),
      draftSlidesFile: path.join(deliverablePaths.viewsDir, `${deliverableId}.draft.slides.json`),
    };
  }
  
  function seedStableViewIfMissing(paths, htmlFile, slidesFile) {
    const refs = [];
    if (!existsSync(paths.stableHtmlFile)) {
      const stableHtmlRef = copySurfaceFile(htmlFile, paths.stableHtmlFile);
      if (stableHtmlRef) refs.push(stableHtmlRef);
    }
    if (!existsSync(paths.stableSlidesFile)) {
      const stableSlidesRef = copySurfaceFile(slidesFile, paths.stableSlidesFile);
      if (stableSlidesRef) refs.push(stableSlidesRef);
    }
    return refs;
  }
  
  function promoteStableView(paths, htmlFile, slidesFile) {
    const refs = [];
    const stableHtmlRef = copySurfaceFile(htmlFile, paths.stableHtmlFile);
    if (stableHtmlRef) refs.push(stableHtmlRef);
    const stableSlidesRef = copySurfaceFile(slidesFile, paths.stableSlidesFile);
    if (stableSlidesRef) refs.push(stableSlidesRef);
    return refs;
  }
  
  function writeJson(file, value) {
    ensureDir(path.dirname(file));
    writeFileSync(file, JSON.stringify(value, null, 2), 'utf-8');
  }
  
  function writeText(file, value) {
    ensureDir(path.dirname(file));
    writeFileSync(file, value, 'utf-8');
  }
  
  function readJson(file) {
    return JSON.parse(readFileSync(file, 'utf-8'));
  }
  
  function stageArtifactPath(contract, deliverablePaths, stageId) {
    const stage = safeArray(contract?.stage_sequence?.stages).find((item) => item?.stage_id === stageId);
    return path.join(
      deliverablePaths.artifactsDir,
      safeText(stage?.output_artifact, `${stageId}.json`),
    );
  }
  
  function readStageArtifact(contract, deliverablePaths, stageId) {
    const file = stageArtifactPath(contract, deliverablePaths, stageId);
    return existsSync(file) ? readJson(file) : null;
  }
  
  function promptPackRoot(contract) {
    const root = safeText(contract?.prompt_pack?.root);
    if (!root) {
      throw new Error('poster_onepager hydrated contract 缺少 prompt_pack.root');
    }
    return root;
  }
  
  function promptRoute(contract, route) {
    const relativePath = safeText(contract?.prompt_pack?.routes?.[route]);
    if (!relativePath) {
      throw new Error(`poster_onepager hydrated contract 缺少 prompt_pack.routes.${route}`);
    }
    return relativePath;
  }
  
  function resolvePromptPackAsset(contract, relativePath) {
    const assetPath = safeText(relativePath);
    if (!assetPath) return '';
    if (path.isAbsolute(assetPath)) return assetPath;
    if (assetPath.startsWith('prompts/')) return assetPath;
    if (assetPath.startsWith(`${promptPackRoot(contract)}/`)) return assetPath;
    return path.posix.join(promptPackRoot(contract), assetPath);
  }
  
  function promptMeta(contract, route) {
    const relativePath = promptRoute(contract, route);
    const absolutePath = path.join(REPO_ROOT, relativePath);
    return {
      root: promptPackRoot(contract),
      file: path.basename(relativePath),
      relative_path: relativePath,
      source: existsSync(absolutePath) ? 'repo' : 'embedded',
    };
  }
  
  function readPromptPackText(relativePath) {
    const absolutePath = path.isAbsolute(relativePath)
      ? relativePath
      : path.join(REPO_ROOT, relativePath);
    if (!existsSync(absolutePath)) {
      throw new Error(`Missing prompt pack asset: ${relativePath}`);
    }
    return readFileSync(absolutePath, 'utf-8');
  }
  
  function renderSeedValue(value, vars) {
    if (Array.isArray(value)) return value.map((item) => renderSeedValue(item, vars));
    if (value && typeof value === 'object') {
      return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, renderSeedValue(item, vars)]));
    }
    if (typeof value === 'string') {
      return value.replace(/\{\{([a-zA-Z0-9_]+)\}\}/g, (_match, key) => safeText(vars[key]));
    }
    return value;
  }
  
  function promptPackJsonSection(contract, route, section, vars = {}) {
    const absolutePath = path.join(REPO_ROOT, promptRoute(contract, route));
    if (!existsSync(absolutePath)) return null;
    const raw = readFileSync(absolutePath, 'utf-8');
    const match = raw.match(new RegExp(`## ${section}\\s*\\\`\\\`\\\`json\\s*([\\s\\S]*?)\\s*\\\`\\\`\\\``));
    if (!match) return null;
    return renderSeedValue(JSON.parse(match[1]), vars);
  }
  
  function promptArtifact(contract, route, vars = {}) {
    return promptPackJsonSection(contract, route, 'runtime_artifact', vars);
  }
  
  function promptSeed(contract, route, vars = {}) {
    return promptPackJsonSection(contract, route, 'runtime_seed', vars);
  }
  
  function isOperatorContextMaterial(material) {
    const kind = safeText(material?.kind);
    return safeText(material?.source_role) === 'operator_context'
      || kind === 'brief'
      || kind === 'keywords';
  }
  
  function sourceTruth(contract) {
    return contract?.shared_source_truth || null;
  }
  
  function sourceMaterials(contract) {
    return safeArray(sourceTruth(contract)?.extracted_materials?.materials)
      .filter((material) => !isOperatorContextMaterial(material));
  }
  
  function operatorMaterials(contract) {
    return safeArray(sourceTruth(contract)?.extracted_materials?.materials)
      .filter((material) => isOperatorContextMaterial(material));
  }
  
  function sourceMaterialIds(contract) {
    return sourceMaterials(contract).map((material) => material.material_id).filter(Boolean);
  }
  
  function publicSources() {
    return [
      '公开临床指南 / 系统综述 / 正式流程资料',
      '同行评议论文 / 真实世界研究',
      '用户当次指定素材',
    ];
  }
  
  function sourceLabels(contract) {
    const labels = safeArray(sourceTruth(contract)?.source_index?.sources)
      .filter((source) => source.status === 'ready' && !isOperatorContextMaterial(source))
      .map((source) => source.relative_path || source.kind);
    return labels.length > 0 ? labels : publicSources();
  }
  
  function lifecycleStageForRoute(contract, route) {
    return contract?.lifecycle_model?.route_to_stage?.[route] || null;
  }
  
  function reviewOverlayForRoute(contract, route) {
    return contract?.lifecycle_model?.review_overlay_routes?.[route] || null;
  }
  
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
  
  function executionModelForAdapter(adapter = CODEX_DEFAULT_ADAPTER) {
    return adapter === HERMES_NATIVE_PROOF_ADAPTER
      ? HERMES_NATIVE_PROOF_EXECUTION_MODEL
      : CODEX_EXECUTION_MODEL;
  }
  
  function creativeOwner(generationRuntime = null, adapter = CODEX_DEFAULT_ADAPTER) {
    if (safeText(generationRuntime?.creative_owner)) {
      return safeText(generationRuntime.creative_owner);
    }
    return adapter === HERMES_NATIVE_PROOF_ADAPTER ? HERMES_NATIVE_PROOF_ADAPTER : 'host_agent';
  }
  
  function primarySurface(generationRuntime = null, adapter = CODEX_DEFAULT_ADAPTER) {
    if (safeText(generationRuntime?.primary_surface)) {
      return safeText(generationRuntime.primary_surface);
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
  
  function creativeExecution(
    lifecycleStage,
    generationRuntime = null,
    adapter = CODEX_DEFAULT_ADAPTER,
  ) {
    return {
      owner: creativeOwner(generationRuntime, adapter),
      primary_surface: primarySurface(generationRuntime, adapter),
      lifecycle_stage: lifecycleStage,
      ownership_model: 'director_first',
      ...(generationRuntime
        ? {
            generation_runtime: generationRuntime,
          }
        : {}),
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
      owner: creativeOwner(generationRuntime, adapter),
      primary_surface: primarySurface(generationRuntime, adapter),
      stage_owner: primarySurface(generationRuntime, adapter),
      route,
      lifecycle_stage: lifecycleStage,
      authored_surface: authoredSurface,
      materialized_from: materializedFrom,
    };
  }
  
  function reviewAuthorship(overlay, generationRuntime = null, adapter = CODEX_DEFAULT_ADAPTER) {
    return {
      overlay,
      primary_surface: primarySurface(generationRuntime, adapter),
      contract_asset: 'prompt_pack_seed',
    };
  }
  
  function attachCommon(route, contract, generationRuntime = null, adapter = CODEX_DEFAULT_ADAPTER) {
    return {
      route,
      overlay: contract.overlay,
      profile_id: contract.profile_id,
      produced_at: new Date().toISOString(),
      prompt_pack: promptMeta(contract, route),
      lifecycle_stage: lifecycleStageForRoute(contract, route),
      review_overlay: reviewOverlayForRoute(contract, route),
      execution_model: generationRuntime?.execution_model || executionModelForAdapter(adapter),
    };
  }
  
  function requireText(value, label) {
    const text = safeText(value);
    if (!text) {
      throw new Error(`Missing ${label} in upstream poster generation output`);
    }
    return text;
  }
  
  function normalizeStringList(value, label, { min = 1, max = 6 } = {}) {
    const list = safeArray(value)
      .map((item) => safeText(item))
      .filter(Boolean)
      .slice(0, max);
    if (list.length < min) {
      throw new Error(`Missing ${label} in upstream poster generation output`);
    }
    return list;
  }
  
  function normalizePosterScreenshotAiSlideReviews(value, mechanicalSlideReviews) {
    const expectedSlideIds = new Set(mechanicalSlideReviews.map((slide) => slide.slide_id));
    const reviews = safeArray(value).map((item, index) => {
      const slideId = requireText(item?.slide_id, `screenshot_review.slide_reviews[${index}].slide_id`);
      if (!expectedSlideIds.has(slideId)) {
        throw new Error(`Unexpected poster screenshot_review.slide_reviews[${index}].slide_id: ${slideId}`);
      }
      const rawJudgement = safeText(item?.judgement, 'pass');
      const judgement = normalizeAiVisualJudgement(rawJudgement);
      if (!['pass', 'block'].includes(judgement)) {
        throw new Error(`Invalid poster screenshot_review.slide_reviews[${index}].judgement: ${rawJudgement}`);
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
      throw new Error('poster screenshot_review.slide_reviews 必须覆盖全部截图页');
    }
    const covered = new Set(reviews.map((item) => item.slide_id));
    for (const slideId of expectedSlideIds) {
      if (!covered.has(slideId)) {
        throw new Error(`Missing poster screenshot_review.slide_reviews entry for ${slideId}`);
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
    if (['pass', 'ok', 'approved', 'approve', 'weak', 'minor', 'advisory', 'warn', 'warning', 'soft_pass'].includes(raw)) {
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
  
  function slideNeedsTargetedRevision(slide) {
    if (!slide || typeof slide !== 'object') return false;
    if (safeText(slide?.status) === 'block') return true;
    if (hasAiVisualBlock(slide?.ai_review)) return true;
    const mechanicalIssues = safeArray(slide?.mechanical_issues).length > 0
      ? safeArray(slide?.mechanical_issues)
      : safeArray(slide?.issues);
    return mechanicalIssues.some((issue) => TARGETED_SCREENSHOT_MECHANICAL_ISSUES.has(safeText(issue)));
  }
  
  function requireObjectArray(value, label, { min = 1, max = 6 } = {}) {
    const list = safeArray(value)
      .filter((item) => item && typeof item === 'object')
      .slice(0, max);
    if (list.length < min) {
      throw new Error(`Missing ${label} in upstream poster generation output`);
    }
    return list;
  }
  
  function audienceFacingLines(value) {
    return String(value || '')
      .replace(/!\[[^\]]*\]\([^)]+\)/g, ' ')
      .replace(/<img[^>]*>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/`+/g, ' ')
      .split(/\r?\n/)
      .map((line) => line.replace(/\s+/g, ' ').trim())
      .filter(Boolean);
  }
  
  function extractAudienceFacingSnippet(value, maxLength = 220) {
    const lines = audienceFacingLines(value);
    const informative = lines.find((line) => line.length >= 16) || lines[0] || '';
    return informative.slice(0, maxLength);
  }
  
  function sourceTopicSummary(contract) {
    return extractAudienceFacingSnippet(sourceMaterials(contract)[0]?.content_text || sourceMaterials(contract)[0]?.excerpt, 220)
      || extractAudienceFacingSnippet(sourceTruth(contract)?.source_brief?.brief_text, 220)
      || safeText(contract.title);
  }
  
  
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
      const peakRegion = safeText(visualArtifact?.visual_direction?.peak_region, 'hero_band');
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
      peak_region: safeText(visualArtifact?.visual_direction?.peak_region, 'hero_band'),
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
          peak_region: safeText(visualArtifact?.visual_direction?.peak_region, 'hero_band'),
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
  

  function normalizeInlineText(value, maxLength = 220) {
    return String(value || '').replace(/\s+/g, ' ').trim().slice(0, maxLength);
  }
  
  function runPython(script, args) {
    if (!existsSync(script)) throw new Error(`Missing python helper: ${script}`);
    const pythonCommand = resolveRedCubePythonCommand();
    const result = spawnSync(pythonCommand.command, [script, ...args], { encoding: 'utf-8', maxBuffer: 16 * 1024 * 1024 });
    if (result.status !== 0) {
      throw new Error((result.stderr || result.stdout || `python helper failed: ${script}`).trim());
    }
    return JSON.parse(result.stdout);
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
  
  function buildScreenshotReviewMarkdown(contract, reviewArtifact, reviewOwner) {
    const lines = [
      `# ${contract.title} 视觉质控`,
      '',
      `- review_owner: ${safeText(reviewOwner, 'codex_native_host_agent')}`,
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
      buildScreenshotReviewMarkdown(contract, artifact, primarySurface(generationRuntime, adapter)),
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
