// @ts-nocheck

const DOMAIN_OWNER = 'redcube_ai';

export function buildDomainOwnerReceiptContract() {
  return {
    surface_kind: 'owner_receipt_contract',
    contract_id: 'rca.domain_owner_receipt.v1',
    owner: DOMAIN_OWNER,
    contract_model: 'domain_receipt_typed_blocker_no_regression_refs_only',
    allowed_return_shapes: [
      'domain_receipt',
      'typed_blocker',
      'no_regression_evidence',
    ],
    required_refs: [
      'attempt_ref',
      'artifact_locator_ref',
      'memory_receipt_ref',
      'lifecycle_receipt_ref',
      'review_export_ref',
      'forbidden_write_proof_ref',
    ],
    external_work_order_owner_closeout: {
      surface_kind: 'external_work_order_owner_closeout_contract',
      action: 'emit_external_work_order_owner_closeout',
      owner: DOMAIN_OWNER,
      contract_ref: '/domain_owner_receipt_contract',
      refs_only: true,
      input_ref_model: {
        execution_receipt_ref: 'agent-lab-work-order-execution-receipt:<work-order-id>',
        absorbed_head_ref: 'git:commit:<sha>',
        target_verification_refs: ['target-verification:redcube-ai/typecheck'],
        no_forbidden_write_refs: ['no_target_domain_truth_write_proof'],
        patch_absorption_ref: 'patch-absorption:redcube_ai/<work-order-id>/source-patch',
        worktree_cleanup_ref: 'worktree-cleanup:redcube_ai/<work-order-id>/source-patch',
      },
      allowed_return_shapes: [
        'no_regression_evidence',
        'typed_blocker',
      ],
      output_ref_model: {
        no_regression_evidence_ref: 'rca-no-regression:external-work-order:<work-order-id>',
        runtime_locator_ref: 'workspace-runtime-ref:external-work-order-owner-closeout:<work-order-id>',
        typed_blocker_ref: 'rca-typed-blocker:external-work-order-owner-closeout:<blocker-id>',
      },
      authority_boundary: {
        rca_owns_closeout_evidence: true,
        opl_can_store_closeout_ref: true,
        opl_can_store_typed_blocker: true,
        opl_can_write_rca_visual_truth: false,
        opl_can_store_artifact_body: false,
        opl_can_store_memory_body: false,
        opl_can_authorize_quality_or_export: false,
      },
      repository_boundary: {
        repo_tracks_contract_refs: true,
        repo_tracks_live_closeout_instance: false,
        repo_tracks_visual_truth: false,
        repo_tracks_artifact_body: false,
        repo_tracks_memory_body: false,
        repo_tracks_quality_or_export_verdict: false,
      },
    },
    receipt_cases: [
      {
        return_shape: 'domain_receipt',
        receipt_ref: 'rca-owner-receipt:visual-stage:<receipt-id>',
        attempt_ref: '/controlled_visual_stage_attempt',
        artifact_locator_ref: '/artifact_locator_contract',
        memory_receipt_ref: 'rca-memory-receipt:visual-pattern:<accepted-receipt-id>',
        lifecycle_receipt_ref: 'rca-lifecycle-receipt:cleanup:<receipt-id>',
        review_export_ref: '/review_state',
        forbidden_write_proof_ref: '/controlled_memory_apply_proof/forbidden_write_audit',
        owner: DOMAIN_OWNER,
      },
      {
        return_shape: 'domain_receipt',
        receipt_ref: 'rca-owner-receipt:review-export:<family>:<route-stage-id>:<deliverable-id>',
        attempt_ref: 'workspace-runtime-ref:review-export:<family>:<route-stage-id>:<deliverable-id>',
        artifact_locator_ref: 'artifact-locator:redcube_ai:<family>:<route-stage-id>:<deliverable-id>',
        memory_receipt_ref: 'rca-memory-receipt:not-applicable:review-export:<family>:<route-stage-id>:<deliverable-id>',
        lifecycle_receipt_ref: 'rca-lifecycle-receipt:review-export:<family>:<route-stage-id>:<deliverable-id>',
        review_export_ref: 'rca-review-export:<family>:<route-stage-id>:<deliverable-id>',
        forbidden_write_proof_ref: 'rca-forbidden-write-proof:review-export:refs-only',
        producer_routes: [
          'visual_director_review',
          'screenshot_review',
          'repair_image_pages',
          'export_pptx',
        ],
        stage_receipt_policy: 'route_artifact_must_carry_owner_receipt_refs_or_typed_blocker_refs_before_stage_folder_current',
        owner: DOMAIN_OWNER,
      },
      {
        return_shape: 'typed_blocker',
        blocker_ref: 'rca-typed-blocker:review-export:<family>:<route-stage-id>:<deliverable-id>',
        blocker_kind: 'missing_required_artifact_or_review_export_gate_blocked',
        source_contract: 'rca.domain_owner_receipt.v1',
        review_export_ref: 'rca-review-export:<family>:<route-stage-id>:<deliverable-id>',
        producer_routes: [
          'visual_director_review',
          'screenshot_review',
          'repair_image_pages',
          'export_pptx',
        ],
        owner: DOMAIN_OWNER,
        next_required_owner_action: 'repair_or_rerun_required_route_stage',
      },
      {
        return_shape: 'controlled_visual_stage_long_soak_evidence',
        evidence_ref: 'rca-long-soak:visual-stage:<soak-id>',
        runtime_locator_ref: 'workspace-runtime-ref:temporal-controlled-visual-stage-long-soak:<soak-id>',
        generator_action: 'emit_temporal_controlled_visual_stage_long_soak_evidence',
        temporal_stage_attempt_ref: 'workspace-runtime-ref:temporal-stage-attempt:<run-id>',
        retry_dead_letter_ref: 'workspace-runtime-ref:retry-dead-letter:<run-id>',
        requery_resume_ref: 'workspace-runtime-ref:requery-resume:<run-id>',
        provider_residency_ref: 'opl-provider-residency:temporal:<proof-id>',
        stage_execution_ai_task_ref: 'opl-stage-ai-task:execution:<task-id>',
        stage_quality_ai_task_ref: 'opl-stage-ai-task:quality:<task-id>',
        domain_owner_receipt_ref: 'rca-owner-receipt:visual-stage:<receipt-id>',
        review_export_ref: 'workspace-runtime-ref:review-export:<run-id>',
        forbidden_write_proof_ref: '/controlled_memory_apply_proof/forbidden_write_audit',
        owner: DOMAIN_OWNER,
      },
      {
        return_shape: 'typed_blocker',
        blocker_ref: 'rca-typed-blocker:controlled-soak:<blocker-id>',
        blocker_kind: 'domain_owner_receipt_required',
        source_contract: 'rca.temporal_controlled_visual_stage_long_soak.v1',
        owner: DOMAIN_OWNER,
        next_required_owner_action: 'run_temporal_controlled_visual_stage_long_soak_or_emit_rca_refs_only_evidence',
      },
      {
        return_shape: 'no_regression_evidence',
        evidence_ref: 'rca-no-regression:visual-stage:<evidence-id>',
        runtime_locator_ref: 'workspace-runtime-ref:no-regression-evidence:<evidence-id>',
        generator_action: 'emit_no_regression_evidence',
        attempt_ref: '/controlled_visual_stage_attempt',
        surface_refs: [
          '/controlled_memory_apply_proof',
          '/lifecycle_guarded_apply_proof',
          '/runtime_residue_retirement',
        ],
        forbidden_write_proof_ref: '/controlled_memory_apply_proof/forbidden_write_audit',
        owner: DOMAIN_OWNER,
      },
    ],
    opl_consumption_policy: {
      opl_can_store_receipt_refs: true,
      opl_can_store_typed_blocker: true,
      opl_can_store_no_regression_evidence_ref: true,
      opl_can_store_visual_truth: false,
      opl_can_store_review_export_verdict: false,
      opl_can_store_canonical_artifact_blob: false,
      opl_can_accept_or_reject_memory_writeback: false,
      opl_can_mutate_domain_artifacts: false,
    },
    repository_boundary: {
      repo_tracks_contract_and_fixture_refs: true,
      repo_tracks_live_receipt_instances: false,
      repo_tracks_runtime_evidence_instances: false,
      repo_tracks_visual_truth: false,
      repo_tracks_review_export_verdict: false,
      repo_tracks_canonical_artifact_blob: false,
      repo_tracks_memory_content_body: false,
    },
  };
}

