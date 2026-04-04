import { applyReviewMutation as mutateReviewState } from '@redcube/runtime';

export async function applyReviewMutation(request) {
  return mutateReviewState(request);
}
