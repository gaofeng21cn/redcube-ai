// @ts-nocheck

const DOMAIN_OWNER = 'redcube_ai';

export function buildDomainOwnerReceiptContract() {
  return {
    surface_kind: 'domain_owner_receipt_contract',
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
        return_shape: 'typed_blocker',
        blocker_ref: 'rca-typed-blocker:controlled-soak:<blocker-id>',
        blocker_kind: 'domain_owner_receipt_required',
        source_contract: 'opl_temporal_controlled_visual_stage_attempt_apply_contract',
        owner: DOMAIN_OWNER,
        next_required_owner_action: 'run_rca_owned_visual_stage_attempt_or_emit_no_regression_evidence',
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

export function buildPhysicalSkeletonFollowThrough() {
  return {
    surface_kind: 'physical_skeleton_follow_through',
    follow_through_id: 'rca.standard_domain_agent_skeleton.follow_through.v1',
    status: 'low_risk_repo_source_follow_through_landed',
    physical_roots: [
      {
        boundary_id: 'agent',
        status: 'present_with_repo_source_entrypoint',
        entrypoint_refs: ['agent/README.md', 'plugins/rca/skills/rca/SKILL.md'],
      },
      {
        boundary_id: 'contracts',
        status: 'present_with_runtime_program_contracts',
        entrypoint_refs: [
          'contracts/README.md',
          'contracts/runtime-program/current-program.json',
          'contracts/runtime-program/opl-family-contract-adoption.json',
        ],
      },
      {
        boundary_id: 'runtime',
        status: 'present_with_repo_source_entrypoint',
        entrypoint_refs: ['runtime/README.md', 'packages/redcube-gateway/src/actions/get-product-entry-manifest.ts'],
      },
      {
        boundary_id: 'docs',
        status: 'present_with_owner_docs',
        entrypoint_refs: ['docs/status.md', 'docs/architecture.md', 'docs/decisions.md'],
      },
    ],
    forbidden_moves: [
      'workspace_runtime_artifacts',
      'receipt_instances',
      'memory_content_body',
      'png_pptx_pdf_exports',
      'review_export_verdicts',
    ],
    parity_refs: [
      '/standard_domain_agent_skeleton',
      '/artifact_locator_contract',
      '/domain_memory_descriptor_locator',
      '/product_sidecar_receipt_refs',
    ],
  };
}

export function buildReviewHelperBaselineFollowThrough() {
  return {
    surface_kind: 'review_helper_baseline_follow_through',
    helper_path: 'python/redcube_ai/native_helpers/ppt_deck/review.py',
    current_line_budget_baseline: null,
    current_helper_line_budget_state: 'within_budget_after_summary_and_geometry_split',
    growth_guard: 'default_1000_line_budget',
    status: 'summary_and_geometry_split_landed_baseline_removed',
    split_plan: {
      module_boundaries: [
        'screenshot_capture_remaining',
        'geometry_audit_landed',
        'markdown_report_landed',
        'summary_projection_landed',
      ],
      landed_modules: [
        'python/redcube_ai/native_helpers/ppt_deck/review_geometry.py',
        'python/redcube_ai/native_helpers/ppt_deck/review_summary.py',
      ],
      remaining_split_target: 'screenshot_capture',
      delete_baseline_gate: 'completed',
    },
    typed_blocker: {
      blocker_kind: 'review_helper_capture_decomposition_remaining',
      blocker_id: 'rca_review_helper_split_remaining',
      reason: 'The line-budget baseline is removed; screenshot capture remains in the main helper and should be split only with behavior-preserving native review verification.',
      source_guard: 'scripts/line-budget.ts',
    },
  };
}
