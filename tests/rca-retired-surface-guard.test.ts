// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { existsSync, readFileSync, readdirSync } from 'node:fs';

const ACTIVE_ROOTS = [
  'apps',
  'packages',
  'contracts',
  'plugins',
  'scripts',
  'tests',
  'tools',
  'python',
];
const TEXT_EXTENSIONS = new Set([
  '.json',
  '.ts',
  '.tsx',
  '.js',
  '.mjs',
  '.cjs',
  '.py',
  '.sh',
  '.yaml',
  '.yml',
]);
const RETIRED_CONTRACTS = Object.freeze([
  'contracts/runtime-program/hermes-runtime-substrate-activation-package.json',
  'contracts/runtime-program/hermes-runtime-capability-extraction-map.json',
  'contracts/runtime-program/hermes-runtime-substrate-canonical-closure.json',
  'contracts/runtime-program/hermes-stable-family-closure-truth.json',
  'contracts/runtime-program/hermes-managed-family-closure-truth.json',
]);
const RETIRED_ACTIVE_PATTERNS = Object.freeze([
  /\bgateway_interaction_contract\b/,
  /\bfrontdoor_owner\b/,
  /\bfrontdoor_surface\b/,
  /\bfrontdoor_command\b/,
  /\bfrontdoor_node_id\b/,
  /\bfrontdoor_title\b/,
  /\bfrontdoor_surface_kind\b/,
  /\bGatewayInteractionContractSurface\b/,
  /\bFamilyFrontdoorEntrySurfaces\b/,
  /\bbuildFamilyGatewayInteractionContract\b/,
  /\bbuildFamilyProductFrontdoorFromManifest\b/,
  /\bbuildFamilyFrontdoorProductEntryOrchestration\b/,
  /@redcube\/hermes-substrate/,
  /\bhost_agent\b/,
  /\bhermes_native_proof\b/,
  /\bredcube product frontdesk\b/,
  /\bproduct_frontdesk\b/,
  /\bfrontdesk\b/,
  /\binvokeFederatedProductEntry\b/,
  /\bFederatedProductEntry\b/,
  /\bfederated_product_entry\b/,
  /\bfederated_/,
  /\bsource_pack_federation\b/,
  /\bsourcePackFederation\b/,
  /\bsource-pack-federation\b/,
  /\bcross_family_source_pack_federation\b/,
  /\bOPL federation\b/,
  /\bOPL product-entry federation\b/,
  /\bproduct federate\b/,
  /\bopl_gateway\b/,
  /\bopl_bridge\b/,
  /opl-gateway-shared/,
  /\blegacy_command_key\b/,
  /\bcompat_product_entry_overview_command\b/,
  /\bsource_workbench\b/,
  /\bsource_workbench_[A-Za-z0-9_]*\b/,
  /packages\/redcube-runtime\/scripts\/ppt_deck_review\.py/,
  /packages\/redcube-runtime\/scripts\/ppt_deck_export\.py/,
  /packages\/redcube-runtime\/scripts\/ppt_deck_native\.py/,
  /python\/redcube_ai\/hermes\/agent_loop_bridge\.py/,
  /\bcompatibility_script\b/,
  /\bcompatibilityScript\b/,
]);

function listTextFiles(root) {
  return readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(root, entry.name);
    const normalized = file.split(path.sep).join('/');
    if (entry.isDirectory()) {
      if (entry.name === 'dist' || entry.name === 'build' || entry.name === 'node_modules') return [];
      return listTextFiles(file);
    }
    return entry.isFile() && TEXT_EXTENSIONS.has(path.extname(entry.name)) ? [file] : [];
  });
}

