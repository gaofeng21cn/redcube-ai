// @ts-nocheck
import { createHash } from 'node:crypto';

import { safeArray, safeText } from '../shared.ts';
import {
  buildSampleStatusSlide,
  sampleTemplateLayoutGrammar,
} from './native-sample.ts';

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

function templateLayoutGrammar() {
  return {
    grammar_id: 'native_pptx_template_layout_grammar_v1',
    owner: 'llm_agent',
    required: true,
    materializer_role: 'execute_selected_archetype_zones_only',
    helper_template_layout_allowed: false,
    reference_discipline: {
      template_profile_required: true,
      semantic_layout_selection_required: true,
      placeholder_capacity_required: true,
      reference_deck_analysis_required: true,
      action_title_required: true,
      source_projects: ['ppt-master', 'PPTAgent', 'officecli-pptx', 'presenton', 'ppt-agent-skills'],
      rule: 'Treat templates and reference decks as layout intelligence before coordinates.',
    },
    global_rules: {
      edge_margin_in_min: 0.6,
      zone_gap_in_min: 0.32,
      zone_inset_in_min: 0.15,
      selected_archetype_required_before_shapes: true,
      every_content_shape_must_bind_to_layout_zone: true,
      connector_lane_must_be_separate_from_text_zones: true,
      empty_placeholder_slots_allowed: false,
      repeated_concrete_archetype_limit: 2,
      contact_sheet_rhythm_required: true,
    },
    archetype_catalog: [
      {
        archetype_id: 'professional_system_map',
        use_when: 'workflow, route, system, gate, or evidence flow needs to be understood at a glance',
        layout_description: 'Claim and title above an editable system map; route lanes, gate stack, and evidence band occupy distinct semantic zones with connector lanes outside text.',
        required_zones: ['title_zone', 'claim_zone', 'system_map_zone', 'gate_zone', 'evidence_zone'],
        content_schema: {
          required_shape_roles: ['title', 'core_sentence', 'system_map_panel', 'route_label', 'gate_card', 'evidence_item'],
          required_shape_role_groups: ['title_text', 'core_claim_text', 'structural_visual', 'gate_or_route_label', 'evidence_or_metric_text'],
          min_filled_required_zone_share: 0.8,
        },
        prohibited: ['connector crossing readable text', 'three narrow route cards', 'labels placed on rails'],
      },
      {
        archetype_id: 'executive_status_board',
        use_when: 'one-slide status proof or decision summary',
        layout_description: 'Large status cards or panels in the middle with a separate proof/takeaway band.',
        required_zones: ['title_zone', 'claim_zone', 'status_zone', 'evidence_zone', 'takeaway_zone'],
        content_schema: {
          required_shape_roles: ['title', 'core_sentence', 'content_panel', 'point_text', 'evidence_item', 'takeaway'],
          required_shape_role_groups: ['title_text', 'core_claim_text', 'content_container', 'audience_body_text', 'takeaway_text'],
          min_filled_required_zone_share: 0.8,
        },
        prohibited: ['receipt label pile', 'empty four-card grid', 'tiny KPI badges'],
      },
      {
        archetype_id: 'evidence_timeline',
        use_when: 'sequence, milestone, or proof evolution',
        layout_description: 'Timeline rail with milestone nodes, labels off the rail, and separated proof/takeaway zones.',
        required_zones: ['title_zone', 'claim_zone', 'timeline_zone', 'evidence_zone', 'takeaway_zone'],
        content_schema: {
          required_shape_roles: ['title', 'core_sentence', 'timeline_panel', 'point_text', 'evidence_item', 'takeaway'],
          required_shape_role_groups: ['title_text', 'core_claim_text', 'timeline_marker', 'audience_body_text', 'evidence_or_metric_text'],
          min_filled_required_zone_share: 0.8,
        },
        prohibited: ['timeline rail through labels', 'milestone text below 18pt'],
      },
      {
        archetype_id: 'risk_control_matrix',
        use_when: 'compare risks, controls, gates, or quality criteria',
        layout_description: 'Matrix or comparison field with filled cells and separate signal/takeaway zones.',
        required_zones: ['title_zone', 'claim_zone', 'matrix_zone', 'signal_zone', 'takeaway_zone'],
        content_schema: {
          required_shape_roles: ['title', 'core_sentence', 'compare_panel', 'point_text', 'metric', 'takeaway'],
          required_shape_role_groups: ['title_text', 'core_claim_text', 'matrix_or_compare_container', 'audience_body_text', 'evidence_or_metric_text'],
          min_filled_required_zone_share: 0.8,
        },
        prohibited: ['unfilled matrix cell', 'four-card template with fewer than four facts'],
      },
      {
        archetype_id: 'decision_dashboard',
        use_when: 'decision, recommendation, operating readout, or proof dashboard',
        layout_description: 'Decision zone with proof objects and takeaway hierarchy.',
        required_zones: ['title_zone', 'claim_zone', 'decision_zone', 'proof_zone', 'takeaway_zone'],
        content_schema: {
          required_shape_roles: ['title', 'core_sentence', 'content_panel', 'point_text', 'metric', 'takeaway'],
          required_shape_role_groups: ['title_text', 'core_claim_text', 'content_container', 'evidence_or_metric_text', 'takeaway_text'],
          min_filled_required_zone_share: 0.8,
        },
        prohibited: ['all content in equal cards', 'no first-glance hierarchy'],
      },
    ],
  };
}

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
      decision_zone: { left_in: 0.95, top_in: 4.4, width_in: 13.6, height_in: 2.25 },
      proof_zone: { left_in: 1.0, top_in: 6.95, width_in: 6.9, height_in: 1.05 },
      takeaway_zone: { left_in: 8.1, top_in: 6.95, width_in: 6.4, height_in: 1.05 },
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
    const height = panelCount >= 4 ? 1.1 : 1.32;
    const step = panelCount >= 4 ? 1.3 : 1.58;
    return { left_in: index % 2 === 0 ? 8.15 : 8.95, top_in: 2.65 + index * step, width_in: 5.25, height_in: height };
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
        bounds: { left_in: 14.22, top_in: 2.72, width_in: 0.74, height_in: 0.74 },
        fill: '#B94624',
        line: 'none',
      },
      {
        shape_id: `${slideId}-ai-signal-connector`,
        kind: 'line',
        role: 'signal_connector',
        quality_role: 'structural',
        layout_zone_id: 'status_zone',
        bounds: { left_in: 14.58, top_in: 3.48, width_in: 0.06, height_in: 2.12 },
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
      bounds: { left_in: 1.08, top_in: 4.12, width_in: 13.22, height_in: 0.06 },
      line: '#B94624',
    }];
  }
  if (layoutFamily === 'judgement_ladder') {
    return [{
      shape_id: `${slideId}-ai-gate-ladder-spine`,
      kind: 'line',
      role: 'gate_ladder_spine',
      quality_role: 'structural',
      layout_zone_id: 'gate_zone',
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
    bounds: { left_in: 1.08, top_in: 6.18, width_in: 13.22, height_in: 0.06 },
    line: '#B94624',
  }];
}

