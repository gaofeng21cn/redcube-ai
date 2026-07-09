// @ts-nocheck
import { buildRuntimeMemoryReceiptInstances } from './functional-closure.js';

const DOMAIN_OWNER = 'redcube_ai';
export const CONTROLLED_MEMORY_APPLY_PROOF_STATE = 'controlled_apply_proof_landed_memory_body_external';

export function buildControlledMemoryApplyProofRef() {
  return {
    ref_kind: 'json_pointer',
    ref: '/controlled_memory_apply_proof',
    role: 'controlled_memory_apply_proof',
    label: 'RCA controlled visual-stage memory apply proof',
  };
}

export function buildRuntimeResidueRetirementAudit({ runtime } = {}) {
  return {
    surface_kind: 'runtime_residue_retirement_audit',
    audit_id: 'rca.runtime_residue_retirement.active_path.v1',
    status: 'active_path_retired',
    default_runtime_owner: runtime?.runtime_owner || 'configured_family_runtime_provider',
    retired_default_surfaces: [
      'hermes_first_default_runtime',
      'retired_gateway_protocol_boundary_public_entry',
      'repo_local_manager_default',
    ],
    allowed_remaining_roles: [
      'explicit_proof_backend',
      'provenance',
      'history',
    ],
    active_path_policy: {
      hermes_agent_default_runtime: false,
      retired_gateway_protocol_boundary_public_entry: false,
      repo_local_manager_default: false,
      opl_hosted_provider_path_allowed: true,
      explicit_proof_backend_allowed: true,
    },
  };
}

export function buildControlledMemoryApplyProof() {
  return {
    surface_kind: 'controlled_visual_stage_domain_memory_apply_proof',
    proof_id: 'rca.visual_pattern_memory.controlled_apply_proof.v1',
    status: CONTROLLED_MEMORY_APPLY_PROOF_STATE,
    owner: DOMAIN_OWNER,
    controlled_stage_attempt_ref: '/controlled_visual_stage_attempt',
    stage_kinds: [
      'review_and_revision',
      'package_and_handoff',
    ],
    consumed_visual_pattern_memory_refs: [
      {
        memory_ref: 'rca-memory:visual-pattern:<memory-id>',
        memory_family: 'visual_pattern_memory',
        stage_scope: 'review_overlay',
        deliverable_family: 'ppt_deck',
        provenance_refs: [
          '/domain_memory_descriptor_locator',
          '/controlled_visual_stage_attempt',
        ],
        content_ref: 'rca-memory-content-ref:visual-pattern:<memory-id>',
      },
    ],
    writeback_proposal_projection: {
      proposal_ref: 'rca-memory-proposal:visual-pattern:<proposal-id>',
      proposal_contract_ref: '/domain_memory_descriptor_locator/writeback_proposal_generator',
      seed_fixture_ref: 'rca-memory-seed:visual-pattern:<seed-id>',
      source_review_ref: 'workspace-runtime-ref:review:<run-id>',
      stage_scope: 'review_overlay',
      deliverable_family: 'ppt_deck',
      candidate_memory_ref: 'rca-memory:visual-pattern:<memory-id>',
      provenance_refs: [
        '/review_state',
        '/publication_projection',
        '/artifact_locator_contract',
      ],
      recommended_decision: 'accepted_or_rejected_by_rca_only',
    },
    accept_reject_receipt_projection: {
      projection_ref: '/domain_memory_descriptor_locator/operator_receipt_projection',
      receipt_cases: [
        {
          writeback_status: 'accepted',
          receipt_ref: 'rca-memory-receipt:visual-pattern:<accepted-receipt-id>',
          memory_locator_ref: 'rca-memory:visual-pattern:<memory-id>',
          operator_receipt_projection_ref: '/domain_memory_descriptor_locator/operator_receipt_projection',
          owner: DOMAIN_OWNER,
        },
        {
          writeback_status: 'rejected',
          receipt_ref: 'rca-memory-receipt:visual-pattern:<rejected-receipt-id>',
          memory_locator_ref: 'rca-memory:visual-pattern:<memory-id>',
          operator_receipt_projection_ref: '/domain_memory_descriptor_locator/operator_receipt_projection',
          owner: DOMAIN_OWNER,
        },
      ],
    },
    runtime_receipt_instances: buildRuntimeMemoryReceiptInstances(),
    forbidden_write_audit: {
      writes_visual_truth: false,
      writes_review_verdict: false,
      writes_export_verdict: false,
      writes_artifact_blob: false,
      writes_memory_content_body_to_repo: false,
      writes_receipt_instance_to_repo: false,
    },
    repository_boundary: {
      repo_tracks_apply_proof_projection: true,
      repo_tracks_consumed_memory_refs: true,
      repo_tracks_writeback_proposal_projection: true,
      repo_tracks_accept_reject_receipt_projection: true,
      repo_tracks_memory_content_body: false,
      repo_tracks_receipt_instances: false,
      repo_tracks_visual_truth: false,
      repo_tracks_review_export_verdict: false,
      repo_tracks_artifact_blobs: false,
    },
  };
}

export function buildVisualPatternMemoryWritebackProjection({ domainAuthorityRefs }) {
  const locator = domainAuthorityRefs.domain_memory_descriptor_locator;
  const attempt = domainAuthorityRefs.controlled_visual_stage_attempt;
  return {
    surface_kind: 'visual_pattern_memory_writeback_projection',
    status: locator.status,
    proof_contract_state: attempt.proof_contract_state,
    runtime_writeback_state: attempt.runtime_writeback_state,
    apply_proof_ref: '/controlled_memory_apply_proof',
    proposal_generator: locator.writeback_proposal_generator,
    accept_reject_command: locator.accept_reject_command,
    operator_receipt_projection: locator.operator_receipt_projection,
    writeback_receipt_locator: locator.writeback_receipt_locator,
    repo_tracks_memory_entries: false,
    repo_tracks_receipt_instances: false,
    repo_tracks_visual_or_export_artifacts: false,
    opl_role: 'operator_receipt_projection_consumer_only',
  };
}
