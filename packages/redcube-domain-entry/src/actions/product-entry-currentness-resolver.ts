// @ts-nocheck
import path from 'node:path';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';

import {
  resolveWorkspaceContract,
} from '@redcube/runtime-protocol';
import { productEntrySessionFile } from './product-entry-session-refs.js';

function safeText(value, fallback = '') {
  const text = String(value || '').trim();
  return text || fallback;
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function readJson(file) {
  return JSON.parse(readFileSync(file, 'utf-8'));
}

function writeJson(file, value) {
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, 'utf-8');
}

function routeRunsDir(workspaceRoot) {
  return path.join(resolveWorkspaceContract({ workspaceRoot }).runtimeDir, 'runs');
}

function runTimestamp(run) {
  return Date.parse(safeText(run?.finished_at || run?.started_at)) || 0;
}

function loadDeliverableRuns({ workspaceRoot, topicId, deliverableId, deliverableFamily }) {
  const runsDir = routeRunsDir(workspaceRoot);
  if (!existsSync(runsDir)) return [];
  return readdirSync(runsDir)
    .filter((file) => file.endsWith('.json'))
    .map((file) => {
      try {
        const run = readJson(path.join(runsDir, file));
        return { ...run, __run_file: path.join(runsDir, file) };
      } catch {
        return null;
      }
    })
    .filter((run) => run
      && safeText(run.topic_id) === safeText(topicId)
      && safeText(run.deliverable_id || run.target) === safeText(deliverableId)
      && (!deliverableFamily || safeText(run.overlay) === safeText(deliverableFamily)))
    .sort((left, right) => runTimestamp(left) - runTimestamp(right));
}

function latestDeliverableRun(input) {
  return loadDeliverableRuns(input).at(-1) || null;
}

function sessionTimestamp(session) {
  return Date.parse(safeText(session?.updated_at)) || 0;
}

function runIsNewerThanSession(run, session) {
  if (!run) return false;
  if (safeText(run.run_id) && safeText(run.run_id) === safeText(session?.latest_run_id)) return true;
  const runTime = runTimestamp(run);
  const storedTime = sessionTimestamp(session);
  return runTime > storedTime;
}

function closeoutConsumed(run) {
  const closeout = run?.closeout || run?.route_closeout || run?.owner_closeout || null;
  if (!closeout) return true;
  return closeout.consumed === true || closeout.consumed_at != null || closeout.status === 'consumed';
}

function slugBlockerKind(value) {
  return safeText(value, 'route_closeout_unconsumed').replace(/_/g, '-');
}

function blockerRecommendedAction(blocker) {
  return safeText(blocker?.recommended_action || blocker?.next_required_owner_action)
    || (safeText(blocker?.blocker_kind) === 'missing_provider_attempt_ledger'
      ? 'resolve_provider_attempt_ledger'
      : 'consume_route_closeout');
}

function buildVisualDeliverableNextForcedDelta({ run, progressDelta }) {
  return {
    surface_kind: 'next_forced_delta',
    domain_alias: 'visual_deliverable_delta',
    delta_kind: 'visual_deliverable_delta',
    required_output_kind: 'visual_deliverable_delta',
    owner: 'redcube_ai',
    next_required_owner_action: safeText(run?.status) === 'completed'
      ? 'pick_up_artifacts'
      : 'continue_autonomous_run',
    refs: safeArray(progressDelta?.deliverable_progress_delta?.refs).filter((ref) => safeText(ref)),
    route_run_ref: run?.run_id ? `route-run:${run.run_id}` : null,
    writes_visual_truth: false,
    writes_review_export_verdict: false,
    writes_canonical_artifact_blob: false,
  };
}

function buildOperatorTypedBlockerNextForcedDelta({ blocker, run }) {
  return {
    surface_kind: 'next_forced_delta',
    domain_alias: 'operator_typed_blocker_delta',
    delta_kind: 'operator_typed_blocker',
    required_output_kind: 'typed_blocker_resolution',
    owner: 'redcube_ai',
    next_required_owner_action: blockerRecommendedAction(blocker),
    refs: [
      safeText(blocker?.blocker_ref),
      safeText(blocker?.closeout_ref),
      run?.run_id ? `route-run:${run.run_id}` : '',
    ].filter(Boolean),
    typed_blocker_ref: safeText(blocker?.blocker_ref) || null,
    closeout_ref: safeText(blocker?.closeout_ref) || null,
    route_run_ref: run?.run_id ? `route-run:${run.run_id}` : null,
    visual_ready_claimed: false,
    exportable_claimed: false,
    handoffable_claimed: false,
  };
}

