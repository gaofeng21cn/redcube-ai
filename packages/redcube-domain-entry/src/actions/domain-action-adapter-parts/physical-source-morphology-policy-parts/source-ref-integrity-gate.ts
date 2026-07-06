// @ts-nocheck

import {
  POLICY_SOURCE_STRUCTURE,
} from '../physical-source-morphology-policy-constants.js';

export function sourceRefIntegrityGate(activeSurfaceClassifications) {
  const policySourceStructureRefs = [
    POLICY_SOURCE_STRUCTURE.builder_ref,
    ...POLICY_SOURCE_STRUCTURE.extracted_gate_refs,
  ];
  const checkedSourceRefs = [...new Set([
    ...activeSurfaceClassifications.flatMap((entry) => entry.source_refs ?? []),
    ...policySourceStructureRefs,
  ])]
    .sort();
  const checkedMachineBoundaryRefs = [
    ...new Set(activeSurfaceClassifications.flatMap((entry) => entry.machine_boundary_refs ?? [])),
  ].sort();
  return {
    policy_kind: 'active_surface_source_refs_must_resolve_before_classification_is_trusted',
    state: 'repo_local_source_refs_declared_no_second_truth',
    applies_to: [
      'active_surface_classifications[*].source_refs',
      'active_surface_classifications[*].machine_boundary_refs',
      'policy_source_structure.builder_ref',
      'policy_source_structure.extracted_gate_refs',
      'legacy_name_policy.current_role_guard_policy',
      'legacy_name_policy.forbidden_payload_role_policy',
    ],
    checked_source_ref_count: checkedSourceRefs.length,
    checked_machine_boundary_ref_count: checkedMachineBoundaryRefs.length,
    checked_source_refs: checkedSourceRefs,
    checked_machine_boundary_refs: checkedMachineBoundaryRefs,
    accepted_ref_shapes: [
      'repo_path',
      'repo_directory',
      'repo_path_anchor',
    ],
    anchor_separator: '#',
    repo_local_refs_only: true,
    absolute_path_allowed: false,
    parent_directory_traversal_allowed: false,
    uri_ref_allowed: false,
    human_doc_ref_allowed_as_machine_source_ref: false,
    retired_compatibility_source_refs_allowed_only_as_tombstone_or_negative_guard: true,
    machine_boundary_refs_require_anchor: true,
    stale_source_ref_reopens_gap: true,
    missing_source_ref_allowed: false,
    missing_machine_boundary_anchor_allowed: false,
    generic_owner_classification_from_unresolved_ref_allowed: false,
    source_ref_integrity_can_claim_visual_ready: false,
    source_ref_integrity_can_claim_exportable: false,
    source_ref_integrity_can_claim_handoffable: false,
    production_readiness_claim_allowed: false,
    authority_boundary: {
      gate_can_create_missing_refs: false,
      gate_can_create_alias_files: false,
      gate_can_authorize_physical_delete: false,
      gate_can_claim_default_caller_cutover: false,
      gate_can_claim_app_or_live_readiness: false,
      gate_can_claim_visual_or_export_readiness: false,
      gate_can_claim_handoffable: false,
      gate_can_claim_domain_ready: false,
      gate_can_claim_production_ready: false,
    },
  };
}
