// @ts-nocheck
import {
  CONTROLLED_MEMORY_APPLY_PROOF_STATE,
  buildControlledMemoryApplyProof,
  buildControlledMemoryApplyProofRef,
  buildRuntimeResidueRetirementAudit,
  buildSkeletonRepoSourceLayoutAudit,
  buildVisualPatternMemoryWritebackProjection,
} from './standard-domain-agent-skeleton-parts/memory-apply-proof.js';

export {
  buildRuntimeResidueRetirementAudit,
  buildVisualPatternMemoryWritebackProjection,
};

const DOMAIN_ID = 'redcube_ai';
const DOMAIN_OWNER = 'redcube_ai';
const SKELETON_ID = 'rca.standard_domain_agent_skeleton.v1';
const FAMILY_MEMORY_STAGE_APPLICABILITY = [
  'source_intake',
  'communication_strategy',
  'visual_direction',
  'artifact_creation',
  'review_and_revision',
  'package_and_handoff',
];
const FAMILY_MEMORY_FORBIDDEN_OPL_AUTHORITY = [
  'memory_store_owner',
  'domain_truth_owner',
  'visual_route_owner',
  'accept_reject_owner',
  'quality_verdict_owner',
  'review_export_verdict_owner',
  'artifact_authority',
];
const DOMAIN_MEMORY_ADOPTION_STATE = 'descriptor_proof_contract_landed_runtime_writeback_pending';
const DOMAIN_MEMORY_PROOF_CONTRACT_STATE = 'landed';
const DOMAIN_MEMORY_RUNTIME_WRITEBACK_STATE = 'pending';

const REPO_SOURCE_BOUNDARIES = [
  {
    boundary_id: 'agent',
    role: 'domain app skill, command metadata, stage descriptors, prompt and skill refs',
    repo_refs: [
      'packages/redcube-gateway/src/actions/family-action-catalog.ts',
      'packages/redcube-gateway/src/actions/family-stage-control-plane.ts',
      'prompts/ppt_deck',
      'prompts/xiaohongshu',
    ],
  },
  {
    boundary_id: 'contracts',
    role: 'machine-readable runtime, OPL adoption, service-safe entry, and helper contracts',
    repo_refs: [
      'contracts/runtime-program/current-program.json',
      'contracts/runtime-program/opl-family-contract-adoption.json',
      'contracts/runtime-program/service-safe-domain-entry-adapter.json',
      'contracts/runtime-program/python-native-helper-catalog.json',
    ],
  },
  {
    boundary_id: 'runtime',
    role: 'thin declarations for sidecar, projection builder, lifecycle adapter, and route/runtime facades',
    repo_refs: [
      'packages/redcube-gateway/src/actions/product-sidecar.ts',
      'packages/redcube-gateway/src/actions/product-entry-continuity-surfaces.ts',
      'packages/redcube-gateway/src/actions/get-product-entry-manifest.ts',
      'packages/redcube-runtime/src/managed-deliverable.ts',
    ],
  },
  {
    boundary_id: 'docs',
    role: 'human-readable owner boundary, lifecycle, and operator guidance',
    repo_refs: [
      'docs/project.md',
      'docs/architecture.md',
      'docs/status.md',
      'docs/decisions.md',
    ],
  },
];

function ref(path, role, label) {
  return {
    ref_kind: 'json_pointer',
    ref: path,
    role,
    label,
  };
}

