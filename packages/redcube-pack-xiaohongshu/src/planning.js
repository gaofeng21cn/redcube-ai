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

export function inferXhsVisualPresentation(slide) {
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

export function buildXhsPlanSlides(contract, storyline, research, deps) {
  const seed = deps.promptSeed(contract, 'single_note_plan', { title: contract.title });
  const slides = deps.safeArray(seed?.plan?.slides);
  const sources = deps.safeArray(research?.research?.public_sources).length > 0 ? research.research.public_sources : deps.sourceLabels(contract);
  const sourceClaims = deps.sourceMaterials(contract).map((material) => deps.safeText(material.excerpt || material.content_text).replace(/\s+/g, ' ').slice(0, 64)).filter(Boolean);
  return slides.map((slide, index) => ({
    slide_id: slide.slide_id,
    slide_no: index + 1,
    title: slide.title,
    layout_family: slide.layout_family,
    page_goal: slide.page_goal,
    progression_role: deps.safeText(slide.progression_role, ['hook','tension','explain','mechanism_peak','evidence_peak','memory_close'][index] || 'explain'),
    core_sentence: `${slide.title}｜${deps.safeText(storyline?.storyline?.memory_hook, deps.inferMemoryHook(contract))}`,
    page_core_content: (() => {
      const inferred = inferPageContent(slide, {
        audience_judgement: deps.safeText(storyline?.storyline?.audience_judgement, deps.inferAudience(contract)),
        why_now: deps.safeText(storyline?.storyline?.why_now, deps.inferWhyNow(contract)),
        tension: deps.safeText(storyline?.storyline?.tension, deps.inferTension(contract)),
        memory_hook: deps.safeText(storyline?.storyline?.memory_hook, deps.inferMemoryHook(contract)),
        public_sources: sources,
      }, index, slides);
      if (sourceClaims.length === 0) return inferred;
      const sourceClaim = sourceClaims[index % sourceClaims.length];
      if (index === 0) return [sourceClaim, ...inferred.slice(1)];
      return [...inferred.slice(0, 2), sourceClaim];
    })(),
    visual_presentation: inferXhsVisualPresentation(slide),
    source_language: deps.safeText(slide.source_language, '来源必须翻译成读者能理解的公开口径'),
    evidence_and_sources: sources.map((source, sourceIndex) => ({
      source_id: `SRC-${index + 1}-${sourceIndex + 1}`,
      public_label: source,
    })),
    speaker_notes: `这页要让读者立刻感到：${slide.page_goal}。先用一句人话把判断句讲清，再补一条公开来源托住可信度。`,
    transition: deps.safeText(slide.transition, index === slides.length - 1 ? '最后收束成可收藏的行动清单。' : `下一页进入：${slides[index + 1].title}`),
    transition_sentence: deps.safeText(slide.transition, index === slides.length - 1 ? '最后收束成可收藏的行动清单。' : `下一页进入：${slides[index + 1].title}`),
  }));
}

export function buildXhsVisualDirection(contract, deliverablePaths, mode, baselineDeliverableId, deps) {
  const plan = deps.readStageArtifact(contract, deliverablePaths, 'single_note_plan');
  const storyline = deps.readStageArtifact(contract, deliverablePaths, 'storyline');
  const seed = deps.promptSeed(contract, 'visual_direction');
  const slides = deps.safeArray(plan?.single_note_plan?.slides);
  const peakPages = deps.safeArray(seed?.visual_direction?.peak_pages).length > 0 ? seed.visual_direction.peak_pages : slides.filter((slide) => ['hook','mechanism_peak','evidence_peak'].includes(slide.progression_role)).map((slide) => slide.slide_id);
  const pageRoleTable = slides.map((slide) => ({
    slide_id: slide.slide_id,
    title: slide.title,
    page_role: slide.progression_role,
    first_glance: slide.visual_presentation?.main_visual_action || slide.title,
    second_glance: slide.page_goal,
  }));
  return {
    ...deps.attachCommon('visual_direction', contract),
    mode,
    visual_direction: {
      director_statement: deps.safeText(seed?.visual_direction?.director_statement, '像一个认真做过整理的人，把复杂内容画成可收藏的笔记'),
      visual_motif: deps.safeText(seed?.visual_direction?.visual_motif, '纸面感 + 高亮批注 + 便签式收束'),
      material_rules: seed?.visual_direction?.material_rules || {
        paper_base: '米白纸 + 轻网格',
        main_accent: '#2563EB',
        warning_accent: '#DC2626',
      },
      rhythm_curve: deps.safeArray(seed?.visual_direction?.rhythm_curve).length > 0 ? seed.visual_direction.rhythm_curve : slides.map((slide) => ({ slide_id: slide.slide_id, role: slide.progression_role })),
      peak_pages: peakPages,
      page_family_ceiling: seed?.visual_direction?.page_family_ceiling || Object.fromEntries(slides.map((slide) => [slide.layout_family, 1])),
      anti_template_constraints: deps.safeArray(seed?.visual_direction?.anti_template_constraints),
      source_language_discipline: deps.safeText(seed?.visual_direction?.source_language_discipline, '来源必须翻译成读者能理解的公开口径'),
      source_truth_confidence: deps.sourceConfidence(contract) || deps.safeText(storyline?.storyline?.source_truth_confidence),
      page_role_table: pageRoleTable,
      forbidden_regressions: deps.safeArray(seed?.visual_direction?.forbidden_regressions),
      baseline_deliverable_id: mode === 'optimize_existing' ? baselineDeliverableId : null,
      memory_hook: deps.safeText(storyline?.storyline?.memory_hook, deps.inferMemoryHook(contract)),
    },
  };
}

export async function buildXhsRenderHtml(contract, deliverablePaths, deps) {
  const plan = deps.readStageArtifact(contract, deliverablePaths, 'single_note_plan');
  const visual = deps.readStageArtifact(contract, deliverablePaths, 'visual_direction');
  const contractRender = deps.renderContract(contract);
  if (!deps.safeText(contractRender.compiler_module)) {
    throw new Error('Missing render pack compiler');
  }
  const compiler = await loadRenderPackCompiler(contract, 'render_pack.js');
  const slides = await compiler.compileRenderSlides({
    slides: deps.safeArray(plan?.single_note_plan?.slides),
    visualDirection: visual?.visual_direction || {},
    renderContract: contractRender,
    canvas: deps.CANVAS,
  });
  const visualDirection = visual?.visual_direction || {};
  const renderPlan = {
    render_strategy: deps.safeText(contractRender.render_strategy, 'prompt_director_first'),
    shell_file: deps.resolvePromptPackAsset(contract, deps.safeText(contractRender.shell_file, 'render_shell.html')),
    compiler_module: deps.resolvePromptPackAsset(contract, deps.safeText(contractRender.compiler_module, 'render_pack.js')),
    director_contract: {
      visual_motif: deps.safeText(visualDirection.visual_motif),
      peak_pages: deps.safeArray(visualDirection.peak_pages),
      page_family_ceiling: visualDirection.page_family_ceiling || {},
      anti_template_constraints: deps.safeArray(visualDirection.anti_template_constraints),
      source_language_discipline: deps.safeText(visualDirection.source_language_discipline),
    },
    slides: slides.map((slide) => ({
      slide_id: slide.slide_id,
      title: slide.title,
      layout_family: slide.layout_family,
      recipe_id: slide.recipe_id,
      peak_page: slide.director_contract.peak_page,
      director_role: slide.director_contract.page_role,
    })),
  };
  const htmlFile = deps.path.join(deliverablePaths.viewsDir, `${deliverablePaths.deliverableId}.html`);
  const shellText = deps.readPromptPackText(renderPlan.shell_file);
  deps.writeText(htmlFile, buildHtml({
    title: contract.title,
    slides,
    renderPlan,
    renderStrategy: renderPlan.render_strategy,
    shellText,
  }));
  return {
    ...deps.attachCommon('render_html', contract),
    html_bundle: {
      html_file: htmlFile,
      page_count: slides.length,
      shell_contract: deps.CANVAS,
      render_strategy: renderPlan.render_strategy,
      director_contract: renderPlan.director_contract,
      slides,
    },
    artifact_refs: [htmlFile],
  };
}
import { loadRenderPackCompiler } from '@redcube/pack-runtime';

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

function buildHtml({ title, slides, renderPlan, renderStrategy, shellText }) {
  const slidesLiteral = `[\n${slides.map((slide) => `  { slideId: '${slide.slide_id}', title: ${JSON.stringify(slide.title)}, recipeId: '${slide.recipe_id}', content: \`${escapeTemplate(slide.content)}\` }`).join(',\n')}\n]`;
  return shellText
    .replaceAll('__REDCUBE_TITLE__', escapeHtml(title))
    .replaceAll('__REDCUBE_RENDER_STRATEGY__', escapeHtml(renderStrategy.replaceAll('_', '-')))
    .replaceAll('__REDCUBE_RENDER_PLAN__', escapeHtml(JSON.stringify(renderPlan)))
    .replaceAll('__REDCUBE_SLIDES_DATA__', slidesLiteral);
}
