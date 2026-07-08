// @ts-nocheck
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import {
  SERIAL_ENV_TEST,
  assert,
  dispatchDomainActionAdapter,
  exportDomainActionAdapter,
  getProductEntryManifest,
  prepareProductEntryWorkspace,
  readJson,
  test,
  withMockCodexRuntimeState,
} from '../product-domain-action-case-shared.ts';
import { assertAllFalse, assertPathValues, list } from './surface-fixture-assertions.ts';

test('domain-handler emits Temporal controlled visual-stage long-soak evidence refs-only', SERIAL_ENV_TEST, async () => {
  await withMockCodexRuntimeState(async () => {
    const workspaceRoot = await prepareProductEntryWorkspace();
    const result = await dispatchDomainActionAdapter({
      task: {
        action: 'emit_temporal_controlled_visual_stage_long_soak_evidence',
        workspace_root: workspaceRoot,
        soak_id: 'unit-temporal-long-soak',
        temporal_stage_attempt_ref: 'workspace-runtime-ref:temporal-stage-attempt:unit-run',
        retry_dead_letter_ref: 'workspace-runtime-ref:retry-dead-letter:unit-run',
        requery_resume_ref: 'workspace-runtime-ref:requery-resume:unit-run',
        provider_residency_ref: 'opl-provider-residency:temporal:unit-proof',
        stage_execution_ai_task_ref: 'opl-stage-ai-task:execution:unit-run',
        stage_quality_ai_task_ref: 'opl-stage-ai-task:quality:unit-run',
        domain_owner_receipt_ref: 'rca-owner-receipt:visual-stage:unit-run',
        review_export_ref: 'workspace-runtime-ref:review-export:unit-run',
        forbidden_write_proof_ref: '/controlled_memory_apply_proof/forbidden_write_audit',
        no_regression_evidence_refs: ['rca-no-regression:visual-stage:unit-run'],
        monitor_freshness_refs: ['/workspace_receipt_inventory_projection/stage_monitor_freshness/artifact_creation'],
      },
    });
    assertPathValues(result, {
      ok: true,
      action: 'emit_temporal_controlled_visual_stage_long_soak_evidence',
      'result_surface.surface_kind': 'temporal_controlled_visual_stage_long_soak_evidence',
      'result_surface.return_shape': 'controlled_visual_stage_long_soak_evidence',
      'result_surface.evidence_ref': 'rca-long-soak:visual-stage:unit-temporal-long-soak',
      'result_surface.runtime_locator_ref': 'workspace-runtime-ref:temporal-controlled-visual-stage-long-soak:unit-temporal-long-soak',
      'result_surface.coverage.required_refs_present': true,
      'result_surface.coverage.independent_ai_stage_refs_present': true,
      'result_surface.independent_ai_stage_boundary.same_context_self_review_allowed': false,
      'result_surface.coverage.production_visual_stage_long_soak_complete': false,
      'result_surface.coverage.visual_truth_written': false,
      'result_surface.coverage.artifact_body_written': false,
      'result_surface.coverage.memory_content_body_written': false,
      'result_surface.coverage.review_export_verdict_written': false,
      'result_surface.authority_boundary.opl_can_claim_visual_stage_soak_complete': false,
      'result_surface.repository_boundary.repo_tracks_live_long_soak_instances': false,
    });
    assertPathValues(readJson(result.result_surface.evidence_file), {
      evidence_ref: result.result_surface.evidence_ref,
      'required_refs.temporal_stage_attempt_ref': 'workspace-runtime-ref:temporal-stage-attempt:unit-run',
      'optional_refs.no_regression_evidence_refs': ['rca-no-regression:visual-stage:unit-run'],
      'coverage.production_visual_stage_long_soak_complete': false,
    });

    const manifest = await getProductEntryManifest({ workspace_root: workspaceRoot });
    assertPathValues(manifest, {
      'temporal_controlled_visual_stage_long_soak_evidence_inventory.status': 'runtime_long_soak_evidence_refs_visible_not_production_soak',
      'temporal_controlled_visual_stage_long_soak_evidence_inventory.evidence_count': 1,
      'temporal_controlled_visual_stage_long_soak_evidence_inventory.latest_evidence_ref': 'rca-long-soak:visual-stage:unit-temporal-long-soak',
      'temporal_controlled_visual_stage_long_soak_evidence_inventory.coverage.long_soak_evidence_refs_visible': true,
      'temporal_controlled_visual_stage_long_soak_evidence_inventory.coverage.declares_production_soak_complete': undefined,
      'temporal_controlled_visual_stage_long_soak_evidence_inventory.declares_production_soak_complete': false,
      'operator_evidence_readiness_projection.production_evidence_tail_workorder.work_items.2.temporal_readiness_refs.long_soak_evidence_ref_count': 1,
      'operator_evidence_readiness_projection.production_evidence_tail_workorder.work_items.2.temporal_readiness_refs.latest_long_soak_evidence_ref': 'rca-long-soak:visual-stage:unit-temporal-long-soak',
      'operator_evidence_readiness_projection.production_evidence_tail_workorder.work_items.2.temporal_readiness_refs.production_visual_stage_long_soak_complete': false,
    });
    const domain_action_adapter = await exportDomainActionAdapter({ workspace_root: workspaceRoot });
    assertPathValues(domain_action_adapter, {
      'mapped_surfaces.controlled_soak_no_regression_attempt.long_soak_evidence_action': 'emit_temporal_controlled_visual_stage_long_soak_evidence',
      'mapped_surfaces.production_evidence_tail_workorder.work_items.2.temporal_readiness_refs.latest_long_soak_evidence_ref': 'rca-long-soak:visual-stage:unit-temporal-long-soak',
      'mapped_surfaces.production_evidence_tail_workorder.success_boundary.production_soak_complete_claimed': false,
    });
  });
});

