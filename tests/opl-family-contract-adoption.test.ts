// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const CONTRACT_PATH = 'contracts/runtime-program/opl-family-contract-adoption.json';
const CURRENT_PROGRAM_PATH = 'contracts/runtime-program/current-program.json';
const DOMAIN_MEMORY_ADOPTION_STATE = 'descriptor_proof_contract_landed_runtime_writeback_pending';

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function contract() {
  return JSON.parse(read(CONTRACT_PATH));
}

function currentProgram() {
  return JSON.parse(read(CURRENT_PROGRAM_PATH));
}

test('RCA declares thin OPL family contract adoption', () => {
  const payload = contract();

  assert.equal(payload.contract_kind, 'rca_opl_family_contract_adoption.v1');
  assert.equal(payload.domain_id, 'redcube-ai');
  assert.equal(payload.opl_role, 'family-level projection consumer only');
});

test('RCA runtime projection maps to visual deliverable runtime surfaces', () => {
  const payload = contract();
  const attempt = payload.attempt_projection;

  for (const surface of ['product-entry session', 'runtimeWatch', 'artifact inventory', 'runtime health']) {
    assert.ok(attempt.source_surfaces.includes(surface));
  }
  assert.equal(attempt.maps_to_opl_contract, 'opl_family_runtime_attempt_contract.v1');
  assert.match(attempt.owner_boundary, /RCA owns visual deliverable runtime/);
});

test('RCA quality projection keeps visual proof owner and excludes other domain gates', () => {
  const payload = contract();
  const quality = payload.quality_projection;

  for (const surface of [
    'content-fit review',
    'visual_director_review',
    'screenshot_review',
    'render proof',
    'export proof',
    'getReviewState',
    'getPublicationProjection',
  ]) {
    assert.ok(quality.source_surfaces.includes(surface));
  }
  assert.equal(quality.maps_to_opl_contract, 'opl_family_domain_quality_projection_contract.v1');
  assert.equal(quality.claim_only_ready_forbidden, true);
});

test('RCA operator and incident projection require source refs and RCA closure', () => {
  const payload = contract();
  const incident = payload.incident_projection;
  const operator = payload.operator_projection;

  assert.equal(incident.maps_to_opl_contract, 'opl_family_incident_learning_loop.v1');
  assert.match(incident.closure_rule, /RCA-owned closure ref/);
  for (const field of ['source_refs', 'freshness', 'owner_split', 'next_surface_ref', 'human_gate_reason']) {
    assert.ok(operator.required_fields.includes(field));
  }
  for (const nonGoal of [
    'OPL owns RedCube visual truth',
    'OPL owns canonical artifacts',
    'OPL owns review/export judgment',
    'medical publication gate',
    'grant fundability gate',
  ]) {
    assert.ok(payload.non_goals.includes(nonGoal));
  }
});

test('RCA exposes a thick OPL family lifecycle adapter while keeping SQLite deferred', () => {
  const payload = contract();
  const adapter = payload.lifecycle_adapter_surface;

  assert.equal(adapter.surface_kind, 'opl_family_lifecycle_adapter');
  assert.equal(adapter.adapter_id, 'rca.opl.family.lifecycle.adapter.v1');
  assert.equal(adapter.sqlite_status, 'deferred_for_rca');
  assert.equal(adapter.authority_model, 'file_authority_plus_rebuildable_artifact_indexes');
  for (const surface of [
    'session-continuity run envelopes',
    'product-entry sessions',
    'review state',
    'publication projection',
  ]) {
    assert.ok(adapter.source_surfaces.includes(surface));
  }
  assert.deepEqual(adapter.adoption_state_values, [
    'discoverable_manifest_projection',
    'hydrated_session_projection',
  ]);
  assert.ok(adapter.exposed_on.includes('oplHosted product entry response'));
});

test('RCA stage control projection maps route stages without owning runtime control', () => {
  const payload = contract();
  const projection = payload.stage_control_projection;

  assert.equal(projection.surface_kind, 'opl_family_stage_control_projection');
  assert.equal(projection.projection_id, 'rca.opl.family.stage-control.projection.v1');
  assert.equal(projection.adapter_model, 'descriptor_and_stage_execution_plan_provider');
  assert.equal(projection.maps_to_opl_contract, 'opl_family_stage_control_plane.v1');
  assert.deepEqual(projection.covered_families, [
    'ppt_deck',
    'xiaohongshu',
    'poster_onepager',
  ]);
  assert.deepEqual(projection.family_stage_kinds, [
    'source_intake',
    'communication_strategy',
    'visual_direction',
    'artifact_creation',
    'review_and_revision',
    'package_and_handoff',
  ]);
  assert.deepEqual(projection.route_stage_projection.ppt_deck.artifact_creation, [
    'author_image_pages',
    'render_html',
    'author_pptx_native',
  ]);
  assert.deepEqual(projection.route_stage_projection.xiaohongshu.package_and_handoff, [
    'publish_copy',
    'export_bundle',
  ]);
  assert.deepEqual(projection.route_stage_projection.poster_onepager.communication_strategy, [
    'poster_blueprint',
  ]);
  assert.deepEqual(projection.authority_boundary, {
    rca_owns_visual_truth: true,
    rca_owns_review_publication_projection: true,
    rca_owns_artifact_authority: true,
    opl_role: 'read_only_stage_projection_consumer',
    default_ppt_route_changed: false,
    repo_local_stage_runner_retired: true,
    repo_local_stage_runner_role: 'tombstone_or_historical_regression_only',
  });
});

