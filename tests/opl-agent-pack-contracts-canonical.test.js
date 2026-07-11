import assert from 'node:assert/strict';
import test from 'node:test';
import path from 'node:path';
import { buildStandardAgentPrincipleAdoptionChecks } from '../node_modules/opl-framework-shared/dist/modules/foundry-lab/standard-agent-principles.js';

import { readJson } from './helpers/opl-agent-pack-contracts.js';

test('RCA root contracts expose OPL-owned standard surfaces with RCA refs-only profile boundaries', () => {
  const foundryProfile = readJson('contracts/foundry_agent_series.json');
  const domainDescriptor = readJson('contracts/domain_descriptor.json');
  const actionTargets = readJson('contracts/action_catalog.json');
  const stageRefs = readJson('contracts/stage_control_plane.json');
  const packRefs = readJson('contracts/pack_compiler_input.json');

  assert.equal(foundryProfile.surface_kind, 'opl_foundry_agent_series_contract');
  assert.equal(foundryProfile.generic_foundry_series_owner, 'one-person-lab');
  assert.equal(foundryProfile.repo_local_generic_foundry_spine, 'retired');
  assert.equal(foundryProfile.repo_local_foundry_cli_surface, 'retired');
  assert.equal(foundryProfile.profile_role, 'domain_specific_profile_ref_only');
  assert.equal(foundryProfile.domain_specific_profile.stage_pack_role, 'declarative_visual_pack');
  assert.equal(foundryProfile.standard_public_projection_policy.standard_public_foundry_surface, 'opl_generated_hosted_series');
  assert.equal(foundryProfile.rca_authority_boundary.opl_can_write_visual_truth, false);
  assert.equal(foundryProfile.stage_manifest_ref, 'agent/stages/manifest.json');
  assert.equal(foundryProfile.stage_control_plane_ref, 'opl-generated:family_stage_control_plane');
  assert.equal(foundryProfile.required_identity_fields.includes('stage_manifest_ref'), true);
  assert.equal(foundryProfile.shared_release_pin_strategy.owner_managed_latest_stable_channel_required, true);
  assert.equal(foundryProfile.shared_release_pin_strategy.lockfile_resolved_commit_receipt_required, true);
  assert.equal(foundryProfile.shared_release_pin_strategy.consumer_exact_commit_equality_gate, false);

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

test('RCA standard-agent principles resolve current OPL stage references', () => {
  const checks = buildStandardAgentPrincipleAdoptionChecks(path.resolve());

  assert.equal(checks.status, 'passed');
  assert.deepEqual(checks.blockers, []);
});
