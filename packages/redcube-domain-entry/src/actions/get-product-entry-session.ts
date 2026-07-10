import type { ProductEntrySessionResponse } from '../types.js';
import {
  buildProductEntrySessionDomainSnapshotRefs,
  normalizeOplGeneratedProductSessionSurface,
} from './product-entry-domain-snapshot-refs.js';
import { requireField } from './action-utils.js';

export async function getProductEntrySession(
  request: Record<string, unknown>,
): Promise<ProductEntrySessionResponse> {
  const entrySessionId = requireField(
    'entry_session_id',
    request.entry_session_id || request.entrySessionId,
  );
  const generatedSession = normalizeOplGeneratedProductSessionSurface(
    request.opl_generated_session_surface || request.oplGeneratedSessionSurface,
    entrySessionId,
    { required: true },
  );
  return buildProductEntrySessionDomainSnapshotRefs(generatedSession);
}
