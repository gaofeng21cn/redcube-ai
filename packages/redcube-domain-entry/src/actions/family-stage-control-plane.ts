// @ts-nocheck
import {
  RCA_STAGE_OUTPUT_CANONICAL_ROLES,
  RCA_STAGE_OUTPUT_STAGE_EXPECTATIONS,
} from '@redcube/runtime-protocol';

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
    allowed_action_refs: ['get_product_entry_session', 'get_product_entry_manifest', 'export_domain_handler'],
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

const USER_STAGE_LOG_REQUIRED_FIELDS = [
  'stage_name',
  'problem_summary',
  'stage_goal',
  'stage_work_done',
  'changed_stage_surfaces',
  'outcome',
  'remaining_blockers',
  'evidence_refs',
];

const USER_STAGE_LOG_CONTRACT = {
  surface_kind: 'opl_standard_agent_user_stage_log_contract',
  version: 'standard-user-stage-log.v1',
  owner: 'one-person-lab',
  standard_agent_requirement: 'domain_stage_closeout_must_return_user_readable_stage_semantics_or_typed_blocker',
  opl_projection_surface: 'stage_progress_log.user_stage_log',
  domain_semantic_sources: [
    'typed_closeout_packet.user_stage_log',
    'typed_closeout_packet.stage_log_summary',
    'route_impact.user_stage_log',
    'route_impact.stage_log_summary',
  ],
  required_domain_semantic_fields: USER_STAGE_LOG_REQUIRED_FIELDS,
  required_observability_fields: ['duration', 'token_usage', 'cost'],
  missing_semantics_policy: 'typed_blocker_or_missing_domain_semantic_summary_no_opl_inference',
  token_policy: 'observed_or_explicit_missing_null_no_zero_fill',
  authority_boundary: {
    opl_can_infer_domain_semantics: false,
    opl_can_read_artifact_body: false,
    opl_can_write_domain_truth: false,
    opl_can_authorize_quality_or_export: false,
    provider_completion_can_claim_stage_semantics_complete: false,
  },
};

const PROGRESS_DELTA_POLICY = {
  surface_kind: 'opl_stage_progress_delta_policy',
  version: 'progress-delta-policy.v1',
  owner: 'one-person-lab',
  standard_agent_requirement:
    'stage_closeout_must_classify_deliverable_progress_vs_platform_repair_or_return_typed_blocker',
  projection_surface: 'stage_progress_log.user_stage_log',
  required_fields: [
    'progress_delta_classification',
    'deliverable_progress_delta',
    'platform_repair_delta',
    'next_forced_delta',
  ],
  classification_values: [
    'deliverable_progress',
    'platform_repair',
    'mixed',
    'typed_blocker',
    'human_gate',
    'stop_loss',
  ],
  deliverable_delta_aliases: {
    redcube: ['visual_deliverable_progress', 'deliverable_progress_delta'],
  },
  platform_delta_aliases: {
    redcube: ['platform_repair_delta'],
  },
  platform_only_is_not_deliverable_progress: true,
  missing_delta_policy: 'emit_zero_deliverable_delta_and_next_forced_delta_without_inventing_domain_work',
  authority_boundary: {
    opl_can_infer_domain_work: false,
    opl_can_read_artifact_body: false,
    opl_can_write_domain_truth: false,
    opl_can_authorize_quality_or_export: false,
    rca_retains_visual_deliverable_semantics: true,
  },
};

const TYPED_BLOCKER_LINEAGE_POLICY = {
  surface_kind: 'family-stall-lineage.v1',
  version: 'family-stall-lineage.v1',
  owner: 'one-person-lab',
  standard_agent_requirement:
    'typed_blockers_must_include_repeat_budget_lineage_next_forced_delta_and_escalation_owner',
  required_fields: [
    'blocker_family',
    'study_id_or_domain_identity',
    'work_unit_id',
    'eval_id_or_review_ref',
    'source_fingerprint',
    'repeat_count',
    'first_seen',
    'last_seen',
    'last_deliverable_delta',
    'next_forced_delta',
    'escalation_owner',
    'terminal',
  ],
  repeat_budget: {
    mechanism_repair_after_repeat_count: 2,
    human_gate_or_stop_loss_after_repeat_count: 3,
  },
  platform_only_delta_policy: 'does_not_reset_deliverable_stall_budget',
  authority_boundary: {
    opl_can_generate_domain_blocker: false,
    opl_can_escalate_without_domain_or_human_gate_ref: false,
    opl_can_claim_deliverable_progress_from_platform_repair: false,
    rca_retains_visual_blocker_authority: true,
  },
};

