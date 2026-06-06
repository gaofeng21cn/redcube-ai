// @ts-nocheck
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  OPL_GENERATED_INTERFACE_CONSUMPTION,
  buildFamilyDomainMemoryDescriptor,
  buildPrivatizedFunctionalModuleAuditProjection,
  buildPhysicalSourceMorphologyPolicy,
  buildRedCubeActionMetadata,
  buildRedCubeFamilyStageControlPlane,
  buildStandardDomainAgentSkeleton,
  buildVisualPackCompilerHandoffProjection,
} from '../packages/redcube-domain-entry/dist/index.js';
import {
  expectedDomainSpecificProfile,
  expectedSeriesDesignProfile,
} from './opl-agent-pack-contracts-series-profile.ts';
import { REPO_LOCAL_SHARED_OWNER_RELEASE_CONTRACT_PATH } from '../scripts/run-test-group-lib.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

const requiredDomainPackPaths = [
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
  'agent/knowledge/owner_receipt_policy.md', 'agent/tools/domain_affordances.md',
];

const oplCanonicalGeneratedSurfaceIds = [
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

const sharedFoundryPolicyRelease = {
  policy_release_contract_ref: 'contracts/opl-framework/foundry-agent-series-policy-release.json',
  policy_bundle_fingerprint: 'sha256:5d77102e99e6e49acd88714cd94dcafe0969b8f2a5529928d753002ac3d4619d',
  fingerprint_algorithm: 'sha256:stable-json',
  domain_contract_policy_release_pin_required: true,
  domain_adapter_must_not_copy_policy_body_as_authority: true,
  consumer_alignment_check: 'foundry:policy-release',
};

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(repoRoot, relativePath), 'utf8'));
}

function jsonStable(value) {
  return JSON.parse(JSON.stringify(value));
}

function assertNoLegacyAuthorityFunctionFields(value, label) {
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

function assertCleanAgentRepoPathRef(refEntry, expectedPrefix, label) {
  assert.equal(refEntry.ref_kind, 'repo_path', label);
  assert.equal(refEntry.ref.startsWith(expectedPrefix), true, `${label}: ${refEntry.ref}`);
  const fullPath = path.join(repoRoot, refEntry.ref);
  assert.equal(fs.existsSync(fullPath), true, `${label}: ${refEntry.ref}`);
  const content = fs.readFileSync(fullPath, 'utf8');
  assert.notEqual(content.trim(), '', `${label}: ${refEntry.ref}`);
  assert.equal(/\b(?:TODO|TBD)\b/i.test(content), false, `${label}: ${refEntry.ref}`);
}

function buildCanonicalPack() {
  const actionCatalog = buildRedCubeActionMetadata().family_action_catalog;
  const stageControlPlane = buildRedCubeFamilyStageControlPlane({
    familyActionCatalog: actionCatalog,
  });
  const skeleton = buildStandardDomainAgentSkeleton({
    workspaceRoot: '<workspace_root>',
    runtime: {
      runtime_owner: 'codex_cli',
      runtime_state_root: '<runtime_state_root>',
      session_continuity_root: '<session_continuity_root>',
    },
    productEntrySessionCommand: 'opl_generated:product_session --entry-session-id <entry-session-id>',
  });
  const visualPackCompilerHandoff = buildVisualPackCompilerHandoffProjection();
  const functionalAudit = { ...buildPrivatizedFunctionalModuleAuditProjection(), fresh_large_private_surface_scan: readJson('contracts/functional_privatization_audit.json').fresh_large_private_surface_scan };
  const generatedSurfaceIds = [
    ...oplCanonicalGeneratedSurfaceIds,
    ...wrapperDescriptorScopeIds,
  ];

  return jsonStable({
    actionCatalog: {
      ...actionCatalog,
      forbidden_generic_owner_roles: readJson('contracts/action_catalog.json').forbidden_generic_owner_roles,
      generated_surface_owner: 'one-person-lab',
      domain_repo_can_own_generated_surface: false,
    },
    stageControlPlane,
    memoryDescriptor: {
      ...buildFamilyDomainMemoryDescriptor({
        domainMemoryDescriptorLocator: skeleton.domain_memory_descriptor_locator,
      }),
      root_contract_role: 'opl_standard_domain_agent_memory_descriptor',
      memory_body_owner: 'redcube_ai',
      opl_projection_policy: 'locator_and_receipt_refs_only',
    },
    artifactLocatorContract: skeleton.artifact_locator_contract,
    ownerReceiptContract: skeleton.domain_owner_receipt_contract,
    packCompilerInput: {
      surface_kind: 'opl_domain_pack_compiler_input',
      schema_version: 1,
      domain_id: 'redcube_ai',
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
      repo_local_handler_targets: OPL_GENERATED_INTERFACE_CONSUMPTION.repo_local_handler_targets,
      repo_local_handlers_are_generated_surface_owners: false,
      domain_repo_can_own_generated_surface: false,
      ...{ stage_pack_required_sections: visualPackCompilerHandoff.declarative_visual_pack_input.cognitive_stage_pack_contract.required_stage_sections, cognitive_kernel_adoption_ref: 'contracts/cognitive_kernel_adoption.json', golden_path_profile_ref: 'contracts/golden_path_profile.json', tool_refs: [visualPackCompilerHandoff.declarative_visual_pack_input.cognitive_stage_pack_contract.domain_affordance_catalog_ref], tool_affordance_boundary: visualPackCompilerHandoff.declarative_visual_pack_input.cognitive_stage_pack_contract.tool_affordance_boundary },
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
    },
    functionalAudit: {
      surface_kind: 'functional_privatization_audit',
      schema_version: 1,
      domain_id: 'redcube_ai',
      target_domain_id: 'redcube_ai',
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
    },
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
      forbidden_generic_owner_roles: readJson('contracts/action_catalog.json').forbidden_generic_owner_roles,
    },
    physicalSourceMorphologyPolicy: buildPhysicalSourceMorphologyPolicy(),
  });
}

