import {
  canRunPosterOnepager as canRunPosterOnepagerJs,
  runPosterOnepagerRoute as runPosterOnepagerRouteJs,
} from './poster-onepager-runtime.js';

import type {
  PosterRuntimeCanRunContract,
  PosterRuntimeRouteResult,
  PosterRuntimeRunRequest,
} from './types.js';

export function canRunPosterOnepager(contract: PosterRuntimeCanRunContract): boolean {
  return canRunPosterOnepagerJs(
    contract as Parameters<typeof canRunPosterOnepagerJs>[0],
  ) as boolean;
}

export async function runPosterOnepagerRoute(
  request: PosterRuntimeRunRequest,
): Promise<PosterRuntimeRouteResult> {
  return runPosterOnepagerRouteJs(
    request as Parameters<typeof runPosterOnepagerRouteJs>[0],
  ) as Promise<PosterRuntimeRouteResult>;
}

export type {
  PosterBaselineReview,
  PosterBlueprintArtifact,
  PosterExportBundleArtifact,
  PosterRenderArtifact,
  PosterRuntimeArtifactBase,
  PosterRuntimeCanRunContract,
  PosterRuntimeContract,
  PosterRuntimeLatestChecks,
  PosterRuntimeMode,
  PosterRuntimePromptMeta,
  PosterRuntimeReviewCheckId,
  PosterRuntimeReviewPolicy,
  PosterRuntimeReviewStatePatch,
  PosterRuntimeRoute,
  PosterRuntimeRouteResult,
  PosterRuntimeRunRequest,
  PosterScreenshotReviewArtifact,
  PosterStorylineArtifact,
  PosterVisualDirectionArtifact,
  PosterVisualDirectorReviewArtifact,
} from './types.js';