test('domain-handler long-soak evidence fails closed for missing refs and body payloads', SERIAL_ENV_TEST, async () => {
  await withMockCodexRuntimeState(async () => {
    const workspaceRoot = await prepareProductEntryWorkspace();
    const missing = await dispatchDomainActionAdapter({
      task: {
        action: 'emit_temporal_controlled_visual_stage_long_soak_evidence',
        workspace_root: workspaceRoot,
        soak_id: 'missing-long-soak-refs',
        temporal_stage_attempt_ref: 'workspace-runtime-ref:temporal-stage-attempt:missing',
      },
    });
    assertPathValues(missing.result_surface, {
      surface_kind: 'typed_blocker',
      blocker_kind: 'temporal_controlled_visual_stage_long_soak_missing_required_refs',
      owner: 'redcube_ai',
      visual_ready_claimed: false,
    });
    assert.equal(
      existsSync(`${workspaceRoot}/.redcube/runtime/evidence/temporal-controlled-visual-stage-long-soak/missing-long-soak-refs.json`),
      false,
    );

    const forbidden = await dispatchDomainActionAdapter({
      task: {
        action: 'emit_temporal_controlled_visual_stage_long_soak_evidence',
        workspace_root: workspaceRoot,
        soak_id: 'forbidden-long-soak-body',
        temporal_stage_attempt_ref: 'workspace-runtime-ref:temporal-stage-attempt:forbidden',
        retry_dead_letter_ref: 'workspace-runtime-ref:retry-dead-letter:forbidden',
        requery_resume_ref: 'workspace-runtime-ref:requery-resume:forbidden',
        provider_residency_ref: 'opl-provider-residency:temporal:forbidden',
        stage_execution_ai_task_ref: 'opl-stage-ai-task:execution:forbidden',
        stage_quality_ai_task_ref: 'opl-stage-ai-task:quality:forbidden',
        domain_owner_receipt_ref: 'rca-owner-receipt:visual-stage:forbidden',
        review_export_ref: 'workspace-runtime-ref:review-export:forbidden',
        forbidden_write_proof_ref: '/controlled_memory_apply_proof/forbidden_write_audit',
        artifact_refs: [{ artifact_ref: 'workspace-runtime-ref:artifact:forbidden', artifact_body: 'forbidden artifact body' }],
        visual_memory_body: 'forbidden memory body',
      },
    });
    assertPathValues(forbidden.result_surface, {
      surface_kind: 'typed_blocker',
      blocker_kind: 'temporal_controlled_visual_stage_long_soak_forbidden_payload_fields',
      forbidden_payload_fields: list('artifact_refs[0].artifact_body visual_memory_body'),
      payload_body_allowed: false,
    });
  });
});