test('root OPL pack contracts stay aligned with RCA canonical metadata', () => {
  const canonical = buildCanonicalPack();

  const foundrySeries = readJson('contracts/foundry_agent_series.json');
  const domainDescriptor = readJson('contracts/domain_descriptor.json');
  assert.deepEqual(readJson('contracts/action_catalog.json'), canonical.actionCatalog);
  assert.deepEqual(readJson('contracts/stage_control_plane.json'), canonical.stageControlPlane);
  assert.deepEqual(readJson('contracts/memory_descriptor.json'), canonical.memoryDescriptor);
  assert.deepEqual(readJson('contracts/artifact_locator_contract.json'), canonical.artifactLocatorContract);
  assert.deepEqual(readJson('contracts/owner_receipt_contract.json'), canonical.ownerReceiptContract);
  assert.deepEqual(readJson('contracts/pack_compiler_input.json'), canonical.packCompilerInput);
  assert.deepEqual(readJson('contracts/functional_privatization_audit.json'), canonical.functionalAudit);
  assert.deepEqual(
    readJson('contracts/private_functional_surface_policy.json'),
    canonical.privateFunctionalSurfacePolicy,
  );
  assert.deepEqual(
    readJson('contracts/physical_source_morphology_policy.json'),
    canonical.physicalSourceMorphologyPolicy,
  );
  assert.equal(foundrySeries.surface_kind, 'opl_foundry_agent_series_contract');
  assert.equal(foundrySeries.version, 'foundry-agent-series.v1');
  assert.equal(foundrySeries.product_layer, 'foundry_agent');
  assert.equal(foundrySeries.domain_id, 'redcube');
  assert.equal(foundrySeries.stage_control_plane_target_domain_id, 'redcube_ai');
  assert.equal(domainDescriptor.foundry_agent_series_contract_ref, 'contracts/foundry_agent_series.json');
  assert.deepEqual(foundrySeries.series_design_profile, expectedSeriesDesignProfile);
  assert.deepEqual(domainDescriptor.series_design_profile, foundrySeries.series_design_profile);
  assert.deepEqual(foundrySeries.domain_specific_profile, expectedDomainSpecificProfile);
  assert.deepEqual(domainDescriptor.domain_specific_profile, foundrySeries.domain_specific_profile);
  assert.deepEqual(foundrySeries.domain_specific_profile.peer_agent_ids, ['mas', 'mag', 'oma']);
  assert.equal(
    foundrySeries.domain_specific_profile.shared_lifecycle_policy,
    'rca_uses_the_same_opl_agent_lifecycle_as_mas_mag_oma_without_forking_runtime',
  );
  assert.equal(
    foundrySeries.domain_specific_profile.domain_specialization.input_profile,
    'visual_materials_sources_brand_assets_images_documents_and_delivery_brief',
  );
  assert.equal(
    foundrySeries.domain_specific_profile.domain_specialization.output_profile,
    'visual_deliverables_ppt_pdf_png_export_bundle_and_handoff_refs',
  );
  assert.equal(foundrySeries.domain_specific_profile.rca_domain_authority.visual_truth_owner, 'redcube_ai');
  assert.equal(foundrySeries.domain_specific_profile.rca_domain_authority.review_export_verdict_owner, 'redcube_ai');
  assert.equal(foundrySeries.domain_specific_profile.rca_domain_authority.artifact_authority_owner, 'redcube_ai');
  assert.equal(foundrySeries.domain_specific_profile.rca_domain_authority.visual_memory_accept_reject_owner, 'redcube_ai');
  assert.equal(foundrySeries.domain_specific_profile.rca_domain_authority.owner_receipt_owner, 'redcube_ai');
  assert.equal(foundrySeries.domain_specific_profile.opl_boundary.generated_descriptors_owner, 'one-person-lab');
  assert.equal(foundrySeries.domain_specific_profile.opl_boundary.can_write_visual_truth, false);
  assert.equal(foundrySeries.domain_specific_profile.opl_boundary.can_authorize_review_export_verdict, false);
  assert.equal(foundrySeries.domain_specific_profile.opl_boundary.can_mutate_canonical_artifacts, false);
  assert.equal(foundrySeries.domain_specific_profile.opl_boundary.can_accept_or_reject_visual_memory, false);
  assert.equal(foundrySeries.domain_specific_profile.opl_boundary.can_issue_rca_owner_receipt, false);
  assert.equal(foundrySeries.domain_specific_profile.conformance_policy.descriptor_resolved, true);
  assert.equal(foundrySeries.domain_specific_profile.conformance_policy.no_runtime_fork_required, true);
  assert.deepEqual(foundrySeries.contract_version_policy, {
    current_version: 'foundry-agent-series.v1',
    domain_contract_ref: 'contracts/foundry_agent_series.json',
    exact_version_pin_required: true,
    compatible_version_range: ['foundry-agent-series.v1'],
    breaking_change_requires_new_version: true,
    domain_descriptor_must_reference_domain_contract: true,
  });
  assert.deepEqual(foundrySeries.shared_release_pin_strategy, {
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
  });
  assert.deepEqual(foundrySeries.shared_policy_release, sharedFoundryPolicyRelease);
  assert.deepEqual(foundrySeries.identity_hygiene_policy.canonical_identities, {
    series_domain_id: foundrySeries.domain_id,
    foundry_agent_id: foundrySeries.foundry_agent_id,
    domain_authority_owner_id: foundrySeries.authority_owner,
    stage_control_plane_target_domain_id: foundrySeries.stage_control_plane_target_domain_id,
    public_package_or_skill_id: 'redcube-ai',
    shorthand_alias: 'rca',
    domain_aliases: foundrySeries.domain_aliases,
  });
  assert.deepEqual(
    Object.fromEntries(
      foundrySeries.identity_hygiene_policy.identity_role_bindings.map((entry) => [entry.identity, entry]),
    ),
    {
      redcube: {
        identity: 'redcube',
        role: 'foundry_series_identity',
        authority_source: false,
        public_package_or_skill_id: false,
        generated_surface_owner: false,
      },
      redcube_ai: {
        identity: 'redcube_ai',
        role: 'domain_authority_owner_and_stage_control_target',
        authority_source: true,
        public_package_or_skill_id: false,
        generated_surface_owner: false,
      },
      'redcube-ai': {
        identity: 'redcube-ai',
        role: 'public_package_and_skill_identity',
        authority_source: false,
        public_package_or_skill_id: true,
        generated_surface_owner: false,
      },
      rca: {
        identity: 'rca',
        role: 'shorthand_alias',
        authority_source: false,
        public_package_or_skill_id: false,
        generated_surface_owner: false,
      },
    },
  );
  assert.deepEqual(foundrySeries.identity_hygiene_policy.alias_authority_policy, {
    domain_aliases_do_not_define_authority: true,
    authority_owner_must_equal: foundrySeries.authority_owner,
    stage_control_plane_target_must_equal: foundrySeries.stage_control_plane_target_domain_id,
    public_package_or_skill_must_equal: 'redcube-ai',
    shorthand_alias_must_equal: 'rca',
  });
  assert.deepEqual(foundrySeries.identity_hygiene_policy.readiness_claim_boundary, {
    identity_hygiene_contract_only: true,
    can_claim_visual_ready: false,
    can_claim_exportable: false,
    can_claim_handoffable: false,
    can_claim_domain_ready: false,
    can_claim_production_ready: false,
  });
  assert.equal(foundrySeries.domain_adapter_policy.no_parallel_progress_schema, true);
  const thinning = foundrySeries.purpose_first_adapter_thinning_policy;
  assert.deepEqual(thinning.default_retained_surface_roles, [
    'refs_only_adapter',
    'domain_handler_target',
    'minimal_authority_function',
    'migration_input',
    'history_or_tombstone_provenance',
  ]);
  assert.equal(
    thinning.default_operator_delta_shape,
    'visual_deliverable_progress_delta_or_rca_owned_typed_blocker',
  );
  assert.deepEqual(thinning.physical_delete_required_gates, [
    'replacement_parity',
    'no_active_caller',
    'owner_receipt_or_typed_blocker',
    'no_forbidden_write',
    'tombstone_or_provenance',
  ]);
  assert.equal(
    thinning.evidence_tail_boundary.missing_visual_review_or_export_gate_returns,
    'rca_owned_typed_blocker',
  );
  assert.equal(thinning.evidence_tail_boundary.descriptor_ready_is_visual_ready, false);
  assert.equal(
    thinning.legacy_alias_guard.managed_gateway_session_domain_action_adapter_terms_are_authority_sources,
    false,
  );
  assert.equal(thinning.legacy_alias_guard.may_be_active_public_surface, false);
  assert.equal(thinning.legacy_alias_guard.may_be_generic_owner_surface, false);
  assert.equal(foundrySeries.app_projection_policy.app_consumes_shared_progress_projection_only, true);
  assert.equal(foundrySeries.app_projection_policy.app_can_read_domain_body, false);
});