function buildProviderLedgerNextForcedDelta({ blocker, providerCurrentness, run }) {
  return {
    surface_kind: 'next_forced_delta',
    domain_alias: 'provider_ledger_closeout_binding_delta',
    delta_kind: 'provider_ledger_closeout_binding',
    required_output_kind: 'provider_attempt_ledger_binding',
    owner: 'one-person-lab',
    next_required_owner_action: 'resolve_provider_attempt_ledger',
    refs: [
      safeText(providerCurrentness?.provider_attempt_ref),
      safeText(providerCurrentness?.provider_attempt_ledger_ref),
      safeText(providerCurrentness?.local_session_ref),
      safeText(providerCurrentness?.local_route_run_ref),
      safeText(blocker?.blocker_ref),
      run?.run_id ? `route-run:${run.run_id}` : '',
    ].filter(Boolean),
    local_session_ref: providerCurrentness?.local_session_ref || null,
    local_route_run_ref: providerCurrentness?.local_route_run_ref || (run?.run_id ? `route-run:${run.run_id}` : null),
    provider_attempt_ref: providerCurrentness?.provider_attempt_ref || null,
    provider_attempt_ledger_ref: providerCurrentness?.provider_attempt_ledger_ref || null,
    typed_blocker_ref: blocker?.blocker_ref || null,
    visual_ready_claimed: false,
    exportable_claimed: false,
    handoffable_claimed: false,
  };
}

function buildCloseoutFirstBlocker({ run }) {
  const closeout = run?.closeout || {};
  const blockerKind = safeText(closeout.blocker_kind, 'route_closeout_unconsumed');
  const closeoutRef = safeText(closeout.closeout_ref || closeout.closeoutRef, `route-run:${run.run_id}`);
  const nextRequiredOwnerAction = safeText(
    closeout.next_required_owner_action || run?.error?.recommended_action,
    'consume_route_closeout_before_new_plan',
  );
  return {
    ok: false,
    surface_kind: 'typed_blocker',
    return_shape: 'typed_blocker',
    blocker_ref: `rca-typed-blocker:${slugBlockerKind(blockerKind)}:${closeoutRef}`,
    blocker_kind: blockerKind,
    owner: 'redcube_ai',
    source_contract: 'rca.product_entry_session_currentness.v1',
    next_required_owner_action: nextRequiredOwnerAction,
    route_run_ref: `route-run:${run.run_id}`,
    closeout_ref: closeoutRef,
    latest_run_id: safeText(run.run_id) || null,
    route: safeText(run.route) || null,
    topic_id: safeText(run.topic_id) || null,
    deliverable_id: safeText(run.deliverable_id || run.target) || null,
    visual_ready_claimed: false,
    exportable_claimed: false,
    handoffable_claimed: false,
    writes_visual_truth: false,
    writes_review_export_verdict: false,
    writes_canonical_artifact_blob: false,
  };
}

function providerAttemptIndexSource(run) {
  if (isPlainObject(run?.cross_provider_attempt_index)) return run.cross_provider_attempt_index;
  if (isPlainObject(run?.provider_attempt_index)) return run.provider_attempt_index;
  if (isPlainObject(run?.opl_provider_attempt_index)) return run.opl_provider_attempt_index;
  return {};
}

