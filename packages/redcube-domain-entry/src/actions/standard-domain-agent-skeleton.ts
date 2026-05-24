// @ts-nocheck
import {
  buildControlledMemoryApplyProof,
  buildRuntimeResidueRetirementAudit,
  buildSkeletonRepoSourceLayoutAudit,
  buildVisualPatternMemoryWritebackProjection,
} from './standard-domain-agent-skeleton-parts/memory-apply-proof.js';
import {
  buildDomainOwnerReceiptContract,
  buildLifecycleGuardedApplyProof,
  buildNoRegressionOwnerReceiptOplConsumptionProof,
  buildPhysicalSkeletonFollowThrough,
  buildReviewHelperBaselineFollowThrough,
  buildVisualTransitionSpec,
} from './standard-domain-agent-skeleton-parts/functional-closure.js';
import {
  DOMAIN_ID,
  DOMAIN_OWNER,
  REPO_SOURCE_BOUNDARIES,
  SKELETON_ID,
} from './standard-domain-agent-skeleton-parts/skeleton-constants.js';
import {
  buildDomainMemoryDescriptorLocator,
  buildFamilyDomainMemoryDescriptor,
} from './standard-domain-agent-skeleton-parts/domain-memory-descriptors.js';
import {
  buildArtifactLocatorContract,
  buildControlledSoakNoRegressionAttempt,
  buildControlledVisualStageAttemptFixture,
  buildDomainActionAdapterReceiptRefs,
} from './standard-domain-agent-skeleton-parts/runtime-descriptors.js';

export {
  buildDomainOwnerReceiptContract,
  buildLifecycleGuardedApplyProof,
  buildNoRegressionOwnerReceiptOplConsumptionProof,
  buildPhysicalSkeletonFollowThrough,
  buildReviewHelperBaselineFollowThrough,
  buildVisualTransitionSpec,
  buildRuntimeResidueRetirementAudit,
  buildVisualPatternMemoryWritebackProjection,
  buildArtifactLocatorContract,
  buildControlledVisualStageAttemptFixture,
  buildDomainActionAdapterReceiptRefs,
  buildDomainMemoryDescriptorLocator,
  buildFamilyDomainMemoryDescriptor,
};

