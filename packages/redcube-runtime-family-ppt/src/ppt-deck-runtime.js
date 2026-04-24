import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';

import {
  generateStructuredArtifactViaCodexCli,
} from '@redcube/codex-cli-client';
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
import {
  buildPptDetailedOutlineArtifact,
  buildPptSlideBlueprintArtifact,
  buildPptVisualDirectionArtifact,
} from './ppt-structured-artifact-builders.js';
import { createPptDeckAuthoringParts, createPptDeckStageParts } from './ppt-deck-runtime-family-parts/index.js';

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
  fix_html: 'prompts/ppt_deck/fix_html.md',
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
  fix_html: { requires_artifacts: ['render_html', 'screenshot_review'] },
  visual_director_review: { requires_artifacts: ['render_html'] },
  screenshot_review: { requires_artifacts: ['visual_director_review'] },
  export_pptx: { requires_artifacts: ['screenshot_review'], requires_review_pass: true },
});
const CANVAS = Object.freeze({ width: 1152, height: 648, ratio: '16:9' });
const RENDER_HTML_BATCH_SIZE = 1;
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
]);
const TARGETED_SCREENSHOT_RERUN_CHECKS = new Set([
  'ai_review_passed',
  'overflow_free',
  'occlusion_free',
  'visual_density_ok',
  'edge_clearance_ok',
  'block_content_fit_ok',
  'title_typography_ok',
]);
const ROUTE_TO_SOURCE_TRUTH_CONSUMPTION_ROLE = Object.freeze({
  storyline: 'story_architecture',
  detailed_outline: 'story_architecture',
  slide_blueprint: 'story_architecture',
  visual_direction: 'visual_authorship',
  fix_html: 'visual_authorship',
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

function safeText(value, fallback = '') {
  const text = String(value ?? '').replace(/\uFFFD+/g, '').trim();
  return text || fallback;
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function chunkArray(items, size) {
  const source = safeArray(items);
  const batchSize = Math.max(Number(size) || 1, 1);
  const batches = [];
  for (let index = 0; index < source.length; index += batchSize) {
    batches.push(source.slice(index, index + batchSize));
  }
  return batches;
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

function escapeHtmlAttribute(text) {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeTemplate(text) {
  return String(text || '').replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
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
    throw new Error(`ppt render_html slide missing data-slide-root=true: ${slideId}`);
  }
  let rootTag = rootTagMatch[0];
  for (const [name, value] of Object.entries(metadata || {})) {
    if (value === undefined || value === null || value === '') continue;
    rootTag = upsertHtmlAttribute(rootTag, name, value);
  }
  return String(html || '').replace(rootTagMatch[0], rootTag);
}

function validateRenderedReviewAnchors(html, slideId, familyLabel = 'ppt') {
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

function buildDeckHtml({ title, slidesMarkup, renderPlan, renderStrategy, shellText }) {
  const slidesLiteral = `\n[${slidesMarkup.map((slide) => `\n  { slideId: '${slide.slide_id}', slideNo: ${Number(slide.slide_no || 0)}, title: ${JSON.stringify(slide.title)}, layoutFamily: '${slide.layout_family}', recipeId: '${slide.recipe_id}', templateId: '${slide.template_id}', speakerSeconds: ${Number(slide.speaker_seconds || 0)}, peakPage: ${slide.director_contract?.peak_page ? 'true' : 'false'}, directorRole: ${JSON.stringify(slide.director_contract?.director_role || '')}, content: \`${escapeTemplate(slide.content)}\` }`).join(',')}\n]`;
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

function createReviewCapturePaths(deliverablePaths, deliverableId) {
  const captureId = `capture-${Date.now()}-${randomUUID().slice(0, 8)}`;
  const screenshotsDir = ensureDir(path.join(deliverablePaths.reportsDir, 'screenshots', captureId));
  return {
    captureId,
    screenshotsDir,
    reviewMarkdownFile: path.join(screenshotsDir, `${deliverableId}_视觉质控.md`),
  };
}

function readJson(file) {
  return JSON.parse(readFileSync(file, 'utf-8'));
}

function sanitizeSurfaceSegment(value, fallback = 'deliverable') {
  const text = safeText(value, fallback)
    .replace(/[\\/:*?"<>|]/g, ' ')
    .replace(/[：]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return text || fallback;
}

function getPptOperatorViewPaths({ deliverablePaths, contract, deliverableId }) {
  const operatorDir = path.join(deliverablePaths.viewsDir, 'operator');
  const chapterBaseName = sanitizeSurfaceSegment(contract?.title, deliverableId);
  return {
    operatorDir,
    chapterBaseName,
    storylineFile: path.join(operatorDir, '故事主线.md'),
    detailedOutlineFile: path.join(operatorDir, '详细大纲.md'),
    outlineDir: path.join(operatorDir, '大纲'),
    blueprintFile: path.join(operatorDir, '大纲', `${chapterBaseName}.md`),
    visualDirectionFile: path.join(operatorDir, '大纲', `${chapterBaseName}_视觉导演稿.md`),
    slidesDir: path.join(operatorDir, '幻灯片'),
    slidesReadmeFile: path.join(operatorDir, '幻灯片', 'README.md'),
    revisionBriefFile: path.join(operatorDir, '幻灯片', '当前返修要求.md'),
    referencesDir: path.join(operatorDir, '参考材料'),
    referenceIndexFile: path.join(operatorDir, '参考材料', '来源索引.md'),
    publishDir: path.join(deliverablePaths.deliverableDir, 'publish'),
    publishReadmeFile: path.join(deliverablePaths.deliverableDir, 'publish', 'README.md'),
    pptxFile: path.join(deliverablePaths.deliverableDir, 'publish', `${deliverableId}.pptx`),
    pdfFile: path.join(deliverablePaths.deliverableDir, 'publish', `${deliverableId}.pdf`),
    presenterNotesFile: path.join(deliverablePaths.deliverableDir, 'publish', `${deliverableId}-presenter-notes.md`),
  };
}

function getDeliverableViewSurfacePaths(deliverablePaths, deliverableId) {
  return {
    stableHtmlFile: path.join(deliverablePaths.viewsDir, `${deliverableId}.html`),
    stableSlidesFile: path.join(deliverablePaths.viewsDir, `${deliverableId}.slides.json`),
    draftHtmlFile: path.join(deliverablePaths.viewsDir, `${deliverableId}.draft.html`),
    draftSlidesFile: path.join(deliverablePaths.viewsDir, `${deliverableId}.draft.slides.json`),
  };
}

function ensurePptOperatorViewSurface(paths) {
  ensureDir(paths.operatorDir);
  ensureDir(paths.outlineDir);
  ensureDir(paths.slidesDir);
  ensureDir(paths.referencesDir);
  ensureDir(paths.publishDir);
}

function sourceIndexEntries(contract) {
  return safeArray(sharedSourceTruth(contract)?.source_index?.sources)
    .filter((source) => source?.status === 'ready' && !isOperatorContextMaterial(source))
    .map((source) => ({
      source_id: safeText(source.source_id),
      title: safeText(source.title),
      relative_path: safeText(source.relative_path),
      kind: safeText(source.kind),
    }));
}

function buildOperatorReferenceIndex(contract) {
  const lines = [
    '# 来源索引',
    '',
    `- 讲题：${safeText(contract?.title)}`,
    `- 交付目标：${safeText(contract?.goal)}`,
    '',
  ];
  const entries = sourceIndexEntries(contract);
  if (entries.length === 0) {
    lines.push('- 当前没有 audience-facing 来源文件。');
    return `${lines.join('\n')}\n`;
  }
  lines.push('## Audience-facing 来源');
  for (const entry of entries) {
    lines.push(`- ${entry.source_id || entry.kind || 'SRC'}：${entry.title || entry.relative_path || entry.kind}`);
  }
  return `${lines.join('\n')}\n`;
}

function markdownList(items = [], ordered = false) {
  return safeArray(items)
    .map((item, index) => `${ordered ? `${index + 1}.` : '-'} ${safeText(item)}`)
    .join('\n');
}

function buildOperatorStorylineMarkdown(contract, artifact) {
  const storyline = artifact?.storyline || {};
  const narrative = storyline?.narrative_arc || {};
  return [
    `# ${safeText(contract.title)} 故事主线`,
    '',
    '## 讲者与课堂契约',
    `- 讲者：${safeText(storyline.speaker)}`,
    `- 听众：${safeText(storyline.audience)}`,
    `- 目标：${safeText(storyline.goal || contract.goal)}`,
    `- 风格：${safeText(storyline.style)}`,
    '',
    '## 核心隐喻',
    safeText(storyline.core_metaphor),
    '',
    '## Hook',
    markdownList(narrative.hook),
    '',
    '## Journey',
    markdownList(narrative.journey, true),
    '',
    '## Resolution',
    markdownList(narrative.resolution),
    '',
    '## 事实锚点',
    `- 主题摘要：${safeText(storyline.fact_library_summary)}`,
    `- 来源充分性：${safeText(storyline.source_sufficiency_judgement)}`,
    `- 深调状态：${safeText(storyline.deep_research_state)}`,
    '',
  ].join('\n');
}

function buildOperatorDetailedOutlineMarkdown(contract, artifact) {
  const outline = artifact?.detailed_outline || {};
  const slides = safeArray(outline.slides);
  const lines = [
    `# ${safeText(contract.title)} 详细大纲`,
    '',
    `- 总页数：${safeText(outline?.page_budget?.total_slides, String(slides.length))}`,
    `- 交付目标：${safeText(contract.goal)}`,
    '',
    '## 章节结构',
  ];
  for (const chapter of safeArray(outline.chapter_structure)) {
    lines.push(`- ${safeText(chapter.chapter_id)}｜${safeText(chapter.title)}｜${safeText(chapter.slide_range)}`);
  }
  lines.push('', '## 逐页预算');
  for (const slide of slides) {
    lines.push(`### 幻灯片 ${safeText(slide.slide_no)} ${safeText(slide.title)}`);
    lines.push(`- 页面类型：${safeText(slide.page_type)}`);
    lines.push(`- 本页目标：${safeText(slide.page_goal)}`);
    lines.push(`- 核心句：${safeText(slide.core_sentence)}`);
    lines.push('- 证据点：');
    for (const point of safeArray(slide.evidence_points)) {
      lines.push(`  - ${safeText(point)}`);
    }
    lines.push('- 公开来源：');
    for (const source of safeArray(slide.public_sources)) {
      lines.push(`  - ${safeText(source)}`);
    }
    lines.push(`- 过渡句：${safeText(slide.transition_sentence)}`);
    lines.push('');
  }
  return `${lines.join('\n')}\n`;
}

function buildOperatorBlueprintMarkdown(contract, artifact) {
  const blueprint = artifact?.slide_blueprint || {};
  const slides = safeArray(blueprint.slides);
  const lines = [
    `# ${safeText(contract.title)}（Slides 01-${String(slides.length).padStart(2, '0')}）`,
    '',
    '## 本章目标',
    `- ${safeText(blueprint.chapter_goal)}`,
    `- ${safeText(contract.goal)}`,
    '',
    '---',
    '',
  ];
  for (const slide of slides) {
    lines.push(`幻灯片: ${String(slide.slide_no).padStart(2, '0')}`);
    lines.push(`页面类型: ${safeText(slide.page_type)}`);
    lines.push(`标题: ${safeText(slide.title)}`);
    lines.push(`本页目标: ${safeText(slide.page_goal)}`);
    lines.push('');
    lines.push('页面核心内容:');
    safeArray(slide.page_core_content).forEach((item, index) => {
      lines.push(`- 模块${index + 1}：${safeText(item?.text)}`);
    });
    lines.push('');
    lines.push('视觉呈现方式:');
    lines.push(`- 布局：${safeText(slide.visual_presentation?.layout_family)}`);
    lines.push(`- 图表：${safeText(slide.render_recipe_id)}`);
    lines.push(`- 配色：以视觉导演稿统一冻结，本页先保证 ${safeArray(slide.visual_presentation?.anchor_tracks).join(' / ')}`);
    lines.push(`- 素材引用方式：${safeArray(slide.evidence_and_sources).map((item) => safeText(item?.public_label)).filter(Boolean).join('；') || '按页放置公开来源芯片'}`);
    lines.push('');
    lines.push('角标与标识策略:');
    lines.push('- 页眉/页码：按页控制；默认右下角页码');
    lines.push('- 署名：默认封面显示，正文按页判断');
    lines.push('- 来源文字：仅证据页显示');
    lines.push('');
    lines.push('是否需要外部公开证据:');
    lines.push(`- ${safeArray(slide.evidence_and_sources).length > 0 ? '需要' : '不需要'}`);
    lines.push(`- 若需要：${safeArray(slide.evidence_and_sources).length > 0 ? '公开论文 / 综述 / 指南 / 项目文档' : 'none'}`);
    lines.push('');
    lines.push('证据与图源:');
    safeArray(slide.evidence_and_sources).forEach((item, index) => {
      lines.push(`- 来源${index + 1}：${safeText(item?.public_label)}`);
    });
    lines.push('');
    lines.push('讲稿:');
    lines.push(safeText(slide.speaker_notes));
    lines.push('');
    lines.push('过渡句:');
    lines.push(safeText(slide.transition_sentence));
    lines.push('', '---', '');
  }
  return `${lines.join('\n')}\n`;
}

function buildOperatorVisualDirectionMarkdown(contract, artifact) {
  const visual = artifact?.visual_direction || {};
  const typographyPlan = visual.typography_plan || {};
  const lines = [
    `# ${safeText(contract.title)}视觉导演稿`,
    '',
    '## 本章视觉宣言',
    `- 这一章像什么：${safeArray(visual.what_it_is).join(' / ')}`,
    `- 这一章不像什么：${safeArray(visual.what_it_is_not).join(' / ')}`,
    `- 目标气质：${safeText(visual.visual_manifest)}`,
    `- 默认退化风险：${safeArray(visual.forbidden_regressions).join(' / ')}`,
    '',
    '## 全章视觉总控',
    `- 视觉母题：${safeText(visual.visual_manifest)}`,
    `- 标题色 / 结论色 / 警示色：${safeText(visual.palette?.ink)} / ${safeText(visual.palette?.accent)} / ${safeText(visual.palette?.success)}`,
    `- 允许元素：${safeArray(visual.what_it_is).join(' / ')}`,
    `- 禁止元素：${safeArray(visual.what_it_is_not).join(' / ')}`,
    `- 字号梯度：cover ${safeText(typographyPlan.cover_title?.font_size)} / body ${safeText(typographyPlan.body_title?.font_size)} / card-title ${safeText(typographyPlan.card_title?.font_size)} / card-body ${safeText(typographyPlan.card_body?.font_size)} / meta ${safeText(typographyPlan.meta_label?.font_size)} / page-no ${safeText(typographyPlan.page_no?.font_size)}`,
    `- 页间连续性约束：${safeArray(visual.continuity_constraints).join('；')}`,
    `- 节奏曲线：${safeArray(visual.rhythm_curve).map((item) => `${safeText(item.slide_id)}=${safeText(item.role)}`).join('；')}`,
    `- 必须破格的关键页：${safeArray(visual.peak_pages).join(' / ')}`,
    `- 页面家族上限：${Object.entries(visual.page_family_ceiling || {}).map(([key, value]) => `${key}:${value}`).join('；')}`,
    '',
    '## 分页视觉角色表',
    '| 幻灯片 | 页面角色 | 首眼抓取点 | 第二视线 | 禁退化语法 |',
    '|---|---|---|---|---|',
  ];
  for (const row of safeArray(visual.page_role_table)) {
    lines.push(`| ${safeText(row.slide_id)} | ${safeText(row.page_role)} | ${safeText(row.first_glance)} | ${safeText(row.second_glance)} | ${safeArray(visual.forbidden_regressions).slice(0, 2).join(' / ')} |`);
  }
  lines.push('', '## 给 HTML 生成器的最终指令');
  for (const instruction of safeArray(visual.final_instruction_to_html_generator)) {
    lines.push(`- ${safeText(instruction)}`);
  }
  return `${lines.join('\n')}\n`;
}

function copySurfaceFile(source, destination) {
  if (!safeText(source) || !existsSync(source)) return null;
  ensureDir(path.dirname(destination));
  if (path.resolve(source) === path.resolve(destination)) return destination;
  cpSync(source, destination);
  return destination;
}

function safeReadJsonIfExists(file) {
  if (!safeText(file) || !existsSync(file)) return null;
  try {
    return readJson(file);
  } catch {
    return null;
  }
}

function extractFirstJsonCodeBlock(markdown) {
  const match = String(markdown || '').match(/```json\s*([\s\S]*?)\s*```/i);
  if (!match) return null;
  try {
    return JSON.parse(match[1]);
  } catch {
    return null;
  }
}

function normalizeOperatorRevisionBrief(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const slideFeedback = safeArray(value.slide_feedback)
    .map((item) => ({
      slide_id: safeText(item?.slide_id),
      issues: safeArray(item?.issues).map((issue) => safeText(issue)).filter(Boolean),
      keep: safeArray(item?.keep).map((entry) => safeText(entry)).filter(Boolean),
      avoid: safeArray(item?.avoid).map((entry) => safeText(entry)).filter(Boolean),
    }))
    .filter((item) => item.slide_id);
  const targetSlideIds = [...new Set([
    ...safeArray(value.target_slide_ids).map((slideId) => safeText(slideId)).filter(Boolean),
    ...slideFeedback.map((item) => item.slide_id),
  ])];
  const globalRequirements = safeArray(value.global_requirements)
    .map((item) => safeText(item))
    .filter(Boolean);
  if (targetSlideIds.length === 0 && globalRequirements.length === 0) {
    return null;
  }
  return {
    target_slide_ids: targetSlideIds,
    global_requirements: globalRequirements,
    slide_feedback: slideFeedback,
  };
}

function loadOperatorRevisionBrief({
  deliverablePaths,
  contract,
  minimumMtimeMs = 0,
}) {
  const paths = getPptOperatorViewPaths({
    deliverablePaths,
    contract,
    deliverableId: deliverablePaths.deliverableId,
  });
  if (!existsSync(paths.revisionBriefFile)) return null;
  if (safeFileMtimeMs(paths.revisionBriefFile) < Number(minimumMtimeMs || 0)) {
    return null;
  }
  const parsed = extractFirstJsonCodeBlock(readFileSync(paths.revisionBriefFile, 'utf-8'));
  return normalizeOperatorRevisionBrief(parsed);
}

function safeFileMtimeMs(file) {
  if (!safeText(file) || !existsSync(file)) return 0;
  try {
    return Number(statSync(file).mtimeMs || 0);
  } catch {
    return 0;
  }
}

function formatTimestamp(ms) {
  return ms ? new Date(ms).toISOString() : '无';
}

function derivePptStageArtifactFreshness({ contract, deliverablePaths }) {
  const requiredExportRoute = safeText(contract?.delivery_contract?.required_export_route, 'export_pptx');
  const exportArtifactFile = stageArtifactPath(contract, deliverablePaths, requiredExportRoute);
  const exportArtifactMtimeMs = safeFileMtimeMs(exportArtifactFile);
  return {
    requiredExportRoute,
    exportArtifactFile,
    exportArtifactMtimeMs,
    exportArtifact: safeReadJsonIfExists(exportArtifactFile),
  };
}

function currentHtmlSourceFile(contract, deliverablePaths) {
  const artifact = readCurrentHtmlArtifact(contract, deliverablePaths);
  return safeText(artifact?.html_bundle?.html_file);
}

function currentSlidesSourceFile(contract, deliverablePaths) {
  const artifact = readCurrentHtmlArtifact(contract, deliverablePaths);
  return safeText(artifact?.html_bundle?.slides_file);
}

function syncDeliverableViewDraft(paths, htmlFile, slidesFile) {
  const refs = [];
  const draftHtmlRef = copySurfaceFile(htmlFile, paths.draftHtmlFile);
  if (draftHtmlRef) refs.push(draftHtmlRef);
  const draftSlidesRef = copySurfaceFile(slidesFile, paths.draftSlidesFile);
  if (draftSlidesRef) refs.push(draftSlidesRef);
  return refs;
}

function seedDeliverableStableViews(paths, htmlFile, slidesFile) {
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

function promoteDeliverableStableViews(paths, htmlFile, slidesFile) {
  const refs = [];
  const stableHtmlRef = copySurfaceFile(htmlFile, paths.stableHtmlFile);
  if (stableHtmlRef) refs.push(stableHtmlRef);
  const stableSlidesRef = copySurfaceFile(slidesFile, paths.stableSlidesFile);
  if (stableSlidesRef) refs.push(stableSlidesRef);
  return refs;
}

function listStableRootScreenshotFiles(stableScreenshotsDir) {
  if (!existsSync(stableScreenshotsDir)) return [];
  return readdirSync(stableScreenshotsDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && /^slide-\d+\.(png|jpe?g)$/i.test(entry.name))
    .map((entry) => path.join(stableScreenshotsDir, entry.name));
}

function stableLatestCaptureFile(deliverablePaths) {
  return path.join(deliverablePaths.reportsDir, 'screenshots', 'latest-capture.json');
}

function writeStableLatestCapturePointer(deliverablePaths, reviewCapture, slideCount) {
  if (!reviewCapture || typeof reviewCapture !== 'object') return null;
  const captureId = safeText(reviewCapture.capture_id);
  const reviewMarkdownFile = safeText(reviewCapture.review_markdown_file);
  if (!captureId || !reviewMarkdownFile) return null;
  const latestCaptureFile = stableLatestCaptureFile(deliverablePaths);
  writeJson(latestCaptureFile, {
    capture_id: captureId,
    review_markdown_file: reviewMarkdownFile,
    slide_count: Number(slideCount || 0),
  });
  return latestCaptureFile;
}

function syncStableScreenshotSurface(deliverablePaths, captureScreenshotsDir, { promote = false, seedIfMissing = false } = {}) {
  const sourceDir = safeText(captureScreenshotsDir);
  if (!sourceDir || !existsSync(sourceDir)) return [];
  const stableScreenshotsDir = ensureDir(path.join(deliverablePaths.reportsDir, 'screenshots'));
  const sourceFiles = readdirSync(sourceDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && /^slide-\d+\.(png|jpe?g)$/i.test(entry.name))
    .map((entry) => path.join(sourceDir, entry.name));
  if (sourceFiles.length === 0) return [];
  const stableFiles = listStableRootScreenshotFiles(stableScreenshotsDir);
  const shouldSync = promote || (seedIfMissing && stableFiles.length === 0);
  if (!shouldSync) return [];
  for (const file of stableFiles) {
    rmSync(file, { force: true });
  }
  return sourceFiles
    .map((file) => copySurfaceFile(file, path.join(stableScreenshotsDir, path.basename(file))))
    .filter(Boolean);
}

function buildOperatorSlidesSurfaceState({ contract, deliverablePaths, viewSurfacePaths, latestReviewStatusOverride = '' }) {
  const screenshotReviewArtifact = safeReadJsonIfExists(
    stageArtifactPath(contract, deliverablePaths, 'screenshot_review'),
  );
  return {
    reviewed_html_ready: existsSync(viewSurfacePaths.stableHtmlFile),
    has_pending_draft: existsSync(viewSurfacePaths.draftHtmlFile),
    latest_review_status: safeText(latestReviewStatusOverride, safeText(screenshotReviewArtifact?.status, 'none')),
    stable_html_name: path.basename(viewSurfacePaths.stableHtmlFile),
    draft_html_name: path.basename(viewSurfacePaths.draftHtmlFile),
  };
}

function buildOperatorSlidesReadmeMarkdown(contract, slidesState) {
  return [
    '# 幻灯片目录说明',
    '',
    `- 讲题：${safeText(contract?.title)}`,
    `- 默认 HTML：${safeText(slidesState?.stable_html_name, 'none')}`,
    `- 草稿 HTML：${slidesState?.has_pending_draft ? safeText(slidesState?.draft_html_name, 'none') : 'none'}`,
    `- 最近一次截图质控：${safeText(slidesState?.latest_review_status, 'none')}`,
    '',
    '规则：',
    '- 只有当 `screenshot_review` 通过时，最新候选 HTML 才能替换默认 `.html`。',
    '- 如果 `screenshot_review` 被 block，当前候选会继续保留在 `.draft.html`，默认 `.html` 不会被失败版本覆盖。',
    '- 在还没有任何通过版之前，默认 `.html` 只是当前预览基线，不代表已经通过截图质控。',
    '- `.draft.html` 只表示 `render_html / fix_html` 之后、下一轮 `screenshot_review` 之前的待审稿，不应直接当作已质控成品。',
    '- 这里保留 audience-facing HTML 与视觉质控文稿，不应放内部备课提示或流程说明。',
    '',
  ].join('\n');
}

function buildPublishReadmeMarkdown(contract, exportState) {
  if (exportState.currentExportReady && exportState.hasCurrentExportFiles) {
    return [
      '# publish 目录说明',
      '',
      `- 讲题：${safeText(contract?.title)}`,
      '- 当前导出状态：current_export_ready',
      `- 最近一次 export artifact：${formatTimestamp(exportState.exportArtifactMtimeMs)}`,
      '',
      '规则：',
      '- 当前目录中的 `.pptx / .pdf / presenter-notes` 就是当前可交付版本。',
      '- 当前是否仍可直接交付，以 topic 的 publication projection surface 与 deliverable 的 `review-state.json` 为准。',
      '',
    ].join('\n');
  }

  if (exportState.hasAnyExportFiles) {
    return [
      '# publish 目录说明',
      '',
      `- 讲题：${safeText(contract?.title)}`,
      '- 当前导出状态：last_export_available',
      `- 最近一次 export artifact：${formatTimestamp(exportState.exportArtifactMtimeMs)}`,
      '',
      '规则：',
      '- 最近一次导出的 `.pptx / .pdf / presenter-notes` 仍保留在当前目录，便于继续审阅、对照和补修。',
      '- 这些文件可能落后于最新 HTML 与截图质控；是否仍可直接交付，以 topic 的 publication projection surface 与 deliverable 的 `review-state.json` 为准。',
      '',
    ].join('\n');
  }

  return [
    '# publish 目录说明',
    '',
    `- 讲题：${safeText(contract?.title)}`,
    '- 当前导出状态：no_current_export',
    `- 最近一次 export artifact：${formatTimestamp(exportState.exportArtifactMtimeMs)}`,
    '',
    '规则：',
    '- 当前没有可交付 PPTX；如果你看到 `archive/` 下的旧文件，那只是历史导出留痕。',
    '- 上游 stage 一旦重跑，旧导出会从当前目录退场，直到新的 `export_pptx` 完成。',
      '',
    ].join('\n');
}

function buildPublishSurfaceState({ route, contract, deliverablePaths, publishPaths, payload }) {
  const freshness = derivePptStageArtifactFreshness({ contract, deliverablePaths });
  const currentExportReady = route === freshness.requiredExportRoute;
  const routeExportMtimeMs = currentExportReady
    ? Math.max(
      safeFileMtimeMs(payload?.export_bundle?.pptx_file),
      safeFileMtimeMs(payload?.export_bundle?.pdf_file),
      safeFileMtimeMs(payload?.export_bundle?.presenter_notes_file),
    )
    : 0;
  return {
    ...freshness,
    currentExportReady,
    hasCurrentExportFiles: [publishPaths.pptxFile, publishPaths.pdfFile, publishPaths.presenterNotesFile]
      .every((file) => existsSync(file)),
    hasAnyExportFiles: [publishPaths.pptxFile, publishPaths.pdfFile, publishPaths.presenterNotesFile]
      .some((file) => existsSync(file)),
    exportArtifactMtimeMs: routeExportMtimeMs || freshness.exportArtifactMtimeMs,
  };
}

function syncPptCanonicalSurface({ workspaceRoot, topicId, contract, deliverableId, route, payload }) {
  const deliverablePaths = getDeliverablePaths(workspaceRoot, topicId, deliverableId);
  const operatorPaths = getPptOperatorViewPaths({ deliverablePaths, contract, deliverableId });
  const viewSurfacePaths = getDeliverableViewSurfacePaths(deliverablePaths, deliverableId);
  ensurePptOperatorViewSurface(operatorPaths);
  const refs = [];
  writeText(operatorPaths.referenceIndexFile, buildOperatorReferenceIndex(contract));
  refs.push(operatorPaths.referenceIndexFile);
  switch (route) {
    case 'storyline':
      writeText(operatorPaths.storylineFile, buildOperatorStorylineMarkdown(contract, payload));
      refs.push(operatorPaths.storylineFile);
      break;
    case 'detailed_outline':
      writeText(operatorPaths.detailedOutlineFile, buildOperatorDetailedOutlineMarkdown(contract, payload));
      refs.push(operatorPaths.detailedOutlineFile);
      break;
    case 'slide_blueprint':
      writeText(operatorPaths.blueprintFile, buildOperatorBlueprintMarkdown(contract, payload));
      refs.push(operatorPaths.blueprintFile);
      break;
    case 'visual_direction':
      writeText(operatorPaths.visualDirectionFile, buildOperatorVisualDirectionMarkdown(contract, payload));
      refs.push(operatorPaths.visualDirectionFile);
      break;
    case 'screenshot_review': {
      const sourceHtmlFile = currentHtmlSourceFile(contract, deliverablePaths);
      const sourceSlidesFile = currentSlidesSourceFile(contract, deliverablePaths);
      const captureScreenshotsDir = safeText(payload?.review_capture?.screenshots_dir);
      if (safeText(payload?.status) === 'pass') {
        refs.push(...promoteDeliverableStableViews(viewSurfacePaths, sourceHtmlFile, sourceSlidesFile));
        refs.push(...syncStableScreenshotSurface(deliverablePaths, captureScreenshotsDir, { promote: true, seedIfMissing: true }));
        const latestCaptureRef = writeStableLatestCapturePointer(
          deliverablePaths,
          payload?.review_capture,
          safeArray(payload?.slide_reviews).length,
        );
        if (latestCaptureRef) refs.push(latestCaptureRef);
      } else {
        refs.push(...syncDeliverableViewDraft(viewSurfacePaths, sourceHtmlFile, sourceSlidesFile));
        refs.push(...syncStableScreenshotSurface(deliverablePaths, captureScreenshotsDir, { seedIfMissing: true }));
      }
      break;
    }
    default:
      break;
  }
  const slidesState = buildOperatorSlidesSurfaceState({
    contract,
    deliverablePaths,
    viewSurfacePaths,
    latestReviewStatusOverride: route === 'screenshot_review' ? safeText(payload?.status) : '',
  });
  writeText(operatorPaths.slidesReadmeFile, buildOperatorSlidesReadmeMarkdown(contract, slidesState));
  refs.push(operatorPaths.slidesReadmeFile);
  const publishState = buildPublishSurfaceState({
    route,
    contract,
    deliverablePaths,
    publishPaths: operatorPaths,
    payload,
  });
  writeText(operatorPaths.publishReadmeFile, buildPublishReadmeMarkdown(contract, publishState));
  refs.push(operatorPaths.publishReadmeFile);
  return refs;
}

function appendArtifactRefs(payload, extraRefs) {
  if (safeArray(extraRefs).length === 0) {
    return payload;
  }
  return {
    ...payload,
    artifact_refs: [...new Set([...safeArray(payload?.artifact_refs), ...extraRefs])],
  };
}

function invalidateDownstreamReviewPatch(route) {
  if (!['storyline', 'detailed_outline', 'slide_blueprint', 'visual_direction', 'render_html', 'fix_html'].includes(route)) {
    return null;
  }
  return {
    current_status: 'draft',
    ready_for_export: false,
    latest_review_stage: route,
    pending_reviews: [],
    blocking_reasons: [],
    rerun_from_stage: null,
    rerun_policy: {
      status: 'idle',
      rerun_from_stage: null,
    },
  };
}

function attachRouteReviewReset(payload, route) {
  const reviewStatePatch = invalidateDownstreamReviewPatch(route);
  if (!reviewStatePatch) return payload;
  return {
    ...payload,
    review_state_patch: {
      ...reviewStatePatch,
      ...(payload?.review_state_patch || {}),
    },
  };
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

function currentHtmlStageId(contract, deliverablePaths) {
  const renderArtifactFile = stageArtifactPath(contract, deliverablePaths, 'render_html');
  const fixArtifactFile = stageArtifactPath(contract, deliverablePaths, PAGE_FIX_ROUTE);
  const renderMtimeMs = safeFileMtimeMs(renderArtifactFile);
  const fixMtimeMs = safeFileMtimeMs(fixArtifactFile);
  if (fixMtimeMs > renderMtimeMs) {
    return PAGE_FIX_ROUTE;
  }
  return 'render_html';
}

function readCurrentHtmlArtifact(contract, deliverablePaths) {
  return readStageArtifact(contract, deliverablePaths, currentHtmlStageId(contract, deliverablePaths));
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

function isOperatorContextMaterial(material) {
  const kind = safeText(material?.kind);
  return safeText(material?.source_role) === 'operator_context'
    || kind === 'brief'
    || kind === 'keywords';
}

function sharedSourceTruth(contract) {
  return contract?.shared_source_truth || null;
}

function sharedSourceReadinessPack(contract) {
  return sharedSourceTruth(contract)?.source_readiness_pack || null;
}

function sharedSourceMaterials(contract) {
  return safeArray(sharedSourceTruth(contract)?.extracted_materials?.materials)
    .filter((material) => !isOperatorContextMaterial(material));
}

function sharedOperatorMaterials(contract) {
  return safeArray(sharedSourceTruth(contract)?.extracted_materials?.materials)
    .filter((material) => isOperatorContextMaterial(material));
}

function audienceFacingMaterials(contract) {
  return sharedSourceMaterials(contract);
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
    .filter((source) => source.status === 'ready' && !isOperatorContextMaterial(source))
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
  const materialCorpus = sharedSourceMaterials(contract)
    .map((material) => extractAudienceFacingSnippet(material.content_text, 240))
    .filter(Boolean)
    .join(' ');
  const corpus = materialCorpus || safeText(sharedSourceTruth(contract)?.source_brief?.brief_text);
  if (/同行|同仁|peer|科研/.test(corpus)) return '临床科研同行';
  if (/管理|决策/.test(corpus)) return '医院管理层';
  if (/学生|本科|住院|学员/.test(corpus)) return '医学生与住院学员';
  return safeText(fallback, '专业听众');
}

function resolveSpeakerIdentity(contract, fallback) {
  const operatorCorpus = sharedOperatorMaterials(contract)
    .map((material) => material?.content_text || material?.excerpt || '')
    .join('\n');
  const patterns = [
    /讲者署名[:：]\s*([^\n]+)/i,
    /署名[:：]\s*([^\n]+)/i,
    /讲者[:：]\s*([^\n]+)/i,
    /speaker(?:_identity|_signature|_name)?[:：]\s*([^\n]+)/i,
  ];
  for (const pattern of patterns) {
    const match = operatorCorpus.match(pattern);
    const candidate = safeText(match?.[1] || '');
    if (candidate) {
      return candidate.replace(/\s+/g, ' ').trim();
    }
  }
  return safeText(fallback, '正式讲者');
}

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

function slideNeedsTargetedRevision(slide) {
  if (!slide || typeof slide !== 'object') return false;
  if (safeText(slide?.status) === 'block') return true;
  if (hasAiVisualBlock(slide?.ai_review)) return true;
  const mechanicalIssues = safeArray(slide?.mechanical_issues).length > 0
    ? safeArray(slide?.mechanical_issues)
    : safeArray(slide?.issues);
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
  PYTHON_EXPORT,
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
const {
  buildStoryline,
  generateBlueprintDraft,
  generateOutlineDraft,
  generateVisualDirectionDraft,
} = authoringParts;
const {
  buildDirectorReview,
  buildExportArtifact,
  buildRenderHtmlArtifact,
  buildScreenshotReviewArtifact,
  ensurePrerequisites,
} = stageParts;

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
export async function runPptDeckRoute({
  workspaceRoot,
  topicId,
  deliverableId,
  route,
  contract,
  mode = 'draft_new',
  baselineDeliverableId = '',
  adapter = CODEX_DEFAULT_ADAPTER,
}) {
  ensurePrerequisites({ workspaceRoot, topicId, deliverableId, route, mode, baselineDeliverableId });
  const deliverablePaths = getDeliverablePaths(workspaceRoot, topicId, deliverableId);
  const stageContract = safeArray(contract.stage_sequence?.stages).find((stage) => stage?.stage_id === route) || null;
  let payload;
  switch (route) {
    case 'storyline':
      payload = await buildStoryline(contract, adapter);
      break;
    case 'detailed_outline': {
      const storylineArtifact = readStageArtifact(contract, deliverablePaths, 'storyline');
      const { authoredOutline, generationRuntime } = await generateOutlineDraft(contract, storylineArtifact, adapter);
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
      const { authoredBlueprint, generationRuntime } = await generateBlueprintDraft(contract, outlineArtifact, adapter);
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
        adapter,
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
      payload = await buildRenderHtmlArtifact({ workspaceRoot, deliverableId, contract, deliverablePaths, adapter });
      break;
    case 'fix_html':
      payload = await buildRenderHtmlArtifact({
        workspaceRoot,
        deliverableId,
        contract,
        deliverablePaths,
        route: PAGE_FIX_ROUTE,
        adapter,
      });
      break;
    case 'visual_director_review':
      payload = await buildDirectorReview(contract, deliverablePaths, adapter);
      break;
    case 'screenshot_review':
      payload = await buildScreenshotReviewArtifact({
        workspaceRoot,
        topicId,
        deliverableId,
        contract,
        mode,
        baselineDeliverableId,
        adapter,
      });
      break;
    case 'export_pptx':
      payload = buildExportArtifact({ workspaceRoot, topicId, deliverableId, contract, adapter });
      break;
    default:
      throw new Error(`Unsupported ppt_deck route: ${route}`);
  }
  payload = attachRouteReviewReset(payload, route);
  payload = appendArtifactRefs(
    payload,
    syncPptCanonicalSurface({ workspaceRoot, topicId, contract, deliverableId, route, payload }),
  );
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
