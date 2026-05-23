// @ts-nocheck

export const RCA_PHYSICAL_MORPHOLOGY_ALLOWED_CLASSES = Object.freeze([
  'declarative_visual_pack',
  'machine_contract',
  'package_protocol_boundary',
  'service_safe_domain_entry',
  'domain_handler_target',
  'refs_only_read_model',
  'minimal_visual_authority_function',
  'visual_native_helper_implementation',
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
  'generic_gateway_runtime_owner',
]);

const FORBIDDEN_GENERIC_OWNER_FLAGS = Object.freeze({
  rca_owns_generic_scheduler: false,
  rca_owns_generic_runner: false,
  rca_owns_generic_attempt_ledger: false,
  rca_owns_generic_workbench: false,
  rca_owns_generic_review_repair_transport: false,
  rca_owns_generic_session_runtime: false,
  rca_owns_generic_artifact_lifecycle: false,
  rca_owns_generic_generated_wrapper: false,
  rca_owns_generic_gateway_runtime: false,
});

export const RCA_LEGACY_NAME_ALLOWANCE_ROLES = Object.freeze([
  'machine_contract_ref',
  'package_protocol_boundary',
  'service_safe_domain_entry',
  'contract_safe_semantic_id',
  'tombstone_or_provenance',
  'negative_test_guard',
  'refs_only_read_model',
  'domain_handler_target',
  'minimal_visual_authority_function',
  'visual_native_helper_path',
  'locator_protocol_boundary',
]);

const LEGACY_NAME_GUARD_DEFAULTS = Object.freeze({
  compatibility_alias_allowed: false,
  callable_alias_allowed: false,
  public_identity_allowed: false,
  active_generic_runtime_owner_allowed: false,
  active_generic_gateway_owner_allowed: false,
  active_generic_session_runtime_owner_allowed: false,
  active_generic_sidecar_owner_allowed: false,
  active_generic_workbench_owner_allowed: false,
  active_generic_attempt_ledger_owner_allowed: false,
});

function legacyNameAllowance({ legacy_terms, allowed_as, rationale }) {
  return {
    legacy_terms,
    allowed_as,
    rationale,
    ...LEGACY_NAME_GUARD_DEFAULTS,
  };
}

