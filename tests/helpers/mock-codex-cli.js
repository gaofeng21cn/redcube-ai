import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  REDCUBE_CREATIVE_GENERATION_META_BEGIN,
  REDCUBE_STAGE_JSON_BEGIN,
  REDCUBE_STAGE_JSON_END,
  REDCUBE_CREATIVE_GENERATION_META_END,
} from '../../packages/redcube-codex-cli-client/src/index.js';

const MODULE_DIR = path.dirname(fileURLToPath(import.meta.url));

function parseCreativeGenerationMeta(input) {
  const text = String(input || '');
  const start = text.indexOf(REDCUBE_CREATIVE_GENERATION_META_BEGIN);
  const end = text.indexOf(REDCUBE_CREATIVE_GENERATION_META_END);
  if (start === -1 || end === -1 || end <= start) {
    return null;
  }
  const jsonText = text
    .slice(start + REDCUBE_CREATIVE_GENERATION_META_BEGIN.length, end)
    .trim();
  return JSON.parse(jsonText);
}

function safeText(value) {
  return String(value || '').trim();
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function readySources(meta) {
  const sources = safeArray(meta?.context?.ready_sources).map((item) => safeText(item)).filter(Boolean);
  const padded = sources.length > 0 ? [...sources] : [];
  for (const fallback of ['公开指南', '系统综述', '教学案例']) {
    if (padded.length >= 3) break;
    padded.push(fallback);
  }
  return padded;
}

function buildMockStoryline(meta) {
  const title = safeText(meta?.context?.title) || '未命名课件';
  const audience = safeText(meta?.context?.audience) || '专业听众';
  const speaker = safeText(meta?.context?.speaker) || '正式讲者';
  return {
    speaker,
    audience,
    style: `先讲 ${title} 的问题定义，再讲自动化链路与证据边界，最后讲可复用动作`,
    core_metaphor: `把 ${title} 讲成一条从研究问题到稳定交付的闭环`,
    hook: [`为什么 ${title} 现在值得讲清：自动化能力开始真正影响科研效率与质量`],
    journey: [
      '先界定这套系统想解决的科研断点是什么',
      '再拆自动化主链如何把任务逐步推进到可交付结果',
      '最后收束到哪些模块可复用、哪些边界必须人工把关',
    ],
    resolution: ['听众带走一条可复述的系统主线，而不是一堆内部流程术语'],
  };
}

function buildMockOutline(meta) {
  const title = safeText(meta?.context?.title) || '未命名课件';
  const sources = readySources(meta);
  return {
    chapter_structure: [
      { chapter_id: 'C1', title: '问题与目标', slide_range: '01-03' },
      { chapter_id: 'C2', title: '自动化主链', slide_range: '04-06' },
      { chapter_id: 'C3', title: '模块复用与边界', slide_range: '07-08' },
    ],
    slides: [
      {
        slide_id: 'S01',
        slide_no: 1,
        chapter_id: 'C1',
        page_type: 'cover_signal',
        layout_family: 'cover_signal',
        title,
        page_goal: '建立讲课契约',
        page_objective: '让听众知道今天讲的是自动科研主线，而不是内部操作说明',
        core_sentence: `${title} 的重点是讲清一条可复述的系统主线`,
        evidence_points: ['先定义问题，再拆链路，再讲模块复用', '课堂上只保留听众需要理解的内容'],
        public_sources: [sources[0]],
        page_core_content: [
          '今天先讲这套系统为什么能推动自动科研',
          '再讲主链步骤、复用模块与人工边界',
        ],
        visual_anchor_tracks: ['left-identity-rail', 'center-title-stage', 'right-promise-card'],
        speaker_notes: '开场先立契约：今天讲系统能力与研究逻辑，不讲内部制作要求。',
        transition_sentence: '先把目标对齐后，再解释为什么需要自动科研主链。',
        render_recipe_id: 'ppt.hero_signal',
      },
      {
        slide_id: 'S02',
        slide_no: 2,
        chapter_id: 'C1',
        page_type: 'stakes_window',
        layout_family: 'multi_zone_compare',
        title: '为什么自动科研现在值得系统化',
        page_goal: '建立问题紧迫性',
        page_objective: '让听众看到传统科研链条的摩擦成本',
        core_sentence: '真正的瓶颈不是模型能不能写，而是科研任务链能不能被稳定拆解和执行。',
        evidence_points: [sources[0], '任务定义、证据准备与交付审核往往断在不同环节'],
        public_sources: [sources[0], sources[1]],
        page_core_content: [
          '左侧讲传统科研链的断点：任务切换多、信息口径散、审核回路长',
          '右侧讲自动化收益：结构化推进、状态可追踪、交付物可复盘',
        ],
        visual_anchor_tracks: ['left-risk-zone', 'right-value-zone', 'bottom-bridge'],
        speaker_notes: '把问题压力建起来：要系统化，不是要单点炫技。',
        transition_sentence: '知道为什么要系统化之后，先拆最常见的认知误区。',
        render_recipe_id: 'ppt.compare_zones',
      },
      {
        slide_id: 'S03',
        slide_no: 3,
        chapter_id: 'C1',
        page_type: 'myth_fact_split',
        layout_family: 'multi_zone_compare',
        title: '先拆三个最容易混淆的认知',
        page_goal: '清误区',
        page_objective: '把自动生成、自动执行、自动签收三件事分开',
        core_sentence: '不把能力边界讲清，后面的自动化主线就会被误解。',
        evidence_points: ['把生成能力与责任归属分开', '把流程自动化与结果认可分开'],
        public_sources: [sources[1]],
        page_core_content: [
          '混淆一：把单步生成误当成整条科研链自动化',
          '混淆二：把好看的结果误当成可信的证据',
          '混淆三：把自动执行误当成可以跳过人工把关',
        ],
        visual_anchor_tracks: ['left-myth-column', 'right-correction-column', 'bottom-coach-note'],
        speaker_notes: '这一页先纠偏，让后面的系统主线能被正确理解。',
        transition_sentence: '纠偏后，直接进入全自动科研的主链步骤。',
        render_recipe_id: 'ppt.compare_zones',
      },
      {
        slide_id: 'S04',
        slide_no: 4,
        chapter_id: 'C2',
        page_type: 'mechanism_track',
        layout_family: 'timeline_band',
        title: '全自动科研主链是如何一步步推进的',
        page_goal: '建立主链结构',
        page_objective: '把自动科研拆成显式阶段',
        core_sentence: '只有把问题定义、事实准备、执行链和审阅链打通，自动科研才成立。',
        evidence_points: ['问题界定', '事实准备', '执行编排', '审阅与发布'],
        public_sources: [sources[0], sources[1]],
        page_core_content: [
          '先把 topic / deliverable / run 等 durable surface 定清',
          '再做 source readiness，把后续创作要消费的事实层补齐',
          '然后走 family -> profile -> pack -> execution 的正式主链',
          '最后由 review / export 口径收口成可交付物',
        ],
        visual_anchor_tracks: ['top-title', 'center-horizontal-track', 'bottom-source-rail'],
        speaker_notes: '这是全场的机制峰值页，要把主链讲成一条可复述轨道。',
        transition_sentence: '主链有了之后，再看哪里需要人工判断边界。',
        render_recipe_id: 'ppt.timeline_rail',
      },
      {
        slide_id: 'S05',
        slide_no: 5,
        chapter_id: 'C2',
        page_type: 'decision_gate',
        layout_family: 'judgement_ladder',
        title: '哪些节点可以自动，哪些节点必须人工签收',
        page_goal: '建立判断边界',
        page_objective: '让听众看到自动化与人工把关的分工',
        core_sentence: '系统越自动，越要把停顿点与签收点写得清楚。',
        evidence_points: ['事实层必须可追溯', '审阅层必须可回到具体 artifact'],
        public_sources: [sources[1], sources[2]],
        page_core_content: [
          '能自动的：结构化推进、阶段物化、状态追踪、重复性整理',
          '必须人工签收的：研究判断、风险确认、对外结论、最终发布',
        ],
        visual_anchor_tracks: ['left-questions', 'right-actions', 'bottom-transition'],
        speaker_notes: '把系统边界讲清，避免听众把自动化想成无人监管。',
        transition_sentence: '边界清楚之后，再看为什么复用模块能支撑全链路。',
        render_recipe_id: 'ppt.judgement_ladder',
      },
      {
        slide_id: 'S06',
        slide_no: 6,
        chapter_id: 'C2',
        page_type: 'public_evidence',
        layout_family: 'multi_zone_compare',
        title: '为什么复用模块能支撑全自动科研',
        page_goal: '建立模块视角',
        page_objective: '解释模块复用与正式主链的关系',
        core_sentence: '全自动不是每次重造流程，而是用稳定模块反复装配任务链。',
        evidence_points: ['gateway 负责路由', 'family/profile/pack 负责语义与执行契约', 'review/export 负责交付收口'],
        public_sources: [sources[0], sources[1], sources[2]],
        page_core_content: [
          '复用的不是某一个 prompt，而是正式控制链和 stage contract',
          '同一套 shared source truth 能被不同 deliverable family 继续消费',
          '模块职责清楚，质量问题才知道该在哪一层修',
        ],
        visual_anchor_tracks: ['top-claim-band', 'center-three-zone-evidence', 'bottom-source-rail'],
        speaker_notes: '这一页把“为什么不是一次性脚本拼装”讲透。',
        transition_sentence: '理解模块复用后，再把系统价值压成可执行动作。',
        render_recipe_id: 'ppt.compare_zones',
      },
      {
        slide_id: 'S07',
        slide_no: 7,
        chapter_id: 'C3',
        page_type: 'ring_cross',
        layout_family: 'ring_cross',
        title: '小同行带走的四个动作',
        page_goal: '形成可复用框架',
        page_objective: '把系统理解压缩成下一次能复用的动作',
        core_sentence: '真正带得走的，不是名词，而是下一次做自动科研时的动作顺序。',
        evidence_points: ['先定义任务', '再补事实层', '再跑正式主链', '最后审阅与发布'],
        public_sources: [sources[2]],
        page_core_content: ['先定义任务', '再补事实层', '再跑正式主链', '最后审阅与发布'],
        visual_anchor_tracks: ['center-hub', 'north-zone', 'east-zone', 'south-zone', 'west-zone'],
        speaker_notes: '收尾时压成四个动作，让听众知道下一次该怎么用。',
        transition_sentence: '最后一页只收束今天的三条带走点。',
        render_recipe_id: 'ppt.ring_cross',
      },
      {
        slide_id: 'S08',
        slide_no: 8,
        chapter_id: 'C3',
        page_type: 'closure_peak',
        layout_family: 'summary_peak',
        title: '最后收束三条真正该带走的结论',
        page_goal: '回收主线',
        page_objective: '留下记忆点与行动句',
        core_sentence: '一场好课的结尾，是把整条系统主线压成可回忆的判断句。',
        evidence_points: ['自动科研依赖正式主链', 'source readiness 决定内容质量底座', '模块复用让扩展成为可能'],
        public_sources: [sources[0], sources[1]],
        page_core_content: [
          '第一，自动科研成立的前提是把正式控制链写清楚',
          '第二，source readiness 决定后面内容阶段会不会胡说',
          '第三，模块复用决定系统能不能稳定扩展到更多交付物',
        ],
        visual_anchor_tracks: ['summary-left', 'summary-center', 'summary-right'],
        speaker_notes: '结尾只收三条主线，不回放内部工作流台词。',
        transition_sentence: '完。',
        render_recipe_id: 'ppt.summary_peak',
      },
    ],
  };
}

function buildMockBlueprint(meta) {
  const slides = safeArray(meta?.context?.outline?.slides);
  return {
    chapter_goal: '逐页落实讲授逻辑、证据口径与讲者动作',
    slides: slides.map((slide) => ({
      slide_id: slide.slide_id,
      slide_no: slide.slide_no,
      chapter_id: slide.chapter_id || `C${Math.min(Math.floor((Number(slide.slide_no) - 1) / 3) + 1, 3)}`,
      page_type: slide.page_type || 'public_evidence',
      layout_family: slide.layout_family || 'multi_zone_compare',
      title: slide.title,
      page_goal: slide.page_goal,
      page_objective: slide.page_objective,
      core_sentence: slide.core_sentence,
      evidence_points: safeArray(slide.evidence_points).length > 0 ? slide.evidence_points : ['公开来源', '阶段逻辑'],
      public_sources: safeArray(slide.public_sources).length > 0 ? slide.public_sources : readySources(meta).slice(0, 2),
      page_core_content: safeArray(slide.page_core_content).length > 0 ? slide.page_core_content : [slide.core_sentence],
      visual_anchor_tracks: safeArray(slide.visual_anchor_tracks).length > 0 ? slide.visual_anchor_tracks : ['top-title', 'bottom-summary'],
      speaker_notes: safeText(slide.speaker_notes) || `${slide.title} 这一页要讲清核心判断句与证据口径。`,
      transition_sentence: safeText(slide.transition_sentence) || '下一页继续往下推进。',
      render_recipe_id: slide.render_recipe_id || 'ppt.compare_zones',
    })),
  };
}

function buildMockVisualDirection(meta) {
  const slides = safeArray(meta?.context?.blueprint?.slides);
  const peakPages = slides.filter((_, index) => index === 0 || index === 3 || index === slides.length - 1).map((slide) => slide.slide_id);
  return {
    visual_manifest: '浅底高对比、结构显式、关键页拉节奏的正式讲台感',
    what_it_is: ['结构先行', '证据与动作并重', '适合讲课复述'],
    what_it_is_not: ['统一安全模板页', '内部文档截图', '脚本式卡片堆砌'],
    palette: {
      canvas: '#F7F8FC',
      ink: '#0F172A',
      accent: '#2563EB',
      accentSoft: '#DBEAFE',
      success: '#0F766E',
    },
    continuity_constraints: [
      '关键页必须与相邻页形成明显差异',
      '复杂结构页必须显式输出锚点与轨道',
      '来源与页码按页控制',
    ],
    rhythm_curve: slides.map((slide, index) => ({
      slide_id: slide.slide_id,
      role: index === 0 ? 'opening_peak' : (peakPages.includes(slide.slide_id) ? 'content_peak' : 'bridge'),
    })),
    peak_pages: peakPages,
    page_family_ceiling: {
      cover_signal: 1,
      multi_zone_compare: 3,
      timeline_band: 1,
      judgement_ladder: 1,
      ring_cross: 1,
      summary_peak: 1,
    },
    forbidden_regressions: ['退化成统一安全模板页', '更单调', '更挤', '更像脚本拼卡片'],
    final_instruction_to_html_generator: [
      '每页在 slidesData 中保留独立内容',
      '复杂结构页必须显式输出锚点与轨道',
      '关键页必须保留视觉峰值，不允许连续同构',
    ],
  };
}

function buildPptSlideMarkup(slide, totalSlides, peakPage = false) {
  const pageGoal = safeText(slide.page_goal).replace(/\s+/g, ' ').slice(0, 22);
  const title = safeText(slide.title).replace(/\s+/g, ' ').slice(0, 26);
  const coreSentence = safeText(slide.core_sentence).replace(/\s+/g, ' ').slice(0, 54);
  const sourceLabel = safeText(safeArray(slide.public_sources || []).at(0), '公开来源');
  const cards = safeArray(slide.page_core_content)
    .slice(0, 2)
    .map((item, index) => `
      <article data-qa-block="card-${index + 1}" data-primary-point="${index === 0 ? 'true' : 'false'}" style="padding:14px 16px;border-radius:18px;background:${index === 0 ? 'rgba(37,99,235,0.12)' : '#FFFFFF'};border:1px solid #CBD5E1;font-size:${index === 0 ? '22px' : '18px'};line-height:1.45;color:#0F172A;">${safeText(item).replace(/\s+/g, ' ').slice(0, 40)}</article>
    `)
    .join('');
  return `
    <div data-slide-root="true" data-slide-id="${safeText(slide.slide_id)}" data-title="${safeText(slide.title)}" data-speaker-seconds="${Number(slide.speaker_seconds || 65)}" data-layout-family="${safeText(slide.layout_family)}" data-recipe-id="${safeText(slide.render_recipe_id)}" data-template-id="upstream_ai_html" data-peak-page="${peakPage}" style="position:relative;width:1152px;height:648px;background:#F7F8FC;overflow:hidden;padding:44px 52px 56px;display:grid;grid-template-rows:auto 1fr auto;gap:18px;">
      <header data-qa-block="header" style="display:grid;gap:10px;">
        <div style="font-size:14px;letter-spacing:0.08em;text-transform:uppercase;font-weight:800;color:#2563EB;">${pageGoal}</div>
        <h2 style="margin:0;font-size:40px;line-height:1.15;color:#0F172A;">${title}</h2>
        <p style="margin:0;font-size:22px;line-height:1.5;color:#334155;max-width:860px;">${coreSentence}</p>
      </header>
      <section style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;align-content:start;">
        ${cards}
      </section>
      <footer data-qa-block="footer" style="display:flex;justify-content:space-between;align-items:center;font-size:14px;color:#475569;">
        <div>${sourceLabel}</div>
        <div style="font-weight:700;">${String(slide.slide_no).padStart(2, '0')} / ${String(totalSlides).padStart(2, '0')}</div>
      </footer>
    </div>
  `.trim();
}

function buildMockPptRender(meta) {
  const slides = safeArray(meta?.context?.blueprint?.slides);
  const peakPages = new Set(safeArray(meta?.context?.visual_direction?.peak_pages));
  const variant = safeText(process.env.REDCUBE_MOCK_PPT_RENDER_VARIANT);
  const renderScope = safeText(meta?.context?.render_scope, 'full_deck');
  if (variant === 'require_render_batching' && renderScope !== 'summary' && slides.length > 3) {
    throw new Error('mock ppt render expected slide_batch scope with at most 3 slides');
  }
  if (renderScope === 'summary') {
    return {
      slides: [],
      render_summary: [
        '本轮批量 render_html 已完成，整套 deck 的页面结构与节奏可以继续进入后续审稿。',
      ],
    };
  }
  return {
    slides: slides.map((slide) => ({
      slide_id: slide.slide_id,
      content_html: (() => {
        if (variant === 'require_revision_context') {
          const revisionContext = meta?.context?.revision_context || {};
          const hasDirectorFeedback = safeArray(revisionContext?.visual_director_review?.weak_pages).length > 0
            || safeText(revisionContext?.visual_director_review?.review_summary).length > 0;
          const hasScreenshotFeedback = safeArray(revisionContext?.screenshot_review?.blocked_slide_ids).length > 0
            || safeArray(revisionContext?.screenshot_review?.slide_feedback).length > 0;
          if (!hasDirectorFeedback || !hasScreenshotFeedback) {
            throw new Error(`mock ppt render expected revision_context with director and screenshot review feedback: ${JSON.stringify(revisionContext)}`);
          }
        }
        const markup = buildPptSlideMarkup(slide, slides.length, peakPages.has(slide.slide_id));
        if (variant === 'missing_root_meta') {
          return markup
            .replace(/\sdata-title="[^"]*"/g, '')
            .replace(/\sdata-speaker-seconds="[^"]*"/g, '')
            .replace(/\sdata-layout-family="[^"]*"/g, '')
            .replace(/\sdata-recipe-id="[^"]*"/g, '')
            .replace(/\sdata-template-id="[^"]*"/g, '')
            .replace(/\sdata-peak-page="[^"]*"/g, '');
        }
        if (variant === 'missing_review_anchors') {
          return markup
            .replace(/\sdata-qa-block="[^"]*"/g, '')
            .replace(/\sdata-primary-point="[^"]*"/g, '');
        }
        return markup;
      })(),
    })),
    render_summary: [
      '每页均由上游 AI 直接写出完整 slide HTML。',
      '复杂页保留显式结构，未退化为模板编译产物。',
    ],
  };
}

function buildMockPptDirectorReview(meta) {
  const slides = safeArray(meta?.context?.render_summary);
  return {
    director_intent_landed: true,
    anti_template_ok: true,
    peak_pages_landed: true,
    memory_hook_present: true,
    homogeneous_layout_risk: slides.length > 0 ? 0.18 : 0.22,
    weak_pages: [],
    review_summary: '页面峰值、结构差异和课堂讲授节奏都已经落到成品页上。',
    rewrite_action: 'none',
  };
}

function buildMockPptScreenshotReview(meta) {
  const slides = safeArray(meta?.context?.screenshot_mechanics?.slides);
  return {
    director_intent_landed: true,
    anti_template_ok: true,
    weak_pages: [],
    review_summary: '截图复核确认封面署名、结构主线与课堂节奏都已经落到最终画面里。',
    slide_reviews: slides.map((slide) => ({
      slide_id: safeText(slide?.slide_id),
      judgement: 'pass',
      visual_findings: ['结构清楚，首眼路径稳定，信息密度可讲可看。'],
      recommended_fix: 'none',
    })),
  };
}

function buildMockXhsStoryline(meta) {
  const context = meta?.context || {};
  return {
    mode: safeText(context.mode, 'single'),
    audience_judgement: safeText(context.audience_seed, '临床读者：更关心顺序与动作'),
    tension: safeText(context.tension_seed, '很多人一开始就抓错重点'),
    why_now: safeText(context.why_now_seed, '信息变多，越需要先把顺序讲清'),
    memory_hook: safeText(context.memory_hook_seed, '先别急着上工具，先把顺序做对'),
    hook: '先打破旧认知，再给动作收益',
    narrative_progression: [
      '先用反直觉句把读者拉停',
      '再拆最常见误区和代价',
      '然后给一条能照着走的判断顺序',
      '最后压成收藏理由与下一步动作',
    ],
    journey: [
      '先拆问题误区',
      '再给关键解释与证据',
      '最后压成可执行动作',
    ],
    resolution: '让读者愿意收藏并继续往下看',
  };
}

function buildMockXhsPlan(meta) {
  const title = safeText(meta?.context?.title) || '未命名笔记';
  const memoryHook = safeText(meta?.context?.storyline?.memory_hook, '先别急着上工具，先把顺序做对');
  const whyNow = safeText(meta?.context?.storyline?.why_now, '信息越多，越要先做判断顺序');
  return {
    title_options: [
      `${title}为什么很多人总抓不住重点`,
      `${title}先别急着记一堆概念`,
      `${title}这4步更重要`,
    ],
    slides: [
      {
        slide_id: 'N01',
        title: '先把问题说人话',
        layout_family: 'cover_note',
        render_recipe_id: 'xhs.hero_note',
        page_goal: '建立封面钩子',
        progression_role: 'hook',
        page_core_content: ['很多人其实不是不知道，而是一开始就抓错重点', `记忆钩子：${memoryHook}`, `这篇要帮你讲清：${title} 的正确顺序`],
        visual_presentation: {
          layout_family: 'cover_note',
          main_visual_action: '大标题钩子 + 记忆条',
          action_primitive: 'hero note + highlight ribbon',
          anchor_tracks: ['cover-hook', 'memory-ribbon', 'benefit-chip'],
          anti_template_note: '封面必须一页抓人，不能退回普通三卡封面',
        },
        source_language: '封面直接讲人话，不甩术语',
        speaker_notes: '先把读者拉停，再承诺收益。',
        transition: '先被一句话拉停，再进入为什么很多人会抓错重点',
      },
      {
        slide_id: 'N02',
        title: '为什么很多人一开始就抓错重点',
        layout_family: 'myth_compare',
        render_recipe_id: 'xhs.split_contrast',
        page_goal: '先拆误区',
        progression_role: 'tension',
        page_core_content: ['很多人先记术语、先背碎片、先抄别人结论', '真正该先看的，是判断顺序有没有讲清', whyNow],
        visual_presentation: {
          layout_family: 'myth_compare',
          main_visual_action: '错误做法 vs 正确顺序双区对撞',
          action_primitive: 'asymmetric compare columns',
          anchor_tracks: ['myth-column', 'divider', 'correction-column'],
          anti_template_note: '误区页不能退化成同构卡片列表',
        },
        source_language: '用读者能懂的错误成本来讲代价',
        speaker_notes: '先拆错误顺序，再给真正路径。',
        transition: '拆完误区，下一页进入真正该先看的顺序',
      },
      {
        slide_id: 'N03',
        title: '真正该先看的不是更多信息，而是判断顺序',
        layout_family: 'sequence_stack',
        render_recipe_id: 'xhs.staggered_steps',
        page_goal: '建立判断顺序',
        progression_role: 'explain',
        page_core_content: ['先把问题翻译成人话', '再看公开来源能不能支撑判断', '最后才谈动作怎么落'],
        visual_presentation: {
          layout_family: 'sequence_stack',
          main_visual_action: '阶梯式顺序卡',
          action_primitive: 'staggered step stack',
          anchor_tracks: ['step-one', 'step-two', 'step-three'],
          anti_template_note: '顺序页必须有明显推进感',
        },
        source_language: '顺序要写成读者能照着做的动作',
        speaker_notes: '这页只讲先后顺序，不讲工具参数。',
        transition: '顺序清楚后，下一页把关键判断画成轨道',
      },
      {
        slide_id: 'N04',
        title: '把关键判断画成一眼能懂的轨道',
        layout_family: 'process_track',
        render_recipe_id: 'xhs.track_rail',
        page_goal: '解释机制',
        progression_role: 'mechanism_peak',
        page_core_content: ['第1步：先判断是不是最值得先讲的重点', '第2步：再判断公开来源能不能支撑', '第3步：最后把动作压成一条顺序'],
        visual_presentation: {
          layout_family: 'process_track',
          main_visual_action: '轨道化机制说明',
          action_primitive: 'process track with nodes',
          anchor_tracks: ['track-start', 'track-middle', 'track-end'],
          anti_template_note: '机制页必须显式轨道',
        },
        source_language: '机制页要让读者一眼看懂先后关系',
        speaker_notes: '轨道比卡片更重要。',
        transition: '机制清楚后，再解释为什么来源口径影响可信度',
      },
      {
        slide_id: 'N05',
        title: `${title} 的公开来源要让读者听得懂`,
        layout_family: 'evidence_strip',
        render_recipe_id: 'xhs.evidence_bands',
        page_goal: '建立可信度',
        progression_role: 'evidence_peak',
        page_core_content: ['把来源写成人能看懂的口径', '证据页不是摆引用，而是解释为什么可信', '来源和结论必须同屏出现'],
        visual_presentation: {
          layout_family: 'evidence_strip',
          main_visual_action: '证据条 + 来源标签 + 结论高亮',
          action_primitive: 'source strip with highlight bands',
          anchor_tracks: ['evidence-strip', 'source-chip-rail', 'claim-highlight'],
          anti_template_note: '证据页必须同时给来源和结论',
        },
        source_language: '把指南/综述翻译成读者能理解的公开口径',
        speaker_notes: '证据页要让人愿意信，不是让人害怕。',
        transition: '最后把整篇压成能直接照抄的动作清单',
      },
      {
        slide_id: 'N06',
        title: '最后给一个能直接照抄的动作清单',
        layout_family: 'action_checklist',
        render_recipe_id: 'xhs.checklist_close',
        page_goal: '给出行动',
        progression_role: 'memory_close',
        page_core_content: [memoryHook, '离开这一页后，按“先问题、再来源、后动作”的顺序执行', `如果只带走一件事，就是：${memoryHook}`],
        visual_presentation: {
          layout_family: 'action_checklist',
          main_visual_action: '动作清单压缩收尾',
          action_primitive: 'checklist blocks',
          anchor_tracks: ['check-one', 'check-two', 'check-three'],
          anti_template_note: '收尾页要像收藏清单',
        },
        source_language: '结尾只留动作句，不再扩概念',
        speaker_notes: '最后不要再加新概念。',
        transition: '完',
      },
    ],
  };
}

function buildMockXhsVisualDirection(meta) {
  const slides = safeArray(meta?.context?.plan?.slides);
  return {
    director_statement: '像认真做过整理的人，把复杂内容画成可收藏的笔记',
    visual_motif: '米白纸面 + 蓝色高亮 + 红色纠偏批注 + 便签式收束',
    material_rules: {
      paper_base: '米白纸 + 轻网格',
      main_accent: '#2563EB',
      warning_accent: '#DC2626',
    },
    rhythm_curve: slides.map((slide, index) => ({
      slide_id: slide.slide_id,
      role: ['hook_peak', 'tension', 'clarify', 'mechanism_peak', 'evidence_peak', 'memory_close'][index] || 'bridge',
    })),
    peak_pages: ['N01', 'N04', 'N05'],
    page_family_ceiling: {
      cover_note: 1,
      myth_compare: 1,
      sequence_stack: 1,
      process_track: 1,
      evidence_strip: 1,
      action_checklist: 1,
    },
    anti_template_constraints: [
      '禁止连续两页退化成同构白底卡片堆叠',
      '封面、机制页、证据页必须首眼差异明显',
      '不能把所有页面压成同一标题+三卡骨架',
    ],
    source_language_discipline: '来源必须翻译成读者能理解的公开口径，不允许内部资料/来源索引/内部文件名',
    forbidden_regressions: [
      '白底卡片网格页',
      '统一安全科技卡片页',
      '历史成品拼装',
      '有高亮无结构、像装饰页',
    ],
  };
}

function buildXhsSlideMarkup(slide, totalSlides, peakPage = false) {
  const accent = peakPage ? '#DC2626' : '#2563EB';
  const cards = safeArray(slide.page_core_content)
    .slice(0, 3)
    .map((item, index) => `
      <article data-qa-block="card-${index + 1}" data-primary-point="${index === 0 ? 'true' : 'false'}" style="padding:12px 14px;border-radius:18px;background:${index === 0 ? '#FFFFFF' : 'rgba(255,255,255,0.8)'};border:1px solid rgba(15,23,42,0.1);font-size:${index === 0 ? '24px' : '18px'};line-height:1.5;color:#0F172A;">${safeText(item)}</article>
    `)
    .join('');
  return `
    <div data-slide-root="true" data-slide-id="${safeText(slide.slide_id)}" data-title="${safeText(slide.title)}" data-speaker-seconds="36" data-layout-family="${safeText(slide.layout_family)}" data-recipe-id="${safeText(slide.render_recipe_id)}" data-template-id="upstream_ai_html" data-peak-page="${peakPage}" style="position:relative;width:448px;height:597px;background:#FFFBF0;overflow:hidden;padding:22px 20px 26px;display:grid;grid-template-rows:auto 1fr auto;gap:14px;">
      <header data-qa-block="header" style="display:grid;gap:8px;">
        <div style="font-size:11px;letter-spacing:0.08em;text-transform:uppercase;font-weight:800;color:${accent};">${safeText(slide.page_goal)}</div>
        <h2 style="margin:0;font-size:28px;line-height:1.2;color:#0F172A;">${safeText(slide.title)}</h2>
      </header>
      <section style="display:grid;gap:12px;align-content:start;">
        ${cards}
      </section>
      <footer data-qa-block="footer" style="display:flex;justify-content:space-between;align-items:center;font-size:12px;color:#475569;">
        <div>${safeText(slide.source_language)}</div>
        <div style="font-weight:700;">${slide.slide_no} / ${totalSlides}</div>
      </footer>
    </div>
  `.trim();
}

function buildMockXhsRender(meta) {
  const slides = safeArray(meta?.context?.plan?.slides);
  const peakPages = new Set(safeArray(meta?.context?.visual_direction?.peak_pages));
  return {
    slides: slides.map((slide, index) => ({
      slide_id: slide.slide_id,
      content_html: buildXhsSlideMarkup({ ...slide, slide_no: index + 1 }, slides.length, peakPages.has(slide.slide_id)),
    })),
    render_summary: [
      '每页都由上游 AI 直接写出完整卡片式 HTML。',
      '封面、机制页、证据页保持明显结构差异，没有退化成统一模板。',
    ],
  };
}

function buildMockXhsDirectorReview() {
  return {
    director_intent_landed: true,
    anti_template_ok: true,
    memory_hook_present: true,
    homogeneous_layout_risk: 0.16,
    weak_pages: [],
    review_summary: '记忆钩子、峰值页和反模板约束都已落到 HTML 成品上。',
    rewrite_action: 'none',
  };
}

function buildMockXhsScreenshotReview(meta) {
  const slides = safeArray(meta?.context?.screenshot_mechanics?.slides);
  return {
    director_intent_landed: true,
    anti_template_ok: true,
    weak_pages: [],
    review_summary: '封面抓停、机制推进和结尾动作都已经在最终卡片截图里成立。',
    slide_reviews: slides.map((slide) => ({
      slide_id: safeText(slide?.slide_id),
      judgement: 'pass',
      visual_findings: ['首眼信息明确，手机端阅读节奏顺畅，卡片没有退化成统一模板。'],
      recommended_fix: 'none',
    })),
  };
}

function buildMockXhsPublishCopy(meta) {
  const title = safeText(safeArray(meta?.context?.title_options)[0], safeText(meta?.context?.title) || '这篇内容');
  const memoryHook = safeText(meta?.context?.storyline?.memory_hook, '先别急着上工具，先把顺序做对');
  return {
    body: `${title}。先别急着收藏更多碎片建议，先把这条判断顺序拿走：先把问题讲成人话，再看公开来源能不能支撑，最后才决定动作怎么落。读完这组图，你至少能把最关键的判断句讲清、做对、再分享。记住一句：${memoryHook}`,
    first_comment: '如果你也在做这类内容，评论区回“清单”，我把整理框架发给你。',
    interaction_questions: [
      '你现在最容易在哪一步把顺序做反？',
      '你会先整理来源，还是先把判断顺序写下来？',
    ],
    hashtags: ['#门诊科普', '#判断顺序', '#知识笔记', '#收藏清单'],
    publish_suggestion: {
      recommended_time: '19:00-21:00',
    },
  };
}

function buildMockPosterStoryline(meta) {
  const title = safeText(meta?.context?.title) || '未命名海报';
  return {
    headline: `${title}：先抓住最值钱的判断句`,
    subheadline: '给门诊患者一张能看完、带走、转给家人的单页海报',
    audience_judgement: '先看什么、为什么现在要看、看完后该怎么做',
    why_now: '信息很多，但真正能帮读者马上做对判断的内容太少',
    proof_promise: '每一块内容都要能对应公开来源或明确行动理由',
    call_to_action: '看完这一页后，先按海报给出的顺序执行，再去扩展阅读',
  };
}

function buildMockPosterBlueprint(meta) {
  const storyline = meta?.context?.storyline || buildMockPosterStoryline(meta);
  const sources = readySources(meta);
  return {
    render_recipe_id: 'poster.evidence_columns',
    headline: safeText(storyline.headline, safeText(meta?.context?.title) || '未命名海报'),
    subheadline: safeText(storyline.subheadline, '给门诊患者一张能看完、带走、转给家人的单页海报'),
    anchor_tracks: ['hero-band', 'evidence-columns', 'pathway-strip', 'action-footer'],
    panels: [
      {
        panel_id: 'hero',
        region: 'hero_band',
        label: '先看这句',
        text: safeText(storyline.headline),
        support_points: [
          safeText(storyline.why_now),
          `读者真正要判断的是：${safeText(storyline.audience_judgement)}`,
        ],
      },
      {
        panel_id: 'proof',
        region: 'evidence_columns',
        label: '为什么可信',
        text: safeText(storyline.proof_promise),
        support_points: [
          `公开来源 1：${sources[0]}`,
          `公开来源 2：${sources[1]}`,
        ],
      },
      {
        panel_id: 'pathway',
        region: 'pathway_strip',
        label: '怎么照着做',
        text: '先读 headline，再看证据，再执行动作。',
        support_points: [
          '动作 1：先确认当前问题是不是这张海报要解决的事',
          '动作 2：再看公开来源给出的边界',
          '动作 3：最后执行一个最小动作',
        ],
      },
      {
        panel_id: 'cta',
        region: 'action_footer',
        label: '带走的动作',
        text: safeText(storyline.call_to_action),
        support_points: [
          '把这张图保存下来',
          '需要时按同一顺序复核',
        ],
      },
    ],
  };
}

function buildMockPosterVisualDirection() {
  return {
    visual_manifest: '单页海报采用浅底高对比、明显阅读顺序、证据与动作同屏的门诊说明感',
    poster_motif: '米白纸底 + 深蓝结构线 + 橙色重点提示 + 证据标签芯片',
    peak_region: 'hero_band',
    panel_emphasis: {
      hero_band: '最大层级，先让读者停下来',
      evidence_columns: '中段用双列证据建立可信度',
      pathway_strip: '下段用步骤条带给出顺序',
      action_footer: '底部收束成可以照做的一句话',
    },
    page_family_ceiling: {
      hero_band: 1,
      evidence_columns: 1,
      pathway_strip: 1,
      action_footer: 1,
    },
    anti_template_constraints: [
      'headline 区必须与证据区首眼差异明显',
      '不能退化成四个同构卡片盒子',
      '行动区必须像结论，不是补充说明',
    ],
    forbidden_regressions: [
      '统一安全模板海报',
      '只讲口号不讲证据',
      '只讲证据不讲动作',
      '像历史素材拼贴页',
    ],
    final_instruction_to_html_generator: [
      '保持 4:5 单页画幅，不允许滚动',
      'headline、证据、动作三段必须形成显式层级',
      '来源标签与行动句必须同屏可见',
    ],
    palette: {
      paper: '#FFF9F1',
      ink: '#0F172A',
      accent: '#1D4ED8',
      highlight: '#F97316',
    },
  };
}

function buildMockPosterRender(meta) {
  const slide = safeArray(meta?.context?.blueprint?.slides)[0] || {};
  const panels = safeArray(slide.panels);
  const hero = panels[0] || {};
  const proof = panels[1] || {};
  const pathway = panels[2] || {};
  const cta = panels[3] || {};
  const sources = safeArray(slide.public_sources).length > 0 ? slide.public_sources : readySources(meta).slice(0, 2);
  const slideId = safeText(slide.slide_id, 'P01');
  const title = safeText(slide.title, safeText(hero.text, safeText(meta?.context?.title) || '未命名海报'));
  return {
    slides: [
      {
        slide_id: slideId,
        content_html: `
<section data-slide-root="true" data-slide-id="${slideId}" data-title="${title}" data-layout-family="${safeText(slide.layout_family, 'evidence_columns')}" data-recipe-id="${safeText(slide.render_recipe_id, 'poster.evidence_columns')}" style="width:1080px;height:1350px;background:linear-gradient(180deg,#FFF9F1 0%,#FFFFFF 100%);padding:56px 60px 48px;display:grid;grid-template-rows:auto auto 1fr auto;gap:24px;color:#0F172A;">
  <section data-qa-block="hero-band" style="display:grid;gap:14px;border-bottom:2px solid rgba(29,78,216,0.16);padding-bottom:18px;">
    <div style="font-size:16px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;color:#1D4ED8;">${safeText(hero.label, '先看这句')}</div>
    <h1 data-primary-point="true" style="margin:0;font-size:64px;line-height:1.08;">${safeText(hero.text, title)}</h1>
    <p style="margin:0;font-size:26px;line-height:1.45;color:#334155;">${safeText(hero.support_points[0], '信息很多，但真正能帮读者马上做对判断的内容太少')}</p>
  </section>
  <section data-qa-block="evidence-columns" style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px;">
    <article style="padding:18px 20px;border-radius:24px;background:#FFFFFF;border:1px solid rgba(15,23,42,0.12);display:grid;gap:10px;">
      <div style="font-size:18px;font-weight:800;color:#0F172A;">${safeText(proof.label, '为什么可信')}</div>
      <div style="font-size:28px;font-weight:800;line-height:1.3;">${safeText(proof.text, '每一块内容都要能对应公开来源或明确行动理由')}</div>
      <div style="font-size:18px;line-height:1.5;color:#475569;">${safeText(proof.support_points[0], `公开来源 1：${sources[0]}`)}</div>
      <div style="font-size:18px;line-height:1.5;color:#475569;">${safeText(proof.support_points[1], `公开来源 2：${sources[1]}`)}</div>
    </article>
    <article style="padding:18px 20px;border-radius:24px;background:#EFF6FF;border:1px solid rgba(29,78,216,0.18);display:grid;gap:10px;">
      <div style="font-size:18px;font-weight:800;color:#1D4ED8;">来源标签</div>
      <div style="font-size:22px;font-weight:800;line-height:1.35;color:#0F172A;">${sources.join(' / ')}</div>
      <div style="font-size:17px;line-height:1.5;color:#334155;">证据和动作必须同屏，不把可信度藏成脚注。</div>
    </article>
  </section>
  <section data-qa-block="pathway-strip" style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;">
    ${safeArray(pathway.support_points).slice(0, 3).map((item, index) => `
      <article ${index === 0 ? 'data-primary-point="true"' : ''} style="padding:18px 16px;border-radius:22px;background:${index === 0 ? '#FFF7ED' : '#FFFFFF'};border:1px solid ${index === 0 ? 'rgba(249,115,22,0.22)' : 'rgba(15,23,42,0.12)'};display:grid;gap:10px;">
        <div style="font-size:16px;font-weight:800;color:${index === 0 ? '#C2410C' : '#1D4ED8'};">动作 ${index + 1}</div>
        <div style="font-size:22px;font-weight:800;line-height:1.35;color:#0F172A;">${safeText(item)}</div>
      </article>
    `).join('')}
  </section>
  <section data-qa-block="action-footer" style="display:grid;gap:10px;border-top:2px solid rgba(249,115,22,0.18);padding-top:16px;">
    <div style="font-size:16px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;color:#F97316;">${safeText(cta.label, '带走的动作')}</div>
    <div style="font-size:30px;font-weight:800;line-height:1.35;color:#0F172A;">${safeText(cta.text, '看完这一页后，先按海报给出的顺序执行，再去扩展阅读')}</div>
  </section>
</section>`.trim(),
      },
    ],
    render_summary: [
      '单页海报由上游 AI 直接写出完整 HTML，不再依赖模板 registry 或 slot compiler。',
      'headline、证据与动作三段同屏，视觉层级和反模板约束已经落到成品页。',
    ],
  };
}

function buildMockPosterDirectorReview() {
  return {
    director_intent_landed: true,
    anti_template_ok: true,
    message_hierarchy_clear: true,
    evidence_trace_clear: true,
    weak_regions: [],
    rewrite_action: 'none',
    review_summary: 'headline、证据与动作层级成立，可进入 screenshot_review。',
  };
}

function buildMockPosterScreenshotReview(meta) {
  const slides = safeArray(meta?.context?.screenshot_mechanics?.slides);
  return {
    director_intent_landed: true,
    anti_template_ok: true,
    message_hierarchy_clear: true,
    weak_regions: [],
    review_summary: '单页海报的 headline、证据栏和动作收束都在最终截图里成立。',
    slide_reviews: slides.map((slide) => ({
      slide_id: safeText(slide?.slide_id),
      judgement: 'pass',
      visual_findings: ['主标题抓手明确，证据和动作路径连续。'],
      recommended_fix: 'none',
    })),
  };
}

function buildCreativeRunOutput(meta) {
  const family = safeText(meta?.family, 'ppt_deck');
  const route = safeText(meta?.route);
  if (family === 'xiaohongshu') {
    switch (route) {
      case 'storyline':
        return buildMockXhsStoryline(meta);
      case 'single_note_plan':
        return buildMockXhsPlan(meta);
      case 'visual_direction':
        return buildMockXhsVisualDirection(meta);
      case 'render_html':
        return buildMockXhsRender(meta);
      case 'visual_director_review':
        return buildMockXhsDirectorReview(meta);
      case 'screenshot_review':
        return buildMockXhsScreenshotReview(meta);
      case 'publish_copy':
        return buildMockXhsPublishCopy(meta);
      default:
        throw new Error(`unsupported xiaohongshu creative generation route: ${route}`);
    }
  }
  if (family === 'poster_onepager') {
    switch (route) {
      case 'storyline':
        return buildMockPosterStoryline(meta);
      case 'poster_blueprint':
        return buildMockPosterBlueprint(meta);
      case 'visual_direction':
        return buildMockPosterVisualDirection(meta);
      case 'render_html':
        return buildMockPosterRender(meta);
      case 'visual_director_review':
        return buildMockPosterDirectorReview(meta);
      case 'screenshot_review':
        return buildMockPosterScreenshotReview(meta);
      default:
        throw new Error(`unsupported poster_onepager creative generation route: ${route}`);
    }
  }
  switch (route) {
    case 'storyline':
      return buildMockStoryline(meta);
    case 'detailed_outline':
      return buildMockOutline(meta);
    case 'slide_blueprint':
      return buildMockBlueprint(meta);
    case 'visual_direction':
      return buildMockVisualDirection(meta);
    case 'render_html':
      return buildMockPptRender(meta);
    case 'visual_director_review':
      return buildMockPptDirectorReview(meta);
    case 'screenshot_review':
      return buildMockPptScreenshotReview(meta);
    default:
      throw new Error(`unsupported creative generation route: ${route}`);
  }
}

function formatCreativeRunOutput(output) {
  return [
    REDCUBE_STAGE_JSON_BEGIN,
    JSON.stringify(output, null, 2),
    REDCUBE_STAGE_JSON_END,
  ].join('\n');
}

export function withEnv(overrides) {
  const backup = {};
  for (const [key, value] of Object.entries(overrides)) {
    backup[key] = process.env[key];
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = String(value);
    }
  }
  return () => {
    for (const [key, value] of Object.entries(backup)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  };
}

export function buildMockCodexLastMessage(prompt) {
  const text = String(prompt || '');
  if (/Reply with READY only\./i.test(text)) {
    return 'READY';
  }

  const creativeMeta = parseCreativeGenerationMeta(text);
  if (!creativeMeta) {
    throw new Error('mock codex cli received unsupported prompt');
  }
  return formatCreativeRunOutput(buildCreativeRunOutput(creativeMeta));
}

export async function startMockCodexCli() {
  return {
    command: JSON.stringify(['node', path.join(MODULE_DIR, 'mock-codex-cli-bin.mjs')]),
    async close() {},
  };
}
