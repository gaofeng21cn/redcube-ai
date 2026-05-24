// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { readFileSync } from 'node:fs';

function read(file) {
  return readFileSync(path.resolve(file), 'utf-8');
}

function readImplementation(file) {
  const source = read(file);
  const shell = source.trim().match(/^export \* from '\.\/([^']+\.ts)';$/);
  return shell ? read(path.join(path.dirname(file), shell[1])) : source;
}

function readCliSource() {
  return [
    read('apps/redcube-cli/src/cli.ts'),
    read('apps/redcube-cli/src/cli-parts/help.ts'),
  ].join('\n');
}

test('domain actions no longer hardcode overlay family packages directly', () => {
  const createDeliverable = read('packages/redcube-domain-entry/src/actions/create-deliverable.ts');
  const auditDeliverable = read('packages/redcube-domain-entry/src/actions/audit-deliverable.ts');

  assert.equal(createDeliverable.includes("@redcube/overlay-ppt"), false);
  assert.equal(createDeliverable.includes("@redcube/overlay-xiaohongshu"), false);
  assert.equal(auditDeliverable.includes("@redcube/overlay-ppt"), false);
  assert.equal(auditDeliverable.includes("@redcube/overlay-xiaohongshu"), false);
  assert.equal(createDeliverable.includes('@redcube/overlay-registry'), true);
  assert.equal(auditDeliverable.includes('@redcube/overlay-registry'), true);
});

test('overlay registry package exports default registry entrypoint', () => {
  const registryIndex = read('packages/redcube-overlay-registry/src/index.ts');
  const registryPackage = JSON.parse(read('packages/redcube-overlay-registry/package.json'));
  const domainEntryPackage = JSON.parse(read('packages/redcube-domain-entry/package.json'));

  assert.equal(registryIndex.includes('getDefaultOverlayRegistry'), true);
  assert.equal(registryIndex.includes('getDefaultOverlayCatalog'), true);
  assert.equal(registryIndex.includes("from '@redcube/overlay-ppt'"), false);
  assert.equal(registryIndex.includes("from '@redcube/overlay-xiaohongshu'"), false);
  assert.equal(registryPackage.name, '@redcube/overlay-registry');
  assert.deepEqual(
    registryPackage.redcube?.defaultOverlayModules,
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

test('CLI onboarding usage no longer hardcodes current overlay ids in deliverable create help', () => {
  const cliSource = readCliSource();

  assert.equal(cliSource.includes('<ppt_deck|xiaohongshu>'), false);
  assert.equal(cliSource.includes('redcube profile --action list'), true);
});
