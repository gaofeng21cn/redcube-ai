// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { existsSync, readFileSync, statSync } from 'node:fs';

function read(file) {
  return readFileSync(path.resolve(file), 'utf-8');
}

function readImplementation(file) {
  const source = read(file);
  const shell = source.trim().match(/^export \* from '\.\/([^']+\.ts)';$/);
  return shell ? read(path.join(path.dirname(file), shell[1])) : source;
}

test('type-only pack workspaces are retired and runtime-family types own artifact contracts', () => {
  const rootTsconfig = JSON.parse(read('tsconfig.json'));
  const pptFamilyPackageJson = JSON.parse(read('packages/redcube-runtime-family-ppt/package.json'));
  const xhsFamilyPackageJson = JSON.parse(read('packages/redcube-runtime-family-xiaohongshu/package.json'));
  const posterFamilyPackageJson = JSON.parse(read('packages/redcube-runtime-family-poster-onepager/package.json'));
  const pptFamilyTypes = read('packages/redcube-runtime-family-ppt/src/types.ts');
  const xhsFamilyTypes = read('packages/redcube-runtime-family-xiaohongshu/src/types.ts');
  const posterFamilyTypes = read('packages/redcube-runtime-family-poster-onepager/src/types.ts');
  const renderPrompt = read('prompts/xiaohongshu/render_html.md');

  assert.equal(existsSync(path.resolve('packages/redcube-pack-ppt')), false);
  assert.equal(existsSync(path.resolve('packages/redcube-pack-xiaohongshu')), false);
  assert.equal(existsSync(path.resolve('packages/redcube-pack-poster-onepager')), false);
  assert.equal(rootTsconfig.references.some((entry) => entry.path.includes('redcube-pack-')), false);
  assert.equal(Boolean(pptFamilyPackageJson.dependencies?.['@redcube/pack-ppt']), false);
  assert.equal(Boolean(xhsFamilyPackageJson.dependencies?.['@redcube/pack-xiaohongshu']), false);
  assert.equal(Boolean(posterFamilyPackageJson.dependencies?.['@redcube/pack-poster-onepager']), false);
  assert.equal(pptFamilyTypes.includes('@redcube/pack-ppt'), false);
  assert.equal(xhsFamilyTypes.includes('@redcube/pack-xiaohongshu'), false);
  assert.equal(posterFamilyTypes.includes('@redcube/pack-poster-onepager'), false);
  assert.match(pptFamilyTypes, /interface PptBlueprintArtifact/);
  assert.match(xhsFamilyTypes, /interface XhsPlanArtifact/);
  assert.match(posterFamilyTypes, /interface PosterBlueprintArtifact/);
  assert.equal(renderPrompt.includes('authored_markup_registry'), true);
  assert.equal(read('prompts/ppt_deck/render_html.md').includes('authored_markup_registry'), true);
});

test('overlay render contracts keep pack ids but no longer declare compiler registry wiring', () => {
  const pptOverlay = readImplementation('packages/redcube-overlay-ppt/src/profiles.ts');
  const xhsOverlay = readImplementation('packages/redcube-overlay-xiaohongshu/src/contracts.ts');
  const posterOverlay = readImplementation('packages/redcube-overlay-poster-onepager/src/contracts.ts');

  assert.equal(pptOverlay.includes("compiler_module:"), false);
  assert.equal(pptOverlay.includes("compiler_export:"), false);
  assert.equal(xhsOverlay.includes("compiler_module:"), false);
  assert.equal(xhsOverlay.includes("compiler_export:"), false);
  assert.equal(posterOverlay.includes("compiler_module:"), false);
  assert.equal(posterOverlay.includes("compiler_export:"), false);
  assert.equal(pptOverlay.includes("pack: '@redcube/pack-ppt'"), true);
  assert.equal(xhsOverlay.includes("pack: '@redcube/pack-xiaohongshu'"), true);
  assert.equal(posterOverlay.includes("pack: '@redcube/pack-poster-onepager'"), true);
});

