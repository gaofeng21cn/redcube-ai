function safeText(value, fallback = '') {
  const text = String(value || '').trim();
  return text || fallback;
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

export function planCandidateRace({
  family,
  route,
  candidateCount = 2,
  qualityGate = 'screenshot_review',
} = {}) {
  const normalizedRoute = safeText(route, 'visual_direction');
  const count = Math.max(1, Number(candidateCount) || 1);
  return {
    racing_kind: 'parallel_candidate_race',
    schema_version: 1,
    family: safeText(family),
    route: normalizedRoute,
    candidate_count: count,
    quality_gate: safeText(qualityGate, 'screenshot_review'),
    reuse_claimed: false,
    quality_gate_policy: 'all_candidates_must_pass_same_contract_before_selection',
    candidates: Array.from({ length: count }, (_, index) => ({
      candidate_id: `${normalizedRoute}-candidate-${index + 1}`,
      status: 'planned',
      must_pass_gate: safeText(qualityGate, 'screenshot_review'),
    })),
  };
}

export function selectCandidateRaceWinner({ candidates = [] } = {}) {
  const normalizedCandidates = safeArray(candidates)
    .map((candidate) => ({
      candidate_id: safeText(candidate?.candidate_id),
      gate_status: safeText(candidate?.gate_status),
      score: Number(candidate?.score || 0),
      artifact_ref: safeText(candidate?.artifact_ref) || null,
    }))
    .filter((candidate) => candidate.candidate_id);
  const passing = normalizedCandidates
    .filter((candidate) => candidate.gate_status === 'pass')
    .sort((left, right) => right.score - left.score || left.candidate_id.localeCompare(right.candidate_id));
  if (passing.length === 0) {
    throw new Error('No passing candidate available for quality-preserving selection');
  }
  const winner = passing[0];
  const rejectedCandidates = normalizedCandidates
    .filter((candidate) => candidate.candidate_id !== winner.candidate_id)
    .sort((left, right) => {
      if (left.gate_status !== right.gate_status) {
        return left.gate_status === 'block' ? -1 : 1;
      }
      return right.score - left.score || left.candidate_id.localeCompare(right.candidate_id);
    });
  return {
    selection_kind: 'quality_preserving_candidate_selection',
    winner,
    rejected_candidates: rejectedCandidates,
    quality_gate_policy: 'blocked_candidates_never_win',
  };
}

export async function runCandidateRaceRoute({
  family,
  route,
  candidateCount = 1,
  qualityGate = 'structured_contract_validation',
  runCandidate,
  scoreCandidate = () => 1,
} = {}) {
  if (typeof runCandidate !== 'function') {
    throw new Error('runCandidateRaceRoute requires runCandidate');
  }
  const plan = planCandidateRace({ family, route, candidateCount, qualityGate });
  if (plan.candidate_count === 1) {
    const artifact = await runCandidate({ candidateId: plan.candidates[0].candidate_id, candidateIndex: 0, plan });
    return {
      artifact,
      race: {
        ...plan,
        status: 'single_candidate_passthrough',
        selection: null,
      },
    };
  }
  const candidateResults = await Promise.all(plan.candidates.map(async (candidate, index) => {
    try {
      const artifact = await runCandidate({ candidateId: candidate.candidate_id, candidateIndex: index, plan });
      return {
        candidate_id: candidate.candidate_id,
        gate_status: safeText(artifact?.status, 'pass') === 'block' ? 'block' : 'pass',
        score: Number(scoreCandidate(artifact, { candidateId: candidate.candidate_id, candidateIndex: index, plan }) || 0),
        artifact,
      };
    } catch (error) {
      return {
        candidate_id: candidate.candidate_id,
        gate_status: 'block',
        score: 0,
        error: String(error instanceof Error ? error.message : error),
      };
    }
  }));
  const selection = selectCandidateRaceWinner({ candidates: candidateResults });
  const winner = candidateResults.find((candidate) => candidate.candidate_id === selection.winner.candidate_id);
  return {
    artifact: winner.artifact,
    race: {
      ...plan,
      status: 'selected_passing_candidate',
      candidates: candidateResults.map((candidate) => ({
        candidate_id: candidate.candidate_id,
        gate_status: candidate.gate_status,
        score: candidate.score,
        error: candidate.error || null,
      })),
      selection,
    },
  };
}
