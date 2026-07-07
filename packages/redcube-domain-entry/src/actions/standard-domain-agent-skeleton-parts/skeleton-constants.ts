// @ts-nocheck
export const DOMAIN_ID = 'redcube_ai';
export const DOMAIN_OWNER = 'redcube_ai';
export const SKELETON_ID = 'rca.standard_domain_agent_skeleton.v1';
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

export const REPO_SOURCE_BOUNDARIES = [
  {
    boundary_id: 'agent',
    role: 'domain app skill, command metadata, stage descriptors, prompt and skill refs',
    repo_refs: [
      'packages/redcube-domain-entry/src/actions/family-action-catalog.ts',
      'packages/redcube-domain-entry/src/actions/family-stage-control-plane.ts',
      'prompts/ppt_deck',
      'prompts/xiaohongshu',
    ],
  },
  {
    boundary_id: 'contracts',
    role: 'machine-readable runtime, OPL adoption, service-safe entry, and helper contracts',
    repo_refs: [
      'contracts/runtime-program/current-program.index.json',
      'contracts/runtime-program/current-program-parts/',
      'contracts/runtime-program/opl-family-contract-adoption.json',
      'contracts/runtime-program/service-safe-domain-entry-adapter.json',
      'contracts/runtime-program/python-native-helper-catalog.json',
    ],
  },
  {
    boundary_id: 'runtime',
    role: 'thin declarations for domain_action_adapter, projection builder, lifecycle adapter, and route/runtime facades',
    repo_refs: [
      'packages/redcube-domain-entry/src/actions/domain-action-adapter.ts',
      'packages/redcube-domain-entry/src/actions/product-entry-continuity-surfaces.ts',
      'packages/redcube-domain-entry/src/actions/get-product-entry-manifest.ts',
      'packages/redcube-domain-entry/src/actions/opl-stage-execution-plan.ts',
    ],
  },
  {
    boundary_id: 'docs',
    role: 'human-readable owner boundary, lifecycle, and operator guidance',
    repo_refs: [
      'human_doc:rca_project',
      'human_doc:rca_architecture',
      'human_doc:rca_current_status',
      'human_doc:rca_decisions',
    ],
  },
];

export function ref(path, role, label) {
  return {
    ref_kind: 'json_pointer',
    ref: path,
    role,
    label,
  };
}
