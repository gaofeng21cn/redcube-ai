// @ts-nocheck
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import {
  assertNoLegacyAuthorityFunctionFields,
  oplCanonicalGeneratedSurfaceIds,
  readJson,
  repoRoot,
} from './helpers/opl-agent-pack-contracts.ts';

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

test('RCA OPL manifest registration pins pack compiler descriptor input and keeps workspace topology generated output untracked', () => {
  const domainDescriptor = readJson('contracts/domain_descriptor.json');
  const registration = readJson('contracts/opl_domain_manifest_registration.json');
  const gitignore = fs.readFileSync(path.join(repoRoot, '.gitignore'), 'utf8');
  const repoHygiene = fs.readFileSync(path.join(repoRoot, 'scripts/repo-hygiene.sh'), 'utf8');

  assert.equal(
    domainDescriptor.standard_contract_refs.domain_manifest_registration,
    'contracts/opl_domain_manifest_registration.json',
  );
  assert.equal(registration.surface_kind, 'opl_domain_manifest_registration');
  assert.equal(registration.domain_id, 'redcube_ai');
  assert.equal(registration.project_id, 'redcube');
  assert.equal(registration.agent_id, 'rca');
  assert.equal(registration.domain_manifest.manifest_builder_export, '@redcube/domain-entry#getProductEntryManifest');
  assert.equal(
    registration.domain_manifest.manifest_builder_source_ref,
    'packages/redcube-domain-entry/src/actions/get-product-entry-manifest.ts',
  );
  assert.equal(
    registration.workspace_binding_manifest_command.expected_export,
    'getProductEntryManifest',
  );
  assert.equal(
    registration.workspace_binding_manifest_command.requires_opl_workspace_binding_registry_entry,
    true,
  );
  assert.equal(
    registration.workspace_binding_manifest_command.repo_contract_alone_updates_live_binding,
    false,
  );
  assert.equal(
    registration.workspace_binding_manifest_command.blocked_if_manifest_command_null,
    true,
  );
  assert.equal(
    registration.workspace_binding_manifest_command.pack_compiler_blocker_when_null,
    'domain_manifest_not_resolved',
  );

  assert.equal(registration.workspace_generated_artifact_policy.repo_source_tracking_allowed, false);
  assert.deepEqual(registration.workspace_generated_artifact_policy.ignored_repo_root_paths, [
    'workspace.yaml',
    'workspace_*.json',
    'shared/',
  ]);
  for (const ignoredPath of ['/workspace.yaml', '/workspace_*.json', '/shared/']) {
    assert.equal(gitignore.includes(ignoredPath), true, ignoredPath);
  }
  for (const hygienePattern of ['workspace.yaml', 'workspace_*.json', 'shared/**']) {
    assert.equal(repoHygiene.includes(hygienePattern), true, hygienePattern);
  }

  assert.deepEqual(registration.authority_boundary, {
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
  });
  assert.equal(
    registration.forbidden_claims.includes('repo_contract_alone_repaired_live_opl_workspace_registry'),
    true,
  );
});
