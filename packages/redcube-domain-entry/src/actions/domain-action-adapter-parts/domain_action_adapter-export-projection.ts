// @ts-nocheck

export const DOMAIN_ACTION_ADAPTER_ID = 'redcube_domain_action_adapter_adapter.v1';
export const DOMAIN_ID = 'redcube_ai';

const ALLOWED_MANIFEST_KEYS = [
  'artifact_locator_refs',
  'declarative_stage_manifest_ref',
  'domain_evidence_refs',
  'family_action_catalog_ref',
  'family_stage_control_plane_ref',
  'receipt_refs',
  'typed_blocker_refs',
] as const;

function selectManifestRefs(manifest) {
  return Object.fromEntries(ALLOWED_MANIFEST_KEYS.map((key) => [key, manifest[key]]));
}

export function buildDomainActionAdapterProjection({ workspaceRoot, manifest }) {
  return {
    ok: true,
    surface_kind: 'domain_action_adapter_export',
    adapter_id: DOMAIN_ACTION_ADAPTER_ID,
    version: 'v2',
    domain_id: DOMAIN_ID,
    workspace_locator: {
      workspace_root: workspaceRoot,
    },
    action_handler_refs: {
      family_action_catalog_ref: manifest.family_action_catalog_ref,
      handler_target_ref:
        'packages/redcube-domain-entry/src/actions/domain-handler.ts',
    },
    domain_authority_refs: {
      ai_route_policy_ref:
        'opl_generated:product_entry_manifest#/ai_route_policy',
      domain_memory_descriptor_locator_ref:
        'opl_generated:product_entry_manifest#/domain_authority_refs/domain_memory_descriptor_locator',
      controlled_visual_stage_attempt_ref:
        'opl_generated:product_entry_manifest#/domain_authority_refs/controlled_visual_stage_attempt',
      controlled_memory_apply_proof_ref:
        'opl_generated:product_entry_manifest#/domain_authority_refs/controlled_memory_apply_proof',
      controlled_soak_no_regression_attempt_ref:
        'opl_generated:product_entry_manifest#/domain_authority_refs/controlled_soak_no_regression_attempt',
      external_work_order_owner_closeout_ref:
        'opl_generated:product_entry_manifest#/domain_authority_refs/domain_owner_receipt_contract/external_work_order_owner_closeout',
      lifecycle_guarded_apply_proof_ref:
        'opl_generated:product_entry_manifest#/domain_authority_refs/lifecycle_guarded_apply_proof',
    },
    ...selectManifestRefs(manifest),
    authority_boundary: {
      domain_truth_owner: DOMAIN_ID,
      generated_handler_owner: 'one-person-lab',
      projection_scope:
        'domain_authority_action_handler_typed_blocker_receipt_and_artifact_locator_refs_only',
      rca_owns_visual_truth: true,
      rca_owns_review_export_verdict: true,
      rca_owns_owner_receipt: true,
      opl_can_write_visual_truth: false,
      opl_can_authorize_review_or_export: false,
      opl_can_create_owner_receipt: false,
      opl_can_create_typed_blocker: false,
      projection_can_claim_domain_ready: false,
      projection_can_claim_production_ready: false,
    },
  };
}
