import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { mkdtempSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { getProductEntryManifest } from '../packages/redcube-gateway/src/index.js';
import { completeSourceReadiness } from './helpers/complete-source-readiness.js';
import {
  startMockCodexCli,
  withEnv,
} from './helpers/mock-codex-cli.js';

const MOCK_REDCUBE_PYTHON_COMMAND = fileURLToPath(
  new URL('./helpers/mock-redcube-python-with-playwright.mjs', import.meta.url),
);

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

test('product-entry manifest exposes OPL Runtime Manager registration projection', async () => {
  await withMockRuntime(async () => {
    const manifest = await getProductEntryManifest({
      workspace_root: await prepareWorkspace(),
    });
    const registration = manifest.skill_catalog.skills[0].domain_projection.opl_runtime_manager_registration;

    assert.equal(registration.surface_kind, 'opl_runtime_manager_domain_registration');
    assert.equal(registration.registration_id, 'rca.opl_runtime_manager.registration.v1');
    assert.equal(registration.domain_id, 'redcube');
    assert.equal(registration.domain_owner, 'redcube_ai');
    assert.equal(registration.registration_surface.command, 'redcube product manifest');
    assert.equal(registration.federated_handoff_surface.command, 'redcube product federate');
    assert.equal(registration.state_index_inputs.artifact_projection_index, '/artifact_inventory');
    assert.deepEqual(
      registration.consumable_projection_refs.slice(-2),
      ['/review_state', '/publication_projection'],
    );
    assert.equal(
      registration.review_publication_truth.route_rule,
      'must_use_redcube_product_entry_and_review_export_gates',
    );
  });
});
