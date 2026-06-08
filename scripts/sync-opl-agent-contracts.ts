// @ts-nocheck
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

import {
  buildFamilyDomainMemoryDescriptor,
  OPL_GENERATED_INTERFACE_CONSUMPTION,
  buildPrivatizedFunctionalModuleAuditProjection,
  buildPhysicalSourceMorphologyPolicy,
  buildRedCubeActionMetadata,
  buildRedCubeFamilyStageControlPlane,
  RCA_COGNITIVE_KERNEL_ADOPTION,
  RCA_GOLDEN_PATH_PROFILE,
  buildStandardDomainAgentSkeleton,
  buildVisualPackCompilerHandoffProjection,
} from '../packages/redcube-domain-entry/dist/index.js';
import { REPO_LOCAL_SHARED_OWNER_RELEASE_CONTRACT_PATH } from './run-test-group-lib.ts';

const CONTRACTS_DIR = path.resolve('contracts');
const DOMAIN_ID = 'redcube_ai';
const GENERATED_SURFACE_OWNER = 'one-person-lab';
const SHARED_POLICY_RELEASE = {
  policy_release_contract_ref: 'contracts/opl-framework/foundry-agent-series-policy-release.json',
  policy_bundle_fingerprint: 'sha256:5d77102e99e6e49acd88714cd94dcafe0969b8f2a5529928d753002ac3d4619d',
  fingerprint_algorithm: 'sha256:stable-json',
  domain_contract_policy_release_pin_required: true,
  domain_adapter_must_not_copy_policy_body_as_authority: true,
  consumer_alignment_check: 'foundry:policy-release',
};

const SERIES_DESIGN_PROFILE = {
  surface_kind: 'opl_foundry_agent_series_design_profile',
  version: 'foundry-agent-series-design-profile.v1',
  profile_id: 'opl_foundry_agent_series_design_profile.v1',
  profile_summary:
    'All Foundry Agents share the same OPL domain-pack to stage-led execution to gate/receipt to handoff lifecycle; domain inputs, outputs, aliases, and authority functions vary by agent.',
  shared_lifecycle_pipeline: [
    'domain_material_intake',
    'domain_pack_interpretation',
    'stage_led_agent_execution',
    'independent_quality_gate_or_owner_review',
    'owner_receipt_or_typed_blocker_closeout',
    'artifact_or_deliverable_handoff',
    'opl_refs_only_projection_and_recovery',
  ],
  domain_io_profile: {
    input_slot: 'domain_materials_or_task_request',
    output_slot: 'domain_deliverable_or_owner_handoff',
    input_is_domain_specific: true,
    output_is_domain_specific: true,
    shared_runtime_interpretation:
      'OPL treats input/output as opaque domain refs and projects identity, stage, progress, closeout, evidence, and recovery metadata only.',
  },
  stage_pack_sections: [
    'prompts',
    'stages',
    'skills',
    'knowledge',
    'quality_gates',
  ],
  shared_closeout_contract: {
    success_shape: 'domain_owner_receipt_ref',
    blocked_shape: 'domain_owned_typed_blocker_ref',
    route_back_shape: 'route_back_or_human_gate_ref',
    provider_completion_is_closeout: false,
  },
  authority_invariants: {
    opl_can_infer_domain_output: false,
    opl_can_read_domain_body: false,
    opl_can_write_domain_truth: false,
    opl_can_authorize_quality_or_export: false,
    domain_owns_input_truth_and_output_authority: true,
  },
};

