// @ts-nocheck

const STAGES = [
  {
    stage_id: 'source_intake',
    stage_kind: 'intake',
    title: 'Source intake',
    goal: 'Freeze source truth, audience, constraints, and missing-material risk before visual planning.',
    domain_stage_refs: ['source_readiness', 'research', 'storyline'],
    allowed_action_refs: ['get_product_status', 'get_product_entry_manifest'],
    requires: ['visual_delivery_request_received'],
    ensures: ['source_truth_frozen'],
    next_stage_refs: ['communication_strategy'],
    trust_lane: 'domain_agent',
    runtime_event_refs: ['runtime_event:rca.source_intake.source_truth_frozen'],
    outputs: [
      { ref_kind: 'json_pointer', ref: '/source_readiness', role: 'source_truth' },
      { ref_kind: 'json_pointer', ref: '/progress_projection', role: 'progress_projection' },
    ],
  },
  {
    stage_id: 'communication_strategy',
    stage_kind: 'planning',
    title: 'Communication strategy',
    goal: 'Shape storyline, outline, audience fit, information density, and key takeaways.',
    domain_stage_refs: ['storyline', 'detailed_outline', 'slide_blueprint', 'single_note_plan', 'poster_blueprint'],
    allowed_action_refs: ['invoke_product_entry', 'get_product_entry_session'],
    requires: ['source_truth_frozen'],
    ensures: ['communication_strategy_accepted'],
    next_stage_refs: ['visual_direction'],
    trust_lane: 'ai_decision',
    independent_gate_receipt_required: true,
    runtime_event_refs: ['runtime_event:rca.communication_strategy.accepted'],
    outputs: [
      { ref_kind: 'json_pointer', ref: '/session_continuity', role: 'strategy_checkpoint' },
      { ref_kind: 'json_pointer', ref: '/progress_projection', role: 'stage_progress' },
    ],
  },
  {
    stage_id: 'visual_direction',
    stage_kind: 'planning',
    title: 'Visual direction',
    goal: 'Define layout density, image strategy, visual language, and feasibility before artifact creation.',
    domain_stage_refs: ['visual_direction'],
    allowed_action_refs: ['invoke_product_entry', 'get_product_entry_session'],
    requires: ['communication_strategy_accepted'],
    ensures: ['visual_direction_accepted'],
    next_stage_refs: ['artifact_creation'],
    trust_lane: 'ai_decision',
    independent_gate_receipt_required: true,
    runtime_event_refs: ['runtime_event:rca.visual_direction.accepted'],
    outputs: [
      { ref_kind: 'json_pointer', ref: '/progress_projection', role: 'visual_direction_status' },
    ],
  },
  {
    stage_id: 'artifact_creation',
    stage_kind: 'creation',
    title: 'Artifact creation',
    goal: 'Create the visual deliverable through the selected RCA route while preserving source truth.',
    domain_stage_refs: ['author_image_pages', 'render_html', 'author_pptx_native'],
    allowed_action_refs: ['invoke_product_entry', 'run_image_ppt_proof', 'run_native_ppt_proof'],
    requires: ['visual_direction_accepted'],
    ensures: ['artifact_candidate_rendered'],
    next_stage_refs: ['review_and_revision'],
    trust_lane: 'codex_executor',
    runtime_event_refs: ['runtime_event:rca.artifact_creation.candidate_rendered'],
    outputs: [
      { ref_kind: 'json_pointer', ref: '/artifact_inventory', role: 'artifact_inventory' },
    ],
  },
  {
    stage_id: 'review_and_revision',
    stage_kind: 'review',
    title: 'Review and revision',
    goal: 'Run visual, screenshot, source-fidelity, and repair gates before export.',
    domain_stage_refs: ['visual_director_review', 'screenshot_review', 'repair_image_pages', 'fix_html', 'repair_pptx_native'],
    allowed_action_refs: ['invoke_product_entry', 'get_product_entry_session'],
    requires: ['artifact_candidate_rendered'],
    ensures: ['visual_review_gate_receipt_recorded'],
    next_stage_refs: ['package_and_handoff'],
    trust_lane: 'ai_decision',
    independent_gate_receipt_required: true,
    runtime_event_refs: ['runtime_event:rca.review_and_revision.gate_recorded'],
    visual_pattern_memory_refs: [
      '/domain_memory_descriptor_locator/writeback_proposal_generator',
      '/domain_memory_descriptor_locator/accept_reject_command',
    ],
    outputs: [
      { ref_kind: 'json_pointer', ref: '/review_state', role: 'review_projection' },
      { ref_kind: 'json_pointer', ref: '/publication_projection', role: 'publication_projection' },
      { ref_kind: 'json_pointer', ref: '/domain_memory_descriptor_locator/writeback_proposal_generator', role: 'memory_writeback_proposal_contract' },
    ],
  },
  {
    stage_id: 'package_and_handoff',
    stage_kind: 'packaging',
    title: 'Package and handoff',
    goal: 'Export final files, preview metadata, resume handles, and operator handoff refs.',
    domain_stage_refs: ['export_pptx', 'publish_copy', 'export_bundle', 'export_poster'],
    allowed_action_refs: ['get_product_entry_session', 'get_product_entry_manifest', 'export_product_sidecar'],
    requires: ['visual_review_gate_receipt_recorded'],
    ensures: ['export_handoff_receipt_recorded'],
    next_stage_refs: [],
    trust_lane: 'domain_agent',
    independent_gate_receipt_required: true,
    runtime_event_refs: ['runtime_event:rca.package_and_handoff.export_handoff_recorded'],
    visual_pattern_memory_refs: [
      '/domain_memory_descriptor_locator/writeback_receipt_locator',
      '/domain_memory_descriptor_locator/operator_receipt_projection',
    ],
    outputs: [
      { ref_kind: 'json_pointer', ref: '/artifact_inventory', role: 'final_artifacts' },
      { ref_kind: 'json_pointer', ref: '/session_continuity', role: 'resume_handle' },
      { ref_kind: 'json_pointer', ref: '/domain_memory_descriptor_locator/operator_receipt_projection', role: 'operator_memory_receipt_projection' },
    ],
  },
];

