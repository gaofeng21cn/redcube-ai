// @ts-nocheck
import { getProductEntryManifest } from './get-product-entry-manifest.js';
import { dispatchDomainActionAdapter } from './domain-action-adapter-parts/dispatch-orchestration.js';
import { buildDomainActionAdapterProjection } from './domain-action-adapter-parts/domain_action_adapter-export-projection.js';
import { normalizeWorkspaceRoot } from './domain-action-adapter-parts/task-utils.js';

export async function exportDomainHandler(request) {
  const workspaceRoot = normalizeWorkspaceRoot(request);
  const manifest = await getProductEntryManifest({
    workspace_root: workspaceRoot,
    ...(Array.isArray(request?.workspace_receipt_scaleout_roots)
      ? { workspace_receipt_scaleout_roots: request.workspace_receipt_scaleout_roots }
      : {}),
  });
  const projection = buildDomainActionAdapterProjection({ workspaceRoot, manifest });
  return {
    ...projection,
    surface_kind: 'product_domain_handler_export',
    handler_id: 'redcube_product_domain_handler.v1',
    handler_role: 'opl_standard_domain_agent_handler_target',
    wrapped_projection_surface_kind: projection.surface_kind,
    repo_local_legacy_product_domain_action_adapter_command_available: false,
    compatibility_alias_allowed: false,
  };
}

export async function dispatchDomainHandler(request) {
  const receipt = await dispatchDomainActionAdapter(request);
  return {
    ...receipt,
    surface_kind: 'product_domain_handler_dispatch',
    handler_id: 'redcube_product_domain_handler.v1',
    handler_role: 'opl_standard_domain_agent_handler_target',
    wrapped_dispatch_surface_kind: receipt.surface_kind,
    repo_local_legacy_product_domain_action_adapter_command_available: false,
    compatibility_alias_allowed: false,
  };
}
