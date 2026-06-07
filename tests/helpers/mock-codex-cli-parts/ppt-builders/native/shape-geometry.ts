// @ts-nocheck
import { safeArray, safeText } from '../../shared.ts';
import { layoutIntentForSlide, pointText, slidePoints, stableCompositionSignature } from './slide-intent.ts';

function zoneBounds(layoutFamily, slotCount) {
  if (layoutFamily === 'cover_signal') {
    return {
      title_zone: titleBounds(layoutFamily),
      claim_zone: coreBounds(layoutFamily),
      status_zone: { left_in: 1.05, top_in: 3.0, width_in: 13.55, height_in: 2.9 },
      evidence_zone: { left_in: 1.05, top_in: 6.25, width_in: 8.6, height_in: 1.2 },
      takeaway_zone: { left_in: 10.1, top_in: 6.25, width_in: 4.5, height_in: 1.2 },
    };
  }
  if (layoutFamily === 'timeline_band') {
    return {
      title_zone: titleBounds(layoutFamily),
      claim_zone: coreBounds(layoutFamily),
      timeline_zone: { left_in: 1.0, top_in: 3.88, width_in: 13.4, height_in: 3.0 },
      evidence_zone: { left_in: 1.0, top_in: 7.05, width_in: 8.6, height_in: 0.95 },
      takeaway_zone: { left_in: 10.0, top_in: 7.05, width_in: 4.4, height_in: 0.95 },
    };
  }
  if (layoutFamily === 'judgement_ladder') {
    return {
      title_zone: titleBounds(layoutFamily),
      claim_zone: coreBounds(layoutFamily),
      system_map_zone: { left_in: 0.8, top_in: 2.45, width_in: 13.8, height_in: 5.6 },
      evidence_zone: { left_in: 1.0, top_in: 5.45, width_in: 5.8, height_in: 1.15 },
      gate_zone: { left_in: 1.0, top_in: 6.9, width_in: 5.8, height_in: 1.05 },
    };
  }
  if (layoutFamily === 'ring_cross') {
    return {
      title_zone: titleBounds(layoutFamily),
      claim_zone: coreBounds(layoutFamily),
      system_map_zone: { left_in: 1.55, top_in: 1.85, width_in: 12.85, height_in: 6.15 },
      gate_zone: { left_in: 10.0, top_in: 1.92, width_in: 4.25, height_in: 1.45 },
      evidence_zone: { left_in: 1.65, top_in: 6.28, width_in: 4.55, height_in: 1.6 },
    };
  }
  if (layoutFamily === 'summary_peak') {
    return {
      title_zone: titleBounds(layoutFamily),
      claim_zone: coreBounds(layoutFamily),
      decision_zone: { left_in: 0.95, top_in: 4.4, width_in: 13.6, height_in: 2.45 },
      proof_zone: { left_in: 1.0, top_in: 6.82, width_in: 6.9, height_in: 1.62 },
      takeaway_zone: { left_in: 8.1, top_in: 6.82, width_in: 6.4, height_in: 1.62 },
    };
  }
  const width = slotCount <= 2 ? 13.0 : 13.4;
  return {
    title_zone: titleBounds(layoutFamily),
    claim_zone: coreBounds(layoutFamily),
    matrix_zone: { left_in: 1.0, top_in: 3.05, width_in: width, height_in: 3.25 },
    signal_zone: { left_in: 1.0, top_in: 6.62, width_in: 6.35, height_in: 1.2 },
    takeaway_zone: { left_in: 7.72, top_in: 6.62, width_in: 6.68, height_in: 1.2 },
  };
}

