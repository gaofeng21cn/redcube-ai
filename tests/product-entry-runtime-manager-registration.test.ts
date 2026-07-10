// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import { mkdtempSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

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
    assert.equal(registration.registration_surface.command, 'opl_generated:product_entry_manifest');
    assert.equal(registration.opl_hosted_handoff_surface.action_ref, 'opl_framework:hosted_product_entry');
    assert.equal(
      registration.state_index_inputs.session_continuity_ledger_index,
      '/generated_session_surface_ref',
    );
    assert.equal(registration.state_index_inputs.artifact_projection_index, '/artifact_locator_contract');
    assert.equal(registration.state_index_inputs.runtime_health_snapshot_index, '/runtime_inventory');
    assert.deepEqual(
      registration.indexable_surfaces.map((surface) => surface.surface_id),
      [
        'product_entry_registration',
        'opl_hosted_stage_runtime',
        'generated_session_surface',
        'runtime_health',
        'review_publication_projection_refs',
        'opl_family_lifecycle_adapter',
        'artifact_locator_contract',
        'domain_memory_descriptor_locator',
        'domain_owner_receipt_contract',
        'lifecycle_guarded_apply_proof',
        'visual_transition_spec',
        'visual_transition_evaluator',
        'controlled_visual_stage_attempt',
        'controlled_memory_apply_proof',
        'controlled_soak_no_regression_attempt',
        'domain_action_adapter_receipt_refs',
      ],
    );
    assert.equal(registration.consumable_projection_refs.includes('/generated_session_surface_ref'), true);
    assert.equal(registration.consumable_projection_refs.includes('/artifact_locator_contract'), true);
    assert.equal(registration.consumable_projection_refs.includes('/session_continuity'), false);
    assert.equal(registration.consumable_projection_refs.includes('/artifact_inventory'), false);
    assert.equal(registration.standard_domain_agent_skeleton, undefined);
    assert.equal(registration.artifact_locator_contract.ref, '/artifact_locator_contract');
    assert.equal(registration.domain_memory_descriptor_locator.ref, '/domain_memory_descriptor_locator');
    assert.equal(registration.domain_memory_descriptor_locator.descriptor_id, 'rca.visual_pattern_memory.descriptor.v1');
    assert.equal(registration.domain_memory_descriptor_locator.locator_id, 'rca.visual_pattern_memory.locator.v1');
    assert.equal(registration.domain_memory_descriptor_locator.memory_family, 'visual_pattern_memory');
    assert.equal(registration.domain_memory_descriptor_locator.opl_role, 'locator_ref_receipt_consumer_only');
    assert.equal(registration.domain_memory_descriptor_locator.opl_can_hold_memory_content, false);
    assert.equal(registration.domain_memory_descriptor_locator.opl_can_issue_review_or_export_verdict, false);
    assert.equal(registration.domain_owner_receipt_contract.ref, '/domain_owner_receipt_contract');
    assert.equal(registration.lifecycle_guarded_apply_proof.ref, '/lifecycle_guarded_apply_proof');
    assert.equal(registration.visual_transition_spec.ref, '/visual_transition_spec');
    assert.equal(registration.visual_transition_evaluator.ref, '/visual_transition_evaluator');
    assert.equal(registration.controlled_visual_stage_attempt.ref, '/controlled_visual_stage_attempt');
    assert.equal(registration.controlled_memory_apply_proof.ref, '/controlled_memory_apply_proof');
    assert.equal(registration.controlled_soak_no_regression_attempt.ref, '/controlled_soak_no_regression_attempt');
    assert.equal(registration.domain_action_adapter_receipt_refs.ref, '/domain_action_adapter_receipt_refs');
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
      owns_domain_memory_content: false,
      allowed_authority: [
        'read_product_entry_registration_index',
        'read_opl_hosted_stage_runtime_index',
        'read_runtime_health_index',
        'read_review_publication_projection_refs',
        'read_domain_memory_locator_refs',
        'read_generated_session_surface_ref',
        'read_artifact_locator_contract',
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
      manifest.route_equivalence.equivalent_routes.find((route) => route.route_id === 'opl_hosted_stage_runtime').surface_kind,
      'opl_hosted_product_entry',
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