export function buildNoRegressionOwnerReceiptOplConsumptionProof() {
  return {
    surface_kind: 'no_regression_owner_receipt_opl_consumption_proof',
    proof_id: 'rca.no_regression_owner_receipt.opl_consumption.v1',
    owner: DOMAIN_OWNER,
    status: 'repo_local_focused_proof_landed_production_soak_pending',
    proof_model: 'domain_action_adapter_guarded_actions_emit_refs_and_return_shapes_only',
    guarded_actions: [
      {
        action: 'emit_no_regression_evidence',
        expected_return_shape: 'no_regression_evidence',
        opl_consumable_ref_field: 'evidence_ref',
        runtime_locator_field: 'runtime_locator_ref',
      },
      {
        action: 'emit_temporal_controlled_visual_stage_long_soak_evidence',
        expected_return_shapes: ['controlled_visual_stage_long_soak_evidence', 'typed_blocker'],
        opl_consumable_ref_field: 'evidence_ref',
        runtime_locator_field: 'runtime_locator_ref',
      },
      {
        action: 'emit_domain_owner_receipt',
        expected_return_shapes: ['domain_receipt', 'typed_blocker'],
        opl_consumable_ref_field: 'receipt_ref',
        runtime_locator_field: 'runtime_locator_ref',
      },
      {
        action: 'emit_external_work_order_owner_closeout',
        expected_return_shapes: ['no_regression_evidence', 'typed_blocker'],
        opl_consumable_ref_field: 'evidence_ref',
        runtime_locator_field: 'runtime_locator_ref',
      },
    ],
    opl_consumption_policy: {
      opl_can_store_no_regression_evidence_ref: true,
      opl_can_store_domain_owner_receipt_ref: true,
      opl_can_store_typed_blocker: true,
      opl_can_use_as_controlled_attempt_closeout_input: true,
      opl_can_declare_visual_ready: false,
      opl_can_declare_exportable: false,
      opl_can_declare_handoffable: false,
      opl_can_claim_production_soak_complete: false,
      opl_can_store_visual_truth: false,
      opl_can_store_review_export_verdict: false,
      opl_can_store_canonical_artifact_blob: false,
      opl_can_mutate_domain_artifacts: false,
    },
    repository_boundary: {
      repo_tracks_focused_proof_contract: true,
      repo_tracks_runtime_evidence_instances: false,
      repo_tracks_live_receipt_instances: false,
      repo_tracks_visual_or_export_artifacts: false,
      repo_tracks_production_soak_result: false,
    },
    source_refs: [
      '/product_entry_shell/domain_handler',
      '/controlled_soak_no_regression_attempt',
      '/domain_owner_receipt_contract',
      '/controlled_memory_apply_proof/forbidden_write_audit',
      '/runtime_residue_retirement',
    ],
  };
}

