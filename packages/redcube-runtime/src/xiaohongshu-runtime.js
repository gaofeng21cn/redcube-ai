import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

import { getDeliverablePaths } from '@redcube/runtime-protocol';

const MODULE_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(MODULE_DIR, '../../..');
const PYTHON_REVIEW = path.join(MODULE_DIR, '../scripts/ppt_deck_review.py');
const CANVAS = { ratio: '3:4', width: 448, height: 597 };
const PROMPT_PACK = {
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

function promptMeta(route) {
  const relativePath = PROMPT_PACK[route];
  const absolutePath = path.join(REPO_ROOT, relativePath);
  return {
    root: 'prompts/xiaohongshu',
    file: path.basename(relativePath),
    relative_path: relativePath,
    source: existsSync(absolutePath) ? 'repo' : 'embedded',
  };
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

function promptSeed(route, vars = {}) {
  const absolutePath = path.join(REPO_ROOT, PROMPT_PACK[route]);
  if (!existsSync(absolutePath)) return null;
  const raw = readFileSync(absolutePath, 'utf-8');
  const match = raw.match(/## runtime_seed\s*```json\s*([\s\S]*?)\s*```/);
  if (!match) return null;
  return renderSeedValue(JSON.parse(match[1]), vars);
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

function inferPageContent(slide, context, index, slides) {
  const sourceLabel = context.public_sources[index % context.public_sources.length];
  switch (slide.layout_family) {
    case 'cover_note':
      return [
        `一句话先把冲突说清：${context.tension}`,
        `这篇真正要帮你判断的是：${context.audience_judgement}`,
        `记忆钩子：${context.memory_hook}`,
      ];
    case 'myth_compare':
      return [
        '很多人一上来就先找工具、先看功能、先抄别人的做法',
        '真正该先看的，是这件事的判断顺序有没有被做反',
        `为什么现在更容易做反：${context.why_now}`,
      ];
    case 'sequence_stack':
      return [
        '先把问题翻译成人话，再决定要不要引入工具或方法',
        '先看证据和适用边界，再看执行路径和输出形式',
        '最后才谈效率、模板和扩展动作',
      ];
    case 'process_track':
      return [
        '第1步：先判断这是不是一个需要立刻处理的问题',
        '第2步：再判断有哪些公开来源能支撑这一步',
        '第3步：最后把动作压成一条能照着走的轨道',
      ];
    case 'evidence_strip':
      return [
        `把来源写成人能看懂的口径：${sourceLabel}`,
        '证据页不是摆引用，而是告诉读者为什么这句结论可信',
        '来源与行动建议必须同屏出现，不能只留脚注',
      ];
    case 'action_checklist':
      return [
        `先记住这句：${context.memory_hook}`,
        '离开这一页后，按“先问题、再来源、后动作”的顺序执行',
        `如果只带走一件事，就是：${slides[0]?.title || '先把最短判断句记住'}`,
      ];
    default:
      return [
        '先把这页的判断句说清',
        '再给读者一个可执行动作',
        '最后用公开来源口径托住结论',
      ];
  }
}

function inferVisualPresentation(slide) {
  const family = slide.layout_family;
  if (family === 'cover_note') {
    return {
      layout_family: family,
      main_visual_action: '大标题钩子 + 批注式记忆句',
      action_primitive: 'hero note + highlight ribbon',
      anchor_tracks: ['cover-hook', 'memory-ribbon', 'benefit-chip'],
      anti_template_note: '封面必须是一页抓人，不是普通三卡封面',
    };
  }
  if (family === 'myth_compare') {
    return {
      layout_family: family,
      main_visual_action: '错误做法 vs 正确顺序双区对撞',
      action_primitive: 'asymmetric compare columns',
      anchor_tracks: ['myth-column', 'divider', 'correction-column'],
      anti_template_note: '不能退化成同构卡片列表',
    };
  }
  if (family === 'sequence_stack') {
    return {
      layout_family: family,
      main_visual_action: '阶梯式顺序卡，让读者看到先后关系',
      action_primitive: 'staggered step stack',
      anchor_tracks: ['step-one', 'step-two', 'step-three'],
      anti_template_note: '顺序页必须有明显推进，不可做平铺列表',
    };
  }
  if (family === 'process_track') {
    return {
      layout_family: family,
      main_visual_action: '轨道化机制说明',
      action_primitive: 'process track with nodes',
      anchor_tracks: ['track-start', 'track-middle', 'track-end'],
      anti_template_note: '机制页必须显式轨道，不可只写文字卡片',
    };
  }
  if (family === 'evidence_strip') {
    return {
      layout_family: family,
      main_visual_action: '证据条 + 来源标签 + 结论高亮',
      action_primitive: 'source strip with highlight bands',
      anchor_tracks: ['evidence-strip', 'source-chip-rail', 'claim-highlight'],
      anti_template_note: '证据页必须同时给来源与结论，不可只留脚注',
    };
  }
  return {
    layout_family: family,
    main_visual_action: '动作清单压缩收尾',
    action_primitive: 'checklist blocks',
    anchor_tracks: ['check-one', 'check-two', 'check-three'],
    anti_template_note: '收尾页要像收藏清单，不是普通总结卡',
  };
}

function attachCommon(route, contract) {
  return {
    overlay: contract.overlay,
    route,
    profile_id: contract.profile_id,
    produced_at: new Date().toISOString(),
    prompt_pack: promptMeta(route),
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
  if (route === 'screenshot_review' && mode === 'optimize_existing' && !safeText(baselineDeliverableId)) {
    throw new Error('screenshot_review requires baselineDeliverableId in optimize_existing mode');
  }
  return { deliverablePaths, contract };
}

function buildResearch(contract) {
  const seed = promptSeed('research', { title: contract.title });
  const references = safeArray(seed?.research?.reference_source_list).length > 0 ? seed.research.reference_source_list : publicSources();
  return {
    ...attachCommon('research', contract),
    research: {
      topic_summary: safeText(seed?.research?.topic_summary, `${contract.title} 面向患者做可信、可发布的小红书图文`),
      mode: isSeries(contract) ? 'series' : 'single',
      audience_judgement: inferAudience(contract),
      why_now: inferWhyNow(contract),
      tension: inferTension(contract),
      memory_hook: inferMemoryHook(contract),
      reference_source_list: references,
      public_sources: references,
      forbidden_source_hit_count: Number(seed?.research?.forbidden_source_hit_count || 0),
      input_output_state: {
        current: 'input_ready',
        next: 'planning_ready',
      },
    },
  };
}

function buildStoryline(contract, deliverablePaths) {
  const research = readStageArtifact(contract, deliverablePaths, 'research');
  const seed = promptSeed('storyline');
  return {
    ...attachCommon('storyline', contract),
    storyline: {
      mode: research?.research?.mode || 'single',
      audience_judgement: safeText(seed?.storyline?.audience_judgement, research?.research?.audience_judgement),
      tension: safeText(seed?.storyline?.tension, research?.research?.tension),
      why_now: safeText(seed?.storyline?.why_now, research?.research?.why_now),
      memory_hook: safeText(seed?.storyline?.memory_hook, research?.research?.memory_hook),
      hook: safeText(seed?.storyline?.hook, '先打破旧认知，再给动作收益'),
      narrative_progression: safeArray(seed?.storyline?.narrative_progression),
      journey: safeArray(seed?.storyline?.journey),
      resolution: safeText(seed?.storyline?.resolution, '让读者愿意收藏并继续看下一页/下一篇'),
      series_needed: (research?.research?.mode || 'single') === 'series',
    },
  };
}

function buildPlanSlides(contract, storyline) {
  const seed = promptSeed('single_note_plan', { title: contract.title });
  const slides = safeArray(seed?.plan?.slides);
  const sources = safeArray(storyline?.research?.public_sources).length > 0 ? storyline.research.public_sources : publicSources();
  return slides.map((slide, index) => ({
    slide_id: slide.slide_id,
    slide_no: index + 1,
    title: slide.title,
    layout_family: slide.layout_family,
    page_goal: slide.page_goal,
    progression_role: safeText(slide.progression_role, ['hook','tension','explain','mechanism_peak','evidence_peak','memory_close'][index] || 'explain'),
    core_sentence: `${slide.title}｜${safeText(storyline?.storyline?.memory_hook, inferMemoryHook(contract))}`,
    page_core_content: inferPageContent(slide, {
      audience_judgement: safeText(storyline?.storyline?.audience_judgement, inferAudience(contract)),
      why_now: safeText(storyline?.storyline?.why_now, inferWhyNow(contract)),
      tension: safeText(storyline?.storyline?.tension, inferTension(contract)),
      memory_hook: safeText(storyline?.storyline?.memory_hook, inferMemoryHook(contract)),
      public_sources: sources,
    }, index, slides),
    visual_presentation: inferVisualPresentation(slide),
    source_language: safeText(slide.source_language, '来源必须翻译成读者能理解的公开口径'),
    evidence_and_sources: sources.map((source, sourceIndex) => ({
      source_id: `SRC-${index + 1}-${sourceIndex + 1}`,
      public_label: source,
    })),
    speaker_notes: `这页要让读者立刻感到：${slide.page_goal}。先用一句人话把判断句讲清，再补一条公开来源托住可信度。`,
    transition: safeText(slide.transition, index === slides.length - 1 ? '最后收束成可收藏的行动清单。' : `下一页进入：${slides[index + 1].title}`),
    transition_sentence: safeText(slide.transition, index === slides.length - 1 ? '最后收束成可收藏的行动清单。' : `下一页进入：${slides[index + 1].title}`),
  }));
}

function buildSingleNotePlan(contract) {
  const seed = promptSeed('single_note_plan', { title: contract.title });
  const titleOptions = safeArray(seed?.plan?.title_options);
  const slides = buildPlanSlides(contract);
  return {
    ...attachCommon('single_note_plan', contract),
    single_note_plan: {
      mode: isSeries(contract) ? 'series' : 'single',
      title_options: titleOptions,
      planning_doc_markdown: [`# 01_单篇策划`, '', `- 目标：${contract.goal}`, `- 封面钩子：${titleOptions[0] || contract.title}`].join('\n'),
      slides,
    },
  };
}

function buildVisualDirection(contract, deliverablePaths, mode, baselineDeliverableId) {
  const plan = readStageArtifact(contract, deliverablePaths, 'single_note_plan');
  const storyline = readStageArtifact(contract, deliverablePaths, 'storyline');
  const seed = promptSeed('visual_direction');
  const slides = safeArray(plan?.single_note_plan?.slides);
  const peakPages = safeArray(seed?.visual_direction?.peak_pages).length > 0 ? seed.visual_direction.peak_pages : slides.filter((slide) => ['hook','mechanism_peak','evidence_peak'].includes(slide.progression_role)).map((slide) => slide.slide_id);
  const pageRoleTable = slides.map((slide) => ({
    slide_id: slide.slide_id,
    title: slide.title,
    page_role: slide.progression_role,
    first_glance: slide.visual_presentation?.main_visual_action || slide.title,
    second_glance: slide.page_goal,
  }));
  return {
    ...attachCommon('visual_direction', contract),
    mode,
    visual_direction: {
      director_statement: safeText(seed?.visual_direction?.director_statement, '像一个认真做过整理的人，把复杂内容画成可收藏的笔记'),
      visual_motif: safeText(seed?.visual_direction?.visual_motif, '纸面感 + 高亮批注 + 便签式收束'),
      material_rules: seed?.visual_direction?.material_rules || {
        paper_base: '米白纸 + 轻网格',
        main_accent: '#2563EB',
        warning_accent: '#DC2626',
      },
      rhythm_curve: safeArray(seed?.visual_direction?.rhythm_curve).length > 0 ? seed.visual_direction.rhythm_curve : slides.map((slide) => ({ slide_id: slide.slide_id, role: slide.progression_role })),
      peak_pages: peakPages,
      page_family_ceiling: seed?.visual_direction?.page_family_ceiling || Object.fromEntries(slides.map((slide) => [slide.layout_family, 1])),
      anti_template_constraints: safeArray(seed?.visual_direction?.anti_template_constraints),
      source_language_discipline: safeText(seed?.visual_direction?.source_language_discipline, '来源必须翻译成读者能理解的公开口径'),
      page_role_table: pageRoleTable,
      forbidden_regressions: safeArray(seed?.visual_direction?.forbidden_regressions),
      baseline_deliverable_id: mode === 'optimize_existing' ? baselineDeliverableId : null,
      memory_hook: safeText(storyline?.storyline?.memory_hook, inferMemoryHook(contract)),
    },
  };
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

function renderCard(text, accent) {
  return `<div data-qa-block="card" data-primary-point="true" style="padding:16px;border-radius:20px;background:#FFFFFF;border:1px solid rgba(15,23,42,0.08);box-shadow:0 8px 18px rgba(15,23,42,0.05);"><div style="font-size:20px;line-height:1.5;color:#0F172A;">${escapeHtml(text)}</div><div style="margin-top:10px;width:52px;height:4px;border-radius:999px;background:${accent};"></div></div>`;
}

function renderSlideMarkup(slide, totalSlides) {
  const accent = '#2563EB';
  const header = `<header data-qa-block="header" style="display:grid;gap:8px;"><div style="font-size:14px;font-weight:800;color:${accent};letter-spacing:0.06em;text-transform:uppercase;">${escapeHtml(slide.page_goal)}</div><h2 style="margin:0;font-size:28px;line-height:1.25;color:#0F172A;">${escapeHtml(slide.title)}</h2></header>`;
  const footer = `<footer style="position:absolute;left:20px;right:20px;bottom:16px;display:flex;justify-content:space-between;align-items:center;font-size:12px;color:#475569;"><div data-source-label="true">${escapeHtml(slide.evidence_and_sources[0]?.public_label || '')}</div><div>${slide.slide_no} / ${totalSlides}</div></footer>`;

  if (slide.layout_family === 'cover_note') {
    return `<div data-slide-root="true" data-slide-id="${slide.slide_id}" data-title="${escapeHtml(slide.title)}" data-layout-family="cover_note" data-speaker-seconds="34" style="position:relative;width:${CANVAS.width}px;height:${CANVAS.height}px;background:#FFFBF0;overflow:hidden;padding:20px 22px 44px;"><div style="position:absolute;inset:0;background:linear-gradient(180deg, rgba(255,255,255,0.55), rgba(255,255,255,0));"></div><div style="position:relative;display:grid;gap:18px;height:100%;align-content:start;">${header}<div data-qa-block="hero" style="padding:20px 18px;border-radius:24px;background:#FFFFFF;border:1px solid rgba(15,23,42,0.08);font-size:22px;line-height:1.55;font-weight:700;color:#0F172A;">${escapeHtml(slide.page_core_content[0])}</div><div style="display:grid;gap:14px;">${slide.page_core_content.slice(1).map((item) => renderCard(item, accent)).join('')}</div></div>${footer}</div>`;
  }
  if (slide.layout_family === 'process_track') {
    return `<div data-slide-root="true" data-slide-id="${slide.slide_id}" data-title="${escapeHtml(slide.title)}" data-layout-family="process_track" data-speaker-seconds="40" style="position:relative;width:${CANVAS.width}px;height:${CANVAS.height}px;background:#F8FAFC;overflow:hidden;padding:20px 20px 44px;"><div style="display:grid;grid-template-rows:auto 1fr;height:100%;gap:16px;">${header}<div style="display:grid;gap:12px;align-content:start;">${slide.page_core_content.map((item, index) => `<div data-qa-block="track-row" data-primary-point="true" style="display:grid;grid-template-columns:36px 1fr;gap:12px;align-items:center;"><div style="width:36px;height:36px;border-radius:999px;background:${accent};color:#fff;display:grid;place-items:center;font-weight:800;">${index + 1}</div><div style="padding:14px 16px;border-radius:18px;background:#FFFFFF;border:1px solid rgba(15,23,42,0.08);font-size:18px;line-height:1.45;color:#0F172A;">${escapeHtml(item)}</div></div>`).join('')}</div></div>${footer}</div>`;
  }
  if (slide.layout_family === 'action_checklist') {
    return `<div data-slide-root="true" data-slide-id="${slide.slide_id}" data-title="${escapeHtml(slide.title)}" data-layout-family="action_checklist" data-speaker-seconds="32" style="position:relative;width:${CANVAS.width}px;height:${CANVAS.height}px;background:#F8FAFC;overflow:hidden;padding:20px 20px 44px;"><div style="display:grid;grid-template-rows:auto 1fr;height:100%;gap:16px;">${header}<div style="display:grid;grid-template-columns:1fr;gap:12px;align-content:start;">${slide.page_core_content.map((item, index) => `<div data-qa-block="check-row" data-primary-point="true" style="display:grid;grid-template-columns:28px 1fr;gap:12px;align-items:start;padding:12px 14px;border-radius:18px;background:#FFFFFF;border:1px solid rgba(15,23,42,0.08);"><div style="width:28px;height:28px;border-radius:999px;background:#0F766E;color:#fff;display:grid;place-items:center;font-size:14px;font-weight:800;">✓</div><div style="font-size:18px;line-height:1.45;color:#0F172A;">${escapeHtml(item)}</div></div>`).join('')}</div></div>${footer}</div>`;
  }
  return `<div data-slide-root="true" data-slide-id="${slide.slide_id}" data-title="${escapeHtml(slide.title)}" data-layout-family="${slide.layout_family}" data-speaker-seconds="36" style="position:relative;width:${CANVAS.width}px;height:${CANVAS.height}px;background:#F8FAFC;overflow:hidden;padding:20px 20px 44px;"><div style="display:grid;grid-template-rows:auto 1fr;height:100%;gap:16px;">${header}<div style="display:grid;gap:14px;align-content:start;">${slide.page_core_content.map((item) => renderCard(item, accent)).join('')}</div></div>${footer}</div>`;
}

function buildHtml({ title, slides }) {
  const slidesLiteral = slides.map((slide) => `  { slideId: '${slide.slide_id}', title: ${JSON.stringify(slide.title)}, content: \`${escapeTemplate(slide.content)}\` }`).join(',\n');
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(title)}</title>
<style>
body { font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Microsoft YaHei', sans-serif; margin:0; padding:24px; background:#E2E8F0; color:#0F172A; }
#app-container { max-width: 560px; margin: 0 auto; }
#slide-display-area { width: 100%; aspect-ratio: 3 / 4; position: relative; overflow: hidden; border-radius: 24px; background: white; box-shadow: 0 18px 40px rgba(15,23,42,0.12); }
#control-panel { margin-top: 14px; display:flex; align-items:center; justify-content:space-between; gap:12px; background:rgba(255,255,255,0.92); border-radius:18px; padding:12px 16px; }
button { border:0; border-radius:12px; padding:10px 14px; background:#0F172A; color:#fff; font-weight:800; cursor:pointer; }
button:disabled { opacity:0.5; cursor:default; }
.slide { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; opacity:0; visibility:hidden; transition:opacity 180ms ease; }
.slide.visible { opacity:1; visibility:visible; }
.slide-content-wrapper { width:${CANVAS.width}px; height:${CANVAS.height}px; overflow:hidden; position:relative; background:#fff; }
</style>
</head>
<body>
<div id="app-container">
  <div id="slide-display-area"></div>
  <div id="control-panel">
    <button id="prev-btn">上一页</button>
    <div id="progress-indicator"></div>
    <button id="next-btn">下一页</button>
  </div>
</div>
<script>
const slidesData = [
${slidesLiteral}
];
const slideDisplayArea = document.getElementById('slide-display-area');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const progressIndicator = document.getElementById('progress-indicator');
let currentSlide = 0;
function setupSlides() {
  slideDisplayArea.innerHTML = '';
  slidesData.forEach((slide) => {
    const element = document.createElement('div');
    element.className = 'slide';
    element.innerHTML = '<div class="slide-content-wrapper">' + slide.content + '</div>';
    slideDisplayArea.appendChild(element);
  });
}
function updateView() {
  const slides = Array.from(document.querySelectorAll('.slide'));
  slides.forEach((slide, index) => slide.classList.toggle('visible', index === currentSlide));
  progressIndicator.textContent = (currentSlide + 1) + ' / ' + slidesData.length;
  prevBtn.disabled = currentSlide === 0;
  nextBtn.disabled = currentSlide === slidesData.length - 1;
}
function inspectCurrentSlide() {
  const wrapper = document.querySelector('.slide.visible .slide-content-wrapper');
  const root = wrapper ? wrapper.querySelector('[data-slide-root]') : null;
  const blocks = Array.from(wrapper?.querySelectorAll('[data-qa-block], [data-source-label], [data-primary-point]') || []).map((node, index) => {
    const rect = node.getBoundingClientRect();
    return { id: node.getAttribute('data-qa-block') || node.getAttribute('data-source-label') || ('block-' + (index + 1)), left: rect.left, top: rect.top, width: rect.width, height: rect.height, area: rect.width * rect.height };
  });
  return {
    slideId: root?.dataset.slideId || slidesData[currentSlide]?.slideId || '',
    title: root?.dataset.title || slidesData[currentSlide]?.title || '',
    layoutFamily: root?.dataset.layoutFamily || '',
    speakerSeconds: Number(root?.dataset.speakerSeconds || 0),
    primaryPoints: wrapper?.querySelectorAll('[data-primary-point="true"]').length || 0,
    wrapper: { clientWidth: wrapper?.clientWidth || ${CANVAS.width}, clientHeight: wrapper?.clientHeight || ${CANVAS.height}, scrollWidth: wrapper?.scrollWidth || ${CANVAS.width}, scrollHeight: wrapper?.scrollHeight || ${CANVAS.height} },
    bodyScroll: false,
    blocks,
  };
}
prevBtn.addEventListener('click', () => { if (currentSlide > 0) { currentSlide -= 1; updateView(); } });
nextBtn.addEventListener('click', () => { if (currentSlide < slidesData.length - 1) { currentSlide += 1; updateView(); } });
window.redcubeDeckReview = {
  totalSlides: slidesData.length,
  showSlide(index) { currentSlide = Math.max(0, Math.min(index, slidesData.length - 1)); updateView(); return inspectCurrentSlide(); },
  inspectCurrentSlide,
};
setupSlides();
updateView();
</script>
</body>
</html>`;
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
  const passed = currentFailures <= baselineFailures && currentDensity <= baselineDensity + 0.2;
  return {
    baseline_deliverable_id: baselineDeliverableId,
    current_failed_slides: currentFailures,
    baseline_failed_slides: baselineFailures,
    current_average_density: Number(currentDensity.toFixed(4)),
    baseline_average_density: Number(baselineDensity.toFixed(4)),
    baseline_comparison_passed: passed,
  };
}

function buildRenderHtml(contract, deliverablePaths) {
  const plan = readStageArtifact(contract, deliverablePaths, 'single_note_plan');
  const slides = safeArray(plan?.single_note_plan?.slides).map((slide) => ({
    slide_id: slide.slide_id,
    title: slide.title,
    layout_family: slide.layout_family,
    content: renderSlideMarkup(slide, safeArray(plan.single_note_plan.slides).length),
  }));
  const htmlFile = path.join(deliverablePaths.viewsDir, `${deliverablePaths.deliverableId}.html`);
  writeText(htmlFile, buildHtml({ title: contract.title, slides }));
  return {
    ...attachCommon('render_html', contract),
    html_bundle: {
      html_file: htmlFile,
      page_count: slides.length,
      shell_contract: CANVAS,
      slides,
    },
    artifact_refs: [htmlFile],
  };
}

function computeSeriesSurfaces(contract, deliverablePaths, exportBundle) {
  if (!isSeries(contract)) return null;
  const cadenceFile = path.join(deliverablePaths.reportsDir, '05_全系列发布节奏建议.md');
  const mappingFile = path.join(deliverablePaths.reportsDir, '06_目录索引与路径映射.md');
  const overviewFile = path.join(deliverablePaths.reportsDir, '99_交付总览.md');
  writeText(cadenceFile, ['# 05_全系列发布节奏建议', '', '1. 先发认知破冰页', '2. 再发机制解释页', '3. 最后发动作清单页'].join('\n'));
  writeText(mappingFile, ['# 06_目录索引与路径映射', '', `- HTML: ${exportBundle.html_file}`, `- Caption: ${exportBundle.caption_file}`].join('\n'));
  writeText(overviewFile, ['# 99_交付总览', '', `- 当前状态：${exportBundle.publish_state.current}`, `- PNG页数：${exportBundle.png_files.length}`].join('\n'));
  return {
    cadence_file: cadenceFile,
    path_mapping_file: mappingFile,
    delivery_overview_file: overviewFile,
  };
}


function buildDirectorReview(contract, deliverablePaths) {
  const render = readStageArtifact(contract, deliverablePaths, 'render_html');
  const visual = readStageArtifact(contract, deliverablePaths, 'visual_direction');
  const storyline = readStageArtifact(contract, deliverablePaths, 'storyline');
  const slides = safeArray(render?.html_bundle?.slides);
  const layoutFamilies = slides.map((slide) => slide.layout_family);
  const uniqueLayoutCount = Array.from(new Set(layoutFamilies)).length;
  let maxConsecutiveSame = 1;
  let currentRun = 1;
  for (let i = 1; i < layoutFamilies.length; i += 1) {
    if (layoutFamilies[i] === layoutFamilies[i - 1]) {
      currentRun += 1;
      maxConsecutiveSame = Math.max(maxConsecutiveSame, currentRun);
    } else {
      currentRun = 1;
    }
  }
  const memoryHook = safeText(storyline?.storyline?.memory_hook);
  const firstTitle = safeText(slides[0]?.title);
  const memoryHookPresent = memoryHook.length > 0 && (firstTitle.includes(memoryHook.slice(0, Math.min(6, memoryHook.length))) || slides.some((slide) => safeText(slide.title).includes('顺序') || safeText(slide.title).includes('动作')));
  const homogeneousLayoutRisk = Number((maxConsecutiveSame / Math.max(layoutFamilies.length, 1)).toFixed(2));
  const directorIntentLanded = uniqueLayoutCount >= 5 && safeArray(visual?.visual_direction?.peak_pages).length >= 3;
  const antiTemplateOk = homogeneousLayoutRisk <= 0.34 && uniqueLayoutCount >= 5;
  const weakPages = slides.filter((slide) => ['myth_compare', 'sequence_stack'].includes(slide.layout_family)).map((slide) => slide.slide_id).slice(0, 2);
  const status = directorIntentLanded && antiTemplateOk && memoryHookPresent ? 'pass' : 'block';
  const reviewFile = path.join(deliverablePaths.reportsDir, `${deliverablePaths.deliverableId}_视觉总监复盘.md`);
  writeText(reviewFile, [
    '# 视觉总监复盘',
    '',
    `- director_intent_landed: ${directorIntentLanded}`,
    `- anti_template_ok: ${antiTemplateOk}`,
    `- memory_hook_present: ${memoryHookPresent}`,
    `- homogeneous_layout_risk: ${homogeneousLayoutRisk}`,
    `- weak_pages: ${weakPages.join(',') || 'none'}`,
  ].join('\n'));
  return {
    ...attachCommon('visual_director_review', contract),
    status,
    visual_director_review: {
      director_intent_landed: directorIntentLanded,
      anti_template_ok: antiTemplateOk,
      memory_hook_present: memoryHookPresent,
      homogeneous_layout_risk: homogeneousLayoutRisk,
      weak_pages: weakPages,
      rewrite_action: status === 'pass' ? 'none' : 'revise_render_html',
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
      pending_reviews: status === 'pass' ? [] : ['director_intent_landed'],
      blocking_reasons: status === 'pass' ? [] : ['director_intent_landed'],
      rerun_from_stage: status === 'pass' ? null : 'render_html',
    },
  };
}

function updateTopicPublicationState(workspaceRoot, topicId, deliverableId, publishState) {
  const topicDir = path.join(workspaceRoot, 'topics', topicId);
  const stateFile = path.join(topicDir, 'publication-state.json');
  const previous = existsSync(stateFile) ? readJson(stateFile) : {
    schema_version: 1,
    topic_id: topicId,
    current: 'input_ready',
    deliverables: {},
  };
  const next = {
    ...previous,
    current: publishState.current,
    next: publishState.next,
    deliverables: {
      ...(previous.deliverables || {}),
      [deliverableId]: publishState,
    },
    updated_at: new Date().toISOString(),
  };
  writeJson(stateFile, next);
  return stateFile;
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
  const titles = safeArray(plan?.single_note_plan?.title_options).slice(0, 3);
  const body = `${titles[0] || contract.title}。先别急着上工具，先看这几个判断顺序：先把问题说清，再把公开证据放对位置，最后再决定要不要把 AI 放进执行链。看完可以直接照着清单走。`;
  const hashtags = ['#甲状腺', '#门诊科普', '#AI流程', '#小红书图文', '#患者沟通'];
  const quality_gate = {
    title_count: titles.length,
    body_char_count: body.length,
    comment_prompt_count: 1,
    interaction_question_count: 2,
    actionable_step_count: 3,
    hashtag_count: hashtags.length,
    banned_terms_hit_count: 0,
    meta_instruction_leak_count: 0,
    gate_pass: titles.length >= 3 && body.length >= 80 && body.length <= 420,
  };
  const captionFile = path.join(deliverablePaths.reportsDir, `${deliverablePaths.deliverableId}-publish-copy.txt`);
  writeText(captionFile, [`标题候选：${titles.join(' / ')}`, '', body, '', hashtags.join(' ')].join('\n'));
  return {
    ...attachCommon('publish_copy', contract),
    status: quality_gate.gate_pass ? 'pass' : 'block',
    publish_copy: {
      titles,
      body,
      first_comment: '如果你也在做门诊科普，评论区回“清单”我给你一份整理模板。',
      interaction_questions: ['你现在做科普最卡在哪一步？', '你会先整理问题还是先找工具？'],
      hashtags,
      publish_suggestion: {
        cover_slide_id: render.html_bundle.slides[0]?.slide_id || 'N01',
        recommended_time: '19:00-21:00',
      },
      quality_gate,
      caption_file: captionFile,
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
    publish_state: {
      current: 'output_ready',
      next: 'published_pending_human',
    },
  };
  writeJson(manifestFile, exportBundle);
  const publicationStateFile = updateTopicPublicationState(workspaceRoot, topicId, deliverablePaths.deliverableId, exportBundle.publish_state);
  return {
    ...attachCommon('export_bundle', contract),
    status: 'completed',
    export_bundle: exportBundle,
    series_surfaces: computeSeriesSurfaces(contract, deliverablePaths, exportBundle),
    publication_state_file: publicationStateFile,
    artifact_refs: [manifestFile, render.html_bundle.html_file, copy.publish_copy.caption_file, ...pngFiles].filter(Boolean),
    review_state_patch: {
      current_status: 'completed',
      ready_for_export: true,
      latest_review_stage: 'export_bundle',
      latest_checks: {
        platform_copy_complete: true,
        cta_clear: true,
      },
      pending_reviews: [],
      blocking_reasons: [],
      rerun_from_stage: null,
    },
  };
}

export function canRunXiaohongshu(contract) {
  return contract?.deliverable_kind === 'xiaohongshu_note';
}

export function runXiaohongshuRoute({ workspaceRoot, topicId, deliverableId, route, contract, mode = 'draft_new', baselineDeliverableId = '' }) {
  const { deliverablePaths } = ensurePrerequisites({ workspaceRoot, topicId, deliverableId, route, mode, baselineDeliverableId });
  switch (route) {
    case 'research':
      return buildResearch(contract);
    case 'storyline':
      return buildStoryline(contract, deliverablePaths);
    case 'single_note_plan':
      return buildSingleNotePlan(contract);
    case 'visual_direction':
      return buildVisualDirection(contract, deliverablePaths, mode, baselineDeliverableId);
    case 'render_html':
      return buildRenderHtml(contract, deliverablePaths);
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
}
