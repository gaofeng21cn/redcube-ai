// @ts-nocheck
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const testDir = path.dirname(fileURLToPath(import.meta.url));

export const repoRoot = path.resolve(testDir, '..');
export const acceptancePath = 'contracts/production_acceptance/rca-production-acceptance.json';
export const evidenceFixturePath = 'contracts/production_acceptance/rca-evidence-receipt-fixture.json';
export const realNoRegressionRefs = [
  'rca-no-regression:visual-stage:2026-05-27-opl-family-cross-family-repeat-a',
  'rca-no-regression:visual-stage:2026-05-27-opl-family-cross-family-repeat-b',
  'rca-no-regression:visual-stage:2026-05-28-opl-family-ppt-deck-window2',
  'rca-no-regression:visual-stage:2026-05-28-opl-family-xiaohongshu-window2',
  'rca-no-regression:visual-stage:2026-05-30-opl-family-native-repeat',
  'rca-no-regression:visual-stage:2026-05-30-opl-family-xiaohongshu-repeat',
  'rca-no-regression:visual-stage:2026-05-31-opl-family-native-repair-to-export-repeat',
];

export function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(repoRoot, relativePath), 'utf8'));
}

export function collectKeys(value, prefix = '') {
  if (Array.isArray(value)) {
    return value.flatMap((entry, index) => collectKeys(entry, `${prefix}[${index}]`));
  }
  if (!value || typeof value !== 'object') return [];

  return Object.entries(value).flatMap(([key, entry]) => {
    const current = prefix ? `${prefix}.${key}` : key;
    return [current, ...collectKeys(entry, current)];
  });
}

export function assertRefString(value, label) {
  assert.equal(typeof value, 'string', label);
  assert.notEqual(value.trim(), '', label);
  assert.equal(value.startsWith('/'), false, `${label} must be a portable ref, not an absolute path`);
  assert.equal(value.includes('\n'), false, label);
}

export function assertRefArray(values, label) {
  assert.equal(Array.isArray(values), true, label);
  assert.equal(values.length > 0, true, label);
  for (const [index, value] of values.entries()) {
    assertRefString(value, `${label}[${index}]`);
  }
}
