type JsonRecord = Record<string, any>;
type NativePptRoute = 'author_pptx_native' | 'repair_pptx_native';

const QUALITY_NONREGRESSION_CONTRACT_REF = 'contracts/runtime-program/ppt-native-pptx-quality-nonregression.json';

const REQUIRED_NATIVE_QUALITY_METRIC_REFS = Object.freeze([
  'shape_manifest#/slides/*/metrics/bounds',
  'shape_manifest#/slides/*/metrics/text_char_count',
  'shape_manifest#/slides/*/metrics/primary_points',
  'shape_manifest#/slides/*/metrics/occupied_ratio',
  'shape_manifest#/slides/*/metrics/edge_clearance',
  'shape_manifest#/slides/*/metrics/overlap_pairs',
  'shape_manifest#/slides/*/metrics/shape_kind_count',
  'shape_manifest#/slides/*/metrics/role_count',
  'shape_manifest#/slides/*/metrics/layout_richness_score',
  'shape_manifest#/slides/*/metrics/chart_metrics',
  'shape_manifest#/slides/*/metrics/table_metrics',
  'shape_manifest#/slides/*/metrics/metric_grid_metrics',
  'shape_manifest#/slides/*/metrics/coordinate_determinism_hash',
  'shape_manifest#/slides/*/preview_screenshot_sha256',
  'shape_manifest#/slides/*/preview_screenshot_dimensions',
]);

const OFFICECLI_MATERIALIZER_POLICY = Object.freeze({
  policy_id: 'ppt_native_officecli_materializer_quality_gate_v1',
  adoption_status: 'qa_materializer_discipline_only',
  rca_main_workflow_owner: 'redcube_stage_review_export',
  skill_authoring_loop_adopted: false,
  materializer_role: 'executor_adapter_materializer_and_qa_gate',
  current_pptx_writer: 'redcube_drawingml_writer',
  officecli_writer_adapter_default_enabled: false,
  required_gate_refs: [
    'officecli_save_before_close',
    'officecli_validate',
    'officecli_view_issues',
    'officecli_view_text',
  ],
  save_before_close_required: true,
  validate_required: true,
  view_issues_required: true,
  view_text_required: true,
  true_render_proof_required_after_officecli_gate: true,
  true_render_proof_substitute_allowed: false,
  deterministic_cjk_font_family: 'Noto Sans CJK SC',
  default_visual_route_changed: false,
  default_executor_changed: false,
});

function safeText(value: unknown, fallback = ''): string {
  const text = String(value || '').trim();
  return text || fallback;
}

