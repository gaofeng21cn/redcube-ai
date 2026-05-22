// @ts-nocheck

export function buildProductionEvidenceScaleoutRefs({
  standardDomainAgentSkeleton,
  workspaceReceiptInventoryProjection,
}) {
  const receiptContract = standardDomainAgentSkeleton.domain_owner_receipt_contract || {};
  const memoryApplyProof = standardDomainAgentSkeleton.controlled_memory_apply_proof || {};
  const noRegressionProof = standardDomainAgentSkeleton.no_regression_owner_receipt_opl_consumption_proof || {};
  const physicalSkeleton = standardDomainAgentSkeleton.physical_skeleton_follow_through || {};
  return {
    surface_kind: 'rca_visual_production_evidence_scaleout_refs',
    owner: 'redcube_ai',
    status: 'refs_landed_scaleout_runtime_evidence_pending',
    evidence_model: 'refs_only_no_visual_truth_artifact_blob_or_memory_body',
    evidence_receipt_fixture_ref: 'contracts/production_acceptance/rca-evidence-receipt-fixture.json',
    selected_artifact_producing_visual_route: {
      deliverable_family: 'ppt_deck',
      route_id: 'ppt_deck.image_first.artifact_producing.v1',
      route_ref: '/ppt_deck_visual_route_truth',
      route_kind: 'image_first_ppt_artifact_route',
      stage_sequence_refs: [
        'author_image_pages',
        'visual_director_review',
        'screenshot_review',
        'export_pptx',
      ],
      produces_artifact_refs: true,
      selected_for_evidence_scaleout: true,
      html_or_native_route_selected: false,
      visual_verdict_owner: 'redcube_ai',
      artifact_authority_owner: 'redcube_ai',
    },
    owner_receipt_refs: {
      status: 'artifact_producing_owner_receipt_ref_closed',
      contract_ref: '/domain_owner_receipt_contract',
      receipt_ref: 'rca-owner-receipt:visual-stage:transition-hosted-domain-receipt',
      actual_workspace_receipt_refs: workspaceReceiptInventoryProjection?.actual_workspace_receipt_refs?.artifact_producing_owner_receipt_refs || [],
      actual_workspace_receipt_refs_visible: (
        workspaceReceiptInventoryProjection?.actual_workspace_receipt_refs?.required_owner_receipt_visible === true
      ),
      allowed_return_shapes: receiptContract.allowed_return_shapes || [],
      opl_can_store_receipt_refs: receiptContract.opl_consumption_policy?.opl_can_store_receipt_refs === true,
      visual_readiness_claimed: false,
      export_readiness_claimed: false,
    },
    workspace_receipt_scaleout_refs: {
      status: workspaceReceiptInventoryProjection?.scaleout_projection?.status || 'workspace_receipt_scaleout_ref_model_pending',
      workspace_receipt_inventory_ref: '/workspace_receipt_inventory_projection',
      workspace_receipt_proof_action: 'emit_workspace_receipt_proof',
      workspace_receipt_proof_ref_model: 'rca-workspace-receipt-proof:visual-stage:<proof-id>',
      runtime_locator_ref_model: 'workspace-runtime-ref:receipt-proof:<proof-id>',
      required_workspace_count_for_scaleout: 2,
      observed_workspace_count: workspaceReceiptInventoryProjection?.scaleout_projection?.observed_workspace_count || 0,
      observed_receipt_count: workspaceReceiptInventoryProjection?.scaleout_projection?.observed_receipt_count || 0,
      receipt_kind_coverage_ready: workspaceReceiptInventoryProjection?.scaleout_projection?.receipt_kind_coverage_ready === true,
      actual_workspace_receipt_refs: workspaceReceiptInventoryProjection?.actual_workspace_receipt_refs || null,
      workspace_receipt_scaleout_claimed: false,
      emits_owner_receipt_ref: true,
      emits_memory_receipt_refs: true,
      emits_no_regression_evidence_ref: true,
      declares_production_soak_complete: false,
    },
    visual_memory_body_reuse_refs: {
      status: 'body_external_reuse_ref_landed',
      memory_locator_ref: '/domain_memory_descriptor_locator/memory_locator',
      controlled_apply_proof_ref: '/controlled_memory_apply_proof',
      consumed_memory_ref: memoryApplyProof.consumed_visual_pattern_memory_refs?.[0]?.memory_ref || 'rca-memory:visual-pattern:<memory-id>',
      memory_content_body_ref: memoryApplyProof.consumed_visual_pattern_memory_refs?.[0]?.content_ref || 'rca-memory-content-ref:visual-pattern:<memory-id>',
      runtime_receipt_instances_ref: '/controlled_memory_apply_proof/runtime_receipt_instances',
      body_owner: 'redcube_ai',
      projected_body_to_opl: false,
      contains_memory_body: false,
      reuse_ref_scope: 'visual_pattern_memory_locator_and_content_ref_only',
    },
    repeated_no_regression_evidence_refs: {
      status: 'repeated_refs_available_not_production_soak',
      generator_action: 'emit_no_regression_evidence',
      proof_contract_ref: '/no_regression_owner_receipt_opl_consumption_proof',
      proof_status: noRegressionProof.status || 'unknown',
      evidence_refs: [
        'rca-no-regression:visual-stage:transition-hosted-no-regression',
        'rca-no-regression:visual-stage:workspace-receipt-scaleout-no-regression',
      ],
      deliverable_family_refs: [
        'ppt_deck',
        'xiaohongshu',
      ],
      evidence_cadence: 'repeated_family_refs_only',
      required_minimum_evidence_ref_count: 2,
      repeated_no_regression_claimed_as_soak: false,
    },
    review_export_verdict_refs: {
      status: 'review_export_refs_routed_through_artifact_producing_route',
      route_id: 'ppt_deck.image_first.artifact_producing.v1',
      review_export_gate_ref: 'workspace-runtime-ref:review-export:transition-run',
      actual_workspace_review_export_ref_model: 'workspace-runtime-ref:review-export:<run-id>',
      verdict_body_projected_to_opl: false,
      declares_visual_ready: false,
      declares_exportable: false,
      declares_handoffable: false,
    },
    naming_tombstone_follow_through_refs: {
      status: 'tombstone_follow_through_refs_landed_no_compatibility_alias',
      active_caller_compatibility_alias_restored: false,
      tombstone_refs: physicalSkeleton.tombstone_refs || [],
      retained_provenance_refs: [
        'contracts/runtime-program/managed-product-entry-hardening.json',
        'human_doc:retired_managed_product_entry_contract_tombstone',
      ],
      forbidden_active_occurrence_classes: [
        'compatibility_alias',
        'default_runtime_owner',
        'public_action_key',
        'sidecar_template',
      ],
    },
    authority_boundary: {
      opl_can_store_projection_refs: true,
      opl_can_write_rca_visual_truth: false,
      opl_can_store_artifact_blob: false,
      opl_can_store_memory_body: false,
      opl_can_authorize_review_export_verdict: false,
      opl_can_claim_production_soak_complete: false,
    },
  };
}

