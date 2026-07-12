import { safeText } from './runtime-utils.js';

type JsonRecord = Record<string, any>;

export const PROGRESS_FIRST_STAGE_POLICY = Object.freeze({
  contract_id: 'rca.progress_first_stage_admission.v1',
  retry_semantics: 'quality_budget_not_transition_gate',
  transition_rule: 'consumable_stage_artifact_advances',
  quality_claim_rule: 'quality_debt_never_implies_visual_or_export_ready',
  hard_stop_kinds: [
    'missing_consumable_artifact',
    'unreadable_or_corrupt_artifact',
    'permission_or_credential_boundary',
    'explicit_human_gate',
    'authority_boundary_violation',
    'stale_or_mismatched_stage_identity',
  ],
});

const AUTHORING_LANES_BY_ROUTE: Record<string, string> = Object.freeze({
  author_image_pages: 'image_pages',
  repair_image_pages: 'image_pages',
  render_html: 'html',
  fix_html: 'html',
  author_pptx_native: 'native_pptx',
  repair_pptx_native: 'native_pptx',
});

export function authoringLaneForRoute(route: unknown): string {
  return AUTHORING_LANES_BY_ROUTE[safeText(route)] || '';
}

export function lockedAuthoringLane(contract: JsonRecord): string {
  return safeText(contract?.delivery_request?.constraints?.authoring_route_lock?.lane_id);
}

function safeArray(value: unknown): any[] {
  return Array.isArray(value) ? value : [];
}

function uniqueStrings(values: unknown[]): string[] {
  return [...new Set(values.map((value) => safeText(value)).filter(Boolean))];
}

function failedChecks(artifact: JsonRecord): string[] {
  return uniqueStrings([
    ...safeArray(artifact?.blocking_reasons),
    ...safeArray(artifact?.issues),
    ...safeArray(artifact?.review_state_patch?.blocking_reasons),
    ...safeArray(artifact?.review_state_patch?.pending_reviews),
    ...Object.entries(artifact?.checks || {})
      .filter(([, value]) => value === false)
      .map(([key]) => key),
  ]);
}

export function hasConsumableStageArtifact(artifact: unknown): artifact is JsonRecord {
  if (!artifact || typeof artifact !== 'object' || Array.isArray(artifact)) return false;
  const record = artifact as JsonRecord;
  return Object.keys(record).some((key) => ![
    'status',
    'error',
    'error_kind',
    'failure_kind',
    'blocking_reasons',
    'typed_blocker_refs',
  ].includes(key));
}

function qualityDebtRequired(artifact: JsonRecord): boolean {
  const status = safeText(artifact?.status);
  const rerunStatus = safeText(artifact?.review_state_patch?.rerun_policy?.status);
  return ['block', 'blocked', 'failed', 'needs_revision'].includes(status)
    || rerunStatus === 'rerun_required'
    || failedChecks(artifact).length > 0;
}

const HARD_STOP_KINDS = new Set([
  'missing_consumable_artifact',
  'missing_required_artifact',
  'unreadable_or_corrupt_artifact',
  'permission_or_credential_boundary',
  'explicit_human_gate',
  'authority_boundary_violation',
  'stale_or_mismatched_stage_identity',
  'missing_opl_stage_attempt',
]);

export function isHardStopArtifact(artifact: unknown): boolean {
  if (!artifact || typeof artifact !== 'object' || Array.isArray(artifact)) return false;
  const record = artifact as JsonRecord;
  const candidates = [
    record?.hard_stop_kind,
    record?.error_kind,
    record?.failure_kind,
    record?.blocker_kind,
    record?.typed_blocker?.blocker_kind,
  ].map((value) => safeText(value)).filter(Boolean);
  return record?.hard_stop === true || candidates.some((kind) => HARD_STOP_KINDS.has(kind));
}