function buildProviderCurrentness({ run, session }) {
  const index = providerAttemptIndexSource(run);
  const localSessionRef = safeText(
    index.local_session_ref || index.product_entry_session_ref,
    `product-entry-session:${session.entry_session_id}`,
  );
  const localRouteRunRef = safeText(index.local_route_run_ref || index.route_run_ref, `route-run:${run.run_id}`);
  const providerAttemptRef = safeText(
    index.provider_attempt_ref
      || index.opl_provider_attempt_ref
      || run.provider_attempt_ref
      || run.opl_provider_attempt_ref,
  );
  const providerAttemptLedgerRef = safeText(
    index.provider_attempt_ledger_ref
      || index.opl_provider_attempt_ledger_ref
      || run.provider_attempt_ledger_ref
      || run.opl_provider_attempt_ledger_ref,
  );
  const providerAttemptRefIsValid = Boolean(
    providerAttemptRef
      && providerAttemptRef !== localSessionRef
      && !providerAttemptRef.startsWith('product-entry-session:'),
  );
  const providerAttemptLedgerRefIsValid = Boolean(
    providerAttemptLedgerRef
      && providerAttemptLedgerRef !== localSessionRef
      && providerAttemptLedgerRef !== providerAttemptRef
      && !providerAttemptLedgerRef.startsWith('product-entry-session:'),
  );
  const canClaimCurrent = providerAttemptRefIsValid && providerAttemptLedgerRefIsValid;
  return {
    surface_kind: 'cross_provider_attempt_currentness',
    version: 'cross-provider-attempt-currentness.v1',
    owner: 'redcube_ai',
    provider_attempt_owner: safeText(index.provider_attempt_owner, 'one-person-lab'),
    local_session_ref: localSessionRef,
    local_route_run_ref: localRouteRunRef,
    provider_attempt_ref: providerAttemptRefIsValid ? providerAttemptRef : null,
    provider_attempt_ledger_ref: providerAttemptLedgerRefIsValid ? providerAttemptLedgerRef : null,
    rejected_provider_attempt_ref: providerAttemptRef && !providerAttemptRefIsValid
      ? providerAttemptRef
      : null,
    rejected_provider_attempt_ledger_ref: providerAttemptLedgerRef && !providerAttemptLedgerRefIsValid
      ? providerAttemptLedgerRef
      : null,
    currentness_status: canClaimCurrent
      ? 'current_with_provider_attempt_ledger'
      : 'blocked_missing_provider_attempt_ledger',
    can_claim_current: canClaimCurrent,
    provider_attempt_ref_required: true,
    provider_attempt_ledger_ref_required: true,
    provider_attempt_ref_is_valid: providerAttemptRefIsValid,
    provider_attempt_ledger_ref_is_valid: providerAttemptLedgerRefIsValid,
    local_session_ref_is_not_provider_attempt_ref: !providerAttemptRef || providerAttemptRef !== localSessionRef,
    rca_does_not_own_provider_attempt_ledger: true,
    missing_provider_ledger_policy: 'fail_closed_typed_blocker_projection',
  };
}

function buildProviderAttemptLedgerBlocker({ run, providerCurrentness }) {
  const routeRunRef = providerCurrentness.local_route_run_ref || `route-run:${run.run_id}`;
  return {
    ok: false,
    surface_kind: 'typed_blocker',
    return_shape: 'typed_blocker',
    blocker_ref: `rca-typed-blocker:missing-provider-attempt-ledger:${routeRunRef}`,
    blocker_kind: 'missing_provider_attempt_ledger',
    owner: 'redcube_ai',
    source_contract: 'rca.product_entry_session_currentness.v1',
    next_required_owner_action: 'resolve_provider_attempt_ledger',
    recommended_action: 'resolve_provider_attempt_ledger',
    local_session_ref: providerCurrentness.local_session_ref,
    local_route_run_ref: routeRunRef,
    provider_attempt_ref: providerCurrentness.provider_attempt_ref || null,
    provider_attempt_ledger_ref: providerCurrentness.provider_attempt_ledger_ref || null,
    rejected_provider_attempt_ref: providerCurrentness.rejected_provider_attempt_ref || null,
    rejected_provider_attempt_ledger_ref: providerCurrentness.rejected_provider_attempt_ledger_ref || null,
    latest_run_id: safeText(run.run_id) || null,
    route: safeText(run.route) || null,
    topic_id: safeText(run.topic_id) || null,
    deliverable_id: safeText(run.deliverable_id || run.target) || null,
    next_forced_delta: buildProviderLedgerNextForcedDelta({
      blocker: {
        blocker_ref: `rca-typed-blocker:missing-provider-attempt-ledger:${routeRunRef}`,
      },
      providerCurrentness,
      run,
    }),
    visual_ready_claimed: false,
    exportable_claimed: false,
    handoffable_claimed: false,
    writes_visual_truth: false,
    writes_review_export_verdict: false,
    writes_canonical_artifact_blob: false,
  };
}

function buildRuntimeCurrentnessProjection({
  run,
  currentnessBlocker,
  providerCurrentness,
}) {
  return {
    surface_kind: 'cross_provider_attempt_currentness_projection',
    refs: {
      route_run_ref: `route-run:${run.run_id}`,
      run_file: run.__run_file || null,
      closeout_ref: currentnessBlocker?.closeout_ref || null,
      typed_blocker_ref: currentnessBlocker?.blocker_ref || null,
      local_session_ref: providerCurrentness.local_session_ref,
      local_route_run_ref: providerCurrentness.local_route_run_ref,
      provider_attempt_ref: providerCurrentness.provider_attempt_ref,
      provider_attempt_ledger_ref: providerCurrentness.provider_attempt_ledger_ref,
    },
    provider_currentness: providerCurrentness,
  };
}

function routeRunContentStatus(run, blocker) {
  if (!blocker) return safeText(run.status, 'unknown');
  if (safeText(blocker.blocker_kind) === 'missing_provider_attempt_ledger') {
    return 'blocked_missing_provider_attempt_ledger';
  }
  return 'blocked_pending_closeout';
}

