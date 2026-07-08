// @ts-nocheck
import assert from 'node:assert/strict';

export function list(text) {
  return text.trim().split(/\s+/);
}

export function getPath(root, dottedPath) {
  return dottedPath.split('.').reduce((current, key) => current?.[key], root);
}

export function assertPathValues(root, expectedByPath) {
  for (const [dottedPath, expected] of Object.entries(expectedByPath)) {
    assert.deepEqual(getPath(root, dottedPath), expected, dottedPath);
  }
}

export function assertPathMatches(root, expectedByPath) {
  for (const [dottedPath, expected] of Object.entries(expectedByPath)) {
    assert.match(getPath(root, dottedPath), expected, dottedPath);
  }
}

export function assertPaths(root, predicate, dottedPaths) {
  for (const dottedPath of dottedPaths) {
    assert.equal(predicate(getPath(root, dottedPath)), true, dottedPath);
  }
}

export function assertAllFalse(root, dottedPaths) {
  assertPaths(root, (value) => value === false, dottedPaths);
}

export function assertPathIncludes(root, expectedByPath) {
  for (const [dottedPath, expected] of Object.entries(expectedByPath)) {
    assert.equal(getPath(root, dottedPath).includes(expected), true, dottedPath);
  }
}

export function assertIds(items, key, expected) {
  assert.deepEqual(items.map((item) => item[key]), expected);
}

export function assertEvery(items, predicate, message) {
  assert.equal(items.every(predicate), true, message);
}

export async function emitWorkspaceReceiptProofs(dispatchDomainActionAdapter, entries) {
  for (const [workspaceRoot, proofId] of entries) {
    await dispatchDomainActionAdapter({
      task: {
        action: 'emit_workspace_receipt_proof',
        workspace_root: workspaceRoot,
        proof_id: proofId,
        attempt_ref: `workspace-runtime-ref:attempt:${proofId}`,
        artifact_locator_ref: '/artifact_locator_contract',
        review_export_ref: `workspace-runtime-ref:review-export:${proofId}`,
        forbidden_write_proof_ref: '/controlled_memory_apply_proof/forbidden_write_audit',
        artifact_refs: [`workspace-runtime-ref:artifact:${proofId}`],
      },
    });
  }
}