test('RCA physical source morphology policy classifies active source tails without generic ownership', () => {
  const policy = readJson('contracts/physical_source_morphology_policy.json');
  const byId = Object.fromEntries(policy.active_surface_classifications.map((entry) => [entry.surface_id, entry]));

  assert.equal(policy.surface_kind, 'rca_physical_source_morphology_policy');
  assert.equal(policy.status, 'active_source_classification_policy_landed');
  assert.equal(policy.canonical_pack_root, 'agent/');
  assert.equal(policy.legacy_name_policy.compatibility_alias_allowed, false);
  assert.equal(policy.legacy_name_policy.allowance_required_for_active_surface_text_matches, true);
  assert.equal(policy.legacy_name_policy.active_generic_runtime_owner_allowed, false);
  assert.equal(policy.legacy_name_policy.active_generic_domain_entry_owner_allowed, false);
  assert.equal(policy.legacy_name_policy.active_generic_gateway_owner_allowed, false);
  assert.equal(policy.legacy_name_policy.active_generic_session_runtime_owner_allowed, false);
  assert.deepEqual(policy.legacy_name_policy.tracked_legacy_terms, [
    'managed',
    'runtime',
    'gateway',
    'session',
    'domain_action_adapter',
  ]);
  assert.deepEqual(policy.legacy_name_policy.allowed_legacy_name_roles, [
    'machine_contract_ref',
    'package_protocol_boundary',
    'service_safe_domain_entry',
    'contract_safe_semantic_id',
    'tombstone_or_provenance',
    'negative_test_guard',
    'refs_only_read_model',
    'domain_handler_target',
    'minimal_visual_authority_function',
    'visual_native_helper_path',
    'locator_protocol_boundary',
  ]);
  assert.deepEqual(policy.legacy_name_policy.forbidden_active_surface_ids, [
    'legacy_managed_runtime_gateway_names',
  ]);
  assert.equal(policy.legacy_name_policy.package_protocol_boundary_policy.package_name, '@redcube/domain-entry');
  assert.equal(policy.legacy_name_policy.package_protocol_boundary_policy.public_identity, 'redcube-ai');
  assert.equal(policy.legacy_name_policy.package_protocol_boundary_policy.public_framework_identity_allowed, false);
  assert.equal(policy.new_surface_admission_gate.must_classify_before_active_caller, true);
  assert.equal(policy.new_surface_admission_gate.reopen_gap_if_forbidden_owner_role_appears, true);
  assert.equal(policy.allowed_surface_classes.includes('package_protocol_boundary'), true);
  assert.equal(policy.allowed_surface_classes.includes('service_safe_domain_entry'), true);
  assert.equal(policy.allowed_surface_classes.includes('refs_only_read_model'), true);
  assert.equal(policy.allowed_surface_classes.includes('minimal_visual_authority_function'), true);

  assert.equal(byId.mcp_product_entry_domain_entry.classification, 'service_safe_domain_entry');
  assert.equal(byId.redcube_cli_domain_entry_adapter.classification, 'service_safe_domain_entry');
  assert.equal(byId.redcube_domain_entry_package_protocol_boundary.classification, 'package_protocol_boundary');
  assert.equal(byId.product_entry_continuity_refs_adapter.classification, 'refs_only_read_model');
  assert.equal(byId.workspace_run_envelope_helpers.classification, 'refs_only_read_model');
  assert.equal(byId.runtime_watch_projection.classification, 'refs_only_read_model');
  assert.equal(byId.domain_action_adapter_guarded_actions.classification, 'domain_handler_target');
  assert.equal(byId.operator_evidence_stability_projection.classification, 'refs_only_read_model');
  assert.equal(byId.visual_authority_functions.classification, 'minimal_visual_authority_function');
  assert.equal(byId.legacy_managed_runtime_gateway_names, undefined);
  assert.equal(byId.retired_product_entry_contract_tombstone_refs.classification, 'tombstone_or_provenance');
  assert.deepEqual(byId.retired_product_entry_contract_tombstone_refs.retired_legacy_refs, [
    'contracts/runtime-program/managed-product-entry-hardening.json',
  ]);

  assert.deepEqual(byId.product_entry_continuity_refs_adapter.source_refs, [
    'packages/redcube-runtime/src/product-entry-continuity-ref-adapter.ts',
    'packages/redcube-domain-entry/src/actions/get-product-entry-session.ts',
    'packages/redcube-domain-entry/src/actions/get-product-entry-session-parts/session-artifacts.ts',
    'packages/redcube-domain-entry/src/actions/get-product-entry-session-parts/session-surfaces.ts',
    'packages/redcube-domain-entry/src/actions/product-entry-continuity-surfaces.ts',
  ]);
  assert.deepEqual(byId.runtime_watch_projection.source_refs, [
    'packages/redcube-domain-entry/src/actions/run-review-ref-projection.ts',
  ]);
  assert.deepEqual(byId.redcube_domain_entry_package_protocol_boundary.source_refs, [
    'packages/redcube-domain-entry/package.json',
    'packages/redcube-domain-entry/src/index.ts',
  ]);
  assert.deepEqual(byId.redcube_cli_domain_entry_adapter.source_refs, [
    'apps/redcube-cli/package.json',
    'apps/redcube-cli/src/cli-parts/dispatch.ts',
    'apps/redcube-cli/src/cli-parts/help.ts',
    'apps/redcube-cli/src/types.ts',
  ]);
  assert.equal(
    byId.redcube_cli_domain_entry_adapter.current_rca_role,
    'direct_cli_adapter_domain_handler_target_not_generated_wrapper_owner',
  );
  assert.deepEqual(byId.redcube_cli_domain_entry_adapter.legacy_name_allowance.allowed_as, [
    'service_safe_domain_entry',
    'domain_handler_target',
    'refs_only_read_model',
    'package_protocol_boundary',
  ]);
  assert.equal(
    byId.redcube_cli_domain_entry_adapter.no_resurrection_gate.generic_cli_wrapper_owner_allowed,
    false,
  );
  assert.equal(
    byId.redcube_cli_domain_entry_adapter.no_resurrection_gate.generic_workbench_owner_allowed,
    false,
  );
  assert.equal(byId.redcube_domain_entry_package_protocol_boundary.legacy_name_allowance, undefined);
  assert.equal(
    byId.product_entry_continuity_refs_adapter.current_rca_role,
    'entry_session_domain_snapshot_refs_only_adapter_consuming_opl_generated_session_shell',
  );
  assert.deepEqual(byId.product_entry_continuity_refs_adapter.legacy_name_allowance.allowed_as, [
    'refs_only_read_model',
    'contract_safe_semantic_id',
    'locator_protocol_boundary',
  ]);
  assert.equal(byId.product_entry_continuity_refs_adapter.legacy_name_allowance.compatibility_alias_allowed, false);
  assert.deepEqual(byId.runtime_watch_projection.legacy_name_allowance.allowed_as, [
    'refs_only_read_model',
    'negative_test_guard',
  ]);
  assert.equal(byId.runtime_watch_projection.legacy_name_allowance.active_generic_runtime_owner_allowed, false);
  assert.equal(
    byId.runtime_watch_projection.current_rca_role,
    'run_review_existing_run_locator_refs_only_projection_not_supervisor',
  );
  assert.deepEqual(byId.workspace_run_envelope_helpers.machine_boundary_refs, [
    'packages/redcube-runtime-protocol/src/workspace.ts#WORKSPACE_LOCATOR_ENVELOPE_BOUNDARY',
    'packages/redcube-runtime-protocol/src/runs.ts#RUN_LOCATOR_ENVELOPE_BOUNDARY',
  ]);
  assert.equal(
    byId.workspace_run_envelope_helpers.no_resurrection_gate.generic_attempt_ledger_owner_allowed,
    false,
  );
  assert.deepEqual(byId.runtime_watch_projection.machine_boundary_refs, [
    'packages/redcube-domain-entry/src/actions/run-review-ref-projection.ts#RUNTIME_WATCH_BOUNDARY',
  ]);
  assert.equal(
    byId.runtime_watch_projection.no_resurrection_gate.generic_supervisor_owner_allowed,
    false,
  );
  assert.equal(
    byId.runtime_watch_projection.no_resurrection_gate.default_supervision_route_allowed,
    false,
  );
  assert.equal(
    byId.domain_action_adapter_guarded_actions.current_rca_role,
    'guarded_domain_action_target_and_refs_only_domain_action_adapter_adapter_not_domain_action_adapter_owner',
  );
  assert.equal(
    byId.operator_evidence_stability_projection.current_rca_role,
    'operator_evidence_and_stability_refs_only_read_model_consuming_opl_workbench',
  );
  assert.equal(
    byId.domain_action_adapter_guarded_actions.allowed_outputs.includes('visual_transition_decision_refs'),
    true,
  );
  assert.equal(
    byId.operator_evidence_stability_projection.allowed_outputs.includes('stability_read_model_refs'),
    true,
  );

  for (const entry of policy.active_surface_classifications) {
    for (const value of Object.values(entry.forbidden_generic_owner_flags)) {
      assert.equal(value, false, entry.surface_id);
    }
  }
});

