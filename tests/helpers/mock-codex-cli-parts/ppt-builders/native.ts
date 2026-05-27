// @ts-nocheck
import { safeArray, safeText } from '../shared.ts';

function pointText(item, fallback) {
  return safeText(item?.text || item, fallback);
}

function contentCharCount(text) {
  return [...String(text || '')]
    .filter((char) => !/\s/.test(char) && !['，', '。', '、', ',', '.', ':', '：', ';', '；'].includes(char))
    .length;
}

function qualityPointText(text, index) {
  const normalized = String(text || '').trim();
  if (contentCharCount(normalized) >= 12) return normalized;
  const seed = normalized || `第${index + 1}项`;
  return `${seed}，说明本页证据如何支撑交付判断`;
}

function slidePoints(slide) {
  const points = safeArray(slide?.page_core_content)
    .map((item, index) => pointText(item, `Point ${index + 1} carries concrete audience content`))
    .filter(Boolean);
  return (points.length > 0 ? points : [
    safeText(slide?.core_sentence, 'Concrete audience point for native PPT validation'),
    'Editable slide materialization keeps geometry explicit',
    'Review gates receive shape manifest evidence',
  ]).slice(0, 4).map((text, index) => qualityPointText(text, index));
}

function nativeShapePlanForSlide(slide, index) {
  const slideId = safeText(slide?.slide_id, `S${String(index + 1).padStart(2, '0')}`);
  const title = safeText(slide?.title, `Slide ${index + 1}`);
  const points = slidePoints(slide);
  const slotCount = Math.max(2, Math.min(points.length, 4));
  const layoutFamily = safeText(slide?.visual_presentation?.layout_family || slide?.layout_family, 'multi_zone_compare');
  const panelCount = layoutFamily === 'summary_peak' ? Math.max(1, slotCount - 1) : slotCount;
  const panelWidth = panelCount === 2 ? 6.1 : panelCount === 3 ? 3.9 : 2.85;
  const gap = panelCount === 2 ? 0.7 : 0.45;
  const left = panelCount === 2 ? 1.15 : 1.0;
  const panelTop = 3.45;
  const panelRole = layoutFamily === 'cover_signal'
    ? 'signal_panel'
    : layoutFamily === 'timeline_band'
      ? 'timeline_panel'
      : layoutFamily === 'judgement_ladder'
        ? 'judgement_step'
        : layoutFamily === 'ring_cross'
          ? 'axis_panel'
          : layoutFamily === 'summary_peak'
            ? 'takeaway_panel'
            : 'compare_panel';
  const titleFontSize = layoutFamily === 'cover_signal' ? 44 : 38;
  const titleHeight = 1.28;
  const coreTop = 1.95;
  const shapes = [
    {
      shape_id: `${slideId}-bg-accent`,
      kind: 'rect',
      role: 'background_accent',
      quality_role: 'decorative',
      bounds: { left_in: 0.0, top_in: 0.0, width_in: 16.0, height_in: 0.26 },
      fill: '#B94624',
      line: 'none',
    },
    {
      shape_id: `${slideId}-title`,
      kind: 'text_box',
      role: 'title',
      editable_text: title,
      bounds: { left_in: 0.9, top_in: 0.55, width_in: 13.55, height_in: titleHeight },
      font_size: titleFontSize,
      color: '#171C24',
      fill: 'none',
      line: 'none',
      bold: true,
    },
    {
      shape_id: `${slideId}-core`,
      kind: 'text_box',
      role: 'core_sentence',
      editable_text: safeText(slide?.core_sentence, points[0]),
      bounds: { left_in: 0.95, top_in: coreTop, width_in: 12.8, height_in: 0.72 },
      font_size: 20,
      color: '#5B6570',
      fill: 'none',
      line: 'none',
    },
    {
      shape_id: `${slideId}-decor-line`,
      kind: 'line',
      role: 'accent_rule',
      quality_role: 'decorative',
      bounds: { left_in: 0.95, top_in: 2.85, width_in: 13.2, height_in: 0.02 },
      line: '#B94624',
      line_width: 1.4,
    },
    {
      shape_id: `${slideId}-decor-dot`,
      kind: 'oval',
      role: 'accent_dot',
      quality_role: 'decorative',
      bounds: { left_in: 14.3, top_in: 0.7, width_in: 0.28, height_in: 0.28 },
      fill: '#B94624',
      line: 'none',
    },
    {
      shape_id: `${slideId}-page`,
      kind: 'text_box',
      role: 'page_number',
      editable_text: `${String(index + 1).padStart(2, '0')}`,
      bounds: { left_in: 14.35, top_in: 8.02, width_in: 0.7, height_in: 0.46 },
      font_size: 18,
      color: '#5B6570',
      fill: 'none',
      line: 'none',
      align: 'right',
    },
  ];
  for (let pointIndex = 0; pointIndex < panelCount; pointIndex += 1) {
    const x = left + (panelWidth + gap) * pointIndex;
    const pointNumber = pointIndex + 1;
    shapes.push({
      shape_id: `${slideId}-slot-${pointNumber}-panel`,
      kind: 'rounded_rect',
      role: panelRole,
      quality_role: 'content',
      bounds: { left_in: x, top_in: panelTop, width_in: panelWidth, height_in: 2.55 },
      fill: '#EFE6D6',
      line: '#D8C8B2',
    });
  }
  for (let pointIndex = 0; pointIndex < slotCount; pointIndex += 1) {
    const overflowSummaryText = layoutFamily === 'summary_peak' && pointIndex >= panelCount;
    const x = overflowSummaryText
      ? 1.15
      : left + (panelWidth + gap) * Math.min(pointIndex, panelCount - 1);
    const pointNumber = pointIndex + 1;
    const textTop = overflowSummaryText ? 6.35 : panelTop + 0.78;
    const indexTop = overflowSummaryText ? 6.35 : panelTop + 0.22;
    const textLeft = overflowSummaryText ? x + 1.05 : x + 0.24;
    const textWidth = overflowSummaryText ? 12.0 : panelWidth - 0.48;
    shapes.push({
      shape_id: `${slideId}-slot-${pointNumber}-index`,
      kind: 'text_box',
      role: 'point_index',
      editable_text: `${String(pointNumber).padStart(2, '0')}`,
      bounds: { left_in: x + 0.22, top_in: indexTop, width_in: 0.62, height_in: 0.46 },
      font_size: 16,
      color: '#B94624',
      fill: 'none',
      line: 'none',
      bold: true,
    });
    shapes.push({
      shape_id: `${slideId}-slot-${pointNumber}-text`,
      kind: 'text_box',
      role: 'point_text',
      editable_text: pointText(points[pointIndex], `Concrete audience point ${pointNumber}`),
      bounds: { left_in: textLeft, top_in: textTop, width_in: textWidth, height_in: overflowSummaryText ? 0.78 : 1.58 },
      font_size: 18,
      color: '#171C24',
      fill: 'none',
      line: 'none',
    });
  }
  return shapes;
}

