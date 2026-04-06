import {
  canRunPptDeck as canRunPptDeckJs,
  runPptDeckRoute as runPptDeckRouteJs,
} from './ppt-deck-runtime.js';

import type {
  PptRuntimeCanRunContract,
  PptRuntimeRouteResult,
  PptRuntimeRunRequest,
} from './types.js';

export function canRunPptDeck(contract: PptRuntimeCanRunContract): boolean {
  return canRunPptDeckJs(
    contract as Parameters<typeof canRunPptDeckJs>[0],
  ) as boolean;
}

export async function runPptDeckRoute(
  request: PptRuntimeRunRequest,
): Promise<PptRuntimeRouteResult> {
  return runPptDeckRouteJs(
    request as Parameters<typeof runPptDeckRouteJs>[0],
  ) as Promise<PptRuntimeRouteResult>;
}

export type {
  PptExportBundleArtifact,
  PptRuntimeCanRunContract,
  PptRuntimeContract,
  PptRuntimeMode,
  PptRuntimeReviewCheckId,
  PptRuntimeRoute,
  PptRuntimeRouteResult,
  PptRuntimeRunRequest,
  PptScreenshotReviewArtifact,
  PptStorylineArtifact,
} from './types.js';