test('RCA canonical semantic pack paths are concrete, clean, and stage semantic refs resolve under agent', () => {
  const packCompilerInput = readJson('contracts/pack_compiler_input.json');
  const stageControlPlane = readJson('contracts/stage_control_plane.json');

  assert.equal(packCompilerInput.canonical_semantic_pack_root, 'agent/');
  assert.equal(packCompilerInput.canonical_semantic_pack_role, 'repo_source_declarative_visual_pack');
  assert.deepEqual(packCompilerInput.legacy_detail_asset_roots, [
    'prompts/ppt_deck/',
    'prompts/xiaohongshu/',
  ]);
  assert.equal(
    packCompilerInput.legacy_detail_asset_policy,
    'implementation_detail_prompt_assets_only_not_stage_control_prompt_refs',
  );
  assert.deepEqual(packCompilerInput.required_domain_pack_paths, requiredDomainPackPaths);

  for (const relativePath of packCompilerInput.required_domain_pack_paths) {
    assert.equal(relativePath.startsWith('agent/'), true, relativePath);
    const fullPath = path.join(repoRoot, relativePath);
    assert.equal(fs.existsSync(fullPath), true, relativePath);
    const content = fs.readFileSync(fullPath, 'utf8');
    assert.notEqual(content.trim(), '', relativePath);
    assert.equal(/\b(?:TODO|TBD)\b/i.test(content), false, relativePath);
  }

  const stageIds = stageControlPlane.stages.map((stage) => stage.stage_id);
  assert.deepEqual(stageIds, [
    'source_intake',
    'communication_strategy',
    'visual_direction',
    'artifact_creation',
    'review_and_revision',
    'package_and_handoff',
  ]);

  for (const stage of stageControlPlane.stages) {
    assert.deepEqual(stage.prompt_refs, [
      {
        ref_kind: 'repo_path',
        ref: `agent/prompts/${stage.stage_id}.md`,
        role: 'canonical_stage_prompt_policy',
      },
    ], stage.stage_id);
    assert.equal(stage.stage_contract.source_scope_refs.length > 0, true, stage.stage_id);
    assert.equal(stage.stage_contract.cohort_query_refs.length > 0, true, stage.stage_id);
    assert.equal(stage.stage_contract.trigger_refs.length > 0, true, stage.stage_id);
    assert.equal(stage.stage_contract.monitor_refs.length > 0, true, stage.stage_id);
    assert.equal(stage.stage_contract.dashboard_metric_refs.length > 0, true, stage.stage_id);
    assert.equal(stage.stage_contract.metric_refs.length >= 4, true, stage.stage_id);
    assert.equal(
      stage.stage_contract.progress_delta_policy.surface_kind,
      'opl_stage_progress_delta_policy',
      stage.stage_id,
    );
    assert.deepEqual(
      stage.stage_contract.progress_delta_policy.required_fields,
      [
        'progress_delta_classification',
        'deliverable_progress_delta',
        'platform_repair_delta',
        'next_forced_delta',
      ],
      stage.stage_id,
    );
    assert.equal(
      stage.stage_contract.progress_delta_policy.platform_only_is_not_deliverable_progress,
      true,
      stage.stage_id,
    );
    assert.equal(
      stage.stage_contract.typed_blocker_lineage_policy.surface_kind,
      'family-stall-lineage.v1',
      stage.stage_id,
    );
    assert.equal(
      stage.stage_contract.typed_blocker_lineage_policy.required_fields.includes('blocker_family'),
      true,
      stage.stage_id,
    );
    assert.equal(
      stage.stage_contract.typed_blocker_lineage_policy.required_fields.includes('repeat_count'),
      true,
      stage.stage_id,
    );
    assert.equal(
      stage.stage_contract.typed_blocker_lineage_policy.required_fields.includes('next_forced_delta'),
      true,
      stage.stage_id,
    );
    assert.equal(
      stage.stage_contract.typed_blocker_lineage_policy.required_fields.includes('escalation_owner'),
      true,
      stage.stage_id,
    );
    assert.equal(
      stage.stage_contract.metric_refs.some((metricRef) => metricRef.role === 'expected_success_ref'),
      true,
      stage.stage_id,
    );
    assert.equal(
      stage.stage_contract.metric_refs.some((metricRef) => metricRef.role === 'boundary_success_rate_ref'),
      true,
      stage.stage_id,
    );
    assert.deepEqual(stage.stage_contract.recorded_runtime_event_refs, stage.stage_contract.runtime_event_refs);
    assert.deepEqual(stage.stage_contract.owner_receipt_refs, [`owner_receipt:${stage.stage_id}`]);
    assert.equal(stage.stage_contract.append_only_event_log_refs.length, 1, stage.stage_id);
    assert.equal(stage.stage_contract.attempt_ledger_refs.length, 1, stage.stage_id);
    assert.deepEqual(stage.stage_contract.cross_provider_attempt_index, {
      surface_kind: 'cross_provider_attempt_index',
      version: 'cross-provider-attempt-index.v1',
      owner: 'one-person-lab',
      provider_attempt_owner: 'one-person-lab',
      domain_adapter_owner: 'redcube_ai',
      local_session_ref: `/session_continuity/${stage.stage_id}`,
      provider_attempt_ledger_ref: `attempt-ledger:opl/redcube_ai/${stage.stage_id}`,
      provider_attempt_ref_required: true,
      provider_attempt_ledger_ref_required: true,
      missing_provider_ledger_policy: 'fail_closed_typed_blocker_projection',
      local_session_ref_is_not_provider_attempt_ref: true,
      rca_does_not_own_provider_attempt_ledger: true,
      can_claim_current_without_provider_ledger: false,
    }, stage.stage_id);
    assert.equal(
      stage.stage_contract.closeout_receipt_refs.includes(`owner_receipt:${stage.stage_id}`),
      true,
      stage.stage_id,
    );
    assert.deepEqual(
      stage.stage_contract.replay_evidence_refs.map((replayRef) => replayRef.role),
      [
        'append_only_event_log_ref',
        'opl_stage_attempt_ledger_ref',
        'recorded_runtime_event_refs',
        'stage_closeout_receipt_ref',
        'domain_owner_receipt_ref',
      ],
      stage.stage_id,
    );
    assert.equal(stage.authority_boundary.provider_completion_is_visual_ready, false, stage.stage_id);
    assert.equal(stage.authority_boundary.provider_completion_is_exportable, false, stage.stage_id);
    assert.equal(stage.authority_boundary.provider_completion_is_domain_ready, false, stage.stage_id);
    assert.equal(
      stage.stage_contract.trigger_refs.some((triggerRef) =>
        triggerRef.role === 'opl_provider_stage_launch_trigger'),
      true,
      stage.stage_id,
    );
    assertCleanAgentRepoPathRef(stage.prompt_refs[0], 'agent/prompts/', `${stage.stage_id}.prompt_refs`);
    const stageSkillRefs = stage.skills.filter((skill) => skill.ref_kind === 'repo_path');
    assert.equal(stageSkillRefs.length > 0, true, stage.stage_id);
    assert.equal(
      stage.skills.some((skill) => skill.ref_kind === 'skill_id' && skill.ref === 'redcube-ai'),
      true,
      stage.stage_id,
    );
    for (const [index, skillRef] of stageSkillRefs.entries()) {
      assertCleanAgentRepoPathRef(skillRef, 'agent/skills/', `${stage.stage_id}.skills[${index}]`);
    }
    assert.equal(Array.isArray(stage.knowledge_refs), true, stage.stage_id);
    assert.equal(stage.knowledge_refs.length > 0, true, stage.stage_id);
    for (const [index, knowledgeRef] of stage.knowledge_refs.entries()) {
      assertCleanAgentRepoPathRef(knowledgeRef, 'agent/knowledge/', `${stage.stage_id}.knowledge_refs[${index}]`);
    }
    assert.equal(Array.isArray(stage.evaluation), true, stage.stage_id);
    assert.equal(stage.evaluation.length > 0, true, stage.stage_id);
    assert.equal(
      stage.evaluation.some((evaluationRef) => evaluationRef.role === 'owner_receipt_gate'),
      true,
      stage.stage_id,
    );
    for (const [index, evaluationRef] of stage.evaluation.entries()) {
      assertCleanAgentRepoPathRef(evaluationRef, 'agent/quality_gates/', `${stage.stage_id}.evaluation[${index}]`);
    }
    assert.equal(stage.legacy_prompt_asset_refs.length, 2, stage.stage_id);
    for (const legacyRef of stage.legacy_prompt_asset_refs) {
      assert.equal(legacyRef.ref.startsWith('prompts/'), true, stage.stage_id);
    }
  }
});