test('domain-handler receipt actions emit refs-only workspace proof without promoting visual readiness', SERIAL_ENV_TEST, async () => {
  await withMockCodexRuntimeState(async () => {
    const workspaceRoot = await prepareProductEntryWorkspace();

    const evidence = await dispatchDomainActionAdapter({
      task: { action: 'emit_no_regression_evidence', workspace_root: workspaceRoot, evidence_id: 'unit-no-regression' },
    });
    assertPathValues(evidence.result_surface, {
      surface_kind: 'no_regression_evidence',
      evidence_ref: 'rca-no-regression:visual-stage:unit-no-regression',
      runtime_locator_ref: 'workspace-runtime-ref:no-regression-evidence:unit-no-regression',
      'coverage.long_visual_soak_claimed': false,
      'coverage.visual_artifact_blob_written': false,
      'coverage.review_export_verdict_written': false,
      'coverage.memory_content_body_written': false,
      'repository_boundary.repo_tracks_runtime_evidence_instance': false,
      'repository_boundary.repo_tracks_visual_or_export_artifacts': false,
      'authority_boundary.opl_can_store_no_regression_evidence_ref': true,
      'authority_boundary.opl_can_store_visual_truth': false,
    });
    assertPathValues(readJson(evidence.result_surface.evidence_file), {
      surface_kind: 'no_regression_evidence',
      evidence_ref: evidence.result_surface.evidence_ref,
      'source_manifest_refs.runtime_residue_retirement_status': 'active_path_retired',
      'source_manifest_refs.skeleton_repo_source_layout_audit_status': 'pass',
      'coverage.verifies_legacy_default_active_path_retired': true,
      'coverage.long_visual_soak_claimed': false,
    });

    const missingReceiptRefs = await dispatchDomainActionAdapter({
      task: { action: 'emit_domain_owner_receipt', workspace_root: workspaceRoot, receipt_id: 'missing-domain-refs' },
    });
    assertPathValues(missingReceiptRefs.result_surface, {
      surface_kind: 'typed_blocker',
      return_shape: 'typed_blocker',
      blocker_kind: 'domain_owner_receipt_missing_required_refs',
      owner: 'redcube_ai',
      visual_ready_claimed: false,
    });
    assert.equal(existsSync(`${workspaceRoot}/.redcube/runtime/receipts/domain-owner/missing-domain-refs.json`), false);

    const forbiddenDomainReceiptPayload = await dispatchDomainActionAdapter({
      task: {
        action: 'emit_domain_owner_receipt',
        workspace_root: workspaceRoot,
        receipt_id: 'forbidden-domain-payload',
        attempt_ref: 'workspace-runtime-ref:attempt:run-forbidden',
        artifact_locator_ref: '/artifact_locator_contract',
        memory_receipt_ref: 'rca-memory-receipt:visual-pattern:accepted-forbidden',
        lifecycle_receipt_ref: 'rca-lifecycle-receipt:retention:forbidden-lifecycle',
        review_export_ref: 'workspace-runtime-ref:review-export:run-forbidden',
        forbidden_write_proof_ref: '/controlled_memory_apply_proof/forbidden_write_audit',
        artifact_refs: [{
          artifact_kind: 'png_page',
          ref_kind: 'workspace_runtime_artifact',
          artifact_ref: 'workspace-runtime-ref:artifact:forbidden-slide',
          artifact_body: 'forbidden body payload must not enter owner receipt',
        }],
        memory_content_body: 'forbidden memory body must not enter owner receipt',
      },
    });
    assertPathValues(forbiddenDomainReceiptPayload.result_surface, {
      surface_kind: 'typed_blocker',
      blocker_kind: 'domain_owner_receipt_forbidden_payload_fields',
      forbidden_payload_fields: list('artifact_refs[0].artifact_body memory_content_body'),
      visual_ready_claimed: false,
      exportable_claimed: false,
      handoffable_claimed: false,
    });
    assert.equal(existsSync(`${workspaceRoot}/.redcube/runtime/receipts/domain-owner/forbidden-domain-payload.json`), false);

    const domainReceipt = await dispatchDomainActionAdapter({
      task: {
        action: 'emit_domain_owner_receipt',
        workspace_root: workspaceRoot,
        receipt_id: 'unit-domain-receipt',
        attempt_ref: 'workspace-runtime-ref:attempt:run-a',
        artifact_locator_ref: '/artifact_locator_contract',
        memory_receipt_ref: 'rca-memory-receipt:visual-pattern:accepted-a',
        lifecycle_receipt_ref: 'rca-lifecycle-receipt:retention:unit-lifecycle',
        review_export_ref: 'workspace-runtime-ref:review-export:run-a',
        forbidden_write_proof_ref: '/controlled_memory_apply_proof/forbidden_write_audit',
        artifact_refs: [{ artifact_kind: 'png_page', ref_kind: 'workspace_runtime_artifact', artifact_ref: 'workspace-runtime-ref:artifact:slide-1', sha256: 'sha256-slide-1' }],
        repair_target_refs: ['workspace-runtime-ref:repair:slide-1'],
        handoff_packet_ref: 'workspace-runtime-ref:handoff:run-a',
        residual_risk_refs: ['workspace-runtime-ref:risk:manual-review'],
      },
    });
    assertPathValues(domainReceipt.result_surface, {
      surface_kind: 'domain_owner_receipt',
      return_shape: 'domain_receipt',
      receipt_ref: 'rca-owner-receipt:visual-stage:unit-domain-receipt',
      runtime_locator_ref: 'workspace-runtime-ref:domain-owner-receipt:unit-domain-receipt',
      'coverage.visual_ready_claimed': false,
      'coverage.opl_completion_promoted_to_visual_ready': false,
      'coverage.exportable_claimed': false,
      'coverage.handoffable_claimed': false,
      'coverage.visual_artifact_blob_written': false,
      'coverage.review_export_verdict_written': false,
      'repository_boundary.repo_tracks_live_receipt_instances': false,
      'authority_boundary.opl_can_store_receipt_ref': true,
      'authority_boundary.opl_can_store_visual_truth': false,
      'authority_boundary.opl_can_mutate_domain_artifacts': false,
    });
    assertPathValues(readJson(domainReceipt.result_surface.receipt_file), {
      surface_kind: 'domain_owner_receipt',
      'required_refs.attempt_ref': 'workspace-runtime-ref:attempt:run-a',
      'artifact_delta.artifact_refs.length': 1,
      'coverage.visual_ready_claimed': false,
    });

    const memoryReceipt = await dispatchDomainActionAdapter({
      task: {
        action: 'apply_visual_memory_writeback',
        workspace_root: workspaceRoot,
        proposal_id: 'proposal-a',
        decision: 'accepted',
        decision_owner: 'redcube_ai',
        source_review_ref: 'workspace-runtime-ref:review:run-a',
        candidate_memory_ref: 'rca-memory:visual-pattern:memory-a',
        memory_locator_ref: 'rca-memory:visual-pattern:memory-a',
        memory_content_body_ref: 'rca-memory-content-ref:visual-pattern:memory-a',
      },
    });
    assertPathValues(memoryReceipt.result_surface, {
      surface_kind: 'visual_pattern_memory_writeback_receipt',
      writeback_status: 'accepted',
      receipt_ref: 'rca-memory-receipt:visual-pattern:proposal-a-accepted',
      memory_content_body: undefined,
      review_verdict: undefined,
    });
    assertPathValues(readJson(memoryReceipt.result_surface.receipt_file), {
      writeback_status: 'accepted',
      memory_content_body: undefined,
      'repository_boundary.repo_tracks_receipt_instance': false,
    });

    const blockedMemory = await dispatchDomainActionAdapter({
      task: {
        action: 'apply_visual_memory_writeback',
        workspace_root: workspaceRoot,
        proposal_id: 'proposal-blocked',
        decision: 'accepted',
        decision_owner: 'opl',
        source_review_ref: 'workspace-runtime-ref:review:run-a',
        candidate_memory_ref: 'rca-memory:visual-pattern:memory-a',
      },
    });
    assertPathValues(blockedMemory.result_surface, {
      surface_kind: 'typed_blocker',
      blocker_kind: 'visual_memory_writeback_owner_required',
    });

    const lifecycleReceipt = await dispatchDomainActionAdapter({
      task: {
        action: 'apply_visual_workspace_lifecycle',
        workspace_root: workspaceRoot,
        operation: 'retention',
        receipt_id: 'unit-lifecycle',
        domain_receipt_ref: 'rca-owner-receipt:visual-stage:unit-domain-receipt',
        artifact_locator_ref: '/artifact_locator_contract',
        artifact_refs: ['workspace-runtime-ref:artifact:slide-1'],
      },
    });
    assertPathValues(lifecycleReceipt.result_surface, {
      surface_kind: 'visual_workspace_lifecycle_receipt',
      operation: 'retention',
      receipt_ref: 'rca-lifecycle-receipt:retention:unit-lifecycle',
      artifact_mutation_applied: false,
      review_export_verdict_written: false,
    });
    assertPathValues(readJson(lifecycleReceipt.result_surface.receipt_file), {
      operation: 'retention',
      artifact_mutation_applied: false,
    });

    const blockedLifecycle = await dispatchDomainActionAdapter({
      task: {
        action: 'apply_visual_workspace_lifecycle',
        workspace_root: workspaceRoot,
        operation: 'cleanup',
        receipt_id: 'blocked-cleanup',
        requested_artifact_mutation: true,
      },
    });
    assertPathValues(blockedLifecycle.result_surface, {
      surface_kind: 'typed_blocker',
      blocker_kind: 'lifecycle_domain_receipt_required',
    });

    const workspaceReceiptProof = await dispatchDomainActionAdapter({
      task: {
        action: 'emit_workspace_receipt_proof',
        workspace_root: workspaceRoot,
        proof_id: 'unit-workspace-receipts',
        attempt_ref: 'workspace-runtime-ref:attempt:run-proof',
        artifact_locator_ref: '/artifact_locator_contract',
        review_export_ref: 'workspace-runtime-ref:review-export:run-proof',
        forbidden_write_proof_ref: '/controlled_memory_apply_proof/forbidden_write_audit',
        artifact_refs: ['workspace-runtime-ref:artifact:slide-proof'],
      },
    });
    assertPathValues(workspaceReceiptProof.result_surface, {
      surface_kind: 'workspace_receipt_proof',
      return_shape: 'workspace_receipt_proof',
      proof_ref: 'rca-workspace-receipt-proof:visual-stage:unit-workspace-receipts',
      'receipt_refs.accepted_memory_receipt_ref': 'rca-memory-receipt:visual-pattern:unit-workspace-receipts-accepted-memory-accepted',
      'receipt_refs.rejected_memory_receipt_ref': 'rca-memory-receipt:visual-pattern:unit-workspace-receipts-rejected-memory-rejected',
      'receipt_refs.cleanup_lifecycle_receipt_ref': 'rca-lifecycle-receipt:cleanup:unit-workspace-receipts-cleanup',
      'receipt_refs.restore_lifecycle_receipt_ref': 'rca-lifecycle-receipt:restore:unit-workspace-receipts-restore',
      'receipt_refs.retention_lifecycle_receipt_ref': 'rca-lifecycle-receipt:retention:unit-workspace-receipts-retention',
      'receipt_refs.no_regression_evidence_ref': 'rca-no-regression:visual-stage:unit-workspace-receipts-no-regression',
      'receipt_refs.domain_owner_receipt_ref': 'rca-owner-receipt:visual-stage:unit-workspace-receipts-domain-owner',
      'coverage.accepted_memory_receipt_written': true,
      'coverage.rejected_memory_receipt_written': true,
      'coverage.cleanup_lifecycle_receipt_written': true,
      'coverage.restore_lifecycle_receipt_written': true,
      'coverage.retention_lifecycle_receipt_written': true,
      'coverage.no_regression_evidence_written': true,
      'coverage.domain_owner_receipt_written': true,
      'live_visual_route_owner_chain_refs.surface_kind': 'rca_live_visual_route_owner_chain_refs',
      'live_visual_route_owner_chain_refs.selected_artifact_producing_visual_route.route_id': 'ppt_deck.image_first.artifact_producing.v1',
      'live_visual_route_owner_chain_refs.payload_body_included': false,
      'live_visual_route_owner_chain_refs.owner_receipt_ref': workspaceReceiptProof.result_surface.receipt_refs.domain_owner_receipt_ref,
      'live_visual_route_owner_chain_refs.workspace_receipt_ref': workspaceReceiptProof.result_surface.proof_ref,
    });
    assertAllFalse(workspaceReceiptProof.result_surface, list('coverage.visual_ready_claimed coverage.exportable_claimed coverage.handoffable_claimed coverage.production_soak_claimed coverage.visual_artifact_blob_written coverage.memory_content_body_written coverage.generic_runtime_state_written repository_boundary.repo_tracks_live_receipt_instances authority_boundary.opl_can_store_visual_truth authority_boundary.opl_can_write_visual_memory_body live_visual_route_owner_chain_refs.readiness_claims.claims_visual_ready live_visual_route_owner_chain_refs.readiness_claims.claims_exportable live_visual_route_owner_chain_refs.readiness_claims.claims_handoffable live_visual_route_owner_chain_refs.readiness_claims.claims_production_visual_soak_complete'));
    assertPathValues(readJson(workspaceReceiptProof.result_surface.proof_file), {
      surface_kind: 'workspace_receipt_proof',
      'coverage.production_soak_claimed': false,
      'live_visual_route_owner_chain_refs.payload_body_included': false,
    });
    assertPathValues({
      accepted: readJson(workspaceReceiptProof.result_surface.runtime_files.accepted_memory_receipt_file),
      rejected: readJson(workspaceReceiptProof.result_surface.runtime_files.rejected_memory_receipt_file),
      cleanup: readJson(workspaceReceiptProof.result_surface.runtime_files.cleanup_lifecycle_receipt_file),
      restore: readJson(workspaceReceiptProof.result_surface.runtime_files.restore_lifecycle_receipt_file),
      retention: readJson(workspaceReceiptProof.result_surface.runtime_files.retention_lifecycle_receipt_file),
      domainOwner: readJson(workspaceReceiptProof.result_surface.runtime_files.domain_owner_receipt_file),
    }, {
      'accepted.writeback_status': 'accepted',
      'rejected.writeback_status': 'rejected',
      'cleanup.operation': 'cleanup',
      'restore.operation': 'restore',
      'retention.operation': 'retention',
      'domainOwner.required_refs.memory_receipt_ref': workspaceReceiptProof.result_surface.receipt_refs.accepted_memory_receipt_ref,
    });

    const manifestWithReceipts = await getProductEntryManifest({ workspace_root: workspaceRoot });
    assertPathValues(manifestWithReceipts.workspace_receipt_inventory_projection, {
      surface_kind: 'workspace_receipt_inventory_projection',
      projection_id: 'rca.workspace_receipt_inventory.v1',
      status: 'workspace_receipt_instances_visible_refs_only',
      read_only: true,
      refs_only: true,
      'receipt_counts.domain_owner': 2,
      'receipt_counts.memory_visual_pattern': 3,
      'receipt_counts.lifecycle_cleanup': 1,
      'receipt_counts.lifecycle_restore': 1,
      'receipt_counts.lifecycle_retention': 2,
      'coverage.required_memory_lifecycle_receipts_visible': true,
      'coverage.required_receipt_kinds_visible': true,
      'coverage.invalid_receipt_payloads_detected': false,
      'coverage.no_forbidden_payload_fields_detected': true,
      'selected_artifact_producing_visual_route.route_id': 'ppt_deck.image_first.artifact_producing.v1',
      'actual_workspace_receipt_refs.refs_visible': true,
      'actual_workspace_receipt_refs.required_owner_receipt_visible': true,
      gap_projection: {
        gap_id: 'real_memory_lifecycle_receipt_instances',
        status: 'runtime_receipt_instances_visible_not_production_soak',
        current_best_ref: '/workspace_receipt_inventory_projection',
        missing_receipt_kinds: [],
      },
      'authority_boundary.opl_app_can_index_receipt_refs': true,
      'authority_boundary.opl_app_can_write_receipt_instance': false,
      'authority_boundary.opl_app_can_claim_production_soak_complete': false,
      'repository_boundary.repo_tracks_live_receipt_instances': false,
    });
    assertAllFalse(manifestWithReceipts.workspace_receipt_inventory_projection, [
      'writes_visual_truth',
      'writes_artifact_blob',
      'writes_memory_body',
      'declares_production_soak_complete',
      'implements_opl_artifact_gallery',
      'implements_opl_workbench',
    ]);
    assert.ok(
      manifestWithReceipts.workspace_receipt_inventory_projection.receipt_refs.some(
        (receiptRef) => receiptRef.receipt_ref === workspaceReceiptProof.result_surface.receipt_refs.domain_owner_receipt_ref,
      ),
    );
    const memoryLifecycleGap = manifestWithReceipts.operator_evidence_readiness_projection.next_evidence_gaps.find(
      (gap) => gap.gap_id === 'real_memory_lifecycle_receipt_instances',
    );
    assertPathValues(manifestWithReceipts.operator_evidence_readiness_projection, {
      remaining_gap_classification: {
        functional_structure_gap_status: 'functional_structure_gaps_closed_evidence_gates_open',
        functional_structure_gap_count: 0,
        completed_functional_structure_gap_count: 8,
        completed_functional_structure_gap_ids: list('opl_generated_surface_production_consumption repo_local_wrapper_active_caller_migration focused_hosted_attempt_real_path_cutover artifact_gallery_handoff_shell review_repair_transport opl_app_operator_drilldown workspace_source_lifecycle_receipt_shell legacy_physical_cleanup'),
        remaining_gap_class: 'none',
        remaining_functional_structure_gap_ids: [],
        evidence_gap_class: 'production_live_soak_evidence_only',
        remaining_evidence_gate_ids: list('opl_hosted_controlled_visual_stage_long_soak real_memory_lifecycle_receipt_instances cross_family_repeated_no_regression_evidence'),
      },
      'production_acceptance.status': 'closed_by_domain_owned_acceptance_receipt',
      declares_artifact_producing_owner_receipt_scope: 'refs_only_receipt_chain_closed_not_visual_ready',
      declares_visual_ready: false,
      declares_exportable: false,
      declares_domain_ready: false,
    });
    assertPathValues(memoryLifecycleGap, {
      status: 'runtime_receipt_instances_visible_not_production_soak',
      current_best_ref: '/workspace_receipt_inventory_projection',
      missing_receipt_kinds: [],
    });

    const domain_action_adapterWithReceipts = await exportDomainActionAdapter({ workspace_root: workspaceRoot });
    assertPathValues(domain_action_adapterWithReceipts, {
      'mapped_surfaces.workspace_receipt_inventory_projection.ref': '/workspace_receipt_inventory_projection',
      'mapped_surfaces.workspace_receipt_inventory_projection.status': 'workspace_receipt_instances_visible_refs_only',
      'mapped_surfaces.workspace_receipt_inventory_projection.selected_artifact_producing_visual_route.route_id': 'ppt_deck.image_first.artifact_producing.v1',
      'mapped_surfaces.workspace_receipt_inventory_projection.actual_workspace_receipt_refs.refs_visible': true,
      'mapped_surfaces.workspace_receipt_inventory_projection.opl_can_write_receipt_instance': false,
      'source_manifest_refs.workspace_receipt_inventory_projection_ref': '/workspace_receipt_inventory_projection',
    });

    const acceptedMemoryReceiptPayload = readJson(workspaceReceiptProof.result_surface.runtime_files.accepted_memory_receipt_file);
    writeFileSync(
      workspaceReceiptProof.result_surface.runtime_files.accepted_memory_receipt_file,
      `${JSON.stringify({
        ...acceptedMemoryReceiptPayload,
        memory_content_body: 'forbidden body payload must stay out of OPL-facing inventory',
      }, null, 2)}\n`,
      'utf-8',
    );
    const manifestWithForbiddenReceiptPayload = await getProductEntryManifest({ workspace_root: workspaceRoot });
    assertPathValues(manifestWithForbiddenReceiptPayload.workspace_receipt_inventory_projection, {
      status: 'blocked_forbidden_receipt_payload_fields',
      'coverage.required_receipt_kinds_visible': true,
      'coverage.required_memory_lifecycle_receipts_visible': false,
      'coverage.forbidden_payload_fields_detected': ['memory_content_body'],
      'coverage.memory_content_body_projected': false,
      'gap_projection.status': 'blocked_forbidden_receipt_payload_fields',
      'gap_projection.missing_receipt_kinds': [],
    });
    assert.equal(
      manifestWithForbiddenReceiptPayload.operator_evidence_readiness_projection.next_evidence_gaps.find(
        (gap) => gap.gap_id === 'real_memory_lifecycle_receipt_instances',
      ).status,
      'blocked_forbidden_receipt_payload_fields',
    );
    writeFileSync(
      workspaceReceiptProof.result_surface.runtime_files.accepted_memory_receipt_file,
      readFileSync(workspaceReceiptProof.result_surface.runtime_files.accepted_memory_receipt_file, 'utf-8')
        .replace(/,\n  "memory_content_body": "forbidden body payload must stay out of OPL-facing inventory"/, ''),
      'utf-8',
    );

    const blockedWorkspaceReceiptProof = await dispatchDomainActionAdapter({
      task: { action: 'emit_workspace_receipt_proof', workspace_root: workspaceRoot, proof_id: 'blocked-workspace-receipts' },
    });
    assertPathValues(blockedWorkspaceReceiptProof.result_surface, {
      surface_kind: 'typed_blocker',
      blocker_kind: 'workspace_receipt_proof_missing_required_refs',
      visual_ready_claimed: false,
    });
    assert.equal(existsSync(`${workspaceRoot}/.redcube/runtime/proofs/workspace-receipts/blocked-workspace-receipts.json`), false);

    const forbiddenWorkspaceReceiptProofPayload = await dispatchDomainActionAdapter({
      task: {
        action: 'emit_workspace_receipt_proof',
        workspace_root: workspaceRoot,
        proof_id: 'forbidden-workspace-receipts',
        attempt_ref: 'workspace-runtime-ref:attempt:run-proof-forbidden',
        artifact_locator_ref: '/artifact_locator_contract',
        review_export_ref: 'workspace-runtime-ref:review-export:run-proof-forbidden',
        forbidden_write_proof_ref: '/controlled_memory_apply_proof/forbidden_write_audit',
        artifact_refs: ['workspace-runtime-ref:artifact:slide-proof-forbidden'],
        review_export_verdict_body: { verdict: 'forbidden body payload' },
        generic_runtime_state: { hidden_state: true },
      },
    });
    assertPathValues(forbiddenWorkspaceReceiptProofPayload.result_surface, {
      surface_kind: 'typed_blocker',
      blocker_kind: 'workspace_receipt_proof_forbidden_payload_fields',
      forbidden_payload_fields: list('generic_runtime_state review_export_verdict_body'),
      visual_ready_claimed: false,
      exportable_claimed: false,
      handoffable_claimed: false,
    });
    assert.equal(existsSync(`${workspaceRoot}/.redcube/runtime/proofs/workspace-receipts/forbidden-workspace-receipts.json`), false);
  });
});
