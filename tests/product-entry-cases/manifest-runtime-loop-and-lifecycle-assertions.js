import assert from 'node:assert/strict';

import { assertFamilyOrchestrationCompanion } from '../product-domain-action-case-shared.ts';

export function assertManifestRuntimeLoopAndLifecycle({ manifest, sharedCompanions }) {
  assert.equal(manifest.runtime_loop_closure, undefined);
  assert.equal(manifest.session_continuity, undefined);
  assert.equal(manifest.progress_projection, undefined);
  assert.equal(manifest.artifact_inventory, undefined);
  assert.equal(manifest.generated_session_surface_ref, 'opl_generated:product_session');
  assert.equal(manifest.entry_descriptor.direct.command, 'redcube product invoke');
  assert.equal(
    manifest.entry_descriptor.session.command,
    'opl_generated:product_session --entry-session-id <entry-session-id>',
  );
  assert.equal(manifest.authority_boundary.refs_only, true);
  assert.equal(manifest.authority_boundary.creates_owner_receipt, false);
  assert.equal(manifest.authority_boundary.creates_typed_blocker, false);
  assert.deepEqual(manifest.opl_family_lifecycle_adapter, {
    surface_kind: 'opl_generated_product_session_ref',
    owner: 'one-person-lab',
    ref: 'opl_generated:product_session',
    rca_role: 'domain_result_and_currentness_refs_provider',
  });
  const validatedManifest = sharedCompanions.validateFamilyProductEntryManifest(manifest);
  assert.equal(validatedManifest.domain_entry_contract.entry_adapter, 'RedCubeDomainEntry');
  assert.equal(validatedManifest.user_interaction_contract.entry_owner, 'redcube_agent_entry_shell');
  assertFamilyOrchestrationCompanion(manifest, {
    sessionLocatorField: 'entry_session_contract.entry_session_id',
  });
  assert.equal(manifest.family_orchestration.action_graph.edges.length, 4);
  assert.deepEqual(manifest.family_orchestration.action_graph.human_gates, [
    {
      gate_id: 'redcube_operator_review_gate',
      trigger_nodes: ['step:inspect_current_progress'],
      blocking: true,
    },
  ]);
}
