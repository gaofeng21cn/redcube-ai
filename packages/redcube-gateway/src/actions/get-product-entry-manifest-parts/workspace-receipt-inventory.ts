// @ts-nocheck
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';

const DOMAIN_ID = 'redcube_ai';
const PROJECTION_ID = 'rca.workspace_receipt_inventory.v1';
const RECEIPT_ROOT_MODEL = '<workspace-root>/.redcube/runtime/receipts/';
const MAX_EXPORTED_RECEIPTS = 25;
const ARTIFACT_PRODUCING_ROUTE_ID = 'ppt_deck.image_first.artifact_producing.v1';
const ARTIFACT_PRODUCING_STAGE_REFS = Object.freeze([
  'author_image_pages',
  'visual_director_review',
  'screenshot_review',
  'export_pptx',
]);
const FORBIDDEN_PAYLOAD_FIELDS = Object.freeze([
  'visual_truth',
  'visual_verdict',
  'review_verdict',
  'export_verdict',
  'review_export_verdict',
  'publication_gate',
  'canonical_artifact_blob',
  'artifact_blob',
  'memory_content_body',
]);

function safeText(value, fallback = '') {
  const text = String(value || '').trim();
  return text || fallback;
}

function listJsonFiles(root) {
  if (!existsSync(root)) {
    return [];
  }
  const result = [];
  const visit = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const file = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        visit(file);
      } else if (entry.isFile() && entry.name.endsWith('.json')) {
        result.push(file);
      }
    }
  };
  visit(root);
  return result.sort();
}

function findForbiddenPayloadFields(value, found = new Set()) {
  if (!value || typeof value !== 'object') {
    return found;
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      findForbiddenPayloadFields(item, found);
    }
    return found;
  }
  for (const [key, nested] of Object.entries(value)) {
    if (FORBIDDEN_PAYLOAD_FIELDS.includes(key)) {
      found.add(key);
    }
    findForbiddenPayloadFields(nested, found);
  }
  return found;
}

function receiptKind(relativePath, payload) {
  const normalized = relativePath.split(path.sep).join('/');
  if (normalized.startsWith('domain-owner/')) {
    return 'domain_owner';
  }
  if (normalized.startsWith('memory/visual-pattern/')) {
    return 'memory_visual_pattern';
  }
  if (normalized.startsWith('lifecycle/cleanup/')) {
    return 'lifecycle_cleanup';
  }
  if (normalized.startsWith('lifecycle/restore/')) {
    return 'lifecycle_restore';
  }
  if (normalized.startsWith('lifecycle/retention/')) {
    return 'lifecycle_retention';
  }
  return safeText(payload?.surface_kind, 'other');
}

function increment(counts, key) {
  counts[key] = (counts[key] || 0) + 1;
}

function exportedReceiptRef({ file, root, payload }) {
  const relativePath = path.relative(root, file);
  const kind = receiptKind(relativePath, payload);
  const stat = statSync(file);
  return {
    receipt_kind: kind,
    receipt_id: safeText(payload.receipt_id || payload.id),
    receipt_ref: safeText(payload.receipt_ref),
    runtime_locator_ref: safeText(payload.runtime_locator_ref),
    generated_by_action: safeText(payload.generated_by_action),
    operation: safeText(payload.operation),
    writeback_status: safeText(payload.writeback_status),
    return_shape: safeText(payload.return_shape),
    relative_path: relativePath.split(path.sep).join('/'),
    receipt_file_ref: `${RECEIPT_ROOT_MODEL}${relativePath.split(path.sep).join('/')}`,
    sha256: safeText(payload.sha256),
    mtime_ms: stat.mtimeMs,
  };
}