test('RCA standard domain-agent skeleton keeps repo source and runtime artifacts separate', () => {
  const payload = contract();
  const skeleton = payload.standard_domain_agent_skeleton;

  assert.equal(skeleton.surface_kind, 'standard_domain_agent_skeleton');
  assert.equal(skeleton.skeleton_id, 'rca.standard_domain_agent_skeleton.v1');
  assert.equal(skeleton.mapping_model, 'physical_skeleton_repo_source_layout_with_manifest_projection');
  assert.deepEqual(skeleton.repo_source_boundary.allowed_roots, [
    'agent',
    'contracts',
    'runtime',
    'docs',
  ]);
  assert.equal(skeleton.repo_source_boundary.repo_tracks_runtime_artifact_blobs, false);
  assert.equal(skeleton.repo_source_boundary.repo_tracks_receipt_instances, false);
  assert.equal(skeleton.repo_source_boundary.audit_surface.status, 'pass');
  assert.deepEqual(skeleton.repo_source_boundary.audit_surface.expected_roots, [
    'agent',
    'contracts',
    'runtime',
    'docs',
  ]);
  assert.deepEqual(skeleton.repo_source_boundary.audit_surface.missing_roots, []);
  for (const root of skeleton.repo_source_boundary.allowed_roots) {
    assert.equal(fs.existsSync(path.join(repoRoot, root)), true);
  }
  assert.ok(skeleton.repo_source_boundary.audit_surface.forbidden_repo_writes.includes('canonical_artifact_blob'));
  assert.deepEqual(skeleton.runtime_declarations.declares_only, [
    'product_sidecar_adapter',
    'projection_builder',
    'lifecycle_adapter',
    'visual_transition_spec',
    'visual_transition_evaluator',
    'domain_memory_descriptor_locator',
    'domain_owner_receipt_contract',
    'lifecycle_guarded_apply_proof',
    'workspace_receipt_inventory_projection',
  ]);
  assert.equal(skeleton.runtime_declarations.sidecar_adapter_ref, '/product_entry_shell/sidecar');
  assert.equal(skeleton.runtime_declarations.projection_builder_ref, '/family_stage_control_plane');
  assert.equal(skeleton.runtime_declarations.lifecycle_adapter_ref, '/opl_family_lifecycle_adapter');
  assert.equal(skeleton.runtime_declarations.visual_transition_spec_ref, '/visual_transition_spec');
  assert.equal(skeleton.runtime_declarations.visual_transition_evaluator_ref, '/visual_transition_evaluator');
  assert.equal(skeleton.runtime_declarations.domain_memory_descriptor_locator_ref, '/domain_memory_descriptor_locator');
  assert.equal(skeleton.runtime_declarations.domain_owner_receipt_contract_ref, '/domain_owner_receipt_contract');
  assert.equal(skeleton.runtime_declarations.lifecycle_guarded_apply_proof_ref, '/lifecycle_guarded_apply_proof');
  assert.equal(skeleton.runtime_declarations.workspace_receipt_inventory_projection_ref, '/workspace_receipt_inventory_projection');
});

test('RCA standard OPL primitive consumption is complete as a functional consumer projection', () => {
  const payload = contract();
  const current = currentProgram();
  const expectedGenericPrimitives = [
    'standard_domain_agent_scaffold',
    'functional_harness',
    'generic_runtime',
    'generic_scheduler',
    'daemon',
    'typed_queue',
    'stage_attempt_orchestrator',
    'attempt_ledger',
    'typed_closeout_transport',
    'generic_runner',
    'generic_transition_runner',
    'workbench_shell',
    'memory_transport',
    'memory_refs_only_writeback_chain',
    'artifact_lifecycle',
    'review_repair_transport',
    'restart_dead_letter_repair_human_gate_state_chain',
    'native_helper_generic_envelope',
    'generated_cli_mcp_product_entry_sidecar_status_session_workbench_wrapper',
  ];
  const expectedRetainedAuthority = [
    'visual_truth',
    'review_export_verdict',
    'artifact_authority',
    'visual_memory_body',
    'owner_receipt',
    'native_helper_implementation',
    'typed_blocker',
    'safe_action_refs',
  ];

  for (const surface of [
    payload.opl_generic_primitive_consumption,
    current.product_release_metadata.opl_generic_primitive_consumption,
    current.current_state.opl_generic_primitive_consumption,
    current.current_state.active_baton.scope.opl_generic_primitive_consumption,
  ]) {
    assert.equal(surface.contract_ref, 'opl.standard_domain_agent_scaffold_and_generic_primitives.v1');
    assert.equal(surface.owner, 'opl');
    assert.equal(surface.consumer, 'redcube_ai');
    assert.equal(surface.status, 'functional_consumer_follow_through_landed');
    assert.equal(surface.projection_mode, 'consumer_projection_only');
    assert.equal(surface.rca_surface_role, 'visual_domain_authority_pack_plus_thin_program_surface');
    assert.equal(surface.completion_scope, 'functional_consumer_follow_through_complete_not_live_soak');
    assert.equal(surface.live_soak_claimed, false);
    assert.deepEqual(surface.rca_does_not_own, expectedGenericPrimitives);
    assert.deepEqual(surface.rca_retained_authority, expectedRetainedAuthority);
    assert.equal(surface.functional_harness_consumer_coverage.harness_role, 'functional_harness_consumer');
    assert.equal(surface.functional_harness_consumer_coverage.pass_claim_scope, 'consumer_contract_coverage_only');
    assert.equal(surface.functional_harness_consumer_coverage.opl_harness_pass_is_visual_ready, false);
    assert.equal(surface.functional_harness_consumer_coverage.opl_harness_pass_is_exportable, false);
    assert.equal(surface.functional_harness_consumer_coverage.opl_harness_pass_is_handoffable, false);
    assert.equal(surface.functional_harness_consumer_coverage.opl_harness_pass_is_artifact_producing_owner_receipt, false);
    assert.equal(surface.functional_harness_consumer_coverage.rca_generic_runtime_owner, false);
    assert.deepEqual(surface.functional_harness_consumer_coverage.covered_chains, [
      'memory_refs_only_writeback_chain',
      'queue_stage_attempt_typed_closeout',
      'generic_transition_runner',
      'restart_dead_letter_repair_human_gate_state_chain',
    ]);
    assert.equal(
      surface.functional_harness_consumer_coverage.chain_authority.memory_refs_only_writeback_chain.memory_body_written_by_opl,
      false,
    );
    assert.equal(
      surface.functional_harness_consumer_coverage.chain_authority.queue_stage_attempt_typed_closeout.artifact_produced_by_harness_pass,
      false,
    );
    assert.equal(
      surface.functional_harness_consumer_coverage.chain_authority.generic_transition_runner.visual_ready_declared_by_runner,
      false,
    );
    assert.equal(
      surface.functional_harness_consumer_coverage.chain_authority.restart_dead_letter_repair_human_gate_state_chain.handoffable_declared_by_state_chain,
      false,
    );
  }

  assert.deepEqual(
    payload.opl_generic_primitive_consumption.consumed_projection_surfaces.map((entry) => entry.primitive),
    [
      'standard_domain_agent_scaffold',
      'generic_scheduler',
      'memory_transport',
      'artifact_lifecycle',
      'review_repair_transport',
      'native_helper_generic_envelope',
      'generated_cli_mcp_product_entry_sidecar_status_session_workbench_wrapper',
    ],
  );
  for (const value of Object.values(payload.opl_generic_primitive_consumption.forbidden_rca_generic_owner_flags)) {
    assert.equal(value, false);
  }
});

