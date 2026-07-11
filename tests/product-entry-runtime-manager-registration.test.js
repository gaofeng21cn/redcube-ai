import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { mkdtempSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { completeSourceReadiness } from './helpers/complete-source-readiness.js';
import {
  startMockCodexCli,
  withEnv,
} from './mock-codex-cli.js';

const MOCK_REDCUBE_PYTHON_COMMAND = JSON.stringify([
  process.execPath,
  '--experimental-strip-types',
  fileURLToPath(new URL('./helpers/mock-redcube-python-with-playwright.js', import.meta.url)),
]);

async function getProductEntryManifest(request) {
  const module = await import('../packages/redcube-domain-entry/dist/index.js');
  return module.getProductEntryManifest(request);
}

async function withMockRuntime(testFn) {
  const upstream = await startMockCodexCli();
  const runtimeStateRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-runtime-manager-state-'));
  const restoreEnv = withEnv({
    REDCUBE_CODEX_COMMAND: upstream.command,
    REDCUBE_PYTHON_COMMAND: MOCK_REDCUBE_PYTHON_COMMAND,
    REDCUBE_RUNTIME_STATE_ROOT: runtimeStateRoot,
  });

  try {
    return await testFn();
  } finally {
    restoreEnv();
    await upstream.close();
  }
}

async function prepareWorkspace() {
  const workspaceRoot = mkdtempSync(path.join(os.tmpdir(), 'redcube-runtime-manager-'));

  await completeSourceReadiness({
    workspaceRoot,
    topicId: 'topic-a',
    title: 'Runtime Manager registration proof',
    brief: '验证 RCA skill catalog exposes OPL Runtime Manager registration.',
    keywords: ['product-entry', 'runtime-manager'],
  });

  return workspaceRoot;
}

test('product-entry manifest exposes an OPL-owned Runtime Manager registration ref', async () => {
  await withMockRuntime(async () => {
    const manifest = await getProductEntryManifest({
      workspace_root: await prepareWorkspace(),
    });
    const registration = manifest.skill_catalog.skills[0].domain_projection.opl_runtime_manager_registration;

    assert.equal(registration.surface_kind, 'opl_generated_runtime_registration_ref');
    assert.equal(registration.owner, 'one-person-lab');
    assert.equal(registration.domain_id, 'rca');
    assert.equal(registration.registration_ref, 'opl_generated:domain_runtime_registration/rca');
    assert.equal(registration.product_session_ref, 'opl_generated:product_session');
    assert.equal(registration.domain_handler_ref, 'domain-handler:invokeProductEntry');
    assert.equal(registration.artifact_locator_contract_ref, '/artifact_locator_contract');
    assert.equal(registration.owner_receipt_contract_ref, '/domain_owner_receipt_contract');
    assert.equal(registration.review_state_ref, '/review_state');
    assert.equal(registration.publication_projection_ref, '/publication_projection');
    assert.deepEqual(registration.authority_boundary, {
      rca_owns_runtime_registration: false,
      rca_owns_session_persistence: false,
      rca_returns_domain_refs_only: true,
    });
  });
});
