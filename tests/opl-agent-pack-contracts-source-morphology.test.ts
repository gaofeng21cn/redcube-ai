// @ts-nocheck
import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';

import { readJson } from './helpers/opl-agent-pack-contracts.ts';
import {
  activeShellScripts,
  assertRepoRefResolves,
  sourceRefCoversFile,
} from './helpers/rca-retired-surface-guard.ts';

const PHYSICAL_SOURCE_FORBIDDEN_OWNER_FLAGS_REF =
  'contracts/physical_source_morphology_policy.json#/forbidden_generic_owner_flags';

const EXPECTED_SURFACES = [
  ['agent_declarative_visual_pack', 'declarative_visual_pack', 'declarative_visual_pack'],
  ['runtime_program_machine_contracts', 'machine_contract', 'contract_truth_and_leaf_program_projection'],
  ['mcp_product_entry_domain_entry', 'service_safe_domain_entry', 'opl_generated_protocol_descriptor_domain_handler_target_not_generated_wrapper_owner'],
  ['redcube_cli_domain_entry_adapter', 'service_safe_domain_entry', 'direct_cli_adapter_domain_handler_target_not_generated_wrapper_owner'],
  ['redcube_domain_entry_package_protocol_boundary', 'package_protocol_boundary', 'package_protocol_boundary_for_domain_action_protocol_not_public_framework_identity'],
  ['product_entry_continuity_refs_adapter', 'refs_only_read_model', 'entry_session_domain_snapshot_refs_only_adapter_consuming_opl_generated_session_shell'],
  ['workspace_run_envelope_helpers', 'refs_only_read_model', 'workspace_and_run_locator_envelope_refs_only_adapter_not_attempt_ledger'],
  ['runtime_watch_projection', 'retained_current_refs_only_boundary', 'run_review_existing_run_locator_refs_only_projection_not_supervisor'],
  ['domain_action_adapter_guarded_actions', 'domain_handler_target', 'guarded_domain_action_target_and_refs_only_domain_action_adapter_adapter_not_domain_action_adapter_owner'],
  ['operator_evidence_stability_projection', 'retained_current_refs_only_boundary', 'operator_evidence_and_stability_refs_only_read_model_consuming_opl_workbench'],
  ['product_entry_manifest_projection', 'refs_only_read_model', 'body_free_product_entry_manifest_projection_and_shell_catalog_not_generated_wrapper_owner'],
  ['deliverable_route_attempt_shell', 'domain_handler_target', 'visual_route_attempt_domain_handler_target_not_generic_route_attempt_shell'],
  ['executor_runtime_route_run_records', 'retained_current_refs_only_boundary', 'executor_policy_and_route_run_record_refs_adapter_not_attempt_ledger'],
  ['visual_authority_functions', 'minimal_visual_authority_function', 'visual_authority_and_native_helper_implementation'],
  ['visual_route_runtime_family_implementations', 'visual_route_runtime_family_implementation', 'visual_route_truth_and_runtime_family_implementation_not_generic_runtime_owner'],
  ['repo_shell_verification_wrappers', 'repo_native_verification_wrapper', 'repo_native_bootstrap_healthcheck_hygiene_temp_env_verification_quality_gate_and_proof_wrapper_not_runtime_owner'],
  ['retired_product_entry_contract_tombstone_refs', 'tombstone_or_provenance', 'contract_safe_semantic_id_or_tombstone_provenance_only'],
];

const EXPECTED_ROUTE_COVERAGE = {
  'packages/redcube-domain-entry/src/actions/run-deliverable-route.ts': 'deliverable_route_attempt_shell',
  'packages/redcube-domain-entry/src/actions/run-deliverable-route-parts/': 'deliverable_route_attempt_shell',
  'packages/redcube-runtime-protocol/src/executor-runtime.ts': 'executor_runtime_route_run_records',
  'packages/redcube-runtime/src/deliverable-routes.ts': 'executor_runtime_route_run_records',
};
const RUNTIME_FAMILY_SOURCE_ROOTS = [
  'packages/redcube-runtime/src/families/ppt/',
  'packages/redcube-runtime/src/families/xiaohongshu/',
  'packages/redcube-runtime/src/families/poster-onepager/',
  'packages/redcube-runtime/src/default-registries.ts',
];
const EXPECTED_SHELL_SCRIPTS = [
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
];

