import {
  canRunXiaohongshu as canRunXiaohongshuJs,
  runXiaohongshuRoute as runXiaohongshuRouteJs,
} from './xiaohongshu-runtime.js';

import type {
  XhsRuntimeCanRunContract,
  XhsRuntimeRunRequest,
  XhsRuntimeRouteResult,
} from './types.js';

export function canRunXiaohongshu(contract: XhsRuntimeCanRunContract): boolean {
  return canRunXiaohongshuJs(
    contract as Parameters<typeof canRunXiaohongshuJs>[0],
  ) as boolean;
}

export async function runXiaohongshuRoute(
  request: XhsRuntimeRunRequest,
): Promise<XhsRuntimeRouteResult> {
  return runXiaohongshuRouteJs(
    request as Parameters<typeof runXiaohongshuRouteJs>[0],
  ) as Promise<XhsRuntimeRouteResult>;
}

export type {
  XhsDirectorReviewArtifact,
  XhsExportBundleArtifact,
  XhsPublishCopyArtifact,
  XhsRuntimeCanRunContract,
  XhsRuntimeContract,
  XhsRuntimeMode,
  XhsRuntimeRoute,
  XhsRuntimeRouteResult,
  XhsRuntimeRunRequest,
  XhsScreenshotReviewArtifact,
  XhsSeriesSurfaces,
} from './types.js';
