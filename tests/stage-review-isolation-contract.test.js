import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {
  buildQualityAttemptRuntime,
  buildStageReviewContextManifest,
  buildStageReviewReceipt,
  canonicalStageForRoute,
} from '@redcube/runtime-protocol';

test('RCA routes map into six canonical Stages without treating review routes as Stages', () => {
  assert.equal(canonicalStageForRoute('storyline'), 'communication_strategy');
  assert.equal(canonicalStageForRoute('detailed_outline'), 'communication_strategy');
  assert.equal(canonicalStageForRoute('slide_blueprint'), 'communication_strategy');
  assert.equal(canonicalStageForRoute('visual_director_review'), 'artifact_creation');
  assert.equal(canonicalStageForRoute('screenshot_review'), 'artifact_creation');
  assert.equal(canonicalStageForRoute('review_and_revision'), 'review_and_revision');
});

test('formal Stage Review context contains exact refs and excludes producer conversation', () => {
  const root = mkdtempSync(path.join(os.tmpdir(), 'rca-review-context-'));
  try {
    const artifactFile = path.join(root, 'artifact.json');
    writeFileSync(artifactFile, '{"artifact":"candidate"}\n');
    const manifest = buildStageReviewContextManifest({
      stageRunRef: 'opl-stage-run:artifact_creation:1',
      reviewerAttemptRole: 'reviewer',
      artifactRefs: [artifactFile],
      sourceRefs: ['source-pack:1'],
      qualityRubricRefs: ['agent/quality_gates/artifact_authority.md'],
    });
    assert.equal(manifest.surface_kind, 'opl_stage_review_context_manifest');
    assert.equal(manifest.version, 'stage-review-context-manifest.v1');
    assert.equal(manifest.no_context_inheritance, true);
    assert.equal(manifest.exact_artifact_hashes.length, 1);
    assert.match(manifest.exact_artifact_hashes[0].sha256, /^[a-f0-9]{64}$/);
    assert.equal(manifest.forbidden_context.includes('producer_conversation_history'), true);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('Review receipt requires a fresh reviewer session and records shared ABI fields', () => {
  const receipt = buildStageReviewReceipt({
    stageRunRef: 'opl-stage-run:artifact_creation:1',
    producerAttemptRef: 'opl-stage-attempt:producer:1',
    reviewerAttemptRef: 'opl-stage-attempt:reviewer:1',
    producerSessionRefs: ['codex://threads/producer-1'],
    reviewerSessionRef: 'codex://threads/reviewer-1',
    reviewedArtifactRefs: ['artifact:1'],
    rubricRefs: ['rubric:visual'],
    verdict: 'pass',
  });
  assert.equal(receipt.surface_kind, 'opl_stage_review_receipt');
  assert.equal(receipt.version, 'stage-review-receipt.v1');
  assert.equal(receipt.no_context_inheritance, true);
  assert.equal(receipt.reviewer_session_ref, 'codex://threads/reviewer-1');
  assert.throws(() => buildStageReviewReceipt({
    producerSessionRefs: ['codex://threads/shared'],
    reviewerSessionRef: 'codex://threads/shared',
    verdict: 'pass',
  }), /must differ/);
});

test('quality attempt runtime distinguishes refinement roles and never treats same-thread review as valid', () => {
  const reviewer = buildQualityAttemptRuntime({
    attemptRole: 'reviewer',
    sessionId: 'reviewer-2',
    producerSessionRefs: ['producer-2'],
    qualityRoundIndex: 0,
  });
  assert.equal(reviewer.no_context_inheritance, true);
  assert.equal(reviewer.execution_session_ref, 'codex://threads/reviewer-2');
  assert.throws(() => buildQualityAttemptRuntime({
    attemptRole: 'reviewer',
    sessionId: 'same-thread',
    producerSessionRefs: ['same-thread'],
  }), /must differ/);
});

test('RCA quality profile freezes three repair rounds and cross-stage Meta Review', () => {
  const profile = JSON.parse(readFileSync(new URL('../contracts/stage_quality_cycle_policy.json', import.meta.url)));
  assert.equal(profile.surface_kind, 'opl_domain_stage_quality_cycle_profile');
  assert.equal(profile.version, 'domain-stage-quality-cycle-profile.v1');
  assert.deepEqual(profile.attempt_roles, ['producer', 'reviewer', 'repairer', 're_reviewer']);
  assert.equal(profile.quality_budget.max_repair_rounds, 3);
  assert.equal(profile.meta_review.stage_role, 'cross_stage_meta_review');
  assert.equal(profile.meta_review.primary_attempt_role, 'producer');
  assert.equal(profile.meta_review.no_context_inheritance, true);
  const forbiddenAttemptPolicyKeys = new Set([
    'next_stage',
    'requires',
    'ensures',
    'stage_route',
    'sub_stage_graph',
    'independent_owner',
  ]);
  const expectedPolicyKeys = [
    'attempt_boundary',
    'budget_exhaustion',
    'enabled',
    'formal_review',
    'in_thread_refinement',
    'quality_rubric_refs',
    'role_prompt_refs',
    'stage_prompt_ref',
    'surface_kind',
    'version',
  ];
  const expectedRoleKeys = ['producer', 're_reviewer', 'repairer', 'reviewer'];
  const expectedAttemptBoundary = {
    inherits_stage_goal_scope_authority: true,
    role_overlay_may_only_narrow: true,
    controller_creates_next_attempt: true,
    attempt_is_not_sub_stage: true,
  };
  for (const [stageId, stagePolicy] of Object.entries(profile.stage_policies)) {
    assert.deepEqual(Object.keys(stagePolicy).sort(), expectedPolicyKeys, stageId);
    assert.equal(stagePolicy.surface_kind, 'opl_stage_quality_cycle_policy', stageId);
    assert.equal(stagePolicy.version, 'stage-quality-cycle-policy.v1', stageId);
    assert.equal(stagePolicy.enabled, true, stageId);
    assert.equal(stagePolicy.stage_prompt_ref, `agent/prompts/${stageId}.md`, stageId);
    assert.deepEqual(Object.keys(stagePolicy.role_prompt_refs).sort(), expectedRoleKeys, stageId);
    assert.equal(Object.values(stagePolicy.role_prompt_refs).every((ref) => ref.startsWith('agent/prompts/stage-quality-cycle-roles.md#')), true, stageId);
    assert.equal(stagePolicy.quality_rubric_refs.length > 0, true, stageId);
    assert.deepEqual(stagePolicy.in_thread_refinement, { allowed: true, authoritative: false }, stageId);
    assert.equal(stagePolicy.formal_review.context_isolation_required, true, stageId);
    assert.equal(stagePolicy.formal_review.max_repair_rounds <= 3, true, stageId);
    assert.equal(stagePolicy.budget_exhaustion, 'complete_with_quality_debt_if_consumable', stageId);
    assert.deepEqual(stagePolicy.attempt_boundary, expectedAttemptBoundary, stageId);
    assert.equal(Object.keys(stagePolicy).some((key) => forbiddenAttemptPolicyKeys.has(key)), false);
  }
  assert.equal(profile.stage_policies.source_intake.formal_review.review_depth, 'full');
  for (const stageId of ['communication_strategy', 'visual_direction', 'artifact_creation']) {
    assert.equal(profile.stage_policies[stageId].formal_review.review_depth, 'multi_axis', stageId);
    assert.equal(profile.stage_policies[stageId].formal_review.required, true, stageId);
  }
  assert.equal(profile.stage_policies.review_and_revision.formal_review.required, false);
  assert.equal(profile.stage_policies.review_and_revision.formal_review.max_repair_rounds, 0);
  assert.equal(profile.stage_policies.package_and_handoff.formal_review.required, false);
  assert.equal(profile.stage_policies.package_and_handoff.formal_review.max_repair_rounds, 0);
});
