import { readySources, safeArray, safeText, topicFocus } from './shared.js';

export function buildMockPosterStoryline(meta) {
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

export function buildMockPosterBlueprint(meta) {
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

export function buildMockPosterVisualDirection() {
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

export function buildMockPosterRender(meta) {
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

export function buildMockPosterDirectorReview() {
  const forceBlock = safeText(process.env.REDCUBE_MOCK_POSTER_REVIEW_VARIANT)
    .split(',')
    .map((item) => safeText(item))
    .includes('force_director_block');
  return {
    director_intent_landed: true,
    anti_template_ok: true,
    message_hierarchy_clear: !forceBlock,
    evidence_trace_clear: true,
    weak_regions: forceBlock ? ['action_footer'] : [],
    rewrite_action: forceBlock ? 'revise_render_html' : 'none',
    review_summary: forceBlock
      ? '动作收束仍可改进，但当前海报可继续进入截图审阅。'
      : 'headline、证据与动作层级成立，可进入 screenshot_review。',
  };
}

export function buildMockPosterScreenshotReview(meta) {
  const slides = safeArray(meta?.context?.screenshot_mechanics?.slides);
  const variants = new Set(
    safeText(process.env.REDCUBE_MOCK_POSTER_SCREENSHOT_REVIEW_VARIANT)
      .split(',')
      .map((item) => safeText(item))
      .filter(Boolean),
  );
  if (variants.has('require_source_html')) {
    for (const slide of slides) {
      const sourceHtml = safeText(slide?.source_html);
      if (!sourceHtml.includes('data-slide-root') || !sourceHtml.includes(safeText(slide?.slide_id))) {
        throw new Error(`mock poster screenshot review expected source_html for ${safeText(slide?.slide_id)}`);
      }
    }
  }
  const forceBlock = variants.has('force_block');
  return {
    director_intent_landed: true,
    anti_template_ok: true,
    message_hierarchy_clear: !forceBlock,
    weak_regions: forceBlock ? ['P01'] : [],
    review_summary: forceBlock
      ? '最终截图可交付，但动作区层级仍需后续优化。'
      : '单页海报的 headline、证据栏和动作收束都在最终截图里成立。',
    slide_reviews: slides.map((slide) => ({
      slide_id: safeText(slide?.slide_id),
      judgement: forceBlock ? 'block' : 'pass',
      visual_findings: [forceBlock ? '动作区层级仍需优化。' : '主标题抓手明确，证据和动作路径连续。'],
      recommended_fix: forceBlock ? 'revise_render_html' : 'none',
    })),
  };
}
