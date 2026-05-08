// @ts-nocheck
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import {
  existsSync,
  readdirSync,
  readFileSync,
} from 'node:fs';

const SOURCE_ROOTS = ['apps', 'packages'];
const DEPENDENCY_FIELDS = ['dependencies', 'devDependencies', 'peerDependencies'];

const LAYER_BY_PACKAGE = new Map([
  ['@redcube/cli', 'app'],
  ['@redcube/mcp', 'app'],
  ['@redcube/gateway', 'gateway'],
  ['@redcube/runtime', 'runtime'],
  ['@redcube/runtime-family-registry', 'runtime-family-registry'],
  ['@redcube/runtime-family-ppt', 'runtime-family'],
  ['@redcube/runtime-family-xiaohongshu', 'runtime-family'],
  ['@redcube/runtime-family-poster-onepager', 'runtime-family'],
  ['@redcube/overlay-core', 'overlay'],
  ['@redcube/overlay-registry', 'overlay'],
  ['@redcube/overlay-ppt', 'overlay'],
  ['@redcube/overlay-xiaohongshu', 'overlay'],
  ['@redcube/overlay-poster-onepager', 'overlay'],
  ['@redcube/pack-ppt', 'pack'],
  ['@redcube/pack-xiaohongshu', 'pack'],
  ['@redcube/pack-poster-onepager', 'pack'],
  ['@redcube/runtime-protocol', 'protocol'],
  ['@redcube/redcube-config', 'config'],
  ['@redcube/reference-os', 'reference'],
  ['@redcube/governance', 'governance'],
  ['@redcube/codex-cli-client', 'client'],
]);

const ALLOWED_DEPENDENCY_LAYERS = new Map([
  ['app', new Set(['gateway', 'config'])],
  ['gateway', new Set(['overlay', 'runtime', 'protocol'])],
  ['runtime', new Set(['client', 'config', 'governance', 'overlay', 'reference', 'runtime-family-registry', 'protocol', 'substrate'])],
  ['runtime-family-registry', new Set(['runtime-family'])],
  ['runtime-family', new Set(['client', 'config', 'governance', 'overlay', 'pack', 'reference', 'protocol', 'substrate'])],
  ['overlay', new Set(['overlay', 'pack', 'protocol'])],
  ['pack', new Set(['pack', 'protocol'])],
  ['protocol', new Set(['protocol'])],
  ['config', new Set(['config', 'protocol'])],
  ['reference', new Set(['reference', 'protocol'])],
  ['governance', new Set(['overlay', 'protocol'])],
  ['client', new Set(['protocol', 'substrate'])],
  ['substrate', new Set(['protocol'])],
]);

function readJson(file) {
  return JSON.parse(readFileSync(file, 'utf-8'));
}

function listPackageJsonFiles() {
  return SOURCE_ROOTS.flatMap((root) => readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(root, entry.name, 'package.json'))
    .filter((file) => existsSync(file)));
}

function listSourceFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const child = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return listSourceFiles(child);
    }
    return entry.isFile() && entry.name.endsWith('.ts') ? [child] : [];
  });
}

function packageNameForSpecifier(specifier, workspacePackageNames) {
  if (workspacePackageNames.has(specifier)) {
    return specifier;
  }

  const parts = specifier.split('/');
  if (parts.length < 3) {
    return null;
  }

  const packageName = parts.slice(0, 2).join('/');
  return workspacePackageNames.has(packageName) ? packageName : null;
}

function extractRedCubeImports(source) {
  const specifiers = [];
  const patterns = [
    /\bimport\s+(?:type\s+)?[\s\S]*?\bfrom\s*['"](@redcube\/[^'"]+)['"]/g,
    /\bimport\s*['"](@redcube\/[^'"]+)['"]/g,
    /\bexport\s+(?:type\s+)?[\s\S]*?\bfrom\s*['"](@redcube\/[^'"]+)['"]/g,
    /\bimport\s*\(\s*['"](@redcube\/[^'"]+)['"]\s*\)/g,
  ];

  for (const pattern of patterns) {
    for (const match of source.matchAll(pattern)) {
      specifiers.push(match[1]);
    }
  }
  return specifiers;
}

function declaredDependencyNames(packageJson) {
  return new Set(DEPENDENCY_FIELDS.flatMap((field) => Object.keys(packageJson[field] ?? {})));
}

function buildWorkspacePackageIndex() {
  const entries = listPackageJsonFiles().map((packageJsonFile) => {
    const packageJson = readJson(packageJsonFile);
    return {
      packageJson,
      packageJsonFile,
      packageName: packageJson.name,
      sourceRoot: path.join(path.dirname(packageJsonFile), 'src'),
    };
  });

  return {
    entries,
    packageNames: new Set(entries.map((entry) => entry.packageName)),
  };
}

test('workspace @redcube imports declare dependencies and respect architecture layer direction', () => {
  const workspace = buildWorkspacePackageIndex();
  const dependencyFailures = [];
  const boundaryFailures = [];

  for (const entry of workspace.entries) {
    assert.ok(LAYER_BY_PACKAGE.has(entry.packageName), `missing layer assignment for ${entry.packageName}`);

    if (!existsSync(entry.sourceRoot)) {
      continue;
    }

    const declaredDependencies = declaredDependencyNames(entry.packageJson);
    const importerLayer = LAYER_BY_PACKAGE.get(entry.packageName);
    const allowedLayers = ALLOWED_DEPENDENCY_LAYERS.get(importerLayer);
    assert.ok(allowedLayers, `missing allow matrix for layer ${importerLayer}`);

    for (const sourceFile of listSourceFiles(entry.sourceRoot)) {
      const source = readFileSync(sourceFile, 'utf-8');
      for (const specifier of extractRedCubeImports(source)) {
        const importedPackageName = packageNameForSpecifier(specifier, workspace.packageNames);
        assert.ok(importedPackageName, `${sourceFile} imports unknown workspace package specifier ${specifier}`);
        if (importedPackageName === entry.packageName) {
          continue;
        }

        if (!declaredDependencies.has(importedPackageName)) {
          dependencyFailures.push(`${entry.packageName} imports ${specifier} in ${sourceFile} but does not declare ${importedPackageName}`);
        }

        const dependencyLayer = LAYER_BY_PACKAGE.get(importedPackageName);
        assert.ok(dependencyLayer, `missing layer assignment for ${importedPackageName}`);
        if (!allowedLayers.has(dependencyLayer)) {
          boundaryFailures.push(`${entry.packageName} (${importerLayer}) imports ${specifier} (${dependencyLayer}) in ${sourceFile}`);
        }
      }
    }
  }

  assert.deepEqual(dependencyFailures, []);
  assert.deepEqual(boundaryFailures, []);
});
