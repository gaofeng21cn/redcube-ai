// @ts-nocheck

import {
  RCA_EFFICIENCY_PATCH_TRACEABILITY_MATRIX,
  RCA_EFFICIENCY_TARGET_VERIFICATION_REFS,
  RCA_EFFICIENCY_WORK_ORDER_ID,
} from './evidence-constants.js';

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
    source_work_order_ref: RCA_EFFICIENCY_WORK_ORDER_ID,
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
    target_agent_owner_surface_refs: {
      owner_route_ref: 'opl_generated:product_entry_manifest#/owner_route',
      owner_receipt_contract_ref: 'opl_generated:product_entry_manifest#/domain_owner_receipt_contract',
      external_work_order_owner_closeout_ref: 'opl_generated:product_entry_manifest#/domain_owner_receipt_contract/external_work_order_owner_closeout',
      external_work_order_owner_closeout_action: 'emit_external_work_order_owner_closeout',
      production_acceptance_contract_ref: 'contracts/production_acceptance/rca-production-acceptance.json',
      quality_gate_refs: [
        'agent/quality_gates/review_export_memory.md',
        'agent/quality_gates/artifact_authority.md',
      ],
      regression_suite_refs: [
        'tests/rca-efficiency-handoff-projection.test.ts',
        'tests/product-entry-cases/evidence-scaleout-surfaces.test.ts',
      ],
      owner: 'redcube_ai',
      refs_only: true,
    },
    target_runtime_consumption_refs: [
      'opl_generated:product_entry_manifest#/rca_efficiency_handoff_projection',
      'opl_generated:product_entry_manifest#/operator_evidence_readiness_projection/rca_efficiency_handoff_projection',
      'redcube domain-handler export#/mapped_surfaces/rca_efficiency_handoff_projection',
      'redcube domain-handler export#/source_manifest_refs/rca_efficiency_handoff_projection_ref',
      'redcube domain-handler export#/mapped_surfaces/external_work_order_owner_closeout',
      'redcube domain-handler export#/source_manifest_refs/external_work_order_owner_closeout_ref',
    ],
    efficiency_signal_refs: {
      duration_refs: [
        'workspace-runtime-ref:route-summary:<run-id>#/elapsed_ms',
        'opl_generated:product_session#/runtime_loop_closure/elapsed_ms',
      ],
      cost_refs: [
        'workspace-runtime-ref:route-summary:<run-id>#/cost_summary',
        'opl_generated:product_session#/runtime_loop_closure/cost_summary',
      ],
      cache_refs: [
        'workspace-runtime-ref:route-summary:<run-id>#/cache_status',
        'opl_generated:product_entry_manifest#/ppt_deck_visual_route_truth/cache_status',
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
    patch_traceability_matrix: RCA_EFFICIENCY_PATCH_TRACEABILITY_MATRIX.map((entry) => ({ ...entry })),
    target_verification_refs: [...RCA_EFFICIENCY_TARGET_VERIFICATION_REFS],
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
        'opl_generated:product_entry_manifest#/domain_memory_descriptor_locator/memory_locator',
        'opl_generated:product_entry_manifest#/controlled_memory_apply_proof/runtime_receipt_instances',
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
        'prompts/ppt_deck/repair_image_pages.md',
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
