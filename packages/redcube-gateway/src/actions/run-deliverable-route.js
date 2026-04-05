import { runDeliverableRoute as runHostedDeliverableRoute } from '@redcube/runtime';

export async function runDeliverableRoute(request) {
  const result = await runHostedDeliverableRoute(request);
  return {
    ...result,
    surface_kind: 'route_run',
    recommended_action: result.ok ? 'continue' : 'inspect_run_failure',
    summary: {
      route: request.route,
      run_id: result.run?.run_id || null,
      status: result.run?.status || null,
    },
  };
}
