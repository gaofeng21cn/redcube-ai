// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { mkdtempSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { getProductEntryManifest } from './gateway-test-api.ts';
import { completeSourceReadiness } from './helpers/complete-source-readiness.ts';
import {
  startMockCodexCli,
  withEnv,
} from './mock-codex-cli.ts';

const MOCK_REDCUBE_PYTHON_COMMAND = JSON.stringify([
  process.execPath,
  '--experimental-strip-types',
  fileURLToPath(new URL('./helpers/mock-redcube-python-with-playwright.ts', import.meta.url)),
]);

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

function resolveJsonPointer(root, pointer) {
  assert.match(pointer, /^\//);
  return pointer
    .slice(1)
    .split('/')
    .reduce((current, token) => {
      assert.notEqual(current, undefined, `missing pointer segment ${token} in ${pointer}`);
      return current[token.replace(/~1/g, '/').replace(/~0/g, '~')];
    }, root);
}

function collectIndexInputRefs(registration) {
  const refs = [
    ...Object.values(registration.state_index_inputs),
    ...registration.consumable_projection_refs,
    ...registration.native_helper_index_consumption.input_refs,
  ];
  for (const surface of registration.indexable_surfaces) {
    if (surface.ref) {
      refs.push(surface.ref);
    }
    if (Array.isArray(surface.refs)) {
      refs.push(...surface.refs);
    }
  }
  return [...new Set(refs)];
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
    assert.equal(registration.state_index_inputs.runtime_health_snapshot_index, '/runtime_inventory');
    assert.deepEqual(
      registration.indexable_surfaces.map((surface) => surface.surface_id),
      [
        'product_entry_registration',
        'internal_opl_bridge',
        'session_continuity',
        'artifact_inventory',
        'runtime_health',
        'review_publication_projection_refs',
        'opl_family_lifecycle_adapter',
      ],
    );
    assert.deepEqual(
      registration.consumable_projection_refs.slice(-3),
      ['/review_state', '/publication_projection', '/opl_family_lifecycle_adapter'],
    );
    assert.equal(
      registration.review_publication_truth.route_rule,
      'must_use_redcube_product_entry_and_review_export_gates',
    );
    assert.equal(registration.native_helper_index_consumption.consumption_mode, 'index_only');
    assert.equal(registration.native_helper_index_consumption.writes_visual_truth, false);
    assert.equal(registration.native_helper_index_consumption.owns_canonical_artifacts, false);
    assert.equal(registration.native_helper_index_consumption.owns_executor, false);
    assert.deepEqual(registration.authority_boundary, {
      owns_visual_truth: false,
      owns_canonical_artifacts: false,
      owns_review_truth: false,
      owns_publication_projection: false,
      owns_concrete_executor: false,
      allowed_authority: [
        'read_product_entry_registration_index',
        'read_internal_opl_bridge_index',
        'read_session_continuity_index',
        'read_artifact_inventory_index',
        'read_runtime_health_index',
        'read_review_publication_projection_refs',
      ],
    });
    assert.equal(
      registration.route_equivalence.downstream_domain_entry_ref,
      '/route_equivalence/downstream_runtime_truth',
    );
    assert.equal(
      resolveJsonPointer(manifest, registration.route_equivalence.downstream_domain_entry_ref),
      manifest.route_equivalence.downstream_runtime_truth,
    );
    assert.equal(
      manifest.route_equivalence.equivalent_routes.find((route) => route.route_id === 'product_invoke').surface_kind,
      'product_entry',
    );
    assert.equal(
      manifest.route_equivalence.equivalent_routes.find((route) => route.route_id === 'internal_opl_bridge').surface_kind,
      'federated_product_entry',
    );
    assert.equal(
      manifest.route_equivalence.downstream_runtime_truth.entry_surface_kind,
      'domain_entry',
    );
    for (const ref of collectIndexInputRefs(registration)) {
      assert.notEqual(resolveJsonPointer(manifest, ref), undefined, `${ref} should resolve`);
    }
  });
});
