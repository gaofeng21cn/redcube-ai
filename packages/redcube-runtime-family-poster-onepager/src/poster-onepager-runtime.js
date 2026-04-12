import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

import {
  buildSourceTruthConsumptionSummary,
  getDeliverablePaths,
  resolveRedCubePythonCommand,
} from '@redcube/runtime-protocol';
import { buildHermesExecutionModel } from '@redcube/hermes-substrate';
import {
  buildPosterBlueprint,
  buildPosterRenderArtifact,
  buildPosterVisualDirection,
} from '@redcube/pack-poster-onepager';
import { compareFailuresAndDensity, summarizeRelativeQuality } from '@redcube/reference-os';
import { getReviewState, isBaselineApprovedState } from '@redcube/governance';

/**
 * @typedef {import('./types.js').PosterRuntimeRunRequest} PosterRuntimeRunRequest
 * @typedef {import('./types.js').PosterRuntimeRouteResult} PosterRuntimeRouteResult
 */

const MODULE_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(MODULE_DIR, '../../..');
const PYTHON_REVIEW = path.join(MODULE_DIR, '../../redcube-runtime/scripts/ppt_deck_review.py');
const CANVAS = Object.freeze({ ratio: '4:5', width: 1080, height: 1350 });
const BANNED_RENDER_TOKENS = Object.freeze(['renderSlide', 'layoutByType', 'cardsGrid', 'pageType']);
const HERMES_EXECUTION_MODEL = Object.freeze(buildHermesExecutionModel());
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

function sourceTruth(contract) {
  return contract?.shared_source_truth || null;
}

