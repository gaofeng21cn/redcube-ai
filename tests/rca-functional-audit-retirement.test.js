import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { readFileSync } from 'node:fs';
import { buildStandardAgentSourceBehaviorChecks } from '../node_modules/opl-framework/dist/modules/foundry-lab/standard-domain-agent-source-behavior.js';

import {
  activeShellScripts,
  assertRepoRefResolves,
} from './helpers/rca-retired-surface-guard.js';

const FUNCTIONAL_MODULE_FORBIDDEN_OWNER_FLAGS_REF =
  'contracts/functional_privatization_audit.json#/forbidden_generic_owner_flags';
const PHYSICAL_SOURCE_FORBIDDEN_OWNER_FLAGS_REF =
  'contracts/physical_source_morphology_policy.json#/forbidden_generic_owner_flags';

function readJson(relativePath) {
  return JSON.parse(readFileSync(path.resolve(relativePath), 'utf-8'));
}

function assertAllFalse(record, label) {
  for (const [key, value] of Object.entries(record || {})) {
    assert.equal(value, false, `${label}.${key}`);
  }
}

function byId(entries, key = 'module_id') {
  return Object.fromEntries(entries.map((entry) => [entry[key], entry]));
}

function assertSourceRefsResolve(entry, label) {
  assert.notDeepEqual(entry.source_refs ?? [], [], `${label}.source_refs`);
  for (const sourceRef of entry.source_refs ?? []) {
    assertRepoRefResolves(sourceRef, `${label}.source_refs`);
  }
  for (const sourceRef of entry.machine_boundary_refs ?? []) {
    assert.equal(String(sourceRef).includes('#'), true, `${label}.machine_boundary_refs`);
    assertRepoRefResolves(sourceRef, `${label}.machine_boundary_refs`);
  }
}

test('RCA functional audit keeps generic runtime ownership retired without copying the audit body into adoption', () => {
  const audit = readJson('contracts/functional_privatization_audit.json');
  const adoptionProjection = readJson('contracts/runtime-program/opl-family-contract-adoption.json')
    .privatized_functional_module_audit;
  const modules = byId(audit.modules);

  assert.deepEqual(adoptionProjection, {
    surface_kind: 'privatized_functional_module_audit_projection_ref',
    surface_id: 'privatized_functional_module_audit',
    projection_mode: 'canonical_ref_only_no_body_copy',
    body_copy_in_adoption: false,
    duplicate_body_policy: 'canonical body stays in the referenced contract or generated product-entry readback; adoption records refs only',
    canonical_contract_ref: 'contracts/functional_privatization_audit.json#/',
    generated_readback_ref: 'opl_generated:product_entry_manifest#/privatized_functional_module_audit',
  });

  assert.equal(audit.replacement_expectation_mode, 'opl_replacement_expectation_or_refs_only_projection');
  assert.equal(audit.functional_structure_gap_closure.functional_structure_gap_count, 0);
  assert.equal(audit.functional_structure_gap_closure.remaining_gap_class, 'none');
  assert.equal(
    audit.functional_structure_gap_closure.evidence_gap_class,
    'production_live_soak_evidence_only',
  );
  assert.deepEqual(audit.functional_structure_gap_closure.remaining_functional_structure_gap_ids, []);
  assert.equal(audit.physical_deletion_guard.current_safe_tombstone_candidate_count, 0);
  assert.equal(audit.physical_deletion_guard.surface_kind, 'rca_private_platform_retirement_guard');
  assert.equal(audit.physical_deletion_guard.state, 'no_cleanup_candidates_current_roles_guarded');
  assert.equal(audit.physical_deletion_guard.cleanup_candidate_count, 0);
  assert.equal(audit.physical_deletion_guard.physical_delete_authorized, false);
  assert.equal(audit.physical_deletion_guard.default_caller_cutover_claim_authorized, false);
  assert.equal(audit.physical_deletion_guard.closed_retirement_count, 8);
  assert.equal(audit.physical_deletion_guard.closed_default_caller_retirement_count, 5);
  assert.equal(audit.closed_retirement_summary, undefined);
  assert.equal(audit.owner_evidence_lane_index, undefined);
  assert.equal(audit.retire_tombstone_candidates, undefined);
  assert.equal(audit.retired_no_resurrection_guards, undefined);
  assertAllFalse(audit.forbidden_generic_owner_flags, 'forbidden_generic_owner_flags');
  assertAllFalse(
    audit.physical_deletion_guard.current_role_guard.forbidden_owner_flags,
    'physical_deletion_guard.current_role_guard',
  );

  assert.deepEqual(Object.keys(modules).sort(), [
    'artifact_export_lifecycle',
    'codex_executor_adapter',
    'generic_cli_mcp_wrappers',
    'memory_writeback_receipt_transport',
    'native_helper_envelope',
    'observability_stability_read_model',
    'operator_projection_shell',
    'product_entry_continuity_refs_adapter',
    'review_repair_transport',
    'visual_authority_functions',
    'visual_pack_compiler_handoff',
    'workspace_source_intake',
  ]);

  for (const [moduleId, entry] of Object.entries(modules)) {
    assert.ok(['opl', 'redcube_ai'].includes(entry.opl_replacement_expectation.owner), moduleId);
    assert.ok([
      'consumer_projection_only',
      'declarative_pack_provider',
      'authority_function_owner',
    ].includes(entry.opl_replacement_expectation.rca_consumes_as), moduleId);
    assert.equal(entry.opl_replacement_expectation.rca_owns_replacement_runtime, false, moduleId);
    assert.equal(entry.forbidden_generic_owner_flags, undefined, moduleId);
    assert.equal(entry.forbidden_generic_owner_flags_ref, FUNCTIONAL_MODULE_FORBIDDEN_OWNER_FLAGS_REF, moduleId);
    assert.equal(entry.physical_deletion_guard.safe_to_delete_now, false, moduleId);
    assert.equal(
      entry.retirement_guard_ref,
      'contracts/functional_privatization_audit.json#/physical_deletion_guard',
      moduleId,
    );
    assert.equal(entry.physical_deletion_guard.owner_evidence_lane_ref, undefined, moduleId);
    assert.equal(entry.physical_deletion_guard.typed_blocker_ref, undefined, moduleId);
    assert.equal(entry.declares_production_soak_complete, false, moduleId);

    if (moduleId === 'visual_pack_compiler_handoff') {
      continue;
    }
    if (moduleId === 'visual_authority_functions') {
      assert.deepEqual(entry.authority_surface_taxonomy.ai_first_judgment_surface_ids, [
        'source_readiness_verdict',
        'communication_visual_direction_decision',
        'review_export_verdict',
        'visual_memory_accept_reject',
      ]);
      assert.equal(entry.programmatic_verdict_generation_allowed, false);
      assert.equal(entry.mechanical_decision_forbidden_for_all_authority_surfaces, true);
      continue;
    }
    if (moduleId === 'product_entry_continuity_refs_adapter') {
      assert.match(entry.physical_deletion_guard.reason, /generic session sources are retired/i);
      assert.equal(entry.physical_deletion_guard.generic_session_source_retirement, 'completed');
      continue;
    }
  }

  assert.equal(
    modules.product_entry_continuity_refs_adapter.opl_replacement_expectation.replacement_surface,
    'opl_app_session_shell_and_workbench',
  );
  assert.equal(
    modules.generic_cli_mcp_wrappers.opl_replacement_expectation.replacement_surface,
    'opl_standard_domain_agent_generated_cli_mcp_wrappers',
  );
  assert.equal(
    modules.native_helper_envelope.migration_class,
    'native_helper_implementation',
  );
});

