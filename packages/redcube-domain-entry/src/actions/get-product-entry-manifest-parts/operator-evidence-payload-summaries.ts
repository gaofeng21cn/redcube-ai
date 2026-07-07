// @ts-nocheck

import { buildOperatorEvidenceTailWorkorderItemRef } from './operator-evidence-refs/evidence-constants.js';

const RCA_OWNER_PAYLOAD_PATH_POLICY =
  'operator_must_choose_success_refs_path_or_domain_owned_typed_blocker_path_empty_template_blocks';

const RCA_OWNER_PAYLOAD_REQUIRED_RETURN_SHAPES = Object.freeze([
  'domain_owner_receipt_ref',
  'no_regression_evidence_ref',
  'owner_chain_ref',
  'typed_blocker_ref',
]);

const RCA_OWNER_PAYLOAD_ITEM_DEFINITIONS = Object.freeze([
  Object.freeze({
    item_id: 'owner_chain_apply',
    sequence: 1,
    remaining_gap_id: 'owner_chain_apply_to_real_opl_attempt',
    workorder_item_ref: buildOperatorEvidenceTailWorkorderItemRef(0),
    typed_blocker_ref_index: 0,
  }),
  Object.freeze({
    item_id: 'memory_lifecycle_receipt_scaleout',
    sequence: 2,
    remaining_gap_id: 'real_memory_lifecycle_receipt_instances',
    workorder_item_ref: buildOperatorEvidenceTailWorkorderItemRef(1),
    typed_blocker_ref_index: 1,
  }),
  Object.freeze({
    item_id: 'temporal_controlled_visual_stage_long_soak',
    sequence: 3,
    remaining_gap_id: 'opl_hosted_controlled_visual_stage_long_soak',
    workorder_item_ref: buildOperatorEvidenceTailWorkorderItemRef(2),
    typed_blocker_ref_index: 0,
  }),
  Object.freeze({
    item_id: 'cross_family_repeated_no_regression',
    sequence: 4,
    remaining_gap_id: 'cross_family_repeated_no_regression_evidence',
    workorder_item_ref: buildOperatorEvidenceTailWorkorderItemRef(3),
    typed_blocker_ref_index: 2,
  }),
]);

const RCA_STAGE_EXPECTED_RECEIPT_STAGE_IDS = Object.freeze([
  'source_intake',
  'communication_strategy',
  'visual_direction',
  'artifact_creation',
  'review_and_revision',
  'package_and_handoff',
]);

const RCA_STAGE_REPLAY_HUMAN_GATE_MISSING_REF = 'human_gate:redcube_operator_review_gate';

const RCA_STAGE_REPLAY_HUMAN_GATE_STAGE_IDS = Object.freeze([
  'communication_strategy',
  'visual_direction',
  'artifact_creation',
  'review_and_revision',
]);

const RCA_STAGE_EXPECTED_RECEIPT_RUNTIME_EVENT_REFS = Object.freeze({
  source_intake: Object.freeze(['runtime_event:rca.source_intake.source_truth_frozen']),
  communication_strategy: Object.freeze(['runtime_event:rca.communication_strategy.accepted']),
  visual_direction: Object.freeze(['runtime_event:rca.visual_direction.accepted']),
  artifact_creation: Object.freeze(['runtime_event:rca.artifact_creation.candidate_rendered']),
  review_and_revision: Object.freeze(['runtime_event:rca.review_and_revision.gate_recorded']),
  package_and_handoff: Object.freeze(['runtime_event:rca.package_and_handoff.export_handoff_recorded']),
});

function uniqueRefs(values) {
  return [...new Set(values.filter((value) => typeof value === 'string' && value.trim().length > 0))];
}

function ownerPayloadClaimBoundary() {
  return {
    success_claimed: false,
    payload_body_allowed: false,
    closes_owner_chain: false,
    closes_production_ready: false,
    visual_readiness_claimed: false,
    export_readiness_claimed: false,
    domain_readiness_claimed: false,
    production_soak_complete_claimed: false,
  };
}

function ownerPayloadAuthorityBoundary() {
  return {
    can_write_domain_truth: false,
    can_write_owner_receipt: false,
    can_create_owner_receipt: false,
    can_generate_typed_blocker: false,
    can_authorize_quality_or_export: false,
    refs_only: true,
  };
}

