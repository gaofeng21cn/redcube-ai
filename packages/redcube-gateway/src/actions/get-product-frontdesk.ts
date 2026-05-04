import {
  buildFamilyProductFrontdeskFromManifest,
} from 'opl-gateway-shared/product-entry-companions';

import { getProductEntryManifest } from './get-product-entry-manifest.js';
import { buildRuntimeLoopClosureManifestSurface } from './product-entry-continuity-surfaces.js';

import type { ProductEntryManifestResponse, ProductFrontdeskResponse, RuntimeLoopClosureSurface } from '../types.js';

const MANAGED_RUNTIME_OWNER = 'upstream_hermes_agent';

type GatewayProductEntryManifest = ProductEntryManifestResponse & {
  deliverable_facade?: {
    family_route_policy?: Record<string, unknown>;
  } & Record<string, unknown>;
  native_ppt_operator_ux?: unknown;
  schema_ref?: string;
};

type ProductFrontdeskSurface = ProductFrontdeskResponse & {
  deliverable_facade?: unknown;
  native_ppt_operator_ux?: unknown;
  overlay_stage_sequences: Record<string, unknown>;
  runtime_loop_closure: RuntimeLoopClosureSurface;
};

export async function getProductFrontdesk(request: Record<string, unknown>): Promise<ProductFrontdeskSurface> {
  const manifest = await getProductEntryManifest(request) as unknown as GatewayProductEntryManifest;
  const buildFrontdesk = buildFamilyProductFrontdeskFromManifest as (input: unknown) => unknown;
  const frontdeskSurface = buildFrontdesk({
    recommended_action: 'inspect_or_start_product_entry',
    product_entry_manifest: manifest,
    shell_aliases: {
      direct: 'direct',
      opl_bridge: 'opl_bridge',
      session: 'session',
    },
    schema_ref: manifest.schema_ref,
    notes: [
      'This product-entry overview surface is exposed through the legacy `frontdesk` command key as a lightweight direct-entry shell over the landed product-entry contracts.',
      'The internal OPL bridge contract stays available for shell integration while direct RedCube entry remains the default public surface.',
      'It does not claim that a RedCube GUI shell or managed web productization is already landed.',
    ],
    extra_payload: {
      ok: true,
    },
  }) as ProductFrontdeskResponse;

  return {
    ...frontdeskSurface,
    deliverable_facade: manifest.deliverable_facade,
    native_ppt_operator_ux: manifest.native_ppt_operator_ux,
    overlay_stage_sequences: manifest.deliverable_facade?.family_route_policy || {},
    runtime_loop_closure: buildRuntimeLoopClosureManifestSurface({
      runtimeOwner: manifest.runtime?.runtime_owner || MANAGED_RUNTIME_OWNER,
      source: 'product_entry_overview',
      entryMode: 'product_entry_overview_projection',
    }) as RuntimeLoopClosureSurface,
  };
}
