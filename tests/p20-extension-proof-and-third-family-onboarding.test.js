import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { existsSync, readFileSync } from 'node:fs';

function read(file) {
  return readFileSync(path.resolve(file), 'utf-8');
}

function readJson(file) {
  return JSON.parse(read(file));
}

test('P20.B: runtime executor resolves host-agent family runners through runtime-family-registry', () => {
  const executors = read('packages/redcube-runtime/src/executors.ts');
  const runtimePackage = readJson('packages/redcube-runtime/package.json');

  assert.equal(executors.includes("@redcube/runtime-family-ppt"), false);
  assert.equal(executors.includes("@redcube/runtime-family-xiaohongshu"), false);
  assert.equal(executors.includes('canRunPptDeck('), false);
  assert.equal(executors.includes('canRunXiaohongshu('), false);
  assert.equal(executors.includes("@redcube/runtime-family-registry"), true);

  assert.equal(Boolean(runtimePackage.dependencies?.['@redcube/runtime-family-ppt']), false);
  assert.equal(Boolean(runtimePackage.dependencies?.['@redcube/runtime-family-xiaohongshu']), false);
  assert.equal(runtimePackage.dependencies?.['@redcube/runtime-family-registry'], '0.1.0');
});

test('P20.C red: overlay registry must expose poster_onepager as the third family candidate', () => {
  const registryPackage = readJson('packages/redcube-overlay-registry/package.json');
  const overlayIds = registryPackage.redcube?.defaultOverlayModules?.map((entry) => entry.overlayId) || [];
  const posterEntry = registryPackage.redcube?.defaultOverlayModules?.find((entry) => entry.overlayId === 'poster_onepager');

  assert.deepEqual(overlayIds, ['ppt_deck', 'xiaohongshu', 'poster_onepager']);
  assert.deepEqual(posterEntry, {
    overlayId: 'poster_onepager',
    module: '@redcube/overlay-poster-onepager',
    exportName: 'posterOnepagerOverlay',
  });
});

test('P20.C red: poster_onepager onboarding packages and prompt surface must exist as machine-readable truth', () => {
  const requiredPaths = [
    'packages/redcube-overlay-poster-onepager/package.json',
    'packages/redcube-overlay-poster-onepager/src/index.js',
    'packages/redcube-overlay-poster-onepager/src/index.ts',
    'packages/redcube-runtime-family-poster-onepager/package.json',
    'packages/redcube-runtime-family-poster-onepager/src/index.js',
    'packages/redcube-runtime-family-poster-onepager/src/index.ts',
    'packages/redcube-pack-poster-onepager/package.json',
    'packages/redcube-pack-poster-onepager/src/index.ts',
    'prompts/poster_onepager/storyline.md',
    'prompts/poster_onepager/poster_blueprint.md',
    'prompts/poster_onepager/visual_direction.md',
    'prompts/poster_onepager/render_html.md',
    'prompts/poster_onepager/director_review.md',
    'prompts/poster_onepager/screenshot_review.md',
    'prompts/poster_onepager/export_bundle.md',
  ];

  assert.deepEqual(
    requiredPaths.filter((file) => existsSync(path.resolve(file))),
    requiredPaths,
  );
});
