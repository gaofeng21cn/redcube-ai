// @ts-nocheck
import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';

import { readJson } from './helpers/opl-agent-pack-contracts.ts';
import {
  activeShellScripts,
  assertRepoRefResolves,
  normalizePath,
  sourceRefCoversFile,
} from './helpers/rca-retired-surface-guard.ts';

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
    'visual_route_runtime_family_implementation',
    'visual_native_helper_path',
    'repo_native_verification_wrapper',
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
  assert.equal(policy.allowed_surface_classes.includes('repo_native_verification_wrapper'), true);

  assert.equal(byId.mcp_product_entry_domain_entry.classification, 'service_safe_domain_entry');
  assert.equal(byId.redcube_cli_domain_entry_adapter.classification, 'service_safe_domain_entry');
  assert.equal(byId.redcube_domain_entry_package_protocol_boundary.classification, 'package_protocol_boundary');
  assert.equal(byId.product_entry_continuity_refs_adapter.classification, 'refs_only_read_model');
  assert.equal(byId.workspace_run_envelope_helpers.classification, 'refs_only_read_model');
  assert.equal(byId.runtime_watch_projection.classification, 'refs_only_read_model');
  assert.equal(byId.domain_action_adapter_guarded_actions.classification, 'domain_handler_target');
  assert.equal(byId.operator_evidence_stability_projection.classification, 'refs_only_read_model');
  assert.equal(byId.product_entry_manifest_projection.classification, 'refs_only_read_model');
  assert.equal(byId.visual_authority_functions.classification, 'minimal_visual_authority_function');
  assert.equal(byId.visual_route_runtime_family_implementations.classification, 'visual_route_runtime_family_implementation');
  assert.equal(byId.repo_shell_verification_wrappers.classification, 'repo_native_verification_wrapper');
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
  assert.deepEqual(byId.repo_shell_verification_wrappers.source_refs, [
    'scripts/opl-module-bootstrap.sh',
    'scripts/opl-module-healthcheck.sh',
    'scripts/repo-hygiene.sh',
    'scripts/run-opl-quality-details.sh',
    'scripts/run-structural-quality-gate.sh',
    'scripts/run-with-repo-temp-env.sh',
    'scripts/verify.sh',
    'tools/image-ppt-proof/run.sh',
    'tools/native-ppt-proof/install-deps.sh',
    'tools/native-ppt-proof/run.sh',
  ]);
  assert.equal(
    byId.repo_shell_verification_wrappers.current_rca_role,
    'repo_native_bootstrap_healthcheck_hygiene_temp_env_verification_quality_gate_and_proof_wrapper_not_runtime_owner',
  );
  assert.deepEqual(byId.repo_shell_verification_wrappers.allowed_outputs, [
    'repo_hygiene_check_refs',
    'external_temp_env_boundary_refs',
    'repo_native_verification_refs',
    'module_bootstrap_refs',
    'module_healthcheck_refs',
    'structural_quality_gate_refs',
    'quality_details_refs',
    'proof_lane_artifact_refs',
    'optional_native_dependency_install_refs',
  ]);
  assert.deepEqual(byId.repo_shell_verification_wrappers.legacy_name_allowance.allowed_as, [
    'repo_native_verification_wrapper',
    'negative_test_guard',
  ]);
  assert.equal(byId.repo_shell_verification_wrappers.no_resurrection_gate.generic_runner_owner_allowed, false);
  assert.equal(byId.repo_shell_verification_wrappers.no_resurrection_gate.generic_attempt_ledger_owner_allowed, false);
  assert.equal(byId.repo_shell_verification_wrappers.no_resurrection_gate.generic_workbench_owner_allowed, false);
  assert.equal(byId.repo_shell_verification_wrappers.no_resurrection_gate.generic_session_runtime_owner_allowed, false);
  assert.equal(byId.repo_shell_verification_wrappers.no_resurrection_gate.generic_domain_entry_runtime_owner_allowed, false);
  assert.equal(byId.repo_shell_verification_wrappers.no_resurrection_gate.generic_supervisor_owner_allowed, false);
  assert.equal(byId.repo_shell_verification_wrappers.no_resurrection_gate.compatibility_alias_allowed, false);
  assert.equal(byId.repo_shell_verification_wrappers.no_resurrection_gate.callable_alias_allowed, false);
  assert.equal(byId.repo_shell_verification_wrappers.no_resurrection_gate.production_readiness_claim_allowed, false);
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
  assert.deepEqual(byId.product_entry_manifest_projection.source_refs, [
    'packages/redcube-domain-entry/src/actions/get-product-entry-manifest.ts',
    'packages/redcube-domain-entry/src/actions/get-product-entry-manifest-parts/',
  ]);
  assert.equal(
    byId.product_entry_manifest_projection.current_rca_role,
    'body_free_product_entry_manifest_projection_and_shell_catalog_not_generated_wrapper_owner',
  );
  assert.deepEqual(byId.product_entry_manifest_projection.allowed_outputs, [
    'product_entry_manifest_refs',
    'domain_entry_contract_refs',
    'visual_route_policy_refs',
    'operator_projection_refs',
    'opl_generated_shell_projection_refs',
    'typed_blocker_refs',
  ]);
  assert.deepEqual(byId.product_entry_manifest_projection.legacy_name_allowance.allowed_as, [
    'refs_only_read_model',
    'domain_handler_target',
    'contract_safe_semantic_id',
    'locator_protocol_boundary',
    'negative_test_guard',
  ]);
  assert.deepEqual(byId.product_entry_manifest_projection.no_resurrection_gate, {
    generic_product_wrapper_owner_allowed: false,
    generic_session_runtime_owner_allowed: false,
    generic_workbench_owner_allowed: false,
    generic_domain_action_adapter_owner_allowed: false,
    generic_generated_wrapper_owner_allowed: false,
    compatibility_alias_allowed: false,
    callable_alias_allowed: false,
    production_readiness_claim_allowed: false,
  });
  assert.equal(
    byId.domain_action_adapter_guarded_actions.allowed_outputs.includes('visual_transition_decision_refs'),
    true,
  );
  assert.equal(
    byId.operator_evidence_stability_projection.allowed_outputs.includes('stability_read_model_refs'),
    true,
  );
  assert.deepEqual(byId.deliverable_route_attempt_shell.source_refs, [
    'packages/redcube-domain-entry/src/actions/run-deliverable-route.ts',
    'packages/redcube-domain-entry/src/actions/run-deliverable-route-parts/',
  ]);
  assert.equal(
    byId.deliverable_route_attempt_shell.current_rca_role,
    'visual_route_attempt_domain_handler_target_not_generic_route_attempt_shell',
  );
  assert.equal(byId.deliverable_route_attempt_shell.classification, 'domain_handler_target');
  assert.deepEqual(byId.deliverable_route_attempt_shell.legacy_name_allowance.allowed_as, [
    'domain_handler_target',
    'refs_only_read_model',
    'negative_test_guard',
  ]);
  assert.equal(
    byId.deliverable_route_attempt_shell.default_caller_cutover_gate.generated_route_attempt_shell_owner,
    'one-person-lab',
  );
  assert.equal(
    byId.deliverable_route_attempt_shell.default_caller_cutover_gate.rca_owns_generic_route_attempt_shell,
    false,
  );
  assert.equal(
    byId.deliverable_route_attempt_shell.no_resurrection_gate.generic_route_attempt_shell_owner_allowed,
    false,
  );
  assert.equal(
    byId.deliverable_route_attempt_shell.no_resurrection_gate.generic_attempt_ledger_owner_allowed,
    false,
  );
  assert.deepEqual(byId.executor_runtime_route_run_records.source_refs, [
    'packages/redcube-runtime-protocol/src/executor-runtime.ts',
    'packages/redcube-runtime-protocol/src/executor-runtime-parts/route-run-records.ts',
  ]);
  assert.equal(byId.executor_runtime_route_run_records.classification, 'refs_only_read_model');
  assert.equal(
    byId.executor_runtime_route_run_records.current_rca_role,
    'executor_policy_and_route_run_record_refs_adapter_not_attempt_ledger',
  );
  assert.deepEqual(byId.executor_runtime_route_run_records.legacy_name_allowance.allowed_as, [
    'refs_only_read_model',
    'package_protocol_boundary',
    'locator_protocol_boundary',
  ]);
  assert.equal(
    byId.executor_runtime_route_run_records.default_caller_cutover_gate.generated_attempt_ledger_owner,
    'one-person-lab',
  );
  assert.equal(
    byId.executor_runtime_route_run_records.default_caller_cutover_gate.rca_owns_generic_attempt_ledger,
    false,
  );
  assert.equal(
    byId.executor_runtime_route_run_records.no_resurrection_gate.generic_runtime_record_store_owner_allowed,
    false,
  );
  assert.equal(
    byId.executor_runtime_route_run_records.no_resurrection_gate.generic_event_log_owner_allowed,
    false,
  );
  assert.deepEqual(byId.visual_route_runtime_family_implementations.source_refs, [
    'packages/redcube-runtime-family-ppt/src/',
    'packages/redcube-runtime-family-xiaohongshu/src/',
    'packages/redcube-runtime-family-poster-onepager/src/',
    'packages/redcube-runtime-family-registry/src/',
  ]);
  assert.equal(
    byId.visual_route_runtime_family_implementations.current_rca_role,
    'visual_route_truth_and_runtime_family_implementation_not_generic_runtime_owner',
  );
  assert.deepEqual(byId.visual_route_runtime_family_implementations.allowed_outputs, [
    'visual_route_artifact_refs',
    'route_family_policy_refs',
    'review_export_gate_refs',
    'stage_artifact_refs',
    'runtime_family_catalog_refs',
  ]);
  assert.deepEqual(byId.visual_route_runtime_family_implementations.legacy_name_allowance.allowed_as, [
    'visual_route_runtime_family_implementation',
    'package_protocol_boundary',
  ]);
  assert.equal(
    byId.visual_route_runtime_family_implementations.no_resurrection_gate.generic_attempt_ledger_owner_allowed,
    false,
  );
  assert.equal(
    byId.visual_route_runtime_family_implementations.no_resurrection_gate.generic_session_runtime_owner_allowed,
    false,
  );
  assert.equal(
    byId.visual_route_runtime_family_implementations.no_resurrection_gate.generic_generated_wrapper_owner_allowed,
    false,
  );
  assert.equal(
    byId.visual_route_runtime_family_implementations.no_resurrection_gate.production_readiness_claim_allowed,
    false,
  );

  for (const entry of policy.active_surface_classifications) {
    for (const value of Object.values(entry.forbidden_generic_owner_flags)) {
      assert.equal(value, false, entry.surface_id);
    }
  }
});