test('RCA active source surfaces do not reintroduce retired runtime terms', () => {
  for (const contractFile of RETIRED_CONTRACTS) {
    assert.equal(existsSync(path.resolve(contractFile)), false, contractFile);
  }
  assert.equal(existsSync(path.resolve('packages/redcube-hermes-substrate')), false);

  const violations = [];
  for (const file of ACTIVE_ROOTS.flatMap((root) => {
    if (!existsSync(path.resolve(root))) return [];
    return path.extname(root) ? [root] : listTextFiles(root);
  })) {
    if (
      file === 'tests/rca-retired-surface-guard.test.ts'
      || file === 'tests/python-native-helper-catalog.test.ts'
    ) continue;
    const text = readFileSync(file, 'utf-8');
    for (const pattern of RETIRED_ACTIVE_PATTERNS) {
      if (pattern.test(text)) {
        violations.push(`${file}: ${pattern}`);
      }
    }
  }

  assert.deepEqual(violations, []);
});

test('RCA consumes OPL family scheduler replacement without owning generic scheduling surfaces', () => {
  const currentProgram = JSON.parse(readFileSync(
    path.resolve('contracts/runtime-program/current-program.json'),
    'utf-8',
  ));
  const adoption = JSON.parse(readFileSync(
    path.resolve('contracts/runtime-program/opl-family-contract-adoption.json'),
    'utf-8',
  ));

  for (const surface of [
    currentProgram.product_release_metadata.opl_family_scheduler_replacement,
    currentProgram.current_state.opl_family_scheduler_replacement,
    adoption.family_scheduler_replacement,
  ]) {
    assert.equal(surface.contract_ref, 'opl.family_scheduler_replacement.v1');
    assert.equal(surface.owner, 'opl');
    assert.equal(surface.consumer, 'redcube_ai');
    assert.equal(surface.projection_mode, 'consumer_projection_only');
    assert.equal(surface.rca_generic_scheduler_owner, false);
    assert.equal(surface.rca_generic_daemon_owner, false);
    assert.equal(surface.rca_generic_lifecycle_owner, false);
    assert.equal(surface.rca_generic_queue_owner, false);
    assert.equal(surface.rca_generic_attempt_ledger_owner, false);
    assert.equal(surface.rca_generic_runner_owner, false);
    assert.equal(surface.rca_generic_workbench_owner, false);
    assert.equal(surface.rca_thin_surface_role, 'visual_domain_authority_pack_plus_thin_program_surface');
    assert.equal(surface.projection_scope, 'consumer_projection_and_visual_domain_authority_refs_only');
    assert.deepEqual(surface.opl_owned_generic_surfaces, [
      'family_scheduler',
      'daemon',
      'generic_lifecycle',
      'typed_queue',
      'attempt_ledger',
      'generic_runner',
      'workbench_shell',
    ]);
    assert.equal(surface.visual_stage_descriptor_scope, 'opl_stage_execution_plan_route_handler_refs_only');
    assert.deepEqual(surface.rca_retained_authority, [
      'visual_truth',
      'review_export_verdict',
      'artifact_authority',
      'visual_memory_body',
      'owner_receipt',
      'native_helper_implementation',
      'typed_blocker',
      'safe_action_refs',
    ]);
  }
});

