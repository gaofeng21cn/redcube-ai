// @ts-nocheck

export function archetypeSupportShapes(layoutFamily, slideId) {
  const supportQualityRole = 'content';
  const supportText = {
    evidence: '证据链可复核。',
    takeaway: '自主链路已经闭合且证据可复核。',
    metric: '0 溢出。',
    gate: '出口 gate：审查通过后才导出。',
  };
  if (layoutFamily === 'cover_signal') {
    return [
      {
        shape_id: `${slideId}-evidence-note`,
        kind: 'text_box',
        role: 'evidence_item',
        quality_role: supportQualityRole,
        layout_zone_id: 'evidence_zone',
        editable_text: supportText.evidence,
        bounds: { left_in: 0.95, top_in: 7.45, width_in: 7.4, height_in: 0.86 },
        font_size: 18,
        color: '#5B6570',
        fill: 'none',
        line: 'none',
      },
      {
        shape_id: `${slideId}-takeaway-note`,
        kind: 'text_box',
        role: 'takeaway',
        quality_role: supportQualityRole,
        layout_zone_id: 'takeaway_zone',
        editable_text: supportText.takeaway,
        bounds: { left_in: 8.75, top_in: 7.45, width_in: 5.75, height_in: 0.86 },
        font_size: 18,
        color: '#171C24',
        fill: 'none',
        line: 'none',
      },
    ];
  }
  if (layoutFamily === 'timeline_band') {
    return [
      {
        shape_id: `${slideId}-timeline-evidence`,
        kind: 'text_box',
        role: 'evidence_item',
        quality_role: supportQualityRole,
        layout_zone_id: 'evidence_zone',
        editable_text: supportText.evidence,
        bounds: { left_in: 0.95, top_in: 7.45, width_in: 7.4, height_in: 0.86 },
        font_size: 18,
        color: '#5B6570',
        fill: 'none',
        line: 'none',
      },
      {
        shape_id: `${slideId}-timeline-takeaway`,
        kind: 'text_box',
        role: 'takeaway',
        quality_role: supportQualityRole,
        layout_zone_id: 'takeaway_zone',
        editable_text: supportText.takeaway,
        bounds: { left_in: 8.75, top_in: 7.45, width_in: 5.75, height_in: 0.86 },
        font_size: 18,
        color: '#171C24',
        fill: 'none',
        line: 'none',
      },
    ];
  }
  if (layoutFamily === 'judgement_ladder') {
    return [
      {
        shape_id: `${slideId}-gate-label`,
        kind: 'text_box',
        role: 'gate_card',
        quality_role: supportQualityRole,
        layout_zone_id: 'gate_zone',
        editable_text: supportText.gate,
        bounds: { left_in: 8.0, top_in: 6.65, width_in: 5.0, height_in: 0.86 },
        font_size: 18,
        color: '#171C24',
        fill: 'none',
        line: 'none',
      },
      {
        shape_id: `${slideId}-ladder-evidence`,
        kind: 'text_box',
        role: 'evidence_item',
        quality_role: supportQualityRole,
        layout_zone_id: 'evidence_zone',
        editable_text: supportText.evidence,
        bounds: { left_in: 0.95, top_in: 7.5, width_in: 6.2, height_in: 0.86 },
        font_size: 18,
        color: '#5B6570',
        fill: 'none',
        line: 'none',
      },
    ];
  }
  if (layoutFamily === 'ring_cross' || layoutFamily === 'workflow_map') {
    return [
      {
        shape_id: `${slideId}-system-gate`,
        kind: 'text_box',
        role: 'route_label',
        quality_role: supportQualityRole,
        layout_zone_id: 'gate_zone',
        editable_text: supportText.gate,
        bounds: { left_in: 10.35, top_in: 2.78, width_in: 3.95, height_in: 0.86 },
        font_size: 18,
        color: '#171C24',
        fill: 'none',
        line: 'none',
      },
      {
        shape_id: `${slideId}-system-evidence`,
        kind: 'text_box',
        role: 'evidence_item',
        quality_role: supportQualityRole,
        layout_zone_id: 'evidence_zone',
        editable_text: supportText.evidence,
        bounds: { left_in: 1.0, top_in: 7.45, width_in: 7.4, height_in: 0.86 },
        font_size: 18,
        color: '#5B6570',
        fill: 'none',
        line: 'none',
      },
    ];
  }
  if (layoutFamily === 'summary_peak') {
    return [
      {
        shape_id: `${slideId}-proof-metric`,
        kind: 'text_box',
        role: 'metric',
        quality_role: supportQualityRole,
        layout_zone_id: 'proof_zone',
        editable_text: supportText.metric,
        bounds: { left_in: 0.95, top_in: 7.5, width_in: 6.0, height_in: 0.86 },
        font_size: 18,
        color: '#5B6570',
        fill: 'none',
        line: 'none',
      },
      {
        shape_id: `${slideId}-final-takeaway`,
        kind: 'text_box',
        role: 'takeaway',
        quality_role: supportQualityRole,
        layout_zone_id: 'takeaway_zone',
        editable_text: supportText.takeaway,
        bounds: { left_in: 7.35, top_in: 7.5, width_in: 6.8, height_in: 0.86 },
        font_size: 18,
        color: '#171C24',
        fill: 'none',
        line: 'none',
      },
    ];
  }
  return [
    {
      shape_id: `${slideId}-signal-metric`,
      kind: 'text_box',
      role: 'metric',
      quality_role: supportQualityRole,
      layout_zone_id: 'signal_zone',
      editable_text: supportText.metric,
      bounds: { left_in: 0.95, top_in: 7.5, width_in: 6.0, height_in: 0.86 },
      font_size: 18,
      color: '#5B6570',
      fill: 'none',
      line: 'none',
    },
    {
      shape_id: `${slideId}-matrix-takeaway`,
      kind: 'text_box',
      role: 'takeaway',
      quality_role: supportQualityRole,
      layout_zone_id: 'takeaway_zone',
      editable_text: supportText.takeaway,
      bounds: { left_in: 7.35, top_in: 7.5, width_in: 6.8, height_in: 0.86 },
      font_size: 18,
      color: '#171C24',
      fill: 'none',
      line: 'none',
    },
  ];
}