function sourceMaterials(contract) {
  return safeArray(sourceTruth(contract)?.extracted_materials?.materials);
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
    .filter((source) => source.status === 'ready')
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

function creativeExecution(lifecycleStage) {
  return {
    owner: 'hermes',
    primary_surface: 'hermes_backed_runtime_substrate',
    lifecycle_stage: lifecycleStage,
    ownership_model: 'director_first',
  };
}

function creativeSourceStamp({ route, lifecycleStage, authoredSurface, materializedFrom = 'prompt_pack_seed' }) {
  return {
    owner: 'hermes',
    primary_surface: 'hermes_backed_runtime_substrate',
    stage_owner: 'hermes_backed_runtime_substrate',
    route,
    lifecycle_stage: lifecycleStage,
    authored_surface: authoredSurface,
    materialized_from: materializedFrom,
  };
}

function reviewAuthorship(overlay) {
  return {
    overlay,
    primary_surface: 'hermes_backed_runtime_substrate',
    contract_asset: 'prompt_pack_seed',
  };
}

function attachCommon(route, contract) {
  return {
    route,
    overlay: contract.overlay,
    profile_id: contract.profile_id,
    produced_at: new Date().toISOString(),
    prompt_pack: promptMeta(contract, route),
    lifecycle_stage: lifecycleStageForRoute(contract, route),
    review_overlay: reviewOverlayForRoute(contract, route),
    execution_model: HERMES_EXECUTION_MODEL,
  };
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

function buildStoryline(contract) {
  const authoredArtifact = promptArtifact(contract, 'storyline', {
    title: safeText(contract.title),
    goal: safeText(contract.goal),
  });
  const storyline = authoredArtifact?.storyline;
  if (!storyline) {
    throw new Error(`Missing poster_onepager storyline runtime_artifact for profile: ${contract.profile_id}`);
  }
  return {
    ...attachCommon('storyline', contract),
    creative_execution: creativeExecution(lifecycleStageForRoute(contract, 'storyline') || 'story_architecture'),
    storyline: {
      headline: safeText(storyline.headline, contract.title),
      subheadline: safeText(storyline.subheadline, contract.goal),
      audience_judgement: safeText(storyline.audience_judgement),
      why_now: safeText(storyline.why_now),
      proof_promise: safeText(storyline.proof_promise),
      call_to_action: safeText(storyline.call_to_action),
      source_truth_material_ids: sourceMaterialIds(contract),
      creative_sources: {
        headline: creativeSourceStamp({
          route: 'storyline',
          lifecycleStage: 'story_architecture',
          authoredSurface: 'headline',
          materializedFrom: 'prompt_pack_artifact',
        }),
        proof_promise: creativeSourceStamp({
          route: 'storyline',
          lifecycleStage: 'story_architecture',
          authoredSurface: 'proof_promise',
          materializedFrom: 'prompt_pack_artifact',
        }),
      },
    },
  };
}

function buildPosterBlueprintArtifact(contract, deliverablePaths) {
  const storylineArtifact = readStageArtifact(contract, deliverablePaths, 'storyline');
  return buildPosterBlueprint(contract, storylineArtifact, {
    safeText,
    safeArray,
    promptSeed,
    attachCommon,
    CANVAS,
    BANNED_RENDER_TOKENS,
    sourceLabels,
  });
}

function buildPosterVisualDirectionArtifact(contract, deliverablePaths, mode, baselineDeliverableId) {
  const blueprintArtifact = readStageArtifact(contract, deliverablePaths, 'poster_blueprint');
  return buildPosterVisualDirection(contract, blueprintArtifact, mode, baselineDeliverableId, {
    safeText,
    safeArray,
    promptSeed,
    attachCommon,
  });
}

function renderContract(contract) {
  return contract?.prompt_pack?.render_contract || {};
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

function buildDirectorReview(contract, deliverablePaths) {
  const storylineArtifact = readStageArtifact(contract, deliverablePaths, 'storyline');
  const seed = promptSeed(contract, 'visual_director_review', {
    headline: safeText(storylineArtifact?.storyline?.headline),
    proof_promise: safeText(storylineArtifact?.storyline?.proof_promise),
    call_to_action: safeText(storylineArtifact?.storyline?.call_to_action),
  });
  const reviewSeed = seed?.visual_director_review || {};
  const checks = {
    director_intent_landed: Boolean(reviewSeed.director_intent_landed),
    anti_template_ok: Boolean(reviewSeed.anti_template_ok),
    message_hierarchy_clear: Boolean(reviewSeed.message_hierarchy_clear),
    evidence_trace_clear: Boolean(reviewSeed.evidence_trace_clear),
  };
  const failedChecks = Object.entries(checks)
    .filter(([, value]) => value === false)
    .map(([key]) => key);
  const status = failedChecks.length === 0 ? 'pass' : 'block';
  const reviewFile = path.join(deliverablePaths.reportsDir, `${deliverablePaths.deliverableId}_视觉总监复盘.md`);
  writeText(reviewFile, [
    '# 视觉总监复盘',
    '',
    '- review_owner: hermes_backed_runtime_substrate',
    `- director_intent_landed: ${checks.director_intent_landed}`,
    `- anti_template_ok: ${checks.anti_template_ok}`,
    `- message_hierarchy_clear: ${checks.message_hierarchy_clear}`,
    `- evidence_trace_clear: ${checks.evidence_trace_clear}`,
    `- weak_regions: ${safeArray(reviewSeed.weak_regions).join(', ') || 'none'}`,
    `- review_summary: ${safeText(reviewSeed.review_summary, 'none')}`,
  ].join('\n'));
  const rerunFromStage = status === 'pass'
    ? null
    : rerunStageFromReviewSurface(contract, failedChecks, 'visual_director_review');
  return {
    ...attachCommon('visual_director_review', contract),
    review_overlay: 'visual_director_review',
    review_authorship: reviewAuthorship('visual_director_review'),
    review_execution: {
      ...creativeExecution('review_overlay'),
      overlay: 'visual_director_review',
    },
    status,
    visual_director_review: {
      director_intent_landed: checks.director_intent_landed,
      anti_template_ok: checks.anti_template_ok,
      message_hierarchy_clear: checks.message_hierarchy_clear,
      evidence_trace_clear: checks.evidence_trace_clear,
      weak_regions: safeArray(reviewSeed.weak_regions),
      rewrite_action: safeText(reviewSeed.rewrite_action, status === 'pass' ? 'none' : 'revise_render_html'),
      review_summary: safeText(reviewSeed.review_summary),
      creative_sources: {
        review_judgement: 'hermes',
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

function buildScreenshotReview(workspaceRoot, topicId, contract, deliverablePaths, mode, baselineDeliverableId) {
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
  const slideReviews = safeArray(python.slide_reviews).map((slide) => {
    const occupiedRatio = Number(slide?.metrics?.occupied_ratio || 0);
    const overlaps = safeArray(slide?.metrics?.overlaps);
    const overflowFree = Boolean(slide?.checks?.overflow_free);
    const occlusionFree = overlaps.length === 0;
    const visualDensityOk = occupiedRatio >= 0.18 && occupiedRatio <= 0.82;
    const issues = [];
    if (!overflowFree) issues.push('overflow_detected');
    if (!occlusionFree) issues.push('occlusion_detected');
    if (!visualDensityOk) issues.push('visual_density_out_of_range');
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
      },
      metrics: {
        occupied_ratio: Number(occupiedRatio.toFixed(4)),
        primary_points: Number(slide?.metrics?.primary_points || 0),
        overlaps,
      },
      issues,
    };
  });
  const checks = {
    director_intent_landed: Boolean(directorReview?.visual_director_review?.director_intent_landed),
    anti_template_ok: Boolean(directorReview?.visual_director_review?.anti_template_ok),
    message_hierarchy_clear: Boolean(directorReview?.visual_director_review?.message_hierarchy_clear),
    overflow_free: slideReviews.every((slide) => slide.checks.overflow_free),
    occlusion_free: slideReviews.every((slide) => slide.checks.occlusion_free),
    visual_density_ok: slideReviews.every((slide) => slide.checks.visual_density_ok),
  };
  const failedChecks = Object.entries(checks)
    .filter(([, value]) => value === false)
    .map(([key]) => key);
  const rerunFromStage = failedChecks.length === 0
    ? null
    : rerunStageFromReviewSurface(contract, failedChecks, 'render_html');
  const artifact = {
    ...attachCommon('screenshot_review', contract),
    review_overlay: 'screenshot_review',
    review_authorship: {
      primary_surface: 'governed_screenshot_review',
      contract_asset: 'python_review_pipeline',
    },
    mode,
    status: failedChecks.length === 0 ? 'pass' : 'block',
    checks,
    slide_reviews: slideReviews,
    report_markdown: python.review_markdown || reviewMarkdown,
    metrics: python.metrics,
    artifact_refs: [python.review_markdown || reviewMarkdown, ...slideReviews.map((slide) => slide.screenshot_file)].filter(Boolean),
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
  return artifact;
}

function buildExportBundle(contract, deliverablePaths) {
  const renderArtifact = readStageArtifact(contract, deliverablePaths, 'render_html');
  const reviewArtifact = readStageArtifact(contract, deliverablePaths, 'screenshot_review');
  const manifestFile = path.join(deliverablePaths.reportsDir, `${deliverablePaths.deliverableId}-publish-manifest.json`);
  const exportBundle = {
    source_html: renderArtifact.html_bundle.html_file,
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
    ...attachCommon('export_bundle', contract),
    status: 'completed',
    export_bundle: exportBundle,
    artifact_refs: [manifestFile, exportBundle.source_html, exportBundle.review_markdown, ...exportBundle.png_files].filter(Boolean),
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

export function canRunPosterOnepager(contract) {
  return contract?.deliverable_kind === 'poster_onepager';
}

/**
 * @param {PosterRuntimeRunRequest} request
 * @returns {Promise<PosterRuntimeRouteResult>}
 */
export async function runPosterOnepagerRoute({ workspaceRoot, topicId, deliverableId, route, contract, mode = 'draft_new', baselineDeliverableId = '' }) {
  const { deliverablePaths } = ensurePrerequisites({ workspaceRoot, topicId, deliverableId, route, mode, baselineDeliverableId });
  const stageContract = safeArray(contract.stage_sequence?.stages).find((stage) => stage?.stage_id === route) || null;
  let payload;
  switch (route) {
    case 'storyline':
      payload = buildStoryline(contract);
      break;
    case 'poster_blueprint':
      payload = buildPosterBlueprintArtifact(contract, deliverablePaths);
      break;
    case 'visual_direction':
      payload = buildPosterVisualDirectionArtifact(contract, deliverablePaths, mode, baselineDeliverableId);
      break;
    case 'render_html':
      payload = await buildPosterRenderArtifact({ workspaceRoot, topicId, deliverableId, contract, deliverablePaths }, {
        readStageArtifact,
        renderContract,
        promptArtifact,
        safeText,
        safeArray,
        attachCommon,
        CANVAS,
        path,
        readPromptPackText,
        resolvePromptPackAsset,
        writeText,
        writeJson,
      });
      break;
    case 'visual_director_review':
      payload = buildDirectorReview(contract, deliverablePaths);
      break;
    case 'screenshot_review':
      payload = buildScreenshotReview(workspaceRoot, topicId, contract, deliverablePaths, mode, baselineDeliverableId);
      break;
    case 'export_bundle':
      payload = buildExportBundle(contract, deliverablePaths);
      break;
    default:
      throw new Error(`Unsupported poster_onepager route: ${route}`);
  }
  const sourceTruthConsumptionRole = ROUTE_TO_SOURCE_TRUTH_CONSUMPTION_ROLE[route] || '';
  return {
    overlay: contract.overlay,
    route,
    topic_id: topicId,
    deliverable_id: deliverableId,
    contract,
    stage_contract: stageContract,
    ...(sourceTruthConsumptionRole
      ? {
          source_truth_consumption: buildSourceTruthConsumptionSummary(contract.shared_source_truth, {
            consumptionRole: sourceTruthConsumptionRole,
            defaultSourceLabels: sourceLabels(contract),
          }),
        }
      : {}),
    ...payload,
  };
}
