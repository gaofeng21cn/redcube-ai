import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';

import {
  generateStructuredArtifactViaUpstreamHermes,
} from '@redcube/hermes-agent-client';
import {
  buildSourceTruthConsumptionSummary,
  getDeliverablePaths,
  resolveRedCubePythonCommand,
} from '@redcube/runtime-protocol';
import { buildHermesExecutionModel } from '@redcube/hermes-substrate';
import { compareFailuresAndDensity, summarizeRelativeQuality } from '@redcube/reference-os';
import { getReviewState, isBaselineApprovedState } from '@redcube/governance';
import {
  buildPptDetailedOutlineArtifact,
  buildPptSlideBlueprintArtifact,
  buildPptVisualDirectionArtifact,
} from './ppt-structured-artifact-builders.js';

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

const MODULE_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(MODULE_DIR, '../../..');
const PYTHON_REVIEW = path.join(MODULE_DIR, '../../redcube-runtime/scripts/ppt_deck_review.py');
const PYTHON_EXPORT = path.join(MODULE_DIR, '../../redcube-runtime/scripts/ppt_deck_export.py');
const PROMPT_PACK = Object.freeze({
  storyline: 'prompts/ppt_deck/storyline.md',
  detailed_outline: 'prompts/ppt_deck/detailed_outline.md',
  slide_blueprint: 'prompts/ppt_deck/slide_blueprint.md',
  visual_direction: 'prompts/ppt_deck/visual_direction.md',
  render_html: 'prompts/ppt_deck/render_html.md',
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
  visual_director_review: { requires_artifacts: ['render_html'] },
  screenshot_review: { requires_artifacts: ['visual_director_review'] },
  export_pptx: { requires_artifacts: ['screenshot_review'], requires_review_pass: true },
});
const CANVAS = Object.freeze({ width: 1152, height: 648, ratio: '16:9' });
const BANNED_RENDER_TOKENS = ['renderSlide', 'layoutByType', 'cardsGrid', 'pageType'];
const HERMES_EXECUTION_MODEL = Object.freeze(buildHermesExecutionModel());
const CREATIVE_MATERIALIZED_FROM = 'upstream_run_json_output';
const ROUTE_TO_SOURCE_TRUTH_CONSUMPTION_ROLE = Object.freeze({
  storyline: 'story_architecture',
  detailed_outline: 'story_architecture',
  slide_blueprint: 'story_architecture',
  visual_direction: 'visual_authorship',
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

function safeText(value) {
  return String(value || '').trim();
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeInlineText(value, maxLength = 220) {
  return safeText(value).replace(/\s+/g, ' ').slice(0, maxLength);
}

function escapeHtml(text) {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeTemplate(text) {
  return String(text || '').replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
}

function buildDeckHtml({ title, slidesMarkup, renderPlan, renderStrategy, shellText }) {
  const slidesLiteral = `\n[${slidesMarkup.map((slide) => `\n  { slideId: '${slide.slide_id}', title: ${JSON.stringify(slide.title)}, layoutFamily: '${slide.layout_family}', recipeId: '${slide.recipe_id}', templateId: '${slide.template_id}', content: \`${escapeTemplate(slide.content)}\` }`).join(',')}\n]`;
  return shellText
    .replaceAll('__PPT_DECK_TITLE__', escapeHtml(title))
    .replaceAll('__REDCUBE_RENDER_STRATEGY__', escapeHtml(renderStrategy.replaceAll('_', '-')))
    .replaceAll('__REDCUBE_RENDER_PLAN__', escapeHtml(JSON.stringify(renderPlan)))
    .replaceAll('__PPT_DECK_SLIDES_DATA__', slidesLiteral);
}

function ensureDir(dir) {
  mkdirSync(dir, { recursive: true });
  return dir;
}

function writeJson(file, data) {
  ensureDir(path.dirname(file));
  writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8');
}

function writeText(file, content) {
  ensureDir(path.dirname(file));
  writeFileSync(file, content, 'utf-8');
}

function readJson(file) {
  return JSON.parse(readFileSync(file, 'utf-8'));
}

function stageArtifactPath(contract, deliverablePaths, stageId) {
  const stage = safeArray(contract?.stage_sequence?.stages).find((item) => item?.stage_id === stageId);
  return path.join(
    deliverablePaths.artifactsDir,
    safeText(stage?.output_artifact) || `${stageId}.json`,
  );
}

function readStageArtifact(contract, deliverablePaths, stageId) {
  const file = stageArtifactPath(contract, deliverablePaths, stageId);
  return existsSync(file) ? readJson(file) : null;
}

function promptMeta(route) {
  const relativePath = PROMPT_PACK[route];
  const absolutePath = path.join(REPO_ROOT, relativePath);
  return {
    root: 'prompts/ppt_deck',
    file: path.basename(relativePath),
    relative_path: relativePath,
    source: existsSync(absolutePath) ? 'repo' : 'embedded',
  };
}

function resolvePromptPackAsset(contract, relativePath) {
  const assetPath = safeText(relativePath);
  if (!assetPath) return '';
  if (path.isAbsolute(assetPath)) return assetPath;
  if (assetPath.startsWith('prompts/')) return assetPath;
  const root = safeText(contract?.prompt_pack?.root, 'prompts/ppt_deck');
  return assetPath.startsWith(`${root}/`) ? assetPath : path.posix.join(root, assetPath);
}

function readPromptPackText(relativePath) {
  const absolutePath = path.join(REPO_ROOT, relativePath);
  if (!existsSync(absolutePath)) {
    throw new Error(`Missing prompt pack asset: ${relativePath}`);
  }
  return readFileSync(absolutePath, 'utf-8');
}

function renderSeedValue(value, vars) {
  if (Array.isArray(value)) {
    return value.map((item) => renderSeedValue(item, vars));
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, renderSeedValue(item, vars)]));
  }
  if (typeof value === 'string') {
    return value.replace(/\{\{([a-zA-Z0-9_]+)\}\}/g, (_match, key) => safeText(vars[key]));
  }
  return value;
}

function promptSeed(route, vars = {}) {
  const rendered = promptPackJsonSection(route, 'runtime_seed', vars);
  if (!rendered) return null;
  const profileId = safeText(vars.profile_id);
  if (profileId && rendered?.profile_variants?.[profileId] && typeof rendered.profile_variants[profileId] === 'object') {
    const { profile_variants, ...base } = rendered;
    return {
      ...base,
      ...rendered.profile_variants[profileId],
    };
  }
  return rendered;
}

function promptPackJsonSection(route, section, vars = {}) {
  const relativePath = PROMPT_PACK[route];
  const absolutePath = path.join(REPO_ROOT, relativePath);
  if (!existsSync(absolutePath)) return null;
  const raw = readFileSync(absolutePath, 'utf-8');
  const match = raw.match(new RegExp(`## ${section}\\s*\\\`\\\`\\\`json\\s*([\\s\\S]*?)\\s*\\\`\\\`\\\``));
  if (!match) return null;
  return renderSeedValue(JSON.parse(match[1]), vars);
}

function promptArtifact(route, vars = {}) {
  return promptPackJsonSection(route, 'runtime_artifact', vars);
}

function sharedSourceTruth(contract) {
  return contract?.shared_source_truth || null;
}

function sharedSourceReadinessPack(contract) {
  return sharedSourceTruth(contract)?.source_readiness_pack || null;
}

function sharedSourceMaterials(contract) {
  return safeArray(sharedSourceTruth(contract)?.extracted_materials?.materials);
}

function audienceFacingMaterials(contract) {
  return sharedSourceMaterials(contract)
    .filter((material) => !['brief', 'keywords'].includes(safeText(material?.kind)));
}

function audienceFacingTextLines(value) {
  return String(value || '')
    .replace(/!\[[^\]]*\]\([^)]+\)/g, ' ')
    .replace(/<img[^>]*>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/`+/g, ' ')
    .replace(/^\s*#+\s*/gm, '')
    .replace(/^\s*[-*]\s+/gm, '')
    .split(/\r?\n/)
    .map((line) => line.replace(/\|/g, ' ').replace(/\s+/g, ' ').trim())
    .filter(Boolean);
}

function extractAudienceFacingSnippet(value, maxLength = 240) {
  const lines = audienceFacingTextLines(value);
  const informative = lines.find((line) => line.length >= 20) || lines[0] || '';
  return informative.slice(0, maxLength);
}

function sharedSourceMaterialIds(contract) {
  return sharedSourceMaterials(contract).map((material) => material.material_id);
}

function sharedSourceLabels(contract) {
  const labels = safeArray(sharedSourceTruth(contract)?.source_index?.sources)
    .filter((source) => source.status === 'ready' && !['brief', 'keywords'].includes(safeText(source?.kind)))
    .map((source) => source.relative_path || source.kind);
  return labels.length > 0 ? labels : [
    '公开来源：临床指南 / 系统综述 / 监管原则',
    '公开来源：同行评议论文 / 真实世界研究',
    '公开来源：公开流程规范 / 教学案例',
  ];
}

function sharedSourceSnippet(contract, index = 0) {
  const materials = audienceFacingMaterials(contract);
  if (materials.length === 0) return '';
  const material = materials[index % materials.length];
  return extractAudienceFacingSnippet(material?.content_text || material?.excerpt, 80);
}

function sharedSourceInputMode(contract) {
  return safeText(sharedSourceTruth(contract)?.source_brief?.input_mode);
}

function sharedSourceConfidence(contract) {
  return safeText(sharedSourceTruth(contract)?.source_brief?.confidence);
}

function sharedSourceSufficiencyStatus(contract) {
  if (!sharedSourceTruth(contract)) return 'augmentation_required';
  return safeText(sharedSourceReadinessPack(contract)?.readiness?.sufficiency_status, 'augmentation_required');
}

function sharedSourceDeepResearchState(contract) {
  if (!sharedSourceTruth(contract)) return 'required';
  return safeText(sharedSourceReadinessPack(contract)?.readiness?.deep_research_state, 'required');
}

function sharedFactLibrarySummary(contract) {
  if (!sharedSourceTruth(contract)) {
    return safeText(contract.title);
  }
  return extractAudienceFacingSnippet(
    sharedSourceReadinessPack(contract)?.fact_library?.topic_summary,
    240,
  ) || sharedSourceSnippet(contract, 0) || safeText(contract.title);
}

function sharedSourceAudience(contract, fallback) {
  const corpus = [
    safeText(sharedSourceTruth(contract)?.source_brief?.brief_text),
    ...sharedSourceMaterials(contract).map((material) => extractAudienceFacingSnippet(material.content_text, 240)),
  ].join(' ');
  if (/同行|同仁|peer|科研/.test(corpus)) return '临床科研同行';
  if (/管理|决策/.test(corpus)) return '医院管理层';
  if (/学生|本科|住院|学员/.test(corpus)) return '医学生与住院学员';
  return safeText(fallback, '专业听众');
}

function extraChecks(contract) {
  const required = safeArray(contract?.review_surface?.required_checks);
  return required.filter((check) => !['overflow_free', 'occlusion_free', 'visual_density_ok', 'speaker_fit_ok'].includes(check));
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

function hostAgentCreativeSource(protectedSurface, artifactSource) {
  return {
    owner: 'hermes',
    primary_surface: 'hermes_backed_runtime_substrate',
    stage_owner: 'hermes_backed_runtime_substrate',
    ownership_model: 'director_first',
    authored_surface: protectedSurface,
    materialized_from: artifactSource,
  };
}

function creativeSourceStamp({ route, lifecycleStage, authoredSurface, materializedFrom = 'prompt_pack_seed' }) {
  return {
    ...hostAgentCreativeSource(authoredSurface, materializedFrom),
    route,
    lifecycle_stage: lifecycleStage,
    authored_surface: authoredSurface,
    materialized_from: materializedFrom,
  };
}

function lifecycleStageForRoute(contract, route) {
  return contract?.lifecycle_model?.route_to_stage?.[route] || null;
}

function reviewOverlayForRoute(contract, route) {
  return contract?.lifecycle_model?.review_overlay_routes?.[route] || null;
}

function creativeExecution(routeOrLifecycleStage, generationRuntime = null) {
  return {
    owner: 'hermes',
    primary_surface: 'hermes_backed_runtime_substrate',
    lifecycle_stage: routeOrLifecycleStage,
    ownership_model: 'director_first',
    ...(generationRuntime
      ? {
          generation_runtime: generationRuntime,
        }
      : {}),
  };
}

function attachCommon(route, contract) {
  return {
    route,
    overlay: contract.overlay,
    profile_id: contract.profile_id,
    produced_at: new Date().toISOString(),
    prompt_pack: promptMeta(route),
    lifecycle_stage: lifecycleStageForRoute(contract, route),
    review_overlay: reviewOverlayForRoute(contract, route),
    execution_model: HERMES_EXECUTION_MODEL,
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

function normalizePageCoreContent(value, label) {
  const items = safeArray(value)
    .map((item) => (item && typeof item === 'object'
      ? {
          label: safeText(item.label),
          text: safeText(item.text),
        }
      : {
          label: '',
          text: safeText(item),
        }))
    .filter((item) => item.text);
  if (items.length === 0) {
    throw new Error(`Missing ${label} in upstream ppt generation output`);
  }
  return items;
}

function normalizeOutlineSlide(slide, index, defaultPublicSources) {
  const slideNo = Number(slide?.slide_no || index + 1);
  const renderRecipeId = requireText(slide?.render_recipe_id, `slides[${index}].render_recipe_id`);
  if (!ALLOWED_RECIPE_IDS.has(renderRecipeId)) {
    throw new Error(`Unsupported render_recipe_id in upstream ppt generation output: ${renderRecipeId}`);
  }

  return {
    slide_id: requireText(slide?.slide_id, `slides[${index}].slide_id`),
    slide_no: Number.isFinite(slideNo) ? slideNo : index + 1,
    chapter_id: safeText(slide?.chapter_id) || `C${Math.min(Math.floor(index / 3) + 1, 3)}`,
    page_type: requireText(slide?.page_type, `slides[${index}].page_type`),
    layout_family: requireText(slide?.layout_family, `slides[${index}].layout_family`),
    title: requireText(slide?.title, `slides[${index}].title`),
    page_goal: requireText(slide?.page_goal, `slides[${index}].page_goal`),
    page_objective: requireText(slide?.page_objective, `slides[${index}].page_objective`),
    core_sentence: requireText(slide?.core_sentence, `slides[${index}].core_sentence`),
    evidence_points: normalizeStringList(slide?.evidence_points, `slides[${index}].evidence_points`, { min: 2, max: 5 }),
    public_sources: normalizeStringList(
      slide?.public_sources,
      `slides[${index}].public_sources`,
      { min: 1, max: 4 },
    ),
    page_core_content: normalizePageCoreContent(slide?.page_core_content, `slides[${index}].page_core_content`),
    visual_anchor_tracks: normalizeStringList(
      slide?.visual_anchor_tracks,
      `slides[${index}].visual_anchor_tracks`,
      { min: 2, max: 6 },
    ),
    speaker_notes: requireText(slide?.speaker_notes, `slides[${index}].speaker_notes`),
    transition_sentence: requireText(slide?.transition_sentence, `slides[${index}].transition_sentence`),
    render_recipe_id: renderRecipeId,
    ...(safeArray(slide?.public_sources).length === 0
      ? { public_sources: defaultPublicSources.slice(0, 3) }
      : {}),
  };
}

function deriveChapterStructure(slides) {
  const groups = new Map();
  for (const slide of slides) {
    if (!groups.has(slide.chapter_id)) {
      groups.set(slide.chapter_id, []);
    }
    groups.get(slide.chapter_id).push(slide.slide_no);
  }
  return [...groups.entries()].map(([chapterId, slideNos], index) => ({
    chapter_id: chapterId,
    title: `第 ${index + 1} 章`,
    slide_range: `${String(Math.min(...slideNos)).padStart(2, '0')}-${String(Math.max(...slideNos)).padStart(2, '0')}`,
  }));
}

function normalizeChapterStructure(chapterStructure, slides) {
  const normalized = safeArray(chapterStructure)
    .map((chapter, index) => ({
      chapter_id: safeText(chapter?.chapter_id) || `C${index + 1}`,
      title: requireText(chapter?.title, `chapter_structure[${index}].title`),
      slide_range: requireText(chapter?.slide_range, `chapter_structure[${index}].slide_range`),
    }))
    .filter((chapter) => chapter.title);
  return normalized.length > 0 ? normalized : deriveChapterStructure(slides);
}

function normalizeOutlineDraft(data, contract) {
  const defaultPublicSources = sharedSourceLabels(contract);
  const slides = safeArray(data?.slides).map((slide, index) => normalizeOutlineSlide(slide, index, defaultPublicSources));
  if (slides.length < 6) {
    throw new Error('upstream ppt detailed_outline must contain at least 6 slides');
  }
  return {
    chapter_structure: normalizeChapterStructure(data?.chapter_structure, slides),
    slides,
  };
}

function normalizeBlueprintDraft(data, contract) {
  const defaultPublicSources = sharedSourceLabels(contract);
  const slides = safeArray(data?.slides).map((slide, index) => normalizeOutlineSlide(slide, index, defaultPublicSources));
  if (slides.length < 6) {
    throw new Error('upstream ppt slide_blueprint must contain at least 6 slides');
  }
  return {
    chapter_goal: requireText(data?.chapter_goal, 'slide_blueprint.chapter_goal'),
    slides,
  };
}

function normalizeRhythmCurve(value, slides) {
  const normalized = safeArray(value)
    .map((item) => ({
      slide_id: safeText(item?.slide_id),
      role: safeText(item?.role),
    }))
    .filter((item) => item.slide_id && item.role);
  if (normalized.length > 0) return normalized;
  return slides.map((slide, index) => ({
    slide_id: slide.slide_id,
    role: index === 0 ? 'opening_peak' : (index === slides.length - 1 ? 'closing_peak' : 'progression'),
  }));
}

function normalizeVisualDirectionDraft(data, slides) {
  return {
    visual_manifest: requireText(data?.visual_manifest, 'visual_direction.visual_manifest'),
    what_it_is: normalizeStringList(data?.what_it_is, 'visual_direction.what_it_is', { min: 2, max: 5 }),
    what_it_is_not: normalizeStringList(data?.what_it_is_not, 'visual_direction.what_it_is_not', { min: 2, max: 5 }),
    palette: data?.palette && typeof data.palette === 'object'
      ? data.palette
      : (() => {
          throw new Error('Missing visual_direction.palette in upstream ppt generation output');
        })(),
    continuity_constraints: normalizeStringList(
      data?.continuity_constraints,
      'visual_direction.continuity_constraints',
      { min: 2, max: 6 },
    ),
    rhythm_curve: normalizeRhythmCurve(data?.rhythm_curve, slides),
    peak_pages: normalizeStringList(data?.peak_pages, 'visual_direction.peak_pages', { min: 2, max: 6 }),
    page_family_ceiling: data?.page_family_ceiling && typeof data.page_family_ceiling === 'object'
      ? data.page_family_ceiling
      : (() => {
          throw new Error('Missing visual_direction.page_family_ceiling in upstream ppt generation output');
        })(),
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
  };
}

function storylineOutputContract() {
  return {
    speaker: '<string>',
    audience: '<string>',
    style: '<string>',
    core_metaphor: '<string>',
    hook: ['<string>'],
    journey: ['<string>', '<string>', '<string>'],
    resolution: ['<string>'],
  };
}

function detailedOutlineOutputContract() {
  return {
    chapter_structure: [
      { chapter_id: 'C1', title: '<string>', slide_range: '01-03' },
    ],
    slides: [
      {
        slide_id: 'S01',
        slide_no: 1,
        chapter_id: 'C1',
        page_type: 'cover_signal',
        layout_family: 'cover_signal',
        title: '<string>',
        page_goal: '<string>',
        page_objective: '<string>',
        core_sentence: '<string>',
        evidence_points: ['<string>', '<string>'],
        public_sources: ['<string>'],
        page_core_content: ['<string>', '<string>'],
        visual_anchor_tracks: ['<string>', '<string>'],
        speaker_notes: '<string>',
        transition_sentence: '<string>',
        render_recipe_id: 'ppt.hero_signal',
      },
    ],
  };
}

function slideBlueprintOutputContract() {
  return {
    chapter_goal: '<string>',
    slides: detailedOutlineOutputContract().slides,
  };
}

function visualDirectionOutputContract() {
  return {
    visual_manifest: '<string>',
    what_it_is: ['<string>', '<string>'],
    what_it_is_not: ['<string>', '<string>'],
    palette: {
      canvas: '#F7F8FC',
      ink: '#0F172A',
      accent: '#2563EB',
      accentSoft: '#DBEAFE',
      success: '#0F766E',
    },
    continuity_constraints: ['<string>', '<string>'],
    rhythm_curve: [{ slide_id: 'S01', role: 'opening_peak' }],
    peak_pages: ['S01', 'S04'],
    page_family_ceiling: {
      cover_signal: 1,
      multi_zone_compare: 2,
      timeline_band: 1,
      judgement_ladder: 1,
      ring_cross: 1,
      summary_peak: 1,
    },
    forbidden_regressions: ['<string>', '<string>'],
    final_instruction_to_html_generator: ['<string>', '<string>'],
  };
}

function renderHtmlOutputContract() {
  return {
    slides: [
      {
        slide_id: 'S01',
        content_html: '<div data-slide-root="true" data-slide-id="S01">...</div>',
      },
    ],
    render_summary: ['<string>', '<string>'],
  };
}

function directorReviewOutputContract() {
  return {
    director_intent_landed: true,
    anti_template_ok: true,
    peak_pages_landed: true,
    memory_hook_present: true,
    homogeneous_layout_risk: 0.22,
    weak_pages: ['S06'],
    review_summary: '<string>',
    rewrite_action: 'none | revise_render_html',
  };
}

function buildAuthoringContext(contract) {
  const preset = deckPreset(contract.profile_id);
  return {
    title: safeText(contract.title),
    delivery_goal: safeText(contract.goal),
    profile_id: contract.profile_id,
    speaker: preset.speaker,
    audience: sharedSourceAudience(contract, preset.audience),
    promise: preset.promise,
    page_budget: pageBudget(contract.profile_id),
    page_library: PPT_PAGE_LIBRARY,
    source_fact_summary: sharedFactLibrarySummary(contract),
    ready_sources: sharedSourceLabels(contract),
    evidence_excerpts: audienceFacingMaterials(contract)
      .slice(0, 6)
      .map((material) => ({
        material_id: material.material_id,
        source_id: material.source_id,
        excerpt: extractAudienceFacingSnippet(material.content_text || material.excerpt, 220),
      }))
      .filter((material) => material.excerpt),
    source_truth: {
      input_mode: sharedSourceInputMode(contract) || 'seed_only',
      confidence: sharedSourceConfidence(contract) || 'low',
      sufficiency_status: sharedSourceSufficiencyStatus(contract),
      deep_research_state: sharedSourceDeepResearchState(contract),
      material_ids: sharedSourceMaterialIds(contract),
    },
    authoring_guardrails: [
      'delivery_goal 只表示制作目标，不得原样进入 slide 标题、正文、讲稿或视觉宣言',
      '不要把“封面必须署名”“重点回答三件事”“先讲什么后讲什么”等系统操作说明写成 audience-facing 内容',
      '如果共享事实材料不足，只能做保守抽象，不要发明内部流程细节或伪来源',
    ],
  };
}

async function generateStorylineDraft(contract) {
  const { data, generationRuntime } = await generateStructuredArtifactViaUpstreamHermes({
    family: 'ppt_deck',
    route: 'storyline',
    promptRelativePath: PROMPT_PACK.storyline,
    context: buildAuthoringContext(contract),
    outputContract: storylineOutputContract(),
  });
  return {
    authoredStoryline: {
      speaker: requireText(data?.speaker, 'storyline.speaker'),
      audience: requireText(data?.audience, 'storyline.audience'),
      style: requireText(data?.style, 'storyline.style'),
      core_metaphor: requireText(data?.core_metaphor, 'storyline.core_metaphor'),
      hook: normalizeStringList(data?.hook, 'storyline.hook', { min: 1, max: 3 }),
      journey: normalizeStringList(data?.journey, 'storyline.journey', { min: 3, max: 5 }),
      resolution: normalizeStringList(data?.resolution, 'storyline.resolution', { min: 1, max: 3 }),
    },
    generationRuntime,
  };
}

function buildOutlineContext(contract, storylineArtifact) {
  return {
    ...buildAuthoringContext(contract),
    storyline: {
      speaker: safeText(storylineArtifact?.storyline?.speaker),
      audience: safeText(storylineArtifact?.storyline?.audience),
      style: safeText(storylineArtifact?.storyline?.style),
      core_metaphor: safeText(storylineArtifact?.storyline?.core_metaphor),
      hook: safeArray(storylineArtifact?.storyline?.narrative_arc?.hook),
      journey: safeArray(storylineArtifact?.storyline?.narrative_arc?.journey),
      resolution: safeArray(storylineArtifact?.storyline?.narrative_arc?.resolution),
    },
  };
}

async function generateOutlineDraft(contract, storylineArtifact) {
  const { data, generationRuntime } = await generateStructuredArtifactViaUpstreamHermes({
    family: 'ppt_deck',
    route: 'detailed_outline',
    promptRelativePath: PROMPT_PACK.detailed_outline,
    context: buildOutlineContext(contract, storylineArtifact),
    outputContract: detailedOutlineOutputContract(),
  });
  return {
    authoredOutline: normalizeOutlineDraft(data, contract),
    generationRuntime,
  };
}

function summarizeOutlineSlides(outlineArtifact) {
  return safeArray(outlineArtifact?.detailed_outline?.slides).map((slide) => ({
    slide_id: slide.slide_id,
    slide_no: slide.slide_no,
    chapter_id: slide.chapter_id,
    page_type: slide.page_type,
    layout_family: slide.layout_family,
    title: slide.title,
    page_goal: slide.page_goal,
    page_objective: slide.page_objective,
    core_sentence: slide.core_sentence,
    evidence_points: slide.evidence_points,
    public_sources: slide.public_sources,
    page_core_content: slide.page_core_content,
    visual_anchor_tracks: slide.visual_anchor_tracks,
    speaker_notes: slide.speaker_notes,
    transition_sentence: slide.transition_sentence,
    render_recipe_id: slide.render_recipe_id,
  }));
}

async function generateBlueprintDraft(contract, outlineArtifact) {
  const { data, generationRuntime } = await generateStructuredArtifactViaUpstreamHermes({
    family: 'ppt_deck',
    route: 'slide_blueprint',
    promptRelativePath: PROMPT_PACK.slide_blueprint,
    context: {
      ...buildAuthoringContext(contract),
      outline: {
        chapter_structure: safeArray(outlineArtifact?.detailed_outline?.chapter_structure),
        slides: summarizeOutlineSlides(outlineArtifact),
      },
    },
    outputContract: slideBlueprintOutputContract(),
  });
  return {
    authoredBlueprint: normalizeBlueprintDraft(data, contract),
    generationRuntime,
  };
}

function summarizeBlueprintSlides(blueprintArtifact) {
  return safeArray(blueprintArtifact?.slide_blueprint?.slides).map((slide) => ({
    slide_id: slide.slide_id,
    title: slide.title,
    page_type: slide.page_type,
    layout_family: slide.visual_presentation?.layout_family,
    page_goal: slide.page_goal,
    anchor_tracks: slide.visual_presentation?.anchor_tracks,
  }));
}

async function generateVisualDirectionDraft(contract, blueprintArtifact, mode, baselineDeliverableId) {
  const { data, generationRuntime } = await generateStructuredArtifactViaUpstreamHermes({
    family: 'ppt_deck',
    route: 'visual_direction',
    promptRelativePath: PROMPT_PACK.visual_direction,
    context: {
      ...buildAuthoringContext(contract),
      mode,
      baseline_deliverable_id: safeText(baselineDeliverableId) || null,
      blueprint: {
        slides: summarizeBlueprintSlides(blueprintArtifact),
      },
    },
    outputContract: visualDirectionOutputContract(),
  });
  return {
    authoredVisualDirection: normalizeVisualDirectionDraft(data, blueprintArtifact.slide_blueprint.slides),
    generationRuntime,
  };
}

async function buildStoryline(contract) {
  const { authoredStoryline, generationRuntime } = await generateStorylineDraft(contract);
  return {
    ...attachCommon('storyline', contract),
    creative_execution: {
      ...creativeExecution('storyline', generationRuntime),
      lifecycle_stage: lifecycleStageForRoute(contract, 'storyline'),
    },
    storyline: {
      speaker: safeText(authoredStoryline.speaker),
      audience: safeText(authoredStoryline.audience),
      goal: safeText(contract.goal),
      style: safeText(authoredStoryline.style),
      core_metaphor: safeText(authoredStoryline.core_metaphor),
      narrative_arc: {
        hook: safeArray(authoredStoryline.hook),
        journey: safeArray(authoredStoryline.journey),
        resolution: safeArray(authoredStoryline.resolution),
      },
      source_truth_input_mode: sharedSourceInputMode(contract) || 'seed_only',
      source_truth_confidence: sharedSourceConfidence(contract) || 'low',
      source_truth_material_ids: sharedSourceMaterialIds(contract),
      source_sufficiency_judgement: sharedSourceSufficiencyStatus(contract),
      deep_research_state: sharedSourceDeepResearchState(contract),
      fact_library_summary: sharedFactLibrarySummary(contract),
      creative_sources: {
        core_metaphor: hostAgentCreativeSource('outline_major_text', CREATIVE_MATERIALIZED_FROM),
        narrative_arc: hostAgentCreativeSource('outline_major_text', CREATIVE_MATERIALIZED_FROM),
      },
    },
  };
}

function renderContract(contract) {
  return contract?.prompt_pack?.render_contract || {};
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
  return html;
}

async function generateRenderHtmlDraft(contract, deliverablePaths) {
  const blueprintArtifact = readStageArtifact(contract, deliverablePaths, 'slide_blueprint');
  const visualArtifact = readStageArtifact(contract, deliverablePaths, 'visual_direction');
  const { data, generationRuntime } = await generateStructuredArtifactViaUpstreamHermes({
    family: 'ppt_deck',
    route: 'render_html',
    promptRelativePath: PROMPT_PACK.render_html,
    context: {
      ...buildAuthoringContext(contract),
      blueprint: {
        slides: safeArray(blueprintArtifact?.slide_blueprint?.slides).map((slide) => ({
          slide_id: slide.slide_id,
          slide_no: slide.slide_no,
          page_type: slide.page_type,
          layout_family: slide.visual_presentation?.layout_family,
          title: slide.title,
          page_goal: slide.page_goal,
          core_sentence: slide.core_sentence,
          page_core_content: slide.page_core_content,
          anchor_tracks: slide.visual_presentation?.anchor_tracks,
          speaker_seconds: slide.speaker_seconds,
          render_recipe_id: slide.render_recipe_id,
          public_sources: safeArray(slide.evidence_and_sources).map((item) => item.public_label),
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
        '每页输出完整 slide root，必须包含 data-slide-root=true 与匹配的 data-slide-id。',
        '不要使用 renderSlide/layoutByType/cardsGrid/pageType，也不要把模板注册表或内部文档写入 HTML。',
        'HTML 必须由 AI 直接创作，不得退化成固定 slot/template compiler 产物。',
      ],
    },
    outputContract: renderHtmlOutputContract(),
  });
  return {
    data,
    generationRuntime,
  };
}

async function buildRenderHtmlArtifact({ deliverableId, contract, deliverablePaths }) {
  const blueprintArtifact = readStageArtifact(contract, deliverablePaths, 'slide_blueprint');
  const visualArtifact = readStageArtifact(contract, deliverablePaths, 'visual_direction');
  const { data, generationRuntime } = await generateRenderHtmlDraft(contract, deliverablePaths);
  const slideHtmlList = safeArray(data?.slides).filter((item) => item && typeof item === 'object');
  if (slideHtmlList.length < 6) {
    throw new Error('upstream ppt render_html must contain at least 6 slides');
  }
  const slideHtmlById = new Map(slideHtmlList.map((item) => [
    safeText(item.slide_id),
    validateRenderedSlideContent(item.content_html, safeText(item.slide_id)),
  ]));
  const slidesMarkup = safeArray(blueprintArtifact?.slide_blueprint?.slides).map((slide) => {
    const content = slideHtmlById.get(slide.slide_id);
    if (!content) {
      throw new Error(`upstream ppt render_html missing slide: ${slide.slide_id}`);
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
      slide_no: slide.slide_no,
      title: slide.title,
      layout_family: slide.visual_presentation.layout_family,
      recipe_id: slide.render_recipe_id,
      template_id: 'upstream_ai_html',
      page_goal: slide.page_goal,
      page_core_content: safeArray(slide.page_core_content),
      evidence_and_sources: safeArray(slide.evidence_and_sources),
      speaker_seconds: slide.speaker_seconds,
      transition_sentence: slide.transition_sentence,
      director_contract: {
        peak_page: safeArray(visualArtifact?.visual_direction?.peak_pages).includes(slide.slide_id),
        director_role: safeArray(visualArtifact?.visual_direction?.page_role_table).find((item) => item.slide_id === slide.slide_id)?.page_role || slide.visual_presentation.layout_family,
        generator_instructions: safeArray(visualArtifact?.visual_direction?.final_instruction_to_html_generator),
        page_family_ceiling: visualArtifact?.visual_direction?.page_family_ceiling || {},
        visual_manifest: safeText(visualArtifact?.visual_direction?.visual_manifest),
      },
      palette: visualArtifact?.visual_direction?.palette || {
        canvas: '#F7F8FC',
        ink: '#0F172A',
        accent: '#2563EB',
      },
      total_slides: safeArray(blueprintArtifact?.slide_blueprint?.slides).length,
      creative_sources: {
        recipe_selection: recipeDecision,
        final_markup: finalMarkup,
      },
      creative_authorship: {
        recipe_decision: recipeDecision,
        final_html_markup: finalMarkup,
      },
      markup_contract_source: CREATIVE_MATERIALIZED_FROM,
      content,
    };
  });
  const contractRender = renderContract(contract);
  const renderPlan = {
    render_strategy: safeText(contractRender.render_strategy, 'upstream_structured_ai_html'),
    shell_file: resolvePromptPackAsset(contract, safeText(contractRender.shell_file, 'render_shell.html'), { safeText }),
    pack_id: safeText(contract?.prompt_pack?.pack_id),
    authored_markup_surface: CREATIVE_MATERIALIZED_FROM,
    markup_binding_model: 'slides_data_shell_only',
    generator_instructions: safeArray(visualArtifact?.visual_direction?.final_instruction_to_html_generator),
    peak_pages: safeArray(visualArtifact?.visual_direction?.peak_pages),
    page_family_ceiling: visualArtifact?.visual_direction?.page_family_ceiling || {},
    slides: slidesMarkup.map((slide) => ({
      slide_id: slide.slide_id,
      title: slide.title,
      layout_family: slide.layout_family,
      recipe_id: slide.recipe_id,
      template_id: slide.template_id,
      peak_page: slide.director_contract.peak_page,
      director_role: slide.director_contract.director_role,
    })),
  };
  const htmlFile = path.join(deliverablePaths.viewsDir, `${deliverableId}.html`);
  const slidesFile = path.join(deliverablePaths.viewsDir, `${deliverableId}.slides.json`);
  const shellText = readPromptPackText(renderPlan.shell_file);
  writeText(htmlFile, buildDeckHtml({
    title: contract.title,
    slidesMarkup,
    renderPlan,
    renderStrategy: renderPlan.render_strategy,
    shellText,
  }));
  writeJson(slidesFile, {
    title: contract.title,
    slides: slidesMarkup.map((slide) => ({
      slideId: slide.slide_id,
      title: slide.title,
      recipeId: slide.recipe_id,
      content: slide.content,
    })),
  });
  return {
    ...attachCommon('render_html', contract),
    creative_execution: creativeExecution(contract.lifecycle_model?.route_to_stage?.render_html || 'visual_authorship', generationRuntime),
    lifecycle_stage: contract.lifecycle_model?.route_to_stage?.render_html || 'visual_authorship',
    html_bundle: {
      html_file: htmlFile,
      slides_file: slidesFile,
      page_count: slidesMarkup.length,
      render_strategy: renderPlan.render_strategy,
      generator_instructions: renderPlan.generator_instructions,
      render_summary: normalizeStringList(data?.render_summary, 'render_html.render_summary', { min: 1, max: 4 }),
      shell_contract: {
        ratio: CANVAS.ratio,
        width: CANVAS.width,
        height: CANVAS.height,
        controls: ['slide-display-area', 'prev-btn', 'next-btn'],
      },
      slides: slidesMarkup,
    },
    artifact_refs: [htmlFile, slidesFile],
  };
}

async function generateDirectorReviewDraft(contract, deliverablePaths) {
  const renderArtifact = readStageArtifact(contract, deliverablePaths, 'render_html');
  const blueprintArtifact = readStageArtifact(contract, deliverablePaths, 'slide_blueprint');
  const visualArtifact = readStageArtifact(contract, deliverablePaths, 'visual_direction');
  const { data, generationRuntime } = await generateStructuredArtifactViaUpstreamHermes({
    family: 'ppt_deck',
    route: 'visual_director_review',
    promptRelativePath: PROMPT_PACK.visual_director_review,
    context: {
      ...buildAuthoringContext(contract),
      blueprint: {
        slides: summarizeBlueprintSlides(blueprintArtifact),
      },
      visual_direction: visualArtifact?.visual_direction || null,
      render_summary: safeArray(renderArtifact?.html_bundle?.slides).map((slide) => ({
        slide_id: slide.slide_id,
        title: slide.title,
        layout_family: slide.layout_family,
        peak_page: slide.director_contract?.peak_page,
        text_excerpt: normalizeInlineText(String(slide.content || '').replace(/<[^>]+>/g, ' '), 220),
      })),
    },
    outputContract: directorReviewOutputContract(),
  });
  return {
    data,
    generationRuntime,
  };
}

function ensurePrerequisites({ workspaceRoot, topicId, deliverableId, route, mode, baselineDeliverableId }) {
  const deliverablePaths = getDeliverablePaths(workspaceRoot, topicId, deliverableId);
  const contract = readJson(path.join(deliverablePaths.deliverableDir, 'contracts', 'hydrated-deliverable.json'));
  const missing = safeArray(STAGE_REQUIREMENTS[route]?.requires_artifacts)
    .filter((stageId) => !readStageArtifact(contract, deliverablePaths, stageId));
  if (missing.length > 0) {
    throw new Error(`Route ${route} requires completed stage artifacts: ${missing.join(', ')}`);
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
  if (route === 'export_pptx') {
    const reviewArtifact = readStageArtifact(contract, deliverablePaths, 'screenshot_review');
    if (!reviewArtifact || reviewArtifact.status !== 'pass') {
      throw new Error('Route export_pptx requires screenshot_review to pass before export');
    }
  }
}

function runPython(script, args) {
  if (!existsSync(script)) {
    throw new Error(`Missing ppt_deck python helper: ${script}`);
  }
  const pythonCommand = resolveRedCubePythonCommand();
  const result = spawnSync(pythonCommand.command, [script, ...args], { encoding: 'utf-8', maxBuffer: 16 * 1024 * 1024 });
  if (result.status !== 0) {
    throw new Error((result.stderr || result.stdout || `ppt_deck python helper failed: ${script}`).trim());
  }
  return {
    command: pythonCommand.command,
    payload: JSON.parse(result.stdout),
  };
}

function computeSlideReview(page, blueprintSlide, maxPrimaryPoints) {
  const metrics = {
    text_char_count: Number(page.text_chars || page.metrics?.text_char_count || 0),
    block_count: Number(page.zone_count || page.metrics?.block_count || 0),
    overlap_pairs: Number(page.overlap_pairs || page.metrics?.overlap_pairs || 0),
    clipped_nodes: Number(page.clipped_nodes || page.metrics?.clipped_nodes || 0),
  };
  const overflowFree = Boolean(page.overflow_free);
  const occlusionFree = metrics.clipped_nodes === 0 && metrics.overlap_pairs === 0;
  const visualDensityOk = metrics.block_count <= maxPrimaryPoints + 4 && metrics.text_char_count <= 340;
  const speakerFitOk = Number(blueprintSlide?.speaker_seconds || 0) >= 20 && Number(blueprintSlide?.speaker_seconds || 0) <= 120;
  const issues = [];
  if (!overflowFree) issues.push('overflow_detected');
  if (!occlusionFree) issues.push('occlusion_detected');
  if (!visualDensityOk) issues.push('visual_density_out_of_range');
  if (!speakerFitOk) issues.push('speaker_fit_out_of_range');
  return {
    slide_id: page.slide_id,
    title: page.title,
    layout_family: blueprintSlide?.visual_presentation?.layout_family || '',
    screenshot_file: page.screenshot_path,
    status: issues.length === 0 ? 'pass' : 'block',
    checks: {
      overflow_free: overflowFree,
      occlusion_free: occlusionFree,
      visual_density_ok: visualDensityOk,
      speaker_fit_ok: speakerFitOk,
    },
    metrics: {
      text_char_count: metrics.text_char_count,
      block_count: metrics.block_count,
      overlap_pairs: metrics.overlap_pairs,
    },
    issues,
  };
}

function summarizeChecks(slideReviews, contract) {
  const base = {
    overflow_free: slideReviews.every((slide) => slide.checks.overflow_free),
    occlusion_free: slideReviews.every((slide) => slide.checks.occlusion_free),
    visual_density_ok: slideReviews.every((slide) => slide.checks.visual_density_ok),
    speaker_fit_ok: slideReviews.every((slide) => slide.checks.speaker_fit_ok),
  };
  for (const check of extraChecks(contract)) {
    base[check] = true;
  }
  return base;
}

function baselineComparison({ workspaceRoot, topicId, baselineDeliverableId, slideReviews }) {
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
  const relativeQuality = compareFailuresAndDensity({
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

function buildReviewMarkdown(contract, reviewArtifact) {
  const lines = [
    `# ${contract.title} 视觉质控`,
    '',
    `- 状态：${reviewArtifact.status}`,
    `- director_intent_landed：${reviewArtifact.checks.director_intent_landed}`,
    `- anti_template_ok：${reviewArtifact.checks.anti_template_ok}`,
    `- overflow_free：${reviewArtifact.checks.overflow_free}`,
    `- occlusion_free：${reviewArtifact.checks.occlusion_free}`,
    `- visual_density_ok：${reviewArtifact.checks.visual_density_ok}`,
    `- speaker_fit_ok：${reviewArtifact.checks.speaker_fit_ok}`,
  ];
  if (Object.hasOwn(reviewArtifact.checks, 'baseline_comparison_passed')) {
    lines.push(`- baseline_comparison_passed：${reviewArtifact.checks.baseline_comparison_passed}`);
  }
  lines.push('', '## 分页记录');
  for (const slide of reviewArtifact.slide_reviews) {
    lines.push(`- ${slide.slide_id} / ${slide.layout_family} / ${slide.status} / ${slide.screenshot_file}`);
  }
  if (reviewArtifact.baseline_review?.summary) {
    lines.push('', '## Baseline Relative Review', reviewArtifact.baseline_review.summary);
  }
  return `${lines.join('\n')}\n`;
}

