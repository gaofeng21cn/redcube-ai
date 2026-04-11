import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

import {
  buildSourceTruthConsumptionSummary,
  getDeliverablePaths,
} from '@redcube/runtime-protocol';
import { buildHermesExecutionModel } from '@redcube/hermes-substrate';

import {
  buildXhsRenderHtml,
  buildXhsPlanSlides,
  buildXhsVisualDirection,
} from '@redcube/pack-xiaohongshu';
import { loadRenderPackCompiler } from '@redcube/pack-runtime';
import { compareFailuresAndDensity, summarizeRelativeQuality } from '@redcube/reference-os';
import { getReviewState, isBaselineApprovedState } from '@redcube/governance';

/**
 * @typedef {import('./types.js').XhsRuntimeRunRequest} XhsRuntimeRunRequest
 * @typedef {import('./types.js').XhsRuntimeRouteResult} XhsRuntimeRouteResult
 */

const MODULE_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(MODULE_DIR, '../../..');
const PYTHON_REVIEW = path.join(MODULE_DIR, '../../redcube-runtime/scripts/ppt_deck_review.py');
const CANVAS = { ratio: '3:4', width: 448, height: 597 };
const DEFAULT_PROMPT_PACK = {
  research: 'prompts/xiaohongshu/research.md',
  storyline: 'prompts/xiaohongshu/storyline.md',
  single_note_plan: 'prompts/xiaohongshu/single_note_plan.md',
  visual_direction: 'prompts/xiaohongshu/visual_direction.md',
  render_html: 'prompts/xiaohongshu/render_html.md',
  visual_director_review: 'prompts/xiaohongshu/director_review.md',
  screenshot_review: 'prompts/xiaohongshu/screenshot_review.md',
  publish_copy: 'prompts/xiaohongshu/publish_copy.md',
  export_bundle: 'prompts/xiaohongshu/export_bundle.md',
};

const LIFECYCLE_STAGE_BY_ROUTE = Object.freeze({
  research: 'source_readiness',
  storyline: 'story_architecture',
  single_note_plan: 'story_architecture',
  visual_direction: 'visual_authorship',
  render_html: 'visual_authorship',
  visual_director_review: 'review_overlay',
  screenshot_review: 'review_overlay',
  publish_copy: 'delivery_packaging',
  export_bundle: 'delivery_packaging',
});

const HERMES_EXECUTION_MODEL = Object.freeze(buildHermesExecutionModel());
const ROUTE_TO_SOURCE_TRUTH_CONSUMPTION_ROLE = Object.freeze({
  research: 'source_readiness',
  storyline: 'story_architecture',
  single_note_plan: 'story_architecture',
  visual_direction: 'visual_authorship',
});

function hostAgentCreativeSource(contractAsset) {
  return {
    owner: 'hermes',
    primary_surface: 'hermes_backed_runtime_substrate',
    stage_owner: 'hermes_backed_runtime_substrate',
    adapter: 'hermes',
    supporting_contract: safeText(contractAsset, 'prompt_pack_seed'),
  };
}

function creativeExecution(route) {
  return {
    owner: 'hermes',
    primary_surface: 'hermes_backed_runtime_substrate',
    lifecycle_stage: LIFECYCLE_STAGE_BY_ROUTE[route] || null,
    ownership_model: 'director_first',
  };
}

