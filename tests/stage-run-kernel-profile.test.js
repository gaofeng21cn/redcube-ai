import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const repoRoot = path.resolve(import.meta.dirname, '..');

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(repoRoot, relativePath), 'utf8'));
}

function assertNonEmptyRefs(values, label) {
  assert.equal(Array.isArray(values), true, label);
  assert.equal(values.length > 0, true, label);
  for (const [index, value] of values.entries()) {
    assert.equal(typeof value, 'string', `${label}[${index}]`);
    assert.notEqual(value.trim(), '', `${label}[${index}]`);
  }
}

function assertNoForbiddenBodyFields(value, label = 'surface') {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => assertNoForbiddenBodyFields(entry, `${label}[${index}]`));
    return;
  }
  if (!value || typeof value !== 'object') return;
  for (const [key, entry] of Object.entries(value)) {
    assert.equal([
      'artifact_body',
      'artifact_blob',
      'visual_truth_body',
      'review_verdict_body',
      'export_verdict_body',
      'owner_receipt_body',
      'typed_blocker_body',
      'memory_body',
    ].includes(key), false, `${label}.${key}`);
    assertNoForbiddenBodyFields(entry, `${label}.${key}`);
  }
}

function assertAuthorityBoundaryFalse(boundary, label) {
  for (const key of [
    'opl_can_write_domain_truth',
    'opl_can_mutate_artifact_body',
    'opl_can_sign_domain_owner_receipt',
    'opl_can_sign_owner_receipt',
    'opl_can_create_typed_blocker',
    'opl_can_authorize_quality_or_export',
  ]) {
    if (key in boundary) assert.equal(boundary[key], false, `${label}.${key}`);
  }
}

function assertRouteAuthoritySplit(contract, label) {
  const serialized = JSON.stringify(contract);
  const retiredOwnerFields = [
    ['route', 'selection', 'owner'].join('_'),
    ['route', 'back', 'selection', 'owner'].join('_'),
    ['cross', 'stage', 'decision', 'owner'].join('_'),
  ];
  for (const field of retiredOwnerFields) {
    assert.equal(serialized.includes(`"${field}"`), false, `${label}.${field}`);
  }
  assert.equal(contract.semantic_route_decision_owner, 'decisive_codex_attempt');
  assert.equal(
    contract.stage_transition_materialization_owner,
    'opl_stage_run_controller',
  );
}

