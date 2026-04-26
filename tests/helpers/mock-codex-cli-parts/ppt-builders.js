import { recordParallelOverlap, readySources, safeArray, safeText, topicFocus } from './shared.js';

function approvedPlanSlides(meta) {
  const approvedSlides = safeArray(meta?.context?.approved_slide_plan?.slides);
  if (approvedSlides.length === 0) return [];
  const sources = readySources(meta);
  const manuscriptEvidence = safeArray(meta?.context?.manuscript_evidence_table);
  const evidenceForSlide = (approved, index) => {
    const title = safeText(approved?.title);
    const row = manuscriptEvidence.find((item) => title.includes(safeText(item?.manuscript_label)))
      || manuscriptEvidence[index % Math.max(1, manuscriptEvidence.length)]
      || null;
    const numeric = safeArray(row?.key_numeric_results).map((item) => safeText(item)).filter(Boolean);
    return {
      label: safeText(row?.manuscript_label),
      points: numeric.length > 0 ? numeric.slice(0, 2) : ['批准故事线', '逐页展开'],
    };
  };
  return approvedSlides.map((approved, index) => {
    const evidence = evidenceForSlide(approved, index);
    return {
      slide_id: `S${String(approved.slide_no || index + 1).padStart(2, '0')}`,
      slide_no: Number(approved.slide_no) || index + 1,
      chapter_id: `C${Math.min(Math.floor(index / 6) + 1, 6)}`,
      page_type: index === 0 ? 'cover_signal' : (index === approvedSlides.length - 1 ? 'closure_peak' : 'public_evidence'),
      layout_family: index === 0 ? 'cover_signal' : (index === approvedSlides.length - 1 ? 'summary_peak' : 'multi_zone_compare'),
      title: safeText(approved.title) || `Slide ${approved.slide_no || index + 1}`,
      page_goal: '保留批准主线',
      page_objective: '按用户已审阅的逐页故事线继续展开',
      core_sentence: evidence.label
        ? `本页延续已批准故事线第 ${approved.slide_no || index + 1} 页，并保留${evidence.label}的数字证据。`
        : `本页延续已批准故事线第 ${approved.slide_no || index + 1} 页，不压缩、不合并。`,
      evidence_points: evidence.points,
      public_sources: [sources[index % sources.length] || sources[0]],
      page_core_content: [
        `保留第 ${approved.slide_no || index + 1} 页标题与叙事位置`,
        evidence.points[0] || '在后续视觉阶段扩写内容，而不是改变页数合同',
      ],
      visual_anchor_tracks: ['top-title', 'center-content', 'bottom-source-rail'],
      speaker_notes: '这一页按批准主线继续讲，不合并到其他页面。',
      transition_sentence: index === approvedSlides.length - 1 ? '完。' : '下一页继续沿批准主线推进。',
      render_recipe_id: index === 0 ? 'ppt.hero_signal' : (index === approvedSlides.length - 1 ? 'ppt.summary_peak' : 'ppt.compare_zones'),
    };
  });
}

function manuscriptLabels(meta) {
  const text = [
    safeText(meta?.context?.delivery_goal),
    safeText(meta?.context?.goal),
    safeText(meta?.context?.title),
    ...safeArray(meta?.context?.source_materials_full_text).map((material) => safeText(material?.content_text)),
  ].filter(Boolean).join('\n');
  const labels = [...new Set([...text.matchAll(/第\s*([一二三四五六七八九十\d]{1,3})\s*篇/g)]
    .map((match) => `第${safeText(match[1])}篇`))];
  return labels.length > 0 ? labels.slice(0, 3) : ['第一篇', '第二篇', '第三篇'];
}

function numericEvidenceSnippets(meta) {
  const text = safeArray(meta?.context?.source_materials_full_text)
    .map((material) => safeText(material?.content_text))
    .filter(Boolean)
    .join('\n');
  const lines = text
    .split(/\n+/)
    .map((line) => safeText(line))
    .filter((line) => /(?:\d+\s*\/\s*\d+|\d+(?:\.\d+)?\s*%|\bAUROC\b|\bBrier\b|校准斜率|Knosp|中位|<\s*0\.?\d+)/i.test(line));
  return lines.length > 0
    ? lines.slice(0, 8)
    : ['357例；57/357，16.0%；AUROC 0.800；Brier 0.110'];
}

