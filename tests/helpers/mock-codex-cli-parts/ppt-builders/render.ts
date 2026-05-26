// @ts-nocheck
import { recordParallelOverlap, safeArray, safeText } from '../shared.ts';

function contentText(item) {
  if (item && typeof item === 'object') {
    return safeText(item.text || item.title || item.summary || item.label || item.value || item.core_sentence);
  }
  return safeText(item);
}

export function buildPptSlideMarkup(slide, totalSlides, peakPage = false) {
  const pageGoal = safeText(slide.page_goal).replace(/\s+/g, ' ').slice(0, 22);
  const title = safeText(slide.title).replace(/\s+/g, ' ').slice(0, 26);
  const coreSentence = safeText(slide.core_sentence).replace(/\s+/g, ' ').slice(0, 54);
  const sourceLabel = safeText(safeArray(slide.public_sources || []).at(0), '公开来源');
  const normalizedTotalSlides = Number(totalSlides || slide.total_slides || slide.deck_slide_count || slide.slide_no || 0);
  const renderVariants = new Set(
    safeText(process.env.REDCUBE_MOCK_PPT_RENDER_VARIANT)
      .split(',')
      .map((item) => safeText(item))
      .filter(Boolean),
  );
  const driftPageNumber = renderVariants.has('drift_page_number_s05') && safeText(slide.slide_id) === 'S05';
  const pageNumberText = driftPageNumber
    ? String(slide.slide_no).padStart(2, '0')
    : `${String(slide.slide_no).padStart(2, '0')} / ${String(normalizedTotalSlides).padStart(2, '0')}`;
  const pageNumberStyle = driftPageNumber
    ? 'font-weight:700;font-size:20px;color:#111827;transform:translateX(-42px);'
    : 'font-weight:700;font-size:14px;color:#475569;';
  const cards = safeArray(slide.page_core_content)
    .slice(0, 2)
    .map((item, index) => `
      <article data-qa-block="card-${index + 1}" data-primary-point="${index === 0 ? 'true' : 'false'}" style="padding:14px 16px;border-radius:18px;background:${index === 0 ? 'rgba(37,99,235,0.12)' : '#FFFFFF'};border:1px solid #CBD5E1;font-size:${index === 0 ? '22px' : '18px'};line-height:1.45;color:#0F172A;">${contentText(item).replace(/\s+/g, ' ').slice(0, 40)}</article>
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
  const deckSlideCount = Number(meta?.context?.deck_slide_count || meta?.context?.total_slides || Math.max(
    slides.length,
    ...slides.map((slide) => Number(slide?.slide_no || 0)),
  ));
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
            content_html: buildPptSlideMarkup(slide, deckSlideCount, peakPages.has(slide.slide_id)),
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
        const markup = buildPptSlideMarkup(slide, deckSlideCount, peakPages.has(slide.slide_id));
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
