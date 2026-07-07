import { buildGovernanceSurfaceContract } from './contracts.js';

export type SurfaceContract = Record<string, any>;
export type SurfaceArtifactContent = (contract: SurfaceContract) => unknown;
export type SurfaceValidator = (content: SurfaceContract) => boolean;

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