const PLANE_SOURCE_REFS = [
  { ref_kind: 'json_pointer', ref: '/family_action_catalog', role: 'allowed_action_catalog' },
  { ref_kind: 'json_pointer', ref: '/deliverable_facade/family_route_policy', role: 'route_stage_policy' },
  { ref_kind: 'json_pointer', ref: '/progress_projection', role: 'runtime_watch_projection' },
  { ref_kind: 'json_pointer', ref: '/review_state', role: 'review_truth_projection' },
  { ref_kind: 'json_pointer', ref: '/publication_projection', role: 'publication_projection' },
  { ref_kind: 'json_pointer', ref: '/artifact_inventory', role: 'artifact_authority_projection' },
];

const CANONICAL_STAGE_PROMPT_REFS = {
  source_intake: 'agent/prompts/source_intake.md',
  communication_strategy: 'agent/prompts/communication_strategy.md',
  visual_direction: 'agent/prompts/visual_direction.md',
  artifact_creation: 'agent/prompts/artifact_creation.md',
  review_and_revision: 'agent/prompts/review_and_revision.md',
  package_and_handoff: 'agent/prompts/package_and_handoff.md',
};

const CANONICAL_STAGE_SKILL_REFS = {
  source_intake: ['agent/skills/visual_deliverable_authoring.md'],
  communication_strategy: ['agent/skills/visual_deliverable_authoring.md'],
  visual_direction: ['agent/skills/visual_deliverable_authoring.md'],
  artifact_creation: [
    'agent/skills/visual_deliverable_authoring.md',
    'agent/skills/native_helper_policy.md',
  ],
  review_and_revision: [
    'agent/skills/visual_deliverable_authoring.md',
    'agent/skills/visual_memory_policy.md',
  ],
  package_and_handoff: [
    'agent/skills/native_helper_policy.md',
    'agent/skills/visual_memory_policy.md',
  ],
};

const CANONICAL_STAGE_KNOWLEDGE_REFS = {
  source_intake: [
    'agent/knowledge/visual_truth_boundaries.md',
    'agent/knowledge/owner_receipt_policy.md',
  ],
  communication_strategy: [
    'agent/knowledge/communication_visual_direction.md',
    'agent/knowledge/visual_truth_boundaries.md',
  ],
  visual_direction: [
    'agent/knowledge/communication_visual_direction.md',
    'agent/knowledge/visual_truth_boundaries.md',
  ],
  artifact_creation: [
    'agent/knowledge/artifact_and_export_authority.md',
    'agent/knowledge/visual_truth_boundaries.md',
  ],
  review_and_revision: [
    'agent/knowledge/review_export_memory.md',
    'agent/knowledge/owner_receipt_policy.md',
  ],
  package_and_handoff: [
    'agent/knowledge/artifact_and_export_authority.md',
    'agent/knowledge/review_export_memory.md',
    'agent/knowledge/owner_receipt_policy.md',
  ],
};

