// @ts-nocheck
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

import { SERIAL_ENV_TEST, assert, getProductEntryManifest, exportDomainActionAdapter, dispatchDomainActionAdapter, readJson, test, withMockCodexRuntimeState, prepareProductEntryWorkspace } from '../product-domain-action-case-shared.ts';


test('domain-handler receipt actions emit refs-only workspace proof without promoting visual readiness', SERIAL_ENV_TEST, async () => {
  await withMockCodexRuntimeState(async () => {
    const workspaceRoot = await prepareProductEntryWorkspace();

    const evidence = await dispatchDomainActionAdapter({
      task: {
        action: 'emit_no_regression_evidence',
        workspace_root: workspaceRoot,
        evidence_id: 'unit-no-regression',
      },
    });
    assert.equal(evidence.ok, true);
    assert.equal(evidence.result_surface.surface_kind, 'no_regression_evidence');
    assert.equal(evidence.result_surface.evidence_ref, 'rca-no-regression:visual-stage:unit-no-regression');
    assert.equal(
      evidence.result_surface.runtime_locator_ref,
      'workspace-runtime-ref:no-regression-evidence:unit-no-regression',
    );
    assert.equal(evidence.result_surface.coverage.long_visual_soak_claimed, false);
    assert.equal(evidence.result_surface.coverage.visual_artifact_blob_written, false);
    assert.equal(evidence.result_surface.coverage.review_export_verdict_written, false);
    assert.equal(evidence.result_surface.coverage.memory_content_body_written, false);
    assert.equal(evidence.result_surface.repository_boundary.repo_tracks_runtime_evidence_instance, false);
    assert.equal(evidence.result_surface.repository_boundary.repo_tracks_visual_or_export_artifacts, false);
    assert.equal(evidence.result_surface.authority_boundary.opl_can_store_no_regression_evidence_ref, true);
    assert.equal(evidence.result_surface.authority_boundary.opl_can_store_visual_truth, false);
    const evidenceFile = readJson(evidence.result_surface.evidence_file);
    assert.equal(evidenceFile.surface_kind, 'no_regression_evidence');
    assert.equal(evidenceFile.evidence_ref, evidence.result_surface.evidence_ref);
    assert.equal(evidenceFile.source_manifest_refs.runtime_residue_retirement_status, 'active_path_retired');
    assert.equal(evidenceFile.source_manifest_refs.skeleton_repo_source_layout_audit_status, 'pass');
    assert.equal(evidenceFile.coverage.verifies_legacy_default_active_path_retired, true);
    assert.equal(evidenceFile.coverage.long_visual_soak_claimed, false);

    const missingReceiptRefs = await dispatchDomainActionAdapter({
      task: {
        action: 'emit_domain_owner_receipt',
        workspace_root: workspaceRoot,
        receipt_id: 'missing-domain-refs',
      },
    });
    assert.equal(missingReceiptRefs.result_surface.surface_kind, 'typed_blocker');
    assert.equal(missingReceiptRefs.result_surface.return_shape, 'typed_blocker');
    assert.equal(missingReceiptRefs.result_surface.blocker_kind, 'domain_owner_receipt_missing_required_refs');
    assert.equal(missingReceiptRefs.result_surface.owner, 'redcube_ai');
    assert.equal(missingReceiptRefs.result_surface.visual_ready_claimed, false);
    assert.equal(
      existsSync(`${workspaceRoot}/.redcube/runtime/receipts/domain-owner/missing-domain-refs.json`),
      false,
    );

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
        artifact_refs: [
          {
            artifact_kind: 'png_page',
            ref_kind: 'workspace_runtime_artifact',
            artifact_ref: 'workspace-runtime-ref:artifact:forbidden-slide',
            artifact_body: 'forbidden body payload must not enter owner receipt',
          },
        ],
        memory_content_body: 'forbidden memory body must not enter owner receipt',
      },
    });
    assert.equal(forbiddenDomainReceiptPayload.result_surface.surface_kind, 'typed_blocker');
    assert.equal(
      forbiddenDomainReceiptPayload.result_surface.blocker_kind,
      'domain_owner_receipt_forbidden_payload_fields',
    );
    assert.deepEqual(
      forbiddenDomainReceiptPayload.result_surface.forbidden_payload_fields,
      ['artifact_refs[0].artifact_body', 'memory_content_body'],
    );
    assert.equal(forbiddenDomainReceiptPayload.result_surface.visual_ready_claimed, false);
    assert.equal(forbiddenDomainReceiptPayload.result_surface.exportable_claimed, false);
    assert.equal(forbiddenDomainReceiptPayload.result_surface.handoffable_claimed, false);
    assert.equal(
      existsSync(`${workspaceRoot}/.redcube/runtime/receipts/domain-owner/forbidden-domain-payload.json`),
      false,
    );

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
        artifact_refs: [
          {
            artifact_kind: 'png_page',
            ref_kind: 'workspace_runtime_artifact',
            artifact_ref: 'workspace-runtime-ref:artifact:slide-1',
            sha256: 'sha256-slide-1',
          },
        ],
        repair_target_refs: ['workspace-runtime-ref:repair:slide-1'],
        handoff_packet_ref: 'workspace-runtime-ref:handoff:run-a',
        residual_risk_refs: ['workspace-runtime-ref:risk:manual-review'],
      },
    });
    assert.equal(domainReceipt.result_surface.surface_kind, 'domain_owner_receipt');
    assert.equal(domainReceipt.result_surface.return_shape, 'domain_receipt');
    assert.equal(domainReceipt.result_surface.receipt_ref, 'rca-owner-receipt:visual-stage:unit-domain-receipt');
    assert.equal(
      domainReceipt.result_surface.runtime_locator_ref,
      'workspace-runtime-ref:domain-owner-receipt:unit-domain-receipt',
    );
    assert.equal(domainReceipt.result_surface.coverage.visual_ready_claimed, false);
    assert.equal(domainReceipt.result_surface.coverage.opl_completion_promoted_to_visual_ready, false);
    assert.equal(domainReceipt.result_surface.coverage.exportable_claimed, false);
    assert.equal(domainReceipt.result_surface.coverage.handoffable_claimed, false);
    assert.equal(domainReceipt.result_surface.coverage.visual_artifact_blob_written, false);
    assert.equal(domainReceipt.result_surface.coverage.review_export_verdict_written, false);
    assert.equal(domainReceipt.result_surface.repository_boundary.repo_tracks_live_receipt_instances, false);
    assert.equal(domainReceipt.result_surface.authority_boundary.opl_can_store_receipt_ref, true);
    assert.equal(domainReceipt.result_surface.authority_boundary.opl_can_store_visual_truth, false);
    assert.equal(domainReceipt.result_surface.authority_boundary.opl_can_mutate_domain_artifacts, false);
    const domainReceiptFile = readJson(domainReceipt.result_surface.receipt_file);
    assert.equal(domainReceiptFile.surface_kind, 'domain_owner_receipt');
    assert.equal(domainReceiptFile.required_refs.attempt_ref, 'workspace-runtime-ref:attempt:run-a');
    assert.equal(domainReceiptFile.artifact_delta.artifact_refs.length, 1);
    assert.equal(domainReceiptFile.coverage.visual_ready_claimed, false);

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
    assert.equal(memoryReceipt.result_surface.surface_kind, 'visual_pattern_memory_writeback_receipt');
    assert.equal(memoryReceipt.result_surface.writeback_status, 'accepted');
    assert.equal(memoryReceipt.result_surface.receipt_ref, 'rca-memory-receipt:visual-pattern:proposal-a-accepted');
    assert.equal(memoryReceipt.result_surface.memory_content_body, undefined);
    assert.equal(memoryReceipt.result_surface.review_verdict, undefined);
    const memoryReceiptFile = readJson(memoryReceipt.result_surface.receipt_file);
    assert.equal(memoryReceiptFile.writeback_status, 'accepted');
    assert.equal(memoryReceiptFile.memory_content_body, undefined);
    assert.equal(memoryReceiptFile.repository_boundary.repo_tracks_receipt_instance, false);

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
    assert.equal(blockedMemory.result_surface.surface_kind, 'typed_blocker');
    assert.equal(blockedMemory.result_surface.blocker_kind, 'visual_memory_writeback_owner_required');

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
    assert.equal(lifecycleReceipt.result_surface.surface_kind, 'visual_workspace_lifecycle_receipt');
    assert.equal(lifecycleReceipt.result_surface.operation, 'retention');
    assert.equal(lifecycleReceipt.result_surface.receipt_ref, 'rca-lifecycle-receipt:retention:unit-lifecycle');
    assert.equal(lifecycleReceipt.result_surface.artifact_mutation_applied, false);
    assert.equal(lifecycleReceipt.result_surface.review_export_verdict_written, false);
    const lifecycleReceiptFile = readJson(lifecycleReceipt.result_surface.receipt_file);
    assert.equal(lifecycleReceiptFile.operation, 'retention');
    assert.equal(lifecycleReceiptFile.artifact_mutation_applied, false);

    const blockedLifecycle = await dispatchDomainActionAdapter({
      task: {
        action: 'apply_visual_workspace_lifecycle',
        workspace_root: workspaceRoot,
        operation: 'cleanup',
        receipt_id: 'blocked-cleanup',
        requested_artifact_mutation: true,
      },
    });
    assert.equal(blockedLifecycle.result_surface.surface_kind, 'typed_blocker');
    assert.equal(blockedLifecycle.result_surface.blocker_kind, 'lifecycle_domain_receipt_required');

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
    assert.equal(workspaceReceiptProof.result_surface.surface_kind, 'workspace_receipt_proof');
    assert.equal(workspaceReceiptProof.result_surface.return_shape, 'workspace_receipt_proof');
    assert.equal(
      workspaceReceiptProof.result_surface.proof_ref,
      'rca-workspace-receipt-proof:visual-stage:unit-workspace-receipts',
    );
    assert.equal(
      workspaceReceiptProof.result_surface.receipt_refs.accepted_memory_receipt_ref,
      'rca-memory-receipt:visual-pattern:unit-workspace-receipts-accepted-memory-accepted',
    );
    assert.equal(
      workspaceReceiptProof.result_surface.receipt_refs.rejected_memory_receipt_ref,
      'rca-memory-receipt:visual-pattern:unit-workspace-receipts-rejected-memory-rejected',
    );
    assert.equal(
      workspaceReceiptProof.result_surface.receipt_refs.cleanup_lifecycle_receipt_ref,
      'rca-lifecycle-receipt:cleanup:unit-workspace-receipts-cleanup',
    );
    assert.equal(
      workspaceReceiptProof.result_surface.receipt_refs.restore_lifecycle_receipt_ref,
      'rca-lifecycle-receipt:restore:unit-workspace-receipts-restore',
    );
    assert.equal(
      workspaceReceiptProof.result_surface.receipt_refs.retention_lifecycle_receipt_ref,
      'rca-lifecycle-receipt:retention:unit-workspace-receipts-retention',
    );
    assert.equal(
      workspaceReceiptProof.result_surface.receipt_refs.no_regression_evidence_ref,
      'rca-no-regression:visual-stage:unit-workspace-receipts-no-regression',
    );
    assert.equal(
      workspaceReceiptProof.result_surface.receipt_refs.domain_owner_receipt_ref,
      'rca-owner-receipt:visual-stage:unit-workspace-receipts-domain-owner',
    );
    assert.equal(workspaceReceiptProof.result_surface.coverage.accepted_memory_receipt_written, true);
    assert.equal(workspaceReceiptProof.result_surface.coverage.rejected_memory_receipt_written, true);
    assert.equal(workspaceReceiptProof.result_surface.coverage.cleanup_lifecycle_receipt_written, true);
    assert.equal(workspaceReceiptProof.result_surface.coverage.restore_lifecycle_receipt_written, true);
    assert.equal(workspaceReceiptProof.result_surface.coverage.retention_lifecycle_receipt_written, true);
    assert.equal(workspaceReceiptProof.result_surface.coverage.no_regression_evidence_written, true);
    assert.equal(workspaceReceiptProof.result_surface.coverage.domain_owner_receipt_written, true);
    assert.equal(workspaceReceiptProof.result_surface.coverage.visual_ready_claimed, false);
    assert.equal(workspaceReceiptProof.result_surface.coverage.exportable_claimed, false);
    assert.equal(workspaceReceiptProof.result_surface.coverage.handoffable_claimed, false);
    assert.equal(workspaceReceiptProof.result_surface.coverage.production_soak_claimed, false);
    assert.equal(workspaceReceiptProof.result_surface.coverage.visual_artifact_blob_written, false);
    assert.equal(workspaceReceiptProof.result_surface.coverage.memory_content_body_written, false);
    assert.equal(workspaceReceiptProof.result_surface.coverage.generic_runtime_state_written, false);
    assert.equal(workspaceReceiptProof.result_surface.repository_boundary.repo_tracks_live_receipt_instances, false);
    assert.equal(workspaceReceiptProof.result_surface.authority_boundary.opl_can_store_receipt_refs, true);
    assert.equal(workspaceReceiptProof.result_surface.authority_boundary.opl_can_store_visual_truth, false);
    assert.equal(workspaceReceiptProof.result_surface.authority_boundary.opl_can_write_visual_memory_body, false);
    assert.equal(
      workspaceReceiptProof.result_surface.live_visual_route_owner_chain_refs.surface_kind,
      'rca_live_visual_route_owner_chain_refs',
    );
    assert.equal(
      workspaceReceiptProof.result_surface.live_visual_route_owner_chain_refs.selected_artifact_producing_visual_route.route_id,
      'ppt_deck.image_first.artifact_producing.v1',
    );
    assert.equal(workspaceReceiptProof.result_surface.live_visual_route_owner_chain_refs.payload_body_included, false);
    assert.equal(
      workspaceReceiptProof.result_surface.live_visual_route_owner_chain_refs.owner_receipt_ref,
      workspaceReceiptProof.result_surface.receipt_refs.domain_owner_receipt_ref,
    );
    assert.equal(
      workspaceReceiptProof.result_surface.live_visual_route_owner_chain_refs.workspace_receipt_ref,
      workspaceReceiptProof.result_surface.proof_ref,
    );
    assert.deepEqual(
      workspaceReceiptProof.result_surface.live_visual_route_owner_chain_refs.visual_memory_reuse_refs,
      [
        workspaceReceiptProof.result_surface.receipt_refs.accepted_memory_receipt_ref,
        workspaceReceiptProof.result_surface.receipt_refs.rejected_memory_receipt_ref,
      ],
    );
    assert.deepEqual(
      workspaceReceiptProof.result_surface.live_visual_route_owner_chain_refs.repeated_no_regression_evidence_refs,
      [workspaceReceiptProof.result_surface.receipt_refs.no_regression_evidence_ref],
    );
    assert.deepEqual(workspaceReceiptProof.result_surface.live_visual_route_owner_chain_refs.readiness_claims, {
      claims_visual_ready: false,
      claims_exportable: false,
      claims_handoffable: false,
      claims_production_visual_soak_complete: false,
    });
    const workspaceReceiptProofFile = readJson(workspaceReceiptProof.result_surface.proof_file);
    assert.equal(workspaceReceiptProofFile.surface_kind, 'workspace_receipt_proof');
    assert.equal(workspaceReceiptProofFile.coverage.production_soak_claimed, false);
    assert.equal(workspaceReceiptProofFile.live_visual_route_owner_chain_refs.payload_body_included, false);
    assert.equal(
      readJson(workspaceReceiptProof.result_surface.runtime_files.accepted_memory_receipt_file).writeback_status,
      'accepted',
    );
    assert.equal(
      readJson(workspaceReceiptProof.result_surface.runtime_files.rejected_memory_receipt_file).writeback_status,
      'rejected',
    );
    assert.equal(
      readJson(workspaceReceiptProof.result_surface.runtime_files.cleanup_lifecycle_receipt_file).operation,
      'cleanup',
    );
    assert.equal(
      readJson(workspaceReceiptProof.result_surface.runtime_files.restore_lifecycle_receipt_file).operation,
      'restore',
    );
    assert.equal(
      readJson(workspaceReceiptProof.result_surface.runtime_files.retention_lifecycle_receipt_file).operation,
      'retention',
    );
    assert.equal(
      readJson(workspaceReceiptProof.result_surface.runtime_files.domain_owner_receipt_file).required_refs.memory_receipt_ref,
      workspaceReceiptProof.result_surface.receipt_refs.accepted_memory_receipt_ref,
    );

    const manifestWithReceipts = await getProductEntryManifest({
      workspace_root: workspaceRoot,
    });
    assert.equal(
      manifestWithReceipts.workspace_receipt_inventory_projection.surface_kind,
      'workspace_receipt_inventory_projection',
    );
    assert.equal(
      manifestWithReceipts.workspace_receipt_inventory_projection.projection_id,
      'rca.workspace_receipt_inventory.v1',
    );
    assert.equal(
      manifestWithReceipts.workspace_receipt_inventory_projection.status,
      'workspace_receipt_instances_visible_refs_only',
    );
    assert.equal(manifestWithReceipts.workspace_receipt_inventory_projection.read_only, true);
    assert.equal(manifestWithReceipts.workspace_receipt_inventory_projection.refs_only, true);
    assert.equal(manifestWithReceipts.workspace_receipt_inventory_projection.writes_visual_truth, false);
    assert.equal(manifestWithReceipts.workspace_receipt_inventory_projection.writes_artifact_blob, false);
    assert.equal(manifestWithReceipts.workspace_receipt_inventory_projection.writes_memory_body, false);
    assert.equal(
      manifestWithReceipts.workspace_receipt_inventory_projection.declares_production_soak_complete,
      false,
    );
    assert.equal(
      manifestWithReceipts.workspace_receipt_inventory_projection.implements_opl_artifact_gallery,
      false,
    );
    assert.equal(
      manifestWithReceipts.workspace_receipt_inventory_projection.implements_opl_workbench,
      false,
    );
    assert.equal(manifestWithReceipts.workspace_receipt_inventory_projection.receipt_counts.domain_owner, 2);
    assert.equal(manifestWithReceipts.workspace_receipt_inventory_projection.receipt_counts.memory_visual_pattern, 3);
    assert.equal(manifestWithReceipts.workspace_receipt_inventory_projection.receipt_counts.lifecycle_cleanup, 1);
    assert.equal(manifestWithReceipts.workspace_receipt_inventory_projection.receipt_counts.lifecycle_restore, 1);
    assert.equal(manifestWithReceipts.workspace_receipt_inventory_projection.receipt_counts.lifecycle_retention, 2);
    assert.equal(
      manifestWithReceipts.workspace_receipt_inventory_projection.coverage.required_memory_lifecycle_receipts_visible,
      true,
    );
    assert.equal(
      manifestWithReceipts.workspace_receipt_inventory_projection.coverage.required_receipt_kinds_visible,
      true,
    );
    assert.equal(
      manifestWithReceipts.workspace_receipt_inventory_projection.coverage.invalid_receipt_payloads_detected,
      false,
    );
    assert.equal(
      manifestWithReceipts.workspace_receipt_inventory_projection.coverage.no_forbidden_payload_fields_detected,
      true,
    );
    assert.equal(
      manifestWithReceipts.workspace_receipt_inventory_projection.selected_artifact_producing_visual_route.route_id,
      'ppt_deck.image_first.artifact_producing.v1',
    );
    assert.equal(
      manifestWithReceipts.workspace_receipt_inventory_projection.actual_workspace_receipt_refs.refs_visible,
      true,
    );
    assert.equal(
      manifestWithReceipts.workspace_receipt_inventory_projection.actual_workspace_receipt_refs.required_owner_receipt_visible,
      true,
    );
    assert.deepEqual(
      manifestWithReceipts.workspace_receipt_inventory_projection.gap_projection,
      {
        gap_id: 'real_memory_lifecycle_receipt_instances',
        status: 'runtime_receipt_instances_visible_not_production_soak',
        current_best_ref: '/workspace_receipt_inventory_projection',
        missing_receipt_kinds: [],
      },
    );
    assert.equal(
      manifestWithReceipts.workspace_receipt_inventory_projection.authority_boundary.opl_app_can_index_receipt_refs,
      true,
    );
    assert.equal(
      manifestWithReceipts.workspace_receipt_inventory_projection.authority_boundary.opl_app_can_write_receipt_instance,
      false,
    );
    assert.equal(
      manifestWithReceipts.workspace_receipt_inventory_projection.authority_boundary.opl_app_can_claim_production_soak_complete,
      false,
    );
    assert.equal(
      manifestWithReceipts.workspace_receipt_inventory_projection.repository_boundary.repo_tracks_live_receipt_instances,
      false,
    );
    assert.ok(
      manifestWithReceipts.workspace_receipt_inventory_projection.receipt_refs.some(
        (receiptRef) => receiptRef.receipt_ref === workspaceReceiptProof.result_surface.receipt_refs.domain_owner_receipt_ref,
      ),
    );
    assert.equal(
      manifestWithReceipts.operator_evidence_readiness_projection.source_refs.some(
        (source) => source.source_id === 'workspace_receipt_inventory_projection'
          && source.required_memory_lifecycle_receipts_visible === true,
      ),
      true,
    );
    const memoryLifecycleGap = manifestWithReceipts.operator_evidence_readiness_projection.next_evidence_gaps.find(
      (gap) => gap.gap_id === 'real_memory_lifecycle_receipt_instances',
    );
    assert.deepEqual(
      manifestWithReceipts.operator_evidence_readiness_projection.remaining_gap_classification,
      {
        functional_structure_gap_status: 'functional_structure_gaps_closed_evidence_gates_open',
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
        remaining_gap_class: 'none',
        remaining_functional_structure_gap_ids: [],
        evidence_gap_class: 'production_live_soak_evidence_only',
        remaining_evidence_gate_ids: [
          'opl_hosted_controlled_visual_stage_long_soak',
          'real_memory_lifecycle_receipt_instances',
          'cross_family_repeated_no_regression_evidence',
        ],
      },
    );
    assert.equal(
      manifestWithReceipts.operator_evidence_readiness_projection.production_acceptance.status,
      'closed_by_domain_owned_acceptance_receipt',
    );
    assert.equal(
      manifestWithReceipts.operator_evidence_readiness_projection.declares_artifact_producing_owner_receipt_scope,
      'refs_only_receipt_chain_closed_not_visual_ready',
    );
    assert.equal(manifestWithReceipts.operator_evidence_readiness_projection.declares_visual_ready, false);
    assert.equal(manifestWithReceipts.operator_evidence_readiness_projection.declares_exportable, false);
    assert.equal(manifestWithReceipts.operator_evidence_readiness_projection.declares_domain_ready, false);
    assert.equal(memoryLifecycleGap.status, 'runtime_receipt_instances_visible_not_production_soak');
    assert.equal(memoryLifecycleGap.current_best_ref, '/workspace_receipt_inventory_projection');
    assert.deepEqual(memoryLifecycleGap.missing_receipt_kinds, []);

    const domain_action_adapterWithReceipts = await exportDomainActionAdapter({
      workspace_root: workspaceRoot,
    });
    assert.equal(
      domain_action_adapterWithReceipts.mapped_surfaces.workspace_receipt_inventory_projection.ref,
      '/workspace_receipt_inventory_projection',
    );
    assert.equal(
      domain_action_adapterWithReceipts.mapped_surfaces.workspace_receipt_inventory_projection.status,
      'workspace_receipt_instances_visible_refs_only',
    );
    assert.equal(
      domain_action_adapterWithReceipts.mapped_surfaces.workspace_receipt_inventory_projection.selected_artifact_producing_visual_route.route_id,
      'ppt_deck.image_first.artifact_producing.v1',
    );
    assert.equal(
      domain_action_adapterWithReceipts.mapped_surfaces.workspace_receipt_inventory_projection.actual_workspace_receipt_refs.refs_visible,
      true,
    );
    assert.equal(
      domain_action_adapterWithReceipts.mapped_surfaces.workspace_receipt_inventory_projection.opl_can_write_receipt_instance,
      false,
    );
    assert.equal(
      domain_action_adapterWithReceipts.source_manifest_refs.workspace_receipt_inventory_projection_ref,
      '/workspace_receipt_inventory_projection',
    );

    const acceptedMemoryReceiptPayload = readJson(workspaceReceiptProof.result_surface.runtime_files.accepted_memory_receipt_file);
    writeFileSync(
      workspaceReceiptProof.result_surface.runtime_files.accepted_memory_receipt_file,
      `${JSON.stringify({
        ...acceptedMemoryReceiptPayload,
        memory_content_body: 'forbidden body payload must stay out of OPL-facing inventory',
      }, null, 2)}\n`,
      'utf-8',
    );
    const manifestWithForbiddenReceiptPayload = await getProductEntryManifest({
      workspace_root: workspaceRoot,
    });
    assert.equal(
      manifestWithForbiddenReceiptPayload.workspace_receipt_inventory_projection.status,
      'blocked_forbidden_receipt_payload_fields',
    );
    assert.equal(
      manifestWithForbiddenReceiptPayload.workspace_receipt_inventory_projection.coverage.required_receipt_kinds_visible,
      true,
    );
    assert.equal(
      manifestWithForbiddenReceiptPayload.workspace_receipt_inventory_projection.coverage.required_memory_lifecycle_receipts_visible,
      false,
    );
    assert.deepEqual(
      manifestWithForbiddenReceiptPayload.workspace_receipt_inventory_projection.coverage.forbidden_payload_fields_detected,
      ['memory_content_body'],
    );
    assert.equal(
      manifestWithForbiddenReceiptPayload.workspace_receipt_inventory_projection.coverage.memory_content_body_projected,
      false,
    );
    assert.equal(
      manifestWithForbiddenReceiptPayload.workspace_receipt_inventory_projection.gap_projection.status,
      'blocked_forbidden_receipt_payload_fields',
    );
    assert.deepEqual(
      manifestWithForbiddenReceiptPayload.workspace_receipt_inventory_projection.gap_projection.missing_receipt_kinds,
      [],
    );
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
      task: {
        action: 'emit_workspace_receipt_proof',
        workspace_root: workspaceRoot,
        proof_id: 'blocked-workspace-receipts',
      },
    });
    assert.equal(blockedWorkspaceReceiptProof.result_surface.surface_kind, 'typed_blocker');
    assert.equal(
      blockedWorkspaceReceiptProof.result_surface.blocker_kind,
      'workspace_receipt_proof_missing_required_refs',
    );
    assert.equal(blockedWorkspaceReceiptProof.result_surface.visual_ready_claimed, false);
    assert.equal(
      existsSync(`${workspaceRoot}/.redcube/runtime/proofs/workspace-receipts/blocked-workspace-receipts.json`),
      false,
    );

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
    assert.equal(forbiddenWorkspaceReceiptProofPayload.result_surface.surface_kind, 'typed_blocker');
    assert.equal(
      forbiddenWorkspaceReceiptProofPayload.result_surface.blocker_kind,
      'workspace_receipt_proof_forbidden_payload_fields',
    );
    assert.deepEqual(
      forbiddenWorkspaceReceiptProofPayload.result_surface.forbidden_payload_fields,
      ['generic_runtime_state', 'review_export_verdict_body'],
    );
    assert.equal(forbiddenWorkspaceReceiptProofPayload.result_surface.visual_ready_claimed, false);
    assert.equal(forbiddenWorkspaceReceiptProofPayload.result_surface.exportable_claimed, false);
    assert.equal(forbiddenWorkspaceReceiptProofPayload.result_surface.handoffable_claimed, false);
    assert.equal(
      existsSync(`${workspaceRoot}/.redcube/runtime/proofs/workspace-receipts/forbidden-workspace-receipts.json`),
      false,
    );
  });
});
