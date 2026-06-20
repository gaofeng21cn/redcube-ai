// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { readFileSync } from 'node:fs';

import { assertRepoRefResolves } from './helpers/rca-retired-surface-guard.ts';

test('RCA functional audit exposes OPL replacement expectations and retired generic domain_action_adapter dispatch', () => {
  const currentProgram = JSON.parse(readFileSync(
    path.resolve('contracts/runtime-program/current-program.json'),
    'utf-8',
  ));
  const adoption = JSON.parse(readFileSync(
    path.resolve('contracts/runtime-program/opl-family-contract-adoption.json'),
    'utf-8',
  ));

  const surfaces = [
    currentProgram.product_release_metadata.privatized_functional_module_audit,
    currentProgram.current_state.privatized_functional_module_audit,
    currentProgram.current_state.active_baton.scope.privatized_functional_module_audit,
    adoption.privatized_functional_module_audit,
  ];
  const expectedReplacementSurfaces = {
    product_entry_continuity_refs_adapter: 'opl_app_session_shell_and_workbench',
    artifact_export_lifecycle: 'opl_artifact_lifecycle_gallery_handoff_shell',
    review_repair_transport: 'opl_review_repair_transport',
    native_helper_envelope: 'opl_native_helper_execution_envelope',
    operator_projection_shell: 'opl_app_operator_workbench_shell',
    generic_cli_mcp_wrappers: 'opl_standard_domain_agent_generated_cli_mcp_wrappers',
    codex_executor_adapter: 'opl_agent_executor_adapter',
    observability_stability_read_model: 'opl_stability_read_model_and_observability_export',
  };
  const expectedMemoryArtifactLifecycleReceiptRefs = [
    'rca-memory-receipt:visual-pattern:production-evidence-tail-ppt-image-first-accepted',
    'rca-memory-receipt:visual-pattern:production-evidence-tail-ppt-image-first-rejected',
    'rca-lifecycle-receipt:cleanup:production-evidence-tail-ppt-image-first-cleanup',
    'rca-lifecycle-receipt:restore:production-evidence-tail-ppt-image-first-restore',
    'rca-lifecycle-receipt:retention:production-evidence-tail-ppt-image-first-retention',
  ];

  for (const surface of surfaces) {
    assert.equal(surface.replacement_expectation_mode, 'opl_replacement_expectation_or_refs_only_projection');
    assert.equal(surface.physical_deletion_guard.current_safe_tombstone_candidate_count, 0);
    assert.deepEqual(surface.physical_deletion_guard.deleted_or_thinned_default_surfaces, [
      'retired_domain_action_adapter.runtime_watch_dispatch_tombstone',
      'retired_domain_action_adapter.supervision_action_tombstone',
      'retired_domain_action_adapter.continuation_action_tombstone',
      'retired_public_cli_mcp.managed_run_lookup_tombstone',
      'retired_public_cli_mcp.managed_supervision_tombstone',
      'retired_repo_local_visual_runtime.legacy_deliverable_runner_tombstone',
      'retired_repo_local_visual_runtime.legacy_run_store_tombstone',
      'retired_repo_local_visual_runtime.legacy_dag_runtime_tombstone',
    ]);
    assert.equal(
      surface.physical_deletion_guard.surface_id_policy,
      'current_deletion_proof_uses_tombstone_ids_legacy_names_only_in_retired_legacy_surface_id',
    );
    assert.equal(surface.physical_deletion_guard.physical_delete_authorization_ref, null);
    assert.deepEqual(surface.physical_deletion_guard.physical_delete_authorization_refs, []);
    assert.equal(
      surface.physical_deletion_guard.keep_as_authority_adapter_refs.length,
      surface.modules.length - 2,
    );
    assert.equal(
      surface.physical_deletion_guard.typed_blocker_refs.length,
      surface.modules.length - 2,
    );
    assert.equal(
      surface.physical_deletion_guard.typed_blocker_refs.every((ref) =>
        ref.startsWith('rca-typed-blocker:private-platform-retirement:')
        && ref.endsWith(':physical-delete-requires-explicit-owner-receipt')),
      true,
    );
    assert.equal(
      surface.physical_deletion_guard.memory_artifact_lifecycle_receipt_ref,
      'contracts/live_stage_run_progress_evidence.json#/refs/memory_lifecycle_refs',
    );
    assert.deepEqual(
      surface.physical_deletion_guard.memory_artifact_lifecycle_receipt_refs,
      expectedMemoryArtifactLifecycleReceiptRefs,
    );
    assert.equal(
      surface.physical_deletion_guard.owner_evidence_lane.surface_kind,
      'rca_private_platform_retirement_owner_evidence_lane',
    );
    assert.equal(
      surface.physical_deletion_guard.owner_evidence_lane.evidence_scope,
      'owner_native_refs_only_no_physical_delete_authorization',
    );
    assert.deepEqual(surface.physical_deletion_guard.owner_evidence_lane.physical_delete_authorization_refs, []);
    assert.deepEqual(
      surface.physical_deletion_guard.owner_evidence_lane.memory_artifact_lifecycle_receipt_refs,
      expectedMemoryArtifactLifecycleReceiptRefs,
    );
    assert.equal(
      surface.physical_deletion_guard.owner_evidence_lane.authority_boundary.opl_projection_can_authorize_physical_delete,
      false,
    );
    assert.equal(
      surface.physical_deletion_guard.owner_evidence_lane.authority_boundary.open_count_zero_can_authorize_physical_delete,
      false,
    );
    assert.equal(surface.physical_deletion_guard.retired_legacy_surface_ids.length, 8);
    assert.equal(
      new Set(surface.physical_deletion_guard.retired_legacy_surface_ids).size,
      surface.physical_deletion_guard.retired_legacy_surface_ids.length,
    );
    assert.equal(
      surface.physical_deletion_guard.retired_legacy_surface_ids.every((surfaceId) =>
        typeof surfaceId === 'string'
        && !surfaceId.endsWith('_tombstone')
        && !surfaceId.includes('compatibility_alias')),
      true,
    );
    assert.equal(surface.retire_tombstone_candidates, undefined);
    assert.equal(surface.retired_no_resurrection_guards.length, 5);
    for (const entry of surface.retired_no_resurrection_guards) {
      assert.equal(entry.surface_id.endsWith('_tombstone'), true, entry.surface_id);
      assert.equal(
        surface.physical_deletion_guard.retired_legacy_surface_ids.includes(entry.retired_legacy_surface_id),
        true,
        entry.retired_legacy_surface_id,
      );
      assert.equal(entry.active_default_caller, false, entry.surface_id);
      assert.equal(entry.active_caller, false, entry.surface_id);
      assert.equal(entry.compatibility_alias_allowed, false, entry.surface_id);
      assert.equal(entry.resurrection_policy, 'forbidden', entry.surface_id);
    }
    assert.deepEqual(surface.classification_values, [
      'domain_handler_target',
      'refs_only_adapter',
      'minimal_authority_function',
      'native_helper_implementation',
      'provenance',
    ]);
    assert.deepEqual(surface.non_adapter_classification_values, [
      'declarative_pack',
    ]);
    assert.equal(
      surface.functional_structure_gap_closure.status,
      'functional_structure_gaps_closed_evidence_gates_open',
    );
    assert.equal(surface.functional_structure_gap_closure.functional_structure_gap_count, 0);
    assert.equal(surface.functional_structure_gap_closure.completed_functional_structure_gap_count, 8);
    assert.deepEqual(surface.functional_structure_gap_closure.completed_functional_structure_gap_ids, [
      'opl_generated_surface_production_consumption',
      'repo_local_wrapper_active_caller_migration',
      'focused_hosted_attempt_real_path_cutover',
      'artifact_gallery_handoff_shell',
      'review_repair_transport',
      'opl_app_operator_drilldown',
      'workspace_source_lifecycle_receipt_shell',
      'legacy_physical_cleanup',
    ]);
    assert.equal(
      surface.functional_structure_gap_closure.remaining_gap_class,
      'none',
    );
    assert.deepEqual(surface.functional_structure_gap_closure.remaining_functional_structure_gap_ids, []);
    assert.equal(
      surface.functional_structure_gap_closure.evidence_gap_class,
      'production_live_soak_evidence_only',
    );
    assert.ok(
      surface.functional_structure_gap_closure.remaining_evidence_gate_ids.includes(
        'real_artifact_producing_domain_owner_receipt',
      ),
    );
    for (const value of Object.values(surface.forbidden_generic_owner_flags)) {
      assert.equal(value, false);
    }

    for (const entry of surface.modules) {
      assert.ok(['opl', 'redcube_ai'].includes(entry.opl_replacement_expectation.owner), entry.module_id);
      assert.ok([
        'consumer_projection_only',
        'declarative_pack_provider',
        'authority_function_owner',
      ].includes(entry.opl_replacement_expectation.rca_consumes_as), entry.module_id);
      assert.notEqual(entry.migration_class, 'opl_owned_replacement', entry.module_id);
      assert.equal(entry.opl_replacement_expectation.rca_owns_replacement_runtime, false, entry.module_id);
      assert.equal(entry.physical_deletion_guard.safe_to_delete_now, false, entry.module_id);
      if (entry.module_id === 'visual_pack_compiler_handoff') {
        assert.deepEqual(entry.physical_deletion_guard.required_before_delete, [
          'domain_package_replaced_by_new_rca_pack_contract',
        ], entry.module_id);
      } else if (entry.module_id === 'visual_authority_functions') {
        assert.deepEqual(entry.physical_deletion_guard.required_before_delete, [
          'visual_domain_authority_moved_by_explicit_product_decision',
        ], entry.module_id);
        assert.deepEqual(entry.authority_surface_taxonomy.ai_first_judgment_surface_ids, [
          'source_readiness_verdict',
          'communication_visual_direction_decision',
          'review_export_verdict',
          'visual_memory_accept_reject',
        ]);
        assert.deepEqual(entry.authority_surface_taxonomy.programmatic_authority_surface_ids, [
          'artifact_mutation_authorization',
          'owner_receipt_signer',
          'native_helper_implementation',
        ]);
        assert.equal(entry.programmatic_verdict_generation_allowed, false);
        assert.equal(entry.mechanical_decision_forbidden_for_all_authority_surfaces, true);
      } else {
        assert.deepEqual(entry.physical_deletion_guard.required_before_delete, [
          'domain_authority_refs_preserved',
          'no_regression_proof_recorded',
        ], entry.module_id);
        assert.equal(entry.physical_deletion_guard.physical_delete_authorization_ref, null, entry.module_id);
        assert.equal(
          entry.physical_deletion_guard.keep_as_authority_adapter_ref,
          `rca-keep-authority-adapter:private-platform-retirement:${entry.module_id.replaceAll('_', '-')}`,
          entry.module_id,
        );
        assert.equal(
          entry.physical_deletion_guard.typed_blocker_ref,
          `rca-typed-blocker:private-platform-retirement:${entry.module_id.replaceAll('_', '-')}:physical-delete-requires-explicit-owner-receipt`,
          entry.module_id,
        );
        assert.equal(
          entry.physical_deletion_guard.memory_artifact_lifecycle_receipt_ref,
          'contracts/live_stage_run_progress_evidence.json#/refs/memory_lifecycle_refs',
          entry.module_id,
        );
        assert.deepEqual(
          entry.physical_deletion_guard.owner_evidence_lane.memory_artifact_lifecycle_receipt_refs,
          expectedMemoryArtifactLifecycleReceiptRefs,
          entry.module_id,
        );
        assert.equal(entry.bridge_exit_gate.physical_delete_authorization_ref, null, entry.module_id);
        assert.equal(
          entry.bridge_exit_gate.keep_as_authority_adapter_ref,
          entry.physical_deletion_guard.keep_as_authority_adapter_ref,
          entry.module_id,
        );
        assert.equal(
          entry.bridge_exit_gate.typed_blocker_ref,
          entry.physical_deletion_guard.typed_blocker_ref,
          entry.module_id,
        );
        assert.equal(
          entry.bridge_exit_gate.owner_evidence_lane.authority_boundary.opl_projection_can_authorize_physical_delete,
          false,
          entry.module_id,
        );
        assert.equal(
          entry.bridge_exit_gate.owner_evidence_lane.authority_boundary.open_count_zero_can_authorize_physical_delete,
          false,
          entry.module_id,
        );
      }
      assert.equal(entry.declares_production_soak_complete, false, entry.module_id);
    }

    const byId = Object.fromEntries(surface.modules.map((entry) => [entry.module_id, entry]));
    for (const [moduleId, replacementSurface] of Object.entries(expectedReplacementSurfaces)) {
      assert.equal(byId[moduleId].opl_replacement_expectation.replacement_surface, replacementSurface);
    }
  }
});

