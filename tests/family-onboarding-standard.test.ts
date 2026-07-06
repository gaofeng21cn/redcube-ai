// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { readFileSync } from 'node:fs';
import {
  listDefaultOverlayModules,
} from './package-surfaces.ts';

function readJson(file) {
  return JSON.parse(readFileSync(path.resolve(file), 'utf-8'));
}

test('overlay onboarding is runtime-registry driven without standalone package facades', () => {
  const runtimePackage = readJson('packages/redcube-runtime/package.json');
  const domainEntryPackage = readJson('packages/redcube-domain-entry/package.json');

  assert.equal(Boolean(runtimePackage.dependencies?.['@redcube/overlay-registry']), false);
  assert.deepEqual(
    listDefaultOverlayModules(),
    [
      {
        overlayId: 'ppt_deck',
        module: '@redcube/overlay-ppt',
        exportName: 'pptDeckOverlay',
      },
      {
        overlayId: 'xiaohongshu',
        module: '@redcube/overlay-xiaohongshu',
        exportName: 'xiaohongshuOverlay',
      },
      {
        overlayId: 'poster_onepager',
        module: '@redcube/overlay-poster-onepager',
        exportName: 'posterOnepagerOverlay',
      },
    ],
  );
  assert.equal(runtimePackage.dependencies?.['@redcube/overlay-ppt'], '0.1.0');
  assert.equal(runtimePackage.dependencies?.['@redcube/overlay-xiaohongshu'], '0.1.0');
  assert.equal(Boolean(domainEntryPackage.dependencies?.['@redcube/overlay-ppt']), false);
  assert.equal(Boolean(domainEntryPackage.dependencies?.['@redcube/overlay-xiaohongshu']), false);
  assert.equal(Boolean(domainEntryPackage.dependencies?.['@redcube/overlay-registry']), false);
});
