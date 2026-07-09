import { buildOwnerPayloadItemSummaries } from '../operator-evidence-payload-summaries.js';
import {
  RCA_OWNER_PAYLOAD_PATH_POLICY,
  RCA_OWNER_PAYLOAD_REQUIRED_RETURN_SHAPES,
  RCA_OPL_EXTERNAL_NO_REGRESSION_RECEIPT_REF,
  RCA_PRODUCTION_EVIDENCE_TYPED_BLOCKER_REFS,
  RCA_REAL_NO_REGRESSION_EVIDENCE_CADENCE,
  RCA_REAL_NO_REGRESSION_EVIDENCE_PROVENANCE,
  RCA_REAL_NO_REGRESSION_EVIDENCE_REFS,
  uniqueRefs,
} from './evidence-constants.js';

type RefGroup = Record<string, unknown>;

type ReceiptContractRefs = RefGroup & {
  allowed_return_shapes?: unknown[];
  opl_consumption_policy?: {
    opl_can_store_receipt_refs?: boolean;
  };
};

type MemoryApplyProofRefs = RefGroup & {
  consumed_visual_pattern_memory_refs?: Array<{
    memory_ref?: unknown;
    content_ref?: unknown;
  }>;
};

type DomainAuthorityRefs = RefGroup & {
  domain_owner_receipt_contract?: ReceiptContractRefs;
  controlled_memory_apply_proof?: MemoryApplyProofRefs;
  no_regression_owner_receipt_opl_consumption_proof?: RefGroup & {
    status?: unknown;
  };
};

type WorkspaceReceiptInventoryProjection = RefGroup & {
  actual_workspace_receipt_refs?: RefGroup & {
    artifact_producing_owner_receipt_refs?: unknown[];
    memory_lifecycle_receipt_refs?: unknown[];
    required_owner_receipt_visible?: boolean;
  };
  scaleout_projection?: {
    status?: unknown;
    observed_workspace_count?: number;
    observed_receipt_count?: number;
    receipt_kind_coverage_ready?: boolean;
  };
};

export function buildProductionEvidenceScaleoutRefs({
  domainAuthorityRefs,
  workspaceReceiptInventoryProjection,
}: {
  domainAuthorityRefs: DomainAuthorityRefs;
  workspaceReceiptInventoryProjection: WorkspaceReceiptInventoryProjection;
}) {
  const receiptContract = domainAuthorityRefs.domain_owner_receipt_contract || {};
  const memoryApplyProof = domainAuthorityRefs.controlled_memory_apply_proof || {};
  const noRegressionProof = domainAuthorityRefs.no_regression_owner_receipt_opl_consumption_proof || {};
  const actualWorkspaceReceiptRefs =
    workspaceReceiptInventoryProjection?.actual_workspace_receipt_refs?.artifact_producing_owner_receipt_refs || [];
  const domainOwnerReceiptRefs = uniqueRefs([
    'rca-owner-receipt:visual-stage:transition-hosted-domain-receipt',
    ...actualWorkspaceReceiptRefs,
  ]);
  const noRegressionEvidenceRefs = uniqueRefs([
    'rca-no-regression:visual-stage:transition-hosted-no-regression',
    'rca-no-regression:visual-stage:workspace-receipt-scaleout-no-regression',
    ...RCA_REAL_NO_REGRESSION_EVIDENCE_REFS,
  ]);
  const ownerChainRefs = uniqueRefs([
    'contracts/production_acceptance/rca-evidence-receipt-fixture.json',
    '/domain_owner_receipt_contract',
    '/artifact_locator_contract',
    '/workspace_receipt_inventory_projection',
    '/operator_evidence_readiness_projection/production_evidence_scaleout_refs',
    '/controlled_memory_apply_proof',
    '/no_regression_owner_receipt_opl_consumption_proof',
    'workspace-runtime-ref:review-export:transition-run',
    ...domainOwnerReceiptRefs,
    ...noRegressionEvidenceRefs,
    ...(workspaceReceiptInventoryProjection?.actual_workspace_receipt_refs?.memory_lifecycle_receipt_refs || []),
  ]);
  const acceptedPayloadPaths = {
    success_refs_path: {
      required_any_operator_payload_refs: [
        'domain_owner_receipt_refs',
        'no_regression_evidence_refs',
        'owner_chain_refs',
      ],
      typed_blocker_refs_must_be_absent: true,
      closes_owner_chain: false,
      closes_domain_ready: false,
      closes_production_ready: false,
    },
    typed_blocker_path: {
      required_operator_payload_refs: ['typed_blocker_refs'],
      success_claimed: false,
      closes_owner_chain: false,
      closes_domain_ready: false,
      closes_production_ready: false,
    },
  };
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
    domain_owner_receipt_refs: domainOwnerReceiptRefs,
    typed_blocker_refs: [...RCA_PRODUCTION_EVIDENCE_TYPED_BLOCKER_REFS],
    owner_chain_refs: ownerChainRefs,
    no_regression_evidence_refs: noRegressionEvidenceRefs,
    domain_receipt_refs: domainOwnerReceiptRefs,
    no_regression_refs: noRegressionEvidenceRefs,
    required_return_shapes: [...RCA_OWNER_PAYLOAD_REQUIRED_RETURN_SHAPES],
    payload_path_policy: RCA_OWNER_PAYLOAD_PATH_POLICY,
    accepted_payload_paths: acceptedPayloadPaths,
    owner_payload_item_summary: buildOwnerPayloadItemSummaries({
      domainOwnerReceiptRefs,
      noRegressionEvidenceRefs,
      ownerChainRefs,
      typedBlockerRefs: [...RCA_PRODUCTION_EVIDENCE_TYPED_BLOCKER_REFS],
    }),
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
      evidence_refs: noRegressionEvidenceRefs,
      real_runtime_evidence_refs: [...RCA_REAL_NO_REGRESSION_EVIDENCE_REFS],
      real_runtime_evidence_ref_count: RCA_REAL_NO_REGRESSION_EVIDENCE_REFS.length,
      real_runtime_evidence_provenance: [...RCA_REAL_NO_REGRESSION_EVIDENCE_PROVENANCE],
      opl_external_evidence_receipt_ref: RCA_OPL_EXTERNAL_NO_REGRESSION_RECEIPT_REF,
      deliverable_family_refs: [
        'ppt_deck',
        'xiaohongshu',
      ],
      evidence_cadence: RCA_REAL_NO_REGRESSION_EVIDENCE_CADENCE,
      required_minimum_evidence_ref_count: 6,
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
      tombstone_refs: [
        'human_doc:retired_route_narratives_tombstone',
      ],
      retained_provenance_refs: [
        'contracts/runtime-program/managed-product-entry-hardening.json',
        'human_doc:retired_managed_product_entry_contract_tombstone',
      ],
      forbidden_active_occurrence_classes: [
        'compatibility_alias',
        'default_runtime_owner',
        'public_action_key',
        'domain_action_adapter_template',
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
