import { invokeProductEntry } from './invoke-product-entry.js';

const FEDERATED_PRODUCT_ENTRY_ID = 'opl_gateway_federated_product_entry';

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
  if (entryMode !== 'opl_gateway') {
    throw new Error(`entry_mode 必须为 opl_gateway，当前收到 ${entryMode}`);
  }
  return entryMode;
}

function normalizeRuntimeSessionContract(request) {
  const contract = request?.runtime_session_contract || request?.runtimeSessionContract || {};
  const runtimeOwner = requireField(
    'runtime_session_contract.runtime_owner',
    contract?.runtime_owner || contract?.runtimeOwner,
  );
  if (runtimeOwner !== 'codex_cli') {
    throw new Error(`runtime_session_contract.runtime_owner 必须为 codex_cli，当前收到 ${runtimeOwner}`);
  }
  return {
    runtime_owner: runtimeOwner,
  };
}

function normalizeReturnSurfaceContract(request) {
  const contract = request?.return_surface_contract || request?.returnSurfaceContract || {};
  const surfaceKind = requireField(
    'return_surface_contract.surface_kind',
    contract?.surface_kind || contract?.surfaceKind,
  );
  if (surfaceKind !== 'product_entry') {
    throw new Error(`return_surface_contract.surface_kind 必须为 product_entry，当前收到 ${surfaceKind}`);
  }
  return {
    requested_surface_kind: surfaceKind,
    actual_surface_kind: 'product_entry',
  };
}

export async function invokeFederatedProductEntry(request) {
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
    surface_kind: 'federated_product_entry',
    recommended_action: productEntrySurface.recommended_action || null,
    federated_product_entry_contract_id: FEDERATED_PRODUCT_ENTRY_ID,
    target_domain_id: targetDomainId,
    entry_mode: entryMode,
    runtime_session_contract: runtimeSessionContract,
    return_surface_contract: returnSurfaceContract,
    product_entry_surface: productEntrySurface,
    summary: {
      entry_session_id: productEntrySurface.summary?.entry_session_id || null,
      actual_surface_kind: productEntrySurface.surface_kind,
      target_handle: productEntrySurface.summary?.target_handle || null,
    },
  };
}