function templateBindingForSlide(slide, index, slotCount) {
  const layoutFamily = safeText(slide?.visual_presentation?.layout_family || slide?.layout_family, 'multi_zone_compare');
  const archetypeByFamily = {
    cover_signal: 'executive_status_board',
    timeline_band: 'evidence_timeline',
    judgement_ladder: 'professional_system_map',
    ring_cross: 'professional_system_map',
    summary_peak: 'decision_dashboard',
  };
  const selectedArchetype = archetypeByFamily[layoutFamily] || 'risk_control_matrix';
  const zoneMap = zoneBounds(layoutFamily, slotCount);
  return {
    selected_archetype: selectedArchetype,
    archetype_instance_id: `${safeText(slide?.slide_id, `S${index + 1}`)}-${selectedArchetype}`,
    rhythm_role: index === 0 ? 'opening' : layoutFamily === 'summary_peak' ? 'close' : layoutFamily,
    zone_gap_in_min: 0.32,
    zone_inset_in_min: 0.15,
    zones: Object.entries(zoneMap).map(([zoneId, bounds]) => ({
      zone_id: zoneId,
      semantic_role: zoneId.replace(/_zone$/, ''),
      bounds,
      intended_content: `${zoneId.replace(/_/g, ' ')} for native editable PPT design`,
      min_font_pt: zoneId === 'title_zone' ? 36 : 18,
      safe_inset_in: 0.15,
    })),
  };
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
      { left_in: 1.1, top_in: 3.12, width_in: 4.1, height_in: 2.24 },
      { left_in: 5.65, top_in: 3.34, width_in: 4.1, height_in: 2.24 },
      { left_in: 10.2, top_in: 3.12, width_in: 4.1, height_in: 2.24 },
    ][index] || { left_in: 1.1, top_in: 3.12, width_in: 4.1, height_in: 2.24 };
  }
  if (layoutFamily === 'timeline_band') {
    const gap = panelCount === 2 ? 0.78 : panelCount === 3 ? 0.5 : 0.37;
    const width = panelCount === 2 ? 6.0 : panelCount === 3 ? 3.95 : 2.95;
    return { left_in: 1.05 + (width + gap) * index, top_in: 4.25, width_in: width, height_in: 2.0 };
  }
  if (layoutFamily === 'judgement_ladder') {
    const height = panelCount >= 4 ? 1.38 : 1.48;
    const step = panelCount >= 4 ? 1.36 : 1.58;
    return { left_in: index % 2 === 0 ? 8.05 : 8.85, top_in: 2.5 + index * step, width_in: 5.05, height_in: height };
  }
  if (layoutFamily === 'ring_cross') {
    const positions = [
      { left_in: 6.0, top_in: 4.95, width_in: 4.0, height_in: 1.12 },
      { left_in: 10.0, top_in: 4.7, width_in: 4.15, height_in: 1.45 },
      { left_in: 6.0, top_in: 6.35, width_in: 4.0, height_in: 1.45 },
      { left_in: 1.85, top_in: 4.7, width_in: 4.15, height_in: 1.45 },
    ];
    return positions[index] || positions[0];
  }
  if (layoutFamily === 'summary_peak') {
    const width = panelCount === 1 ? 7.5 : panelCount === 2 ? 5.85 : 4.1;
    const gap = panelCount === 1 ? 0 : panelCount === 2 ? 0.72 : 0.45;
    return { left_in: 1.05 + (width + gap) * index, top_in: 4.78, width_in: width, height_in: 1.55 };
  }
  const gap = panelCount === 2 ? 0.72 : panelCount === 3 ? 0.54 : 0.48;
  const width = panelCount === 2 ? 6.0 : panelCount === 3 ? 3.9 : 2.78;
  return { left_in: 1.05 + (width + gap) * index, top_in: 3.32, width_in: width, height_in: 2.35 };
}

function titleBounds(layoutFamily) {
  if (layoutFamily === 'summary_peak') return { left_in: 0.95, top_in: 0.58, width_in: 8.6, height_in: 2.05 };
  if (layoutFamily === 'judgement_ladder') return { left_in: 0.95, top_in: 0.56, width_in: 7.7, height_in: 2.05 };
  return { left_in: 0.95, top_in: 0.56, width_in: 12.95, height_in: 1.65 };
}

