// @ts-nocheck

import {
  SOURCE_THINNING_TAIL_GATE,
} from './physical-source-morphology-policy-tail-gate.js';

const RCA_PHYSICAL_MORPHOLOGY_ALLOWED_CLASSES = Object.freeze([
  'declarative_visual_pack',
  'machine_contract',
  'package_protocol_boundary',
  'service_safe_domain_entry',
  'domain_handler_target',
  'refs_only_read_model',
  'minimal_visual_authority_function',
  'visual_route_runtime_family_implementation',
  'visual_native_helper_implementation',
  'repo_native_verification_wrapper',
  'diagnostic_or_fixture',
  'tombstone_or_provenance',
]);

const RCA_PHYSICAL_MORPHOLOGY_FORBIDDEN_OWNER_CLASSES = Object.freeze([
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

const FORBIDDEN_GENERIC_OWNER_FLAGS = Object.freeze({
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

const RCA_LEGACY_NAME_ALLOWANCE_ROLES = Object.freeze([
  'machine_contract_ref',
  'package_protocol_boundary',
  'service_safe_domain_entry',
  'contract_safe_semantic_id',
  'tombstone_or_provenance',
  'negative_test_guard',
  'refs_only_read_model',
  'domain_handler_target',
  'minimal_visual_authority_function',
  'visual_route_runtime_family_implementation',
  'visual_native_helper_path',
  'repo_native_verification_wrapper',
  'locator_protocol_boundary',
]);

const LEGACY_NAME_GUARD_DEFAULTS = Object.freeze({
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

const POLICY_SOURCE_STRUCTURE = Object.freeze({
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
    'default_caller_tail_false_ready_and_no_resurrection_policy_without_delete_or_readiness_authority',
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

function sourceRefIntegrityGate(activeSurfaceClassifications) {
  const policySourceStructureRefs = [
    POLICY_SOURCE_STRUCTURE.builder_ref,
    ...POLICY_SOURCE_STRUCTURE.extracted_gate_refs,
  ];
  const checkedSourceRefs = [...new Set([
    ...activeSurfaceClassifications.flatMap((entry) => entry.source_refs ?? []),
    ...policySourceStructureRefs,
  ])]
    .sort();
  const checkedMachineBoundaryRefs = [
    ...new Set(activeSurfaceClassifications.flatMap((entry) => entry.machine_boundary_refs ?? [])),
  ].sort();
  return {
    policy_kind: 'active_surface_source_refs_must_resolve_before_classification_is_trusted',
    state: 'repo_local_source_refs_declared_no_second_truth',
    applies_to: [
      'active_surface_classifications[*].source_refs',
      'active_surface_classifications[*].machine_boundary_refs',
      'policy_source_structure.builder_ref',
      'policy_source_structure.extracted_gate_refs',
      'legacy_name_policy.retired_legacy_surface_id_pointer_policy',
      'legacy_name_policy.retired_compatibility_payload_field_policy',
    ],
    checked_source_ref_count: checkedSourceRefs.length,
    checked_machine_boundary_ref_count: checkedMachineBoundaryRefs.length,
    checked_source_refs: checkedSourceRefs,
    checked_machine_boundary_refs: checkedMachineBoundaryRefs,
    accepted_ref_shapes: [
      'repo_path',
      'repo_directory',
      'repo_path_anchor',
    ],
    anchor_separator: '#',
    repo_local_refs_only: true,
    absolute_path_allowed: false,
    parent_directory_traversal_allowed: false,
    uri_ref_allowed: false,
    human_doc_ref_allowed_as_machine_source_ref: false,
    retired_compatibility_source_refs_allowed_only_as_tombstone_or_negative_guard: true,
    machine_boundary_refs_require_anchor: true,
    stale_source_ref_reopens_gap: true,
    missing_source_ref_allowed: false,
    missing_machine_boundary_anchor_allowed: false,
    generic_owner_classification_from_unresolved_ref_allowed: false,
    source_ref_integrity_can_claim_visual_ready: false,
    source_ref_integrity_can_claim_exportable: false,
    source_ref_integrity_can_claim_handoffable: false,
    production_readiness_claim_allowed: false,
    authority_boundary: {
      gate_can_create_missing_refs: false,
      gate_can_create_alias_files: false,
      gate_can_authorize_physical_delete: false,
      gate_can_claim_default_caller_cutover: false,
      gate_can_claim_app_or_live_readiness: false,
      gate_can_claim_visual_or_export_readiness: false,
      gate_can_claim_handoffable: false,
      gate_can_claim_domain_ready: false,
      gate_can_claim_production_ready: false,
    },
  };
}

function defaultCallerTailReadback(activeSurfaceClassifications) {
  const tailSurfaceIds = SOURCE_THINNING_TAIL_GATE.applies_to_surface_ids;
  const tailClassifications = activeSurfaceClassifications
    .filter((entry) => tailSurfaceIds.includes(entry.surface_id))
    .map((entry) => {
      const deleteGate = entry.default_caller_cutover_gate ?? {};
      const typedBlockerRef = deleteGate.physical_delete_requires_owner_receipt_ref
        ?? `rca-typed-blocker:private-platform-retirement:${entry.surface_id.replaceAll('_', '-')}:physical-delete-requires-explicit-owner-receipt`;
      return {
        surface_id: entry.surface_id,
        classification: entry.classification,
        current_rca_role: entry.current_rca_role,
        source_refs: entry.source_refs ?? [],
        required_before_physical_delete_or_further_thin: [
          ...SOURCE_THINNING_TAIL_GATE.required_before_physical_delete_or_further_thin,
        ],
        missing_evidence_worklist: [
          'opl_generated_default_caller_parity',
          'no_active_repo_local_default_caller',
          'rca_owner_receipt_or_typed_blocker_roundtrip',
          'no_forbidden_write_proof',
          'retired_alias_no_resurrection_proof',
          'tombstone_or_provenance_pointer',
        ],
        owner_delta_route: {
          next_owner: 'one-person-lab_or_redcube_ai_owner_receipt_surface',
          required_delta:
            'provide_default_caller_parity_no_active_caller_no_forbidden_write_and_owner_receipt_or_typed_blocker_refs_before_delete_or_further_thin',
          typed_blocker_ref_shape: typedBlockerRef,
        },
        no_resurrection_policy: entry.no_resurrection_gate ?? SOURCE_THINNING_TAIL_GATE.no_resurrection_guard,
        readback_claims: {
          can_claim_cleanup_complete: false,
          can_claim_physical_delete_authorized: false,
          can_claim_default_caller_cutover_complete: false,
          can_claim_visual_ready: false,
          can_claim_exportable: false,
          can_claim_handoffable: false,
          can_claim_domain_ready: false,
          can_claim_production_ready: false,
        },
      };
    });
  const missingEvidenceIds = [
    ...SOURCE_THINNING_TAIL_GATE.required_before_physical_delete_or_further_thin,
  ];
  const cleanupCandidateSurfaceIds = tailClassifications
    .filter((entry) => entry.missing_evidence_worklist.length === 0)
    .map((entry) => entry.surface_id);
  return {
    readback_id: 'rca.source_morphology.default_caller_tail_readback.v1',
    state: 'active_missing_evidence_worklist_available',
    source_gate_ref: 'contracts/physical_source_morphology_policy.json#/default_caller_tail_thinning_gate',
    tail_surface_count: tailClassifications.length,
    missing_evidence_surface_count: tailClassifications.length,
    all_tail_surfaces_missing_delete_or_further_thin_evidence: true,
    compact_retirement_summary: {
      summary_id: 'rca.source_morphology.default_caller_tail.compact_retirement_summary.v1',
      state: 'no_cleanup_candidates_owner_delta_required',
      total_tail_surface_count: tailClassifications.length,
      cleanup_candidate_count: cleanupCandidateSurfaceIds.length,
      missing_evidence_surface_count: tailClassifications.length - cleanupCandidateSurfaceIds.length,
      missing_evidence_ids: missingEvidenceIds,
      cleanup_candidate_surface_ids: cleanupCandidateSurfaceIds,
      owner_delta_required: true,
      next_owner: 'one-person-lab_or_redcube_ai_owner_receipt_surface',
      required_delta:
        'provide_default_caller_parity_no_active_caller_no_forbidden_write_and_owner_receipt_or_typed_blocker_refs_before_delete_or_further_thin',
      can_apply_cleanup: false,
      can_authorize_physical_delete: false,
      can_claim_default_caller_cutover_complete: false,
      can_claim_visual_ready: false,
      can_claim_domain_ready: false,
      can_claim_production_ready: false,
    },
    readback_outputs: [
      'active_surface_classification',
      'compact_retirement_summary',
      'missing_evidence_worklist',
      'owner_delta_route',
      'typed_blocker_ref_shape',
      'no_resurrection_policy',
    ],
    tail_classifications: tailClassifications,
    false_ready_guard: {
      readback_can_claim_cleanup_complete: false,
      readback_can_claim_physical_delete_authorized: false,
      readback_can_claim_default_caller_cutover_complete: false,
      readback_can_claim_visual_ready: false,
      readback_can_claim_exportable: false,
      readback_can_claim_handoffable: false,
      readback_can_claim_domain_ready: false,
      readback_can_claim_production_ready: false,
    },
  };
}

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
    legacy_name_allowance: legacyNameAllowance({
      legacy_terms: ['runtime', 'session', 'domain_action_adapter'],
      allowed_as: ['machine_contract_ref', 'refs_only_read_model', 'contract_safe_semantic_id', 'locator_protocol_boundary'],
      rationale: 'agent pack Markdown may point at OPL generated runtime/session/domain_action_adapter refs and locator contracts; it cannot create RCA-owned generated wrappers or generic runtime/session shells.',
    }),
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
      'packages/redcube-domain-entry/src/actions/invoke-domain-entry.ts',
      'packages/redcube-domain-entry/src/actions/invoke-product-entry.ts',
    ],
    classification: 'service_safe_domain_entry',
    current_rca_role: 'direct_protocol_adapter_domain_handler_target_not_generated_wrapper_owner',
    allowed_outputs: [
      'service_safe_domain_entry_response',
      'domain_action_metadata_refs',
      'typed_blocker',
      'owner_receipt_refs',
    ],
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
    no_resurrection_gate: {
      generic_cli_wrapper_owner_allowed: false,
      generic_workbench_owner_allowed: false,
      generic_session_runtime_owner_allowed: false,
      generic_domain_entry_runtime_owner_allowed: false,
      compatibility_alias_allowed: false,
    },
    legacy_name_allowance: legacyNameAllowance({
      legacy_terms: ['runtime', 'session', 'domain_action_adapter'],
      allowed_as: ['service_safe_domain_entry', 'domain_handler_target', 'refs_only_read_model', 'package_protocol_boundary'],
      rationale: 'CLI help and dispatch expose current OPL runtime/session/domain-handler refs; RCA remains a direct domain entry adapter and cannot own generated wrappers or generic runtime/session shells.',
    }),
  },
  {
    surface_id: 'redcube_domain_entry_package_protocol_boundary',
    source_refs: [
      'packages/redcube-domain-entry/package.json',
      'packages/redcube-domain-entry/src/index.ts',
    ],
    classification: 'package_protocol_boundary',
    current_rca_role: 'package_protocol_boundary_for_domain_action_protocol_not_public_framework_identity',
    allowed_outputs: [
      'typed_domain_action_exports',
      'product_entry_protocol_exports',
      'domain_handler_protocol_exports',
      'pack_contract_builder_exports',
    ],
  },
  {
    surface_id: 'product_entry_continuity_refs_adapter',
    source_refs: [
      'packages/redcube-runtime/src/product-entry-continuity-ref-adapter.ts',
      'packages/redcube-domain-entry/src/actions/get-product-entry-session.ts',
      'packages/redcube-domain-entry/src/actions/get-product-entry-session-parts/session-artifacts.ts',
      'packages/redcube-domain-entry/src/actions/get-product-entry-session-parts/session-surfaces.ts',
      'packages/redcube-domain-entry/src/actions/product-entry-continuity-surfaces.ts',
    ],
    classification: 'refs_only_read_model',
    current_rca_role: 'entry_session_domain_snapshot_refs_only_adapter_consuming_opl_generated_session_shell',
    allowed_outputs: [
      'entry_session_domain_refs',
      'deliverable_locator_refs',
      'latest_visual_run_ref',
      'operator_navigation_refs',
    ],
    default_caller_cutover_gate: {
      generated_session_shell_owner: 'one-person-lab',
      generated_session_command: 'opl_generated:product_session',
      generated_session_command_template: 'opl_generated:product_session --entry-session-id <entry-session-id>',
      current_status: 'opl_generated_session_shell_domain_refs',
      rca_role_after_cutover: 'domain_session_snapshot_refs_only',
      rca_owns_generic_session_shell: false,
      rca_owns_generic_workbench: false,
      rca_owns_generated_wrapper: false,
      physical_delete_authorized_now: false,
      physical_delete_requires_owner_receipt_ref:
        'rca-typed-blocker:private-platform-retirement:product-entry-continuity-refs-adapter:physical-delete-requires-explicit-owner-receipt',
      no_forbidden_write_ref:
        'no-forbidden-write:rca/default-caller-deletion/product_entry_continuity_refs_adapter/refs-only-boundary',
    },
    no_resurrection_gate: {
      generic_session_runtime_owner_allowed: false,
      generic_workbench_owner_allowed: false,
      generated_wrapper_owner_allowed: false,
      compatibility_alias_allowed: false,
      physical_delete_without_owner_receipt_allowed: false,
    },
    legacy_name_allowance: legacyNameAllowance({
      legacy_terms: ['runtime', 'session'],
      allowed_as: ['refs_only_read_model', 'contract_safe_semantic_id', 'locator_protocol_boundary'],
      rationale: 'runtime/session wording is constrained to entry-session continuity refs and runtime-state locator refs; it does not create a generic runtime or session owner.',
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
      'packages/redcube-domain-entry/src/actions/run-review-ref-projection.ts',
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
      rationale: 'runtimeWatch is a direct review/progress refs read model and remains retired from domain_action_adapter default dispatch.',
    }),
    machine_boundary_refs: [
      'packages/redcube-domain-entry/src/actions/run-review-ref-projection.ts#RUNTIME_WATCH_BOUNDARY',
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
    surface_id: 'domain_action_adapter_guarded_actions',
    source_refs: [
      'packages/redcube-domain-entry/src/actions/domain-action-adapter.ts',
      'packages/redcube-domain-entry/src/actions/guarded-domain-actions.ts',
      'packages/redcube-domain-entry/src/actions/domain-action-adapter-parts/',
    ],
    classification: 'domain_handler_target',
    current_rca_role: 'guarded_domain_action_target_and_refs_only_domain_action_adapter_adapter_not_domain_action_adapter_owner',
    allowed_outputs: [
      'owner_receipt_refs',
      'typed_blocker',
      'visual_transition_decision_refs',
      'safe_action_refs',
      'no_regression_evidence_refs',
    ],
    legacy_name_allowance: legacyNameAllowance({
      legacy_terms: ['managed', 'runtime', 'gateway', 'session', 'domain_action_adapter'],
      allowed_as: [
        'domain_handler_target',
        'refs_only_read_model',
        'contract_safe_semantic_id',
        'negative_test_guard',
      ],
      rationale: 'domain_action_adapter implementation paths are RCA guarded domain-handler targets and refs-only contract/read-model projections; legacy control-plane wording is limited to semantic ids, negative guards, OPL generated refs, and explicit tombstone fields and cannot restore RCA-owned generic dispatch, runtime, session, gateway, or wrapper ownership.',
    }),
    no_resurrection_gate: {
      generic_dispatch_owner_allowed: false,
      generic_domain_action_adapter_owner_allowed: false,
      generic_runtime_owner_allowed: false,
      generic_session_runtime_owner_allowed: false,
      generic_gateway_owner_allowed: false,
      generic_workbench_owner_allowed: false,
      generic_generated_wrapper_owner_allowed: false,
      default_runtime_watch_dispatch_allowed: false,
      compatibility_alias_allowed: false,
      callable_alias_allowed: false,
      production_readiness_claim_allowed: false,
    },
  },
  {
    surface_id: 'operator_evidence_stability_projection',
    source_refs: [
      'packages/redcube-domain-entry/src/actions/get-product-status.ts',
      'packages/redcube-domain-entry/src/actions/get-product-entry-manifest-parts/manifest-return.ts',
      'packages/redcube-domain-entry/src/actions/get-product-entry-manifest-parts/workspace-receipt-inventory.ts',
    ],
    classification: 'refs_only_read_model',
    current_rca_role: 'operator_evidence_and_stability_refs_only_read_model_consuming_opl_workbench',
    allowed_outputs: [
      'operator_evidence_refs',
      'stability_read_model_refs',
      'domain_blocker_meaning_refs',
      'safe_repair_hint_refs',
    ],
  },
  {
    surface_id: 'product_entry_manifest_projection',
    source_refs: [
      'packages/redcube-domain-entry/src/actions/get-product-entry-manifest.ts',
      'packages/redcube-domain-entry/src/actions/get-product-entry-manifest-parts/',
    ],
    classification: 'refs_only_read_model',
    current_rca_role: 'body_free_product_entry_manifest_projection_and_shell_catalog_not_generated_wrapper_owner',
    allowed_outputs: [
      'product_entry_manifest_refs',
      'domain_entry_contract_refs',
      'visual_route_policy_refs',
      'operator_projection_refs',
      'opl_generated_shell_projection_refs',
      'typed_blocker_refs',
    ],
    legacy_name_allowance: legacyNameAllowance({
      legacy_terms: ['managed', 'runtime', 'gateway', 'session', 'domain_action_adapter'],
      allowed_as: [
        'refs_only_read_model',
        'domain_handler_target',
        'contract_safe_semantic_id',
        'locator_protocol_boundary',
        'negative_test_guard',
      ],
      rationale: 'Product-entry manifest assembly and parts expose body-free RCA domain refs, visual route policy refs, OPL generated shell refs, operator projections, and typed blockers; legacy control-plane wording is limited to refs, semantic ids, negative guards, or generated-shell pointers and cannot create RCA-owned product/session/workbench/domain_action_adapter wrappers.',
    }),
    no_resurrection_gate: {
      generic_product_wrapper_owner_allowed: false,
      generic_session_runtime_owner_allowed: false,
      generic_workbench_owner_allowed: false,
      generic_domain_action_adapter_owner_allowed: false,
      generic_generated_wrapper_owner_allowed: false,
      compatibility_alias_allowed: false,
      callable_alias_allowed: false,
      production_readiness_claim_allowed: false,
    },
  },
  {
    surface_id: 'deliverable_route_attempt_shell',
    source_refs: [
      'packages/redcube-domain-entry/src/actions/run-deliverable-route.ts',
      'packages/redcube-domain-entry/src/actions/run-deliverable-route-parts/',
    ],
    classification: 'domain_handler_target',
    current_rca_role: 'visual_route_attempt_domain_handler_target_not_generic_route_attempt_shell',
    allowed_outputs: [
      'visual_route_precondition_refs',
      'allowed_next_stage_refs',
      'route_dependency_recovery_refs',
      'stop_after_stage_continuation_refs',
      'repair_target_refs',
      'stage_artifact_contract_refs',
      'domain_entry_response_refs',
      'typed_blocker',
    ],
    default_caller_cutover_gate: {
      generated_route_attempt_shell_owner: 'one-person-lab',
      current_status: 'source_split_landed_default_caller_tail',
      rca_role_after_cutover: 'visual_route_handler_target_and_precondition_refs',
      rca_owns_generic_route_attempt_shell: false,
      rca_owns_retry_dead_letter_transport: false,
      rca_owns_attempt_ledger: false,
      physical_delete_authorized_now: false,
      physical_delete_requires_owner_receipt_ref:
        'rca-typed-blocker:private-platform-retirement:deliverable-route-attempt-shell:physical-delete-requires-explicit-owner-receipt',
      no_forbidden_write_ref:
        'no-forbidden-write:rca/default-caller-deletion/deliverable_route_attempt_shell/domain-handler-boundary',
    },
    legacy_name_allowance: legacyNameAllowance({
      legacy_terms: ['runtime'],
      allowed_as: ['domain_handler_target', 'refs_only_read_model', 'negative_test_guard'],
      rationale: 'runDeliverableRoute and its parts remain a RCA visual route domain handler target plus route dependency / continuation / repair refs; OPL owns the generic route attempt shell, retry/dead-letter, and attempt ledger.',
    }),
    no_resurrection_gate: {
      generic_runner_owner_allowed: false,
      generic_attempt_ledger_owner_allowed: false,
      generic_retry_dead_letter_owner_allowed: false,
      generic_route_attempt_shell_owner_allowed: false,
      generic_review_repair_transport_owner_allowed: false,
      generic_session_runtime_owner_allowed: false,
      generic_generated_wrapper_owner_allowed: false,
      compatibility_alias_allowed: false,
      callable_alias_allowed: false,
      production_readiness_claim_allowed: false,
    },
  },
  {
    surface_id: 'executor_runtime_route_run_records',
    source_refs: [
      'packages/redcube-runtime-protocol/src/executor-runtime.ts',
      'packages/redcube-runtime-protocol/src/executor-runtime-parts/route-run-records.ts',
    ],
    classification: 'refs_only_read_model',
    current_rca_role: 'executor_policy_and_route_run_record_refs_adapter_not_attempt_ledger',
    allowed_outputs: [
      'executor_policy_refs',
      'route_run_record_refs',
      'route_run_event_refs',
      'stale_attempt_audit_refs',
      'cross_provider_attempt_refs',
      'typed_blocker',
    ],
    default_caller_cutover_gate: {
      generated_attempt_ledger_owner: 'one-person-lab',
      generated_runtime_record_owner: 'one-person-lab',
      current_status: 'refs_only_route_run_record_default_caller_tail',
      rca_role_after_cutover: 'route_executor_policy_refs_only',
      rca_owns_generic_attempt_ledger: false,
      rca_owns_generic_runtime_record_store: false,
      rca_owns_generic_event_log: false,
      physical_delete_authorized_now: false,
      physical_delete_requires_owner_receipt_ref:
        'rca-typed-blocker:private-platform-retirement:executor-runtime-route-run-records:physical-delete-requires-explicit-owner-receipt',
      no_forbidden_write_ref:
        'no-forbidden-write:rca/default-caller-deletion/executor_runtime_route_run_records/refs-only-boundary',
    },
    legacy_name_allowance: legacyNameAllowance({
      legacy_terms: ['runtime'],
      allowed_as: ['refs_only_read_model', 'package_protocol_boundary', 'locator_protocol_boundary'],
      rationale: 'executor-runtime protocol files expose executor policy and neutral route-run record refs only; OPL owns the generic Agent Executor Adapter, attempt ledger, runtime record store, and event log default caller.',
    }),
    no_resurrection_gate: {
      generic_runner_owner_allowed: false,
      generic_attempt_ledger_owner_allowed: false,
      generic_event_log_owner_allowed: false,
      generic_runtime_record_store_owner_allowed: false,
      generic_session_runtime_owner_allowed: false,
      generic_generated_wrapper_owner_allowed: false,
      compatibility_alias_allowed: false,
      callable_alias_allowed: false,
      production_readiness_claim_allowed: false,
    },
  },
  {
    surface_id: 'visual_authority_functions',
    source_refs: [
      'packages/redcube-runtime/src/creative-ownership.ts',
      'packages/redcube-runtime/src/deliverable-routes.ts',
      'packages/redcube-runtime/src/executors.ts',
      'packages/redcube-runtime/src/source-intake.ts',
      'packages/redcube-runtime/src/source-readiness-pack.ts',
      'packages/redcube-runtime/src/shared-source-truth.ts',
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
      legacy_terms: ['runtime', 'session'],
      allowed_as: ['minimal_visual_authority_function', 'visual_native_helper_path', 'locator_protocol_boundary'],
      rationale: 'runtime package paths are implementation homes for visual authority/native helpers; session wording is limited to locator/provenance refs such as product-entry-session IDs, not generic session runtime ownership.',
    }),
  },
  {
    surface_id: 'visual_route_runtime_family_implementations',
    source_refs: [
      'packages/redcube-runtime-family-ppt/src/',
      'packages/redcube-runtime-family-xiaohongshu/src/',
      'packages/redcube-runtime-family-poster-onepager/src/',
      'packages/redcube-runtime-family-registry/src/',
    ],
    classification: 'visual_route_runtime_family_implementation',
    current_rca_role: 'visual_route_truth_and_runtime_family_implementation_not_generic_runtime_owner',
    allowed_outputs: [
      'visual_route_artifact_refs',
      'route_family_policy_refs',
      'review_export_gate_refs',
      'stage_artifact_refs',
      'runtime_family_catalog_refs',
    ],
    legacy_name_allowance: legacyNameAllowance({
      legacy_terms: ['runtime'],
      allowed_as: ['visual_route_runtime_family_implementation', 'package_protocol_boundary'],
      rationale: 'runtime-family packages implement RCA visual route families and the direct registry for those route handlers; they cannot own generic runtime, session, workbench, attempt ledger, scheduler, review/repair transport, or generated wrapper surfaces.',
    }),
    no_resurrection_gate: {
      generic_scheduler_owner_allowed: false,
      generic_runner_owner_allowed: false,
      generic_attempt_ledger_owner_allowed: false,
      generic_workbench_owner_allowed: false,
      generic_review_repair_transport_owner_allowed: false,
      generic_session_runtime_owner_allowed: false,
      generic_artifact_lifecycle_owner_allowed: false,
      generic_generated_wrapper_owner_allowed: false,
      generic_domain_entry_runtime_owner_allowed: false,
      generic_supervisor_owner_allowed: false,
      compatibility_alias_allowed: false,
      callable_alias_allowed: false,
      production_readiness_claim_allowed: false,
    },
  },
  {
    surface_id: 'repo_shell_verification_wrappers',
    source_refs: [
      'scripts/opl-module-bootstrap.sh',
      'scripts/opl-module-healthcheck.sh',
      'scripts/repo-hygiene.sh',
      'scripts/run-opl-quality-details.sh',
      'scripts/run-structural-quality-gate.sh',
      'scripts/run-with-repo-temp-env.sh',
      'scripts/verify.sh',
      'tools/image-ppt-proof/run.sh',
      'tools/native-ppt-proof/install-deps.sh',
      'tools/native-ppt-proof/run.sh',
    ],
    classification: 'repo_native_verification_wrapper',
    current_rca_role: 'repo_native_bootstrap_healthcheck_hygiene_temp_env_verification_quality_gate_and_proof_wrapper_not_runtime_owner',
    allowed_outputs: [
      'repo_hygiene_check_refs',
      'external_temp_env_boundary_refs',
      'repo_native_verification_refs',
      'module_bootstrap_refs',
      'module_healthcheck_refs',
      'structural_quality_gate_refs',
      'quality_details_refs',
      'proof_lane_artifact_refs',
      'optional_native_dependency_install_refs',
    ],
    legacy_name_allowance: legacyNameAllowance({
      legacy_terms: ['runtime', 'session', 'domain_action_adapter'],
      allowed_as: ['repo_native_verification_wrapper', 'negative_test_guard'],
      rationale: 'Shell scripts are repo-native verification, hygiene, temp-env, module healthcheck/bootstrap, structural quality, and optional proof-lane wrappers. Their runtime/session/domain_action_adapter wording comes from test names, forbidden path checks, quality output locations, proof artifact paths, or explicit proof dependency setup; it cannot create RCA-owned runtime/session/domain_action_adapter shells.',
    }),
    no_resurrection_gate: {
      generic_scheduler_owner_allowed: false,
      generic_runner_owner_allowed: false,
      generic_attempt_ledger_owner_allowed: false,
      generic_workbench_owner_allowed: false,
      generic_review_repair_transport_owner_allowed: false,
      generic_session_runtime_owner_allowed: false,
      generic_artifact_lifecycle_owner_allowed: false,
      generic_generated_wrapper_owner_allowed: false,
      generic_domain_entry_runtime_owner_allowed: false,
      generic_supervisor_owner_allowed: false,
      compatibility_alias_allowed: false,
      callable_alias_allowed: false,
      production_readiness_claim_allowed: false,
    },
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
      legacy_terms: ['managed', 'runtime', 'gateway', 'session', 'domain_action_adapter'],
      allowed_as: ['tombstone_or_provenance', 'contract_safe_semantic_id', 'negative_test_guard'],
      rationale: 'legacy control-plane terms are retained only for tombstone read-through, semantic ids, or no-resurrection guards.',
    }),
    no_resurrection_gate: {
      legacy_managed_runtime_domain_entry_surface_id_allowed: false,
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
    policy_source_structure: POLICY_SOURCE_STRUCTURE,
    allowed_surface_classes: [...RCA_PHYSICAL_MORPHOLOGY_ALLOWED_CLASSES],
    forbidden_generic_owner_classes: [...RCA_PHYSICAL_MORPHOLOGY_FORBIDDEN_OWNER_CLASSES],
    active_surface_classifications: ACTIVE_SURFACE_CLASSIFICATIONS.map((entry) => ({
      ...entry,
      forbidden_generic_owner_flags: { ...FORBIDDEN_GENERIC_OWNER_FLAGS },
    })),
    default_caller_tail_thinning_gate: SOURCE_THINNING_TAIL_GATE,
    default_caller_tail_readback: defaultCallerTailReadback(ACTIVE_SURFACE_CLASSIFICATIONS),
    source_ref_integrity_gate: sourceRefIntegrityGate(ACTIVE_SURFACE_CLASSIFICATIONS),
    legacy_name_policy: {
      retired_control_plane_terms_allowed_only_as: [
        ...RCA_LEGACY_NAME_ALLOWANCE_ROLES,
      ],
      tracked_legacy_terms: [
        'managed',
        'runtime',
        'gateway',
        'session',
        'domain_action_adapter',
      ],
      allowed_legacy_name_roles: [...RCA_LEGACY_NAME_ALLOWANCE_ROLES],
      forbidden_active_surface_ids: [
        'legacy_managed_runtime_gateway_names',
      ],
      retired_legacy_surface_id_pointer_policy: {
        policy_kind: 'retired_legacy_surface_ids_must_stay_inside_tombstone_or_provenance_fields',
        allowed_json_pointer_suffixes: [
          '/physical_deletion_guard/retired_legacy_surface_ids/*',
          '/retired_no_resurrection_guards/*/retired_legacy_surface_id',
        ],
        allowed_leaf_file_pointer_suffixes: [
          {
            file_suffix: '/physical_deletion_guard.json',
            pointer_suffix: '/retired_legacy_surface_ids/*',
          },
          {
            file_suffix: '/retired_no_resurrection_guards.json',
            pointer_suffix: '/*/retired_legacy_surface_id',
          },
        ],
        generated_read_through_snapshot_refs: [
          'contracts/runtime-program/current-program.json',
          'contracts/runtime-program/current-program-parts/',
          'contracts/runtime-program/opl-family-contract-adoption.json',
        ],
        active_callable_path_allowed: false,
        compatibility_alias_allowed: false,
        production_readiness_claim_allowed: false,
      },
      retired_compatibility_payload_field_policy: {
        policy_kind: 'retired_compatibility_payload_fields_must_stay_inside_negative_guard_fields',
        retired_field_ids: [
          'managed_runtime_compatibility_alias',
        ],
        retired_field_ids_as_json_keys_allowed: false,
        policy_declaration_pointer_suffixes: [
          '/legacy_name_policy/retired_compatibility_payload_field_policy/retired_field_ids/*',
        ],
        allowed_json_pointer_suffixes: [
          '/forbidden_payload_fields/*',
          '/forbidden_receipt_fields/*',
        ],
        active_payload_template_allowed: false,
        compatibility_alias_allowed: false,
        success_payload_field_allowed: false,
        production_readiness_claim_allowed: false,
      },
      allowance_required_for_active_surface_text_matches: true,
      allowance_guard_required_fields: [
        'compatibility_alias_allowed',
        'callable_alias_allowed',
        'public_identity_allowed',
        'active_generic_runtime_owner_allowed',
        'active_generic_domain_entry_owner_allowed',
        'active_generic_gateway_owner_allowed',
        'active_generic_session_runtime_owner_allowed',
        'active_generic_domain_action_adapter_owner_allowed',
        'active_generic_workbench_owner_allowed',
        'active_generic_attempt_ledger_owner_allowed',
      ],
      package_protocol_boundary_policy: {
        package_name: '@redcube/domain-entry',
        allowed_as: 'package_protocol_boundary',
        public_identity: 'redcube-ai',
        public_framework_identity_allowed: false,
        generic_domain_entry_runtime_owner_allowed: false,
        compatibility_alias_allowed: false,
      },
      compatibility_alias_allowed: false,
      active_generic_runtime_owner_allowed: false,
      active_generic_domain_entry_owner_allowed: false,
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
        'visual_route_runtime_family_implementation',
        'visual_native_helper_implementation',
        'repo_native_verification_wrapper',
        'diagnostic_or_fixture',
      ],
      forbidden_new_rca_roles: [...RCA_PHYSICAL_MORPHOLOGY_FORBIDDEN_OWNER_CLASSES],
      reopen_gap_if_forbidden_owner_role_appears: true,
    },
  };
}
