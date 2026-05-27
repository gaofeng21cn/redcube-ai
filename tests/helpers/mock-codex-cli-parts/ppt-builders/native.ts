// @ts-nocheck
import { createHash } from 'node:crypto';

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

function layoutIntentForSlide(slide, index, slotCount) {
  const layoutFamily = safeText(slide?.visual_presentation?.layout_family || slide?.layout_family, 'multi_zone_compare');
  const intents = {
    cover_signal: {
      rhetorical_role: 'cover',
      primary_grid: 'hero_callout_with_signal_hub',
      visual_weight: 'left_hero_right_signal_hub',
      negative_space_strategy: 'right side and lower-right breathing area frame the opening claim',
      non_text_visual: 'signal hub with vertical connector rail',
    },
    multi_zone_compare: {
      rhetorical_role: 'comparison',
      primary_grid: `${slotCount}_zone_comparison_with_bridge_rail`,
      visual_weight: slotCount === 2 ? 'left_right_balanced_bridge' : 'distributed_columns_bridge',
      negative_space_strategy: 'wide connector gutter keeps comparison claims separated',
      non_text_visual: 'bridge connector rail linking comparison zones',
    },
    timeline_band: {
      rhetorical_role: 'timeline',
      primary_grid: 'horizontal_timeline_rail_with_milestone_nodes',
      visual_weight: 'bottom_band',
      negative_space_strategy: 'open upper narrative band above the rail',
      non_text_visual: 'timeline rail with milestone nodes',
    },
    judgement_ladder: {
      rhetorical_role: 'gate',
      primary_grid: 'vertical_gate_ladder',
      visual_weight: 'right_heavy',
      negative_space_strategy: 'left evidence column kept open for scanability',
      non_text_visual: 'gate ladder spine connecting judgement steps',
    },
    ring_cross: {
      rhetorical_role: 'system_map',
      primary_grid: 'radial_hub_and_axes',
      visual_weight: 'centered_radial',
      negative_space_strategy: 'corners stay open around the system axis',
      non_text_visual: 'center hub with radial axis connectors',
    },
    summary_peak: {
      rhetorical_role: 'synthesis',
      primary_grid: 'hero_takeaway_plus_closure_band',
      visual_weight: 'top_heavy',
      negative_space_strategy: 'large lower-right quiet zone after the final judgement',
      non_text_visual: 'takeaway band with closure rail',
    },
  };
  const intent = intents[layoutFamily] || intents.multi_zone_compare;
  return {
    ...intent,
    composition_signature: [
      layoutFamily,
      intent.primary_grid,
      intent.visual_weight,
      `slots_${slotCount}`,
      `page_${index + 1}`,
    ].join('__'),
    forbidden_template_reuse_checked: true,
  };
}

function stableCompositionSignature(nativeShapes) {
  const signatureRoles = new Set([
    'title',
    'core_sentence',
    'compare_panel',
    'signal_panel',
    'timeline_panel',
    'judgement_step',
    'axis_panel',
    'takeaway_panel',
    'structured_note_panel',
    'chart',
    'table',
    'metric_grid',
  ]);
  const payload = nativeShapes
    .filter((shape) => signatureRoles.has(safeText(shape?.role)))
    .map((shape) => {
      const bounds = shape?.bounds || {};
      return {
        role: safeText(shape?.role),
        kind: safeText(shape?.kind),
        x: Math.round((Number(bounds.left_in || 0) * 72) / 36),
        y: Math.round((Number(bounds.top_in || 0) * 72) / 36),
        w: Math.round((Number(bounds.width_in || 0) * 72) / 36),
        h: Math.round((Number(bounds.height_in || 0) * 72) / 36),
      };
    })
    .sort((left, right) => (
      left.role.localeCompare(right.role)
      || left.y - right.y
      || left.x - right.x
      || left.w - right.w
      || left.h - right.h
    ));
  const digest = createHash('sha256').update(JSON.stringify(payload)).digest('hex').slice(0, 12);
  const roleSummary = [...new Set(payload.map((item) => item.role))]
    .sort()
    .map((role) => `${role}:${payload.filter((item) => item.role === role).length}`)
    .join('-') || 'empty';
  return `native-composition:${digest}:${roleSummary}`;
}

function panelRole(layoutFamily) {
  return {
    cover_signal: 'signal_panel',
    timeline_band: 'timeline_panel',
    judgement_ladder: 'judgement_step',
    ring_cross: 'axis_panel',
    summary_peak: 'takeaway_panel',
  }[layoutFamily] || 'compare_panel';
}

