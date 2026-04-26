import { createPosterOnepagerRuntimeCore } from './poster-onepager-runtime-parts/core.js';
import type {
  PosterRuntimeCanRunContract,
  PosterRuntimeContract,
  PosterRuntimeRoute,
  PosterRuntimeRouteResult,
  PosterRuntimeRunRequest,
  PosterRuntimeStageContract,
} from './types.js';

type PosterRuntimeCore = {
  CODEX_DEFAULT_ADAPTER: string;
  ROUTE_TO_SOURCE_TRUTH_CONSUMPTION_ROLE: Record<string, string | undefined>;
  buildDirectorReview: (contract: PosterRuntimeContract, deliverablePaths: unknown, adapter?: string) => Promise<unknown>;
  buildExportBundle: (contract: PosterRuntimeContract, deliverablePaths: unknown, adapter?: string) => unknown;
  buildPosterBlueprintArtifact: (contract: PosterRuntimeContract, deliverablePaths: unknown, adapter?: string) => Promise<unknown>;
  buildPosterVisualDirectionArtifact: (
    contract: PosterRuntimeContract,
    deliverablePaths: unknown,
    mode: string,
    baselineDeliverableId: string,
    adapter?: string,
  ) => Promise<unknown>;
  buildRenderHtmlArtifact: (input: {
    deliverableId: string;
    contract: PosterRuntimeContract;
    deliverablePaths: unknown;
    adapter?: string;
  }) => Promise<unknown>;
  buildScreenshotReview: (
    workspaceRoot: string,
    topicId: string,
    contract: PosterRuntimeContract,
    deliverablePaths: unknown,
    mode: string,
    baselineDeliverableId: string,
    adapter?: string,
  ) => Promise<unknown>;
  buildSourceTruthConsumptionSummary: (
    sharedSourceTruth: PosterRuntimeContract['shared_source_truth'],
    options: { consumptionRole: string; defaultSourceLabels: string[] },
  ) => unknown;
  buildStoryline: (contract: PosterRuntimeContract, adapter?: string) => Promise<unknown>;
  ensurePrerequisites: (input: {
    workspaceRoot: string;
    topicId: string;
    deliverableId: string;
    route: PosterRuntimeRoute;
    mode: string;
    baselineDeliverableId: string;
  }) => { deliverablePaths: unknown };
  safeArray: <T = unknown>(value: unknown) => T[];
  sourceLabels: (contract: PosterRuntimeContract) => string[];
};

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
} = createPosterOnepagerRuntimeCore() as PosterRuntimeCore;

export function canRunPosterOnepager(contract: PosterRuntimeCanRunContract): boolean {
  return contract?.deliverable_kind === 'poster_onepager';
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
  const { deliverablePaths } = ensurePrerequisites({ workspaceRoot, topicId, deliverableId, route, mode, baselineDeliverableId });
  const stageContract = safeArray<PosterRuntimeStageContract>(contract.stage_sequence?.stages).find((stage) => stage?.stage_id === route) || null;
  let payload: unknown;
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
    ...(payload as Record<string, unknown>),
  } as PosterRuntimeRouteResult;
}
