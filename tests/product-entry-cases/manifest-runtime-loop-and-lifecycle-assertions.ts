// @ts-nocheck
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
  assert.equal(manifest.opl_family_lifecycle_adapter.surface_kind, 'opl_family_lifecycle_adapter');
  assert.equal(manifest.opl_family_lifecycle_adapter.adapter_id, 'rca.opl.family.lifecycle.adapter.v1');
  assert.equal(manifest.opl_family_lifecycle_adapter.discovery.adoption_state, 'discoverable_manifest_projection');
  assert.equal(manifest.opl_family_lifecycle_adapter.persistence.sqlite.status, 'not_domain_owned_generic_persistence');
  assert.equal(manifest.opl_family_lifecycle_adapter.persistence.authority_model, 'file_authority_plus_rebuildable_artifact_indexes');
  assert.deepEqual(
    manifest.opl_family_lifecycle_adapter.discovery.owner_split,
    {
      family_persistence_owner: 'one-person-lab',
      session_shell_owner: 'one-person-lab',
      stage_attempt_owner: 'one-person-lab',
      attempt_ledger_owner: 'one-person-lab',
      lifecycle_projection_owner: 'redcube_ai',
      domain_truth_owner: 'redcube_ai',
      review_publication_owner: 'redcube_ai',
      runtime_manager_consumer: 'opl_runtime_manager',
      executor_owner: 'configured_by_opl_runtime_provider',
    },
  );
  assert.deepEqual(
    manifest.opl_family_lifecycle_adapter.discovery.route_surfaces.map((surface) => surface.surface_id),
    [
      'product_entry_registration',
      'opl_hosted_stage_runtime',
      'product_entry_session',
      'opl_stage_execution_plan',
      'review_state',
      'publication_projection',
    ],
  );
  assert.equal(
    manifest.opl_family_lifecycle_adapter.adoption.required_input_fields.includes('entry_session_id'),
    true,
  );
  assert.equal(manifest.opl_family_lifecycle_adapter.authority_boundary.owns_domain_truth, false);
  assert.equal(manifest.opl_family_lifecycle_adapter.authority_boundary.owns_canonical_artifacts, false);
  assert.equal(manifest.opl_family_lifecycle_adapter.authority_boundary.owns_review_truth, false);
  assert.equal(manifest.opl_family_lifecycle_adapter.authority_boundary.owns_publication_projection, false);
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