async function buildDirectorReview(contract, deliverablePaths) {
  const { data, generationRuntime } = await generateDirectorReviewDraft(contract, deliverablePaths);
  const directorIntentLanded = Boolean(data?.director_intent_landed);
  const antiTemplateOk = Boolean(data?.anti_template_ok);
  const memoryHookPresent = Boolean(data?.memory_hook_present);
  const peakPagesLanded = Boolean(data?.peak_pages_landed ?? true);
  const weakPages = normalizeStringList(data?.weak_pages, 'visual_director_review.weak_pages', { min: 0, max: 4 });
  const homogeneousLayoutRisk = Number(data?.homogeneous_layout_risk || 0);
  const reviewSummary = requireText(data?.review_summary, 'visual_director_review.review_summary');
  const status = directorIntentLanded && antiTemplateOk && peakPagesLanded ? 'pass' : 'block';
  const reviewFile = path.join(deliverablePaths.reportsDir, `${deliverablePaths.deliverableId}_视觉总监复盘.md`);
  writeText(reviewFile, [
    '# 视觉总监复盘',
    '',
    '- review_owner: hermes_backed_runtime_substrate',
    `- director_intent_landed: ${directorIntentLanded}`,
    `- anti_template_ok: ${antiTemplateOk}`,
    `- peak_pages_landed: ${peakPagesLanded}`,
    `- memory_hook_present: ${memoryHookPresent}`,
    `- homogeneous_layout_risk: ${homogeneousLayoutRisk}`,
    `- weak_pages: ${weakPages.join(',') || 'none'}`,
    `- review_summary: ${reviewSummary || 'none'}`,
  ].join('\n'));
  return {
    ...attachCommon('visual_director_review', contract),
    review_execution: {
      ...creativeExecution('visual_director_review', generationRuntime),
      overlay: 'visual_director_review',
    },
    review_overlay: 'visual_director_review',
    status,
    visual_director_review: {
      review_model: 'director_first_visual_judgement',
      director_intent_landed: directorIntentLanded,
      anti_template_ok: antiTemplateOk,
      peak_pages_landed: peakPagesLanded,
      memory_hook_present: memoryHookPresent,
      weak_pages: weakPages,
      homogeneous_layout_risk: homogeneousLayoutRisk,
      review_summary: reviewSummary,
      rewrite_action: safeText(data?.rewrite_action) || (status === 'pass' ? 'none' : 'revise_render_html'),
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
      latest_checks: {
        director_intent_landed: directorIntentLanded,
        anti_template_ok: antiTemplateOk,
        memory_hook_present: memoryHookPresent,
      },
      pending_reviews: status === 'pass' ? [] : ['director_intent_landed', 'anti_template_ok'],
      blocking_reasons: status === 'pass' ? [] : ['director_intent_landed', 'anti_template_ok'],
      rerun_from_stage: status === 'pass' ? null : 'render_html',
      rerun_policy: {
        status: status === 'pass' ? 'idle' : 'rerun_required',
        rerun_from_stage: status === 'pass' ? null : 'render_html',
      },
    },
  };
}

