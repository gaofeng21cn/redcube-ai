import { reviewRenderedDeliverable } from '@redcube/runtime';

export async function reviewRenderOutput(request) {
  return reviewRenderedDeliverable(request);
}