test('RCA privatized functional module audit is machine readable for OPL with generic sidecar dispatch retired', () => {
  const adoption = contract();
  const current = currentProgram();
  const surfaces = [
    adoption.privatized_functional_module_audit,
    current.product_release_metadata.privatized_functional_module_audit,
    current.current_state.privatized_functional_module_audit,
    current.current_state.active_baton.scope.privatized_functional_module_audit,
  ];
  const expectedModules = [
    'product_entry_session_store',
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
      'opl_hosted_surface',
      'opl_generated_surface',
      'refs_only_adapter',
      'declarative_pack',
      'minimal_authority_function',
      'retire_tombstone',
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
        'opl_hosted_surface',
        'opl_generated_surface',
        'refs_only_adapter',
        'declarative_pack',
        'minimal_authority_function',
      ],
    });
    assert.equal(surface.physical_deletion_guard.current_safe_tombstone_candidate_count, 0);
    assert.deepEqual(surface.physical_deletion_guard.deleted_or_thinned_default_surfaces, [
      'product_sidecar_dispatch.retired_managed_supervision',
      'product_sidecar_dispatch.product_entry_continuation',
      'public_cli_mcp_gateway.get_managed_run',
      'public_cli_mcp_gateway.retired_managed_supervision',
      'repo_local_visual_runtime.legacy_deliverable_runner_deleted',
      'repo_local_visual_runtime.legacy_run_store_deleted',
      'repo_local_visual_runtime.legacy_dag_runtime_deleted',
    ]);
    assert.equal(surface.physical_deletion_guard.deletion_status, 'legacy_runtime_physical_cleanup_closed');
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
    assert.deepEqual(
      surface.retire_tombstone_candidates.map((entry) => entry.surface_id),
      [
        'product_sidecar_dispatch.retired_managed_supervision',
        'product_sidecar_dispatch.product_entry_continuation',
      ],
    );
    assert.equal(surface.authority_boundary.opl_can_index_audit_projection, true);
    assert.equal(surface.authority_boundary.opl_can_write_rca_visual_truth, false);
    assert.equal(surface.authority_boundary.opl_can_claim_production_soak_complete, false);
    assert.equal(surface.authority_boundary.rca_generic_scheduler_owner, false);
    assert.equal(surface.authority_boundary.rca_native_helper_generic_envelope_owner, false);
    assert.equal(surface.authority_boundary.rca_review_repair_transport_owner, false);
    assert.ok(surface.must_not_retire.includes('visual_review_export_gate'));
    assert.ok(surface.must_not_retire.includes('native_helper_implementation'));
    assert.equal(surface.must_not_retire.includes('sidecar_status_action_metadata_projection'), false);

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
        'refs_only_adapter_to_opl_surface',
        'opl_hosted_surface',
        'opl_generated_surface',
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
      for (const value of Object.values(entry.forbidden_generic_owner_flags)) {
        assert.equal(value, false, entry.module_id);
      }
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
  assert.equal(byId.native_helper_envelope.migration_class, 'opl_hosted_surface');
  const closedFunctionalModuleIds = [
    'product_entry_session_store',
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
  assert.equal(byId.product_entry_session_store.status, 'opl_generated_workbench_session_surface_consumed');
  assert.equal(byId.product_entry_session_store.activeCallerStatus, 'opl_generated_session_shell_domain_refs');
  assert.equal(byId.product_entry_session_store.opl_generic_primitive, 'workbench_shell');
  assert.equal(byId.product_entry_session_store.migration_class, 'opl_generated_surface');
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
  assert.equal(byId.generic_cli_mcp_wrappers.rca_scope, 'product_sidecar_status_action_metadata_projection');
  assert.equal(byId.generic_cli_mcp_wrappers.activeCallerStatus, 'opl_generated_wrappers_domain_handler_targets');
  assert.equal(byId.generic_cli_mcp_wrappers.migration_class, 'opl_generated_surface');
  assert.equal(byId.codex_executor_adapter.opl_generic_primitive, 'agent_executor_adapter');
  assert.equal(byId.codex_executor_adapter.migration_class, 'opl_hosted_surface');
  assert.equal(byId.observability_stability_read_model.rca_owned_visual_domain_authority, false);
  assert.equal(
    byId.observability_stability_read_model.opl_replacement_expectation.replacement_surface,
    'opl_stability_read_model_and_observability_export',
  );
  const expectedGeneratedTargets = [
    'cli_wrapper',
    'mcp_wrapper',
    'skill_wrapper',
    'product_entry_wrapper',
    'product_sidecar_wrapper',
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
    'sidecar',
    'workbench',
  ];
  for (const handoff of [
    current.product_release_metadata.visual_pack_compiler_handoff.generated_surface_handoff,
    current.current_state.visual_pack_compiler_handoff.generated_surface_handoff,
    current.current_state.active_baton.scope.visual_pack_compiler_handoff.generated_surface_handoff,
    adoption.visual_pack_compiler_handoff.generated_surface_handoff,
  ]) {
    assert.deepEqual(handoff.generated_surface_targets, expectedGeneratedTargets);
    assert.deepEqual(handoff.generated_descriptor_scope, expectedDescriptorScope);
    assert.equal(handoff.repo_local_launcher_policy.cli_mcp_skill_product_status_workbench_metadata_owner, 'one-person-lab');
    assert.equal(handoff.repo_local_launcher_policy.product_entry_session_store_is_generic_session_owner, false);
    assert.equal(handoff.wrappers.skill.owner, 'opl');
    assert.equal(handoff.wrappers.skill.long_term_rca_owner, false);
  }
});