test('RCA canonical functional audit leaves no OPL source-behavior residue', () => {
  const checks = buildStandardAgentSourceBehaviorChecks(path.resolve());

  assert.equal(checks.status, 'passed');
  assert.equal(checks.matched_source_behavior_count, 0);
  assert.equal(checks.unclassified_generic_behavior_count, 0);
  assert.equal(checks.active_private_generic_residue_count, 0);
});

test('RCA functional audit records runtimeWatch generic shell retirement', () => {
  const audit = readJson('contracts/functional_privatization_audit.json');
  const thinning = audit.runtime_watch_thinning;

  assert.equal(thinning.status, 'generic_runtime_status_shell_retired');
  assert.equal(thinning.surface_kind, 'rca_visual_review_refs_projection');
  assert.equal(thinning.generic_runtime_status_owner, 'one-person-lab');
  assert.equal(thinning.accepts_generic_run_input, false);
  assert.equal(thinning.compatibility_facade_allowed, false);
  assert.equal(thinning.fallback_allowed, false);
  assert.deepEqual(thinning.allowed_outputs, [
    'delivery_locator_refs',
    'visual_review_semantics',
    'review_state_refs',
    'artifact_locator_refs',
    'typed_blocker_refs',
    'owner_evidence_refs',
  ]);
  for (const field of ['status', 'current_stage', 'resumable', 'run_telemetry', 'lifecycle_stage_summary']) {
    assert.equal(thinning.retired_generic_outputs.includes(field), true, field);
  }
});

