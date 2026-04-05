function safeText(value, fallback = '') {
  const text = String(value || '').trim();
  return text || fallback;
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function escapeHtml(text) {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function sourceRail(sources) {
  return `<div data-qa-block="sources" style="display:flex;gap:8px;flex-wrap:wrap;">${sources.map((source) => `<span data-source-label="true" style="display:inline-flex;padding:6px 10px;border-radius:999px;background:rgba(15,23,42,0.08);font-size:12px;color:#0F172A;">${escapeHtml(source.public_label)}</span>`).join('')}</div>`;
}

function pickRecipeId(slide, renderContract) {
  const registry = renderContract?.recipe_registry || {};
  return registry[slide.visual_presentation.layout_family] || registry.default || `ppt.${slide.visual_presentation.layout_family}`;
}

function renderSlideMarkup(slide, canvas) {
  const palette = slide.palette;
  const points = slide.page_core_content.slice(1);
  const peakBadge = slide.director_contract.peak_page ? `<span style="display:inline-flex;padding:4px 8px;border-radius:999px;background:rgba(37,99,235,0.12);color:${palette.accent};font-size:11px;font-weight:800;">PEAK</span>` : '';
  const footer = `<div data-qa-block="footer" style="position:absolute;left:48px;right:48px;bottom:24px;display:flex;justify-content:space-between;align-items:center;font-size:14px;color:#475569;"><div>${sourceRail(slide.evidence_and_sources)}</div><div style="font-weight:700;">${String(slide.slide_no).padStart(2, '0')} / ${String(slide.total_slides).padStart(2, '0')}</div></div>`;
  const header = `<header data-qa-block="header" style="display:grid;gap:8px;"><div style="display:flex;align-items:center;gap:10px;"><div style="font-size:14px;letter-spacing:0.08em;text-transform:uppercase;font-weight:800;color:${palette.accent};">${escapeHtml(slide.page_goal)}</div>${peakBadge}</div><h2 style="margin:0;font-size:${slide.director_contract.peak_page ? '44px' : '40px'};line-height:1.15;color:${palette.ink};">${escapeHtml(slide.title)}</h2><p style="margin:0;font-size:22px;line-height:1.55;color:#334155;max-width:760px;">${escapeHtml(slide.page_core_content[0]?.text || '')}</p><div style="font-size:13px;line-height:1.5;color:#64748B;">${escapeHtml(slide.director_contract.visual_manifest)}</div></header>`;
  const rootStart = `<div data-slide-root="true" data-slide-id="${slide.slide_id}" data-title="${escapeHtml(slide.title)}" data-speaker-seconds="${slide.speaker_seconds}" data-layout-family="${slide.layout_family}" data-recipe-id="${slide.recipe_id}" data-peak-page="${String(slide.director_contract.peak_page)}" style="position:relative;width:${canvas.width}px;height:${canvas.height}px;background:${palette.canvas};overflow:hidden;padding:44px 52px 56px;">`;

  if (slide.recipe_id === 'ppt.timeline_rail') {
    return `${rootStart}<div class="deck-slide" style="display:grid;grid-template-rows:auto 1fr;gap:24px;height:100%;">${header}<div data-qa-block="timeline" style="display:grid;grid-template-columns:repeat(${points.length},1fr);gap:16px;align-items:end;">${points.map((point, index) => `<section data-qa-block="timeline-card" style="display:grid;gap:12px;"><div style="width:22px;height:22px;border-radius:999px;background:${palette.accent};box-shadow:0 0 0 10px rgba(37,99,235,0.12);"></div><div style="padding:18px;border-radius:22px;background:#FFFFFF;border:1px solid #CBD5E1;min-height:220px;"><div style="font-size:17px;font-weight:800;color:${palette.accent};margin-bottom:8px;">Step ${index + 1}</div><div style="font-size:22px;line-height:1.45;color:${palette.ink};">${escapeHtml(point.text)}</div></div></section>`).join('')}</div></div>${footer}</div>`;
  }
  if (slide.recipe_id === 'ppt.judgement_ladder') {
    return `${rootStart}<div class="deck-slide" style="display:grid;grid-template-rows:auto 1fr;gap:20px;height:100%;">${header}<div data-qa-block="ladder" style="display:grid;gap:14px;">${points.map((point, index) => `<div data-qa-block="ladder-row" data-primary-point="true" style="display:grid;grid-template-columns:72px 1fr;gap:12px;align-items:stretch;"><div style="border-radius:18px;background:${palette.accent};color:#FFFFFF;font-size:26px;font-weight:800;display:flex;align-items:center;justify-content:center;">${index + 1}</div><div style="padding:16px 18px;border-radius:18px;background:#FFFFFF;border:1px solid #CBD5E1;display:flex;align-items:center;font-size:22px;line-height:1.45;color:${palette.ink};">${escapeHtml(point.text)}</div></div>`).join('')}</div></div>${footer}</div>`;
  }
  if (slide.recipe_id === 'ppt.ring_cross') {
    const center = points[0]?.text || slide.page_goal;
    return `${rootStart}<div class="deck-slide" style="display:grid;grid-template-rows:auto 1fr;gap:20px;height:100%;">${header}<div data-qa-block="cross" style="position:relative;min-height:360px;"><div data-qa-block="hub" style="position:absolute;left:50%;top:50%;transform:translate(-50%, -50%);width:260px;min-height:140px;border-radius:28px;background:linear-gradient(135deg, rgba(37,99,235,0.16), #FFFFFF);border:1px solid rgba(37,99,235,0.22);display:grid;place-items:center;text-align:center;padding:28px;font-size:24px;font-weight:800;color:${palette.ink};">${escapeHtml(center)}</div><div data-qa-block="north" style="position:absolute;left:50%;top:0;transform:translateX(-50%);width:250px;min-height:98px;padding:16px;border-radius:22px;background:#FFFFFF;border:1px solid #CBD5E1;display:grid;place-items:center;text-align:center;font-size:22px;font-weight:700;color:${palette.ink};">${escapeHtml(points[1]?.text || '')}</div><div data-qa-block="east" style="position:absolute;right:0;top:50%;transform:translateY(-50%);width:250px;min-height:98px;padding:16px;border-radius:22px;background:#FFFFFF;border:1px solid #CBD5E1;display:grid;place-items:center;text-align:center;font-size:22px;font-weight:700;color:${palette.ink};">${escapeHtml(points[2]?.text || '')}</div><div data-qa-block="south" style="position:absolute;left:50%;bottom:0;transform:translateX(-50%);width:250px;min-height:98px;padding:16px;border-radius:22px;background:#FFFFFF;border:1px solid #CBD5E1;display:grid;place-items:center;text-align:center;font-size:22px;font-weight:700;color:${palette.ink};">${escapeHtml(points[3]?.text || slide.transition_sentence)}</div><div data-qa-block="west" style="position:absolute;left:0;top:50%;transform:translateY(-50%);width:250px;min-height:98px;padding:16px;border-radius:22px;background:#FFFFFF;border:1px solid #CBD5E1;display:grid;place-items:center;text-align:center;font-size:22px;font-weight:700;color:${palette.ink};">${escapeHtml(slide.transition_sentence)}</div></div></div>${footer}</div>`;
  }
  if (slide.recipe_id === 'ppt.central_axis') {
    return `${rootStart}<div class="deck-slide" style="display:grid;grid-template-rows:auto 1fr;gap:20px;height:100%;">${header}<div data-qa-block="axis" style="position:relative;display:grid;grid-template-columns:repeat(${points.length},1fr);gap:18px;align-items:center;"><div style="position:absolute;left:40px;right:40px;top:50%;height:6px;border-radius:999px;background:linear-gradient(90deg, rgba(37,99,235,0.2), rgba(37,99,235,0.65));"></div>${points.map((point, index) => `<section data-qa-block="axis-card" data-primary-point="true" style="position:relative;display:grid;gap:10px;justify-items:center;"><div style="width:56px;height:56px;border-radius:999px;background:${palette.accent};color:#FFFFFF;display:flex;align-items:center;justify-content:center;font-weight:800;box-shadow:0 10px 24px rgba(37,99,235,0.25);">${index + 1}</div><div style="padding:16px 16px 18px;min-height:170px;border-radius:22px;background:#FFFFFF;border:1px solid #CBD5E1;display:grid;gap:8px;"><div style="font-size:17px;font-weight:800;color:${palette.accent};">轴线 ${index + 1}</div><div style="font-size:22px;line-height:1.45;color:${palette.ink};">${escapeHtml(point.text)}</div></div></section>`).join('')}</div></div>${footer}</div>`;
  }
  if (slide.recipe_id === 'ppt.summary_peak') {
    return `${rootStart}<div class="deck-slide" style="display:grid;grid-template-rows:auto 1fr;gap:20px;height:100%;">${header}<div data-qa-block="summary" style="display:grid;grid-template-columns:repeat(2,1fr);gap:18px;align-items:stretch;">${points.map((point, index) => `<section data-qa-block="summary-card" data-primary-point="true" style="padding:20px;border-radius:22px;background:#FFFFFF;border:1px solid #CBD5E1;display:grid;gap:10px;"><div style="font-size:13px;font-weight:800;letter-spacing:0.06em;text-transform:uppercase;color:${palette.accent};">带走 ${index + 1}</div><div style="font-size:24px;line-height:1.45;color:${palette.ink};">${escapeHtml(point.text)}</div></section>`).join('')}</div></div>${footer}</div>`;
  }
  return `${rootStart}<div class="deck-slide" style="display:grid;grid-template-rows:auto 1fr;gap:20px;height:100%;">${header}<div data-qa-block="zones" style="display:grid;grid-template-columns:repeat(${Math.max(points.length, 2)},1fr);gap:18px;align-items:stretch;">${points.map((point, index) => `<section data-qa-block="zone-card" data-primary-point="true" style="padding:20px;border-radius:24px;background:#FFFFFF;border:1px solid #CBD5E1;display:grid;gap:10px;"><div style="font-size:13px;font-weight:800;letter-spacing:0.06em;text-transform:uppercase;color:${palette.accent};">展开 ${index + 1}</div><div style="font-size:24px;line-height:1.45;color:${palette.ink};">${escapeHtml(point.text)}</div></section>`).join('')}</div></div>${footer}</div>`;
}

export function compileRenderSlides({ slides, visualDirection, renderContract, canvas }) {
  return safeArray(slides).map((slide) => {
    const compiled = {
      slide_id: slide.slide_id,
      slide_no: slide.slide_no,
      title: slide.title,
      layout_family: slide.visual_presentation.layout_family,
      recipe_id: pickRecipeId(slide, renderContract),
      page_goal: slide.page_goal,
      page_core_content: safeArray(slide.page_core_content),
      evidence_and_sources: safeArray(slide.evidence_and_sources),
      speaker_seconds: slide.speaker_seconds,
      transition_sentence: slide.transition_sentence,
      director_contract: {
        peak_page: safeArray(visualDirection.peak_pages).includes(slide.slide_id),
        director_role: safeArray(visualDirection.page_role_table).find((item) => item.slide_id === slide.slide_id)?.page_role || slide.visual_presentation.layout_family,
        generator_instructions: safeArray(visualDirection.final_instruction_to_html_generator),
        page_family_ceiling: visualDirection.page_family_ceiling || {},
        visual_manifest: safeText(visualDirection.visual_manifest),
      },
      palette: visualDirection.palette,
      total_slides: safeArray(slides).length,
    };
    compiled.content = renderSlideMarkup(compiled, canvas);
    return compiled;
  });
}
