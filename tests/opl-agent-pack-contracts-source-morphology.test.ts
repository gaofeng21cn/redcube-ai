// @ts-nocheck
import assert from 'node:assert/strict';
import test from 'node:test';

import { readJson } from './helpers/opl-agent-pack-contracts.ts';

test('RCA physical source morphology policy classifies active source tails without generic ownership', () => {
  const policy = readJson('contracts/physical_source_morphology_policy.json');
  const byId = Object.fromEntries(policy.active_surface_classifications.map((entry) => [entry.surface_id, entry]));

  assert.equal(policy.surface_kind, 'rca_physical_source_morphology_policy');
  assert.equal(policy.status, 'active_source_classification_policy_landed');
  assert.equal(policy.canonical_pack_root, 'agent/');
  assert.equal(policy.legacy_name_policy.compatibility_alias_allowed, false);
  assert.equal(policy.legacy_name_policy.allowance_required_for_active_surface_text_matches, true);
  assert.equal(policy.legacy_name_policy.active_generic_runtime_owner_allowed, false);
  assert.equal(policy.legacy_name_policy.active_generic_domain_entry_owner_allowed, false);
  assert.equal(policy.legacy_name_policy.active_generic_gateway_owner_allowed, false);
  assert.equal(policy.legacy_name_policy.active_generic_session_runtime_owner_allowed, false);
  assert.deepEqual(policy.legacy_name_policy.tracked_legacy_terms, [
    'managed',
    'runtime',
    'gateway',
    'session',
    'domain_action_adapter',
  ]);
  assert.deepEqual(policy.legacy_name_policy.allowed_legacy_name_roles, [
    'machine_contract_ref',
    'package_protocol_boundary',
    'service_safe_domain_entry',
    'contract_safe_semantic_id',
    'tombstone_or_provenance',
    'negative_test_guard',
    'refs_only_read_model',
    'domain_handler_target',
    'minimal_visual_authority_function',
    'visual_native_helper_path',
    'locator_protocol_boundary',
  ]);
  assert.deepEqual(policy.legacy_name_policy.forbidden_active_surface_ids, [
    'legacy_managed_runtime_gateway_names',
  ]);
  assert.equal(policy.legacy_name_policy.package_protocol_boundary_policy.package_name, '@redcube/domain-entry');
  assert.equal(policy.legacy_name_policy.package_protocol_boundary_policy.public_identity, 'redcube-ai');
  assert.equal(policy.legacy_name_policy.package_protocol_boundary_policy.public_framework_identity_allowed, false);
  assert.equal(policy.new_surface_admission_gate.must_classify_before_active_caller, true);
  assert.equal(policy.new_surface_admission_gate.reopen_gap_if_forbidden_owner_role_appears, true);
  assert.equal(policy.allowed_surface_classes.includes('package_protocol_boundary'), true);
  assert.equal(policy.allowed_surface_classes.includes('service_safe_domain_entry'), true);
  assert.equal(policy.allowed_surface_classes.includes('refs_only_read_model'), true);
  assert.equal(policy.allowed_surface_classes.includes('minimal_visual_authority_function'), true);

  assert.equal(byId.mcp_product_entry_domain_entry.classification, 'service_safe_domain_entry');
  assert.equal(byId.redcube_cli_domain_entry_adapter.classification, 'service_safe_domain_entry');
  assert.equal(byId.redcube_domain_entry_package_protocol_boundary.classification, 'package_protocol_boundary');
  assert.equal(byId.product_entry_continuity_refs_adapter.classification, 'refs_only_read_model');
  assert.equal(byId.workspace_run_envelope_helpers.classification, 'refs_only_read_model');
  assert.equal(byId.runtime_watch_projection.classification, 'refs_only_read_model');
  assert.equal(byId.domain_action_adapter_guarded_actions.classification, 'domain_handler_target');
  assert.equal(byId.operator_evidence_stability_projection.classification, 'refs_only_read_model');
  assert.equal(byId.visual_authority_functions.classification, 'minimal_visual_authority_function');
  assert.equal(byId.legacy_managed_runtime_gateway_names, undefined);
  assert.equal(byId.retired_product_entry_contract_tombstone_refs.classification, 'tombstone_or_provenance');
  assert.deepEqual(byId.retired_product_entry_contract_tombstone_refs.retired_legacy_refs, [
    'contracts/runtime-program/managed-product-entry-hardening.json',
  ]);

  assert.deepEqual(byId.product_entry_continuity_refs_adapter.source_refs, [
    'packages/redcube-runtime/src/product-entry-continuity-ref-adapter.ts',
    'packages/redcube-domain-entry/src/actions/get-product-entry-session.ts',
    'packages/redcube-domain-entry/src/actions/get-product-entry-session-parts/session-artifacts.ts',
    'packages/redcube-domain-entry/src/actions/get-product-entry-session-parts/session-surfaces.ts',
    'packages/redcube-domain-entry/src/actions/product-entry-continuity-surfaces.ts',
  ]);
  assert.deepEqual(byId.runtime_watch_projection.source_refs, [
    'packages/redcube-domain-entry/src/actions/run-review-ref-projection.ts',
  ]);
  assert.deepEqual(byId.redcube_domain_entry_package_protocol_boundary.source_refs, [
    'packages/redcube-domain-entry/package.json',
    'packages/redcube-domain-entry/src/index.ts',
  ]);
  assert.deepEqual(byId.redcube_cli_domain_entry_adapter.source_refs, [
    'apps/redcube-cli/package.json',
    'apps/redcube-cli/src/cli-parts/dispatch.ts',
    'apps/redcube-cli/src/cli-parts/help.ts',
    'apps/redcube-cli/src/types.ts',
  ]);
  assert.equal(
    byId.redcube_cli_domain_entry_adapter.current_rca_role,
    'direct_cli_adapter_domain_handler_target_not_generated_wrapper_owner',
  );
  assert.deepEqual(byId.redcube_cli_domain_entry_adapter.legacy_name_allowance.allowed_as, [
    'service_safe_domain_entry',
    'domain_handler_target',
    'refs_only_read_model',
    'package_protocol_boundary',
  ]);
  assert.equal(
    byId.redcube_cli_domain_entry_adapter.no_resurrection_gate.generic_cli_wrapper_owner_allowed,
    false,
  );
  assert.equal(
    byId.redcube_cli_domain_entry_adapter.no_resurrection_gate.generic_workbench_owner_allowed,
    false,
  );
  assert.equal(byId.redcube_domain_entry_package_protocol_boundary.legacy_name_allowance, undefined);
  assert.equal(
    byId.product_entry_continuity_refs_adapter.current_rca_role,
    'entry_session_domain_snapshot_refs_only_adapter_consuming_opl_generated_session_shell',
  );
  assert.equal(
    byId.product_entry_continuity_refs_adapter.default_caller_cutover_gate.generated_session_command,
    'opl_generated:product_session',
  );
  assert.equal(
    byId.product_entry_continuity_refs_adapter.default_caller_cutover_gate.rca_owns_generic_session_shell,
    false,
  );
  assert.equal(
    byId.product_entry_continuity_refs_adapter.no_resurrection_gate.physical_delete_without_owner_receipt_allowed,
    false,
  );
  assert.deepEqual(byId.product_entry_continuity_refs_adapter.legacy_name_allowance.allowed_as, [
    'refs_only_read_model',
    'contract_safe_semantic_id',
    'locator_protocol_boundary',
  ]);
  assert.equal(byId.product_entry_continuity_refs_adapter.legacy_name_allowance.compatibility_alias_allowed, false);
  assert.deepEqual(byId.runtime_watch_projection.legacy_name_allowance.allowed_as, [
    'refs_only_read_model',
    'negative_test_guard',
  ]);
  assert.equal(byId.runtime_watch_projection.legacy_name_allowance.active_generic_runtime_owner_allowed, false);
  assert.equal(
    byId.runtime_watch_projection.current_rca_role,
    'run_review_existing_run_locator_refs_only_projection_not_supervisor',
  );
  assert.deepEqual(byId.workspace_run_envelope_helpers.machine_boundary_refs, [
    'packages/redcube-runtime-protocol/src/workspace.ts#WORKSPACE_LOCATOR_ENVELOPE_BOUNDARY',
    'packages/redcube-runtime-protocol/src/runs.ts#RUN_LOCATOR_ENVELOPE_BOUNDARY',
  ]);
  assert.equal(
    byId.workspace_run_envelope_helpers.no_resurrection_gate.generic_attempt_ledger_owner_allowed,
    false,
  );
  assert.deepEqual(byId.runtime_watch_projection.machine_boundary_refs, [
    'packages/redcube-domain-entry/src/actions/run-review-ref-projection.ts#RUNTIME_WATCH_BOUNDARY',
  ]);
  assert.equal(
    byId.runtime_watch_projection.no_resurrection_gate.generic_supervisor_owner_allowed,
    false,
  );
  assert.equal(
    byId.runtime_watch_projection.no_resurrection_gate.default_supervision_route_allowed,
    false,
  );
  assert.equal(
    byId.domain_action_adapter_guarded_actions.current_rca_role,
    'guarded_domain_action_target_and_refs_only_domain_action_adapter_adapter_not_domain_action_adapter_owner',
  );
  assert.equal(
    byId.operator_evidence_stability_projection.current_rca_role,
    'operator_evidence_and_stability_refs_only_read_model_consuming_opl_workbench',
  );
  assert.equal(
    byId.domain_action_adapter_guarded_actions.allowed_outputs.includes('visual_transition_decision_refs'),
    true,
  );
  assert.equal(
    byId.operator_evidence_stability_projection.allowed_outputs.includes('stability_read_model_refs'),
    true,
  );

  for (const entry of policy.active_surface_classifications) {
    for (const value of Object.values(entry.forbidden_generic_owner_flags)) {
      assert.equal(value, false, entry.surface_id);
    }
  }
});
