import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

async function getProductEntryManifest(request) {
  const module = await import('../packages/redcube-domain-entry/dist/index.js');
  return module.getProductEntryManifest(request);
}

function stringValues(value) {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(stringValues);
  if (value && typeof value === 'object') return Object.values(value).flatMap(stringValues);
  return [];
}

test('product-entry does not reconstruct the OPL Runtime Manager registration', async () => {
  const manifest = await getProductEntryManifest({ workspace_root: process.cwd() });

  assert.equal(Object.hasOwn(manifest, 'skill_catalog'), false);
  assert.equal(Object.hasOwn(manifest, 'runtime_manager'), false);
  assert.equal(Object.hasOwn(manifest, 'opl_runtime_manager_registration'), false);
  assert.equal(manifest.runtime.runtime_owner, 'one-person-lab');
  assert.equal(manifest.runtime.product_session_surface_ref, 'opl-generated:product_session');
  assert.equal(manifest.authority_boundary.generic_session_owner, 'one-person-lab');
  assert.equal(manifest.authority_boundary.projection_can_claim_domain_ready, false);
  assert.equal(manifest.standard_domain_agent_skeleton.surface_kind, 'standard_domain_agent_skeleton');
  assert.deepEqual(manifest.standard_domain_agent_skeleton.repo_source_boundary.required_dirs, [
    'agent',
    'contracts',
    'runtime',
    'docs',
  ]);
  assert.equal(manifest.standard_domain_agent_skeleton.artifact_boundary.repo_contains_real_artifacts, false);
  assert.equal(manifest.standard_domain_agent_skeleton.artifact_boundary.artifact_roots_are_locators, true);
});

test('product-entry projects the RCA-owned standard agent interface for generic OPL consumers', async () => {
  const descriptor = JSON.parse(readFileSync('contracts/standard_agent_interface.json', 'utf8'));
  const domainDescriptor = JSON.parse(readFileSync('contracts/domain_descriptor.json', 'utf8'));
  const manifest = await getProductEntryManifest({ workspace_root: process.cwd() });
  const standardInterface = manifest.standard_agent_interface;

  assert.deepEqual(domainDescriptor.standard_agent_interface, {
    version: 'opl_standard_agent_interface.v1',
    ref_kind: 'repo_json_pointer',
    ref: 'contracts/standard_agent_interface.json#/standard_agent_interface',
    projection_ref: 'getProductEntryManifest#/standard_agent_interface',
  });
  assert.equal(manifest.standard_agent_interface_ref, 'contracts/standard_agent_interface.json#/standard_agent_interface');
  assert.deepEqual(standardInterface, descriptor.standard_agent_interface);
  assert.equal(standardInterface.version, 'opl_standard_agent_interface.v1');
  assert.deepEqual(standardInterface.workspace_binding, {
    locator_surface_kind: 'redcube_workspace',
    required_locator_fields: ['workspace_root'],
    optional_locator_fields: [],
    entry_command_template: ['redcube', 'product', 'status', '--workspace-root', '{workspace_root}'],
    manifest_command_template: ['redcube', 'product', 'manifest', '--workspace-root', '{workspace_root}'],
  });
  assert.deepEqual(standardInterface.runtime.dispatch_command, ['redcube', 'domain-handler', 'dispatch']);
  assert.equal(standardInterface.runtime.runtime_domain_id, 'redcube_ai');
  assert.deepEqual(standardInterface.progress.deliverable_delta_aliases, [
    'visual_deliverable_progress',
    'deliverable_progress_delta',
  ]);
  assert.deepEqual(standardInterface.progress.platform_delta_aliases, ['platform_repair_delta']);
  assert.ok(standardInterface.routing.explicit_aliases.includes('rca'));
  assert.ok(standardInterface.routing.workstream_ids.includes('presentation_ops'));
  assert.ok(standardInterface.routing.intent_signals.includes('ppt'));
  assert.equal(
    standardInterface.routing.ambiguity_policy,
    'prefer_explicit_alias_then_workstream_then_intent_signals_else_return_ambiguous_without_cross_domain_guess',
  );

  const serialized = JSON.stringify(standardInterface);
  for (const forbidden of [
    'reviewRenderedDeliverable',
    'applyReviewMutation',
    'artifact_mutation_authorization',
    'visual_memory_accept_reject',
    'owner_receipt_signer',
  ]) {
    assert.equal(serialized.includes(forbidden), false, forbidden);
  }
  const placeholders = stringValues(standardInterface)
    .flatMap((value) => value.match(/\{[^}]+\}/g) ?? []);
  assert.deepEqual([...new Set(placeholders)], ['{workspace_root}']);
});