test('RCA consumes OPL stability read-model surfaces as refs-only projections', () => {
  const payload = contract();
  const current = currentProgram();
  const expectedSurfaces = [
    'family_conflict_envelope',
    'control_loop_summary',
    'usage_projection',
    'resource_pressure',
    'observability_export',
    'external_stability_policy',
  ];
  const expectedRetainedAuthority = [
    'visual_truth',
    'review_export_verdict',
    'artifact_authority',
    'visual_memory_body',
    'owner_receipt',
    'native_helper_implementation',
    'typed_blocker',
    'safe_action_refs',
  ];

  for (const surface of [
    payload.opl_stability_read_model_consumption,
    current.product_release_metadata.opl_stability_read_model_consumption,
    current.current_state.opl_stability_read_model_consumption,
    current.current_state.active_baton.scope.opl_stability_read_model_consumption,
  ]) {
    assert.equal(surface.contract_ref, 'opl.family_operator_stability_read_model.v1');
    assert.equal(surface.owner, 'opl');
    assert.equal(surface.consumer, 'redcube_ai');
    assert.equal(surface.status, 'refs_only_consumer_projection_landed');
    assert.equal(surface.projection_mode, 'consumer_projection_only');
    assert.equal(surface.observability_only, true);
    assert.equal(surface.rca_surface_role, 'visual_domain_authority_pack_plus_thin_program_surface');
    assert.equal(surface.completion_scope, 'stability_read_model_refs_projected_not_live_soak');
    assert.equal(surface.live_soak_claimed, false);
    assert.deepEqual(surface.rca_retained_authority, expectedRetainedAuthority);
  }

  assert.deepEqual(
    payload.opl_stability_read_model_consumption.consumed_read_model_surfaces.map((entry) => entry.surface),
    expectedSurfaces,
  );
  assert.ok(
    payload.opl_stability_read_model_consumption.rca_does_not_own.includes('runtime_observability_exporter'),
  );
  assert.ok(
    payload.opl_stability_read_model_consumption.rca_does_not_own.includes('generic_fallback_completion'),
  );
  assert.deepEqual(payload.opl_stability_read_model_consumption.authority_boundary, {
    opl_can_execute_rca_domain_action: false,
    opl_can_write_rca_domain_truth: false,
    opl_can_authorize_visual_ready: false,
    opl_can_authorize_quality_verdict: false,
    opl_can_authorize_exportable: false,
    opl_can_write_artifact_blob: false,
    opl_can_write_visual_memory_body: false,
    provider_completion_is_visual_ready: false,
    generic_fallback_can_mark_success: false,
    string_retry_can_drive_execution: false,
    event_bus_can_be_truth_source: false,
    runtime_adapter_started_is_behavior_equivalent: false,
  });
  for (const value of Object.values(payload.opl_stability_read_model_consumption.forbidden_rca_stability_owner_flags)) {
    assert.equal(value, false);
  }
});

test('RCA controlled soak remains deferred without descriptor index skeleton regression', () => {
  const payload = contract();
  const controlledSoak = payload.standard_domain_agent_skeleton.controlled_soak;

  assert.equal(controlledSoak.state, 'deferred');
  assert.equal(controlledSoak.required_opl_substrate, 'Temporal production online runtime');
  assert.deepEqual(controlledSoak.owner_runtime_receipt_actions, {
    state: 'runtime_receipt_refs_available',
    domain_owner_receipt_action: 'emit_domain_owner_receipt',
    visual_memory_writeback_action: 'apply_visual_memory_writeback',
    workspace_lifecycle_action: 'apply_visual_workspace_lifecycle',
    workspace_receipt_root: '<workspace-root>/.redcube/runtime/receipts/',
    typed_blocker_on_missing_required_refs: true,
    visual_ready_claimed: false,
    repo_tracks_live_receipt_instances: false,
    opl_consumes_locator_and_receipt_refs_only: true,
  });
  assert.deepEqual(controlledSoak.no_regression_surfaces, [
    'family_action_catalog',
    'stage_control_projection',
    'route_equivalence',
    'standard_domain_agent_skeleton',
    'artifact_locator_contract',
    'product_sidecar_receipt_refs',
    'domain_memory_descriptor',
    'domain_memory_descriptor_locator',
    'controlled_visual_stage_attempt',
    'controlled_memory_apply_proof',
    'workspace_receipt_inventory_projection',
    'domain_owner_receipt_contract',
    'lifecycle_guarded_apply_proof',
    'visual_transition_spec',
    'visual_transition_evaluator',
    'physical_skeleton_follow_through',
    'review_helper_baseline_follow_through',
  ]);
  assert.ok(controlledSoak.forbidden_deferred_claims.includes('provider_hosted_controlled_visual_stage_soak_completed'));
  assert.ok(controlledSoak.forbidden_deferred_claims.includes('real_visual_memory_body_repo_tracked'));
  assert.ok(controlledSoak.forbidden_deferred_claims.includes('accepted_or_rejected_receipt_instance_repo_tracked'));
  assert.ok(controlledSoak.forbidden_deferred_claims.includes('OPL_holds_visual_or_export_verdict'));
});

test('RCA artifact locator and sidecar receipts expose refs without OPL visual verdict ownership', () => {
  const payload = contract();
  const skeleton = payload.standard_domain_agent_skeleton;

  assert.equal(skeleton.artifact_locator_contract.contract_id, 'rca.workspace_runtime_artifact_locator.v1');
  assert.equal(skeleton.artifact_locator_contract.locator_model, 'workspace_runtime_artifact_root_refs_only');
  assert.equal(skeleton.artifact_locator_contract.repo_tracks_visual_or_export_artifact_blobs, false);
  for (const forbidden of [
    'store_png_pptx_pdf_blob',
    'declare_visual_export_verdict',
    'rewrite_canonical_artifact',
    'mutate_review_state',
  ]) {
    assert.ok(skeleton.artifact_locator_contract.opl_forbidden.includes(forbidden));
  }
  assert.equal(skeleton.product_sidecar_receipt_refs.receipt_contract_id, 'rca.product_sidecar.receipt_refs.v1');
  for (const field of ['visual_verdict', 'export_verdict', 'review_verdict', 'publication_gate_verdict', 'artifact_blob']) {
    assert.ok(skeleton.product_sidecar_receipt_refs.forbidden_receipt_fields.includes(field));
  }
  assert.equal(skeleton.controlled_visual_stage_attempt_fixture.fixture_id, 'rca.controlled_visual_stage_attempt.fixture.v1');
  assert.equal(
    skeleton.controlled_visual_stage_attempt_fixture.proof_model,
    'consumed_memory_writeback_receipt_descriptor_sidecar_quality_ref_equivalence_only',
  );
  assert.deepEqual(skeleton.controlled_visual_stage_attempt_fixture.stage_kinds, ['review_and_revision', 'package_and_handoff']);
  assert.deepEqual(skeleton.controlled_visual_stage_attempt_fixture.route_stage_refs, [
    'visual_director_review',
    'screenshot_review',
    'repair_image_pages',
    'export_pptx',
  ]);
  assert.equal(skeleton.controlled_visual_stage_attempt_fixture.opl_consumes_descriptor_refs, true);
  assert.equal(skeleton.controlled_visual_stage_attempt_fixture.opl_consumes_artifact_refs, true);
  assert.equal(skeleton.controlled_visual_stage_attempt_fixture.opl_consumes_quality_refs, true);
  assert.equal(skeleton.controlled_visual_stage_attempt_fixture.direct_and_opl_share_descriptor_refs, true);
  assert.equal(skeleton.controlled_visual_stage_attempt_fixture.direct_and_opl_share_sidecar_refs, true);
  assert.equal(skeleton.controlled_visual_stage_attempt_fixture.direct_and_opl_share_quality_refs, true);
  assert.equal(skeleton.controlled_visual_stage_attempt_fixture.opl_holds_visual_verdict, false);
  assert.equal(skeleton.controlled_visual_stage_attempt_fixture.opl_holds_export_verdict, false);
  assert.equal(skeleton.controlled_visual_stage_attempt_fixture.opl_holds_canonical_artifact_content, false);
  assert.equal(skeleton.controlled_visual_stage_attempt_fixture.opl_writes_visual_truth, false);
  assert.equal(skeleton.controlled_visual_stage_attempt_fixture.opl_writes_review_export_verdict, false);
  assert.equal(skeleton.controlled_visual_stage_attempt_fixture.opl_writes_artifact_blob, false);
});

