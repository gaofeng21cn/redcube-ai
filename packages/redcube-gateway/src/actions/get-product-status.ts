import {
  buildFamilyProductEntrySurfaces,
} from 'opl-framework-shared/product-entry-companions';

import { getProductEntryManifest } from './get-product-entry-manifest.js';
import { buildRuntimeLoopClosureManifestSurface } from './product-entry-continuity-surfaces.js';

import type { ProductEntryManifestResponse, ProductStatusResponse, RuntimeLoopClosureSurface } from '../types.js';

const DEFAULT_RUNTIME_OWNER = 'codex_cli';

type GatewayProductEntryManifest = ProductEntryManifestResponse & {
  deliverable_facade?: {
    family_route_policy?: Record<string, unknown>;
  } & Record<string, unknown>;
  native_ppt_operator_ux?: unknown;
  operator_evidence_readiness_projection?: unknown;
  ppt_deck_visual_route_truth?: unknown;
  schema_ref?: string;
  workspace_receipt_inventory_projection?: unknown;
};

type ProductStatusSurface = ProductStatusResponse & {
  deliverable_facade?: unknown;
  native_ppt_operator_ux?: unknown;
  operator_evidence_readiness_projection?: unknown;
  ppt_deck_visual_route_truth?: unknown;
  overlay_stage_sequences: Record<string, unknown>;
  runtime_loop_closure: RuntimeLoopClosureSurface;
  workspace_receipt_inventory_projection?: unknown;
};

export async function getProductStatus(request: Record<string, unknown>): Promise<ProductStatusSurface> {
  const manifest = await getProductEntryManifest(request) as unknown as GatewayProductEntryManifest;
  const entrySurfaces = buildFamilyProductEntrySurfaces({
    product_entry_shell: manifest.product_entry_shell,
    shell_aliases: {
      status: 'status',
      direct: 'direct',
      opl_hosted: 'opl_hosted',
      session: 'session',
    },
    shared_handoff: manifest.shared_handoff,
  }) as ProductStatusSurface['entry_surfaces'];
  const entryStatusSurface = manifest.entry_status_surface ?? manifest.status_surface;
  const notes = [
    'This product-entry overview surface is exposed through the `status` command key as a lightweight direct-entry shell over the landed product-entry contracts.',
    'The OPL-hosted stage runtime handoff contract stays available for shell integration while direct RedCube entry remains the default public surface.',
    'It does not claim that a RedCube GUI shell or managed web productization is already landed.',
  ];

  return {
    ok: true,
    surface_kind: 'product_status',
    recommended_action: 'inspect_or_start_product_entry',
    target_domain_id: manifest.target_domain_id,
    entry_status_surface: entryStatusSurface,
    status_surface: entryStatusSurface,
    workspace_locator: manifest.workspace_locator,
    runtime: manifest.runtime,
    product_entry_status: manifest.product_entry_status,
    operator_loop_surface: manifest.operator_loop_surface,
    operator_loop_actions: manifest.operator_loop_actions,
    product_entry_start: manifest.product_entry_start,
    product_entry_overview: manifest.product_entry_overview,
    product_entry_preflight: manifest.product_entry_preflight,
    product_entry_readiness: manifest.product_entry_readiness,
    product_entry_quickstart: manifest.product_entry_quickstart,
    family_orchestration: manifest.family_orchestration,
    product_entry_manifest: manifest,
    entry_surfaces: entrySurfaces,
    domain_entry_contract: manifest.domain_entry_contract,
    user_interaction_contract: manifest.user_interaction_contract,
    summary: {
      product_entry_command: manifest.product_entry_overview?.product_entry_command ?? entryStatusSurface?.command ?? null,
      recommended_command: manifest.product_entry_overview?.recommended_command ?? manifest.recommended_command ?? 'redcube product invoke',
      operator_loop_command: manifest.product_entry_overview?.operator_loop_command ?? null,
    },
    notes,
    schema_ref: manifest.schema_ref,
    deliverable_facade: manifest.deliverable_facade,
    native_ppt_operator_ux: manifest.native_ppt_operator_ux,
    operator_evidence_readiness_projection: manifest.operator_evidence_readiness_projection,
    workspace_receipt_inventory_projection: manifest.workspace_receipt_inventory_projection,
    ppt_deck_visual_route_truth: manifest.ppt_deck_visual_route_truth,
    overlay_stage_sequences: manifest.deliverable_facade?.family_route_policy || {},
    runtime_loop_closure: buildRuntimeLoopClosureManifestSurface({
      runtimeOwner: manifest.runtime?.runtime_owner || DEFAULT_RUNTIME_OWNER,
      source: 'product_entry_overview',
      entryMode: 'product_entry_overview_projection',
    }) as RuntimeLoopClosureSurface,
  };
}