const PLANE_SOURCE_REFS = [
  { ref_kind: 'json_pointer', ref: '/family_action_catalog', role: 'allowed_action_catalog' },
  { ref_kind: 'json_pointer', ref: '/deliverable_facade/family_route_policy', role: 'route_stage_policy' },
  { ref_kind: 'json_pointer', ref: '/progress_projection', role: 'runtime_watch_projection' },
  { ref_kind: 'json_pointer', ref: '/review_state', role: 'review_truth_projection' },
  { ref_kind: 'json_pointer', ref: '/publication_projection', role: 'publication_projection' },
  { ref_kind: 'json_pointer', ref: '/artifact_inventory', role: 'artifact_authority_projection' },
  {
    ref_kind: 'contract',
    ref: 'contracts/artifact_locator_contract.json#/primary_artifact_truth',
    role: 'stage_folder_physical_artifact_truth',
  },
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

const COGNITIVE_KERNEL_CONTRACT_REF = 'contracts/opl-framework/cognitive-computation-kernel.json';
const COGNITIVE_KERNEL_ADOPTION_REF = 'contracts/cognitive_kernel_adoption.json';
const GOLDEN_PATH_PROFILE_REF = 'contracts/golden_path_profile.json';
const DOMAIN_TOOL_AFFORDANCE_CATALOG_REF = {
  ref_kind: 'repo_path',
  ref: 'agent/tools/domain_affordances.md',
  role: 'stage_tool_affordance_catalog',
  catalog_role: 'available_affordance_catalog_not_workflow_script',
};

const COGNITIVE_KERNEL_REQUIRED_SECTIONS = [
  'prompt_refs',
  'skill_refs',
  'tool_refs',
  'tool_affordance_boundary',
  'knowledge_refs',
  'quality_gate_refs',
  'strategy_refs',
  'candidate_pool_policy',
  'independent_gate_policy',
  'handoff_policy',
];

const COGNITIVE_STAGE_STRATEGY_REFS = {
  source_intake: [
    'goal_and_constraints',
    'source_scope_freeze',
    'material_gap_detection',
  ],
  communication_strategy: [
    'candidate_storyline_generation',
    'grounded_source_reflection',
    'comparative_narrative_selection',
  ],
  visual_direction: [
    'candidate_visual_direction_generation',
    'brand_grounded_reflection',
    'comparative_visual_selection',
  ],
  artifact_creation: [
    'image_first_candidate_generation',
    'tool_grounded_render_reflection',
    'artifact_lineage_evolution',
  ],
  review_and_revision: [
    'grounded_visual_review',
    'repair_target_selection',
    'revision_lineage_review',
  ],
  package_and_handoff: [
    'export_candidate_verification',
    'handoff_manifest_review',
    'artifact_lineage_closeout',
  ],
};

const COGNITIVE_STAGE_CANDIDATE_KINDS = {
  source_intake: [
    'source_truth_pack_candidate',
    'material_inventory_candidate',
    'source_gap_typed_blocker_candidate',
  ],
  communication_strategy: [
    'storyline_variant',
    'strategy_brief_candidate',
    'information_density_plan',
  ],
  visual_direction: [
    'visual_direction_variant',
    'brand_precedence_rationale',
    'layout_density_direction',
  ],
  artifact_creation: [
    'image_first_page_candidate',
    'html_or_native_route_candidate_when_explicit',
    'render_manifest_candidate',
  ],
  review_and_revision: [
    'visual_review_verdict_candidate',
    'repair_target_candidate',
    'revision_lineage_candidate',
  ],
  package_and_handoff: [
    'export_bundle_candidate',
    'handoff_manifest_candidate',
    'resume_handle_candidate',
  ],
};

const COGNITIVE_STAGE_TOOL_REFS = {
  source_intake: [
    { ref_kind: 'tool_ref', ref: 'tool:repo-source-reader', role: 'source_context_reading' },
    { ref_kind: 'tool_ref', ref: 'tool:stage-folder-manifest-writer', role: 'source_manifest_refs' },
  ],
  communication_strategy: [
    { ref_kind: 'tool_ref', ref: 'tool:repo-source-reader', role: 'source_context_reading' },
    { ref_kind: 'tool_ref', ref: 'tool:strategy-brief-writer', role: 'strategy_ref_materialization' },
  ],
  visual_direction: [
    { ref_kind: 'tool_ref', ref: 'tool:brand-asset-reader', role: 'brand_and_material_refs' },
    { ref_kind: 'tool_ref', ref: 'tool:visual-direction-writer', role: 'visual_direction_ref_materialization' },
  ],
  artifact_creation: [
    { ref_kind: 'tool_ref', ref: 'tool:codex-native-imagegen', role: 'image_first_page_generation' },
    { ref_kind: 'tool_ref', ref: 'tool:render-screenshot-inspection', role: 'render_evidence_refs' },
    { ref_kind: 'tool_ref', ref: 'tool:stage-folder-manifest-writer', role: 'artifact_manifest_and_receipt_refs' },
  ],
  review_and_revision: [
    { ref_kind: 'tool_ref', ref: 'tool:render-screenshot-inspection', role: 'visual_review_evidence_refs' },
    { ref_kind: 'tool_ref', ref: 'tool:repair-target-writer', role: 'repair_target_refs' },
    { ref_kind: 'tool_ref', ref: 'tool:visual-memory-receipt-writer', role: 'memory_receipt_refs' },
  ],
  package_and_handoff: [
    { ref_kind: 'tool_ref', ref: 'tool:export-pptx-helper', role: 'export_bundle_refs' },
    { ref_kind: 'tool_ref', ref: 'tool:artifact-locator-reader', role: 'artifact_locator_refs' },
    { ref_kind: 'tool_ref', ref: 'tool:handoff-manifest-writer', role: 'handoff_manifest_refs' },
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

function buildToolAffordanceBoundary(stage, toolRefs) {
  return {
    surface_kind: 'opl_tool_affordance_boundary',
    version: 'tool-affordance-boundary.v1',
    contract_ref: COGNITIVE_KERNEL_CONTRACT_REF,
    catalog_role: 'available_affordance_catalog_not_workflow_script',
    tool_refs: toolRefs,
    capability_refs: toolRefs.map((toolRef) => ({
      ref_kind: 'capability_ref',
      ref: toolRef.ref,
      role: toolRef.role,
    })),
    permission_scope_refs: [
      { ref_kind: 'permission_scope_ref', ref: 'permission:read-repo-source', role: 'read_declared_pack_refs' },
      { ref_kind: 'permission_scope_ref', ref: 'permission:write-stage-folder-attempt', role: 'write_refs_and_manifests' },
    ],
    credential_boundary_refs: [
      { ref_kind: 'credential_boundary_ref', ref: 'credential:codex-native-executor', role: 'executor_managed_credentials' },
      { ref_kind: 'credential_boundary_ref', ref: 'credential:no-domain-secret-copy', role: 'no_repo_secret_or_token_materialization' },
    ],
    write_scope_refs: [
      {
        ref_kind: 'write_scope_ref',
        ref: `stage-folder:redcube_ai/${stage.stage_id}/attempts/<attempt_id>`,
        role: 'stage_attempt_refs_only_write_scope',
      },
      { ref_kind: 'write_scope_ref', ref: 'workspace-runtime-artifacts', role: 'artifact_refs_not_repo_source' },
    ],
    side_effect_risk_refs: [
      { ref_kind: 'side_effect_risk_ref', ref: 'risk:runtime-artifact-write', role: 'bounded_workspace_artifact_write' },
      { ref_kind: 'side_effect_risk_ref', ref: 'risk:external-export-helper', role: 'export_helper_side_effects_must_emit_refs' },
    ],
    forbidden_authority_refs: [
      { ref_kind: 'forbidden_authority_ref', ref: 'forbidden:visual-truth-write', role: 'rca_visual_truth_owner_only' },
      { ref_kind: 'forbidden_authority_ref', ref: 'forbidden:review-export-verdict', role: 'rca_review_export_gate_only' },
      { ref_kind: 'forbidden_authority_ref', ref: 'forbidden:owner-receipt-signing-by-opl', role: 'rca_owner_receipt_only' },
      { ref_kind: 'forbidden_authority_ref', ref: 'forbidden:artifact-body-in-opl-ledger', role: 'refs_hashes_and_locator_only' },
    ],
    executor_autonomy: {
      executor_can_choose_tools: true,
      executor_can_skip_tools: true,
      executor_can_substitute_tools_within_boundary: true,
      executor_can_choose_order_and_parallelism: true,
      executor_can_request_missing_context_or_human_gate: true,
      tool_catalog_can_prescribe_tool_sequence: false,
      tool_catalog_can_define_cognitive_strategy: false,
      tool_catalog_can_override_stage_goal: false,
      tool_catalog_can_authorize_forbidden_write: false,
    },
  };
}

function buildCandidatePoolPolicy(stage) {
  return {
    surface_kind: 'rca_cognitive_candidate_pool_policy',
    version: 'cognitive-candidate-pool-policy.v1',
    contract_ref: COGNITIVE_KERNEL_CONTRACT_REF,
    stage_id: stage.stage_id,
    candidate_pool_is_stage_internal_artifact: true,
    user_visible_flow_changed: false,
    route_can_complete_stage: false,
    candidate_refs_are_body_free: true,
    candidate_lineage_required: true,
    allowed_candidate_kinds: COGNITIVE_STAGE_CANDIDATE_KINDS[stage.stage_id] || [],
    selected_candidate_ref_required_for_success: true,
    selected_candidate_ref_can_claim_quality_verdict: false,
    completion_requires_owner_receipt_or_typed_blocker: true,
  };
}

function buildIndependentGatePolicy(stage, qualityGateRefs) {
  return {
    surface_kind: 'rca_independent_quality_gate_policy',
    version: 'independent-quality-gate-policy.v1',
    contract_ref: COGNITIVE_KERNEL_CONTRACT_REF,
    stage_id: stage.stage_id,
    gate_owner: 'redcube_ai',
    gate_ref: qualityGateRefs[0]?.ref,
    next_quality_gate_stage_ref: stage.stage_id === 'artifact_creation' ? 'review_and_revision' : null,
    execution_review_separation_required: true,
    same_attempt_self_review_can_close_quality_gate: false,
    provider_completion_can_close_quality_gate: false,
    owner_receipt_or_typed_blocker_required: true,
    human_gate_allowed: true,
    route_back_allowed: true,
  };
}

function buildHandoffPolicy(stage) {
  return {
    surface_kind: 'rca_cognitive_stage_handoff_policy',
    version: 'cognitive-stage-handoff-policy.v1',
    contract_ref: COGNITIVE_KERNEL_CONTRACT_REF,
    stage_id: stage.stage_id,
    next_owner: 'one-person-lab',
    next_stage_refs: stage.next_stage_refs || [],
    provides: stage.ensures || [],
    owner_receipt_or_typed_blocker_required: true,
    handoff_refs_only: true,
    artifact_body_handoff_forbidden: true,
    resume_surface_ref: '/session_continuity',
    artifact_surface_ref: '/artifact_inventory',
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
    cross_provider_attempt_index: {
      surface_kind: 'cross_provider_attempt_index',
      version: 'cross-provider-attempt-index.v1',
      owner: 'one-person-lab',
      provider_attempt_owner: 'one-person-lab',
      domain_adapter_owner: 'redcube_ai',
      local_session_ref: `/session_continuity/${stage.stage_id}`,
      provider_attempt_ledger_ref: attemptLedgerRef,
      provider_attempt_ref_required: true,
      provider_attempt_ledger_ref_required: true,
      missing_provider_ledger_policy: 'fail_closed_typed_blocker_projection',
      local_session_ref_is_not_provider_attempt_ref: true,
      rca_does_not_own_provider_attempt_ledger: true,
      can_claim_current_without_provider_ledger: false,
    },
    recorded_runtime_event_refs: stage.runtime_event_refs || [],
    closeout_receipt_refs: [closeoutReceiptRef, ownerReceiptRef],
    owner_receipt_refs: [ownerReceiptRef],
  };
}

function stageDescriptor(stage, actionIds) {
  const expectedOutputRoles = RCA_STAGE_OUTPUT_STAGE_EXPECTATIONS[stage.stage_id] || [];
  const skillRefs = [
    ...repoPathRefs(CANONICAL_STAGE_SKILL_REFS[stage.stage_id], 'canonical_stage_skill_policy'),
    { ref_kind: 'skill_id', ref: 'redcube-ai', role: 'domain_skill' },
    { ref_kind: 'skill_id', ref: 'imagegen', role: 'visual_generation' },
    { ref_kind: 'skill_id', ref: 'presentations', role: 'presentation_output' },
  ];
  const promptRefs = [
    {
      ref_kind: 'repo_path',
      ref: CANONICAL_STAGE_PROMPT_REFS[stage.stage_id],
      role: 'canonical_stage_prompt_policy',
    },
  ];
  const knowledgeRefs = repoPathRefs(
    CANONICAL_STAGE_KNOWLEDGE_REFS[stage.stage_id],
    'canonical_stage_knowledge_policy',
  );
  const qualityGateRefs = CANONICAL_STAGE_QUALITY_GATE_REFS[stage.stage_id].map((gate) => ({
    ref_kind: 'repo_path',
    ref: gate.ref,
    role: gate.role,
  }));
  const toolRefs = [
    DOMAIN_TOOL_AFFORDANCE_CATALOG_REF,
    ...(COGNITIVE_STAGE_TOOL_REFS[stage.stage_id] || []),
  ];
  const strategyRefs = COGNITIVE_STAGE_STRATEGY_REFS[stage.stage_id] || [];
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
    selected_executor: {
      executor_kind: 'codex_cli',
      default_executor: stage.stage_id === 'source_intake',
      executor_binding_ref: 'default_codex_cli',
      binding_policy: 'default_first_class_executor_for_ai_first_stage_execution',
      required_capabilities: [
        'repo_context_reading',
        'domain_skill_invocation',
        'receipt_or_typed_blocker_return',
        'no_forbidden_write_guard',
      ],
    },
    summary: `${stage.title} projected from RCA-owned route stages for OPL family discovery.`,
    source_refs: sourceRefs,
    freshness: buildFreshness(sourceRefs),
    action_parity: buildActionParity(stage, actionIds),
    inputs: [
      { ref_kind: 'json_pointer', ref: '/family_action_catalog', role: 'allowed_action_catalog' },
      { ref_kind: 'json_pointer', ref: '/progress_projection', role: 'progress_read_model' },
      { ref_kind: 'json_pointer', ref: '/session_continuity', role: 'resume_context' },
    ],
    skills: skillRefs,
    skill_refs: skillRefs,
    prompt_refs: promptRefs,
    legacy_prompt_asset_refs: [
      { ref_kind: 'repo_path', ref: 'prompts/ppt_deck', role: 'ppt_detailed_prompt_assets' },
      { ref_kind: 'repo_path', ref: 'prompts/xiaohongshu', role: 'xiaohongshu_detailed_prompt_assets' },
    ],
    knowledge_refs: knowledgeRefs,
    tool_refs: toolRefs,
    quality_gate_refs: qualityGateRefs,
    strategy_refs: strategyRefs,
    tool_affordance_boundary: buildToolAffordanceBoundary(stage, toolRefs),
    candidate_pool_policy: buildCandidatePoolPolicy(stage),
    independent_gate_policy: buildIndependentGatePolicy(stage, qualityGateRefs),
    handoff_policy: buildHandoffPolicy(stage),
    visual_pattern_memory_refs: stage.visual_pattern_memory_refs || [],
    evaluation: qualityGateRefs,
    handoff: {
      next_owner: 'one-person-lab',
      next_stage_refs: stage.next_stage_refs || [],
      provides: stage.ensures || [],
      resume_surface_ref: '/session_continuity',
      artifact_surface_ref: '/artifact_inventory',
      stage_execution_plan_ref: '/continuation_snapshot/latest_stage_execution_plan_ref',
    },
    stage_contract: {
      cognitive_kernel_contract_ref: COGNITIVE_KERNEL_CONTRACT_REF,
      cognitive_kernel_adoption_ref: COGNITIVE_KERNEL_ADOPTION_REF,
      golden_path_profile_ref: GOLDEN_PATH_PROFILE_REF,
      cognitive_kernel_required_sections: COGNITIVE_KERNEL_REQUIRED_SECTIONS,
      strategy_refs: strategyRefs,
      tool_affordance_boundary_ref: `/family_stage_control_plane/stages/${stage.stage_id}/tool_affordance_boundary`,
      candidate_pool_policy_ref: `/family_stage_control_plane/stages/${stage.stage_id}/candidate_pool_policy`,
      independent_gate_policy_ref: `/family_stage_control_plane/stages/${stage.stage_id}/independent_gate_policy`,
      handoff_policy_ref: `/family_stage_control_plane/stages/${stage.stage_id}/handoff_policy`,
      requires: stage.requires || [],
      ensures: stage.ensures || [],
      stage_output_role_interface: {
        surface_kind: 'rca_stage_output_role_interface_contract',
        version: 'stage-output-role-interface.v1',
        owner: 'redcube_ai',
        stage_id: stage.stage_id,
        required_roles: expectedOutputRoles,
        accepted_roles: RCA_STAGE_OUTPUT_CANONICAL_ROLES,
        interface_rule: 'role_manifest_receipt_ref_is_machine_interface_filename_is_not_interface',
        manifest_ref: 'manifest.json',
        receipt_ref_policy: 'owner_receipt_or_typed_blocker_ref_required_by_terminal_status',
      },
      expected_output_roles: expectedOutputRoles,
      runtime_event_refs: stage.runtime_event_refs || [],
      ...buildCohortLoopRefs(stage),
      ...buildReplayEvidenceRefs(stage),
      user_stage_log_contract: USER_STAGE_LOG_CONTRACT,
      progress_delta_policy: PROGRESS_DELTA_POLICY,
      typed_blocker_lineage_policy: TYPED_BLOCKER_LINEAGE_POLICY,
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
    cognitive_kernel_adoption_ref: COGNITIVE_KERNEL_ADOPTION_REF,
    golden_path_profile_ref: GOLDEN_PATH_PROFILE_REF,
    stage_pack_required_sections: COGNITIVE_KERNEL_REQUIRED_SECTIONS,
    stage_output_role_interface: {
      surface_kind: 'rca_stage_output_role_interface_contract',
      version: 'stage-output-role-interface.v1',
      owner: 'redcube_ai',
      canonical_roles: RCA_STAGE_OUTPUT_CANONICAL_ROLES,
      interface_rule: 'stage_outputs_are_addressed_by_role_manifest_and_receipt_refs_not_filename',
      stage_role_expectations: RCA_STAGE_OUTPUT_STAGE_EXPECTATIONS,
      role_ref_shape: {
        role: '<canonical_role>',
        output_ref: 'outputs/<mutable-file-name>',
        manifest_ref: 'manifest.json',
        receipt_ref: 'receipts/domain-owner-receipt.json or null when blocked',
        typed_blocker_ref: 'evidence/typed-blocker-ref.json or null when successful',
      },
      filename_policy: 'output file names may vary and must not be used as the machine interface',
    },
    stage_artifact_runtime: {
      surface_kind: 'opl_stage_folder_contract_consumption',
      contract_ref: 'contracts/artifact_locator_contract.json#/primary_artifact_truth',
      physical_source_of_truth: '$OPL_STATE_DIR/runtime-state/domains/redcube_ai/deliverables/<program_id>/<topic_id>/<deliverable_id>/stages/<nn-stage>/attempts/<attempt_id>/',
      canonical_stages: [
        'source_intake',
        'communication_strategy',
        'visual_direction',
        'artifact_creation',
        'review_and_revision',
        'package_and_handoff',
      ],
      canonical_output_roles: RCA_STAGE_OUTPUT_CANONICAL_ROLES,
      stage_role_expectations: RCA_STAGE_OUTPUT_STAGE_EXPECTATIONS,
      interface_rule: 'role_plus_manifest_plus_receipt_ref_is_machine_interface_filename_is_mutable',
      completion_rule: 'required output roles plus valid manifest plus RCA owner receipt',
      blocked_rule: 'RCA typed blocker plus evidence',
      orphan_rule: 'output files without valid role manifest/receipt/evidence are not completed stages',
      derived_projection_policy: 'status, stage_progress_log, gallery, and handoff are derived from Stage Folder contents; they are not first truth',
      authority_boundary: {
        owner: 'redcube_ai',
        opl_role: 'stage_folder_contract_provider_index_rebuild_status_explain',
        opl_can_issue_owner_receipt: false,
        opl_can_write_visual_truth: false,
        opl_can_write_review_export_verdict: false,
        opl_can_write_domain_artifact_body: false,
        rca_owns_artifact_authority: true,
      },
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
