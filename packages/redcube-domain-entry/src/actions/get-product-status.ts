import { getProductEntryManifest } from './get-product-entry-manifest.js';

export async function getProductStatus(
  request: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const manifest = await getProductEntryManifest(request);
  return {
    ok: true,
    surface_kind: 'rca_domain_status_refs_projection',
    owner: 'redcube_ai',
    consumer: 'one-person-lab',
    target_domain_id: 'redcube_ai',
    domain_evidence_refs: manifest.domain_evidence_refs,
    typed_blocker_refs: manifest.typed_blocker_refs,
    receipt_refs: manifest.receipt_refs,
    artifact_locator_refs: manifest.artifact_locator_refs,
    authority_boundary: manifest.authority_boundary,
  };
}
