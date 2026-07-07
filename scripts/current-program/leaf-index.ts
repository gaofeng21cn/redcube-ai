import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export const AGGREGATE_SNAPSHOT_REF = 'contracts/runtime-program/current-program.json';
export const INDEX_REF = 'contracts/runtime-program/current-program.index.json';
export const PARTS_ROOT = 'contracts/runtime-program/current-program-parts';
export const MAX_LEAF_JSON_LINE_COUNT = 1000;
export const WRITE_COMMAND = 'npm run contracts:current-program:write';
export const CHECK_COMMAND = 'npm run contracts:current-program:check';

export const FALSE_AUTHORITY_FLAGS = Object.freeze({
  aggregate_snapshot_is_canonical_source: false,
  aggregate_snapshot_is_edit_surface: false,
  aggregate_snapshot_is_check_input: false,
  source_refs_are_generated_from_aggregate: false,
  docs_are_machine_truth: false,
  manifest_can_claim_domain_ready: false,
  manifest_can_authorize_quality_or_export: false,
});

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
    ref_root: `${PARTS_ROOT}/product_release_metadata.json`,
    ref_kind: 'single_leaf_ref',
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

export type SourcePartRef = {
  json_pointer: string;
  ref: string;
  role: string;
  line_count: number;
  sha256?: string;
};

export function stable(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

export function sha256(content: string): string {
  return crypto.createHash('sha256').update(content).digest('hex');
}

function lineCount(value: unknown): number {
  return stable(value).split('\n').length - 1;
}

export function readJson(file: string): any {
  return JSON.parse(fs.readFileSync(path.resolve(file), 'utf-8'));
}

export function pointerSegment(segment: string): string {
  return segment.replace(/~/g, '~0').replace(/\//g, '~1');
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

function leafRole(pointer: string): string {
  return pointer.startsWith('/current_state') ? 'active_current_truth_leaf_source' : 'current_program_leaf_source';
}

export function listJsonFiles(root: string): string[] {
  if (!fs.existsSync(path.resolve(root))) return [];
  return fs.readdirSync(path.resolve(root), { withFileTypes: true }).flatMap((entry) => {
    const absolute = path.resolve(root, entry.name);
    const relative = path.relative(process.cwd(), absolute).split(path.sep).join('/');
    if (entry.isDirectory()) return listJsonFiles(relative);
    return entry.isFile() && entry.name.endsWith('.json') ? [relative] : [];
  });
}

export function childSegmentMap(sourcePartRefs: Array<{ json_pointer: string }>): Map<string, Set<string>> {
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

function orderedSourcePartRefs(sourcePartRefs: SourcePartRef[]): SourcePartRef[] {
  const orderBySection = new Map(SECTION_ROOTS.map((section, index) => [section.aggregate_json_pointer, index]));
  const sectionFor = (pointer: string) => SECTION_ROOTS.find((section) => (
    pointer === section.aggregate_json_pointer || pointer.startsWith(`${section.aggregate_json_pointer}/`)
  ));
  const order = (pointer: string) => orderBySection.get(sectionFor(pointer)?.aggregate_json_pointer ?? '') ?? Number.MAX_SAFE_INTEGER;

  return [...sourcePartRefs].sort((left, right) => (
    order(left.json_pointer) - order(right.json_pointer)
      || left.json_pointer.localeCompare(right.json_pointer)
  ));
}

export function generatedArrayFields(sourcePartRefs: Array<{ json_pointer: string }>): string[] {
  const children = childSegmentMap(sourcePartRefs);
  return [...children.entries()]
    .filter(([, childSegments]) => childSegments.size > 0 && [...childSegments].every((segment) => /^\d+$/.test(segment)))
    .map(([pointer]) => pointer || '')
    .sort((left, right) => left.localeCompare(right));
}

export function sourcePartRefsFromFiles(): SourcePartRef[] {
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

export function buildCurrentProgramSourceIndexFromParts() {
  const sourcePartRefs = sourcePartRefsFromFiles();
  return {
    surface_kind: 'rca_current_program_source_index',
    schema_version: 4,
    program_id: readJson(`${PARTS_ROOT}/program_id.json`),
    date_anchor: readJson(`${PARTS_ROOT}/date_anchor.json`),
    source_root_ref: PARTS_ROOT,
    canonical_truth_model: 'current_program_parts_are_canonical_sources',
    no_second_truth_rule: 'contracts:current-program:check validates current-program-parts and this index only; current-program.json is a legacy consumer projection, not a canonical or required check input',
    generated_aggregate_snapshot: {
      ref: AGGREGATE_SNAPSHOT_REF,
      role: 'legacy_read_through_projection_for_existing_consumers',
      canonical_source: false,
      edit_surface: false,
      check_input: false,
    },
    split_policy: {
      max_part_json_line_count: MAX_LEAF_JSON_LINE_COUNT,
      large_objects_and_arrays_are_split_recursively: true,
      aggregate_snapshot_is_not_canonical_edit_surface: true,
      aggregate_snapshot_is_not_required_check_input: true,
    },
    section_roots: SECTION_ROOTS.map((section) => ({
      section_id: section.section_id,
      aggregate_json_pointer: section.aggregate_json_pointer,
      source_root_ref: section.ref_root,
      source_kind: section.ref_kind === 'single_leaf_ref' ? 'single_source_part' : 'source_part_directory',
      role: section.role,
    })),
    generated_array_fields: generatedArrayFields(sourcePartRefs),
    source_digest: sha256(stable(sourcePartRefs.map((sourcePart) => ({
      json_pointer: sourcePart.json_pointer,
      ref: sourcePart.ref,
      sha256: sourcePart.sha256,
    })))),
    source_part_refs: sourcePartRefs,
    leaf_refs: sourcePartRefs,
    source_ref_count: sourcePartRefs.length,
    commands: {
      write: WRITE_COMMAND,
      check: CHECK_COMMAND,
    },
    false_authority_flags: FALSE_AUTHORITY_FLAGS,
    not_claims: [
      'domain_ready',
      'production_ready',
      'visual_ready',
      'quality_or_export_verdict',
      'owner_receipt',
      'typed_blocker',
      'artifact_authority',
    ],
  };
}
