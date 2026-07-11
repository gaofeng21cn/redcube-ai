
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

export { templateLayoutGrammar };