test('RCA physical morphology policy keeps active source tails classified and source refs resolvable', () => {
  const policy = readJson('contracts/physical_source_morphology_policy.json');
  const surfaces = byId(policy.active_surface_classifications, 'surface_id');

  assert.equal(policy.surface_kind, 'rca_physical_source_morphology_policy');
  assert.equal(policy.owner, 'redcube_ai');
  assert.equal(policy.consumer, 'opl');
  assertAllFalse(policy.forbidden_generic_owner_flags, 'forbidden_generic_owner_flags');
  assertAllFalse(policy.source_ref_integrity_gate.authority_boundary, 'source_ref_integrity_gate.authority_boundary');
  assert.equal(
    policy.source_ref_integrity_gate.state,
    'repo_local_source_refs_declared_no_second_truth',
  );
  assert.equal(policy.legacy_name_policy.compatibility_alias_allowed, false);
  assert.equal(policy.legacy_name_policy.package_protocol_boundary_policy.public_framework_identity_allowed, false);
  assert.equal(policy.legacy_name_policy.package_protocol_boundary_policy.compatibility_alias_allowed, false);
  assert.equal(policy.new_surface_admission_gate.forbidden_new_rca_roles.includes('generic_attempt_ledger_owner'), true);

  const expectedClassifications = {
    agent_declarative_visual_pack: 'declarative_visual_pack',
    runtime_program_machine_contracts: 'machine_contract',
    mcp_product_entry_domain_entry: 'service_safe_domain_entry',
    redcube_cli_domain_entry_adapter: 'service_safe_domain_entry',
    redcube_domain_entry_package_protocol_boundary: 'package_protocol_boundary',
    product_entry_continuity_refs_adapter: 'refs_only_read_model',
    workspace_run_envelope_helpers: 'refs_only_read_model',
    runtime_watch_projection: 'retained_current_refs_only_boundary',
    domain_action_adapter_guarded_actions: 'domain_handler_target',
    operator_evidence_stability_projection: 'retained_current_refs_only_boundary',
    product_entry_manifest_projection: 'refs_only_read_model',
    deliverable_route_attempt_shell: 'domain_handler_target',
    executor_runtime_route_run_records: 'retained_current_refs_only_boundary',
    visual_authority_functions: 'minimal_visual_authority_function',
    visual_route_runtime_family_implementations: 'visual_route_runtime_family_implementation',
    repo_shell_verification_wrappers: 'repo_native_verification_wrapper',
    retired_product_entry_contract_tombstone_refs: 'tombstone_or_provenance',
  };

  assert.deepEqual(Object.keys(surfaces).sort(), Object.keys(expectedClassifications).sort());
  for (const [surfaceId, classification] of Object.entries(expectedClassifications)) {
    const entry = surfaces[surfaceId];
    assert.equal(entry.classification, classification, surfaceId);
    assert.equal(entry.forbidden_generic_owner_flags, undefined, surfaceId);
    assert.equal(entry.forbidden_generic_owner_flags_ref, PHYSICAL_SOURCE_FORBIDDEN_OWNER_FLAGS_REF, surfaceId);
    assertSourceRefsResolve(entry, surfaceId);
  }

  assert.deepEqual([...surfaces.repo_shell_verification_wrappers.source_refs].sort(), activeShellScripts());
  assert.equal(
    surfaces.product_entry_continuity_refs_adapter.no_resurrection_gate.generic_session_runtime_owner_allowed,
    false,
  );
  assert.equal(
    surfaces.visual_route_runtime_family_implementations.no_resurrection_gate.generic_runner_owner_allowed,
    false,
  );
  assert.equal(
    surfaces.redcube_cli_domain_entry_adapter.no_resurrection_gate.generic_cli_wrapper_owner_allowed,
    false,
  );
});

test('RCA retires visual transition adapters and retains only the Agent Lab cost profile', () => {
  const descriptor = readJson('contracts/domain_descriptor.json');
  const pack = readJson('contracts/pack_compiler_input.json');
  const costProfile = readJson('contracts/agent_lab_cost_profile.json');

  assert.equal('visual_transition_adapter_profile' in descriptor.standard_contract_refs, false);
  assert.equal(
    descriptor.standard_contract_refs.agent_lab_cost_profile,
    'contracts/agent_lab_cost_profile.json',
  );
  assert.equal('visual_transition_adapter_profile_source_ref' in pack.source_refs, false);
  assert.equal(
    pack.source_refs.agent_lab_cost_profile_source_ref,
    'contracts/agent_lab_cost_profile.json',
  );

  assert.equal(costProfile.surface_kind, 'opl_agent_lab_cost_estimate_profile');
  assert.equal(costProfile.profile_id, 'rca-ppt-40');
  assert.equal(costProfile.artifact_profile.slide_count, 40);
  assert.deepEqual(
    costProfile.stages.map((stage) => stage.stage_id),
    ['intake', 'outline', 'slide_generation', 'image_generation', 'render_review', 'revision'],
  );
  assert.equal(costProfile.pricing_boundary.pricing_snapshot_owned_by_profile, false);
  assert.equal(costProfile.pricing_boundary.pricing_calculation_owned_by_profile, false);
  assert.equal(costProfile.pricing_boundary.profile_supplies_workload_assumptions_only, true);
  const {
    refs_only: costRefsOnly,
    ...costForbiddenAuthority
  } = costProfile.authority_boundary;
  assert.equal(costRefsOnly, true);
  assertAllFalse(costForbiddenAuthority, 'agent_lab_cost_profile.authority_boundary');
});