export function buildRuntimeMemoryReceiptInstances() {
  return {
    surface_kind: 'visual_pattern_memory_runtime_receipt_instances',
    owner: DOMAIN_OWNER,
    instance_model: 'runtime_locator_refs_only',
    repo_tracks_receipt_instances: false,
    repo_tracks_memory_content_body: false,
    instances: [
      {
        writeback_status: 'accepted',
        receipt_ref: 'rca-memory-receipt:visual-pattern:<accepted-receipt-id>',
        runtime_locator_ref: 'workspace-runtime-ref:memory-receipt:<accepted-receipt-id>',
        proposal_ref: 'rca-memory-proposal:visual-pattern:<proposal-id>',
        source_review_ref: 'workspace-runtime-ref:review:<run-id>',
        candidate_memory_ref: 'rca-memory:visual-pattern:<memory-id>',
        memory_locator_ref: 'rca-memory:visual-pattern:<memory-id>',
        memory_content_body_ref: 'rca-memory-content-ref:visual-pattern:<memory-id>',
        operator_receipt_projection_ref: '/domain_memory_descriptor_locator/operator_receipt_projection',
        owner: DOMAIN_OWNER,
      },
      {
        writeback_status: 'rejected',
        receipt_ref: 'rca-memory-receipt:visual-pattern:<rejected-receipt-id>',
        runtime_locator_ref: 'workspace-runtime-ref:memory-receipt:<rejected-receipt-id>',
        proposal_ref: 'rca-memory-proposal:visual-pattern:<proposal-id>',
        source_review_ref: 'workspace-runtime-ref:review:<run-id>',
        candidate_memory_ref: 'rca-memory:visual-pattern:<memory-id>',
        memory_locator_ref: 'rca-memory:visual-pattern:<memory-id>',
        memory_content_body_ref: 'rca-memory-content-ref:visual-pattern:<memory-id>',
        operator_receipt_projection_ref: '/domain_memory_descriptor_locator/operator_receipt_projection',
        owner: DOMAIN_OWNER,
      },
    ],
    forbidden_instance_fields: [
      'memory_content_body',
      'visual_verdict',
      'review_verdict',
      'export_verdict',
      'canonical_artifact_blob',
    ],
  };
}

