// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { readFileSync } from 'node:fs';
import {
  getDefaultOverlayCatalog,
} from './package-surfaces.ts';

function readJson(file) {
  return JSON.parse(readFileSync(path.resolve(file), 'utf-8'));
}

test('overlay onboarding is runtime-registry driven without standalone package facades', () => {
  const runtimePackage = readJson('packages/redcube-runtime/package.json');
  const domainEntryPackage = readJson('packages/redcube-domain-entry/package.json');
  const catalog = getDefaultOverlayCatalog();

  assert.equal(Boolean(runtimePackage.dependencies?.['@redcube/overlay-registry']), false);
  assert.deepEqual(
    catalog.overlays.map((overlay) => overlay.overlay_id),
    ['ppt_deck', 'xiaohongshu', 'poster_onepager'],
  );
  assert.equal(catalog.overlays.every((overlay) => !Object.hasOwn(overlay, 'packages')), true);
  assert.equal(runtimePackage.dependencies?.['@redcube/overlay-ppt'], '0.1.0');
  assert.equal(runtimePackage.dependencies?.['@redcube/overlay-xiaohongshu'], '0.1.0');
  assert.equal(Boolean(domainEntryPackage.dependencies?.['@redcube/overlay-ppt']), false);
  assert.equal(Boolean(domainEntryPackage.dependencies?.['@redcube/overlay-xiaohongshu']), false);
  assert.equal(Boolean(domainEntryPackage.dependencies?.['@redcube/overlay-registry']), false);
});
