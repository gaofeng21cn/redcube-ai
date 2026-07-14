import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const repoRoot = path.resolve(__dirname, '..', '..');

export function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(repoRoot, relativePath), 'utf8'));
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
