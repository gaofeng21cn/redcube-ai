import { getProductEntryManifest } from './get-product-entry-manifest.js';
import { buildRuntimeLoopClosureManifestSurface } from './product-entry-continuity-surfaces.js';

import type { ProductEntryManifestResponse, ProductEntryStartCompanion, RuntimeLoopClosureSurface } from '../types.js';

const DEFAULT_RUNTIME_OWNER = 'codex_cli';

type ProductStartSurface = ProductEntryStartCompanion & {
  runtime_loop_closure: RuntimeLoopClosureSurface;
};

export async function getProductStart(request: Record<string, unknown>): Promise<ProductStartSurface> {
  const manifest = await getProductEntryManifest(request) as unknown as ProductEntryManifestResponse;
  const productEntryStart = manifest.product_entry_start;

  return {
    target_domain_id: manifest.target_domain_id,
    workspace_locator: manifest.workspace_locator,
    runtime_loop_closure: buildRuntimeLoopClosureManifestSurface({
      runtimeOwner: manifest.runtime?.runtime_owner || DEFAULT_RUNTIME_OWNER,
      source: 'start',
      entryMode: 'start_projection',
    }) as RuntimeLoopClosureSurface,
    ...productEntryStart,
    ok: productEntryStart.ok ?? true,
  };
}