function buildMockManuscriptEvidenceTable(meta) {
  if (safeText(meta?.context?.content_density_contract?.purpose) !== 'manuscript_submission_sync') {
    return [];
  }
  const labels = manuscriptLabels(meta);
  const snippets = numericEvidenceSnippets(meta);
  return labels.map((label, index) => ({
    manuscript_label: label,
    research_question: `${label}回答一个待投稿论文研究问题`,
    primary_endpoint: `${label}主要终点`,
    method_or_model: `${label}方法或模型主线`,
    key_numeric_results: [
      snippets[index % snippets.length],
      snippets[(index + 1) % snippets.length],
    ],
    main_conclusion: `${label}的结论由数字证据支撑`,
    boundary: `${label}仍需保留单中心和外部验证边界`,
  }));
}

export function buildMockStoryline(meta) {
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
    manuscript_evidence_table: buildMockManuscriptEvidenceTable(meta),
  };
}

export function buildMockOutline(meta) {
  const planSlides = approvedPlanSlides(meta);
  if (planSlides.length > 0) {
    return {
      chapter_structure: [
        { chapter_id: 'C1', title: '批准故事线', slide_range: `01-${String(planSlides.length).padStart(2, '0')}` },
      ],
      slides: planSlides,
    };
  }

  const title = safeText(meta?.context?.title) || '未命名课件';
  const topic = topicFocus(meta);
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
        title: `为什么 ${topic} 需要按顺序讲清`,
        page_goal: '建立问题紧迫性',
        page_objective: `让听众看到 ${topic} 最容易被误讲的断点`,
        core_sentence: `真正的难点不是记更多概念，而是把 ${topic} 的判断顺序讲清。`,
        evidence_points: [sources[0], `${topic} 一旦先后顺序讲反，听众就会在错误位置停留`],
        public_sources: [sources[0], sources[1]],
        page_core_content: [
          `左侧讲 ${topic} 常见误区：先背碎片、后看顺序，结果越学越乱`,
          `右侧讲正确收益：先把 ${topic} 的判断轨道讲清，后面的概念才有位置`,
        ],
        visual_anchor_tracks: ['left-risk-zone', 'right-value-zone', 'bottom-bridge'],
        speaker_notes: `把 ${topic} 的学习压力建起来：不是信息不够，而是顺序没讲清。`,
        transition_sentence: `知道 ${topic} 为什么容易讲乱之后，先拆最常见的认知误区。`,
        render_recipe_id: 'ppt.compare_zones',
      },
      {
        slide_id: 'S03',
        slide_no: 3,
        chapter_id: 'C1',
        page_type: 'myth_fact_split',
        layout_family: 'multi_zone_compare',
        title: `先拆 ${topic} 最容易混淆的三件事`,
        page_goal: '清误区',
        page_objective: `把 ${topic} 的定义、判断与动作分开`,
        core_sentence: `不把 ${topic} 的能力边界讲清，后面的判断顺序就会被误解。`,
        evidence_points: [`把 ${topic} 的定义和动作分开`, `把 ${topic} 的证据与解释分开`],
        public_sources: [sources[1]],
        page_core_content: [
          `混淆一：把 ${topic} 的名词解释误当成判断顺序`,
          `混淆二：把 ${topic} 的单条结论误当成完整证据`,
          `混淆三：把 ${topic} 的动作建议误当成所有人都一样`,
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
        title: `${topic} 的判断轨道是如何一步步推进的`,
        page_goal: '建立主链结构',
        page_objective: `把 ${topic} 拆成显式阶段`,
        core_sentence: `只有把 ${topic} 的问题定义、事实准备和动作判断打通，讲解才成立。`,
        evidence_points: [`${topic} 的问题界定`, `${topic} 的事实准备`, `${topic} 的动作建议`],
        public_sources: [sources[0], sources[1]],
        page_core_content: [
          `先把 ${topic} 的核心问题翻译成人能听懂的话`,
          `再把 ${topic} 要消费的事实层补齐`,
          `然后按“定义 -> 证据 -> 动作”的正式主链推进`,
          `最后把 ${topic} 收口成可复述的结论`,
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
        title: `${topic} 里哪些节点可以自动，哪些必须人工签收`,
        page_goal: '建立判断边界',
        page_objective: `让听众看到 ${topic} 的自动化与人工把关分工`,
        core_sentence: `${topic} 越想讲得清楚，越要把停顿点与签收点写清楚。`,
        evidence_points: [`${topic} 的事实层必须可追溯`, `${topic} 的结论层必须可回到具体证据`],
        public_sources: [sources[1], sources[2]],
        page_core_content: [
          `能自动的：${topic} 的结构化推进、阶段物化与重复整理`,
          `必须人工签收的：${topic} 的研究判断、风险确认与最终结论`,
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
        title: `为什么复用模块能支撑 ${topic} 的稳定讲解`,
        page_goal: '建立模块视角',
        page_objective: `解释 ${topic} 与正式主链的关系`,
        core_sentence: `${topic} 不是每次重造流程，而是用稳定模块反复装配判断链。`,
        evidence_points: [`${topic} 的路由`, `${topic} 的语义与执行契约`, `${topic} 的交付收口`],
        public_sources: [sources[0], sources[1], sources[2]],
        page_core_content: [
          `复用的不是某一句 prompt，而是 ${topic} 的正式控制链`,
          `同一套 shared source truth 能继续支撑 ${topic} 的不同讲法`,
          `模块职责清楚，${topic} 的质量问题才知道该在哪一层修`,
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
        title: `小同行带走的四个 ${topic} 动作`,
        page_goal: '形成可复用动作框架',
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
        title: `最后收束三条 ${topic} 真正该带走的结论`,
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

export function buildMockBlueprint(meta) {
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

export function buildMockVisualDirection(meta) {
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
    typography_plan: {
      cover_title: { font_size: 56, line_height: 1.08, font_weight: 800 },
      body_title: { font_size: 44, line_height: 1.12, font_weight: 780 },
      section_lead: { font_size: 24, line_height: 1.4, font_weight: 650 },
      card_title: { font_size: 21, line_height: 1.18, font_weight: 720 },
      card_body: { font_size: 16.5, line_height: 1.45, font_weight: 600 },
      meta_label: { font_size: 12.5, line_height: 1.1, font_weight: 600 },
      page_no: { font_size: 18, line_height: 1.0, font_weight: 600 },
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
    visual_anchor_system: {
      preferred_library: 'Font Awesome Free',
      fallback_library: 'emoji',
      consistency_rule: '同一页、同一组视觉锚点保持统一图标语法，优先使用 Font Awesome Free。',
      required_peak_page_anchor: '封面、峰值页与结尾页都要有语义明确的视觉锚点。',
      forbidden_patterns: [
        '孤立单字贴纸',
        '无语义装饰符号',
        '图标压住标题或正文',
      ],
    },
  };
}

export function buildPptSlideMarkup(slide, totalSlides, peakPage = false) {
  const pageGoal = safeText(slide.page_goal).replace(/\s+/g, ' ').slice(0, 22);
  const title = safeText(slide.title).replace(/\s+/g, ' ').slice(0, 26);
  const coreSentence = safeText(slide.core_sentence).replace(/\s+/g, ' ').slice(0, 54);
  const sourceLabel = safeText(safeArray(slide.public_sources || []).at(0), '公开来源');
  const renderVariants = new Set(
    safeText(process.env.REDCUBE_MOCK_PPT_RENDER_VARIANT)
      .split(',')
      .map((item) => safeText(item))
      .filter(Boolean),
  );
  const driftPageNumber = renderVariants.has('drift_page_number_s05') && safeText(slide.slide_id) === 'S05';
  const pageNumberText = driftPageNumber
    ? String(slide.slide_no).padStart(2, '0')
    : `${String(slide.slide_no).padStart(2, '0')} / ${String(totalSlides).padStart(2, '0')}`;
  const pageNumberStyle = driftPageNumber
    ? 'font-weight:700;font-size:20px;color:#111827;transform:translateX(-42px);'
    : 'font-weight:700;font-size:14px;color:#475569;';
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
        <div data-page-number="true" style="${pageNumberStyle}">${pageNumberText}</div>
      </footer>
    </div>
  `.trim();
}

export function buildMockPptRender(meta) {
  const slides = safeArray(meta?.context?.blueprint?.slides);
  const peakPages = new Set(safeArray(meta?.context?.visual_direction?.peak_pages));
  const variants = new Set(
    safeText(process.env.REDCUBE_MOCK_PPT_RENDER_VARIANT)
      .split(',')
      .map((item) => safeText(item))
      .filter(Boolean),
  );
  const renderScope = safeText(meta?.context?.render_scope, 'full_deck');
  const rawPrompt = safeText(meta?.__raw_prompt);
  if (variants.has('require_render_batching') && renderScope !== 'summary' && slides.length > 6) {
    throw new Error('mock ppt render expected bounded section batches, not whole-deck HTML generation');
  }
  if (variants.has('require_section_batches') && renderScope !== 'summary') {
    const batch = meta?.context?.render_batch || {};
    if (safeText(meta?.context?.rerender_mode) !== 'full_regeneration') {
      return {
        slides: slides.map((slide) => ({
          slide_id: slide.slide_id,
          content_html: buildPptSlideMarkup(slide, slides.length, peakPages.has(slide.slide_id)),
        })),
        render_summary: ['targeted revision keeps its own small-batch contract'],
      };
    }
    if (safeText(batch?.batch_mode) !== 'section_batch') {
      throw new Error(`mock ppt render expected section_batch mode: ${JSON.stringify(batch)}`);
    }
    if (slides.length > 6) {
      throw new Error(`mock ppt render expected bounded section batch size: ${JSON.stringify(batch)}`);
    }
  }
  if (variants.has('fail_after_first_render_batch') && renderScope !== 'summary') {
    const batchIndex = Number(meta?.context?.render_batch?.batch_index || 0);
    if (batchIndex > 1) {
      throw new Error('mock ppt render forced interruption after first durable batch');
    }
  }
  if (renderScope === 'summary') {
    return {
      slides: [],
      render_summary: [
        '本轮批量 render_html 已完成，整套 deck 的页面结构与节奏可以继续进入后续审稿。',
      ],
    };
  }
  if (variants.has('require_parallel_batches')) {
    recordParallelOverlap({
      lockDir: safeText(process.env.REDCUBE_MOCK_PPT_RENDER_PARALLEL_LOCK_DIR),
      overlapFile: safeText(process.env.REDCUBE_MOCK_PPT_RENDER_PARALLEL_OVERLAP_FILE),
      batchIndex: Number(meta?.context?.render_batch?.batch_index || 0),
      prefix: 'ppt-render',
    });
  }
  if (variants.has('require_reference_window') && renderScope !== 'summary') {
    const batchIndex = Number(meta?.context?.render_batch?.batch_index || 0);
    const references = safeArray(meta?.context?.reference_slides);
    const typographyPlan = meta?.context?.deck_style_reference?.typography_plan || {};
    if (!Number(meta?.context?.deck_style_reference?.reference_window) || !typographyPlan?.body_title) {
      throw new Error(`mock ppt render expected deck_style_reference: ${JSON.stringify(meta?.context?.deck_style_reference)}`);
    }
    if (batchIndex > 1) {
      if (references.length === 0 || references.length > 3) {
        throw new Error(`mock ppt render expected 1-3 reference slides for later batch, got ${JSON.stringify(references)}`);
      }
      for (const reference of references) {
        const sourceHtmlHash = safeText(reference?.source_html_hash);
        const visualSummary = reference?.visual_summary || {};
        const slideIdentity = reference?.slide_identity || {};
        if (Object.hasOwn(reference, 'source_html') || sourceHtmlHash.length !== 64 || !safeText(slideIdentity?.slide_id) || !safeText(visualSummary?.layout_family)) {
          throw new Error(`mock ppt render expected reference style metadata without source_html: ${JSON.stringify(reference)}`);
        }
      }
    }
  }
  if (variants.has('require_page_local_fix_context') && renderScope === 'slide_batch') {
    const references = safeArray(meta?.context?.reference_slides);
    if (references.length > 0) {
      throw new Error(`mock ppt fix_html expected no reference slides for page-local repair: ${JSON.stringify(references)}`);
    }
    if (slides.length !== 1) {
      throw new Error(`mock ppt fix_html expected one slide per repair unit: ${JSON.stringify(slides.map((slide) => slide.slide_id))}`);
    }
    const currentSlideId = safeText(slides[0]?.slide_id);
    if (!safeText(slides[0]?.current_content_html)) {
      throw new Error(`mock ppt fix_html expected current_content_html for ${currentSlideId}`);
    }
    const visualDirection = meta?.context?.visual_direction || {};
    const pageRoleTable = safeArray(visualDirection?.page_role_table);
    const rhythmCurve = safeArray(visualDirection?.rhythm_curve);
    const peakPages = safeArray(visualDirection?.peak_pages);
    if (pageRoleTable.some((item) => safeText(item?.slide_id) !== currentSlideId)
      || rhythmCurve.some((item) => safeText(item?.slide_id) !== currentSlideId)
      || peakPages.some((slideId) => safeText(slideId) !== currentSlideId)) {
      throw new Error(`mock ppt fix_html expected page-local visual direction for ${currentSlideId}: ${JSON.stringify(visualDirection)}`);
    }
  }
  return {
    slides: slides.map((slide) => ({
      slide_id: slide.slide_id,
      content_html: (() => {
        if (variants.has('require_revision_context')) {
          const revisionContext = meta?.context?.revision_context || {};
          const hasDirectorFeedback = safeArray(revisionContext?.visual_director_review?.weak_pages).length > 0
            || safeText(revisionContext?.visual_director_review?.review_summary).length > 0;
          const hasScreenshotFeedback = safeArray(revisionContext?.screenshot_review?.blocked_slide_ids).length > 0
            || safeArray(revisionContext?.screenshot_review?.slide_feedback).length > 0;
          if (!hasDirectorFeedback || !hasScreenshotFeedback) {
            throw new Error(`mock ppt render expected revision_context with director and screenshot review feedback: ${JSON.stringify(revisionContext)}`);
          }
          const blockedSlideIds = new Set([
            ...safeArray(revisionContext?.visual_director_review?.weak_pages),
            ...safeArray(revisionContext?.screenshot_review?.blocked_slide_ids),
            ...safeArray(revisionContext?.operator_revision_brief?.target_slide_ids),
          ].map((item) => safeText(item)).filter(Boolean));
          if (blockedSlideIds.has(safeText(slide.slide_id))) {
            const revisionFocus = slide?.revision_focus || {};
            if (!safeText(revisionFocus?.recommended_fix) || safeArray(revisionFocus?.ai_findings).length === 0) {
              throw new Error(`mock ppt render expected revision_focus on blocked slide ${slide.slide_id}: ${JSON.stringify(slide)}`);
            }
            if (!/## Provided Local Files/.test(rawPrompt) || !rawPrompt.includes(safeText(slide.slide_id))) {
              throw new Error(`mock ppt render expected local visual references for blocked slide ${slide.slide_id}`);
            }
          }
        }
        if (variants.has('require_targeted_revision_rerender')) {
          const revisionContext = meta?.context?.revision_context || {};
          const blockedSlideIds = new Set([
            ...safeArray(revisionContext?.visual_director_review?.weak_pages),
            ...safeArray(revisionContext?.screenshot_review?.blocked_slide_ids),
            ...safeArray(revisionContext?.operator_revision_brief?.target_slide_ids),
          ].map((item) => safeText(item)).filter(Boolean));
          if (blockedSlideIds.size === 0) {
            throw new Error(`mock ppt render expected blocked slide ids for targeted rerender: ${JSON.stringify(revisionContext)}`);
          }
          if (!blockedSlideIds.has(safeText(slide.slide_id))) {
            throw new Error(`mock ppt render expected only blocked slides during rerender, got ${slide.slide_id}`);
          }
        }
        if (variants.has('require_mechanical_feedback')) {
          const revisionContext = meta?.context?.revision_context || {};
          const slideFeedback = safeArray(revisionContext?.screenshot_review?.slide_feedback)
            .find((item) => safeText(item?.slide_id) === safeText(slide.slide_id));
          if (!slideFeedback) {
            throw new Error(`mock ppt render expected screenshot slide feedback for ${slide.slide_id}`);
          }
          if (safeArray(slideFeedback?.blocked_checks).includes('edge_clearance_out_of_range')
            || safeArray(slideFeedback?.blocked_checks).includes('occlusion_detected')
            || safeArray(slideFeedback?.blocked_checks).includes('visual_density_out_of_range')) {
            const revisionFocus = slide?.revision_focus || {};
            if (!safeArray(slideFeedback?.mechanical_findings).length) {
              throw new Error(`mock ppt render expected mechanical_findings for ${slide.slide_id}: ${JSON.stringify(slideFeedback)}`);
            }
            if (!safeArray(revisionFocus?.ai_findings).some((item) => /机械审计|贴边|遮挡|密度/.test(safeText(item)))) {
              throw new Error(`mock ppt render expected mechanical findings in revision_focus for ${slide.slide_id}: ${JSON.stringify(revisionFocus)}`);
            }
          }
        }
        if (variants.has('require_repeat_block_escalation')) {
          const revisionFocus = slide?.revision_focus || {};
          if (revisionFocus?.repeat_block_after_fix !== true) {
            throw new Error(`mock ppt render expected repeat_block_after_fix escalation for ${slide.slide_id}: ${JSON.stringify(revisionFocus)}`);
          }
          if (!/重复阻塞|结构级|删减|重排|扩大/.test(safeText(revisionFocus?.recommended_fix))) {
            throw new Error(`mock ppt render expected structural escalation text for ${slide.slide_id}: ${JSON.stringify(revisionFocus)}`);
          }
          if (!safeArray(revisionFocus?.ai_findings).some((item) => /重复阻塞|微调不足/.test(safeText(item)))) {
            throw new Error(`mock ppt render expected repeat-block finding for ${slide.slide_id}: ${JSON.stringify(revisionFocus)}`);
          }
        }
        if (variants.has('require_scoped_revision_context')) {
          const revisionContext = meta?.context?.revision_context || {};
          const currentSlideId = safeText(slide.slide_id);
          const weakPages = safeArray(revisionContext?.visual_director_review?.weak_pages)
            .map((item) => safeText(item))
            .filter(Boolean);
          const blockedSlideIds = safeArray(revisionContext?.screenshot_review?.blocked_slide_ids)
            .map((item) => safeText(item))
            .filter(Boolean);
          const screenshotFeedbackIds = safeArray(revisionContext?.screenshot_review?.slide_feedback)
            .map((item) => safeText(item?.slide_id))
            .filter(Boolean);
          const operatorTargetSlideIds = safeArray(revisionContext?.operator_revision_brief?.target_slide_ids)
            .map((item) => safeText(item))
            .filter(Boolean);
          const operatorFeedbackIds = safeArray(revisionContext?.operator_revision_brief?.slide_feedback)
            .map((item) => safeText(item?.slide_id))
            .filter(Boolean);
          if (weakPages.some((slideId) => slideId && slideId !== currentSlideId)
            || blockedSlideIds.some((slideId) => slideId && slideId !== currentSlideId)
            || screenshotFeedbackIds.some((slideId) => slideId && slideId !== currentSlideId)
            || operatorTargetSlideIds.some((slideId) => slideId && slideId !== currentSlideId)
            || operatorFeedbackIds.some((slideId) => slideId && slideId !== currentSlideId)) {
            throw new Error(`mock ppt render expected scoped revision_context for ${currentSlideId}: ${JSON.stringify(revisionContext)}`);
          }
        }
        const markup = buildPptSlideMarkup(slide, slides.length, peakPages.has(slide.slide_id));
        if (variants.has('missing_root_meta')) {
          return markup
            .replace(/\sdata-title="[^"]*"/g, '')
            .replace(/\sdata-speaker-seconds="[^"]*"/g, '')
            .replace(/\sdata-layout-family="[^"]*"/g, '')
            .replace(/\sdata-recipe-id="[^"]*"/g, '')
            .replace(/\sdata-template-id="[^"]*"/g, '')
            .replace(/\sdata-peak-page="[^"]*"/g, '');
        }
        if (variants.has('missing_review_anchors')) {
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

export function buildMockPptNativeShapePlan(meta) {
  const route = safeText(meta?.route);
  const slides = safeArray(meta?.context?.blueprint?.slides);
  const repairFeedback = safeArray(meta?.context?.repair_feedback);
  const targetSlideIds = new Set(
    safeArray(meta?.context?.unit_repair_scope?.target_slide_ids)
      .map((slideId) => safeText(slideId))
      .filter(Boolean),
  );
  return {
    ai_first_editing_contract: {
      contract_id: 'ppt_native_ai_first_editing_contract_v1',
      creative_owner: 'llm_agent',
      editable_shape_plan_required: true,
      python_helper_role: 'execute_validate_export_only',
      template_substitution_allowed: false,
      preserved_gates: ['visual_director_review', 'screenshot_review', 'export_pptx'],
    },
    editable_shape_plan: {
      contract_kind: 'redcube_ai_first_native_ppt_shape_plan',
      route,
      scope: route === 'repair_pptx_native' ? 'page_repair' : 'deck_authoring',
      target_slide_ids: [...targetSlideIds],
      consumed_feedback_count: repairFeedback.length,
      slides: slides.map((slide, index) => ({
        slide_id: safeText(slide?.slide_id, `S${String(index + 1).padStart(2, '0')}`),
        title: safeText(slide?.title, `Slide ${index + 1}`),
        layout_family: safeText(slide?.visual_presentation?.layout_family || slide?.layout_family),
        core_sentence: safeText(slide?.core_sentence),
        page_core_content: safeArray(slide?.page_core_content),
        evidence_and_sources: safeArray(slide?.evidence_and_sources),
        native_shapes: [
          {
            shape_id: `${safeText(slide?.slide_id, `S${String(index + 1).padStart(2, '0')}`)}-title`,
            kind: 'text_box',
            role: 'title',
            editable_text: safeText(slide?.title, `Slide ${index + 1}`),
          },
          {
            shape_id: `${safeText(slide?.slide_id, `S${String(index + 1).padStart(2, '0')}`)}-body`,
            kind: 'group',
            role: 'content_stack',
            editable_text: safeArray(slide?.page_core_content).map((item) => safeText(item?.text || item)).filter(Boolean).join('\n'),
          },
        ],
        repair_directive: targetSlideIds.has(safeText(slide?.slide_id)) ? 'apply screenshot feedback to this editable slide only' : 'preserve passed slide',
      })),
    },
  };
}

export function buildMockPptDirectorReview(meta) {
  const slides = safeArray(meta?.context?.render_summary);
  const reviewScope = safeText(meta?.context?.review_scope, 'full_deck_review');
  const variants = new Set(
    safeText(process.env.REDCUBE_MOCK_PPT_DIRECTOR_REVIEW_VARIANT)
      .split(',')
      .map((item) => safeText(item))
      .filter(Boolean),
  );
  if (variants.has('require_page_local_delta_review')) {
    if (reviewScope !== 'incremental_page_review' && reviewScope !== 'delta_page_review') {
      throw new Error(`mock ppt director review expected incremental page review scope, got ${reviewScope}`);
    }
    if (slides.length !== 1) {
      throw new Error(`mock ppt director review expected one targeted slide: ${JSON.stringify(slides.map((slide) => slide.slide_id))}`);
    }
    const expectedSlideIds = new Set(
      safeText(process.env.REDCUBE_MOCK_PPT_DIRECTOR_EXPECTED_SLIDE_IDS)
        .split(',')
        .map((item) => safeText(item))
        .filter(Boolean),
    );
    const currentSlideId = safeText(slides[0]?.slide_id);
    if (expectedSlideIds.size > 0 && !expectedSlideIds.has(currentSlideId)) {
      throw new Error(`mock ppt director review expected only ${[...expectedSlideIds].join(',')}, got ${currentSlideId}`);
    }
    const sourceHtml = safeText(slides[0]?.source_html);
    if (!sourceHtml.includes('data-slide-root') || !sourceHtml.includes(currentSlideId)) {
      throw new Error(`mock ppt director review expected rendered source_html for ${currentSlideId}`);
    }
    const blueprintSlides = safeArray(meta?.context?.blueprint?.slides);
    if (blueprintSlides.length !== 1 || safeText(blueprintSlides[0]?.slide_id) !== currentSlideId) {
      throw new Error(`mock ppt director review expected page-local blueprint for ${currentSlideId}: ${JSON.stringify(blueprintSlides)}`);
    }
    const visualDirection = meta?.context?.visual_direction || {};
    const pageRoleTable = safeArray(visualDirection?.page_role_table);
    const rhythmCurve = safeArray(visualDirection?.rhythm_curve);
    const peakPages = safeArray(visualDirection?.peak_pages);
    if (pageRoleTable.some((item) => safeText(item?.slide_id) !== currentSlideId)
      || rhythmCurve.some((item) => safeText(item?.slide_id) !== currentSlideId)
      || peakPages.some((slideId) => safeText(slideId) !== currentSlideId)) {
      throw new Error(`mock ppt director review expected page-local visual direction for ${currentSlideId}: ${JSON.stringify(visualDirection)}`);
    }
    const preflightSlides = safeArray(meta?.context?.director_preflight?.slides);
    if (preflightSlides.length !== 1 || safeText(preflightSlides[0]?.slide_id) !== currentSlideId) {
      throw new Error(`mock ppt director review expected page-local preflight for ${currentSlideId}: ${JSON.stringify(preflightSlides)}`);
    }
  }
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

export function buildMockPptScreenshotReview(meta) {
  const slides = safeArray(meta?.context?.screenshot_mechanics?.slides);
  const reviewScope = safeText(meta?.context?.review_scope, 'summary');
  const variants = new Set(
    safeText(process.env.REDCUBE_MOCK_PPT_SCREENSHOT_REVIEW_VARIANT)
      .split(',')
      .map((item) => safeText(item))
      .filter(Boolean),
  );
  if (variants.has('require_parallel_batches') && reviewScope !== 'summary') {
    recordParallelOverlap({
      lockDir: safeText(process.env.REDCUBE_MOCK_PPT_SCREENSHOT_PARALLEL_LOCK_DIR),
      overlapFile: safeText(process.env.REDCUBE_MOCK_PPT_SCREENSHOT_PARALLEL_OVERLAP_FILE),
      batchIndex: Number(meta?.context?.screenshot_mechanics?.slides?.[0]?.slide_id ? slides[0]?.slide_id?.replace(/\D+/g, '') : 0) || slides.length,
      prefix: 'ppt-screenshot',
    });
  }
  if (variants.has('require_source_html') && reviewScope !== 'summary') {
    for (const slide of slides) {
      const sourceHtml = safeText(slide?.source_html);
      if (!sourceHtml.includes('data-slide-root') || !sourceHtml.includes(safeText(slide?.slide_id))) {
        throw new Error(`mock ppt screenshot review expected source_html for ${safeText(slide?.slide_id)}`);
      }
    }
  }
  if (variants.has('require_page_local_review') && reviewScope !== 'summary') {
    if (slides.length !== 1) {
      throw new Error(`mock ppt screenshot review expected one slide per AI review unit: ${JSON.stringify(slides.map((slide) => slide.slide_id))}`);
    }
    const expectedSlideIds = new Set(
      safeText(process.env.REDCUBE_MOCK_PPT_SCREENSHOT_EXPECTED_SLIDE_IDS)
        .split(',')
        .map((item) => safeText(item))
        .filter(Boolean),
    );
    const currentSlideId = safeText(slides[0]?.slide_id);
    if (expectedSlideIds.size > 0 && !expectedSlideIds.has(currentSlideId)) {
      throw new Error(`mock ppt screenshot review expected only ${[...expectedSlideIds].join(',')}, got ${currentSlideId}`);
    }
    const blueprintSlides = safeArray(meta?.context?.blueprint?.slides);
    if (blueprintSlides.length !== 1 || safeText(blueprintSlides[0]?.slide_id) !== currentSlideId) {
      throw new Error(`mock ppt screenshot review expected page-local blueprint for ${currentSlideId}: ${JSON.stringify(blueprintSlides)}`);
    }
    const visualDirection = meta?.context?.visual_direction || {};
    const pageRoleTable = safeArray(visualDirection?.page_role_table);
    const rhythmCurve = safeArray(visualDirection?.rhythm_curve);
    const peakPages = safeArray(visualDirection?.peak_pages);
    if (pageRoleTable.some((item) => safeText(item?.slide_id) !== currentSlideId)
      || rhythmCurve.some((item) => safeText(item?.slide_id) !== currentSlideId)
      || peakPages.some((slideId) => safeText(slideId) !== currentSlideId)) {
      throw new Error(`mock ppt screenshot review expected page-local visual direction for ${currentSlideId}: ${JSON.stringify(visualDirection)}`);
    }
  }
  const forcedBlockSlideId = variants.has('force_block')
    ? safeText(slides.find((slide) => safeText(slide?.slide_id) === 'S02')?.slide_id, safeText(slides[0]?.slide_id))
    : '';
  return {
    director_intent_landed: true,
    anti_template_ok: true,
    weak_pages: forcedBlockSlideId ? [forcedBlockSlideId] : [],
    review_summary: forcedBlockSlideId
      ? `${forcedBlockSlideId} 仍有可见压边，当前不能放行导出。`
      : '截图复核确认封面署名、结构主线与课堂节奏都已经落到最终画面里。',
    slide_reviews: slides.map((slide) => ({
      slide_id: safeText(slide?.slide_id),
      judgement: safeText(slide?.slide_id) === forcedBlockSlideId
        ? 'block'
        : (variants.has('pass_with_minor_watch') ? 'pass_with_minor_watch' : 'pass'),
      visual_findings: safeText(slide?.slide_id) === forcedBlockSlideId
        ? ['底部说明贴边，卡片内最后一行可见压边，仍需局部修页。']
        : ['结构清楚，首眼路径稳定，信息密度可讲可看。'],
      recommended_fix: safeText(slide?.slide_id) === forcedBlockSlideId
        ? '上移并压缩底部文案，恢复卡内底部留白。'
        : 'none',
    })),
  };
}
