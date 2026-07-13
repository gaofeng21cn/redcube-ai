import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  buildFamilyDomainMemoryDescriptor,
  buildPhysicalSourceMorphologyPolicy,
  buildRedCubeDomainAuthorityRefs,
  buildVisualPackCompilerHandoffProjection,
  getRedCubeFamilyActionCatalog,
} from '../../packages/redcube-domain-entry/dist/index.js';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const repoRoot = path.resolve(__dirname, '..', '..');

export const requiredDomainPackPaths = [
  'agent/prompts/source_intake.md',
  'agent/prompts/communication_strategy.md',
  'agent/prompts/visual_direction.md',
  'agent/prompts/artifact_creation.md',
  'agent/prompts/review_and_revision.md',
  'agent/prompts/package_and_handoff.md',
  'agent/prompts/stage-quality-cycle-roles.md',
  'agent/stages/source_intake.md',
  'agent/stages/communication_strategy.md',
  'agent/stages/visual_direction.md',
  'agent/stages/artifact_creation.md',
  'agent/stages/review_and_revision.md',
  'agent/stages/package_and_handoff.md',
  'agent/skills/visual_deliverable_authoring.md',
  'agent/skills/native_helper_policy.md',
  'agent/skills/visual_memory_policy.md',
  'agent/professional_skills/rca-xhs-content-strategist/SKILL.md',
  'agent/professional_skills/rca-ppt-story-architect/SKILL.md',
  'agent/professional_skills/rca-ppt-visual-director/SKILL.md',
  'agent/professional_skills/rca-ppt-page-author/SKILL.md',
  'agent/professional_skills/rca-ppt-reviewer/SKILL.md',
  'agent/professional_skills/rca-native-ppt-designer/SKILL.md',
  'agent/professional_skills/rca-template-profiler/SKILL.md',
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

export const oplCanonicalGeneratedSurfaceIds = [
  'cli',
  'mcp',
  'skill',
  'product_entry_manifest',
  'domain_handler',
  'status_read_model',
  'workbench_drilldown',
  'functional_harness_cases',
];

const wrapperDescriptorScopeIds = [
  'product_entry',
  'product_status',
  'product_session',
  'domain_handler',
  'workbench',
];

const ownerDeltaNextDeltaKinds = [
  'artifact_producing_owner_receipt',
  'visual_review_export_receipt',
  'visual_memory_accept_reject_receipt',
  'workspace_receipt_scaleout_receipt',
  'production_like_no_regression_ref',
  'temporal_controlled_visual_stage_long_soak_ref',
  'human_review_receipt',
  'domain_owned_typed_blocker',
];

export const sharedFoundryPolicyRelease = {
  policy_release_contract_ref: 'contracts/opl-framework/foundry-agent-series-policy-release.json',
  policy_bundle_fingerprint: 'sha256:11dae4f01d2647ba77b5bee332ceda0004be62984daab26903abe85f61e36722',
  fingerprint_algorithm: 'sha256:stable-json',
  domain_contract_policy_release_pin_required: true,
  domain_adapter_must_not_copy_policy_body_as_authority: true,
  consumer_alignment_check: 'foundry:policy-release',
};

export function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(repoRoot, relativePath), 'utf8'));
}

function jsonStable(value) {
  return JSON.parse(JSON.stringify(value));
}

export function assertNoLegacyAuthorityFunctionFields(value, label) {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => assertNoLegacyAuthorityFunctionFields(entry, `${label}[${index}]`));
    return;
  }
  if (!value || typeof value !== 'object') return;

  if (value.contract_id === 'rca.minimal_authority_functions.v1') {
    assert.equal('allowed_functions' in value, false, label);
    assert.equal(Array.isArray(value.allowed_authority_surface_ids), true, label);
    assert.equal('authority_surface_boundaries' in value, true, label);
    assert.equal('function_boundaries' in value, false, label);
  }
  if (value.surface_kind === 'rca_minimal_authority_surface') {
    assert.equal('function_id' in value, false, label);
    assert.equal('legacy_function_id_compatibility' in value, false, label);
    assert.equal(typeof value.authority_surface_id, 'string', label);
  }
  if (value.authority_surface_taxonomy) {
    assert.equal('retained_functions' in value, false, label);
    assert.equal('retained_function_count' in value, false, label);
  }

  for (const [key, entry] of Object.entries(value)) {
    assertNoLegacyAuthorityFunctionFields(entry, `${label}.${key}`);
  }
}