export function buildLifecycleGuardedApplyProof() {
  const operations = [
    ['cleanup', 'rca-lifecycle-receipt:cleanup:<receipt-id>'],
    ['restore', 'rca-lifecycle-receipt:restore:<receipt-id>'],
    ['retention', 'rca-lifecycle-receipt:retention:<receipt-id>'],
  ];
  return {
    surface_kind: 'lifecycle_guarded_apply_proof',
    proof_id: 'rca.lifecycle_guarded_apply_proof.v1',
    owner: DOMAIN_OWNER,
    status: 'guarded_apply_proof_landed_domain_artifact_mutation_requires_receipt',
    operations: operations.map(([operation, receiptRef]) => ({
      operation,
      owner: DOMAIN_OWNER,
      ledger_ref: `/opl_family_lifecycle_adapter/${operation}`,
      artifact_locator_ref: '/artifact_locator_contract',
      receipt_ref: receiptRef,
      opl_can_apply_domain_artifact_mutation: false,
      domain_receipt_required_for_artifact_mutation: true,
      typed_blocker_ref: `rca-lifecycle-blocker:${operation}:domain-receipt-required`,
    })),
    opl_consumption_policy: {
      opl_can_apply_opl_owned_locator_metadata: true,
      opl_can_request_domain_receipt: true,
      opl_can_delete_or_rewrite_domain_artifact: false,
      opl_can_store_artifact_blob: false,
      opl_can_store_review_export_verdict: false,
    },
    repository_boundary: {
      repo_tracks_lifecycle_contract: true,
      repo_tracks_lifecycle_receipt_instances: false,
      repo_tracks_visual_or_export_artifacts: false,
      repo_tracks_runtime_artifact_blobs: false,
    },
  };
}

export function buildAiRoutePolicy() {
  const stageKinds = [
    'source_intake',
    'communication_strategy',
    'visual_direction',
    'artifact_creation',
    'review_and_revision',
    'package_and_handoff',
  ];
  return {
    surface_kind: 'rca_ai_route_policy',
    policy_id: 'rca.ai_route_policy.v1',
    owner: DOMAIN_OWNER,
    status: 'single_codex_semantic_control_plane',
    declared_stage_kinds: stageKinds,
    route_policy: 'ai_selected_progress_route',
    route_capabilities: {
      advance: true,
      repeat_current_stage: true,
      skip_declared_stage: true,
      route_back_to_any_declared_stage: true,
      carry_raw_partial_failed_or_negative_artifacts: true,
    },
    quality_debt_policy: {
      blocks_stage_transition: false,
      blocks_visual_export_acceptance_or_ready_claims: true,
    },
    authority_boundary: {
      semantic_route_owner: 'codex_cli',
      static_transition_table_present: false,
      transition_evaluator_present: false,
      program_guard_can_select_or_reject_route: false,
      opl_role: 'transport_declared_stage_scope_and_attempt_lifecycle_only',
      rca_role: 'visual_truth_quality_export_and_artifact_authority_only',
    },
  };
}