const ACTIVE_SURFACE_CLASSIFICATIONS = Object.freeze([
  {
    surface_id: 'agent_declarative_visual_pack',
    source_refs: [
      'agent/',
    ],
    classification: 'declarative_visual_pack',
    current_rca_role: 'declarative_visual_pack',
    allowed_outputs: [
      'stage_prompt_policy_refs',
      'stage_contract_refs',
      'skill_refs',
      'quality_gate_refs',
      'knowledge_refs',
    ],
  },
  {
    surface_id: 'runtime_program_machine_contracts',
    source_refs: [
      'contracts/',
      'contracts/runtime-program/current-program.index.json',
      'contracts/runtime-program/current-program-parts/',
    ],
    classification: 'machine_contract',
    current_rca_role: 'contract_truth_and_leaf_program_projection',
    allowed_outputs: [
      'contract_refs',
      'semantic_id_refs',
      'tombstone_refs',
      'provenance_refs',
    ],
    legacy_name_allowance: legacyNameAllowance({
      legacy_terms: ['runtime'],
      allowed_as: ['machine_contract_ref', 'contract_safe_semantic_id'],
      rationale: 'runtime-program paths are machine contract refs and current-program leaf sources, not RCA-owned runtime implementation.',
    }),
  },
  {
    surface_id: 'mcp_product_entry_domain_entry',
    source_refs: [
      'apps/redcube-mcp/src/server.ts',
      'packages/redcube-gateway/src/actions/invoke-domain-entry.ts',
      'packages/redcube-gateway/src/actions/invoke-product-entry.ts',
    ],
    classification: 'service_safe_domain_entry',
    current_rca_role: 'direct_protocol_adapter_domain_handler_target_not_generated_wrapper_owner',
    allowed_outputs: [
      'service_safe_domain_entry_response',
      'domain_action_metadata_refs',
      'typed_blocker',
      'owner_receipt_refs',
    ],
    legacy_name_allowance: legacyNameAllowance({
      legacy_terms: ['gateway'],
      allowed_as: ['service_safe_domain_entry', 'package_protocol_boundary'],
      rationale: 'redcube-gateway source paths are implementation package/protocol boundaries over the RCA domain entry, not public gateway identity.',
    }),
  },
  {
    surface_id: 'redcube_cli_domain_entry_adapter',
    source_refs: [
      'apps/redcube-cli/package.json',
      'apps/redcube-cli/src/cli-parts/dispatch.ts',
      'apps/redcube-cli/src/cli-parts/help.ts',
      'apps/redcube-cli/src/types.ts',
    ],
    classification: 'service_safe_domain_entry',
    current_rca_role: 'direct_cli_adapter_domain_handler_target_not_generated_wrapper_owner',
    allowed_outputs: [
      'cli_domain_action_response',
      'domain_action_metadata_refs',
      'typed_blocker',
      'owner_receipt_refs',
      'operator_help_projection',
    ],
    legacy_name_allowance: legacyNameAllowance({
      legacy_terms: ['runtime', 'gateway', 'session', 'sidecar'],
      allowed_as: ['service_safe_domain_entry', 'domain_handler_target', 'refs_only_read_model', 'package_protocol_boundary'],
      rationale: 'redcube CLI source paths are direct domain-entry adapter and operator help surfaces; OPL owns generated CLI/workbench/session wrappers.',
    }),
    no_resurrection_gate: {
      generic_cli_wrapper_owner_allowed: false,
      generic_workbench_owner_allowed: false,
      generic_session_runtime_owner_allowed: false,
      generic_gateway_runtime_owner_allowed: false,
      compatibility_alias_allowed: false,
    },
  },
  {
    surface_id: 'redcube_gateway_package_protocol_boundary',
    source_refs: [
      'packages/redcube-gateway/package.json',
      'packages/redcube-gateway/src/index.ts',
    ],
    classification: 'package_protocol_boundary',
    current_rca_role: 'package_protocol_boundary_for_domain_action_protocol_not_public_gateway_identity',
    allowed_outputs: [
      'typed_domain_action_exports',
      'product_entry_protocol_exports',
      'sidecar_protocol_exports',
      'pack_contract_builder_exports',
    ],
    legacy_name_allowance: legacyNameAllowance({
      legacy_terms: ['gateway'],
      allowed_as: ['package_protocol_boundary'],
      rationale: '@redcube/gateway remains a private package/protocol boundary; public identity and MCP initialization stay redcube-ai.',
    }),
  },
  {
    surface_id: 'product_entry_session_snapshot_refs_adapter',
    source_refs: [
      'packages/redcube-runtime/src/product-entry-session-snapshot-ref-adapter.ts',
      'packages/redcube-gateway/src/actions/get-product-entry-session.ts',
      'packages/redcube-gateway/src/actions/get-product-entry-session-parts/session-artifacts.ts',
      'packages/redcube-gateway/src/actions/get-product-entry-session-parts/session-surfaces.ts',
      'packages/redcube-gateway/src/actions/product-entry-continuity-surfaces.ts',
    ],
    classification: 'refs_only_read_model',
    current_rca_role: 'entry_session_domain_snapshot_refs_only_adapter_consuming_opl_generated_session_shell',
    allowed_outputs: [
      'entry_session_domain_refs',
      'deliverable_locator_refs',
      'latest_visual_run_ref',
      'operator_navigation_refs',
    ],
    legacy_name_allowance: legacyNameAllowance({
      legacy_terms: ['session'],
      allowed_as: ['refs_only_read_model', 'contract_safe_semantic_id'],
      rationale: 'session wording is constrained to entry-session continuity refs and does not create a generic session runtime owner.',
    }),
  },
  {
    surface_id: 'workspace_run_envelope_helpers',
    source_refs: [
      'packages/redcube-runtime-protocol/src/workspace.ts',
      'packages/redcube-runtime-protocol/src/runs.ts',
    ],
    classification: 'refs_only_read_model',
    current_rca_role: 'workspace_and_run_locator_envelope_refs_only_adapter_not_attempt_ledger',
    allowed_outputs: [
      'workspace_locator_refs',
      'run_locator_refs',
      'receipt_refs',
      'typed_blocker',
    ],
    legacy_name_allowance: legacyNameAllowance({
      legacy_terms: ['runtime'],
      allowed_as: ['refs_only_read_model', 'locator_protocol_boundary'],
      rationale: 'redcube-runtime-protocol paths expose workspace/run locator envelopes only; OPL owns generic runtime and attempt ledger.',
    }),
    machine_boundary_refs: [
      'packages/redcube-runtime-protocol/src/workspace.ts#WORKSPACE_LOCATOR_ENVELOPE_BOUNDARY',
      'packages/redcube-runtime-protocol/src/runs.ts#RUN_LOCATOR_ENVELOPE_BOUNDARY',
    ],
    no_resurrection_gate: {
      generic_workspace_shell_owner_allowed: false,
      generic_runtime_owner_allowed: false,
      generic_runner_owner_allowed: false,
      generic_attempt_ledger_owner_allowed: false,
      compatibility_alias_allowed: false,
    },
  },
  {
    surface_id: 'runtime_watch_projection',
    source_refs: [
      'packages/redcube-gateway/src/actions/run-review-ref-projection.ts',
    ],
    classification: 'refs_only_read_model',
    current_rca_role: 'run_review_existing_run_locator_refs_only_projection_not_supervisor',
    allowed_outputs: [
      'run_status_refs',
      'artifact_locator_refs',
      'review_state_refs',
      'typed_blocker',
    ],
    legacy_name_allowance: legacyNameAllowance({
      legacy_terms: ['runtime'],
      allowed_as: ['refs_only_read_model', 'negative_test_guard'],
      rationale: 'runtimeWatch is a direct review/progress refs read model and remains retired from sidecar default dispatch.',
    }),
    machine_boundary_refs: [
      'packages/redcube-gateway/src/actions/run-review-ref-projection.ts#RUNTIME_WATCH_BOUNDARY',
    ],
    no_resurrection_gate: {
      generic_supervisor_owner_allowed: false,
      generic_runtime_owner_allowed: false,
      generic_session_runtime_owner_allowed: false,
      default_supervision_route_allowed: false,
      compatibility_alias_allowed: false,
    },
  },
  {
    surface_id: 'product_sidecar_guarded_actions',
    source_refs: [
      'packages/redcube-gateway/src/actions/product-sidecar.ts',
      'packages/redcube-gateway/src/actions/product-sidecar-guarded-actions.ts',
      'packages/redcube-gateway/src/actions/product-sidecar-parts/',
    ],
    classification: 'domain_handler_target',
    current_rca_role: 'guarded_domain_action_target_and_refs_only_sidecar_adapter_not_sidecar_owner',
    allowed_outputs: [
      'owner_receipt_refs',
      'typed_blocker',
      'visual_transition_decision_refs',
      'safe_action_refs',
      'no_regression_evidence_refs',
    ],
    legacy_name_allowance: legacyNameAllowance({
      legacy_terms: ['sidecar', 'gateway'],
      allowed_as: ['domain_handler_target', 'refs_only_read_model', 'package_protocol_boundary'],
      rationale: 'product sidecar code is a guarded RCA domain target consumed by OPL wrappers, not a generic sidecar owner or gateway runtime.',
    }),
  },
  {
    surface_id: 'operator_evidence_stability_projection',
    source_refs: [
      'packages/redcube-gateway/src/actions/get-product-status.ts',
      'packages/redcube-gateway/src/actions/get-product-entry-manifest-parts/manifest-return.ts',
      'packages/redcube-gateway/src/actions/get-product-entry-manifest-parts/workspace-receipt-inventory.ts',
    ],
    classification: 'refs_only_read_model',
    current_rca_role: 'operator_evidence_and_stability_refs_only_read_model_consuming_opl_workbench',
    allowed_outputs: [
      'operator_evidence_refs',
      'stability_read_model_refs',
      'domain_blocker_meaning_refs',
      'safe_repair_hint_refs',
    ],
    legacy_name_allowance: legacyNameAllowance({
      legacy_terms: ['gateway'],
      allowed_as: ['refs_only_read_model', 'package_protocol_boundary'],
      rationale: 'gateway source paths here only host operator evidence refs emitted for OPL/App projection.',
    }),
  },
  {
    surface_id: 'visual_authority_functions',
    source_refs: [
      'packages/redcube-runtime/src/',
      'python/redcube_ai/',
      'contracts/runtime-program/python-native-helper-catalog.json',
    ],
    classification: 'minimal_visual_authority_function',
    current_rca_role: 'visual_authority_and_native_helper_implementation',
    allowed_outputs: [
      'source_readiness_verdict',
      'communication_visual_direction_decision_refs',
      'review_export_verdict_refs',
      'artifact_mutation_authorization_refs',
      'visual_memory_accept_reject_receipt_refs',
      'native_helper_receipt_refs',
    ],
    legacy_name_allowance: legacyNameAllowance({
      legacy_terms: ['runtime'],
      allowed_as: ['minimal_visual_authority_function', 'visual_native_helper_path'],
      rationale: 'runtime package paths are implementation homes for visual authority/native helpers, not generic runtime ownership.',
    }),
  },
  {
    surface_id: 'retired_product_entry_contract_tombstone_refs',
    source_refs: [
      'contracts/runtime-program/product-entry-session-continuity.json',
      'docs/history/tombstones/retired-managed-product-entry-contract-2026-05-20.md',
      'docs/history/',
    ],
    classification: 'tombstone_or_provenance',
    current_rca_role: 'contract_safe_semantic_id_or_tombstone_provenance_only',
    allowed_outputs: [
      'semantic_id_refs',
      'retired_surface_guard_refs',
      'deletion_proof_refs',
      'history_refs',
      'tombstone_refs',
    ],
    retired_legacy_refs: [
      'contracts/runtime-program/managed-product-entry-hardening.json',
    ],
    legacy_name_allowance: legacyNameAllowance({
      legacy_terms: ['managed', 'runtime', 'gateway', 'session'],
      allowed_as: ['tombstone_or_provenance', 'contract_safe_semantic_id', 'negative_test_guard'],
      rationale: 'managed/runtime/gateway/session strings are retained only for tombstone read-through, semantic ids, or no-resurrection guards.',
    }),
    no_resurrection_gate: {
      legacy_managed_runtime_gateway_surface_id_allowed: false,
      compatibility_alias_allowed: false,
      callable_alias_allowed: false,
      active_caller_allowed: false,
    },
  },
]);