test('RCA route attempt and route-run record tails are explicitly classified', () => {
  const policy = readJson('contracts/physical_source_morphology_policy.json');
  const expectedCoverage = {
    'packages/redcube-domain-entry/src/actions/run-deliverable-route.ts': 'deliverable_route_attempt_shell',
    'packages/redcube-domain-entry/src/actions/run-deliverable-route-parts/': 'deliverable_route_attempt_shell',
    'packages/redcube-runtime-protocol/src/executor-runtime.ts': 'executor_runtime_route_run_records',
    'packages/redcube-runtime-protocol/src/executor-runtime-parts/route-run-records.ts': 'executor_runtime_route_run_records',
  };

  for (const [sourceRef, expectedSurfaceId] of Object.entries(expectedCoverage)) {
    assert.equal(fs.existsSync(path.resolve(sourceRef)), true, sourceRef);
    const coveringEntries = policy.active_surface_classifications.filter((entry) => (
      entry.source_refs || []
    ).some((candidateRef) => sourceRefCoversFile(candidateRef, sourceRef)));
    assert.deepEqual(
      coveringEntries.map((entry) => entry.surface_id),
      [expectedSurfaceId],
      sourceRef,
    );
    const [surface] = coveringEntries;
    assert.equal(surface.legacy_name_allowance.compatibility_alias_allowed, false, sourceRef);
    assert.equal(surface.legacy_name_allowance.active_generic_runtime_owner_allowed, false, sourceRef);
    assert.equal(surface.legacy_name_allowance.active_generic_attempt_ledger_owner_allowed, false, sourceRef);
  }
});

