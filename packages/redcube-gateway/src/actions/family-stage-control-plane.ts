// @ts-nocheck

const STAGES = [
  {
    stage_id: 'source_intake',
    stage_kind: 'intake',
    title: 'Source intake',
    goal: 'Freeze source truth, audience, constraints, and missing-material risk before visual planning.',
    domain_stage_refs: ['source_readiness', 'research', 'storyline'],
    allowed_action_refs: ['get_product_status', 'get_product_entry_manifest'],
    outputs: [
      { ref_kind: 'json_pointer', ref: '/source_readiness', role: 'source_truth' },
      { ref_kind: 'json_pointer', ref: '/progress_projection', role: 'progress_projection' },
    ],
  },
  {
    stage_id: 'communication_strategy',
    stage_kind: 'planning',
    title: 'Communication strategy',
    goal: 'Shape storyline, outline, audience fit, information density, and key takeaways.',
    domain_stage_refs: ['storyline', 'detailed_outline', 'slide_blueprint', 'single_note_plan', 'poster_blueprint'],
    allowed_action_refs: ['invoke_product_entry', 'get_product_entry_session'],
    outputs: [
      { ref_kind: 'json_pointer', ref: '/session_continuity', role: 'strategy_checkpoint' },
      { ref_kind: 'json_pointer', ref: '/progress_projection', role: 'stage_progress' },
    ],
  },
  {
    stage_id: 'visual_direction',
    stage_kind: 'planning',
    title: 'Visual direction',
    goal: 'Define layout density, image strategy, visual language, and feasibility before artifact creation.',
    domain_stage_refs: ['visual_direction'],
    allowed_action_refs: ['invoke_product_entry', 'get_product_entry_session'],
    outputs: [
      { ref_kind: 'json_pointer', ref: '/progress_projection', role: 'visual_direction_status' },
    ],
  },
  {
    stage_id: 'artifact_creation',
    stage_kind: 'creation',
    title: 'Artifact creation',
    goal: 'Create the visual deliverable through the selected RCA route while preserving source truth.',
    domain_stage_refs: ['author_image_pages', 'render_html', 'author_pptx_native'],
    allowed_action_refs: ['invoke_product_entry', 'run_image_ppt_proof', 'run_native_ppt_proof'],
    outputs: [
      { ref_kind: 'json_pointer', ref: '/artifact_inventory', role: 'artifact_inventory' },
    ],
  },
  {
    stage_id: 'review_and_revision',
    stage_kind: 'review',
    title: 'Review and revision',
    goal: 'Run visual, screenshot, source-fidelity, and repair gates before export.',
    domain_stage_refs: ['visual_director_review', 'screenshot_review', 'repair_image_pages', 'fix_html', 'repair_pptx_native'],
    allowed_action_refs: ['invoke_product_entry', 'get_product_entry_session'],
    outputs: [
      { ref_kind: 'json_pointer', ref: '/review_state', role: 'review_projection' },
      { ref_kind: 'json_pointer', ref: '/publication_projection', role: 'publication_projection' },
    ],
  },
  {
    stage_id: 'package_and_handoff',
    stage_kind: 'packaging',
    title: 'Package and handoff',
    goal: 'Export final files, preview metadata, resume handles, and operator handoff refs.',
    domain_stage_refs: ['export_pptx', 'publish_copy', 'export_bundle', 'export_poster'],
    allowed_action_refs: ['get_product_entry_session', 'get_product_entry_manifest', 'export_product_sidecar'],
    outputs: [
      { ref_kind: 'json_pointer', ref: '/artifact_inventory', role: 'final_artifacts' },
      { ref_kind: 'json_pointer', ref: '/session_continuity', role: 'resume_handle' },
    ],
  },
];

function stageDescriptor(stage) {
  return {
    ...stage,
    owner: 'redcube_ai',
    summary: `${stage.title} projected from RCA-owned route stages for OPL family discovery.`,
    inputs: [
      { ref_kind: 'json_pointer', ref: '/family_action_catalog', role: 'allowed_action_catalog' },
      { ref_kind: 'json_pointer', ref: '/progress_projection', role: 'progress_read_model' },
      { ref_kind: 'json_pointer', ref: '/session_continuity', role: 'resume_context' },
    ],
    skills: [
      { ref_kind: 'skill_id', ref: 'redcube-ai', role: 'domain_skill' },
      { ref_kind: 'skill_id', ref: 'imagegen', role: 'visual_generation' },
      { ref_kind: 'skill_id', ref: 'presentations', role: 'presentation_output' },
    ],
    prompt_refs: [
      { ref_kind: 'repo_path', ref: 'prompts/ppt_deck', role: 'ppt_prompt_pack' },
      { ref_kind: 'repo_path', ref: 'prompts/xiaohongshu', role: 'xiaohongshu_prompt_pack' },
    ],
    evaluation: [
      { ref_kind: 'json_pointer', ref: '/review_state', role: 'rca_review_state' },
      { ref_kind: 'json_pointer', ref: '/publication_projection', role: 'rca_publication_projection' },
    ],
    handoff: {
      next_owner: 'redcube_ai',
      resume_surface_ref: '/session_continuity',
      artifact_surface_ref: '/artifact_inventory',
    },
    authority_boundary: {
      domain_truth_owner: 'redcube_ai',
      visual_truth_owner: 'redcube_ai',
      artifact_authority_owner: 'redcube_ai',
      opl_role: 'projection_consumer_only',
      default_ppt_route_changed: false,
      managed_deliverable_runtime_changed: false,
    },
  };
}

export function buildRedCubeFamilyStageControlPlane() {
  return {
    surface_kind: 'family_stage_control_plane',
    version: 'family-stage-control-plane.v1',
    plane_id: 'redcube_ai_stage_control_plane',
    target_domain_id: 'redcube_ai',
    owner: 'redcube_ai',
    authority_boundary: {
      domain_truth_owner: 'redcube_ai',
      opl_role: 'projection_consumer_only',
      write_policy: 'no_visual_truth_writes',
      no_quality_verdict: true,
    },
    stages: STAGES.map(stageDescriptor),
    notes: [
      'Descriptor-only projection over existing RCA route stages.',
      'OPL discovery must not schedule routes, change default PPT route, or own visual/artifact authority.',
    ],
  };
}
