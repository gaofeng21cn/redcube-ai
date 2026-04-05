export { doctorWorkspace } from './actions/doctor-workspace.js';
export { listTopics } from './actions/list-topics.js';
export async function intakeSource(request) {
  const module = await import('./actions/intake-source.js');
  return module.intakeSource(request);
}
export async function importLegacyProject(request) {
  const module = await import('./actions/import-legacy-project.js');
  return module.importLegacyProject(request);
}
export async function createDeliverable(request) {
  const module = await import('./actions/create-deliverable.js');
  return module.createDeliverable(request);
}

export async function getDeliverable(request) {
  const module = await import('./actions/get-deliverable.js');
  return module.getDeliverable(request);
}

export async function getRun(request) {
  const module = await import('./actions/get-run.js');
  return module.getRun(request);
}

export async function runDeliverableRoute(request) {
  const module = await import('./actions/run-deliverable-route.js');
  return module.runDeliverableRoute(request);
}
export async function auditDeliverable(request) {
  const module = await import('./actions/audit-deliverable.js');
  return module.auditDeliverable(request);
}

export async function reviewRenderOutput(request) {
  const module = await import('./actions/review-render-output.js');
  return module.reviewRenderOutput(request);
}

export async function runtimeWatch(request) {
  const module = await import('./actions/runtime-watch.js');
  return module.runtimeWatch(request);
}

export async function getReviewState(request) {
  const module = await import('./actions/get-review-state.js');
  return module.getReviewState(request);
}

export async function applyReviewMutation(request) {
  const module = await import('./actions/apply-review-mutation.js');
  return module.applyReviewMutation(request);
}
