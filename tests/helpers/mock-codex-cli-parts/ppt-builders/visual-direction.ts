// @ts-nocheck
import { safeArray } from '../shared.ts';

export function buildMockVisualDirection(meta) {
  const slides = safeArray(meta?.context?.blueprint?.slides);
  const peakPages = slides.filter((_, index) => index === 0 || index === 3 || index === slides.length - 1).map((slide) => slide.slide_id);
  return {
    visual_manifest: '浅底高对比、结构显式、关键页拉节奏的正式讲台感',
    what_it_is: ['结构先行', '证据与动作并重', '适合讲课复述'],
    what_it_is_not: ['统一安全模板页', '内部文档截图', '脚本式卡片堆砌'],
    palette: {
      canvas: '#F7F8FC',
      ink: '#0F172A',
      accent: '#2563EB',
      accentSoft: '#DBEAFE',
      success: '#0F766E',
    },
    typography_plan: {
      cover_title: { font_size: 56, line_height: 1.08, font_weight: 800 },
      body_title: { font_size: 44, line_height: 1.12, font_weight: 780 },
      section_lead: { font_size: 24, line_height: 1.4, font_weight: 650 },
      card_title: { font_size: 21, line_height: 1.18, font_weight: 720 },
      card_body: { font_size: 16.5, line_height: 1.45, font_weight: 600 },
      meta_label: { font_size: 12.5, line_height: 1.1, font_weight: 600 },
      page_no: { font_size: 18, line_height: 1.0, font_weight: 600 },
    },
    continuity_constraints: [
      '关键页必须与相邻页形成明显差异',
      '复杂结构页必须显式输出锚点与轨道',
      '来源与页码按页控制',
    ],
    rhythm_curve: slides.map((slide, index) => ({
      slide_id: slide.slide_id,
      role: index === 0 ? 'opening_peak' : (peakPages.includes(slide.slide_id) ? 'content_peak' : 'bridge'),
    })),
    peak_pages: peakPages,
    page_family_ceiling: {
      cover_signal: 1,
      multi_zone_compare: 3,
      timeline_band: 1,
      judgement_ladder: 1,
      ring_cross: 1,
      summary_peak: 1,
    },
    forbidden_regressions: ['退化成统一安全模板页', '更单调', '更挤', '更像脚本拼卡片'],
    final_instruction_to_html_generator: [
      '每页在 slidesData 中保留独立内容',
      '复杂结构页必须显式输出锚点与轨道',
      '关键页必须保留视觉峰值，不允许连续同构',
    ],
    visual_anchor_system: {
      preferred_library: 'Font Awesome Free',
      fallback_library: 'emoji',
      consistency_rule: '同一页、同一组视觉锚点保持统一图标语法，优先使用 Font Awesome Free。',
      required_peak_page_anchor: '封面、峰值页与结尾页都要有语义明确的视觉锚点。',
      forbidden_patterns: [
        '孤立单字贴纸',
        '无语义装饰符号',
        '图标压住标题或正文',
      ],
    },
  };
}
