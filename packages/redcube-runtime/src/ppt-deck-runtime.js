import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';

import { getDeliverablePaths } from '@redcube/runtime-protocol';

const MODULE_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(MODULE_DIR, '../../..');
const PYTHON_REVIEW = path.join(MODULE_DIR, '../scripts/ppt_deck_review.py');
const PYTHON_EXPORT = path.join(MODULE_DIR, '../scripts/ppt_deck_export.py');
const PROMPT_PACK = Object.freeze({
  storyline: 'prompts/ppt_deck/storyline.md',
  detailed_outline: 'prompts/ppt_deck/detailed_outline.md',
  slide_blueprint: 'prompts/ppt_deck/slide_blueprint.md',
  visual_direction: 'prompts/ppt_deck/visual_direction.md',
  render_html: 'prompts/ppt_deck/render_html.md',
  screenshot_review: 'prompts/ppt_deck/screenshot_review.md',
  export_pptx: 'prompts/ppt_deck/export_pptx.md',
});
const STAGE_REQUIREMENTS = Object.freeze({
  storyline: { requires_artifacts: [] },
  detailed_outline: { requires_artifacts: ['storyline'] },
  slide_blueprint: { requires_artifacts: ['detailed_outline'] },
  visual_direction: { requires_artifacts: ['slide_blueprint'] },
  render_html: { requires_artifacts: ['slide_blueprint', 'visual_direction'] },
  screenshot_review: { requires_artifacts: ['render_html'] },
  export_pptx: { requires_artifacts: ['screenshot_review'], requires_review_pass: true },
});
const CANVAS = Object.freeze({ width: 1152, height: 648, ratio: '16:9' });
const BANNED_RENDER_TOKENS = ['renderSlide', 'layoutByType', 'cardsGrid', 'pageType'];

