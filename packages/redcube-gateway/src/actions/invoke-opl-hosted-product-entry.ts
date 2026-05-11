// @ts-nocheck
import {
  buildReturnSurfaceContract,
  buildRuntimeSessionContract,
} from 'opl-framework-shared/product-entry-companions';

import { invokeProductEntry } from './invoke-product-entry.js';

const OPL_HOSTED_PRODUCT_ENTRY_ID = 'opl_framework_hosted_product_entry';
const MANAGED_RUNTIME_OWNER = 'configured_family_runtime_provider';

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

function normalizeTargetDomainId(request) {
  const targetDomainId = requireField('target_domain_id', request?.target_domain_id || request?.targetDomainId);
  if (targetDomainId !== 'redcube_ai' && targetDomainId !== 'redcube-ai') {
    throw new Error(`Unsupported target_domain_id: ${targetDomainId}`);
  }
  return 'redcube_ai';
}

function normalizeEntryMode(request) {
  const entryMode = requireField('entry_mode', request?.entry_mode || request?.entryMode);
  if (entryMode !== 'opl_hosted') {
    throw new Error(`entry_mode 必须为 opl_hosted，当前收到 ${entryMode}`);
  }
  return entryMode;
}

function normalizeRuntimeSessionContract(request) {
  const contract = request?.runtime_session_contract || request?.runtimeSessionContract || {};
  const runtimeOwner = requireField(
    'runtime_session_contract.runtime_owner',
    contract?.runtime_owner || contract?.runtimeOwner,
  );
  if (runtimeOwner !== MANAGED_RUNTIME_OWNER) {
    throw new Error(`runtime_session_contract.runtime_owner 必须为 ${MANAGED_RUNTIME_OWNER}`);
  }
  return buildRuntimeSessionContract({
    runtime_owner: runtimeOwner,
    expected_runtime_owner: MANAGED_RUNTIME_OWNER,
  });
}

function normalizeReturnSurfaceContract(request) {
  const contract = request?.return_surface_contract || request?.returnSurfaceContract || {};
  const requestedSurfaceKind = requireField(
    'return_surface_contract.surface_kind',
    contract?.surface_kind || contract?.surfaceKind,
  );
  if (requestedSurfaceKind !== 'product_entry') {
    throw new Error('return_surface_contract.surface_kind 必须为 product_entry');
  }
  return buildReturnSurfaceContract({
    requested_surface_kind: requestedSurfaceKind,
    expected_surface_kind: 'product_entry',
    actual_surface_kind: 'product_entry',
  });
}

export async function invokeOplHostedProductEntry(request) {
  const targetDomainId = normalizeTargetDomainId(request);
  const entryMode = normalizeEntryMode(request);
  const runtimeSessionContract = normalizeRuntimeSessionContract(request);
  const returnSurfaceContract = normalizeReturnSurfaceContract(request);
  const taskIntent = requireField('task_intent', request?.task_intent || request?.taskIntent);

  const productEntrySurface = await invokeProductEntry({
    workspace_locator: request?.workspace_locator || request?.workspaceLocator,
    entry_session_contract: request?.entry_session_contract || request?.entrySessionContract,
    delivery_request: request?.delivery_request || request?.deliveryRequest,
    task_intent: taskIntent,
    entry_mode: entryMode,
  });

  return {
    ok: productEntrySurface.ok,
    surface_kind: 'opl_hosted_product_entry',
    recommended_action: productEntrySurface.recommended_action || null,
    opl_hosted_product_entry_contract_id: OPL_HOSTED_PRODUCT_ENTRY_ID,
    target_domain_id: targetDomainId,
    entry_mode: entryMode,
    runtime_session_contract: runtimeSessionContract,
    return_surface_contract: returnSurfaceContract,
    family_orchestration: productEntrySurface.family_orchestration,
    entry_session: productEntrySurface.entry_session,
    delivery_identity: productEntrySurface.delivery_identity,
    product_entry_surface: productEntrySurface,
    continuation_snapshot: productEntrySurface.continuation_snapshot,
    session_continuity: productEntrySurface.session_continuity,
    progress_projection: productEntrySurface.progress_projection,
    artifact_inventory: productEntrySurface.artifact_inventory,
    runtime_loop_closure: productEntrySurface.runtime_loop_closure,
    review_state: productEntrySurface.review_state,
    publication_projection: productEntrySurface.publication_projection,
    opl_family_lifecycle_adapter: productEntrySurface.opl_family_lifecycle_adapter,
    summary: {
      entry_session_id: productEntrySurface.summary?.entry_session_id || null,
      actual_surface_kind: productEntrySurface.surface_kind,
      target_handle: productEntrySurface.summary?.target_handle || null,
      latest_handle: productEntrySurface.summary?.latest_handle || productEntrySurface.summary?.target_handle || null,
      approval_required: productEntrySurface.summary?.approval_required
        ?? Boolean(productEntrySurface.runtime_loop_closure?.control_policy?.approval_required),
      gate_status: productEntrySurface.summary?.gate_status
        || productEntrySurface.runtime_loop_closure?.control_policy?.gate_status
        || null,
      resume_command: productEntrySurface.summary?.resume_command
        || productEntrySurface.runtime_loop_closure?.control_policy?.continue_action?.command
        || null,
      session_locator_field: productEntrySurface.summary?.session_locator_field
        || productEntrySurface.family_orchestration?.resume_contract?.session_locator_field
        || null,
      checkpoint_locator_field: productEntrySurface.summary?.checkpoint_locator_field
        || productEntrySurface.family_orchestration?.resume_contract?.checkpoint_locator_field
        || null,
    },
  };
}
