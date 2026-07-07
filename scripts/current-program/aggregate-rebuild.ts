import fs from 'node:fs';
import path from 'node:path';

import {
  AGGREGATE_SNAPSHOT_REF,
  INDEX_REF,
  PARTS_ROOT,
  buildCurrentProgramSourceIndexFromParts,
  childSegmentMap,
  listJsonFiles,
  pointerSegment,
  readJson,
  sourcePartRefsFromFiles,
  stable,
} from './leaf-index.ts';
import type { SourcePartRef } from './leaf-index.ts';

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

function writeFile(relativePath: string, content: string) {
  const absolutePath = path.resolve(relativePath);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, content);
}

export function assembleCurrentProgramFromParts(sourcePartRefs = sourcePartRefsFromFiles()) {
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

export function buildCurrentProgramSourceIndex() {
  return buildCurrentProgramSourceIndexFromParts();
}

function expectedGeneratedFiles() {
  const sourceIndex = buildCurrentProgramSourceIndex();
  return new Map([
    [INDEX_REF, stable(sourceIndex)],
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

  const index = readJson(INDEX_REF);
  const indexedRefs = new Set((index.source_part_refs as SourcePartRef[]).map((leaf) => leaf.ref));
  const sourceRefs = new Set(listJsonFiles(PARTS_ROOT));
  for (const sourceRef of sourceRefs) {
    if (!indexedRefs.has(sourceRef)) mismatches.push(`unindexed ${sourceRef}`);
  }
  for (const leaf of index.source_part_refs as SourcePartRef[]) {
    if (!sourceRefs.has(leaf.ref)) mismatches.push(`missing source part ${leaf.ref}`);
  }

  return {
    ok: mismatches.length === 0,
    mismatches,
    source_part_ref_count: index.source_part_refs.length,
    leaf_ref_count: index.source_part_refs.length,
  };
}

export function syncCurrentProgramLeafIndex() {
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
