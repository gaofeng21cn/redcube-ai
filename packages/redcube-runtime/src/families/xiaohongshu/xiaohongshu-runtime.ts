import {
  runXiaohongshuRouteParts,
} from './xiaohongshu-runtime-family-parts/index.js';
import type {
  XhsRuntimeRouteResult,
  XhsRuntimeRunRequest,
} from './types.js';

export async function runXiaohongshuRoute(request: XhsRuntimeRunRequest): Promise<XhsRuntimeRouteResult> {
  return (runXiaohongshuRouteParts as (request: XhsRuntimeRunRequest) => Promise<XhsRuntimeRouteResult>)(request);
}
