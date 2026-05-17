// @ts-nocheck
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

import {
  buildFamilyDomainMemoryDescriptor,
  OPL_GENERATED_INTERFACE_CONSUMPTION,
  buildPrivatizedFunctionalModuleAuditProjection,
  buildRedCubeActionMetadata,
  buildRedCubeFamilyStageControlPlane,
  buildStandardDomainAgentSkeleton,
  buildVisualPackCompilerHandoffProjection,
} from '../packages/redcube-gateway/dist/index.js';

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

const GENERATED_SURFACES = [
  'cli',
  'mcp',
  'skill',
  'product_entry',
  'product_status',
  'product_session',
  'sidecar',
  'workbench',
  'functional_harness_cases',
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
      runtime_owner: 'codex_cli',
      runtime_state_root: '<runtime_state_root>',
      session_store_root: '<session_store_root>',
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
  return {
    surface_kind: 'opl_domain_pack_compiler_input',
    schema_version: 1,
    domain_id: DOMAIN_ID,
    domain_pack_owner: DOMAIN_ID,
    generated_surface_owner: GENERATED_SURFACE_OWNER,
    declarative_domain_pack: visualPackCompilerHandoff.declarative_visual_pack_input.required_input_families,
    minimal_authority_functions: visualPackCompilerHandoff.minimal_authority_function_contract.allowed_functions,
    generated_surfaces_requested: GENERATED_SURFACES,
    generated_interface_consumption_ref: '/opl_generated_interface_consumption',
    repo_local_handler_targets: OPL_GENERATED_INTERFACE_CONSUMPTION.repo_local_handler_targets,
    repo_local_handlers_are_generated_surface_owners: false,
    domain_repo_can_own_generated_surface: false,
    source_refs: {
      action_catalog: 'packages/redcube-gateway/src/actions/family-action-catalog.ts::buildRedCubeActionMetadata',
      stage_control_plane: 'packages/redcube-gateway/src/actions/family-stage-control-plane.ts::buildRedCubeFamilyStageControlPlane',
      memory_descriptor: 'packages/redcube-gateway/src/actions/standard-domain-agent-skeleton.ts::buildFamilyDomainMemoryDescriptor',
      functional_audit: 'packages/redcube-gateway/src/actions/product-sidecar-guarded-actions.ts::buildPrivatizedFunctionalModuleAuditProjection',
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
    generated_surfaces: GENERATED_SURFACES.map((surfaceId) => ({
      surface_id: surfaceId,
      owner: GENERATED_SURFACE_OWNER,
      domain_repo_can_own_generated_surface: false,
      status: 'descriptor_source_available',
    })),
    repo_local_handler_targets: OPL_GENERATED_INTERFACE_CONSUMPTION.repo_local_handler_targets,
    repo_local_launcher_policy: OPL_GENERATED_INTERFACE_CONSUMPTION.repo_local_launcher_policy,
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
      'review_or_export_verdict_authorizer',
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
