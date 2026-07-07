// @ts-nocheck
import {
  RCA_STAGE_OUTPUT_CANONICAL_ROLES,
  RCA_STAGE_OUTPUT_STAGE_EXPECTATIONS,
} from '@redcube/runtime-protocol';

const STAGES = [
  {
    stage_id: 'source_intake',
    title: 'Source intake',
    goal: 'Freeze source truth, audience, constraints, and missing-material risk before visual planning.',
    domain_stage_refs: ['source_readiness', 'research', 'storyline'],
    action_refs: ['get_product_status', 'get_product_entry_manifest'],
    skill_refs: ['agent/skills/visual_deliverable_authoring.md'],
    quality_gate_refs: ['agent/quality_gates/source_and_truth.md'],
    professional_skill_refs: [],
  },
  {
    stage_id: 'communication_strategy',
    title: 'Communication strategy',
    goal: 'Shape storyline, outline, audience fit, information density, and key takeaways.',
    domain_stage_refs: ['storyline', 'detailed_outline', 'slide_blueprint', 'single_note_plan', 'poster_blueprint'],
    action_refs: ['invoke_product_entry', 'get_product_entry_session'],
    skill_refs: ['agent/skills/visual_deliverable_authoring.md'],
    quality_gate_refs: ['agent/quality_gates/communication_and_direction.md'],
    professional_skill_refs: ['agent/professional_skills/rca-ppt-story-architect/SKILL.md'],
  },
  {
    stage_id: 'visual_direction',
    title: 'Visual direction',
    goal: 'Define layout density, image strategy, visual language, and feasibility before artifact creation.',
    domain_stage_refs: ['visual_direction'],
    action_refs: ['invoke_product_entry', 'get_product_entry_session'],
    skill_refs: ['agent/skills/visual_deliverable_authoring.md'],
    quality_gate_refs: ['agent/quality_gates/visual_pack_discipline.md'],
    professional_skill_refs: [
      'agent/professional_skills/rca-ppt-visual-director/SKILL.md',
      'agent/professional_skills/rca-template-profiler/SKILL.md',
    ],
  },
  {
    stage_id: 'artifact_creation',
    title: 'Artifact creation',
    goal: 'Create the visual deliverable through the selected RCA route while preserving source truth.',
    domain_stage_refs: ['author_image_pages', 'render_html', 'author_pptx_native'],
    action_refs: ['invoke_product_entry', 'run_image_ppt_proof', 'run_native_ppt_proof'],
    skill_refs: ['agent/skills/visual_deliverable_authoring.md', 'agent/skills/native_helper_policy.md'],
    quality_gate_refs: ['agent/quality_gates/artifact_authority.md'],
    professional_skill_refs: [
      'agent/professional_skills/rca-ppt-page-author/SKILL.md',
      'agent/professional_skills/rca-native-ppt-designer/SKILL.md',
      'agent/professional_skills/rca-template-profiler/SKILL.md',
    ],
  },
  {
    stage_id: 'review_and_revision',
    title: 'Review and revision',
    goal: 'Run visual, screenshot, source-fidelity, and repair gates before export.',
    domain_stage_refs: ['visual_director_review', 'screenshot_review', 'repair_image_pages', 'fix_html', 'repair_pptx_native'],
    action_refs: ['invoke_product_entry', 'get_product_entry_session'],
    skill_refs: ['agent/skills/visual_deliverable_authoring.md', 'agent/skills/visual_memory_policy.md'],
    quality_gate_refs: ['agent/quality_gates/review_export_memory.md'],
    professional_skill_refs: [
      'agent/professional_skills/rca-ppt-reviewer/SKILL.md',
      'agent/professional_skills/rca-ppt-visual-director/SKILL.md',
    ],
  },
  {
    stage_id: 'package_and_handoff',
    title: 'Package and handoff',
    goal: 'Export final files, preview metadata, resume handles, and operator handoff refs.',
    domain_stage_refs: ['export_pptx', 'publish_copy', 'export_bundle', 'export_poster'],
    action_refs: ['get_product_entry_session', 'get_product_entry_manifest', 'export_domain_handler'],
    skill_refs: ['agent/skills/native_helper_policy.md', 'agent/skills/visual_memory_policy.md'],
    quality_gate_refs: ['agent/quality_gates/package_distribution.md'],
    professional_skill_refs: ['agent/professional_skills/rca-ppt-reviewer/SKILL.md'],
  },
];

function buildFreshness(sourceRefs) {
  return {
    status: 'current',
    checked_at: 'manifest_build',
    source_ref_count: sourceRefs.length,
    stale_refs: [],
    missing_refs: [],
  };
}

