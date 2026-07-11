// @ts-nocheck
import {
  buildControlledMemoryApplyProof,
} from './domain-authority-refs-parts/memory-apply-proof.js';
import {
  buildDomainOwnerReceiptContract,
  buildLifecycleGuardedApplyProof,
  buildNoRegressionOwnerReceiptOplConsumptionProof,
  buildVisualTransitionAdapterProfileRegistry,
  buildVisualTransitionSpec,
} from './domain-authority-refs-parts/functional-closure.js';
import {
  buildDomainMemoryDescriptorLocator,
  buildFamilyDomainMemoryDescriptor,
} from './domain-authority-refs-parts/domain-memory-descriptors.js';
import {
  buildArtifactLocatorContract,
  buildControlledSoakNoRegressionAttempt,
  buildControlledVisualStageAttemptFixture,
  buildDomainActionAdapterReceiptRefs,
} from './domain-authority-refs-parts/runtime-descriptors.js';

export {
  buildFamilyDomainMemoryDescriptor,
};

export function buildRedCubeDomainAuthorityRefs({
  workspaceRoot,
  runtime,
} = {}) {
  const artifactLocatorContract = buildArtifactLocatorContract({
    workspaceRoot,
    productSessionSurfaceRef: runtime?.product_session_surface_ref,
  });
  const receiptRefs = buildDomainActionAdapterReceiptRefs();
  const controlledAttemptFixture = buildControlledVisualStageAttemptFixture();
  const controlledMemoryApplyProof = buildControlledMemoryApplyProof();
  const controlledSoakNoRegressionAttempt = buildControlledSoakNoRegressionAttempt();
  const domainOwnerReceiptContract = buildDomainOwnerReceiptContract();
  const noRegressionOwnerReceiptOplConsumptionProof = buildNoRegressionOwnerReceiptOplConsumptionProof();
  const lifecycleGuardedApplyProof = buildLifecycleGuardedApplyProof();
  const visualTransitionSpec = buildVisualTransitionSpec();
  const visualTransitionAdapterProfileRegistry = buildVisualTransitionAdapterProfileRegistry();
  const domainMemoryDescriptorLocator = buildDomainMemoryDescriptorLocator();
  return {
    surface_kind: 'rca_domain_authority_refs',
    version: 'v1',
    owner: 'redcube_ai',
    projection_model: 'explicit_domain_authority_refs_only',
    generated_standard_skeleton_owner: 'one-person-lab',
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
    visual_transition_adapter_profile_registry: visualTransitionAdapterProfileRegistry,
    source_refs: {
      artifact_locator_contract_ref: '/artifact_locator_contract',
      domain_memory_descriptor_locator_ref: '/domain_memory_descriptor_locator',
      domain_action_adapter_receipt_refs_ref: '/domain_action_adapter_receipt_refs',
      controlled_visual_stage_attempt_ref: '/controlled_visual_stage_attempt',
      controlled_memory_apply_proof_ref: '/controlled_memory_apply_proof',
      controlled_soak_no_regression_attempt_ref: '/controlled_soak_no_regression_attempt',
      domain_owner_receipt_contract_ref: '/domain_owner_receipt_contract',
      no_regression_owner_receipt_opl_consumption_proof_ref: '/no_regression_owner_receipt_opl_consumption_proof',
      lifecycle_guarded_apply_proof_ref: '/lifecycle_guarded_apply_proof',
      visual_transition_spec_ref: '/visual_transition_spec',
      visual_transition_adapter_profile_registry_ref: '/visual_transition_adapter_profile_registry',
    },
  };
}
