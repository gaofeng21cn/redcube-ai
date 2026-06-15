// @ts-nocheck
import assert from 'node:assert/strict';

import { assertFamilyOrchestrationCompanion } from '../product-domain-action-case-shared.ts';

export function assertManifestRuntimeLoopAndLifecycle({ manifest, sharedCompanions }) {
  assert.equal(manifest.runtime_loop_closure.surface_kind, 'runtime_loop_closure');
  assert.equal(manifest.runtime_loop_closure.loop_owner.runtime_owner, 'configured_family_runtime_provider');
  assert.equal(manifest.runtime_loop_closure.loop_owner.domain_owner, 'redcube_ai');
  assert.equal(manifest.runtime_loop_closure.loop_owner.product_entry_owner, 'redcube_ai');
  assert.equal(
    manifest.runtime_loop_closure.resume_point.resume_command_template,
    'opl_generated:product_session --entry-session-id <entry-session-id>',
  );
  assert.equal(manifest.runtime_loop_closure.continuity_cursor.surface_ref, '/session_continuity');
  assert.equal(manifest.runtime_loop_closure.progress_cursor.surface_ref, '/progress_projection');
  assert.equal(manifest.runtime_loop_closure.artifact_pickup.surface_ref, '/artifact_inventory');
  assert.equal(manifest.runtime_loop_closure.control_policy.approval_gate_id, 'redcube_operator_review_gate');
  assert.equal(manifest.runtime_loop_closure.control_policy.default_run_mode, 'auto_to_terminal');
  assert.equal(
    manifest.runtime_loop_closure.control_policy.stop_policy,
    'stop_only_on_explicit_stop_after_stage_or_runtime_review_gate',
  );
  assert.equal(manifest.runtime_loop_closure.control_policy.approval_required, false);
  assert.equal(manifest.runtime_loop_closure.control_policy.gate_status, 'approved');
  assert.equal(manifest.runtime_loop_closure.control_policy.interrupt_policy, 'continue_autonomously_until_runtime_gate');
  assert.equal(manifest.runtime_loop_closure.control_policy.recommended_action, 'invoke_product_entry_auto_to_terminal');
  assert.equal(manifest.runtime_loop_closure.source_linkage.current_source, 'manifest');
  assert.equal(manifest.runtime_loop_closure.source_linkage.entry_mode, 'manifest_projection');
  assert.equal(manifest.runtime_loop_closure.source_linkage.direct_surface_kind, 'product_entry');
  assert.equal(manifest.runtime_loop_closure.source_linkage.opl_hosted_surface_kind, 'opl_hosted_product_entry');
  assert.equal(manifest.runtime_loop_closure.source_linkage.session_surface_kind, 'product_entry_session');
  assert.equal(manifest.runtime_loop_closure.source_linkage.downstream_entry_surface_kind, 'domain_entry');
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
  const validatedManifest = sharedCompanions.validateFamilyProductEntryManifest(manifest, {
    requireRuntimeCompanions: true,
  });
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