export function buildOplExpectedReceiptMonitorFreshnessHandoff({
  productionEvidenceScaleoutRefs,
  workspaceReceiptInventoryProjection,
}) {
  const ownerReceiptRefs = productionEvidenceScaleoutRefs.owner_receipt_refs || {};
  const workspaceReceiptRefs = productionEvidenceScaleoutRefs.workspace_receipt_scaleout_refs || {};
  const memoryReuseRefs = productionEvidenceScaleoutRefs.visual_memory_body_reuse_refs || {};
  const noRegressionRefs = productionEvidenceScaleoutRefs.repeated_no_regression_evidence_refs || {};
  const workspaceScaleout = workspaceReceiptInventoryProjection?.scaleout_projection || {};
  return {
    surface_kind: 'rca_opl_expected_receipt_monitor_freshness_handoff',
    owner: 'redcube_ai',
    consumer: 'one_person_lab',
    status: 'body_free_refs_ready_for_opl_workorder',
    handoff_scope: 'opl_expected_receipt_and_monitor_freshness_backfill',
    evidence_model: 'refs_only_no_visual_truth_artifact_blob_memory_body_or_review_verdict_body',
    evidence_receipt_fixture_ref: productionEvidenceScaleoutRefs.evidence_receipt_fixture_ref,
    source_projection_refs: {
      operator_evidence_readiness_projection_ref: '/operator_evidence_readiness_projection',
      production_evidence_scaleout_refs_ref: '/operator_evidence_readiness_projection/production_evidence_scaleout_refs',
      workspace_receipt_inventory_projection_ref: '/workspace_receipt_inventory_projection',
      product_sidecar_export_ref: '/product_entry_shell/sidecar',
    },
    body_free_owner_receipt_ref: {
      expected_receipt_slot: 'artifact_producing_owner_receipt',
      receipt_ref: ownerReceiptRefs.receipt_ref || 'rca-owner-receipt:visual-stage:<receipt-id>',
      contract_ref: ownerReceiptRefs.contract_ref || '/domain_owner_receipt_contract',
      artifact_locator_ref: ownerReceiptRefs.artifact_locator_ref || '/artifact_locator_contract',
      review_export_gate_ref: ownerReceiptRefs.review_export_gate_ref || '/review_state',
      payload_body_included: false,
      visual_readiness_claimed: false,
      export_readiness_claimed: false,
    },
    body_free_workspace_receipt_ref: {
      expected_receipt_slot: 'workspace_receipt',
      workspace_receipt_inventory_ref: workspaceReceiptRefs.workspace_receipt_inventory_ref || '/workspace_receipt_inventory_projection',
      workspace_receipt_proof_action: 'emit_workspace_receipt_proof',
      workspace_receipt_proof_ref_model: workspaceReceiptRefs.workspace_receipt_proof_ref_model || 'rca-workspace-receipt-proof:visual-stage:<proof-id>',
      runtime_locator_ref_model: workspaceReceiptRefs.runtime_locator_ref_model || 'workspace-runtime-ref:receipt-proof:<proof-id>',
      observed_workspace_count: workspaceScaleout.observed_workspace_count || 0,
      observed_receipt_count: workspaceScaleout.observed_receipt_count || 0,
      receipt_kind_coverage_ready: workspaceScaleout.receipt_kind_coverage_ready === true,
      workspace_receipt_scaleout_claimed: false,
    },
    body_free_visual_memory_reuse_ref: {
      expected_receipt_slot: 'visual_memory_reuse_ref',
      memory_locator_ref: memoryReuseRefs.memory_locator_ref || '/domain_memory_descriptor_locator/memory_locator',
      consumed_memory_ref: memoryReuseRefs.consumed_memory_ref || 'rca-memory:visual-pattern:<memory-id>',
      memory_content_body_ref: memoryReuseRefs.memory_content_body_ref || 'rca-memory-content-ref:visual-pattern:<memory-id>',
      memory_body_projected_to_opl: false,
      payload_body_included: false,
    },
    body_free_repeated_no_regression_refs: {
      expected_receipt_slot: 'repeated_no_regression_evidence',
      generator_action: 'emit_no_regression_evidence',
      evidence_refs: noRegressionRefs.evidence_refs || [],
      deliverable_family_refs: noRegressionRefs.deliverable_family_refs || [],
      evidence_cadence: noRegressionRefs.evidence_cadence || 'repeated_family_refs_only',
      repeated_no_regression_claimed_as_soak: false,
    },
    monitor_freshness_backfill_refs: {
      monitor_surface_ref: '/workspace_receipt_inventory_projection',
      monitor_status: workspaceReceiptInventoryProjection?.status || 'unknown',
      freshness_ref_group: 'workspace_receipt_inventory_and_no_regression_refs',
      observed_workspace_count_ref: '/workspace_receipt_inventory_projection/scaleout_projection/observed_workspace_count',
      observed_receipt_count_ref: '/workspace_receipt_inventory_projection/scaleout_projection/observed_receipt_count',
      no_regression_evidence_refs_ref: '/operator_evidence_readiness_projection/production_evidence_scaleout_refs/repeated_no_regression_evidence_refs/evidence_refs',
      monitor_freshness_payload_body_required: false,
      production_soak_claimed: false,
    },
    typed_blocker_backfill_refs: {
      status: 'remaining_gates_reported_as_rca_typed_blockers',
      blocker_refs: [
        'rca-typed-blocker:controlled-soak:temporal-long-soak-pending',
        'rca-typed-blocker:memory-lifecycle:real-receipt-instances-pending',
        'rca-typed-blocker:no-regression:cross-family-production-scaleout-pending',
      ],
      blocker_owner: 'redcube_ai',
      payload_body_included: false,
    },
    opl_payload_policy: {
      payload_kind: 'stage_production_evidence_receipt_record_body_free_refs',
      payload_body_required: false,
      payload_body_allowed: false,
      allowed_payload_ref_groups: [
        'body_free_owner_receipt_ref',
        'body_free_workspace_receipt_ref',
        'body_free_visual_memory_reuse_ref',
        'body_free_repeated_no_regression_refs',
        'typed_blocker_backfill_refs',
      ],
      forbidden_payload_classes: [
        'visual truth body',
        'review or export verdict body',
        'artifact blob',
        'memory body',
      ],
    },
    authority_boundary: {
      opl_can_store_handoff_refs: true,
      opl_can_record_expected_receipt_refs: true,
      opl_can_record_monitor_freshness_refs: true,
      opl_can_write_rca_visual_truth: false,
      opl_can_store_artifact_payload: false,
      opl_can_store_memory_body: false,
      opl_can_authorize_review_export_verdict: false,
      opl_can_claim_visual_stage_soak_complete: false,
    },
  };
}

