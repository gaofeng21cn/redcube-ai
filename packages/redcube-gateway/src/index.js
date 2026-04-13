export { doctorWorkspace } from './actions/doctor-workspace.js';
export { listTopics } from './actions/list-topics.js';
export async function getOverlayCatalog(request) {
  const module = await import('./actions/get-overlay-catalog.js');
  return module.getOverlayCatalog(request);
}
export async function intakeSource(request) {
  const module = await import('./actions/intake-source.js');
  return module.intakeSource(request);
}
export async function researchSource(request) {
  const module = await import('./actions/source-research.js');
  return module.researchSource(request);
}
export async function prepareSourceAugmentation(request) {
  const module = await import('./actions/prepare-source-augmentation.js');
  return module.prepareSourceAugmentation(request);
}
export async function prepareSourceAugmentationResult(request) {
  const module = await import('./actions/prepare-source-augmentation-result.js');
  return module.prepareSourceAugmentationResult(request);
}
export async function writeSourceAugmentationResult(request) {
  const module = await import('./actions/write-source-augmentation-result.js');
  return module.writeSourceAugmentationResult(request);
}
export async function executeSourceAugmentation(request) {
  const module = await import('./actions/execute-source-augmentation.js');
  return module.executeSourceAugmentation(request);
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
export async function getPublicationProjection(request) {
  const module = await import('./actions/get-publication-projection.js');
  return module.getPublicationProjection(request);
}

export async function getRun(request) {
  const module = await import('./actions/get-run.js');
  return module.getRun(request);
}

export async function getManagedRun(request) {
  const module = await import('./actions/get-managed-run.js');
  return module.getManagedRun(request);
}
export async function superviseManagedRun(request) {
  const module = await import('./actions/supervise-managed-run.js');
  return module.superviseManagedRun(request);
}

export async function runDeliverableRoute(request) {
  const module = await import('./actions/run-deliverable-route.js');
  return module.runDeliverableRoute(request);
}
export async function runManagedDeliverable(request) {
  const module = await import('./actions/run-managed-deliverable.js');
  return module.runManagedDeliverable(request);
}
export async function invokeDomainEntry(request) {
  const module = await import('./actions/invoke-domain-entry.js');
  return module.invokeDomainEntry(request);
}
export async function invokeProductEntry(request) {
  const module = await import('./actions/invoke-product-entry.js');
  return module.invokeProductEntry(request);
}
export async function invokeFederatedProductEntry(request) {
  const module = await import('./actions/invoke-federated-product-entry.js');
  return module.invokeFederatedProductEntry(request);
}
export async function getProductEntrySession(request) {
  const module = await import('./actions/get-product-entry-session.js');
  return module.getProductEntrySession(request);
}
export async function getProductEntryManifest(request) {
  const module = await import('./actions/get-product-entry-manifest.js');
  return module.getProductEntryManifest(request);
}
export async function getProductFrontdesk(request) {
  const module = await import('./actions/get-product-frontdesk.js');
  return module.getProductFrontdesk(request);
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
