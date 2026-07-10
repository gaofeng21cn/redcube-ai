import {
  OPL_HOSTED_PRODUCT_ENTRY_CONTRACT_REF,
  PRODUCT_ENTRY_CONTRACT_REF,
  SESSION_CONTINUITY_PROVENANCE_CONTRACT_REF,
} from './policy.js';

type ManifestExtraPayloadInput = {
  deliverableFacade: unknown;
  nativePptOperatorUx: unknown;
  productEntryDescriptor: unknown;
  productEntrySessionCommand: string;
  routeEquivalence: unknown;
  sourceProvenance: unknown;
};

export function buildManifestExtraPayload({
  deliverableFacade,
  nativePptOperatorUx,
  productEntryDescriptor,
  productEntrySessionCommand,
  routeEquivalence,
  sourceProvenance,
}: ManifestExtraPayloadInput) {
  return {
    ok: true,
    recommended_action: 'invoke_product_entry',
    route_equivalence: routeEquivalence,
    deliverable_facade: deliverableFacade,
    source_provenance: sourceProvenance,
    native_ppt_operator_ux: nativePptOperatorUx,
    entry_descriptor: productEntryDescriptor,
    review_state: {
      surface_kind: 'review_state_ref',
      owner: 'redcube_ai',
      ref: 'domain_handler:getReviewState',
      session_command_template: productEntrySessionCommand,
    },
    publication_projection: {
      surface_kind: 'publication_projection_ref',
      owner: 'redcube_ai',
      ref: 'domain_handler:getPublicationProjection',
      session_command_template: productEntrySessionCommand,
    },
    current_truth: {
      product_entry_contract_ref: PRODUCT_ENTRY_CONTRACT_REF,
      opl_hosted_product_entry_contract_ref: OPL_HOSTED_PRODUCT_ENTRY_CONTRACT_REF,
      session_continuity_provenance_contract_ref: SESSION_CONTINUITY_PROVENANCE_CONTRACT_REF,
    },
    generated_session_surface_ref: 'opl_generated:product_session',
    authority_boundary: {
      refs_only: true,
      writes_visual_truth: false,
      writes_artifact_body: false,
      writes_memory_body: false,
      creates_owner_receipt: false,
      creates_typed_blocker: false,
      issues_review_or_export_verdict: false,
    },
  };
}