export function buildPhysicalSourceMorphologyPolicy() {
  return {
    surface_kind: 'rca_physical_source_morphology_policy',
    schema_version: 1,
    domain_id: 'redcube_ai',
    owner: 'redcube_ai',
    consumer: 'opl',
    status: 'active_source_classification_policy_landed',
    policy_scope: 'active_source_and_machine_contract_surface_classification',
    canonical_pack_root: 'agent/',
    contract_truth_roots: [
      'contracts/',
      'contracts/runtime-program/current-program.index.json',
      'contracts/runtime-program/current-program-parts/',
    ],
    allowed_surface_classes: [...RCA_PHYSICAL_MORPHOLOGY_ALLOWED_CLASSES],
    forbidden_generic_owner_classes: [...RCA_PHYSICAL_MORPHOLOGY_FORBIDDEN_OWNER_CLASSES],
    active_surface_classifications: ACTIVE_SURFACE_CLASSIFICATIONS.map((entry) => ({
      ...entry,
      forbidden_generic_owner_flags: { ...FORBIDDEN_GENERIC_OWNER_FLAGS },
    })),
    legacy_name_policy: {
      retired_runtime_gateway_session_sidecar_terms_allowed_only_as: [
        'tombstone_or_provenance',
        'contract_safe_semantic_id',
        'negative_test_guard',
        'refs_only_read_model',
        'domain_handler_target',
        'service_safe_domain_entry',
        'machine_contract_ref',
        'package_protocol_boundary',
        'minimal_visual_authority_function',
        'visual_native_helper_path',
        'locator_protocol_boundary',
      ],
      tracked_legacy_terms: [
        'managed',
        'runtime',
        'gateway',
        'session',
        'sidecar',
      ],
      allowed_legacy_name_roles: [...RCA_LEGACY_NAME_ALLOWANCE_ROLES],
      forbidden_active_surface_ids: [
        'legacy_managed_runtime_gateway_names',
      ],
      allowance_required_for_active_surface_text_matches: true,
      allowance_guard_required_fields: [
        'compatibility_alias_allowed',
        'callable_alias_allowed',
        'public_identity_allowed',
        'active_generic_runtime_owner_allowed',
        'active_generic_gateway_owner_allowed',
        'active_generic_session_runtime_owner_allowed',
        'active_generic_sidecar_owner_allowed',
        'active_generic_workbench_owner_allowed',
        'active_generic_attempt_ledger_owner_allowed',
      ],
      package_protocol_boundary_policy: {
        package_name: '@redcube/gateway',
        allowed_as: 'package_protocol_boundary',
        public_identity: 'redcube-ai',
        public_gateway_identity_allowed: false,
        generic_gateway_runtime_owner_allowed: false,
        compatibility_alias_allowed: false,
      },
      compatibility_alias_allowed: false,
      active_generic_runtime_owner_allowed: false,
      active_generic_gateway_owner_allowed: false,
      active_generic_session_runtime_owner_allowed: false,
    },
    new_surface_admission_gate: {
      must_classify_before_active_caller: true,
      allowed_new_rca_roles: [
        'declarative_visual_pack',
        'service_safe_domain_entry',
        'domain_handler_target',
        'refs_only_read_model',
        'minimal_visual_authority_function',
        'visual_native_helper_implementation',
        'diagnostic_or_fixture',
      ],
      forbidden_new_rca_roles: [...RCA_PHYSICAL_MORPHOLOGY_FORBIDDEN_OWNER_CLASSES],
      reopen_gap_if_forbidden_owner_role_appears: true,
    },
  };
}
