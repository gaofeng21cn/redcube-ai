import { createPosterOnepagerRuntimeCore } from './poster-onepager-runtime-parts/core.js';

/**
 * @typedef {import('./types.js').PosterRuntimeRunRequest} PosterRuntimeRunRequest
 * @typedef {import('./types.js').PosterRuntimeRouteResult} PosterRuntimeRouteResult
 */

const {
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
} = createPosterOnepagerRuntimeCore();

export function canRunPosterOnepager(contract) {
  return contract?.deliverable_kind === 'poster_onepager';
}

/**
 * @param {PosterRuntimeRunRequest} request
 * @returns {Promise<PosterRuntimeRouteResult>}
 */
export async function runPosterOnepagerRoute({
  workspaceRoot,
  topicId,
  deliverableId,
  route,
  contract,
  mode = 'draft_new',
  baselineDeliverableId = '',
  adapter = CODEX_DEFAULT_ADAPTER,
}) {
  const { deliverablePaths } = ensurePrerequisites({ workspaceRoot, topicId, deliverableId, route, mode, baselineDeliverableId });
  const stageContract = safeArray(contract.stage_sequence?.stages).find((stage) => stage?.stage_id === route) || null;
  let payload;
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
  const sourceTruthConsumptionRole = ROUTE_TO_SOURCE_TRUTH_CONSUMPTION_ROLE[route] || '';
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
    ...payload,
  };
}
