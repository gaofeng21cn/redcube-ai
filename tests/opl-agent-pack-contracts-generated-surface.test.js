import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import { buildRepoGeneratedInterfaceBundle } from 'opl-framework/domain-pack-compiler';

import {
  assertNoLegacyAuthorityFunctionFields,
  readJson,
  repoRoot,
} from './helpers/opl-agent-pack-contracts.js';

test('RCA generated surface handoff is OPL-owned and root pack input is refs-only', () => {
  const packRefs = readJson('contracts/pack_compiler_input.json');
  const actionTargets = readJson('contracts/action_catalog.json');
  const generatedSurfaceHandoff = readJson('contracts/generated_surface_handoff.json');

  for (const surface of generatedSurfaceHandoff.generated_surfaces) {
    assert.equal(surface.owner, 'one-person-lab', surface.surface_id);
    assert.equal(surface.domain_repo_can_own_generated_surface, false, surface.surface_id);
  }

  assert.equal(generatedSurfaceHandoff.repo_local_launcher_policy.default_generic_dispatch_owner, 'one-person-lab');
  assert.equal(generatedSurfaceHandoff.repo_local_launcher_policy.default_supervision_owner, 'one-person-lab');
  assert.equal(generatedSurfaceHandoff.repo_local_launcher_policy.domain_repo_can_own_temporal_runtime, false);
  assert.equal(generatedSurfaceHandoff.bridge_exit_gate.rca_can_own_generated_surface, false);
  assert.equal(generatedSurfaceHandoff.bridge_exit_gate.generated_surface_ready_can_claim_domain_ready, undefined);

  assert.equal(packRefs.surface_kind, 'opl_domain_pack_compiler_input');
  assert.equal(packRefs.canonical_agent_id, 'rca');
  assert.equal(packRefs.domain_id, 'redcube_ai');
  assert.equal(packRefs.pack_compiler_owner, 'one-person-lab');
  assert.equal(Object.hasOwn(packRefs.authority_boundary, 'opl_can_compile_generated_surfaces_from_refs'), false);
  assert.equal(packRefs.authority_boundary.opl_can_write_domain_truth, false);
  assert.equal(packRefs.authority_boundary.opl_can_authorize_quality_or_export, false);
  assert.equal(packRefs.required_domain_pack_paths.every((entry) => entry.startsWith('agent/')), true);
  assert.equal(packRefs.required_domain_pack_paths.includes('agent/stages/manifest.json'), true);
  assert.equal(packRefs.source_refs.stage_refs, 'agent/stages/manifest.json');
  assert.equal(packRefs.source_refs.stage_graph_source_ref, 'agent/stages/manifest.json');
  assert.equal(packRefs.standard_stage_pack_conformance.enforcement_ref, 'agent/stages/manifest.json');

  const bundle = buildRepoGeneratedInterfaceBundle(repoRoot, 'all', 'rca');
  assert.equal(bundle.status, 'ready');
  assert.equal(bundle.bundle.agent_id, 'rca');
  assert.equal(bundle.bundle.target_domain_id, 'redcube_ai');

  assert.equal(actionTargets.surface_kind, 'family_action_catalog');
  assert.equal(actionTargets.version, 'family-action-catalog.v1');
  assert.equal(actionTargets.authority_boundary.opl_role, 'projection_consumer_only');
  assert.equal(actionTargets.authority_boundary.default_generic_dispatch_owner, 'one-person-lab');
  assert.equal(actionTargets.authority_boundary.temporal_stage_run_consumption_policy.rca_writes_opl_stage_attempts, false);
  assert.equal(
    actionTargets.actions.some((action) => action.action_id === 'dispatch_domain_handler'),
    true,
  );
  assert.equal(packRefs.minimal_authority_surface_ids.includes('review_export_verdict'), true);

  assertNoLegacyAuthorityFunctionFields(packRefs, 'contracts/pack_compiler_input.json');
  assert.equal(JSON.stringify(actionTargets).includes('allowed_functions'), false);
});

test('RCA OPL manifest registration stays refs-only and workspace generated output untracked', () => {
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
  assert.equal(registration.workspace_binding_manifest_command.requires_opl_workspace_binding_registry_entry, true);
  assert.equal(registration.workspace_binding_manifest_command.repo_contract_alone_updates_live_binding, false);

  assert.equal(registration.workspace_generated_artifact_policy.repo_source_tracking_allowed, false);
  for (const ignoredPath of ['/workspace.yaml', '/workspace_*.json', '/shared/']) {
    assert.equal(gitignore.includes(ignoredPath), true, ignoredPath);
  }
  for (const hygienePattern of ['workspace.yaml', 'workspace_*.json', 'shared/**']) {
    assert.equal(repoHygiene.includes(hygienePattern), true, hygienePattern);
  }

  assert.equal(registration.authority_boundary.refs_only, true);
  assert.equal(registration.authority_boundary.domain_repo_can_own_generated_surface, false);
  assert.equal(registration.authority_boundary.domain_repo_can_own_generic_runtime, false);
  assert.equal(registration.authority_boundary.can_write_visual_truth, false);
  assert.equal(registration.authority_boundary.can_authorize_review_export_verdict, false);
});
