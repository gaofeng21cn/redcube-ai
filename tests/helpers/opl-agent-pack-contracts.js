import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const repoRoot = path.resolve(__dirname, '..', '..');

export function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(repoRoot, relativePath), 'utf8'));
}

export function assertNoLegacyAuthorityFunctionFields(value, label) {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => assertNoLegacyAuthorityFunctionFields(entry, `${label}[${index}]`));
    return;
  }
  if (!value || typeof value !== 'object') return;

  if (value.contract_id === 'rca.minimal_authority_functions.v1') {
    assert.equal('allowed_functions' in value, false, label);
    assert.equal(Array.isArray(value.allowed_authority_surface_ids), true, label);
    assert.equal('authority_surface_boundaries' in value, true, label);
    assert.equal('function_boundaries' in value, false, label);
  }
  if (value.surface_kind === 'rca_minimal_authority_surface') {
    assert.equal('function_id' in value, false, label);
    assert.equal('legacy_function_id_compatibility' in value, false, label);
    assert.equal(typeof value.authority_surface_id, 'string', label);
  }
  if (value.authority_surface_taxonomy) {
    assert.equal('retained_functions' in value, false, label);
    assert.equal('retained_function_count' in value, false, label);
  }

  for (const [key, entry] of Object.entries(value)) {
    assertNoLegacyAuthorityFunctionFields(entry, `${label}.${key}`);
  }
}

export function assertCleanAgentRepoPathRef(refEntry, expectedPrefix, label) {
  assert.equal(refEntry.ref_kind, 'repo_path', label);
  assert.equal(refEntry.ref.startsWith(expectedPrefix), true, `${label}: ${refEntry.ref}`);
  const fullPath = path.join(repoRoot, refEntry.ref);
  assert.equal(fs.existsSync(fullPath), true, `${label}: ${refEntry.ref}`);
  const content = fs.readFileSync(fullPath, 'utf8');
  assert.notEqual(content.trim(), '', `${label}: ${refEntry.ref}`);
  assert.equal(/\b(?:TODO|TBD)\b/i.test(content), false, `${label}: ${refEntry.ref}`);
}