const WORKSPACE_TOPOLOGY_PROFILE = {
  surface_kind: 'opl_workspace_topology_profile',
  version: 'workspace-topology-profile.v1',
  profile_id: 'opl.workspace_topology_profile.v1',
  topology_model: [
    'workspace_group',
    'project_unit',
    'stage_artifact_unit',
    'owner_receipt_or_typed_blocker',
  ],
  workspace_modes: [
    'one_off',
    'series',
    'portfolio',
  ],
  default_project_stage_outputs_root: 'artifacts/stage_outputs',
  default_profiles: {
    one_off: {
      workspace_mode: 'one_off',
      project_collection_path: 'projects',
      series_capable_skeleton: true,
      shared_resource_roots: [
        'shared/sources',
        'shared/memory',
        'shared/style_system',
      ],
      project_stage_outputs_root: 'artifacts/stage_outputs',
    },
    rca_series: {
      workspace_mode: 'series',
      project_collection_path: 'projects',
      shared_resource_roots: [
        'shared/sources',
        'shared/brand',
        'shared/visual_memory',
        'shared/style_system',
        'shared/material_inventory',
      ],
      project_stage_outputs_root: 'artifacts/stage_outputs',
    },
    mas_portfolio: {
      workspace_mode: 'portfolio',
      project_collection_path: 'projects',
      shared_resource_roots: [
        'data',
        'literature',
        'memory',
        'shared/sources',
      ],
      project_stage_outputs_root: 'artifacts/stage_outputs',
    },
  },
  domain_profile_defaults: {
    mas: 'mas_portfolio',
    mag: 'one_off',
    rca: 'rca_series',
    oma: 'one_off',
  },
  default_user_inspection_surface: {
    ordinary_user_default_surface: 'workspace_local_project_stage_outputs',
    project_stage_outputs_pattern: '<project-root>/artifacts/stage_outputs/<stage-id>/',
    runtime_state_is_default_user_surface: false,
    product_views_are_stage_outputs: false,
  },
  runtime_state_boundary: {
    role: 'provider_backing_provenance_restore_audit',
    runtime_state_can_be_canonical_project_root: false,
    runtime_state_can_close_stage: false,
    runtime_state_can_replace_owner_receipt_or_typed_blocker: false,
  },
  authority_boundary: {
    opl_can_define_topology_contract: true,
    opl_can_project_workspace_refs: true,
    opl_can_write_domain_truth: false,
    opl_can_mutate_artifact_body: false,
    opl_can_create_owner_receipt: false,
    opl_can_create_typed_blocker: false,
    runtime_state_counts_as_user_default_surface: false,
  },
  workspace_initialization_policy: {
    default_workspace_mode: 'one_off',
    infer_series_when_user_requests_multiple_related_deliverables: true,
    infer_portfolio_when_user_requests_shared_research_workspace_with_multiple_studies: true,
    upgrading_one_off_to_series_must_not_move_existing_project_roots: true,
    explicit_workspace_mode_declaration_preferred: true,
    default_project_collection_path: 'projects',
    legacy_project_collection_aliases: [
      'deliverables',
      'studies',
    ],
  },
  example_project_layouts: {
    one_off: {
      project_collection_path: 'projects',
      project_root_pattern: 'projects/<project-id>',
      project_stage_outputs_pattern: 'projects/<project-id>/artifacts/stage_outputs/<stage-id>/',
      legacy_project_collection_aliases: [
        'deliverables',
      ],
    },
    rca_series: {
      shared_roots: [
        'shared/sources',
        'shared/brand',
        'shared/visual_memory',
        'shared/style_system',
        'shared/material_inventory',
      ],
      project_collection_path: 'projects',
      project_root_pattern: 'projects/<deck-id>',
      project_stage_outputs_pattern: 'projects/<deck-id>/artifacts/stage_outputs/<stage-id>/',
      legacy_project_collection_aliases: [
        'deliverables',
      ],
    },
    mas_portfolio: {
      shared_roots: [
        'data',
        'literature',
        'memory',
      ],
      project_collection_path: 'projects',
      project_root_pattern: 'projects/<study-id>',
      project_stage_outputs_pattern: 'projects/<study-id>/artifacts/stage_outputs/<stage-id>/',
      legacy_project_collection_aliases: [
        'studies',
      ],
    },
  },
};

const DOMAIN_SPECIFIC_PROFILE = {
  profile_id: 'rca_domain_specific_series_profile.v1',
  series_membership: 'opl_foundry_agent_series',
  peer_agent_ids: ['mas', 'mag', 'oma'],
  shared_lifecycle_owner: 'one-person-lab',
  shared_lifecycle_contract:
    'OPL generated descriptors, refs, projection, provider-backed runtime, stage attempts, queue, wakeup, retry, human gate, receipt ledger, App/workbench shell',
  shared_lifecycle_policy:
    'rca_uses_the_same_opl_agent_lifecycle_as_mas_mag_oma_without_forking_runtime',
  domain_specialization: {
    input_profile: 'visual_materials_sources_brand_assets_images_documents_and_delivery_brief',
    output_profile: 'visual_deliverables_ppt_pdf_png_export_bundle_and_handoff_refs',
    stage_pack_role: 'declarative_visual_pack',
    default_visual_routes: ['ppt_deck', 'xiaohongshu', 'poster_onepager'],
  },
  rca_domain_authority: {
    visual_truth_owner: DOMAIN_ID,
    route_truth_owner: DOMAIN_ID,
    review_export_verdict_owner: DOMAIN_ID,
    artifact_authority_owner: DOMAIN_ID,
    visual_memory_accept_reject_owner: DOMAIN_ID,
    owner_receipt_owner: DOMAIN_ID,
  },
  opl_boundary: {
    generated_descriptors_owner: GENERATED_SURFACE_OWNER,
    refs_projection_owner: GENERATED_SURFACE_OWNER,
    runtime_provider_owner: GENERATED_SURFACE_OWNER,
    app_workbench_shell_owner: GENERATED_SURFACE_OWNER,
    can_write_visual_truth: false,
    can_authorize_review_export_verdict: false,
    can_mutate_canonical_artifacts: false,
    can_accept_or_reject_visual_memory: false,
    can_issue_rca_owner_receipt: false,
  },
  conformance_policy: {
    descriptor_resolved: true,
    no_runtime_fork_required: true,
    domain_contract_must_remain_refs_only_for_opl: true,
    provider_completion_is_not_visual_ready: true,
    structural_conformance_is_not_domain_ready: true,
  },
};

