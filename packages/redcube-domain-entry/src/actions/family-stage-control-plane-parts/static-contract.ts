// @ts-nocheck

function compactStageDescriptor(stage) {
  return {
    stage_id: stage.stage_id,
    stage_kind: stage.stage_kind,
    title: stage.title,
    goal: stage.goal,
    owner: stage.owner,
    domain_stage_refs: stage.domain_stage_refs,
    allowed_action_refs: stage.allowed_action_refs,
    requires: stage.requires,
    ensures: stage.ensures,
    next_stage_refs: stage.next_stage_refs,
    trust_lane: stage.trust_lane,
    independent_gate_receipt_required: Boolean(stage.independent_gate_receipt_required),
    runtime_event_refs: stage.runtime_event_refs,
    outputs: stage.outputs,
    selected_executor: stage.selected_executor,
    summary: stage.summary,
    source_refs: stage.source_refs,
    freshness: stage.freshness,
    inputs: stage.inputs,
    skills: stage.skills,
    prompt_refs: stage.prompt_refs,
    skill_refs: stage.skill_refs,
    stage_skill_policy_refs: stage.stage_skill_policy_refs,
    professional_skill_refs: stage.professional_skill_refs,
    tool_refs: stage.tool_refs,
    knowledge_refs: stage.knowledge_refs,
    quality_gate_refs: stage.quality_gate_refs,
    strategy_refs: stage.strategy_refs,
    evaluation: stage.evaluation,
    legacy_prompt_asset_refs: stage.legacy_prompt_asset_refs,
    handoff: stage.handoff,
    visual_pattern_memory_refs: stage.visual_pattern_memory_refs,
    action_parity: stage.action_parity,
    stage_contract: {
      projection_mode: 'refs_only_static_contract',
      generated_descriptor_ref: `opl_generated:product_entry_manifest#/family_stage_control_plane/stages/${stage.stage_id}`,
      cognitive_kernel_contract_ref: stage.stage_contract.cognitive_kernel_contract_ref,
      cognitive_kernel_adoption_ref: stage.stage_contract.cognitive_kernel_adoption_ref,
      golden_path_profile_ref: stage.stage_contract.golden_path_profile_ref,
      cognitive_kernel_required_sections: stage.stage_contract.cognitive_kernel_required_sections,
      strategy_refs: stage.stage_contract.strategy_refs,
      professional_skill_refs: stage.stage_contract.professional_skill_refs,
      requires: stage.stage_contract.requires,
      ensures: stage.stage_contract.ensures,
      expected_output_roles: stage.stage_contract.expected_output_roles,
      runtime_event_refs: stage.stage_contract.runtime_event_refs,
      source_scope_refs: stage.stage_contract.source_scope_refs,
      cohort_query_refs: stage.stage_contract.cohort_query_refs,
      trigger_refs: stage.stage_contract.trigger_refs,
      monitor_refs: stage.stage_contract.monitor_refs,
      dashboard_metric_refs: stage.stage_contract.dashboard_metric_refs,
      metric_refs: stage.stage_contract.metric_refs,
      replay_evidence_refs: stage.stage_contract.replay_evidence_refs,
      append_only_event_log_refs: stage.stage_contract.append_only_event_log_refs,
      attempt_ledger_refs: stage.stage_contract.attempt_ledger_refs,
      cross_provider_attempt_index: stage.stage_contract.cross_provider_attempt_index,
      recorded_runtime_event_refs: stage.stage_contract.recorded_runtime_event_refs,
      closeout_receipt_refs: stage.stage_contract.closeout_receipt_refs,
      owner_receipt_refs: stage.stage_contract.owner_receipt_refs,
      tool_affordance_boundary_ref: stage.stage_contract.tool_affordance_boundary_ref,
      candidate_pool_policy_ref: stage.stage_contract.candidate_pool_policy_ref,
      independent_gate_policy_ref: stage.stage_contract.independent_gate_policy_ref,
      handoff_policy_ref: stage.stage_contract.handoff_policy_ref,
      stage_completion_policy_ref: (
        `opl_generated:product_entry_manifest#/family_stage_control_plane/stages/${stage.stage_id}`
        + '/stage_contract/stage_completion_policy'
      ),
      user_stage_log_contract_ref: (
        `opl_generated:product_entry_manifest#/family_stage_control_plane/stages/${stage.stage_id}`
        + '/stage_contract/user_stage_log_contract'
      ),
      progress_delta_policy_ref: (
        `opl_generated:product_entry_manifest#/family_stage_control_plane/stages/${stage.stage_id}`
        + '/stage_contract/progress_delta_policy'
      ),
      typed_blocker_lineage_policy_ref: (
        `opl_generated:product_entry_manifest#/family_stage_control_plane/stages/${stage.stage_id}`
        + '/stage_contract/typed_blocker_lineage_policy'
      ),
      stage_output_role_interface_ref: (
        `opl_generated:product_entry_manifest#/family_stage_control_plane/stages/${stage.stage_id}`
        + '/stage_contract/stage_output_role_interface'
      ),
      replay_evidence_refs_ref: (
        `opl_generated:product_entry_manifest#/family_stage_control_plane/stages/${stage.stage_id}`
        + '/stage_contract/replay_evidence_refs'
      ),
      cross_provider_attempt_index_ref: (
        `opl_generated:product_entry_manifest#/family_stage_control_plane/stages/${stage.stage_id}`
        + '/stage_contract/cross_provider_attempt_index'
      ),
    },
    trust_boundary: stage.trust_boundary,
    authority_boundary: stage.authority_boundary,
  };
}

