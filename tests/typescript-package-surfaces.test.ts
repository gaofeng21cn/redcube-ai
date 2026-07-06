// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { existsSync, readFileSync, readdirSync } from 'node:fs';

function read(file) {
  return readFileSync(path.resolve(file), 'utf-8');
}

function readJson(file) {
  return JSON.parse(read(file));
}

function assertFileExists(file) {
  assert.equal(existsSync(path.resolve(file)), true, file);
}

function assertFileMissing(file) {
  assert.equal(existsSync(path.resolve(file)), false, file);
}

function assertTsOnlySource(file) {
  assertFileExists(file);
  assertFileMissing(file.replace(/\.ts$/, '.js'));
}

function assertRootReference(rootTsconfig, directory) {
  assert.equal(
    rootTsconfig.references.some((entrypoint) => entrypoint.path === `./${directory}`),
    true,
    directory,
  );
}

const PACKAGE_SURFACES = Object.freeze([
  {
    directory: 'packages/redcube-runtime-protocol',
    expectedTypesEntry: './dist/index.d.ts',
    requiredFiles: ['src/index.ts', 'src/types.ts'],
    entryMatches: [/export type/, /WorkspaceContract/, /RunRecord/],
  },
  {
    directory: 'packages/redcube-domain-entry',
    expectedTypesEntry: './dist/index.d.ts',
    requiredFiles: ['src/index.ts', 'src/types.ts', 'src/types-parts/foundation.ts', 'src/types-parts/product-entry.ts'],
    entryMatches: [/export function createDeliverable/, /export function getDeliverable/, /export function runDeliverableRoute/],
    typeFiles: ['src/types.ts', 'src/types-parts/foundation.ts', 'src/types-parts/product-entry.ts'],
    typeMatches: [/export interface WorkspaceDoctorResponse/, /export interface DeliverableCreateResponse/, /export interface RouteRunResponse/],
  },
  {
    directory: 'packages/redcube-governance',
    expectedTypesEntry: './dist/index.d.ts',
    requiredFiles: ['src/index.ts', 'src/types.ts'],
    entryMatches: [/getReviewState/, /getPublicationProjection/, /applyReviewMutation/, /buildGovernanceSurface/],
    typeMatches: [/interface ReviewStateResponse/, /interface PublicationProjectionResponse/, /interface RuntimeWatchResponse/, /interface GovernanceSurfaceContract/],
  },
  {
    directory: 'packages/redcube-reference-os',
    expectedTypesEntry: './dist/index.d.ts',
    requiredFiles: ['src/index.ts', 'src/types.ts'],
    missingFiles: ['src/index.js', 'src/reference-samples.js', 'src/relative-quality.js'],
    entryMatches: [/buildReferenceQualityReport/, /buildReferencePromotionReport/, /buildReferenceReplacementReport/, /ReferenceQualityReport/],
  },
  {
    directory: 'packages/redcube-runtime-family-xiaohongshu',
    expectedTypesEntry: './dist/index.d.ts',
    packageTsconfigExtends: '../../tsconfig.package-build.json',
    rootReference: true,
    requiredFiles: ['src/index.ts', 'src/types.ts', 'tsconfig.json'],
    entryMatches: [/canRunXiaohongshu/, /runXiaohongshuRoute/],
    typeMatches: [/type XhsRuntimeRoute/, /interface XhsRuntimeContract/, /interface XhsRuntimeRunRequest/, /type XhsRuntimeRouteResult/, /XhsPlanArtifact/, /XhsVisualDirectionArtifact/, /XhsRenderArtifact/],
    typeNoAny: true,
  },
  {
    directory: 'packages/redcube-runtime-family-ppt',
    expectedTypesEntry: './dist/index.d.ts',
    packageTsconfigExtends: '../../tsconfig.package-build.json',
    rootReference: true,
    requiredFiles: ['src/index.ts', 'src/types.ts', 'tsconfig.json'],
    entryMatches: [/canRunPptDeck/, /runPptDeckRoute/],
    typeMatches: [/type PptRuntimeRoute/, /interface PptRuntimeContract/, /interface PptRuntimeRunRequest/, /type PptRuntimeRouteResult/, /PptBlueprintArtifact/, /PptVisualDirectionArtifact/, /PptRenderArtifact/],
    typeNoAny: true,
  },
  {
    directory: 'packages/redcube-runtime-family-poster-onepager',
    expectedTypesEntry: './dist/index.d.ts',
    packageTsconfigExtends: '../../tsconfig.package-build.json',
    rootReference: true,
    requiredFiles: ['src/index.ts', 'src/types.ts', 'tsconfig.json'],
    entryMatches: [/canRunPosterOnepager/, /runPosterOnepagerRoute/],
    typeMatches: [/type PosterRuntimeRoute/, /interface PosterRuntimeContract/, /interface PosterRuntimeRunRequest/, /type PosterRuntimeRouteResult/, /PosterBlueprintArtifact/, /PosterVisualDirectionArtifact/, /PosterRenderArtifact/],
    typeNoAny: true,
  },
  {
    directory: 'packages/redcube-overlay-core',
    expectedTypesEntry: './dist/index.d.ts',
    packageTsconfigExtends: '../../tsconfig.package-build.json',
    rootReference: true,
    requiredFiles: ['src/index.ts', 'src/contracts.ts', 'src/registry.ts', 'src/types.ts', 'tsconfig.json'],
    dependencies: { '@redcube/runtime-protocol': '0.1.0' },
    entryMatches: [/buildDeliverableRecord/, /mergeContractLayers/, /hydrateDeliverableContract/, /createOverlayRegistry/],
    entryDoesNotMatch: [/\bJs\b/],
    typeMatches: [/interface OverlayDefinition/, /interface OverlayRegistry/, /interface HydratedDeliverableContract/],
    typeNoAny: true,
    tsOnlyFiles: ['src/index.ts', 'src/contracts.ts', 'src/registry.ts'],
  },
  {
    directory: 'packages/redcube-overlay-xiaohongshu',
    expectedTypesEntry: './dist/index.d.ts',
    packageTsconfigExtends: '../../tsconfig.package-build.json',
    rootReference: true,
    requiredFiles: ['src/index.ts', 'src/types.ts', 'tsconfig.json'],
    missingFiles: ['src/gates.js'],
    entryMatches: [/buildTopicRecord/, /buildXiaohongshuDeliverableRecord/, /hydrateXiaohongshuContract/, /evaluateStorylineGate/, /buildXiaohongshuSurfaceBundle/, /xiaohongshuOverlay/],
    typeMatches: [/interface XiaohongshuTopicRecord/, /interface XiaohongshuDeliverableRecord/, /interface XiaohongshuHydratedContract/, /interface XiaohongshuStorylineGateReport/, /interface XiaohongshuSurfaceArtifact/, /interface XiaohongshuOverlayDefinition/],
    typeNoAny: true,
    tsOnlyFiles: ['src/index.ts', 'src/contracts.ts', 'src/surface.ts'],
  },
  {
    directory: 'packages/redcube-overlay-ppt',
    expectedTypesEntry: './dist/index.d.ts',
    packageTsconfigExtends: '../../tsconfig.package-build.json',
    rootReference: true,
    requiredFiles: ['src/index.ts', 'src/types.ts', 'tsconfig.json'],
    missingFiles: ['src/gates.js'],
    entryMatches: [/buildDeckRecord/, /PPT_DECK_PROFILES/, /describePptDeckOverlay/, /hydratePptDeckContract/, /evaluateStoryboardGate/, /buildDeckSurfaceBundle/, /pptDeckOverlay/],
    typeMatches: [/interface PptDeckRecord/, /interface PptDeckHydratedContract/, /interface PptDeckStoryboardGateReport/, /interface PptDeckSurfaceArtifact/, /interface PptDeckOverlayDefinition/],
    typeNoAny: true,
    tsOnlyFiles: ['src/index.ts', 'src/contracts.ts', 'src/profiles.ts', 'src/surface.ts'],
  },
]);

