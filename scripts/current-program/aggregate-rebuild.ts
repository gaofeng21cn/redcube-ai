import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { isDeepStrictEqual } from 'node:util';

import {
  AGGREGATE_SNAPSHOT_REF,
  ASSEMBLY_REF,
  INDEX_REF,
  MANIFEST_REF,
  PARTS_ROOT,
  buildCurrentProgramSourceIndexFromAggregate,
  childSegmentMap,
  listJsonFiles,
  pointerSegment,
  readJson,
  sourcePartRefsFromAggregate,
  sourcePartRefsFromFiles,
  stable,
  valueAtJsonPointer,
} from './leaf-index.ts';
import type { SourcePartRef } from './leaf-index.ts';
import {
  buildCurrentProgramAssembly,
  buildCurrentProgramPackBundleManifestForSourceIndex,
} from './bundle-manifest.ts';

function buildContainer(pointer: string, children: Map<string, Set<string>>): unknown {
  const childSegments = children.get(pointer);
  if (childSegments && [...childSegments].every((segment) => /^\d+$/.test(segment))) {
    return [];
  }
  return {};
}

function setJsonPointerValue(document: any, pointer: string, value: unknown, children: Map<string, Set<string>>) {
  const segments = pointer.slice(1).split('/').filter(Boolean).map((part) => part.replace(/~1/g, '/').replace(/~0/g, '~'));
  let cursor = document;
  for (let index = 0; index < segments.length; index += 1) {
    const segment = segments[index];
    const childPointer = `/${segments.slice(0, index + 1).map(pointerSegment).join('/')}`;
    const isLast = index === segments.length - 1;
    if (isLast) {
      cursor[segment] = value;
      return;
    }
    if (cursor[segment] === undefined) {
      cursor[segment] = buildContainer(childPointer, children);
    }
    cursor = cursor[segment];
  }
}

function reorderLikeTemplate(value: any, template: any): unknown {
  if (Array.isArray(value)) {
    return value.map((item, index) => reorderLikeTemplate(item, Array.isArray(template) ? template[index] : undefined));
  }
  if (!value || typeof value !== 'object') return value;

  const ordered: Record<string, unknown> = {};
  const valueObject = value as Record<string, unknown>;
  const templateKeys = template && typeof template === 'object' && !Array.isArray(template)
    ? Object.keys(template)
    : [];
  for (const key of templateKeys) {
    if (Object.prototype.hasOwnProperty.call(valueObject, key)) {
      ordered[key] = reorderLikeTemplate(valueObject[key], template[key]);
    }
  }
  for (const key of Object.keys(valueObject)) {
    if (!Object.prototype.hasOwnProperty.call(ordered, key)) {
      ordered[key] = reorderLikeTemplate(valueObject[key], undefined);
    }
  }
  return ordered;
}