function coreBounds(layoutFamily) {
  if (layoutFamily === 'judgement_ladder') return { left_in: 1.0, top_in: 2.82, width_in: 5.65, height_in: 1.9 };
  if (layoutFamily === 'ring_cross') return { left_in: 5.2, top_in: 3.66, width_in: 5.6, height_in: 0.98 };
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
        quality_role: 'structural',
        layout_zone_id: 'status_zone',
        bounds: { left_in: 13.72, top_in: 3.18, width_in: 0.68, height_in: 0.68 },
        fill: '#B94624',
        line: 'none',
      },
      {
        shape_id: `${slideId}-ai-signal-connector`,
        kind: 'line',
        role: 'signal_connector',
        quality_role: 'structural',
        layout_zone_id: 'status_zone',
        bounds: { left_in: 14.05, top_in: 3.95, width_in: 0.04, height_in: 1.48 },
        line: '#B94624',
      },
    ];
  }
  if (layoutFamily === 'timeline_band') {
    return [{
      shape_id: `${slideId}-ai-timeline-rail`,
      kind: 'line',
      role: 'timeline_rail',
      quality_role: 'structural',
      layout_zone_id: 'timeline_zone',
      bounds: { left_in: 1.08, top_in: 4.12, width_in: 12.95, height_in: 0.06 },
      line: '#B94624',
    }];
  }
  if (layoutFamily === 'judgement_ladder') {
    return [{
      shape_id: `${slideId}-ai-gate-ladder-spine`,
      kind: 'line',
      role: 'gate_ladder_spine',
      quality_role: 'structural',
      layout_zone_id: 'system_map_zone',
      bounds: { left_in: 7.42, top_in: 2.72, width_in: 0.08, height_in: 4.78 },
      line: '#B94624',
    }];
  }
  if (layoutFamily === 'ring_cross') {
    return [
      {
        shape_id: `${slideId}-ai-center-hub`,
        kind: 'oval',
        role: 'center_hub',
        quality_role: 'structural',
        layout_zone_id: 'system_map_zone',
        bounds: { left_in: 7.28, top_in: 4.12, width_in: 1.0, height_in: 1.0 },
        fill: '#B94624',
        line: 'none',
      },
      {
        shape_id: `${slideId}-ai-axis-connector-horizontal`,
        kind: 'line',
        role: 'axis_connector',
        quality_role: 'structural',
        layout_zone_id: 'system_map_zone',
        bounds: { left_in: 7.31, top_in: 4.6, width_in: 0.32, height_in: 0.05 },
        line: '#B94624',
      },
    ];
  }
  if (layoutFamily === 'summary_peak') {
    return [{
      shape_id: `${slideId}-ai-takeaway-band`,
      kind: 'rect',
      role: 'takeaway_band',
      quality_role: 'structural',
      layout_zone_id: 'decision_zone',
      bounds: { left_in: 0.95, top_in: 4.5, width_in: 13.58, height_in: 0.18 },
      fill: '#B94624',
      line: 'none',
    }];
  }
  return [{
    shape_id: `${slideId}-ai-bridge-connector-rail`,
    kind: 'line',
    role: 'bridge_connector_rail',
    quality_role: 'structural',
    layout_zone_id: 'matrix_zone',
    bounds: { left_in: 1.08, top_in: 6.0, width_in: 12.72, height_in: 0.06 },
    line: '#B94624',
  }];
}