test('StageRun kernel profile preserves RCA authority and rejects runtime overclaim', () => {
  const profile = readJson('contracts/stage_run_kernel_profile.json');

  assert.equal(profile.surface_kind, 'opl_stage_run_kernel_profile');
  assert.equal(profile.kernel_role, 'minimal_state_shell_not_domain_controller_system');
  assert.deepEqual(profile.stage_native_unit, [
    'stage_folder',
    'stage_manifest',
    'role_artifacts',
    'progress_receipt_or_owner_answer_or_hard_stop',
  ]);
  assert.deepEqual(profile.domain_authority_retained, [
    'visual_truth',
    'layout_review_verdict',
    'export_verdict',
    'artifact_mutation_authority',
    'visual_memory_accept_reject',
    'owner_receipt',
    'typed_blocker',
  ]);
  for (const key of [
    'provider_completion_counts_as_domain_accepted',
    'file_presence_counts_as_stage_complete',
    'latest_json_counts_as_domain_accepted',
    'read_model_can_select_semantic_route',
  ]) {
    assert.equal(profile.stage_run_state_machine[key], false, key);
  }
  assert.equal(
    profile.stage_run_state_machine.readable_artifact_counts_as_progress_input,
    true,
  );
  assert.equal(profile.stage_run_state_machine.codex_can_route_to_any_declared_stage, true);
  assert.equal(profile.stage_run_state_machine.quality_debt_counts_as_quality_acceptance, false);
  assertRouteAuthoritySplit(profile.codex_semantic_route_policy, 'profile.codex_semantic_route_policy');
  assert.equal(profile.codex_semantic_route_policy.readable_artifact_allows_any_declared_stage, true);
  assert.equal(profile.codex_semantic_route_policy.quality_budget_exhaustion_blocks_route, false);
  assert.equal(profile.codex_semantic_route_policy.framework_can_accept_reject_rank_or_override_route, false);
  assert.equal(profile.opl_contract_refs.owner, 'one-person-lab');
  assert.equal(profile.opl_contract_refs.domain_repo_role, 'consumer_profile_ref_only');
  assert.equal(profile.opl_contract_refs.repo_local_file_required, false);
  assertAuthorityBoundaryFalse(profile.authority_boundary, 'profile.authority_boundary');
  assert.deepEqual(profile.overclaim_boundary.claims_forbidden, [
    'live_domain_progress',
    'visual_ready',
    'exportable',
    'handoffable',
    'domain_ready',
    'production_ready',
    'production_visual_stage_long_soak_complete',
  ]);
  assert.equal(profile.legacy_runtime_residue_guard.repo_local_stage_run_runtime_owner_allowed, false);
  assert.equal(profile.legacy_runtime_residue_guard.repo_local_status_workbench_owner_allowed, false);
  assert.deepEqual(profile.visual_stage_run_canary.ordered_domain_events, [
    'visual_direction_candidates',
    'grounded_reflection',
    'comparative_selection',
    'evolution_and_revision',
    'strategy_retrospective',
    'independent_quality_gate',
    'progress_receipt_or_owner_answer_or_hard_stop_closeout',
  ]);
  assert.equal(profile.visual_stage_run_canary.required_role_artifacts.includes('strategy_retrospective_ref'), true);
  assert.equal(profile.visual_stage_run_canary.required_role_artifacts.includes('meta_review_ref'), false);
});

test('RCA contracts split semantic route decisions from controller transition materialization', () => {
  const operatingPrinciples = readJson('contracts/stage_operating_principles.json');
  const stageManifest = readJson('agent/stages/manifest.json');

  assertRouteAuthoritySplit(operatingPrinciples.speed_policy, 'operatingPrinciples.speed_policy');
  assertRouteAuthoritySplit(stageManifest.progress_first_policy, 'stageManifest.progress_first_policy');
  assert.equal(operatingPrinciples.speed_policy.primary_only_decisive_attempt_role, 'producer');
  assert.deepEqual(operatingPrinciples.speed_policy.formal_review_decisive_attempt_roles, [
    'reviewer',
    're_reviewer',
  ]);
  assert.equal(
    operatingPrinciples.speed_policy.non_decisive_attempt_output,
    'route_impact.stage_route_recommendation',
  );
  assert.equal(
    operatingPrinciples.speed_policy.decisive_attempt_output,
    'route_impact.stage_route_decision',
  );
  assert.equal(stageManifest.progress_first_policy.route_execution_grants_stage_transition_authority, false);
});

