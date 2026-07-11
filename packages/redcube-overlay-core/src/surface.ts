import {
  buildGovernanceSurfaceContract,
  validateGovernanceSurfaceContract,
} from './contracts.js';

export type SurfaceContract = Record<string, any>;
export type SurfaceArtifactContent = (contract: SurfaceContract) => unknown;
export type SurfaceValidator = (content: SurfaceContract) => boolean;
export interface SurfaceRequirement {
  path: string;
  equals?: unknown;
  includes?: unknown;
  nonEmptyString?: boolean;
  nonEmptyArray?: boolean;
  array?: boolean;
  object?: boolean;
  boolean?: boolean;
  truthy?: boolean;
}

export interface SurfaceArtifactSpec {
  relativePath: string;
  content: SurfaceArtifactContent;
}

export function buildSurfaceArtifactSpecs({
  includeLifecycleStageContract = false,
  stageRequirements = (contract: SurfaceContract) => contract.stage_requirements,
}: {
  includeLifecycleStageContract?: boolean;
  stageRequirements?: SurfaceArtifactContent;
} = {}): SurfaceArtifactSpec[] {
  const lifecycleStageContractSpecs: SurfaceArtifactSpec[] = includeLifecycleStageContract
    ? [{ relativePath: 'contracts/lifecycle-stage-contract.json', content: (contract: SurfaceContract) => contract.lifecycle_stage_contract }]
    : [];

  return [
    { relativePath: 'contracts/stage-sequence.json', content: (contract) => contract.stage_sequence },
    { relativePath: 'contracts/stage-requirements.json', content: stageRequirements },
    ...lifecycleStageContractSpecs,
    { relativePath: 'contracts/prompt-pack.json', content: (contract) => contract.prompt_pack },
    { relativePath: 'contracts/review-surface.json', content: (contract) => contract.review_surface },
    { relativePath: 'contracts/layout-rules.json', content: (contract) => contract.layout_rules },
    { relativePath: 'contracts/baseline-policy.json', content: (contract) => contract.baseline_policy },
    { relativePath: 'contracts/export-bundle.json', content: (contract) => contract.export_bundle },
    { relativePath: 'contracts/delivery-contract.json', content: (contract) => contract.delivery_contract },
    { relativePath: 'contracts/governance-surface.json', content: buildGovernanceSurfaceContract },
    { relativePath: 'contracts/hydrated-deliverable.json', content: (contract) => contract },
    { relativePath: 'views/display-registry.json', content: (contract) => contract.display_registry },
  ];
}

export function buildSurfaceBundle(contract: SurfaceContract, specs: SurfaceArtifactSpec[]) {
  return specs.map((spec) => ({
    relativePath: spec.relativePath,
    content: spec.content(contract),
  }));
}

export function listSurfaceArtifactPaths(specs: SurfaceArtifactSpec[]) {
  return specs.map((spec) => spec.relativePath);
}

function valueAtPath(content: SurfaceContract, path: string): unknown {
  return path.split('.').reduce((current: unknown, key) => (
    current && typeof current === 'object' ? (current as SurfaceContract)[key] : undefined
  ), content);
}

export function validateSurfaceRequirements(
  content: SurfaceContract,
  requirements: SurfaceRequirement[],
): boolean {
  return requirements.every((requirement) => {
    const value = valueAtPath(content, requirement.path);
    if ('equals' in requirement && value !== requirement.equals) return false;
    if ('includes' in requirement && (!Array.isArray(value) || !value.includes(requirement.includes))) return false;
    if (requirement.nonEmptyString && (typeof value !== 'string' || value.length === 0)) return false;
    if (requirement.nonEmptyArray && (!Array.isArray(value) || value.length === 0)) return false;
    if (requirement.array && !Array.isArray(value)) return false;
    if (requirement.object && (!value || typeof value !== 'object' || Array.isArray(value))) return false;
    if (requirement.boolean && typeof value !== 'boolean') return false;
    if (requirement.truthy && !value) return false;
    return true;
  });
}

export function validateSurfaceArtifact({
  family,
  validators,
  relativePath,
  content,
}: {
  family: string;
  validators: Record<string, SurfaceValidator>;
  relativePath: string;
  content: unknown;
}): boolean {
  const validator = validators[relativePath];
  if (!validator) {
    throw new Error(`Unknown ${family} surface artifact: ${relativePath}`);
  }
  return Boolean(validator(content as SurfaceContract));
}

export function validateBaselinePolicySurface(content: SurfaceContract): boolean {
  return content?.modes?.draft_new?.baseline_required === false
    && content?.modes?.optimize_existing?.baseline_required === true;
}

export function validateDeliveryContractSurface(
  content: SurfaceContract,
  {
    requiredExportRoute,
    requiredExportBundleId,
    projectionModel,
    humanGateRequired,
  }: {
    requiredExportRoute: string;
    requiredExportBundleId?: string;
    projectionModel: 'direct_delivery' | 'human_publication';
    humanGateRequired: boolean;
  },
): boolean {
  const baseValid = content?.authoritative_projection_surface === 'getPublicationProjection'
    && content?.authoritative_review_surface === 'getReviewState'
    && content?.required_export_route === requiredExportRoute
    && typeof content?.required_export_bundle_id === 'string'
    && content.required_export_bundle_id.length > 0
    && (!requiredExportBundleId || content.required_export_bundle_id === requiredExportBundleId)
    && content?.projection_model === projectionModel
    && content?.human_gate?.required === humanGateRequired;

  if (!baseValid || humanGateRequired) {
    return baseValid;
  }

  return content?.operator_handoff?.owner_surface === 'required_export_artifact.delivery_state'
    && content?.operator_handoff?.handoff_ready_state === 'output_ready'
    && Array.isArray(content?.operator_handoff?.gate_surfaces)
    && content.operator_handoff.gate_surfaces.includes('auditDeliverable')
    && content.operator_handoff.gate_surfaces.includes('getReviewState')
    && content.operator_handoff.reopen_mutation_surface === 'request_changes'
    && content.operator_handoff.closeout_mutation_surface === 'promote_baseline';
}

export function validateGovernanceSurfaceArtifact(
  content: SurfaceContract,
  {
    overlay,
    familyKind,
  }: {
    overlay: string;
    familyKind: string;
  },
): boolean {
  return validateGovernanceSurfaceContract(content)
    && content?.family_boundary?.family_kind === familyKind
    && content?.family_boundary?.overlay === overlay;
}

export function validateHydratedDeliverableSurface(
  content: SurfaceContract,
  {
    overlay,
    requiredExportRoute,
  }: {
    overlay?: string;
    requiredExportRoute: string;
  },
): boolean {
  return (!overlay || content?.overlay === overlay)
    && content?.source_truth_contract?.authoritative_surface === 'shared_source_truth'
    && content?.source_truth_contract?.route_gate_rule === 'authoritative_fail_closed_in_audit_and_review_state'
    && content?.delivery_contract?.required_export_route === requiredExportRoute;
}

export function validateDisplayRegistrySurface(
  content: SurfaceContract,
  surfaceIds: string[],
): boolean {
  return Array.isArray(content?.surfaces)
    && surfaceIds.every((surfaceId) =>
      content.surfaces.some((surface: SurfaceContract) => surface?.id === surfaceId),
    );
}
