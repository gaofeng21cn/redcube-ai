import { resolveProductEntryCurrentness } from './product-entry-currentness-resolver.js';
import type { ProductEntrySessionResponse } from '../types.js';
import { buildProductEntrySessionDomainSnapshotRefs } from './get-product-entry-session-parts/session-surfaces.js';
import {
  loadProductEntrySessionRef,
} from './product-entry-session-refs.js';
import { requireField } from './action-utils.js';

export async function getProductEntrySession(
  request: Record<string, unknown>,
): Promise<ProductEntrySessionResponse> {
  const entrySessionId = requireField(
    'entry_session_id',
    request.entry_session_id || request.entrySessionId,
  );
  const storedSession = loadProductEntrySessionRef({ entrySessionId });
  if (!storedSession) {
    throw new Error(`product entry session 不存在: ${entrySessionId}`);
  }
  const { session } = resolveProductEntryCurrentness({ session: storedSession, persist: false });
  return buildProductEntrySessionDomainSnapshotRefs({ entrySessionId, session });
}