export function buildCompactFamilyStageControlPlaneContract(fullPlane) {
  return {
    ...fullPlane,
    projection_mode: 'compact_static_contract_with_generated_descriptor_readback',
    generated_descriptor_ref: 'opl_generated:product_entry_manifest#/family_stage_control_plane',
    descriptor_builder_ref: (
      'packages/redcube-domain-entry/src/actions/family-stage-control-plane.ts'
      + '#buildRedCubeFamilyStageControlPlane'
    ),
    stage_descriptor_body_copied: false,
    stage_descriptor_readback_contract: {
      surface_kind: 'stage_control_plane_generated_descriptor_readback',
      generated_descriptor_ref: 'opl_generated:product_entry_manifest#/family_stage_control_plane',
      static_contract_role: 'canonical_stage_ids_policy_refs_and_authority_boundary',
      full_descriptor_role: 'generated_readback_for_product_entry_and_opl_consumers',
      duplicate_body_policy: 'do_not_copy_per_stage_policy_bodies_into_repo_static_contract',
    },
    stage_policy_body_refs: {
      user_stage_log_contract_ref: 'opl_generated:product_entry_manifest#/family_stage_control_plane/stages/*/stage_contract/user_stage_log_contract',
      progress_delta_policy_ref: 'opl_generated:product_entry_manifest#/family_stage_control_plane/stages/*/stage_contract/progress_delta_policy',
      typed_blocker_lineage_policy_ref: 'opl_generated:product_entry_manifest#/family_stage_control_plane/stages/*/stage_contract/typed_blocker_lineage_policy',
      stage_completion_policy_ref: 'opl_generated:product_entry_manifest#/family_stage_control_plane/stages/*/stage_contract/stage_completion_policy',
      tool_affordance_boundary_ref: 'opl_generated:product_entry_manifest#/family_stage_control_plane/stages/*/tool_affordance_boundary',
      candidate_pool_policy_ref: 'opl_generated:product_entry_manifest#/family_stage_control_plane/stages/*/candidate_pool_policy',
      independent_gate_policy_ref: 'opl_generated:product_entry_manifest#/family_stage_control_plane/stages/*/independent_gate_policy',
      handoff_policy_ref: 'opl_generated:product_entry_manifest#/family_stage_control_plane/stages/*/handoff_policy',
    },
    stages: fullPlane.stages.map(compactStageDescriptor),
  };
}
