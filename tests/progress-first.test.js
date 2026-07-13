import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

import {
  admitStageArtifactForProgress,
  isHardStopArtifact,
} from '../packages/redcube-runtime/dist/progress-first.js';

test('stage manifest separates Stage-internal route selection from decisive cross-Stage routing', () => {
  const manifest = JSON.parse(fs.readFileSync(new URL('../agent/stages/manifest.json', import.meta.url), 'utf8'));
  const policy = manifest.progress_first_policy;
  assert.equal(policy.route_selection_owner, 'codex_cli');
  assert.equal(policy.route_selection_owner_scope, 'intra_stage_domain_route_only');
  assert.equal(policy.cross_stage_decision_owner, 'stage_run_decisive_codex_attempt');
  assert.equal(policy.route_execution_grants_stage_transition_authority, false);
  assert.equal(policy.codex_may_advance_skip_repeat_reverse_or_route_back, true);
  assert.equal(policy.any_declared_stage_may_start_from_any_prior_stage_result, true);
  assert.equal(policy.declared_requires_are_quality_context_not_launch_gates, true);
  assert.equal(policy.next_stage_refs_are_recommendations_not_constraints, true);
  assert.equal(policy.no_output_or_failure_diagnostic_advances_stage, true);
});

test('stage operating principles mirror the OPL route-authority ABI', () => {
  const principles = JSON.parse(
    fs.readFileSync(new URL('../contracts/stage_operating_principles.json', import.meta.url), 'utf8'),
  );
  const policy = principles.speed_policy;

  assert.equal(policy.route_selection_owner, 'codex_cli');
  assert.equal(policy.route_selection_owner_scope, 'intra_stage_domain_route_only');
  assert.equal(policy.cross_stage_decision_owner, 'stage_run_decisive_codex_attempt');
  assert.equal(policy.primary_only_decisive_attempt_role, 'producer');
  assert.deepEqual(policy.formal_review_decisive_attempt_roles, ['reviewer', 're_reviewer']);
  assert.equal(policy.non_decisive_attempt_output, 'route_impact.stage_route_recommendation');
  assert.equal(policy.decisive_attempt_output, 'route_impact.stage_route_decision');
  assert.equal(policy.codex_may_advance_skip_repeat_reverse_or_route_back, true);
  assert.equal(policy.any_declared_stage_may_start_from_any_prior_stage_result, true);
  assert.equal(policy.declared_requires_are_quality_context_not_launch_gates, true);
  assert.equal(policy.next_stage_refs_are_recommendations_not_constraints, true);
});

test('zero domain output becomes a non-blocking progress diagnostic', () => {
  const admitted = admitStageArtifactForProgress(null, { route: 'author_image_pages' });

  assert.equal(admitted.status, 'completed_with_quality_debt');
  assert.equal(admitted.stage_attempt_diagnostic.failure_kind, 'no_output_diagnostic');
  assert.equal(admitted.progress_first.artifact_available, false);
  assert.equal(admitted.progress_first.diagnostic_available, true);
  assert.equal(admitted.progress_first.next_stage_may_start, true);
  assert.equal(admitted.quality_debt.blocks_stage_transition, false);
});

test('missing or corrupt artifacts are quality debt rather than hard stops', () => {
  for (const hardStopKind of [
    'missing_consumable_artifact',
    'missing_required_artifact',
    'unreadable_or_corrupt_artifact',
  ]) {
    const artifact = { status: 'failed', hard_stop: true, hard_stop_kind: hardStopKind };
    assert.equal(isHardStopArtifact(artifact), false, hardStopKind);
    const admitted = admitStageArtifactForProgress(artifact, { route: 'export_pptx' });
    assert.equal(admitted.status, 'completed_with_quality_debt', hardStopKind);
    assert.equal(admitted.progress_first.next_stage_may_start, true, hardStopKind);
  }
});

test('only explicit execution, authority, safety, human, or identity boundaries hard-stop', () => {
  for (const hardStopKind of [
    'executor_unavailable',
    'permission_or_credential_boundary',
    'explicit_human_gate',
    'authority_boundary_violation',
    'irreversible_action_requires_authorization',
    'stale_or_mismatched_stage_identity',
  ]) {
    assert.equal(isHardStopArtifact({ hard_stop_kind: hardStopKind }), true, hardStopKind);
  }
});