export function buildWorkspaceReceiptInventoryProjection({ workspaceRoot }) {
  const receiptRoot = path.join(workspaceRoot, '.redcube', 'runtime', 'receipts');
  const counts = {
    total: 0,
    domain_owner: 0,
    memory_visual_pattern: 0,
    lifecycle_cleanup: 0,
    lifecycle_restore: 0,
    lifecycle_retention: 0,
    other: 0,
    invalid: 0,
  };
  const receiptRefs = [];
  const invalidReceiptRefs = [];
  const forbiddenPayloadFields = new Set();

  for (const file of listJsonFiles(receiptRoot)) {
    const relativePath = path.relative(receiptRoot, file).split(path.sep).join('/');
    let payload;
    try {
      payload = JSON.parse(readFileSync(file, 'utf-8'));
    } catch {
      counts.invalid += 1;
      invalidReceiptRefs.push({
        relative_path: relativePath,
        receipt_file_ref: `${RECEIPT_ROOT_MODEL}${relativePath}`,
        error_kind: 'invalid_json',
      });
      continue;
    }
    const forbidden = [...findForbiddenPayloadFields(payload)];
    for (const field of forbidden) {
      forbiddenPayloadFields.add(field);
    }
    const item = exportedReceiptRef({ file, root: receiptRoot, payload });
    increment(counts, item.receipt_kind in counts ? item.receipt_kind : 'other');
    counts.total += 1;
    receiptRefs.push(item);
  }

  receiptRefs.sort((left, right) => right.mtime_ms - left.mtime_ms || left.relative_path.localeCompare(right.relative_path));
  const exportedReceiptRefs = receiptRefs.slice(0, MAX_EXPORTED_RECEIPTS).map(({ mtime_ms, ...item }) => item);
  const missingRequiredReceiptKinds = [
    ['accepted_memory', receiptRefs.some((item) => item.receipt_kind === 'memory_visual_pattern' && item.writeback_status === 'accepted')],
    ['rejected_memory', receiptRefs.some((item) => item.receipt_kind === 'memory_visual_pattern' && item.writeback_status === 'rejected')],
    ['lifecycle_cleanup', counts.lifecycle_cleanup > 0],
    ['lifecycle_restore', counts.lifecycle_restore > 0],
    ['lifecycle_retention', counts.lifecycle_retention > 0],
    ['domain_owner', counts.domain_owner > 0],
  ].filter(([, present]) => !present).map(([kind]) => kind);
  const hasRequiredMemoryLifecycleReceipts = missingRequiredReceiptKinds.length === 0;
  const hasInvalidReceiptPayloads = invalidReceiptRefs.length > 0;
  const forbiddenPayloadFieldList = [...forbiddenPayloadFields].sort();
  const hasForbiddenPayloadFields = forbiddenPayloadFieldList.length > 0;
  const hasRefsOnlyRequiredMemoryLifecycleReceipts = (
    hasRequiredMemoryLifecycleReceipts
    && !hasInvalidReceiptPayloads
    && !hasForbiddenPayloadFields
  );
  const status = hasRefsOnlyRequiredMemoryLifecycleReceipts
    ? 'workspace_receipt_instances_visible_refs_only'
    : hasForbiddenPayloadFields
      ? 'blocked_forbidden_receipt_payload_fields'
      : hasInvalidReceiptPayloads
        ? 'blocked_invalid_receipt_payloads'
        : 'awaiting_runtime_receipt_instances';
  const receiptKindScaleoutRefCoverageReady = (
    hasRefsOnlyRequiredMemoryLifecycleReceipts
    && counts.domain_owner >= 2
    && counts.memory_visual_pattern >= 2
    && counts.lifecycle_retention >= 2
  );
  const artifactProducingOwnerReceiptRefs = receiptRefs
    .filter((item) => item.receipt_kind === 'domain_owner' && item.receipt_ref)
    .map((item) => item.receipt_ref);
  const memoryLifecycleReceiptRefs = receiptRefs
    .filter((item) => (
      item.receipt_ref
      && (
        item.receipt_kind === 'memory_visual_pattern'
        || item.receipt_kind === 'lifecycle_cleanup'
        || item.receipt_kind === 'lifecycle_restore'
        || item.receipt_kind === 'lifecycle_retention'
      )
    ))
    .map((item) => item.receipt_ref);
  const observedWorkspaceCount = existsSync(receiptRoot) ? 1 : 0;

  return {
    surface_kind: 'workspace_receipt_inventory_projection',
    projection_id: PROJECTION_ID,
    owner: DOMAIN_ID,
    consumer: 'opl_app_operator',
    status,
    projection_model: 'workspace_runtime_receipt_refs_only_read_model',
    workspace_locator: {
      workspace_root: workspaceRoot,
    },
    receipt_root_model: RECEIPT_ROOT_MODEL,
    receipt_root_exists: existsSync(receiptRoot),
    read_only: true,
    refs_only: true,
    writes_visual_truth: false,
    writes_artifact_blob: false,
    writes_memory_body: false,
    declares_visual_ready: false,
    declares_exportable: false,
    declares_handoffable: false,
    declares_production_soak_complete: false,
    implements_opl_generic_runtime: false,
    implements_opl_artifact_gallery: false,
    implements_opl_workbench: false,
    source_actions: [
      'apply_visual_memory_writeback',
      'apply_visual_workspace_lifecycle',
      'emit_domain_owner_receipt',
      'emit_workspace_receipt_proof',
    ],
    selected_artifact_producing_visual_route: {
      deliverable_family: 'ppt_deck',
      route_id: ARTIFACT_PRODUCING_ROUTE_ID,
      stage_sequence_refs: [...ARTIFACT_PRODUCING_STAGE_REFS],
      produces_artifact_refs: true,
      visual_verdict_owner: DOMAIN_ID,
      artifact_authority_owner: DOMAIN_ID,
      declares_visual_ready: false,
      declares_exportable: false,
      declares_handoffable: false,
    },
    receipt_counts: counts,
    receipt_refs: exportedReceiptRefs,
    receipt_refs_truncated: receiptRefs.length > exportedReceiptRefs.length,
    scaleout_projection: {
      surface_kind: 'workspace_receipt_scaleout_projection',
      status: receiptKindScaleoutRefCoverageReady
        ? 'workspace_receipt_scaleout_ref_model_ready_more_workspaces_pending'
        : status === 'workspace_receipt_instances_visible_refs_only'
          ? 'workspace_receipt_scaleout_receipt_kind_coverage_pending'
          : 'workspace_receipt_scaleout_blocked_by_inventory_gap',
      evidence_model: 'receipt_refs_only_multi_receipt_kind_coverage',
      required_workspace_count_for_scaleout: 2,
      observed_workspace_count: observedWorkspaceCount,
      observed_receipt_count: counts.total,
      workspace_receipt_proof_ref_model: 'rca-workspace-receipt-proof:visual-stage:<proof-id>',
      runtime_locator_ref_model: 'workspace-runtime-ref:receipt-proof:<proof-id>',
      receipt_kind_coverage_ready: receiptKindScaleoutRefCoverageReady,
      workspace_receipt_scaleout_claimed: false,
      declares_production_soak_complete: false,
      writes_visual_truth: false,
      writes_artifact_blob: false,
      writes_memory_body: false,
    },
    actual_workspace_receipt_refs: {
      route_id: ARTIFACT_PRODUCING_ROUTE_ID,
      stage_sequence_refs: [...ARTIFACT_PRODUCING_STAGE_REFS],
      artifact_producing_owner_receipt_refs: artifactProducingOwnerReceiptRefs,
      memory_lifecycle_receipt_refs: memoryLifecycleReceiptRefs,
      required_owner_receipt_visible: artifactProducingOwnerReceiptRefs.length > 0,
      required_memory_lifecycle_receipt_refs_visible: hasRefsOnlyRequiredMemoryLifecycleReceipts,
      no_regression_evidence_ref_model: 'workspace-runtime-ref:no-regression-evidence:<evidence-id>',
      workspace_receipt_proof_ref_model: 'rca-workspace-receipt-proof:visual-stage:<proof-id>',
      refs_visible: artifactProducingOwnerReceiptRefs.length > 0 && hasRefsOnlyRequiredMemoryLifecycleReceipts,
      declares_visual_ready: false,
      declares_exportable: false,
      declares_handoffable: false,
      declares_production_soak_complete: false,
    },
    invalid_receipt_refs: invalidReceiptRefs,
    coverage: {
      accepted_memory_receipt_visible: !missingRequiredReceiptKinds.includes('accepted_memory'),
      rejected_memory_receipt_visible: !missingRequiredReceiptKinds.includes('rejected_memory'),
      cleanup_lifecycle_receipt_visible: counts.lifecycle_cleanup > 0,
      restore_lifecycle_receipt_visible: counts.lifecycle_restore > 0,
      retention_lifecycle_receipt_visible: counts.lifecycle_retention > 0,
      domain_owner_receipt_visible: counts.domain_owner > 0,
      required_memory_lifecycle_receipts_visible: hasRefsOnlyRequiredMemoryLifecycleReceipts,
      required_receipt_kinds_visible: hasRequiredMemoryLifecycleReceipts,
      invalid_receipt_payloads_detected: hasInvalidReceiptPayloads,
      forbidden_payload_fields_detected: forbiddenPayloadFieldList,
      no_forbidden_payload_fields_detected: !hasForbiddenPayloadFields,
      visual_artifact_blob_projected: false,
      review_export_verdict_projected: false,
      memory_content_body_projected: false,
      production_soak_claimed: false,
    },
    gap_projection: {
      gap_id: 'real_memory_lifecycle_receipt_instances',
      status: hasRefsOnlyRequiredMemoryLifecycleReceipts
        ? 'runtime_receipt_instances_visible_not_production_soak'
        : hasForbiddenPayloadFields
          ? 'blocked_forbidden_receipt_payload_fields'
          : hasInvalidReceiptPayloads
            ? 'blocked_invalid_receipt_payloads'
            : 'pending_runtime_receipt_instances',
      current_best_ref: '/workspace_receipt_inventory_projection',
      missing_receipt_kinds: missingRequiredReceiptKinds,
    },
    authority_boundary: {
      rca_owns_receipt_instances: true,
      rca_owns_memory_accept_reject: true,
      rca_owns_domain_owner_receipt: true,
      opl_app_can_index_receipt_refs: true,
      opl_app_can_read_receipt_payload_content: false,
      opl_app_can_write_receipt_instance: false,
      opl_app_can_write_rca_visual_truth: false,
      opl_app_can_store_artifact_blob: false,
      opl_app_can_claim_production_soak_complete: false,
    },
    repository_boundary: {
      repo_tracks_read_model_builder: true,
      repo_tracks_live_receipt_instances: false,
      repo_tracks_visual_truth: false,
      repo_tracks_review_export_verdict: false,
      repo_tracks_canonical_artifact_blob: false,
      receipt_instance_path_model: RECEIPT_ROOT_MODEL,
    },
  };
}
