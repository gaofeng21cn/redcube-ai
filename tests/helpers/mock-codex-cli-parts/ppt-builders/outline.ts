// @ts-nocheck
import { readySources, safeArray, safeText, topicFocus } from '../shared.ts';

function numberValue(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? Math.floor(number) : null;
}

function hardExactSlideCount(meta) {
  const budgetConstraints = meta?.context?.page_budget?.hard_constraints || {};
  const planningConstraints = meta?.context?.page_planning_contract?.hard_constraints || {};
  return numberValue(
    budgetConstraints.exact_slides
      ?? planningConstraints.exact_slides
      ?? budgetConstraints.expected_slide_count
      ?? planningConstraints.expected_slide_count,
  );
}

function renumberSlides(slides) {
  const numbered = safeArray(slides).map((slide, index) => ({
    ...slide,
    slide_no: index + 1,
    slide_id: `S${String(index + 1).padStart(2, '0')}`,
  }));
  if (process.env.REDCUBE_MOCK_PPT_CLAIM_SPINE_INVALID === 'duplicate_slide' && numbered.length > 1) {
    numbered[1].slide_id = numbered[0].slide_id;
  }
  return numbered;
}

function chapterStructureForSlides(slides) {
  const grouped = new Map();
  for (const slide of safeArray(slides)) {
    const chapterId = safeText(slide?.chapter_id, 'C1');
    if (!grouped.has(chapterId)) grouped.set(chapterId, []);
    grouped.get(chapterId).push(Number(slide?.slide_no || grouped.get(chapterId).length + 1));
  }
  return [...grouped.entries()].map(([chapterId, slideNos], index) => ({
    chapter_id: chapterId,
    title: index === 0 && slideNos.length === safeArray(slides).length ? '一页证据闭环' : `第 ${index + 1} 章`,
    slide_range: `${String(Math.min(...slideNos)).padStart(2, '0')}-${String(Math.max(...slideNos)).padStart(2, '0')}`,
  }));
}

function manuscriptEvidencePoint(row) {
  const label = safeText(row?.manuscript_label);
  const numeric = safeArray(row?.key_numeric_results).map((item) => safeText(item)).filter(Boolean)[0];
  const conclusion = safeText(row?.main_conclusion);
  return [label, numeric || conclusion].filter(Boolean).join('：');
}

function claimSpineLockFromStoryline(meta) {
  const claimSpineLock = structuredClone(safeArray(meta?.context?.storyline?.claim_spine_lock));
  if (process.env.REDCUBE_MOCK_PPT_CLAIM_SPINE_DRIFT === '1' && claimSpineLock[0]) {
    claimSpineLock[0].claim_text = `${safeText(claimSpineLock[0].claim_text)}（已被下游改写）`;
  }
  return claimSpineLock;
}

function hardExactOneSlide(meta, sourceSlides) {
  const title = safeText(meta?.context?.title) || safeText(sourceSlides?.[0]?.title) || '路线证据闭环';
  const sources = readySources(meta);
  const manuscriptEvidence = safeArray(meta?.context?.manuscript_evidence_table);
  const manuscriptPoints = manuscriptEvidence.map(manuscriptEvidencePoint).filter(Boolean).slice(0, 4);
  const routeProofPoints = [
    '输入定义：同一材料同步进入三条路线',
    '执行路径：截图审阅导出逐项留证',
    '验收证据：可编辑样片回到审阅门禁',
  ];
  const pageCoreContent = manuscriptPoints.length > 0 ? manuscriptPoints : routeProofPoints;
  return {
    slide_id: 'S01',
    slide_no: 1,
    chapter_id: 'C1',
    page_type: 'public_evidence',
    layout_family: 'multi_zone_compare',
    title: `${title}：一页证据闭环`,
    page_goal: '证明硬性页数约束已进入规划链路',
    page_objective: '用一页同时承载输入、执行、审阅导出与证据闭环',
    core_sentence: '同一输入经规划、执行、审阅和导出留下可复核证据。',
    evidence_points: manuscriptPoints.length > 0
      ? [
          ...manuscriptPoints.slice(0, 2),
          '验收证据：可编辑样片回到审阅门禁',
        ].slice(0, 3)
      : ['topic_count=1.0 route_count=3.0', 'required_gate_coverage=3/3'],
    public_sources: [sources[0], sources[1]].filter(Boolean),
    page_core_content: pageCoreContent.map((item, index) => (
      /[:：]/.test(item)
        ? item
        : `证据${index + 1}：${item}`
    )),
    visual_anchor_tracks: ['input-route-chain', 'review-export-gate', 'evidence-proof-band'],
    speaker_notes: '这一页用于证明 hard exact slide count 已被规划、蓝图和后续视觉样片共同消费。',
    transition_sentence: '一页闭环后直接进入审阅与导出证据。',
    render_recipe_id: 'ppt.compare_zones',
  };
}

