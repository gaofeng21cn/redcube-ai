import test from 'node:test';
import assert from 'node:assert/strict';

async function getProductEntryManifest(request) {
  const module = await import('../packages/redcube-domain-entry/dist/index.js');
  return module.getProductEntryManifest(request);
}

test('product-entry does not reconstruct the OPL Runtime Manager registration', async () => {
  const manifest = await getProductEntryManifest({ workspace_root: process.cwd() });

  assert.equal(Object.hasOwn(manifest, 'skill_catalog'), false);
  assert.equal(Object.hasOwn(manifest, 'runtime_manager'), false);
  assert.equal(Object.hasOwn(manifest, 'opl_runtime_manager_registration'), false);
  assert.equal(manifest.runtime.runtime_owner, 'one-person-lab');
  assert.equal(manifest.runtime.product_session_surface_ref, 'opl-generated:product_session');
  assert.equal(manifest.authority_boundary.generic_session_owner, 'one-person-lab');
  assert.equal(manifest.authority_boundary.projection_can_claim_domain_ready, false);
});
