import { runDeliverableRoute as runHostedDeliverableRoute } from '@redcube/runtime';

export async function runDeliverableRoute(request) {
  return runHostedDeliverableRoute(request);
}