test('RCA runtime-family route implementations are classified as visual route implementations only', () => {
  const policy = readJson('contracts/physical_source_morphology_policy.json');
  const runtimeFamilySourceRoots = [
    'packages/redcube-runtime-family-ppt/src/',
    'packages/redcube-runtime-family-xiaohongshu/src/',
    'packages/redcube-runtime-family-poster-onepager/src/',
    'packages/redcube-runtime-family-registry/src/',
  ];

  for (const sourceRoot of runtimeFamilySourceRoots) {
    const rootPath = path.resolve(sourceRoot);
    assert.equal(fs.existsSync(rootPath), true, sourceRoot);
    const coveringEntries = policy.active_surface_classifications.filter((entry) => (
      entry.source_refs || []
    ).some((sourceRef) => sourceRefCoversFile(sourceRef, sourceRoot)));
    assert.deepEqual(
      coveringEntries.map((entry) => entry.surface_id),
      ['visual_route_runtime_family_implementations'],
      sourceRoot,
    );
  }
});

test('RCA physical source morphology classifies every active shell wrapper explicitly', () => {
  const policy = readJson('contracts/physical_source_morphology_policy.json');
  const byId = Object.fromEntries(policy.active_surface_classifications.map((entry) => [entry.surface_id, entry]));
  const activeShellScriptPaths = activeShellScripts();
  const shellSurface = byId.repo_shell_verification_wrappers;

  assert.deepEqual(activeShellScriptPaths, [
    'scripts/opl-module-bootstrap.sh',
    'scripts/opl-module-healthcheck.sh',
    'scripts/repo-hygiene.sh',
    'scripts/run-opl-quality-details.sh',
    'scripts/run-structural-quality-gate.sh',
    'scripts/run-with-repo-temp-env.sh',
    'scripts/verify.sh',
    'tools/image-ppt-proof/run.sh',
    'tools/native-ppt-proof/install-deps.sh',
    'tools/native-ppt-proof/run.sh',
  ]);
  assert.deepEqual([...shellSurface.source_refs].sort(), activeShellScriptPaths);

  for (const scriptPath of activeShellScriptPaths) {
    const coveringEntries = policy.active_surface_classifications.filter((entry) => (
      entry.source_refs || []
    ).some((sourceRef) => sourceRefCoversFile(sourceRef, scriptPath)));
    assert.deepEqual(
      coveringEntries.map((entry) => entry.surface_id),
      ['repo_shell_verification_wrappers'],
      scriptPath,
    );
  }
});

