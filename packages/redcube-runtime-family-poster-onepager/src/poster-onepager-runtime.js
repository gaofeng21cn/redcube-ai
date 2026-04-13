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
import { buildCodexExecutionModel } from '@redcube/hermes-substrate';
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
const CODEX_EXECUTION_MODEL = Object.freeze(buildCodexExecutionModel());
const CREATIVE_MATERIALIZED_FROM = 'codex_cli_json_output';
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

function creativeExecution(lifecycleStage, generationRuntime = null) {
  return {
    owner: 'host_agent',
    primary_surface: 'codex_native_host_agent',
    lifecycle_stage: lifecycleStage,
    ownership_model: 'director_first',
    ...(generationRuntime
      ? {
          generation_runtime: generationRuntime,
        }
      : {}),
  };
}

function creativeSourceStamp({ route, lifecycleStage, authoredSurface, materializedFrom = 'prompt_pack_seed' }) {
  return {
    owner: 'host_agent',
    primary_surface: 'codex_native_host_agent',
    stage_owner: 'codex_native_host_agent',
    route,
    lifecycle_stage: lifecycleStage,
    authored_surface: authoredSurface,
    materialized_from: materializedFrom,
  };
}

function reviewAuthorship(overlay) {
  return {
    overlay,
    primary_surface: 'codex_native_host_agent',
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
    execution_model: CODEX_EXECUTION_MODEL,
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

function summarizePanels(slide) {
  return safeArray(slide?.panels).map((panel) => ({
    panel_id: safeText(panel?.panel_id),
    region: safeText(panel?.region),
    label: safeText(panel?.label),
    text: safeText(panel?.text),
    support_points: safeArray(panel?.support_points),
  }));
}

function buildAuthoringContext(contract) {
  return {
    title: safeText(contract.title),
    delivery_goal: safeText(contract.goal),
    profile_id: contract.profile_id,
    topic_summary: sourceTopicSummary(contract),
    ready_sources: sourceLabels(contract),
    evidence_excerpts: sourceMaterials(contract)
      .slice(0, 4)
      .map((material) => ({
        material_id: material.material_id,
        source_id: material.source_id,
        excerpt: extractAudienceFacingSnippet(material.content_text || material.excerpt, 220),
      }))
      .filter((item) => item.excerpt),
    source_truth: {
      input_mode: safeText(sourceTruth(contract)?.source_brief?.input_mode, 'seed_only'),
      confidence: safeText(sourceTruth(contract)?.source_brief?.confidence, 'low'),
      material_ids: sourceMaterialIds(contract),
    },
    operator_playbook: operatorMaterials(contract)
      .slice(0, 6)
      .map((material) => ({
        source_id: material.source_id,
        excerpt: extractAudienceFacingSnippet(material.content_text || material.excerpt, 220),
      }))
      .filter((item) => item.excerpt),
    authoring_guardrails: [
      'delivery_goal 和制作要求不能原样写进海报 headline、panel 文案或 review_summary。',
      '不要把内部工作流、模板说明、系统指令、隐藏审核口径写进读者可见内容。',
      'operator_playbook 只作为制作约束，不得被改写成海报 headline、panel 文案、来源标签或审阅总结。',
      '如果共享事实层不足，只能做保守表达，不得编造医学结论、效果承诺或伪来源。',
      '海报必须是 AI 直接创作内容，不得退化成固定模板编译或 slot 填空产物。',
    ],
  };
}

function storylineOutputContract() {
  return {
    headline: '<string>',
    subheadline: '<string>',
    audience_judgement: '<string>',
    why_now: '<string>',
    proof_promise: '<string>',
    call_to_action: '<string>',
  };
}

function posterBlueprintOutputContract() {
  return {
    render_recipe_id: 'poster.evidence_columns',
    headline: '<string>',
    subheadline: '<string>',
    anchor_tracks: ['<string>', '<string>', '<string>'],
    panels: [
      {
        panel_id: 'hero',
        region: 'hero_band',
        label: '<string>',
        text: '<string>',
        support_points: ['<string>', '<string>'],
      },
    ],
  };
}

function visualDirectionOutputContract() {
  return {
    visual_manifest: '<string>',
    poster_motif: '<string>',
    peak_region: 'hero_band',
    panel_emphasis: {
      hero_band: '<string>',
      evidence_columns: '<string>',
      pathway_strip: '<string>',
      action_footer: '<string>',
    },
    page_family_ceiling: {
      hero_band: 1,
      evidence_columns: 1,
      pathway_strip: 1,
      action_footer: 1,
    },
    anti_template_constraints: ['<string>', '<string>'],
    forbidden_regressions: ['<string>', '<string>'],
    final_instruction_to_html_generator: ['<string>', '<string>'],
    palette: {
      paper: '#FFF9F1',
      ink: '#0F172A',
      accent: '#1D4ED8',
      highlight: '#F97316',
    },
  };
}

function renderHtmlOutputContract() {
  return {
    slides: [
      {
        slide_id: 'P01',
        content_html: '<section data-slide-root=\"true\" data-slide-id=\"P01\">...</section>',
      },
    ],
    render_summary: ['<string>', '<string>'],
  };
}

function directorReviewOutputContract() {
  return {
    director_intent_landed: true,
    anti_template_ok: true,
    message_hierarchy_clear: true,
    evidence_trace_clear: true,
    weak_regions: ['hero_band'],
    rewrite_action: 'none | revise_render_html',
    review_summary: '<string>',
  };
}

function normalizePanel(panel, index) {
  return {
    panel_id: requireText(panel?.panel_id, `poster_blueprint.panels[${index}].panel_id`),
    region: requireText(panel?.region, `poster_blueprint.panels[${index}].region`),
    label: requireText(panel?.label, `poster_blueprint.panels[${index}].label`),
    text: requireText(panel?.text, `poster_blueprint.panels[${index}].text`),
    support_points: normalizeStringList(
      panel?.support_points,
      `poster_blueprint.panels[${index}].support_points`,
      { min: 1, max: 4 },
    ),
  };
}

function normalizeInlineText(value, maxLength = 220) {
  return safeText(value).replace(/\s+/g, ' ').slice(0, maxLength);
}

function escapeHtml(text) {
  return String(text || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function escapeTemplate(text) {
  return String(text || '').replaceAll('\\', '\\\\').replaceAll('`', '\\`').replaceAll('${', '\\${');
}

function buildHtml({ title, slides, renderPlan, renderStrategy, shellText }) {
  const slidesLiteral = `\n[${slides.map((slide) => `\n  { slideId: '${slide.slide_id}', title: ${JSON.stringify(slide.title)}, recipeId: '${slide.recipe_id}', templateId: '${slide.template_id}', content: \`${escapeTemplate(slide.content)}\` }`).join(',')}\n]`;
  return shellText
    .replaceAll('__REDCUBE_TITLE__', escapeHtml(title))
    .replaceAll('__REDCUBE_RENDER_STRATEGY__', escapeHtml(renderStrategy.replaceAll('_', '-')))
    .replaceAll('__REDCUBE_RENDER_PLAN__', escapeHtml(JSON.stringify(renderPlan)))
    .replaceAll('__REDCUBE_SLIDES_DATA__', slidesLiteral);
}

function stripHtml(value) {
  return String(value || '').replace(/<[^>]+>/g, ' ');
}

function validateRenderedPosterHtml(content, slideId) {
  const html = requireText(content, `render_html.slides[${slideId}].content_html`);
  if (!/data-slide-root=(["'])true\1/.test(html)) {
    throw new Error(`poster render_html slide missing data-slide-root=true: ${slideId}`);
  }
  if (!new RegExp(`data-slide-id=(["'])${slideId}\\1`).test(html)) {
    throw new Error(`poster render_html slide missing matching data-slide-id: ${slideId}`);
  }
  if (/<script\b/i.test(html)) {
    throw new Error(`poster render_html slide contains forbidden script tag: ${slideId}`);
  }
  return html;
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

async function generateStorylineDraft(contract) {
  const { data, generationRuntime } = await generateStructuredArtifactViaCodexCli({
    family: 'poster_onepager',
    route: 'storyline',
    promptRelativePath: promptRoute(contract, 'storyline'),
    context: buildAuthoringContext(contract),
    outputContract: storylineOutputContract(),
  });
  return {
    authoredStoryline: {
      headline: requireText(data?.headline, 'storyline.headline'),
      subheadline: requireText(data?.subheadline, 'storyline.subheadline'),
      audience_judgement: requireText(data?.audience_judgement, 'storyline.audience_judgement'),
      why_now: requireText(data?.why_now, 'storyline.why_now'),
      proof_promise: requireText(data?.proof_promise, 'storyline.proof_promise'),
      call_to_action: requireText(data?.call_to_action, 'storyline.call_to_action'),
    },
    generationRuntime,
  };
}

async function buildStoryline(contract) {
  const { authoredStoryline, generationRuntime } = await generateStorylineDraft(contract);
  return {
    ...attachCommon('storyline', contract),
    creative_execution: creativeExecution(
      lifecycleStageForRoute(contract, 'storyline') || 'story_architecture',
      generationRuntime,
    ),
    storyline: {
      ...authoredStoryline,
      source_truth_material_ids: sourceMaterialIds(contract),
      creative_sources: {
        headline: creativeSourceStamp({
          route: 'storyline',
          lifecycleStage: 'story_architecture',
          authoredSurface: 'headline',
          materializedFrom: CREATIVE_MATERIALIZED_FROM,
        }),
        proof_promise: creativeSourceStamp({
          route: 'storyline',
          lifecycleStage: 'story_architecture',
          authoredSurface: 'proof_promise',
          materializedFrom: CREATIVE_MATERIALIZED_FROM,
        }),
      },
    },
  };
}

function buildPosterBlueprintContext(contract, storylineArtifact) {
  return {
    ...buildAuthoringContext(contract),
    storyline: {
      headline: safeText(storylineArtifact?.storyline?.headline),
      subheadline: safeText(storylineArtifact?.storyline?.subheadline),
      audience_judgement: safeText(storylineArtifact?.storyline?.audience_judgement),
      why_now: safeText(storylineArtifact?.storyline?.why_now),
      proof_promise: safeText(storylineArtifact?.storyline?.proof_promise),
      call_to_action: safeText(storylineArtifact?.storyline?.call_to_action),
    },
  };
}

async function generatePosterBlueprintDraft(contract, deliverablePaths) {
  const storylineArtifact = readStageArtifact(contract, deliverablePaths, 'storyline');
  const { data, generationRuntime } = await generateStructuredArtifactViaCodexCli({
    family: 'poster_onepager',
    route: 'poster_blueprint',
    promptRelativePath: promptRoute(contract, 'poster_blueprint'),
    context: buildPosterBlueprintContext(contract, storylineArtifact),
    outputContract: posterBlueprintOutputContract(),
  });
  return {
    storylineArtifact,
    authoredBlueprint: {
      render_recipe_id: requireText(data?.render_recipe_id, 'poster_blueprint.render_recipe_id'),
      headline: requireText(data?.headline, 'poster_blueprint.headline'),
      subheadline: requireText(data?.subheadline, 'poster_blueprint.subheadline'),
      anchor_tracks: normalizeStringList(data?.anchor_tracks, 'poster_blueprint.anchor_tracks', { min: 3, max: 6 }),
      panels: requireObjectArray(data?.panels, 'poster_blueprint.panels', { min: 4, max: 6 }).map(normalizePanel),
    },
    generationRuntime,
  };
}

async function buildPosterBlueprintArtifact(contract, deliverablePaths) {
  const { storylineArtifact, authoredBlueprint, generationRuntime } = await generatePosterBlueprintDraft(contract, deliverablePaths);
  const sources = sourceLabels(contract);
  const layoutFamily = safeText(
    authoredBlueprint.panels[1]?.region || authoredBlueprint.panels[0]?.region,
    'evidence_columns',
  );
  const majorBlueprintText = creativeSourceStamp({
    route: 'poster_blueprint',
    lifecycleStage: 'story_architecture',
    authoredSurface: 'major_blueprint_text',
    materializedFrom: CREATIVE_MATERIALIZED_FROM,
  });
  const recipeDecision = creativeSourceStamp({
    route: 'poster_blueprint',
    lifecycleStage: 'visual_authorship',
    authoredSurface: 'render_recipe_id',
    materializedFrom: CREATIVE_MATERIALIZED_FROM,
  });
  return {
    ...attachCommon('poster_blueprint', contract),
    creative_execution: creativeExecution(
      lifecycleStageForRoute(contract, 'poster_blueprint') || 'story_architecture',
      generationRuntime,
    ),
    lifecycle_stage: lifecycleStageForRoute(contract, 'poster_blueprint') || 'story_architecture',
    poster_blueprint: {
      headline: authoredBlueprint.headline,
      subheadline: authoredBlueprint.subheadline,
      render_recipe_id: authoredBlueprint.render_recipe_id,
      slides: [
        {
          slide_id: 'P01',
          slide_no: 1,
          title: authoredBlueprint.headline,
          layout_family: layoutFamily,
          render_recipe_id: authoredBlueprint.render_recipe_id,
          page_goal: safeText(contract.goal),
          headline: authoredBlueprint.headline,
          subheadline: authoredBlueprint.subheadline,
          audience_judgement: safeText(storylineArtifact?.storyline?.audience_judgement),
          why_now: safeText(storylineArtifact?.storyline?.why_now),
          proof_promise: safeText(storylineArtifact?.storyline?.proof_promise),
          call_to_action: safeText(storylineArtifact?.storyline?.call_to_action),
          panels: authoredBlueprint.panels,
          evidence_and_sources: sources.slice(0, 2).map((source, sourceIndex) => ({
            source_id: `SRC-${sourceIndex + 1}`,
            public_label: source,
          })),
          visual_presentation: {
            layout_family: layoutFamily,
            anchor_tracks: authoredBlueprint.anchor_tracks,
            canvas: CANVAS,
          },
          creative_sources: {
            major_blueprint_text: majorBlueprintText,
            render_recipe_id: recipeDecision,
          },
          creative_authorship: {
            major_blueprint_text: majorBlueprintText,
            render_recipe_id: recipeDecision,
          },
        },
      ],
      quality_guards: {
        require_visual_direction_before_html: true,
        forbid_template_route_tokens: BANNED_RENDER_TOKENS,
        canvas: CANVAS,
      },
    },
  };
}

function buildVisualDirectionContext(contract, storylineArtifact, blueprintArtifact) {
  return {
    ...buildAuthoringContext(contract),
    storyline: {
      headline: safeText(storylineArtifact?.storyline?.headline),
      subheadline: safeText(storylineArtifact?.storyline?.subheadline),
      audience_judgement: safeText(storylineArtifact?.storyline?.audience_judgement),
      why_now: safeText(storylineArtifact?.storyline?.why_now),
      proof_promise: safeText(storylineArtifact?.storyline?.proof_promise),
      call_to_action: safeText(storylineArtifact?.storyline?.call_to_action),
    },
    blueprint: {
      headline: safeText(blueprintArtifact?.poster_blueprint?.headline),
      subheadline: safeText(blueprintArtifact?.poster_blueprint?.subheadline),
      render_recipe_id: safeText(blueprintArtifact?.poster_blueprint?.render_recipe_id),
      slides: safeArray(blueprintArtifact?.poster_blueprint?.slides).map((slide) => ({
        slide_id: slide.slide_id,
        title: slide.title,
        layout_family: slide.layout_family,
        render_recipe_id: slide.render_recipe_id,
        anchor_tracks: safeArray(slide?.visual_presentation?.anchor_tracks),
        panels: summarizePanels(slide),
      })),
    },
  };
}

async function generateVisualDirectionDraft(contract, deliverablePaths) {
  const storylineArtifact = readStageArtifact(contract, deliverablePaths, 'storyline');
  const blueprintArtifact = readStageArtifact(contract, deliverablePaths, 'poster_blueprint');
  const { data, generationRuntime } = await generateStructuredArtifactViaCodexCli({
    family: 'poster_onepager',
    route: 'visual_direction',
    promptRelativePath: promptRoute(contract, 'visual_direction'),
    context: buildVisualDirectionContext(contract, storylineArtifact, blueprintArtifact),
    outputContract: visualDirectionOutputContract(),
  });
  return {
    blueprintArtifact,
    authoredVisualDirection: {
      visual_manifest: requireText(data?.visual_manifest, 'visual_direction.visual_manifest'),
      poster_motif: requireText(data?.poster_motif, 'visual_direction.poster_motif'),
      peak_region: requireText(data?.peak_region, 'visual_direction.peak_region'),
      panel_emphasis: data?.panel_emphasis && typeof data.panel_emphasis === 'object'
        ? data.panel_emphasis
        : (() => {
            throw new Error('Missing visual_direction.panel_emphasis in upstream poster generation output');
          })(),
      page_family_ceiling: data?.page_family_ceiling && typeof data.page_family_ceiling === 'object'
        ? data.page_family_ceiling
        : (() => {
            throw new Error('Missing visual_direction.page_family_ceiling in upstream poster generation output');
          })(),
      anti_template_constraints: normalizeStringList(
        data?.anti_template_constraints,
        'visual_direction.anti_template_constraints',
        { min: 2, max: 6 },
      ),
      forbidden_regressions: normalizeStringList(
        data?.forbidden_regressions,
        'visual_direction.forbidden_regressions',
        { min: 2, max: 6 },
      ),
      final_instruction_to_html_generator: normalizeStringList(
        data?.final_instruction_to_html_generator,
        'visual_direction.final_instruction_to_html_generator',
        { min: 2, max: 6 },
      ),
      palette: data?.palette && typeof data.palette === 'object'
        ? data.palette
        : (() => {
            throw new Error('Missing visual_direction.palette in upstream poster generation output');
          })(),
    },
    generationRuntime,
  };
}

async function buildPosterVisualDirectionArtifact(contract, deliverablePaths, mode, baselineDeliverableId) {
  const { blueprintArtifact, authoredVisualDirection, generationRuntime } = await generateVisualDirectionDraft(contract, deliverablePaths);
  const visualManifest = creativeSourceStamp({
    route: 'visual_direction',
    lifecycleStage: 'visual_authorship',
    authoredSurface: 'visual_manifest',
    materializedFrom: CREATIVE_MATERIALIZED_FROM,
  });
  const posterMotif = creativeSourceStamp({
    route: 'visual_direction',
    lifecycleStage: 'visual_authorship',
    authoredSurface: 'poster_motif',
    materializedFrom: CREATIVE_MATERIALIZED_FROM,
  });
  const pageFamilyCeiling = creativeSourceStamp({
    route: 'visual_direction',
    lifecycleStage: 'visual_authorship',
    authoredSurface: 'page_family_ceiling',
    materializedFrom: CREATIVE_MATERIALIZED_FROM,
  });
  return {
    ...attachCommon('visual_direction', contract),
    creative_execution: creativeExecution(
      lifecycleStageForRoute(contract, 'visual_direction') || 'visual_authorship',
      generationRuntime,
    ),
    lifecycle_stage: lifecycleStageForRoute(contract, 'visual_direction') || 'visual_authorship',
    mode,
    visual_direction: {
      ...authoredVisualDirection,
      baseline_deliverable_id: mode === 'optimize_existing' ? safeText(baselineDeliverableId) || null : null,
      creative_sources: {
        visual_manifest: visualManifest,
        poster_motif: posterMotif,
        page_family_ceiling: pageFamilyCeiling,
      },
      creative_authorship: {
        visual_manifest: visualManifest,
        poster_motif: posterMotif,
        page_family_ceiling: pageFamilyCeiling,
      },
      blueprint_slide_count: safeArray(blueprintArtifact?.poster_blueprint?.slides).length,
    },
  };
}

function renderContract(contract) {
  return contract?.prompt_pack?.render_contract || {};
}

async function generateRenderHtmlDraft(contract, deliverablePaths) {
  const blueprintArtifact = readStageArtifact(contract, deliverablePaths, 'poster_blueprint');
  const visualArtifact = readStageArtifact(contract, deliverablePaths, 'visual_direction');
  const { data, generationRuntime } = await generateStructuredArtifactViaCodexCli({
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
        '不要使用 renderSlide/layoutByType/cardsGrid/pageType，也不要把模板注册表或内部文档写入 HTML。',
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

async function buildRenderHtmlArtifact({ deliverableId, contract, deliverablePaths }) {
  const { blueprintArtifact, visualArtifact, data, generationRuntime } = await generateRenderHtmlDraft(contract, deliverablePaths);
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
    const content = slideHtmlById.get(slide.slide_id);
    if (!content) {
      throw new Error(`upstream poster render_html missing slide: ${slide.slide_id}`);
    }
    const recipeDecision = creativeSourceStamp({
      route: 'render_html',
      lifecycleStage: 'visual_authorship',
      authoredSurface: 'recipe_selection',
      materializedFrom: CREATIVE_MATERIALIZED_FROM,
    });
    const finalMarkup = creativeSourceStamp({
      route: 'render_html',
      lifecycleStage: 'visual_authorship',
      authoredSurface: 'final_html_markup',
      materializedFrom: CREATIVE_MATERIALIZED_FROM,
    });
    return {
      slide_id: slide.slide_id,
      title: slide.title,
      layout_family: slide.layout_family,
      recipe_id: slide.render_recipe_id,
      template_id: 'upstream_ai_html',
      director_contract: {
        peak_region: safeText(visualArtifact?.visual_direction?.peak_region, 'hero_band'),
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
  const htmlFile = path.join(deliverablePaths.viewsDir, `${deliverableId}.html`);
  const slidesFile = path.join(deliverablePaths.viewsDir, `${deliverableId}.slides.json`);
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
    ...attachCommon('render_html', contract),
    creative_execution: creativeExecution(
      lifecycleStageForRoute(contract, 'render_html') || 'visual_authorship',
      generationRuntime,
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
    artifact_refs: [htmlFile, slidesFile],
  };
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

async function generateDirectorReviewDraft(contract, deliverablePaths) {
  const storylineArtifact = readStageArtifact(contract, deliverablePaths, 'storyline');
  const blueprintArtifact = readStageArtifact(contract, deliverablePaths, 'poster_blueprint');
  const visualArtifact = readStageArtifact(contract, deliverablePaths, 'visual_direction');
  const renderArtifact = readStageArtifact(contract, deliverablePaths, 'render_html');
  const { data, generationRuntime } = await generateStructuredArtifactViaCodexCli({
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

async function buildDirectorReview(contract, deliverablePaths) {
  const { data, generationRuntime } = await generateDirectorReviewDraft(contract, deliverablePaths);
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
  writeText(reviewFile, [
    '# 视觉总监复盘',
    '',
    '- review_owner: codex_native_host_agent',
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
    ...attachCommon('visual_director_review', contract),
    review_overlay: 'visual_director_review',
    review_authorship: reviewAuthorship('visual_director_review'),
    review_execution: {
      ...creativeExecution('visual_director_review', generationRuntime),
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
      payload = await buildStoryline(contract);
      break;
    case 'poster_blueprint':
      payload = await buildPosterBlueprintArtifact(contract, deliverablePaths);
      break;
    case 'visual_direction':
      payload = await buildPosterVisualDirectionArtifact(contract, deliverablePaths, mode, baselineDeliverableId);
      break;
    case 'render_html':
      payload = await buildRenderHtmlArtifact({ deliverableId, contract, deliverablePaths });
      break;
    case 'visual_director_review':
      payload = await buildDirectorReview(contract, deliverablePaths);
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