const FORBIDDEN_GENERIC_OWNER_ROLES = [
  'generic_scheduler_owner',
  'generic_daemon_owner',
  'generic_lifecycle_owner',
  'generic_queue_owner',
  'generic_attempt_ledger_owner',
  'generic_state_machine_runner_owner',
  'generic_cli_mcp_product_wrapper_owner',
  'generic_domain_action_adapter_owner',
  'generic_sidecar_owner',
  'generic_session_store_owner',
  'generic_status_workbench_owner',
  'generic_workspace_source_intake_owner',
  'generic_memory_transport_owner',
  'generic_artifact_gallery_owner',
  'generic_operator_workbench_owner',
  'generic_observability_slo_owner',
  'generic_persistence_engine_owner',
  'generic_sqlite_lifecycle_owner',
  'generic_native_helper_envelope_owner',
  'generic_review_repair_transport_owner',
  'generated_surface_owner_in_domain_repo',
];

const OWNER_DELTA_NEXT_DELTA_KINDS = [
  'artifact_producing_owner_receipt',
  'visual_review_export_receipt',
  'visual_memory_accept_reject_receipt',
  'workspace_receipt_scaleout_receipt',
  'production_like_no_regression_ref',
  'temporal_controlled_visual_stage_long_soak_ref',
  'human_review_receipt',
  'domain_owned_typed_blocker',
];

const REPO_LOCAL_OWNER_DELTA_SURFACE_IDS = [
  'repo_local_wrapper',
  'product_entry_session',
  'runtime_watch',
  'operator_projection',
  'domain_action_adapter_compatibility',
  'neutral_route_run_record_adapter',
];

const OPL_CANONICAL_GENERATED_SURFACES = [
  'cli',
  'mcp',
  'skill',
  'product_entry_manifest',
  'domain_handler',
  'status_read_model',
  'workbench_drilldown',
  'functional_harness_cases',
];

const GENERATED_WRAPPER_DESCRIPTOR_SCOPE = [
  'product_entry',
  'product_status',
  'product_session',
  'domain_handler',
  'workbench',
];

const OPL_REQUESTED_GENERATED_SURFACES = [
  ...new Set([
    ...OPL_CANONICAL_GENERATED_SURFACES,
    ...GENERATED_WRAPPER_DESCRIPTOR_SCOPE,
  ]),
];

const REQUIRED_DOMAIN_PACK_PATHS = [
  'agent/prompts/source_intake.md',
  'agent/prompts/communication_strategy.md',
  'agent/prompts/visual_direction.md',
  'agent/prompts/artifact_creation.md',
  'agent/prompts/review_and_revision.md',
  'agent/prompts/package_and_handoff.md',
  'agent/stages/source_intake.md',
  'agent/stages/communication_strategy.md',
  'agent/stages/visual_direction.md',
  'agent/stages/artifact_creation.md',
  'agent/stages/review_and_revision.md',
  'agent/stages/package_and_handoff.md',
  'agent/skills/visual_deliverable_authoring.md',
  'agent/skills/native_helper_policy.md',
  'agent/skills/visual_memory_policy.md',
  'agent/quality_gates/visual_authority_boundaries.md',
  'agent/quality_gates/source_and_truth.md',
  'agent/quality_gates/communication_and_direction.md',
  'agent/quality_gates/visual_pack_discipline.md',
  'agent/quality_gates/package_distribution.md',
  'agent/quality_gates/artifact_authority.md',
  'agent/quality_gates/review_export_memory.md',
  'agent/knowledge/visual_truth_boundaries.md',
  'agent/knowledge/communication_visual_direction.md',
  'agent/knowledge/artifact_and_export_authority.md',
  'agent/knowledge/review_export_memory.md',
  'agent/knowledge/markdown_route_policy.md',
  'agent/knowledge/owner_receipt_policy.md',
  'agent/tools/domain_affordances.md',
];

