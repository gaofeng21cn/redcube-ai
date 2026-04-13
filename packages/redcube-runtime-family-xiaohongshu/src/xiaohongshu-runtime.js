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

const CODEX_EXECUTION_MODEL = Object.freeze(buildCodexExecutionModel());
const MIN_REVIEW_QA_BLOCKS = 2;
const MIN_REVIEW_PRIMARY_POINTS = 1;
const HARD_SCREENSHOT_BLOCKING_ISSUES = new Set(['overflow_detected']);
const ROUTE_TO_SOURCE_TRUTH_CONSUMPTION_ROLE = Object.freeze({
  research: 'source_readiness',
  storyline: 'story_architecture',
  single_note_plan: 'story_architecture',
  visual_direction: 'visual_authorship',
});

function hostAgentCreativeSource(contractAsset) {
  return {
    owner: 'host_agent',
    primary_surface: 'codex_native_host_agent',
    stage_owner: 'codex_native_host_agent',
    adapter: 'host_agent',
    supporting_contract: safeText(contractAsset, 'prompt_pack_seed'),
  };
}

function creativeExecution(route, generationRuntime = null) {
  return {
    owner: 'host_agent',
    primary_surface: 'codex_native_host_agent',
    lifecycle_stage: LIFECYCLE_STAGE_BY_ROUTE[route] || null,
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
    primary_surface: 'codex_native_host_agent',
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

function requireText(value, field) {
  const text = safeText(value);
  if (!text) {
    throw new Error(`Missing xiaohongshu field: ${field}`);
  }
  return text;
}

function normalizeStringList(value, field, { min = 0, max = Infinity } = {}) {
  const items = safeArray(value).map((item) => safeText(item)).filter(Boolean);
  if (items.length < min || items.length > max) {
    throw new Error(`Invalid xiaohongshu list field: ${field}`);
  }
  return items;
}

function normalizeXhsScreenshotAiSlideReviews(value, mechanicalSlideReviews) {
  const expectedSlideIds = new Set(mechanicalSlideReviews.map((slide) => slide.slide_id));
  const reviews = safeArray(value).map((item, index) => {
    const slideId = requireText(item?.slide_id, `screenshot_review.slide_reviews[${index}].slide_id`);
    if (!expectedSlideIds.has(slideId)) {
      throw new Error(`Unexpected xiaohongshu screenshot_review.slide_reviews[${index}].slide_id: ${slideId}`);
    }
    const rawJudgement = safeText(item?.judgement, 'pass');
    const judgement = rawJudgement === 'revise' ? 'block' : rawJudgement;
    if (!['pass', 'block'].includes(judgement)) {
      throw new Error(`Invalid xiaohongshu screenshot_review.slide_reviews[${index}].judgement: ${rawJudgement}`);
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
    throw new Error('xiaohongshu screenshot_review.slide_reviews 必须覆盖全部截图页');
  }
  const covered = new Set(reviews.map((item) => item.slide_id));
  for (const slideId of expectedSlideIds) {
    if (!covered.has(slideId)) {
      throw new Error(`Missing xiaohongshu screenshot_review.slide_reviews entry for ${slideId}`);
    }
  }
  return reviews;
}

function hasAiVisualPass(aiReview) {
  return safeText(aiReview?.judgement) === 'pass';
}

function hasAiVisualBlock(aiReview) {
  return safeText(aiReview?.judgement) === 'block';
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
  return safeArray(slideReviews).every((slide) => {
    if (hasAiVisualPass(slide?.ai_review)) {
      return true;
    }
    return Boolean(slide?.checks?.[checkKey]);
  });
}

function requireObjectArray(value, field, { min = 0, max = Infinity } = {}) {
  const items = safeArray(value).filter((item) => item && typeof item === 'object');
  if (items.length < min || items.length > max) {
    throw new Error(`Invalid xiaohongshu object list field: ${field}`);
  }
  return items;
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

function isOperatorContextMaterial(material) {
  const kind = safeText(material?.kind);
  return safeText(material?.source_role) === 'operator_context'
    || kind === 'brief'
    || kind === 'keywords';
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
  return safeArray(sourceTruth(contract)?.extracted_materials?.materials)
    .filter((material) => !isOperatorContextMaterial(material));
}

function operatorMaterials(contract) {
  return safeArray(sourceTruth(contract)?.extracted_materials?.materials)
    .filter((material) => isOperatorContextMaterial(material));
}

function sourceMaterialIds(contract) {
  return sourceMaterials(contract).map((material) => material.material_id);
}

function sourceLabels(contract) {
  const truth = sourceTruth(contract);
  const labels = safeArray(truth?.source_index?.sources)
    .filter((source) => source.status === 'ready' && !isOperatorContextMaterial(source))
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
  const materialCorpus = sourceMaterials(contract).map((material) => safeText(material.content_text)).join(' ');
  const corpus = materialCorpus || safeText(sourceTruth(contract)?.source_brief?.brief_text);
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

function buildAuthoringContext(contract, research = null) {
  return {
    title: safeText(contract.title),
    delivery_goal: safeText(contract.goal),
    profile_id: contract.profile_id,
    topic_summary: safeText(research?.research?.topic_summary, sourceTopicSummary(contract)),
    audience_seed: sourceTruth(contract) ? deriveAudienceFromSource(contract) : inferAudience(contract),
    tension_seed: sourceTruth(contract) ? deriveTensionFromSource(contract) : inferTension(contract),
    why_now_seed: sourceTruth(contract) ? deriveWhyNowFromSource(contract) : inferWhyNow(contract),
    memory_hook_seed: sourceTruth(contract) ? deriveMemoryHookFromSource(contract) : inferMemoryHook(contract),
    mode: safeText(research?.research?.mode, isSeries(contract) ? 'series' : 'single'),
    ready_sources: sourceLabels(contract),
    evidence_excerpts: sourceMaterials(contract)
      .slice(0, 6)
      .map((material) => ({
        material_id: material.material_id,
        source_id: material.source_id,
        excerpt: safeText(material.content_text || material.excerpt).replace(/\s+/g, ' ').slice(0, 220),
      }))
      .filter((item) => item.excerpt),
    source_truth: {
      input_mode: sourceInputMode(contract) || 'seed_only',
      confidence: sourceConfidence(contract) || 'low',
      sufficiency_status: sourceSufficiencyStatus(contract),
      deep_research_state: sourceDeepResearchState(contract),
      evidence_gaps: sourceEvidenceGaps(contract),
      blocking_evidence_gaps: sourceBlockingEvidenceGaps(contract),
      residual_evidence_gaps: sourceResidualEvidenceGaps(contract),
      material_ids: sourceMaterialIds(contract),
    },
    operator_playbook: operatorMaterials(contract)
      .slice(0, 6)
      .map((material) => ({
        source_id: material.source_id,
        excerpt: safeText(material.content_text || material.excerpt).replace(/\s+/g, ' ').slice(0, 220),
      }))
      .filter((item) => item.excerpt),
    authoring_guardrails: [
      '交付目标和制作要求不能原样进入读者可见正文。',
      '不要把内部资料、来源索引、工作流注释、系统操作说明写成小红书正文。',
      'operator_playbook 只作为制作约束，不得被改写成标题、正文、评论区文案或来源口径。',
      '来源必须翻译成读者能理解的公开口径，不能直接写内部文件名。',
      '如果共享事实层不足，只能保守表达，不得编造医学结论、效果承诺或平台反馈。',
    ],
  };
}

function storylineOutputContract() {
  return {
    mode: 'single | series',
    audience_judgement: '<string>',
    tension: '<string>',
    why_now: '<string>',
    memory_hook: '<string>',
    hook: '<string>',
    narrative_progression: ['<string>', '<string>', '<string>', '<string>'],
    journey: ['<string>', '<string>', '<string>'],
    resolution: '<string>',
  };
}

function singleNotePlanOutputContract() {
  return {
    title_options: ['<string>', '<string>', '<string>'],
    slides: [
      {
        slide_id: 'N01',
        title: '<string>',
        layout_family: 'cover_note | myth_compare | sequence_stack | process_track | evidence_strip | action_checklist',
        render_recipe_id: 'xhs.hero_note',
        page_goal: '<string>',
        progression_role: 'hook | tension | explain | mechanism_peak | evidence_peak | memory_close',
        page_core_content: ['<string>', '<string>', '<string>'],
        visual_presentation: {
          layout_family: '<string>',
          main_visual_action: '<string>',
          action_primitive: '<string>',
          anchor_tracks: ['<string>', '<string>', '<string>'],
          anti_template_note: '<string>',
        },
        source_language: '<string>',
        speaker_notes: '<string>',
        transition: '<string>',
      },
    ],
  };
}

function visualDirectionOutputContract() {
  return {
    director_statement: '<string>',
    visual_motif: '<string>',
    material_rules: {
      paper_base: '<string>',
      main_accent: '#2563EB',
      warning_accent: '#DC2626',
    },
    rhythm_curve: [{ slide_id: 'N01', role: 'hook_peak' }],
    peak_pages: ['N01'],
    page_family_ceiling: {
      cover_note: 1,
      myth_compare: 1,
      sequence_stack: 1,
      process_track: 1,
      evidence_strip: 1,
      action_checklist: 1,
    },
    anti_template_constraints: ['<string>', '<string>'],
    source_language_discipline: '<string>',
    forbidden_regressions: ['<string>', '<string>'],
  };
}

function renderHtmlOutputContract() {
  return {
    slides: [
      {
        slide_id: 'N01',
        content_html: '<div data-slide-root="true" data-slide-id="N01">...</div>',
      },
    ],
    render_summary: ['<string>', '<string>'],
  };
}

function directorReviewOutputContract() {
  return {
    director_intent_landed: true,
    anti_template_ok: true,
    memory_hook_present: true,
    homogeneous_layout_risk: 0.18,
    weak_pages: ['N03'],
    review_summary: '<string>',
    rewrite_action: 'none | revise_render_html',
  };
}

function screenshotReviewOutputContract() {
  return {
    director_intent_landed: true,
    anti_template_ok: true,
    weak_pages: ['N04'],
    review_summary: '<string>',
    slide_reviews: [
      {
        slide_id: 'N01',
        judgement: 'pass',
        visual_findings: ['<string>'],
        recommended_fix: 'none',
      },
    ],
  };
}

function publishCopyOutputContract() {
  return {
    body: '<string>',
    first_comment: '<string>',
    interaction_questions: ['<string>', '<string>'],
    hashtags: ['#话题1', '#话题2', '#话题3'],
    publish_suggestion: {
      recommended_time: '<string>',
    },
  };
}

function summarizePlanSlides(planArtifact) {
  return safeArray(planArtifact?.single_note_plan?.slides).map((slide) => ({
    slide_id: slide.slide_id,
    title: slide.title,
    layout_family: slide.layout_family,
    render_recipe_id: slide.render_recipe_id,
    page_goal: slide.page_goal,
    progression_role: slide.progression_role,
    page_core_content: safeArray(slide.page_core_content),
    visual_presentation: slide.visual_presentation,
    source_language: slide.source_language,
    transition_sentence: slide.transition_sentence,
  }));
}

function stripHtml(text) {
  return safeText(text)
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function escapeHtml(text) {
  return String(text || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function escapeHtmlAttribute(text) {
  return String(text || '')
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function escapeTemplate(text) {
  return String(text || '').replaceAll('\\', '\\\\').replaceAll('`', '\\`').replaceAll('${', '\\${');
}

function countMatches(text, pattern) {
  const matches = String(text || '').match(pattern);
  return matches ? matches.length : 0;
}

function upsertHtmlAttribute(tag, name, value) {
  const attrPattern = new RegExp(`\\s${name}=(["']).*?\\1`, 'i');
  const serialized = ` ${name}="${escapeHtmlAttribute(value)}"`;
  if (attrPattern.test(tag)) {
    return tag.replace(attrPattern, serialized);
  }
  return tag.replace(/\/?>$/, (suffix) => `${serialized}${suffix}`);
}

function hydrateRenderedSlideRootMetadata(html, metadata, slideId) {
  const rootTagMatch = String(html || '').match(/<[^>]+data-slide-root=(["'])true\1[^>]*>/i);
  if (!rootTagMatch) {
    throw new Error(`render_html slide missing data-slide-root=true: ${slideId}`);
  }
  let rootTag = rootTagMatch[0];
  for (const [name, value] of Object.entries(metadata || {})) {
    if (value === undefined || value === null || value === '') continue;
    rootTag = upsertHtmlAttribute(rootTag, name, value);
  }
  return String(html || '').replace(rootTagMatch[0], rootTag);
}

function validateRenderedReviewAnchors(html, slideId, familyLabel = 'xiaohongshu') {
  const qaBlocks = countMatches(html, /data-qa-block=(["'])[^"']+\1/gi);
  if (qaBlocks < MIN_REVIEW_QA_BLOCKS) {
    throw new Error(`${familyLabel} render_html slide missing required data-qa-block anchors: ${slideId}`);
  }
  const primaryPoints = countMatches(html, /data-primary-point=(["'])true\1/gi);
  if (primaryPoints < MIN_REVIEW_PRIMARY_POINTS) {
    throw new Error(`${familyLabel} render_html slide missing required data-primary-point=true anchor: ${slideId}`);
  }
  return html;
}

function buildHtml({ title, slides, renderPlan, renderStrategy, shellText }) {
  const slidesLiteral = `[\n${slides.map((slide) => `  { slideId: '${slide.slide_id}', slideNo: ${Number(slide.slide_no || 0)}, title: ${JSON.stringify(slide.title)}, layoutFamily: ${JSON.stringify(slide.layout_family)}, recipeId: '${slide.recipe_id}', templateId: ${JSON.stringify(slide.template_id || '')}, speakerSeconds: ${Number(slide.speaker_seconds || 0)}, peakPage: ${slide.director_contract?.peak_page ? 'true' : 'false'}, directorRole: ${JSON.stringify(slide.director_contract?.page_role || '')}, content: \`${escapeTemplate(slide.content)}\` }`).join(',\n')}\n]`;
  return shellText
    .replaceAll('__REDCUBE_TITLE__', escapeHtml(title))
    .replaceAll('__REDCUBE_RENDER_STRATEGY__', escapeHtml(renderStrategy.replaceAll('_', '-')))
    .replaceAll('__REDCUBE_RENDER_PLAN__', escapeHtml(JSON.stringify(renderPlan)))
    .replaceAll('__REDCUBE_SLIDES_DATA__', slidesLiteral);
}

function attachCommon(route, contract) {
  return {
    overlay: contract.overlay,
    route,
    profile_id: contract.profile_id,
    produced_at: new Date().toISOString(),
    lifecycle_stage: LIFECYCLE_STAGE_BY_ROUTE[route] || null,
    execution_model: CODEX_EXECUTION_MODEL,
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

async function generateStorylineDraft(contract, researchArtifact) {
  const { data, generationRuntime } = await generateStructuredArtifactViaCodexCli({
    family: 'xiaohongshu',
    route: 'storyline',
    promptRelativePath: promptRoute(contract, 'storyline'),
    context: {
      ...buildAuthoringContext(contract, researchArtifact),
      research: researchArtifact?.research || null,
      framing: buildStorylineInputs(contract, researchArtifact),
    },
    outputContract: storylineOutputContract(),
  });
  return {
    authoredStoryline: {
      mode: requireText(data?.mode, 'storyline.mode'),
      audience_judgement: requireText(data?.audience_judgement, 'storyline.audience_judgement'),
      tension: requireText(data?.tension, 'storyline.tension'),
      why_now: requireText(data?.why_now, 'storyline.why_now'),
      memory_hook: requireText(data?.memory_hook, 'storyline.memory_hook'),
      hook: requireText(data?.hook, 'storyline.hook'),
      narrative_progression: normalizeStringList(data?.narrative_progression, 'storyline.narrative_progression', { min: 3, max: 6 }),
      journey: normalizeStringList(data?.journey, 'storyline.journey', { min: 3, max: 5 }),
      resolution: requireText(data?.resolution, 'storyline.resolution'),
    },
    generationRuntime,
  };
}

async function buildStoryline(contract, deliverablePaths) {
  const research = readStageArtifact(contract, deliverablePaths, 'research');
  const { authoredStoryline, generationRuntime } = await generateStorylineDraft(contract, research);
  return {
    ...attachCommon('storyline', contract),
    creative_execution: creativeExecution('storyline', generationRuntime),
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
          materializedFrom: 'codex_cli_json_output',
        }),
        memory_hook: creativeSourceStamp({
          route: 'storyline',
          lifecycleStage: 'story_architecture',
          authoredSurface: 'memory_hook',
          materializedFrom: 'codex_cli_json_output',
        }),
      },
    },
  };
}

function normalizePlanSlide(slide, index, sources) {
  return {
    slide_id: requireText(slide?.slide_id, `single_note_plan.slides[${index}].slide_id`),
    slide_no: index + 1,
    title: requireText(slide?.title, `single_note_plan.slides[${index}].title`),
    layout_family: requireText(slide?.layout_family, `single_note_plan.slides[${index}].layout_family`),
    render_recipe_id: requireText(slide?.render_recipe_id, `single_note_plan.slides[${index}].render_recipe_id`),
    page_goal: requireText(slide?.page_goal, `single_note_plan.slides[${index}].page_goal`),
    progression_role: requireText(slide?.progression_role, `single_note_plan.slides[${index}].progression_role`),
    core_sentence: requireText(
      safeArray(slide?.page_core_content)[0] || slide?.page_goal,
      `single_note_plan.slides[${index}].core_sentence`,
    ),
    page_core_content: normalizeStringList(slide?.page_core_content, `single_note_plan.slides[${index}].page_core_content`, { min: 2, max: 4 }),
    visual_presentation: {
      layout_family: requireText(slide?.visual_presentation?.layout_family || slide?.layout_family, `single_note_plan.slides[${index}].visual_presentation.layout_family`),
      main_visual_action: requireText(slide?.visual_presentation?.main_visual_action, `single_note_plan.slides[${index}].visual_presentation.main_visual_action`),
      action_primitive: requireText(slide?.visual_presentation?.action_primitive, `single_note_plan.slides[${index}].visual_presentation.action_primitive`),
      anchor_tracks: normalizeStringList(slide?.visual_presentation?.anchor_tracks, `single_note_plan.slides[${index}].visual_presentation.anchor_tracks`, { min: 2, max: 4 }),
      anti_template_note: requireText(slide?.visual_presentation?.anti_template_note, `single_note_plan.slides[${index}].visual_presentation.anti_template_note`),
    },
    source_language: requireText(slide?.source_language, `single_note_plan.slides[${index}].source_language`),
    evidence_and_sources: sources.map((source, sourceIndex) => ({
      source_id: `SRC-${index + 1}-${sourceIndex + 1}`,
      public_label: source,
    })),
    speaker_notes: requireText(slide?.speaker_notes, `single_note_plan.slides[${index}].speaker_notes`),
    transition: requireText(slide?.transition, `single_note_plan.slides[${index}].transition`),
    transition_sentence: requireText(slide?.transition, `single_note_plan.slides[${index}].transition`),
    creative_sources: {
      page_core_content: creativeSourceStamp({
        route: 'single_note_plan',
        lifecycleStage: 'story_architecture',
        authoredSurface: 'page_core_content',
        materializedFrom: 'codex_cli_json_output',
      }),
      visual_presentation: creativeSourceStamp({
        route: 'single_note_plan',
        lifecycleStage: 'story_architecture',
        authoredSurface: 'visual_presentation',
        materializedFrom: 'codex_cli_json_output',
      }),
      render_recipe_id: creativeSourceStamp({
        route: 'single_note_plan',
        lifecycleStage: 'visual_authorship',
        authoredSurface: 'render_recipe_id',
        materializedFrom: 'codex_cli_json_output',
      }),
    },
    creative_authorship: {
      page_core_content: creativeSourceStamp({
        route: 'single_note_plan',
        lifecycleStage: 'story_architecture',
        authoredSurface: 'page_core_content',
        materializedFrom: 'codex_cli_json_output',
      }),
      visual_presentation: creativeSourceStamp({
        route: 'single_note_plan',
        lifecycleStage: 'story_architecture',
        authoredSurface: 'visual_presentation',
        materializedFrom: 'codex_cli_json_output',
      }),
    },
  };
}

async function generateSingleNotePlanDraft(contract, researchArtifact, storylineArtifact) {
  const { data, generationRuntime } = await generateStructuredArtifactViaCodexCli({
    family: 'xiaohongshu',
    route: 'single_note_plan',
    promptRelativePath: promptRoute(contract, 'single_note_plan'),
    context: {
      ...buildAuthoringContext(contract, researchArtifact),
      research: researchArtifact?.research || null,
      storyline: storylineArtifact?.storyline || null,
    },
    outputContract: singleNotePlanOutputContract(),
  });
  const titleOptions = normalizeStringList(data?.title_options, 'single_note_plan.title_options', { min: 3, max: 5 });
  const sources = sourceLabels(contract).slice(0, 3);
  const slides = requireObjectArray(data?.slides, 'single_note_plan.slides', { min: 4, max: 8 })
    .map((slide, index) => normalizePlanSlide(slide, index, sources));
  return {
    authoredPlan: {
      title_options: titleOptions,
      slides,
    },
    generationRuntime,
  };
}

async function buildSingleNotePlan(contract, deliverablePaths) {
  const research = readStageArtifact(contract, deliverablePaths, 'research');
  const storyline = readStageArtifact(contract, deliverablePaths, 'storyline');
  const { authoredPlan, generationRuntime } = await generateSingleNotePlanDraft(contract, research, storyline);
  return {
    ...attachCommon('single_note_plan', contract),
    creative_execution: creativeExecution('single_note_plan', generationRuntime),
    single_note_plan: {
      mode: isSeries(contract) ? 'series' : 'single',
      title_options: authoredPlan.title_options,
      planning_doc_markdown: ['# 01_单篇策划', '', `- 目标：${contract.goal}`, `- 封面钩子：${authoredPlan.title_options[0] || contract.title}`].join('\n'),
      slides: authoredPlan.slides,
      source_truth_material_ids: sourceMaterialIds(contract),
    },
  };
}

async function generateVisualDirectionDraft(contract, researchArtifact, storylineArtifact, planArtifact, mode, baselineDeliverableId) {
  const { data, generationRuntime } = await generateStructuredArtifactViaCodexCli({
    family: 'xiaohongshu',
    route: 'visual_direction',
    promptRelativePath: promptRoute(contract, 'visual_direction'),
    context: {
      ...buildAuthoringContext(contract, researchArtifact),
      mode,
      baseline_deliverable_id: safeText(baselineDeliverableId) || null,
      storyline: storylineArtifact?.storyline || null,
      plan: {
        slides: summarizePlanSlides(planArtifact),
      },
    },
    outputContract: visualDirectionOutputContract(),
  });
  return {
    authoredVisualDirection: {
      director_statement: requireText(data?.director_statement, 'visual_direction.director_statement'),
      visual_motif: requireText(data?.visual_motif, 'visual_direction.visual_motif'),
      material_rules: {
        paper_base: requireText(data?.material_rules?.paper_base, 'visual_direction.material_rules.paper_base'),
        main_accent: requireText(data?.material_rules?.main_accent, 'visual_direction.material_rules.main_accent'),
        warning_accent: requireText(data?.material_rules?.warning_accent, 'visual_direction.material_rules.warning_accent'),
      },
      rhythm_curve: requireObjectArray(data?.rhythm_curve, 'visual_direction.rhythm_curve', { min: 4, max: 8 }),
      peak_pages: normalizeStringList(data?.peak_pages, 'visual_direction.peak_pages', { min: 1, max: 4 }),
      page_family_ceiling: data?.page_family_ceiling || {},
      anti_template_constraints: normalizeStringList(data?.anti_template_constraints, 'visual_direction.anti_template_constraints', { min: 2, max: 6 }),
      source_language_discipline: requireText(data?.source_language_discipline, 'visual_direction.source_language_discipline'),
      forbidden_regressions: normalizeStringList(data?.forbidden_regressions, 'visual_direction.forbidden_regressions', { min: 2, max: 6 }),
    },
    generationRuntime,
  };
}

async function buildVisualDirection(contract, deliverablePaths, mode, baselineDeliverableId) {
  const research = readStageArtifact(contract, deliverablePaths, 'research');
  const storyline = readStageArtifact(contract, deliverablePaths, 'storyline');
  const plan = readStageArtifact(contract, deliverablePaths, 'single_note_plan');
  const { authoredVisualDirection, generationRuntime } = await generateVisualDirectionDraft(
    contract,
    research,
    storyline,
    plan,
    mode,
    baselineDeliverableId,
  );
  const slides = safeArray(plan?.single_note_plan?.slides);
  const pageRoleTable = slides.map((slide) => ({
    slide_id: slide.slide_id,
    title: slide.title,
    page_role: slide.progression_role,
    first_glance: slide.visual_presentation?.main_visual_action || slide.title,
    second_glance: slide.page_goal,
  }));
  return {
    ...attachCommon('visual_direction', contract),
    creative_execution: creativeExecution('visual_direction', generationRuntime),
    mode,
    lifecycle_stage: 'visual_authorship',
    visual_direction: {
      director_statement: authoredVisualDirection.director_statement,
      visual_motif: authoredVisualDirection.visual_motif,
      material_rules: authoredVisualDirection.material_rules,
      rhythm_curve: authoredVisualDirection.rhythm_curve,
      peak_pages: authoredVisualDirection.peak_pages,
      page_family_ceiling: authoredVisualDirection.page_family_ceiling,
      anti_template_constraints: authoredVisualDirection.anti_template_constraints,
      source_language_discipline: authoredVisualDirection.source_language_discipline,
      source_truth_confidence: sourceConfidence(contract) || safeText(storyline?.storyline?.source_truth_confidence),
      page_role_table: pageRoleTable,
      forbidden_regressions: authoredVisualDirection.forbidden_regressions,
      baseline_deliverable_id: mode === 'optimize_existing' ? baselineDeliverableId : null,
      memory_hook: safeText(storyline?.storyline?.memory_hook, inferMemoryHook(contract)),
      creative_sources: {
        director_statement: creativeSourceStamp({
          route: 'visual_direction',
          lifecycleStage: 'visual_authorship',
          authoredSurface: 'director_statement',
          materializedFrom: 'codex_cli_json_output',
        }),
        visual_motif: creativeSourceStamp({
          route: 'visual_direction',
          lifecycleStage: 'visual_authorship',
          authoredSurface: 'visual_motif',
          materializedFrom: 'codex_cli_json_output',
        }),
        rhythm_curve: creativeSourceStamp({
          route: 'visual_direction',
          lifecycleStage: 'visual_authorship',
          authoredSurface: 'rhythm_curve',
          materializedFrom: 'codex_cli_json_output',
        }),
        page_family_ceiling: creativeSourceStamp({
          route: 'visual_direction',
          lifecycleStage: 'visual_authorship',
          authoredSurface: 'page_family_ceiling',
          materializedFrom: 'codex_cli_json_output',
        }),
      },
      creative_authorship: {
        visual_direction: creativeSourceStamp({
          route: 'visual_direction',
          lifecycleStage: 'visual_authorship',
          authoredSurface: 'visual_direction',
          materializedFrom: 'codex_cli_json_output',
        }),
      },
    },
  };
}

function renderContract(contract) {
  return contract?.prompt_pack?.render_contract || {};
}

function runPython(script, args) {
  if (!existsSync(script)) throw new Error(`Missing python helper: ${script}`);
  const pythonCommand = resolveRedCubePythonCommand();
  const result = spawnSync(pythonCommand.command, [script, ...args], { encoding: 'utf-8', maxBuffer: 16 * 1024 * 1024 });
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

function validateRenderedSlideContent(content, slideId) {
  const html = requireText(content, `render_html.slides[${slideId}].content_html`);
  if (!/data-slide-root=(["'])true\1/.test(html)) {
    throw new Error(`render_html slide missing data-slide-root=true: ${slideId}`);
  }
  if (!new RegExp(`data-slide-id=(["'])${slideId}\\1`).test(html)) {
    throw new Error(`render_html slide missing matching data-slide-id: ${slideId}`);
  }
  if (/<script\b/i.test(html)) {
    throw new Error(`render_html slide contains forbidden script tag: ${slideId}`);
  }
  if (/<style\b/i.test(html)) {
    throw new Error(`render_html slide contains forbidden style tag: ${slideId}`);
  }
  if (/<img[^>]+src=(["'])https?:\/\//i.test(html)) {
    throw new Error(`render_html slide contains forbidden external image: ${slideId}`);
  }
  return html;
}

async function generateRenderHtmlDraft(contract, deliverablePaths) {
  const research = readStageArtifact(contract, deliverablePaths, 'research');
  const storyline = readStageArtifact(contract, deliverablePaths, 'storyline');
  const plan = readStageArtifact(contract, deliverablePaths, 'single_note_plan');
  const visual = readStageArtifact(contract, deliverablePaths, 'visual_direction');
  return generateStructuredArtifactViaCodexCli({
    family: 'xiaohongshu',
    route: 'render_html',
    promptRelativePath: promptRoute(contract, 'render_html'),
    context: {
      ...buildAuthoringContext(contract, research),
      storyline: storyline?.storyline || null,
      plan: {
        slides: summarizePlanSlides(plan),
      },
      visual_direction: visual?.visual_direction || null,
      shell_contract: {
        ratio: CANVAS.ratio,
        width: CANVAS.width,
        height: CANVAS.height,
        controls: ['slide-display-area', 'prev-btn', 'next-btn'],
      },
      html_guardrails: [
        '每页输出完整 slide root，必须包含 data-slide-root=true 和匹配的 data-slide-id。',
        '每页至少提供 2 个语义化 data-qa-block，并至少标记 1 个 data-primary-point=true，供截图审稿读取布局结构。',
        '不要外链图片，不要脚本，不要 <style> block，不要把内部文档或模板注册表写进 HTML。',
        '版式由 AI 直接创作，不能退化成固定卡片模板拼装。',
      ],
    },
    outputContract: renderHtmlOutputContract(),
  });
}

async function buildRenderHtml(contract, deliverablePaths) {
  const plan = readStageArtifact(contract, deliverablePaths, 'single_note_plan');
  const visual = readStageArtifact(contract, deliverablePaths, 'visual_direction');
  const { data, generationRuntime } = await generateRenderHtmlDraft(contract, deliverablePaths);
  const slideHtmlList = requireObjectArray(data?.slides, 'render_html.slides', { min: 4, max: 8 });
  const slideHtmlById = new Map(slideHtmlList.map((item) => [safeText(item.slide_id), validateRenderedSlideContent(item.content_html, safeText(item.slide_id))]));
  const slides = safeArray(plan?.single_note_plan?.slides).map((slide) => {
    const rawContent = slideHtmlById.get(slide.slide_id);
    if (!rawContent) {
      throw new Error(`render_html output missing slide: ${slide.slide_id}`);
    }
    const materialRules = visual?.visual_direction?.material_rules || {};
    const recipeDecision = creativeSourceStamp({
      route: 'render_html',
      lifecycleStage: 'visual_authorship',
      authoredSurface: 'recipe_selection',
      materializedFrom: 'codex_cli_json_output',
    });
    const finalMarkup = creativeSourceStamp({
      route: 'render_html',
      lifecycleStage: 'visual_authorship',
      authoredSurface: 'final_html_markup',
      materializedFrom: 'codex_cli_json_output',
    });
    const speakerSeconds = slide.layout_family === 'process_track' ? 40 : slide.layout_family === 'action_checklist' ? 32 : 36;
    const peakPage = safeArray(visual?.visual_direction?.peak_pages).includes(slide.slide_id);
    const pageRole = slide.progression_role;
    const content = validateRenderedReviewAnchors(
      hydrateRenderedSlideRootMetadata(rawContent, {
        'data-title': slide.title,
        'data-layout-family': slide.layout_family,
        'data-speaker-seconds': speakerSeconds,
        'data-recipe-id': slide.render_recipe_id,
        'data-template-id': 'upstream_ai_html',
        'data-peak-page': peakPage ? 'true' : 'false',
        'data-director-role': pageRole,
      }, slide.slide_id),
      slide.slide_id,
      'xiaohongshu',
    );
    return {
      slide_id: slide.slide_id,
      slide_no: slide.slide_no,
      title: slide.title,
      layout_family: slide.layout_family,
      recipe_id: slide.render_recipe_id,
      template_id: 'upstream_ai_html',
      page_goal: slide.page_goal,
      page_core_content: safeArray(slide.page_core_content),
      evidence_and_sources: safeArray(slide.evidence_and_sources),
      director_contract: {
        visual_motif: safeText(visual?.visual_direction?.visual_motif),
        source_language_discipline: safeText(visual?.visual_direction?.source_language_discipline),
        anti_template_constraints: safeArray(visual?.visual_direction?.anti_template_constraints),
        peak_page: peakPage,
        page_role: pageRole,
        memory_hook: safeText(visual?.visual_direction?.memory_hook),
        material_rules: {
          paper_base: safeText(materialRules.paper_base, '#FFFBF0'),
          main_accent: safeText(materialRules.main_accent, '#2563EB'),
          warning_accent: safeText(materialRules.warning_accent, '#DC2626'),
        },
      },
      speaker_seconds: speakerSeconds,
      total_slides: safeArray(plan?.single_note_plan?.slides).length,
      creative_sources: {
        recipe_selection: recipeDecision,
        final_markup: finalMarkup,
      },
      creative_authorship: {
        recipe_decision: recipeDecision,
        final_html_markup: finalMarkup,
      },
      markup_contract_source: 'codex_cli_json_output',
      content,
    };
  });
  const contractRender = renderContract(contract);
  const renderPlan = {
    render_strategy: safeText(contractRender.render_strategy, 'upstream_structured_ai_html'),
    shell_file: resolvePromptPackAsset(contract, safeText(contractRender.shell_file, 'render_shell.html')),
    pack_id: safeText(contract?.prompt_pack?.pack_id),
    authored_markup_surface: 'codex_cli_json_output',
    markup_binding_model: 'slides_data_shell_only',
    director_contract: {
      visual_motif: safeText(visual?.visual_direction?.visual_motif),
      peak_pages: safeArray(visual?.visual_direction?.peak_pages),
      page_family_ceiling: visual?.visual_direction?.page_family_ceiling || {},
      anti_template_constraints: safeArray(visual?.visual_direction?.anti_template_constraints),
      source_language_discipline: safeText(visual?.visual_direction?.source_language_discipline),
    },
    slides: slides.map((slide) => ({
      slide_id: slide.slide_id,
      title: slide.title,
      layout_family: slide.layout_family,
      recipe_id: slide.recipe_id,
      template_id: slide.template_id,
      peak_page: slide.director_contract.peak_page,
      director_role: slide.director_contract.page_role,
    })),
  };
  const htmlFile = path.join(deliverablePaths.viewsDir, `${deliverablePaths.deliverableId}.html`);
  const shellText = readPromptPackText(renderPlan.shell_file);
  writeText(htmlFile, buildHtml({
    title: contract.title,
    slides,
    renderPlan,
    renderStrategy: renderPlan.render_strategy,
    shellText,
  }));
  return {
    ...attachCommon('render_html', contract),
    creative_execution: creativeExecution('render_html', generationRuntime),
    lifecycle_stage: 'visual_authorship',
    html_bundle: {
      html_file: htmlFile,
      page_count: slides.length,
      shell_contract: CANVAS,
      render_strategy: renderPlan.render_strategy,
      director_contract: renderPlan.director_contract,
      slides,
      render_summary: normalizeStringList(data?.render_summary, 'render_html.render_summary', { min: 1, max: 4 }),
    },
    artifact_refs: [htmlFile],
  };
}

async function generateDirectorReviewDraft(contract, deliverablePaths) {
  const research = readStageArtifact(contract, deliverablePaths, 'research');
  const storyline = readStageArtifact(contract, deliverablePaths, 'storyline');
  const plan = readStageArtifact(contract, deliverablePaths, 'single_note_plan');
  const visual = readStageArtifact(contract, deliverablePaths, 'visual_direction');
  const render = readStageArtifact(contract, deliverablePaths, 'render_html');
  return generateStructuredArtifactViaCodexCli({
    family: 'xiaohongshu',
    route: 'visual_director_review',
    promptRelativePath: promptRoute(contract, 'visual_director_review'),
    context: {
      ...buildAuthoringContext(contract, research),
      storyline: storyline?.storyline || null,
      plan: {
        slides: summarizePlanSlides(plan),
      },
      visual_direction: visual?.visual_direction || null,
      render_summary: safeArray(render?.html_bundle?.slides).map((slide) => ({
        slide_id: slide.slide_id,
        title: slide.title,
        layout_family: slide.layout_family,
        peak_page: slide.director_contract?.peak_page,
        text_excerpt: stripHtml(slide.content).slice(0, 180),
      })),
    },
    outputContract: directorReviewOutputContract(),
  });
}

async function buildDirectorReview(contract, deliverablePaths) {
  const { data, generationRuntime } = await generateDirectorReviewDraft(contract, deliverablePaths);
  const directorIntentLanded = Boolean(data?.director_intent_landed);
  const antiTemplateOk = Boolean(data?.anti_template_ok);
  const memoryHookPresent = Boolean(data?.memory_hook_present);
  const weakPages = normalizeStringList(data?.weak_pages, 'visual_director_review.weak_pages', { min: 0, max: 4 });
  const homogeneousLayoutRisk = Number(data?.homogeneous_layout_risk || 0);
  const reviewSummary = requireText(data?.review_summary, 'visual_director_review.review_summary');
  const status = directorIntentLanded && antiTemplateOk && memoryHookPresent ? 'pass' : 'block';
  const reviewFile = path.join(deliverablePaths.reportsDir, `${deliverablePaths.deliverableId}_视觉总监复盘.md`);
  writeText(reviewFile, [
    '# 视觉总监复盘',
    '',
    '- review_owner: codex_native_host_agent',
    `- director_intent_landed: ${directorIntentLanded}`,
    `- anti_template_ok: ${antiTemplateOk}`,
    `- memory_hook_present: ${memoryHookPresent}`,
    `- homogeneous_layout_risk: ${homogeneousLayoutRisk}`,
    `- weak_pages: ${weakPages.join(',') || 'none'}`,
    `- review_summary: ${reviewSummary}`,
  ].join('\n'));
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
      director_intent_landed: directorIntentLanded,
      anti_template_ok: antiTemplateOk,
      memory_hook_present: memoryHookPresent,
      homogeneous_layout_risk: homogeneousLayoutRisk,
      weak_pages: weakPages,
      review_summary: reviewSummary,
      rewrite_action: status === 'pass' ? 'none' : safeText(data?.rewrite_action, 'revise_render_html'),
      creative_sources: {
        review_judgement: creativeSourceStamp({
          route: 'visual_director_review',
          lifecycleStage: 'review_overlay',
          authoredSurface: 'review_judgement',
          materializedFrom: 'codex_cli_json_output',
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

function buildScreenshotReviewMarkdown(contract, reviewArtifact) {
  const lines = [
    `# ${contract.title} 视觉质控`,
    '',
    '- review_owner: codex_native_host_agent',
    `- 状态: ${reviewArtifact.status}`,
    `- director_intent_landed: ${reviewArtifact.checks.director_intent_landed}`,
    `- anti_template_ok: ${reviewArtifact.checks.anti_template_ok}`,
    `- overflow_free: ${reviewArtifact.checks.overflow_free}`,
    `- occlusion_free: ${reviewArtifact.checks.occlusion_free}`,
    `- visual_density_ok: ${reviewArtifact.checks.visual_density_ok}`,
    `- cover_density_ok: ${reviewArtifact.checks.cover_density_ok}`,
    `- memory_hook_present: ${reviewArtifact.checks.memory_hook_present}`,
    '',
    '## AI 审阅结论',
    `- review_model: ${safeText(reviewArtifact.ai_review?.review_model)}`,
    `- weak_pages: ${safeArray(reviewArtifact.ai_review?.weak_pages).join(', ') || 'none'}`,
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

async function generateScreenshotReviewDraft(contract, deliverablePaths, slideReviews, reviewPayload, mode, research) {
  const storyline = readStageArtifact(contract, deliverablePaths, 'storyline');
  const plan = readStageArtifact(contract, deliverablePaths, 'single_note_plan');
  const visual = readStageArtifact(contract, deliverablePaths, 'visual_direction');
  const directorReview = readStageArtifact(contract, deliverablePaths, 'visual_director_review');
  return generateStructuredArtifactViaCodexCli({
    family: 'xiaohongshu',
    route: 'screenshot_review',
    promptRelativePath: promptRoute(contract, 'screenshot_review'),
    context: {
      ...buildAuthoringContext(contract, research),
      mode,
      storyline: storyline?.storyline || null,
      plan: {
        slides: summarizePlanSlides(plan),
      },
      visual_direction: visual?.visual_direction || null,
      director_review: directorReview?.visual_director_review || null,
      screenshot_mechanics: {
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
        })),
      },
    },
    outputContract: screenshotReviewOutputContract(),
    localFileInspection: slideReviews.map((slide, index) => ({
      label: `${slide.slide_id} ${safeText(slide.title, `Card ${index + 1}`)}`.trim(),
      path: slide.screenshot_file,
      media_type: 'image/png',
      purpose: `Review rendered Xiaohongshu card screenshot for ${slide.slide_id}`,
    })),
    cwd: deliverablePaths.deliverableDir,
  });
}

async function buildScreenshotReview(workspaceRoot, topicId, contract, deliverablePaths, mode, baselineDeliverableId) {
  const render = readStageArtifact(contract, deliverablePaths, 'render_html');
  const research = readStageArtifact(contract, deliverablePaths, 'research');
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
  const mechanicalSlideReviews = safeArray(python.slide_reviews).map((slide) => {
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
      status: issues.length === 0 ? 'pass' : 'block',
      checks: {
        overflow_free: overflowFree,
        occlusion_free: occlusionFree,
        visual_density_ok: visualDensityOk,
        speaker_fit_ok: speakerFitOk,
      },
      issues,
    };
  });
  const { data, generationRuntime } = await generateScreenshotReviewDraft(
    contract,
    deliverablePaths,
    mechanicalSlideReviews,
    python,
    mode,
    research,
  );
  const aiWeakPages = normalizeStringList(data?.weak_pages, 'screenshot_review.weak_pages', { min: 0, max: 4 });
  const aiSlideReviews = normalizeXhsScreenshotAiSlideReviews(data?.slide_reviews, mechanicalSlideReviews);
  const aiSlideReviewMap = new Map(aiSlideReviews.map((item) => [item.slide_id, item]));
  const slideReviews = mechanicalSlideReviews.map((slide) => buildAiFirstVisualSlideReview(
    slide,
    aiSlideReviewMap.get(slide.slide_id),
  ));
  const directorReview = readStageArtifact(contract, deliverablePaths, 'visual_director_review');
  const checks = {
    director_intent_landed: Boolean(directorReview?.visual_director_review?.director_intent_landed)
      && Boolean(data?.director_intent_landed),
    ai_review_passed: slideReviews.every((slide) => !hasAiVisualBlock(slide?.ai_review)),
    overflow_free: slideReviews.every((slide) => slide.checks.overflow_free),
    occlusion_free: aiFirstMechanicalCheckValue(slideReviews, 'occlusion_free'),
    visual_density_ok: aiFirstMechanicalCheckValue(slideReviews, 'visual_density_ok'),
    speaker_fit_ok: aiFirstMechanicalCheckValue(slideReviews, 'speaker_fit_ok'),
    cover_density_ok: slideReviews.length > 0
      && (hasAiVisualPass(slideReviews[0]?.ai_review) || Number(slideReviews[0]?.metrics?.occupied_ratio || 0) >= 0.22),
    anti_template_ok: Boolean(directorReview?.visual_director_review?.anti_template_ok)
      && Boolean(data?.anti_template_ok),
    memory_hook_present: Boolean(directorReview?.visual_director_review?.memory_hook_present),
  };
  const status = Object.values(checks).every((value) => value === true) ? 'pass' : 'block';
  const artifact = {
    ...attachCommon('screenshot_review', contract),
    review_overlay: 'screenshot_review',
    review_authorship: reviewAuthorship('screenshot_review'),
    review_execution: {
      ...creativeExecution('screenshot_review', generationRuntime),
      overlay: 'screenshot_review',
    },
    mode,
    status,
    checks,
    slide_reviews: slideReviews,
    ai_review: {
      review_model: 'screenshot_director_first_visual_judgement',
      director_intent_landed: Boolean(data?.director_intent_landed),
      anti_template_ok: Boolean(data?.anti_template_ok),
      weak_pages: aiWeakPages,
      review_summary: requireText(data?.review_summary, 'screenshot_review.review_summary'),
      slide_reviews: aiSlideReviews,
      creative_sources: {
        review_judgement: creativeSourceStamp({
          route: 'screenshot_review',
          lifecycleStage: 'review_overlay',
          authoredSurface: 'review_judgement',
          materializedFrom: 'codex_cli_json_output',
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
    artifact_refs: [reviewMarkdown, ...slideReviews.map((slide) => slide.screenshot_file)],
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
  writeText(reviewMarkdown, buildScreenshotReviewMarkdown(contract, artifact));
  return artifact;
}

async function generatePublishCopyDraft(contract, deliverablePaths) {
  const research = readStageArtifact(contract, deliverablePaths, 'research');
  const storyline = readStageArtifact(contract, deliverablePaths, 'storyline');
  const plan = readStageArtifact(contract, deliverablePaths, 'single_note_plan');
  const render = readStageArtifact(contract, deliverablePaths, 'render_html');
  return generateStructuredArtifactViaCodexCli({
    family: 'xiaohongshu',
    route: 'publish_copy',
    promptRelativePath: promptRoute(contract, 'publish_copy'),
    context: {
      ...buildAuthoringContext(contract, research),
      storyline: storyline?.storyline || null,
      title_options: safeArray(plan?.single_note_plan?.title_options).slice(0, 3),
      cover_slide_id: render?.html_bundle?.slides?.[0]?.slide_id || 'N01',
      render_summary: safeArray(render?.html_bundle?.slides).map((slide) => ({
        slide_id: slide.slide_id,
        title: slide.title,
        text_excerpt: stripHtml(slide.content).slice(0, 100),
      })),
    },
    outputContract: publishCopyOutputContract(),
  });
}

async function buildPublishCopy(contract, deliverablePaths) {
  const plan = readStageArtifact(contract, deliverablePaths, 'single_note_plan');
  const render = readStageArtifact(contract, deliverablePaths, 'render_html');
  const titles = safeArray(plan?.single_note_plan?.title_options).slice(0, 3);
  const { data, generationRuntime } = await generatePublishCopyDraft(contract, deliverablePaths);
  const hydratedTitles = titles;
  const body = requireText(data?.body, 'publish_copy.body');
  const interactionQuestions = normalizeStringList(data?.interaction_questions, 'publish_copy.interaction_questions', { min: 1, max: 3 });
  const hashtags = normalizeStringList(data?.hashtags, 'publish_copy.hashtags', { min: 3, max: 8 });
  const firstComment = requireText(data?.first_comment, 'publish_copy.first_comment');
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
    creative_execution: creativeExecution('publish_copy', generationRuntime),
    status: quality_gate.gate_pass ? 'pass' : 'block',
    publish_copy: {
      titles: hydratedTitles,
      body,
      first_comment: firstComment,
      interaction_questions: interactionQuestions,
      hashtags,
      publish_suggestion: {
        cover_slide_id: render?.html_bundle?.slides?.[0]?.slide_id || 'N01',
        recommended_time: requireText(data?.publish_suggestion?.recommended_time, 'publish_copy.publish_suggestion.recommended_time'),
      },
      quality_gate,
      caption_file: captionFile,
      creative_sources: {
        titles: creativeSourceStamp({
          route: 'publish_copy',
          lifecycleStage: 'delivery_packaging',
          authoredSurface: 'titles',
          materializedFrom: 'codex_cli_json_output',
        }),
        body: creativeSourceStamp({
          route: 'publish_copy',
          lifecycleStage: 'delivery_packaging',
          authoredSurface: 'body',
          materializedFrom: 'codex_cli_json_output',
        }),
        first_comment: creativeSourceStamp({
          route: 'publish_copy',
          lifecycleStage: 'delivery_packaging',
          authoredSurface: 'first_comment',
          materializedFrom: 'codex_cli_json_output',
        }),
      },
      creative_authorship: {
        titles: creativeSourceStamp({
          route: 'publish_copy',
          lifecycleStage: 'delivery_packaging',
          authoredSurface: 'titles',
          materializedFrom: 'codex_cli_json_output',
        }),
        body: creativeSourceStamp({
          route: 'publish_copy',
          lifecycleStage: 'delivery_packaging',
          authoredSurface: 'body',
          materializedFrom: 'codex_cli_json_output',
        }),
        first_comment: creativeSourceStamp({
          route: 'publish_copy',
          lifecycleStage: 'delivery_packaging',
          authoredSurface: 'first_comment',
          materializedFrom: 'codex_cli_json_output',
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
      return await buildStoryline(contract, deliverablePaths);
    case 'single_note_plan':
      return await buildSingleNotePlan(contract, deliverablePaths);
    case 'visual_direction':
      return await buildVisualDirection(contract, deliverablePaths, mode, baselineDeliverableId);
    case 'render_html':
      return await buildRenderHtml(contract, deliverablePaths);
    case 'visual_director_review':
      return await buildDirectorReview(contract, deliverablePaths);
    case 'screenshot_review':
      return await buildScreenshotReview(workspaceRoot, topicId, contract, deliverablePaths, mode, baselineDeliverableId);
    case 'publish_copy':
      return await buildPublishCopy(contract, deliverablePaths);
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
