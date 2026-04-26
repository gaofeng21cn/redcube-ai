// @ts-nocheck
export { doctorWorkspace } from './actions/doctor-workspace.js';
export { listTopics } from './actions/list-topics.js';
export async function getOverlayCatalog() {
  const { getDefaultOverlayCatalog } = await import('@redcube/overlay-registry');
  const catalog = getDefaultOverlayCatalog();
  return {
    ok: true,
    ...catalog,
    recommended_action: 'create_deliverable',
    summary: {
      total_overlays: catalog.overlays.length,
      total_profiles: catalog.overlays.reduce((sum, overlay) => sum + overlay.profiles.length, 0),
    },
  };
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
export async function createDeliverable(request) {
  const module = await import('./actions/create-deliverable.js');
  return module.createDeliverable(request);
}

export async function getDeliverable(request) {
  const module = await import('./actions/get-deliverable.js');
  return module.getDeliverable(request);
}
export async function getPublicationProjection(request) {
  const { getPublicationProjection: loadPublicationProjection } = await import('@redcube/runtime');
  return loadPublicationProjection(request);
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
export async function runSourceFirstFanout(request) {
  const module = await import('./actions/run-source-first-fanout.js');
  return module.runSourceFirstFanout(request);
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
export async function getProductStart(request) {
  const module = await import('./actions/get-product-start.js');
  return module.getProductStart(request);
}
export async function getProductPreflight(request) {
  const module = await import('./actions/get-product-preflight.js');
  return module.getProductPreflight(request);
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
  const { reviewRenderedDeliverable } = await import('@redcube/runtime');
  return reviewRenderedDeliverable(request);
}

export async function runtimeWatch(request) {
  const module = await import('./actions/runtime-watch.js');
  return module.runtimeWatch(request);
}

export async function getReviewState(request) {
  const { getReviewState: loadReviewState } = await import('@redcube/runtime');
  return loadReviewState(request);
}

export async function applyReviewMutation(request) {
  const { applyReviewMutation: mutateReviewState } = await import('@redcube/runtime');
  return mutateReviewState(request);
}
