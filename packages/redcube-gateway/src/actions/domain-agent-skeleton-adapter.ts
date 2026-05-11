// @ts-nocheck

const DOMAIN_ID = 'redcube_ai';
const DOMAIN_OWNER = 'redcube_ai';
const SKELETON_ID = 'rca.domain-agent.skeleton.adapter.v1';

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
  return {
    surface_kind: 'controlled_visual_stage_attempt_fixture',
    fixture_id: 'rca.controlled_visual_stage_attempt.fixture.v1',
    domain_id: DOMAIN_ID,
    stage_kind: 'artifact_creation',
    family_stage_id: 'artifact_creation',
    route_stage_ref: 'author_image_pages',
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
    projection_only_result: {
      descriptor_refs: [
        '/family_stage_control_plane/stages',
        '/artifact_locator_contract',
        '/product_sidecar_receipt_refs',
      ],
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
    },
    opl_policy_proof: {
      opl_consumes_descriptor_refs: true,
      opl_consumes_artifact_refs: true,
      opl_holds_visual_verdict: false,
      opl_holds_export_verdict: false,
      opl_holds_canonical_artifact_content: false,
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

export function buildDomainAgentSkeletonAdapter({
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
  return {
    surface_kind: 'domain_agent_skeleton_adapter',
    adapter_id: SKELETON_ID,
    version: 'v1',
    domain_id: DOMAIN_ID,
    owner: DOMAIN_OWNER,
    mapping_model: 'manifest_descriptor_mapping_only',
    repo_source_boundary: {
      allowed_roots: REPO_SOURCE_BOUNDARIES,
      physical_relayout_required_now: false,
      repo_tracks_runtime_artifact_blobs: false,
      repo_tracks_receipt_instances: false,
    },
    runtime_declarations: {
      declares_only: [
        'product_sidecar_adapter',
        'projection_builder',
        'lifecycle_adapter',
      ],
      sidecar_adapter_ref: productSidecarRef,
      projection_builder_ref: familyStageControlPlaneRef,
      lifecycle_adapter_ref: lifecycleAdapterRef,
      session_command_template: productEntrySessionCommand || 'redcube product session --entry-session-id <entry-session-id>',
      runtime_owner: runtime?.runtime_owner || 'codex_cli',
      executor_owner: 'codex_cli',
      creates_visual_artifacts_in_repo: false,
    },
    artifact_locator_contract: artifactLocatorContract,
    product_sidecar_receipt_refs: receiptRefs,
    controlled_visual_stage_attempt: controlledAttemptFixture,
    opl_consumption_boundary: {
      consumes: [
        'stage_descriptor',
        'artifact_locator_descriptor',
        'artifact_refs',
        'receipt_refs',
        'runtime_attempt_projection',
      ],
      does_not_consume_or_hold: [
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
      { ref_kind: 'json_pointer', ref: '/review_state', role: 'review_projection_ref' },
      { ref_kind: 'json_pointer', ref: '/publication_projection', role: 'publication_projection_ref' },
    ],
  };
}