function sourceRefIntegrityViolations(sourceRef) {
  const sourcePath = String(sourceRef).split('#')[0];
  const parts = sourcePath.split('/');
  const violations = [];
  if (sourcePath.trim() === '') violations.push('empty_ref');
  if (/^[a-z][a-z0-9+.-]*:/i.test(sourcePath)) violations.push('uri_or_url');
  if (path.isAbsolute(sourcePath) || sourcePath.startsWith('/')) violations.push('absolute_path');
  if (parts.includes('..')) violations.push('parent_directory_traversal');
  if (String(sourceRef).startsWith('human_doc:')) violations.push('human_doc_ref_as_machine_source_ref');
  return violations;
}

function readPolicy() {
  return readJson('contracts/physical_source_morphology_policy.json');
}

function surfacesById(policy) {
  return Object.fromEntries(policy.active_surface_classifications.map((entry) => [entry.surface_id, entry]));
}

function assertAllBooleans(value, expected, label) {
  if (!value || typeof value !== 'object') return;
  for (const [key, nested] of Object.entries(value)) {
    const nestedLabel = `${label}.${key}`;
    if (typeof nested === 'boolean') {
      assert.equal(nested, expected, nestedLabel);
    } else {
      assertAllBooleans(nested, expected, nestedLabel);
    }
  }
}