test('RCA domain memory descriptor exposes locator and receipts without moving visual authority to OPL', () => {
  const payload = contract();
  const descriptor = payload.domain_memory_descriptor;
  const memory = payload.standard_domain_agent_skeleton.domain_memory_descriptor_locator;

  assert.equal(descriptor.surface_kind, 'family_domain_memory_ref');
  assert.equal(descriptor.version, 'family-domain-memory-ref.v1');
  assert.equal(descriptor.memory_ref_id, 'rca_visual_pattern_memory');
  assert.equal(descriptor.target_domain_id, 'redcube_ai');
  assert.equal(descriptor.owner, 'redcube_ai');
  assert.equal(descriptor.memory_family, 'visual_pattern_memory');
  assert.deepEqual(descriptor.memory_pack_ref, {
    ref_kind: 'json_pointer',
    ref: '/domain_memory_descriptor_locator',
    role: 'domain_owned_memory_pack_descriptor',
    label: 'RCA visual pattern memory descriptor locator',
  });
  assert.deepEqual(descriptor.stage_applicability, [
    'source_intake',
    'communication_strategy',
    'visual_direction',
    'artifact_creation',
    'review_and_revision',
    'package_and_handoff',
  ]);
  assert.deepEqual(descriptor.retrieval_contract_ref, {
    ref_kind: 'json_pointer',
    ref: '/domain_memory_descriptor_locator/memory_locator',
    role: 'locator_only_retrieval_contract',
    label: 'RCA visual pattern memory locator',
  });
  assert.deepEqual(descriptor.writeback_contract_ref, {
    ref_kind: 'json_pointer',
    ref: '/domain_memory_descriptor_locator/writeback_proposal_generator',
    role: 'domain_owned_writeback_proposal_contract',
    label: 'RCA visual pattern memory writeback proposal generator',
  });
  assert.deepEqual(descriptor.receipt_contract_ref, {
    ref_kind: 'json_pointer',
    ref: '/domain_memory_descriptor_locator/writeback_receipt_contract',
    role: 'locator_only_writeback_receipt_contract',
    label: 'RCA visual pattern memory writeback receipt refs',
  });
  assert.deepEqual(descriptor.recall_projection_ref, {
    ref_kind: 'json_pointer',
    ref: '/domain_memory_descriptor_locator/operator_receipt_projection',
    role: 'operator_recall_receipt_projection',
    label: 'RCA visual pattern memory operator receipt projection',
  });
  assert.deepEqual(descriptor.migration_plan_ref, {
    ref_kind: 'json_pointer',
    ref: '/domain_memory_descriptor_locator/migration_plan',
    role: 'domain_owned_migration_plan',
    label: 'RCA visual pattern memory migration plan',
  });
  assert.deepEqual(descriptor.seed_corpus_ref, {
    ref_kind: 'json_pointer',
    ref: '/domain_memory_descriptor_locator/seed_fixture_locator',
    role: 'domain_owned_seed_locator',
    label: 'RCA visual pattern memory seed fixture locator',
  });
  assert.deepEqual(descriptor.writeback_receipt_locator_ref, {
    ref_kind: 'json_pointer',
    ref: '/domain_memory_descriptor_locator/writeback_receipt_locator',
    role: 'domain_owned_writeback_receipt_locator',
    label: 'RCA visual pattern memory writeback receipt locator',
  });
  assert.equal(descriptor.freshness.source, 'contract_manifest_projection');
  assert.equal(descriptor.migration_readiness.status, DOMAIN_MEMORY_ADOPTION_STATE);
  assert.equal(descriptor.migration_readiness.migration_state, DOMAIN_MEMORY_ADOPTION_STATE);
  assert.equal(descriptor.migration_readiness.descriptor_proof_contract_state, 'landed');
  assert.equal(descriptor.migration_readiness.runtime_writeback_state, 'pending');
  assert.equal(descriptor.migration_readiness.memory_body_migration, 'domain_owned_runtime_apply_required');
  assert.equal(descriptor.migration_readiness.opl_apply_allowed, false);
  assert.equal(descriptor.status, DOMAIN_MEMORY_ADOPTION_STATE);
  assert.equal(descriptor.authority_boundary.opl_role, 'locator_projection_owner');
  assert.equal(descriptor.authority_boundary.domain_memory_owner, 'redcube_ai');
  assert.ok(descriptor.authority_boundary.forbidden_opl_authority.includes('memory_store_owner'));
  assert.ok(descriptor.authority_boundary.forbidden_opl_authority.includes('visual_route_owner'));
  assert.ok(descriptor.authority_boundary.forbidden_opl_authority.includes('accept_reject_owner'));
  assert.equal(descriptor.authority_boundary.can_write_domain_truth, false);
  assert.equal(descriptor.authority_boundary.can_authorize_quality_verdict, false);
  assert.equal(descriptor.authority_boundary.can_write_artifacts, false);
  assert.equal(descriptor.authority_boundary.can_choose_visual_route, false);
  assert.equal(descriptor.authority_boundary.can_accept_or_reject_memory_writeback, false);
  assert.equal(descriptor.authority_boundary.can_issue_review_or_export_verdict, false);

  assert.equal(memory.descriptor_id, 'rca.visual_pattern_memory.descriptor.v1');
  assert.equal(memory.status, DOMAIN_MEMORY_ADOPTION_STATE);
  assert.equal(memory.locator_id, 'rca.visual_pattern_memory.locator.v1');
  assert.equal(memory.memory_family, 'visual_pattern_memory');
  assert.equal(memory.memory_model, 'natural_language_pattern_cards');
  assert.equal(memory.descriptor_model, 'repo_tracked_descriptor_refs_only');
  assert.equal(memory.locator_model, 'rca_owned_memory_ref_locator');
  assert.equal(memory.policy_ref, 'human_doc:visual_pattern_memory_policy');
  assert.equal(memory.human_doc_ref, 'human_doc:domain_memory_descriptor_locator');
  assert.deepEqual(memory.opl_consumes, [
    'memory locator refs',
    'memory provenance refs',
    'writeback receipt refs',
  ]);
  for (const forbidden of [
    'own_memory_content',
    'choose_visual_route',
    'issue_review_or_export_verdict',
    'mutate_canonical_artifacts',
  ]) {
    assert.ok(memory.opl_forbidden.includes(forbidden));
  }
  assert.deepEqual(memory.authority_boundary, {
    memory_content_owner: 'redcube_ai',
    route_truth_owner: 'redcube_ai',
    review_export_verdict_owner: 'redcube_ai',
    artifact_authority_owner: 'redcube_ai',
    opl_role: 'locator_ref_receipt_consumer_only',
    opl_can_accept_or_reject_memory_writeback: false,
  });
});

