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
    entryMatches: [/export \{ createDeliverable \}/, /export \{ getDeliverable \}/, /export \{ runDeliverableRoute \}/],
    entryDoesNotMatch: [
      /\bCreateDeliverableRequest\b/,
      /\bDeliverableAuditRequest\b/,
      /\bDeliverableAuditResponse\b/,
      /\bDomainEntryRequest\b/,
      /\bFamilyOrchestrationGatePreview\b/,
      /\bFamilyOrchestrationReferenceRef\b/,
      /\bOplHostedProductEntryRequest\b/,
      /\bOplHostedProductEntryResponse\b/,
      /\bProductPreflightResponse\b/,
      /\bTopicCatalogResponse\b/,
      /\bReviewMutationRequest\b/,
      /\bReviewMutationResponse\b/,
      /\bReviewRenderOutputRequest\b/,
      /\bReviewRenderOutputResponse\b/,
      /\bRunSourceFirstFanoutRequest\b/,
      /\bSourceFirstFanoutResponse\b/,
      /\bRuntimeWatchResponse\b/,
    ],
    typeFiles: ['src/types.ts', 'src/types-parts/foundation.ts', 'src/types-parts/product-entry.ts'],
    typeMatches: [/export interface WorkspaceDoctorResponse/, /export interface RouteRunResponse/],
  },
  {
    directory: 'packages/redcube-governance',
    expectedTypesEntry: './dist/index.d.ts',
    requiredFiles: ['src/index.ts', 'src/types.ts'],
    entryMatches: [/getReviewState/, /getPublicationProjection/, /applyReviewMutation/, /buildGovernanceSurface/],
    typeMatches: [/interface ReviewStateResponse/, /interface PublicationProjectionResponse/, /interface RuntimeWatchResponse/, /interface GovernanceSurfaceContract/],
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
    directory: 'packages/redcube-runtime',
    expectedTypesEntry: './dist/index.d.ts',
    packageTsconfigExtends: '../../tsconfig.package-build.json',
    rootReference: true,
    requiredFiles: [
      'src/index.ts',
      'src/types.ts',
      'src/families/ppt/overlay/index.ts',
      'src/families/ppt/overlay/types.ts',
      'src/families/xiaohongshu/overlay/index.ts',
      'src/families/xiaohongshu/overlay/types.ts',
      'src/families/poster-onepager/overlay/index.ts',
      'src/families/poster-onepager/overlay/types.ts',
      'tsconfig.json',
    ],
    dependencies: {
      '@redcube/redcube-config': '0.1.0',
      '@redcube/runtime-protocol': '0.1.0',
      '@redcube/governance': '0.1.0',
      '@redcube/overlay-core': '0.1.0',
    },
    entryMatches: [
      /buildTopicRecord/,
      /buildXiaohongshuDeliverableRecord/,
      /buildXiaohongshuSurfaceBundle/,
      /describeXiaohongshuOverlay/,
      /hydrateXiaohongshuContract/,
      /evaluateStorylineGate/,
      /listXiaohongshuSurfaceArtifactPaths/,
      /validateXiaohongshuSurfaceArtifact/,
      /xiaohongshuOverlay/,
      /buildDeckSurfaceBundle/,
      /buildDeckRecord/,
      /PPT_DECK_PROFILES/,
      /describePptDeckOverlay/,
      /hydratePptDeckContract/,
      /evaluateStoryboardGate/,
      /listDeckSurfaceArtifactPaths/,
      /pptDeckOverlay/,
      /validateDeckSurfaceArtifact/,
      /buildPosterOnepagerDeliverableRecord/,
      /buildPosterSurfaceBundle/,
      /describePosterOnepagerOverlay/,
      /evaluatePosterStorylineGate/,
      /hydratePosterOnepagerContract/,
      /listPosterSurfaceArtifactPaths/,
      /posterOnepagerOverlay/,
      /validatePosterSurfaceArtifact/,
    ],
    entryDoesNotMatch: [
      /@redcube\/overlay-ppt/,
      /@redcube\/overlay-xiaohongshu/,
      /@redcube\/overlay-poster-onepager/,
    ],
    typeFiles: [
      'src/types.ts',
      'src/families/ppt/overlay/types.ts',
      'src/families/xiaohongshu/overlay/types.ts',
      'src/families/poster-onepager/overlay/types.ts',
    ],
    typeMatches: [
      /interface RuntimeRunRecord/,
      /interface XiaohongshuTopicRecord/,
      /interface XiaohongshuDeliverableRecord/,
      /interface XiaohongshuHydratedContract/,
      /interface PptDeckRecord/,
      /interface PptDeckHydratedContract/,
      /interface PptDeckStoryboardGateReport/,
      /interface PosterOnepagerHydratedContract/,
      /interface PosterOnepagerOverlayDefinition/,
    ],
    tsOnlyFiles: [
      'src/index.ts',
      'src/families/ppt/overlay/index.ts',
      'src/families/ppt/overlay/contracts.ts',
      'src/families/ppt/overlay/profiles.ts',
      'src/families/ppt/overlay/surface.ts',
      'src/families/xiaohongshu/overlay/index.ts',
      'src/families/xiaohongshu/overlay/contracts.ts',
      'src/families/xiaohongshu/overlay/surface.ts',
      'src/families/poster-onepager/overlay/index.ts',
      'src/families/poster-onepager/overlay/contracts.ts',
      'src/families/poster-onepager/overlay/surface.ts',
    ],
  },
]);

const RETIRED_OVERLAY_PACKAGE_DIRS = Object.freeze([
  'packages/redcube-overlay-ppt',
  'packages/redcube-overlay-xiaohongshu',
  'packages/redcube-overlay-poster-onepager',
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

  for (const directory of RETIRED_OVERLAY_PACKAGE_DIRS) {
    assertFileMissing(directory);
    assert.equal(
      rootTsconfig.references.some((entrypoint) => entrypoint.path === `./${directory}`),
      false,
      `${directory} must not stay a root TypeScript project reference`,
    );
  }
});

test('runtime program contracts do not pin human docs paths', () => {
  const prosePathPattern = /(?:^|["'\s:[{,])(?:README(?:\.zh-CN)?\.md|docs\/[^"'\s\]]+?\.md(?:#[^"'\s\]]*)?)/;

  for (const contractFile of findRuntimeProgramContracts()) {
    const raw = read(contractFile);
    assert.doesNotMatch(raw, prosePathPattern, `${contractFile} must use machine paths or human_doc:* semantic refs`);
  }
});
