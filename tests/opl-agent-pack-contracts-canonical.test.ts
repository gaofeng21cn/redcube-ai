// @ts-nocheck
import assert from 'node:assert/strict';
import test from 'node:test';

import { readJson } from './helpers/opl-agent-pack-contracts.ts';

test('RCA root contracts expose OPL-owned standard surfaces with RCA refs-only profile boundaries', () => {
  const foundryProfile = readJson('contracts/foundry_agent_series.json');
  const domainDescriptor = readJson('contracts/domain_descriptor.json');
  const actionTargets = readJson('contracts/action_catalog.json');
  const stageManifest = readJson('agent/stages/manifest.json');
  const packRefs = readJson('contracts/pack_compiler_input.json');

  assert.equal(foundryProfile.surface_kind, 'opl_foundry_agent_series_contract');
  assert.equal(foundryProfile.generic_foundry_series_owner, 'one-person-lab');
  assert.equal(foundryProfile.repo_local_generic_foundry_spine, 'retired');
  assert.equal(foundryProfile.repo_local_foundry_cli_surface, 'retired');
  assert.equal(foundryProfile.profile_role, 'domain_specific_profile_ref_only');
  assert.equal(foundryProfile.domain_specific_profile.stage_pack_role, 'declarative_visual_pack');
  assert.equal(foundryProfile.standard_public_projection_policy.standard_public_foundry_surface, 'opl_generated_hosted_series');
  assert.equal(foundryProfile.rca_authority_boundary.opl_can_write_visual_truth, false);

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

  assert.equal(stageManifest.surface_kind, 'opl_standard_agent_declarative_stage_manifest');
  assert.equal(stageManifest.version, 'opl-standard-agent-declarative-stage-manifest.v1');
  assert.deepEqual(stageManifest.stages.map((stage) => stage.stage_id), [
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
  assert.equal(packRefs.source_refs.stage_graph_source_ref, 'agent/stages/manifest.json');
  assert.equal(packRefs.source_refs.executor_policy_source_ref, 'opl-generated:family_stage_control_plane#/stages/*/selected_executor');
  assert.equal(packRefs.required_domain_pack_paths.every((entry) => entry.startsWith('agent/')), true);
  assert.equal(packRefs.minimal_authority_surface_ids.includes('owner_receipt_signer'), true);
});