export function admitStageArtifactForProgress(
  artifact: JsonRecord,
  { route = '', qualityBudget = null }: { route?: string; qualityBudget?: JsonRecord | null } = {},
): JsonRecord {
  if (!hasConsumableStageArtifact(artifact) || isHardStopArtifact(artifact)) return artifact;
  const requiresQualityDebt = qualityDebtRequired(artifact);
  const originalStatus = safeText(artifact?.status, 'completed');
  const debtReasons = failedChecks(artifact);
  const reviewStatePatch = artifact?.review_state_patch && typeof artifact.review_state_patch === 'object'
    ? artifact.review_state_patch
    : {};
  const rerunPolicy = reviewStatePatch?.rerun_policy && typeof reviewStatePatch.rerun_policy === 'object'
    ? reviewStatePatch.rerun_policy
    : {};
  const recommendedRepairStage = safeText(
    reviewStatePatch?.rerun_from_stage || rerunPolicy?.rerun_from_stage,
  ) || null;

  return {
    ...artifact,
    status: requiresQualityDebt ? 'completed_with_quality_debt' : originalStatus,
    blocking_reasons: requiresQualityDebt ? [] : safeArray(artifact?.blocking_reasons),
    typed_blocker_refs: requiresQualityDebt ? [] : safeArray(artifact?.typed_blocker_refs),
    typed_blocker: requiresQualityDebt ? null : artifact?.typed_blocker,
    blocker_ref: requiresQualityDebt ? null : artifact?.blocker_ref,
    blocker_kind: requiresQualityDebt ? null : artifact?.blocker_kind,
    failure_kind: requiresQualityDebt ? null : artifact?.failure_kind,
    progress_first: {
      ...PROGRESS_FIRST_STAGE_POLICY,
      route: safeText(route || artifact?.route) || null,
      artifact_available: true,
      advance_allowed: true,
      quality_debt_recorded: requiresQualityDebt,
      quality_budget: qualityBudget,
      recommended_repair_stage: recommendedRepairStage,
    },
    quality_debt: requiresQualityDebt
      ? {
          status: 'recorded_non_blocking',
          original_status: originalStatus,
          reasons: debtReasons.length > 0 ? debtReasons : ['quality_gate_not_passed'],
          recommended_repair_stage: recommendedRepairStage,
          quality_budget: qualityBudget,
          blocks_stage_transition: false,
          blocks_visual_ready_claim: true,
          blocks_export_ready_claim: true,
        }
      : artifact?.quality_debt || null,
    review_state_patch: requiresQualityDebt
      ? {
          ...reviewStatePatch,
          current_status: 'completed_with_quality_debt',
          ready_for_export: false,
          pending_reviews: [],
          blocking_reasons: [],
          quality_debt_reasons: debtReasons,
          rerun_from_stage: recommendedRepairStage,
          rerun_policy: {
            ...rerunPolicy,
            status: recommendedRepairStage ? 'quality_budget_recommended' : 'quality_debt_recorded',
            rerun_from_stage: recommendedRepairStage,
            blocks_stage_transition: false,
          },
        }
      : reviewStatePatch,
  };
}

export function markQualityBudgetExhausted(
  artifact: JsonRecord,
  { route = '', attempts = 0, nextStage = null }: { route?: string; attempts?: number; nextStage?: string | null } = {},
): JsonRecord {
  const admitted = admitStageArtifactForProgress(artifact, {
    route,
    qualityBudget: {
      status: 'exhausted',
      attempts_used: attempts,
    },
  });
  return {
    ...admitted,
    progress_first: {
      ...(admitted.progress_first || {}),
      quality_budget_exhausted: true,
      next_stage: nextStage,
    },
    quality_debt: {
      ...(admitted.quality_debt || {}),
      quality_budget_exhausted: true,
      next_stage: nextStage,
    },
    review_state_patch: {
      ...(admitted.review_state_patch || {}),
      rerun_policy: {
        ...(admitted.review_state_patch?.rerun_policy || {}),
        status: 'quality_budget_exhausted',
        blocks_stage_transition: false,
      },
    },
  };
}