function stageRef(stage, actionIds) {
  const missingActionRefs = stage.action_refs.filter((actionId) => !actionIds.has(actionId));
  return {
    ...stage,
    prompt_ref: `agent/prompts/${stage.stage_id}.md`,
    stage_ref: `agent/stages/${stage.stage_id}.md`,
    missing_action_refs: missingActionRefs,
    authority_boundary: {
      redcube_ai_owns_visual_truth: true,
      redcube_ai_owns_artifact_authority: true,
      redcube_ai_owns_review_export_verdict: stage.stage_id === 'review_and_revision',
      opl_can_write_visual_truth: false,
      opl_can_authorize_review_export_verdict: false,
      provider_completion_is_visual_ready: false,
      provider_completion_is_domain_ready: false,
    },
  };
}

export function buildRedCubeFamilyStageControlPlane({ familyActionCatalog = null } = {}) {
  const actionIds = new Set((familyActionCatalog?.actions ?? []).map((action) => action.action_id));
  const sourceRefs = [
    { ref_kind: 'repo_path', ref: 'agent/', role: 'declarative_visual_pack_root' },
    { ref_kind: 'contract', ref: 'contracts/artifact_locator_contract.json#/primary_artifact_truth', role: 'artifact_authority_contract' },
    { ref_kind: 'json_pointer', ref: '/family_action_catalog', role: 'domain_handler_target_refs' },
  ];
  const stages = STAGES.map((stage) => stageRef(stage, actionIds));
  const missingActionRefs = stages.flatMap((stage) => (
    stage.missing_action_refs.map((actionRef) => ({
      stage_id: stage.stage_id,
      action_ref: actionRef,
    }))
  ));

  return {
    surface_kind: 'rca_stage_control_refs',
    version: 'rca-stage-control-refs.v1',
    plane_id: 'redcube_ai_stage_control_plane',
    target_domain_id: 'redcube_ai',
    owner: 'redcube_ai',
    projection_mode: 'rca_refs_only_opl_generated_stage_control',
    generated_stage_control_owner: 'one-person-lab',
    source_refs: sourceRefs,
    freshness: buildFreshness(sourceRefs),
    stage_action_parity: {
      surface_kind: 'rca_stage_action_ref_parity',
      status: missingActionRefs.length === 0 ? 'aligned' : 'missing_action_refs',
      family_action_catalog_ref: '/family_action_catalog',
      missing_action_refs: missingActionRefs,
    },
    stage_output_role_interface: {
      surface_kind: 'rca_stage_output_role_interface_contract',
      version: 'stage-output-role-interface.v1',
      owner: 'redcube_ai',
      canonical_roles: RCA_STAGE_OUTPUT_CANONICAL_ROLES,
      interface_rule: 'stage_outputs_are_addressed_by_role_manifest_and_receipt_refs_not_filename',
      stage_role_expectations: RCA_STAGE_OUTPUT_STAGE_EXPECTATIONS,
    },
    stage_artifact_runtime: {
      surface_kind: 'rca_stage_artifact_authority_refs',
      contract_ref: 'contracts/artifact_locator_contract.json#/primary_artifact_truth',
      canonical_stages: STAGES.map((stage) => stage.stage_id),
      canonical_output_roles: RCA_STAGE_OUTPUT_CANONICAL_ROLES,
      stage_role_expectations: RCA_STAGE_OUTPUT_STAGE_EXPECTATIONS,
      interface_rule: 'role_plus_manifest_plus_receipt_ref_is_machine_interface_filename_is_mutable',
      completion_rule: 'required output roles plus valid manifest plus RCA owner receipt',
      blocked_rule: 'RCA typed blocker plus evidence',
      authority_boundary: {
        owner: 'redcube_ai',
        opl_role: 'stage_folder_contract_provider_index_rebuild_status_explain',
        opl_can_issue_owner_receipt: false,
        opl_can_write_visual_truth: false,
        opl_can_write_review_export_verdict: false,
        opl_can_write_domain_artifact_body: false,
        rca_owns_artifact_authority: true,
      },
    },
    authority_boundary: {
      domain_truth_owner: 'redcube_ai',
      opl_role: 'generated_or_hosted_stage_control_owner',
      write_policy: 'no_visual_truth_writes',
      no_quality_verdict: true,
      rca_owns_visual_truth: true,
      rca_owns_review_publication_projection: true,
      rca_owns_artifact_authority: true,
      opl_stage_attempt_owner: 'one-person-lab',
      opl_can_generate_stage_control_from_refs: true,
      opl_can_schedule_stage: true,
      opl_can_schedule_stage_attempt: true,
      opl_can_write_visual_truth: false,
      opl_can_write_review_truth: false,
      opl_can_write_publication_projection: false,
      provider_completion_is_visual_ready: false,
      provider_completion_is_domain_ready: false,
    },
    stages,
    notes: [
      'RCA keeps declarative visual stage refs only; OPL owns generated/hosted generic stage-control surfaces.',
      'OPL provider may schedule stage attempts from generated surfaces; it must not own RCA visual/artifact/review authority.',
    ],
  };
}

export function buildRedCubeFamilyStageControlPlaneContract(input = {}) {
  return buildRedCubeFamilyStageControlPlane(input);
}