function ownerPayloadTemplate(keys) {
  return Object.fromEntries(keys.map((key) => [key, []]));
}

function stageReplayHumanGateTypedBlockerRef(stageId) {
  return `rca-typed-blocker:stage-replay-human-gate:${stageId}:redcube_operator_review_gate/operator-review-receipt-pending`;
}

function stageReplayHumanGateTargetIdentity(stageId) {
  return {
    domain_id: 'redcube_ai',
    stage_id: stageId,
    missing_ref: RCA_STAGE_REPLAY_HUMAN_GATE_MISSING_REF,
    target_key: `redcube_ai/${stageId}/${RCA_STAGE_REPLAY_HUMAN_GATE_MISSING_REF}`,
  };
}

function refsByPrefix(refs, prefixes) {
  return uniqueRefs(refs.filter((ref) => prefixes.some((prefix) => ref.startsWith(prefix))));
}

function successRefsForOwnerPayloadItem({
  itemId,
  domainOwnerReceiptRefs,
  noRegressionEvidenceRefs,
  ownerChainRefs,
}) {
  if (itemId === 'owner_chain_apply') {
    return {
      domain_owner_receipt_refs: domainOwnerReceiptRefs,
      no_regression_evidence_refs: noRegressionEvidenceRefs,
      owner_chain_refs: ownerChainRefs,
    };
  }
  if (itemId === 'memory_lifecycle_receipt_scaleout') {
    return {
      domain_owner_receipt_refs: [],
      no_regression_evidence_refs: [],
      owner_chain_refs: refsByPrefix(ownerChainRefs, [
        'rca-memory-receipt:',
        'rca-lifecycle-receipt:',
      ]),
    };
  }
  if (itemId === 'temporal_controlled_visual_stage_long_soak') {
    return {
      domain_owner_receipt_refs: domainOwnerReceiptRefs,
      no_regression_evidence_refs: [],
      owner_chain_refs: refsByPrefix(ownerChainRefs, [
        'rca-long-soak:visual-stage:',
        'workspace-runtime-ref:temporal-controlled-visual-stage-long-soak:',
        'workspace-runtime-ref:review-export:',
        'workspace-runtime-ref:temporal-stage-attempt:',
        'workspace-runtime-ref:retry-dead-letter:',
        'workspace-runtime-ref:requery-resume:',
      ]),
    };
  }
  if (itemId === 'cross_family_repeated_no_regression') {
    return {
      domain_owner_receipt_refs: [],
      no_regression_evidence_refs: noRegressionEvidenceRefs,
      owner_chain_refs: ownerChainRefs.filter((ref) => ref.includes('workspace_receipt_inventory_projection')),
    };
  }
  return {
    domain_owner_receipt_refs: [],
    no_regression_evidence_refs: [],
    owner_chain_refs: [],
  };
}

export function buildOwnerPayloadItemSummaries({
  domainOwnerReceiptRefs,
  noRegressionEvidenceRefs,
  ownerChainRefs,
  typedBlockerRefs,
}) {
  const requiredOperatorPayloadRefs = [
    'domain_owner_receipt_refs',
    'no_regression_evidence_refs',
    'owner_chain_refs',
    'typed_blocker_refs',
  ];
  return {
    surface_kind: 'rca_owner_payload_item_summary',
    owner: 'redcube_ai',
    consumer: 'one_person_lab',
    status: 'per_work_item_owner_payload_refs_ready',
    payload_kind: 'domain_owner_receipt_or_typed_blocker_refs',
    payload_path_policy: RCA_OWNER_PAYLOAD_PATH_POLICY,
    payload_body_allowed: false,
    empty_payload_template_is_success_evidence: false,
    required_operator_payload_refs: requiredOperatorPayloadRefs,
    required_return_shapes: [...RCA_OWNER_PAYLOAD_REQUIRED_RETURN_SHAPES],
    accepted_payload_paths_ref: '/operator_evidence_readiness_projection/production_evidence_scaleout_refs/accepted_payload_paths',
    work_items: RCA_OWNER_PAYLOAD_ITEM_DEFINITIONS.map((item) => {
      const successRefs = successRefsForOwnerPayloadItem({
        itemId: item.item_id,
        domainOwnerReceiptRefs,
        noRegressionEvidenceRefs,
        ownerChainRefs,
      });
      return {
        item_id: item.item_id,
        sequence: item.sequence,
        remaining_gap_id: item.remaining_gap_id,
        workorder_item_ref: item.workorder_item_ref,
        payload_kind: 'domain_owner_receipt_or_typed_blocker_refs',
        current_payload_template: ownerPayloadTemplate(requiredOperatorPayloadRefs),
        success_refs_path_payload: successRefs,
        typed_blocker_path_payload: {
          typed_blocker_refs: [typedBlockerRefs[item.typed_blocker_ref_index]].filter(Boolean),
        },
        operator_payload_submitted: false,
        recommended_current_payload_path: 'typed_blocker_path',
        success_refs_visible_is_completion: false,
        ...ownerPayloadClaimBoundary(),
        authority_boundary: ownerPayloadAuthorityBoundary(),
      };
    }),
  };
}

