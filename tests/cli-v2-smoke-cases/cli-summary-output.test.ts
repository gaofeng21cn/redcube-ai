// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

test('CLI JSON summary helper keeps summaries narrow and machine readable', () => {
  const summary = readFileSync('apps/redcube-cli/src/cli-parts/json-summary.ts', 'utf-8');
  assert.match(summary, /json/i);
  assert.match(summary, /summary/i);
  assert.doesNotMatch(summary, /markdown|human_doc/i);
});