export function buildNativePptQualityNonregressionReadModel({
  route,
  editableShapePlanFile,
  shapeManifestFile,
  renderProof,
  repairEvidence,
}: {
  route: NativePptRoute;
  editableShapePlanFile: string;
  shapeManifestFile: string;
  renderProof: JsonRecord;
  repairEvidence: JsonRecord;
}): JsonRecord {
  return {
    surface_kind: 'ppt_native_pptx_quality_nonregression_read_model',
    owner: 'redcube_ai',
    consumer: 'opl_agent_lab',
    status: 'refs_only_standard_suite_input_ready',
    contract_ref: QUALITY_NONREGRESSION_CONTRACT_REF,
    route,
    refs_only: true,
    read_only: true,
    body_included: false,
    agent_lab_suite_input: {
      suite_kind: 'standard',
      suite_id: 'redcube-ai.ppt-native-pptx-quality-nonregression.standard.v1',
      domain_id: 'redcube-ai',
      input_mode: 'refs_only_handoff',
      refs_only: true,
      read_only: true,
      agent_lab_score_is_rca_visual_verdict: false,
      claims_visual_ready: false,
      claims_exportable: false,
      claims_handoffable: false,
      claims_production_soak_complete: false,
    },
    shape_manifest_ref: {
      file: shapeManifestFile,
      required_metric_refs: [...REQUIRED_NATIVE_QUALITY_METRIC_REFS],
      fail_closed_when_missing: true,
      source_surface_kind: 'native_pptx',
      quality_model: 'shape_manifest_layout_metrics_v1',
    },
    editable_shape_plan_ref: {
      file: editableShapePlanFile,
      contract_kind: 'redcube_ai_first_native_ppt_shape_plan',
      creative_owner: 'llm_agent',
      python_helper_role: 'execute_validate_export_only',
      helper_can_replace_ai_creative_owner: false,
      fail_closed_when_missing: true,
    },
    officecli_materializer_policy_ref: {
      policy_id: OFFICECLI_MATERIALIZER_POLICY.policy_id,
      contract_ref: `${QUALITY_NONREGRESSION_CONTRACT_REF}#/officecli_materializer_policy`,
      source_ref: 'native_ppt_bundle.officecli_materializer_policy',
      refs_only: true,
      fail_closed_when_missing_when_adapter_active: true,
    },
    officecli_quality_gate: {
      ...OFFICECLI_MATERIALIZER_POLICY,
      officecli_skill_can_replace_rca_workflow: false,
      officecli_validate_can_replace_true_render_proof: false,
    },
    true_render_proof_ref: {
      source_ref: 'native_ppt_bundle.render_proof',
      renderer_kind: safeText(renderProof.renderer_kind),
      renderer_pipeline: safeText(renderProof.renderer_pipeline),
      runtime: safeText(renderProof.runtime),
      fail_closed_when_missing: true,
      synthetic_preview_allowed: false,
    },
    repair_policy: {
      repair_route: 'repair_pptx_native',
      blocked_page_only: true,
      target_source: 'screenshot_review.blocked_slide_ids',
      repair_evidence_surface: 'native_ppt_repair_evidence_v1',
      repair_evidence_ref: 'native_ppt_repair_log.repair_evidence',
      non_blocking_slide_reuse_ok: repairEvidence.non_blocking_slide_reuse_ok === true,
    },
    export_proof_summary_ref: {
      summary_surface: 'native_export_bundle_operator_proof_summary_v1',
      source_ref: 'workspace-runtime-ref:export_pptx:<run-id>#/operator_proof_summary',
      renderer_proof_ref: 'workspace-runtime-ref:export_pptx:<run-id>#/renderer_proof',
      shape_manifest_summary_ref: 'workspace-runtime-ref:export_pptx:<run-id>#/shape_manifest_summary',
    },
    quality_gate_refs: [
      'agent/quality_gates/screenshot_review.md',
      'agent/quality_gates/review_export_memory.md',
      'officecli_save_before_close',
      'officecli_validate',
      'officecli_view_issues',
      'officecli_view_text',
      'workspace-runtime-ref:screenshot_review:<run-id>',
      'workspace-runtime-ref:export_pptx:<run-id>#/operator_proof_summary',
    ],
    authority_boundary: {
      no_forbidden_write: true,
      opl_agent_lab_can_store_suite_input_refs: true,
      opl_agent_lab_can_compare_quality_refs: true,
      opl_agent_lab_can_score_nonregression_refs: true,
      opl_agent_lab_score_is_rca_visual_verdict: false,
      opl_agent_lab_can_write_rca_visual_truth: false,
      opl_agent_lab_can_write_artifact_blob: false,
      opl_agent_lab_can_write_memory_body: false,
      opl_agent_lab_can_authorize_quality_verdict: false,
      opl_agent_lab_can_authorize_exportable: false,
      opl_agent_lab_can_claim_visual_ready: false,
      python_helper_can_replace_ai_creative_owner: false,
      python_helper_can_write_visual_truth: false,
      python_helper_can_authorize_quality_verdict: false,
      python_helper_can_authorize_exportable: false,
      officecli_skill_can_replace_rca_workflow: false,
      officecli_validate_can_replace_true_render_proof: false,
      officecli_authoring_loop_adopted: false,
      default_executor_changed: false,
      rca_quality_floor_owner: 'redcube_ai',
      rca_export_authority_owner: 'redcube_ai',
    },
  };
}
