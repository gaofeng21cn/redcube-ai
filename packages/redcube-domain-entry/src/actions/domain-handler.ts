// @ts-nocheck
import {
  dispatchDomainActionAdapter,
  exportDomainActionAdapter,
} from './domain-action-adapter.js';

export async function exportDomainHandler(request) {
  const projection = await exportDomainActionAdapter(request);
  return {
    ...projection,
    surface_kind: 'product_domain_handler_export',
    handler_id: 'redcube_product_domain_handler.v1',
    handler_role: 'opl_standard_domain_agent_handler_target',
    wrapped_projection_surface_kind: projection.surface_kind,
    repo_local_legacy_product_domain_action_adapter_command_available: false,
    compatibility_alias_allowed: false,
    command: 'redcube domain-handler export',
    dispatch_command: 'redcube domain-handler dispatch',
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
    command: 'redcube domain-handler dispatch',
  };
}
