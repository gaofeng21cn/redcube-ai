import { getProductEntryManifest } from './get-product-entry-manifest.js';

export async function getProductStart(request: Record<string, unknown>) {
  const manifest = await getProductEntryManifest(request);
  return manifest.product_entry_start;
}