export function buildStageExpectedReceiptPayloadSummary({
  familyStageControlPlane,
  productionEvidenceScaleoutRefs,
  workspaceReceiptInventoryProjection,
}) {
  const requiredOperatorPayloadRefs = [
    'domain_receipt_refs',
    'monitor_freshness_refs',
    'runtime_event_refs',
    'typed_blocker_refs',
  ];
  const typedBlockerRefs = productionEvidenceScaleoutRefs.typed_blocker_refs || [];
  const stageRuntimeEventRefs = new Map(
    (Array.isArray(familyStageControlPlane?.stages) ? familyStageControlPlane.stages : [])
      .map((stage) => [
        stage.stage_id,
        uniqueRefs(stage.stage_contract?.runtime_event_refs || stage.runtime_event_refs || []),
      ]),
  );
  const stagePayloadTemplate = ownerPayloadTemplate(requiredOperatorPayloadRefs);
  const stageIds = [...RCA_STAGE_EXPECTED_RECEIPT_STAGE_IDS];
  return {
    surface_kind: 'rca_stage_expected_receipt_payload_summary',
    owner: 'redcube_ai',
    consumer: 'one_person_lab',
    status: 'per_stage_expected_receipt_payload_refs_ready',
    payload_kind: 'stage_expected_receipt_or_monitor_freshness_refs',
    payload_path_policy: RCA_OWNER_PAYLOAD_PATH_POLICY,
    payload_body_allowed: false,
    empty_payload_template_is_success_evidence: false,
    required_operator_payload_refs: requiredOperatorPayloadRefs,
    required_return_shapes: [
      'domain_receipt_ref',
      'monitor_freshness_ref',
      'runtime_event_ref',
      'typed_blocker_ref',
    ],
    accepted_payload_paths_ref: '/operator_evidence_readiness_projection/owner_payload_workorder/accepted_payload_paths',
    stage_count: stageIds.length,
    stage_ids: stageIds,
    stage_payload_template: stagePayloadTemplate,
    typed_blocker_path_payload: {
      typed_blocker_refs: typedBlockerRefs,
    },
    success_ref_models: {
      monitor_freshness_ref_model: '/workspace_receipt_inventory_projection/stage_monitor_freshness/<stage-id>',
      runtime_event_ref_model: 'opl_generated_stage_control_descriptor.stages[*].stage_contract.runtime_event_refs',
      source_runtime_event_ref: 'opl_generated:product_entry_manifest#/family_stage_control_plane/stages/<stage-id>/stage_contract/runtime_event_refs',
    },
    stages: stageIds.map((stageId, index) => ({
      stage_id: stageId,
      sequence: index + 1,
      payload_kind: 'stage_expected_receipt_or_monitor_freshness_refs',
      current_payload_template: stagePayloadTemplate,
      success_refs_path_payload: {
        domain_receipt_refs: [],
        monitor_freshness_refs: [
          `/workspace_receipt_inventory_projection/stage_monitor_freshness/${stageId}`,
        ],
        runtime_event_refs: (
          stageRuntimeEventRefs.get(stageId)?.length
            ? stageRuntimeEventRefs.get(stageId)
            : RCA_STAGE_EXPECTED_RECEIPT_RUNTIME_EVENT_REFS[stageId]
        ),
      },
      typed_blocker_path_payload: {
        typed_blocker_refs: typedBlockerRefs,
      },
      monitor_status: workspaceReceiptInventoryProjection?.status || 'unknown',
      operator_payload_submitted: false,
      recommended_current_payload_path: 'typed_blocker_path',
      success_refs_visible_is_completion: false,
      ...ownerPayloadClaimBoundary(),
      authority_boundary: ownerPayloadAuthorityBoundary(),
    })),
  };
}