export function assertCleanAgentRepoPathRef(refEntry, expectedPrefix, label) {
  assert.equal(refEntry.ref_kind, 'repo_path', label);
  assert.equal(refEntry.ref.startsWith(expectedPrefix), true, `${label}: ${refEntry.ref}`);
  const fullPath = path.join(repoRoot, refEntry.ref);
  assert.equal(fs.existsSync(fullPath), true, `${label}: ${refEntry.ref}`);
  const content = fs.readFileSync(fullPath, 'utf8');
  assert.notEqual(content.trim(), '', `${label}: ${refEntry.ref}`);
  assert.equal(/\b(?:TODO|TBD)\b/i.test(content), false, `${label}: ${refEntry.ref}`);
}

export function buildCanonicalPack() {
  const actionCatalog = getRedCubeFamilyActionCatalog();
  const declarativeStageManifest = readJson('agent/stages/manifest.json');
  const authorityRefs = buildRedCubeDomainAuthorityRefs({
    workspaceRoot: '<workspace_root>',
    runtime: {
      runtime_owner: 'codex_cli',
      runtime_state_root: '<runtime_state_root>',
      session_continuity_root: '<session_continuity_root>',
    },
  });
  const visualPackCompilerHandoff = buildVisualPackCompilerHandoffProjection();
  const functionalAudit = readJson('contracts/functional_privatization_audit.json');
  const generatedInterfaceConsumption = functionalAudit.opl_generated_interface_consumption;
  const generatedSurfaceIds = [
    ...oplCanonicalGeneratedSurfaceIds,
    ...wrapperDescriptorScopeIds,
  ];

  return jsonStable({
    actionCatalog: {
      ...actionCatalog,
      forbidden_generic_owner_roles: readJson('contracts/private_functional_surface_policy.json').forbidden_generic_owner_roles,
      generated_surface_owner: 'one-person-lab',
      domain_repo_can_own_generated_surface: false,
    },
    declarativeStageManifest,
    generatedStageControlPlaneRef: 'opl-generated:family_stage_control_plane',
    memoryDescriptor: {
      ...buildFamilyDomainMemoryDescriptor({
        domainMemoryDescriptorLocator: authorityRefs.domain_memory_descriptor_locator,
      }),
      root_contract_role: 'opl_standard_domain_agent_memory_descriptor',
      memory_body_owner: 'redcube_ai',
      opl_projection_policy: 'locator_and_receipt_refs_only',
    },
    artifactLocatorContract: authorityRefs.artifact_locator_contract,
    ownerReceiptContract: {
      ...authorityRefs.domain_owner_receipt_contract,
      stage_folder_writer_policy: readJson('contracts/owner_receipt_contract.json').stage_folder_writer_policy,
    },
    packCompilerInput: {
      surface_kind: 'opl_domain_pack_compiler_input',
      schema_version: 1,
      domain_id: 'redcube_ai',
      canonical_agent_id: 'rca',
      domain_pack_owner: 'redcube_ai',
      generated_surface_owner: 'one-person-lab',
      declarative_domain_pack: visualPackCompilerHandoff.declarative_visual_pack_input.required_input_families,
      canonical_semantic_pack_root: 'agent/',
      canonical_semantic_pack_role: 'repo_source_declarative_visual_pack',
      legacy_detail_asset_roots: [
        'prompts/ppt_deck/',
        'prompts/xiaohongshu/',
      ],
      legacy_detail_asset_policy: 'implementation_detail_prompt_assets_only_not_stage_control_prompt_refs',
      required_domain_pack_paths: visualPackCompilerHandoff.declarative_visual_pack_input.required_domain_pack_paths,
      minimal_authority_surface_ids: visualPackCompilerHandoff.minimal_authority_function_contract.allowed_authority_surface_ids,
      minimal_authority_surface_taxonomy: (
        visualPackCompilerHandoff.minimal_authority_function_contract.authority_surface_taxonomy
      ),
      minimal_authority_surface_contracts: (
        visualPackCompilerHandoff.minimal_authority_function_contract.authority_surface_contracts
      ),
    generated_surfaces_requested: [...new Set(generatedSurfaceIds)],
      generated_interface_consumption_ref: '/opl_generated_interface_consumption',
      repo_local_handler_targets: generatedInterfaceConsumption.repo_local_handler_targets,
      repo_local_handlers_are_generated_surface_owners: false,
      domain_repo_can_own_generated_surface: false,
      ...{ stage_pack_required_sections: visualPackCompilerHandoff.declarative_visual_pack_input.cognitive_stage_pack_contract.required_stage_sections, cognitive_kernel_adoption_ref: 'contracts/cognitive_kernel_adoption.json', golden_path_profile_ref: 'contracts/golden_path_profile.json', tool_refs: [visualPackCompilerHandoff.declarative_visual_pack_input.cognitive_stage_pack_contract.domain_affordance_catalog_ref], tool_affordance_boundary: visualPackCompilerHandoff.declarative_visual_pack_input.cognitive_stage_pack_contract.tool_affordance_boundary },
      visual_pack_discipline_contract: visualPackCompilerHandoff.declarative_visual_pack_input.visual_pack_discipline_contract,
      cognitive_stage_pack_contract: visualPackCompilerHandoff.declarative_visual_pack_input.cognitive_stage_pack_contract,
      markdown_marp_route_policy: visualPackCompilerHandoff.declarative_visual_pack_input.markdown_marp_route_policy,
      package_distribution_gate: visualPackCompilerHandoff.declarative_visual_pack_input.package_distribution_gate,
      source_refs: {
        canonical_semantic_pack: 'agent/',
        action_catalog: 'packages/redcube-domain-entry/src/actions/family-action-catalog.ts::getRedCubeFamilyActionCatalog',
        declarative_stage_manifest: 'agent/stages/manifest.json',
        generated_stage_control_plane: 'opl-generated:family_stage_control_plane',
        memory_descriptor: 'packages/redcube-domain-entry/src/actions/domain-authority-refs.ts::buildFamilyDomainMemoryDescriptor',
        functional_audit: 'contracts/functional_privatization_audit.json',
      },
      authority_boundary: {
        opl_can_write_domain_truth: false,
        opl_can_write_memory_body: false,
        opl_can_authorize_quality_or_export: false,
        domain_can_claim_generated_surface_owner: false,
      },
    },
    functionalAudit,
    privateFunctionalSurfacePolicy: {
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
        'ai_first_review_export_ref_materializer',
      ],
      purpose_first_owner_delta_policy: {
        default_operator_question: 'which_owner_must_produce_which_delta_or_typed_blocker',
        accepted_next_delta_kinds: ownerDeltaNextDeltaKinds,
        refs_only_accounting_is_progress: false,
        provider_completion_is_visual_progress: false,
        session_currentness_is_visual_progress: false,
        workbench_projection_is_visual_progress: false,
      },
      repo_local_owner_delta_surface_policy: {
        default_surface_role: 'refs_only_owner_delta_adapter_until_exit_gate',
        scoped_surface_ids: [
          'repo_local_wrapper',
          'product_entry_session',
          'runtime_watch',
          'operator_projection',
          'domain_action_adapter_compatibility',
          'neutral_route_run_record_adapter',
        ],
        allowed_roles_before_exit_gate: [
          'refs_only_adapter',
          'domain_handler_target',
          'native_helper_target',
          'migration_input',
          'negative_input_guard',
        ],
        required_next_delta_kinds: ownerDeltaNextDeltaKinds,
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
          'current_role_guard_no_alias_proof',
          'compressed_history_index_pointer',
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
      forbidden_generic_owner_roles: readJson('contracts/private_functional_surface_policy.json').forbidden_generic_owner_roles,
    },
    physicalSourceMorphologyPolicy: buildPhysicalSourceMorphologyPolicy(),
  });
}
