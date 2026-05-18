// @ts-nocheck
export const DEFAULT_RUNTIME_OWNER = 'configured_family_runtime_provider';
export const HOSTED_RUNTIME_OWNER = 'configured_family_runtime_provider';
export const OPL_PROVIDER_RUNTIME_OWNER = HOSTED_RUNTIME_OWNER;
export const PRODUCT_MANIFEST_COMMAND = 'redcube product manifest';
export const PRODUCT_STATUS_COMMAND = 'redcube product status';
export const PRODUCT_START_COMMAND = 'redcube product start';
export const PRODUCT_INVOKE_COMMAND = 'redcube product invoke';
export const OPL_HOSTED_HANDOFF_REF = 'opl_framework:hosted_product_entry';
export const PRODUCT_SESSION_COMMAND = 'redcube product session';
export const PRODUCT_ENTRY_CONTRACT_REF = 'contracts/runtime-program/redcube-product-entry-mvp.json';
export const OPL_HOSTED_PRODUCT_ENTRY_CONTRACT_REF = 'contracts/runtime-program/opl-framework-hosted-product-entry.json';
export const SESSION_CONTINUITY_PROVENANCE_CONTRACT_REF = 'contracts/runtime-program/managed-product-entry-hardening.json';
export const SERVICE_SAFE_DOMAIN_ENTRY_CONTRACT_REF = 'contracts/runtime-program/service-safe-domain-entry-adapter.json';

export const ROUTE_EQUIVALENCE_SHARED_TRUTH_SURFACES = [
  'domain_entry_surface',
  'session_continuity',
  'progress_projection',
  'artifact_inventory',
  'runtime_loop_closure',
  'review_state',
  'publication_projection',
];

export const DELIVERABLE_FACADE_TRUTH_SURFACES = [
  'createDeliverable',
  'buildOplStageExecutionPlan',
  'runDeliverableRoute',
  'auditDeliverable',
  'runtimeWatch',
  'getReviewState',
  'getPublicationProjection',
];

export const LONG_TASK_STAGE_POLICY = {
  surface_kind: 'recoverable_long_task_stage_policy',
  default_deliverable_family: 'ppt_deck',
  trigger_intents: ['large_ppt_deck', 'long_presentation_task', 'multi_source_visual_deliverable'],
  anti_pattern: 'single_huge_prompt_generation',
  recommended_flow: [
    {
      stage_id: 'source_material_intake',
      title: 'Source/material intake',
      surface_kind: 'product_status',
      command: PRODUCT_STATUS_COMMAND,
      resumable_via: PRODUCT_SESSION_COMMAND,
      output_contract: 'source_package_and_missing_materials',
    },
    {
      stage_id: 'plan',
      title: 'Plan',
      surface_kind: 'product_entry',
      command: PRODUCT_INVOKE_COMMAND,
      resumable_via: PRODUCT_SESSION_COMMAND,
      output_contract: 'storyline_outline_and_slide_blueprint',
    },
    {
      stage_id: 'deliverable',
      title: 'Deliverable',
      surface_kind: 'product_entry',
      command: PRODUCT_INVOKE_COMMAND,
      resumable_via: PRODUCT_SESSION_COMMAND,
      output_contract: 'rendered_ppt_deck_artifacts',
    },
    {
      stage_id: 'review',
      title: 'Review',
      surface_kind: 'product_entry_session',
      command: PRODUCT_SESSION_COMMAND,
      resumable_via: PRODUCT_SESSION_COMMAND,
      output_contract: 'review_state_and_rerun_point',
    },
  ],
  required_continuity_surfaces: [
    'entry_session',
    'session_continuity',
    'progress_projection',
    'artifact_inventory',
    'review_state',
  ],
  operator_rule: (
    'For long PPT tasks, do not compress the whole request into one prompt. '
    + 'Start from product-entry overview/source intake, create or reuse an entry_session_id, checkpoint each stage, '
    + 'and resume through product session before moving to the next stage. '
    + 'When no stop_after_stage is requested, product invoke continues autonomously to terminal export unless a runtime review gate blocks it.'
  ),
};
