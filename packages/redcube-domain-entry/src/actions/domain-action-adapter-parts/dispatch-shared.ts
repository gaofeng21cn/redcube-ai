// @ts-nocheck
import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import { buildDomainActionAdapterOwnerBoundary } from './owner-boundary.js';
import {
  DOMAIN_ID,
  DOMAIN_ACTION_ADAPTER_ID,
} from './domain_action_adapter-export-projection.js';
import {
  safeText,
  slugId,
} from './task-utils.js';

export function buildTypedBlocker({
  blockerKind,
  blockerId,
  missing = [],
  sourceContract,
  nextRequiredOwnerAction,
  workspaceRoot = null,
  details = {},
}) {
  return {
    ok: false,
    surface_kind: 'typed_blocker',
    return_shape: 'typed_blocker',
    blocker_ref: `rca-typed-blocker:${blockerKind}:${slugId(blockerId, 'blocker')}`,
    blocker_kind: blockerKind,
    owner: DOMAIN_ID,
    source_contract: sourceContract,
    next_required_owner_action: nextRequiredOwnerAction,
    missing_required_fields: missing,
    workspace_locator: workspaceRoot ? { workspace_root: workspaceRoot } : null,
    visual_ready_claimed: false,
    exportable_claimed: false,
    handoffable_claimed: false,
    writes_visual_truth: false,
    writes_review_export_verdict: false,
    writes_canonical_artifact_blob: false,
    ...details,
  };
}

export function buildDispatchEnvelope({ task, result, action }) {
  return {
    ok: true,
    surface_kind: 'domain_action_adapter_dispatch',
    adapter_id: DOMAIN_ACTION_ADAPTER_ID,
    version: 'v1',
    domain_id: DOMAIN_ID,
    action,
    domain_action_adapter_policy: {
      allowed: true,
      writes_visual_truth: false,
      writes_review_verdict: false,
      writes_publication_gate: false,
      writes_canonical_artifacts: false,
    },
    owner_boundary: buildDomainActionAdapterOwnerBoundary(),
    task_id: task.task_id || task.id || null,
    result_surface: result,
    summary: {
      action,
      result_surface_kind: result?.surface_kind || null,
      provider_role: 'wakeup_transport_only',
      opl_role: 'typed_family_control_plane',
      rca_role: 'domain_truth_owner',
    },
  };
}

export function writeRuntimeJson({ workspaceRoot, parts, fileName, payload }) {
  const dir = path.join(workspaceRoot, '.redcube', 'runtime', ...parts);
  const file = path.join(dir, fileName);
  const digest = createHash('sha256').update(JSON.stringify(payload)).digest('hex');
  const payloadWithDigest = { ...payload, sha256: digest };
  mkdirSync(dir, { recursive: true });
  writeFileSync(file, `${JSON.stringify(payloadWithDigest, null, 2)}\n`, 'utf-8');
  return { file, payload: payloadWithDigest };
}

export function collectRefList(task, snake, camel = null) {
  return optionalArray(task?.[snake] ?? (camel ? task?.[camel] : undefined))
    .map((ref) => safeText(ref))
    .filter(Boolean);
}

function optionalArray(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}
