// @ts-nocheck
import {
  CONTROLLED_MEMORY_APPLY_PROOF_STATE,
  buildControlledMemoryApplyProofRef,
} from './memory-apply-proof.js';
import {
  DOMAIN_ID,
  DOMAIN_MEMORY_ADOPTION_STATE,
  DOMAIN_MEMORY_PROOF_CONTRACT_STATE,
  DOMAIN_MEMORY_RUNTIME_WRITEBACK_STATE,
  DOMAIN_OWNER,
} from './skeleton-constants.js';

export function buildArtifactLocatorContract({ workspaceRoot, runtimeStateRoot, sessionContinuityRoot }) {
  return {
    surface_kind: 'artifact_locator_contract',
    contract_id: 'rca.workspace_runtime_artifact_locator.v1',
    domain_id: DOMAIN_ID,
    owner: DOMAIN_OWNER,
    locator_model: 'workspace_runtime_artifact_root_refs_only',
    workspace_runtime_artifact_root: {
      ref_kind: 'runtime_path',
      root_id: 'workspace_runtime_artifact_root',
      workspace_root: workspaceRoot || null,
      runtime_state_root: runtimeStateRoot || null,
      session_continuity_root: sessionContinuityRoot || null,
      path_template: '<workspace-root>/.redcube/runtime/artifacts/<topic_id>/<deliverable_id>/<run_id>',
    },
    artifact_ref_schema: {
      required_fields: [
        'artifact_kind',
        'ref_kind',
        'artifact_ref',
        'topic_id',
        'deliverable_id',
        'run_id',
        'sha256',
      ],
      allowed_artifact_kinds: [
        'png_page',
        'pptx_export',
        'pdf_export',
        'prompt_manifest',
        'style_manifest',
        'review_capture',
        'export_bundle',
      ],
      allowed_ref_kinds: [
        'workspace_runtime_artifact',
        'product_entry_session_ref',
        'stage_run_artifact_ref',
      ],
    },
    repo_source_boundary: {
      repo_tracks_descriptors_and_contracts: true,
      repo_tracks_visual_or_export_artifact_blobs: false,
      forbidden_repo_artifact_roots: [
        'artifacts/',
        'runtime-state/',
        '.runtime-program/',
        '.redcube/runtime/artifacts/',
      ],
    },
    opl_consumption_policy: {
      allowed: [
        'read_artifact_descriptor',
        'read_artifact_ref',
        'read_hash_and_locator',
        'pickup_via_redcube_session_surface',
      ],
      forbidden: [
        'store_png_pptx_pdf_blob',
        'declare_visual_export_verdict',
        'rewrite_canonical_artifact',
        'mutate_review_state',
      ],
    },
  };
}

