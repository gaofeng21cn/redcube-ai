import assert from 'node:assert/strict';
import test from 'node:test';

import { readJson } from './helpers/opl-agent-pack-contracts.js';

test('RCA root contracts expose OPL-owned standard surfaces with RCA refs-only profile boundaries', () => {
  const foundryProfile = readJson('contracts/foundry_agent_series.json');
  const domainDescriptor = readJson('contracts/domain_descriptor.json');
  const actionTargets = readJson('contracts/action_catalog.json');
  const stageRefs = readJson('contracts/stage_control_plane.json');
  const packRefs = readJson('contracts/pack_compiler_input.json');

  assert.equal(foundryProfile.surface_kind, 'opl_foundry_agent_series_consumer');
  assert.equal(foundryProfile.version, 'foundry-agent-series-consumer.v1');
  assert.equal(foundryProfile.canonical_policy_export, 'opl-framework/foundry-agent-series-policy');
  assert.equal(
    foundryProfile.canonical_series_contract_ref,
    'contracts/opl-framework/foundry-agent-series-contract.json',
  );
  assert.equal(
    foundryProfile.canonical_skeleton_contract_ref,
    'contracts/opl-framework/standard-domain-agent-skeleton-contract.json',
  );
  assert.deepEqual(foundryProfile.shared_policy_release, {
    policy_release_contract_ref: 'contracts/opl-framework/foundry-agent-series-policy-release.json',
    policy_bundle_fingerprint: 'sha256:503f515e8fa08b3f81ce28cac461368c609d4565de239c9f95c3f910cb758ed5',
    fingerprint_algorithm: 'sha256:stable-json',
    domain_contract_policy_release_pin_required: true,
    domain_adapter_must_not_copy_policy_body_as_authority: true,
    consumer_alignment_check: 'foundry:policy-release',
  });
  assert.equal(foundryProfile.domain_id, 'rca');
  assert.equal(foundryProfile.foundry_agent_id, 'rca');
  assert.equal(foundryProfile.authority_owner, 'redcube_ai');
  assert.equal(foundryProfile.stage_manifest_ref, 'agent/stages/manifest.json');
  assert.equal(foundryProfile.stage_control_plane_ref, 'opl-generated:family_stage_control_plane');
  assert.equal(foundryProfile.stage_control_plane_target_domain_id, 'redcube_ai');
  assert.deepEqual(Object.keys(foundryProfile.authority_boundary).sort(), [
    'domain_can_write_other_domain_truth',
    'domain_can_write_other_domain_memory_body',
    'domain_can_mutate_other_domain_artifact_body',
    'domain_can_authorize_other_domain_quality_or_export',
    'generated_surface_can_claim_domain_ready',
  ].sort());
  for (const [field, value] of Object.entries(foundryProfile.authority_boundary)) {
    assert.equal(value, false, `authority_boundary.${field}`);
  }
  for (const field of [
    'agent_membership_projection_policy',
    'app_projection_policy',
    'contract_version_policy',
    'domain_adapter_policy',
    'rca_authority_boundary',
    'required_identity_fields',
    'required_stage_packets',
    'series_design_profile',
    'shared_progress_projection_fields',
    'shared_release_pin_strategy',
    'standard_feedback_self_evolution_trigger_policy',
    'standard_public_projection_policy',
    'workspace_topology_profile',
  ]) assert.equal(Object.hasOwn(foundryProfile, field), false, field);

  assert.equal(domainDescriptor.foundry_agent_profile_ref, 'contracts/foundry_agent_series.json');
  assert.equal(domainDescriptor.generic_surface_owner, 'one-person-lab');
  assert.equal(domainDescriptor.domain_repo_can_own_generated_surface, false);
  assert.equal('series_design_profile' in domainDescriptor, false);
  assert.equal(domainDescriptor.domain_specific_profile.stage_pack_role, 'declarative_visual_pack');

  assert.equal(actionTargets.surface_kind, 'family_action_catalog');
  assert.equal(actionTargets.version, 'family-action-catalog.v1');
  assert.equal(actionTargets.authority_boundary.opl_role, 'projection_consumer_only');
  assert.equal(actionTargets.authority_boundary.generated_interface_owner, 'one-person-lab');
  assert.equal(
    actionTargets.actions.some((action) => action.action_id === 'dispatch_domain_handler'),
    true,
  );
  assert.equal(packRefs.minimal_authority_surface_ids.includes('review_export_verdict'), true);

  assert.equal(stageRefs.surface_kind, 'family_stage_control_plane');
  assert.equal(stageRefs.version, 'family-stage-control-plane.v1');
  assert.equal(stageRefs.authority_boundary.opl_role, 'projection_consumer_only');
  assert.equal(stageRefs.generated_stage_control_owner, 'one-person-lab');
  assert.equal(stageRefs.stage_descriptor_body_copied, false);
  assert.deepEqual(stageRefs.stage_ids, [
    'source_intake',
    'communication_strategy',
    'visual_direction',
    'artifact_creation',
    'review_and_revision',
    'package_and_handoff',
  ]);

  assert.equal(packRefs.surface_kind, 'opl_domain_pack_compiler_input');
  assert.equal(packRefs.pack_compiler_owner, 'one-person-lab');
  assert.equal(packRefs.projection_mode, 'repo_source_refs_only');
  assert.equal(packRefs.required_domain_pack_paths.every((entry) => entry.startsWith('agent/')), true);
  assert.equal(packRefs.minimal_authority_surface_ids.includes('owner_receipt_signer'), true);
});

test('RCA standard-agent principles declare current OPL stage references without private framework imports', () => {
  const adoption = readJson('contracts/standard-agent-principles-adoption.json');

  assert.equal(adoption.surface_kind, 'opl_standard_agent_principles_adoption');
  assert.equal(adoption.state, 'active_contract');
  assert.equal(
    adoption.adopted_principle_pack_ref,
    'contracts/opl-framework/standard-agent-principles.json',
  );
  assert.equal(adoption.source_refs.stage_manifest_ref, 'agent/stages/manifest.json');
  assert.equal(
    adoption.source_refs.stage_control_plane_ref,
    'opl-generated:family_stage_control_plane',
  );
  for (const value of Object.values(adoption.authority_boundary)) {
    assert.equal(value, false);
  }
});

test('RCA declares the required OPL-owned workspace lifecycle policy', () => {
  const lifecyclePolicy = readJson('contracts/workspace_lifecycle_policy.json');

  assert.equal(lifecyclePolicy.surface_kind, 'opl_domain_workspace_file_lifecycle_policy');
  assert.equal(lifecyclePolicy.version, 'opl-domain-workspace-file-lifecycle.v1');
  assert.equal(lifecyclePolicy.policy_owner, 'one-person-lab');
  assert.equal(lifecyclePolicy.domain_id, 'redcube_ai');
  assert.equal(lifecyclePolicy.structural_gate_only, true);
  assert.equal(lifecyclePolicy.workspace_runtime_artifact_roots.externalized, true);
  assert.deepEqual(lifecyclePolicy.workspace_runtime_artifact_roots.required_locator_refs, [
    'workspace_root_ref',
    'runtime_artifact_root_ref',
    'artifact_locator_ref',
    'restore_or_retention_receipt_ref',
  ]);
  for (const value of Object.values(lifecyclePolicy.authority_boundary)) {
    assert.equal(value, false);
  }
});
