import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
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
import { buildCodexExecutionModel } from '@redcube/hermes-substrate';
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
const RENDER_HTML_BATCH_SIZE = 3;
const SCREENSHOT_REVIEW_BATCH_SIZE = 3;
const BANNED_RENDER_TOKENS = ['renderSlide', 'layoutByType', 'cardsGrid', 'pageType'];
const CODEX_EXECUTION_MODEL = Object.freeze(buildCodexExecutionModel());
const CREATIVE_MATERIALIZED_FROM = 'codex_cli_json_output';
const MIN_REVIEW_QA_BLOCKS = 2;
const MIN_REVIEW_PRIMARY_POINTS = 1;
const HARD_SCREENSHOT_BLOCKING_ISSUES = new Set(['overflow_detected']);
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

function sanitizeWorkbenchSegment(value, fallback = 'deliverable') {
  const text = safeText(value, fallback)
    .replace(/[\\/:*?"<>|]/g, ' ')
    .replace(/[：]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return text || fallback;
}

function workbenchTaskDirCandidates(contract, deliverableId) {
  return [...new Set([
    sanitizeWorkbenchSegment(contract?.title, deliverableId),
    sanitizeWorkbenchSegment(deliverableId, 'deliverable'),
  ])];
}

function resolveWorkbenchTaskDir({ workspaceRoot, contract, deliverableId }) {
  const existing = workbenchTaskDirCandidates(contract, deliverableId)
    .map((candidate) => path.join(workspaceRoot, candidate))
    .find((candidate) => existsSync(candidate));
  return existing || path.join(workspaceRoot, workbenchTaskDirCandidates(contract, deliverableId)[0]);
}

function getWorkbenchSurfacePaths({ workspaceRoot, contract, deliverableId }) {
  const taskDir = resolveWorkbenchTaskDir({ workspaceRoot, contract, deliverableId });
  const chapterBaseName = sanitizeWorkbenchSegment(contract?.title, deliverableId);
  return {
    taskDir,
    chapterBaseName,
    storylineFile: path.join(taskDir, '故事主线.md'),
    detailedOutlineFile: path.join(taskDir, '详细大纲.md'),
    outlineDir: path.join(taskDir, '大纲'),
    blueprintFile: path.join(taskDir, '大纲', `${chapterBaseName}.md`),
    visualDirectionFile: path.join(taskDir, '大纲', `${chapterBaseName}_视觉导演稿.md`),
    slidesDir: path.join(taskDir, '幻灯片'),
    htmlFile: path.join(taskDir, '幻灯片', `${chapterBaseName}.html`),
    screenshotReviewFile: path.join(taskDir, '幻灯片', `${chapterBaseName}_视觉质控.md`),
    pptxDir: path.join(taskDir, 'pptx'),
    pptxFile: path.join(taskDir, 'pptx', `${chapterBaseName}.pptx`),
    pdfFile: path.join(taskDir, 'pptx', `${chapterBaseName}.pdf`),
    presenterNotesFile: path.join(taskDir, 'pptx', `${chapterBaseName}-presenter-notes.md`),
    referencesDir: path.join(taskDir, '参考材料'),
    referenceIndexFile: path.join(taskDir, '参考材料', '来源索引.md'),
  };
}

function ensureWorkbenchSurface(paths) {
  ensureDir(paths.taskDir);
  ensureDir(paths.outlineDir);
  ensureDir(paths.slidesDir);
  ensureDir(paths.pptxDir);
  ensureDir(paths.referencesDir);
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

function buildWorkbenchReferenceIndex(contract) {
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

function buildWorkbenchStorylineMarkdown(contract, artifact) {
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

function buildWorkbenchDetailedOutlineMarkdown(contract, artifact) {
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

function buildWorkbenchBlueprintMarkdown(contract, artifact) {
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

function buildWorkbenchVisualDirectionMarkdown(contract, artifact) {
  const visual = artifact?.visual_direction || {};
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

function copyWorkbenchFile(source, destination) {
  if (!safeText(source) || !existsSync(source)) return null;
  ensureDir(path.dirname(destination));
  cpSync(source, destination);
  return destination;
}

function syncPptWorkbenchSurface({ workspaceRoot, contract, deliverableId, route, payload }) {
  const paths = getWorkbenchSurfacePaths({ workspaceRoot, contract, deliverableId });
  ensureWorkbenchSurface(paths);
  const refs = [];
  writeText(paths.referenceIndexFile, buildWorkbenchReferenceIndex(contract));
  refs.push(paths.referenceIndexFile);
  switch (route) {
    case 'storyline':
      writeText(paths.storylineFile, buildWorkbenchStorylineMarkdown(contract, payload));
      refs.push(paths.storylineFile);
      break;
    case 'detailed_outline':
      writeText(paths.detailedOutlineFile, buildWorkbenchDetailedOutlineMarkdown(contract, payload));
      refs.push(paths.detailedOutlineFile);
      break;
    case 'slide_blueprint':
      writeText(paths.blueprintFile, buildWorkbenchBlueprintMarkdown(contract, payload));
      refs.push(paths.blueprintFile);
      break;
    case 'visual_direction':
      writeText(paths.visualDirectionFile, buildWorkbenchVisualDirectionMarkdown(contract, payload));
      refs.push(paths.visualDirectionFile);
      break;
    case 'render_html': {
      const htmlRef = copyWorkbenchFile(payload?.html_bundle?.html_file, paths.htmlFile);
      if (htmlRef) refs.push(htmlRef);
      break;
    }
    case 'screenshot_review': {
      const reviewRef = copyWorkbenchFile(payload?.report_markdown, paths.screenshotReviewFile);
      if (reviewRef) refs.push(reviewRef);
      break;
    }
    case 'export_pptx': {
      const pptxRef = copyWorkbenchFile(payload?.export_bundle?.pptx_file, paths.pptxFile);
      const pdfRef = copyWorkbenchFile(payload?.export_bundle?.pdf_file, paths.pdfFile);
      const notesRef = copyWorkbenchFile(payload?.export_bundle?.presenter_notes_file, paths.presenterNotesFile);
      if (pptxRef) refs.push(pptxRef);
      if (pdfRef) refs.push(pdfRef);
      if (notesRef) refs.push(notesRef);
      break;
    }
    default:
      break;
  }
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
    owner: 'host_agent',
    primary_surface: 'codex_native_host_agent',
    stage_owner: 'codex_native_host_agent',
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
    owner: 'host_agent',
    primary_surface: 'codex_native_host_agent',
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
    execution_model: CODEX_EXECUTION_MODEL,
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
  if (['pass', 'ok', 'approved', 'approve'].includes(raw)) {
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
  return safeArray(slideReviews).every((slide) => {
    if (hasAiVisualPass(slide?.ai_review)) {
      return true;
    }
    return Boolean(slide?.checks?.[checkKey]);
  });
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

function renderHtmlSummaryOutputContract() {
  return {
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

function screenshotReviewOutputContract() {
  return {
    director_intent_landed: true,
    anti_template_ok: true,
    weak_pages: ['S06'],
    review_summary: '<string>',
  };
}

function screenshotReviewSlideBatchOutputContract() {
  return {
    slide_reviews: [
      {
        slide_id: 'S01',
        judgement: 'pass',
        visual_findings: ['<string>'],
        recommended_fix: 'none',
      },
    ],
  };
}

function screenshotReviewSummaryOutputContract() {
  return {
    director_intent_landed: true,
    anti_template_ok: true,
    weak_pages: ['S06'],
    review_summary: '<string>',
  };
}

function buildAuthoringContext(contract) {
  const preset = deckPreset(contract.profile_id);
  const speakerIdentity = resolveSpeakerIdentity(contract, preset.speaker);
  return {
    title: safeText(contract.title),
    delivery_goal: safeText(contract.goal),
    profile_id: contract.profile_id,
    speaker: speakerIdentity,
    speaker_signature: speakerIdentity,
    speaker_role: preset.speaker,
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
    operator_playbook: sharedOperatorMaterials(contract)
      .slice(0, 6)
      .map((material) => ({
        source_id: material.source_id,
        excerpt: extractAudienceFacingSnippet(material.content_text || material.excerpt, 220),
      }))
      .filter((item) => item.excerpt),
    authoring_guardrails: [
      '如果 operator_playbook 提供了具名讲者署名，speaker / speaker_signature 必须保留 exact identity，不得泛化成“同行讲者”“正式讲者”等占位标签',
      'delivery_goal 只表示制作目标，不得原样进入 slide 标题、正文、讲稿或视觉宣言',
      '不要把“封面必须署名”“重点回答三件事”“先讲什么后讲什么”等系统操作说明写成 audience-facing 内容',
      'operator_playbook 只作为制作约束，不得被改写成课堂正文、标题、来源或讲稿台词',
      '如果共享事实材料不足，只能做保守抽象，不要发明内部流程细节或伪来源',
    ],
  };
}

async function generateStorylineDraft(contract) {
  const { data, generationRuntime } = await generateStructuredArtifactViaCodexCli({
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
  const { data, generationRuntime } = await generateStructuredArtifactViaCodexCli({
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
  const { data, generationRuntime } = await generateStructuredArtifactViaCodexCli({
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
  const { data, generationRuntime } = await generateStructuredArtifactViaCodexCli({
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

function summarizeRenderRevisionSlideFeedback(reviewArtifact) {
  const slideReviews = safeArray(reviewArtifact?.slide_reviews).length > 0
    ? safeArray(reviewArtifact?.slide_reviews)
    : safeArray(reviewArtifact?.ai_review?.slide_reviews).map((slide) => ({
        ...slide,
        ai_review: slide?.ai_review && typeof slide.ai_review === 'object'
          ? slide.ai_review
          : {
              judgement: safeText(slide?.judgement),
              visual_findings: safeArray(slide?.visual_findings),
              recommended_fix: safeText(slide?.recommended_fix),
            },
      }));
  return slideReviews
    .filter((slide) => safeText(slide?.status) === 'block' || safeText(slide?.ai_review?.judgement) === 'block')
    .map((slide) => ({
      slide_id: safeText(slide?.slide_id),
      title: safeText(slide?.title),
      blocked_checks: safeArray(slide?.issues),
      ai_findings: safeArray(slide?.ai_review?.visual_findings).map((item) => normalizeInlineText(item, 220)),
      recommended_fix: normalizeInlineText(slide?.ai_review?.recommended_fix, 220),
    }))
    .filter((slide) => slide.slide_id);
}

function buildRenderRevisionContext(contract, deliverablePaths) {
  const directorReviewArtifact = readStageArtifact(contract, deliverablePaths, 'visual_director_review');
  const screenshotReviewArtifact = readStageArtifact(contract, deliverablePaths, 'screenshot_review');
  const directorSummary = directorReviewArtifact?.visual_director_review
    ? {
        status: safeText(directorReviewArtifact.status, 'unknown'),
        weak_pages: safeArray(directorReviewArtifact.visual_director_review?.weak_pages),
        review_summary: normalizeInlineText(directorReviewArtifact.visual_director_review?.review_summary, 320),
        rewrite_action: safeText(directorReviewArtifact.visual_director_review?.rewrite_action, 'none'),
      }
    : null;
  const screenshotSlideFeedback = summarizeRenderRevisionSlideFeedback(screenshotReviewArtifact);
  const screenshotSummary = screenshotReviewArtifact
    ? {
        status: safeText(screenshotReviewArtifact.status, 'unknown'),
        blocked_checks: Object.entries(screenshotReviewArtifact.checks || {})
          .filter(([, value]) => value === false)
          .map(([key]) => key),
        blocked_slide_ids: screenshotSlideFeedback.map((slide) => slide.slide_id),
        review_summary: normalizeInlineText(screenshotReviewArtifact.ai_review?.review_summary, 320),
        slide_feedback: screenshotSlideFeedback,
      }
    : null;
  if (!directorSummary && !screenshotSummary) {
    return null;
  }
  return {
    has_prior_review_feedback: true,
    visual_director_review: directorSummary,
    screenshot_review: screenshotSummary,
  };
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

function buildRenderRevisionFocusMap(revisionContext) {
  const focusBySlideId = new Map();
  const weakPages = new Set(
    safeArray(revisionContext?.visual_director_review?.weak_pages)
      .map((slideId) => safeText(slideId))
      .filter(Boolean),
  );
  const blockedSlideIds = new Set(
    safeArray(revisionContext?.screenshot_review?.blocked_slide_ids)
      .map((slideId) => safeText(slideId))
      .filter(Boolean),
  );
  const slideFeedbackById = new Map(
    safeArray(revisionContext?.screenshot_review?.slide_feedback)
      .map((slide) => [safeText(slide?.slide_id), slide]),
  );
  for (const slideId of new Set([
    ...weakPages,
    ...blockedSlideIds,
    ...slideFeedbackById.keys(),
  ])) {
    if (!slideId) continue;
    const slideFeedback = slideFeedbackById.get(slideId) || {};
    focusBySlideId.set(slideId, {
      weak_page: weakPages.has(slideId),
      blocked_for_screenshot_review: blockedSlideIds.has(slideId),
      blocked_checks: safeArray(slideFeedback?.blocked_checks),
      ai_findings: safeArray(slideFeedback?.ai_findings),
      recommended_fix: safeText(slideFeedback?.recommended_fix),
      director_review_summary: weakPages.has(slideId)
        ? normalizeInlineText(revisionContext?.visual_director_review?.review_summary, 220)
        : '',
      rewrite_priority: 'must_fix_before_new_variation',
    });
  }
  return focusBySlideId;
}

function loadPriorRenderedSlideHtmlMap(renderArtifact) {
  return new Map(
    safeArray(renderArtifact?.html_bundle?.slides)
      .map((slide) => [safeText(slide?.slide_id), requireText(slide?.content, 'render_html.html_bundle.slides[].content')])
      .filter(([slideId]) => slideId),
  );
}

function planRenderHtmlExecution({ blueprintSlides, revisionContext, priorRenderArtifact }) {
  const priorRenderedSlides = loadPriorRenderedSlideHtmlMap(priorRenderArtifact);
  const targetedSlideIds = new Set([
    ...safeArray(revisionContext?.visual_director_review?.weak_pages),
    ...safeArray(revisionContext?.screenshot_review?.blocked_slide_ids),
  ].map((slideId) => safeText(slideId)).filter(Boolean));
  if (targetedSlideIds.size === 0 || priorRenderedSlides.size === 0) {
    return {
      mode: 'full_regeneration',
      slides_to_render: blueprintSlides,
      reused_slides: new Map(),
    };
  }
  const slidesToRender = [];
  const reusedSlides = new Map();
  for (const slide of blueprintSlides) {
    const slideId = safeText(slide?.slide_id);
    if (!slideId) continue;
    if (targetedSlideIds.has(slideId)) {
      slidesToRender.push(slide);
      continue;
    }
    const priorHtml = priorRenderedSlides.get(slideId);
    if (!priorHtml) {
      return {
        mode: 'full_regeneration',
        slides_to_render: blueprintSlides,
        reused_slides: new Map(),
      };
    }
    reusedSlides.set(slideId, {
      slide_id: slideId,
      content_html: priorHtml,
    });
  }
  return {
    mode: 'targeted_revision_only',
    slides_to_render: slidesToRender,
    reused_slides: reusedSlides,
  };
}

function buildRenderHtmlBlueprintSlides(blueprintArtifact, revisionContext = null) {
  const revisionFocusBySlideId = buildRenderRevisionFocusMap(revisionContext);
  return safeArray(blueprintArtifact?.slide_blueprint?.slides).map((slide) => ({
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
    revision_focus: revisionFocusBySlideId.get(safeText(slide.slide_id)) || null,
  }));
}

function filterRenderRevisionContextForSlides(revisionContext, slideIds = []) {
  if (!revisionContext) return null;
  const allowedSlideIds = new Set(safeArray(slideIds).map((slideId) => safeText(slideId)).filter(Boolean));
  const directorWeakPages = safeArray(revisionContext?.visual_director_review?.weak_pages)
    .filter((slideId) => allowedSlideIds.has(safeText(slideId)));
  const slideFeedback = safeArray(revisionContext?.screenshot_review?.slide_feedback)
    .filter((slide) => allowedSlideIds.has(safeText(slide?.slide_id)));
  const blockedSlideIds = safeArray(revisionContext?.screenshot_review?.blocked_slide_ids)
    .filter((slideId) => allowedSlideIds.has(safeText(slideId)));
  const globalDirectorWeakPages = safeArray(revisionContext?.visual_director_review?.weak_pages);
  const globalSlideFeedback = safeArray(revisionContext?.screenshot_review?.slide_feedback);
  const globalBlockedSlideIds = safeArray(revisionContext?.screenshot_review?.blocked_slide_ids);
  const batchHasDirectorFocus = directorWeakPages.length > 0;
  const batchHasScreenshotFocus = slideFeedback.length > 0 || blockedSlideIds.length > 0;
  const globalHasScreenshotFocus = globalSlideFeedback.length > 0 || globalBlockedSlideIds.length > 0;
  const globalHasDirectorFocus = globalDirectorWeakPages.length > 0;
  if ((globalHasDirectorFocus && !batchHasDirectorFocus && !batchHasScreenshotFocus)
    || (globalHasScreenshotFocus && !batchHasScreenshotFocus)) {
    return null;
  }
  const directorSummary = revisionContext?.visual_director_review
    ? {
        ...revisionContext.visual_director_review,
        weak_pages: directorWeakPages,
      }
    : null;
  const screenshotSummary = revisionContext?.screenshot_review
    ? {
        ...revisionContext.screenshot_review,
        blocked_slide_ids: blockedSlideIds,
        slide_feedback: slideFeedback,
      }
    : null;
  const hasDirectorFeedback = safeArray(directorSummary?.weak_pages).length > 0
    || safeText(directorSummary?.review_summary).length > 0;
  const hasScreenshotFeedback = safeArray(screenshotSummary?.blocked_slide_ids).length > 0
    || safeArray(screenshotSummary?.slide_feedback).length > 0;
  if (!hasDirectorFeedback && !hasScreenshotFeedback) {
    return null;
  }
  return {
    has_prior_review_feedback: true,
    visual_director_review: directorSummary,
    screenshot_review: screenshotSummary,
  };
}

async function generateRenderHtmlDraft(contract, deliverablePaths) {
  const blueprintArtifact = readStageArtifact(contract, deliverablePaths, 'slide_blueprint');
  const visualArtifact = readStageArtifact(contract, deliverablePaths, 'visual_direction');
  const previousRenderArtifact = readStageArtifact(contract, deliverablePaths, 'render_html');
  const sharedRevisionContext = buildRenderRevisionContext(contract, deliverablePaths);
  const blueprintSlides = buildRenderHtmlBlueprintSlides(blueprintArtifact, sharedRevisionContext);
  const renderPlan = planRenderHtmlExecution({
    blueprintSlides,
    revisionContext: sharedRevisionContext,
    priorRenderArtifact: previousRenderArtifact,
  });
  const sharedContext = {
    ...buildAuthoringContext(contract),
    visual_direction: visualArtifact?.visual_direction || null,
    shell_contract: {
      ratio: CANVAS.ratio,
      width: CANVAS.width,
      height: CANVAS.height,
      controls: ['slide-display-area', 'prev-btn', 'next-btn'],
    },
    html_guardrails: [
      '每页输出完整 slide root，必须包含 data-slide-root=true 与匹配的 data-slide-id。',
      '每页至少提供 2 个语义化 data-qa-block，并至少标记 1 个 data-primary-point=true，供截图审稿读取布局结构。',
      '标题区与导语区必须形成独立安全带；主体白板、轨道、横带、标签和大型结构不得侵入 header 的首屏阅读入口。',
      'foundation / substrate / base band 只承担结构基座，不得压住正文、说明卡片、讲者信息或封面辅助卡；所有可读内容都必须完整留在页边界内。',
      '任何带字元素都必须拥有独立留白：标签、badge、航线节点、callout、段落、底部说明和图内节点不得彼此遮挡，也不得跨压导航轨道或解释段。',
      '若同一页面家族重复出现，后续页面必须切换首眼信号、构图重心或风险张力，不能只是上一页的弱化复写。',
      '对 audit_tension / timeline_band 的第二段推进页，controller 必须继续做唯一主峰；红色风险支路必须收成短窄阻断支路，不能膨胀成第二主图。',
      '若页面同时承载主链说明与风险提示，底部说明区最多保留 2 块；第 3 个观点必须并入主图注释或节点说明，不得再扩成整排说明带。',
      '若某页 blueprint 附带 revision_focus，必须把它当作该页的硬重画 brief；recommended_fix 提到删减、收短、并入、合并的元素时，必须字面落实，不能保留同样抢眼的等价变体。',
      '风险支路只允许一个紧凑 warning badge 与一段短 stub；禁止横向长红线穿越主链中轴，绿色判断词若保留则计入底部说明总数。',
      '若已有上一轮通过的 render_html 产物，且 revision_context 只点名部分 blocked slides，则只重画这些页面，其余通过页应保持原样复用，不要重新发明已通过页面。',
      '若 revision_context 点名了 blocked slides 或遮挡问题，必须优先重建这些页面，先消除裁切/遮挡，再保留导演结构意图。',
      '不要使用 renderSlide/layoutByType/cardsGrid/pageType，不要输出 <script>/<style> block，也不要把模板注册表或内部文档写入 HTML。',
      'HTML 必须由 AI 直接创作，不得退化成固定 slot/template compiler 产物。',
    ],
  };
  const slideBatches = chunkArray(renderPlan.slides_to_render, RENDER_HTML_BATCH_SIZE);
  const freshlyRenderedSlides = slideBatches.length === 0
    ? []
    : (await Promise.all(slideBatches.map(async (slideBatch, batchIndex) => {
    const { data: batchData } = await generateStructuredArtifactViaCodexCli({
      family: 'ppt_deck',
      route: 'render_html',
      promptRelativePath: PROMPT_PACK.render_html,
      context: {
        ...sharedContext,
        render_scope: 'slide_batch',
        rerender_mode: renderPlan.mode,
        render_batch: {
          batch_index: batchIndex + 1,
          total_batches: slideBatches.length,
          slide_ids: slideBatch.map((slide) => slide.slide_id),
        },
        blueprint: {
          slides: slideBatch,
        },
        revision_context: filterRenderRevisionContextForSlides(
          sharedRevisionContext,
          slideBatch.map((slide) => slide.slide_id),
        ) || sharedRevisionContext,
      },
      outputContract: renderHtmlOutputContract(),
      cwd: deliverablePaths.deliverableDir,
    });
    return safeArray(batchData?.slides).filter((item) => item && typeof item === 'object');
  }))).flat();
  const freshlyRenderedById = new Map(
    freshlyRenderedSlides.map((slide) => [safeText(slide?.slide_id), slide]),
  );
  const renderedSlides = blueprintSlides.map((slide) => {
    const slideId = safeText(slide?.slide_id);
    return freshlyRenderedById.get(slideId) || renderPlan.reused_slides.get(slideId);
  }).filter(Boolean);
  const { data: summaryData, generationRuntime } = await generateStructuredArtifactViaCodexCli({
    family: 'ppt_deck',
    route: 'render_html',
    promptRelativePath: PROMPT_PACK.render_html,
    context: {
      ...sharedContext,
      render_scope: 'summary',
      rerender_mode: renderPlan.mode,
      blueprint: {
        slides: blueprintSlides.map((slide) => ({
          slide_id: slide.slide_id,
          title: slide.title,
          layout_family: slide.layout_family,
        })),
      },
      rendered_slide_ids: freshlyRenderedSlides.map((slide) => safeText(slide?.slide_id)).filter(Boolean),
      reused_slide_ids: [...renderPlan.reused_slides.keys()],
      revision_context: sharedRevisionContext,
    },
    outputContract: renderHtmlSummaryOutputContract(),
    cwd: deliverablePaths.deliverableDir,
  });
  return {
    data: {
      slides: renderedSlides,
      render_summary: safeArray(summaryData?.render_summary),
    },
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
    const rawContent = slideHtmlById.get(slide.slide_id);
    if (!rawContent) {
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
    const peakPage = safeArray(visualArtifact?.visual_direction?.peak_pages).includes(slide.slide_id);
    const directorRole = safeArray(visualArtifact?.visual_direction?.page_role_table).find((item) => item.slide_id === slide.slide_id)?.page_role
      || slide.visual_presentation.layout_family;
    const content = validateRenderedReviewAnchors(
      hydrateRenderedSlideRootMetadata(rawContent, {
        'data-title': slide.title,
        'data-layout-family': slide.visual_presentation.layout_family,
        'data-speaker-seconds': Number(slide.speaker_seconds || 0),
        'data-recipe-id': slide.render_recipe_id,
        'data-template-id': 'upstream_ai_html',
        'data-peak-page': peakPage ? 'true' : 'false',
        'data-director-role': directorRole,
      }, slide.slide_id),
      slide.slide_id,
    );
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
        peak_page: peakPage,
        director_role: directorRole,
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
  const { data, generationRuntime } = await generateStructuredArtifactViaCodexCli({
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
    '- review_owner: codex_native_host_agent',
    `- 状态：${reviewArtifact.status}`,
  ];
  if (reviewArtifact.review_capture) {
    lines.push(`- capture_id：${safeText(reviewArtifact.review_capture.capture_id)}`);
    lines.push(`- capture_screenshots_dir：${safeText(reviewArtifact.review_capture.screenshots_dir)}`);
    if (reviewArtifact.review_capture.review_markdown_file) {
      lines.push(`- capture_review_markdown：${safeText(reviewArtifact.review_capture.review_markdown_file)}`);
    }
    if (Number.isFinite(Number(reviewArtifact.review_capture.device_scale_factor))) {
      lines.push(`- device_scale_factor：${Number(reviewArtifact.review_capture.device_scale_factor)}`);
    }
    const screenshotWidth = Number(reviewArtifact.review_capture?.screenshot_dimensions?.width || 0);
    const screenshotHeight = Number(reviewArtifact.review_capture?.screenshot_dimensions?.height || 0);
    if (screenshotWidth > 0 && screenshotHeight > 0) {
      lines.push(`- screenshot_dimensions：${screenshotWidth}x${screenshotHeight}`);
    }
  }
  lines.push(
    `- director_intent_landed：${reviewArtifact.checks.director_intent_landed}`,
    `- anti_template_ok：${reviewArtifact.checks.anti_template_ok}`,
    `- overflow_free：${reviewArtifact.checks.overflow_free}`,
    `- occlusion_free：${reviewArtifact.checks.occlusion_free}`,
    `- visual_density_ok：${reviewArtifact.checks.visual_density_ok}`,
    `- speaker_fit_ok：${reviewArtifact.checks.speaker_fit_ok}`,
  );
  if (Object.hasOwn(reviewArtifact.checks, 'baseline_comparison_passed')) {
    lines.push(`- baseline_comparison_passed：${reviewArtifact.checks.baseline_comparison_passed}`);
  }
  if (reviewArtifact.ai_review?.review_summary) {
    lines.push('', '## AI 审阅结论');
    lines.push(`- review_model：${safeText(reviewArtifact.ai_review.review_model)}`);
    lines.push(`- weak_pages：${safeArray(reviewArtifact.ai_review.weak_pages).join(', ') || 'none'}`);
    lines.push(`- review_summary：${reviewArtifact.ai_review.review_summary}`);
  }
  lines.push('', '## 分页记录');
  for (const slide of reviewArtifact.slide_reviews) {
    lines.push(`- ${slide.slide_id} / ${slide.layout_family} / ${slide.status} / ${slide.screenshot_file}`);
    if (slide.ai_review) {
      lines.push(`  - AI judgement: ${slide.ai_review.judgement}`);
      lines.push(`  - AI findings: ${safeArray(slide.ai_review.visual_findings).join('；')}`);
      lines.push(`  - Recommended fix: ${safeText(slide.ai_review.recommended_fix, 'none')}`);
    }
  }
  if (reviewArtifact.baseline_review?.summary) {
    lines.push('', '## Baseline Relative Review', reviewArtifact.baseline_review.summary);
  }
  return `${lines.join('\n')}\n`;
}

async function generateScreenshotReviewDraft(contract, deliverablePaths, slideReviews, reviewPayload, mode) {
  const blueprintArtifact = readStageArtifact(contract, deliverablePaths, 'slide_blueprint');
  const visualArtifact = readStageArtifact(contract, deliverablePaths, 'visual_direction');
  const directorReviewArtifact = readStageArtifact(contract, deliverablePaths, 'visual_director_review');
  const sharedContext = {
    ...buildAuthoringContext(contract),
    mode,
    blueprint: {
      slides: summarizeBlueprintSlides(blueprintArtifact),
    },
    visual_direction: visualArtifact?.visual_direction || null,
    director_review: directorReviewArtifact?.visual_director_review || null,
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
        speaker_seconds: slide.metrics?.speaker_seconds ?? null,
      })),
    },
  };
  const aiSlideReviews = [];
  aiSlideReviews.push(...(await Promise.all(chunkArray(slideReviews, SCREENSHOT_REVIEW_BATCH_SIZE).map(async (slideBatch) => {
    const { data: batchData } = await generateStructuredArtifactViaCodexCli({
      family: 'ppt_deck',
      route: 'screenshot_review',
      promptRelativePath: PROMPT_PACK.screenshot_review,
      context: {
        ...sharedContext,
        review_scope: 'slide_batch',
        screenshot_mechanics: {
          ...sharedContext.screenshot_mechanics,
          slides: slideBatch.map((slide) => ({
            slide_id: slide.slide_id,
            title: slide.title,
            layout_family: slide.layout_family,
            status: slide.status,
            issues: slide.issues,
            occupied_ratio: slide.metrics?.occupied_ratio ?? null,
            primary_points: slide.metrics?.primary_points ?? null,
            speaker_seconds: slide.metrics?.speaker_seconds ?? null,
          })),
        },
      },
      outputContract: screenshotReviewSlideBatchOutputContract(),
      localFileInspection: slideBatch.map((slide, index) => ({
        label: `${slide.slide_id} ${safeText(slide.title, `Slide ${index + 1}`)}`.trim(),
        path: slide.screenshot_file,
        media_type: 'image/png',
        purpose: `Review rendered lecture slide screenshot for ${slide.slide_id}`,
      })),
      cwd: deliverablePaths.deliverableDir,
    });
    return normalizePptScreenshotAiSlideReviews(batchData?.slide_reviews, slideBatch);
  }))).flat());
  const { data, generationRuntime } = await generateStructuredArtifactViaCodexCli({
    family: 'ppt_deck',
    route: 'screenshot_review',
    promptRelativePath: PROMPT_PACK.screenshot_review,
    context: {
      ...sharedContext,
      review_scope: 'summary',
      ai_slide_reviews: aiSlideReviews,
    },
    outputContract: screenshotReviewSummaryOutputContract(),
    cwd: deliverablePaths.deliverableDir,
  });
  return {
    data,
    aiSlideReviews,
    generationRuntime,
  };
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
    '- review_owner: codex_native_host_agent',
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

async function buildScreenshotReviewArtifact({ workspaceRoot, topicId, deliverableId, contract, mode, baselineDeliverableId }) {
  const deliverablePaths = getDeliverablePaths(workspaceRoot, topicId, deliverableId);
  const renderArtifact = readStageArtifact(contract, deliverablePaths, 'render_html');
  const blueprintArtifact = readStageArtifact(contract, deliverablePaths, 'slide_blueprint');
  const storylineArtifact = readStageArtifact(contract, deliverablePaths, 'storyline');
  const directorReviewArtifact = readStageArtifact(contract, deliverablePaths, 'visual_director_review');
  const reviewMarkdown = path.join(deliverablePaths.reportsDir, `${deliverableId}_视觉质控.md`);
  const reviewCapture = createReviewCapturePaths(deliverablePaths, deliverableId);
  const args = [
    '--html', renderArtifact.html_bundle.html_file,
    '--output-dir', reviewCapture.screenshotsDir,
    '--review-markdown', reviewCapture.reviewMarkdownFile,
    '--max-primary-points', String(contract.layout_rules?.max_primary_points_per_slide || 5),
    '--device-scale-factor', '2',
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
  const mechanicalSlideReviews = safeArray(reviewPayload.slide_reviews).map((slide) => ({
    ...slide,
    status: safeArray(slide?.issues).length === 0 ? 'pass' : 'block',
  }));
  const { data, aiSlideReviews, generationRuntime } = await generateScreenshotReviewDraft(
    contract,
    deliverablePaths,
    mechanicalSlideReviews,
    reviewPayload,
    mode,
  );
  const aiWeakPages = normalizeStringList(data?.weak_pages, 'screenshot_review.weak_pages', { min: 0, max: 4 });
  const aiSlideReviewMap = new Map(aiSlideReviews.map((item) => [item.slide_id, item]));
  const slideReviews = mechanicalSlideReviews.map((slide) => buildAiFirstVisualSlideReview(
    slide,
    aiSlideReviewMap.get(slide.slide_id),
  ));
  const latestChecks = {
    director_intent_landed: Boolean(directorReviewArtifact?.visual_director_review?.director_intent_landed)
      && Boolean(data?.director_intent_landed),
    anti_template_ok: Boolean(directorReviewArtifact?.visual_director_review?.anti_template_ok)
      && Boolean(data?.anti_template_ok),
    ai_review_passed: slideReviews.every((slide) => !hasAiVisualBlock(slide?.ai_review)),
    overflow_free: slideReviews.every((slide) => slide.checks.overflow_free),
    occlusion_free: aiFirstMechanicalCheckValue(slideReviews, 'occlusion_free'),
    visual_density_ok: aiFirstMechanicalCheckValue(slideReviews, 'visual_density_ok'),
    speaker_fit_ok: aiFirstMechanicalCheckValue(slideReviews, 'speaker_fit_ok'),
    ...deriveProfileChecks(contract, blueprintArtifact, storylineArtifact),
  };
  const status = Object.values(latestChecks).every((value) => value === true) ? 'pass' : 'block';
  const artifact = {
    ...attachCommon('screenshot_review', contract),
    review_execution: {
      ...creativeExecution('screenshot_review', generationRuntime),
      overlay: 'screenshot_review',
    },
    review_overlay: 'screenshot_review',
    mode,
    status,
    checks: latestChecks,
    review_capture: {
      capture_id: reviewCapture.captureId,
      screenshots_dir: reviewCapture.screenshotsDir,
      review_markdown_file: reviewCapture.reviewMarkdownFile,
      device_scale_factor: Number(reviewPayload.device_scale_factor || 2),
      screenshot_dimensions: reviewPayload.screenshot_dimensions || null,
    },
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
          authoredSurface: 'screenshot_review_decision',
          materializedFrom: CREATIVE_MATERIALIZED_FROM,
        }),
      },
    },
    mechanical_review: {
      review_model: 'python_screenshot_layout_checks',
      checks: reviewPayload.checks,
      metrics: reviewPayload.metrics,
    },
    report_markdown: reviewMarkdown,
    metrics: reviewPayload.metrics,
    artifact_refs: [
      reviewMarkdown,
      reviewCapture.reviewMarkdownFile,
      ...slideReviews.map((slide) => slide.screenshot_file),
    ].filter(Boolean),
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
  const renderedReviewMarkdown = buildReviewMarkdown(contract, artifact);
  writeText(reviewCapture.reviewMarkdownFile, renderedReviewMarkdown);
  writeText(reviewMarkdown, renderedReviewMarkdown);
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
  const screenshotsDir = safeText(reviewArtifact?.review_capture?.screenshots_dir);
  if (!screenshotsDir) {
    throw new Error('Route export_pptx requires screenshot_review immutable capture screenshots; rerun screenshot_review before export');
  }
  if (!existsSync(screenshotsDir)) {
    throw new Error(`Reviewed screenshot capture directory not found: ${screenshotsDir}`);
  }
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
      review_capture: reviewArtifact.review_capture || null,
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
      payload = await buildScreenshotReviewArtifact({ workspaceRoot, topicId, deliverableId, contract, mode, baselineDeliverableId });
      break;
    case 'export_pptx':
      payload = buildExportArtifact({ workspaceRoot, topicId, deliverableId, contract });
      break;
    default:
      throw new Error(`Unsupported ppt_deck route: ${route}`);
  }
  payload = appendArtifactRefs(
    payload,
    syncPptWorkbenchSurface({ workspaceRoot, contract, deliverableId, route, payload }),
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
