// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';

import { planCandidateRace, runCandidateRaceRoute, selectCandidateRaceWinner } from './package-surfaces.ts';

test('candidate racing planner records parallel candidates without claiming quality gate bypass', () => {
  const plan = planCandidateRace({
    family: 'ppt_deck',
    route: 'visual_direction',
    candidateCount: 3,
    qualityGate: 'screenshot_review',
  });

  assert.equal(plan.racing_kind, 'parallel_candidate_race');
  assert.equal(plan.reuse_claimed, false);
  assert.equal(plan.quality_gate_policy, 'all_candidates_must_pass_same_contract_before_selection');
  assert.deepEqual(plan.candidates.map((candidate) => candidate.candidate_id), [
    'visual_direction-candidate-1',
    'visual_direction-candidate-2',
    'visual_direction-candidate-3',
  ]);
});

test('candidate racing selector picks the highest passing candidate and records rejects', () => {
  const selection = selectCandidateRaceWinner({
    candidates: [
      { candidate_id: 'a', gate_status: 'pass', score: 0.71, artifact_ref: 'a.json' },
      { candidate_id: 'b', gate_status: 'block', score: 0.99, artifact_ref: 'b.json' },
      { candidate_id: 'c', gate_status: 'pass', score: 0.88, artifact_ref: 'c.json' },
    ],
  });

  assert.equal(selection.selection_kind, 'quality_preserving_candidate_selection');
  assert.equal(selection.winner.candidate_id, 'c');
  assert.deepEqual(selection.rejected_candidates.map((candidate) => candidate.candidate_id), ['b', 'a']);
  assert.equal(selection.quality_gate_policy, 'blocked_candidates_never_win');
});

test('candidate racing selector rejects all-blocked candidate sets', () => {
  assert.throws(
    () => selectCandidateRaceWinner({
      candidates: [
        { candidate_id: 'a', gate_status: 'block', score: 1 },
      ],
    }),
    /No passing candidate/,
  );
});

test('candidate racing route executes candidates in parallel and only returns a passing winner', async () => {
  const started = [];
  const race = await runCandidateRaceRoute({
    family: 'xiaohongshu',
    route: 'visual_direction',
    candidateCount: 2,
    qualityGate: 'structured_contract_validation',
    async runCandidate({ candidateId }) {
      started.push(candidateId);
      if (candidateId.endsWith('-1')) {
        return { status: 'block', visual_direction: { director_statement: 'blocked' } };
      }
      return { status: 'pass', visual_direction: { director_statement: 'stronger' } };
    },
    scoreCandidate(artifact) {
      return artifact.visual_direction.director_statement === 'stronger' ? 2 : 9;
    },
  });

  assert.equal(race.artifact.visual_direction.director_statement, 'stronger');
  assert.equal(race.race.status, 'selected_passing_candidate');
  assert.equal(race.race.selection.winner.candidate_id, 'visual_direction-candidate-2');
  assert.deepEqual(started.sort(), ['visual_direction-candidate-1', 'visual_direction-candidate-2']);
});

test('candidate racing route preserves single candidate behavior without claiming reuse', async () => {
  const race = await runCandidateRaceRoute({
    family: 'ppt_deck',
    route: 'visual_direction',
    candidateCount: 1,
    async runCandidate() {
      return { status: 'pass', visual_direction: { director_statement: 'only candidate' } };
    },
  });

  assert.equal(race.artifact.visual_direction.director_statement, 'only candidate');
  assert.equal(race.race.status, 'single_candidate_passthrough');
  assert.equal(race.race.reuse_claimed, false);
});
