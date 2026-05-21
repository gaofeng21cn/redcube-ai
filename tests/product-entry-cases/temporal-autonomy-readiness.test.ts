// @ts-nocheck
import {
  SERIAL_ENV_TEST,
  assert,
  exportProductSidecar,
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
    assert.deepEqual(gatesById.queue_wakeup_handoff.required_sidecar_actions, [
      'emit_no_regression_evidence',
      'emit_domain_owner_receipt',
      'emit_workspace_receipt_proof',
    ]);
    assert.equal(gatesById.progress_requery.status, 'ready');
    assert.equal(gatesById.progress_requery.owner, 'one-person-lab');
    assert.equal(gatesById.progress_requery.projection_target, 'opl_status_workbench_runtime_read_model');
    assert.equal(gatesById.progress_requery.sidecar_dispatch_action_required, false);
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
    assert.equal(readiness.authority_boundary.provider_completion_is_production_soak_complete, false);

    const sidecar = await exportProductSidecar({ workspace_root: workspaceRoot });
    assert.equal(
      sidecar.mapped_surfaces.temporal_autonomy_readiness.ref,
      '/temporal_autonomy_readiness',
    );
    assert.equal(
      sidecar.mapped_surfaces.temporal_autonomy_readiness.status,
      'standard_default_opl_temporal_hosted_autonomy_enabled_evidence_pending',
    );
    assert.equal(sidecar.mapped_surfaces.temporal_autonomy_readiness.provider_owner, 'one-person-lab');
    assert.equal(sidecar.mapped_surfaces.temporal_autonomy_readiness.can_be_opl_temporal_hosted, true);
    assert.equal(sidecar.mapped_surfaces.temporal_autonomy_readiness.default_opl_temporal_hosted_autonomy_enabled, true);
    assert.equal(sidecar.mapped_surfaces.temporal_autonomy_readiness.task_start_handoff_is_persistent_opl_temporal_scheduling, true);
    assert.equal(sidecar.mapped_surfaces.temporal_autonomy_readiness.codex_app_outer_loop_required_after_task_start, false);
    assert.equal(sidecar.mapped_surfaces.temporal_autonomy_readiness.long_time_autonomy_claimed, true);
    assert.equal(sidecar.mapped_surfaces.temporal_autonomy_readiness.production_visual_stage_long_soak_complete, false);
    assert.equal(
      sidecar.source_manifest_refs.temporal_autonomy_readiness_ref,
      '/temporal_autonomy_readiness',
    );
  });
});
