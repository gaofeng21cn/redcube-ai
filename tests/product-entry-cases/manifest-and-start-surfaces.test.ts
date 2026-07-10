// @ts-nocheck
import {
  PRODUCT_ENTRY_COMPANIONS_SPECIFIER,
  SERIAL_ENV_TEST,
  assert,
  getProductEntryManifest,
  getDomainActionAdapterGuardedActionMetadata,
  importDomainEntrySharedModule,
  prepareProductEntryWorkspace,
  readJson,
  test,
  withMockCodexRuntimeState,
} from '../product-domain-action-case-shared.ts';
import { assertManifestRuntimeLoopAndLifecycle } from './manifest-runtime-loop-and-lifecycle-assertions.ts';
import { assertManifestActionAndStageControlPlane } from './manifest-stage-control-plane-assertions.ts';
import {
  assertAllFalse,
  assertEvery,
  assertIds,
  assertPathIncludes,
  assertPathMatches,
  assertPathValues,
  list,
} from './surface-fixture-assertions.ts';

test('getProductEntryManifest projects the current direct-entry shell and shared OPL handoff truth', SERIAL_ENV_TEST, async () => {
  await withMockCodexRuntimeState(async ({ runtimeStateRoot }) => {
    const sharedCompanions = await importDomainEntrySharedModule(PRODUCT_ENTRY_COMPANIONS_SPECIFIER);
    const workspaceRoot = await prepareProductEntryWorkspace();
    const manifest = await getProductEntryManifest({ workspace_root: workspaceRoot });
    const domain_action_adapterGuardedActionMetadata = await getDomainActionAdapterGuardedActionMetadata();

    assertPathValues(manifest, {
      ok: true,
      surface_kind: 'product_entry_manifest',
      manifest_version: 2,
      manifest_kind: 'redcube_product_entry_manifest',
      target_domain_id: 'redcube_ai',
      'formal_entry.default': 'CLI',
      'formal_entry.supported_protocols': ['MCP'],
      'formal_entry.internal_surface': 'domain_entry_protocol_boundary',
      'formal_entry.internal_surface_role': 'service_safe_domain_entry_and_protocol_adapter',
      'formal_entry.compatibility_alias_allowed': false,
      'workspace_locator.workspace_surface_kind': 'redcube_workspace',
      'workspace_locator.workspace_root': workspaceRoot,
      recommended_shell: 'direct',
      recommended_command: 'redcube product invoke',
      'entry_status_surface.command': 'opl_generated:product_status',
      'operator_loop_surface.command': 'redcube product invoke',
      'operator_loop_surface.continuation_command': 'opl_generated:product_session',
      'product_entry_quickstart.recommended_step_id': 'continue_current_loop',
      'product_entry_overview.product_entry_command': 'redcube product invoke',
      'product_entry_start.recommended_mode_id': 'direct',
      'product_entry_preflight.ready_to_try_now': true,
      'repo_mainline.program_id': 'redcube-runtime-program',
      'repo_mainline.phase_id': 'repo_verified_product_entry_and_opl_hosted_handoff',
      'repo_mainline.active_baton_provenance_id': 'product_entry_session_continuity',
      'current_truth.session_continuity_provenance_contract_ref': 'contracts/runtime-program/product-entry-session-continuity.json',
      'operator_evidence_readiness_projection.production_acceptance.status': 'closed_by_domain_owned_acceptance_receipt',
      'operator_evidence_readiness_projection.declares_artifact_producing_owner_receipt': true,
      'operator_evidence_readiness_projection.declares_artifact_producing_owner_receipt_scope': 'refs_only_receipt_chain_closed_not_visual_ready',
      'operator_evidence_readiness_projection.production_evidence_scaleout_refs.surface_kind': 'rca_visual_production_evidence_scaleout_refs',
      'operator_evidence_readiness_projection.production_evidence_tail_workorder.surface_kind': 'rca_production_evidence_tail_workorder',
      'operator_evidence_readiness_projection.production_evidence_tail_workorder.workorder_id': 'rca.production_evidence_tail_workorder.v1',
      'operator_evidence_readiness_projection.temporal_controlled_visual_stage_long_soak_evidence_inventory.evidence_count': 0,
      'product_entry_readiness.verdict': 'service_surface_ready_not_end_user_shell',
      'product_entry_readiness.usable_now': true,
      'product_entry_readiness.good_to_use_now': false,
      'product_entry_readiness.recommended_start_command': 'redcube product invoke',
      'runtime.runtime_owner': 'configured_family_runtime_provider',
      'runtime.runtime_state_root': runtimeStateRoot,
      'runtime_inventory.workspace_binding.workspace_root': workspaceRoot,
      'runtime_inventory.workspace_binding.runtime_state_root': runtimeStateRoot,
      'task_lifecycle.status': 'resumable',
      'task_lifecycle.checkpoint_summary.status': 'operator_review_required',
      'persistence_policy.policy_id': 'redcube_product_entry_persistence_policy',
      'owner_route.next_owner': 'redcube_ai',
      'artifact_locator_contract.locator_model': 'opl_stage_folder_contract_refs_only',
      'domain_memory_descriptor_locator.descriptor_id': 'rca.visual_pattern_memory.descriptor.v1',
      'domain_owner_receipt_contract.contract_id': 'rca.domain_owner_receipt.v1',
      'lifecycle_guarded_apply_proof.proof_id': 'rca.lifecycle_guarded_apply_proof.v1',
      'visual_transition_spec.spec_id': 'rca.visual_transition_spec.v1',
      'visual_transition_evaluator.evaluator_id': 'rca.visual_transition_evaluator.v1',
      'controlled_visual_stage_attempt.fixture_id': 'rca.controlled_visual_stage_attempt.fixture.v1',
      'controlled_memory_apply_proof.proof_id': 'rca.visual_pattern_memory.controlled_apply_proof.v1',
      'controlled_soak_no_regression_attempt.attempt_id': 'rca.controlled_soak.no_regression_attempt.v1',
      'domain_action_adapter_receipt_refs.receipt_contract_id': 'rca.domain_action_adapter.receipt_refs.v1',
      'opl_generic_primitive_consumption.status': 'functional_consumer_follow_through_landed',
      'opl_stability_read_model_consumption.status': 'refs_only_consumer_projection_landed',
      'skill_catalog.surface_kind': 'skill_catalog',
      'skill_catalog.skills.0.skill_id': 'redcube-ai',
      'skill_catalog.skills.0.command': 'redcube product invoke',
      'automation.automations.0.automation_id': 'redcube_autopilot_continuation_board',
      'automation.automations.1.automation_id': 'redcube_operator_review_gate',
      'product_entry_shell.status.command': 'opl_generated:product_status',
      'product_entry_shell.direct.command': 'redcube product invoke',
      'product_entry_shell.domain_handler.command': 'redcube domain-handler export',
      'route_equivalence.surface_kind': 'route_equivalence_contract',
      'deliverable_facade.default_run_mode': undefined,
      'domain_entry_contract.entry_adapter': 'RedCubeDomainEntry',
      'domain_entry_contract.service_safe_surface_kind': 'domain_entry',
      'user_interaction_contract.entry_owner': 'redcube_agent_entry_shell',
      'current_truth.product_entry_contract_ref': 'contracts/runtime-program/redcube-product-entry-mvp.json',
      'native_ppt_operator_ux.route_selection.default_visual_route': 'author_image_pages',
      session_continuity: undefined,
      progress_projection: undefined,
      artifact_inventory: undefined,
      runtime_loop_closure: undefined,
      generated_session_surface_ref: 'opl_generated:product_session',
      'authority_boundary.refs_only': true,
      'authority_boundary.creates_owner_receipt': false,
      'authority_boundary.creates_typed_blocker': false,
    });
    assertPathMatches(manifest, {
      'product_entry_status.summary': /product-entry overview\/intake surface/,
      'product_entry_shell.status.purpose': /product-entry overview/i,
      'product_entry_shell.direct.purpose': /deliverable loop/i,
    });
    assert.deepEqual(manifest.product_entry_surface, manifest.entry_status_surface);
    assert.deepEqual(manifest.formal_entry.retired_internal_surface_ids, ['retired_gateway_protocol_boundary_public_entry']);
    assertEvery(
      manifest.formal_entry.retired_internal_surface_ids,
      (surfaceId) => surfaceId.startsWith('retired_')
        && !manifest.formal_entry.retired_internal_surface_policy.legacy_raw_surface_ids_forbidden.includes(surfaceId),
      'retired surface ids use semantic tombstone ids',
    );
    assertIds(manifest.product_entry_quickstart.steps, 'step_id', list('continue_current_loop inspect_current_progress open_opl_hosted_entry default_image_ppt_proof optional_native_ppt_proof'));
    assertIds(manifest.product_entry_start.modes, 'mode_id', list('direct opl_hosted session'));
    assertIds(manifest.product_entry_preflight.checks, 'check_id', list('workspace_root_resolved workspace_contract_present runtime_state_root_ready product_entry_overview_contract_landed'));
    assertEvery(manifest.product_entry_preflight.checks, (check) => check.status === 'pass', 'preflight checks pass');
    assertAllFalse(manifest, list('operator_evidence_readiness_projection.declares_visual_ready operator_evidence_readiness_projection.declares_exportable operator_evidence_readiness_projection.declares_handoffable operator_evidence_readiness_projection.declares_domain_ready operator_evidence_readiness_projection.production_evidence_scaleout_refs.workspace_receipt_scaleout_refs.workspace_receipt_scaleout_claimed operator_evidence_readiness_projection.production_evidence_scaleout_refs.visual_memory_body_reuse_refs.projected_body_to_opl operator_evidence_readiness_projection.production_evidence_scaleout_refs.naming_tombstone_follow_through_refs.active_caller_compatibility_alias_restored operator_evidence_readiness_projection.production_evidence_scaleout_refs.authority_boundary.opl_can_store_memory_body operator_evidence_readiness_projection.production_evidence_tail_workorder.payload_body_allowed operator_evidence_readiness_projection.production_evidence_tail_workorder.success_boundary.production_soak_complete_claimed operator_evidence_readiness_projection.temporal_controlled_visual_stage_long_soak_evidence_inventory.declares_production_soak_complete operator_evidence_readiness_projection.authority_boundary.opl_app_can_declare_domain_ready product_entry_readiness.fully_automatic artifact_locator_contract.repo_source_boundary.repo_tracks_visual_or_export_artifact_blobs opl_generic_primitive_consumption.live_soak_claimed opl_generic_primitive_consumption.functional_harness_consumer_coverage.opl_harness_pass_is_visual_ready opl_generic_primitive_consumption.functional_harness_consumer_coverage.opl_harness_pass_is_exportable opl_generic_primitive_consumption.functional_harness_consumer_coverage.opl_harness_pass_is_handoffable opl_generic_primitive_consumption.functional_harness_consumer_coverage.opl_harness_pass_is_artifact_producing_owner_receipt opl_stability_read_model_consumption.live_soak_claimed opl_stability_read_model_consumption.authority_boundary.opl_can_write_rca_domain_truth opl_stability_read_model_consumption.authority_boundary.opl_can_authorize_visual_ready opl_stability_read_model_consumption.authority_boundary.generic_fallback_can_mark_success skill_catalog.skills.0.domain_projection.skill_activation.shell_commands.status.repo_local_command_available skill_catalog.skills.0.domain_projection.skill_activation.shell_commands.session.repo_local_command_available'));
    assert.equal(
      manifest.operator_evidence_readiness_projection.remaining_gap_classification.remaining_evidence_gate_ids.includes(
        'real_artifact_producing_domain_owner_receipt',
      ),
      false,
    );
    assert.deepEqual(
      manifest.operator_evidence_readiness_projection.production_evidence_scaleout_refs.selected_artifact_producing_visual_route.stage_sequence_refs,
      ['author_image_pages', 'visual_director_review', 'screenshot_review', 'export_pptx'],
    );
    assertIds(manifest.operator_evidence_readiness_projection.production_evidence_tail_workorder.work_items, 'item_id', list('owner_chain_apply memory_lifecycle_receipt_scaleout temporal_controlled_visual_stage_long_soak cross_family_repeated_no_regression'));
    assert.deepEqual(manifest.product_entry_readiness.blocking_gaps, [
      'mature_end_user_shell_is_not_an_rca_owned_surface',
      'production_evidence_tail_remains_open',
    ]);
    assert.deepEqual(manifest.opl_provider_runtime_contract.fail_closed_rules, list('domain_supervision_cannot_bypass_runtime executor_cannot_declare_global_gate_clear runtime_cannot_invent_domain_publishability_truth'));
    assert.equal(manifest.standard_domain_agent_skeleton, undefined);
    assert.equal(manifest.physical_skeleton_follow_through, undefined);
    assert.equal(manifest.review_helper_baseline_follow_through, undefined);
    assert.deepEqual(manifest.opl_ledger_artifact_registration, readJson('contracts/opl_ledger_artifact_registration.json'));
    assertPathIncludes(manifest, {
      'artifact_locator_contract.opl_consumption_policy.forbidden': 'declare_visual_export_verdict',
    });
    assert.deepEqual(manifest.action_metadata.product_entry.map((entry) => [entry.action_key, entry.command, entry.surface_kind]), [
      ['start_deliverable', 'redcube product invoke', 'product_entry'],
      ['run_image_ppt_proof', 'redcube image-ppt proof', 'image_ppt_product_entry_proof'],
      ['run_native_ppt_proof', 'redcube native-ppt proof', 'native_ppt_product_entry_proof'],
      ['invoke_domain_entry', 'redcube service-safe domain entry', 'domain_entry'],
    ]);
    assert.deepEqual(manifest.skill_catalog.supported_commands, ['redcube product invoke', 'redcube image-ppt proof', 'redcube native-ppt proof']);
    assert.deepEqual(manifest.route_equivalence.equivalent_routes.map((route) => route.route_id), list('product_status product_invoke session_continuation opl_hosted_stage_runtime'));
    assert.deepEqual(manifest.deliverable_facade.covered_families, ['ppt_deck', 'xiaohongshu']);
    assert.equal(manifest.native_ppt_operator_ux.image_proof_runner.command_template.includes('--workspace-root'), false);

    assertManifestActionAndStageControlPlane({ manifest, domain_action_adapterGuardedActionMetadata });
    assertManifestRuntimeLoopAndLifecycle({ manifest, sharedCompanions });
  });
});