test('RCA domain memory migration plan is locator-only and acceptance-gated', () => {
  const payload = contract();
  const memory = payload.standard_domain_agent_skeleton.domain_memory_descriptor_locator;
  const plan = memory.migration_plan;

  assert.equal(plan.plan_id, 'rca.visual_pattern_memory.migration_plan.v1');
  assert.equal(plan.state, DOMAIN_MEMORY_ADOPTION_STATE);
  assert.equal(plan.descriptor_proof_contract_state, 'landed');
  assert.equal(plan.runtime_writeback_state, 'pending');
  assert.deepEqual(plan.source_surfaces, [
    'workspace_runtime_root',
    'product_entry_session',
    'visual_director_review',
    'screenshot_review',
    'export_closeout',
    'human_doc_reference',
  ]);
  assert.deepEqual(plan.migration_steps, [
    'discover_candidate_lessons',
    'extract_reusable_pattern_card_candidate',
    'record_seed_fixture_locator_ref',
    'generate_writeback_proposal_locator',
    'domain_review_accept_or_reject',
    'publish_memory_locator_ref',
    'emit_writeback_receipt_ref',
    'project_operator_receipt_status',
  ]);
  for (const gate of [
    'candidate_excludes_current_deliverable_content',
    'candidate_excludes_review_export_verdict',
    'candidate_excludes_canonical_artifact_blob',
    'proposal_is_locator_only',
    'decision_is_rca_owned_accept_or_reject',
    'writeback_receipt_is_locator_only',
    'operator_receipt_projection_is_locator_only',
  ]) {
    assert.ok(plan.acceptance_gates.includes(gate));
  }
  assert.deepEqual(plan.repository_boundary, {
    repo_tracks_migration_plan: true,
    repo_tracks_seed_locator_contract: true,
    repo_tracks_memory_entries: false,
    repo_tracks_receipt_instances: false,
    repo_tracks_visual_or_export_artifacts: false,
    visual_truth_changed: false,
    route_truth_changed: false,
  });
});

test('RCA visual pattern memory seed and receipt surfaces do not carry memory content or artifacts', () => {
  const payload = contract();
  const memory = payload.standard_domain_agent_skeleton.domain_memory_descriptor_locator;
  const seed = memory.seed_fixture_locator;
  const receipt = memory.writeback_receipt_locator;

  assert.equal(seed.fixture_id, 'rca.visual_pattern_memory.seed_fixture_locator.v1');
  assert.equal(seed.fixture_model, 'locator_only_no_memory_content');
  assert.deepEqual(seed.required_locator_fields, [
    'seed_id',
    'source_review_ref',
    'stage_scope',
    'deliverable_family',
    'reusable_lesson_ref',
    'provenance_refs',
    'migration_status',
  ]);
  for (const forbidden of [
    'memory_content_body',
    'slide_or_page_content',
    'visual_verdict',
    'export_verdict',
    'canonical_artifact_blob',
  ]) {
    assert.ok(seed.forbidden_seed_fields.includes(forbidden));
  }
  assert.equal(receipt.locator_id, 'rca.visual_pattern_memory.writeback_receipt_locator.v1');
  assert.equal(receipt.receipt_contract_id, 'rca.visual_pattern_memory.writeback_receipt_refs.v1');
  assert.equal(receipt.receipt_model, 'locator_only_no_receipt_instance');
  assert.equal(receipt.runtime_writeback_state, 'pending');
  assert.equal(receipt.repo_tracks_receipt_instances, false);
  assert.deepEqual(receipt.locator_fields, [
    'receipt_id',
    'proposal_id',
    'source_review_ref',
    'candidate_memory_ref',
    'writeback_status',
    'memory_locator_ref',
    'operator_receipt_projection_ref',
    'owner',
    'created_at',
  ]);
});