export function supplementalContractShapes(layoutFamily, slideId) {
  const textBase = {
    kind: 'text_box',
    quality_role: 'content',
    font_size: 18,
    color: '#171C24',
    fill: 'none',
    line: 'none',
  };
  if (layoutFamily === 'cover_signal') {
    return [
      {
        ...textBase,
        shape_id: `${slideId}-evidence-summary`,
        role: 'evidence_item',
        layout_zone_id: 'evidence_zone',
        editable_text: '关键证据已经落盘，可按文件清单复核。',
        bounds: { left_in: 1.0, top_in: 6.52, width_in: 6.25, height_in: 0.86 },
      },
      {
        ...textBase,
        shape_id: `${slideId}-takeaway-summary`,
        role: 'takeaway',
        layout_zone_id: 'takeaway_zone',
        editable_text: '下一步按同一口径进入审查。',
        bounds: { left_in: 8.1, top_in: 6.52, width_in: 5.8, height_in: 0.86 },
      },
    ];
  }
  if (layoutFamily === 'timeline_band') {
    return [{
      ...textBase,
      shape_id: `${slideId}-timeline-evidence`,
      role: 'evidence_item',
      layout_zone_id: 'evidence_zone',
      editable_text: '每个里程碑都保留可复核证据。',
      bounds: { left_in: 1.0, top_in: 6.52, width_in: 7.2, height_in: 0.86 },
    }];
  }
  if (layoutFamily === 'judgement_ladder') {
    return [];
  }
  if (['ring_cross', 'workflow_map'].includes(layoutFamily)) {
    return [{
      ...textBase,
      shape_id: `${slideId}-system-evidence`,
      role: 'evidence_item',
      layout_zone_id: 'evidence_zone',
      editable_text: '证据区记录导出、截图和清单。',
      bounds: { left_in: 1.0, top_in: 6.52, width_in: 7.2, height_in: 0.86 },
    }];
  }
  if (layoutFamily === 'summary_peak') {
    return [];
  }
  return [{
    ...textBase,
    shape_id: `${slideId}-matrix-evidence`,
    role: 'metric',
    layout_zone_id: 'signal_zone',
    editable_text: '证据区给出可复核交付信号。',
    bounds: { left_in: 4.75, top_in: 6.52, width_in: 4.8, height_in: 0.86 },
  }];
}

