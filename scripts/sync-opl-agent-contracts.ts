// @ts-nocheck
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

import {
  buildRedCubeActionMetadata,
  buildRedCubeFamilyStageControlPlane,
  buildPrivatizedFunctionalModuleAuditProjection,
} from '../packages/redcube-gateway/dist/index.js';

const CONTRACTS_DIR = path.resolve('contracts');
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
  'product_entry_manifest',
  'sidecar_export_dispatch',
  'status_read_model',
  'workbench_drilldown',
  'functional_harness_cases',
];
const DECLARATIVE_DOMAIN_PACK = [
  'stage_descriptors',
  'action_catalog',
  'visual_pack_policy',
  'domain_memory_locator',
  'artifact_locator_contract',
  'owner_receipt_schema',
  'review_export_gate_refs',
];
const MINIMAL_AUTHORITY_FUNCTIONS = [
  'source_readiness_verdict',
  'visual_direction_authorizer',
  'review_export_verdict_authorizer',
  'artifact_mutation_authorizer',
  'visual_memory_accept_reject_decider',
  'owner_receipt_signer',
  'native_visual_helper_implementation',
];

function stable(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function writeJson(relativePath: string, payload: unknown) {
  const targetPath = path.resolve(relativePath);
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.writeFileSync(targetPath, stable(payload));
}

function buildDomainDescriptor() {
  return {
    surface_kind: 'domain_agent_descriptor',
    schema_version: 1,
    domain_id: 'redcube_ai',
    domain_label: 'RedCube AI',
    package_id: 'redcube-ai',
    agent_kind: 'visual_deliverable_foundry_agent',
    release_shape: 'opl_compatible_package',
    owner: 'redcube_ai',
    generated_interface_owner: 'one-person-lab',
    default_executor: 'codex_cli',
    formal_entry: {
      default: 'CLI',
      supported_protocols: ['MCP'],
      internal_surface: 'controller',
    },
    standard_contracts: {
      action_catalog: 'contracts/action_catalog.json',
      stage_control_plane: 'contracts/stage_control_plane.json',
      functional_privatization_audit: 'contracts/functional_privatization_audit.json',
    },
    canonical_metadata_sources: [
      'packages/redcube-gateway/src/actions/family-action-catalog.ts',
      'packages/redcube-gateway/src/actions/family-stage-control-plane.ts',
      'packages/redcube-gateway/src/actions/get-product-entry-manifest.ts',
    ],
    action_targets: {
      cli: 'npm run --prefix <redcube-ai-repo> redcube -- ...',
      product_entry: 'redcube product status | invoke | session | manifest',
      sidecar: 'redcube product sidecar export | dispatch',
      service_safe_domain_entry: 'invokeDomainEntry',
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
    notes: [
      'Root contracts are static OPL pack-compiler inputs generated from RCA-owned canonical action/stage metadata.',
      'Existing CLI, product-entry and sidecar implementations remain action targets, not generated-interface owners.',
    ],
  };
}

function normalizeFunctionalAudit(audit: Record<string, unknown>) {
  return {
    surface_kind: 'functional_privatization_audit',
    target_domain_id: 'redcube_ai',
    owner: 'redcube_ai',
    consumer: 'opl',
    status: 'resolved',
    source_projection_ref: '/privatized_functional_module_audit',
    source_contract_ref: audit.contract_ref,
    read_only: audit.read_only,
    refs_only: audit.refs_only,
    functional_structure_gap_closure: audit.functional_structure_gap_closure,
    modules: audit.modules,
    authority_boundary: audit.authority_boundary,
    generated_surface_owner: 'one-person-lab',
    domain_repo_can_own_generated_surface: false,
    blockers: [],
    notes: [
      'This standard OPL audit read model is projected from the RCA privatized functional module audit.',
      'OPL ready status requires zero generic residue/blockers after normalization.',
    ],
  };
}

function buildPackCompilerInput() {
  return {
    surface_kind: 'opl_domain_pack_compiler_input',
    schema_version: 1,
    domain_id: 'redcube_ai',
    domain_pack_owner: 'redcube_ai',
    generated_surface_owner: 'one-person-lab',
    declarative_domain_pack: DECLARATIVE_DOMAIN_PACK,
    minimal_authority_functions: MINIMAL_AUTHORITY_FUNCTIONS,
    generated_surfaces_requested: GENERATED_SURFACES,
    domain_repo_can_own_generated_surface: false,
    source_refs: {
      action_catalog: 'packages/redcube-gateway/src/actions/family-action-catalog.ts::getRedCubeFamilyActionCatalog',
      stage_control_plane: 'packages/redcube-gateway/src/actions/family-stage-control-plane.ts::buildRedCubeFamilyStageControlPlane',
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
    domain_id: 'redcube_ai',
    generated_surface_owner: 'one-person-lab',
    domain_repo_can_own_generated_surface: false,
    source_contract_ref: 'contracts/pack_compiler_input.json',
    generated_surfaces: GENERATED_SURFACES.map((surfaceId) => ({
      surface_id: surfaceId,
      owner: 'one-person-lab',
      domain_repo_can_own_generated_surface: false,
      status: 'descriptor_source_available',
    })),
    required_domain_handoff: [
      'owner_receipt_schema',
      'typed_blocker_schema',
      'minimal_authority_function_refs',
      'no_forbidden_write_evidence',
    ],
  };
}

function buildMemoryDescriptor() {
  return {
    surface_kind: 'domain_memory_descriptor_locator',
    schema_version: 1,
    domain_id: 'redcube_ai',
    memory_body_owner: 'redcube_ai',
    opl_projection_policy: 'locator_and_receipt_refs_only',
    authority_boundary: {
      opl_can_write_memory_body: false,
      opl_can_accept_or_reject_writeback: false,
      domain_memory_accept_reject_owner: 'redcube_ai',
    },
  };
}

function buildArtifactLocatorContract() {
  return {
    surface_kind: 'artifact_locator_contract',
    schema_version: 1,
    domain_id: 'redcube_ai',
    canonical_artifact_authority: 'redcube_ai',
    opl_projection_policy: 'locator_lifecycle_and_receipt_refs_only',
    authority_boundary: {
      opl_can_mutate_artifacts: false,
      opl_can_authorize_quality_or_export: false,
      domain_artifact_authority_owner: 'redcube_ai',
    },
  };
}

function buildOwnerReceiptContract() {
  return {
    surface_kind: 'owner_receipt_contract',
    schema_version: 1,
    domain_id: 'redcube_ai',
    allowed_receipt_classes: [
      'owner_receipt',
      'typed_blocker',
      'no_regression_evidence',
      'memory_writeback_receipt',
      'artifact_lifecycle_receipt',
    ],
    forbidden_claims: [
      'opl_authorized_domain_ready',
      'opl_authorized_quality_or_export_verdict',
      'opl_wrote_domain_truth',
      'opl_wrote_memory_body',
    ],
  };
}

function buildPrivateFunctionalSurfacePolicy() {
  return {
    surface_kind: 'opl_domain_private_functional_surface_admission_policy',
    schema_version: 1,
    domain_id: 'redcube_ai',
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
      'review_export_verdict_authorizer',
    ],
  };
}

async function main() {
  const actionMetadata = buildRedCubeActionMetadata();
  const actionCatalog = {
    ...actionMetadata.family_action_catalog,
    forbidden_generic_owner_roles: FORBIDDEN_GENERIC_OWNER_ROLES,
  };
  const stageControlPlane = buildRedCubeFamilyStageControlPlane({
    familyActionCatalog: actionCatalog,
  });
  const functionalAudit = normalizeFunctionalAudit(
    buildPrivatizedFunctionalModuleAuditProjection(),
  );

  fs.mkdirSync(CONTRACTS_DIR, { recursive: true });
  writeJson('contracts/domain_descriptor.json', buildDomainDescriptor());
  writeJson('contracts/pack_compiler_input.json', buildPackCompilerInput());
  writeJson('contracts/generated_surface_handoff.json', buildGeneratedSurfaceHandoff());
  writeJson('contracts/action_catalog.json', actionCatalog);
  writeJson('contracts/stage_control_plane.json', stageControlPlane);
  writeJson('contracts/memory_descriptor.json', buildMemoryDescriptor());
  writeJson('contracts/artifact_locator_contract.json', buildArtifactLocatorContract());
  writeJson('contracts/owner_receipt_contract.json', buildOwnerReceiptContract());
  writeJson('contracts/functional_privatization_audit.json', functionalAudit);
  writeJson('contracts/private_functional_surface_policy.json', buildPrivateFunctionalSurfacePolicy());
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.stack : String(error)}\n`);
  process.exit(1);
});