function applyHardExactSlides(meta, slides) {
  const exactSlides = hardExactSlideCount(meta);
  if (!exactSlides) return renumberSlides(slides);
  if (exactSlides === 1) return [hardExactOneSlide(meta, slides)];
  const normalized = renumberSlides(slides);
  if (normalized.length >= exactSlides) {
    return renumberSlides(normalized.slice(0, exactSlides));
  }
  const extended = [...normalized];
  while (extended.length < exactSlides) {
    const index = extended.length;
    extended.push({
      ...hardExactOneSlide(meta, normalized),
      slide_id: `S${String(index + 1).padStart(2, '0')}`,
      slide_no: index + 1,
      title: `补足页 ${index + 1}：证据闭环延展`,
      page_goal: '补足硬性页数约束',
      transition_sentence: index + 1 === exactSlides ? '完。' : '继续补足硬性页数。',
    });
  }
  return extended;
}

function manuscriptOutlineSlides(meta) {
  const manuscriptEvidence = safeArray(meta?.context?.manuscript_evidence_table);
  if (manuscriptEvidence.length === 0) return [];
  const sources = readySources(meta);
  const title = safeText(meta?.context?.title) || '论文同步';
  const slides = [
    {
      slide_id: 'S01',
      slide_no: 1,
      chapter_id: 'C1',
      page_type: 'cover_signal',
      layout_family: 'cover_signal',
      title,
      page_goal: '建立论文同步范围',
      page_objective: '说明本次只同步待投稿论文的研究故事、结论、证据和边界',
      core_sentence: `${title} 只讲论文，不提前包装成临床应用或科室价值。`,
      evidence_points: ['第一篇、第二篇、第三篇逐篇同步', '每篇都落到研究问题、主要终点、关键数字和边界'],
      public_sources: [sources[0]],
      page_core_content: ['本次同步对象是三篇准备投稿的论文', '页数由完整证据密度决定，并遵守硬性上限'],
      visual_anchor_tracks: ['cover-title', 'speaker-identity', 'scope-strip'],
      speaker_notes: '开场只界定论文同步范围，不讲内部管理编号。',
      transition_sentence: '先看三篇论文之间的关系。',
      render_recipe_id: 'ppt.hero_signal',
    },
    {
      slide_id: 'S02',
      slide_no: 2,
      chapter_id: 'C1',
      page_type: 'public_evidence',
      layout_family: 'multi_zone_compare',
      title: '三篇论文各自回答的问题不同',
      page_goal: '建立三篇论文总览',
      page_objective: '让听众先看到三条论文主线',
      core_sentence: '三篇论文共享同一数据基础，但各自回答不同的投稿问题。',
      evidence_points: manuscriptEvidence.map((row) => `${safeText(row?.manuscript_label)}：${safeText(row?.research_question)}`).slice(0, 4),
      public_sources: [sources[0], sources[1]],
      page_core_content: manuscriptEvidence.map((row) => `${safeText(row?.manuscript_label)}：${safeText(row?.main_conclusion)}`).slice(0, 4),
      visual_anchor_tracks: ['three-paper-grid', 'shared-cohort-band', 'boundary-rail'],
      speaker_notes: '先把三篇论文区分清楚。',
      transition_sentence: '下面逐篇进入数字证据。',
      render_recipe_id: 'ppt.compare_zones',
    },
  ];
  manuscriptEvidence.forEach((row, rowIndex) => {
    const label = safeText(row?.manuscript_label) || `第${rowIndex + 1}篇`;
    const numeric = safeArray(row?.key_numeric_results).map((item) => safeText(item)).filter(Boolean);
    const firstNumeric = numeric[0] || `${label}关键数字结果`;
    const secondNumeric = numeric[1] || firstNumeric;
    const thirdNumeric = numeric[2] || secondNumeric;
    const baseNo = 3 + rowIndex * 3;
    slides.push(
      {
        slide_id: `S${String(baseNo).padStart(2, '0')}`,
        slide_no: baseNo,
        chapter_id: `C${rowIndex + 2}`,
        page_type: 'public_evidence',
        layout_family: 'multi_zone_compare',
        title: `${label}：研究问题与主要终点`,
        page_goal: `${label}问题定义`,
        page_objective: `说明${label}回答什么问题，以及主要终点是什么`,
        core_sentence: `${label}聚焦${safeText(row?.research_question)}，主要终点是${safeText(row?.primary_endpoint)}。`,
        evidence_points: [firstNumeric, secondNumeric],
        public_sources: [sources[rowIndex % sources.length] || sources[0]],
        page_core_content: [
          `${label}研究问题：${safeText(row?.research_question)}`,
          `${label}主要终点：${safeText(row?.primary_endpoint)}`,
        ],
        visual_anchor_tracks: ['question-card', 'endpoint-card', 'source-rail'],
        speaker_notes: `${label}先讲问题和终点。`,
        transition_sentence: '再看方法或模型主线。',
        render_recipe_id: 'ppt.compare_zones',
      },
      {
        slide_id: `S${String(baseNo + 1).padStart(2, '0')}`,
        slide_no: baseNo + 1,
        chapter_id: `C${rowIndex + 2}`,
        page_type: 'mechanism_track',
        layout_family: 'timeline_band',
        title: `${label}：方法主线如何支撑结论`,
        page_goal: `${label}方法主线`,
        page_objective: `解释${label}的方法、模型或分析策略`,
        core_sentence: `${label}的方法主线是${safeText(row?.method_or_model)}。`,
        evidence_points: [secondNumeric, thirdNumeric],
        public_sources: [sources[(rowIndex + 1) % sources.length] || sources[0]],
        page_core_content: [
          `${label}方法或模型：${safeText(row?.method_or_model)}`,
          `${label}结论边界：${safeText(row?.boundary)}`,
        ],
        visual_anchor_tracks: ['method-track', 'metric-node', 'boundary-node'],
        speaker_notes: `${label}这里讲方法，不提前讲应用。`,
        transition_sentence: '最后落到关键数字和投稿结论。',
        render_recipe_id: 'ppt.timeline_rail',
      },
      {
        slide_id: `S${String(baseNo + 2).padStart(2, '0')}`,
        slide_no: baseNo + 2,
        chapter_id: `C${rowIndex + 2}`,
        page_type: 'public_evidence',
        layout_family: 'multi_zone_compare',
        title: `${label}：关键数字支持的投稿结论`,
        page_goal: `${label}关键结果`,
        page_objective: `把${label}的主要数字结果和结论边界讲清楚`,
        core_sentence: `${label}的结论是${safeText(row?.main_conclusion)}。`,
        evidence_points: [firstNumeric, secondNumeric, thirdNumeric],
        public_sources: [sources[(rowIndex + 2) % sources.length] || sources[0]],
        page_core_content: [
          firstNumeric,
          secondNumeric,
          `边界：${safeText(row?.boundary)}`,
        ],
        visual_anchor_tracks: ['metric-cards', 'conclusion-band', 'boundary-strip'],
        speaker_notes: `${label}主要数字必须听众可见。`,
        transition_sentence: rowIndex === manuscriptEvidence.length - 1 ? '三篇论文逐篇讲完后，回到投稿口径。' : '下一篇继续同样结构。',
        render_recipe_id: 'ppt.compare_zones',
      },
    );
  });
  slides.push({
    slide_id: `S${String(slides.length + 1).padStart(2, '0')}`,
    slide_no: slides.length + 1,
    chapter_id: 'C5',
    page_type: 'closure_peak',
    layout_family: 'summary_peak',
    title: '最后只收束三篇论文的投稿口径',
    page_goal: '同步投稿边界',
    page_objective: '把三篇论文的结论和边界留给主任与同事形成共同认识',
    core_sentence: '这次同步的目标是让大家知道三篇论文各自写了什么、证据在哪里、边界在哪里。',
    evidence_points: manuscriptEvidence.map((row) => `${safeText(row?.manuscript_label)}：${safeText(row?.main_conclusion)}`).slice(0, 4),
    public_sources: [sources[0], sources[1]],
    page_core_content: ['不使用内部管理编号', '不把论文包装成已落地应用', '投稿前同步的是故事、结论、证据和边界'],
    visual_anchor_tracks: ['summary-three-columns', 'boundary-footer'],
    speaker_notes: '结尾只回收到三篇论文。',
    transition_sentence: '完。',
    render_recipe_id: 'ppt.summary_peak',
  });
  return slides.map((slide, index) => ({
    ...slide,
    slide_no: index + 1,
    slide_id: `S${String(index + 1).padStart(2, '0')}`,
  }));
}

export function buildMockOutline(meta) {
  const outlineVariant = safeText(process.env.REDCUBE_MOCK_PPT_OUTLINE_VARIANT);
  const manuscriptSlides = outlineVariant === 'abstract_manuscript' ? [] : manuscriptOutlineSlides(meta);
  if (manuscriptSlides.length > 0) {
    const slides = applyHardExactSlides(meta, manuscriptSlides);
    return {
      chapter_structure: chapterStructureForSlides(slides),
      claim_spine_lock: claimSpineLockFromStoryline(meta),
      slides,
    };
  }

  const title = safeText(meta?.context?.title) || '未命名课件';
  const topic = topicFocus(meta);
  const sources = readySources(meta);
  const defaultSlides = [
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
  ];
  const slides = applyHardExactSlides(meta, defaultSlides);
  return {
    chapter_structure: chapterStructureForSlides(slides),
    claim_spine_lock: claimSpineLockFromStoryline(meta),
    slides,
  };
}
