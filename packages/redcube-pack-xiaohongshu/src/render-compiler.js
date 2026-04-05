function safeText(value, fallback = '') {
  const text = String(value || '').trim();
  return text || fallback;
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function escapeHtml(text) {
  return String(text || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function renderCard(text, accent) {
  return `<div data-qa-block="card" data-primary-point="true" style="padding:16px;border-radius:20px;background:#FFFFFF;border:1px solid rgba(15,23,42,0.08);box-shadow:0 8px 18px rgba(15,23,42,0.05);"><div style="font-size:20px;line-height:1.5;color:#0F172A;">${escapeHtml(text)}</div><div style="margin-top:10px;width:52px;height:4px;border-radius:999px;background:${accent};"></div></div>`;
}

function pickRecipeId(slide, renderContract) {
  const registry = renderContract?.recipe_registry || {};
  return registry[slide.layout_family] || registry.default || `xhs.${slide.layout_family}`;
}

function renderSlideMarkup(slide, canvas) {
  const accent = slide.director_contract.material_rules.main_accent;
  const warning = slide.director_contract.material_rules.warning_accent;
  const paperBase = slide.director_contract.peak_page ? '#FFF7ED' : '#F8FAFC';
  const roleLabel = slide.director_contract.page_role || slide.page_goal;
  const header = `<header data-qa-block="header" style="display:grid;gap:8px;"><div style="display:flex;align-items:center;gap:8px;"><div style="font-size:14px;font-weight:800;color:${accent};letter-spacing:0.06em;text-transform:uppercase;">${escapeHtml(roleLabel)}</div>${slide.director_contract.peak_page ? `<span style="display:inline-flex;padding:4px 8px;border-radius:999px;background:rgba(220,38,38,0.12);color:${warning};font-size:11px;font-weight:800;">峰值页</span>` : ''}</div><h2 style="margin:0;font-size:26px;line-height:1.22;color:#0F172A;">${escapeHtml(slide.title)}</h2><div style="font-size:11px;line-height:1.45;color:#64748B;">${escapeHtml(slide.director_contract.visual_motif)}</div></header>`;
  const footer = `<footer style="position:absolute;left:20px;right:20px;bottom:16px;display:flex;justify-content:space-between;align-items:center;font-size:12px;color:#475569;"><div data-source-label="true">${escapeHtml(slide.evidence_and_sources[0]?.public_label || '')}</div><div>${slide.slide_no} / ${slide.total_slides}</div></footer>`;
  const rootStart = `<div data-slide-root="true" data-slide-id="${slide.slide_id}" data-title="${escapeHtml(slide.title)}" data-layout-family="${slide.layout_family}" data-recipe-id="${slide.recipe_id}" data-peak-page="${String(slide.director_contract.peak_page)}" data-director-role="${escapeHtml(slide.director_contract.page_role || '')}" data-speaker-seconds="${slide.speaker_seconds}" style="position:relative;width:${canvas.width}px;height:${canvas.height}px;background:${paperBase};overflow:hidden;padding:20px 20px 44px;">`;

  if (slide.recipe_id === 'xhs.hero_note') {
    return `${rootStart}<div style="position:absolute;inset:0;background:linear-gradient(180deg, rgba(255,255,255,0.55), rgba(255,255,255,0));"></div><div style="position:relative;display:grid;gap:18px;height:100%;align-content:start;">${header}<div data-qa-block="hero" style="padding:20px 18px;border-radius:24px;background:#FFFFFF;border:1px solid rgba(15,23,42,0.08);font-size:22px;line-height:1.55;font-weight:700;color:#0F172A;">${escapeHtml(slide.page_core_content[0])}</div><div style="display:grid;gap:14px;">${slide.page_core_content.slice(1).map((item) => renderCard(item, accent)).join('')}</div></div>${footer}</div>`;
  }
  if (slide.recipe_id === 'xhs.split_contrast') {
    return `${rootStart}<div style="display:grid;grid-template-rows:auto 1fr;height:100%;gap:14px;">${header}<div style="display:grid;gap:10px;align-content:start;"><section data-qa-block="myth" data-primary-point="true" style="padding:14px;border-radius:20px;background:rgba(220,38,38,0.09);border:1px solid rgba(220,38,38,0.18);display:grid;gap:8px;"><div style="font-size:11px;font-weight:800;letter-spacing:0.06em;text-transform:uppercase;color:${warning};">不要先做</div><div style="font-size:17px;line-height:1.45;color:#0F172A;">${escapeHtml(slide.page_core_content[0] || '')}</div></section><section style="display:grid;gap:10px;">${slide.page_core_content.slice(1).map((item, index) => `<div data-qa-block="${index === 0 ? 'correction' : 'proof'}" data-primary-point="true" style="padding:12px 14px;border-radius:16px;background:#FFFFFF;border:1px solid rgba(15,23,42,0.08);"><div style="font-size:11px;font-weight:800;letter-spacing:0.06em;text-transform:uppercase;color:${accent};margin-bottom:6px;">${index === 0 ? '真正顺序' : '为什么'}</div><div style="font-size:16px;line-height:1.4;color:#0F172A;">${escapeHtml(item)}</div></div>`).join('')}</section></div></div>${footer}</div>`;
  }
  if (slide.recipe_id === 'xhs.staggered_steps') {
    return `${rootStart}<div style="display:grid;grid-template-rows:auto 1fr;height:100%;gap:14px;">${header}<div style="display:grid;gap:10px;align-content:start;">${slide.page_core_content.map((item, index) => `<div data-qa-block="step-card" data-primary-point="true" style="margin-left:${index * 8}px;padding:12px 14px;border-radius:18px;background:#FFFFFF;border:1px solid rgba(15,23,42,0.08);box-shadow:0 8px 18px rgba(15,23,42,0.05);display:grid;grid-template-columns:28px 1fr;gap:10px;align-items:start;"><div style="width:28px;height:28px;border-radius:999px;background:${accent};color:#FFFFFF;display:grid;place-items:center;font-size:13px;font-weight:800;">${index + 1}</div><div style="font-size:16px;line-height:1.38;color:#0F172A;">${escapeHtml(item)}</div></div>`).join('')}</div></div>${footer}</div>`;
  }
  if (slide.recipe_id === 'xhs.track_rail') {
    return `${rootStart}<div style="display:grid;grid-template-rows:auto 1fr;height:100%;gap:16px;">${header}<div style="display:grid;gap:12px;align-content:start;">${slide.page_core_content.map((item, index) => `<div data-qa-block="track-row" data-primary-point="true" style="display:grid;grid-template-columns:36px 1fr;gap:12px;align-items:center;"><div style="width:36px;height:36px;border-radius:999px;background:${accent};color:#fff;display:grid;place-items:center;font-weight:800;">${index + 1}</div><div style="padding:14px 16px;border-radius:18px;background:#FFFFFF;border:1px solid rgba(15,23,42,0.08);font-size:18px;line-height:1.45;color:#0F172A;">${escapeHtml(item)}</div></div>`).join('')}</div></div>${footer}</div>`;
  }
  if (slide.recipe_id === 'xhs.evidence_bands') {
    return `${rootStart}<div style="display:grid;grid-template-rows:auto 1fr;height:100%;gap:14px;">${header}<div style="display:grid;gap:10px;align-content:start;"><div data-qa-block="claim-band" data-primary-point="true" style="padding:14px;border-radius:18px;background:linear-gradient(135deg, rgba(37,99,235,0.12), #FFFFFF);border:1px solid rgba(37,99,235,0.18);font-size:17px;line-height:1.42;color:#0F172A;">${escapeHtml(slide.page_core_content[0] || '')}</div><div style="display:flex;gap:6px;flex-wrap:wrap;">${slide.evidence_and_sources.slice(0, 2).map((source) => `<span data-qa-block="source-chip" data-source-label="true" style="display:inline-flex;padding:4px 8px;border-radius:999px;background:rgba(15,23,42,0.08);font-size:11px;color:#0F172A;">${escapeHtml(source.public_label)}</span>`).join('')}</div>${slide.page_core_content.slice(1).map((item) => `<div data-qa-block="evidence-row" data-primary-point="true" style="padding:12px 14px;border-radius:16px;background:#FFFFFF;border:1px solid rgba(15,23,42,0.08);font-size:16px;line-height:1.38;color:#0F172A;">${escapeHtml(item)}</div>`).join('')}</div></div>${footer}</div>`;
  }
  if (slide.recipe_id === 'xhs.checklist_close') {
    return `${rootStart}<div style="display:grid;grid-template-rows:auto 1fr;height:100%;gap:16px;">${header}<div style="display:grid;grid-template-columns:1fr;gap:12px;align-content:start;">${slide.page_core_content.map((item) => `<div data-qa-block="check-row" data-primary-point="true" style="display:grid;grid-template-columns:28px 1fr;gap:12px;align-items:start;padding:12px 14px;border-radius:18px;background:#FFFFFF;border:1px solid rgba(15,23,42,0.08);"><div style="width:28px;height:28px;border-radius:999px;background:#0F766E;color:#fff;display:grid;place-items:center;font-size:14px;font-weight:800;">✓</div><div style="font-size:18px;line-height:1.45;color:#0F172A;">${escapeHtml(item)}</div></div>`).join('')}</div></div>${footer}</div>`;
  }
  return `${rootStart}<div style="display:grid;grid-template-rows:auto 1fr;height:100%;gap:16px;">${header}<div style="display:grid;gap:14px;align-content:start;">${slide.page_core_content.map((item) => renderCard(item, accent)).join('')}</div></div>${footer}</div>`;
}

export function compileXhsRenderSlides({ slides, visualDirection, renderContract, canvas }) {
  return safeArray(slides).map((slide) => {
    const materialRules = visualDirection?.material_rules || {};
    const compiled = {
      slide_id: slide.slide_id,
      slide_no: slide.slide_no,
      title: slide.title,
      layout_family: slide.layout_family,
      recipe_id: pickRecipeId(slide, renderContract),
      page_goal: slide.page_goal,
      page_core_content: safeArray(slide.page_core_content),
      evidence_and_sources: safeArray(slide.evidence_and_sources),
      director_contract: {
        visual_motif: safeText(visualDirection?.visual_motif, '纸面感 + 高亮批注 + 便签式收束'),
        source_language_discipline: safeText(visualDirection?.source_language_discipline, '来源必须翻译成读者能理解的公开口径'),
        anti_template_constraints: safeArray(visualDirection?.anti_template_constraints),
        peak_page: safeArray(visualDirection?.peak_pages).includes(slide.slide_id),
        page_role: slide.progression_role,
        memory_hook: safeText(visualDirection?.memory_hook),
        material_rules: {
          paper_base: safeText(materialRules.paper_base, '#FFFBF0'),
          main_accent: safeText(materialRules.main_accent, '#2563EB'),
          warning_accent: safeText(materialRules.warning_accent, '#DC2626'),
        },
      },
      speaker_seconds: slide.layout_family === 'process_track' ? 40 : slide.layout_family === 'action_checklist' ? 32 : 36,
      total_slides: safeArray(slides).length,
    };
    compiled.content = renderSlideMarkup(compiled, canvas);
    return compiled;
  });
}
