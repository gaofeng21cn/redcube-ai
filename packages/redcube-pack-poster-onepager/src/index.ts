import {
  buildPosterBlueprint as buildPosterBlueprintJs,
  buildPosterRenderArtifact as buildPosterRenderArtifactJs,
  buildPosterVisualDirection as buildPosterVisualDirectionJs,
} from './index.js';
import { compilePosterRenderSlides as compilePosterRenderSlidesJs } from './render-compiler.js';

import type {
  CompilePosterRenderSlidesInput,
  PosterBlueprintArtifact,
  PosterBlueprintDependencies,
  PosterBuildRenderArtifactInput,
  PosterHydratedContract,
  PosterRenderArtifact,
  PosterRenderArtifactDependencies,
  PosterRenderSlide,
  PosterStorylineArtifact,
  PosterVisualDirectionArtifact,
  PosterVisualDirectionDependencies,
} from './types.js';

export function buildPosterBlueprint(
  contract: PosterHydratedContract,
  storylineArtifact: PosterStorylineArtifact | null,
  deps: PosterBlueprintDependencies,
): PosterBlueprintArtifact {
  return buildPosterBlueprintJs(
    contract,
    storylineArtifact,
    deps as Parameters<typeof buildPosterBlueprintJs>[2],
  ) as PosterBlueprintArtifact;
}

export function buildPosterVisualDirection(
  contract: PosterHydratedContract,
  blueprintArtifact: PosterBlueprintArtifact,
  mode: PosterVisualDirectionArtifact['mode'],
  baselineDeliverableId: string,
  deps: PosterVisualDirectionDependencies,
): PosterVisualDirectionArtifact {
  return buildPosterVisualDirectionJs(
    contract,
    blueprintArtifact,
    mode,
    baselineDeliverableId,
    deps as Parameters<typeof buildPosterVisualDirectionJs>[4],
  ) as PosterVisualDirectionArtifact;
}

export async function buildPosterRenderArtifact(
  input: PosterBuildRenderArtifactInput,
  deps: PosterRenderArtifactDependencies,
): Promise<PosterRenderArtifact> {
  return buildPosterRenderArtifactJs(
    input as Parameters<typeof buildPosterRenderArtifactJs>[0],
    deps as Parameters<typeof buildPosterRenderArtifactJs>[1],
  ) as Promise<PosterRenderArtifact>;
}

export function compilePosterRenderSlides(input: CompilePosterRenderSlidesInput): PosterRenderSlide[] {
  return compilePosterRenderSlidesJs(input as Parameters<typeof compilePosterRenderSlidesJs>[0]) as unknown as PosterRenderSlide[];
}

export type {
  CompilePosterRenderSlidesInput,
  PosterBlueprintArtifact,
  PosterBlueprintDependencies,
  PosterBlueprintPanel,
  PosterBlueprintSlide,
  PosterBuildRenderArtifactInput,
  PosterCanvasContract,
  PosterDeliverablePaths,
  PosterHydratedContract,
  PosterLayoutFamily,
  PosterMigrationMode,
  PosterProfileId,
  PosterRecipeId,
  PosterRenderArtifact,
  PosterRenderArtifactDependencies,
  PosterRenderContract,
  PosterRenderSlide,
  PosterSourceReference,
  PosterStageRoute,
  PosterStorylineArtifact,
  PosterVisualDirectionArtifact,
  PosterVisualDirectionDependencies,
} from './types.js';