function safeText(value) {
  return String(value || '').trim();
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
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
  const relativePath = PROMPT_PACK[route];
  const absolutePath = path.join(REPO_ROOT, relativePath);
  if (!existsSync(absolutePath)) return null;
  const raw = readFileSync(absolutePath, 'utf-8');
  const match = raw.match(/## runtime_seed\s*```json\s*([\s\S]*?)\s*```/);
  if (!match) return null;
  return renderSeedValue(JSON.parse(match[1]), vars);
}

function extraChecks(contract) {
  const required = safeArray(contract?.review_surface?.required_checks);
  return required.filter((check) => !['overflow_free', 'occlusion_free', 'visual_density_ok', 'speaker_fit_ok'].includes(check));
}

function deriveProfileChecks(contract, blueprintArtifact, storylineArtifact) {
  const slides = safeArray(blueprintArtifact?.slide_blueprint?.slides);
  const pageTypes = slides.map((slide) => slide.page_type);
  switch (contract.profile_id) {
    case 'lecture_student':
      return {
        term_explained_on_first_use: slides.some((slide) => ['central_axis', 'myth_fact_split', 'cover_signal'].includes(slide.page_type) && safeArray(slide.page_core_content).length >= 2),
        teaching_progression_clear: ['cover_signal', 'mechanism_track', 'decision_gate', 'closure_peak'].every((type) => pageTypes.includes(type)),
      };
    case 'lecture_peer':
      return {
        novelty_position_clear: safeText(storylineArtifact?.storyline?.narrative_arc?.journey?.[0]).length > 0,
        method_boundary_explicit: pageTypes.includes('judgement_ladder'),
      };
    case 'executive_briefing':
      return {
        decision_implication_clear: slides.some((slide) => safeText(slide.page_goal).includes('动作') || safeText(slide.page_goal).includes('决策')),
        conclusion_up_front: safeText(slides[0]?.core_sentence || '').length > 0,
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
        promise: '让学生看懂 AI 不是工具清单，而是问题拆解、证据判断与执行闭环',
        speaker_seconds: 55,
      };
    case 'lecture_peer':
      return {
        speaker: '同行讲者',
        audience: '临床科研同行',
        promise: '让同行快速对齐问题、方法、证据与边界',
        speaker_seconds: 65,
      };
    case 'executive_briefing':
      return {
        speaker: '汇报型讲者',
        audience: '医院管理层',
        promise: '让决策者先看到关键判断，再理解资源路径与风险',
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

function buildOutlineSlides(contract) {
  const title = safeText(contract.title || '未命名课件');
  const goal = safeText(contract.goal || '讲清主线与动作');
  const preset = deckPreset(contract.profile_id);
  const publicSources = [
    '公开来源：临床指南 / 系统综述 / 监管原则',
    '公开来源：同行评议论文 / 真实世界研究',
    '公开来源：公开流程规范 / 教学案例',
  ];
  const seed = promptSeed('detailed_outline', {
    title,
    goal,
    public_source_1: publicSources[0],
    public_source_2: publicSources[1],
    public_source_3: publicSources[2],
  });
  if (Array.isArray(seed?.slides) && seed.slides.length > 0) {
    return seed.slides.map((slide) => ({
      ...slide,
      public_sources: Array.isArray(slide.public_sources) && slide.public_sources.length > 0
        ? slide.public_sources
        : [publicSources[0], publicSources[1], publicSources[2]],
    }));
  }

  return [
    {
      slide_id: 'S01',
      slide_no: 1,
      page_type: 'cover_peak',
      layout_family: 'cover_hero',
      title,
      page_goal: '先定义讲课主问题与听众收益',
      core_sentence: preset.promise,
      page_objective: '建立全场问题、听众收益与课程基调',
      evidence_points: ['为什么现在值得学', '今天不讲工具堆砌', goal],
      public_sources: publicSources.slice(0, 1),
    },
    {
      slide_id: 'S02',
      slide_no: 2,
      page_type: 'stakes_window',
      layout_family: 'multi_zone_compare',
      title: '旧工作流为什么会在这里失效',
      page_goal: '建立问题紧迫性',
      core_sentence: '如果不先拆清任务边界，AI 只会放大错误期待',
      page_objective: '先讲失败模式，再讲 AI 能接什么、不能接什么',
      evidence_points: ['任务定义断裂', '证据质量断裂', '输出解释断裂'],
      public_sources: publicSources.slice(0, 2),
    },
    {
      slide_id: 'S03',
      slide_no: 3,
      page_type: 'central_axis',
      layout_family: 'central_axis',
      title: '把问题、证据、动作绑到同一条轴线',
      page_goal: '让听众抓住总框架',
      core_sentence: '课堂不是堆信息，而是让问题、证据、动作同步推进',
      page_objective: '建立同轴推进的教学骨架',
      evidence_points: ['问题轴', '证据轴', '动作轴'],
      public_sources: publicSources.slice(0, 1),
    },
    {
      slide_id: 'S04',
      slide_no: 4,
      page_type: 'timeline_band',
      layout_family: 'timeline_band',
      title: '从首问到落地的讲授推进轨道',
      page_goal: '展示页面推进节奏',
      core_sentence: '每一页都要知道自己在推进哪一步，而不是重复安全模板',
      page_objective: '显式给出起势、解释、证据、动作、复盘的推进顺序',
      evidence_points: ['起势', '解释', '证据', '动作', '复盘'],
      public_sources: publicSources.slice(0, 2),
    },
    {
      slide_id: 'S05',
      slide_no: 5,
      page_type: 'judgement_ladder',
      layout_family: 'judgement_ladder',
      title: '判断梯：哪些环节适合 AI，哪些必须人工签收',
      page_goal: '讲清边界与风险控制',
      core_sentence: '不要把所有节点都交给同一种模型能力',
      page_objective: '让听众知道何时可信、何时必须人工兜底',
      evidence_points: ['可自动整理', '可 AI 辅助判断', '必须人工签收'],
      public_sources: publicSources.slice(0, 2),
    },
    {
      slide_id: 'S06',
      slide_no: 6,
      page_type: 'evidence_surface',
      layout_family: 'multi_zone_compare',
      title: '证据页必须把来源口径讲给听众听懂',
      page_goal: '建立可信度',
      core_sentence: '证据页不只是贴引用，而是让听众知道结论站在什么公开来源上',
      page_objective: '公开来源与结论必须同屏出现',
      evidence_points: ['公开指南', '同行评议文献', '公开流程资料'],
      public_sources: publicSources,
    },
    {
      slide_id: 'S07',
      slide_no: 7,
      page_type: 'ring_cross',
      layout_family: 'ring_cross',
      title: '把方法落成课堂上的四格动作',
      page_goal: '形成课后可执行框架',
      core_sentence: '讲者最终要给听众一个下课后还能复用的动作框架',
      page_objective: '从课堂内容落成实践步骤',
      evidence_points: ['定义问题', '绑定证据', '组织执行', '复盘回修'],
      public_sources: publicSources.slice(1),
    },
    {
      slide_id: 'S08',
      slide_no: 8,
      page_type: 'closure_peak',
      layout_family: 'summary_peak',
      title: '最后只收束三件必须带走的事',
      page_goal: '回收主线并给出动作清单',
      core_sentence: '结尾页不是重复目录，而是把整条主线压成可回忆的判断句',
      page_objective: '留下记忆点与下一步动作',
      evidence_points: ['先把任务定义清楚', '再把证据界面搭出来', '最后再让 AI 进入执行链'],
      public_sources: publicSources.slice(0, 1),
    },
  ];
}

function attachCommon(route, contract) {
  return {
    route,
    overlay: contract.overlay,
    profile_id: contract.profile_id,
    produced_at: new Date().toISOString(),
    prompt_pack: promptMeta(route),
  };
}

function buildStoryline(contract) {
  const preset = deckPreset(contract.profile_id);
  const seed = promptSeed('storyline', { promise: preset.promise });
  return {
    ...attachCommon('storyline', contract),
    storyline: {
      speaker: preset.speaker,
      audience: preset.audience,
      goal: safeText(contract.goal),
      style: preset.promise,
      core_metaphor: safeText(seed?.storyline?.core_metaphor, '把 AI 放回科研链，而不是神化成万能入口'),
      narrative_arc: {
        hook: safeArray(seed?.storyline?.hook).length > 0 ? seed.storyline.hook : ['先定义问题与听众收益'],
        journey: safeArray(seed?.storyline?.journey).length > 0 ? seed.storyline.journey : [
          '把问题拆成可解释的结构',
          '把证据放回公开来源与适用边界',
          '把结论落成可执行动作',
        ],
        resolution: safeArray(seed?.storyline?.resolution).length > 0 ? seed.storyline.resolution : ['带着判断框架与复盘清单离场'],
      },
    },
  };
}

function buildDetailedOutline(contract) {
  const slides = buildOutlineSlides(contract);
  return {
    ...attachCommon('detailed_outline', contract),
    detailed_outline: {
      chapter_structure: [
        { chapter_id: 'C1', title: '问题重构', slide_range: '01-03' },
        { chapter_id: 'C2', title: '结构与节奏', slide_range: '04-06' },
        { chapter_id: 'C3', title: '实践收束', slide_range: '07-08' },
      ],
      page_budget: {
        total_slides: slides.length,
      },
      slides: slides.map((slide) => ({
        slide_no: String(slide.slide_no).padStart(2, '0'),
        title: slide.title,
        page_objective: slide.page_objective,
        core_sentence: slide.core_sentence,
        evidence_points: slide.evidence_points,
      })),
    },
  };
}

function makeBlueprintSlide(slide, index, slides, contract) {
  const preset = deckPreset(contract.profile_id);
  return {
    slide_id: slide.slide_id,
    slide_no: slide.slide_no,
    page_type: slide.page_type,
    title: slide.title,
    page_goal: slide.page_goal,
    page_core_content: [
      { label: '核心句', text: slide.core_sentence },
      ...slide.evidence_points.map((item, itemIndex) => ({ label: `展开${itemIndex + 1}`, text: item })),
    ],
    visual_presentation: {
      layout_family: slide.layout_family,
      anchor_tracks: anchorTracksForFamily(slide.layout_family),
      canvas: CANVAS,
    },
    evidence_and_sources: slide.public_sources.map((source, sourceIndex) => ({
      source_id: `SRC-${slide.slide_no}-${sourceIndex + 1}`,
      public_label: source,
    })),
    speaker_notes: `${slide.core_sentence}。先用一句话点明本页任务，再按 ${slide.evidence_points.length} 个展开点说明为什么这一步不能跳过。`,
    speaker_seconds: preset.speaker_seconds + (slide.layout_family === 'judgement_ladder' ? 10 : 0),
    transition_sentence: index === slides.length - 1
      ? '最后把三件必须带走的事压成行动清单。'
      : `讲完这一页后，顺着“${slides[index + 1].title}”进入下一页。`,
  };
}

function anchorTracksForFamily(layoutFamily) {
  switch (layoutFamily) {
    case 'central_axis':
      return ['vertical-axis', 'judgement-stops'];
    case 'timeline_band':
      return ['horizontal-track', 'timeline-stops'];
    case 'judgement_ladder':
      return ['ladder-rungs', 'action-checkpoints'];
    case 'ring_cross':
      return ['center-hub', 'cross-zones'];
    case 'multi_zone_compare':
      return ['left-zone', 'center-divider', 'right-zone'];
    default:
      return ['title-column', 'argument-band'];
  }
}

function buildSlideBlueprint(contract) {
  const seed = promptSeed('slide_blueprint');
  const slides = buildOutlineSlides(contract);
  return {
    ...attachCommon('slide_blueprint', contract),
    slide_blueprint: {
      chapter_goal: '逐页落实讲授型 deck 的页面目标、视觉结构与讲稿动作',
      slides: slides.map((slide, index) => makeBlueprintSlide(slide, index, slides, contract)),
      quality_guards: {
        ...(seed?.quality_guards || {}),
        require_visual_direction_before_html: true,
        forbid_template_route_tokens: BANNED_RENDER_TOKENS,
        canvas: CANVAS,
      },
      profile_checks: safeArray(seed?.profile_checks?.[contract.profile_id]),
    },
  };
}

function buildVisualDirection(contract, blueprintArtifact, mode, baselineDeliverableId) {
  const slides = blueprintArtifact.slide_blueprint.slides;
  const seed = promptSeed('visual_direction', { title: contract.title });
  return {
    ...attachCommon('visual_direction', contract),
    visual_direction: {
      visual_manifest: safeText(seed?.visual_direction?.visual_manifest, '浅底高对比、关键页允许峰值、复杂结构显式锚点'),
      what_it_is: safeArray(seed?.visual_direction?.what_it_is).length > 0 ? seed.visual_direction.what_it_is : ['成熟讲者工作台', '结构解释驱动视觉组织'],
      what_it_is_not: safeArray(seed?.visual_direction?.what_it_is_not).length > 0 ? seed.visual_direction.what_it_is_not : ['统一安全模板页', '内部占位来源', '小红书语义替代'],
      palette: {
        canvas: '#F7F8FC',
        ink: '#0F172A',
        accent: '#2563EB',
        accentSoft: '#DBEAFE',
        success: '#0F766E',
      },
      continuity_constraints: [
        '关键页必须与相邻页形成明显差异',
        '来源与页码按页控制',
        '复杂结构页必须显式写出锚点/轨道/网格',
      ],
      peak_pages: ['S01', 'S04', 'S06', 'S08'],
      page_role_table: slides.map((slide) => ({
        slide_id: slide.slide_id,
        title: slide.title,
        page_role: slide.visual_presentation.layout_family,
        first_glance: slide.visual_presentation.anchor_tracks[0],
        second_glance: slide.visual_presentation.anchor_tracks[1] || slide.visual_presentation.anchor_tracks[0],
      })),
      final_instruction_to_html_generator: safeArray(seed?.visual_direction?.final_instruction_to_html_generator).length > 0
        ? seed.visual_direction.final_instruction_to_html_generator
        : [
          '每页在 slidesData 中独立 content',
          '不得退化成统一模板页',
          '先落实导演稿峰值页，再处理安全页',
        ],
      baseline_deliverable_id: safeText(baselineDeliverableId) || null,
      mode,
    },
  };
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

function bulletRow(text) {
  return `<div data-qa-block="row" data-primary-point="true" style="display:grid;grid-template-columns:12px 1fr;gap:12px;align-items:start;padding:12px 0;"><div style="width:10px;height:10px;border-radius:999px;background:#2563EB;margin-top:8px;"></div><div style="font-size:22px;line-height:1.45;color:#0F172A;">${escapeHtml(text)}</div></div>`;
}

function sourceRail(sources) {
  return `<div data-qa-block="sources" style="display:flex;gap:8px;flex-wrap:wrap;">${sources.map((source) => `<span data-source-label="true" style="display:inline-flex;padding:6px 10px;border-radius:999px;background:rgba(15,23,42,0.08);font-size:12px;color:#0F172A;">${escapeHtml(source.public_label)}</span>`).join('')}</div>`;
}

function renderSlideMarkup(slide, visualDirection, totalSlides) {
  const palette = visualDirection.palette;
  const points = slide.page_core_content.slice(1);
  const footer = `<div data-qa-block="footer" style="position:absolute;left:48px;right:48px;bottom:24px;display:flex;justify-content:space-between;align-items:center;font-size:14px;color:#475569;"><div>${sourceRail(slide.evidence_and_sources)}</div><div style="font-weight:700;">${String(slide.slide_no).padStart(2, '0')} / ${String(totalSlides).padStart(2, '0')}</div></div>`;
  const header = `<header data-qa-block="header" style="display:grid;gap:8px;"><div style="font-size:14px;letter-spacing:0.08em;text-transform:uppercase;font-weight:800;color:${palette.accent};">${escapeHtml(slide.page_goal)}</div><h2 style="margin:0;font-size:40px;line-height:1.15;color:${palette.ink};">${escapeHtml(slide.title)}</h2><p style="margin:0;font-size:22px;line-height:1.55;color:#334155;max-width:760px;">${escapeHtml(slide.page_core_content[0].text)}</p></header>`;

  if (slide.visual_presentation.layout_family === 'timeline_band') {
    return `<div data-slide-root="true" data-slide-id="${slide.slide_id}" data-title="${escapeHtml(slide.title)}" data-speaker-seconds="${slide.speaker_seconds}" data-layout-family="timeline_band" style="position:relative;width:${CANVAS.width}px;height:${CANVAS.height}px;background:${palette.canvas};overflow:hidden;padding:44px 52px 56px;"><div class="deck-slide" style="display:grid;grid-template-rows:auto 1fr;gap:24px;height:100%;">${header}<div data-qa-block="timeline" style="display:grid;grid-template-columns:repeat(${points.length},1fr);gap:16px;align-items:end;">${points.map((point, index) => `<section data-qa-block="timeline-card" style="display:grid;gap:12px;"><div style="width:22px;height:22px;border-radius:999px;background:${palette.accent};box-shadow:0 0 0 10px rgba(37,99,235,0.12);"></div><div style="padding:18px;border-radius:22px;background:#FFFFFF;border:1px solid #CBD5E1;min-height:220px;"><div style="font-size:17px;font-weight:800;color:${palette.accent};margin-bottom:8px;">Step ${index + 1}</div><div style="font-size:22px;line-height:1.45;color:${palette.ink};">${escapeHtml(point.text)}</div></div></section>`).join('')}</div></div>${footer}</div>`;
  }

  if (slide.visual_presentation.layout_family === 'judgement_ladder') {
    return `<div data-slide-root="true" data-slide-id="${slide.slide_id}" data-title="${escapeHtml(slide.title)}" data-speaker-seconds="${slide.speaker_seconds}" data-layout-family="judgement_ladder" style="position:relative;width:${CANVAS.width}px;height:${CANVAS.height}px;background:${palette.canvas};overflow:hidden;padding:44px 52px 56px;"><div class="deck-slide" style="display:grid;grid-template-rows:auto 1fr;gap:20px;height:100%;">${header}<div data-qa-block="ladder" style="display:grid;gap:14px;">${points.map((point, index) => `<div data-qa-block="ladder-row" data-primary-point="true" style="display:grid;grid-template-columns:72px 1fr;gap:12px;align-items:stretch;"><div style="border-radius:18px;background:${palette.accent};color:#FFFFFF;font-size:26px;font-weight:800;display:flex;align-items:center;justify-content:center;">${index + 1}</div><div style="padding:16px 18px;border-radius:18px;background:#FFFFFF;border:1px solid #CBD5E1;display:flex;align-items:center;font-size:22px;line-height:1.45;color:${palette.ink};">${escapeHtml(point.text)}</div></div>`).join('')}</div></div>${footer}</div>`;
  }

  if (slide.visual_presentation.layout_family === 'ring_cross') {
    const center = points[0]?.text || slide.page_goal;
    return `<div data-slide-root="true" data-slide-id="${slide.slide_id}" data-title="${escapeHtml(slide.title)}" data-speaker-seconds="${slide.speaker_seconds}" data-layout-family="ring_cross" style="position:relative;width:${CANVAS.width}px;height:${CANVAS.height}px;background:${palette.canvas};overflow:hidden;padding:44px 52px 56px;"><div class="deck-slide" style="display:grid;grid-template-rows:auto 1fr;gap:20px;height:100%;">${header}<div data-qa-block="cross" style="position:relative;min-height:360px;"><div data-qa-block="hub" style="position:absolute;left:50%;top:50%;transform:translate(-50%, -50%);width:260px;min-height:140px;border-radius:28px;background:linear-gradient(135deg, rgba(37,99,235,0.16), #FFFFFF);border:1px solid rgba(37,99,235,0.22);display:grid;place-items:center;text-align:center;padding:28px;font-size:24px;font-weight:800;color:${palette.ink};">${escapeHtml(center)}</div><div data-qa-block="north" style="position:absolute;left:50%;top:0;transform:translateX(-50%);width:250px;min-height:98px;padding:16px;border-radius:22px;background:#FFFFFF;border:1px solid #CBD5E1;display:grid;place-items:center;text-align:center;font-size:22px;font-weight:700;color:${palette.ink};">${escapeHtml(points[1]?.text || '')}</div><div data-qa-block="east" style="position:absolute;right:0;top:50%;transform:translateY(-50%);width:250px;min-height:98px;padding:16px;border-radius:22px;background:#FFFFFF;border:1px solid #CBD5E1;display:grid;place-items:center;text-align:center;font-size:22px;font-weight:700;color:${palette.ink};">${escapeHtml(points[2]?.text || '')}</div><div data-qa-block="south" style="position:absolute;left:50%;bottom:0;transform:translateX(-50%);width:250px;min-height:98px;padding:16px;border-radius:22px;background:#FFFFFF;border:1px solid #CBD5E1;display:grid;place-items:center;text-align:center;font-size:22px;font-weight:700;color:${palette.ink};">${escapeHtml(points[3]?.text || slide.transition_sentence)}</div><div data-qa-block="west" style="position:absolute;left:0;top:50%;transform:translateY(-50%);width:250px;min-height:98px;padding:16px;border-radius:22px;background:#FFFFFF;border:1px solid #CBD5E1;display:grid;place-items:center;text-align:center;font-size:22px;font-weight:700;color:${palette.ink};">${escapeHtml(slide.transition_sentence)}</div></div></div>${footer}</div>`;
  }

  if (slide.visual_presentation.layout_family === 'central_axis') {
    return `<div data-slide-root="true" data-slide-id="${slide.slide_id}" data-title="${escapeHtml(slide.title)}" data-speaker-seconds="${slide.speaker_seconds}" data-layout-family="central_axis" style="position:relative;width:${CANVAS.width}px;height:${CANVAS.height}px;background:${palette.canvas};overflow:hidden;padding:44px 52px 56px;"><div class="deck-slide" style="display:grid;grid-template-rows:auto 1fr;gap:20px;height:100%;">${header}<div data-qa-block="axis" style="position:relative;display:grid;grid-template-columns:repeat(${points.length},1fr);gap:18px;align-items:center;"><div style="position:absolute;left:40px;right:40px;top:50%;height:6px;border-radius:999px;background:linear-gradient(90deg, rgba(37,99,235,0.2), rgba(37,99,235,0.65));"></div>${points.map((point, index) => `<section data-qa-block="axis-card" data-primary-point="true" style="position:relative;display:grid;gap:10px;justify-items:center;"><div style="width:56px;height:56px;border-radius:999px;background:${palette.accent};color:#FFFFFF;display:flex;align-items:center;justify-content:center;font-weight:800;box-shadow:0 10px 24px rgba(37,99,235,0.25);">${index + 1}</div><div style="padding:16px 16px 18px;min-height:170px;border-radius:22px;background:#FFFFFF;border:1px solid #CBD5E1;display:grid;gap:8px;"><div style="font-size:17px;font-weight:800;color:${palette.accent};">轴线 ${index + 1}</div><div style="font-size:22px;line-height:1.45;color:${palette.ink};">${escapeHtml(point.text)}</div></div></section>`).join('')}</div></div>${footer}</div>`;
  }

  if (slide.visual_presentation.layout_family === 'summary_peak') {
    return `<div data-slide-root="true" data-slide-id="${slide.slide_id}" data-title="${escapeHtml(slide.title)}" data-speaker-seconds="${slide.speaker_seconds}" data-layout-family="summary_peak" style="position:relative;width:${CANVAS.width}px;height:${CANVAS.height}px;background:${palette.canvas};overflow:hidden;padding:44px 52px 56px;"><div class="deck-slide" style="display:grid;grid-template-rows:auto 1fr;gap:20px;height:100%;">${header}<div data-qa-block="summary" style="display:grid;grid-template-columns:repeat(2,1fr);gap:18px;align-items:stretch;">${points.map((point, index) => `<section data-qa-block="summary-card" data-primary-point="true" style="padding:20px;border-radius:22px;background:#FFFFFF;border:1px solid #CBD5E1;display:grid;gap:10px;"><div style="font-size:13px;font-weight:800;letter-spacing:0.06em;text-transform:uppercase;color:${palette.accent};">带走 ${index + 1}</div><div style="font-size:24px;line-height:1.45;color:${palette.ink};">${escapeHtml(point.text)}</div></section>`).join('')}</div></div>${footer}</div>`;
  }

  return `<div data-slide-root="true" data-slide-id="${slide.slide_id}" data-title="${escapeHtml(slide.title)}" data-speaker-seconds="${slide.speaker_seconds}" data-layout-family="multi_zone_compare" style="position:relative;width:${CANVAS.width}px;height:${CANVAS.height}px;background:${palette.canvas};overflow:hidden;padding:44px 52px 56px;"><div class="deck-slide" style="display:grid;grid-template-rows:auto 1fr;gap:20px;height:100%;">${header}<div data-qa-block="zones" style="display:grid;grid-template-columns:repeat(${Math.max(points.length, 2)},1fr);gap:18px;align-items:stretch;">${points.map((point, index) => `<section data-qa-block="zone-card" data-primary-point="true" style="padding:20px;border-radius:24px;background:#FFFFFF;border:1px solid #CBD5E1;display:grid;gap:10px;"><div style="font-size:13px;font-weight:800;letter-spacing:0.06em;text-transform:uppercase;color:${palette.accent};">展开 ${index + 1}</div><div style="font-size:24px;line-height:1.45;color:${palette.ink};">${escapeHtml(point.text)}</div></section>`).join('')}</div></div>${footer}</div>`;
}

function buildDeckHtml({ title, slidesMarkup }) {
  const slidesLiteral = slidesMarkup.map((slide) => `  { slideId: '${slide.slide_id}', title: ${JSON.stringify(slide.title)}, layoutFamily: '${slide.layout_family}', content: \`${escapeTemplate(slide.content)}\` }`).join(',\n');
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
  <style>
    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; min-height: 100%; overflow: hidden; background: #e2e8f0; }
    body { display: flex; align-items: center; justify-content: center; padding: 24px; color: #0F172A; font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Microsoft YaHei', sans-serif; }
    #app-container { width: min(1280px, 96vw); }
    #slide-display-area { width: 100%; aspect-ratio: 16 / 9; position: relative; overflow: hidden; border-radius: 28px; background: #FFFFFF; box-shadow: 0 24px 60px rgba(15, 23, 42, 0.14); }
    #control-panel { margin-top: 14px; display: flex; align-items: center; justify-content: space-between; gap: 12px; background: rgba(255,255,255,0.92); border-radius: 20px; padding: 12px 18px; box-shadow: 0 16px 40px rgba(15, 23, 42, 0.10); }
    button { border: 0; cursor: pointer; border-radius: 14px; padding: 12px 20px; font-weight: 700; background: #0F172A; color: white; }
    button:disabled { opacity: 0.5; cursor: default; }
    .slide { position: absolute; inset: 0; opacity: 0; visibility: hidden; transition: opacity 180ms ease; display: flex; align-items: center; justify-content: center; }
    .slide.visible { opacity: 1; visibility: visible; }
    .slide-content-wrapper { width: ${CANVAS.width}px; height: ${CANVAS.height}px; overflow: hidden; position: relative; }
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
      const root = wrapper?.querySelector('[data-slide-root]');
      const bounds = wrapper?.getBoundingClientRect();
      const blocks = Array.from(wrapper?.querySelectorAll('[data-qa-block]') || [])
        .filter((node) => !node.querySelector('[data-qa-block]'))
        .map((node, index) => {
        const rect = node.getBoundingClientRect();
        return {
          id: node.getAttribute('data-qa-block') || ('block-' + (index + 1)),
          left: rect.left - bounds.left,
          top: rect.top - bounds.top,
          width: rect.width,
          height: rect.height,
          area: rect.width * rect.height,
        };
      });
      return {
        slideId: root?.dataset.slideId || slidesData[currentSlide]?.slideId || '',
        title: root?.dataset.title || slidesData[currentSlide]?.title || '',
        layoutFamily: root?.dataset.layoutFamily || slidesData[currentSlide]?.layoutFamily || '',
        speakerSeconds: Number(root?.dataset.speakerSeconds || 0),
        primaryPoints: wrapper?.querySelectorAll('[data-primary-point="true"]').length || 0,
        wrapper: {
          clientWidth: wrapper?.clientWidth || ${CANVAS.width},
          clientHeight: wrapper?.clientHeight || ${CANVAS.height},
          scrollWidth: wrapper?.scrollWidth || ${CANVAS.width},
          scrollHeight: wrapper?.scrollHeight || ${CANVAS.height},
        },
        bodyScroll: false,
        blocks,
      };
    }
    prevBtn.addEventListener('click', () => { if (currentSlide > 0) { currentSlide -= 1; updateView(); } });
    nextBtn.addEventListener('click', () => { if (currentSlide < slidesData.length - 1) { currentSlide += 1; updateView(); } });
    window.redcubeDeckReview = {
      totalSlides: slidesData.length,
      showSlide(index) {
        currentSlide = index;
        updateView();
        return inspectCurrentSlide();
      },
      inspectCurrentSlide,
    };
    setupSlides();
    updateView();
  </script>
</body>
</html>`;
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
  const probe = spawnSync('python3', ['--version'], { encoding: 'utf-8' });
  if (probe.status !== 0) {
    throw new Error(`python3 不可用: ${(probe.stderr || probe.stdout || '').trim()}`);
  }
  const result = spawnSync('python3', [script, ...args], { encoding: 'utf-8', maxBuffer: 16 * 1024 * 1024 });
  if (result.status !== 0) {
    throw new Error((result.stderr || result.stdout || `ppt_deck python helper failed: ${script}`).trim());
  }
  return JSON.parse(result.stdout);
}

function buildRenderArtifact({ workspaceRoot, topicId, deliverableId, contract }) {
  const deliverablePaths = getDeliverablePaths(workspaceRoot, topicId, deliverableId);
  const blueprintArtifact = readStageArtifact(contract, deliverablePaths, 'slide_blueprint');
  const visualArtifact = readStageArtifact(contract, deliverablePaths, 'visual_direction');
  const slides = blueprintArtifact.slide_blueprint.slides;
  const slidesMarkup = slides.map((slide) => ({
    slide_id: slide.slide_id,
    title: slide.title,
    layout_family: slide.visual_presentation.layout_family,
    content: renderSlideMarkup(slide, visualArtifact.visual_direction, slides.length),
    speaker_seconds: slide.speaker_seconds,
  }));
  const htmlFile = path.join(deliverablePaths.viewsDir, `${deliverableId}.html`);
  const slidesFile = path.join(deliverablePaths.viewsDir, `${deliverableId}.slides.json`);
  writeText(htmlFile, buildDeckHtml({ title: contract.title, slidesMarkup }));
  writeJson(slidesFile, {
    title: contract.title,
    slides: slidesMarkup.map((slide) => ({
      slideId: slide.slide_id,
      title: slide.title,
      content: slide.content,
    })),
  });
  return {
    ...attachCommon('render_html', contract),
    html_bundle: {
      html_file: htmlFile,
      slides_file: slidesFile,
      page_count: slidesMarkup.length,
      shell_contract: {
        ratio: CANVAS.ratio,
        width: CANVAS.width,
        height: CANVAS.height,
        controls: ['slide-display-area', 'prev-btn', 'next-btn'],
      },
      slides: slidesMarkup.map((slide) => ({ slide_id: slide.slide_id, title: slide.title, layout_family: slide.layout_family })),
    },
    artifact_refs: [htmlFile, slidesFile],
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
  const passed = currentFailures <= baselineFailures && currentDensity <= baselineDensity + 18;
  return {
    baseline_deliverable_id: baselineDeliverableId,
    baseline_failures: baselineFailures,
    current_failures: currentFailures,
    baseline_average_text: Number(baselineDensity.toFixed(2)),
    current_average_text: Number(currentDensity.toFixed(2)),
    summary: passed ? '新版未比 baseline 更挤或更粗糙。' : '新版相对 baseline 出现挤压或回归风险。',
    passed,
  };
}

function buildReviewMarkdown(contract, reviewArtifact) {
  const lines = [
    `# ${contract.title} 视觉质控`,
    '',
    `- 状态：${reviewArtifact.status}`,
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

function buildScreenshotReviewArtifact({ workspaceRoot, topicId, deliverableId, contract, mode, baselineDeliverableId }) {
  const deliverablePaths = getDeliverablePaths(workspaceRoot, topicId, deliverableId);
  const renderArtifact = readStageArtifact(contract, deliverablePaths, 'render_html');
  const blueprintArtifact = readStageArtifact(contract, deliverablePaths, 'slide_blueprint');
  const storylineArtifact = readStageArtifact(contract, deliverablePaths, 'storyline');
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
  const artifact = {
    ...attachCommon('screenshot_review', contract),
    mode,
    status: python.status,
    checks: {
      ...python.checks,
      ...deriveProfileChecks(contract, blueprintArtifact, storylineArtifact),
    },
    slide_reviews: python.slide_reviews,
    report_markdown: python.review_markdown || reviewMarkdown,
    metrics: python.metrics,
    artifact_refs: [python.review_markdown || reviewMarkdown, ...python.slide_reviews.map((slide) => slide.screenshot_file)],
  };
  if (mode === 'optimize_existing' && python.baseline) {
    artifact.baseline_review = {
      baseline_deliverable_id: baselineDeliverableId,
      ...python.baseline,
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
  const pptxPath = python.pptx_file || python.pptx_path;
  const pdfPath = python.pdf_file || python.pdf_path;
  return {
    ...attachCommon('export_pptx', contract),
    status: 'completed',
    export_bundle: {
      source_html: renderArtifact.html_bundle.html_file,
      pptx_file: pptxPath,
      pdf_file: pdfPath,
      presenter_notes_file: notesFile,
      page_count: python.page_count,
      page_count_match: python.page_count === renderArtifact.html_bundle.page_count,
      real_conversion_invocation: {
        tool: 'python3',
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

export function runPptDeckRoute({ workspaceRoot, topicId, deliverableId, route, contract, mode = 'draft_new', baselineDeliverableId = '' }) {
  ensurePrerequisites({ workspaceRoot, topicId, deliverableId, route, mode, baselineDeliverableId });
  const deliverablePaths = getDeliverablePaths(workspaceRoot, topicId, deliverableId);
  const stageContract = safeArray(contract.stage_sequence?.stages).find((stage) => stage?.stage_id === route) || null;
  let payload;
  switch (route) {
    case 'storyline':
      payload = buildStoryline(contract);
      break;
    case 'detailed_outline':
      payload = buildDetailedOutline(contract);
      break;
    case 'slide_blueprint':
      payload = buildSlideBlueprint(contract);
      break;
    case 'visual_direction':
      payload = buildVisualDirection(contract, readStageArtifact(contract, deliverablePaths, 'slide_blueprint'), mode, baselineDeliverableId);
      break;
    case 'render_html':
      payload = buildRenderArtifact({ workspaceRoot, topicId, deliverableId, contract });
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
  return {
    overlay: contract.overlay,
    route,
    topic_id: topicId,
    deliverable_id: deliverableId,
    contract,
    stage_contract: stageContract,
    ...payload,
  };
}
