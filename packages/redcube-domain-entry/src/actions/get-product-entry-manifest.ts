import { buildRedCubeSharedHandoff } from './domain-entry-contract.js';
import { FAMILY_ACTION_CATALOG_CONTRACT_REF } from './family-action-catalog.js';
import { DECLARATIVE_STAGE_MANIFEST_REF } from './declarative-stage-manifest.js';
import { buildRedCubeDomainAuthorityRefs } from './domain-authority-refs.js';
import { normalizeWorkspaceRoot } from './domain-action-adapter-parts/task-utils.js';
import standardAgentInterfaceDescriptor from '../../../../contracts/standard_agent_interface.json' with { type: 'json' };

const GENERATED_STAGE_CONTROL_PLANE_REF = {
  ref_kind: 'generated_surface',
  ref: 'opl-generated:family_stage_control_plane',
  source_ref: 'agent/stages/manifest.json',
};

function buildDomainEvidenceRefs() {
  return {
    live_stage_run_progress_evidence_ref:
      'contracts/live_stage_run_progress_evidence.json',
    production_acceptance_ref:
      'contracts/production_acceptance/rca-production-acceptance.json',
    no_regression_evidence_ref:
      'contracts/live_stage_run_progress_evidence.json#/no_regression_refs',
  };
}

function buildTypedBlockerRefs() {
  return {
    typed_blocker_refs_ref:
      'contracts/live_stage_run_progress_evidence.json#/typed_blocker_refs',
    human_gate_refs_ref:
      'contracts/live_stage_run_progress_evidence.json#/human_gate_refs',
  };
}

function buildStandardDomainAgentSkeleton() {
  return {
    surface_kind: 'standard_domain_agent_skeleton',
    version: 'standard-domain-agent-skeleton.v1',
    agent_id: 'rca',
    repo_source_boundary: {
      required_dirs: ['agent', 'contracts', 'runtime', 'docs'],
      optional_dirs: ['packages', 'python', 'plugins', 'tests'],
      forbidden_dirs: ['artifacts'],
      runtime_artifacts_live_in_source_repo: false,
    },
    contracts: {
      descriptor_refs: [
        'contracts/domain_descriptor.json',
        'contracts/standard_agent_interface.json',
        'contracts/pack_compiler_input.json',
        'agent/stages/manifest.json',
      ],
      sidecar_refs: [],
      quality_gate_refs: [
        'agent/quality_gates/visual_authority_boundaries.md',
        'agent/quality_gates/screenshot_review.md',
      ],
    },
    artifact_boundary: {
      repo_contains_real_artifacts: false,
      artifact_roots_are_locators: true,
      workspace_artifact_locator_refs: ['contracts/artifact_locator_contract.json'],
      runtime_artifact_locator_refs: ['contracts/artifact_locator_contract.json#/runtime_artifact_roots'],
    },
    authority_boundary: {
      opl: 'framework_transport_and_projection_only',
      domain: 'truth_quality_artifact_owner',
      opl_can_write_domain_truth: false,
      opl_can_authorize_quality_or_export: false,
      opl_can_mutate_artifact_body: false,
    },
  };
}

export async function getProductEntryManifest(request: Record<string, unknown> = {}) {
  const workspaceRoot = normalizeWorkspaceRoot(request);
  const runtime = {
    runtime_owner: 'one-person-lab',
    product_session_surface_ref: 'opl-generated:product_session',
    stage_folder_locator_contract_ref: 'contracts/artifact_locator_contract.json',
  };
  const domainAuthorityRefs = buildRedCubeDomainAuthorityRefs({
    workspaceRoot,
    runtime,
  });

  return {
    ok: true,
    surface_kind: 'product_entry_manifest',
    manifest_kind: 'rca_domain_authority_refs_projection',
    manifest_version: 'rca-domain-authority-refs.v1',
    agent_id: 'rca',
    target_domain_id: 'redcube_ai',
    standard_agent_interface_ref: 'contracts/standard_agent_interface.json#/standard_agent_interface',
    standard_agent_interface: structuredClone(
      standardAgentInterfaceDescriptor.standard_agent_interface,
    ),
    standard_domain_agent_skeleton: buildStandardDomainAgentSkeleton(),
    formal_entry: {
      default: 'CLI',
      supported_protocols: ['MCP'],
      internal_surface: 'controller',
    },
    workspace_locator: {
      workspace_surface_kind: 'redcube_workspace',
      workspace_root: workspaceRoot,
    },
    runtime,
    product_entry_shell: {},
    shared_handoff: buildRedCubeSharedHandoff(),
    family_action_catalog_ref: {
      ref_kind: 'repo_path',
      ref: FAMILY_ACTION_CATALOG_CONTRACT_REF,
      label: 'RedCube canonical action catalog',
    },
    declarative_stage_manifest_ref: DECLARATIVE_STAGE_MANIFEST_REF,
    family_stage_control_plane_ref: GENERATED_STAGE_CONTROL_PLANE_REF,
    ai_route_policy: domainAuthorityRefs.ai_route_policy,
    domain_evidence_refs: buildDomainEvidenceRefs(),
    typed_blocker_refs: buildTypedBlockerRefs(),
    receipt_refs: {
      owner_receipt_contract_ref: '/domain_owner_receipt_contract',
      domain_action_receipt_refs_ref: '/domain_action_adapter_receipt_refs',
      no_regression_receipt_ref: '/no_regression_owner_receipt_opl_consumption_proof',
    },
    artifact_locator_refs: {
      artifact_locator_contract_ref: '/artifact_locator_contract',
      stage_folder_locator_contract_ref: 'contracts/artifact_locator_contract.json',
    },
    domain_authority_refs: domainAuthorityRefs,
    authority_boundary: {
      projection_scope:
        'domain_evidence_typed_blocker_receipt_and_artifact_locator_refs_only',
      generic_product_shell_owner: 'one-person-lab',
      generic_workbench_owner: 'one-person-lab',
      generic_session_owner: 'one-person-lab',
      agent_lab_owner: 'one-person-lab',
      production_workorder_owner: 'one-person-lab',
      rca_owns_visual_truth: true,
      rca_owns_review_export_verdict: true,
      rca_owns_owner_receipt: true,
      opl_can_write_visual_truth: false,
      opl_can_authorize_review_or_export: false,
      opl_can_create_owner_receipt: false,
      opl_can_create_typed_blocker: false,
      projection_can_claim_domain_ready: false,
      projection_can_claim_production_ready: false,
    },
  };
}