test('RCA consumes OPL generic primitives as projections while retaining only visual authority', () => {
  const currentProgram = JSON.parse(readFileSync(
    path.resolve('contracts/runtime-program/current-program.json'),
    'utf-8',
  ));
  const adoption = JSON.parse(readFileSync(
    path.resolve('contracts/runtime-program/opl-family-contract-adoption.json'),
    'utf-8',
  ));

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
    currentProgram.product_release_metadata.opl_generic_primitive_consumption,
    currentProgram.current_state.opl_generic_primitive_consumption,
    currentProgram.current_state.active_baton.scope.opl_generic_primitive_consumption,
    adoption.opl_generic_primitive_consumption,
  ]) {
    assert.equal(surface.owner, 'opl');
    assert.equal(surface.consumer, 'redcube_ai');
    assert.equal(surface.status, 'functional_consumer_follow_through_landed');
    assert.equal(surface.projection_mode, 'consumer_projection_only');
    assert.equal(surface.rca_surface_role, 'visual_domain_authority_pack_plus_thin_program_surface');
    assert.equal(surface.completion_scope, 'functional_consumer_follow_through_complete_not_live_soak');
    assert.equal(surface.live_soak_claimed, false);
    assert.deepEqual(surface.rca_does_not_own, expectedGenericPrimitives);
    assert.deepEqual(surface.rca_retained_authority, expectedRetainedAuthority);
    assert.equal(surface.functional_harness_consumer_coverage.coverage_status, 'domain_authority_pack_landed');
    assert.equal(surface.functional_harness_consumer_coverage.opl_harness_pass_is_visual_ready, false);
    assert.equal(surface.functional_harness_consumer_coverage.opl_harness_pass_is_exportable, false);
    assert.equal(surface.functional_harness_consumer_coverage.opl_harness_pass_is_handoffable, false);
    assert.equal(surface.functional_harness_consumer_coverage.opl_harness_pass_is_artifact_producing_owner_receipt, false);
    assert.equal(surface.functional_harness_consumer_coverage.rca_generic_runtime_owner, false);
  }

  assert.deepEqual(
    adoption.opl_generic_primitive_consumption.consumed_projection_surfaces.map((surface) => surface.primitive),
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
  for (const value of Object.values(adoption.opl_generic_primitive_consumption.forbidden_rca_generic_owner_flags)) {
    assert.equal(value, false);
  }
});

test('RCA consumes OPL stability read-model surfaces without implementing observability runtime', () => {
  const currentProgram = JSON.parse(readFileSync(
    path.resolve('contracts/runtime-program/current-program.json'),
    'utf-8',
  ));
  const adoption = JSON.parse(readFileSync(
    path.resolve('contracts/runtime-program/opl-family-contract-adoption.json'),
    'utf-8',
  ));

  const expectedReadModelSurfaces = [
    'family_conflict_envelope',
    'control_loop_summary',
    'usage_projection',
    'resource_pressure',
    'observability_export',
    'external_stability_policy',
  ];

  for (const surface of [
    currentProgram.product_release_metadata.opl_stability_read_model_consumption,
    currentProgram.current_state.opl_stability_read_model_consumption,
    currentProgram.current_state.active_baton.scope.opl_stability_read_model_consumption,
    adoption.opl_stability_read_model_consumption,
  ]) {
    assert.equal(surface.owner, 'opl');
    assert.equal(surface.consumer, 'redcube_ai');
    assert.equal(surface.status, 'refs_only_consumer_projection_landed');
    assert.equal(surface.projection_mode, 'consumer_projection_only');
    assert.equal(surface.observability_only, true);
    assert.equal(surface.rca_surface_role, 'visual_domain_authority_pack_plus_thin_program_surface');
    assert.equal(surface.completion_scope, 'stability_read_model_refs_projected_not_live_soak');
    assert.equal(surface.live_soak_claimed, false);
  }

  assert.deepEqual(
    adoption.opl_stability_read_model_consumption.consumed_read_model_surfaces.map((surface) => surface.surface),
    expectedReadModelSurfaces,
  );
  for (const value of Object.values(adoption.opl_stability_read_model_consumption.authority_boundary)) {
    assert.equal(value, false);
  }
  for (const value of Object.values(adoption.opl_stability_read_model_consumption.forbidden_rca_stability_owner_flags)) {
    assert.equal(value, false);
  }
  assert.equal(
    adoption.opl_stability_read_model_consumption.rca_does_not_own.includes('runtime_observability_exporter'),
    true,
  );
  assert.equal(
    adoption.opl_stability_read_model_consumption.rca_does_not_own.includes('generic_runtime_adapter_success_semantics'),
    true,
  );
});

