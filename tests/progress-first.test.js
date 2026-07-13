import test from 'node:test';
import assert from 'node:assert/strict';

import {
  admitStageArtifactForProgress,
  isHardStopArtifact,
} from '../packages/redcube-runtime/dist/progress-first.js';

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