export function buildMockPptNativeShapePlan(meta) {
  const route = safeText(meta?.route);
  const slides = safeArray(meta?.context?.blueprint?.slides);
  const repairFeedback = safeArray(meta?.context?.repair_feedback);
  const targetSlideIds = new Set(
    safeArray(meta?.context?.unit_repair_scope?.target_slide_ids)
      .map((slideId) => safeText(slideId))
      .filter(Boolean),
  );
  return {
    ai_first_editing_contract: {
      contract_id: 'ppt_native_ai_first_editing_contract_v1',
      creative_owner: 'llm_agent',
      editable_shape_plan_required: true,
      python_helper_role: 'execute_validate_export_only',
      template_substitution_allowed: false,
      preserved_gates: ['visual_director_review', 'screenshot_review', 'export_pptx'],
    },
    editable_shape_plan: {
      contract_kind: 'redcube_ai_first_native_ppt_shape_plan',
      route,
      scope: route === 'repair_pptx_native' ? 'page_repair' : 'deck_authoring',
      target_slide_ids: [...targetSlideIds],
      authoring_ir: {
        kind: 'redcube_svg_ir',
        version: 1,
        required: true,
        strict_svg_preflight_required: true,
        allowed_svg_tags: ['svg', 'g', 'rect', 'text'],
      },
      consumed_feedback_count: repairFeedback.length,
      slides: slides.map((slide, index) => {
        const slideId = safeText(slide?.slide_id, `S${String(index + 1).padStart(2, '0')}`);
        return {
          slide_id: slideId,
          title: safeText(slide?.title, `Slide ${index + 1}`),
          layout_family: safeText(slide?.visual_presentation?.layout_family || slide?.layout_family),
          core_sentence: safeText(slide?.core_sentence),
          page_core_content: safeArray(slide?.page_core_content),
          evidence_and_sources: safeArray(slide?.evidence_and_sources),
          native_shapes: nativeShapePlanForSlide(slide, index),
          redcube_svg_ir_intent: {
            root_viewbox: '0 0 1152 648',
            editable_text_required: true,
            required_intents: ['text:title', 'text:point_text', 'rect:content_panel', 'group:content_point'],
          },
          repair_directive: targetSlideIds.has(slideId) ? 'apply screenshot feedback to this editable slide only' : 'preserve passed slide',
        };
      }),
    },
  };
}