function routeRunProgressProjection({ run, closeoutFirstBlocker }) {
  const contentStatus = routeRunContentStatus(run, closeoutFirstBlocker);
  return {
    projection_kind: 'route_run_progress_projection',
    content_status: contentStatus,
    current_stage: safeText(run.current_stage || run.route) || null,
    terminal_stage: safeText(run.route) || null,
    planned_stage_count: 0,
    needs_user_decision: Boolean(closeoutFirstBlocker),
    completed_stages: safeText(run.status) === 'completed' ? [safeText(run.current_stage || run.route)] : [],
    remaining_stages: [],
    final_artifact_refs: safeArray(run.artifact_refs),
    route_run_ref: `route-run:${run.run_id}`,
    closeout_ref: closeoutFirstBlocker?.closeout_ref || null,
    typed_blocker_ref: closeoutFirstBlocker?.blocker_ref || null,
    next_forced_delta: closeoutFirstBlocker?.next_forced_delta || null,
  };
}

function deltaCount(value, defaultCount = 0) {
  if (Number.isFinite(Number(value)) && !isPlainObject(value)) {
    return Math.max(0, Number(value));
  }
  if (!isPlainObject(value)) {
    return Math.max(0, defaultCount);
  }
  const explicitCount = Number(value.count ?? value.delta_count);
  if (Number.isFinite(explicitCount) && explicitCount >= 0) {
    return explicitCount;
  }
  if (value.has_deliverable_delta === true || value.has_delta === true) {
    return 1;
  }
  const refs = safeArray(value.refs).filter((ref) => safeText(ref));
  return refs.length || Math.max(0, defaultCount);
}

function deltaRefs(value, fallbackRefs = []) {
  if (isPlainObject(value)) {
    return safeArray(value.refs).filter((ref) => safeText(ref));
  }
  return fallbackRefs.filter((ref) => safeText(ref));
}

function deltaPayload(value, {
  defaultCount = 0,
  fallbackRefs = [],
  domainAlias,
}) {
  const refs = deltaRefs(value, fallbackRefs);
  return {
    count: deltaCount(value, defaultCount),
    refs,
    domain_alias: isPlainObject(value) && safeText(value.domain_alias)
      ? safeText(value.domain_alias)
      : domainAlias,
  };
}

function classifyProgressDelta(run) {
  const delta = run?.progress_delta || {};
  const deliverableProgressDelta = deltaPayload(delta.deliverable_progress_delta, {
    defaultCount: safeText(run.status) === 'completed' ? 1 : 0,
    fallbackRefs: safeArray(run.artifact_refs),
    domainAlias: 'visual_deliverable_delta',
  });
  const platformRepairDelta = deltaPayload(delta.platform_repair_delta, {
    defaultCount: safeText(run.error?.failure_kind || run.error_kind) ? 1 : 0,
    fallbackRefs: [
      safeText(run.error?.failure_kind || run.error_kind),
      safeText(run.closeout?.closeout_ref || run.route_closeout?.closeout_ref),
    ].filter(Boolean),
    domainAlias: 'platform_interface_repair_delta',
  });
  const explicitClassification = safeText(delta.progress_delta_classification);
  const classification = explicitClassification === 'human_gate' || explicitClassification === 'stop_loss'
    ? explicitClassification
    : (deliverableProgressDelta.count > 0 && platformRepairDelta.count > 0
      ? 'mixed'
      : (deliverableProgressDelta.count > 0
        ? 'deliverable_progress'
        : (platformRepairDelta.count > 0 ? 'platform_repair' : 'typed_blocker')));
  return {
    deliverable_progress_delta: deliverableProgressDelta,
    platform_repair_delta: platformRepairDelta,
    progress_delta_classification: classification,
  };
}

function attachNextForcedDelta({
  run,
  progressDelta,
  currentnessBlocker,
  providerCurrentness,
}) {
  const nextForcedDelta = safeText(currentnessBlocker?.blocker_kind) === 'missing_provider_attempt_ledger'
    ? buildProviderLedgerNextForcedDelta({
      blocker: currentnessBlocker,
      providerCurrentness,
      run,
    })
    : (currentnessBlocker
      ? buildOperatorTypedBlockerNextForcedDelta({
        blocker: currentnessBlocker,
        run,
      })
      : buildVisualDeliverableNextForcedDelta({
        run,
        progressDelta,
      }));
  if (currentnessBlocker && !currentnessBlocker.next_forced_delta) {
    currentnessBlocker.next_forced_delta = nextForcedDelta;
  }
  return {
    ...progressDelta,
    next_forced_delta: nextForcedDelta,
  };
}