export function buildArtifactLocatorContract({ workspaceRoot, runtimeStateRoot, sessionStoreRoot }) {
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
      session_store_root: sessionStoreRoot || null,
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
        'managed_run_artifact_ref',
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
      '/product_sidecar_receipt_refs',
    ],
    consumed_memory_refs: [
      'rca-memory:visual-pattern:<memory-id>',
    ],
    quality_refs: [
      '/review_state',
      '/publication_projection',
      '/ppt_deck_visual_route_truth',
    ],
    sidecar_refs: [
      '/product_entry_shell/sidecar',
      '/product_sidecar_receipt_refs',
    ],
  };
  return {
    surface_kind: 'controlled_visual_stage_attempt_fixture',
    status: DOMAIN_MEMORY_ADOPTION_STATE,
    fixture_id: 'rca.controlled_visual_stage_attempt.fixture.v1',
    domain_id: DOMAIN_ID,
    proof_model: 'consumed_memory_writeback_receipt_descriptor_sidecar_quality_ref_equivalence_only',
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
      runtime_owner: 'codex_cli',
      convergence_ref: '/domain_entry_surface',
      consumed_memory_refs: sharedRefs.consumed_memory_refs,
      ...sharedRefs,
    },
    opl_hosted_attempt: {
      entry_surface: 'OPL Runtime Manager configured family runtime provider',
      runtime_owner: 'configured_family_runtime_provider',
      sidecar_dispatch_ref: '/product_entry_shell/sidecar',
      convergence_ref: '/domain_entry_surface',
      consumed_memory_refs: sharedRefs.consumed_memory_refs,
      writeback_receipt_ref: 'rca-memory-receipt:visual-pattern:<receipt-id>',
      operator_receipt_projection_ref: '/domain_memory_descriptor_locator/operator_receipt_projection',
      ...sharedRefs,
    },
    equivalence_proof: {
      direct_and_opl_share_descriptor_refs: true,
      direct_and_opl_share_consumed_memory_refs: true,
      direct_and_opl_share_sidecar_refs: true,
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

export function buildProductSidecarReceiptRefs() {
  return {
    surface_kind: 'product_sidecar_receipt_refs',
    receipt_contract_id: 'rca.product_sidecar.receipt_refs.v1',
    owner: DOMAIN_OWNER,
    sidecar_adapter_ref: '/product_entry_shell/sidecar',
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
        receipt_kind: 'runtime_attempt_projection',
        action: 'product_entry_continuation',
        ref: '/result_surface/progress_projection',
        allowed_payload: [
          'entry_session_id',
          'managed_run_id',
          'current_stage',
          'artifact_refs',
        ],
      },
    ],
    forbidden_receipt_fields: [
      'visual_verdict',
      'export_verdict',
      'review_verdict',
      'publication_gate_verdict',
      'artifact_blob',
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

export function buildDomainMemoryDescriptorLocator() {
  const writebackProposalGenerator = {
    generator_id: 'rca.visual_pattern_memory.writeback_proposal_generator.v1',
    surface_kind: 'visual_pattern_memory_writeback_proposal_generator',
    generator_model: 'locator_only_candidate_projection',
    source_refs: [
      'visual_director_review_ref',
      'screenshot_review_ref',
      'export_closeout_ref',
      'product_entry_session_ref',
      'human_doc_ref',
    ],
    proposal_contract: {
      proposal_id_prefix: 'rca-memory-proposal:visual-pattern:',
      required_fields: [
        'proposal_id',
        'seed_fixture_ref',
        'source_review_ref',
        'stage_scope',
        'deliverable_family',
        'candidate_memory_ref',
        'provenance_refs',
        'recommended_decision',
      ],
      forbidden_fields: [
        'memory_content_body',
        'slide_or_page_content',
        'visual_verdict',
        'export_verdict',
        'review_verdict',
        'canonical_artifact_blob',
      ],
    },
    repository_boundary: {
      repo_tracks_generator_contract: true,
      repo_tracks_proposal_instances: false,
      repo_tracks_memory_entries: false,
      repo_tracks_receipt_instances: false,
      repo_tracks_visual_or_export_artifacts: false,
    },
  };
  const acceptRejectCommand = {
    command_id: 'rca.visual_pattern_memory.accept_reject.v1',
    surface_kind: 'visual_pattern_memory_accept_reject_command',
    owner: DOMAIN_OWNER,
    command_model: 'rca_domain_memory_decision_locator_only',
    allowed_decisions: [
      'accepted',
      'rejected',
    ],
    required_fields: [
      'proposal_id',
      'decision',
      'decision_owner',
      'source_review_ref',
      'candidate_memory_ref',
    ],
    output_refs: [
      'memory_locator_ref',
      'writeback_receipt_ref',
      'operator_receipt_projection_ref',
    ],
    side_effect_boundary: {
      writes_domain_memory_outside_repo: true,
      writes_repo_memory_entry: false,
      writes_repo_receipt_instance: false,
      writes_visual_truth: false,
      writes_review_export_verdict: false,
      writes_canonical_artifact_blob: false,
    },
  };
  const operatorReceiptProjection = {
    projection_id: 'rca.visual_pattern_memory.operator_receipt_projection.v1',
    surface_kind: 'visual_pattern_memory_operator_receipt_projection',
    projection_model: 'operator_visible_locator_status_only',
    source_refs: [
      'writeback_receipt_ref',
      'candidate_memory_ref',
      'product_entry_session_ref',
      'review_closeout_ref',
    ],
    visible_fields: [
      'receipt_id',
      'proposal_id',
      'writeback_status',
      'memory_locator_ref',
      'source_review_ref',
      'operator_message_ref',
    ],
    forbidden_projection_fields: [
      'memory_content_body',
      'visual_verdict',
      'export_verdict',
      'review_verdict',
      'artifact_blob',
    ],
    opl_consumption_policy: {
      opl_can_surface_projection: true,
      opl_can_store_projection_ref: true,
      opl_can_store_memory_content: false,
      opl_can_issue_decision: false,
      opl_can_write_receipt_instance: false,
    },
  };
  const migrationPlan = {
    plan_id: 'rca.visual_pattern_memory.migration_plan.v1',
    state: DOMAIN_MEMORY_ADOPTION_STATE,
    descriptor_proof_contract_state: DOMAIN_MEMORY_PROOF_CONTRACT_STATE,
    runtime_writeback_state: DOMAIN_MEMORY_RUNTIME_WRITEBACK_STATE,
    source_surfaces: [
      'workspace_runtime_root',
      'product_entry_session',
      'visual_director_review',
      'screenshot_review',
      'export_closeout',
      'human_doc_reference',
    ],
    target_surface: 'domain_owned_visual_pattern_memory',
    migration_steps: [
      'discover_candidate_lessons',
      'extract_reusable_pattern_card_candidate',
      'record_seed_fixture_locator_ref',
      'generate_writeback_proposal_locator',
      'domain_review_accept_or_reject',
      'publish_memory_locator_ref',
      'emit_writeback_receipt_ref',
      'project_operator_receipt_status',
    ],
    acceptance_gates: [
      'source_ref_resolves_to_rca_owned_runtime_or_repo_reference',
      'candidate_excludes_current_deliverable_content',
      'candidate_excludes_review_export_verdict',
      'candidate_excludes_canonical_artifact_blob',
      'proposal_is_locator_only',
      'decision_is_rca_owned_accept_or_reject',
      'accepted_memory_has_rca_owner',
      'consumed_memory_refs_are_locator_only',
      'writeback_receipt_is_locator_only',
      'operator_receipt_projection_is_locator_only',
      'opl_hosted_attempt_carries_refs_not_memory_body',
    ],
    repository_boundary: {
      repo_tracks_migration_plan: true,
      repo_tracks_seed_locator_contract: true,
      repo_tracks_memory_entries: false,
      repo_tracks_receipt_instances: false,
      repo_tracks_visual_or_export_artifacts: false,
      visual_truth_changed: false,
      route_truth_changed: false,
    },
  };
  const seedFixtureLocator = {
    fixture_id: 'rca.visual_pattern_memory.seed_fixture_locator.v1',
    fixture_model: 'locator_only_no_memory_content',
    source_root_model: 'workspace_runtime_or_repo_reference',
    accepted_seed_ref_prefixes: [
      'rca-memory-seed:visual-pattern:',
      'workspace-runtime-ref:visual-pattern-seed:',
    ],
    required_locator_fields: [
      'seed_id',
      'source_review_ref',
      'stage_scope',
      'deliverable_family',
      'reusable_lesson_ref',
      'provenance_refs',
      'migration_status',
    ],
    allowed_migration_status_values: [
      'candidate',
      'accepted_for_memory_writeback',
      'rejected_for_memory_writeback',
      'superseded',
    ],
    forbidden_seed_fields: [
      'memory_content_body',
      'slide_or_page_content',
      'visual_verdict',
      'export_verdict',
      'canonical_artifact_blob',
    ],
  };
  const writebackReceiptLocator = {
    locator_id: 'rca.visual_pattern_memory.writeback_receipt_locator.v1',
    receipt_contract_id: 'rca.visual_pattern_memory.writeback_receipt_refs.v1',
    receipt_model: 'locator_only_no_receipt_instance',
    runtime_writeback_state: DOMAIN_MEMORY_RUNTIME_WRITEBACK_STATE,
    source_root_model: 'workspace_runtime_or_domain_memory_reference',
    locator_fields: [
      'receipt_id',
      'proposal_id',
      'source_review_ref',
      'candidate_memory_ref',
      'writeback_status',
      'memory_locator_ref',
      'operator_receipt_projection_ref',
      'owner',
      'created_at',
    ],
    accepted_status_values: [
      'candidate',
      'accepted',
      'rejected',
      'superseded',
    ],
    repo_tracks_receipt_instances: false,
  };
  return {
    surface_kind: 'domain_memory_descriptor_locator',
    status: DOMAIN_MEMORY_ADOPTION_STATE,
    descriptor_id: 'rca.visual_pattern_memory.descriptor.v1',
    locator_id: 'rca.visual_pattern_memory.locator.v1',
    domain_id: DOMAIN_ID,
    owner: DOMAIN_OWNER,
    memory_family: 'visual_pattern_memory',
    memory_model: 'natural_language_pattern_cards',
    descriptor_model: 'repo_tracked_descriptor_refs_only',
    locator_model: 'rca_owned_memory_ref_locator',
    policy_ref: {
      ref_kind: 'human_doc',
      ref: 'human_doc:visual_pattern_memory_policy',
      label: 'Visual Pattern Memory Policy',
    },
    human_doc_ref: {
      ref_kind: 'human_doc',
      ref: 'human_doc:domain_memory_descriptor_locator',
      label: 'RCA domain memory descriptor and locator',
    },
    allowed_memory_card_shape: {
      required_fields: [
        'memory_id',
        'memory_family',
        'owner',
        'stage_scope',
        'deliverable_family',
        'provenance_refs',
        'content_ref',
      ],
      allowed_stage_scopes: [
        'source_readiness',
        'story_architecture',
        'visual_authorship',
        'review_overlay',
        'delivery_packaging',
      ],
      allowed_provenance_ref_kinds: [
        'visual_director_review_ref',
        'screenshot_review_ref',
        'export_closeout_ref',
        'human_doc_ref',
      ],
    },
    memory_locator: {
      ref_kind: 'rca_memory_ref',
      lookup_scope: 'rca_runtime_or_repo_memory_surfaces',
      accepted_ref_prefixes: [
        'rca-memory:visual-pattern:',
        'human_doc:visual_pattern_memory:',
      ],
      content_owner: DOMAIN_OWNER,
      content_storage_authority: DOMAIN_OWNER,
      opl_consumable_fields: [
        'memory_id',
        'stage_scope',
        'deliverable_family',
        'provenance_refs',
        'content_ref',
        'writeback_receipt_ref',
      ],
    },
    migration_plan: migrationPlan,
    writeback_proposal_generator: writebackProposalGenerator,
    accept_reject_command: acceptRejectCommand,
    seed_fixture_locator: seedFixtureLocator,
    writeback_receipt_locator: writebackReceiptLocator,
    operator_receipt_projection: operatorReceiptProjection,
    writeback_receipt_contract: {
      receipt_contract_id: 'rca.visual_pattern_memory.writeback_receipt_refs.v1',
      allowed_receipt_fields: [
        'receipt_id',
        'proposal_id',
        'source_review_ref',
        'candidate_memory_ref',
        'writeback_status',
        'memory_locator_ref',
        'operator_receipt_projection_ref',
        'owner',
        'created_at',
      ],
      forbidden_receipt_fields: [
        'memory_content_body',
        'visual_verdict',
        'export_verdict',
        'review_verdict',
        'canonical_artifact_blob',
      ],
    },
    authority_boundary: {
      memory_content_owner: DOMAIN_OWNER,
      route_truth_owner: DOMAIN_OWNER,
      review_export_verdict_owner: DOMAIN_OWNER,
      artifact_authority_owner: DOMAIN_OWNER,
      opl_role: 'locator_ref_receipt_consumer_only',
      opl_can_hold_memory_content: false,
      opl_can_choose_visual_route: false,
      opl_can_accept_or_reject_memory_writeback: false,
      opl_can_issue_review_or_export_verdict: false,
      opl_can_mutate_canonical_artifacts: false,
    },
  };
}

export function buildFamilyDomainMemoryDescriptor({
  domainMemoryDescriptorLocator = buildDomainMemoryDescriptorLocator(),
  freshnessSource = 'product_entry_manifest_build',
} = {}) {
  return {
    surface_kind: 'family_domain_memory_ref',
    version: 'family-domain-memory-ref.v1',
    memory_ref_id: 'rca_visual_pattern_memory',
    target_domain_id: DOMAIN_ID,
    owner: DOMAIN_OWNER,
    memory_family: domainMemoryDescriptorLocator.memory_family,
    memory_pack_ref: ref(
      '/domain_memory_descriptor_locator',
      'domain_owned_memory_pack_descriptor',
      'RCA visual pattern memory descriptor locator',
    ),
    stage_applicability: FAMILY_MEMORY_STAGE_APPLICABILITY,
    retrieval_contract_ref: ref(
      '/domain_memory_descriptor_locator/memory_locator',
      'locator_only_retrieval_contract',
      'RCA visual pattern memory locator',
    ),
    writeback_contract_ref: ref(
      '/domain_memory_descriptor_locator/writeback_proposal_generator',
      'domain_owned_writeback_proposal_contract',
      'RCA visual pattern memory writeback proposal generator',
    ),
    receipt_contract_ref: ref(
      '/domain_memory_descriptor_locator/writeback_receipt_contract',
      'locator_only_writeback_receipt_contract',
      'RCA visual pattern memory writeback receipt refs',
    ),
    recall_projection_ref: ref(
      '/domain_memory_descriptor_locator/operator_receipt_projection',
      'operator_recall_receipt_projection',
      'RCA visual pattern memory operator receipt projection',
    ),
    migration_plan_ref: ref(
      '/domain_memory_descriptor_locator/migration_plan',
      'domain_owned_migration_plan',
      'RCA visual pattern memory migration plan',
    ),
    seed_corpus_ref: ref(
      '/domain_memory_descriptor_locator/seed_fixture_locator',
      'domain_owned_seed_locator',
      'RCA visual pattern memory seed fixture locator',
    ),
    writeback_receipt_locator_ref: ref(
      '/domain_memory_descriptor_locator/writeback_receipt_locator',
      'domain_owned_writeback_receipt_locator',
      'RCA visual pattern memory writeback receipt locator',
    ),
    provenance_refs: [
      ref('/domain_memory_descriptor_locator/policy_ref', 'policy', 'Visual Pattern Memory Policy'),
      ref('/domain_memory_descriptor_locator/human_doc_ref', 'descriptor_reference', 'RCA domain memory descriptor and locator'),
      ref('/controlled_visual_stage_attempt', 'controlled_stage_attempt_proof', 'RCA controlled visual stage attempt proof'),
    ],
    freshness: {
      source: freshnessSource,
      descriptor_locator_ref: '/domain_memory_descriptor_locator',
      refresh_policy: 'domain_manifest_rebuild_required_before_stage_attempt',
    },
    migration_readiness: {
      status: DOMAIN_MEMORY_ADOPTION_STATE,
      migration_state: domainMemoryDescriptorLocator.migration_plan.state,
      memory_body_migration: 'domain_owned_runtime_apply_required',
      descriptor_proof_contract_state: DOMAIN_MEMORY_PROOF_CONTRACT_STATE,
      runtime_writeback_state: DOMAIN_MEMORY_RUNTIME_WRITEBACK_STATE,
      opl_apply_allowed: false,
      repo_tracks_memory_entries: false,
      repo_tracks_receipt_instances: false,
    },
    status: DOMAIN_MEMORY_ADOPTION_STATE,
    authority_boundary: {
      opl_role: 'locator_projection_owner',
      domain_memory_owner: DOMAIN_OWNER,
      forbidden_opl_authority: FAMILY_MEMORY_FORBIDDEN_OPL_AUTHORITY,
      can_write_domain_truth: false,
      can_authorize_quality_verdict: false,
      can_write_artifacts: false,
      can_choose_visual_route: false,
      can_accept_or_reject_memory_writeback: false,
      can_issue_review_or_export_verdict: false,
    },
  };
}

function buildControlledSoakNoRegressionAttempt() {
  return {
    surface_kind: 'controlled_soak_no_regression_attempt',
    attempt_id: 'rca.controlled_soak.no_regression_attempt.v1',
    target_domain_id: DOMAIN_ID,
    state: 'deferred_typed_blocker',
    controlled_soak_apply_contract_open: false,
    deferred_blocker: {
      blocker_kind: 'domain_apply_contract_gap',
      blocker_id: 'rca_controlled_soak_apply_contract_not_open',
      next_hop_contract_gap: 'opl_temporal_controlled_visual_stage_attempt_apply_contract',
      required_owner: 'opl_framework',
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

export function buildStandardDomainAgentSkeleton({
  workspaceRoot,
  runtime,
  productEntrySessionCommand,
  familyStageControlPlaneRef = '/family_stage_control_plane',
  productSidecarRef = '/product_entry_shell/sidecar',
  lifecycleAdapterRef = '/opl_family_lifecycle_adapter',
} = {}) {
  const artifactLocatorContract = buildArtifactLocatorContract({
    workspaceRoot,
    runtimeStateRoot: runtime?.runtime_state_root,
    sessionStoreRoot: runtime?.session_store_root,
  });
  const receiptRefs = buildProductSidecarReceiptRefs();
  const controlledAttemptFixture = buildControlledVisualStageAttemptFixture();
  const controlledMemoryApplyProof = buildControlledMemoryApplyProof();
  const controlledSoakNoRegressionAttempt = buildControlledSoakNoRegressionAttempt();
  const domainMemoryDescriptorLocator = buildDomainMemoryDescriptorLocator();
  return {
    surface_kind: 'standard_domain_agent_skeleton',
    skeleton_id: SKELETON_ID,
    version: 'v1',
    domain_id: DOMAIN_ID,
    owner: DOMAIN_OWNER,
    mapping_model: 'physical_skeleton_repo_source_layout_with_manifest_projection',
    repo_source_boundary: {
      allowed_roots: REPO_SOURCE_BOUNDARIES,
      physical_relayout_required_now: false,
      repo_tracks_runtime_artifact_blobs: false,
      repo_tracks_receipt_instances: false,
      audit_surface: buildSkeletonRepoSourceLayoutAudit({
        repoSourceBoundaries: REPO_SOURCE_BOUNDARIES,
      }),
    },
    runtime_declarations: {
      declares_only: [
        'product_sidecar_adapter',
        'projection_builder',
        'lifecycle_adapter',
        'domain_memory_descriptor_locator',
      ],
      sidecar_adapter_ref: productSidecarRef,
      projection_builder_ref: familyStageControlPlaneRef,
      lifecycle_adapter_ref: lifecycleAdapterRef,
      domain_memory_descriptor_locator_ref: '/domain_memory_descriptor_locator',
      session_command_template: productEntrySessionCommand || 'redcube product session --entry-session-id <entry-session-id>',
      runtime_owner: runtime?.runtime_owner || 'codex_cli',
      executor_owner: 'codex_cli',
      creates_visual_artifacts_in_repo: false,
    },
    artifact_locator_contract: artifactLocatorContract,
    domain_memory_descriptor_locator: domainMemoryDescriptorLocator,
    product_sidecar_receipt_refs: receiptRefs,
    controlled_visual_stage_attempt: controlledAttemptFixture,
    controlled_memory_apply_proof: controlledMemoryApplyProof,
    controlled_soak_no_regression_attempt: controlledSoakNoRegressionAttempt,
    opl_consumption_boundary: {
      consumes: [
        'stage_descriptor',
        'artifact_locator_descriptor',
        'artifact_refs',
        'domain_memory_locator_refs',
        'domain_memory_writeback_receipt_refs',
        'receipt_refs',
        'runtime_attempt_projection',
      ],
      does_not_consume_or_hold: [
        'visual_pattern_memory_content',
        'visual_export_verdict',
        'review_verdict',
        'publication_projection_truth',
        'canonical_artifact_content',
      ],
      sidecar_dispatch_policy: 'guarded_rca_owned_actions_only',
    },
    source_refs: [
      { ref_kind: 'json_pointer', ref: familyStageControlPlaneRef, role: 'projection_builder' },
      { ref_kind: 'json_pointer', ref: productSidecarRef, role: 'sidecar_adapter' },
      { ref_kind: 'json_pointer', ref: lifecycleAdapterRef, role: 'lifecycle_adapter' },
      { ref_kind: 'json_pointer', ref: '/artifact_inventory', role: 'artifact_refs' },
      { ref_kind: 'json_pointer', ref: '/domain_memory_descriptor_locator', role: 'domain_memory_locator_refs' },
      { ref_kind: 'json_pointer', ref: '/review_state', role: 'review_projection_ref' },
      { ref_kind: 'json_pointer', ref: '/publication_projection', role: 'publication_projection_ref' },
    ],
  };
}
