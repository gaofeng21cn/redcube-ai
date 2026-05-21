// @ts-nocheck
import { getProductEntryManifest } from './get-product-entry-manifest.js';
import { productSidecarGuardedActionSet } from './product-sidecar-parts/guarded-action-catalog.js';
import { dispatchProductSidecar as dispatchProductSidecarImpl } from './product-sidecar-parts/dispatch-orchestration.js';
import { buildSidecarProjection, DOMAIN_ID, SIDECAR_ID } from './product-sidecar-parts/sidecar-export-projection.js';
import { normalizeWorkspaceRoot } from './product-sidecar-parts/task-utils.js';
export {
  assertReceiptOnlyHostedAttemptProjection,
  buildHostedAttemptBridgeFixture,
  isReceiptOnlyHostedAttemptProjection,
  reconcileHostedAttemptReceipt,
} from './product-sidecar-parts/hosted-attempt-reconciliation.js';

const GUARDED_ACTIONS = productSidecarGuardedActionSet();

export async function exportProductSidecar(request) {
  const workspaceRoot = normalizeWorkspaceRoot(request);
  const manifest = await getProductEntryManifest({ workspace_root: workspaceRoot });
  return buildSidecarProjection({ workspaceRoot, manifest });
}

export async function dispatchProductSidecar(request) {
  return dispatchProductSidecarImpl(request);
}

export {
  SIDECAR_ID,
  DOMAIN_ID,
  GUARDED_ACTIONS,
};
