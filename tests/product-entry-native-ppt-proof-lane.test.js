import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { readFileSync } from 'node:fs';

import { getProductEntryManifest } from './product-domain-action-test-api.js';

const HELPER_CATALOG_FILE = 'contracts/runtime-program/python-native-helper-catalog.json';
const NATIVE_ENGINE_CONTRACT_FILE =
  'contracts/runtime-program/ppt-native-pptx-quality-nonregression.json';

function readJson(file) {
  return JSON.parse(readFileSync(path.resolve(file), 'utf-8'));
}

test('product-entry stays refs-only while RCA retains native PPT authority contracts', async () => {
  const manifest = await getProductEntryManifest({ workspace_root: process.cwd() });
  const nativeEngine = readJson(NATIVE_ENGINE_CONTRACT_FILE);

  assert.equal(Object.hasOwn(manifest, 'deliverable_facade'), false);
  assert.equal(Object.hasOwn(manifest, 'operator_loop_actions'), false);
  assert.equal(Object.hasOwn(manifest, 'skill_catalog'), false);
  assert.equal(manifest.authority_boundary.generic_product_shell_owner, 'one-person-lab');
  assert.equal(nativeEngine.surface_kind, 'ppt_native_pptx_quality_nonregression');
  assert.equal(nativeEngine.authority_boundary.opl_agent_lab_can_claim_visual_ready, false);
  assert.equal(nativeEngine.authority_boundary.opl_agent_lab_can_authorize_exportable, false);
});

test('native helper doctor remains diagnostic-only outside product-entry projection', () => {
  const catalog = readJson(HELPER_CATALOG_FILE);

  assert.equal(catalog.package.diagnostics.surface_kind, 'python_native_helper_doctor');
  assert.equal(catalog.package.diagnostics.executes_review_export_gates, false);
  assert.equal(catalog.package.diagnostics.route_authority, 'diagnostic_only');
  assert.equal(catalog.package.diagnostics.bypass_product_entry_allowed, false);
  assert.deepEqual(catalog.bypass_policy.required_review_export_gates, [
    'visual_director_review',
    'screenshot_review',
    'export_pptx',
  ]);
});