function archetypeSupportShapes(layoutFamily, slideId) {
  const supportText = {
    evidence: '证据链可复核。',
    takeaway: '自主链路已经闭合且证据可复核。',
    metric: '0 溢出。',
    gate: '审查通过后进入正式导出流程',
  };
  const textShape = (suffix, role, zone, text, bounds, color = '#5B6570') => ({
    shape_id: `${slideId}-${suffix}`,
    kind: 'text_box',
    role,
    quality_role: 'content',
    layout_zone_id: zone,
    editable_text: text,
    bounds,
    font_size: 18,
    color,
    fill: 'none',
    line: 'none',
  });
  if (layoutFamily === 'cover_signal') {
    return [
      textShape('evidence-note', 'evidence_item', 'evidence_zone', supportText.evidence, { left_in: 1.12, top_in: 6.38, width_in: 7.45, height_in: 0.82 }),
      textShape('takeaway-note', 'takeaway', 'takeaway_zone', supportText.takeaway, { left_in: 10.22, top_in: 6.38, width_in: 4.05, height_in: 0.82 }, '#171C24'),
    ];
  }
  if (layoutFamily === 'timeline_band') {
    return [
      textShape('timeline-evidence', 'evidence_item', 'evidence_zone', supportText.evidence, { left_in: 1.08, top_in: 7.15, width_in: 7.45, height_in: 0.62 }),
      textShape('timeline-takeaway', 'takeaway', 'takeaway_zone', supportText.takeaway, { left_in: 10.12, top_in: 7.15, width_in: 4.0, height_in: 0.62 }, '#171C24'),
    ];
  }
  if (layoutFamily === 'judgement_ladder') {
    return [
      textShape('ladder-evidence', 'evidence_item', 'evidence_zone', supportText.evidence, { left_in: 1.1, top_in: 5.58, width_in: 5.35, height_in: 0.86 }),
      textShape('gate-label', 'gate_card', 'gate_zone', '质量门通过后才进入最终交付。', { left_in: 1.1, top_in: 7.02, width_in: 5.35, height_in: 0.86 }, '#171C24'),
    ];
  }
  if (layoutFamily === 'ring_cross') {
    return [
      textShape('system-gate', 'gate_card', 'gate_zone', supportText.gate, { left_in: 10.02, top_in: 2.42, width_in: 4.2, height_in: 0.78 }, '#171C24'),
      textShape('system-evidence', 'evidence_item', 'evidence_zone', supportText.evidence, { left_in: 1.85, top_in: 6.58, width_in: 3.75, height_in: 0.82 }),
    ];
  }
  if (layoutFamily === 'summary_peak') {
    return [
      textShape('proof-metric', 'metric', 'proof_zone', supportText.metric, { left_in: 1.12, top_in: 7.08, width_in: 6.0, height_in: 0.72 }),
      textShape('final-takeaway', 'takeaway', 'takeaway_zone', supportText.takeaway, { left_in: 8.22, top_in: 6.9, width_in: 5.85, height_in: 0.54 }, '#171C24'),
    ];
  }
  return [
    textShape('signal-metric', 'metric', 'signal_zone', supportText.metric, { left_in: 1.12, top_in: 6.78, width_in: 5.75, height_in: 0.82 }),
    textShape('matrix-takeaway', 'takeaway', 'takeaway_zone', supportText.takeaway, { left_in: 8.0, top_in: 6.78, width_in: 5.95, height_in: 0.82 }, '#171C24'),
  ];
}