function removeEmptyDirectories(root: string) {
  if (!fs.existsSync(path.resolve(root))) return;
  for (const entry of fs.readdirSync(path.resolve(root), { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    removeEmptyDirectories(path.join(root, entry.name));
  }
  if (root !== PARTS_ROOT && fs.readdirSync(path.resolve(root)).length === 0) {
    fs.rmdirSync(path.resolve(root));
  }
}

function writeFile(relativePath: string, content: string) {
  const absolutePath = path.resolve(relativePath);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, content);
}

function syncSourcePartsFromAggregate() {
  const currentProgram = readJson(AGGREGATE_SNAPSHOT_REF);
  const sourcePartRefs = sourcePartRefsFromAggregate(currentProgram);
  const expectedRefs = new Set(sourcePartRefs.map((sourcePart) => sourcePart.ref));

  for (const existingRef of listJsonFiles(PARTS_ROOT)) {
    if (!expectedRefs.has(existingRef)) {
      fs.rmSync(path.resolve(existingRef));
    }
  }
  for (const sourcePartRef of sourcePartRefs) {
    writeFile(
      sourcePartRef.ref,
      stable(valueAtJsonPointer(currentProgram, sourcePartRef.json_pointer)),
    );
  }
  removeEmptyDirectories(PARTS_ROOT);
}

function assembleCurrentProgramFromParts(sourcePartRefs = sourcePartRefsFromFiles()) {
  const children = childSegmentMap(sourcePartRefs);
  const assembled: Record<string, unknown> = {};
  for (const sourcePartRef of sourcePartRefs) {
    setJsonPointerValue(assembled, sourcePartRef.json_pointer, readJson(sourcePartRef.ref), children);
  }
  if (fs.existsSync(path.resolve(AGGREGATE_SNAPSHOT_REF))) {
    return reorderLikeTemplate(assembled, readJson(AGGREGATE_SNAPSHOT_REF));
  }
  return assembled;
}

export function buildCurrentProgramSourceIndex(currentProgram = assembleCurrentProgramFromParts()) {
  return buildCurrentProgramSourceIndexFromAggregate(currentProgram);
}

export function buildCurrentProgramPackBundleManifest(sourceIndex = buildCurrentProgramSourceIndex()) {
  return buildCurrentProgramPackBundleManifestForSourceIndex(sourceIndex);
}

function expectedGeneratedFiles() {
  const sourcePartRefs = sourcePartRefsFromFiles();
  const aggregate = assembleCurrentProgramFromParts(sourcePartRefs);
  const sourceIndex = buildCurrentProgramSourceIndex(aggregate);
  const bundleManifest = buildCurrentProgramPackBundleManifest(sourceIndex);
  const assembly = buildCurrentProgramAssembly(sourcePartRefs);
  return new Map([
    [AGGREGATE_SNAPSHOT_REF, stable(aggregate)],
    [INDEX_REF, stable(sourceIndex)],
    [MANIFEST_REF, stable(bundleManifest)],
    [ASSEMBLY_REF, stable(assembly)],
  ]);
}

function compareFile(relativePath: string, expected: string, mismatches: string[]) {
  const absolutePath = path.resolve(relativePath);
  if (!fs.existsSync(absolutePath)) {
    mismatches.push(`missing ${relativePath}`);
    return;
  }
  const actual = fs.readFileSync(absolutePath, 'utf-8');
  if (actual !== expected) {
    mismatches.push(`stale ${relativePath}`);
  }
}

export function checkCurrentProgramLeafIndex() {
  const mismatches: string[] = [];

  const expectedFiles = expectedGeneratedFiles();
  for (const [relativePath, expected] of expectedFiles) {
    compareFile(relativePath, expected, mismatches);
  }

  const currentProgram = readJson(AGGREGATE_SNAPSHOT_REF);
  const index = readJson(INDEX_REF);
  for (const leaf of index.source_part_refs as SourcePartRef[]) {
    assert.deepEqual(
      readJson(leaf.ref),
      valueAtJsonPointer(currentProgram, leaf.json_pointer),
      leaf.ref,
    );
  }

  return {
    ok: mismatches.length === 0,
    mismatches,
    source_part_ref_count: index.source_part_refs.length,
    leaf_ref_count: index.source_part_refs.length,
  };
}

export function syncCurrentProgramLeafIndex() {
  syncSourcePartsFromAggregate();
  const expectedFiles = expectedGeneratedFiles();
  for (const [relativePath, content] of expectedFiles) {
    writeFile(relativePath, content);
  }

  const index = readJson(INDEX_REF);
  return {
    source_part_ref_count: index.source_part_refs.length,
    leaf_ref_count: index.source_part_refs.length,
  };
}

export function assertGeneratedManifestMatchesSourceParts() {
  const generated = buildCurrentProgramSourceIndex(assembleCurrentProgramFromParts());
  const tracked = readJson(INDEX_REF);
  assert.equal(isDeepStrictEqual(tracked, generated), true);
}