function archetypeSupportShapes(layoutFamily, slideId) {
  const supportText = {
    evidence: '证据链可复核。',
    takeaway: '自主链路已经闭合且证据可复核。',
    metric: '0 溢出。',
    gate: '出口 gate：审查通过后才导出。',
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
      textShape('evidence-note', 'evidence_item', 'evidence_zone', supportText.evidence, { left_in: 1.1, top_in: 7.32, width_in: 7.6, height_in: 0.86 }),
      textShape('takeaway-note', 'takeaway', 'takeaway_zone', supportText.takeaway, { left_in: 10.25, top_in: 7.32, width_in: 4.05, height_in: 0.86 }, '#171C24'),
    ];
  }
  if (layoutFamily === 'timeline_band') {
    return [
      textShape('timeline-evidence', 'evidence_item', 'evidence_zone', supportText.evidence, { left_in: 1.05, top_in: 7.12, width_in: 7.5, height_in: 0.86 }),
      textShape('timeline-takeaway', 'takeaway', 'takeaway_zone', supportText.takeaway, { left_in: 10.15, top_in: 7.12, width_in: 4.0, height_in: 0.86 }, '#171C24'),
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
      textShape('system-gate', 'gate_card', 'gate_zone', supportText.gate, { left_in: 10.2, top_in: 2.18, width_in: 3.7, height_in: 0.86 }, '#171C24'),
      textShape('system-evidence', 'evidence_item', 'evidence_zone', supportText.evidence, { left_in: 1.85, top_in: 6.55, width_in: 3.85, height_in: 0.86 }),
    ];
  }
  if (layoutFamily === 'summary_peak') {
    return [
      textShape('proof-metric', 'metric', 'proof_zone', supportText.metric, { left_in: 1.1, top_in: 7.08, width_in: 6.1, height_in: 0.86 }),
      textShape('final-takeaway', 'takeaway', 'takeaway_zone', supportText.takeaway, { left_in: 8.25, top_in: 7.08, width_in: 5.9, height_in: 0.86 }, '#171C24'),
    ];
  }
  return [
    textShape('signal-metric', 'metric', 'signal_zone', supportText.metric, { left_in: 1.1, top_in: 7.24, width_in: 5.75, height_in: 0.86 }),
    textShape('matrix-takeaway', 'takeaway', 'takeaway_zone', supportText.takeaway, { left_in: 8.0, top_in: 7.24, width_in: 5.95, height_in: 0.86 }, '#171C24'),
  ];
}

