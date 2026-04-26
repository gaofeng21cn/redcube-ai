import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { existsSync, readFileSync } from 'node:fs';

test('governance exposes a TypeScript contract entrypoint and typed review surfaces', () => {
  assert.equal(existsSync(path.resolve('packages/redcube-governance/src/index.ts')), true);
  assert.equal(existsSync(path.resolve('packages/redcube-governance/src/types.ts')), true);

  const pkg = JSON.parse(readFileSync(path.resolve('packages/redcube-governance/package.json'), 'utf-8'));
  const entry = readFileSync(path.resolve('packages/redcube-governance/src/index.ts'), 'utf-8');
  const types = readFileSync(path.resolve('packages/redcube-governance/src/types.ts'), 'utf-8');

  assert.equal(pkg.types, './dist/index.d.ts');
  assert.match(entry, /getReviewState/);
  assert.match(entry, /getPublicationProjection/);
  assert.match(entry, /applyReviewMutation/);
  assert.match(entry, /buildGovernanceSurface/);
  assert.match(types, /interface ReviewStateResponse/);
  assert.match(types, /interface PublicationProjectionResponse/);
  assert.match(types, /interface RuntimeWatchResponse/);
  assert.match(types, /interface GovernanceSurfaceContract/);
  assert.match(types, /governance_surface: GovernanceSurfaceContract/);
  assert.match(types, /source_readiness_summary: Record<string, unknown> \| null/);
  assert.match(types, /gate_summary: Record<string, unknown> \| null/);
});
