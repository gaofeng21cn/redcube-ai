// @ts-nocheck
export const DOMAIN_ID = 'redcube_ai';
export const DOMAIN_OWNER = 'redcube_ai';
export const FAMILY_MEMORY_STAGE_APPLICABILITY = [
  'source_intake',
  'communication_strategy',
  'visual_direction',
  'artifact_creation',
  'review_and_revision',
  'package_and_handoff',
];
export const FAMILY_MEMORY_FORBIDDEN_OPL_AUTHORITY = [
  'memory_store_owner',
  'domain_truth_owner',
  'visual_route_owner',
  'accept_reject_owner',
  'quality_verdict_owner',
  'review_export_verdict_owner',
  'artifact_authority',
];
export const DOMAIN_MEMORY_ADOPTION_STATE = 'descriptor_proof_contract_landed_runtime_writeback_pending';
export const DOMAIN_MEMORY_PROOF_CONTRACT_STATE = 'landed';
export const DOMAIN_MEMORY_RUNTIME_WRITEBACK_STATE = 'pending';

export function ref(path, role, label) {
  return {
    ref_kind: 'json_pointer',
    ref: path,
    role,
    label,
  };
}
