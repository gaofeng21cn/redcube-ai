// @ts-nocheck
import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { isDeepStrictEqual } from 'node:util';

const AGGREGATE_SNAPSHOT_REF = 'contracts/runtime-program/current-program.json';
const INDEX_REF = 'contracts/runtime-program/current-program.index.json';
const ASSEMBLY_REF = 'contracts/runtime-program/current-program.assembly.json';
const PARTS_ROOT = 'contracts/runtime-program/current-program-parts';
const MAX_LEAF_JSON_LINE_COUNT = 800;

const SECTION_ROOTS = Object.freeze([
  {
    section_id: 'program_id',
    aggregate_json_pointer: '/program_id',
    ref_root: `${PARTS_ROOT}/program_id.json`,
    ref_kind: 'single_leaf_ref',
    role: 'current_program_support_section',
  },
  {
    section_id: 'date_anchor',
    aggregate_json_pointer: '/date_anchor',
    ref_root: `${PARTS_ROOT}/date_anchor.json`,
    ref_kind: 'single_leaf_ref',
    role: 'current_program_support_section',
  },
  {
    section_id: 'product_release_metadata',
    aggregate_json_pointer: '/product_release_metadata',
    ref_root: `${PARTS_ROOT}/product_release_metadata`,
    ref_kind: 'leaf_ref_directory',
    role: 'current_program_support_section',
  },
  {
    section_id: 'longrun_goal',
    aggregate_json_pointer: '/longrun_goal',
    ref_root: `${PARTS_ROOT}/longrun_goal.json`,
    ref_kind: 'single_leaf_ref',
    role: 'current_program_support_section',
  },
  {
    section_id: 'formal_entry',
    aggregate_json_pointer: '/formal_entry',
    ref_root: `${PARTS_ROOT}/formal_entry.json`,
    ref_kind: 'single_leaf_ref',
    role: 'current_program_support_section',
  },
  {
    section_id: 'execution_handle_contract',
    aggregate_json_pointer: '/execution_handle_contract',
    ref_root: `${PARTS_ROOT}/execution_handle_contract.json`,
    ref_kind: 'single_leaf_ref',
    role: 'current_program_support_section',
  },
  {
    section_id: 'durable_surface_contract',
    aggregate_json_pointer: '/durable_surface_contract',
    ref_root: `${PARTS_ROOT}/durable_surface_contract.json`,
    ref_kind: 'single_leaf_ref',
    role: 'current_program_support_section',
  },
  {
    section_id: 'current_state',
    aggregate_json_pointer: '/current_state',
    ref_root: `${PARTS_ROOT}/current_state`,
    ref_kind: 'leaf_ref_directory',
    role: 'active_current_truth_section',
  },
  {
    section_id: 'historical_snapshots',
    aggregate_json_pointer: '/historical_snapshots',
    ref_root: `${PARTS_ROOT}/historical_snapshots.json`,
    ref_kind: 'single_leaf_ref',
    role: 'current_program_support_section',
  },
]);