const CANONICAL_STAGE_QUALITY_GATE_REFS = {
  source_intake: [
    { ref: 'agent/quality_gates/source_and_truth.md', role: 'source_truth_gate' },
    { ref: 'agent/quality_gates/visual_authority_boundaries.md', role: 'owner_receipt_gate' },
  ],
  communication_strategy: [
    { ref: 'agent/quality_gates/communication_and_direction.md', role: 'communication_strategy_gate' },
    { ref: 'agent/quality_gates/visual_authority_boundaries.md', role: 'owner_receipt_gate' },
  ],
  visual_direction: [
    { ref: 'agent/quality_gates/communication_and_direction.md', role: 'visual_direction_gate' },
    { ref: 'agent/quality_gates/visual_authority_boundaries.md', role: 'owner_receipt_gate' },
  ],
  artifact_creation: [
    { ref: 'agent/quality_gates/artifact_authority.md', role: 'artifact_authority_gate' },
    { ref: 'agent/quality_gates/visual_authority_boundaries.md', role: 'owner_receipt_gate' },
  ],
  review_and_revision: [
    { ref: 'agent/quality_gates/review_export_memory.md', role: 'review_export_memory_gate' },
    { ref: 'agent/quality_gates/visual_authority_boundaries.md', role: 'owner_receipt_gate' },
  ],
  package_and_handoff: [
    { ref: 'agent/quality_gates/artifact_authority.md', role: 'artifact_handoff_gate' },
    { ref: 'agent/quality_gates/review_export_memory.md', role: 'owner_receipt_gate' },
  ],
};

function repoPathRefs(refs, role) {
  return refs.map((ref) => ({
    ref_kind: 'repo_path',
    ref,
    role,
  }));
}

function buildFreshness(sourceRefs) {
  return {
    status: 'current',
    checked_at: 'manifest_build',
    source_ref_count: sourceRefs.length,
    stale_if_missing: sourceRefs.map((sourceRef) => sourceRef.ref),
  };
}

function buildActionParity(stage, actionIds) {
  const missing_action_refs = stage.allowed_action_refs.filter((actionRef) => !actionIds.has(actionRef));
  return {
    status: missing_action_refs.length === 0 ? 'aligned' : 'missing_action_refs',
    family_action_catalog_ref: '/family_action_catalog',
    allowed_action_refs: stage.allowed_action_refs,
    missing_action_refs,
  };
}

function buildCohortLoopRefs(stage) {
  return {
    source_scope_refs: [
      { ref_kind: 'route_stage_refs', ref: stage.domain_stage_refs, role: 'rca_visual_stage_source_scope' },
      {
        ref_kind: 'json_pointer',
        ref: `/family_stage_control_plane/stages/${stage.stage_id}/source_refs`,
        role: 'stage_source_ref_projection',
      },
    ],
    cohort_query_refs: [
      { ref_kind: 'json_pointer', ref: '/source_readiness', role: 'auditable_visual_source_query' },
    ],
    trigger_refs: [
      {
        ref_kind: 'queue_ref',
        ref: `opl://family-stage-queue/redcube_ai/${stage.stage_id}`,
        role: 'opl_provider_stage_launch_trigger',
      },
      { ref_kind: 'action_ref', ref: stage.allowed_action_refs, role: 'rca_guarded_action_trigger_candidates' },
    ],
    monitor_refs: [
      { ref_kind: 'json_pointer', ref: '/progress_projection', role: 'visual_stage_progress_monitor' },
      { ref_kind: 'json_pointer', ref: '/session_continuity', role: 'session_continuity_monitor' },
    ],
    dashboard_metric_refs: [
      {
        ref_kind: 'json_pointer',
        ref: `/family_stage_control_plane/stages/${stage.stage_id}/freshness`,
        role: 'operator_stage_freshness_metric',
      },
    ],
    metric_refs: [
      {
        ref_kind: 'metric_ref',
        ref: `metric:rca/${stage.stage_id}/expected-success`,
        role: 'expected_success_ref',
      },
      {
        ref_kind: 'metric_ref',
        ref: `metric:rca/${stage.stage_id}/boundary-success-rate`,
        role: 'boundary_success_rate_ref',
      },
      {
        ref_kind: 'metric_ref',
        ref: `metric:rca/${stage.stage_id}/runtime-event-coverage`,
        role: 'runtime_event_coverage',
      },
      {
        ref_kind: 'metric_ref',
        ref: `metric:rca/${stage.stage_id}/owner-receipt-coverage`,
        role: 'owner_receipt_coverage',
      },
    ],
  };
}