test('RCA physical source morphology source refs resolve under source_ref_integrity_gate', () => {
  const policy = readJson('contracts/physical_source_morphology_policy.json');

  assert.deepEqual(policy.source_ref_integrity_gate, {
    policy_kind: 'active_surface_source_refs_must_resolve_before_classification_is_trusted',
    applies_to: [
      'active_surface_classifications[*].source_refs',
      'active_surface_classifications[*].machine_boundary_refs',
    ],
    accepted_ref_shapes: ['repo_path', 'repo_directory', 'repo_path_anchor'],
    anchor_separator: '#',
    repo_local_refs_only: true,
    absolute_path_allowed: false,
    parent_directory_traversal_allowed: false,
    uri_ref_allowed: false,
    machine_boundary_refs_require_anchor: true,
    stale_source_ref_reopens_gap: true,
    missing_source_ref_allowed: false,
    missing_machine_boundary_anchor_allowed: false,
    generic_owner_classification_from_unresolved_ref_allowed: false,
    production_readiness_claim_allowed: false,
  });

  for (const entry of policy.active_surface_classifications) {
    assert.notDeepEqual(entry.source_refs ?? [], [], `${entry.surface_id}.source_refs`);
    for (const sourceRef of entry.source_refs ?? []) {
      assertRepoRefResolves(sourceRef, `${entry.surface_id}.source_refs`);
    }
    for (const sourceRef of entry.machine_boundary_refs ?? []) {
      assert.equal(String(sourceRef).includes('#'), true, `${entry.surface_id}.machine_boundary_refs`);
      assertRepoRefResolves(sourceRef, `${entry.surface_id}.machine_boundary_refs`);
    }
  }
});