function buildScreenshotReviewArtifact({ workspaceRoot, topicId, deliverableId, contract, mode, baselineDeliverableId }) {
  const deliverablePaths = getDeliverablePaths(workspaceRoot, topicId, deliverableId);
  const renderArtifact = readStageArtifact(contract, deliverablePaths, 'render_html');
  const blueprintArtifact = readStageArtifact(contract, deliverablePaths, 'slide_blueprint');
  const storylineArtifact = readStageArtifact(contract, deliverablePaths, 'storyline');
  const directorReviewArtifact = readStageArtifact(contract, deliverablePaths, 'visual_director_review');
  const reviewMarkdown = path.join(deliverablePaths.reportsDir, `${deliverableId}_视觉质控.md`);
  const screenshotsDir = ensureDir(path.join(deliverablePaths.reportsDir, 'screenshots'));
  const args = [
    '--html', renderArtifact.html_bundle.html_file,
    '--output-dir', screenshotsDir,
    '--review-markdown', reviewMarkdown,
    '--max-primary-points', String(contract.layout_rules?.max_primary_points_per_slide || 5),
  ];
  if (mode === 'optimize_existing') {
    const baselinePaths = getDeliverablePaths(workspaceRoot, topicId, baselineDeliverableId);
    const baselineContract = readJson(path.join(baselinePaths.deliverableDir, 'contracts', 'hydrated-deliverable.json'));
    const baselineArtifact = readStageArtifact(baselineContract, baselinePaths, 'screenshot_review');
    if (!baselineArtifact) {
      throw new Error(`Baseline screenshot review artifact missing: ${baselineDeliverableId}`);
    }
    args.push('--baseline-review', stageArtifactPath(baselineContract, baselinePaths, 'screenshot_review'));
  }
  const python = runPython(PYTHON_REVIEW, args);
  const reviewPayload = python.payload;
  const latestChecks = {
    director_intent_landed: Boolean(directorReviewArtifact?.visual_director_review?.director_intent_landed),
    anti_template_ok: Boolean(directorReviewArtifact?.visual_director_review?.anti_template_ok),
    ...reviewPayload.checks,
    ...deriveProfileChecks(contract, blueprintArtifact, storylineArtifact),
  };
  const status = Object.values(latestChecks).every((value) => value === true) ? 'pass' : 'block';
  const artifact = {
    ...attachCommon('screenshot_review', contract),
    mode,
    status,
    checks: latestChecks,
    slide_reviews: reviewPayload.slide_reviews,
    report_markdown: reviewPayload.review_markdown || reviewMarkdown,
    metrics: reviewPayload.metrics,
    artifact_refs: [reviewPayload.review_markdown || reviewMarkdown, ...reviewPayload.slide_reviews.map((slide) => slide.screenshot_file)],
    review_state_patch: {
      current_status: status === 'pass' ? 'export_ready' : 'blocked_for_revision',
      ready_for_export: status === 'pass',
      latest_review_stage: 'screenshot_review',
      latest_checks: latestChecks,
      pending_reviews: status === 'pass' ? [] : Object.entries(latestChecks).filter(([, value]) => value === false).map(([key]) => key),
      blocking_reasons: status === 'pass' ? [] : Object.entries(latestChecks).filter(([, value]) => value === false).map(([key]) => key),
      rerun_from_stage: status === 'pass' ? null : 'render_html',
      rerun_policy: {
        status: status === 'pass' ? 'idle' : 'rerun_required',
        rerun_from_stage: status === 'pass' ? null : 'render_html',
      },
    },
  };
  if (mode === 'optimize_existing' && reviewPayload.baseline) {
    const relativeQuality = compareFailuresAndDensity({
      currentFailures: reviewPayload.baseline.current_failed_slides,
      baselineFailures: reviewPayload.baseline.baseline_failed_slides,
      currentDensity: reviewPayload.baseline.current_average_density,
      baselineDensity: reviewPayload.baseline.baseline_average_density,
      densityTolerance: 0.08,
      densityDigits: 4,
      densityLabel: '平均占用率',
    });
    artifact.baseline_review = {
      baseline_deliverable_id: baselineDeliverableId,
      ...reviewPayload.baseline,
      relative_quality: relativeQuality,
      summary: summarizeRelativeQuality(relativeQuality),
    };
  }
  return artifact;
}