export function templateLayoutGrammar() {
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
      source_projects: ['ppt-master', 'agent-slides', 'PPTAgent', 'pptx-from-layouts-skill', 'officecli-pptx'],
      rule: 'Treat templates and reference decks as layout intelligence before coordinates.',
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
          max_audience_text_shapes: 12,
          min_body_font_pt: 18,
        },
        prohibited: ['connector crossing readable text', 'three narrow route cards', 'labels placed on rails'],
      },
      {
        archetype_id: 'executive_status_board',
        use_when: 'one-slide status proof or decision summary',
        layout_description: 'Large status cards or panels in the middle with a separate proof/takeaway band; suitable for a low-density executive slide.',
        required_zones: ['title_zone', 'claim_zone', 'status_zone', 'evidence_zone', 'takeaway_zone'],
        content_schema: {
          required_shape_roles: ['title', 'core_sentence', 'content_panel', 'point_text', 'evidence_item', 'takeaway'],
          required_shape_role_groups: ['title_text', 'core_claim_text', 'content_container', 'audience_body_text', 'evidence_or_metric_text', 'takeaway_text'],
          min_filled_required_zone_share: 0.8,
          max_audience_text_shapes: 12,
          min_card_width_in: 3.3,
          min_card_height_in: 1.55,
        },
        prohibited: ['receipt label pile', 'empty four-card grid', 'tiny KPI badges'],
      },
      {
        archetype_id: 'evidence_timeline',
        use_when: 'sequence, milestone, or proof evolution',
        layout_description: 'Horizontal or vertical timeline rail with milestone nodes, labels placed off the rail, and proof/takeaway zones separated from the sequence.',
        required_zones: ['title_zone', 'claim_zone', 'timeline_zone', 'evidence_zone', 'takeaway_zone'],
        content_schema: {
          required_shape_roles: ['title', 'core_sentence', 'timeline_panel', 'point_text', 'evidence_item', 'takeaway'],
          required_shape_role_groups: ['title_text', 'core_claim_text', 'timeline_marker', 'audience_body_text', 'evidence_or_metric_text'],
          min_filled_required_zone_share: 0.8,
          max_milestone_count: 4,
          min_body_font_pt: 18,
        },
        prohibited: ['timeline rail through labels', 'milestone text below 18pt'],
      },
      {
        archetype_id: 'risk_control_matrix',
        use_when: 'compare risks, controls, gates, or quality criteria',
        layout_description: 'Matrix or comparison field with filled cells, clear row/column grammar, and a separate signal or takeaway area.',
        required_zones: ['title_zone', 'claim_zone', 'matrix_zone', 'signal_zone', 'takeaway_zone'],
        content_schema: {
          required_shape_roles: ['title', 'core_sentence', 'compare_panel', 'point_text', 'metric', 'takeaway'],
          required_shape_role_groups: ['title_text', 'core_claim_text', 'matrix_or_compare_container', 'audience_body_text', 'evidence_or_metric_text'],
          min_filled_required_zone_share: 0.8,
          empty_cell_allowed: false,
          min_body_font_pt: 18,
        },
        prohibited: ['unfilled matrix cell', 'four-card template with fewer than four facts'],
      },
      {
        archetype_id: 'decision_dashboard',
        use_when: 'decision, recommendation, operating readout, or proof dashboard',
        layout_description: 'A decision or recommendation zone with supporting proof objects; visual hierarchy starts from the decision, not equal cards.',
        required_zones: ['title_zone', 'claim_zone', 'decision_zone', 'proof_zone', 'takeaway_zone'],
        content_schema: {
          required_shape_roles: ['title', 'core_sentence', 'content_panel', 'point_text', 'metric', 'takeaway'],
          required_shape_role_groups: ['title_text', 'core_claim_text', 'content_container', 'audience_body_text', 'evidence_or_metric_text', 'takeaway_text'],
          min_filled_required_zone_share: 0.8,
          first_glance_hierarchy_required: true,
          min_body_font_pt: 18,
        },
        prohibited: ['all content in equal cards', 'no first-glance hierarchy'],
      },
    ],
  };
}

