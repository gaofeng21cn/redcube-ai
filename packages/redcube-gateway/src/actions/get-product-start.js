import { getProductEntryManifest } from './get-product-entry-manifest.js';
import { buildRuntimeLoopClosureManifestSurface } from './product-entry-continuity-surfaces.js';

const MANAGED_RUNTIME_OWNER = 'upstream_hermes_agent';

export async function getProductStart(request) {
  const manifest = await getProductEntryManifest(request);

  return {
    ok: true,
    target_domain_id: manifest.target_domain_id,
    workspace_locator: manifest.workspace_locator,
    runtime_loop_closure: buildRuntimeLoopClosureManifestSurface({
      runtimeOwner: manifest?.runtime?.runtime_owner || MANAGED_RUNTIME_OWNER,
      source: 'start',
      entryMode: 'start_projection',
    }),
    ...manifest.product_entry_start,
  };
}
