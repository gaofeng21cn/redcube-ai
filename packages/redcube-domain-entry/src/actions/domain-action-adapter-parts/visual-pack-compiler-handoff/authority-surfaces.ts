// @ts-nocheck

export const RCA_MINIMAL_AUTHORITY_FUNCTIONS = Object.freeze([
  'source_readiness_verdict',
  'communication_visual_direction_decision',
  'review_export_verdict',
  'artifact_mutation_authorization',
  'visual_memory_accept_reject',
  'owner_receipt_signer',
  'native_helper_implementation',
]);

export const RCA_AI_FIRST_JUDGMENT_SURFACES = Object.freeze([
  'source_readiness_verdict',
  'communication_visual_direction_decision',
  'review_export_verdict',
  'visual_memory_accept_reject',
]);

export const RCA_PROGRAMMATIC_AUTHORITY_SURFACES = Object.freeze([
  'artifact_mutation_authorization',
  'owner_receipt_signer',
  'native_helper_implementation',
]);

const AUTHORITY_SURFACE_PROFILES = Object.freeze({
  source_readiness_verdict: {
    work_mode: 'ai_first_visual_judgment_surface',
    judgment_owner: 'ai_first_source_readiness_stage_artifact',
    programmatic_role: 'source_pack_ref_validator_and_typed_blocker',
    ai_stage_artifact_required: true,
    allowed_return_shapes: ['verdict_refs', 'typed_blocker', 'owner_receipt_refs'],
  },
  communication_visual_direction_decision: {
    work_mode: 'ai_first_visual_judgment_surface',
    judgment_owner: 'ai_authored_communication_strategy_or_visual_direction_stage_artifact',
    programmatic_role: 'visual_direction_ref_materializer',
    ai_stage_artifact_required: true,
    allowed_return_shapes: ['visual_direction_refs', 'typed_blocker', 'owner_receipt_refs'],
  },
  review_export_verdict: {
    work_mode: 'ai_first_visual_judgment_surface',
    judgment_owner: 'ai_first_visual_review_or_export_gate_artifact',
    programmatic_role: 'review_export_ref_validator_and_receipt_guard',
    ai_stage_artifact_required: true,
    allowed_return_shapes: ['verdict_refs', 'typed_blocker', 'owner_receipt_refs'],
  },
  artifact_mutation_authorization: {
    work_mode: 'programmatic_authority_guard_surface',
    judgment_owner: 'rca_owner_receipt_blocked_item_and_repair_target',
    programmatic_role: 'artifact_mutation_materializer_and_guard',
    ai_stage_artifact_required: false,
    allowed_return_shapes: ['artifact_refs', 'typed_blocker', 'owner_receipt_refs'],
  },
  visual_memory_accept_reject: {
    work_mode: 'ai_first_visual_judgment_surface',
    judgment_owner: 'ai_first_visual_memory_learning_stage_artifact',
    programmatic_role: 'memory_receipt_writer_and_locator_projection',
    ai_stage_artifact_required: true,
    allowed_return_shapes: ['memory_receipt_refs', 'typed_blocker', 'owner_receipt_refs'],
  },
  owner_receipt_signer: {
    work_mode: 'programmatic_authority_guard_surface',
    judgment_owner: 'rca_owner_receipt_schema_and_domain_provenance',
    programmatic_role: 'receipt_schema_signer_and_blocker_guard',
    ai_stage_artifact_required: false,
    allowed_return_shapes: ['owner_receipt_refs', 'typed_blocker', 'no_regression_evidence_refs'],
  },
  native_helper_implementation: {
    work_mode: 'programmatic_authority_guard_surface',
    judgment_owner: 'rca_native_helper_catalog_and_owner_receipt_policy',
    programmatic_role: 'native_ppt_image_export_helper_implementation',
    ai_stage_artifact_required: false,
    allowed_return_shapes: ['helper_proof_refs', 'artifact_refs', 'typed_blocker'],
  },
});

export function buildRcaMinimalAuthoritySurfaceTaxonomy() {
  return {
    surface_kind: 'rca_minimal_authority_surface_taxonomy',
    taxonomy_id: 'rca.minimal_authority_surface_taxonomy.v1',
    owner: 'redcube_ai',
    ai_first_judgment_surface_ids: [...RCA_AI_FIRST_JUDGMENT_SURFACES],
    programmatic_authority_surface_ids: [...RCA_PROGRAMMATIC_AUTHORITY_SURFACES],
    all_surface_ids: [...RCA_MINIMAL_AUTHORITY_FUNCTIONS],
    mechanical_decision_forbidden_for_all_surfaces: true,
    programmatic_verdict_generation_allowed: false,
    policy: 'visual/source/review/memory judgments require AI-first stage artifacts; programmatic surfaces guard owner receipts and refs only',
  };
}

export function buildRcaMinimalAuthoritySurfaceContracts() {
  return RCA_MINIMAL_AUTHORITY_FUNCTIONS.map((surfaceId) => {
    const profile = AUTHORITY_SURFACE_PROFILES[surfaceId];
    return {
      surface_kind: 'rca_minimal_authority_surface',
      authority_surface_id: surfaceId,
      owner: 'redcube_ai',
      retention_class: 'rca_minimal_authority_function',
      generated_by_opl: false,
      opl_generated_wrapper_allowed: true,
      work_mode: profile.work_mode,
      judgment_owner: profile.judgment_owner,
      programmatic_role: profile.programmatic_role,
      ai_stage_artifact_required: profile.ai_stage_artifact_required,
      stage_or_owner_receipt_evidence_required: true,
      mechanical_decision_forbidden: true,
      programmatic_verdict_generation_allowed: false,
      allowed_return_shapes: [...profile.allowed_return_shapes],
      output_boundary: {
        allowed_return_shapes: [...profile.allowed_return_shapes],
        forbidden_outputs: [
          'visual_truth_write',
          'artifact_blob_write_without_owner_receipt',
          'memory_body_write',
          'mechanical_ready_verdict',
          'programmatic_ready_verdict',
          'ai_free_visual_verdict',
          'schema_completeness_ready_verdict',
          'generic_lifecycle_completion_verdict',
        ],
      },
      forbidden_decision_sources: [
        'schema_completeness',
        'provider_completion',
        'generic_lifecycle_completion',
        'artifact_file_presence',
        'mechanical_screenshot_metrics_alone',
        'controller_route_state',
        'runtime_queue_state',
      ],
      decision_boundary: {
        ai_first_judgment_required: profile.ai_stage_artifact_required,
        programmatic_role_may_materialize_refs_only: true,
        programmatic_role_may_compute_ready_verdict: false,
        owner_receipt_or_typed_blocker_required_when_evidence_missing: true,
      },
    };
  });
}
