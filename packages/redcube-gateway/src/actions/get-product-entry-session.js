import { loadProductEntrySession, productEntrySessionFile } from '@redcube/runtime';

import { getManagedRun } from './get-managed-run.js';
import { getPublicationProjection } from './get-publication-projection.js';
import { getReviewState } from './get-review-state.js';

function safeText(value, fallback = '') {
  const text = String(value || '').trim();
  return text || fallback;
}

function requireField(name, value) {
  const text = safeText(value);
  if (!text) {
    throw new Error(`${name} 不能为空`);
  }
  return text;
}

export async function getProductEntrySession(request) {
  const entrySessionId = requireField(
    'entry_session_id',
    request?.entry_session_id || request?.entrySessionId,
  );
  const session = loadProductEntrySession({ entrySessionId });
  if (!session) {
    throw new Error(`product entry session 不存在: ${entrySessionId}`);
  }
  if (safeText(session.runtime_owner) !== 'codex_cli') {
    throw new Error('product entry session runtime_owner 漂移');
  }

  const reviewState = await getReviewState({
    workspaceRoot: session.workspace_root,
    topicId: session.topic_id,
    deliverableId: session.deliverable_id,
  });
  const publicationProjection = await getPublicationProjection({
    workspaceRoot: session.workspace_root,
    topicId: session.topic_id,
  });
  const managedRun = session.latest_managed_run_id
    ? await getManagedRun({
      workspaceRoot: session.workspace_root,
      managedRunId: session.latest_managed_run_id,
    })
    : null;

  return {
    ok: true,
    surface_kind: 'product_entry_session',
    recommended_action: managedRun?.progress_projection?.needs_user_decision
      ? 'decide_product_next_step'
      : 'continue_product_entry',
    product_entry_contract_id: 'managed_product_entry_hardening',
    entry_session: {
      entry_session_id: entrySessionId,
      session_file: productEntrySessionFile(entrySessionId),
      runtime_owner: session.runtime_owner,
    },
    delivery_identity: {
      deliverable_family: session.deliverable_family,
      topic_id: session.topic_id,
      deliverable_id: session.deliverable_id,
      profile_id: session.profile_id,
    },
    continuation_snapshot: {
      latest_managed_run_id: session.latest_managed_run_id || null,
      latest_run_id: session.latest_run_id || null,
      managed_progress_projection: managedRun?.progress_projection || null,
      runtime_supervision: managedRun?.runtime_supervision || null,
    },
    review_state: reviewState,
    publication_projection: publicationProjection,
    summary: {
      entry_session_id: entrySessionId,
      deliverable_id: session.deliverable_id,
      latest_handle: session.latest_managed_run_id || session.latest_run_id || null,
    },
  };
}
