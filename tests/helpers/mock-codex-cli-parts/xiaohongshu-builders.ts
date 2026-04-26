// @ts-nocheck
import { recordParallelOverlap, readySources, safeArray, safeText, topicFocus } from './shared.ts';

function sourceMaterialClaim(meta) {
  const text = safeArray(meta?.context?.source_materials_full_text)
    .map((material) => safeText(material?.content_text))
    .filter(Boolean)
    .join('\n');
  const line = text
    .split(/\n+/)
    .map((item) => safeText(item))
    .find((item) => item.length > 0 && !item.startsWith('#'));
  return line || '';
}

export function buildMockXhsStoryline(meta) {
  const context = meta?.context || {};
  if (process.env.REDCUBE_MOCK_XHS_REQUIRE_AI_FIRST_FRAMING === '1') {
    const forbiddenSeeds = ['audience_seed', 'tension_seed', 'why_now_seed', 'memory_hook_seed']
      .filter((key) => Object.hasOwn(context, key));
    if (forbiddenSeeds.length > 0) {
      throw new Error(`mock xhs expected AI-first framing without programmatic seeds: ${forbiddenSeeds.join(', ')}`);
    }
    const framing = context.ai_first_framing_contract || context.framing || {};
    if (safeText(framing.source_input) !== 'source_materials_full_text'
      || safeText(framing.binding) !== 'ai_authored_required') {
      throw new Error(`mock xhs expected AI-first framing contract: ${JSON.stringify(framing)}`);
    }
  }
  const sourceClaim = sourceMaterialClaim(meta);
  return {
    mode: safeText(context.mode, 'single'),
    audience_judgement: sourceClaim || 'AI 基于完整资料判断读者最关心的顺序与动作',
    tension: sourceClaim ? `这份材料的核心冲突是：${sourceClaim}` : 'AI 基于完整资料提炼当前最需要解释的认知冲突',
    why_now: sourceClaim ? `现在要先讲清：${sourceClaim}` : 'AI 基于完整资料判断为什么现在需要讲清',
    memory_hook: sourceClaim || '先读完整资料，再压成一句能带走的判断',
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

export function buildMockXhsPlan(meta) {
  const title = safeText(meta?.context?.title) || '未命名笔记';
  const memoryHook = safeText(meta?.context?.storyline?.memory_hook, '先别急着上工具，先把顺序做对');
  const whyNow = safeText(meta?.context?.storyline?.why_now, '信息越多，越要先做判断顺序');
  const sourceClaim = sourceMaterialClaim(meta);
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
        page_core_content: [sourceClaim || '很多人其实不是不知道，而是一开始就抓错重点', `记忆钩子：${memoryHook}`, `这篇要帮你讲清：${title} 的正确顺序`],
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

export function buildMockXhsVisualDirection(meta) {
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
    visual_anchor_system: {
      preferred_library: 'Font Awesome Free',
      secondary_library_for_xiaohongshu: 'emoji',
      consistency_rule: '同一页、同一组锚点保持统一语法，优先完整语义图标；短词 badge 只能做辅助标签',
      required_peak_page_anchor: '封面、机制峰值页和结尾页至少提供一个语义明确的 Font Awesome Free 图标锚点；emoji 只做补充',
      forbidden_patterns: [
        '孤立单字贴纸',
        '单个汉字或字母被当作唯一视觉锚点',
        '和正文无关的随机装饰符号',
      ],
    },
    signature_exposure_grammar: {
      cover_note: '封面署名固定在底部稳定角标区，远离主标题与主链卡。',
      closing_page: '结尾页把署名显示与品牌副标压在页脚稳定区，和收藏条保持独立间距。',
      continuity_rule: '同一 deliverable 的署名显示与副标保持完全一致。',
    },
    forbidden_regressions: [
      '白底卡片网格页',
      '统一安全科技卡片页',
      '历史成品拼装',
      '有高亮无结构、像装饰页',
    ],
  };
}

export function buildXhsSlideMarkup(slide, totalSlides, peakPage = false, authorBranding = null) {
  const accent = peakPage ? '#DC2626' : '#2563EB';
  const signatureDisplay = safeText(authorBranding?.signature_display);
  const signatureSubtitle = safeText(authorBranding?.signature_subtitle);
  const showBranding = Boolean(signatureDisplay) && (Number(slide.slide_no) === 1 || Number(slide.slide_no) === totalSlides);
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
      ${showBranding ? `<div data-qa-block="author-branding" style="position:absolute;right:20px;bottom:56px;max-width:156px;padding:6px 8px;border-radius:12px;background:rgba(255,255,255,0.92);border:1px solid rgba(15,23,42,0.08);box-shadow:0 8px 18px rgba(15,23,42,0.06);text-align:right;"><div style="font-size:11px;line-height:1.25;color:${accent};font-weight:800;">${signatureDisplay}</div><div style="margin-top:2px;font-size:10px;line-height:1.25;color:#64748B;">${signatureSubtitle}</div></div>` : ''}
      <footer data-qa-block="footer" style="display:flex;justify-content:space-between;align-items:center;font-size:12px;color:#475569;">
        <div>${safeText(slide.source_language)}</div>
        <div style="font-weight:700;">${slide.slide_no} / ${totalSlides}</div>
      </footer>
    </div>
  `.trim();
}

export function buildMockXhsRender(meta) {
  const slides = safeArray(meta?.context?.plan?.slides);
  const peakPages = new Set(safeArray(meta?.context?.visual_direction?.peak_pages));
  const authorBranding = meta?.context?.author_branding || null;
  const route = safeText(meta?.route);
  const renderVariants = new Set(
    safeText(process.env.REDCUBE_MOCK_XHS_RENDER_VARIANT)
      .split(',')
      .map((item) => safeText(item))
      .filter(Boolean),
  );
  const targetSlideIds = new Set(
    safeArray(meta?.context?.repair_scope?.target_slide_ids)
      .map((item) => safeText(item))
      .filter(Boolean),
  );
  if (renderVariants.has('require_operator_revision_context') && route === 'fix_html') {
    const operatorTargetSlideIds = safeArray(meta?.context?.revision_context?.operator_revision_brief?.target_slide_ids)
      .map((item) => safeText(item))
      .filter(Boolean);
    const operatorSlideFeedbackIds = safeArray(meta?.context?.revision_context?.operator_revision_brief?.slide_feedback)
      .map((item) => safeText(item?.slide_id))
      .filter(Boolean);
    if (!operatorTargetSlideIds.includes('N06') || !operatorSlideFeedbackIds.includes('N06')) {
      throw new Error(`mock xhs render expected operator_revision_brief for N06: ${JSON.stringify(meta?.context?.revision_context || {})}`);
    }
    const slideIds = slides.map((slide) => safeText(slide?.slide_id)).filter(Boolean);
    if (slideIds.length !== 1 || slideIds[0] !== 'N06') {
      throw new Error(`mock xhs render expected fix_html to scope only operator-targeted slide N06: ${JSON.stringify(slideIds)}`);
    }
  }
  const payload = {
    slides: slides.map((slide, index) => ({
      slide_id: slide.slide_id,
      content_html: (() => {
        let markup = buildXhsSlideMarkup(
          { ...slide, slide_no: index + 1 },
          slides.length,
          peakPages.has(slide.slide_id),
          authorBranding,
        );
        if (renderVariants.has('repair_marker')) {
          const slideId = safeText(slide?.slide_id);
          const shouldStayBlocked = slideId === 'N02' && !targetSlideIds.has('N02');
          const marker = shouldStayBlocked ? 'blocked' : 'fixed';
          markup = markup.replace('data-slide-root="true"', `data-slide-root="true" data-mock-fit="${marker}"`);
        }
        if (renderVariants.has('repair_marker_extra_weak')) {
          const slideId = safeText(slide?.slide_id);
          if (slideId === 'N02') {
            const marker = targetSlideIds.has('N02') ? 'fixed' : 'blocked';
            markup = markup.replace('data-slide-root="true"', `data-slide-root="true" data-mock-fit="${marker}"`);
          }
          if (slideId === 'N04') {
            const marker = targetSlideIds.has('N04') ? 'fixed' : 'weak';
            markup = markup.replace('data-slide-root="true"', `data-slide-root="true" data-mock-fit="${marker}"`);
          }
        }
        return markup;
      })(),
    })),
    render_summary: [
      '每页都由上游 AI 直接写出完整卡片式 HTML。',
      '封面、机制页、证据页保持明显结构差异，没有退化成统一模板。',
    ],
  };
  if (renderVariants.has('omit_render_summary_on_fix') && route === 'fix_html') {
    delete payload.render_summary;
  }
  return payload;
}

export function buildMockXhsDirectorReview() {
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

export function buildMockXhsScreenshotReview(meta) {
  const slides = safeArray(meta?.context?.screenshot_mechanics?.slides);
  const variants = new Set(
    safeText(process.env.REDCUBE_MOCK_XHS_SCREENSHOT_REVIEW_VARIANT)
      .split(',')
      .map((item) => safeText(item))
      .filter(Boolean),
  );
  if (variants.has('require_source_html')) {
    for (const slide of slides) {
      const sourceHtml = safeText(slide?.source_html);
      if (!sourceHtml.includes('data-slide-root') || !sourceHtml.includes(safeText(slide?.slide_id))) {
        throw new Error(`mock xhs screenshot review expected source_html for ${safeText(slide?.slide_id)}`);
      }
    }
  }
  if (variants.has('require_incremental_single_N02')) {
    const slideIds = slides.map((slide) => safeText(slide?.slide_id)).filter(Boolean);
    if (slideIds.length !== 1 || slideIds[0] !== 'N02') {
      throw new Error(`mock xhs screenshot review expected page-local review for N02 only: ${JSON.stringify(slideIds)}`);
    }
    const sourceHtml = safeText(slides[0]?.source_html);
    if (!sourceHtml.includes('data-slide-root') || !sourceHtml.includes('data-slide-id="N02"')) {
      throw new Error(`mock xhs screenshot review expected local source_html for N02: ${sourceHtml.slice(0, 160)}`);
    }
    return {
      director_intent_landed: true,
      anti_template_ok: true,
      weak_pages: [],
      review_summary: 'N02 局部复核已通过，其余卡片沿用上一轮通过结果。',
      slide_reviews: [
        {
          slide_id: 'N02',
          judgement: 'pass',
          visual_findings: ['N02 的截图与本页 HTML 已局部对齐。'],
          recommended_fix: 'none',
        },
      ],
    };
  }
  if (variants.has('block_until_fix_html')) {
    const blockedSlideId = safeText(
      slides.find((slide) => safeText(slide?.source_html).includes('data-mock-fit="blocked"'))?.slide_id,
      '',
    );
    return {
      director_intent_landed: true,
      anti_template_ok: true,
      weak_pages: blockedSlideId ? [blockedSlideId] : [],
      review_summary: blockedSlideId ? `${blockedSlideId} 仍需 fix_html 后再放行。` : '局部修页已完成，可以继续发布流程。',
      slide_reviews: slides.map((slide) => ({
        slide_id: safeText(slide?.slide_id),
        judgement: safeText(slide?.slide_id) === blockedSlideId ? 'block' : 'pass',
        visual_findings: safeText(slide?.slide_id) === blockedSlideId
          ? ['当前卡片保留了待修标记，系统应回到 fix_html 处理后再复核。']
          : ['当前卡片已达到继续推进的截图质量。'],
        recommended_fix: safeText(slide?.slide_id) === blockedSlideId ? '执行 fix_html 并重跑 screenshot_review。' : 'none',
      })),
    };
  }
  if (variants.has('block_with_extra_weak_page')) {
    const blockedSlideId = safeText(
      slides.find((slide) => safeText(slide?.source_html).includes('data-mock-fit="blocked"'))?.slide_id,
      'N02',
    );
    return {
      director_intent_landed: true,
      anti_template_ok: true,
      weak_pages: [blockedSlideId, 'N04'],
      review_summary: `${blockedSlideId} 是硬阻断页，N04 虽然还能看，但也属于应一起修掉的弱页。`,
      slide_reviews: slides.map((slide) => ({
        slide_id: safeText(slide?.slide_id),
        judgement: safeText(slide?.slide_id) === blockedSlideId ? 'block' : 'pass',
        visual_findings: safeText(slide?.slide_id) === blockedSlideId
          ? ['当前卡片是截图硬阻断页。']
          : safeText(slide?.slide_id) === 'N04'
            ? ['当前卡片属于弱页，建议和硬阻断页同轮一起修。']
            : ['当前卡片已达到继续推进的截图质量。'],
        recommended_fix: safeText(slide?.slide_id) === blockedSlideId || safeText(slide?.slide_id) === 'N04'
          ? 'fix_html 需一并处理当前卡片。'
          : 'none',
      })),
    };
  }
  if (variants.has('local_block_with_director_soft_false')) {
    return {
      director_intent_landed: false,
      anti_template_ok: true,
      weak_pages: ['N04'],
      review_summary: '整体导演意图大体成立，但 N04 的局部遮挡让机制峰值页失去完整落地，需要继续 fix_html。',
      slide_reviews: slides.map((slide) => ({
        slide_id: safeText(slide?.slide_id),
        judgement: safeText(slide?.slide_id) === 'N04' ? 'block' : 'pass',
        visual_findings: safeText(slide?.slide_id) === 'N04'
          ? ['当前局部遮挡集中在 N04，适合继续走 fix_html 局部返修。']
          : ['当前卡片已经达到继续推进的截图质量。'],
        recommended_fix: safeText(slide?.slide_id) === 'N04'
          ? 'fix_html 只修当前卡片，不要回退整套重画。'
          : 'none',
      })),
    };
  }
  const weakPages = variants.has('many_weak_pages')
    ? slides.map((slide) => safeText(slide?.slide_id)).filter(Boolean)
    : [];
  return {
    director_intent_landed: true,
    anti_template_ok: true,
    weak_pages: weakPages,
    review_summary: '封面抓停、机制推进和结尾动作都已经在最终卡片截图里成立。',
    slide_reviews: slides.map((slide) => ({
      slide_id: safeText(slide?.slide_id),
      judgement: 'pass',
      visual_findings: ['首眼信息明确，手机端阅读节奏顺畅，卡片没有退化成统一模板。'],
      recommended_fix: 'none',
    })),
  };
}

export function buildMockXhsPublishCopy(meta) {
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