export function buildRcaEfficiencyHandoffProjection({ productionEvidenceScaleoutRefs } = {}) {
  const reviewExportRefs = productionEvidenceScaleoutRefs?.review_export_verdict_refs || {};
  const ownerReceiptRefs = productionEvidenceScaleoutRefs?.owner_receipt_refs || {};
  const memoryReuseRefs = productionEvidenceScaleoutRefs?.visual_memory_body_reuse_refs || {};
  return {
    surface_kind: 'rca_efficiency_handoff_projection',
    projection_id: 'rca.efficiency_handoff_projection.v1',
    owner: 'redcube_ai',
    consumer: 'opl_agent_lab',
    status: 'refs_only_standard_suite_input_ready',
    projection_model: 'derived_from_existing_runtime_review_export_refs_only',
    refs_only: true,
    read_only: true,
    agent_lab_suite_input: {
      suite_kind: 'standard',
      suite_id: 'redcube-ai.efficiency-observability.standard.v1',
      domain_id: 'redcube-ai',
      domain_specific_suite_kind_required: false,
      compatible_agent_lab_contract_ref: 'opl agent-lab suite-input#/standard',
      input_mode: 'refs_only_handoff',
      claims_visual_ready: false,
      claims_exportable: false,
      claims_handoffable: false,
      claims_production_soak_complete: false,
    },
    efficiency_signal_refs: {
      duration_refs: [
        'workspace-runtime-ref:route-summary:<run-id>#/elapsed_ms',
        'redcube product session#/runtime_loop_closure/elapsed_ms',
      ],
      cost_refs: [
        'workspace-runtime-ref:route-summary:<run-id>#/cost_summary',
        'redcube product session#/runtime_loop_closure/cost_summary',
      ],
      cache_refs: [
        'workspace-runtime-ref:route-summary:<run-id>#/cache_status',
        'redcube product manifest#/ppt_deck_visual_route_truth/cache_status',
        'workspace-runtime-ref:source-pack-reuse:<run-id>#/cache_status',
        'workspace-runtime-ref:prompt-static-prefix-cache:<run-id>#/cache_status',
        'workspace-runtime-ref:export-preview-cache:<run-id>#/cache_status',
      ],
      reuse_refs: [
        'workspace-runtime-ref:route-artifact:<run-id>#/render_execution/reused_slide_ids',
        'workspace-runtime-ref:route-artifact:<run-id>#/review_execution/reused_slide_ids',
        'workspace-runtime-ref:source-pack-reuse:<run-id>#/reused_source_pack_ref',
        'workspace-runtime-ref:prompt-static-prefix-cache:<run-id>#/prefix_hash',
        'workspace-runtime-ref:repair-image-pages:<run-id>#/preserved_slide_hashes',
        'workspace-runtime-ref:export-preview-cache:<run-id>#/preview_artifact_hash',
      ],
      render_execution_refs: [
        'workspace-runtime-ref:route-artifact:<run-id>#/render_execution',
        'workspace-runtime-ref:route-artifact:<run-id>#/render_execution/codex_batch_runtime',
        'workspace-runtime-ref:route-artifact:<run-id>#/render_execution/page_local_batch_runtime',
        'workspace-runtime-ref:route-artifact:<run-id>#/render_execution/parallel_batch_sizing',
      ],
      export_result_refs: [
        reviewExportRefs.actual_workspace_review_export_ref_model || 'workspace-runtime-ref:review-export:<run-id>',
        'workspace-runtime-ref:export-result:<run-id>',
        'workspace-runtime-ref:export-preview-cache:<run-id>',
      ],
      repair_scope_refs: [
        'workspace-runtime-ref:repair-image-pages:<run-id>#/blocked_slide_ids',
        'workspace-runtime-ref:repair-image-pages:<run-id>#/freshly_rendered_slide_ids',
        'workspace-runtime-ref:repair-image-pages:<run-id>#/reused_slide_ids',
      ],
    },
    efficiency_fields: {
      cache_status: {
        source_ref: 'workspace-runtime-ref:route-summary:<run-id>#/cache_status',
        body_included: false,
      },
      elapsed_ms: {
        source_ref: 'workspace-runtime-ref:route-summary:<run-id>#/elapsed_ms',
        body_included: false,
      },
      render_execution: {
        source_ref: 'workspace-runtime-ref:route-artifact:<run-id>#/render_execution',
        body_included: false,
      },
      reused_slide_ids: {
        source_ref: 'workspace-runtime-ref:route-artifact:<run-id>#/render_execution/reused_slide_ids',
        body_included: false,
      },
      cost_summary: {
        source_ref: 'workspace-runtime-ref:route-summary:<run-id>#/cost_summary',
        body_included: false,
      },
      screenshot_review_gate: {
        source_ref: 'workspace-runtime-ref:screenshot_review:<run-id>',
        body_included: false,
      },
      export_result: {
        source_ref: 'workspace-runtime-ref:export-result:<run-id>',
        body_included: false,
      },
      source_pack_reuse: {
        source_ref: 'workspace-runtime-ref:source-pack-reuse:<run-id>',
        body_included: false,
      },
      prompt_static_prefix_cache: {
        source_ref: 'workspace-runtime-ref:prompt-static-prefix-cache:<run-id>',
        body_included: false,
      },
      page_local_batch_runtime: {
        source_ref: 'workspace-runtime-ref:route-artifact:<run-id>#/render_execution/page_local_batch_runtime',
        body_included: false,
      },
      blocked_page_only_repair: {
        source_ref: 'workspace-runtime-ref:repair-image-pages:<run-id>',
        body_included: false,
      },
      export_preview_cache: {
        source_ref: 'workspace-runtime-ref:export-preview-cache:<run-id>',
        body_included: false,
      },
    },
    target_verification_refs: [
      'target-verification:redcube-ai/typecheck',
      'target-verification:redcube-ai/test-fast',
      'target-verification:redcube-ai/rca-efficiency-handoff-projection',
      'target-verification:redcube-ai/ppt-creative-ownership-targeted-rerender',
      'target-verification:redcube-ai/export-preview-cache',
    ],
    quality_floor_refs: {
      review_export_gate_refs: [
        reviewExportRefs.review_export_gate_ref || 'workspace-runtime-ref:review-export:transition-run',
        reviewExportRefs.actual_workspace_review_export_ref_model || 'workspace-runtime-ref:review-export:<run-id>',
        'agent/quality_gates/review_export_memory.md',
      ],
      screenshot_review_gate_refs: [
        'agent/quality_gates/screenshot_review.md',
        'workspace-runtime-ref:screenshot_review:<run-id>',
      ],
      visual_memory_authority_refs: [
        'redcube product manifest#/domain_memory_descriptor_locator/memory_locator',
        'redcube product manifest#/controlled_memory_apply_proof/runtime_receipt_instances',
      ],
      owner_receipt_refs: [
        ownerReceiptRefs.receipt_ref || 'rca-owner-receipt:visual-stage:<receipt-id>',
        'contracts/owner_receipt_contract.json#/receipt_cases/0',
      ],
      export_authority_refs: [
        'agent/quality_gates/artifact_authority.md',
        'contracts/artifact_locator_contract.json',
      ],
      blocked_page_only_repair_refs: [
        'workspace-runtime-ref:repair-image-pages:<run-id>#/blocked_slide_ids',
        'workspace-runtime-ref:repair-image-pages:<run-id>#/preserved_slide_hashes',
        'agent/prompts/repair_image_pages.md',
      ],
      export_preview_cache_gate_refs: [
        'workspace-runtime-ref:export-preview-cache:<run-id>',
        'workspace-runtime-ref:export-result:<run-id>',
      ],
    },
    optimization_policy: {
      efficiency_improves_observability_only: true,
      orchestration_only: true,
      quality_gates_may_be_lowered: false,
      screenshot_review_required: true,
      export_gate_required: true,
      source_pack_reuse_allowed: true,
      prompt_static_prefix_cache_allowed: true,
      page_local_parallel_or_batch_sizing_telemetry_allowed: true,
      blocked_page_only_repair_required_for_repair_route: true,
      export_preview_cache_allowed: true,
      visual_ready_claim_allowed: false,
    },
    authority_boundary: {
      no_forbidden_write: true,
      opl_agent_lab_can_store_suite_input_refs: true,
      opl_agent_lab_can_compare_efficiency_refs: true,
      opl_agent_lab_can_write_rca_visual_truth: false,
      opl_agent_lab_can_write_artifact_blob: false,
      opl_agent_lab_can_write_memory_body: false,
      opl_agent_lab_can_authorize_quality_verdict: false,
      opl_agent_lab_can_authorize_exportable: false,
      opl_agent_lab_can_claim_visual_ready: false,
      rca_quality_floor_owner: 'redcube_ai',
      rca_export_authority_owner: 'redcube_ai',
    },
  };
}
