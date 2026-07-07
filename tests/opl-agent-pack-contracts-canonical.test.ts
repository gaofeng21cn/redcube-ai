// @ts-nocheck
import assert from 'node:assert/strict';
import test from 'node:test';

import { readJson } from './helpers/opl-agent-pack-contracts.ts';

test('RCA root contracts are refs-only domain profile surfaces, not OPL generic spine truth', () => {
  const foundryProfile = readJson('contracts/foundry_agent_series.json');
  const domainDescriptor = readJson('contracts/domain_descriptor.json');
  const actionTargets = readJson('contracts/action_catalog.json');
  const stageRefs = readJson('contracts/stage_control_plane.json');
  const packRefs = readJson('contracts/pack_compiler_input.json');

  assert.equal(foundryProfile.surface_kind, 'rca_foundry_agent_profile_ref');
  assert.equal(foundryProfile.generic_foundry_series_owner, 'one-person-lab');
  assert.equal(foundryProfile.repo_local_generic_foundry_spine, 'retired');
  assert.equal(foundryProfile.repo_local_foundry_cli_surface, 'retired');
  assert.equal('series_design_profile' in foundryProfile, false);
  assert.equal('workspace_topology_profile' in foundryProfile, false);
  assert.equal('standard_public_projection_policy' in foundryProfile, false);

  assert.equal(domainDescriptor.foundry_agent_profile_ref, 'contracts/foundry_agent_series.json');
  assert.equal(domainDescriptor.generic_surface_owner, 'one-person-lab');
  assert.equal(domainDescriptor.domain_repo_can_own_generated_surface, false);
  assert.equal('series_design_profile' in domainDescriptor, false);
  assert.equal(domainDescriptor.domain_specific_profile.stage_pack_role, 'declarative_visual_pack');

  assert.equal(actionTargets.surface_kind, 'rca_action_target_refs');
  assert.equal(actionTargets.projection_mode, 'minimal_authority_and_domain_handler_targets_only');
  assert.equal(actionTargets.generated_surface_owner, 'one-person-lab');
  assert.equal(actionTargets.domain_repo_can_own_generated_surface, false);
  assert.equal(actionTargets.action_targets.includes('dispatch_domain_handler'), true);
  assert.equal(actionTargets.minimal_authority_functions.allowed_authority_surface_ids.includes('review_export_verdict'), true);

  assert.equal(stageRefs.surface_kind, 'rca_stage_control_refs');
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

  assert.equal(packRefs.surface_kind, 'rca_declarative_visual_pack_refs');
  assert.equal(packRefs.pack_compiler_owner, 'one-person-lab');
  assert.equal(packRefs.projection_mode, 'repo_source_refs_only');
  assert.equal(packRefs.required_domain_pack_paths.every((entry) => entry.startsWith('agent/')), true);
  assert.equal(packRefs.minimal_authority_surface_ids.includes('owner_receipt_signer'), true);
});