function panelGeometry(layoutFamily, panelCount, index) {
  if (layoutFamily === 'cover_signal') {
    return [
      { left_in: 1.05, top_in: 3.0, width_in: 4.25, height_in: 2.45 },
      { left_in: 5.7, top_in: 3.45, width_in: 4.25, height_in: 2.45 },
      { left_in: 10.35, top_in: 3.0, width_in: 4.25, height_in: 2.45 },
    ][index] || { left_in: 1.05, top_in: 3.0, width_in: 4.25, height_in: 2.45 };
  }
  if (layoutFamily === 'timeline_band') {
    const gap = panelCount === 2 ? 0.86 : 0.58;
    const width = panelCount === 2 ? 6.1 : panelCount === 3 ? 4.02 : 3.0;
    return { left_in: 1.05 + (width + gap) * index, top_in: 4.35, width_in: width, height_in: 2.15 };
  }
  if (layoutFamily === 'judgement_ladder') {
    return { left_in: index % 2 === 0 ? 8.1 : 9.0, top_in: 2.75 + index * 2.65, width_in: 5.55, height_in: 2.32 };
  }
  if (layoutFamily === 'ring_cross') {
    const positions = [
      { left_in: 6.0, top_in: 2.0, width_in: 4.0, height_in: 1.45 },
      { left_in: 10.0, top_in: 4.7, width_in: 4.15, height_in: 1.45 },
      { left_in: 6.0, top_in: 6.35, width_in: 4.0, height_in: 1.45 },
      { left_in: 1.85, top_in: 4.7, width_in: 4.15, height_in: 1.45 },
    ];
    return positions[index] || positions[0];
  }
  if (layoutFamily === 'summary_peak') {
    const width = panelCount === 1 ? 7.5 : 5.85;
    return { left_in: 1.05 + (width + 0.72) * index, top_in: 4.95, width_in: width, height_in: 1.78 };
  }
  const gap = panelCount === 2 ? 0.8 : 0.54;
  const width = panelCount === 2 ? 6.1 : panelCount === 3 ? 3.9 : 2.85;
  return { left_in: 1.05 + (width + gap) * index, top_in: 3.36, width_in: width, height_in: 2.45 };
}

function titleBounds(layoutFamily) {
  if (layoutFamily === 'summary_peak') return { left_in: 0.95, top_in: 0.58, width_in: 8.6, height_in: 2.05 };
  if (layoutFamily === 'judgement_ladder') return { left_in: 0.95, top_in: 0.56, width_in: 7.7, height_in: 2.05 };
  return { left_in: 0.95, top_in: 0.56, width_in: 12.95, height_in: 1.42 };
}

function coreBounds(layoutFamily) {
  if (layoutFamily === 'judgement_ladder') return { left_in: 1.0, top_in: 2.82, width_in: 5.65, height_in: 1.9 };
  if (layoutFamily === 'ring_cross') return { left_in: 5.2, top_in: 3.7, width_in: 5.6, height_in: 0.86 };
  if (layoutFamily === 'summary_peak') return { left_in: 9.85, top_in: 0.72, width_in: 4.9, height_in: 1.55 };
  return { left_in: 1.0, top_in: 2.08, width_in: 11.9, height_in: 0.98 };
}

function structuralShapes(layoutFamily, slideId) {
  if (layoutFamily === 'cover_signal') {
    return [
      {
        shape_id: `${slideId}-ai-signal-hub`,
        kind: 'oval',
        role: 'signal_hub',
        quality_role: 'decorative',
        bounds: { left_in: 13.18, top_in: 2.72, width_in: 0.74, height_in: 0.74 },
        fill: '#B94624',
        line: 'none',
      },
      {
        shape_id: `${slideId}-ai-signal-connector`,
        kind: 'line',
        role: 'signal_connector',
        quality_role: 'decorative',
        bounds: { left_in: 13.52, top_in: 3.48, width_in: 0.06, height_in: 2.12 },
        line: '#B94624',
      },
    ];
  }
  if (layoutFamily === 'timeline_band') {
    return [{
      shape_id: `${slideId}-ai-timeline-rail`,
      kind: 'line',
      role: 'timeline_rail',
      quality_role: 'decorative',
      bounds: { left_in: 1.08, top_in: 4.12, width_in: 13.22, height_in: 0.06 },
      line: '#B94624',
    }];
  }
  if (layoutFamily === 'judgement_ladder') {
    return [{
      shape_id: `${slideId}-ai-gate-ladder-spine`,
      kind: 'line',
      role: 'gate_ladder_spine',
      quality_role: 'decorative',
      bounds: { left_in: 7.58, top_in: 2.68, width_in: 0.08, height_in: 4.95 },
      line: '#B94624',
    }];
  }
  if (layoutFamily === 'ring_cross') {
    return [
      {
        shape_id: `${slideId}-ai-center-hub`,
        kind: 'oval',
        role: 'center_hub',
        quality_role: 'decorative',
        bounds: { left_in: 7.28, top_in: 4.12, width_in: 1.0, height_in: 1.0 },
        fill: '#B94624',
        line: 'none',
      },
      {
        shape_id: `${slideId}-ai-axis-connector-horizontal`,
        kind: 'line',
        role: 'axis_connector',
        quality_role: 'decorative',
        bounds: { left_in: 2.95, top_in: 4.6, width_in: 9.58, height_in: 0.05 },
        line: '#B94624',
      },
    ];
  }
  if (layoutFamily === 'summary_peak') {
    return [{
      shape_id: `${slideId}-ai-takeaway-band`,
      kind: 'rect',
      role: 'takeaway_band',
      quality_role: 'decorative',
      bounds: { left_in: 0.95, top_in: 4.5, width_in: 13.58, height_in: 0.18 },
      fill: '#B94624',
      line: 'none',
    }];
  }
  return [{
    shape_id: `${slideId}-ai-bridge-connector-rail`,
    kind: 'line',
    role: 'bridge_connector_rail',
    quality_role: 'decorative',
    bounds: { left_in: 1.08, top_in: 6.18, width_in: 13.22, height_in: 0.06 },
    line: '#B94624',
  }];
}