test('RCA visual pattern memory proposal, accept/reject, and operator receipt projection stay locator-only', () => {
  const payload = contract();
  const memory = payload.standard_domain_agent_skeleton.domain_memory_descriptor_locator;
  const proposal = memory.writeback_proposal_generator;
  const decision = memory.accept_reject_command;
  const projection = memory.operator_receipt_projection;

  assert.equal(proposal.generator_id, 'rca.visual_pattern_memory.writeback_proposal_generator.v1');
  assert.equal(proposal.generator_model, 'locator_only_candidate_projection');
  assert.deepEqual(proposal.proposal_contract.required_fields, [
    'proposal_id',
    'seed_fixture_ref',
    'source_review_ref',
    'stage_scope',
    'deliverable_family',
    'candidate_memory_ref',
    'provenance_refs',
    'recommended_decision',
  ]);
  for (const field of ['memory_content_body', 'visual_verdict', 'export_verdict', 'canonical_artifact_blob']) {
    assert.ok(proposal.proposal_contract.forbidden_fields.includes(field));
  }
  assert.equal(proposal.repository_boundary.repo_tracks_proposal_instances, false);

  assert.equal(decision.command_id, 'rca.visual_pattern_memory.accept_reject.v1');
  assert.deepEqual(decision.allowed_decisions, ['accepted', 'rejected']);
  assert.deepEqual(decision.output_refs, [
    'memory_locator_ref',
    'writeback_receipt_ref',
    'operator_receipt_projection_ref',
  ]);
  assert.equal(decision.side_effect_boundary.writes_domain_memory_outside_repo, true);
  assert.equal(decision.side_effect_boundary.writes_repo_memory_entry, false);
  assert.equal(decision.side_effect_boundary.writes_review_export_verdict, false);

  assert.equal(projection.projection_id, 'rca.visual_pattern_memory.operator_receipt_projection.v1');
  assert.deepEqual(projection.visible_fields, [
    'receipt_id',
    'proposal_id',
    'writeback_status',
    'memory_locator_ref',
    'source_review_ref',
    'operator_message_ref',
  ]);
  assert.ok(projection.forbidden_projection_fields.includes('memory_content_body'));
  assert.ok(projection.forbidden_projection_fields.includes('artifact_blob'));
  assert.equal(projection.opl_consumption_policy.opl_can_surface_projection, true);
  assert.equal(projection.opl_consumption_policy.opl_can_store_memory_content, false);
  assert.equal(projection.opl_consumption_policy.opl_can_issue_decision, false);
});