test('RCA functional audit exposes OPL replacement expectations and retired generic sidecar dispatch', () => {
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
    product_entry_session_store: 'opl_app_session_shell_and_workbench',
    artifact_export_lifecycle: 'opl_artifact_lifecycle_gallery_handoff_shell',
    review_repair_transport: 'opl_review_repair_transport',
    native_helper_envelope: 'opl_native_helper_execution_envelope',
    operator_projection_shell: 'opl_app_operator_workbench_shell',
    generic_cli_mcp_wrappers: 'opl_standard_domain_agent_generated_cli_mcp_wrappers',
    codex_executor_adapter: 'opl_agent_executor_adapter',
    observability_stability_read_model: 'opl_stability_read_model_and_observability_export',
  };

  for (const surface of surfaces) {
    assert.equal(surface.replacement_expectation_mode, 'opl_replacement_expectation_or_refs_only_projection');
    assert.equal(surface.physical_deletion_guard.current_safe_tombstone_candidate_count, 0);
    assert.deepEqual(surface.physical_deletion_guard.deleted_or_thinned_default_surfaces, [
      'product_sidecar_dispatch.supervise_managed_run',
      'product_sidecar_dispatch.product_entry_continuation',
      'public_cli_mcp_gateway.get_managed_run',
      'public_cli_mcp_gateway.supervise_managed_run',
      'repo_local_visual_runtime.legacy_deliverable_runner_deleted',
      'repo_local_visual_runtime.legacy_run_store_deleted',
      'repo_local_visual_runtime.legacy_dag_runtime_deleted',
    ]);
    assert.deepEqual(
      surface.retire_tombstone_candidates.map((entry) => entry.surface_id),
      [
        'product_sidecar_dispatch.supervise_managed_run',
        'product_sidecar_dispatch.product_entry_continuation',
      ],
    );
    assert.deepEqual(surface.classification_values, [
      'opl_hosted_surface',
      'opl_generated_surface',
      'refs_only_adapter',
      'declarative_pack',
      'minimal_authority_function',
      'retire_tombstone',
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
  assert.deepEqual(policy.legacy_name_policy.managed_runtime_gateway_session_sidecar_terms_allowed_only_as, [
    'tombstone_or_provenance',
    'contract_safe_semantic_id',
    'negative_test_guard',
    'refs_only_read_model',
    'domain_handler_target',
  ]);
  assert.equal(
    policy.new_surface_admission_gate.forbidden_new_rca_roles.includes('generic_attempt_ledger_owner'),
    true,
  );

  const requiredClassifications = {
    mcp_product_entry_domain_entry: 'service_safe_domain_entry',
    product_entry_session_store: 'refs_only_read_model',
    workspace_run_envelope_helpers: 'refs_only_read_model',
    runtime_watch_projection: 'refs_only_read_model',
    product_sidecar_guarded_actions: 'domain_handler_target',
    operator_evidence_stability_projection: 'refs_only_read_model',
    visual_authority_functions: 'minimal_visual_authority_function',
    legacy_managed_runtime_names: 'tombstone_or_provenance',
  };

  for (const [surfaceId, classification] of Object.entries(requiredClassifications)) {
    assert.equal(byId[surfaceId].classification, classification, surfaceId);
    for (const value of Object.values(byId[surfaceId].forbidden_generic_owner_flags)) {
      assert.equal(value, false, surfaceId);
    }
  }

  assert.equal(
    byId.product_entry_session_store.current_rca_role,
    'entry_session_domain_snapshot_refs_only_adapter',
  );
  assert.equal(
    byId.runtime_watch_projection.current_rca_role,
    'runtimeWatch_existing_run_locator_projection',
  );
  assert.equal(
    byId.product_sidecar_guarded_actions.current_rca_role,
    'guarded_domain_action_target_and_refs_only_sidecar_adapter',
  );
  assert.equal(
    byId.operator_evidence_stability_projection.current_rca_role,
    'operator_evidence_and_stability_refs_only_read_model',
  );
  assert.equal(
    byId.legacy_managed_runtime_names.current_rca_role,
    'contract_safe_semantic_id_or_tombstone_provenance_only',
  );
});