function buildReplayEvidenceRefs(stage) {
  const appendOnlyEventLogRef = `event-log:rca/stages/${stage.stage_id}`;
  const attemptLedgerRef = `attempt-ledger:opl/redcube_ai/${stage.stage_id}`;
  const closeoutReceiptRef = `closeout_receipt:rca/${stage.stage_id}`;
  const ownerReceiptRef = `owner_receipt:${stage.stage_id}`;
  return {
    replay_evidence_refs: [
      { ref_kind: 'event_log_ref', ref: appendOnlyEventLogRef, role: 'append_only_event_log_ref' },
      { ref_kind: 'attempt_ledger_ref', ref: attemptLedgerRef, role: 'opl_stage_attempt_ledger_ref' },
      { ref_kind: 'runtime_event_ref', ref: stage.runtime_event_refs || [], role: 'recorded_runtime_event_refs' },
      { ref_kind: 'receipt_ref', ref: closeoutReceiptRef, role: 'stage_closeout_receipt_ref' },
      { ref_kind: 'receipt_ref', ref: ownerReceiptRef, role: 'domain_owner_receipt_ref' },
    ],
    append_only_event_log_refs: [appendOnlyEventLogRef],
    attempt_ledger_refs: [attemptLedgerRef],
    recorded_runtime_event_refs: stage.runtime_event_refs || [],
    closeout_receipt_refs: [closeoutReceiptRef, ownerReceiptRef],
    owner_receipt_refs: [ownerReceiptRef],
  };
}

function stageDescriptor(stage, actionIds) {
  const sourceRefs = [
    ...PLANE_SOURCE_REFS,
    { ref_kind: 'route_stage_refs', ref: stage.domain_stage_refs, role: 'domain_stage_projection' },
    ...(stage.visual_pattern_memory_refs || []).map((ref) => ({
      ref_kind: 'json_pointer',
      ref,
      role: 'visual_pattern_memory_contract',
    })),
  ];
  return {
    ...stage,
    owner: 'redcube_ai',
    summary: `${stage.title} projected from RCA-owned route stages for OPL family discovery.`,
    source_refs: sourceRefs,
    freshness: buildFreshness(sourceRefs),
    action_parity: buildActionParity(stage, actionIds),
    inputs: [
      { ref_kind: 'json_pointer', ref: '/family_action_catalog', role: 'allowed_action_catalog' },
      { ref_kind: 'json_pointer', ref: '/progress_projection', role: 'progress_read_model' },
      { ref_kind: 'json_pointer', ref: '/session_continuity', role: 'resume_context' },
    ],
    skills: [
      ...repoPathRefs(CANONICAL_STAGE_SKILL_REFS[stage.stage_id], 'canonical_stage_skill_policy'),
      { ref_kind: 'skill_id', ref: 'redcube-ai', role: 'domain_skill' },
      { ref_kind: 'skill_id', ref: 'imagegen', role: 'visual_generation' },
      { ref_kind: 'skill_id', ref: 'presentations', role: 'presentation_output' },
    ],
    prompt_refs: [
      {
        ref_kind: 'repo_path',
        ref: CANONICAL_STAGE_PROMPT_REFS[stage.stage_id],
        role: 'canonical_stage_prompt_policy',
      },
    ],
    legacy_prompt_asset_refs: [
      { ref_kind: 'repo_path', ref: 'prompts/ppt_deck', role: 'ppt_detailed_prompt_assets' },
      { ref_kind: 'repo_path', ref: 'prompts/xiaohongshu', role: 'xiaohongshu_detailed_prompt_assets' },
    ],
    knowledge_refs: repoPathRefs(
      CANONICAL_STAGE_KNOWLEDGE_REFS[stage.stage_id],
      'canonical_stage_knowledge_policy',
    ),
    visual_pattern_memory_refs: stage.visual_pattern_memory_refs || [],
    evaluation: CANONICAL_STAGE_QUALITY_GATE_REFS[stage.stage_id].map((gate) => ({
      ref_kind: 'repo_path',
      ref: gate.ref,
      role: gate.role,
    })),
    handoff: {
      next_owner: 'one-person-lab',
      next_stage_refs: stage.next_stage_refs || [],
      provides: stage.ensures || [],
      resume_surface_ref: '/session_continuity',
      artifact_surface_ref: '/artifact_inventory',
      stage_execution_plan_ref: '/continuation_snapshot/latest_stage_execution_plan_ref',
    },
    stage_contract: {
      requires: stage.requires || [],
      ensures: stage.ensures || [],
      runtime_event_refs: stage.runtime_event_refs || [],
      ...buildCohortLoopRefs(stage),
      ...buildReplayEvidenceRefs(stage),
      boundary_assumptions: [
        'RCA owns visual truth, review/export verdict, artifact authority, and visual memory decisions.',
        'OPL admission only checks descriptor composition and cannot declare visual-ready, exportable, or handoffable.',
      ],
    },
    trust_boundary: {
      lane: stage.trust_lane || 'domain_agent',
      static_check_eligible: false,
      effect_boundary: stage.trust_lane === 'ai_decision',
      records_runtime_events: true,
      runtime_event_refs: stage.runtime_event_refs || [],
      owner_receipt_required: true,
      human_gate_required: false,
      runtime_guard_required: true,
    },
    authority_boundary: {
      domain_truth_owner: 'redcube_ai',
      visual_truth_owner: 'redcube_ai',
      artifact_authority_owner: 'redcube_ai',
      review_publication_projection_owner: 'redcube_ai',
      opl_role: 'projection_consumer_only',
      opl_stage_attempt_owner: 'one-person-lab',
      opl_can_schedule_stage: true,
      opl_can_schedule_stage_attempt: true,
      opl_can_write_visual_truth: false,
      opl_can_write_review_truth: false,
      opl_can_write_publication_projection: false,
      rca_owns_visual_truth: true,
      rca_owns_review_publication_projection: true,
      rca_owns_artifact_authority: true,
      default_ppt_route_changed: false,
      provider_completion_is_visual_ready: false,
      provider_completion_is_exportable: false,
      provider_completion_is_domain_ready: false,
      repo_local_stage_runner_retired: true,
      repo_local_stage_runner_role: 'tombstone_or_historical_regression_only',
      independent_gate_receipt_required: Boolean(stage.independent_gate_receipt_required),
    },
  };
}

