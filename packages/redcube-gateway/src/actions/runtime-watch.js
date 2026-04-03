import { watchRuntimeReviewLoop } from '@redcube/runtime';

export async function runtimeWatch(request) {
  return watchRuntimeReviewLoop(request);
}
