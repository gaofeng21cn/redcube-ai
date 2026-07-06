// @ts-nocheck
import { getProductEntryManifest } from './get-product-entry-manifest.js';
import { dispatchDomainActionAdapter as dispatchDomainActionAdapterImpl } from './domain-action-adapter-parts/dispatch-orchestration.js';
import { buildDomainActionAdapterProjection } from './domain-action-adapter-parts/domain_action_adapter-export-projection.js';
import { normalizeWorkspaceRoot } from './domain-action-adapter-parts/task-utils.js';

export async function exportDomainActionAdapter(request) {
  const workspaceRoot = normalizeWorkspaceRoot(request);
  const manifestRequest = {
    workspace_root: workspaceRoot,
  };
  if (Array.isArray(request?.workspace_receipt_scaleout_roots)) {
    manifestRequest.workspace_receipt_scaleout_roots = request.workspace_receipt_scaleout_roots;
  }
  const manifest = await getProductEntryManifest(manifestRequest);
  return buildDomainActionAdapterProjection({ workspaceRoot, manifest });
}

export async function dispatchDomainActionAdapter(request) {
  return dispatchDomainActionAdapterImpl(request);
}
