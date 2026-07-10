import type { ProductEntrySessionResponse } from '../types.js';
import {
  buildProductEntrySessionDomainSnapshotRefs,
  normalizeOplProductSessionEnvelope,
} from './product-entry-domain-snapshot-refs.js';
import { requireField } from './action-utils.js';

export async function getProductEntrySession(
  request: Record<string, unknown>,
): Promise<ProductEntrySessionResponse> {
  const entrySessionId = requireField(
    'entry_session_id',
    request.entry_session_id || request.entrySessionId,
  );
  const envelope = normalizeOplProductSessionEnvelope(
    request.opl_session_envelope || request.oplSessionEnvelope,
    entrySessionId,
    { required: true },
  );
  return buildProductEntrySessionDomainSnapshotRefs(envelope);
}
