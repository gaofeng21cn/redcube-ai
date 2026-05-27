// @ts-nocheck
import { recordParallelOverlap, safeArray, safeText } from '../shared.ts';

export function buildMockPptDirectorReview(meta) {
  const slides = safeArray(meta?.context?.render_summary);
  const reviewScope = safeText(meta?.context?.review_scope, 'full_deck_review');
  const variants = new Set(
    safeText(process.env.REDCUBE_MOCK_PPT_DIRECTOR_REVIEW_VARIANT)
      .split(',')
      .map((item) => safeText(item))
      .filter(Boolean),
  );
  if (variants.has('block_author_image_pages_until_repair')
    && slides.some((slide) => safeText(slide?.png_file).includes('author_image_pages'))
    && !slides.some((slide) => safeText(slide?.png_file).includes('repair_image_pages'))) {
    const blockedSlideId = safeText(slides[0]?.slide_id, 'S01');
    return {
      director_intent_landed: false,
      anti_template_ok: false,
      peak_pages_landed: false,
      memory_hook_present: true,
      homogeneous_layout_risk: 0.74,
      weak_pages: [blockedSlideId],
      review_summary: `${blockedSlideId} 仍像模板化信息图，导演意图和反模板要求没有充分落到画面。`,
      rewrite_action: 'repair_image_pages',
    };
  }
  if (variants.has('block_author_pptx_native_until_repair')
    && slides.some((slide) => safeText(slide?.source_pptx).includes('author_pptx_native'))
    && !slides.some((slide) => safeText(slide?.source_pptx).includes('repair_pptx_native'))) {
    const blockedSlideId = safeText(slides[0]?.slide_id, 'S01');
    return {
      director_intent_landed: false,
      anti_template_ok: false,
      peak_pages_landed: false,
      memory_hook_present: true,
      homogeneous_layout_risk: 0.78,
      weak_pages: [blockedSlideId],
      review_summary: `${blockedSlideId} 原生 PPTX 仍有模板化和结构节奏问题，必须先进入截图质控再回修。`,
      rewrite_action: 'repair_pptx_native',
    };
  }
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
