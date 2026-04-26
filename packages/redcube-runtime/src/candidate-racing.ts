type CandidateGateStatus = 'pass' | 'block' | string;

interface CandidatePlanInput {
  family?: unknown;
  route?: unknown;
  candidateCount?: unknown;
  qualityGate?: unknown;
}

interface CandidatePlanCandidate {
  candidate_id: string;
  status: 'planned';
  must_pass_gate: string;
}

interface CandidateRacePlan {
  racing_kind: 'parallel_candidate_race';
  schema_version: 1;
  family: string;
  route: string;
  candidate_count: number;
  quality_gate: string;
  reuse_claimed: false;
  quality_gate_policy: string;
  candidates: CandidatePlanCandidate[];
}

interface CandidateSelectionInput {
  candidates?: unknown;
}

interface NormalizedCandidateResult {
  candidate_id: string;
  gate_status: CandidateGateStatus;
  score: number;
  artifact_ref: string | null;
}

interface CandidateRouteResult {
  candidate_id: string;
  gate_status: CandidateGateStatus;
  score: number;
  artifact?: Record<string, unknown>;
  error?: string;
}

interface RunCandidateRaceRouteInput extends CandidatePlanInput {
  runCandidate?: (input: {
    candidateId: string;
    candidateIndex: number;
    plan: CandidateRacePlan;
  }) => Promise<Record<string, unknown>> | Record<string, unknown>;
  scoreCandidate?: (artifact: Record<string, unknown>, input: {
    candidateId: string;
    candidateIndex: number;
    plan: CandidateRacePlan;
  }) => number;
}

function asRecord(value: unknown): Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function safeText(value: unknown, fallback = ''): string {
  const text = String(value || '').trim();
  return text || fallback;
}

function safeArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

export function planCandidateRace({
  family,
  route,
  candidateCount = 2,
  qualityGate = 'screenshot_review',
}: CandidatePlanInput = {}): CandidateRacePlan {
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

export function selectCandidateRaceWinner({ candidates = [] }: CandidateSelectionInput = {}): {
  selection_kind: 'quality_preserving_candidate_selection';
  winner: NormalizedCandidateResult;
  rejected_candidates: NormalizedCandidateResult[];
  quality_gate_policy: string;
} {
  const normalizedCandidates = safeArray(candidates)
    .map((candidate) => {
      const candidateRecord = asRecord(candidate);
      return {
        candidate_id: safeText(candidateRecord.candidate_id),
        gate_status: safeText(candidateRecord.gate_status),
        score: Number(candidateRecord.score || 0),
        artifact_ref: safeText(candidateRecord.artifact_ref) || null,
      };
    })
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
}: RunCandidateRaceRouteInput = {}): Promise<Record<string, unknown>> {
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
  const candidateResults: CandidateRouteResult[] = await Promise.all(plan.candidates.map(async (candidate, index) => {
    try {
      const artifact = await runCandidate({ candidateId: candidate.candidate_id, candidateIndex: index, plan });
      return {
        candidate_id: candidate.candidate_id,
        gate_status: safeText(artifact.status, 'pass') === 'block' ? 'block' : 'pass',
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
  if (!winner) {
    throw new Error(`Selected candidate is missing from race results: ${selection.winner.candidate_id}`);
  }
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
