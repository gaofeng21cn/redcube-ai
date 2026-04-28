// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { existsSync, readFileSync } from 'node:fs';

test('P15 slice 1: runtime-protocol exposes a TypeScript entrypoint and typed contract exports', () => {
  assert.equal(existsSync(path.resolve('packages/redcube-runtime-protocol/src/index.ts')), true);
  assert.equal(existsSync(path.resolve('packages/redcube-runtime-protocol/src/types.ts')), true);

  const packageJson = JSON.parse(readFileSync(path.resolve('packages/redcube-runtime-protocol/package.json'), 'utf-8'));
  const entry = readFileSync(path.resolve('packages/redcube-runtime-protocol/src/index.ts'), 'utf-8');

  assert.equal(packageJson.types, './dist/index.d.ts');
  assert.match(entry, /export type/);
  assert.match(entry, /WorkspaceContract/);
  assert.match(entry, /RunRecord/);
});


function read(file) {
  return readFileSync(path.resolve(file), 'utf-8');
}

test('gateway exposes a TypeScript entrypoint and typed product surface contracts', () => {
  assert.equal(existsSync(path.resolve('packages/redcube-gateway/src/index.ts')), true);
  assert.equal(existsSync(path.resolve('packages/redcube-gateway/src/types.ts')), true);

  const packageJson = JSON.parse(read('packages/redcube-gateway/package.json'));
  const types = [
    read('packages/redcube-gateway/src/types.ts'),
    read('packages/redcube-gateway/src/types-parts/foundation.ts'),
    read('packages/redcube-gateway/src/types-parts/product-entry.ts'),
  ].join('\n');
  const entry = read('packages/redcube-gateway/src/index.ts');

  assert.equal(packageJson.types, './dist/index.d.ts');
  assert.match(types, /export interface WorkspaceDoctorResponse/);
  assert.match(types, /export interface DeliverableCreateResponse/);
  assert.match(types, /export interface RouteRunResponse/);
  assert.match(entry, /export function createDeliverable/);
  assert.match(entry, /export function getDeliverable/);
  assert.match(entry, /export function runDeliverableRoute/);
});


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


test('reference-os exposes a TypeScript contract entrypoint and types file', () => {
  assert.equal(existsSync(path.resolve('packages/redcube-reference-os/src/index.ts')), true);
  assert.equal(existsSync(path.resolve('packages/redcube-reference-os/src/types.ts')), true);

  const pkg = JSON.parse(readFileSync(path.resolve('packages/redcube-reference-os/package.json'), 'utf-8'));
  const entry = readFileSync(path.resolve('packages/redcube-reference-os/src/index.ts'), 'utf-8');

  assert.equal(pkg.types, './dist/index.d.ts');
  assert.equal(existsSync(path.resolve('packages/redcube-reference-os/src/index.js')), false);
  assert.equal(existsSync(path.resolve('packages/redcube-reference-os/src/reference-samples.js')), false);
  assert.equal(existsSync(path.resolve('packages/redcube-reference-os/src/relative-quality.js')), false);
  assert.match(entry, /buildReferenceQualityReport/);
  assert.match(entry, /buildReferencePromotionReport/);
  assert.match(entry, /buildReferenceReplacementReport/);
  assert.match(entry, /ReferenceQualityReport/);
});


function readJson(file) {
  return JSON.parse(readFileSync(path.resolve(file), 'utf-8'));
}

test('P17 slice 6: runtime-family-xiaohongshu exposes a TypeScript entrypoint and typed runtime-family contracts', () => {
  assert.equal(existsSync(path.resolve('packages/redcube-runtime-family-xiaohongshu/src/index.ts')), true);
  assert.equal(existsSync(path.resolve('packages/redcube-runtime-family-xiaohongshu/src/types.ts')), true);
  assert.equal(existsSync(path.resolve('packages/redcube-runtime-family-xiaohongshu/tsconfig.json')), true);

  const pkg = readJson('packages/redcube-runtime-family-xiaohongshu/package.json');
  const rootTsconfig = readJson('tsconfig.json');
  const packageTsconfig = readJson('packages/redcube-runtime-family-xiaohongshu/tsconfig.json');
  const entry = readFileSync(path.resolve('packages/redcube-runtime-family-xiaohongshu/src/index.ts'), 'utf-8');
  const types = readFileSync(path.resolve('packages/redcube-runtime-family-xiaohongshu/src/types.ts'), 'utf-8');

  assert.equal(pkg.types, './dist/index.d.ts');
  assert.equal(packageTsconfig.extends, '../../tsconfig.package-build.json');
  assert.equal(
    rootTsconfig.references.some((entrypoint) => entrypoint.path === './packages/redcube-runtime-family-xiaohongshu'),
    true,
  );

  assert.match(entry, /canRunXiaohongshu/);
  assert.match(entry, /runXiaohongshuRoute/);

  assert.match(types, /type XhsRuntimeRoute/);
  assert.match(types, /interface XhsRuntimeContract/);
  assert.match(types, /interface XhsRuntimeRunRequest/);
  assert.match(types, /type XhsRuntimeRouteResult/);
  assert.match(types, /XhsPlanArtifact/);
  assert.match(types, /XhsVisualDirectionArtifact/);
  assert.match(types, /XhsRenderArtifact/);
  assert.doesNotMatch(types, /\bany\b/);
});

