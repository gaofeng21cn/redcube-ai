import fs from 'node:fs';
import path from 'node:path';

import {
  SERIAL_ENV_TEST,
  assert,
  exportDomainActionAdapter,
  getProductEntryManifest,
  prepareProductEntryWorkspace,
  test,
  withMockCodexRuntimeState,
} from '../product-domain-action-case-shared.ts';

const repoRoot = path.resolve(import.meta.dirname, '../..');

function readRepoJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(repoRoot, relativePath), 'utf8'));
}

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
    assert.equal(gatesById.stage_descriptor_handoff.rca_surface_ref, 'opl-generated:family_stage_control_plane');
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
    const repoConsumptionPolicy = readRepoJson('contracts/temporal_stage_run_consumption_policy.json');
    assert.equal(consumptionPolicy.surface_kind, 'temporal_stage_run_consumption_policy');
    assert.equal(consumptionPolicy.policy_id, 'rca.temporal_stage_run_consumption_policy.v1');
    assert.equal(repoConsumptionPolicy.surface_kind, consumptionPolicy.surface_kind);
    assert.equal(repoConsumptionPolicy.policy_id, consumptionPolicy.policy_id);
    assert.equal(repoConsumptionPolicy.temporal_runtime_owner, consumptionPolicy.temporal_runtime_owner);
    assert.equal(repoConsumptionPolicy.temporal_attempt_ledger_owner, consumptionPolicy.temporal_attempt_ledger_owner);
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
    assert.deepEqual(repoConsumptionPolicy.domain_completion_closeout_refs, consumptionPolicy.domain_completion_closeout_refs);
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
      assert.equal(
        repoConsumptionPolicy.forbidden_domain_completion_sources.includes(forbiddenSource),
        true,
        `repo.${forbiddenSource}`,
      );
    }
    assert.equal(repoConsumptionPolicy.forbidden_domain_completion_sources.includes('mock_safe_canary'), true);
    assert.equal(repoConsumptionPolicy.forbidden_domain_completion_sources.includes('controlled_canary'), true);
    assert.equal(consumptionPolicy.forbidden_domain_writes.includes('opl_stage_attempt'), true);
    assert.equal(consumptionPolicy.forbidden_domain_writes.includes('opl_provider_attempt_ledger'), true);
    assert.equal(repoConsumptionPolicy.forbidden_domain_writes.includes('owner_receipt_body'), true);
    assert.equal(repoConsumptionPolicy.forbidden_domain_writes.includes('typed_blocker_body'), true);
    assert.equal(repoConsumptionPolicy.owner_chain_completion_audit.completion_status, 'blocked_requires_real_visual_stage_owner_acceptance');
    assert.equal(repoConsumptionPolicy.owner_chain_completion_audit.requires_real_visual_stage_owner_acceptance, true);
    assert.equal(repoConsumptionPolicy.owner_chain_completion_audit.requires_review_export_acceptance_for_export_claim, true);
    assert.equal(repoConsumptionPolicy.owner_chain_completion_audit.provider_completion_counts_as_completion, false);
    assert.equal(repoConsumptionPolicy.owner_chain_completion_audit.generated_surface_readiness_counts_as_completion, false);
    assert.equal(repoConsumptionPolicy.owner_chain_completion_audit.mock_safe_canary_counts_as_completion, false);
    assert.equal(repoConsumptionPolicy.owner_chain_completion_audit.declares_owner_chain_complete, false);
    assert.equal(repoConsumptionPolicy.owner_chain_completion_audit.declares_visual_ready, false);
    assert.equal(repoConsumptionPolicy.owner_chain_completion_audit.declares_exportable, false);
    assert.equal(repoConsumptionPolicy.owner_chain_completion_audit.declares_domain_ready, false);
    assert.equal(repoConsumptionPolicy.owner_chain_completion_audit.declares_production_ready, false);
    assert.equal(repoConsumptionPolicy.owner_chain_completion_audit.declares_production_visual_stage_long_soak_complete, false);

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

test('fresh Temporal probe closeout preserves the blocked RCA visual-stage authority boundary', () => {
  const policy = readRepoJson('contracts/temporal_stage_run_consumption_policy.json');
  const closeout = readRepoJson(policy.source_refs.latest_temporal_long_soak_probe_closeout_ref);

  assert.equal(closeout.state, 'blocked_live_gate');
  assert.equal(closeout.runtime_probe.provider_kind, 'temporal');
  assert.equal(closeout.runtime_probe.persisted_proof.closeout_status, 'production_residency_failed');
  assert.equal(closeout.runtime_probe.opl_proof_check_summary.proven_check_count, 6);
  assert.equal(closeout.runtime_probe.opl_proof_check_summary.required_check_count, 9);
  assert.deepEqual(closeout.runtime_probe.opl_proof_check_summary.failed_check_ids, [
    'worker_completed_attempt',
    'typed_closeout_required_for_completed',
    'retry_or_dead_letter_boundary_observed',
  ]);
  assert.equal(closeout.runtime_probe.actual_worker_restart_readback.pid_changed, true);
  assert.equal(closeout.runtime_probe.actual_worker_restart_readback.worker_ready_after_restart, true);
  assert.equal(
    closeout.runtime_probe.actual_worker_restart_readback.completed_workflow_history_readable_after_restart,
    true,
  );
  assert.equal(closeout.typed_blockers.length, 2);
  assert.equal(closeout.claim_boundary.provider_transport_probe_complete, true);
  assert.equal(closeout.claim_boundary.opl_production_residency_proven, false);
  assert.equal(closeout.claim_boundary.real_rca_visual_stage_executed, false);
  assert.equal(closeout.claim_boundary.artifact_producing_owner_receipt_present, false);
  assert.equal(closeout.claim_boundary.retry_dead_letter_boundary_proven_for_same_run, false);
  assert.equal(closeout.claim_boundary.production_visual_stage_long_soak_complete, false);
  assert.equal(closeout.claim_boundary.visual_ready, false);
  assert.equal(closeout.claim_boundary.domain_ready, false);
  assert.equal(closeout.claim_boundary.production_ready, false);
  assert.equal(closeout.repository_boundary.runtime_proof_remains_external, true);
});
