// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { readFileSync } from 'node:fs';

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
  const resolveCanonicalProjection = (surface) => {
    if (surface?.projection_mode !== 'canonical_ref_only_no_body_copy') return surface;
    assert.equal(surface.body_copy_in_current_program, false);
    assert.match(surface.canonical_contract_ref, /^contracts\/runtime-program\/opl-family-contract-adoption\.json#/);
    return surface.canonical_json_pointer
      .slice(1)
      .split('/')
      .filter(Boolean)
      .reduce((value, part) => value[part], adoption);
  };

  for (const surface of [
    currentProgram.product_release_metadata.opl_generic_primitive_consumption,
    currentProgram.current_state.opl_generic_primitive_consumption,
    currentProgram.current_state.active_baton.scope.opl_generic_primitive_consumption,
    adoption.opl_generic_primitive_consumption,
  ].map(resolveCanonicalProjection)) {
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
      'generated_cli_mcp_product_entry_domain_handler_descriptor_status_session_workbench_wrapper',
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
  const resolveCanonicalProjection = (surface) => {
    if (surface?.projection_mode !== 'canonical_ref_only_no_body_copy') return surface;
    assert.equal(surface.body_copy_in_current_program, false);
    assert.match(surface.canonical_contract_ref, /^contracts\/runtime-program\/opl-family-contract-adoption\.json#/);
    return surface.canonical_json_pointer
      .slice(1)
      .split('/')
      .filter(Boolean)
      .reduce((value, part) => value[part], adoption);
  };

  for (const surface of [
    currentProgram.product_release_metadata.opl_stability_read_model_consumption,
    currentProgram.current_state.opl_stability_read_model_consumption,
    currentProgram.current_state.active_baton.scope.opl_stability_read_model_consumption,
    adoption.opl_stability_read_model_consumption,
  ].map(resolveCanonicalProjection)) {
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