test('P17 slice 7: runtime-family-ppt exposes a TypeScript entrypoint and typed runtime-family contracts', () => {
  assert.equal(existsSync(path.resolve('packages/redcube-runtime-family-ppt/src/index.ts')), true);
  assert.equal(existsSync(path.resolve('packages/redcube-runtime-family-ppt/src/types.ts')), true);
  assert.equal(existsSync(path.resolve('packages/redcube-runtime-family-ppt/tsconfig.json')), true);

  const pkg = readJson('packages/redcube-runtime-family-ppt/package.json');
  const rootTsconfig = readJson('tsconfig.json');
  const packageTsconfig = readJson('packages/redcube-runtime-family-ppt/tsconfig.json');
  const entry = readFileSync(path.resolve('packages/redcube-runtime-family-ppt/src/index.ts'), 'utf-8');
  const types = readFileSync(path.resolve('packages/redcube-runtime-family-ppt/src/types.ts'), 'utf-8');

  assert.equal(pkg.types, './dist/index.d.ts');
  assert.equal(packageTsconfig.extends, '../../tsconfig.package-build.json');
  assert.equal(
    rootTsconfig.references.some((entrypoint) => entrypoint.path === './packages/redcube-runtime-family-ppt'),
    true,
  );

  assert.match(entry, /canRunPptDeck/);
  assert.match(entry, /runPptDeckRoute/);

  assert.match(types, /type PptRuntimeRoute/);
  assert.match(types, /interface PptRuntimeContract/);
  assert.match(types, /interface PptRuntimeRunRequest/);
  assert.match(types, /type PptRuntimeRouteResult/);
  assert.match(types, /PptBlueprintArtifact/);
  assert.match(types, /PptVisualDirectionArtifact/);
  assert.match(types, /PptRenderArtifact/);
  assert.doesNotMatch(types, /\bany\b/);
});

test('P20.C: runtime-family-poster-onepager exposes a TypeScript entrypoint and typed runtime-family contracts', () => {
  assert.equal(existsSync(path.resolve('packages/redcube-runtime-family-poster-onepager/src/index.ts')), true);
  assert.equal(existsSync(path.resolve('packages/redcube-runtime-family-poster-onepager/src/types.ts')), true);
  assert.equal(existsSync(path.resolve('packages/redcube-runtime-family-poster-onepager/tsconfig.json')), true);

  const pkg = readJson('packages/redcube-runtime-family-poster-onepager/package.json');
  const rootTsconfig = readJson('tsconfig.json');
  const packageTsconfig = readJson('packages/redcube-runtime-family-poster-onepager/tsconfig.json');
  const entry = readFileSync(path.resolve('packages/redcube-runtime-family-poster-onepager/src/index.ts'), 'utf-8');
  const types = readFileSync(path.resolve('packages/redcube-runtime-family-poster-onepager/src/types.ts'), 'utf-8');

  assert.equal(pkg.types, './dist/index.d.ts');
  assert.equal(packageTsconfig.extends, '../../tsconfig.package-build.json');
  assert.equal(
    rootTsconfig.references.some((entrypoint) => entrypoint.path === './packages/redcube-runtime-family-poster-onepager'),
    true,
  );

  assert.match(entry, /canRunPosterOnepager/);
  assert.match(entry, /runPosterOnepagerRoute/);

  assert.match(types, /type PosterRuntimeRoute/);
  assert.match(types, /interface PosterRuntimeContract/);
  assert.match(types, /interface PosterRuntimeRunRequest/);
  assert.match(types, /type PosterRuntimeRouteResult/);
  assert.match(types, /PosterBlueprintArtifact/);
  assert.match(types, /PosterVisualDirectionArtifact/);
  assert.match(types, /PosterRenderArtifact/);
  assert.doesNotMatch(types, /\bany\b/);
});