function templateZonesForLayout(layoutFamily) {
  const titleZone = { left_in: 0.65, top_in: 0.4, width_in: 13.35, height_in: 2.05 };
  const claimZone = { left_in: 0.75, top_in: 1.45, width_in: 13.25, height_in: 2.15 };
  if (layoutFamily === 'cover_signal') {
    return {
      title_zone: titleZone,
      claim_zone: claimZone,
      status_zone: { left_in: 0.7, top_in: 2.75, width_in: 14.3, height_in: 3.45 },
      evidence_zone: { left_in: 0.7, top_in: 6.15, width_in: 14.3, height_in: 2.25 },
      takeaway_zone: { left_in: 0.7, top_in: 6.15, width_in: 14.3, height_in: 2.25 },
    };
  }
  if (layoutFamily === 'timeline_band') {
    return {
      title_zone: titleZone,
      claim_zone: claimZone,
      timeline_zone: { left_in: 0.7, top_in: 2.55, width_in: 14.3, height_in: 3.75 },
      evidence_zone: { left_in: 0.7, top_in: 6.15, width_in: 14.3, height_in: 2.25 },
      takeaway_zone: { left_in: 0.7, top_in: 6.15, width_in: 14.3, height_in: 2.25 },
    };
  }
  if (layoutFamily === 'judgement_ladder') {
    return {
      title_zone: titleZone,
      claim_zone: claimZone,
      system_map_zone: { left_in: 0.7, top_in: 2.55, width_in: 14.3, height_in: 4.95 },
      evidence_zone: { left_in: 0.7, top_in: 6.15, width_in: 14.3, height_in: 2.25 },
      gate_zone: { left_in: 7.0, top_in: 2.55, width_in: 7.5, height_in: 5.3 },
      takeaway_zone: { left_in: 0.7, top_in: 6.15, width_in: 14.3, height_in: 2.25 },
    };
  }
  if (layoutFamily === 'ring_cross' || layoutFamily === 'workflow_map') {
    return {
      title_zone: titleZone,
      claim_zone: claimZone,
      system_map_zone: { left_in: 0.7, top_in: 2.55, width_in: 14.3, height_in: 3.95 },
      gate_zone: { left_in: 9.4, top_in: 2.55, width_in: 5.2, height_in: 3.65 },
      evidence_zone: { left_in: 0.7, top_in: 6.15, width_in: 14.3, height_in: 2.25 },
    };
  }
  if (layoutFamily === 'summary_peak') {
    return {
      title_zone: titleZone,
      claim_zone: claimZone,
      decision_zone: { left_in: 0.7, top_in: 2.55, width_in: 14.3, height_in: 3.9 },
      proof_zone: { left_in: 0.7, top_in: 6.15, width_in: 14.3, height_in: 2.25 },
      takeaway_zone: { left_in: 0.7, top_in: 6.15, width_in: 14.3, height_in: 2.25 },
    };
  }
  return {
    title_zone: titleZone,
    claim_zone: claimZone,
    matrix_zone: { left_in: 0.7, top_in: 2.55, width_in: 14.3, height_in: 3.85 },
    signal_zone: { left_in: 0.7, top_in: 6.15, width_in: 14.3, height_in: 2.25 },
    takeaway_zone: { left_in: 0.7, top_in: 6.15, width_in: 14.3, height_in: 2.25 },
  };
}

function contentZoneForLayout(layoutFamily) {
  return {
    cover_signal: 'status_zone',
    timeline_band: 'timeline_zone',
    judgement_ladder: 'system_map_zone',
    ring_cross: 'system_map_zone',
    workflow_map: 'system_map_zone',
    summary_peak: 'decision_zone',
  }[layoutFamily] || 'matrix_zone';
}