function buildExportArtifact({ workspaceRoot, topicId, deliverableId, contract }) {
  const deliverablePaths = getDeliverablePaths(workspaceRoot, topicId, deliverableId);
  const reviewArtifact = readStageArtifact(contract, deliverablePaths, 'screenshot_review');
  const renderArtifact = readStageArtifact(contract, deliverablePaths, 'render_html');
  const publishDir = ensureDir(path.join(deliverablePaths.deliverableDir, 'publish'));
  const pptxFile = path.join(publishDir, `${deliverableId}.pptx`);
  const pdfFile = path.join(publishDir, `${deliverableId}.pdf`);
  const notesFile = path.join(publishDir, `${deliverableId}-presenter-notes.md`);
  const blueprintArtifact = readStageArtifact(contract, deliverablePaths, 'slide_blueprint');
  writeText(notesFile, blueprintArtifact.slide_blueprint.slides.map((slide) => `## ${slide.slide_id} ${slide.title}\n\n${slide.speaker_notes}`).join('\n\n'));
  const screenshotsDir = path.join(deliverablePaths.reportsDir, 'screenshots');
  const python = runPython(PYTHON_EXPORT, [
    '--screenshots-dir', screenshotsDir,
    '--output-pptx', pptxFile,
    '--output-pdf', pdfFile,
  ]);
  const exportPayload = python.payload;
  const pptxPath = exportPayload.pptx_file || exportPayload.pptx_path;
  const pdfPath = exportPayload.pdf_file || exportPayload.pdf_path;
  return {
    ...attachCommon('export_pptx', contract),
    status: 'completed',
    review_state_patch: {
      current_status: 'completed',
      ready_for_export: true,
      latest_review_stage: 'export_pptx',
      pending_reviews: [],
      blocking_reasons: [],
      rerun_from_stage: null,
      rerun_policy: {
        status: 'idle',
        rerun_from_stage: null,
      },
    },
    export_bundle: {
      source_html: renderArtifact.html_bundle.html_file,
      pptx_file: pptxPath,
      pdf_file: pdfPath,
      presenter_notes_file: notesFile,
      delivery_state: {
        current: 'output_ready',
        next: null,
      },
      page_count: exportPayload.page_count,
      page_count_match: exportPayload.page_count === renderArtifact.html_bundle.page_count,
      real_conversion_invocation: {
        tool: python.command,
        script: 'packages/redcube-runtime/scripts/ppt_deck_export.py',
        command: ['--screenshots-dir', screenshotsDir, '--output-pptx', pptxFile, '--output-pdf', pdfFile],
      },
    },
    artifact_refs: [pptxPath, pdfPath, notesFile].filter(Boolean),
  };
}

