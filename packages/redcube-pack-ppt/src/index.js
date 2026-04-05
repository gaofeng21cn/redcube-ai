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

export function buildPptOutlineSlides(contract, deps) {
  const {
    safeText,
    promptSeed,
    sharedSourceLabels,
    sharedSourceMaterials,
  } = deps;
  const title = safeText(contract.title || '未命名课件');
  const goal = safeText(contract.goal || '讲清主线与动作');
  const preset = deckPreset(contract.profile_id);
  const publicSources = sharedSourceLabels(contract);
  const sourceClaims = sharedSourceMaterials(contract)
    .map((material) => safeText(material.excerpt || material.content_text).replace(/\s+/g, ' ').slice(0, 80))
    .filter(Boolean);
  const seed = promptSeed('detailed_outline', {
    title,
    goal,
    profile_id: contract.profile_id,
    public_source_1: publicSources[0],
    public_source_2: publicSources[1],
    public_source_3: publicSources[2],
  });
  let slides;
  if (Array.isArray(seed?.slides) && seed.slides.length > 0) {
    slides = seed.slides.map((slide) => ({
      ...slide,
      public_sources: Array.isArray(slide.public_sources) && slide.public_sources.length > 0
        ? slide.public_sources
        : [publicSources[0], publicSources[1], publicSources[2]],
    }));
  } else {
    slides = [
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

  if (sourceClaims.length === 0) return slides;

  return slides.map((slide, index) => {
    const sourceClaim = sourceClaims[index % sourceClaims.length];
    return {
      ...slide,
      core_sentence: index === 0 ? sourceClaim : slide.core_sentence,
      evidence_points: [...slide.evidence_points.slice(0, 2), sourceClaim].slice(0, 3),
      public_sources: publicSources.slice(0, Math.max(1, Math.min(publicSources.length, 3))),
    };
  });
}

function makeBlueprintSlide(slide, index, slides, contract, deps) {
  const preset = deckPreset(contract.profile_id);
  return {
    slide_id: slide.slide_id,
    slide_no: slide.slide_no,
    page_type: slide.page_type,
    title: slide.title,
    page_goal: slide.page_goal,
    core_sentence: slide.core_sentence,
    page_core_content: [
      { label: '核心句', text: slide.core_sentence },
      ...slide.evidence_points.map((item, itemIndex) => ({ label: `展开${itemIndex + 1}`, text: item })),
    ],
    visual_presentation: {
      layout_family: slide.layout_family,
      anchor_tracks: anchorTracksForFamily(slide.layout_family),
      canvas: deps.CANVAS,
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

export function buildPptDetailedOutline(contract, deps) {
  const slides = buildPptOutlineSlides(contract, deps);
  return {
    ...deps.attachCommon('detailed_outline', contract),
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

export function buildPptSlideBlueprint(contract, deps) {
  const seed = deps.promptSeed('slide_blueprint');
  const slides = buildPptOutlineSlides(contract, deps);
  return {
    ...deps.attachCommon('slide_blueprint', contract),
    slide_blueprint: {
      chapter_goal: '逐页落实讲授型 deck 的页面目标、视觉结构与讲稿动作',
      slides: slides.map((slide, index) => makeBlueprintSlide(slide, index, slides, contract, deps)),
      quality_guards: {
        ...(seed?.quality_guards || {}),
        require_visual_direction_before_html: true,
        forbid_template_route_tokens: deps.BANNED_RENDER_TOKENS,
        canvas: deps.CANVAS,
      },
      profile_checks: deps.safeArray(seed?.profile_checks?.[contract.profile_id]),
    },
  };
}

export function buildPptVisualDirection(contract, blueprintArtifact, mode, baselineDeliverableId, deps) {
  const slides = blueprintArtifact.slide_blueprint.slides;
  const seed = deps.promptSeed('visual_direction', { title: contract.title });
  return {
    ...deps.attachCommon('visual_direction', contract),
    visual_direction: {
      visual_manifest: deps.safeText(seed?.visual_direction?.visual_manifest, '浅底高对比、关键页允许峰值、复杂结构显式锚点'),
      what_it_is: deps.safeArray(seed?.visual_direction?.what_it_is).length > 0 ? seed.visual_direction.what_it_is : ['成熟讲者工作台', '结构解释驱动视觉组织'],
      what_it_is_not: deps.safeArray(seed?.visual_direction?.what_it_is_not).length > 0 ? seed.visual_direction.what_it_is_not : ['统一安全模板页', '内部占位来源', '小红书语义替代'],
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
      rhythm_curve: [
        { slide_id: 'S01', role: 'opening_peak' },
        { slide_id: 'S02', role: 'stakes_rise' },
        { slide_id: 'S03', role: 'clarify_buffer' },
        { slide_id: 'S04', role: 'mechanism_peak' },
        { slide_id: 'S05', role: 'decision_bridge' },
        { slide_id: 'S06', role: 'evidence_peak' },
        { slide_id: 'S07', role: 'practice_bridge' },
        { slide_id: 'S08', role: 'closing_peak' },
      ],
      peak_pages: ['S01', 'S04', 'S06', 'S08'],
      page_family_ceiling: {
        cover_hero: 1,
        central_axis: 1,
        multi_zone_compare: 2,
        timeline_band: 1,
        judgement_ladder: 1,
        ring_cross: 1,
        summary_cross: 1,
      },
      forbidden_regressions: mode === 'optimize_existing'
        ? ['更粗糙', '更单调', '更重', '更挤', '更像统一模板页']
        : ['退化成统一安全模板页'],
      page_role_table: slides.map((slide) => ({
        slide_id: slide.slide_id,
        title: slide.title,
        page_role: slide.visual_presentation.layout_family,
        first_glance: slide.visual_presentation.anchor_tracks[0],
        second_glance: slide.visual_presentation.anchor_tracks[1] || slide.visual_presentation.anchor_tracks[0],
      })),
      final_instruction_to_html_generator: deps.safeArray(seed?.visual_direction?.final_instruction_to_html_generator).length > 0
        ? seed.visual_direction.final_instruction_to_html_generator
        : [
          '每页在 slidesData 中独立 content',
          '不得退化成统一模板页',
          '先落实导演稿峰值页，再处理安全页',
        ],
      source_truth_confidence: deps.sharedSourceConfidence(contract) || 'low',
      baseline_deliverable_id: deps.safeText(baselineDeliverableId) || null,
      mode,
    },
  };
}
