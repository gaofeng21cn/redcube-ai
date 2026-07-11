import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

function read(file) {
  return readFileSync(file, 'utf-8');
}

function readJson(file) {
  return JSON.parse(read(file));
}

test('CLI smoke keeps the RCA aliases pointed at the built CLI entry', () => {
  const pkg = readJson('package.json');
  assert.equal(pkg.scripts.redcube, 'node apps/redcube-cli/dist/cli.js');
  assert.equal(pkg.scripts.rca, 'node apps/redcube-cli/dist/cli.js');
});

test('CLI workspace and deliverable commands stay routed through domain-entry surfaces', () => {
  const dispatch = read('apps/redcube-cli/src/cli-parts/dispatch.ts');
  assert.match(dispatch, /doctorWorkspace/);
  assert.match(dispatch, /createDeliverable/);
  assert.match(dispatch, /getDeliverable/);
  assert.match(dispatch, /listTopics/);
});

test('CLI help remains task-oriented instead of restoring retired Foundry first-layer commands', () => {
  const help = read('apps/redcube-cli/src/cli-parts/help.ts');
  assert.doesNotMatch(help, /\bstatus\b.*\binspect\b.*\binterfaces\b/s);
  assert.match(help, /workspace|deliverable|product|domain-handler/);
});