export function canRunPptDeck(contract) {
  return contract?.deliverable_kind === 'ppt_deck';
}

/**
 * @param {{
 *   workspaceRoot: string,
 *   topicId: string,
 *   deliverableId: string,
 *   route: string,
 *   contract: { deliverable_kind?: string, profile_id?: string, stage_sequence?: { stages?: Array<{ stage_id?: string }> } },
 *   mode?: string,
 *   baselineDeliverableId?: string,
 * }} input
 * @returns {Promise<PptRouteArtifact>}
 */
export async function runPptDeckRoute({ workspaceRoot, topicId, deliverableId, route, contract, mode = 'draft_new', baselineDeliverableId = '' }) {
  ensurePrerequisites({ workspaceRoot, topicId, deliverableId, route, mode, baselineDeliverableId });
  const deliverablePaths = getDeliverablePaths(workspaceRoot, topicId, deliverableId);
  const stageContract = safeArray(contract.stage_sequence?.stages).find((stage) => stage?.stage_id === route) || null;
  let payload;
  switch (route) {
    case 'storyline':
      payload = await buildStoryline(contract);
      break;
    case 'detailed_outline': {
      const storylineArtifact = readStageArtifact(contract, deliverablePaths, 'storyline');
      const { authoredOutline, generationRuntime } = await generateOutlineDraft(contract, storylineArtifact);
      payload = buildPptDetailedOutlineArtifact({
        contract,
        attachCommon,
        authoredOutline,
        generationRuntime,
        lifecycleStage: lifecycleStageForRoute(contract, 'detailed_outline') || 'story_architecture',
        materializedFrom: CREATIVE_MATERIALIZED_FROM,
      });
      break;
    }
    case 'slide_blueprint': {
      const outlineArtifact = readStageArtifact(contract, deliverablePaths, 'detailed_outline');
      const { authoredBlueprint, generationRuntime } = await generateBlueprintDraft(contract, outlineArtifact);
      payload = buildPptSlideBlueprintArtifact({
        contract,
        attachCommon,
        authoredBlueprint,
        generationRuntime,
        lifecycleStage: lifecycleStageForRoute(contract, 'slide_blueprint') || 'story_architecture',
        materializedFrom: CREATIVE_MATERIALIZED_FROM,
        canvas: CANVAS,
        bannedRenderTokens: BANNED_RENDER_TOKENS,
      });
      break;
    }
    case 'visual_direction': {
      const blueprintArtifact = readStageArtifact(contract, deliverablePaths, 'slide_blueprint');
      const { authoredVisualDirection, generationRuntime } = await generateVisualDirectionDraft(
        contract,
        blueprintArtifact,
        mode,
        baselineDeliverableId,
      );
      payload = buildPptVisualDirectionArtifact({
        contract,
        blueprintArtifact,
        authoredVisualDirection,
        attachCommon,
        generationRuntime,
        lifecycleStage: lifecycleStageForRoute(contract, 'visual_direction') || 'visual_authorship',
        materializedFrom: CREATIVE_MATERIALIZED_FROM,
        baselineDeliverableId,
        mode,
        sharedSourceConfidence: sharedSourceConfidence(contract),
      });
      break;
    }
    case 'render_html':
      payload = await buildRenderHtmlArtifact({ deliverableId, contract, deliverablePaths });
      break;
    case 'visual_director_review':
      payload = await buildDirectorReview(contract, deliverablePaths);
      break;
    case 'screenshot_review':
      payload = buildScreenshotReviewArtifact({ workspaceRoot, topicId, deliverableId, contract, mode, baselineDeliverableId });
      break;
    case 'export_pptx':
      payload = buildExportArtifact({ workspaceRoot, topicId, deliverableId, contract });
      break;
    default:
      throw new Error(`Unsupported ppt_deck route: ${route}`);
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
            defaultSourceLabels: sharedSourceLabels(contract),
          }),
        }
      : {}),
    ...payload,
  };
}
