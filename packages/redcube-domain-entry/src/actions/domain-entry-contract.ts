// @ts-nocheck
import {
  buildSharedHandoff,
  buildSharedHandoffReturnSurface,
} from 'opl-framework/family-entry-contracts';

export function buildRedCubeSharedHandoff({
  targetDomainId = 'redcube_ai',
  returnSurfaceKind = 'product_entry',
  extraPayload,
} = {}) {
  return buildSharedHandoff({
    opl_return_surface: buildSharedHandoffReturnSurface({
      surface_kind: returnSurfaceKind,
      target_domain_id: targetDomainId,
      extra_payload: extraPayload,
    }),
  });
}