export function buildStandardDomainAgentSkeleton({
  workspaceRoot,
  runtime,
  productEntrySessionCommand,
  familyStageControlPlaneRef = '/family_stage_control_plane',
  domainActionAdapterRef = '/product_entry_shell/domain_action_adapter',
  lifecycleAdapterRef = '/opl_family_lifecycle_adapter',
} = {}) {
  const artifactLocatorContract = buildArtifactLocatorContract({
    workspaceRoot,
    runtimeStateRoot: runtime?.runtime_state_root,
    sessionContinuityRoot: runtime?.session_continuity_root,
  });
  const receiptRefs = buildDomainActionAdapterReceiptRefs();
  const controlledAttemptFixture = buildControlledVisualStageAttemptFixture();
  const controlledMemoryApplyProof = buildControlledMemoryApplyProof();
  const controlledSoakNoRegressionAttempt = buildControlledSoakNoRegressionAttempt();
  const domainOwnerReceiptContract = buildDomainOwnerReceiptContract();
  const noRegressionOwnerReceiptOplConsumptionProof = buildNoRegressionOwnerReceiptOplConsumptionProof();
  const lifecycleGuardedApplyProof = buildLifecycleGuardedApplyProof();
  const visualTransitionSpec = buildVisualTransitionSpec();
  const physicalSkeletonFollowThrough = buildPhysicalSkeletonFollowThrough();
  const reviewHelperBaselineFollowThrough = buildReviewHelperBaselineFollowThrough();
  const domainMemoryDescriptorLocator = buildDomainMemoryDescriptorLocator();
  return {
    surface_kind: 'standard_domain_agent_skeleton',
    skeleton_id: SKELETON_ID,
    version: 'v1',
    domain_id: DOMAIN_ID,
    owner: DOMAIN_OWNER,
    mapping_model: 'physical_skeleton_repo_source_layout_with_manifest_projection',
    repo_source_boundary: {
      allowed_roots: REPO_SOURCE_BOUNDARIES,
      physical_relayout_required_now: false,
      repo_tracks_runtime_artifact_blobs: false,
      repo_tracks_receipt_instances: false,
      audit_surface: buildSkeletonRepoSourceLayoutAudit({
        repoSourceBoundaries: REPO_SOURCE_BOUNDARIES,
      }),
    },
    runtime_declarations: {
      declares_only: [
        'domain_action_adapter_adapter',
        'projection_builder',
        'lifecycle_adapter',
        'visual_transition_spec',
        'visual_transition_evaluator',
        'domain_memory_descriptor_locator',
        'domain_owner_receipt_contract',
        'lifecycle_guarded_apply_proof',
      ],
      domain_action_adapter_adapter_ref: domainActionAdapterRef,
      projection_builder_ref: familyStageControlPlaneRef,
      lifecycle_adapter_ref: lifecycleAdapterRef,
      visual_transition_spec_ref: '/visual_transition_spec',
      visual_transition_evaluator_ref: '/visual_transition_evaluator',
      domain_memory_descriptor_locator_ref: '/domain_memory_descriptor_locator',
      session_command_template: productEntrySessionCommand || 'redcube product session --entry-session-id <entry-session-id>',
      runtime_owner: runtime?.runtime_owner || 'configured_family_runtime_provider',
      executor_owner: 'configured_by_opl_runtime_provider',
      creates_visual_artifacts_in_repo: false,
    },
    artifact_locator_contract: artifactLocatorContract,
    domain_memory_descriptor_locator: domainMemoryDescriptorLocator,
    domain_action_adapter_receipt_refs: receiptRefs,
    controlled_visual_stage_attempt: controlledAttemptFixture,
    controlled_memory_apply_proof: controlledMemoryApplyProof,
    controlled_soak_no_regression_attempt: controlledSoakNoRegressionAttempt,
    domain_owner_receipt_contract: domainOwnerReceiptContract,
    no_regression_owner_receipt_opl_consumption_proof: noRegressionOwnerReceiptOplConsumptionProof,
    lifecycle_guarded_apply_proof: lifecycleGuardedApplyProof,
    visual_transition_spec: visualTransitionSpec,
    physical_skeleton_follow_through: physicalSkeletonFollowThrough,
    review_helper_baseline_follow_through: reviewHelperBaselineFollowThrough,
    opl_consumption_boundary: {
      consumes: [
        'stage_descriptor',
        'artifact_locator_descriptor',
        'artifact_refs',
        'domain_memory_locator_refs',
        'domain_memory_writeback_receipt_refs',
        'receipt_refs',
        'runtime_attempt_projection',
      ],
      does_not_consume_or_hold: [
        'visual_pattern_memory_content',
        'visual_export_verdict',
        'review_verdict',
        'publication_projection_truth',
        'canonical_artifact_content',
      ],
      domain_action_adapter_dispatch_policy: 'guarded_rca_owned_actions_only',
    },
    source_refs: [
      { ref_kind: 'json_pointer', ref: familyStageControlPlaneRef, role: 'projection_builder' },
      { ref_kind: 'json_pointer', ref: domainActionAdapterRef, role: 'domain_action_adapter_adapter' },
      { ref_kind: 'json_pointer', ref: lifecycleAdapterRef, role: 'lifecycle_adapter' },
      { ref_kind: 'json_pointer', ref: '/artifact_inventory', role: 'artifact_refs' },
      { ref_kind: 'json_pointer', ref: '/domain_memory_descriptor_locator', role: 'domain_memory_locator_refs' },
      { ref_kind: 'json_pointer', ref: '/review_state', role: 'review_projection_ref' },
      { ref_kind: 'json_pointer', ref: '/publication_projection', role: 'publication_projection_ref' },
    ],
  };
}
