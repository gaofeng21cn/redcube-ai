import {
  canRunXiaohongshu as canRunXiaohongshuParts,
  runXiaohongshuRoute as runXiaohongshuRouteParts,
} from './xiaohongshu-runtime-family-parts/index.js';

/**
 * @typedef {import('./types.js').XhsRuntimeCanRunContract} XhsRuntimeCanRunContract
 * @typedef {import('./types.js').XhsRuntimeRunRequest} XhsRuntimeRunRequest
 * @typedef {import('./types.js').XhsRuntimeRouteResult} XhsRuntimeRouteResult
 */

/**
 * @param {XhsRuntimeCanRunContract} contract
 * @returns {boolean}
 */
export function canRunXiaohongshu(contract) {
  return canRunXiaohongshuParts(contract);
}

/**
 * @param {XhsRuntimeRunRequest} request
 * @returns {Promise<XhsRuntimeRouteResult>}
 */
export async function runXiaohongshuRoute(request) {
  return runXiaohongshuRouteParts(request);
}