export function archetypeForLayout(layoutFamily) {
  return {
    cover_signal: 'executive_status_board',
    timeline_band: 'evidence_timeline',
    judgement_ladder: 'professional_system_map',
    ring_cross: 'professional_system_map',
    workflow_map: 'professional_system_map',
    summary_peak: 'decision_dashboard',
  }[layoutFamily] || 'risk_control_matrix';
}

export function templateBindingForSlide(slideId, layoutFamily) {
  return {
    selected_archetype: archetypeForLayout(layoutFamily),
    archetype_instance_id: `${slideId}-${archetypeForLayout(layoutFamily)}`,
    rhythm_role: layoutFamily === 'summary_peak' ? 'close' : layoutFamily,
    zone_gap_in_min: 0.32,
    zone_inset_in_min: 0.15,
    zones: Object.entries(templateZonesForLayout(layoutFamily)).map(([zoneId, bounds]) => ({
      zone_id: zoneId,
      semantic_role: zoneId.replace(/_zone$/, ''),
      bounds,
      intended_content: `${zoneId.replace(/_/g, ' ')} for editable native PPT proof`,
      min_font_pt: zoneId === 'title_zone' ? 36 : 18,
      safe_inset_in: 0.15,
    })),
  };
}

export function withLayoutZone(shape, layoutFamily) {
  if (shape?.layout_zone_id) {
    return shape;
  }
  const role = String(shape.role || '');
  const top = Number(shape?.bounds?.top_in || 0);
  const left = Number(shape?.bounds?.left_in || 0);
  if (role === 'title' || role === 'background_accent' || role === 'accent_anchor' || role === 'accent_dot') {
    return { ...shape, layout_zone_id: 'title_zone' };
  }
  if (role === 'core_sentence') {
    return { ...shape, layout_zone_id: 'claim_zone' };
  }
  if (role === 'page_number') {
    return { ...shape, layout_zone_id: 'takeaway_zone' };
  }
  if (role.includes('gate') && ['workflow_map', 'ring_cross', 'judgement_ladder'].includes(layoutFamily)) {
    return { ...shape, layout_zone_id: 'gate_zone' };
  }
  if (role.includes('evidence') || role.includes('metric')) {
    if (layoutFamily === 'summary_peak') return { ...shape, layout_zone_id: 'proof_zone' };
    if (['workflow_map', 'ring_cross', 'judgement_ladder', 'timeline_band'].includes(layoutFamily)) {
      return { ...shape, layout_zone_id: 'evidence_zone' };
    }
    return { ...shape, layout_zone_id: 'signal_zone' };
  }
  if (role === 'takeaway_panel' && layoutFamily === 'summary_peak' && top < 6.0) {
    return { ...shape, layout_zone_id: 'decision_zone' };
  }
  if (role.includes('takeaway') || role.includes('loop_band')) {
    if (['workflow_map', 'ring_cross'].includes(layoutFamily)) {
      return { ...shape, layout_zone_id: 'evidence_zone' };
    }
    return { ...shape, layout_zone_id: 'takeaway_zone' };
  }
  if (layoutFamily === 'summary_peak' && top >= 6.0) {
    return { ...shape, layout_zone_id: 'proof_zone' };
  }
  if (layoutFamily === 'judgement_ladder' && role.includes('gate') && left >= 7.0) {
    return { ...shape, layout_zone_id: 'gate_zone' };
  }
  return { ...shape, layout_zone_id: contentZoneForLayout(layoutFamily) };
}

export function withTemplateLayoutDefaults(slide) {
  const slideId = String(slide?.slide_id || 'S01').trim() || 'S01';
  const layoutFamily = String(slide?.layout_family || 'multi_zone_compare').trim() || 'multi_zone_compare';
  const nativeShapes = Array.isArray(slide?.native_shapes) ? slide.native_shapes : [];
  return {
    ...slide,
    template_layout_binding: slide?.template_layout_binding || templateBindingForSlide(slideId, layoutFamily),
    native_shapes: nativeShapes.map((shape) => (
      shape?.layout_zone_id ? shape : withLayoutZone(shape, layoutFamily)
    )),
  };
}
