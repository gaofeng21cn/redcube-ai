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
  buildStandardDomainAgentSkeleton,
  buildVisualPackCompilerHandoffProjection,
} from '../packages/redcube-domain-entry/dist/index.js';

const CONTRACTS_DIR = path.resolve('contracts');
const DOMAIN_ID = 'redcube_ai';
const GENERATED_SURFACE_OWNER = 'one-person-lab';

const FORBIDDEN_GENERIC_OWNER_ROLES = [
  'generic_scheduler_owner',
  'generic_daemon_owner',
  'generic_lifecycle_owner',
  'generic_queue_owner',
  'generic_attempt_ledger_owner',
  'generic_state_machine_runner_owner',
  'generic_cli_mcp_product_wrapper_owner',
  'generic_domain_action_adapter_owner',
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

const OPL_CANONICAL_GENERATED_SURFACES = [
  'cli',
  'mcp',
  'skill',
  'product_entry_manifest',
  'domain_action_adapter_export_dispatch',
  'status_read_model',
  'workbench_drilldown',
  'functional_harness_cases',
];

const GENERATED_WRAPPER_DESCRIPTOR_SCOPE = [
  'product_entry',
  'product_status',
  'product_session',
  'domain_action_adapter',
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
  'agent/quality_gates/artifact_authority.md',
  'agent/quality_gates/review_export_memory.md',
  'agent/knowledge/visual_truth_boundaries.md',
  'agent/knowledge/communication_visual_direction.md',
  'agent/knowledge/artifact_and_export_authority.md',
  'agent/knowledge/review_export_memory.md',
  'agent/knowledge/owner_receipt_policy.md',
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
    productEntrySessionCommand: 'redcube product session --entry-session-id <entry-session-id>',
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
    standard_contract_refs: {
      action_catalog: 'contracts/action_catalog.json',
      stage_control_plane: 'contracts/stage_control_plane.json',
      pack_compiler_input: 'contracts/pack_compiler_input.json',
      generated_surface_handoff: 'contracts/generated_surface_handoff.json',
      functional_privatization_audit: 'contracts/functional_privatization_audit.json',
      physical_source_morphology_policy: 'contracts/physical_source_morphology_policy.json',
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
    required_domain_pack_paths: REQUIRED_DOMAIN_PACK_PATHS,
    minimal_authority_surface_ids: authorityContract.allowed_authority_surface_ids,
    minimal_authority_surface_taxonomy: authorityContract.authority_surface_taxonomy,
    minimal_authority_surface_contracts: authorityContract.authority_surface_contracts,
    generated_surfaces_requested: OPL_REQUESTED_GENERATED_SURFACES,
    generated_interface_consumption_ref: '/opl_generated_interface_consumption',
    repo_local_handler_targets: OPL_GENERATED_INTERFACE_CONSUMPTION.repo_local_handler_targets,
    repo_local_handlers_are_generated_surface_owners: false,
    domain_repo_can_own_generated_surface: false,
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
    pack_compiler_input: buildPackCompilerInput(visualPackCompilerHandoff),
    generated_surface_handoff: buildGeneratedSurfaceHandoff(),
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
