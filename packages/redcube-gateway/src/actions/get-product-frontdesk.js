import {
  buildFamilyProductFrontdeskFromManifest,
} from 'opl-gateway-shared/product-entry-companions';

import { getProductEntryManifest } from './get-product-entry-manifest.js';

export async function getProductFrontdesk(request) {
  const manifest = await getProductEntryManifest(request);
  return buildFamilyProductFrontdeskFromManifest({
    recommended_action: 'inspect_or_start_product_entry',
    product_entry_manifest: manifest,
    shell_aliases: {
      direct: 'direct',
      opl_bridge: 'opl_bridge',
      session: 'session',
    },
    schema_ref: manifest.schema_ref,
    notes: [
      'This frontdesk surface is a lightweight direct-entry shell over the landed product-entry contracts.',
      'The internal OPL bridge contract stays available for shell integration while direct RedCube entry remains the default public surface.',
      'It does not claim that RedCube managed web productization is already landed.',
    ],
    extra_payload: {
      ok: true,
    },
  });
}
