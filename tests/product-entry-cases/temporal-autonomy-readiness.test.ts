// @ts-nocheck
import {
  SERIAL_ENV_TEST,
  assert,
  exportDomainActionAdapter,
  getProductEntryManifest,
  prepareProductEntryWorkspace,
  test,
  withMockCodexRuntimeState,
} from '../product-domain-action-case-shared.ts';

test('RCA exposes Temporal autonomy as the default OPL-hosted runtime contract with RCA evidence gates', SERIAL_ENV_TEST, async () => {
  await withMockCodexRuntimeState(async () => {
    const workspaceRoot = await prepareProductEntryWorkspace();
    const manifest = await getProductEntryManifest({ workspace_root: workspaceRoot });
    const readiness = manifest.temporal_autonomy_readiness;

    assert.equal(readiness.surface_kind, 'temporal_autonomy_readiness');
    assert.equal(readiness.target_domain_id, 'redcube_ai');
    assert.equal(readiness.provider_owner, 'one-person-lab');
    assert.equal(readiness.temporal_runtime_owner, 'one-person-lab/OPL');
    assert.equal(readiness.temporal_attempt_ledger_owner, 'one-person-lab/OPL');
    assert.equal(readiness.provider_kind_required_for_production, 'temporal');
    assert.equal(readiness.status, 'standard_default_opl_temporal_hosted_autonomy_enabled_evidence_pending');
    assert.equal(readiness.can_be_opl_temporal_hosted, true);
    assert.equal(readiness.default_opl_temporal_hosted_autonomy_enabled, true);
    assert.equal(readiness.task_start_handoff_is_persistent_opl_temporal_scheduling, true);
    assert.equal(readiness.codex_app_outer_loop_required_after_task_start, false);
    assert.equal(readiness.long_time_autonomy_claimed, true);
    assert.equal(readiness.production_visual_stage_long_soak_complete, false);
    assert.equal(readiness.rca_owns_generic_scheduler_or_daemon, false);
    assert.equal(readiness.rca_owns_generic_attempt_loop, false);
    assert.equal(readiness.rca_owns_generic_attempt_ledger, false);
    assert.equal(readiness.domain_repo_can_own_temporal_runtime, false);
    assert.equal(readiness.rca_writes_opl_stage_attempts, false);
    assert.equal(readiness.default_executor, 'codex_cli');

    assert.deepEqual(
      readiness.required_success_evidence.map((entry) => entry.evidence_id),
      [
        'temporal_provider_production_residency',
        'provider_hosted_visual_stage_attempt',
        'worker_restart_requery_resume',
        'retry_dead_letter_repair_projection',
        'artifact_producing_owner_receipt',
        'cross_family_no_regression',
      ],
    );

    const gatesById = Object.fromEntries(readiness.capability_gates.map((gate) => [gate.gate_id, gate]));
    assert.equal(gatesById.provider_online_management.owner, 'one-person-lab');
    assert.equal(gatesById.provider_online_management.status, 'default_enabled');
    assert.equal(gatesById.stage_descriptor_handoff.status, 'ready');
    assert.equal(gatesById.stage_descriptor_handoff.rca_surface_ref, '/family_stage_control_plane');
    assert.equal(gatesById.queue_wakeup_handoff.status, 'ready');
    assert.deepEqual(gatesById.queue_wakeup_handoff.required_domain_action_adapter_actions, [
      'emit_no_regression_evidence',
      'emit_temporal_controlled_visual_stage_long_soak_evidence',
      'emit_domain_owner_receipt',
      'emit_workspace_receipt_proof',
    ]);
    assert.equal(
      gatesById.queue_wakeup_handoff.available_domain_action_adapter_actions.includes(
        'emit_temporal_controlled_visual_stage_long_soak_evidence',
      ),
      true,
    );
    assert.equal(gatesById.progress_requery.status, 'ready');
    assert.equal(gatesById.progress_requery.owner, 'one-person-lab');
    assert.equal(gatesById.progress_requery.projection_target, 'opl_status_workbench_runtime_read_model');
    assert.equal(gatesById.progress_requery.domain_action_adapter_dispatch_action_required, false);
    assert.equal(gatesById.restart_resume_recovery.status, 'contract_ready_live_evidence_pending');
    assert.equal(gatesById.retry_dead_letter_repair.status, 'contract_ready_live_evidence_pending');
    assert.equal(gatesById.domain_closeout_receipts.status, 'ready');

    assert.deepEqual(readiness.typed_blockers, [
      {
        blocker_ref: 'rca-typed-blocker:controlled-soak:temporal-long-soak-pending',
        blocker_kind: 'controlled_visual_soak_runtime_evidence_pending',
        remaining_gap_id: 'opl_hosted_controlled_visual_stage_long_soak',
        owner: 'redcube_ai',
      },
    ]);
    assert.equal(readiness.authority_boundary.opl_can_write_rca_visual_truth, false);
    assert.equal(readiness.authority_boundary.opl_can_authorize_review_export_verdict, false);
    assert.equal(readiness.authority_boundary.rca_owns_generic_daemon_scheduler_attempt_loop, false);
    assert.equal(readiness.authority_boundary.provider_completion_is_visual_ready, false);
    assert.equal(readiness.authority_boundary.provider_completion_is_domain_completion, false);
    assert.equal(readiness.authority_boundary.provider_completion_is_production_soak_complete, false);
    assert.equal(readiness.authority_boundary.generated_surface_ready_can_claim_domain_ready, false);
    assert.equal(readiness.authority_boundary.domain_repo_can_own_temporal_runtime, false);
    assert.equal(readiness.authority_boundary.rca_writes_opl_stage_attempts, false);

    const consumptionPolicy = manifest.temporal_stage_run_consumption_policy;
    assert.equal(consumptionPolicy.surface_kind, 'temporal_stage_run_consumption_policy');
    assert.equal(consumptionPolicy.policy_id, 'rca.temporal_stage_run_consumption_policy.v1');
    assert.equal(consumptionPolicy.temporal_runtime_owner, 'one-person-lab/OPL');
    assert.equal(consumptionPolicy.temporal_attempt_ledger_owner, 'one-person-lab/OPL');
    assert.equal(consumptionPolicy.provider_completion_is_domain_completion, false);
    assert.equal(consumptionPolicy.generated_surface_ready_can_claim_domain_ready, false);
    assert.equal(consumptionPolicy.domain_repo_can_own_temporal_runtime, false);
    assert.equal(consumptionPolicy.domain_repo_can_write_opl_stage_attempts, false);
    assert.equal(consumptionPolicy.rca_writes_opl_stage_attempts, false);
    assert.equal(consumptionPolicy.rca_owns_provider_attempt_ledger, false);
    assert.deepEqual(consumptionPolicy.domain_completion_closeout_refs, [
      'owner_receipt_ref',
      'typed_blocker_ref',
      'human_gate_ref',
      'route_back_ref',
      'review_export_receipt_ref',
      'artifact_authority_receipt_ref',
      'no_regression_evidence_ref',
    ]);
    for (const forbiddenSource of [
      'provider_completion',
      'generated_surface_ready',
      'stage_run_terminal_state',
      'queue_empty',
      'attempt_ledger_written',
    ]) {
      assert.equal(
        consumptionPolicy.forbidden_domain_completion_sources.includes(forbiddenSource),
        true,
        forbiddenSource,
      );
    }
    assert.equal(consumptionPolicy.forbidden_domain_writes.includes('opl_stage_attempt'), true);
    assert.equal(consumptionPolicy.forbidden_domain_writes.includes('opl_provider_attempt_ledger'), true);

    const domain_action_adapter = await exportDomainActionAdapter({ workspace_root: workspaceRoot });
    assert.equal(
      domain_action_adapter.mapped_surfaces.temporal_autonomy_readiness.ref,
      '/temporal_autonomy_readiness',
    );
    assert.equal(
      domain_action_adapter.mapped_surfaces.temporal_autonomy_readiness.status,
      'standard_default_opl_temporal_hosted_autonomy_enabled_evidence_pending',
    );
    assert.equal(domain_action_adapter.mapped_surfaces.temporal_autonomy_readiness.provider_owner, 'one-person-lab');
    assert.equal(domain_action_adapter.mapped_surfaces.temporal_autonomy_readiness.can_be_opl_temporal_hosted, true);
    assert.equal(domain_action_adapter.mapped_surfaces.temporal_autonomy_readiness.default_opl_temporal_hosted_autonomy_enabled, true);
    assert.equal(domain_action_adapter.mapped_surfaces.temporal_autonomy_readiness.task_start_handoff_is_persistent_opl_temporal_scheduling, true);
    assert.equal(domain_action_adapter.mapped_surfaces.temporal_autonomy_readiness.codex_app_outer_loop_required_after_task_start, false);
    assert.equal(domain_action_adapter.mapped_surfaces.temporal_autonomy_readiness.long_time_autonomy_claimed, true);
    assert.equal(domain_action_adapter.mapped_surfaces.temporal_autonomy_readiness.production_visual_stage_long_soak_complete, false);
    assert.equal(
      domain_action_adapter.runtime_framework.rca_thin_surface_policy.temporal_stage_run_consumption_policy.provider_completion_is_domain_completion,
      false,
    );
    assert.equal(
      domain_action_adapter.runtime_framework.rca_thin_surface_policy.temporal_stage_run_consumption_policy.domain_repo_can_own_temporal_runtime,
      false,
    );
    assert.equal(
      domain_action_adapter.runtime_framework.rca_thin_surface_policy.temporal_stage_run_consumption_policy.rca_writes_opl_stage_attempts,
      false,
    );
    assert.equal(
      domain_action_adapter.mapped_surfaces.temporal_stage_run_consumption_policy.ref,
      '/temporal_stage_run_consumption_policy',
    );
    assert.equal(
      domain_action_adapter.mapped_surfaces.temporal_stage_run_consumption_policy.provider_completion_is_domain_completion,
      false,
    );
    assert.equal(
      domain_action_adapter.mapped_surfaces.temporal_stage_run_consumption_policy.generated_surface_ready_can_claim_domain_ready,
      false,
    );
    assert.equal(
      domain_action_adapter.mapped_surfaces.temporal_stage_run_consumption_policy.domain_repo_can_write_opl_stage_attempts,
      false,
    );
    assert.deepEqual(
      domain_action_adapter.mapped_surfaces.temporal_stage_run_consumption_policy.domain_completion_closeout_refs.slice(0, 4),
      ['owner_receipt_ref', 'typed_blocker_ref', 'human_gate_ref', 'route_back_ref'],
    );
    assert.equal(
      domain_action_adapter.source_manifest_refs.temporal_autonomy_readiness_ref,
      '/temporal_autonomy_readiness',
    );
  });
});
