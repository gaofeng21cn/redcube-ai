// @ts-nocheck

export const RCA_PHYSICAL_MORPHOLOGY_ALLOWED_CLASSES = Object.freeze([
  'declarative_visual_pack',
  'machine_contract',
  'package_protocol_boundary',
  'service_safe_domain_entry',
  'domain_handler_target',
  'refs_only_read_model',
  'retained_current_refs_only_boundary',
  'minimal_visual_authority_function',
  'visual_route_runtime_family_implementation',
  'visual_native_helper_implementation',
  'repo_native_verification_wrapper',
  'diagnostic_or_fixture',
  'tombstone_or_provenance',
]);

export const RCA_PHYSICAL_MORPHOLOGY_FORBIDDEN_OWNER_CLASSES = Object.freeze([
  'generic_scheduler_owner',
  'generic_runner_owner',
  'generic_attempt_ledger_owner',
  'generic_workbench_owner',
  'generic_review_repair_transport_owner',
  'generic_session_runtime_owner',
  'generic_artifact_lifecycle_owner',
  'generic_generated_wrapper_owner',
  'generic_domain_entry_runtime_owner',
]);

export const FORBIDDEN_GENERIC_OWNER_FLAGS = Object.freeze({
  rca_owns_generic_scheduler: false,
  rca_owns_generic_runner: false,
  rca_owns_generic_attempt_ledger: false,
  rca_owns_generic_workbench: false,
  rca_owns_generic_review_repair_transport: false,
  rca_owns_generic_session_runtime: false,
  rca_owns_generic_artifact_lifecycle: false,
  rca_owns_generic_generated_wrapper: false,
  rca_owns_generic_domain_entry_runtime: false,
});

export const FORBIDDEN_GENERIC_OWNER_FLAGS_REF =
  'contracts/physical_source_morphology_policy.json#/forbidden_generic_owner_flags';

export const RCA_LEGACY_NAME_ALLOWANCE_ROLES = Object.freeze([
  'machine_contract_ref',
  'package_protocol_boundary',
  'service_safe_domain_entry',
  'contract_safe_semantic_id',
  'tombstone_or_provenance',
  'negative_test_guard',
  'refs_only_read_model',
  'retained_current_refs_only_boundary',
  'domain_handler_target',
  'minimal_visual_authority_function',
  'visual_route_runtime_family_implementation',
  'visual_native_helper_path',
  'repo_native_verification_wrapper',
  'locator_protocol_boundary',
]);

export const LEGACY_NAME_GUARD_DEFAULTS = Object.freeze({
  compatibility_alias_allowed: false,
  callable_alias_allowed: false,
  public_identity_allowed: false,
  active_generic_runtime_owner_allowed: false,
  active_generic_domain_entry_owner_allowed: false,
  active_generic_gateway_owner_allowed: false,
  active_generic_session_runtime_owner_allowed: false,
  active_generic_domain_action_adapter_owner_allowed: false,
  active_generic_workbench_owner_allowed: false,
  active_generic_attempt_ledger_owner_allowed: false,
});

export const POLICY_SOURCE_STRUCTURE = Object.freeze({
  source_structure_id: 'rca.physical_source_morphology_policy.source_structure.v1',
  state: 'tail_gate_extracted_builder_remains_thin',
  builder_ref:
    'packages/redcube-domain-entry/src/actions/domain-action-adapter-parts/physical-source-morphology-policy.ts#buildPhysicalSourceMorphologyPolicy',
  extracted_gate_refs: [
    'packages/redcube-domain-entry/src/actions/domain-action-adapter-parts/physical-source-morphology-policy-tail-gate.ts#SOURCE_THINNING_TAIL_GATE',
  ],
  retained_builder_role:
    'assemble_physical_source_morphology_policy_from_classifications_and_extracted_tail_gate',
  extracted_gate_role:
    'default_caller_tail_false_ready_and_current_role_guard_without_delete_or_readiness_authority',
  no_second_truth_policy: {
    contract_json_remains_builder_output: true,
    extracted_gate_module_is_source_for_default_caller_tail_gate: true,
    markdown_docs_do_not_define_machine_policy: true,
  },
  authority_boundary: {
    source_structure_can_claim_physical_delete_authorized: false,
    source_structure_can_claim_default_caller_cutover_complete: false,
    source_structure_can_claim_visual_ready: false,
    source_structure_can_claim_exportable: false,
    source_structure_can_claim_handoffable: false,
    source_structure_can_claim_domain_ready: false,
    source_structure_can_claim_production_ready: false,
  },
});
