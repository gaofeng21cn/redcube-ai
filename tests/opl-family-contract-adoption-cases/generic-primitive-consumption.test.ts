// @ts-nocheck
import { assert, contract, currentProgram, test } from './shared.ts';

function resolveAdoptionProjection(surface, payload) {
  if (surface?.body_copy_in_current_program === false && typeof surface?.canonical_contract_ref === 'string') {
    const match = surface.canonical_contract_ref.match(/^contracts\/runtime-program\/opl-family-contract-adoption\.json#\/(.+)$/);
    if (match) return payload[match[1]];
  }
  return surface;
}

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
    'generated_cli_mcp_product_entry_domain_handler_descriptor_status_session_workbench_wrapper',
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
    resolveAdoptionProjection(current.product_release_metadata.opl_generic_primitive_consumption, payload),
    resolveAdoptionProjection(current.current_state.opl_generic_primitive_consumption, payload),
    resolveAdoptionProjection(current.current_state.active_baton.scope.opl_generic_primitive_consumption, payload),
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
      'generated_cli_mcp_product_entry_domain_handler_descriptor_status_session_workbench_wrapper',
    ],
  );
  for (const value of Object.values(payload.opl_generic_primitive_consumption.forbidden_rca_generic_owner_flags)) {
    assert.equal(value, false);
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
    resolveAdoptionProjection(current.product_release_metadata.opl_stability_read_model_consumption, payload),
    resolveAdoptionProjection(current.current_state.opl_stability_read_model_consumption, payload),
    resolveAdoptionProjection(current.current_state.active_baton.scope.opl_stability_read_model_consumption, payload),
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