function nativeShapePlanForSlide(slide, index) {
  const slideId = safeText(slide?.slide_id, `S${String(index + 1).padStart(2, '0')}`);
  const title = safeText(slide?.title, `Slide ${index + 1}`);
  const points = slidePoints(slide);
  const slotCount = Math.max(2, Math.min(points.length, 4));
  const layoutFamily = safeText(slide?.visual_presentation?.layout_family || slide?.layout_family, 'multi_zone_compare');
  const panelCount = layoutFamily === 'summary_peak' ? Math.max(1, slotCount - 1) : slotCount;
  const role = panelRole(layoutFamily);
  const titleFontSize = layoutFamily === 'cover_signal' ? 44 : 38;
  const titleRect = titleBounds(layoutFamily);
  const coreRect = coreBounds(layoutFamily);
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
      bounds: titleRect,
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
      bounds: coreRect,
      font_size: 20,
      color: '#5B6570',
      fill: 'none',
      line: 'none',
    },
    {
      shape_id: `${slideId}-side-anchor`,
      kind: 'rect',
      role: 'accent_anchor',
      quality_role: 'decorative',
      bounds: { left_in: 0.48, top_in: 0.72, width_in: 0.1, height_in: 2.6 },
      fill: '#B94624',
      line: 'none',
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
  shapes.push(...structuralShapes(layoutFamily, slideId));
  for (let pointIndex = 0; pointIndex < panelCount; pointIndex += 1) {
    const panelBounds = panelGeometry(layoutFamily, panelCount, pointIndex);
    const pointNumber = pointIndex + 1;
    shapes.push({
      shape_id: `${slideId}-slot-${pointNumber}-panel`,
      kind: 'rounded_rect',
      role,
      quality_role: 'content',
      bounds: panelBounds,
      fill: '#EFE6D6',
      line: '#D8C8B2',
    });
  }
  for (let pointIndex = 0; pointIndex < slotCount; pointIndex += 1) {
    const overflowSummaryText = layoutFamily === 'summary_peak' && pointIndex >= panelCount;
    const panelBounds = overflowSummaryText
      ? { left_in: 8.0, top_in: 7.58, width_in: 6.2, height_in: 1.08 }
      : panelGeometry(layoutFamily, Math.max(panelCount, 1), Math.min(pointIndex, panelCount - 1));
    const pointNumber = pointIndex + 1;
    const textTop = overflowSummaryText ? panelBounds.top_in : panelBounds.top_in + (layoutFamily === 'ring_cross' ? 0.55 : 0.78);
    const indexTop = overflowSummaryText ? panelBounds.top_in : panelBounds.top_in + 0.16;
    const textLeft = overflowSummaryText
      ? panelBounds.left_in + 1.0
      : panelBounds.left_in + (layoutFamily === 'ring_cross' ? 0.9 : 0.24);
    const textWidth = overflowSummaryText
      ? panelBounds.width_in - 1.2
      : panelBounds.width_in - (layoutFamily === 'ring_cross' ? 1.15 : 0.48);
    shapes.push({
      shape_id: `${slideId}-slot-${pointNumber}-index`,
      kind: 'text_box',
      role: 'point_index',
      editable_text: `${String(pointNumber).padStart(2, '0')}`,
      bounds: { left_in: panelBounds.left_in + 0.22, top_in: indexTop, width_in: 0.78, height_in: 0.52 },
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
      bounds: {
        left_in: textLeft,
        top_in: textTop,
        width_in: textWidth,
        height_in: overflowSummaryText ? 1.08 : layoutFamily === 'ring_cross' ? 1.0 : layoutFamily === 'timeline_band' ? 1.32 : 1.72,
      },
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
        const nativeShapes = nativeShapePlanForSlide(slide, index);
        return {
          slide_id: slideId,
          title: safeText(slide?.title, `Slide ${index + 1}`),
          layout_family: safeText(slide?.visual_presentation?.layout_family || slide?.layout_family),
          core_sentence: safeText(slide?.core_sentence),
          page_core_content: safeArray(slide?.page_core_content),
          evidence_and_sources: safeArray(slide?.evidence_and_sources),
          layout_intent: (() => {
            return {
              ...layoutIntentForSlide(slide, index, slidePoints(slide).length),
              composition_signature: stableCompositionSignature(nativeShapes),
            };
          })(),
          native_shapes: nativeShapes,
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
