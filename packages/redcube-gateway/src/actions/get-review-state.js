import { getReviewState as loadReviewState } from '@redcube/runtime';

export async function getReviewState(request) {
  return loadReviewState(request);
}
