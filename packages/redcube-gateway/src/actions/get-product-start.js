import { getProductEntryManifest } from './get-product-entry-manifest.js';

export async function getProductStart(request) {
  const manifest = await getProductEntryManifest(request);

  return {
    ok: true,
    target_domain_id: manifest.target_domain_id,
    workspace_locator: manifest.workspace_locator,
    ...manifest.product_entry_start,
  };
}