test('controlled StageRun canary is followable refs-only evidence, not live progress', () => {
  const profile = readJson('contracts/stage_run_kernel_profile.json');
  const evidence = readJson(profile.visual_stage_run_canary.controlled_evidence_ref);

  assert.equal(evidence.surface_kind, 'opl_stage_run_controlled_canary_evidence');
  assert.equal(evidence.evidence_scope, 'controlled_fixture_not_live_domain_progress');
  assertNonEmptyRefs([
    evidence.stage_run_ref,
    evidence.stage_manifest_ref,
    evidence.current_pointer_ref,
  ], 'stage_run_core_refs');
  assert.deepEqual(Object.keys(evidence.strategy_trace), [
    'candidate_generation',
    'grounded_reflection',
    'comparative_selection',
    'evolution_and_revision',
    'strategy_retrospective',
    'independent_quality_gate',
  ]);
  assert.equal('strategy_retrospective_ref' in evidence.role_artifact_refs, true);
  assert.equal('meta_review_ref' in evidence.role_artifact_refs, false);
  for (const key of Object.keys(evidence.strategy_trace)) {
    assertNonEmptyRefs(evidence.strategy_trace[key].refs, `strategy_trace.${key}.refs`);
  }
  for (const [key, ref] of Object.entries(evidence.role_artifact_refs)) {
    assert.equal(typeof ref, 'string', `role_artifact_refs.${key}`);
    assert.notEqual(ref.trim(), '', `role_artifact_refs.${key}`);
  }
  assert.equal(['owner_receipt', 'typed_blocker'].includes(evidence.closeout.terminal_outcome), true);
  assert.equal(Boolean(evidence.closeout.owner_receipt_ref || evidence.closeout.typed_blocker_ref), true);
  assert.equal(evidence.closeout.same_attempt_self_review, false);
  assert.equal(evidence.asset_follow_audit.operator_summary_can_claim_live_progress, false);
  assert.equal(evidence.overclaim_boundary.provider_completion_counts_as_claim, false);
  assert.equal(evidence.overclaim_boundary.operator_summary_can_upgrade_claims, false);
  assertAuthorityBoundaryFalse(evidence.authority_boundary, 'evidence.authority_boundary');
  assertNoForbiddenBodyFields(evidence);
});

test('post-standardization live progress remains a typed blocker until fresh hosted evidence exists', () => {
  const profile = readJson('contracts/stage_run_kernel_profile.json');
  const temporalPolicy = readJson('contracts/temporal_stage_run_consumption_policy.json');
  const evidence = readJson('contracts/owner_chain_live_progress_evidence.json');
  const liveProgress = readJson('contracts/live_stage_run_progress_evidence.json');

  assert.equal(profile.owner_chain_live_progress_evidence_ref, 'contracts/owner_chain_live_progress_evidence.json');
  assert.equal(temporalPolicy.owner_chain_completion_audit.completion_status, 'blocked_requires_real_visual_stage_owner_acceptance');
  assert.equal(temporalPolicy.owner_chain_completion_audit.declares_owner_chain_complete, false);
  assert.deepEqual(temporalPolicy.owner_chain_completion_audit.accepted_terminal_evidence_refs, [
    'progress_delta_receipt_ref',
    'owner_receipt_ref',
    'typed_blocker_ref',
    'human_gate_ref',
    'route_back_ref',
    'review_export_receipt_ref',
    'artifact_authority_receipt_ref',
    'no_regression_evidence_ref',
  ]);
  assert.equal(evidence.evidence_scope, 'post_standardization_owner_chain_refs_only');
  assert.equal(evidence.controlled_fixture_is_live_progress, false);
  assert.equal(liveProgress.status, 'owner_typed_blocker_recorded_not_ready_claim');
  assert.deepEqual(liveProgress.refs.owner_receipt_refs, []);
  assert.deepEqual(liveProgress.refs.quality_or_export_receipt_refs, []);
  assert.deepEqual(liveProgress.refs.no_regression_refs, []);
  assert.deepEqual(liveProgress.refs.long_soak_refs, []);
  assert.deepEqual(liveProgress.refs.typed_blocker_refs, [
    'rca-typed-blocker:post-standardization-live-stage-evidence-required',
  ]);
  assert.equal(
    evidence.live_visual_owner_chain_canary.status,
    'blocked_requires_fresh_opl_hosted_stage_run',
  );
  assert.deepEqual(
    evidence.live_visual_owner_chain_canary.observed_typed_blocker_refs,
    liveProgress.refs.typed_blocker_refs,
  );
  assertAuthorityBoundaryFalse(liveProgress.authority_boundary, 'liveProgress.authority_boundary');
  assert.equal(liveProgress.non_claims.domain_ready, false);
  assert.equal(liveProgress.non_claims.production_ready, false);
  assertNoForbiddenBodyFields({ evidence, liveProgress });
});
