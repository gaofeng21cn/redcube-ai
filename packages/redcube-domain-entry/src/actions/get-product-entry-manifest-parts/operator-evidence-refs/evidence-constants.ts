// @ts-nocheck

export const RCA_EFFICIENCY_WORK_ORDER_ID = 'oma_developer_patch_work_order_5a1b68cacbd4';

export const RCA_EFFICIENCY_TARGET_VERIFICATION_REFS = Object.freeze([
  'target_runtime_consumption_verification_receipt',
  'target_workspace_environment_consumption_receipt',
  'workspace-runtime-ref:review-export:<run-id>',
  'workspace-runtime-ref:export-result:<run-id>',
  'target-verification:redcube-ai/product-manifest-read',
  'target-verification:redcube-ai/domain-handler-export-read',
  'target-verification:redcube-ai/typecheck',
  'target-verification:redcube-ai/test-fast',
  'target-verification:redcube-ai/targeted-efficiency-tests',
]);

export const RCA_EFFICIENCY_PATCH_TRACEABILITY_MATRIX = Object.freeze([
  Object.freeze({
    proposed_change_ref: 'target_agent_owner_receipt_contract_ref:target_agent/live-acceptance',
    target_surface: 'target_agent_owner_receipt_contract_ref',
    target_repo_refs: [
      'contracts/owner_receipt_contract.json',
      'opl_generated:product_entry_manifest#/domain_owner_receipt_contract',
    ],
    verifies_ref: 'target-owner-receipt-or-typed-blocker:redcube_ai/oma_developer_patch_work_order_5a1b68cacbd4',
    refs_only: true,
    writes_target_domain_truth: false,
    writes_memory_body: false,
    writes_artifact_body: false,
    authorizes_quality_or_export: false,
  }),
  Object.freeze({
    proposed_change_ref: 'target_agent_owner_route_ref:target_agent/owner-receipt-projection',
    target_surface: 'target_agent_owner_route_ref',
    target_repo_refs: [
      'opl_generated:product_entry_manifest#/owner_route',
      'redcube domain-handler export#/source_manifest_refs/rca_efficiency_handoff_projection_ref',
    ],
    verifies_ref: 'target-runtime-read-model-consumption:redcube_ai/oma_developer_patch_work_order_5a1b68cacbd4/source-patch',
    refs_only: true,
    writes_target_domain_truth: false,
    writes_memory_body: false,
    writes_artifact_body: false,
    authorizes_quality_or_export: false,
  }),
  Object.freeze({
    proposed_change_ref: 'target_agent_production_acceptance_contract_ref:target_agent/production_acceptance',
    target_surface: 'target_agent_production_acceptance_contract_ref',
    target_repo_refs: [
      'contracts/production_acceptance/rca-production-acceptance.json',
      'contracts/production_acceptance/rca-efficiency-handoff-projection.json',
    ],
    verifies_ref: 'workspace-runtime-ref:review-export:<run-id>',
    refs_only: true,
    writes_target_domain_truth: false,
    writes_memory_body: false,
    writes_artifact_body: false,
    authorizes_quality_or_export: false,
  }),
  Object.freeze({
    proposed_change_ref: 'target_agent_quality_gate_ref:target_agent/export-owner',
    target_surface: 'target_agent_quality_gate_ref',
    target_repo_refs: [
      'agent/quality_gates/review_export_memory.md',
      'agent/quality_gates/artifact_authority.md',
      'prompts/ppt_deck/repair_image_pages.md',
    ],
    verifies_ref: 'workspace-runtime-ref:export-result:<run-id>',
    refs_only: true,
    writes_target_domain_truth: false,
    writes_memory_body: false,
    writes_artifact_body: false,
    authorizes_quality_or_export: false,
  }),
  Object.freeze({
    proposed_change_ref: 'target_agent_regression_suite_ref:target_agent/owner-boundary',
    target_surface: 'target_agent_regression_suite_ref',
    target_repo_refs: [
      'tests/rca-efficiency-handoff-projection.test.ts',
      'tests/product-entry-cases/evidence-scaleout-surfaces.test.ts',
    ],
    verifies_ref: 'target-verification:redcube-ai/targeted-efficiency-tests',
    refs_only: true,
    writes_target_domain_truth: false,
    writes_memory_body: false,
    writes_artifact_body: false,
    authorizes_quality_or_export: false,
  }),
]);

