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

test('overlay onboarding is registry-driven at the package boundary', () => {
  const registryPackage = readJson('packages/redcube-overlay-registry/package.json');
  const domainEntryPackage = readJson('packages/redcube-domain-entry/package.json');

  assert.equal(registryPackage.name, '@redcube/overlay-registry');
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
  assert.equal(Boolean(domainEntryPackage.dependencies?.['@redcube/overlay-ppt']), false);
  assert.equal(Boolean(domainEntryPackage.dependencies?.['@redcube/overlay-xiaohongshu']), false);
});
