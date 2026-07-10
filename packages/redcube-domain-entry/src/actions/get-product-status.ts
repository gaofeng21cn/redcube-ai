import {
  buildGeneratedProductEntryDomainSurface,
} from 'opl-framework-shared/product-entry-companions';

import { getProductEntryManifest } from './get-product-entry-manifest.js';

export async function getProductStatus(
  request: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const manifest = await getProductEntryManifest(request);
  return buildGeneratedProductEntryDomainSurface({
    domain_id: 'redcube_ai',
    domain_owner: 'redcube_ai',
    manifest,
    shell_aliases: {
      status: 'status',
      direct: 'direct',
      opl_hosted: 'opl_hosted',
    },
    recommended_action: 'inspect_or_start_product_entry',
    notes: [
      'RCA exposes domain handler and visual authority refs; OPL owns the generated status surface.',
    ],
    entry_descriptor: manifest.entry_descriptor,
    domain_projection: {
      native_ppt_helper_descriptor_ref: '/native_ppt_operator_ux',
      operator_evidence_readiness_ref: '/operator_evidence_readiness_projection',
      visual_pack_compiler_handoff_ref: '/visual_pack_compiler_handoff',
      visual_transition_evaluator_ref: '/visual_transition_evaluator',
      workspace_receipt_inventory_ref: '/workspace_receipt_inventory_projection',
      ppt_deck_visual_route_truth_ref: '/ppt_deck_visual_route_truth',
      overlay_stage_sequences_ref: '/deliverable_facade/family_route_policy',
    },
  });
}
