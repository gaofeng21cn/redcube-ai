import { readySources, safeArray, safeText } from '../shared.js';

export function buildMockBlueprint(meta) {
  const slides = safeArray(meta?.context?.outline?.slides);
  return {
    chapter_goal: '逐页落实讲授逻辑、证据口径与讲者动作',
    claim_spine_lock: safeArray(meta?.context?.outline?.claim_spine_lock),
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