function stable(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function sha256(content: string): string {
  return crypto.createHash('sha256').update(content).digest('hex');
}

function lineCount(value: unknown): number {
  return stable(value).split('\n').length - 1;
}

function readJson(file: string): unknown {
  return JSON.parse(fs.readFileSync(path.resolve(file), 'utf-8'));
}

function valueAtJsonPointer(document: unknown, pointer: string): unknown {
  if (pointer === '') return document;
  return pointer
    .slice(1)
    .split('/')
    .map((part) => part.replace(/~1/g, '/').replace(/~0/g, '~'))
    .reduce((value, part) => value[part], document);
}

function pointerSegment(segment: string): string {
  return segment.replace(/~/g, '~0').replace(/\//g, '~1');
}

function pathSegment(segment: string): string {
  return segment.replace(/[^a-zA-Z0-9._-]/g, '_');
}

function pointerFromPartRef(ref: string): string {
  const relative = path.relative(PARTS_ROOT, ref).split(path.sep).join('/');
  const withoutExtension = relative.replace(/\.json$/, '');
  return `/${withoutExtension
    .split('/')
    .map((segment) => (/^\d+$/.test(segment) ? String(Number(segment)) : segment))
    .map(pointerSegment)
    .join('/')}`;
}

function childEntries(value: unknown): Array<[string, unknown]> {
  if (Array.isArray(value)) {
    return value.map((item, index) => [String(index), item]);
  }
  if (value && typeof value === 'object') {
    return Object.keys(value).map((key) => [key, value[key]]);
  }
  return [];
}

function refPathFor(pointer: string): string {
  const segments = pointer.slice(1).split('/').map((part) => part.replace(/~1/g, '/').replace(/~0/g, '~'));
  const fileSegments = segments.map((segment) => (/^\d+$/.test(segment) ? segment.padStart(4, '0') : pathSegment(segment)));
  return `${PARTS_ROOT}/${fileSegments.join('/')}.json`;
}

function leafRole(pointer: string): string {
  return pointer.startsWith('/current_state') ? 'active_current_truth_leaf_source' : 'current_program_leaf_source';
}

function collectLeaves(value: unknown, pointer: string, forcedLeaf = false): Array<unknown> {
  const children = childEntries(value);
  if (forcedLeaf || children.length === 0 || lineCount(value) <= MAX_LEAF_JSON_LINE_COUNT) {
    return [{
      json_pointer: pointer,
      ref: refPathFor(pointer),
      role: leafRole(pointer),
      line_count: lineCount(value),
    }];
  }

  return children.flatMap(([key, child]) => (
    collectLeaves(child, `${pointer}/${pointerSegment(key)}`)
  ));
}

export function buildCurrentProgramLeafIndex(currentProgram = readJson(AGGREGATE_SNAPSHOT_REF)) {
  const leafRefs = SECTION_ROOTS.flatMap((section) => {
    const value = valueAtJsonPointer(currentProgram, section.aggregate_json_pointer);
    return collectLeaves(value, section.aggregate_json_pointer, section.ref_kind === 'single_leaf_ref');
  }).sort((left, right) => left.json_pointer.localeCompare(right.json_pointer));

  return {
    surface_kind: 'rca_current_program_leaf_index',
    schema_version: 2,
    program_id: currentProgram.program_id,
    date_anchor: currentProgram.date_anchor,
    aggregate_snapshot_ref: AGGREGATE_SNAPSHOT_REF,
    aggregate_snapshot_role: 'generated_read_through_snapshot_for_existing_consumers',
    canonical_truth_model: 'leaf_refs_are_canonical_current_program_sources',
    no_second_truth_rule: 'current-program.json must mirror every indexed leaf ref at JSON pointer level',
    split_policy: {
      max_leaf_json_line_count: MAX_LEAF_JSON_LINE_COUNT,
      large_objects_and_arrays_are_split_recursively: true,
      aggregate_snapshot_is_not_canonical_edit_surface: true,
    },
    section_roots: SECTION_ROOTS,
    leaf_refs: leafRefs,
  };
}

function listJsonFiles(root: string): string[] {
  if (!fs.existsSync(path.resolve(root))) return [];
  return fs.readdirSync(path.resolve(root), { withFileTypes: true }).flatMap((entry) => {
    const absolute = path.resolve(root, entry.name);
    const relative = path.relative(process.cwd(), absolute).split(path.sep).join('/');
    if (entry.isDirectory()) return listJsonFiles(relative);
    return entry.isFile() && entry.name.endsWith('.json') ? [relative] : [];
  });
}

function childSegmentMap(sourcePartRefs: Array<{ json_pointer: string }>): Map<string, Set<string>> {
  const children = new Map<string, Set<string>>();
  for (const sourcePartRef of sourcePartRefs) {
    const segments = sourcePartRef.json_pointer.slice(1).split('/').filter(Boolean);
    for (let index = 0; index < segments.length; index += 1) {
      const parent = `/${segments.slice(0, index).join('/')}`.replace(/\/$/, '') || '';
      if (!children.has(parent)) children.set(parent, new Set());
      children.get(parent)!.add(segments[index]);
    }
  }
  return children;
}

function orderedSourcePartRefs(sourcePartRefs: Array<unknown>): Array<unknown> {
  const orderBySection = new Map(SECTION_ROOTS.map((section, index) => [section.aggregate_json_pointer, index]));
  const sectionFor = (pointer: string) => SECTION_ROOTS.find((section) => (
    pointer === section.aggregate_json_pointer || pointer.startsWith(`${section.aggregate_json_pointer}/`)
  ));
  const order = (pointer: string) => orderBySection.get(sectionFor(pointer)?.aggregate_json_pointer) ?? Number.MAX_SAFE_INTEGER;

  return [...sourcePartRefs].sort((left, right) => (
    order(left.json_pointer) - order(right.json_pointer)
      || left.json_pointer.localeCompare(right.json_pointer)
  ));
}

function generatedArrayFields(sourcePartRefs: Array<{ json_pointer: string }>): string[] {
  const children = childSegmentMap(sourcePartRefs);
  return [...children.entries()]
    .filter(([, childSegments]) => childSegments.size > 0 && [...childSegments].every((segment) => /^\d+$/.test(segment)))
    .map(([pointer]) => pointer || '')
    .sort((left, right) => left.localeCompare(right));
}

function buildContainer(pointer: string, children: Map<string, Set<string>>): unknown {
  const childSegments = children.get(pointer);
  if (childSegments && [...childSegments].every((segment) => /^\d+$/.test(segment))) {
    return [];
  }
  return {};
}

function setJsonPointerValue(document: unknown, pointer: string, value: unknown, children: Map<string, Set<string>>) {
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

function reorderLikeTemplate(value: unknown, template: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item, index) => reorderLikeTemplate(item, Array.isArray(template) ? template[index] : undefined));
  }
  if (!value || typeof value !== 'object') return value;

  const ordered = {};
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

function sourcePartRefsFromFiles(): Array<unknown> {
  return orderedSourcePartRefs(listJsonFiles(PARTS_ROOT)
    .map((ref) => {
      const value = readJson(ref);
      const content = stable(value);
      const jsonPointer = pointerFromPartRef(ref);
      return {
        json_pointer: jsonPointer,
        ref,
        role: leafRole(jsonPointer),
        line_count: lineCount(value),
        sha256: sha256(content),
      };
    }));
}

function assembleCurrentProgramFromParts(sourcePartRefs = sourcePartRefsFromFiles()) {
  const children = childSegmentMap(sourcePartRefs);
  const assembled = {};
  for (const sourcePartRef of sourcePartRefs) {
    setJsonPointerValue(assembled, sourcePartRef.json_pointer, readJson(sourcePartRef.ref), children);
  }
  if (fs.existsSync(path.resolve(AGGREGATE_SNAPSHOT_REF))) {
    return reorderLikeTemplate(assembled, readJson(AGGREGATE_SNAPSHOT_REF));
  }
  return assembled;
}

function buildCurrentProgramAssembly(sourcePartRefs = sourcePartRefsFromFiles()) {
  return {
    surface_kind: 'rca_current_program_pack_bundle_assembly',
    schema_version: 1,
    source_root_ref: PARTS_ROOT,
    aggregate_ref: AGGREGATE_SNAPSHOT_REF,
    manifest_ref: INDEX_REF,
    generated_array_fields: generatedArrayFields(sourcePartRefs),
    generated_aggregate_role: 'generated_read_through_snapshot_for_existing_consumers',
    canonical_truth_model: 'source_parts_are_canonical_current_program_sources',
    source_part_contract: {
      part_ref_path_rule: 'source_root_ref plus JSON pointer path segments; array indexes are zero-padded to four digits',
      max_part_json_line_count: MAX_LEAF_JSON_LINE_COUNT,
      aggregate_must_be_rebuilt_from_parts: true,
    },
  };
}

export function buildCurrentProgramPackBundleManifest() {
  const sourcePartRefs = sourcePartRefsFromFiles();
  const currentProgram = assembleCurrentProgramFromParts(sourcePartRefs);
  return {
    surface_kind: 'rca_current_program_pack_bundle_manifest',
    schema_version: 3,
    program_id: currentProgram.program_id,
    date_anchor: currentProgram.date_anchor,
    assembly_ref: ASSEMBLY_REF,
    source_root_ref: PARTS_ROOT,
    aggregate_ref: AGGREGATE_SNAPSHOT_REF,
    aggregate_role: 'generated_read_through_snapshot_for_existing_consumers',
    canonical_truth_model: 'source_parts_are_canonical_current_program_sources',
    no_second_truth_rule: 'current-program.json is generated from current-program-parts and must not be edited as the canonical source',
    split_policy: {
      max_part_json_line_count: MAX_LEAF_JSON_LINE_COUNT,
      large_objects_and_arrays_are_split_recursively: true,
      aggregate_snapshot_is_not_canonical_edit_surface: true,
    },
    section_roots: SECTION_ROOTS.map((section) => ({
      section_id: section.section_id,
      aggregate_json_pointer: section.aggregate_json_pointer,
      source_root_ref: section.ref_root,
      source_kind: section.ref_kind === 'single_leaf_ref' ? 'single_source_part' : 'source_part_directory',
      role: section.role,
    })),
    generated_array_fields: generatedArrayFields(sourcePartRefs),
    source_part_refs: sourcePartRefs,
    leaf_refs: sourcePartRefs,
  };
}

function expectedGeneratedFiles() {
  const sourcePartRefs = sourcePartRefsFromFiles();
  const aggregate = assembleCurrentProgramFromParts(sourcePartRefs);
  const manifest = buildCurrentProgramPackBundleManifest();
  const assembly = buildCurrentProgramAssembly(sourcePartRefs);
  return new Map([
    [AGGREGATE_SNAPSHOT_REF, stable(aggregate)],
    [INDEX_REF, stable(manifest)],
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
  for (const leaf of index.source_part_refs) {
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

function writeFile(relativePath: string, content: string) {
  const absolutePath = path.resolve(relativePath);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, content);
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

function assertGeneratedManifestMatchesSourceParts() {
  const generated = buildCurrentProgramPackBundleManifest();
  const tracked = readJson(INDEX_REF);
  assert.equal(isDeepStrictEqual(tracked, generated), true);
}

function runCli() {
  const args = new Set(process.argv.slice(2));
  if (args.has('--check')) {
    assertGeneratedManifestMatchesSourceParts();
    const result = checkCurrentProgramLeafIndex();
    if (!result.ok) {
      for (const mismatch of result.mismatches) {
        console.error(mismatch);
      }
      process.exitCode = 1;
      return;
    }
    console.log(`current-program pack bundle is in sync: ${result.source_part_ref_count} source part refs`);
    return;
  }

  const result = syncCurrentProgramLeafIndex();
  console.log(`synced current-program pack bundle: ${result.source_part_ref_count} source part refs`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runCli();
}