test('RCA physical morphology policy keeps active source tails classified and forbids generic owner return', () => {
  const policy = JSON.parse(readFileSync(
    path.resolve('contracts/physical_source_morphology_policy.json'),
    'utf-8',
  ));
  const byId = Object.fromEntries(policy.active_surface_classifications.map((entry) => [entry.surface_id, entry]));

  assert.equal(policy.surface_kind, 'rca_physical_source_morphology_policy');
  assert.equal(policy.owner, 'redcube_ai');
  assert.equal(policy.consumer, 'opl');
  assert.equal(policy.legacy_name_policy.compatibility_alias_allowed, false);
  assert.equal(policy.legacy_name_policy.allowance_required_for_active_surface_text_matches, true);
  assert.deepEqual(policy.source_ref_integrity_gate, {
    policy_kind: 'active_surface_source_refs_must_resolve_before_classification_is_trusted',
    applies_to: ['active_surface_classifications[*].source_refs', 'active_surface_classifications[*].machine_boundary_refs'],
    accepted_ref_shapes: ['repo_path', 'repo_directory', 'repo_path_anchor'],
    anchor_separator: '#',
    repo_local_refs_only: true,
    absolute_path_allowed: false,
    parent_directory_traversal_allowed: false,
    uri_ref_allowed: false,
    machine_boundary_refs_require_anchor: true,
    stale_source_ref_reopens_gap: true,
    missing_source_ref_allowed: false,
    missing_machine_boundary_anchor_allowed: false,
    generic_owner_classification_from_unresolved_ref_allowed: false,
    production_readiness_claim_allowed: false,
  });
  assert.deepEqual(policy.legacy_name_policy.tracked_legacy_terms, [
    'managed',
    'runtime',
    'gateway',
    'session',
    'domain_action_adapter',
  ]);
  assert.deepEqual(policy.legacy_name_policy.allowed_legacy_name_roles, [
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
  assert.deepEqual(policy.legacy_name_policy.retired_control_plane_terms_allowed_only_as, [
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
  assert.deepEqual(policy.legacy_name_policy.forbidden_active_surface_ids, [
    'legacy_managed_runtime_gateway_names',
  ]);
  assert.deepEqual(policy.legacy_name_policy.allowance_guard_required_fields, [
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
  ]);
  assert.deepEqual(policy.legacy_name_policy.package_protocol_boundary_policy, {
    package_name: '@redcube/domain-entry',
    allowed_as: 'package_protocol_boundary',
    public_identity: 'redcube-ai',
    public_framework_identity_allowed: false,
    generic_domain_entry_runtime_owner_allowed: false,
    compatibility_alias_allowed: false,
  });
  assert.equal(
    policy.new_surface_admission_gate.forbidden_new_rca_roles.includes('generic_attempt_ledger_owner'),
    true,
  );
  assert.equal(policy.allowed_surface_classes.includes('package_protocol_boundary'), true);

  const requiredClassifications = {
    agent_declarative_visual_pack: 'declarative_visual_pack',
    runtime_program_machine_contracts: 'machine_contract',
    mcp_product_entry_domain_entry: 'service_safe_domain_entry',
    redcube_domain_entry_package_protocol_boundary: 'package_protocol_boundary',
    product_entry_continuity_refs_adapter: 'refs_only_read_model',
    workspace_run_envelope_helpers: 'refs_only_read_model',
    runtime_watch_projection: 'refs_only_read_model',
    domain_action_adapter_guarded_actions: 'domain_handler_target',
    operator_evidence_stability_projection: 'refs_only_read_model',
    visual_authority_functions: 'minimal_visual_authority_function',
    visual_route_runtime_family_implementations: 'visual_route_runtime_family_implementation',
    repo_shell_verification_wrappers: 'repo_native_verification_wrapper',
    retired_product_entry_contract_tombstone_refs: 'tombstone_or_provenance',
    redcube_cli_domain_entry_adapter: 'service_safe_domain_entry',
  };

  for (const [surfaceId, classification] of Object.entries(requiredClassifications)) {
    assert.equal(byId[surfaceId].classification, classification, surfaceId);
    for (const value of Object.values(byId[surfaceId].forbidden_generic_owner_flags)) {
      assert.equal(value, false, surfaceId);
    }
  }

  const legacyAllowanceExpectations = {
    agent_declarative_visual_pack: { terms: ['runtime', 'session', 'domain_action_adapter'], allowedAs: ['machine_contract_ref', 'refs_only_read_model', 'contract_safe_semantic_id', 'locator_protocol_boundary'] },
    runtime_program_machine_contracts: {
      terms: ['runtime'],
      allowedAs: ['machine_contract_ref', 'contract_safe_semantic_id'],
    },
    redcube_cli_domain_entry_adapter: {
      terms: ['runtime', 'session', 'domain_action_adapter'],
      allowedAs: ['service_safe_domain_entry', 'domain_handler_target', 'refs_only_read_model', 'package_protocol_boundary'],
    },
    product_entry_continuity_refs_adapter: {
      terms: ['runtime', 'session'],
      allowedAs: ['refs_only_read_model', 'contract_safe_semantic_id', 'locator_protocol_boundary'],
    },
    workspace_run_envelope_helpers: {
      terms: ['runtime'],
      allowedAs: ['refs_only_read_model', 'locator_protocol_boundary'],
    },
    runtime_watch_projection: {
      terms: ['runtime'],
      allowedAs: ['refs_only_read_model', 'negative_test_guard'],
    },
    visual_authority_functions: {
      terms: ['runtime', 'session'],
      allowedAs: ['minimal_visual_authority_function', 'visual_native_helper_path', 'locator_protocol_boundary'],
    },
    visual_route_runtime_family_implementations: {
      terms: ['runtime'],
      allowedAs: ['visual_route_runtime_family_implementation', 'package_protocol_boundary'],
    },
    repo_shell_verification_wrappers: {
      terms: ['runtime', 'session', 'domain_action_adapter'],
      allowedAs: ['repo_native_verification_wrapper', 'negative_test_guard'],
    },
    retired_product_entry_contract_tombstone_refs: {
      terms: ['managed', 'runtime', 'gateway', 'session', 'domain_action_adapter'],
      allowedAs: ['tombstone_or_provenance', 'contract_safe_semantic_id', 'negative_test_guard'],
    },
  };

  for (const [surfaceId, expectation] of Object.entries(legacyAllowanceExpectations)) {
    const allowance = byId[surfaceId].legacy_name_allowance;
    assert.deepEqual(allowance.legacy_terms, expectation.terms, surfaceId);
    assert.deepEqual(allowance.allowed_as, expectation.allowedAs, surfaceId);
    for (const field of policy.legacy_name_policy.allowance_guard_required_fields) {
      assert.equal(allowance[field], false, `${surfaceId}.${field}`);
    }
  }

  assert.deepEqual(byId.agent_declarative_visual_pack.source_refs, ['agent/']);
  assert.equal(
    byId.product_entry_continuity_refs_adapter.current_rca_role,
    'entry_session_domain_snapshot_refs_only_adapter_consuming_opl_generated_session_shell',
  );
  assert.deepEqual(byId.product_entry_continuity_refs_adapter.default_caller_cutover_gate, {
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
  });
  assert.deepEqual(byId.product_entry_continuity_refs_adapter.no_resurrection_gate, {
    generic_session_runtime_owner_allowed: false,
    generic_workbench_owner_allowed: false,
    generated_wrapper_owner_allowed: false,
    compatibility_alias_allowed: false,
    physical_delete_without_owner_receipt_allowed: false,
  });
  assert.equal(
    byId.redcube_domain_entry_package_protocol_boundary.current_rca_role,
    'package_protocol_boundary_for_domain_action_protocol_not_public_framework_identity',
  );
  assert.deepEqual(byId.redcube_domain_entry_package_protocol_boundary.source_refs, [
    'packages/redcube-domain-entry/package.json',
    'packages/redcube-domain-entry/src/index.ts',
  ]);
  assert.deepEqual(byId.redcube_cli_domain_entry_adapter.source_refs, [
    'apps/redcube-cli/package.json',
    'apps/redcube-cli/src/cli-parts/dispatch.ts',
    'apps/redcube-cli/src/cli-parts/help.ts',
    'apps/redcube-cli/src/types.ts',
  ]);
  assert.deepEqual(byId.visual_authority_functions.source_refs, [
    'packages/redcube-runtime/src/creative-ownership.ts',
    'packages/redcube-runtime/src/deliverable-routes.ts',
    'packages/redcube-runtime/src/executors.ts',
    'packages/redcube-runtime/src/source-intake.ts',
    'packages/redcube-runtime/src/source-readiness-pack.ts',
    'packages/redcube-runtime/src/shared-source-truth.ts',
    'python/redcube_ai/',
    'contracts/runtime-program/python-native-helper-catalog.json',
  ]);
  assert.equal(
    byId.visual_authority_functions.source_refs.includes('packages/redcube-runtime/src/'),
    false,
  );
  assert.equal(
    byId.visual_authority_functions.source_refs.includes(
      'packages/redcube-runtime/src/product-entry-continuity-ref-adapter.ts',
    ),
    false,
  );
  assert.deepEqual(byId.visual_route_runtime_family_implementations.source_refs, [
    'packages/redcube-runtime-family-ppt/src/',
    'packages/redcube-runtime-family-xiaohongshu/src/',
    'packages/redcube-runtime-family-poster-onepager/src/',
    'packages/redcube-runtime-family-registry/src/',
  ]);
  assert.equal(
    byId.visual_route_runtime_family_implementations.current_rca_role,
    'visual_route_truth_and_runtime_family_implementation_not_generic_runtime_owner',
  );
  assert.deepEqual(byId.visual_route_runtime_family_implementations.no_resurrection_gate, {
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
  });
  assert.equal(
    byId.redcube_cli_domain_entry_adapter.current_rca_role,
    'direct_cli_adapter_domain_handler_target_not_generated_wrapper_owner',
  );
  assert.deepEqual(byId.redcube_cli_domain_entry_adapter.no_resurrection_gate, {
    generic_cli_wrapper_owner_allowed: false,
    generic_workbench_owner_allowed: false,
    generic_session_runtime_owner_allowed: false,
    generic_domain_entry_runtime_owner_allowed: false,
    compatibility_alias_allowed: false,
  });
  assert.equal(
    byId.runtime_watch_projection.current_rca_role,
    'run_review_existing_run_locator_refs_only_projection_not_supervisor',
  );
  assert.deepEqual(byId.workspace_run_envelope_helpers.machine_boundary_refs, [
    'packages/redcube-runtime-protocol/src/workspace.ts#WORKSPACE_LOCATOR_ENVELOPE_BOUNDARY',
    'packages/redcube-runtime-protocol/src/runs.ts#RUN_LOCATOR_ENVELOPE_BOUNDARY',
  ]);
  assert.equal(
    byId.workspace_run_envelope_helpers.no_resurrection_gate.generic_runtime_owner_allowed,
    false,
  );
  assert.deepEqual(byId.runtime_watch_projection.machine_boundary_refs, [
    'packages/redcube-domain-entry/src/actions/run-review-ref-projection.ts#RUNTIME_WATCH_BOUNDARY',
  ]);
  assert.equal(
    byId.runtime_watch_projection.no_resurrection_gate.generic_session_runtime_owner_allowed,
    false,
  );
  assert.equal(
    byId.runtime_watch_projection.no_resurrection_gate.compatibility_alias_allowed,
    false,
  );
  assert.equal(
    byId.domain_action_adapter_guarded_actions.current_rca_role,
    'guarded_domain_action_target_and_refs_only_domain_action_adapter_adapter_not_domain_action_adapter_owner',
  );
  assert.equal(
    byId.operator_evidence_stability_projection.current_rca_role,
    'operator_evidence_and_stability_refs_only_read_model_consuming_opl_workbench',
  );
  assert.equal(byId.legacy_managed_runtime_gateway_names, undefined);
  assert.equal(
    byId.retired_product_entry_contract_tombstone_refs.current_rca_role,
    'contract_safe_semantic_id_or_tombstone_provenance_only',
  );
  assert.equal(
    byId.retired_product_entry_contract_tombstone_refs.source_refs.includes(
      'docs/history/tombstones/retired-managed-product-entry-contract-2026-05-20.md',
    ),
    true,
  );
  assert.deepEqual(byId.retired_product_entry_contract_tombstone_refs.no_resurrection_gate, {
    legacy_managed_runtime_domain_entry_surface_id_allowed: false,
    compatibility_alias_allowed: false,
    callable_alias_allowed: false,
    active_caller_allowed: false,
  });

  for (const entry of policy.active_surface_classifications) {
    assert.notDeepEqual(entry.source_refs ?? [], [], entry.surface_id);
    for (const sourceRef of entry.source_refs ?? []) {
      assertRepoRefResolves(sourceRef, `${entry.surface_id}.source_refs`);
    }
    for (const sourceRef of entry.machine_boundary_refs ?? []) {
      assert.equal(String(sourceRef).includes('#'), true, `${entry.surface_id}.machine_boundary_refs`);
      assertRepoRefResolves(sourceRef, `${entry.surface_id}.machine_boundary_refs`);
    }
  }
});