function assertPackageMetadata(spec, rootTsconfig, pkg) {
  assert.equal(pkg.types, spec.expectedTypesEntry, spec.directory);
  for (const [dependency, version] of Object.entries(spec.dependencies ?? {})) {
    assert.equal(pkg.dependencies?.[dependency], version, `${spec.directory} ${dependency}`);
  }
  if (spec.packageTsconfigExtends) {
    assert.equal(readJson(path.join(spec.directory, 'tsconfig.json')).extends, spec.packageTsconfigExtends, spec.directory);
  }
  if (spec.rootReference) {
    assertRootReference(rootTsconfig, spec.directory);
  }
}

function assertPackageFiles(spec) {
  for (const file of spec.requiredFiles ?? []) {
    assertFileExists(path.join(spec.directory, file));
  }
  for (const file of spec.missingFiles ?? []) {
    assertFileMissing(path.join(spec.directory, file));
  }
  for (const file of spec.tsOnlyFiles ?? []) {
    assertTsOnlySource(path.join(spec.directory, file));
  }
}

function assertPackageTextPatterns(spec, entry, types) {
  for (const pattern of spec.entryMatches ?? []) {
    assert.match(entry, pattern, spec.directory);
  }
  for (const pattern of spec.entryDoesNotMatch ?? []) {
    assert.doesNotMatch(entry, pattern, spec.directory);
  }
  for (const pattern of spec.typeMatches ?? []) {
    assert.match(types, pattern, spec.directory);
  }
  if (spec.typeNoAny) {
    assert.doesNotMatch(types, /\bany\b/, spec.directory);
  }
}

function assertPackageSurface(spec, rootTsconfig) {
  const pkg = readJson(path.join(spec.directory, 'package.json'));
  const entry = read(path.join(spec.directory, 'src/index.ts'));
  const typeFiles = spec.typeFiles ?? ['src/types.ts'];
  const types = typeFiles.map((file) => read(path.join(spec.directory, file))).join('\n');

  assertPackageMetadata(spec, rootTsconfig, pkg);
  assertPackageFiles(spec);
  assertPackageTextPatterns(spec, entry, types);
}

function findRuntimeProgramContracts(dir = 'contracts/runtime-program') {
  return readdirSync(path.resolve(dir), { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
    .map((entry) => path.join(dir, entry.name))
    .sort();
}

test('TypeScript package surface guard keeps package entrypoints, typed contracts, and overlay shells explicit', () => {
  const rootTsconfig = readJson('tsconfig.json');

  for (const spec of PACKAGE_SURFACES) {
    assertPackageSurface(spec, rootTsconfig);
  }
});

test('runtime program contracts do not pin human docs paths', () => {
  const prosePathPattern = /(?:^|["'\s:[{,])(?:README(?:\.zh-CN)?\.md|docs\/[^"'\s\]]+?\.md(?:#[^"'\s\]]*)?)/;

  for (const contractFile of findRuntimeProgramContracts()) {
    const raw = read(contractFile);
    assert.doesNotMatch(raw, prosePathPattern, `${contractFile} must use machine paths or human_doc:* semantic refs`);
  }
});
