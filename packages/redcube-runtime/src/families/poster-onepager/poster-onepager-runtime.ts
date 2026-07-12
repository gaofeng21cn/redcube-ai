import {
  CODEX_DEFAULT_ADAPTER,
  ROUTE_TO_SOURCE_TRUTH_CONSUMPTION_ROLE,
  buildDirectorReview,
  buildExportBundle,
  buildPosterBlueprintArtifact,
  buildPosterVisualDirectionArtifact,
  buildRenderHtmlArtifact,
  buildScreenshotReview,
  buildSourceTruthConsumptionSummary,
  buildStoryline,
  ensurePrerequisites,
  safeArray,
  sourceLabels,
} from './poster-onepager-runtime-parts/core.js';
import type {
  PosterRuntimeContract,
  PosterRuntimeRoute,
  PosterRuntimeRouteResult,
  PosterRuntimeRunRequest,
  PosterRuntimeStageContract,
} from './types.js';
import { admitStageArtifactForProgress } from '../../progress-first.js';

function isZeroArtifactHardFailure(error: any): boolean {
  if (error?.requiresHumanConfirmation === true || error?.requiresExternalSecret === true) return true;
  if (['EACCES', 'EPERM', 'ENOENT'].includes(String(error?.code || ''))) return true;
  return ['missing_consumable_artifact', 'unreadable_or_corrupt_artifact', 'permission_or_credential_boundary']
    .includes(String(error?.hard_stop_kind || ''));
}

function degradedRouteArtifact(route: string, error: any, findings: string[]): Record<string, unknown> {
  const reasons = [...new Set([
    ...findings,
    ...safeArray(error?.artifact?.normalization_findings),
    String(error?.message || error || 'stage_output_requires_normalization'),
  ].map((entry) => String(entry).trim()).filter(Boolean))];
  return admitStageArtifactForProgress({
    ...(error?.artifact && typeof error.artifact === 'object' ? error.artifact : {}),
    status: 'completed_with_quality_debt',
    route,
    stage_attempt_diagnostic: {
      error_name: String(error?.name || 'Error'),
      error_message: String(error?.message || error),
      failure_kind: String(error?.failure_kind || 'normalization_or_materialization_quality_debt'),
    },
    normalization_findings: reasons,
    quality_debt: {
      status: 'recorded_non_blocking',
      reasons,
      blocks_stage_transition: false,
      blocks_visual_ready_claim: true,
      blocks_export_ready_claim: true,
    },
  }, { route });
}

export async function runPosterOnepagerRoute({
  workspaceRoot,
  topicId,
  deliverableId,
  route,
  contract,
  mode = 'draft_new',
  baselineDeliverableId = '',
  adapter = CODEX_DEFAULT_ADAPTER,
}: PosterRuntimeRunRequest): Promise<PosterRuntimeRouteResult> {
  const { deliverablePaths, findings } = ensurePrerequisites({ workspaceRoot, topicId, deliverableId, route, mode, baselineDeliverableId });
  const stages = safeArray(contract.stage_sequence?.stages) as PosterRuntimeStageContract[];
  const stageContract = stages.find((stage) => stage?.stage_id === route) || null;
  let payload: any;
  try {
    switch (route) {
    case 'storyline':
      payload = await buildStoryline(contract, adapter);
      break;
    case 'poster_blueprint':
      payload = await buildPosterBlueprintArtifact(contract, deliverablePaths, adapter);
      break;
    case 'visual_direction':
      payload = await buildPosterVisualDirectionArtifact(
        contract,
        deliverablePaths,
        mode,
        baselineDeliverableId,
        adapter,
      );
      break;
    case 'render_html':
      payload = await buildRenderHtmlArtifact({ deliverableId, contract, deliverablePaths, adapter });
      break;
    case 'visual_director_review':
      payload = await buildDirectorReview(contract, deliverablePaths, adapter);
      break;
    case 'screenshot_review':
      payload = await buildScreenshotReview(
        workspaceRoot,
        topicId,
        contract,
        deliverablePaths,
        mode,
        baselineDeliverableId,
        adapter,
      );
      break;
    case 'export_bundle':
      payload = buildExportBundle(contract, deliverablePaths, adapter);
      break;
      default:
        throw new Error(`Unsupported poster_onepager route: ${route}`);
    }
  } catch (error) {
    if (isZeroArtifactHardFailure(error)) throw error;
    payload = degradedRouteArtifact(route, error, findings);
  }
  if (safeArray(findings).length > 0) {
    payload = admitStageArtifactForProgress({
      ...payload,
      status: 'completed_with_quality_debt',
      quality_debt: {
        ...(payload?.quality_debt || {}),
        status: 'recorded_non_blocking',
        reasons: [...new Set([
          ...safeArray(payload?.quality_debt?.reasons),
          ...findings,
        ].map((entry) => String(entry).trim()).filter(Boolean))],
        blocks_stage_transition: false,
        blocks_visual_ready_claim: true,
        blocks_export_ready_claim: true,
      },
    }, { route });
  }
  const sourceTruthConsumptionRole = (ROUTE_TO_SOURCE_TRUTH_CONSUMPTION_ROLE as Record<string, string>)[route] || '';
  return {
    overlay: contract.overlay,
    route,
    topic_id: topicId,
    deliverable_id: deliverableId,
    contract,
    stage_contract: stageContract,
    ...(sourceTruthConsumptionRole
      ? {
          source_truth_consumption: buildSourceTruthConsumptionSummary(contract.shared_source_truth, {
            consumptionRole: sourceTruthConsumptionRole,
            defaultSourceLabels: sourceLabels(contract),
          }),
        }
      : {}),
    ...(payload as Record<string, unknown>),
  } as PosterRuntimeRouteResult;
}