test('RCA physical source morphology policy classifies active source tails without generic ownership', () => {
  const policy = readPolicy();
  const byId = surfacesById(policy);

  assert.equal(policy.surface_kind, 'rca_physical_source_morphology_policy');
  assert.equal(policy.status, 'active_source_classification_policy_landed');
  assert.equal(policy.canonical_pack_root, 'agent/');
  assert.equal(policy.legacy_name_policy.compatibility_alias_allowed, false);
  assert.equal(policy.legacy_name_policy.allowance_required_for_active_surface_text_matches, true);
  assert.deepEqual(policy.legacy_name_policy.tracked_legacy_terms, [
    'managed',
    'runtime',
    'gateway',
    'session',
    'domain_action_adapter',
  ]);
  for (const forbiddenFlag of [
    'active_generic_runtime_owner_allowed',
    'active_generic_domain_entry_owner_allowed',
    'active_generic_gateway_owner_allowed',
    'active_generic_session_runtime_owner_allowed',
  ]) {
    assert.equal(policy.legacy_name_policy[forbiddenFlag], false, forbiddenFlag);
  }
  for (const role of [
    'machine_contract_ref',
    'package_protocol_boundary',
    'service_safe_domain_entry',
    'refs_only_read_model',
    'retained_current_refs_only_boundary',
    'domain_handler_target',
    'minimal_visual_authority_function',
    'repo_native_verification_wrapper',
    'locator_protocol_boundary',
  ]) {
    assert.equal(policy.legacy_name_policy.allowed_legacy_name_roles.includes(role), true, role);
  }

  assert.equal(
    policy.policy_source_structure.builder_ref,
    'packages/redcube-domain-entry/src/actions/domain-action-adapter-parts/physical-source-morphology-policy.ts#buildPhysicalSourceMorphologyPolicy',
  );
  assert.deepEqual(policy.policy_source_structure.extracted_gate_refs, [
    'packages/redcube-domain-entry/src/actions/domain-action-adapter-parts/physical-source-morphology-policy-tail-gate.ts#SOURCE_THINNING_TAIL_GATE',
  ]);
  assertAllBooleans(policy.policy_source_structure.authority_boundary, false, 'policy_source_structure.authority_boundary');
  assertRepoRefResolves(policy.policy_source_structure.builder_ref, 'policy_source_structure.builder_ref');
  for (const sourceRef of policy.policy_source_structure.extracted_gate_refs) {
    assertRepoRefResolves(sourceRef, 'policy_source_structure.extracted_gate_refs');
  }

  assert.deepEqual(
    policy.active_surface_classifications.map((entry) => entry.surface_id),
    EXPECTED_SURFACES.map(([surfaceId]) => surfaceId),
  );
  for (const [surfaceId, classification, currentRole] of EXPECTED_SURFACES) {
    const entry = byId[surfaceId];
    assert.ok(entry, surfaceId);
    assert.equal(entry.classification, classification, surfaceId);
    assert.equal(entry.current_rca_role, currentRole, surfaceId);
    assert.notDeepEqual(entry.source_refs ?? [], [], `${surfaceId}.source_refs`);
    assert.equal(entry.forbidden_generic_owner_flags, undefined, surfaceId);
    assert.equal(entry.forbidden_generic_owner_flags_ref, PHYSICAL_SOURCE_FORBIDDEN_OWNER_FLAGS_REF, surfaceId);
    assertAllBooleans(entry.legacy_name_allowance, false, `${surfaceId}.legacy_name_allowance`);
    assertAllBooleans(entry.no_resurrection_gate, false, `${surfaceId}.no_resurrection_gate`);
  }
  assert.equal(byId.legacy_managed_runtime_gateway_names, undefined);
  assertAllBooleans(policy.forbidden_generic_owner_flags, false, 'forbidden_generic_owner_flags');

  assert.deepEqual(byId.repo_shell_verification_wrappers.source_refs, activeShellScripts());
  assert.deepEqual(byId.workspace_run_envelope_helpers.machine_boundary_refs, [
    'packages/redcube-runtime-protocol/src/workspace.ts#WORKSPACE_LOCATOR_ENVELOPE_BOUNDARY',
    'packages/redcube-runtime-protocol/src/runs.ts#RUN_LOCATOR_ENVELOPE_BOUNDARY',
  ]);
  assert.deepEqual(byId.runtime_watch_projection.machine_boundary_refs, [
    'packages/redcube-domain-entry/src/actions/run-review-ref-projection.ts#RUNTIME_WATCH_BOUNDARY',
  ]);

  const gate = policy.default_caller_tail_thinning_gate;
  assert.equal(gate.gate_id, 'rca.source_morphology.default_caller_tail_thinning.v1');
  assert.equal(gate.state, 'non_live_functional_structure_gate_landed');
  assert.deepEqual(gate.applies_to_surface_ids, []);
  assert.deepEqual(gate.current_non_tail_surface_ids, [
    'product_entry_continuity_refs_adapter',
    'domain_action_adapter_guarded_actions',
    'product_entry_manifest_projection',
    'deliverable_route_attempt_shell',
    'repo_shell_verification_wrappers',
  ]);
  assert.deepEqual(gate.retained_current_refs_only_boundary_ids, [
    'runtime_watch_projection',
    'operator_evidence_stability_projection',
    'executor_runtime_route_run_records',
  ]);
  assertAllBooleans(gate.false_ready_guard, false, 'default_caller_tail_thinning_gate.false_ready_guard');
  assertAllBooleans(gate.current_role_guard, false, 'default_caller_tail_thinning_gate.current_role_guard');

  const readbackGuard = gate.retirement_readback_cleanup_guard;
  assert.equal(readbackGuard.guard_id, 'rca.source_morphology.retirement_readback_cleanup_guard.v1');
  assert.equal(readbackGuard.state, 'readback_guard_available_physical_delete_not_authorized');
  assert.deepEqual(readbackGuard.json_transport_guard.command_refs, [
    'npm run private-platform:readback',
    'npm run test:private-platform:strict',
  ]);
  assert.equal(readbackGuard.claims.claims_retirement_cleanup_complete, false);
  assert.equal(readbackGuard.claims.claims_physical_delete_authorized, false);
  assert.equal(readbackGuard.claims.claims_visual_ready, false);
  assert.equal(readbackGuard.claims.claims_production_ready, false);
  assert.equal(readbackGuard.authority_boundary.guard_can_identify_cleanup_candidates, true);
  assert.equal(readbackGuard.authority_boundary.guard_can_route_owner_delta, true);
  assert.equal(readbackGuard.authority_boundary.guard_can_authorize_physical_delete, false);
  assert.equal(readbackGuard.authority_boundary.guard_can_sign_owner_receipt, false);
  assert.equal(readbackGuard.authority_boundary.guard_can_create_typed_blocker, false);

  const readback = policy.default_caller_tail_readback;
  assert.equal(readback.readback_id, 'rca.source_morphology.default_caller_tail_readback.v1');
  assert.equal(readback.source_gate_ref, 'contracts/physical_source_morphology_policy.json#/default_caller_tail_thinning_gate');
  assert.equal(readback.tail_surface_count, 0);
  assert.equal(readback.current_non_tail_surface_count, 5);
  assert.equal(readback.missing_evidence_surface_count, 0);
  assert.equal(readback.all_tail_surfaces_missing_delete_or_further_thin_evidence, false);
  assert.deepEqual(readback.compact_retirement_summary.missing_evidence_ids, []);
  assert.deepEqual(readback.compact_retirement_summary.cleanup_candidate_surface_ids, []);
  assert.equal(readback.compact_retirement_summary.can_apply_cleanup, false);
  assert.equal(readback.compact_retirement_summary.owner_delta_required, false);
  assert.equal(readback.compact_retirement_summary.owner_delta_work_order_pack.authority_boundary.work_order_can_sign_owner_receipt, false);
  assert.deepEqual(
    readback.retained_default_caller_boundary_gate,
    readback.compact_retirement_summary.retained_default_caller_boundary_gate,
  );
  assertAllBooleans(readback.false_ready_guard, false, 'default_caller_tail_readback.false_ready_guard');
  assert.deepEqual(
    readback.current_non_tail_surfaces.map((entry) => entry.surface_id),
    gate.current_non_tail_surface_ids,
  );
  assert.deepEqual(
    readback.retained_current_refs_only_boundaries.map((entry) => entry.surface_id),
    gate.retained_current_refs_only_boundary_ids,
  );
  for (const entry of [...readback.current_non_tail_surfaces, ...readback.retained_current_refs_only_boundaries]) {
    assert.equal(entry.classification, byId[entry.surface_id].classification, entry.surface_id);
    assert.deepEqual(entry.source_refs, byId[entry.surface_id].source_refs, entry.surface_id);
    assertAllBooleans(entry.current_role_guard, false, `${entry.surface_id}.current_role_guard`);
    assertAllBooleans(entry.readback_claims, false, `${entry.surface_id}.readback_claims`);
  }
});