export const RCA_PRODUCTION_EVIDENCE_TYPED_BLOCKER_REFS = Object.freeze([
  'rca-typed-blocker:controlled-soak:temporal-long-soak-pending',
  'rca-typed-blocker:memory-lifecycle:real-receipt-instances-pending',
  'rca-typed-blocker:no-regression:cross-family-production-scaleout-pending',
]);

export const RCA_REAL_NO_REGRESSION_EVIDENCE_REFS = Object.freeze([
  'rca-no-regression:visual-stage:2026-05-27-opl-family-cross-family-repeat-a',
  'rca-no-regression:visual-stage:2026-05-27-opl-family-cross-family-repeat-b',
  'rca-no-regression:visual-stage:2026-05-28-opl-family-ppt-deck-window2',
  'rca-no-regression:visual-stage:2026-05-28-opl-family-xiaohongshu-window2',
  'rca-no-regression:visual-stage:2026-05-30-opl-family-native-repeat',
  'rca-no-regression:visual-stage:2026-05-30-opl-family-xiaohongshu-repeat',
  'rca-no-regression:visual-stage:2026-05-31-opl-family-native-repair-to-export-repeat',
]);

export const RCA_REAL_NO_REGRESSION_EVIDENCE_CADENCE = 'cross_route_cross_window_repeated_refs_only';
export const RCA_OPL_EXTERNAL_NO_REGRESSION_RECEIPT_REF =
  'opl://external-evidence/redcube_ai/rca-cross-family-repeated-no-regression-20260530-6-refs';

export const RCA_REAL_NO_REGRESSION_EVIDENCE_PROVENANCE = Object.freeze([
  Object.freeze({
    evidence_ref: 'rca-no-regression:visual-stage:2026-05-27-opl-family-cross-family-repeat-a',
    workspace_ref: 'user-runtime-state:redcube-ai/evidence-scaleout/20260527-rca-no-regression-evidence/workspace-a',
    sha256: '411f05e8b9cd07f8e6789c23dbeae050d9d0f20666d5a78a1370ccba8886e8dd',
  }),
  Object.freeze({
    evidence_ref: 'rca-no-regression:visual-stage:2026-05-27-opl-family-cross-family-repeat-b',
    workspace_ref: 'user-runtime-state:redcube-ai/evidence-scaleout/20260527-rca-no-regression-evidence/workspace-b',
    sha256: '668ef07b2adff4aee95dda660915eb2b85347fc689c6cdfd0b437ef7b864595a',
  }),
  Object.freeze({
    evidence_ref: 'rca-no-regression:visual-stage:2026-05-28-opl-family-ppt-deck-window2',
    workspace_ref: 'user-runtime-state:redcube-ai/evidence-scaleout/20260528-rca-no-regression-evidence/workspace-ppt-window2',
    sha256: 'e0e965fa14c15c9b6d6b076d4ed1d45b9872fb82dafcdfb8b415426ca4c08acd',
  }),
  Object.freeze({
    evidence_ref: 'rca-no-regression:visual-stage:2026-05-28-opl-family-xiaohongshu-window2',
    workspace_ref: 'user-runtime-state:redcube-ai/evidence-scaleout/20260528-rca-no-regression-evidence/workspace-xhs-window2',
    sha256: 'd476325dfa59bf8f6443a46882630be60001f6b0197f91d71ecf58e3a65d4744',
  }),
  Object.freeze({
    evidence_ref: 'rca-no-regression:visual-stage:2026-05-30-opl-family-native-repeat',
    workspace_ref: 'user-runtime-state:redcube-ai/evidence-scaleout/20260530-rca-no-regression-evidence/workspace-native-repeat',
    sha256: '59a03cd84db896dd0511d0dce5f9069e82faf00875f94b2698a064f708b232f3',
  }),
  Object.freeze({
    evidence_ref: 'rca-no-regression:visual-stage:2026-05-30-opl-family-xiaohongshu-repeat',
    workspace_ref: 'user-runtime-state:redcube-ai/evidence-scaleout/20260530-rca-no-regression-evidence/workspace-xhs-repeat',
    sha256: '7a3e68a06ef30ccab5620b9013815831d7f2de6bfca3ee716120f45036f1f7f4',
  }),
  Object.freeze({
    evidence_ref: 'rca-no-regression:visual-stage:2026-05-31-opl-family-native-repair-to-export-repeat',
    workspace_ref: 'user-runtime-state:redcube-ai/rca-native-live-20260531-tranche1/workspace',
    sha256: '7f05bc52871961dff4fbce1acee32b276ccbc51f376a8fa6e31caa845ccd38cc',
  }),
]);