function stable(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function writeJson(relativePath: string, payload: unknown) {
  const targetPath = path.resolve(relativePath);
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.writeFileSync(targetPath, stable(payload));
}

function buildSkeleton() {
  return buildStandardDomainAgentSkeleton({
    workspaceRoot: '<workspace_root>',
    runtime: {
      runtime_owner: 'configured_family_runtime_provider',
      runtime_state_root: '<runtime_state_root>',
      session_continuity_root: '<session_continuity_root>',
    },
    productEntrySessionCommand: 'opl_generated:product_session --entry-session-id <entry-session-id>',
  });
}

function buildDomainDescriptor() {
  return {
    surface_kind: 'domain_agent_descriptor',
    schema_version: 1,
    domain_id: DOMAIN_ID,
    domain_label: 'RedCube AI',
    package_id: 'redcube-ai',
    package_role: 'opl_standard_domain_agent',
    agent_kind: 'visual_deliverable_foundry_agent',
    release_shape: 'opl_compatible_package',
    owner: DOMAIN_ID,
    generated_surface_owner: GENERATED_SURFACE_OWNER,
    domain_repo_can_own_generated_surface: false,
    foundry_agent_series_contract_ref: 'contracts/foundry_agent_series.json',
    series_design_profile: SERIES_DESIGN_PROFILE,
    domain_specific_profile: DOMAIN_SPECIFIC_PROFILE,
    standard_contract_refs: {
      domain_manifest_registration: 'contracts/opl_domain_manifest_registration.json',
      action_catalog: 'contracts/action_catalog.json',
      stage_control_plane: 'contracts/stage_control_plane.json',
      pack_compiler_input: 'contracts/pack_compiler_input.json',
      agent_lab_handoff: 'contracts/agent_lab_handoff.json',
      generated_surface_handoff: 'contracts/generated_surface_handoff.json',
      functional_privatization_audit: 'contracts/functional_privatization_audit.json',
      physical_source_morphology_policy: 'contracts/physical_source_morphology_policy.json',
      stage_artifact_kernel_adoption: 'contracts/stage_artifact_kernel_adoption.json',
      opl_state_index_kernel_adoption: 'contracts/stage_artifact_kernel_adoption.json#/opl_state_index_kernel_adoption',
    },
    authority_boundary: {
      redcube_ai_owns_visual_truth: true,
      redcube_ai_owns_route_truth: true,
      redcube_ai_owns_review_export_verdict: true,
      redcube_ai_owns_artifact_authority: true,
      redcube_ai_owns_visual_memory_body: true,
      opl_owns_generated_interfaces: true,
      opl_can_write_domain_truth: false,
      opl_can_write_memory_body: false,
      opl_can_authorize_quality_or_export: false,
      opl_can_mutate_artifacts: false,
      provider_completion_is_domain_ready: false,
    },
  };
}

function buildOplDomainManifestRegistration() {
  return {
    surface_kind: 'opl_domain_manifest_registration',
    schema_version: 1,
    domain_id: DOMAIN_ID,
    project_id: 'redcube',
    agent_id: 'rca',
    owner: DOMAIN_ID,
    registry_owner: GENERATED_SURFACE_OWNER,
    registration_status: 'repo_contract_ready_rebind_required_for_live_opl_registry',
    role: 'domain_registration_metadata_refs_only',
    domain_manifest: {
      domain_label: 'RedCube AI',
      agent_role: 'visual_deliverable_foundry_agent',
      delivery_domain: 'formal_visual_deliverables',
      canonical_semantic_pack_root: 'agent/',
      canonical_semantic_pack_role: 'repo_source_declarative_visual_pack',
      domain_descriptor_ref: 'contracts/domain_descriptor.json',
      stage_control_plane_ref: 'contracts/stage_control_plane.json',
      action_catalog_ref: 'contracts/action_catalog.json',
      pack_compiler_input_ref: 'contracts/pack_compiler_input.json',
      generated_surface_handoff_ref: 'contracts/generated_surface_handoff.json',
      functional_privatization_audit_ref: 'contracts/functional_privatization_audit.json',
      domain_memory_descriptor_ref: 'contracts/memory_descriptor.json',
      artifact_locator_contract_ref: 'contracts/artifact_locator_contract.json',
      owner_receipt_contract_ref: 'contracts/owner_receipt_contract.json',
      manifest_builder_export: '@redcube/domain-entry#getProductEntryManifest',
      manifest_builder_source_ref: 'packages/redcube-domain-entry/src/actions/get-product-entry-manifest.ts',
    },
    workspace_binding_manifest_command: {
      surface_kind: 'opl_workspace_binding_manifest_command_contract',
      project_id: 'redcube',
      workspace_locator_surface_kind: 'redcube_workspace',
      expected_binding_command:
        'opl workspace bind --project redcube --path <redcube-ai-repo> [--workspace-root <workspace-root>]',
      expected_derived_manifest_command_template:
        'node -e <redcube_generated_product_entry_manifest_materializer>',
      expected_derived_status_command_template:
        'node -e <redcube_generated_product_status_materializer>',
      expected_module_path: 'packages/redcube-domain-entry/dist/index.js',
      expected_export: 'getProductEntryManifest',
      status_export: 'getProductStatus',
      requires_build_artifact: true,
      requires_opl_workspace_binding_registry_entry: true,
      repo_contract_alone_updates_live_binding: false,
      blocked_if_manifest_command_null: true,
      pack_compiler_blocker_when_null: 'domain_manifest_not_resolved',
    },
    workspace_generated_artifact_policy: {
      surface_kind: 'rca_workspace_generated_artifact_policy',
      owner: DOMAIN_ID,
      repo_source_tracking_allowed: false,
      ignored_repo_root_paths: [
        'workspace.yaml',
        'workspace_*.json',
        'shared/',
      ],
      generated_by: [
        'OPL workspace initializer',
        'OPL workspace topology/materialized resource manifest writer',
      ],
      lifecycle: 'workspace_runtime_state_not_repo_source',
      durable_contract_owner: 'contracts/opl_domain_manifest_registration.json',
      no_forbidden_write_policy:
        'workspace topology outputs may exist beside a local workspace root but must not be tracked in the RCA source checkout',
    },
    consumed_by: [
      'OPL workspace bind',
      'OPL domain manifest resolver',
      'OPL agents pack-compiler',
      'OPL generated interface bundle',
    ],
    provided_outputs: [
      'domain_registration_ref',
      'domain_descriptor_ref',
      'stage_control_plane_ref',
      'action_catalog_ref',
      'pack_compiler_input_ref',
      'generated_surface_handoff_ref',
      'functional_privatization_audit_ref',
      'workspace_binding_manifest_command_contract',
      'workspace_generated_artifact_policy',
    ],
    authority_boundary: {
      refs_only: true,
      domain_repo_can_own_generated_surface: false,
      domain_repo_can_own_generic_runtime: false,
      can_write_visual_truth: false,
      can_write_visual_memory_body: false,
      can_mutate_canonical_artifact_body: false,
      can_authorize_review_export_verdict: false,
      can_issue_rca_owner_receipt: false,
      provider_completion_is_domain_ready: false,
      descriptor_ready_is_visual_ready: false,
    },
    forbidden_claims: [
      'repo_contract_alone_repaired_live_opl_workspace_registry',
      'descriptor_ready_is_visual_ready',
      'opl_can_write_rca_visual_truth',
      'workspace_yaml_is_repo_source',
      'shared_resource_manifests_are_repo_source',
    ],
  };
}

function buildPackCompilerInput(visualPackCompilerHandoff) {
  const authorityContract = visualPackCompilerHandoff.minimal_authority_function_contract;
  return {
    surface_kind: 'opl_domain_pack_compiler_input',
    schema_version: 1,
    domain_id: DOMAIN_ID,
    domain_pack_owner: DOMAIN_ID,
    generated_surface_owner: GENERATED_SURFACE_OWNER,
    declarative_domain_pack: visualPackCompilerHandoff.declarative_visual_pack_input.required_input_families,
    canonical_semantic_pack_root: 'agent/',
    canonical_semantic_pack_role: 'repo_source_declarative_visual_pack',
    legacy_detail_asset_roots: [
      'prompts/ppt_deck/',
      'prompts/xiaohongshu/',
    ],
    legacy_detail_asset_policy: 'implementation_detail_prompt_assets_only_not_stage_control_prompt_refs',
    required_domain_pack_paths: visualPackCompilerHandoff.declarative_visual_pack_input.required_domain_pack_paths,
    minimal_authority_surface_ids: authorityContract.allowed_authority_surface_ids,
    minimal_authority_surface_taxonomy: authorityContract.authority_surface_taxonomy,
    minimal_authority_surface_contracts: authorityContract.authority_surface_contracts,
    generated_surfaces_requested: OPL_REQUESTED_GENERATED_SURFACES,
    generated_interface_consumption_ref: '/opl_generated_interface_consumption',
    repo_local_handler_targets: OPL_GENERATED_INTERFACE_CONSUMPTION.repo_local_handler_targets,
    repo_local_handlers_are_generated_surface_owners: false,
    domain_repo_can_own_generated_surface: false,
    stage_pack_required_sections: visualPackCompilerHandoff.declarative_visual_pack_input.cognitive_stage_pack_contract.required_stage_sections,
    cognitive_kernel_adoption_ref: 'contracts/cognitive_kernel_adoption.json',
    golden_path_profile_ref: 'contracts/golden_path_profile.json',
    tool_refs: [
      visualPackCompilerHandoff.declarative_visual_pack_input.cognitive_stage_pack_contract.domain_affordance_catalog_ref,
    ],
    tool_affordance_boundary: visualPackCompilerHandoff.declarative_visual_pack_input.cognitive_stage_pack_contract.tool_affordance_boundary,
    visual_pack_discipline_contract: visualPackCompilerHandoff.declarative_visual_pack_input.visual_pack_discipline_contract,
    cognitive_stage_pack_contract: visualPackCompilerHandoff.declarative_visual_pack_input.cognitive_stage_pack_contract,
    markdown_marp_route_policy: visualPackCompilerHandoff.declarative_visual_pack_input.markdown_marp_route_policy,
    package_distribution_gate: visualPackCompilerHandoff.declarative_visual_pack_input.package_distribution_gate,
    source_refs: {
      canonical_semantic_pack: 'agent/',
      action_catalog: 'packages/redcube-domain-entry/src/actions/family-action-catalog.ts::buildRedCubeActionMetadata',
      stage_control_plane: 'packages/redcube-domain-entry/src/actions/family-stage-control-plane.ts::buildRedCubeFamilyStageControlPlane',
      memory_descriptor: 'packages/redcube-domain-entry/src/actions/standard-domain-agent-skeleton.ts::buildFamilyDomainMemoryDescriptor',
      functional_audit: 'packages/redcube-domain-entry/src/actions/guarded-domain-actions.ts::buildPrivatizedFunctionalModuleAuditProjection',
    },
    authority_boundary: {
      opl_can_write_domain_truth: false,
      opl_can_write_memory_body: false,
      opl_can_authorize_quality_or_export: false,
      domain_can_claim_generated_surface_owner: false,
    },
  };
}

function buildGeneratedSurfaceHandoff() {
  return {
    surface_kind: 'opl_generated_surface_handoff',
    schema_version: 1,
    domain_id: DOMAIN_ID,
    generated_surface_owner: GENERATED_SURFACE_OWNER,
    domain_repo_can_own_generated_surface: false,
    source_contract_ref: 'contracts/pack_compiler_input.json',
    generated_interface_consumption_ref: '/opl_generated_interface_consumption',
    semantic_pack_consumption_policy: {
      source_pack_root: 'agent/',
      stage_prompt_ref_policy: 'consume_agent_prompts_repo_paths_only',
      legacy_prompt_assets_role: 'detail_assets_referenced_by_agent_prompt_policy',
      opl_generated_surfaces_write_policy: 'refs_only_no_visual_truth_body_verdict_artifact_or_memory_writes',
      forbidden_generated_surface_outputs: [
        'visual_truth_body',
        'review_export_verdict',
        'artifact_body',
        'artifact_mutation_authorization',
        'visual_memory_body',
        'visual_memory_accept_reject_verdict',
        'owner_receipt',
      ],
    },
    generated_surfaces: OPL_REQUESTED_GENERATED_SURFACES.map((surfaceId) => ({
      surface_id: surfaceId,
      owner: GENERATED_SURFACE_OWNER,
      domain_repo_can_own_generated_surface: false,
      status: 'descriptor_source_available',
    })),
    repo_local_handler_targets: OPL_GENERATED_INTERFACE_CONSUMPTION.repo_local_handler_targets,
    repo_local_launcher_policy: OPL_GENERATED_INTERFACE_CONSUMPTION.repo_local_launcher_policy,
    bridge_exit_gate: OPL_GENERATED_INTERFACE_CONSUMPTION.bridge_exit_gate,
    required_domain_handoff: [
      'owner_receipt_schema',
      'typed_blocker_schema',
      'minimal_authority_function_refs',
      'no_forbidden_write_evidence',
    ],
  };
}

function withActionCatalogGuards(actionCatalog) {
  return {
    ...actionCatalog,
    forbidden_generic_owner_roles: FORBIDDEN_GENERIC_OWNER_ROLES,
    generated_surface_owner: GENERATED_SURFACE_OWNER,
    domain_repo_can_own_generated_surface: false,
  };
}

function buildMemoryDescriptor(skeleton) {
  return {
    ...buildFamilyDomainMemoryDescriptor({
      domainMemoryDescriptorLocator: skeleton.domain_memory_descriptor_locator,
    }),
    root_contract_role: 'opl_standard_domain_agent_memory_descriptor',
    memory_body_owner: DOMAIN_ID,
    opl_projection_policy: 'locator_and_receipt_refs_only',
  };
}

function buildFunctionalAudit(functionalAudit) {
  return {
    surface_kind: 'functional_privatization_audit',
    schema_version: 1,
    domain_id: DOMAIN_ID,
    target_domain_id: DOMAIN_ID,
    ...functionalAudit,
    privatized_functional_module_audit: functionalAudit,
    opl_generated_interface_consumption: OPL_GENERATED_INTERFACE_CONSUMPTION,
    functional_structure_gap_closure: functionalAudit.functional_structure_gap_closure,
    authority_boundary: {
      opl_can_write_domain_truth: false,
      opl_can_write_memory_body: false,
      opl_can_authorize_quality_or_export: false,
      domain_can_claim_generic_runtime_owner: false,
      domain_repo_can_own_generated_surface: false,
    },
  };
}

function buildPrivateFunctionalSurfacePolicy() {
  return {
    surface_kind: 'opl_domain_private_functional_surface_admission_policy',
    schema_version: 1,
    domain_id: DOMAIN_ID,
    default_posture: 'forbidden_until_classified_and_receipted',
    forbidden_private_surface_classes: [
      'generic_scheduler',
      'generic_queue_or_attempt_ledger',
      'generic_cli_mcp_product_wrapper',
      'generic_workbench_shell',
      'generic_observability_runtime',
    ],
    allowed_private_surface_classes: [
      'minimal_authority_function',
      'visual_native_helper_implementation',
      'ai_first_review_export_ref_materializer',
    ],
    purpose_first_owner_delta_policy: {
      default_operator_question: 'which_owner_must_produce_which_delta_or_typed_blocker',
      accepted_next_delta_kinds: OWNER_DELTA_NEXT_DELTA_KINDS,
      refs_only_accounting_is_progress: false,
      provider_completion_is_visual_progress: false,
      session_currentness_is_visual_progress: false,
      workbench_projection_is_visual_progress: false,
    },
    repo_local_owner_delta_surface_policy: {
      default_surface_role: 'refs_only_owner_delta_adapter_until_exit_gate',
      scoped_surface_ids: REPO_LOCAL_OWNER_DELTA_SURFACE_IDS,
      allowed_roles_before_exit_gate: [
        'refs_only_adapter',
        'domain_handler_target',
        'native_helper_target',
        'migration_input',
        'negative_input_guard',
      ],
      required_next_delta_kinds: OWNER_DELTA_NEXT_DELTA_KINDS,
      disallowed_progress_claims: [
        'mock_sample_ref_accounting',
        'sample_ref_accounting',
        'refs_only_accounting',
        'provider_completion',
        'session_currentness',
        'workbench_projection',
        'structural_contract_pass',
      ],
      production_ready_claim_allowed: false,
      visual_ready_claim_allowed: false,
      artifact_ready_claim_allowed: false,
      mock_sample_ref_accounting_is_production_ready: false,
      sample_ref_accounting_is_production_ready: false,
    },
    domain_thinning_exit_gate: {
      candidate_surface_classes: [
        'generic_cli_mcp_product_wrapper',
        'generic_session_store_owner',
        'generic_status_workbench_owner',
        'generic_domain_action_adapter_owner',
        'generic_operator_workbench_owner',
        'generic_observability_runtime',
        'generic_queue_or_attempt_ledger',
        'generic_review_repair_transport_owner',
      ],
      required_before_delete_or_thin: [
        'opl_default_caller_parity',
        'no_active_caller',
        'rca_owner_receipt_or_typed_blocker_roundtrip',
        'no_forbidden_write_proof',
        'retired_alias_no_resurrection_proof',
        'tombstone_or_provenance_pointer',
      ],
      allowed_before_gate: [
        'refs_only_adapter',
        'domain_handler_target',
        'migration_input',
        'negative_input_guard',
      ],
      forbidden_after_gate: [
        'compatibility_alias',
        'facade',
        'default_dispatch',
        'old_public_path_test',
        'success_payload_compatibility_field',
      ],
    },
    forbidden_generic_owner_roles: FORBIDDEN_GENERIC_OWNER_ROLES,
  };
}

function buildContracts() {
  const actionCatalog = buildRedCubeActionMetadata().family_action_catalog;
  const stageControlPlane = buildRedCubeFamilyStageControlPlane({
    familyActionCatalog: actionCatalog,
  });
  const skeleton = buildSkeleton();
  const visualPackCompilerHandoff = buildVisualPackCompilerHandoffProjection();
  const functionalAudit = buildPrivatizedFunctionalModuleAuditProjection();

  return {
    domain_descriptor: buildDomainDescriptor(),
    opl_domain_manifest_registration: buildOplDomainManifestRegistration(),
    pack_compiler_input: buildPackCompilerInput(visualPackCompilerHandoff),
    cognitive_kernel_adoption: RCA_COGNITIVE_KERNEL_ADOPTION,
    golden_path_profile: RCA_GOLDEN_PATH_PROFILE,
    generated_surface_handoff: buildGeneratedSurfaceHandoff(),
    foundry_agent_series: buildFoundryAgentSeriesContract(stageControlPlane),
    action_catalog: withActionCatalogGuards(actionCatalog),
    stage_control_plane: stageControlPlane,
    memory_descriptor: buildMemoryDescriptor(skeleton),
    artifact_locator_contract: skeleton.artifact_locator_contract,
    owner_receipt_contract: skeleton.domain_owner_receipt_contract,
    functional_privatization_audit: buildFunctionalAudit(functionalAudit),
    private_functional_surface_policy: buildPrivateFunctionalSurfacePolicy(),
    physical_source_morphology_policy: buildPhysicalSourceMorphologyPolicy(),
  };
}

function buildFoundryAgentSeriesContract(stageControlPlane) {
  return {
    surface_kind: 'opl_foundry_agent_series_contract',
    version: 'foundry-agent-series.v1',
    owner: 'one-person-lab',
    product_layer: 'foundry_agent',
    product_model: 'OPL Framework -> One Person Lab App -> Foundry Agents',
    standard_agent_requirement:
      'foundry_agents_share_identity_stage_authority_progress_currentness_closeout_and_app_projection_packets',
    contract_version_policy: {
      current_version: 'foundry-agent-series.v1',
      domain_contract_ref: 'contracts/foundry_agent_series.json',
      exact_version_pin_required: true,
      compatible_version_range: ['foundry-agent-series.v1'],
      breaking_change_requires_new_version: true,
      domain_descriptor_must_reference_domain_contract: true,
    },
    shared_release_pin_strategy: {
      owner_release_contract_ref: REPO_LOCAL_SHARED_OWNER_RELEASE_CONTRACT_PATH,
      owner_commit_pin_required: true,
      domain_dependency_pin_required: true,
      supported_pin_sources: [
        'pyproject.toml',
        'uv.lock',
        'package.json',
        'package-lock.json',
      ],
      consumer_alignment_check: 'family:shared-release',
      domain_contract_version_pin_does_not_authorize_domain_truth: true,
    },
    shared_policy_release: SHARED_POLICY_RELEASE,
    domain_id: 'redcube',
    foundry_agent_id: 'redcube',
    domain_label: 'Presentation Foundry',
    domain_aliases: [DOMAIN_ID, 'redcube-ai', 'rca'],
    authority_owner: stageControlPlane.owner,
    stage_control_plane_ref: 'contracts/stage_control_plane.json',
    stage_control_plane_target_domain_id: stageControlPlane.target_domain_id,
    app_projection_ref: 'contracts/generated_surface_handoff.json#/product_entry',
    series_design_profile: SERIES_DESIGN_PROFILE,
    workspace_topology_profile: WORKSPACE_TOPOLOGY_PROFILE,
    domain_specific_profile: DOMAIN_SPECIFIC_PROFILE,
    identity_hygiene_policy: {
      policy_id: 'rca.identity_hygiene.v1',
      canonical_identities: {
        series_domain_id: 'redcube',
        foundry_agent_id: 'redcube',
        domain_authority_owner_id: stageControlPlane.owner,
        stage_control_plane_target_domain_id: stageControlPlane.target_domain_id,
        public_package_or_skill_id: 'redcube-ai',
        shorthand_alias: 'rca',
        domain_aliases: [DOMAIN_ID, 'redcube-ai', 'rca'],
      },
      identity_role_bindings: [
        {
          identity: 'redcube',
          role: 'foundry_series_identity',
          authority_source: false,
          public_package_or_skill_id: false,
          generated_surface_owner: false,
        },
        {
          identity: DOMAIN_ID,
          role: 'domain_authority_owner_and_stage_control_target',
          authority_source: true,
          public_package_or_skill_id: false,
          generated_surface_owner: false,
        },
        {
          identity: 'redcube-ai',
          role: 'public_package_and_skill_identity',
          authority_source: false,
          public_package_or_skill_id: true,
          generated_surface_owner: false,
        },
        {
          identity: 'rca',
          role: 'shorthand_alias',
          authority_source: false,
          public_package_or_skill_id: false,
          generated_surface_owner: false,
        },
      ],
      alias_authority_policy: {
        domain_aliases_do_not_define_authority: true,
        authority_owner_must_equal: stageControlPlane.owner,
        stage_control_plane_target_must_equal: stageControlPlane.target_domain_id,
        public_package_or_skill_must_equal: 'redcube-ai',
        shorthand_alias_must_equal: 'rca',
      },
      readiness_claim_boundary: {
        identity_hygiene_contract_only: true,
        can_claim_visual_ready: false,
        can_claim_exportable: false,
        can_claim_handoffable: false,
        can_claim_domain_ready: false,
        can_claim_production_ready: false,
      },
    },
    required_identity_fields: [
      'domain_id',
      'foundry_agent_id',
      'product_layer',
      'domain_label',
      'authority_owner',
      'stage_control_plane_ref',
      'identity_hygiene_policy',
    ],
    required_stage_packets: [
      'user_stage_log_contract',
      'progress_delta_policy',
      'typed_blocker_lineage_policy',
      'effective_current_context',
      'owner_receipt_or_typed_blocker_closeout',
    ],
    shared_progress_projection_fields: [
      'progress_delta_classification',
      'deliverable_progress_delta',
      'platform_repair_delta',
      'next_forced_delta',
    ],
    domain_progress_aliases: {
      deliverable: ['visual_deliverable_progress', 'deliverable_progress_delta'],
      platform: ['platform_repair_delta'],
    },
    domain_adapter_policy: {
      domain_specific_aliases_only: true,
      no_parallel_progress_schema: true,
      no_parallel_blocker_lineage_schema: true,
      no_domain_runtime_fork: true,
    },
    purpose_first_adapter_thinning_policy: {
      policy_id: 'rca.purpose_first_adapter_thinning.v1',
      default_retained_surface_roles: [
        'refs_only_adapter',
        'domain_handler_target',
        'minimal_authority_function',
        'migration_input',
        'history_or_tombstone_provenance',
      ],
      default_operator_delta_shape:
        'visual_deliverable_progress_delta_or_rca_owned_typed_blocker',
      physical_delete_required_gates: [
        'replacement_parity',
        'no_active_caller',
        'owner_receipt_or_typed_blocker',
        'no_forbidden_write',
        'tombstone_or_provenance',
      ],
      evidence_tail_boundary: {
        structural_conformance_is_domain_ready: false,
        descriptor_ready_is_visual_ready: false,
        provider_completion_is_exportable: false,
        generated_surface_can_claim_production_ready: false,
        missing_visual_review_or_export_gate_returns:
          'rca_owned_typed_blocker',
      },
      legacy_alias_guard: {
        managed_gateway_session_domain_action_adapter_terms_are_authority_sources: false,
        may_be_active_public_surface: false,
        may_be_generic_owner_surface: false,
        allowed_roles: [
          'legacy_name_allowance',
          'semantic_id',
          'refs_only_adapter',
          'domain_handler_target',
          'provenance_or_tombstone',
        ],
      },
      private_surface_policy_ref: 'contracts/private_functional_surface_policy.json',
      physical_morphology_policy_ref: 'contracts/physical_source_morphology_policy.json',
      active_plan_ref: 'docs/active/rca-ideal-state-gap-plan.md',
    },
    app_projection_policy: {
      app_consumes_shared_progress_projection_only: true,
      app_can_read_domain_body: false,
      app_can_write_domain_truth: false,
      app_can_claim_quality_or_export: false,
      display_policy: 'classification_only_no_domain_artifact_body',
    },
    authority_boundary: {
      opl_owns_series_contract: true,
      domain_owns_truth_quality_artifact_memory_and_receipts: true,
      app_owns_display_and_user_action_shell: true,
      generated_surface_can_claim_domain_ready: false,
    },
  };
}

function main() {
  const contracts = buildContracts();
  fs.mkdirSync(CONTRACTS_DIR, { recursive: true });
  const written = [];
  for (const [name, payload] of Object.entries(contracts)) {
    const relativePath = `contracts/${name}.json`;
    writeJson(relativePath, payload);
    written.push(relativePath);
  }
  process.stdout.write(stable({
    surface_kind: 'rca_opl_standard_pack_sync',
    target_domain_id: DOMAIN_ID,
    written,
  }));
}

main();