export function buildRedCubeFamilyStageControlPlane({ familyActionCatalog = null } = {}) {
  const actionIds = new Set((familyActionCatalog?.actions ?? []).map((action) => action.action_id));
  const stages = STAGES.map((stage) => stageDescriptor(stage, actionIds));
  const missingActionRefs = stages.flatMap((stage) => (
    stage.action_parity.missing_action_refs.map((actionRef) => ({
      stage_id: stage.stage_id,
      action_ref: actionRef,
    }))
  ));
  return {
    surface_kind: 'family_stage_control_plane',
    version: 'family-stage-control-plane.v1',
    plane_id: 'redcube_ai_stage_control_plane',
    target_domain_id: 'redcube_ai',
    owner: 'redcube_ai',
    source_refs: PLANE_SOURCE_REFS,
    freshness: buildFreshness(PLANE_SOURCE_REFS),
    stage_action_parity: {
      surface_kind: 'family_stage_action_parity',
      status: missingActionRefs.length === 0 ? 'aligned' : 'missing_action_refs',
      family_action_catalog_ref: '/family_action_catalog',
      missing_action_refs: missingActionRefs,
    },
    authority_boundary: {
      domain_truth_owner: 'redcube_ai',
      opl_role: 'projection_consumer_only',
      write_policy: 'no_visual_truth_writes',
      no_quality_verdict: true,
      rca_owns_visual_truth: true,
      rca_owns_review_publication_projection: true,
      rca_owns_artifact_authority: true,
      opl_stage_attempt_owner: 'one-person-lab',
      opl_can_schedule_stage: true,
      opl_can_schedule_stage_attempt: true,
      opl_can_write_visual_truth: false,
      opl_can_write_review_truth: false,
      opl_can_write_publication_projection: false,
      default_ppt_route_changed: false,
      repo_local_stage_runner_retired: true,
      repo_local_stage_runner_role: 'tombstone_or_historical_regression_only',
    },
    stages,
    notes: [
      'Descriptor-only projection over existing RCA route stages.',
      'OPL provider may schedule stage attempts from this descriptor; it must not own RCA visual/artifact/review authority.',
    ],
  };
}