export function buildControlledVisualStageAttemptFixture() {
  const sharedRefs = {
    descriptor_refs: [
      '/family_stage_control_plane/stages',
      '/artifact_locator_contract',
      '/domain_memory_descriptor_locator',
      '/domain_memory_descriptor',
      '/domain_action_adapter_receipt_refs',
    ],
    consumed_memory_refs: [
      'rca-memory:visual-pattern:<memory-id>',
    ],
    quality_refs: [
      '/review_state',
      '/publication_projection',
      '/ppt_deck_visual_route_truth',
    ],
    domain_action_adapter_refs: [
      '/product_entry_shell/domain_handler',
      '/domain_action_adapter_receipt_refs',
    ],
  };
  return {
    surface_kind: 'controlled_visual_stage_attempt_fixture',
    status: DOMAIN_MEMORY_ADOPTION_STATE,
    fixture_id: 'rca.controlled_visual_stage_attempt.fixture.v1',
    domain_id: DOMAIN_ID,
    proof_model: 'consumed_memory_writeback_receipt_descriptor_domain_action_adapter_quality_ref_equivalence_only',
    proof_contract_state: DOMAIN_MEMORY_PROOF_CONTRACT_STATE,
    runtime_writeback_state: DOMAIN_MEMORY_RUNTIME_WRITEBACK_STATE,
    provider_controlled_proof_id: 'rca.opl_hosted.controlled_visual_stage_attempt_memory_proof.v1',
    provider_controlled_proof_model: 'opl_hosted_attempt_consumes_memory_refs_and_returns_locator_only_receipts',
    apply_proof_state: CONTROLLED_MEMORY_APPLY_PROOF_STATE,
    controlled_memory_apply_proof_ref: buildControlledMemoryApplyProofRef(),
    covered_family: 'ppt_deck',
    stage_kinds: [
      'review_and_revision',
      'package_and_handoff',
    ],
    route_stage_refs: [
      'visual_director_review',
      'screenshot_review',
      'repair_image_pages',
      'export_pptx',
    ],
    memory_consumption_contract: {
      surface_kind: 'controlled_consumed_memory_refs',
      contract_id: 'rca.visual_pattern_memory.consumed_memory_refs.v1',
      source_descriptor_ref: '/domain_memory_descriptor',
      locator_contract_ref: '/domain_memory_descriptor_locator/memory_locator',
      required_fields: [
        'memory_ref',
        'memory_family',
        'stage_scope',
        'deliverable_family',
        'provenance_refs',
        'content_ref',
      ],
      forbidden_fields: [
        'memory_content_body',
        'slide_or_page_content',
        'visual_verdict',
        'export_verdict',
        'review_verdict',
        'canonical_artifact_blob',
      ],
      repository_boundary: {
        repo_tracks_consumed_memory_ref_fixture: true,
        repo_tracks_memory_content_body: false,
        repo_tracks_visual_or_export_artifacts: false,
      },
    },
    writeback_proof_contract: {
      surface_kind: 'controlled_memory_writeback_receipt_proof',
      status: DOMAIN_MEMORY_ADOPTION_STATE,
      contract_id: 'rca.visual_pattern_memory.writeback_receipt_proof.v1',
      proposal_ref: 'rca-memory-proposal:visual-pattern:<proposal-id>',
      receipt_ref: 'rca-memory-receipt:visual-pattern:<receipt-id>',
      memory_locator_ref: 'rca-memory:visual-pattern:<memory-id>',
      proposal_contract_ref: '/domain_memory_descriptor_locator/writeback_proposal_generator',
      accept_reject_command_ref: '/domain_memory_descriptor_locator/accept_reject_command',
      receipt_contract_ref: '/domain_memory_descriptor_locator/writeback_receipt_contract',
      operator_receipt_projection_ref: '/domain_memory_descriptor_locator/operator_receipt_projection',
      allowed_writeback_status_values: [
        'accepted',
        'rejected',
      ],
      repository_boundary: {
        repo_tracks_proof_schema_and_locator_fixture: true,
        repo_tracks_proposal_instance: false,
        repo_tracks_receipt_instance: false,
        repo_tracks_memory_entry: false,
        repo_tracks_visual_or_export_artifacts: false,
      },
    },
    attempt_descriptor: {
      attempt_id: '<attempt-id>',
      entry_session_id: '<entry-session-id>',
      topic_id: '<topic-id>',
      deliverable_id: '<deliverable-id>',
      run_id: '<run-id>',
      control_plane_owner: 'opl',
      domain_owner: DOMAIN_OWNER,
      stage_owner: DOMAIN_OWNER,
      attempt_state_owner: DOMAIN_OWNER,
    },
    direct_skill_attempt: {
      entry_surface: 'redcube-ai app skill / redcube product invoke',
      runtime_owner: 'configured_family_runtime_provider',
      convergence_ref: '/domain_entry_surface',
      consumed_memory_refs: sharedRefs.consumed_memory_refs,
      ...sharedRefs,
    },
    opl_hosted_attempt: {
      entry_surface: 'OPL Runtime Manager configured family runtime provider',
      runtime_owner: 'configured_family_runtime_provider',
      domain_action_adapter_dispatch_ref: '/product_entry_shell/domain_handler',
      convergence_ref: '/domain_entry_surface',
      consumed_memory_refs: sharedRefs.consumed_memory_refs,
      writeback_receipt_ref: 'rca-memory-receipt:visual-pattern:<receipt-id>',
      operator_receipt_projection_ref: '/domain_memory_descriptor_locator/operator_receipt_projection',
      ...sharedRefs,
    },
    equivalence_proof: {
      direct_and_opl_share_descriptor_refs: true,
      direct_and_opl_share_consumed_memory_refs: true,
      direct_and_opl_share_domain_action_adapter_refs: true,
      direct_and_opl_share_quality_refs: true,
      downstream_truth_owner: DOMAIN_OWNER,
      opl_writes_visual_truth: false,
      opl_writes_review_export_verdict: false,
      opl_writes_artifact_blob: false,
      opl_writes_memory_content: false,
      opl_writes_receipt_instance: false,
    },
    projection_only_result: {
      status: DOMAIN_MEMORY_ADOPTION_STATE,
      runtime_writeback_state: DOMAIN_MEMORY_RUNTIME_WRITEBACK_STATE,
      descriptor_refs: sharedRefs.descriptor_refs,
      consumed_memory_refs: sharedRefs.consumed_memory_refs,
      writeback_refs: {
        proposal_ref: 'rca-memory-proposal:visual-pattern:<proposal-id>',
        receipt_ref: 'rca-memory-receipt:visual-pattern:<receipt-id>',
        memory_locator_ref: 'rca-memory:visual-pattern:<memory-id>',
        operator_receipt_projection_ref: '/domain_memory_descriptor_locator/operator_receipt_projection',
      },
      artifact_refs: [
        {
          artifact_kind: 'png_page',
          ref_kind: 'workspace_runtime_artifact',
          artifact_ref: '<workspace-runtime-artifact-root>/topic/deliverable/run/slide01.png',
          sha256: '<sha256>',
        },
      ],
      review_publication_refs: [
        '/review_state',
        '/publication_projection',
      ],
      visual_export_verdict: null,
      memory_content_body: null,
      receipt_instance: null,
    },
    opl_policy_proof: {
      opl_consumes_descriptor_refs: true,
      opl_consumes_memory_refs: true,
      opl_consumes_writeback_receipt_refs: true,
      opl_consumes_artifact_refs: true,
      opl_consumes_quality_refs: true,
      opl_holds_visual_verdict: false,
      opl_holds_export_verdict: false,
      opl_holds_canonical_artifact_content: false,
      opl_holds_memory_content: false,
      opl_holds_receipt_instance: false,
    },
  };
}