test('runtime executor remains registry-driven instead of hardcoding family runtime imports', () => {
  const executors = readImplementation('packages/redcube-runtime/src/executors.ts');

  assert.equal(executors.includes('./ppt-deck-runtime.ts'), false);
  assert.equal(executors.includes('./xiaohongshu-runtime.ts'), false);
  assert.equal(executors.includes('@redcube/runtime-family-registry'), true);
  assert.equal(executors.includes('@redcube/runtime-family-ppt'), false);
  assert.equal(executors.includes('@redcube/runtime-family-xiaohongshu'), false);
});

test('runtime and family manifests no longer depend on legacy pack-runtime compiler registry', () => {
  const runtimePackageJson = JSON.parse(read('packages/redcube-runtime/package.json'));
  const pptFamilyPackageJson = JSON.parse(read('packages/redcube-runtime-family-ppt/package.json'));
  const xhsFamilyPackageJson = JSON.parse(read('packages/redcube-runtime-family-xiaohongshu/package.json'));
  const posterFamilyPackageJson = JSON.parse(read('packages/redcube-runtime-family-poster-onepager/package.json'));

  assert.equal(Boolean(runtimePackageJson.dependencies?.['@redcube/pack-runtime']), false);
  assert.equal(Boolean(pptFamilyPackageJson.dependencies?.['@redcube/pack-runtime']), false);
  assert.equal(Boolean(xhsFamilyPackageJson.dependencies?.['@redcube/pack-runtime']), false);
  assert.equal(Boolean(posterFamilyPackageJson.dependencies?.['@redcube/pack-runtime']), false);
});

test('retired pack-runtime package is absent from the workspace', () => {
  assert.equal(existsSync(path.resolve('packages/redcube-pack-runtime')), false);
});

test('family runtimes no longer import pack-runtime or pack-local creative builders', () => {
  const pptFamily = read('packages/redcube-runtime-family-ppt/src/ppt-deck-runtime.ts');
  const xhsFamily = read('packages/redcube-runtime-family-xiaohongshu/src/xiaohongshu-runtime.ts');
  const posterFamily = read('packages/redcube-runtime-family-poster-onepager/src/poster-onepager-runtime.ts');

  assert.equal(pptFamily.includes('@redcube/pack-runtime'), false);
  assert.equal(xhsFamily.includes('@redcube/pack-runtime'), false);
  assert.equal(posterFamily.includes('@redcube/pack-runtime'), false);
  assert.equal(pptFamily.includes('@redcube/pack-ppt'), false);
  assert.equal(xhsFamily.includes('@redcube/pack-xiaohongshu'), false);
  assert.equal(posterFamily.includes('@redcube/pack-poster-onepager'), false);
});

test('poster_onepager onboarding still reads prompt-pack and rerun policy from hydrated contract', () => {
  const posterRuntimeCore = read('packages/redcube-runtime-family-poster-onepager/src/poster-onepager-runtime-parts/core.ts');

  assert.equal(existsSync(path.resolve('packages/redcube-pack-poster-onepager')), false);
  assert.equal(posterRuntimeCore.includes('prompts/poster_onepager'), false);
  assert.equal(posterRuntimeCore.includes('DEFAULT_PROMPT_PACK'), false);
  assert.equal(posterRuntimeCore.includes('contract?.review_surface?.rerun_from_stage'), true);
});

test('runtime-family artifact types do not encode executor-owner provenance strings', () => {
  const familyTypeFiles = [
    'packages/redcube-runtime-family-ppt/src/types.ts',
    'packages/redcube-runtime-family-poster-onepager/src/types.ts',
    'packages/redcube-runtime-family-xiaohongshu/src/types.ts',
  ];
  const bannedExecutorOwnerStrings = [
    'codex_cli',
    'hermes',
    'codex_cli_json_output',
    'codex_cli_runtime',
  ];
  const violations = [];

  for (const sourceFile of familyTypeFiles) {
    assert.equal(statSync(path.resolve(sourceFile)).isFile(), true);
    const source = read(sourceFile);
    for (const banned of bannedExecutorOwnerStrings) {
      if (source.includes(banned)) {
        violations.push(`${sourceFile}: ${banned}`);
      }
    }
  }

  assert.deepEqual(violations, []);
});