test('RCA root generated surface handoff names OPL as owner for skill, product status, and session metadata', () => {
  const packCompilerInput = readJson('contracts/pack_compiler_input.json');
  const generatedSurfaceHandoff = readJson('contracts/generated_surface_handoff.json');
  const functionalAudit = readJson('contracts/functional_privatization_audit.json');
  const generatedScope = functionalAudit
    .privatized_functional_module_audit
    .generated_interface_consumption
    .generated_descriptor_scope;
  const requestedSurfaces = packCompilerInput.generated_surfaces_requested;
  const handoffSurfaceIds = generatedSurfaceHandoff.generated_surfaces.map((surface) => surface.surface_id);
  const authorityTaxonomy = packCompilerInput.minimal_authority_surface_taxonomy;

  for (const surfaceId of generatedScope) {
    assert.equal(requestedSurfaces.includes(surfaceId), true, surfaceId);
    assert.equal(handoffSurfaceIds.includes(surfaceId), true, surfaceId);
  }
  for (const surfaceId of oplCanonicalGeneratedSurfaceIds) {
    assert.equal(requestedSurfaces.includes(surfaceId), true, surfaceId);
    assert.equal(handoffSurfaceIds.includes(surfaceId), true, surfaceId);
  }
  for (const surface of generatedSurfaceHandoff.generated_surfaces) {
    assert.equal(surface.owner, 'one-person-lab', surface.surface_id);
    assert.equal(surface.domain_repo_can_own_generated_surface, false, surface.surface_id);
  }
  assert.equal(generatedSurfaceHandoff.repo_local_launcher_policy.cli_mcp_skill_product_status_workbench_metadata_owner, 'one-person-lab');
  assert.equal(generatedSurfaceHandoff.repo_local_launcher_policy.default_generic_dispatch_owner, 'one-person-lab');
  assert.equal(generatedSurfaceHandoff.repo_local_launcher_policy.domain_handler_role, 'domain_handler_target_with_internal_domain_action_adapter_implementation_refs_only');
  assert.equal(generatedSurfaceHandoff.repo_local_launcher_policy.default_supervision_owner, 'one-person-lab');
  assert.equal(generatedSurfaceHandoff.repo_local_launcher_policy.legacy_supervision_public_surface, 'retired');
  assert.equal(generatedSurfaceHandoff.bridge_exit_gate.gate_id, 'rca.generated_surface_bridge_exit.v1');
  assert.equal(generatedSurfaceHandoff.bridge_exit_gate.current_rca_status, 'opl_generated_surface_consumed_domain_handlers_only');
  assert.deepEqual(generatedSurfaceHandoff.bridge_exit_gate.required_before_retiring_repo_local_wrappers, [
    'domain_authority_refs_preserved',
    'no_regression_proof_recorded',
  ]);
  assert.equal(
    generatedSurfaceHandoff.bridge_exit_gate.repo_local_forbidden_roles.includes('generic_session_shell_owner'),
    true,
  );
  assert.equal(generatedSurfaceHandoff.bridge_exit_gate.rca_can_own_generated_surface, false);
  assert.equal(generatedSurfaceHandoff.bridge_exit_gate.declares_generated_surface_consumption_complete, true);
  assert.equal(generatedSurfaceHandoff.bridge_exit_gate.declares_production_consumption_complete, true);
  assert.equal(
    generatedSurfaceHandoff.bridge_exit_gate.production_consumption_scope,
    'opl_generated_surface_consumption_only_not_visual_stage_live_soak',
  );
  assert.equal(generatedSurfaceHandoff.bridge_exit_gate.declares_visual_stage_long_soak_complete, false);
  assert.deepEqual(generatedSurfaceHandoff.bridge_exit_gate.remaining_blocker_ids, []);
  assert.deepEqual(generatedSurfaceHandoff.bridge_exit_gate.remaining_evidence_gate_ids, [
    'real_artifact_producing_domain_owner_receipt',
    'opl_hosted_controlled_visual_stage_long_soak',
    'real_memory_lifecycle_receipt_instances',
    'cross_family_repeated_no_regression_evidence',
  ]);
  assert.deepEqual(authorityTaxonomy.ai_first_judgment_surface_ids, [
    'source_readiness_verdict',
    'communication_visual_direction_decision',
    'review_export_verdict',
    'visual_memory_accept_reject',
  ]);
  assert.deepEqual(authorityTaxonomy.programmatic_authority_surface_ids, [
    'artifact_mutation_authorization',
    'owner_receipt_signer',
    'native_helper_implementation',
  ]);
  assert.equal(authorityTaxonomy.programmatic_verdict_generation_allowed, false);
  assert.equal(packCompilerInput.minimal_authority_surface_contracts.length, 7);
  for (const surface of packCompilerInput.minimal_authority_surface_contracts) {
    assert.equal(surface.surface_kind, 'rca_minimal_authority_surface', surface.authority_surface_id);
    assert.equal('function_id' in surface, false, surface.authority_surface_id);
    assert.equal('legacy_function_id_compatibility' in surface, false, surface.authority_surface_id);
    assert.equal(surface.mechanical_decision_forbidden, true, surface.authority_surface_id);
    assert.equal(surface.programmatic_verdict_generation_allowed, false, surface.authority_surface_id);
    assert.equal(
      surface.decision_boundary.programmatic_role_may_compute_ready_verdict,
      false,
      surface.authority_surface_id,
    );
  }

  const visualPackDisciplineContract = packCompilerInput.visual_pack_discipline_contract;
  assert.equal(visualPackDisciplineContract.owner, 'redcube_ai');
  assert.equal(visualPackDisciplineContract.policy_ref, 'agent/quality_gates/visual_pack_discipline.md');
  assert.equal(visualPackDisciplineContract.required_before_artifact_creation, true);
  const brandPrecedence = visualPackDisciplineContract.brand_profile_precedence;
  const materialPass = visualPackDisciplineContract.source_material_pass_transparency;
  const densityEvidence = visualPackDisciplineContract.layout_density_sparse_page_evidence;
  const disciplineClaims = [
    brandPrecedence.precedence_order,
    [
      brandPrecedence.approved_task_material_overrides_memory_or_defaults,
      brandPrecedence.generated_or_inferred_profile_can_override_approved_material,
      brandPrecedence.defaults_fill_missing_fields_only,
    ],
    materialPass.required_item_statuses,
    materialPass.missing_or_unverified_required_material_yields,
    [
      densityEvidence.density_contract_required_before_layout,
      densityEvidence.sparse_page_can_pass_without_rca_rationale,
      densityEvidence.provider_completion_can_accept_sparse_page,
      densityEvidence.schema_completeness_can_accept_sparse_page,
    ],
  ];
  assert.deepEqual(disciplineClaims, [
    ['explicit_delivery_request_brand_material', 'rca_visual_direction_judgment', 'workspace_profile_defaults', 'user_profile_defaults', 'built_in_route_defaults'],
    [true, false, true],
    ['approved', 'provided_unverified', 'missing', 'out_of_scope'],
    ['source_gap_refs', 'material_gap_refs', 'typed_blocker'],
    [true, false, false, false],
  ]);
  assert.equal(materialPass.pass_level_evidence_required, true);
  for (const requiredField of ['brand_profile_precedence_refs', 'source_material_pass_refs', 'layout_density_refs', 'sparse_page_evidence_refs']) {
    assert.equal(visualPackDisciplineContract.required_contract_fields.includes(requiredField), true, requiredField);
  }
  const routeClaims = packCompilerInput.markdown_marp_route_policy;
  const packageClaims = packCompilerInput.package_distribution_gate;
  assert.deepEqual([
    routeClaims.owner,
    routeClaims.policy_ref,
    routeClaims.route_family,
    routeClaims.route_default,
    routeClaims.explicit_selection_required,
    routeClaims.refs_only,
    routeClaims.default_visual_route_ref,
    routeClaims.external_runtime_authority_allowed,
    routeClaims.provider_completion_can_issue_visual_verdict,
  ], ['redcube_ai', 'agent/knowledge/markdown_route_policy.md', 'markdown_marp', false, true, true, 'author_image_pages', false, false]);
  assert.deepEqual(routeClaims.allowed_route_use, ['operator_explicit_markdown_or_marp_request', 'source_to_slide_text_structuring_refs', 'intermediate_outline_or_script_packaging_refs']);
  assert.deepEqual([
    packageClaims.owner,
    packageClaims.policy_ref,
    packageClaims.gate_id,
    packageClaims.refs_only,
    packageClaims.package_can_omit_required_domain_pack_refs,
    packageClaims.packaging_can_change_route_default,
    packageClaims.external_runtime_authority_allowed,
  ], ['redcube_ai', 'agent/quality_gates/package_distribution.md', 'rca.package_distribution_consistency.v1', true, false, false, false]);
  assert.equal(packageClaims.required_consistency_checks.includes('source_to_package_required_domain_pack_paths_match'), true);

  assertNoLegacyAuthorityFunctionFields(packCompilerInput, 'contracts/pack_compiler_input.json');
  assertNoLegacyAuthorityFunctionFields(functionalAudit, 'contracts/functional_privatization_audit.json');
  assertNoLegacyAuthorityFunctionFields(readJson('contracts/runtime-program/current-program.json'), 'contracts/runtime-program/current-program.json');
  assertNoLegacyAuthorityFunctionFields(readJson('contracts/runtime-program/opl-family-contract-adoption.json'), 'contracts/runtime-program/opl-family-contract-adoption.json');
});