export function buildStageReplayHumanGateBlockerSummary() {
  const requiredOperatorPayloadRefs = [
    'receipt_refs',
    'typed_blocker_refs',
  ];
  const stages = RCA_STAGE_REPLAY_HUMAN_GATE_STAGE_IDS.map((stageId, index) => {
    const typedBlockerRef = stageReplayHumanGateTypedBlockerRef(stageId);
    return {
      stage_id: stageId,
      sequence: index + 1,
      missing_ref: RCA_STAGE_REPLAY_HUMAN_GATE_MISSING_REF,
      missing_ref_kind: 'human_gate_ref',
      status: 'blocked_by_domain_owned_typed_blocker_ref',
      target_identity: stageReplayHumanGateTargetIdentity(stageId),
      current_payload_template: ownerPayloadTemplate(requiredOperatorPayloadRefs),
      typed_blocker_path_payload: {
        typed_blocker_refs: [typedBlockerRef],
      },
      success_refs_path_payload: {
        receipt_refs: [],
        required_receipt_ref: RCA_STAGE_REPLAY_HUMAN_GATE_MISSING_REF,
      },
      source_ref: `/operator_evidence_readiness_projection/opl_expected_receipt_monitor_freshness_handoff/stage_replay_human_gate_blocker_summary/stages/${index}/typed_blocker_path_payload/typed_blocker_refs/0`,
      record_command_ref_model:
        'opl runtime stage-replay-missing-receipt record --target-identity <target_identity_json> --payload <typed_blocker_path_payload_json>',
      verify_command_ref_model:
        'opl runtime stage-replay-missing-receipt verify --receipt-ref <ledger_receipt_ref>',
      operator_payload_submitted: false,
      success_claimed: false,
      human_gate_approval_claimed: false,
      closes_replay_receipt_ref: false,
      ...ownerPayloadClaimBoundary(),
      authority_boundary: {
        ...ownerPayloadAuthorityBoundary(),
        can_requery_human: false,
        can_write_owner_receipt: false,
        can_close_replay_receipt_ref: false,
      },
    };
  });
  return {
    surface_kind: 'rca_stage_replay_human_gate_blocker_summary',
    owner: 'redcube_ai',
    consumer: 'one_person_lab',
    status: 'domain_owned_typed_blocker_refs_ready',
    payload_kind: 'stage_replay_missing_receipt_typed_blocker_refs',
    payload_path_policy: 'success_receipt_ref_or_domain_owned_typed_blocker_ref',
    payload_body_allowed: false,
    empty_payload_template_is_success_evidence: false,
    missing_ref: RCA_STAGE_REPLAY_HUMAN_GATE_MISSING_REF,
    missing_ref_kind: 'human_gate_ref',
    stage_count: stages.length,
    stage_ids: stages.map((stage) => stage.stage_id),
    typed_blocker_refs: stages.flatMap((stage) => stage.typed_blocker_path_payload.typed_blocker_refs),
    accepted_payload_paths: {
      success_refs_path: {
        required_receipt_ref: RCA_STAGE_REPLAY_HUMAN_GATE_MISSING_REF,
        typed_blocker_refs_must_be_absent: true,
        closes_replay_receipt_ref: true,
        readiness_claim_allowed: false,
      },
      typed_blocker_path: {
        required_typed_blocker_refs: ['typed_blocker_refs'],
        success_claimed: false,
        closes_replay_receipt_ref: false,
        readiness_claim_allowed: false,
      },
    },
    stages,
    source_ref_root:
      '/operator_evidence_readiness_projection/opl_expected_receipt_monitor_freshness_handoff/stage_replay_human_gate_blocker_summary',
    authority_boundary: {
      ...ownerPayloadAuthorityBoundary(),
      can_requery_human: false,
      can_write_owner_receipt: false,
      can_close_replay_receipt_ref: false,
    },
  };
}
