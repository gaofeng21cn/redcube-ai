// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';

function read(file) {
  return readFileSync(path.resolve(file), 'utf-8');
}

function readImplementation(file) {
  const source = read(file);
  const shell = source.trim().match(/^export \* from '\.\/([^']+\.ts)';$/);
  return shell ? read(path.join(path.dirname(file), shell[1])) : source;
}

function sourceFiles(dir) {
  return readdirSync(path.resolve(dir), { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return sourceFiles(file);
    }
    if (entry.isFile() && /\.(?:ts|js|mjs|cjs)$/.test(entry.name)) {
      return [file];
    }
    return [];
  });
}

test('pack shells no longer export xiaohongshu creative builders or compilers', () => {
  const packEntry = read('packages/redcube-pack-xiaohongshu/src/index.ts');
  const renderPrompt = read('prompts/xiaohongshu/render_html.md');

  assert.equal(existsSync(path.resolve('packages/redcube-pack-xiaohongshu/src/planning.js')), false);
  assert.equal(existsSync(path.resolve('packages/redcube-pack-xiaohongshu/src/render-compiler.js')), false);
  assert.equal(packEntry.includes('buildXhsPlanSlides'), false);
  assert.equal(packEntry.includes('buildXhsVisualDirection'), false);
  assert.equal(packEntry.includes('buildXhsRenderHtml'), false);
  assert.equal(packEntry.includes('compileXhsRenderSlides'), false);
  assert.equal(renderPrompt.includes('authored_markup_registry'), true);
});

test('ppt pack shell no longer exports creative builders or compilers', () => {
  const packEntry = read('packages/redcube-pack-ppt/src/index.ts');
  const renderPrompt = read('prompts/ppt_deck/render_html.md');

  assert.equal(existsSync(path.resolve('packages/redcube-pack-ppt/src/render-compiler.js')), false);
  assert.equal(packEntry.includes('buildPptDetailedOutline'), false);
  assert.equal(packEntry.includes('buildPptSlideBlueprint'), false);
  assert.equal(packEntry.includes('buildPptVisualDirection'), false);
  assert.equal(packEntry.includes('buildPptRenderArtifact'), false);
  assert.equal(packEntry.includes('compilePptRenderSlides'), false);
  assert.equal(renderPrompt.includes('authored_markup_registry'), true);
});

test('poster pack shell no longer exports creative builders or compilers', () => {
  const packEntry = read('packages/redcube-pack-poster-onepager/src/index.ts');

  assert.equal(existsSync(path.resolve('packages/redcube-pack-poster-onepager/src/render-compiler.js')), false);
  assert.equal(packEntry.includes('buildPosterBlueprint'), false);
  assert.equal(packEntry.includes('buildPosterVisualDirection'), false);
  assert.equal(packEntry.includes('buildPosterRenderArtifact'), false);
  assert.equal(packEntry.includes('compilePosterRenderSlides'), false);
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

test('legacy pack-runtime compiler registry is removed from the workspace', () => {
  assert.equal(existsSync(path.resolve('packages/redcube-pack-runtime')), false);
  assert.equal(existsSync(path.resolve('packages/redcube-runtime/src/render-pack-compiler.js')), false);
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
  const posterPack = read('packages/redcube-pack-poster-onepager/src/index.ts');
  const posterRuntimeCore = read('packages/redcube-runtime-family-poster-onepager/src/poster-onepager-runtime-parts/core.ts');

  assert.equal(posterPack.includes('prompts/poster_onepager'), false);
  assert.equal(posterRuntimeCore.includes('prompts/poster_onepager'), false);
  assert.equal(posterRuntimeCore.includes('DEFAULT_PROMPT_PACK'), false);
  assert.equal(posterRuntimeCore.includes('contract?.review_surface?.rerun_from_stage'), true);
});

test('pack source types do not encode executor-owner provenance strings', () => {
  const packSourceRoots = [
    'packages/redcube-pack-ppt/src',
    'packages/redcube-pack-poster-onepager/src',
    'packages/redcube-pack-xiaohongshu/src',
  ];
  const bannedExecutorOwnerStrings = [
    'codex_cli',
    'hermes',
    'codex_cli_json_output',
    'codex_cli_runtime',
  ];
  const violations = [];

  for (const root of packSourceRoots) {
    assert.equal(statSync(path.resolve(root)).isDirectory(), true);
    for (const file of sourceFiles(root)) {
      const source = read(file);
      for (const banned of bannedExecutorOwnerStrings) {
        if (source.includes(banned)) {
          violations.push(`${file}: ${banned}`);
        }
      }
    }
  }

  assert.deepEqual(violations, []);
});
