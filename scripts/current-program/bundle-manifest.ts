import {
  AGGREGATE_SNAPSHOT_REF,
  ASSEMBLY_REF,
  CHECK_COMMAND,
  FALSE_AUTHORITY_FLAGS,
  INDEX_REF,
  MANIFEST_REF,
  MAX_LEAF_JSON_LINE_COUNT,
  PARTS_ROOT,
  WRITE_COMMAND,
  generatedArrayFields,
  sha256,
  sourcePartRefsFromFiles,
  stable,
} from './leaf-index.ts';
import type { SourcePartRef } from './leaf-index.ts';

export function buildCurrentProgramAssembly(sourcePartRefs = sourcePartRefsFromFiles()) {
  return {
    surface_kind: 'rca_current_program_pack_bundle_assembly',
    schema_version: 1,
    bundle_id: 'redcube-ai.current-program',
    owner: 'RedCube AI',
    state: 'active_source_bundle',
    source_root_ref: PARTS_ROOT,
    aggregate_ref: AGGREGATE_SNAPSHOT_REF,
    index_ref: INDEX_REF,
    manifest_ref: MANIFEST_REF,
    generated_array_fields: generatedArrayFields(sourcePartRefs),
    commands: {
      write: WRITE_COMMAND,
      check: CHECK_COMMAND,
    },
    generated_aggregate_role: 'generated_read_through_snapshot_for_existing_consumers',
    canonical_truth_model: 'source_parts_are_canonical_current_program_sources',
    source_part_contract: {
      part_ref_path_rule: 'source_root_ref plus JSON pointer path segments; array indexes are zero-padded to four digits',
      max_part_json_line_count: MAX_LEAF_JSON_LINE_COUNT,
      aggregate_must_be_rebuilt_from_parts: true,
      duplicate_entity_policy: 'repeat canonical projection refs, not full machine snapshot bodies',
    },
    canonical_projection_contract: {
      projection_mode: 'canonical_ref_only_no_body_copy',
      body_copy_in_current_program: false,
      allowed_targets: [
        'contracts/runtime-program/opl-family-contract-adoption.json',
        'contracts/functional_privatization_audit.json',
        'contracts/pack_compiler_input.json',
        'contracts/generated_surface_handoff.json',
        'contracts/action_catalog.json',
      ],
    },
    false_authority_flags: FALSE_AUTHORITY_FLAGS,
  };
}

export function buildCurrentProgramPackBundleManifestForSourceIndex(sourceIndex: any) {
  return {
    surface_kind: 'rca_current_program_pack_bundle_manifest',
    schema_version: 1,
    bundle_id: 'redcube-ai.current-program',
    owner: 'RedCube AI',
    state: 'active_generated_bundle_metadata',
    program_id: sourceIndex.program_id,
    date_anchor: sourceIndex.date_anchor,
    assembly_ref: ASSEMBLY_REF,
    index_ref: INDEX_REF,
    source_root_ref: PARTS_ROOT,
    source_ref_count: sourceIndex.source_part_refs.length,
    source_digest: sha256(stable(sourceIndex.source_part_refs.map((sourcePart: SourcePartRef) => ({
      json_pointer: sourcePart.json_pointer,
      ref: sourcePart.ref,
      sha256: sourcePart.sha256,
    })))),
    aggregate: {
      ref: AGGREGATE_SNAPSHOT_REF,
      role: 'generated_read_through_snapshot_for_existing_consumers',
      do_not_edit: true,
      write_command: WRITE_COMMAND,
      check_command: CHECK_COMMAND,
    },
    canonical_projection_contract: {
      projection_mode: 'canonical_ref_only_no_body_copy',
      body_copy_in_current_program: false,
      duplicate_entity_policy: 'current-program may repeat refs to canonical contracts but must not repeat the same large object body across paths',
    },
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