export function buildDomainActionAdapterReceiptRefs() {
  return {
    surface_kind: 'domain_action_adapter_receipt_refs',
    receipt_contract_id: 'rca.domain_action_adapter.receipt_refs.v1',
    owner: DOMAIN_OWNER,
    domain_handler_target_ref: '/product_entry_shell/domain_handler',
    receipt_refs: [
      {
        receipt_kind: 'control_plane_ack',
        action: 'notification_receipt',
        ref: '/result_surface',
        allowed_payload: [
          'task_id',
          'notification_id',
          'receipt_status',
          'source_refs',
        ],
      },
      {
        receipt_kind: 'workspace_receipt_proof',
        action: 'emit_workspace_receipt_proof',
        ref: '/result_surface/receipt_refs',
        allowed_payload: [
          'domain_owner_receipt_ref',
          'accepted_memory_receipt_ref',
          'rejected_memory_receipt_ref',
          'lifecycle_receipt_ref',
          'no_regression_evidence_ref',
        ],
      },
    ],
    forbidden_receipt_fields: [
      'visual_verdict',
      'visual_truth_body',
      'export_verdict',
      'review_verdict',
      'review_export_verdict_body',
      'publication_gate_verdict',
      'canonical_artifact_blob',
      'artifact_blob',
      'artifact_body',
      'memory_content_body',
      'generic_runtime_state',
      'managed_runtime_compatibility_alias',
    ],
    authority_boundary: {
      receipt_owner: DOMAIN_OWNER,
      opl_role: 'receipt_ref_consumer',
      opl_can_acknowledge_control_plane_delivery: true,
      opl_can_hold_visual_or_export_verdict: false,
      opl_can_hold_canonical_artifact_content: false,
    },
  };
}

export function buildControlledSoakNoRegressionAttempt() {
  return {
    surface_kind: 'controlled_soak_no_regression_attempt',
    attempt_id: 'rca.controlled_soak.no_regression_attempt.v1',
    target_domain_id: DOMAIN_ID,
    state: 'deferred_typed_blocker',
    controlled_soak_apply_contract_open: true,
    deferred_blocker: {
      blocker_kind: 'domain_owner_receipt_required',
      blocker_id: 'rca_controlled_soak_domain_receipt_required',
      source_contract: 'rca.temporal_controlled_visual_stage_long_soak.v1',
      required_return_shapes: [
        'controlled_visual_stage_long_soak_evidence',
        'domain_owner_receipt_ref',
        'typed_blocker',
        'no_regression_evidence_ref',
      ],
      generator_action: 'emit_temporal_controlled_visual_stage_long_soak_evidence',
      required_owner: DOMAIN_ID,
      domain_owner: DOMAIN_ID,
    },
    no_regression_surface_refs: [
      '/controlled_visual_stage_attempt',
      '/controlled_memory_apply_proof',
      '/artifact_locator_contract',
      '/runtime_residue_retirement',
    ],
    authority_boundary: {
      opl_role: 'controlled_soak_attempt_router_only',
      domain_truth_owner: DOMAIN_ID,
      can_hold_visual_truth: false,
      can_hold_review_export_verdict: false,
      can_write_canonical_artifacts: false,
    },
    repository_boundary: {
      repo_tracks_visual_or_export_artifacts: false,
      repo_tracks_receipt_instance: false,
      repo_tracks_no_regression_projection: true,
    },
  };
}
