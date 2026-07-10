// @ts-nocheck
import { assert, contract, read, test } from './shared.ts';

const FUNCTIONAL_MODULE_FORBIDDEN_OWNER_FLAGS_REF =
  'contracts/functional_privatization_audit.json#/forbidden_generic_owner_flags';

test('RCA privatized functional module audit is machine readable for OPL with generic domain_action_adapter dispatch retired', () => {
  const adoption = contract();
  const rootAudit = JSON.parse(read('contracts/functional_privatization_audit.json'));
  const surfaces = [
    rootAudit,
    adoption.privatized_functional_module_audit,
  ];
  const expectedModules = [
    'product_entry_continuity_refs_adapter',
    'workspace_source_intake',
    'memory_writeback_receipt_transport',
    'artifact_export_lifecycle',
    'review_repair_transport',
    'native_helper_envelope',
    'operator_projection_shell',
    'generic_cli_mcp_wrappers',
    'codex_executor_adapter',
    'observability_stability_read_model',
    'visual_pack_compiler_handoff',
    'visual_authority_functions',
  ];

  for (const surface of surfaces) {
    assert.equal(surface.ref, '/privatized_functional_module_audit');
    assert.equal(surface.contract_ref, 'rca.privatized_functional_module_audit.v1');
    assert.equal(surface.status, 'machine_audit_projection_landed');
    assert.equal(surface.read_only, true);
    assert.equal(surface.refs_only, true);
    assert.equal(surface.replacement_expectation_mode, 'opl_replacement_expectation_or_refs_only_projection');
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
    assert.deepEqual(surface.functional_structure_gap_closure, {
      status: 'functional_structure_gaps_closed_evidence_gates_open',
      closed_at: '2026-05-17',
      closure_scope: 'rca_functional_structure_gap_classification',
      functional_structure_gap_count: 0,
      completed_functional_structure_gap_count: 8,
      completed_functional_structure_gap_ids: [
        'opl_generated_surface_production_consumption',
        'repo_local_wrapper_active_caller_migration',
        'focused_hosted_attempt_real_path_cutover',
        'artifact_gallery_handoff_shell',
        'review_repair_transport',
        'opl_app_operator_drilldown',
        'workspace_source_lifecycle_receipt_shell',
        'legacy_physical_cleanup',
      ],
      unclassified_private_generic_residue_count: 0,
      long_term_rca_generic_owner_claim_count: 0,
      remaining_gap_class: 'none',
      remaining_functional_structure_gap_ids: [],
      remaining_functional_structure_gaps: [],
      evidence_gap_class: 'production_live_soak_evidence_only',
      remaining_evidence_gate_ids: [
        'real_artifact_producing_domain_owner_receipt',
        'opl_hosted_controlled_visual_stage_long_soak',
        'real_memory_lifecycle_receipt_instances',
        'cross_family_repeated_no_regression_evidence',
      ],
      closure_basis_refs: [
          '/family_scheduler_replacement',
          '/opl_generic_primitive_consumption',
          '/opl_stability_read_model_consumption',
          '/opl_generated_interface_consumption',
          '/visual_pack_compiler_handoff',
          '/operator_evidence_readiness_projection',
        '/opl_substrate_adapter_export',
      ],
      allowed_remaining_module_classes: [
        'domain_handler_target',
        'refs_only_adapter',
        'declarative_pack',
        'minimal_authority_function',
        'native_helper_implementation',
        'provenance',
      ],
    });
    assert.equal(surface.physical_deletion_guard.current_safe_tombstone_candidate_count, 0);
    assert.equal(surface.physical_deletion_guard.closed_retirement_count, 8);
    assert.equal(surface.physical_deletion_guard.closed_default_caller_retirement_count, 5);
    assert.equal(surface.physical_deletion_guard.surface_id_policy, 'current_role_guard_with_count_only_closed_retirement_summary');
    assert.equal(surface.physical_deletion_guard.deletion_status, 'closed_retirements_counted_current_roles_guarded');
    assert.equal(surface.physical_deletion_guard.current_role_guard.forbidden_owner_flags.rca_owns_generic_runner, false);
    assert.equal(surface.fresh_large_private_surface_scan.surface_kind, 'rca_large_private_platform_surface_scan');
    assert.equal(surface.fresh_large_private_surface_scan.current_clean_truth.no_obvious_safe_large_generic_control_plane_split_found, true);
    assert.equal(surface.fresh_large_private_surface_scan.current_clean_truth.functional_structure_gap_reopened, false);
    assert.ok(surface.fresh_large_private_surface_scan.generic_surfaces_for_opl_or_shared_runtime.includes('attempt ledger and route-run event persistence'));
    assert.ok(surface.fresh_large_private_surface_scan.high_risk_surfaces_not_migrated.includes('native PPT/Office helper implementation'));
    assert.deepEqual(
      surface.fresh_large_private_surface_scan.large_surface_readout.map((entry) => entry.classification),
      [],
    );
    assert.deepEqual(surface.rca_visual_authority_allowlist, [
      'source_readiness_verdict',
      'communication_visual_direction_decision',
      'review_export_verdict',
      'artifact_mutation_authorization',
      'visual_memory_accept_reject',
      'owner_receipt_signer',
      'native_helper_implementation',
    ]);
    for (const value of Object.values(surface.forbidden_generic_owner_flags)) {
      assert.equal(value, false);
    }
    assert.deepEqual(surface.modules.map((entry) => entry.module_id), expectedModules);
    assert.equal(surface.retire_tombstone_candidates, undefined);
    assert.equal(surface.retired_no_resurrection_guards, undefined);
    assert.equal(surface.closed_retirement_summary.closed_retirement_count, 8);
    assert.equal(surface.closed_retirement_summary.current_role_guard.compatibility_alias_allowed, false);
    assert.equal(surface.authority_boundary.opl_can_index_audit_projection, true);
    assert.equal(surface.authority_boundary.opl_can_write_rca_visual_truth, false);
    assert.equal(surface.authority_boundary.opl_can_claim_production_soak_complete, false);
    assert.equal(surface.authority_boundary.rca_generic_scheduler_owner, false);
    assert.equal(surface.authority_boundary.rca_native_helper_generic_envelope_owner, false);
    assert.equal(surface.authority_boundary.rca_review_repair_transport_owner, false);
    assert.ok(surface.must_not_retire.includes('visual_review_export_gate'));
    assert.ok(surface.must_not_retire.includes('native_helper_implementation'));
    assert.equal(surface.must_not_retire.includes('domain_action_adapter_status_action_metadata_projection'), false);

    for (const entry of surface.modules) {
      assert.equal(entry.retire_tombstone, false, entry.module_id);
      assert.equal(entry.tombstone_required, false, entry.module_id);
      assert.ok(Array.isArray(entry.codePaths) && entry.codePaths.length > 0, entry.module_id);
      assert.ok(Array.isArray(entry.activeCallers) && entry.activeCallers.length > 0, entry.module_id);
      assert.equal(typeof entry.activeCallerStatus, 'string', entry.module_id);
      assert.equal(typeof entry.migrationAction, 'string', entry.module_id);
      assert.equal(typeof entry.retentionReason, 'string', entry.module_id);
      assert.equal(typeof entry.cannotAbsorbReason, 'string', entry.module_id);
      assert.ok(['opl', 'redcube_ai'].includes(entry.opl_replacement_expectation.owner), entry.module_id);
      assert.ok([
        'declarative_pack_consumed_by_opl_hosted_surface',
        'opl_generated_surface_from_declarative_pack',
        'domain_authority_function_called_by_generated_surface',
        'domain_handler_target_called_by_opl_generated_surface',
        'refs_only_adapter_to_opl_surface',
        'native_helper_implementation_called_by_opl_envelope',
      ].includes(entry.opl_replacement_expectation.expected_mode), entry.module_id);
      assert.ok([
        'consumer_projection_only',
        'declarative_pack_provider',
        'authority_function_owner',
      ].includes(entry.opl_replacement_expectation.rca_consumes_as), entry.module_id);
      assert.equal(entry.opl_replacement_expectation.rca_owns_replacement_runtime, false, entry.module_id);
      assert.equal(typeof entry.opl_replacement_expectation.expectation_ref, 'string', entry.module_id);
      assert.equal(typeof entry.opl_replacement_expectation.replacement_surface, 'string', entry.module_id);
      assert.equal(typeof entry.rca_projection_mode, 'string', entry.module_id);
      assert.ok(Array.isArray(entry.rca_exports_only) && entry.rca_exports_only.length > 0, entry.module_id);
      assert.equal(entry.physical_deletion_guard.safe_to_delete_now, false, entry.module_id);
      if (entry.module_id === 'visual_pack_compiler_handoff') {
        assert.equal(entry.opl_owned_generic_primitive_consumer, false, entry.module_id);
        assert.equal(entry.opl_absorb_candidate, false, entry.module_id);
        assert.deepEqual(entry.physical_deletion_guard.required_before_delete, [
          'domain_package_replaced_by_new_rca_pack_contract',
        ], entry.module_id);
      } else if (entry.module_id === 'visual_authority_functions') {
        assert.equal(entry.opl_owned_generic_primitive_consumer, false, entry.module_id);
        assert.equal(entry.opl_absorb_candidate, false, entry.module_id);
        assert.deepEqual(entry.physical_deletion_guard.required_before_delete, [
          'visual_domain_authority_moved_by_explicit_product_decision',
        ], entry.module_id);
      } else {
        assert.equal(entry.opl_owned_generic_primitive_consumer, true, entry.module_id);
        assert.equal(entry.opl_absorb_candidate, true, entry.module_id);
        if (entry.module_id === 'product_entry_continuity_refs_adapter') {
          assert.match(entry.physical_deletion_guard.reason, /generic session sources are retired/i);
          assert.deepEqual(entry.physical_deletion_guard.required_before_delete, [
            'replacement_rca_domain_snapshot_refs_handler',
          ]);
          assert.equal(entry.physical_deletion_guard.generic_session_source_retirement, 'completed');
        } else {
          assert.match(
            entry.physical_deletion_guard.reason,
            /retained RCA domain authority or refs-only projection/,
            entry.module_id,
          );
          assert.deepEqual(entry.physical_deletion_guard.required_before_delete, [
            'domain_authority_refs_preserved',
            'no_regression_proof_recorded',
          ], entry.module_id);
        }
      }
      assert.equal(entry.forbidden_generic_owner_flags, undefined, entry.module_id);
      assert.equal(entry.forbidden_generic_owner_flags_ref, FUNCTIONAL_MODULE_FORBIDDEN_OWNER_FLAGS_REF, entry.module_id);
      assert.equal(entry.writes_visual_truth, false, entry.module_id);
      assert.equal(entry.writes_artifact_blob, false, entry.module_id);
      assert.equal(entry.writes_memory_body, false, entry.module_id);
      assert.equal(entry.declares_visual_ready, false, entry.module_id);
      assert.equal(entry.declares_exportable, false, entry.module_id);
      assert.equal(entry.declares_handoffable, false, entry.module_id);
    }
  }

  const byId = Object.fromEntries(surfaces[0].modules.map((entry) => [entry.module_id, entry]));
  assert.equal(byId.native_helper_envelope.rca_scope, 'python_native_helper_implementation');
  assert.equal(byId.native_helper_envelope.migration_class, 'native_helper_implementation');
  const closedFunctionalModuleIds = [
    'product_entry_continuity_refs_adapter',
    'artifact_export_lifecycle',
  ];
  for (const moduleId of closedFunctionalModuleIds) {
    const entry = byId[moduleId];
    assert.ok(entry, moduleId);
    const readout = [
      entry.status,
      entry.activeCallerStatus,
      entry.migrationAction,
      entry.rca_scope,
      entry.audit_readout,
    ].join(' ');
    assert.doesNotMatch(
      readout,
      /active_private|pending|should_move|handoff_required|lifecycle_candidate|migration_candidate|until_opl_generic_runner_exists/i,
      moduleId,
    );
    assert.equal(entry.opl_replacement_expectation.owner, 'opl', moduleId);
    assert.equal(entry.opl_replacement_expectation.rca_consumes_as, 'consumer_projection_only', moduleId);
    assert.equal(entry.opl_replacement_expectation.rca_owns_replacement_runtime, false, moduleId);
  }
  assert.equal(
    byId.product_entry_continuity_refs_adapter.status,
    'generic_session_sources_retired_domain_snapshot_refs_retained',
  );
  assert.equal(
    byId.product_entry_continuity_refs_adapter.activeCallerStatus,
    'opl_generated_session_shell_consumes_rca_domain_snapshot_refs',
  );
  assert.equal(byId.product_entry_continuity_refs_adapter.opl_generic_primitive, 'workbench_shell');
  assert.equal(byId.product_entry_continuity_refs_adapter.migration_class, 'refs_only_adapter');
  const defaultCallerContract = byId.product_entry_continuity_refs_adapter.default_caller_contract;
  assert.equal(defaultCallerContract.surface_kind, 'generated_session_shell_boundary');
  assert.equal(defaultCallerContract.generated_session_shell_owner, 'one-person-lab');
  assert.equal(defaultCallerContract.generated_session_command, 'opl_generated:product_session');
  assert.equal(defaultCallerContract.rca_role, 'entry_session_domain_snapshot_refs_only_adapter');
  assert.equal(defaultCallerContract.default_caller_status, 'generic_session_sources_retired_opl_envelope_required');
  assert.equal(defaultCallerContract.rca_owns_generic_session_shell, false);
  assert.equal(defaultCallerContract.generic_session_source_retirement, 'completed');
  assert.equal(
    defaultCallerContract.required_absent_source_refs_policy,
    'contracts/physical_source_morphology_policy.json#/behavioral_source_scan_policy/typescript_ast_owner_boundary/required_absent_source_refs',
  );
  assert.equal(byId.workspace_source_intake.opl_generic_primitive, 'workspace_source_intake_shell');
  assert.equal(byId.workspace_source_intake.activeCallerStatus, 'opl_workspace_source_shell_domain_handler_refs');
  assert.equal(byId.workspace_source_intake.migration_class, 'refs_only_adapter');
  assert.equal(byId.workspace_source_intake.rca_exports_only.includes('source_readiness_verdict_ref'), true);
  assert.equal(byId.memory_writeback_receipt_transport.rca_scope, 'visual_memory_accept_reject_and_receipt_refs');
  assert.equal(byId.artifact_export_lifecycle.status, 'opl_artifact_lifecycle_shell_consumed_refs_only');
  assert.equal(
    byId.artifact_export_lifecycle.activeCallerStatus,
    'refs_only_artifact_authority_adapter_consuming_opl_lifecycle_shell',
  );
  assert.equal(byId.artifact_export_lifecycle.rca_scope, 'visual_artifact_export_authority_and_locator_refs');
  assert.equal(byId.review_repair_transport.rca_scope, 'visual_review_export_verdict_and_repair_decision');
  assert.equal(byId.operator_projection_shell.activeCallerStatus, 'opl_app_workbench_shell_domain_evidence_refs');
  assert.equal(byId.generic_cli_mcp_wrappers.rca_scope, 'domain_handler_status_action_metadata_projection');
  assert.equal(byId.generic_cli_mcp_wrappers.activeCallerStatus, 'opl_generated_wrappers_domain_handler_targets');
  assert.equal(byId.generic_cli_mcp_wrappers.migration_class, 'domain_handler_target');
  assert.equal(byId.codex_executor_adapter.opl_generic_primitive, 'agent_executor_adapter');
  assert.equal(byId.codex_executor_adapter.migration_class, 'refs_only_adapter');
  assert.equal(byId.observability_stability_read_model.rca_owned_visual_domain_authority, false);
  assert.equal(
    byId.observability_stability_read_model.opl_replacement_expectation.replacement_surface,
    'opl_stability_read_model_and_observability_export',
  );
  const allowedActiveReaderFacingClassifications = new Set([
    'domain_handler_target',
    'refs_only_adapter',
    'minimal_authority_function',
    'native_helper_implementation',
    'provenance',
    'declarative_pack',
  ]);
  for (const entry of Object.values(byId)) {
    assert.equal(
      allowedActiveReaderFacingClassifications.has(entry.active_reader_facing_classification || entry.migration_class),
      true,
      entry.module_id,
    );
  }
  const expectedGeneratedTargets = [
    'cli_wrapper',
    'mcp_wrapper',
    'skill_wrapper',
    'product_entry_wrapper',
    'domain_handler_wrapper',
    'status_projection_wrapper',
    'session_wrapper',
    'workbench_wrapper',
    'functional_harness_wrapper',
  ];
  const expectedDescriptorScope = [
    'cli',
    'mcp',
    'skill',
    'product_entry',
    'product_status',
    'product_session',
    'domain_handler',
    'workbench',
  ];
  for (const handoff of [
    adoption.visual_pack_compiler_handoff.generated_surface_handoff,
  ]) {
    assert.deepEqual(handoff.generated_surface_targets, expectedGeneratedTargets);
    assert.deepEqual(handoff.generated_descriptor_scope, expectedDescriptorScope);
    assert.equal(handoff.bridge_exit_gate.declares_generated_surface_descriptor_consumed, true);
    assert.equal(handoff.bridge_exit_gate.declares_generated_surface_consumption_complete, false);
    assert.equal(handoff.bridge_exit_gate.declares_production_consumption_complete, false);
    assert.equal(
      handoff.bridge_exit_gate.production_consumption_scope,
      'descriptor_and_contract_consumed_not_production_default_caller_live_soak',
    );
    assert.equal(handoff.bridge_exit_gate.declares_visual_stage_long_soak_complete, false);
    assert.deepEqual(handoff.bridge_exit_gate.false_ready_guard, {
      descriptor_consumption_can_claim_generated_surface_completion: false,
      descriptor_consumption_can_claim_production_consumption: false,
      descriptor_consumption_can_claim_default_caller_cutover: false,
      descriptor_consumption_can_claim_app_operator_consumption: false,
      descriptor_consumption_can_claim_visual_stage_long_soak: false,
      descriptor_consumption_can_claim_domain_ready: false,
      descriptor_consumption_can_claim_artifact_ready: false,
    });
    assert.equal(handoff.repo_local_launcher_policy.cli_mcp_skill_product_status_workbench_metadata_owner, 'one-person-lab');
    assert.equal(handoff.repo_local_launcher_policy.product_entry_continuity_refs_adapter_is_generic_session_owner, false);
    assert.equal(handoff.wrappers.skill.owner, 'opl');
    assert.equal(handoff.wrappers.skill.long_term_rca_owner, false);
  }
});
