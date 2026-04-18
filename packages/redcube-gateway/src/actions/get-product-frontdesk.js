import { buildProductFrontdesk } from 'opl-readonly-gateway/product-entry-companions';

import { getProductEntryManifest } from './get-product-entry-manifest.js';

export async function getProductFrontdesk(request) {
  const manifest = await getProductEntryManifest(request);

  return buildProductFrontdesk({
    recommended_action: 'inspect_or_start_product_entry',
    target_domain_id: manifest.target_domain_id,
    workspace_locator: manifest.workspace_locator,
    runtime: manifest.runtime,
    product_entry_status: manifest.product_entry_status,
    frontdesk_surface: manifest.frontdesk_surface,
    operator_loop_surface: manifest.operator_loop_surface,
    operator_loop_actions: manifest.operator_loop_actions,
    product_entry_start: manifest.product_entry_start,
    product_entry_overview: manifest.product_entry_overview,
    product_entry_preflight: manifest.product_entry_preflight,
    product_entry_readiness: manifest.product_entry_readiness,
    product_entry_quickstart: manifest.product_entry_quickstart,
    family_orchestration: manifest.family_orchestration,
    product_entry_manifest: manifest,
    entry_surfaces: {
      direct: manifest.product_entry_shell.direct,
      federated: manifest.product_entry_shell.federated,
      session: manifest.product_entry_shell.session,
    },
    summary: {
      frontdesk_command: manifest.frontdesk_surface?.command || null,
      recommended_command: manifest.recommended_command,
      operator_loop_command: manifest.operator_loop_surface?.command || null,
    },
    notes: [
      'This frontdesk surface is a lightweight direct-entry shell over the landed product-entry contracts.',
      'It does not claim that RedCube managed web productization is already landed.',
    ],
    extra_payload: {
      ok: true,
    },
  });
}
