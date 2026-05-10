// @ts-nocheck
import { readFileSync } from 'node:fs';

import { getProductEntryManifest } from './get-product-entry-manifest.js';
import { getProductEntrySession } from './get-product-entry-session.js';
import { invokeProductEntry } from './invoke-product-entry.js';
import { runtimeWatch } from './runtime-watch.js';
import { superviseManagedRun } from './supervise-managed-run.js';

const SIDECAR_ID = 'redcube_product_sidecar_adapter.v1';
const DOMAIN_ID = 'redcube_ai';
const OPL_RUNTIME_OWNER = 'opl_managed_hermes';
const HERMES_SUBSTRATE = 'external_hermes_agent';

const GUARDED_ACTIONS = new Set([
  'runtime_watch',
  'supervise_managed_run',
  'product_entry_continuation',
  'notification_receipt',
]);

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

function normalizeWorkspaceRoot(request) {
  return requireField(
    'workspace_root',
    request?.workspace_root || request?.workspaceRoot,
  );
}

function readTaskPayload(request) {
  const payload = request?.task && typeof request.task === 'object'
    ? request.task
    : null;
  if (payload) {
    return payload;
  }

  const taskFile = requireField('task', request?.task_file || request?.taskFile);
  return JSON.parse(readFileSync(taskFile, 'utf-8'));
}

function buildOwnerBoundary() {
  return {
    hermes_role: 'online_runtime_substrate_wakeup_only',
    opl_role: 'typed_family_queue_and_control_plane',
    rca_role: 'visual_domain_truth_review_artifact_owner',
    hermes_owns_visual_truth: false,
    opl_owns_visual_truth: false,
    hermes_owns_review_verdict: false,
    opl_owns_review_verdict: false,
    hermes_owns_publication_gate: false,
    opl_owns_publication_gate: false,
    rca_owns_visual_truth: true,
    rca_owns_review_publication_projection: true,
    rca_owns_artifacts: true,
  };
}

function buildGuardedActionCatalog() {
  return [
    {
      action: 'runtime_watch',
      effect: 'read_only',
      summary: 'Read RCA runtimeWatch for an existing run locator.',
      required_fields: ['workspace_root', 'topic_id', 'deliverable_id', 'run_id'],
      gateway_action: 'runtimeWatch',
    },
    {
      action: 'supervise_managed_run',
      effect: 'guarded_runtime_tick',
      summary: 'Run one RCA-owned superviseManagedRun tick for an existing managed run.',
      required_fields: ['workspace_root', 'managed_run_id'],
      gateway_action: 'superviseManagedRun',
    },
    {
      action: 'product_entry_continuation',
      effect: 'guarded_product_entry_continuation',
      summary: 'Continue the same RCA product-entry session through RCA-owned gates.',
      required_fields: ['workspace_root', 'entry_session_id'],
      gateway_action: 'invokeProductEntry',
    },
    {
      action: 'notification_receipt',
      effect: 'control_plane_ack_only',
      summary: 'Acknowledge an OPL/Hermes notification without writing RCA visual truth, review verdict, or publication gate.',
      required_fields: ['notification_id'],
      gateway_action: 'none',
    },
  ];
}

function buildSidecarProjection({ workspaceRoot, manifest }) {
  const sessionSurface = manifest.product_entry_shell?.session || {};
  return {
    ok: true,
    surface_kind: 'product_sidecar_export',
    adapter_id: SIDECAR_ID,
    version: 'v1',
    domain_id: DOMAIN_ID,
    workspace_locator: {
      workspace_root: workspaceRoot,
    },
    runtime_substrate: {
      substrate_owner: HERMES_SUBSTRATE,
      managed_by: 'opl_runtime_manager',
      queue_owner: 'opl',
      online_wakeup_owner: HERMES_SUBSTRATE,
      default_executor_policy: {
        selected_by: 'codex_or_domain_selected_executor',
        domain_default_executor_owner: manifest.managed_runtime_contract?.executor_owner || 'codex_cli',
        executor_truth_owner: DOMAIN_ID,
      },
    },
    owner_boundary: buildOwnerBoundary(),
    mapped_surfaces: {
      product_entry_session: {
        command: sessionSurface.command || 'redcube product session',
        command_template: sessionSurface.command_template || 'redcube product session --entry-session-id <entry-session-id>',
        ref: '/product_entry_shell/session',
        owner: DOMAIN_ID,
      },
      runtime_watch: {
        command: 'redcube review watch',
        gateway_action: 'runtimeWatch',
        owner: DOMAIN_ID,
      },
      supervise_managed_run: {
        command: 'redcube managed supervise',
        gateway_action: 'superviseManagedRun',
        owner: DOMAIN_ID,
      },
      review_projection: {
        review_state_ref: '/review_state',
        publication_projection_ref: '/publication_projection',
        operator_handoff_ref: '/operator_handoff',
        owner: DOMAIN_ID,
        writable_by_sidecar: false,
      },
      operator_handoff: {
        source_refs: [
          '/product_entry_session',
          '/runtime_loop_closure',
          '/review_state',
          '/publication_projection',
        ],
        owner: DOMAIN_ID,
        writable_by_sidecar: false,
      },
    },
    guarded_actions: buildGuardedActionCatalog(),
    blocked_actions: [
      'write_visual_truth',
      'write_canonical_artifacts',
      'write_review_verdict',
      'write_publication_gate',
      'mutate_review_state',
      'publish_export_bundle',
    ],
    source_manifest_refs: {
      manifest_kind: manifest.manifest_kind,
      manifest_version: manifest.manifest_version,
      product_entry_manifest_ref: '/product_entry_manifest',
      opl_family_lifecycle_adapter_ref: '/opl_family_lifecycle_adapter',
      family_action_catalog_ref: '/family_action_catalog',
    },
    summary: {
      online_substrate: HERMES_SUBSTRATE,
      control_plane_owner: 'opl',
      domain_truth_owner: DOMAIN_ID,
      guarded_action_count: GUARDED_ACTIONS.size,
    },
  };
}