function creativeSourceStamp({ route, lifecycleStage, authoredSurface, materializedFrom = 'prompt_pack_seed' }) {
  return {
    ...hostAgentCreativeSource(materializedFrom),
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
  return path.join(deliverablePaths.artifactsDir, safeText(stage?.output_artifact, `${stageId}.json`));
}

function readStageArtifact(contract, deliverablePaths, stageId) {
  const file = stageArtifactPath(contract, deliverablePaths, stageId);
  return existsSync(file) ? readJson(file) : null;
}

function promptPackRoot(contract) {
  return safeText(contract?.prompt_pack?.root, 'prompts/xiaohongshu');
}

function promptRoute(contract, route) {
  return safeText(contract?.prompt_pack?.routes?.[route]) || DEFAULT_PROMPT_PACK[route];
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
  const absolutePath = path.join(REPO_ROOT, relativePath);
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

function isSeries(contract) {
  return /系列/.test(`${safeText(contract.title)} ${safeText(contract.goal)}`);
}

function publicSources() {
  return [
    '公开临床指南 / 系统综述 / 正式流程资料',
    '同行评议论文 / 真实世界研究',
    '用户当次指定素材',
  ];
}


function inferAudience(contract) {
  const joined = `${safeText(contract.title)} ${safeText(contract.goal)}`;
  if (/门诊|患者|科普/.test(joined)) {
    return '门诊患者和家属：更关心先做什么、怎么避免走弯路，而不是完整术语体系';
  }
  if (/医生|临床/.test(joined)) {
    return '临床一线读者：更关心判断顺序、误区成本与可执行动作';
  }
  return '泛知识读者：更关心先理解冲突，再拿走一个能立刻复用的动作';
}

function inferWhyNow(contract) {
  const joined = `${safeText(contract.title)} ${safeText(contract.goal)}`;
  if (/AI|工具/.test(joined)) {
    return '因为工具和信息都变多了，越是看起来容易，越需要先把判断顺序讲清，不然最容易被表面答案带偏';
  }
  return '因为现在信息源更多、判断压力更大，越需要先给读者一条最短的判断路径';
}

function inferTension(contract) {
  return '旧习惯看起来省事，但会把判断顺序做反，最后把时间花在错误动作上';
}

function inferMemoryHook(contract) {
  const joined = `${safeText(contract.title)} ${safeText(contract.goal)}`;
  if (/AI|工具/.test(joined)) {
    return '先别急着上工具，先把顺序做对';
  }
  return '先别急着记概念，先抓最值钱的判断句';
}

function sourceTruth(contract) {
  return contract?.shared_source_truth || null;
}

function sourceReadinessPack(contract) {
  return sourceTruth(contract)?.source_readiness_pack || null;
}

function sourceMaterials(contract) {
  return safeArray(sourceTruth(contract)?.extracted_materials?.materials);
}

function sourceMaterialIds(contract) {
  return sourceMaterials(contract).map((material) => material.material_id);
}

function sourceLabels(contract) {
  const truth = sourceTruth(contract);
  const labels = safeArray(truth?.source_index?.sources)
    .filter((source) => source.status === 'ready')
    .map((source) => source.relative_path || source.kind);
  return labels.length > 0 ? labels : publicSources();
}

function sourceSnippet(contract, index = 0) {
  const materials = sourceMaterials(contract);
  if (materials.length === 0) return '';
  const material = materials[index % materials.length];
  return safeText(material?.excerpt || material?.content_text).replace(/\s+/g, ' ').slice(0, 64);
}

function sourceInputMode(contract) {
  return safeText(sourceTruth(contract)?.source_brief?.input_mode);
}

function sourceConfidence(contract) {
  return safeText(sourceTruth(contract)?.source_brief?.confidence);
}

function sourceSufficiencyStatus(contract) {
  return safeText(sourceReadinessPack(contract)?.readiness?.sufficiency_status, sourceMaterials(contract).length > 0 ? 'planning_ready' : 'augmentation_required');
}

function sourceDeepResearchState(contract) {
  return safeText(sourceReadinessPack(contract)?.readiness?.deep_research_state, sourceInputMode(contract) === 'brief_keywords' ? 'required' : 'not_required');
}

function sourceEvidenceGaps(contract) {
  return safeArray(sourceReadinessPack(contract)?.fact_library?.evidence_gaps);
}

function sourceBlockingEvidenceGaps(contract) {
  return safeArray(sourceReadinessPack(contract)?.fact_library?.blocking_evidence_gaps);
}

function sourceResidualEvidenceGaps(contract) {
  return safeArray(sourceReadinessPack(contract)?.fact_library?.residual_evidence_gaps);
}

function sourceTopicSummary(contract) {
  return safeText(
    sourceReadinessPack(contract)?.fact_library?.topic_summary,
    sourceTruth(contract) && sourceSnippet(contract, 0)
      ? `${contract.title} 的 shared source truth 显示：${sourceSnippet(contract, 0)}`
      : `${contract.title} 面向患者做可信、可发布的小红书图文`,
  );
}

function buildStorylineInputs(contract, research) {
  return {
    mode: safeText(research?.research?.mode, 'single'),
    audience_judgement: sourceTruth(contract) ? deriveAudienceFromSource(contract) : inferAudience(contract),
    tension: sourceTruth(contract) ? deriveTensionFromSource(contract) : inferTension(contract),
    why_now: sourceTruth(contract) ? deriveWhyNowFromSource(contract) : inferWhyNow(contract),
    memory_hook: sourceTruth(contract) ? deriveMemoryHookFromSource(contract) : inferMemoryHook(contract),
  };
}

function deriveAudienceFromSource(contract) {
  const corpus = `${safeText(sourceTruth(contract)?.source_brief?.brief_text)} ${sourceMaterials(contract).map((material) => safeText(material.content_text)).join(' ')}`;
  if (/患者|门诊|家属/.test(corpus)) {
    return '门诊患者和家属：更关心先做什么、怎么避免走弯路，而不是完整术语体系';
  }
  if (/医生|临床|同行/.test(corpus)) {
    return '临床一线读者：更关心判断顺序、误区成本与可执行动作';
  }
  return inferAudience(contract);
}

function deriveWhyNowFromSource(contract) {
  const snippet = sourceSnippet(contract, 0);
  return snippet ? `当前输入材料反复指向的现实问题是：${snippet}` : inferWhyNow(contract);
}

function deriveTensionFromSource(contract) {
  const snippet = sourceSnippet(contract, 1) || sourceSnippet(contract, 0);
  return snippet ? `输入材料里的核心冲突是：${snippet}` : inferTension(contract);
}

function deriveMemoryHookFromSource(contract) {
  const snippet = sourceSnippet(contract, 0);
  return snippet ? `先记住这句：${snippet}` : inferMemoryHook(contract);
}

function attachCommon(route, contract) {
  return {
    overlay: contract.overlay,
    route,
    profile_id: contract.profile_id,
    produced_at: new Date().toISOString(),
    lifecycle_stage: LIFECYCLE_STAGE_BY_ROUTE[route] || null,
    execution_model: HERMES_EXECUTION_MODEL,
    prompt_pack: promptMeta(contract, route),
  };
}

function ensurePrerequisites({ workspaceRoot, topicId, deliverableId, route, mode, baselineDeliverableId }) {
  const deliverablePaths = getDeliverablePaths(workspaceRoot, topicId, deliverableId);
  const contract = readJson(path.join(deliverablePaths.deliverableDir, 'contracts', 'hydrated-deliverable.json'));
  const required = safeArray(contract?.stage_requirements?.[route]?.requires_artifacts);
  const missing = required.filter((stageId) => !readStageArtifact(contract, deliverablePaths, stageId));
  if (missing.length > 0) {
    throw new Error(`Route ${route} requires completed stage artifacts: ${missing.join(', ')}`);
  }
  if (route === 'publish_copy' || route === 'export_bundle') {
    const reviewArtifact = readStageArtifact(contract, deliverablePaths, 'screenshot_review');
    if (!reviewArtifact || reviewArtifact.status !== 'pass') {
      throw new Error(`Route ${route} requires screenshot_review to pass before export`);
    }
  }
  if (route === 'screenshot_review') {
    const directorReviewArtifact = readStageArtifact(contract, deliverablePaths, 'visual_director_review');
    if (!directorReviewArtifact || directorReviewArtifact.status !== 'pass') {
      throw new Error('Route screenshot_review requires visual_director_review to pass before audit');
    }
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
  return { deliverablePaths, contract };
}

function buildResearch(contract) {
  const seed = promptSeed(contract, 'research', { title: contract.title });
  const references = sourceTruth(contract)
    ? sourceLabels(contract)
    : safeArray(seed?.research?.reference_source_list).length > 0 ? seed.research.reference_source_list : publicSources();
  const topicSummary = sourceTopicSummary(contract)
    || safeText(seed?.research?.topic_summary, `${contract.title} 面向患者做可信、可发布的小红书图文`);
  return {
    ...attachCommon('research', contract),
    source_readiness: {
      research_positioning: 'shared_source_readiness_augmentation',
      augmentation_triggered: sourceDeepResearchState(contract) === 'required',
      planning_ready: sourceSufficiencyStatus(contract) === 'planning_ready',
      blocking_evidence_gaps: sourceBlockingEvidenceGaps(contract),
      residual_evidence_gaps: sourceResidualEvidenceGaps(contract),
      trigger_signals: {
        source_missing_or_insufficient: sourceSufficiencyStatus(contract) !== 'planning_ready',
        task_requires_public_evidence: true,
      },
    },
    research: {
      topic_summary: topicSummary,
      fact_library_summary: topicSummary,
      mode: isSeries(contract) ? 'series' : 'single',
      reference_source_list: references,
      public_sources: references,
      evidence_gaps: sourceEvidenceGaps(contract),
      blocking_evidence_gaps: sourceBlockingEvidenceGaps(contract),
      residual_evidence_gaps: sourceResidualEvidenceGaps(contract),
      forbidden_source_hit_count: Number(seed?.research?.forbidden_source_hit_count || 0),
      input_mode: sourceInputMode(contract) || 'seed_only',
      confidence: sourceConfidence(contract) || 'low',
      source_sufficiency_judgement: sourceSufficiencyStatus(contract),
      source_truth_material_count: sourceMaterials(contract).length,
      source_truth_material_ids: sourceMaterialIds(contract),
      input_output_state: {
        current: 'input_ready',
        next: 'planning_ready',
      },
    },
  };
}

function buildStoryline(contract, deliverablePaths) {
  const research = readStageArtifact(contract, deliverablePaths, 'research');
  const authoredArtifact = promptArtifact(contract, 'storyline', buildStorylineInputs(contract, research));
  const authoredStoryline = authoredArtifact?.storyline;
  if (!authoredStoryline) {
    throw new Error(`Missing xiaohongshu storyline runtime_artifact for profile: ${contract.profile_id}`);
  }
  return {
    ...attachCommon('storyline', contract),
    creative_execution: creativeExecution('storyline'),
    storyline: {
      mode: safeText(authoredStoryline.mode, research?.research?.mode || 'single'),
      audience_judgement: safeText(authoredStoryline.audience_judgement),
      tension: safeText(authoredStoryline.tension),
      why_now: safeText(authoredStoryline.why_now),
      memory_hook: safeText(authoredStoryline.memory_hook),
      hook: safeText(authoredStoryline.hook),
      narrative_progression: safeArray(authoredStoryline.narrative_progression),
      journey: safeArray(authoredStoryline.journey),
      resolution: safeText(authoredStoryline.resolution),
      series_needed: (research?.research?.mode || 'single') === 'series',
      source_truth_material_ids: safeArray(research?.research?.source_truth_material_ids),
      source_truth_confidence: safeText(research?.research?.confidence),
      creative_sources: {
        narrative_arc: creativeSourceStamp({
          route: 'storyline',
          lifecycleStage: 'story_architecture',
          authoredSurface: 'narrative_arc',
          materializedFrom: 'prompt_pack_artifact',
        }),
        memory_hook: creativeSourceStamp({
          route: 'storyline',
          lifecycleStage: 'story_architecture',
          authoredSurface: 'memory_hook',
          materializedFrom: 'prompt_pack_artifact',
        }),
      },
    },
  };
}

function buildSingleNotePlan(contract, deliverablePaths) {
  const seed = promptSeed(contract, 'single_note_plan', { title: contract.title });
  const titleOptions = safeArray(seed?.plan?.title_options);
  const storyline = readStageArtifact(contract, deliverablePaths, 'storyline');
  const research = readStageArtifact(contract, deliverablePaths, 'research');
  const slides = buildXhsPlanSlides(contract, storyline, research, {
    safeText,
    safeArray,
    promptSeed,
    sourceLabels,
    sourceMaterials,
    inferMemoryHook,
    inferAudience,
    inferWhyNow,
    inferTension,
  });
  return {
    ...attachCommon('single_note_plan', contract),
    creative_execution: creativeExecution('single_note_plan'),
    single_note_plan: {
      mode: isSeries(contract) ? 'series' : 'single',
      title_options: titleOptions,
      planning_doc_markdown: [`# 01_单篇策划`, '', `- 目标：${contract.goal}`, `- 封面钩子：${titleOptions[0] || contract.title}`].join('\n'),
      slides,
      source_truth_material_ids: sourceMaterialIds(contract),
    },
  };
}

function renderContract(contract) {
  return contract?.prompt_pack?.render_contract || {};
}

function runPython(script, args) {
  if (!existsSync(script)) throw new Error(`Missing python helper: ${script}`);
  const result = spawnSync('python3', [script, ...args], { encoding: 'utf-8', maxBuffer: 16 * 1024 * 1024 });
  if (result.status !== 0) throw new Error((result.stderr || result.stdout || `python helper failed: ${script}`).trim());
  return JSON.parse(result.stdout);
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
    current_failed_slides: currentFailures,
    baseline_failed_slides: baselineFailures,
    current_average_density: Number(currentDensity.toFixed(4)),
    baseline_average_density: Number(baselineDensity.toFixed(4)),
    baseline_comparison_passed: passed,
    relative_quality: relativeQuality,
    summary: summarizeRelativeQuality(relativeQuality),
  };
}

function computeSeriesSurfaces(contract, deliverablePaths, exportBundle) {
  if (!isSeries(contract)) return null;
  const cadenceFile = path.join(deliverablePaths.reportsDir, '05_全系列发布节奏建议.md');
  const mappingFile = path.join(deliverablePaths.reportsDir, '06_目录索引与路径映射.md');
  const overviewFile = path.join(deliverablePaths.reportsDir, '99_交付总览.md');
  writeText(cadenceFile, ['# 05_全系列发布节奏建议', '', '1. 先发认知破冰页', '2. 再发机制解释页', '3. 最后发动作清单页'].join('\n'));
  writeText(mappingFile, ['# 06_目录索引与路径映射', '', `- HTML: ${exportBundle.html_file}`, `- Caption: ${exportBundle.caption_file}`].join('\n'));
  writeText(overviewFile, ['# 99_交付总览', '', `- 当前状态：${exportBundle.delivery_state.current}`, `- PNG页数：${exportBundle.png_files.length}`].join('\n'));
  return {
    cadence_file: cadenceFile,
    path_mapping_file: mappingFile,
    delivery_overview_file: overviewFile,
  };
}


function buildDirectorReview(contract, deliverablePaths) {
  const storyline = readStageArtifact(contract, deliverablePaths, 'storyline');
  const seed = promptSeed(contract, 'visual_director_review', {
    memory_hook: safeText(storyline?.storyline?.memory_hook),
  });
  const reviewSeed = seed?.visual_director_review || {};
  const directorIntentLanded = Boolean(reviewSeed.director_intent_landed);
  const antiTemplateOk = Boolean(reviewSeed.anti_template_ok);
  const memoryHookPresent = Boolean(reviewSeed.memory_hook_present);
  const weakPages = safeArray(reviewSeed.weak_pages);
  const homogeneousLayoutRisk = Number(reviewSeed.homogeneous_layout_risk || 0);
  const reviewSummary = safeText(reviewSeed.review_summary);
  const status = directorIntentLanded && antiTemplateOk && memoryHookPresent ? 'pass' : 'block';
  const reviewFile = path.join(deliverablePaths.reportsDir, `${deliverablePaths.deliverableId}_视觉总监复盘.md`);
  writeText(reviewFile, [
    '# 视觉总监复盘',
    '',
    '- review_owner: hermes_backed_runtime_substrate',
    `- director_intent_landed: ${directorIntentLanded}`,
    `- anti_template_ok: ${antiTemplateOk}`,
    `- memory_hook_present: ${memoryHookPresent}`,
    `- homogeneous_layout_risk: ${homogeneousLayoutRisk}`,
    `- weak_pages: ${weakPages.join(',') || 'none'}`,
    `- review_summary: ${reviewSummary || 'none'}`,
  ].join('\n'));
  return {
    ...attachCommon('visual_director_review', contract),
    review_overlay: 'visual_director_review',
    review_authorship: reviewAuthorship('visual_director_review'),
    review_execution: {
      ...creativeExecution('visual_director_review'),
      overlay: 'visual_director_review',
    },
    status,
    visual_director_review: {
      review_model: 'director_first_visual_judgement',
      director_intent_landed: directorIntentLanded,
      anti_template_ok: antiTemplateOk,
      memory_hook_present: memoryHookPresent,
      homogeneous_layout_risk: homogeneousLayoutRisk,
      weak_pages: weakPages,
      review_summary: reviewSummary,
      rewrite_action: status === 'pass' ? 'none' : safeText(reviewSeed.rewrite_action, 'revise_render_html'),
      creative_sources: {
        review_judgement: creativeSourceStamp({
          route: 'visual_director_review',
          lifecycleStage: 'review_overlay',
          authoredSurface: 'review_judgement',
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
      pending_reviews: status === 'pass' ? [] : Object.entries({
        director_intent_landed: directorIntentLanded,
        anti_template_ok: antiTemplateOk,
        memory_hook_present: memoryHookPresent,
      }).filter(([, value]) => value === false).map(([key]) => key),
      blocking_reasons: status === 'pass' ? [] : Object.entries({
        director_intent_landed: directorIntentLanded,
        anti_template_ok: antiTemplateOk,
        memory_hook_present: memoryHookPresent,
      }).filter(([, value]) => value === false).map(([key]) => key),
      rerun_from_stage: status === 'pass' ? null : 'render_html',
      rerun_policy: {
        status: status === 'pass' ? 'idle' : 'rerun_required',
        rerun_from_stage: status === 'pass' ? null : 'render_html',
      },
    },
  };
}

function buildScreenshotReview(workspaceRoot, topicId, contract, deliverablePaths, mode, baselineDeliverableId) {
  const render = readStageArtifact(contract, deliverablePaths, 'render_html');
  const reviewMarkdown = path.join(deliverablePaths.reportsDir, `${deliverablePaths.deliverableId}_视觉质控复核.md`);
  const screenshotsDir = ensureDir(path.join(deliverablePaths.reportsDir, 'screenshots'));
  const args = [
    '--html', render.html_bundle.html_file,
    '--output-dir', screenshotsDir,
    '--review-markdown', reviewMarkdown,
    '--max-primary-points', String(contract.layout_rules?.max_primary_points_per_slide || 4),
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
    const overflowFree = occupiedRatio <= 0.88;
    const occlusionFree = overlaps.length === 0;
    const visualDensityOk = occupiedRatio >= 0.18 && occupiedRatio <= 0.88;
    const speakerFitOk = slide?.checks?.speaker_fit_ok !== false;
    const issues = [];
    if (!overflowFree) issues.push('overflow_detected');
    if (!occlusionFree) issues.push('occlusion_detected');
    if (!visualDensityOk) issues.push('visual_density_out_of_range');
    if (!speakerFitOk) issues.push('speaker_fit_out_of_range');
    return {
      ...slide,
      checks: {
        overflow_free: overflowFree,
        occlusion_free: occlusionFree,
        visual_density_ok: visualDensityOk,
        speaker_fit_ok: speakerFitOk,
      },
      issues,
    };
  });
  const directorReview = readStageArtifact(contract, deliverablePaths, 'visual_director_review');
  const checks = {
    director_intent_landed: Boolean(directorReview?.visual_director_review?.director_intent_landed),
    overflow_free: slideReviews.every((slide) => slide.checks.overflow_free),
    occlusion_free: slideReviews.every((slide) => slide.checks.occlusion_free),
    visual_density_ok: slideReviews.every((slide) => slide.checks.visual_density_ok),
    speaker_fit_ok: slideReviews.every((slide) => slide.checks.speaker_fit_ok),
    cover_density_ok: slideReviews.length > 0 && Number(slideReviews[0]?.metrics?.occupied_ratio || 0) >= 0.22,
    anti_template_ok: Boolean(directorReview?.visual_director_review?.anti_template_ok),
    memory_hook_present: Boolean(directorReview?.visual_director_review?.memory_hook_present),
  };
  const status = Object.values(checks).every((value) => value === true) ? 'pass' : 'block';
  const artifact = {
    ...attachCommon('screenshot_review', contract),
    review_overlay: 'screenshot_review',
    review_authorship: {
      primary_surface: 'governed_screenshot_review',
      contract_asset: 'python_review_pipeline',
    },
    mode,
    status,
    checks,
    slide_reviews: slideReviews,
    report_markdown: python.review_markdown || reviewMarkdown,
    metrics: python.metrics,
    artifact_refs: [python.review_markdown || reviewMarkdown, ...slideReviews.map((slide) => slide.screenshot_file)],
    review_state_patch: {
      current_status: status === 'pass' ? 'review_passed' : 'blocked_for_revision',
      ready_for_export: false,
      latest_review_stage: 'screenshot_review',
      latest_checks: checks,
      pending_reviews: status === 'pass' ? [] : Object.entries(checks).filter(([, value]) => value === false).map(([key]) => key),
      blocking_reasons: status === 'pass' ? [] : Object.entries(checks).filter(([, value]) => value === false).map(([key]) => key),
      rerun_from_stage: status === 'pass' ? null : 'render_html',
      rerun_policy: {
        status: status === 'pass' ? 'idle' : 'rerun_required',
        rerun_from_stage: status === 'pass' ? null : 'render_html',
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
    }
  }
  return artifact;
}

function buildPublishCopy(contract, deliverablePaths) {
  const plan = readStageArtifact(contract, deliverablePaths, 'single_note_plan');
  const render = readStageArtifact(contract, deliverablePaths, 'render_html');
  const storyline = readStageArtifact(contract, deliverablePaths, 'storyline');
  const titles = safeArray(plan?.single_note_plan?.title_options).slice(0, 3);
  const authoredArtifact = promptArtifact(contract, 'publish_copy', {
    title: contract.title,
    title_1: titles[0] || contract.title,
    title_2: titles[1] || titles[0] || contract.title,
    title_3: titles[2] || titles[1] || titles[0] || contract.title,
    memory_hook: safeText(storyline?.storyline?.memory_hook),
    audience_judgement: safeText(storyline?.storyline?.audience_judgement),
    cover_slide_id: render?.html_bundle?.slides?.[0]?.slide_id || 'N01',
  });
  const publishArtifact = authoredArtifact?.publish_copy;
  if (!publishArtifact) {
    throw new Error(`Missing xiaohongshu publish_copy runtime_artifact for profile: ${contract.profile_id}`);
  }
  const hydratedTitles = titles;
  const body = safeText(publishArtifact.body);
  const interactionQuestions = safeArray(publishArtifact.interaction_questions).filter(Boolean);
  const hashtags = safeArray(publishArtifact.hashtags).filter(Boolean);
  const firstComment = safeText(publishArtifact.first_comment);
  const quality_gate = {
    title_count: hydratedTitles.length,
    body_char_count: body.length,
    comment_prompt_count: firstComment.length > 0 ? 1 : 0,
    interaction_question_count: interactionQuestions.length,
    actionable_step_count: Array.from(body.matchAll(/先|再|最后|第[0-9一二三四五六七八九十]/g)).length,
    hashtag_count: hashtags.length,
    banned_terms_hit_count: 0,
    meta_instruction_leak_count: 0,
    gate_pass: hydratedTitles.length >= 3 && body.length >= 80 && body.length <= 420,
  };
  const captionFile = path.join(deliverablePaths.reportsDir, `${deliverablePaths.deliverableId}-publish-copy.txt`);
  writeText(captionFile, [`标题候选：${hydratedTitles.join(' / ')}`, '', body, '', hashtags.join(' ')].join('\n'));
  return {
    ...attachCommon('publish_copy', contract),
    creative_execution: creativeExecution('publish_copy'),
    status: quality_gate.gate_pass ? 'pass' : 'block',
    publish_copy: {
      titles: hydratedTitles,
      body,
      first_comment: firstComment,
      interaction_questions: interactionQuestions,
      hashtags,
      publish_suggestion: {
        cover_slide_id: render?.html_bundle?.slides?.[0]?.slide_id || 'N01',
        recommended_time: safeText(publishArtifact.publish_suggestion?.recommended_time),
      },
      quality_gate,
      caption_file: captionFile,
      creative_sources: {
        titles: creativeSourceStamp({
          route: 'publish_copy',
          lifecycleStage: 'delivery_packaging',
          authoredSurface: 'titles',
          materializedFrom: 'prompt_pack_artifact',
        }),
        body: creativeSourceStamp({
          route: 'publish_copy',
          lifecycleStage: 'delivery_packaging',
          authoredSurface: 'body',
          materializedFrom: 'prompt_pack_artifact',
        }),
        first_comment: creativeSourceStamp({
          route: 'publish_copy',
          lifecycleStage: 'delivery_packaging',
          authoredSurface: 'first_comment',
          materializedFrom: 'prompt_pack_artifact',
        }),
      },
      creative_authorship: {
        titles: creativeSourceStamp({
          route: 'publish_copy',
          lifecycleStage: 'delivery_packaging',
          authoredSurface: 'titles',
          materializedFrom: 'prompt_pack_artifact',
        }),
        body: creativeSourceStamp({
          route: 'publish_copy',
          lifecycleStage: 'delivery_packaging',
          authoredSurface: 'body',
          materializedFrom: 'prompt_pack_artifact',
        }),
        first_comment: creativeSourceStamp({
          route: 'publish_copy',
          lifecycleStage: 'delivery_packaging',
          authoredSurface: 'first_comment',
          materializedFrom: 'prompt_pack_artifact',
        }),
      },
    },
    artifact_refs: [captionFile],
    review_state_patch: {
      current_status: quality_gate.gate_pass ? 'publish_ready' : 'blocked_for_revision',
      ready_for_export: quality_gate.gate_pass,
      latest_review_stage: 'publish_copy',
      latest_checks: {
        platform_copy_complete: quality_gate.gate_pass,
        cta_clear: quality_gate.interaction_question_count >= 1,
      },
      pending_reviews: quality_gate.gate_pass ? [] : ['platform_copy_complete'],
      blocking_reasons: quality_gate.gate_pass ? [] : ['platform_copy_complete'],
      rerun_from_stage: quality_gate.gate_pass ? null : 'publish_copy',
      rerun_policy: {
        status: quality_gate.gate_pass ? 'idle' : 'rerun_required',
        rerun_from_stage: quality_gate.gate_pass ? null : 'publish_copy',
      },
    },
  };
}

function buildExportBundle(workspaceRoot, topicId, contract, deliverablePaths) {
  const render = readStageArtifact(contract, deliverablePaths, 'render_html');
  const review = readStageArtifact(contract, deliverablePaths, 'screenshot_review');
  const copy = readStageArtifact(contract, deliverablePaths, 'publish_copy');
  const pngFiles = safeArray(review?.slide_reviews).map((slide) => slide.screenshot_file);
  const manifestFile = path.join(deliverablePaths.reportsDir, `${deliverablePaths.deliverableId}-publish-manifest.json`);
  const exportBundle = {
    html_file: render.html_bundle.html_file,
    png_files: pngFiles,
    caption_file: copy.publish_copy.caption_file,
    publish_manifest_file: manifestFile,
    delivery_state: {
      current: 'output_ready',
      next: 'published_pending_human',
    },
  };
  writeJson(manifestFile, exportBundle);
  return {
    ...attachCommon('export_bundle', contract),
    status: 'completed',
    export_bundle: exportBundle,
    series_surfaces: computeSeriesSurfaces(contract, deliverablePaths, exportBundle),
    artifact_refs: [manifestFile, render.html_bundle.html_file, copy.publish_copy.caption_file, ...pngFiles].filter(Boolean),
    review_state_patch: {
      current_status: 'publish_ready',
      ready_for_export: true,
      latest_review_stage: 'export_bundle',
      latest_checks: {
        platform_copy_complete: true,
        cta_clear: true,
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

export function canRunXiaohongshu(contract) {
  return contract?.deliverable_kind === 'xiaohongshu_note';
}

/**
 * @param {XhsRuntimeRunRequest} request
 * @returns {Promise<XhsRuntimeRouteResult>}
 */
export async function runXiaohongshuRoute({ workspaceRoot, topicId, deliverableId, route, contract, mode = 'draft_new', baselineDeliverableId = '' }) {
  const { deliverablePaths } = ensurePrerequisites({ workspaceRoot, topicId, deliverableId, route, mode, baselineDeliverableId });
  const stageContract = safeArray(contract?.stage_sequence?.stages).find((stage) => stage?.stage_id === route) || null;
  const sourceTruthConsumptionRole = ROUTE_TO_SOURCE_TRUTH_CONSUMPTION_ROLE[route] || '';
  const payload = await (async () => {
  switch (route) {
    case 'research':
      return buildResearch(contract);
    case 'storyline':
      return buildStoryline(contract, deliverablePaths);
    case 'single_note_plan':
      return buildSingleNotePlan(contract, deliverablePaths);
    case 'visual_direction':
      return buildXhsVisualDirection(contract, deliverablePaths, mode, baselineDeliverableId, {
        attachCommon,
        safeText,
        safeArray,
        promptSeed,
        readStageArtifact,
        sourceConfidence,
        inferMemoryHook,
      });
    case 'render_html':
      return await buildXhsRenderHtml(contract, deliverablePaths, {
        readStageArtifact,
        promptArtifact,
        renderContract,
        safeText,
        safeArray,
        attachCommon,
        CANVAS,
        resolvePromptPackAsset,
        readPromptPackText,
        writeText,
        path,
      });
    case 'visual_director_review':
      return buildDirectorReview(contract, deliverablePaths);
    case 'screenshot_review':
      return buildScreenshotReview(workspaceRoot, topicId, contract, deliverablePaths, mode, baselineDeliverableId);
    case 'publish_copy':
      return buildPublishCopy(contract, deliverablePaths);
    case 'export_bundle':
      return buildExportBundle(workspaceRoot, topicId, contract, deliverablePaths);
    default:
      throw new Error(`Unsupported xiaohongshu route: ${route}`);
  }
  })();
  return {
    overlay: contract.overlay,
    route,
    topic_id: topicId,
    deliverable_id: deliverableId,
    contract,
    stage_contract: stageContract,
    ...payload,
    ...(sourceTruthConsumptionRole
      ? {
          source_truth_consumption: buildSourceTruthConsumptionSummary(contract.shared_source_truth, {
            consumptionRole: sourceTruthConsumptionRole,
            defaultSourceLabels: sourceLabels(contract),
          }),
        }
      : {}),
  };
}
