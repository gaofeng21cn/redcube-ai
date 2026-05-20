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

export function buildNoRegressionOwnerReceiptOplConsumptionProof() {
  return {
    surface_kind: 'no_regression_owner_receipt_opl_consumption_proof',
    proof_id: 'rca.no_regression_owner_receipt.opl_consumption.v1',
    owner: DOMAIN_OWNER,
    status: 'repo_local_focused_proof_landed_production_soak_pending',
    proof_model: 'sidecar_guarded_actions_emit_refs_and_return_shapes_only',
    guarded_actions: [
      {
        action: 'emit_no_regression_evidence',
        expected_return_shape: 'no_regression_evidence',
        opl_consumable_ref_field: 'evidence_ref',
        runtime_locator_field: 'runtime_locator_ref',
      },
      {
        action: 'emit_domain_owner_receipt',
        expected_return_shapes: ['domain_receipt', 'typed_blocker'],
        opl_consumable_ref_field: 'receipt_ref',
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
      '/product_entry_shell/sidecar',
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

export function buildVisualTransitionSpec() {
  const stageKinds = [
    'source_intake',
    'communication_strategy',
    'visual_direction',
    'artifact_creation',
    'review_and_revision',
    'package_and_handoff',
  ];
  return {
    surface_kind: 'visual_transition_spec',
    spec_id: 'rca.visual_transition_spec.v1',
    owner: DOMAIN_OWNER,
    status: 'contract_landed_thin_evaluator_landed_runner_owned_by_opl',
    transition_model: 'rca_owned_transition_table_oracle_fixture_refs_only',
    source_contract: 'docs/active/rca-ideal-state-gap-plan.md#declare_visual_transition_spec',
    covered_family_stage_kinds: stageKinds,
    transition_table: [
      {
        transition_id: 'source_ready_to_strategy',
        from_stage: 'source_intake',
        to_stage: 'communication_strategy',
        required_guard_refs: ['source_readiness_ref', 'source_gap_ref'],
        owner_action: 'continue_to_communication_strategy',
      },
      {
        transition_id: 'strategy_ready_to_visual_direction',
        from_stage: 'communication_strategy',
        to_stage: 'visual_direction',
        required_guard_refs: ['communication_strategy_ref', 'audience_promise_ref'],
        owner_action: 'continue_to_visual_direction',
      },
      {
        transition_id: 'visual_direction_ready_to_artifact_creation',
        from_stage: 'visual_direction',
        to_stage: 'artifact_creation',
        required_guard_refs: ['visual_direction_ref', 'route_selection_ref', 'artifact_locator_ref'],
        owner_action: 'create_visual_artifacts',
      },
      {
        transition_id: 'artifact_ready_to_review',
        from_stage: 'artifact_creation',
        to_stage: 'review_and_revision',
        required_guard_refs: ['artifact_refs', 'prompt_manifest_ref', 'style_manifest_ref'],
        owner_action: 'run_review_and_repair_gate',
      },
      {
        transition_id: 'review_ready_to_package',
        from_stage: 'review_and_revision',
        to_stage: 'package_and_handoff',
        required_guard_refs: ['review_state_ref', 'blocked_item_ref', 'export_proof_ref'],
        owner_action: 'export_or_return_typed_blocker',
      },
    ],
    guard_contract: {
      guard_model: 'refs_and_typed_blockers_only',
      required_guard_classes: [
        'source_readiness',
        'communication_strategy',
        'visual_direction',
        'artifact_locator',
        'review_state',
        'export_proof',
      ],
      allowed_blocker_kinds: [
        'source_material_required',
        'route_selection_required',
        'artifact_refs_missing',
        'review_blocked_items_present',
        'export_proof_missing',
        'domain_owner_receipt_required',
      ],
    },
    oracle_fixture: {
      fixture_id: 'rca.visual_transition_oracle.fixture.v1',
      fixture_model: 'transition_guard_expected_owner_action_refs_only',
      covered_families: ['ppt_deck', 'xiaohongshu', 'poster_onepager'],
      expected_return_shapes: [
        'next_stage',
        'repair_action',
        'typed_blocker',
        'domain_owner_receipt_ref',
        'no_regression_evidence_ref',
      ],
      forbidden_oracle_fields: [
        'visual_verdict',
        'export_verdict',
        'review_verdict',
        'canonical_artifact_blob',
        'memory_content_body',
      ],
    },
    evaluator_descriptor: {
      descriptor_id: 'rca.visual_transition_evaluator.v1',
      surface_kind: 'visual_transition_evaluator',
      status: 'thin_evaluator_landed_runner_owned_by_opl',
      sidecar_action: 'evaluate_visual_transition',
      input_model: 'transition_id_current_stage_and_explicit_guard_refs',
      return_shapes: [
        'visual_transition_evaluation',
        'typed_blocker',
      ],
      output_refs: [
        'next_stage',
        'repair_action',
        'typed_blocker',
        'domain_owner_receipt_ref',
        'no_regression_evidence_ref',
        'transition_result_ref',
      ],
      refs_only: true,
    },
    family_transition_spec_descriptor: {
      descriptor_id: 'rca.visual_transition.family_transition_spec_descriptor.v1',
      source_visual_transition_spec_ref: '/visual_transition_spec',
      opl_visual_ingestion_surface: 'one-person-lab/src/family-transition-visual-ingestion.ts',
      opl_generic_runner_contract_ref: 'one-person-lab/contracts/opl-framework/family-transition-runner-contract.json',
      rca_evaluator_ref: '/visual_transition_evaluator',
      rca_bridge_evidence_ref: '/visual_transition_evaluator/bridge_evidence_projection',
      descriptor_model: 'rca_visual_spec_to_opl_family_transition_spec_refs_only',
      rca_implements_opl_generic_runner: false,
      rca_writes_runner_state: false,
    },
    runner_boundary: {
      opl_can_execute_transition_spec: true,
      opl_can_retry_or_dead_letter: true,
      opl_can_store_transition_metadata: true,
      opl_can_declare_visual_ready: false,
      opl_can_declare_exportable: false,
      opl_can_mutate_artifacts: false,
      domain_receipt_required_for_visual_closeout: true,
      rca_can_evaluate_guard_refs: true,
      rca_implements_generic_transition_runner: false,
    },
    repository_boundary: {
      repo_tracks_transition_spec: true,
      repo_tracks_oracle_fixture_contract: true,
      repo_tracks_evaluator_contract: true,
      repo_tracks_runner_state: false,
      repo_tracks_visual_or_export_artifacts: false,
      repo_tracks_receipt_instances: false,
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
        entrypoint_refs: ['agent/prompts/source_intake.md', 'plugins/rca/skills/rca/SKILL.md'],
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
    provenance_refs: [
      'human_doc:rca_history_index',
      'human_doc:retired_route_narratives_tombstone',
      'human_doc:upstream_hermes_history_index',
      '/runtime_residue_retirement',
    ],
    history_refs: [
      'human_doc:retired_route_narratives_tombstone',
      'human_doc:opl_managed_runtime_three_layer_contract_history',
    ],
    tombstone_refs: [
      'human_doc:retired_route_narratives_tombstone',
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
