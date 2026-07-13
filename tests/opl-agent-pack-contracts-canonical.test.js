import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import path from 'node:path';
import { buildStandardAgentPrincipleAdoptionChecks } from '../node_modules/opl-framework/dist/modules/foundry-lab/standard-agent-principles.js';

import { readJson } from './helpers/opl-agent-pack-contracts.js';

const repoRoot = path.resolve(import.meta.dirname, '..');

test('RCA root contracts expose OPL-owned standard surfaces with RCA refs-only profile boundaries', () => {
  const foundryProfile = readJson('contracts/foundry_agent_series.json');
  const domainDescriptor = readJson('contracts/domain_descriptor.json');
  const actionTargets = readJson('contracts/action_catalog.json');
  const stageManifest = readJson('agent/stages/manifest.json');
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
  policy_bundle_fingerprint: 'sha256:2abdcbe6e7c238dfc0bcbff2251fb0eda505647927446a6fbf47ae8b28253415',
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
  assert.equal(
    packRefs.source_refs.executor_policy_source_ref,
    'opl-generated:family_stage_control_plane#/stages/*/selected_executor',
  );
  assert.equal(packRefs.required_domain_pack_paths.every((entry) => entry.startsWith('agent/')), true);
  assert.equal(packRefs.minimal_authority_surface_ids.includes('owner_receipt_signer'), true);

  const implementationProfile = packRefs.implementation_profile;
  assert.deepEqual(implementationProfile, {
    profile_id: 'opl.standard_domain_agent.v1',
    agent_identity: 'declarative_standard_agent_pack',
    pack_formats: ['markdown', 'json'],
    helpers: {
      optional: true,
      entries: [
        {
          language: 'typescript',
          role: 'domain_helper',
          source_roots: ['packages/redcube-runtime/src/families/'],
        },
        {
          language: 'python',
          role: 'native_helper',
          source_roots: ['python/redcube_ai/native_helpers/'],
        },
      ],
      language_is_identity: false,
      rust_policy: 'framework_hot_path_only',
    },
    generated_surfaces_owner: 'one-person-lab',
  });
  for (const helper of implementationProfile.helpers.entries) {
    assert.notEqual(helper.language, 'rust');
    helper.source_roots.forEach((sourceRoot) => {
      assert.equal(fs.statSync(path.join(repoRoot, sourceRoot)).isDirectory(), true, sourceRoot);
    });
  }
});

test('RCA standard-agent principles resolve current OPL stage references', () => {
  const checks = buildStandardAgentPrincipleAdoptionChecks(path.resolve());

  assert.equal(checks.status, 'passed');
  assert.deepEqual(checks.blockers, []);
});