export const RCA_PRODUCTION_EVIDENCE_TAIL_WORKORDER_ID = 'rca.production_evidence_tail_workorder.v1';

export const RCA_OPERATOR_EVIDENCE_READINESS_PROJECTION_REF =
  '/operator_evidence_readiness_projection';
export const RCA_PRODUCTION_EVIDENCE_SCALEOUT_REFS_REF =
  `${RCA_OPERATOR_EVIDENCE_READINESS_PROJECTION_REF}/production_evidence_scaleout_refs`;
export const RCA_OPL_EXPECTED_RECEIPT_MONITOR_FRESHNESS_HANDOFF_REF =
  `${RCA_OPERATOR_EVIDENCE_READINESS_PROJECTION_REF}/opl_expected_receipt_monitor_freshness_handoff`;
export const RCA_PRODUCTION_EVIDENCE_TAIL_WORKORDER_REF =
  `${RCA_OPERATOR_EVIDENCE_READINESS_PROJECTION_REF}/production_evidence_tail_workorder`;
export const RCA_EFFICIENCY_HANDOFF_PROJECTION_REF = '/rca_efficiency_handoff_projection';
export const RCA_EFFICIENCY_HANDOFF_PROJECTION_NESTED_REF =
  `${RCA_OPERATOR_EVIDENCE_READINESS_PROJECTION_REF}/rca_efficiency_handoff_projection`;
export const RCA_GOAL_WORKFLOW_AGENT_LAB_SUITE_REF = '/goal_workflow_agent_lab_suite';
export const RCA_GOAL_WORKFLOW_AGENT_LAB_SUITE_PROJECTION_REF =
  `${RCA_OPERATOR_EVIDENCE_READINESS_PROJECTION_REF}/goal_workflow_agent_lab_suite`;
export const RCA_PPT_THREE_ROUTE_AGENT_LAB_SUITE_REF = '/ppt_three_route_agent_lab_suite';
export const RCA_PPT_THREE_ROUTE_AGENT_LAB_SUITE_PROJECTION_REF =
  `${RCA_OPERATOR_EVIDENCE_READINESS_PROJECTION_REF}/ppt_three_route_agent_lab_suite`;

export function buildOperatorEvidenceTailWorkorderItemRef(index) {
  return `${RCA_PRODUCTION_EVIDENCE_TAIL_WORKORDER_REF}/work_items/${index}`;
}

export const RCA_OWNER_PAYLOAD_REQUIRED_RETURN_SHAPES = Object.freeze([
  'domain_owner_receipt_ref',
  'no_regression_evidence_ref',
  'owner_chain_ref',
  'typed_blocker_ref',
]);

export const RCA_OWNER_PAYLOAD_PATH_POLICY =
  'operator_must_choose_success_refs_path_or_domain_owned_typed_blocker_path_empty_template_blocks';

export function uniqueRefs(values) {
  return [...new Set(values.filter((value) => typeof value === 'string' && value.trim().length > 0))];
}