export function buildContinuationSnapshotFromSessionRecord(session) {
  return {
    latest_stage_execution_plan_ref: session.latest_stage_execution_plan_ref || null,
    stage_execution_plan: session.stage_execution_plan || null,
    runtime_progress_projection: session.runtime_progress_projection || null,
    runtime_projection: session.runtime_projection || null,
    latest_surface_kind: session.latest_surface_kind || null,
    closeout_first_blocker: session.closeout_first_blocker || null,
    progress_delta: session.progress_delta || null,
    stall_lineage: session.stall_lineage || null,
  };
}

export function resolveProductEntryCurrentness({ session, persist = true }) {
  const latestRun = latestDeliverableRun({
    workspaceRoot: session.workspace_root,
    topicId: session.topic_id,
    deliverableId: session.deliverable_id,
    deliverableFamily: session.deliverable_family,
  });

  if (!runIsNewerThanSession(latestRun, session)) {
    return {
      session,
      latestRun: null,
      closeoutFirstBlocker: null,
      updated: false,
    };
  }

  const closeoutFirstBlocker = closeoutConsumed(latestRun)
    ? null
    : buildCloseoutFirstBlocker({ run: latestRun });
  const providerCurrentness = buildProviderCurrentness({
    run: latestRun,
    session,
  });
  const providerAttemptLedgerBlocker = closeoutFirstBlocker || providerCurrentness.can_claim_current
    ? null
    : buildProviderAttemptLedgerBlocker({
      run: latestRun,
      providerCurrentness,
    });
  const currentnessBlocker = closeoutFirstBlocker || providerAttemptLedgerBlocker;
  const progressDelta = attachNextForcedDelta({
    run: latestRun,
    progressDelta: classifyProgressDelta(latestRun),
    currentnessBlocker,
    providerCurrentness,
  });
  const nextSession = {
    ...session,
    latest_run_id: latestRun.run_id || null,
    latest_stage_execution_plan_ref: currentnessBlocker ? null : (session.latest_stage_execution_plan_ref || null),
    stage_execution_plan: currentnessBlocker ? null : (session.stage_execution_plan || null),
    runtime_progress_projection: routeRunProgressProjection({
      run: latestRun,
      closeoutFirstBlocker: currentnessBlocker,
    }),
    runtime_projection: buildRuntimeCurrentnessProjection({
      run: latestRun,
      currentnessBlocker,
      providerCurrentness,
    }),
    latest_surface_kind: currentnessBlocker ? 'typed_blocker' : 'route_run',
    closeout_first_blocker: currentnessBlocker,
    progress_delta: progressDelta,
    stall_lineage: latestRun.stall_lineage || null,
    updated_at: new Date().toISOString(),
  };
  if (persist) {
    writeJson(productEntrySessionFile(nextSession.entry_session_id), nextSession);
  }
  return {
    session: nextSession,
    latestRun,
    closeoutFirstBlocker: currentnessBlocker,
    updated: true,
  };
}

export function buildCloseoutBlockedDomainEntrySurface({
  taskIntent,
  entryMode,
  runtimeOwner,
  workspaceRoot,
  deliveryIdentity,
  closeoutFirstBlocker,
}) {
  return {
    ok: false,
    surface_kind: 'domain_entry',
    recommended_action: blockerRecommendedAction(closeoutFirstBlocker),
    entry_contract_id: 'redcube_service_safe_domain_entry',
    target_domain_id: 'redcube_ai',
    task_intent: taskIntent,
    entry_mode: entryMode,
    runtime_session_contract: {
      runtime_owner: runtimeOwner,
      expected_runtime_owner: runtimeOwner,
      adapter_surface: '@redcube/codex-cli-client',
      session_mode: 'entry_session',
    },
    return_surface_contract: {
      requested_surface_kind: 'typed_blocker',
      expected_surface_kind: 'typed_blocker',
      actual_surface_kind: 'typed_blocker',
      durable_truth_surfaces: [
        'runtimeWatch',
        'getReviewState',
        'getPublicationProjection',
        'auditDeliverable',
      ],
    },
    domain_payload: {
      deliverable_family: deliveryIdentity.deliverableFamily,
      topic_id: deliveryIdentity.topicId,
      deliverable_id: deliveryIdentity.deliverableId,
      route: null,
    },
    workspace_locator: {
      workspace_root: workspaceRoot,
    },
    result_surface: closeoutFirstBlocker,
    summary: {
      task_intent: taskIntent,
      actual_surface_kind: 'typed_blocker',
      target_handle: closeoutFirstBlocker.latest_run_id || null,
    },
  };
}