test('RCA route attempt and route-run record tails are explicitly classified', () => {
  const policy = readPolicy();

  for (const [sourceRef, expectedSurfaceId] of Object.entries(EXPECTED_ROUTE_COVERAGE)) {
    assert.equal(fs.existsSync(path.resolve(sourceRef)), true, sourceRef);
    const coveringEntries = policy.active_surface_classifications.filter((entry) => (
      entry.source_refs || []
    ).some((candidateRef) => sourceRefCoversFile(candidateRef, sourceRef)));
    assert.deepEqual(
      coveringEntries.map((entry) => entry.surface_id),
      [expectedSurfaceId],
      sourceRef,
    );
    assertAllBooleans(coveringEntries[0].legacy_name_allowance, false, sourceRef);
  }
});

test('RCA runtime-family route implementations are classified as visual route implementations only', () => {
  const policy = readPolicy();

  for (const sourceRoot of RUNTIME_FAMILY_SOURCE_ROOTS) {
    assert.equal(fs.existsSync(path.resolve(sourceRoot)), true, sourceRoot);
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
  const policy = readPolicy();
  const shellSurface = surfacesById(policy).repo_shell_verification_wrappers;
  const activeShellScriptPaths = activeShellScripts();

  assert.deepEqual(activeShellScriptPaths, EXPECTED_SHELL_SCRIPTS);
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
  const policy = readPolicy();
  const allSourceRefs = [...new Set([
    ...policy.active_surface_classifications.flatMap((entry) => entry.source_refs ?? []),
    policy.policy_source_structure.builder_ref,
    ...policy.policy_source_structure.extracted_gate_refs,
  ])].sort();
  const allMachineBoundaryRefs = [...new Set(policy.active_surface_classifications.flatMap(
    (entry) => entry.machine_boundary_refs ?? [],
  ))].sort();

  assert.equal(policy.source_ref_integrity_gate.policy_kind, 'active_surface_source_refs_must_resolve_before_classification_is_trusted');
  assert.equal(policy.source_ref_integrity_gate.state, 'repo_local_source_refs_declared_no_second_truth');
  assert.equal(policy.source_ref_integrity_gate.checked_source_ref_count, allSourceRefs.length);
  assert.equal(policy.source_ref_integrity_gate.checked_machine_boundary_ref_count, allMachineBoundaryRefs.length);
  assert.deepEqual(policy.source_ref_integrity_gate.checked_source_refs, allSourceRefs);
  assert.deepEqual(policy.source_ref_integrity_gate.checked_machine_boundary_refs, allMachineBoundaryRefs);
  assert.deepEqual(policy.source_ref_integrity_gate.accepted_ref_shapes, ['repo_path', 'repo_directory', 'repo_path_anchor']);
  assert.equal(policy.source_ref_integrity_gate.repo_local_refs_only, true);
  assert.equal(policy.source_ref_integrity_gate.absolute_path_allowed, false);
  assert.equal(policy.source_ref_integrity_gate.parent_directory_traversal_allowed, false);
  assert.equal(policy.source_ref_integrity_gate.uri_ref_allowed, false);
  assert.equal(policy.source_ref_integrity_gate.human_doc_ref_allowed_as_machine_source_ref, false);
  assert.equal(policy.source_ref_integrity_gate.machine_boundary_refs_require_anchor, true);
  assert.equal(policy.source_ref_integrity_gate.missing_source_ref_allowed, false);
  assert.equal(policy.source_ref_integrity_gate.generic_owner_classification_from_unresolved_ref_allowed, false);
  assertAllBooleans(policy.source_ref_integrity_gate.authority_boundary, false, 'source_ref_integrity_gate.authority_boundary');

  assert.deepEqual(sourceRefIntegrityViolations('/tmp/redcube.ts'), ['absolute_path']);
  assert.deepEqual(sourceRefIntegrityViolations('../redcube.ts'), ['parent_directory_traversal']);
  assert.deepEqual(sourceRefIntegrityViolations('https://example.test/redcube.ts'), ['uri_or_url']);
  assert.deepEqual(sourceRefIntegrityViolations('human_doc:docs/status.md'), ['human_doc_ref_as_machine_source_ref']);

  for (const entry of policy.active_surface_classifications) {
    for (const sourceRef of entry.source_refs ?? []) {
      assert.deepEqual(sourceRefIntegrityViolations(sourceRef), [], `${entry.surface_id}.source_refs`);
      assertRepoRefResolves(sourceRef, `${entry.surface_id}.source_refs`);
    }
    for (const sourceRef of entry.machine_boundary_refs ?? []) {
      assert.equal(String(sourceRef).includes('#'), true, `${entry.surface_id}.machine_boundary_refs`);
      assert.deepEqual(sourceRefIntegrityViolations(sourceRef), [], `${entry.surface_id}.machine_boundary_refs`);
      assertRepoRefResolves(sourceRef, `${entry.surface_id}.machine_boundary_refs`);
    }
  }
});
