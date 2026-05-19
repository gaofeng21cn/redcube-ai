// @ts-nocheck
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { isDeepStrictEqual } from 'node:util';

const AGGREGATE_SNAPSHOT_REF = 'contracts/runtime-program/current-program.json';
const INDEX_REF = 'contracts/runtime-program/current-program.index.json';
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

function expectedPartFiles(currentProgram: unknown, index: unknown): Map<string, string> {
  return new Map(index.leaf_refs.map((leaf) => [
    leaf.ref,
    stable(valueAtJsonPointer(currentProgram, leaf.json_pointer)),
  ]));
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
  const currentProgram = readJson(AGGREGATE_SNAPSHOT_REF);
  const expectedIndex = buildCurrentProgramLeafIndex(currentProgram);
  const mismatches: string[] = [];

  compareFile(INDEX_REF, stable(expectedIndex), mismatches);

  const expectedParts = expectedPartFiles(currentProgram, expectedIndex);
  for (const [relativePath, expected] of expectedParts) {
    compareFile(relativePath, expected, mismatches);
  }

  const expectedPartPaths = new Set(expectedParts.keys());
  for (const existingPartPath of listJsonFiles(PARTS_ROOT)) {
    if (!expectedPartPaths.has(existingPartPath)) {
      mismatches.push(`extra ${existingPartPath}`);
    }
  }

  const index = readJson(INDEX_REF);
  for (const leaf of index.leaf_refs) {
    assert.deepEqual(
      readJson(leaf.ref),
      valueAtJsonPointer(currentProgram, leaf.json_pointer),
      leaf.ref,
    );
  }

  return {
    ok: mismatches.length === 0,
    mismatches,
    leaf_ref_count: expectedIndex.leaf_refs.length,
  };
}

function writeFile(relativePath: string, content: string) {
  const absolutePath = path.resolve(relativePath);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, content);
}

export function syncCurrentProgramLeafIndex() {
  const currentProgram = readJson(AGGREGATE_SNAPSHOT_REF);
  const index = buildCurrentProgramLeafIndex(currentProgram);
  const parts = expectedPartFiles(currentProgram, index);
  const expectedPartPaths = new Set(parts.keys());

  writeFile(INDEX_REF, stable(index));
  for (const [relativePath, content] of parts) {
    writeFile(relativePath, content);
  }
  for (const existingPartPath of listJsonFiles(PARTS_ROOT)) {
    if (!expectedPartPaths.has(existingPartPath)) {
      fs.rmSync(path.resolve(existingPartPath));
    }
  }

  return {
    leaf_ref_count: index.leaf_refs.length,
  };
}

function assertGeneratedIndexMatchesSnapshot() {
  const currentProgram = readJson(AGGREGATE_SNAPSHOT_REF);
  const generated = buildCurrentProgramLeafIndex(currentProgram);
  const tracked = readJson(INDEX_REF);
  assert.equal(isDeepStrictEqual(tracked, generated), true);
}

function runCli() {
  const args = new Set(process.argv.slice(2));
  if (args.has('--check')) {
    assertGeneratedIndexMatchesSnapshot();
    const result = checkCurrentProgramLeafIndex();
    if (!result.ok) {
      for (const mismatch of result.mismatches) {
        console.error(mismatch);
      }
      process.exitCode = 1;
      return;
    }
    console.log(`current-program leaf index is in sync: ${result.leaf_ref_count} leaf refs`);
    return;
  }

  const result = syncCurrentProgramLeafIndex();
  console.log(`synced current-program leaf index: ${result.leaf_ref_count} leaf refs`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runCli();
}