function nativeShapePlanForSlide(slide, index) {
  const slideId = safeText(slide?.slide_id, `S${String(index + 1).padStart(2, '0')}`);
  const title = safeText(slide?.title, `Slide ${index + 1}`);
  const points = slidePoints(slide);
  const slotCount = Math.max(2, Math.min(points.length, 4));
  const layoutFamily = safeText(slide?.visual_presentation?.layout_family || slide?.layout_family, 'multi_zone_compare');
  const panelCount = layoutFamily === 'summary_peak' ? Math.max(1, slotCount - 1) : slotCount;
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
      bounds: { left_in: 0.0, top_in: 0.0, width_in: 16.0, height_in: 0.26 },
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
      bounds: { left_in: 0.48, top_in: 0.72, width_in: 0.1, height_in: 2.6 },
      fill: '#B94624',
      line: 'none',
    },
    {
      shape_id: `${slideId}-decor-dot`,
      kind: 'oval',
      role: 'accent_dot',
      quality_role: 'decorative',
      layout_zone_id: 'title_zone',
      bounds: { left_in: 14.3, top_in: 0.7, width_in: 0.28, height_in: 0.28 },
      fill: '#B94624',
      line: 'none',
    },
    {
      shape_id: `${slideId}-page`,
      kind: 'text_box',
      role: 'page_number',
      quality_role: 'auxiliary',
      layout_zone_id: 'takeaway_zone',
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
      ? { left_in: 8.0, top_in: 7.58, width_in: 6.2, height_in: 1.08 }
      : panelGeometry(layoutFamily, Math.max(panelCount, 1), Math.min(pointIndex, panelCount - 1));
    const pointNumber = pointIndex + 1;
    const ladderSlot = layoutFamily === 'judgement_ladder' && !overflowSummaryText;
    const textTop = overflowSummaryText
      ? panelBounds.top_in
      : panelBounds.top_in + (ladderSlot ? 0.22 : layoutFamily === 'ring_cross' ? 0.48 : 0.78);
    const indexTop = overflowSummaryText ? panelBounds.top_in : panelBounds.top_in + (ladderSlot ? 0.24 : 0.16);
    const textLeft = overflowSummaryText
      ? panelBounds.left_in + 1.0
      : panelBounds.left_in + (ladderSlot ? 1.08 : layoutFamily === 'ring_cross' ? 1.12 : 0.24);
    const textWidth = overflowSummaryText
      ? panelBounds.width_in - 1.2
      : panelBounds.width_in - (ladderSlot ? 1.34 : layoutFamily === 'ring_cross' ? 1.15 : 0.48);
    shapes.push({
      shape_id: `${slideId}-slot-${pointNumber}-index`,
      kind: 'text_box',
      role: 'point_index',
      quality_role: 'content',
      layout_zone_id: contentZoneId,
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
      quality_role: 'content',
      layout_zone_id: overflowSummaryText ? 'takeaway_zone' : contentZoneId,
      editable_text: pointText(points[pointIndex], `Concrete audience point ${pointNumber}`),
      bounds: {
        left_in: textLeft,
        top_in: textTop,
        width_in: textWidth,
        height_in: overflowSummaryText
          ? 1.08
          : ladderSlot ? Math.max(0.84, panelBounds.height_in - 0.44)
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

export function buildMockPptNativeShapePlan(meta) {
  const route = safeText(meta?.route);
  const slides = safeArray(meta?.context?.blueprint?.slides);
  const repairFeedback = safeArray(meta?.context?.repair_feedback);
  const isNativeSample = meta?.context?.native_ppt_sample_layout_profile?.required === true
    || safeText(meta?.context?.native_ppt_authoring_mode) === 'native_visual_sample_compact';
  const targetSlideIds = new Set(
    safeArray(meta?.context?.unit_repair_scope?.target_slide_ids)
      .map((slideId) => safeText(slideId))
      .filter(Boolean),
  );
  const authoredSlides = isNativeSample
    ? slides.slice(0, 1).map((slide, index) => buildSampleStatusSlide(slide, index, stableCompositionSignature))
    : slides.map((slide, index) => {
        const slideId = safeText(slide?.slide_id, `S${String(index + 1).padStart(2, '0')}`);
        const nativeShapes = nativeShapePlanForSlide(slide, index);
        return {
          slide_id: slideId,
          title: safeText(slide?.title, `Slide ${index + 1}`),
          layout_family: safeText(slide?.visual_presentation?.layout_family || slide?.layout_family),
          core_sentence: safeText(slide?.core_sentence),
          page_core_content: safeArray(slide?.page_core_content),
          evidence_and_sources: safeArray(slide?.evidence_and_sources),
          layout_intent: {
            ...layoutIntentForSlide(slide, index, slidePoints(slide).length),
            composition_signature: stableCompositionSignature(nativeShapes),
          },
          template_layout_binding: templateBindingForSlide(slide, index, slidePoints(slide).length),
          native_shapes: nativeShapes,
          redcube_svg_ir_intent: {
            root_viewbox: '0 0 1152 648',
            editable_text_required: true,
            required_intents: ['text:title', 'text:point_text', 'rect:content_panel', 'group:content_point'],
          },
          repair_directive: targetSlideIds.has(slideId) ? 'apply screenshot feedback to this editable slide only' : 'preserve passed slide',
        };
      });
  return {
    ai_first_editing_contract: {
      contract_id: 'ppt_native_ai_first_editing_contract_v1',
      creative_owner: 'llm_agent',
      editable_shape_plan_required: true,
      editable_shape_manifest_required: true,
      design_spec_lock_required: true,
      template_layout_grammar_required: true,
      per_slide_layout_binding_required: true,
      shape_quality_role_required: true,
      layout_intent_required: true,
      composition_signature_required: true,
      structural_visual_required: true,
      title_underline_motif_allowed: false,
      concrete_layout_variant_repetition_limit: 2,
      python_helper_role: 'execute_validate_export_only',
      template_substitution_allowed: false,
      preserved_gates: ['visual_director_review', 'screenshot_review', 'export_pptx'],
    },
    test_double_boundary: {
      kind: 'deterministic_codex_test_double',
      fixture_owner: 'tests/helpers/mock-codex-cli-parts/ppt-builders/native.ts',
      purpose: 'ci_contract_route_plumbing_and_fail_closed_quality_tests',
      hardcoded_visual_style_fixture: true,
      proves_visual_design_quality: false,
      display_as_native_ppt_visual_sample_allowed: false,
      replacement_for_live_codex_executor: false,
    },
    editable_shape_plan: {
      contract_kind: 'redcube_ai_first_native_ppt_shape_plan',
      route,
      scope: route === 'repair_pptx_native' ? 'page_repair' : 'deck_authoring',
      target_slide_ids: [...targetSlideIds],
      deck_layout_rhythm_plan: {
        owner: 'llm_agent',
        required: true,
        slides: authoredSlides.map((slide, index) => {
          const layoutFamily = safeText(slide?.visual_presentation?.layout_family || slide?.layout_family, 'multi_zone_compare');
          const binding = isNativeSample ? slide.template_layout_binding : templateBindingForSlide(slide, index, slidePoints(slide).length);
          const layoutIntent = isNativeSample ? slide.layout_intent : layoutIntentForSlide(slide, index, slidePoints(slide).length);
          return {
            slide_id: safeText(slide?.slide_id, `S${String(index + 1).padStart(2, '0')}`),
            rhetorical_role: layoutIntent.rhetorical_role,
            selected_archetype: binding.selected_archetype,
            primary_grid: layoutIntent.primary_grid,
            composition_signature_budget: `${layoutFamily}:budget:${index + 1}`,
            proof_object: layoutIntent.non_text_visual,
          };
        }),
      },
      design_spec_lock: {
        spec_id: 'native_pptx_mock_spec_lock_v1',
        owner: 'llm_agent',
        source: 'mock_visual_direction_fixture',
        design_owner: 'test_double_only',
        motif: 'hardcoded_ci_fixture_not_a_presentation_template',
        visual_motif: 'hardcoded_ci_fixture_not_a_presentation_template',
        layout_archetypes: isNativeSample
          ? ['sample_status_proof_board', 'sample_decision_proof_split', 'sample_proof_band']
          : [
              'cover_signal',
              'multi_zone_compare',
              'timeline_band',
              'judgement_ladder',
              'ring_cross',
              'summary_peak',
            ],
        palette: {
          canvas: '#F6F2EA',
          ink: '#171C24',
          muted: '#5B6570',
          accent: '#B94624',
          panel: '#EFE6D6',
        },
        typography: {
          title_pt_min: 36,
          body_pt_min: 18,
          point_index_pt_min: 16,
        },
        grid: {
          edge_margin_in_min: 0.6,
          inter_block_gap_in_min: 0.32,
        },
        layout_rhythm: {
          repeated_concrete_composition_limit: 2,
          required_distinct_composition_share: 0.75,
        },
        professional_design_brief: {
          design_register: 'executive proof deck',
          reference_style_family: 'template-profiled multi-zone native PPT board',
          first_glance_hierarchy: 'audience-facing claim first, then structured proof objects',
          template_profile_strategy: 'semantic master layouts with explicit zones and placeholder capacity',
          capacity_strategy: 'shorten copy or reduce slots before coordinates if text cannot fit at font floors',
          forbidden_amateur_patterns: ['generic equal-card grid', 'decorative title underline', 'overfilled receipt ledger'],
        },
        borrowed_discipline: {
          from: 'ppt-master',
          adopted: ['spec_lock', 'template_layout_grammar', 'template_profile', 'semantic_layout_selection', 'reference_deck_analysis', 'per_page_visual_plan', 'rendered_quality_gate'],
          not_adopted: ['ppt_master_product_entry_owner', 'mock_helper_as_visual_template'],
        },
        borrowed_principles: [
          'ppt_master_style_spec_lock',
          'template_layout_grammar',
          'template_profile',
          'semantic_layout_selection',
          'reference_deck_analysis',
          'per_page_visual_plan',
          'explicit_grid',
          'font_floor',
          'layout_rhythm',
          'rendered_quality_gate',
        ],
        qa_gates: ['bounds', 'font_floor', 'text_fit', 'structural_visual', 'slot_fill', 'layout_variety', 'true_render_screenshot'],
      },
      template_layout_grammar: isNativeSample ? sampleTemplateLayoutGrammar() : templateLayoutGrammar(),
      authoring_ir: {
        kind: 'redcube_svg_ir',
        version: 1,
        required: true,
        strict_svg_preflight_required: true,
        allowed_svg_tags: ['svg', 'g', 'rect', 'text'],
      },
      consumed_feedback_count: repairFeedback.length,
      slides: authoredSlides,
    },
  };
}