export async function exportProductSidecar(request) {
  const workspaceRoot = normalizeWorkspaceRoot(request);
  const manifest = await getProductEntryManifest({ workspace_root: workspaceRoot });
  return buildSidecarProjection({ workspaceRoot, manifest });
}

function normalizeAction(task) {
  return safeText(task?.action || task?.action_id || task?.task_intent || task?.kind);
}

function workspaceRootFromTask(task) {
  return requireField(
    'workspace_root',
    task?.workspace_root
      || task?.workspaceRoot
      || task?.workspace_locator?.workspace_root
      || task?.workspaceLocator?.workspaceRoot,
  );
}

function normalizeDeliveryRequest(task) {
  const delivery = task?.delivery_request || task?.deliveryRequest || {};
  return {
    deliverable_family: safeText(delivery.deliverable_family || delivery.deliverableFamily || delivery.overlay),
    topic_id: safeText(delivery.topic_id || delivery.topicId || task.topic_id || task.topicId),
    deliverable_id: safeText(delivery.deliverable_id || delivery.deliverableId || task.deliverable_id || task.deliverableId),
    profile_id: safeText(delivery.profile_id || delivery.profileId),
    title: safeText(delivery.title),
    goal: safeText(delivery.goal),
    route: safeText(delivery.route),
    adapter: safeText(delivery.adapter),
    user_intent: safeText(delivery.user_intent || delivery.userIntent || task.user_intent || task.userIntent),
    lifecycle_policy: safeText(delivery.lifecycle_policy || delivery.lifecyclePolicy),
    stop_after_stage: safeText(delivery.stop_after_stage || delivery.stopAfterStage),
    mode: safeText(delivery.mode, 'draft_new'),
    baseline_deliverable_id: safeText(delivery.baseline_deliverable_id || delivery.baselineDeliverableId),
  };
}

function buildDispatchEnvelope({ task, result, action }) {
  return {
    ok: true,
    surface_kind: 'product_sidecar_dispatch',
    adapter_id: SIDECAR_ID,
    version: 'v1',
    domain_id: DOMAIN_ID,
    action,
    sidecar_policy: {
      allowed: true,
      writes_visual_truth: false,
      writes_review_verdict: false,
      writes_publication_gate: false,
      writes_canonical_artifacts: false,
    },
    owner_boundary: buildOwnerBoundary(),
    task_id: task.task_id || task.id || null,
    result_surface: result,
    summary: {
      action,
      result_surface_kind: result?.surface_kind || null,
      hermes_role: 'wakeup_substrate_only',
      opl_role: 'typed_family_control_plane',
      rca_role: 'domain_truth_owner',
    },
  };
}

export async function dispatchProductSidecar(request) {
  const task = readTaskPayload(request);
  const action = normalizeAction(task);
  if (!GUARDED_ACTIONS.has(action)) {
    throw new Error(`product sidecar action 不允许: ${action || '<empty>'}`);
  }

  if (action === 'runtime_watch') {
    const result = await runtimeWatch({
      workspaceRoot: workspaceRootFromTask(task),
      topicId: requireField('topic_id', task.topic_id || task.topicId),
      deliverableId: requireField('deliverable_id', task.deliverable_id || task.deliverableId),
      runId: requireField('run_id', task.run_id || task.runId),
    });
    return buildDispatchEnvelope({ task, result, action });
  }

  if (action === 'supervise_managed_run') {
    const result = await superviseManagedRun({
      workspaceRoot: workspaceRootFromTask(task),
      managedRunId: requireField('managed_run_id', task.managed_run_id || task.managedRunId),
    });
    return buildDispatchEnvelope({ task, result, action });
  }

  if (action === 'product_entry_continuation') {
    const result = await invokeProductEntry({
      workspace_locator: {
        workspace_root: workspaceRootFromTask(task),
      },
      entry_session_contract: {
        entry_session_id: requireField('entry_session_id', task.entry_session_id || task.entrySessionId),
      },
      task_intent: safeText(task.task_intent || task.taskIntent, 'run_managed_deliverable'),
      entry_mode: safeText(task.entry_mode || task.entryMode, 'opl_sidecar'),
      delivery_request: normalizeDeliveryRequest(task),
    });
    return buildDispatchEnvelope({ task, result, action });
  }

  const result = {
    ok: true,
    surface_kind: 'notification_receipt',
    notification_id: requireField('notification_id', task.notification_id || task.notificationId),
    receipt_status: 'accepted',
    writes_domain_truth: false,
    summary: {
      notification_id: task.notification_id || task.notificationId,
      action: 'record_control_plane_receipt_only',
    },
  };
  return buildDispatchEnvelope({ task, result, action });
}
