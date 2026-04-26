import {
  canRunXiaohongshu as canRunXiaohongshuParts,
  runXiaohongshuRoute as runXiaohongshuRouteParts,
} from './xiaohongshu-runtime-family-parts/index.js';
import type {
  XhsRuntimeCanRunContract,
  XhsRuntimeRouteResult,
  XhsRuntimeRunRequest,
} from './types.js';

export function canRunXiaohongshu(contract: XhsRuntimeCanRunContract): boolean {
  return (canRunXiaohongshuParts as (contract: XhsRuntimeCanRunContract) => boolean)(contract);
}

export async function runXiaohongshuRoute(request: XhsRuntimeRunRequest): Promise<XhsRuntimeRouteResult> {
  return (runXiaohongshuRouteParts as (request: XhsRuntimeRunRequest) => Promise<XhsRuntimeRouteResult>)(request);
}