function nativeShapePlanForSlide(slide, index) {
  const slideId = safeText(slide?.slide_id, `S${String(index + 1).padStart(2, '0')}`);
  const title = safeText(slide?.title, `Slide ${index + 1}`);
  const points = slidePoints(slide);
  const slotCount = Math.max(2, Math.min(points.length, 4));
  const layoutFamily = safeText(slide?.visual_presentation?.layout_family || slide?.layout_family, 'multi_zone_compare');
  const panelCount = slotCount;
  const role = panelRole(layoutFamily);
  const contentZoneByLayout = {
    cover_signal: 'status_zone',
    timeline_band: 'timeline_zone',
    judgement_ladder: 'system_map_zone',
    ring_cross: 'system_map_zone',
    summary_peak: 'decision_zone',
  };
  const contentZoneId = contentZoneByLayout[layoutFamily] || 'matrix_zone';
  const titleFontSize = layoutFamily === 'cover_signal' ? 44 : 38;
  const titleRect = titleBounds(layoutFamily);
  const coreRect = coreBounds(layoutFamily);
  const shapes = [
    {
      shape_id: `${slideId}-bg-accent`,
      kind: 'rect',
      role: 'background_accent',
      quality_role: 'decorative',
      layout_zone_id: 'title_zone',
      bounds: { left_in: 0.97, top_in: 0.58, width_in: 12.8, height_in: 0.08 },
      fill: '#B94624',
      line: 'none',
    },
    {
      shape_id: `${slideId}-title`,
      kind: 'text_box',
      role: 'title',
      quality_role: 'content',
      layout_zone_id: 'title_zone',
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
      quality_role: 'content',
      layout_zone_id: 'claim_zone',
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
      layout_zone_id: 'title_zone',
      bounds: { left_in: 1.0, top_in: 0.78, width_in: 0.08, height_in: 1.2 },
      fill: '#B94624',
      line: 'none',
    },
    {
      shape_id: `${slideId}-decor-dot`,
      kind: 'oval',
      role: 'accent_dot',
      quality_role: 'decorative',
      layout_zone_id: 'title_zone',
      bounds: { left_in: 13.2, top_in: 0.72, width_in: 0.26, height_in: 0.26 },
      fill: '#B94624',
      line: 'none',
    },
    {
      shape_id: `${slideId}-page`,
      kind: 'text_box',
      role: 'page_number',
      quality_role: 'auxiliary',
      layout_zone_id: 'title_zone',
      editable_text: `${String(index + 1).padStart(2, '0')}`,
      bounds: { left_in: 13.05, top_in: 1.35, width_in: 0.72, height_in: 0.44 },
      font_size: 18,
      color: '#5B6570',
      fill: 'none',
      line: 'none',
      align: 'right',
    },
  ];
  shapes.push(...structuralShapes(layoutFamily, slideId));
  shapes.push(...archetypeSupportShapes(layoutFamily, slideId));
  for (let pointIndex = 0; pointIndex < panelCount; pointIndex += 1) {
    const panelBounds = panelGeometry(layoutFamily, panelCount, pointIndex);
    const pointNumber = pointIndex + 1;
    shapes.push({
      shape_id: `${slideId}-slot-${pointNumber}-panel`,
      kind: 'rounded_rect',
      role,
      quality_role: 'content',
      layout_zone_id: contentZoneId,
      bounds: panelBounds,
      fill: '#EFE6D6',
      line: '#D8C8B2',
    });
  }
  for (let pointIndex = 0; pointIndex < slotCount; pointIndex += 1) {
    const overflowSummaryText = layoutFamily === 'summary_peak' && pointIndex >= panelCount;
    const panelBounds = overflowSummaryText
      ? { left_in: 8.0, top_in: 7.48, width_in: 6.2, height_in: 0.92 }
      : panelGeometry(layoutFamily, Math.max(panelCount, 1), Math.min(pointIndex, panelCount - 1));
    const pointZoneId = overflowSummaryText ? 'takeaway_zone' : contentZoneId;
    const pointNumber = pointIndex + 1;
    const ladderSlot = layoutFamily === 'judgement_ladder' && !overflowSummaryText;
    const textTop = overflowSummaryText
      ? panelBounds.top_in + 0.04
      : panelBounds.top_in + (ladderSlot ? 0.22 : layoutFamily === 'ring_cross' ? 0.48 : layoutFamily === 'summary_peak' ? 0.46 : 0.78);
    const indexTop = overflowSummaryText ? panelBounds.top_in + 0.06 : panelBounds.top_in + (ladderSlot ? 0.24 : 0.16);
    const textLeft = overflowSummaryText
      ? panelBounds.left_in + 1.0
      : panelBounds.left_in + (layoutFamily === 'summary_peak' ? 1.08 : ladderSlot ? 1.08 : layoutFamily === 'ring_cross' ? 1.12 : 0.24);
    const textWidth = overflowSummaryText
      ? panelBounds.width_in - 1.2
      : panelBounds.width_in - (layoutFamily === 'summary_peak' ? 1.34 : ladderSlot ? 1.34 : layoutFamily === 'ring_cross' ? 1.15 : 0.48);
    shapes.push({
      shape_id: `${slideId}-slot-${pointNumber}-index`,
      kind: 'text_box',
      role: 'point_index',
      quality_role: 'content',
      layout_zone_id: pointZoneId,
      editable_text: `${String(pointNumber).padStart(2, '0')}`,
      bounds: { left_in: panelBounds.left_in + 0.22, top_in: indexTop, width_in: 0.78, height_in: overflowSummaryText ? 0.38 : 0.52 },
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
      quality_role: 'content',
      layout_zone_id: pointZoneId,
      editable_text: pointText(points[pointIndex], `Concrete audience point ${pointNumber}`),
      bounds: {
        left_in: textLeft,
        top_in: textTop,
        width_in: textWidth,
        height_in: overflowSummaryText
          ? 0.84
          : ladderSlot ? Math.max(1.1, panelBounds.height_in - 0.18)
            : layoutFamily === 'summary_peak' ? 1.16
              : layoutFamily === 'ring_cross' ? 0.92 : layoutFamily === 'timeline_band' ? 1.32 : 1.72,
      },
      font_size: 18,
      color: '#171C24',
      fill: 'none',
      line: 'none',
    });
  }
  return shapes;
}

export {
  nativeShapePlanForSlide,
  templateBindingForSlide,
};
