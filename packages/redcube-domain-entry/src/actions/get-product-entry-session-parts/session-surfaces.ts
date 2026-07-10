import type { ProductEntrySessionResponse } from '../../types.js';
import { safeText } from '../action-utils.js';
import { productEntrySessionFile } from '../product-entry-session-refs.js';

type JsonRecord = Record<string, unknown>;

const SUPPORTED_PRODUCT_ENTRY_RUNTIME_OWNER = 'configured_family_runtime_provider';

function record(value: unknown): JsonRecord {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as JsonRecord
    : {};
}

function stringRefs(value: unknown): string[] {
  return Array.isArray(value)
    ? value.map((entry) => safeText(entry)).filter(Boolean)
    : [];
}

export function buildProductEntrySessionDomainSnapshotRefs({
  entrySessionId,
  session,
}: {
  entrySessionId: string;
  session: JsonRecord;
}): ProductEntrySessionResponse {
  const runtimeOwner = safeText(session.runtime_owner);
  if (runtimeOwner !== SUPPORTED_PRODUCT_ENTRY_RUNTIME_OWNER) {
    throw new Error('product entry session runtime_owner 漂移');
  }

  const runtimeProjection = record(session.runtime_projection);
  const providerCurrentness = record(runtimeProjection.provider_currentness);
  const blocker = record(session.closeout_first_blocker);
  const progressDelta = record(session.progress_delta);
  const nextForcedDelta = record(progressDelta.next_forced_delta);
  const latestRunId = safeText(session.latest_run_id);
  const typedBlockerRef = safeText(blocker.blocker_ref);
  const domainSnapshotRef = `domain-snapshot:rca/product-entry-session/${entrySessionId}`;

  return {
    ok: true,
    surface_kind: 'product_entry_session',
    projection_kind: 'rca_product_entry_session_domain_snapshot_refs',
    recommended_action: 'consume_with_opl_generated_product_session',
    owner: 'redcube_ai',
    entry_session_ref: {
      entry_session_id: entrySessionId,
      domain_snapshot_ref: domainSnapshotRef,
      session_file_ref: {
        ref_kind: 'runtime_state_path',
        ref: productEntrySessionFile(entrySessionId),
      },
      runtime_owner: runtimeOwner,
    },
    delivery_locator_refs: {
      workspace_ref: safeText(session.workspace_root) || null,
      deliverable_family: safeText(session.deliverable_family),
      topic_id: safeText(session.topic_id),
      deliverable_id: safeText(session.deliverable_id),
      profile_id: safeText(session.profile_id) || null,
    },
    currentness_refs: {
      domain_snapshot_ref: domainSnapshotRef,
      latest_surface_kind: safeText(session.latest_surface_kind) || null,
      latest_stage_execution_plan_ref: safeText(session.latest_stage_execution_plan_ref) || null,
      latest_visual_run_ref: latestRunId ? `route-run:${latestRunId}` : null,
      provider_attempt_ref: safeText(providerCurrentness.provider_attempt_ref) || null,
      provider_attempt_ledger_ref: safeText(providerCurrentness.provider_attempt_ledger_ref) || null,
      typed_blocker_ref: typedBlockerRef || null,
      next_forced_delta_refs: stringRefs(nextForcedDelta.refs),
    },
    authority_refs: {
      review_state_ref: 'domain-handler:getReviewState',
      publication_projection_ref: 'domain-handler:getPublicationProjection',
      artifact_locator_contract_ref: 'contracts/artifact_locator_contract.json',
      owner_receipt_contract_ref: 'contracts/owner_receipt_contract.json',
    },
    operator_navigation_refs: {
      generated_session_surface_ref: 'opl_generated:product_session',
      domain_snapshot_action_ref: 'domain-handler:getProductEntrySession',
      direct_entry_action_ref: 'domain-handler:invokeProductEntry',
    },
    authority_boundary: {
      refs_only: true,
      domain_snapshot_owner: 'redcube_ai',
      visual_truth_owner: 'redcube_ai',
      review_export_verdict_owner: 'redcube_ai',
      artifact_authority_owner: 'redcube_ai',
      visual_memory_owner: 'redcube_ai',
      owner_receipt_owner: 'redcube_ai',
      rca_owns_generic_session_shell: false,
      rca_owns_generic_workbench: false,
      writes_visual_truth: false,
      writes_artifact_body: false,
      writes_memory_body: false,
      issues_review_or_export_verdict: false,
      creates_owner_receipt: false,
      creates_typed_blocker: false,
    },
    summary: {
      entry_session_id: entrySessionId,
      deliverable_id: safeText(session.deliverable_id),
      latest_visual_run_ref: latestRunId ? `route-run:${latestRunId}` : null,
      typed_blocker_ref: typedBlockerRef || null,
    },
  };
}
