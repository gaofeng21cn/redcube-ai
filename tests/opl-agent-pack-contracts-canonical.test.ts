// @ts-nocheck
import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildCanonicalPack,
  readJson,
  REPO_LOCAL_SHARED_OWNER_RELEASE_CONTRACT_PATH,
  sharedFoundryPolicyRelease,
} from './helpers/opl-agent-pack-contracts.ts';
import {
  expectedDomainSpecificProfile,
  expectedSeriesDesignProfile,
} from './opl-agent-pack-contracts-series-profile.ts';

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