test('current runtime program points OPL Runtime Manager at the RCA lifecycle adapter projection', () => {
  const payload = currentProgram();
  const managerBoundary = payload.longrun_goal.runtime_manager_boundary;
  const persistence = payload.current_state.runtime_persistence_strategy;
  const adapter = payload.current_state.active_baton.scope.opl_family_lifecycle_adapter;
  const stageProjection = payload.current_state.active_baton.scope.opl_family_stage_control_projection;
  const memory = payload.current_state.active_baton.scope.domain_memory_descriptor_locator;
  const applyProof = payload.current_state.active_baton.scope.controlled_memory_apply_proof;
  const skeletonLayout = payload.current_state.active_baton.scope.standard_domain_agent_skeleton_repo_source_layout;
  const residueRetirement = payload.current_state.active_baton.scope.runtime_residue_retirement;

  assert.ok(managerBoundary.consumes_redcube_surfaces.includes('opl_family_lifecycle_adapter'));
  assert.ok(managerBoundary.consumes_redcube_surfaces.includes('opl_family_stage_control_projection'));
  assert.ok(managerBoundary.consumes_redcube_surfaces.includes('domain_memory_descriptor_locator'));
  assert.ok(managerBoundary.does_not_own.includes('domain memory content or verdicts'));
  assert.ok(persistence.canonical_truth_surfaces_remain_files.includes('opl_family_lifecycle_adapter projection'));
  assert.ok(persistence.canonical_truth_surfaces_remain_files.includes('opl_family_stage_control_projection projection'));
  assert.ok(persistence.canonical_truth_surfaces_remain_files.includes('domain_memory_descriptor_locator projection'));
  assert.equal(adapter.status, 'repo_tracked_projection_contract');
  assert.equal(adapter.adapter_id, 'rca.opl.family.lifecycle.adapter.v1');
  assert.equal(adapter.sqlite_status, 'deferred_for_rca');
  assert.deepEqual(adapter.exposes, [
    'family persistence',
    'lifecycle projection',
    'owner-route discovery',
    'adoption surface',
  ]);
  assert.equal(stageProjection.status, 'repo_tracked_projection_contract');
  assert.equal(stageProjection.adapter_model, 'descriptor_and_stage_execution_plan_provider');
  assert.equal(stageProjection.default_ppt_route_changed, false);
  assert.equal(stageProjection.repo_local_stage_runner_retired, true);
  assert.equal(stageProjection.repo_local_stage_runner_role, 'tombstone_or_historical_regression_only');
  const attempt = payload.current_state.active_baton.scope.controlled_visual_stage_attempt;

  assert.equal(memory.status, DOMAIN_MEMORY_ADOPTION_STATE);
  assert.equal(memory.descriptor_id, 'rca.visual_pattern_memory.descriptor.v1');
  assert.equal(memory.locator_id, 'rca.visual_pattern_memory.locator.v1');
  assert.equal(memory.migration_plan_id, 'rca.visual_pattern_memory.migration_plan.v1');
  assert.equal(memory.seed_fixture_locator_id, 'rca.visual_pattern_memory.seed_fixture_locator.v1');
  assert.equal(memory.writeback_receipt_locator_id, 'rca.visual_pattern_memory.writeback_receipt_locator.v1');
  assert.equal(memory.writeback_proposal_generator_id, 'rca.visual_pattern_memory.writeback_proposal_generator.v1');
  assert.equal(memory.accept_reject_command_id, 'rca.visual_pattern_memory.accept_reject.v1');
  assert.equal(memory.operator_receipt_projection_id, 'rca.visual_pattern_memory.operator_receipt_projection.v1');
  assert.equal(
    memory.migration_state,
    DOMAIN_MEMORY_ADOPTION_STATE,
  );
  assert.equal(memory.descriptor_proof_contract_state, 'landed');
  assert.equal(memory.runtime_writeback_state, 'pending');
  assert.equal(memory.controlled_apply_proof_state, 'controlled_apply_proof_landed_memory_body_external');
  assert.equal(memory.controlled_memory_apply_proof_ref, 'redcube product manifest#/controlled_memory_apply_proof');
  assert.equal(memory.memory_content_owner, 'redcube_ai');
  assert.equal(memory.route_truth_owner, 'redcube_ai');
  assert.equal(memory.review_export_verdict_owner, 'redcube_ai');
  assert.equal(memory.artifact_authority_owner, 'redcube_ai');
  assert.equal(memory.opl_role, 'locator_ref_receipt_consumer_only');
  assert.equal(memory.repo_tracks_memory_entries, false);
  assert.equal(memory.repo_tracks_proposal_instances, false);
  assert.equal(memory.repo_tracks_receipt_instances, false);
  assert.equal(memory.repo_tracks_visual_or_export_artifacts, false);
  assert.equal(memory.visual_truth_changed, false);
  assert.equal(memory.route_truth_changed, false);
  assert.equal(memory.operator_receipt_projection_ready, true);
  assert.equal(memory.opl_can_accept_or_reject_memory_writeback, false);
  assert.equal(attempt.status, DOMAIN_MEMORY_ADOPTION_STATE);
  assert.equal(attempt.proof_contract_state, 'landed');
  assert.equal(attempt.runtime_writeback_state, 'pending');
  assert.equal(attempt.apply_proof_state, 'controlled_apply_proof_landed_memory_body_external');
  assert.equal(attempt.controlled_memory_apply_proof_ref, 'redcube product manifest#/controlled_memory_apply_proof');
  assert.deepEqual(attempt.stage_kinds, ['review_and_revision', 'package_and_handoff']);
  assert.equal(attempt.direct_and_opl_share_descriptor_refs, true);
  assert.equal(attempt.direct_and_opl_share_sidecar_refs, true);
  assert.equal(attempt.direct_and_opl_share_quality_refs, true);
  assert.equal(attempt.opl_writes_visual_truth, false);
  assert.equal(attempt.opl_writes_review_export_verdict, false);
  assert.equal(attempt.opl_writes_artifact_blob, false);

  assert.equal(applyProof.status, 'controlled_apply_proof_landed_memory_body_external');
  assert.equal(applyProof.proof_id, 'rca.visual_pattern_memory.controlled_apply_proof.v1');
  assert.equal(applyProof.consumes_visual_pattern_memory_refs, true);
  assert.equal(applyProof.projects_writeback_proposal_ref, true);
  assert.deepEqual(applyProof.projects_accept_reject_receipt_cases, ['accepted', 'rejected']);
  assert.equal(
    applyProof.runtime_receipt_instances_ref,
    'redcube product manifest#/controlled_memory_apply_proof/runtime_receipt_instances',
  );
  assert.deepEqual(applyProof.projects_runtime_receipt_statuses, ['accepted', 'rejected']);
  assert.equal(applyProof.writes_visual_truth, false);
  assert.equal(applyProof.writes_review_verdict, false);
  assert.equal(applyProof.writes_export_verdict, false);
  assert.equal(applyProof.writes_artifact_blob, false);
  assert.equal(applyProof.repo_tracks_memory_content_body, false);
  assert.equal(applyProof.repo_tracks_receipt_instances, false);

  assert.equal(skeletonLayout.status, 'audit_surface_landed');
  assert.equal(skeletonLayout.mapping_model, 'physical_skeleton_repo_source_layout_with_manifest_projection');
  assert.deepEqual(skeletonLayout.expected_roots, ['agent', 'contracts', 'runtime', 'docs']);
  assert.deepEqual(skeletonLayout.missing_roots, []);
  assert.ok(skeletonLayout.forbidden_repo_writes.includes('memory_content_body'));

  const ownerReceipt = payload.current_state.active_baton.scope.domain_owner_receipt_contract;
  assert.equal(ownerReceipt.status, 'contract_landed_runtime_no_regression_evidence_ref_available');
  assert.equal(ownerReceipt.contract_id, 'rca.domain_owner_receipt.v1');
  assert.deepEqual(ownerReceipt.allowed_return_shapes, ['domain_receipt', 'typed_blocker', 'no_regression_evidence']);
  assert.equal(ownerReceipt.opl_can_store_receipt_refs, true);
  assert.equal(ownerReceipt.opl_can_store_visual_truth, false);
  assert.equal(ownerReceipt.opl_can_store_review_export_verdict, false);
  assert.equal(ownerReceipt.opl_can_store_canonical_artifact_blob, false);

  const lifecycleApply = payload.current_state.active_baton.scope.lifecycle_guarded_apply_proof;
  assert.equal(lifecycleApply.status, 'guarded_apply_proof_landed_domain_artifact_mutation_requires_receipt');
  assert.deepEqual(lifecycleApply.operations, ['cleanup', 'restore', 'retention']);
  assert.equal(lifecycleApply.domain_artifact_mutation_requires_domain_receipt, true);
  assert.equal(lifecycleApply.opl_can_apply_domain_artifact_mutation, false);

  const transitionSpec = payload.current_state.active_baton.scope.visual_transition_spec;
  assert.equal(transitionSpec.status, 'contract_landed_thin_evaluator_landed_runner_owned_by_opl');
  assert.equal(transitionSpec.spec_id, 'rca.visual_transition_spec.v1');
  assert.equal(transitionSpec.transition_count, 5);
  assert.equal(transitionSpec.opl_can_execute_transition_spec, true);
  assert.equal(transitionSpec.opl_can_declare_visual_ready, false);
  assert.equal(transitionSpec.opl_can_declare_exportable, false);
  assert.equal(transitionSpec.evaluator_descriptor_id, 'rca.visual_transition_evaluator.v1');
  assert.equal(transitionSpec.evaluator_action, 'evaluate_visual_transition');
  assert.equal(transitionSpec.family_transition_spec_descriptor_ref, '/visual_transition_spec/family_transition_spec_descriptor');
  assert.equal(transitionSpec.repo_tracks_runner_state, false);

  const physicalFollowThrough = payload.current_state.active_baton.scope.physical_skeleton_follow_through;
  assert.equal(physicalFollowThrough.status, 'low_risk_repo_source_follow_through_landed');
  assert.deepEqual(physicalFollowThrough.physical_roots, ['agent', 'contracts', 'runtime', 'docs']);

  const reviewHelper = payload.current_state.active_baton.scope.review_helper_baseline_follow_through;
  assert.equal(reviewHelper.status, 'summary_and_geometry_split_landed_baseline_removed');
  assert.equal(reviewHelper.helper_path, 'python/redcube_ai/native_helpers/ppt_deck/review.py');
  assert.deepEqual(reviewHelper.split_plan_module_boundaries, [
    'screenshot_capture_remaining',
    'geometry_audit_landed',
    'markdown_report_landed',
    'summary_projection_landed',
  ]);
  assert.deepEqual(reviewHelper.landed_modules, [
    'python/redcube_ai/native_helpers/ppt_deck/review_geometry.py',
    'python/redcube_ai/native_helpers/ppt_deck/review_summary.py',
  ]);

  assert.equal(residueRetirement.status, 'active_path_retired');
  assert.deepEqual(residueRetirement.retired_default_surfaces, [
    'hermes_first_default_runtime',
    'gateway_first_public_entry',
    'repo_local_manager_default',
  ]);
  assert.deepEqual(residueRetirement.allowed_remaining_roles, [
    'explicit_proof_backend',
    'provenance',
    'history',
  ]);
});
